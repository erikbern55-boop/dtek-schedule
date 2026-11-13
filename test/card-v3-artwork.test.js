import test from "node:test";
import assert from "node:assert/strict";
import {buildArtworkFirstCard,ARTWORK_FIRST_CSS} from "../src/card-v3-artwork.js";
test("requires a local clean plate and never falls back to a static reference",()=>{
 assert.throws(()=>buildArtworkFirstCard(),/clean-plate/);
 assert.throws(()=>buildArtworkFirstCard({artworkUrl:"https://example.org/reference.png"}),/clean-plate/);
});
test("positions live data and safe HTTPS links in reference coordinates",()=>{
 const html=buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",layers:[
 {id:"date",x:12,y:116,width:300,height:70,text:"13.11.2026"},
 {id:"source",x:12,y:1041,width:200,height:80,text:"ДТЕК",href:"https://www.dtek-krem.com.ua/ua/shutdowns"}
 ]});
 assert.match(html,/data-layer="date"/);
 assert.match(html,/13.11.2026/);
 assert.match(html,/target="_blank"/);
 assert.match(ARTWORK_FIRST_CSS,/position:absolute/);
});
test("rejects overflowing layers, duplicate ids and injected markup",()=>{
 assert.throws(()=>buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",layers:[{id:"bad",x:1100,y:10,width:100,height:20}]}),/outside/);
 assert.throws(()=>buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",layers:[{id:"a",x:0,y:0,width:10,height:10},{id:"a",x:20,y:20,width:10,height:10}]}),/duplicate/);
 const html=buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",layers:[{id:"safe",x:0,y:0,width:100,height:100,text:"<script>"}]});
 assert.ok(!html.includes("<script>"));
});

test("respects approved artwork dimensions instead of assuming a fixed card ratio",()=>{
 const html=buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",referenceWidth:1404,referenceHeight:1536,layers:[{id:"weather",x:702,y:768,width:351,height:384,text:"+7°C"}]});
 assert.match(html,/aspect-ratio:1404\/1536/);
 assert.match(html,/left:50%/);
 assert.match(html,/top:50%/);
 assert.match(html,/width:25%/);
 assert.match(html,/height:25%/);
 assert.match(html,/\+7°C/);
});
test("keeps Ukrainian live values escaped and in independent layers",()=>{
 const html=buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",layers:[
  {id:"today",x:20,y:20,width:200,height:50,text:"Сьогодні: світло є"},
  {id:"countdown",x:250,y:20,width:200,height:50,text:"00:58"},
  {id:"garden",x:20,y:700,width:800,height:200,text:"Часник & цибуля"}
 ]});
 assert.match(html,/Сьогодні: світло є/);
 assert.match(html,/00:58/);
 assert.match(html,/Часник &amp; цибуля/);
 assert.equal((html.match(/class="art-layer"/g)||[]).length,3);
});

test("source link fills its touch region and remains keyboard accessible",()=>{
 const html=buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",layers:[{id:"dtek-link",x:100,y:100,width:300,height:60,text:"ДТЕК",href:"https://www.dtek-krem.com.ua/ua/shutdowns"}]});
 assert.match(html,/class="art-source-link"/);
 assert.match(html,/aria-label="ДТЕК"/);
 assert.match(html,/rel="noopener noreferrer"/);
 assert.match(ARTWORK_FIRST_CSS,/touch-action:manipulation/);
 assert.match(ARTWORK_FIRST_CSS,/:focus-visible/);
 assert.match(ARTWORK_FIRST_CSS,/height:100%/);
});
