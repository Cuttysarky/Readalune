// Browser stand-in for Readalune's desktop bridge (window.readalune), used
// only by the browser preview (npm run preview); not part of the app.
// Library calls go to the preview server; file pickers, downloads, clipboard
// and full screen use what a web page can do.
(function () {
  'use strict';
  const EXT = ['txt', 'text', 'md', 'markdown', 'html', 'htm', 'xhtml', 'epub', 'pdf', 'cbz', 'cbr'];

  function toB64(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function encode(x) {
    if (x instanceof ArrayBuffer) return { __bytes: toB64(new Uint8Array(x)), ab: true };
    if (ArrayBuffer.isView(x)) return { __bytes: toB64(new Uint8Array(x.buffer, x.byteOffset, x.byteLength)), ab: false };
    if (Array.isArray(x)) return x.map(encode);
    if (x && typeof x === 'object') {
      const o = {};
      for (const k of Object.keys(x)) o[k] = encode(x[k]);
      return o;
    }
    return x;
  }
  function decode(x) {
    if (Array.isArray(x)) return x.map(decode);
    if (x && typeof x === 'object') {
      if (typeof x.__bytes === 'string') {
        const bin = atob(x.__bytes);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return x.ab ? u8.buffer : u8;
      }
      const o = {};
      for (const k of Object.keys(x)) o[k] = decode(x[k]);
      return o;
    }
    return x;
  }
  async function call(channel, ...args) {
    const res = await fetch(`__api/${encodeURIComponent(channel)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(encode(args)) });
    const out = await res.json();
    if (out.error) throw new Error(out.error);
    return decode(out.value);
  }
  const remote = (channel) => (...args) => call(channel, ...args);

  /** Let the user pick files in the browser; resolves [] if cancelled. */
  function pick({ multiple = true, accept = '', folder = false } = {}) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      if (accept) input.accept = accept;
      if (folder) input.webkitdirectory = true;
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const files = Array.from(input.files || []);
        input.remove();
        resolve(files);
      });
      input.addEventListener('cancel', () => {
        input.remove();
        resolve([]);
      });
      document.body.append(input);
      input.click();
    });
  }
  async function readAll(files) {
    const out = [];
    for (const f of files) {
      if (f.size > 300 * 1024 * 1024) out.push({ name: f.name, error: 'File is larger than 300 MB.' });
      else out.push({ name: f.name, size: f.size, bytes: await f.arrayBuffer() });
    }
    return out;
  }
  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  const noSub = () => () => {};

  window.readalune = Object.freeze({
    appInfo: remote('app:info'),
    takeOpenedFiles: async () => [],
    logError: async (msg) => console.warn('[Readalune]', msg),
    pickFiles: async () => readAll(await pick({ accept: EXT.map((e) => `.${e}`).join(',') })),

    listBooks: remote('library:list'),
    addBook: remote('library:add'),
    getContent: remote('library:content'),
    getState: remote('library:state'),
    saveState: remote('library:save-state'),
    updateMeta: remote('library:update-meta'),
    removeBook: remote('library:remove'),
    getSource: remote('library:source'),
    getCollections: remote('collections:get'),
    setCollections: remote('collections:set'),
    exportBackup: async () => {
      const r = await call('backup:export');
      download(`readalune-backup-${new Date().toISOString().slice(0, 10)}.zip`, new Blob([r.zip], { type: 'application/zip' }));
      return { files: r.files, bytes: r.bytes };
    },
    importBackup: async (opts) => {
      const [file] = await pick({ multiple: false, accept: '.zip' });
      if (!file) return null;
      return call('backup:import', await file.arrayBuffer(), opts);
    },
    importFolder: async () => {
      const files = await pick({ folder: true });
      if (!files.length) return null;
      return readAll(files.filter((f) => EXT.includes(f.name.split('.').pop().toLowerCase())).slice(0, 1000));
    },
    watchedFolders: async () => [],
    unwatchFolder: async () => [],

    getSettings: remote('settings:get'),
    setSettings: remote('settings:set'),
    getStats: remote('stats:get'),
    setStats: remote('stats:set'),
    getWords: remote('words:get'),
    setWords: remote('words:set'),

    exportText: async (name, text) => {
      download(name, new Blob([text], { type: 'text/plain;charset=utf-8' }));
      return true;
    },
    exportImage: async (name, bytes) => {
      download(name.endsWith('.png') ? name : `${name}.png`, new Blob([bytes], { type: 'image/png' }));
      return true;
    },
    copyText: async (text) => {
      await navigator.clipboard.writeText(text);
      return true;
    },
    openExternal: async (url) => {
      window.open(url, '_blank', 'noopener');
      return true;
    },
    toggleFullscreen: async () => {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      return Boolean(document.fullscreenElement);
    },
    isFullscreen: async () => Boolean(document.fullscreenElement),
    openDataFolder: async () => '',

    onMenu: noSub,
    onFullscreen: (cb) => {
      const fn = () => cb(Boolean(document.fullscreenElement));
      document.addEventListener('fullscreenchange', fn);
      return () => document.removeEventListener('fullscreenchange', fn);
    },
    onFolderFile: noSub,
    onOpenFiles: noSub,
  });
})();
