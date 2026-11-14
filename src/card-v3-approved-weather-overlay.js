// Isolated owner-approved 1199x1312 weather overlay. Not wired into public site.
// Positions are relative to the approved reference; labels are live values, not baked into artwork.
import {NEON_REFERENCE,TODAY_WEATHER_REGIONS} from "./card-v3-neon-weather-geometry.js";
const escape=s=>String(s??"—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const box=r=>`left:${r.x/NEON_REFERENCE.width*100}%;top:${r.y/NEON_REFERENCE.height*100}%;width:${r.width/NEON_REFERENCE.width*100}%;height:${r.height/NEON_REFERENCE.height*100}%`;
export function approvedWeatherOverlayHtml({date="—",temperatureNow="—",temperatureTodayMin="—",temperatureTodayMax="—",temperatureFeelsLike,conditions="",wind="",precipitation="",pressure="",humidity=""}={}){
 const values={
  heading:`Погода — СЬОГОДНІ ${date}`,
  temperature:temperatureNow,
  minimum:`Мін. ${temperatureTodayMin}`,
  maximum:`Макс. ${temperatureTodayMax}`,
  feelsLike:temperatureFeelsLike===undefined?"":`Відчувається ${temperatureFeelsLike}`,
  conditions,
  metrics:""
 };
 const metrics=[["wind","🌬️","Вітер",wind],["precipitation","💧","Опади",precipitation],["pressure","◉","Тиск",pressure],["humidity","💦","Вологість",humidity]].filter(([, , ,value])=>value!==""&&value!==null&&value!==undefined);
 const metricHtml=metrics.map(([key,icon,label,value])=>`<div class="v3-weather-metric-row" data-weather-metric="${key}"><span class="v3-weather-metric-icon" aria-hidden="true">${icon}</span><span class="v3-weather-metric-label">${label}:</span><strong>${escape(value)}</strong></div>`).join("");
 return Object.entries(TODAY_WEATHER_REGIONS).filter(([key])=>key!=="feelsLike"||temperatureFeelsLike!==undefined).map(([key,r])=>`<div class="v3-weather-field v3-weather-${key}" data-weather-field="${key}" style="${box(r)}">${key==="metrics"?metricHtml:escape(values[key])}</div>`).join("");
}
export const APPROVED_WEATHER_OVERLAY_CSS=`
.v3-approved-stage{position:relative;width:100%;aspect-ratio:1199/1312;container-type:inline-size;overflow:hidden}
.v3-weather-field{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;overflow:hidden;text-align:center;color:#f0fff5;font:600 clamp(5px,1.3cqw,16px)/1.1 system-ui,sans-serif;overflow-wrap:anywhere}
.v3-weather-heading{font-size:clamp(6px,1.55cqw,19px);font-weight:800;white-space:nowrap}
.v3-weather-temperature{font-size:clamp(9px,3.1cqw,38px);font-weight:800;color:#baffd1}
.v3-weather-minimum,.v3-weather-maximum,.v3-weather-feelsLike,.v3-weather-conditions{font-size:clamp(5px,1.16cqw,14px)}
.v3-weather-metrics{display:flex;flex-direction:column;align-items:stretch;justify-content:space-evenly;gap:2%;padding:2% 3%;font-size:clamp(5px,1.0cqw,12px);line-height:1.1}
.v3-weather-metric-row{display:flex;align-items:center;gap:3%;min-width:0;white-space:nowrap;overflow:hidden}
.v3-weather-metric-icon{flex:0 0 16%;font-size:1.2em;text-align:center}
.v3-weather-metric-label{flex:0 0 auto;color:#b9ffdf}
.v3-weather-metric-row strong{min-width:0;overflow:hidden;text-overflow:ellipsis;color:#fff;font-weight:700}
`;
