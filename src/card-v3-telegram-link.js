// Preview-only Telegram button URL. Keep the currently published viewer unchanged.
export const CURRENT_VIEWER_URL="https://erikbern55-boop.github.io/dtek-schedule/";
export function telegramFullscreenButton(day="today",viewerUrl=CURRENT_VIEWER_URL){
 if(!["today","tomorrow"].includes(day))throw Error("Invalid viewer day");
 const url=new URL(viewerUrl);
 if(url.protocol!=="https:"||url.username||url.password)throw Error("HTTPS viewer URL required");
 url.searchParams.set("day",day);
 return {text:"Відкрити на весь екран",url:url.toString()};
}
