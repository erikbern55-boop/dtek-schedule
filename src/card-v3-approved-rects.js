// Candidate measured regions in the approved 1404 x 1536 owner artwork.
// These are deliberately marked as PREVIEW coordinates, not final clean-plate measurements.
// All rectangles use original artwork pixels, not CSS viewport pixels.
export const APPROVED_REFERENCE={width:1404,height:1536};
export const ARTWORK_PREVIEW_RECTS=Object.freeze({
 powerStatus:{x:1020,y:220,width:330,height:50},
 countdown:{x:687,y:237,width:240,height:64},
 powerPeriods:{x:1020,y:285,width:335,height:65},
 temperatureNow:{x:178,y:495,width:180,height:80},
 temperatureTodayMin:{x:160,y:585,width:145,height:40},
 temperatureTodayMax:{x:310,y:585,width:145,height:40},
});
export function validatePreviewRects(rects=ARTWORK_PREVIEW_RECTS,{width,height}=APPROVED_REFERENCE){
 for(const [id,r] of Object.entries(rects)){
  if(!r||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0||r.x<0||r.y<0||r.x+r.width>width||r.y+r.height>height)throw new Error("Rectangle outside approved artwork: "+id);
 }
 return true;
}
