'use strict';
/**
 * Maps readalune://app/<path> URLs to files on disk. Anything outside the
 * renderer folder or the two allowed PDF.js files (plus its CMaps) is refused,
 * so a crafted URL can never read arbitrary files.
 */
const path = require('node:path');

function createResolver(rendererRoot, pdfjsRoot) {
  const rendererBase = path.resolve(rendererRoot);
  const pdfjsBase = path.resolve(pdfjsRoot);
  return function resolveAppFile(urlPath) {
    let decoded;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      return null;
    }
    if (typeof decoded !== 'string' || decoded.includes('\0') || decoded.includes('\\')) return null;

    const vendorPrefix = '/vendor/pdfjs/';
    if (decoded.startsWith(vendorPrefix)) {
      const rest = decoded.slice(vendorPrefix.length);
      if (rest === 'pdf.min.mjs' || rest === 'pdf.worker.min.mjs') return path.join(pdfjsBase, 'build', rest);
      if (/^cmaps\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.bcmap$/.test(rest)) return path.join(pdfjsBase, rest);
      return null;
    }

    const target = path.resolve(rendererBase, '.' + path.posix.normalize('/' + decoded));
    if (!target.startsWith(rendererBase + path.sep)) return null;
    return target;
  };
}

module.exports = { createResolver };
