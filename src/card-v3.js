// Independent Svitlopuls 3 renderer. No production switch until visual approval.
import { calculateDailyTotals, formatDuration } from "./summary.js"
import { buildDial, buildTimeline } from "./card.js"
import { nextPowerEvent } from "./countdown.js"
import { renderWeatherPanel, WEATHER_CSS } from "./weather-card.js"

const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
const kyivTime = value => new Intl.DateTimeFormat("uk-UA",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit"}).format(value)
const displayDate = date => date.split("-").reverse().join(".")
const weekday = date => new Intl.DateTimeFormat("uk-UA",{weekday:"long",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"))
const css = [
  "*{box-sizing:border-box}",
  "html,body{width:1404px;margin:0;background:#020e08;color:#f0fff3;font-family:Arial,sans-serif}",
  ".v3{width:1404px;padding:22px 26px 18px;background:radial-gradient(ellipse at 50% 10%,#083b20,#020e08 76%)}",
  ".v3-head{display:grid;grid-template-columns:245px 1fr 230px;align-items:center;gap:14px;min-height:112px}",
  ".v3-place{font-size:20px;line-height:1.4}.v3-place strong{display:block;font-size:28px;color:#caff9b}",
  ".v3-brand{text-align:center}.v3-brand strong{display:block;font-size:62px;letter-spacing:1px;color:#b4ffad;text-shadow:0 0 20px #3df55a}",
  ".v3-brand small{display:block;font-size:15px;color:#c9e5d1}",
  ".v3-tag{text-align:center;font-size:22px;font-weight:bold;line-height:1.3}",
  ".v3-row{display:grid;gap:14px;margin-top:14px;align-items:stretch}",
  ".v3-power{grid-template-columns:1.34fr .91fr 1.03fr}",
  ".v3-panel,.v3 .wx-box,.v3-sources,.v3-footer{border:3px solid #4dfd63;border-radius:24px;background:radial-gradient(ellipse at 50% 50%,#0b4b2b,#02190f 85%);box-shadow:inset 0 0 18px #0d7837,0 0 12px #158c35;padding:15px}",
  ".v3-power>.v3-panel{height:310px;overflow:hidden}",
  ".v3-date{text-align:center;font-size:24px;font-weight:bold}.v3-date b{display:block;font-size:30px;margin:5px}",
  ".v3-dial{width:260px;height:245px;margin:-5px auto 0}.v3-dial svg{width:100%;height:100%}",
  ".v3-title{font-size:28px;text-align:center;font-weight:900;margin:0 0 14px}",
  ".v3-count{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}",
  ".v3-count .v3-clock{font-size:72px;color:#a6ff9c;font-weight:900;text-shadow:0 0 12px #20a34c}",
  ".v3-count .v3-next{font-size:21px;line-height:1.3;margin-top:14px}",
  ".v3-periods{display:flex;flex-direction:column;gap:6px;max-height:160px;overflow:auto}",
  ".v3-period{display:flex;justify-content:space-between;gap:8px;border:2px solid #54ec78;border-radius:15px;padding:7px 10px;font-size:18px;background:#08472a}",
  ".v3-period.off{background:#4d1b24;border-color:#ff6977}",
  ".v3-totals{display:flex;justify-content:space-between;font-size:16px;margin-top:12px}",
  ".v3-timeline{margin-top:12px}.v3-timeline .timeline{height:24px;display:flex;overflow:hidden;border-radius:20px}",
  ".v3-timeline .timeline span{display:block;height:24px}",
  ".v3-timeline .timeline-labels{display:flex;justify-content:space-between;font-size:14px}",
  ".v3-weather .weather-zone{margin:0;padding:0;border:0;background:transparent}",
  ".v3-weather .weather-title{display:none}",
  ".v3-weather .wx-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}",
  ".v3-weather .weather-air{grid-column:1/6;grid-row:1}",
  ".v3-weather .weather-tomorrow{grid-column:6/9;grid-row:1}",
  ".v3-weather .weather-sun{grid-column:9/11;grid-row:1}",
  ".v3-weather .weather-soil{grid-column:11/13;grid-row:1}",
  ".v3-weather .wx-right-stack{display:contents}",
  ".v3-weather .weather-garden{grid-column:1/13;grid-row:2}",
  
  ".v3-weather .weather-moon{grid-column:1/6;grid-row:3}",
  ".v3-weather .weather-astro{grid-column:6/13;grid-row:3}",
  ".v3-weather .wx-box{min-width:0;padding:16px}",
  ".v3-weather .wx-box h3{font-size:27px;margin:0 0 12px}",
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:230px}",
  ".v3-weather .weather-garden{min-height:245px}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{min-height:190px}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px}",
  ".v3-weather .wx-sun-pair,.v3-weather .wx-soil-pair{display:flex;flex-direction:column;gap:14px;align-items:center}",
  ".v3-weather .wx-sun-pair b{font-size:29px}.v3-weather .wx-soil-pair strong{font-size:58px}",
  ".v3-weather .wx-garden-art{font-size:74px;min-width:120px}",
  ".v3-weather .wx-garden-copy{font-size:21px}",
  ".v3-weather .wx-credit{font-size:13px;line-height:1.3;margin-top:10px}",
  ".v3-sources{display:grid;grid-template-columns:1.35fr repeat(5,1fr);gap:10px;font-size:16px;margin-top:14px}",
  ".v3-sources span{border-left:1px solid #58b979;padding-left:9px}",
  ".v3-footer{margin-top:14px;display:flex;justify-content:space-between;font-size:16px;padding:12px 18px}",
  WEATHER_CSS,
  ".v3-weather .wx-grid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:12px!important}",
  ".v3-weather .weather-air{grid-column:1/5!important;grid-row:1!important}",
  ".v3-weather .weather-tomorrow{grid-column:5/8!important;grid-row:1!important}",
  ".v3-weather .weather-sun{grid-column:8/11!important;grid-row:1!important}",
  ".v3-weather .weather-soil{grid-column:11/13!important;grid-row:1!important}",
  ".v3-weather .wx-right-stack{grid-column:1/13!important;grid-row:2!important;display:block!important}",
  ".v3-weather .weather-garden{width:100%!important;min-height:210px!important}",
  ".v3-weather .wx-garden-body{display:flex!important;align-items:center!important;gap:20px!important}",
  ".v3-weather .wx-garden-art{font-size:64px!important;min-width:110px!important}",
  ".v3-weather .wx-sowing{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}",
  ".v3-weather .wx-sowing-row.lunar,.v3-weather .wx-source-note{grid-column:1/3!important}",
  ".v3-weather .weather-moon{grid-column:1/6!important;grid-row:3!important}",
  ".v3-weather .weather-astro{grid-column:6/13!important;grid-row:3!important}",
  ".v3-weather .wx-box{min-height:0!important;overflow:visible!important}",
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:230px!important}",
  ".v3-weather .weather-tomorrow{display:flex!important;flex-direction:column!important;justify-content:center!important}",
  ".v3-weather .weather-air .wx-now{font-size:46px!important}",
  ".v3-weather .wx-box h3{font-size:21px!important}",
  ".v3-weather .wx-fact{font-size:15px!important}",
  ".v3-weather .wx-credit{font-size:13px!important}",
  ".v3-head{grid-template-columns:245px 1fr 210px!important;min-height:135px!important}",
  ".v3-brand strong{font-size:54px!important}",
  ".v3-place:before{content:'🤖';font-size:52px;float:left;margin-right:8px}",
  ".v3-power>.v3-panel{height:295px!important}",
  ".v3-dial{height:220px!important}",
  ".v3-count .v3-clock{font-size:65px!important}",
  ".v3-periods{max-height:145px!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{min-height:185px!important}",
  // Keep the new renderer's layout rules after shared weather styles.
  ".v3-weather .wx-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}",
  ".v3-weather .weather-air{grid-column:1/6;grid-row:1}",
  ".v3-weather .weather-tomorrow{grid-column:6/9;grid-row:1}",
  ".v3-weather .weather-sun{grid-column:9/11;grid-row:1}",
  ".v3-weather .weather-soil{grid-column:11/13;grid-row:1}",
  ".v3-weather .wx-right-stack{display:contents}",
  ".v3-weather .weather-garden{grid-column:1/13;grid-row:2}",
  
  ".v3-weather .weather-moon{grid-column:1/6;grid-row:3}",
  ".v3-weather .weather-astro{grid-column:6/13;grid-row:3}",
  ".v3-weather .wx-box{border:3px solid #4dfd63;border-radius:24px;background:radial-gradient(ellipse,#0b4b2b,#02190f 85%);padding:16px;min-width:0}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px}",
  ".v3-weather .wx-sun-pair,.v3-weather .wx-soil-pair{display:flex;flex-direction:column;align-items:center;gap:14px}",
  ".v3-weather .weather-tomorrow .wx-forecast-box{display:block;border:0;background:transparent;padding:6px}",
  ".v3-weather .weather-tomorrow .wx-forecast-values{display:flex;flex-direction:column;gap:15px}",
  ".v3-weather .wx-box h3{font-size:22px;margin:0 0 9px}",
  ".v3-weather .wx-box{padding:12px}",
  ".v3-weather .wx-grid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:12px!important}",
  ".v3-weather .weather-air{grid-column:1/5!important;grid-row:1!important}",
  ".v3-weather .weather-tomorrow{grid-column:5/8!important;grid-row:1!important}",
  ".v3-weather .weather-sun{grid-column:8/11!important;grid-row:1!important}",
  ".v3-weather .weather-soil{grid-column:11/13!important;grid-row:1!important}",
  ".v3-weather .wx-right-stack{grid-column:1/13!important;grid-row:2!important;display:block!important}",
  ".v3-weather .weather-garden{grid-column:auto!important;grid-row:auto!important;width:100%!important;min-height:210px!important}",
  ".v3-weather .weather-moon{grid-column:1/6!important;grid-row:3!important}",
  ".v3-weather .weather-astro{grid-column:6/13!important;grid-row:3!important}",
  ".v3-weather .wx-box{min-height:0!important;overflow:visible!important}",
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:230px!important}",
  ".v3-weather .wx-sowing{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}",
  ".v3-weather .wx-sowing-row.lunar,.v3-weather .wx-source-note{grid-column:1/3!important}",
  ".v3-weather .wx-box h3{font-size:21px!important}",
  ".v3-weather .wx-fact{font-size:15px!important}",
  ".v3-weather .weather-tomorrow{display:flex!important;flex-direction:column!important;justify-content:center!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{min-height:185px!important}",
  ".v3-robot{width:105px;height:118px;float:left;margin:-8px 8px 0 -4px;filter:drop-shadow(0 0 12px #34e878)}",
  ".v3-place:before{content:none!important}",
  ".v3-place{font-size:17px!important}",
  ".v3-place strong{font-size:24px!important}",
  ".v3{padding:14px 20px 12px!important}",
  ".v3-row{gap:10px!important;margin-top:9px!important}",
  ".v3-power>.v3-panel{height:255px!important;padding:10px!important}",
  ".v3-dial{height:182px!important;width:210px!important}",
  ".v3-date{font-size:19px!important}",
  ".v3-date b{font-size:23px!important}",
  ".v3-title{font-size:23px!important;margin-bottom:8px!important}",
  ".v3-weather .wx-grid{gap:9px!important}",
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:190px!important}",
  ".v3-weather .wx-box{padding:11px!important;border-radius:19px!important}",
  ".v3-weather .weather-garden{min-height:190px!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{min-height:160px!important}",
  ".v3-sources{margin-top:9px!important;padding:10px!important;font-size:14px!important}",
  ".v3-footer{margin-top:9px!important;padding:9px!important;font-size:14px!important}",
  ".v3-weather .wx-garden-art{font-size:0!important;min-width:140px!important;width:140px!important;height:140px!important}",
  ".v3-weather .wx-garden-art svg{width:140px!important;height:140px!important}",
  ".v3-weather .wx-moon-icon svg{width:110px!important;height:110px!important}",
  // Compact reference-aligned layout; retain every dynamic information field.
  ".v3-head{min-height:112px!important;gap:10px!important}",
  ".v3-robot{height:112px!important;width:103px!important}",
  ".v3-brand strong{font-size:49px!important}",
  ".v3-power>.v3-panel{height:240px!important}",
  ".v3-weather .wx-grid{grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:10px!important}",
  ".v3-weather .weather-air{grid-column:1/6!important;grid-row:1!important}",
  ".v3-weather .weather-tomorrow{grid-column:6/8!important;grid-row:1!important}",
  ".v3-weather .weather-sun{grid-column:8/11!important;grid-row:1!important}",
  ".v3-weather .weather-soil{grid-column:11/13!important;grid-row:1!important}",
  ".v3-weather .wx-right-stack{display:contents!important}",
  ".v3-weather .weather-garden{grid-column:1/13!important;grid-row:2!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px 18px!important;min-height:0!important}",
  ".v3-weather .weather-garden h3{grid-column:1/-1!important;margin-bottom:0!important}",
  ".v3-weather .wx-garden-body{grid-column:1!important;display:flex!important;align-items:flex-start!important}",
  ".v3-weather .wx-sowing{grid-column:2!important;display:flex!important;flex-direction:column!important;gap:5px!important;margin-top:0!important}",
  ".v3-weather .wx-sowing-row{font-size:15px!important;line-height:1.17!important;padding:5px 8px!important}",
  ".v3-weather .wx-sowing-row b{font-size:16px!important;margin-bottom:2px!important}",
  ".v3-weather .wx-source-note{font-size:12px!important;line-height:1.15!important;margin-top:3px!important;padding-top:4px!important}",
  ".v3-weather .weather-moon{grid-column:1/6!important;grid-row:3!important}",
  ".v3-weather .weather-astro{grid-column:6/13!important;grid-row:3!important}",
  ".v3-weather .weather-air .wx-facts{margin-top:4px!important;margin-bottom:3px!important;gap:3px!important}",
  ".v3-weather .weather-air .wx-fact{padding:3px 6px!important;font-size:14px!important}",
  ".v3-weather .wx-today-box{margin:4px 0!important;padding:5px!important}",
  ".v3-weather .wx-warning{font-size:14px!important;padding:4px 7px!important;margin-bottom:5px!important}",
  ".v3-weather .wx-weather-main{margin:1px 0 4px!important}",
  ".v3-weather .wx-box h3{padding-bottom:5px!important;margin-bottom:5px!important}",
  ".v3-weather .weather-moon .wx-moon-main{margin:0 0 5px!important}",
  ".v3-weather .wx-moon-row{font-size:17px!important;padding:3px!important}",
  ".v3-weather .wx-astro-disclaimer{margin-top:6px!important;padding-top:4px!important;font-size:12px!important}",
  ".v3-weather .wx-credit{font-size:11px!important;margin-top:5px!important;line-height:1.15!important}",
  // Final vertical rhythm: reduce spacing without clipping data panels.
  ".v3-head{min-height:104px!important}",
  ".v3-row{margin-top:6px!important}",
  ".v3-power>.v3-panel{height:234px!important}",
  ".v3-weather .weather-zone{margin-top:7px!important;padding:8px!important}",
  ".v3-weather .wx-grid{gap:7px!important}",
  ".v3-sources{margin-top:6px!important;padding:7px!important}",
  ".v3-footer{margin-top:6px!important;padding:7px!important}",
  ".v3-sources,.v3-footer{margin-top:1px!important}",
  // Restore the garden illustration hidden by legacy right-stack CSS.
  ".v3-weather .wx-garden-art{display:block!important;flex:0 0 110px!important;min-width:110px!important;width:110px!important;height:105px!important;min-height:105px!important;padding:0!important;margin-right:10px!important;background:transparent!important}",
  ".v3-weather .wx-garden-art svg{display:block!important;width:110px!important;height:105px!important}",
  ".v3-weather .wx-garden-copy{font-size:18px!important;line-height:1.23!important}",
  ".v3-weather .weather-garden{align-items:start!important}",
  // Reference typography and safe spacing: avoid cropping dynamic text.
  ".v3{padding-top:10px!important;padding-bottom:8px!important}",
  ".v3-head{min-height:100px!important}",
  ".v3-brand strong{font-size:52px!important;letter-spacing:-1px!important;color:#63fa59!important;text-shadow:0 0 12px #3df55a!important}",
  ".v3-brand small{font-size:16px!important}",
  ".v3-tag{border:2px solid #67fa58;border-radius:20px;padding:9px 6px;font-size:17px!important;background:#05210f}",
  ".v3-panel,.v3 .wx-box,.v3-sources,.v3-footer{box-shadow:inset 0 0 14px #0d7837,0 0 10px #158c35!important}",
  // Trim the remaining four pixels from outer margins; never crop the screenshot.
  ".v3{padding-top:8px!important;padding-bottom:6px!important}",
  // Visual-only refinement; keep the approved canvas dimensions and data flow.
  ".v3-robot{filter:drop-shadow(0 0 7px #6dfb91) drop-shadow(0 0 16px #217f52)!important}",
  ".v3-brand strong{font-weight:900!important;letter-spacing:-1.5px!important;text-shadow:0 0 5px #9fff8e,0 0 19px #2ad958!important}",
  ".v3-panel,.v3 .wx-box,.v3-sources,.v3-footer{border-color:#5cf86a!important;box-shadow:inset 0 0 12px #0a6c35,0 0 8px #168f3b,0 0 2px #b7ffb9!important}",
  ".v3-tag{box-shadow:inset 0 0 8px #176b34,0 0 9px #177b37!important}",
  ".v3-sources a{color:#80dcff!important;text-decoration:underline!important;text-underline-offset:3px!important}",
  ".v3-sources{min-height:86px!important;align-items:center!important;padding:12px 14px!important;box-sizing:border-box!important}",
  ".v3-sources span{line-height:1.35!important}",
  ".v3-footer{min-height:40px!important;align-items:center!important;box-sizing:border-box!important}",
  ".v3-row{margin-top:3px!important}",
  ".v3-weather .wx-grid{row-gap:5px!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{padding-top:10px!important;padding-bottom:10px!important}",
  ".v3-weather .weather-moon .wx-moon-main{margin-bottom:3px!important}",
  ".v3-weather .weather-astro p{margin-top:4px!important;margin-bottom:4px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-box{min-width:0!important;max-width:100%!important;box-sizing:border-box!important;padding-left:2px!important;padding-right:2px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values{min-width:0!important;max-width:100%!important}",
  ".v3-weather .weather-moon .wx-moon-main{min-width:0!important;max-width:100%!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{padding-top:7px!important;padding-bottom:7px!important}",
  ".v3-weather .weather-moon .wx-moon-row{padding-top:2px!important;padding-bottom:2px!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{padding-top:5px!important;padding-bottom:5px!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{padding-top:4px!important;padding-bottom:4px!important}",
  ".v3-weather .weather-sun .wx-sun-pair,.v3-weather .weather-soil .wx-soil-pair{margin-top:12px!important;margin-bottom:8px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-box{margin-top:10px!important;margin-bottom:8px!important}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{align-items:stretch!important;text-align:left!important}",
  ".v3-weather .weather-sun .wx-sun-pair,.v3-weather .weather-soil .wx-soil-pair{width:100%!important;box-sizing:border-box!important}",
  ".v3-weather .weather-moon,.v3-weather .weather-astro{padding-top:5px!important;padding-bottom:5px!important}",
  // Independent garden and sowing panels for the approved V3 layout.
  ".v3-weather .weather-garden{grid-column:1/9!important;grid-row:2!important;display:block!important;min-height:0!important}",
  ".v3-weather .weather-sowing{grid-column:9/13!important;grid-row:2!important;min-height:0!important}",
  ".v3-weather .weather-garden .wx-garden-body{display:flex!important}",
  ".v3-weather .weather-sowing .wx-sowing{display:flex!important;flex-direction:column!important;gap:5px!important;margin:0!important}",
  // Approved reference: horizontal date/dial composition and restrained header.
  ".v3-head{grid-template-columns:350px 1fr 275px!important;gap:12px!important;align-items:center!important}",
  ".v3-place{display:flex!important;align-items:center!important;flex-wrap:wrap!important;align-content:center!important;column-gap:12px!important;line-height:1.25!important}",
  ".v3-robot{float:none!important;flex:0 0 105px!important;margin:0!important}",
  ".v3-place strong{flex:1!important;font-size:27px!important}",
  ".v3-brand strong{font-style:italic!important;font-size:49px!important;white-space:nowrap!important}",
  ".v3-brand small{border-top:1px solid #4cdf67!important;padding-top:5px!important}",
  ".v3-date-panel{display:grid!important;grid-template-columns:1fr 1fr!important;align-items:center!important;gap:4px!important}",
  ".v3-date-panel .v3-date{text-align:left!important;padding-left:8px!important;font-size:24px!important}",
  ".v3-date-panel .v3-date b{font-size:29px!important;margin:10px 0 0!important}",
  ".v3-date-panel .v3-dial{width:200px!important;height:200px!important;margin:0 auto!important}",
  ".v3-count .v3-clock{color:#50f529!important;text-shadow:0 0 14px #37e52e!important}",
  ".v3-brand-white{color:#fff!important;text-shadow:0 0 5px #d2e6d4!important}",
  ".v3-brand-green{color:#44f32d!important;text-shadow:0 0 12px #3fe52d!important}",
  ".v3-pulse-mark{color:#4aff55!important;font-size:62px!important;font-style:normal!important;margin-left:8px!important}",
  ".v3-brand strong{letter-spacing:-1.5px!important;font-size:48px!important}",
  ".v3-weekday{display:block;font-size:19px;line-height:1.2;font-weight:700;text-transform:lowercase;margin-top:6px;color:#caffc4}",

  // Match the reference's top-aligned weather card headings; avoid floating titles mid-card.
  ".v3-weather .weather-tomorrow{justify-content:flex-start!important}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{display:flex!important;flex-direction:column!important;justify-content:flex-start!important}",
  ".v3-weather .weather-sun h3,.v3-weather .weather-soil h3{display:block!important;margin:0 0 8px!important;padding:0 0 6px!important;border-bottom:1px solid #3d9d63!important;text-align:left!important}",

  // Compact the gardening row without hiding advice or sowing recommendations.
  ".v3-weather .weather-garden,.v3-weather .weather-sowing{align-self:start!important}",
  ".v3-weather .weather-garden,.v3-weather .weather-sowing{align-self:stretch!important}",
  ".v3-weather .weather-garden .wx-garden-body{align-items:flex-start!important;gap:10px!important}",
  ".v3-weather .weather-garden .wx-garden-art{margin:0!important;flex:0 0 110px!important}",
  ".v3-weather .weather-garden .wx-garden-copy{margin:0!important;line-height:1.2!important}",
  ".v3-weather .weather-sowing .wx-sowing-row{margin:0!important}",

  // The garden panel shares a row with a taller sowing panel: use its space intentionally.
  ".v3-weather .weather-garden{display:flex!important;flex-direction:column!important}",
  ".v3-weather .weather-garden .wx-garden-body{flex:1!important;align-items:center!important;padding:8px 12px!important;gap:20px!important}",
  ".v3-weather .weather-garden .wx-garden-art{flex:0 0 160px!important;min-width:160px!important;width:160px!important;height:155px!important;min-height:155px!important}",
  ".v3-weather .weather-garden .wx-garden-art svg{width:160px!important;height:155px!important}",
  ".v3-weather .weather-garden .wx-garden-copy{font-size:20px!important;line-height:1.28!important}",

  // Distinguish the approved central brand from the location and information badge.
  ".v3-head .v3-brand{min-width:0!important;align-self:center!important}",
  ".v3-head .v3-brand strong{display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;line-height:1.08!important}",
  ".v3-head .v3-brand small{margin-top:9px!important;line-height:1.2!important}",
  ".v3-head .v3-pulse-mark{display:inline-block!important;line-height:1!important;margin-left:10px!important;transform:rotate(-12deg)}",
  ".v3-head .v3-tag{align-self:center!important;line-height:1.35!important}",

  ".v3-head .v3-pulse-mark{flex:0 0 68px!important;width:68px!important;height:42px!important;margin-left:7px!important;transform:none!important}",
  ".v3-head .v3-pulse-mark svg{display:block!important;width:68px!important;height:42px!important;filter:drop-shadow(0 0 5px #2ae84e)}",
  ".v3-head{min-height:124px!important}",
  ".v3-head .v3-robot{max-height:112px!important;align-self:center!important}",
  ".v3-head .v3-robot{overflow:visible!important}",
  ".v3-head .v3-brand strong{max-width:100%!important}",
  ".v3-head .v3-robot{filter:drop-shadow(0 0 5px #7effee) drop-shadow(0 0 12px #2ad9a8)!important}",
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:160px!important}",

  // Keep the first weather row compact without hiding live readings.
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{min-height:172px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values{gap:7px!important}",
  ".v3-weather .wx-sun-pair,.v3-weather .wx-soil-pair{gap:7px!important}",
  ".v3-weather .weather-sun,.v3-weather .weather-soil{gap:5px!important}",

  // Center actual sunrise/soil readings in the tall shared weather row while keeping headings at the top.
  ".v3-weather .weather-sun .wx-sun-pair,.v3-weather .weather-soil .wx-soil-pair{margin-top:auto!important;margin-bottom:auto!important}",
  ".v3-weather .weather-sun .wx-sun-pair{gap:10px!important}",
  ".v3-weather .weather-soil .wx-soil-pair{gap:9px!important}",

  // Balance tomorrow's min/max readings vertically in the same tall weather row.
  ".v3-weather .weather-tomorrow .wx-forecast-box{margin-top:auto!important;margin-bottom:auto!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values{gap:12px!important}",
  ".v3-weather .weather-garden .wx-garden-art{overflow:hidden!important;border-radius:16px!important}",
  ".v3-weather .weather-garden .wx-garden-art img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:14px!important}",
  ".v3-weather .weather-garden .wx-garden-art img{object-fit:contain!important;object-position:center center!important;background:#10231b!important}",
  ".v3-weather .weather-garden .wx-garden-art{background:#10231b!important;border:1px solid #3f9c68!important;box-sizing:border-box!important}",
  ".v3-weather .weather-garden .wx-garden-art img{border-radius:12px!important}",
  ".v3-weather .weather-sowing .wx-sowing{gap:3px!important}",
  ".v3-weather .weather-sowing .wx-sowing-row{padding:3px 7px!important;line-height:1.12!important;font-size:14px!important}",
  ".v3-weather .weather-sowing .wx-sowing-row b{font-size:15px!important;margin-bottom:1px!important}",
  ".v3-weather .weather-garden .wx-garden-body{padding:5px 10px!important}",
  ".v3-weather .weather-air,.v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{padding-top:10px!important;padding-bottom:10px!important}",
  ".v3-weather .weather-air .wx-facts{gap:2px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values{gap:8px!important}",
  // Approved reference: a dominant current-weather card, narrower tomorrow/daylight cards.
  ".v3-weather .weather-air{grid-column:1/6!important}",
  ".v3-weather .weather-tomorrow{grid-column:6/8!important}",
  ".v3-weather .weather-sun{grid-column:8/11!important}",
  ".v3-weather .weather-soil{grid-column:11/13!important}",
  // Reference has a larger central wordmark and a tighter, legible source/footer band.
  ".v3-head{grid-template-columns:305px minmax(0,1fr) 260px!important;gap:12px!important}",
  ".v3-head .v3-brand strong{font-size:58px!important;letter-spacing:-1.2px!important}",
  ".v3-head .v3-brand small{font-size:16px!important}",
  ".v3-head .v3-tag{font-size:19px!important}",
  ".v3-sources{align-items:center!important;font-size:17px!important;gap:8px!important}",
  ".v3-sources span{min-height:52px!important;display:flex!important;align-items:center!important}",
  ".v3-footer{font-size:16px!important;align-items:center!important}",
  // Bring the garden photograph and advice hierarchy closer to the approved reference.
  ".v3-weather .weather-garden .wx-garden-body{gap:18px!important;align-items:center!important}",
  ".v3-weather .weather-garden .wx-garden-art{flex:0 0 195px!important;min-width:195px!important;width:195px!important;height:190px!important;min-height:190px!important}",
  ".v3-weather .weather-garden .wx-garden-art img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#10231b!important}",
  ".v3-weather .weather-garden .wx-garden-copy{font-size:21px!important;line-height:1.32!important}",
  ".v3-weather .weather-garden h3{font-size:25px!important}",
  ".v3-count{justify-content:center!important;gap:4px!important}",
  ".v3-count .v3-title{margin:0 0 3px!important;font-size:28px!important}",
  ".v3-count .v3-count-event{font-size:21px!important;font-weight:700!important;color:#f2ffe9!important}",
  ".v3-count .v3-next{font-size:18px!important;line-height:1.25!important;margin-top:3px!important}",
  // The approved garden card has its own visible source column.
  ".v3-weather .weather-garden{position:relative!important;padding-right:196px!important}",
  ".v3-weather .weather-garden .wx-garden-body{gap:12px!important}",
  ".v3-weather .weather-garden .wx-garden-art{flex-basis:195px!important;min-width:195px!important;width:195px!important}",
  ".v3-weather .weather-garden .wx-garden-copy{font-size:19px!important}",
  ".v3-garden-source{position:absolute;right:12px;top:51px;bottom:12px;width:176px;border:2px solid #72ec79;border-radius:17px;padding:12px;background:#07391f;display:flex;flex-direction:column;justify-content:center;gap:12px;font-size:17px;line-height:1.28}",
  ".v3-garden-source b{color:#e6ffac;font-size:17px}",
  ".v3-garden-source a{color:#9ceaff;text-decoration:underline;overflow-wrap:anywhere}",
  // Make the lunar illustration a focal element without obscuring live phase text.
  ".v3-weather .weather-moon .wx-moon-icon{flex:0 0 104px!important;width:104px!important;height:104px!important;min-width:104px!important;display:flex!important;align-items:center!important;justify-content:center!important}",
  ".v3-weather .weather-moon .wx-moon-icon svg{display:block!important;width:104px!important;height:104px!important;max-width:100%!important}",
  ".v3-weather .weather-moon .wx-moon-row{align-items:center!important;gap:16px!important}",
  ".v3-weather .weather-moon .wx-moon-main{line-height:1.3!important}",
  // Keep the gardening credit legible as a separate attribution line.
  ".v3-weather .weather-garden .wx-credit{display:block!important;font-size:14px!important;line-height:1.35!important;margin-top:8px!important;border-top:1px solid #3b8557!important;padding-top:6px!important}",

  // Approved 09.11 neon reference: one coordinated geometry system at 1404px.
  // Keep all data-driven HTML and refresh scripts unchanged.
  ".v3{padding:8px 14px 18px!important;background:#010b05!important}",
  ".v3-head{min-height:111px!important;grid-template-columns:365px minmax(0,1fr) 278px!important;gap:12px!important}",
  ".v3-row{gap:12px!important;margin-top:12px!important}",
  ".v3-power{grid-template-columns:560px 389px minmax(0,1fr)!important}",
  ".v3-power>.v3-panel{height:236px!important;min-height:236px!important;padding:12px!important}",
  ".v3-date-panel{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important}",
  ".v3-date-panel .v3-date{flex:1 1 48%!important;min-width:0!important}",
  ".v3-date-panel .v3-dial{flex:0 0 230px!important;width:230px!important;height:215px!important;margin:0!important}",
  ".v3-weather{margin-top:12px!important}",
  ".v3-weather .wx-grid{grid-template-columns:repeat(12,minmax(0,1fr))!important;grid-template-rows:270px 311px 234px!important;gap:12px!important;align-items:stretch!important}",
  ".v3-weather .weather-air{grid-column:1/6!important;grid-row:1!important}",
  ".v3-weather .weather-tomorrow{grid-column:6/8!important;grid-row:1!important}",
  ".v3-weather .weather-sun{grid-column:8/11!important;grid-row:1!important}",
  ".v3-weather .weather-soil{grid-column:11/13!important;grid-row:1!important}",
  ".v3-weather .wx-right-stack{display:contents!important}",
  ".v3-weather .weather-garden{grid-column:1/9!important;grid-row:2!important}",
  ".v3-weather .weather-sowing{grid-column:9/13!important;grid-row:2!important}",
  ".v3-weather .weather-moon{grid-column:1/6!important;grid-row:3!important}",
  ".v3-weather .weather-astro{grid-column:6/13!important;grid-row:3!important}",
  ".v3-weather .wx-box{height:100%!important;min-height:0!important;max-height:none!important;align-self:stretch!important;overflow:hidden!important;padding:12px!important}",
  ".v3-weather .weather-garden{padding-right:205px!important}",
  ".v3-weather .weather-garden .wx-garden-body{min-height:0!important;flex:1!important}",
  ".v3-weather .weather-garden .wx-garden-art{width:195px!important;height:190px!important;min-width:195px!important;min-height:190px!important;flex:0 0 195px!important}",
  ".v3-weather .weather-garden .wx-garden-copy{font-size:18px!important;line-height:1.24!important}",
  ".v3-garden-source{right:12px!important;top:56px!important;bottom:12px!important;width:181px!important}",
  ".v3-weather .weather-sowing .wx-sowing-row{font-size:16px!important;line-height:1.2!important}",
  ".v3-sources{margin-top:12px!important;min-height:167px!important;grid-template-columns:1.35fr repeat(5,1fr)!important;align-items:stretch!important;padding:14px!important;font-size:17px!important}",
  ".v3-sources>span{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:6px!important}",
  ".v3-footer{margin-top:16px!important;min-height:68px!important;align-items:center!important;padding:12px 16px!important;font-size:15px!important}",

  // Weather today: compact two-column layout like the approved reference.
  // All live values remain present; no data fields are hidden.
  ".v3-weather .weather-air{display:grid!important;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)!important;grid-template-rows:auto auto minmax(0,1fr) minmax(0,1fr)!important;gap:4px 12px!important;align-content:stretch!important}",
  ".v3-weather .weather-air>h3{grid-column:1/-1!important;grid-row:1!important;margin:0!important;padding:0 0 5px!important;font-size:23px!important;line-height:1.1!important}",
  ".v3-weather .weather-air>.wx-warning{grid-column:1/-1!important;grid-row:2!important;margin:0!important;padding:3px 7px!important;font-size:13px!important}",
  ".v3-weather .weather-air>.wx-weather-main{grid-column:1!important;grid-row:3!important;margin:0!important;gap:5px!important;min-height:0!important}",
  ".v3-weather .weather-air .wx-symbol{font-size:42px!important}",
  ".v3-weather .weather-air .wx-now{font-size:40px!important}",
  ".v3-weather .weather-air .wx-now-label{font-size:13px!important}",
  ".v3-weather .weather-air .wx-cond{font-size:14px!important}",
  ".v3-weather .weather-air>.wx-today-box{grid-column:1!important;grid-row:4!important;margin:0!important;padding:3px 5px!important;min-height:0!important}",
  ".v3-weather .weather-air .wx-today-heading{font-size:13px!important;margin:0 0 2px!important}",
  ".v3-weather .weather-air .wx-forecast-values{gap:3px!important}",
  ".v3-weather .weather-air .wx-forecast-values div{font-size:11px!important;padding:2px!important}",
  ".v3-weather .weather-air .wx-forecast-values b{font-size:18px!important}",
  ".v3-weather .weather-air>.wx-facts{grid-column:2!important;grid-row:3/5!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:3px!important;margin:0!important;min-height:0!important}",
  ".v3-weather .weather-air .wx-fact{padding:3px 5px!important;font-size:12px!important;line-height:1.1!important}",
  ".v3-weather .weather-air .wx-fact b{font-size:14px!important}",

  // Approved lower row: compact moon facts alongside illustration, no clipped rows.
  ".v3-weather .weather-moon{display:grid!important;grid-template-columns:150px minmax(0,1fr)!important;grid-template-rows:auto minmax(0,1fr)!important;column-gap:12px!important;align-items:center!important}",
  ".v3-weather .weather-moon>h3{grid-column:1/-1!important;grid-row:1!important;font-size:24px!important;margin:0!important;padding:0 0 6px!important}",
  ".v3-weather .weather-moon .wx-moon-main{grid-column:1!important;grid-row:2!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:2px!important;margin:0!important;min-width:0!important}",
  ".v3-weather .weather-moon .wx-moon-icon{min-width:0!important;width:122px!important;height:122px!important;flex:0 0 122px!important}",
  ".v3-weather .weather-moon .wx-moon-icon svg{width:122px!important;height:122px!important}",
  ".v3-weather .weather-moon .wx-moon-main>div:last-child{text-align:center!important}",
  ".v3-weather .weather-moon .wx-moon-number{font-size:22px!important;line-height:1.1!important}",
  ".v3-weather .weather-moon .wx-moon-note{font-size:11px!important;line-height:1.1!important}",
  ".v3-weather .weather-moon .wx-moon-rows{grid-column:2!important;grid-row:2!important;border-top:0!important;min-width:0!important}",
  ".v3-weather .weather-moon .wx-moon-row{font-size:17px!important;padding:5px 0!important;line-height:1.2!important;gap:6px!important;flex-wrap:wrap!important}",
  ".v3-weather .weather-moon .wx-moon-row b{font-size:17px!important;white-space:normal!important}",
  // Astro: reserve the entire row for forecast text, keeping disclaimer visible.
  ".v3-weather .weather-astro{display:flex!important;flex-direction:column!important;gap:4px!important}",
  ".v3-weather .weather-astro h3{font-size:24px!important;margin:0!important;padding:0 0 6px!important}",
  ".v3-weather .weather-astro .wx-astro-tag{font-size:15px!important;margin:0!important}",
  ".v3-weather .weather-astro .wx-astro-body{gap:12px!important;align-items:center!important;min-height:0!important}",
  ".v3-weather .weather-astro .wx-astro-symbol{flex:0 0 90px!important;width:90px!important;height:90px!important;font-size:54px!important}",
  ".v3-weather .weather-astro .wx-astro-copy{font-size:17px!important;line-height:1.2!important;min-width:0!important}",
  ".v3-weather .weather-astro .wx-astro-copy b{font-size:20px!important;margin-bottom:3px!important}",
  ".v3-weather .weather-astro .wx-astro-disclaimer{font-size:11px!important;line-height:1.2!important;margin-top:6px!important;padding-top:4px!important}",

  // Final lower-row legibility pass based on the rendered CI PNG.
  ".v3-weather .weather-zone>.wx-credit{font-size:13px!important;line-height:1.25!important;margin:8px 8px 4px!important;text-align:left!important;color:#d1e9d9!important}",
  ".v3-sources{min-height:144px!important;grid-template-columns:1.35fr repeat(5,minmax(0,1fr))!important;gap:0!important}",
  ".v3-sources>b{font-size:22px!important;line-height:1.2!important;align-self:center!important;padding:0 10px!important}",
  ".v3-sources>span{font-size:17px!important;line-height:1.3!important;align-items:flex-start!important;text-align:left!important;padding:8px 12px!important;overflow-wrap:anywhere!important}",
  ".v3-sources a{font-size:16px!important;line-height:1.3!important}",
  ".v3-footer{min-height:60px!important;gap:12px!important;font-size:16px!important}",

  // Visual review 13.11: fill the gardening panel rather than centering tiny content
  // in a large empty area; keep the dynamic advice and RHS link intact.
  ".v3-weather .weather-garden .wx-garden-body{align-items:stretch!important;justify-content:flex-start!important;gap:16px!important;padding:10px 4px!important}",
  ".v3-weather .weather-garden .wx-garden-art{flex:0 0 205px!important;min-width:205px!important;width:205px!important;height:215px!important;min-height:215px!important;align-self:center!important}",
  ".v3-weather .weather-garden .wx-garden-copy{font-size:21px!important;line-height:1.3!important;align-self:center!important}",
  ".v3-weather .weather-garden .wx-garden-heading{font-size:23px!important;line-height:1.2!important}",
  ".v3-garden-source{top:52px!important;bottom:14px!important;justify-content:center!important;gap:9px!important}",
  // Make the source legend resemble the six distinct, readable columns in the etalon.
  ".v3-sources{min-height:144px!important;padding:12px 10px!important}",
  ".v3-sources>span{justify-content:center!important;gap:4px!important;padding:8px 10px!important}",
  ".v3-sources>span a{display:inline!important;max-width:100%!important;overflow-wrap:anywhere!important}",
  ".v3-footer{min-height:60px!important;justify-content:space-around!important}",

  // PNG review: source legend should be visually populated, not six sparse columns.
  ".v3-sources{min-height:145px!important;align-items:stretch!important}",
  ".v3-sources>b{display:flex!important;align-items:center!important;font-size:23px!important;line-height:1.22!important}",
  ".v3-sources>span{display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;gap:10px!important;font-size:19px!important;line-height:1.3!important}",
  ".v3-sources>span a{font-size:19px!important;line-height:1.25!important}",
  // Approved footer is a narrow status strip; keep all four live status fields.
  ".v3-footer{min-height:62px!important;justify-content:space-between!important;font-size:17px!important}",
  ".v3-footer>span{white-space:normal!important;line-height:1.2!important;text-align:center!important}",

  // Align the four weather panels' content to the compact reference composition.
  ".v3-weather .weather-tomorrow,.v3-weather .weather-sun,.v3-weather .weather-soil{justify-content:flex-start!important;gap:8px!important}",
  ".v3-weather .weather-tomorrow h3,.v3-weather .weather-sun h3,.v3-weather .weather-soil h3{font-size:21px!important;line-height:1.13!important;min-height:44px!important;margin:0!important;padding:0 0 6px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-box{margin:8px 0 0!important;padding:4px!important;flex:1!important;display:flex!important;flex-direction:column!important;justify-content:space-evenly!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-heading{font-size:14px!important;line-height:1.2!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values{gap:5px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values div{font-size:14px!important;padding:5px 2px!important}",
  ".v3-weather .weather-tomorrow .wx-forecast-values b{font-size:25px!important}",
  ".v3-weather .weather-sun .wx-sun-pair{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:8px!important;flex:1!important;margin:0!important;font-size:17px!important}",
  ".v3-weather .weather-sun .wx-sun-pair span{display:flex!important;justify-content:space-between!important;gap:6px!important;white-space:normal!important}",
  ".v3-weather .weather-sun .wx-sun-pair b{font-size:21px!important}",
  ".v3-weather .weather-soil .wx-soil-pair{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:12px!important;flex:1!important;margin:0!important;text-align:center!important}",
  ".v3-weather .weather-soil .wx-soil-pair strong{font-size:52px!important;line-height:1.1!important}",
  ".v3-weather .weather-soil .wx-soil-pair span{font-size:15px!important;line-height:1.3!important}",

  // Etalon footer and six-column source panel: restore exact information hierarchy.
  ".v3-sources{grid-template-columns:1.35fr repeat(5,minmax(0,1fr))!important;min-height:156px!important;gap:0!important}",
  ".v3-sources>span{display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;gap:6px!important;font-size:16px!important;line-height:1.2!important;padding:9px 10px!important}",
  ".v3-sources>span strong{font-size:17px!important;line-height:1.2!important;font-weight:600!important}",
  ".v3-sources>span a{font-size:16px!important;line-height:1.2!important}",
  ".v3-footer{display:grid!important;grid-template-columns:1.1fr 1fr 1.15fr 1.4fr 1fr!important;align-items:center!important;gap:8px!important;min-height:64px!important;padding:8px 12px!important}",
  ".v3-footer>span{font-size:14px!important;line-height:1.15!important;white-space:nowrap!important;text-align:center!important}",

  // Approved neon reference: daylight card uses a large central duration,
  // followed by two separated sunrise/sunset rows rather than a blank center.
  ".v3-weather .weather-sun{display:flex!important;flex-direction:column!important;justify-content:flex-start!important}",
  ".v3-weather .weather-sun h3{display:block!important;min-height:0!important;padding:0 0 12px!important;margin:0 0 10px!important;border-bottom:1px solid #3cc85c!important;text-align:center!important;font-size:23px!important;line-height:1.35!important}",
  ".v3-weather .weather-sun .wx-sun-pair{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;justify-content:center!important;gap:0!important;margin:0!important;padding:0 8px!important}",
  ".v3-weather .weather-sun .wx-sun-pair span{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;padding:13px 2px!important;border-bottom:1px solid #216b38!important;font-size:18px!important;white-space:normal!important}",
  ".v3-weather .weather-sun .wx-sun-pair span:last-child{border-bottom:0!important}",
  ".v3-weather .weather-sun .wx-sun-pair b{font-size:22px!important;white-space:nowrap!important}",
  // Keep the live source attribution visible but visually subordinate to the
  // five status items in the reference.
  ".v3-footer .v3-source-detail{display:block!important;font-size:10px!important;font-weight:400!important;opacity:.7!important;line-height:1.1!important;white-space:normal!important}",

  // Reference garden composition: fixed left photograph, full-height advice,
  // and dedicated RHS source column. Preserve the dynamic advice text and links.
  ".v3-weather .weather-garden{display:grid!important;grid-template-columns:minmax(0,1fr) 190px!important;grid-template-rows:46px minmax(0,1fr)!important;column-gap:12px!important;padding:10px 12px!important;align-items:stretch!important}",
  ".v3-weather .weather-garden>h3{grid-column:1/-1!important;grid-row:1!important;margin:0!important;padding:0 0 6px!important;font-size:27px!important;line-height:1.12!important}",
  ".v3-weather .weather-garden .wx-garden-body{grid-column:1!important;grid-row:2!important;display:grid!important;grid-template-columns:205px minmax(0,1fr)!important;align-items:stretch!important;gap:14px!important;margin:0!important;padding:0!important;min-width:0!important;min-height:0!important}",
  ".v3-weather .weather-garden .wx-garden-art{grid-column:1!important;grid-row:1!important;align-self:stretch!important;width:205px!important;height:100%!important;min-width:0!important;min-height:0!important;max-height:236px!important;margin:0!important}",
  ".v3-weather .weather-garden .wx-garden-art img{object-fit:contain!important;object-position:center!important;width:100%!important;height:100%!important;background:#10231b!important}",
  ".v3-weather .weather-garden .wx-garden-copy{grid-column:2!important;grid-row:1!important;align-self:start!important;min-width:0!important;margin:0!important;font-size:18px!important;line-height:1.23!important}",
  ".v3-weather .weather-garden .wx-garden-heading{font-size:22px!important;line-height:1.15!important;margin-bottom:6px!important}",
  ".v3-garden-source{position:static!important;grid-column:2!important;grid-row:2!important;align-self:stretch!important;width:auto!important;height:auto!important;min-width:0!important;margin:0!important;padding:10px!important;font-size:15px!important;line-height:1.2!important;gap:8px!important}",
  ".v3-garden-source b{font-size:16px!important}",
  ".v3-weather .weather-garden>.wx-credit{display:none!important}",
  ".v3-weather .weather-sun h3{font-size:22px!important;min-height:0!important;margin-bottom:2px!important;padding-bottom:7px!important}",
  ".v3-daylight-duration{display:block!important;text-align:center!important;font-size:33px!important;font-weight:800!important;line-height:1.1!important;color:#fff!important;margin:7px 0!important;white-space:nowrap!important}",
  ".v3-weather .weather-sun .wx-sun-pair{justify-content:flex-start!important;gap:0!important}",
  ".v3-weather .weather-sun .wx-sun-pair span{padding:8px 2px!important;font-size:17px!important}",

  // Coordinated 1404x1536 etalon geometry pass, measured against the user's
  // approved image. This overrides legacy fractional grid widths.
  ".v3-head{height:119px!important;min-height:0!important;align-items:center!important}",
  ".v3-place{font-size:19px!important;line-height:1.23!important}",
  ".v3-place strong{font-size:24px!important}",
  ".v3-brand strong{font-size:56px!important;line-height:1.12!important}",
  ".v3-brand small{font-size:14px!important;line-height:1.2!important}",
  ".v3-weather .wx-grid{grid-template-columns:560px 248px 270px minmax(0,1fr)!important;grid-template-rows:255px 311px 234px!important;gap:12px!important;margin-left:-8px!important;margin-right:-8px!important}",
  ".v3-weather .weather-air{grid-column:1!important;grid-row:1!important}",
  ".v3-weather .weather-tomorrow{grid-column:2!important;grid-row:1!important}",
  ".v3-weather .weather-sun{grid-column:3!important;grid-row:1!important}",
  ".v3-weather .weather-soil{grid-column:4!important;grid-row:1!important}",
  ".v3-weather .weather-garden{grid-column:1/4!important;grid-row:2!important;width:954px!important}",
  ".v3-weather .weather-sowing{grid-column:4!important;grid-row:2!important;width:407px!important;transform:translateX(-144px)!important}",
  ".v3-weather .weather-moon{grid-column:1!important;grid-row:3!important;width:570px!important}",
  ".v3-weather .weather-astro{grid-column:2/5!important;grid-row:3!important;width:792px!important;transform:translateX(13px)!important}",
  // The source legend already carries attribution; the extra full-width
  // diagnostic credit below the weather grid is not part of the approved art.
  ".v3-weather .weather-zone>.wx-credit{display:none!important}",
  ".v3-sources{min-height:167px!important}",
  ".v3-footer{min-height:68px!important}",
].join("\n")

export function buildCardV3Html({schedule,date,label="сьогодні",source="ДТЕК",update="—",weather=null,now=new Date()}) {
  if (!Array.isArray(schedule) || !date) throw Error("Schedule and date required")
  const {withPower,withoutPower}=calculateDailyTotals(schedule)
  const periods=schedule.map(p=>'<div class="v3-period'+(p.power?'':' off')+'"><span>'+ (p.power?'⚡ Світло':'🔴 Без світла') +'</span><b>'+esc(p.begin)+' — '+esc(p.end)+'</b></div>').join("")
  const event=nextPowerEvent(schedule,date,now)
  const countdown=event.kind==="countdown" ? event.remaining : "—:—"
  const eventHeading=event.kind==="countdown" ? event.title : "Наступна зміна графіка"
  const eventDetail=event.kind==="countdown" ? event.detail+" · станом на "+kyivTime(now)+" (Київ)" : event.detail
  const weatherMarkup=renderWeatherPanel(weather,date,label,"v3")
    .replace(/<div class="wx-garden-art">[\s\S]*?<\/div>/, '<div class="wx-garden-art"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Garlic_bulbs.jpg?width=330" alt="Фотографія головок часнику" loading="eager" referrerpolicy="no-referrer"/></div>')
    .replace(/<div class="wx-moon-icon">[\s\S]*?<\/div>/, "<div class=\"wx-moon-icon\"><svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\"><defs><radialGradient id=\"ml\"><stop stop-color=\"#fffde6\"/><stop offset=\".65\" stop-color=\"#d4d3c6\"/><stop offset=\"1\" stop-color=\"#777d79\"/></radialGradient><clipPath id=\"mc\"><circle cx=\"60\" cy=\"60\" r=\"52\"/></clipPath></defs><circle cx=\"60\" cy=\"60\" r=\"52\" fill=\"url(#ml)\"/><g clip-path=\"url(#mc)\" fill=\"#777b78\" opacity=\".28\"><ellipse cx=\"34\" cy=\"42\" rx=\"15\" ry=\"9\"/><ellipse cx=\"78\" cy=\"31\" rx=\"13\" ry=\"18\"/><ellipse cx=\"81\" cy=\"79\" rx=\"24\" ry=\"15\"/><circle cx=\"60\" cy=\"57\" r=\"8\"/></g><circle cx=\"60\" cy=\"60\" r=\"52\" fill=\"none\" stroke=\"#e6f8e1\" stroke-width=\"2\"/></svg></div>")
  // Split the garden markup for V3 only; shared weather rendering is unchanged.
  const splitGarden=weatherMarkup.replace(
    /(<section class="wx-box weather-garden"><h3>[\s\S]*?<\/h3>)([\s\S]*?)(<div class="wx-sowing">[\s\S]*?<\/div><\/section>)/,
    (_whole,heading,body,sowing)=>heading.replace(/<h3>[\s\S]*?<\/h3>/,'<h3>🌿 Поради городникам</h3>')+body+'<aside class="v3-garden-source"><b>📖 Джерело порад</b><span>RHS · Royal Horticultural Society</span><a href="https://www.rhs.org.uk/" target="_blank" rel="noopener noreferrer">rhs.org.uk</a></aside></section>'+
      '<section class="wx-box weather-sowing"><h3>🌱 Посівний календар</h3>'+sowing.slice(0,-10)+"</section>"
  )
  // V3-only presentation: daylight duration on its own prominent line.
  const referenceWeather=splitGarden.replace(
    /(<section class="wx-box weather-sun"><h3>☀️ Світловий день)(?: · ([^<]+))?(<\/h3>)/,
    (_whole,heading,duration,close)=>heading+close+
      '<div class="v3-daylight-duration">'+(duration||'—')+'</div>'
  )
  const html='<article class="v3">'+
    '<header class="v3-head"><div class="v3-place"><svg class="v3-robot" viewBox="0 0 130 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Бірюзовий робот Світлопульсу з блискавкою"><defs><linearGradient id="v3bot" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#74f8ed"/><stop offset=".55" stop-color="#2bc8c7"/><stop offset="1" stop-color="#087b9c"/></linearGradient></defs><path d="M65 18V7" stroke="#8dfff4" stroke-width="6"/><circle cx="65" cy="7" r="6" fill="#d7fff5"/><rect x="13" y="25" width="104" height="90" rx="26" fill="url(#v3bot)" stroke="#9affed" stroke-width="6"/><rect x="24" y="42" width="82" height="55" rx="19" fill="#082c39" stroke="#5ae9df" stroke-width="2"/><ellipse cx="46" cy="66" rx="12" ry="16" fill="#b4fff0"/><ellipse cx="84" cy="66" rx="12" ry="16" fill="#b4fff0"/><path d="M48 87Q65 102 82 87" fill="none" stroke="#91fff0" stroke-width="5" stroke-linecap="round"/><path d="M73 100l-18 24h12l-7 19 27-32H74l7-11Z" fill="#e7ff45" stroke="#f6ffa6" stroke-width="2" stroke-linejoin="round"/><path d="M70 108l-8 14h10l-4 11 11-19H69Z" fill="#fffbd2" opacity=".88"/><circle cx="65" cy="7" r="11" fill="none" stroke="#9affed" stroke-width="2" opacity=".55"/><path d="M32 52Q65 39 98 52" fill="none" stroke="#aafff0" stroke-width="2" opacity=".25"/><path d="M12 70H3M118 70H127" stroke="#68f0e6" stroke-width="9" stroke-linecap="round"/><path d="M42 115v22m46-22v22" stroke="#68f0e6" stroke-width="10" stroke-linecap="round"/><path d="M28 31Q65 14 102 31" fill="none" stroke="#d1fff7" stroke-width="3" opacity=".7"/><circle cx="41" cy="60" r="4" fill="#fff" opacity=".9"/><circle cx="79" cy="60" r="4" fill="#fff" opacity=".9"/><path d="M18 111Q65 128 112 111" fill="none" stroke="#13a8ad" stroke-width="3"/><circle cx="19" cy="108" r="4" fill="#e7ff45"/><circle cx="111" cy="108" r="4" fill="#e7ff45"/></svg><strong>СТ «Хімік»</strong>Боярська ТГ · Фастівський район</div>'+
    '<div class="v3-brand"><strong><span class="v3-brand-white">СВІТЛО</span><span class="v3-brand-green">ПУЛЬС 3.0</span><span class="v3-pulse-mark" aria-hidden="true"><svg viewBox="0 0 100 46" width="100" height="46" xmlns="http://www.w3.org/2000/svg"><path d="M2 25H22L31 13L43 38L55 5L66 25H98" fill="none" stroke="#5bff70" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></strong><small>Моніторинг електропостачання · Погода · Город · Місяць · Астропрогноз</small></div>'+
    '<div class="v3-tag">🌿 Все в одному<br>для комфортного життя в СТ</div></header>'+
    '<main class="v3-row v3-power">'+
    '<section class="v3-panel v3-date-panel"><div class="v3-date">📅 '+(label==="завтра"?"Завтра":"Сьогодні")+'<b>'+esc(displayDate(date))+'</b><span class="v3-weekday">'+esc(weekday(date))+'</span></div><div class="v3-dial">'+buildDial(schedule)+'</div></section>'+
    '<section class="v3-panel v3-count"><h2 class="v3-title">⏱ Відлік до події</h2><div class="v3-count-event">'+esc(eventHeading)+'</div><div class="v3-clock" data-countdown-minutes="'+(event.kind==="countdown"?event.minutesRemaining:"")+'">'+esc(countdown)+'</div><div class="v3-next">'+esc(eventDetail)+'</div></section>'+
    '<section class="v3-panel"><h2 class="v3-title">💡 Графік '+(label==="завтра"?"завтра":"сьогодні")+'</h2><div class="v3-periods">'+periods+'</div><div class="v3-totals"><span>⚡ '+esc(formatDuration(withPower))+'</span><span>🔴 '+esc(formatDuration(withoutPower))+'</span></div><div class="v3-timeline">'+buildTimeline(schedule)+'</div></section></main>'+
    '<div class="v3-weather">'+referenceWeather+'</div>'+
    '<section class="v3-sources"><b>▰ Джерела та<br>методика</b><span><strong>⚡ Графіки відключень:</strong><a href="https://www.dtek-krem.com.ua/ua/shutdowns" target="_blank" rel="noopener noreferrer">ДТЕК · dtek.com.ua</a></span><span><strong>☁ Погода і ґрунт:</strong><a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener noreferrer">Open-Meteo</a></span><span><strong>🌱 Агрономічні поради:</strong><a href="https://www.rhs.org.uk/" target="_blank" rel="noopener noreferrer">RHS</a><a href="https://ucanr.edu/" target="_blank" rel="noopener noreferrer">UCANR</a></span><span><strong>🌙 Місячний календар:</strong><a href="https://www.astronomy.com/" target="_blank" rel="noopener noreferrer">Astronomy.com</a></span><span><strong>✨ Астропрогноз:</strong><a href="https://www.astro-seek.com/" target="_blank" rel="noopener noreferrer">AstroSeek</a></span></section>'+
    '<footer class="v3-footer"><span>⟳ Оновлено: '+esc(update)+'</span><span>🔄 Погода: кожні 30 хв</span><span>⚡ Графіки ДТЕК: кожні 5 хв</span><span>ⓘ Рекомендації: перевірені джерела</span><span>⬡ Дані для СТ «Хімік»<small class="v3-source-detail"> · ' +esc(source)+'</small></span></footer></article>'
  // Interactive HTML countdown: the static PNG remains a snapshot for Telegram.
  // The browser clock starts from the server-rendered remaining minutes, without
  // altering the schedule, weather or external source links.
  const liveScript = '<script>(function(){'+
    'const el=document.querySelector(".v3-clock[data-countdown-minutes]");'+
    'const minutes=el?Number(el.dataset.countdownMinutes):NaN;'+
    'if(el&&Number.isFinite(minutes)&&minutes>=0&&el.dataset.countdownMinutes!==""){'+
    'const deadline=Date.now()+minutes*60000;'+
    'function tick(){const left=Math.max(0,Math.ceil((deadline-Date.now())/60000));'+
    'el.textContent=String(Math.floor(left/60)).padStart(2,"0")+":"+String(left%60).padStart(2,"0");'+
    'if(left===0){el.setAttribute("aria-label","Планова подія настала — оновіть графік");}}'+
    'tick();setInterval(tick,1000);}'+
    // Re-read the published HTML periodically so schedule and weather changes are visible.
    // A test-only V3 viewer uses this; production viewer is unchanged.
    'setInterval(function(){if(document.visibilityState!=="visible"||location.protocol==="about:")return;const x=window.scrollX,y=window.scrollY;try{sessionStorage.setItem("svitlopuls-v3-scroll",JSON.stringify([x,y]));}catch(e){}location.reload();},300000);try{const p=JSON.parse(sessionStorage.getItem("svitlopuls-v3-scroll")||"null");if(Array.isArray(p)){try{history.scrollRestoration="manual";}catch(e){}function restoreScroll(){const x=Math.max(0,Number(p[0])||0),y=Math.max(0,Number(p[1])||0);window.scrollTo(x,y);}requestAnimationFrame(restoreScroll);window.addEventListener("load",restoreScroll,{once:true});setTimeout(restoreScroll,150);setTimeout(restoreScroll,600);setTimeout(function(){restoreScroll();sessionStorage.removeItem("svitlopuls-v3-scroll");},1200);}}catch(e){}'+
    '})();</scr'+'ipt>'
  return '<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style></head><body>'+html+liveScript+'</body></html>'
}

export async function renderCardV3Png(details) {
  const {chromium}=await import("playwright")
  const browser=await chromium.launch({headless:true})
  try {
    const page=await browser.newPage({viewport:{width:1404,height:900},deviceScaleFactor:1})
    await page.setContent(buildCardV3Html(details),{waitUntil:"load"})
    // A screenshot must not silently capture an empty photo frame.
    await page.locator(".weather-garden .wx-garden-art img").evaluate(async img=>{
      if(!img.complete)await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error("Garlic photograph load timed out")),10000)
        img.addEventListener("load",()=>{clearTimeout(timeout);resolve()},{once:true})
        img.addEventListener("error",()=>{clearTimeout(timeout);reject(new Error("Garlic photograph failed to load"))},{once:true})
      })
      if(!img.naturalWidth)throw new Error("Garlic photograph is unavailable")
      await img.decode()
    })
    const png=await page.screenshot({type:"png",fullPage:true})
    if(png.length<2000)throw Error("Empty V3 card image")
    return png
  }finally{await browser.close()}
}
