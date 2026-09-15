import assert from "node:assert/strict";
import test from "node:test";
import { findExactAnagramSets } from "../src/javascripts/anagram-search.js";

test("backtracks when an earlier fitting word blocks a valid combination", () => {
  const result = findExactAnagramSets("abcdef", ["a", "bc", "b", "cdef", "def"]);

  assert.deepEqual(result.sets, [
    ["a", "b", "cdef"],
    ["a", "bc", "def"],
  ]);
  assert.equal(result.truncated, false);
});

test("canonicalises sets, deduplicates candidates, and preserves repeated words", () => {
  const result = findExactAnagramSets("abab", ["ba", "ab", "ab"]);

  assert.deepEqual(result.sets, [
    ["ab", "ab"],
    ["ab", "ba"],
    ["ba", "ba"],
  ]);
});

test("never returns sets with an inexact letter count", () => {
  const result = findExactAnagramSets("aabc", ["aa", "bc", "ab", "c", "a"]);

  assert.deepEqual(result.sets, [
    ["a", "a", "bc"],
    ["a", "ab", "c"],
    ["aa", "bc"],
  ]);
});

test("reports an explicit bound for representative larger inputs", () => {
  const result = findExactAnagramSets(
    "aabbccddeeff",
    ["a", "b", "c", "d", "e", "f", "aa", "bb", "cc", "dd", "ee", "ff"],
    { maxResults: 10, maxNodes: 500 },
  );

  assert.equal(result.sets.length, 10);
  assert.equal(result.truncated, true);
  assert.ok(result.visitedNodes <= 500);
});
