import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { openZip, inflateRaw, resolvePath, ZipError } from '../../src/renderer/js/import/zip.js';
import { makeZip } from '../helpers/zip.mjs';

test('reads stored and deflated entries', async () => {
  const zip = openZip(makeZip([{ name: 'a.txt', data: 'stored text', store: true }, { name: 'dir/b.txt', data: 'deflated '.repeat(100) }]));
  assert.ok(zip.has('a.txt'));
  assert.equal(await zip.readText('a.txt'), 'stored text');
  assert.equal(await zip.readText('dir/b.txt'), 'deflated '.repeat(100));
  await assert.rejects(zip.read('missing'), ZipError);
});

test('rejects non-zip and encrypted entries', async () => {
  assert.throws(() => openZip(new Uint8Array(100)), ZipError);
  const buf = makeZip([{ name: 'secret', data: 'x' }]);
  // Set the "encrypted" flag in the central directory record.
  const cd = buf.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  buf.writeUInt16LE(buf.readUInt16LE(cd + 8) | 1, cd + 8);
  await assert.rejects(openZip(buf).read('secret'), /encrypted/);
});

test('decompression is capped (zip-bomb protection)', async () => {
  const bomb = zlib.deflateRawSync(Buffer.alloc(5 * 1024 * 1024));
  assert.ok(bomb.length < 10000);
  await assert.rejects(inflateRaw(bomb, 1024 * 1024), /too large/);
  await assert.rejects(inflateRaw(new Uint8Array([1, 2, 3, 4, 5]), 1000), ZipError);
});

test('resolvePath stays inside the archive', () => {
  assert.equal(resolvePath('OEBPS/content.opf', 'text/ch1.xhtml'), 'OEBPS/text/ch1.xhtml');
  assert.equal(resolvePath('OEBPS/text/ch1.xhtml', '../images/a%20b.png#x'), 'OEBPS/images/a b.png');
  assert.equal(resolvePath('a/b.xhtml', '../../../../etc/passwd'), 'etc/passwd');
});
