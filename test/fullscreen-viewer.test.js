import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

test("viewer shows landscape image without legacy controls", () => {
  const html = fs.readFileSync(new URL("../docs/index.html", import.meta.url), "utf8")
  assert.match(html, /max-width:1200px/)
  assert.match(html, /object-fit:contain/)
  assert.match(html, /URLSearchParams/)
  assert.match(html, /tomorrow/)
  assert.match(html, /today/)
  assert.match(html, /setInterval/)
  assert.doesNotMatch(html, /<button|<nav|<iframe|requestFullscreen/)
})
test("published cards use artifact worktree and Telegram viewer button", () => {
  const media = fs.readFileSync(new URL("../src/media.js", import.meta.url), "utf8")
  assert.match(media, /artifacts\/web\//)
  assert.match(media, /Відкрити на весь екран/)
  assert.match(media, /reply_markup/)
  assert.ok(media.includes('console.error("❌ Viewer snapshot unavailable; Telegram image update cancelled to keep both views aligned: " + error.message)\n    throw error'))
})
test("pages deployment reads snapshots from artifact branch", () => {
  const yaml = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8")
  assert.match(yaml, /ref: artifacts/)
  assert.match(yaml, /snapshots\/web\/today.png/)
  assert.match(yaml, /actions\/deploy-pages@/)
})

test("fullscreen Telegram snapshots retain scrollable schedule HTML", () => {
  const sync = fs.readFileSync(new URL("../docs/fullscreen-sync.js", import.meta.url), "utf8")
  const yaml = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8")
  const media = fs.readFileSync(new URL("../src/card-v3.js", import.meta.url), "utf8")
  assert.match(sync, /<iframe title="Прокручувана картка Telegram"/)
  assert.match(sync, /frame\.src = '\.\/' \+ day \+ '\.html\?fullscreen='/)
  assert.doesNotMatch(sync, /dtek-schedule-hotspot/)
  assert.match(media, /v3-periods[^\n]*overflow:auto/)
  assert.match(media, /www\.dtek-krem\.com\.ua\/ua\/shutdowns/)
  assert.match(yaml, /test -s snapshots\/web\/today\.html/)
  assert.match(yaml, /test -s snapshots\/web\/tomorrow\.html/)
})
