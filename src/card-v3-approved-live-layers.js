// TEST BRANCH ONLY. Artwork-first dynamic layer adapter for the approved 1404x1536 reference.
// The background must be a separately verified clean plate, never a regenerated lookalike.
import {buildArtworkFirstCard,ARTWORK_FIRST_CSS} from "./card-v3-artwork.js";
const text=v=>v===null||v===undefined||String(v).trim()===""?"—":String(v);
const coords={
 date:[57,235,235,88], countdown:[693,237,272,90],
 powerOn:[1165,224,205,37],powerOff:[1165,286,205,38],
 temperature:[176,477,170,80],tomorrow:[655,470,172,67],
 soil:[1205,474,162,75],daylight:[917,474,192,52],
 garden:[289,776,458,170],can:[1050,726,300,98],cannot:[1050,893,300,72],
 moon:[399,1045,220,158],astro:[772,1040,378,169],
 updated:[74,1448,225,36]
};
function layer(id,value){const [x,y,width,height]=coords[id];return {id,x,y,width,height,text:text(value)};}
function timeLeft(nextAt,now){if(!nextAt)return "—";const n=new Date(nextAt).getTime();if(!Number.isFinite(n))return "—";const minutes=Math.max(0,Math.ceil((n-now.getTime())/60000));return String(Math.floor(minutes/60)).padStart(2,"0")+":"+String(minutes%60).padStart(2,"0");}
function fmtDay(iso){if(!iso||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return "—";const [y,m,d]=iso.split("-");return d+"."+m+"."+y;}
export function buildApprovedLiveLayers(payload,{now=new Date()}={}){
 if(!payload||typeof payload!=="object")throw Error("Verified live payload required");
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error("Valid clock required");
 const p=payload.power||{},w=payload.weather||{},current=w.current||{},daily=w.daily||{};
 const first=v=>Array.isArray(v)?v[0]:v;
 const layers=[
  layer("date",fmtDay(payload.scheduleDate)),
  layer("countdown",timeLeft(p.nextAt,now)),
  layer("powerOn",p.onText),layer("powerOff",p.offText),
  layer("temperature",current.temperature_2m??current.temperatureNow),
  layer("tomorrow",first(daily.temperature_2m_max)),
  layer("soil",first(daily.soil_temperature_6cm_mean)),
  layer("daylight",daily.daylightDuration),
  layer("garden",payload.garden?.advice),
  layer("can",payload.garden?.can),
  layer("cannot",payload.garden?.cannot),
  layer("moon",payload.moon?.description),
  layer("astro",payload.astro?.description),
  layer("updated",payload.updatedAt)
 ];
 return layers;
}
export function buildApprovedLiveCard({payload,artworkUrl="/assets/approved-clean-plate.png",now=new Date()}={}){
 if(!payload?.power?.periods?.length)throw Error("Verified DTEK periods required");
 const layers=buildApprovedLiveLayers(payload,{now});
 return {html:buildArtworkFirstCard({artworkUrl,referenceWidth:1404,referenceHeight:1536,layers}),css:ARTWORK_FIRST_CSS,mode:"test-only",layers};
}
