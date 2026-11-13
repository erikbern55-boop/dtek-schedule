import test from "node:test";
import assert from "node:assert/strict";
import {buildLiveWeatherInsetPreview} from "../src/card-v3-live-weather-preview.js";
const now=new Date("2026-11-13T09:00:00Z");
test("real weather pipeline snapshot reaches the approved artwork inset",async()=>{
 let datePassed;
 const result=await buildLiveWeatherInsetPreview({
  now,artworkUrl:"/assets/approved-clean-plate.png",
  weatherLoader:async({now:received})=>{assert.equal(received,now);return {fetchedAt:"2026-11-13T08:55:00Z"};},
  weatherMapper:(snapshot,date)=>{datePassed=date;return {date,todayDate:date,currentNowTemp:6,todayMin:1,todayMax:9};}
 });
 assert.equal(datePassed,"2026-11-13");
 assert.equal(result.weatherSource,"Open-Meteo");
 assert.match(result.html,/svitlo-weather-inset/);
 assert.match(result.html,/\+6°C/);
 assert.match(result.html,/\+1°C/);
 assert.match(result.html,/\+9°C/);
});
test("no invented readings if source fails or is stale",async()=>{
 const args={now,artworkUrl:"/assets/approved-clean-plate.png"};
 await assert.rejects(buildLiveWeatherInsetPreview({...args,weatherLoader:async()=>null}),/unavailable/);
 await assert.rejects(buildLiveWeatherInsetPreview({...args,weatherLoader:async()=>({fetchedAt:now.toISOString()}),weatherMapper:()=>({stale:true})}),/stale/);
});

test("real weather preview can opt into dynamic Kyiv date without losing temperatures",async()=>{
 const result=await buildLiveWeatherInsetPreview({
  now,artworkUrl:"/assets/approved-clean-plate.png",useWeatherHeaderDate:true,
  weatherLoader:async()=>({fetchedAt:"2026-11-13T08:55:00Z"}),
  weatherMapper:(_snapshot,date)=>({date,todayDate:date,currentNowTemp:6,todayMin:1,todayMax:9})
 });
 assert.ok(result.html.includes('class="svitlo-weather-header-date"'));
 assert.ok(result.html.includes(">13.11</span>"));
 for(const temp of ["+6°C","+1°C","+9°C"])assert.ok(result.html.includes(temp));
});
