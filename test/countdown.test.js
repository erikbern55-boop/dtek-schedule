import test from "node:test"
import assert from "node:assert/strict"
import { nextPowerEvent } from "../src/countdown.js"

const schedule=[
 {begin:"00:00",end:"01:30",power:true},
 {begin:"01:30",end:"05:30",power:false},
 {begin:"05:30",end:"12:00",power:true},
 {begin:"12:00",end:"19:30",power:false},
 {begin:"19:30",end:"22:30",power:true},
 {begin:"22:30",end:"24:00",power:false},
]
const date="2026-11-08"

test("when light is scheduled OFF, countdown is to scheduled switch-ON",()=>{
 const e=nextPowerEvent(schedule,date,new Date("2026-11-08T15:15:00Z"))
 assert.equal(e.kind,"countdown")
 assert.equal(e.title,"До планового ввімкнення")
 assert.equal(e.detail,"Очікуване ввімкнення: 19:30")
 assert.equal(e.remaining,"02:15")
 assert.equal(e.minutesRemaining,135)
 assert.equal(e.currentPower,false)
})

test("when light is scheduled ON, countdown is to scheduled switch-OFF",()=>{
 const e=nextPowerEvent(schedule,date,new Date("2026-11-08T09:30:00Z"))
 assert.equal(e.title,"До планового вимкнення")
 assert.equal(e.detail,"Очікуване вимкнення: 12:00")
 assert.equal(e.remaining,"00:30")
 assert.equal(e.currentPower,true)
})

test("boundary switches to next event and countdown never becomes negative",()=>{
 const before=nextPowerEvent(schedule,date,new Date("2026-11-08T17:29:00Z"))
 assert.equal(before.remaining,"00:01")
 const at=nextPowerEvent(schedule,date,new Date("2026-11-08T17:30:00Z"))
 assert.equal(at.title,"До планового вимкнення")
 assert.equal(at.remaining,"03:00")
 assert.equal(at.time,"22:30")
})

test("last period counts down to midnight without inventing tomorrow switch",()=>{
 const e=nextPowerEvent(schedule,date,new Date("2026-11-08T21:00:00Z"))
 assert.equal(e.kind,"countdown")
 assert.equal(e.remaining,"01:00")
 assert.match(e.title,/завершення добового графіка/)
})

test("tomorrow card does not show a ticking timer for today's time",()=>{
 const e=nextPowerEvent(schedule,date,new Date("2026-11-07T19:00:00Z"))
 assert.equal(e.kind,"future")
 assert.equal(e.title,"Перша зміна графіка")
 assert.equal(e.time,"01:30")
 assert.equal(e.detail,"Завтра о 01:30")
 assert.equal(e.remaining,undefined)
})

test("no transitions are handled without promises about actual grid status",()=>{
 const continuous=[{begin:"00:00",end:"24:00",power:true}]
 const today=nextPowerEvent(continuous,date,new Date("2026-11-08T10:00:00Z"))
 assert.equal(today.kind,"countdown")
 assert.equal(today.remaining,"14:00")
 const tomorrow=nextPowerEvent(continuous,date,new Date("2026-11-07T18:00:00Z"))
 assert.equal(tomorrow.kind,"future")
 assert.match(tomorrow.title,/не заплановані/)
})

test("Kyiv time zone, not runner time zone, controls schedule calculation",()=>{
 const e=nextPowerEvent(schedule,date,new Date("2026-11-08T00:00:00Z"))
 assert.equal(e.title,"До планового ввімкнення")
 assert.equal(e.remaining,"03:30")
})

test("old dates return non-counting status",()=>{
 const e=nextPowerEvent(schedule,"2026-11-07",new Date("2026-11-08T10:00:00Z"))
 assert.equal(e.kind,"past")
})
