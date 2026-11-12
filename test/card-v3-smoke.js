import fs from "node:fs"
import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import {buildCardV3Html,renderCardV3Png} from "../src/card-v3.js"
const schedule=[
 {begin:"00:00",end:"06:00",power:true},
 {begin:"06:00",end:"13:30",power:false},
 {begin:"13:30",end:"16:30",power:true},
 {begin:"16:30",end:"23:30",power:false},
 {begin:"23:30",end:"24:00",power:true},
]
const weather={
 currentTemp:3,currentNowTemp:3,currentNowCode:2,currentNowWind:4,
 todayDate:"2026-11-07",todayMin:-1,todayMax:8,todayRain:35,todayGust:11,
 tomorrowDate:"2026-11-08",tomorrowMin:-2,tomorrowMax:5,
 min:-1,max:8,currentWind:5,rain:35,gust:11,code:2,
 soilTemp:5.6,soilAt:"16:00",sunrise:"07:01",sunset:"16:29",
 warnings:["Можливі заморозки"],fetchedAt:"2026-11-07T14:30:00.000Z",stale:false,
}
const details={schedule,date:"2026-11-07",label:"сьогодні",update:"07.11.2026 12:00",
 source:"ДТЕК",now:new Date("2026-11-07T14:30:00.000Z"),weather}
// Regression guard: the current Telegram full-screen viewer must survive the redesign.
// This verifies existing code only; it does not publish to Telegram.
const mediaSource=readFileSync(new URL("../src/media.js",import.meta.url),"utf8")
assert.match(mediaSource,/⛶ Відкрити на весь екран/,"keep the full-screen button")
assert.match(mediaSource,/erikbern55-boop\.github\.io\/dtek-schedule\//,"keep existing viewer URL")
assert.match(mediaSource,/\?day=/,"keep today/tomorrow viewer selection")
assert.match(mediaSource,/saveViewerSnapshot\(png, label/,"keep full-screen HTML snapshot generation")
assert.match(mediaSource,/overflow:auto!important/,"keep full-screen scrolling")
console.log("Existing full-screen viewer preserved in production integration source")
const png=await renderCardV3Png(details)
assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
fs.writeFileSync("svitlopuls-v3-preview.png",png)
const browser=await chromium.launch({headless:true})
try {
 const page=await browser.newPage({viewport:{width:1404,height:900}})
 await page.setContent(buildCardV3Html(details),{waitUntil:"load"})
 const sourceLinks=await page.locator(".v3-sources a").evaluateAll(links=>links.map(a=>({text:a.textContent,href:a.href,target:a.target,rel:a.rel})))
 assert.equal(sourceLinks.length,6,"all six reference links must remain clickable in HTML")
 for(const link of sourceLinks){
  assert.match(link.href,/^https:\/\//,"reference link must use HTTPS")
  assert.equal(link.target,"_blank","reference opens separately")
  assert.match(link.rel,/noopener/,"external links use noopener")
 }
 assert.ok(sourceLinks.some(x=>x.href.includes("dtek-krem.com.ua")),"DTEK source link exists")
 console.log("V3 source links OK",sourceLinks.map(x=>x.href))
 const layout=await page.evaluate(()=>{
  const box=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,overflow:e.scrollWidth>e.clientWidth+3}}
  return {power:box(".v3-power"),air:box(".weather-air"),tomorrow:box(".weather-tomorrow"),sun:box(".weather-sun"),soil:box(".weather-soil"),
   garden:box(".weather-garden"),moon:box(".weather-moon"),astro:box(".weather-astro"),
   sources:box(".v3-sources"),footer:box(".v3-footer"),body:box(".v3")}
 })
 for(const [name,b] of Object.entries(layout))assert.ok(b,name+" missing")
 assert.ok(layout.air.y>=layout.power.b-3,"weather follows power")
 assert.ok(Math.abs(layout.air.y-layout.tomorrow.y)<4&&Math.abs(layout.air.y-layout.tomorrow.y)<4&&Math.abs(layout.air.y-layout.sun.y)<4&&Math.abs(layout.air.y-layout.soil.y)<4,"four weather panels share first row")
 assert.ok(layout.garden.w>layout.air.w,"gardening spans the wide middle row")
 assert.ok(layout.garden.y>=layout.air.b-3,"gardening follows weather")
 assert.ok(Math.abs(layout.moon.y-layout.astro.y)<4,"night panels share third row")
 assert.ok(layout.moon.y>=layout.garden.b-3,"moon follows gardening")
 assert.ok(layout.sources.y>=layout.moon.b-3,"sources follow night row")
 assert.ok(layout.footer.y>=layout.sources.b-3,"footer follows sources")
 assert.ok(Object.values(layout).every(b=>!b.overflow),"no panel horizontally overflows")
 console.log("V3 visual layout OK",JSON.stringify(layout))
}finally{await browser.close()}
