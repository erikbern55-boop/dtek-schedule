import test from "node:test";
import assert from "node:assert/strict";
import {periodsFromDtekFact,buildApprovedArtworkFromLiveSources} from "../src/card-v3-live-sources.js";
const now=new Date("2026-11-13T07:00:00Z");
const key=String(Math.floor(Date.parse("2026-11-12T22:00:00Z")/1000));
const states=Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,i<10?"yes":"no"]));
const fact={data:{[key]:{GPV1.1:states}}};
test("official DTEK group is converted to contiguous real periods",()=>{
 const periods=periodsFromDtekFact(fact,{now,group:"GPV1.1"});
 assert.deepEqual(periods,[{begin:"00:00",end:"10:00",power:true},{begin:"10:00",end:"24:00",power:false}]);
});
test("missing group or hour cannot be displayed as valid schedule",()=>{
 assert.throws(()=>periodsFromDtekFact(fact,{now,group:"GPV2.1"}),/unavailable/);
 assert.throws(()=>periodsFromDtekFact({data:{[key]:{GPV1.1:{1:"yes"}}}},{now,group:"GPV1.1"}),/Missing DTEK hour/);
});
test("live DTEK and Open-Meteo enter one approved card with daily content",async()=>{
 const keys=["powerStatus","countdown","powerPeriods","gardenAdvice","sowingAdvice","moonPhase","lunarDay","astroForecast"];
 const rectangles=Object.fromEntries(keys.map((k,i)=>[k,{x:30,y:40+i*160,width:1300,height:120}]));
 const result=await buildApprovedArtworkFromLiveSources({now,group:"GPV1.1",dtekLoader:async()=>({fact,source:"ДТЕК"}),
  artworkUrl:"/assets/approved-clean-plate.png",rectangles,
  weatherLoader:async()=>({fetchedAt:"2026-11-13T06:55:00Z"}),
  weatherMapper:(_snapshot,date)=>({date,todayDate:date,currentNowTemp:6,todayMin:2,todayMax:9})});
 assert.equal(result.scheduleSource,"ДТЕК");
 assert.equal(result.data.powerStatus,"За графіком: світло є");
 assert.match(result.html,/live-garden-advice/);
 assert.match(result.html,/live-astro-forecast/);
});
