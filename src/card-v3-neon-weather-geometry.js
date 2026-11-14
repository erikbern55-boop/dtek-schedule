// Owner-approved neon reference, 1199 × 1312 pixels.
// Geometry contract for isolated visual tests only; no production rendering changes.
// Measured panel boxes include the glowing border. Keep all dynamic weather text
// strictly within the TODAY_CONTENT region; do not overlap neighbouring cards.
export const NEON_REFERENCE=Object.freeze({width:1199,height:1312});
export const NEON_PANELS=Object.freeze({
 today:Object.freeze({x:12,y:324,width:466,height:220}),
 tomorrow:Object.freeze({x:489,y:324,width:211,height:220}),
 daylight:Object.freeze({x:708,y:324,width:228,height:220}),
 soil:Object.freeze({x:946,y:324,width:211,height:220})
});
export const TODAY_CONTENT=Object.freeze({x:33,y:336,width:440,height:191});
export const TODAY_WEATHER_REGIONS=Object.freeze({
 heading:Object.freeze({x:113,y:334,width:315,height:32}),
 temperature:Object.freeze({x:134,y:376,width:150,height:53}),
 minimum:Object.freeze({x:40,y:437,width:123,height:27}),
 maximum:Object.freeze({x:171,y:437,width:128,height:27}),
 feelsLike:Object.freeze({x:62,y:468,width:235,height:28}),
 conditions:Object.freeze({x:59,y:502,width:244,height:27}),
 metrics:Object.freeze({x:316,y:367,width:150,height:160})
});
export function intersect(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y}
export function inside(a,b){return a.x>=b.x&&a.y>=b.y&&a.x+a.width<=b.x+b.width&&a.y+a.height<=b.y+b.height}
export function assertTodayGeometry(){
 const r=NEON_REFERENCE;
 for(const [key,p] of Object.entries(NEON_PANELS)){
  if(!inside(p,{x:0,y:0,width:r.width,height:r.height}))throw Error("Panel outside reference: "+key);
 }
 for(const [key,rect] of Object.entries(TODAY_WEATHER_REGIONS)){
  if(!inside(rect,NEON_PANELS.today))throw Error("Weather layer outside Today panel: "+key);
  for(const other of ["tomorrow","daylight","soil"]){
   if(intersect(rect,NEON_PANELS[other]))throw Error("Weather layer overlaps "+other+": "+key);
  }
 }
 return true;
}
