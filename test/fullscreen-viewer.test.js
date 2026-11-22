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
})
test("pages deployment reads snapshots from artifact branch", () => {
  const yaml = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8")
  assert.match(yaml, /ref: artifacts/)
  assert.match(yaml, /snapshots\/web\/today.png/)
  assert.match(yaml, /actions\/deploy-pages@/)
})

test("fullscreen schedule panels open the official DTEK schedule", () => {
  const sync = fs.readFileSync(new URL("../docs/fullscreen-sync.js", import.meta.url), "utf8")
  assert.match(sync, /\.v3-power > \.v3-panel:last-child/)
  assert.match(sync, /class="dtek-schedule-hotspot"/)
  assert.match(sync, /https:\/\/www\.dtek-krem\.com\.ua\/ua\/shutdowns/)
  assert.match(sync, /left:68\.5%;top:8%;width:30%;height:15\.3%/)
})
