/**
 * End-to-end tests: launches the real Electron app (with a throw-away library
 * folder) and drives it like a user would.
 *
 *   npm run test:e2e            (on Linux CI: xvfb-run -a npm run test:e2e)
 *
 * Screenshots are written to $E2E_SCREENSHOTS when that variable is set.
 */
import { _electron as electron } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { makeEpub, makePdf, makeLongText, makeCbz, MARKDOWN, HTML } from '../helpers/fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'readalune-e2e-'));
const shots = process.env.E2E_SCREENSHOTS || '';
if (shots) fs.mkdirSync(shots, { recursive: true });

const results = [];
let app;
let win;
const pageErrors = [];

const electronPath = createRequire(import.meta.url)('electron');
const SANDBOX_ARGS = process.platform === 'linux' ? ['--no-sandbox'] : [];
const APP_ENV = { ...process.env, READALUNE_USER_DATA: userData, READALUNE_TEST_NO_SANDBOX: process.platform === 'linux' ? '1' : '0' };

async function launch(files = []) {
  app = await electron.launch({ args: [...SANDBOX_ARGS, root, ...files], cwd: root, env: APP_ENV });
  win = await app.firstWindow();
  watchPage(win);
  await win.waitForSelector('body.ready');
  await resize(1280, 860);
}

/** Start a second copy of the app, as the system does when a book is double-clicked. */
function launchSecondCopy(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [...SANDBOX_ARGS, root, file], { cwd: root, env: APP_ENV, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr = (stderr + d).slice(-3000);
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`the second copy did not hand over its book and exit within 30 s. Its output:\n${stderr}`));
    }, 30000);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

/** Close the app, forcing it if it does not exit in time (never hang the run). */
async function closeApp() {
  const proc = app.process();
  const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 15000));
  if ((await Promise.race([app.close().then(() => 'closed'), timeout])) === 'timeout') {
    console.log('      (app did not close in 15 s; stopping it)');
    proc.kill('SIGKILL');
  }
}

function watchPage(page) {
  // The error-log probe below throws on purpose.
  page.on('pageerror', (e) => {
    if (!/e2e-probe-error/.test(e.message)) pageErrors.push(`pageerror: ${e.message}`);
  });
  win.on('console', (m) => {
    // Ignore blocked requests and the policy report from our own injected-script security probe.
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_BLOCKED_BY_CLIENT|ERR_FAILED|Executing inline script violates|example\.com/.test(m.text())) pageErrors.push(`console: ${m.text()}`);
  });
}

async function resize(w, h) {
  await app.evaluate(({ BrowserWindow }, [width, height]) => {
    const bw = BrowserWindow.getAllWindows()[0];
    bw.setFullScreen(false);
    bw.unmaximize();
    bw.setContentSize(width, height);
  }, [w, h]);
  await win.waitForTimeout(400);
}

const STEP_TIMEOUT_MS = 120000;

async function step(name, fn) {
  const t = Date.now();
  let timer;
  try {
    // A stuck step fails with a message instead of hanging the whole run.
    await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`step did not finish within ${STEP_TIMEOUT_MS / 1000} s`)), STEP_TIMEOUT_MS);
      }),
    ]);
    results.push({ name, ok: true, ms: Date.now() - t });
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  \u2717 ${name}\n      ${String(err && err.stack ? err.stack : err).split('\n').slice(0, 4).join('\n      ')}`);
    if (shots) await win.screenshot({ path: path.join(shots, `FAILED-${name.replace(/\W+/g, '-')}.png`) }).catch(() => {});
  } finally {
    clearTimeout(timer);
  }
}

async function shot(name) {
  if (shots) await win.screenshot({ path: path.join(shots, `${name}.png`) });
}

const dbg = (fn, arg) => win.evaluate(fn, arg);
const range = () => dbg(() => window.__readaluneDebug.reader.pager.currentRange());

async function dropFile(name, buffer) {
  await win.evaluate(
    ({ name, b64 }) => {
      const bin = atob(b64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const dt = new DataTransfer();
      dt.items.add(new File([u8], name));
      window.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    },
    { name, b64: Buffer.from(buffer).toString('base64') }
  );
}

async function waitToast(re, timeout = 20000) {
  const handle = await win.waitForFunction(
    (src) => {
      const re2 = new RegExp(src, 'i');
      return [...document.querySelectorAll('.toast')].map((t) => t.textContent).find((t) => re2.test(t)) || null;
    },
    re.source,
    { timeout }
  );
  return handle.jsonValue();
}

async function importAndWait(name, buffer) {
  const before = await dbg(() => window.__readaluneDebug.library.books.length);
  await dropFile(name, buffer);
  await win.waitForFunction((n) => window.__readaluneDebug.library.books.length > n && document.querySelector('#busy').hidden, before, { timeout: 30000 });
  return dbg((n) => window.__readaluneDebug.library.books[window.__readaluneDebug.library.books.length - 1], before);
}

async function openBookByTitle(title) {
  await dbg((t) => window.__readaluneDebug.openBook(window.__readaluneDebug.library.books.find((b) => b.title === t)), title);
  await win.waitForFunction(() => window.__readaluneDebug.reader.pager && document.querySelector('#info-left').textContent.length > 0);
  await win.waitForTimeout(250);
}

/** Every line of text on screen must be fully inside the page (nothing clipped). */
async function assertNoClipping() {
  // Measure only once a page-turn slide has finished: mid-slide, text is meant to cross the edge.
  await win.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 5000 });
  const bad = await win.evaluate(() => {
    const vp = document.querySelector('#page-viewport').getBoundingClientRect();
    const problems = [];
    for (const el of document.querySelectorAll('#page-content .blk')) {
      const r = document.createRange();
      r.selectNodeContents(el);
      for (const rect of r.getClientRects()) {
        if (rect.width === 0 || rect.right <= vp.left + 1 || rect.left >= vp.right - 1) continue;
        if (rect.left < vp.left - 1 || rect.right > vp.right + 1 || rect.bottom > vp.bottom + 1 || rect.top < vp.top - 1) {
          problems.push(`${el.dataset.b}: ${Math.round(rect.left)},${Math.round(rect.top)}-${Math.round(rect.right)},${Math.round(rect.bottom)} vs ${Math.round(vp.left)},${Math.round(vp.top)}-${Math.round(vp.right)},${Math.round(vp.bottom)}`);
        }
      }
    }
    return problems.slice(0, 5);
  });
  assert.deepEqual(bad, [], `text clipped at page edges: ${bad.join('; ')}`);
}

/** Turn through the whole book and check pages tile it exactly. */
async function walkBook({ checkClipEvery = 1 } = {}) {
  await dbg(() => window.__readaluneDebug.reader.jumpTo(0, { remember: false }));
  const total = await dbg(() => window.__readaluneDebug.reader.book.total);
  let prev = await range();
  assert.equal(prev.start, 0);
  let views = 1;
  for (let guard = 0; guard < 5000; guard++) {
    if (views % checkClipEvery === 0) await assertNoClipping();
    const atEnd = await dbg(() => window.__readaluneDebug.reader.pager.isAtEnd());
    if (atEnd) break;
    await win.keyboard.press('ArrowRight');
    const cur = await range();
    assert.equal(cur.start, prev.end, `pages must be contiguous (view ${views})`);
    assert.ok(cur.end > cur.start, 'each page shows some text');
    prev = cur;
    views++;
  }
  assert.ok(prev.end >= total - 1, `last page reaches the end (${prev.end}/${total})`);
  assert.equal(await win.textContent('#info-right'), '100%');
  // Finishing a book for the first time shows the finish card; close it.
  if (await win.locator('#modal[open] .finish-card').count()) await win.click('#modal button:has-text("Keep reading")');
  return views;
}

/* ======================================================================= */

console.log('Readalune end-to-end tests');
await launch();

await step('first-run notice and empty library', async () => {
  await win.waitForSelector('#modal[open]');
  await shot('01-first-run');
  await win.click('#modal button.primary');
  await win.waitForTimeout(200);
  assert.equal(await win.isVisible('#lib-empty'), true);
  await shot('02-empty-library');
});

await step('renderer is isolated: no Node, no eval, no network, no navigation', async () => {
  const r = await win.evaluate(async () => {
    const out = {};
    out.require = typeof window.require;
    out.process = typeof window.process;
    out.bridge = Object.keys(window.readalune).sort();
    // An injected inline script (how an attacker would try) must not run.
    // (Code sent by the test tool itself bypasses the page policy, so test it this way.)
    const s = document.createElement('script');
    s.textContent = 'window.__inlineRan = true;';
    document.head.append(s);
    await new Promise((r) => setTimeout(r, 200));
    out.inline = window.__inlineRan === true ? 'ran' : 'blocked';
    try {
      await fetch('https://example.com/');
      out.fetch = 'allowed';
    } catch {
      out.fetch = 'blocked';
    }
    out.img = await new Promise((res) => {
      const img = new Image();
      img.onload = () => res('loaded');
      img.onerror = () => res('blocked');
      img.src = 'https://example.com/favicon.ico';
      setTimeout(() => res('timeout'), 5000);
    });
    out.open = window.open('https://example.com/') === null ? 'blocked' : 'opened';
    return out;
  });
  assert.equal(r.require, 'undefined');
  assert.equal(r.process, 'undefined');
  assert.equal(r.inline, 'blocked');
  assert.equal(r.fetch, 'blocked');
  assert.equal(r.img, 'blocked');
  assert.equal(r.open, 'blocked');
  assert.ok(!r.bridge.includes('ipcRenderer') && !r.bridge.includes('invoke') && !r.bridge.includes('send'));
  const windows = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
  assert.equal(windows, 1);
});

await step('IPC rejects bad input', async () => {
  const r = await win.evaluate(async () => {
    const out = [];
    for (const fn of [() => window.readalune.getContent('../../../etc/passwd'), () => window.readalune.openExternal('https://evil.example/'), () => window.readalune.openExternal('file:///etc/passwd'), () => window.readalune.addBook({ meta: {}, content: {} })]) {
      try {
        await fn();
        out.push('accepted');
      } catch {
        out.push('rejected');
      }
    }
    return out;
  });
  assert.deepEqual(r, ['rejected', 'rejected', 'rejected', 'rejected']);
});

await step('welcome guide opens on page 1', async () => {
  await win.click('#empty-sample');
  await win.waitForFunction(() => /^Page 1 of \d+/.test(document.querySelector('#info-left').textContent));
  assert.equal(await win.textContent('#info-right'), '0%');
  await assertNoClipping();
  await shot('03-reader-start');
});

await step('turning pages: keys, wheel, tap zones, percent and page number advance', async () => {
  const a = await range();
  await win.keyboard.press('ArrowRight');
  const b = await range();
  assert.equal(b.start, a.end);
  await win.mouse.move(640, 400);
  await win.mouse.wheel(0, 200);
  await win.waitForTimeout(400);
  const c = await range();
  assert.ok(c.start > b.start, 'wheel turns the page');
  await win.click('#tap-prev');
  await win.waitForTimeout(300);
  assert.equal((await range()).start, b.start);
  await win.keyboard.press('ArrowLeft');
  assert.equal((await range()).start, 0);
  await win.keyboard.press('ArrowRight');
  await win.keyboard.press('ArrowRight');
  assert.notEqual(await win.textContent('#info-right'), '0%');
  await shot('04-reader-page');
});

await step('whole book pages tile with no gaps, overlaps or clipping (two-page spread)', async () => {
  const spread = await dbg(() => window.__readaluneDebug.reader.pager.geometry.cpv);
  assert.equal(spread, 2, 'wide window shows two pages');
  await walkBook();
});

await step('single page layout on a narrow window, larger text', async () => {
  await resize(900, 800);
  await dbg(() => window.__readaluneDebug.updateSettings({ fontSize: 26 }));
  await win.waitForTimeout(500);
  assert.equal(await dbg(() => window.__readaluneDebug.reader.pager.geometry.cpv), 1);
  await walkBook();
  await shot('05-reader-narrow-large');
  await dbg(() => window.__readaluneDebug.updateSettings({ fontSize: 20 }));
  await resize(1280, 860);
});

await step('position is kept when the text size changes', async () => {
  await dbg(() => window.__readaluneDebug.reader.jumpTo(Math.floor(window.__readaluneDebug.reader.book.total / 2), { remember: false }));
  const before = await range();
  await win.keyboard.press('+');
  await win.keyboard.press('+');
  await win.waitForTimeout(500);
  const after = await range();
  assert.ok(after.start <= before.start && after.end > before.start, 'the first word of the old page is still on screen');
  await win.keyboard.press('-');
  await win.keyboard.press('-');
  await win.waitForTimeout(400);
});

await step('exact page count after background measuring', async () => {
  await win.waitForFunction(() => window.__readaluneDebug.reader.pager.pagesExact(), null, { timeout: 15000 });
  const txt = await win.textContent('#info-left');
  assert.match(txt, /^Pages? \d+(\u2013\d+)? of \d+$/);
});

await step('table of contents navigation and back button', async () => {
  await dbg(() => window.__readaluneDebug.reader.jumpTo(0, { remember: false }));
  await win.keyboard.press('t');
  await win.waitForSelector('#drawer-toc:not([hidden])');
  const items = await win.$$('#toc-list .toc-item');
  assert.ok(items.length >= 6);
  const title = (await items[3].textContent()).replace(/~?\d+$/, '').trim();
  await shot('06-toc');
  await items[3].click();
  await win.waitForTimeout(300);
  assert.equal(await win.textContent('#band-chapter'), title);
  assert.equal(await win.isVisible('#back-pill'), true);
  await win.keyboard.press('Backspace');
  assert.equal((await range()).start, 0);
});

await step('highlight, recolour, note, and remove a passage', async () => {
  await win.keyboard.press('ArrowRight');
  await win.keyboard.press('ArrowRight');
  // Select the first sentence of a visible paragraph.
  await win.evaluate(() => {
    const vp = document.querySelector('#page-viewport').getBoundingClientRect();
    // A long plain-text run inside a paragraph that starts on this page.
    let t = null;
    let p = null;
    for (const el of document.querySelectorAll('#page-content .t-p')) {
      const rect = el.getBoundingClientRect();
      if (rect.left < vp.left - 1 || rect.left >= vp.right) continue;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.nodeValue.length >= 50 && n.parentElement === el) {
          t = n;
          p = el;
          break;
        }
      }
      if (t) break;
    }
    const r = document.createRange();
    r.setStart(t, 0);
    r.setEnd(t, 40);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    window.__selected = r.toString();
  });
  const selected = await win.evaluate(() => window.__selected);
  await win.waitForSelector('#sel-menu:not([hidden])');
  await shot('07-selection-menu');
  await win.click('#sel-swatches .hl-yellow');
  await win.waitForSelector('#page-content mark.hl-yellow');
  const hl = await dbg(() => window.__readaluneDebug.reader.state.highlights[0]);
  assert.equal(hl.c, 'yellow');
  assert.equal(hl.text, selected.trim());
  // Click it to recolour and add a note.
  await win.click('#page-content mark.hl');
  await win.waitForSelector('#sel-menu:not([hidden]) [data-act="delete"]:not([hidden])');
  await win.click('#sel-swatches .hl-blue');
  await win.waitForSelector('#page-content mark.hl-blue');
  await win.click('#page-content mark.hl');
  await win.click('#sel-menu [data-act="note"]');
  await win.waitForSelector('#modal[open] textarea');
  await win.fill('#modal textarea', 'A thought worth keeping.');
  await win.click('#modal button.primary');
  await win.waitForSelector('#page-content mark.has-note');
  await shot('08-highlight');
  // A second highlight, then delete it.
  await win.evaluate(() => {
    const marks = document.querySelector('#page-content mark.hl');
    let p = marks.closest('.blk').nextElementSibling;
    while (p && !(p.firstChild && p.firstChild.nodeType === 3 && p.firstChild.nodeValue.length >= 20)) p = p.nextElementSibling;
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.setEnd(p.firstChild, 20);
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
  });
  await win.waitForSelector('#sel-menu:not([hidden])');
  await win.click('#sel-swatches .hl-pink');
  await win.waitForSelector('#page-content mark.hl-pink');
  await win.click('#page-content mark.hl-pink');
  await win.click('#sel-menu [data-act="delete"]');
  await win.waitForFunction(() => !document.querySelector('#page-content mark.hl-pink'));
  assert.equal(await dbg(() => window.__readaluneDebug.reader.state.highlights.length), 1);
});

await step('bookmarks and the notes panel', async () => {
  await win.keyboard.press('b');
  await win.waitForSelector('#ribbon:not([hidden])');
  await win.keyboard.press('n');
  await win.waitForSelector('#drawer-notes:not([hidden])');
  assert.equal(await win.locator('#notes-items .note').count(), 1);
  assert.match(await win.textContent('#notes-items'), /A thought worth keeping/);
  await shot('09-notes');
  await win.click('[data-ntab="bookmarks"]');
  assert.equal(await win.locator('#notes-items .note').count(), 1);
  await win.keyboard.press('Escape');
});

await step('search the book and jump to a result', async () => {
  await win.keyboard.press('/');
  await win.waitForSelector('#drawer-search:not([hidden])');
  await win.fill('#book-search', 'bookmark');
  await win.waitForFunction(() => document.querySelectorAll('#search-results .result').length > 0);
  assert.match(await win.textContent('#search-summary'), /\d+ match/);
  await shot('10-search');
  const results = await win.$$('#search-results .result');
  await results[results.length - 1].click();
  await win.waitForSelector('#page-content mark.flash');
  await win.keyboard.press('Escape');
});

await step('reading settings: theme, font, layout, footer modes', async () => {
  await win.keyboard.press('a');
  await win.waitForSelector('#drawer-display:not([hidden])');
  await win.click('.theme-swatch[title="Night"]');
  assert.equal(await win.getAttribute('#reader-root', 'data-theme'), 'night');
  // The colour fades over 200 ms.
  await win.waitForFunction(() => getComputedStyle(document.querySelector('#reader-root')).backgroundColor === 'rgb(23, 22, 28)', null, { timeout: 3000 });
  await win.selectOption('#set-font', 'sans');
  await win.click('#set-layout button:has-text("One page")');
  await win.waitForTimeout(400);
  assert.equal(await dbg(() => window.__readaluneDebug.reader.pager.geometry.cpv), 1);
  await shot('11-settings-night');
  await win.click('#set-layout button:has-text("Auto")');
  await win.click('.theme-swatch[title="Paper"]');
  await win.selectOption('#set-font', 'serif');
  await win.keyboard.press('Escape');
  const seen = new Set();
  for (let i = 0; i < 6; i++) {
    seen.add((await win.textContent('#info-left')).replace(/[\d,.~]+/g, '#'));
    await win.click('#info-left');
  }
  assert.ok([...seen].some((s) => /left in chapter|Last page of chapter/.test(s)));
  assert.ok([...seen].some((s) => /left in book/.test(s)));
  assert.ok([...seen].some((s) => /^Position/.test(s)));
  await dbg(() => window.__readaluneDebug.updateSettings({ footerMode: 'page' }));
});

await step('save a word to the Word Journal (no lookup)', async () => {
  await win.evaluate(() => {
    const vp = document.querySelector('#page-viewport').getBoundingClientRect();
    const p = [...document.querySelectorAll('#page-content .t-p')].find((el) => el.getBoundingClientRect().left >= vp.left - 1 && el.getBoundingClientRect().left < vp.right && el.firstChild && el.firstChild.nodeType === 3 && /\b[A-Za-z]{5,}\b/.test(el.firstChild.nodeValue));
    const text = p.firstChild.nodeValue;
    const m = /\b[A-Za-z]{5,}\b/.exec(text);
    const r = document.createRange();
    r.setStart(p.firstChild, m.index);
    r.setEnd(p.firstChild, m.index + m[0].length);
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
  });
  await win.waitForSelector('#sel-menu:not([hidden])');
  await win.click('#sel-menu [data-act="word"]');
  await waitToast(/saved to your Word Journal/);
  assert.equal(await win.locator('#modal[open]').count(), 0, 'nothing opens');
  assert.equal(await dbg(() => window.__readaluneDebug.words.list.length), 1);
});

await step('export notes writes a Markdown file', async () => {
  const out = path.join(userData, 'exported-notes.md');
  await app.evaluate(({ dialog }, file) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: file });
  }, out);
  dbg(() => window.__readaluneDebug.reader.exportNotes());
  await win.waitForSelector('#modal[open] .status-picks');
  await win.click('#modal button:has-text("Markdown")');
  await waitToast(/Notes exported/);
  const md = fs.readFileSync(out, 'utf8');
  assert.match(md, /^# Welcome to Readalune/);
  assert.match(md, /\*\*Note:\*\* A thought worth keeping\./);
  assert.match(md, /## Bookmarks/);
});

await step('back to the library shows progress', async () => {
  await win.keyboard.press('Escape');
  await win.waitForSelector('#library-view:not([hidden])');
  // The guide was read to the last page, so it is now marked finished.
  const sample = await dbg(() => window.__readaluneDebug.library.books.find((b) => b.format === 'sample'));
  assert.equal(sample.status, 'finished');
  assert.match(await win.textContent('#lib-filters'), /Finished\s*1/);
  await shot('12-library-one-book');
});

const fixtures = {
  txt: Buffer.from(makeLongText(12, 14)),
  md: Buffer.from(MARKDOWN),
  html: Buffer.from(HTML),
  epub: makeEpub(),
  drm: makeEpub({ drm: true }),
  pdf: makePdf(),
};

await step('import plain text: chapters detected, contents list ignored', async () => {
  const meta = await importAndWait('keeper_of_quiet_harbors.txt', fixtures.txt);
  assert.equal(meta.title, 'The Keeper of Quiet Harbors');
  assert.equal(meta.author, 'Imaginary Author');
  await openBookByTitle(meta.title);
  assert.equal(await dbg(() => window.__readaluneDebug.reader.book.toc.length), 12);
  await walkBook({ checkClipEvery: 5 });
  await win.keyboard.press('Escape');
});

await step('import Markdown', async () => {
  const meta = await importAndWait('field-notes.md', fixtures.md);
  assert.equal(meta.title, 'Field Notes on Lanterns');
  await openBookByTitle(meta.title);
  const html = await win.innerHTML('#page-content');
  assert.ok(html.includes('<strong>first</strong>') && html.includes('<em>slowly</em>'));
  assert.ok(!html.includes('href'), 'links are not rendered as links');
  await win.keyboard.press('Escape');
});

await step('import HTML: scripts, images and frames never run or load', async () => {
  const meta = await importAndWait('almanac.html', fixtures.html);
  assert.equal(meta.title, 'The HTML Almanac');
  assert.equal(meta.author, 'Web Author');
  await openBookByTitle(meta.title);
  await win.waitForTimeout(500);
  assert.equal(await win.evaluate(() => window.__pwned), undefined);
  assert.equal(await win.locator('#page-content img, #page-content iframe, #page-content script').count(), 0);
  await win.keyboard.press('Escape');
});

await step('import EPUB: metadata, cover, nested TOC, XHTML fallback', async () => {
  const meta = await importAndWait('glass-orchard.epub', fixtures.epub);
  assert.equal(meta.title, 'The Glass Orchard');
  assert.equal(meta.author, 'Test Author');
  assert.equal(meta.hasCover, true);
  await openBookByTitle(meta.title);
  const toc = await dbg(() => window.__readaluneDebug.reader.book.toc.map((t) => [t.title, t.level]));
  assert.deepEqual(toc, [['One: Planting', 0], ['Two: Glass', 0], ['The Second Scene', 1], ['Three: Harvest', 0]]);
  assert.equal(await win.evaluate(() => window.__pwned), undefined);
  const text = await dbg(() => window.__readaluneDebug.reader.book.blocks.map((b) => b.x).join('\n'));
  assert.ok(text.includes('Glass\u00a0trees chime'), 'chapter with HTML entities parsed');
  assert.ok(!text.includes("window.__pwned"), 'script text is not shown');
  await walkBook({ checkClipEvery: 3 });
  await win.keyboard.press('Escape');
  await win.waitForSelector(`.book-card img[src="covers/${meta.id}.jpg"]`);
});

await step('DRM-protected EPUB is refused', async () => {
  const before = await dbg(() => window.__readaluneDebug.library.books.length);
  await dropFile('protected.epub', fixtures.drm);
  const msg = await waitToast(/DRM/);
  assert.match(msg, /does not remove DRM/);
  assert.equal(await dbg(() => window.__readaluneDebug.library.books.length), before);
});

await step('unsupported binary file is refused', async () => {
  await dropFile('program.bin', Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9]));
  await waitToast(/not supported|not a book/);
});

await step('import PDF: outline, headers removed, cover rendered', async () => {
  const meta = await importAndWait('test-manual.pdf', fixtures.pdf);
  assert.equal(meta.title, 'The Test Manual');
  assert.equal(meta.author, 'Manual Writer');
  assert.equal(meta.hasCover, true);
  await openBookByTitle(meta.title);
  const toc = await dbg(() => window.__readaluneDebug.reader.book.toc.map((t) => t.title));
  assert.deepEqual(toc, ['Getting Started', 'Working Carefully', 'Finishing Well']);
  const text = await dbg(() => window.__readaluneDebug.reader.book.blocks.map((b) => b.x).join('\n'));
  assert.ok(!text.includes('THE TEST MANUAL'));
  assert.ok(text.includes(' example '));
  await dbg(() => window.__readaluneDebug.updateSettings({ footerMode: 'source' }));
  assert.match(await win.textContent('#info-left'), /^Original page 1$/);
  await dbg(() => window.__readaluneDebug.updateSettings({ footerMode: 'page' }));
  await shot('13-pdf');
  await win.keyboard.press('Escape');
});

await step('duplicate import asks first', async () => {
  await dropFile('copy.md', fixtures.md);
  await win.waitForSelector('#modal[open]');
  assert.match(await win.textContent('#modal'), /Already in your library/);
  await win.click('#modal button:has-text("Cancel")');
});

await step('library: filters, sort, search, list view, collections', async () => {
  await win.waitForSelector('#library-view:not([hidden])');
  assert.equal(await win.locator('.book-card').count(), 6);
  await shot('14-library');
  await win.fill('#lib-search', 'glass');
  await win.waitForTimeout(250);
  assert.equal(await win.locator('.book-card').count(), 1);
  await win.fill('#lib-search', '');
  await win.waitForTimeout(250);
  await win.click('#lib-filters .chip:has-text("Not started")');
  assert.ok((await win.locator('.book-card').count()) >= 1);
  await win.click('#lib-filters .chip:has-text("All")');
  await win.selectOption('#lib-sort', 'title');
  const first = await win.textContent('.book-card .card-title');
  assert.equal(first, 'Field Notes on Lanterns');
  await win.click('[data-view="list"]');
  assert.equal(await win.locator('.book-row').count(), 6);
  await shot('15-library-list');
  await win.click('[data-view="grid"]');
  const id = await dbg(() => window.__readaluneDebug.library.books.find((b) => b.title === 'The Glass Orchard').id);
  dbg((bid) => window.__readaluneDebug.library.editCollections([bid]), id);
  await win.waitForSelector('#modal[open]');
  await win.fill('#modal input[type="text"]', 'Favourites');
  await win.keyboard.press('Enter');
  await win.click('#modal button.primary');
  await win.waitForSelector('#lib-filters .chip:has-text("Favourites")');
  await win.click('#lib-filters .chip:has-text("Favourites")');
  assert.equal(await win.locator('.book-card').count(), 1);
  await win.click('#lib-filters .chip:has-text("All")');
});

await step('classics shelf: add a bundled public-domain book and read it', async () => {
  await win.click('[data-tab="classics"]');
  // The first batch is drawn; "Show more" reveals the rest.
  await win.waitForFunction(() => document.querySelectorAll('#classics-body .book-card').length === 120);
  assert.equal(await dbg(() => window.__readaluneDebug.classics.catalog.books.length), 1000);
  await win.click('#classics-more');
  await win.waitForFunction(() => document.querySelectorAll('#classics-body .book-card').length === 360);
  // Generated covers: no title has a word split across two lines, and no lettering leaves its cover.
  const coverFaults = await win.evaluate(() => {
    const faults = [];
    for (const cover of document.querySelectorAll('#classics-body .gen-cover')) {
      const box = cover.getBoundingClientRect();
      const text = cover.querySelector('.gen-title').firstChild;
      const range = document.createRange();
      let last = null;
      for (let i = 0; i < text.length; i++) {
        range.setStart(text, i);
        range.setEnd(text, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        if (last && last.i === i - 1 && r.top > last.r.top + last.r.height / 2 && /\p{L}/u.test(text.data[i - 1]) && /\p{L}/u.test(text.data[i])) faults.push(`"${text.data}" is split inside a word`);
        last = { i, r };
      }
      for (const el of cover.querySelectorAll('.gen-title, .gen-author')) {
        const r = el.getBoundingClientRect();
        if (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) faults.push(`"${text.data}" has lettering outside its cover`);
      }
    }
    return faults;
  });
  assert.deepEqual(coverFaults, []);
  await win.fill('#classics-search', 'pride and prejudice');
  // The novel comes first; a stage adaptation of it is in the shelf too.
  await win.waitForFunction(() => document.querySelectorAll('#classics-body .book-card').length >= 1);
  assert.equal(await win.textContent('#classics-body .book-card .card-author'), 'Jane Austen');
  await shot('16a-classics');
  await win.click('#classics-body .book-card .btn.primary');
  await win.waitForFunction(() => window.__readaluneDebug.library.books.some((b) => b.title === 'Pride and Prejudice'), null, { timeout: 30000 });
  const meta = await dbg(() => window.__readaluneDebug.library.books.find((b) => b.title === 'Pride and Prejudice'));
  assert.equal(meta.author, 'Jane Austen');
  assert.equal(await dbg((ids) => window.__readaluneDebug.library.collectionName(ids[0]), meta.collectionIds), 'Classics');
  await openBookByTitle('Pride and Prejudice');
  const toc = await dbg(() => window.__readaluneDebug.reader.book.toc.map((t) => t.title));
  assert.ok(toc.length > 50, 'chapters detected');
  assert.equal(toc[toc.length - 1], 'Project Gutenberg License');
  await assertNoClipping();
  await shot('16b-classic-reading');
  await win.keyboard.press('Escape');
  await win.fill('#classics-search', '');
  await win.click('[data-tab="books"]');
});

await step('comic: CBZ import, right-to-left pages, two-page spreads, zoom', async () => {
  const meta = await importAndWait('moon-harbor.cbz', makeCbz());
  assert.equal(meta.format, 'cbz');
  assert.equal(meta.title, 'Moon Harbor');
  assert.equal(meta.series, 'Lantern Tales');
  assert.equal(meta.seriesIndex, 2);
  assert.equal(meta.author, 'Test Writer');
  assert.equal(meta.hasSource, true);
  await dbg((id) => window.__readaluneDebug.openBook(window.__readaluneDebug.library.byId(id)), meta.id);
  await win.waitForFunction(() => document.querySelector('#info-left').textContent === 'Page 1 of 6');
  // Right-to-left: the left arrow goes forward. The cover is alone, then pages pair up.
  await win.keyboard.press('ArrowLeft');
  await win.waitForFunction(() => /^Pages 2.3 of 6$/.test(document.querySelector('#info-left').textContent));
  await win.click('.page-stage .page-img');
  assert.equal(await win.evaluate(() => document.querySelector('.page-stage').classList.contains('zoomed')), true);
  await shot('15b-comic');
  await win.keyboard.press('Escape');
  await win.waitForSelector('#library-view:not([hidden])');
});

await step('scroll mode and settings for one book only', async () => {
  const sample = await dbg(() => window.__readaluneDebug.library.books.find((b) => b.format === 'sample'));
  await openBookByTitle(sample.title);
  await dbg(() => window.__readaluneDebug.reader.setBookOnly(true));
  await dbg(() => window.__readaluneDebug.reader.setSetting({ flow: 'scroll' }));
  await win.waitForFunction(() => document.querySelector('#reader-root').dataset.flow === 'scroll');
  assert.equal(await dbg(() => window.__readaluneDebug.settings.flow), 'paged', 'global setting unchanged');
  const a = await range();
  await win.keyboard.press('PageDown');
  await win.waitForTimeout(700);
  const b = await range();
  assert.ok(b.start > a.start, 'scrolling moves forward');
  await dbg(() => window.__readaluneDebug.reader.setBookOnly(false));
  await win.waitForFunction(() => document.querySelector('#reader-root').dataset.flow === 'paged');
  await win.keyboard.press('Escape');
  await win.waitForSelector('#library-view:not([hidden])');
});

await step('bulk select: tag several books at once', async () => {
  await win.click('#lib-select');
  // Cards are redrawn after each click, so look them up again each time.
  await win.locator('#book-grid .book-card .cover-btn').nth(0).click();
  await win.locator('#book-grid .book-card .cover-btn').nth(1).click();
  assert.match(await win.textContent('#bulk-bar'), /2 selected/);
  await win.click('#bulk-bar button:has-text("Add tag")');
  await win.waitForSelector('#modal[open] input');
  await win.fill('#modal input', 'holiday');
  await win.click('#modal button.primary');
  await win.waitForSelector('#lib-filters .chip:has-text("#holiday")');
  assert.equal(await dbg(() => window.__readaluneDebug.library.books.filter((b) => (b.tags || []).includes('holiday')).length), 2);
  await win.click('#bulk-bar button.primary');
});

await step('search inside every book', async () => {
  await win.check('#lib-deep');
  await win.fill('#lib-search', 'orchard');
  await win.waitForSelector('.deep-result');
  assert.ok((await win.locator('.deep-result').count()) >= 1);
  await win.uncheck('#lib-deep');
  await win.fill('#lib-search', '');
  await win.waitForTimeout(300);
});

await step('backup: export the library and restore it', async () => {
  const file = path.join(userData, 'backup.zip');
  await app.evaluate(({ dialog }, f) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: f });
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [f] });
  }, file);
  const exported = await dbg(() => window.readalune.exportBackup());
  assert.ok(exported.files > 10 && fs.statSync(file).size > 1000);
  const restored = await dbg(() => window.readalune.importBackup({ replaceSettings: false }));
  assert.equal(restored.added, 0, 'books already present are not duplicated');
  assert.equal(restored.skipped, await dbg(() => window.__readaluneDebug.library.books.length));
});

await step('notes, word journal and stats tabs', async () => {
  await win.click('[data-tab="notes"]');
  await win.waitForSelector('#all-notes .note');
  assert.match(await win.textContent('#all-notes'), /A thought worth keeping/);
  await win.click('[data-tab="words"]');
  assert.equal(await win.locator('.word-card').count(), 1);
  await win.click('[data-tab="stats"]');
  await win.waitForSelector('.stat-card');
  await shot('16-stats');
  await win.click('[data-tab="books"]');
});

await step('about and legal dialogs', async () => {
  await win.click('#lib-about-btn');
  await win.waitForSelector('#modal[open]');
  assert.match(await win.textContent('#modal'), /MIT License/);
  await win.click('#modal button:has-text("Legal & licenses")');
  await win.waitForSelector('#modal[open] .legal');
  const legal = await win.textContent('#modal');
  assert.match(legal, /does not remove, bypass or weaken DRM/);
  assert.match(legal, /PDF\.js/);
  await shot('17-legal');
  await win.keyboard.press('Escape');
});

await step('everything persists across a restart', async () => {
  const sample = await dbg(() => window.__readaluneDebug.library.books.find((b) => b.format === 'sample'));
  await openBookByTitle(sample.title);
  await dbg(() => window.__readaluneDebug.reader.jumpTo(Math.floor(window.__readaluneDebug.reader.book.total * 0.6), { remember: false }));
  const pos = await range();
  await win.keyboard.press('Escape');
  await win.waitForTimeout(500);
  await closeApp();
  await launch();
  assert.equal(await win.locator('#modal[open]').count(), 0, 'first-run notice only shown once');
  assert.equal(await win.locator('#book-grid .book-card').count(), 8);
  await openBookByTitle(sample.title);
  const again = await range();
  assert.equal(again.start, pos.start, 'reading position restored');
  assert.equal(await dbg(() => window.__readaluneDebug.reader.state.highlights.length), 1);
  assert.equal(await dbg(() => window.__readaluneDebug.reader.state.bookmarks.length), 1);
  await win.keyboard.press('Escape');
});

await step('remove a book', async () => {
  const meta = await dbg(() => window.__readaluneDebug.library.books.find((b) => b.format === 'html'));
  dbg((id) => window.__readaluneDebug.library.removeMany([id]), meta.id);
  await win.waitForSelector('#modal[open]');
  await win.click('#modal button.danger');
  await win.waitForFunction(() => document.querySelectorAll('#book-grid .book-card').length === 7);
  assert.equal(fs.existsSync(path.join(userData, 'library', 'books', meta.id)), false);
});

await step('a book opened from the system (double-click, Open with) opens in the reader', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readalune-open-'));
  const first = path.join(dir, 'Opened From Desktop.txt');
  fs.writeFileSync(first, `Opened From Desktop\n\n${'A quiet morning by the harbor, and the bells of the town. '.repeat(300)}\n`);
  await closeApp();
  await launch([first]);
  await win.waitForFunction(() => window.__readaluneDebug.reader.isOpen() && /Opened From Desktop/i.test(window.__readaluneDebug.reader.meta.title), null, { timeout: 20000 });
  const count = await dbg(() => window.__readaluneDebug.library.books.length);

  // A second launch hands its book to the open window and exits.
  const second = path.join(dir, 'Second Book.md');
  fs.writeFileSync(second, `# Second Book\n\n${'Lantern light over the quiet river. '.repeat(300)}\n`);
  assert.equal(await launchSecondCopy(second), 0);
  await win.waitForFunction(() => window.__readaluneDebug.reader.isOpen() && /Second Book/.test(window.__readaluneDebug.reader.meta.title), null, { timeout: 20000 });
  assert.equal(await dbg(() => window.__readaluneDebug.library.books.length), count + 1);

  // Opening a book that is already in the library opens it without a copy.
  assert.equal(await launchSecondCopy(first), 0);
  await win.waitForFunction(() => /Opened From Desktop/i.test(window.__readaluneDebug.reader.meta.title), null, { timeout: 20000 });
  assert.equal(await dbg(() => window.__readaluneDebug.library.books.length), count + 1);
  await win.keyboard.press('Escape');
  fs.rmSync(dir, { recursive: true, force: true });
});

await step('errors are written to the local log; a crashed window reloads', async () => {
  const logFile = path.join(userData, 'logs', 'readalune.log');
  try {
    await dbg(() => setTimeout(() => {
      throw new Error('e2e-probe-error');
    }, 0));
    await win.waitForTimeout(500);
    assert.match(fs.readFileSync(logFile, 'utf8'), /\[page\] .*e2e-probe-error/);

    const books = await dbg(() => window.__readaluneDebug.library.books.length);
    // Answer the "needs to reload" prompt automatically, then crash the window.
    await app.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false });
    });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.forcefullyCrashRenderer());
    // The test tool cannot follow a crashed page, so watch the reload from the
    // main process. A question sent while the new page takes over can be
    // dropped without an answer, so each one gives up after 2 s and is retried.
    let state = 'not checked';
    for (let i = 0; i < 30 && typeof state !== 'number'; i++) {
      await new Promise((r) => setTimeout(r, 500));
      state = await app.evaluate(async ({ BrowserWindow }) => {
        const wc = BrowserWindow.getAllWindows()[0].webContents;
        if (wc.isCrashed()) return 'still crashed';
        if (wc.isLoading()) return 'loading';
        const ask = wc
          .executeJavaScript("document.body.classList.contains('ready') ? window.__readaluneDebug.library.books.length : 'starting'")
          .catch((err) => `error: ${err.message}`);
        return Promise.race([ask, new Promise((resolve) => setTimeout(() => resolve('no answer'), 2000))]);
      });
    }
    assert.equal(state, books, `the window reloaded with the whole library (last state: ${state})`);
    assert.match(fs.readFileSync(logFile, 'utf8'), /\[window\] The window process ended/);
  } finally {
    // Always start fresh for the remaining steps.
    await closeApp();
    await launch();
  }
});

// Kept last: after a blocked navigation the test tool waits forever for the
// navigation to "finish" (the app itself keeps working, as checked below).
await step('navigating away to a website is blocked and the app keeps working', async () => {
  await win.evaluate(() => {
    location.href = 'https://example.com/';
  });
  await win.waitForTimeout(600);
  const url = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getURL());
  assert.equal(url, 'readalune://app/index.html');
  // A real mouse click (sent through Electron) still works afterwards.
  const box = await win.evaluate(() => {
    const r = document.querySelector('[data-tab="stats"]').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await app.evaluate(({ BrowserWindow }, b) => {
    const wc = BrowserWindow.getAllWindows()[0].webContents;
    wc.sendInputEvent({ type: 'mouseDown', x: Math.round(b.x), y: Math.round(b.y), button: 'left', clickCount: 1 });
    wc.sendInputEvent({ type: 'mouseUp', x: Math.round(b.x), y: Math.round(b.y), button: 'left', clickCount: 1 });
  }, box);
  await win.waitForTimeout(500);
  assert.equal(await win.evaluate(() => document.querySelector('[data-tab="stats"]').getAttribute('aria-selected')), 'true');
});

await step('no uncaught errors in the page', async () => {
  assert.deepEqual(pageErrors, [], JSON.stringify(pageErrors).slice(0, 1500));
});

await closeApp();
fs.rmSync(userData, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} end-to-end checks passed`);
process.exit(failed.length ? 1 : 0);
