import test from "node:test";
import assert from "node:assert/strict";
import {APPROVED_REFERENCE,ARTWORK_PREVIEW_RECTS,validatePreviewRects} from "../src/card-v3-approved-rects.js";
test("all candidate live-field rectangles stay within approved 1404x1536 artwork",()=>{
 assert.deepEqual(APPROVED_REFERENCE,{width:1404,height:1536});
 assert.equal(validatePreviewRects(),true);
 for(const id of ["powerStatus","countdown","powerPeriods","temperatureNow","temperatureTodayMin","temperatureTodayMax"])assert.ok(ARTWORK_PREVIEW_RECTS[id]);
});
test("out-of-bounds measurement is rejected",()=>assert.throws(()=>validatePreviewRects({bad:{x:1400,y:0,width:20,height:20}}),/outside approved/));
