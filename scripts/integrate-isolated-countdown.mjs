import fs from 'node:fs';
const file='renderer/live-generator.mjs';
let src=fs.readFileSync(file,'utf8');
const pure=fs.readFileSync('renderer/shared-countdown.mjs','utf8').replace(/export /g,'');
const replace=(a,b)=>{if(!src.includes(a))throw Error('Missing anchor: '+a.slice(0,80));src=src.replace(a,b)};
replace('function neutralCalendar(markup)', [
'function sharedCardCountdown(markup,periods,tomorrow,now){',
' const fields=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now).map(p=>[p.type,p.value]));',
' const minute=Number(fields.hour)*60+Number(fields.minute)+Number(fields.second)/60;',
' const event=nextPowerTransition({periods},tomorrow,minute);const label=countdownLabel(event);',
' for(const [klass,value] of [["v3-count-event",label.title],["v3-clock",label.clock],["v3-next",event?(event.day==="tomorrow"?"Завтра ":"Сьогодні ")+event.time+" · Київ · ДТЕК":"Перевір графік ДТЕК на завтра"]]){',
'  const start=markup.indexOf("<div class="+String.fromCharCode(34)+klass+String.fromCharCode(34));',
'  if(start<0)throw Error("Missing countdown field "+klass);',
'  const open=markup.indexOf(">",start),end=markup.indexOf("</div>",open);if(open<0||end<0)throw Error("Malformed countdown field "+klass);',
'  markup=markup.slice(0,open+1)+value+markup.slice(end);',
' }return markup;',
'}',
'function neutralCalendar(markup)'
].join('\n'));
src="import {nextPowerTransition,countdownLabel} from './shared-countdown.mjs';\n"+src;
replace("clarifyCountdown(buildCardV3Html(details),result.periods,'сьогодні')","sharedCardCountdown(buildCardV3Html(details),result.periods,{periods:daySchedules.tomorrow??null},now)");
replace('clarifyCountdown(buildCardV3Html({schedule:periods','sharedCardCountdown(buildCardV3Html({schedule:periods');
replace('}),periods,item.label));',"}),periods,{periods:item.slug==='today'?daySchedules.tomorrow??null:null},now));");
const begin=src.indexOf(' const toMin=(t)=>',src.indexOf('function tickLive()'));
const finish=src.indexOf('\n}\n',begin);
if(begin<0||finish<0)throw Error('Browser countdown section changed');
const tick=[
'  const event=nextPowerTransition({periods:data.periods},data.tomorrow,nowMin);',
'  const label=countdownLabel(event);',
'  clockEl.textContent=label.clock;',
'  if(headingEl)headingEl.textContent=label.title;',
'  if(detailEl)detailEl.textContent=event?(event.day==="tomorrow"?"Завтра ":"Сьогодні ")+event.time+" · Київ · за графіком ДТЕК":"Перевір графік ДТЕК на завтра";'
].join('\n');
src=src.slice(0,begin)+tick+src.slice(finish);
const marker='const production='+'
replace(marker,' '+pure+'\n'+marker);
fs.writeFileSync(file,src);
console.log('PASS test-only V3 countdown integration applied');+'{production};';'
replace(marker,' '+pure+'\n'+marker);
fs.writeFileSync(file,src);
console.log('PASS test-only V3 countdown integration applied');