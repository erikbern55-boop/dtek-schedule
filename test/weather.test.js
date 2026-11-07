import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { KHIMIK, WEATHER_REFRESH_MS, weatherApiUrl, loadWeather, weatherForDate } from "../src/weather.js"
import { gardenTip } from "../src/garden.js"
import { renderWeatherPanel } from "../src/weather-card.js"
import { buildCardHtml } from "../src/card.js"

const start = new Date("2026-11-07T14:30:00.000Z")
const dates = ["2026-11-07","2026-11-08","2026-11-09"]
const sample={
 latitude:50.35, longitude:30.07,
 hourly:{
  time:["2026-11-07T09:00","2026-11-07T10:00","2026-11-07T11:00",
    "2026-11-07T12:00","2026-11-07T16:00","2026-11-08T11:00",
    "2026-11-08T12:00","2026-11-09T12:00"],
  soil_temperature_6cm:[2.5,3.2,3.4,3.6,4.5,5.2,6.1,7.0],
 },
 current:{temperature_2m:-1,weather_code:3,wind_speed_10m:4},
 daily:{
  time:dates,weather_code:[3,61,2],
  temperature_2m_max:[6,8,9],
  temperature_2m_min:[-3,2,1],
  sunrise:["2026-11-07T07:02","2026-11-08T07:04","2026-11-09T07:06"],
  sunset:["2026-11-07T16:25","2026-11-08T16:23","2026-11-09T16:22"],
  precipitation_probability_max:[65,50,10],
  wind_gusts_10m_max:[17,9,7],
 }
}
const schedule=[
 {begin:"00:00",end:"03:00",power:true},
 {begin:"03:00",end:"10:00",power:false},
 {begin:"10:00",end:"24:00",power:true},
]
const makeDir=()=>fs.mkdtempSync(path.join(os.tmpdir(),"khimik-weather-"))
const sender=()=>({ok:true,json:async()=>sample})
test("settlement weather query uses precise provided coordinates and Kyiv timezone",()=>{
 const u=new URL(weatherApiUrl())
 assert.equal(u.searchParams.get("latitude"),String(KHIMIK.latitude))
 assert.equal(u.searchParams.get("longitude"),String(KHIMIK.longitude))
 assert.equal(u.searchParams.get("timezone"),"Europe/Kyiv")
 assert.equal(u.searchParams.get("wind_speed_unit"),"ms")
 assert.match(u.searchParams.get("daily"),/sunrise,sunset/)
 assert.equal(u.searchParams.get("hourly"),"soil_temperature_6cm")
})
test("weather is fetched once and refreshed every 30 minutes (independent of five-minute polling)",async()=>{
 const d=makeDir(),file=path.join(d,"weather.json")
 let calls=0
 const requester=async()=>{calls++;return sender()}
 try {
  const first=await loadWeather({now:start,file,requester})
  assert.equal(first.fetchedAt,start.toISOString())
  const atFive=await loadWeather({now:new Date(start.getTime()+5*60_000),file,requester})
  assert.equal(atFive.fetchedAt,first.fetchedAt)
  assert.equal(calls,1)
  const atThirty=await loadWeather({now:new Date(start.getTime()+WEATHER_REFRESH_MS),file,requester})
  assert.notEqual(atThirty.fetchedAt,first.fetchedAt)
  assert.equal(calls,2)
 } finally {fs.rmSync(d,{recursive:true,force:true})}
})
test("weather forecast data is date-specific; tomorrow does not show today's current temperature",async()=>{
 const d=makeDir(),file=path.join(d,"cache.json")
 try {
  const snap=await loadWeather({now:start,file,requester:async()=>sender()})
  const today=weatherForDate(snap,"2026-11-07",start)
  assert.equal(today.currentTemp,-1)
  assert.equal(today.sunrise,"07:02")
  assert.equal(today.sunset,"16:25")
  assert.equal(today.soilTemp,4.5)
  assert.equal(today.soilAt,"16:00")
  assert.equal(today.soilDepthCm,6)
  assert.deepEqual(today.warnings,["Можливі заморозки","Сильні пориви вітру"])
  const tomorrow=weatherForDate(snap,"2026-11-08",start)
  assert.equal(tomorrow.currentTemp,null)
  assert.equal(tomorrow.sunrise,"07:04")
  assert.equal(tomorrow.soilTemp,6.1)
  assert.equal(tomorrow.soilAt,"12:00")
  assert.deepEqual(tomorrow.warnings,[])
 } finally {fs.rmSync(d,{recursive:true,force:true})}
})
test("on API failure recent cache is marked stale, old cache is rejected",async()=>{
 const d=makeDir(),file=path.join(d,"cache.json")
 try {
  await loadWeather({now:start,file,requester:async()=>sender()})
  const fail=async()=>{throw Error("offline")}
  const cached=await loadWeather({now:new Date(start.getTime()+WEATHER_REFRESH_MS),file,requester:fail})
  assert.equal(cached.stale,true)
  const old=await loadWeather({now:new Date(start.getTime()+WEATHER_REFRESH_MS*4),file,requester:fail})
  assert.equal(old,null)
 } finally {fs.rmSync(d,{recursive:true,force:true})}
})
test("calendar avoids watering in November and makes season-sensitive suggestions",()=>{
 const november=gardenTip("2026-11-07",{min:4,rain:50,gust:3})
 assert.match(november,/троянд/)
 assert.doesNotMatch(november,/Полийте|Поливайте|поливайте грядки/)
 assert.match(gardenTip("2026-05-07",{min:-2,rain:30,gust:4}),/агроволокном/)
 assert.match(gardenTip("2026-06-07",{min:13,rain:85,gust:4}),/дощів/)
})
test("styled forecast widget contains warning, sunrise, sunset, date-specific advice and attribution",()=>{
 const weather={
  currentTemp:-1,min:-3,max:6,currentWind:4,rain:65,gust:17,code:3,
  soilTemp:4.5,soilAt:"16:00",soilDepthCm:6,
  sunrise:"07:02",sunset:"16:25",warnings:["Можливі заморозки"],
  fetchedAt:start.toISOString(),stale:false,
 }
 const html=renderWeatherPanel(weather,"2026-11-07")
 assert.match(html,/07:02/)
 assert.match(html,/16:25/)
 assert.match(html,/Можливі заморозки/)
 assert.match(html,/Open-Meteo/)
 assert.match(html,/Глибина ~6 см/)
 assert.match(html,/Місячний календар/)
 assert.match(html,/Освітленість/)
 assert.match(html,/Місячний день — на 12:00 Київ/)
 assert.match(html,/Фастівський район/)
 const card=buildCardHtml({schedule,date:"2026-11-07",label:"сьогодні",
  update:"07.11.2026 12:00",source:"ДТЕК",weather,now:start})
 assert.match(card,/Погода та садиба/)
 assert.match(card,/07:02/)
 assert.match(card,/24 години/)
 const fallback=buildCardHtml({schedule,date:"2026-11-07",label:"сьогодні",
  update:"07.11.2026 12:00",source:"ДТЕК",weather:null,now:start})
 assert.match(fallback,/Прогноз тимчасово недоступний/)
 assert.match(fallback,/03:00 — 10:00/)
})
test("bad response cannot masquerade as real settlement forecast",async()=>{
 const d=makeDir(),file=path.join(d,"cache.json")
 try {
  const snapshot=await loadWeather({now:start,file,requester:async()=>({ok:true,json:async()=>({...sample,daily:{time:dates}})})})
  assert.equal(snapshot,null)
 } finally {fs.rmSync(d,{recursive:true,force:true})}
})

test("unavailable soil never becomes a fabricated 0°C or sensor reading", async()=>{
 const dir=makeDir(),file=path.join(dir,"cache.json")
 try{
  const data={...sample,hourly:{time:["2026-11-07T12:00"],soil_temperature_6cm:[null]}}
  const snap=await loadWeather({now:start,file,requester:async()=>({ok:true,json:async()=>data})})
  const weather=weatherForDate(snap,"2026-11-07",start)
  assert.equal(weather.soilTemp,null)
  const html=renderWeatherPanel(weather,"2026-11-07")
  assert.match(html,/Прогноз моделі/)
  assert.match(html,/Глибина ~6 см/)
  assert.doesNotMatch(html,/Ґрунт.*0°C/)
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})
test("tomorrow's card uses its own moon date and the forecast soil at noon",()=>{
 const a=renderWeatherPanel({soilTemp:3.2,soilAt:"16:00"},"2026-11-07")
 const b=renderWeatherPanel({soilTemp:7.3,soilAt:"12:00"},"2026-11-08","завтра")
 assert.match(a,/3°C/)
 assert.match(b,/7°C/)
 assert.match(b,/Порада на завтра/)
 assert.match(b,/На 12:00/)
 assert.notEqual(a,b)
})
