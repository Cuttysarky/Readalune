'use strict';
/**
 * Local, file-based storage for the library. Everything lives inside the
 * operating system's per-user application-data folder. Nothing leaves the
 * computer.
 *
 * Layout:
 *   <userData>/library/index.json              book metadata
 *   <userData>/library/books/<id>/content.json  extracted, formatted text
 *   <userData>/library/books/<id>/state.json    position, highlights, bookmarks
 *   <userData>/library/books/<id>/cover.jpg     optional cover image
 *   <userData>/library/settings.json            reading preferences
 *   <userData>/library/stats.json               reading time statistics
 *   <userData>/library/words.json               word journal
 *   <userData>/library/window.json              window size/position
 */

const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

let root = null;
let index = null; // { version, books: { [id]: meta } }
let windowState = {};
let deviceId = '';
const writeChains = new Map(); // file -> Promise (serialises writes per file)
const pending = new Set();

const ID_RE = /^[a-z0-9-]{8,64}$/;

function dataDir() {
  return root;
}

async function init(userDataPath) {
  root = path.join(userDataPath, 'library');
  await fs.mkdir(path.join(root, 'books'), { recursive: true });
  await removeStaleTemps(root);
  index = await readJsonFile(path.join(root, 'index.json'), null);
  if (!index || typeof index !== 'object' || typeof index.books !== 'object' || index.books === null) {
    index = { version: 1, books: {} };
  }
  // Drop entries whose content has vanished (e.g. folder edited by hand).
  for (const id of Object.keys(index.books)) {
    if (!ID_RE.test(id) || !fsSync.existsSync(path.join(root, 'books', id, 'content.json'))) {
      delete index.books[id];
    }
  }
  windowState = (await readJsonFile(path.join(root, 'window.json'), {})) || {};

  // A random id for this installation (recorded with reading progress).
  const device = await readJsonFile(path.join(root, 'device.json'), null);
  deviceId = device && typeof device.id === 'string' && /^[a-f0-9]{16}$/.test(device.id) ? device.id : crypto.randomBytes(8).toString('hex');
  if (!device || device.id !== deviceId) await writeFileAtomic(path.join(root, 'device.json'), JSON.stringify({ id: deviceId }));

  await migrate();
}

/** Delete half-written temp files left behind if the app was stopped in the middle of a save. */
async function removeStaleTemps(dir, depth = 0) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isFile() && /\.[a-f0-9]{12}\.tmp$/.test(e.name)) await fs.rm(p, { force: true }).catch(() => {});
    else if (e.isDirectory() && depth < 2) await removeStaleTemps(p, depth + 1);
  }
}

/** Bring older library files up to the current data model. */
async function migrate() {
  let collections = (await readJsonFile(path.join(root, 'collections.json'), [])) || [];
  if (!Array.isArray(collections)) collections = [];
  let changedIndex = false;
  let changedCollections = false;
  for (const meta of Object.values(index.books)) {
    if (!meta.status) {
      meta.status = meta.finished ? 'finished' : meta.progress > 0 ? 'reading' : 'unread';
      changedIndex = true;
    }
    if (Array.isArray(meta.collections)) {
      meta.collectionIds = meta.collections.map((name) => {
        let c = collections.find((x) => x.name === name);
        if (!c) {
          c = { id: newId(), name, sortOrder: collections.length };
          collections.push(c);
          changedCollections = true;
        }
        return c.id;
      });
      delete meta.collections;
      changedIndex = true;
    }
    for (const [key, value] of Object.entries(META_DEFAULTS)) {
      if (meta[key] === undefined) {
        meta[key] = Array.isArray(value) ? [] : value;
        changedIndex = true;
      }
    }
    delete meta.finished;
  }
  if (changedCollections) await writeFileAtomic(path.join(root, 'collections.json'), JSON.stringify(collections));
  if (changedIndex) await saveIndex();
}

const META_DEFAULTS = { hash: '', series: '', seriesIndex: null, publisher: '', description: '', status: 'unread', rating: 0, tags: [], collectionIds: [], hasSource: false };

function getDeviceId() {
  return deviceId;
}

async function readJsonFile(file, fallback) {
  try {
    const text = await fs.readFile(file, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      // Keep a copy of an unreadable file instead of silently overwriting it.
      try {
        await fs.copyFile(file, `${file}.corrupt-${Date.now()}`);
      } catch {
        /* ignore */
      }
    }
    return fallback;
  }
}

/** Atomic write: write a temp file then rename it over the target. Writes to one file are serialised. */
function writeFileAtomic(file, data) {
  const prev = writeChains.get(file) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`;
      await fs.writeFile(tmp, data);
      await fs.rename(tmp, file);
    });
  writeChains.set(file, next);
  pending.add(next);
  next.finally(() => {
    pending.delete(next);
    if (writeChains.get(file) === next) writeChains.delete(file);
  });
  return next;
}

async function flush() {
  await Promise.allSettled([...pending]);
}

function bookDir(id) {
  if (!ID_RE.test(id)) throw new Error('Invalid book id');
  return path.join(root, 'books', id);
}

function saveIndex() {
  return writeFileAtomic(path.join(root, 'index.json'), JSON.stringify(index));
}

function newId() {
  return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;
}

/* ---------------------------------------------------------------- books */

function listBooks() {
  return Object.values(index.books);
}

async function addBook(payload) {
  const id = newId();
  const dir = bookDir(id);
  await fs.mkdir(dir, { recursive: true });
  const now = Date.now();
  const meta = {
    id,
    title: payload.meta.title,
    author: payload.meta.author,
    language: payload.meta.language,
    format: payload.meta.format,
    sourceName: payload.meta.sourceName,
    totalChars: payload.meta.totalChars,
    wordCount: payload.meta.wordCount,
    fingerprint: payload.meta.fingerprint,
    hash: payload.meta.hash,
    series: payload.meta.series,
    seriesIndex: payload.meta.seriesIndex,
    publisher: payload.meta.publisher,
    description: payload.meta.description,
    addedAt: now,
    lastOpenedAt: 0,
    progress: 0,
    status: 'unread',
    rating: 0,
    tags: [],
    collectionIds: [],
    readingSeconds: 0,
    hasCover: false,
    hasSource: false,
    coverHue: payload.meta.coverHue,
    coverMotif: payload.meta.coverMotif,
  };
  if (payload.source) {
    await writeFileAtomic(path.join(dir, 'source.bin'), payload.source);
    meta.hasSource = true;
  }
  await writeFileAtomic(path.join(dir, 'content.json'), JSON.stringify(payload.content));
  if (payload.cover) {
    await writeFileAtomic(path.join(dir, 'cover.jpg'), payload.cover);
    meta.hasCover = true;
  }
  index.books[id] = meta;
  await saveIndex();
  return meta;
}

/** The original file (kept for comics and original-layout PDFs). */
async function readSource(id) {
  if (!index.books[id] || !index.books[id].hasSource) return null;
  const buf = await fs.readFile(path.join(bookDir(id), 'source.bin'));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function readContent(id) {
  return readJsonFile(path.join(bookDir(id), 'content.json'), null);
}

async function readState(id) {
  return readJsonFile(path.join(bookDir(id), 'state.json'), {});
}

async function writeState(id, state) {
  if (!index.books[id]) throw new Error('Unknown book');
  await writeFileAtomic(path.join(bookDir(id), 'state.json'), JSON.stringify(state));
  return true;
}

async function updateMeta(id, patch) {
  const meta = index.books[id];
  if (!meta) throw new Error('Unknown book');
  Object.assign(meta, patch);
  if (patch.progress > 0 && meta.status === 'unread' && patch.status === undefined) meta.status = 'reading';
  await saveIndex();
  return meta;
}

async function removeBook(id) {
  if (!index.books[id]) return false;
  delete index.books[id];
  await saveIndex();
  await fs.rm(bookDir(id), { recursive: true, force: true });
  return true;
}

async function readCover(id) {
  if (!ID_RE.test(id) || !index.books[id] || !index.books[id].hasCover) return null;
  try {
    return await fs.readFile(path.join(bookDir(id), 'cover.jpg'));
  } catch {
    return null;
  }
}

/* -------------------------------------------------------- generic json */

const JSON_FILES = new Set(['settings', 'stats', 'words', 'collections']);

async function readJson(name, fallback) {
  if (!JSON_FILES.has(name)) throw new Error('Unknown store');
  return readJsonFile(path.join(root, `${name}.json`), fallback);
}

async function writeJson(name, value) {
  if (!JSON_FILES.has(name)) throw new Error('Unknown store');
  await writeFileAtomic(path.join(root, `${name}.json`), JSON.stringify(value));
  return true;
}

/* ------------------------------------------------------------- window */

function getWindowBounds() {
  const b = windowState || {};
  const ok = (n) => Number.isFinite(n) && Math.abs(n) < 100000;
  return {
    width: ok(b.width) && b.width >= 720 ? b.width : undefined,
    height: ok(b.height) && b.height >= 540 ? b.height : undefined,
    x: ok(b.x) ? b.x : undefined,
    y: ok(b.y) ? b.y : undefined,
    maximized: b.maximized === true,
  };
}

function setWindowBounds(bounds) {
  windowState = bounds;
  if (root) writeFileAtomic(path.join(root, 'window.json'), JSON.stringify(bounds)).catch(() => {});
}

/* ------------------------------------------------------------- backup */

/** Every file in the library folder, as [relative path, absolute path]. */
async function libraryFiles() {
  const out = [];
  const walk = async (dir, rel) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.name.endsWith('.tmp') || entry.name.includes('.corrupt-')) continue;
      const abs = path.join(dir, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(abs, r);
      else if (entry.isFile() && entry.name !== 'window.json' && entry.name !== 'device.json') out.push([r, abs]);
    }
  };
  await flush();
  await walk(root, '');
  return out;
}

/**
 * Merge a backup into the library. `files` maps relative paths to Buffers that
 * were already validated by the caller. Books already present are kept.
 */
async function importBackup(files, { replaceSettings }) {
  const read = (name) => {
    try {
      return files.has(name) ? JSON.parse(files.get(name).toString('utf8')) : null;
    } catch {
      return null;
    }
  };
  const backupIndex = read('index.json');
  if (!backupIndex || typeof backupIndex.books !== 'object') throw new Error('This file is not a Readalune backup.');
  const fingerprints = new Set(Object.values(index.books).map((b) => b.fingerprint).filter(Boolean));
  let added = 0;
  let skipped = 0;
  for (const [oldId, meta] of Object.entries(backupIndex.books)) {
    if (!ID_RE.test(oldId) || !files.has(`books/${oldId}/content.json`)) continue;
    if (index.books[oldId] || (meta.fingerprint && fingerprints.has(meta.fingerprint))) {
      skipped++;
      continue;
    }
    const dir = bookDir(oldId);
    await fs.mkdir(dir, { recursive: true });
    for (const name of ['content.json', 'state.json', 'cover.jpg', 'source.bin']) {
      const key = `books/${oldId}/${name}`;
      if (files.has(key)) await writeFileAtomic(path.join(dir, name), files.get(key));
    }
    index.books[oldId] = { ...META_DEFAULTS, ...meta, id: oldId, hasCover: files.has(`books/${oldId}/cover.jpg`), hasSource: files.has(`books/${oldId}/source.bin`) };
    added++;
  }
  const mergeList = async (name, key) => {
    const incoming = read(`${name}.json`);
    if (!Array.isArray(incoming)) return;
    const current = (await readJsonFile(path.join(root, `${name}.json`), [])) || [];
    const seen = new Set(current.map((x) => x[key]));
    await writeJson(name, [...current, ...incoming.filter((x) => x && !seen.has(x[key]))]);
  };
  await mergeList('collections', 'id');
  await mergeList('words', 'id');
  if (replaceSettings) {
    const settings = read('settings.json');
    if (settings && typeof settings === 'object') await writeJson('settings', settings);
    const stats = read('stats.json');
    if (stats && typeof stats === 'object') await writeJson('stats', stats);
  }
  await saveIndex();
  await migrate();
  return { added, skipped };
}

module.exports = {
  init,
  getDeviceId,
  readSource,
  libraryFiles,
  importBackup,
  dataDir,
  flush,
  listBooks,
  addBook,
  readContent,
  readState,
  writeState,
  updateMeta,
  removeBook,
  readCover,
  readJson,
  writeJson,
  getWindowBounds,
  setWindowBounds,
};
