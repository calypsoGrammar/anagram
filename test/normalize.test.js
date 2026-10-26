import assert from "node:assert/strict";
import test from "node:test";
import { normalizeToken, prepareSearchInput } from "../src/javascripts/normalize.js";
import { findExactAnagramSets } from "../src/javascripts/anagram-search.js";

test("mixed-case input matches lower-case dictionary tokens", () => {
  assert.equal(normalizeToken("LiSteN"), "listen");
  const result = findExactAnagramSets(normalizeToken("LiSteN"), ["silent", "Enlist"].map(normalizeToken));
  assert.deepEqual(result.sets, [["enlist"], ["silent"]]);
});

test("phrase input drops internal spaces", () => {
  assert.equal(normalizeToken("  dormitory  room "), "dormitoryroom");
  const result = findExactAnagramSets(normalizeToken("dirty room"), ["dormitory"]);
  assert.deepEqual(result.sets, [["dormitory"]]);
});

test("punctuation, apostrophes and hyphens are ignored", () => {
  assert.equal(normalizeToken("Don't"), "dont");
  assert.equal(normalizeToken("well-known!"), "wellknown");
  assert.equal(normalizeToken("St. John's"), "stjohns");
});

test("accents are stripped and digits kept", () => {
  assert.equal(normalizeToken("Café 42"), "cafe42");
});

test("exact-letter counts survive normalisation", () => {
  const result = findExactAnagramSets(normalizeToken("A a b"), ["aab", "ab"].map(normalizeToken));
  assert.deepEqual(result.sets, [["aab"]]);
});

test("prepareSearchInput explains non-obvious input", () => {
  assert.equal(prepareSearchInput("listen").message, "");
  assert.match(prepareSearchInput("Dirty Room").message, /dirtyroom/);
  assert.match(prepareSearchInput("?!").message, /No letters/);
  assert.equal(prepareSearchInput("   ").message, "");
});
