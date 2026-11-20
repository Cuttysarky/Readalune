/**
 * Readalune renderer entry point.
 */
import { $, h, icon, hydrateIcons, toast, modal, confirmDialog, promptDialog, debounce } from './ui/dom.js';
import { sanitizeSettings } from './settings.js';
import { Library } from './library.js';
import { Reader } from './reader/reader.js';
import { Stats } from './stats.js';
import { Words } from './words.js';
import { Classics } from './classics.js';
import { importFile, importSample, ImportError } from './import/index.js';

const api = window.readalune;
const REPO_URL = 'https://github.com/cuttysarky/readalune';

class App {
  async init() {
    hydrateIcons();
    this.settings = sanitizeSettings(await api.getSettings());
    this.info = await api.appInfo();
    // Read-only handle for the automated tests (development builds only). It
    // grants nothing beyond what this page's own code can already do.
    if (this.info.testHandle) Object.defineProperty(window, '__readaluneDebug', { value: this, enumerable: false });
    this.stats = new Stats(api, await api.getStats());
    this.words = new Words(api, await api.getWords());
    this.saveSettingsSoon = debounce(() => api.setSettings(this.settings).catch(() => {}), 400);
    this.library = new Library(this);
    this.reader = new Reader(this);
    this.classics = new Classics(this);
    this.classics.bind();
    this.applyAppTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.applyAppTheme());
    this.bind();
    await this.library.load();
    this.showLibrary(false);
    document.body.classList.add('ready');
    if (!this.settings.legalAcknowledged) await this.showFirstRun();
    // Books opened from the operating system ("Open with", double-click).
    api.onOpenFiles((files) => this.openFiles(files));
    await this.openFiles(await api.takeOpenedFiles());
  }

  /** One book opens straight away; several are added to the library. */
  openFiles(files) {
    if (!Array.isArray(files) || !files.length) return undefined;
    return this.importFiles(files, files.length === 1 ? { openAfter: true } : { quietDuplicates: true });
  }

  /* ---------------------------------------------------------- settings */

  updateSettings(patch) {
    this.settings = sanitizeSettings({ ...this.settings, ...patch });
    this.saveSettingsSoon();
    this.applyAppTheme();
    this.reader.applySettings();
  }

  applyAppTheme() {
    const pref = this.settings.appTheme;
    const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.appTheme = dark ? 'dark' : 'light';
  }

  /* ---------------------------------------------------------- views */

  async openBook(meta, offset) {
    try {
      if (this.reader.isOpen()) await this.reader.close();
      $('#library-view').hidden = true;
      $('#reader-view').hidden = false;
      await this.reader.open(meta);
      if (Number.isInteger(offset)) this.reader.jumpTo(offset);
    } catch (err) {
      console.error(err);
      toast(err.message || 'This book could not be opened.', { kind: 'error' });
      this.showLibrary();
    }
  }

  async showLibrary(refresh = true) {
    if (this.reader.isOpen()) await this.reader.close();
    $('#reader-view').hidden = true;
    $('#library-view').hidden = false;
    if (refresh) await this.library.load();
    else this.library.render();
  }

  /* ---------------------------------------------------------- import */

  async pickAndImport() {
    const files = await api.pickFiles();
    if (files.length) await this.importFiles(files);
  }

  /** Import a whole folder; optionally keep watching it for new books. */
  async importFolder(watch) {
    const files = await api.importFolder({ watch });
    if (!files) return;
    if (!files.length) {
      toast('No supported books were found in that folder.');
      return;
    }
    await this.importFiles(files, { quietDuplicates: true });
    if (watch) toast('Readalune will import new books added to this folder while it is open.', { timeout: 5000 });
  }

  async importFiles(files, { quietDuplicates = false, openAfter = false } = {}) {
    const busy = $('#busy');
    const text = $('#busy-text');
    const fill = $('#busy-fill');
    let added = 0;
    let last = null;
    let openTarget = null;
    busy.hidden = false;
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const label = files.length > 1 ? `(${i + 1}/${files.length}) ` : '';
        text.textContent = `${label}Importing ${f.name}\u2026`;
        fill.style.width = '0%';
        if (f.error) {
          toast(`${f.name}: ${f.error}`, { kind: 'error', timeout: 6000 });
          continue;
        }
        try {
          const book = await importFile(f, {
            onProgress: (msg, frac) => {
              text.textContent = `${label}${f.name}: ${msg}`;
              fill.style.width = `${Math.round((frac || 0) * 100)}%`;
            },
            askPassword: async (retry) => {
              busy.hidden = true;
              const pw = await promptDialog({ title: retry ? 'Wrong password \u2014 try again' : 'Password required', label: `\u201c${f.name}\u201d is password-protected. Enter the password to open it.`, password: true, confirm: 'Open' });
              busy.hidden = false;
              return pw;
            },
          });
          // Same file (SHA-256) or same text (content fingerprint) as a book we already have?
          const dup = this.library.books.find((b) => (b.hash && b.hash === book.meta.hash) || (b.fingerprint && b.fingerprint === book.meta.fingerprint));
          if (dup && openAfter) {
            openTarget = dup;
            continue;
          }
          if (dup && quietDuplicates) continue;
          if (dup) {
            busy.hidden = true;
            const again = await confirmDialog({ title: 'Already in your library', message: `\u201c${dup.title}\u201d looks like the same book. Import another copy?`, confirm: 'Import anyway' });
            busy.hidden = false;
            if (!again) continue;
          }
          text.textContent = `${label}Saving ${f.name}\u2026`;
          last = await api.addBook({ meta: book.meta, content: book.content, cover: book.cover || null, source: book.source || null });
          added++;
          if (openAfter) openTarget = last;
        } catch (err) {
          // Refused files (DRM, unsupported type...) are expected; only log real failures.
          if (!(err instanceof ImportError)) console.error(err);
          const msg = err instanceof ImportError ? err.message : 'Something went wrong while reading this file.';
          toast(`${f.name}: ${msg}`, { kind: 'error', timeout: 8000 });
        }
      }
    } finally {
      busy.hidden = true;
    }
    if (added) {
      await this.library.load();
      if (this.library.tab !== 'books') this.library.setTab('books');
      if (!this.reader.isOpen()) this.showLibrary(false);
      const book = last;
      if (!openTarget) toast(added === 1 ? `Added \u201c${book.title}\u201d` : `Added ${added} books`, {
        kind: 'success',
        timeout: 6000,
        action: added === 1 ? { label: 'Read now', run: () => this.openBook(this.library.byId(book.id) || book) } : undefined,
      });
    }
    if (openTarget) await this.openBook(this.library.byId(openTarget.id) || openTarget);
  }

  async addSample() {
    const existing = this.library.books.find((b) => b.format === 'sample');
    if (existing) return this.openBook(existing);
    const book = await importSample();
    const meta = await api.addBook({ meta: book.meta, content: book.content, cover: null });
    await this.library.load();
    return this.openBook(this.library.byId(meta.id) || meta);
  }

  /* ---------------------------------------------------------- dialogs */

  showFirstRun() {
    return modal({
      title: 'Welcome to Readalune',
      build: (body, close) => {
        body.append(
          h('p', { text: 'Readalune is a free, open-source reader for your own documents. A few things to know:' }),
          h(
            'ul.plain',
            null,
            h('li', { text: 'Everything stays on this computer. Readalune has no accounts, no tracking and makes no network connections.' }),
            h('li', { text: 'Only import files you have the right to read \u2014 your own writing, public-domain works, or books you obtained legitimately.' }),
            h('li', { text: 'Readalune does not remove DRM or other copy protection, and refuses protected files.' }),
            h('li', { text: 'The software is provided \u201cas is\u201d under the MIT License, without warranty.' })
          ),
          h(
            'div.modal-actions',
            null,
            h('button.btn', { onclick: () => this.showLegal().then(() => !this.settings.legalAcknowledged && this.showFirstRun()) }, 'Read the full notice'),
            h('button.btn.primary', { onclick: () => (this.updateSettings({ legalAcknowledged: true }), close(true)) }, 'I understand')
          )
        );
      },
    }).then((v) => {
      if (v) this.updateSettings({ legalAcknowledged: true });
    });
  }

  showAbout() {
    const i = this.info || {};
    modal({
      title: 'About Readalune',
      build: (body) => {
        body.append(
          h('div.about-head', null, h('img', { src: 'assets/logo.png', alt: '', width: 56, height: 56 }), h('div', null, h('h3', { text: 'Readalune' }), h('div.muted', { text: `Version ${i.version || ''} \u00b7 Your personal desktop reading room` }))),
          h('p', { text: 'A free and open-source e-reader for your own text, Markdown, HTML, EPUB and PDF files. Offline, private, and yours to modify.' }),
          h('dl.info-grid', null,
            h('dt', { text: 'License' }), h('dd', { text: 'MIT License \u2014 Copyright \u00a9 2026 Cuttysarky and contributors' }),
            h('dt', { text: 'Built with' }), h('dd', { text: `Electron ${i.electron || ''} (MIT), Chromium ${i.chrome || ''} (BSD-style), PDF.js (Apache-2.0)` }),
            h('dt', { text: 'Library folder' }), h('dd.mono', { text: i.dataDir || '' })
          ),
          h('div.modal-actions', null,
            h('button.btn', { onclick: () => api.openDataFolder() }, icon('folder', 18), ' Open library folder'),
            h('button.btn', { onclick: () => this.showLegal() }, icon('info', 18), ' Legal & licenses'),
            h('button.btn', { onclick: () => api.openExternal(REPO_URL) }, icon('book', 18), ' Project page')
          )
        );
      },
    });
  }

  showLegal() {
    return modal({
      title: 'Legal & licenses',
      wide: true,
      build: (body) => {
        const sec = (title, ...paras) => h('section.legal', null, h('h3', { text: title }), ...paras.map((p) => h('p', { text: p })));
        body.append(
          sec('Software license', 'Readalune is open-source software released under the MIT License. You may use, copy, modify and distribute it freely, provided the copyright notice and license text are kept. THE SOFTWARE IS PROVIDED \u201cAS IS\u201d, WITHOUT WARRANTY OF ANY KIND. The full text is in the LICENSE file that ships with the app.'),
          sec('Your content', 'Apart from the bundled classics described below, Readalune does not include, sell, download or distribute books. You are responsible for making sure you have the right to use the files you import. Readalune only reformats files on your own computer for your personal reading.'),
          sec('Bundled classics', 'The Classics shelf contains 1,000 plain-text eBooks from Project Gutenberg, stored exactly as they were downloaded. Project Gutenberg lists every one as public domain in the United States. Copyright rules differ in other countries, and some of these books may still be protected where you live: if you are outside the United States, check before you read, copy or share them. To lower that risk, books were only chosen if every author, translator and editor named in Project Gutenberg\u2019s catalogue record died before 1926. The title pages were also scanned, and editions with an introduction, notes or a translation by anyone else were replaced, with one exception that is explained in CLASSICS.md on the project page. A scan of title pages can miss things, so this is not a guarantee. Each book keeps Project Gutenberg\u2019s header and the full Project Gutenberg License, shown at its end and listed in its contents. \u201cProject Gutenberg\u201d is a registered trademark of the Project Gutenberg Literary Archive Foundation; Readalune is not affiliated with or endorsed by it.'),
          sec('No DRM circumvention', 'Readalune does not remove, bypass or weaken DRM or any other technical protection measure. DRM-protected EPUBs and PDFs that forbid text extraction are refused.'),
          sec('Trademarks', 'Readalune is an independent project. It is not affiliated with, endorsed by or sponsored by any e-reader maker, bookstore or publisher. All product names and trademarks belong to their respective owners.'),
          sec('Privacy', 'Readalune has no accounts, analytics, telemetry or advertising, and blocks all network requests. Your library, notes and reading statistics are stored only in the library folder on this computer. Readalune never looks anything up online and never updates itself. If something goes wrong, the error message is written to a small log file that also stays on this computer.'),
          sec('Third-party software', 'PDF.js \u2014 Copyright Mozilla Foundation, Apache License 2.0. Adobe CMap resources \u2014 Copyright Adobe Systems Incorporated, BSD 3-Clause License. Electron \u2014 Copyright Electron contributors and GitHub Inc., MIT License, which includes Chromium and other components under their own licenses (see the LICENSES.chromium.html file in the installed app). See NOTICE.md for details.'),
          h('div.modal-actions', null, h('button.btn', { onclick: () => api.openExternal(`${REPO_URL}/blob/main/LEGAL.md`) }, 'View LEGAL.md online'))
        );
      },
    });
  }

  showShortcuts() {
    const rows = [
      ['\u2192  \u2193  Space  PageDown', 'Next page'],
      ['\u2190  \u2191  Shift+Space  PageUp', 'Previous page'],
      ['[  ]', 'Previous / next chapter'],
      ['Home  End', 'Beginning / end of book'],
      ['T', 'Contents'],
      ['N', 'Notes & bookmarks'],
      ['A', 'Reading settings'],
      ['B  or  Ctrl+B', 'Bookmark page'],
      ['/  or  Ctrl+F', 'Search in book'],
      ['G  or  Ctrl+G', 'Go to page / position / percent'],
      ['R', 'Read aloud (play / pause)'],
      ['+  \u2212', 'Larger / smaller text'],
      ['Backspace', 'Back to where you jumped from'],
      ['F  or  F11', 'Full screen'],
      ['Esc', 'Close panel / back to library'],
      ['Ctrl+O', 'Import books'],
    ];
    modal({
      title: 'Keyboard shortcuts',
      build: (body) => body.append(h('table.shortcuts', null, h('tbody', null, rows.map(([k, v]) => h('tr', null, h('td', null, h('kbd', { text: k })), h('td', { text: v })))))),
    });
  }

  async exportBackup() {
    const r = await api.exportBackup().catch((err) => toast(err.message || 'Backup failed.', { kind: 'error' }));
    if (r) toast(`Backup saved (${r.files} files, ${(r.bytes / 1048576).toFixed(1)} MB)`, { kind: 'success' });
  }

  async importBackup() {
    const r = await api.importBackup({ replaceSettings: false }).catch((err) => toast(err.message || 'That backup could not be restored.', { kind: 'error', timeout: 7000 }));
    if (!r) return;
    await this.library.load();
    toast(`Restored ${r.added} book${r.added === 1 ? '' : 's'}${r.skipped ? ` (${r.skipped} already in your library)` : ''}`, { kind: 'success' });
  }

  showAppSettings() {
    const watchedList = h('div.watched-list');
    const drawWatched = async () => {
      const list = await api.watchedFolders();
      watchedList.replaceChildren(
        ...list.map((f, i) => h('div.watched-row', null, icon('folder', 16), h('span.grow.mono', { text: f.path }), h('button.btn.small', { onclick: async () => (await api.unwatchFolder(i), drawWatched()) }, 'Stop watching')))
      );
    };
    drawWatched();
    modal({
      title: 'Settings',
      build: (body) => {
        const seg = h(
          'div.seg.full',
          null,
          ['system', 'light', 'dark'].map((id) =>
            h(`button${this.settings.appTheme === id ? '.on' : ''}`, {
              text: id[0].toUpperCase() + id.slice(1),
              onclick: (e) => {
                this.updateSettings({ appTheme: id });
                for (const b of seg.children) b.classList.toggle('on', b === e.currentTarget);
              },
            })
          )
        );
        body.append(
          h('div.setting-group', null, h('div.setting-label', { text: 'Library appearance' }), seg),
          h('p.muted', { text: 'Fonts, text size, page themes, margins and more are under \u201cAa\u201d while reading.' }),
          h(
            'div.setting-group',
            null,
            h('div.setting-label', { text: 'Import a folder' }),
            h('p.muted', { text: 'Add every book in a folder. A watched folder is checked for new books whenever Readalune is open; duplicates are skipped.' }),
            h('div.row', null, h('button.btn', { onclick: () => this.importFolder(false) }, icon('folder', 18), ' Import folder\u2026'), h('button.btn', { onclick: async () => (await this.importFolder(true), drawWatched()) }, icon('history', 18), ' Import & watch\u2026')),
            watchedList
          ),
          h(
            'div.setting-group',
            null,
            h('div.setting-label', { text: 'Backup' }),
            h('p.muted', { text: 'Save your whole library (books, highlights, notes, collections, settings and stats) in one file, or restore one. Restoring adds books you do not already have.' }),
            h(
              'div.row',
              null,
              h('button.btn', { onclick: () => this.exportBackup() }, icon('download', 18), ' Export backup\u2026'),
              h('button.btn', { onclick: () => this.importBackup() }, icon('upload', 18), ' Restore backup\u2026'),
              h('button.btn', { onclick: () => api.openDataFolder() }, icon('folder', 18), ' Open library folder')
            )
          ),
          h('div.modal-actions', null, h('button.btn', { onclick: () => this.addSample() }, icon('book', 18), ' Open the welcome guide'), h('button.btn', { onclick: () => this.showLegal() }, 'Legal & licenses'))
        );
      },
    });
  }

  /* ---------------------------------------------------------- events */

  bind() {
    $('#import-btn').onclick = () => this.pickAndImport();
    $('#empty-import').onclick = () => this.pickAndImport();
    $('#empty-sample').onclick = () => this.addSample();
    $('#lib-about-btn').onclick = () => this.showAbout();
    $('#lib-settings-btn').onclick = () => this.showAppSettings();

    document.addEventListener('keydown', (e) => {
      if ($('#modal').open) return;
      if (this.reader.isOpen()) {
        if (this.reader.onKey(e)) e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        this.pickAndImport();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.library.setTab('books');
        $('#lib-search').focus();
      }
    });

    api.onMenu((action) => this.onMenu(action));
    // New files in a watched folder are imported quietly in the background.
    this.folderQueue = [];
    api.onFolderFile((file) => {
      this.folderQueue.push(file);
      clearTimeout(this.folderTimer);
      this.folderTimer = setTimeout(() => {
        const batch = this.folderQueue.splice(0);
        if (batch.length) this.importFiles(batch, { quietDuplicates: true });
      }, 1200);
    });

    // Drag and drop import. Files are read in the page; no paths are used.
    let depth = 0;
    const overlay = $('#drop-overlay');
    const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    window.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      overlay.hidden = false;
    });
    window.addEventListener('dragover', (e) => {
      if (hasFiles(e)) e.preventDefault();
    });
    window.addEventListener('dragleave', () => {
      depth = Math.max(0, depth - 1);
      if (!depth) overlay.hidden = true;
    });
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      depth = 0;
      overlay.hidden = true;
      const list = Array.from(e.dataTransfer?.files || []).slice(0, 200);
      if (!list.length) return;
      const files = [];
      for (const file of list) {
        if (file.size > 300 * 1024 * 1024) files.push({ name: file.name, error: 'File is larger than 300 MB.' });
        else if (!file.size) files.push({ name: file.name, error: 'The file is empty or is a folder.' });
        else files.push({ name: file.name, size: file.size, bytes: await file.arrayBuffer() });
      }
      this.importFiles(files);
    });

    window.addEventListener('beforeunload', () => {
      this.saveSettingsSoon.cancel();
      api.setSettings(this.settings);
    });
    document.addEventListener('mousedown', (e) => {
      const menu = $('#r-more-menu');
      if (menu && !menu.contains(e.target) && !e.target.closest('#r-more')) {
        menu.remove();
        if (!this.reader.anyDrawerOpen()) $('#reader-root').classList.remove('drawer-open');
      }
    });
  }

  onMenu(action) {
    const r = this.reader;
    const open = r.isOpen();
    switch (action) {
      case 'import':
        return this.pickAndImport();
      case 'library':
        return this.showLibrary();
      case 'about':
        return this.showAbout();
      case 'legal':
        return this.showLegal();
      case 'shortcuts':
        return this.showShortcuts();
      case 'settings':
        return open ? r.openDrawer('display') : this.showAppSettings();
      case 'export-notes':
        return open ? r.exportNotes() : toast('Open a book to export its notes, or use the \u22ef menu on a book.');
      case 'search':
        return open ? r.openDrawer('search') : $('#lib-search').focus();
      case 'toc':
        return open && r.openDrawer('toc');
      case 'notes':
        return open ? r.openDrawer('notes') : this.library.setTab('notes');
      case 'display':
        return open && r.openDrawer('display');
      case 'font-up':
        return this.updateSettings({ fontSize: Math.min(40, this.settings.fontSize + 1) });
      case 'font-down':
        return this.updateSettings({ fontSize: Math.max(12, this.settings.fontSize - 1) });
      default:
        return undefined;
    }
  }
}

const app = new App();

// Unexpected errors are written to Readalune's local log file (never sent anywhere).
const reportError = (text) => api.logError(String(text).slice(0, 16000)).catch(() => {});
window.addEventListener('error', (e) => reportError(`${e.message} (${e.filename}:${e.lineno}:${e.colno})\n${(e.error && e.error.stack) || ''}`));
window.addEventListener('unhandledrejection', (e) => reportError(`Unhandled rejection: ${(e.reason && e.reason.stack) || e.reason}`));
window.addEventListener('DOMContentLoaded', () => {
  app.init().catch((err) => {
    console.error(err);
    document.body.append(h('div.fatal', null, h('h2', { text: 'Readalune could not start' }), h('p', { text: String(err && err.message ? err.message : err) })));
  });
});
