/**
 * The book model shared by every importer and the reader.
 *
 * A book is a flat list of blocks:
 *   { t: 'p'|'h1'|'h2'|'h3'|'h4'|'quote'|'li'|'pre'|'hr'|'center',
 *     x: 'plain text',             // the text exactly as it is displayed
 *     m?: [[start, end, 'i'|'b'|'c'|'u'|'s'|'sup'|'sub'], ...],  // inline styling
 *     pg?: 12,                      // page number in the original (PDF)
 *     brk?: 1,                      // start a new page before this block
 *     n?: 3 }                       // list item number
 * plus a table of contents: [{ title, block, level }].
 *
 * Positions inside the book are character offsets into the concatenation of
 * all block texts, separated by one virtual character. They do not change
 * when the font size or window size change, so they are what we store for
 * reading position, highlights and bookmarks.
 */

export const SECTION_TARGET_CHARS = 60000;
export const CHARS_PER_POSITION = 150;

/** Count words. CJK ideographs/kana are counted individually. */
export function countWords(text) {
  let n = 0;
  const words = text.match(/[^\s\u3000-\u9fff\uac00-\ud7af\uf900-\ufaff]+/g);
  if (words) n += words.length;
  const cjk = text.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/g);
  if (cjk) n += cjk.length;
  return n;
}

/** Small, fast, non-cryptographic hash (FNV-1a) used for duplicate detection and cover colours. */
export function hashString(str, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function fingerprint(blocks) {
  let sample = '';
  for (const b of blocks) {
    sample += b.x + '\n';
    if (sample.length > 65536) break;
  }
  const total = blocks.reduce((sum, b) => sum + b.x.length, 0);
  return `${hashString(sample).toString(16)}-${hashString(sample, 0x1234567).toString(16)}-${total}`;
}

/**
 * Clean up importer output: drop empty blocks, keep TOC indices valid,
 * collapse duplicate page breaks and compute summary metadata.
 */
export function finalizeBook({ blocks, toc = [], meta = {} }) {
  const keep = [];
  const remap = new Int32Array(blocks.length + 1).fill(-1);
  let pendingBreak = false;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.brk) pendingBreak = true;
    const empty = b.t !== 'hr' && !/\S/.test(b.x);
    if (empty) continue;
    if (b.m && b.m.length === 0) delete b.m;
    if (pendingBreak) {
      b.brk = 1;
      pendingBreak = false;
    } else if (b.brk) {
      delete b.brk;
    }
    remap[i] = keep.length;
    keep.push(b);
  }
  if (keep.length === 0) {
    throw new Error('No readable text was found in this file.');
  }
  // TOC entries pointing at removed blocks move to the next kept block.
  for (let i = blocks.length - 1, next = keep.length - 1; i >= 0; i--) {
    if (remap[i] === -1) remap[i] = next;
    else next = remap[i];
  }
  const seen = new Set();
  const cleanToc = [];
  for (const entry of toc) {
    const block = remap[entry.block];
    const title = String(entry.title || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (block < 0 || !title) continue;
    const key = `${block}:${title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleanToc.push({ title, block, level: Math.max(0, Math.min(6, entry.level | 0)) });
  }
  cleanToc.sort((a, b) => a.block - b.block || a.level - b.level);
  delete keep[0].brk;

  let totalChars = 0;
  let wordCount = 0;
  for (const b of keep) {
    totalChars += b.x.length + 1;
    wordCount += countWords(b.x);
  }
  totalChars = Math.max(0, totalChars - 1);
  const title = (meta.title || 'Untitled').replace(/\s+/g, ' ').trim().slice(0, 300) || 'Untitled';
  return {
    meta: {
      ...meta,
      title,
      author: (meta.author || '').replace(/\s+/g, ' ').trim().slice(0, 300),
      language: meta.language || '',
      totalChars,
      wordCount,
      fingerprint: fingerprint(keep),
      coverHue: hashString(title) % 360,
    },
    content: { v: 1, blocks: keep, toc: cleanToc },
  };
}

/** Index a stored book for reading: offsets, sections and TOC positions. */
export function indexBook(content) {
  const blocks = content.blocks;
  const starts = new Array(blocks.length);
  let offset = 0;
  for (let i = 0; i < blocks.length; i++) {
    starts[i] = offset;
    offset += blocks[i].x.length + 1;
  }
  const total = Math.max(1, offset - 1);
  const toc = (content.toc || []).map((t) => ({ ...t, offset: starts[t.block] }));
  const sections = computeSections(blocks, starts, total);
  return { blocks, starts, total, toc, sections };
}

/**
 * Split the book into render sections. A section starts at every hard page
 * break, and long stretches are split at paragraph boundaries so the DOM for
 * a single section stays small.
 */
export function computeSections(blocks, starts, total, target = SECTION_TARGET_CHARS) {
  const sections = [];
  let begin = 0;
  let chars = 0;
  const push = (end) => {
    if (end <= begin) return;
    sections.push({ startBlock: begin, endBlock: end, start: starts[begin], end: end < blocks.length ? starts[end] : total + 1 });
    begin = end;
    chars = 0;
  };
  let onlyHeadings = true;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // A forced break right after a section that holds nothing but headings
    // (a title page, "Part One" before "Chapter 1") would leave a near-empty page.
    const forced = b.brk && !(onlyHeadings && chars < 400);
    if (i > begin && (forced || (chars >= target && b.t !== 'li' && isBreakable(blocks, i)))) {
      push(i);
      onlyHeadings = true;
    }
    if (!/^h[1-4]$/.test(b.t) && b.t !== 'center') onlyHeadings = false;
    chars += b.x.length + 1;
  }
  push(blocks.length);
  return sections;
}

function isBreakable(blocks, i) {
  // Don't split right after a heading (keep headings with their text).
  const prev = blocks[i - 1];
  return !prev || !/^h[1-4]$/.test(prev.t);
}

/** Index of the last element in a sorted numeric array that is <= value. */
export function lastIndexAtOrBefore(sorted, value) {
  let lo = 0;
  let hi = sorted.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= value) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

export function blockIndexAt(book, offset) {
  return lastIndexAtOrBefore(book.starts, offset);
}

export function sectionIndexAt(book, offset) {
  const secs = book.sections;
  let lo = 0;
  let hi = secs.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (secs[mid].start <= offset) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

/** The TOC entry (chapter) containing an offset, or null. */
export function chapterAt(book, offset) {
  let found = null;
  for (const entry of book.toc) {
    if (entry.offset <= offset) found = entry;
    else break;
  }
  return found;
}

/** The range [start, end) of the chapter containing an offset. */
export function chapterRange(book, offset) {
  let start = 0;
  let end = book.total;
  for (const entry of book.toc) {
    if (entry.offset <= offset) start = entry.offset;
    else {
      end = entry.offset;
      break;
    }
  }
  return { start, end };
}

/** Extract plain text between two offsets (used for highlight text and TTS). */
export function textBetween(book, start, end) {
  const out = [];
  let i = blockIndexAt(book, start);
  for (; i < book.blocks.length; i++) {
    const bStart = book.starts[i];
    if (bStart >= end) break;
    const x = book.blocks[i].x;
    out.push(x.slice(Math.max(0, start - bStart), Math.max(0, end - bStart)));
  }
  return out.join('\n').trim();
}

/**
 * The first words at an offset, as a short label (used for bookmarks). A page
 * can begin part-way through a hyphenated word; the label starts at the next
 * whole word instead.
 */
export function excerptAt(book, start, end, max = 120) {
  const i = blockIndexAt(book, start);
  const x = book.blocks[i] ? book.blocks[i].x : '';
  const local = start - book.starts[i];
  const wordChar = /[\p{L}\p{N}]/u;
  let from = start;
  if (local > 0 && local < x.length && wordChar.test(x[local - 1]) && wordChar.test(x[local])) {
    const gap = x.slice(local).search(/\s/);
    if (gap >= 0 && start + gap < end) from = start + gap;
  }
  return textBetween(book, from, Math.min(end, from + max)).replace(/\s+/g, ' ').slice(0, max);
}

export function positionOf(offset) {
  return Math.floor(offset / CHARS_PER_POSITION) + 1;
}

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 1) return 'less than a minute';
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} h ${rem} min` : `${h} h`;
}

/** Turn "my_great-book.final.txt" into "My Great Book Final". */
export function titleFromFileName(name) {
  const base = String(name || '')
    .replace(/\.[A-Za-z0-9]{1,8}$/, '')
    .replace(/[_]+/g, ' ')
    .replace(/(?<=\S)[-.](?=\S)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return 'Untitled';
  if (base === base.toLowerCase()) {
    return base.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  }
  return base;
}
