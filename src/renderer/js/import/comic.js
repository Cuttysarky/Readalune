/**
 * CBZ (comic book ZIP) importer. Pages are images inside a ZIP archive; the
 * original file is stored so pages can be decoded on demand while reading.
 * Optional ComicInfo.xml supplies title, series, number, writer and reading
 * direction (manga: right-to-left).
 */
import { openZip, ZipError } from './zip.js';
import { ImportError } from './errors.js';
import { imageBytesToCover } from './cover.js';
import { hashString, titleFromFileName } from '../core/book.js';

const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;
export const IMAGE_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp' };

export function imageType(name) {
  return IMAGE_TYPES[(/\.([a-z0-9]+)$/i.exec(name) || [])[1]?.toLowerCase()] || 'application/octet-stream';
}

/** Natural sort: "page 2" before "page 10". */
export function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function comicPages(entries) {
  return [...entries.keys()]
    .filter((n) => IMAGE_RE.test(n) && !/(^|\/)(__MACOSX|\.)/.test(n))
    .sort(naturalCompare);
}

export async function parseComic(bytes, opts = {}) {
  let zip;
  try {
    zip = openZip(bytes);
  } catch (err) {
    throw new ImportError(err instanceof ZipError ? err.message : 'This comic archive could not be read.');
  }
  const pages = comicPages(zip.entries);
  if (!pages.length) throw new ImportError('No page images were found in this comic archive.');

  const meta = { title: '', author: '', series: '', seriesIndex: null, publisher: '', description: '', language: '' };
  let rtl = false;
  const infoName = [...zip.entries.keys()].find((n) => /(^|\/)ComicInfo\.xml$/i.test(n));
  if (infoName) {
    try {
      const doc = new DOMParser().parseFromString(await zip.readText(infoName), 'application/xml');
      const get = (tag) => (doc.getElementsByTagName(tag)[0]?.textContent || '').trim();
      meta.title = get('Title');
      meta.series = get('Series');
      const num = parseFloat(get('Number'));
      meta.seriesIndex = Number.isFinite(num) && num >= 0 ? num : null;
      meta.author = [get('Writer'), get('Penciller')].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' & ');
      meta.publisher = get('Publisher');
      meta.description = get('Summary');
      meta.language = get('LanguageISO').slice(0, 20);
      rtl = /^YesAndRightToLeft$/i.test(get('Manga'));
    } catch {
      /* metadata is optional */
    }
  }
  if (!meta.title) meta.title = meta.series ? `${meta.series}${meta.seriesIndex !== null ? ` #${meta.seriesIndex}` : ''}` : titleFromFileName(opts.fileName);

  let cover = null;
  try {
    cover = await imageBytesToCover(await zip.read(pages[0]), imageType(pages[0]));
  } catch {
    cover = null;
  }
  const title = meta.title.slice(0, 300);
  return {
    meta: {
      ...meta,
      title,
      format: 'cbz',
      sourceName: opts.fileName || '',
      totalChars: pages.length,
      wordCount: 0,
      fingerprint: `comic-${hashString(pages.join('|')).toString(16)}-${pages.length}`,
      coverHue: hashString(title) % 360,
    },
    content: { v: 1, kind: 'comic', pages, rtl, blocks: [], toc: [] },
    cover,
    source: bytes,
  };
}
