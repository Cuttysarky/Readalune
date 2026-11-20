/**
 * EPUB 2/3 importer for DRM-free books.
 *
 * Readalune never removes or works around DRM. Books whose content is
 * encrypted are rejected with an explanation.
 */
import { finalizeBook, titleFromFileName } from '../core/book.js';
import { openZip, resolvePath, ZipError } from './zip.js';
import { htmlToBlocks, headingToc, parseMarkup } from './html.js';
import { ImportError } from './errors.js';
import { imageBytesToCover } from './cover.js';

const DC = 'http://purl.org/dc/elements/1.1/';
const FONT_OBFUSCATION = new Set(['http://www.idpf.org/2008/embedding', 'http://ns.adobe.com/pdf/enc#RC']);

function xml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new ImportError('This EPUB contains malformed XML.');
  return doc;
}

const byTag = (root, name) => Array.from(root.getElementsByTagNameNS('*', name));

export async function parseEpub(bytes, opts = {}) {
  const progress = opts.onProgress || (() => {});
  let zip;
  try {
    zip = openZip(bytes);
  } catch (err) {
    throw new ImportError(err instanceof ZipError ? err.message : 'This file is not a valid EPUB.');
  }

  await assertNoDrm(zip);

  if (!zip.has('META-INF/container.xml')) throw new ImportError('This EPUB is missing its container file.');
  const container = xml(await zip.readText('META-INF/container.xml'));
  const rootfile = byTag(container, 'rootfile')[0];
  const opfPath = rootfile && rootfile.getAttribute('full-path');
  if (!opfPath || !zip.has(opfPath)) throw new ImportError('This EPUB is missing its package file.');
  const opf = xml(await zip.readText(opfPath));

  // Metadata.
  const dcText = (name) =>
    Array.from(opf.getElementsByTagNameNS(DC, name))
      .map((e) => e.textContent.trim())
      .filter(Boolean);
  const title = dcText('title')[0] || titleFromFileName(opts.fileName);
  const creators = dcText('creator');
  const language = (dcText('language')[0] || '').slice(0, 20);
  const publisher = dcText('publisher')[0] || '';
  const description = (dcText('description')[0] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  // Series: Calibre's <meta name="calibre:series"> or EPUB 3 "belongs-to-collection".
  const metas = byTag(opf, 'meta');
  const metaNamed = (n) => metas.find((m) => m.getAttribute('name') === n)?.getAttribute('content') || '';
  const collection = metas.find((m) => m.getAttribute('property') === 'belongs-to-collection');
  const series = metaNamed('calibre:series') || (collection ? collection.textContent.trim() : '');
  const position = collection ? metas.find((m) => m.getAttribute('property') === 'group-position' && m.getAttribute('refines') === `#${collection.getAttribute('id')}`) : null;
  const seriesNum = parseFloat(metaNamed('calibre:series_index') || (position ? position.textContent : ''));

  // Manifest and spine.
  const manifest = new Map();
  for (const item of byTag(opf, 'item')) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (!id || !href) continue;
    manifest.set(id, {
      id,
      path: resolvePath(opfPath, href),
      type: (item.getAttribute('media-type') || '').toLowerCase(),
      props: (item.getAttribute('properties') || '').split(/\s+/),
    });
  }
  const spineEl = byTag(opf, 'spine')[0];
  const spine = byTag(opf, 'itemref')
    .map((ref) => ({ item: manifest.get(ref.getAttribute('idref')), linear: ref.getAttribute('linear') !== 'no' }))
    .filter((s) => s.item && /html|xml/.test(s.item.type) && zip.has(s.item.path));
  // Linear content first, auxiliary (linear="no") items at the end, like most reading systems.
  const ordered = [...spine.filter((s) => s.linear), ...spine.filter((s) => !s.linear)];
  if (!ordered.length) throw new ImportError('This EPUB has no readable chapters.');

  // Content.
  const blocks = [];
  const anchors = new Map();
  const docStart = new Map();
  for (let i = 0; i < ordered.length; i++) {
    const { item } = ordered[i];
    progress(`Reading chapter ${i + 1} of ${ordered.length}\u2026`, i / ordered.length);
    let text;
    try {
      text = await zip.readText(item.path);
    } catch (err) {
      if (err instanceof ZipError && /too large|more data/.test(err.message)) throw new ImportError(err.message);
      continue;
    }
    const doc = parseMarkup(text, item.type.includes('xhtml') || item.type.includes('xml'));
    const body = doc.body || doc.getElementsByTagNameNS('*', 'body')[0] || doc.documentElement;
    const first = blocks.length;
    docStart.set(item.path, first);
    htmlToBlocks(body, { blocks, anchors, anchorPrefix: item.path });
    if (blocks.length > first) blocks[first].brk = 1;
  }

  // Table of contents: EPUB 3 nav document, else EPUB 2 NCX, else headings.
  let toc = [];
  const navItem = [...manifest.values()].find((m) => m.props.includes('nav'));
  const ncxItem = manifest.get(spineEl && spineEl.getAttribute('toc')) || [...manifest.values()].find((m) => m.type === 'application/x-dtbncx+xml');
  const locate = (path, href) => {
    const target = resolvePath(path, href);
    const frag = href.includes('#') ? href.slice(href.indexOf('#') + 1) : '';
    let decodedFrag = frag;
    try {
      decodedFrag = decodeURIComponent(frag);
    } catch {
      /* ignore */
    }
    if (frag && anchors.has(`${target}#${decodedFrag}`)) return anchors.get(`${target}#${decodedFrag}`);
    return docStart.has(target) ? docStart.get(target) : -1;
  };
  try {
    if (navItem && zip.has(navItem.path)) toc = parseNav(parseMarkup(await zip.readText(navItem.path), true), navItem.path, locate);
    if (!toc.length && ncxItem && zip.has(ncxItem.path)) toc = parseNcx(xml(await zip.readText(ncxItem.path)), ncxItem.path, locate);
  } catch {
    toc = [];
  }
  toc = toc.filter((t) => t.block >= 0 && t.block < blocks.length);
  if (!toc.length) toc = headingToc(blocks);

  // Cover image.
  let cover = null;
  try {
    const coverMetaId = byTag(opf, 'meta').find((m) => m.getAttribute('name') === 'cover');
    const coverItem =
      [...manifest.values()].find((m) => m.props.includes('cover-image')) ||
      (coverMetaId && manifest.get(coverMetaId.getAttribute('content'))) ||
      [...manifest.values()].find((m) => m.type.startsWith('image/') && /cover/i.test(m.id + m.path));
    if (coverItem && coverItem.type.startsWith('image/') && zip.has(coverItem.path)) {
      cover = await imageBytesToCover(await zip.read(coverItem.path), coverItem.type);
    }
  } catch {
    cover = null;
  }

  const book = finalizeBook({
    blocks,
    toc,
    meta: { title, author: creators.join(' & '), language, publisher, description, series, seriesIndex: Number.isFinite(seriesNum) ? seriesNum : null, format: 'epub', sourceName: opts.fileName || '' },
  });
  return { ...book, cover };
}

async function assertNoDrm(zip) {
  const drm = new ImportError(
    'This EPUB is protected by DRM (copy protection). Readalune only opens DRM-free books and does not remove DRM. ' +
      'Many stores and libraries offer DRM-free downloads.'
  );
  if (zip.has('META-INF/rights.xml')) throw drm;
  if (zip.has('META-INF/encryption.xml')) {
    const enc = xml(await zip.readText('META-INF/encryption.xml'));
    const methods = byTag(enc, 'EncryptionMethod').map((m) => m.getAttribute('Algorithm') || '');
    // Font obfuscation is not DRM: it only scrambles embedded font files.
    if (methods.some((a) => !FONT_OBFUSCATION.has(a))) throw drm;
  }
}

function parseNav(doc, navPath, locate) {
  const navs = byTag(doc, 'nav');
  const tocNav =
    navs.find((n) => /\btoc\b/.test(n.getAttribute('epub:type') || n.getAttributeNS('http://www.idpf.org/2007/ops', 'type') || '')) ||
    navs[0];
  if (!tocNav) return [];
  const out = [];
  const walkList = (ol, level) => {
    for (const li of Array.from(ol.children)) {
      if ((li.localName || '').toLowerCase() !== 'li') continue;
      const a = Array.from(li.children).find((c) => /^(a|span)$/i.test(c.localName));
      if (a) {
        const href = a.getAttribute('href');
        const title = a.textContent.replace(/\s+/g, ' ').trim();
        if (href && title) out.push({ title, block: locate(navPath, href), level });
      }
      const sub = Array.from(li.children).find((c) => /^ol$/i.test(c.localName));
      if (sub && level < 5) walkList(sub, level + 1);
    }
  };
  const root = Array.from(tocNav.children).find((c) => /^ol$/i.test(c.localName));
  if (root) walkList(root, 0);
  return out;
}

function parseNcx(doc, ncxPath, locate) {
  const out = [];
  const navMap = byTag(doc, 'navMap')[0];
  if (!navMap) return out;
  const walk = (parent, level) => {
    for (const point of Array.from(parent.children)) {
      if (point.localName !== 'navPoint') continue;
      const label = byTag(point, 'text')[0];
      const content = Array.from(point.children).find((c) => c.localName === 'content');
      const href = content && content.getAttribute('src');
      const title = label ? label.textContent.replace(/\s+/g, ' ').trim() : '';
      if (href && title) out.push({ title, block: locate(ncxPath, href), level });
      if (level < 5) walk(point, level + 1);
    }
  };
  walk(navMap, 0);
  return out;
}
