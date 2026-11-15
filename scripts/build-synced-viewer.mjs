import fs from "node:fs"
import path from "node:path"
import {buildCardV3Html} from "../src/card-v3.js"

// Generate fullscreen HTML from the exact snapshots used for Telegram images.
// This is a staging-only build step; it never posts to Telegram.
const source=process.argv[2]||"artifacts/web"
const destination=process.argv[3]||"dist"
fs.mkdirSync(destination,{recursive:true})
for(const day of ["today","tomorrow"]){
  const input=path.join(source,day+".json")
  if(!fs.existsSync(input))throw Error("Missing Telegram snapshot: "+input)
  const state=JSON.parse(fs.readFileSync(input,"utf8"))
  if(state.schemaVersion!==1||state.day!==day||!Array.isArray(state.schedule)||!state.date)throw Error("Invalid snapshot "+day)
  const label=day==="today"?"сьогодні":"завтра"
  const html=buildCardV3Html({schedule:state.schedule,date:state.date,label,source:state.source,update:state.update,weather:state.weather})
  for(const interval of state.schedule){
    if(!html.includes(interval.begin)||!html.includes(interval.end))throw Error("Missing interval "+interval.begin+"-"+interval.end)
  }
  fs.writeFileSync(path.join(destination,day+".html"),html)
  fs.writeFileSync(path.join(destination,day+".json"),JSON.stringify(state,null,2)+"\n")
  console.log("SYNC VERIFIED",day,state.date,state.schedule.length)
}
