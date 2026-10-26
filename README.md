# <a>Anagram</a>

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
