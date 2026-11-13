// Preview-only temperature-only inset: avoid weather pictograms, date, feels-like and condition labels.
// This does not edit the owner artwork. For release, replace with a designer-approved
// clean plate. Rectangles are measured in the 1404x1536 reference coordinate space.
export const WEATHER_VALUE_INSET=Object.freeze({x:175,y:504,width:165,height:68});
const escape=s=>String(s??"—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
// Ensure the live value itself contains exactly one leading plus sign.
const cleanTemp = value => typeof value==="string" ? value.replace(/^\s*\+\s*(?:\+\s*)+(?=\d)/u,"+") : value;
export function weatherInsetHtml({temperatureNow="—",temperatureTodayMin="—",temperatureTodayMax="—",width=1404,height=1536}={}){
 const r=WEATHER_VALUE_INSET;
 if(![width,height].every(n=>Number.isFinite(n)&&n>0)||r.x+r.width>width||r.y+r.height>height)throw new Error("Weather inset outside artwork bounds");
 const style=`left:${r.x/width*100}%;top:${r.y/height*100}%;width:${r.width/width*100}%;height:${r.height/height*100}%`;
 return `<div class="svitlo-weather-inset" style="${style}" aria-label="Температури сьогодні"><div class="svitlo-weather-now"><small>Зараз</small><strong>${escape(cleanTemp(temperatureNow))}</strong></div><div class="svitlo-weather-range"><span>Мін. <b>${escape(cleanTemp(temperatureTodayMin))}</b></span><span>Макс. <b>${escape(cleanTemp(temperatureTodayMax))}</b></span></div></div>`;
}
export const WEATHER_INSET_CSS=`.svitlo-artwork{container-type:inline-size}.svitlo-weather-inset{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:4%;padding:1.1%;overflow:hidden;border-radius:9px;background:linear-gradient(115deg,#031d13 0%,#06251b 70%,#041b12 100%);color:#e9fff8;text-shadow:0 0 7px #32ffd28c;font-family:system-ui,sans-serif}.svitlo-weather-now{display:flex;align-items:center;gap:4%;min-width:0;white-space:nowrap}.svitlo-weather-now small{font-size:clamp(5px,1.05cqw,15px);font-weight:700;color:#9affb7}.svitlo-weather-now strong{font-size:clamp(8px,2.5cqw,36px);line-height:1;color:#a8f7ff;text-shadow:none;font-variant-numeric:lining-nums tabular-nums;letter-spacing:0}.svitlo-weather-range{display:flex;gap:4%;font-size:clamp(5px,0.9cqw,13px);white-space:nowrap}.svitlo-weather-range b{color:#c6faff}`;
