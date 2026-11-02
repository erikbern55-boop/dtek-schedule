import { calculateDailyTotals, formatDuration } from "./summary.js"

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

export function buildCardHtml({ schedule, date, label, update, source, now = new Date() }) {
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
    return '<div class="outage-row"><span class="power-icon">⏻</span><strong>' +
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
    '*{box-sizing:border-box}html,body{margin:0;width:920px;height:1360px;overflow:hidden}',
    'body{font-family:Arial,"DejaVu Sans",sans-serif;background:#011610;color:white}',
    '.card{width:900px;height:1340px;margin:10px;padding:30px;border:3px solid #39e37d;border-radius:34px;',
    'background:radial-gradient(circle at 50% 40%,#14392d 0%,#031a15 60%,#00120f 100%);overflow:hidden}',
    '.header{height:111px;display:flex;align-items:center;gap:14px;border-bottom:2px solid #1fac64}',
    '.robot{width:101px;height:103px;filter:drop-shadow(0 0 12px #3edbfb)}',
    '.brand{font-size:55px;font-weight:900;font-style:italic;letter-spacing:1px;text-shadow:0 0 18px #28d96e}',
    '.brand b{color:#7aff90}.smallbrand{font-size:18px;font-weight:700;color:#9ad5b2;letter-spacing:1.3px}',
    '.date{margin:18px 0 10px;border:2px solid #31e57e;border-radius:35px;background:#09281d;',
    'padding:12px;text-align:center;font-size:27px;font-weight:800}',
    '.sub{text-align:center;font-style:italic;font-size:22px;color:#cefbd8;margin-bottom:6px}',
    '.dashboard{height:506px;display:flex;gap:7px}.dial{width:514px;flex-shrink:0}',
    '.right{width:312px;display:flex;flex-direction:column;gap:10px;padding-top:24px}',
    '.metric{border:2px solid;border-radius:21px;padding:15px 13px 12px 16px;text-align:center;',
    'background:#071a19}.metric.on{border-color:#3afa83;box-shadow:inset 0 0 14px #176d39}',
    '.metric.off{border-color:#ff5264;box-shadow:inset 0 0 14px #612635}',
    '.metric .name{font-size:24px;font-weight:700}.metric .value{font-size:39px;font-weight:900;white-space:nowrap}',
    '.metric.on .value{color:#7aff8c}.metric.off .value{color:#ffa2aa}',
    '.metric .pct{font-size:20px;color:#cbded5}',
    '.periods{display:flex;flex-direction:column;gap:5px}.period{height:32px;',
    'display:flex;align-items:center;justify-content:space-between;gap:8px;background:#071d18;',
    'border-radius:10px;padding:2px 9px;border-left:9px solid #35ee74;font-size:19px}',
    '.period.off{border-color:#ff5362;background:#29121b}.period-kind{font-size:16px;color:#c9d7d1}',
    '.timeline-box{margin:7px 0 20px;border:2px solid #3de480;padding:17px 25px 14px;border-radius:22px;',
    'background:#08251d}.secttitle{font-size:27px;font-weight:900;margin-bottom:12px}',
    '.timeline{display:flex;overflow:hidden;height:31px;border-radius:17px;box-shadow:0 0 14px #367a49}',
    '.timeline span{height:31px;display:block;flex-shrink:0}',
    '.timeline-labels{display:flex;justify-content:space-between;font-size:18px;color:#e4f6ea;margin-top:10px}',
    '.outages{min-height:250px;padding:18px 20px;border:2px solid #248b63;border-radius:24px;',
    'background:#051f19}.outage-row{display:flex;align-items:center;gap:19px;padding:11px 18px;margin:8px 0;',
    'background:linear-gradient(90deg,#4a1223,#1b111a);border-radius:12px;border:1px solid #e44862}',
    '.outage-row strong{font-size:32px;flex:1}.outage-row em{font-size:20px;font-style:normal;',
    'color:#f6eeee}.power-icon{font-size:33px;color:#ff5b6f}',
    '.more{font-size:19px;color:#ced8d2;padding:5px}.next{margin:14px 1px 0;',
    'border:2px solid #f7d553;border-radius:16px;background:#26291a;padding:14px;',
    'color:#ffe76c;font-size:26px;font-weight:800;text-align:center}',
    '.footer{margin-top:16px;font-size:19px;display:flex;justify-content:space-between;',
    'border-top:1px solid #3baa77;padding:14px 7px;color:#c2e5d1}',
    '.signature{text-align:center;color:#70dc93;letter-spacing:5px;font-size:18px;padding-top:12px}',
  ].join("")
  const content = '<div class="card"><header class="header">' + robotIcon() +
    '<div><div class="smallbrand">СТ «ХІМІК» · ЕЛЕКТРОПОСТАЧАННЯ</div><div class="brand">ϟ СВІТЛО<b>ПУЛЬС</b></div></div></header>' +
    '<div class="date">' + dateLabel + ' · ' + escape(formatDate(date)) + ' · ' + escape(weekday(date)) + '</div>' +
    '<div class="sub">Ритм електропостачання · графік на 24 години</div>' +
    '<main class="dashboard"><div class="dial">' + buildDial(schedule) + '</div>' +
    '<div class="right"><div class="metric on"><div class="name">💡 Зі світлом</div><div class="value">' +
    escape(formatDuration(withPower)) + '</div><div class="pct">' + percentOn + '% доби</div></div>' +
    '<div class="metric off"><div class="name">◉ Без світла</div><div class="value">' +
    escape(formatDuration(withoutPower)) + '</div><div class="pct">' + percentOff + '% доби</div></div>' +
    '<div class="periods">' + visiblePeriods + '</div></div></main>' +
    '<section class="timeline-box"><div class="secttitle">▰ Графік доби · 24 години</div>' +
    buildTimeline(schedule) + '</section>' +
    '<section class="outages"><div class="secttitle">◷ Періоди відключень</div>' +
    (outageRows || '<div class="outage-row">Відключень не заплановано</div>') + remaining +
    '<div class="next">⚡ ' + escape(status) + '</div></section>' +
    '<footer class="footer"><span>📡 ' + escape(sourceLabel) +
    '</span><span>Дані: ' + escape(update) + '</span></footer>' +
    '<div class="signature">СВІТЛОПУЛЬС · СТ «ХІМІК»</div></div>'
  return '<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>' + css +
    '</style></head><body>' + content + '</body></html>'
}

export async function renderCardPng(details) {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: SIZE, height: 1360 },
      deviceScaleFactor: 1,
    })
    await page.setContent(buildCardHtml(details), { waitUntil: "load" })
    const png = await page.screenshot({ type: "png" })
    if (png.length < 2000) throw Error("Empty card image")
    return png
  } finally {
    await browser.close()
  }
}
