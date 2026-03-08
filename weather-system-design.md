# Weather System Design Document

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Goals](#2-design-goals)
3. [Core Mechanics at a Glance](#3-core-mechanics-at-a-glance)
   1. [Temperature Scale (0–10), 15°F Bands, and Mechanics](#31-temperature-scale-010-15f-bands-and-mechanics)
   2. [Wind Scale (0–5)](#32-wind-scale-05)
   3. [Precipitation Scale (0–5)](#33-precipitation-scale-05)
   4. [Temperature × Precipitation Type Conversion](#34-temperature--precipitation-type-conversion)
4. [D&D 5e Mechanical Effects](#4-dd-5e-mechanical-effects)
   1. [Temperature and Armor/Clothing Interaction](#41-temperature-and-armorclothing-interaction)
   2. [Wind Combat/Movement Effects](#42-wind-combatmovement-effects)
   3. [Visibility Tiers](#43-visibility-tiers)
   4. [Difficult Terrain Rules](#44-difficult-terrain-rules)
   5. [Hazard Layer](#45-hazard-layer)
5. [System Architecture and Data Model](#5-system-architecture-and-data-model)
6. [Generation Pipeline](#6-generation-pipeline)
7. [Forecast Lifecycle, History, and Reveal Model](#7-forecast-lifecycle-history-and-reveal-model)
8. [Operator Commands (GM + Player Workflows)](#8-operator-commands-gm--player-workflows)
9. [Cross-Subsystem Interactions](#9-cross-subsystem-interactions)
10. [Design Inspirations and Rationale](#10-design-inspirations-and-rationale)
11. [Tuning and Extension Guidance](#11-tuning-and-extension-guidance)

---

## 1) Executive Summary

This weather system is a **mechanics-forward, D&D-ready weather engine**. Its primary outputs are three numeric traits per day:

- **Temperature** (`0–10`)
- **Wind** (`0–5`)
- **Precipitation** (`0–5`)

Those values are then converted into:

- gameplay conditions (snow/rain/sleet/blizzard/deluge),
- visibility penalties,
- difficult terrain flags,
- combat/movement impacts,
- and hazard advisories.

The model combines deterministic season/location baselines with stochastic rolls and continuity nudges so the world feels coherent rather than random.

---

## 2) Design Goals

- **Mechanics first:** numeric weather stages map directly to D&D-facing effects.
- **Readable at the table:** top-level scales are easy to reference quickly.
- **Stable but alive:** weather evolves with continuity, not wild day-to-day swings.
- **Setting-aware fantasy:** planar and manifest-zone overlays integrate with Eberron-style cosmology.
- **GM-operable:** forecasting, reveals, rerolls, lock/history, and location wizard support active campaign use.

---

## 3) Core Mechanics at a Glance

### 3.1 Temperature Scale (0–10), 15°F Bands, and Mechanics

Temperature stages are mapped to **15°F bands** beginning at **−25°F**, with open-ended cold/hot extremes.

| Temp Stage | Label | Fahrenheit Band | Mechanical Core |
|---|---|---|---|
| 0 | Extreme Cold | ≤ −25°F | DC 25 Con save or exhaustion; disadvantage without heavy cold-weather clothing |
| 1 | Frigid | −24°F to −10°F | DC 20 Con save or exhaustion; disadvantage without medium/heavy cold-weather clothing |
| 2 | Freezing | −9°F to 5°F | DC 15 Con save or exhaustion; disadvantage without light/medium/heavy cold-weather clothing |
| 3 | Cold | 6°F to 20°F | DC 10 Con save or exhaustion |
| 4 | Chilly | 21°F to 35°F | No direct temperature save |
| 5 | Mild | 36°F to 50°F | No direct temperature save |
| 6 | Warm | 51°F to 65°F | No direct temperature save |
| 7 | Hot | 66°F to 80°F | DC 10 Con save or exhaustion |
| 8 | Sweltering | 81°F to 95°F | DC 15 Con save or exhaustion; heavy armor wearers at disadvantage |
| 9 | Blistering | 96°F to 110°F | DC 20 Con save or exhaustion; medium/heavy armor wearers at disadvantage |
| 10 | Extreme Heat | ≥ 111°F | DC 25 Con save or exhaustion; all armor wearers at disadvantage |

> Temperature bands used by flavor/mechanics conversion: **cold (0–3), cool (4), mild (5–6), warm (7), hot (8–10)**.

### 3.2 Wind Scale (0–5)

| Wind Stage | Label | Mechanical Core |
|---|---|---|
| 0 | Calm | None |
| 1 | Breezy | None |
| 2 | Moderate Wind | Fogs and gases dispersed |
| 3 | Strong Winds | Disadvantage on ranged attacks; long-range attacks auto-miss; flying costs +1 ft movement per ft; open flames extinguished |
| 4 | Gale | Ranged attacks auto-miss; flying speed becomes 0; walking costs +1 ft movement per ft |
| 5 | Storm | DC 15 Strength check or fall prone; small trees uprooted; severe projectile/wind hazard context |

### 3.3 Precipitation Scale (0–5)

| Precip Stage | Baseline Sky/Precip Meaning |
|---|---|
| 0 | Clear |
| 1 | Partly cloudy / light atmospheric moisture |
| 2 | Overcast |
| 3 | Active precipitation |
| 4 | Heavy precipitation |
| 5 | Extreme precipitation / deluge-class |

### 3.4 Temperature × Precipitation Type Conversion

Precipitation type is not fixed by precip alone; it is derived from **temperature zone + precip stage**:

- **Temp ≤ 3 (snow zone)**
  - precip 1–2: `snow_light`
  - precip 3: `snow`
  - precip 4–5: `blizzard`
- **Temp = 4 (sleet zone)**
  - precip 1–2: `sleet_light`
  - precip 3: `sleet`
  - precip 4–5: `ice_storm`
- **Temp ≥ 5 (rain zone)**
  - precip 1–2: `rain_light`
  - precip 3: `rain`
  - precip 4: `heavy_rain`
  - precip 5: `deluge`

This conversion is a core design choice: **the same precip stage has different gameplay meaning at different temperatures**.

---

## 4) D&D 5e Mechanical Effects

### 4.1 Temperature and Armor/Clothing Interaction

The system includes explicit temperature mechanics for exposure and heat burden:

- Cold stages (0–3): escalating Con save DCs and clothing requirements.
- Heat stages (7–10): escalating Con save DCs plus armor penalties at high heat.
- Armor penalties escalate by stage:
  - stage 8: heavy armor disadvantaged,
  - stage 9: medium + heavy disadvantaged,
  - stage 10: all armor wearers disadvantaged.

### 4.2 Wind Combat/Movement Effects

Wind stages 3+ materially change tactical play:

- ranged accuracy degradation to auto-miss,
- flight impairment to complete shutdown at gale,
- movement tax in strong winds/gales,
- environmental impacts (flame suppression, prone checks, uprooting hazards).

### 4.3 Visibility Tiers

Visibility is computed from fog and precipitation outcome:

- **Tier A:** Lightly Obscured (Perception at disadvantage)
- **Tier B:** Lightly Obscured; Heavily Obscured beyond 60 ft
- **Tier C:** Lightly Obscured; Heavily Obscured beyond 30 ft

Typical triggers:

- Tier A: rain/snow/sleet
- Tier B: heavy rain, ice storm, light fog
- Tier C: blizzard, deluge, dense fog

### 4.4 Difficult Terrain Rules

Difficult terrain is generated by condition type:

- always true for `sleet`, `ice_storm`, `blizzard`, `deluge`,
- true for `snow` when accumulation is already present.

This creates continuity across days: yesterday’s snow can keep today’s movement difficult even if new precipitation is lighter.

### 4.5 Hazard Layer

A hazard advisory layer augments direct mechanics for severe weather:

- heavy rain: lightning/flash-flood risk,
- deluge: extreme flooding and route failure,
- blizzard: whiteout/avalanche/hypothermia risk,
- ice storm: falling ice + storm danger.

These are guidance outputs intended for GM adjudication rather than rigid auto-resolution.

---

## 5) System Architecture and Data Model

### Core weather configuration and tables

- Forecast/storage controls:
  - `CONFIG_WEATHER_FORECAST_DAYS`
  - `CONFIG_WEATHER_HISTORY_DAYS`
  - `CONFIG_WEATHER_SEED_STRENGTH`
- Mechanics and presentation maps:
  - `CONFIG_WEATHER_MECHANICS`
  - `CONFIG_WEATHER_LABELS`
  - `CONFIG_WEATHER_FLAVOR`
- Generation model tables:
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

### Runtime weather state

Tracks:

- active location profile (`climate`, `geography`, `terrain`, optional `manifestZone`, profile signature),
- forecast records,
- locked history,
- player reveal metadata (`tier`, `source`),
- wizard staging selections.

---

## 6) Generation Pipeline

For each generated day:

1. Resolve location profile.
2. Build baseline from climate + geography + terrain tables.
3. Roll afternoon `temp/wind/precip` via bell-like opposed dice.
4. Apply continuity nudge from prior day (`CONFIG_WEATHER_SEED_STRENGTH`).
5. Derive morning/afternoon/evening states using deterministic arc + stochastic offset.
6. Roll fog by period with persistence/wind logic.
7. Apply manifest-zone local modifiers.
8. Apply planar-weather shifts/overrides (including hard overrides like coterminous Syrania calm/clear).
9. Derive conditions, visibility tier, difficult terrain, mechanics text, and hazard notes.

---

## 7) Forecast Lifecycle, History, and Reveal Model

- Forecast is generated forward and retained to configured horizon.
- Past weather locks into history up to retention cap.
- Location changes use signature-aware stale handling:
  - matching profile records may be resurrected,
  - mismatched records are marked stale until regenerated.
- Player reveal is tiered by source and offset; updates are upgrade-only.
- GM view remains full-fidelity.

---

## 8) Operator Commands (GM + Player Workflows)

### Core weather commands

- `!cal weather`
- `!cal weather forecast [n]`
- `!cal weather generate`
- `!cal weather history`
- `!cal weather mechanics`

### Location wizard

- `!cal weather location`
- `!cal weather location climate <key>`
- `!cal weather location geography <key>`
- `!cal weather location terrain <key>`
- `!cal weather location zone <key|none>`

### GM control commands

- `!cal weather reroll <serial>`
- `!cal weather lock <serial>`
- `!cal weather event trigger <key>`
- `!cal weather event roll <key>`

### Player-facing reveal/send pathways

- weather send/reveal flows preserve best-known tier per day,
- compatibility aliases (`survival`/`mundane`, `magic`/`magical`) map to medium/high reveal pathways.

---

## 9) Cross-Subsystem Interactions

- Planar phases can shift temperature/precipitation/wind.
- Manifest zones apply local weather bias independent of global plane phase.
- Moon/night-light systems consume precipitation stage to modulate moonlight visibility.
- Extreme weather hooks can emit campaign event/advisory content.

---

## 10) Design Inspirations and Rationale

The system is intentionally hybrid:

- **Meteorological inspiration:** climate/geography/terrain produce plausible regional signatures.
- **Game design inspiration:** every weather axis maps to tactical play, not just narrative text.
- **D&D-forward philosophy:** conditions are translated into familiar categories (obscurement, difficult terrain, attack penalties, movement costs, save DCs).
- **Fantasy cosmology inspiration:** planar and manifest effects preserve Eberron-style world identity without replacing baseline weather logic.

The practical result is a white-paper style approach: **weather values are numeric, deterministic where useful, stochastic where needed, and mechanically legible at the table**.

---

## 11) Tuning and Extension Guidance

- Add climates/geographies/terrains by extending table entries and UI maps.
- Keep modifier ranges bounded to preserve distribution diversity.
- Re-validate thresholds whenever changing trait scales or condition conversion logic.
- If extending forecast horizon, verify performance and stale/resurrection behavior in long-running campaigns.
- Any change to stage semantics (especially temp 0–10 or precip/wind thresholds) should be treated as a ruleset revision and versioned in docs.
