import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { decodeText, parsePlainText, classifyHeading, underscoreItalics } from '../../src/renderer/js/import/text.js';
import { makeLongText } from '../helpers/fixtures.mjs';

test('decodeText handles UTF-8, BOMs, UTF-16 and Windows-1252', () => {
  assert.equal(decodeText(new TextEncoder().encode('caf\u00e9')), 'caf\u00e9');
  assert.equal(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x68, 0x69])), 'hi');
  assert.equal(decodeText(new Uint8Array([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00])), 'hi');
  assert.equal(decodeText(new Uint8Array([0xfe, 0xff, 0x00, 0x68, 0x00, 0x69])), 'hi');
  const le = Buffer.from('Hello there, reader!', 'utf16le');
  assert.equal(decodeText(new Uint8Array(le)), 'Hello there, reader!');
  // 0xE9 alone is invalid UTF-8 -> Windows-1252 e-acute.
  assert.equal(decodeText(new Uint8Array([0x63, 0x61, 0x66, 0xe9])), 'caf\u00e9');
});

test('classifyHeading recognises chapter styles and rejects prose', () => {
  assert.ok(classifyHeading('CHAPTER I.'));
  assert.ok(classifyHeading('Chapter 12: The Return'));
  assert.ok(classifyHeading('Chapter Twenty-One'));
  assert.equal(classifyHeading('PART TWO').level, 0);
  assert.ok(classifyHeading('Prologue'));
  assert.ok(classifyHeading('IV.'));
  assert.equal(classifyHeading('Chapter 3 was the best day of my life'), null);
  assert.equal(classifyHeading('Part civil war, part comedy'), null);
  assert.equal(classifyHeading('It was a dark and stormy night.'), null);
});

test('plain text: chapters, contents list, metadata and paragraphs', () => {
  const book = parsePlainText(makeLongText(12, 6), { fileName: 'keeper.txt' });
  assert.equal(book.meta.title, 'The Keeper of Quiet Harbors');
  assert.equal(book.meta.author, 'Imaginary Author');
  assert.equal(book.meta.format, 'txt');
  const toc = book.content.toc;
  assert.equal(toc.length, 12, 'one TOC entry per chapter, contents list ignored');
  assert.match(toc[0].title, /^CHAPTER I: The /);
  // Every chapter heading starts a new page.
  for (const t of toc) assert.equal(book.content.blocks[t.block].brk, 1);
  // Hard-wrapped lines were joined into paragraphs.
  const paras = book.content.blocks.filter((b) => b.t === 'p' && b.x.length > 200 && !b.x.startsWith('CHAPTER'));
  assert.ok(paras.length >= 60);
  assert.ok(paras.every((p) => !p.x.includes('\n')));
});

test('plain text: verse keeps line breaks, dividers become rules, lists are detected', () => {
  const prose = 'This is a long line of ordinary prose that wraps at about seventy characters\nso that the parser can learn the typical width of the lines in the file\nand tell verse from prose when it sees much shorter lines later on.';
  const text = `${prose}\n\nRoses are red,\nthe lamp is bright,\nthe keeper waits\nall night.\n\n* * *\n\n- apples\n- pears\n- plums\n\n${prose}`;
  const book = parsePlainText(text, { fileName: 'poem.txt' });
  const b = book.content.blocks;
  assert.equal(b[1].x, 'Roses are red,\nthe lamp is bright,\nthe keeper waits\nall night.');
  assert.equal(b[2].t, 'hr');
  assert.deepEqual(b.slice(3, 6).map((x) => [x.t, x.x]), [['li', 'apples'], ['li', 'pears'], ['li', 'plums']]);
  assert.equal(book.meta.title, 'Poem');
});

test('plain text: single-line paragraphs (no blank lines) are kept separate', () => {
  const lines = Array.from({ length: 40 }, (_, i) => `Paragraph number ${i} is a single long line of text that goes on for quite a while, longer than one hundred characters easily.`);
  const book = parsePlainText(lines.join('\n'), { fileName: 'lines.txt' });
  assert.equal(book.content.blocks.length, 40);
});

test('plain text: empty input is rejected with a friendly error', () => {
  assert.throws(() => parsePlainText('   \n\n  ', {}), /No readable text/);
});

test('ordinal headings ("THE FIRST BOOK") count; notes that look like headings do not', () => {
  assert.deepEqual(classifyHeading('THE FIRST BOOK'), { level: 0, kind: 'ordinal' });
  assert.deepEqual(classifyHeading('Twenty-first Chapter'), { level: 1, kind: 'ordinal' });
  assert.deepEqual(classifyHeading('Second Part.'), { level: 0, kind: 'ordinal' });
  assert.equal(classifyHeading('BOOK IV XV. "Agathos" (18): This is probably not a proper name, but the'), null);
  assert.equal(classifyHeading('BOOK VII IX. C. translates his conjecture mh for h. The Greek means'), null);
  assert.equal(classifyHeading('BOOK II "Both to frequent". Gr. \u03c4\u1f78 \u03bc\u03ae, C. conjectures'), null);
  // Ordinary headings are unaffected.
  assert.deepEqual(classifyHeading('CHAPTER IV. THE STORM'), { level: 1, kind: 'chapter' });
  assert.deepEqual(classifyHeading('Chapter 3: Mr. Darcy Arrives'), { level: 1, kind: 'chapter' });
});

test('underscored spans become italics; snake_case, addresses and stray underscores do not', () => {
  const a = underscoreItalics('She said _very_ quietly, and _this spans\nlines_.');
  assert.equal(a.x, 'She said very quietly, and this spans\nlines.');
  assert.deepEqual(a.m, [[9, 13, 'i'], [27, 43, 'i']]);
  assert.equal(underscoreItalics('Use snake_case names here.'), null);
  assert.equal(underscoreItalics('See https://example.org/_x_ or mail me@_x_.org'), null);
  assert.equal(underscoreItalics('An _unclosed underscore stays as it is.'), null);
  assert.equal(underscoreItalics('No underscores at all.'), null);
  // Italic, plain title, italic again: "declare for_ Pride and Prejudice _unhesitatingly".
  const b = underscoreItalics('_I declare for_ Pride and Prejudice _unhesitatingly._');
  assert.equal(b.x, 'I declare for Pride and Prejudice unhesitatingly.');
  assert.deepEqual(b.m, [[0, 13, 'i'], [34, 49, 'i']]);
  // Through the importer: the paragraph keeps its italic ranges.
  const book = parsePlainText('Title\n\nA _quiet_ morning by the _harbor_.\n');
  const p = book.content.blocks.find((x) => x.x.startsWith('A quiet'));
  assert.equal(p.x, 'A quiet morning by the harbor.');
  assert.deepEqual(p.m, [[2, 7, 'i'], [23, 29, 'i']]);
});

test('Meditations (bundled classic) gets its twelve books as chapters, without footnotes', () => {
  const raw = zlib.gunzipSync(fs.readFileSync(new URL('../../src/renderer/classics/2680.txt.gz', import.meta.url)));
  const toc = parsePlainText(decodeText(new Uint8Array(raw))).content.toc.map((t) => t.title);
  const books = toc.filter((t) => /^THE \w+ BOOK$/.test(t));
  assert.equal(books.length, 12, toc.join(' | '));
  assert.equal(books[0], 'THE FIRST BOOK');
  assert.equal(books[11], 'THE TWELFTH BOOK');
  assert.ok(toc.includes('INTRODUCTION') && toc.includes('GLOSSARY'), toc.join(' | '));
  assert.ok(!toc.some((t) => /^BOOK [IVX]+ /.test(t)), 'no footnotes in the contents');
});

test('a chapter subtitle that reads like a heading stays the subtitle', () => {
  const body = 'Some opening words that are long enough to read as a real paragraph of the story, with more after it.';
  // "THE FIRST LETTER." under "CHAPTER XXXII." (Villette), and "The Last Chapter" after "CHAPTER 32".
  const a = parsePlainText(`Title\n\nCHAPTER XXXI.\n\n${body}\n\nCHAPTER XXXII.\nTHE FIRST LETTER.\n\n${body}\n`);
  assert.ok(a.content.toc.some((t) => t.title === 'CHAPTER XXXII: THE FIRST LETTER.'), JSON.stringify(a.content.toc));
  const b = parsePlainText(`Title\n\nCHAPTER 31\n\n${body}\n\nCHAPTER 32\n\nThe Last Chapter\n\n${body}\n`);
  const titles = b.content.toc.map((t) => t.title);
  assert.ok(titles.includes('CHAPTER 32: The Last Chapter'), JSON.stringify(titles));
  assert.ok(!titles.includes('The Last Chapter'));
  // A footnote marker at the end of a real heading is fine.
  assert.deepEqual(classifyHeading('CHAPTER XIX. THE CHOLERA MASQUERADE.(39)'), { level: 1, kind: 'chapter' });
});

test('Gutenberg illustration placeholders are left out; a wrapped chapter heading is kept', () => {
  const body = 'Some opening words that are long enough to read as a real paragraph of the story, with more after it.';
  const book = parsePlainText(`Title\n\n[Illustration]\n\n[Illustration: A caption\nover two lines]\n\n[Illustration: PRIDE AND PREJUDICE\n\n\nChapter I.]\n\n${body}\n\n[Illustration]\nA paragraph after an inline placeholder.\n\nCHAPTER II.\n\n${body}\n`);
  const texts = book.content.blocks.map((b) => b.x);
  assert.ok(!texts.some((x) => /Illustration/.test(x)), JSON.stringify(texts));
  assert.ok(texts.includes('A paragraph after an inline placeholder.'));
  assert.deepEqual(book.content.toc.map((t) => t.title).slice(0, 2), ['Chapter I.', 'CHAPTER II.']);
  // An unclosed bracket is ordinary text, not a placeholder.
  const plain = parsePlainText('Title\n\n[Illustration of a point that never closes\n\nand more text here.\n');
  assert.ok(plain.content.blocks.some((b) => b.x.startsWith('[Illustration of a point')));
});

test('the last entry of a contents list is not mistaken for a chapter when a note follows the list', () => {
  const body = 'Some opening words that are long enough to read as a real paragraph of the story, with more after it.';
  const note = 'A note from the person who prepared this text, long enough to be more than a hundred characters, sits between the list and the book.';
  const chapters = `CHAPTER 1. Loomings.\n\n${body}\n\nCHAPTER 2. The Carpet-Bag.\n\n${body}\n\nCHAPTER 3. The Spouter-Inn.\n\n${body}\n\nEpilogue\n\n${body}\n`;
  // Moby Dick: "... CHAPTER 135. / Epilogue", then the transcriber's notes, then the book.
  const book = parsePlainText(`Title\n\nCONTENTS\n\nCHAPTER 1. Loomings.\n\nCHAPTER 2. The Carpet-Bag.\n\nCHAPTER 3. The Spouter-Inn.\n\nEpilogue\n\nOriginal Notes:\n\n${note}\n\n${chapters}`);
  assert.deepEqual(book.content.toc.map((t) => t.title), ['CHAPTER 1. Loomings.', 'CHAPTER 2. The Carpet-Bag.', 'CHAPTER 3. The Spouter-Inn.', 'Epilogue']);
  // A real first chapter straight after the list is kept, as before.
  const plain = parsePlainText(`Title\n\nCONTENTS\n\nCHAPTER 1. Loomings.\n\nCHAPTER 2. The Carpet-Bag.\n\nCHAPTER 3. The Spouter-Inn.\n\nEpilogue\n\n${chapters}`);
  assert.deepEqual(plain.content.toc.map((t) => t.title), ['CHAPTER 1. Loomings.', 'CHAPTER 2. The Carpet-Bag.', 'CHAPTER 3. The Spouter-Inn.', 'Epilogue']);
  const moby = parsePlainText(decodeText(zlib.gunzipSync(fs.readFileSync(new URL('../../src/renderer/classics/2701.txt.gz', import.meta.url)))));
  assert.deepEqual(moby.content.toc.slice(0, 2).map((t) => t.title), ['CHAPTER 1. Loomings.', 'CHAPTER 2. The Carpet-Bag.']);
});
