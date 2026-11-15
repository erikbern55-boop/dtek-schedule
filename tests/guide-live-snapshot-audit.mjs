#!/usr/bin/env node
// Read-only parity audit. Never writes to production or publishes anything.
import fs from 'node:fs/promises';
const base=process.env.SVITLOPULS_URL||'https://erikbern55-boop.github.io/dtek-schedule/';
const url=name=>new URL(name,base).href;
const fetchJson=async name=>{
 const response=await fetch(url(name)+'?audit='+Date.now(),{headers:{'cache-control':'no-cache'}});
 if(!response.ok)throw Error(name+': HTTP '+response.status);
 return response.json();
};
const output={checkedAt:new Date().toISOString(),source:base,status:'INCOMPLETE',checks:[],errors:[]};
const check=(label,ok,actual,expected)=>output.checks.push({label,status:ok?'PASS':'FAIL',actual,expected});
const get=(o,path)=>path.split('.').reduce((v,k)=>v?.[k],o);
try{
 const [live,canonical]=await Promise.all([fetchJson('svitlopuls-live.json'),fetchJson('today.json')]);
 output.snapshot=live;
 output.canonical=canonical;
 const kyiv=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Kyiv'}).format(new Date());
 check('Kyiv date',live.date===kyiv,live.date,kyiv);
 check('Group 1.1',live.group==='1.1',live.group,'1.1');
 check('Telegram date',live.date===canonical.date,live.date,canonical.date);
 check('Telegram group',live.group===canonical.group,live.group,canonical.group);
 check('Schedule periods',JSON.stringify(live.periods)===JSON.stringify(canonical.periods),live.periods,canonical.periods);
 const age=Date.now()-Date.parse(live.generatedAt);
 check('Live generated <= 12 min',Number.isFinite(age)&&age>=-60000&&age<=720000,live.generatedAt,'<=12 min');
 check('Live flag',live.live===true,live.live,true);
 const sections={weather:['currentNowTemp','todayMin','todayMax','tomorrowMin','tomorrowMax','currentNowWind','currentNowGust','todayRain','soilTemp','soilAt','fetchedAt','stale'],garden:['tip','allowed','avoid','lunar'],moon:['lunarDay','phase','illumination','zodiac','sampleHour'],astro:['sign','message']};
 for(const [section,fields] of Object.entries(sections)){
  check(section+' present',!!live[section],!!live[section],true);
  for(const field of fields){
   const v=get(live,section+'.'+field);
   check(section+'.'+field+' supplied',v!==undefined&&v!==null,v,'non-null');
  }
 }
 check('Weather not stale',live.weather?.stale===false,live.weather?.stale,false);
 output.status=output.checks.every(x=>x.status==='PASS')?'PASS':'FAIL';
}catch(error){output.errors.push(String(error));output.status='INCOMPLETE';}
await fs.writeFile(process.env.AUDIT_OUTPUT||'svitlopuls-test-snapshot.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,passed:output.checks.filter(x=>x.status==='PASS').length,failed:output.checks.filter(x=>x.status==='FAIL').length,errors:output.errors},null,2));
if(output.status!=='PASS')process.exitCode=1;
