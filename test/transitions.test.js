import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  plannedTransitions, duePlannedTransitions, formatTransitionMessage,
  publishDueTransitions, loadSentTransitionIds, saveSentTransitionIds,
} from "../src/transitions.js"

const planned = [
  { begin:"00:00", end:"06:00", power:true },
  { begin:"06:00", end:"13:30", power:false },
  { begin:"13:30", end:"16:30", power:true },
  { begin:"16:30", end:"23:30", power:false },
  { begin:"23:30", end:"24:00", power:true },
]
const date = "2026-11-03"
function localAt(hour, minute = "00") {
  return new Date("2026-11-03T" + hour + ":" + minute + ":00+02:00")
}

test("the graph produces four planned switching events with correct times", () => {
  const events = plannedTransitions(planned, date)
  assert.deepEqual(events.map(e => [e.clock, e.period.power]), [
    ["06:00",false], ["13:30",true],
    ["16:30",false], ["23:30",true],
  ])
  assert.equal(new Set(events.map(e => e.id)).size,4)
})

test("the bot does not assume a midnight transition without prior-day data", () => {
  const events = plannedTransitions([{begin:"00:00",end:"24:00",power:false}],date)
  assert.deepEqual(events,[])
})

test("only matching schedule date in Kyiv sends; neither early nor stale events are sent", () => {
  assert.equal(duePlannedTransitions(planned,date,localAt("05","59")).length,0)
  assert.equal(duePlannedTransitions(planned,date,localAt("06","00")).length,1)
  assert.equal(duePlannedTransitions(planned,date,localAt("06","09")).length,1)
  assert.equal(duePlannedTransitions(planned,date,localAt("06","13")).length,0)
  assert.deepEqual(duePlannedTransitions(planned,date,localAt("14","20")),[])
  assert.deepEqual(duePlannedTransitions(planned,date,new Date("2026-11-02T06:00:00+02:00")),[])
  assert.deepEqual(duePlannedTransitions(planned,date,new Date("2026-11-04T06:00:00+02:00")),[])
})

test("message explicitly says planned, not physically verified; duration/next time are correct",()=>{
  const e=plannedTransitions(planned,date)
  const off=formatTransitionMessage(e[0])
  assert.match(off,/06:00 · Планове відключення/)
  assert.match(off,/06:00 — 13:30/)
  assert.match(off,/7 год 30 хв/)
  assert.match(off,/13:30/)
  assert.match(off,/фактична наявність електрики не вимірюється/)
  const on=formatTransitionMessage(e[1],"резервна копія даних ДТЕК")
  assert.match(on,/13:30 · Планове відновлення/)
  assert.match(on,/16:30 — 23:30/)
  assert.match(on,/резервні дані/)
  assert.doesNotMatch(on,/Світло з'явилося|Світло зникло/)
})

test("repeat polls produce one message per event; separate events still produce alerts",async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"svitlopuls-transitions-"))
  const file=path.join(dir,"transition-events.json")
  const sent=[]
  const sender=async text=>{sent.push(text)}
  try{
    const first=await publishDueTransitions({schedule:planned,date,now:localAt("06","05"),stateFile:file,sender})
    assert.equal(first.length,1)
    const second=await publishDueTransitions({schedule:planned,date,now:localAt("06","10"),stateFile:file,sender})
    assert.deepEqual(second,[])
    const third=await publishDueTransitions({schedule:planned,date,now:localAt("13","35"),stateFile:file,sender})
    assert.equal(third.length,1)
    assert.equal(sent.length,2)
    assert.equal(loadSentTransitionIds(file).length,2)
  } finally {fs.rmSync(dir,{recursive:true,force:true})}
})

test("failed Telegram delivery does not mark a transition as sent; next check can retry",async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"svitlopuls-retries-"))
  const file=path.join(dir,"state.json")
  try{
    await assert.rejects(
      publishDueTransitions({schedule:planned,date,now:localAt("06","02"),
        stateFile:file,sender:async()=>{throw new Error("telegram unavailable")}}),
      /telegram unavailable/
    )
    assert.deepEqual(loadSentTransitionIds(file),[])
    const retry=await publishDueTransitions({
      schedule:planned,date,now:localAt("06","05"),stateFile:file,sender:async()=>{},
    })
    assert.equal(retry.length,1)
  } finally {fs.rmSync(dir,{recursive:true,force:true})}
})

test("invalid state stops duplicate-risk sends rather than resetting deduplication",async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"svitlopuls-state-"))
  const file=path.join(dir,"state.json")
  try{
    fs.writeFileSync(file,'{"sent":"bad"}')
    assert.throws(()=>loadSentTransitionIds(file),/Invalid transition state/)
    await assert.rejects(publishDueTransitions({
      schedule:planned,date,now:localAt("06","05"),stateFile:file,sender:async()=>{},
    }),/Invalid transition state/)
    saveSentTransitionIds(["2026-11-03|06:00|off"],file)
    assert.deepEqual(loadSentTransitionIds(file),["2026-11-03|06:00|off"])
  } finally {fs.rmSync(dir,{recursive:true,force:true})}
})

test("changed schedule uses new event times, with no messages for removed boundaries",()=>{
  const changed=[
    {begin:"00:00",end:"06:30",power:true},
    {begin:"06:30",end:"13:00",power:false},
    {begin:"13:00",end:"24:00",power:true},
  ]
  assert.deepEqual(duePlannedTransitions(changed,date,localAt("06","05")),[])
  assert.equal(duePlannedTransitions(changed,date,localAt("06","30"))[0].clock,"06:30")
})

test("after late-evening planned restoration no further outage is promised",()=>{
  const event=plannedTransitions(planned,date).at(-1)
  assert.match(formatTransitionMessage(event),/Більше планових відключень сьогодні немає/)
})
