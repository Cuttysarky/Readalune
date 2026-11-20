import test from 'node:test';
import assert from 'node:assert/strict';
import { finalizeBook, indexBook, computeSections, chapterAt, chapterRange, textBetween, excerptAt, titleFromFileName, countWords, formatDuration, positionOf } from '../../src/renderer/js/core/book.js';

const blocks = () => [
  { t: 'h2', x: 'One', brk: 1 },
  { t: 'p', x: 'Alpha beta.' },
  { t: 'p', x: '   ' },
  { t: 'h2', x: 'Two', brk: 1 },
  { t: 'p', x: 'Gamma delta epsilon.' },
];

test('finalizeBook drops empty blocks and remaps the TOC', () => {
  const b = finalizeBook({ blocks: blocks(), toc: [{ title: 'One', block: 0, level: 0 }, { title: 'Two', block: 3, level: 0 }, { title: 'Gone', block: 2, level: 0 }], meta: { title: '  My   Book ' } });
  assert.equal(b.content.blocks.length, 4);
  assert.deepEqual(b.content.toc.map((t) => [t.title, t.block]), [['One', 0], ['Two', 2], ['Gone', 2]]);
  assert.equal(b.meta.title, 'My Book');
  assert.equal(b.meta.wordCount, 7);
  assert.equal(b.content.blocks[0].brk, undefined, 'first block never needs a page break');
  assert.ok(b.meta.fingerprint);
});

test('indexBook computes offsets, sections and chapters', () => {
  const { content } = finalizeBook({ blocks: blocks(), toc: [{ title: 'One', block: 0, level: 0 }, { title: 'Two', block: 2, level: 0 }] });
  const book = indexBook(content);
  assert.deepEqual(book.starts, [0, 4, 16, 20]);
  assert.equal(book.total, 40);
  assert.equal(book.sections.length, 2);
  assert.equal(book.sections[1].start, 16);
  assert.equal(chapterAt(book, 18).title, 'Two');
  assert.deepEqual(chapterRange(book, 5), { start: 0, end: 16 });
  assert.equal(textBetween(book, 4, 9), 'Alpha');
  assert.equal(textBetween(book, 10, 23), 'beta.\nTwo\nGam');
});

test('long sections are split at paragraph boundaries, not after headings', () => {
  const many = [{ t: 'h2', x: 'Start' }];
  for (let i = 0; i < 50; i++) many.push({ t: 'p', x: 'x'.repeat(1000) });
  const book = indexBook({ blocks: many, toc: [] });
  const secs = computeSections(book.blocks, book.starts, book.total, 10000);
  assert.ok(secs.length >= 4);
  for (let i = 1; i < secs.length; i++) assert.equal(secs[i].start, secs[i - 1].end);
  assert.equal(secs[secs.length - 1].endBlock, many.length);
});

test('a forced break after a heading-only section is skipped', () => {
  const b = [{ t: 'h1', x: 'Part One' }, { t: 'h2', x: 'Chapter 1', brk: 1 }, { t: 'p', x: 'Text.' }, { t: 'h2', x: 'Chapter 2', brk: 1 }, { t: 'p', x: 'More.' }];
  const book = indexBook({ blocks: b, toc: [] });
  assert.deepEqual(book.sections.map((s) => s.startBlock), [0, 3]);
});

test('helpers', () => {
  assert.equal(titleFromFileName('pride_and-prejudice.txt'), 'Pride And Prejudice');
  assert.equal(titleFromFileName('My Report.v2.PDF'), 'My Report v2');
  assert.equal(countWords('one two  three'), 3);
  assert.equal(countWords('\u4f60\u597d world'), 3);
  assert.equal(formatDuration(0.4), 'less than a minute');
  assert.equal(formatDuration(75), '1 h 15 min');
  assert.equal(positionOf(0), 1);
  assert.equal(positionOf(150), 2);
});

test('a bookmark label starts at a whole word', () => {
  const { content } = finalizeBook({ blocks: [{ t: 'p', x: 'The beginning of everything was quiet.' }, { t: 'p', x: 'Then it rained.' }], toc: [] });
  const book = indexBook(content);
  assert.equal(excerptAt(book, 0, book.total), 'The beginning of everything was quiet. Then it rained.');
  // A page that starts inside "beginning" (after a hyphen break) is labelled from the next word.
  assert.equal(excerptAt(book, 9, book.total), 'of everything was quiet. Then it rained.');
  // A page that starts at a word, or at a paragraph, is labelled from there.
  assert.equal(excerptAt(book, 4, book.total), 'beginning of everything was quiet. Then it rained.');
  assert.equal(excerptAt(book, book.starts[1], book.total), 'Then it rained.');
  // Never past the end of the page, and never longer than asked.
  assert.equal(excerptAt(book, 9, 12), 'nin');
  assert.equal(excerptAt(book, 0, book.total, 13), 'The beginning');
});
