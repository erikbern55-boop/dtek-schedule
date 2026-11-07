import { calculateDailyTotals, formatDuration } from "./summary.js"
import { renderWeatherPanel, WEATHER_CSS } from "./weather-card.js"

const GREEN = "#30f176"
const RED = "#ff5264"
const SIZE = 920
const escape = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")

function minutes(clock) {
  const [h, m] = clock.split(":").map(Number)
  return h * 60 + m
}

export function arcPath(start, end, radius = 185) {
  if (start < 0 || end > 1440 || end <= start) throw Error("Invalid arc interval")
  const point = (t) => {
    const angle = t / 1440 * Math.PI * 2 - Math.PI / 2
    return [260 + radius * Math.cos(angle), 260 + radius * Math.sin(angle)]
      .map((v) => v.toFixed(3))
  }
  if (end - start === 1440) {
    return "M " + point(0).join(" ") + " A " + radius + " " + radius +
      " 0 1 1 " + point(720).join(" ") + " A " + radius + " " + radius +
      " 0 1 1 " + point(1440).join(" ")
  }
  const large = end - start > 720 ? 1 : 0
  return "M " + point(start).join(" ") + " A " + radius + " " + radius +
    " 0 " + large + " 1 " + point(end).join(" ")
}

export function buildDial(schedule) {
  calculateDailyTotals(schedule)
  const segments = schedule.map(({ begin, end, power }) => {
    const color = power ? GREEN : RED
    return '<path d="' + arcPath(minutes(begin), minutes(end)) +
      '" fill="none" stroke="' + color + '" stroke-width="47" />'
  }).join("")
  const ticks = Array.from({ length: 24 }, (_, h) => {
    const a = h / 24 * Math.PI * 2 - Math.PI / 2
    const inside = h % 2 === 0 ? 219 : 225
    const outside = 229
    const x1 = 260 + Math.cos(a) * inside
    const y1 = 260 + Math.sin(a) * inside
    const x2 = 260 + Math.cos(a) * outside
    const y2 = 260 + Math.sin(a) * outside
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 +
      '" y2="' + y2 + '" stroke="#d2f3dd" opacity=".85" stroke-width="' +
      (h % 2 === 0 ? 3 : 1.5) + '" />'
  }).join("")
  const labels = Array.from({ length: 12 }, (_, i) => {
    const h = i * 2
    const a = h / 24 * Math.PI * 2 - Math.PI / 2
    const x = 260 + Math.cos(a) * 247
    const y = 260 + Math.sin(a) * 247 + 9
    return '<text x="' + x + '" y="' + y +
      '" text-anchor="middle" fill="#f5fff8" font-size="25" font-weight="700">' +
      String(h).padStart(2, "0") + '</text>'
  }).join("")
  return '<svg viewBox="0 0 520 520" role="img" aria-label="Точний 24-годинний графік">' +
    '<circle cx="260" cy="260" r="185" stroke="#123a29" stroke-width="47" fill="none" />' +
    segments + ticks + labels +
    '<circle cx="260" cy="260" r="121" stroke="#1bdc75" opacity=".5" stroke-width="2" fill="#06241c" />' +
    '<text x="260" y="244" text-anchor="middle" font-size="92" fill="#d7ff85">ϟ</text>' +
    '<text x="260" y="297" text-anchor="middle" font-size="62" font-weight="900" fill="#fff">24 год</text>' +
    '<text x="260" y="333" text-anchor="middle" font-size="25" font-style="italic" fill="#a3ddbd">ритм доби</text></svg>'
}

export function buildTimeline(schedule) {
  calculateDailyTotals(schedule)
  const parts = schedule.map(({ begin, end, power }) => {
    const width = ((minutes(end) - minutes(begin)) / 1440 * 100).toFixed(4)
    return '<span style="width:' + width + '%;background:' + (power ? GREEN : RED) + '"></span>'
  }).join("")
  return '<div class="timeline">' + parts + '</div>' +
    '<div class="timeline-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>'
}

function formatDate(date) {
  const [year, month, day] = date.split("-")
  return day + "." + month + "." + year
}

function clockKyiv(now) {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23",
  }).format(now)
}

function weekday(date) {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv", weekday: "long",
  }).format(new Date(date + "T12:00:00Z"))
}

export function nearestEvent(schedule, date, now = new Date()) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv" }).format(now)
  const off = schedule.filter((p) => !p.power)
  if (!off.length) return "Відключень не заплановано"
  if (date < today) return "Графік минулого дня"
  if (date > today) return "Перше відключення — о " + off[0].begin
  const nowClock = clockKyiv(now)
  const current = off.find((p) => p.begin <= nowClock && nowClock < p.end)
  if (current) return "Зараз за графіком без світла до " + current.end
  const next = off.find((p) => p.begin > nowClock)
  return next ? "Наступне відключення — о " + next.begin : "Більше відключень сьогодні немає"
}

function robotIcon() {
  return '<svg class="robot" viewBox="0 0 115 116" aria-hidden="true">' +
    '<defs><linearGradient id="robotShell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#efffff"/><stop offset="1" stop-color="#78a5c3"/></linearGradient></defs>' +
    '<path d="M58 24V15" stroke="#76eaff" stroke-width="5" stroke-linecap="round"/><circle cx="58" cy="12" r="6" fill="#72e2ff"/>' +
    '<rect x="14" y="26" width="88" height="76" rx="31" fill="url(#robotShell)" stroke="#79e9ff" stroke-width="3"/>' +
    '<rect x="24" y="39" width="68" height="43" rx="17" fill="#061322"/>' +
    '<path d="M38 56q6-9 12 0M67 56q6-9 12 0" stroke="#7ceeff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M48 68q10 10 21 0" stroke="#7ceeff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M55 84l-6 11h9l-3 9 15-16h-9l5-8" fill="#ffe660"/>' +
    '</svg>'
}

export function buildCardHtml({ schedule, date, label, update, source, weather = null, now = new Date() }) {
  const { withPower, withoutPower } = calculateDailyTotals(schedule)
  const outagePeriods = schedule.filter((p) => !p.power)
  const allPeriods = schedule.map((p) => {
    return '<div class="period ' + (p.power ? "on" : "off") + '"><span class="period-time">' +
      escape(p.begin) + ' — ' + escape(p.end) + '</span><span class="period-kind">' +
      (p.power ? "є світло" : "немає світла") + '</span></div>'
  })
  const visiblePeriods = allPeriods.length > 6
    ? allPeriods.slice(0, 5).join("") + '<div class="period">Ще ' + (allPeriods.length - 5) + ' періодів — у підписі</div>'
    : allPeriods.join("")
  const outageRows = outagePeriods.slice(0, 4).map((p) => {
    return '<div class="outage-row"><span class="power-icon"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5v15" stroke="#ff6677" stroke-width="5" stroke-linecap="round"/><path d="M11 12a14 14 0 1 0 18 0" stroke="#ff6677" stroke-width="5" stroke-linecap="round" fill="none"/></svg></span><strong>' +
      escape(p.begin) + ' — ' + escape(p.end) + '</strong><em>' +
      escape(formatDuration(minutes(p.end) - minutes(p.begin))) + '</em></div>'
  }).join("")
  const remaining = outagePeriods.length > 4
    ? '<div class="more">І ще ' + (outagePeriods.length - 4) + ' відключень — у підписі</div>' : ""
  const status = nearestEvent(schedule, date, now)
  const sourceLabel = source === "ДТЕК" ? "ДТЕК · офіційні дані" : "ДТЕК · резервні дані"
  const percentOn = (withPower / 14.4).toFixed(1).replace(".", ",")
  const percentOff = (withoutPower / 14.4).toFixed(1).replace(".", ",")
  const dateLabel = label === "завтра" ? "ЗАВТРА" : "СЬОГОДНІ"
  const css = [
    '*{box-sizing:border-box}html,body{margin:0;width:920px;height:auto;overflow:visible}',
    'body{font-family:Arial,"DejaVu Sans",sans-serif;color:#fff;background:#01150e}',
    '.card{width:900px;height:auto;margin:10px;padding:22px;border:3px solid #43f37c;',
    'border-radius:32px;background:radial-gradient(circle at 50% 35%,#103529 0%,#051b16 59%,#00120c 100%);',
    'box-shadow:0 0 16px #135a35;overflow:hidden}',
    '.header{height:101px;display:flex;align-items:center;justify-content:space-between;',
    'gap:12px;border-bottom:2px solid #31be68;padding-bottom:8px}',
    '.header-left{display:flex;align-items:center;min-width:0;gap:11px;flex:1}',
    '.robot{height:82px;width:83px;flex-shrink:0;filter:drop-shadow(0 0 11px #3acff8)}',
    '.smallbrand{font-size:17px;font-weight:800;color:#b8d2bf;letter-spacing:1px;white-space:nowrap}',
    '.brand{font-size:47px;font-weight:900;font-style:italic;color:#f1fff8;white-space:nowrap;',
    'text-shadow:0 0 14px #28d96e}',
    '.brand b{color:#75ff83}',
    '.version{display:inline-block;font-size:28px;font-style:italic;color:#d9ffbf;',
    'border:2px solid #b5fb7e;border-radius:14px;padding:2px 7px;vertical-align:middle;',
    'margin-left:8px;text-shadow:0 0 7px #4dae5d}',
    '.header-place{width:186px;border-left:2px solid #5fa66b;padding-left:13px;',
    'color:#d4efdc;font-size:17px;line-height:1.26;text-align:left}',
    '.header-place b{color:#ddffb6;font-size:19px}',
    '.date{margin:14px 0 7px;padding:10px 12px;border:2px solid #42ee7a;border-radius:34px;',
    'font-size:27px;font-weight:900;text-align:center;background:#06291e;',
    'box-shadow:inset 0 0 8px #0b5733}',
    '.sub{text-align:center;font-size:21px;font-style:italic;color:#d7f4dc;margin:7px 0 6px}',
    '.power-layout{display:grid;grid-template-columns:330px minmax(0,1fr);gap:13px}',
    '.power-left{display:flex;flex-direction:column;min-width:0}',
    '.dial{width:330px;height:330px}.dial svg{width:100%;height:100%;display:block}',
    '.power-right{min-width:0}',
    '.power-overview{display:grid;grid-template-columns:235px minmax(0,1fr);gap:8px}',
    '.metrics-col{display:flex;flex-direction:column;gap:8px}',
    '.metric{min-height:93px;border:2px solid;border-radius:16px;padding:10px 8px;',
    'text-align:center;background:#061d18}',
    '.metric.on{border-color:#37ee77;box-shadow:inset 0 0 12px #0e7139}',
    '.metric.off{border-color:#ff5b6d;box-shadow:inset 0 0 12px #70313d}',
    '.metric .name{font-size:22px;font-weight:800;line-height:1.1}',
    '.metric .value{font-size:31px;font-weight:900;white-space:nowrap;line-height:1.3}',
    '.metric.on .value{color:#86ff92}.metric.off .value{color:#ffabb4}',
    '.metric .pct{font-size:18px;color:#dce7dd}',
    '.periods{display:flex;flex-direction:column;gap:5px;min-width:0}',
    '.period{min-height:28px;padding:3px 7px;display:flex;align-items:center;',
    'justify-content:space-between;gap:4px;background:#06231a;border-radius:9px;',
    'border-left:8px solid #3bf182;font-size:17px;white-space:nowrap}',
    '.period.off{border-left-color:#ff5970;background:#391923}',
    '.period-kind{font-size:13px;color:#ddece3}',
    '.timeline-box{margin-top:8px;padding:11px 13px 9px;border:2px solid #33d875;',
    'border-radius:17px;background:#05241a}',
    '.secttitle{font-size:23px;font-weight:900;margin:0 0 7px}',
    '.timeline{display:flex;overflow:hidden;height:23px;border-radius:16px;',
    'box-shadow:0 0 10px #25734d}',
    '.timeline span{height:23px;display:block;flex-shrink:0}',
    '.timeline-labels{display:flex;justify-content:space-between;font-size:15px;',
    'color:#e4f6e8;margin-top:6px}',
    '.outages{margin-top:8px;padding:10px 12px;border:2px solid #268354;',
    'border-radius:16px;background:#041d17}',
    '.outage-row{display:flex;align-items:center;gap:10px;min-height:37px;',
    'background:linear-gradient(90deg,#501327,#1b111a);',
    'border:1px solid #de4964;border-radius:9px;padding:2px 8px;margin:5px 0}',
    '.outage-row strong{font-size:23px;flex:1;white-space:nowrap}',
    '.outage-row em{font-size:16px;font-style:normal;color:#f1eeed;white-space:nowrap}',
    '.power-icon{display:inline-flex;width:27px;height:27px;flex:0 0 27px}',
    '.power-icon svg{display:block;width:27px;height:27px}',
    '.more{font-size:16px;color:#cce0d1}',
    '.next{margin-top:8px;padding:15px 10px;min-height:88px;',
    'border:2px solid #f8db4e;border-radius:17px;background:#24301a;',
    'box-shadow:inset 0 0 15px #51521d;color:#ffe76e;',
    'font-size:23px;font-weight:900;text-align:center;line-height:1.2;',
    'display:flex;align-items:center;justify-content:center}',
    '.footer{margin-top:13px;padding:13px 8px 4px;border-top:1px solid #36a66c;',
    'display:flex;justify-content:space-between;font-size:17px;color:#c5e4d1;gap:8px}',
    '.signature{text-align:center;font-size:21px;font-style:italic;color:#90ed9a;',
    'letter-spacing:3px;padding-top:10px;text-shadow:0 0 9px #116d38}',
    WEATHER_CSS,
  ].join("")
  const content = '<div class="card"><header class="header"><div class="header-left">' + robotIcon() +
    '<div><div class="smallbrand">СТ «ХІМІК» · ЕЛЕКТРОПОСТАЧАННЯ</div>' +
    '<div class="brand">ϟ СВІТЛО<b>ПУЛЬС</b><span class="version">2.1</span></div></div></div>' +
    '<div class="header-place"><b>📍 СТ «Хімік»</b><div>Фастівський район<br>Київська область</div></div></header>' +
    '<div class="date">' + dateLabel + ' · ' + escape(formatDate(date)) + ' · ' + escape(weekday(date)) + '</div>' +
    '<div class="sub">Ритм електропостачання · графік на 24 години</div>' +
    '<main class="power-layout"><div class="power-left"><div class="dial">' + buildDial(schedule) + '</div>' +
    '<div class="next">⚡ ' + escape(status) + '</div></div>' +
    '<div class="power-right"><div class="power-overview"><div class="metrics-col">' +
    '<div class="metric on"><div class="name">💡 Зі світлом</div><div class="value">' +
    escape(formatDuration(withPower)) + '</div><div class="pct">' + percentOn + '% доби</div></div>' +
    '<div class="metric off"><div class="name">◉ Без світла</div><div class="value">' +
    escape(formatDuration(withoutPower)) + '</div><div class="pct">' + percentOff + '% доби</div></div>' +
    '</div><div class="periods">' + visiblePeriods + '</div></div>' +
    '<section class="timeline-box"><div class="secttitle">▰ Графік доби · 24 години</div>' +
    buildTimeline(schedule) + '</section>' +
    '<section class="outages"><div class="secttitle">◷ Періоди відключень</div>' +
    (outageRows || '<div class="outage-row">Відключень не заплановано</div>') + remaining +
    '</section></div></main>' +
    renderWeatherPanel(weather, date, label) +
    '<footer class="footer"><span>📡 ' + escape(sourceLabel) +
    '</span><span>Дані: ' + escape(update) + '</span></footer>' +
    '<div class="signature">⚡ СВІТЛОПУЛЬС 2.1 · СТ «ХІМІК»</div></div>'
  return '<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>' + css +
    '</style></head><body>' + content + '</body></html>'
}

export async function renderCardPng(details) {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: SIZE, height: 800 },
      deviceScaleFactor: 1,
    })
    await page.setContent(buildCardHtml(details), { waitUntil: "load" })
    const png = await page.screenshot({ type: "png", fullPage: true })
    if (png.length < 2000) throw Error("Empty card image")
    return png
  } finally {
    await browser.close()
  }
}
