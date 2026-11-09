import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

test("public viewer preserves landscape image without navigation controls", () => {
  const html = fs.readFileSync(new URL("../docs/index.html", import.meta.url), "utf8")
  assert.match(html, /max-width:1200px/)
  assert.match(html, /object-fit:contain/)
  assert.match(html, /get\\('day'\\)/)
  assert.match(html, /tomorrow/)
  assert.match(html, /today/)
  assert.match(html, /setInterval\\(refresh,300000\\)/)
  assert.doesNotMatch(html, /<button\\b|<nav\\b|requestFullscreen\\(/)
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
