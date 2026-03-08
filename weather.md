# Weather Subsystem Design Document

## 1) Overview and scope

The weather subsystem produces daily/forecast weather from a hybrid deterministic + stochastic model driven by location profile and optional supernatural modifiers.

Implemented capabilities include:

- climate/geography/terrain baseline modeling,
- period-based (morning/afternoon/evening) weather states,
- forecast generation/history retention/stale handling,
- player reveal tiers and source attribution,
- hazard/mechanics derivation for tabletop play,
- manifest-zone and planar-weather overlays.

## 2) Design goals and inspirations

- **Real-world shape, fantasy hooks:** emulate plausible daily weather behavior while supporting Eberron planar/manifest effects.
- **Continuity over noise:** use persistence nudges so consecutive days feel meteorologically coherent.
- **GM-control friendly:** location wizard, regeneration controls, and visibility tiers enable quick table operation.
- **Mechanics-ready output:** derive play-impact notes (visibility, movement, saves/checks) from weather states.

## 3) Data model

## 3.1 Core constants/tables

Primary weather tables and controls:

- forecast/storage controls:
  - `CONFIG_WEATHER_FORECAST_DAYS`
  - `CONFIG_WEATHER_HISTORY_DAYS`
  - `CONFIG_WEATHER_SEED_STRENGTH`
- label and text maps:
  - `CONFIG_WEATHER_LABELS`
  - `CONFIG_WEATHER_FLAVOR`
  - `CONFIG_WEATHER_MECHANICS`
- generation tables:
  - `WEATHER_CLIMATE_BASE`
  - `WEATHER_GEO_MOD`
  - `WEATHER_TERRAIN_MOD`
  - `WEATHER_TOD_ARC`
  - `WEATHER_TOD_BELL`
  - `WEATHER_UNCERTAINTY`
- UI selection maps:
  - `WEATHER_CLIMATES`
  - `WEATHER_GEOGRAPHIES`
  - `WEATHER_TERRAINS_UI`

## 3.2 Runtime weather state

Weather state tracks:

- current location profile (`climate/geography/terrain/manifestZone` + signature),
- generated forecast records,
- locked history entries,
- per-day player reveal metadata (`tier` + `source`),
- temporary wizard selections used by `!cal weather location`.

## 4) Processing pipeline

## 4.1 Daily generation

For each day:

1. Resolve active location profile.
2. Build baseline from climate + geography + terrain tables.
3. Roll afternoon trait values (`temp`, `wind`, `precip`) using opposed-dice bell behavior.
4. Apply continuity nudges from previous day (`CONFIG_WEATHER_SEED_STRENGTH`).
5. Derive morning/afternoon/evening via deterministic arc + stochastic shift.
6. Roll fog by period with wind/persistence adjustments.
7. Apply manifest-zone effects.
8. Apply planar-weather overlays and hard overrides (e.g., Syrania coterminous calm/clear).
9. Derive condition bundle and mechanics/hazard annotations.

## 4.2 Forecast lifecycle and stale handling

- Forecast is pre-generated forward and trimmed to history/forecast caps.
- Location changes do not hard-delete all future records:
  - matching signatures are resurrected,
  - mismatches are marked stale until regenerated.
- Generation functions fill missing records forward from today.

## 4.3 Reveal model

- GM sees full detail.
- Player detail tier changes with reveal source and day offset.
- Reveal entries are upgrade-only (never downgrade known detail).
- Source labels distinguish common knowledge vs skilled/expert forecasts.

## 5) Commands and operator controls

Weather command family:

- `!cal weather` (today/weather panel)
- `!cal weather forecast [n]`
- `!cal weather generate`
- `!cal weather location` (wizard entry)
- wizard steps:
  - `!cal weather location climate <key>`
  - `!cal weather location geography <key>`
  - `!cal weather location terrain <key>`
  - `!cal weather location zone <key|none>`
- reveal/send controls exposed in weather panel workflows.

## 6) Cross-subsystem interactions

- Planar state can shift or override weather traits.
- Manifest zones model local planar bleed-through independent of global plane phase.
- Moon/tide notes are surfaced in weather-facing outputs where location type supports it.
- Extreme weather hooks and advisory events can be triggered for GM workflows.

## 7) Tuning and extension guidance

- Add climates/geographies/terrains by extending the respective modifier tables and UI maps.
- Keep new modifiers bounded to avoid collapsing distribution variance.
- Re-test derived condition thresholds whenever trait scale mappings are edited.
- If expanding forecast horizons, verify performance and stale-resurrection behavior for long campaigns.
