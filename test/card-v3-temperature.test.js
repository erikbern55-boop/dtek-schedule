import test from "node:test";
import assert from "node:assert/strict";
import {todayTemperatureOverlay} from "../src/card-v3-temperature.js";
test("current and daily extrema use distinct Open-Meteo weatherForDate fields",()=>{
 assert.deepEqual(todayTemperatureOverlay({currentNowTemp:7.4,currentTemp:6,todayMin:1.7,todayMax:10.3}),{temperatureNow:"+7°C",temperatureTodayMin:"+2°C",temperatureTodayMax:"+10°C"});
});
test("missing measurements never become invented zero values",()=>{
 assert.deepEqual(todayTemperatureOverlay({currentNowTemp:null,currentTemp:null,todayMin:null,todayMax:null}),{temperatureNow:"—",temperatureTodayMin:"—",temperatureTodayMax:"—"});
});
test("negative and zero temperatures have correct signs",()=>{
 assert.deepEqual(todayTemperatureOverlay({currentNowTemp:-3.6,todayMin:-8.2,todayMax:0}),{temperatureNow:"-4°C",temperatureTodayMin:"-8°C",temperatureTodayMax:"0°C"});
});

test("today temperature panel refuses a tomorrow-specific snapshot",()=>{
 assert.throws(()=>todayTemperatureOverlay({date:"2026-11-14",todayDate:"2026-11-13",currentNowTemp:7,todayMin:1,todayMax:9}),/today weather snapshot/);
 assert.equal(todayTemperatureOverlay({date:"2026-11-13",todayDate:"2026-11-13",currentNowTemp:7,todayMin:1,todayMax:9}).temperatureNow,"+7°C");
});

test("feels-like appears only when a measured weather field exists",()=>{
 const measured=todayTemperatureOverlay({currentNowTemp:7,todayMin:3,todayMax:8,currentFeelsLike:5});
 assert.equal(measured.temperatureFeelsLike,"+5°C");
 const missing=todayTemperatureOverlay({currentNowTemp:7,todayMin:3,todayMax:8});
 assert.equal(Object.hasOwn(missing,"temperatureFeelsLike"),false);
});
