// Source-link overlay for the approved-artwork-first V3 renderer.
// These are source WEBSITE destinations, not claims that every datum is fetched
// from these exact landing pages. Verify provenance in the data pipeline before release.
export const SOURCE_LINKS = Object.freeze({
 dtek: {label:"ДТЕК — графіки відключень",url:"https://www.dtek-krem.com.ua/ua/shutdowns",kind:"schedule"},
 weather: {label:"Open-Meteo — погода",url:"https://open-meteo.com/en/docs",kind:"weather"},
 gardenRhs: {label:"RHS — поради городникам",url:"https://www.rhs.org.uk/",kind:"reference"},
 gardenUcanr: {label:"UC ANR — садівництво",url:"https://ucanr.edu/",kind:"reference"},
 moon: {label:"Astronomy — місячний календар",url:"https://www.astronomy.com/",kind:"reference"},
 astro: {label:"Astro-Seek — астропрогноз (розважальний)",url:"https://www.astro-seek.com/",kind:"entertainment"}
});
export function buildSourceLinkLayers(rectangles) {
 if(!rectangles||typeof rectangles!=="object")throw new Error("Source link coordinates required");
 return Object.entries(SOURCE_LINKS).map(([key,source])=>{
  const rect=rectangles[key];
  if(!rect)throw new Error("Missing source-link region: "+key);
  return {id:"source-"+key.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase(),...rect,text:source.label,href:source.url};
 });
}
