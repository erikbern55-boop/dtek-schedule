import fs from "node:fs"
import assert from "node:assert/strict"
import {chromium} from "playwright"
import {buildApprovedCardHtml,renderApprovedCardPng} from "../src/card-approved.js"
const schedule=[{begin:"00:00",end:"19:30",power:true},{begin:"19:30",end:"24:00",power:false}]
const weather={currentNowTemp:7,currentTemp:7,currentNowCode:2,todayMin:3,todayMax:8,todayRain:3,todayGust:6,currentNowWind:1,tomorrowDate:"2026-11-10",tomorrowCode:63,tomorrowMin:3,tomorrowMax:8,sunrise:"07:03",sunset:"16:23",soilTemp:4,soilAt:"18:00",fetchedAt:"2026-11-09T16:30:00Z",stale:false}
const data={schedule,date:"2026-11-09",label:"сьогодні",weather,update:"09.11.2026 18:32",now:new Date("2026-11-09T16:32:00Z")}
const html=buildApprovedCardHtml(data)
assert.match(html,/00:58/)
assert.match(html,/19:30/)
assert.match(html,/Поради городникам/)
assert.match(html,/Астропрогноз дня/)
assert.match(html,/approved-lunar-texture/)
assert.match(html,/approved-lunar-lit/)
assert.match(html,/Опади: 3 мм/)
// The approved visual composition must remain data-driven, not a static reference image.
const alternate=buildApprovedCardHtml({...data,date:"2026-11-10",weather:{...weather,currentNowTemp:12,todayRain:8,soilTemp:6},update:"10.11.2026 18:32"})
assert.match(alternate,/Опади: 8 мм/)
assert.match(alternate,/10\\.11\\.2026 18:32/)
assert.match(alternate,/\\+12°C/)
assert.doesNotMatch(alternate,/Опади: 3 мм/)
assert.notEqual(alternate,html)

const noSun=buildApprovedCardHtml({...data,weather:{...weather,sunrise:null,sunset:null}})
assert.match(noSun,/Світловий день<\/h2><div class="daylength">—<\/div>/)
assert.doesNotMatch(noSun,/24 год 0 хв/)
assert.doesNotMatch(buildApprovedCardHtml({...data,weather:{...weather,stale:true}}),/class="bigicon">🌤️<\/div>/)
assert.match(html,/🌧️<\/div><div class="temp-range">/)
assert.doesNotMatch(buildApprovedCardHtml({...data,weather:{...weather,stale:true}}),/🌧️<\/div><div class="temp-range">/)
const staleHtml=buildApprovedCardHtml({...data,weather:{...weather,stale:true}})
assert.match(staleHtml,/Вітер: —/)
assert.match(staleHtml,/Опади: —/)
assert.match(staleHtml,/Пориви: —/)
assert.doesNotMatch(staleHtml,/Опади: 3 мм/)
const png=await renderApprovedCardPng(data)
// PNG IHDR stores the actual output dimensions; guard against a silent 1170×1280 regression.
assert.equal(png.toString("ascii",1,4),"PNG")
assert.equal(png.readUInt32BE(16),1404)
assert.equal(png.readUInt32BE(20),1536)
fs.writeFileSync("svitlopuls-approved-preview.png",png)
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({viewport:{width:1404,height:1536}})
 await page.setContent(html)
 const v=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,overflow:[...document.querySelectorAll(".panel")].filter(x=>x.scrollHeight>x.clientHeight+5).map(x=>x.querySelector("h2")?.textContent)}))
 console.log("Approved-layout dimensions",JSON.stringify(v))
 assert.equal(v.w,1404)
 assert.equal(v.h,1536)
 if(v.overflow.length)console.warn("Panels needing visual refinement:",v.overflow)
}finally{await browser.close()}
