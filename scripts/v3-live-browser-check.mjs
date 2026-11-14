import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const dir=path.resolve("artifacts/web");
const json=JSON.parse(fs.readFileSync(path.join(dir,"svitlopuls-live.json"),"utf8"));
const expected=json.power?.periods;
if(!Array.isArray(expected)||!expected.length)throw Error("Missing JSON periods");
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,"http://localhost").pathname;
 const files={"/v3-live-check.html":["text/html; charset=utf-8","v3-live-check.html"],"/svitlopuls-live.json":["application/json; charset=utf-8","svitlopuls-live.json"]};
 if(!files[name]){res.writeHead(404);res.end("Not found");return;}
 const [type,file]=files[name];res.writeHead(200,{"Content-Type":type,"Cache-Control":"no-store"});res.end(fs.readFileSync(path.join(dir,file)));
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const url="http://127.0.0.1:"+server.address().port+"/v3-live-check.html";
 await page.goto(url,{waitUntil:"networkidle"});
 await page.waitForFunction(()=>document.querySelector("#status")?.textContent==="Дані завантажені з JSON",{timeout:15000});
 const actual=await page.locator("#periods tr").evaluateAll(rows=>rows.map(r=>Array.from(r.querySelectorAll("td")).map(td=>td.textContent.trim())));
 const wanted=expected.map(p=>[p.begin,p.end,p.power?"Є":"Немає"]);
 if(JSON.stringify(actual)!==JSON.stringify(wanted))throw Error("HTML rows mismatch: "+JSON.stringify({wanted,actual}));
 if(errors.length)throw Error("Browser errors: "+errors.join("; "));
 await page.screenshot({path:path.join(dir,"v3-live-browser.png"),fullPage:true});
 const report={scheduleDate:json.scheduleDate,source:json.source,expectedRows:wanted,actualRows:actual,allMatch:true,verifiedAt:new Date().toISOString()};
 fs.writeFileSync(path.join(dir,"v3-live-browser-report.json"),JSON.stringify(report,null,2));
 console.log("BROWSER VERIFIED:",actual.length,"rows, exact begin/end/power matches");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
