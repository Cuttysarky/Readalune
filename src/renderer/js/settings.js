/**
 * Reading preferences: defaults, choices and how they map onto CSS.
 * Only fonts already installed on the computer are used, so no font files
 * (and no font licences) are bundled.
 */

export const THEMES = [
  { id: 'day', name: 'Day', bg: '#ffffff', fg: '#1d1d1f', muted: '#6e6e73', accent: '#3b6fd9', ui: 'light' },
  { id: 'paper', name: 'Paper', bg: '#f5eddc', fg: '#3a2f23', muted: '#86745e', accent: '#a0612b', ui: 'light' },
  { id: 'sage', name: 'Sage', bg: '#e3ecdf', fg: '#24301f', muted: '#5d6e57', accent: '#3f7a4a', ui: 'light' },
  { id: 'dusk', name: 'Dusk', bg: '#3a3a3f', fg: '#e8e6e1', muted: '#a4a29d', accent: '#9cb7ff', ui: 'dark' },
  { id: 'night', name: 'Night', bg: '#17161c', fg: '#d3d0c8', muted: '#8d8a84', accent: '#9cb7ff', ui: 'dark' },
  { id: 'midnight', name: 'Midnight', bg: '#000000', fg: '#b9b6ae', muted: '#77746e', accent: '#86a3ee', ui: 'dark' },
];

export const FONTS = [
  { id: 'serif', name: 'Classic serif', stack: "Georgia, 'Iowan Old Style', 'Charter', 'Cambria', 'Noto Serif', 'DejaVu Serif', serif" },
  { id: 'book', name: 'Book', stack: "'Palatino Linotype', Palatino, 'Book Antiqua', 'URW Palladio L', 'P052', 'TeX Gyre Pagella', serif" },
  { id: 'modern', name: 'Modern serif', stack: "'Hoefler Text', 'Baskerville', 'Libre Baskerville', 'Constantia', 'Liberation Serif', 'Times New Roman', serif" },
  { id: 'sans', name: 'Sans', stack: "system-ui, -apple-system, 'Segoe UI', 'Noto Sans', Roboto, 'Helvetica Neue', Arial, sans-serif" },
  { id: 'humanist', name: 'Humanist sans', stack: "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', 'Source Sans Pro', 'Ubuntu', sans-serif" },
  { id: 'legible', name: 'High legibility', stack: "Verdana, 'Atkinson Hyperlegible', 'Lexend', 'DejaVu Sans', 'Tahoma', sans-serif" },
  { id: 'mono', name: 'Monospace', stack: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace" },
];

export const SPACING = [
  { id: 'tight', name: 'Compact', value: 1.3 },
  { id: 'normal', name: 'Normal', value: 1.5 },
  { id: 'relaxed', name: 'Relaxed', value: 1.7 },
  { id: 'airy', name: 'Airy', value: 1.95 },
];

export const MARGINS = [
  { id: 'narrow', name: 'Narrow', value: 0.035 },
  { id: 'normal', name: 'Normal', value: 0.07 },
  { id: 'wide', name: 'Wide', value: 0.12 },
];

export const ALIGN = [
  { id: 'left', name: 'Left' },
  { id: 'justify', name: 'Justified' },
];

export const LAYOUTS = [
  { id: 'auto', name: 'Auto' },
  { id: 'one', name: 'One page' },
  { id: 'two', name: 'Two pages' },
];

export const PARA = [
  { id: 'indent', name: 'Indented' },
  { id: 'spaced', name: 'Spaced' },
];

export const ANIMS = [
  { id: 'slide', name: 'Slide' },
  { id: 'curl', name: 'Page curl' },
  { id: 'fade', name: 'Fade' },
  { id: 'none', name: 'None' },
];

export const FLOWS = [
  { id: 'paged', name: 'Pages' },
  { id: 'scroll', name: 'Scroll' },
];

export const COMIC_FITS = [
  { id: 'page', name: 'Whole page' },
  { id: 'width', name: 'Width' },
  { id: 'height', name: 'Height' },
  { id: 'original', name: 'Actual size' },
];

export const COMIC_SPREADS = [
  { id: 'auto', name: 'Auto' },
  { id: 'single', name: 'Single' },
  { id: 'double', name: 'Double' },
];

/** Settings that can be overridden for a single book. */
export const BOOK_KEYS = ['theme', 'font', 'fontSize', 'spacing', 'margins', 'align', 'layout', 'para', 'anim', 'hyphenate', 'flow'];

export const DEFAULTS = {
  theme: 'paper',
  font: 'serif',
  fontSize: 20,
  spacing: 'normal',
  margins: 'normal',
  align: 'justify',
  layout: 'auto',
  para: 'indent',
  anim: 'slide',
  flow: 'paged',
  comicFit: 'page',
  comicSpread: 'auto',
  pdfFit: 'width',
  pdfCrop: true,
  ttsSleep: 0,
  yearGoal: 0,
  brightness: 100,
  warmth: 0,
  hyphenate: true,
  showFooter: true,
  tapZones: true,
  footerMode: 'page',
  appTheme: 'system',
  libraryView: 'grid',
  librarySort: 'recent',
  ttsRate: 1,
  ttsVoice: '',
  legalAcknowledged: false,
};

const pick = (list, id, fallback) => list.find((x) => x.id === id) || list.find((x) => x.id === fallback);

/** Merge stored settings with defaults, discarding anything unknown or out of range. */
export function sanitizeSettings(raw) {
  const s = { ...DEFAULTS };
  if (!raw || typeof raw !== 'object') return s;
  const ids = (list) => new Set(list.map((x) => x.id));
  const choose = (key, list) => {
    if (ids(list).has(raw[key])) s[key] = raw[key];
  };
  choose('theme', THEMES);
  choose('font', FONTS);
  choose('spacing', SPACING);
  choose('margins', MARGINS);
  choose('align', ALIGN);
  choose('layout', LAYOUTS);
  choose('para', PARA);
  choose('anim', ANIMS);
  choose('flow', FLOWS);
  choose('comicFit', COMIC_FITS);
  choose('comicSpread', COMIC_SPREADS);
  if (['page', 'width'].includes(raw.pdfFit)) s.pdfFit = raw.pdfFit;
  if (typeof raw.pdfCrop === 'boolean') s.pdfCrop = raw.pdfCrop;
  if ([0, 5, 15, 30, 45, 60, -1].includes(raw.ttsSleep)) s.ttsSleep = raw.ttsSleep;
  if (Number.isInteger(raw.yearGoal) && raw.yearGoal >= 0 && raw.yearGoal <= 1000) s.yearGoal = raw.yearGoal;
  const num = (key, lo, hi) => {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) s[key] = Math.min(hi, Math.max(lo, raw[key]));
  };
  num('fontSize', 12, 40);
  num('brightness', 40, 100);
  num('warmth', 0, 100);
  num('ttsRate', 0.6, 2);
  for (const key of ['hyphenate', 'showFooter', 'tapZones', 'legalAcknowledged']) if (typeof raw[key] === 'boolean') s[key] = raw[key];
  if (['page', 'position', 'chapter', 'book', 'source', 'none'].includes(raw.footerMode)) s.footerMode = raw.footerMode;
  if (['system', 'light', 'dark'].includes(raw.appTheme)) s.appTheme = raw.appTheme;
  if (['grid', 'list'].includes(raw.libraryView)) s.libraryView = raw.libraryView;
  if (['recent', 'added', 'title', 'author', 'progress', 'series', 'rating'].includes(raw.librarySort)) s.librarySort = raw.librarySort;
  if (typeof raw.ttsVoice === 'string' && raw.ttsVoice.length < 300) s.ttsVoice = raw.ttsVoice;
  return s;
}

/** Apply reading settings to the reader root as CSS custom properties and classes. */
export function applyReaderStyle(root, s) {
  const theme = pick(THEMES, s.theme, 'paper');
  const font = pick(FONTS, s.font, 'serif');
  const spacing = pick(SPACING, s.spacing, 'normal');
  const st = root.style;
  st.setProperty('--page-bg', theme.bg);
  st.setProperty('--page-fg', theme.fg);
  st.setProperty('--page-muted', theme.muted);
  st.setProperty('--page-accent', theme.accent);
  st.setProperty('--page-font', font.stack);
  st.setProperty('--page-size', `${s.fontSize}px`);
  st.setProperty('--page-leading', String(spacing.value));
  st.setProperty('--dim', String((100 - s.brightness) / 100));
  st.setProperty('--warm', String((s.warmth / 100) * 0.32));
  root.dataset.theme = theme.id;
  root.dataset.ui = theme.ui;
  root.dataset.align = s.align;
  root.dataset.para = s.para;
  root.dataset.hyphens = s.hyphenate ? 'auto' : 'manual';
  root.dataset.footer = s.showFooter ? 'on' : 'off';
  root.dataset.taps = s.tapZones ? 'on' : 'off';
}

export function marginFraction(s) {
  return pick(MARGINS, s.margins, 'normal').value;
}

export function lineHeightFactor(s) {
  return pick(SPACING, s.spacing, 'normal').value;
}

/** Signature of everything that changes text layout (used to invalidate page counts). */
export function layoutSignature(s) {
  return [s.font, s.fontSize, s.spacing, s.margins, s.align, s.layout, s.para, s.hyphenate, s.flow].join('|');
}
