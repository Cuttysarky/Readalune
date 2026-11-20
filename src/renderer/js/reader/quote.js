/**
 * Renders a highlighted passage as a shareable quote image (PNG), drawn on a
 * canvas in the current page theme. Only the passage the reader selected and
 * the book's title/author are included.
 */
import { THEMES, FONTS } from '../settings.js';

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function renderQuoteImage({ text, title, author, theme, font }) {
  const t = THEMES.find((x) => x.id === theme) || THEMES[1];
  const f = (FONTS.find((x) => x.id === font) || FONTS[0]).stack;
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  // Quote marks and a thin accent rule.
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.18;
  ctx.font = `bold 260px ${f}`;
  ctx.fillText('\u201c', 70, 300);
  ctx.globalAlpha = 1;
  const quote = text.length > 600 ? `${text.slice(0, 600).replace(/\s+\S*$/, '')}\u2026` : text;
  let size = 54;
  let lines;
  for (; size >= 26; size -= 2) {
    ctx.font = `${size}px ${f}`;
    lines = wrapLines(ctx, quote, W - 220);
    if (lines.length * size * 1.45 < H - 420) break;
  }
  ctx.fillStyle = t.fg;
  ctx.font = `${size}px ${f}`;
  const lineH = size * 1.45;
  let y = (H - lines.length * lineH) / 2 - 40 + size;
  for (const line of lines) {
    ctx.fillText(line, 110, y);
    y += lineH;
  }
  ctx.fillStyle = t.accent;
  ctx.fillRect(110, y + 20, 80, 4);
  ctx.fillStyle = t.fg;
  ctx.font = `600 32px ${f}`;
  ctx.fillText(title.length > 48 ? `${title.slice(0, 47)}\u2026` : title, 110, y + 80);
  if (author) {
    ctx.fillStyle = t.muted;
    ctx.font = `28px ${f}`;
    ctx.fillText(author.length > 56 ? `${author.slice(0, 55)}\u2026` : author, 110, y + 124);
  }
  ctx.fillStyle = t.muted;
  ctx.font = '22px system-ui, sans-serif';
  ctx.globalAlpha = 0.7;
  ctx.fillText('Readalune', W - 220, H - 60);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}
