import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Telegram image has fullscreen and active Ukrainian source links", () => {
  const source = fs.readFileSync(new URL("../src/media.js", import.meta.url), "utf8");
  const fn = source.match(/function viewerKeyboard\(label\) \{([\s\S]*?)\n\}/);
  assert.ok(fn, "viewerKeyboard function missing");
  for (const url of [
    "https://www.dtek-krem.com.ua/ua/shutdowns",
    "VIEWER_URL + \"guide/weather/\"",
    "VIEWER_URL + \"guide/garden/\"",
    "VIEWER_URL + \"guide/moon/\"",
    "VIEWER_URL + \"guide/astro/\"",
    "https://minfin.com.ua/ua/currency/kiev/",
  ]) assert.ok(fn[1].includes(url), "Missing Telegram source button: " + url);
  assert.match(fn[1], /Відкрити на весь екран/);
  assert.match(source, /reply_markup.*viewerKeyboard\(label\)/);
});

test("currency source is directly beside the astro link in the fullscreen card", () => {
  const card = fs.readFileSync(new URL("../src/card-v3.js", import.meta.url), "utf8");
  const astroSource = card.match(/<strong>✨ Астропрогноз:<\/strong><a href="\.\/guide\/astro\/">Відкрити довідник<\/a><a href="https:\/\/minfin\.com\.ua\/ua\/currency\/kiev\/"[^>]*>💱 Курс валют<\/a>/);
  assert.ok(astroSource, "Minfin link should be next to the astro guide in the same source block");
});
