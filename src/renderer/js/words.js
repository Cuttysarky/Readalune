/** Word Journal: words the reader looked up, with the sentence they came from. */
import { debounce } from './ui/dom.js';

const MAX_WORDS = 5000;

export function sanitizeWords(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((w) => w && typeof w.word === 'string' && w.word.trim())
    .map((w) => ({
      id: String(w.id || '').slice(0, 64) || Math.random().toString(36).slice(2),
      word: w.word.slice(0, 80),
      context: String(w.context || '').slice(0, 600),
      bookId: String(w.bookId || '').slice(0, 64),
      bookTitle: String(w.bookTitle || '').slice(0, 300),
      at: Number.isFinite(w.at) ? w.at : Date.now(),
      count: Number.isInteger(w.count) && w.count > 0 ? w.count : 1,
      mastered: w.mastered === true,
    }))
    .slice(0, MAX_WORDS);
}

export class Words {
  constructor(api, raw) {
    this.api = api;
    this.list = sanitizeWords(raw);
    this.saveSoon = debounce(() => this.api.setWords(this.list).catch(() => {}), 800);
  }

  add({ word, context, bookId, bookTitle }) {
    const key = word.toLowerCase();
    const existing = this.list.find((w) => w.word.toLowerCase() === key && w.bookId === bookId);
    if (existing) {
      existing.count++;
      existing.at = Date.now();
      if (context) existing.context = context;
      this.list = [existing, ...this.list.filter((w) => w !== existing)];
    } else {
      this.list.unshift({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, word, context: context || '', bookId, bookTitle, at: Date.now(), count: 1, mastered: false });
      if (this.list.length > MAX_WORDS) this.list.length = MAX_WORDS;
    }
    this.saveSoon();
  }

  setMastered(id, mastered) {
    const w = this.list.find((x) => x.id === id);
    if (w) w.mastered = Boolean(mastered);
    this.saveSoon();
  }

  remove(id) {
    this.list = this.list.filter((w) => w.id !== id);
    this.saveSoon();
  }

  toCsv() {
    const esc = (v) => {
      let s = String(v ?? '');
      // Prevent spreadsheet formula injection when the CSV is opened in a spreadsheet app.
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = [['word', 'context', 'book', 'date', 'times saved', 'learned']];
    for (const w of this.list) rows.push([w.word, w.context, w.bookTitle, new Date(w.at).toISOString().slice(0, 10), w.count, w.mastered ? 'yes' : 'no']);
    return rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
  }
}
