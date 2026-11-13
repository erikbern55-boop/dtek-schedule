// Preview-only temperature-only inset: avoid weather pictograms, date, feels-like and condition labels.
// This does not edit the owner artwork. For release, replace with a designer-approved
// clean plate. Rectangles are measured in the 1404x1536 reference coordinate space.
export const WEATHER_HEADER_DATE_RECT=Object.freeze({x:395,y:397,width:90,height:34});
export const WEATHER_VALUE_INSET=Object.freeze({x:175,y:504,width:165,height:68});
const escape=s=>String(s??"—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
// Ensure the live value itself contains exactly one leading plus sign.
const cleanTemp = value => typeof value==="string" ? value.replace(/^\s*\+\s*(?:\+\s*)+(?=\d)/u,"+") : value;
export function weatherHeaderDateHtml(date,{width=1404,height=1536}={}){
 if(typeof date!=="string"||!/^[0-9]{2}[.][0-9]{2}$/.test(date))throw new Error("Weather header date must be DD.MM");
 const r=WEATHER_HEADER_DATE_RECT;
 if(r.x+r.width>width||r.y+r.height>height)throw new Error("Weather date outside artwork bounds");
 return `<span class="svitlo-weather-header-date" style="left:${r.x/width*100}%;top:${r.y/height*100}%;width:${r.width/width*100}%;height:${r.height/height*100}%">${escape(date)}</span>`;
}
export function weatherInsetHtml({temperatureNow="—",temperatureTodayMin="—",temperatureTodayMax="—",width=1404,height=1536}={}){
 const r=WEATHER_VALUE_INSET;
 if(![width,height].every(n=>Number.isFinite(n)&&n>0)||r.x+r.width>width||r.y+r.height>height)throw new Error("Weather inset outside artwork bounds");
 const style=`left:${r.x/width*100}%;top:${r.y/height*100}%;width:${r.width/width*100}%;height:${r.height/height*100}%`;
 return `<div class="svitlo-weather-inset" style="${style}" aria-label="Температури сьогодні"><div class="svitlo-weather-now"><strong>${escape(cleanTemp(temperatureNow))}</strong></div><div class="svitlo-weather-range"><span>Мін. <b>${escape(cleanTemp(temperatureTodayMin))}</b></span><span>Макс. <b>${escape(cleanTemp(temperatureTodayMax))}</b></span></div></div>`;
}
export const WEATHER_INSET_CSS=`.svitlo-weather-header-date{position:absolute;display:flex;align-items:center;justify-content:center;font:700 clamp(6px,1.25cqw,18px)/1 system-ui,sans-serif;color:#fff;text-shadow:0 0 5px #68ff9a;white-space:nowrap;overflow:hidden}.svitlo-artwork{container-type:inline-size}.svitlo-weather-inset{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:2%;padding:0.5%;overflow:hidden;border-radius:9px;background:linear-gradient(115deg,#031d13 0%,#06251b 70%,#041b12 100%);color:#e9fff8;text-shadow:0 0 7px #32ffd28c;font-family:system-ui,sans-serif}.svitlo-weather-now{display:flex;align-items:center;justify-content:center;min-width:0;white-space:nowrap}.svitlo-weather-now small{font-size:clamp(5px,1.05cqw,15px);font-weight:700;color:#9affb7}.svitlo-weather-now strong{font-size:clamp(8px,2.1cqw,30px);line-height:1;color:#a8f7ff;text-shadow:none;font-variant-numeric:lining-nums tabular-nums;letter-spacing:0}.svitlo-weather-range{display:flex;justify-content:center;gap:3%;font-size:clamp(5px,0.68cqw,10px);white-space:nowrap;letter-spacing:-0.01em}.svitlo-weather-range b{color:#c6faff}`;
