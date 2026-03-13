# Eberron Calendar — Design Document & Decision Log

This document is the canonical reference for the Eberron Calendar Roll20 API script. It captures architecture, mechanical design decisions, complete data tables, and pending work. All subsystem design documents have been consolidated here.

**Source of truth for implementation:** `calendar.js`
**Source of truth for intent and design:** this file

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Architecture Overview](#2-architecture-overview)
3. [Calendar Systems](#3-calendar-systems)
4. [Three-Tier Knowledge System](#4-three-tier-knowledge-system)
5. [Events Subsystem](#5-events-subsystem)
6. [Weather Subsystem](#6-weather-subsystem)
7. [Moon Subsystem](#7-moon-subsystem)
8. [Planar Subsystem](#8-planar-subsystem)
9. [Nighttime Lighting System](#9-nighttime-lighting-system)
10. [Ring of Siberys](#10-ring-of-siberys)
11. [Manifest Zone System](#11-manifest-zone-system)
12. [Interface and Navigation](#12-interface-and-navigation)
13. [Code Conventions](#13-code-conventions)
14. [Development History](#14-development-history)

---

## 1. Purpose and Scope

This is a Roll20 API script (`calendar.js`) for managing a fantasy campaign calendar. It integrates:

- Multi-system calendar display (Eberron, Faerûnian/Harptos, Gregorian)
- Procedural, location-based weather generation
- Moon orbital mechanics with phase tracking, eclipses, and tidal/lighting effects
	- 12 moons of Eberron
	- 1 moon of Faerun (Selune)
	- 1 moon of Earth
- 13 planes of existence with canonical cycles and generated off-cycle events
- Nighttime lighting calculation
- Campaign events and observances with GM/player reveal controls

**Primary canon source:** Published WotC books, coupled with Keith Baker's published Eberron material.

**Design philosophy:**
- Core date engine is system-agnostic and drives all subsystems
- Subsystem behavior is explicit and tunable through data tables
- Deterministic behavior wherever possible (seeded, reproducible)
- Information tiers reflect quality of in-world knowledge, not acquisition method
- Generated vs. canonical events are categorically distinct

---

## 2. Architecture Overview

### Layers

**Layer 1 — Base calendar engine**
Handles calendar system definitions, month/weekday naming, year/day serial conversion, date parsing, and month rendering. All subsystems build on this layer.

**Layer 2 — Subsystems**
Each subsystem consumes the current date/serial from the base layer and projects additional game-facing state: events, moon phases, weather, and planar conditions.

**Layer 3 — Presentation and command layer**
All systems exposed through `!cal` commands and panel UIs with GM/player reveal controls.

### Entry Point

`!cal` → current month mini-calendar with subsystem highlights (weather one-liner, notable moons, planar state). GM gets navigation buttons; players get a simpler view.


---

## 3. Calendar Systems

### 3.1 Eberron (Default)

- 12 months × 28 days = 336 days/year
- 7-day weeks: Sul, Mol, Zol, Wir, Zor, Far, Sar
- Era label: YK (Year of the Kingdom)

**Month names:** Zarantyr, Olarune, Therendor, Eyre, Dravago, Nymm, Lharvion, Barrakas, Rhaan, Sypheros, Aryth, Vult

### 3.2 Faerûnian / Harptos (Forgotten Realms)

- 12 months × 30 days + 5 festival intercalary days + Shieldmeet leap day
- Uses **tendays**. Each month = 3 tendays = 30 days.
- Mini-calendar renders 10 columns labeled: 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, 10th
- Date format: `16th of Mirtul, 1492 DR`
- Era label: DR (Dalereckoning)
- Weekday names not used in date display

> **Implementation note:** Harptos tenday column layout is an open task (see Design Tasks.md). The calendar system definitions are correct; the display rendering may still be showing weekday columns.

### 3.3 Gregorian / Earth

- Standard Earth calendar
- Single moon (Luna)
- Era labels: CE/BCE

### 3.4 Smart Date Parsing

Unified across all commands:
- One number → next occurrence of that day in current month
- Two numbers → month + day (next occurrence if no year given)
- Three numbers → month + day + year
- Month names recognized (`!cal Olarune` → next upcoming Olarune)

---

## 4. Three-Tier Knowledge System

All subsystems use a unified three-tier naming convention. No legacy names (mundane/magical/abridged/survival/magic) in current or new code.

| Tier | Source Label | Concept |
|---|---|---|
| `low` | Common Knowledge | Obvious, observable, no expertise needed |
| `medium` | Skilled Forecast | Requires skill or training |
| `high` | Expert Forecast | Expert/divination-level precision |

### Reveal Storage

- Per-serial: `{ tier: 'low'|'medium'|'high', source: string }`
- **Upgrade-only**: new info never downgrades existing knowledge
- Location-aware: weather reveals stored with location context
- Past-date pruning clears old reveals for memory management

### Weather Tiers

- **Low**: Today's weather (obvious). Tomorrow's rough guess (seeded from today).
- **Medium**: 3-day window. Today = full detail, days 2–3 = moderate detail.
- **High**: Full 10-day forecast with per-period breakdowns and D&D mechanics.

### Moon Tiers

- **Low**: Phases today + 2 days. Uncertainty windows on all predictions.
- **Medium**: Presets 1m/3m/6m/10m (DC 10/15/20/25). First full synodic cycle = exact. Beyond one cycle = uncertainty windows.
- **High**: Full exact knowledge for entire range. No uncertainty.

### Plane Tiers

- **Low**: Fixed annual canon events (full calendar year, always known). Non-annual canon events shown when currently active ("recognized" — full duration revealed). **Generated events never shown at low**, even for the present day.
- **Medium**: Canon for full year (336 days) always. Generated events for short window. Presets: 1d/3d/6d/10d (DC 10/15/20/25).
- **High**: Full knowledge (canon + generated). Presets: 1m/3m/6m/10m (DC 10/15/20/25).

### Prediction Limits by Subsystem

**Moon:**
```
lowDays: 2
mediumMaxDays: 280 (10 months)
highMaxDays: 672 (2 years, bounded by pre-generation window)
```

**Planes:**
```
lowDays: 0 (canon only, no generated prediction)
mediumCanonDays: 336 (one year)
mediumMaxDays: 3360 (10 years for generated)
highMaxDays: 3360
highExactDays: 336 (within this range, high-tier generated predictions are exact)
```

---

## 5. Events Subsystem

### 5.1 Overview

Attaches campaign observances and custom milestones to calendar days. Supports:

- Default source-backed events (e.g., Sharn, Sovereign Host, seasonal sets)
- GM-authored one-off and recurring events
- Source-level filtering and priority ordering
- Rendering in month cells, range listings, and "today/upcoming" summaries

### 5.2 Design Goals

- **Campaign utility first:** event authoring is fast from chat (`!cal add...`)
- **Lore + custom coexistence:** canonical/default event packs can be enabled, disabled, or restored without deleting GM-authored entries
- **Readable UI density:** first event controls the day color, additional events appear as dots and list rows
- **Calendar portability:** event source packs can be scoped by calendar system

### 5.3 Data Model

**Canonical data tables in `calendar.js`:**
- `DEFAULT_EVENTS` — source-keyed event definitions
- `DEFAULT_EVENT_SOURCE_CALENDARS` — optional source→calendar-system allowlist
- `NAMED_COLORS` — color aliases (`emerald`, `onyx`, etc.)

**Event record fields:**
- `name`
- `month` — month number, `"all"`, or normalized month context
- `day` — single day, range `N-M`, or ordinal weekday (`first far`)
- `year` — `null`/missing for recurring; explicit number for one-time
- `color` — hex or named color
- `source` — `null` for user events; key for default packs

**Runtime state:**
- Events stored in `state[state_name].calendar.events`
- Source enablement and ordering in settings (`eventSourceEnabled`, `eventSourcePriority`)
- Presentation settings: `eventsEnabled`, `groupEventsBySource`, `showSourceLabels`

### 5.4 Processing Pipeline

**Ingestion:** Defaults flattened from source maps into a single event array. Day specs normalized via `DaySpec` helpers (numeric, range, ordinal weekday).

**Matching:** `getEventsFor(monthIndex, day, year)` resolves matches per day. `occurrencesInRange(startSerial, endSerial)` expands recurring/yearly rules.

**Source filtering:** Sources can be disabled without deleting records. Source packs can be auto-scoped by calendar system. Rendering sort order: user events → configured priority order → unranked sources.

**Rendering:** Primary event color sets the day-cell background. Secondary events render as compact dots/badges. Intercalary single-day months render as banner rows and still honor event coloring.

### 5.5 Commands

```
!cal add ...                  — smart add (one-time or recurring based on date form)
!cal addmonthly <daySpec> NAME [color]
!cal addyearly <Month> <daySpec> NAME [color]
!cal remove [list|key|series|name fragment]
!cal restore [all] [exact] <name...>
!cal restore key <KEY>
!cal list

!cal source list
!cal source enable <name>
!cal source disable <name>
!cal source up <name>
!cal source down <name>

!cal events add/remove/restore/list   — subcommand dispatcher
```

### 5.6 Implementation Notes

- **Source disable semantics:** Disabling a source removes that source's default event records from the live event list; re-enabling restores from defaults. The design intent ("without deleting underlying records") holds — source data is recoverable — but active runtime records are removed on disable.
- **Storage keys:** Implementation uses `suppressedSources`/`suppressedDefaults` suppression maps alongside `eventSourcePriority`, rather than a simple `eventSourceEnabled` flag as docs originally described.
- **Additional implemented features:** Grouped recurring-series removal, restore-list workflows, and compatibility auto-suppression/restore mechanics are richer than any earlier doc summaries suggested.

---

## 6. Weather Subsystem

### 6.1 Executive Summary

A mechanics-forward, D&D-ready weather engine. Primary outputs per day: **Temperature** (0–10, migrating to −5 to 15), **Wind** (0–5), **Precipitation** (0–5). These convert into gameplay conditions, visibility penalties, difficult terrain, combat/movement impacts, and hazard advisories.

The model combines deterministic season/location baselines with stochastic rolls and continuity nudges for coherent, evolving weather.

### 6.2 Design Goals

- **Mechanics first:** numeric stages map directly to D&D-facing effects
- **Readable at the table:** top-level scales are easy to reference quickly
- **Stable but alive:** weather evolves with continuity, not wild swings
- **Setting-aware fantasy:** planar and manifest-zone overlays integrate with Eberron cosmology
- **GM-operable:** forecasting, reveals, rerolls, lock/history, and location wizard support active campaign use

### 6.3 Temperature Scale

**Active implementation:** −5 to 15 (21 bands, 10°F each)

The generator outputs values on the −5 to 15 band scale, indexing directly into `WEATHER_TEMPERATURE_BANDS_F` and companion rule tables (`WEATHER_COLD_CLOTHING_TIERS`, `WEATHER_HEAT_ARMOR_RULES`, `WEATHER_TEMPERATURE_SYSTEM_RULES`).

| Band Range | Fahrenheit | Risk Level |
|---|---|---|
| −5 | ≤ −46°F | Unholy cold, DC 30, special protection required |
| −4 to −3 | −45°F to −26°F | Severe cold, DC 25, heavy cold-weather clothing |
| −2 to −1 | −25°F to −6°F | High cold risk, DC 20, medium cold-weather clothing |
| 0 to 1 | −5°F to 14°F | Meaningful cold checks, DC 15, light cold-weather clothing |
| 2 to 3 | 15°F to 34°F | Cold checks, DC 10, warm clothing |
| 4 to 6 | 35°F to 64°F | No direct thermal hazard |
| 7 to 9 | 65°F to 94°F | Heat checks, DC 10–15 under compounding factors |
| 10 to 14 | 95°F to 144°F | Escalating heat burden and armor disadvantage |
| 15 | ≥ 145°F | Infernal heat, DC 30, mundane gear insufficient |

> Flavor/mechanics groupings: cold (≤3), cool (4), mild (5–6), warm (7–8), hot (9+)

**Manifest zone temperature effects:** Fernia ±3, Risia ±3, Irian +1, Mabar −1. Planar coterminous/remote: Fernia coterminous +3 / remote −2, Risia coterminous −3 / remote +2.

### 6.4 Wind Scale (0–5)

| Stage | Label | Mechanical Core |
|---|---|---|
| 0 | Calm | None |
| 1 | Breezy | None |
| 2 | Moderate Wind | Fogs and gases dispersed |
| 3 | Strong Winds | Disadvantage on ranged attacks; long-range attacks auto-miss; flying costs +1 ft per ft; open flames extinguished |
| 4 | Gale | Ranged attacks auto-miss; flying speed becomes 0; walking costs +1 ft per ft |
| 5 | Storm | DC 15 Strength check or fall prone; small trees uprooted; severe projectile/wind hazard |

### 6.5 Precipitation Scale (0–5)

| Stage | Sky / Precip Meaning |
|---|---|
| 0 | Clear |
| 1 | Partly cloudy / light atmospheric moisture |
| 2 | Overcast |
| 3 | Active precipitation |
| 4 | Heavy precipitation |
| 5 | Extreme precipitation / deluge-class |

### 6.6 Temperature × Precipitation Type

Precipitation type is derived from temperature zone + precip stage (not precip alone):

- **Temp ≤ 3 (snow zone):** precip 1–2 = `snow_light`; precip 3 = `snow`; precip 4–5 = `blizzard`
- **Temp = 4 (sleet zone):** precip 1–2 = `sleet_light`; precip 3 = `sleet`; precip 4–5 = `ice_storm`
- **Temp ≥ 5 (rain zone):** precip 1–2 = `rain_light`; precip 3 = `rain`; precip 4 = `heavy_rain`; precip 5 = `deluge`

### 6.7 D&D 5e Mechanical Effects

**Visibility tiers** (from fog + precipitation outcome):
- **Tier A:** Lightly Obscured (Perception at disadvantage) — rain, snow, sleet
- **Tier B:** Lightly Obscured; Heavily Obscured beyond 60 ft — heavy rain, ice storm, light fog
- **Tier C:** Lightly Obscured; Heavily Obscured beyond 30 ft — blizzard, deluge, dense fog

**Difficult terrain:** Always true for `sleet`, `ice_storm`, `blizzard`, `deluge`. True for `snow` when accumulation is already present (continuity across days).

**Hazard advisories:** heavy rain (lightning/flash-flood), deluge (extreme flooding), blizzard (whiteout/avalanche/hypothermia), ice storm (falling ice). These are GM adjudication guidance, not auto-resolution.

### 6.8 Data Model

Configuration constants in `calendar.js`:
- `CONFIG_WEATHER_FORECAST_DAYS`, `CONFIG_WEATHER_HISTORY_DAYS`, `CONFIG_WEATHER_SEED_STRENGTH`
- `CONFIG_WEATHER_MECHANICS`, `CONFIG_WEATHER_LABELS`, `CONFIG_WEATHER_FLAVOR`
- `WEATHER_TEMPERATURE_BANDS_F`, `WEATHER_COLD_CLOTHING_TIERS`, `WEATHER_HEAT_ARMOR_RULES`, `WEATHER_TEMPERATURE_SYSTEM_RULES`
- `WEATHER_CLIMATE_BASE`, `WEATHER_GEO_MOD`, `WEATHER_TERRAIN_MOD`, `WEATHER_TOD_ARC`, `WEATHER_TOD_BELL`, `WEATHER_UNCERTAINTY`
- `WEATHER_CLIMATES`, `WEATHER_GEOGRAPHIES`, `WEATHER_TERRAINS_UI`

Runtime state tracks: active location profile, forecast records, locked history, player reveal metadata, wizard staging selections.

### 6.9 Generation Pipeline

1. Resolve location profile
2. Build baseline from climate + geography + terrain tables
3. Roll afternoon `temp/wind/precip` via bell-like opposed dice
4. Apply continuity nudge from prior day (`CONFIG_WEATHER_SEED_STRENGTH`)
5. Derive early morning/morning/afternoon/evening/late night states using deterministic arc + stochastic offset
6. Roll fog by period with persistence/wind logic
7. Apply manifest-zone local modifiers
8. Apply planar-weather shifts/overrides (e.g., coterminous Syrania forces calm/clear)
9. Derive conditions, visibility tier, difficult terrain, mechanics text, hazard notes

### 6.10 Forecast Lifecycle

- Forecast generated forward and retained to configured horizon
- Past weather locks into history up to retention cap
- Location changes: signature-aware stale handling — matching profile records may be resurrected; mismatched records marked stale until regenerated
- Player reveal is upgrade-only
- GM view remains full-fidelity

### 6.11 Specific-Date Reveals

For "what's the weather in the mountains in 6 weeks?" (design intent, partially implemented):
1. GM changes location to mountains
2. GM generates weather to target date (extending rolling window)
3. GM reveals specific date(s) only — not everything in between
4. GM tells players, changes location back
5. No UI noise about data from other locations

### 6.12 Zarantyr Interaction

- Zarantyr full: flat boost to lightning/thunderstorm chance regardless of weather conditions
- "Superstition holds there is a far greater chance of being struck by lightning when Zarantyr is full, and bolts can fall from a clear sky"
- Zarantyr's unique effect is lightning, **not** wind/precipitation bonuses — remove any wind/prec bonus from Zarantyr if present

### 6.13 Commands

```
!cal weather
!cal weather forecast [n]
!cal weather generate
!cal weather history
!cal weather mechanics
!cal weather reroll <serial>
!cal weather lock <serial>
!cal weather event trigger <key>
!cal weather event roll <key>

!cal weather location
!cal weather location climate <key>
!cal weather location geography <key>
!cal weather location terrain <key>
!cal weather location zone <key|none>
```

### 6.14 Implementation Notes

- Additional commands (`history`, `mechanics`, `reroll`, `lock`, `event trigger/roll`) exist in the implementation and are documented above.
- `weather send today` reuses the best already-revealed tier for the current day.
- Legacy aliases (`survival`/`mundane` → medium; `magic`/`magical` → high) exist in implementation. Per code conventions, these should be removed.

---

## 7. Moon Subsystem

### 7.1 Overview

Supports three moon-system variants with deterministic phase behavior, reveal-tier forecasting, and gameplay-facing outputs:

- **Eberron:** 12 moons with lore-linked orbital personalities and Long Shadows interactions
- **Faerûnian:** Selûne as Toril's single moon with Harptos-aligned cycle
- **Gregorian/Earth:** Luna as real-world baseline with standard astronomical cadence

### 7.2 Design Goals

- **Lore fidelity with mechanical traceability:** narrative identity and numerical behavior are both first-class
- **Astronomy-inspired modeling:** phase, crossing, eclipse, and night-light logic depends on explicit orbital proxies
- **Deterministic reproducibility:** seeded calculations remain stable for long campaigns
- **Progressive reveal:** GM/private precision and player/public abstraction can coexist

### 7.3 All-Moon Mechanics Tables

#### Eberron — 12 Moons

| Moon      | Title             | Plane     | Dragonmark          | Synodic Period (days) | Diameter (mi) | Distance (mi) |     Inclination (°) | Eccentricity | Albedo | Variation | Amplitude | Epoch Seed | Epoch Date |
| --------- | ----------------- | --------- | ------------------- | --------------------: | ------------: | ------------: | ------------------: | -----------: | -----: | --------- | --------: | ---------- | ---------- |
| Zarantyr  | The Storm Moon    | Kythri    | Mark of Storm       |                 27.32 |          1250 |        14,300 |               5.145 |       0.0549 |   0.12 | random    |       1.4 | kythri     | 998-01-01  |
| Olarune   | The Sentinel Moon | Lamannia  | Mark of Sentinel    |                  34.0 |          1000 |        18,000 |                0.33 |       0.0288 |   0.22 | random    |       1.7 | lamannia   | 998-01-01  |
| Therendor | The Healer's Moon | Syrania   | Mark of Healing     |                  24.0 |          1100 |        39,000 |                0.03 |       0.0022 |   0.99 | random    |       1.2 | syrania    | 998-01-01  |
| Eyre      | The Anvil         | Fernia    | Mark of Making      |                  21.0 |          1200 |        52,000 |                1.53 |       0.0196 |   0.96 | random    |       1.0 | fernia     | 998-01-01  |
| Dravago   | The Herder's Moon | Risia     | Mark of Handling    |                  42.0 |          2000 |        77,500 | 156.8 (retrograde)  |     0.000016 |   0.76 | random    |       2.1 | risia      | 998-01-01  |
| Nymm      | The Crown         | Daanvi    | Mark of Hospitality |                  28.0 |           900 |        95,000 |                0.20 |       0.0013 |   0.43 | random    |       1.4 | daanvi     | 998-01-01  |
| Lharvion  | The Eye           | Xoriat    | Mark of Detection   |                  30.0 |          1350 |       125,000 |                0.43 |       0.1230 |   0.30 | random    |       1.5 | xoriat     | 998-01-01  |
| Barrakas  | The Lantern       | Irian     | Mark of Finding     |                  22.0 |          1500 |       144,000 |                0.02 |       0.0047 |  1.375 | random    |       1.1 | irian      | 998-01-01  |
| Rhaan     | The Book          | Thelanis  | Mark of Scribing    |                  37.0 |           800 |       168,000 |                4.34 |       0.0013 |   0.32 | random    |       1.9 | thelanis   | 998-01-01  |
| Sypheros  | The Shadow        | Mabar     | Mark of Shadow      |                  67.0 |          1100 |       183,000 |                1.08 |       0.0151 |  0.071 | random    |       3.4 | mabar      | 998-01-01  |
| Aryth     | The Gateway       | Dolurrh   | Mark of Passage     |                  48.0 |          1300 |       195,000 |                7.57 |       0.0283 |  0.275 | random    |       2.4 | dolurrh    | 998-01-01  |
| Vult      | The Warding Moon  | Shavarath | Mark of Warding     |                  56.0 |          1800 |       252,000 |                0.07 |       0.0014 |   0.23 | random    |       2.8 | shavarath  | 998-01-01  |

#### Faerûnian (Toril)

| Moon | Title | Synodic Period | Diameter | Distance | Inclination | Eccentricity | Albedo | Variation | Amplitude | Epoch Seed | Epoch Date |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|---|
| Selûne | The Moonmaiden | 30.4375 days | 2,000 mi | 183,000 mi | 5.1° | 0.054 | 0.25 | random | 1.5 | selune | 1372-01-01 |

#### Gregorian / Earth

| Moon | Title | Synodic Period | Diameter | Distance | Inclination | Eccentricity | Albedo | Variation | Amplitude | Epoch Seed | Epoch Date |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|---|
| Luna | The Moon | 29.53059 days | 2,159 mi | 238,855 mi | 5.14° | 0.0549 | 0.12 | random | 0.5 | luna | 2021-01-28 |

### 7.4 Reference Moon Mapping (Eberron)

Each Eberron moon mapped to a real Solar System moon. Inclination, eccentricity, and albedo are taken from the reference as-is. All 12 reference moons confirmed — see `design/moon-reference-selection.md` for full analysis and rationale.

**All references confirmed:**

| Eberron Moon | Reference Analog | Host Planet | Inclination (°) | Eccentricity | Albedo | Notes |
|---|---|---|---:|---:|---:|---|
| Zarantyr | Luna | Earth | 5.145 | 0.0549 | 0.12 | |
| Olarune | Titan | Saturn | 0.33 | 0.0288 | 0.22 | |
| Therendor | **Dione** | Saturn | **0.03** | **0.0022** | **0.99** | Changed from Europa; co-planar with Barrakas |
| Eyre | **Mimas** | Saturn | **1.53** | **0.0196** | **0.96** | Changed from Hyperion → Elara → Mimas; mythological: slain by Hephaestus |
| Dravago | **Triton** | Neptune | **156.8†** | **0.000016** | **0.76** | Retrograde; always moving opposite to every other moon |
| Nymm | Ganymede | Jupiter | 0.20 | 0.0013 | 0.43 | |
| Lharvion | **Hyperion** | Saturn | **0.43** | **0.1230** | **0.30** | Changed from Nereid; ecc ceiling 0.1466. God of Observation. |
| Barrakas | Enceladus ×1 | Saturn | 0.02 | 0.0047 | **1.375** | No multiplier; ×7 option (9.625, 11.73 lux) documented in design/moon-reference-selection.md |
| Rhaan | Miranda | Uranus | 4.34 | 0.0013 | 0.32 | |
| Sypheros | **Phobos** | Mars | **1.08** | **0.0151** | **0.071** | Doomed inward spiral (inside Roche limit); entropy/Mabar |
| Aryth | Iapetus | Saturn | 7.57 | 0.0283 | **0.275** | Albedo = averaged (not tidally locked) |
| Vult | Oberon | Uranus | 0.07 | 0.0014 | 0.23 | |

† Triton is retrograde (156.8°) = 23.2° effective ecliptic deviation.

**Reference table should include:** Eberron moon, reference moon, raw period, scaled period (to 336-day year), integer multiplier, final synodic period. This extended table is an open task.

### 7.5 Lore-Driven Constraints on Reference Selection

- **Barrakas and Therendor** share similar orbits (lore) → more frequent eclipses of Barrakas by Therendor. Therendor/Dione (0.03°) and Barrakas/Enceladus (0.02°) are now co-planar. Add weak anti-phase coupling so Therendor full aligns more often with Barrakas new, without hard phase lock.
- **Dravago** "typically keeps at a distance from other moons" → resolved as retrograde motion (Triton): Dravago literally moves opposite to every other moon, always departing. Effective ecliptic deviation 23.2° (second in system). The strict "highest deviation" reading was over-specified; the behavioral retrograde character is the correct interpretation.
- **Lharvion** — do NOT clamp eccentricity vs. reference. If the reference moon's eccentricity causes orbit overlap, select a different reference rather than modifying the parameter. Resolved: Hyperion (0.1230) stays within the hard ceiling of 0.1466.

### 7.6 Orbital Mechanics Summary

- Each moon has: synodic period, semi-major axis, eccentricity, inclination, ascending node
- Periods derived from reference moon scaled to Eberron's 336-day year, then multiplied by an integer factor to avoid overly short synodic periods
- Random walk variation: `shape: 'random'`, amplitude ~5% of period, unified across all moons (no special cases)

### 7.7 Phase and Visibility Pipeline

For each moon/day:
1. Compute normalized phase position
2. Derive illuminated fraction and phase label
3. Classify visibility window
4. Annotate special conditions (full/new, system-specific notes)
5. Eclipse/notable overlap checks
6. Moon-crossing proximity signals
7. Aggregate night-light intensity
8. Tide emphasis (Eberron-specific weighting)

**Phase thresholds:** Full ≥ 98% illumination. New ≤ 2% illumination.

### 7.8 Eclipse System

- **Solar eclipses:** moon passes between Eberron and sun
- **Lunar eclipses/occultations:** moon passes behind Eberron's shadow or behind another moon
- Eclipse timing currently uses four time blocks (nighttime 0–6, morning 6–12, afternoon 12–18, evening 18–24). The eclipse overhaul task in Design Tasks.md will align these to the five weather buckets and fix multi-day duplicate reporting.

### 7.9 Moon Mini-Calendar Display

- No cell shading (reserved for future use)
- Yellow dot if any moon is full on that day
- Black dot if at least one moon is new on that day
- No moon monikers/titles in tooltips

### 7.10 Aryth and Manifest Zones

Aryth "has a similar effect on manifest zones as Zarantyr has on tides."
- Aryth full → GM reminder: "Aryth is full. Consider a manifest zone."
- Store flag in state if any manifest zone was activated during Aryth's full
- Date advances past Aryth full → warning: "Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z"

### 7.11 Commands

```
!cal moon
!cal moon on <dateSpec>
!cal moon send [low|medium|high] [range option]
!cal moon sky [time]              — sky visibility at time of day (dawn/noon/dusk/midnight)
!cal moon lore [moonName]         — moon lore output
!cal moon seed <word>             — set system moon seed
!cal moon full <MoonName> <dateSpec>  — anchor full phase to date
!cal moon new <MoonName> <dateSpec>   — anchor new phase to date
!cal moon reset [<MoonName>]      — clear GM phase anchors
```

### 7.12 Reference Moon Candidate Pool (Design Appendix)

Full candidate pool for future re-tuning and replacement analog research. The active runtime mapping uses only the 12-moon table above.

| Candidate | Host Planet | Inclination (°) | Eccentricity | Albedo | Notes |
|---|---|---:|---:|---:|---|
| Luna | Earth | 5.145 | 0.0549 | 0.12 | Baseline terrestrial |
| Phobos | Mars | 1.08 | 0.0151 | 0.07 | Inner small irregular |
| Deimos | Mars | 1.79 | 0.0002 | 0.08 | Outer small irregular |
| Io | Jupiter | 0.05 | 0.0041 | 0.63 | Volcanic Galilean |
| Europa | Jupiter | 0.47 | 0.0094 | 0.67 | Ice shell/ocean analog |
| Ganymede | Jupiter | 0.20 | 0.0013 | 0.43 | Largest moon |
| Callisto | Jupiter | 0.28 | 0.0074 | 0.20 | Heavily cratered |
| Amalthea | Jupiter | 0.37 | 0.0032 | 0.09 | Inner Jovian |
| Himalia | Jupiter | 27.5 | 0.16 | 0.05 | Irregular prograde |
| Pasiphae | Jupiter | 151.4 | 0.38 | 0.04 | Irregular retrograde |
| Sinope | Jupiter | 158.1 | 0.25 | 0.04 | Irregular retrograde |
| Mimas | Saturn | 1.53 | 0.0196 | 0.96 | Mid-sized icy; Herschel crater; hidden internal ocean (2024) |
| Prometheus | Saturn | 0.01 | 0.0022 | ~0.60 | Shepherd moon; shapes F ring on every orbit; name: fire-stealer, craft patron |
| Enceladus | Saturn | 0.02 | 0.0047 | 1.375 | Bright, cryovolcanic |
| Tethys | Saturn | 1.09 | 0.0001 | 1.229 | Very circular orbit |
| Dione | Saturn | 0.03 | 0.0022 | 0.99 | Mid-sized icy |
| Rhea | Saturn | 0.35 | 0.0010 | 0.95 | Mid-sized icy |
| Titan | Saturn | 0.33 | 0.0288 | 0.22 | Atmosphere-rich |
| Hyperion | Saturn | 0.43 | 0.1230 | 0.30 | Chaotic tumbler |
| Iapetus | Saturn | 7.57 | 0.0283 | 0.05–0.50 | Two-tone surface |
| Phoebe | Saturn | 175.3 | 0.1635 | 0.06 | Retrograde irregular |
| Janus | Saturn | 0.16 | 0.0068 | 0.71 | Co-orbital with Epimetheus |
| Miranda | Uranus | 4.34 | 0.0013 | 0.32 | Current Rhaan analog |
| Ariel | Uranus | 0.04 | 0.0012 | 0.56 | Major Uranian |
| Umbriel | Uranus | 0.13 | 0.0039 | 0.26 | Major Uranian |
| Titania | Uranus | 0.08 | 0.0011 | 0.39 | Major Uranian |
| Oberon | Uranus | 0.07 | 0.0014 | 0.23 | Current Vult analog |
| Puck | Uranus | 0.32 | 0.0001 | 0.11 | Inner Uranian |
| Sycorax | Uranus | 159.4 | 0.52 | 0.07 | Irregular retrograde |
| Triton | Neptune | 156.8 | 0.00002 | 0.76 | Retrograde captured |
| Nereid | Neptune | 7.23 | 0.7507 | 0.155 | Current Lharvion analog |
| Proteus | Neptune | 0.08 | 0.0005 | 0.10 | Inner major |
| Larissa | Neptune | 0.20 | 0.0014 | 0.09 | Inner Neptunian |
| Halimede | Neptune | 134.1 | 0.57 | 0.08 | Irregular retrograde |
| Charon | Pluto | 0.00 | 0.0002 | 0.35 | Dwarf-planet satellite |
| Nix | Pluto | 0.13 | 0.0020 | 0.56 | Dwarf-planet satellite |
| Hydra | Pluto | 0.24 | 0.0059 | 0.83 | Dwarf-planet satellite |

### 7.13 Implementation Notes

- `!cal moon sky [time]`, `!cal moon lore`, `!cal moon seed`, and GM phase anchoring commands (`full`/`new`/`reset`) are implemented but were not in earlier design doc drafts. They are documented in the commands list above.
- Non-GM `!cal moon on <dateSpec>` is constrained by reveal horizon.
- Moon crossing proximity output is modeled through the eclipse/conjunction engine but does not currently have a dedicated standalone command or named report.

---

## 8. Planar Subsystem

### 8.1 Overview

13 planes of existence, each with:
- **Canonical (Traditional) movements:** fixed phases or calculated multi-year cycles from published material
- **Generated (Off-cycle) movements:** deterministic, seed-based generated events

These two event types are categorically distinct. Generated events are gated behind higher knowledge tiers.

**Traditional non-annual anchor mode:** planes with any non-annual traditional cycle component should expose `traditionalAnchorMode` as `random-seed` or `gm-anchored` (annual-only traditional planes leave it unset).
### 8.2 Phase Vocabulary

The planar phase ring:
1. **Coterminous** — plane overlaps with Eberron
2. **Waning** — receding from coterminous
3. **Remote** — plane is distant from Eberron
4. **Waxing** — approaching coterminous again

For cyclic planes:
- `orbitDays = orbitYears × daysPerYear`
- `coterminousDays` and `remoteDays` from explicit day values or from `coterminousYears`/`remoteYears`
- `transitionDays = (orbitDays − coterminousDays − remoteDays) / 2`

### 8.3 Canonical Plane Data

#### Daanvi — The Perfect Order
- Type: cyclic
- Orbit: 400 years
- Windows: 100 years coterminous, 100 years remote
- Transitions: 100 years waning + 100 years waxing
- Pattern: 100 coterminous → 100 blank → 100 remote → 100 blank
- Anchor: year 800, coterminous, seed-anchor enabled

#### Dal Quor — The Region of Dreams
- Type: fixed
- Fixed phase: remote (permanently sealed — no generated events)

#### Dolurrh — The Realm of the Dead
- Type: cyclic
- Orbit: 100 years; Windows: 1 year coterminous, 1 year remote
- Transitions: 49 years waning + 49 years waxing
- Anchor: year 950, coterminous, seed-anchor enabled

#### Fernia — The Sea of Fire
- Type: cyclic
- Orbit: 5 years; Windows: 28 days coterminous, 28 days remote
- Transitions: 812 days waning + 812 days waxing (336-day year)
- Anchor: year 998, month 7, coterminous, seed-anchor enabled

#### Irian — The Eternal Dawn
- Type: cyclic
- Orbit: 3 years; Windows: 10 days coterminous, 10 days remote
- Transitions: 494 days waning + 494 days waxing
- Anchor: year 998, Eyre 1, coterminous, seed-anchor enabled
- Special: floating deterministic start day per orbit (bounded day 1–19)

#### Kythri — The Churning Chaos
- Type: fixed; Fixed phase: waning (no canonical coterminous/remote schedule)

#### Lamannia — The Twilight Forest
- Type: cyclic
- Orbit: 1 year; Windows: 7 days coterminous, 7 days remote
- Transitions: 161 days waning + 161 days waxing
- Anchor: year 998, Nymm 24, coterminous

#### Mabar — The Endless Night
- Type: cyclic (special dual model)
- Base orbit: 1 year; Coterminous: 4 calendar days (3 nights) around Long Shadows
- Special remote: 5-day window every 5 years around summer solstice
- Anchor: year 998, Vult 26, coterminous
- Special fields: `remoteOrbitYears: 5`, `remoteDaysSpecial: 5`

#### Risia — The Plain of Ice
- Type: cyclic
- Orbit: 5 years; Windows: 28 days coterminous, 28 days remote
- Transitions: 812 days waning + 812 days waxing
- Anchor: year 996, month 1, coterminous, seed-anchor enabled
- Linked to Fernia for seeded opposition behavior

#### Shavarath — The Eternal Battleground
- Type: cyclic
- Orbit: 36 years; Windows: 1 year coterminous, 1 year remote
- Transitions: 5,726 days waning + 5,726 days waxing
- Anchor: year 990, coterminous, seed-anchor enabled

#### Syrania — The Azure Sky
- Type: cyclic
- Orbit: 10 years; Windows: 1 day coterminous, 1 day remote
- Transitions: 1,679 days waning + 1,679 days waxing
- Anchor: year 998, Rhaan 9, coterminous, seed-anchor enabled
- Special: coterminous generated shift enforces clear/calm weather override

#### Thelanis — The Faerie Court
- Type: cyclic
- Orbit: 225 years; Windows: 7 years coterminous, 7 years remote
- Transitions: 35,952 days waning + 35,952 days waxing
- Anchor: year 800, coterminous, seed-anchor enabled

#### Xoriat — The Realm of Madness
- Type: fixed; Fixed phase: remote

### 8.4 Generated (Off-Cycle) Events

Deterministic, seed-based generated events checked per plane/day.

**Global rules:**
- Disabled entirely if `offCyclePlanes` is false (independent toggle — open task)
- Never generated for sealed planes (Dal Quor)
- Suppressed when a cyclic plane is already canon-active (coterminous/remote)
- Suppressed by GM overrides/anchors or explicit suppressions
- Can be suppressed near GM custom events to avoid stacking

**Mechanism classes:** `standard`, `linked`, `moontied`, `hybrid_moon`, `cooldown`, `sealed`

#### Generated Event Profiles by Plane

| Plane | Mechanism | Dice | Expected Freq | Duration | Phase |
|---|---|---|---:|---|---|
| Shavarath | standard | d20 (14–20) + d12 (12) | ~9.8/year | 1 day | 100% coterminous |
| Daanvi | cooldown | d20 (20) → d10 (1–5 remote, 6–10 cot) | ~16.8/year | 10 days | 50/50 |
| Dolurrh | moontied (Aryth) | Aryth full/new + d20 (11–20) | ~7.0/year | 1 day | full→cot; new→remote |
| Kythri | standard | d100 (100 cot / 1 remote) | ~6.7/year | d12 | mostly cot |
| Lamannia | hybrid_moon (Olarune) | Moon-qualified + fallback d100 | ~4.2/year | d3 | moon/dice-driven |
| Mabar | standard | d20 (1) + d4 (1) | ~4.2/year | 1 day | 75% cot, 25% remote |
| Fernia | linked with Risia | d20 (20) → d10 (10 cot, 1 remote) | ~3.4/year | d3 | phase from d10 |
| Risia | linked with Fernia | d20 (1) → d10 (10 cot, 1 remote) | ~3.4/year | d3 | phase from d10 |
| Thelanis | standard | d20 (20) + d12 (12 cot / 1 remote) | ~2.8/year | 50/50: 3d or 7d | mostly cot |
| Irian | standard | d4 (4) + d4 (4) + d20 (20 cot / 1 remote) | ~2.1/year | d3 | from d20 |
| Xoriat | standard | d100 (1) + d4 (1) | ~0.84/year | d20 | 100% remote |
| Syrania | standard | d100 (100) + d4 (4) + d8 (8 cot / 1 remote) | ~0.21/year | 1 day | mostly cot |
| Dal Quor | sealed | — | 0 | — | — |

**Mabar note:** Coterminous generated events are night-only; remote generated events are day-only.
**Daanvi balancing act:** Post-event 10-day alternation pressure can force opposite phase based on day-weighted d10 threshold.

### 8.5 Plane Panel Display

- Green bubble = Coterminous
- Red bubble = Remote
- Up/down arrow for waxing/waning
- Highlight ranges should fill ALL days in a period, not just start/end endpoints

### 8.6 Commands

```
!cal planes
!cal planes on <dateSpec>
!cal planes send [low|medium|high] [range]
!cal planes set <name> <phase> [days]
!cal planes clear [<name>]
!cal planes anchor <name> <phase> <dateSpec>
!cal planes seed <name> <year|clear>
!cal planes suppress <name> [dateSpec]
```

Preset send ranges:
- **Medium:** 1d (DC 10), 3d (DC 15), 6d (DC 20), 10d (DC 25)
- **High:** 1m/28d (DC 10), 3m/84d (DC 15), 6m/168d (DC 20), 10m/280d (DC 25)

Custom ranges also accepted: `!cal planes send high 3m`, `!cal planes send medium 6d`

### 8.7 Implementation Notes

- `!cal planes send` supports both day-based and month-based ranges.
- Player uncertainty windows and exactness thresholds for generated predictions (especially at high tier) are more detailed in implementation than earlier doc descriptions.
- GM custom-event suppression is registered as custom events used by generated-event suppression logic.

---

## 9. Nighttime Lighting System

### 9.1 Photometry

Based on real-world photometry scaled to Eberron's 12-moon sky.

**Lux thresholds:**
| Lux Range | D&D Condition |
|---|---|
| ≥ 1.0 lux | Bright light (no vision restrictions) |
| 0.3–1.0 lux | Dim light (can fight, Perception at disadvantage) |
| 0.03–0.3 lux | Faint dim light (hard to see detail) |
| < 0.03 lux | Darkness (blind without darkvision) |

*Basis: 1 lux ≈ candle at 1 meter ≈ D&D 5-ft bright light threshold.*

**Shadow qualifier:** ~10% of open sky light under canopy/overhang.

### 9.2 Weather Integration

Cloud cover multipliers applied to moonlight:
| Sky Condition | Multiplier |
|---|---|
| Clear | ×1.0 |
| Partly cloudy | ×0.70 |
| Overcast | ×0.35 |
| Storm / precipitation | ×0.15 |

### 9.3 Key Insight

Eberron is rarely dark. Zarantyr full alone = ~10.3 lux (40× Earth's full moon). True darkness requires few/new moons AND heavy weather simultaneously.

---

## 10. Ring of Siberys

- Single band of dragonshards stretching over the equator (inclination 0°)
- Inner edge: 7,000 km (just above atmosphere)
- Outer edge: 12,000 km (inside Zarantyr's orbit at 14,300 km)
- Width: 5,000 km, Thickness: 10 meters
- Albedo: 0.50 (Saturn B-ring average)
- "Stands out even in the light of day" — visible in daytime, contributes to nighttime illumination
- Contributes ~0.01 lux baseline even with all moons new

> TODO: Verify equatorial placement (inclination 0°) and "stands out in daylight" presentation in script.

---

## 11. Manifest Zone System

### 11.1 Design

Manifest zones are **parallel to weather location** — set separately, cleared automatically on location change. Not part of the weather forecast; effects always visible when active.

### 11.2 Interface

Below "Set Location" button: "Set Manifest Zone" button.

Opens a 2-column table:
- Column A: Zone names (13 planes + "None" at top)
- Column B: Toggle buttons ("On" / "Off")

Multiple zones can be active simultaneously:
- Active zones: bold text, "Off" button
- Inactive zones: faint italic text, "On" button

### 11.3 Behavior

- Location change → all manifest zones cleared. Confirmation message: "X, Y, Z Manifest Zone(s) cleared."
- Active manifest zones affect weather/mechanics (e.g., Fernia zone = temperature shift, Risia zone = temperature shift)
- Effects shown in "Today" view alongside weather, moons, planar state
- No forecasting for manifest zones — always-visible when active
- Weather-modifying manifest zones: Fernia (+3 temp), Risia (−3 temp), Irian (+1 temp), Mabar (−1 temp), Lamannia (+1 precip), Syrania (−1 wind, −1 precip), Kythri (chaotic swings). All others (Daanvi, Dolurrh, Shavarath, Thelanis, Xoriat, Dal Quor) have no weather shift.

### 11.4 Aryth Integration

See [Section 7.10](#710-aryth-and-manifest-zones).

---

## 12. Interface and Navigation

### 12.1 Entry Point

`!cal` → month mini-calendar + date headline + subsystem highlights.

### 12.2 GM Button Bar

```
Row 1: ⏮ Back  |  ⏭ Forward  |  📣 Send
Row 2: 📋 Today  |  🌤 Weather  |  🌙 Moons  |  🌀 Planes
Row 3: ⚙ Admin
```

`!cal today` → deep-dive all subsystems for today (GM-only by default)

### 12.3 Player View

Players should see:
- Basic calendar view (same layout as GM)
- Buttons to access each subsystem view (information tier-limited per reveal)
- "Today" view listing everything for the day at their knowledge tier

### 12.4 DC Hint Buttons

Moon and plane send buttons display DC hints:

```
Moon / Planes Send High:   1m  3m  6m  10m
Moon Send Medium:          1m (DC 10)  3m (DC 15)  6m (DC 20)  10m (DC 25)
Planes Send Medium:        1d (DC 10)  3d (DC 15)  6d (DC 20)  10d (DC 25)
```

### 12.5 CLI Flexibility

Buttons issue CLI commands, but GMs can type custom values directly:
```
!cal moon send medium 56d      — custom 56-day medium reveal
!cal planes send high 3m       — 3-month high reveal
```

Valid range suffixes: `Nd`, `Nw`, `Nm` or plain number (days). Date specs valid for targeted reveals.

---

## 13. Code Conventions

### Naming

- Tiers: `low` / `medium` / `high`
- Source labels: "Common Knowledge" / "Skilled Forecast" / "Expert Forecast"
- State reset: use "reset" not "clear" for clearing state

### No Legacy Aliases

The canonical tier names are `low`, `medium`, `high`. Legacy aliases (`mundane` → `medium`, `magical` → `high`) still exist as migration shims in moon and plane state readers. These can be removed once no saved state uses the old names.

### Date Parsing

Smart date parsing applied uniformly:
- One number → next occurrence of that day
- Two numbers → month + day (next occurrence if no year)
- Three numbers → month + day + year

### File Structure

Single file: `calendar.js` (~13,400 lines). All state stored in Roll20's `state` object.

---

## 14. Development History

### Major Development Arcs (chronological)

1. **Axial tilt and moon inclinations** — Real orbital mechanics for all 12 moons
2. **Moon analog matching** — Each moon mapped to a real Solar System moon by lore characteristics
3. **Synodic periods and eclipse geometry** — Real orbital math, eclipse prediction
4. **Random variation unification** — All moons use random walk; Nymm/Lharvion no longer special cases
5. **Ring of Siberys simplification** — Single band scaled inside Zarantyr's orbit
6. **Nighttime lighting** — Photometry-based lux calculation with weather integration
7. **Three-tier knowledge system** — low/medium/high unified across all subsystems; replaces mundane/magical/abridged
8. **Interface redesign** — Calendar as entry point (replacing old Hub); Today/Upcoming views added
9. **Daanvi probability correction** — 50/50 coterminous/remote split (was 2/3); d20 gate for 5%/day frequency
10. **Manifest zone design** — Parallel to location system, Aryth reminder integration
11. **Temperature scale expansion** — Expanded band table (−5 to 15) added to script; migration from 0–10 in progress
12. **Documentation consolidation** — All subsystem design docs merged into this file
