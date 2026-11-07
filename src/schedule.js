import { getShutdownsData, selectScheduleDays } from "./source.js"
import { describeScheduleChanges } from "./changes.js"
import { calculateDailyTotals, formatDuration } from "./summary.js"
import { publishCard } from "./media.js"
import { loadWeather, weatherForDate } from "./weather.js"
import { publishDueTransitions } from "./transitions.js"

import {
  createPeriod,
  getCurrentTime,
  loadLastMessage,
  useSchedule,
} from "./helpers.js"
import {
  GROUP,
  hours,
  LAST_MESSAGE_FILE,
  TOMORROW_MESSAGE_FILE,
  PowerState,
} from "./constants.js"

function generateSchedule({ data, dayKey }) {
  console.log("🌀 Generating schedule...")

  try {
    const hoursStates = data[dayKey]?.[GROUP]
    if (!hoursStates) throw Error("group " + GROUP + " not found for " + dayKey)
    const [schedule, setSchedule] = useSchedule([])

    hours.forEach((hour) => {
      const state = hoursStates[hour + 1]
      if (!Object.values(PowerState).includes(state)) {
        throw Error("unknown or missing power state for hour " + (hour + 1))
      }

      switch (state) {
        case PowerState.ON:
          setSchedule(createPeriod({ hour, power: true }))
          break

        case PowerState.OFF:
          setSchedule(createPeriod({ hour, power: false }))
          break

        case PowerState.HALF_ON:
          setSchedule(createPeriod({ hour, endMin: 30, power: true }))
          setSchedule(createPeriod({ hour, startMin: 30, power: false }))
          break

        case PowerState.HALF_OFF:
          setSchedule(createPeriod({ hour, endMin: 30, power: false }))
          setSchedule(createPeriod({ hour, startMin: 30, power: true }))
          break
      }
    })

    console.log("✅ Generating schedule finished.")

    return schedule
  } catch (error) {
    throw Error(`❌ Generating schedule failed: ${error.message}.`)
  }
}

function generateMessage(schedule = [], update, lastMessage = {}, dayLabel, date, source) {
  console.log("🌀 Generating message...")

  const { withPower, withoutPower } = calculateDailyTotals(schedule)
  const isShutdownsExists = schedule.some(({ power }) => !power)
  isShutdownsExists
    ? console.log("🪫 Power shutdowns detected!")
    : console.log("🔋 No power shutdowns!")

  const scheduleText = [
    ...(isShutdownsExists
      ? schedule
          .filter(({ power }) => !power)
          .map(({ begin, end }) => `🪫 <code>${begin} — ${end}</code>`)
      : schedule.map(({ begin, end }) => `🔋 <code>${begin} — ${end}</code>`)),
  ].join("\n")

  const changeSummary =
    lastMessage.scheduleText && lastMessage.scheduleText !== scheduleText
      ? describeScheduleChanges(lastMessage.scheduleText, schedule)
      : lastMessage.scheduleText === scheduleText
        ? (lastMessage.changeSummary ?? "")
        : ""

  const text = [
    ...(changeSummary ? [changeSummary, ""] : []),
    `⚡️ <b>Графік відключень на ${dayLabel} (${date.split("-").reverse().join(".")}):</b>`,
    "",
    "📊 <b>За графіком на добу:</b>",
    "🟢 <b>Зі світлом:</b> " + formatDuration(withPower),
    "🔴 <b>Без світла:</b> " + formatDuration(withoutPower),
    "",
    ...(isShutdownsExists ? ["🪫 <b>Періоди відключень:</b>"] : []),
    scheduleText,
    "",
    `📢 <i>${update ?? ""}</i>`,
    ...(source === "ДТЕК" ? [] : [`📡 <i>Джерело: ${source}</i>`]),
    `🤖 <i>${getCurrentTime()}</i>`,
  ].join("\n")

  return { text, scheduleText, changeSummary }
}

async function run() {
  const { fact, source } = await getShutdownsData()
  const days = selectScheduleDays(fact)
  if (!days.length) {
    console.log("🟡 Немає графіка на сьогодні або завтра")
    return
  }

  // Weather is optional. A forecast/API failure must never stop DTEK notifications.
  const weatherSnapshot = await loadWeather().catch(error => {
    console.warn("⚠️ Weather module failed: " + error.message)
    return null
  })

  for (const { key, date, label } of days) {
    if (!fact.data[key]?.[GROUP]) {
      console.log("🟡 Немає графіка для " + GROUP + " на " + date)
      continue
    }
    const schedule = generateSchedule({ data: fact.data, dayKey: key })
    const stateFile = label === "сьогодні" ? LAST_MESSAGE_FILE : TOMORROW_MESSAGE_FILE
    const lastMessage = loadLastMessage(stateFile, date) || {}
    const message = generateMessage(schedule, fact.update, lastMessage, label, date, source)
    await publishCard({ schedule, date, label, update: fact.update, source, message, lastMessage, stateFile, weather: weatherForDate(weatherSnapshot, date) })
    if (label === "сьогодні") {
      try {
        await publishDueTransitions({ schedule, date, source })
      } catch (error) {
        // Keep the regular schedule cards available even when a transition
        // notification fails; a subsequent poll can retry within the window.
        console.warn("⚠️ Planned transition notification failed: " + error.message)
      }
    }
  }
}

run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
