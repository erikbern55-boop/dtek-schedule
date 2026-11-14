// Artwork measurement contract for the approved 1404×1536 reference.
// Regions are broad panel boundaries, NOT final text bounding boxes.
// Precise layer rectangles must be measured against the clean plate before release.
export const APPROVED_ARTWORK = Object.freeze({
 width:1404,height:1536,
 panels:Object.freeze({
 header:{x:24,y:18,width:1356,height:150},
 power:{x:24,y:174,width:1356,height:390},
 weather:{x:24,y:570,width:1356,height:320},
 garden:{x:24,y:896,width:1356,height:280},
 lunarAstro:{x:24,y:1182,width:1356,height:205},
 sources:{x:24,y:1392,width:1356,height:104},
 footer:{x:24,y:1500,width:1356,height:32}
 })
});
export function validateArtworkMeasurements({width,height,rectangles,sourceRectangles}={}) {
 if(width!==APPROVED_ARTWORK.width||height!==APPROVED_ARTWORK.height)throw new Error("Artwork dimensions differ from approved reference");
 if(!rectangles||typeof rectangles!=="object")throw new Error("Live rectangles not measured");
 if(!sourceRectangles||typeof sourceRectangles!=="object")throw new Error("Source link rectangles not measured");
 const all=[...Object.entries(rectangles),...Object.entries(sourceRectangles)];
 if(!all.length)throw new Error("No measured regions");
 for(const [key,r] of all){
  if(!r||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.x<0||r.y<0||r.width<=0||r.height<=0||r.x+r.width>width||r.y+r.height>height)throw new Error("Invalid measured region: "+key);
 }
 return true;
}
