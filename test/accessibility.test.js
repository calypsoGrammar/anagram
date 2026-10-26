import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/stylesheets/style.css", import.meta.url), "utf8");

test("every primary control has an explicit label", () => {
  for (const id of ["anagramText", "dictionary", "filterWords", "wordLengths", "filterSets", "setLengths"]) {
    assert.match(html, new RegExp(`<label for="${id}"`), `${id} needs a label`);
  }
});

test("icon-only search button has an accessible name and decorative icon", () => {
  assert.match(html, /<button id="activateButton"[^>]*aria-label="Search for anagrams"/);
  assert.match(html, /<img id="searchButton"[^>]*alt=""/);
});

test("controls do not suppress the focus outline", () => {
  assert.doesNotMatch(html, /outline-none/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /outline:\s*none/);
});

test("result columns are labelled regions with headings", () => {
  assert.match(html, /<section aria-labelledby="wordsHeading"/);
  assert.match(html, /<h2 id="wordsHeading"/);
  assert.match(html, /<section aria-labelledby="setsHeading"/);
  assert.match(html, /<h2 id="setsHeading"/);
});

test("search status is a polite live region", () => {
  assert.match(html, /<p id="anagramSearchStatus"[^>]*role="status"[^>]*aria-live="polite"/);
});
