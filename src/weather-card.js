import { gardenTip, sowingAdvice } from "./garden.js"
import { lunarForDate } from "./moon.js"
import { astroForMoon, moonDiscSvg } from "./astro.js"

const esc = x => String(x ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
const temp = x => Number.isFinite(x) ? (Math.round(x)>0?"+":"") + Math.round(x)+"°C" : "—"
const val = (x,unit) => Number.isFinite(x) ? Math.round(x)+unit : "—"
// Contextual icons are derived from today's actual recommendation text.
// Prioritize specific crops before general weather or gardening actions.
const adviceIcons = text => {
  const rules = [
    [/часник|часнику|часником/iu,"🧄"], [/цибул/iu,"🧅"], [/моркв/iu,"🥕"],
    [/картопл/iu,"🥔"], [/томат|помідор/iu,"🍅"], [/огір/iu,"🥒"],
    [/перець/iu,"🫑"], [/капуст|салат|шпинат/iu,"🥬"],
    [/горох|квасол/iu,"🌱"], [/кріп|петрушк|зелен|мікрозелен|насін|посів|сіяти|розсад/iu,"🌱"],
    [/замороз|мороз|холод|сніг|укрит|агроволокн|накрий|прикрий/iu,"❄️"],
    [/дощ|волог|полив|дренаж|шланг/iu,"💧"],
    [/дерев|гілк|стовбур|саджанц|кущ/iu,"🌳"],
    [/теплиц/iu,"🏡"], [/ґрунт|грядк|мульч|бур.ян/iu,"🌿"],
    [/інструмент|інвентар|кріплен|підв.язк/iu,"🛠️"],
    [/планув|сівозмін|календар/iu,"📋"]
  ]
  const found = rules.find(([pattern]) => pattern.test(String(text)))
  return (found ? found[1] : "🌿") + " " + String(text)
}

function condition(code) {
  if (code === 0) return ["☀️","Ясно"]
  if ([1,2].includes(code)) return ["🌤","Мінлива хмарність"]
  if (code === 3) return ["☁️","Хмарно"]
  if ([45,48].includes(code)) return ["🌫","Туман"]
  if ([51,53,55,56,57].includes(code)) return ["🌦","Мряка"]
  if ([61,63,65,66,67,80,81,82].includes(code)) return ["🌧","Дощ"]
  if ([71,73,75,77,85,86].includes(code)) return ["❄️","Сніг"]
  if ([95,96,99].includes(code)) return ["⛈","Гроза"]
  return ["☁️","Прогноз недоступний"]
}

// Two genuinely wide columns, two stacked rows, rather than four narrow
// columns. All blocks are live HTML, not a static picture with fake readings.
export const WEATHER_CSS = [
  '.weather-zone{margin-top:14px;padding:17px;border:2px solid #44ef7b;',
  'border-radius:27px;background:linear-gradient(145deg,#062e21,#00160e);',
  'box-shadow:inset 0 0 18px #063d26,0 0 14px #09592e}',
  '.weather-title{display:flex;align-items:center;justify-content:space-between;',
  'border-bottom:2px solid #2bb46b;padding:0 3px 13px;gap:12px}',
  '.weather-title strong{font-size:35px;color:#e1ffe8;',
  'text-shadow:0 0 8px #2ba965;white-space:nowrap}',
  '.weather-title span{font-size:16px;color:#b4dcc3;text-align:right}',
  '.wx-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);',
  'gap:12px;margin-top:13px}',
  '.wx-box{min-width:0;border:2px solid #31e27f;border-radius:21px;',
  'padding:16px 15px;background:radial-gradient(circle at 10% 100%,#12432b,#032318 72%);',
  'box-shadow:inset 0 0 12px #075632;overflow:hidden}',
  '.wx-box h3{font-size:25px;font-weight:900;margin:0 0 12px;',
  'padding-bottom:10px;border-bottom:1px solid #389e70;line-height:1.14}',
  '.wx-warning{background:#f5d637;color:#142312;display:inline-block;',
  'border-radius:11px;padding:8px 12px;margin-bottom:12px;font-size:20px;',
  'font-weight:900;max-width:100%;line-height:1.22}',
  '.wx-warning.neutral{background:#175639;color:#d4f8dd;border:1px solid #398a5a}',
  '.wx-weather-main{display:flex;align-items:center;gap:13px;margin:3px 0 10px}',
  '.wx-symbol{font-size:68px;line-height:1}',
  '.wx-now-label{font-size:19px;color:#d2ffde;font-weight:800}',
  '.wx-now{font-size:55px;font-weight:900;white-space:nowrap;line-height:1.05}',
  '.wx-now-at{font-size:15px;color:#acd5bc;margin-top:4px}',
  '.wx-today-box{border:1px solid #48ad72;border-radius:12px;',
  'background:#0d422d;padding:10px 11px;margin:13px 0 8px}',
  '.wx-today-heading{font-size:20px;font-weight:900;color:#d0ffb9;margin-bottom:8px}',
  '.wx-today-box .wx-forecast-values div{background:#062d1c}',
  '.wx-forecast-box{border:1px solid #c9b24b;border-radius:12px;',
  'background:#0c3c2b;padding:9px 10px;margin:12px 0}',
  '.wx-forecast-heading{font-size:19px;font-weight:900;color:#edffb1;margin-bottom:8px}',
  '.wx-forecast-values{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
  '.wx-forecast-values div{border-radius:9px;background:#082d20;padding:7px 5px;',
  'font-size:17px;text-align:center;color:#dcf5e5}',
  '.wx-forecast-values b{display:block;font-size:29px;color:white;white-space:nowrap}',
  '.wx-cond{font-size:21px;color:#dcefe6;line-height:1.25}',
  '.wx-facts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px}',
  '.wx-fact{background:#0c422d;border:1px solid #24764d;border-radius:11px;',
  'padding:8px 10px;font-size:18px;line-height:1.3;color:#e9ffef}',
  '.wx-fact.wide{grid-column:1/-1}',
  '.wx-fact b{font-size:22px;color:white}',
  '.wx-right-stack{min-width:0;display:flex;flex-direction:column;gap:11px}',
  '.wx-right-stack .wx-box{flex:none;min-width:0}',
  '.wx-right-stack .weather-garden{flex:none;display:flex;flex-direction:column}',
  '.wx-right-stack .weather-soil{flex:none}',
  '.wx-right-stack .wx-box h3{font-size:23px;margin-bottom:9px}',
  '.wx-right-stack .wx-garden-body{gap:10px;flex:none;align-items:center}',
  '.wx-right-stack .wx-garden-art{font-size:66px;min-width:78px;min-height:110px;padding:12px 0}',
  '.wx-right-stack .wx-garden-heading{font-size:21px;margin-bottom:8px}',
  '.wx-right-stack .wx-garden-copy{font-size:19px;line-height:1.3}',
  '.wx-right-stack .wx-soil-icon{font-size:32px;margin:0}',
  '.wx-right-stack .wx-soil-number{font-size:37px}',
  '.wx-right-stack .wx-caption{font-size:15px}',
  '.wx-right-stack .wx-sun-label{font-size:16px}',
  '.wx-right-stack .wx-sun-time{font-size:32px;margin:2px 0 4px}',
  '.wx-right-stack .wx-sun-divider{margin:5px 0}',
  '.wx-right-stack .weather-soil{padding:9px 12px;border-radius:14px}',
  '.wx-right-stack .weather-soil h3{font-size:17px;margin-bottom:5px;padding-bottom:5px}',
  '.wx-right-stack .wx-soil-sun{grid-template-columns:1fr 1.35fr;gap:8px;align-items:center}',
  '.wx-right-stack .wx-soil-icon{display:none}',
  '.wx-right-stack .wx-soil-number{font-size:28px}',
  '.wx-right-stack .wx-caption{font-size:11px;line-height:1.15}',
  '.wx-right-stack .wx-half+.wx-half{padding-left:8px}',
  '.wx-right-stack .wx-sun-label{font-size:12px}',
  '.wx-right-stack .wx-sun-time{font-size:23px;margin:0}',
  '.wx-right-stack .wx-sun-divider{margin:3px 0}',
  '.wx-moon-disc{width:123px;height:123px;display:block;filter:drop-shadow(0 0 9px #4d7f8c)}',
  '.wx-astro{border-color:#9c81ec;background:linear-gradient(135deg,#112d2f,#16112f 95%);',
  'box-shadow:inset 0 0 16px #29204f,0 0 10px #35266c}',
  '.wx-astro h3{border-bottom-color:#7465b4}',
  '.wx-astro-tag{color:#ffd85b;font-weight:900;font-size:20px;margin:-2px 0 9px}',
  '.wx-astro-body{display:flex;gap:13px;align-items:flex-start}',
  '.wx-astro-symbol{flex:0 0 105px;width:105px;height:105px;border-radius:50%;',
  'border:2px solid #ae9bea;background:radial-gradient(circle,#262052,#0e1e2b);',
  'font-size:66px;color:#d8c0ff;display:flex;align-items:center;justify-content:center;',
  'text-shadow:0 0 15px #a063f7;box-shadow:0 0 18px #6e4497}',
  '.wx-astro-copy{font-size:20px;line-height:1.32;color:#f5f4ff}',
  '.wx-astro-copy b{color:#ffe36c;display:block;margin-bottom:7px;font-size:23px}',
  '.wx-astro-disclaimer{border-top:1px solid #7c6db6;padding-top:9px;margin-top:14px;',
  'font-size:16px;color:#dfd6ef;text-align:center;font-style:italic}',
  '.wx-fact.gust{background:#0b3c2c}',
  '.wx-fact.windline{display:flex;align-items:center;justify-content:space-between;',
  'gap:8px;min-height:36px;font-size:17px;white-space:nowrap}',
  '.wx-fact.windline b{flex-shrink:0;white-space:nowrap;font-size:21px}',
  '.wx-facts{margin-top:8px;margin-bottom:11px}',
  '.wx-fact{font-size:17px;padding:7px 8px}',
  '.wx-fact b{font-size:20px}',
  '.wx-forecast-box{margin-top:9px;margin-bottom:0}',
  '.wx-soil-sun{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
  '.wx-half{min-width:0}',
  '.wx-half+.wx-half{border-left:2px solid #25794e;padding-left:12px}',
  '.wx-soil-icon{font-size:48px;line-height:1.15;margin:4px 0}',
  '.wx-soil-number{font-size:51px;font-weight:900;color:#f4fff7;white-space:nowrap}',
  '.wx-caption{font-size:17px;color:#b9e3cb;line-height:1.34}',
  '.wx-sun-label{font-size:18px;color:#d8f4dd}',
  '.wx-sun-time{font-size:40px;font-weight:900;color:white;margin:3px 0 8px}',
  '.wx-sun-divider{border-top:1px solid #2a7853;margin:9px 0}',
  '.wx-moon-main{display:flex;gap:18px;align-items:center;margin:5px 0 12px}',
  '.wx-moon-icon{font-size:105px;line-height:1.07;min-width:125px;text-align:center}',
  '.wx-moon-number{font-size:46px;font-weight:900;color:#e8ffc4;white-space:nowrap}',
  '.wx-moon-note{font-size:18px;color:#d9f6e3;line-height:1.33}',
  '.wx-moon-rows{border-top:1px solid #3d9f6a}',
  '.wx-moon-row{font-size:21px;padding:7px 1px;border-bottom:1px solid #245e44;',
  'display:flex;justify-content:space-between;gap:9px;line-height:1.3}',
  '.wx-moon-row b{color:#fafffc;text-align:right}',
  '.wx-garden-body{display:flex;gap:14px;align-items:flex-start}',
  '.wx-garden-art{font-size:95px;line-height:1.05;min-width:120px;',
  'text-align:center;background:radial-gradient(circle,#1c5b31,#08261a 72%);',
  'border-radius:18px;padding:14px 0;min-height:165px}',
  '.wx-garden-copy{font-size:22px;line-height:1.35;min-width:0}',
  '.wx-garden-heading{font-size:22px;color:#edec5d;font-weight:900;',
  'margin:0 0 12px;line-height:1.25}',
  '.wx-sowing{margin-top:12px;display:flex;flex-direction:column;gap:8px}',
  '.wx-sowing-row{border:1px solid #397d57;border-radius:12px;padding:9px 11px;',
  'font-size:17px;line-height:1.32;background:#092d20}',
  '.wx-sowing-row b{display:block;font-size:18px;margin-bottom:3px}',
  '.wx-sowing-row.good{border-color:#40d977}',
  '.wx-sowing-row.good b{color:#b4ffbd}',
  '.wx-sowing-row.avoid{border-color:#dc6671}',
  '.wx-sowing-row.avoid b{color:#ffb8bc}',
  '.wx-sowing-row.lunar{border-color:#8f78db;background:#1b1935}',
  '.wx-sowing-row.lunar b{color:#dec7ff}',
  '.wx-grid>.weather-sun,.wx-grid>.weather-soil{grid-column:auto;padding:8px 13px;min-height:62px}',
  '.wx-grid>.weather-sun h3,.wx-grid>.weather-soil h3{display:inline;font-size:15px;margin:0 7px 0 0;padding:0;border:0}',
  '.wx-sun-pair{display:inline-flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px}',
  '.wx-sun-pair span{white-space:nowrap}.wx-sun-pair b{font-size:18px;color:#fff;margin-left:4px}',
  '.wx-soil-pair{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}',
  '.wx-soil-pair strong{font-size:22px;color:#fff}.wx-soil-pair span{font-size:11px;color:#d8f4dd}',
  '.wx-grid>.weather-soil{grid-column:auto;padding:10px 14px}',
  '.wx-grid>.weather-soil h3{display:block;font-size:18px;margin:0 0 5px;padding:0;border:0}',
  '.wx-grid>.weather-soil .wx-soil-sun{display:flex;align-items:center;justify-content:space-around;gap:12px}',
  '.wx-grid>.weather-soil .wx-half{display:flex;align-items:center;gap:9px}',
  '.wx-grid>.weather-soil .wx-half+.wx-half{border-left:1px solid #25794e;padding-left:12px}',
  '.wx-grid>.weather-soil .wx-soil-icon{display:none}',
  '.wx-grid>.weather-soil .wx-soil-number{font-size:25px}',
  '.wx-grid>.weather-soil .wx-caption{font-size:12px;max-width:115px}',
  '.wx-grid>.weather-soil .wx-sun-label{font-size:13px}',
  '.wx-grid>.weather-soil .wx-sun-time{font-size:23px;margin:0}',
  '.wx-grid>.weather-soil .wx-sun-divider{margin:2px 0}',
  '.wx-right-stack .wx-garden-art{display:none}',
  '.wx-right-stack .wx-garden-copy{font-size:19px}',
  '.wx-right-stack .wx-garden-heading{font-size:19px;margin-bottom:5px}',
  '.wx-right-stack .wx-sowing{gap:6px;margin-top:8px}',
  '.wx-right-stack .wx-sowing-row{padding:7px 9px;font-size:18px;line-height:1.22}',
  '.wx-right-stack .wx-sowing-row b{font-size:19px;margin-bottom:2px}',
  '.wx-credit{margin-top:15px;font-size:16px;color:#b7debf;',
  'text-align:center;line-height:1.35}',
].join("")

export function renderWeatherPanel(weather,date,label="сьогодні") {
  const moon=lunarForDate(date)
  const [symbol,desc]=condition(weather?.currentNowCode ?? weather?.code)
  const stamp=weather?.fetchedAt?new Intl.DateTimeFormat("uk-UA", {
    timeZone:"Europe/Kyiv",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"
  }).format(new Date(weather.fetchedAt)):"—"
  const safeWeather=weather&&!weather.stale
  const warning=!weather
    ?'<div class="wx-warning">⚠ Прогноз недоступний</div>'
    :weather.stale
      ?'<div class="wx-warning">⚠ Дані погоди застаріли</div>'
      :weather.warnings?.length
        ?'<div class="wx-warning">⚠ '+(label==="завтра"?"Завтра":"Сьогодні")+': '+esc(weather.warnings.join(" · "))+'</div>'
        :'<div class="wx-warning neutral">✓ Небезпечних умов за прогнозом не виявлено</div>'
  // A current reading is never substituted with the maximum of tomorrow.
  const air=weather?(weather.currentNowTemp??weather.currentTemp):null
  const hasTomorrow=weather && weather.tomorrowDate &&
    (Number.isFinite(weather.tomorrowMin)||Number.isFinite(weather.tomorrowMax))
  const tomorrowNumber=weather?.tomorrowDate
    ? weather.tomorrowDate.split("-").slice(1).reverse().join(".") : "—"
  const todayNumber=weather?.todayDate
    ? weather.todayDate.split("-").slice(1).reverse().join(".") : "—"
  // Both published cards have the same chronological weather summary:
  // current conditions -> TODAY min/max and wind/precip -> TOMORROW min/max.
  // The rest of the card (garden, soil, moon, schedule) remains date-specific.
  const forecast=weather
    ?'<section class="wx-box weather-air"><h3>🌤 Погода — СЬОГОДНІ · '+esc(todayNumber)+'</h3>'+warning+
      '<div class="wx-weather-main"><div class="wx-symbol">'+esc(symbol)+'</div>'+
      '<div><div class="wx-now-label">🌡 Температура зараз</div>'+
      '<div class="wx-now">'+esc(temp(air))+'</div><div class="wx-cond">'+esc(desc)+'</div></div></div>'+
      '<div class="wx-today-box"><div class="wx-today-heading">📅 Сьогодні · '+esc(todayNumber)+'</div>'+
      '<div class="wx-forecast-values">'+
      '<div>Мінімум<b>'+esc(temp(weather.todayMin))+'</b></div>'+
      '<div>Максимум<b>'+esc(temp(weather.todayMax))+'</b></div></div></div>'+
      '<div class="wx-facts">'+
      '<div class="wx-fact wide windline">🌬 Вітер зараз: <b>'+esc(val(weather.currentNowWind??weather.currentWind," м/с"))+'</b></div>'+
      '<div class="wx-fact wide gust windline">💨 Пориви вітру сьогодні: <b>'+esc(val(weather.todayGust," м/с"))+'</b></div>'+
      '<div class="wx-fact wide">☔ Імовірність опадів сьогодні: <b>'+esc(val(weather.todayRain,"%"))+'</b></div>'+
      '</div>'+
      (hasTomorrow
        ?'<div class="wx-forecast-box"><div class="wx-forecast-heading">📅 Завтра · '+esc(tomorrowNumber)+'</div>'+
          '<div class="wx-forecast-values"><div>Мінімум<b>'+esc(temp(weather.tomorrowMin))+'</b></div>'+
          '<div>Максимум<b>'+esc(temp(weather.tomorrowMax))+'</b></div></div></div>'
        :'<div class="wx-forecast-box">📅 Прогноз на завтра недоступний</div>')+
      '</section>'
    :'<section class="wx-box weather-air"><h3>🌤 Погода в СТ «Хімік»</h3>'+warning+
      '<div class="wx-now">—</div><div class="wx-caption">Немає достовірних метеоданих.</div></section>'
  const sun='<section class="wx-box weather-sun"><h3>☀️ Сонячний день</h3>'+
    '<div class="wx-sun-pair"><span>🌅 Схід <b>'+esc(weather?.sunrise||"—:—")+'</b></span>'+
    '<span>🌇 Захід <b>'+esc(weather?.sunset||"—:—")+'</b></span></div></section>'
  const soil='<section class="wx-box weather-soil"><h3>🌱 Температура ґрунту</h3>'+
    '<div class="wx-soil-pair"><strong>'+esc(temp(weather?.soilTemp))+'</strong>'+
    '<span>Глибина ≈6 см · Прогноз моделі'+(weather?.soilAt?' · на '+esc(weather.soilAt):'')+'</span></div></section>'
  const moonHtml='<section class="wx-box weather-moon"><h3>🌙 Місячний календар</h3>'+
    '<div class="wx-moon-main"><div class="wx-moon-icon">'+moonDiscSvg(moon)+'</div>'+
    '<div><div class="wx-moon-number">'+esc(moon.lunarDay)+'-й день</div>'+
    '<div class="wx-moon-note">від молодика<br>на 12:00 за Києвом</div></div></div>'+
    '<div class="wx-moon-rows"><div class="wx-moon-row"><span>Фаза Місяця:</span><b>'+esc(moon.phase)+'</b></div>'+
    '<div class="wx-moon-row"><span>Освітленість:</span><b>'+esc(moon.illumination)+'%</b></div>'+
    '<div class="wx-moon-row"><span>Знак Місяця:</span><b>'+esc(moon.zodiac)+'</b></div></div></section>'
  const tip=gardenTip(date,weather)
  const sow=sowingAdvice(date,weather,moon)
  const garden='<section class="wx-box weather-garden"><h3>🌿 Календар городника</h3>'+
    '<div class="wx-garden-body"><div class="wx-garden-art">🌱<br>🪴</div>'+
    '<div class="wx-garden-copy"><div class="wx-garden-heading">Порада '+(label==="завтра"?"на завтра":"на сьогодні")+':</div>'+
    esc(adviceIcons(tip))+'</div></div>'+
    '<div class="wx-sowing">'+
    '<div class="wx-sowing-row good"><b>✓ Можна сіяти / саджати</b>'+esc(adviceIcons(sow.allowed))+'</div>'+
    '<div class="wx-sowing-row avoid"><b>✕ Поки не варто</b>'+esc(adviceIcons(sow.avoid))+'</div>'+
    '<div class="wx-sowing-row lunar"><b>☾ За місячним календарем</b>'+esc(adviceIcons(sow.lunar))+'</div>'+
    '</div></section>'
  const astro=astroForMoon(moon,date)
  const astroHtml='<section class="wx-box wx-astro weather-astro"><h3>✨ Астропрогноз дня</h3>'+
    '<div class="wx-astro-tag">🌟 Для настрою та натхнення</div>'+
    '<div class="wx-astro-body"><div class="wx-astro-symbol">'+esc(astro.symbol)+'</div>'+
    '<div class="wx-astro-copy"><b>Місяць у '+esc(astro.inSign)+'.</b>'+esc(astro.message)+
    '</div></div>'+
    '<div class="wx-astro-disclaimer">Астрологічна інтерпретація · розважальний характер</div></section>'
  const foot='<div class="wx-credit">Прогноз: Open-Meteo · оновлено '+esc(stamp)+
    ' · ґрунт — модельна температура на 6 см · Місяць — на 12:00 (тропічний знак)</div>'
  return '<section class="weather-zone"><div class="weather-title"><strong>🌿 Погода та садиба</strong>'+
    '<span>СТ «Хімік» · Фастівський район</span></div>'+
    '<div class="wx-grid">'+forecast+
      '<div class="wx-right-stack">'+garden+'</div>'+sun+soil+
      moonHtml+astroHtml+'</div>'+foot+'</section>'
}
