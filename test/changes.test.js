import test from "node:test"
import assert from "node:assert/strict"
import { describeScheduleChanges } from "../src/changes.js"

const off = (begin, end) => ({ begin, end, power: false })
const on = (begin, end) => ({ begin, end, power: true })
const old = (...ranges) => ranges.map(([start, end]) => "🪫 <code>" + start + " — " + end + "</code>").join("\n")

// Previous releases persisted only scheduleText, so use the legacy format in tests.
test("identifies an added outage without reporting unchanged outages", () => {
  const result = describeScheduleChanges(
    old(["09:00", "13:00"], ["19:30", "24:00"]),
    [off("09:00", "13:00"), on("13:00", "15:00"), off("15:00", "16:00"), on("16:00", "19:30"), off("19:30", "24:00")],
  )
  assert.match(result, /Додано відключення/)
  assert.match(result, /15:00 — 16:00/)
  assert.doesNotMatch(result, /09:00 — 13:00/)
  assert.doesNotMatch(result, /Скасовано/)
})

test("reports cancellation", () => {
  const result = describeScheduleChanges(old(["09:00", "13:00"]), [off("09:00", "10:00"), on("10:00", "24:00")])
  assert.match(result, /Скасовано відключення/)
  assert.match(result, /10:00 — 13:00/)
  assert.doesNotMatch(result, /Додано/)
})

test("moved interval shows added and canceled intervals", () => {
  const result = describeScheduleChanges(old(["10:00", "12:00"]), [on("00:00", "11:00"), off("11:00", "13:00")])
  assert.match(result, /➕[\s\S]*12:00 — 13:00/)
  assert.match(result, /➖[\s\S]*10:00 — 11:00/)
})

test("adds outage when previous schedule had electricity all day", () => {
  const result = describeScheduleChanges("🔋 <code>00:00 — 24:00</code>", [on("00:00", "16:30"), off("16:30", "17:00"), on("17:00", "24:00")])
  assert.match(result, /16:30 — 17:00/)
})

test("cancels outages when electricity restored for the day", () => {
  const result = describeScheduleChanges(old(["20:00", "24:00"]), [on("00:00", "24:00")])
  assert.match(result, /20:00 — 24:00/)
  assert.match(result, /Скасовано/)
})

test("malformed legacy schedule safely uses generic change heading", () => {
  assert.equal(describeScheduleChanges("🪫 some unexpected text", [off("13:00", "14:00")]), "⚠️ <b>ДТЕК ЗМІНИВ ГРАФІК!</b>")
})

test("neighboring half-hour additions are presented as a continuous interval", () => {
  const result = describeScheduleChanges(old(["08:00", "09:00"]), [on("00:00", "08:00"), off("08:00", "10:00")])
  assert.match(result, /09:00 — 10:00/)
})
