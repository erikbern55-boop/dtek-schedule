// Approved-artwork test integration. The caller supplies the exact approved clean-plate
// image and measured rectangles. No sample schedule/weather values or Telegram posting.
import {buildIntegratedPreview} from "./card-v3-preview.js";
import {buildLiveWeatherInsetPreview} from "./card-v3-live-weather-preview.js";

export function buildApprovedArtworkFromSnapshots({artworkUrl,rectangles,sourceRectangles,schedulePeriods,scheduleDate,weatherSnapshot,now=new Date()}={}){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error("Valid current time required");
 if(!Array.isArray(schedulePeriods)||!schedulePeriods.length)throw Error("Live DTEK periods required");
 if(!weatherSnapshot||typeof weatherSnapshot!=="object")throw Error("Mapped live weather required");
 return buildIntegratedPreview({artworkUrl,rectangles,sourceRectangles,schedulePeriods,scheduleDate,
  weatherSnapshot,nowMs:now.getTime(),useWeatherInset:true,useWeatherHeaderDate:true,
  useDailyContent:true,dailyDate:scheduleDate});
}

export async function buildApprovedArtworkFromLiveWeather({artworkUrl,rectangles,sourceRectangles,schedulePeriods,scheduleDate,now=new Date(),weatherLoader,weatherMapper}={}){
 if(!Array.isArray(schedulePeriods)||!schedulePeriods.length)throw Error("Live DTEK periods required");
 const options={artworkUrl,rectangles,sourceRectangles,schedulePeriods,scheduleDate,now,
  useWeatherHeaderDate:true,useDailyContent:true};
 if(weatherLoader!==undefined)options.weatherLoader=weatherLoader;
 if(weatherMapper!==undefined)options.weatherMapper=weatherMapper;
 return buildLiveWeatherInsetPreview(options);
}
