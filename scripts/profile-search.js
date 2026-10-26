// Usage: node scripts/profile-search.js
// Times candidate filtering and exact-set search per shipped dictionary.
import { readFileSync } from "node:fs";
import { findCandidateWords, findExactAnagramSets } from "../src/javascripts/anagram-search.js";

const dictionaries = ["1000", "10000", "20000", "english1", "english2", "allwords"];
const inputs = ["listen", "conversation", "conversationalist", "the quick brown fox"];

for (const name of dictionaries) {
  const words = readFileSync(new URL(`../public/${name}.txt`, import.meta.url), "utf8").split("\n");
  for (const input of inputs) {
    let start = performance.now();
    const candidates = findCandidateWords(input.replace(/\s/g, ""), words);
    const filterMs = performance.now() - start;
    start = performance.now();
    const result = findExactAnagramSets(input.replace(/\s/g, ""), candidates);
    const searchMs = performance.now() - start;
    console.log(
      `${name.padEnd(8)} ${input.padEnd(20)} words=${String(words.length).padStart(6)} candidates=${String(candidates.length).padStart(5)}` +
      ` filter=${filterMs.toFixed(0)}ms search=${searchMs.toFixed(0)}ms nodes=${result.visitedNodes} sets=${result.sets.length}` +
      ` truncated=${result.truncated}${result.timedOut ? " (time)" : ""}`,
    );
  }
}
