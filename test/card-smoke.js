import fs from "node:fs"
import { renderCardPng } from "../src/card.js"
const schedule=[
{begin:"00:00",end:"01:30",power:false},
{begin:"01:30",end:"04:30",power:true},
{begin:"04:30",end:"12:00",power:false},
{begin:"12:00",end:"15:00",power:true},
{begin:"15:00",end:"22:30",power:false},
{begin:"22:30",end:"24:00",power:true},
]
const weather={
 currentTemp:3,min:-1,max:8,currentWind:5,rain:35,gust:11,code:2,
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
