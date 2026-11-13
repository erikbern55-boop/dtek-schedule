import test from "node:test";
import assert from "node:assert/strict";
import {buildApprovedArtworkFromSnapshots,buildApprovedArtworkFromLiveWeather} from "../src/card-v3-approved-integration.js";
const now=new Date("2026-11-13T07:00:00Z");
const schedulePeriods=[{begin:"00:00",end:"10:00",power:true},{begin:"10:00",end:"24:00",power:false}];
const keys=["powerStatus","countdown","powerPeriods","gardenAdvice","sowingAdvice","moonPhase","lunarDay","astroForecast"];
const rectangles=Object.fromEntries(keys.map((k,i)=>[k,{x:30,y:40+i*160,width:1300,height:120}]));
const weatherSnapshot={date:"2026-11-13",todayDate:"2026-11-13",currentNowTemp:6,todayMin:2,todayMax:9};
const artworkUrl="/assets/approved-clean-plate.png";
test("approved card integrates real schedule, mapped weather, garden, moon and astro without dummy values",()=>{
 const result=buildApprovedArtworkFromSnapshots({artworkUrl,rectangles,schedulePeriods,scheduleDate:"2026-11-13",weatherSnapshot,now});
 assert.equal(result.data.powerStatus,"За графіком: світло є");
 assert.equal(result.data.countdown,"01:00");
 for(const key of keys)assert.match(result.html,new RegExp('data-layer="live-'+key.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())+'"'));
 for(const t of ["+6°C","+2°C","+9°C"])assert.ok(result.html.includes(t));
 assert.match(result.html,/svitlo-weather-header-date/);
 assert.match(result.data.astroForecast,/розважальний/);
});
test("approved card fails closed when DTEK or weather is absent",()=>{
 assert.throws(()=>buildApprovedArtworkFromSnapshots({artworkUrl,rectangles,weatherSnapshot,now}),/DTEK/);
 assert.throws(()=>buildApprovedArtworkFromSnapshots({artworkUrl,rectangles,schedulePeriods,scheduleDate:"2026-11-13",now}),/weather/);
});
test("live Open-Meteo pipeline and DTEK periods enter the same approved card",async()=>{
 const result=await buildApprovedArtworkFromLiveWeather({artworkUrl,rectangles,schedulePeriods,scheduleDate:"2026-11-13",now,
  weatherLoader:async()=>({fetchedAt:"2026-11-13T06:55:00Z"}),
  weatherMapper:(_snapshot,date)=>({...weatherSnapshot,date,todayDate:date})});
 assert.equal(result.weatherSource,"Open-Meteo");
 assert.match(result.html,/data-layer="live-garden-advice"/);
 assert.match(result.html,/data-layer="live-astro-forecast"/);
 assert.match(result.html,/svitlo-weather-inset/);
});
