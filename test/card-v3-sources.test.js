import test from "node:test";
import assert from "node:assert/strict";
import {SOURCE_LINKS,buildSourceLinkLayers} from "../src/card-v3-sources.js";
import {buildArtworkFirstCard} from "../src/card-v3-artwork.js";
const keys=Object.keys(SOURCE_LINKS);
test("all six source groups have safe HTTPS destinations",()=>{
 assert.equal(keys.length,6);
 for(const source of Object.values(SOURCE_LINKS))assert.match(source.url,/^https:\/\//);
});
test("every source has a clickable region over the artwork",()=>{
 const regions=Object.fromEntries(keys.map((key,i)=>[key,{x:20+i*180,y:1100,width:160,height:80}]));
 const layers=buildSourceLinkLayers(regions);
 const html=buildArtworkFirstCard({artworkUrl:"/assets/clean-plate.png",referenceWidth:1404,referenceHeight:1536,layers});
 for(const key of keys)assert.match(html,new RegExp('data-layer="source-'+key+'"'));
 assert.equal((html.match(/target="_blank"/g)||[]).length,6);
});
test("no source link silently disappears",()=>{
 assert.throws(()=>buildSourceLinkLayers({}),/Missing source-link region/);
});
