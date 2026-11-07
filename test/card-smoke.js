import fs from "node:fs"
import { renderCardPng, buildCardHtml } from "../src/card.js"
import { chromium } from "playwright"
import assert from "node:assert/strict"
const schedule=[
{begin:"00:00",end:"01:30",power:false},
{begin:"01:30",end:"04:30",power:true},
{begin:"04:30",end:"12:00",power:false},
{begin:"12:00",end:"15:00",power:true},
{begin:"15:00",end:"22:30",power:false},
{begin:"22:30",end:"24:00",power:true},
]
const weather={
 currentTemp:3,currentNowTemp:3,currentNowCode:2,currentNowWind:4,
 tomorrowDate:"2026-11-08",tomorrowMin:-2,tomorrowMax:5,
 min:-1,max:8,currentWind:5,rain:35,gust:11,code:2,
 soilTemp:5.6,soilAt:"16:00",soilDepthCm:6,
 sunrise:"07:01",sunset:"16:29",warnings:["Можливі заморозки"],
 fetchedAt:"2026-11-07T14:30:00.000Z",stale:false,
}
const png=await renderCardPng({
 schedule,date:"2026-11-07",label:"сьогодні",
 update:"07.11.2026 12:00",source:"ДТЕК",
 now:new Date("2026-11-07T14:30:00.000Z"),
 weather,
})
if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error("Invalid PNG")
if(png.length<20000)throw Error("Rendered PNG is suspiciously small")
fs.writeFileSync("svitlopuls-preview.png",png)
console.log("✅ Generated PNG card:",png.length,"bytes (example forecast, not live data)")

// Browser layout assertions catch accidental fallback to four narrow columns,
// overlaps, or a clipped Telegram footer before this design goes live.
const browser = await chromium.launch({headless:true})
try {
 const page=await browser.newPage({viewport:{width:920,height:1000}})
 await page.setContent(buildCardHtml({
   schedule,date:"2026-11-07",label:"сьогодні",
   update:"07.11.2026 12:00",source:"ДТЕК",
   now:new Date("2026-11-07T14:30:00.000Z"),weather
 }),{waitUntil:"load"})
 const geometry=await page.evaluate(()=>{
   const rect=(sel)=>{const el=document.querySelector(sel);if(!el)return null
      const r=el.getBoundingClientRect()
      return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}}
   const elements=[...document.querySelector(".wx-grid").children].map(el=>{
      const r=el.getBoundingClientRect()
      return {x:r.x,y:r.y,width:r.width,height:r.height,clipped:el.scrollHeight>el.clientHeight+2}
   })
   return {items:elements,footer:rect(".footer"),garden:rect(".weather-garden"),
     soil:rect(".weather-soil"),right:rect(".wx-right-stack"),
     astro:rect(".weather-astro"),moon:rect(".weather-moon"),
     weather:rect(".weather-zone"),card:rect(".card"),power:rect(".power-layout"),
     source:document.querySelector(".footer")?.textContent,
     entertainment:document.querySelector(".wx-astro-disclaimer")?.textContent}
 })
 assert.equal(geometry.items.length,4,"Four major dashboard cells: weather / garden+soil / moon / astro")
 const [a,b,c,d]=geometry.items
 assert.ok(Math.abs(a.y-b.y)<3,"top row must be aligned")
 assert.ok(Math.abs(c.y-d.y)<3,"second row must be aligned")
 assert.ok(c.y>a.y+a.height-3,"row two must start below row one")
 assert.ok(b.x>a.x+a.width-3,"two columns must not overlap")
 assert.ok(a.width>350&&b.width>350&&c.width>350&&d.width>350,
   "each weather panel must be wide enough for readable text")
 assert.ok(geometry.weather.y>geometry.power.y+geometry.power.height-3,
   "weather section must start below power schedule")
 assert.ok(geometry.footer.y>=geometry.weather.bottom-3,
   "source footer must not overlap weather section")
 assert.ok(geometry.card.bottom>=geometry.footer.bottom,
   "footer must remain inside the card")
 assert.ok(geometry.items.every(x=>!x.clipped),"weather cells must not clip text")
 assert.ok(geometry.garden.bottom<=geometry.soil.y+3,"gardener card must be above soil and sun")
 assert.ok(geometry.soil.bottom<=geometry.right.bottom+3,"soil card must remain inside right stack")
 assert.ok(geometry.garden.x>=geometry.right.x-3,"garden card must remain inside right stack")
 assert.ok(geometry.astro.y>=geometry.right.bottom-3,"astrology must be in lower-right")
 assert.ok(Math.abs(geometry.astro.y-geometry.moon.y)<3,"moon and astrology aligned")
 assert.match(geometry.entertainment,/розважальний характер/)
 assert.match(geometry.source,/ДТЕК/)
 console.log("✅ Verified 2×2 wide weather cards, footer and responsive card height",geometry)
}finally{
 await browser.close()
}
