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

// Verify the approved three-panel top row and every live information block.
const browser = await chromium.launch({headless:true})
try {
 const page=await browser.newPage({viewport:{width:1200,height:1200}})
 await page.setContent(buildCardHtml({
   schedule,date:"2026-11-07",label:"сьогодні",
   update:"07.11.2026 12:00",source:"ДТЕК",
   now:new Date("2026-11-07T14:30:00.000Z"),weather
 }),{waitUntil:"load"})
 const geometry=await page.evaluate(()=>{
   const rect=(sel)=>{const el=document.querySelector(sel);if(!el)return null
      const r=el.getBoundingClientRect()
      return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,
        clipped:el.scrollHeight>el.clientHeight+3}}
   return {day:rect(".day-panel"),countdown:rect(".countdown-box"),
     schedule:rect(".schedule-panel"),weather:rect(".weather-air"),
     sun:rect(".weather-sun"),soil:rect(".weather-soil"),
     garden:rect(".weather-garden"),moon:rect(".weather-moon"),
     astro:rect(".weather-astro"),sources:rect(".sources"),
     footer:rect(".footer"),card:rect(".card"),
     emergency:document.querySelector(".emergency-box")?.textContent,
     countdownText:document.querySelector(".countdown-box")?.textContent,
     source:document.querySelector(".footer")?.textContent,
     entertainment:document.querySelector(".wx-astro-disclaimer")?.textContent}
 })
 for(const key of ["day","countdown","schedule","weather","sun","soil","garden","moon","astro","sources","footer","card"]){
   assert.ok(geometry[key],key+" exists")
   assert.ok(geometry[key].width>100,key+" readable")
 }
 assert.ok(Math.abs(geometry.day.y-geometry.countdown.y)<3)
 assert.ok(Math.abs(geometry.day.y-geometry.schedule.y)<3)
 assert.ok(geometry.day.x<geometry.countdown.x)
 assert.ok(geometry.countdown.x<geometry.schedule.x)
 assert.ok(geometry.weather.y>=geometry.day.bottom-3)
 assert.ok(geometry.sources.y>=geometry.moon.y)
 assert.ok(geometry.footer.y>=geometry.sources.bottom-3)
 assert.ok(geometry.card.bottom>=geometry.footer.bottom-3)
 assert.match(geometry.countdownText,/Відлік до події/)
 assert.match(geometry.emergency,/Інформація уточнюється/)
 assert.match(geometry.entertainment,/розважальний характер/)
 assert.match(geometry.source,/ДТЕК/)
 console.log("✅ Approved landscape panels, live sources and footer verified",geometry)
}finally{
 await browser.close()
}
