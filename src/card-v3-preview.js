// Preview-only integration of schedule and weather snapshots.
// Caller provides the approved artwork file, measured rectangles and actual fetched snapshots.
// No production route is changed; no sample values are silently substituted.
import {mergeFreshArtworkData,refreshDue} from "./card-v3-refresh.js";
import {todayTemperatureOverlay} from "./card-v3-temperature.js";
import {buildLiveArtworkV3} from "./card-v3-live.js";
import {ARTWORK_FIRST_CSS} from "./card-v3-artwork.js";
import {dtekArtworkFields} from "./card-v3-dtek.js";

export function buildIntegratedPreview({artworkUrl,rectangles,sourceRectangles,previousData={},scheduleSnapshot,schedulePeriods,scheduleDate,weatherSnapshot,nowMs,scheduleFetchedAtMs,weatherFetchedAtMs,referenceWidth=1404,referenceHeight=1536}={}) {
 if(scheduleSnapshot!==undefined && schedulePeriods!==undefined)throw new Error("Provide either DTEK periods or preformatted schedule, not both");
 const schedule=schedulePeriods!==undefined?dtekArtworkFields({schedule:schedulePeriods,date:scheduleDate,now:new Date(nowMs)}):scheduleSnapshot;
 const weather=weatherSnapshot===undefined?undefined:todayTemperatureOverlay(weatherSnapshot);
 const data=mergeFreshArtworkData({previous:previousData,schedule,weather});
 const due=refreshDue({nowMs,scheduleFetchedAtMs,weatherFetchedAtMs});
 const card=buildLiveArtworkV3({artworkUrl,rectangles,sourceRectangles,data,referenceWidth,referenceHeight});
 const html='<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Світлопульс 3.0 — тест</title><style>html,body{margin:0;background:#061318;color:#fff;font-family:system-ui,sans-serif}main{max-width:1404px;margin:auto}'+ARTWORK_FIRST_CSS+'</style></head><body><main>'+card+'</main></body></html>';
 return {html,data,due};
}
