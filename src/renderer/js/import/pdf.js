/**
 * PDF importer built on Mozilla's PDF.js (Apache-2.0), bundled locally.
 * Extracts the text layer and reflows it into paragraphs.
 *
 * - JavaScript inside PDFs is never run (PDF.js does not execute it here,
 *   and eval is disabled both in PDF.js and by our Content-Security-Policy).
 * - PDFs whose permissions forbid text extraction are refused.
 * - Password-protected PDFs open only with the password the user types.
 */
import * as pdfjs from '../../vendor/pdfjs/pdf.min.mjs';
import { finalizeBook, titleFromFileName } from '../core/book.js';
import { ImportError } from './errors.js';
import { layoutPdf, outlineToToc } from './pdf-layout.js';
import { headingToc } from './html.js';
import { canvasToJpeg, COVER_WIDTH } from './cover.js';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

const MAX_PAGES = 5000;

/**
 * @param {ArrayBuffer} bytes
 * @param {{ fileName?: string, onProgress?: Function, askPassword?: (retry:boolean)=>Promise<string|null> }} opts
 */
export async function parsePdf(bytes, opts = {}) {
  const progress = opts.onProgress || (() => {});
  const task = pdfjs.getDocument({
    // PDF.js transfers its buffer to the worker; give it a copy so the original stays usable.
    data: new Uint8Array(bytes.slice(0)),
    isEvalSupported: false,
    enableXfa: false,
    cMapUrl: new URL('../../vendor/pdfjs/cmaps/', import.meta.url).href,
    cMapPacked: true,
    useSystemFonts: true,
    // Draw glyphs as paths instead of injecting @font-face styles (keeps our strict CSP).
    disableFontFace: true,
    useWorkerFetch: false,
    stopAtErrors: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  });
  let cancelledByUser = false;
  task.onPassword = async (updatePassword, reason) => {
    const retry = reason === pdfjs.PasswordResponses.INCORRECT_PASSWORD;
    const pw = opts.askPassword ? await opts.askPassword(retry) : null;
    if (pw === null || pw === undefined) {
      cancelledByUser = true;
      task.destroy();
    } else updatePassword(pw);
  };

  let doc;
  try {
    doc = await task.promise;
  } catch (err) {
    if (cancelledByUser) throw new ImportError('Import cancelled: the PDF needs a password.');
    if (err && err.name === 'InvalidPDFException') throw new ImportError('This file is not a valid PDF.');
    throw new ImportError('This PDF could not be opened.');
  }

  try {
    const perms = await doc.getPermissions();
    if (perms && !perms.has(pdfjs.PermissionFlag.COPY) && !perms.has(pdfjs.PermissionFlag.COPY_FOR_ACCESSIBILITY)) {
      throw new ImportError(
        "This PDF's publisher has disabled text extraction in its permissions, so Readalune will not import it."
      );
    }

    const pageCount = Math.min(doc.numPages, MAX_PAGES);
    const pages = [];
    let chars = 0;
    for (let n = 1; n <= pageCount; n++) {
      if (n === 1 || n % 5 === 0) progress(`Reading page ${n} of ${pageCount}\u2026`, n / pageCount);
      const page = await doc.getPage(n);
      const content = await page.getTextContent({ includeMarkedContent: false });
      const items = [];
      for (const it of content.items) {
        if (typeof it.str !== 'string') continue;
        const [a, b, c, d, e, f] = it.transform;
        const size = Math.hypot(c, d) || Math.hypot(a, b) || it.height || 10;
        items.push({ str: it.str, x: e, y: f, w: it.width, size, eol: it.hasEOL });
        chars += it.str.length;
      }
      pages.push({ page: n, items });
      page.cleanup();
    }
    if (chars < Math.max(40, pageCount * 15)) {
      throw new ImportError(
        'This PDF has little or no selectable text (it is probably scanned images). ' +
          'Run it through an OCR tool to add a text layer, then import it again.'
      );
    }

    progress('Formatting\u2026', 1);
    const { blocks } = layoutPdf(pages);

    let toc = [];
    try {
      const outline = await readOutline(doc);
      if (outline.length) toc = outlineToToc(blocks, outline);
    } catch {
      toc = [];
    }
    if (toc.length) {
      const top = Math.min(...toc.map((t) => t.level));
      for (const t of toc) if (t.level === top) blocks[t.block].brk = 1;
      for (const t of toc) t.level -= top;
    } else {
      toc = headingToc(blocks);
    }

    let info = {};
    try {
      info = (await doc.getMetadata()).info || {};
    } catch {
      info = {};
    }
    let title = typeof info.Title === 'string' ? info.Title.trim() : '';
    title = title.replace(/^microsoft (word|powerpoint) - /i, '').replace(/\.(docx?|pptx?|odt|rtf|pdf)$/i, '');
    if (!title || /^(untitled|document\d*|untitled document)$/i.test(title)) title = titleFromFileName(opts.fileName);
    const author = typeof info.Author === 'string' ? info.Author.trim() : '';

    let cover = null;
    try {
      cover = await withTimeout(renderCover(doc), 8000);
    } catch {
      cover = null;
    }

    const book = finalizeBook({
      blocks,
      toc,
      meta: { title, author, language: '', format: 'pdf', sourceName: opts.fileName || '' },
    });
    // Keep the original file for the "original layout" view.
    return { ...book, cover, source: bytes };
  } finally {
    task.destroy().catch(() => {});
  }
}

async function readOutline(doc) {
  const outline = await doc.getOutline();
  if (!outline) return [];
  const out = [];
  const walk = async (items, level) => {
    for (const item of items) {
      if (out.length > 3000) return;
      let dest = item.dest;
      try {
        if (typeof dest === 'string') dest = await doc.getDestination(dest);
        let page = 0;
        if (Array.isArray(dest) && dest[0] !== undefined && dest[0] !== null) {
          if (typeof dest[0] === 'object') page = (await doc.getPageIndex(dest[0])) + 1;
          else if (Number.isInteger(dest[0])) page = dest[0] + 1;
        }
        const title = String(item.title || '').trim();
        if (page && title) out.push({ title, page, level });
      } catch {
        /* skip broken destinations */
      }
      if (item.items && item.items.length && level < 5) await walk(item.items, level + 1);
    }
  };
  await walk(outline, 0);
  return out;
}

async function renderCover(doc) {
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: COVER_WIDTH / base.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.min(1200, Math.floor(viewport.height)));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvasToJpeg(canvas, 0.82);
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}
