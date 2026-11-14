import fs from "node:fs"
import assert from "node:assert/strict"
import { renderCardV3Png, buildCardV3Html } from "../src/card-v3.js"
import { chromium } from "playwright"

const schedule=[
 {begin:"00:00",end:"05:00",power:true},
 {begin:"05:00",end:"09:00",power:false},
 {begin:"09:00",end:"15:30",power:true},
 {begin:"15:30",end:"19:30",power:false},
 {begin:"19:30",end:"24:00",power:true},
]
const weather={
 currentTemp:3,currentNowTemp:3,currentNowCode:2,currentNowWind:4,
 todayDate:"2026-11-14",todayMin:1,todayMax:6,todayRain:0,todayGust:11,
 tomorrowDate:"2026-11-15",tomorrowMin:0,tomorrowMax:6,
 min:1,max:6,currentWind:3,rain:0,gust:11,code:2,
 soilTemp:4,soilAt:"22:00",soilDepthCm:6,
 sunrise:"07:11",sunset:"16:15",warnings:[],
 fetchedAt:"2026-11-14T19:00:00.000Z",stale:false,
}
const details={schedule,date:"2026-11-14",label:"сьогодні",update:"14.11.2026 19:00",source:"ДТЕК",now:new Date("2026-11-14T19:00:00.000Z"),weather}
const html=buildCardV3Html(details)
assert.match(html,/Що можна \/ не варто/)
const png=await renderCardV3Png(details)
assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"Invalid PNG signature")
const width=png.readUInt32BE(16),height=png.readUInt32BE(20)
fs.writeFileSync("svitlopuls-v3-preview.png",png)
fs.writeFileSync("svitlopuls-v3-geometry.json",JSON.stringify({width,height,expectedWidth:1404,expectedHeight:1536,bytes:png.length,renderer:"renderCardV3Png"},null,2))
console.log("V3 RENDER:",JSON.stringify({width,height,bytes:png.length,renderer:"renderCardV3Png"}))
assert.equal(width,1404,"V3 width must match the approved reference")
assert.equal(height,1536,"V3 height must match the approved reference")
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({viewport:{width:1404,height:1536}})
 await page.setContent(html,{waitUntil:"load"})
 for(const selector of [".v3-head",".v3-date-panel",".v3-count",".v3-periods",".weather-air",".weather-sun",".weather-soil",".weather-garden",".weather-sowing",".weather-moon",".weather-astro",".v3-sources",".v3-footer"]){
  assert.equal(await page.locator(selector).count(),1,"Missing V3 section "+selector)
 }
 const overflows=await page.evaluate(()=>[...document.querySelectorAll(".v3-panel,.v3-weather .wx-box")].filter(el=>el.scrollHeight>el.clientHeight+4&&getComputedStyle(el).overflowY==="hidden").map(el=>el.className))
 assert.deepEqual(overflows,[],"Clipped panels")
}finally{await browser.close()}
