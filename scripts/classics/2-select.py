"""Step 2: apply the copyright rule and pick the 1000 most-downloaded books.

  python3 -I 2-select.py catalog-all.json ../../src/renderer/classics/catalog.json selected.json

Rule: Project Gutenberg marks the book "Public domain in the USA" and every
author, translator and editor named in its catalogue record died before 1926.
(The record does not always name everyone who contributed to an edition, so
this lowers the risk outside the USA but does not prove anything about other
countries; see CLASSICS.md and LEGAL.md.) Also required: English, plain text, a named author. Excluded:
multiple/unknown authors ("Various"), single volumes of multi-volume sets,
uploads from 2025 onward (their download counts are inflated), reference works,
adult content, and Bibles (Crown rights in the UK). Duplicate editions of the
same title keep the most-downloaded one. Books already bundled are kept.

Anonymous works are protected for 70 years from publication in the EU, so a
book with an anonymous or unknown author is only allowed when its publication
date has been checked by hand and recorded in the catalog's
policy.vettedAnonymous list.
"""
import json, re, sys
books = json.load(open(sys.argv[1]))
current_catalog = json.load(open(sys.argv[2]))
current = {b['id'] for b in current_catalog['books']}
VETTED_ANONYMOUS = {int(i) for i in current_catalog['policy'].get('vettedAnonymous', {})}
# Checked by hand and left out on purpose.
REPLACED = 'title-page scan (November 2026): the edition contains work by someone missing from the catalogue record, or was first printed after 1930'
UNSUITABLE = 'left off the shelf by choice: the title reads badly out of context in a general reading app'
EXCLUDED = {
    17731: UNSUITABLE,
    40812: UNSUITABLE,
    26599: UNSUITABLE,
    23034: UNSUITABLE,
    26429: UNSUITABLE,
    20927: UNSUITABLE,
    37734: UNSUITABLE,
    27270: UNSUITABLE,
    58465: UNSUITABLE,
    10000: 'The Magna Carta: a compilation of translations from unknown sources',
    26558: 'Pennsylvania Dutch Cooking: anonymous booklet of unknown (probably 1960s) date',
    640: REPLACED,
    1353: REPLACED,
    1998: REPLACED,
    2085: REPLACED,
    2464: REPLACED,
    2527: REPLACED,
    2591: REPLACED,
    2760: REPLACED,
    3013: REPLACED,
    4558: REPLACED,
    5427: REPLACED,
    5615: REPLACED,
    6043: REPLACED,
    6761: REPLACED,
    6762: REPLACED,
    7176: REPLACED,
    7524: REPLACED,
    8120: REPLACED,
    8438: REPLACED,
    12242: REPLACED,
    15238: REPLACED,
    17611: REPLACED,
    17897: REPLACED,
    19942: REPLACED,
    21765: REPLACED,
    25012: REPLACED,
    26054: REPLACED,
    26073: REPLACED,
    29090: REPLACED,
    29091: REPLACED,
    29092: REPLACED,
    34607: REPLACED,
    34901: REPLACED,
    45109: REPLACED,
    50508: REPLACED,
    61729: REPLACED,
    72411: REPLACED,
}
DEATH_BEFORE = 1926
def ok_person(a):
    if a['death'] is not None: return a['death'] < DEATH_BEFORE
    if a['birth'] is not None and a['birth'] < 1800: return True
    return bool(re.fullmatch(r'(?i)anonymous|unknown', a['name']))
reasons = {}
def reject(r): reasons[r] = reasons.get(r, 0) + 1; return False
def passes(b):
    if b['id'] in EXCLUDED: return reject('excluded by hand')
    if b['type'] != 'Text': return reject('not text')
    if not b['rights'].startswith('Public domain in the USA'): return reject('rights')
    if b['languages'] != ['en']: return reject('not English')
    people = [a for a in b['agents'] if a['role'] != 'ill']
    if not any(a['role'] == 'aut' for a in people): return reject('no author')
    if any(re.fullmatch(r'(?i)various', a['name']) for a in people): return reject('various authors')
    if not all(ok_person(a) for a in people): return reject('contributor died 1926+ or unknown')
    if any(re.fullmatch(r'(?i)anonymous|unknown', a['name']) for a in people) and b['id'] not in VETTED_ANONYMOUS: return reject('anonymous, date not vetted')
    t = b['title'].lower()
    if 'bible' in t or t.startswith('index of the project gutenberg') or 'project gutenberg' in t: return reject('excluded title')
    if not b['txtSize'] or b['txtSize'] < 5000 or b['txtSize'] > 4_500_000: return reject('size')
    blob = ' '.join(b['subjects'] + b['shelves']).lower() + ' ' + t
    if re.search(r'\berotic|pornograph|sex instruction', blob): return reject('adult content')
    if re.search(r'dictionar|encyclop|catalogue of|glossary|concordance|index to|thesaurus', t): return reject('reference work')
    # New uploads get a burst of automated downloads; they are not "famous" yet.
    if b.get('issued', '') >= '2025-01-01' and b['id'] not in current: return reject('uploaded recently')
    # Single volumes of multi-volume sets.
    if re.search(r'(?i)\b(vol\.?|volume|part|book|tome|band)\s*([0-9]+|[ivxlc]+)\b|\(of \d+\)|\[vol', b['title']) and 'complete' not in t and b['id'] not in current: return reject('one volume of a set')
    return True
ok = [b for b in books if passes(b)]
def key(b):
    title = re.split(r'[:;\n]|, or,? ', b['title'].lower())[0]
    title = re.sub(r'[^a-z0-9 ]', '', title).strip()
    title = re.sub(r'^(the|a|an) ', '', title)
    author = next((a['name'] for a in b['agents'] if a['role'] == 'aut'), '')
    return (title, author.lower())
best = {}
for b in ok:
    k = key(b)
    if k not in best or (b['id'] in current) or (best[k]['id'] not in current and b['downloads'] > best[k]['downloads']):
        best[k] = b
pool = sorted(best.values(), key=lambda b: -b['downloads'])
chosen = [b for b in pool if b['id'] in current]
for b in pool:
    if len(chosen) >= 1000: break
    if b['id'] not in current: chosen.append(b)
print('records:', len(books), '| pass strict rule:', len(ok), '| after removing duplicate editions:', len(pool))
print('rejections:', dict(sorted(reasons.items(), key=lambda x: -x[1])))
print('chosen:', len(chosen), '| curated kept:', sum(b['id'] in current for b in chosen))
print('min downloads in selection:', min(b['downloads'] for b in chosen))
tot = sum(b['txtSize'] for b in chosen)
print('total text size: %.0f MB uncompressed (~%.0f MB gzip)' % (tot/1048576, tot/1048576*0.37))
json.dump(chosen, open(sys.argv[3], 'w'))
for b in chosen[100:130]: print('  ', b['downloads'], b['id'], b['title'][:60], '|', next(a['name'] for a in b['agents'] if a['role']=='aut'))
