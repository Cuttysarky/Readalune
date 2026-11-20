# Bundled classics

Readalune includes 1,000 books from [Project Gutenberg](https://www.gutenberg.org). They are on the **Classics** tab in the library and can be added to your library offline.

**In short:** Project Gutenberg lists every one of these books as public domain in the United States. Copyright rules are different in other countries, and some of these books may still be protected where you live. If you are outside the United States, check before you read, copy or share them. This page is not legal advice; see [LEGAL.md](LEGAL.md).

## Why these books can be shared

- **Public domain in the United States, according to Project Gutenberg.** The selection scripts only accepted books that Project Gutenberg's catalogue marks "Public domain in the USA". Readalune relies on that assessment and has not researched each title itself.
- **Stored as downloaded.** The files are Project Gutenberg's plain-text editions, compressed with gzip and otherwise unchanged. Each one keeps Project Gutenberg's header and the full Project Gutenberg License at its end, as that license asks when a text is shared under the Project Gutenberg name.
- **Free of charge.** Readalune is given away free, which the Project Gutenberg License requires for texts shared this way.
- **Checked files.** A SHA-256 checksum taken at download time is recorded for each file in `catalog.json`. The tests check every file against it, and the app checks a book again when you add it.

## Outside the United States

A book that is free to share in the United States can still be under copyright in another country. Every bundled file opens with Project Gutenberg's own notice: "If you are not located in the United States, you will have to check the laws of the country where you are located before using this eBook."

To lower that risk, a book was only selected if **every author, translator and editor named in Project Gutenberg's catalogue record died before 1926**. The "Catalogued contributors died" column below shows those years. Where the record gives no year of death, the book was only accepted if the person was born before 1800 or the work is anonymous; the column shows those cases too. Anonymous works were only included when a source or date could be found by hand (see `policy.vettedAnonymous` in `catalog.json`).

This rule has limits, and it is not a promise about any country:

- It works on catalogue records, not on the books. The records do not always name the person who wrote an introduction or notes, and sometimes not the translator.
- The year a book was first published is only recorded for the first 100 titles, where it was entered by hand. For a translation it is sometimes the year of the original work and sometimes the year of the translation. For the other 900 titles the column says "not recorded".
- A scan of title pages (see below) is not the same as reading every book.

## Known exception

In November 2026 the title pages of all bundled files were scanned for contributors missing from the catalogue record. The scan found 38 editions with an introduction, notes or a translation by someone not in the record, or first printed after 1930. 37 of them were replaced with other classics whose title pages name nobody but the catalogued authors.

One is kept: *Pride and Prejudice*. Project Gutenberg has no plain-text edition of the novel without this preface. George Saintsbury died in 1933, so his preface is in the public domain in the United States and in countries where copyright lasts 70 or 80 years after the author's death. It may still be protected in the few countries with a longer term (for example Mexico, 100 years).

The scan only read title pages. It can miss an unsigned introduction or a contributor named deeper in a book, so this is still not a guarantee.

| Project Gutenberg | Title | What the bundled edition contains |
|---|---|---|
| [#1342](https://www.gutenberg.org/ebooks/1342) | Pride and Prejudice | Preface by George Saintsbury (died 1933), written for the 1894 edition |

## How the list was made

The first 100 titles were picked by hand (`scripts/fetch-classics.mjs`). The other 900 were taken, in order of popularity, from the Project Gutenberg books that passed the rules above (`scripts/classics/`). The tests in `test/unit/classics.test.mjs` re-check the catalogue rules and every file. The original text of each book is in this repository as `src/renderer/classics/<number>.txt.gz`, and on the Project Gutenberg page linked in the last column.

Readalune is not affiliated with or endorsed by Project Gutenberg. "Project Gutenberg" is a registered trademark of the Project Gutenberg Literary Archive Foundation; the name is used here to say where the texts come from.

## The books

| # | Title | Author | First published | Translator | Catalogued contributors died | Project Gutenberg |
|---|---|---|---|---|---|---|
| 1 | Pride and Prejudice | Jane Austen | 1813 | — | 1817 | [#1342](https://www.gutenberg.org/ebooks/1342) |
| 2 | Frankenstein | Mary Wollstonecraft Shelley | 1818 | — | 1851 | [#84](https://www.gutenberg.org/ebooks/84) |
| 3 | Moby Dick | Herman Melville | 1851 | — | 1891 | [#2701](https://www.gutenberg.org/ebooks/2701) |
| 4 | Jane Eyre | Charlotte Brontë | 1847 | — | 1855 | [#1260](https://www.gutenberg.org/ebooks/1260) |
| 5 | Wuthering Heights | Emily Brontë | 1847 | — | 1848 | [#768](https://www.gutenberg.org/ebooks/768) |
| 6 | A Tale of Two Cities | Charles Dickens | 1859 | — | 1870 | [#98](https://www.gutenberg.org/ebooks/98) |
| 7 | Great Expectations | Charles Dickens | 1861 | — | 1870 | [#1400](https://www.gutenberg.org/ebooks/1400) |
| 8 | The Picture of Dorian Gray | Oscar Wilde | 1890 | — | 1900 | [#174](https://www.gutenberg.org/ebooks/174) |
| 9 | Dracula | Bram Stoker | 1897 | — | 1912 | [#345](https://www.gutenberg.org/ebooks/345) |
| 10 | Adventures of Huckleberry Finn | Mark Twain | 1884 | — | 1910 | [#76](https://www.gutenberg.org/ebooks/76) |
| 11 | The Adventures of Tom Sawyer | Mark Twain | 1876 | — | 1910 | [#74](https://www.gutenberg.org/ebooks/74) |
| 12 | Little Women | Louisa May Alcott | 1868 | — | 1888 | [#514](https://www.gutenberg.org/ebooks/514) |
| 13 | Emma | Jane Austen | 1815 | — | 1817 | [#158](https://www.gutenberg.org/ebooks/158) |
| 14 | Sense and Sensibility | Jane Austen | 1811 | — | 1817 | [#161](https://www.gutenberg.org/ebooks/161) |
| 15 | Persuasion | Jane Austen | 1817 | — | 1817 | [#105](https://www.gutenberg.org/ebooks/105) |
| 16 | Northanger Abbey | Jane Austen | 1817 | — | 1817 | [#121](https://www.gutenberg.org/ebooks/121) |
| 17 | Mansfield Park | Jane Austen | 1814 | — | 1817 | [#141](https://www.gutenberg.org/ebooks/141) |
| 18 | A Christmas Carol in Prose | Charles Dickens | 1843 | — | 1870 | [#46](https://www.gutenberg.org/ebooks/46) |
| 19 | Oliver Twist | Charles Dickens | 1838 | — | 1870 | [#730](https://www.gutenberg.org/ebooks/730) |
| 20 | David Copperfield | Charles Dickens | 1850 | — | 1870 | [#766](https://www.gutenberg.org/ebooks/766) |
| 21 | Bleak House | Charles Dickens | 1853 | — | 1870 | [#1023](https://www.gutenberg.org/ebooks/1023) |
| 22 | The Pickwick Papers | Charles Dickens | 1837 | — | 1870 | [#580](https://www.gutenberg.org/ebooks/580) |
| 23 | The Scarlet Letter | Nathaniel Hawthorne | 1850 | — | 1864 | [#33](https://www.gutenberg.org/ebooks/33) |
| 24 | Middlemarch | George Eliot | 1871 | — | 1880 | [#145](https://www.gutenberg.org/ebooks/145) |
| 25 | Silas Marner | George Eliot | 1861 | — | 1880 | [#550](https://www.gutenberg.org/ebooks/550) |
| 26 | Vanity Fair | William Makepeace Thackeray | 1848 | — | 1863 | [#599](https://www.gutenberg.org/ebooks/599) |
| 27 | Madame Bovary | Gustave Flaubert | 1857 | Eleanor Marx Aveling | 1880, 1898 | [#2413](https://www.gutenberg.org/ebooks/2413) |
| 28 | Don Quixote | Miguel de Cervantes Saavedra | 1605 | John Ormsby | 1616, 1895 | [#996](https://www.gutenberg.org/ebooks/996) |
| 29 | Uncle Tom's Cabin | Harriet Beecher Stowe | 1852 | — | 1896 | [#203](https://www.gutenberg.org/ebooks/203) |
| 30 | The Awakening, and Selected Short Stories | Kate Chopin | 1899 | — | 1904 | [#160](https://www.gutenberg.org/ebooks/160) |
| 31 | The Red Badge of Courage | Stephen Crane | 1895 | — | 1900 | [#73](https://www.gutenberg.org/ebooks/73) |
| 32 | The Turn of the Screw | Henry James | 1898 | — | 1916 | [#209](https://www.gutenberg.org/ebooks/209) |
| 33 | Heart of Darkness | Joseph Conrad | 1899 | — | 1924 | [#219](https://www.gutenberg.org/ebooks/219) |
| 34 | Lord Jim | Joseph Conrad | 1900 | — | 1924 | [#5658](https://www.gutenberg.org/ebooks/5658) |
| 35 | Gulliver's Travels | Jonathan Swift | 1726 | — | 1745 | [#829](https://www.gutenberg.org/ebooks/829) |
| 36 | Robinson Crusoe | Daniel Defoe | 1719 | — | 1731 | [#521](https://www.gutenberg.org/ebooks/521) |
| 37 | Ivanhoe | Walter Scott | 1819 | — | 1832 | [#82](https://www.gutenberg.org/ebooks/82) |
| 38 | The Last of the Mohicans | James Fenimore Cooper | 1826 | — | 1851 | [#940](https://www.gutenberg.org/ebooks/940) |
| 39 | Ben-Hur | Lew Wallace | 1880 | — | 1905 | [#2145](https://www.gutenberg.org/ebooks/2145) |
| 40 | The Pilgrim's Progress | John Bunyan | 1678 | — | 1688 | [#131](https://www.gutenberg.org/ebooks/131) |
| 41 | The Woman in White | Wilkie Collins | 1859 | — | 1889 | [#583](https://www.gutenberg.org/ebooks/583) |
| 42 | The Count of Monte Cristo | Alexandre Dumas & Auguste Maquet | 1844 | — | 1870, 1888 | [#1184](https://www.gutenberg.org/ebooks/1184) |
| 43 | The three musketeers | Alexandre Dumas & Auguste Maquet | 1844 | — | 1870, 1888 | [#1257](https://www.gutenberg.org/ebooks/1257) |
| 44 | Treasure Island | Robert Louis Stevenson | 1883 | — | 1894 | [#120](https://www.gutenberg.org/ebooks/120) |
| 45 | Strange Case of Dr Jekyll and Mr Hyde | Robert Louis Stevenson | 1886 | — | 1894 | [#43](https://www.gutenberg.org/ebooks/43) |
| 46 | Kidnapped | Robert Louis Stevenson | 1886 | — | 1894 | [#421](https://www.gutenberg.org/ebooks/421) |
| 47 | Twenty Thousand Leagues under the Sea | Jules Verne | 1870 | — | 1905 | [#164](https://www.gutenberg.org/ebooks/164) |
| 48 | Around the World in Eighty Days | Jules Verne | 1873 | George M. Towle | 1905, 1893 | [#103](https://www.gutenberg.org/ebooks/103) |
| 49 | A Journey to the Centre of the Earth | Jules Verne | 1864 | — | 1905 | [#18857](https://www.gutenberg.org/ebooks/18857) |
| 50 | The call of the wild | Jack London | 1903 | — | 1916 | [#215](https://www.gutenberg.org/ebooks/215) |
| 51 | White Fang | Jack London | 1906 | — | 1916 | [#910](https://www.gutenberg.org/ebooks/910) |
| 52 | King Solomon's Mines | H. Rider Haggard | 1885 | — | 1925 | [#2166](https://www.gutenberg.org/ebooks/2166) |
| 53 | The Legend of Sleepy Hollow | Washington Irving | 1820 | — | 1859 | [#41](https://www.gutenberg.org/ebooks/41) |
| 54 | The Fall of the House of Usher | Edgar Allan Poe | 1839 | — | 1849 | [#932](https://www.gutenberg.org/ebooks/932) |
| 55 | Alice's Adventures in Wonderland | Lewis Carroll | 1865 | — | 1898 | [#11](https://www.gutenberg.org/ebooks/11) |
| 56 | Through the Looking-Glass | Lewis Carroll | 1871 | — | 1898 | [#12](https://www.gutenberg.org/ebooks/12) |
| 57 | The Wonderful Wizard of Oz | L. Frank Baum | 1900 | — | 1919 | [#55](https://www.gutenberg.org/ebooks/55) |
| 58 | The Secret Garden | Frances Hodgson Burnett | 1911 | — | 1924 | [#113](https://www.gutenberg.org/ebooks/113) |
| 59 | A Little Princess | Frances Hodgson Burnett | 1905 | — | 1924 | [#146](https://www.gutenberg.org/ebooks/146) |
| 60 | Black Beauty | Anna Sewell | 1877 | — | 1878 | [#271](https://www.gutenberg.org/ebooks/271) |
| 61 | The Railway Children | E. Nesbit | 1906 | — | 1924 | [#1874](https://www.gutenberg.org/ebooks/1874) |
| 62 | Andersen's Fairy Tales | H. C. Andersen | 1835 | — | 1875 | [#1597](https://www.gutenberg.org/ebooks/1597) |
| 63 | The Arabian Nights Entertainments | Andrew Lang | 1898 | — | 1912 | [#128](https://www.gutenberg.org/ebooks/128) |
| 64 | Hamlet | William Shakespeare | 1603 | — | 1616 | [#1524](https://www.gutenberg.org/ebooks/1524) |
| 65 | Romeo and Juliet | William Shakespeare | 1597 | — | 1616 | [#1513](https://www.gutenberg.org/ebooks/1513) |
| 66 | Macbeth | William Shakespeare | 1623 | — | 1616 | [#1533](https://www.gutenberg.org/ebooks/1533) |
| 67 | A Midsummer Night's Dream | William Shakespeare | 1600 | — | 1616 | [#1514](https://www.gutenberg.org/ebooks/1514) |
| 68 | King Lear | William Shakespeare | 1608 | — | 1616 | [#1532](https://www.gutenberg.org/ebooks/1532) |
| 69 | Othello | William Shakespeare | 1622 | — | 1616 | [#1531](https://www.gutenberg.org/ebooks/1531) |
| 70 | The Importance of Being Earnest | Oscar Wilde | 1895 | — | 1900 | [#844](https://www.gutenberg.org/ebooks/844) |
| 71 | Leaves of Grass | Walt Whitman | 1855 | — | 1892 | [#1322](https://www.gutenberg.org/ebooks/1322) |
| 72 | The Rime of the Ancient Mariner | Samuel Taylor Coleridge | 1798 | — | 1834 | [#151](https://www.gutenberg.org/ebooks/151) |
| 73 | Paradise Lost | John Milton | 1667 | — | 1674 | [#26](https://www.gutenberg.org/ebooks/26) |
| 74 | Faust, Part One | Johann Wolfgang von Goethe | 1808 | Bayard Taylor | 1832, 1878 | [#14591](https://www.gutenberg.org/ebooks/14591) |
| 75 | The Odyssey | Homer | 1900 | Samuel Butler | 650 BC, 1902 | [#1727](https://www.gutenberg.org/ebooks/1727) |
| 76 | The Iliad | Homer | 1898 | Samuel Butler | 650 BC, 1902 | [#2199](https://www.gutenberg.org/ebooks/2199) |
| 77 | The divine comedy | Dante Alighieri | 1867 | Henry Francis Cary | 1321, 1844 | [#8800](https://www.gutenberg.org/ebooks/8800) |
| 78 | The Aeneid | Virgil | 1697 | John Dryden | 19 BC, 1700 | [#228](https://www.gutenberg.org/ebooks/228) |
| 79 | The Canterbury Tales, and Other Poems | Geoffrey Chaucer | 1400 | — | 1400, 1873 | [#2383](https://www.gutenberg.org/ebooks/2383) |
| 80 | The Republic | Plato | 1871 | Benjamin Jowett | 348 BC, 1893 | [#1497](https://www.gutenberg.org/ebooks/1497) |
| 81 | Meditations | Marcus Aurelius | 1862 | — | 180 | [#2680](https://www.gutenberg.org/ebooks/2680) |
| 82 | Leviathan | Thomas Hobbes | 1651 | — | 1679 | [#3207](https://www.gutenberg.org/ebooks/3207) |
| 83 | The Wealth of Nations | Adam Smith | 1776 | — | 1790 | [#3300](https://www.gutenberg.org/ebooks/3300) |
| 84 | On the Origin of Species | Charles Darwin | 1859 | — | 1882 | [#1228](https://www.gutenberg.org/ebooks/1228) |
| 85 | Common Sense | Thomas Paine | 1776 | — | 1809 | [#147](https://www.gutenberg.org/ebooks/147) |
| 86 | The Federalist Papers | Alexander Hamilton & John Jay & James Madison | 1788 | — | 1804, 1829, 1836 | [#1404](https://www.gutenberg.org/ebooks/1404) |
| 87 | The Communist Manifesto | Karl Marx & Friedrich Engels | 1848 | — | 1883, 1895 | [#61](https://www.gutenberg.org/ebooks/61) |
| 88 | Discourse on the Method | René Descartes | 1637 | John Veitch | 1650, 1894 | [#59](https://www.gutenberg.org/ebooks/59) |
| 89 | Walden | Henry David Thoreau | 1854 | — | 1862 | [#205](https://www.gutenberg.org/ebooks/205) |
| 90 | On the Duty of Civil Disobedience | Henry David Thoreau | 1849 | — | 1862 | [#71](https://www.gutenberg.org/ebooks/71) |
| 91 | Narrative of the Life of Frederick Douglass | Frederick Douglass | 1845 | — | 1895 | [#23](https://www.gutenberg.org/ebooks/23) |
| 92 | Up from Slavery | Booker T. Washington | 1901 | — | 1915 | [#2376](https://www.gutenberg.org/ebooks/2376) |
| 93 | A Vindication of the Rights of Woman | Mary Wollstonecraft | 1792 | — | 1797 | [#3420](https://www.gutenberg.org/ebooks/3420) |
| 94 | Utopia | Thomas More | 1516 | — | 1535, 1894 | [#2130](https://www.gutenberg.org/ebooks/2130) |
| 95 | The Analects of Confucius | Confucius | 1861 | James Legge | 479 BC, 1897 | [#3330](https://www.gutenberg.org/ebooks/3330) |
| 96 | Twenty years after | Alexandre Dumas & Auguste Maquet | not recorded | — | 1870, 1888 | [#1259](https://www.gutenberg.org/ebooks/1259) |
| 97 | Cranford | Elizabeth Cleghorn Gaskell | not recorded | — | 1865 | [#394](https://www.gutenberg.org/ebooks/394) |
| 98 | The Expedition of Humphry Clinker | T. Smollett | not recorded | — | 1771 | [#2160](https://www.gutenberg.org/ebooks/2160) |
| 99 | The String of Pearls | James Malcolm Rymer & Thomas Peckett Prest | not recorded | — | 1884, 1859 | [#59828](https://www.gutenberg.org/ebooks/59828) |
| 100 | The History of Tom Jones, a Foundling | Henry Fielding | not recorded | — | 1754 | [#6593](https://www.gutenberg.org/ebooks/6593) |
| 101 | The Adventures of Roderick Random | T. Smollett | not recorded | — | 1771 | [#4085](https://www.gutenberg.org/ebooks/4085) |
| 102 | A Modest Proposal | Jonathan Swift | not recorded | — | 1745 | [#1080](https://www.gutenberg.org/ebooks/1080) |
| 103 | The Confessions of St. Augustine | Saint Augustine | not recorded | E. B. Pusey | 430, 1882 | [#3296](https://www.gutenberg.org/ebooks/3296) |
| 104 | Second Treatise of Government | John Locke | not recorded | — | 1704 | [#7370](https://www.gutenberg.org/ebooks/7370) |
| 105 | The problem of Cell 13 | Jacques Futrelle | not recorded | — | 1912 | [#57669](https://www.gutenberg.org/ebooks/57669) |
| 106 | The Interesting Narrative of the Life of Olaudah Equiano, Or Gustavus Vassa, The African | Olaudah Equiano | not recorded | — | 1797 | [#15399](https://www.gutenberg.org/ebooks/15399) |
| 107 | Flower, Fruit, and Thorn Pieces | Jean Paul | not recorded | A. Ewing | 1825, 1895 | [#36164](https://www.gutenberg.org/ebooks/36164) |
| 108 | The Cask of Amontillado | Edgar Allan Poe | not recorded | — | 1849 | [#1063](https://www.gutenberg.org/ebooks/1063) |
| 109 | Carmilla | Joseph Sheridan Le Fanu | not recorded | — | 1873 | [#10007](https://www.gutenberg.org/ebooks/10007) |
| 110 | The Mystery of Edwin Drood | Charles Dickens | not recorded | — | 1870 | [#564](https://www.gutenberg.org/ebooks/564) |
| 111 | The Monk | M. G. Lewis | not recorded | — | 1818 | [#601](https://www.gutenberg.org/ebooks/601) |
| 112 | Narrative of the Captivity and Restoration of Mrs. Mary Rowlandson | Mary White Rowlandson | not recorded | — | 1711 | [#851](https://www.gutenberg.org/ebooks/851) |
| 113 | The Moonstone | Wilkie Collins | not recorded | — | 1889 | [#155](https://www.gutenberg.org/ebooks/155) |
| 114 | Life on the Mississippi | Mark Twain | not recorded | — | 1910 | [#245](https://www.gutenberg.org/ebooks/245) |
| 115 | Catriona | Robert Louis Stevenson | not recorded | — | 1894 | [#589](https://www.gutenberg.org/ebooks/589) |
| 116 | Manon Lescaut | abbé Prévost | not recorded | — | 1763 | [#468](https://www.gutenberg.org/ebooks/468) |
| 117 | Essays of Michel de Montaigne | Michel de Montaigne | not recorded | Charles Cotton | 1592, 1913, 1687 | [#3600](https://www.gutenberg.org/ebooks/3600) |
| 118 | The Secret Agent | Joseph Conrad | not recorded | — | 1924 | [#974](https://www.gutenberg.org/ebooks/974) |
| 119 | The Critique of Pure Reason | Immanuel Kant | not recorded | J. M. D. Meiklejohn | 1804, 1902 | [#4280](https://www.gutenberg.org/ebooks/4280) |
| 120 | Apology | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1656](https://www.gutenberg.org/ebooks/1656) |
| 121 | De Profundis | Oscar Wilde | not recorded | — | 1900 | [#921](https://www.gutenberg.org/ebooks/921) |
| 122 | Antiquities of the Jews | Flavius Josephus | not recorded | William Whiston | Josephus, Flavius (b. 37), 1752 | [#2848](https://www.gutenberg.org/ebooks/2848) |
| 123 | Sonnets from the Portuguese | Elizabeth Barrett Browning | not recorded | — | 1861 | [#2002](https://www.gutenberg.org/ebooks/2002) |
| 124 | As a man thinketh | James Allen | not recorded | — | 1912 | [#4507](https://www.gutenberg.org/ebooks/4507) |
| 125 | Songs of Innocence and of Experience | William Blake | not recorded | — | 1827 | [#1934](https://www.gutenberg.org/ebooks/1934) |
| 126 | Love and Freindship [sic] | Jane Austen | not recorded | — | 1817 | [#1212](https://www.gutenberg.org/ebooks/1212) |
| 127 | The Riddle of the Sands | Erskine Childers | not recorded | — | 1922 | [#2360](https://www.gutenberg.org/ebooks/2360) |
| 128 | The Gift of the Magi | O. Henry | not recorded | — | 1910 | [#7256](https://www.gutenberg.org/ebooks/7256) |
| 129 | Symposium | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1600](https://www.gutenberg.org/ebooks/1600) |
| 130 | As You Like It | William Shakespeare | not recorded | — | 1616 | [#1523](https://www.gutenberg.org/ebooks/1523) |
| 131 | The History of the Peloponnesian War | Thucydides | not recorded | Richard Crawley | 395 BC, 1893 | [#7142](https://www.gutenberg.org/ebooks/7142) |
| 132 | Ethics | Benedictus de Spinoza | not recorded | R. H. M. Elwes | 1677, 1892 | [#3800](https://www.gutenberg.org/ebooks/3800) |
| 133 | Love's Labour's Lost | William Shakespeare | not recorded | — | 1616 | [#1510](https://www.gutenberg.org/ebooks/1510) |
| 134 | Camille (La Dame aux Camilias) | Alexandre Dumas | not recorded | — | 1895 | [#1608](https://www.gutenberg.org/ebooks/1608) |
| 135 | The Complete Herbal | Nicholas Culpeper | not recorded | — | 1654 | [#49513](https://www.gutenberg.org/ebooks/49513) |
| 136 | Essays | Ralph Waldo Emerson | not recorded | — | 1882 | [#2944](https://www.gutenberg.org/ebooks/2944) |
| 137 | The Sailor's Word-Book | W. H. Smyth | not recorded | — | 1865, 1877 | [#26000](https://www.gutenberg.org/ebooks/26000) |
| 138 | A Connecticut Yankee in King Arthur's Court | Mark Twain | not recorded | — | 1910 | [#86](https://www.gutenberg.org/ebooks/86) |
| 139 | Utilitarianism | John Stuart Mill | not recorded | — | 1873 | [#11224](https://www.gutenberg.org/ebooks/11224) |
| 140 | Phaedrus | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1636](https://www.gutenberg.org/ebooks/1636) |
| 141 | A Honeymoon in Space | George Chetwynd Griffith | not recorded | — | 1906 | [#19476](https://www.gutenberg.org/ebooks/19476) |
| 142 | The Anabasis of Alexander | Arrian | not recorded | E. J. Chinnock | 175, 1911 | [#46976](https://www.gutenberg.org/ebooks/46976) |
| 143 | The Prince and the Pauper | Mark Twain | not recorded | — | 1910 | [#1837](https://www.gutenberg.org/ebooks/1837) |
| 144 | Phaedo | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1658](https://www.gutenberg.org/ebooks/1658) |
| 145 | The Tragical History of Doctor Faustus | Christopher Marlowe | not recorded | — | 1593, 1869 | [#779](https://www.gutenberg.org/ebooks/779) |
| 146 | The Poetics of Aristotle | Aristotle | not recorded | S. H. Butcher | 322 BC, 1910 | [#1974](https://www.gutenberg.org/ebooks/1974) |
| 147 | The art of money getting | P. T. Barnum | not recorded | — | 1891 | [#8581](https://www.gutenberg.org/ebooks/8581) |
| 148 | Nature | Ralph Waldo Emerson | not recorded | — | 1882 | [#29433](https://www.gutenberg.org/ebooks/29433) |
| 149 | Fundamental Principles of the Metaphysic of Morals | Immanuel Kant | not recorded | Thomas Kingsmill Abbott | 1804, 1913 | [#5682](https://www.gutenberg.org/ebooks/5682) |
| 150 | Divine Comedy, Longfellow's Translation, Hell | Dante Alighieri | not recorded | Henry Wadsworth Longfellow | 1321, 1882 | [#1001](https://www.gutenberg.org/ebooks/1001) |
| 151 | A Selection from the Discourses of Epictetus with the Encheiridion | Epictetus | not recorded | George Long | 135, 1879 | [#10661](https://www.gutenberg.org/ebooks/10661) |
| 152 | A Pickle for the Knowing Ones | Timothy Dexter | not recorded | — | 1806 | [#43453](https://www.gutenberg.org/ebooks/43453) |
| 153 | Plutarch | Plutarch | not recorded | — | 119, 1861 | [#674](https://www.gutenberg.org/ebooks/674) |
| 154 | Anabasis | Xenophon | not recorded | Henry Graham Dakyns | 355 BC, 1911 | [#1170](https://www.gutenberg.org/ebooks/1170) |
| 155 | The Will to Believe, and Other Essays in Popular Philosophy | William James | not recorded | — | 1910 | [#26659](https://www.gutenberg.org/ebooks/26659) |
| 156 | Fifty years in Wall Street | Henry Clews | not recorded | — | 1923 | [#70377](https://www.gutenberg.org/ebooks/70377) |
| 157 | Incidents in the Life of a Slave Girl, Written by Herself | Harriet A. Jacobs | not recorded | — | 1897, 1880 | [#11030](https://www.gutenberg.org/ebooks/11030) |
| 158 | Lorna Doone | R. D. Blackmore | not recorded | — | 1900 | [#17460](https://www.gutenberg.org/ebooks/17460) |
| 159 | My Bondage and My Freedom | Frederick Douglass | not recorded | — | 1895 | [#202](https://www.gutenberg.org/ebooks/202) |
| 160 | The Love Letters of Henry VIII to Anne Boleyn | Henry VIII | not recorded | — | 1547 | [#32155](https://www.gutenberg.org/ebooks/32155) |
| 161 | The Story of the Great Fire in St. John, N.B., June 20th, 1877 | George Stewart | not recorded | — | 1906 | [#39260](https://www.gutenberg.org/ebooks/39260) |
| 162 | Hypnerotomachia | Francesco Colonna | not recorded | Robert Dallington | 1527, 1637 | [#18459](https://www.gutenberg.org/ebooks/18459) |
| 163 | Roughing It | Mark Twain | not recorded | — | 1910 | [#3177](https://www.gutenberg.org/ebooks/3177) |
| 164 | Jane Seton | James Grant | not recorded | — | 1887 | [#64836](https://www.gutenberg.org/ebooks/64836) |
| 165 | How the Other Half Lives | Jacob A. Riis | not recorded | — | 1914 | [#45502](https://www.gutenberg.org/ebooks/45502) |
| 166 | The Happy Prince, and Other Tales | Oscar Wilde | not recorded | — | 1900 | [#902](https://www.gutenberg.org/ebooks/902) |
| 167 | The Vampyre | John William Polidori | not recorded | — | 1821 | [#6087](https://www.gutenberg.org/ebooks/6087) |
| 168 | Bartleby, the Scrivener | Herman Melville | not recorded | — | 1891 | [#11231](https://www.gutenberg.org/ebooks/11231) |
| 169 | Henrietta Temple | Benjamin Disraeli | not recorded | — | 1881 | [#19771](https://www.gutenberg.org/ebooks/19771) |
| 170 | The Life of Charles Dickens, Vol. I-III, Complete | John Forster | not recorded | — | 1876 | [#25851](https://www.gutenberg.org/ebooks/25851) |
| 171 | Shakespeare's Sonnets | William Shakespeare | not recorded | — | 1616 | [#1041](https://www.gutenberg.org/ebooks/1041) |
| 172 | A Treatise of Human Nature | David Hume | not recorded | — | 1776 | [#4705](https://www.gutenberg.org/ebooks/4705) |
| 173 | Eighty Years and More | Elizabeth Cady Stanton | not recorded | — | 1902 | [#11982](https://www.gutenberg.org/ebooks/11982) |
| 174 | The Mysterious Island | Jules Verne | not recorded | Agnes Kinloch Kingston | 1905, 1913 | [#1268](https://www.gutenberg.org/ebooks/1268) |
| 175 | Moods | Louisa May Alcott | not recorded | — | 1888 | [#28203](https://www.gutenberg.org/ebooks/28203) |
| 176 | The First of the English | Archibald Clavering Gunter | not recorded | — | 1907 | [#67804](https://www.gutenberg.org/ebooks/67804) |
| 177 | The life and opinions of Tristram Shandy, gentleman | Laurence Sterne | not recorded | — | 1768 | [#1079](https://www.gutenberg.org/ebooks/1079) |
| 178 | Confessions of an English Opium-Eater | Thomas De Quincey | not recorded | — | 1859 | [#2040](https://www.gutenberg.org/ebooks/2040) |
| 179 | Plutarch's Morals | Plutarch | not recorded | A. R. Shilleto | 119, 1894 | [#23639](https://www.gutenberg.org/ebooks/23639) |
| 180 | The Marriage of Heaven and Hell | William Blake | not recorded | — | 1827 | [#45315](https://www.gutenberg.org/ebooks/45315) |
| 181 | Friday, the Thirteenth | Thomas William Lawson | not recorded | — | 1925 | [#12345](https://www.gutenberg.org/ebooks/12345) |
| 182 | Robert Orange | John Oliver Hobbes | not recorded | — | 1906 | [#27997](https://www.gutenberg.org/ebooks/27997) |
| 183 | The Declaration of Independence of the United States of America | Thomas Jefferson | not recorded | — | 1826 | [#1](https://www.gutenberg.org/ebooks/1) |
| 184 | Science in the Kitchen | E. E. Kellogg | not recorded | — | 1920 | [#12238](https://www.gutenberg.org/ebooks/12238) |
| 185 | Don Juan | Lord Byron | not recorded | — | 1824 | [#21700](https://www.gutenberg.org/ebooks/21700) |
| 186 | The History of Don Quixote, Volume 1, Complete | Miguel de Cervantes Saavedra | not recorded | John Ormsby | 1616, 1895 | [#5921](https://www.gutenberg.org/ebooks/5921) |
| 187 | The Wars of the Jews | Flavius Josephus | not recorded | William Whiston | Josephus, Flavius (b. 37), 1752 | [#2850](https://www.gutenberg.org/ebooks/2850) |
| 188 | Gorgias | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1672](https://www.gutenberg.org/ebooks/1672) |
| 189 | The Castle of Otranto | Horace Walpole | not recorded | — | 1797, 1894 | [#696](https://www.gutenberg.org/ebooks/696) |
| 190 | Following the Equator | Mark Twain | not recorded | — | 1910 | [#2895](https://www.gutenberg.org/ebooks/2895) |
| 191 | Hard Times | Charles Dickens | not recorded | — | 1870 | [#786](https://www.gutenberg.org/ebooks/786) |
| 192 | Personal Memoirs of U. S. Grant, Complete | Ulysses S. Grant | not recorded | — | 1885 | [#4367](https://www.gutenberg.org/ebooks/4367) |
| 193 | The Works of the Rev. Hugh Binning | Hugh Binning | not recorded | — | 1653 | [#24238](https://www.gutenberg.org/ebooks/24238) |
| 194 | The Republic of Plato | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#55201](https://www.gutenberg.org/ebooks/55201) |
| 195 | Childe Harold's Pilgrimage | Lord Byron | not recorded | — | 1824 | [#5131](https://www.gutenberg.org/ebooks/5131) |
| 196 | The complete works of John Gower, volume 2 | John Gower | not recorded | — | 1408, 1915 | [#71162](https://www.gutenberg.org/ebooks/71162) |
| 197 | The iron heel | Jack London | not recorded | — | 1916 | [#1164](https://www.gutenberg.org/ebooks/1164) |
| 198 | The Principles of Scientific Management | Frederick Winslow Taylor | not recorded | — | 1915 | [#6435](https://www.gutenberg.org/ebooks/6435) |
| 199 | The Mysteries of Udolpho | Ann Ward Radcliffe | not recorded | — | 1823 | [#3268](https://www.gutenberg.org/ebooks/3268) |
| 200 | The Damned Thing | Ambrose Bierce | not recorded | — | 1913 | [#23172](https://www.gutenberg.org/ebooks/23172) |
| 201 | The Pirate | Walter Scott | not recorded | — | 1832, 1912 | [#42389](https://www.gutenberg.org/ebooks/42389) |
| 202 | Practical Mechanics for Boys | James Slough Zerbe | not recorded | — | 1921 | [#22298](https://www.gutenberg.org/ebooks/22298) |
| 203 | Pragmatism | William James | not recorded | — | 1910 | [#5116](https://www.gutenberg.org/ebooks/5116) |
| 204 | The Science of Getting Rich | W. D. Wattles | not recorded | — | 1911 | [#59844](https://www.gutenberg.org/ebooks/59844) |
| 205 | The Four Million | O. Henry | not recorded | — | 1910 | [#2776](https://www.gutenberg.org/ebooks/2776) |
| 206 | Struwwelpeter | Heinrich Hoffmann | not recorded | — | 1894 | [#12116](https://www.gutenberg.org/ebooks/12116) |
| 207 | Thoughts of Marcus Aurelius Antoninus | Marcus Aurelius | not recorded | George Long | 180, 1879 | [#15877](https://www.gutenberg.org/ebooks/15877) |
| 208 | The Decameron of Giovanni Boccaccio | Giovanni Boccaccio | not recorded | John Payne | 1375, 1916 | [#23700](https://www.gutenberg.org/ebooks/23700) |
| 209 | North and South | Elizabeth Cleghorn Gaskell | not recorded | — | 1865 | [#4276](https://www.gutenberg.org/ebooks/4276) |
| 210 | Rip Van Winkle | Washington Irving | not recorded | — | 1859 | [#60976](https://www.gutenberg.org/ebooks/60976) |
| 211 | The Innocents Abroad | Mark Twain | not recorded | — | 1910 | [#3176](https://www.gutenberg.org/ebooks/3176) |
| 212 | The Crack of Doom | Robert Cromie | not recorded | — | 1907 | [#26563](https://www.gutenberg.org/ebooks/26563) |
| 213 | Myths of the Cherokee | James Mooney | not recorded | — | 1921 | [#45634](https://www.gutenberg.org/ebooks/45634) |
| 214 | Doctor Cupid | Rhoda Broughton | not recorded | — | 1920 | [#35548](https://www.gutenberg.org/ebooks/35548) |
| 215 | On the Cross | Wilhelmine von Hillern | not recorded | Mary J. Safford | 1916, 1916 | [#36725](https://www.gutenberg.org/ebooks/36725) |
| 216 | Household Tales by Brothers Grimm | Jacob Grimm & Wilhelm Grimm | not recorded | Hunt, Alfred William, Mrs. | 1863, 1859, 1912 | [#5314](https://www.gutenberg.org/ebooks/5314) |
| 217 | A System of Logic, Ratiocinative and Inductive | John Stuart Mill | not recorded | — | 1873 | [#27942](https://www.gutenberg.org/ebooks/27942) |
| 218 | The Varieties of Religious Experience | William James | not recorded | — | 1910 | [#621](https://www.gutenberg.org/ebooks/621) |
| 219 | An Occurrence at Owl Creek Bridge | Ambrose Bierce | not recorded | — | 1913 | [#375](https://www.gutenberg.org/ebooks/375) |
| 220 | The Lady of the Lake | Walter Scott | not recorded | — | 1832 | [#3011](https://www.gutenberg.org/ebooks/3011) |
| 221 | The Origin of Species by Means of Natural Selection | Charles Darwin | not recorded | — | 1882 | [#2009](https://www.gutenberg.org/ebooks/2009) |
| 222 | Monte-Cristo's Daughter | Edmund Flagg | not recorded | — | 1890 | [#23184](https://www.gutenberg.org/ebooks/23184) |
| 223 | Quo Vadis | Henryk Sienkiewicz | not recorded | Jeremiah Curtin | 1916, 1906 | [#2853](https://www.gutenberg.org/ebooks/2853) |
| 224 | From the Earth to the moon | Jules Verne | not recorded | — | 1905 | [#83](https://www.gutenberg.org/ebooks/83) |
| 225 | The Influence of Sea Power Upon History, 1660-1783 | A. T. Mahan | not recorded | — | 1914 | [#13529](https://www.gutenberg.org/ebooks/13529) |
| 226 | Language of Flowers | Kate Greenaway | not recorded | — | 1901 | [#31591](https://www.gutenberg.org/ebooks/31591) |
| 227 | Only a girl's love | Charles Garvice | not recorded | — | 1920 | [#53416](https://www.gutenberg.org/ebooks/53416) |
| 228 | The Entailed Hat | George Alfred Townsend | not recorded | — | 1914 | [#19146](https://www.gutenberg.org/ebooks/19146) |
| 229 | The Subjection of Women | John Stuart Mill | not recorded | — | 1873 | [#27083](https://www.gutenberg.org/ebooks/27083) |
| 230 | The Waterloo Roll Call | Charles Dalton | not recorded | — | 1913 | [#51143](https://www.gutenberg.org/ebooks/51143) |
| 231 | The Treasure of Pearls | Gustave Aimard | not recorded | Wraxall, Lascelles, Sir | 1883, 1865 | [#46276](https://www.gutenberg.org/ebooks/46276) |
| 232 | The History of Rome, Books 01 to 08 | Livy | not recorded | D. Spillan | 16, 1854 | [#19725](https://www.gutenberg.org/ebooks/19725) |
| 233 | Euthyphro | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1642](https://www.gutenberg.org/ebooks/1642) |
| 234 | Baron Trump's Marvellous Underground Journey | Ingersoll Lockwood | not recorded | — | 1918 | [#57426](https://www.gutenberg.org/ebooks/57426) |
| 235 | The History of Don Quixote, Volume 2, Complete | Miguel de Cervantes Saavedra | not recorded | John Ormsby | 1616, 1895 | [#5946](https://www.gutenberg.org/ebooks/5946) |
| 236 | The Imitation of Christ | à Kempis Thomas | not recorded | William Benham | 1471, 1910 | [#1653](https://www.gutenberg.org/ebooks/1653) |
| 237 | Sketches New and Old | Mark Twain | not recorded | — | 1910 | [#3189](https://www.gutenberg.org/ebooks/3189) |
| 238 | Riders to the Sea | J. M. Synge | not recorded | — | 1909 | [#994](https://www.gutenberg.org/ebooks/994) |
| 239 | The Horsewoman | Alice M. Hayes | not recorded | — | 1913, 1904 | [#26318](https://www.gutenberg.org/ebooks/26318) |
| 240 | South | Ernest Henry Shackleton | not recorded | — | 1922 | [#5199](https://www.gutenberg.org/ebooks/5199) |
| 241 | The Book of Household Management | Mrs. Beeton | not recorded | — | 1865 | [#10136](https://www.gutenberg.org/ebooks/10136) |
| 242 | The Garden Party, and Other Stories | Katherine Mansfield | not recorded | — | 1923 | [#1429](https://www.gutenberg.org/ebooks/1429) |
| 243 | Poems and Songs of Robert Burns | Robert Burns | not recorded | — | 1796 | [#1279](https://www.gutenberg.org/ebooks/1279) |
| 244 | Fairy Tales of Hans Christian Andersen | H. C. Andersen | not recorded | — | 1875 | [#27200](https://www.gutenberg.org/ebooks/27200) |
| 245 | The Grand Inquisitor | Fyodor Dostoyevsky | not recorded | H. P. Blavatsky | 1881, 1891 | [#8578](https://www.gutenberg.org/ebooks/8578) |
| 246 | One of the Six Hundred | James Grant | not recorded | — | 1887 | [#55179](https://www.gutenberg.org/ebooks/55179) |
| 247 | Linnet | Grant Allen | not recorded | — | 1899 | [#48296](https://www.gutenberg.org/ebooks/48296) |
| 248 | Biographia Literaria | Samuel Taylor Coleridge | not recorded | — | 1834 | [#6081](https://www.gutenberg.org/ebooks/6081) |
| 249 | Under the Red Dragon | James Grant | not recorded | — | 1887 | [#53874](https://www.gutenberg.org/ebooks/53874) |
| 250 | The Gilded Age | Mark Twain & Charles Dudley Warner | not recorded | — | 1910, 1900 | [#3178](https://www.gutenberg.org/ebooks/3178) |
| 251 | Forest Days | G. P. R. James | not recorded | — | 1860 | [#49987](https://www.gutenberg.org/ebooks/49987) |
| 252 | A Treatise on Domestic Economy | Catharine Esther Beecher | not recorded | — | 1878 | [#21829](https://www.gutenberg.org/ebooks/21829) |
| 253 | Plays by Anton Chekhov, Second Series | Anton Pavlovich Chekhov | not recorded | Julius West | 1904, 1918 | [#7986](https://www.gutenberg.org/ebooks/7986) |
| 254 | Memoirs of Extraordinary Popular Delusions and the Madness of Crowds | Charles Mackay | not recorded | — | 1889 | [#24518](https://www.gutenberg.org/ebooks/24518) |
| 255 | Mosses from an old manse | Nathaniel Hawthorne | not recorded | — | 1864 | [#512](https://www.gutenberg.org/ebooks/512) |
| 256 | The sea-gull | Anton Pavlovich Chekhov | not recorded | — | 1904 | [#1754](https://www.gutenberg.org/ebooks/1754) |
| 257 | Bradford's History of 'Plimoth Plantation' | William Bradford | not recorded | — | 1657 | [#24950](https://www.gutenberg.org/ebooks/24950) |
| 258 | The Anatomy of Melancholy | Robert Burton | not recorded | — | 1640 | [#10800](https://www.gutenberg.org/ebooks/10800) |
| 259 | The Canterville Ghost | Oscar Wilde | not recorded | — | 1900 | [#14522](https://www.gutenberg.org/ebooks/14522) |
| 260 | The History of Mary Prince, a West Indian Slave | Mary Prince | not recorded | — | 1833 | [#17851](https://www.gutenberg.org/ebooks/17851) |
| 261 | The Two Magics | Henry James | not recorded | — | 1916 | [#42486](https://www.gutenberg.org/ebooks/42486) |
| 262 | Plays of Sophocles | Sophocles | not recorded | Francis Storr | 406 BC, 1919 | [#31](https://www.gutenberg.org/ebooks/31) |
| 263 | Nicholas Nickleby | Charles Dickens | not recorded | — | 1870 | [#967](https://www.gutenberg.org/ebooks/967) |
| 264 | The Masque of the Red Death | Edgar Allan Poe | not recorded | — | 1849 | [#1064](https://www.gutenberg.org/ebooks/1064) |
| 265 | The Air Pirate | Guy Thorne | not recorded | — | 1923 | [#40361](https://www.gutenberg.org/ebooks/40361) |
| 266 | The Odyssey | Homer | not recorded | Alexander Pope | 650 BC, 1744 | [#3160](https://www.gutenberg.org/ebooks/3160) |
| 267 | Fox's Book of Martyrs | John Foxe | not recorded | — | 1587 | [#22400](https://www.gutenberg.org/ebooks/22400) |
| 268 | Lyrical Ballads, With a Few Other Poems (1798) | William Wordsworth & Samuel Taylor Coleridge | not recorded | — | 1850, 1834 | [#9622](https://www.gutenberg.org/ebooks/9622) |
| 269 | Discourses on the First Decade of Titus Livius | Niccolò Machiavelli | not recorded | Ninian Hill Thomson | 1527, 1921 | [#10827](https://www.gutenberg.org/ebooks/10827) |
| 270 | Opticks | Isaac Newton | not recorded | — | 1727 | [#33504](https://www.gutenberg.org/ebooks/33504) |
| 271 | Franklin's Way to Wealth | Benjamin Franklin | not recorded | — | 1790 | [#43855](https://www.gutenberg.org/ebooks/43855) |
| 272 | Cicero's Tusculan Disputations | Marcus Tullius Cicero | not recorded | Charles Duke Yonge | 43 BC, 1891 | [#14988](https://www.gutenberg.org/ebooks/14988) |
| 273 | Blue-grass and Broadway | Maria Thompson Daviess | not recorded | — | 1924 | [#29391](https://www.gutenberg.org/ebooks/29391) |
| 274 | Pharmacographia | Friedrich A. Flückiger & Daniel Hanbury | not recorded | — | 1894, 1875 | [#67691](https://www.gutenberg.org/ebooks/67691) |
| 275 | The Blue Fairy Book | Andrew Lang | not recorded | — | 1912 | [#503](https://www.gutenberg.org/ebooks/503) |
| 276 | A Little English Gallery | Louise Imogen Guiney | not recorded | — | 1920 | [#54219](https://www.gutenberg.org/ebooks/54219) |
| 277 | Novum organum | Francis Bacon | not recorded | — | 1626, 1897 | [#45988](https://www.gutenberg.org/ebooks/45988) |
| 278 | Cruel as the grave | Emma Dorothy Eliza Nevitte Southworth | not recorded | — | 1899 | [#23789](https://www.gutenberg.org/ebooks/23789) |
| 279 | The Merry Adventures of Robin Hood | Howard Pyle | not recorded | — | 1911 | [#10148](https://www.gutenberg.org/ebooks/10148) |
| 280 | Memoirs of the Author of a Vindication of the Rights of Woman | William Godwin | not recorded | — | 1836 | [#16199](https://www.gutenberg.org/ebooks/16199) |
| 281 | The Confessions of Jean Jacques Rousseau | Jean-Jacques Rousseau | not recorded | — | 1778 | [#3913](https://www.gutenberg.org/ebooks/3913) |
| 282 | The Manual of the Botany of the Northern United States | Asa Gray | not recorded | — | 1888 | [#39423](https://www.gutenberg.org/ebooks/39423) |
| 283 | The Journal of Sir Walter Scott | Walter Scott | not recorded | — | 1832, 1916 | [#14860](https://www.gutenberg.org/ebooks/14860) |
| 284 | The Complete Works of Robert Burns | Robert Burns & Allan Cunningham | not recorded | — | 1796, 1842 | [#18500](https://www.gutenberg.org/ebooks/18500) |
| 285 | The Critique of Practical Reason | Immanuel Kant | not recorded | Thomas Kingsmill Abbott | 1804, 1913 | [#5683](https://www.gutenberg.org/ebooks/5683) |
| 286 | The Mill on the Floss | George Eliot | not recorded | — | 1880 | [#6688](https://www.gutenberg.org/ebooks/6688) |
| 287 | The Essays or Counsels, Civil and Moral | Francis Bacon | not recorded | — | 1626 | [#575](https://www.gutenberg.org/ebooks/575) |
| 288 | Considerations on Representative Government | John Stuart Mill | not recorded | — | 1873 | [#5669](https://www.gutenberg.org/ebooks/5669) |
| 289 | The Crown of Wild Olive also Munera Pulveris | John Ruskin | not recorded | — | 1900 | [#26716](https://www.gutenberg.org/ebooks/26716) |
| 290 | Talks To Teachers On Psychology | William James | not recorded | — | 1910 | [#16287](https://www.gutenberg.org/ebooks/16287) |
| 291 | 1000 Mythological Characters Briefly Described | Edward Sylvester Ellis | not recorded | — | 1916 | [#42474](https://www.gutenberg.org/ebooks/42474) |
| 292 | Essays | Ralph Waldo Emerson | not recorded | — | 1882 | [#2945](https://www.gutenberg.org/ebooks/2945) |
| 293 | A Child's Garden of Verses | Robert Louis Stevenson | not recorded | — | 1894 | [#25609](https://www.gutenberg.org/ebooks/25609) |
| 294 | The Journals of Lewis and Clark, 1804-1806 | Meriwether Lewis & William Clark | not recorded | — | 1809, 1838 | [#8419](https://www.gutenberg.org/ebooks/8419) |
| 295 | The Book of the Courtier | Baldassare Castiglione | not recorded | Leonard Eckstein Opdycke | 1529, 1914 | [#67799](https://www.gutenberg.org/ebooks/67799) |
| 296 | The Works of Edgar Allan Poe, The Raven Edition | Edgar Allan Poe | not recorded | — | 1849 | [#25525](https://www.gutenberg.org/ebooks/25525) |
| 297 | Villette | Charlotte Brontë | not recorded | — | 1855 | [#9182](https://www.gutenberg.org/ebooks/9182) |
| 298 | The Psychology of Singing | David C. Taylor | not recorded | — | 1918 | [#21957](https://www.gutenberg.org/ebooks/21957) |
| 299 | The Fairy Mythology | Thomas Keightley | not recorded | — | 1872 | [#41006](https://www.gutenberg.org/ebooks/41006) |
| 300 | Beasts and Super-Beasts | Saki | not recorded | — | 1916 | [#269](https://www.gutenberg.org/ebooks/269) |
| 301 | Much Ado about Nothing | William Shakespeare | not recorded | — | 1616 | [#1519](https://www.gutenberg.org/ebooks/1519) |
| 302 | Alice's Adventures in Wonderland | Lewis Carroll | not recorded | — | 1898, 1921 | [#28885](https://www.gutenberg.org/ebooks/28885) |
| 303 | An Old Man's Love | Anthony Trollope | not recorded | — | 1882 | [#25001](https://www.gutenberg.org/ebooks/25001) |
| 304 | Moby-Dick | Herman Melville | not recorded | — | 1891 | [#15](https://www.gutenberg.org/ebooks/15) |
| 305 | Meno | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1643](https://www.gutenberg.org/ebooks/1643) |
| 306 | The Every-day Book and Table Book. v. 3 (of 3) | William Hone | not recorded | — | 1842 | [#53277](https://www.gutenberg.org/ebooks/53277) |
| 307 | Theaetetus | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1726](https://www.gutenberg.org/ebooks/1726) |
| 308 | Self Help | Samuel Smiles | not recorded | — | 1904 | [#935](https://www.gutenberg.org/ebooks/935) |
| 309 | Society as I Have Found It | Ward McAllister | not recorded | — | 1895 | [#55300](https://www.gutenberg.org/ebooks/55300) |
| 310 | Poems, with The Ballad of Reading Gaol | Oscar Wilde | not recorded | — | 1900 | [#1057](https://www.gutenberg.org/ebooks/1057) |
| 311 | The Advancement of Learning | Francis Bacon | not recorded | — | 1626, 1894 | [#5500](https://www.gutenberg.org/ebooks/5500) |
| 312 | Our Mutual Friend | Charles Dickens | not recorded | — | 1870 | [#883](https://www.gutenberg.org/ebooks/883) |
| 313 | Heimskringla | Snorri Sturluson | not recorded | — | 1241 | [#598](https://www.gutenberg.org/ebooks/598) |
| 314 | Vegetable Teratology | Maxwell T. Masters | not recorded | — | 1907 | [#23354](https://www.gutenberg.org/ebooks/23354) |
| 315 | Memoirs of Napoleon Bonaparte | Louis Antoine Fauvelet de Bourrienne | not recorded | — | 1834, 1923 | [#3567](https://www.gutenberg.org/ebooks/3567) |
| 316 | The Mysteries of London, v. 4/4 | George W. M. Reynolds | not recorded | — | 1879 | [#51649](https://www.gutenberg.org/ebooks/51649) |
| 317 | The House of the Wolfings | William Morris | not recorded | — | 1896 | [#2885](https://www.gutenberg.org/ebooks/2885) |
| 318 | The Poems of Felicia Hemans | Mrs. Hemans | not recorded | — | 1835 | [#66785](https://www.gutenberg.org/ebooks/66785) |
| 319 | The Chemical History of a Candle | Michael Faraday | not recorded | — | 1867, 1919 | [#14474](https://www.gutenberg.org/ebooks/14474) |
| 320 | Undine | Friedrich de la Motte Fouqué | not recorded | — | 1843, 1901 | [#2825](https://www.gutenberg.org/ebooks/2825) |
| 321 | The Book of Tea | Kakuzo Okakura | not recorded | — | 1913 | [#769](https://www.gutenberg.org/ebooks/769) |
| 322 | A Christmas Carol | Charles Dickens | not recorded | — | 1870 | [#24022](https://www.gutenberg.org/ebooks/24022) |
| 323 | Dialogues Concerning Natural Religion | David Hume | not recorded | — | 1776 | [#4583](https://www.gutenberg.org/ebooks/4583) |
| 324 | Poetical Works of Matthew Arnold | Matthew Arnold | not recorded | — | 1888 | [#27739](https://www.gutenberg.org/ebooks/27739) |
| 325 | Poems by William Cullen Bryant | William Cullen Bryant | not recorded | — | 1878 | [#16341](https://www.gutenberg.org/ebooks/16341) |
| 326 | The Descent of Man, and Selection in Relation to Sex | Charles Darwin | not recorded | — | 1882 | [#2300](https://www.gutenberg.org/ebooks/2300) |
| 327 | The Odyssey of Homer | Homer | not recorded | S. H. Butcher & Andrew Lang | 650 BC, 1910, 1912 | [#1728](https://www.gutenberg.org/ebooks/1728) |
| 328 | The Voyage of the Beagle | Charles Darwin | not recorded | — | 1882 | [#944](https://www.gutenberg.org/ebooks/944) |
| 329 | Pollyanna | Eleanor H. Porter | not recorded | — | 1920 | [#1450](https://www.gutenberg.org/ebooks/1450) |
| 330 | The House on the Borderland | William Hope Hodgson | not recorded | — | 1918 | [#10002](https://www.gutenberg.org/ebooks/10002) |
| 331 | Scenes in the Life of Harriet Tubman | Sarah H. Bradford | not recorded | — | 1912 | [#57821](https://www.gutenberg.org/ebooks/57821) |
| 332 | Lady Windermere's Fan | Oscar Wilde | not recorded | — | 1900 | [#790](https://www.gutenberg.org/ebooks/790) |
| 333 | Camp Cookery. How to Live in Camp | Maria Parloa | not recorded | — | 1909 | [#54138](https://www.gutenberg.org/ebooks/54138) |
| 334 | A Discourse Upon the Origin and the Foundation of the Inequality Among Mankind | Jean-Jacques Rousseau | not recorded | — | 1778 | [#11136](https://www.gutenberg.org/ebooks/11136) |
| 335 | Kant's Prolegomena to Any Future Metaphysics | Immanuel Kant | not recorded | — | 1804, 1919 | [#52821](https://www.gutenberg.org/ebooks/52821) |
| 336 | Julius Caesar | William Shakespeare | not recorded | — | 1616 | [#1522](https://www.gutenberg.org/ebooks/1522) |
| 337 | The Book of the Sword | Richard Francis Burton | not recorded | — | 1890 | [#61751](https://www.gutenberg.org/ebooks/61751) |
| 338 | Divine Comedy, Longfellow's Translation, Complete | Dante Alighieri | not recorded | Henry Wadsworth Longfellow | 1321, 1882 | [#1004](https://www.gutenberg.org/ebooks/1004) |
| 339 | An Essay on the Principle of Population | T. R. Malthus | not recorded | — | 1834 | [#4239](https://www.gutenberg.org/ebooks/4239) |
| 340 | Notes on Nursing | Florence Nightingale | not recorded | — | 1910 | [#17366](https://www.gutenberg.org/ebooks/17366) |
| 341 | In Praise of Folly | Desiderius Erasmus | not recorded | — | 1536 | [#30201](https://www.gutenberg.org/ebooks/30201) |
| 342 | On The Principles of Political Economy, and Taxation | David Ricardo | not recorded | — | 1823 | [#33310](https://www.gutenberg.org/ebooks/33310) |
| 343 | Daisy Miller | Henry James | not recorded | — | 1916 | [#208](https://www.gutenberg.org/ebooks/208) |
| 344 | Bacon's Essays, and Wisdom of the Ancients | Francis Bacon | not recorded | — | 1626, 1851, 1869 | [#56463](https://www.gutenberg.org/ebooks/56463) |
| 345 | An Enquiry Concerning the Principles of Morals | David Hume | not recorded | — | 1776 | [#4320](https://www.gutenberg.org/ebooks/4320) |
| 346 | The Wandering Jew | Eugène Sue | not recorded | — | 1857 | [#3350](https://www.gutenberg.org/ebooks/3350) |
| 347 | The Old Curiosity Shop | Charles Dickens | not recorded | — | 1870 | [#700](https://www.gutenberg.org/ebooks/700) |
| 348 | L. Annaeus Seneca on Benefits | Lucius Annaeus Seneca | not recorded | Aubrey Stewart | 65, 1918 | [#3794](https://www.gutenberg.org/ebooks/3794) |
| 349 | Goethe's Theory of Colours | Johann Wolfgang von Goethe | not recorded | Eastlake, Charles Lock, Sir | 1832, 1865 | [#50572](https://www.gutenberg.org/ebooks/50572) |
| 350 | The Open Boat and Other Stories | Stephen Crane | not recorded | — | 1900 | [#45524](https://www.gutenberg.org/ebooks/45524) |
| 351 | Louisa May Alcott | Louisa May Alcott | not recorded | — | 1888, 1904 | [#38049](https://www.gutenberg.org/ebooks/38049) |
| 352 | The Exploring Expedition to the Rocky Mountains, Oregon and California | John Charles Frémont | not recorded | — | 1890 | [#9294](https://www.gutenberg.org/ebooks/9294) |
| 353 | Lady Audley's Secret | M. E. Braddon | not recorded | — | 1915 | [#8954](https://www.gutenberg.org/ebooks/8954) |
| 354 | Laws | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1750](https://www.gutenberg.org/ebooks/1750) |
| 355 | Grimm's Fairy Stories | Jacob Grimm & Wilhelm Grimm | not recorded | — | 1863, 1859 | [#11027](https://www.gutenberg.org/ebooks/11027) |
| 356 | The Complete Poetical Works of Edgar Allan Poe | Edgar Allan Poe | not recorded | — | 1849, 1916 | [#10031](https://www.gutenberg.org/ebooks/10031) |
| 357 | Kwaidan | Lafcadio Hearn | not recorded | — | 1904 | [#1210](https://www.gutenberg.org/ebooks/1210) |
| 358 | The Comic English Grammar | Percival Leigh | not recorded | — | 1889 | [#44802](https://www.gutenberg.org/ebooks/44802) |
| 359 | Timaeus | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1572](https://www.gutenberg.org/ebooks/1572) |
| 360 | The House of the Seven Gables | Nathaniel Hawthorne | not recorded | — | 1864 | [#77](https://www.gutenberg.org/ebooks/77) |
| 361 | History of the inductive sciences, from the earliest to the present time | William Whewell | not recorded | — | 1866 | [#68693](https://www.gutenberg.org/ebooks/68693) |
| 362 | Erewhon | Samuel Butler | not recorded | — | 1902 | [#1906](https://www.gutenberg.org/ebooks/1906) |
| 363 | The Trimmed Lamp, and Other Stories of the Four Million | O. Henry | not recorded | — | 1910 | [#3707](https://www.gutenberg.org/ebooks/3707) |
| 364 | The Life of Trust | George Müller | not recorded | — | 1898, 1898 | [#27288](https://www.gutenberg.org/ebooks/27288) |
| 365 | The Medals of Creation, Volumes 1 and 2 | Gideon Algernon Mantell | not recorded | — | 1852 | [#62891](https://www.gutenberg.org/ebooks/62891) |
| 366 | The Foundations of Science | Henri Poincaré | not recorded | George Bruce Halsted | 1912, 1916, 1922 | [#39713](https://www.gutenberg.org/ebooks/39713) |
| 367 | The Tenant of Wildfell Hall | Anne Brontë | not recorded | — | 1849, 1920 | [#969](https://www.gutenberg.org/ebooks/969) |
| 368 | The Rape of the Lock, and Other Poems | Alexander Pope | not recorded | — | 1744 | [#9800](https://www.gutenberg.org/ebooks/9800) |
| 369 | History of the Reign of Philip the Second, King of Spain, Vols. 1 and 2 | William Hickling Prescott | not recorded | — | 1859 | [#32600](https://www.gutenberg.org/ebooks/32600) |
| 370 | Ancient States and Empires | John Lord | not recorded | — | 1894 | [#27114](https://www.gutenberg.org/ebooks/27114) |
| 371 | Fifty Years In The Northwest | William H. C. Folsom | not recorded | — | 1900, 1915 | [#36375](https://www.gutenberg.org/ebooks/36375) |
| 372 | Daemonologie. | James I | not recorded | — | 1625 | [#25929](https://www.gutenberg.org/ebooks/25929) |
| 373 | Autobiography | John Stuart Mill | not recorded | — | 1873 | [#10378](https://www.gutenberg.org/ebooks/10378) |
| 374 | A Tramp Abroad | Mark Twain | not recorded | — | 1910 | [#119](https://www.gutenberg.org/ebooks/119) |
| 375 | The Princess and the Goblin | George MacDonald | not recorded | — | 1905 | [#708](https://www.gutenberg.org/ebooks/708) |
| 376 | Apology, Crito, and Phaedo of Socrates | Plato | not recorded | Henry Cary | 348 BC, 1912, 1870 | [#13726](https://www.gutenberg.org/ebooks/13726) |
| 377 | The Alchemist | Ben Jonson | not recorded | — | 1637 | [#4081](https://www.gutenberg.org/ebooks/4081) |
| 378 | A Little Girl of Long Ago | Amanda M. Douglas | not recorded | — | 1916 | [#23781](https://www.gutenberg.org/ebooks/23781) |
| 379 | McGuffey's First Eclectic Reader, Revised Edition | William Holmes McGuffey | not recorded | — | 1873 | [#14640](https://www.gutenberg.org/ebooks/14640) |
| 380 | Madame Flirt | Charles Edward Pearce | not recorded | — | 1924 | [#18547](https://www.gutenberg.org/ebooks/18547) |
| 381 | Twelfth Night | William Shakespeare | not recorded | — | 1616 | [#1526](https://www.gutenberg.org/ebooks/1526) |
| 382 | An Account of Egypt | Herodotus | not recorded | G. C. Macaulay | 430 BC, 1915 | [#2131](https://www.gutenberg.org/ebooks/2131) |
| 383 | The Early Poems of Alfred Lord Tennyson | Alfred, Lord Tennyson | not recorded | — | 1892, 1908 | [#8601](https://www.gutenberg.org/ebooks/8601) |
| 384 | Some Principles of Maritime Strategy | Julian Stafford Corbett | not recorded | — | 1922 | [#15076](https://www.gutenberg.org/ebooks/15076) |
| 385 | Letters to His Son, Complete | Lord Chesterfield | not recorded | — | 1773 | [#3361](https://www.gutenberg.org/ebooks/3361) |
| 386 | The Tragedy of Pudd'nhead Wilson | Mark Twain | not recorded | — | 1910 | [#102](https://www.gutenberg.org/ebooks/102) |
| 387 | Little Men | Louisa May Alcott | not recorded | — | 1888 | [#2788](https://www.gutenberg.org/ebooks/2788) |
| 388 | An Old Babylonian Version of the Gilgamesh Epic | Morris Jastrow & Albert Tobias Clay | not recorded | — | 1921, 1925 | [#11000](https://www.gutenberg.org/ebooks/11000) |
| 389 | Walking | Henry David Thoreau | not recorded | — | 1862 | [#1022](https://www.gutenberg.org/ebooks/1022) |
| 390 | The Angel in the House | Coventry Patmore | not recorded | — | 1896 | [#4099](https://www.gutenberg.org/ebooks/4099) |
| 391 | The Complete Poetical Works of Henry Wadsworth Longfellow | Henry Wadsworth Longfellow | not recorded | — | 1882 | [#1365](https://www.gutenberg.org/ebooks/1365) |
| 392 | Pamela, or Virtue Rewarded | Samuel Richardson | not recorded | — | 1761 | [#6124](https://www.gutenberg.org/ebooks/6124) |
| 393 | The Merchant of Venice | William Shakespeare | not recorded | — | 1616 | [#1515](https://www.gutenberg.org/ebooks/1515) |
| 394 | Demonology and Devil-lore | Moncure Daniel Conway | not recorded | — | 1907 | [#40686](https://www.gutenberg.org/ebooks/40686) |
| 395 | Beauty and the Beast | Jeanne-Marie Leprince de Beaumont | not recorded | — | 1780 | [#7074](https://www.gutenberg.org/ebooks/7074) |
| 396 | Uncle Vanya | Anton Pavlovich Chekhov | not recorded | — | 1904 | [#1756](https://www.gutenberg.org/ebooks/1756) |
| 397 | Theodore Roosevelt | Theodore Roosevelt | not recorded | — | 1919 | [#3335](https://www.gutenberg.org/ebooks/3335) |
| 398 | Stonewall Jackson and the American Civil War | G. F. R. Henderson | not recorded | — | 1903, 1913 | [#12233](https://www.gutenberg.org/ebooks/12233) |
| 399 | Devotions Upon Emergent Occasions | John Donne | not recorded | — | 1631 | [#23772](https://www.gutenberg.org/ebooks/23772) |
| 400 | Treatises on Friendship and Old Age | Marcus Tullius Cicero | not recorded | Evelyn S. Shuckburgh | 43 BC, 1906 | [#2808](https://www.gutenberg.org/ebooks/2808) |
| 401 | Minor Dialogues, Together With the Dialogue on Clemency | Lucius Annaeus Seneca | not recorded | Aubrey Stewart | 65, 1918 | [#64576](https://www.gutenberg.org/ebooks/64576) |
| 402 | English Surnames | Charles Wareing Endell Bardsley | not recorded | — | 1898 | [#59959](https://www.gutenberg.org/ebooks/59959) |
| 403 | The Wonders of the Invisible World | Cotton Mather & Increase Mather | not recorded | — | 1728, 1723 | [#28513](https://www.gutenberg.org/ebooks/28513) |
| 404 | Little Dorrit | Charles Dickens | not recorded | — | 1870 | [#963](https://www.gutenberg.org/ebooks/963) |
| 405 | New Atlantis | Francis Bacon | not recorded | — | 1626 | [#2434](https://www.gutenberg.org/ebooks/2434) |
| 406 | Seneca's Morals of a Happy Life, Benefits, Anger and Clemency | Lucius Annaeus Seneca | not recorded | L'Estrange, Roger, Sir | 65, 1704 | [#56075](https://www.gutenberg.org/ebooks/56075) |
| 407 | Annals and Antiquities of Rajasthan, v. 1 of 3 | James Tod | not recorded | — | 1835, 1923 | [#57374](https://www.gutenberg.org/ebooks/57374) |
| 408 | Poems | Victor Hugo | not recorded | — | 1885 | [#8775](https://www.gutenberg.org/ebooks/8775) |
| 409 | The Roman assemblies from their origin to the end of the Republic | George Willis Botsford | not recorded | — | 1917 | [#68419](https://www.gutenberg.org/ebooks/68419) |
| 410 | The Boston cooking-school cook book | Fannie Merritt Farmer | not recorded | — | 1915 | [#65061](https://www.gutenberg.org/ebooks/65061) |
| 411 | The Marvelous Land of Oz | L. Frank Baum | not recorded | — | 1919 | [#54](https://www.gutenberg.org/ebooks/54) |
| 412 | Short Stories | Fyodor Dostoyevsky | not recorded | — | 1881 | [#40745](https://www.gutenberg.org/ebooks/40745) |
| 413 | The field and garden vegetables of America | Fearing Burr | not recorded | — | 1897 | [#21682](https://www.gutenberg.org/ebooks/21682) |
| 414 | The rose of old St. Louis | Mary Dillon | not recorded | — | 1923 | [#20911](https://www.gutenberg.org/ebooks/20911) |
| 415 | The French Revolution | Thomas Carlyle | not recorded | — | 1881 | [#1301](https://www.gutenberg.org/ebooks/1301) |
| 416 | Germinie Lacerteux | Edmond de Goncourt & Jules de Goncourt | not recorded | — | 1896, 1870 | [#27711](https://www.gutenberg.org/ebooks/27711) |
| 417 | The vision of hell | Dante Alighieri | not recorded | Henry Francis Cary | 1321, 1844 | [#8789](https://www.gutenberg.org/ebooks/8789) |
| 418 | A Defence of Poetry and Other Essays | Percy Bysshe Shelley | not recorded | — | 1822 | [#5428](https://www.gutenberg.org/ebooks/5428) |
| 419 | Dracula's Guest | Bram Stoker | not recorded | — | 1912 | [#10150](https://www.gutenberg.org/ebooks/10150) |
| 420 | Electricity for Boys | James Slough Zerbe | not recorded | — | 1921 | [#22766](https://www.gutenberg.org/ebooks/22766) |
| 421 | Martin Eden | Jack London | not recorded | — | 1916 | [#1056](https://www.gutenberg.org/ebooks/1056) |
| 422 | A Journey into the Interior of the Earth | Jules Verne | not recorded | F. A. Malleson | 1905, 1897 | [#3748](https://www.gutenberg.org/ebooks/3748) |
| 423 | The Candidate | Joseph A. Altsheler | not recorded | — | 1919 | [#25132](https://www.gutenberg.org/ebooks/25132) |
| 424 | The Sketch-Book of Geoffrey Crayon | Washington Irving | not recorded | — | 1859 | [#2048](https://www.gutenberg.org/ebooks/2048) |
| 425 | The Roman Festivals of the Period of the Republic | W. Warde Fowler | not recorded | — | 1921 | [#59007](https://www.gutenberg.org/ebooks/59007) |
| 426 | A Treatise Concerning the Principles of Human Knowledge | George Berkeley | not recorded | — | 1753 | [#4723](https://www.gutenberg.org/ebooks/4723) |
| 427 | The Theory of Moral Sentiments | Adam Smith | not recorded | — | 1790 | [#67363](https://www.gutenberg.org/ebooks/67363) |
| 428 | Poems | Ralph Waldo Emerson | not recorded | — | 1882 | [#12843](https://www.gutenberg.org/ebooks/12843) |
| 429 | Ion | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1635](https://www.gutenberg.org/ebooks/1635) |
| 430 | The Way of the World | William Congreve | not recorded | — | 1729 | [#1292](https://www.gutenberg.org/ebooks/1292) |
| 431 | Aladdin & Co. | Herbert Quick | not recorded | — | 1925 | [#23745](https://www.gutenberg.org/ebooks/23745) |
| 432 | On Heroes, Hero-Worship, and the Heroic in History | Thomas Carlyle | not recorded | — | 1881 | [#1091](https://www.gutenberg.org/ebooks/1091) |
| 433 | Twice-told tales | Nathaniel Hawthorne | not recorded | — | 1864 | [#13707](https://www.gutenberg.org/ebooks/13707) |
| 434 | Five Little Peppers at School | Margaret Sidney | not recorded | — | 1924 | [#26122](https://www.gutenberg.org/ebooks/26122) |
| 435 | The Book of Ballads | Theodore Martin & William Edmondstoune Aytoun | not recorded | — | 1909, 1865 | [#44798](https://www.gutenberg.org/ebooks/44798) |
| 436 | Twas the Night before Christmas | Clement Clarke Moore | not recorded | — | 1863 | [#17135](https://www.gutenberg.org/ebooks/17135) |
| 437 | The Survey of London | John Stow | not recorded | — | 1605, 1917 | [#42959](https://www.gutenberg.org/ebooks/42959) |
| 438 | A Journal of the Plague Year | Daniel Defoe | not recorded | — | 1731 | [#376](https://www.gutenberg.org/ebooks/376) |
| 439 | The Every-day Book and Table Book. v. 2 (of 3) | William Hone | not recorded | — | 1842 | [#53276](https://www.gutenberg.org/ebooks/53276) |
| 440 | The Prince | Niccolò Machiavelli | not recorded | Luigi Ricci | 1527, 1915 | [#57037](https://www.gutenberg.org/ebooks/57037) |
| 441 | The complete works of John Gower, volume 3 | John Gower | not recorded | — | 1408, 1915 | [#71433](https://www.gutenberg.org/ebooks/71433) |
| 442 | Varney the vampyre | Thomas Peckett Prest & James Malcolm Rymer | not recorded | — | 1859, 1884 | [#14833](https://www.gutenberg.org/ebooks/14833) |
| 443 | John Gayther's Garden and the Stories Told Therein | Frank R. Stockton | not recorded | — | 1902 | [#22737](https://www.gutenberg.org/ebooks/22737) |
| 444 | The Seven Lamps of Architecture | John Ruskin | not recorded | — | 1900 | [#35898](https://www.gutenberg.org/ebooks/35898) |
| 445 | The New Life (La Vita Nuova) | Dante Alighieri | not recorded | Dante Gabriel Rossetti | 1321, 1882 | [#41085](https://www.gutenberg.org/ebooks/41085) |
| 446 | By Conduct and Courage | G. A. Henty | not recorded | — | 1902 | [#28357](https://www.gutenberg.org/ebooks/28357) |
| 447 | From Kingdom to Colony | Mary Devereux | not recorded | — | 1914 | [#34232](https://www.gutenberg.org/ebooks/34232) |
| 448 | The Expression of the Emotions in Man and Animals | Charles Darwin | not recorded | — | 1882 | [#1227](https://www.gutenberg.org/ebooks/1227) |
| 449 | The Sceptical Chymist | Robert Boyle | not recorded | — | 1691 | [#22914](https://www.gutenberg.org/ebooks/22914) |
| 450 | The Life of Lazarillo de Tormes His Fortunes & Adversities | Anonymous | not recorded | Markham, Clements R. , Sir | Anonymous (year not known), 1916 | [#53489](https://www.gutenberg.org/ebooks/53489) |
| 451 | The Evolution of Man | Ernst Haeckel | not recorded | — | 1919 | [#8700](https://www.gutenberg.org/ebooks/8700) |
| 452 | Looking Backward, 2000 to 1887 | Edward Bellamy | not recorded | — | 1898 | [#624](https://www.gutenberg.org/ebooks/624) |
| 453 | Memoirs of the Court of Marie Antoinette, Queen of France, Complete | Mme. Campan | not recorded | — | 1822 | [#3891](https://www.gutenberg.org/ebooks/3891) |
| 454 | Cornish Characters and Strange Events | S. Baring-Gould | not recorded | — | 1924 | [#41775](https://www.gutenberg.org/ebooks/41775) |
| 455 | Thoughts of Marcus Aurelius | Marcus Aurelius | not recorded | George Long | 180, 1879 | [#6920](https://www.gutenberg.org/ebooks/6920) |
| 456 | Protagoras | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1591](https://www.gutenberg.org/ebooks/1591) |
| 457 | Fifty Famous Stories Retold | James Baldwin | not recorded | — | 1925 | [#18442](https://www.gutenberg.org/ebooks/18442) |
| 458 | The Legends of King Arthur and His Knights | James Knowles & Thomas Malory | not recorded | — | 1908, 1471 | [#12753](https://www.gutenberg.org/ebooks/12753) |
| 459 | Memoirs of Louis XIV and His Court and of the Regency | Louis de Rouvroy, duc de Saint-Simon | not recorded | — | 1755 | [#3875](https://www.gutenberg.org/ebooks/3875) |
| 460 | Rinkitink in Oz | L. Frank Baum | not recorded | — | 1919 | [#25581](https://www.gutenberg.org/ebooks/25581) |
| 461 | The Memorabilia | Xenophon | not recorded | Henry Graham Dakyns | 355 BC, 1911 | [#1177](https://www.gutenberg.org/ebooks/1177) |
| 462 | Lombard Street | Walter Bagehot | not recorded | — | 1877 | [#4359](https://www.gutenberg.org/ebooks/4359) |
| 463 | The Mysterious Stranger, and Other Stories | Mark Twain | not recorded | — | 1910 | [#3186](https://www.gutenberg.org/ebooks/3186) |
| 464 | The Art of War | Antoine-Henri Jomini | not recorded | Wm. P. Craighill & George H. Mendell | 1869, 1909, 1902 | [#13549](https://www.gutenberg.org/ebooks/13549) |
| 465 | Microcosmography or, a Piece of the World Discovered | John Earle | not recorded | — | 1665 | [#26425](https://www.gutenberg.org/ebooks/26425) |
| 466 | Commentaries on the Laws of England, Book the First | William Blackstone | not recorded | — | 1780 | [#30802](https://www.gutenberg.org/ebooks/30802) |
| 467 | An Essay on Criticism | Alexander Pope | not recorded | — | 1744 | [#7409](https://www.gutenberg.org/ebooks/7409) |
| 468 | The Raven | Edgar Allan Poe | not recorded | — | 1849 | [#1065](https://www.gutenberg.org/ebooks/1065) |
| 469 | The Sea-Wolf | Jack London | not recorded | — | 1916 | [#1074](https://www.gutenberg.org/ebooks/1074) |
| 470 | The Autobiography of Madame Guyon | Jeanne Marie Bouvier de la Motte Guyon | not recorded | — | 1717 | [#22269](https://www.gutenberg.org/ebooks/22269) |
| 471 | An ideal husband | Oscar Wilde | not recorded | — | 1900 | [#885](https://www.gutenberg.org/ebooks/885) |
| 472 | The Underground Railroad | William Still | not recorded | — | 1902 | [#15263](https://www.gutenberg.org/ebooks/15263) |
| 473 | Line and Form (1900) | Walter Crane | not recorded | — | 1915 | [#25290](https://www.gutenberg.org/ebooks/25290) |
| 474 | Phantastes | George MacDonald | not recorded | — | 1905 | [#325](https://www.gutenberg.org/ebooks/325) |
| 475 | Bulfinch's Mythology | Thomas Bulfinch | not recorded | — | 1867 | [#4928](https://www.gutenberg.org/ebooks/4928) |
| 476 | Hopes and Fears for Art | William Morris | not recorded | — | 1896 | [#3773](https://www.gutenberg.org/ebooks/3773) |
| 477 | The Last Man | Mary Wollstonecraft Shelley | not recorded | — | 1851 | [#18247](https://www.gutenberg.org/ebooks/18247) |
| 478 | Adam Bede | George Eliot | not recorded | — | 1880 | [#507](https://www.gutenberg.org/ebooks/507) |
| 479 | A Brief Account of the Destruction of the Indies | Bartolomé de las Casas | not recorded | — | 1566 | [#20321](https://www.gutenberg.org/ebooks/20321) |
| 480 | The Elder Eddas of Saemund Sigfusson | Sæmundur fróði & Snorri Sturluson | not recorded | Joseph Andrew Blackwell & Benjamin Thorpe | 1133, 1241, 1886, 1870 | [#14726](https://www.gutenberg.org/ebooks/14726) |
| 481 | A New Guide for Emigrants to the West | John Mason Peck | not recorded | — | 1858 | [#27394](https://www.gutenberg.org/ebooks/27394) |
| 482 | Psychology | William James | not recorded | — | 1910 | [#55262](https://www.gutenberg.org/ebooks/55262) |
| 483 | St. Paul's Epistles to the Colossians and Philemon | J. B. Lightfoot | not recorded | — | 1889 | [#50857](https://www.gutenberg.org/ebooks/50857) |
| 484 | Dombey and Son | Charles Dickens | not recorded | — | 1870 | [#821](https://www.gutenberg.org/ebooks/821) |
| 485 | Mark Twain's Speeches | Mark Twain | not recorded | — | 1910 | [#3188](https://www.gutenberg.org/ebooks/3188) |
| 486 | Poems on various subjects, religious and moral | Phillis Wheatley | not recorded | — | 1784 | [#409](https://www.gutenberg.org/ebooks/409) |
| 487 | Plymouth memories of an octogenarian | William T. Davis | not recorded | — | 1907 | [#70420](https://www.gutenberg.org/ebooks/70420) |
| 488 | Crito | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1657](https://www.gutenberg.org/ebooks/1657) |
| 489 | Beautiful Stories from Shakespeare | E. Nesbit & William Shakespeare | not recorded | — | 1924, 1616 | [#1430](https://www.gutenberg.org/ebooks/1430) |
| 490 | Eve's Diary, Complete | Mark Twain | not recorded | — | 1910 | [#8525](https://www.gutenberg.org/ebooks/8525) |
| 491 | Salem Witchcraft, Volumes I and II | Charles Wentworth Upham | not recorded | — | 1875 | [#17845](https://www.gutenberg.org/ebooks/17845) |
| 492 | The Jew of Malta | Christopher Marlowe | not recorded | — | 1593 | [#901](https://www.gutenberg.org/ebooks/901) |
| 493 | The Hunting of the Snark | Lewis Carroll | not recorded | — | 1898 | [#13](https://www.gutenberg.org/ebooks/13) |
| 494 | The Letters of Jane Austen | Jane Austen | not recorded | — | 1817, 1905 | [#42078](https://www.gutenberg.org/ebooks/42078) |
| 495 | Idylls of the King | Alfred, Lord Tennyson | not recorded | — | 1892 | [#610](https://www.gutenberg.org/ebooks/610) |
| 496 | The Great Controversy Between Christ and Satan | Ellen G. White | not recorded | — | 1915 | [#25833](https://www.gutenberg.org/ebooks/25833) |
| 497 | Love and Lucy | Maurice Hewlett | not recorded | — | 1923 | [#29868](https://www.gutenberg.org/ebooks/29868) |
| 498 | Hymns for Christian Devotion | John G. Adams & E. H. Chapin | not recorded | — | 1887, 1880 | [#20476](https://www.gutenberg.org/ebooks/20476) |
| 499 | The Elements of Drawing, in Three Letters to Beginners | John Ruskin | not recorded | — | 1900 | [#30325](https://www.gutenberg.org/ebooks/30325) |
| 500 | The Life of Jesus Critically Examined | David Friedrich Strauss | not recorded | George Eliot | 1874, 1908, 1880 | [#64037](https://www.gutenberg.org/ebooks/64037) |
| 501 | Anecdotes of the Habits and Instinct of Animals | Mrs. R. Lee | not recorded | — | 1856 | [#21973](https://www.gutenberg.org/ebooks/21973) |
| 502 | Views of nature | Alexander von Humboldt | not recorded | Henry G. Bohn & E. C. Otté | 1859, 1884, 1903 | [#67684](https://www.gutenberg.org/ebooks/67684) |
| 503 | Volpone | Ben Jonson | not recorded | — | 1637 | [#4039](https://www.gutenberg.org/ebooks/4039) |
| 504 | Aesthetical Essays of Friedrich Schiller | Friedrich Schiller | not recorded | — | 1805 | [#6798](https://www.gutenberg.org/ebooks/6798) |
| 505 | Three Ghost Stories | Charles Dickens | not recorded | — | 1870 | [#1289](https://www.gutenberg.org/ebooks/1289) |
| 506 | Woman in the Nineteenth Century | Margaret Fuller | not recorded | — | 1850, 1872, 1862 | [#8642](https://www.gutenberg.org/ebooks/8642) |
| 507 | Personal Memoirs of P. H. Sheridan, General, United States Army | Philip Henry Sheridan | not recorded | — | 1888 | [#4362](https://www.gutenberg.org/ebooks/4362) |
| 508 | She | H. Rider Haggard | not recorded | — | 1925 | [#3155](https://www.gutenberg.org/ebooks/3155) |
| 509 | The Conduct of Life | Ralph Waldo Emerson | not recorded | — | 1882 | [#39827](https://www.gutenberg.org/ebooks/39827) |
| 510 | American Historical and Literary Curiosities, Series One | J. Jay Smith & John F. Watson | not recorded | — | 1881, 1860 | [#7923](https://www.gutenberg.org/ebooks/7923) |
| 511 | The Iliad of Homer | Homer | not recorded | William Cowper | 650 BC, 1858, 1843, 1800 | [#16452](https://www.gutenberg.org/ebooks/16452) |
| 512 | Against Apion | Flavius Josephus | not recorded | William Whiston | Josephus, Flavius (b. 37), 1752 | [#2849](https://www.gutenberg.org/ebooks/2849) |
| 513 | Table Talk | William Hazlitt | not recorded | — | 1830 | [#3020](https://www.gutenberg.org/ebooks/3020) |
| 514 | The American Occupation of the Philippines 1898-1912 | James H. Blount | not recorded | — | 1918 | [#36542](https://www.gutenberg.org/ebooks/36542) |
| 515 | Sailing Alone Around the World | Joshua Slocum | not recorded | — | 1909 | [#6317](https://www.gutenberg.org/ebooks/6317) |
| 516 | Intentions | Oscar Wilde | not recorded | — | 1900 | [#887](https://www.gutenberg.org/ebooks/887) |
| 517 | The Critical Period of American History | John Fiske | not recorded | — | 1901 | [#27430](https://www.gutenberg.org/ebooks/27430) |
| 518 | The Sunbridge Girls at Six Star Ranch | Eleanor H. Porter | not recorded | — | 1920 | [#25578](https://www.gutenberg.org/ebooks/25578) |
| 519 | Captain Cook's Journal During His First Voyage Round the World | James Cook | not recorded | — | 1779, 1905 | [#8106](https://www.gutenberg.org/ebooks/8106) |
| 520 | The Secret Sharer | Joseph Conrad | not recorded | — | 1924 | [#220](https://www.gutenberg.org/ebooks/220) |
| 521 | A Treatise on Painting | da Vinci Leonardo | not recorded | J. F. Rigaud | 1519, 1842, 1810 | [#46915](https://www.gutenberg.org/ebooks/46915) |
| 522 | Tales and Novels of J. de La Fontaine | Jean de La Fontaine | not recorded | — | 1695 | [#5300](https://www.gutenberg.org/ebooks/5300) |
| 523 | The Idea of a University Defined and Illustrated | John Henry Newman | not recorded | — | 1890 | [#24526](https://www.gutenberg.org/ebooks/24526) |
| 524 | Annals and Antiquities of Rajasthan, v. 2 of 3 | James Tod | not recorded | — | 1835, 1923 | [#57375](https://www.gutenberg.org/ebooks/57375) |
| 525 | Pilgrimage from the Alps to the Tiber | J. A. Wylie | not recorded | — | 1890 | [#28294](https://www.gutenberg.org/ebooks/28294) |
| 526 | The Religious Experience of the Roman People | W. Warde Fowler | not recorded | — | 1921 | [#23349](https://www.gutenberg.org/ebooks/23349) |
| 527 | Ars Amatoria | Ovid | not recorded | Henry T. Riley | 17, 1878 | [#47677](https://www.gutenberg.org/ebooks/47677) |
| 528 | The Beast in the Jungle | Henry James | not recorded | — | 1916 | [#1093](https://www.gutenberg.org/ebooks/1093) |
| 529 | In the forbidden land | Arnold Henry Savage Landor | not recorded | — | 1924 | [#22210](https://www.gutenberg.org/ebooks/22210) |
| 530 | An Essay on Man | Alexander Pope | not recorded | — | 1744, 1894 | [#2428](https://www.gutenberg.org/ebooks/2428) |
| 531 | The Odysseys of Homer, together with the shorter poems | Homer | not recorded | George Chapman | 650 BC, 1634 | [#48895](https://www.gutenberg.org/ebooks/48895) |
| 532 | What Is Man? and Other Essays | Mark Twain | not recorded | — | 1910 | [#70](https://www.gutenberg.org/ebooks/70) |
| 533 | Memoirs of the Duchesse de Dino (Afterwards Duchesse de Talleyrand et de Sagan), 1836-1840 | Dorothée, duchesse de Dino | not recorded | — | 1862, 1915 | [#44646](https://www.gutenberg.org/ebooks/44646) |
| 534 | Bliss, and other stories | Katherine Mansfield | not recorded | — | 1923 | [#44385](https://www.gutenberg.org/ebooks/44385) |
| 535 | The Road to Oz | L. Frank Baum | not recorded | — | 1919 | [#26624](https://www.gutenberg.org/ebooks/26624) |
| 536 | Nonsense Books | Edward Lear | not recorded | — | 1888 | [#13650](https://www.gutenberg.org/ebooks/13650) |
| 537 | The Rubaiyat of Omar Khayyam | Omar Khayyam | not recorded | Edward FitzGerald | 1122, 1883 | [#246](https://www.gutenberg.org/ebooks/246) |
| 538 | The Lady, or the Tiger? | Frank R. Stockton | not recorded | — | 1902 | [#396](https://www.gutenberg.org/ebooks/396) |
| 539 | Superstition and Force | Henry Charles Lea | not recorded | — | 1909 | [#58750](https://www.gutenberg.org/ebooks/58750) |
| 540 | Micrographia | Robert Hooke | not recorded | — | 1703 | [#15491](https://www.gutenberg.org/ebooks/15491) |
| 541 | The inventions, researches and writings of Nikola Tesla | Thomas Commerford Martin | not recorded | — | 1924 | [#39272](https://www.gutenberg.org/ebooks/39272) |
| 542 | A London Life, and Other Tales | Henry James | not recorded | — | 1916 | [#25500](https://www.gutenberg.org/ebooks/25500) |
| 543 | The Letters of Cassiodorus | Senator Cassiodorus | not recorded | Thomas Hodgkin | 580, 1913 | [#18590](https://www.gutenberg.org/ebooks/18590) |
| 544 | Memoirs of General William T. Sherman | William T. Sherman | not recorded | — | 1891 | [#4361](https://www.gutenberg.org/ebooks/4361) |
| 545 | The Religion of Babylonia and Assyria | Morris Jastrow | not recorded | — | 1921 | [#20758](https://www.gutenberg.org/ebooks/20758) |
| 546 | Elements of Chemistry | Antoine Laurent Lavoisier | not recorded | Robert Kerr | 1794, 1813 | [#30775](https://www.gutenberg.org/ebooks/30775) |
| 547 | Letters of Abelard and Heloise | Peter Abelard & Héloïse | not recorded | John Hughes | 1142, 1163, 1781, 1744, 1720 | [#35977](https://www.gutenberg.org/ebooks/35977) |
| 548 | The History of Rome, Books 09 to 26 | Livy | not recorded | Cyrus R. Edmonds & D. Spillan | 16, 1868, 1854 | [#10907](https://www.gutenberg.org/ebooks/10907) |
| 549 | Composition | Arthur W. Dow | not recorded | — | 1922 | [#45410](https://www.gutenberg.org/ebooks/45410) |
| 550 | The Divine Comedy by Dante, Illustrated, Purgatory, Complete | Dante Alighieri | not recorded | Henry Francis Cary | 1321, 1844 | [#8795](https://www.gutenberg.org/ebooks/8795) |
| 551 | Ghosts | Henrik Ibsen | not recorded | William Archer | 1906, 1924 | [#8121](https://www.gutenberg.org/ebooks/8121) |
| 552 | My First Summer in the Sierra | John Muir | not recorded | — | 1914 | [#32540](https://www.gutenberg.org/ebooks/32540) |
| 553 | In Connection with the De Willoughby Claim | Frances Hodgson Burnett | not recorded | — | 1924 | [#25810](https://www.gutenberg.org/ebooks/25810) |
| 554 | Alice's Adventures Under Ground | Lewis Carroll | not recorded | — | 1898 | [#19002](https://www.gutenberg.org/ebooks/19002) |
| 555 | The Officer's Manual | Napoleon I | not recorded | D'Aguilar, G. C. , Sir | 1821, 1855 | [#50750](https://www.gutenberg.org/ebooks/50750) |
| 556 | New Treasure Seekers | E. Nesbit | not recorded | — | 1924 | [#25496](https://www.gutenberg.org/ebooks/25496) |
| 557 | The Man in the Iron Mask | Alexandre Dumas | not recorded | — | 1870 | [#2759](https://www.gutenberg.org/ebooks/2759) |
| 558 | She Stoops to Conquer | Oliver Goldsmith | not recorded | — | 1774 | [#383](https://www.gutenberg.org/ebooks/383) |
| 559 | Complete Short Works of George Meredith | George Meredith | not recorded | — | 1909 | [#4499](https://www.gutenberg.org/ebooks/4499) |
| 560 | The Revision Revised | John William Burgon | not recorded | — | 1888 | [#36722](https://www.gutenberg.org/ebooks/36722) |
| 561 | Studies of American Fungi. Mushrooms, Edible, Poisonous, etc. | George Francis Atkinson | not recorded | — | 1918 | [#26492](https://www.gutenberg.org/ebooks/26492) |
| 562 | Mycenæ | Heinrich Schliemann | not recorded | — | 1890, 1898 | [#56940](https://www.gutenberg.org/ebooks/56940) |
| 563 | An Old-Fashioned Girl | Louisa May Alcott | not recorded | — | 1888 | [#2787](https://www.gutenberg.org/ebooks/2787) |
| 564 | Robert Elsmere | Mrs. Humphry Ward | not recorded | — | 1920 | [#24898](https://www.gutenberg.org/ebooks/24898) |
| 565 | Rasselas, Prince of Abyssinia | Samuel Johnson | not recorded | — | 1784 | [#652](https://www.gutenberg.org/ebooks/652) |
| 566 | The Honour of Savelli | S. Levett Yeats | not recorded | — | 1916 | [#38250](https://www.gutenberg.org/ebooks/38250) |
| 567 | The symbolism of Freemasonry | Albert Gallatin Mackey | not recorded | — | 1881 | [#11937](https://www.gutenberg.org/ebooks/11937) |
| 568 | Daddy-Long-Legs | Jean Webster | not recorded | — | 1916 | [#40426](https://www.gutenberg.org/ebooks/40426) |
| 569 | Laboulaye's Fairy Book | Édouard Laboulaye | not recorded | Mary L. Booth | 1883, 1923, 1889 | [#26386](https://www.gutenberg.org/ebooks/26386) |
| 570 | Tancred | Benjamin Disraeli | not recorded | — | 1881 | [#20004](https://www.gutenberg.org/ebooks/20004) |
| 571 | Hellenica | Xenophon | not recorded | Henry Graham Dakyns | 355 BC, 1911 | [#1174](https://www.gutenberg.org/ebooks/1174) |
| 572 | The Bloudy Tenent of Persecution for Cause of Conscience Discussed and Mr. Cotton's Letter Examined and Answered | Roger Williams | not recorded | — | 1683, 1901 | [#65739](https://www.gutenberg.org/ebooks/65739) |
| 573 | The Soul of Man under Socialism | Oscar Wilde | not recorded | — | 1900 | [#1017](https://www.gutenberg.org/ebooks/1017) |
| 574 | American Historical and Literary Curiosities | J. Jay Smith | not recorded | — | 1881 | [#7924](https://www.gutenberg.org/ebooks/7924) |
| 575 | The Red Lily | Anatole France | not recorded | — | 1924 | [#3922](https://www.gutenberg.org/ebooks/3922) |
| 576 | Marmion | Walter Scott | not recorded | — | 1832, 1894 | [#4010](https://www.gutenberg.org/ebooks/4010) |
| 577 | Lady Susan | Jane Austen | not recorded | — | 1817 | [#946](https://www.gutenberg.org/ebooks/946) |
| 578 | Morals and Dogma of the Ancient and Accepted Scottish Rite of Freemasonry | Albert Pike | not recorded | — | 1891 | [#19447](https://www.gutenberg.org/ebooks/19447) |
| 579 | Dorothy and the Wizard in Oz | L. Frank Baum | not recorded | — | 1919 | [#22566](https://www.gutenberg.org/ebooks/22566) |
| 580 | Maria | Mary Wollstonecraft | not recorded | — | 1797 | [#134](https://www.gutenberg.org/ebooks/134) |
| 581 | Manual of Egyptian Archaeology and Guide to the Study of Antiquities in Egypt | G. Maspero | not recorded | Amelia B. Edwards | 1916, 1892 | [#14400](https://www.gutenberg.org/ebooks/14400) |
| 582 | The Book of Dragons | E. Nesbit | not recorded | — | 1924 | [#23661](https://www.gutenberg.org/ebooks/23661) |
| 583 | English Eccentrics and Eccentricities | John Timbs | not recorded | — | 1875 | [#50439](https://www.gutenberg.org/ebooks/50439) |
| 584 | Pushing to the Front | Orison Swett Marden | not recorded | — | 1924 | [#21291](https://www.gutenberg.org/ebooks/21291) |
| 585 | Faust | Johann Wolfgang von Goethe | not recorded | John Stuart Blackie | 1832, 1895 | [#63203](https://www.gutenberg.org/ebooks/63203) |
| 586 | The Story of the Heavens | Robert S. Ball | not recorded | — | 1913 | [#27378](https://www.gutenberg.org/ebooks/27378) |
| 587 | The Fables of La Fontaine | Jean de La Fontaine | not recorded | Walter Thornbury | 1695, 1876 | [#50316](https://www.gutenberg.org/ebooks/50316) |
| 588 | Complete Prose Works | Walt Whitman | not recorded | — | 1892 | [#8813](https://www.gutenberg.org/ebooks/8813) |
| 589 | The Pencil of Nature | William Henry Fox Talbot | not recorded | — | 1877 | [#33447](https://www.gutenberg.org/ebooks/33447) |
| 590 | The Narrative of Arthur Gordon Pym of Nantucket | Edgar Allan Poe | not recorded | — | 1849 | [#51060](https://www.gutenberg.org/ebooks/51060) |
| 591 | On the Origin of Species by Means of Natural Selection | Charles Darwin | not recorded | — | 1882 | [#22764](https://www.gutenberg.org/ebooks/22764) |
| 592 | River Legends | Edward Knatchbull-Hugessen | not recorded | — | 1893 | [#44425](https://www.gutenberg.org/ebooks/44425) |
| 593 | The Logic of Hegel | Georg Wilhelm Friedrich Hegel | not recorded | William Wallace | 1831, 1897 | [#55108](https://www.gutenberg.org/ebooks/55108) |
| 594 | Pamphlets and Parodies on Political Subjects | William Hone | not recorded | — | 1842 | [#44520](https://www.gutenberg.org/ebooks/44520) |
| 595 | News from Nowhere | William Morris | not recorded | — | 1896 | [#3261](https://www.gutenberg.org/ebooks/3261) |
| 596 | Little Lord Fauntleroy | Frances Hodgson Burnett | not recorded | — | 1924 | [#479](https://www.gutenberg.org/ebooks/479) |
| 597 | The Prose Works of William Wordsworth | William Wordsworth | not recorded | — | 1850, 1899 | [#16550](https://www.gutenberg.org/ebooks/16550) |
| 598 | Pele and Hiiaka | Nathaniel Bright Emerson | not recorded | — | 1915 | [#60279](https://www.gutenberg.org/ebooks/60279) |
| 599 | The No Breakfast Plan and the Fasting-Cure | Edward Hooker Dewey | not recorded | — | 1904 | [#27128](https://www.gutenberg.org/ebooks/27128) |
| 600 | Outdoor Sketching Four Talks Given before the Art Institute of Chicago | Francis Hopkinson Smith | not recorded | — | 1915 | [#27340](https://www.gutenberg.org/ebooks/27340) |
| 601 | The Sign of the Spider | Bertram Mitford | not recorded | — | 1914 | [#27476](https://www.gutenberg.org/ebooks/27476) |
| 602 | The English spy | C. M. Westmacott | not recorded | — | 1868 | [#20001](https://www.gutenberg.org/ebooks/20001) |
| 603 | Richard I | Jacob Abbott | not recorded | — | 1879 | [#26939](https://www.gutenberg.org/ebooks/26939) |
| 604 | Fifteen sonnets of Petrarch | Francesco Petrarca | not recorded | Thomas Wentworth Higginson | 1374, 1911 | [#50307](https://www.gutenberg.org/ebooks/50307) |
| 605 | The Education of Henry Adams | Henry Adams | not recorded | — | 1918, 1924 | [#2044](https://www.gutenberg.org/ebooks/2044) |
| 606 | Lamia | John Keats | not recorded | — | 1821 | [#2490](https://www.gutenberg.org/ebooks/2490) |
| 607 | Poems | Christina Georgina Rossetti | not recorded | — | 1894 | [#19188](https://www.gutenberg.org/ebooks/19188) |
| 608 | The Temple of Nature | Erasmus Darwin | not recorded | — | 1802 | [#26861](https://www.gutenberg.org/ebooks/26861) |
| 609 | At the Back of the North Wind | George MacDonald | not recorded | — | 1905 | [#225](https://www.gutenberg.org/ebooks/225) |
| 610 | Sartor Resartus | Thomas Carlyle | not recorded | — | 1881 | [#1051](https://www.gutenberg.org/ebooks/1051) |
| 611 | Wives and Daughters | Elizabeth Cleghorn Gaskell | not recorded | — | 1865 | [#4274](https://www.gutenberg.org/ebooks/4274) |
| 612 | Tales of Two Countries | Alexander Lange Kielland | not recorded | William Archer | 1906, 1895, 1924 | [#8663](https://www.gutenberg.org/ebooks/8663) |
| 613 | Louis Philippe | John S. C. Abbott | not recorded | — | 1877 | [#28199](https://www.gutenberg.org/ebooks/28199) |
| 614 | A Little Girl in Old New York | Amanda M. Douglas | not recorded | — | 1916 | [#23780](https://www.gutenberg.org/ebooks/23780) |
| 615 | Folkways | William Graham Sumner | not recorded | — | 1910 | [#24253](https://www.gutenberg.org/ebooks/24253) |
| 616 | The Discoverie of Witchcraft | Reginald Scot | not recorded | — | 1599, 1892 | [#60766](https://www.gutenberg.org/ebooks/60766) |
| 617 | Addie's Husband | Mrs. Gordon Smythies | not recorded | — | 1883 | [#49806](https://www.gutenberg.org/ebooks/49806) |
| 618 | Miscellaneous Aphorisms | Oscar Wilde | not recorded | — | 1900 | [#33979](https://www.gutenberg.org/ebooks/33979) |
| 619 | Gentle Measures in the Management and Training of the Young | Jacob Abbott | not recorded | — | 1879 | [#11667](https://www.gutenberg.org/ebooks/11667) |
| 620 | Areopagitica | John Milton | not recorded | — | 1674 | [#608](https://www.gutenberg.org/ebooks/608) |
| 621 | An Explorer's Adventures in Tibet | Arnold Henry Savage Landor | not recorded | — | 1924 | [#27021](https://www.gutenberg.org/ebooks/27021) |
| 622 | The Autobiography of Charles Darwin | Charles Darwin | not recorded | — | 1882, 1925 | [#2010](https://www.gutenberg.org/ebooks/2010) |
| 623 | Treatise on Poisons | Robert Christison | not recorded | — | 1882 | [#65341](https://www.gutenberg.org/ebooks/65341) |
| 624 | Troilus and Criseyde | Geoffrey Chaucer | not recorded | — | 1400 | [#257](https://www.gutenberg.org/ebooks/257) |
| 625 | Can Such Things Be? | Ambrose Bierce | not recorded | — | 1913 | [#4366](https://www.gutenberg.org/ebooks/4366) |
| 626 | Mysteries of Bee-keeping Explained | M. Quinby | not recorded | — | 1875 | [#25185](https://www.gutenberg.org/ebooks/25185) |
| 627 | Lincoln's Gettysburg Address | Abraham Lincoln | not recorded | — | 1865 | [#4](https://www.gutenberg.org/ebooks/4) |
| 628 | The Care of Books | John Willis Clark | not recorded | — | 1910 | [#26378](https://www.gutenberg.org/ebooks/26378) |
| 629 | The plant-lore & garden-craft of Shakespeare | Henry Nicholson Ellacombe | not recorded | — | 1916 | [#28407](https://www.gutenberg.org/ebooks/28407) |
| 630 | An Autobiography of Anthony Trollope | Anthony Trollope | not recorded | — | 1882 | [#5978](https://www.gutenberg.org/ebooks/5978) |
| 631 | Aurora Leigh | Elizabeth Barrett Browning | not recorded | — | 1861 | [#56621](https://www.gutenberg.org/ebooks/56621) |
| 632 | The Lusiad | Luís de Camões | not recorded | William Julius Mickle | 1580, 1788 | [#32528](https://www.gutenberg.org/ebooks/32528) |
| 633 | Jewish Literature and Other Essays | Gustav Karpeles | not recorded | — | 1909 | [#27901](https://www.gutenberg.org/ebooks/27901) |
| 634 | The English Constitution | Walter Bagehot | not recorded | — | 1877 | [#4351](https://www.gutenberg.org/ebooks/4351) |
| 635 | How to Tell a Story, and Other Essays | Mark Twain | not recorded | — | 1910 | [#3250](https://www.gutenberg.org/ebooks/3250) |
| 636 | The Works of William Cowper | William Cowper | not recorded | — | 1800, 1861, 1820, 1850 | [#47790](https://www.gutenberg.org/ebooks/47790) |
| 637 | Progress and Poverty, Volumes I and II | Henry George | not recorded | — | 1897 | [#55308](https://www.gutenberg.org/ebooks/55308) |
| 638 | Rollo's Museum | Jacob Abbott | not recorded | — | 1879 | [#25548](https://www.gutenberg.org/ebooks/25548) |
| 639 | A Defence of Poesie and Poems | Philip Sidney | not recorded | — | 1586 | [#1962](https://www.gutenberg.org/ebooks/1962) |
| 640 | The Dash for Khartoum | G. A. Henty | not recorded | — | 1902 | [#21986](https://www.gutenberg.org/ebooks/21986) |
| 641 | A Political History of the State of New York, Volumes 1-3 | De Alva Stanwood Alexander | not recorded | — | 1925 | [#22591](https://www.gutenberg.org/ebooks/22591) |
| 642 | Folk-Tales of Bengal | Lal Behari Day | not recorded | — | 1894 | [#38488](https://www.gutenberg.org/ebooks/38488) |
| 643 | A Bird-Lover in the West | Olive Thorne Miller | not recorded | — | 1918 | [#27902](https://www.gutenberg.org/ebooks/27902) |
| 644 | The Night Land | William Hope Hodgson | not recorded | — | 1918 | [#10662](https://www.gutenberg.org/ebooks/10662) |
| 645 | The Aztec Treasure-House | Thomas A. Janvier | not recorded | — | 1913 | [#21618](https://www.gutenberg.org/ebooks/21618) |
| 646 | American Notes | Charles Dickens | not recorded | — | 1870 | [#675](https://www.gutenberg.org/ebooks/675) |
| 647 | The Book-Hunter | John Hill Burton | not recorded | — | 1881 | [#22136](https://www.gutenberg.org/ebooks/22136) |
| 648 | Six metaphysical meditations | René Descartes | not recorded | William Molyneux | 1650, 1679, 1698 | [#70091](https://www.gutenberg.org/ebooks/70091) |
| 649 | The Scourge of God | John Bloundelle-Burton | not recorded | — | 1917 | [#52734](https://www.gutenberg.org/ebooks/52734) |
| 650 | Five Children and It | E. Nesbit | not recorded | — | 1924 | [#17314](https://www.gutenberg.org/ebooks/17314) |
| 651 | Mary Barton | Elizabeth Cleghorn Gaskell | not recorded | — | 1865 | [#2153](https://www.gutenberg.org/ebooks/2153) |
| 652 | The American | Henry James | not recorded | — | 1916 | [#177](https://www.gutenberg.org/ebooks/177) |
| 653 | The Huguenots in France | Samuel Smiles | not recorded | — | 1904 | [#26524](https://www.gutenberg.org/ebooks/26524) |
| 654 | Ten Thousand Miles with a Dog Sled | Hudson Stuck | not recorded | — | 1920 | [#22965](https://www.gutenberg.org/ebooks/22965) |
| 655 | Daniel Deronda | George Eliot | not recorded | — | 1880 | [#7469](https://www.gutenberg.org/ebooks/7469) |
| 656 | The Invasion of India by Alexander the Great as described by Arrian, Q. Curtius, Diodoros, Plutarch and Justin | John Watson McCrindle | not recorded | — | 1913 | [#66388](https://www.gutenberg.org/ebooks/66388) |
| 657 | A Short History of English Agriculture | W. H. R. Curtler | not recorded | — | 1925 | [#16594](https://www.gutenberg.org/ebooks/16594) |
| 658 | A Little Girl in Old Boston | Amanda M. Douglas | not recorded | — | 1916 | [#23786](https://www.gutenberg.org/ebooks/23786) |
| 659 | The Humbugs of the World | P. T. Barnum | not recorded | — | 1891 | [#26640](https://www.gutenberg.org/ebooks/26640) |
| 660 | A History of Art for Beginners and Students | Clara Erskine Clement Waters | not recorded | — | 1916 | [#25632](https://www.gutenberg.org/ebooks/25632) |
| 661 | Paul Clifford | Edward Bulwer-Lytton | not recorded | — | 1873 | [#7735](https://www.gutenberg.org/ebooks/7735) |
| 662 | Maggie | Stephen Crane | not recorded | — | 1900 | [#447](https://www.gutenberg.org/ebooks/447) |
| 663 | Hegel's Philosophy of Mind | Georg Wilhelm Friedrich Hegel | not recorded | William Wallace | 1831, 1897 | [#39064](https://www.gutenberg.org/ebooks/39064) |
| 664 | Lost Face | Jack London | not recorded | — | 1916 | [#2429](https://www.gutenberg.org/ebooks/2429) |
| 665 | The Son of Monte-Cristo | Jules Lermina | not recorded | — | 1915 | [#26216](https://www.gutenberg.org/ebooks/26216) |
| 666 | A Doctor of the Old School | Ian Maclaren | not recorded | — | 1907 | [#9320](https://www.gutenberg.org/ebooks/9320) |
| 667 | Mrs. Spring Fragrance | Sui Sin Far | not recorded | — | 1914 | [#62940](https://www.gutenberg.org/ebooks/62940) |
| 668 | The Well at the World's End | William Morris | not recorded | — | 1896 | [#169](https://www.gutenberg.org/ebooks/169) |
| 669 | Beatrice d'Este, Duchess of Milan, 1475-1497 | Julia Cartwright | not recorded | — | 1924 | [#25622](https://www.gutenberg.org/ebooks/25622) |
| 670 | Fenimore Cooper's Literary Offences | Mark Twain | not recorded | — | 1910 | [#3172](https://www.gutenberg.org/ebooks/3172) |
| 671 | Tacitus on Germany | Cornelius Tacitus | not recorded | Thomas Gordon | 117, 1750 | [#2995](https://www.gutenberg.org/ebooks/2995) |
| 672 | Typee | Herman Melville | not recorded | — | 1891, 1908 | [#1900](https://www.gutenberg.org/ebooks/1900) |
| 673 | Acres of Diamonds | Russell H. Conwell | not recorded | — | 1925, 1923 | [#368](https://www.gutenberg.org/ebooks/368) |
| 674 | The guide for the perplexed | Moses Maimonides | not recorded | M. Friedländer | 1204, 1910 | [#73584](https://www.gutenberg.org/ebooks/73584) |
| 675 | Evelina, Or, the History of a Young Lady's Entrance into the World | Fanny Burney | not recorded | — | 1840 | [#6053](https://www.gutenberg.org/ebooks/6053) |
| 676 | The Expedition to Borneo of H.M.S. Dido | Henry Keppel & James Brooke | not recorded | — | 1904, 1868 | [#22903](https://www.gutenberg.org/ebooks/22903) |
| 677 | The Upper Berth | F. Marion Crawford | not recorded | — | 1909 | [#22246](https://www.gutenberg.org/ebooks/22246) |
| 678 | Superstitions of the Highlands & Islands of Scotland | John Gregorson Campbell | not recorded | — | 1891 | [#61730](https://www.gutenberg.org/ebooks/61730) |
| 679 | The Campaign of 1776 around New York and Brooklyn | Henry Phelps Johnston | not recorded | — | 1923 | [#21990](https://www.gutenberg.org/ebooks/21990) |
| 680 | Lays of Ancient Rome | Thomas Babington Macaulay | not recorded | — | 1859 | [#847](https://www.gutenberg.org/ebooks/847) |
| 681 | Popular Education | Ira Mayhew | not recorded | — | 1894 | [#27742](https://www.gutenberg.org/ebooks/27742) |
| 682 | The Fortunes and Misfortunes of the Famous Moll Flanders | Daniel Defoe | not recorded | — | 1731 | [#370](https://www.gutenberg.org/ebooks/370) |
| 683 | Olive | Dinah Maria Mulock Craik | not recorded | — | 1887 | [#22121](https://www.gutenberg.org/ebooks/22121) |
| 684 | The Peterkin Papers | Lucretia P. Hale | not recorded | — | 1900 | [#25648](https://www.gutenberg.org/ebooks/25648) |
| 685 | The Metaphysical Elements of Ethics | Immanuel Kant | not recorded | Thomas Kingsmill Abbott | 1804, 1913 | [#5684](https://www.gutenberg.org/ebooks/5684) |
| 686 | Lord Arthur Savile's Crime | Oscar Wilde | not recorded | — | 1900 | [#773](https://www.gutenberg.org/ebooks/773) |
| 687 | The Orbis Pictus | Johann Amos Comenius | not recorded | Charles Hoole | 1670, 1924, 1667 | [#28299](https://www.gutenberg.org/ebooks/28299) |
| 688 | A Popular History of Astronomy During the Nineteenth Century | Agnes M. Clerke | not recorded | — | 1907 | [#28247](https://www.gutenberg.org/ebooks/28247) |
| 689 | The Water-Babies | Charles Kingsley | not recorded | — | 1875 | [#25564](https://www.gutenberg.org/ebooks/25564) |
| 690 | The Vicar of Wakefield | Oliver Goldsmith | not recorded | — | 1774 | [#2667](https://www.gutenberg.org/ebooks/2667) |
| 691 | Stories from Hans Andersen | H. C. Andersen | not recorded | — | 1875 | [#17860](https://www.gutenberg.org/ebooks/17860) |
| 692 | The Way To Geometry | Petrus Ramus | not recorded | William Bedwell | 1572, 1632 | [#26752](https://www.gutenberg.org/ebooks/26752) |
| 693 | Godfrey Morgan | Jules Verne | not recorded | — | 1905 | [#23489](https://www.gutenberg.org/ebooks/23489) |
| 694 | The Toilers of the Field | Richard Jefferies | not recorded | — | 1887 | [#27516](https://www.gutenberg.org/ebooks/27516) |
| 695 | The Way We Live Now | Anthony Trollope | not recorded | — | 1882 | [#5231](https://www.gutenberg.org/ebooks/5231) |
| 696 | A Woman of No Importance | Oscar Wilde | not recorded | — | 1900 | [#854](https://www.gutenberg.org/ebooks/854) |
| 697 | Modern Magic | Professor Hoffmann | not recorded | — | 1919 | [#58057](https://www.gutenberg.org/ebooks/58057) |
| 698 | Hans Andersen's Fairy Tales | H. C. Andersen | not recorded | — | 1875 | [#66688](https://www.gutenberg.org/ebooks/66688) |
| 699 | Sophist | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1735](https://www.gutenberg.org/ebooks/1735) |
| 700 | Antony and Cleopatra | William Shakespeare | not recorded | — | 1616 | [#1534](https://www.gutenberg.org/ebooks/1534) |
| 701 | The Praise of Folly | Desiderius Erasmus | not recorded | John Wilson | 1536, 1696 | [#9371](https://www.gutenberg.org/ebooks/9371) |
| 702 | Home Life in Colonial Days | Alice Morse Earle | not recorded | — | 1911 | [#22675](https://www.gutenberg.org/ebooks/22675) |
| 703 | The Renaissance | Walter Pater | not recorded | — | 1894 | [#2398](https://www.gutenberg.org/ebooks/2398) |
| 704 | The Poetical Works of John Milton | John Milton | not recorded | — | 1674, 1919 | [#1745](https://www.gutenberg.org/ebooks/1745) |
| 705 | Le Morte Darthur | Thomas Malory | not recorded | — | 1471, 1491, 1901 | [#46853](https://www.gutenberg.org/ebooks/46853) |
| 706 | Ragged Dick, Or, Street Life in New York with the Boot-Blacks | Horatio Alger Jr. | not recorded | — | 1899 | [#5348](https://www.gutenberg.org/ebooks/5348) |
| 707 | The blue book of chess | Howard Staunton | not recorded | — | 1874 | [#16377](https://www.gutenberg.org/ebooks/16377) |
| 708 | Tales of the Malayan Coast | Rounsevelle Wildman | not recorded | — | 1901 | [#27784](https://www.gutenberg.org/ebooks/27784) |
| 709 | An Essay on the Development of Christian Doctrine | John Henry Newman | not recorded | — | 1890 | [#35110](https://www.gutenberg.org/ebooks/35110) |
| 710 | The Tragical History of Doctor Faustus | Christopher Marlowe | not recorded | — | 1593, 1869 | [#811](https://www.gutenberg.org/ebooks/811) |
| 711 | Uncle Sam's Boys in the Ranks | H. Irving Hancock | not recorded | — | 1922 | [#27680](https://www.gutenberg.org/ebooks/27680) |
| 712 | Letters of Felix Mendelssohn-Bartholdy from 1833 to 1847 | Felix Mendelssohn-Bartholdy | not recorded | Wallace, Grace, Lady | 1847, 1877, 1897, 1874, 1878 | [#50473](https://www.gutenberg.org/ebooks/50473) |
| 713 | India | F. Max Müller | not recorded | — | 1900, 1908 | [#20847](https://www.gutenberg.org/ebooks/20847) |
| 714 | Waverley | Walter Scott | not recorded | — | 1832, 1912 | [#5998](https://www.gutenberg.org/ebooks/5998) |
| 715 | Shirley | Charlotte Brontë | not recorded | — | 1855 | [#30486](https://www.gutenberg.org/ebooks/30486) |
| 716 | Critias | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1571](https://www.gutenberg.org/ebooks/1571) |
| 717 | How to Observe | Harriet Martineau | not recorded | — | 1876 | [#33944](https://www.gutenberg.org/ebooks/33944) |
| 718 | Elizabeth Montagu, the queen of the bluestockings, Volumes 1 and 2 | Mrs. Montagu | not recorded | — | 1800, 1921 | [#70593](https://www.gutenberg.org/ebooks/70593) |
| 719 | Footprints in the Forest | Edward Sylvester Ellis | not recorded | — | 1916 | [#25980](https://www.gutenberg.org/ebooks/25980) |
| 720 | The Magic World | E. Nesbit | not recorded | — | 1924 | [#27903](https://www.gutenberg.org/ebooks/27903) |
| 721 | Natural History of the Mammalia of India and Ceylon | Robert Armitage Sterndale | not recorded | — | 1902 | [#19550](https://www.gutenberg.org/ebooks/19550) |
| 722 | The Fable of the Bees | Bernard Mandeville | not recorded | — | 1733 | [#57260](https://www.gutenberg.org/ebooks/57260) |
| 723 | Holy in Christ | Andrew Murray | not recorded | — | 1917 | [#26990](https://www.gutenberg.org/ebooks/26990) |
| 724 | Martin Chuzzlewit | Charles Dickens | not recorded | — | 1870 | [#968](https://www.gutenberg.org/ebooks/968) |
| 725 | 1900 | Ingersoll Lockwood | not recorded | — | 1918 | [#60479](https://www.gutenberg.org/ebooks/60479) |
| 726 | Thomas Davis, selections from his prose and poetry | Thomas Davis | not recorded | — | 1845, 1920 | [#21210](https://www.gutenberg.org/ebooks/21210) |
| 727 | The First Blast of the Trumpet against the monstrous regiment of Women | John Knox | not recorded | — | 1572, 1912 | [#9660](https://www.gutenberg.org/ebooks/9660) |
| 728 | The Swiss Family Robinson | Johann David Wyss | not recorded | — | 1818 | [#11703](https://www.gutenberg.org/ebooks/11703) |
| 729 | Louis XIV | John S. C. Abbott | not recorded | — | 1877 | [#27056](https://www.gutenberg.org/ebooks/27056) |
| 730 | History of Indian and Eastern Architecture | James Fergusson | not recorded | — | 1886 | [#61178](https://www.gutenberg.org/ebooks/61178) |
| 731 | Three Dialogues Between Hylas and Philonous in Opposition to Sceptics and Atheists | George Berkeley | not recorded | — | 1753 | [#4724](https://www.gutenberg.org/ebooks/4724) |
| 732 | A journal, of a young man of Massachusetts, late a surgeon on board an American privateer, who was captured at sea by th | Benjamin Waterhouse | not recorded | — | 1846 | [#27763](https://www.gutenberg.org/ebooks/27763) |
| 733 | Unbeaten Tracks in Japan | Isabella L. Bird | not recorded | — | 1904 | [#2184](https://www.gutenberg.org/ebooks/2184) |
| 734 | Beeton's Book of Needlework | Mrs. Beeton | not recorded | — | 1865 | [#15147](https://www.gutenberg.org/ebooks/15147) |
| 735 | The Piazza Tales | Herman Melville | not recorded | — | 1891 | [#15859](https://www.gutenberg.org/ebooks/15859) |
| 736 | The People's Common Sense Medical Adviser in Plain English | Ray Vaughn Pierce | not recorded | — | 1914 | [#18467](https://www.gutenberg.org/ebooks/18467) |
| 737 | Nostromo | Joseph Conrad | not recorded | — | 1924 | [#2021](https://www.gutenberg.org/ebooks/2021) |
| 738 | McGuffey's Third Eclectic Reader | William Holmes McGuffey | not recorded | — | 1873 | [#14766](https://www.gutenberg.org/ebooks/14766) |
| 739 | Barnaby Rudge | Charles Dickens | not recorded | — | 1870 | [#917](https://www.gutenberg.org/ebooks/917) |
| 740 | Explanation of Terms Used in Entomology | John Bernhard Smith | not recorded | — | 1912 | [#22748](https://www.gutenberg.org/ebooks/22748) |
| 741 | Orlando Furioso | Lodovico Ariosto | not recorded | William Stewart Rose | 1533, 1843 | [#615](https://www.gutenberg.org/ebooks/615) |
| 742 | Lilith | George MacDonald | not recorded | — | 1905 | [#1640](https://www.gutenberg.org/ebooks/1640) |
| 743 | The Last Twelve Verses of the Gospel According to S. Mark | John William Burgon | not recorded | — | 1888 | [#26134](https://www.gutenberg.org/ebooks/26134) |
| 744 | The Motor Pirate | G. Sidney Paternoster | not recorded | — | 1925 | [#26657](https://www.gutenberg.org/ebooks/26657) |
| 745 | Herbal simples approved for modern uses of cure | William Thomas Fernie | not recorded | — | 1914 | [#19352](https://www.gutenberg.org/ebooks/19352) |
| 746 | Washington Square | Henry James | not recorded | — | 1916 | [#2870](https://www.gutenberg.org/ebooks/2870) |
| 747 | The Patriotic Poems of Walt Whitman | Walt Whitman | not recorded | — | 1892 | [#27494](https://www.gutenberg.org/ebooks/27494) |
| 748 | The Progress of Invention in the Nineteenth Century. | Edward W. Byrn | not recorded | — | 1921 | [#41538](https://www.gutenberg.org/ebooks/41538) |
| 749 | The Criminal Prosecution and Capital Punishment of Animals | E. P. Evans | not recorded | — | 1917 | [#43286](https://www.gutenberg.org/ebooks/43286) |
| 750 | The Essays of "George Eliot" | George Eliot | not recorded | — | 1880, 1888 | [#28289](https://www.gutenberg.org/ebooks/28289) |
| 751 | My Daily Meditation for the Circling Year | John Henry Jowett | not recorded | — | 1923 | [#23241](https://www.gutenberg.org/ebooks/23241) |
| 752 | The republic of Cicero Translated from the Latin | Marcus Tullius Cicero | not recorded | George William Featherstonhaugh | 43 BC, 1866 | [#54161](https://www.gutenberg.org/ebooks/54161) |
| 753 | On the Economy of Machinery and Manufactures | Charles Babbage | not recorded | — | 1871 | [#4238](https://www.gutenberg.org/ebooks/4238) |
| 754 | Endymion | John Keats | not recorded | — | 1821 | [#24280](https://www.gutenberg.org/ebooks/24280) |
| 755 | A Theodicy, or, Vindication of the Divine Glory | Albert Taylor Bledsoe | not recorded | — | 1877 | [#27869](https://www.gutenberg.org/ebooks/27869) |
| 756 | McGuffey's Fourth Eclectic Reader | William Holmes McGuffey | not recorded | — | 1873 | [#14880](https://www.gutenberg.org/ebooks/14880) |
| 757 | Anecdotes of Dogs | Edward Jesse | not recorded | — | 1868 | [#26500](https://www.gutenberg.org/ebooks/26500) |
| 758 | Agnes Grey | Anne Brontë | not recorded | — | 1849 | [#767](https://www.gutenberg.org/ebooks/767) |
| 759 | Hannibal | Jacob Abbott | not recorded | — | 1879 | [#27551](https://www.gutenberg.org/ebooks/27551) |
| 760 | The Young Alaskans | Emerson Hough | not recorded | — | 1923 | [#25494](https://www.gutenberg.org/ebooks/25494) |
| 761 | History of Phoenicia | George Rawlinson | not recorded | — | 1902 | [#2331](https://www.gutenberg.org/ebooks/2331) |
| 762 | The Essence of Christianity | Ludwig Feuerbach | not recorded | George Eliot | 1872, 1880 | [#47025](https://www.gutenberg.org/ebooks/47025) |
| 763 | The Every Day Book of History and Chronology | Joel Munsell | not recorded | — | 1880 | [#44028](https://www.gutenberg.org/ebooks/44028) |
| 764 | Observations upon the Prophecies of Daniel, and the Apocalypse of St. John | Isaac Newton | not recorded | — | 1727 | [#16878](https://www.gutenberg.org/ebooks/16878) |
| 765 | Up the Orinoco and down the Magdalena | J. A. Zahm | not recorded | — | 1921 | [#45848](https://www.gutenberg.org/ebooks/45848) |
| 766 | Unto This Last, and Other Essays on Political Economy | John Ruskin | not recorded | — | 1900 | [#36541](https://www.gutenberg.org/ebooks/36541) |
| 767 | Correspondence and Report from His Majesty's Consul at Boma Respecting the Administration of the Independent State of th | Roger Casement | not recorded | — | 1916 | [#50573](https://www.gutenberg.org/ebooks/50573) |
| 768 | Society and solitude | Ralph Waldo Emerson | not recorded | — | 1882 | [#69258](https://www.gutenberg.org/ebooks/69258) |
| 769 | Travels with a donkey in the Cevennes | Robert Louis Stevenson | not recorded | — | 1894 | [#535](https://www.gutenberg.org/ebooks/535) |
| 770 | The Story of King Arthur and his Knights | Howard Pyle | not recorded | — | 1911 | [#60184](https://www.gutenberg.org/ebooks/60184) |
| 771 | Rob Roy | Walter Scott | not recorded | — | 1832 | [#7025](https://www.gutenberg.org/ebooks/7025) |
| 772 | A Girl of the Limberlost | Gene Stratton-Porter | not recorded | — | 1924 | [#125](https://www.gutenberg.org/ebooks/125) |
| 773 | British Goblins | Wirt Sikes | not recorded | — | 1883 | [#34704](https://www.gutenberg.org/ebooks/34704) |
| 774 | Representative Men | Ralph Waldo Emerson | not recorded | — | 1882 | [#6312](https://www.gutenberg.org/ebooks/6312) |
| 775 | The School for Scandal | Richard Brinsley Sheridan | not recorded | — | 1816 | [#1929](https://www.gutenberg.org/ebooks/1929) |
| 776 | Ancient society | Lewis Henry Morgan | not recorded | — | 1881 | [#45950](https://www.gutenberg.org/ebooks/45950) |
| 777 | Plunkitt of Tammany Hall | George Washington Plunkitt | not recorded | — | 1924, 1909 | [#2810](https://www.gutenberg.org/ebooks/2810) |
| 778 | The Task, and Other Poems | William Cowper | not recorded | — | 1800 | [#3698](https://www.gutenberg.org/ebooks/3698) |
| 779 | New Latin Grammar | Charles E. Bennett | not recorded | — | 1921 | [#15665](https://www.gutenberg.org/ebooks/15665) |
| 780 | The Thoughts of Blaise Pascal | Blaise Pascal | not recorded | C. Kegan Paul | 1662, 1904, 1902 | [#46921](https://www.gutenberg.org/ebooks/46921) |
| 781 | Aladdin and the Magic Lamp | Unknown | not recorded | — | Unknown (year not known) | [#57](https://www.gutenberg.org/ebooks/57) |
| 782 | Mutual Aid | Peter Kropotkin | not recorded | — | 1921 | [#4341](https://www.gutenberg.org/ebooks/4341) |
| 783 | Enquire within upon everything | Robert Kemp Philp | not recorded | — | 1882 | [#10766](https://www.gutenberg.org/ebooks/10766) |
| 784 | A Wonder Book for Girls & Boys | Nathaniel Hawthorne | not recorded | — | 1864 | [#32242](https://www.gutenberg.org/ebooks/32242) |
| 785 | On the Improvement of the Understanding | Benedictus de Spinoza | not recorded | R. H. M. Elwes | 1677, 1892 | [#1016](https://www.gutenberg.org/ebooks/1016) |
| 786 | The Game of Logic | Lewis Carroll | not recorded | — | 1898 | [#4763](https://www.gutenberg.org/ebooks/4763) |
| 787 | A Latin Grammar for Schools and Colleges | George Martin Lane | not recorded | — | 1897, 1910 | [#44653](https://www.gutenberg.org/ebooks/44653) |
| 788 | Comic History of the United States | Bill Nye | not recorded | — | 1896 | [#21427](https://www.gutenberg.org/ebooks/21427) |
| 789 | The principles of science | William Stanley Jevons | not recorded | — | 1882 | [#74864](https://www.gutenberg.org/ebooks/74864) |
| 790 | With Cochrane the Dauntless | G. A. Henty | not recorded | — | 1902 | [#25993](https://www.gutenberg.org/ebooks/25993) |
| 791 | Reels and Spindles | Evelyn Raymond | not recorded | — | 1910 | [#27613](https://www.gutenberg.org/ebooks/27613) |
| 792 | The Art of Perfumery, and Methods of Obtaining the Odors of Plants | G. W. Septimus Piesse | not recorded | — | 1882 | [#16378](https://www.gutenberg.org/ebooks/16378) |
| 793 | McTeague | Frank Norris | not recorded | — | 1902 | [#165](https://www.gutenberg.org/ebooks/165) |
| 794 | Forty-one years in India | Frederick Sleigh Roberts | not recorded | — | 1914 | [#16528](https://www.gutenberg.org/ebooks/16528) |
| 795 | The Ambassadors | Henry James | not recorded | — | 1916 | [#432](https://www.gutenberg.org/ebooks/432) |
| 796 | Tom Brown's School Days | Thomas Hughes | not recorded | — | 1896 | [#1480](https://www.gutenberg.org/ebooks/1480) |
| 797 | Charlotte Temple | Mrs. Rowson | not recorded | — | 1824 | [#171](https://www.gutenberg.org/ebooks/171) |
| 798 | Essays in the Art of Writing | Robert Louis Stevenson | not recorded | — | 1894 | [#492](https://www.gutenberg.org/ebooks/492) |
| 799 | Three Months in the Southern States, April-June 1863 | Arthur James Lyon Fremantle | not recorded | — | 1901 | [#20928](https://www.gutenberg.org/ebooks/20928) |
| 800 | Preface to Shakespeare | Samuel Johnson | not recorded | — | 1784 | [#5429](https://www.gutenberg.org/ebooks/5429) |
| 801 | Give Me Liberty or Give Me Death | Patrick Henry | not recorded | — | 1799 | [#6](https://www.gutenberg.org/ebooks/6) |
| 802 | Byzantine Constantinople, the walls of the city and adjoining historical sites | Alexander Van Millingen | not recorded | — | 1915 | [#61475](https://www.gutenberg.org/ebooks/61475) |
| 803 | Pinocchio | Carlo Collodi | not recorded | — | 1890 | [#16865](https://www.gutenberg.org/ebooks/16865) |
| 804 | Myths and Legends of Our Own Land | Charles M. Skinner | not recorded | — | 1907 | [#6615](https://www.gutenberg.org/ebooks/6615) |
| 805 | Sketches by Boz, Illustrative of Every-Day Life and Every-Day People | Charles Dickens | not recorded | — | 1870 | [#882](https://www.gutenberg.org/ebooks/882) |
| 806 | Myths & Legends of the Celtic Race | T. W. Rolleston | not recorded | — | 1920 | [#34081](https://www.gutenberg.org/ebooks/34081) |
| 807 | The Making of Bobby Burnit | George Randolph Chester | not recorded | — | 1924 | [#26485](https://www.gutenberg.org/ebooks/26485) |
| 808 | Annals and Antiquities of Rajasthan, v. 3 of 3 | James Tod | not recorded | — | 1835, 1923 | [#57376](https://www.gutenberg.org/ebooks/57376) |
| 809 | Ozma of Oz | L. Frank Baum | not recorded | — | 1919 | [#33361](https://www.gutenberg.org/ebooks/33361) |
| 810 | East of the Sun and West of the Moon | Peter Christen Asbjørnsen & Jørgen Engebretsen Moe | not recorded | — | 1885, 1882 | [#30973](https://www.gutenberg.org/ebooks/30973) |
| 811 | Life in the Iron-Mills | Rebecca Harding Davis | not recorded | — | 1910 | [#876](https://www.gutenberg.org/ebooks/876) |
| 812 | A Class-Book of New Testament History | G. F. Maclear | not recorded | — | 1902 | [#65247](https://www.gutenberg.org/ebooks/65247) |
| 813 | The Chronology of Ancient Kingdoms Amended | Isaac Newton | not recorded | — | 1727 | [#15784](https://www.gutenberg.org/ebooks/15784) |
| 814 | Little Wizard Stories of Oz | L. Frank Baum | not recorded | — | 1919 | [#25519](https://www.gutenberg.org/ebooks/25519) |
| 815 | Household Stories by the Brothers Grimm | Jacob Grimm & Wilhelm Grimm | not recorded | Lucy Crane | 1863, 1859, 1882 | [#19068](https://www.gutenberg.org/ebooks/19068) |
| 816 | Apologia pro vita sua | John Henry Newman | not recorded | — | 1890 | [#22088](https://www.gutenberg.org/ebooks/22088) |
| 817 | A History of Roman Classical Literature. | R. W. Browne | not recorded | — | 1895 | [#59455](https://www.gutenberg.org/ebooks/59455) |
| 818 | How to Get Strong and How to Stay So | William Blaikie | not recorded | — | 1904 | [#36557](https://www.gutenberg.org/ebooks/36557) |
| 819 | Divine Comedy, Longfellow's Translation, Purgatory | Dante Alighieri | not recorded | Henry Wadsworth Longfellow | 1321, 1882 | [#1002](https://www.gutenberg.org/ebooks/1002) |
| 820 | Dave Darrin on Mediterranean Service | H. Irving Hancock | not recorded | — | 1922 | [#22431](https://www.gutenberg.org/ebooks/22431) |
| 821 | Grace Abounding to the Chief of Sinners | John Bunyan | not recorded | — | 1688 | [#654](https://www.gutenberg.org/ebooks/654) |
| 822 | Journal of Researches into the Natural History and Geology of the Countries Visited During the Voyage Round the World of | Charles Darwin | not recorded | — | 1882 | [#3704](https://www.gutenberg.org/ebooks/3704) |
| 823 | The Witch of Salem | John R. Musick | not recorded | — | 1901 | [#26282](https://www.gutenberg.org/ebooks/26282) |
| 824 | A Narrative of the Life of David Crockett, of the State of Tennessee. | Davy Crockett | not recorded | — | 1836 | [#37925](https://www.gutenberg.org/ebooks/37925) |
| 825 | The Keepers of the Trail | Joseph A. Altsheler | not recorded | — | 1919 | [#25596](https://www.gutenberg.org/ebooks/25596) |
| 826 | The Standard Oratorios | George P. Upton | not recorded | — | 1919 | [#22793](https://www.gutenberg.org/ebooks/22793) |
| 827 | The Amores | Ovid | not recorded | Henry T. Riley | 17, 1878 | [#47676](https://www.gutenberg.org/ebooks/47676) |
| 828 | The Seven Plays in English Verse | Sophocles | not recorded | Lewis Campbell | 406 BC, 1908 | [#14484](https://www.gutenberg.org/ebooks/14484) |
| 829 | The Pleasures of Life | John Lubbock | not recorded | — | 1913 | [#7952](https://www.gutenberg.org/ebooks/7952) |
| 830 | Manifesto of the Communist Party | Karl Marx & Friedrich Engels | not recorded | — | 1883, 1895 | [#31193](https://www.gutenberg.org/ebooks/31193) |
| 831 | Stories from the Pentamerone | Giambattista Basile | not recorded | — | 1632 | [#2198](https://www.gutenberg.org/ebooks/2198) |
| 832 | The Book of Were-Wolves | S. Baring-Gould | not recorded | — | 1924 | [#5324](https://www.gutenberg.org/ebooks/5324) |
| 833 | Five Weeks in a Balloon | Jules Verne | not recorded | — | 1905 | [#3526](https://www.gutenberg.org/ebooks/3526) |
| 834 | Sesame and Lilies | John Ruskin | not recorded | — | 1900 | [#1293](https://www.gutenberg.org/ebooks/1293) |
| 835 | A History of Caricature and Grotesque in Literature and Art | Thomas Wright | not recorded | — | 1877 | [#44566](https://www.gutenberg.org/ebooks/44566) |
| 836 | Historic Boys | Elbridge S. Brooks | not recorded | — | 1902 | [#27157](https://www.gutenberg.org/ebooks/27157) |
| 837 | Modern cookery for private families | Eliza Acton | not recorded | — | 1859 | [#72482](https://www.gutenberg.org/ebooks/72482) |
| 838 | Mythology among the Hebrews and Its Historical Development | Ignác Goldziher | not recorded | R. Martineau | 1921, 1899, 1898 | [#48967](https://www.gutenberg.org/ebooks/48967) |
| 839 | Wagner, the Wehr-Wolf | George W. M. Reynolds | not recorded | — | 1879 | [#27202](https://www.gutenberg.org/ebooks/27202) |
| 840 | The Shirley Letters from California Mines in 1851-52 | Dame Shirley | not recorded | — | 1906 | [#23280](https://www.gutenberg.org/ebooks/23280) |
| 841 | The Autobiography of Benvenuto Cellini | Benvenuto Cellini | not recorded | John Addington Symonds | 1571, 1893 | [#4028](https://www.gutenberg.org/ebooks/4028) |
| 842 | Rollo in Scotland | Jacob Abbott | not recorded | — | 1879 | [#25174](https://www.gutenberg.org/ebooks/25174) |
| 843 | The Sorrows of Satan or, The Strange Experience of One Geoffrey Tempest, Millionaire | Marie Corelli | not recorded | — | 1924 | [#42332](https://www.gutenberg.org/ebooks/42332) |
| 844 | Virginibus Puerisque, and Other Papers | Robert Louis Stevenson | not recorded | — | 1894 | [#386](https://www.gutenberg.org/ebooks/386) |
| 845 | Sketches and Studies in Italy and Greece, Complete | John Addington Symonds | not recorded | — | 1893 | [#18893](https://www.gutenberg.org/ebooks/18893) |
| 846 | Wieland | Charles Brockden Brown | not recorded | — | 1810 | [#792](https://www.gutenberg.org/ebooks/792) |
| 847 | A Chronicle of London from 1089 to 1483 | Anonymous | not recorded | — | Anonymous (year not known), 1848, 1881 | [#27027](https://www.gutenberg.org/ebooks/27027) |
| 848 | McGuffey's Second Eclectic Reader | William Holmes McGuffey | not recorded | — | 1873 | [#14668](https://www.gutenberg.org/ebooks/14668) |
| 849 | The Georgics | Virgil | not recorded | James Rhoades | 19 BC, 1923 | [#232](https://www.gutenberg.org/ebooks/232) |
| 850 | Eureka | Edgar Allan Poe | not recorded | — | 1849 | [#32037](https://www.gutenberg.org/ebooks/32037) |
| 851 | Dikes and Ditches | Oliver Optic | not recorded | — | 1897 | [#25485](https://www.gutenberg.org/ebooks/25485) |
| 852 | The Journal to Stella | Jonathan Swift | not recorded | — | 1745, 1917 | [#4208](https://www.gutenberg.org/ebooks/4208) |
| 853 | Anomalies and Curiosities of Medicine | George M. Gould & Walter L. Pyle | not recorded | — | 1922, 1921 | [#747](https://www.gutenberg.org/ebooks/747) |
| 854 | Vikram and the Vampire | Richard Francis Burton | not recorded | — | 1890, 1896 | [#2400](https://www.gutenberg.org/ebooks/2400) |
| 855 | The Eighteenth Brumaire of Louis Bonaparte | Karl Marx | not recorded | Daniel de Leon | 1883, 1914 | [#1346](https://www.gutenberg.org/ebooks/1346) |
| 856 | Cole's Funny Picture Book No. 1 | E. W. Cole | not recorded | — | 1918 | [#30726](https://www.gutenberg.org/ebooks/30726) |
| 857 | The Stories Polly Pepper Told to the Five Little Peppers in the Little Brown House | Margaret Sidney | not recorded | — | 1924 | [#49471](https://www.gutenberg.org/ebooks/49471) |
| 858 | The Buccaneer | Mrs. S. C. Hall | not recorded | — | 1881 | [#28074](https://www.gutenberg.org/ebooks/28074) |
| 859 | Selections from the Principles of Philosophy | René Descartes | not recorded | John Veitch | 1650, 1894 | [#4391](https://www.gutenberg.org/ebooks/4391) |
| 860 | A short introduction to English grammar | Robert Lowth | not recorded | — | 1787 | [#72554](https://www.gutenberg.org/ebooks/72554) |
| 861 | The Toys of Peace, and Other Papers | Saki | not recorded | — | 1916 | [#1477](https://www.gutenberg.org/ebooks/1477) |
| 862 | Manners, Customs, and Dress During the Middle Ages and During the Renaissance Period | P. L. Jacob | not recorded | — | 1884 | [#10940](https://www.gutenberg.org/ebooks/10940) |
| 863 | How to Invest Money | George Garr Henry | not recorded | — | 1917 | [#34463](https://www.gutenberg.org/ebooks/34463) |
| 864 | Rebecca of Sunnybrook Farm | Kate Douglas Smith Wiggin | not recorded | — | 1923 | [#498](https://www.gutenberg.org/ebooks/498) |
| 865 | The Methods of Ethics | Henry Sidgwick | not recorded | — | 1900 | [#46743](https://www.gutenberg.org/ebooks/46743) |
| 866 | A Dog's Tale | Mark Twain | not recorded | — | 1910 | [#3174](https://www.gutenberg.org/ebooks/3174) |
| 867 | Phineas Finn | Anthony Trollope | not recorded | — | 1882 | [#18000](https://www.gutenberg.org/ebooks/18000) |
| 868 | Ralph Waldo Emerson | Oliver Wendell Holmes | not recorded | — | 1894 | [#12700](https://www.gutenberg.org/ebooks/12700) |
| 869 | The Steam Engine Explained and Illustrated (Seventh Edition) | Dionysius Lardner | not recorded | — | 1859 | [#42602](https://www.gutenberg.org/ebooks/42602) |
| 870 | Jo's Boys | Louisa May Alcott | not recorded | — | 1888 | [#3499](https://www.gutenberg.org/ebooks/3499) |
| 871 | Strength and How to Obtain It | Eugen Sandow | not recorded | — | 1925 | [#65987](https://www.gutenberg.org/ebooks/65987) |
| 872 | A General View of Positivism | Auguste Comte | not recorded | John Henry Bridges | 1857, 1923, 1906 | [#53799](https://www.gutenberg.org/ebooks/53799) |
| 873 | Autobiography of Ma-ka-tai-me-she-kia-kiak, or Black Hawk | Sauk chief Black Hawk | not recorded | — | 1838 | [#7097](https://www.gutenberg.org/ebooks/7097) |
| 874 | McGuffey's Eclectic Primer, Revised Edition | William Holmes McGuffey | not recorded | — | 1873 | [#14642](https://www.gutenberg.org/ebooks/14642) |
| 875 | The Conquest of Bread | Peter Kropotkin | not recorded | — | 1921 | [#23428](https://www.gutenberg.org/ebooks/23428) |
| 876 | The Dew of Their Youth | S. R. Crockett | not recorded | — | 1914 | [#23736](https://www.gutenberg.org/ebooks/23736) |
| 877 | Life Is a Dream | Pedro Calderón de la Barca | not recorded | Edward FitzGerald | 1681, 1883 | [#2587](https://www.gutenberg.org/ebooks/2587) |
| 878 | The Nursery "Alice" | Lewis Carroll | not recorded | — | 1898 | [#55040](https://www.gutenberg.org/ebooks/55040) |
| 879 | The Coming Race | Edward Bulwer-Lytton | not recorded | — | 1873 | [#1951](https://www.gutenberg.org/ebooks/1951) |
| 880 | Symbolic Logic | Lewis Carroll | not recorded | — | 1898 | [#28696](https://www.gutenberg.org/ebooks/28696) |
| 881 | The Raven, and The Philosophy of Composition | Edgar Allan Poe | not recorded | — | 1849 | [#55749](https://www.gutenberg.org/ebooks/55749) |
| 882 | Theresa Raquin | Émile Zola | not recorded | Ernest Alfred Vizetelly | 1902, 1922 | [#6626](https://www.gutenberg.org/ebooks/6626) |
| 883 | India's Love Lyrics | Laurence Hope | not recorded | — | 1904 | [#8197](https://www.gutenberg.org/ebooks/8197) |
| 884 | Poisons, Their Effects and Detection | Alexander Wynter Blyth | not recorded | — | 1921 | [#42709](https://www.gutenberg.org/ebooks/42709) |
| 885 | A Young Mutineer | L. T. Meade | not recorded | — | 1914 | [#24599](https://www.gutenberg.org/ebooks/24599) |
| 886 | A Practical View of the Prevailing Religious System of Professed Christians, in the Middle and Higher Classes in this Co | William Wilberforce | not recorded | — | 1833 | [#25709](https://www.gutenberg.org/ebooks/25709) |
| 887 | The Story of the Treasure Seekers | E. Nesbit | not recorded | — | 1924 | [#770](https://www.gutenberg.org/ebooks/770) |
| 888 | Recollections of the Private Life of Napoleon | Louis Constant Wairy | not recorded | Walter Clark | 1845, 1924 | [#3580](https://www.gutenberg.org/ebooks/3580) |
| 889 | Statesman | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1738](https://www.gutenberg.org/ebooks/1738) |
| 890 | Every Man in His Humor | Ben Jonson | not recorded | — | 1637 | [#5333](https://www.gutenberg.org/ebooks/5333) |
| 891 | The Ordinance of Covenanting | John Cunningham | not recorded | — | 1893 | [#25353](https://www.gutenberg.org/ebooks/25353) |
| 892 | The Faith of Our Fathers | James Gibbons | not recorded | — | 1921 | [#27435](https://www.gutenberg.org/ebooks/27435) |
| 893 | The Meaning of Truth | William James | not recorded | — | 1910 | [#5117](https://www.gutenberg.org/ebooks/5117) |
| 894 | Paradise Regained | John Milton | not recorded | — | 1674 | [#58](https://www.gutenberg.org/ebooks/58) |
| 895 | Wild Nature Won By Kindness | Mrs. Brightwen | not recorded | — | 1906 | [#21111](https://www.gutenberg.org/ebooks/21111) |
| 896 | Adventures of Huckleberry Finn, Chapters 01 to 05 | Mark Twain | not recorded | — | 1910 | [#7100](https://www.gutenberg.org/ebooks/7100) |
| 897 | Incidents of the War | Alfred Burnett | not recorded | — | 1884 | [#23733](https://www.gutenberg.org/ebooks/23733) |
| 898 | Milton | Walter Alexander Raleigh | not recorded | — | 1922 | [#21677](https://www.gutenberg.org/ebooks/21677) |
| 899 | Barchester Towers | Anthony Trollope | not recorded | — | 1882 | [#3409](https://www.gutenberg.org/ebooks/3409) |
| 900 | The Iliads of Homer | Homer | not recorded | George Chapman | 650 BC, 1634 | [#51355](https://www.gutenberg.org/ebooks/51355) |
| 901 | The Real Thing and Other Tales | Henry James | not recorded | — | 1916 | [#2715](https://www.gutenberg.org/ebooks/2715) |
| 902 | Robert's Rules of Order | Henry M. Robert | not recorded | — | 1923 | [#9097](https://www.gutenberg.org/ebooks/9097) |
| 903 | Cratylus | Plato | not recorded | Benjamin Jowett | 348 BC, 1893 | [#1616](https://www.gutenberg.org/ebooks/1616) |
| 904 | A Christmas Carol | Charles Dickens | not recorded | — | 1870 | [#30368](https://www.gutenberg.org/ebooks/30368) |
| 905 | The Economist | Xenophon | not recorded | Henry Graham Dakyns | 355 BC, 1911 | [#1173](https://www.gutenberg.org/ebooks/1173) |
| 906 | The Luck of Roaring Camp and Other Tales | Bret Harte | not recorded | — | 1902 | [#6373](https://www.gutenberg.org/ebooks/6373) |
| 907 | Alroy | Benjamin Disraeli | not recorded | — | 1881 | [#20002](https://www.gutenberg.org/ebooks/20002) |
| 908 | The Deerslayer | James Fenimore Cooper | not recorded | — | 1851 | [#3285](https://www.gutenberg.org/ebooks/3285) |
| 909 | The Ladies Book of Useful Information | Anonymous | not recorded | — | Anonymous (year not known) | [#26368](https://www.gutenberg.org/ebooks/26368) |
| 910 | A Week on the Concord and Merrimack Rivers | Henry David Thoreau | not recorded | — | 1862 | [#4232](https://www.gutenberg.org/ebooks/4232) |
| 911 | The Confidence-Man | Herman Melville | not recorded | — | 1891 | [#21816](https://www.gutenberg.org/ebooks/21816) |
| 912 | The Logic of Chance, 3rd edition | John Venn | not recorded | — | 1923 | [#57359](https://www.gutenberg.org/ebooks/57359) |
| 913 | Tom Sawyer Abroad | Mark Twain | not recorded | — | 1910 | [#91](https://www.gutenberg.org/ebooks/91) |
| 914 | Book of Wise Sayings | W. A. Clouston | not recorded | — | 1896 | [#21130](https://www.gutenberg.org/ebooks/21130) |
| 915 | Indian Poetry | Edwin Arnold | not recorded | — | 1904 | [#25965](https://www.gutenberg.org/ebooks/25965) |
| 916 | Life of Adam Smith | John Rae | not recorded | — | 1915 | [#17196](https://www.gutenberg.org/ebooks/17196) |
| 917 | The Legends and Myths of Hawaii | David Kalakaua | not recorded | — | 1891, 1901 | [#56597](https://www.gutenberg.org/ebooks/56597) |
| 918 | Life and times of Frederick Douglass | Frederick Douglass | not recorded | — | 1895, 1886 | [#71893](https://www.gutenberg.org/ebooks/71893) |
| 919 | The Reign of Tiberius, Out of the First Six Annals of Tacitus | Cornelius Tacitus | not recorded | Thomas Gordon | 117, 1921, 1750 | [#7959](https://www.gutenberg.org/ebooks/7959) |
| 920 | The Man Who Laughs | Victor Hugo | not recorded | — | 1885 | [#12587](https://www.gutenberg.org/ebooks/12587) |
| 921 | Castle Rackrent | Maria Edgeworth | not recorded | — | 1849, 1919 | [#1424](https://www.gutenberg.org/ebooks/1424) |
| 922 | The Key to Theosophy | H. P. Blavatsky | not recorded | — | 1891 | [#55618](https://www.gutenberg.org/ebooks/55618) |
| 923 | The Alhambra | Washington Irving | not recorded | — | 1859 | [#49947](https://www.gutenberg.org/ebooks/49947) |
| 924 | The inquisition in the Spanish dependencies | Henry Charles Lea | not recorded | — | 1909 | [#68744](https://www.gutenberg.org/ebooks/68744) |
| 925 | Daniel Boone | John S. C. Abbott | not recorded | — | 1877 | [#23798](https://www.gutenberg.org/ebooks/23798) |
| 926 | One Hundred Proofs That the Earth Is Not a Globe | William Carpenter | not recorded | — | 1896 | [#55387](https://www.gutenberg.org/ebooks/55387) |
| 927 | Pride and Prejudice, a play founded on Jane Austen's novel | Mrs. Steele MacKaye & Jane Austen | not recorded | — | 1924, 1817 | [#37431](https://www.gutenberg.org/ebooks/37431) |
| 928 | The Map of Life | William Edward Hartpole Lecky | not recorded | — | 1903 | [#26334](https://www.gutenberg.org/ebooks/26334) |
| 929 | The Complete Poems of Paul Laurence Dunbar | Paul Laurence Dunbar | not recorded | — | 1906, 1920 | [#18338](https://www.gutenberg.org/ebooks/18338) |
| 930 | Woman, Church & State | Matilda Joslyn Gage | not recorded | — | 1898 | [#45580](https://www.gutenberg.org/ebooks/45580) |
| 931 | Japanese Homes and Their Surroundings | Edward Sylvester Morse | not recorded | — | 1925 | [#52868](https://www.gutenberg.org/ebooks/52868) |
| 932 | Missionary Travels and Researches in South Africa | David Livingstone | not recorded | — | 1873 | [#1039](https://www.gutenberg.org/ebooks/1039) |
| 933 | The $30,000 Bequest, and Other Stories | Mark Twain | not recorded | — | 1910 | [#142](https://www.gutenberg.org/ebooks/142) |
| 934 | At Good Old Siwash | George Fitch | not recorded | — | 1915 | [#25163](https://www.gutenberg.org/ebooks/25163) |
| 935 | Ten Days in a Mad-House | Nellie Bly | not recorded | — | 1922 | [#59899](https://www.gutenberg.org/ebooks/59899) |
| 936 | Roman Public Life | A. H. J. Greenidge | not recorded | — | 1906 | [#65392](https://www.gutenberg.org/ebooks/65392) |
| 937 | The Ocean Wireless Boys and the Naval Code | John Henry Goldfrap | not recorded | — | 1917 | [#26778](https://www.gutenberg.org/ebooks/26778) |
| 938 | The Tempest | William Shakespeare | not recorded | — | 1616 | [#1540](https://www.gutenberg.org/ebooks/1540) |
| 939 | The Playboy of the Western World | J. M. Synge | not recorded | — | 1909 | [#1240](https://www.gutenberg.org/ebooks/1240) |
| 940 | The Private Diary of Dr. John Dee, and the Catalog of His Library of Manuscripts | John Dee | not recorded | — | 1608, 1889 | [#19553](https://www.gutenberg.org/ebooks/19553) |
| 941 | The Coral Island | R. M. Ballantyne | not recorded | — | 1894 | [#646](https://www.gutenberg.org/ebooks/646) |
| 942 | Memoir of Jane Austen | James Edward Austen-Leigh | not recorded | — | 1874 | [#17797](https://www.gutenberg.org/ebooks/17797) |
| 943 | The Country of the Pointed Firs | Sarah Orne Jewett | not recorded | — | 1909 | [#367](https://www.gutenberg.org/ebooks/367) |
| 944 | Tanglewood Tales | Nathaniel Hawthorne | not recorded | — | 1864 | [#976](https://www.gutenberg.org/ebooks/976) |
| 945 | An Historical Sketch of Sacerdotal Celibacy in the Christian Church | Henry Charles Lea | not recorded | — | 1909 | [#61176](https://www.gutenberg.org/ebooks/61176) |
| 946 | An account of the manners and customs of the modern Egyptians | Edward William Lane | not recorded | — | 1876 | [#70796](https://www.gutenberg.org/ebooks/70796) |
| 947 | Roads of Destiny | O. Henry | not recorded | — | 1910 | [#1646](https://www.gutenberg.org/ebooks/1646) |
| 948 | The Apology | Xenophon | not recorded | Henry Graham Dakyns | 355 BC, 1911 | [#1171](https://www.gutenberg.org/ebooks/1171) |
| 949 | Rollo in Geneva | Jacob Abbott | not recorded | — | 1879 | [#25355](https://www.gutenberg.org/ebooks/25355) |
| 950 | Flower Fables | Louisa May Alcott | not recorded | — | 1888 | [#163](https://www.gutenberg.org/ebooks/163) |
| 951 | The Ragged Trousered Philanthropists | Robert Tressell | not recorded | — | 1911 | [#3608](https://www.gutenberg.org/ebooks/3608) |
| 952 | Tales from Shakespeare | Charles Lamb & Mary Lamb | not recorded | — | 1834, 1847 | [#20657](https://www.gutenberg.org/ebooks/20657) |
| 953 | The Warden | Anthony Trollope | not recorded | — | 1882 | [#619](https://www.gutenberg.org/ebooks/619) |
| 954 | The Diary of a Nobody | George Grossmith & Weedon Grossmith | not recorded | — | 1912, 1919 | [#1026](https://www.gutenberg.org/ebooks/1026) |
| 955 | Whirligigs | O. Henry | not recorded | — | 1910 | [#1595](https://www.gutenberg.org/ebooks/1595) |
| 956 | The Uncommercial Traveller | Charles Dickens | not recorded | — | 1870 | [#914](https://www.gutenberg.org/ebooks/914) |
| 957 | The Lifted Veil | George Eliot | not recorded | — | 1880 | [#2165](https://www.gutenberg.org/ebooks/2165) |
| 958 | Youth, a Narrative | Joseph Conrad | not recorded | — | 1924 | [#525](https://www.gutenberg.org/ebooks/525) |
| 959 | White Jacket | Herman Melville | not recorded | — | 1891 | [#10712](https://www.gutenberg.org/ebooks/10712) |
| 960 | Love of Life, and Other Stories | Jack London | not recorded | — | 1916 | [#710](https://www.gutenberg.org/ebooks/710) |
| 961 | Tales of a Traveller | Washington Irving | not recorded | — | 1859 | [#13514](https://www.gutenberg.org/ebooks/13514) |
| 962 | Sixes and Sevens | O. Henry | not recorded | — | 1910 | [#2851](https://www.gutenberg.org/ebooks/2851) |
| 963 | The Phoenix and the Carpet | E. Nesbit | not recorded | — | 1924 | [#836](https://www.gutenberg.org/ebooks/836) |
| 964 | Redburn. His First Voyage | Herman Melville | not recorded | — | 1891 | [#8118](https://www.gutenberg.org/ebooks/8118) |
| 965 | Pierre | Herman Melville | not recorded | — | 1891 | [#34970](https://www.gutenberg.org/ebooks/34970) |
| 966 | The £1,000,000 bank-note, and other new stories | Mark Twain | not recorded | — | 1910 | [#61522](https://www.gutenberg.org/ebooks/61522) |
| 967 | Sylvie and Bruno | Lewis Carroll | not recorded | — | 1898 | [#620](https://www.gutenberg.org/ebooks/620) |
| 968 | The Blithedale Romance | Nathaniel Hawthorne | not recorded | — | 1864 | [#2081](https://www.gutenberg.org/ebooks/2081) |
| 969 | The Man That Corrupted Hadleyburg, and Other Stories | Mark Twain | not recorded | — | 1910 | [#3251](https://www.gutenberg.org/ebooks/3251) |
| 970 | The Patchwork Girl of Oz | L. Frank Baum | not recorded | — | 1919 | [#32094](https://www.gutenberg.org/ebooks/32094) |
| 971 | The Winter's Tale | William Shakespeare | not recorded | — | 1616 | [#1539](https://www.gutenberg.org/ebooks/1539) |
| 972 | Doctor Thorne | Anthony Trollope | not recorded | — | 1882 | [#3166](https://www.gutenberg.org/ebooks/3166) |
| 973 | Under the Lilacs | Louisa May Alcott | not recorded | — | 1888 | [#3795](https://www.gutenberg.org/ebooks/3795) |
| 974 | The Last Chronicle of Barset | Anthony Trollope | not recorded | — | 1882 | [#3045](https://www.gutenberg.org/ebooks/3045) |
| 975 | The Formation of Vegetable Mould Through the Action of Worms | Charles Darwin | not recorded | — | 1882 | [#2355](https://www.gutenberg.org/ebooks/2355) |
| 976 | King Richard II | William Shakespeare | not recorded | — | 1616 | [#1512](https://www.gutenberg.org/ebooks/1512) |
| 977 | The Story of the Amulet | E. Nesbit | not recorded | — | 1924 | [#837](https://www.gutenberg.org/ebooks/837) |
| 978 | A House of Pomegranates | Oscar Wilde | not recorded | — | 1900 | [#873](https://www.gutenberg.org/ebooks/873) |
| 979 | The People of the Abyss | Jack London | not recorded | — | 1916 | [#1688](https://www.gutenberg.org/ebooks/1688) |
| 980 | The snow-image, and other twice-told tales | Nathaniel Hawthorne | not recorded | — | 1864 | [#513](https://www.gutenberg.org/ebooks/513) |
| 981 | The Europeans | Henry James | not recorded | — | 1916 | [#179](https://www.gutenberg.org/ebooks/179) |
| 982 | Cabbages and Kings | O. Henry | not recorded | — | 1910 | [#2777](https://www.gutenberg.org/ebooks/2777) |
| 983 | Essays and Lectures | Oscar Wilde | not recorded | — | 1900 | [#774](https://www.gutenberg.org/ebooks/774) |
| 984 | The Golden Bowl | Henry James | not recorded | — | 1916 | [#4264](https://www.gutenberg.org/ebooks/4264) |
| 985 | The Life and Adventures of Santa Claus | L. Frank Baum | not recorded | — | 1919 | [#520](https://www.gutenberg.org/ebooks/520) |
| 986 | The Merry Men, and Other Tales and Fables | Robert Louis Stevenson | not recorded | — | 1894 | [#344](https://www.gutenberg.org/ebooks/344) |
| 987 | King Richard III | William Shakespeare | not recorded | — | 1616 | [#1503](https://www.gutenberg.org/ebooks/1503) |
| 988 | The Defence of Guenevere and Other Poems | William Morris | not recorded | — | 1896 | [#22650](https://www.gutenberg.org/ebooks/22650) |
| 989 | Sybil, Or, The Two Nations | Benjamin Disraeli | not recorded | — | 1881 | [#3760](https://www.gutenberg.org/ebooks/3760) |
| 990 | The Cricket on the Hearth | Charles Dickens | not recorded | — | 1870 | [#678](https://www.gutenberg.org/ebooks/678) |
| 991 | The Light Princess | George MacDonald | not recorded | — | 1905 | [#697](https://www.gutenberg.org/ebooks/697) |
| 992 | Memoirs of My Life and Writings | Edward Gibbon | 1796 | — | 1794 | [#6031](https://www.gutenberg.org/ebooks/6031) |
| 993 | Poems, 1817 | John Keats | 1817 | — | 1821 | [#8209](https://www.gutenberg.org/ebooks/8209) |
| 994 | The Mountains of California | John Muir | 1894 | — | 1914 | [#10012](https://www.gutenberg.org/ebooks/10012) |
| 995 | The Beetle | Richard Marsh | 1897 | — | 1915 | [#5164](https://www.gutenberg.org/ebooks/5164) |
| 996 | Sara Crewe | Frances Hodgson Burnett | 1888 | — | 1924 | [#137](https://www.gutenberg.org/ebooks/137) |
| 997 | Collected Articles of Frederick Douglass | Frederick Douglass | not recorded | — | 1895 | [#99](https://www.gutenberg.org/ebooks/99) |
| 998 | Shorter Prose Pieces | Oscar Wilde | not recorded | — | 1900 | [#2061](https://www.gutenberg.org/ebooks/2061) |
| 999 | The Cat of Bubastes | G. A. Henty | 1889 | — | 1902 | [#29756](https://www.gutenberg.org/ebooks/29756) |
| 1000 | The Bells, and Other Poems | Edgar Allan Poe | not recorded | — | 1849 | [#50852](https://www.gutenberg.org/ebooks/50852) |

*Generated 2026-11-06 from `catalog.json`.*
