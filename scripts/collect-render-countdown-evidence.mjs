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
try {
 for(const c of cases){
  const expected=countdownLabel(nextPowerTransition(today,c.tomorrow,c.minute));
  const page=await browser.newPage({viewport:{width:1404,height:900}});
  await page.route('**/svitlopuls-live.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(today)}));
  await page.goto('file://'+process.cwd()+'/dist/index.html');
  const actual=await page.evaluate(({minute,tomorrow})=>{
   if(typeof window.__tickCountdownForTest!=='function')throw Error('Browser test clock hook missing');
   window.__trialSchedule.periods=window.__trialSchedule.periods;
   window.__trialSchedule.tomorrow=tomorrow;
   window.__countdownTestMinute=minute;
   window.__tickCountdownForTest();
   return {clock:document.querySelector('.v3-clock')?.textContent?.trim(),title:document.querySelector('.v3-count-event')?.textContent?.trim()};
  },{minute:c.minute,tomorrow:c.tomorrow});
  const verified=actual.clock===expected.clock&&actual.title===expected.title;
  results.push({name:c.name,minute:c.minute,expected,html:actual,htmlVerified:verified,pngVerified:false,reason:'PNG generator controlled-time DOM evidence not captured'});
  await page.close();
 }
} finally {await browser.close()}
const report={cases:results,sameRulesVerified:false,scope:'HTML only; PNG rendering still requires controlled-time capture'};
fs.writeFileSync('../isolated-contract/countdown-render-evidence.json',JSON.stringify(report,null,2));
if(results.some(r=>!r.htmlVerified))throw Error('Rendered HTML countdown mismatch');
console.log('PASS rendered HTML at three injected times; PNG cross-renderer proof remains pending');
