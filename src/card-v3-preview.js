// Preview-only integration of schedule and weather snapshots.
// Caller provides the approved artwork file, measured rectangles and actual fetched snapshots.
// No production route is changed; no sample values are silently substituted.
import {mergeFreshArtworkData,refreshDue} from "./card-v3-refresh.js";
import {todayTemperatureOverlay} from "./card-v3-temperature.js";
import {buildLiveArtworkV3} from "./card-v3-live.js";
import {ARTWORK_FIRST_CSS} from "./card-v3-artwork.js";
import {dtekArtworkFields} from "./card-v3-dtek.js";
import {dailyArtworkFields} from "./card-v3-daily-content.js";
import {weatherInsetHtml,weatherHeaderDateHtml,WEATHER_INSET_CSS} from "./card-v3-weather-inset.js";

export function buildIntegratedPreview({artworkUrl,rectangles,sourceRectangles,previousData={},scheduleSnapshot,schedulePeriods,scheduleDate,weatherSnapshot,nowMs,scheduleFetchedAtMs,weatherFetchedAtMs,referenceWidth=1404,referenceHeight=1536,useWeatherInset=false,useWeatherHeaderDate=false,useDailyContent=false,dailyDate}={}) {
 if(scheduleSnapshot!==undefined && schedulePeriods!==undefined)throw new Error("Provide either DTEK periods or preformatted schedule, not both");
 const schedule=schedulePeriods!==undefined?dtekArtworkFields({schedule:schedulePeriods,date:scheduleDate,now:new Date(nowMs)}):scheduleSnapshot;
 const weather=weatherSnapshot===undefined?undefined:todayTemperatureOverlay(weatherSnapshot);
 const daily=useDailyContent?dailyArtworkFields({date:dailyDate||scheduleDate,weather:weatherSnapshot}):undefined;
 const data=mergeFreshArtworkData({previous:previousData,schedule,weather});
 if(daily)Object.assign(data,daily);
 const due=refreshDue({nowMs,scheduleFetchedAtMs,weatherFetchedAtMs});
 const renderData={...data};
 if(useWeatherInset){
  for(const key of ["temperatureNow","temperatureTodayMin","temperatureTodayMax"]){
   if(typeof data[key]!=="string"||data[key]==="—"||!data[key].trim())throw new Error("Today weather requires all three temperatures: "+key);
   delete renderData[key];
  }
 }
 let card=buildLiveArtworkV3({artworkUrl,rectangles,sourceRectangles,data:renderData,referenceWidth,referenceHeight});
 if(useWeatherInset){
  const inset=weatherInsetHtml({...data,width:referenceWidth,height:referenceHeight});
  if(!card.endsWith("</section>"))throw new Error("Artwork renderer did not return the expected section");
  card=card.slice(0,-"</section>".length)+inset+"</section>";
 }
 if(useWeatherHeaderDate){
  if(!useWeatherInset)throw new Error("Weather header date requires weather inset");
  if(!Number.isFinite(nowMs))throw new Error("Current timestamp required for dynamic weather date");
  const date=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",day:"2-digit",month:"2-digit"}).format(new Date(nowMs)).replace("/","." );
  const overlay=weatherHeaderDateHtml(date,{width:referenceWidth,height:referenceHeight});
  card=card.slice(0,-"</section>".length)+overlay+"</section>";
 }
 const html='<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Світлопульс 3.0 — тест</title><style>html,body{margin:0;background:#061318;color:#fff;font-family:system-ui,sans-serif}main{max-width:1404px;margin:auto}'+ARTWORK_FIRST_CSS+(useWeatherInset?WEATHER_INSET_CSS:'')+'</style></head><body><main>'+card+'</main></body></html>';
 return {html,data,due};
}
