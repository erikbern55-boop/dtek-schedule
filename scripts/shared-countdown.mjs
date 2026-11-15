// Pure countdown contract, shared by test renderers; no UI/design changes.
const parse=t=>{if(!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$|^24:00$/.test(t))throw Error('Invalid clock '+t);return Number(t.slice(0,2))*60+Number(t.slice(3));};
export function nextPowerTransition(today,tomorrow,nowMinute){
 if(!Array.isArray(today?.periods)||!Number.isFinite(nowMinute)||nowMinute<0||nowMinute>=1440)throw Error('Invalid today or current time');
 const periods=today.periods;
 for(let i=1;i<periods.length;i++)if(periods[i].power!==periods[i-1].power&&parse(periods[i].begin)>nowMinute)return {day:'today',time:periods[i].begin,power:periods[i].power,remainingMinutes:Math.ceil(parse(periods[i].begin)-nowMinute)};
 if(!Array.isArray(tomorrow?.periods)||!tomorrow.periods.length)return null;
 const next=tomorrow.periods;
 const first=next[0].power!==periods.at(-1).power?next[0]:next.find((p,i)=>i>0&&p.power!==next[i-1].power);
 if(!first)return null;
 return {day:'tomorrow',time:first.begin,power:first.power,remainingMinutes:Math.ceil(1440-nowMinute+parse(first.begin))};
}
export function countdownLabel(event){
 if(!event)return {clock:'—:—',title:'Наступну подію не визначено'};
 const m=event.remainingMinutes;
 return {clock:String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),title:event.power?'До наступного ввімкнення':'До наступного вимкнення'};
}
