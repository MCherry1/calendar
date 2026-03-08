# Alternate Planes Subsystem Design White Paper

## 1) Purpose and design intent

This document defines the **full planar timing model** used by the calendar system, including:

- the **Traditional Planar Movements** (canonical/canon cycles), and
- the **Generated Planar Movements** (deterministic off-cycle anomalies).

The intent is to preserve lore-anchored predictability while supporting statistically grounded, seed-deterministic variability suitable for long-running campaign simulation and forecasting.

---

## 2) Phase vocabulary and movement model

The planar phase ring is:

1. **Coterminous**
2. **Waning**
3. **Remote**
4. **Waxing**

For cyclic planes, the engine computes:

- `orbitDays = orbitYears * daysPerYear`
- `coterminousDays` and `remoteDays` from explicit day values, or from `coterminousYears` / `remoteYears`
- `transitionDays = (orbitDays - coterminousDays - remoteDays) / 2`

That creates the full cadence pattern:

- coterminous block,
- transition (“blank”/waning) block,
- remote block,
- transition (“blank”/waxing) block.

Example (Daanvi): 100 years coterminous → 100 years blank → 100 years remote → 100 years blank → repeat.

---

## 3) Traditional Planar Movements (canonical)

> “Traditional” in this document is synonymous with **canon planar movement**.

## 3.1 Canonical timing dataset

### Daanvi (The Perfect Order)
- Type: cyclic
- Orbit: 400 years
- Canon windows: 100 years coterminous, 100 years remote
- Derived transitions: 100 years waning + 100 years waxing
- Anchor: year 800, coterminous, seed-anchor enabled
- Canon pattern: **100 coterminous → 100 blank → 100 remote → 100 blank**.

### Dal Quor (The Region of Dreams)
- Type: fixed
- Fixed phase: remote
- Canon behavior: permanently remote (sealed from generated events).

### Dolurrh (The Realm of the Dead)
- Type: cyclic
- Orbit: 100 years
- Canon windows: 1 year coterminous, 1 year remote
- Derived transitions: 49 years waning + 49 years waxing
- Anchor: year 950, coterminous, seed-anchor enabled.

### Fernia (The Sea of Fire)
- Type: cyclic
- Orbit: 5 years
- Canon windows: 28 days coterminous, 28 days remote
- Derived transitions: 812 days waning + 812 days waxing (336-day year model)
- Anchor: year 998, month 7, coterminous, seed-anchor enabled.

### Irian (The Eternal Dawn)
- Type: cyclic
- Orbit: 3 years
- Canon windows: 10 days coterminous, 10 days remote
- Derived transitions: 494 days waning + 494 days waxing
- Anchor: year 998, Eyre 1, coterminous, seed-anchor enabled
- Special: floating deterministic start day per orbit (bounded day 1..19).

### Kythri (The Churning Chaos)
- Type: fixed
- Fixed phase: waning
- Canon behavior: no canonical cyclic coterminous/remote schedule.

### Lamannia (The Twilight Forest)
- Type: cyclic
- Orbit: 1 year
- Canon windows: 7 days coterminous, 7 days remote
- Derived transitions: 161 days waning + 161 days waxing
- Anchor: year 998, Nymm 24, coterminous.

### Mabar (The Endless Night)
- Type: cyclic (special dual model)
- Base orbit: 1 year
- Canon coterminous window: 4 calendar days (3 nights) around Long Shadows
- Special remote model: 5-day remote window every 5 years around summer solstice
- Anchor: year 998, Vult 26, coterminous
- Special fields: `remoteOrbitYears: 5`, `remoteDaysSpecial: 5`.

### Risia (The Plain of Ice)
- Type: cyclic
- Orbit: 5 years
- Canon windows: 28 days coterminous, 28 days remote
- Derived transitions: 812 days waning + 812 days waxing
- Anchor: year 996, month 1, coterminous, seed-anchor enabled
- Linked to Fernia for seeded relationship behavior.

### Shavarath (The Eternal Battleground)
- Type: cyclic
- Orbit: 36 years
- Canon windows: 1 year coterminous, 1 year remote
- Derived transitions: 5726 days waning + 5726 days waxing
- Anchor: year 990, coterminous, seed-anchor enabled.

### Syrania (The Azure Sky)
- Type: cyclic
- Orbit: 10 years
- Canon windows: 1 day coterminous, 1 day remote
- Derived transitions: 1679 days waning + 1679 days waxing
- Anchor: year 998, Rhaan 9, coterminous, seed-anchor enabled.

### Thelanis (The Faerie Court)
- Type: cyclic
- Orbit: 225 years
- Canon windows: 7 years coterminous, 7 years remote
- Derived transitions: 35,952 days waning + 35,952 days waxing
- Anchor: year 800, coterminous, seed-anchor enabled.

### Xoriat (The Realm of Madness)
- Type: fixed
- Fixed phase: remote.

## 3.2 Traditional movement special mechanics

- **Mabar dual-cycle handling:** annual Long Shadows coterminous plus independent 5-year remote cycle.
- **Irian floating starts:** deterministic per-orbit day shifting in configured range.
- **Seed anchoring:** many cyclic planes use seed-offset anchors; GM can pin/override anchors.
- **Linked anchors:** Risia/Fernia linking ensures coherent opposition behavior.

---

## 4) Generated Planar Movements (off-cycle anomalies)

Generated movements are **deterministic**, seed-based anomalies checked per plane/day with low storage overhead.

Global rules:

- Disabled entirely if `offCyclePlanes` is false.
- Never generated for sealed planes (`Dal Quor`).
- Suppressed when a cyclic plane is already canon-active (coterminous/remote).
- Suppressed by GM overrides/anchors or explicit event suppressions.
- Can be suppressed near GM custom events to avoid stacking.

## 4.1 Mechanism classes

- `standard`
- `linked`
- `moontied`
- `hybrid_moon`
- `cooldown`
- `sealed`

## 4.2 Generated movement statistics by plane

### Shavarath
- Mechanism: standard
- Dice: d20 (14–20) and d12 (12)
- Expected frequency: ~9.8 events/year
- Duration: 1 day
- Phase: 100% coterminous.

### Lamannia
- Mechanism: hybrid_moon (Olarune-qualified + fallback)
- Moon-qualified rolls on full/new phases; fallback d100 extremes on other days
- Expected frequency: ~4.2 events/year
- Duration: d3
- Phase selection: moon/dice-driven coterminous vs remote.

### Fernia
- Mechanism: linked with Risia
- Selector: d20 (20 picks Fernia)
- Confirmation/phase: d10 (10 coterminous, 1 remote)
- Expected frequency: ~3.4 events/year
- Duration: d3.

### Risia
- Mechanism: linked with Fernia
- Selector: d20 (1 picks Risia)
- Confirmation/phase: d10 (10 coterminous, 1 remote)
- Expected frequency: ~3.4 events/year
- Duration: d3.

### Thelanis
- Mechanism: standard
- Dice: d20 (20) and d12 (12 coterminous / 1 remote)
- Expected frequency: ~2.8 events/year
- Duration: weighted {3 days, 7 days} at 50/50.

### Irian
- Mechanism: standard
- Dice: d4 (4), d4 (4), d20 (20 coterminous / 1 remote)
- Expected frequency: ~2.1 events/year
- Duration: d3.

### Mabar
- Mechanism: standard
- Dice: d20 (1) and d4 (1)
- Expected frequency: ~4.2 events/year
- Duration: 1 day
- Phase bias: 75% coterminous, 25% remote
- Time-of-day note: coterminous anomalies are night-only; remote anomalies are day-only.

### Dolurrh
- Mechanism: moontied (Aryth)
- Trigger: Aryth full/new + d20 in [11..20]
- Expected frequency: ~7.0 events/year
- Duration: 1 day
- Phase: full→coterminous, new→remote.

### Daanvi
- Mechanism: cooldown
- Gate: d20 (1)
- Phase die: d10 (1–5 remote, 6–10 coterminous)
- Expected frequency: ~16.8 events/year
- Duration: 10 days
- Balancing Act: post-event 10-day alternation pressure can force opposite phase based on day-weighted d10 threshold.

### Kythri
- Mechanism: standard
- Dice: d100 (100 coterminous / 1 remote)
- Expected frequency: ~6.7 events/year
- Duration: d12.

### Xoriat
- Mechanism: standard
- Dice: d100 (1) and d4 (1)
- Expected frequency: ~0.84 events/year
- Duration: d20
- Phase: 100% remote.

### Syrania
- Mechanism: standard
- Dice: d100 (100), d4 (4), d8 (8 coterminous / 1 remote)
- Expected frequency: ~0.21 events/year
- Duration: 1 day
- Special: coterminous anomaly enforces clear/calm weather override.

### Dal Quor
- Mechanism: sealed (no generated events).

---

## 5) Forecast and reveal statistics

Player reveal tiers:
- `low`, `medium`, `high`.

Prediction limits:
- Low generated horizon: 0 days (present-day generated only)
- Medium canonical horizon: 336 days
- Medium generated max horizon: 3360 days
- High generated max horizon: 3360 days
- High exact generated window: 336 days.

Generated lookahead:
- GM generated scan window: 1680 days (5 Eberron years).

Preset reveal packages:
- Medium: 1d (DC 10), 3d (DC 15), 6d (DC 20), 10d (DC 25)
- High: 1m/28d (DC 10), 3m/84d (DC 15), 6m/168d (DC 20), 10m/280d (DC 25).

---

## 6) Cross-subsystem implications

- Active coterminous/remote states feed planar weather modifiers.
- Generated events participate in the same active-effects pipeline.
- Moon-dependent generated mechanisms (Lamannia, Dolurrh) require moon phase availability.
- Manifest-zone weather/location features remain distinct from global phase state.

---

## 7) Control surface (operations)

Primary commands:

- `!cal planes`
- `!cal planes on <dateSpec>`
- `!cal planes upcoming [span]`
- `!cal planes send [low|medium|high] [range]`
- `!cal planes set <name> <phase> [days]`
- `!cal planes clear [<name>]`
- `!cal planes anchor <name> <phase> <dateSpec>`
- `!cal planes seed <name> <year|clear>`
- `!cal planes suppress <name> [dateSpec]`

These controls jointly allow deterministic replay, campaign-specific divergence, and forecast governance without breaking the underlying model invariants.
