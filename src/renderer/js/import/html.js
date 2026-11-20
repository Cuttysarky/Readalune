/**
 * Converts an (inert, DOMParser-created) HTML/XHTML document into book blocks.
 *
 * Security: the source document is never attached to the live page. We only
 * read text and a few attributes from it, so scripts, styles, images and
 * links inside imported files can never run or load anything.
 */
import { finalizeBook, titleFromFileName } from '../core/book.js';
import { decodeText } from './text.js';

const BLOCK = {
  p: 'p', div: 'p', section: 'p', article: 'p', main: 'p', header: 'p', footer: 'p', aside: 'p',
  figure: 'p', nav: 'p', hgroup: 'p', address: 'p', body: 'p', ul: 'p', ol: 'p', dl: 'p', dt: 'p',
  table: 'p', tbody: 'p', thead: 'p', tfoot: 'p', tr: 'p', details: 'p', summary: 'p', fieldset: 'p',
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h4', h6: 'h4',
  blockquote: 'quote', dd: 'quote', li: 'li', pre: 'pre', figcaption: 'center', caption: 'center', center: 'center',
};
const CONTAINERS = new Set(['p', 'div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'figure', 'nav', 'hgroup', 'address', 'body', 'ul', 'ol', 'dl', 'dt', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'details', 'summary', 'fieldset']);
const INHERITED = new Set(['quote', 'li', 'center', 'pre']);
const SKIP = new Set(['script', 'style', 'head', 'title', 'meta', 'link', 'noscript', 'template', 'svg', 'math', 'object', 'embed', 'iframe', 'frame', 'video', 'audio', 'canvas', 'button', 'input', 'select', 'textarea', 'form', 'rt', 'rp', 'map', 'area', 'source', 'track', 'img', 'picture']);
const MARK = { em: 'i', i: 'i', cite: 'i', dfn: 'i', var: 'i', strong: 'b', b: 'b', code: 'c', tt: 'c', kbd: 'c', samp: 'c', u: 'u', ins: 'u', s: 's', strike: 's', del: 's', sup: 'sup', sub: 'sub' };
const MAX_DEPTH = 256;

/**
 * @param {Element} root  element to convert (usually <body>)
 * @param {{ anchorPrefix?: string, blocks?: any[], anchors?: Map<string, number> }} opts
 */
export function htmlToBlocks(root, opts = {}) {
  const blocks = opts.blocks || [];
  const anchors = opts.anchors || new Map();
  const prefix = opts.anchorPrefix || '';
  let buf = '';
  let marks = [];

  const flush = (ctx) => {
    let text = buf;
    // Trim trailing whitespace; leading whitespace is never added.
    text = text.replace(/[ \n]+$/, '');
    if (/\S/.test(text)) {
      const b = { t: ctx.type, x: text };
      const m = marks.map(([s, e, k]) => [Math.min(s, text.length), Math.min(e, text.length), k]).filter(([s, e]) => e > s);
      if (m.length) b.m = m;
      if (ctx.type === 'li' && ctx.n) b.n = ctx.n;
      blocks.push(b);
    }
    buf = '';
    marks = [];
  };

  const appendText = (raw, ctx) => {
    if (ctx.pre) {
      buf += raw;
      return;
    }
    let s = raw.replace(/[\s\u00a0]+/g, (m) => (m.includes('\u00a0') && !/[\t\n\r ]/.test(m) ? '\u00a0' : ' '));
    if (!buf || buf.endsWith(' ') || buf.endsWith('\n')) s = s.replace(/^ +/, '');
    buf += s;
  };

  const walk = (node, ctx, depth) => {
    if (depth > MAX_DEPTH) {
      appendText(node.textContent || '', ctx);
      return;
    }
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3 || child.nodeType === 4) {
        appendText(child.nodeValue || '', ctx);
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = (child.localName || child.nodeName || '').toLowerCase();
      if (SKIP.has(tag)) continue;
      if (child.hasAttribute('hidden') || /display\s*:\s*none/i.test(child.getAttribute('style') || '')) continue;

      const id = child.getAttribute('id') || (tag === 'a' ? child.getAttribute('name') : null);
      const blockType = BLOCK[tag];
      if (blockType || tag === 'hr') flush(ctx);
      if (id) anchors.set(prefix + '#' + id, blocks.length);

      if (tag === 'br') {
        buf = buf.replace(/ +$/, '') + '\n';
        continue;
      }
      if (tag === 'hr') {
        blocks.push({ t: 'hr', x: '' });
        continue;
      }
      if (tag === 'td' || tag === 'th') {
        if (buf && !buf.endsWith(' ')) buf += ' ';
        if (child.previousElementSibling) buf += '\u00b7 ';
        walk(child, ctx, depth + 1);
        buf += ' ';
        continue;
      }
      if (blockType) {
        let type = blockType;
        if (CONTAINERS.has(tag) && INHERITED.has(ctx.type)) type = ctx.type;
        if (type === 'p' && isCentered(child)) type = 'center';
        const next = { type, pre: ctx.pre || tag === 'pre', ol: ctx.ol, n: ctx.type === 'li' ? ctx.n : 0 };
        if (tag === 'ol') next.ol = { n: parseInt(child.getAttribute('start') || '1', 10) || 1 };
        if (tag === 'ul') next.ol = null;
        if (tag === 'li') next.n = ctx.ol ? ctx.ol.n++ : 0;
        walk(child, next, depth + 1);
        flush(next);
        continue;
      }
      const mark = MARK[tag];
      if (mark) {
        const start = buf.length;
        walk(child, ctx, depth + 1);
        if (buf.length > start) marks.push([start, buf.length, mark]);
        continue;
      }
      walk(child, ctx, depth + 1);
    }
  };

  walk(root, { type: 'p', pre: false, ol: null, n: 0 }, 0);
  flush({ type: 'p' });
  return { blocks, anchors };
}

function isCentered(el) {
  if ((el.getAttribute('align') || '').toLowerCase() === 'center') return true;
  if (/text-align\s*:\s*center/i.test(el.getAttribute('style') || '')) return true;
  return /(?:^|[\s_-])(center|centered|centre)(?:$|[\s_-])/i.test(el.getAttribute('class') || '');
}

/** Build a TOC from headings and add page breaks before top-level ones. */
export function headingToc(blocks, fromIndex = 0) {
  const level = (t) => (t === 'h1' ? 1 : t === 'h2' ? 2 : t === 'h3' ? 3 : 0);
  let h1 = 0;
  for (let i = fromIndex; i < blocks.length; i++) if (blocks[i].t === 'h1') h1++;
  const breakLevel = h1 <= 1 ? 2 : 1;
  const base = h1 <= 1 ? 2 : 1;
  const toc = [];
  for (let i = fromIndex; i < blocks.length; i++) {
    const l = level(blocks[i].t);
    if (!l) continue;
    if (l <= breakLevel) blocks[i].brk = 1;
    if (l <= 3 && !(h1 === 1 && l === 1)) toc.push({ title: blocks[i].x.replace(/\n/g, ' '), block: i, level: Math.max(0, l - base) });
  }
  return toc;
}

// HTML named entities that XML does not know, as code points. Many EPUBs use
// them; converting first avoids an XML parse error (and a second parse).
const HTML_ENTITIES = {
  nbsp: 160, iexcl: 161, cent: 162, pound: 163, yen: 165, sect: 167, uml: 168, copy: 169, laquo: 171, not: 172, shy: 173, reg: 174, deg: 176,
  plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, sup1: 185, raquo: 187, frac14: 188, frac12: 189, frac34: 190,
  iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201,
  Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213,
  Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, szlig: 223, agrave: 224, aacute: 225, acirc: 226,
  atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237,
  icirc: 238, iuml: 239, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249,
  uacute: 250, ucirc: 251, uuml: 252, yuml: 255, OElig: 338, oelig: 339, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218,
  ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, prime: 8242, Prime: 8243, lsaquo: 8249,
  rsaquo: 8250, euro: 8364, trade: 8482, larr: 8592, rarr: 8594, thinsp: 8201, ensp: 8194, emsp: 8195, zwnj: 8204, zwj: 8205,
};

function numericEntities(text) {
  return text.replace(/&([A-Za-z][A-Za-z0-9]{1,10});/g, (m, name) => (HTML_ENTITIES[name] ? `&#${HTML_ENTITIES[name]};` : m));
}

/** Parse a markup string without executing or loading anything. */
export function parseMarkup(text, preferXml) {
  const parser = new DOMParser();
  if (preferXml) {
    const doc = parser.parseFromString(numericEntities(text), 'application/xhtml+xml');
    if (!doc.getElementsByTagName('parsererror').length) return doc;
  }
  return parser.parseFromString(text, 'text/html');
}

/** Importer for standalone .html / .htm / .xhtml files. */
export function parseHtmlFile(bytes, opts = {}) {
  const text = decodeText(bytes);
  const doc = parseMarkup(text, /\.xhtml$/i.test(opts.fileName || ''));
  const body = doc.body || doc.documentElement;
  const { blocks } = htmlToBlocks(body);
  const toc = headingToc(blocks);
  const titleEl = doc.querySelector('title');
  const firstH1 = blocks.find((b) => b.t === 'h1');
  const metaAuthor = doc.querySelector('meta[name="author" i]');
  return finalizeBook({
    blocks,
    toc,
    meta: {
      title: (titleEl && titleEl.textContent.trim()) || (firstH1 && firstH1.x) || titleFromFileName(opts.fileName),
      author: metaAuthor ? metaAuthor.getAttribute('content') || '' : '',
      language: (doc.documentElement.getAttribute('lang') || '').slice(0, 20),
      format: 'html',
      sourceName: opts.fileName || '',
    },
  });
}
