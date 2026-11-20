"""Step 1: parse Project Gutenberg's bulk catalogue feed into compact JSON.

Download the feed (about 130 MB) from
https://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2
then run:  python3 -I 1-parse-catalog.py rdf-files.tar.bz2 catalog-all.json
The archive is read as a stream; nothing is extracted to disk.
"""
import sys, tarfile, re, json
from xml.etree import ElementTree as ET

src, out = sys.argv[1], sys.argv[2]
NS = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'dcterms': 'http://purl.org/dc/terms/',
    'pgterms': 'http://www.gutenberg.org/2009/pgterms/',
    'marcrel': 'http://id.loc.gov/vocabulary/relators/',
    'dcam': 'http://purl.org/dc/dcam/',
}
RDF_RES = '{%s}resource' % NS['rdf']
RDF_ABOUT = '{%s}about' % NS['rdf']

def agent(el):
    a = el.find('pgterms:agent', NS)
    if a is None: return None
    def num(tag):
        t = a.findtext(tag, default='', namespaces=NS).strip()
        return int(t) if re.fullmatch(r'-?\d+', t) else None
    return {'name': a.findtext('pgterms:name', default='', namespaces=NS).strip(), 'birth': num('pgterms:birthdate'), 'death': num('pgterms:deathdate')}

books = []
with tarfile.open(src, 'r:bz2') as tar:
    for m in tar:
        if not m.isfile() or not m.name.endswith('.rdf'): continue
        data = tar.extractfile(m).read()
        if len(data) > 5_000_000: continue
        try:
            root = ET.fromstring(data)
        except ET.ParseError:
            continue
        eb = root.find('pgterms:ebook', NS)
        if eb is None: continue
        about = eb.get(RDF_ABOUT, '')
        mid = re.search(r'ebooks/(\d+)$', about)
        if not mid: continue
        agents = []
        for child in eb:
            tag = child.tag
            if tag == '{%s}creator' % NS['dcterms']:
                role = 'aut'
            elif tag.startswith('{%s}' % NS['marcrel']):
                role = tag.split('}')[1]
            else:
                continue
            a = agent(child)
            if a: agents.append({'role': role, **a})
        langs = [v.text.strip() for v in eb.findall('dcterms:language/rdf:Description/rdf:value', NS) if v.text]
        typ = eb.findtext('dcterms:type/rdf:Description/rdf:value', default='', namespaces=NS)
        subjects = [v.text.strip() for v in eb.findall('dcterms:subject/rdf:Description/rdf:value', NS) if v.text]
        shelves = [v.text.strip() for v in eb.findall('pgterms:bookshelf/rdf:Description/rdf:value', NS) if v.text]
        txt_size = None
        for f in eb.findall('dcterms:hasFormat/pgterms:file', NS):
            url = f.get(RDF_ABOUT, '')
            fmts = [v.text for v in f.findall('dcterms:format/rdf:Description/rdf:value', NS) if v.text]
            if any(x.startswith('text/plain') for x in fmts) and re.search(r'/pg\d+\.txt$|/\d+-0\.txt$|\.txt\.utf-8$', url):
                ext = f.findtext('dcterms:extent', default='', namespaces=NS)
                if ext.isdigit(): txt_size = max(txt_size or 0, int(ext))
        dl = eb.findtext('pgterms:downloads', default='0', namespaces=NS)
        issued = eb.findtext('dcterms:issued', default='', namespaces=NS).strip()
        books.append({
            'id': int(mid.group(1)),
            'title': re.sub(r'\s+', ' ', eb.findtext('dcterms:title', default='', namespaces=NS)).strip(),
            'rights': eb.findtext('dcterms:rights', default='', namespaces=NS).strip(),
            'type': typ, 'languages': langs, 'downloads': int(dl) if dl.isdigit() else 0,
            'issued': issued, 'agents': agents, 'subjects': subjects, 'shelves': shelves, 'txtSize': txt_size,
        })
json.dump(books, open(out, 'w'))
print(len(books), 'records')
