import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {NEON_REFERENCE,NEON_PANELS,inside,intersect} from "../src/card-v3-neon-weather-geometry.js";
import {approvedWeatherOverlayHtml,APPROVED_WEATHER_OVERLAY_CSS} from "../src/card-v3-approved-weather-overlay.js";

const output=path.resolve("artifacts/weather-visual");
fs.mkdirSync(output,{recursive:true});
const labels={heading:"Погода — СЬОГОДНІ 14.11",temperature:"+7°C",minimum:"Мін. +3°C",maximum:"Макс. +8°C",feelsLike:"Відчувається +5°C",conditions:"Мінлива хмарність",metrics:"Вітер · Опади · Тиск · Вологість"};
const px=r=>`left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;`;
const panel=(name,rect)=>`<div class="panel" data-panel="${name}" style="${px(rect)}"><span class="panel-name">${name}</span></div>`;
const regions=approvedWeatherOverlayHtml({date:"14.11",temperatureNow:"+7°C",temperatureTodayMin:"+3°C",temperatureTodayMax:"+8°C",temperatureFeelsLike:"+5°C",conditions:"Мінлива хмарність",wind:"3 м/с",precipitation:"0 мм",pressure:"755",humidity:"70%"});
const html=`<!doctype html><html lang="uk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}html,body{margin:0;background:#030b0a;color:#e8fff3;font-family:Arial,sans-serif}
#canvas{position:relative;width:${NEON_REFERENCE.width}px;height:${NEON_REFERENCE.height}px;background:#04140e}
.panel{position:absolute;border:3px solid #24fb59;border-radius:20px;box-shadow:0 0 15px #18ff65,inset 0 0 12px #18ff6533}
.panel-name{position:absolute;bottom:4px;right:10px;color:#85eaa2;font-size:11px}
.region{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;padding:2px;overflow:hidden;white-space:normal;overflow-wrap:anywhere;background:#083420;border:1px dashed #6effa0;color:#fff;font-size:16px}
[data-region="heading"]{font-size:19px;font-weight:700}[data-region="temperature"]{font-size:37px;color:#baffd1;font-weight:700}
${APPROVED_WEATHER_OVERLAY_CSS}</style><div id="canvas" class="v3-approved-stage">${Object.entries(NEON_PANELS).map(([name,r])=>panel(name,r)).join("")}${regions}</div></html>`;
fs.writeFileSync(path.join(output,"weather-overlay-browser.html"),html);
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:NEON_REFERENCE.width,height:NEON_REFERENCE.height},deviceScaleFactor:1});
 await page.setContent(html,{waitUntil:"load"});
 const boxes=await page.locator("[data-weather-field]").evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {key:el.dataset.weatherField,x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}}));
 for(const b of boxes){
  if(!inside(b,NEON_PANELS.today))throw Error("Browser overflow Today: "+b.key);
  for(const [name,p] of Object.entries(NEON_PANELS))if(name!=="today"&&intersect(b,p))throw Error("Browser overlap "+name+": "+b.key);
  if(b.scrollWidth>b.clientWidth+1||b.scrollHeight>b.clientHeight+1)throw Error("Clipped text in "+b.key);
 }
 const metricRows=await page.locator("[data-weather-metric]").evaluateAll(els=>els.map(el=>{
  const parent=el.getBoundingClientRect();
  const parts=[...el.children].map(c=>{const b=c.getBoundingClientRect();return {text:c.textContent.trim(),left:b.left,right:b.right,scrollWidth:c.scrollWidth,clientWidth:c.clientWidth}});
  return {key:el.dataset.weatherMetric,left:parent.left,right:parent.right,parts};
 }));
 if(metricRows.length!==4)throw Error("Expected 4 weather metric rows, got "+metricRows.length);
 for(const row of metricRows){
  for(const part of row.parts){
   if(part.left<row.left-1||part.right>row.right+1)throw Error("Metric element outside row: "+row.key+" "+part.text);
   if(part.scrollWidth>part.clientWidth+1)throw Error("Clipped metric text: "+row.key+" "+part.text);
  }
 }
 await page.screenshot({path:path.join(output,"weather-overlay-browser.png"),fullPage:true});
 fs.writeFileSync(path.join(output,"weather-overlay-browser-report.json"),JSON.stringify({status:"passed",kind:"approved-weather-overlay-browser-check",reference:NEON_REFERENCE,regions:boxes,metricRows,disclaimer:"Real responsive weather HTML overlay on placeholder panels, not a pixel comparison to the approved artwork. Approved PNG and clean plate are not in repository."},null,2));
 console.log("WEATHER OVERLAY VERIFIED:",boxes.length,"regions within Today panel; no clipped text or adjacent-panel overlap");
}finally{await browser.close()}
