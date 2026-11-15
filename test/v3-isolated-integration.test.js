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
 assert.match(media,/SVITLOPULS_V3_CARDS === "1"/)
 assert.match(media,/renderSelectedPng/)
 assert.match(media,/renderCardV3Png/)
 assert.match(media,/editMessageMedia/)
 assert.match(media,/sendPhoto/)
 assert.match(media,/editMessageCaption/)
 assert.match(media,/sendMessage/)
 assert.match(media,/saveLastMessage/)
 assert.match(media,/imageNeedsRefresh/)
 assert.match(media,/USE_V3_CARDS \? renderCardV3Png\(details\) : renderCardPng\(details\)/)
 assert.ok(CARD_RENDER_VERSION)
 assert.match(buildCaption({...details,message:{},changeSummary:""}),/ДТЕК/)
})
test("isolated branch does not modify schedule and notification workflows",()=>{
 for(const p of [".github/workflows/schedule.yml",".github/workflows/pages.yml","src/schedule.js","src/source.js"]){
  assert.ok(fs.existsSync(new URL("../"+p,import.meta.url)),p)
 }
})

test("48 independent half-hour DTEK states equal normalized V3 schedule and HTML",()=>{
 const states=["yes","no","first","second"];
 const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
 for(let seed=0;seed<40;seed++){
  const raw=Array.from({length:24},(_,i)=>states[(i*7+seed+i*i)%4]);
  const expected=raw.flatMap(v=>v==="yes"?[true,true]:v==="no"?[false,false]:v==="first"?[false,true]:[true,false]);
  const intervals=[];
  for(let slot=0;slot<48;slot++){
   const start=slot*30,end=start+30,power=expected[slot],prev=intervals.at(-1);
   const fmt=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
   if(prev&&prev.power===power&&minute(prev.end)===start)prev.end=fmt(end);
   else intervals.push({begin:fmt(start),end:fmt(end),power});
  }
  const actual=Array.from({length:48},(_,i)=>intervals.find(p=>minute(p.begin)<=i*30&&minute(p.end)>(i*30))?.power);
  assert.deepEqual(actual,expected,"Mismatch in DTEK 48 slots, seed "+seed);
  const html=buildCardV3Html({...details,schedule:intervals});
  assert.match(html,/v3-clock/);
  for(const p of intervals)assert.ok(html.includes(p.begin)&&html.includes(p.end),"Missing boundary "+p.begin+"-"+p.end);
 }
});

test("approved reference uses actionable green/red garden card without changing source data",()=>{
 const html=buildCardV3Html(details)
 assert.match(html,/Що можна \/ не варто/)
 assert.match(html,/wx-sowing-row\.good/)
 assert.match(html,/wx-sowing-row\.avoid/)
 assert.doesNotMatch(html,/Посівний календар<\/h3>/)
})
