# Світлопульс 3.0 — visual release gate (PR #43)

Status: **NOT READY FOR DEPLOYMENT**. Keep the public Telegram card and GitHub Pages unchanged.

## Verified
- Test-branch automated tests pass at commit 131b869 (GitHub Actions 43492255006).
- The live-weather preview supports an opt-in Kyiv-local DD.MM date and three distinct temperatures.

## Blocking issues
1. `/assets/approved-clean-plate.png` is **not present** in the test branch. The renderer's example path is not a shipped image. A 1404×1536 owner-approved clean-plate image must be added by a binary-capable upload method. Do not rename a different artwork and pretend it is approved.
2. The plate must have no baked-in date, current temperature, min or max values at their dynamic overlay positions. Retain the approved neon design and all other labels/icons.
3. Inspect rendered HTML (not only a composited PNG) at portrait and landscape viewport sizes. Confirm no duplicate date, no clipping/overlap into the adjacent weather column, and exactly one leading + for positive temperatures.
4. Verify all links, DTEK refresh, countdown, and Open-Meteo refresh with live inputs; no mock values on production.
5. Compare the full card against the approved 1404×1536 artwork and obtain owner approval before merging PR #43.

The date overlay remains opt-in (`useWeatherHeaderDate=false`) until the clean plate is available. Passing unit tests alone does not clear this gate.
