import { getShutdownsData, selectScheduleDays } from "./source.js"
import { describeScheduleChanges } from "./changes.js"
import { calculateDailyTotals, formatDuration } from "./summary.js"

import {
  checkIsNight,
  createPeriod,
  getCurrentTime,
  loadLastMessage,
  saveLastMessage,
  deleteLastMessage,
  useSchedule,
} from "./helpers.js"
import {
  GROUP,
  hours,
  LAST_MESSAGE_FILE,
  TOMORROW_MESSAGE_FILE,
  PowerState,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  RETRIES_TIMEOUT,
  RETRIES_MAX_COUNT,
} from "./constants.js"

let sendNotificationRetries = 0

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

async function sendNotification({ text, scheduleText, changeSummary, stateFile, scheduleDay, lastMessage }) {
  if (!TELEGRAM_BOT_TOKEN) throw Error("❌ Missing telegram bot token.")
  if (!TELEGRAM_CHAT_ID) throw Error("❌ Missing telegram chat id.")

  console.log("🌀 Sending notification...")

  const isScheduleChanged = lastMessage.scheduleText !== scheduleText
  const isEdit = Boolean(lastMessage.message_id) && !isScheduleChanged
  const isReply = Boolean(lastMessage.message_id) && isScheduleChanged

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${
        isEdit ? "editMessageText" : "sendMessage"
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_notification: checkIsNight(),
          message_id: isEdit ? lastMessage.message_id : undefined,
          reply_parameters: isReply
            ? {
                message_id: lastMessage.message_id,
                allow_sending_without_reply: true,
              }
            : undefined,
        }),
      }
    )

    const data = await response.json()

    if (data.description?.includes("not modified")) {
      console.log("🟡 Notification not changed.")
      return
    }
    if (!data.ok) {
      deleteLastMessage(stateFile)
      throw Error(data.description)
    }

    saveLastMessage({ ...data.result, scheduleText, changeSummary, scheduleDay }, stateFile)

    console.log("🟢 Notification sent.")
  } catch (error) {
    console.error(`❌ Sending notification failed: ${error.message}.`)

    if (sendNotificationRetries < RETRIES_MAX_COUNT) {
      console.log("🌀 Try sending notification again...")
      await new Promise((resolve) => setTimeout(resolve, RETRIES_TIMEOUT))
      sendNotificationRetries++
      return await sendNotification({ text, scheduleText, changeSummary, stateFile, scheduleDay, lastMessage })
    }

    throw Error(
      `❌ Sending notification failed after ${RETRIES_MAX_COUNT} retries.`
    )
  }
}

async function run() {
  const { fact, source } = await getShutdownsData()
  const days = selectScheduleDays(fact)
  if (!days.length) {
    console.log("🟡 Немає графіка на сьогодні або завтра")
    return
  }

  for (const { key, date, label } of days) {
    if (!fact.data[key]?.[GROUP]) {
      console.log("🟡 Немає графіка для " + GROUP + " на " + date)
      continue
    }
    const schedule = generateSchedule({ data: fact.data, dayKey: key })
    const stateFile = label === "сьогодні" ? LAST_MESSAGE_FILE : TOMORROW_MESSAGE_FILE
    const lastMessage = loadLastMessage(stateFile, date) || {}
    const message = generateMessage(schedule, fact.update, lastMessage, label, date, source)
    await sendNotification({ ...message, stateFile, scheduleDay: date, lastMessage })
  }
}

run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
