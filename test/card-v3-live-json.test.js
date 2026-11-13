import test from "node:test";
import assert from "node:assert/strict";
import {buildV3LivePayload} from "../src/card-v3-live-json.js";
const schedule=[{begin:"00:00",end:"10:00",power:true},{begin:"10:00",end:"24:00",power:false}];
test("existing generator schedule produces viewer JSON without invented data",()=>{
 const now=new Date("2026-11-13T07:00:00Z");
 const x=buildV3LivePayload({schedule,date:"2026-11-13",label:"сьогодні",now,source:"ДТЕК"});
 assert.equal(x.power.status,"За графіком: світло є");
 assert.equal(x.power.eventTime,"10:00");
 assert.equal(x.power.nextAt,"2026-11-13T08:00:00.000Z");
 assert.deepEqual(x.power.periods,schedule);
 assert.equal(x.weather,undefined);
 assert.equal(x.garden,undefined);
});
test("reject malformed schedule rather than showing fake values",()=>{
 assert.throws(()=>buildV3LivePayload({schedule:[{begin:"bad",end:"24:00",power:false}],date:"2026-11-13"}),/Invalid/);
});
