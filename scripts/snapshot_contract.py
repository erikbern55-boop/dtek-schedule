"""Strict snapshot contract for isolated tests; no production writes."""
import hashlib, json, re
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

def canonical_bytes(snapshot):
    payload = {k: snapshot[k] for k in ("date", "group", "periods", "weather", "generatedAt")}
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()

def snapshot_id(snapshot):
    return "sha256:" + hashlib.sha256(canonical_bytes(snapshot)).hexdigest()

def assert_shared_snapshot(canonical, live, png_metadata):
    expected = snapshot_id(canonical)
    if canonical.get("snapshotId") != expected or live.get("snapshotId") != expected:
        raise ValueError("JSON snapshotId mismatch")
    if png_metadata.get("snapshotId") != expected:
        raise ValueError("PNG snapshotId missing or mismatched")
    if not png_metadata.get("renderedFromSnapshot"):
        raise ValueError("PNG rendering provenance not independently verified")
    for key in ("date", "group", "periods", "weather"):
        if canonical.get(key) != live.get(key):
            raise ValueError(f"Snapshot field mismatch: {key}")
    return expected

def minutes(clock):
    if not re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00", clock):
        raise ValueError("Invalid schedule time")
    value = int(clock[:2])*60+int(clock[3:])
    return value

def next_event(today, tomorrow, now_utc):
    """Single transition contract; midnight only counts if power state changes."""
    local = now_utc.astimezone(ZoneInfo("Europe/Kyiv"))
    date = local.date().isoformat()
    if today["date"] != date:
        raise ValueError("Today's snapshot date differs from Kyiv local date")
    periods = today["periods"]
    now_minute = local.hour*60+local.minute+local.second/60
    for i in range(1, len(periods)):
        p = periods[i]
        if p["power"] != periods[i-1]["power"] and minutes(p["begin"]) > now_minute:
            delta = minutes(p["begin"]) - now_minute
            return {"date": date, "time": p["begin"], "power": p["power"], "minutesRemaining": int(-(-delta//1))}
    if not tomorrow:
        return None
    expected_tomorrow = (local.date()+timedelta(days=1)).isoformat()
    if tomorrow["date"] != expected_tomorrow or not tomorrow.get("periods"):
        return None
    next_periods = tomorrow["periods"]
    if next_periods[0]["power"] != periods[-1]["power"]:
        first = next_periods[0]
    else:
        first = next((p for i,p in enumerate(next_periods) if i and p["power"] != next_periods[i-1]["power"]), None)
    if not first:
        return None
    delta = 1440-now_minute+minutes(first["begin"])
    return {"date": expected_tomorrow, "time": first["begin"], "power": first["power"], "minutesRemaining": int(-(-delta//1))}
