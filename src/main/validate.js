'use strict';
/**
 * Defensive validation for everything that crosses the IPC boundary.
 * The renderer is our own code, but we still treat its input as untrusted:
 * book files are hostile-by-default data and a bug in a parser should never
 * be able to corrupt the library or reach the file system.
 */

const BLOCK_TYPES = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'quote', 'li', 'pre', 'hr', 'center']);
const MARK_TYPES = new Set(['i', 'b', 'c', 'u', 's', 'sup', 'sub']);
const FORMATS = new Set(['txt', 'md', 'html', 'epub', 'pdf', 'sample', 'cbz']);
const STATUSES = new Set(['unread', 'reading', 'finished', 'abandoned']);
const ID_RE = /^[a-z0-9-]{8,64}$/;
const HL_COLORS = new Set(['yellow', 'blue', 'pink', 'orange', 'green']);

function fail(msg) {
  throw new TypeError(`Invalid input: ${msg}`);
}

function string(value, max = 10000) {
  if (typeof value !== 'string') fail('expected string');
  if (value.length > max) fail('string too long');
  return value;
}

function optString(value, max) {
  return value === undefined || value === null ? '' : string(value, max);
}

function int(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) fail('expected integer in range');
  return value;
}

function num(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail('expected number in range');
  return value;
}

function bool(value) {
  if (typeof value !== 'boolean') fail('expected boolean');
  return value;
}

function bookId(value) {
  string(value, 64);
  if (!/^[a-z0-9-]{8,64}$/.test(value)) fail('bad id');
  return value;
}

function fileName(value) {
  const name = string(value, 200)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .trim();
  return name || 'export.txt';
}

/** JSON-safe plain object with a size cap (used for settings/stats). */
function plainObject(value, maxBytes) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected object');
  const json = JSON.stringify(value);
  if (json.length > maxBytes) fail('object too large');
  return JSON.parse(json, noProto);
}

function plainArray(value, maxBytes) {
  if (!Array.isArray(value)) fail('expected array');
  const json = JSON.stringify(value);
  if (json.length > maxBytes) fail('array too large');
  return JSON.parse(json, noProto);
}

function noProto(key, val) {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
  return val;
}

function bookPayload(p) {
  if (!p || typeof p !== 'object') fail('payload');
  const m = p.meta;
  if (!m || typeof m !== 'object') fail('meta');
  const meta = {
    title: string(m.title, 500).trim() || 'Untitled',
    author: optString(m.author, 500).trim(),
    language: optString(m.language, 35),
    format: string(m.format, 10),
    sourceName: optString(m.sourceName, 300),
    totalChars: int(m.totalChars, 0, 500_000_000),
    wordCount: int(m.wordCount, 0, 100_000_000),
    fingerprint: optString(m.fingerprint, 128),
    hash: optString(m.hash, 64),
    series: optString(m.series, 300).trim(),
    seriesIndex: m.seriesIndex === undefined || m.seriesIndex === null ? null : num(m.seriesIndex, 0, 100000),
    publisher: optString(m.publisher, 300).trim(),
    description: optString(m.description, 20000).trim(),
    coverHue: int(m.coverHue, 0, 360),
    coverMotif: optString(m.coverMotif, 20),
  };
  if (!/^[a-z]*$/.test(meta.coverMotif)) fail('coverMotif');
  if (!FORMATS.has(meta.format)) fail('format');
  if (meta.hash && !/^[a-f0-9]{64}$/.test(meta.hash)) fail('hash');

  const c = p.content;
  if (!c || typeof c !== 'object' || !Array.isArray(c.blocks) || !Array.isArray(c.toc)) fail('content');
  let comic = null;
  if (c.kind === 'comic') {
    if (!Array.isArray(c.pages) || c.pages.length === 0 || c.pages.length > 10000) fail('pages');
    comic = { kind: 'comic', pages: c.pages.map((x) => string(x, 500)), rtl: c.rtl === true };
    if (c.blocks.length) fail('comic blocks');
  } else if (c.blocks.length === 0 || c.blocks.length > 2_000_000) fail('block count');
  const blocks = new Array(c.blocks.length);
  let chars = 0;
  for (let i = 0; i < c.blocks.length; i++) {
    const b = c.blocks[i];
    if (!b || typeof b !== 'object') fail('block');
    if (!BLOCK_TYPES.has(b.t)) fail('block type');
    const out = { t: b.t, x: string(b.x, 2_000_000) };
    chars += out.x.length;
    if (b.m !== undefined) {
      if (!Array.isArray(b.m) || b.m.length > 10000) fail('marks');
      out.m = b.m.map((mk) => {
        if (!Array.isArray(mk) || mk.length !== 3) fail('mark');
        const s = int(mk[0], 0, out.x.length);
        const e = int(mk[1], s, out.x.length);
        if (!MARK_TYPES.has(mk[2])) fail('mark type');
        return [s, e, mk[2]];
      });
    }
    if (b.pg !== undefined) out.pg = int(b.pg, 0, 1_000_000);
    if (b.brk !== undefined) out.brk = int(b.brk, 0, 1);
    if (b.n !== undefined) out.n = int(b.n, 0, 1_000_000);
    blocks[i] = out;
  }
  if (chars > 400_000_000) fail('book too large');
  if (c.toc.length > 50000) fail('toc');
  const tocMax = c.kind === 'comic' ? (Array.isArray(c.pages) ? c.pages.length - 1 : 0) : blocks.length - 1;
  const toc = c.toc.map((t) => {
    if (!t || typeof t !== 'object') fail('toc entry');
    return {
      title: string(t.title, 1000),
      block: int(t.block, 0, Math.max(0, tocMax)),
      level: int(t.level, 0, 6),
    };
  });

  let cover = null;
  if (p.cover !== undefined && p.cover !== null) {
    const bytes = p.cover instanceof ArrayBuffer ? new Uint8Array(p.cover) : p.cover;
    if (!(bytes instanceof Uint8Array)) fail('cover');
    if (bytes.byteLength > 5 * 1024 * 1024) fail('cover too large');
    // Must be a JPEG (FF D8 FF) - we only ever store re-encoded canvas output.
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) fail('cover format');
    cover = Buffer.from(bytes);
  }

  let source = null;
  if (p.source !== undefined && p.source !== null) {
    const bytes = p.source instanceof ArrayBuffer ? new Uint8Array(p.source) : p.source;
    if (!(bytes instanceof Uint8Array) || bytes.byteLength > 300 * 1024 * 1024) fail('source');
    source = Buffer.from(bytes);
  }
  const content = comic ? { v: 1, ...comic, blocks: [], toc } : { v: 1, blocks, toc };
  return { meta, content, cover, source };
}

function bookState(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) fail('state');
  const out = {};
  if (s.pos !== undefined) out.pos = int(s.pos, 0, 500_000_000);
  if (s.percent !== undefined) out.percent = num(s.percent, 0, 1);
  if (s.updatedAt !== undefined) out.updatedAt = int(s.updatedAt, 0);
  if (s.deviceId !== undefined) out.deviceId = string(s.deviceId, 32);
  if (s.page !== undefined) out.page = int(s.page, 0, 100000);
  if (s.rtl !== undefined && s.rtl !== null) out.rtl = bool(s.rtl);
  if (s.settings !== undefined && s.settings !== null) out.settings = plainObject(s.settings, 4096);
  if (s.highlights !== undefined) {
    if (!Array.isArray(s.highlights) || s.highlights.length > 50000) fail('highlights');
    out.highlights = s.highlights.map((h) => {
      if (!h || typeof h !== 'object') fail('highlight');
      const start = int(h.s, 0, 500_000_000);
      const color = string(h.c, 16);
      if (!HL_COLORS.has(color)) fail('color');
      return {
        id: string(h.id, 64),
        s: start,
        e: int(h.e, start, 500_000_000),
        c: color,
        note: optString(h.note, 20000),
        text: optString(h.text, 20000),
        at: int(h.at, 0),
        type: h.note ? 'note' : 'highlight',
        updatedAt: h.updatedAt === undefined ? int(h.at, 0) : int(h.updatedAt, 0),
      };
    });
  }
  if (s.bookmarks !== undefined) {
    if (!Array.isArray(s.bookmarks) || s.bookmarks.length > 20000) fail('bookmarks');
    out.bookmarks = s.bookmarks.map((b) => {
      if (!b || typeof b !== 'object') fail('bookmark');
      return { id: string(b.id, 64), type: 'bookmark', o: int(b.o, 0, 500_000_000), text: optString(b.text, 500), at: int(b.at, 0) };
    });
  }
  return out;
}

function metaPatch(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('patch');
  const out = {};
  if (p.title !== undefined) out.title = string(p.title, 500).trim() || 'Untitled';
  if (p.author !== undefined) out.author = string(p.author, 500).trim();
  if (p.lastOpenedAt !== undefined) out.lastOpenedAt = int(p.lastOpenedAt, 0);
  if (p.progress !== undefined) out.progress = num(p.progress, 0, 1);
  if (p.finished !== undefined) out.status = bool(p.finished) ? 'finished' : 'reading';
  if (p.status !== undefined) {
    if (!STATUSES.has(p.status)) fail('status');
    out.status = p.status;
  }
  if (p.rating !== undefined) out.rating = int(p.rating, 0, 5);
  if (p.series !== undefined) out.series = string(p.series, 300).trim();
  if (p.seriesIndex !== undefined) out.seriesIndex = p.seriesIndex === null ? null : num(p.seriesIndex, 0, 100000);
  if (p.publisher !== undefined) out.publisher = string(p.publisher, 300).trim();
  if (p.description !== undefined) out.description = string(p.description, 20000).trim();
  if (p.tags !== undefined) {
    if (!Array.isArray(p.tags) || p.tags.length > 50) fail('tags');
    out.tags = [...new Set(p.tags.map((t) => string(t, 60).trim().toLowerCase()).filter(Boolean))];
  }
  if (p.collectionIds !== undefined) {
    if (!Array.isArray(p.collectionIds) || p.collectionIds.length > 200) fail('collectionIds');
    out.collectionIds = [...new Set(p.collectionIds.map((x) => string(x, 64)))].filter((x) => ID_RE.test(x));
  }
  if (p.readingSeconds !== undefined) out.readingSeconds = int(p.readingSeconds, 0);
  return out;
}

function collections(list) {
  if (!Array.isArray(list) || list.length > 500) fail('collections');
  const seen = new Set();
  return list.map((c, i) => {
    if (!c || typeof c !== 'object') fail('collection');
    const id = string(c.id, 64);
    if (!ID_RE.test(id) || seen.has(id)) fail('collection id');
    seen.add(id);
    return { id, name: string(c.name, 80).trim() || 'Untitled', sortOrder: c.sortOrder === undefined ? i : int(c.sortOrder, 0, 100000) };
  });
}

module.exports = {
  string,
  bookId,
  fileName,
  plainObject,
  plainArray,
  bookPayload,
  bookState,
  metaPatch,
  collections,
};
