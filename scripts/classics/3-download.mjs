// Downloads the selected Project Gutenberg plain-text files into a staging folder,
// scanning each one to confirm it is plain UTF-8 text with the PG markers.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

// Usage: node 3-download.mjs <selected.json> <staging-dir> [already-bundled-dir]
const [selectedPath, stageDir, bundledDir] = process.argv.slice(2);
const selected = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
const bundled = new Set(bundledDir && fs.existsSync(bundledDir) ? fs.readdirSync(bundledDir).map((f) => parseInt(f, 10)).filter(Boolean) : []);
fs.mkdirSync(stageDir, { recursive: true });
const UA = 'Readalune-classics-builder/1.0 (open-source e-reader; one-time download of public-domain texts)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let last = 0;
for (const b of selected) {
  if (bundled.has(b.id)) continue;
  const out = path.join(stageDir, `${b.id}.txt.gz`);
  if (fs.existsSync(out)) continue;
  const wait = last + 2500 - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  let buf = null;
  for (let attempt = 1; attempt <= 3 && !buf; attempt++) {
    try {
      const res = await fetch(`https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`, { headers: { 'User-Agent': UA } });
      if (res.status === 404) break;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
    } catch (e) {
      await sleep(4000 * attempt);
    }
  }
  if (!buf) {
    console.log(`FAIL ${b.id} download`);
    continue;
  }
  // The scan: valid UTF-8, no binary/control bytes, Project Gutenberg markers present.
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    console.log(`FAIL ${b.id} not-utf8`);
    continue;
  }
  if (/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/.test(text.replace(/\f/g, ''))) {
    console.log(`FAIL ${b.id} control-bytes`);
    continue;
  }
  if (!/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG/i.test(text) || !/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i.test(text)) {
    console.log(`FAIL ${b.id} markers`);
    continue;
  }
  fs.writeFileSync(out, zlib.gzipSync(buf, { level: 9 }));
  results.push({ id: b.id, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
  fs.writeFileSync(path.join(stageDir, 'hashes.json'), JSON.stringify(results));
  if (results.length % 25 === 0) console.log(`OK ${results.length}`);
}
console.log(`DONE ${results.length} staged`);
