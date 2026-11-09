import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

test("fullscreen viewer has orientation responsive layout and two image routes", () => {
  const html = fs.readFileSync(new URL("../docs/index.html", import.meta.url), "utf8")
  assert.match(html, /@media\(orientation:landscape\)/)
  assert.match(html, /requestFullscreen\(\)/)
  assert.match(html, /day==='today'/)
  assert.match(html, /day==='tomorrow'/)
  assert.match(html, /setInterval\(load,300000\)/)
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
