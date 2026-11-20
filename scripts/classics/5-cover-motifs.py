"""Step 5: give every book on the Classics shelf a cover motif.

  python3 -I 5-cover-motifs.py catalog-all.json ../../src/renderer/classics/catalog.json

Covers are drawn by the app (src/renderer/js/ui/cover.js). Each one carries a
small emblem, and this step chooses which: a hand-picked one for the books
listed in PICKED, otherwise the first rule that matches the title, then the
Project Gutenberg subject headings, then a default for the shelf.

The choice is stored as "motif" in catalog.json. The names are the keys of
MOTIFS in cover.js; an unknown name fails the unit tests.
"""
import json, re, sys, zlib

all_path, catalog_path = sys.argv[1:3]

# Hand-picked: "motif: Gutenberg ids". Chosen for the story, not the title.
PICKED = """
ship: 3176 51060 8118 5658 13 421 1074 23489 25581 45988 1727 42389 25993 4085 228 13529 2331 22903 6317 32528 66785 24950 598 13650 976 5199
anchor: 821 245 10712 105 220 28357 22431 15076 26000 2360
whale: 2701 15 16865
wave: 76 7100 883 164 3160 6688 344 3011 3285 4232 994 45524 55262 66688 3261 41775 44425 25564 2825 45848 27784 160 27739 6626
island: 74 1900 521 1268 2434 1571 1728 56597 646 2130
mountain: 119 18857 8795 535 710 5998 27551 25355 652 22210 67684 6373 2184 28294 9294 32540 21291 60279 16550 2166 36557
tree: 1523 2009 8789 205 325 940 7986 768 5314 2995 25980 10148 4724 25596 44385 23798 59959 8700 49987 125 11703 367 11000 34081 36375 9622 2081
leaf: 1322 29433 512 22764 2355 1756 3773 232 23428 46921 39423 21682 26492 67691 62891 769 49513 27516 16594
flower: 33 208 8525 25609 163 1293 1608 447 8601 854 1429 22737 28407 3922 24518 16378 23700 36164 7074 31591 25965 62940 4507 20911 25185 246 2040 18500 19352 25290 15147 26368 23781
moon: 1514 910 83 128 10031 27202 24280 17135 18459 2587 10007 26282
sun: 86 55201 8800 27056 2944 33504 50572 58 45315 1450 39064 53276 23241 7952 498 21618 33447 525 27128 2131 11224
star: 3186 1004 2945 5683 9800 4208 6920 25519 27903 7256 40745 28247 19553 20758 26752 57821 4367 14668
bolt: 84 1540 51355 7735 22766 39272 26563 26778 14726 42474
candle: 30368 700 42486 3707 5500 35898 17860 70091 8578 654 621 1642 1726 26524 35110 56075 19447 26990 17366 10661 27288 12116 22269 22400 23772 27435 601 14474 47025 1653 25709 3155 36725 14880 23786 61176
snowflake: 24022 520 2429 225 1597 513 27021 25494
bat: 345 1001 6087 14833 2400 25929
paw: 3174 1093 2300 215 1539 3795 2885 14642 4039 10150 396 269 5324 19725 4341 1934 26500 43286 22965 45634 21973 19550 37925 30973
horse: 580 3177 1503 1636 16452 82 41 5921 55179 2383 25578 26318 271 16377 9320 66388 2145 615 4362 3335 57376
bird: 917 902 1228 25525 1065 1260 836 1640 27200 151 1754 50316 19188 48296 21111 27902 18338 5428 16341 7097 1658
rabbit: 11 55040 3698
snake: 26 1534 23661 2490 40686
crown: 1837 1532 1512 12 54 873 26939 28199 1738 14484 708 146 19068 2777 1259 4351 57037 67799 18442 9660 25622 3891 3580 32600 55300 610 3207
sword: 1533 2199 1257 7025 169 20002 1170 2850 21986 26216 46976 13549 23733 16528 12233 52734 38250 50750 46853 60184 847 7142 4361 1477 10907 61751
castle: 121 3409 49947 696 3268 1424 1184 479 11027 61475 64836 25174 12753 10940 42959 3600 26386 57374
house: 514 77 932 141 2870 25500 678 1688 15859 10002 507 394 1173 11667 49471 2667 22675 21829 52868 45502 203 3608 25648 23780 39260
heart: 1342 1513 1600 589 25001 28203 4264 179 41085 19771 4274 2776 67363 257 2002 47677 21700 2413 27711 53416 468 8197 29868 49806 35548 3296 171 35977 17460 4099 22650 71162 3166
key: 963 28885 113 145 1002 71 1657 2851 25496 1057 134 202 55618 11030 57669 8954 17851 27763 935 10766 63203 26659 1016 28696 27942 51649
skull: 1524 120 376 1063 219 773 4366 23789 28074 65341 10800
mask: 844 1064 1531 1519 21816 790 1227 946 2165 5333 901 383 1240 30201 12587 2759 1346 26640 1430 20657 37431 31 1974 1735 5300 18547 50439 44566 599 1929 1292 29391 42332 56940 24253
quill: 766 882 3189 3250 3172 1041 11231 1212 492 5978 887 33979 1056 38049 28289 14860 2048 12843 575 1745 7409 5429 6081 8775 8813 44520 1080 1051 3913 9371 56621 71433 22088 17797 25851 1026 409 15399 44802 21677 3020 47790 14766 8663 3875 43453 71893 7923 1365
column: 1497 2680 4280 5669 18000 3178 56463 14988 1177 4705 2849 24526 10827 23639 23349 65392 11937 1404 53799 15665 14400 26861 61178 27114 18893 22591 55108 64576
scales: 1023 1656 1515 13726 1750 3045 3251 5682 3760 2153 1171 58750 4320 11136 3420 2428 27869 17845 55308 46743 7370 30802 45580 8642 65739 4239 27083
compass: 914 2895 3748 432 3704 1646 26624 39827 5684 13514 1022 59 20004 5131 57426 8106 1039 8419 27394 26334 73584 6593 7469 177 55387
balloon: 103 3526 91 22566 697 40361
windmill: 996 1595 25485
magnifier: 564 102 2010 155 25548 5117 4723 3800 33944 15491 22748 59899 747 20001 26425
flask: 43 14591 19002 32094 4081 30775 42709 22914 18467
coins: 968 61522 550 2021 5231 770 370 36541 3300 4359 8581 43855 33310 34463 70377 2810 23745 5348 12345 59844 57359 26485 4028 23184 57260 165
book: 967 2788 608 5946 811 16287 52821 767 10378 26122 2376 27742 22136 26378 1480 23 24898 72554 44653 20847 14640 36722 1643 2044 851
scroll: 3188 131 1616 1672 1174 2848 16878 54161 27027 25810 3330 51143 20321 64037 65247 68419 27901 48967 26134 25353 27430 45950 50573 15263 1 21130 68744 7924
hourglass: 1400 13707 837 974 60976 779 375 15784 2808 1079 624 18247 3350 53277 44028 70420 10662
flag: 98 675 1874 73 1301 27494 61 4 53874 27680 60479 25132 20928 21427 25163 21990 11982 36542 6 34232 147 21210 4010
ghost: 46 1289 14522 209 583 9182 23172 792 28513 61730 22246 1210 8121 34704
wand: 55 620 17314 503 60766 38488 41006 58057 57
letter: 921 885 161 42078 1510 142 2160 3361 40426 6124 23280 50857 32155 18590 70593
note: 1526 619 3499 1635 21957 50473 22793 20476 1279 44798
frame: 174 2715 34970 158 969 774 30325 45410 25632 22121 28299 17196 54219 12700 27340 2398 46915 16199
pot: 730 10136 53489 12238 72482 65061 54138 59828
gear: 786 70 1164 33361 4763 30486 4276 5116 4583 1951 22298 31193 4238 42602 41538 27613 26657 6435 876 1906 74864
planet: 1572 32037 4391 19476 39713 27378
laurel: 1522 48895 26716 6312 1091 32242 15877 3794 674 7959 59007 50307 1962 65987 4928 2853 3567 47676 59455
ship: 829 944
leaf: 23354
planet: 68693
sun: 57375
crown: 44646 27157
letter: 6053
balloon: 30726
quill: 55749 4499
sword: 67804
candle: 27997 24238 25833 386
key: 46276
laurel: 1591 6798
flower: 2787 23736
compass: 27476 70796
coins: 368
column: 9097
scroll: 19146
flag: 1017
tree: 69258
mountain: 6615
wand: 2198
house: 24599
ghost: 5164
planet: 8209
note: 50852
paw: 29756
key: 99
column: 6031
candle: 137
mountain: 10012
quill: 2061
"""

# Fallbacks for everything else. First match wins: titles, then subject headings.
TITLE_RULES = [
    (r'\bwhal', 'whale'), (r'\b(pirate|buccaneer)', 'skull'), (r'\b(island|isle)s?\b', 'island'),
    (r'\b(ship|sail|voyage|mariner|navy|naval|cruise|frigate|sea)\b', 'ship'), (r'\b(river|lake|ocean|waves?|flood)\b', 'wave'),
    (r'\b(mountain|alps|sierra|peak)', 'mountain'), (r'\b(forest|woods?|jungle|trees?|oak)\b', 'tree'),
    (r'\b(garden|flowers?|rose|lily|lilies|blossom)\b', 'flower'), (r'\b(leaves|herb|botan|plants?|vegetable)', 'leaf'),
    (r'\b(christmas|winter|snow|frost|arctic|polar)', 'snowflake'), (r'\b(moon|night|dream)', 'moon'),
    (r'\b(astronom|stars?|heavens)\b', 'star'), (r'\b(electric|lightning|storm|thunder)', 'bolt'),
    (r'\b(vampire|vampyre)', 'bat'), (r'\b(ghost|haunt|spectre|phantom|apparition)', 'ghost'),
    (r'\b(dogs?|wolf|wolves|cats?|animals?|beasts?|lion|tiger|bear)\b', 'paw'), (r'\b(horse|rider|cavalry)', 'horse'),
    (r'\b(birds?|raven|nightingale|eagle|swan)\b', 'bird'), (r'\b(serpent|snake|dragon)', 'snake'),
    (r'\b(king|queen|prince|princess|emperor|empress|crown|court)\b', 'crown'),
    (r'\b(war|wars|battle|sword|knight|soldier|army|campaign|conquest)\b', 'sword'), (r'\b(castle|abbey|tower)', 'castle'),
    (r'\b(magic|wizard|fairy|fairies|witch|enchant)', 'wand'), (r'\b(cook|cookery|kitchen|recipe)', 'pot'),
    (r'\b(music|song|songs|ballad|hymn|opera)', 'note'), (r'\b(painting|painter|picture|portrait|drawing|art)\b', 'frame'),
    (r'\b(letters|correspondence|epistle)', 'letter'), (r'\b(machine|engine|mechanic|invention|steam)', 'gear'),
    (r'\b(money|wealth|rich|capital|fortune|gold|bank)', 'coins'), (r'\b(law|laws|justice|rights|trial)\b', 'scales'),
    (r'\b(secret|mystery|mysteries)\b', 'key'), (r'\b(death|dead|grave|murder)', 'skull'),
    (r'\b(travels?|journey|explor|expedition|adventures?)', 'compass'), (r'\b(love|heart|wife|husband|bride|marriage)', 'heart'),
    (r'\b(house|home|cottage|hall|farm|manor)\b', 'house'), (r'\b(poems?|poetical|poetry|verses?|sonnets)\b', 'quill'),
    (r'\b(plays?|comedy|comedies|tragedy|tragedies|drama)\b', 'mask'), (r'\b(history|chronicle|annals)', 'scroll'),
    (r'\b(memoirs?|autobiography|diary|journal|life of)\b', 'quill'), (r'\b(grammar|reader|education|dictionary)', 'book'),
]
SUBJECT_RULES = [
    (r'whaling', 'whale'), (r'pirates', 'skull'), (r'sea stories|seafaring|sailors|ship captains|shipwreck', 'ship'),
    (r'vampires', 'bat'), (r'ghost stories|paranormal|supernatural', 'ghost'), (r'horror tales|gothic fiction', 'castle'),
    (r'detective and mystery|mystery fiction', 'magnifier'), (r'science fiction|space', 'planet'),
    (r'fairy tales|fantasy|magic', 'wand'), (r'christmas stories', 'snowflake'), (r'western stories|horses', 'horse'),
    (r'animals|dogs', 'paw'), (r'birds', 'bird'), (r'war stories|knights and knighthood|arthurian|soldiers', 'sword'),
    (r'kings and rulers|courts and courtiers|queens', 'crown'), (r'love stories|man-woman relationships|courtship', 'heart'),
    (r'domestic fiction|country homes|families -- fiction|family life', 'house'), (r'epistolary', 'letter'),
    (r'tragedies|comedy plays|drama|comedies|satire|humorous', 'mask'), (r'epic poetry|mythology|classical literature', 'laurel'),
    (r'poetry', 'quill'), (r'voyages and travels|description and travel|adventure stories|discoveries', 'compass'),
    (r'frontier and pioneer|indians of north america', 'tree'), (r'cooking|cookery', 'pot'),
    (r'^(M|ML|MT)$|music', 'note'), (r'^N[A-Z]?$|painting|art --', 'frame'), (r'^K[A-Z]*$|law --', 'scales'),
    (r'economics|^H[BCDGJ]$|finance|wealth', 'coins'), (r'^QB$|astronomy', 'star'), (r'^Q[KH]$|botany|natural history', 'leaf'),
    (r'^QL$|zoology', 'paw'), (r'^(Q[A-Z]?|R[A-Z]?|T[A-Z]?)$|science|medicine|chemistry', 'flask'),
    (r'^(E\d*|F\d*)$|united states -- history', 'flag'), (r'^D[A-Z]?$|history', 'scroll'),
    (r'^B[LMPQRSTVX]$|religio|theology|christian|sermons', 'candle'), (r'^(B|B[CDHJ])$|philosophy|ethics|political science|^J[A-Z]?$', 'column'),
    (r'biography|autobiograph', 'quill'), (r'historical fiction', 'hourglass'), (r'^(L[A-Z]?|P[EN])$|education|readers', 'book'),
]
SHELF_DEFAULTS = {
    'Novels': ['house', 'heart', 'key', 'hourglass', 'letter'],
    'Ideas': ['book', 'scroll', 'candle', 'column'],
    'Poetry & Drama': ['quill', 'mask', 'laurel'],
    'Adventure': ['compass', 'mountain', 'ship'],
    "Children's": ['star', 'balloon', 'wand'],
}

picked = {}
for line in PICKED.strip().splitlines():
    name, ids = line.split(':')
    for i in ids.split():
        assert int(i) not in picked, 'picked twice: ' + i
        picked[int(i)] = name.strip()

subjects = {b['id']: b.get('subjects', []) for b in json.load(open(all_path))}
catalog = json.load(open(catalog_path))
ids = {b['id'] for b in catalog['books']}
unknown = sorted(set(picked) - ids)
assert not unknown, 'picked ids not on the shelf: %s' % unknown


def choose(book):
    if book['id'] in picked:
        return picked[book['id']], 'picked'
    title = book['title'].lower()
    for pattern, name in TITLE_RULES:
        if re.search(pattern, title):
            return name, 'title'
    for pattern, name in SUBJECT_RULES:
        for s in subjects.get(book['id'], []):
            if re.search(pattern, s if re.fullmatch(r'[A-Z]+\d*', s) else s.lower()):
                return name, 'subject'
    options = SHELF_DEFAULTS[book['shelf']]
    return options[zlib.crc32(book['title'].encode()) % len(options)], 'shelf'


how = {}
for book in catalog['books']:
    book['motif'], source = choose(book)
    how.setdefault(source, []).append(book)
json.dump(catalog, open(catalog_path, 'w'), indent=1)
open(catalog_path, 'a').write('\n')
print({k: len(v) for k, v in how.items()})
if '--list' in sys.argv:
    for source in ('title', 'subject', 'shelf'):
        for book in how.get(source, []):
            print('%s|%d|%s|%s|%s' % (source[:2], book['id'], book['motif'], book['title'][:46], book['author'][:22]))
