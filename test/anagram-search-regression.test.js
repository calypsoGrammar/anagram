import assert from "node:assert/strict";
import test from "node:test";
import { findExactAnagramSets } from "../src/javascripts/anagram-search.js";

function sortedLetters(words) {
  return [...words.join("")].sort().join("");
}

test("finds multi-word combinations that use every letter exactly once", () => {
  const result = findExactAnagramSets("dormitory", ["dirty", "room", "dormitory", "dirt", "moor", "y"]);

  assert.deepEqual(result.sets, [
    ["dirt", "moor", "y"],
    ["dirt", "room", "y"],
    ["dirty", "moor"],
    ["dirty", "room"],
    ["dormitory"],
  ]);
});

test("returns nothing when no combination uses the letters exactly", () => {
  assert.deepEqual(findExactAnagramSets("abc", ["ab", "bd", "cc"]).sets, []);
  assert.deepEqual(findExactAnagramSets("", ["a"]).sets.length, 1);
});

test("ignores empty and over-long candidates", () => {
  const result = findExactAnagramSets("ab", ["", "abc", "ab"]);

  assert.deepEqual(result.sets, [["ab"]]);
});

test("rejects invalid limits", () => {
  assert.throws(() => findExactAnagramSets("a", ["a"], { maxResults: 0 }), RangeError);
  assert.throws(() => findExactAnagramSets("a", ["a"], { maxNodes: 1.5 }), RangeError);
});

test("large candidate list with few fitting words stays fast and exact", () => {
  const filler = Array.from({ length: 50_000 }, (_, i) => `zz${i.toString(36)}q`);
  const candidates = [...filler, "listen", "silent", "enlist", "tinsel"];

  const started = performance.now();
  const result = findExactAnagramSets("listen", candidates);
  const elapsed = performance.now() - started;

  assert.deepEqual(result.sets, [["enlist"], ["listen"], ["silent"], ["tinsel"]]);
  assert.equal(result.truncated, false);
  assert.ok(elapsed < 2_000, `took ${elapsed}ms`);
});

test("dense candidate sets respect default bounds and every set is exact", () => {
  const letters = "abcdefgh";
  const candidates = [];
  for (const a of letters) {
    candidates.push(a);
    for (const b of letters) candidates.push(a + b);
  }
  const target = "aabbccddeeffgghh";

  const started = performance.now();
  const result = findExactAnagramSets(target, candidates);
  const elapsed = performance.now() - started;

  assert.ok(result.visitedNodes <= 100_000);
  assert.ok(result.sets.length <= 2_000);
  assert.ok(result.sets.length > 0);
  for (const set of result.sets) assert.equal(sortedLetters(set), sortedLetters([target]));
  assert.ok(elapsed < 5_000, `took ${elapsed}ms`);
});

test("duplicate-heavy candidates are de-duplicated", () => {
  const result = findExactAnagramSets("abab", Array.from({ length: 10_000 }, () => "ab"));

  assert.deepEqual(result.sets, [["ab", "ab"]]);
});
