import test from "node:test";
import assert from "node:assert/strict";
import {APPROVED_ARTWORK,validateArtworkMeasurements} from "../src/card-v3-measurements.js";
test("approved artwork contract preserves full reference proportions",()=>{
 assert.equal(APPROVED_ARTWORK.width,1404);assert.equal(APPROVED_ARTWORK.height,1536);
 assert.equal(APPROVED_ARTWORK.panels.footer.y+APPROVED_ARTWORK.panels.footer.height,1532);
});
test("measured fields and source links must stay inside the approved image",()=>{
 assert.equal(validateArtworkMeasurements({width:1404,height:1536,rectangles:{date:{x:30,y:190,width:300,height:50}},sourceRectangles:{dtek:{x:50,y:1400,width:180,height:60}}}),true);
 assert.throws(()=>validateArtworkMeasurements({width:1170,height:1280,rectangles:{},sourceRectangles:{}}),/dimensions/);
 assert.throws(()=>validateArtworkMeasurements({width:1404,height:1536,rectangles:{date:{x:1400,y:0,width:100,height:20}},sourceRectangles:{}}),/Invalid measured region/);
});
