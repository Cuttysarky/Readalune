/**
 * The bundled Classics shelf: public-domain books from Project Gutenberg that
 * ship with Readalune (see src/renderer/classics/catalog.json and CLASSICS.md).
 * Adding one works offline; the file is checked against its recorded SHA-256.
 */
import { $, h, icon, toast, debounce, confirmDialog } from './ui/dom.js';
import { decodeText, parsePlainText } from './import/text.js';
import { hashString, formatDuration } from './core/book.js';
import { generatedCover } from './ui/cover.js';

const SHELVES = ['All', 'Novels', 'Adventure', "Children's", 'Poetry & Drama', 'Ideas'];
const PAGE = 120;
const sourceTag = (id) => `Project Gutenberg eBook #${id}`;

export class Classics {
  constructor(app) {
    this.app = app;
    this.api = window.readalune;
    this.catalog = null;
    this.shelf = 'All';
    this.query = '';
    this.busy = false;
    this.limit = PAGE;
  }

  async loadCatalog() {
    if (this.catalog) return this.catalog;
    const res = await fetch(new URL('../classics/catalog.json', import.meta.url));
    if (!res.ok) throw new Error('The classics catalog is missing.');
    this.catalog = await res.json();
    return this.catalog;
  }

  inLibrary(entry) {
    return this.app.library.books.find((b) => b.sourceName === sourceTag(entry.id));
  }

  async render() {
    const host = $('#classics-body');
    let catalog;
    try {
      catalog = await this.loadCatalog();
    } catch (err) {
      host.replaceChildren(h('p.muted', { text: err.message }));
      return;
    }
    const books = this.filtered();
    $('#classics-shelves').replaceChildren(
      ...SHELVES.map((s) => h(`button.chip${this.shelf === s ? '.on' : ''}`, { text: s, onclick: () => ((this.shelf = s), (this.limit = PAGE), this.render()) }))
    );
    // Draw in batches so a 1000-book shelf stays quick.
    host.replaceChildren(...books.slice(0, this.limit).map((b) => this.card(b)));
    if (!books.length) host.append(h('p.muted', { text: 'No classics match your search.' }));
    const more = $('#classics-more');
    more.hidden = books.length <= this.limit;
    more.textContent = `Show more (${books.length - this.limit} more)`;
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    return (this.catalog ? this.catalog.books : []).filter((b) => (this.shelf === 'All' || b.shelf === this.shelf) && (!q || `${b.title} ${b.author}`.toLowerCase().includes(q)));
  }

  /** The year the book was first published, where the catalogue records it. */
  year(entry) {
    if (entry.published === null || entry.published === undefined) return '';
    return entry.published < 0 ? `${-entry.published} BC` : String(entry.published);
  }

  card(entry) {
    const owned = this.inLibrary(entry);
    const minutes = (entry.bytes / 5.8) / this.app.stats.wpm();
    const cover = h(
      'div.cover',
      { style: { '--hue': String(hashString(entry.title) % 360) } },
      generatedCover(entry)
    );
    if (owned) cover.append(h('span.badge.done', { title: 'In your library' }, icon('check', 14)));
    return h(
      'article.book-card.classic',
      null,
      h('button.cover-btn', { 'aria-label': owned ? `Open ${entry.title}` : `Add ${entry.title}`, onclick: () => (owned ? this.app.openBook(owned) : this.add(entry, { open: true })) }, cover),
      h(
        'div.card-body',
        null,
        h('div.card-title', { text: entry.title, title: entry.fullTitle }),
        h('div.card-author', { text: entry.author }),
        h('div.muted.small', { text: [this.year(entry), formatDuration(minutes)].filter(Boolean).join(' \u00b7 ') }),
        owned
          ? h('button.btn.small', { onclick: () => this.app.openBook(owned) }, icon('book', 16), ' Read')
          : h('button.btn.small.primary', { onclick: (e) => this.add(entry, { button: e.currentTarget }) }, icon('plus', 16), ' Add')
      )
    );
  }

  /** Decompress, verify and import one bundled book. */
  async importEntry(entry) {
    const res = await fetch(new URL(`../classics/${entry.file}`, import.meta.url));
    if (!res.ok) throw new Error(`${entry.title}: file missing`);
    const stream = (await res.blob()).stream().pipeThrough(new DecompressionStream('gzip'));
    const bytes = await new Response(stream).arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
    if (digest !== entry.sha256) throw new Error(`${entry.title}: file failed its integrity check`);
    const book = parsePlainText(decodeText(bytes), { fileName: `${entry.id}.txt` });
    book.meta.title = entry.title;
    book.meta.author = entry.author;
    book.meta.language = 'en';
    book.meta.sourceName = sourceTag(entry.id);
    book.meta.coverHue = hashString(entry.title) % 360;
    book.meta.coverMotif = entry.motif || '';
    const meta = await this.api.addBook({ meta: book.meta, content: book.content, cover: null });
    const collectionId = await this.app.library.ensureCollection('Classics');
    return this.api.updateMeta(meta.id, { collectionIds: [collectionId] });
  }

  async add(entry, { open = false, button } = {}) {
    if (this.busy) return;
    const existing = this.inLibrary(entry);
    if (existing) return open ? this.app.openBook(existing) : undefined;
    this.busy = true;
    if (button) {
      button.disabled = true;
      button.lastChild.nodeValue = ' Adding\u2026';
    }
    try {
      const meta = await this.importEntry(entry);
      await this.app.library.load();
      if (open) await this.app.openBook(meta);
      else toast(`Added \u201c${entry.title}\u201d`, { kind: 'success', action: { label: 'Read now', run: () => this.app.openBook(meta) } });
    } catch (err) {
      console.error(err);
      toast(err.message || 'Could not add this book.', { kind: 'error' });
    } finally {
      this.busy = false;
      if (!open) this.render();
    }
  }

  async addAll() {
    if (this.busy) return;
    await this.loadCatalog();
    const todo = this.filtered().filter((b) => !this.inLibrary(b));
    if (!todo.length) return;
    const mb = Math.round((todo.reduce((s, b) => s + b.bytes, 0) * 2.2) / 1048576);
    const ok = await confirmDialog({
      title: `Add ${todo.length} books?`,
      message: `This adds ${todo.length} classics to your library, using about ${mb.toLocaleString()} MB of disk space. It may take a while. You can remove books later.`,
      confirm: `Add ${todo.length} books`,
    });
    if (!ok) return;
    this.busy = true;
    const busy = $('#busy');
    const text = $('#busy-text');
    const fill = $('#busy-fill');
    busy.hidden = false;
    let added = 0;
    try {
      for (let i = 0; i < todo.length; i++) {
        text.textContent = `Adding ${todo[i].title} (${i + 1} of ${todo.length})\u2026`;
        fill.style.width = `${Math.round((i / todo.length) * 100)}%`;
        try {
          await this.importEntry(todo[i]);
          added++;
        } catch (err) {
          console.error(err);
          toast(err.message, { kind: 'error' });
        }
        // Let the window repaint between books.
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      busy.hidden = true;
      this.busy = false;
      await this.app.library.load();
      this.app.library.setTab('classics');
      toast(`Added ${added} classic${added === 1 ? '' : 's'} to your library`, { kind: 'success' });
    }
  }

  bind() {
    $('#classics-search').addEventListener(
      'input',
      debounce((e) => {
        this.query = e.target.value;
        this.limit = PAGE;
        this.render();
      }, 150)
    );
    $('#classics-more').onclick = () => {
      this.limit += PAGE * 2;
      this.render();
    };
  }
}
