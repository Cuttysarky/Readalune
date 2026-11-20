import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const v = require('../../src/main/validate.js');
const { createResolver } = require('../../src/main/paths.js');

const root = path.resolve('/app/src/renderer');
const pdfjs = path.resolve('/app/node_modules/pdfjs-dist');
const resolve = createResolver(root, pdfjs);

test('app file resolver refuses path traversal', () => {
  assert.equal(resolve('/index.html'), path.join(root, 'index.html'));
  assert.equal(resolve('/js/app.js'), path.join(root, 'js/app.js'));
  for (const bad of ['/../main/main.js', '/%2e%2e/main/main.js', '/..%2f..%2fpackage.json', '/js/%00x', '/%5c..%5cmain.js', '/%E0%A4%A']) {
    const r = resolve(bad);
    assert.ok(r === null || r.startsWith(root + path.sep), `escaped root: ${bad} -> ${r}`);
  }
  assert.equal(resolve('/vendor/pdfjs/pdf.min.mjs'), path.join(pdfjs, 'build/pdf.min.mjs'));
  assert.equal(resolve('/vendor/pdfjs/cmaps/UniGB-UCS2-H.bcmap'), path.join(pdfjs, 'cmaps/UniGB-UCS2-H.bcmap'));
  assert.equal(resolve('/vendor/pdfjs/package.json'), null);
  assert.equal(resolve('/vendor/pdfjs/cmaps/../../../etc/passwd.bcmap'), null);
});

const goodPayload = () => ({
  meta: { title: 'T', author: 'A', language: 'en', format: 'txt', sourceName: 'x.txt', totalChars: 5, wordCount: 1, fingerprint: 'f', coverHue: 10 },
  content: { blocks: [{ t: 'p', x: 'Hello', m: [[0, 5, 'b']] }], toc: [{ title: 'Start', block: 0, level: 0 }] },
  cover: null,
});

test('book payload validation accepts good input', () => {
  const p = v.bookPayload(goodPayload());
  assert.equal(p.meta.title, 'T');
  assert.deepEqual(p.content.blocks[0].m, [[0, 5, 'b']]);
});

test('book payload validation rejects malformed input', () => {
  const bad = (fn) => {
    const p = goodPayload();
    fn(p);
    assert.throws(() => v.bookPayload(p), TypeError);
  };
  bad((p) => (p.meta.format = 'exe'));
  bad((p) => (p.meta.coverMotif = '<svg>'));
  bad((p) => (p.content.blocks[0].t = 'script'));
  bad((p) => (p.content.blocks[0].x = 42));
  bad((p) => (p.content.blocks[0].m = [[0, 99, 'b']]));
  bad((p) => (p.content.blocks[0].m = [[0, 1, 'onclick']]));
  bad((p) => (p.content.toc[0].block = 7));
  bad((p) => (p.content.blocks = []));
  bad((p) => (p.cover = new Uint8Array([0x89, 0x50, 0x4e, 0x47])));
  assert.equal(v.bookPayload({ ...goodPayload(), cover: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) }).cover.length, 4);
  const withMotif = goodPayload();
  withMotif.meta.coverMotif = 'whale';
  assert.equal(v.bookPayload(withMotif).meta.coverMotif, 'whale');
  assert.equal(v.bookPayload(goodPayload()).meta.coverMotif, '');
});

test('ids, file names and patches are sanitised', () => {
  assert.throws(() => v.bookId('../../etc'), TypeError);
  assert.throws(() => v.bookId('ABC'), TypeError);
  assert.equal(v.bookId('abc12345-ff'), 'abc12345-ff');
  assert.equal(v.fileName('../../evil/name?.md'), '_.._evil_name_.md');
  assert.deepEqual(v.metaPatch({ title: ' New ', hasCover: true, id: 'x', progress: 0.5 }), { title: 'New', progress: 0.5 });
  assert.throws(() => v.metaPatch({ progress: 2 }), TypeError);
  const obj = v.plainObject(JSON.parse('{"a":1,"__proto__":{"polluted":true}}'), 1000);
  assert.equal(obj.polluted, undefined);
  assert.equal({}.polluted, undefined);
  assert.throws(() => v.bookState({ highlights: [{ id: 'h', s: 5, e: 2, c: 'yellow', at: 0 }] }), TypeError);
  assert.throws(() => v.bookState({ highlights: [{ id: 'h', s: 1, e: 2, c: 'red', at: 0 }] }), TypeError);
});
