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
