// Maps the existing Open-Meteo weatherForDate() result to three artwork fields.
// Do not substitute daily extrema for a missing current measurement.
const formatTemperature = value => Number.isFinite(value) ? (value>0?"+":"")+Math.round(value)+"°C" : "—";
export function todayTemperatureOverlay(weather) {
 if(!weather || typeof weather!=="object")throw new Error("Weather snapshot required");
 if(weather.date && weather.todayDate && weather.date!==weather.todayDate)throw new Error("Today panel requires today weather snapshot");
 const feelsLike=weather.currentFeelsLike ?? weather.apparentTemperature;
 return {
  ...(Number.isFinite(feelsLike)?{temperatureFeelsLike:formatTemperature(feelsLike)}:{}),
  temperatureNow:formatTemperature(weather.currentNowTemp ?? weather.currentTemp),
  temperatureTodayMin:formatTemperature(weather.todayMin),
  temperatureTodayMax:formatTemperature(weather.todayMax)
 };
}
