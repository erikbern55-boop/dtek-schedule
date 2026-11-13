// Adapter from the existing DTEK period model to the approved artwork.
// Uses planned periods only, never claims sensor-confirmed electricity.
import {nextPowerEvent} from "./countdown.js";
const clock = x => /^\d{2}:\d{2}$/.test(x);
export function dtekArtworkFields({schedule,date,now=new Date()}={}) {
 if(!Array.isArray(schedule)||!schedule.length||!/^\d{4}-\d{2}-\d{2}$/.test(date||""))throw new Error("DTEK schedule and date required");
 for(const p of schedule){
  if(!p||!clock(p.begin)||!clock(p.end)||typeof p.power!=="boolean")throw new Error("Invalid DTEK period");
 }
 const event=nextPowerEvent(schedule,date,now);
 const powerStatus=typeof event.currentPower==="boolean"
  ?(event.currentPower?"За графіком: світло є":"За графіком: світла немає")
  :"За графіком: стан уточнюється";
 return {
  powerStatus,
  countdown:event.kind==="countdown"?event.remaining:"—:—",
  powerPeriods:schedule.map(p=>p.begin+"–"+p.end+" "+(p.power?"світло":"без світла")).join("\n")
 };
}
