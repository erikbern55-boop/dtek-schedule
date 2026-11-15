import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root=process.cwd();
const slugs=['garden','moon','astro'];
const devices=[{name:'phone-portrait',width:390,height:844},{name:'phone-landscape',width:844,height:390}];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];let failed=false;
try{
 for(const slug of slugs){for(const device of devices){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
  const url=pathToFileURL(path.join(root,'guide',slug,'index.html')).href;
  await page.goto(url,{waitUntil:'load'});
  const state=await page.evaluate(()=>{
   const back=[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Повернутися до Світлопульсу'));
   const source=[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Переглянути першоджерело'));
   const img=document.querySelector('img.hero');
   return {lang:document.documentElement.lang,heading:document.querySelector('h1')?.textContent,backHref:back?.getAttribute('href'),backVisible:!!back&&getComputedStyle(back).display!=='none',sourceHref:source?.href,sourceVisible:!!source&&getComputedStyle(source).display!=='none',sourceExternal:source?.target==='_blank'&&source?.rel.includes('noopener'),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,image:img?{loaded:img.complete&&img.naturalWidth>0,naturalWidth:img.naturalWidth}:null};
  });
  const checks={ukrainian:state.lang==='uk',title:!!state.heading,backButton:state.backVisible&&state.backHref==='../../',sourceButton:state.sourceVisible&&state.sourceExternal&&state.sourceHref?.startsWith('https://'),noHorizontalOverflow:!state.horizontalOverflow,illustration:slug==='astro'||state.image?.loaded===true};
  const ok=Object.values(checks).every(Boolean);failed||=!ok;
  const filename=`guide-${slug}-${device.name}.png`;
  fs.mkdirSync('guide-test-artifacts',{recursive:true});
  await page.screenshot({path:path.join('guide-test-artifacts',filename),fullPage:true});
  results.push({slug,device:device.name,ok,checks,state,screenshot:filename});
  console.log(ok?'PASS':'FAIL',slug,device.name,JSON.stringify(checks));
  await page.close();
 }}
}finally{await browser.close();}
fs.writeFileSync('guide-test-artifacts/report.json',JSON.stringify({passed:!failed,results},null,2));
if(failed)process.exitCode=1;
