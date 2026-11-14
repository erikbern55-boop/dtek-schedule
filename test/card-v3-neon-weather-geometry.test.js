import test from "node:test";
import assert from "node:assert/strict";
import {NEON_REFERENCE,NEON_PANELS,TODAY_WEATHER_REGIONS,inside,intersect,assertTodayGeometry} from "../src/card-v3-neon-weather-geometry.js";
test("approved neon weather regions fit 1199x1312 and do not cross neighboring cards",()=>{
 assert.deepEqual(NEON_REFERENCE,{width:1199,height:1312});
 assert.equal(assertTodayGeometry(),true);
 for(const rect of Object.values(TODAY_WEATHER_REGIONS)){
  assert.ok(inside(rect,NEON_PANELS.today));
  for(const key of ["tomorrow","daylight","soil"])assert.equal(intersect(rect,NEON_PANELS[key]),false);
 }
});
test("boundary checks reject overflowing and overlapping rectangles",()=>{
 assert.equal(inside({x:470,y:340,width:30,height:30},NEON_PANELS.today),false);
 assert.equal(intersect({x:480,y:340,width:20,height:30},NEON_PANELS.tomorrow),true);
});
