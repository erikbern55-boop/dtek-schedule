// Test-only gate for the approved standalone HTML card. No production publishing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const path=resolve('test/fixtures/approved-index.html');
test('approved standalone HTML is present before release',()=>{
  if(!process.env.V3_RELEASE_CHECK)return;
  assert.ok(existsSync(path),'Copy owner-approved standalone index.html into test/fixtures/approved-index.html');
  const html=readFileSync(path,'utf8');
  assert.match(html,/data:image\/(?:png|jpeg|webp);base64,/,'Approved artwork must be embedded');
  assert.match(html,/1404\s*\/\s*1536/,'Approved portrait aspect ratio must be retained');
  assert.match(html,/live-date/);
  assert.match(html,/live-count/);
  assert.match(html,/live-powerOn/);
  assert.match(html,/live-powerOff/);
  assert.match(html,/live-temperature/);
  assert.match(html,/live-tomorrow/);
  assert.match(html,/live-soil/);
  assert.match(html,/live-updated/);
  assert.match(html,/cache:\s*['"]no-store['"]/,'Live JSON must bypass caches');
  assert.match(html,/setInterval\(load,\s*5\s*\*\s*60\s*\*\s*1000\)/,'DTEK polling must be every five minutes');
  assert.doesNotMatch(html,/<script[^>]+src=['"]https?:/i,'Standalone file cannot depend on remote scripts');
});
