/**
 * Continuous scroll mode. The book is one tall column; a few sections around
 * the reading position are kept in the page and more are added as you scroll.
 * Page numbers still come from the paginator's background measurement, so
 * "page X of Y" matches the paged view at the same text size.
 */
import { Paginator } from './paginator.js';
import { renderRange, locate } from './render.js';
import { sectionIndexAt } from '../core/book.js';

const PAD = 14;

export class ScrollView extends Paginator {
  constructor(opts) {
    super(opts);
    this.rendered = { from: -1, to: -1 };
    this.viewport.classList.add('scrolling');
    this.content.classList.add('flow');
    this.onScroll = () => this.scrolled();
    this.viewport.addEventListener('scroll', this.onScroll, { passive: true });
  }

  destroy() {
    // A pending "scrolled" update must not fire after the view is gone.
    clearTimeout(this.scrollTimer);
    this.onChange = null;
    super.destroy();
    this.viewport.removeEventListener('scroll', this.onScroll);
    this.viewport.classList.remove('scrolling');
    this.content.classList.remove('flow');
    Object.assign(this.content.style, { padding: '', transform: '' });
  }

  /** Measure pages as a single column so page numbers suit one-column reading. */
  computeGeometry() {
    const saved = this.settings;
    this.settings = { ...saved, layout: 'one' };
    const g = super.computeGeometry();
    this.settings = saved;
    return g;
  }

  applyGeometry(g) {
    super.applyGeometry(g);
    const areaW = this.area.clientWidth;
    const areaH = this.area.clientHeight;
    const width = g.colW + PAD * 2;
    Object.assign(this.viewport.style, { left: `${Math.max(0, Math.round((areaW - width) / 2))}px`, top: '0px', width: `${width}px`, height: `${areaH}px` });
    Object.assign(this.content.style, { width: `${width}px`, height: 'auto', columnWidth: 'auto', columnGap: '0px', transform: 'none', padding: `${g.top}px ${PAD}px ${Math.round(areaH * 0.4)}px` });
    this.area.dataset.spread = 'one';
  }

  sectionEl(s) {
    const sec = this.book.sections[s];
    const div = document.createElement('div');
    div.className = 'flow-section';
    div.dataset.s = String(s);
    div.append(renderRange(this.book, sec.startBlock, sec.endBlock));
    return div;
  }

  addBlocks(el) {
    const map = new Map();
    for (const b of el.querySelectorAll('.blk')) {
      const i = Number(b.dataset.b);
      map.set(i, b);
      this.blockEls.set(i, b);
    }
    if (this.decorate && map.size) this.decorate(map);
  }

  renderWindow(si) {
    const n = this.book.sections.length;
    const from = Math.max(0, si - 1);
    const to = Math.min(n - 1, si + 1);
    this.content.replaceChildren();
    this.blockEls = new Map();
    for (let s = from; s <= to; s++) {
      const el = this.sectionEl(s);
      this.content.append(el);
      this.addBlocks(el);
    }
    this.rendered = { from, to };
  }

  showSection(si, target) {
    this.content.classList.remove('animating');
    if (si < this.rendered.from || si > this.rendered.to) this.renderWindow(si);
    this.si = si;
    if (target === 'last') {
      const el = this.content.querySelector(`.flow-section[data-s="${si}"]`);
      if (el) this.viewport.scrollTop = el.offsetTop + el.offsetHeight - this.viewport.clientHeight;
    } else if (target && target.offset !== undefined) this.scrollToOffset(target.offset);
    else {
      const el = this.content.querySelector(`.flow-section[data-s="${si}"]`);
      if (el) this.viewport.scrollTop = el.offsetTop;
    }
    this.emit();
  }

  scrollToOffset(offset) {
    let index = 0;
    const starts = this.book.starts;
    for (let lo = 0, hi = starts.length - 1; lo <= hi; ) {
      const mid = (lo + hi) >> 1;
      if (starts[mid] <= offset) {
        index = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    const el = this.blockEls.get(index);
    if (!el) return;
    let top = el.getBoundingClientRect().top;
    const k = offset - starts[index];
    if (k > 0 && el.firstChild) {
      const loc = locate(el, k);
      if (loc) {
        const r = document.createRange();
        r.setStart(loc.node, loc.offset);
        r.setEnd(loc.node, Math.min(loc.node.nodeValue.length, loc.offset + 1));
        const rect = r.getClientRects()[0];
        if (rect) top = rect.top;
      }
    }
    this.viewport.scrollTop += top - this.viewport.getBoundingClientRect().top - this.geometry.top + 2;
  }

  /** First character whose line starts at or below screen position y. */
  offsetAtY(y) {
    const els = [...this.blockEls.entries()].sort((a, b) => a[0] - b[0]);
    let lo = 0;
    let hi = els.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (els[mid][1].getBoundingClientRect().bottom > y + 1) {
        ans = mid;
        hi = mid - 1;
      } else lo = mid + 1;
    }
    if (ans < 0) {
      const last = this.book.sections[this.rendered.to];
      return Math.min(last.end, this.book.total);
    }
    const [index, el] = els[ans];
    const start = this.book.starts[index];
    if (el.getBoundingClientRect().top >= y - 1 || !el.firstChild) return start;
    const len = this.book.blocks[index].x.length;
    let a = 0;
    let b = len - 1;
    let k = len;
    while (a <= b) {
      const mid = (a + b) >> 1;
      const loc = locate(el, mid);
      const r = document.createRange();
      r.setStart(loc.node, loc.offset);
      r.setEnd(loc.node, Math.min(loc.node.nodeValue.length, loc.offset + 1));
      const rect = r.getClientRects()[0];
      if (rect && rect.top >= y - 1) {
        k = mid;
        b = mid - 1;
      } else a = mid + 1;
    }
    return start + k;
  }

  currentRange() {
    if (this.rendered.from < 0) return { start: 0, end: 0 };
    const r = this.viewport.getBoundingClientRect();
    const start = this.offsetAtY(r.top + 1);
    const end = Math.max(start, this.offsetAtY(r.bottom - 1));
    return { start, end };
  }

  scrolled() {
    const vp = this.viewport;
    const n = this.book.sections.length;
    if (vp.scrollTop + vp.clientHeight > vp.scrollHeight - vp.clientHeight * 1.5 && this.rendered.to < n - 1) {
      const el = this.sectionEl(this.rendered.to + 1);
      this.content.append(el);
      this.rendered.to++;
      this.addBlocks(el);
      this.trim('top');
    } else if (vp.scrollTop < vp.clientHeight * 1.5 && this.rendered.from > 0) {
      const el = this.sectionEl(this.rendered.from - 1);
      const before = vp.scrollHeight;
      this.content.prepend(el);
      vp.scrollTop += vp.scrollHeight - before;
      this.rendered.from--;
      this.addBlocks(el);
      this.trim('bottom');
    }
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => this.emit(), 120);
  }

  trim(side) {
    const vp = this.viewport;
    while (this.rendered.to - this.rendered.from > 4) {
      const el = side === 'top' ? this.content.firstElementChild : this.content.lastElementChild;
      if (side === 'top') {
        const shift = el.nextElementSibling ? el.nextElementSibling.offsetTop - el.offsetTop : el.offsetHeight;
        el.remove();
        vp.scrollTop -= shift;
        this.rendered.from++;
      } else {
        el.remove();
        this.rendered.to--;
      }
      for (const b of el.querySelectorAll('.blk')) this.blockEls.delete(Number(b.dataset.b));
    }
  }

  setView() {}

  viewCount() {
    return 1;
  }

  turn(dir) {
    const vp = this.viewport;
    if (dir > 0 && this.isAtEnd()) return false;
    if (dir < 0 && this.isAtStart()) return false;
    const line = this.settings.fontSize * 1.6;
    vp.scrollBy({ top: dir * (vp.clientHeight - line * 2), behavior: this.settings.anim === 'none' ? 'auto' : 'smooth' });
    return true;
  }

  goTo(offset) {
    const clamped = Math.max(0, Math.min(this.book.total, offset));
    const si = sectionIndexAt(this.book, clamped);
    if (si < this.rendered.from || si > this.rendered.to) this.renderWindow(si);
    this.si = si;
    this.scrollToOffset(clamped);
    this.emit();
  }

  isAtEnd() {
    const vp = this.viewport;
    return this.rendered.to === this.book.sections.length - 1 && vp.scrollTop + vp.clientHeight >= vp.scrollHeight - Math.round(this.area.clientHeight * 0.4) - 4;
  }

  isAtStart() {
    return this.rendered.from === 0 && this.viewport.scrollTop <= 2;
  }

  visiblePages() {
    const { start, end } = this.currentRange();
    const first = this.pageIndexOf(start) + 1;
    return { first, last: Math.max(first, this.pageIndexOf(Math.max(start, end - 1)) + 1) };
  }

  emit() {
    if (!this.onChange || this.rendered.from < 0) return;
    const range = this.currentRange();
    this.si = sectionIndexAt(this.book, range.start);
    this.onChange(range);
  }
}
