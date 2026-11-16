import fs from "node:fs"
import { calculateDailyTotals, formatDuration } from "./summary.js"
import { checkIsNight, getCurrentTime, saveLastMessage } from "./helpers.js"
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "./constants.js"
import { buildCardHtml } from "./card.js"
import { nextPowerEvent } from "./countdown.js"
import { renderCardV3Png as renderCardPng, buildCardV3Html } from "./card-v3.js"

const safe = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const MAX_CAPTION = 1024
const VIEWER_URL = "https://erikbern55-boop.github.io/dtek-schedule/"
const USEFUL_TIPS_URL = VIEWER_URL + "guide/lifehacks/?v=20261116-apteka"
function viewerKeyboard(label) {
  return { inline_keyboard: [
    [{ text: "⛶ Відкрити на весь екран", url: VIEWER_URL + "?day=" + (label === "завтра" ? "tomorrow" : "today") }],
    [{ text: "💡 Корисні хитрощі", url: USEFUL_TIPS_URL }],
    [
      { text: "⚡ ДТЕК", url: "https://www.dtek-krem.com.ua/ua/shutdowns" },
      { text: "🌤 Погода", url: VIEWER_URL + "guide/weather/" },
    ],
    [
      { text: "🌱 Городникам", url: VIEWER_URL + "guide/garden/" },
      { text: "🌙 Місячний календар", url: VIEWER_URL + "guide/moon/" },
    ],
    [
      { text: "✨ Астропрогноз", url: VIEWER_URL + "guide/astro/" },
      { text: "💱 Курс валют", url: "https://minfin.com.ua/ua/currency/kiev/" },
    ],
    [{ text: "💡 Корисні хитрощі", url: USEFUL_TIPS_URL }],
  ] }
}

// A visual redesign must update the existing Telegram photo even if neither
// the weather timestamp nor the power schedule has changed.
export const CARD_RENDER_VERSION = "2026-11-16-neon-v3-useful-tips-menu-v2"
