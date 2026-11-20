/**
 * Maintainer script: builds the bundled "Classics" shelf from Project Gutenberg.
 *
 *   NODE_USE_ENV_PROXY=1 node scripts/fetch-classics.mjs --rebuild-first-100     (proxy env optional)
 *
 * Kept as the record of how the first 100 books were chosen. It writes a 100-book catalogue
 * and removes every other bundled file, so it refuses to run without that flag. The full
 * 1,000-book shelf is built by the numbered steps in scripts/classics/.
 *
 * Selection rule (enforced in code, and re-checked by test/unit/classics.test.mjs):
 *   - the work was first published before 1931 (the year is entered by hand below), AND
 *   - every author, translator and editor named in Project Gutenberg's catalogue
 *     record died before 1926, AND
 *   - Project Gutenberg's own catalogue marks it "Public domain in the USA".
 *   Illustrators are ignored because only plain text is bundled.
 *   Limits: the rule sees catalogue records, not the books. An edition can contain
 *   an introduction, notes or a translation by someone the record does not name,
 *   so passing the rule does not show that a text is free of copyright outside
 *   the USA. Read the title page as well (see CLASSICS.md and LEGAL.md).
 *
 * Files are stored byte-for-byte as Project Gutenberg publishes them, including
 * the Project Gutenberg License header and footer that its terms require when
 * redistributing, gzip-compressed. A SHA-256 of each original file is recorded.
 *
 * Be polite to Project Gutenberg: requests are made one at a time with a pause.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { writeClassicsMd } from './classics-md.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'src/renderer/classics');
const BASE = process.env.GUTENBERG_BASE || 'https://www.gutenberg.org';
const DELAY_MS = 2500;
const WANT = 100;
const DEATH_BEFORE = 1926;
const PUBLISHED_BEFORE = 1931;
const UA = 'Readalune-classics-builder/1.0 (open-source e-reader; one-time download of public-domain texts)';

// In order of priority. `match` must appear in Project Gutenberg's title.
// prettier-ignore
const CANDIDATES = [
  // Novels
  [1342, 'Pride and Prejudice', 1813, 'Novels'],
  [84, 'Frankenstein', 1818, 'Novels'],
  [2701, 'Moby', 1851, 'Novels'],
  [1260, 'Jane Eyre', 1847, 'Novels'],
  [768, 'Wuthering Heights', 1847, 'Novels'],
  [98, 'Tale of Two Cities', 1859, 'Novels'],
  [1400, 'Great Expectations', 1861, 'Novels'],
  [174, 'Dorian Gray', 1890, 'Novels'],
  [345, 'Dracula', 1897, 'Novels'],
  [76, 'Huckleberry Finn', 1884, 'Novels'],
  [74, 'Tom Sawyer', 1876, 'Novels'],
  [514, 'Little Women', 1868, 'Novels'],
  [158, 'Emma', 1815, 'Novels'],
  [161, 'Sense and Sensibility', 1811, 'Novels'],
  [105, 'Persuasion', 1817, 'Novels'],
  [121, 'Northanger Abbey', 1817, 'Novels'],
  [141, 'Mansfield Park', 1814, 'Novels'],
  [46, 'Christmas Carol', 1843, 'Novels'],
  [730, 'Oliver Twist', 1838, 'Novels'],
  [766, 'David Copperfield', 1850, 'Novels'],
  [1023, 'Bleak House', 1853, 'Novels'],
  [580, 'Pickwick', 1837, 'Novels'],
  [33, 'Scarlet Letter', 1850, 'Novels'],
  [145, 'Middlemarch', 1871, 'Novels'],
  [550, 'Silas Marner', 1861, 'Novels'],
  [599, 'Vanity Fair', 1848, 'Novels'],
  [2413, 'Madame Bovary', 1857, 'Novels'],
  [996, 'Don Quixote', 1605, 'Novels'],
  [203, "Uncle Tom", 1852, 'Novels'],
  [160, 'Awakening', 1899, 'Novels'],
  [73, 'Red Badge of Courage', 1895, 'Novels'],
  [209, 'Turn of the Screw', 1898, 'Novels'],
  [219, 'Heart of Darkness', 1899, 'Novels'],
  [5658, 'Lord Jim', 1900, 'Novels'],
  [829, "Gulliver", 1726, 'Novels'],
  [521, 'Robinson Crusoe', 1719, 'Novels'],
  [82, 'Ivanhoe', 1819, 'Novels'],
  [940, 'Last of the Mohicans', 1826, 'Novels'],
  [2145, 'Ben-Hur', 1880, 'Novels'],
  [19942, 'Candide', 1759, 'Novels'],
  [131, "Pilgrim's Progress", 1678, 'Novels'],
  [583, 'Woman in White', 1859, 'Novels'],
  // Adventure & science fiction
  [1184, 'Monte Cristo', 1844, 'Adventure'],
  [1257, 'Three Musketeers', 1844, 'Adventure'],
  [120, 'Treasure Island', 1883, 'Adventure'],
  [43, 'Jekyll', 1886, 'Adventure'],
  [421, 'Kidnapped', 1886, 'Adventure'],
  [164, 'Twenty Thousand Leagues', 1870, 'Adventure'],
  [103, 'Eighty Days', 1873, 'Adventure'],
  [18857, 'Centre of the Earth', 1864, 'Adventure'],
  [215, 'Call of the Wild', 1903, 'Adventure'],
  [910, 'White Fang', 1906, 'Adventure'],
  [2166, "King Solomon's Mines", 1885, 'Adventure'],
  [41, 'Sleepy Hollow', 1820, 'Adventure'],
  [932, 'Usher', 1839, 'Adventure'],
  // Children's classics
  [11, "Alice's Adventures in Wonderland", 1865, "Children's"],
  [12, 'Through the Looking-Glass', 1871, "Children's"],
  [55, 'Wizard of Oz', 1900, "Children's"],
  [113, 'Secret Garden', 1911, "Children's"],
  [146, 'Little Princess', 1905, "Children's"],
  [271, 'Black Beauty', 1877, "Children's"],
  [1874, 'Railway Children', 1906, "Children's"],
  [2591, 'Grimm', 1812, "Children's"],
  [1597, 'Andersen', 1835, "Children's"],
  [11339, "Aesop", 1867, "Children's"],
  [128, 'Arabian Nights', 1898, "Children's"],
  [500, 'Pinocchio', 1883, "Children's"],
  [1448, 'Heidi', 1881, "Children's"],
  // Poetry, drama & epics
  [1524, 'Hamlet', 1603, 'Poetry & Drama'],
  [1513, 'Romeo and Juliet', 1597, 'Poetry & Drama'],
  [1533, 'Macbeth', 1623, 'Poetry & Drama'],
  [1514, "Midsummer Night", 1600, 'Poetry & Drama'],
  [1532, 'King Lear', 1608, 'Poetry & Drama'],
  [1531, 'Othello', 1622, 'Poetry & Drama'],
  [844, 'Importance of Being Earnest', 1895, 'Poetry & Drama'],
  [2542, "Doll's House", 1879, 'Poetry & Drama'],
  [1322, 'Leaves of Grass', 1855, 'Poetry & Drama'],
  [12242, 'Poems', 1890, 'Poetry & Drama'],
  [151, 'Ancient Mariner', 1798, 'Poetry & Drama'],
  [26, 'Paradise Lost', 1667, 'Poetry & Drama'],
  [14591, 'Faust', 1808, 'Poetry & Drama'],
  [1727, 'Odyssey', 1900, 'Poetry & Drama'],
  [2199, 'Iliad', 1898, 'Poetry & Drama'],
  [8800, 'Divine Comedy', 1867, 'Poetry & Drama'],
  [16328, 'Beowulf', 1910, 'Poetry & Drama'],
  [228, 'Aeneid', 1697, 'Poetry & Drama'],
  [2383, 'Canterbury Tales', 1400, 'Poetry & Drama'],
  // Ideas, history & philosophy
  [1497, 'Republic', 1871, 'Ideas'],
  [2680, 'Meditations', 1862, 'Ideas'],
  [3207, 'Leviathan', 1651, 'Ideas'],
  [3300, 'Wealth of Nations', 1776, 'Ideas'],
  [1228, 'Origin of Species', 1859, 'Ideas'],
  [147, 'Common Sense', 1776, 'Ideas'],
  [1404, 'Federalist', 1788, 'Ideas'],
  [61, 'Communist Manifesto', 1848, 'Ideas'],
  [34901, 'On Liberty', 1859, 'Ideas'],
  [1998, 'Zarathustra', 1909, 'Ideas'],
  [59, 'Discourse on the Method', 1637, 'Ideas'],
  [205, 'Walden', 1854, 'Ideas'],
  [71, 'Civil Disobedience', 1849, 'Ideas'],
  [23, 'Narrative of the Life of Frederick Douglass', 1845, 'Ideas'],
  [2376, 'Up from Slavery', 1901, 'Ideas'],
  [20203, 'Autobiography of Benjamin Franklin', 1791, 'Ideas'],
  [3420, 'Vindication of the Rights of Woman', 1792, 'Ideas'],
  [2130, 'Utopia', 1516, 'Ideas'],
  [3330, 'Analects', 1861, 'Ideas'],
  [216, 'Tao Te Ching', 1891, 'Ideas'],
  [2388, 'Bhagavad', 1885, 'Ideas'],
  [1080, 'Modest Proposal', 1729, 'Ideas'],
  // Reserve: used only if fewer than 100 of the books above pass the copyright rule.
  [786, 'Hard Times', 1854, 'Novels'],
  [77, 'Seven Gables', 1851, 'Novels'],
  [6688, 'Mill on the Floss', 1860, 'Novels'],
  [4276, 'North and South', 1855, 'Novels'],
  [394, 'Cranford', 1853, 'Novels'],
  [969, 'Wildfell Hall', 1848, 'Novels'],
  [767, 'Agnes Grey', 1847, 'Novels'],
  [9182, 'Villette', 1853, 'Novels'],
  [974, 'Secret Agent', 1907, 'Novels'],
  [86, 'Connecticut Yankee', 1889, 'Novels'],
  [1837, 'Prince and the Pauper', 1881, 'Novels'],
  [102, "Pudd'nhead", 1894, 'Novels'],
  [1079, 'Tristram Shandy', 1759, 'Novels'],
  [6593, 'Tom Jones', 1749, 'Novels'],
  [155, 'Moonstone', 1868, 'Novels'],
  [619, 'Warden', 1855, 'Novels'],
  [83, 'Earth to the Moon', 1865, 'Adventure'],
  [1268, 'Mysterious Island', 1875, 'Adventure'],
  [1074, 'Sea-Wolf', 1904, 'Adventure'],
  [3155, 'She', 1887, 'Adventure'],
  [2147, 'Works of Edgar Allan Poe', 1845, 'Adventure'],
  [479, 'Fauntleroy', 1886, "Children's"],
  [778, 'Five Children', 1902, "Children's"],
].map(([id, match, published, shelf]) => ({ id, match, published, shelf }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;

async function get(url) {
  const wait = lastRequest + DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  for (let attempt = 1; attempt <= 4; attempt++) {
    lastRequest = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(2000 * 2 ** attempt);
    }
  }
  return null;
}

const decodeXml = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');

function tag(xml, name) {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decodeXml(m[1].trim()) : '';
}

/** Parse the bits of Project Gutenberg's RDF record we need. */
export function parseRdf(xml) {
  const agents = [];
  const roleRe = /<(dcterms:creator|marcrel:[a-z]{3})>\s*<pgterms:agent[^>]*>([\s\S]*?)<\/pgterms:agent>\s*<\/\1>/g;
  let m;
  while ((m = roleRe.exec(xml))) {
    const body = m[2];
    const num = (t) => {
      const v = tag(body, t);
      return v && /^-?\d+$/.test(v) ? Number(v) : null;
    };
    agents.push({ role: m[1] === 'dcterms:creator' ? 'aut' : m[1].slice(8), name: tag(body, 'pgterms:name'), birth: num('pgterms:birthdate'), death: num('pgterms:deathdate') });
  }
  const languages = [...xml.matchAll(/<dcterms:language>[\s\S]*?<rdf:value[^>]*>([^<]+)<\/rdf:value>/g)].map((x) => x[1].trim());
  return { title: tag(xml, 'dcterms:title').replace(/\s+/g, ' '), rights: tag(xml, 'dcterms:rights'), languages, agents };
}

/** The copyright rule. Returns null when OK, or the reason for rejecting. */
export function rejectReason(entry, rdf) {
  if (entry.published >= PUBLISHED_BEFORE) return `published ${entry.published}`;
  if (!/^Public domain in the USA/i.test(rdf.rights)) return `rights: ${rdf.rights || 'missing'}`;
  if (!rdf.languages.includes('en')) return `language ${rdf.languages.join(',')}`;
  if (!rdf.title.toLowerCase().includes(entry.match.toLowerCase())) return `title mismatch: ${rdf.title}`;
  const people = rdf.agents.filter((a) => a.role !== 'ill');
  if (!people.some((a) => a.role === 'aut')) return 'no author listed';
  for (const a of people) {
    if (a.death !== null) {
      if (a.death >= DEATH_BEFORE) return `${a.role} ${a.name} died ${a.death}`;
    } else if (!(a.birth !== null && a.birth < 1800) && !/^(anonymous|unknown)$/i.test(a.name)) {
      return `${a.role} ${a.name} has no death date`;
    }
  }
  return null;
}

function displayName(name) {
  // "Austen, Jane" -> "Jane Austen"; "Shelley, Mary Wollstonecraft" -> "Mary Wollstonecraft Shelley"
  const clean = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 2 && !/^(jr|sr)\.?$/i.test(parts[1])) return `${parts[1]} ${parts[0]}`;
  if (parts.length === 3 && /^(jr|sr)\.?$/i.test(parts[2])) return `${parts[1]} ${parts[0]} ${parts[2]}`;
  return clean;
}

/** A previously verified entry whose file is still intact, rebuilt from catalog.json (no network). */
function reusable(prev, entry) {
  if (!prev) return null;
  const file = path.join(OUT, prev.file);
  if (!fs.existsSync(file)) return null;
  const text = zlib.gunzipSync(fs.readFileSync(file));
  if (crypto.createHash('sha256').update(text).digest('hex') !== prev.sha256) return null;
  const rdf = {
    title: prev.fullTitle,
    rights: 'Public domain in the USA.',
    languages: ['en'],
    agents: prev.contributorsDied.map((c) => ({ role: c.role, name: c.name, birth: c.born, death: c.died })),
  };
  return rejectReason(entry, rdf) ? null : { ...prev, published: entry.published, shelf: entry.shelf };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const catalog = [];
  const rejected = [];
  let previous = new Map();
  try {
    previous = new Map(JSON.parse(fs.readFileSync(path.join(OUT, 'catalog.json'), 'utf8')).books.map((b) => [b.id, b]));
  } catch {
    /* first run */
  }
  for (const entry of CANDIDATES) {
    if (catalog.length >= WANT) break;
    process.stdout.write(`#${entry.id} ${entry.match} ... `);
    const cached = reusable(previous.get(entry.id), entry);
    if (cached) {
      catalog.push(cached);
      console.log('ok (already verified)');
      continue;
    }
    const rdfBuf = await get(`${BASE}/cache/epub/${entry.id}/pg${entry.id}.rdf`);
    if (!rdfBuf) {
      rejected.push({ ...entry, reason: 'no catalogue record' });
      console.log('skip (no record)');
      continue;
    }
    const rdf = parseRdf(rdfBuf.toString('utf8'));
    const reason = rejectReason(entry, rdf);
    if (reason) {
      rejected.push({ ...entry, reason });
      console.log(`skip (${reason})`);
      continue;
    }
    const text = await get(`${BASE}/cache/epub/${entry.id}/pg${entry.id}.txt`);
    if (!text || text.length < 2000 || !/PROJECT GUTENBERG/i.test(text.subarray(0, 20000).toString('utf8'))) {
      rejected.push({ ...entry, reason: 'text file missing or unexpected' });
      console.log('skip (text)');
      continue;
    }
    const file = `${entry.id}.txt.gz`;
    const gz = zlib.gzipSync(text, { level: 9 });
    fs.writeFileSync(path.join(OUT, file), gz);
    const authors = rdf.agents.filter((a) => a.role === 'aut');
    const translators = rdf.agents.filter((a) => a.role === 'trl');
    catalog.push({
      id: entry.id,
      title: rdf.title.split(/[\n:;]/)[0].trim(),
      fullTitle: rdf.title,
      author: authors.map((a) => displayName(a.name)).join(' & '),
      authorDied: Math.max(...authors.map((a) => (a.death === null ? -Infinity : a.death))),
      translator: translators.map((a) => displayName(a.name)).join(' & '),
      translatorDied: translators.length ? Math.max(...translators.map((a) => a.death)) : null,
      contributorsDied: rdf.agents.filter((a) => a.role !== 'ill').map((a) => ({ role: a.role, name: a.name, died: a.death, born: a.birth })),
      published: entry.published,
      shelf: entry.shelf,
      file,
      bytes: text.length,
      sha256: crypto.createHash('sha256').update(text).digest('hex'),
      source: `https://www.gutenberg.org/ebooks/${entry.id}`,
    });
    console.log(`ok (${Math.round(text.length / 1024)} KB)`);
  }

  const doc = {
    generated: new Date().toISOString().slice(0, 10),
    policy: {
      publishedBefore: PUBLISHED_BEFORE,
      allContributorsDiedBefore: DEATH_BEFORE,
      note: 'Project Gutenberg lists every book as public domain in the USA; copyright rules differ in other countries. As an extra precaution, every author, translator and editor named in Project Gutenberg\'s catalogue record died before 1926. The record does not always name everyone who contributed to an edition (see "Known exceptions" in CLASSICS.md), so this is not a guarantee for any country. Texts are Project Gutenberg plain-text files stored as downloaded, including the Project Gutenberg License. "published" is recorded for the 100 hand-picked titles only; for the rest it is null (not recorded).',
    },
    books: catalog,
  };
  fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(doc, null, 1) + '\n');
  fs.writeFileSync(path.join(root, 'scripts', 'classics-rejected.json'), JSON.stringify(rejected, null, 1) + '\n');
  // Remove stale files from earlier runs.
  const keep = new Set([...catalog.map((b) => b.file), 'catalog.json']);
  for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) fs.rmSync(path.join(OUT, f));
  const gzTotal = catalog.reduce((s, b) => s + fs.statSync(path.join(OUT, b.file)).size, 0);
  console.log(`\n${catalog.length} books, ${rejected.length} rejected, ${(gzTotal / 1048576).toFixed(1)} MB compressed`);
  writeClassicsMd();
  if (catalog.length < WANT) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // This script built the first 100 books. Run on today's shelf it would write a 100-book
  // catalogue and delete the other 900 files, so it only runs when asked for by name.
  if (!process.argv.includes('--rebuild-first-100')) {
    console.error(
      'Not run. This script rebuilds the shelf with only its first 100 hand-picked books and deletes every other bundled book.\n' +
        'The 1,000-book shelf is maintained with the steps in scripts/classics/. To run this anyway, pass --rebuild-first-100.'
    );
    process.exit(1);
  }
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
