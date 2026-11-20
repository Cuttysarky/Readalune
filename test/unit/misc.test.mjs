import test from 'node:test';
import assert from 'node:assert/strict';
import { sentences } from '../../src/renderer/js/reader/tts.js';
import { streaks, sanitizeStats, dayKey } from '../../src/renderer/js/stats.js';
import { Words } from '../../src/renderer/js/words.js';
import { sanitizeSettings, DEFAULTS, layoutSignature } from '../../src/renderer/js/settings.js';
import { notesToMarkdown, safeFileName } from '../../src/renderer/js/notes-export.js';
import { indexBook } from '../../src/renderer/js/core/book.js';

test('sentences keep accurate offsets', () => {
  const text = 'Hello there. How are you?  Fine!';
  const s = sentences(text, 100);
  assert.deepEqual(s.map((x) => x.text), ['Hello there.', 'How are you?', 'Fine!']);
  for (const x of s) assert.equal(text.slice(x.start - 100, x.end - 100), x.text);
  const long = sentences('word '.repeat(200));
  assert.ok(long.length > 1 && long.every((x) => x.text.length <= 280));
});

test('reading streaks', () => {
  const today = new Date(2026, 10, 6, 12);
  const daily = {};
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    daily[dayKey(d)] = 600;
  }
  daily['2026-01-01'] = 600;
  daily['2026-01-02'] = 30; // under a minute does not count
  assert.deepEqual(streaks(daily, today), { streak: 4, longest: 4 });
  const s = sanitizeStats({ daily: { bad: 5, '2026-01-01': -3, '2026-01-02': 60 }, cpm: 99999 });
  assert.deepEqual(s.daily, { '2026-01-02': 60 });
  assert.equal(s.cpm, 0);
});

test('word journal CSV is escaped against formula injection', () => {
  const w = new Words({ setWords: async () => {} }, []);
  w.add({ word: '=HYPERLINK("x")', context: 'He said "hi"', bookId: 'b', bookTitle: 'T' });
  w.add({ word: 'serene', context: 'A serene lake.', bookId: 'b', bookTitle: 'T' });
  w.add({ word: 'Serene', context: 'Again serene.', bookId: 'b', bookTitle: 'T' });
  assert.equal(w.list.length, 2);
  assert.equal(w.list[0].count, 2);
  const csv = w.toCsv();
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes('"He said ""hi"""'));
  w.saveSoon.cancel();
});

test('settings are sanitised', () => {
  const s = sanitizeSettings({ theme: 'nope', fontSize: 400, hyphenate: 'yes', font: 'mono', anim: 'fade', footerMode: 'chapter' });
  assert.equal(s.theme, DEFAULTS.theme);
  assert.equal(s.fontSize, 40);
  assert.equal(s.hyphenate, DEFAULTS.hyphenate);
  assert.equal(s.font, 'mono');
  assert.equal(s.footerMode, 'chapter');
  assert.notEqual(layoutSignature(s), layoutSignature({ ...s, fontSize: 21 }));
  assert.equal(layoutSignature(s), layoutSignature({ ...s, theme: 'night', brightness: 50 }));
});

test('notes export', () => {
  const book = indexBook({ blocks: [{ t: 'h2', x: 'Chapter One' }, { t: 'p', x: 'A fine sentence to remember.' }], toc: [{ title: 'Chapter One', block: 0, level: 0 }] });
  const md = notesToMarkdown({ title: 'Book', author: 'Me' }, book, { highlights: [{ id: '1', s: 12, e: 40, c: 'blue', note: 'Nice', text: 'A fine sentence to remember.', at: 0 }], bookmarks: [{ id: 'b', o: 0, text: 'Chapter One', at: 0 }] });
  assert.match(md, /^# Book/);
  assert.match(md, /## Chapter One/);
  assert.match(md, /> A fine sentence to remember\./);
  assert.match(md, /remember\.\n\n\u2014 Blue highlight/, 'the attribution line is outside the quote block');
  assert.match(md, /\*\*Note:\*\* Nice/);
  assert.match(md, /## Bookmarks/);
  assert.equal(safeFileName('a/b:c*?'), 'a b c');
});

test('binary files are not mistaken for text', async () => {
  const { looksLikeText } = await import('../../src/renderer/js/import/index.js');
  const elf = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0x3e, 0]);
  assert.equal(looksLikeText(elf), false);
  assert.equal(looksLikeText(new TextEncoder().encode('Plain text.\nWith lines.\r\n\tTabbed.')), true);
  assert.equal(looksLikeText(new Uint8Array(Buffer.from('Hello there, reader!', 'utf16le'))), true);
  assert.equal(looksLikeText(new Uint8Array([0xff, 0xfe, 0x68, 0x00])), true);
});

test('every sort order offered in the library survives the settings check', async () => {
  const { sanitizeSettings } = await import('../../src/renderer/js/settings.js');
  const html = (await import('node:fs')).readFileSync(new URL('../../src/renderer/index.html', import.meta.url), 'utf8');
  const offered = [...html.split('id="lib-sort"')[1].split('</select>')[0].matchAll(/<option value="([a-z]+)"/g)].map((m) => m[1]);
  assert.ok(offered.includes('series') && offered.includes('rating'), offered.join(','));
  for (const sort of offered) assert.equal(sanitizeSettings({ librarySort: sort }).librarySort, sort);
});
