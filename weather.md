# Weather System Reference

## Scope

This document captures **all weather-facing mechanics currently implemented in `calendar.js`** for the Eberron calendar tool, including:

- Random weather generation
- Climate/geography/terrain modeling
- Location wizard and manifest zone modifiers
- Planar and lunar weather interactions
- D&D-facing mechanics (saves/checks, visibility, difficult terrain, hazards)
- Forecast certainty/reveal systems
- Extreme weather event triggers and probabilities

It also includes an additional Earth weather modeling section for inspiration.

---

## 1) Core model and data flow

### Weather scales used by the system

The engine uses three numeric tracks:

- **Temperature**: stage `0–10`
  - Approx guide: `0 = -25°F`, `5 = 50°F`, `10 = 125°F+`
- **Wind**: stage `0–5`
  - Labels: Calm → Breezy → Moderate Wind → Strong Winds → Gale → Storm
- **Precipitation**: stage `0–5`
  - Labels: Clear → Partly Cloudy → Overcast → Light → Moderate → Heavy

### Daily generation pipeline

For each day, generation follows this sequence:

1. Determine location profile (`climate`, `geography`, `terrain`, optional `manifestZone`)
2. Build formula from three layers:
   - climate baseline table
   - geography modifiers
   - terrain modifiers
3. Roll afternoon base values using symmetric opposed dice (`+dN - dN`)
4. Apply day-to-day persistence nudges (seed strength)
5. Generate time-of-day (morning/afternoon/evening) values via:
   - deterministic arc (climate-dependent)
   - stochastic bell-curve shift per trait
6. Roll fog per period with persistence from prior period
7. Set final/day peak from afternoon values
8. Apply manifest zone modifiers
9. Apply active planar weather modifiers
10. Compute accumulation flags (`snowAccumulated`, `wetAccumulated`) for hazard/event logic

### Forecast lifecycle

- Forecast window generated ahead: **20 days**
- History retention: **60 days** locked past records
- Records can become **stale** if location changes
- Matching-location records can be **resurrected** by signature match

---

## 2) Random generation mechanics

### Trait roll math

Each trait roll uses:

- `raw = base + d(die) - d(die) + nudge`
- clamped to per-trait `[min,max]`

This produces a central distribution with rare extremes.

### Continuity / persistence

`CONFIG_WEATHER_SEED_STRENGTH` controls how strongly previous-day weather pulls current rolls toward continuity.

### Time-of-day model

Two-layer period model:

1. **Deterministic arc** (per climate): expected daily shape
2. **Stochastic bell shift** (per period/trait): from `1d20` map
   - `1 => -2`
   - `2-4 => -1`
   - `5-16 => 0`
   - `17-19 => +1`
   - `20 => +2`

### Fog generation

Fog is generated probabilistically per period (`morning`, `afternoon`, `evening`) with:

- base rates by period
- geography multipliers
- terrain multipliers
- season/month weights
- persistence boost if previous period had fog and wind is calm
- suppression at higher wind

Fog outputs: `none`, `light`, `dense`.

---

## 3) Geography, location, and world setup

### Supported climates

- `polar`
- `continental`
- `temperate`
- `dry`
- `tropical`
- `monsoon`
- `mediterranean`

### Supported geographies

- `inland`
- `coastal`
- `open_sea`
- `open_plains`
- `highland`
- `river_valley`
- `jungle_basin`
- `inland_sea`
- `island`
- `arctic_plain`

### Supported terrain types

- `open`
- `forest`
- `jungle`
- `swamp`
- `urban`
- `alpine`
- `farmland`
- `desert`
- `coastal_bluff`

### Location wizard flow

`!cal weather location` is a multi-step wizard:

1. Climate selection
2. Geography selection
3. Terrain selection
4. Optional manifest zone selection

Location finalization sets a location signature. Forecast records are then:

- restored if signatures match
- marked stale if they do not

---

## 4) Manifest zone weather modifiers (location-scoped)

Manifest zones apply after baseline generation:

- **Fernia**: `temp +2`
- **Risia**: `temp -2`
- **Irian**: `temp +1`
- **Mabar**: `temp -1`
- **Lamannia**: `precip +1`
- **Syrania**: `precip -1`
- **Shavarath**: `wind +1`
- **Kythri**: chaotic random swings (`temp ±2`, `precip ±1`, `wind ±1`)
- **Daanvi / Dolurrh / Thelanis / Xoriat / Dal Quor**: tagged flavor with no direct numeric weather shift in this block

Manifest effects stack with other systems unless overridden later by hard planar effects (e.g., Syrania coterminous forcing calm/clear).

---

## 5) Planar and moon-linked weather mechanics

### Active planar weather shifts (daily)

When planar effects are enabled, weather applies these shifts:

- **Fernia coterminous**: `temp +2`
- **Fernia remote**: `temp -1`
- **Risia coterminous**: `temp -2`
- **Risia remote**: `temp +1`
- **Syrania coterminous**: force `precip = 0`, `wind = 0` (clear/calm override)
- **Syrania remote**: `precip +1` (capped)
- **Shavarath coterminous**: `wind +1` (capped)

### Daanvi off-cycle generation (anomaly profile)

Daanvi uses cooldown logic rather than standard dice chains:

- Gate: daily `d100`, trigger on `100` only (1%)
- Phase die: `d10`
  - `1-5 = remote`
  - `6-10 = coterminous`
- Duration: **10 days**
- Balancing Act: for 10 days after event end, a thresholded `d10` can force opposite phase to bias alternation

### Zarantyr and weather-adjacent effects

- Zarantyr is the **Storm Moon** in moon lore.
- Tides are modeled from Zarantyr alone (campaign design), producing tidal index `0-10` and labels from neap/dead calm to extreme tide.
- Tidal output is surfaced in weather displays for coastal/island-type locations.

---

## 6) Condition derivation and categorization

Derived condition engine translates numeric tracks into concrete weather states.

### Precip type derivation

From `temp` + `precip`:

- Cold band (`temp <= 3`): `snow_light`, `snow`, `blizzard`
- Freeze-mix band (`temp == 4`): `sleet_light`, `sleet`, `ice_storm`
- Rain band (`temp >= 5`): `rain_light`, `rain`, `heavy_rain`, `deluge`

### Visibility tiers

- **Tier A**: Lightly obscured (e.g., rain/snow/sleet)
- **Tier B**: Lightly obscured; heavily obscured beyond 60 ft (light fog, heavy rain, ice storm)
- **Tier C**: Lightly obscured; heavily obscured beyond 30 ft (dense fog, blizzard, deluge)

### Difficult terrain rules

Flagged for:

- sleet
- ice storm
- blizzard
- deluge
- snow with prior accumulation

### Hazard annotations

Additional risk notes attached to severe types:

- heavy rain: lightning / flash flood risk
- deluge: extreme flooding / impassable roads
- blizzard: whiteout / avalanche / hypothermia risk
- ice storm: lightning / flood / falling ice risk

---

## 7) Dungeons & Dragons mechanics exposed to players/GM

### Temperature mechanics

- Stage 0: DC 25 Con save or exhaustion; clothing disadvantage
- Stage 1: DC 20 Con save or exhaustion; clothing disadvantage
- Stage 2: DC 15 Con save or exhaustion; clothing disadvantage
- Stage 3: DC 10 Con save or exhaustion
- Stage 7: DC 10 Con save or exhaustion
- Stage 8: DC 15 Con save or exhaustion; heavy armor disadvantage
- Stage 9: DC 20 Con save or exhaustion; medium/heavy armor disadvantage
- Stage 10: DC 25 Con save or exhaustion; all armor wearers disadvantage

### Wind mechanics

- Stage 2: fogs/gases dispersed
- Stage 3: ranged attacks disadvantaged; long-range auto-miss; flying and movement penalties; open flames extinguished
- Stage 4: ranged auto-miss; flying speed to 0; extra movement cost on foot
- Stage 5: DC 15 Strength check or fall prone; environmental damage implications (trees/projectiles)

### Visibility and perception mechanics

Visibility tier output explicitly imposes perception disadvantage and range thresholds for heavy obscurement.

### Extreme event mechanics

Each event includes explicit D&D-like mechanics and aftermath text, e.g. saves/checks, damage, movement restrictions, and vehicle handling checks.

Implemented events:

1. Flash Flood
2. Whiteout
3. Ground Blizzard
4. Dust Storm (Haboob)
5. Avalanche
6. Severe Thunderstorm
7. Flash Freeze
8. Tropical Storm
9. Hurricane

These are condition-qualified probabilities; events never auto-fire. GM can mark active or roll for trigger.

---

## 8) Forecast knowledge/reveal mechanics

Player forecast knowledge is tracked by tier per day:

- `low`
- `medium`
- `high`

Reveal sources:

- common / today send
- mundane (skilled forecast)
- magical (expert forecast)

Uncertainty labels for GM-facing records are based on day distance from generation:

- Certain
- Likely
- Uncertain
- Vague

---

## 9) Commands and operational controls (weather)

Primary GM/player entry points:

- `!cal weather`
- `!cal weather location`
- `!cal weather forecast [10|20]`
- `!cal weather mechanics`
- `!cal weather reroll`
- `!cal weather generate`
- `!cal weather history`
- `!cal weather send today`
- `!cal weather send mundane <1|3|6|10>`
- `!cal weather send magical <1|3|6|10>`
- `!cal weather event trigger <key>`
- `!cal weather event roll <key>`

---

## 10) Earth weather modeling inspiration (reference section)

This section is intentionally **real-world modeling guidance** (not current script behavior) to inspire future expansion.

### A) Wind categorization: Beaufort scale

Use Beaufort bins as a bridge between narrative and mechanics.

- 0 Calm (<1 mph)
- 1 Light air (1–3 mph)
- 2 Light breeze (4–7 mph)
- 3 Gentle breeze (8–12 mph)
- 4 Moderate breeze (13–18 mph)
- 5 Fresh breeze (19–24 mph)
- 6 Strong breeze (25–31 mph)
- 7 Near gale (32–38 mph)
- 8 Gale (39–46 mph)
- 9 Strong gale (47–54 mph)
- 10 Storm (55–63 mph)
- 11 Violent storm (64–72 mph)
- 12 Hurricane force (73+ mph)

Design idea: map current wind stages (`0–5`) onto Beaufort ranges for realism while preserving your game abstraction.

### B) Visibility categories on Earth (aviation/meteorology-oriented)

Common practical tiers:

- **Excellent**: >10 km
- **Good**: 4–10 km
- **Moderate**: 1–4 km
- **Poor**: 200 m–1 km
- **Very poor**: 50–200 m
- **Near-zero**: <50 m

Design idea: your current A/B/C tiers can be mapped to metric distances to support nav/travel subsystems.

### C) Fog likelihood heuristics

Fog probability generally increases with:

- high relative humidity (near saturation)
- overnight radiative cooling
- low wind (mixing too weak to disperse)
- valleys/basins/wetlands
- coastal marine layers

Fog probability generally decreases with:

- strong wind (mixing/dispersal)
- very dry air masses
- intense daytime heating (except advection fog regimes)

Design idea: your existing multipliers align well with this and could be extended with humidity/pressure fields.

### D) Rain and thunderstorm likelihood heuristics

Convective storm likelihood rises with:

- warm/moist boundary layer
- instability (CAPE-like condition)
- lifting triggers (fronts, terrain lift, sea-breeze convergence)
- sufficient vertical shear for organized systems

Heavy rain/flood risk rises with:

- high precipitable water
- slow-moving storms or training cells
- saturated antecedent ground
- river-basin bottlenecks and urban runoff

Design idea: your `wetAccumulated` flag is already a good antecedent-moisture hook; add basin/soil parameters for stronger hydrology simulation.

### E) Snow/ice transition band (Earth analogy)

A practical near-surface phase ladder:

- sufficiently below freezing: snow dominant
- near freezing: sleet/freezing rain mix possible
- above freezing: rain dominant

Design idea: your temp stage split (`<=3`, `4`, `>=5`) is already a clean gameable analogue.

### F) Tropical cyclone categorization inspiration

Real systems use sustained-wind thresholds (e.g., tropical storm vs. hurricane categories). For game use, you can layer:

1. genesis probability (SST-like warmth + moisture + low shear)
2. intensity stage progression
3. inland decay and rainfall/flood persistence

Your existing Tropical Storm/Hurricane event pair is a good scaffold for this.

---

## 11) Suggested expansion roadmap

If you want this to become a “giant system,” the next highest-impact additions are:

1. Add an explicit **humidity** track to improve fog/rain realism.
2. Add a **pressure trend** tag (falling/steady/rising) for forecast flavor and severe-event gating.
3. Split precipitation into **rate + type + duration** for better flood/snowpack behavior.
4. Add **soil saturation / basin runoff memory** beyond 1-day wet accumulation.
5. Add region profiles for **orographic rain shadows** and **lee warming**.
6. Map wind to Beaufort internally for a physical-to-narrative bridge.

