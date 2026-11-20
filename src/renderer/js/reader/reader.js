/**
 * The reading screen: pages, progress, highlights, notes, bookmarks,
 * search, contents, read-aloud and reading settings.
 */
import { $, $$, h, icon, setIcon, toast, modal, promptDialog, formatDate, debounce, clamp, menuKeys } from '../ui/dom.js';
import { indexBook, chapterAt, chapterRange, textBetween, excerptAt, positionOf, formatDuration, blockIndexAt, CHARS_PER_POSITION } from '../core/book.js';
import { Paginator } from './paginator.js';
import { ScrollView } from './scrollview.js';
import { PageView, ComicSource, PdfSource } from './pageview.js';
import { renderQuoteImage } from './quote.js';
import { wrapOffsets, unwrap, offsetFromDom } from './render.js';
import { Speaker, sentences } from './tts.js';
import { THEMES, FONTS, SPACING, MARGINS, ALIGN, LAYOUTS, PARA, ANIMS, FLOWS, COMIC_FITS, COMIC_SPREADS, BOOK_KEYS, DEFAULTS, applyReaderStyle, layoutSignature, sanitizeSettings } from '../settings.js';
import { exportNotesDialog } from '../notes-export.js';

const COLORS = ['yellow', 'blue', 'pink', 'orange', 'green'];
const FOOTER_MODES = ['page', 'position', 'chapter', 'book', 'source', 'none'];
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export class Reader {
  constructor(app) {
    this.app = app;
    this.api = window.readalune;
    this.root = $('#reader-root');
    this.meta = null;
    this.book = null;
    this.state = { highlights: [], bookmarks: [] };
    this.pager = null;
    this.history = [];
    this.lastInteraction = Date.now();
    this.pageShownAt = Date.now();
    this.prevRange = null;
    this.selection = null; // { start, end, text, highlight? }
    this.ttsMarks = [];
    this.flashMarks = [];
    this.wheelAcc = 0;
    this.wheelLock = 0;
    this.speaker = null;
    this.saveStateSoon = debounce(() => this.saveState(), 700);
    this.saveMetaSoon = debounce(() => this.saveProgress(), 1500);
    this.bindStatic();
  }

  /** Global settings, with this book's own overrides on top (if it has any). */
  get settings() {
    const own = this.state && this.state.settings;
    return own ? sanitizeSettings({ ...this.app.settings, ...own }) : this.app.settings;
  }

  isPageMode() {
    return Boolean(this.pageView);
  }

  /* ================================================================ open */

  async open(meta) {
    const seq = (this.openSeq = (this.openSeq || 0) + 1);
    this.meta = meta;
    const [content, state] = await Promise.all([this.api.getContent(meta.id), this.api.getState(meta.id)]);
    // The book was closed, or another one opened, while this one was loading.
    if (seq !== this.openSeq || this.meta !== meta) return undefined;
    if (!content || !Array.isArray(content.blocks)) throw new Error('This book could not be loaded.');
    this.content = content;
    const own = state.settings && typeof state.settings === 'object' ? Object.fromEntries(Object.entries(state.settings).filter(([k]) => BOOK_KEYS.includes(k))) : null;
    this.state = {
      pos: Number.isInteger(state.pos) ? state.pos : 0,
      page: Number.isInteger(state.page) ? state.page : 0,
      highlights: Array.isArray(state.highlights) ? state.highlights : [],
      bookmarks: Array.isArray(state.bookmarks) ? state.bookmarks : [],
      settings: own && Object.keys(own).length ? own : undefined,
      rtl: typeof state.rtl === 'boolean' ? state.rtl : undefined,
    };
    this.originalLayout = false;
    this.pageView?.destroy();
    this.pageView = null;
    $('#page-viewport').hidden = false;
    if (content.kind === 'comic') return this.openPages(meta, 'comic');
    this.book = indexBook(content);
    this.book.language = meta.language || '';
    this.history = [];
    this.prevRange = null;
    this.justOpened = true;
    this.hideBackPill();
    $('#r-title').textContent = meta.author ? `${meta.title} \u2014 ${meta.author}` : meta.title;
    document.title = `${meta.title} \u2014 Readalune`;

    applyReaderStyle(this.root, this.settings);
    this.root.classList.remove('page-mode', 'comic-mode', 'pdf-original');
    this.root.dataset.flow = this.settings.flow;
    this.pager?.destroy();
    const View = this.settings.flow === 'scroll' ? ScrollView : Paginator;
    this.pager = new View({
      area: $('#page-area'),
      viewport: $('#page-viewport'),
      content: $('#page-content'),
      measureWrap: $('#page-measure-wrap'),
      measure: $('#page-measure'),
      book: this.book,
      settings: this.settings,
      language: meta.language,
      onChange: (range) => this.onPageChange(range),
      decorate: (blockEls) => this.decorate(blockEls),
    });
    this.layoutSig = layoutSignature(this.settings);
    this.buildProgressTicks();
    if (!this.reopening) this.closeDrawers();
    this.hideSelMenu();
    this.pager.relayout(clamp(this.state.pos, 0, this.book.total));
    this.positionTapZones();
    this.pageShownAt = Date.now();
    this.api.updateMeta(meta.id, { lastOpenedAt: Date.now() }).then((m) => this.meta === meta && Object.assign(meta, m));
    this.startSession();
    this.startTimers();
    this.showChrome();
    return undefined;
  }

  /** Comics and original-layout PDFs: show page images instead of reflowed text. */
  async openPages(meta, kind) {
    const bytes = await this.api.getSource(meta.id);
    if (this.meta !== meta) return; // closed while loading
    if (!bytes) throw new Error('The original file for this book is missing.');
    applyReaderStyle(this.root, this.settings);
    this.root.classList.add('page-mode');
    this.root.classList.toggle('comic-mode', kind === 'comic');
    this.root.classList.toggle('pdf-original', kind === 'pdf');
    this.pager?.destroy();
    this.pager = null;
    this.history = [];
    this.hideBackPill();
    $('#page-viewport').hidden = true;
    const source = kind === 'comic' ? new ComicSource(bytes, this.content.pages) : await PdfSource.open(bytes, { crop: this.settings.pdfCrop });
    if (this.meta !== meta) {
      source.destroy();
      return;
    }
    this.pageView = new PageView({
      area: $('#page-area'),
      source,
      settings: this.settings,
      rtl: kind === 'comic' && (typeof this.state.rtl === 'boolean' ? this.state.rtl : this.content.rtl === true),
      kind,
      onChange: () => this.onPagesChange(),
    });
    $('#r-title').textContent = meta.author ? `${meta.title} \u2014 ${meta.author}` : meta.title;
    document.title = `${meta.title} \u2014 Readalune`;
    this.closeDrawers();
    this.hideSelMenu();
    $('#progress-ticks').replaceChildren();
    this.justOpened = true;
    await this.pageView.show(kind === 'pdf' ? this.pdfPageForOffset(this.state.pos) : clamp(this.state.page, 0, source.count - 1));
    if (this.meta !== meta) return;
    this.api.updateMeta(meta.id, { lastOpenedAt: Date.now() }).then((m) => this.meta === meta && Object.assign(meta, m));
    this.startSession();
    this.startTimers();
    this.showChrome();
  }

  onPagesChange() {
    if (!this.pageView) return;
    const opening = this.justOpened;
    this.justOpened = false;
    const { page, last, total } = this.pageView.current();
    this.state.page = page;
    if (this.book && this.originalLayout) this.state.pos = this.offsetForPdfPage(page);
    const pct = last >= total - 1 ? 100 : Math.floor((page / total) * 100);
    $('#info-right').textContent = `${pct}%`;
    $('#progress-fill').style.width = `${pct}%`;
    $('#info-left').textContent = last > page ? `Pages ${page + 1}\u2013${last + 1} of ${total}` : `Page ${page + 1} of ${total}`;
    $('#band-chapter').textContent = this.meta.title;
    $('#ribbon').hidden = true;
    this.saveStateSoon();
    this.saveMetaSoon();
    if (last >= total - 1 && this.meta.status !== 'finished') this.onFinished(!opening);
  }

  /** Map a text offset to a PDF page using the page numbers recorded at import. */
  pdfPageForOffset(offset) {
    if (!this.book) return 0;
    const b = this.book.blocks[blockIndexAt(this.book, offset)];
    return Math.max(0, ((b && b.pg) || 1) - 1);
  }

  offsetForPdfPage(page) {
    const i = this.book.blocks.findIndex((b) => (b.pg || 0) >= page + 1);
    return i >= 0 ? this.book.starts[i] : this.book.total;
  }

  async toggleOriginalLayout() {
    if (!this.meta || this.meta.format !== 'pdf' || !this.meta.hasSource) {
      toast('Original layout is available for PDFs imported with this version of Readalune.');
      return;
    }
    if (!this.originalLayout) {
      this.state.pos = this.pager ? this.pager.currentRange().start : this.state.pos;
      this.originalLayout = true;
      await this.openPages(this.meta, 'pdf');
    } else {
      const offset = this.offsetForPdfPage(this.state.page);
      this.pageView?.destroy();
      this.pageView = null;
      this.originalLayout = false;
      $('#page-viewport').hidden = false;
      this.state.pos = offset;
      await this.saveState();
      await this.open(this.meta);
    }
  }

  startSession() {
    this.session = { start: Date.now(), startPct: this.progressValue() };
  }

  endSession() {
    if (!this.session || !this.meta) return;
    this.app.stats.addSession({ bookId: this.meta.id, start: this.session.start, end: Date.now(), percentRead: Math.round((this.progressValue() - this.session.startPct) * 1000) / 1000 });
    this.session = null;
  }

  async close() {
    this.stopTts();
    this.endSession();
    this.stopTimers();
    this.saveStateSoon.cancel();
    this.saveMetaSoon.cancel();
    if (this.meta) {
      await this.saveState();
      await this.saveProgress();
    }
    this.closeDrawers();
    this.hideSelMenu();
    this.hideBackPill();
    this.pager?.destroy();
    this.pager = null;
    this.pageView?.destroy();
    this.pageView = null;
    $('#page-viewport').hidden = false;
    this.root.classList.remove('page-mode', 'comic-mode', 'pdf-original');
    this.meta = null;
    this.book = null;
    document.title = 'Readalune';
  }

  isOpen() {
    return Boolean(this.meta);
  }

  /* ============================================================ persistence */

  async saveState() {
    if (!this.meta) return;
    try {
      await this.api.saveState(this.meta.id, {
        pos: this.state.pos,
        page: this.state.page || 0,
        percent: Math.round(this.progressValue() * 10000) / 10000,
        updatedAt: Date.now(),
        deviceId: (this.app.info && this.app.info.deviceId) || '',
        highlights: this.state.highlights,
        bookmarks: this.state.bookmarks,
        settings: this.state.settings,
        rtl: this.state.rtl,
      });
    } catch (err) {
      console.error(err);
    }
  }

  progressValue() {
    if (this.pageView) {
      const { page, last, total } = this.pageView.current();
      return last >= total - 1 ? 1 : clamp(page / total, 0, 1);
    }
    if (!this.pager || !this.book) return 0;
    if (this.pager.isAtEnd()) return 1;
    return clamp(this.pager.currentRange().start / this.book.total, 0, 1);
  }

  async saveProgress() {
    if (!this.meta) return;
    const patch = { progress: Math.round(this.progressValue() * 10000) / 10000, readingSeconds: this.meta.readingSeconds || 0 };
    try {
      const m = await this.api.updateMeta(this.meta.id, patch);
      if (this.meta && m && m.id === this.meta.id) Object.assign(this.meta, m);
      this.app.library.updateCached(m);
    } catch (err) {
      console.error(err);
    }
  }

  /* ============================================================ timers/stats */

  startTimers() {
    this.stopTimers();
    this.readTimer = setInterval(() => {
      const active = document.visibilityState === 'visible' && document.hasFocus() && Date.now() - this.lastInteraction < 180000;
      if (!active || !this.meta) return;
      this.app.stats.addSeconds(10);
      this.meta.readingSeconds = (this.meta.readingSeconds || 0) + 10;
      if (this.meta.readingSeconds % 60 === 0) this.saveMetaSoon();
    }, 10000);
  }

  stopTimers() {
    clearInterval(this.readTimer);
    this.readTimer = null;
  }

  touch() {
    this.lastInteraction = Date.now();
  }

  /* ============================================================ page change */

  onPageChange(range) {
    if (!this.pager || !this.book) return; // a late signal from a view that was just closed
    const opening = this.justOpened;
    this.justOpened = false;
    const prev = this.prevRange;
    const now = Date.now();
    if (prev && range.start > prev.start && range.start <= prev.end + 5) {
      // Forward page turn: learn the reader's speed.
      const ms = now - this.pageShownAt;
      const chars = prev.end - prev.start;
      if (ms > 4000 && ms < 6 * 60000 && chars > 150) this.app.stats.recordSpeed(chars / (ms / 60000));
    }
    if (!prev || prev.start !== range.start) this.pageShownAt = now;
    this.prevRange = range;
    this.state.pos = range.start;
    this.updateInfo();
    this.saveStateSoon();
    this.saveMetaSoon();
    if (this.pager.isAtEnd() && this.meta && this.meta.status !== 'finished' && this.book.total > 0) this.onFinished(!opening);
  }

  /**
   * The last page has been reached. A book that opens on its last page (a
   * one-page text, say) is marked as finished quietly: the finish card would
   * cover the page before it has been read.
   */
  async onFinished(celebrate = true) {
    const meta = this.meta;
    meta.status = 'finished';
    this.app.stats.bookFinished(meta);
    try {
      await this.api.updateMeta(meta.id, { status: 'finished', progress: 1 });
    } catch {
      /* ignore */
    }
    if (celebrate && this.meta === meta) this.showFinishCard();
  }

  /** A quiet celebration at the end of a book, with a chance to rate it. */
  async showFinishCard() {
    const meta = this.meta;
    let rating = meta.rating || 0;
    const pages = this.pageView ? this.pageView.count : this.pager ? this.pager.totalPages() : 0;
    const result = await modal({
      title: 'Finished',
      className: 'finish',
      build: (body, close) => {
        const stars = h('div.star-input', { role: 'radiogroup', 'aria-label': 'Rating' });
        const draw = () =>
          stars.replaceChildren(
            ...[1, 2, 3, 4, 5].map((n) => h(`button.star${n <= rating ? '.on' : ''}`, { type: 'button', 'aria-label': `${n} star${n === 1 ? '' : 's'}`, onclick: () => ((rating = n), draw()) }, icon('star', 28)))
          );
        draw();
        body.append(
          h(
            'div.finish-card',
            null,
            h('div.finish-mark', null, icon('check', 30)),
            h('h3', { text: 'You finished it' }),
            h('p.muted', { text: `\u201c${meta.title}\u201d${meta.author ? ` by ${meta.author}` : ''}` }),
            h(
              'div.finish-stats',
              null,
              h('div', null, h('strong', { text: meta.readingSeconds ? formatDuration(meta.readingSeconds / 60) : '\u2014' }), h('span', { text: 'Reading time' })),
              h('div', null, h('strong', { text: String(this.state.highlights.length) }), h('span', { text: 'Highlights' })),
              h('div', null, h('strong', { text: pages ? String(pages) : '\u2014' }), h('span', { text: 'Pages' }))
            ),
            h('div.setting-label', { text: 'How would you rate it?' }),
            stars,
            h('div.modal-actions', null, h('button.btn', { text: 'Keep reading', onclick: () => close('stay') }), h('button.btn.primary', { text: 'Back to library', onclick: () => close('library') }))
          )
        );
      },
    });
    if (rating !== (meta.rating || 0)) {
      try {
        const m = await this.api.updateMeta(meta.id, { rating });
        Object.assign(meta, m);
        this.app.library.updateCached(m);
      } catch {
        /* ignore */
      }
    }
    if (result === 'library') this.app.showLibrary();
  }

  updateInfo() {
    if (!this.pager || !this.book) return;
    const { start, end } = this.pager.currentRange();
    const total = this.book.total;
    const pct = this.pager.isAtEnd() ? 100 : Math.floor((start / total) * 100);
    $('#info-right').textContent = `${pct}%`;
    $('#progress-fill').style.width = `${this.pager.isAtEnd() ? 100 : (start / total) * 100}%`;
    $('#progress').setAttribute('aria-valuenow', String(pct));
    const chapter = chapterAt(this.book, start);
    $('#band-chapter').textContent = chapter ? chapter.title : this.meta.title;
    $('#info-left').textContent = this.footerText(start, end);
    const marked = this.state.bookmarks.some((b) => b.o >= start && b.o < Math.max(end, start + 1));
    $('#ribbon').hidden = !marked;
    $('#r-bookmark').classList.toggle('on', marked);
    $('#r-bookmark').setAttribute('aria-pressed', String(marked));
    if (!$('#drawer-toc').hidden) this.markCurrentToc();
  }

  footerText(start, end) {
    const mode = this.settings.footerMode;
    const exact = this.pager.pagesExact();
    const cpm = this.app.stats.cpm();
    switch (mode) {
      case 'page': {
        const { first, last } = this.pager.visiblePages();
        const total = this.pager.totalPages();
        const t = `${exact ? '' : '~'}${total.toLocaleString()}`;
        return first === last ? `Page ${first.toLocaleString()} of ${t}` : `Pages ${first.toLocaleString()}\u2013${last.toLocaleString()} of ${t}`;
      }
      case 'position':
        return `Position ${positionOf(start).toLocaleString()} of ${positionOf(this.book.total).toLocaleString()}`;
      case 'chapter': {
        const r = chapterRange(this.book, start);
        const left = Math.max(0, r.end - end);
        return left <= 0 ? 'Last page of chapter' : `${formatDuration(left / cpm)} left in chapter`;
      }
      case 'book': {
        const left = Math.max(0, this.book.total - end);
        return left <= 0 ? 'End of book' : `${formatDuration(left / cpm)} left in book`;
      }
      case 'source': {
        const b = this.book.blocks[blockIndexAt(this.book, start)];
        if (b && b.pg) return `Original page ${b.pg}`;
        return `Position ${positionOf(start).toLocaleString()}`;
      }
      default:
        return '';
    }
  }

  cycleFooter() {
    let i = FOOTER_MODES.indexOf(this.settings.footerMode);
    for (let k = 0; k < FOOTER_MODES.length; k++) {
      i = (i + 1) % FOOTER_MODES.length;
      if (FOOTER_MODES[i] !== 'source' || this.meta.format === 'pdf') break;
    }
    this.app.updateSettings({ footerMode: FOOTER_MODES[i] });
    this.updateInfo();
  }

  buildProgressTicks() {
    const host = $('#progress-ticks');
    host.replaceChildren();
    const top = this.book.toc.filter((t) => t.level === 0);
    if (top.length > 120) return;
    for (const t of top) {
      if (t.offset <= 0) continue;
      host.append(h('span.tick', { style: { left: `${(t.offset / this.book.total) * 100}%` } }));
    }
  }

  /* ============================================================ navigation */

  turn(dir) {
    this.touch();
    if (this.pageView) {
      this.pageView.turn(dir);
      return;
    }
    if (!this.pager) return;
    this.hideSelMenu();
    const moved = this.pager.turn(dir);
    if (!moved && dir > 0) this.bumpEnd();
  }

  bumpEnd() {
    const vp = $('#page-viewport');
    vp.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(0)' }], { duration: 260 });
  }

  /** Jump somewhere, remembering where we were so the reader can go back. */
  jumpTo(offset, { remember = true } = {}) {
    if (!this.pager) return;
    const here = this.pager.currentRange().start;
    if (remember && Math.abs(here - offset) > 50) {
      this.history.push(here);
      if (this.history.length > 30) this.history.shift();
      this.showBackPill(here);
    }
    this.pager.goTo(offset);
  }

  showBackPill(offset) {
    const pill = $('#back-pill');
    let label = pill.querySelector('.pill-text');
    if (!label) {
      label = h('span.pill-text');
      pill.append(label);
    }
    label.textContent = `Back to page ${this.pager.pageIndexOf(offset) + 1}`;
    pill.hidden = false;
    clearTimeout(this.pillTimer);
    this.pillTimer = setTimeout(() => this.hideBackPill(), 20000);
  }

  hideBackPill() {
    $('#back-pill').hidden = true;
  }

  goBack() {
    if (!this.pager) return;
    const off = this.history.pop();
    if (off === undefined) return;
    this.pager.goTo(off);
    if (this.history.length) this.showBackPill(this.history[this.history.length - 1]);
    else this.hideBackPill();
  }

  chapterJump(dir) {
    const { start } = this.pager.currentRange();
    const toc = this.book.toc;
    if (!toc.length) return;
    if (dir > 0) {
      const next = toc.find((t) => t.offset > start + 1);
      if (next) this.jumpTo(next.offset);
    } else {
      const cur = chapterAt(this.book, start);
      const idx = cur ? toc.indexOf(cur) : -1;
      const target = cur && start - cur.offset > 2 ? cur : toc[idx - 1];
      if (target) this.jumpTo(target.offset);
      else this.jumpTo(0);
    }
  }

  async goToDialog() {
    if (this.pageView) {
      // Comics and original-layout PDFs: pages are simply numbered.
      const count = this.pageView.count;
      const value = await promptDialog({ title: 'Go to page', label: `Page (1\u2013${count})`, confirm: 'Go' });
      const page = Math.round(Number(value));
      if (value && value.trim() && Number.isFinite(page) && this.pageView) this.pageView.show(clamp(page, 1, count) - 1);
      return;
    }
    if (!this.pager) return;
    const total = this.pager.totalPages();
    const result = await modal({
      title: 'Go to',
      build: (body, close) => {
        const kind = h('select', null, h('option', { value: 'page', text: `Page (1\u2013${total})` }), h('option', { value: 'position', text: `Position (1\u2013${positionOf(this.book.total)})` }), h('option', { value: 'percent', text: 'Percent (0\u2013100)' }));
        const input = h('input', { type: 'number', min: '0', 'aria-label': 'Value' });
        const go = () => close({ kind: kind.value, value: Number(input.value) });
        input.addEventListener('keydown', (e) => e.key === 'Enter' && go());
        body.append(h('div.row', null, kind, input), h('div.modal-actions', null, h('button.btn', { text: 'Cancel', onclick: () => close(null) }), h('button.btn.primary', { text: 'Go', onclick: go })));
        setTimeout(() => input.focus(), 0);
      },
    });
    if (!result || !Number.isFinite(result.value)) return;
    let offset = 0;
    if (result.kind === 'percent') offset = Math.round((clamp(result.value, 0, 100) / 100) * this.book.total);
    else if (result.kind === 'position') offset = (Math.max(1, Math.round(result.value)) - 1) * CHARS_PER_POSITION;
    else offset = this.offsetOfPage(clamp(Math.round(result.value), 1, total));
    this.jumpTo(Math.min(offset, this.book.total));
  }

  /** Approximate offset for a global page number (exact when pages are measured). */
  offsetOfPage(page) {
    let remaining = page - 1;
    for (let si = 0; si < this.book.sections.length; si++) {
      const n = this.pager.colsOfSection(si);
      if (remaining < n) {
        const cols = this.pager.sectionCols[si];
        const sec = this.book.sections[si];
        if (cols) return cols[remaining];
        return sec.start + Math.round(remaining * this.pager.charsPerPage());
      }
      remaining -= n;
    }
    return this.book.total;
  }

  /* ============================================================ decorations */

  decorate(blockEls) {
    this.flashMarks = [];
    this.ttsMarks = [];
    if (!blockEls.size) return;
    const first = Math.min(...blockEls.keys());
    const last = Math.max(...blockEls.keys());
    const secStart = this.book.starts[first];
    const secEnd = last + 1 < this.book.starts.length ? this.book.starts[last + 1] : this.book.total + 1;
    for (const hl of this.state.highlights) {
      if (hl.e <= secStart || hl.s >= secEnd) continue;
      this.paintHighlight(hl, blockEls);
    }
  }

  paintHighlight(hl, blockEls = this.pager.blockEls) {
    return wrapOffsets(this.book, blockEls, hl.s, hl.e, () => {
      const m = document.createElement('mark');
      m.className = `hl hl-${hl.c}${hl.note ? ' has-note' : ''}`;
      m.dataset.hid = hl.id;
      return m;
    });
  }

  repaintHighlight(hl) {
    unwrap($$(`mark[data-hid="${CSS.escape(hl.id)}"]`, $('#page-content')));
    if (this.state.highlights.includes(hl)) this.paintHighlight(hl);
  }

  flashRange(start, end) {
    unwrap(this.flashMarks);
    this.flashMarks = wrapOffsets(this.book, this.pager.blockEls, start, end, () => h('mark.flash'));
    const marks = this.flashMarks;
    setTimeout(() => {
      unwrap(marks);
      if (this.flashMarks === marks) this.flashMarks = [];
    }, 2600);
  }

  /* ============================================================ selection */

  readSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const content = $('#page-content');
    if (!content.contains(range.commonAncestorContainer)) return null;
    let start = offsetFromDom(this.book, range.startContainer, range.startOffset);
    let end = offsetFromDom(this.book, range.endContainer, range.endOffset);
    if (start === null || end === null) return null;
    if (end < start) [start, end] = [end, start];
    // Trim whitespace at the edges so highlights start and end on text.
    const charAt = (off) => {
      const i = blockIndexAt(this.book, off);
      const x = this.book.blocks[i].x;
      const local = off - this.book.starts[i];
      return local < x.length ? x[local] : '\n';
    };
    while (start < end && /\s/.test(charAt(start))) start++;
    while (end > start && /\s/.test(charAt(end - 1))) end--;
    const text = textBetween(this.book, start, end);
    if (!text) return null;
    return { start, end, text, rect: range.getBoundingClientRect() };
  }

  onMouseUp(e) {
    if (e.button !== 0) return;
    setTimeout(() => {
      const s = this.readSelection();
      if (s) {
        this.selection = s;
        this.showSelMenu(s.rect, null);
        return;
      }
      const mark = e.target.closest && e.target.closest('mark.hl');
      if (mark) {
        const hl = this.state.highlights.find((x) => x.id === mark.dataset.hid);
        if (hl) {
          this.selection = { start: hl.s, end: hl.e, text: hl.text, highlight: hl };
          this.showSelMenu(mark.getBoundingClientRect(), hl);
        }
      } else this.hideSelMenu();
    }, 0);
  }

  showSelMenu(rect, hl) {
    const menu = $('#sel-menu');
    menu.hidden = false;
    for (const b of $$('.swatch', menu)) b.classList.toggle('on', Boolean(hl && hl.c === b.dataset.color));
    $('[data-act="delete"]', menu).hidden = !hl;
    $('[data-act="note"]', menu).lastChild.nodeValue = hl && hl.note ? 'Edit note' : 'Note';
    const root = this.root.getBoundingClientRect();
    // Measure at the left edge: where the menu last stood must not squeeze it.
    menu.style.left = '0px';
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let x = rect.left + rect.width / 2 - mw / 2 - root.left;
    let y = rect.top - mh - 10 - root.top;
    if (y < 8) y = rect.bottom + 10 - root.top;
    x = clamp(x, 8, root.width - mw - 8);
    y = clamp(y, 8, root.height - mh - 8);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  hideSelMenu() {
    $('#sel-menu').hidden = true;
    this.selection = null;
  }

  async selAction(act, color) {
    const s = this.selection;
    if (!s) return;
    const existing = s.highlight;
    switch (act) {
      case 'color': {
        if (existing) {
          existing.c = color;
          this.repaintHighlight(existing);
        } else this.addHighlight(s, color);
        break;
      }
      case 'note': {
        const hl = existing || this.addHighlight(s, 'yellow');
        this.hideSelMenu();
        window.getSelection()?.removeAllRanges();
        const note = await promptDialog({ title: hl.note ? 'Edit note' : 'Add a note', label: `\u201c${hl.text.slice(0, 140)}${hl.text.length > 140 ? '\u2026' : ''}\u201d`, value: hl.note || '', multiline: true, placeholder: 'Your thoughts\u2026' });
        if (note !== null) {
          hl.note = note.trim().slice(0, 20000);
          this.repaintHighlight(hl);
          this.saveStateSoon();
        }
        return;
      }
      case 'copy':
        await this.api.copyText(s.text);
        toast('Copied to clipboard');
        break;
      case 'word':
        this.saveWord(s.text, s.start);
        break;
      case 'search':
        this.openDrawer('search');
        $('#book-search').value = s.text.slice(0, 100);
        this.runSearch();
        break;
      case 'speak':
        this.startTts(s.start);
        break;
      case 'quote':
        this.shareQuote(s.text);
        break;
      case 'delete':
        if (existing) this.deleteHighlight(existing, true);
        break;
      default:
        break;
    }
    this.hideSelMenu();
    window.getSelection()?.removeAllRanges();
  }

  addHighlight(s, color) {
    // Merge with highlights it overlaps, like a highlighter pen.
    const overlapping = this.state.highlights.filter((x) => x.s < s.end && x.e > s.start);
    let start = s.start;
    let end = s.end;
    let note = '';
    for (const o of overlapping) {
      start = Math.min(start, o.s);
      end = Math.max(end, o.e);
      if (o.note) note = note ? `${note}\n${o.note}` : o.note;
    }
    this.state.highlights = this.state.highlights.filter((x) => !overlapping.includes(x));
    unwrap(overlapping.flatMap((o) => $$(`mark[data-hid="${CSS.escape(o.id)}"]`, $('#page-content'))));
    const hl = { id: uid(), s: start, e: end, c: color, note, text: textBetween(this.book, start, end).slice(0, 20000), at: Date.now() };
    this.state.highlights.push(hl);
    this.paintHighlight(hl);
    this.saveStateSoon();
    return hl;
  }

  deleteHighlight(hl, offerUndo) {
    this.state.highlights = this.state.highlights.filter((x) => x !== hl);
    this.repaintHighlight(hl);
    this.saveStateSoon();
    if (!$('#drawer-notes').hidden) this.renderNotes();
    if (offerUndo) {
      toast('Highlight removed', {
        action: {
          label: 'Undo',
          run: () => {
            this.state.highlights.push(hl);
            this.paintHighlight(hl);
            this.saveStateSoon();
            if (!$('#drawer-notes').hidden) this.renderNotes();
          },
        },
      });
    }
  }

  sentenceAround(offset) {
    const i = blockIndexAt(this.book, offset);
    const list = sentences(this.book.blocks[i].x, this.book.starts[i]);
    const s = list.find((x) => x.start <= offset && x.end >= offset) || list[0];
    return s ? s.text.slice(0, 500) : '';
  }

  /** Save the selected word (with its sentence) to the Word Journal. No lookup, nothing online. */
  saveWord(text, offset) {
    const word = text.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').split(/\s+/).slice(0, 4).join(' ').slice(0, 80);
    if (!word) return;
    this.app.words.add({ word, context: this.sentenceAround(offset), bookId: this.meta.id, bookTitle: this.meta.title });
    toast(`\u201c${word}\u201d saved to your Word Journal`);
  }

  /* ============================================================ bookmarks */

  toggleBookmark() {
    const { start, end } = this.pager.currentRange();
    const onPage = this.state.bookmarks.filter((b) => b.o >= start && b.o < Math.max(end, start + 1));
    if (onPage.length) {
      this.state.bookmarks = this.state.bookmarks.filter((b) => !onPage.includes(b));
      toast('Bookmark removed');
    } else {
      this.state.bookmarks.push({ id: uid(), o: start, text: excerptAt(this.book, start, end), at: Date.now() });
      toast('Page bookmarked');
    }
    this.updateInfo();
    this.saveStateSoon();
    if (!$('#drawer-notes').hidden) this.renderNotes();
  }

  /* ============================================================ drawers */

  openDrawer(name) {
    // Contents, search and notes work on text pages; comics and original-layout PDFs only have reading settings.
    if (this.pageView && name !== 'display') return;
    const id = `#drawer-${name}`;
    const el = $(id);
    const wasOpen = !el.hidden;
    this.closeDrawers();
    if (wasOpen) return;
    el.hidden = false;
    // A panel left scrolled while reading another book starts at its top again.
    if (el.dataset.book !== this.meta.id) {
      el.dataset.book = this.meta.id;
      el.scrollTop = 0;
    }
    this.root.classList.add('drawer-open');
    if (name === 'toc') this.renderToc();
    if (name === 'notes') this.renderNotes();
    if (name === 'display') this.renderDisplay();
    if (name === 'search') setTimeout(() => $('#book-search').focus(), 30);
    this.showChrome(true);
  }

  closeDrawers() {
    for (const d of $$('.drawer', this.root)) d.hidden = true;
    this.root.classList.remove('drawer-open');
    $('#r-more-menu')?.remove();
  }

  anyDrawerOpen() {
    return $$('.drawer', this.root).some((d) => !d.hidden) || Boolean($('#r-more-menu'));
  }

  renderToc() {
    const list = $('#toc-list');
    list.replaceChildren();
    $('#toc-book').textContent = this.meta.title;
    const entries = this.book.toc.length && this.book.toc[0].offset > 0 ? [{ title: 'Beginning', offset: 0, level: 0 }, ...this.book.toc] : this.book.toc;
    if (!entries.length) {
      list.append(h('li.muted.pad', { text: 'No chapters were found in this book.' }), h('li', null, h('button.toc-item', { onclick: () => this.jumpTo(0) }, h('span', { text: 'Beginning' }))));
      return;
    }
    for (const t of entries) {
      const page = this.pager.pageIndexOf(t.offset) + 1;
      const btn = h(
        'button.toc-item',
        {
          dataset: { offset: String(t.offset) },
          style: { paddingLeft: `${12 + t.level * 16}px` },
          onclick: () => {
            this.jumpTo(t.offset);
            this.closeDrawers();
          },
        },
        h('span.toc-title', { text: t.title }),
        h('span.toc-page', { text: `${this.pager.pagesExact() ? '' : '~'}${page}` })
      );
      list.append(h('li', null, btn));
    }
    this.markCurrentToc(true);
  }

  markCurrentToc(scroll) {
    const { start } = this.pager.currentRange();
    const items = $$('.toc-item', $('#toc-list'));
    let current = null;
    for (const it of items) {
      it.classList.remove('current');
      if (Number(it.dataset.offset) <= start) current = it;
    }
    if (current) {
      current.classList.add('current');
      if (scroll) current.scrollIntoView({ block: 'center' });
    }
  }

  /* ----------------------------------------------------------- search */

  runSearch() {
    const q = $('#book-search').value.trim();
    const results = $('#search-results');
    results.replaceChildren();
    const summary = $('#search-summary');
    if (q.length < 2) {
      summary.textContent = q ? 'Type at least two characters.' : '';
      return;
    }
    const needle = q.toLocaleLowerCase();
    const whole = $('#search-whole').checked;
    const isWord = (ch) => ch !== undefined && /[\p{L}\p{N}_]/u.test(ch);
    const LIMIT = 1000;
    let count = 0;
    const frag = document.createDocumentFragment();
    outer: for (let i = 0; i < this.book.blocks.length; i++) {
      const x = this.book.blocks[i].x;
      const lower = x.toLocaleLowerCase();
      if (lower.length !== x.length) continue;
      let from = 0;
      for (;;) {
        const at = lower.indexOf(needle, from);
        if (at < 0) break;
        from = at + needle.length;
        if (whole && (isWord(x[at - 1]) || isWord(x[at + needle.length]))) continue;
        const offset = this.book.starts[i] + at;
        frag.append(this.searchResult(x, at, needle.length, offset));
        if (++count >= LIMIT) break outer;
      }
    }
    results.append(frag);
    summary.textContent = count === 0 ? 'No matches.' : count >= LIMIT ? `First ${LIMIT} matches` : `${count} match${count === 1 ? '' : 'es'}`;
  }

  searchResult(x, at, len, offset) {
    const s = Math.max(0, at - 60);
    const e = Math.min(x.length, at + len + 80);
    const chapter = chapterAt(this.book, offset);
    const page = this.pager.pageIndexOf(offset) + 1;
    return h(
      'li',
      null,
      h(
        'button.result',
        {
          onclick: () => {
            this.jumpTo(offset);
            requestAnimationFrame(() => this.flashRange(offset, offset + len));
          },
        },
        h('span.result-meta', { text: `${chapter ? chapter.title + ' \u00b7 ' : ''}Page ${page}` }),
        h('span.result-text', null, (s > 0 ? '\u2026' : '') + x.slice(s, at), h('b', { text: x.slice(at, at + len) }), x.slice(at + len, e) + (e < x.length ? '\u2026' : ''))
      )
    );
  }

  /* ----------------------------------------------------------- notes */

  renderNotes() {
    const tab = this.notesTab || 'highlights';
    for (const b of $$('[data-ntab]', $('#drawer-notes'))) b.setAttribute('aria-selected', String(b.dataset.ntab === tab));
    const list = $('#notes-items');
    list.replaceChildren();
    const filter = $('#notes-filter');
    filter.hidden = tab !== 'highlights';
    if (tab === 'highlights') {
      filter.replaceChildren(
        ...['all', ...COLORS].map((c) =>
          h(`button.chip${(this.noteColor || 'all') === c ? '.on' : ''}`, { onclick: () => ((this.noteColor = c), this.renderNotes()), 'aria-label': c }, c === 'all' ? 'All' : h(`span.dot.hl-${c}`))
        )
      );
      const items = this.state.highlights.filter((x) => !this.noteColor || this.noteColor === 'all' || x.c === this.noteColor).sort((a, b) => a.s - b.s);
      if (!items.length) list.append(h('li.empty', { text: 'Select text on a page to highlight it or add a note.' }));
      for (const hl of items) list.append(this.noteItem(hl));
    } else {
      const items = [...this.state.bookmarks].sort((a, b) => a.o - b.o);
      if (!items.length) list.append(h('li.empty', { text: 'Press B or click the bookmark button to bookmark a page.' }));
      for (const bm of items) {
        const chapter = chapterAt(this.book, bm.o);
        list.append(
          h(
            'li.note',
            null,
            h(
              'button.note-main',
              { onclick: () => (this.jumpTo(bm.o), this.closeDrawers()) },
              h('span.note-meta', { text: `Page ${this.pager.pageIndexOf(bm.o) + 1}${chapter ? ' \u00b7 ' + chapter.title : ''} \u00b7 ${formatDate(bm.at)}` }),
              h('span.note-text', { text: `${bm.text}\u2026` })
            ),
            h('div.note-actions', null, h('button.icon-btn.small', { title: 'Delete bookmark', 'aria-label': 'Delete bookmark', onclick: () => ((this.state.bookmarks = this.state.bookmarks.filter((b) => b !== bm)), this.saveStateSoon(), this.updateInfo(), this.renderNotes()) }, icon('trash', 16)))
          )
        );
      }
    }
  }

  noteItem(hl) {
    const chapter = chapterAt(this.book, hl.s);
    return h(
      'li.note',
      { className: `note c-${hl.c}` },
      h(
        'button.note-main',
        { onclick: () => (this.jumpTo(hl.s), this.closeDrawers()) },
        h('span.note-meta', { text: `Page ${this.pager.pageIndexOf(hl.s) + 1}${chapter ? ' \u00b7 ' + chapter.title : ''} \u00b7 ${formatDate(hl.at)}` }),
        h('span.note-text', { text: hl.text.length > 400 ? `${hl.text.slice(0, 400)}\u2026` : hl.text }),
        hl.note ? h('span.note-note', { text: hl.note }) : null
      ),
      h(
        'div.note-actions',
        null,
        h('button.icon-btn.small', {
          title: hl.note ? 'Edit note' : 'Add note',
          'aria-label': 'Edit note',
          onclick: async () => {
            const note = await promptDialog({ title: hl.note ? 'Edit note' : 'Add a note', label: `\u201c${hl.text.slice(0, 140)}${hl.text.length > 140 ? '\u2026' : ''}\u201d`, value: hl.note || '', multiline: true, placeholder: 'Your thoughts\u2026' });
            if (note !== null) {
              hl.note = note.trim().slice(0, 20000);
              this.repaintHighlight(hl);
              this.saveStateSoon();
              this.renderNotes();
            }
          },
        }, icon('edit', 16)),
        h('button.icon-btn.small', { title: 'Delete', 'aria-label': 'Delete highlight', onclick: () => this.deleteHighlight(hl, true) }, icon('trash', 16))
      )
    );
  }

  async exportNotes() {
    if (!this.meta) return;
    if (!this.book) {
      toast('Comics do not have highlights to export.');
      return;
    }
    await exportNotesDialog(this.meta, this.book, this.state);
  }

  async shareQuote(text) {
    const png = await renderQuoteImage({ text, title: this.meta.title, author: this.meta.author, theme: this.settings.theme, font: this.settings.font });
    if (await this.api.exportImage(`${this.meta.title.slice(0, 60).replace(/[\\/:*?"<>|]+/g, ' ')} - quote.png`, png)) toast('Quote image saved');
  }

  /* ----------------------------------------------------------- display settings */

  renderDisplay() {
    const s = this.settings;
    const sw = $('#theme-swatches');
    sw.replaceChildren(
      ...THEMES.map((t) =>
        h(
          `button.theme-swatch${s.theme === t.id ? '.on' : ''}`,
          { style: { background: t.bg, color: t.fg }, title: t.name, 'aria-label': `${t.name} theme`, 'aria-pressed': String(s.theme === t.id), onclick: () => this.setSetting({ theme: t.id }) },
          h('span', { text: 'Aa' }),
          h('small', { text: t.name })
        )
      )
    );
    const font = $('#set-font');
    if (!font.options.length) {
      for (const f of FONTS) font.append(h('option', { value: f.id, text: f.name }));
      font.onchange = () => this.setSetting({ font: font.value });
    }
    font.value = s.font;
    for (const opt of font.options) opt.style.fontFamily = FONTS.find((f) => f.id === opt.value).stack;
    const size = $('#set-size');
    size.value = String(s.fontSize);
    $('#size-value').textContent = `${s.fontSize}px`;
    const seg = (id, list, key) => {
      $(id).replaceChildren(...list.map((o) => h(`button${s[key] === o.id ? '.on' : ''}`, { text: o.name, 'aria-pressed': String(s[key] === o.id), onclick: () => this.setSetting({ [key]: o.id }) })));
    };
    seg('#set-spacing', SPACING, 'spacing');
    seg('#set-margins', MARGINS, 'margins');
    seg('#set-align', ALIGN, 'align');
    seg('#set-layout', LAYOUTS, 'layout');
    seg('#set-para', PARA, 'para');
    seg('#set-anim', ANIMS, 'anim');
    seg('#set-flow', FLOWS, 'flow');
    seg('#set-comic-fit', COMIC_FITS, 'comicFit');
    seg('#set-comic-spread', COMIC_SPREADS, 'comicSpread');
    seg('#set-pdf-fit', [{ id: 'width', name: 'Fit width' }, { id: 'page', name: 'Whole page' }], 'pdfFit');
    $('#set-pdf-crop').checked = s.pdfCrop;
    const rtl = this.pageView ? this.pageView.rtl : false;
    $('#set-comic-dir').replaceChildren(
      ...[[false, 'Left to right'], [true, 'Right to left']].map(([v, label]) =>
        h(`button${rtl === v ? '.on' : ''}`, { text: label, 'aria-pressed': String(rtl === v), onclick: () => this.setDirection(v) })
      )
    );
    $('#set-book-only').checked = Boolean(this.state.settings);
    $('#set-bright').value = String(s.brightness);
    $('#set-warm').value = String(s.warmth);
    $('#set-hyphen').checked = s.hyphenate;
    $('#set-footer').checked = s.showFooter;
    $('#set-taps').checked = s.tapZones;
  }

  setSetting(patch) {
    if (this.state.settings) {
      const own = {};
      const global = {};
      for (const [k, v] of Object.entries(patch)) (BOOK_KEYS.includes(k) ? own : global)[k] = v;
      if (Object.keys(own).length) {
        this.state.settings = { ...this.state.settings, ...own };
        this.saveStateSoon();
      }
      if (Object.keys(global).length) this.app.updateSettings(global);
      else this.applySettings();
    } else this.app.updateSettings(patch);
    if (!$('#drawer-display').hidden) this.renderDisplay();
  }

  setDirection(rtl) {
    if (!this.pageView) return;
    this.pageView.rtl = rtl;
    this.state.rtl = rtl;
    this.saveStateSoon();
    this.pageView.relayout();
    this.renderDisplay();
  }

  /** Start or stop using separate reading settings for this book. */
  setBookOnly(on) {
    if (on) this.state.settings = Object.fromEntries(BOOK_KEYS.map((k) => [k, this.app.settings[k]]));
    else delete this.state.settings;
    this.saveStateSoon();
    this.applySettings();
    this.renderDisplay();
    toast(on ? 'These settings now apply to this book only' : 'This book uses your general reading settings again');
  }

  /** Called by the app whenever settings change. */
  applySettings() {
    if (this.pageView) {
      applyReaderStyle(this.root, this.settings);
      const st = this.settings;
      const key = `${st.comicFit}|${st.comicSpread}|${st.pdfFit}|${st.pdfCrop}`;
      this.pageView.settings = st;
      if (this.pageView.source.crop !== undefined) this.pageView.source.crop = st.pdfCrop;
      if (key !== this.pageKey) {
        this.pageKey = key;
        this.pageView.relayout();
      }
      return;
    }
    if (!this.pager) return;
    applyReaderStyle(this.root, this.settings);
    if ((this.settings.flow === 'scroll') !== (this.pager instanceof ScrollView)) {
      // Switching between pages and scrolling: rebuild the view at the same place.
      this.state.pos = this.pager.currentRange().start;
      this.reopening = true;
      this.saveState()
        .then(() => this.meta && this.open(this.meta))
        .finally(() => (this.reopening = false));
      return;
    }
    this.pager.settings = this.settings;
    const sig = layoutSignature(this.settings);
    if (sig !== this.layoutSig) {
      this.layoutSig = sig;
      this.relayoutSoon();
    } else this.updateInfo();
    this.positionTapZones();
  }

  relayoutSoon() {
    clearTimeout(this.relayoutTimer);
    const anchor = this.pager.currentRange().start;
    this.relayoutTimer = setTimeout(() => {
      if (!this.pager) return;
      this.hideSelMenu();
      this.pager.relayout(anchor);
      this.positionTapZones();
    }, 90);
  }

  positionTapZones() {
    const g = this.pager?.geometry;
    if (!g || this.settings.flow === 'scroll') return;
    const area = $('#page-area');
    const w = Math.max(44, g.left);
    $('#tap-prev').style.width = `${w}px`;
    $('#tap-next').style.width = `${Math.max(44, area.clientWidth - g.left - g.width)}px`;
    $('#spread-spine').hidden = g.cpv !== 2;
  }

  /* ----------------------------------------------------------- read aloud */

  ensureSpeaker() {
    if (!Speaker.available()) {
      toast('Read aloud is not available on this system.', { kind: 'error' });
      return null;
    }
    if (!this.speaker) {
      this.speaker = new Speaker({
        book: this.book,
        onSentence: (s) => this.onSpeakSentence(s),
        onStop: () => this.onTtsStopped(),
      });
    }
    this.speaker.book = this.book;
    this.speaker.rate = this.settings.ttsRate;
    this.speaker.voiceName = this.settings.ttsVoice;
    return this.speaker;
  }

  toggleTts() {
    if (this.speaker && this.speaker.playing) {
      if (this.speaker.paused) this.speaker.resume();
      else this.speaker.pause();
      this.updateTtsBar();
      return;
    }
    this.startTts(this.pager.currentRange().start);
  }

  startTts(offset) {
    const sp = this.ensureSpeaker();
    if (!sp) return;
    if (!Speaker.voices().length) {
      toast('No speech voices were found. Install a text-to-speech voice in your operating system settings.', { kind: 'error', timeout: 6000 });
    }
    this.populateVoices();
    $('#tts-bar').hidden = false;
    sp.start(offset);
    this.armSleepTimer();
    this.updateTtsBar();
  }

  /** Stop reading aloud after a while, or at the end of the chapter (-1). */
  armSleepTimer() {
    clearTimeout(this.sleepTimer);
    const mins = this.settings.ttsSleep;
    this.sleepChapter = null;
    if (mins > 0) this.sleepTimer = setTimeout(() => (this.stopTts(), toast('Read aloud stopped (sleep timer)')), mins * 60000);
    else if (mins === -1 && this.pager) this.sleepChapter = chapterRange(this.book, this.pager.currentRange().start);
  }

  stopTts() {
    clearTimeout(this.sleepTimer);
    this.sleepChapter = null;
    this.speaker?.stop(false);
    this.onTtsStopped();
  }

  onTtsStopped() {
    unwrap(this.ttsMarks);
    this.ttsMarks = [];
    $('#tts-bar').hidden = true;
  }

  onSpeakSentence(s) {
    if (!this.pager) return;
    if (this.sleepChapter && s.start >= this.sleepChapter.end) {
      this.stopTts();
      toast('Read aloud stopped at the end of the chapter');
      return;
    }
    const { start, end } = this.pager.currentRange();
    if (s.start >= end || s.start < start) this.pager.goTo(s.start);
    unwrap(this.ttsMarks);
    this.ttsMarks = wrapOffsets(this.book, this.pager.blockEls, s.start, s.end, () => h('mark.tts'));
    this.touch();
  }

  updateTtsBar() {
    const playing = this.speaker && this.speaker.playing && !this.speaker.paused;
    setIcon($('#tts-play'), playing ? 'pause' : 'play');
    $('#tts-play').setAttribute('aria-label', playing ? 'Pause' : 'Resume');
    $('#tts-rate').value = String(this.settings.ttsRate);
    $('#tts-rate-val').textContent = `${this.settings.ttsRate.toFixed(1)}\u00d7`;
    $('#tts-sleep').value = String(this.settings.ttsSleep);
  }

  populateVoices() {
    const sel = $('#tts-voice');
    const voices = Speaker.voices();
    sel.replaceChildren(h('option', { value: '', text: 'System voice' }), ...voices.map((v) => h('option', { value: v.name, text: `${v.name} (${v.lang})` })));
    sel.value = voices.some((v) => v.name === this.settings.ttsVoice) ? this.settings.ttsVoice : '';
  }

  /* ----------------------------------------------------------- more menu */

  openMoreMenu() {
    if ($('#r-more-menu')) {
      this.closeDrawers();
      return;
    }
    this.closeDrawers();
    const item = (label, iconName, fn) => h('button.menu-item', { onclick: () => (menu.remove(), fn()) }, icon(iconName, 18), h('span', { text: label }));
    const menu = h(
      'div.popup-menu',
      { id: 'r-more-menu', role: 'menu' },
      item('Go to page\u2026', 'chevronRight', () => this.goToDialog()),
      item('Book details\u2026', 'info', () => this.app.library.showDetails(this.meta)),
      this.book ? item('Export notes\u2026', 'download', () => this.exportNotes()) : null,
      this.meta.format === 'pdf' && this.meta.hasSource ? item(this.originalLayout ? 'Reflowed text' : 'Original PDF layout', 'expand', () => this.toggleOriginalLayout()) : null,
      item('Set status\u2026', 'check', async () => {
        const status = await this.app.library.pickStatus('Reading status', this.meta.status);
        if (status) {
          await this.app.library.setStatus(this.meta, status);
          toast(`Marked as ${status === 'unread' ? 'not started' : status}`);
        }
      }),
      item('Keyboard shortcuts', 'info', () => this.app.showShortcuts()),
      item('About & legal', 'book', () => this.app.showAbout())
    );
    this.root.append(menu);
    const r = $('#r-more').getBoundingClientRect();
    const root = this.root.getBoundingClientRect();
    menu.style.top = `${r.bottom - root.top + 6}px`;
    menu.style.right = `${root.right - r.right}px`;
    this.root.classList.add('drawer-open');
    menuKeys(menu, $('#r-more'), () => this.closeDrawers());
  }

  /* ============================================================ chrome */

  showChrome(sticky = false) {
    const top = $('#reader-top');
    top.classList.add('visible');
    clearTimeout(this.chromeTimer);
    if (!sticky) {
      this.chromeTimer = setTimeout(() => {
        if (!this.anyDrawerOpen() && !top.matches(':hover')) top.classList.remove('visible');
      }, 2600);
    }
  }

  /* ============================================================ keyboard */

  onKey(e) {
    if (!this.pager && !this.pageView) return false;
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Escape') {
      if (!$('#sel-menu').hidden) this.hideSelMenu();
      else if (this.anyDrawerOpen()) this.closeDrawers();
      else if (this.speaker?.playing) this.stopTts();
      else this.app.showLibrary();
      return true;
    }
    if (mod && e.key.toLowerCase() === 'f') {
      if (!this.pageView) this.openDrawer('search');
      return true;
    }
    if (mod && e.key.toLowerCase() === 'b') {
      if (!this.pageView) this.toggleBookmark();
      return true;
    }
    if (mod && e.key.toLowerCase() === 'g') {
      this.goToDialog();
      return true;
    }
    if (typing || mod || e.altKey) return false;
    // Space presses a button that was reached with the Tab key; anywhere else it turns the page
    // (also after a toolbar button was clicked with the mouse, which leaves focus on it).
    if (e.key === ' ' && this.tabbed && t && t.tagName === 'BUTTON') return false;
    this.touch();
    if (this.pageView) {
      const pv = this.pageView;
      const keys = {
        ArrowRight: () => pv.turnVisual(1),
        ArrowLeft: () => pv.turnVisual(-1),
        ArrowDown: () => this.turn(1),
        ArrowUp: () => this.turn(-1),
        PageDown: () => this.turn(1),
        PageUp: () => this.turn(-1),
        ' ': () => this.turn(e.shiftKey ? -1 : 1),
        Home: () => pv.show(0),
        End: () => pv.show(pv.count - 1),
        a: () => this.openDrawer('display'),
        g: () => this.goToDialog(),
        f: () => this.api.toggleFullscreen(),
        '?': () => this.app.showShortcuts(),
      };
      if (keys[e.key]) {
        keys[e.key]();
        return true;
      }
      return false;
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case 'j':
        this.turn(1);
        return true;
      case ' ':
        this.turn(e.shiftKey ? -1 : 1);
        return true;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'k':
        this.turn(-1);
        return true;
      case 'Home':
        this.jumpTo(0);
        return true;
      case 'End':
        this.jumpTo(this.book.total);
        return true;
      case '[':
        this.chapterJump(-1);
        return true;
      case ']':
        this.chapterJump(1);
        return true;
      case 't':
        this.openDrawer('toc');
        return true;
      case 'n':
        this.openDrawer('notes');
        return true;
      case 'a':
        this.openDrawer('display');
        return true;
      case 'b':
        this.toggleBookmark();
        return true;
      case 'g':
        this.goToDialog();
        return true;
      case '/':
        this.openDrawer('search');
        return true;
      case 'r':
        this.toggleTts();
        return true;
      case 'f':
        this.api.toggleFullscreen();
        return true;
      case '+':
      case '=':
        this.setSetting({ fontSize: clamp(this.settings.fontSize + 1, 12, 40) });
        return true;
      case '-':
        this.setSetting({ fontSize: clamp(this.settings.fontSize - 1, 12, 40) });
        return true;
      case 'Backspace':
        this.goBack();
        return true;
      case '?':
        this.app.showShortcuts();
        return true;
      default:
        return false;
    }
  }

  /* ============================================================ wiring */

  bindStatic() {
    const area = $('#page-area');
    // Did focus last move with the Tab key, or with the mouse? (See onKey.)
    document.addEventListener('keydown', (e) => e.key === 'Tab' && (this.tabbed = true), true);
    document.addEventListener('mousedown', () => (this.tabbed = false), true);
    $('#r-back').onclick = () => this.app.showLibrary();
    $('#r-toc').onclick = () => this.openDrawer('toc');
    $('#r-search').onclick = () => this.openDrawer('search');
    $('#r-notes').onclick = () => this.openDrawer('notes');
    $('#r-display').onclick = () => this.openDrawer('display');
    $('#r-tts').onclick = () => this.toggleTts();
    $('#r-bookmark').onclick = () => this.toggleBookmark();
    $('#r-fullscreen').onclick = () => this.api.toggleFullscreen();
    $('#r-more').onclick = () => this.openMoreMenu();
    $('#back-pill').onclick = () => this.goBack();
    $('#info-left').onclick = () => this.cycleFooter();
    $('#tap-prev').onclick = () => (this.pageView ? this.pageView.turnVisual(-1) : this.turn(-1));
    $('#tap-next').onclick = () => (this.pageView ? this.pageView.turnVisual(1) : this.turn(1));
    for (const d of $$('.drawer [data-close]', this.root)) d.onclick = () => this.closeDrawers();

    // Selection menu.
    const sw = $('#sel-swatches');
    for (const c of COLORS) sw.append(h('button.swatch', { className: `swatch hl-${c}`, dataset: { color: c }, title: `Highlight ${c}`, 'aria-label': `Highlight ${c}`, onclick: () => this.selAction('color', c) }));
    for (const b of $$('#sel-menu [data-act]')) b.onclick = () => this.selAction(b.dataset.act);
    $('#sel-menu').addEventListener('mousedown', (e) => e.preventDefault());

    // Pages: selection, wheel, swipe.
    const viewport = $('#page-viewport');
    viewport.addEventListener('mouseup', (e) => this.onMouseUp(e));
    area.addEventListener('wheel', (e) => this.onWheel(e), { passive: true });
    area.addEventListener('mousedown', (e) => {
      if (this.anyDrawerOpen() && !e.target.closest('.drawer, .popup-menu')) this.closeDrawers();
    });
    let touchX = null;
    area.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') touchX = e.clientX;
    });
    area.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'touch' || touchX === null) return;
      const dx = e.clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50 && !this.readSelection()) this.turn(dx < 0 ? 1 : -1);
    });

    // Chrome auto-hide.
    this.root.addEventListener('mousemove', (e) => {
      this.touch();
      const r = this.root.getBoundingClientRect();
      if (e.clientY - r.top < 64) this.showChrome();
    });

    // Progress bar scrubbing.
    const progress = $('#progress');
    const tip = $('#progress-tip');
    const fractionAt = (e) => {
      const r = progress.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1);
    };
    const offsetAt = (e) => Math.round(fractionAt(e) * this.book.total);
    // Comics and original-layout PDFs: the bar maps straight onto page numbers.
    const pageAt = (e) => Math.min(this.pageView.count - 1, Math.floor(fractionAt(e) * this.pageView.count));
    progress.addEventListener('mousemove', (e) => {
      if (this.pageView) tip.textContent = `Page ${pageAt(e) + 1}`;
      else if (this.book && this.pager) {
        const off = offsetAt(e);
        const ch = chapterAt(this.book, off);
        tip.textContent = `${ch ? ch.title + ' \u00b7 ' : ''}Page ${this.pager.pageIndexOf(off) + 1} \u00b7 ${Math.round((off / this.book.total) * 100)}%`;
      } else return;
      tip.hidden = false;
      const r = progress.getBoundingClientRect();
      tip.style.left = `${clamp(e.clientX - r.left, 60, r.width - 60)}px`;
    });
    progress.addEventListener('mouseleave', () => (tip.hidden = true));
    progress.addEventListener('click', (e) => {
      if (this.pageView) this.pageView.show(pageAt(e));
      else if (this.book) this.jumpTo(offsetAt(e));
    });
    progress.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (this.pageView) {
        e.preventDefault();
        e.stopPropagation();
        this.turn(e.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (!this.book || !this.pager) return;
      const step = this.book.total / 100;
      e.preventDefault();
      e.stopPropagation();
      this.jumpTo(this.pager.currentRange().start + (e.key === 'ArrowRight' ? step : -step), { remember: false });
    });

    // Search.
    const search = debounce(() => this.runSearch(), 250);
    $('#book-search').addEventListener('input', search);
    $('#search-whole').addEventListener('change', () => this.runSearch());

    // Notes tabs + export.
    for (const b of $$('[data-ntab]')) b.onclick = () => ((this.notesTab = b.dataset.ntab), this.renderNotes());
    $('#notes-export').onclick = () => this.exportNotes();

    // Display settings.
    $('#set-size').addEventListener('input', (e) => this.setSetting({ fontSize: Number(e.target.value) }));
    $('#size-down').onclick = () => this.setSetting({ fontSize: clamp(this.settings.fontSize - 1, 12, 40) });
    $('#size-up').onclick = () => this.setSetting({ fontSize: clamp(this.settings.fontSize + 1, 12, 40) });
    $('#set-bright').addEventListener('input', (e) => this.app.updateSettings({ brightness: Number(e.target.value) }));
    $('#set-warm').addEventListener('input', (e) => this.app.updateSettings({ warmth: Number(e.target.value) }));
    $('#set-hyphen').onchange = (e) => this.setSetting({ hyphenate: e.target.checked });
    $('#set-footer').onchange = (e) => this.setSetting({ showFooter: e.target.checked });
    $('#set-taps').onchange = (e) => this.setSetting({ tapZones: e.target.checked });
    $('#set-reset').onclick = () => {
      const keep = { footerMode: this.settings.footerMode, appTheme: this.settings.appTheme, libraryView: this.settings.libraryView, librarySort: this.settings.librarySort, legalAcknowledged: this.settings.legalAcknowledged };
      this.setSetting({ ...DEFAULTS, ...keep });
    };

    // Read aloud.
    $('#tts-play').onclick = () => this.toggleTts();
    $('#tts-stop').onclick = () => this.stopTts();
    $('#tts-rate').addEventListener('input', (e) => {
      const rate = Number(e.target.value);
      this.app.updateSettings({ ttsRate: rate });
      if (this.speaker) this.speaker.rate = rate;
      this.updateTtsBar();
    });
    $('#tts-sleep').onchange = (e) => {
      this.app.updateSettings({ ttsSleep: Number(e.target.value) });
      this.armSleepTimer();
    };
    $('#set-book-only').onchange = (e) => this.setBookOnly(e.target.checked);
    $('#set-pdf-crop').onchange = (e) => this.app.updateSettings({ pdfCrop: e.target.checked });
    $('#tts-voice').onchange = (e) => {
      this.app.updateSettings({ ttsVoice: e.target.value });
      if (this.speaker) {
        this.speaker.voiceName = e.target.value;
        if (this.speaker.playing) this.speaker.start(this.ttsMarks.length ? offsetFromDom(this.book, this.ttsMarks[0].firstChild, 0) : this.pager.currentRange().start);
      }
    };
    if (Speaker.available()) window.speechSynthesis.addEventListener?.('voiceschanged', () => this.populateVoices());

    // Resize.
    const ro = new ResizeObserver(() => {
      if (this.pager && this.pager.geometry) {
        const a = $('#page-area');
        if (`${Math.floor(a.clientWidth)}x${Math.floor(a.clientHeight)}` !== this.lastAreaSize) {
          this.lastAreaSize = `${Math.floor(a.clientWidth)}x${Math.floor(a.clientHeight)}`;
          this.relayoutSoon();
        }
      }
    });
    ro.observe(area);

    this.api.onFullscreen((full) => {
      setIcon($('#r-fullscreen'), full ? 'shrink' : 'expand');
      this.root.classList.toggle('fullscreen', full);
    });
  }

  onWheel(e) {
    if (e.target.closest('.drawer, .popup-menu, .sel-menu')) return;
    if (this.pageView) {
      const s = this.pageView.stage;
      if (s.scrollHeight > s.clientHeight + 4 || s.scrollWidth > s.clientWidth + 4) return; // let it scroll
    } else if (!this.pager || this.settings.flow === 'scroll') return;
    if (e.ctrlKey) return;
    const now = Date.now();
    if (now < this.wheelLock) return;
    this.wheelAcc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    clearTimeout(this.wheelReset);
    this.wheelReset = setTimeout(() => (this.wheelAcc = 0), 220);
    if (Math.abs(this.wheelAcc) >= 60) {
      this.turn(this.wheelAcc > 0 ? 1 : -1);
      this.wheelAcc = 0;
      this.wheelLock = now + 280;
    }
  }
}

