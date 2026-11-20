/** Export highlights, notes and bookmarks as Markdown. */
import { chapterAt, positionOf } from './core/book.js';

const COLOR_NAMES = { yellow: 'Yellow', blue: 'Blue', pink: 'Pink', orange: 'Orange', green: 'Green' };

export function notesToMarkdown(meta, book, state) {
  const lines = [];
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  lines.push(`# ${meta.title}`);
  if (meta.author) lines.push(`*${meta.author}*`);
  lines.push('', `Notes and highlights exported from Readalune on ${date}.`, '');

  const highlights = [...(state.highlights || [])].sort((a, b) => a.s - b.s);
  const bookmarks = [...(state.bookmarks || [])].sort((a, b) => a.o - b.o);
  if (!highlights.length && !bookmarks.length) {
    lines.push('_No highlights, notes or bookmarks yet._');
    return lines.join('\n') + '\n';
  }

  let lastChapter = null;
  for (const h of highlights) {
    const chapter = chapterAt(book, h.s);
    const title = chapter ? chapter.title : '';
    if (title !== lastChapter) {
      lines.push(`## ${title || 'Beginning'}`, '');
      lastChapter = title;
    }
    const quote = (h.text || '').split('\n').map((l) => `> ${l}`).join('\n');
    // A blank line ends the quote; without it Markdown reads the next line as part of it.
    lines.push(quote, '');
    const pct = Math.round((h.s / book.total) * 100);
    lines.push(`\u2014 ${COLOR_NAMES[h.c] || 'Highlight'} highlight \u00b7 Position ${positionOf(h.s)} \u00b7 ${pct}% \u00b7 ${new Date(h.at).toLocaleDateString()}`);
    if (h.note) lines.push('', `**Note:** ${h.note}`);
    lines.push('');
  }

  if (bookmarks.length) {
    lines.push('## Bookmarks', '');
    for (const b of bookmarks) {
      const pct = Math.round((b.o / book.total) * 100);
      const chapter = chapterAt(book, b.o);
      lines.push(`- Position ${positionOf(b.o)} (${pct}%)${chapter ? ` \u2014 ${chapter.title}` : ''}: "${(b.text || '').trim()}\u2026"`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function safeFileName(title) {
  return (
    String(title || 'notes')
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'notes'
  );
}

/** Highlights, notes and bookmarks as structured JSON (the data model's Annotation records). */
export function notesToJson(meta, book, state) {
  const annotations = [
    ...(state.highlights || []).map((h) => ({
      id: h.id,
      bookId: meta.id,
      type: h.note ? 'note' : 'highlight',
      color: h.c,
      range: { start: h.s, end: h.e },
      chapter: chapterAt(book, h.s)?.title || '',
      percent: Math.round((h.s / book.total) * 1000) / 10,
      text: h.text,
      note: h.note || '',
      createdAt: new Date(h.at).toISOString(),
      updatedAt: new Date(h.updatedAt || h.at).toISOString(),
    })),
    ...(state.bookmarks || []).map((b) => ({
      id: b.id,
      bookId: meta.id,
      type: 'bookmark',
      color: null,
      range: { start: b.o, end: b.o },
      chapter: chapterAt(book, b.o)?.title || '',
      percent: Math.round((b.o / book.total) * 1000) / 10,
      text: b.text || '',
      note: '',
      createdAt: new Date(b.at).toISOString(),
      updatedAt: new Date(b.at).toISOString(),
    })),
  ].sort((a, b) => a.range.start - b.range.start);
  return JSON.stringify({ book: { id: meta.id, title: meta.title, author: meta.author }, exportedAt: new Date().toISOString(), annotations }, null, 2) + '\n';
}

export function notesToCsv(meta, book, state) {
  const esc = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows = [['type', 'color', 'chapter', 'percent', 'text', 'note', 'created']];
  for (const a of JSON.parse(notesToJson(meta, book, state)).annotations) rows.push([a.type, a.color || '', a.chapter, a.percent, a.text, a.note, a.createdAt.slice(0, 10)]);
  return rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
}

/** Ask for a format and save the notes of one book. */
export async function exportNotesDialog(meta, book, state) {
  const { modal, h, toast } = await import('./ui/dom.js');
  const format = await modal({
    title: 'Export notes',
    build: (body, close) => {
      body.append(
        h('p.muted', { text: `Highlights, notes and bookmarks from \u201c${meta.title}\u201d.` }),
        h(
          'div.status-picks',
          null,
          h('button.btn.primary', { onclick: () => close('md') }, 'Markdown (.md)'),
          h('button.btn', { onclick: () => close('json') }, 'JSON (.json)'),
          h('button.btn', { onclick: () => close('csv') }, 'Spreadsheet (.csv)')
        )
      );
    },
  });
  if (!format) return false;
  const text = format === 'json' ? notesToJson(meta, book, state) : format === 'csv' ? notesToCsv(meta, book, state) : notesToMarkdown(meta, book, state);
  const ok = await window.readalune.exportText(`${safeFileName(meta.title)} - notes.${format}`, text);
  if (ok) toast('Notes exported');
  return ok;
}
