import test from "node:test";
import assert from "node:assert/strict";
import {telegramFullscreenButton,CURRENT_VIEWER_URL} from "../src/card-v3-telegram-link.js";
test("Telegram fullscreen link targets current published viewer and requested day",()=>{
 assert.equal(CURRENT_VIEWER_URL,"https://erikbern55-boop.github.io/dtek-schedule/");
 assert.deepEqual(telegramFullscreenButton("today"),{text:"Відкрити на весь екран",url:CURRENT_VIEWER_URL+"?day=today"});
 assert.equal(telegramFullscreenButton("tomorrow").url,CURRENT_VIEWER_URL+"?day=tomorrow");
});
test("Telegram link rejects unsupported days and insecure destinations",()=>{
 assert.throws(()=>telegramFullscreenButton("yesterday"),/day/);
 assert.throws(()=>telegramFullscreenButton("today","http://example.com/"),/HTTPS/);
});
