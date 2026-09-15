const DEFAULT_MAX_RESULTS = 2_000;
const DEFAULT_MAX_NODES = 100_000;

function countLetters(word) {
  const counts = new Map();

  for (const letter of word) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }

  return counts;
}

function fitsWithin(letters, remaining) {
  for (const [letter, count] of letters) {
    if ((remaining.get(letter) ?? 0) < count) return false;
  }

  return true;
}

function subtract(remaining, letters) {
  const next = new Map(remaining);

  for (const [letter, count] of letters) {
    next.set(letter, next.get(letter) - count);
  }

  return next;
}

/**
 * Finds every canonical multiset of candidates that uses the target letters
 * exactly, subject to explicit result and search-node limits.
 */
export function findExactAnagramSets(target, candidates, {
  maxResults = DEFAULT_MAX_RESULTS,
  maxNodes = DEFAULT_MAX_NODES,
} = {}) {
  if (!Number.isInteger(maxResults) || maxResults < 1) {
    throw new RangeError("maxResults must be a positive integer");
  }
  if (!Number.isInteger(maxNodes) || maxNodes < 1) {
    throw new RangeError("maxNodes must be a positive integer");
  }

  const targetLetters = countLetters(target);
  const targetLength = target.length;
  const words = [...new Set(candidates)]
    .filter((word) => word.length > 0 && word.length <= targetLength)
    .map((word) => ({ word, letters: countLetters(word) }))
    .filter(({ letters }) => fitsWithin(letters, targetLetters))
    .sort((left, right) => left.word.localeCompare(right.word));

  const sets = [];
  let visitedNodes = 0;
  let truncated = false;

  function search(startIndex, remaining, remainingLength, selectedWords) {
    if (visitedNodes >= maxNodes) {
      truncated = true;
      return;
    }
    visitedNodes++;

    if (remainingLength === 0) {
      if (sets.length >= maxResults) {
        truncated = true;
        return;
      }
      sets.push(selectedWords);
      return;
    }

    for (let index = startIndex; index < words.length; index++) {
      const candidate = words[index];
      if (candidate.word.length > remainingLength || !fitsWithin(candidate.letters, remaining)) {
        continue;
      }

      // Keeping the same start index permits repeated words; increasing it
      // prevents permutations of the same multiset from being explored.
      search(
        index,
        subtract(remaining, candidate.letters),
        remainingLength - candidate.word.length,
        [...selectedWords, candidate.word],
      );
    }
  }

  search(0, targetLetters, targetLength, []);

  return { sets, truncated, visitedNodes };
}
