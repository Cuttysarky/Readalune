/**
 * Static security checks for the Readalune source tree. Run: npm run check
 *
 * Fails (exit 1) if any of these are found:
 *  - non-ASCII or invisible characters in source files (Trojan Source protection)
 *  - HTML-string sinks in app code (innerHTML, outerHTML, insertAdjacentHTML, document.write)
 *  - dynamic code execution (eval, new Function, string timers)
 *  - weakened Electron settings (nodeIntegration, contextIsolation off, webSecurity off, ...)
 *  - an unsafe Content-Security-Policy
 *  - remote http(s) URLs loaded by app code
 *  - shelling out from the main process (child_process)
 *  - install scripts or unexpected runtime dependencies in package.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (file, line, msg) => problems.push(`${path.relative(root, file)}${line ? `:${line}` : ''}  ${msg}`);

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'classics') continue;
      out.push(...walk(p, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

const sourceFiles = [...walk(path.join(root, 'src'), ['.js', '.mjs', '.cjs', '.html', '.css', '.json', '.svg']), ...walk(path.join(root, 'scripts'), ['.js', '.mjs', '.cjs']), ...walk(path.join(root, 'test'), ['.js', '.mjs', '.cjs'])];

// 1. ASCII only (blocks bidi overrides, zero-width and look-alike characters).
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    // eslint-disable-next-line no-control-regex
    const bad = /[^\x09\x0a\x0d\x20-\x7e]/.exec(line);
    if (bad) fail(file, i + 1, `non-ASCII character U+${bad[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} (use an escape sequence)`);
  });
}

// 2-6. Dangerous patterns in app code (not in this script or tests that probe them).
const appCode = sourceFiles.filter((f) => f.startsWith(path.join(root, 'src')) && /\.(m?js|cjs|html)$/.test(f));
const RULES = [
  [/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(/, 'HTML string sink - build DOM with createElement/textContent'],
  [/(^|[^\w.])eval\s*\(|new\s+Function\s*\(/, 'dynamic code execution'],
  [/set(Timeout|Interval)\s*\(\s*['"`]/, 'string passed to a timer'],
  [/nodeIntegration\s*:\s*true|nodeIntegrationInWorker\s*:\s*true|contextIsolation\s*:\s*false|webSecurity\s*:\s*false|sandbox\s*:\s*false|allowRunningInsecureContent\s*:\s*true|webviewTag\s*:\s*true|experimentalFeatures\s*:\s*true/, 'weakened Electron security setting'],
  [/'unsafe-eval'|'unsafe-inline'|script-src[^;"]*\*/, 'unsafe Content-Security-Policy'],
  [/require\(\s*['"](node:)?child_process['"]\s*\)/, 'child_process in app code'],
  [/\bloadURL\s*\(\s*['"`]https?:/, 'loading a remote page'],
];
for (const file of appCode) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [re, msg] of RULES) if (re.test(line)) fail(file, i + 1, msg);
    // Remote URLs: allowed only as XML namespaces, documentation links, or the
    // user-initiated external links handled by the main process allow-list.
    const urls = line.match(/https?:\/\/[^\s'"`)<>]+/g) || [];
    for (const u of urls) {
      const okNamespace = /^http:\/\/(www\.w3\.org|purl\.org|www\.idpf\.org|www\.daisy\.org|ns\.adobe\.com)\//.test(u);
      const okExternal = /^https:\/\/(github\.com\/cuttysarky|www\.gutenberg\.org)\b/.test(u);
      const comment = /^\s*(\*|\/\/|<!--)/.test(line);
      const blockPattern = u.includes('*'); // URL patterns used to *block* requests
      const reserved = /^https?:\/\/[^/]*\.invalid\//.test(u); // RFC 2606: never resolves
      if (!okNamespace && !okExternal && !comment && !blockPattern && !reserved) fail(file, i + 1, `unexpected remote URL ${u}`);
    }
    if (/\bfetch\s*\(\s*['"`]https?:/.test(line)) fail(file, i + 1, 'fetch of a remote URL');
  });
}

// CSP present and strict in both places.
const main = fs.readFileSync(path.join(root, 'src/main/main.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src/renderer/index.html'), 'utf8');
if (!main.includes(`"script-src 'self'"`)) fail(path.join(root, 'src/main/main.js'), 0, "CSP header must contain script-src 'self'");
if (!html.includes("script-src 'self'")) fail(path.join(root, 'src/renderer/index.html'), 0, "CSP meta tag must contain script-src 'self'");
if (!/onBeforeRequest[\s\S]{0,200}cancel:\s*true/.test(main)) fail(path.join(root, 'src/main/main.js'), 0, 'network blocking (webRequest cancel) is missing');
if (!main.includes('setWindowOpenHandler')) fail(path.join(root, 'src/main/main.js'), 0, 'window.open handler missing');

// 7. package.json: no install hooks, only the expected runtime dependency.
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const hook of ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish']) {
  if (pkg.scripts && pkg.scripts[hook]) fail(path.join(root, 'package.json'), 0, `install hook "${hook}" is not allowed`);
}
const deps = Object.keys(pkg.dependencies || {});
if (deps.join(',') !== 'pdfjs-dist') fail(path.join(root, 'package.json'), 0, `unexpected runtime dependencies: ${deps.join(', ')}`);
for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) fail(path.join(root, 'package.json'), 0, `${name} must be pinned to an exact version (got ${version})`);
}
const fuses = pkg.build && pkg.build.electronFuses;
if (!fuses || fuses.runAsNode !== false || fuses.enableNodeCliInspectArguments !== false || fuses.enableNodeOptionsEnvironmentVariable !== false) {
  fail(path.join(root, 'package.json'), 0, 'Electron security fuses must be set');
}

if (problems.length) {
  console.error(`Security check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Security check passed: ${sourceFiles.length} files scanned.`);
