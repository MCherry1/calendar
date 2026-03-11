# Agent Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. This file tracks implementation work only.

As these tasks are taken care of, remove them from this list.

If there is design ambiguity in this tasks list: keep the task intact and add a comment to the **Needs Design Input** section.

---
## Needs Design Input


---
## Match Script to README.md and Design.md
- Check README for accuracy against the script implementation, add section at the top of this file that lists which sections are not how the script is currently implemented.
---
## Update README.md
- Do not overwrite any text in the README.
- README is incomplete. Fill in the sections where tasks are clear.
---

---

## Coding Tasks

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes. A capable coding agent can complete these without further design discussion.

---

### Remove legacy tier aliases

Remove all legacy tier name aliases from the codebase. The canonical tier names are `low`, `medium`, `high`. The following legacy names must be purged everywhere they appear:

**What to remove:**
- `WEATHER_SOURCE_LABELS`: remove keys `mundane`, `magical`, `survival`, `magic` (lines ~6598–6602)
- `PLANE_SOURCE_LABELS`: remove keys `mundane`, `magical` (lines ~11514–11515). Replace with `low`/`medium`/`high` keys using the canonical source labels (`Common Knowledge`, `Skilled Forecast`, `Expert Forecast`)
- `_normalizeMoonRevealTier()`: remove `mundane`→`medium` and `magical`→`high` aliases (lines ~8650–8651)
- `_normalizePlaneRevealTier()`: remove `mundane`→`medium` and `magical`→`high` aliases (lines ~11556–11557)
- `sendPlayerForecast()`: remove `survival`/`mundane`→`medium` and `magic`/`magical`→`high` aliases (lines ~6718–6720)
- Weather `send` command handler: remove `survival`/`mundane`→`medium` and `magic`/`magical`→`high` aliases (lines ~7308–7309)
- Moon `send` command handler: remove `mundane`→`medium` and `magical`→`high` aliases (lines ~10712–10713)
- Planes `send` command handler: remove `mundane`→`medium` and `magical`→`high` aliases (lines ~12305–12306)
- `_recordReveal()` comment: update source comment from `'common' | 'mundane' | 'magical'` to `'common' | 'medium' | 'high'` (line ~6606)
- `_mundaneDetailTier()` function: rename to `_mediumDetailTier()`, update comment (lines ~6578–6584)
- `getPlanesState()` initializer: change default `revealTier` from `'mundane'` to `'medium'` (line ~11054)

**UI labels to update:**
- Weather Today panel: rename "Mundane send:" → "Medium send:" and "Magical send:" → "High send:" in button row labels (lines ~6847–6863)
- Weather Today panel: rename button commands from `weather send mundane N` → `weather send medium N` and `weather send magical N` → `weather send high N`
- Moon help text: update `mundane|magical` → `low|medium|high` in usage string (line ~10857)
- Weather send usage message: remove `(legacy: mundane|magical|survival|magic)` from error text (line ~7339)

**Migration for existing state:** Add a one-time migration in `getPlanesState()` that converts any stored `revealTier` of `'mundane'` → `'medium'` and `'magical'` → `'high'`.

---

### Update moon orbital references

All reference moon decisions are resolved. See `design/moon-reference-selection.md` and `DESIGN.md §7.4` for the full mapping and rationale.

Each item below requires updating the moon's entry in both `MOON_SYSTEMS` and `MOON_ORBITAL_DATA` / `MOON_MOTION_TUNING`. Change only the values listed; preserve all other fields (synodic period, randomWalk amplitude, etc.).

- [ ] **Therendor → Dione** (currently Europa): Set `referenceMoon: 'Dione (Saturn)'`, `inclination: 0.03`, `eccentricity: 0.0022`, `albedo: 0.99`, `distanceSwingPct: 0.0044`. Remove or update `nodePrecessionDegPerYear` and `apsisPrecessionDegPerYear` if they were Europa-specific.

- [ ] **Eyre → Mimas** (currently Hyperion): Set `referenceMoon: 'Mimas (Saturn)'`, `inclination: 1.53`, `eccentricity: 0.0196`, `albedo: 0.96`, `distanceSwingPct: 0.0392`. Keep `nodePrecessionDegPerYear: 2` and `apsisPrecessionDegPerYear: 120`.

- [ ] **Dravago → Triton** (currently Tethys): Set `referenceMoon: 'Triton (Neptune)'`, `inclination: 156.8` (retrograde orbit), `eccentricity: 0.000016`, `albedo: 0.76`, `distanceSwingPct: 0` (essentially zero).

- [ ] **Lharvion → Hyperion** (currently Nereid): Set `referenceMoon: 'Hyperion (Saturn)'`, `inclination: 0.43`, `eccentricity: 0.1230`, `albedo: 0.30`, `distanceSwingPct: 0.246`. **Remove the eccentricity clamping** in `_moonOrbitalParams()` (lines ~9456–9460) that floors `distFactor` at 0.25 — that clamp was for Nereid's extreme eccentricity (0.75) which Hyperion (0.12) does not need.

- [ ] **Sypheros → Phobos** (currently Phoebe): Set `referenceMoon: 'Phobos (Mars)'`, `inclination: 1.08`, `eccentricity: 0.0151`, `albedo: 0.071`, `distanceSwingPct: 0.0302`.

- [ ] **Barrakas albedo**: Currently 1.375 — this is already correct (Enceladus ×1, no multiplier). **No change needed; verify and skip.**

- [ ] **Aryth albedo → 0.275**: Currently 0.05. Update to `albedo: 0.275` in both `MOON_SYSTEMS` and `MOON_ORBITAL_DATA`. Rationale: averaged Iapetus (not tidally locked, both light and dark faces visible).

- [ ] **Add weak anti-phase coupling between Therendor and Barrakas**: When Therendor is full, bias Barrakas's random walk toward new (and vice versa). This should be a soft statistical nudge, not a hard lock. Implementation: in the random walk step for Barrakas, check Therendor's current phase; if Therendor illumination is high, add a small negative bias to Barrakas's walk (and vice versa). The coupling should be weak enough that it's a tendency, not a guarantee.

---

### Remove legacy moon name aliases

Search for any old-name → new-name alias mappings for moons (e.g., old Eberron moon names mapped to current names). Based on code review, no such aliases currently exist — the `referenceMoon` field documents real solar system analogs, not legacy Eberron names. **Verify this is the case and mark complete, or remove any found aliases.**

---

### Daanvi probability — verify current implementation

The task originally said "Replace `d100 (1)` gate with `d20 (20)` gate." Code review shows Daanvi **already uses** `gateDie: 20, gateHitRange: [1, 1]` (5% per day), `phaseDie: 10` (50/50 remote/coterminous), `expectedPerYear: 16.8`, and balancing behavior. **Verify the long-run output matches ~16.8 events/year with ~10-day durations, then mark complete.**

The task description was stale — the original `d100 (1)` gate was already replaced. The subtask "Split with d10: 1–5 = remote, 6–10 = coterminous" is also already implemented.

---

### Remove Zarantyr wind/precipitation bonus

Code review shows **no Zarantyr wind or precipitation bonus exists** in the current code. Zarantyr's only weather effect is a lightning storm probability boost (+0.20, capped at 0.65) when Zarantyr is full (line ~6166). **Verify no wind/precipitation code exists and mark complete.**

The companion task "Add Zarantyr full-moon lightning/thunderstorm boost" is also **already implemented** (line ~6166).

---

### Remove Shavarath wind effect from manifest zones

Code review shows Shavarath is already annotated as `'Shavarath (martial resonance, no weather effect)'` with no wind modifier. **Verify no Shavarath wind code exists and mark complete.**

---

### Refactor temperature generators to −5 to 15 scale

The four target data tables (`WEATHER_TEMPERATURE_BANDS_F`, `WEATHER_COLD_CLOTHING_TIERS`, `WEATHER_HEAT_ARMOR_RULES`, `WEATHER_TEMPERATURE_SYSTEM_RULES`) are already defined in the script using band indices -5 through 15.

However, the actual temperature generators (`WEATHER_CLIMATE_BASE` and the formula/roll system) produce values on a **0–10 stage scale**, not the -5 to 15 band scale. The task is to refactor the generators so their output maps directly to the -5 to 15 band indices, eliminating the intermediate stage layer.

**Scope:** All climate definitions in `WEATHER_CLIMATE_BASE` (polar, subarctic, temperate, subtropical, tropical, arid, etc.) and the `_composeFormula()` / `_rollTrait()` pipeline need to output on the -5 to 15 scale. The existing F° band mappings in `WEATHER_TEMPERATURE_BANDS_F` should remain unchanged — the generator output just needs to index into them directly.

**Note:** Fernia/Risia manifest zone temperature modifiers (currently ±2) may need adjustment for the new scale. ±3 seems appropriate per DESIGN.md notes.

---

### Fix Today view — omit extreme-event output when none active

Code review shows `_extremeEventPanelHtml()` already returns `''` when no events are active. However, the Today view may still render an empty container or separator for the extreme event panel. **Verify the Today view renders cleanly when no extreme event is set — no empty boxes, no orphaned headers, no extra whitespace. Fix if needed.**

---

### Audit full/new moon phase thresholds

Current thresholds: `≥ 0.97` for full, `≤ 0.03` for new. The concern is that these may be too wide, causing multiple consecutive days to report "full" for the same moon. The real question: does the script correctly identify which single calendar day the full/new phase peaks on?

**Action:** Check whether the script reports "X is full" on multiple consecutive days. If so, tighten thresholds or switch to a peak-detection approach (report full/new only on the day with the highest/lowest illumination in that cycle). The goal is exactly one "full" and one "new" report per synodic cycle.

---

### Planes view — update status display colors

Current emoji mapping: 🔴 Coterminous, 🟠 Waning, 🔵 Remote, 🟢 Waxing. The task says to use Green for Coterminous and Red for Remote. Additionally, add up/down arrows for waxing (↑) and waning (↓).

**Update `PLANE_PHASE_EMOJI`:**
- Coterminous → 🟢 (green, was red)
- Remote → 🔴 (red, was blue)
- Waxing → ↑ or 🟢↑
- Waning → ↓ or 🔴↓

**Note:** There is a duplicate `PLANE_PHASE_EMOJI` definition (lines ~11491 and ~11505). Remove the duplicate during this fix.

---

### Add independent toggle for generated planar events

Currently there is only `planesEnabled` (master toggle). Add a separate boolean setting `planesGeneratedEnabled` (default: true) that controls whether generated (non-canon) planar events are produced. When off, only canon/fixed events appear. The master toggle still gates the entire planes subsystem.

---

### Show weather influence sources

In the weather display (both GM and player views), indicate when a plane, manifest zone, or moon is currently modifying weather conditions. For example: "🌙 Zarantyr (lightning boost)" or "🔥 Fernia manifest zone (+3 temp)". This should appear as a small annotation line, not clutter the main display.

---

### Remove moon monikers/titles from tooltips

Moon titles (e.g., "The Crown", "The Storm Moon") are currently shown in tooltips and display panels via `moon.title`. Remove these from:
- Moon tooltip rendering (line ~3099: `titleTag`)
- Moon panel displays (line ~7968)
- Notable phase displays (lines ~8879, ~9100, ~9103)

---

### Simplify moon mini-calendar

- [ ] Remove per-moon cell coloring (currently cluttered and prioritizes certain moons)
- [ ] Yellow dot (●) if any moon is full on that day
- [ ] Black dot (●) if at least one moon is new on that day
- [ ] Tooltip on hover: line breaks between moons (use `<br>` separator, not comma)

---

### Fix mini-calendar bottom-row clipping

The bottom row of the mini-calendar grid clips on the Y-axis. Investigate the table/cell CSS in `renderMonthTable()` and the `STYLES` object. Likely needs `overflow: visible` or adjusted height on the containing element.

---

### Add tooltip line breaks between entries

In mini-calendar day cell tooltips, entries are currently comma-separated (joined with `, `). Change the join separator to `\n` or `<br>` so each entry appears on its own line in the hover tooltip.

---

### Ensure highlight ranges fill all intermediate days

For the planes mini-calendar, phase highlight ranges only mark the start/end days (phase transition points), not every day in between. Modify the synthetic event builder (`_buildSyntheticEventsLookup()` and related code) so that every day between a phase start and end gets the highlight color, not just transition days. Check whether the events system already does this correctly — if so, use the same approach for planes.

---

### Ensure players can use `!cal` subsystem views

Players can currently use `!cal` for the basic calendar view. Verify and enable access to subsystem views (weather forecast, moon phases, planar status) with appropriate permission gating:
- Weather: players see their revealed forecast only (already works via `!cal weather`)
- Moons: players see their revealed moon data (already works via `!cal moon`)
- Planes: players see their revealed planar data
- Today: players should see a simplified Today view (currently GM-only)

---

---

## Design Tasks

These tasks involve architectural decisions, UI/UX design choices, or system interactions that need human input or more careful deliberation before coding. They may require creating a `design/` file for discussion.

---

### Manifest zone system redesign

The manifest zone system needs a significant architectural change. Currently zones are set as part of location selection (single zone per location). The target design is:

- [ ] Treat manifest zones as location-parallel state (independent of weather location)
- [ ] Add **Set Manifest Zone** button below **Set Location** in the admin panel
- [ ] New chooser UI: 2-column table (Zone name | On/Off toggle), supporting all 13 planes + None
- [ ] Support **multiple** simultaneously active manifest zones
- [ ] Visual state: active zones bold, inactive zones faint + italic
- [ ] Toggle click posts a simple chat confirmation, doesn't re-render the full table
- [ ] Clear all active manifest zones on location change, with summary message
- [ ] Aryth full-moon reminder: "Aryth is full. Consider a manifest zone."
- [ ] Track which zones were activated during Aryth full
- [ ] On date advance past Aryth full: warning to deactivate those zones
- [ ] Show manifest-zone status in Today view (always visible when active)
- [ ] No manifest-zone forecasting
- [ ] Wire Fernia/Risia temperature effects (±3 on new scale) through the manifest zone mechanic instead of current approach

**Design questions:** How should multiple simultaneous manifest zones interact? Do their temperature effects stack? What happens if Fernia and Risia are both active (cancel out)?

---

### Eclipse and crossing math overhaul

- [ ] Fix potential multi-day eclipse reports (eclipses should be single-day events with time-of-day precision)
- [ ] Add percentage coverage to eclipses, based on relative angular sizes of the bodies
- [ ] Consider terminology changes: "X is traversing the sun" vs "solar eclipse" depending on coverage percentage
- [ ] Add time-of-day labels to all eclipses and moon-crossing events:
  - Early hours (0–6), Morning (6–12), Afternoon (12–17), Evening (17–22), Night (22–0)

**Design questions:** What coverage threshold distinguishes a "transit" from an "eclipse"? Should partial eclipses be reported differently from total/annular eclipses?

---

### Specific-date weather reveals (divination mechanic)

This is the "divination magic" feature: GM reveals weather for a specific date at a specific location without revealing everything in between.

- [ ] GM command to generate weather to a target date at current location, then reveal only that date (or a date range)
- [ ] Generation engine must still generate intermediate days for seeding, but those aren't revealed
- [ ] Revealed range uses the same week-strip presentation as regular forecasts, with blank cells where no data is revealed
- [ ] Player-facing forecast command shows only revealed data at the current location, with location name included
- [ ] GM-only reveal command with custom range input (cap at ~3 months to prevent chat flooding)
- [ ] Always uses currently set location (GM switches location for planning, then switches back)
- [ ] **Location quick-switch**: Add a "recent locations" list (last 3 used) in the Location setting menu for fast switching

**Design questions:** What should the GM command syntax look like? Should the reveal command accept both single dates and ranges? How should the week-strip handle sparse reveals (e.g., day 37 and day 42 revealed, nothing in between)?

---

### Reduce Today-view clutter

The Today view needs a redesign to reduce information density. Specific changes to be directed — this task is a placeholder awaiting design direction.

---

### Correct Harptos calendar display

The Faerûnian/Harptos calendar currently uses weekday-based layout. It should use tendays:
- [ ] Each month = 3 rows × 10 columns
- [ ] Column labels: `1st` through `10th`
- [ ] Date format: `16th of <Month>, <Year> DR`

**Design question:** How should the 5 festival days (intercalary days between months) be displayed? They don't belong to any month or tenday.

---

### Fix Gregorian leap day presentation

The Gregorian calendar's leap day is currently marked as "intercalary" with a separate display. It should simply be February 29th — part of February, not a special intercalary day. Remove any "Leap Year" annotations; the presence of the 29th is sufficient indication.

---

### Ring of Siberys presentation

- [ ] Confirm equatorial placement (inclination 0°) and "stands out in daylight" visual
- [ ] Update README: document the relative albedo used, contribution to nighttime lighting, Saturn's-rings-scaled-to-Earth's-radius analogy, relative height above surface with comparative references (above ISS, edge of LEO, etc.)

---

---

## Acceptance Checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
