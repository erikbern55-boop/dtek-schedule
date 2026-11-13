// Test-branch-only integration with the real, existing Open-Meteo weather pipeline.
// Reuses its 30-minute cache and Kyiv-local date; never fabricates readings.
import {loadWeather,weatherForDate} from "./weather.js";
import {kyivDate} from "./source.js";
import {buildIntegratedPreview} from "./card-v3-preview.js";
export async function buildLiveWeatherInsetPreview({
 now=new Date(),weatherLoader=loadWeather,weatherMapper=weatherForDate,
 artworkUrl,rectangles={},sourceRectangles,previousData={},scheduleSnapshot,
 schedulePeriods,scheduleDate,referenceWidth=1404,referenceHeight=1536,useWeatherHeaderDate=false
}={}){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error("Valid current date required");
 const snapshot=await weatherLoader({now});
 if(!snapshot)throw Error("Weather unavailable: refuse to display sample values as live");
 const today=kyivDate(now);
 const weather=weatherMapper(snapshot,today,now);
 if(!weather||weather.stale)throw Error("Weather is missing or stale");
 const fetchedAtMs=Date.parse(snapshot.fetchedAt);
 if(!Number.isFinite(fetchedAtMs))throw Error("Missing weather fetch timestamp");
 const result=buildIntegratedPreview({
  artworkUrl,rectangles,sourceRectangles,previousData,scheduleSnapshot,schedulePeriods,scheduleDate,
  weatherSnapshot:weather,nowMs:now.getTime(),weatherFetchedAtMs:fetchedAtMs,
  referenceWidth,referenceHeight,useWeatherInset:true,useWeatherHeaderDate
 });
 return {...result,weatherFetchedAt:snapshot.fetchedAt,weatherSource:"Open-Meteo",weatherDate:today};
}
