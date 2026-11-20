import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInline, parseMarkdown, decodeEntities } from '../../src/renderer/js/import/markdown.js';
import { indexBook } from '../../src/renderer/js/core/book.js';

test('inline markdown produces text plus style ranges', () => {
  const r = parseInline('Hello **bold *both* x** `co*de` [link](https://example.invalid) _em_ snake_case ~~gone~~ &amp; \\*lit\\*');
  assert.equal(r.text, 'Hello bold both x co*de link em snake_case gone & *lit*');
  const has = (s, e, t) => r.marks.some((m) => m[0] === s && m[1] === e && m[2] === t);
  assert.ok(has(6, 17, 'b'));
  assert.ok(has(11, 15, 'i'));
  assert.ok(has(18, 23, 'c'));
  assert.ok(has(24, 28, 'u'));
  assert.ok(has(29, 31, 'i'));
  assert.ok(has(43, 47, 's'));
});

test('inline markdown strips HTML tags and keeps image alt text', () => {
  assert.equal(parseInline('a <span onclick="x()">b</span> c<br>d').text, 'a b c\nd');
  assert.equal(parseInline('![A cat](cat.png) sat').text, 'A cat sat');
});

test('entities decode safely', () => {
  assert.equal(decodeEntities('&lt;b&gt; &#65; &#x42; &bogus; &#xD800;'), '<b> A B &bogus; &#xD800;');
});

test('markdown blocks, front matter and table of contents', () => {
  const md = `---\ntitle: My Notes\nauthor: Me\n---\n# Book\n\n## Chapter One\n\nSome *text* here  \nnext line.\n\n- one\n- two\n\n1. first\n2. second\n\n> quoted\n> more\n\n\`\`\`\ncode  here\n\`\`\`\n\n| a | b |\n|---|---|\n| 1 | 22 |\n\n## Chapter Two\n\n***\n\nEnd.`;
  const book = parseMarkdown(md, { fileName: 'n.md' });
  assert.equal(book.meta.title, 'My Notes');
  assert.equal(book.meta.author, 'Me');
  const b = book.content.blocks;
  const types = b.map((x) => x.t);
  assert.deepEqual(types, ['h1', 'h2', 'p', 'li', 'li', 'li', 'li', 'quote', 'pre', 'pre', 'h2', 'hr', 'p']);
  assert.equal(b[2].x, 'Some text here\nnext line.');
  assert.deepEqual(b[2].m, [[5, 9, 'i']]);
  assert.equal(b[5].n, 1);
  assert.equal(b[8].x, 'code  here');
  assert.deepEqual(book.content.toc.map((t) => t.title), ['Chapter One', 'Chapter Two']);
  assert.equal(b[10].brk, 1);
  // The title page and the first chapter share a page; chapter two starts a new one.
  assert.deepEqual(indexBook(book.content).sections.map((s) => s.startBlock), [0, 10]);
});
