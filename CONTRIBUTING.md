# Contributing to Readalune

Thanks for helping! Readalune aims to be a calm, private, trustworthy reader. A few ground rules keep it that way.

## Ground rules

1. **No DRM circumvention, ever.** Code that removes, bypasses or weakens DRM or copy protection will not be accepted.
2. **No tracking.** No analytics, telemetry, ads or network calls, unless the user explicitly asks for them (such as opening a link).
3. **No copyrighted material.** Only add text, fonts, icons, images or sounds you created yourself or that are public domain or compatibly licensed, and say where they came from in [NOTICE.md](NOTICE.md). New bundled books must pass the rules in `scripts/classics/` and `test/unit/classics.test.mjs`. Those rules only see Project Gutenberg's catalogue record, so also read the title page of the file: if it names a translator, editor or writer of an introduction who is not in the record, say so in your pull request (see [CLASSICS.md](CLASSICS.md#known-exceptions)).
4. **Keep it safe.** Book content is untrusted. Never insert HTML strings into the page. Build elements with `document.createElement` / `textContent` (see `src/renderer/js/ui/dom.js`).
5. **Keep source files ASCII.** Write special characters as escapes (`'—'`).

## Getting started

```bash
npm install
npm start          # run the app
npm test           # unit tests
npm run check      # security checks
npm run test:e2e   # end-to-end tests (Linux CI: xvfb-run -a npm run test:e2e)
```

## Project layout

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

## Pull requests

- Keep changes focused, and add or update tests.
- Run `npm run verify` before opening a PR.
- By contributing, you agree that your contribution is licensed under the MIT License, and you confirm that it is your own work or that you have the right to submit it.
- Commits are public, including the name and email address in them. Use an address you are happy to show, for example GitHub's no-reply address.
