import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { buildCardV3Html } from "../src/card-v3.js"
import { buildCaption, CARD_RENDER_VERSION } from "../src/media.js"

const sample = [
  {begin:"00:00",end:"06:00",power:true},
  {begin:"06:00",end:"13:30",power:false},
  {begin:"13:30",end:"16:30",power:true},
  {begin:"16:30",end:"23:30",power:false},
  {begin:"23:30",end:"24:00",power:true},
]
const details={schedule:sample,date:"2026-11-15",label:"завтра",source:"ДТЕК",update:"2026-11-14",now:new Date("2026-11-14T20:00:00Z")}
test("isolated V3 card renders exact outage intervals",()=>{
 const html=buildCardV3Html(details)
 assert.match(html,/Світлопульс|СВІТЛОПУЛЬС/i)
 for(const t of ["00:00","06:00","13:30","16:30","23:30","24:00"])assert.ok(html.includes(t),"Missing "+t)
 assert.ok(html.includes("v3-clock"))
})
test("notification delivery and existing image renderer remain unchanged",()=>{
 const media=fs.readFileSync(new URL("../src/media.js",import.meta.url),"utf8")
 assert.match(media,/import \{ renderCardPng, buildCardHtml \} from "\.\/card\.js"/)
 assert.doesNotMatch(media,/from "\.\/card-v3\.js"/)
 assert.match(media,/editMessageMedia/)
 assert.match(media,/sendPhoto/)
 assert.match(media,/editMessageCaption/)
 assert.match(media,/sendMessage/)
 assert.match(media,/saveLastMessage/)
 assert.match(media,/imageNeedsRefresh/)
 assert.ok(CARD_RENDER_VERSION)
 assert.match(buildCaption({...details,message:{},changeSummary:""}),/ДТЕК/)
})
test("isolated branch does not modify schedule and notification workflows",()=>{
 for(const p of [".github/workflows/schedule.yml",".github/workflows/pages.yml","src/schedule.js","src/source.js"]){
  assert.ok(fs.existsSync(new URL("../"+p,import.meta.url)),p)
 }
})
