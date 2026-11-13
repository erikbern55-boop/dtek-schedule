import fs from "node:fs"
import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import { chromium } from "playwright"
import {buildCardV3Html,renderCardV3Png} from "../src/card-v3.js"
const schedule=[
 {begin:"00:00",end:"06:00",power:true},
 {begin:"06:00",end:"13:30",power:false},
 {begin:"13:30",end:"16:30",power:true},
 {begin:"16:30",end:"23:30",power:false},
 {begin:"23:30",end:"24:00",power:true},
]
const weather={
 currentTemp:3,currentNowTemp:3,currentNowCode:2,currentNowWind:4,
 todayDate:"2026-11-07",todayMin:-1,todayMax:8,todayRain:35,todayGust:11,
 tomorrowDate:"2026-11-08",tomorrowMin:-2,tomorrowMax:5,
 min:-1,max:8,currentWind:5,rain:35,gust:11,code:2,
 soilTemp:5.6,soilAt:"16:00",sunrise:"07:01",sunset:"16:29",
 warnings:["Можливі заморозки"],fetchedAt:"2026-11-07T14:30:00.000Z",stale:false,
}
const details={schedule,date:"2026-11-07",label:"сьогодні",update:"07.11.2026 12:00",
 source:"ДТЕК",now:new Date("2026-11-07T14:30:00.000Z"),weather}
// Regression guard: the current Telegram full-screen viewer must survive the redesign.
// This verifies existing code only; it does not publish to Telegram.
const mediaSource=readFileSync(new URL("../src/media.js",import.meta.url),"utf8")
assert.match(mediaSource,/⛶ Відкрити на весь екран/,"keep the full-screen button")
assert.match(mediaSource,/erikbern55-boop\.github\.io\/dtek-schedule\//,"keep existing viewer URL")
assert.match(mediaSource,/\?day=/,"keep today/tomorrow viewer selection")
assert.match(mediaSource,/saveViewerSnapshot\(png, label/,"keep full-screen HTML snapshot generation")
assert.match(mediaSource,/overflow:auto!important/,"keep full-screen scrolling")
console.log("Existing full-screen viewer preserved in production integration source")
const png=await renderCardV3Png(details)
assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
fs.writeFileSync("svitlopuls-v3-preview.png",png)

// Test-only full-screen HTML preview: never changes production viewer or Telegram.
const responsiveViewerCss = '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<style>html,body{width:100%!important;min-height:100%;overflow:auto!important}' +
  'body{margin:0!important;background:#020e08!important}' +
  '.v3{width:1404px;max-width:none;transform-origin:top left}' +
  '</style>'
const fullScreenHtml=buildCardV3Html(details).replace("</head>",responsiveViewerCss+"</head>")
fs.writeFileSync("svitlopuls-v3-fullscreen-preview.html",fullScreenHtml)

const browser=await chromium.launch({headless:true})
try {
 const page=await browser.newPage({viewport:{width:1404,height:900}})
 await page.setContent(buildCardV3Html(details),{waitUntil:"load"})

 // Exercise the embedded timer under a deterministic Playwright browser clock.
 const clockPage=await browser.newPage({viewport:{width:1404,height:900}})
 await clockPage.clock.install({time:new Date("2026-11-07T14:30:00.000Z")})
 await clockPage.setContent(buildCardV3Html(details),{waitUntil:"load"})
 const clockBefore=await clockPage.locator(".v3-clock").textContent()
 assert.match(clockBefore,/^\d{2}:\d{2}$/,"live countdown uses HH:MM")
 await clockPage.clock.fastForward(61000)
 const clockAfter=await clockPage.locator(".v3-clock").textContent()
 const toMinutes=text=>{const [h,m]=text.split(":").map(Number);return h*60+m}
 assert.equal(toMinutes(clockAfter),toMinutes(clockBefore)-1,"HTML countdown must tick down by one minute")
 await clockPage.close()
 assert.equal(await page.locator(".v3-weekday").textContent(),"субота","weekday follows card date")
 assert.equal(await page.locator(".v3-brand-white").textContent(),"СВІТЛО","approved white brand segment")
 assert.equal(await page.locator(".v3-brand-green").textContent(),"ПУЛЬС 3.0","approved neon-green brand segment")

 const headerGeometry=await page.evaluate(()=>{
  const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
  return {header:rect(".v3-head"),robot:rect(".v3-robot"),brand:rect(".v3-brand"),tag:rect(".v3-tag")}
 })
 assert.ok(headerGeometry.robot.height>=110,"approved mascot must remain prominent")
 assert.ok(headerGeometry.robot.top>=headerGeometry.header.top-2&&headerGeometry.robot.bottom<=headerGeometry.header.bottom+2,
  "enlarged robot must fit inside header: "+JSON.stringify(headerGeometry))
 assert.ok(headerGeometry.robot.right<=headerGeometry.brand.left+2,
  "robot must not overlap wordmark: "+JSON.stringify(headerGeometry))
 assert.ok(headerGeometry.brand.right<=headerGeometry.tag.left+2,
  "wordmark must not overlap header tagline: "+JSON.stringify(headerGeometry))
 const viewerPage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
 await viewerPage.setContent(fullScreenHtml,{waitUntil:"load"})
 const viewerCheck=await viewerPage.evaluate(()=>{
  const card=document.querySelector(".v3")
  return {viewport:document.documentElement.clientWidth,cardWidth:card.getBoundingClientRect().width,
   pageWidth:document.documentElement.scrollWidth,linkCount:document.querySelectorAll(".v3-sources a").length}
 })
 // Ensure the published HTML contains a scroll restoration path for five-minute refreshes.
 const htmlSource=await viewerPage.content()
 assert.match(htmlSource,/svitlopuls-v3-scroll/,"viewer persists scroll position across refresh")
 assert.match(htmlSource,/sessionStorage\.setItem/,"viewer saves its current scroll coordinates")
 assert.match(htmlSource,/window\.scrollTo/,"viewer restores the saved coordinates")
 // Browser-level restoration test on a real HTTPS origin (not about:blank).
 const restorePage=await browser.newPage({viewport:{width:390,height:700}})
 await restorePage.route("https://svitlopuls.test/v3",route=>route.fulfill({status:200,contentType:"text/html",body:fullScreenHtml}))
 await restorePage.goto("https://svitlopuls.test/v3")
 await restorePage.evaluate(()=>{sessionStorage.setItem("svitlopuls-v3-scroll",JSON.stringify([160,420]));})
 await restorePage.reload()
 await restorePage.waitForFunction(()=>window.scrollX>=150&&window.scrollY>=400)
 const restored=await restorePage.evaluate(()=>({x:window.scrollX,y:window.scrollY}))
 assert.ok(restored.x>=150&&restored.y>=400,"viewer restores both scroll axes: "+JSON.stringify(restored))
 await restorePage.close()
 assert.ok(viewerCheck.pageWidth>=viewerCheck.viewport,"full-screen card remains horizontally scrollable on narrow screens")
 assert.equal(viewerCheck.linkCount,6,"full-screen preview retains all source links")
 // Real mobile screenshot is retained for human visual inspection of the viewer.
 await viewerPage.screenshot({path:"svitlopuls-v3-mobile-preview.png",fullPage:true})
 const mobileLinks=await viewerPage.locator(".v3-sources a").evaluateAll(links=>links.map(a=>({href:a.href,clickable:a.getClientRects().length>0})))
 assert.ok(mobileLinks.every(link=>link.clickable&&link.href.startsWith("https://")),"all mobile viewer source links are visible and valid")
 assert.ok(viewerCheck.cardWidth>viewerCheck.viewport,"narrow mobile view intentionally permits horizontal panning of the full-size approved card")
 await viewerPage.close()
 const sourceLinks=await page.locator(".v3-sources a").evaluateAll(links=>links.map(a=>({text:a.textContent,href:a.href,target:a.target,rel:a.rel})))
 assert.equal(sourceLinks.length,6,"all six reference links must remain clickable in HTML")
 for(const link of sourceLinks){
  assert.match(link.href,/^https:\/\//,"reference link must use HTTPS")
  assert.equal(link.target,"_blank","reference opens separately")
  assert.match(link.rel,/noopener/,"external links use noopener")
 }
 assert.ok(sourceLinks.some(x=>x.href.includes("dtek-krem.com.ua")),"DTEK source link exists")
 console.log("V3 source links OK",sourceLinks.map(x=>x.href))
 // Check visible header text remains inside the approved 1404px canvas.
 const header=await page.evaluate(()=>{
  const root=document.querySelector(".v3")
  const nodes=[...document.querySelectorAll(".v3-head,.v3-place,.v3-brand,.v3-brand strong,.v3-tag,.v3-date-panel")]
  const base=root.getBoundingClientRect()
  return nodes.map(node=>{const r=node.getBoundingClientRect();return {name:node.className,left:r.left-base.left,right:r.right-base.left,top:r.top-base.top,bottom:r.bottom-base.top,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth}})
 })
 for(const item of header){
  assert.ok(item.left>=-2&&item.right<=1406,"header "+item.name+" must remain inside card canvas: "+JSON.stringify(item))
  assert.ok(item.scrollWidth<=item.clientWidth+3,"header "+item.name+" text must not clip horizontally: "+JSON.stringify(item))
 }
 // Verify the new neon ECG mark stays visible within the brand, not just present in HTML.
 const pulse=await page.evaluate(()=>{
  const brand=document.querySelector(".v3-brand strong")
  const mark=document.querySelector(".v3-pulse-mark svg")
  if(!brand||!mark)return null
  const b=brand.getBoundingClientRect(),m=mark.getBoundingClientRect()
  return {brandLeft:b.left,brandRight:b.right,markLeft:m.left,markRight:m.right,width:m.width,height:m.height}
 })
 assert.ok(pulse&&pulse.width>=40&&pulse.height>=25&&pulse.markLeft>=pulse.brandLeft-2&&pulse.markRight<=pulse.brandRight+2,
  "neon ECG mark must fit visibly within the approved V3 wordmark: "+JSON.stringify(pulse))
 // A photo URL in HTML is insufficient: ensure Chromium actually decoded the garlic image.
 const garlicPhoto=await page.locator(".weather-garden .wx-garden-art img").evaluate(async img=>{
  if(!img.complete)await Promise.race([new Promise(resolve=>{img.addEventListener("load",resolve,{once:true});img.addEventListener("error",resolve,{once:true})}),new Promise(resolve=>setTimeout(resolve,8000))])
  return {complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,src:img.currentSrc}
 })
 const garlicPresentation=await page.locator(".weather-garden .wx-garden-art img").evaluate(img=>{
  const style=getComputedStyle(img),r=img.getBoundingClientRect()
  return {fit:style.objectFit,width:r.width,height:r.height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}
 })
 assert.equal(garlicPresentation.fit,"contain","show complete garlic photo rather than cropping it")
 assert.ok(garlicPresentation.width>=140&&garlicPresentation.height>=130,
  "garlic photo should remain prominent in gardening panel: "+JSON.stringify(garlicPresentation))
 assert.ok(garlicPhoto.complete&&garlicPhoto.naturalWidth>0&&garlicPhoto.naturalHeight>0,
  "garlic photograph must actually load in Chromium, not merely exist in HTML: "+JSON.stringify(garlicPhoto))
 const layout=await page.evaluate(()=>{
  const box=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,overflow:e.scrollWidth>e.clientWidth+3}}
  return {power:box(".v3-power"),air:box(".weather-air"),tomorrow:box(".weather-tomorrow"),sun:box(".weather-sun"),soil:box(".weather-soil"),
   garden:box(".weather-garden"),moon:box(".weather-moon"),astro:box(".weather-astro"),
   sources:box(".v3-sources"),footer:box(".v3-footer"),body:box(".v3")}
 })
 for(const [name,b] of Object.entries(layout))assert.ok(b,name+" missing")

 // Persist full block geometry so every iteration can be compared with the approved 1404px reference.
 const referenceGeometry=await page.evaluate(()=>{
  const root=document.querySelector(".v3").getBoundingClientRect()
  const selectors={header:".v3-head",robot:".v3-robot",wordmark:".v3-brand",date:".v3-date-panel",
   countdown:".v3-count",schedule:".v3-power > section:last-child",
   weather:".v3-weather",garden:".weather-garden",sowing:".weather-sowing",
   moon:".weather-moon",astrology:".weather-astro",sources:".v3-sources",footer:".v3-footer"}
  return Object.fromEntries(Object.entries(selectors).map(([name,selector])=>{
   const el=document.querySelector(selector)
   if(!el)return [name,null]
   const r=el.getBoundingClientRect()
   return [name,{x:Math.round(r.left-root.left),y:Math.round(r.top-root.top),
    width:Math.round(r.width),height:Math.round(r.height)}]
  }))
 })
 assert.ok(referenceGeometry.header&&referenceGeometry.robot&&referenceGeometry.wordmark,
  "reference geometry must contain complete header measurements")
 assert.ok(referenceGeometry.weather&&referenceGeometry.garden&&referenceGeometry.moon,
  "reference geometry must contain all major content rows")
 fs.writeFileSync("svitlopuls-v3-reference-geometry.json",JSON.stringify({
  canvasWidth:Math.round(await page.locator(".v3").evaluate(el=>el.getBoundingClientRect().width)),
  canvasHeight:Math.round(await page.locator(".v3").evaluate(el=>el.getBoundingClientRect().height)),
  blocks:referenceGeometry
 },null,2)+"\n")

 // Check actual weather content, not only outer panel geometry.
 const weatherReadability=await page.evaluate(()=>{
  const selectors=[".weather-air",".weather-tomorrow",".weather-sun",".weather-soil"]
  return selectors.map(selector=>{
   const panel=document.querySelector(selector),bounds=panel.getBoundingClientRect()
   const children=[...panel.querySelectorAll("h3,.wx-fact,.wx-forecast-values,.wx-sun-pair,.wx-soil-pair")]
    .filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden")
    .map(el=>{const r=el.getBoundingClientRect();return {tag:el.className||el.tagName,top:r.top,bottom:r.bottom}})
   return {selector,top:bounds.top,bottom:bounds.bottom,children}
  })
 })
 for(const panel of weatherReadability){
  for(const item of panel.children){
   assert.ok(item.top>=panel.top-3&&item.bottom<=panel.bottom+3,
    "weather content must fit inside compact panel: "+JSON.stringify({panel:panel.selector,item}))
  }
 }
 assert.ok(layout.air.y>=layout.power.b-3,"weather follows power")
 assert.ok(["tomorrow","sun","soil"].every(name=>Math.abs(layout.air.y-layout[name].y)<4),"four weather panels share first row")
 assert.ok(layout.garden.w>layout.air.w,"gardening spans the wide middle row")
 const middleRow=await page.evaluate(()=>{
  const garden=document.querySelector(".weather-garden").getBoundingClientRect()
  const sowing=document.querySelector(".weather-sowing").getBoundingClientRect()
  return {garden:{x:garden.x,width:garden.width,bottom:garden.bottom},
   sowing:{x:sowing.x,width:sowing.width,bottom:sowing.bottom}}
 })
 assert.ok(middleRow.garden.width>middleRow.sowing.width*1.7,
  "approved garden/sowing split must retain wider gardening panel: "+JSON.stringify(middleRow))
 assert.ok(Math.abs(middleRow.garden.bottom-middleRow.sowing.bottom)<45,
  "garden and sowing panels should remain balanced vertically: "+JSON.stringify(middleRow))
 assert.ok(layout.garden.y>=layout.air.b-3,"gardening follows weather")
 assert.ok(Math.abs(layout.moon.y-layout.astro.y)<4,"night panels share third row")
 assert.ok(layout.moon.y>=layout.garden.b-3,"moon follows gardening")
 assert.ok(layout.sources.y>=layout.moon.b-3,"sources follow night row")
 assert.ok(layout.footer.y>=layout.sources.b-3,"footer follows sources")
 assert.ok(Object.values(layout).every(b=>!b.overflow),"no panel horizontally overflows")

 // Guard against hidden or vertically clipped text in the compact garden row.
 const gardenContent=await page.evaluate(()=>{
  const selectors=[".weather-garden .wx-garden-body",".weather-garden .wx-garden-copy",".weather-sowing .wx-sowing"]
  return selectors.map(selector=>{
   const el=document.querySelector(selector)
   if(!el)return {selector,missing:true}
   const r=el.getBoundingClientRect()
   const parent=el.closest(".wx-box").getBoundingClientRect()
   return {selector,missing:false,top:r.top-parent.top,bottom:r.bottom-parent.top,panelHeight:parent.height}
  })
 })
 assert.ok(gardenContent.every(x=>!x.missing&&x.top>=-2&&x.bottom<=x.panelHeight+2),
  "garden advice and sowing content must remain fully inside their panels: "+JSON.stringify(gardenContent))
 // The reference canvas is 1404 px wide; record actual height and panel geometry
 // for reproducible visual comparison instead of asserting pixel perfection.
 const dimensions=await page.evaluate(()=>{
  const card=document.querySelector(".v3").getBoundingClientRect()
  const selectors=[".v3-head",".v3-power",".v3-weather",".weather-garden",".weather-sowing",".weather-moon",".weather-astro",".v3-sources",".v3-footer"]
  return {width:Math.round(card.width),height:Math.round(card.height),sections:Object.fromEntries(selectors.map(sel=>{const el=document.querySelector(sel);const r=el?.getBoundingClientRect();return [sel,r?{x:Math.round(r.x-card.x),y:Math.round(r.y-card.y),width:Math.round(r.width),height:Math.round(r.height)}:null]}))}
 })

 // Verify the title, mascot and header tagline stay inside the reference header.
 const headerContent=await page.evaluate(()=>{
  const header=document.querySelector(".v3-head").getBoundingClientRect()
  return [".v3-robot",".v3-brand strong",".v3-brand small",".v3-tag"].map(selector=>{
   const r=document.querySelector(selector).getBoundingClientRect()
   return {selector,left:r.left-header.left,right:r.right-header.left,top:r.top-header.top,bottom:r.bottom-header.top,width:header.width,height:header.height}
  })
 })
 assert.ok(headerContent.every(x=>x.left>=-3&&x.right<=x.width+3&&x.top>=-3&&x.bottom<=x.height+3),
  "mascot and brand must remain inside approved header: "+JSON.stringify(headerContent))
 assert.equal(dimensions.width,1404,"approved V3 canvas width must remain 1404px")
 assert.ok(dimensions.height>=1200&&dimensions.height<=1900,"card height must remain within reviewable bounds")
 console.log("V3 reference height delta",JSON.stringify({actual:dimensions.height,target:1536,delta:dimensions.height-1536}))
 assert.ok(Object.values(dimensions.sections).every(Boolean),"all reference sections have measurable geometry")
 fs.writeFileSync("svitlopuls-v3-layout.json",JSON.stringify(dimensions,null,2)+"\n")

 console.log("V3 visual layout OK",JSON.stringify({layout,dimensions}))
}finally{await browser.close()}
