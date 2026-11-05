import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("README documents every bundled word list", () => {
  const lists = readdirSync(new URL("../public/", import.meta.url)).filter((name) => name.endsWith(".txt"));
  assert.ok(lists.length > 0);
  for (const name of lists) {
    assert.ok(readme.includes(`\`${name}\``), `${name} is missing from the README table`);
    assert.match(readme, new RegExp(`^[0-9a-f]{64}  ${name.replace(".", "\\.")}$`, "m"), `${name} checksum`);
  }
});

test("README states that provenance is unverified", () => {
  assert.match(readme, /unverified – needs owner confirmation/);
});
