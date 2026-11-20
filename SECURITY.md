# Security

## Reporting a vulnerability

Please report security problems privately, using GitHub's "Report a vulnerability" button on the repository's **Security** tab, rather than in a public issue. Include the steps to reproduce and, if possible, a sample file. You can expect an acknowledgement within a few days.

## How Readalune protects you

Book files are treated as untrusted input. The design goal is that opening a malicious file can, at worst, fail to import.

**Application sandbox**
- The interface runs in a sandboxed renderer with `contextIsolation` on and Node.js integration off. It cannot touch the file system or run programs.
- A small preload script (`src/main/preload.js`) exposes a fixed list of functions; `ipcRenderer` itself is never exposed.
- Every IPC call is checked: it must come from Readalune's own page, and every argument is validated (`src/main/validate.js`).

**No remote code, no network**
- App files are served from a private `readalune://` scheme with a strict Content-Security-Policy: `script-src 'self'`, no `eval`, no inline scripts, no remote content.
- All outgoing network requests are cancelled. Navigation, new windows, `<webview>`, downloads and permission requests (camera, microphone, location and so on) are denied.
- Packaged builds enable Electron's security fuses: no `ELECTRON_RUN_AS_NODE`, no `NODE_OPTIONS`, no debugging flags, ASAR integrity checking, and loading only from the app archive.

**Safe parsing of books**
- HTML and EPUB content is parsed with `DOMParser` into an inert document that is never attached to the page. Only text is extracted, so scripts, styles, images, frames and links inside books can never run or load.
- All text is inserted with `textContent`. The code never assigns HTML strings (`innerHTML`); a test enforces this.
- The EPUB ZIP reader limits file counts and decompressed sizes ("zip bomb" protection) and rejects encrypted archives.
- PDF.js runs with `isEvalSupported: false`. JavaScript inside PDFs is never executed.
- Cover images are decoded and re-encoded as JPEG through a canvas before being stored.

**Supply chain**
- Only one runtime dependency (PDF.js, by Mozilla). Exact versions are pinned and locked in `package-lock.json`.
- `npm run verify` runs the security check script, the unit tests and `npm audit` for shipped dependencies. CI runs it on every push.
- Source files must be plain ASCII. This blocks hidden or look-alike characters ("Trojan Source" attacks); `scripts/security-check.mjs` enforces it.
- The bundled classics are checked against recorded SHA-256 checksums both by the tests and every time a book is added in the app.
- GitHub Actions are pinned to exact commits. Release installers are built by the public release workflow (`.github/workflows/release.yml`) from the tagged source, and each release lists SHA-256 checksums in `SHA256SUMS.txt`. The installers are not code-signed; [LEGAL.md](LEGAL.md#9-unsigned-installers) explains what that means.

**Opening files from the system**
- Files opened with *Open with Readalune*, by double-click or on the command line are read by the main process (regular files with a supported extension, up to 300 MB) and only their name and bytes reach the page, exactly like files picked in the import dialog.

**Robustness**
- If the window's process crashes or hangs, Readalune offers to reload it. The library is saved as you go, so nothing is lost.
- Unexpected errors are written to a small local log (`logs/readalune.log` in Readalune's user-data folder, capped at 512 KB). It is for error messages, which can include a file name or folder path, and is not meant to hold book text. It is never sent anywhere.

## Known advisories in build tools

`npm audit` may report moderate advisories in `electron-builder`'s dependencies (for example `minimatch`). These are build-time packaging tools: they are not shipped in the app and only process the project's own file patterns, so they cannot be exploited through Readalune. `npm audit --omit=dev`, which covers everything shipped, reports 0 vulnerabilities. Electron is shipped and is kept on a patched release.
