// These are notifications about planned changes in the DTEK schedule.
// Never describe them as independently confirmed physical power measurements.
import fs from "node:fs"
import path from "node:path"
import { kyivDate } from "./source.js"
import { calculateDailyTotals, formatDuration } from "./summary.js"
import { checkIsNight } from "./helpers.js"
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "./constants.js"

export const TRANSITION_STATE_FILE = path.resolve(
  "artifacts", process.env.TARGET ?? "", "transition-events.json",
)
export const GRACE_MINUTES = 12

function toMinute(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function kyivClock(now) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now)
}

function html(value) {
  return String(value ?? "").replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function plannedTransitions(schedule, date) {
  calculateDailyTotals(schedule)
  // At midnight the previous day's state is unknown. We only announce actual
  // transitions between adjacent periods in the selected day's plan.
  const transitions = []
  for (let i = 1; i < schedule.length; i++) {
    const previous = schedule[i - 1]
    const period = schedule[i]
    if (previous.power === period.power) continue
    const clock = period.begin
    transitions.push({
      id: date + "|" + clock + "|" + (period.power ? "on" : "off"),
      date, clock, period, previous,
      nextOff: period.power ? schedule.slice(i + 1).find(p => !p.power) : undefined,
    })
  }
  return transitions
}

export function duePlannedTransitions(schedule, date, now = new Date()) {
  if (kyivDate(now) !== date) return []
  const current = toMinute(kyivClock(now))
  return plannedTransitions(schedule, date).filter(event => {
    const difference = current - toMinute(event.clock)
    return difference >= 0 && difference <= GRACE_MINUTES
  })
}

export function formatTransitionMessage(event, source = "ДТЕК") {
  const { clock, period, previous, nextOff } = event
  const power = period.power
  const time = period.begin + " — " + period.end
  const duration = formatDuration(toMinute(period.end) - toMinute(period.begin))
  const previousDuration = formatDuration(toMinute(previous.end) - toMinute(previous.begin))
  const caption = [
    "⚡ <b>СВІТЛОПУЛЬС | СТ «Хімік»</b>",
    "",
  ]
  if (power) {
    caption.push(
      "🟢 <b>" + html(clock) + " · Планове відновлення</b>",
      "🕒 Попереднє відключення за графіком: <b>" +
        html(previous.begin) + " — " + html(previous.end) + "</b> (" + html(previousDuration) + ")",
      "💡 Плановий період зі світлом: <b>" +
        html(time) + "</b> (" + html(duration) + ")",
      nextOff
        ? "📅 Наступне планове відключення: <b>" +
          html(nextOff.begin) + " — " + html(nextOff.end) + "</b>"
        : "📅 Більше планових відключень сьогодні немає.",
    )
  } else {
    caption.push(
      "🔴 <b>" + html(clock) + " · Планове відключення</b>",
      "🕒 За графіком без світла: <b>" + html(time) + "</b>",
      "⏳ Запланована тривалість: <b>" + html(duration) + "</b>",
      period.end === "24:00"
        ? "📅 Відновлення — згідно з графіком наступного дня."
        : "📅 Планове відновлення: <b>" + html(period.end) + "</b>",
    )
  }
  caption.push(
    "",
    "📡 <i>За графіком ДТЕК" +
      (source === "ДТЕК" ? "" : " (резервні дані)") +
      "; фактична наявність електрики не вимірюється.</i>",
  )
  return caption.join("\n")
}

export function loadSentTransitionIds(filePath = TRANSITION_STATE_FILE) {
  if (!fs.existsSync(filePath)) return []
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"))
  if (!value || !Array.isArray(value.sent) ||
      !value.sent.every(item => typeof item === "string")) {
    throw new Error("Invalid transition state: refusing to risk duplicate notifications")
  }
  return value.sent
}

export function saveSentTransitionIds(ids, filePath = TRANSITION_STATE_FILE) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tmp = filePath + ".tmp"
  try {
    fs.writeFileSync(tmp, JSON.stringify({ sent: ids }, null, 2) + "\n")
    fs.renameSync(tmp, filePath)
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp)
  }
}

// Send at most one message per planned boundary, rather than one per polling
// run. Keep 10 days of event IDs so repeated CI jobs do not duplicate them.
export async function publishDueTransitions({
  schedule, date, source, now = new Date(),
  stateFile = TRANSITION_STATE_FILE,
  sender = sendTransitionMessage,
}) {
  const due = duePlannedTransitions(schedule, date, now)
  if (!due.length) return []
  const sent = new Set(loadSentTransitionIds(stateFile))
  const published = []
  for (const event of due) {
    if (sent.has(event.id)) continue
    const message = formatTransitionMessage(event, source)
    await sender(message)
    sent.add(event.id)
    published.push(event.id)
    const cutoff = new Date(now.getTime() - 10 * 86400_000).toISOString().slice(0, 10)
    saveSentTransitionIds([...sent].filter(id => id.split("|")[0] >= cutoff), stateFile)
    console.log("🟢 Planned schedule event sent:", event.id)
  }
  return published
}

async function sendTransitionMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram token or chat ID is missing")
  }
  const response = await fetch(
    "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text, parse_mode: "HTML",
        disable_notification: checkIsNight(),
      }),
      signal: AbortSignal.timeout(25_000),
    },
  )
  const data = await response.json()
  if (!response.ok || !data.ok) {
    throw new Error("Telegram transition message: " + (data.description || response.status))
  }
  return data.result
}
