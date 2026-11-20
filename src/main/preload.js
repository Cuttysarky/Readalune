'use strict';
/**
 * The only bridge between the sandboxed page and the main process.
 * It exposes a small, fixed set of functions - never ipcRenderer itself.
 */
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

function subscribe(channel) {
  return (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('readalune', {
  appInfo: invoke('app:info'),
  takeOpenedFiles: invoke('app:opened-files'),
  logError: invoke('log:error'),
  pickFiles: invoke('dialog:pick-files'),

  listBooks: invoke('library:list'),
  addBook: invoke('library:add'),
  getContent: invoke('library:content'),
  getState: invoke('library:state'),
  saveState: invoke('library:save-state'),
  updateMeta: invoke('library:update-meta'),
  removeBook: invoke('library:remove'),
  getSource: invoke('library:source'),
  getCollections: invoke('collections:get'),
  setCollections: invoke('collections:set'),
  exportBackup: invoke('backup:export'),
  importFolder: invoke('folder:import'),
  watchedFolders: invoke('folder:watched'),
  unwatchFolder: invoke('folder:unwatch'),
  importBackup: invoke('backup:import'),

  getSettings: invoke('settings:get'),
  setSettings: invoke('settings:set'),
  getStats: invoke('stats:get'),
  setStats: invoke('stats:set'),
  getWords: invoke('words:get'),
  setWords: invoke('words:set'),

  exportText: invoke('export:text'),
  exportImage: invoke('export:image'),
  copyText: invoke('clipboard:write'),
  openExternal: invoke('external:open'),
  toggleFullscreen: invoke('window:toggle-fullscreen'),
  isFullscreen: invoke('window:is-fullscreen'),
  openDataFolder: invoke('shell:open-data-folder'),

  onMenu: subscribe('menu'),
  onFullscreen: subscribe('window:fullscreen'),
  onFolderFile: subscribe('folder:new-file'),
  onOpenFiles: subscribe('open:files'),
});
