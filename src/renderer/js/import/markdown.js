/**
 * Markdown importer. Supports the commonly used subset: headings, paragraphs,
 * emphasis, code, block quotes, lists, rules, tables and front matter.
 * Links and images keep their visible text only - nothing is ever fetched.
 */
import { finalizeBook, titleFromFileName } from '../core/book.js';
import { normalizeText } from './text.js';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', copy: '\u00a9', reg: '\u00ae', trade: '\u2122', lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d' };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]{2,8});/gi, (all, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : all;
    }
    const v = ENTITIES[code.toLowerCase()];
    return v === undefined ? all : v;
  });
}

/**
 * Parse inline Markdown into plain text plus style ranges.
 * @returns {{ text: string, marks: Array<[number, number, string]> }}
 */
export function parseInline(src) {
  const marks = [];
  const text = inline(src, marks, 0, 0);
  return { text, marks };
}

const EMPH = { '*': true, _: true, '~': true };

function inline(src, marks, base, depth) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    // Backslash escapes.
    if (ch === '\\' && i + 1 < n && /[!-\/:-@\[-`{-~]/.test(src[i + 1])) {
      out += src[i + 1];
      i += 2;
      continue;
    }
    // Code spans.
    if (ch === '`') {
      let run = 1;
      while (src[i + run] === '`') run++;
      const fence = '`'.repeat(run);
      const close = src.indexOf(fence, i + run);
      if (close !== -1) {
        const code = src.slice(i + run, close).replace(/^ (.*) $/, '$1');
        marks.push([base + out.length, base + out.length + code.length, 'c']);
        out += code;
        i = close + run;
        continue;
      }
      out += fence;
      i += run;
      continue;
    }
    // Images: keep alt text.
    if (ch === '!' && src[i + 1] === '[') {
      const link = matchLink(src, i + 1);
      if (link) {
        if (link.label.trim()) {
          const start = out.length;
          out += inline(link.label, marks, base + out.length, depth + 1);
          marks.push([base + start, base + out.length, 'i']);
        }
        i = link.end;
        continue;
      }
    }
    // Links: keep the visible label.
    if (ch === '[') {
      const link = matchLink(src, i);
      if (link) {
        const start = out.length;
        out += inline(link.label, marks, base + out.length, depth + 1);
        marks.push([base + start, base + out.length, 'u']);
        i = link.end;
        continue;
      }
    }
    // Autolinks <https://...> and inline HTML tags.
    if (ch === '<') {
      const auto = /^<((?:https?|mailto):[^\s<>]{1,2000})>/i.exec(src.slice(i, i + 2100));
      if (auto) {
        out += auto[1];
        i += auto[0].length;
        continue;
      }
      const tag = /^<\/?([a-z][a-z0-9-]*)(?:\s[^<>]{0,1000})?\/?>/i.exec(src.slice(i, i + 1100));
      if (tag) {
        if (tag[1].toLowerCase() === 'br') out += '\n';
        i += tag[0].length;
        continue;
      }
    }
    if (ch === '&') {
      const ent = /^&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]{2,8});/i.exec(src.slice(i, i + 12));
      if (ent) {
        out += decodeEntities(ent[0]);
        i += ent[0].length;
        continue;
      }
    }
    // Emphasis: *, _, ~~
    if (EMPH[ch] && depth < 8) {
      let run = 1;
      while (src[i + run] === ch) run++;
      const prev = i > 0 ? src[i - 1] : ' ';
      const next = src[i + run] || ' ';
      const leftFlanking = !/\s/.test(next);
      const intraword = ch === '_' && /[\p{L}\p{N}]/u.test(prev);
      if (ch === '~' && run !== 2) {
        out += src.slice(i, i + run);
        i += run;
        continue;
      }
      if (leftFlanking && !intraword && run <= 3) {
        const close = findCloser(src, i + run, ch, run);
        if (close !== -1) {
          const inner = src.slice(i + run, close);
          const start = out.length;
          out += inline(inner, marks, base + out.length, depth + 1);
          const s = base + start;
          const e = base + out.length;
          if (ch === '~') marks.push([s, e, 's']);
          else {
            if (run === 1 || run === 3) marks.push([s, e, 'i']);
            if (run >= 2) marks.push([s, e, 'b']);
          }
          i = close + run;
          continue;
        }
      }
      out += src.slice(i, i + run);
      i += run;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function findCloser(src, from, ch, run) {
  const fence = ch.repeat(run);
  let i = from;
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2;
      continue;
    }
    if (src[i] === '`') {
      const close = src.indexOf('`', i + 1);
      i = close === -1 ? i + 1 : close + 1;
      continue;
    }
    if (src.startsWith(fence, i) && src[i + run] !== ch && (i === 0 || src[i - 1] !== ch)) {
      const before = src[i - 1];
      const after = src[i + run] || ' ';
      const rightFlanking = before !== undefined && !/\s/.test(before);
      const intraword = ch === '_' && /[\p{L}\p{N}]/u.test(after);
      if (rightFlanking && !intraword && i > from) return i;
    }
    i++;
  }
  return -1;
}

function matchLink(src, i) {
  // [label](url "title") or [label][ref] or [label]
  let depth = 0;
  let j = i;
  for (; j < src.length; j++) {
    if (src[j] === '\\') {
      j++;
      continue;
    }
    if (src[j] === '[') depth++;
    else if (src[j] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0 || j >= src.length) return null;
  const label = src.slice(i + 1, j);
  if (src[j + 1] === '(') {
    let k = j + 2;
    let parens = 1;
    for (; k < src.length && parens > 0; k++) {
      if (src[k] === '(') parens++;
      else if (src[k] === ')') parens--;
    }
    if (parens !== 0) return null;
    return { label, end: k };
  }
  if (src[j + 1] === '[') {
    const close = src.indexOf(']', j + 2);
    if (close !== -1) return { label, end: close + 1 };
  }
  return null;
}

/* ------------------------------------------------------------- blocks */

const HR_RE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const ATX_RE = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const LIST_RE = /^( {0,3})([-*+]|(\d{1,9})[.)])(?:[ \t]+(.*))?$/;
const QUOTE_RE = /^ {0,3}> ?(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

export function parseMarkdown(rawText, opts = {}) {
  let text = normalizeText(rawText);
  const meta = {};

  // YAML front matter.
  const fm = /^---\n([\s\S]{0,20000}?)\n(?:---|\.\.\.)\n/.exec(text);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = /^(title|author|language|lang)\s*:\s*["']?(.*?)["']?\s*$/i.exec(line);
      if (m && m[2]) {
        const key = m[1].toLowerCase() === 'lang' ? 'language' : m[1].toLowerCase();
        meta[key] = m[2];
      }
    }
    text = text.slice(fm[0].length);
  }

  const lines = text.split('\n');
  const blocks = [];
  let para = [];

  const pushInline = (t, src, extra) => {
    // Collapse whitespace first so style ranges stay aligned with the final text.
    const clean = t === 'pre' ? src : src.replace(/[ \t\u00a0]+/g, ' ').replace(/ ?<br\s*\/?> ?/gi, '<br>').trim();
    const { text: x, marks } = parseInline(clean);
    const b = { t, x, ...extra };
    if (marks.length) b.m = clampMarks(marks, x.length);
    blocks.push(b);
  };

  const flushPara = () => {
    if (!para.length) return;
    // Hard line breaks: two trailing spaces or a trailing backslash.
    const src = para
      .map((l, idx) => {
        const hard = idx < para.length - 1 && (/ {2,}$/.test(l) || /\\$/.test(l));
        return l.replace(/\\$/, '').trim() + (hard ? '<br>' : '');
      })
      .join(' ');
    pushInline('p', src);
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      flushPara();
      continue;
    }

    // Fenced code.
    const fence = FENCE_RE.exec(line);
    if (fence) {
      flushPara();
      const marker = fence[1];
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker[0].repeat(marker.length))) {
        code.push(lines[i]);
        i++;
      }
      blocks.push({ t: 'pre', x: code.join('\n') });
      continue;
    }

    // Setext headings.
    if (para.length && /^ {0,3}=+\s*$/.test(line)) {
      const src = para.join(' ');
      para = [];
      pushInline('h1', src, { _lvl: 1 });
      continue;
    }
    if (para.length && /^ {0,3}-+\s*$/.test(line)) {
      const src = para.join(' ');
      para = [];
      pushInline('h2', src, { _lvl: 2 });
      continue;
    }

    if (HR_RE.test(line)) {
      flushPara();
      blocks.push({ t: 'hr', x: '' });
      continue;
    }

    const atx = ATX_RE.exec(line);
    if (atx) {
      flushPara();
      const level = atx[1].length;
      const t = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
      pushInline(t, atx[2] || '', { _lvl: level });
      continue;
    }

    const quote = QUOTE_RE.exec(line);
    if (quote) {
      flushPara();
      const q = [quote[1]];
      while (i + 1 < lines.length && lines[i + 1].trim() && (QUOTE_RE.test(lines[i + 1]) || !/^\s*$/.test(lines[i + 1]))) {
        const next = lines[i + 1];
        const qm = QUOTE_RE.exec(next);
        if (!qm && (ATX_RE.test(next) || HR_RE.test(next) || LIST_RE.test(next) || FENCE_RE.test(next))) break;
        q.push(qm ? qm[1] : next);
        i++;
      }
      // Paragraphs inside the quote are separated by empty '>' lines.
      let chunk = [];
      const flushQ = () => {
        if (chunk.length) pushInline('quote', chunk.map((l) => l.replace(/^>\s?/, '').trim()).join(' '));
        chunk = [];
      };
      for (const l of q) {
        if (!l.trim()) flushQ();
        else chunk.push(l);
      }
      flushQ();
      continue;
    }

    const li = LIST_RE.exec(line);
    if (li && (para.length === 0 || li[3] === undefined || li[3] === '1')) {
      flushPara();
      const item = [li[4] || ''];
      const indent = li[1].length + li[2].length + 1;
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (!next.trim() || LIST_RE.test(next) || ATX_RE.test(next) || HR_RE.test(next) || FENCE_RE.test(next) || QUOTE_RE.test(next)) break;
        if (/^\s/.test(next) || next.length - next.trimStart().length >= Math.min(indent, 2) || !para.length) {
          item.push(next.trim());
          i++;
        } else break;
      }
      const src = item.join(' ').replace(/^\[([ xX])\]\s+/, (_m, c) => (c === ' ' ? '\u2610 ' : '\u2611 '));
      pushInline('li', src, li[3] !== undefined ? { n: Math.min(1_000_000, Number(li[3])) } : undefined);
      continue;
    }

    // Tables: keep them as aligned monospace text.
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      flushPara();
      const rows = [line];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(lines[i]);
        i++;
      }
      i--;
      blocks.push({ t: 'pre', x: formatTable(rows) });
      continue;
    }

    // Indented code (only when not continuing a paragraph).
    if (!para.length && /^(?: {4}|\t)/.test(line)) {
      const code = [line.replace(/^(?: {4}|\t)/, '')];
      while (i + 1 < lines.length && (/^(?: {4}|\t)/.test(lines[i + 1]) || !lines[i + 1].trim())) {
        code.push(lines[i + 1].replace(/^(?: {4}|\t)/, ''));
        i++;
      }
      while (code.length && !code[code.length - 1].trim()) code.pop();
      blocks.push({ t: 'pre', x: code.join('\n') });
      continue;
    }

    para.push(line);
  }
  flushPara();

  // Chapters: break pages on top-level headings. A single "# Title" followed by
  // "## Chapter" headings is the most common layout, so then break on h2 too.
  const h1Count = blocks.filter((b) => b._lvl === 1).length;
  const breakLevel = h1Count <= 1 ? 2 : 1;
  const toc = [];
  let firstHeading = null;
  blocks.forEach((b, idx) => {
    if (!b._lvl) return;
    if (!firstHeading && b._lvl === 1) firstHeading = b.x;
    if (b._lvl <= breakLevel) b.brk = 1;
    if (b._lvl <= 3) toc.push({ title: b.x, block: idx, level: Math.max(0, b._lvl - (h1Count <= 1 ? 2 : 1)) });
    delete b._lvl;
  });
  // The document title heading itself is not a chapter.
  if (h1Count === 1 && toc.length > 1 && toc[0].title === firstHeading) toc.shift();

  return finalizeBook({
    blocks,
    toc,
    meta: {
      title: meta.title || firstHeading || titleFromFileName(opts.fileName),
      author: meta.author || '',
      language: meta.language || '',
      format: opts.format || 'md',
      sourceName: opts.fileName || '',
    },
  });
}

function clampMarks(marks, len) {
  return marks
    .map(([s, e, t]) => [Math.max(0, Math.min(len, s)), Math.max(0, Math.min(len, e)), t])
    .filter(([s, e]) => e > s);
}

function formatTable(rows) {
  const cells = rows.map((r) =>
    r
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => parseInline(c.trim()).text)
  );
  const cols = Math.max(...cells.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) => Math.min(40, Math.max(...cells.map((r) => (r[c] || '').length))));
  const fmt = (r) => r.map((c, idx) => (c || '').padEnd(widths[idx])).join('  \u2502  ').trimEnd();
  return [fmt(cells[0]), widths.map((w) => '\u2500'.repeat(w)).join('\u2500\u2500\u253c\u2500\u2500'), ...cells.slice(1).map(fmt)].join('\n');
}
