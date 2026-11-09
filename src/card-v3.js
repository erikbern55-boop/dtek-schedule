// Independent Svitlopuls 3 renderer. No production switch until visual approval.
import { calculateDailyTotals, formatDuration } from "./summary.js"
import { buildDial, buildTimeline, nearestEvent } from "./card.js"
import { renderWeatherPanel, WEATHER_CSS } from "./weather-card.js"

const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
const kyivTime = value => new Intl.DateTimeFormat("uk-UA",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit"}).format(value)
const displayDate = date => date.split("-").reverse().join(".")
const css = [
  "*{box-sizing:border-box}",
  "html,body{width:1404px;margin:0;background:#020e08;color:#f0fff3;font-family:Arial,sans-serif}",
  ".v3{width:1404px;padding:22px 26px 18px;background:radial-gradient(ellipse at 50% 10%,#083b20,#020e08 76%)}",
  ".v3-head{display:grid;grid-template-columns:245px 1fr 230px;align-items:center;gap:14px;min-height:112px}",
  ".v3-place{font-size:20px;line-height:1.4}.v3-place strong{display:block;font-size:28px;color:#caff9b}",
  ".v3-brand{text-align:center}.v3-brand strong{display:block;font-size:62px;letter-spacing:1px;color:#b4ffad;text-shadow:0 0 20px #3df55a}",
  ".v3-brand small{display:block;font-size:15px;color:#c9e5d1}",
  ".v3-tag{text-align:center;font-size:22px;font-weight:bold;line-height:1.3}",
  ".v3-row{display:grid;gap:14px;margin-top:14px;align-items:stretch}",
  ".v3-power{grid-template-columns:1.34fr .91fr 1.03fr}",
  ".v3-panel,.v3 .wx-box,.v3-sources,.v3-footer{border:3px solid #4dfd63;border-radius:24px;background:radial-gradient(ellipse at 50% 50%,#0b4b2b,#02190f 85%);box-shadow:inset 0 0 18px #0d7837,0 0 12px #158c35;padding:15px}",
  ".v3-power>.v3-panel{height:310px;overflow:hidden}",
  ".v3-date{text-align:center;font-size:24px;font-weight:bold}.v3-date b{display:block;font-size:30px;margin:5px}",
  ".v3-dial{width:260px;height:245px;margin:-5px auto 0}.v3-dial svg{width:100%;height:100%}",
  ".v3-title{font-size:28px;text-align:center;font-weight:900;margin:0 0 14px}",
  ".v3-count{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}",
  ".v3-count .v3-clock{font-size:72px;color:#a6ff9c;font-weight:900;text-shadow:0 0 12px #20a34c}",
  ".v3-count .v3-next{font-size:21px;line-height:1.3;margin-top:14px}",
  ".v3-periods{display:flex;flex-direction:column;gap:6px;max-height:160px;overflow:auto}",
  ".v3-period{display:flex;justify-content:space-between;gap:8px;border:2px solid #54ec78;border-radius:15px;padding:7px 10px;font-size:18px;background:#08472a}",
  ".v3-period.off{background:#4d1b24;border-color:#ff6977}",
  ".v3-totals{display:flex;justify-content:space-between;font-size:16px;margin-top:12px}",
  ".v3-timeline{margin-top:12px}.v3-timeline .timeline{height:24px;display:flex;overflow:hidden;border-radius:20px}",
  ".v3-timeline .timeline span{display:block;height:24px}",
  ".v3-timeline .timeline-labels{display:flex;justify-content:space-between;font-size:14px}",
  ".v3-weather .weather-zone{margin:0;padding:0;border:0;background:transparent}",
  ".v3-weather .weather-title{display:none}",
  ".v3-weather .wx-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}",
  ".v3-weather .weather-air{grid-column:1/7;grid-row:1}",
  ".v3-weather .weather-sun{grid-column:7/10;grid-row:1}",
  ".v3-weather .weather-soil{grid-column:10/13;grid-row:1}",
  ".v3-weather .weather-garden{grid-column:1/9;grid-row:2}",
  ".v3-weather .wx-sowing-panel{grid-column:9/13;grid-row:2}",
  ".v3-weather .weather-moon{grid-column:1/6;grid-row:3}",
  ".v3-weather .weather-astro{grid-column:6/13;grid-row:3}",
  ".v3-weather .wx-box{min-width:0;padding:16px}",
  ".v3-weather .wx-box h3{font-size:27px;margin:0 0 12px}",
  ".v3-weather .weather-air,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:260px}",
  ".v3-weather .weather-garden,.v3-weather .wx-sowing-panel{min-height:280px}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{min-height:210px}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px}",
  ".v3-weather .wx-sun-pair,.v3-weather .wx-soil-pair{display:flex;flex-direction:column;gap:14px;align-items:center}",
  ".v3-weather .wx-sun-pair b{font-size:29px}.v3-weather .wx-soil-pair strong{font-size:58px}",
  ".v3-weather .wx-garden-art{font-size:74px;min-width:120px}",
  ".v3-weather .wx-garden-copy{font-size:21px}",
  ".v3-weather .wx-credit{font-size:13px;line-height:1.3;margin-top:10px}",
  ".v3-sources{display:grid;grid-template-columns:1.35fr repeat(5,1fr);gap:10px;font-size:16px;margin-top:14px}",
  ".v3-sources span{border-left:1px solid #58b979;padding-left:9px}",
  ".v3-footer{margin-top:14px;display:flex;justify-content:space-between;font-size:16px;padding:12px 18px}",
  WEATHER_CSS,
  // Keep the new renderer's layout rules after shared weather styles.
  ".v3-weather .wx-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}",
  ".v3-weather .weather-air{grid-column:1/7;grid-row:1}",
  ".v3-weather .weather-sun{grid-column:7/10;grid-row:1}",
  ".v3-weather .weather-soil{grid-column:10/13;grid-row:1}",
  ".v3-weather .weather-garden{grid-column:1/9;grid-row:2}",
  ".v3-weather .wx-sowing-panel{grid-column:9/13;grid-row:2}",
  ".v3-weather .weather-moon{grid-column:1/6;grid-row:3}",
  ".v3-weather .weather-astro{grid-column:6/13;grid-row:3}",
  ".v3-weather .wx-box{border:3px solid #4dfd63;border-radius:24px;background:radial-gradient(ellipse,#0b4b2b,#02190f 85%);padding:16px;min-width:0}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px}",
  ".v3-weather .wx-sun-pair,.v3-weather .wx-soil-pair{display:flex;flex-direction:column;align-items:center;gap:14px}",
].join("\n")

export function buildCardV3Html({schedule,date,label="сьогодні",source="ДТЕК",update="—",weather=null,now=new Date()}) {
  if (!Array.isArray(schedule) || !date) throw Error("Schedule and date required")
  const {withPower,withoutPower}=calculateDailyTotals(schedule)
  const periods=schedule.map(p=>'<div class="v3-period'+(p.power?'':' off')+'"><span>'+ (p.power?'⚡ Світло':'🔴 Без світла') +'</span><b>'+esc(p.begin)+' — '+esc(p.end)+'</b></div>').join("")
  const next=nearestEvent(schedule,date,now)
  const html='<article class="v3">'+
    '<header class="v3-head"><div class="v3-place"><strong>СТ «Хімік»</strong>Боярська ТГ · Фастівський район</div>'+
    '<div class="v3-brand"><strong>⚡ СВІТЛОПУЛЬС 3.0</strong><small>Електропостачання · Погода · Город · Місяць · Астропрогноз</small></div>'+
    '<div class="v3-tag">🌿 Все в одному<br>для комфортного життя в СТ</div></header>'+
    '<main class="v3-row v3-power">'+
    '<section class="v3-panel"><div class="v3-date">📅 '+(label==="завтра"?"Завтра":"Сьогодні")+'<b>'+esc(displayDate(date))+'</b></div><div class="v3-dial">'+buildDial(schedule)+'</div></section>'+
    '<section class="v3-panel v3-count"><h2 class="v3-title">⏳ До наступної зміни</h2><div class="v3-clock">'+esc(kyivTime(now))+'</div><div class="v3-next">'+esc(next)+'</div></section>'+
    '<section class="v3-panel"><h2 class="v3-title">💡 Графік '+(label==="завтра"?"завтра":"сьогодні")+'</h2><div class="v3-periods">'+periods+'</div><div class="v3-totals"><span>⚡ '+esc(formatDuration(withPower))+'</span><span>🔴 '+esc(formatDuration(withoutPower))+'</span></div><div class="v3-timeline">'+buildTimeline(schedule)+'</div></section></main>'+
    '<div class="v3-weather">'+renderWeatherPanel(weather,date,label)+'</div>'+
    '<section class="v3-sources"><b>▱ Джерела та методика</b><span>⚡ ДТЕК · графіки</span><span>☁ Open-Meteo · погода</span><span>🌱 Поради · локальні правила</span><span>🌙 Місяць · розрахунок</span><span>✨ Астрологія · розвага</span></section>'+
    '<footer class="v3-footer"><span>Дані: '+esc(update)+'</span><span>Графіки · 5 хв</span><span>Погода · 30 хв</span><span>Джерело: '+esc(source)+'</span></footer></article>'
  return '<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>'+css+'</style></head><body>'+html+'</body></html>'
}

export async function renderCardV3Png(details) {
  const {chromium}=await import("playwright")
  const browser=await chromium.launch({headless:true})
  try {
    const page=await browser.newPage({viewport:{width:1404,height:900},deviceScaleFactor:1})
    await page.setContent(buildCardV3Html(details),{waitUntil:"load"})
    const png=await page.screenshot({type:"png",fullPage:true})
    if(png.length<2000)throw Error("Empty V3 card image")
    return png
  }finally{await browser.close()}
}
