import test from 'node:test';
import assert from 'node:assert/strict';
import {nextV3Event} from '../src/v3-next-event.js';
import {normalizeV3LiveData} from '../src/v3-live-schema-adapter.js';
const raw={scheduleDate:'2026-11-14',power:{periods:[
 {begin:'00:00',end:'05:00',power:true},
 {begin:'05:00',end:'09:00',power:false},
 {begin:'09:00',end:'15:30',power:true},
 {begin:'15:30',end:'19:30',power:false},
 {begin:'19:30',end:'24:00',power:true}]}};
const d=normalizeV3LiveData(raw);
test('Kyiv next power off from actual schedule, not stale nextAt',()=>{
 const e=nextV3Event(d,new Date('2026-11-14T02:00:00Z'));
 assert.equal(e.label,'До планового вимкнення');assert.equal(e.minutes,60);
});
test('Kyiv next power on',()=>{
 const e=nextV3Event(d,new Date('2026-11-14T04:00:00Z'));
 assert.equal(e.label,'До планового увімкнення');assert.equal(e.minutes,180);
});
test('stale date cannot show a live countdown',()=>assert.equal(nextV3Event(d,new Date('2026-11-15T04:00:00Z')),null));
test('24:00 boundary accepted',()=>assert.equal(nextV3Event(d,new Date('2026-11-14T21:30:00Z')).minutes,30));
test('gap in periods rejected',()=>{
 const broken={...d,periods:d.periods.map(x=>({...x}))};broken.periods[1].start='05:30';
 assert.equal(nextV3Event(broken,new Date('2026-11-14T02:00:00Z')),null);
});
