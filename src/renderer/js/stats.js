/**
 * Reading statistics, stored only on this computer.
 *   daily: { 'YYYY-MM-DD': seconds }
 *   cpm: measured reading speed in characters per minute
 *   finished: [{ id, title, author, at }]
 */
import { debounce } from './ui/dom.js';

const DEFAULT_CPM = 1400; // ~ 240 words per minute
const CHARS_PER_WORD = 5.8;

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sanitizeStats(raw) {
  const out = { daily: {}, cpm: 0, speedSamples: 0, total: 0, finished: [], sessions: [] };
  if (!raw || typeof raw !== 'object') return out;
  if (raw.daily && typeof raw.daily === 'object') {
    for (const [k, v] of Object.entries(raw.daily)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v) && v >= 0 && v < 86400 * 2) out.daily[k] = Math.round(v);
    }
  }
  if (Number.isFinite(raw.cpm) && raw.cpm >= 200 && raw.cpm <= 8000) out.cpm = raw.cpm;
  if (Number.isInteger(raw.speedSamples) && raw.speedSamples >= 0) out.speedSamples = raw.speedSamples;
  if (Number.isFinite(raw.total) && raw.total >= 0) out.total = Math.round(raw.total);
  if (Array.isArray(raw.sessions)) {
    out.sessions = raw.sessions
      .filter((x) => x && typeof x.bookId === 'string' && Number.isFinite(x.start) && Number.isFinite(x.end) && x.end >= x.start)
      .map((x) => ({ bookId: x.bookId.slice(0, 64), start: x.start, end: x.end, percentRead: Number.isFinite(x.percentRead) ? Math.max(-1, Math.min(1, x.percentRead)) : 0 }))
      .slice(-2000);
  }
  if (Array.isArray(raw.finished)) {
    out.finished = raw.finished
      .filter((f) => f && typeof f.id === 'string' && Number.isFinite(f.at))
      .map((f) => ({ id: f.id.slice(0, 64), title: String(f.title || '').slice(0, 300), author: String(f.author || '').slice(0, 300), at: f.at }))
      .slice(-5000);
  }
  return out;
}

/** Consecutive days with reading, ending today (or yesterday). */
export function streaks(daily, today = new Date()) {
  const has = (d) => (daily[dayKey(d)] || 0) >= 60;
  let streak = 0;
  const d = new Date(today);
  if (!has(d)) d.setDate(d.getDate() - 1);
  while (has(d)) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  const keys = Object.keys(daily).filter((k) => daily[k] >= 60).sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    const cur = new Date(`${k}T12:00:00`);
    if (prev && Math.round((cur - prev) / 86400000) === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  return { streak, longest: Math.max(longest, streak) };
}

export class Stats {
  constructor(api, raw) {
    this.api = api;
    this.data = sanitizeStats(raw);
    this.saveSoon = debounce(() => this.api.setStats(this.data).catch(() => {}), 3000);
  }

  addSeconds(n) {
    const key = dayKey();
    this.data.daily[key] = (this.data.daily[key] || 0) + n;
    this.data.total += n;
    // Keep about 13 months of daily history.
    const keys = Object.keys(this.data.daily);
    if (keys.length > 400) for (const k of keys.sort().slice(0, keys.length - 400)) delete this.data.daily[k];
    this.saveSoon();
  }

  /** A reading session (ReadingSession: bookId, start, end, percent read). */
  addSession(session) {
    if (!session || session.end - session.start < 30000) return;
    this.data.sessions.push(session);
    if (this.data.sessions.length > 2000) this.data.sessions.splice(0, this.data.sessions.length - 2000);
    this.saveSoon();
  }

  recentSessions(n) {
    return this.data.sessions.slice(-n).reverse();
  }

  recordSpeed(cpm) {
    if (!Number.isFinite(cpm)) return;
    const sample = Math.min(6000, Math.max(250, cpm));
    this.data.cpm = this.data.cpm ? this.data.cpm * 0.85 + sample * 0.15 : sample;
    this.data.speedSamples++;
    this.saveSoon();
  }

  cpm() {
    return this.data.speedSamples >= 3 && this.data.cpm ? this.data.cpm : DEFAULT_CPM;
  }

  wpm() {
    return Math.max(60, Math.round(this.cpm() / CHARS_PER_WORD));
  }

  bookFinished(meta) {
    if (!meta || this.data.finished.some((f) => f.id === meta.id)) return;
    this.data.finished.push({ id: meta.id, title: meta.title, author: meta.author || '', at: Date.now() });
    this.saveSoon();
  }

  summary(now = new Date()) {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        key: dayKey(d),
        seconds: this.data.daily[dayKey(d)] || 0,
        short: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        label: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      });
    }
    const { streak, longest } = streaks(this.data.daily, now);
    const year = now.getFullYear();
    return {
      today: this.data.daily[dayKey(now)] || 0,
      week: days.slice(-7).reduce((s, d) => s + d.seconds, 0),
      days,
      streak,
      longest,
      total: this.data.total,
      finished: this.data.finished.length,
      finishedThisYear: this.data.finished.filter((f) => new Date(f.at).getFullYear() === year).length,
      wpm: this.wpm(),
      speedSamples: this.data.speedSamples,
    };
  }
}
