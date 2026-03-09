# Eberron Calendar — Design Document & Decision Log

This document captures the full architectural context, design decisions, and pending work for the Eberron Calendar Roll20 API script. It serves as institutional memory for development continuity.

---

## 1. Calendar Systems

### Eberron (Default)
- 12 months, 28 days each = 336 days/year
- 7-day weeks (Sul, Mol, Zol, Wir, Zor, Far, Sar)
- Era label: YK (Year of the Kingdom)

### Harptos (Forgotten Realms)
- Uses "Tendays" not weekdays. Each month = three tendays = 30 days.
- Mini-calendar renders 10 columns labeled: 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, 10th
- Date format: "16th of Mirtul, 1492 DR" (Dalereckoning era label)
- Weekday names not used in date display

### Smart Date Parsing
Unified across all commands:
- One number: next occurrence of that day
- Two numbers: month + day (next occurrence if no year)
- Three numbers: month + day + year
- Month names recognized (e.g., `!cal Olarune` shows next upcoming Olarune)

---

## 2. Weather System

### Generation
- Location-based: set via `!cal weather location`
- Seeded RNG for deterministic, reproducible forecasts
- Rolling window generation (typically 10 days ahead)
- Can generate on-demand to specific future dates for targeted reveals
- **Always generates for active location only**
- Location change does NOT retroactively alter existing forecasts for other locations
- Reports/presentations only show active location data (silently; no UI noise about other location data)

### Tiers (low / medium / high)
- **Low**: Today obvious. Tomorrow rough guess (seeded from today's state).
- **Medium**: 3-day window. Today = full detail, days 2-3 = moderate detail.
- **High**: Full 10-day forecast with per-period breakdowns and D&D mechanics.

### Reveal Storage
- `playerReveal[serial]` = `{ tier: 'low'|'medium'|'high', source: 'common'|'medium'|'high' }`
- Upgrade-only: never downgrades
- Location-aware: weather data keyed to location

### Specific-Date Reveals (Design — Partially Implemented)
For "what's the weather in the mountains in 6 weeks?":
1. GM changes location to mountains
2. GM generates weather out to target date (extending rolling window)
3. GM reveals specific date(s) only — not everything in between
4. GM tells players, changes location back
5. No UI noise about data from other locations

### Weather Mechanics
The weather system includes temperature bands, precipitation types, wind levels, fog generation, extreme events (blizzards, thunderstorms, heat waves, etc.), and snow accumulation. Specific mechanics have been playtested and updated in-code — refer to the script for current values.

### Zarantyr Weather Interaction
- Zarantyr full: flat boost to lightning/thunderstorm chance regardless of weather conditions. "Superstition holds there is a far greater chance of being struck by lightning when Zarantyr is full, and bolts can fall from a clear sky."
- All moons affect "wind and water" — Zarantyr's unique effect is lightning, not wind/precipitation bonuses. Remove any wind/prec bonus from Zarantyr if present.

---

## 3. Moon System

### Overview
12 moons of Eberron, each mapped to a real Solar System moon as reference. All use random walk variation (unified — no special cases for any moon).

### Orbital Mechanics
- Each moon has: synodic period, semi-major axis, eccentricity, inclination, ascending node
- Periods derived from reference moon scaled to Eberron's 336-day year, then multiplied by an integer factor to avoid overly short synodic periods
- Random walk variation: `shape: 'random'`, amplitude ~5% of period

### Reference Moon Mapping
Each Eberron moon is matched to a real moon based on lore characteristics. When selecting references:
- **Barrakas and Therendor** share similar orbits (lore), leading to more frequent eclipses of Barrakas by Therendor. Closely match their inclinations.
- **Therendor full + Barrakas new** has magical confluence. Add a weak coupling term that biases them toward opposite phases without full phase-locking.
- **Dravago** "typically keeps at a distance from other moons" — give it the highest inclination of any moon.
- **Lharvion** — do NOT clamp eccentricity vs reference. If the reference moon's eccentricity causes orbit overlap, select a different reference rather than modifying parameters.

### Reference Moon Table
Should include: Eberron moon name, reference moon, raw period, scaled period (to 336-day year), integer multiplier, final synodic period used.

### Phase Definitions
Full = illumination ≥ 97%. New = illumination ≤ 3%. 
TODO: Verify these thresholds — reports suggest multiple consecutive days of "full" for some moons.

### Eclipse System
- Solar eclipses: moon passes between Eberron and sun
- Lunar eclipses/occultations: moon passes behind Eberron's shadow or behind another moon
- TODO: Eclipses should have a time of day (early hours 0-6, morning 6-12, afternoon 12-5, evening 5-10, night 10-0)
- TODO: Verify multi-day eclipse issue — some moons showing eclipses on consecutive days

### Moon Tiers
- **Low** (look outside): Phases today + 2 days. Uncertainty windows on all predictions.
- **Medium** (skill check): Presets 1m/3m/6m/10m with DC 10/15/20/25 hints. First synodic cycle = exact. Beyond = uncertainty windows.
- **High** (astronomer/divination): Full exact knowledge for entire range.

### Prediction Limits
```
lowDays: 2
mediumMaxDays: 280 (10 months)
highMaxDays: 672 (2 years, bounded by pre-generation window)
```

### Moon Mini-Calendar Display
- No cell shading (reserved for future use)
- Yellow dot if a moon is full on that day
- Black dot if at least one moon is new on that day
- That's all — keep it clean

### Aryth and Manifest Zones
Aryth "has a similar effect on manifest zones as Zarantyr has on tides."
- When Aryth is full, show GM reminder: "Aryth is full. Consider a manifest zone."
- Store flag in state if any manifest zone was activated during Aryth's full
- When date advances past Aryth full: warning "Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z"

---

## 4. Planar System

### Overview
13 planes, each with canonical cycles (fixed or calculated) plus generated anomalous "flicker" events.

### Canon vs Generated
- **Canon events**: Fixed annual dates, or calculated multi-year cycles from published material
- **Generated events**: Procedurally generated anomalous shifts using per-plane flicker profiles
- These are categorically distinct. Generated events are gated behind higher knowledge tiers.

### Toggle for Generated Events
There should be a toggle to enable/disable generated planar events independently from the overall planes system toggle.

### Flicker Profiles

#### Daanvi — The Perfect Order
**CORRECTED PROBABILITY**: 50/50 coterminous/remote split.
- Gate: d20, hit on 20 only (5% per day)
- Phase: d10, 1-5 = remote, 6-10 = coterminous
- Duration: 10 days fixed
- Cooldown: 10 days
- Balancing Act: favors alternation (cot→nothing→rem→nothing→repeat)
- Expected: ~16.8 events/year
- The cycle logic: coterminous century, nothing century, remote century, nothing century. Hence 50%.

#### Other Planes
Each has unique flicker profile — see code for current values. Standard mechanism uses dice roll combinations for probability, duration, and phase.

### Plane Tiers
- **Low**: Fixed annual canon events (full calendar, always known). Non-annual canon events recognized when currently active ("oh right, this is the Fernia cycle"), full duration revealed. **Generated events never shown at low**, even for present day.
- **Medium**: Canon for full year (336d) always. Generated events for short window. Presets: 1d/3d/6d/10d (DC 10/15/20/25).
- **High**: Everything (canon + generated). Presets: 1m/3m/6m/10m (DC 10/15/20/25).

### Prediction Limits
```
lowDays: 0 (canon only, no generated prediction)
mediumCanonDays: 336 (one year)
mediumMaxDays: 3360 (10 years for generated)
highMaxDays: 3360
highExactDays: 336 (within this range, high-tier flicker predictions exact)
```

### Plane Panel Display
- Green bubble = Coterminous
- Red bubble = Remote
- Up/down arrow for waxing/waning (approaching coterminous or remote)
- When highlighting periods, highlight ALL days in the range, not just start/end

---

## 5. Nighttime Lighting System

### Photometry
Based on real-world photometry scaled to Eberron's 12-moon sky.

**Thresholds** (natural light from moonlight):
- ≥ 1.0 lux: **Bright light** (no vision restrictions). Basis: 1 lux = candle at 1 meter = D&D 5ft bright light threshold.
- 0.3–1.0 lux: **Dim light** (can fight, disadvantage on Perception)
- 0.03–0.3 lux: **Faint dim light** (hard to see detail)
- < 0.03 lux: **Darkness** (blind without darkvision)

**Shadow qualifier**: ~10% of open sky light under canopy/overhang.

**Weather integration**: Cloud cover multipliers applied:
- Clear: ×1.0
- Partly cloudy: ×0.70
- Overcast: ×0.35
- Storm/precipitation: ×0.15

**Key insight**: Eberron is rarely dark. Zarantyr full alone = 10.3 lux (40× Earth's full moon). True darkness requires few/new moons AND heavy weather.

---

## 6. Ring of Siberys

- Single band of dragonshards stretching over the equator (inclination 0°)
- Inner edge: 7,000 km (just above atmosphere)
- Outer edge: 12,000 km (inside Zarantyr orbit at 14,300 km)
- Width: 5,000 km, Thickness: 10 meters
- Albedo: 0.50 (Saturn B-ring average)
- "Stands out even in the light of day" — contributes to nighttime illumination
- Contributes ~0.01 lux baseline even with all moons new

---

## 7. Manifest Zone System

### Design
Parallel to weather location — set separately, cleared on location change.

### Interface
Below "Set Location" button: "Set Manifest Zone" button.
- Opens a 2-column table:
  - Column A: Zone names (13 planes + "None" at top)
  - Column B: Toggle buttons ("On" / "Off")
- Multiple zones can be active simultaneously
- Active zones: bold text, "Off" button
- Inactive zones: faint italic text, "On" button

### Behavior
- When location changes: all manifest zones cleared. Message: "X, Y, Z Manifest Zone(s) cleared."
- Active manifest zones affect weather/mechanics (e.g., Fernia zone = temperature shift)
- Effects shown in "Today" view alongside weather, moons, planar state
- No forecasting for manifest zones — players always know when one is active via "Today" view
- Remove any Shavarath wind effects if present — manifest zone effects are temperature-based only (Fernia +/-, Risia +/-)

### Aryth Integration
- Aryth full → GM reminder about manifest zones
- Flag in state tracks if zones were activated during Aryth full
- Date advance past Aryth full → warning to consider deactivating

---

## 8. Interface & Navigation

### `!cal` (Main Calendar)
Month mini-calendar + date headline + subsystem highlights. GM and player views differ in button availability, not in calendar display.

### Player View
Players should see:
- Basic calendar view (same as GM)
- Buttons to access each subsystem view (information may be tier-limited)
- "Today" view listing everything for the day

### GM Button Bar
Row 1: `⏮ Back` | `⏭ Forward` | `📣 Send`
Row 2: `📋 Today` | `📅 Upcoming` | `🌤 Weather` | `🌙 Moons` | `🌀 Planes`
Row 3: `⚙ Admin`

### DC Hint Buttons
Moon and Plane send buttons show DC hints:
```
Send Medium: 1m (DC 10)  3m (DC 15)  6m (DC 20)  10m (DC 25)
Send High:   1m           3m          6m           10m
```
For planes medium, the presets are days not months:
```
Send Medium: 1d (DC 10)  3d (DC 15)  6d (DC 20)  10d (DC 25)
```

### CLI Flexibility
Buttons send CLI commands. GMs can also type custom values:
- `!cal moon send medium 56d` — custom 56-day medium reveal
- `!cal planes send high 3m` — 3-month high reveal
- Valid suffixes: `Nd`, `Nw`, `Nm` or plain number (days)
- Date specs also valid for targeted reveals

---

## 9. Code Conventions

### No Legacy Aliases Needed
This script has not been used in any real game yet. Legacy aliases (mundane, magical, abridged, survival, magic, etc.) can be removed. The canonical tier names are `low`, `medium`, `high`.

### Naming
- Tiers: `low` / `medium` / `high`
- Source labels: "Common Knowledge" / "Skilled Forecast" / "Expert Forecast"
- Reset (not "clear") for clearing state

### Smart Date Parsing
Applied uniformly: one-number (next day), two-number (month day), three-number (month day year).

---

## 10. Pending TODO List

### High Priority
- [ ] Daanvi probability: change d100(100) to d20(20), keep d10(1-5 rem, 6-10 cot). Target: ~16.8 events/year
- [ ] Toggle for generated planar events (independent of planes system toggle)
- [ ] Remove all legacy tier aliases (mundane, magical, abridged, etc.) — clean code
- [ ] Manifest zone system (parallel to location, UI, Aryth integration)
- [ ] Zarantyr lightning boost mechanic (flat chance regardless of conditions)
- [ ] Remove Zarantyr wind/prec bonus if present; remove Shavarath wind effects

### Moon System
- [ ] Lharvion eccentricity: do NOT clamp. Select different reference moon if overlap
- [ ] Barrakas/Therendor: match inclinations, add weak opposite-phase coupling
- [ ] Dravago: highest inclination of any moon
- [ ] Revisit reference moon selections with all lore constraints
- [ ] Add scaled/multiplied period detail to comparison table
- [ ] Verify full/new phase thresholds — multi-day full moon issue
- [ ] Eclipse time-of-day (early hours, morning, afternoon, evening, night)
- [ ] Verify multi-day eclipse issue
- [ ] Moon-moon crossing events need same time-of-day treatment

### Display / UI
- [ ] Today view: too cluttered, needs reconfiguration (will be directed)
- [ ] Today view: shows extreme event even if none was set — fix
- [ ] Hover tooltips: need line breaks between entries
- [ ] Hover tooltips: moons should NOT include the moniker/title
- [ ] Bottom row of mini-cals cut off short (Y axis)
- [ ] Moon mini-cal: ditch cell shading, use yellow dot (full) / black dot (new) only
- [ ] Planes view: green=coterminous, red=remote, up/down arrows for waxing/waning
- [ ] Planes highlighting: all days in period, not just start/end
- [ ] Solar eclipse math verification

### Calendar Systems
- [ ] Harptos: tenday rows (10 columns), labels 1st-10th, date format "16th of X, YYYY DR"

### Architecture
- [ ] Specific-date weather reveals (generate on-demand, reveal single date, not in-between)
- [ ] Ring of Siberys: verify equatorial placement (inclination 0°), "stands out in daylight"

---

## 11. Session History Summary

### Major Development Arcs (chronological)
1. **Axial tilt & moon inclinations** — Real orbital mechanics for all 12 moons
2. **Moon analog matching** — Each moon mapped to a real Solar System moon
3. **Synodic periods & eclipse geometry** — Real orbital math, eclipse prediction
4. **Random variation unification** — All moons use random walk (Nymm/Lharvion no longer special)
5. **Ring of Siberys simplification** — Single band scaled inside Zarantyr orbit
6. **Nighttime lighting** — Photometry-based lux calculation with weather integration
7. **Three-tier knowledge system** — low/medium/high unified across all subsystems
8. **Interface redesign** — Hub → Calendar as entry point, Today/Upcoming views
9. **Daanvi probability correction** — 50/50 split (was 2/3), now needs 5% gate (d20)
10. **Manifest zone design** — Parallel to location, Aryth integration

### Key Architectural Decisions
- **All moons random**: No special variation shapes. Every moon drifts the same way.
- **Generated vs canon**: Categorically distinct. Generated gated behind higher tiers.
- **Low tier planes**: Generated NEVER shown, even for present day. Canon recognized when happening.
- **Location-scoped weather**: Generate for active location. Present for active location. No cross-location noise.
- **Upgrade-only reveals**: Knowledge only grows, never shrinks.
- **Non-magical source labels**: "Skilled Forecast" not "Mundane Forecast". Method-agnostic.
