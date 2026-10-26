import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const playwrightPath = process.env.PLAYWRIGHT_MODULE ?? "/usr/local/lib/node_modules/playwright/index.mjs";
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/usr/local/share/ms-playwright";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain" };

test("worker-backed search works in a real browser", { timeout: 120_000 }, async (t) => {
  if (!existsSync(playwrightPath)) return t.skip("Playwright is not installed");
  const { chromium } = await import(pathToFileURL(playwrightPath).href);
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    return t.skip(`Chromium unavailable: ${error.message.split("\n")[0]}`);
  }

  execFileSync("npx", ["vite", "build"], { cwd: root, stdio: "ignore" });
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    const file = join(dist, path === "/" || path === "\\" ? "index.html" : path);
    if (!file.startsWith(dist) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;

  try {
    const page = await browser.newPage();
    const failures = [];
    page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(url)) failures.push(`${r.status()} ${r.url()}`); });
    await page.goto(url);

    // Default dictionary loads and a search fills both result panes.
    await page.waitForFunction(() => document.getElementById("anagramSearchStatus").textContent === "");
    await page.fill("#anagramText", "listen");
    await page.click("#activateButton");
    await page.waitForFunction(() => document.querySelectorAll("#resultDiv2 .setDiv").length > 0);
    const words = await page.$$eval("#resultDiv .wordDiv", (els) => els.map((e) => e.textContent));
    assert.ok(words.includes("ten") && words.includes("silent"));
    const sets = await page.$$eval("#resultDiv2 .setDiv", (els) => els.map((e) => e.textContent));
    assert.ok(sets.some((s) => s.includes("silent") || s.includes("listen")));
    assert.deepEqual(failures, []);

    // Cancel a long search on the largest dictionary; the page stays usable.
    await page.selectOption("#dictionary", "5");
    await page.waitForFunction(() => document.getElementById("anagramSearchStatus").textContent === "", null, { timeout: 60_000 });
    await page.fill("#anagramText", "conversationalist");
    await page.click("#activateButton");
    await page.waitForSelector("#cancelButton:not([hidden])");
    await page.click("#cancelButton");
    await page.waitForFunction(() => document.getElementById("anagramSearchStatus").textContent === "Search cancelled.");
    assert.equal(await page.evaluate(() => document.getElementById("cancelButton").hidden), true);
    assert.deepEqual(failures, []);
  } finally {
    await browser.close();
    server.close();
  }
});
