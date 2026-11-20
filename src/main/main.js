'use strict';
/**
 * Readalune - main (privileged) process.
 *
 * Security model (see SECURITY.md):
 *  - The UI runs in a sandboxed renderer with contextIsolation and no Node.js.
 *  - All app files are served from a private `readalune://` scheme with a strict
 *    Content-Security-Policy. Nothing is loaded from the internet.
 *  - Every outgoing network request from web contents is cancelled.
 *  - Navigation, new windows, <webview> and permission requests are denied.
 *  - IPC handlers only accept calls from our own page and validate every argument.
 *  - The renderer never sees file-system paths it did not get from a user dialog.
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
  Menu,
  session,
  clipboard,
  nativeTheme,
  screen,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const store = require('./store');
const v = require('./validate');
const { createResolver } = require('./paths');
const { writeZip, readZip } = require('./zip');
const folders = require('./folders');
const log = require('./log');

const SCHEME = 'readalune';
const APP_HOST = 'app';
const APP_ORIGIN = `${SCHEME}://${APP_HOST}`;
const INDEX_URL = `${APP_ORIGIN}/index.html`;
const MAX_IMPORT_BYTES = 300 * 1024 * 1024; // 300 MB per file
const IS_DEV = !app.isPackaged && process.env.READALUNE_DEV === '1';

/** The only external site the app can open (the project page, on request). */
const EXTERNAL_HOSTS = new Set(['github.com']);
const RELEASES_URL = 'https://github.com/cuttysarky/readalune/releases/latest';

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.bcmap': 'application/octet-stream',
  '.gz': 'application/gzip',
};

// The custom scheme must be registered before the app is ready.
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: false },
  },
]);

// Automated tests run against a throw-away library folder (never in packaged builds).
if (!app.isPackaged && process.env.READALUNE_USER_DATA) {
  app.setPath('userData', process.env.READALUNE_USER_DATA);
}

// Unexpected errors go to a local log file instead of crashing the app.
log.init(path.join(app.getPath('userData'), 'logs'));
process.on('uncaughtException', (err) => log.write('main', err));
process.on('unhandledRejection', (reason) => log.write('main', reason instanceof Error ? reason : `Unhandled rejection: ${reason}`));

// Everything renders in an OS-level sandbox. (CI containers that run as root
// cannot use Chromium's sandbox; tests may opt out, never packaged builds.)
const TEST_NO_SANDBOX = !app.isPackaged && process.env.READALUNE_TEST_NO_SANDBOX === '1';
if (!TEST_NO_SANDBOX) app.enableSandbox();

// Turn off Chromium background services that could contact the network.
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-features', 'SpellcheckService,AutofillServerCommunication,MediaRouter,OptimizationHints,Translate');
app.commandLine.appendSwitch('no-pings');

// Only one copy of the app may run at a time (protects the library files).
const GOT_LOCK = app.requestSingleInstanceLock();
if (!GOT_LOCK) app.quit();

let mainWindow = null;

/* ------------------------------------------------------------------------- */
/* Opening books from the operating system                                    */
/* ------------------------------------------------------------------------- */
// Double-clicking a book, "Open with Readalune", dropping a file on the dock
// icon or passing it on the command line. Only the file's name and bytes are
// handed to the page, never its path.

const SUPPORTED_EXT = ['txt', 'text', 'md', 'markdown', 'html', 'htm', 'xhtml', 'epub', 'pdf', 'cbz', 'cbr'];
const OPEN_EXT = new Set(SUPPORTED_EXT.map((e) => `.${e}`));
const pendingOpen = [];
let rendererReady = false;

/** Book files named on a command line (flags and anything else are ignored). */
function bookPathsFrom(argv, cwd) {
  const out = [];
  for (const arg of argv.slice(1)) {
    if (typeof arg !== 'string' || !arg || arg.startsWith('-')) continue;
    if (!OPEN_EXT.has(path.extname(arg).toLowerCase())) continue;
    out.push(path.resolve(cwd || process.cwd(), arg));
  }
  return out.slice(0, 50);
}

/** Read a file the user chose, as { name, size, bytes } or { name, error }. */
async function readUserFile(filePath) {
  const name = path.basename(filePath);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    if (stat.size > MAX_IMPORT_BYTES) return { name, error: 'File is larger than 300 MB.' };
    const buf = await fs.readFile(filePath);
    // Hand the renderer a standalone ArrayBuffer, never the path.
    return { name, size: stat.size, bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  } catch {
    return { name, error: 'Could not read the file.' };
  }
}

async function openPaths(paths) {
  if (!paths.length) return;
  const files = (await Promise.all(paths.map(readUserFile))).filter(Boolean);
  if (!files.length) return;
  if (rendererReady) sendToRenderer('open:files', files);
  else pendingOpen.push(...files);
  if (app.isReady() && !mainWindow) createWindow();
  showWindow();
}

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

// macOS delivers files through an event, possibly before the app is ready.
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (GOT_LOCK) openPaths([filePath]).catch((err) => log.write('open-file', err));
});

/* ------------------------------------------------------------------------- */
/* Static file serving                                                        */
/* ------------------------------------------------------------------------- */

const RENDERER_ROOT = path.join(__dirname, '..', 'renderer');
const PDFJS_ROOT = path.join(app.getAppPath(), 'node_modules', 'pdfjs-dist');

const resolveAppFile = createResolver(RENDERER_ROOT, PDFJS_ROOT);

function respond(status, body, type) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': type || 'text/plain; charset=utf-8',
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    },
  });
}

async function handleAppRequest(request) {
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return respond(400, 'Bad request');
  }
  if (url.host !== APP_HOST) return respond(404, 'Not found');

  // Book covers live in the user's library folder.
  const coverMatch = /^\/covers\/([a-z0-9-]{8,64})\.jpg$/.exec(url.pathname);
  if (coverMatch) {
    const data = await store.readCover(coverMatch[1]);
    return data ? respond(200, data, 'image/jpeg') : respond(404, 'Not found');
  }

  const filePath = resolveAppFile(url.pathname === '/' ? '/index.html' : url.pathname);
  if (!filePath) return respond(404, 'Not found');
  try {
    const data = await fs.readFile(filePath);
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    return respond(200, data, type);
  } catch {
    return respond(404, 'Not found');
  }
}

/* ------------------------------------------------------------------------- */
/* Window                                                                     */
/* ------------------------------------------------------------------------- */

/** Forget a saved window position if it would now be off every screen. */
function onScreen(bounds) {
  if (bounds.x === undefined || bounds.y === undefined) return bounds;
  const w = bounds.width || 1280;
  const visible = screen.getAllDisplays().some(({ workArea: a }) => {
    return bounds.x < a.x + a.width - 80 && bounds.x + w > a.x + 80 && bounds.y >= a.y - 20 && bounds.y < a.y + a.height - 80;
  });
  return visible ? bounds : { ...bounds, x: undefined, y: undefined };
}

function createWindow() {
  const bounds = onScreen(store.getWindowBounds());
  mainWindow = new BrowserWindow({
    width: bounds.width || 1280,
    height: bounds.height || 860,
    x: bounds.x,
    y: bounds.y,
    minWidth: 720,
    minHeight: 540,
    show: false,
    title: 'Readalune',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#17161c' : '#f7f4ee',
    icon: path.join(__dirname, '..', 'renderer', 'assets', 'icon.png'),
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
      navigateOnDragDrop: false,
      spellcheck: false,
      devTools: IS_DEV,
    },
  });

  if (bounds.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.once('did-finish-load', () => setTimeout(() => folders.resume(), 1500));

  const saveBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const b = mainWindow.getNormalBounds();
    store.setWindowBounds({ ...b, maximized: mainWindow.isMaximized() });
  };
  mainWindow.on('resize', debounce(saveBounds, 500));
  mainWindow.on('move', debounce(saveBounds, 500));
  mainWindow.on('close', saveBounds);
  mainWindow.on('enter-full-screen', () => sendToRenderer('window:fullscreen', true));
  mainWindow.on('leave-full-screen', () => sendToRenderer('window:fullscreen', false));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  watchHealth(mainWindow);

  rendererReady = false;
  mainWindow.loadURL(INDEX_URL);
}

/** Recover from a crashed or frozen window instead of leaving it blank. */
function watchHealth(win) {
  const wc = win.webContents;
  let reloadingAfterHang = false;
  let hangPrompt = null;

  wc.on('did-start-loading', () => {
    rendererReady = false;
  });

  wc.on('render-process-gone', async (_event, details) => {
    rendererReady = false;
    if (reloadingAfterHang) {
      reloadingAfterHang = false;
      return;
    }
    if (details.reason === 'clean-exit') return;
    log.write('window', `The window process ended (${details.reason}, exit code ${details.exitCode})`);
    if (win.isDestroyed()) return;
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Readalune',
      message: 'Readalune ran into a problem and needs to reload.',
      detail: 'Your library, notes and reading positions are saved.',
      buttons: ['Reload', 'Quit'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (win.isDestroyed()) return;
    if (response === 0) win.loadURL(INDEX_URL);
    else app.quit();
  });

  win.on('unresponsive', async () => {
    if (hangPrompt) return;
    log.write('window', 'The window stopped responding');
    hangPrompt = new AbortController();
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Readalune',
      message: 'Readalune is not responding.',
      detail: 'A very large book can take a moment to prepare. You can wait, or reload the window. Your library and notes are saved.',
      buttons: ['Wait', 'Reload'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
      signal: hangPrompt.signal,
    });
    hangPrompt = null;
    if (response === 1 && !win.isDestroyed()) {
      reloadingAfterHang = true;
      wc.forcefullyCrashRenderer();
      win.loadURL(INDEX_URL);
    }
  });
  // The prompt closes by itself if the window recovers.
  win.on('responsive', () => hangPrompt && hangPrompt.abort());
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ------------------------------------------------------------------------- */
/* Application menu                                                           */
/* ------------------------------------------------------------------------- */

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const send = (action) => () => sendToRenderer('menu', action);
  const template = [
    ...(isMac
      ? [
          {
            label: 'Readalune',
            submenu: [
              { label: 'About Readalune', click: send('about') },
              { type: 'separator' },
              { label: 'Settings\u2026', accelerator: 'Cmd+,', click: send('settings') },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'Import Books\u2026', accelerator: 'CmdOrCtrl+O', click: send('import') },
        { label: 'Library', accelerator: 'CmdOrCtrl+L', click: send('library') },
        { type: 'separator' },
        { label: 'Export Notes & Highlights\u2026', accelerator: 'CmdOrCtrl+Shift+E', click: send('export-notes') },
        { type: 'separator' },
        ...(isMac ? [{ role: 'close' }] : [{ label: 'Settings', accelerator: 'Ctrl+,', click: send('settings') }, { type: 'separator' }, { role: 'quit' }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [{ role: 'copy' }, { role: 'selectAll' }, { type: 'separator' }, { label: 'Find in Book\u2026', accelerator: 'CmdOrCtrl+F', click: send('search') }],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Contents', accelerator: 'CmdOrCtrl+T', click: send('toc') },
        { label: 'Notes & Bookmarks', accelerator: 'CmdOrCtrl+Shift+N', click: send('notes') },
        { label: 'Reading Settings', accelerator: 'CmdOrCtrl+Shift+A', click: send('display') },
        { type: 'separator' },
        { label: 'Larger Text', accelerator: 'CmdOrCtrl+=', click: send('font-up') },
        { label: 'Smaller Text', accelerator: 'CmdOrCtrl+-', click: send('font-down') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(IS_DEV ? [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Keyboard Shortcuts', accelerator: 'F1', click: send('shortcuts') },
        { label: 'Open Library Folder', click: () => shell.openPath(store.dataDir()) },
        { type: 'separator' },
        // Readalune never checks online by itself; this opens the releases page in the browser.
        { label: 'Check for Updates\u2026', click: () => shell.openExternal(RELEASES_URL) },
        { label: 'Legal & Licenses', click: send('legal') },
        ...(isMac ? [] : [{ label: 'About Readalune', click: send('about') }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ------------------------------------------------------------------------- */
/* IPC                                                                        */
/* ------------------------------------------------------------------------- */

/** Register an IPC handler that only answers our own top-level page. */
function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    const frame = event.senderFrame;
    if (!frame || frame.parent !== null || !frame.url.startsWith(APP_ORIGIN + '/')) {
      throw new Error('Rejected IPC from untrusted sender');
    }
    return fn(event, ...args);
  });
}

/** Files a backup may contain; anything else in the archive is ignored. */
const BACKUP_ALLOW = /^(index|collections|settings|stats|words)\.json$|^books\/[a-z0-9-]{8,64}\/(content\.json|state\.json|cover\.jpg|source\.bin)$/;

function registerIpc() {
  handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    dataDir: store.dataDir(),
    deviceId: store.getDeviceId(),
    // The automated tests' page handle exists only in development builds.
    testHandle: !app.isPackaged,
  }));

  handle('dialog:pick-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import books',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Books and documents', extensions: SUPPORTED_EXT },
        { name: 'All files', extensions: ['*'] },
      ],
    });
    if (result.canceled) return [];
    const files = [];
    for (const filePath of result.filePaths.slice(0, 200)) {
      const file = await readUserFile(filePath);
      if (file) files.push(file);
    }
    return files;
  });

  // Books opened from the operating system before the page was ready.
  handle('app:opened-files', () => {
    rendererReady = true;
    return pendingOpen.splice(0);
  });

  // Errors in the page are written to the same local log.
  let pageErrors = 0;
  handle('log:error', (_e, message) => {
    if (pageErrors++ < 50) log.write('page', v.string(message, 16 * 1024));
    return true;
  });

  handle('folder:import', async (_e, opts) => {
    const result = await dialog.showOpenDialog(mainWindow, { title: 'Import a folder of books', properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return null;
    const dir = result.filePaths[0];
    const files = await folders.importFolder(dir);
    if (opts && opts.watch === true) await folders.watch(dir);
    return files;
  });
  handle('folder:watched', () => folders.list());
  handle('folder:unwatch', async (_e, index) => {
    await folders.unwatch(Number.isInteger(index) ? index : -1);
    return folders.list();
  });

  handle('library:list', () => store.listBooks());
  handle('library:add', (_e, payload) => store.addBook(v.bookPayload(payload)));
  handle('library:content', (_e, id) => store.readContent(v.bookId(id)));
  handle('library:state', (_e, id) => store.readState(v.bookId(id)));
  handle('library:save-state', (_e, id, state) => store.writeState(v.bookId(id), v.bookState(state)));
  handle('library:update-meta', (_e, id, patch) => store.updateMeta(v.bookId(id), v.metaPatch(patch)));
  handle('library:remove', (_e, id) => store.removeBook(v.bookId(id)));
  handle('library:source', (_e, id) => store.readSource(v.bookId(id)));
  handle('collections:get', async () => (await store.readJson('collections', [])) || []);
  handle('collections:set', (_e, list) => store.writeJson('collections', v.collections(list)));

  handle('backup:export', async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export library backup',
      defaultPath: path.join(app.getPath('documents'), `readalune-backup-${stamp}.zip`),
      filters: [{ name: 'Readalune backup', extensions: ['zip'] }],
    });
    if (result.canceled || !result.filePath) return null;
    const files = await store.libraryFiles();
    const bytes = await writeZip(result.filePath, files);
    return { files: files.length, bytes };
  });

  handle('backup:import', async (_e, opts) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import library backup',
      properties: ['openFile'],
      filters: [{ name: 'Readalune backup', extensions: ['zip'] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const stat = await fs.stat(result.filePaths[0]);
    if (stat.size > 3 * 1024 * 1024 * 1024) throw new Error('Backup is too large.');
    const files = readZip(await fs.readFile(result.filePaths[0]), { allow: BACKUP_ALLOW });
    return store.importBackup(files, { replaceSettings: Boolean(opts && opts.replaceSettings === true) });
  });

  handle('settings:get', () => store.readJson('settings', {}));
  handle('settings:set', (_e, settings) => store.writeJson('settings', v.plainObject(settings, 64 * 1024)));
  handle('stats:get', () => store.readJson('stats', {}));
  handle('stats:set', (_e, stats) => store.writeJson('stats', v.plainObject(stats, 2 * 1024 * 1024)));
  handle('words:get', () => store.readJson('words', []));
  handle('words:set', (_e, words) => store.writeJson('words', v.plainArray(words, 4 * 1024 * 1024)));

  handle('export:text', async (_e, suggestedName, text) => {
    const name = v.fileName(suggestedName);
    const body = v.string(text, 20 * 1024 * 1024);
    const ext = path.extname(name).slice(1) || 'txt';
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export',
      defaultPath: path.join(app.getPath('documents'), name),
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });
    if (result.canceled || !result.filePath) return false;
    await fs.writeFile(result.filePath, body, 'utf8');
    return true;
  });

  handle('export:image', async (_e, suggestedName, bytes) => {
    const name = v.fileName(suggestedName);
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    // Only PNG images produced by the app's own canvas.
    if (data.byteLength > 20 * 1024 * 1024 || data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) throw new Error('Invalid image');
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save quote image',
      defaultPath: path.join(app.getPath('pictures'), name.endsWith('.png') ? name : `${name}.png`),
      filters: [{ name: 'PNG image', extensions: ['png'] }],
    });
    if (result.canceled || !result.filePath) return false;
    await fs.writeFile(result.filePath, Buffer.from(data));
    return true;
  });

  handle('clipboard:write', (_e, text) => {
    clipboard.writeText(v.string(text, 5 * 1024 * 1024));
    return true;
  });

  handle('external:open', async (_e, rawUrl) => {
    const url = new URL(v.string(rawUrl, 2048));
    if (url.protocol !== 'https:' || !EXTERNAL_HOSTS.has(url.hostname)) {
      throw new Error('Blocked external URL');
    }
    await shell.openExternal(url.toString());
    return true;
  });


  handle('window:toggle-fullscreen', () => {
    if (!mainWindow) return false;
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  });

  handle('window:is-fullscreen', () => Boolean(mainWindow && mainWindow.isFullScreen()));
  handle('shell:open-data-folder', () => shell.openPath(store.dataDir()));
}

/* ------------------------------------------------------------------------- */
/* Hardening for every web contents                                           */
/* ------------------------------------------------------------------------- */

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (event, url) => {
    if (url !== INDEX_URL) event.preventDefault();
  });
  contents.on('will-redirect', (event) => event.preventDefault());
  contents.on('will-attach-webview', (event) => event.preventDefault());
});

// A second launch (for example double-clicking another book) hands its files
// to this window and exits.
app.on('second-instance', (_event, argv, workingDirectory) => {
  showWindow();
  openPaths(bookPathsFrom(argv, workingDirectory)).catch((err) => log.write('open-file', err));
});

app.whenReady().then(async () => {
  if (!GOT_LOCK) return;
  await store.init(app.getPath('userData'));
  await folders.init(store.dataDir(), (file) => sendToRenderer('folder:new-file', file));

  const ses = session.defaultSession;
  // Readalune is an offline app: refuse every network request.
  ses.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*', 'file://*/*'] },
    (_details, callback) => callback({ cancel: true })
  );
  // Chromium would otherwise download spell-check dictionaries from Google.
  ses.setSpellCheckerEnabled(false);
  ses.setSpellCheckerLanguages([]);
  ses.setSpellCheckerDictionaryDownloadURL('https://localhost.invalid/');
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler?.(() => false);
  ses.on('will-download', (event) => event.preventDefault());

  ses.protocol.handle(SCHEME, handleAppRequest);

  registerIpc();
  buildMenu();
  createWindow();
  if (process.platform !== 'darwin') openPaths(bookPathsFrom(process.argv, process.cwd())).catch((err) => log.write('open-file', err));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await store.flush();
  if (process.platform !== 'darwin') app.quit();
});

// Let pending saves finish (for at most a few seconds) before the app exits.
let savedBeforeQuit = false;
app.on('before-quit', (event) => {
  folders.stopAll();
  if (savedBeforeQuit) return;
  event.preventDefault();
  savedBeforeQuit = true;
  Promise.race([store.flush(), new Promise((resolve) => setTimeout(resolve, 4000))]).finally(() => app.quit());
});

// Logging out or shutting down (Linux, macOS) asks apps to quit with SIGTERM.
process.on('SIGTERM', () => app.quit());
