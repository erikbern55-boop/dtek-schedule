import test from "node:test";
import assert from "node:assert/strict";
import {refreshDue,mergeFreshArtworkData,DTEK_REFRESH_MS,WEATHER_REFRESH_MS} from "../src/card-v3-refresh.js";
test("DTEK is due after five minutes without refreshing weather",()=>{
 const now=1_000_000;
 assert.deepEqual(refreshDue({nowMs:now,scheduleFetchedAtMs:now-DTEK_REFRESH_MS,weatherFetchedAtMs:now-DTEK_REFRESH_MS}),{schedule:true,weather:false});
});
test("weather is due after thirty minutes, independently of DTEK",()=>{
 const now=2_000_000;
 assert.deepEqual(refreshDue({nowMs:now,scheduleFetchedAtMs:now-60_000,weatherFetchedAtMs:now-WEATHER_REFRESH_MS}),{schedule:false,weather:true});
});
test("a schedule-only update retains all three temperatures",()=>{
 const old={temperatureNow:"+7°C",temperatureTodayMin:"+2°C",temperatureTodayMax:"+9°C",powerStatus:"Немає світла"};
 const next=mergeFreshArtworkData({previous:old,schedule:{powerStatus:"Є світло",countdown:"00:35"}});
 assert.equal(next.powerStatus,"Є світло");
 assert.equal(next.temperatureNow,"+7°C");assert.equal(next.temperatureTodayMin,"+2°C");assert.equal(next.temperatureTodayMax,"+9°C");
});
test("a weather-only update retains schedule and countdown",()=>{
 const next=mergeFreshArtworkData({previous:{powerStatus:"Є світло",countdown:"00:35"},weather:{temperatureNow:"+8°C",temperatureTodayMin:"+1°C",temperatureTodayMax:"+10°C"}});
 assert.equal(next.powerStatus,"Є світло");assert.equal(next.countdown,"00:35");
 assert.equal(next.temperatureNow,"+8°C");
});
test("missing or future timestamps request a fresh fetch",()=>{
 assert.deepEqual(refreshDue({nowMs:1000,scheduleFetchedAtMs:2000,weatherFetchedAtMs:undefined}),{schedule:true,weather:true});
});
