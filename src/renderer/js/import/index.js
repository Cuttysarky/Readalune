/**
 * Detects a file's format and runs the matching importer.
 * Returns { meta, content, cover } ready to be stored in the library.
 */
import { decodeText, parsePlainText } from './text.js';
export { decodeText };
import { parseMarkdown } from './markdown.js';
import { parseHtmlFile } from './html.js';
import { ImportError } from './errors.js';

export { ImportError };

export const ACCEPTED_EXTENSIONS = ['.txt', '.text', '.md', '.markdown', '.html', '.htm', '.xhtml', '.epub', '.pdf', '.cbz', '.cbr'];

export function detectFormat(name, bytes) {
  const u8 = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 1024));
  const ext = (/\.([a-z0-9]{1,10})$/i.exec(name || '') || [])[1]?.toLowerCase() || '';
  if (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) return 'pdf'; // %PDF
  if (u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 0x03 && u8[3] === 0x04) {
    const head = new TextDecoder('latin1').decode(u8.subarray(0, 120));
    if (head.includes('application/epub+zip') || ext === 'epub') return 'epub';
    if (ext === 'cbz' || ext === 'cbr' || ext === 'zip') return 'cbz';
    return 'zip';
  }
  // "Rar!" - RAR archives (real .cbr files).
  if (u8[0] === 0x52 && u8[1] === 0x61 && u8[2] === 0x72 && u8[3] === 0x21) return 'rar';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'epub') return 'epub';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (ext === 'html' || ext === 'htm' || ext === 'xhtml') return 'html';
  const head = new TextDecoder('utf-8').decode(u8).trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith('<!doctype html') || head.startsWith('<html')) return 'html';
  return looksLikeText(u8) ? 'txt' : 'binary';
}

/**
 * True when the first bytes look like text: UTF-16 (BOM or alternating zero
 * bytes) or text with no NUL bytes and almost no control characters.
 */
export function looksLikeText(u8) {
  if ((u8[0] === 0xff && u8[1] === 0xfe) || (u8[0] === 0xfe && u8[1] === 0xff)) return true;
  let evenZero = 0;
  let oddZero = 0;
  let control = 0;
  for (let i = 0; i < u8.length; i++) {
    const c = u8[i];
    if (c === 0) {
      if (i % 2) oddZero++;
      else evenZero++;
    } else if (c < 9 || (c > 13 && c < 32) || c === 127) control++;
  }
  const half = u8.length / 2;
  // UTF-16 without a BOM: zeros in (almost) every other byte, none in the rest.
  if (u8.length >= 8 && ((oddZero > half * 0.6 && evenZero === 0) || (evenZero > half * 0.6 && oddZero === 0))) return true;
  return evenZero + oddZero === 0 && control <= u8.length * 0.02;
}

/**
 * @param {{ name: string, bytes: ArrayBuffer }} file
 * @param {{ onProgress?: Function, askPassword?: Function }} opts
 */
export async function importFile(file, opts = {}) {
  const { name, bytes } = file;
  if (!bytes || bytes.byteLength === 0) throw new ImportError('The file is empty.');
  // SHA-256 of the original file, used to spot duplicates (computed before parsing).
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const book = await importByFormat(file, opts);
  book.meta.hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return book;
}

async function importByFormat(file, opts) {
  const { name, bytes } = file;
  const format = detectFormat(name, bytes);
  const common = { fileName: name, onProgress: opts.onProgress, askPassword: opts.askPassword };

  switch (format) {
    case 'cbz': {
      const { parseComic } = await import('./comic.js');
      return parseComic(bytes, common);
    }
    case 'rar':
      throw new ImportError('This comic is a RAR archive (.cbr). Readalune opens ZIP comics (.cbz) only, because RAR decompression code is not available under an open-source license. Convert it to .cbz with a free tool and import it again.');
    case 'pdf': {
      const { parsePdf } = await import('./pdf.js');
      return parsePdf(bytes, common);
    }
    case 'epub': {
      const { parseEpub } = await import('./epub.js');
      return parseEpub(bytes, common);
    }
    case 'md':
      return { ...parseMarkdown(decodeText(bytes), common), cover: null };
    case 'html':
      return { ...parseHtmlFile(bytes, common), cover: null };
    case 'txt': {
      const text = decodeText(bytes);
      if (text.length > 200 * 1024 * 1024) throw new ImportError('This text file is too large.');
      return { ...parsePlainText(text, common), cover: null };
    }
    case 'zip':
      throw new ImportError('This is a ZIP archive, not a book. Unzip it first, or rename it to .epub or .cbz if it is an EPUB or a comic.');
    default:
      throw new ImportError(
        'Readalune can import plain text (.txt), Markdown (.md), HTML, EPUB, PDF and CBZ comic files. This file type is not supported.'
      );
  }
}

/** The built-in welcome guide (an original document shipped with the app). */
export async function importSample() {
  const res = await fetch(new URL('../../sample/welcome.md', import.meta.url));
  const text = await res.text();
  const book = parseMarkdown(text, { fileName: 'welcome.md', format: 'sample' });
  return { ...book, cover: null };
}
