import { gardenTip } from "./garden.js"
import { lunarForDate } from "./moon.js"
import { astroForMoon, moonDiscSvg } from "./astro.js"

const esc = x => String(x ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
const temp = x => Number.isFinite(x) ? (Math.round(x)>0?"+":"") + Math.round(x)+"°C" : "—"
const val = (x,unit) => Number.isFinite(x) ? Math.round(x)+unit : "—"

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
  '.wx-right-stack .wx-box{flex:1;min-width:0}',
  '.wx-right-stack .weather-garden{flex:1.08;display:flex;flex-direction:column}',
  '.wx-right-stack .weather-soil{flex:.92}',
  '.wx-right-stack .wx-box h3{font-size:23px;margin-bottom:9px}',
  '.wx-right-stack .wx-garden-body{gap:10px;flex:1;align-items:center}',
  '.wx-right-stack .wx-garden-art{font-size:66px;min-width:78px;min-height:110px;padding:12px 0}',
  '.wx-right-stack .wx-garden-heading{font-size:21px;margin-bottom:8px}',
  '.wx-right-stack .wx-garden-copy{font-size:19px;line-height:1.3}',
  '.wx-right-stack .wx-soil-icon{font-size:32px;margin:0}',
  '.wx-right-stack .wx-soil-number{font-size:37px}',
  '.wx-right-stack .wx-caption{font-size:15px}',
  '.wx-right-stack .wx-sun-label{font-size:16px}',
  '.wx-right-stack .wx-sun-time{font-size:32px;margin:2px 0 4px}',
  '.wx-right-stack .wx-sun-divider{margin:5px 0}',
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
    ?'<section class="wx-box weather-air"><h3>🌤 Погода в СТ «Хімік»</h3>'+warning+
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
  const soil='<section class="wx-box weather-soil"><h3>🌱 Температура ґрунту</h3>'+
    '<div class="wx-soil-sun"><div class="wx-half">'+
    '<div class="wx-soil-icon">🌱🌡️</div>'+
    '<div class="wx-soil-number">'+esc(temp(weather?.soilTemp))+'</div>'+
    '<div class="wx-caption">Глибина ≈6 см<br>Прогноз моделі'+
      (weather?.soilAt?'<br>на '+esc(weather.soilAt):'')+'</div></div>'+
    '<div class="wx-half"><div class="wx-sun-label">🌅 Схід сонця</div>'+
    '<div class="wx-sun-time">'+esc(weather?.sunrise||"—:—")+'</div>'+
    '<div class="wx-sun-divider"></div>'+
    '<div class="wx-sun-label">🌇 Захід сонця</div>'+
    '<div class="wx-sun-time">'+esc(weather?.sunset||"—:—")+'</div></div></div></section>'
  const moonHtml='<section class="wx-box weather-moon"><h3>🌙 Місячний календар</h3>'+
    '<div class="wx-moon-main"><div class="wx-moon-icon">'+moonDiscSvg(moon)+'</div>'+
    '<div><div class="wx-moon-number">'+esc(moon.lunarDay)+'-й день</div>'+
    '<div class="wx-moon-note">від молодика<br>на 12:00 за Києвом</div></div></div>'+
    '<div class="wx-moon-rows"><div class="wx-moon-row"><span>Фаза Місяця:</span><b>'+esc(moon.phase)+'</b></div>'+
    '<div class="wx-moon-row"><span>Освітленість:</span><b>'+esc(moon.illumination)+'%</b></div>'+
    '<div class="wx-moon-row"><span>Знак Місяця:</span><b>'+esc(moon.zodiac)+'</b></div></div></section>'
  const tip=gardenTip(date,weather)
  const garden='<section class="wx-box weather-garden"><h3>🌿 Календар городника</h3>'+
    '<div class="wx-garden-body"><div class="wx-garden-art">🌱<br>🪴</div>'+
    '<div class="wx-garden-copy"><div class="wx-garden-heading">Порада '+(label==="завтра"?"на завтра":"на сьогодні")+':</div>'+
    esc(tip)+'</div></div></section>'
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
      '<div class="wx-right-stack">'+garden+soil+'</div>'+
      moonHtml+astroHtml+'</div>'+foot+'</section>'
}
