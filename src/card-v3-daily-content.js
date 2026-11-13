// Preview-only adapter: reuse the same date-specific modules as the public weather card.
// No network access, invented forecasts or publishing side effects.
import {gardenTip,sowingAdvice} from "./garden.js";
import {lunarForDate} from "./moon.js";
import {astroForMoon} from "./astro.js";
export function dailyArtworkFields({date,weather}={}){
 if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T12:00:00Z")))throw Error("Valid YYYY-MM-DD date required");
 const moon=lunarForDate(date);
 const astro=astroForMoon(moon,date);
 const sow=sowingAdvice(date,weather,moon);
 return {
  gardenAdvice:gardenTip(date,weather),
  sowingAdvice:["Можна: "+sow.allowed,"Не варто: "+sow.avoid,"За Місяцем: "+sow.lunar].join("\n"),
  moonPhase:moon.phase,
  lunarDay:String(moon.lunarDay)+"-й день · освітленість "+moon.illumination+"% · "+moon.zodiac,
  astroForecast:"Місяць у "+astro.inSign+". "+astro.message+" (розважальний прогноз)"
 };
}
