import fs from "node:fs"
import path from "node:path"
import { LAST_MESSAGE_FILE } from "./constants.js"

function addLeadingZero(str) {
  if (typeof str !== "string" && typeof str !== "number") return
  return String(str).padStart(2, "0")
}

export function createPeriod({ hour, startMin = 0, endMin = 0, power }) {
  const begin = `${addLeadingZero(hour)}:${addLeadingZero(startMin)}`
  const end =
    endMin === 0
      ? `${addLeadingZero(hour + 1)}:00`
      : `${addLeadingZero(hour)}:${addLeadingZero(endMin)}`

  return {
    begin,
    end,
    power,
  }
}

export function useSchedule(schedule) {
  const setSchedule = (period) => {
    const last = schedule.at(-1)
    if (last?.power === period.power) {
      last.end = period.end
    } else {
      schedule.push(period)
    }
  }

  return [schedule, setSchedule]
}

export function getCurrentTime() {
  const now = new Date()

  const date = now.toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
  })

  const time = now.toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${date} ${time}`
}

export function checkIsNight() {
  const hours = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Kyiv",
    hour: "numeric",
    hour12: false,
  })
  return hours >= 22 || hours < 8
}

export function loadLastMessage(filePath = LAST_MESSAGE_FILE, expectedDay = null) {
  if (!fs.existsSync(filePath)) return null

  const lastMessage = JSON.parse(
    fs.readFileSync(filePath, "utf8").trim()
  )
  if (expectedDay && lastMessage.scheduleDay && lastMessage.scheduleDay !== expectedDay) return null
  if (expectedDay && !lastMessage.scheduleDay && filePath !== LAST_MESSAGE_FILE) return null

  if (lastMessage?.date && !lastMessage.scheduleDay) {
    const messageDay = new Date(lastMessage.date * 1000).toLocaleDateString(
      "en-CA",
      { timeZone: "Europe/Kyiv" }
    )
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Europe/Kyiv",
    })

    if (messageDay < today) {
      deleteLastMessage(filePath)
      return null
    }
  }

  return lastMessage
}

export function saveLastMessage({ date, message_id, scheduleText, changeSummary = "", scheduleDay, kind, source, update, weatherStamp, countdownTick, renderVersion } = {}, filePath = LAST_MESSAGE_FILE) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      message_id,
      date,
      scheduleText,
      changeSummary,
      scheduleDay,
      kind,
      source,
      update,
      weatherStamp,
      countdownTick,
      renderVersion,
    })
  )
}

export function deleteLastMessage(filePath = LAST_MESSAGE_FILE) {
  fs.rmSync(filePath, { force: true })
}
