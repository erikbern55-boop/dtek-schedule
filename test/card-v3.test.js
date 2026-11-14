import test from "node:test"
import assert from "node:assert/strict"
import {buildCardV3Html} from "../src/card-v3.js"
import {buildViewerV3Preview} from "../src/media.js"

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

test("V3 uses date-specific Ukrainian weekdays for today and tomorrow",()=>{
  const tuesday=buildCardV3Html(details)
  const wednesday=buildCardV3Html({...details,date:"2026-11-11",label:"сьогодні"})
  assert.match(tuesday,/<span class="v3-weekday">вівторок<\/span>/)
  assert.match(wednesday,/<span class="v3-weekday">середа<\/span>/)
  assert.match(wednesday,/11\.11\.2026/)
})

test("V3 keeps the approved garden and sowing panels distinct",()=>{
  const html=buildCardV3Html(details)
  assert.match(html,/class="wx-box weather-garden"/)
  assert.match(html,/class="wx-box weather-sowing"/)
  assert.match(html,/Посівний календар/)
})


test("V3 mascot keeps turquoise neon palette and lightning insignia",()=>{
  const html=buildCardV3Html(details)
  assert.match(html,/aria-label="Бірюзовий робот Світлопульсу з блискавкою"/)
  assert.match(html,/<linearGradient id="v3bot"/)
  assert.match(html,/stop-color="#74f8ed"/)
  assert.match(html,/stop-color="#2bc8c7"/)
  assert.match(html,/fill="#e7ff45"/)
})


test("V3 neon wordmark includes an actual vector pulse rather than a placeholder glyph",()=>{
  const html=buildCardV3Html(details)
  assert.match(html,/<span class="v3-brand-white">СВІТЛО<\/span>/)
  assert.match(html,/<span class="v3-brand-green">ПУЛЬС 3\.0<\/span>/)
  assert.match(html,/<span class="v3-pulse-mark" aria-hidden="true"><svg viewBox="0 0 100 46"/)
  assert.match(html,/M2 25H22L31 13L43 38L55 5L66 25H98/)
  assert.doesNotMatch(html,/<span class="v3-pulse-mark"[^>]*>⌁<\/span>/)
})


test("V3 gardening artwork uses a real garlic photograph with descriptive alternative text",()=>{
  const html=buildCardV3Html(details)
  assert.match(html,/<div class="wx-garden-art"><img src="https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/[^"]+\.jpg\?width=\d+"/)
  assert.match(html,/alt="Фотографія головок часнику"/)
  assert.doesNotMatch(html,/<div class="wx-garden-art"><svg/)
})

test("V3 countdown preserves the approved heading without repeating event title",()=>{
  const html=buildCardV3Html(details)
  assert.match(html,/<h2 class="v3-title">⏱ Відлік до події<\/h2>/)
  const panel=html.match(/<section class="v3-panel v3-count">([\s\S]*?)<\/section>/)?.[1]
  assert.ok(panel,"countdown panel exists")
  assert.match(panel,/<div class="v3-count-event">[^<]+<\/div>/)
  assert.match(panel,/<div class="v3-clock" data-countdown-minutes="[^"]*">/)
  const title=panel.match(/<div class="v3-count-event">([^<]+)<\/div>/)?.[1]
  const detail=panel.match(/<div class="v3-next">([^<]*)<\/div>/)?.[1]
  assert.ok(title&&detail,"event and explanatory detail exist")
  assert.ok(!detail.startsWith(title),"event title is not duplicated in explanatory detail")
})

test("V3 updates displayed schedule from supplied live data, without stale fixture periods",()=>{
  const changed=[{begin:"00:00",end:"08:15",power:false},{begin:"08:15",end:"24:00",power:true}]
  const html=buildCardV3Html({...details,schedule:changed,update:"13.11.2026 12:30"})
  assert.match(html,/00:00 — 08:15/)
  assert.match(html,/08:15 — 24:00/)
  assert.doesNotMatch(html,/06:00 — 13:30/)
  assert.match(html,/13\.11\.2026 12:30/)
})

test("V3 preview adapter uses live schedule and weather while production viewer remains unchanged",async()=>{
  const {buildViewerV3Preview}=await import("../src/media.js")
  const weather={
    currentNowTemp:17,todayMin:6,todayMax:19,tomorrowMin:3,tomorrowMax:12,
    currentNowWind:5,todayRain:10,todayGust:13,
    soilTemp:9,sunrise:"07:21",sunset:"16:31",
    fetchedAt:"2026-11-13T09:00:00.000Z"
  }
  const live=[{begin:"00:00",end:"09:45",power:false},{begin:"09:45",end:"24:00",power:true}]
  const html=buildViewerV3Preview({...details,schedule:live,weather,update:"13.11.2026 11:45"})
  assert.match(html,/00:00 — 09:45/)
  assert.doesNotMatch(html,/06:00 — 13:30/)
  assert.match(html,/\+17°C/)
  assert.match(html,/13\.11\.2026 11:45/)
  assert.match(html,/weather-moon/)
  assert.match(html,/weather-astro/)
  const {readFileSync}=await import("node:fs")
  const media=readFileSync(new URL("../src/media.js",import.meta.url),"utf8")
  assert.match(media,/if \(process\.env\.SVITLOPULS_V3_PREVIEW === "1"\)/)
  assert.match(media,/const html = buildCardHtml\(details\)/)
})

test("V3 viewer preview uses the same supplied schedule and weather as the live snapshot",()=>{
  const scheduleA=[{begin:"00:00",end:"05:45",power:false},{begin:"05:45",end:"24:00",power:true}]
  const scheduleB=[{begin:"00:00",end:"09:10",power:true},{begin:"09:10",end:"24:00",power:false}]
  const a=buildViewerV3Preview({...details,schedule:scheduleA,update:"13.11.2026 13:00"})
  const b=buildViewerV3Preview({...details,schedule:scheduleB,update:"13.11.2026 13:05"})
  assert.equal(a,buildCardV3Html({...details,schedule:scheduleA,update:"13.11.2026 13:00"}))
  assert.match(a,/00:00 — 05:45/)
  assert.match(b,/09:10 — 24:00/)
  assert.doesNotMatch(b,/00:00 — 05:45/)
  assert.match(b,/13\.11\.2026 13:05/)
  assert.match(b,/weather-garden/)
  assert.match(b,/weather-moon/)
})

test("V3 preview keeps internal credentials and injected markup out of public HTML",()=>{
  const html=buildViewerV3Preview({...details,update:'<img src=x onerror=alert(1)>',source:'<script>unsafe</script>'})
  assert.doesNotMatch(html,/<script>unsafe<\/script>/)
  assert.doesNotMatch(html,/<img src=x onerror=alert\(1\)>/)
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(html,/TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|process\.env\./)
})
