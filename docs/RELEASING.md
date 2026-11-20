# Releasing Readalune

Installers are built by GitHub Actions from the tagged source (`.github/workflows/release.yml`). Nobody builds release files on their own computer, so every published file comes from a public workflow run for that tag. This shows where a file came from. The builds have not been made byte-for-byte reproducible, so it does not let someone else rebuild an identical file to compare.

## Steps

1. Make sure `main` is green in the **CI** workflow.
2. Update the version in `package.json` (and `package-lock.json`):

   ```bash
   npm version 1.0.1 --no-git-tag-version
   ```

3. Add a section for the new version to [CHANGELOG.md](../CHANGELOG.md), then commit and merge to `main`.
4. Tag the merged commit and push the tag:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

5. The **Release** workflow builds the Windows, macOS and Linux installers and creates a **draft** release with the files and `SHA256SUMS.txt`. Check the draft, edit the notes if needed, then press **Publish release**.

   Without a local clone, skip step 4: open **Actions > Release > Run workflow**, tick **Create a draft release for the version in package.json** and run it on `main`. The draft it creates has no tag yet; pressing **Publish release** creates the tag on the commit that was built. That starts the workflow once more, and it stops straight away because the release already exists.

The workflow refuses to build if the tag and the `package.json` version differ.

To build test installers without releasing, open **Actions > Release > Run workflow** and leave the box unticked. The files appear as downloadable artifacts on the run page for 14 days.

## What gets built

| System | Files |
|---|---|
| Windows (x64) | `Readalune-Setup-<version>-x64.exe` (installer, lets you choose the folder), `Readalune-Portable-<version>-x64.exe` |
| macOS | `Readalune-<version>-mac-arm64.dmg` / `-x64.dmg`, plus `.zip` versions |
| Linux (x64) | `Readalune-<version>-linux-x86_64.AppImage`, `Readalune-<version>-linux-amd64.deb` |

Installers register Readalune as an app that can open EPUB and CBZ files, without making it the default. Uninstalling keeps the user's library.

## Code signing (optional, recommended)

Unsigned builds work, but Windows SmartScreen and macOS Gatekeeper warn on first launch (the README explains how to continue, and LEGAL.md section 9 says what an unsigned installer means). If signing is added, update both. To sign, add these repository secrets and pass them to the "Build installers" step as environment variables; electron-builder picks them up automatically:

- **Windows:** `CSC_LINK` (base64 of a `.pfx` code-signing certificate) and `CSC_KEY_PASSWORD`.
- **macOS:** `CSC_LINK` and `CSC_KEY_PASSWORD` for a "Developer ID Application" certificate, plus `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` for notarization. Notarization also needs `"notarize": true` under `build.mac` in `package.json`.

Never commit certificates or passwords to the repository.

## Before tagging

- `npm run verify` passes (security check, unit tests, audit of shipped dependencies).
- `xvfb-run -a npm run test:e2e` passes on Linux (CI runs it on every push).
- If the classics changed, `CLASSICS.md` was regenerated with `node scripts/classics-md.mjs` and the classics tests pass. For each new book, the title page of the file was read for translators, editors and writers of introductions who are missing from the catalogue record (see "Known exceptions" in `CLASSICS.md`).
- `LEGAL.md`, `NOTICE.md` and `PRIVACY.md` still describe the app as it is: what ships, what it connects to, and where data is stored.
- Electron is on a currently supported, patched release.
