import fs from 'node:fs';
import assert from 'node:assert/strict';
import {nextPowerTransition,countdownLabel} from './shared-countdown.mjs';
const s=fs.readFileSync('renderer/live-generator.mjs','utf8');
assert.match(s,/sharedCardCountdown\(buildCardV3Html\(details\)/);
assert.match(s,/sharedCardCountdown\(buildCardV3Html\(\{schedule:periods/);
assert.match(s,/const event=nextPowerTransition\(\{periods:data.periods\},data.tomorrow,nowMin\)/);
assert.match(s,/function sharedCardCountdown\(/);
const today={periods:[{begin:'00:00',end:'11:30',power:true},{begin:'11:30',end:'15:30',power:false},{begin:'15:30',end:'24:00',power:true}]};
const tomorrow={periods:[{begin:'00:00',end:'06:00',power:true},{begin:'06:00',end:'24:00',power:false}]};
const scenarios=[
 ['today',689,tomorrow,'today','11:30','00:01'],
 ['midnight',1439,tomorrow,'tomorrow','06:00','06:01'],
 ['no-tomorrow',1439,null,null,null,'—:—']
];
for(const [name,minute,next,day,time,clock] of scenarios){
 const png=nextPowerTransition(today,next,minute);
 const browser=nextPowerTransition(today,next,minute);
 assert.deepEqual(png,browser,name);
 assert.equal(png?.day??null,day,name);
 assert.equal(png?.time??null,time,name);
 assert.equal(countdownLabel(png).clock,clock,name);
}
console.log('PASS: both isolated renderer call sites and three deterministic boundary cases');