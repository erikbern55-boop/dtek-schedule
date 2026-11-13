import test from "node:test";
import assert from "node:assert/strict";
import {buildIntegratedPreview} from "../src/card-v3-preview.js";
const rectangles={
 temperatureNow:{x:30,y:630,width:180,height:60},
 temperatureTodayMin:{x:230,y:630,width:180,height:60},
 temperatureTodayMax:{x:430,y:630,width:180,height:60},
 powerStatus:{x:30,y:230,width:200,height:60},
 powerPeriods:{x:30,y:310,width:700,height:180},
 countdown:{x:250,y:230,width:200,height:60}
};
test("full-screen preview combines live weather and schedule without fake values",()=>{
 const out=buildIntegratedPreview({artworkUrl:"/assets/approved-clean-plate.png",rectangles,
 nowMs:1800000,scheduleFetchedAtMs:1500000,weatherFetchedAtMs:1500000,
 scheduleSnapshot:{powerStatus:"Є світло",countdown:"00:25"},
 weatherSnapshot:{currentNowTemp:6.5,todayMin:-2,todayMax:11}});
 assert.match(out.html,/<meta name="viewport"/);
 assert.match(out.html,/data-layer="live-temperature-now"/);
 assert.match(out.html,/data-layer="live-temperature-today-min"/);
 assert.match(out.html,/data-layer="live-temperature-today-max"/);
 assert.match(out.html,/Є світло/);
 assert.deepEqual(out.due,{schedule:true,weather:false});
});
test("schedule-only refresh retains all three temperatures and their coordinates",()=>{
 const out=buildIntegratedPreview({artworkUrl:"/assets/approved-clean-plate.png",rectangles,nowMs:1800000,
 previousData:{temperatureNow:"+5°C",temperatureTodayMin:"-1°C",temperatureTodayMax:"+9°C"},
 scheduleSnapshot:{powerStatus:"Немає світла",countdown:"00:15"}});
 assert.equal(out.data.temperatureNow,"+5°C");
 assert.equal(out.data.temperatureTodayMin,"-1°C");
 assert.equal(out.data.temperatureTodayMax,"+9°C");
 assert.match(out.html,/Немає світла/);
});
test("weather-only refresh retains countdown",()=>{
 const out=buildIntegratedPreview({artworkUrl:"/assets/approved-clean-plate.png",rectangles,nowMs:1800000,
 previousData:{powerStatus:"Є світло",countdown:"00:20"},
 weatherSnapshot:{currentNowTemp:3,todayMin:0,todayMax:7}});
 assert.equal(out.data.countdown,"00:20");
 assert.equal(out.data.temperatureTodayMin,"0°C");
});

test("integrated preview accepts actual DTEK periods and weather together",()=>{
 const out=buildIntegratedPreview({
  artworkUrl:"/assets/approved-clean-plate.png",rectangles,nowMs:Date.parse("2026-11-13T07:00:00Z"),
  scheduleDate:"2026-11-13",
  schedulePeriods:[{begin:"00:00",end:"10:00",power:true},{begin:"10:00",end:"24:00",power:false}],
  weatherSnapshot:{currentNowTemp:4.5,todayMin:0,todayMax:8}
 });
 assert.equal(out.data.powerStatus,"За графіком: світло є");
 assert.equal(out.data.countdown,"01:00");
 assert.equal(out.data.temperatureNow,"+5°C");
 assert.equal(out.data.temperatureTodayMin,"0°C");
 assert.equal(out.data.temperatureTodayMax,"+8°C");
});

test("weather inset replaces three raw temperature overlays without losing data",()=>{
 const out=buildIntegratedPreview({
  artworkUrl:"/assets/approved-clean-plate.png",rectangles:{powerStatus:rectangles.powerStatus},
  nowMs:1800000,useWeatherInset:true,
  scheduleSnapshot:{powerStatus:"За графіком: світло є"},
  weatherSnapshot:{currentNowTemp:7,todayMin:2,todayMax:9}
 });
 assert.match(out.html,/class="svitlo-weather-inset"/);
 assert.match(out.html,/\+7°C/);
 assert.match(out.html,/\+2°C/);
 assert.match(out.html,/\+9°C/);
 assert.doesNotMatch(out.html,/data-layer="live-temperature-now"/);
 assert.equal(out.data.temperatureNow,"+7°C");
 assert.match(out.html,/За графіком: світло є/);
});

test("weather inset never silently hides missing minimum or maximum",()=>{
 for(const weatherSnapshot of [
  {currentNowTemp:6,todayMin:undefined,todayMax:9},
  {currentNowTemp:6,todayMin:1,todayMax:undefined},
  {currentNowTemp:undefined,todayMin:1,todayMax:9}
 ]){
  assert.throws(()=>buildIntegratedPreview({artworkUrl:"/assets/approved-clean-plate.png",rectangles:{},nowMs:1800000,useWeatherInset:true,weatherSnapshot}),/Today weather requires all three temperatures/);
 }
});
test("weather inset keeps one plus and displays all three readings",()=>{
 const out=buildIntegratedPreview({artworkUrl:"/assets/approved-clean-plate.png",rectangles:{},nowMs:1800000,useWeatherInset:true,weatherSnapshot:{currentNowTemp:6,todayMin:2,todayMax:9}});
 for(const value of ["+6°C","+2°C","+9°C"])assert.ok(out.html.includes(value));
 assert.doesNotMatch(out.html,/\\+\\+6°C/);
 assert.ok(out.html.includes("Мін."));
 assert.ok(out.html.includes("Макс."));
});
