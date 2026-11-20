# Third-party notices

Readalune's own code is under the MIT License, Copyright (c) 2026 Cuttysarky and contributors (see [LICENSE](LICENSE)). The app also includes, or is built on, the third-party software and content listed here. Each item keeps its own license.

## What ships in the app

| Component | Copyright | License | Where it is used |
|---|---|---|---|
| [PDF.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) | Mozilla Foundation and contributors | Apache License 2.0 | Reading PDF files |
| Adobe CMap resources (shipped with PDF.js in `cmaps/`) | Adobe Systems Incorporated | BSD 3-Clause License | Extracting Chinese, Japanese and Korean text from PDFs |
| [Electron](https://www.electronjs.org/) | Electron contributors and GitHub Inc. | MIT License | The desktop application runtime |
| Chromium and Node.js (inside Electron), with the libraries they include | The Chromium Authors; Node.js contributors; many others | Mostly BSD-style and MIT licenses. Some parts use other licenses, for example FFmpeg (GNU LGPL 2.1 or later), which ships as a separate library file | Rendering and running the app. Installed builds include `LICENSE.electron.txt` and the full list in `LICENSES.chromium.html`. |
| 1,000 books from [Project Gutenberg](https://www.gutenberg.org) | Listed by Project Gutenberg as public domain in the United States | Stored as downloaded, each with the Project Gutenberg License inside the file | The bundled Classics shelf (see [CLASSICS.md](CLASSICS.md) and [LEGAL.md](LEGAL.md#4-bundled-classics)) |

From the `pdfjs-dist` package, Readalune ships only the unmodified pre-built files `pdf.min.mjs` and `pdf.worker.min.mjs`, the `cmaps/` folder with its license file, and the package's `LICENSE`. The fonts, WebAssembly decoders and colour profiles that the package also contains are not shipped.

## Build tools that are not part of the app's code

- electron-builder (MIT) packages the installers. The installers it produces contain parts of the packaging tools it uses: the Windows installer is made with NSIS (zlib/libpng license, with some components under other open-source licenses), and the Linux AppImage includes the AppImage runtime (MIT).
- playwright-core (Apache-2.0) runs the automated tests. It is not shipped.

## Apache License 2.0 notice for PDF.js

PDF.js is licensed under the Apache License, Version 2.0. A copy of the license is included in the app at `node_modules/pdfjs-dist/LICENSE` and is available at <https://www.apache.org/licenses/LICENSE-2.0>. Readalune does not modify PDF.js.

## Fonts, icons and sounds

Readalune bundles **no fonts** and **no sounds**: it uses only the fonts and speech voices already installed on your computer. The interface icons are simple line drawings written for this project (`src/renderer/js/ui/dom.js`) and are covered by the project's MIT License.

## The Readalune logo

The logo (`build/logo-source.png`) shows a crescent moon and stars above an open book. The window, installer and in-app icons (`build/icon.png`, `src/renderer/assets/icon.png`, `src/renderer/assets/logo.png`) are resized copies of it, made by `scripts/render-icons.cjs`.

- The logo was made for this project with an AI image generator (Higgsfield, using the GPT Image 2.5 model) from a written description, not from another logo.
- When the logo was made, Higgsfield's published terms said that Higgsfield does not claim ownership of images its users generate and does not restrict commercial use of them. Terms like these can change.
- A moon, stars and an open book are common symbols. No formal search for similar logos or trademarks has been carried out.
- Images made entirely by an AI system may not be protected by copyright, so the project may not be able to stop others from copying the logo image itself.

See [LEGAL.md](LEGAL.md), section 6, for how the name and logo may be used.

## Names of other products

Product and company names in Readalune and its documents (for example Windows, macOS, Linux, EPUB, GitHub, Electron, Chromium, Node.js, Mozilla, Adobe and Project Gutenberg) belong to their respective owners. They are used only to say what Readalune runs on, reads or includes. Readalune is not affiliated with or endorsed by any of them.
