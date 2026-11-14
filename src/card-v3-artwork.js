// Artwork-first V3 scaffold. Independent of production and current V3 renderer.
// The approved owner artwork MUST be supplied as a clean plate before deployment.
const escapeHtml = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const validCoordinate = value => Number.isFinite(value) && value >= 0;
export function buildArtworkFirstCard({artworkUrl,referenceWidth=1170,referenceHeight=1280,layers=[]}={}) {
  if(typeof artworkUrl !== "string" || !/^\/(?!\/)[\w./-]+\.(png|jpe?g|webp)$/i.test(artworkUrl) || artworkUrl.includes("..")) throw new Error("A local clean-plate image asset is required");
  if(!validCoordinate(referenceWidth)||!validCoordinate(referenceHeight)||!referenceWidth||!referenceHeight) throw new Error("Invalid reference dimensions");
  const seen = new Set();
  const nodes=layers.map((layer,index)=>{
    const {id,x,y,width,height,text="",href}=layer;
    if(typeof id!=="string"||! /^[a-z][a-z0-9-]*$/.test(id)||seen.has(id)) throw new Error("Invalid or duplicate layer id");
    seen.add(id);
    if(![x,y,width,height].every(validCoordinate)||width<=0||height<=0||x+width>referenceWidth||y+height>referenceHeight) throw new Error("Layer outside approved reference: "+id);
    const style=`left:${x/referenceWidth*100}%;top:${y/referenceHeight*100}%;width:${width/referenceWidth*100}%;height:${height/referenceHeight*100}%`;
    const body=escapeHtml(text);
    const inner=href ? (()=>{if(typeof href!=="string"||!/^https:\/\//.test(href))throw new Error("Only HTTPS links are allowed");return `<a class="art-source-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${body}">${body}</a>`})() : body;
    return `<div class="art-layer" data-layer="${id}" style="${style}">${inner}</div>`;
  }).join("");
  return `<section class="svitlo-artwork" style="aspect-ratio:${referenceWidth}/${referenceHeight}" aria-label="Світлопульс 3.0"><img class="art-base" src="${escapeHtml(artworkUrl)}" alt="" decoding="async"/>${nodes}</section>`;
}
export const ARTWORK_FIRST_CSS = `.svitlo-artwork{position:relative;width:100%;overflow:hidden}.svitlo-artwork .art-base{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:fill}.svitlo-artwork .art-layer{position:absolute;overflow-wrap:anywhere;white-space:pre-line}.svitlo-artwork .art-layer a{color:inherit;text-decoration:underline}.svitlo-artwork .art-source-link{display:flex;width:100%;height:100%;align-items:center;justify-content:center;box-sizing:border-box;cursor:pointer;touch-action:manipulation}.svitlo-artwork .art-source-link:focus-visible{outline:3px solid #8cff8c;outline-offset:-3px;border-radius:6px}.svitlo-artwork .art-source-link:hover{text-decoration-thickness:2px}`;
