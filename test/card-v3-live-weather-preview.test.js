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

test("dynamic date remains disabled until clean background artwork is approved",async()=>{
 const result=await buildLiveWeatherInsetPreview({
  now,artworkUrl:"/assets/approved-clean-plate.png",
  weatherLoader:async()=>({fetchedAt:"2026-11-13T08:55:00Z"}),
  weatherMapper:(_snapshot,date)=>({date,todayDate:date,currentNowTemp:6,todayMin:1,todayMax:9})
 });
 assert.ok(!result.html.includes('class="svitlo-weather-header-date"'));
 for(const temp of ["+6°C","+1°C","+9°C"])assert.ok(result.html.includes(temp));
});

test("live weather also drives garden, sowing, lunar and astro artwork fields",async()=>{
 const keys=["gardenAdvice","sowingAdvice","moonPhase","lunarDay","astroForecast"];
 const rectangles=Object.fromEntries(keys.map((k,i)=>[k,{x:40,y:650+i*110,width:1250,height:95}]));
 const result=await buildLiveWeatherInsetPreview({
  now,artworkUrl:"/assets/approved-clean-plate.png",rectangles,useDailyContent:true,
  weatherLoader:async()=>({fetchedAt:"2026-11-13T08:55:00Z"}),
  weatherMapper:(_snapshot,date)=>({date,todayDate:date,currentNowTemp:6,todayMin:1,todayMax:9})
 });
 for(const key of keys)assert.equal(typeof result.data[key],"string");
 assert.match(result.html,/data-layer="live-garden-advice"/);
 assert.match(result.html,/data-layer="live-moon-phase"/);
 assert.match(result.html,/data-layer="live-astro-forecast"/);
 assert.match(result.data.astroForecast,/розважальний/);
});
