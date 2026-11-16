// Isolated V3 live generator. Runs only in the separate test repository.
import fs from 'node:fs';
import {getShutdownsData,selectScheduleDays,kyivDate} from './src/source.js';
import {gardenTip,sowingAdvice} from './src/garden.js';
import {lunarForDate} from './src/moon.js';
import {astroForMoon} from './src/astro.js';
import {buildCardV3Html} from './src/card-v3.js';
const now=new Date(),currentDate=kyivDate(now),generatedAt=now.toISOString();
const snapshotRoot=process.env.CANONICAL_SNAPSHOT_DIR;
if(!snapshotRoot)throw Error('CANONICAL_SNAPSHOT_DIR is required');
const snapshotPath=snapshotRoot+'/today.json';
const snapshot=fs.existsSync(snapshotPath)?JSON.parse(fs.readFileSync(snapshotPath,'utf8')):null;
const priorDay=new Date(Date.parse(currentDate+'T12:00:00Z')-86400000).toISOString().slice(0,10);
const kyivHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',hour:'2-digit',hourCycle:'h23'}).format(now));
const snapshotAge=snapshot?Date.now()-Date.parse(snapshot.generatedAt):Infinity;
const midnightSnapshot=!!snapshot&&snapshot.date===priorDay&&kyivHour<2&&snapshotAge<2*60*60*1000;
const date=midnightSnapshot?snapshot.date:currentDate;
const tomorrow=new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
const daysToRender=[{date,label:'сьогодні',slug:'today'},{date:tomorrow,label:'завтра',slug:'tomorrow'}];
const daySchedules={};
const rawDtekByDay={};
const weatherByDay={};
const result={generatedAt,date,group:'1.1',live:false,source:null,error:null,periods:[],weather:null,garden:null,moon:null,astro:null};
const pad=n=>String(n).padStart(2,'0');
const clock=m=>pad(Math.floor(m/60))+':'+pad(m%60);
function scheduleForDay(states){
  if(!states)throw Error('Група GPV1.1 відсутня');
  const slots=[];
  for(let h=0;h<24;h++){
    const v=states[h+1]??states[String(h+1)];
    if(!['yes','no','first','second'].includes(v))throw Error('Невідомий стан години '+(h+1));
    const pair=v==='yes'?[true,true]:v==='no'?[false,false]:v==='first'?[false,true]:[true,false];
    slots.push(...pair);
  }
  const periods=[];
  for(let i=0;i<48;i++){
    const on=slots[i],start=i*30,end=start+30,last=periods.at(-1);
    if(last&&last.power===on&&last.end===clock(start))last.end=clock(end);
    else periods.push({begin:clock(start),end:clock(end),power:on});
  }
  if(periods[0]?.begin!=='00:00'||periods.at(-1)?.end!=='24:00')throw Error('Неповне покриття доби');
  return periods;
}
// Read only the canonical periods emitted by the Telegram publisher.
try {
  for(const item of daysToRender){
    const path=snapshotRoot+'/'+item.slug+'.json';
    if(!fs.existsSync(path)){
      if(item.slug==='today')throw Error('Canonical today.json is missing');
      continue;
    }
    const canonical=JSON.parse(fs.readFileSync(path,'utf8'));
    if(canonical.date!==item.date) {
      if(item.slug==='today')throw Error('Canonical today.json date mismatch');
      continue;
    }
    if(canonical.group!=='1.1'||!Array.isArray(canonical.periods))throw Error('Invalid canonical schedule metadata');
    const parsed=Date.parse(canonical.generatedAt);
    if(!Number.isFinite(parsed)||Date.now()-parsed>(item.slug==='today'&&midnightSnapshot?2*60*60*1000:12*60*1000)||parsed>Date.now()+60000) {
      if(item.slug==='today')throw Error('Canonical schedule is stale');
      continue;
    }
    const slots=Array(48).fill(null);
    const minute=t=>{if(!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$|^24:00$/.test(t))throw Error('Bad time '+t);return Number(t.slice(0,2))*60+Number(t.slice(3));};
    for(const p of canonical.periods){
      const start=minute(p.begin),end=minute(p.end);
      if(typeof p.power!=='boolean'||start>=end||start%30||end%30)throw Error('Invalid half-hour period');
      for(let i=start/30;i<end/30;i++){
        if(slots[i]!==null)throw Error('Overlapping canonical periods at slot '+i);
        slots[i]=p.power;
      }
    }
    if(slots.some(x=>x===null))throw Error('Missing canonical half-hour slot');
    const normalized=[];
    for(let i=0;i<48;i++){
      const begin=clock(i*30),end=clock((i+1)*30),power=slots[i],last=normalized.at(-1);
      if(last&&last.power===power&&last.end===begin)last.end=end;
      else normalized.push({begin,end,power});
    }
    if(JSON.stringify(normalized)!==JSON.stringify(canonical.periods))throw Error('Canonical periods are not normalized');
    daySchedules[item.slug]=normalized;
    rawDtekByDay[item.slug]=slots;
    weatherByDay[item.slug]=canonical.weather??null;
    if(item.slug==='today'){
      result.periods=normalized;
      result.weather=canonical.weather??null;
      result.source=canonical.source;
      result.sourceUpdated=String(canonical.sourceUpdated??'');
      result.canonicalGeneratedAt=canonical.generatedAt;
      result.live=true;
    }
  }
  if(!result.live)throw Error('Canonical Telegram today schedule unavailable');
}catch(error){result.error=String(error.message);console.error('CANONICAL schedule unavailable:',result.error);throw error;}
// Fullscreen uses exactly the weather already rendered in Telegram.
// Reject incomplete snapshots rather than publishing blank weather panels.
function assertCanonicalWeather(weather){
 if(!weather||weather.date!==date)throw Error('Canonical Telegram weather missing or wrong date');
 // Stale Telegram weather is safe to mirror only because the V3 renderer shows
 // its prominent stale-data warning; never present it as a fresh forecast.
 for(const key of ['currentTemp','todayMin','todayMax','tomorrowMin','tomorrowMax','soilTemp']){
  if(!Number.isFinite(weather[key]))throw Error('Canonical Telegram weather missing '+key);
 }
 if(!/^\d{2}:\d{2}$/.test(weather.sunrise??'')||!/^\d{2}:\d{2}$/.test(weather.sunset??''))throw Error('Canonical Telegram daylight times missing');
 const fetched=Date.parse(weather.fetchedAt);
 if(!Number.isFinite(fetched)||Date.now()-fetched>2*60*60*1000||fetched>Date.now()+60000)throw Error('Canonical Telegram weather timestamp invalid or too old');
}
assertCanonicalWeather(result.weather);
console.log('WEATHER PARITY: Telegram snapshot',result.weather.fetchedAt);
try{
  result.moon=lunarForDate(date);
  result.astro=astroForMoon(result.moon,date);
  result.garden={tip:gardenTip(date,result.weather),...sowingAdvice(date,result.weather,result.moon)};
}catch(error){result.infoError=String(error.message)}
fs.mkdirSync('dist',{recursive:true});
// Audit all 48 canonical half-hour slots against the V3 renderer input.
const audit={generatedAt:result.generatedAt,group:'1.1',source:result.source,sourceUpdated:result.sourceUpdated,days:{}};
for(const item of daysToRender){
 const raw=rawDtekByDay[item.slug],periods=daySchedules[item.slug];
 if(!raw||!periods){audit.days[item.slug]={date:item.date,ok:false,error:'Canonical schedule not published'};continue;}
 const mismatches=[];
 const parse=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
 for(let i=0;i<48;i++){
   const matches=periods.filter(p=>parse(p.begin)<=i*30&&parse(p.end)>=(i+1)*30);
   if(matches.length!==1||matches[0].power!==raw[i])mismatches.push({slot:i,expected:raw[i],rendered:matches.map(p=>p.power)});
 }
 audit.days[item.slug]={date:item.date,ok:mismatches.length===0,checkedHalfHours:48,periods,mismatches};
 if(mismatches.length)throw Error('Canonical-to-V3 mismatch '+JSON.stringify(mismatches));
}
if(!audit.days.today?.ok)throw Error('Canonical today audit failed');
fs.writeFileSync('dist/dtek-interval-audit.json',JSON.stringify(audit,null,2));
console.log('DTEK INDEPENDENT SLOT AUDIT:',JSON.stringify(Object.fromEntries(Object.entries(audit.days).map(([day,v])=>[day,{date:v.date,ok:v.ok,checkedHalfHours:v.checkedHalfHours,mismatches:v.mismatches?.length}]))));
fs.writeFileSync('dist/svitlopuls-live.json',JSON.stringify(result,null,2));
function neutralCalendar(markup){return markup.replace('📅 ', '<span class="v3-calendar-icon" aria-hidden="true">▦</span> ');}
function clarifyCountdown(markup,periods,dayLabel){
 const replaceText=(html,klass,value)=>{
  const startToken='<div class="'+klass+'"';
  const i=html.indexOf(startToken);
  if(i<0)throw Error('Missing countdown field '+klass);
  const open=html.indexOf('>',i),close=html.indexOf('</div>',open);
  if(open<0||close<0)throw Error('Malformed countdown field '+klass);
  return html.slice(0,open+1)+value+html.slice(close);
 };
 if(dayLabel==='завтра'){
  const change=periods.find((p,i)=>i>0&&!p.power&&periods[i-1].power);
  markup=replaceText(markup,'v3-count-event',change?'Перше планове вимкнення':'Планових вимкнень немає');
  markup=replaceText(markup,'v3-clock',change?change.begin:'—');
  return replaceText(markup,'v3-next',change?'Час початку за графіком ДТЕК · Київ':'Перевіряй зміни графіка ДТЕК');
 }
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(renderNow).split(':').map(Number);
 const minute=parts[0]*60+parts[1];
 const parse=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
 const upcoming=periods.some((p,i)=>i>0&&parse(p.begin)>minute&&p.power!==periods[i-1].power);
 if(!upcoming){
  const remaining=Math.max(0,1440-minute);
  const clock=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
  markup=replaceText(markup,'v3-count-event','До кінця графіка на сьогодні');
  markup=replaceText(markup,'v3-clock',clock);
  markup=replaceText(markup,'v3-next','Завтрашній графік ще не опубліковано ДТЕК');
 }
 return markup;
}
const renderNow=new Date(result.canonicalGeneratedAt);
const details={schedule:result.periods,date,label:'сьогодні',update:result.sourceUpdated??'',source:result.source??'НЕМАЄ АКТУАЛЬНИХ ДАНИХ',now:renderNow,weather:result.weather};
let html='';
if(result.live){
  html=neutralCalendar(clarifyCountdown(buildCardV3Html(details),result.periods,'сьогодні'));
  const guideLinks=[
    ['<span><strong>☁ Погода і ґрунт:</strong><a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener noreferrer">Open-Meteo</a></span>','<span><strong>☁ Погода і ґрунт:</strong><a href="./guide/weather/">Український довідник погоди</a></span>'],
    ['<span><strong>🌱 Агрономічні поради:</strong><a href="https://www.rhs.org.uk/" target="_blank" rel="noopener noreferrer">RHS</a><a href="https://ucanr.edu/" target="_blank" rel="noopener noreferrer">UCANR</a></span>','<span><strong>🌱 Агрономічні поради:</strong><a href="./guide/garden/">Поради городникам</a></span>'],
    ['<span><strong>🌙 Місячний календар:</strong><a href="https://www.astronomy.com/" target="_blank" rel="noopener noreferrer">Astronomy.com</a></span>','<span><strong>🌙 Місячний календар:</strong><a href="./guide/moon/">Український місячний календар</a></span>'],
    ['<span><strong>✨ Астропрогноз:</strong><a href="https://www.astro-seek.com/" target="_blank" rel="noopener noreferrer">AstroSeek</a></span>','<span><strong>✨ Астропрогноз:</strong><a href="./guide/astro/">Український астропрогноз</a><a href="https://minfin.com.ua/ua/currency/kiev/" target="_blank" rel="noopener noreferrer">💱 Курс валют</a><a class="v3-tips-button" href="https://erikbern55-boop.github.io/dtek-schedule/guide/lifehacks/">💡 Корисні хитрощі</a></span>'],
  ];
  for(const [before,after] of guideLinks){
    if(!html.includes(before))throw Error('Missing expected fullscreen source link: '+before);
    html=html.replace(before,after);
  }
}else{
  // Never render the old demo schedule as today's DTEK data.
  html='<html lang="uk"><head><meta charset="utf-8"></head><body style="background:#04140b;color:white;font:22px Arial;padding:28px"><h1>Світлопульс 3.0 — тест</h1><p>Актуальний графік ДТЕК недоступний. Дані не відображаються, щоб уникнути помилкових відключень.</p></body></html>';
}
const production=process.env.PRODUCTION_VIEWER==='1';
const warning='<div id="trial-status" style="'+(production?'display:none;':'background:#4d170d;color:white;text-align:center;padding:9px;font:700 16px Arial')+'">'+(production?'':('ТЕСТОВА КАРТКА · '+(result.live?'ДТЕК: '+result.source:'ГРАФІК НЕДОСТУПНИЙ')+' · Telegram не змінюється'))+'</div>';
html=html.replace('<body>','<body>'+warning);
html=html.replace('</head>',`<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0!important;max-width:100%;overflow-x:auto!important}#trial-shell{width:100%;overflow:auto}#trial-card{width:1404px;transform-origin:top left}.v3-sources .v3-tips-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:flex-start!important;padding:7px 11px!important;border:1px solid #82ff9b!important;border-radius:12px!important;background:linear-gradient(135deg,#38c764,#157d3a)!important;color:#04240f!important;text-decoration:none!important;font-size:14px!important;font-weight:800!important;line-height:1.2!important;box-shadow:0 0 10px #32e06666!important;white-space:nowrap!important}</style></head>`);
html=html.replace(warning,warning+'<div id="trial-tools" style="position:sticky;top:0;background:#072319;color:white;z-index:9999;padding:8px;text-align:center"><button id="minus">−</button> <button id="fit">За шириною</button> <button id="plus">+</button> <output id="percent"></output></div><div id="trial-shell"><div id="trial-card">');
html=html.replace('</body>',`</div></div><script>
(function(){
const el=document.getElementById('trial-card'),out=document.getElementById('percent'),shell=document.getElementById('trial-shell');let scale=1;
function apply(n){scale=Math.max(.2,Math.min(2,n));el.style.transform='scale('+scale+')';shell.style.height=Math.ceil(el.scrollHeight*scale)+'px';el.parentElement.style.width=Math.ceil(1404*scale)+'px';shell.style.overflowX='auto';shell.style.overflowY='visible';shell.style.touchAction='pan-x pan-y';out.textContent=' '+Math.round(scale*100)+'%';}
function fit(){apply(Math.min(1,Math.max(.2,(shell.clientWidth||innerWidth)/1404)));shell.scrollLeft=0;}\nfunction readable(){apply(Math.max(.65,Math.min(1,innerWidth/1404)));}
document.getElementById('minus').onclick=()=>apply(scale-.1);
document.getElementById('plus').onclick=()=>apply(scale+.1);
document.getElementById('fit').onclick=fit;
const heightBtn=document.createElement('button');heightBtn.id='fill-height';heightBtn.textContent='На висоту екрана';document.getElementById('trial-tools').appendChild(heightBtn);
heightBtn.onclick=()=>{const cardHeight=el.scrollHeight||1536;const available=Math.max(300,innerHeight-document.getElementById('trial-tools').offsetHeight-16);apply(Math.min(2,available/cardHeight));shell.scrollLeft=0;};
window.addEventListener('resize',()=>{if(scale<=1)fit();},{passive:true});\nconst readableBtn=document.createElement('button');readableBtn.textContent='Читабельний режим';readableBtn.id='readable';document.getElementById('trial-tools').appendChild(readableBtn);readableBtn.onclick=readable;\nfit();
const production=${production};
const generated=Date.parse('${generatedAt}');
const clockEl=document.querySelector('.v3-clock');\nif(clockEl&&window.__trialSchedule?.date){clockEl.setAttribute('aria-live','polite');}
const headingEl=document.querySelector('.v3-count-event');
const detailEl=document.querySelector('.v3-next');
const footer=document.querySelector('.v3-footer');
const freshness=document.createElement('span');
freshness.id='trial-data-freshness';
if(footer)footer.appendChild(freshness);
const kyivParts=(date)=>Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
const fmtKyiv=(date)=>new Intl.DateTimeFormat('uk-UA',{timeZone:'Europe/Kyiv',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
function tickLive(){
 const age=Date.now()-generated;
 const stale=!Number.isFinite(generated)||age>12*60000;
 freshness.textContent=Number.isFinite(generated)?' · JSON сформовано: '+fmtKyiv(new Date(generated))+' (Київ)'+(stale?' · ⚠️ Дані застаріли':''):' · ⚠️ Час оновлення невідомий';
 if(stale&&!production){document.getElementById('trial-status').textContent='⚠️ ТЕСТ: дані застаріли · останнє оновлення '+(Number.isFinite(generated)?fmtKyiv(new Date(generated)):'невідоме')+' (Київ)';}
 if(!clockEl)return;
 const data=window.__trialSchedule;
 if(!data||!data.live||!Array.isArray(data.periods)||data.date!==[kyivParts(new Date()).year,kyivParts(new Date()).month,kyivParts(new Date()).day].join('-')||stale){clockEl.textContent='—:—';if(headingEl)headingEl.textContent='Актуальний графік недоступний';return;}
 const k=kyivParts(new Date());
 const nowMin=Number(k.hour)*60+Number(k.minute)+Number(k.second)/60;
 const toMin=(t)=>{const m=/^([0-9]{2}):([0-9]{2})$/.exec(t||'');return m?Number(m[1])*60+Number(m[2]):NaN};
 const periods=data.periods;
 const next=periods.find((p,i)=>i>0&&toMin(p.begin)>nowMin&&p.power!==periods[i-1].power);
 if(!next){
  const tomorrow=data.tomorrow;
  const tomorrowPeriods=tomorrow?.periods;
  if(tomorrow?.date&&Array.isArray(tomorrowPeriods)&&tomorrowPeriods.length){
   const current=periods.at(-1)?.power;
   const midnight=tomorrowPeriods[0]?.power!==current;
   const first=midnight?{begin:'00:00',power:tomorrowPeriods[0].power}:tomorrowPeriods.find((p,i)=>i>0&&p.power!==tomorrowPeriods[i-1].power);
   if(first){
    const remaining=Math.max(0,Math.ceil(1440-nowMin+toMin(first.begin)));
    clockEl.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
    if(headingEl)headingEl.textContent=first.power?'До наступного ввімкнення':'До наступного вимкнення';
    if(detailEl)detailEl.textContent='Завтра '+first.begin+' · Київ · за графіком ДТЕК';
    return;
   }
  }
  const remaining=Math.max(0,Math.ceil(1440-nowMin));
  clockEl.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
  if(headingEl)headingEl.textContent='До кінця графіка на сьогодні';
  if(detailEl)detailEl.textContent='Завтрашній графік ще не опубліковано ДТЕК';
  return;
 }
 const remaining=Math.max(0,Math.ceil(toMin(next.begin)-nowMin));
 clockEl.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
 if(headingEl)headingEl.textContent=next.power?'До планового ввімкнення':'До планового вимкнення';
 if(detailEl)detailEl.textContent='Очікувана подія: '+next.begin+' · Київ · JSON: '+fmtKyiv(new Date(generated));
}
window.__trialSchedule=${JSON.stringify({date,live:result.live,periods:result.periods,tomorrow:{date:tomorrow,periods:daySchedules.tomorrow??null}})};
tickLive();setInterval(tickLive,1000);
setInterval(()=>{if(Date.now()-generated>12*60*1000&&!production){document.getElementById('trial-status').textContent='⚠️ ТЕСТ: дані застаріли — перевірте оновлення GitHub Actions';}},30000);
setInterval(async()=>{try{const r=await fetch('svitlopuls-live.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(j.generatedAt!=='${generatedAt}')location.reload();}catch(e){}},60000);
})();</script></body>`);
// Keep the approved reference images local to this isolated Pages deployment.
const garlic='svitlopuls_etalon_garlic.png', moon='svitlopuls_etalon_moon.png';
for(const name of [garlic,moon]){
  if(!fs.existsSync(name))throw Error('Missing approved image: '+name);
  fs.copyFileSync(name,'dist/'+name);
}
if(result.live){
  html=html.replace(/https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/Garlic_Bulbs_\(Unsplash\)\.jpg\?width=500/g,garlic);
  html=html.replace(/<div class="wx-moon-icon"><svg[\s\S]*?<\/svg><\/div>/,
    '<div class="wx-moon-icon"><img src="'+moon+'" alt="Місяць із затвердженого еталона" width="122" height="122"/></div>');
  if(!html.includes('src="'+garlic+'"')||!html.includes('src="'+moon+'"'))throw Error('Approved reference images not wired into HTML');
}
// Independent PNG validation: generate both real DTEK dates, never substitute demo data.
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true});
const pngChecks={generatedAt:result.generatedAt,source:result.source,days:{}};
try{
 for(const item of daysToRender){
  const periods=daySchedules[item.slug];
  if(!periods){pngChecks.days[item.slug]={date:item.date,ok:false,error:'DTEK has not published this day'};continue;}
  const dayWeather=weatherByDay[item.slug];
  let markup=neutralCalendar(clarifyCountdown(buildCardV3Html({schedule:periods,date:item.date,label:item.label,source:result.source,update:result.sourceUpdated??'',weather:dayWeather,now:renderNow}),periods,item.label));
  markup=markup.split('https://commons.wikimedia.org/wiki/Special:FilePath/Garlic_Bulbs_(Unsplash).jpg?width=500').join('https://svitlopuls-test.invalid/svitlopuls_etalon_garlic.png');
  markup=markup.replace(/<div class="wx-moon-icon"><svg[\s\S]*?<\/svg><\/div>/,'<div class="wx-moon-icon"><img src="https://svitlopuls-test.invalid/svitlopuls_etalon_moon.png" alt="Місяць з еталона"/></div>');
  const page=await browser.newPage({viewport:{width:1404,height:900},deviceScaleFactor:1});
  await page.route('**/svitlopuls_etalon_*.png',async route=>{
   const filename=route.request().url().includes('garlic')?'svitlopuls_etalon_garlic.png':'svitlopuls_etalon_moon.png';
   await route.fulfill({status:200,contentType:'image/png',body:fs.readFileSync(filename)});
  });
  await page.setContent(markup,{waitUntil:'load'});
  await page.locator('.weather-garden .wx-garden-art img').evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Garlic missing')});
  await page.locator('.wx-moon-icon img').evaluate(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Moon missing')});
  const png=await page.screenshot({type:'png',fullPage:true});
  if(png.length<10000)throw Error('PNG too small');
  fs.writeFileSync('dist/'+item.slug+'.png',png);
  const start=periods[0].begin,end=periods.at(-1).end;
  if(start!=='00:00'||end!=='24:00')throw Error('Incomplete day '+item.slug);
  pngChecks.days[item.slug]={date:item.date,ok:true,periods:periods.length,bytes:png.length,start,end,garlic:true,moon:true};
  await page.close();
 }
}finally{await browser.close()}
fs.writeFileSync('dist/png-validation.json',JSON.stringify(pngChecks,null,2));
if(!pngChecks.days.today?.ok)throw Error('Canonical today PNG required: '+JSON.stringify(pngChecks.days));
fs.writeFileSync('dist/index.html',html);
console.log(JSON.stringify({date,live:result.live,periods:result.periods.length,weather:!!result.weather,moon:!!result.moon,error:result.error}));
