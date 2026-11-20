/**
 * Turns positioned PDF text fragments into reflowable paragraphs.
 * Pure functions (no pdf.js, no DOM) so they can be unit-tested.
 *
 * Input: pages = [{ page: 1, items: [{ str, x, y, w, size, eol }] }]
 * PDF y coordinates grow upwards.
 */

const TERMINAL = /[.!?:;\u2026"'\u201d\u2019)\]]$/;

const SPACED_LETTERS = /^\p{L}(?: \p{L})*$/u;

/**
 * Letter-spaced text ("E L E N A   H A R T L E Y") arrives as single letters set
 * apart by spaces or small gaps, with a wider gap between words. Returns the line
 * as ordinary words ("ELENA HARTLEY"), or null if the line is not set that way or
 * its word breaks cannot be told apart.
 * @param {Array<{str:string, x:number, xEnd:number, size:number}>} pieces the line's text items, in order
 */
export function joinSpacedLetters(pieces) {
  // Runs of letters, each with the gap that came before it (Infinity: a known word break).
  const runs = [];
  let prev = null;
  let blank = false;
  for (const piece of pieces) {
    const str = piece.str.trim();
    if (!str) {
      blank = true;
      continue;
    }
    const chunks = str.split(/ {2,}/);
    if (!chunks.every((c) => SPACED_LETTERS.test(c))) return null;
    const lone = chunks.length === 1 && chunks[0].length === 1;
    // Between two lone letters the gap decides; a blank item or a longer item is a word break.
    const gap = prev && !blank && lone && prev.lone ? piece.x - prev.xEnd : Infinity;
    chunks.forEach((c, i) => runs.push({ text: c.replace(/ /g, ''), gap: i ? Infinity : gap, size: piece.size }));
    prev = { xEnd: piece.xEnd, lone };
    blank = false;
  }
  // One run in a single item ("C O N T E N T S") may be one word or several: leave it alone.
  if (runs.length < 2) return null;
  const gaps = runs.map((r) => r.gap).filter(Number.isFinite);
  const usual = median(gaps);
  // Lone letters must be set apart, but only slightly: touching letters are ordinary text, far ones a table.
  if (gaps.length && (usual <= runs[0].size * 0.18 || usual > runs[0].size * 0.75)) return null;
  const words = [];
  for (const run of runs) {
    const wordBreak = !words.length || run.gap === Infinity || run.gap > usual * 1.7;
    if (wordBreak) words.push(run.text);
    else words[words.length - 1] += run.text;
  }
  const letters = words.reduce((n, w) => n + w.length, 0);
  if (letters < 4 || !words.some((w) => w.length >= 3)) return null;
  return words.join(' ');
}

/** Group text items into visual lines. */
export function itemsToLines(items) {
  const lines = [];
  let line = null;
  const finish = () => {
    if (line) {
      line.text = (joinSpacedLetters(line.pieces) || line.text).replace(/\s+/g, ' ').trim();
      delete line.pieces;
      if (line.text) lines.push(line);
    }
    line = null;
  };
  for (const it of items) {
    const str = it.str || '';
    const size = it.size > 0 ? it.size : 10;
    if (!str) {
      if (it.eol) finish();
      continue;
    }
    if (line) {
      const sameRow = Math.abs(it.y - line.y) <= Math.max(line.size, size) * 0.45;
      const gap = it.x - line.xEnd;
      if (!sameRow || gap < -size * 1.5 || gap > size * 12) finish();
    }
    const piece = { str, x: it.x, xEnd: it.x + (it.w || 0), size };
    if (!line) {
      line = { text: str, x: it.x, xEnd: it.x + (it.w || 0), y: it.y, size, chars: str.length, sizeSum: size * str.length, pieces: [piece] };
    } else {
      line.pieces.push(piece);
      const gap = it.x - line.xEnd;
      const needsSpace = gap > size * 0.18 && !/\s$/.test(line.text) && !/^\s/.test(str);
      line.text += (needsSpace ? ' ' : '') + str;
      line.xEnd = Math.max(line.xEnd, it.x + (it.w || 0));
      line.sizeSum += size * str.length;
      line.chars += str.length;
      line.size = line.sizeSum / line.chars;
    }
    if (it.eol) finish();
  }
  finish();
  return lines;
}

function median(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function percentile(values, p) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
}

const PAGE_NUMBER_RE = /^(?:page\s*)?[-\u2013\u2014\s]*(?:#|[ivxlcdm]{1,7})[-\u2013\u2014\s]*(?:(?:of|\/)\s*#)?$/i;

/** Remove running headers/footers and page numbers that repeat on many pages. */
export function stripRunningHeaders(pages) {
  const key = (t) => t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const counts = new Map();
  const edgeLines = (lines) => {
    if (lines.length <= 2) return lines;
    const byY = [...lines].sort((a, b) => b.y - a.y);
    return [byY[0], byY[1], byY[byY.length - 2], byY[byY.length - 1]];
  };
  for (const p of pages) {
    const seen = new Set();
    for (const l of edgeLines(p.lines)) {
      const k = key(l.text);
      if (seen.has(k)) continue;
      seen.add(k);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.3));
  for (const p of pages) {
    const edges = new Set(edgeLines(p.lines));
    p.lines = p.lines.filter((l) => {
      if (!edges.has(l)) return true;
      const k = key(l.text);
      if (PAGE_NUMBER_RE.test(k) && l.text.length <= 14) return false;
      return !(pages.length >= 4 && (counts.get(k) || 0) >= threshold && l.text.length < 120);
    });
  }
  return pages;
}

/**
 * Lay out all pages into blocks.
 * @param {Array<{page:number, items:any[]}>} rawPages
 */
export function layoutPdf(rawPages) {
  const pages = rawPages.map((p) => ({ page: p.page, lines: itemsToLines(p.items) }));
  stripRunningHeaders(pages);

  // Body text size = the size used by most characters.
  const sizeChars = new Map();
  for (const p of pages)
    for (const l of p.lines) {
      const s = Math.round(l.size * 2) / 2;
      sizeChars.set(s, (sizeChars.get(s) || 0) + l.text.length);
    }
  let body = 10;
  let best = -1;
  for (const [s, c] of sizeChars)
    if (c > best) {
      best = c;
      body = s;
    }

  // Typical line spacing, left margin and right edge of body text.
  const gaps = [];
  for (const p of pages) {
    for (let i = 1; i < p.lines.length; i++) {
      const a = p.lines[i - 1];
      const b = p.lines[i];
      if (Math.abs(a.size - body) < body * 0.15 && Math.abs(b.size - body) < body * 0.15) {
        const g = a.y - b.y;
        if (g > 0 && g < body * 4) gaps.push(g);
      }
    }
    const bodyLines = p.lines.filter((l) => Math.abs(l.size - body) < body * 0.15);
    p.left = percentile(bodyLines.map((l) => l.x), 0.2);
    p.right = percentile(bodyLines.map((l) => l.xEnd), 0.8);
  }
  const lineGap = median(gaps) || body * 1.25;

  const blocks = [];
  let cur = null;
  let prev = null;
  const flush = () => {
    if (cur && cur.x.trim()) blocks.push(cur);
    cur = null;
  };
  const headingType = (size) => (size >= body * 1.75 ? 'h1' : size >= body * 1.35 ? 'h2' : 'h3');

  for (const p of pages) {
    for (const line of p.lines) {
      const isHeading = line.size >= body * 1.2 && line.text.length <= 140 && /\p{L}.*\p{L}/u.test(line.text);
      let newBlock = !cur;
      if (cur && prev) {
        const samePage = prev.page === p.page;
        const gap = prev.line.y - line.y;
        const sizeJump = Math.abs(line.size - prev.line.size) > body * 0.15;
        if (sizeJump || isHeading !== prev.heading) newBlock = true;
        else if (isHeading) {
          // Consecutive heading lines of the same size form one heading.
          newBlock = !samePage || gap > line.size * 2;
        } else if (!samePage || gap < 0) {
          // Page or column change: continue only mid-sentence.
          newBlock = TERMINAL.test(prev.line.text) && !/^\p{Ll}/u.test(line.text);
        } else if (gap > lineGap * 1.55) newBlock = true;
        else if (line.x - p.left > body * 1.1 && prev.line.x - p.left < body * 0.6 && TERMINAL.test(prev.line.text)) newBlock = true;
        // A clearly short line ending a sentence closes a paragraph (ragged-right
        // text needs a generous threshold so ordinary short lines don't split).
        else if (prev.line.xEnd < p.right - Math.max(body * 4, (p.right - p.left) * 0.18) && TERMINAL.test(prev.line.text)) newBlock = true;
      }
      if (newBlock) {
        flush();
        cur = { t: isHeading ? headingType(line.size) : 'p', x: line.text, pg: p.page };
      } else {
        cur.x = joinPdfLines(cur.x, line.text);
      }
      prev = { line, page: p.page, heading: isHeading };
    }
  }
  flush();
  return { blocks, bodySize: body };
}

/** Join two lines, repairing words hyphenated across the line break. */
export function joinPdfLines(a, b) {
  if (/\u00ad$/.test(a)) return a.slice(0, -1) + b;
  if (/\p{Ll}-$/u.test(a) && /^\p{Ll}/u.test(b)) return a.slice(0, -1) + b;
  if (/[-\u2014\u2013/]$/.test(a)) return a + b;
  return `${a} ${b}`;
}

/** Map outline entries ({ title, page, level }) onto block indices. */
export function outlineToToc(blocks, outline) {
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const toc = [];
  for (const entry of outline) {
    if (!entry.page) continue;
    let target = -1;
    const want = norm(entry.title).slice(0, 24);
    for (let i = 0; i < blocks.length; i++) {
      const pg = blocks[i].pg || 0;
      if (pg < entry.page) continue;
      if (pg > entry.page) break;
      if (want && norm(blocks[i].x).startsWith(want.slice(0, Math.min(want.length, 12)))) {
        target = i;
        break;
      }
    }
    if (target < 0) target = blocks.findIndex((b) => (b.pg || 0) >= entry.page);
    if (target >= 0) toc.push({ title: entry.title, block: target, level: entry.level });
  }
  return toc;
}
