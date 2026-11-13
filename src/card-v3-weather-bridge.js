// Test-branch bridge: existing weatherForDate() -> live artwork card.
// The caller supplies the approved clean-plate asset and measured rectangles.
// This module does not alter production routes or fetch weather independently.
import {todayTemperatureOverlay} from "./card-v3-temperature.js";
import {buildLiveArtworkV3} from "./card-v3-live.js";
export const TODAY_TEMPERATURE_FIELDS = Object.freeze(["temperatureNow","temperatureTodayMin","temperatureTodayMax"]);
export function renderArtworkWithWeather({weather,data={},rectangles,artworkUrl,referenceWidth=1404,referenceHeight=1536,sourceRectangles}={}) {
 const temperature = todayTemperatureOverlay(weather);
 for(const key of TODAY_TEMPERATURE_FIELDS){
  if(!rectangles?.[key])throw new Error("Missing measured today-temperature rectangle: "+key);
 }
 return buildLiveArtworkV3({
  artworkUrl,referenceWidth,referenceHeight,rectangles,
  data:{...data,...temperature},sourceRectangles
 });
}
