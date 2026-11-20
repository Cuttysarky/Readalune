/**
 * Fixed-layout page viewer, used for comics (CBZ) and PDFs in "original
 * layout". Supports fit to page/width/height/actual size, one or two pages
 * side by side, right-to-left reading, and click-to-zoom with drag to pan.
 * Page images are produced on demand by a source and cached briefly.
 */
import { openZip } from '../import/zip.js';
import { imageType } from '../import/comic.js';

export class ComicSource {
  constructor(bytes, pages) {
    this.zip = openZip(bytes);
    this.pages = pages;
  }

  get count() {
    return this.pages.length;
  }

  async url(i) {
    const data = await this.zip.read(this.pages[i]);
    return URL.createObjectURL(new Blob([data], { type: imageType(this.pages[i]) }));
  }

  destroy() {}
}

export class PdfSource {
  static async open(bytes, { crop }) {
    const pdfjs = await import('../../vendor/pdfjs/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
    const task = pdfjs.getDocument({
      data: new Uint8Array(bytes.slice(0)),
      isEvalSupported: false,
      enableXfa: false,
      cMapUrl: new URL('../../vendor/pdfjs/cmaps/', import.meta.url).href,
      cMapPacked: true,
      useSystemFonts: true,
    // Draw glyphs as paths instead of injecting @font-face styles (keeps our strict CSP).
    disableFontFace: true,
      useWorkerFetch: false,
      verbosity: pdfjs.VerbosityLevel.ERRORS,
    });
    const src = new PdfSource();
    src.task = task;
    src.doc = await task.promise;
    src.crop = crop;
    return src;
  }

  get count() {
    return this.doc.numPages;
  }

  /** Bounding box of the text on a page (PDF units), for cropping margins. */
  async contentBox(page, view) {
    try {
      const tc = await page.getTextContent();
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const it of tc.items) {
        if (!it.str || !it.str.trim()) continue;
        const [, , , d, e, f] = it.transform;
        const size = Math.abs(d) || it.height || 10;
        x0 = Math.min(x0, e);
        x1 = Math.max(x1, e + it.width);
        y0 = Math.min(y0, f - size * 0.3);
        y1 = Math.max(y1, f + size);
      }
      if (!Number.isFinite(x0)) return null;
      const [vx0, vy0, vx1, vy1] = view;
      const pad = Math.max(vx1 - vx0, vy1 - vy0) * 0.03;
      const box = [Math.max(vx0, x0 - pad), Math.max(vy0, y0 - pad), Math.min(vx1, x1 + pad), Math.min(vy1, y1 + pad)];
      // Only crop when it actually removes a margin worth removing.
      if ((box[2] - box[0]) * (box[3] - box[1]) > (vx1 - vx0) * (vy1 - vy0) * 0.92) return null;
      return box;
    } catch {
      return null;
    }
  }

  async url(i, targetWidth) {
    const page = await this.doc.getPage(i + 1);
    const base = page.getViewport({ scale: 1 });
    let box = null;
    if (this.crop) box = await this.contentBox(page, page.view);
    const cssWidth = box ? box[2] - box[0] : base.width;
    const scale = Math.min(4, Math.max(0.5, (targetWidth * Math.min(2, window.devicePixelRatio || 1)) / cssWidth));
    const full = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    let offsetX = 0;
    let offsetY = 0;
    if (box) {
      // Convert the PDF-space box into viewport pixels and render only that part.
      const [ax, ay] = full.convertToViewportPoint(box[0], box[3]);
      const [bx, by] = full.convertToViewportPoint(box[2], box[1]);
      offsetX = Math.min(ax, bx);
      offsetY = Math.min(ay, by);
      canvas.width = Math.ceil(Math.abs(bx - ax));
      canvas.height = Math.ceil(Math.abs(by - ay));
    } else {
      canvas.width = Math.ceil(full.width);
      canvas.height = Math.ceil(full.height);
    }
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-offsetX, -offsetY);
    await page.render({ canvas, canvasContext: ctx, viewport: full }).promise;
    page.cleanup();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return URL.createObjectURL(blob);
  }

  destroy() {
    this.task.destroy().catch(() => {});
  }
}

export class PageView {
  constructor({ area, source, settings, rtl, kind, onChange }) {
    Object.assign(this, { area, source, settings, rtl, kind, onChange });
    this.page = 0;
    this.cache = new Map();
    this.zoomed = false;
    this.stage = document.createElement('div');
    this.stage.className = `page-stage ${kind}`;
    this.stage.tabIndex = -1;
    area.append(this.stage);
    this.bind();
  }

  get count() {
    return this.source.count;
  }

  fit() {
    return this.kind === 'comic' ? this.settings.comicFit : this.settings.pdfFit;
  }

  /** Two pages side by side? The first page (the cover) is always alone. */
  spread() {
    const mode = this.kind === 'comic' ? this.settings.comicSpread : 'auto';
    if (mode === 'single') return false;
    if (mode === 'double') return true;
    return this.kind === 'comic' ? this.area.clientWidth > this.area.clientHeight * 1.25 : this.area.clientWidth > 1300 && this.fit() === 'page';
  }

  /** Pages shown together with page i. */
  viewPages(i) {
    if (!this.spread() || i === 0) return [i];
    const first = i % 2 === 1 ? i : i - 1;
    return first + 1 < this.count ? [first, first + 1] : [first];
  }

  async urlFor(i) {
    if (this.cache.has(i)) return this.cache.get(i);
    const width = this.fit() === 'width' ? this.area.clientWidth : Math.min(this.area.clientWidth, this.area.clientHeight * 0.8);
    const p = this.source.url(i, Math.max(400, width));
    this.cache.set(i, p);
    // Keep a small window of decoded pages.
    for (const [k, v] of this.cache) {
      if (Math.abs(k - i) > 6) {
        this.cache.delete(k);
        v.then((u) => URL.revokeObjectURL(u)).catch(() => {});
      }
    }
    return p;
  }

  async show(i) {
    this.page = Math.max(0, Math.min(this.count - 1, i));
    const pages = this.viewPages(this.page);
    const token = (this.token = (this.token || 0) + 1);
    const urls = await Promise.all(pages.map((p) => this.urlFor(p).catch(() => null)));
    if (token !== this.token) return;
    this.zoomed = false;
    this.stage.classList.remove('zoomed');
    this.stage.dataset.fit = this.fit();
    this.stage.dataset.count = String(pages.length);
    const imgs = pages.map((p, k) => {
      const img = document.createElement('img');
      img.className = 'page-img';
      img.alt = `Page ${p + 1}`;
      img.draggable = false;
      if (urls[k]) img.src = urls[k];
      return img;
    });
    if (this.rtl) imgs.reverse();
    const row = document.createElement('div');
    row.className = 'page-row';
    row.append(...imgs);
    this.stage.replaceChildren(row);
    this.stage.scrollTop = 0;
    this.stage.scrollLeft = this.rtl ? this.stage.scrollWidth : 0;
    // Prepare the next view in the background.
    const next = pages[pages.length - 1] + 1;
    if (next < this.count) this.urlFor(next).catch(() => {});
    this.onChange?.(this.current());
  }

  current() {
    const pages = this.viewPages(this.page);
    return { page: pages[0], last: pages[pages.length - 1], total: this.count };
  }

  next() {
    const pages = this.viewPages(this.page);
    const n = pages[pages.length - 1] + 1;
    if (n >= this.count) return false;
    this.show(n);
    return true;
  }

  prev() {
    if (this.page === 0) return false;
    const pages = this.viewPages(this.page);
    const target = this.viewPages(pages[0] - 1)[0];
    this.show(target);
    return true;
  }

  /** Scroll within a tall page before turning (fit width / zoom). */
  turn(dir) {
    const s = this.stage;
    const room = dir > 0 ? s.scrollHeight - s.clientHeight - s.scrollTop : s.scrollTop;
    if (room > 4) {
      s.scrollBy({ top: dir * s.clientHeight * 0.85, behavior: 'smooth' });
      return true;
    }
    return dir > 0 ? this.next() : this.prev();
  }

  relayout() {
    for (const v of this.cache.values()) v.then((u) => URL.revokeObjectURL(u)).catch(() => {});
    this.cache.clear();
    this.show(this.viewPages(this.page)[0]);
  }

  toggleZoom(e) {
    const s = this.stage;
    const r = s.getBoundingClientRect();
    const fx = (e.clientX - r.left + s.scrollLeft) / Math.max(1, s.scrollWidth);
    const fy = (e.clientY - r.top + s.scrollTop) / Math.max(1, s.scrollHeight);
    this.zoomed = !this.zoomed;
    s.classList.toggle('zoomed', this.zoomed);
    if (this.zoomed) {
      s.scrollLeft = fx * s.scrollWidth - s.clientWidth / 2;
      s.scrollTop = fy * s.scrollHeight - s.clientHeight / 2;
    }
  }

  bind() {
    let drag = null;
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, moved: false, sl: this.stage.scrollLeft, st: this.stage.scrollTop };
    });
    this.stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (this.zoomed || this.fit() !== 'page') {
        this.stage.scrollLeft = drag.sl - dx;
        this.stage.scrollTop = drag.st - dy;
      }
    });
    this.stage.addEventListener('pointerup', (e) => {
      const d = drag;
      drag = null;
      if (!d || d.moved) {
        if (d && e.pointerType === 'touch' && !this.zoomed && Math.abs(e.clientX - d.x) > 50) {
          const forward = e.clientX - d.x < 0;
          this.turnVisual(forward ? 1 : -1);
        }
        return;
      }
      if (e.target.classList.contains('page-img')) this.toggleZoom(e);
    });
  }

  /** Turn by screen direction: in right-to-left books "right" means back. */
  turnVisual(dir) {
    const logical = this.rtl ? -dir : dir;
    return logical > 0 ? this.next() : this.prev();
  }

  destroy() {
    for (const v of this.cache.values()) v.then((u) => URL.revokeObjectURL(u)).catch(() => {});
    this.cache.clear();
    this.stage.remove();
    this.source.destroy();
  }
}
