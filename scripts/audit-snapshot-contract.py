#!/usr/bin/env python3
"""Strict audit of ONE isolated-contract directory. No production deployment."""
import hashlib
import json
import pathlib
import struct
import sys

root = pathlib.Path("isolated-contract")
def load(name):
    return json.loads((root / name).read_text(encoding="utf-8"))

report = {"scope": str(root), "jsonParity": {}, "pngProvenance": {"verified": False},
          "countdown": {"sameRulesVerified": False}}
errors = []
try:
    canonical, live, proof = (load(name) for name in
        ("today.json", "svitlopuls-live.json", "png-provenance.json"))
    png = (root / "today.png").read_bytes()
    if png[:8] != b"\x89PNG\r\n\x1a\n" or len(png) < 24:
        raise ValueError("Invalid isolated PNG")
    dimensions = list(struct.unpack(">II", png[16:24]))
    digest = hashlib.sha256(png).hexdigest()
    keys = ("date", "group", "periods", "weather", "generatedAt", "snapshotId")
    parity = {key: canonical.get(key) == live.get(key) and canonical.get(key) is not None
              for key in keys}
    parity["canonicalGeneratedAt"] = (canonical.get("generatedAt") ==
        live.get("canonicalGeneratedAt"))
    report["jsonParity"] = parity
    if not all(parity.values()):
        errors.append("JSON parity failed")
    # Check that the snapshot ID is a digest of the exact canonical fields.
    fields = ("date", "group", "periods", "weather", "generatedAt")
    snapshot = {key: canonical.get(key) for key in fields}
    def stable(obj):
        if isinstance(obj, list):
            return "[" + ",".join(stable(v) for v in obj) + "]"
        if isinstance(obj, dict):
            return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + stable(obj[k])
                                   for k in sorted(obj)) + "}"
        return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    expected_id = "sha256:" + hashlib.sha256(stable(snapshot).encode()).hexdigest()
    snapshot_valid = (canonical.get("snapshotId") == expected_id)
    png_valid = (proof.get("snapshotId") == expected_id and
                 proof.get("pngSha256") == digest and
                 proof.get("renderer") == "isolated V3 renderer" and
                 proof.get("renderedFromSnapshot") is True)
    report["pngProvenance"] = {
        "verified": bool(snapshot_valid and png_valid),
        "scope": "isolated V3 PNG only; Telegram PNG not attested",
        "pngSha256": digest, "pngDimensions": dimensions,
        "snapshotId": expected_id, "snapshotIdValid": snapshot_valid,
        "proofHashMatchesActualPng": proof.get("pngSha256") == digest,
    }
    if not (snapshot_valid and png_valid):
        errors.append("PNG hash or snapshot provenance mismatch")
    # The JS contract is unit-tested independently; that does not prove
    # both deployed renderers consume it. Fail closed until integration proof exists.
    report["countdown"] = {
        "sameRulesVerified": False,
        "reason": "Shared JS unit tests do not prove Telegram PNG and fullscreen UI use identical countdown logic"
    }
    errors.append("Cross-renderer countdown equivalence not demonstrated")
except Exception as exc:
    errors.append(str(exc))
report["errors"] = errors
pathlib.Path("snapshot-contract-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
if errors:
    sys.exit("FAIL: " + "; ".join(errors))
print("PASS: complete snapshot and countdown contract verified")
