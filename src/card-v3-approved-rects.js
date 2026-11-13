// Candidate measured regions in the approved 1404 x 1536 owner artwork.
// These are deliberately marked as PREVIEW coordinates, not final clean-plate measurements.
// All rectangles use original artwork pixels, not CSS viewport pixels.
export const APPROVED_REFERENCE={width:1404,height:1536};
export const ARTWORK_PREVIEW_RECTS=Object.freeze({
 powerStatus:{x:1015,y:214,width:220,height:54},
 countdown:{x:665,y:234,width:240,height:72},
 powerPeriods:{x:1010,y:282,width:350,height:75},
 temperatureNow:{x:174,y:496,width:160,height:77},
 temperatureTodayMin:{x:175,y:585,width:135,height:39},
 temperatureTodayMax:{x:315,y:585,width:135,height:39},
});
export function validatePreviewRects(rects=ARTWORK_PREVIEW_RECTS,{width,height}=APPROVED_REFERENCE){
 for(const [id,r] of Object.entries(rects)){
  if(!r||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0||r.x<0||r.y<0||r.x+r.width>width||r.y+r.height>height)throw new Error("Rectangle outside approved artwork: "+id);
 }
 return true;
}
