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
const USEFUL_TIPS_URL = VIEWER_URL + "guide/lifehacks/?v=20261116-tomato-moved"
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

export function imageNeedsRefresh(lastMessage, { source, update, weatherStamp, countdownTick }) {
  return lastMessage.source !== source ||
    lastMessage.update !== update ||
    lastMessage.weatherStamp !== weatherStamp ||
    lastMessage.countdownTick !== countdownTick ||
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
    "🚨 Аварії: автоматичної перевірки для СТ «Хімік» немає.",
    '🔎 <a href="https://www.dtek-krem.com.ua/ua/shutdowns">Перевірити відключення за адресою в ДТЕК</a>',
  ]
  const event = nextPowerEvent(schedule, date)
  if (event.kind === "countdown") {
    info.unshift("⏱ <b>" + safe(event.title) + ": " + safe(event.remaining) + "</b> · " + safe(event.detail))
  } else if (event.kind === "future") {
    info.unshift("⏱ <b>" + safe(event.title) + (event.remaining ? ": " + safe(event.remaining) : "") + "</b> · " + safe(event.detail))
  }
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

function saveViewerSnapshot(png, label, details) {
  // Public viewer receives only rendered graphics, never Telegram credentials.
  try {
    fs.mkdirSync("artifacts/web", { recursive: true })
    const basename = label === "завтра" ? "tomorrow" : "today"
    fs.writeFileSync("artifacts/web/" + basename + ".png", png)
    // Canonical periods used to generate the Telegram image.
    fs.writeFileSync("artifacts/web/" + basename + ".json", JSON.stringify({
      date: details.date, label: details.label, group: "1.1",
      generatedAt: new Date().toISOString(), source: details.source,
      sourceUpdated: details.update,
      weather: details.weather ?? null,
      periods: details.schedule.map(({begin,end,power}) => ({begin,end,power}))
    }, null, 2))
    // Publish real HTML elements and text, never stretch the Telegram bitmap.
    const responsiveCss = `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes"><style>
html,body{width:100%!important;min-width:0!important;max-width:100%!important;overflow-x:hidden!important}
body{margin:0!important;background:#020e08!important}
#v3-stage{width:100%;position:relative;overflow:hidden}
#v3-card{width:1404px;transform-origin:top left}
#v3-controls{position:fixed;right:9px;bottom:12px;z-index:100000;display:flex;gap:6px}
#v3-controls button{font:700 13px system-ui;border:1px solid #79f88c;border-radius:10px;background:#052516;color:#eaffed;padding:9px 11px}
#v3-stage[data-mode="detail"]{overflow-x:auto;touch-action:pan-x pan-y}
</style>`;
    const controls='<nav id="v3-controls" aria-label="Масштаб картки"><button id="v3-fit" type="button">Умістити</button><button id="v3-detail" type="button">100%</button></nav>';
    const script=`<script>
(function(){
const stage=document.getElementById('v3-stage'),card=document.getElementById('v3-card');
let mode='fit';
function layout(){
 const scale=mode==='fit'?Math.min(1,Math.max(1,stage.clientWidth)/1404):1;
 card.style.transform='scale('+scale+')';
 stage.style.height=Math.ceil(card.scrollHeight*scale)+'px';
 stage.style.overflowX=mode==='detail'?'auto':'hidden';
 stage.dataset.mode=mode;
}
document.getElementById('v3-fit').addEventListener('click',()=>{mode='fit';layout();});
document.getElementById('v3-detail').addEventListener('click',()=>{mode='detail';layout();});
window.addEventListener('resize',layout);
window.addEventListener('orientationchange',()=>requestAnimationFrame(layout));
window.addEventListener('load',layout);
if('ResizeObserver' in window)new ResizeObserver(layout).observe(card);
layout();
})();
</script>`;
    let html=buildCardV3Html(details).replace('</head>',responsiveCss+'</head>');
    html=html.replace(/<body([^>]*)>/i,(_m,attrs)=>'<body'+attrs+'>'+controls+'<div id="v3-stage"><div id="v3-card">');
    html=html.replace('</article>','</article></div></div>');
    html=html.replace('</body>',script+'</body>');
    fs.writeFileSync("artifacts/web/" + basename + ".html", html)
  } catch (error) {
    console.warn("⚠️ Viewer snapshot unavailable: " + error.message)
  }
}

function publishCanonicalSchedule({schedule,date,label,update,source,weather}) {
  // Run only after Telegram confirms an image or caption update.
  const basename=label==="завтра"?"tomorrow":"today"
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error("Invalid schedule date")
  const slots=Array(48).fill(null)
  const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3))
  for(const p of schedule){
    const a=minute(p.begin),b=minute(p.end)
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b>1440||a>=b||a%30||b%30||typeof p.power!=="boolean")throw Error("Invalid schedule period")
    for(let i=a/30;i<b/30;i++){
      if(slots[i]!==null)throw Error("Overlapping slot "+i)
      slots[i]=p.power
    }
  }
  if(slots.some(x=>x===null))throw Error("Incomplete 48-slot schedule")
  fs.mkdirSync("artifacts/web",{recursive:true})
  const file="artifacts/web/"+basename+".json"
  const payload={date,label,group:process.env.GROUP||"1.1",generatedAt:new Date().toISOString(),source,sourceUpdated:update,weather:weather??null,periods:schedule.map(({begin,end,power})=>({begin,end,power}))}
  fs.writeFileSync(file+".tmp",JSON.stringify(payload,null,2))
  fs.renameSync(file+".tmp",file)
  console.log("🟢 Canonical Telegram schedule saved: "+file+" (48/48 slots)")
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
  // Refresh ONLY today's graphic each five-minute poll, even if source and
  // forecast timestamps remain unchanged. Tomorrow has no live countdown.
  const countdownTick = label === "сьогодні" ? Math.floor(Date.now() / 300_000) : null
  const imageRefresh = priorPhoto && same && imageNeedsRefresh(lastMessage, { source, update, weatherStamp, countdownTick })

  // Routine checks update the caption. A changed data timestamp or source
  // replaces the photo in place, without posting a fresh notification.
  if (same && priorPhoto) {
    try {
      let result
      if (imageRefresh) {
        const png = await renderCardPng({ schedule, date, label, update, source, weather })
        saveViewerSnapshot(png, label, { schedule, date, label, update, source, weather })
        const form = new FormData()
        form.set("chat_id", String(TELEGRAM_CHAT_ID))
        form.set("message_id", String(lastMessage.message_id))
        form.set("media", JSON.stringify({
          type: "photo", media: "attach://chart", caption, parse_mode: "HTML",
        }))
        form.set("reply_markup", JSON.stringify(viewerKeyboard(label)))
        form.set("chart", new Blob([png], { type: "image/png" }), "svitlopuls.png")
        result = await callTelegram("editMessageMedia", form)
        console.log("🟢 Telegram editMessageMedia confirmed: message_id=" + result.message_id + ", photo=" + Boolean(result.photo?.length) + ", renderVersion=" + CARD_RENDER_VERSION)
      } else {
        result = await callTelegram("editMessageCaption", {
          chat_id: TELEGRAM_CHAT_ID, message_id: lastMessage.message_id,
          caption, parse_mode: "HTML", reply_markup: viewerKeyboard(label),
        })
        console.log("🟢 Updated the existing card caption")
      }
      try { publishCanonicalSchedule({schedule,date,label,update,source,weather}) } catch (error) { console.warn("Canonical JSON unavailable: "+error.message) }
      saveLastMessage({
        date: result.date || lastMessage.date,
        message_id: lastMessage.message_id,
        scheduleText: message.scheduleText, changeSummary: message.changeSummary,
        scheduleDay: date, kind: "photo", source, update, weatherStamp, countdownTick, renderVersion: CARD_RENDER_VERSION,
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
        saveViewerSnapshot(png, label, { schedule, date, label, update, source, weather })
    const form = new FormData()
    form.set("chat_id", String(TELEGRAM_CHAT_ID))
    form.set("reply_markup", JSON.stringify(viewerKeyboard(label)))
    form.set("photo", new Blob([png], { type: "image/png" }), "svitlopuls.png")
    form.set("caption", caption)
    form.set("parse_mode", "HTML")
    form.set("disable_notification", String(checkIsNight()))
    const reply = replyTo(lastMessage)
    if (reply) form.set("reply_parameters", JSON.stringify(reply))
    const result = await callTelegram("sendPhoto", form)
    try { publishCanonicalSchedule({schedule,date,label,update,source,weather}) } catch (error) { console.warn("Canonical JSON unavailable: "+error.message) }
    saveLastMessage({
      date: result.date, message_id: result.message_id,
      scheduleText: message.scheduleText, changeSummary: message.changeSummary,
      scheduleDay: date, kind: "photo", source, update, weatherStamp, countdownTick, renderVersion: CARD_RENDER_VERSION,
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
      scheduleDay: date, kind: "text", source, update, weatherStamp, countdownTick, renderVersion: CARD_RENDER_VERSION,
    }, stateFile)
    console.log("🟢 Backup text schedule published")
  }
}
