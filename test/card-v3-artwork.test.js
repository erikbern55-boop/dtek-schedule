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
