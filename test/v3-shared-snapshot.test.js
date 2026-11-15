import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import {buildSharedCardSnapshot} from "../src/media.js"
import {buildCardV3Html} from "../src/card-v3.js"

test("Telegram and fullscreen share the same schedule, weather and provenance",()=>{
  const schedule=[{begin:"00:00",end:"08:30",power:false},{begin:"08:30",end:"24:00",power:true}]
  const weather={todayMin:-2,todayMax:7,tomorrowMin:0,tomorrowMax:9,fetchedAt:"2026-11-15T06:00:00Z"}
  const state=buildSharedCardSnapshot({schedule,date:"2026-11-15",label:"сьогодні",source:"ДТЕК",update:"08:35",weather})
  assert.equal(state.schemaVersion,1)
  assert.deepEqual(state.schedule,schedule)
  assert.deepEqual(state.weather,weather)
  const html=buildCardV3Html({...state,label:"сьогодні"})
  for(const t of ["00:00","08:30","24:00"])assert.ok(html.includes(t))
})
test("Pages deployment reads Telegram snapshots rather than independently fetching DTEK",()=>{
 const yaml=fs.readFileSync(new URL("../.github/workflows/pages.yml",import.meta.url),"utf8")
 assert.match(yaml,/scripts\/build-synced-viewer\.mjs/)
 assert.match(yaml,/snapshots\/web/)
 assert.match(yaml,/synced-today\.html/)
 assert.match(yaml,/synced-tomorrow\.html/)
 const entry=fs.readFileSync(new URL("../docs/synced-index.html",import.meta.url),"utf8")
 assert.match(entry,/synced-/)
})
