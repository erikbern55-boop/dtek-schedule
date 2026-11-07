import { gardenTip } from "./garden.js"

const e = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
const t = n => Number.isFinite(n) ? (Math.round(n) > 0 ? "+" : "") + Math.round(n) + "°C" : "—"
const n = (v,unit) => Number.isFinite(v) ? Math.round(v) + unit : "—"

function condition(code) {
  if (code === 0) return ["☀", "Ясно"]
  if ([1,2].includes(code)) return ["⛅", "Мінлива хмарність"]
  if (code === 3) return ["☁", "Хмарно"]
  if ([45,48].includes(code)) return ["≋", "Туман"]
  if ([51,53,55,56,57].includes(code)) return ["☂", "Мряка"]
  if ([61,63,65,66,67,80,81,82].includes(code)) return ["☂", "Дощ"]
  if ([71,73,75,77,85,86].includes(code)) return ["❄", "Сніг"]
  if ([95,96,99].includes(code)) return ["⚡", "Гроза"]
  return ["◌", "Погода"]
}

export const WEATHER_CSS = [
  '.weather-zone{border:2px solid #32e47b;border-radius:24px;background:linear-gradient(135deg,#06321f,#021d17);',
  'padding:18px 18px 19px;margin-top:18px;min-height:382px}',
  '.weather-title{font-size:33px;font-weight:900;color:#d0ffe0;padding:2px 4px 13px;border-bottom:2px solid #219656;',
  'display:flex;justify-content:space-between;align-items:center}',
  '.weather-sub{font-size:18px;color:#a5d7bc;font-weight:500}',
  '.weather-columns{display:grid;grid-template-columns:1.12fr .84fr 1.18fr;gap:9px;margin-top:12px}',
  '.weather-box{border:2px solid #2acb74;border-radius:17px;background:#072a1c;min-height:294px;padding:14px 11px}',
  '.weather-box h3{margin:0 0 10px;font-size:22px;line-height:1.17;border-bottom:1px solid #4c9b76;padding-bottom:9px}',
  '.wx-alert{background:#f4cf3e;color:#132010;border-radius:8px;font-weight:900;',
  'font-size:17px;line-height:1.2;padding:8px;margin-bottom:12px}',
  '.wx-safe{color:#b4efc8;border:1px solid #367d5b;border-radius:8px;font-size:17px;',
  'line-height:1.2;padding:8px;margin-bottom:12px}',
  '.wx-temp{font-size:45px;font-weight:900;color:white;margin:4px 0}',
  '.wx-condition{font-size:18px;color:#e4ffed;line-height:1.15;min-height:43px}',
  '.wx-day{margin:9px 0;padding:8px;background:#10402c;border-radius:10px;font-size:20px;line-height:1.45}',
  '.wx-data{font-size:18px;line-height:1.45;color:#deeee4}',
  '.wx-astr{border:2px solid #d8bf32;background:#193022;border-radius:14px;margin:11px 1px;',
  'padding:14px 4px;text-align:center;font-size:19px;color:#f4f5d6}',
  '.wx-astr b{display:block;font-size:39px;color:white;margin-top:8px}',
  '.wx-astr.set{border-color:#ff973e;background:#34251c}',
  '.wx-garden{font-size:21px;line-height:1.35;color:#f4ffed;margin:12px 2px}',
  '.wx-quote{color:#e7e881;font-weight:800;font-size:22px}',
  '.wx-credit{font-size:16px;color:#aed0ba;text-align:right;padding-top:8px}',
].join("")

export function renderWeatherPanel(weather, date, label = "сьогодні") {
  const heading = '<section class="weather-zone"><div class="weather-title"><span>🌿 Погода та садиба</span>' +
    '<span class="weather-sub">СТ «Хімік» · Фастівський район</span></div>'
  if (!weather) {
    return heading + '<div style="font-size:24px;padding:45px 20px;color:#dbf3e4">' +
      '🌤 Прогноз тимчасово недоступний. Графік ДТЕК працює незалежно.</div></section>'
  }
  const [symbol, description] = condition(weather.code)
  const minmax = t(weather.min) + " … " + t(weather.max)
  const primaryTemp = weather.currentTemp === null ? weather.max : weather.currentTemp
  const warning = weather.stale
    ? '<div class="wx-alert">⚠ Прогноз потребує оновлення</div>'
    : weather.warnings?.length
      ? '<div class="wx-alert">⚠ ' + e(weather.warnings.join(" · ")) + '</div>'
      : '<div class="wx-safe">✓ Небезпечних умов за прогнозом не виявлено</div>'
  const tip = gardenTip(date, weather)
  const timestamp = weather.fetchedAt
    ? new Intl.DateTimeFormat("uk-UA", {timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit"}).format(new Date(weather.fetchedAt)) : "—"
  return heading + '<div class="weather-columns">' +
    '<div class="weather-box"><h3>☁ Погода ' + (label === "завтра" ? "завтра" : "в СТ «Хімік»") + '</h3>' + warning +
    '<div class="wx-temp">' + e(t(primaryTemp)) + '</div>' +
    '<div class="wx-condition">' + e(symbol + " " + description) + '</div>' +
    '<div class="wx-day">Прогноз доби:<br><b>' + e(minmax) + '</b></div>' +
    '<div class="wx-data">🌬 Вітер: ' + e(n(weather.currentWind ?? weather.gust," м/с")) + '</div>' +
    '<div class="wx-data">☂ Опади: ' + e(n(weather.rain,"%")) + '</div></div>' +
    '<div class="weather-box"><h3>🌅 Схід / захід</h3>' +
    '<div class="wx-astr">☀ Схід сонця<b>' + e(weather.sunrise || "—:—") + '</b></div>' +
    '<div class="wx-astr set">◕ Захід сонця<b>' + e(weather.sunset || "—:—") + '</b></div></div>' +
    '<div class="weather-box"><h3>🌱 Календар городника</h3>' +
    '<div class="wx-quote">Порада ' + (label === "завтра" ? "на завтра:" : "на сьогодні:") + '</div>' +
    '<div class="wx-garden">' + e(tip) + '</div></div></div>' +
    '<div class="wx-credit">Прогноз Open-Meteo · оновлено ' + e(timestamp) +
    ' · погодна модель, не місцевий датчик</div></section>'
}
