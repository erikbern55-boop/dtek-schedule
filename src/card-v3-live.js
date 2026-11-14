// Convert already-fetched V3 data into independent artwork overlay values.
// No network requests here: the existing schedule/weather pipeline remains authoritative.
import {buildArtworkFirstCard} from "./card-v3-artwork.js";
import {buildSourceLinkLayers} from "./card-v3-sources.js";

const FIELDS = ["date","weekday","countdown","powerStatus","powerPeriods","powerTotals","temperatureNow","temperatureTodayMin","temperatureTodayMax","temperatureToday","temperatureTomorrow","wind","gusts","precipitation","soilTemperature","sunrise","sunset","gardenAdvice","sowingAdvice","moonPhase","lunarDay","astroForecast","updatedAt"];
export const ARTWORK_DATA_FIELDS = Object.freeze([...FIELDS]);
export function buildLiveArtworkV3({artworkUrl,referenceWidth,referenceHeight,rectangles,data,sourceRectangles}={}) {
 if(!data || typeof data!=="object") throw new Error("Live data object required");
 if(!rectangles || typeof rectangles!=="object") throw new Error("Measured overlay rectangles required");
 const layers=[];
 for(const key of FIELDS) {
  if(!(key in data)) continue;
  const rect=rectangles[key];
  if(!rect)throw new Error("Missing measured rectangle for live field: "+key);
  const value=data[key];
  if(value === null || value === undefined) continue;
  if(typeof value!=="string" && typeof value!=="number")throw new Error("Expected preformatted live value for "+key);
  layers.push({id:"live-"+key.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase(),...rect,text:String(value)});
 }
 if(sourceRectangles)layers.push(...buildSourceLinkLayers(sourceRectangles));
 return buildArtworkFirstCard({artworkUrl,referenceWidth,referenceHeight,layers});
}
