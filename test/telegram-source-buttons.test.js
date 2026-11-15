import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Telegram image has a fullscreen button and active source URLs", () => {
  const source = fs.readFileSync(new URL("../src/media.js", import.meta.url), "utf8");
  const fn = source.match(/function viewerKeyboard\(label\) \{([\s\S]*?)\n\}/);
  assert.ok(fn, "viewerKeyboard function missing");
  for (const url of [
    "https://www.dtek-krem.com.ua/ua/shutdowns",
    "https://open-meteo.com/",
    "https://www.rhs.org.uk/",
    "https://www.astronomy.com/",
    "https://www.astro-seek.com/",
  ]) assert.ok(fn[1].includes(url), "Missing Telegram source button: " + url);
  assert.match(fn[1], /Відкрити на весь екран/);
  assert.match(source, /reply_markup.*viewerKeyboard\(label\)/);
});
