/**
 * Read-aloud using the operating system's speech voices (Web Speech API).
 * Speech is generated locally by the OS; Readalune sends no text anywhere.
 */

/** Split text into sentence-sized chunks with their offsets. */
export function sentences(text, base = 0) {
  const out = [];
  const re = /[^.!?\u2026\n]+(?:[.!?\u2026]+["'\u201d\u2019)\]]*|\n|$)/g;
  let m;
  while ((m = re.exec(text))) {
    if (!m[0]) {
      re.lastIndex++;
      continue;
    }
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (t) out.push({ text: t, start: base + m.index + lead, end: base + m.index + lead + t.length });
    if (re.lastIndex >= text.length) break;
  }
  // Very long "sentences" are split so speech engines do not stall.
  const result = [];
  for (const s of out) {
    if (s.text.length <= 280) {
      result.push(s);
      continue;
    }
    let start = 0;
    while (start < s.text.length) {
      let end = Math.min(s.text.length, start + 240);
      if (end < s.text.length) {
        const cut = s.text.lastIndexOf(' ', end);
        if (cut > start + 60) end = cut;
      }
      result.push({ text: s.text.slice(start, end).trim(), start: s.start + start, end: s.start + end });
      start = end;
    }
  }
  return result.filter((s) => s.text);
}

export class Speaker {
  constructor({ book, onSentence, onStop }) {
    this.book = book;
    this.onSentence = onSentence;
    this.onStop = onStop;
    this.queue = [];
    this.blockIndex = 0;
    this.playing = false;
    this.paused = false;
    this.rate = 1;
    this.voiceName = '';
    this.token = 0;
  }

  static available() {
    return typeof window.speechSynthesis !== 'undefined';
  }

  static voices() {
    return Speaker.available() ? window.speechSynthesis.getVoices() : [];
  }

  start(offset) {
    this.stop(false);
    this.playing = true;
    this.paused = false;
    const starts = this.book.starts;
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= offset) i++;
    this.blockIndex = i;
    this.queue = sentences(this.book.blocks[i].x, starts[i]).filter((s) => s.end > offset);
    this.token++;
    this.next(this.token);
  }

  next(token) {
    if (!this.playing || token !== this.token) return;
    while (!this.queue.length) {
      this.blockIndex++;
      if (this.blockIndex >= this.book.blocks.length) {
        this.stop(true);
        return;
      }
      const b = this.book.blocks[this.blockIndex];
      if (b.t !== 'hr' && b.t !== 'pre') this.queue = sentences(b.x, this.book.starts[this.blockIndex]);
    }
    const s = this.queue.shift();
    const u = new SpeechSynthesisUtterance(s.text);
    u.rate = this.rate;
    const voice = Speaker.voices().find((v) => v.name === this.voiceName);
    if (voice) u.voice = voice;
    else if (this.book.language) u.lang = this.book.language;
    u.onend = () => this.next(token);
    u.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      this.stop(true);
    };
    this.onSentence?.(s);
    window.speechSynthesis.speak(u);
  }

  pause() {
    if (!this.playing) return;
    this.paused = true;
    window.speechSynthesis.pause();
  }

  resume() {
    if (!this.playing) return;
    this.paused = false;
    window.speechSynthesis.resume();
  }

  stop(notify = true) {
    const was = this.playing;
    this.playing = false;
    this.paused = false;
    this.token++;
    this.queue = [];
    if (Speaker.available()) window.speechSynthesis.cancel();
    if (notify && was) this.onStop?.();
  }

  setRate(rate) {
    this.rate = rate;
  }
}
