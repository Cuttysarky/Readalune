/**
 * Pagination engine.
 *
 * A section of the book is laid out with CSS multi-column layout: every
 * column is exactly one page. We then work out at which book offset each
 * column starts, which gives us real page numbers that follow the reader's
 * font, size and window. Turning a page just slides the columns sideways.
 *
 * Page counts for the rest of the book are measured in the background in an
 * invisible copy of the page, so "page X of Y" is exact once that finishes
 * (until then it is a close estimate).
 */
import { renderRange, locate } from './render.js';
import { sectionIndexAt, lastIndexAtOrBefore } from '../core/book.js';
import { marginFraction, layoutSignature } from '../settings.js';

const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16)));

export class Paginator {
  constructor({ area, viewport, content, measureWrap, measure, book, settings, language, onChange, decorate }) {
    Object.assign(this, { area, viewport, content, measureWrap, measure, book, settings, onChange, decorate });
    this.si = -1;
    this.view = 0;
    this.colStarts = [];
    this.blockEls = new Map();
    this.sectionCols = new Array(book.sections.length).fill(null);
    this.measuredCount = 0;
    this.measuredChars = 0;
    this.measuredCols = 0;
    this.measureToken = 0;
    this.sig = '';
    this.geometry = null;
    this.content.lang = language || 'en';
    this.measure.lang = language || 'en';
  }

  destroy() {
    this.measureToken++;
    this.onChange = null;
    this.content.replaceChildren();
    this.measure.replaceChildren();
  }

  /* ------------------------------------------------------------ geometry */

  computeGeometry() {
    const s = this.settings;
    const areaW = Math.floor(this.area.clientWidth);
    const areaH = Math.floor(this.area.clientHeight);
    const fs = s.fontSize;
    const hMargin = Math.max(20, Math.round(areaW * marginFraction(s)));
    const vMargin = Math.max(14, Math.round(fs * 0.7));
    const maxCol = Math.round(fs * 38);
    let cpv = 1;
    if (s.layout === 'two') cpv = 2;
    else if (s.layout === 'auto') cpv = areaW >= 1080 && areaW > areaH * 1.15 && (areaW - 2 * hMargin) / 2 >= fs * 17 ? 2 : 1;
    const gap = cpv === 2 ? Math.max(56, Math.round(hMargin * 1.6)) : Math.max(40, hMargin * 2);
    let colW = cpv === 2 ? Math.floor((areaW - 2 * hMargin - gap) / 2) : areaW - 2 * hMargin;
    colW = Math.max(160, Math.min(colW, maxCol));
    const width = cpv * colW + (cpv - 1) * gap;
    const height = Math.max(120, areaH - 2 * vMargin);
    return {
      cpv,
      colW,
      gap,
      width,
      height,
      left: Math.max(0, Math.round((areaW - width) / 2)),
      top: vMargin,
      sig: `${layoutSignature(s)}|${areaW}x${areaH}|${cpv}`,
    };
  }

  applyGeometry(g) {
    for (const [vp, ct] of [
      [this.viewport, this.content],
      [this.measureWrap, this.measure],
    ]) {
      Object.assign(vp.style, { left: `${g.left}px`, top: `${g.top}px`, width: `${g.width}px`, height: `${g.height}px` });
      Object.assign(ct.style, { width: `${g.width}px`, height: `${g.height}px`, columnWidth: `${g.colW}px`, columnGap: `${g.gap}px` });
    }
    this.area.style.setProperty('--spread-gap', `${g.gap}px`);
    this.area.dataset.spread = g.cpv === 2 ? 'two' : 'one';
  }

  /* ------------------------------------------------------ column mapping */

  colOf(x, base) {
    const g = this.geometry;
    return Math.max(0, Math.floor((x - base + 2) / (g.colW + g.gap)));
  }

  blockRects(el) {
    if (el.firstChild) {
      const r = document.createRange();
      r.selectNodeContents(el);
      const rects = r.getClientRects();
      if (rects.length) return rects;
    }
    return el.getClientRects();
  }

  firstCol(el, base) {
    const rects = this.blockRects(el);
    return rects.length ? this.colOf(rects[0].left, base) : 0;
  }

  lastCol(el, base) {
    const rects = this.blockRects(el);
    return rects.length ? this.colOf(rects[rects.length - 1].left, base) : 0;
  }

  charCol(el, k, base) {
    const len = el.textContent.length;
    for (let j = k; j < Math.min(len, k + 12); j++) {
      const loc = locate(el, j);
      if (!loc) break;
      const r = document.createRange();
      r.setStart(loc.node, loc.offset);
      r.setEnd(loc.node, Math.min(loc.node.nodeValue.length, loc.offset + 1));
      const rects = r.getClientRects();
      for (const rect of rects) if (rect.width > 0 || rect.height > 0) return this.colOf(rect.left, base);
    }
    return -1;
  }

  /** The book offset at which column `col` begins. */
  offsetAtColumn(els, base, col, sec) {
    let lo = 0;
    let hi = els.length - 1;
    let ans = els.length;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.lastCol(els[mid], base) >= col) {
        ans = mid;
        hi = mid - 1;
      } else lo = mid + 1;
    }
    if (ans >= els.length) return sec.end;
    const el = els[ans];
    const index = Number(el.dataset.b);
    const bStart = this.book.starts[index];
    if (this.firstCol(el, base) >= col) return bStart;
    const len = this.book.blocks[index].x.length;
    lo = 0;
    hi = len - 1;
    let k = len;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      let c = this.charCol(el, mid, base);
      if (c < 0) c = col - 1;
      if (c >= col) {
        k = mid;
        hi = mid - 1;
      } else lo = mid + 1;
    }
    return k >= len ? (index + 1 < this.book.starts.length ? this.book.starts[index + 1] : sec.end) : bStart + k;
  }

  /** Render section `si` into `container` and compute where each column starts. */
  layoutSection(container, si) {
    const sec = this.book.sections[si];
    container.replaceChildren(renderRange(this.book, sec.startBlock, sec.endBlock));
    const els = Array.from(container.children);
    const blockEls = new Map(els.map((el) => [Number(el.dataset.b), el]));
    const base = container.getBoundingClientRect().left;
    const cols = els.length ? this.lastCol(els[els.length - 1], base) + 1 : 1;
    const colStarts = [sec.start];
    for (let c = 1; c < cols; c++) {
      const off = this.offsetAtColumn(els, base, c, sec);
      colStarts.push(Math.max(colStarts[c - 1], Math.min(off, sec.end - 1)));
    }
    return { colStarts, blockEls };
  }

  /* ------------------------------------------------------------ display */

  /** (Re)compute layout and show the page containing `offset`. */
  relayout(offset) {
    const anchor = offset !== undefined ? offset : this.currentRange().start;
    const g = this.computeGeometry();
    this.geometry = g;
    this.applyGeometry(g);
    if (g.sig !== this.sig) {
      this.sig = g.sig;
      this.sectionCols = new Array(this.book.sections.length).fill(null);
      this.measuredCount = 0;
      this.measuredChars = 0;
      this.measuredCols = 0;
      const token = ++this.measureToken;
      this.si = -1;
      this.showSection(sectionIndexAt(this.book, anchor), { offset: anchor });
      setTimeout(() => this.measureAll(token), 60);
    } else {
      this.si = -1;
      this.showSection(sectionIndexAt(this.book, anchor), { offset: anchor });
    }
  }

  recordSection(si, colStarts) {
    if (this.sectionCols[si]) return;
    this.sectionCols[si] = colStarts;
    const sec = this.book.sections[si];
    this.measuredCount++;
    this.measuredChars += sec.end - sec.start;
    this.measuredCols += colStarts.length;
  }

  showSection(si, target) {
    this.content.classList.remove('animating');
    this.content.style.transform = 'translate3d(0,0,0)';
    // A page-turn effect still running on the viewport (the page curl tilts it)
    // would skew the positions measured below, so stop it first.
    for (const a of this.viewport.getAnimations ? this.viewport.getAnimations() : []) a.cancel();
    const { colStarts, blockEls } = this.layoutSection(this.content, si);
    this.si = si;
    this.colStarts = colStarts;
    this.blockEls = blockEls;
    this.recordSection(si, colStarts);
    if (this.decorate) this.decorate(blockEls);
    const views = this.viewCount();
    let view = 0;
    if (target === 'last') view = views - 1;
    else if (target && target.offset !== undefined) view = Math.floor(lastIndexAtOrBefore(colStarts, target.offset) / this.geometry.cpv);
    this.setView(Math.max(0, Math.min(views - 1, view)), false);
  }

  viewCount() {
    return Math.max(1, Math.ceil(this.colStarts.length / this.geometry.cpv));
  }

  setView(view, animate) {
    const g = this.geometry;
    const anim = this.settings.anim;
    const dir = view >= this.view ? 1 : -1;
    this.content.classList.toggle('animating', Boolean(animate && anim === 'slide'));
    this.view = view;
    if (animate && anim === 'curl') this.curl(dir);
    this.content.style.transform = `translate3d(${-view * (g.width + g.gap)}px,0,0)`;
    if (animate && anim === 'fade' && this.viewport.animate) {
      this.viewport.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
    this.emit();
  }

  /** Move one screen forward (+1) or back (-1). Returns false at either end of the book. */
  turn(dir) {
    if (dir > 0) {
      if (this.view < this.viewCount() - 1) this.setView(this.view + 1, true);
      else if (this.si < this.book.sections.length - 1) {
        this.showSection(this.si + 1, 'first');
        this.flash();
      } else return false;
    } else {
      if (this.view > 0) this.setView(this.view - 1, true);
      else if (this.si > 0) {
        this.showSection(this.si - 1, 'last');
        this.flash();
      } else return false;
    }
    return true;
  }

  /** A page-flip effect: the page swings in from the edge it turned from. */
  curl(dir) {
    if (!this.viewport.animate) return;
    const origin = dir > 0 ? 'left center' : 'right center';
    this.viewport.animate(
      [
        { transform: `perspective(2200px) rotateY(${dir > 0 ? 14 : -14}deg)`, transformOrigin: origin, opacity: 0.55, filter: 'brightness(0.92)' },
        { transform: 'perspective(2200px) rotateY(0deg)', transformOrigin: origin, opacity: 1, filter: 'brightness(1)' },
      ],
      { duration: 340, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
    );
  }

  flash() {
    if (this.settings.anim === 'curl') return this.curl(1);
    if (this.settings.anim !== 'none' && this.viewport.animate) {
      this.viewport.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
  }

  goTo(offset) {
    const clamped = Math.max(0, Math.min(this.book.total, offset));
    const si = sectionIndexAt(this.book, clamped);
    if (si !== this.si) this.showSection(si, { offset: clamped });
    else this.setView(Math.floor(lastIndexAtOrBefore(this.colStarts, clamped) / this.geometry.cpv), false);
  }

  /** [start, end) offsets visible on screen. */
  currentRange() {
    if (this.si < 0) return { start: 0, end: 0 };
    const cpv = this.geometry.cpv;
    const sec = this.book.sections[this.si];
    const first = this.view * cpv;
    const start = this.colStarts[first] ?? sec.start;
    const end = this.colStarts[first + cpv] ?? Math.min(sec.end, this.book.total);
    return { start, end };
  }

  isAtEnd() {
    return this.si === this.book.sections.length - 1 && this.view === this.viewCount() - 1;
  }

  isAtStart() {
    return this.si === 0 && this.view === 0;
  }

  /* ---------------------------------------------------- page numbering */

  charsPerPage() {
    if (this.measuredCols > 0) return Math.max(50, this.measuredChars / this.measuredCols);
    return 1500;
  }

  colsOfSection(si) {
    const known = this.sectionCols[si];
    if (known) return known.length;
    const sec = this.book.sections[si];
    return Math.max(1, Math.ceil((sec.end - sec.start) / this.charsPerPage()));
  }

  /** 0-based global page (column) index of an offset. */
  pageIndexOf(offset) {
    const si = sectionIndexAt(this.book, offset);
    let before = 0;
    for (let s = 0; s < si; s++) before += this.colsOfSection(s);
    const cols = this.sectionCols[si];
    if (cols) return before + lastIndexAtOrBefore(cols, offset);
    const sec = this.book.sections[si];
    return before + Math.min(this.colsOfSection(si) - 1, Math.floor((offset - sec.start) / this.charsPerPage()));
  }

  totalPages() {
    let n = 0;
    for (let s = 0; s < this.book.sections.length; s++) n += this.colsOfSection(s);
    return n;
  }

  pagesExact() {
    return this.measuredCount === this.book.sections.length;
  }

  /** Global page numbers shown on screen (1-based, inclusive). */
  visiblePages() {
    const cpv = this.geometry.cpv;
    let before = 0;
    for (let s = 0; s < this.si; s++) before += this.colsOfSection(s);
    const first = before + this.view * cpv + 1;
    const last = Math.min(before + this.colStarts.length, first + cpv - 1);
    return { first, last };
  }

  async measureAll(token) {
    let lastEmit = performance.now();
    for (let si = 0; si < this.book.sections.length; si++) {
      if (token !== this.measureToken) return;
      if (this.sectionCols[si]) continue;
      const { colStarts } = this.layoutSection(this.measure, si);
      this.recordSection(si, colStarts);
      if (performance.now() - lastEmit > 400) {
        lastEmit = performance.now();
        this.emit();
      }
      await idle();
    }
    if (token !== this.measureToken) return;
    this.measure.replaceChildren();
    this.emit();
  }

  emit() {
    if (this.onChange && this.si >= 0) this.onChange(this.currentRange());
  }
}
