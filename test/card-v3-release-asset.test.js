import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
// Release gate only: CI must not misrepresent a missing approved background as ready.
// This test documents the outstanding asset until the owner-approved clean plate is uploaded.
test("approved clean plate is required before V3 release (explicitly pending)",{skip:!process.env.V3_RELEASE_CHECK},()=>{
 const file=path.resolve("assets/approved-clean-plate.png");
 assert.ok(fs.existsSync(file),"Upload the exact owner-approved clean plate to assets/approved-clean-plate.png");
 const buf=fs.readFileSync(file);
 assert.ok(buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"Approved clean plate must be a PNG");
 assert.equal(buf.readUInt32BE(16),1404,"Approved width must remain 1404 px");
 assert.equal(buf.readUInt32BE(20),1536,"Approved height must remain 1536 px");
});
