// Preview-only renderer for the owner-approved neon reference.
// It refuses to render without an explicit artwork URL and live weather fields.
// Never substitutes the wireframe, demo temperatures or an arbitrary image.
import {NEON_REFERENCE} from "./card-v3-neon-weather-geometry.js";
import {approvedWeatherOverlayHtml,APPROVED_WEATHER_OVERLAY_CSS} from "./card-v3-approved-weather-overlay.js";

const escape=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const required=["date","temperatureNow","temperatureTodayMin","temperatureTodayMax","temperatureFeelsLike","conditions","wind","precipitation","pressure","humidity"];

export function buildApprovedWeatherStage({artworkUrl,weather,artworkWidth,artworkHeight}={}){
 if(typeof artworkUrl!=="string"||!artworkUrl.trim())throw Error("Approved artwork URL required; do not substitute wireframe");
 if(!weather||typeof weather!=="object")throw Error("Live weather snapshot required");
 for(const key of required)if(weather[key]===undefined||weather[key]===null||String(weather[key]).trim()==="")throw Error("Missing live weather field: "+key);
 if(!((artworkWidth===NEON_REFERENCE.width&&artworkHeight===NEON_REFERENCE.height)||(artworkWidth===1404&&artworkHeight===1536)))
  throw Error("Approved artwork geometry mismatch: expected 1404x1536 final reference or 1199x1312 legacy geometry; supplied "+artworkWidth+"x"+artworkHeight);
 // Weather coordinates are percentages of the reference image.\n const fields=approvedWeatherOverlayHtml(weather);
 const html='<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Світлопульс 3.0 — погодний еталон (тест)</title><style>html,body{margin:0;background:#04140e;color:white}main{width:min(100%,1404px);margin:auto}.v3-approved-stage{background-image:url("'+escape(artworkUrl)+'");background-size:100% 100%;background-repeat:no-repeat}'+APPROVED_WEATHER_OVERLAY_CSS+' .v3-approved-stage{aspect-ratio:'+artworkWidth+'/'+artworkHeight+'}</style></head><body><main><section class="v3-approved-stage" aria-label="Погодний блок Світлопульсу 3.0">'+fields+'</section></main></body></html>';
 return {html,reference:{width:artworkWidth,height:artworkHeight},mode:"isolated-preview-only"};
}
