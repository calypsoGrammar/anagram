import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("page loads no third-party CDN assets", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /https?:\/\/(?!www\.w3\.org)/);
});

test("main.js does not use jQuery", () => {
  const js = readFileSync(new URL("../src/javascripts/main.js", import.meta.url), "utf8");
  assert.doesNotMatch(js, /\$\.(get|ajax)|jQuery/);
});
