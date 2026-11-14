import test from "node:test";
import assert from "node:assert/strict";
import {buildApprovedWeatherStage} from "../src/card-v3-approved-stage.js";
import {NEON_REFERENCE,NEON_PANELS,TODAY_WEATHER_REGIONS,inside,intersect} from "../src/card-v3-neon-weather-geometry.js";

const weather={date:"14.11",temperatureNow:"+7°C",temperatureTodayMin:"+3°C",temperatureTodayMax:"+8°C",temperatureFeelsLike:"+5°C",conditions:"Мінлива хмарність",wind:"3 м/с",precipitation:"0 мм",pressure:"755",humidity:"70%"};
const artworkUrl="/assets/approved-clean-plate.png";

test("approved stage requires explicit artwork and complete live weather; no dummy fallback",()=>{
 assert.throws(()=>buildApprovedWeatherStage({weather,artworkWidth:1199,artworkHeight:1312}),/artwork URL/i);
 assert.throws(()=>buildApprovedWeatherStage({artworkUrl,artworkWidth:1199,artworkHeight:1312}),/Live weather/);
 assert.throws(()=>buildApprovedWeatherStage({artworkUrl,weather:{...weather,humidity:""},artworkWidth:1199,artworkHeight:1312}),/humidity/);
 assert.throws(()=>buildApprovedWeatherStage({artworkUrl,weather,artworkWidth:1404,artworkHeight:1312}),/geometry mismatch/);
});
test("stage renders weather safely on the supplied reference URL",()=>{
 const result=buildApprovedWeatherStage({artworkUrl,weather,artworkWidth:1199,artworkHeight:1312});
 assert.equal(result.mode,"isolated-preview-only");
 assert.deepEqual(result.reference,NEON_REFERENCE);
 assert.match(result.html,/approved-clean-plate\.png/);
 for(const value of ["+7°C","+3°C","+8°C","+5°C","3 м\/с","0 мм","755","70%"])assert.ok(result.html.includes(value),value);
 assert.equal((result.html.match(/data-weather-metric=/g)||[]).length,4);
 assert.equal((result.html.match(/data-weather-field=/g)||[]).length,7);
 const injected=buildApprovedWeatherStage({artworkUrl,weather:{...weather,conditions:"<script>alert(1)</script>"},artworkWidth:1199,artworkHeight:1312});
 assert.doesNotMatch(injected.html,/<script>/);
 assert.match(injected.html,/&lt;script&gt;/);
});
test("all weather regions remain within Today panel and outside neighboring panels",()=>{
 for(const [name,region] of Object.entries(TODAY_WEATHER_REGIONS)){
  assert.ok(inside(region,NEON_PANELS.today),name);
  for(const neighbor of ["tomorrow","daylight","soil"])assert.equal(intersect(region,NEON_PANELS[neighbor]),false,name+" vs "+neighbor);
 }
});

test("final 1404x1536 approved artwork retains exact aspect ratio and live weather fields",()=>{
 const result=buildApprovedWeatherStage({artworkUrl,weather,artworkWidth:1404,artworkHeight:1536});
 assert.deepEqual(result.reference,{width:1404,height:1536});
 assert.match(result.html,/aspect-ratio:1404\/1536/);
 assert.match(result.html,/width:min\(100%,1404px\)/);
 assert.equal((result.html.match(/data-weather-metric=/g)||[]).length,4);
 assert.equal((result.html.match(/data-weather-field=/g)||[]).length,7);
});
