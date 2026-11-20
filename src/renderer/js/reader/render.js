/**
 * Builds DOM for book blocks and maps between DOM positions and book offsets.
 * Text is always inserted with text nodes, never parsed as HTML.
 */

const BLOCK_TAG = { p: 'p', h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', quote: 'blockquote', li: 'div', pre: 'pre', hr: 'hr', center: 'p' };
const MARK_TAG = { i: 'em', b: 'strong', c: 'code', u: 'u', s: 's', sup: 'sup', sub: 'sub' };
const MARK_ORDER = ['b', 'i', 'u', 's', 'c', 'sup', 'sub'];

export function renderBlock(block, index) {
  const el = document.createElement(BLOCK_TAG[block.t] || 'p');
  el.className = `blk t-${block.t}`;
  el.dataset.b = String(index);
  if (block.t === 'li' && block.n) el.dataset.n = String(block.n);
  if (block.t === 'hr') return el;
  // A one-line paragraph (a byline, a date, a word of dialogue) opening a chapter gets no drop cap.
  if (block.t === 'p' && block.x.length < 60) el.classList.add('t-brief');
  // A long web address cannot be split across lines, so in justified text the line before
  // it is stretched thin. A short paragraph that holds one is set ragged-right instead.
  if (block.t === 'p' && block.x.length < 200 && /\S{24,}/.test(block.x)) el.classList.add('t-ragged');
  if (!block.m || !block.m.length) {
    el.textContent = block.x;
    return el;
  }
  // Split text at every style boundary and wrap each piece in its styles.
  const cuts = new Set([0, block.x.length]);
  for (const [s, e] of block.m) {
    cuts.add(s);
    cuts.add(e);
  }
  const points = [...cuts].sort((a, b) => a - b);
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k];
    const b = points[k + 1];
    if (b <= a) continue;
    let node = document.createTextNode(block.x.slice(a, b));
    const active = new Set();
    for (const [s, e, t] of block.m) if (s <= a && e >= b) active.add(t);
    for (const t of MARK_ORDER) {
      if (!active.has(t)) continue;
      const wrap = document.createElement(MARK_TAG[t]);
      wrap.append(node);
      node = wrap;
    }
    el.append(node);
  }
  return el;
}

export function renderRange(book, startBlock, endBlock) {
  const frag = document.createDocumentFragment();
  for (let i = startBlock; i < endBlock; i++) frag.append(renderBlock(book.blocks[i], i));
  return frag;
}

/** Find (textNode, offset) for character k inside a block element. */
export function locate(el, k) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let last = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.nodeValue.length;
    if (k < seen + len) return { node: n, offset: k - seen };
    seen += len;
    last = n;
  }
  return last ? { node: last, offset: last.nodeValue.length } : null;
}

/** Closest block element for a DOM node. */
export function blockElementOf(node) {
  let el = node && (node.nodeType === 1 ? node : node.parentElement);
  while (el && !(el.dataset && el.dataset.b !== undefined)) el = el.parentElement;
  return el;
}

/** Convert a DOM position into a global book offset. */
export function offsetFromDom(book, node, offset) {
  const el = blockElementOf(node);
  if (!el) return null;
  const index = Number(el.dataset.b);
  const r = document.createRange();
  r.setStart(el, 0);
  try {
    r.setEnd(node, offset);
  } catch {
    return book.starts[index];
  }
  return book.starts[index] + Math.min(r.toString().length, book.blocks[index].x.length);
}

/**
 * Wrap the text between two global offsets in elements made by `make()`.
 * `blockEls` maps block index -> element for the rendered section.
 */
export function wrapOffsets(book, blockEls, start, end, make) {
  const created = [];
  for (const [index, el] of blockEls) {
    const bStart = book.starts[index];
    const bEnd = bStart + book.blocks[index].x.length;
    if (bEnd <= start || bStart >= end) continue;
    const s = Math.max(0, start - bStart);
    const e = Math.min(bEnd, end) - bStart;
    if (e <= s) continue;
    // Collect text nodes overlapping [s, e) first, then split/wrap them.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const targets = [];
    let seen = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const len = n.nodeValue.length;
      const a = Math.max(s, seen);
      const b = Math.min(e, seen + len);
      if (b > a) targets.push({ node: n, from: a - seen, to: b - seen });
      seen += len;
      if (seen >= e) break;
    }
    for (const { node, from, to } of targets) {
      let target = node;
      if (from > 0) target = target.splitText(from);
      if (to - from < target.nodeValue.length) target.splitText(to - from);
      const wrap = make();
      target.parentNode.insertBefore(wrap, target);
      wrap.append(target);
      created.push(wrap);
    }
  }
  return created;
}

/** Remove wrapper elements, keeping their text, and merge split text nodes. */
export function unwrap(elements) {
  const parents = new Set();
  for (const w of elements) {
    const parent = w.parentNode;
    if (!parent) continue;
    while (w.firstChild) parent.insertBefore(w.firstChild, w);
    parent.removeChild(w);
    parents.add(blockElementOf(parent) || parent);
  }
  for (const p of parents) p.normalize();
}
