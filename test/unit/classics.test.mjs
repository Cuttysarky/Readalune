/**
 * Guards the bundled Classics shelf:
 *  - every book satisfies the public-domain policy (see scripts/fetch-classics.mjs)
 *  - every file is intact and unmodified (SHA-256 of the original text)
 *  - the Project Gutenberg License is still present (required to redistribute)
 *  - every book imports cleanly, with chapters found only inside the book
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { decodeText, parsePlainText } from '../../src/renderer/js/import/text.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/renderer/classics');
const catalog = JSON.parse(fs.readFileSync(path.join(dir, 'catalog.json'), 'utf8'));
const books = catalog.books;

test('the catalog holds 1000 unique books and nothing else is bundled', () => {
  assert.equal(books.length, 1000);
  assert.equal(new Set(books.map((b) => b.id)).size, 1000);
  const files = fs.readdirSync(dir).filter((f) => f !== 'catalog.json').sort();
  assert.deepEqual(files, books.map((b) => b.file).sort());
});

test('every book names a cover emblem the app can draw', async () => {
  const { MOTIFS, coverMotif } = await import('../../src/renderer/js/ui/cover.js');
  for (const d of Object.values(MOTIFS)) assert.match(d, /^[MLHVCSQTAZmlhvcsqtaz0-9 .-]+$/);
  for (const b of books) assert.ok(Object.hasOwn(MOTIFS, b.motif), `${b.title}: unknown emblem "${b.motif}"`);
  assert.equal(coverMotif({ title: 'Moby Dick', motif: 'whale' }), 'whale');
  assert.equal(coverMotif({ title: 'Anything', coverMotif: 'bolt' }), 'bolt');
  assert.equal(coverMotif({ title: 'A Winter Garden', motif: 'not-a-motif' }), 'flower');
  assert.equal(coverMotif({ title: 'Notes' }), '');
});

test('a cover title is sized so that no word is split across lines', async () => {
  const { fitTitle } = await import('../../src/renderer/js/ui/cover.js');
  // A stand-in for measuring real type: capitals 0.72em wide, everything else 0.5em.
  const seen = [];
  const em = (word, italic) => {
    seen.push([word, italic]);
    return [...word].reduce((sum, ch) => sum + (ch >= 'A' && ch <= 'Z' ? 0.72 : 0.5), 0);
  };
  // A short title keeps the design it was given.
  assert.deepEqual(fitTitle('Emma', { layout: 6, type: 1, size: 1 }, em), { size: 1, type: 1 });
  assert.deepEqual(fitTitle('Emma', { layout: 6, type: 3, size: 1 }, em), { size: 1, type: 3 });
  // Too wide for the narrow spine layout at the largest size: one size down.
  assert.deepEqual(fitTitle('Frankenstein', { layout: 6, type: 1, size: 1 }, em), { size: 2, type: 1 });
  // Too wide in spaced capitals: ordinary letters at the same size.
  assert.deepEqual(fitTitle('Meditations', { layout: 1, type: 3, size: 1 }, em), { size: 1, type: 1 });
  // Only the widest word counts, a hyphen ends a word, and italics are measured as italics.
  assert.deepEqual(fitTitle('The Double-Barrelled Question of Everything', { layout: 6, type: 2, size: 3 }, em), { size: 3, type: 2 });
  assert.ok(seen.some(([word, italic]) => word === 'Barrelled' && italic === true));
  assert.ok(!seen.some(([word]) => word.includes('-')));
  // The size never goes above the one chosen for the title's length.
  assert.equal(fitTitle('A Tale', { layout: 2, type: 1, size: 4 }, em).size, 4);
  // Chinese and Japanese wrap between characters, so they never force a smaller size.
  assert.deepEqual(fitTitle('\u6e90\u6c0f\u7269\u8a9e\u4e0a\u5dfb\u6850\u58fa', { layout: 6, type: 1, size: 1 }, em), { size: 1, type: 1 });
  // A word too long for any size gets the smallest one.
  assert.deepEqual(fitTitle('Donaudampfschiffahrtsgesellschaften', { layout: 6, type: 1, size: 3 }, em), { size: 5, type: 1 });
});

test('every book meets the catalogue policy for US public-domain status', () => {
  assert.equal(catalog.policy.publishedBefore, 1931);
  assert.equal(catalog.policy.allContributorsDiedBefore, 1926);
  for (const b of books) {
    assert.ok(b.published === null || b.published < 1931, `${b.title}: published ${b.published}`);
    assert.ok(b.contributorsDied.some((c) => c.role === 'aut'), `${b.title}: no author`);
    for (const c of b.contributorsDied) {
      assert.notEqual(c.role, 'ill', 'illustrators are not listed (no images are bundled)');
      const anonymous = /^(anonymous|unknown)$/i.test(c.name);
      const ok = (c.died !== null && c.died < 1926) || (c.died === null && ((c.born !== null && c.born < 1800) || anonymous));
      assert.ok(ok, `${b.title}: ${c.role} ${c.name} died ${c.died}`);
      // Anonymous works run 70 years from publication in the EU: each needs a checked early date.
      if (anonymous) assert.ok(catalog.policy.vettedAnonymous[String(b.id)], `${b.title}: anonymous work without a vetted publication date`);
    }
    assert.match(b.source, /^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/);
  }
});

test('files are unmodified and keep the Project Gutenberg License', () => {
  for (const b of books) {
    const raw = zlib.gunzipSync(fs.readFileSync(path.join(dir, b.file)));
    assert.equal(raw.length, b.bytes, `${b.title}: size`);
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), b.sha256, `${b.title}: checksum`);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(raw); // throws if not valid text
    // eslint-disable-next-line no-control-regex
    assert.ok(!/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/.test(text.replace(/\f/g, '')), `${b.title}: binary or control bytes`);
    assert.match(text, /\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG/i, `${b.title}: start marker`);
    assert.match(text, /\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i, `${b.title}: end marker`);
    assert.match(text, /Project Gutenberg(\u2122|\(TM\)|-tm)? License/i, `${b.title}: license text`);
  }
});

test('books import with a sensible table of contents (every 10th book)', () => {
  for (const b of books.filter((_, i) => i % 10 === 0)) {
    const raw = zlib.gunzipSync(fs.readFileSync(path.join(dir, b.file)));
    const book = parsePlainText(decodeText(raw), { fileName: `${b.id}.txt` });
    const toc = book.content.toc;
    assert.ok(book.content.blocks.length > 5, `${b.title}: too few paragraphs`);
    assert.equal(toc[toc.length - 1].title, 'Project Gutenberg License', `${b.title}: license entry last`);
    assert.ok(!toc.slice(0, -1).some((t) => /^section \d/i.test(t.title) && /gutenberg/i.test(t.title)), `${b.title}: license sections leaked into contents`);
  }
});

test('book files contain only ordinary text: no hidden characters, code or injected instructions', () => {
  // Invisible / direction-override characters (Trojan Source style hiding). Direction
  // marks (U+200E/U+200F) are allowed only right next to right-to-left script.
  const HIDDEN = /[\u200b-\u200d\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufff9-\ufffb]|[\u{e0000}-\u{e007f}]/u;
  const MARK = /[\u200e\u200f]/g;
  const RTL = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/;
  const CODE = /<\s*(script|iframe|object|embed|svg|meta|style)\b|\b(javascript|vbscript):\S/i;
  const INJECTION = /ignore (all |any )?(the )?(previous|prior|above) (instructions|prompts)|disregard (all |the )?(previous|prior|above) instructions|system prompt|<\|im_start\|>|\[INST\]|\b(chatgpt|openai|large language model)\b/i;
  const BLOB = /[A-Za-z0-9+/=]{120,}/;
  for (const b of books) {
    const text = zlib.gunzipSync(fs.readFileSync(path.join(dir, b.file))).toString('utf8').replace(/^\ufeff/, '');
    assert.ok(!HIDDEN.test(text), `${b.title}: hidden characters`);
    for (const m of text.matchAll(MARK)) {
      assert.ok(RTL.test(text.slice(Math.max(0, m.index - 8), m.index + 9)), `${b.title}: direction mark outside right-to-left text`);
    }
    assert.ok(!CODE.test(text), `${b.title}: code or embed markup`);
    assert.ok(!INJECTION.test(text), `${b.title}: instruction-like text`);
    assert.ok(!BLOB.test(text), `${b.title}: long encoded blob`);
  }
});
