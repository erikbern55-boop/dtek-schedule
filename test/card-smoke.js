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
 todayDate:"2026-11-07",todayMin:-1,todayMax:8,todayRain:35,todayGust:11,
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
 const page=await browser.newPage({viewport:{width:1200,height:1000}})
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
   const windRows=[...document.querySelectorAll(".wx-fact.windline")].map(el=>{
     const r=el.getBoundingClientRect(),b=el.querySelector("b").getBoundingClientRect()
     return {width:r.width,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
      childRight:b.right,rowRight:r.right,label:el.textContent,bold:b.width,
      noWrap:getComputedStyle(el).whiteSpace==="nowrap"}
   })
   return {items:elements,windRows,footer:rect(".footer"),garden:rect(".weather-garden"),
     countdown:rect(".countdown-box"),emergency:rect(".emergency-box"),
     next:rect(".next"),outages:rect(".outages"),dial:rect(".dial"),
     countdownText:document.querySelector(".countdown-box")?.textContent,
     emergencyText:document.querySelector(".emergency-box")?.textContent,
     soil:rect(".weather-soil"),sun:rect(".weather-sun"),right:rect(".wx-right-stack"),
     astro:rect(".weather-astro"),moon:rect(".weather-moon"),
     weather:rect(".weather-zone"),card:rect(".card"),power:rect(".power-layout"),
     source:document.querySelector(".footer")?.textContent,
     entertainment:document.querySelector(".wx-astro-disclaimer")?.textContent}
 })
 assert.equal(geometry.items.length,6,"Six dashboard cells: weather / garden / sun / soil / moon / astro")
 assert.ok(geometry.countdown && geometry.emergency,"Both approved electricity panels exist")
 assert.ok(geometry.countdown.y>=geometry.dial.bottom-3,"countdown must follow dial in second row")
 assert.ok(geometry.next.y>=geometry.dial.bottom-3,"status tile must follow top row")
 assert.ok(geometry.outages.y<geometry.emergency.y,"outage list must be above incident status")
 assert.ok(geometry.countdown.width>=240,"countdown must be readable")
 assert.ok(geometry.emergency.width>=250,"incident tile must be readable")
 assert.match(geometry.countdownText,/Відлік до події/)
 assert.match(geometry.countdownText,/До планового ввімкнення/)
 assert.match(geometry.countdownText,/06:00/)
 assert.match(geometry.emergencyText,/Інформація уточнюється/)
 assert.match(geometry.emergencyText,/Автоматичного підтвердження аварій/)
 const [a,b,sun,soil,c,d]=geometry.items
 assert.ok(Math.abs(a.y-b.y)<3,"weather and garden must align")
 assert.ok(Math.abs(c.y-d.y)<3,"moon and astro must align")
 assert.ok(sun.y>=a.y+a.height-3,"sun times follow weather")
  assert.ok(soil.y>=b.y+b.height-3,"soil temperature follows garden")
  assert.ok(Math.abs(sun.y-soil.y)<3,"sun and soil panels share a row")
 assert.ok(c.y>=Math.max(sun.y+sun.height,soil.y+soil.height)-3,"moon follows sun and soil")
 assert.ok(b.x>a.x+a.width-3,"two weather columns do not overlap")
 assert.ok(a.width>450&&b.width>450&&c.width>450&&d.width>450,"readable weather panels")
 assert.ok(geometry.weather.y>=geometry.power.y+geometry.power.height-3,"weather below power")
 assert.ok(geometry.footer.y>=geometry.weather.bottom-3,"footer below weather")
 assert.ok(geometry.card.bottom>=geometry.footer.bottom,"footer within card")
 assert.ok(geometry.items.every(x=>!x.clipped),"weather panels must not clip")
 assert.equal(geometry.windRows.length,2)
 for(const wind of geometry.windRows) {
  assert.ok(wind.scrollWidth<=wind.clientWidth+2,"wind text must not overflow")
  assert.ok(wind.childRight<=wind.rowRight+2,"wind value visible")
 }
 assert.match(geometry.windRows[0].label,/Вітер зараз/)
 assert.match(geometry.windRows[1].label,/Пориви вітру сьогодні/)
 assert.ok(geometry.garden.bottom<=geometry.soil.y+3)
 assert.ok(geometry.soil.x>=geometry.garden.x-3,"soil belongs in right column")
  assert.ok(geometry.sun.x<geometry.soil.x,"sun belongs in left column")
 assert.ok(geometry.astro.y>=geometry.soil.bottom-3)
 assert.match(geometry.entertainment,/розважальний характер/)
 assert.match(geometry.source,/ДТЕК/)
 console.log("✅ Verified 2×2 wide weather cards, footer and responsive card height",geometry)
}finally{
 await browser.close()
}
