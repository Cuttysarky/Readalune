'use strict';
/**
 * Folder import and folder watching (main process).
 * The user picks folders with the system dialog; Readalune scans them for
 * supported book files and, for watched folders, keeps an eye on them while
 * the app runs. Only regular files with supported extensions and a sane size
 * are ever read. Paths are never sent to the page, only file names and bytes.
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const EXT = new Set(['.txt', '.text', '.md', '.markdown', '.html', '.htm', '.xhtml', '.epub', '.pdf', '.cbz', '.cbr']);
const MAX_BYTES = 300 * 1024 * 1024;
const MAX_FILES = 1000;
const MAX_DEPTH = 4;

let stateFile = null;
let state = { folders: [] }; // [{ path, known: { relPath: mtimeMs } }]
const watchers = new Map();
let sendFile = () => {};

async function scan(dir) {
  const out = [];
  const walk = async (d, depth) => {
    if (depth > MAX_DEPTH || out.length >= MAX_FILES) return;
    let entries;
    try {
      entries = await fsp.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(d, e.name);
      if (e.isDirectory()) await walk(abs, depth + 1);
      else if (e.isFile() && EXT.has(path.extname(e.name).toLowerCase())) out.push(abs);
      if (out.length >= MAX_FILES) return;
    }
  };
  await walk(dir, 0);
  return out;
}

async function readBook(abs) {
  const stat = await fsp.stat(abs);
  if (!stat.isFile() || stat.size === 0 || stat.size > MAX_BYTES) return null;
  const buf = await fsp.readFile(abs);
  return { name: path.basename(abs), size: stat.size, mtime: stat.mtimeMs, bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
}

async function save() {
  if (!stateFile) return;
  await fsp.writeFile(stateFile, JSON.stringify(state));
}

/** Read every supported file in a folder (used for a one-off import). */
async function importFolder(dir) {
  const files = [];
  for (const abs of await scan(dir)) {
    try {
      const f = await readBook(abs);
      if (f) files.push({ name: f.name, size: f.size, bytes: f.bytes });
    } catch {
      files.push({ name: path.basename(abs), error: 'Could not read the file.' });
    }
  }
  return files;
}

/** Send files in a watched folder that are new or changed since last time. */
async function sync(folder) {
  const known = folder.known || (folder.known = {});
  let changed = false;
  for (const abs of await scan(folder.path)) {
    const rel = path.relative(folder.path, abs);
    try {
      const stat = await fsp.stat(abs);
      if (known[rel] === stat.mtimeMs) continue;
      // Wait until the file stops growing (still being copied?).
      await new Promise((r) => setTimeout(r, 800));
      const again = await fsp.stat(abs);
      if (again.size !== stat.size) continue;
      const f = await readBook(abs);
      known[rel] = stat.mtimeMs;
      changed = true;
      if (f) sendFile({ name: f.name, size: f.size, bytes: f.bytes });
    } catch {
      /* ignore files that vanish or cannot be read */
    }
  }
  const keys = Object.keys(known);
  if (keys.length > 5000) for (const k of keys.slice(0, keys.length - 5000)) delete known[k];
  if (changed) await save();
}

function startWatching(folder) {
  if (watchers.has(folder.path)) return;
  let timer = null;
  try {
    const w = fs.watch(folder.path, { recursive: true, persistent: false }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => sync(folder).catch(() => {}), 1500);
    });
    w.on('error', () => {});
    watchers.set(folder.path, w);
  } catch {
    /* folder unavailable (e.g. unplugged drive); retried on next start */
  }
}

async function init(libraryDir, onFile) {
  stateFile = path.join(libraryDir, 'watch.json');
  sendFile = onFile;
  try {
    const raw = JSON.parse(await fsp.readFile(stateFile, 'utf8'));
    if (raw && Array.isArray(raw.folders)) state.folders = raw.folders.filter((f) => f && typeof f.path === 'string' && path.isAbsolute(f.path)).slice(0, 20);
  } catch {
    state = { folders: [] };
  }
}

/** Called once the window is ready to receive files. */
function resume() {
  for (const f of state.folders) {
    startWatching(f);
    sync(f).catch(() => {});
  }
}

async function watch(dir) {
  if (state.folders.some((f) => f.path === dir)) return;
  const folder = { path: dir, known: {} };
  // Files already there are imported by the caller; remember them as known.
  for (const abs of await scan(dir)) {
    try {
      folder.known[path.relative(dir, abs)] = (await fsp.stat(abs)).mtimeMs;
    } catch {
      /* ignore */
    }
  }
  state.folders.push(folder);
  await save();
  startWatching(folder);
}

async function unwatch(index) {
  const f = state.folders[index];
  if (!f) return;
  watchers.get(f.path)?.close();
  watchers.delete(f.path);
  state.folders.splice(index, 1);
  await save();
}

function list() {
  return state.folders.map((f) => ({ name: path.basename(f.path) || f.path, path: f.path }));
}

function stopAll() {
  for (const w of watchers.values()) w.close();
  watchers.clear();
}

module.exports = { init, resume, importFolder, watch, unwatch, list, stopAll };
