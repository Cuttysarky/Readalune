<p align="center"><img src="src/renderer/assets/icon.png" width="96" height="96" alt="Readalune logo"></p>

<h1 align="center">Readalune</h1>
<p align="center"><b>Your personal desktop reading room.</b><br>
A free, open-source e-reader for your own books and documents. Offline, private, and distraction-free.</p>

---

Import your own **plain-text, Markdown, HTML, EPUB and PDF** files and Readalune turns them into beautifully formatted pages you turn one at a time. Your library, highlights and notes live on your computer, never in the cloud. A shelf of **1,000 classics** comes built in: books from Project Gutenberg that are in the public domain in the United States (rules differ in other countries; see [Legal](#legal)).

## Features

**Reading**
- Real pagination that follows your font, text size and window, with **"Page X of Y"**, **percent read**, position, and **time left in the chapter or book** (it learns your reading speed)
- **Pages or continuous scroll**; one or two pages side by side (automatic on wide windows); slide, page-curl, fade or no animation
- Six themes (Day, Paper, Sage, Dusk, Night, Midnight), seven font styles, text size, line spacing, margins, justification, hyphenation, indented or spaced paragraphs
- **Per-book settings**: give any book its own font, size, theme or layout
- **Comics (CBZ)**: fit to page, width, height or actual size; two-page spreads; right-to-left (manga) reading; click to zoom and drag to pan
- **PDF original layout**: switch between reflowed text and the real PDF pages, with fit-to-width or whole page and automatic margin cropping
- Brightness and warm-light controls, full screen, and controls that hide while you read
- Turn pages with the keyboard, mouse wheel, trackpad, touch swipe or by clicking the page edges
- Progress bar with chapter marks: hover to preview, click to jump, and **Back to page N** after any jump
- Table of contents (from EPUB/PDF outlines, Markdown/HTML headings, or detected "Chapter One" lines in plain text)
- Full-text search with snippets and page numbers; go to a page, position or percent
- **Read aloud** with your system's voices, highlighting each sentence and turning pages automatically, with a sleep timer

**Notes**
- Highlights in five colours, notes on any passage, bookmarks with a corner ribbon
- Notes panel per book plus a Notes tab across all books; export as Markdown, JSON or CSV
- **Quote images**: turn a highlighted passage into a shareable picture
- **Word Journal**: save words with the sentence they came from, mark them as learned, export as CSV

**Library**
- Grid or list view, cover images from EPUB/PDF, generated covers for everything else
- Continue reading; filters by status (not started, reading, finished, abandoned), collection or tag; sort by recent, added, title, author, progress, series or rating
- **Book details**: title, author, series and number, publisher, description, tags, star rating and reading status
- **Collections** you can create, rename and reorder; **bulk select** to tag, collect, change status or remove many books at once
- **Search inside books**: find words across the text of your whole library
- **Open books from your computer**: double-click an EPUB or CBZ file, or use *Open with Readalune* on any supported file, and it opens straight in the reader
- **Import a folder**, optionally watching it so new books are added automatically
- **Backup and restore** your whole library (books, notes, collections, settings) in one file
- Duplicate detection by file fingerprint and by content
- **Reading stats**: time read today and this week, streaks, books finished, reading speed
- **Classics shelf**: 1,000 books from Project Gutenberg that are in the public domain in the United States, ready to add with one click, even offline. Each file is checked against a recorded checksum and scanned to confirm it is plain text only

## Supported files

| Format | Notes |
|---|---|
| `.txt` | UTF-8, UTF-16 or Windows-1252. Hard-wrapped e-texts are re-flowed; verse keeps its line breaks |
| `.md` | Headings, emphasis, lists, quotes, code, tables, front matter (`title:`, `author:`) |
| `.html` `.htm` `.xhtml` | Text and structure only; scripts, images and links are ignored for safety |
| `.epub` | EPUB 2 and 3, **DRM-free only**. Cover, metadata and table of contents are kept |
| `.pdf` | PDFs with a text layer. Text is re-flowed; running headers, page numbers and hyphenation are cleaned up. Scanned PDFs need OCR first. Original page layout is also available |
| `.cbz` | Comic book archives (ZIP of images), with ComicInfo.xml metadata and manga direction. RAR comics (`.cbr`) are not supported because code for unpacking RAR is not available under an open-source license; `.cbr` files that are really ZIP archives work |

DRM-protected files are refused. Readalune never removes copy protection (see [LEGAL.md](LEGAL.md)).

## Download

Get the latest version from the [Releases page](https://github.com/cuttysarky/readalune/releases/latest):

| System | File |
|---|---|
| Windows 10 and 11 | `Readalune-Setup-<version>-x64.exe` (installer) or `Readalune-Portable-<version>-x64.exe` (no install) |
| macOS (Apple silicon) | `Readalune-<version>-mac-arm64.dmg` |
| macOS (Intel) | `Readalune-<version>-mac-x64.dmg` |
| Linux | `Readalune-<version>-linux-x86_64.AppImage` or `Readalune-<version>-linux-amd64.deb` |

`SHA256SUMS.txt` on the release page lets you check that a download is intact.

**First launch.** Release builds are not code-signed. That means your operating system cannot confirm who published them, so it warns you the first time. Download Readalune only from the Releases page above, and compare the file with `SHA256SUMS.txt` if you want to be sure it arrived unchanged.

- **Windows:** if SmartScreen says "Windows protected your PC", click **More info**, then **Run anyway**.
- **macOS:** open the app once, then go to **System Settings > Privacy & Security** and click **Open Anyway** next to the Readalune message.
- **Linux (AppImage):** make the file executable (`chmod +x Readalune-*.AppImage`) and run it.

Readalune never updates itself or checks online. *Help > Check for Updates* opens the Releases page in your browser.

Your library is kept when you uninstall or update. Find it with *Help > Open Library Folder*.

## Run from source

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/cuttysarky/readalune.git
cd readalune
npm install
npm start
```

Build an installer for your own computer (output goes to `dist/`):

```bash
npm run dist
```

### Try it in a web browser

To look around without building the desktop app:

```bash
npm install --omit=dev
npm run preview
```

Your browser opens at `http://localhost:4310`. The preview runs only on your computer and keeps its own library, separate from the desktop app's. Desktop-only features (watched folders, *Open with Readalune* and the menu bar) are not available in the browser.

Maintainers: see [docs/RELEASING.md](docs/RELEASING.md) for publishing a release.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `→` `Space` `PageDown` / `←` `PageUp` | Next / previous page |
| `[` `]` | Previous / next chapter |
| `T` `N` `A` | Contents, notes and bookmarks, reading settings |
| `B` | Bookmark page |
| `/` or `Ctrl+F` | Search |
| `G` | Go to page, position or percent |
| `R` | Read aloud |
| `+` `-` | Text size |
| `Backspace` | Back to where you jumped from |
| `F` / `F11` | Full screen |
| `Esc` | Close panel, or back to the library |

## Privacy and security

- **No accounts, no tracking, no ads, no network connections.** The app has no code that contacts a server, and requests from its window are blocked. See [PRIVACY.md](PRIVACY.md).
- Book files are treated as untrusted: the interface is sandboxed, book HTML is parsed inertly and never executed, and there is a strict Content-Security-Policy. See [SECURITY.md](SECURITY.md).
- One runtime dependency (Mozilla's PDF.js), pinned and audited. `npm run verify` runs the security scan, tests and audit.

## Development

```bash
npm test            # unit tests (node:test)
npm run check       # static security checks
npm run test:e2e    # drives the real app (Linux: xvfb-run -a npm run test:e2e)
npm run verify      # check + test + audit
```

The UI is plain HTML, CSS and JavaScript modules, with no framework and no build step. See [CONTRIBUTING.md](CONTRIBUTING.md) for the project layout and rules.

## Legal

The short version is below. [LEGAL.md](LEGAL.md) starts with an "At a glance" summary and then gives the details. None of this is legal advice.

- **Code:** [MIT License](LICENSE). Readalune is free of charge and open source.
- **No warranty:** the software is provided "as is". The license says the authors are not liable for damage or loss from using it.
- **Bundled books:** 1,000 texts from Project Gutenberg, which lists them as public domain in the United States. That is why they can be shared freely there. **Copyright rules differ in other countries**, and some of these books may still be protected where you live, so check before you read, copy or share them outside the United States. The list, and the limits of the checks that were made, are in [CLASSICS.md](CLASSICS.md).
- **Your own files:** you are responsible for having the right to use the files you import, and to share anything you copy or export from them. Readalune never removes copy protection.
- **Privacy:** no accounts, no tracking and no ads. Readalune does not send your books, notes or reading activity anywhere. See [PRIVACY.md](PRIVACY.md).
- **Installers:** not code-signed, so your system warns you on first launch. See [Download](#download) and [LEGAL.md](LEGAL.md#9-unsigned-installers).
- **Third-party components and the logo:** [NOTICE.md](NOTICE.md).

Readalune is an independent project. It is not affiliated with, endorsed by or sponsored by Project Gutenberg, or by any e-reader maker, bookstore, publisher, operating-system maker or other company whose products are named here. Those names belong to their owners and are used only to say what Readalune runs on, reads or includes.
