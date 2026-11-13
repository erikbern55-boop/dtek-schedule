// Preview-only opaque inset over the baked-in weather values of the approved image.
// This does not edit the owner artwork. For release, replace with a designer-approved
// clean plate. Rectangles are measured in the 1404x1536 reference coordinate space.
export const WEATHER_VALUE_INSET=Object.freeze({x:146,y:472,width:245,height:168});
const escape=s=>String(s??"—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export function weatherInsetHtml({temperatureNow="—",temperatureTodayMin="—",temperatureTodayMax="—",width=1404,height=1536}={}){
 const r=WEATHER_VALUE_INSET;
 const style=`left:${r.x/width*100}%;top:${r.y/height*100}%;width:${r.width/width*100}%;height:${r.height/height*100}%`;
 return `<div class="svitlo-weather-inset" style="${style}" aria-label="Температури сьогодні"><div class="svitlo-weather-now"><small>Зараз</small><strong>${escape(temperatureNow)}</strong></div><div class="svitlo-weather-range"><span>Мін. <b>${escape(temperatureTodayMin)}</b></span><span>Макс. <b>${escape(temperatureTodayMax)}</b></span></div></div>`;
}
export const WEATHER_INSET_CSS=`.svitlo-weather-inset{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:5%;padding:1.3%;border-radius:9px;background:linear-gradient(115deg,#031d13 0%,#06251b 70%,#041b12 100%);color:#e9fff8;text-shadow:0 0 7px #32ffd28c;font-family:system-ui,sans-serif}.svitlo-weather-now{display:flex;align-items:center;gap:8%;white-space:nowrap}.svitlo-weather-now small{font-size:clamp(8px,1.05vw,15px);font-weight:700;color:#9affb7}.svitlo-weather-now strong{font-size:clamp(17px,3.2vw,46px);line-height:1;color:#a8f7ff}.svitlo-weather-range{display:flex;gap:8%;font-size:clamp(8px,1.25vw,18px);white-space:nowrap}.svitlo-weather-range b{color:#c6faff}`;
