import test from "node:test"
import assert from "node:assert/strict"
import {buildCardV3Html} from "../src/card-v3.js"

const schedule=[
  {begin:"00:00",end:"06:00",power:true},
  {begin:"06:00",end:"13:30",power:false},
  {begin:"13:30",end:"24:00",power:true},
]
const details={schedule,date:"2026-11-10",label:"завтра",source:"ДТЕК",update:"09.11.2026 22:00",now:new Date("2026-11-09T20:00:00Z")}

test("new V3 renderer is independent and includes all real schedule periods",()=>{
  const html=buildCardV3Html(details)
  assert.match(html,/<span class="v3-brand-white">СВІТЛО<\/span>/)
  assert.match(html,/<span class="v3-brand-green">ПУЛЬС 3\.0<\/span>/)
  assert.match(html,/06:00 — 13:30/)
  assert.match(html,/13:30 — 24:00/)
  assert.match(html,/10\.11\.2026/)
  assert.match(html,/v3-row v3-power/)
  assert.match(html,/v3-sources/)
  assert.match(html,/weather-garden/)
  assert.match(html,/weather-moon/)
  assert.match(html,/weather-astro/)
  assert.doesNotMatch(html,/<button|requestFullscreen/)
})

test("V3 escapes untrusted update and source fields",()=>{
  const html=buildCardV3Html({...details,update:"<script>alert(1)</script>",source:"<test>"})
  assert.doesNotMatch(html,/<script>alert/)
  assert.match(html,/&lt;script&gt;/)
  assert.match(html,/&lt;test&gt;/)
})

test("V3 renders tomorrow and today without altering schedule data",()=>{
  const copy=JSON.stringify(schedule)
  const a=buildCardV3Html({...details,label:"сьогодні"})
  const b=buildCardV3Html(details)
  assert.match(a,/Графік сьогодні/)
  assert.match(b,/Графік завтра/)
  assert.equal(JSON.stringify(schedule),copy)
})
