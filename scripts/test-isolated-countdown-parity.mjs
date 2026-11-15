import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nextPowerTransition,countdownLabel} from './shared-countdown.mjs';
const root='isolated-contract/';
const telegram=JSON.parse(fs.readFileSync(root+'today.json','utf8'));
const fullscreen=JSON.parse(fs.readFileSync(root+'svitlopuls-live.json','utf8'));
assert.equal(telegram.snapshotId,fullscreen.snapshotId);
for(const minute of [0,689,690,691,929,930,931,1439]){
 const a=nextPowerTransition(telegram,null,minute);
 const b=nextPowerTransition(fullscreen,null,minute);
 assert.deepEqual(a,b,'transition mismatch at minute '+minute);
 assert.deepEqual(countdownLabel(a),countdownLabel(b),'label mismatch at minute '+minute);
}
const tomorrow={periods:[{begin:'00:00',end:'06:00',power:true},{begin:'06:00',end:'24:00',power:false}]};
for(const minute of [930,1200,1439]){
 const a=nextPowerTransition(telegram,tomorrow,minute);
 const b=nextPowerTransition(fullscreen,tomorrow,minute);
 assert.deepEqual(a,b,'next-day mismatch at minute '+minute);
 assert.deepEqual(countdownLabel(a),countdownLabel(b));
}
console.log('PASS: isolated JSON inputs yield identical countdowns using shared contract');
console.log('NOTE: actual Telegram PNG and fullscreen browser renderer integration NOT verified');
