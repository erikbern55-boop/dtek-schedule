import test from "node:test"
import assert from "node:assert/strict"
import { calculateDailyTotals, formatDuration } from "../src/summary.js"

const off = (begin, end) => ({ begin, end, power: false })
const on = (begin, end) => ({ begin, end, power: true })

test("calculates the example including 30-minute ranges", () => {
  const result = calculateDailyTotals([
    on("00:00", "09:00"), off("09:00", "13:00"), on("13:00", "15:00"),
    off("15:00", "16:00"), on("16:00", "19:30"), off("19:30", "24:00"),
  ])
  assert.deepEqual(result, { withPower: 870, withoutPower: 570 })
  assert.equal(formatDuration(result.withPower), "14 год 30 хв")
  assert.equal(formatDuration(result.withoutPower), "9 год 30 хв")
})

test("all-day power", () => {
  assert.deepEqual(calculateDailyTotals([on("00:00", "24:00")]), { withPower: 1440, withoutPower: 0 })
})

test("all-day outage", () => {
  assert.deepEqual(calculateDailyTotals([off("00:00", "24:00")]), { withPower: 0, withoutPower: 1440 })
})

test("half-hour and one-hour intervals", () => {
  assert.deepEqual(calculateDailyTotals([on("00:00", "00:30"), off("00:30", "01:30"), on("01:30", "24:00")]), { withPower: 1380, withoutPower: 60 })
})

test("rejects gaps or overlapping periods", () => {
  assert.throws(() => calculateDailyTotals([on("00:00", "03:00"), off("04:00", "24:00")]), /gaps or overlaps/)
  assert.throws(() => calculateDailyTotals([on("00:00", "03:00"), off("02:00", "24:00")]), /gaps or overlaps/)
})

test("rejects incomplete or malformed schedules", () => {
  assert.throws(() => calculateDailyTotals([off("00:00", "23:30")]), /cover all 24 hours/)
  assert.throws(() => calculateDailyTotals([off("00:00", "25:00")]), /Invalid clock/)
  assert.throws(() => calculateDailyTotals([]), /missing/)
})

test("duration formatting", () => {
  assert.equal(formatDuration(0), "0 хв")
  assert.equal(formatDuration(30), "30 хв")
  assert.equal(formatDuration(60), "1 год")
  assert.equal(formatDuration(1440), "24 год")
})
