# Contributing

Readalune is published as a finished project. **It does not take pull requests or feature requests**, and it has no outside contributors.

- **Want to change it?** The code is under the MIT License, so you are free to copy it and make your own version. Please give a changed version a different name and icon (see [LEGAL.md](LEGAL.md), section 6).
- **Found a bug, or a book that should not be here?** See "Reporting a problem" in [LEGAL.md](LEGAL.md).
- **Found a security problem?** See [SECURITY.md](SECURITY.md).

## Working on your own copy

```bash
npm install
npm start          # run the app
npm test           # unit tests
npm run check      # security checks
npm run test:e2e   # end-to-end tests (Linux: xvfb-run -a npm run test:e2e)
```

```
src/main/        privileged Electron process (window, storage, IPC validation)
src/renderer/    the app UI (plain ES modules, no build step)
  js/import/     file importers (txt, md, html, epub, pdf)
  js/reader/     pagination engine and reading screen
  classics/      bundled public-domain books
test/unit/       node:test unit tests
test/e2e/        end-to-end tests driving the real app
scripts/         maintainer scripts (icons, classics, security check)
```

The rules the code follows, if you build on it:

1. **No DRM circumvention.** Nothing here removes, bypasses or weakens DRM or copy protection.
2. **No tracking.** No analytics, telemetry, ads or network calls.
3. **No copyrighted material.** Bundled books must pass the rules in `scripts/classics/` and `test/unit/classics.test.mjs`; third-party material is listed in [NOTICE.md](NOTICE.md).
4. **Book content is untrusted.** HTML strings are never inserted into the page; elements are built with `document.createElement` and `textContent` (see `src/renderer/js/ui/dom.js`).
5. **Source files under `src/` are ASCII.** Special characters are written as escapes.
