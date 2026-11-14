import test from "node:test";
import assert from "node:assert/strict";
import {renderArtworkWithWeather,TODAY_TEMPERATURE_FIELDS} from "../src/card-v3-weather-bridge.js";
test("weather snapshot flows into actual artwork HTML along with schedule data",()=>{
 const html=renderArtworkWithWeather({
  artworkUrl:"/assets/clean-plate.png",
  weather:{currentNowTemp:5.2,todayMin:-1.3,todayMax:8.7},
  data:{countdown:"01:15"},
  rectangles:{
   temperatureNow:{x:50,y:650,width:130,height:45},
   temperatureTodayMin:{x:190,y:650,width:130,height:45},
   temperatureTodayMax:{x:330,y:650,width:130,height:45},
   countdown:{x:500,y:200,width:200,height:55}
  }
 });
 assert.match(html,/data-layer="live-temperature-now"/);
 assert.match(html,/data-layer="live-temperature-today-min"/);
 assert.match(html,/data-layer="live-temperature-today-max"/);
 assert.match(html,/\+5°C/);assert.match(html,/-1°C/);assert.match(html,/\+9°C/);
 assert.match(html,/01:15/);
});
test("missing measured weather slots are rejected before rendering",()=>{
 assert.deepEqual(TODAY_TEMPERATURE_FIELDS,["temperatureNow","temperatureTodayMin","temperatureTodayMax"]);
 assert.throws(()=>renderArtworkWithWeather({weather:{},artworkUrl:"/assets/clean-plate.png",rectangles:{}}),/Missing measured/);
});
