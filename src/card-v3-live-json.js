// Shared snapshot adapter for the test HTML viewer. No Telegram calls or public writes.
import {nextPowerEvent} from "./countdown.js";
import {calculateDailyTotals} from "./summary.js";

function validTime(t){return typeof t==="string"&&/^([01]\\d|2[0-4]):[0-5]\\d$/.test(t)}
function safeText(v){return typeof v==="string"&&v.trim()?v.trim():undefined}
export function buildV3LivePayload({schedule,date,label,update,source,weather,now=new Date(),daily={}}={}){
 if(!Array.isArray(schedule)||!schedule.length)throw Error("Verified schedule required");
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error("Valid timestamp required");
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date||""))throw Error("Valid schedule date required");
 for(const p of schedule){if(!validTime(p.begin)||!validTime(p.end)||typeof p.power!=="boolean")throw Error("Invalid schedule period");}
 calculateDailyTotals(schedule);
 const off=schedule.filter(p=>!p.power),on=schedule.filter(p=>p.power);
 const event=label==="сьогодні"?nextPowerEvent(schedule,date,now):null;
 const payload={updatedAt:now.toISOString(),scheduleDate:date,source:source||"ДТЕК",
  power:{periods:schedule,onText:on.length?on.map(p=>p.begin+"–"+p.end).join(", "):"Немає",
   offText:off.length?off.map(p=>p.begin+"–"+p.end).join(", "):"Немає",
   status:event?.currentPower===true?"За графіком: світло є":event?.currentPower===false?"За графіком: світла немає":"Графік ДТЕК",eventLabel:event?.title||"Подій немає",
   eventTime:event?.time||null,nextAt:event?.kind==="countdown"?new Date(now.getTime()+event.minutesRemaining*60000).toISOString():null}};
 // The weather object must be explicitly mapped; never fabricate values from a timestamp.
 if(weather?.current&&weather?.daily){payload.weather=weather;}
 for(const key of ["garden","moon","astro"]){if(daily[key]&&typeof daily[key]==="object")payload[key]=daily[key];}
 return payload;
}
