/**
 * Plain-text importer: turns a .txt file into formatted paragraphs, detects
 * chapters and builds a table of contents.
 */
import { finalizeBook, titleFromFileName } from '../core/book.js';

/* ------------------------------------------------------------ decoding */

/** Decode bytes as text, detecting UTF-8/UTF-16 and falling back to Windows-1252. */
export function decodeText(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return new TextDecoder('utf-8').decode(b.subarray(3));
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.subarray(2));
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(b.subarray(2));
  // UTF-16 without a BOM shows up as lots of zero bytes in alternating positions.
  const probe = Math.min(b.length, 2000);
  if (probe >= 8) {
    let evenZero = 0;
    let oddZero = 0;
    for (let i = 0; i < probe; i++) {
      if (b[i] === 0) {
        if (i % 2) oddZero++;
        else evenZero++;
      }
    }
    if (oddZero > probe * 0.3 && evenZero < probe * 0.05) return new TextDecoder('utf-16le').decode(b);
    if (evenZero > probe * 0.3 && oddZero < probe * 0.05) return new TextDecoder('utf-16be').decode(b);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b);
  } catch {
    return new TextDecoder('windows-1252').decode(b);
  }
}

/** Normalise line endings and invisible junk without changing visible text. */
export function normalizeText(text) {
  return text
    .replace(/^\ufeff/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\f/g, '\n\n')
    .replace(/\u2028|\u2029/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/g, '');
}

/* ----------------------------------------------------- heading detection */

const NUMBER_WORDS =
  'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|last|final';

const CHAPTER_RE = new RegExp(
  `^(chapter|chap\\.|part|book|volume|vol\\.|section|act|scene|canto|letter|stave|lesson|episode|story)\\s+` +
    `(?:no\\.?\\s*)?([0-9]{1,4}|(?=[mdclxvi])m{0,4}(?:cm|cd|d?c{0,3})(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})|(?:the\\s+)?(?:${NUMBER_WORDS})(?:[\\s-]+(?:${NUMBER_WORDS}))?)` +
    `(?![\\p{L}\\p{N}])\\s*[.:\\-\\u2014\\u2013]?\\s*(.{0,90})$`,
  'iu'
);
const NAMED_RE =
  /^(prologue|epilogue|preface|foreword|introduction|afterword|appendix(?:\s+[a-z0-9]{1,4})?|acknowledge?ments|conclusion|interlude|postscript|dedication|author['\u2019]?s note|a note on the text|glossary|bibliography|endnotes|notes)\s*[.:]?$/iu;
const ROMAN_RE = /^(?=[MDCLXVI])M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})\.?$/;
const NUMBER_RE = /^\d{1,3}\.?$/;
const PG_START_RE = /^\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG/i;
const PG_END_RE = /^\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG/i;
const DIVIDER_RE = /^(?:[*\u2022\u00b7#~=-]\s*){3,}$/;
const PART_WORDS = new Set(['part', 'book', 'volume', 'vol.']);
const ORDINAL_WORDS =
  'first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth|fortieth|fiftieth|last|final';
// "THE FIRST BOOK", "Second Part": the ordinal comes before the word.
const ORDINAL_HEADING_RE = new RegExp(
  `^(?:the\\s+)?(?:(?:twenty|thirty|forty|fifty)[\\s-]+)?(?:${ORDINAL_WORDS})\\s+(book|part|volume|chapter|canto|act|section|letter)\\.?$`,
  'iu'
);

/**
 * Classify a single short line as a heading.
 * Returns null or { level: 0 (part) | 1 (chapter), kind }.
 */
export function classifyHeading(line) {
  const s = line.trim();
  if (!s || s.length > 100) return null;
  const o = ORDINAL_HEADING_RE.exec(s);
  if (o) return { level: PART_WORDS.has(o[1].toLowerCase()) ? 0 : 1, kind: 'ordinal' };
  const m = CHAPTER_RE.exec(s);
  if (m) {
    // "Chapter 3 was the best day" is prose, not a heading: the trailing title
    // part of a real heading rarely starts with a lowercase letter.
    const rest = m[3] || '';
    if (rest && /^\p{Ll}/u.test(rest)) return null;
    if (rest && /[,;]$/.test(rest)) return null;
    // Notes and references such as 'BOOK IV XV. "Agathos" (18): This is...'
    // look like headings but are not.
    if (/\(\d{1,4}\)\s*[:.,]?\s+\S/.test(rest) || /\p{Script=Greek}/u.test(s)) return null;
    if (/^[IVXLC]+\.\s+\S/.test(rest) && rest.length > 20) return null;
    return { level: PART_WORDS.has(m[1].toLowerCase()) ? 0 : 1, kind: 'chapter' };
  }
  if (NAMED_RE.test(s)) return { level: 1, kind: 'named' };
  if (ROMAN_RE.test(s) && s.replace('.', '').length >= 1) return { level: 1, kind: 'roman' };
  if (NUMBER_RE.test(s)) return { level: 1, kind: 'number' };
  return null;
}

function isAllCapsTitle(line) {
  const s = line.trim();
  if (s.length < 3 || s.length > 60) return false;
  const letters = s.match(/\p{L}/gu);
  if (!letters || letters.length < 3) return false;
  const upper = s.match(/\p{Lu}/gu) || [];
  return upper.length / letters.length > 0.9 && !/[.,;:!?]$/.test(s.replace(/\.$/, '')) && !/^THE END\.?$/.test(s);
}

/* ------------------------------------------------------------ paragraphs */

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

const BULLET_RE = /^\s*(?:[-*+\u2022\u25e6\u2023]|\(?(\d{1,3})[.)])\s+(.*)$/;

/** Split raw text into paragraphs (arrays of lines). */
function splitParagraphs(text) {
  const lines = text.split('\n').map((l) => l.replace(/\s+$/, ''));
  const nonEmpty = lines.filter((l) => l.trim());
  const blank = lines.length - nonEmpty.length;
  const lengths = nonEmpty.map((l) => l.trim().length);
  const avg = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const indented = nonEmpty.filter((l) => /^(?: {2,}|\t)\S/.test(l)).length;

  let mode = 'blank';
  if (blank < nonEmpty.length * 0.04) {
    mode = indented > nonEmpty.length * 0.08 && avg < 100 ? 'indent' : 'line';
  }

  const paras = [];
  let cur = [];
  const flush = () => {
    if (cur.length) paras.push(cur);
    cur = [];
  };
  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }
    if (mode === 'line') {
      flush();
      cur.push(line);
      flush();
    } else if (mode === 'indent' && /^(?: {2,}|\t)\S/.test(line)) {
      flush();
      cur.push(line);
    } else {
      cur.push(line);
    }
  }
  flush();
  return { paras, mode, wrap: percentile(lengths, 0.9) };
}

function collapse(s) {
  return s.replace(/[ \t\u00a0]+/g, ' ').trim();
}

/** Join hard-wrapped lines into flowing text. */
function joinLines(lines) {
  let out = '';
  for (const raw of lines) {
    const line = collapse(raw);
    if (!line) continue;
    if (!out) out = line;
    else if (/[-\u2014]$/.test(out) && !/-\s*-$/.test(out) && /^\p{Ll}/u.test(line) && /\p{L}-$/u.test(out)) out += line;
    else if (/(?:--|\u2014)$/.test(out)) out += line;
    else out += ' ' + line;
  }
  return out;
}

/* ------------------------------------------------------- illustrations */

const PLACEHOLDER_LINE = /^\s*\[\s*illustration\b[^\]]*\]\s*$/i;
const PLACEHOLDER_START = /^\[\s*illustration\b/i;

/**
 * Project Gutenberg's plain-text editions mark pictures with "[Illustration]"
 * or "[Illustration: caption]". There is no picture to show, so these are left
 * out. A placeholder that wraps a chapter heading ("[Illustration: TITLE" ...
 * "Chapter I.]") keeps the heading, without the bracket.
 */
function dropIllustrations(paras) {
  const out = [];
  for (let k = 0; k < paras.length; k++) {
    let lines = paras[k];
    while (lines.length > 1 && PLACEHOLDER_LINE.test(lines[0])) lines = lines.slice(1);
    const joined = lines.map((l) => l.trim()).join(' ');
    if (PLACEHOLDER_START.test(joined)) {
      if (/\]\s*$/.test(joined)) continue;
      let end = -1;
      for (let j = k + 1; j < Math.min(paras.length, k + 5); j++) {
        if (/\]\s*$/.test(paras[j].map((l) => l.trim()).join(' '))) {
          end = j;
          break;
        }
      }
      if (end > 0) {
        const last = paras[end].map((l) => l.replace(/\]\s*$/, ''));
        if (classifyHeading(last[0])) out.push(last);
        k = end;
        continue;
      }
    }
    out.push(lines);
  }
  return out;
}

/* --------------------------------------------------------------- parser */

/**
 * Parse plain text into a book.
 * @param {string} rawText
 * @param {{fileName?: string}} opts
 */
export function parsePlainText(rawText, opts = {}) {
  const text = normalizeText(rawText);
  const split = splitParagraphs(text);
  const paras = dropIllustrations(split.paras);
  const { wrap } = split;
  const meta = detectMetadata(paras);

  /** @type {Array<{t:string,x:string,brk?:number,n?:number,_h?:any,_sub?:boolean}>} */
  const blocks = [];
  for (const lines of paras) {
    const first = lines[0];
    // Project Gutenberg's "*** START/END OF THE PROJECT GUTENBERG EBOOK ... ***" markers.
    if (PG_START_RE.test(first.trim())) {
      blocks.push({ t: 'p', x: joinLines(lines), _pg: 'start' });
      continue;
    }
    if (PG_END_RE.test(first.trim())) {
      blocks.push({ t: 'p', x: joinLines(lines), _pg: 'end' });
      continue;
    }
    // Setext-style underlined heading: "Title" followed by "=====".
    if (lines.length === 2 && /^\s*[=]{3,}\s*$/.test(lines[1]) && first.trim().length < 100) {
      blocks.push({ t: 'h2', x: collapse(first), _h: { level: 1, kind: 'underlined' } });
      continue;
    }
    if (lines.length === 1 && DIVIDER_RE.test(first.trim())) {
      blocks.push({ t: 'hr', x: '' });
      continue;
    }
    // A heading line, possibly followed by a short title line in the same paragraph.
    const h = classifyHeading(first);
    // (A subtitle such as "THE FIRST LETTER." under "CHAPTER XXXII." is not a second heading.)
    const subHeading = (l) => {
      const c = classifyHeading(l);
      return c && c.kind !== 'ordinal';
    };
    if (h && lines.length <= 3 && lines.every((l) => l.trim().length <= 90) && !lines.slice(1).some(subHeading)) {
      blocks.push({ t: h.level === 0 ? 'h1' : 'h2', x: collapse(first), _h: h });
      for (const sub of lines.slice(1)) blocks.push({ t: 'h3', x: collapse(sub), _sub: true });
      continue;
    }
    // Bulleted / numbered lists.
    if (lines.length >= 2 && lines.every((l) => BULLET_RE.test(l))) {
      for (const l of lines) {
        const m = BULLET_RE.exec(l);
        const item = { t: 'li', x: collapse(m[2]) };
        if (m[1]) item.n = Number(m[1]);
        blocks.push(item);
      }
      continue;
    }
    if (lines.length === 1) {
      const lead = /^(\s*)/.exec(first)[1].replace(/\t/g, '    ').length;
      const s = collapse(first);
      if (lead >= 10 && s.length < 70) {
        blocks.push({ t: 'center', x: s });
        continue;
      }
      if (isAllCapsTitle(s)) {
        blocks.push({ t: 'p', x: s, _caps: true });
        continue;
      }
      blocks.push({ t: 'p', x: s });
      continue;
    }
    // Verse / addresses / letters: short lines keep their line breaks.
    const shortLimit = Math.max(30, wrap * 0.72);
    const body = lines.slice(0, -1);
    const isVerse = wrap > 40 && body.length >= 1 && body.every((l) => l.trim().length < shortLimit);
    if (isVerse) {
      blocks.push({ t: 'p', x: lines.map(collapse).join('\n'), _verse: true });
    } else {
      blocks.push({ t: 'p', x: joinLines(lines) });
    }
  }

  // Project Gutenberg (and plain text in general) marks italics with underscores.
  for (const b of blocks) {
    if (b.t === 'hr' || !b.x) continue;
    const it = underscoreItalics(b.x);
    if (it) {
      b.x = it.x;
      b.m = it.m;
    }
  }

  const toc = buildToc(blocks);
  for (const b of blocks) {
    delete b._h;
    delete b._sub;
    delete b._caps;
    delete b._verse;
    delete b._pg;
  }

  return finalizeBook({
    blocks,
    toc,
    meta: {
      title: meta.title || titleFromFileName(opts.fileName),
      author: meta.author || '',
      language: meta.language || '',
      format: 'txt',
      sourceName: opts.fileName || '',
    },
  });
}

/** Decide which heading candidates are real chapters and build the TOC. */
function buildToc(blocks) {
  // In Project Gutenberg files, only look for chapters inside the book itself,
  // not in the header or the license at the end.
  const pgStart = blocks.findIndex((b) => b._pg === 'start');
  const pgEnd = blocks.findIndex((b) => b._pg === 'end');
  const lo = pgStart >= 0 ? pgStart : -1;
  const hi = pgEnd > lo ? pgEnd : blocks.length;
  for (let i = 0; i < blocks.length; i++) {
    if ((i <= lo || i >= hi) && blocks[i]._h) {
      blocks[i].t = 'p';
      delete blocks[i]._h;
      for (let j = i + 1; j < blocks.length && blocks[j]._sub; j++) blocks[j].t = 'p';
    }
    if ((i <= lo || i >= hi) && blocks[i]._caps) delete blocks[i]._caps;
  }
  const toc = buildChapterToc(blocks);
  if (pgEnd > 0) {
    blocks[pgEnd].brk = 1;
    toc.push({ title: 'Project Gutenberg License', block: pgEnd, level: 0 });
  }
  return toc;
}

function buildChapterToc(blocks) {
  let candidates = [];
  for (let i = 0; i < blocks.length; i++) {
    if (!blocks[i]._h) continue;
    // "The Last Chapter" right after "CHAPTER 32" is that chapter's title, not a new one.
    const prev = blocks[i - 1];
    if (blocks[i]._h.kind === 'ordinal' && prev && prev._h && prev._h.kind !== 'ordinal') {
      delete blocks[i]._h;
      blocks[i].t = 'p';
      continue;
    }
    candidates.push(i);
  }

  // Fall back to ALL-CAPS title lines when there are no explicit chapters
  // (headings like "THE SECOND BOOK" alone do not count as explicit chapters).
  if (candidates.length < 2 || candidates.every((i) => blocks[i]._h.kind === 'ordinal')) {
    const caps = [];
    for (let i = 0; i < blocks.length; i++) if (blocks[i]._caps) caps.push(i);
    if (caps.length >= 3) {
      for (const i of caps) {
        blocks[i].t = 'h2';
        blocks[i]._h = { level: 1, kind: 'caps' };
      }
      candidates = [...new Set([...candidates, ...caps])].sort((a, b) => a - b);
    }
  }

  // Text between consecutive candidates; tiny gaps mean a printed contents list.
  const gapAfter = candidates.map((ci, k) => {
    const end = k + 1 < candidates.length ? candidates[k + 1] : blocks.length;
    let chars = 0;
    for (let j = ci + 1; j < end; j++) if (!blocks[j]._sub) chars += blocks[j].x.length;
    return chars;
  });
  const listing = new Set();
  let run = [];
  // "CHAPTER 1. Loomings." and "Chapter 1" name the same chapter.
  const key = (k) => {
    const x = blocks[candidates[k]].x;
    const m = CHAPTER_RE.exec(x);
    return (m ? `${m[1]} ${m[2]}` : x.replace(/[\s.:]+$/, '')).toLowerCase();
  };
  let firstList = true;
  const closeRun = () => {
    if (run.length >= 3) {
      for (const k of run.slice(0, -1)) listing.add(k);
      // A run normally ends at the first real chapter. When other text follows
      // the book's contents list (a note, a list of pictures), the run ends at
      // the list's last entry instead: the next heading is then the real first
      // chapter, the one the list began with.
      const last = run[run.length - 1];
      const explicit = (k) => blocks[candidates[k]]._h.kind !== 'caps';
      if (firstList && explicit(run[0]) && explicit(last) && last + 1 < candidates.length && key(last + 1) === key(run[0]) && key(last) !== key(run[0])) listing.add(last);
      firstList = false;
    }
    run = [];
  };
  for (let k = 0; k < candidates.length; k++) {
    run.push(k);
    if (gapAfter[k] >= 100) closeRun();
  }
  closeRun();

  const real = candidates.filter((_, k) => !listing.has(k));
  for (let k = 0; k < candidates.length; k++) {
    if (listing.has(k)) {
      const b = blocks[candidates[k]];
      b.t = 'p';
      // Subtitle lines that belonged to a listing entry become plain text too.
      for (let j = candidates[k] + 1; j < blocks.length && blocks[j]._sub; j++) blocks[j].t = 'p';
    }
  }

  // Bare numbers/roman numerals are only headings if there are several of them.
  const weakKinds = new Set(['roman', 'number']);
  const strong = real.filter((i) => !weakKinds.has(blocks[i]._h.kind));
  const weak = real.filter((i) => weakKinds.has(blocks[i]._h.kind));
  let chosen = real;
  if (weak.length && weak.length < 3) {
    for (const i of weak) blocks[i].t = 'p';
    chosen = strong;
  }

  const hasParts = chosen.some((i) => blocks[i]._h.level === 0);
  const toc = [];
  for (const i of chosen) {
    const b = blocks[i];
    b.brk = 1;
    let title = b.x;
    const sub = blocks[i + 1];
    if (sub && sub._sub && sub.t === 'h3') title = `${title.replace(/[.:]\s*$/, '')}: ${sub.x}`;
    else if (sub && !sub._h && sub.t === 'p' && sub.x.length <= 70 && !/[,;]$/.test(sub.x) && !sub.x.includes('\n') && isTitleLike(sub.x)) {
      sub.t = 'h3';
      title = `${title.replace(/[.:]\s*$/, '')}: ${sub.x}`;
    }
    // Front and back matter (Introduction, Notes, Glossary) stay at the top level.
    const level = hasParts ? (b._h.level === 0 || b._h.kind === 'named' ? 0 : 1) : 0;
    if (hasParts && b._h.level !== 0) b.t = 'h2';
    toc.push({ title, block: i, level });
  }
  return toc;
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

/** True when the "word" around position i is a web or e-mail address. */
function inAddress(x, i) {
  let a = i;
  let b = i;
  while (a > 0 && !/\s/.test(x[a - 1])) a--;
  while (b < x.length && !/\s/.test(x[b])) b++;
  return /:\/\/|www\.|@/.test(x.slice(a, b));
}

/**
 * Turn _underscored_ spans into italics. Only balanced pairs count: the opening
 * underscore starts a word and the closing one ends a word, so snake_case words,
 * addresses and stray underscores are left alone.
 * Returns { x, m } with the underscores removed, or null when nothing changed.
 */
export function underscoreItalics(x) {
  if (!x.includes('_')) return null;
  let out = '';
  const m = [];
  let i = 0;
  while (i < x.length) {
    const ch = x[i];
    if (ch === '_' && (i === 0 || !WORD_CHAR.test(x[i - 1])) && i + 1 < x.length && !/[\s_]/.test(x[i + 1]) && !inAddress(x, i)) {
      const j = x.indexOf('_', i + 1);
      if (j > i + 1 && !/\s/.test(x[j - 1]) && (j + 1 >= x.length || !WORD_CHAR.test(x[j + 1]))) {
        const start = out.length;
        out += x.slice(i + 1, j);
        m.push([start, out.length, 'i']);
        i = j + 1;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return m.length ? { x: out, m } : null;
}

function isTitleLike(s) {
  // Short, starts with a capital/quote/digit and does not read like a sentence.
  if (!/^["'\u201c\u2018(\p{Lu}\p{N}]/u.test(s)) return false;
  const words = s.split(/\s+/);
  if (words.length > 10) return false;
  return !/[.!?]["'\u201d\u2019]?$/.test(s) || words.length <= 5;
}

/** Look for "Title:", "Author:" lines and common e-text headers near the start. */
function detectMetadata(paras) {
  const meta = {};
  const head = paras.slice(0, 60);
  for (const lines of head) {
    for (const raw of lines) {
      const line = raw.trim();
      let m;
      if (!meta.title && (m = /^title:\s*(.{1,200})$/i.exec(line))) meta.title = m[1].trim();
      else if (!meta.author && (m = /^(?:author|by|written by):\s*(.{1,200})$/i.exec(line))) meta.author = m[1].trim();
      else if (!meta.language && (m = /^language:\s*([A-Za-z -]{2,40})$/i.exec(line))) meta.language = languageCode(m[1]);
      else if (!meta.title && (m = /^the project gutenberg e-?book,?\s+of\s+(.+?)(?:,\s*by\s+(.+?))?\s*$/i.exec(line))) {
        meta.title = m[1].trim();
        if (m[2] && !meta.author) meta.author = m[2].trim();
      }
    }
  }
  if (!meta.title) {
    // A short first line followed by "by Someone" is a very common title page.
    const first = paras[0] && paras[0].length <= 3 ? paras[0].map((l) => l.trim()) : null;
    const second = paras[1] && paras[1].length === 1 ? paras[1][0].trim() : '';
    if (first && first[0].length <= 80 && !classifyHeading(first[0])) {
      const byInFirst = first.slice(1).find((l) => /^by\s+\S/i.test(l));
      const by = byInFirst || (/^by\s+\S/i.test(second) ? second : '');
      if (by) {
        meta.title = first[0];
        meta.author = meta.author || by.replace(/^by\s+/i, '').trim();
      }
    }
  }
  return meta;
}

const LANGS = { english: 'en', french: 'fr', german: 'de', spanish: 'es', italian: 'it', portuguese: 'pt', dutch: 'nl', latin: 'la', finnish: 'fi', swedish: 'sv' };
function languageCode(name) {
  const key = name.trim().toLowerCase();
  if (/^[a-z]{2}(-[a-z]{2})?$/.test(key)) return key;
  return LANGS[key] || '';
}
