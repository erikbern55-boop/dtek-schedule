import { gardenTip } from "./garden.js"
import { lunarForDate } from "./moon.js"

const escape=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
 .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
const temp=n=>Number.isFinite(n)?(Math.round(n)>0?"+":"")+Math.round(n)+"°C":"—"
const val=(n,u)=>Number.isFinite(n)?Math.round(n)+u:"—"

function condition(code) {
 if(code===0)return ["☀","Ясно"]
 if([1,2].includes(code))return ["⛅","Мінлива хмарність"]
 if(code===3)return ["☁","Хмарно"]
 if([45,48].includes(code))return ["≋","Туман"]
 if([51,53,55,56,57].includes(code))return ["☂","Мряка"]
 if([61,63,65,66,67,80,81,82].includes(code))return ["☂","Дощ"]
 if([71,73,75,77,85,86].includes(code))return ["❄","Сніг"]
 if([95,96,99].includes(code))return ["⚡","Гроза"]
 return ["◌","Погода"]
}

export const WEATHER_CSS=[
'.weather-zone{border:2px solid #35e881;border-radius:26px;background:linear-gradient(140deg,#06321f,#021b15);',
'padding:16px 16px 19px;margin-top:17px;height:598px;overflow:hidden}',
'.weather-title{font-size:34px;font-weight:900;color:#d0ffe0;padding:4px 5px 13px;',
'border-bottom:2px solid #279d5f;display:flex;justify-content:space-between;align-items:center}',
'.weather-sub{font-size:16px;color:#a5d7bc;font-weight:500}',
'.wx-grid{display:grid;grid-template-columns:1.17fr .91fr .97fr 1.18fr;gap:9px;',
'margin-top:13px;height:470px}',
'.wx-box{border:2px solid #26d77b;border-radius:18px;background:#082c1e;min-width:0;',
'height:100%;padding:13px 10px;overflow:hidden}',
'.wx-box h3{margin:0 0 10px;font-size:20px;line-height:1.17;',
'border-bottom:1px solid #459c70;padding-bottom:10px}',
'.wx-stack{display:flex;flex-direction:column;gap:9px;min-width:0;height:100%}',
'.wx-stack .wx-box{height:auto;flex:1}',
'.wx-alert{background:#f6cb39;color:#142010;border-radius:9px;',
'font-weight:900;font-size:18px;line-height:1.2;padding:9px 7px;margin:6px 0 14px}',
'.wx-safe{border:1px solid #369268;border-radius:9px;',
'color:#d5efdd;font-size:16px;padding:8px;margin:8px 0 14px;line-height:1.22}',
'.wx-temp{font-size:49px;font-weight:900;color:white;margin:4px 0 8px}',
'.wx-condition{font-size:18px;color:#e6ffed;line-height:1.24;min-height:57px}',
'.wx-range{font-size:19px;line-height:1.4;background:#125038;',
'padding:9px 7px;border-radius:11px;margin:13px 0 12px}',
'.wx-data{font-size:18px;line-height:1.5;color:#f2fff6}',
'.wx-soil{font-size:43px;color:#d9ffdf;font-weight:900;margin:12px 0 9px}',
'.wx-soil-hint{font-size:16px;line-height:1.32;color:#b8e5cf}',
'.wx-time{margin:6px 0;padding:4px 0;border-bottom:1px solid #235c42;',
'font-size:16px;color:#dcffe8}',
'.wx-time strong{display:block;font-size:30px;color:white;margin-top:3px}',
'.wx-moon-symbol{font-size:55px;text-align:center;height:78px;line-height:1.3}',
'.wx-moon-day{font-size:43px;color:#f1ffbd;font-weight:900;text-align:center;white-space:nowrap}',
'.wx-moon-small{text-align:center;color:#d4ebdf;font-size:15px;margin-bottom:10px}',
'.wx-moon-row{font-size:18px;line-height:1.4;margin:7px 0}',
'.wx-moon-row b{color:white}',
'.wx-tip-title{color:#eff37b;font-size:21px;font-weight:900;line-height:1.25;margin:13px 0}',
'.wx-tip{color:#edfff1;font-size:19px;line-height:1.35}',
'.wx-credit{font-size:16px;text-align:center;color:#b4d6c1;padding-top:13px}',
].join("")

export function renderWeatherPanel(weather,date,label="сьогодні") {
 const moon=lunarForDate(date)
 const heading='<section class="weather-zone"><div class="weather-title">'+
  '<span>🌿 Погода та садиба</span><span class="weather-sub">СТ «Хімік» · Фастівський район</span></div>'
 const warning=!weather
    ?'<div class="wx-alert">⚠ Прогноз недоступний</div>'
    :weather.stale
      ?'<div class="wx-alert">⚠ Дані погоди застаріли</div>'
      :weather.warnings?.length
        ?'<div class="wx-alert">⚠ '+escape(weather.warnings.join(" · "))+'</div>'
        :'<div class="wx-safe">✓ Небезпечних умов за прогнозом не виявлено</div>'
 const [symbol,desc]=condition(weather?.code)
 const temperature=weather?(weather.currentTemp??weather.max):null
 const weatherCard='<section class="wx-box"><h3>☁ Погода в СТ «Хімік»</h3>'+
  warning+'<div class="wx-temp">'+escape(temp(temperature))+'</div>'+
  '<div class="wx-condition">'+escape(symbol+" "+desc)+'</div>'+
  '<div class="wx-range">Прогноз доби:<br><b>'+escape(temp(weather?.min))+
  ' … '+escape(temp(weather?.max))+'</b></div>'+
  '<div class="wx-data">🌬 Вітер: '+escape(val(weather?.currentWind??weather?.gust," м/с"))+'</div>'+
  '<div class="wx-data">☂ Опади: '+escape(val(weather?.rain,"%"))+'</div></section>'
 const soilValue=temp(weather?.soilTemp)
 const soilCard='<section class="wx-box"><h3>🌱 Температура ґрунту</h3>'+
  '<div class="wx-soil">'+escape(soilValue)+'</div>'+
  '<div class="wx-soil-hint">Глибина ~6 см<br>Прогноз моделі'+
  (weather?.soilAt?'<br>На '+escape(weather.soilAt):"")+'</div></section>'
 const sunCard='<section class="wx-box"><h3>🌅 Сонце</h3>'+
  '<div class="wx-time">☀ Схід<strong>'+escape(weather?.sunrise||"—:—")+'</strong></div>'+
  '<div class="wx-time">◕ Захід<strong>'+escape(weather?.sunset||"—:—")+'</strong></div></section>'
 const moonCard='<section class="wx-box"><h3>🌙 Місячний календар</h3>'+
  '<div class="wx-moon-symbol">'+escape(moon.moonGlyph)+'</div>'+
  '<div class="wx-moon-day">'+escape(moon.lunarDay)+'-й день</div>'+
  '<div class="wx-moon-small">від молодика · на 12:00</div>'+
  '<div class="wx-moon-row">Фаза:<br><b>'+escape(moon.phase)+'</b></div>'+
  '<div class="wx-moon-row">Освітленість: <b>'+escape(moon.illumination)+'%</b></div>'+
  '<div class="wx-moon-row">Знак: <b>'+escape(moon.zodiac)+'</b></div></section>'
 const gardenCard='<section class="wx-box"><h3>🌿 Календар городника</h3>'+
  '<div class="wx-tip-title">Порада '+(label==="завтра"?"на завтра":"на сьогодні")+':</div>'+
  '<div class="wx-tip">'+escape(gardenTip(date,weather))+'</div></section>'
 const stamp=weather?.fetchedAt?new Intl.DateTimeFormat("uk-UA",{timeZone:"Europe/Kyiv",
  hour:"2-digit",minute:"2-digit"}).format(new Date(weather.fetchedAt)):"—"
 return heading+'<div class="wx-grid">'+weatherCard+
  '<div class="wx-stack">'+soilCard+sunCard+'</div>'+moonCard+gardenCard+
  '</div><div class="wx-credit">Прогноз: Open-Meteo · оновлено '+escape(stamp)+
  ' · температура ґрунту — модельна · Місячний день — на 12:00 Київ</div></section>'
}
