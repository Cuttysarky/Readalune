# Legal notice

*This page explains, in plain language, how Readalune handles licensing, copyright, trademarks and privacy. It is not legal advice and has not been reviewed by a lawyer. If something here matters to a decision you are making, ask a lawyer in your country.*

## At a glance

- **The code is free and open source.** Readalune is released under the [MIT License](LICENSE). It costs nothing, and you may use, change and share it.
- **No warranty.** The software is provided "as is". The license says the authors are not liable for damage or loss from using it, for example lost data. The LICENSE file has the exact wording.
- **The bundled books are in the public domain in the United States.** The Classics shelf holds 1,000 texts from Project Gutenberg, which lists each of them as public domain in the USA. That is why they can be shared freely there. **Other countries have different rules**, and some of these books may still be under copyright where you live. If you are outside the United States, check before you read, copy or share them. Details are in [section 4](#4-bundled-classics).
- **Your own files are your responsibility.** Readalune opens files you already have. It is up to you to make sure you have the right to use them, and to share anything you copy or export from them.
- **No DRM removal.** Copy-protected files are refused, never unlocked.
- **Independent project.** Readalune is not affiliated with, endorsed by or sponsored by Project Gutenberg, or by the maker of any e-reader, operating system or other product named in these documents.
- **Private.** No accounts, no tracking, no ads. Readalune does not send your books, notes or reading activity anywhere. It works offline and blocks network requests from its window. See [PRIVACY.md](PRIVACY.md).
- **Installers are not code-signed.** Your operating system cannot confirm who published them and warns you the first time you run one. See [section 9](#9-unsigned-installers).

Related files: [LICENSE](LICENSE) (the license of the code), [NOTICE.md](NOTICE.md) (third-party components and the logo), [CLASSICS.md](CLASSICS.md) (the bundled books), [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## 1. Software license

Readalune is free and open-source software under the [MIT License](LICENSE). It is distributed free of charge. You may use, copy, modify, merge, publish, distribute, sublicense and sell copies, provided the copyright notice and license text are included.

**No warranty.** The software is provided "as is", without warranty of any kind. Under the license, the authors and contributors are not liable for any claim, damages or other liability arising from its use (see the LICENSE file for the exact wording). Keep your own backups of anything that matters to you.

The MIT License covers Readalune's own code and documentation. The bundled books (section 4) and the third-party components ([NOTICE.md](NOTICE.md)) come with their own terms, and section 6 explains what applies to the name and logo.

## 2. Your content

Readalune is a reader for files you already have. It does **not** sell, download, host or share books. The only books it comes with are the bundled classics described in section 4.

- You are responsible for making sure you have the right to use the files you import. Examples: your own writing, public-domain works, openly licensed works, or DRM-free books you obtained legitimately.
- You are also responsible for what you do with text taken from those files, for example copied passages, exported notes and quote images.
- Readalune only reformats files on your own computer, for your own reading. It never uploads them anywhere.

## 3. No DRM circumvention

Readalune does **not** remove, bypass, decrypt or weaken DRM (digital rights management) or any other technical protection measure. Such features would not be accepted as contributions.

- EPUB files containing encrypted content (`META-INF/encryption.xml` with a non-font algorithm, or a `rights.xml` file) are refused with an explanation.
- PDFs whose permissions forbid copying text are refused.
- Password-protected PDFs open only with the password the user types.

## 4. Bundled classics

Readalune ships with 1,000 books from [Project Gutenberg](https://www.gutenberg.org). They are listed in [CLASSICS.md](CLASSICS.md) and in `src/renderer/classics/catalog.json`.

### What is known

- **Public domain in the United States, according to Project Gutenberg.** The selection scripts only accepted books that Project Gutenberg's catalogue marks "Public domain in the USA", and every bundled file carries Project Gutenberg's standard header for such books. Readalune relies on Project Gutenberg's assessment. The project has not researched the copyright history of each title itself.
- **Stored as downloaded.** Each file is Project Gutenberg's plain-text edition, compressed with gzip and otherwise unchanged. A SHA-256 checksum taken at download time is recorded in `catalog.json`. The automated tests check every file against it, and the app checks a book again when you add it.
- **Plain text only.** No HTML, images or programs are included. The tests confirm that every file decodes as plain text and contains no hidden characters, no script or embed tags and no long blocks of encoded data.
- **The Project Gutenberg License stays attached.** Every file keeps Project Gutenberg's header and the full Project Gutenberg License at its end, because that license asks for this when a text is shared with the Project Gutenberg name on it. In the reader, each book opens with the header, and the license is the last entry in its table of contents.

### What is not guaranteed

- **Other countries.** Copyright terms differ from country to country. A book that is free to share in the United States can still be protected elsewhere. Every bundled file says so in Project Gutenberg's own words: "If you are not located in the United States, you will have to check the laws of the country where you are located before using this eBook." Readalune does not know where you are and cannot tell you what is allowed there.
- **The extra rule, and its limits.** To lower the risk outside the United States, a book was only selected if every author, translator and editor *named in Project Gutenberg's catalogue record* died before 1926 or, where the record gives no year of death, was born before 1800 (see `policy` in `catalog.json`, the scripts in `scripts/classics/` and `test/unit/classics.test.mjs`). The rule works on catalogue records, not on the books themselves, and the records do not name everyone. In November 2026 the title pages of all bundled files were scanned for such people. The scan found 38 editions; 37 were replaced with other classics, and one is kept and disclosed: *Pride and Prejudice*, whose only plain-text edition includes an 1894 preface by George Saintsbury (died 1933). See [CLASSICS.md](CLASSICS.md#known-exception). The scan only read title pages, so it can miss a contributor named elsewhere in a book. The rule lowers the risk. It is not a promise that a book is free of copyright in your country.
- **Anonymous works.** Four bundled books have no known author. A source or date for each was looked up by hand and is recorded under `policy.vettedAnonymous` in `catalog.json`.
- **Suitability.** Books that Project Gutenberg's catalogue labels as erotica were left out. Nobody has read all 1,000 books for this project. They are old, and some contain language, opinions and scenes that readers today may find offensive or unsuitable for children.

### Conditions that come with the books

- **No charge.** Readalune is given away free. The Project Gutenberg License does not allow charging for texts that carry the Project Gutenberg name unless royalties are paid (its paragraphs 1.E.7 and 1.E.8). Anyone who sells Readalune or a modified version must either follow those paragraphs or remove the bundled books (`src/renderer/classics/`). This does not change the MIT License of the code.
- **Getting the original files.** The original plain-text file of each book is in the project's source code as `src/renderer/classics/<number>.txt.gz` (any gzip tool unpacks it), and on Project Gutenberg's page for the book, which is linked from CLASSICS.md.
- **Trademark.** "Project Gutenberg" is a registered trademark of the Project Gutenberg Literary Archive Foundation. Readalune is not affiliated with or endorsed by Project Gutenberg. The name is used to say where the texts come from, and it appears inside the files because they are kept unchanged.

### Left out on purpose

Some well-known Project Gutenberg books were not included because the catalogue record names an author, translator or editor who died after 1925 or whose year of death is not recorded. Books with "Bible" in the title were left out as well (the King James Bible is subject to Crown rights in the United Kingdom), and so were anonymous works whose date could not be confirmed.

## 5. Trademarks

Readalune is an independent project. It is not affiliated with, endorsed by or sponsored by any e-reader manufacturer, bookstore, publisher, operating-system maker or software company.

These documents and the app name other products only to say what Readalune runs on, reads or includes: for example Windows, macOS, Linux, EPUB, PDF, GitHub, Electron, Chromium, Node.js, PDF.js, Mozilla, Adobe and Project Gutenberg. Those names, and any logos and brands that go with them, belong to their respective owners. Readalune uses none of their logos. Readalune's own name, icons and interface were made for this project; how the logo was made is described in [NOTICE.md](NOTICE.md).

## 6. Name and logo

The MIT License covers the code. It does not give permission to use the Readalune name or logo in a way that suggests a modified version is the official app or is endorsed by the project. If you publish a modified version, please give it a different name and logo. Referring to Readalune by name, for example in a review, an article or "based on Readalune", is always fine.

## 7. Privacy

See [PRIVACY.md](PRIVACY.md). In short: no accounts, no tracking and no ads. The app has no code that contacts a server, it blocks network requests from its window, and your library stays in a folder on your computer. Links to the project's pages on GitHub open in your web browser, and only when you click them.

## 8. Third-party components

See [NOTICE.md](NOTICE.md) for the open-source components Readalune includes and their licenses.

## 9. Unsigned installers

The installers on the Releases page are built by the public release workflow (`.github/workflows/release.yml`) from the tagged source code. They are **not code-signed**.

- A code signature lets an operating system confirm who published a program and that it has not been changed since. Without one, Windows and macOS cannot do that, so they show a warning the first time you run Readalune. The [README](README.md#download) explains how to continue.
- Download Readalune only from the project's Releases page. Each release lists SHA-256 checksums in `SHA256SUMS.txt`, so you can check that your download is complete and is the file that was published there. A checksum is not a substitute for a signature.
- If you would rather not run an unsigned installer, you can run or build Readalune from the source code instead. The README explains how.

## 10. Reporting a problem

If you believe something in this project infringes your rights, for example a bundled book that is still under copyright where you are, please open an issue on the project's GitHub page. It will be reviewed, and the material will be removed if the concern is justified.

If you would rather not raise it in public, use the **Report a vulnerability** button on the repository's **Security** tab, which sends a private report to the maintainer. You can also use GitHub's own copyright process (search for "GitHub DMCA takedown policy").
