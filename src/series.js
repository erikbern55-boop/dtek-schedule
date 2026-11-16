import fs from "node:fs"
import path from "node:path"
import { checkIsNight } from "./helpers.js"
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "./constants.js"

export const SLIPA_CHANNEL_ID = "UCFBNG7pHXQaf8Ck4RsmWHKg"
export const SLIPA_FEED_URL =
  "https://www.youtube.com/feeds/videos.xml?channel_id=" + SLIPA_CHANNEL_ID
export const SLIPA_STATE_FILE = path.resolve(
  "artifacts", process.env.TARGET ?? "", "slipa-notifications.json",
)

function decodeXml(value) {
  return String(value ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim()
}

function tagValue(xml, tag) {
  const match = xml.match(new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)</" + tag + ">"))
  return match ? decodeXml(match[1]) : ""
}

export function parseSlipaFeed(xml) {
  return [...String(xml).matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)]
    .map(([, entry]) => {
      const videoId = tagValue(entry, "yt:videoId")
      const title = tagValue(entry, "title")
      const linkTag = (entry.match(/<link\b[^>]*\/?\s*>/g) ?? [])
        .find(tag => /\brel=["']alternate["']/.test(tag))
      const href = linkTag?.match(/\bhref=["']([^"']+)["']/)?.[1]
      return videoId && title
        ? { videoId, title, url: href || "https://www.youtube.com/watch?v=" + videoId }
        : null
    })
    .filter(Boolean)
}

export function isSlipaEpisodeTitle(title) {
  const value = String(title ?? "").normalize("NFKC").trim()
  return /(?:^|\s)(?:серіал\s+)?сліпа(?=$|[\s:|—–-])/iu.test(value) &&
    !/(анонс|трейлер|тизер|короткий\s+огляд|шортс|shorts?)/iu.test(value)
}

function loadState() {
  if (!fs.existsSync(SLIPA_STATE_FILE)) return null
  const value = JSON.parse(fs.readFileSync(SLIPA_STATE_FILE, "utf8"))
  if (!value || typeof value.lastSeenVideoId !== "string" || !value.lastSeenVideoId) {
    throw new Error("Invalid Slipa notification state; refusing duplicate or historical alerts")
  }
  return value
}

function saveState(lastSeenVideoId) {
  fs.mkdirSync(path.dirname(SLIPA_STATE_FILE), { recursive: true })
  const tmp = SLIPA_STATE_FILE + ".tmp"
  try {
    fs.writeFileSync(tmp, JSON.stringify({ lastSeenVideoId }, null, 2) + "\n")
    fs.renameSync(tmp, SLIPA_STATE_FILE)
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp)
  }
}

async function sendEpisodeNotification(entry) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram token or chat ID is missing")
  }
  const response = await fetch(
    "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: "🎬 <b>Вийшла нова серія «Сліпа»!</b>\n\n" +
          entry.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        parse_mode: "HTML",
        disable_notification: checkIsNight(),
        reply_markup: {
          inline_keyboard: [[{
            text: "▶️ Дивитися серію на YouTube",
            url: entry.url,
          }]],
        },
      }),
      signal: AbortSignal.timeout(20_000),
    },
  )
  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error("Telegram Slipa notification: " + (result.description || response.status))
  }
  return result.result
}

// The first run records the current latest upload as a baseline. Later runs
// notify once per new episode and persist progress after each successful send.
export async function publishNewSlipaEpisodes({
  feedUrl = SLIPA_FEED_URL,
  stateFile = SLIPA_STATE_FILE,
  fetchImpl = fetch,
  sender = sendEpisodeNotification,
} = {}) {
  const response = await fetchImpl(feedUrl, {
    headers: { Accept: "application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error("YouTube feed returned HTTP " + response.status)
  const entries = parseSlipaFeed(await response.text())
  if (!entries.length) throw new Error("YouTube feed has no valid video entries")

  const readState = () => {
    if (!fs.existsSync(stateFile)) return null
    const value = JSON.parse(fs.readFileSync(stateFile, "utf8"))
    if (!value || typeof value.lastSeenVideoId !== "string" || !value.lastSeenVideoId) {
      throw new Error("Invalid Slipa notification state; refusing duplicate or historical alerts")
    }
    return value
  }
  const writeState = videoId => {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true })
    const tmp = stateFile + ".tmp"
    try {
      fs.writeFileSync(tmp, JSON.stringify({ lastSeenVideoId: videoId }, null, 2) + "\n")
      fs.renameSync(tmp, stateFile)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp)
    }
  }

  const state = readState()
  if (!state) {
    writeState(entries[0].videoId)
    console.log("🟢 YouTube episode feed baseline saved; no historical alerts sent")
    return []
  }

  const checkpoint = entries.findIndex(entry => entry.videoId === state.lastSeenVideoId)
  if (checkpoint < 0) {
    // The feed only retains a limited recent window. Avoid sending a burst of
    // old notifications when the saved checkpoint has aged out.
    writeState(entries[0].videoId)
    console.warn("⚠️ Slipa feed checkpoint expired; advanced without backlog alerts")
    return []
  }

  const pending = entries.slice(0, checkpoint).reverse()
  const published = []
  let lastSeenVideoId = state.lastSeenVideoId
  for (const entry of pending) {
    if (isSlipaEpisodeTitle(entry.title)) {
      await sender(entry)
      published.push(entry.videoId)
      console.log("🟢 New Slipa episode notification sent:", entry.videoId)
    }
    lastSeenVideoId = entry.videoId
    writeState(lastSeenVideoId)
  }
  if (lastSeenVideoId !== entries[0].videoId) writeState(entries[0].videoId)
  return published
}
