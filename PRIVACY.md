# Privacy

Readalune is built to keep your reading on your own computer. This page describes what the app does and does not do, checked against its source code.

- **No accounts.** You never sign in, and Readalune does not ask for your name or email address.
- **No tracking and no ads.** There are no analytics, telemetry, crash reporting, advertising or "phone home" checks of any kind.
- **No network connections.** Readalune has no code that contacts a server. As a second safeguard, it cancels every network request that its window tries to make (see `src/main/main.js`), turns off the browser engine's own background services, and never downloads anything. It works completely offline, including the bundled classics.
- **Your data stays local.** Your books, highlights, notes, bookmarks, reading position, reading statistics and Word Journal are stored as ordinary files in Readalune's library folder on your computer. Open it from *Help > Open Library Folder*. Back it up by copying it; delete it to erase everything.
- **Nothing is collected.** Because nothing is sent anywhere, the project receives no information about you, your books or how you use the app.

## Links that open your web browser

Readalune never looks anything up online and never updates itself. It contains three links, all to the project's own pages on GitHub: the project page (in the About window), LEGAL.md (in the Legal & licenses window) and the Releases page (*Help > Check for Updates*). They open in your web browser, and only when you click them. From then on your browser and GitHub are involved, and GitHub's privacy policy applies. The same is true when you download Readalune or report a problem there.

## Error log

If something goes wrong, Readalune writes the error message to a small log file on your computer (`logs/readalune.log` in its user-data folder, next to the library folder). The log is for error messages and is not meant to hold the text of your books, but an error message can include a file name or a folder path. It is never sent anywhere, and you can delete it at any time.

## Read aloud

Read aloud uses the speech voices built into your operating system. Readalune itself sends no text anywhere. Some operating systems offer online voices; if you select one of those, your operating system's privacy policy applies.

## Things outside Readalune's control

- When you run a downloaded installer for the first time, your operating system may check it with its maker (for example Windows SmartScreen or macOS Gatekeeper). That check is made by the operating system, not by Readalune.
- Other software on your computer, such as backup or file-sync tools, may copy the library folder if you have set it up to do so.
