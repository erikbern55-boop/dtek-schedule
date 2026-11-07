import test from "node:test"
import assert from "node:assert/strict"
import { lunarForDate, nearestPastNewMoon, newMoonJde } from "../src/moon.js"

test("astronomical new-moon calculation agrees with published eclipse new moon (2024-04-08 18:21 UTC)",()=>{
 const t=new Date("2024-04-08T18:21:00Z")
 const prev=nearestPastNewMoon(new Date(t.getTime()+2*3600_000))
 const calc=new Date((prev.jd-2440587.5)*86400000)
 const diff=Math.abs(calc.getTime()-t.getTime())/60000
 assert.ok(diff<180,"Expected new moon near actual time: "+calc.toISOString())
 assert.ok(newMoonJde(prev.k+1)>prev.jd)
})

test("November 2026 new moon near 09:02 Kyiv time on November 9",()=>{
 const target=new Date("2026-11-09T07:02:00Z")
 const {jd}=nearestPastNewMoon(new Date(target.getTime()+4*3600_000))
 const calc=new Date((jd-2440587.5)*86400000)
 assert.ok(Math.abs(calc.getTime()-target.getTime())<3*3600_000,calc.toISOString())
})

test("November 7 2026 Moon is waning crescent, approx 4% illuminated in Kyiv",()=>{
 const m=lunarForDate("2026-11-07")
 assert.equal(m.date,"2026-11-07")
 assert.equal(m.phase,"Спадний серп")
 assert.ok(m.illumination>=1&&m.illumination<=9,JSON.stringify(m))
 assert.ok(m.lunarDay>=27&&m.lunarDay<=30)
 assert.match(m.newMoonUtc,/Z$/)
})

test("after new moon lunar-day count resets, while days tomorrow and today differ",()=>{
 const before=lunarForDate("2026-11-08")
 const after=lunarForDate("2026-11-10")
 assert.ok(before.lunarDay>=27)
 assert.ok(after.lunarDay<=3)
 assert.ok(after.illumination<=10)
 assert.notEqual(lunarForDate("2026-11-07").lunarDay,after.lunarDay)
})

test("new moon, quarter and full phase ranges are valid",()=>{
 for(const date of ["2026-11-09","2026-11-17","2026-11-24"]){
  const moon=lunarForDate(date)
  assert.ok(moon.illumination>=0&&moon.illumination<=100)
  assert.ok(moon.lunarDay>=1&&moon.lunarDay<=30)
  assert.ok(typeof moon.zodiac==="string"&&moon.zodiac.length>0)
 }
 assert.throws(()=>lunarForDate("wrong"),/Expected ISO/)
})
