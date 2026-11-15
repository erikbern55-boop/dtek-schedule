import assert from "node:assert/strict"
import { test } from "node:test"
import { buildSharedCardSnapshot } from "../src/media.js"
import { buildCardV3Html } from "../src/card-v3.js"

test("Telegram and fullscreen V3 consume identical dated source snapshot", () => {
  for (const [label,day] of [["сьогодні","today"],["завтра","tomorrow"]]) {
    const input={
      date:day==="today"?"2026-11-15":"2026-11-16",
      label,source:"ДТЕК",update:"15.11.2026 08:45",
      schedule:[{begin:"00:00",end:"07:00",power:true},{begin:"07:00",end:"11:00",power:false},{begin:"11:00",end:"24:00",power:true}],
      weather:{currentTemp:3,todayMin:1,todayMax:5,tomorrowMin:0,tomorrowMax:4,sunrise:"07:12",sunset:"16:12"}
    }
    const snapshot=buildSharedCardSnapshot(input)
    assert.equal(snapshot.day,day)
    assert.equal(snapshot.date,input.date)
    assert.deepEqual(snapshot.schedule,input.schedule)
    assert.deepEqual(snapshot.weather,input.weather)
    const fullscreen=buildCardV3Html({...snapshot,label,now:new Date("2026-11-15T06:45:00Z")})
    assert.match(fullscreen,/ДТЕК/)
    assert.match(fullscreen,new RegExp(input.date.split("-").reverse().join("\\.")))
    assert.match(fullscreen,/07:00/)
    assert.match(fullscreen,/11:00/)
    assert.deepEqual(JSON.parse(JSON.stringify(snapshot)).schedule,input.schedule)
  }
})
