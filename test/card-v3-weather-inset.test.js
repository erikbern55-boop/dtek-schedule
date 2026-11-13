import test from "node:test";import assert from "node:assert/strict";
import {WEATHER_VALUE_INSET,WEATHER_HEADER_DATE_RECT,weatherHeaderDateHtml,weatherInsetHtml,WEATHER_INSET_CSS} from "../src/card-v3-weather-inset.js";
test("temperature inset stays within approved artwork",()=>{const r=WEATHER_VALUE_INSET;assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=1404&&r.y+r.height<=1536)});
test("inset displays all three readings with HTML escaping",()=>{const html=weatherInsetHtml({temperatureNow:"+7°C",temperatureTodayMin:"+2°C",temperatureTodayMax:"+9°C"});for(const v of ["+7°C","+2°C","+9°C"])assert.ok(html.includes(v));assert.match(html,/Температури сьогодні/);assert.match(WEATHER_INSET_CSS,/svitlo-weather-inset/);assert.ok(!weatherInsetHtml({temperatureNow:"<script>"}).includes("<script>"))});

test("inset refuses a smaller artwork instead of overflowing",()=>{assert.throws(()=>weatherInsetHtml({width:200,height:300}),/outside artwork bounds/);assert.throws(()=>weatherInsetHtml({width:0,height:1536}),/outside artwork bounds/)});
test("responsive inset clips overflow on narrow cards",()=>{assert.match(WEATHER_INSET_CSS,/overflow:hidden/);assert.match(WEATHER_INSET_CSS,/container-type:inline-size/);assert.match(WEATHER_INSET_CSS,/cqw/)});

test("duplicate plus sign is rendered once in today's temperature",()=>{const html=weatherInsetHtml({temperatureNow:"++6°C"});assert.match(html,/>\+6°C<\/strong>/);assert.doesNotMatch(html,/\+\+6°C/)});

test("temperature overlay stays in the numeric-only area of approved artwork",()=>{
 const r=WEATHER_VALUE_INSET;
 assert.ok(r.x>=175,"must not cover cloud pictogram");
 assert.ok(r.y>=504,"must not cover date");
 assert.ok(r.x+r.width<=340,"must not cover weather metrics column");
 assert.ok(r.y+r.height<=572,"must not cover feels-like label");
});

test("Today date stays in approved weather header and outside temperature inset",()=>{
 const d=WEATHER_HEADER_DATE_RECT,t=WEATHER_VALUE_INSET;
 assert.ok(d.x>=0&&d.y>=325&&d.x+d.width<=500&&d.y+d.height<=470);
 assert.ok(d.y+d.height<=t.y || d.x+d.width<=t.x || d.x>=t.x+t.width);
 assert.ok(weatherHeaderDateHtml("13.11").includes("13.11"));
 assert.throws(()=>weatherHeaderDateHtml("2026-11-13"),/DD.MM/);
});
