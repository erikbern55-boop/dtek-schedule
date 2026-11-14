// Independent refresh gates for the artwork preview. No polling side effects.
// The existing production fetchers remain responsible for retrieving DTEK and Open-Meteo.
export const DTEK_REFRESH_MS = 5 * 60 * 1000;
export const WEATHER_REFRESH_MS = 30 * 60 * 1000;
export function refreshDue({nowMs, scheduleFetchedAtMs, weatherFetchedAtMs}={}) {
 if(!Number.isFinite(nowMs))throw new Error("Valid current timestamp required");
 const due = (last,interval)=>!Number.isFinite(last)||last>nowMs||nowMs-last>=interval;
 return {schedule:due(scheduleFetchedAtMs,DTEK_REFRESH_MS),weather:due(weatherFetchedAtMs,WEATHER_REFRESH_MS)};
}
export function mergeFreshArtworkData({previous={},schedule,weather}={}) {
 if(!previous||typeof previous!=="object")throw new Error("Previous artwork data required");
 if(schedule!==undefined && (!schedule||typeof schedule!=="object"))throw new Error("Schedule payload must be an object");
 if(weather!==undefined && (!weather||typeof weather!=="object"))throw new Error("Weather payload must be an object");
 // Weather changes never overwrite the schedule, and schedule changes never erase temperatures.
 return {...previous,...(schedule||{}),...(weather||{})};
}
