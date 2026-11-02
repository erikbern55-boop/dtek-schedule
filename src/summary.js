// Totals refer to the planned 24-hour schedule, not a measured power supply.
const DAY_MINUTES = 24 * 60

function parseTime(time) {
  const match = /^(\d{2}):(\d{2})$/.exec(time ?? "")
  if (!match) throw new Error("Invalid time: " + time)
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) {
    throw new Error("Invalid clock value: " + time)
  }
  return hours * 60 + minutes
}

export function calculateDailyTotals(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    throw new Error("The schedule is missing")
  }

  let currentMinute = 0
  let withPower = 0
  let withoutPower = 0

  for (const period of schedule) {
    const start = parseTime(period.begin)
    const end = parseTime(period.end)
    if (start !== currentMinute || end <= start || end > DAY_MINUTES) {
      throw new Error("The schedule must cover the day with no gaps or overlaps")
    }
    if (typeof period.power !== "boolean") {
      throw new Error("Unknown power state")
    }

    if (period.power) withPower += end - start
    else withoutPower += end - start
    currentMinute = end
  }

  if (currentMinute !== DAY_MINUTES || withPower + withoutPower !== DAY_MINUTES) {
    throw new Error("The schedule does not cover all 24 hours")
  }

  return { withPower, withoutPower }
}

export function formatDuration(minutes) {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error("Invalid duration")
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return rest + " хв"
  return rest === 0 ? hours + " год" : hours + " год " + rest + " хв"
}
