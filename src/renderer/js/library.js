/**
 * The library: books (grid/list), continue reading, status/collection/tag
 * filters, series, ratings, bulk actions, search inside books, plus the
 * Notes, Word Journal and Reading Stats tabs.
 */
import { $, $$, h, icon, toast, modal, confirmDialog, promptDialog, formatDate, debounce, menuKeys } from './ui/dom.js';
import { indexBook, formatDuration, chapterAt } from './core/book.js';
import { exportNotesDialog } from './notes-export.js';
import { generatedCover } from './ui/cover.js';

const FORMAT_LABEL = { txt: 'Text', md: 'Markdown', html: 'HTML', epub: 'EPUB', pdf: 'PDF', sample: 'Guide', cbz: 'Comic' };
export const STATUS_LABEL = { unread: 'Not started', reading: 'Reading', finished: 'Finished', abandoned: 'Abandoned' };
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 14)}`;

export class Library {
  constructor(app) {
    this.app = app;
    this.api = window.readalune;
    this.books = [];
    this.collectionsList = [];
    this.filter = 'all';
    this.query = '';
    this.tab = 'books';
    this.selectMode = false;
    this.selected = new Set();
    this.deepSearch = false;
    this.searchToken = 0;
    this.bind();
  }

  async load() {
    const [books, collections] = await Promise.all([this.api.listBooks(), this.api.getCollections()]);
    this.books = books;
    this.collectionsList = [...collections].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const id of [...this.selected]) if (!this.byId(id)) this.selected.delete(id);
    this.render();
  }

  updateCached(meta) {
    if (!meta) return;
    const i = this.books.findIndex((b) => b.id === meta.id);
    if (i >= 0) this.books[i] = { ...this.books[i], ...meta };
  }

  byId(id) {
    return this.books.find((b) => b.id === id);
  }

  collectionName(id) {
    return this.collectionsList.find((c) => c.id === id)?.name || '';
  }

  allTags() {
    const set = new Set();
    for (const b of this.books) for (const t of b.tags || []) set.add(t);
    return [...set].sort();
  }

  async saveCollections(list) {
    this.collectionsList = list.map((c, i) => ({ ...c, sortOrder: i }));
    await this.api.setCollections(this.collectionsList);
  }

  async ensureCollection(name) {
    const existing = this.collectionsList.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const c = { id: uid(), name: name.slice(0, 80), sortOrder: this.collectionsList.length };
    await this.saveCollections([...this.collectionsList, c]);
    return c.id;
  }

  /* ================================================================ render */

  render() {
    if (this.tab === 'books') this.renderBooks();
    else if (this.tab === 'classics') this.app.classics.render();
    else if (this.tab === 'notes') this.renderAllNotes();
    else if (this.tab === 'words') this.renderWords();
    else if (this.tab === 'stats') this.renderStats();
  }

  setTab(tab) {
    this.tab = tab;
    for (const b of $$('.lib-tabs [data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    for (const p of $$('.tab-panel')) p.hidden = p.dataset.panel !== tab;
    this.render();
  }

  sortedFiltered() {
    const q = this.query.trim().toLowerCase();
    const list = this.books.filter((b) => {
      if (q && !this.deepSearch && !`${b.title} ${b.author} ${b.series} ${(b.tags || []).join(' ')}`.toLowerCase().includes(q)) return false;
      const f = this.filter;
      if (f === 'all') return true;
      if (f.startsWith('s:')) return b.status === f.slice(2);
      if (f.startsWith('c:')) return (b.collectionIds || []).includes(f.slice(2));
      if (f.startsWith('t:')) return (b.tags || []).includes(f.slice(2));
      return true;
    });
    const sort = this.app.settings.librarySort;
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    const plain = (t) => t.replace(/^(the|a|an)\s+/i, '');
    const cmp = {
      recent: (a, b) => (b.lastOpenedAt || b.addedAt) - (a.lastOpenedAt || a.addedAt),
      added: (a, b) => b.addedAt - a.addedAt,
      title: (a, b) => collator.compare(plain(a.title), plain(b.title)),
      author: (a, b) => collator.compare(lastName(a.author), lastName(b.author)) || collator.compare(a.title, b.title),
      progress: (a, b) => (b.status === 'finished' ? 1 : b.progress) - (a.status === 'finished' ? 1 : a.progress),
      series: (a, b) => collator.compare(a.series || '\uffff', b.series || '\uffff') || (a.seriesIndex ?? 1e9) - (b.seriesIndex ?? 1e9) || collator.compare(a.title, b.title),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0) || collator.compare(a.title, b.title),
    }[sort];
    return list.sort(cmp);
  }

  renderBooks() {
    const grid = $('#book-grid');
    const view = this.app.settings.libraryView;
    grid.className = `book-grid ${view}${this.selectMode ? ' selecting' : ''}`;
    for (const b of $$('[data-view]')) b.classList.toggle('on', b.dataset.view === view);
    $('#lib-sort').value = this.app.settings.librarySort;
    $('#lib-select').classList.toggle('on', this.selectMode);
    $('#lib-deep').checked = this.deepSearch;

    const chips = [
      ['all', 'All'],
      ...Object.entries(STATUS_LABEL).map(([k, v]) => [`s:${k}`, v, null, this.books.filter((b) => b.status === k).length]),
      ...this.collectionsList.map((c) => [`c:${c.id}`, c.name, 'tag']),
      ...this.allTags().map((t) => [`t:${t}`, `#${t}`]),
    ];
    if (!chips.some(([id]) => id === this.filter)) this.filter = 'all';
    $('#lib-filters').replaceChildren(
      ...chips.map(([id, label, ic, count]) => h(`button.chip${this.filter === id ? '.on' : ''}`, { onclick: () => ((this.filter = id), this.renderBooks()) }, ic ? icon(ic, 14) : null, label, count ? h('span.chip-count', { text: String(count) }) : null)),
      h('button.chip.ghost', { title: 'Create, rename and reorder collections', onclick: () => this.manageCollections() }, icon('settings', 14), 'Collections')
    );

    const empty = this.books.length === 0;
    $('#lib-empty').hidden = !empty;
    $('.lib-toolbar').hidden = empty;
    $('#lib-filters').hidden = empty;
    this.renderContinue(empty);
    this.renderBulkBar();

    if (this.deepSearch && this.query.trim().length >= 3) {
      $('#lib-noresults').hidden = true;
      this.runDeepSearch();
      return;
    }
    const list = this.sortedFiltered();
    $('#lib-noresults').hidden = empty || list.length > 0;
    const groups = this.app.settings.librarySort === 'series';
    const nodes = [];
    let lastSeries = null;
    for (const b of list) {
      if (groups && view === 'grid' && (b.series || '') !== lastSeries) {
        lastSeries = b.series || '';
        nodes.push(h('div.series-heading', { text: lastSeries || 'Not in a series' }));
      }
      nodes.push(view === 'list' ? this.listRow(b) : this.card(b));
    }
    grid.replaceChildren(...nodes);
  }

  renderContinue(empty) {
    const host = $('#continue-card');
    const recent = this.books.filter((b) => b.lastOpenedAt && b.status === 'reading').sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0];
    if (empty || !recent || this.query || this.filter !== 'all' || this.selectMode) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    const pct = Math.round((recent.progress || 0) * 100);
    const minutesLeft = (recent.wordCount * (1 - (recent.progress || 0))) / this.app.stats.wpm();
    const left = recent.format === 'cbz' ? '' : `${minutesLeft < 1 ? 'Less than a minute' : `About ${formatDuration(minutesLeft)}`} left \u00b7 `;
    host.replaceChildren(
      this.cover(recent, 'small'),
      h(
        'div.continue-body',
        null,
        h('div.eyebrow', { text: 'Continue reading' }),
        h('h2', { text: recent.title }),
        recent.author ? h('div.muted', { text: recent.author }) : null,
        h('div.progress-line', null, h('div.bar', null, h('div.fill', { style: { width: `${pct}%` } })), h('span', { text: `${pct}%` })),
        h('div.muted.small', { text: `${left}last read ${formatDate(recent.lastOpenedAt)}` }),
        h('button.btn.primary', { onclick: () => this.app.openBook(recent) }, icon('book', 18), ' Resume')
      )
    );
  }

  cover(b, size = '', badges = true) {
    const el = h(`div.cover${size ? '.' + size : ''}`, { style: { '--hue': String(b.coverHue ?? 210) } });
    if (b.hasCover) {
      const img = h('img', { src: `covers/${b.id}.jpg`, alt: '', loading: 'lazy', draggable: false });
      img.onerror = () => {
        img.remove();
        el.append(generatedCover(b));
      };
      el.append(img);
    } else el.append(generatedCover(b));
    if (badges && b.status === 'finished') el.append(h('span.badge.done', { title: 'Finished' }, icon('check', 14)));
    else if (badges && b.status === 'unread' && !b.lastOpenedAt) el.append(h('span.badge.new', { text: 'New' }));
    if (this.selectMode) el.append(h(`span.select-box${this.selected.has(b.id) ? '.on' : ''}`, null, icon('check', 14)));
    return el;
  }

  subtitle(b) {
    if (b.series) return `${b.series}${b.seriesIndex !== null && b.seriesIndex !== undefined ? ` #${b.seriesIndex}` : ''}`;
    return b.author || FORMAT_LABEL[b.format] || '';
  }

  activate(b, e) {
    if (this.selectMode) {
      if (this.selected.has(b.id)) this.selected.delete(b.id);
      else this.selected.add(b.id);
      this.renderBooks();
      return;
    }
    if (e && (e.ctrlKey || e.metaKey)) {
      this.selectMode = true;
      this.selected.add(b.id);
      this.renderBooks();
      return;
    }
    this.app.openBook(b);
  }

  card(b) {
    const pct = b.status === 'finished' ? 100 : Math.round((b.progress || 0) * 100);
    return h(
      `article.book-card${this.selected.has(b.id) ? '.selected' : ''}`,
      { dataset: { id: b.id } },
      h('button.cover-btn', { onclick: (e) => this.activate(b, e), 'aria-label': `Open ${b.title}`, oncontextmenu: (e) => (e.preventDefault(), this.bookMenu(b, e.currentTarget)) }, this.cover(b)),
      h(
        'div.card-body',
        null,
        h('div.card-title', { text: b.title, title: b.title }),
        h('div.card-author', { text: this.subtitle(b), title: b.author || '' }),
        b.rating ? stars(b.rating) : null,
        h(
          'div.card-foot',
          null,
          h('div.bar', null, h('div.fill', { style: { width: `${pct}%` } })),
          h('span.pct', { text: b.status === 'finished' ? 'Done' : b.status === 'abandoned' ? 'Stopped' : pct ? `${pct}%` : FORMAT_LABEL[b.format] || '' }),
          h('button.icon-btn.small.more', { title: 'More', 'aria-label': `More options for ${b.title}`, onclick: (e) => this.bookMenu(b, e.currentTarget) }, icon('more', 18))
        )
      )
    );
  }

  listRow(b) {
    const pct = b.status === 'finished' ? 100 : Math.round((b.progress || 0) * 100);
    return h(
      `article.book-row${this.selected.has(b.id) ? '.selected' : ''}`,
      { dataset: { id: b.id } },
      h(
        'button.row-main',
        { onclick: (e) => this.activate(b, e), oncontextmenu: (e) => (e.preventDefault(), this.bookMenu(b, e.currentTarget)) },
        this.cover(b, 'tiny'),
        h('div.row-text', null, h('div.card-title', { text: b.title }), h('div.card-author', { text: [b.author, b.series ? this.subtitle(b) : ''].filter(Boolean).join(' \u00b7 ') })),
        h('span.row-format', { text: STATUS_LABEL[b.status] || '' }),
        h('span.row-date', { text: b.lastOpenedAt ? formatDate(b.lastOpenedAt) : 'Never opened' }),
        h('div.row-progress', null, h('div.bar', null, h('div.fill', { style: { width: `${pct}%` } })), h('span', { text: b.status === 'finished' ? 'Done' : `${pct}%` }))
      ),
      h('button.icon-btn.small', { title: 'More', 'aria-label': `More options for ${b.title}`, onclick: (e) => this.bookMenu(b, e.currentTarget) }, icon('more', 18))
    );
  }

  /* ================================================================ bulk */

  renderBulkBar() {
    const bar = $('#bulk-bar');
    bar.hidden = !this.selectMode;
    if (!this.selectMode) return;
    const n = this.selected.size;
    const visible = this.sortedFiltered();
    bar.replaceChildren(
      h('span.bulk-count', { text: n ? `${n} selected` : 'Select books' }),
      h('button.btn.small', { onclick: () => (visible.forEach((b) => this.selected.add(b.id)), this.renderBooks()) }, 'Select all'),
      h('div.spacer'),
      h('button.btn.small', { disabled: !n, onclick: () => this.editCollections([...this.selected]) }, icon('tag', 16), ' Add to collection'),
      h('button.btn.small', { disabled: !n, onclick: () => this.bulkTag() }, '# Add tag'),
      h('button.btn.small', { disabled: !n, onclick: () => this.bulkStatus() }, icon('check', 16), ' Set status'),
      h('button.btn.small.danger', { disabled: !n, onclick: () => this.removeMany([...this.selected]) }, icon('trash', 16), ' Remove'),
      h('button.btn.small.primary', { onclick: () => this.toggleSelect(false) }, 'Done')
    );
  }

  toggleSelect(on = !this.selectMode) {
    this.selectMode = on;
    if (!on) this.selected.clear();
    this.renderBooks();
  }

  async bulkTag() {
    const tag = await promptDialog({ title: 'Add a tag', label: `Tag ${this.selected.size} book${this.selected.size === 1 ? '' : 's'}`, placeholder: 'e.g. holiday, favourite', confirm: 'Add tag' });
    if (!tag || !tag.trim()) return;
    const t = tag.trim().toLowerCase().slice(0, 60);
    for (const id of this.selected) {
      const b = this.byId(id);
      if (b) this.updateCached(await this.api.updateMeta(id, { tags: [...new Set([...(b.tags || []), t])] }));
    }
    toast(`Tagged ${this.selected.size} book${this.selected.size === 1 ? '' : 's'} #${t}`);
    this.renderBooks();
  }

  async bulkStatus() {
    const status = await this.pickStatus(`Set status for ${this.selected.size} book${this.selected.size === 1 ? '' : 's'}`);
    if (!status) return;
    for (const id of this.selected) {
      const m = await this.api.updateMeta(id, { status });
      this.updateCached(m);
      if (status === 'finished') this.app.stats.bookFinished(m);
    }
    this.renderBooks();
  }

  pickStatus(title, current) {
    return modal({
      title,
      build: (body, close) => {
        body.append(h('div.status-picks', null, Object.entries(STATUS_LABEL).map(([k, v]) => h(`button.btn${current === k ? '.primary' : ''}`, { onclick: () => close(k) }, v))));
      },
    });
  }

  async removeMany(ids) {
    const ok = await confirmDialog({
      title: `Remove ${ids.length} book${ids.length === 1 ? '' : 's'}?`,
      message: 'Their highlights, notes and bookmarks will be deleted from Readalune. Your original files are not touched.',
      confirm: 'Remove',
      danger: true,
    });
    if (!ok) return;
    for (const id of ids) await this.api.removeBook(id);
    this.selected.clear();
    toast(`Removed ${ids.length} book${ids.length === 1 ? '' : 's'}`);
    await this.load();
  }

  /* ================================================================ menus */

  bookMenu(b, anchor) {
    $('#lib-menu')?.remove();
    const item = (label, iconName, fn, cls = '') => h(`button.menu-item${cls}`, { onclick: () => (menu.remove(), fn()) }, icon(iconName, 18), h('span', { text: label }));
    const menu = h(
      'div.popup-menu',
      { id: 'lib-menu', role: 'menu' },
      item('Open', 'book', () => this.app.openBook(b)),
      item('Details & edit\u2026', 'edit', () => this.showDetails(b)),
      item('Collections\u2026', 'tag', () => this.editCollections([b.id])),
      item('Set status\u2026', 'check', async () => {
        const status = await this.pickStatus('Reading status', b.status);
        if (status) this.setStatus(b, status);
      }),
      item('Export notes\u2026', 'download', () => this.exportNotesFor(b)),
      item('Select', 'grid', () => ((this.selectMode = true), this.selected.add(b.id), this.renderBooks())),
      item('Remove from library', 'trash', () => this.removeMany([b.id]), '.danger')
    );
    document.body.append(menu);
    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    menu.style.left = `${Math.max(8, Math.min(window.innerWidth - mw - 8, r.right - mw))}px`;
    menu.style.top = `${r.bottom + mh + 8 > window.innerHeight ? Math.max(8, r.top - mh - 6) : r.bottom + 6}px`;
    const close = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('mousedown', close, true);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', close, true), 0);
    menuKeys(menu, anchor, () => {
      menu.remove();
      document.removeEventListener('mousedown', close, true);
    });
  }

  async setStatus(b, status) {
    const m = await this.api.updateMeta(b.id, { status });
    this.updateCached(m);
    if (status === 'finished') this.app.stats.bookFinished(m);
    if (this.app.reader.meta && this.app.reader.meta.id === m.id) Object.assign(this.app.reader.meta, m);
    this.render();
  }

  async showDetails(b) {
    const meta = this.byId(b.id) || b;
    let state = {};
    try {
      state = await this.api.getState(meta.id);
    } catch {
      state = {};
    }
    const saved = await modal({
      title: 'Book details',
      wide: true,
      build: (body, close) => {
        const field = (label, value, attrs = {}) => {
          const input = h(attrs.multiline ? 'textarea' : 'input', { type: attrs.type || 'text', 'aria-label': label, rows: attrs.multiline ? 3 : undefined, min: attrs.min, step: attrs.step });
          input.value = value ?? '';
          return [h('label.field-label', { text: label }), input];
        };
        const [lt, title] = field('Title', meta.title);
        const [la, author] = field('Author', meta.author);
        const [ls, series] = field('Series', meta.series);
        const [li, seriesIndex] = field('Number in series', meta.seriesIndex ?? '', { type: 'number', min: '0', step: 'any' });
        const [lp, publisher] = field('Publisher', meta.publisher);
        const [lg, tags] = field('Tags (comma separated)', (meta.tags || []).join(', '));
        const [ld, description] = field('Description', meta.description, { multiline: true });
        const status = h('select', { 'aria-label': 'Status' }, Object.entries(STATUS_LABEL).map(([k, v]) => h('option', { value: k, text: v })));
        status.value = meta.status || 'unread';
        let rating = meta.rating || 0;
        const starRow = h('div.star-input', { role: 'radiogroup', 'aria-label': 'Rating' });
        const drawStars = () =>
          starRow.replaceChildren(
            ...[1, 2, 3, 4, 5].map((n) => h(`button.star${n <= rating ? '.on' : ''}`, { type: 'button', 'aria-label': `${n} star${n === 1 ? '' : 's'}`, onclick: () => ((rating = rating === n ? 0 : n), drawStars()) }, icon('star', 22)))
          );
        drawStars();
        const wpm = this.app.stats.wpm();
        const rows = [
          ['Format', FORMAT_LABEL[meta.format] || meta.format],
          ['Original file', meta.sourceName || '\u2014'],
          ['Length', meta.format === 'cbz' ? `${meta.totalChars} pages` : `${meta.wordCount.toLocaleString()} word${meta.wordCount === 1 ? '' : 's'} \u00b7 ${meta.wordCount / wpm < 1 ? '' : 'about '}${formatDuration(meta.wordCount / wpm)} to read`],
          ['Progress', meta.status === 'finished' ? 'Finished' : `${Math.round((meta.progress || 0) * 100)}%`],
          ['Time spent reading', meta.readingSeconds ? formatDuration(meta.readingSeconds / 60) : '\u2014'],
          ['Highlights & notes', String((state.highlights || []).length)],
          ['Bookmarks', String((state.bookmarks || []).length)],
          ['Collections', (meta.collectionIds || []).map((id) => this.collectionName(id)).filter(Boolean).join(', ') || '\u2014'],
          ['Added', formatDate(meta.addedAt)],
          ['Last opened', meta.lastOpenedAt ? formatDate(meta.lastOpenedAt) : 'Never'],
        ];
        body.append(
          h(
            'div.details',
            null,
            h('div.details-side', null, this.cover(meta, '', false), h('label.field-label', { text: 'Status' }), status, h('label.field-label', { text: 'Your rating' }), starRow),
            h(
              'div.details-fields',
              null,
              lt, title, la, author,
              h('div.two-col', null, h('div', null, ls, series), h('div', null, li, seriesIndex)),
              lp, publisher, lg, tags, ld, description,
              h('dl.info-grid', null, rows.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]))
            )
          ),
          h(
            'div.modal-actions',
            null,
            h('button.btn', { text: 'Cancel', onclick: () => close(null) }),
            h('button.btn.primary', {
              text: 'Save',
              onclick: () =>
                close({
                  title: title.value.slice(0, 500),
                  author: author.value.slice(0, 500),
                  series: series.value.slice(0, 300),
                  seriesIndex: seriesIndex.value === '' ? null : Math.max(0, Math.min(100000, Number(seriesIndex.value) || 0)),
                  publisher: publisher.value.slice(0, 300),
                  description: description.value.slice(0, 20000),
                  tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 50),
                  status: status.value,
                  rating,
                }),
            })
          )
        );
      },
    });
    if (!saved) return;
    const m = await this.api.updateMeta(meta.id, saved);
    this.updateCached(m);
    if (saved.status === 'finished' && meta.status !== 'finished') this.app.stats.bookFinished(m);
    if (this.app.reader.meta && this.app.reader.meta.id === m.id) Object.assign(this.app.reader.meta, m);
    this.render();
  }

  /** Choose collections for one book (set exactly) or several (add to). */
  async editCollections(ids) {
    const books = ids.map((id) => this.byId(id)).filter(Boolean);
    if (!books.length) return;
    const single = books.length === 1;
    const result = await modal({
      title: single ? 'Collections' : `Add ${books.length} books to collections`,
      build: (body, close) => {
        const chosen = new Set(single ? books[0].collectionIds || [] : []);
        const extra = [];
        const list = h('div.check-list');
        const draw = () => {
          const all = [...this.collectionsList, ...extra];
          list.replaceChildren(
            ...all.map((c) => {
              const cb = h('input', { type: 'checkbox' });
              cb.checked = chosen.has(c.id);
              cb.onchange = () => (cb.checked ? chosen.add(c.id) : chosen.delete(c.id));
              return h('label.check', null, cb, ' ', c.name);
            })
          );
          if (!all.length) list.append(h('p.muted', { text: 'No collections yet. Create one below.' }));
        };
        draw();
        const input = h('input', { type: 'text', placeholder: 'New collection name', 'aria-label': 'New collection name', maxlength: '80' });
        const add = () => {
          const name = input.value.trim().slice(0, 80);
          if (!name) return;
          const found = [...this.collectionsList, ...extra].find((c) => c.name.toLowerCase() === name.toLowerCase());
          const c = found || { id: uid(), name, sortOrder: this.collectionsList.length + extra.length };
          if (!found) extra.push(c);
          chosen.add(c.id);
          input.value = '';
          draw();
        };
        input.addEventListener('keydown', (e) => e.key === 'Enter' && (e.preventDefault(), add()));
        body.append(
          list,
          h('div.row', null, input, h('button.btn', { onclick: add }, icon('plus', 16), ' Add')),
          h('div.modal-actions', null, h('button.btn', { text: 'Cancel', onclick: () => close(null) }), h('button.btn.primary', { text: 'Save', onclick: () => close({ chosen: [...chosen], extra }) }))
        );
      },
    });
    if (!result) return;
    if (result.extra.length) await this.saveCollections([...this.collectionsList, ...result.extra]);
    for (const b of books) {
      const next = single ? result.chosen : [...new Set([...(b.collectionIds || []), ...result.chosen])];
      this.updateCached(await this.api.updateMeta(b.id, { collectionIds: next }));
    }
    this.renderBooks();
  }

  async manageCollections() {
    const result = await modal({
      title: 'Collections',
      build: (body, close) => {
        let list = this.collectionsList.map((c) => ({ ...c }));
        const host = h('div.manage-list');
        const draw = () => {
          host.replaceChildren(
            ...list.map((c, i) => {
              const name = h('input', { type: 'text', 'aria-label': 'Collection name', maxlength: '80' });
              name.value = c.name;
              name.oninput = () => (c.name = name.value);
              const count = this.books.filter((b) => (b.collectionIds || []).includes(c.id)).length;
              return h(
                'div.manage-row',
                null,
                name,
                h('span.muted.small', { text: `${count} book${count === 1 ? '' : 's'}` }),
                h('button.icon-btn.small', { title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, onclick: () => (([list[i - 1], list[i]] = [list[i], list[i - 1]]), draw()) }, icon('chevronLeft', 16)),
                h('button.icon-btn.small', { title: 'Move down', 'aria-label': 'Move down', disabled: i === list.length - 1, onclick: () => (([list[i + 1], list[i]] = [list[i], list[i + 1]]), draw()) }, icon('chevronRight', 16)),
                h('button.icon-btn.small', { title: 'Delete collection', 'aria-label': 'Delete collection', onclick: () => ((list = list.filter((x) => x !== c)), draw()) }, icon('trash', 16))
              );
            })
          );
          if (!list.length) host.append(h('p.muted', { text: 'No collections yet.' }));
        };
        draw();
        body.append(
          host,
          h('button.btn', { onclick: () => (list.push({ id: uid(), name: 'New collection', sortOrder: list.length }), draw()) }, icon('plus', 16), ' New collection'),
          h('p.muted.small', { text: 'Deleting a collection keeps its books in your library.' }),
          h('div.modal-actions', null, h('button.btn', { text: 'Cancel', onclick: () => close(null) }), h('button.btn.primary', { text: 'Save', onclick: () => close(list) }))
        );
      },
    });
    if (!result) return;
    const keep = new Set(result.map((c) => c.id));
    await this.saveCollections(result.map((c) => ({ ...c, name: c.name.trim() || 'Untitled' })));
    for (const b of this.books) {
      const ids = b.collectionIds || [];
      if (ids.some((id) => !keep.has(id))) this.updateCached(await this.api.updateMeta(b.id, { collectionIds: ids.filter((id) => keep.has(id)) }));
    }
    this.renderBooks();
  }

  async exportNotesFor(b) {
    const [content, state] = await Promise.all([this.api.getContent(b.id), this.api.getState(b.id)]);
    if (!content) return;
    if (content.kind === 'comic') {
      toast('Comics do not have highlights to export.');
      return;
    }
    await exportNotesDialog(b, indexBook(content), state || {});
  }

  /* ================================================================ search inside books */

  async runDeepSearch() {
    const token = ++this.searchToken;
    const q = this.query.trim().toLowerCase();
    const grid = $('#book-grid');
    grid.className = 'book-grid list';
    const status = h('p.muted', { text: 'Searching inside your books\u2026' });
    grid.replaceChildren(status);
    let total = 0;
    for (const b of this.books) {
      if (b.format === 'cbz') continue;
      let content;
      try {
        content = await this.api.getContent(b.id);
      } catch {
        continue;
      }
      if (token !== this.searchToken) return;
      const book = indexBook(content);
      const hits = [];
      for (let i = 0; i < book.blocks.length && hits.length < 6; i++) {
        const x = book.blocks[i].x;
        const at = x.toLowerCase().indexOf(q);
        if (at >= 0 && x.length === x.toLowerCase().length) hits.push({ offset: book.starts[i] + at, x, at });
      }
      if (!hits.length) continue;
      total += hits.length;
      grid.append(
        h(
          'section.deep-result',
          null,
          h('header', null, this.cover(b, 'tiny'), h('div', null, h('h3', { text: b.title }), h('div.muted.small', { text: b.author || '' }))),
          ...hits.map((hit) => {
            const s = Math.max(0, hit.at - 70);
            const e = Math.min(hit.x.length, hit.at + q.length + 90);
            const ch = chapterAt(book, hit.offset);
            return h(
              'button.result',
              { onclick: () => this.app.openBook(b, hit.offset) },
              h('span.result-meta', { text: ch ? ch.title : `${Math.round((hit.offset / book.total) * 100)}%` }),
              h('span.result-text', null, (s > 0 ? '\u2026' : '') + hit.x.slice(s, hit.at), h('b', { text: hit.x.slice(hit.at, hit.at + q.length) }), hit.x.slice(hit.at + q.length, e) + (e < hit.x.length ? '\u2026' : ''))
            );
          })
        )
      );
      await new Promise((r) => setTimeout(r, 0));
    }
    if (token !== this.searchToken) return;
    status.textContent = total ? `Matches inside your books for \u201c${this.query.trim()}\u201d` : `No book contains \u201c${this.query.trim()}\u201d.`;
  }

  /* ================================================================ notes tab */

  async renderAllNotes() {
    const host = $('#all-notes');
    host.replaceChildren(h('p.muted', { text: 'Loading\u2026' }));
    const q = ($('#notes-search').value || '').trim().toLowerCase();
    const groups = [];
    for (const b of [...this.books].sort((a, c) => (c.lastOpenedAt || 0) - (a.lastOpenedAt || 0))) {
      let state;
      try {
        state = await this.api.getState(b.id);
      } catch {
        continue;
      }
      const items = (state.highlights || []).filter((x) => !q || `${x.text} ${x.note}`.toLowerCase().includes(q)).sort((a, c) => a.s - c.s);
      if (items.length) groups.push({ book: b, items });
    }
    if (this.tab !== 'notes') return;
    host.replaceChildren();
    if (!groups.length) {
      host.append(h('div.empty-state.small', null, h('p', { text: q ? 'No notes match your search.' : 'Highlights and notes you make while reading will appear here.' })));
      return;
    }
    for (const g of groups) {
      host.append(
        h(
          'section.note-group',
          null,
          h('header', null, this.cover(g.book, 'tiny'), h('div', null, h('h3', { text: g.book.title }), h('div.muted', { text: `${g.items.length} highlight${g.items.length === 1 ? '' : 's'}` })), h('div.spacer'), h('button.btn.small', { onclick: () => this.exportNotesFor(g.book) }, icon('download', 16), ' Export')),
          h(
            'ol.notes-list',
            null,
            g.items.map((hl) =>
              h(
                'li.note',
                { className: `note c-${hl.c}` },
                h(
                  'button.note-main',
                  { onclick: () => this.app.openBook(g.book, hl.s) },
                  h('span.note-text', { text: hl.text }),
                  hl.note ? h('span.note-note', { text: hl.note }) : null,
                  h('span.note-meta', { text: `${Math.round((hl.s / Math.max(1, g.book.totalChars)) * 100)}% \u00b7 ${formatDate(hl.at)}` })
                )
              )
            )
          )
        )
      );
    }
  }

  /* ================================================================ words tab */

  renderWords() {
    const host = $('#word-list');
    const hide = $('#words-hide-learned').checked;
    const words = this.app.words.list.filter((w) => !hide || !w.mastered);
    const learned = this.app.words.list.filter((w) => w.mastered).length;
    const total = this.app.words.list.length;
    $('#words-summary').textContent = total ? `${total} word${total === 1 ? '' : 's'} \u00b7 ${learned} learned` : '';
    host.replaceChildren();
    if (!words.length) {
      host.append(h('div.empty-state.small', null, h('p', { text: this.app.words.list.length ? 'Every word is marked as learned. Nice work!' : 'Select a word while reading and choose \u201cSave word\u201d to collect it here, with the sentence you found it in.' })));
      return;
    }
    for (const w of words) {
      const ctx = w.context || '';
      const at = ctx.toLowerCase().indexOf(w.word.toLowerCase());
      const context = at >= 0 ? [ctx.slice(0, at), h('b', { text: ctx.slice(at, at + w.word.length) }), ctx.slice(at + w.word.length)] : [ctx];
      const learnedBox = h('input', { type: 'checkbox', 'aria-label': `Mark ${w.word} as learned` });
      learnedBox.checked = Boolean(w.mastered);
      learnedBox.onchange = () => {
        this.app.words.setMastered(w.id, learnedBox.checked);
        this.renderWords();
      };
      host.append(
        h(
          `article.word-card${w.mastered ? '.learned' : ''}`,
          null,
          h(
            'div.word-head',
            null,
            h('h3', { text: w.word }),
            w.count > 1 ? h('span.badge', { text: `\u00d7${w.count}` }) : null,
            h('div.spacer'),
            h('label.check.small', null, learnedBox, ' Learned'),
            h('button.icon-btn.small', { title: 'Remove', 'aria-label': `Remove ${w.word}`, onclick: () => (this.app.words.remove(w.id), this.renderWords()) }, icon('trash', 16))
          ),
          ctx ? h('p.word-context', null, ...context) : null,
          h('div.muted.small', { text: `${w.bookTitle || ''}${w.bookTitle ? ' \u00b7 ' : ''}${formatDate(w.at)}` })
        )
      );
    }
  }

  /* ================================================================ stats tab */

  renderStats() {
    const host = $('#stats-body');
    const s = this.app.stats.summary();
    const minutes = (sec) => (sec ? formatDuration(sec / 60) : '0 min');
    const max = Math.max(60, ...s.days.map((d) => d.seconds));
    const card = (label, value, sub) => h('div.stat-card', null, h('div.stat-value', { text: value }), h('div.stat-label', { text: label }), sub ? h('div.muted.small', { text: sub }) : null);
    const perBook = [...this.books].filter((b) => b.readingSeconds > 0).sort((a, b) => b.readingSeconds - a.readingSeconds).slice(0, 8);
    const sessions = this.app.stats.recentSessions(8);
    const goal = this.app.settings.yearGoal;
    const year = new Date().getFullYear();
    const setGoal = async () => {
      const value = await promptDialog({ title: `Reading goal for ${year}`, label: 'How many books would you like to finish this year?', value: goal ? String(goal) : '12', confirm: 'Save goal' });
      if (value === null) return;
      const n = Math.max(0, Math.min(1000, parseInt(value, 10) || 0));
      this.app.updateSettings({ yearGoal: n });
      this.renderStats();
    };
    const pct = goal ? Math.min(100, Math.round((s.finishedThisYear / goal) * 100)) : 0;
    const goalCard = h(
      'section.goal-card',
      null,
      h('div.goal-ring', { style: { '--p': String(pct) } }, h('span', { text: goal ? `${pct}%` : '\u2014' })),
      h(
        'div.goal-text',
        null,
        h('h3', { text: goal ? `${s.finishedThisYear} of ${goal} books in ${year}` : `Set a reading goal for ${year}` }),
        h('div.muted', { text: goal ? (s.finishedThisYear >= goal ? 'Goal reached' : `${goal - s.finishedThisYear} to go`) : 'How many books will you read this year?' })
      ),
      h('div.spacer'),
      h('button.btn', { onclick: setGoal }, goal ? 'Change goal' : 'Set goal')
    );
    // (replaceChildren would print a missing section as the word "null".)
    const sections = [
      goalCard,
      h(
        'div.stat-cards',
        null,
        card('Today', minutes(s.today)),
        card('Last 7 days', minutes(s.week)),
        card('Reading streak', `${s.streak} day${s.streak === 1 ? '' : 's'}`, `Longest: ${s.longest} day${s.longest === 1 ? '' : 's'}`),
        card('Books finished', String(s.finished), `${s.finishedThisYear} this year`),
        card('Total reading time', minutes(s.total)),
        card('Reading speed', `${s.wpm} wpm`, s.speedSamples ? 'Measured from your page turns' : 'Default until measured')
      ),
      h('h3', { text: 'Last 14 days' }),
      h(
        'div.bar-chart',
        { role: 'img', 'aria-label': 'Minutes read per day over the last 14 days' },
        s.days.map((d) => h('div.bar-col', { title: `${d.label}: ${minutes(d.seconds)}` }, h('div.bar-v', { style: { height: `${Math.round((d.seconds / max) * 100)}%` } }), h('span', { text: d.short })))
      ),
      sessions.length ? h('h3', { text: 'Recent reading sessions' }) : null,
      sessions.length
        ? h(
            'ol.top-books',
            null,
            sessions.map((x) => {
              const b = this.byId(x.bookId);
              return h('li', null, b ? this.cover(b, 'tiny') : null, h('span.grow', { text: b ? b.title : 'Removed book' }), h('span.muted', { text: `${new Date(x.start).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} \u00b7 ${minutes((x.end - x.start) / 1000)} \u00b7 ${x.percentRead >= 0 ? '+' : ''}${Math.round(x.percentRead * 100)}%` }));
            })
          )
        : null,
      perBook.length ? h('h3', { text: 'Most read' }) : null,
      perBook.length ? h('ol.top-books', null, perBook.map((b) => h('li', null, this.cover(b, 'tiny'), h('span.grow', { text: b.title }), h('span.muted', { text: minutes(b.readingSeconds) })))) : null,
    ];
    host.replaceChildren(...sections.filter(Boolean));
  }

  /* ================================================================ events */

  bind() {
    for (const b of $$('.lib-tabs [data-tab]')) b.onclick = () => this.setTab(b.dataset.tab);
    $('#lib-search').addEventListener(
      'input',
      debounce((e) => {
        this.query = e.target.value;
        this.renderBooks();
      }, 250)
    );
    $('#lib-deep').onchange = (e) => {
      this.deepSearch = e.target.checked;
      this.renderBooks();
    };
    $('#lib-select').onclick = () => this.toggleSelect();
    $('#notes-search').addEventListener('input', debounce(() => this.renderAllNotes(), 250));
    $('#lib-sort').onchange = (e) => {
      this.app.updateSettings({ librarySort: e.target.value });
      this.renderBooks();
    };
    for (const b of $$('[data-view]')) b.onclick = () => (this.app.updateSettings({ libraryView: b.dataset.view }), this.renderBooks());
    $('#words-hide-learned').onchange = () => this.renderWords();
    $('#words-export').onclick = async () => {
      if (await this.api.exportText('readalune-word-journal.csv', this.app.words.toCsv())) toast('Word Journal exported');
    };
  }
}

function lastName(author) {
  const a = (author || '').split('&')[0].trim();
  if (!a) return '\uffff';
  if (a.includes(',')) return a;
  const parts = a.split(/\s+/);
  return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(' ')}`;
}

function stars(n) {
  return h('div.stars', { title: `${n} out of 5`, 'aria-label': `Rated ${n} out of 5` }, [1, 2, 3, 4, 5].map((i) => h(`span.star${i <= n ? '.on' : ''}`, null, icon('star', 13))));
}
