import fs from "node:fs"
import { renderCardPng } from "../src/card.js"
const schedule=[
{begin:"00:00",end:"06:00",power:true},
{begin:"06:00",end:"13:30",power:false},
{begin:"13:30",end:"16:30",power:true},
{begin:"16:30",end:"23:30",power:false},
{begin:"23:30",end:"24:00",power:true},
]
const png=await renderCardPng({
  schedule,date:"2026-11-03",label:"завтра",
  update:"02.11.2026 19:48",source:"ДТЕК",
  now:new Date("2026-11-02T19:30:00Z"),
})
if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error("Invalid PNG")
if(png.length<20000)throw Error("Rendered PNG is suspiciously small")
fs.writeFileSync("svitlopuls-preview.png",png)
console.log("✅ Generated PNG card:",png.length,"bytes")
