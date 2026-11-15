import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { buildCardV3Html } from '../src/card-v3.js';

const root=process.cwd(), output='guide-test-artifacts/integration';
fs.mkdirSync(output,{recursive:true});
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const schedule=[{begin:'00:00',end:'08:00',power:true},{begin:'08:00',end:'12:00',power:false},{begin:'12:00',end:'24:00',power:true}];
const card=buildCardV3Html({schedule,date,weather:null,source:'TEST ONLY — not live DTEK',update:'TEST',now:new Date()});
const slugs=['garden','moon','astro'],views=[{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}];
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/'||pathname==='/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(card);return;}
 let file=path.resolve(root,'.'+pathname);
 if(pathname.endsWith('/'))file=path.join(file,'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];let failed=false;
try{
 for(const view of views)for(const slug of slugs){
  const context=await browser.newContext({viewport:{width:view.width,height:view.height}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const link=page.locator('.v3-sources a[href="./guide/'+slug+'/"]');
  const present=await link.count()===1;
  let opened=false,returned=false,sourceLink=false,photo=false,noOverflow=false,novemberContent=true,sourceTarget=true;
  if(present){
   const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()]);
   await popup.waitForLoadState('domcontentloaded');
   opened=popup.url()===base+'/guide/'+slug+'/';
   sourceLink=await popup.getByRole('link',{name:'Переглянути першоджерело'}).count()===1;
   if(slug==='garden'){
    const content=await popup.locator('main').innerText();
    novemberContent=['Листопад: що перевірити','температуру ґрунту','заморозків','сезон посадки'].every(part=>content.includes(part));
    sourceTarget=await popup.getByRole('link',{name:'Переглянути першоджерело'}).getAttribute('href')==='https://www.meteo.gov.ua/ua/Monitorinh-perezimivli';
   }
   photo=slug==='astro'||await popup.locator('img.hero').evaluate(async img=>{
    if(!img.complete)await new Promise(resolve=>{
      const timeout=setTimeout(resolve,15000);
      img.addEventListener('load',()=>{clearTimeout(timeout);resolve();},{once:true});
      img.addEventListener('error',()=>{clearTimeout(timeout);resolve();},{once:true});
    });
    if(img.naturalWidth>0)await img.decode().catch(()=>{});
    return img.complete&&img.naturalWidth>=1000;
   }).catch(()=>false);
   noOverflow=await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2);
   await popup.screenshot({path:path.join(output,slug+'-'+view.name+'.png'),fullPage:true});
   await popup.getByRole('link',{name:/Повернутися до Світлопульсу/}).click();
   await popup.waitForURL(base+'/');
   returned=popup.url()===base+'/'&&await popup.locator('.v3-sources').count()===1;
   await popup.close();
  }
  const checks={present,opened,returned,sourceLink,sourceTarget,novemberContent,photo,noOverflow,noPageErrors:errors.length===0};
  const ok=Object.values(checks).every(Boolean);if(!ok)failed=true;
  results.push({slug,viewport:view.name,ok,checks,errors});
  console.log(ok?'PASS':'FAIL',slug,view.name,JSON.stringify(checks));
  await context.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:!failed,scope:'actual buildCardV3Html isolated browser; no production deployment',results},null,2));
if(failed)process.exitCode=1;
