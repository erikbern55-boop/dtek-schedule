import test from "node:test";
import assert from "node:assert/strict";
import {buildApprovedLiveLayers,buildApprovedLiveCard} from "../src/card-v3-approved-live-layers.js";
const now=new Date("2026-11-14T12:00:00Z");
const payload={scheduleDate:"2026-11-14",updatedAt:now.toISOString(),power:{periods:[{begin:"00:00",end:"19:30",power:true}],onText:"00:00–19:30",offText:"19:30–24:00",nextAt:"2026-11-14T13:15:00Z"},weather:{current:{temperature_2m:7},daily:{temperature_2m_max:[8]}},garden:{advice:"Часник"},moon:{description:"Зростаючий Місяць"},astro:{description:"Розважальний прогноз"}};
test("all dynamic fields stay within 1404x1536 artwork",()=>{
 const layers=buildApprovedLiveLayers(payload,{now});
 assert.equal(layers.length,14);
 assert.ok(layers.some(l=>l.id==="power-on"));
 assert.ok(layers.some(l=>l.id==="power-off"));
 for(const l of layers){assert.ok(l.x>=0&&l.y>=0&&l.x+l.width<=1404&&l.y+l.height<=1536,l.id);}
 assert.equal(layers.find(l=>l.id==="countdown").text,"01:15");
 assert.equal(layers.find(l=>l.id==="date").text,"14.11.2026");
});
test("no invented data when missing and no executable HTML injection",()=>{
 const card=buildApprovedLiveCard({payload:{...payload,garden:{advice:"<script>alert(1)</script>"}},now});
 assert.equal(card.mode,"test-only");
 assert.match(card.html,/&lt;script&gt;/);
 assert.doesNotMatch(card.html,/<script>/);
 assert.match(card.html,/approved-clean-plate.png/);
 assert.match(card.html,/aspect-ratio:1404\/1536/);
 assert.match(card.html,/>—<\/div>/);
 assert.throws(()=>buildApprovedLiveCard({payload:{...payload,power:{periods:[]}}}),/Verified DTEK/);
});
