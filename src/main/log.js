'use strict';
/**
 * A small local error log: <user data>/logs/readalune.log.
 * It records unexpected errors only (never book text) and never leaves this
 * computer. It is capped at 512 KB; the previous log is kept as
 * readalune.old.log.
 */
const fs = require('node:fs');
const path = require('node:path');

const MAX_BYTES = 512 * 1024;
let file = null;

function init(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, 'readalune.log');
  } catch {
    file = null;
  }
}

function write(scope, detail) {
  const text = detail instanceof Error ? detail.stack || detail.message : String(detail);
  if (!require('electron').app.isPackaged) console.error(`[${scope}]`, text);
  if (!file) return;
  try {
    try {
      if (fs.statSync(file).size > MAX_BYTES) fs.renameSync(file, path.join(path.dirname(file), 'readalune.old.log'));
    } catch {
      /* no log yet */
    }
    fs.appendFileSync(file, `${new Date().toISOString()} [${scope}] ${text.slice(0, 8000)}\n`);
  } catch {
    /* logging must never break the app */
  }
}

module.exports = { init, write };
