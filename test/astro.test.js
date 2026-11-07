import test from "node:test"
import assert from "node:assert/strict"
import { astroForMoon, moonDiscSvg } from "../src/astro.js"
import { lunarForDate } from "../src/moon.js"

test("all twelve tropical Moon signs receive original, deterministic entertainment text",()=>{
 for(const sign of ["Овен","Телець","Близнюки","Рак","Лев","Діва","Терези",
  "Скорпіон","Стрілець","Козоріг","Водолій","Риби"]){
  const moon={zodiac:sign}
  const a=astroForMoon(moon)
  assert.equal(a.sign,sign)
  assert.ok(a.symbol.length>0)
  assert.ok(a.message.length>=65&&a.message.length<240,sign)
  assert.deepEqual(a,astroForMoon(moon))
 }
})

test("unknown sign safely returns neutral copy",()=>{
 const a=astroForMoon({zodiac:"?"})
 assert.equal(a.sign,"—")
 assert.ok(a.message.length>0)
})

test("moon disc is drawn according to percent illuminated instead of an emoji",()=>{
 const moon=lunarForDate("2026-11-08")
 const svg=moonDiscSvg(moon)
 assert.match(svg,/<svg class="wx-moon-disc"/)
 assert.match(svg,/<path d="M/)
 assert.match(svg,/Освітленість Місяця/)
 assert.ok(!svg.includes("🌕"))
 assert.notEqual(moonDiscSvg({illumination:1,phase:"Спадний серп"}),
  moonDiscSvg({illumination:99,phase:"Зростаючий Місяць"}))
})

test("astrology is based on the Moon date, not on the current system date",()=>{
 const d=lunarForDate("2026-11-07")
 assert.equal(astroForMoon(d).sign,d.zodiac)
 assert.ok(astroForMoon(lunarForDate("2026-11-08")).message.length>0)
})
