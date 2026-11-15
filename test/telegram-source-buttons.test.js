import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Telegram image has fullscreen and four active Ukrainian guide links", () => {
  const source = fs.readFileSync(new URL("../src/media.js", import.meta.url), "utf8");
  const fn = source.match(/function viewerKeyboard\(label\) \{([\s\S]*?)\n\}/);
  assert.ok(fn, "viewerKeyboard function missing");
  for (const url of [
    "https://www.dtek-krem.com.ua/ua/shutdowns",
    "VIEWER_URL + \"guide/weather/\"",
    "VIEWER_URL + \"guide/garden/\"",
    "VIEWER_URL + \"guide/moon/\"",
    "VIEWER_URL + \"guide/astro/\"",
  ]) assert.ok(fn[1].includes(url), "Missing Telegram source button: " + url);
  assert.match(fn[1], /Відкрити на весь екран/);
  assert.match(source, /reply_markup.*viewerKeyboard\(label\)/);
});
