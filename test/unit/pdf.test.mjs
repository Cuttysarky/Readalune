import test from 'node:test';
import assert from 'node:assert/strict';
import * as pdfjs from '../../node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import { layoutPdf, outlineToToc, itemsToLines, joinPdfLines, joinSpacedLetters, stripRunningHeaders } from '../../src/renderer/js/import/pdf-layout.js';
import { makePdf } from '../helpers/fixtures.mjs';

async function extract(bytes) {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, verbosity: 0 });
  const doc = await task.promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const tc = await (await doc.getPage(n)).getTextContent();
    pages.push({
      page: n,
      items: tc.items
        .filter((i) => typeof i.str === 'string')
        .map((it) => {
          const [a, b, c, d, e, f] = it.transform;
          return { str: it.str, x: e, y: f, w: it.width, size: Math.hypot(c, d) || Math.hypot(a, b), eol: it.hasEOL };
        }),
    });
  }
  const outline = [];
  for (const it of (await doc.getOutline()) || []) outline.push({ title: it.title, page: (await doc.getPageIndex(it.dest[0])) + 1, level: 0 });
  const perms = await doc.getPermissions();
  await task.destroy();
  return { pages, outline, perms };
}

test('PDF text is reflowed into headings and paragraphs', async () => {
  const { pages, outline, perms } = await extract(makePdf());
  assert.equal(perms, null, 'fixture has no permission restrictions');
  const { blocks } = layoutPdf(pages);
  const headings = blocks.filter((b) => /^h/.test(b.t)).map((b) => b.x);
  assert.deepEqual(headings, ['1. Getting Started', '2. Working Carefully', '3. Finishing Well']);
  assert.ok(!blocks.some((b) => b.x.includes('THE TEST MANUAL')), 'running header removed');
  assert.ok(!blocks.some((b) => /^\d+$/.test(b.x)), 'page numbers removed');
  assert.ok(blocks.some((b) => b.x.includes(' example ')), 'hyphenated word re-joined');
  assert.equal(blocks.filter((b) => b.t === 'p').length, 24, 'four paragraphs per page');
  const toc = outlineToToc(blocks, outline);
  assert.deepEqual(toc.map((t) => blocks[t.block].x), headings);
});

test('line building, joining and header stripping', () => {
  const lines = itemsToLines([
    { str: 'Hello', x: 10, y: 100, w: 25, size: 10 },
    { str: 'world', x: 37, y: 100, w: 25, size: 10, eol: true },
    { str: 'Next', x: 10, y: 86, w: 20, size: 10 },
  ]);
  assert.deepEqual(lines.map((l) => l.text), ['Hello world', 'Next']);
  assert.equal(joinPdfLines('beauti-', 'ful day'), 'beautiful day');
  assert.equal(joinPdfLines('well-', 'Known'), 'well-Known');
  assert.equal(joinPdfLines('end.', 'Start'), 'end. Start');
  const pages = [1, 2, 3, 4, 5].map((n) => ({ page: n, lines: [{ text: 'My Running Title', y: 760 }, { text: `Body text ${'abcde'[n - 1]}`, y: 500 }, { text: `Body two ${'vwxyz'[n - 1]}`, y: 480 }, { text: String(n), y: 40 }] }));
  stripRunningHeaders(pages);
  assert.ok(pages.every((p) => p.lines.length === 2 && p.lines[0].text.startsWith('Body text')));
});

test('letter-spaced lines are read as words', () => {
  const item = (str, x, w, size = 10) => ({ str, x, y: 100, w, size, eol: false });
  const text = (items) => itemsToLines(items).map((l) => l.text);
  // Letters typed with spaces between them, and a wider space between the two words.
  assert.deepEqual(text([item('E L E N A', 150, 44.1), item(' ', 194.1, 11.7), item('H A R T L E Y', 202.9, 63.7)]), ['ELENA HARTLEY']);
  assert.deepEqual(text([item('T H E  E N D', 50, 80)]), ['THE END']);
  // One letter per item: the usual gap joins letters, a clearly wider gap is a word space.
  const letters = (word, x) => [...word].map((ch, i) => item(ch, x + i * 10, 6));
  assert.deepEqual(text([...letters('THE', 50), ...letters('END', 90)]), ['THE END']);
  assert.deepEqual(text(letters('CONTENTS', 50)), ['CONTENTS']);
  // Left alone: a run that may be one word or several, columns of a table, initials, ordinary text.
  assert.deepEqual(text([item('C O N T E N T S', 50, 90)]), ['C O N T E N T S']);
  assert.deepEqual(text([item('A', 50, 6), item('B', 150, 6), item('C', 250, 6), item('D', 350, 6)]), ['A B C D']);
  assert.deepEqual(text([item('J', 50, 5), item(' ', 55, 3), item('R', 58, 6), item(' ', 64, 3), item('R', 67, 6)]), ['J R R']);
  assert.deepEqual(text([item('A fine day', 50, 50), item(' ', 100, 3), item('in May', 103, 30)]), ['A fine day in May']);
  assert.equal(joinSpacedLetters([{ str: 'a b, c', x: 0, xEnd: 30, size: 10 }]), null);
  // Touching single letters are ordinary text.
  assert.deepEqual(text([...[...'Hello'].map((ch, i) => item(ch, 50 + i * 5, 5)), item(' ', 75, 3), ...[...'there'].map((ch, i) => item(ch, 78 + i * 5, 5))]), ['Hello there']);
});
