import test from "node:test";
import assert from "node:assert/strict";
import {dtekArtworkFields} from "../src/card-v3-dtek.js";
const schedule=[{begin:"00:00",end:"10:00",power:true},{begin:"10:00",end:"12:00",power:false},{begin:"12:00",end:"24:00",power:true}];
test("real DTEK period model drives planned status and countdown",()=>{
 const x=dtekArtworkFields({schedule,date:"2026-11-13",now:new Date("2026-11-13T07:00:00Z")});
 assert.equal(x.powerStatus,"За графіком: світло є");
 assert.equal(x.countdown,"01:00");
 assert.match(x.powerPeriods,/10:00–12:00 без світла/);
});
test("DTEK schedule is not misrepresented as a voltage sensor",()=>{
 const x=dtekArtworkFields({schedule,date:"2026-11-13",now:new Date("2026-11-13T09:00:00Z")});
 assert.equal(x.powerStatus,"За графіком: світла немає");
 assert.match(x.powerStatus,/За графіком/);
});
test("invalid period is rejected",()=>{
 assert.throws(()=>dtekArtworkFields({schedule:[{begin:"10:00",end:"11:00",power:"off"}],date:"2026-11-13"}),/Invalid DTEK/);
});
