// Test-only bridge from the existing official/mirror DTEK pipeline to the approved artwork.
// Uses the same configured society group and never guesses missing hour states.
import {getShutdownsData,selectScheduleDays,kyivDate} from "./source.js";
import {GROUP,PowerState} from "./constants.js";
import {createPeriod,useSchedule} from "./helpers.js";
import {buildApprovedArtworkFromLiveWeather} from "./card-v3-approved-integration.js";

export function periodsFromDtekFact(fact,{now=new Date(),group=GROUP,day=kyivDate(now)}={}){
 if(typeof group!=="string"||!/^GPV\\d+$/.test(group))throw Error("Configured DTEK group required");
 const selected=selectScheduleDays(fact,now).find(d=>d.date===day);
 if(!selected)throw Error("Current DTEK schedule day unavailable");
 const states=fact.data?.[selected.key]?.[group];
 if(!states)throw Error("DTEK group unavailable: "+group);
 const [periods,append]=useSchedule([]);
 for(let hour=0;hour<24;hour++){
  const state=states[hour+1];
  if(!Object.values(PowerState).includes(state))throw Error("Missing DTEK hour "+(hour+1));
  if(state===PowerState.ON||state===PowerState.OFF)append(createPeriod({hour,power:state===PowerState.ON}));
  else if(state===PowerState.HALF_ON){append(createPeriod({hour,endMin:30,power:true}));append(createPeriod({hour,startMin:30,power:false}));}
  else {append(createPeriod({hour,endMin:30,power:false}));append(createPeriod({hour,startMin:30,power:true}));}
 }
 return periods;
}

export async function buildApprovedArtworkFromLiveSources({now=new Date(),dtekLoader=getShutdownsData,group=GROUP,...cardOptions}={}){
 const response=await dtekLoader();
 if(!response?.fact)throw Error("Verified DTEK schedule required");
 const scheduleDate=kyivDate(now);
 const schedulePeriods=periodsFromDtekFact(response.fact,{now,group,day:scheduleDate});
 return {...await buildApprovedArtworkFromLiveWeather({...cardOptions,now,scheduleDate,schedulePeriods}),
  scheduleSource:response.source||"ДТЕК"};
}
