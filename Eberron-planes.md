# Eberron Planar System Reference (Extracted from `calendar.js`)

This document is a code-level extraction of **all planar-system behavior currently implemented** in the calendar script, including:

- Canonical cycle data for each plane.
- Coterminous / waning / remote / waxing structures.
- Special-case planar traditions (Mabar Long Shadows, Irian floating starts, linked planes, etc.).
- Generated/off-cycle (anomalous) planar events.
- Planar weather + manifest-zone integration.
- GM/player forecast controls and planar commands.

---

## 1) Global planar settings and toggles

Planar subsystem defaults in the script:

- `planesEnabled: true` (master planar subsystem toggle).
- `offCyclePlanes: true` (generated/anomalous off-cycle movement on by default).
- `planesDisplayMode: 'calendar'` (calendar/list/both display modes).

The script also auto-toggles planar availability based on whether the calendar system is Eberron (while preserving GM manual overrides after first set).  

---

## 2) Core phase model

The canonical phase ring is:

1. **coterminous**
2. **waning**
3. **remote**
4. **waxing**

For cyclic planes:

- Orbit size is derived from `orbitYears * daysPerYear`.
- If explicit `coterminousDays`/`remoteDays` are missing, they are derived from `coterminousYears`/`remoteYears`.
- Transition windows are computed as:
  - `transition = (orbit - coterminous - remote) / 2`.

For fixed planes:

- The script returns `fixedPhase` directly (except where generated anomalies temporarily override transition states).

Anchor priority in phase calculation:

1. GM anchor override (`!cal planes anchor ...`).
2. Plane default anchor (`anchorYear`, optional month/day).
3. Seed-derived anchor offset (for `seedAnchor: true`, optionally pinned with `!cal planes seed ...`).

---

## 3) Canonical plane data (all 13)

## 3.1 Daanvi — *The Perfect Order*

- Type: `cyclic`
- Orbit: 400 years
- Canon window model: 100-year coterminous, 100-year remote
- Anchor: 800, coterminous (`seedAnchor: true`)
- Associated moon: Nymm
- Notes/effects: century-scale order-related lore effects; no strong universal obvious effects.

## 3.2 Dal Quor — *The Region of Dreams*

- Type: `fixed`
- Fixed phase: `remote`
- Associated moon: Crya
- Marked as permanently remote in note text (Quori/Xen’drik backstory).
- No natural manifest zones; reachable by dreams.
- Also hard-sealed from generated anomalies.

## 3.3 Dolurrh — *The Realm of the Dead*

- Type: `cyclic`
- Orbit: 100 years
- Canon windows: 1-year coterminous + 1-year remote
- Anchor: 950 coterminous (`seedAnchor: true`)
- Associated moon: Aryth
- Note includes additional shorter moon-tied behavior + TODO for deeper Aryth coupling.

## 3.4 Fernia — *The Sea of Fire*

- Type: `cyclic`
- Orbit: 5 years
- Windows: 28d coterminous, 28d remote
- Anchor: 998 coterminous, month 7 (`seedAnchor: true`)
- Season hint: midsummer
- Associated moon: Eyre
- Linked opposition pairing with Risia is represented elsewhere (`linkedTo` on Risia profile).

## 3.5 Irian — *The Eternal Dawn*

- Type: `cyclic`
- Orbit: 3 years
- Windows: 10d coterminous, 10d remote
- Anchor: 998 coterminous, Eyre 1 (`seedAnchor: true`)
- `floatingStartDay: { min:1, max:19 }` enabled (start date drifts per orbit deterministically)
- Season hint: spring
- Associated moon: Barrakas

## 3.6 Kythri — *The Churning Chaos*

- Type: `fixed`
- Fixed phase: `waning`
- Associated moon: Zarantyr
- Notes explicitly call coterminous/remote unpredictability and minimal global effects.

## 3.7 Lamannia — *The Twilight Forest*

- Type: `cyclic`
- Orbit: 1 year
- Windows: 7d coterminous, 7d remote
- Anchor: 998 coterminous, Nymm 24
- Season hint: summer solstice
- Associated moon: Olarune

## 3.8 Mabar — *The Endless Night*

- Type: `cyclic`
- Base orbit: 1 year
- Canon coterminous window: 4 calendar days around winter solstice (Long Shadows)
- Special remote model: every 5 years, 5-day remote window around summer solstice
- Anchor: 998 coterminous, Vult 26
- Season hints include winter solstice + remote summer-solstice hint
- Associated moon: Sypheros
- Uses dedicated special-case logic in `getPlanarState`.

## 3.9 Risia — *The Plain of Ice*

- Type: `cyclic`
- Orbit: 5 years
- Windows: 28d coterminous, 28d remote
- Anchor: 996 coterminous, month 1 (`seedAnchor: true`)
- `linkedTo: 'Fernia'` for seeded anchor pairing behavior
- Season hint: midwinter
- Associated moon: Dravago
- Notes explicitly state opposite timing to Fernia.

## 3.10 Shavarath — *The Eternal Battleground*

- Type: `cyclic`
- Orbit: 36 years
- Windows: 1-year coterminous, 1-year remote
- Anchor: 990 coterminous (`seedAnchor: true`)
- Associated moon: Vult
- Notes include frequent single-day coterminous spikes outside long cycles.

## 3.11 Syrania — *The Azure Sky*

- Type: `cyclic`
- Orbit: 10 years
- Windows: 1d coterminous, 1d remote
- Anchor: 998 coterminous, Rhaan 9 (`seedAnchor: true`)
- Associated moon: Therendor
- Boldrei’s Feast timing is encoded in note text.

## 3.12 Thelanis — *The Faerie Court*

- Type: `cyclic`
- Orbit: 225 years
- Windows: 7-year coterminous, 7-year remote
- Anchor: 800 coterminous (`seedAnchor: true`)
- Associated moon: Rhaan
- Notes include cycle uncertainty/disruption lore.

## 3.13 Xoriat — *The Realm of Madness*

- Type: `fixed`
- Fixed phase: `remote`
- Associated moon: Lharvion
- Notes reference Gatekeeper constraints and unpredictability.

---

## 4) Special canonical mechanics / traditions

## 4.1 Mabar dual-cycle special case

In addition to its annual Long Shadows coterminous period, Mabar has a separate **5-year remote cycle** around summer solstice (`remoteOrbitYears`, `remoteDaysSpecial`) that can override transition phases in the calculator.

## 4.2 Irian floating start days

Irian uses deterministic per-orbit rolling for coterminous/remote start days within a bounded day range (`1..19`), using seed + orbit number and stored floating-day state.

## 4.3 Seed-anchored timelines

Many cyclic planes use `seedAnchor: true`:

- Campaign epoch seed shifts anchor timing deterministically.
- `!cal planes seed <name> <year>` allows explicit anchor-year pinning.
- `linkedTo` lets one plane derive seed offset keying from another plane’s naming relationship.

## 4.4 Notable-today filtering rules

Daily highlight output intentionally suppresses:

- Fixed planes (always static).
- Very long phases (>1 calendar year).

It emphasizes active coterminous/remote phases and near-term transitions (<=3 days).

---

## 5) Generated/off-cycle planar events (anomalous movements)

Generated anomalies are deterministic (seed + plane + date), low-storage, and designed to preserve canonical cadence:

- Dal Quor is sealed (`GENERATED_SEALED`).
- Generated shifts generally apply during waning/waxing (transition) for cyclic planes.
- GM overrides/anchors suppress generated shifts for that plane.
- Optional per-event suppression is supported.
- GM custom planar events can suppress nearby generated events to avoid stacking.
- Canon active coterminous/remote windows suppress generated events for cyclic planes.
- Global toggle: `offCyclePlanes` can disable all generated anomalies.

Supported generation mechanisms:

- `standard`
- `linked` (paired selector behavior)
- `moontied`
- `cooldown`
- `hybrid_moon`
- `sealed`

### 5.1 Full generated profile set

- **Shavarath**: standard; high-frequency single-day battle spikes; 100% coterminous.
- **Lamannia**: hybrid moon model (Olarune full/new weighting + fallback dice).
- **Fernia**: linked pair with Risia (shared selector die).
- **Risia**: linked pair with Fernia.
- **Thelanis**: standard; story-number durations (3 or 7 days).
- **Irian**: standard; short surges.
- **Mabar**: standard; strong coterminous bias; phase note includes day/night context.
- **Dolurrh**: moon-tied to Aryth (full/new drive phase direction).
- **Daanvi**: cooldown model with balancing-act alternation.
- **Kythri**: standard; high-chaos cadence.
- **Xoriat**: standard; rare remote-only style via phase bias.
- **Syrania**: standard; includes weather override forcing calm/clear style when coterminous.
- **Dal Quor**: sealed, no generation.
- `__default`: generic fallback profile.

---

## 6) Planar effects integration

## 6.1 Active planar effect API

`getActivePlanarEffects(serial)` returns active coterminous/remote entries with plane, title, phase, effect text, and full state object.

## 6.2 Weather coupling from planar phases

Active planar weather shifts include:

- Fernia: +2 temp coterminous / -1 temp remote
- Risia: -2 temp coterminous / +1 temp remote
- Syrania: -1 precip, -1 wind coterminous / +1 precip remote
- Mabar: -1 temp coterminous
- Irian: +1 temp coterminous
- Lamannia: +1 precip coterminous
- Shavarath: +1 wind coterminous

These are layered with manifest-zone effects.

## 6.3 Manifest zones in location/weather wizard

Weather location wizard offers plane-themed manifest zones:

- Direct weather modifiers: Fernia, Risia, Irian, Mabar, Lamannia, Syrania, Kythri (chaotic), Shavarath.
- Flavor/no direct weather modifier entries: Daanvi, Dolurrh, Thelanis, Xoriat, Dal Quor.

---

## 7) Forecast knowledge model (players vs GM)

Planar reveal settings include:

- Tiers: `low`, `medium`, `high`.
- Prediction windows and caps (`PLANE_PREDICTION_LIMITS`), including exactness window for high-tier generated forecasts.
- Preset ranges:
  - Medium generated presets: 1d, 3d, 6d, 10d.
  - High presets: 1m, 3m, 6m, 10m.
- Range parser supports d/w/m/y suffixes and legacy year aliases.
- GM lookahead for generated model: 1680 days (5 Eberron years).

---

## 8) Command surface (planar)

Player-facing core:

- `!cal planes`
- `!cal planes on <dateSpec>`
- `!cal planes upcoming [span]`

GM controls:

- `!cal planes set <name> <phase> [days]` (force override)
- `!cal planes clear [<name>]` (clear overrides/anchors)
- `!cal planes anchor <name> <phase> <dateSpec>`
- `!cal planes seed <name> <year|clear>` (seed-anchor override)
- `!cal planes send [low|medium|high] [range]` (broadcast forecast tier/horizon)
- `!cal planes suppress <name> [dateSpec]` (suppress specific generated event)

---

## 9) UI/state encoding details

- Phase labels are mapped in `PLANE_PHASE_LABELS`.
- Two `PLANE_PHASE_EMOJI` objects exist in code; the latter mapping is the effective one at runtime due to redeclaration order.
- Planar panel and active-effects panel include coterminous/remote highlights, next-transition countdowns, and generated-event indicators.

