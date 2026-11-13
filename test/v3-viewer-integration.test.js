import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {saveViewerSnapshot} from "../src/media.js"

const details={
 schedule:[{begin:"00:00",end:"07:20",power:false},{begin:"07:20",end:"24:00",power:true}],
 date:"2026-11-13",label:"сьогодні",source:"ДТЕК",update:"13.11.2026 12:30",
 weather:null,now:new Date("2026-11-13T10:30:00Z")
}

test("opt-in V3 preview uses the real viewer snapshot input without replacing production HTML",()=>{
 const cwd=process.cwd(),prior=process.env.SVITLOPULS_V3_PREVIEW
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"svitlopuls-v3-"))
 try{
  process.chdir(tmp)
  delete process.env.SVITLOPULS_V3_PREVIEW
  saveViewerSnapshot(Buffer.from("test-image"),"сьогодні",details)
  const original=fs.readFileSync("artifacts/web/today.html","utf8")
  assert.match(original,/<html|<!doctype/i)
  assert.equal(fs.existsSync("artifacts/web/v3-today.html"),false,"V3 stays off by default")
  process.env.SVITLOPULS_V3_PREVIEW="1"
  saveViewerSnapshot(Buffer.from("test-image"),"сьогодні",details)
  const v3=fs.readFileSync("artifacts/web/v3-today.html","utf8")
  assert.match(v3,/СВІТЛО/)
  assert.match(v3,/00:00 — 07:20/)
  assert.match(v3,/13\.11\.2026 12:30/)
  assert.match(v3,/weather-garden/)
  assert.equal(fs.readFileSync("artifacts/web/today.html","utf8"),original,"production viewer unchanged")
  assert.equal(fs.readFileSync("artifacts/web/today.png","utf8"),"test-image")
 }finally{
  process.chdir(cwd)
  if(prior===undefined)delete process.env.SVITLOPULS_V3_PREVIEW
  else process.env.SVITLOPULS_V3_PREVIEW=prior
  fs.rmSync(tmp,{recursive:true,force:true})
 }
})
