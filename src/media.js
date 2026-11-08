import { calculateDailyTotals, formatDuration } from "./summary.js"
import { checkIsNight, getCurrentTime, saveLastMessage } from "./helpers.js"
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "./constants.js"
import { renderCardPng } from "./card.js"

const safe = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const MAX_CAPTION = 1024
// A visual redesign must update the existing Telegram photo even if neither
// the weather timestamp nor the power schedule has changed.
export const CARD_RENDER_VERSION = "2026-11-08-wind-full-width-v1"

export function imageNeedsRefresh(lastMessage, { source, update, weatherStamp }) {
  return lastMessage.source !== source ||
    lastMessage.update !== update ||
    lastMessage.weatherStamp !== weatherStamp ||
    lastMessage.renderVersion !== CARD_RENDER_VERSION
}

export function buildCaption({ schedule, date, label, source, changeSummary = "", update }) {
  const totals = calculateDailyTotals(schedule)
  const ddmmyyyy = date.split("-").reverse().join(".")
  const periods = schedule.filter((p) => !p.power)
  const headline = [
    "⚡ <b>СВІТЛОПУЛЬС | СТ «Хімік»</b>",
    "📅 <b>На " + safe(label) + " · " + safe(ddmmyyyy) + "</b>",
    "",
  ]
  const info = [
    "🟢 Зі світлом: <b>" + formatDuration(totals.withPower) + "</b>",
    "🔴 Без світла: <b>" + formatDuration(totals.withoutPower) + "</b>",
    "",
    "📡 " + (source === "ДТЕК" ? "ДТЕК" : "ДТЕК (резервні дані)") +
      " · дані " + safe(update || "без часу"),
    "🤖 Перевірено: " + safe(getCurrentTime()),
  ]
  const items = periods.length
    ? periods.map((p) => "🪫 <code>" + safe(p.begin) + " — " + safe(p.end) + "</code>")
    : ["✅ Відключень за графіком немає"]
  const changes = changeSummary ? [changeSummary, ""] : []
  const compose = (rows, intro) => [...headline, ...intro, ...rows, "", ...info].join("\n")

  let show = [...items]
  let note = []
  let caption = compose(show, changes)
  while (caption.length > MAX_CAPTION && show.length > 1) {
    show = show.slice(0, -1)
    note = ["… та ще " + (items.length - show.length) + " періодів"]
    caption = compose([...show, ...note], changes)
  }
  if (caption.length > MAX_CAPTION) caption = compose([...show, ...note], [])
  while (caption.length > MAX_CAPTION && show.length > 0) {
    show = show.slice(0, -1)
    note = ["Повний розклад дивись у картці та офіційних даних."]
    caption = compose([...show, ...note], [])
  }
  if (caption.length > MAX_CAPTION) throw Error("Telegram caption is too long")
  return caption
}

async function callTelegram(method, body) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) throw Error("Telegram credentials are missing")
  const response = await fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/" + method, {
    method: "POST",
    ...(body instanceof FormData ? { body } :
      { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(25_000),
  })
  const result = await response.json()
  if (!response.ok || !result.ok) throw Error(method + ": " + (result.description || response.status))
  return result.result
}

function replyTo(last) {
  if (!last?.message_id) return undefined
  return { message_id: last.message_id, allow_sending_without_reply: true }
}

export async function publishCard({ schedule, date, label, update, source, message, lastMessage, stateFile, weather = null }) {
  const caption = buildCaption({
    schedule, date, label, update, source, changeSummary: message.changeSummary,
  })
  const same = lastMessage.scheduleText === message.scheduleText
  const priorPhoto = Boolean(lastMessage.message_id) && lastMessage.kind === "photo"
  const weatherStamp = weather ? (weather.stale ? "stale:" : "fresh:") + weather.fetchedAt : "unavailable"
  const imageRefresh = priorPhoto && same && imageNeedsRefresh(lastMessage, { source, update, weatherStamp })

  // Routine checks update the caption. A changed data timestamp or source
  // replaces the photo in place, without posting a fresh notification.
  if (same && priorPhoto) {
    try {
      let result
      if (imageRefresh) {
        const png = await renderCardPng({ schedule, date, label, update, source, weather })
        const form = new FormData()
        form.set("chat_id", String(TELEGRAM_CHAT_ID))
        form.set("message_id", String(lastMessage.message_id))
        form.set("media", JSON.stringify({
          type: "photo", media: "attach://chart", caption, parse_mode: "HTML",
        }))
        form.set("chart", new Blob([png], { type: "image/png" }), "svitlopuls.png")
        result = await callTelegram("editMessageMedia", form)
        console.log("🟢 Refreshed existing card's source/time information")
      } else {
        result = await callTelegram("editMessageCaption", {
          chat_id: TELEGRAM_CHAT_ID, message_id: lastMessage.message_id,
          caption, parse_mode: "HTML",
        })
        console.log("🟢 Updated the existing card caption")
      }
      saveLastMessage({
        date: result.date || lastMessage.date,
        message_id: lastMessage.message_id,
        scheduleText: message.scheduleText, changeSummary: message.changeSummary,
        scheduleDay: date, kind: "photo", source, update, weatherStamp, renderVersion: CARD_RENDER_VERSION,
      }, stateFile)
    } catch (error) {
      if (String(error).includes("message is not modified")) {
        console.log("🟡 Caption already up to date")
      } else {
        console.warn("⚠️ Telegram photo edit failed: " + error.message)
      }
    }
    return
  }

  try {
    const png = await renderCardPng({ schedule, date, label, update, source, weather })
    const form = new FormData()
    form.set("chat_id", String(TELEGRAM_CHAT_ID))
    form.set("photo", new Blob([png], { type: "image/png" }), "svitlopuls.png")
    form.set("caption", caption)
    form.set("parse_mode", "HTML")
    form.set("disable_notification", String(checkIsNight()))
    const reply = replyTo(lastMessage)
    if (reply) form.set("reply_parameters", JSON.stringify(reply))
    const result = await callTelegram("sendPhoto", form)
    saveLastMessage({
      date: result.date, message_id: result.message_id,
      scheduleText: message.scheduleText, changeSummary: message.changeSummary,
      scheduleDay: date, kind: "photo", source, update, weatherStamp, renderVersion: CARD_RENDER_VERSION,
    }, stateFile)
    console.log("🟢 Svitlopuls graphical card with caption published")
  } catch (error) {
    console.error("⚠️ Could not send the card, using text fallback: " + error.message)
    // The text fallback preserves outage alerts if rendering/upload fails.
    const existingText = Boolean(lastMessage.message_id) && lastMessage.kind !== "photo" && same
    const result = await callTelegram(existingText ? "editMessageText" : "sendMessage", {
      chat_id: TELEGRAM_CHAT_ID,
      text: message.text,
      parse_mode: "HTML",
      ...(existingText ? { message_id: lastMessage.message_id } :
        { disable_notification: checkIsNight(), reply_parameters: replyTo(lastMessage) }),
    })
    saveLastMessage({
      date: result.date, message_id: result.message_id,
      scheduleText: message.scheduleText, changeSummary: message.changeSummary,
      scheduleDay: date, kind: "text", source, update, weatherStamp, renderVersion: CARD_RENDER_VERSION,
    }, stateFile)
    console.log("🟢 Backup text schedule published")
  }
}
