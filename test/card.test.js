import test from "node:test"
import assert from "node:assert/strict"
import { arcPath, buildCardHtml, buildDial, buildTimeline, nearestEvent } from "../src/card.js"
import { buildCaption, imageNeedsRefresh, CARD_RENDER_VERSION } from "../src/media.js"

const example = [
  {begin:"00:00",end:"06:00",power:true},
  {begin:"06:00",end:"13:30",power:false},
  {begin:"13:30",end:"16:30",power:true},
  {begin:"16:30",end:"23:30",power:false},
  {begin:"23:30",end:"24:00",power:true},
]
const details = {
  schedule:example, date:"2026-11-03",label:"завтра",
  source:"ДТЕК",update:"02.11.2026 19:48",now:new Date("2026-11-02T19:30:00Z"),
}

test("ring and linear timeline have the same five exact periods", () => {
  const svg = buildDial(example)
  const timeline = buildTimeline(example)
  assert.equal((svg.match(/<path /g)||[]).length,5)
  assert.equal((timeline.match(/<span style=/g)||[]).length,5)
  assert.match(timeline,/width:25.0000%;background:#30f176/)
  assert.match(timeline,/width:31.2500%;background:#ff5264/)
  assert.match(timeline,/width:29.1667%;background:#ff5264/)
})
test("full day outage and full day supply yield valid SVG arcs", () => {
  for(const power of [true,false]){
    const schedule = [{begin:"00:00",end:"24:00",power}]
    assert.match(buildDial(schedule),/ A 185 185 0 1 1 /)
    assert.match(buildTimeline(schedule),/width:100.0000%/)
  }
  assert.throws(()=>arcPath(300,250),/Invalid/)
})
test("card includes Ukrainian branding and correct schedule", () => {
  const html=buildCardHtml(details)
  assert.match(html,/СВІТЛО/)
  assert.match(html,/06:00 — 13:30/)
  assert.match(html,/16:30 — 23:30/)
  assert.match(html,/9 год 30 хв/)
  assert.match(html,/14 год 30 хв/)
  assert.match(html,/03.11.2026/)
  assert.match(html,/class="robot"/)
})
test("next outage respects Kyiv local date and time",()=>{
  assert.match(nearestEvent(example,"2026-11-03",new Date("2026-11-02T19:30:00Z")),/06:00/)
  assert.match(nearestEvent(example,"2026-11-03",new Date("2026-11-03T08:00:00Z")),/13:30/)
  assert.match(nearestEvent(example,"2026-11-03",new Date("2026-11-03T12:00:00Z")),/16:30/)
  assert.match(nearestEvent(example,"2026-11-03",new Date("2026-11-03T21:50:00Z")),/Більше/)
})
test("caption includes outages and totals in Telegram safe length",()=>{
  const c=buildCaption(details)
  assert.ok(c.length<1024)
  assert.match(c,/🪫 <code>06:00 — 13:30<\/code>/)
  assert.match(c,/9 год 30 хв/)
  assert.match(c,/14 год 30 хв/)
})
test("caption escapes HTML in externally supplied update",()=>{
  const c=buildCaption({...details,update:"<error>&"})
  assert.match(c,/&lt;error&gt;&amp;/)
})
test("long schedule caption remains within Telegram 1024 character limit",()=>{
  const schedule=Array.from({length:48},(_,i)=>({
    begin:String(Math.floor(i/2)).padStart(2,"0")+":"+(i%2?"30":"00"),
    end:String(Math.floor((i+1)/2)).padStart(2,"0")+":" + ((i+1)%2?"30":"00"),
    power:i%2===0,
  }))
  const c=buildCaption({...details,schedule,changeSummary:"⚠️ <b>Графік змінено</b>"})
  assert.ok(c.length<=1024)
  assert.match(c,/🟢 Зі світлом/)
})

test("visual-version changes force exactly one Telegram image redraw",()=>{
 const base={source:"ДТЕК",update:"08.11.2026 12:00",weatherStamp:"fresh:2026-11-08T10:00:00Z"}
 const noVersion={...base}
 const changed={...base,renderVersion:"earlier-layout"}
 const current={...base,renderVersion:CARD_RENDER_VERSION}
 for(const state of [noVersion,changed]){
  assert.equal(imageNeedsRefresh(state,base),true)
 }
 assert.equal(imageNeedsRefresh(current,base),false)
 assert.equal(imageNeedsRefresh(current,{...base,weatherStamp:"fresh:new"}),true)
 assert.equal(imageNeedsRefresh(current,{...base,source:"ДТЕК (резервні дані)"}),true)
 assert.equal(imageNeedsRefresh(current,{...base,update:"new data"}),true)
})

test("emergency messages do NOT claim a verified accident or clear network",()=>{
 const h=buildCardHtml(details)
 assert.match(h,/Аварійні відключення/)
 assert.match(h,/Інформація уточнюється/)
 assert.match(h,/Автоматичного підтвердження аварій/)
 assert.doesNotMatch(h,/Аварійних відключень не зафіксовано/)
 const caption=buildCaption(details)
 assert.match(caption,/автоматичної перевірки/)
 assert.match(caption,/www\.dtek-krem\.com\.ua\/ua\/shutdowns/)
 assert.ok(caption.length<=1024)
})
test("five-minute countdown bucket only invalidates photo once per interval",()=>{
 const base={source:"ДТЕК",update:"08.11.2026 12:00",
   weatherStamp:"fresh:2026-11-08T10:00:00Z",countdownTick:2234}
 const current={...base,renderVersion:CARD_RENDER_VERSION}
 assert.equal(imageNeedsRefresh(current,base),false)
 assert.equal(imageNeedsRefresh(current,{...base,countdownTick:2235}),true)
 assert.equal(imageNeedsRefresh({...current,countdownTick:undefined},base),true)
 // Tomorrow's card has no ticking countdown; null is stable.
 assert.equal(imageNeedsRefresh({...current,countdownTick:null},
  {...base,countdownTick:null}),false)
})


test("public viewer has no legacy navigation or fullscreen controls", async () => {
  const { readFileSync } = await import("node:fs")
  const page = readFileSync(new URL("../docs/index.html", import.meta.url), "utf8")
  assert.match(page, /Світлопульс 3\.0/)
  assert.match(page, /day==='tomorrow'\?'tomorrow':'today'/)
  assert.doesNotMatch(page, /<button\b|<nav\b|СВІТЛОПУЛЬС 2\.3/)
  assert.match(page, /<img id="card"/)
})
