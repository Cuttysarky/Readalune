import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { makeZip } from '../helpers/zip.mjs';
import { naturalCompare, comicPages } from '../../src/renderer/js/import/comic.js';

const require = createRequire(import.meta.url);
const v = require('../../src/main/validate.js');
const { writeZip, readZip } = require('../../src/main/zip.js');

const ALLOW = /^(index|collections|settings|stats|words)\.json$|^books\/[a-z0-9-]{8,64}\/(content\.json|state\.json|cover\.jpg|source\.bin)$/;

test('backup ZIP round-trips and ignores anything outside the allow-list', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readalune-zip-'));
  const files = {
    'index.json': '{"version":1,"books":{}}',
    'books/abc12345-ff/content.json': '{"v":1}',
    'books/abc12345-ff/cover.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]),
  };
  const entries = Object.entries(files).map(([name, data]) => {
    const abs = path.join(dir, name.replace(/\//g, '_'));
    fs.writeFileSync(abs, data);
    return [name, abs];
  });
  const out = path.join(dir, 'b.zip');
  await writeZip(out, entries);
  const read = readZip(fs.readFileSync(out), { allow: ALLOW });
  assert.deepEqual([...read.keys()].sort(), Object.keys(files).sort());
  assert.equal(read.get('index.json').toString(), files['index.json']);

  // A hostile archive: path traversal and unexpected files are simply ignored.
  const evil = makeZip([
    { name: '../../etc/passwd', data: 'x' },
    { name: 'books/../../main.js', data: 'x' },
    { name: 'books/abc12345-ff/evil.exe', data: 'MZ' },
    { name: 'settings.json', data: '{}' },
  ]);
  assert.deepEqual([...readZip(evil, { allow: ALLOW }).keys()], ['settings.json']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('backup reader refuses oversized (zip-bomb) entries', () => {
  const big = zlib.deflateRawSync(Buffer.alloc(3 * 1024 * 1024));
  const zip = makeZip([{ name: 'stats.json', data: Buffer.alloc(3 * 1024 * 1024) }]);
  assert.ok(big.length < 10000);
  assert.throws(() => readZip(zip, { allow: ALLOW, maxEntry: 1024 * 1024 }), /too large/);
});

test('new book fields are validated', () => {
  assert.deepEqual(v.metaPatch({ status: 'abandoned', rating: 4, tags: [' Fantasy ', 'fantasy', 'Sea'], series: ' Lantern Tales ', seriesIndex: 2 }), {
    status: 'abandoned',
    rating: 4,
    tags: ['fantasy', 'sea'],
    series: 'Lantern Tales',
    seriesIndex: 2,
  });
  assert.equal(v.metaPatch({ finished: true }).status, 'finished');
  assert.throws(() => v.metaPatch({ status: 'deleted' }), TypeError);
  assert.throws(() => v.metaPatch({ rating: 6 }), TypeError);
  assert.deepEqual(v.metaPatch({ collectionIds: ['abc12345-ff', '../x', 'abc12345-ff'] }).collectionIds, ['abc12345-ff']);
  assert.deepEqual(v.collections([{ id: 'abc12345-ff', name: ' Favourites ' }]), [{ id: 'abc12345-ff', name: 'Favourites', sortOrder: 0 }]);
  assert.throws(() => v.collections([{ id: 'abc12345-ff', name: 'a' }, { id: 'abc12345-ff', name: 'b' }]), TypeError);
});

test('comic payloads are validated', () => {
  const meta = { title: 'C', author: '', format: 'cbz', totalChars: 2, wordCount: 0, coverHue: 1 };
  const ok = v.bookPayload({ meta, content: { kind: 'comic', pages: ['1.png', '2.png'], rtl: true, blocks: [], toc: [] }, source: new Uint8Array([0x50, 0x4b]) });
  assert.equal(ok.content.kind, 'comic');
  assert.equal(ok.content.rtl, true);
  assert.equal(ok.source.length, 2);
  assert.throws(() => v.bookPayload({ meta, content: { kind: 'comic', pages: [], blocks: [], toc: [] } }), TypeError);
  assert.throws(() => v.bookPayload({ meta: { ...meta, format: 'mobi' }, content: { kind: 'comic', pages: ['a'], blocks: [], toc: [] } }), TypeError);
});

test('comic pages are ordered naturally and junk files skipped', () => {
  const entries = new Map(['p10.jpg', 'p2.jpg', 'p1.jpg', '__MACOSX/._p1.jpg', '.hidden.png', 'notes.txt', 'ComicInfo.xml'].map((n) => [n, {}]));
  assert.deepEqual(comicPages(entries), ['p1.jpg', 'p2.jpg', 'p10.jpg']);
  assert.ok(naturalCompare('page 9', 'page 10') < 0);
});

test('half-written temp files from an interrupted save are cleaned up at startup', async () => {
  const store = require('../../src/main/store.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readalune-store-'));
  const lib = path.join(dir, 'library');
  fs.mkdirSync(path.join(lib, 'books', 'abcdef12-34'), { recursive: true });
  fs.writeFileSync(path.join(lib, 'settings.json.75f95bdf300f.tmp'), '{"half":');
  fs.writeFileSync(path.join(lib, 'books', 'abcdef12-34', 'state.json.0123456789ab.tmp'), '{');
  fs.writeFileSync(path.join(lib, 'notes.tmp'), 'not ours');
  await store.init(dir);
  await store.flush();
  assert.equal(fs.existsSync(path.join(lib, 'settings.json.75f95bdf300f.tmp')), false);
  assert.equal(fs.existsSync(path.join(lib, 'books', 'abcdef12-34', 'state.json.0123456789ab.tmp')), false);
  assert.equal(fs.existsSync(path.join(lib, 'notes.tmp')), true, 'only our own temp files are removed');
  fs.rmSync(dir, { recursive: true, force: true });
});
