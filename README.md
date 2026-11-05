# <a>Anagram</a>

A static, client-side web page that finds anagrams of a word or phrase. You
type letters, pick a bundled word list, and the page shows every dictionary word
that can be built from a subset of those letters, plus sets of words that use
all of the letters exactly.

## Search semantics

- Input is normalised by `src/javascripts/normalize.js`: accents are removed,
  text is lower-cased, and only letters and digits are kept. Spaces,
  apostrophes, hyphens and other punctuation are ignored, so a phrase is
  searched as the letters it contains.
- A "word" result is a dictionary entry whose letter counts fit within the
  input's letter counts (a sub-multiset). Longest words come first.
- A "set" result is a multiset of dictionary words whose combined letters equal
  the input's letters exactly. A word may be reused if the letters allow it,
  and orderings of the same words are reported once.
- Searches are bounded (2,000 sets, 100,000 nodes or 5 seconds); partial
  results are labelled as such. See the sections below.

## Local setup, build and deployment

Requires Node.js 20 (the version used in CI) and npm.

```
npm ci            # install dependencies from package-lock.json
npm run dev       # Vite dev server with hot reload
npm test          # unit tests and the optional browser test
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
```

Deployment: the app is fully static. `npm run build` writes `dist/`, which can
be served by any static file host. Vite is configured with `base: ''`, so
assets use relative URLs and the site can be served from a sub-path. The
word-list files in `public/` are copied into `dist/` unchanged and are fetched
at run time. No deployment pipeline is defined in this repository; CI
(`.github/workflows/ci.yml`) only runs `npm test` and `npm run build`.

## Bundled word lists

All six lists live in `public/`, one entry per line, and are redistributed
as-is. **The repository records no source, version or licence for any of them.**
The only history is a single commit (`dd695d9`, 2023-04-22) that added them
together. Everything below marked *unverified* needs confirmation by the
owner before the lists are relied on or redistributed; the list contents have
deliberately not been changed.

| File | UI label | Lines | Bytes | Observed content |
| --- | --- | --- | --- | --- |
| `1000.txt` | 1,000 | 999 | 5,839 | Frequency-ordered common words (starts "the, of, to"); includes entries such as `I`, `don't`, `won't` |
| `10000.txt` | 10,000 | 9,999 | 75,887 | Frequency-ordered common words (starts "the, of, and"); lower-case letters only |
| `20000.txt` | 20,000 | 19,999 | 155,417 | Frequency-ordered common words (starts "the, of, and"); lower-case letters only |
| `english1.txt` | Small | 84,094 | 794,407 | Alphabetical English words (starts "a, aa, aaa"); includes a few apostrophe forms (e.g. `entr'acte`) |
| `english2.txt` | Medium | 194,432 | 1,908,035 | Alphabetical English words (starts "a, aa, aaa"); a few dozen entries with non-letter characters |
| `allwords.txt` | Large | 466,549 | 4,862,991 | Alphabetical, mixed content: numbers (e.g. `2`, `1080`), abbreviations (`&c`), capitalised and hyphenated/spaced entries |

For every list, the following are **unverified – needs owner confirmation**:
source, version, licence/provenance, and redistribution basis. SHA-256 checksums
of the committed files, for matching against an upstream copy:

```
cae22f309a6bff2a58ace83629e13fe3e5bb9f6cdeebeba3f71bab0c35ae4501  1000.txt
0416c306b99430382a61b68f60ef71834ebf4ef9975ec0691976b89311d5a0db  10000.txt
ef748f5f28a1368277596fc490330c74d531b48917a51fb571b9e4fe54310b62  20000.txt
042d9412a62b8516ca9676c164a1ccf9b833c3f0a700d7ff4188d3d5f2e7ea87  english1.txt
3058268c033bd9bb3ab36a97af3b694c28237c227920adcf40fe5f5bd17798d0  english2.txt
8aad34bb00a494e85393c4cbfa6e1b65b486c4a5682ad1d0d16aa67aa66a0fd9  allwords.txt
```

## Intentional limitations and browser assumptions

- Dictionary entries are not normalised on load (only whitespace is removed),
  while input is lower-cased and de-accented. Entries containing capitals,
  apostrophes, hyphens or other punctuation therefore can never match, which
  affects many entries in `allwords.txt` (for example, about 79,000 contain a
  capital letter). Use `english1.txt`/`english2.txt` for plain lower-case words.
- Results depend entirely on the chosen list; absence of a word means it is not
  in that list, not that it is not a word. There is no proper-noun, plural or
  language handling beyond what the list contains. The UI is English only.
- Search results are capped and may be partial (see below).
- Requires a browser with ES modules, module Web Workers, `fetch`, and Unicode
  property escapes in regular expressions (`\p{L}`); current evergreen
  browsers qualify. The page must be served over HTTP(S): `fetch` of the word
  lists does not work from `file://`.
- The largest list is about 4.9 MB and is downloaded when selected.

## Multi-word result enumeration

Multi-word anagrams are found with a backtracking search over canonical word
multisets. A word may be reused when its letters remain available; every shown
set uses the input's letter counts exactly, and ordering-equivalent sets are
emitted once.

To keep large dictionaries responsive, a search returns at most 2,000 sets or
visits 100,000 search nodes. When either limit is reached, the UI states that
the displayed results are partial and reports the number of explored nodes.
Use a more specific input to continue exploring the space.

## Off-main-thread search and performance budgets

Dictionary loading, candidate filtering and the set search run in a Web Worker
(`src/javascripts/anagram-worker.js`), so the page stays responsive. The status
line shows progress (reported every 1,024 search nodes) and a "Cancel search"
button terminates the worker and reloads the dictionary.

A single search is bounded by 2,000 sets, 100,000 search nodes, **or 5 seconds**,
whichever comes first. The UI says which limit was reached and how many nodes
were explored.

Measured with `node scripts/profile-search.js` (Node, one run, indicative only):

| Dictionary (words) | Candidate filter | Set search (node cap reached) |
| --- | --- | --- |
| 1000.txt (1k) | ≤ 10 ms | ≤ 0.4 s |
| 20000.txt (20k) | ≤ 35 ms | ≤ 0.4 s |
| english2.txt (194k) | ≤ 0.45 s | ≤ 2.0 s |
| allwords.txt (467k) | ≤ 0.8 s | ≤ 2.8 s (17-letter input) |

Budgets: the 100,000-node cap is normally reached within about 3 s even for the
largest dictionary and input, so the 5 s time limit is a backstop for slow
devices rather than the usual stopping rule. Candidate filtering is a single
linear scan per search and is not time-limited; it runs in the worker.

## Tests

`npm test` runs the unit tests and a Playwright browser test
(`test/browser.test.js`) against a production build. The browser test builds
the app and is skipped if Playwright or Chromium is unavailable.
