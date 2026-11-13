import test from "node:test";import assert from "node:assert/strict";
import {WEATHER_VALUE_INSET,weatherInsetHtml,WEATHER_INSET_CSS} from "../src/card-v3-weather-inset.js";
test("temperature inset stays within approved artwork",()=>{const r=WEATHER_VALUE_INSET;assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=1404&&r.y+r.height<=1536)});
test("inset displays all three readings with HTML escaping",()=>{const html=weatherInsetHtml({temperatureNow:"+7°C",temperatureTodayMin:"+2°C",temperatureTodayMax:"+9°C"});for(const v of ["+7°C","+2°C","+9°C"])assert.ok(html.includes(v));assert.match(html,/Температури сьогодні/);assert.match(WEATHER_INSET_CSS,/svitlo-weather-inset/);assert.ok(!weatherInsetHtml({temperatureNow:"<script>"}).includes("<script>"))});

test("inset refuses a smaller artwork instead of overflowing",()=>{assert.throws(()=>weatherInsetHtml({width:200,height:300}),/outside artwork bounds/);assert.throws(()=>weatherInsetHtml({width:0,height:1536}),/outside artwork bounds/)});
test("responsive inset clips overflow on narrow cards",()=>{assert.match(WEATHER_INSET_CSS,/overflow:hidden/);assert.match(WEATHER_INSET_CSS,/container-type:inline-size/);assert.match(WEATHER_INSET_CSS,/cqw/)});
