#!/usr/bin/env python3
"""Read-only provenance and countdown audit; never deploys or writes production files."""
import json, pathlib, struct, hashlib, sys
root=pathlib.Path("snapshots/web")
canonical=json.loads((root/"today.json").read_text())
live=json.loads(pathlib.Path("renderer/dist/svitlopuls-live.json").read_text())
png=(root/"today.png").read_bytes()
assert png[:8]==b"\x89PNG\r\n\x1a\n", "Invalid Telegram PNG"
dimensions=struct.unpack(">II",png[16:24])
keys=("date","group","periods","weather")
parity={k:canonical.get(k)==live.get(k) for k in keys}
parity["canonicalGeneratedAt"]=canonical.get("generatedAt")==live.get("canonicalGeneratedAt")
# A binary hash establishes identity of the PNG being inspected, NOT its JSON provenance.
# No embedded canonical snapshot ID exists in today's PNG. Report this as unverified.
png_sha256=hashlib.sha256(png).hexdigest()
provenance={"pngSha256":png_sha256,"pngDimensions":dimensions,
 "pngSnapshotId":None,"jsonSnapshotId":canonical.get("snapshotId"),
 "verified":False,"reason":"PNG has no authenticated snapshot ID linking it to today.json"}
# Countdown contract: last event of day must not be invented as a power switch at midnight.
periods=canonical["periods"]
events=[{"time":p["begin"],"power":p["power"]} for i,p in enumerate(periods)
        if i>0 and p["power"]!=periods[i-1]["power"]]
countdown={"canonicalTransitions":events,
 "sameRulesVerified":False,
 "reason":"Telegram PNG countdown is rasterized; the fullscreen renderer uses independent client-side next-day logic. A shared function or deterministic rendered-value comparison is required."}
report={"jsonParity":parity,"pngProvenance":provenance,"countdown":countdown}
pathlib.Path("snapshot-contract-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
if not all(parity.values()): sys.exit("FAIL: JSON mismatch")
if not provenance["verified"]: sys.exit("FAIL: PNG provenance is not verified; snapshotId contract required")
if not countdown["sameRulesVerified"]: sys.exit("FAIL: countdown rules are not verified")
print("PASS: complete snapshot and countdown contract verified")
