// Compare outage periods at DTEK's 30-minute schedule resolution.
const HALF_HOUR_MINUTES = 30
const SLOTS_PER_DAY = 48

function toMinutes(clock) {
  const match = /^(\d{2}):(\d{2})$/.exec(clock ?? "")
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) {
    return null
  }
  return hours * 60 + minutes
}

function markOutages(periods) {
  const slots = Array(SLOTS_PER_DAY).fill(false)

  for (const { begin, end } of periods) {
    const start = toMinutes(begin)
    const finish = toMinutes(end)
    if (start === null || finish === null || start >= finish) return null

    for (let i = 0; i < SLOTS_PER_DAY; i++) {
      const midpoint = i * HALF_HOUR_MINUTES + HALF_HOUR_MINUTES / 2
      if (midpoint >= start && midpoint < finish) slots[i] = true
    }
  }

  return slots
}

function previousOutages(scheduleText) {
  if (typeof scheduleText !== "string") return null
  if (!scheduleText.includes("🪫") && !scheduleText.includes("🔋")) return null

  const outages = [...scheduleText.matchAll(/🪫\s*<code>(\d{2}:\d{2})\s*—\s*(\d{2}:\d{2})<\/code>/g)].map(
    ([, begin, end]) => ({ begin, end }),
  )

  // An unrecognized outage format must not be interpreted as zero outages.
  if (scheduleText.includes("🪫") && outages.length === 0) return null

  return markOutages(outages)
}

function clockAtSlot(slot) {
  const hours = Math.floor(slot / 2)
  const minutes = slot % 2 === 0 ? "00" : "30"
  return String(hours).padStart(2, "0") + ":" + minutes
}

function changedRanges(flags) {
  const result = []
  for (let i = 0; i < flags.length; ) {
    if (!flags[i]) {
      i++
      continue
    }

    const start = i
    while (i < flags.length && flags[i]) i++
    result.push(clockAtSlot(start) + " — " + clockAtSlot(i))
  }
  return result
}

export function describeScheduleChanges(previousScheduleText, schedule) {
  const title = "⚠️ <b>ДТЕК ЗМІНИВ ГРАФІК!</b>"
  const previous = previousOutages(previousScheduleText)
  const current = markOutages(schedule.filter(({ power }) => power === false))
  if (!previous || !current) return title

  const added = changedRanges(current.map((off, i) => off && !previous[i]))
  const canceled = changedRanges(previous.map((off, i) => off && !current[i]))
  if (!added.length && !canceled.length) return title

  return [
    title,
    ...(added.length
      ? ["➕ <b>Додано відключення:</b>", ...added.map((range) => "🪫 <code>" + range + "</code>")]
      : []),
    ...(canceled.length
      ? ["➖ <b>Скасовано відключення:</b>", ...canceled.map((range) => "🔋 <code>" + range + "</code>")]
      : []),
  ].join("\n")
}
