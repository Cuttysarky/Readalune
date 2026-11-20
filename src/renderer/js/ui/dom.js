/**
 * Tiny DOM helpers. All UI is built with createElement/textContent - never
 * by assigning HTML strings - so text from books can never become markup.
 */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * h('button.btn.primary', { onclick, title: 'x', dataset: { id: 1 } }, 'Label', child)
 */
export function h(spec, props, ...children) {
  const [tag, ...classes] = spec.split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.className = classes.join(' ');
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style') {
        for (const [prop, val] of Object.entries(v)) {
          if (prop.startsWith('--')) el.style.setProperty(prop, val);
          else el.style[prop] = val;
        }
      }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'className') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/* ---------------------------------------------------------------- icons */

// Original, minimal line icons (24x24, stroke based).
const ICONS = {
  back: 'M15 5l-7 7 7 7',
  toc: 'M4 6h16M4 12h16M4 18h10',
  search: 'M11 5a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM20 20l-4.6-4.6',
  bookmark: 'M7 4h10v16l-5-4-5 4z',
  notes: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  speaker: 'M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  rows: 'M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  edit: 'M4 20h4L20 8l-4-4L4 16z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  settings: 'M10.3 5.1L10.7 2.5L13.3 2.5L13.7 5.1L15.7 5.9L17.8 4.3L19.7 6.2L18.1 8.3L18.9 10.3L21.5 10.7L21.5 13.3L18.9 13.7L18.1 15.7L19.7 17.8L17.8 19.7L15.7 18.1L13.7 18.9L13.3 21.5L10.7 21.5L10.3 18.9L8.3 18.1L6.2 19.7L4.3 17.8L5.9 15.7L5.1 13.7L2.5 13.3L2.5 10.7L5.1 10.3L5.9 8.3L4.3 6.2L6.2 4.3L8.3 5.9zM12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4z',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11v6M12 7.5h.01',
  play: 'M8 5v14l11-7z',
  pause: 'M8 5v14M16 5v14',
  stop: 'M7 7h10v10H7z',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  dict: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z',
  history: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  check: 'M5 12l5 5 9-10',
  folder: 'M3 7h6l2 2h10v10H3z',
  tag: 'M4 4h8l8 8-8 8-8-8zM8 8h.01',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  chart: 'M5 20V11M12 20V4M19 20v-7',
  words: 'M4 19l4.5-14h1L14 19M5.8 14h6.4M15 15.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M20 13v6',
  star: 'M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z',
  share: 'M4 13v6h16v-6M12 3v12M7 8l5-5 5 5',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function icon(name, size = 20) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `icon icon-${name}`);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICONS[name] || ICONS.info);
  svg.append(path);
  return svg;
}

/** Fill every element that has data-icon="name" with that icon (once). */
export function hydrateIcons(root = document) {
  for (const el of $$('[data-icon]', root)) {
    if (el.dataset.iconDone) continue;
    el.dataset.iconDone = '1';
    el.prepend(icon(el.dataset.icon, el.classList.contains('small') ? 18 : 20));
  }
}

export function setIcon(el, name) {
  const old = el.querySelector('svg.icon');
  const next = icon(name, el.classList.contains('small') ? 18 : 20);
  if (old) old.replaceWith(next);
  else el.prepend(next);
  el.dataset.icon = name;
}

/* --------------------------------------------------------------- toasts */

export function toast(message, { kind = 'info', timeout = 3500, action } = {}) {
  const host = $('#toasts');
  const el = h('div.toast', { role: 'status', className: `toast ${kind}` }, h('span', null, message));
  if (action) {
    el.append(
      h('button.btn.small', {
        onclick: () => {
          action.run();
          el.remove();
        },
        text: action.label,
      })
    );
  }
  host.append(el);
  // Keep at most three messages on screen.
  while (host.children.length > 3) host.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, timeout);
}

/* ---------------------------------------------------------------- menus */

/**
 * Keyboard use of a pop-up menu that has just been shown: focus goes to its
 * first item, the arrow keys move between items, and Escape or Tab calls
 * `close()` and returns focus to the button that opened the menu.
 */
export function menuKeys(menu, opener, close) {
  const items = () => $$('.menu-item', menu);
  menu.addEventListener('keydown', (e) => {
    const list = items();
    const at = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      list[(at + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      close();
      opener.focus();
    }
  });
  const first = items()[0];
  if (first) first.focus();
}

/* -------------------------------------------------------------- dialogs */

let modalResolve = null;

/**
 * Show a modal. `build(body, close)` fills the body. Resolves with the value
 * passed to close(), or null when dismissed.
 */
export function modal({ title, build, wide = false, className = '' }) {
  const dlg = $('#modal');
  // A dialog replaced by this one counts as dismissed.
  if (modalResolve) {
    const previous = modalResolve;
    modalResolve = null;
    previous(null);
  }
  if (dlg.open) dlg.close();
  dlg.replaceChildren();
  dlg.className = `modal ${wide ? 'wide' : ''} ${className}`;
  return new Promise((resolve) => {
    modalResolve = resolve;
    const close = (value = null) => {
      if (modalResolve === resolve) {
        modalResolve = null;
        resolve(value);
      }
      if (dlg.open) dlg.close();
    };
    const head = h(
      'div.modal-head',
      null,
      h('h2', { text: title }),
      h('button.icon-btn.small', { 'aria-label': 'Close', onclick: () => close(null) }, icon('close', 18))
    );
    const body = h('div.modal-body');
    dlg.append(head, body);
    build(body, close);
    // A dialog that replaces another one gets the old dialog's (late) "close"
    // event; ignore it while this dialog is still open.
    dlg.onclose = () => {
      if (!dlg.open) close(null);
    };
    dlg.onclick = (e) => {
      if (e.target === dlg) close(null);
    };
    dlg.showModal();
    const focusable = body.querySelector('input, textarea, select, button.primary');
    if (focusable) focusable.focus();
  });
}

export function confirmDialog({ title, message, confirm = 'OK', danger = false }) {
  return modal({
    title,
    build: (body, close) => {
      body.append(
        h('p', { text: message }),
        h(
          'div.modal-actions',
          null,
          h('button.btn', { text: 'Cancel', onclick: () => close(false) }),
          h(`button.btn.${danger ? 'danger' : 'primary'}`, { text: confirm, onclick: () => close(true) })
        )
      );
    },
  }).then((v) => v === true);
}

export function promptDialog({ title, label, value = '', placeholder = '', multiline = false, confirm = 'Save', password = false }) {
  return modal({
    title,
    build: (body, close) => {
      const input = multiline
        ? h('textarea', { rows: 6, placeholder, 'aria-label': label })
        : h('input', { type: password ? 'password' : 'text', placeholder, 'aria-label': label });
      input.value = value;
      const submit = () => close(input.value);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          submit();
        }
      });
      // (append() would print a missing label as the word "null".)
      if (label) body.append(h('label.field-label', { text: label }));
      body.append(
        input,
        h('div.modal-actions', null, h('button.btn', { text: 'Cancel', onclick: () => close(null) }), h('button.btn.primary', { text: confirm, onclick: submit }))
      );
    },
  });
}

export function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function debounce(fn, ms) {
  let t = null;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
