/**
 * Synthetic test books. All text here is generated or written for these
 * tests - no third-party copyrighted material.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeZip } from './zip.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- prose */

const WORDS = 'the a lantern harbor river quiet morning evening garden letter window stone bridge village keeper storm candle orchard path meadow tower clock bell song silver winter summer slowly gently suddenly carefully walked waited watched remembered wondered listened opened closed followed carried found lost kept told asked answered smiled laughed old young small bright dark warm cold distant near hidden open and but while because although when after before through across under over beside toward within'.split(' ');

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function sentence(r) {
  const n = 6 + Math.floor(r() * 14);
  const w = [];
  for (let i = 0; i < n; i++) w.push(WORDS[Math.floor(r() * WORDS.length)]);
  const s = w.join(' ');
  return s[0].toUpperCase() + s.slice(1) + (r() < 0.1 ? '?' : '.');
}

export function paragraph(r, sentences = 4 + Math.floor(r() * 5)) {
  const out = [];
  for (let i = 0; i < sentences; i++) out.push(sentence(r));
  return out.join(' ');
}

function wrap(text, width = 70) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/** A hard-wrapped plain-text "e-text" with a contents list and 12 chapters. */
export function makeLongText(chapters = 12, parasPerChapter = 18) {
  const r = rng(42);
  const out = ['The Keeper of Quiet Harbors', '', 'by Imaginary Author', '', '', 'CONTENTS', ''];
  for (let c = 1; c <= chapters; c++) out.push(`CHAPTER ${roman(c)}. The ${WORDS[(c * 7) % WORDS.length]} ${WORDS[(c * 11) % WORDS.length]}`);
  out.push('', '', '');
  for (let c = 1; c <= chapters; c++) {
    out.push(`CHAPTER ${roman(c)}.`, `The ${WORDS[(c * 7) % WORDS.length]} ${WORDS[(c * 11) % WORDS.length]}`, '', '');
    for (let p = 0; p < parasPerChapter; p++) {
      out.push(...wrap(paragraph(r)), '');
    }
    out.push('', '');
  }
  return out.join('\n');
}

function roman(n) {
  const map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, l] of map) while (n >= v) (s += l), (n -= v);
  return s;
}

export const MARKDOWN = `---
title: Field Notes on Lanterns
author: Test Writer
---

# Field Notes on Lanterns

## Morning

The **first** light arrives *slowly* over the harbor. Some \`code\` and a [link](https://example.invalid) that must not load.

- one lantern
- two lanterns

1. trim the wick
2. light it

> A quoted line of wisdom.

## Evening

${paragraph(rng(7), 30)}

${paragraph(rng(8), 30)}
`;

export const HTML = `<!doctype html>
<html lang="en"><head><title>The HTML Almanac</title><meta name="author" content="Web Author">
<script>window.__pwned = 'script';</script></head>
<body>
<h1>The HTML Almanac</h1>
<h2>Spring</h2>
<p>Seeds go in when the <em>soil</em> is warm. <img src="https://example.invalid/x.png" onerror="window.__pwned='img'"> Water <strong>gently</strong>.</p>
<h2>Summer</h2>
<p>${paragraph(rng(9), 20)}</p>
<ul><li>Tomatoes</li><li>Beans</li></ul>
<iframe src="https://example.invalid/"></iframe>
</body></html>`;

/* ---------------------------------------------------------------- epub */

export function makeEpub({ drm = false } = {}) {
  const cover = fs.readFileSync(path.join(here, '../../src/renderer/assets/icon.png'));
  const chapter = (n, title, body) => `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><title>${title}</title><link rel="stylesheet" href="style.css"/></head>
<body><section epub:type="chapter"><h1>${title}</h1>${body}</section></body></html>`;
  const r = rng(99);
  const files = [
    { name: 'mimetype', data: 'application/epub+zip', store: true },
    {
      name: 'META-INF/container.xml',
      data: `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
    },
    {
      name: 'OEBPS/content.opf',
      data: `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="id">urn:uuid:test-glass-orchard</dc:identifier>
<dc:title>The Glass Orchard</dc:title><dc:creator>Test Author</dc:creator><dc:language>en</dc:language>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="c1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>
<item id="c2" href="text/ch2.xhtml" media-type="application/xhtml+xml"/>
<item id="c3" href="text/ch3.xhtml" media-type="application/xhtml+xml"/>
<item id="css" href="text/style.css" media-type="text/css"/>
<item id="cover" href="images/cover.png" media-type="image/png" properties="cover-image"/>
</manifest>
<spine toc="ncx"><itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/></spine>
</package>`,
    },
    {
      name: 'OEBPS/nav.xhtml',
      data: `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body>
<nav epub:type="toc"><ol>
<li><a href="text/ch1.xhtml">One: Planting</a></li>
<li><a href="text/ch2.xhtml">Two: Glass</a><ol><li><a href="text/ch2.xhtml#scene2">The Second Scene</a></li></ol></li>
<li><a href="text/ch3.xhtml">Three: Harvest</a></li>
</ol></nav></body></html>`,
    },
    { name: 'OEBPS/toc.ncx', data: `<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><navMap><navPoint id="n1"><navLabel><text>NCX One</text></navLabel><content src="text/ch1.xhtml"/></navPoint></navMap></ncx>` },
    { name: 'OEBPS/text/style.css', data: 'p { text-indent: 1em; }' },
    { name: 'OEBPS/images/cover.png', data: cover, store: true },
    {
      name: 'OEBPS/text/ch1.xhtml',
      data: chapter(1, 'One: Planting', `<p>The orchard was made of <em>glass</em> and <strong>patience</strong>.</p><script>window.__pwned='epub'</script><p>${paragraph(r, 12)}</p><blockquote><p>Plant in spring.</p></blockquote><ol><li>Dig</li><li>Plant</li></ol><p>${paragraph(r, 12)}</p>`),
    },
    {
      // Uses an HTML entity that is undefined in XML, exercising the HTML-parser fallback.
      name: 'OEBPS/text/ch2.xhtml',
      data: chapter(2, 'Two: Glass', `<p>Glass&nbsp;trees chime in the wind. ${paragraph(r, 10)}</p><h2 id="scene2">The Second Scene</h2><p>${paragraph(r, 14)}</p>`),
    },
    { name: 'OEBPS/text/ch3.xhtml', data: chapter(3, 'Three: Harvest', `<p>${paragraph(r, 16)}</p><p>The end of the harvest.</p>`) },
  ];
  if (drm) {
    files.splice(2, 0, {
      name: 'META-INF/encryption.xml',
      data: `<?xml version="1.0"?><encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#"><enc:EncryptedData><enc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/><enc:CipherData><enc:CipherReference URI="OEBPS/text/ch1.xhtml"/></enc:CipherData></enc:EncryptedData></encryption>`,
    });
  }
  return makeZip(files);
}

/* ---------------------------------------------------------------- pdf */

function pdfEsc(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * A small multi-page PDF with a running header, page numbers, chapter
 * headings in a larger font, an outline, and a word hyphenated across lines.
 */
export function makePdf() {
  const r = rng(5);
  const pages = [];
  const outline = [];
  const chapters = ['Getting Started', 'Working Carefully', 'Finishing Well'];
  for (let c = 0; c < chapters.length; c++) {
    for (let half = 0; half < 2; half++) {
      const lines = [];
      lines.push({ text: 'THE TEST MANUAL', size: 9, x: 72, y: 760, font: 'F1' });
      let y = 700;
      if (half === 0) {
        outline.push({ title: chapters[c], page: pages.length });
        lines.push({ text: `${c + 1}. ${chapters[c]}`, size: 20, x: 72, y, font: 'F2' });
        y -= 40;
      }
      for (let p = 0; p < 4; p++) {
        const text = paragraph(r, 5);
        const wrapped = wrap(text, 84);
        if (c === 0 && half === 0 && p === 0) {
          wrapped[0] = `${wrapped[0]} exam-`;
          wrapped[1] = `ple ${wrapped[1]}`;
        }
        wrapped.forEach((t, i) => {
          lines.push({ text: t, size: 11, x: i === 0 ? 90 : 72, y, font: 'F1' });
          y -= 14;
        });
        y -= 10;
      }
      lines.push({ text: String(pages.length + 1), size: 9, x: 300, y: 40, font: 'F1' });
      pages.push(lines);
    }
  }

  const objs = [];
  const add = (body) => {
    objs.push(body);
    return objs.length;
  };
  const catalog = add(null);
  const pagesObj = add(null);
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds = [];
  for (const lines of pages) {
    const stream = lines.map((l) => `BT /${l.font} ${l.size} Tf ${l.x} ${l.y} Td (${pdfEsc(l.text)}) Tj ET`).join('\n');
    const content = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  objs[pagesObj - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const outlinesId = add(null);
  const itemIds = outline.map(() => add(null));
  outline.forEach((o, i) => {
    const prev = i > 0 ? ` /Prev ${itemIds[i - 1]} 0 R` : '';
    const next = i < outline.length - 1 ? ` /Next ${itemIds[i + 1]} 0 R` : '';
    objs[itemIds[i] - 1] = `<< /Title (${pdfEsc(o.title)}) /Parent ${outlinesId} 0 R${prev}${next} /Dest [${pageIds[o.page]} 0 R /XYZ 0 792 0] >>`;
  });
  objs[outlinesId - 1] = `<< /Type /Outlines /First ${itemIds[0]} 0 R /Last ${itemIds[itemIds.length - 1]} 0 R /Count ${itemIds.length} >>`;
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R /Outlines ${outlinesId} 0 R /PageMode /UseOutlines >>`;
  const info = add('<< /Title (The Test Manual) /Author (Manual Writer) >>');

  let pdf = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

/** A small CBZ comic: six pages (the app logo) plus ComicInfo.xml marking it right-to-left. */
export function makeCbz() {
  const img = fs.readFileSync(path.join(here, '../../src/renderer/assets/icon.png'));
  const pages = Array.from({ length: 6 }, (_, i) => ({ name: `pages/page ${i + 1}.png`, data: img, store: true }));
  const info = `<?xml version="1.0"?><ComicInfo><Title>Moon Harbor</Title><Series>Lantern Tales</Series><Number>2</Number><Writer>Test Writer</Writer><Summary>A test comic.</Summary><Manga>YesAndRightToLeft</Manga></ComicInfo>`;
  // Out of order on purpose: pages must be sorted naturally ("page 2" before "page 10").
  return makeZip([{ name: 'ComicInfo.xml', data: info }, ...pages.reverse()]);
}
