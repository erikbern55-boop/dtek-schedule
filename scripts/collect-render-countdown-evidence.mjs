// Evidence captured from the actual Playwright page immediately before PNG screenshot.
// Test-only: no changes to the production renderer or visual geometry.
import fs from 'node:fs';
import {chromium} from 'playwright';
import {nextPowerTransition,countdownLabel} from './shared-countdown.mjs';
const today=JSON.parse(fs.readFileSync('../isolated-contract/today.json','utf8'));
const cases=[
 {name:'today-transition',minute:689,tomorrow:null},
 {name:'next-day',minute:1439,tomorrow:{periods:[{begin:'00:00',end:'06:00',power:true},{begin:'06:00',end:'24:00',power:false}]}},
 {name:'unknown-tomorrow',minute:1439,tomorrow:null}
];
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const c of cases){
  const expected=countdownLabel(nextPowerTransition(today,c.tomorrow,c.minute));
  const page=await browser.newPage({viewport:{width:1404,height:900}});
  await page.goto('file://'+process.cwd()+'/dist/index.html');
  const actual=await page.evaluate(({minute,tomorrow})=>{
   const schedule=window.__trialSchedule;
   if(!schedule)throw Error('Browser schedule missing');
   schedule.periods=JSON.parse(document.getElementById('audit-periods')?.textContent||'null')||schedule.periods;
   schedule.tomorrow=tomorrow;
   // Deterministic browser clock: override Date only for tickLive.
   const NativeDate=Date;
   const todayDate=schedule.date;
   const hh=String(Math.floor(minute/60)).padStart(2,'0');
   const mm=String(minute%60).padStart(2,'0');
   const fakeTime=new NativeDate(todayDate+'T'+hh+':'+mm+':00+02:00').getTime();
   // No forced clock override here: the page is a real browser render, and
   // dynamic time needs an explicit injectable clock to make this deterministic.
   return {clock:document.querySelector('.v3-clock')?.textContent?.trim(),date:schedule.date,requestedMinute:minute,hasClockInjection:false};
  },{minute:c.minute,tomorrow:c.tomorrow});
  results.push({name:c.name,expected,html:actual,verified:false,reason:'Browser time injection not yet implemented'});
  await page.close();
 }
}finally{await browser.close()}
fs.writeFileSync('../isolated-contract/countdown-render-evidence.json',JSON.stringify({cases:results,sameRulesVerified:false},null,2));
console.log('Evidence collected; deterministic rendered countdown still unverified');
