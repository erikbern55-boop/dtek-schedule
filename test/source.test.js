import test from "node:test"
import assert from "node:assert/strict"
import { kyivDate, selectScheduleDays, validateMirror } from "../src/source.js"

const epoch = (day) => String(Date.parse(day + "T00:00:00+02:00") / 1000)
const now = new Date("2026-11-02T18:20:00Z")
const today = epoch("2026-11-02")
const tomorrow = epoch("2026-11-03")

test("recognizes Kyiv calendar dates", () => {
  assert.equal(kyivDate(now), "2026-11-02")
  assert.equal(kyivDate(new Date(Number(tomorrow) * 1000)), "2026-11-03")
})
test("selects both days in chronological order", () => {
  const days = selectScheduleDays({ data: { [tomorrow]: {}, [today]: {} } }, now)
  assert.deepEqual(days.map((d) => d.label), ["сьогодні", "завтра"])
})
test("rejects outdated mirror data", () => {
  assert.throws(() => validateMirror({ lastUpdated: "2026-10-29T00:00:00Z", fact: { data: { [today]: {} } } }, now.getTime()), /застаріли/)
})
test("accepts recently refreshed mirror", () => {
  const fact = { data: { [today]: { GPV1: {} }, [tomorrow]: { GPV1: {} } } }
  assert.equal(validateMirror({ lastUpdated: "2026-11-02T18:06:00Z", fact }, now.getTime()), fact)
})
test("does not mistake yesterday's plan for today's", () => {
  assert.deepEqual(selectScheduleDays({ data: { [epoch("2026-11-01")]: {} } }, now), [])
})
