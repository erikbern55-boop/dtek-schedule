import test from "node:test";
import assert from "node:assert/strict";
import {buildLiveArtworkV3,ARTWORK_DATA_FIELDS} from "../src/card-v3-live.js";
test("live schedule and weather share the same measured artwork coordinate system",()=>{
 const html=buildLiveArtworkV3({artworkUrl:"/assets/clean-plate.png",referenceWidth:1404,referenceHeight:1536,
 rectangles:{date:{x:20,y:20,width:200,height:40},countdown:{x:300,y:20,width:200,height:40},temperatureNow:{x:20,y:500,width:200,height:40}},
 data:{date:"13.11.2026",countdown:"00:58",temperatureNow:"+7°C"}});
 assert.match(html,/13.11.2026/);assert.match(html,/00:58/);assert.match(html,/\+7°C/);
 assert.match(html,/data-layer="live-temperature-now"/);
 assert.match(html,/aspect-ratio:1404\/1536/);
});
test("missing measured rectangles fail instead of silently drifting",()=>{
 assert.throws(()=>buildLiveArtworkV3({artworkUrl:"/assets/clean-plate.png",rectangles:{},data:{countdown:"00:58"}}),/Missing measured rectangle/);
});
test("unsupported nested data must be formatted by existing pipeline",()=>{
 assert.throws(()=>buildLiveArtworkV3({artworkUrl:"/assets/clean-plate.png",rectangles:{powerPeriods:{x:0,y:0,width:100,height:100}},data:{powerPeriods:[1,2]}}),/preformatted/);
 assert.ok(ARTWORK_DATA_FIELDS.includes("gardenAdvice"));
 assert.ok(ARTWORK_DATA_FIELDS.includes("moonPhase"));
});

test("today panel renders current, minimum and maximum temperatures independently",()=>{
 const html=buildLiveArtworkV3({artworkUrl:"/assets/clean-plate.png",referenceWidth:1404,referenceHeight:1536,
 rectangles:{temperatureNow:{x:100,y:500,width:180,height:50},temperatureTodayMin:{x:300,y:500,width:150,height:50},temperatureTodayMax:{x:470,y:500,width:150,height:50}},
 data:{temperatureNow:"+7°C",temperatureTodayMin:"+2°C",temperatureTodayMax:"+9°C"}});
 assert.match(html,/data-layer="live-temperature-now"/);
 assert.match(html,/data-layer="live-temperature-today-min"/);
 assert.match(html,/data-layer="live-temperature-today-max"/);
 assert.match(html,/\+2°C/);assert.match(html,/\+9°C/);
});
