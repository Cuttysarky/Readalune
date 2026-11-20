'use strict';
/**
 * Maintainer script: makes the window and installer icons from the master
 * logo image (build/logo-source.png, 1024 x 1024). Run with: npm run icons
 */
const { app, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const targets = [
  { size: 1024, out: 'build/icon.png' },
  { size: 256, out: 'src/renderer/assets/icon.png' },
  { size: 256, out: 'src/renderer/assets/logo.png' },
];

app.whenReady().then(() => {
  const master = nativeImage.createFromPath(path.join(root, 'build/logo-source.png'));
  if (master.isEmpty()) {
    console.error('build/logo-source.png is missing or not a PNG image');
    app.exit(1);
    return;
  }
  for (const t of targets) {
    const img = master.getSize().width === t.size ? master : master.resize({ width: t.size, height: t.size, quality: 'best' });
    fs.writeFileSync(path.join(root, t.out), img.toPNG());
    console.log(`wrote ${t.out} (${t.size}x${t.size})`);
  }
  app.quit();
});
