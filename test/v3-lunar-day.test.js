import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { buildCardV3Html } from "../src/card-v3.js";
import { lunarForDate } from "../src/moon.js";

test("V3 Telegram and fullscreen show Kyiv-noon lunar day without clipping", async () => {
  const date="2026-11-15";
  const expected=lunarForDate(date,12).lunarDay;
  const schedule=[{begin:"00:00",end:"24:00",power:true}];
  const weather={
    currentTemp:4,currentNowTemp:4,currentNowCode:2,currentNowWind:4,
    todayDate:date,todayMin:0,todayMax:6,todayRain:20,todayGust:8,
    tomorrowDate:"2026-11-16",tomorrowMin:0,tomorrowMax:6,
    min:0,max:6,currentWind:4,rain:20,gust:8,code:2,
    soilTemp:4,soilAt:"12:00",soilDepthCm:6,
    sunrise:"07:13",sunset:"16:14",warnings:[],
    fetchedAt:"2026-11-15T10:00:00.000Z",stale:false
  };
  const html=buildCardV3Html({schedule,date,label:"сьогодні",source:"ДТЕК",
    update:"15.11.2026 12:00",now:new Date("2026-11-15T10:00:00Z"),weather});
  assert.match(html,/Місячний день \(12:00, Київ\):/);
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1404,height:900},deviceScaleFactor:1});
    await page.setContent(html,{waitUntil:"domcontentloaded"});
    const moon=page.locator(".v3-weather .weather-moon");
    const row=moon.locator(".wx-moon-row").first();
    const value=row.locator(".wx-lunar-day");
    assert.equal(await value.innerText(),expected+"-й");
    assert.match(await row.innerText(),/Місячний день \(12:00, Київ\):/);
    assert.equal(await row.isVisible(),true);
    const geometry=await page.evaluate(()=>{
      const panel=document.querySelector(".v3-weather .weather-moon");
      const row=panel.querySelector(".wx-moon-row");
      const value=row.querySelector(".wx-lunar-day");
      const p=panel.getBoundingClientRect(),r=row.getBoundingClientRect(),v=value.getBoundingClientRect();
      return {panel:{left:p.left,right:p.right,top:p.top,bottom:p.bottom},
        row:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},
        value:{left:v.left,right:v.right,top:v.top,bottom:v.bottom},
        clipped:row.scrollWidth>row.clientWidth+2};
    });
    assert.ok(geometry.row.top>=geometry.panel.top-2 && geometry.row.bottom<=geometry.panel.bottom+2,
      "lunar-day row must remain inside moon panel");
    assert.ok(geometry.value.left>=geometry.panel.left-2 && geometry.value.right<=geometry.panel.right+2,
      "lunar-day value must be visible inside moon panel");
    assert.equal(geometry.clipped,false,"lunar-day row must not overflow");
    console.log("PASS: V3 lunar day at Kyiv noon",expected,geometry);
  } finally { await browser.close(); }
});
