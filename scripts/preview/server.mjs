// Browser preview of Readalune: try the interface in a web browser without
// building the desktop app. It serves the real interface from src/renderer and
// answers the calls the desktop app would normally handle, using the app's own
// library store and validation code. Development tool only: it is not shipped
// in the app, and it listens on this computer only (127.0.0.1).
//
//   npm run preview                      opens http://localhost:4310/
//   npm run preview -- --port 5000 --no-open --data <folder>
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const argv = process.argv.slice(2);
const option = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const PORT = Number(option('--port')) || 4310;
// The preview keeps its own library, separate from the desktop app's.
const dataDir = option('--data') || path.join(os.tmpdir(), 'readalune-browser-preview');
const require = createRequire(path.join(root, 'package.json'));
const store = require(path.join(root, 'src/main/store.js'));
const v = require(path.join(root, 'src/main/validate.js'));
const { createResolver } = require(path.join(root, 'src/main/paths.js'));
const { writeZip, readZip } = require(path.join(root, 'src/main/zip.js'));
const pkg = require(path.join(root, 'package.json'));

const resolve = createResolver(path.join(root, 'src/renderer'), path.join(root, 'node_modules/pdfjs-dist'));
const BACKUP_ALLOW = /^(index|collections|settings|stats|words)\.json$|^books\/[a-z0-9-]{8,64}\/(content\.json|state\.json|cover\.jpg|source\.bin)$/;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.bcmap': 'application/octet-stream',
  '.gz': 'application/gzip',
};
const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

/* Bytes travel as { __bytes: base64, ab: true|false } inside JSON. */
function encode(x) {
  if (Buffer.isBuffer(x) || x instanceof Uint8Array) return { __bytes: Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64'), ab: false };
  if (x instanceof ArrayBuffer) return { __bytes: Buffer.from(x).toString('base64'), ab: true };
  if (Array.isArray(x)) return x.map(encode);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, val]) => [k, encode(val)]));
  return x;
}
function decode(x) {
  if (Array.isArray(x)) return x.map(decode);
  if (x && typeof x === 'object') {
    if (typeof x.__bytes === 'string') {
      const buf = Buffer.from(x.__bytes, 'base64');
      const u8 = new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      return x.ab ? u8.buffer : u8;
    }
    return Object.fromEntries(Object.entries(x).map(([k, val]) => [k, decode(val)]));
  }
  return x;
}

const api = {
  'app:info': () => ({ version: pkg.version, platform: 'browser preview', electron: '-', chrome: '-', dataDir, deviceId: store.getDeviceId(), testHandle: process.env.READALUNE_PREVIEW_TEST === '1' }),
  'library:list': () => store.listBooks(),
  'library:add': (payload) => store.addBook(v.bookPayload(payload)),
  'library:content': (id) => store.readContent(v.bookId(id)),
  'library:state': (id) => store.readState(v.bookId(id)),
  'library:save-state': (id, state) => store.writeState(v.bookId(id), v.bookState(state)),
  'library:update-meta': (id, patch) => store.updateMeta(v.bookId(id), v.metaPatch(patch)),
  'library:remove': (id) => store.removeBook(v.bookId(id)),
  'library:source': (id) => store.readSource(v.bookId(id)),
  'collections:get': async () => (await store.readJson('collections', [])) || [],
  'collections:set': (list) => store.writeJson('collections', v.collections(list)),
  'settings:get': () => store.readJson('settings', {}),
  'settings:set': (s) => store.writeJson('settings', v.plainObject(s, 64 * 1024)),
  'stats:get': () => store.readJson('stats', {}),
  'stats:set': (s) => store.writeJson('stats', v.plainObject(s, 2 * 1024 * 1024)),
  'words:get': () => store.readJson('words', []),
  'words:set': (w) => store.writeJson('words', v.plainArray(w, 4 * 1024 * 1024)),
  'backup:export': async () => {
    const files = await store.libraryFiles();
    const tmp = path.join(os.tmpdir(), `readalune-preview-backup-${Date.now()}.zip`);
    await writeZip(tmp, files);
    const bytes = await fs.readFile(tmp);
    await fs.rm(tmp, { force: true });
    return { files: files.length, bytes: bytes.length, zip: new Uint8Array(bytes) };
  },
  'backup:import': (zipBytes, opts) => {
    const files = readZip(Buffer.from(zipBytes), { allow: BACKUP_ALLOW });
    return store.importBackup(files, { replaceSettings: Boolean(opts && opts.replaceSettings === true) });
  },
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readBody(req, limit = 400 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new Error('Request too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname.startsWith('/__api/')) {
      const fn = api[decodeURIComponent(url.pathname.slice(7))];
      if (!fn) return send(res, 404, JSON.stringify({ error: 'Unknown call' }), MIME['.json']);
      try {
        const args = decode(JSON.parse(await readBody(req)));
        const value = await fn(...args);
        return send(res, 200, JSON.stringify({ value: encode(value === undefined ? null : value) }), MIME['.json']);
      } catch (err) {
        return send(res, 200, JSON.stringify({ error: String((err && err.message) || err) }), MIME['.json']);
      }
    }
    if (req.method !== 'GET') return send(res, 405, 'Method not allowed');
    if (url.pathname === '/__preview/bridge.js') return send(res, 200, await fs.readFile(path.join(here, 'bridge.js')), MIME['.js']);
    const cover = /^\/covers\/([a-z0-9-]{8,64})\.jpg$/.exec(url.pathname);
    if (cover) {
      const data = await store.readCover(cover[1]);
      return data ? send(res, 200, data, 'image/jpeg') : send(res, 404, 'Not found');
    }
    const file = resolve(url.pathname === '/' ? '/index.html' : url.pathname);
    if (!file) return send(res, 404, 'Not found');
    let data = await fs.readFile(file);
    if (file.endsWith('index.html')) {
      // Load the browser stand-in for the desktop bridge before the app starts.
      data = data.toString('utf8').replace('<script type="module"', '<script src="__preview/bridge.js"></script>\n    <script type="module"');
    }
    return send(res, 200, data, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch (err) {
    return send(res, err && err.code === 'ENOENT' ? 404 : 500, err && err.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try {
    const child = spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
  } catch {
    /* no browser to open; the address is printed below */
  }
}

await store.init(dataDir);
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`Readalune browser preview: ${url}`);
  console.log(`Preview library: ${dataDir}`);
  console.log('Press Ctrl+C to stop.');
  if (!argv.includes('--no-open')) openBrowser(url);
});
