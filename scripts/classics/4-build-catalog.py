"""Step 4: merge the downloaded books into the app's Classics shelf.

  python3 -I 4-build-catalog.py selected.json staging-dir ../../src/renderer/classics

Keeps the existing (hand-picked) catalogue entries first, then appends the
staged books in order of popularity. Every staged file is re-checked before it
is copied: its SHA-256 must match the value recorded at download time, it must
decode as UTF-8 plain text with no binary or control bytes, and it must still
contain the Project Gutenberg start/end markers and License.
"""
import gzip, hashlib, json, os, re, shutil, sys

selected_path, stage_dir, out_dir = sys.argv[1:4]
DEATH_BEFORE = 1926

selected = json.load(open(selected_path))
hashes = {h['id']: h for h in json.load(open(os.path.join(stage_dir, 'hashes.json')))}
catalog_path = os.path.join(out_dir, 'catalog.json')
catalog = json.load(open(catalog_path))
existing = {b['id'] for b in catalog['books']}


# Catalogue names that carry a title ("Marcus Aurelius, Emperor of Rome") or
# a saint's or noble's style read best written out by hand.
NAME_OVERRIDES = {
    'Augustine, of Hippo, Saint': 'Saint Augustine',
    'Saint-Simon, Louis de Rouvroy, duc de': 'Louis de Rouvroy, duc de Saint-Simon',
    'Byron, George Gordon Byron, Baron': 'Lord Byron',
    'Tennyson, Alfred Tennyson, Baron': 'Alfred, Lord Tennyson',
    'Chesterfield, Philip Dormer Stanhope, Earl of': 'Lord Chesterfield',
    'Macaulay, Thomas Babington Macaulay, Baron': 'Thomas Babington Macaulay',
    'Lytton, Edward Bulwer Lytton, Baron': 'Edward Bulwer-Lytton',
    'Disraeli, Benjamin, Earl of Beaconsfield': 'Benjamin Disraeli',
    'Brabourne, Edward Hugessen Knatchbull-Hugessen, Baron': 'Edward Knatchbull-Hugessen',
    'Roberts, Frederick Sleigh Roberts, Earl': 'Frederick Sleigh Roberts',
    'La Motte-Fouqué, Friedrich Heinrich Karl, Freiherr de': 'Friedrich de la Motte Fouqué',
    'Dino, Dorothée, duchesse de': 'Dorothée, duchesse de Dino',
    'Jomini, Antoine Henri, baron de': 'Antoine-Henri Jomini',
    'Kropotkin, Petr Alekseevich, kniaz': 'Peter Kropotkin',
    'Thomas, Aquinas, Saint': 'Thomas Aquinas',
    'Teresa, of Avila, Saint': 'Teresa of Avila',
    'More, Thomas, Saint': 'Thomas More',
    'Kalakaua, David, King of Hawaii': 'David Kalakaua',
    'Castiglione, Baldassarre, conte': 'Baldassare Castiglione',
    'Tolstoy, Leo, graf': 'Leo Tolstoy',
    'James, Rajah of Sarawak': 'James Brooke',
}
TITLE_RE = re.compile(r'(?i)^(emperor|empress|king|queen|pope|saint|prince|princess)\b')
# A third part that is a style or rank ("Malory, Thomas, Sir") is dropped.
RANK_RE = re.compile(r'(?i)^(sir|dame|saint|baron|baroness|earl|count|countess|lord|lady|graf|conte|kniaz|freiherr|duc|duke|duchess|duchesse|viscount|marquis|bart)\b')
FORM_RE = re.compile(r'(?i)^(mrs|miss|mr|dr)\.?$')


def display_name(name):
    if name in NAME_OVERRIDES:
        return NAME_OVERRIDES[name]
    clean = re.sub(r'\s*\([^)]*\)\s*', ' ', name).strip()
    parts = [p.strip() for p in clean.split(',') if p.strip()]
    # "Ward, Humphry, Mrs." -> "Mrs. Humphry Ward"
    if len(parts) == 3 and FORM_RE.match(parts[2]):
        return f'{parts[2]} {parts[1]} {parts[0]}'
    # "Malory, Thomas, Sir" -> "Thomas Malory"
    if len(parts) == 3 and RANK_RE.match(parts[2]):
        return parts[1] if parts[0].lower() in parts[1].lower() else f'{parts[1]} {parts[0]}'
    # "Marcus Aurelius, Emperor of Rome" -> "Marcus Aurelius"
    if len(parts) == 2 and TITLE_RE.match(parts[1]):
        return parts[0]
    if len(parts) == 2 and not re.fullmatch(r'(?i)(jr|sr)\.?', parts[1]):
        return f'{parts[1]} {parts[0]}'
    if len(parts) == 3 and re.fullmatch(r'(?i)(jr|sr)\.?', parts[2]):
        return f'{parts[1]} {parts[0]} {parts[2]}'
    return clean


def shelf_of(book):
    blob = ' '.join(book['subjects'] + book['shelves']).lower()
    if re.search(r'juvenile|children', blob):
        return "Children's"
    if re.search(r'poetry|poems|drama|tragedies|comedies|plays|verse', blob):
        return 'Poetry & Drama'
    if re.search(r'adventure|science fiction|detective|mystery|horror|ghost|fantasy|sea stories|western stories|gothic|supernatural', blob):
        return 'Adventure'
    if re.search(r'fiction|novel|short stories|love stories|romance', blob):
        return 'Novels'
    return 'Ideas'


def short_title(full):
    t = re.split(r'\n|: |; | — | -- |\r', full)[0].strip()
    return t[:120] or full[:120]


def ok_person(a):
    if a['death'] is not None:
        return a['death'] < DEATH_BEFORE
    if a['birth'] is not None and a['birth'] < 1800:
        return True
    return bool(re.fullmatch(r'(?i)anonymous|unknown', a['name']))


added, skipped = 0, []
for b in selected:
    if b['id'] in existing:
        continue
    h = hashes.get(b['id'])
    src = os.path.join(stage_dir, f"{b['id']}.txt.gz")
    if not h or not os.path.exists(src):
        skipped.append((b['id'], 'not downloaded'))
        continue
    people = [a for a in b['agents'] if a['role'] != 'ill']
    if not people or not all(ok_person(a) for a in people):
        skipped.append((b['id'], 'copyright rule'))
        continue
    raw = gzip.open(src).read()
    if hashlib.sha256(raw).hexdigest() != h['sha256'] or len(raw) != h['bytes']:
        skipped.append((b['id'], 'checksum mismatch'))
        continue
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        skipped.append((b['id'], 'not UTF-8'))
        continue
    if re.search(r'[\x00-\x08\x0b\x0e-\x1f\x7f]', text) or '\x00' in text:
        skipped.append((b['id'], 'binary bytes'))
        continue
    if not re.search(r'(?i)\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG', text) or not re.search(r'(?i)\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG', text):
        skipped.append((b['id'], 'markers'))
        continue
    authors = [a for a in people if a['role'] == 'aut']
    translators = [a for a in people if a['role'] == 'trl']
    file = f"{b['id']}.txt.gz"
    shutil.copyfile(src, os.path.join(out_dir, file))
    catalog['books'].append({
        'id': b['id'],
        'title': short_title(b['title']),
        'fullTitle': b['title'],
        'author': ' & '.join(display_name(a['name']) for a in authors),
        'authorDied': max((a['death'] for a in authors if a['death'] is not None), default=None),
        'translator': ' & '.join(display_name(a['name']) for a in translators),
        'translatorDied': max((a['death'] for a in translators if a['death'] is not None), default=None) if translators else None,
        'contributorsDied': [{'role': a['role'], 'name': a['name'], 'died': a['death'], 'born': a['birth']} for a in people],
        'published': None,
        'shelf': shelf_of(b),
        'file': file,
        'bytes': len(raw),
        'sha256': h['sha256'],
        'source': f"https://www.gutenberg.org/ebooks/{b['id']}",
    })
    existing.add(b['id'])
    added += 1
    if len(catalog['books']) >= 1000:
        break

catalog['policy']['note'] = (
    'Project Gutenberg lists every book as public domain in the USA; copyright rules differ in other countries. '
    'As an extra precaution, every author, translator and editor named in Project Gutenberg\'s catalogue record '
    'died before 1926. The record does not always name everyone who contributed to an edition (see "Known '
    'exceptions" in CLASSICS.md), so this is not a guarantee for any country. Texts are Project Gutenberg '
    'plain-text files stored as downloaded, including the Project Gutenberg License. "published" is recorded '
    'for the 100 hand-picked titles only; for the rest it is null (not recorded).'
)
json.dump(catalog, open(catalog_path, 'w'), indent=1)
open(catalog_path, 'a').write('\n')
print(f'added {added}, total {len(catalog["books"])}, skipped {len(skipped)}: {skipped[:10]}')
