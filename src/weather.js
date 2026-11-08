// Weather forecast for the central pin of ST «Khimik», Fastiv district, Kyiv oblast.
// Data source: Open-Meteo (model forecast, not a sensor at the settlement).
// Coordinates were supplied by the settlement representative via Google Maps.
import fs from "node:fs"
import path from "node:path"
import { kyivDate } from "./source.js"

export const KHIMIK = Object.freeze({
  latitude: 50.338328, longitude: 30.072796,
  district: "Фастівський район", name: "СТ «Хімік»",
})
export const WEATHER_REFRESH_MS = 30 * 60 * 1000
export const WEATHER_MAX_AGE_MS = 90 * 60 * 1000
export const WEATHER_STATE_FILE = path.resolve(
  "artifacts", process.env.TARGET ?? "", "weather-cache.json",
)

export function weatherApiUrl() {
  const u = new URL("https://api.open-meteo.com/v1/forecast")
  const p = {
    latitude: String(KHIMIK.latitude), longitude: String(KHIMIK.longitude),
    timezone: "Europe/Kyiv", wind_speed_unit: "ms", forecast_days: "3",
    current: "temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,is_day",
    hourly: "soil_temperature_6cm",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_gusts_10m_max",
  }
  for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v)
  return u.toString()
}

function validateForecast(data, now) {
  if (!data || data.error || !Array.isArray(data.daily?.time) ||
      !Array.isArray(data.daily.sunrise) || !Array.isArray(data.daily.sunset) ||
      data.daily.time.length < 2 || !data.daily.time.includes(kyivDate(now))) {
    throw Error("Open-Meteo returned an incomplete daily forecast")
  }
  const required = ["temperature_2m_max", "temperature_2m_min",
    "precipitation_probability_max", "wind_gusts_10m_max"]
  for (const field of required) {
    if (!Array.isArray(data.daily[field]) ||
        data.daily[field].length !== data.daily.time.length) {
      throw Error("Open-Meteo missing " + field)
    }
  }
  if (!data.current || !Number.isFinite(data.current.temperature_2m)) {
    throw Error("Open-Meteo current temperature unavailable")
  }
  if (Math.abs(Number(data.latitude) - KHIMIK.latitude) > 0.3 ||
      Math.abs(Number(data.longitude) - KHIMIK.longitude) > 0.3) {
    throw Error("Weather forecast coordinates do not match the requested area")
  }
  return data
}

function readWeatherCache(file) {
  if (!fs.existsSync(file)) return null
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    if (data?.latitude !== KHIMIK.latitude ||
        data?.longitude !== KHIMIK.longitude ||
        !Number.isFinite(Date.parse(data?.fetchedAt))) return null
    return data
  } catch {
    return null
  }
}

function storeWeatherCache(file, snapshot) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = file + ".tmp"
  try {
    fs.writeFileSync(tmp, JSON.stringify(snapshot))
    fs.renameSync(tmp, file)
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp)
  }
}

export async function loadWeather({
  now = new Date(), file = WEATHER_STATE_FILE, requester = fetch,
} = {}) {
  const cached = readWeatherCache(file)
  const age = cached ? now.getTime() - Date.parse(cached.fetchedAt) : Infinity
  const fresh = cached && age >= 0 && age < WEATHER_REFRESH_MS &&
    cached.data?.daily?.time?.includes(kyivDate(now)) &&
    Array.isArray(cached.data.hourly?.soil_temperature_6cm)
  if (fresh) return cached
  try {
    const response = await requester(weatherApiUrl(), {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    })
    if (!response.ok) throw Error("Open-Meteo HTTP " + response.status)
    const data = validateForecast(await response.json(), now)
    const snapshot = {
      latitude: KHIMIK.latitude, longitude: KHIMIK.longitude,
      fetchedAt: now.toISOString(), data,
    }
    storeWeatherCache(file, snapshot)
    console.log("🌤️ Updated ST Khimik weather forecast")
    return snapshot
  } catch (error) {
    console.warn("⚠️ Weather unavailable: " + error.message)
    // Old readings may only be shown if clearly marked stale and recent enough.
    if (cached && age >= 0 && age < WEATHER_MAX_AGE_MS &&
        cached.data?.daily?.time?.includes(kyivDate(now))) {
      return { ...cached, stale: true }
    }
    return null
  }
}

export function weatherForDate(snapshot, date, now = new Date()) {
  if (!snapshot) return null
  const dates = snapshot.data?.daily?.time
  const i = dates?.indexOf(date) ?? -1
  if (i < 0) return null
  const daily = snapshot.data.daily
  const get = key => Number.isFinite(daily[key]?.[i]) ? daily[key][i] : null
  const todayDate = kyivDate(now)
  const today = date === todayDate
  const current = today ? snapshot.data.current : null
  // Always carry the SAME latest observation to both today and tomorrow cards.
  // Its timestamp is separate from the future-day forecast.
  const currentNow = snapshot.data.current
  const iToday = dates.indexOf(todayDate)
  const todayMin = Number.isFinite(daily.temperature_2m_min?.[iToday])
    ? daily.temperature_2m_min[iToday] : null
  const todayMax = Number.isFinite(daily.temperature_2m_max?.[iToday])
    ? daily.temperature_2m_max[iToday] : null
  const todayRain = Number.isFinite(daily.precipitation_probability_max?.[iToday])
    ? daily.precipitation_probability_max[iToday] : null
  const todayGust = Number.isFinite(daily.wind_gusts_10m_max?.[iToday])
    ? daily.wind_gusts_10m_max[iToday] : null
  const tomorrowIndex = iToday >= 0 ? iToday + 1 : -1
  const tomorrowDate = tomorrowIndex >= 0 ? dates[tomorrowIndex] ?? null : null
  const tomorrowMin = Number.isFinite(daily.temperature_2m_min?.[tomorrowIndex])
    ? daily.temperature_2m_min[tomorrowIndex] : null
  const tomorrowMax = Number.isFinite(daily.temperature_2m_max?.[tomorrowIndex])
    ? daily.temperature_2m_max[tomorrowIndex] : null
  const min = get("temperature_2m_min")
  const max = get("temperature_2m_max")
  const rain = get("precipitation_probability_max")
  const gust = get("wind_gusts_10m_max")
  const warnings = []
  if (min !== null && min <= 0) warnings.push("Можливі заморозки")
  if (gust !== null && gust >= 15) warnings.push("Сильні пориви вітру")
  if (min !== null && min <= 1 && rain !== null && rain >= 45) {
    warnings.push("Можлива слизька дорога")
  }
  // Soil temperature at approx. 6 cm is a *model estimate*, never a local sensor reading.
  // On the current date use the latest available past forecast hour.
  // On future dates show the forecast around 12:00 Kyiv local time.
  const hourly = snapshot.data?.hourly
  const soilTimes = hourly?.time
  const soil = hourly?.soil_temperature_6cm
  let soilTemp = null
  let soilAt = null
  if (Array.isArray(soilTimes) && Array.isArray(soil) &&
      soilTimes.length === soil.length) {
    const timestamp = today
      ? date + "T" + new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Kyiv", hour:"2-digit", minute:"2-digit",hourCycle:"h23",
        }).format(now)
      : date + "T12:00"
    let ix = -1
    for (let j=0; j<soilTimes.length; j++) {
      if (soilTimes[j].slice(0,10) === date && soilTimes[j] <= timestamp) ix=j
    }
    if (ix < 0 && !today) ix=soilTimes.indexOf(date+"T12:00")
    if (ix >= 0 && Number.isFinite(soil[ix])) {
      soilTemp = soil[ix]
      soilAt = soilTimes[ix].slice(11,16)
    }
  }
  const stale = Boolean(snapshot.stale) ||
    now.getTime() - Date.parse(snapshot.fetchedAt) >= WEATHER_REFRESH_MS * 2
  return {
    date, fetchedAt: snapshot.fetchedAt, stale,
    currentTemp: Number.isFinite(current?.temperature_2m) ? current.temperature_2m : null,
    currentNowTemp: Number.isFinite(currentNow?.temperature_2m) ? currentNow.temperature_2m : null,
    currentNowCode: Number.isFinite(currentNow?.weather_code) ? currentNow.weather_code : null,
    currentNowWind: Number.isFinite(currentNow?.wind_speed_10m) ? currentNow.wind_speed_10m : null,
    currentNowGust: Number.isFinite(currentNow?.wind_gusts_10m) ? currentNow.wind_gusts_10m : null,
    currentNowAt: currentNow?.time ?? null,
    todayDate, todayMin, todayMax, todayRain, todayGust,
    tomorrowDate, tomorrowMin, tomorrowMax,
    currentWind: Number.isFinite(current?.wind_speed_10m) ? current.wind_speed_10m : null,
    code: today && Number.isFinite(current?.weather_code) ? current.weather_code : get("weather_code"),
    min, max, rain, gust, soilTemp, soilAt, soilDepthCm: 6,
    sunrise: (daily.sunrise[i] || "").slice(11, 16),
    sunset: (daily.sunset[i] || "").slice(11, 16),
    warnings: warnings.slice(0, 2),
    forecastSource: "Open-Meteo",
  }
}
