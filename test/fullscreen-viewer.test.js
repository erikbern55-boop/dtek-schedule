import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

test("public viewer preserves landscape image without navigation controls", () => {
  const html = fs.readFileSync(new URL("../docs/index.html", import.meta.url), "utf8")
  assert.ok(html.includes("max-width:1200px"))
  assert.ok(html.includes("object-fit:contain"))
  assert.ok(html.includes("get('day')"))
  assert.ok(html.includes("tomorrow"))
  assert.ok(html.includes("today"))
  assert.ok(html.includes("setInterval(refresh,300000)"))
  assert.ok(!html.includes("<button"))
  assert.ok(!html.includes("<nav"))
  assert.ok(!html.includes("requestFullscreen("))
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
