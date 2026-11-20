/** Writes CLASSICS.md from src/renderer/classics/catalog.json. Run: node scripts/classics-md.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Bundled editions whose text names a contributor that Project Gutenberg's
// catalogue record does not list. A scan of the title pages (November 2026)
// found 38 such editions. 37 were replaced with other classics; this one stays
// because Project Gutenberg has no plain-text edition of the novel without it.
// Entries are printed only while the book is bundled.
const KNOWN_EXCEPTIONS = [[1342, 'Preface by George Saintsbury (died 1933), written for the 1894 edition']];

export function writeClassicsMd() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/renderer/classics/catalog.json'), 'utf8'));
  const year = (y) => (y < 0 ? `${-y} BC` : String(y));
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const byId = new Map(catalog.books.map((b) => [b.id, b]));
  const exceptions = KNOWN_EXCEPTIONS.filter(([id]) => byId.has(id));
  const count = catalog.books.length.toLocaleString('en-US');
  const lines = [
    '# Bundled classics',
    '',
    `Readalune includes ${count} books from [Project Gutenberg](https://www.gutenberg.org). They are on the **Classics** tab in the library and can be added to your library offline.`,
    '',
    '**In short:** Project Gutenberg lists every one of these books as public domain in the United States. Copyright rules are different in other countries, and some of these books may still be protected where you live. If you are outside the United States, check before you read, copy or share them. This page is not legal advice; see [LEGAL.md](LEGAL.md).',
    '',
    '## Why these books can be shared',
    '',
    '- **Public domain in the United States, according to Project Gutenberg.** The selection scripts only accepted books that Project Gutenberg\'s catalogue marks "Public domain in the USA". Readalune relies on that assessment and has not researched each title itself.',
    '- **Stored as downloaded.** The files are Project Gutenberg\'s plain-text editions, compressed with gzip and otherwise unchanged. Each one keeps Project Gutenberg\'s header and the full Project Gutenberg License at its end, as that license asks when a text is shared under the Project Gutenberg name.',
    '- **Free of charge.** Readalune is given away free, which the Project Gutenberg License requires for texts shared this way.',
    '- **Checked files.** A SHA-256 checksum taken at download time is recorded for each file in `catalog.json`. The tests check every file against it, and the app checks a book again when you add it.',
    '',
    '## Outside the United States',
    '',
    'A book that is free to share in the United States can still be under copyright in another country. Every bundled file opens with Project Gutenberg\'s own notice: "If you are not located in the United States, you will have to check the laws of the country where you are located before using this eBook."',
    '',
    `To lower that risk, a book was only selected if **every author, translator and editor named in Project Gutenberg's catalogue record died before ${catalog.policy.allContributorsDiedBefore}**. The "Catalogued contributors died" column below shows those years. Where the record gives no year of death, the book was only accepted if the person was born before 1800 or the work is anonymous; the column shows those cases too. Anonymous works were only included when a source or date could be found by hand (see \`policy.vettedAnonymous\` in \`catalog.json\`).`,
    '',
    'This rule has limits, and it is not a promise about any country:',
    '',
    '- It works on catalogue records, not on the books. The records do not always name the person who wrote an introduction or notes, and sometimes not the translator.',
    '- The year a book was first published is only recorded for the first 100 titles, where it was entered by hand. For a translation it is sometimes the year of the original work and sometimes the year of the translation. For the other 900 titles the column says "not recorded".',
    '- A scan of title pages (see below) is not the same as reading every book.',
    '',
  ];
  if (exceptions.length) {
    lines.push(
      '## Known exception',
      '',
      'In November 2026 the title pages of all bundled files were scanned for contributors missing from the catalogue record. The scan found 38 editions with an introduction, notes or a translation by someone not in the record, or first printed after 1930. 37 of them were replaced with other classics whose title pages name nobody but the catalogued authors.',
      '',
      'One is kept: *Pride and Prejudice*. Project Gutenberg has no plain-text edition of the novel without this preface. George Saintsbury died in 1933, so his preface is in the public domain in the United States and in countries where copyright lasts 70 or 80 years after the author\'s death. It may still be protected in the few countries with a longer term (for example Mexico, 100 years).',
      '',
      'The scan only read title pages. It can miss an unsigned introduction or a contributor named deeper in a book, so this is still not a guarantee.',
      '',
      '| Project Gutenberg | Title | What the bundled edition contains |',
      '|---|---|---|'
    );
    for (const [id, what] of exceptions) {
      const b = byId.get(id);
      lines.push(`| [#${id}](${b.source}) | ${esc(b.title)} | ${esc(what)} |`);
    }
    lines.push('');
  }
  lines.push(
    '## How the list was made',
    '',
    'The first 100 titles were picked by hand (`scripts/fetch-classics.mjs`). The other 900 were taken, in order of popularity, from the Project Gutenberg books that passed the rules above (`scripts/classics/`). The tests in `test/unit/classics.test.mjs` re-check the catalogue rules and every file. The original text of each book is in this repository as `src/renderer/classics/<number>.txt.gz`, and on the Project Gutenberg page linked in the last column.',
    '',
    'Readalune is not affiliated with or endorsed by Project Gutenberg. "Project Gutenberg" is a registered trademark of the Project Gutenberg Literary Archive Foundation; the name is used here to say where the texts come from.',
    '',
    '## The books',
    '',
    '| # | Title | Author | First published | Translator | Catalogued contributors died | Project Gutenberg |',
    '|---|---|---|---|---|---|---|'
  );
  catalog.books.forEach((b, i) => {
    const died = b.contributorsDied.map((c) => (c.died === null ? `${c.name} (${c.born === null ? 'year not known' : `b. ${year(c.born)}`})` : `${year(c.died)}`)).join(', ');
    lines.push(`| ${i + 1} | ${esc(b.title)} | ${esc(b.author)} | ${b.published === null || b.published === undefined ? 'not recorded' : year(b.published)} | ${esc(b.translator || '\u2014')} | ${esc(died)} | [#${b.id}](${b.source}) |`);
  });
  lines.push('', `*Generated ${catalog.generated} from \`catalog.json\`.*`, '');
  fs.writeFileSync(path.join(root, 'CLASSICS.md'), lines.join('\n'));
  return catalog.books.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`CLASSICS.md written (${writeClassicsMd()} books)`);
}
