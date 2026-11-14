import test from "node:test";
import assert from "node:assert/strict";
import {approvedWeatherOverlayHtml,APPROVED_WEATHER_OVERLAY_CSS} from "../src/card-v3-approved-weather-overlay.js";
test("approved 1199x1312 overlay places all owner-approved fields",()=>{
 const html=approvedWeatherOverlayHtml({date:"14.11",temperatureNow:"+7°C",temperatureTodayMin:"+3°C",temperatureTodayMax:"+8°C",temperatureFeelsLike:"+5°C",conditions:"Мінлива хмарність"});
 for(const text of ["СЬОГОДНІ 14.11","+7°C","Мін. +3°C","Макс. +8°C","Відчувається +5°C"])assert.ok(html.includes(text),text);
 assert.equal((html.match(/data-weather-field=/g)||[]).length,7);
 assert.match(APPROVED_WEATHER_OVERLAY_CSS,/aspect-ratio:1199\/1312/);
});
test("no fabricated feels-like and no HTML injection",()=>{
 const html=approvedWeatherOverlayHtml({date:"14.11",conditions:"<script>alert(1)</script>"});
 assert.doesNotMatch(html,/data-weather-field="feelsLike"/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});
