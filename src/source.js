import { REGION, SHUTDOWNS_PAGE, SHUTDOWNS_DATA_MATCHER, RETRIES_MAX_COUNT, RETRIES_TIMEOUT } from "./constants.js"

const mirrorRegions = { k: "kyiv", kr: "kyiv-region", dn: "dnipro", o: "odesa" }
const MAX_MIRROR_AGE_MS = 12 * 60 * 60 * 1000

export function kyivDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Kyiv" }).format(date)
}

export function selectScheduleDays(fact, now = new Date()) {
  if (!fact?.data || typeof fact.data !== "object") return []
  const today = kyivDate(now)
  const tomorrow = new Date(Date.parse(today + "T12:00:00Z") + 86_400_000)
    .toISOString().slice(0, 10)
  return Object.keys(fact.data)
    .filter((key) => /^\d+$/.test(key))
    .map((key) => ({ key, date: kyivDate(new Date(Number(key) * 1000)) }))
    .filter(({ date }) => date === today || date === tomorrow)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, date }) => ({ key, date, label: date === today ? "сьогодні" : "завтра" }))
}

export function validateMirror(snapshot, now = Date.now()) {
  const updated = Date.parse(snapshot?.lastUpdated ?? "")
  if (!Number.isFinite(updated) || updated > now + 5 * 60_000 || now - updated > MAX_MIRROR_AGE_MS) {
    throw new Error("Резервні дані застаріли або мають неправильну дату")
  }
  if (!snapshot?.fact?.data || !Object.keys(snapshot.fact.data).length) {
    throw new Error("У резервній копії немає графіка")
  }
  if (!selectScheduleDays(snapshot.fact, new Date(now)).length) {
    throw new Error("У резервній копії немає даних на поточну дату")
  }
  return snapshot.fact
}

async function readOfficial() {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(SHUTDOWNS_PAGE, { waitUntil: "load", timeout: 25_000 })
    const html = await page.content()
    const match = html.match(SHUTDOWNS_DATA_MATCHER)
    if (!match) throw new Error("На сайті ДТЕК змінено формат даних (fact не знайдено)")
    const fact = JSON.parse(match[1])
    if (!fact?.data) throw new Error("Неповні дані графіка ДТЕК")
    return fact
  } finally {
    await browser.close()
  }
}

async function readMirror() {
  const region = mirrorRegions[String(REGION).toLowerCase()]
  if (!region) throw new Error("Немає резервного джерела для цього регіону")
  const url = "https://raw.githubusercontent.com/Baskerville42/outage-data-ua/main/data/" + region + ".json"
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: "no-store" })
  if (!response.ok) throw new Error("Резервне джерело відповіло HTTP " + response.status)
  return validateMirror(await response.json())
}

export async function getShutdownsData() {
  for (let attempt = 0; attempt <= RETRIES_MAX_COUNT; attempt++) {
    try {
      const fact = await readOfficial()
      return { fact, source: "ДТЕК" }
    } catch (error) {
      console.warn("⚠️ ДТЕК: " + error.message)
    }
    try {
      const fact = await readMirror()
      console.log("✅ Використано свіжу резервну копію графіка ДТЕК")
      return { fact, source: "резервна копія даних ДТЕК" }
    } catch (error) {
      console.warn("⚠️ Резервне джерело: " + error.message)
    }
    if (attempt < RETRIES_MAX_COUNT) {
      await new Promise((resolve) => setTimeout(resolve, RETRIES_TIMEOUT))
    }
  }
  throw new Error("Не вдалося отримати актуальні дані графіка")
}
