# Tasks

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


## Phase 1 — Core math and simulation

### Weather

- [ ] Refactor all temperature generators to the new −5 to 15 scale (all locations and the entire system). The −5 to 15 data tables (`WEATHER_TEMPERATURE_BANDS_F`, `WEATHER_COLD_CLOTHING_TIERS`, `WEATHER_HEAT_ARMOR_RULES`, `WEATHER_TEMPERATURE_SYSTEM_RULES`) are already in the script as drop-in definitions.
- [ ] Apply Daanvi probability correction:
  - [ ] Replace `d100 (1)` gate with `d20 (20)` gate (5% per day)
  - [ ] Split with `d10`: 1–5 = remote, 6–10 = coterminous
  - [ ] Verify long-run target: ~16.8 events/year with ~10-day durations
  - [ ] Preserve balancing behavior that biases toward flipping planar state after each event
- [ ] Add Zarantyr full-moon lightning/thunderstorm boost — flat chance regardless of weather conditions, including clear-sky strike possibility
- [ ] Remove any Zarantyr wind/precipitation bonus (Zarantyr's effect is lightning only)
- [ ] Remove any Shavarath wind effect from manifest zones entirely

### Moons and orbital behavior

> All reference moon decisions are resolved. See `design/moon-reference-selection.md` and `DESIGN.md §7.4` for the full mapping and rationale.

**Reference updates — all confirmed:**
- [ ] Update Therendor reference to Dione: inclination 0.03°, ecc 0.0022, albedo 0.99; `distanceSwingPct = 0.0044`
- [ ] Update Eyre reference to Mimas: inclination 1.53°, ecc 0.0196, albedo 0.96; `distanceSwingPct = 0.0392`; `nodePrecessionDegPerYear = 2`; keep `apsisPrecessionDegPerYear: 120`
- [ ] Update Dravago reference to Triton: inclination 156.8° (retrograde), ecc 0.000016, albedo 0.76; `distanceSwingPct ≈ 0`
- [ ] Update Lharvion reference to Hyperion: inclination 0.43°, ecc 0.1230, albedo 0.30; `distanceSwingPct = 0.246`; remove any eccentricity clamping
- [ ] Update Sypheros reference to Phobos: inclination 1.08°, ecc 0.0151, albedo 0.071; `distanceSwingPct = 0.0302`
- [ ] Set Barrakas albedo to 1.375 (Enceladus ×1 — no multiplier)
- [ ] Set Aryth albedo to 0.275 (averaged Iapetus — not tidally locked, both faces visible)
- [ ] Add weak anti-phase coupling between Therendor and Barrakas (Therendor full → more likely Barrakas new, without hard lock)

- [ ] Remove legacy moon name aliases and compatibility references
- [ ] Audit full/new phase thresholds — multiple consecutive-day "full" reports suggest thresholds (≥97% / ≤3%) may be too wide. Ultimately the only concern is what calendar-day bin the full/new maximizes at, so that the script can mention "X full".

### Eclipses and crossings

- [ ] Revisit solar/moon eclipse math for anomalies.
	- [ ] Issues with potential multiple day eclipses.
	- [ ] Eclipses need to include percentage coverage, which will depend on relative angular sizes. Potentially this should include a change of terminolgy to accurately reflect the moment. (Like, X is traversing the sun in the evening tonight.)
- [ ] Add time-of-day labels to eclipses and moon-crossing events:
  - Early hours (0–6), Morning (6–12), Afternoon (12–17), Evening (17–22), Night (22–0)

---

## Phase 2 — State mechanics and controls

### Planes

- [ ] Add independent toggle for generated planar events (separate from the master planes-system toggle)
- [ ] Planes view status display:
  - [ ] Green bubble = Coterminous
  - [ ] Red bubble = Remote
  - [ ] Up/down arrow for waxing/waning
- [ ] In weather display, show when a plane or manifest zone or moon is currently influencing the weather

### Manifest zones

- [ ] Treat manifest zones as location-parallel state (not weather-forecast content)
- [ ] Add **Set Manifest Zone** button below **Set Location**
- [ ] Manifest zone chooser UI:
  - [ ] 2-column table
  - [ ] Column A titled Zone:`None` + 13 zone names
  - [ ] Column B titled Currently: per-zone toggle button showing `On` or `Off`
  - [ ] When a button is clicked, don't send the whole table again. Just post to chat "X Manifest Zone Toggled On/Off"
- [ ] Support multiple simultaneously active manifest zones
- [ ] Visual state in zone list: active zones bold, inactive zones faint + italic
- [ ] Clear all active manifest zones whenever location changes
- [ ] Append clear-summary to location update message (`X, Y, Z Manifest Zone(s) cleared`)
- [ ] Add moon-summary reminder: `Aryth is full. Consider a manifest zone.`
- [ ] Store flag in state if any zone was activated while Aryth was full
- [ ] On date advance past Aryth full, show warning: `Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z` where X, Y, Z were manifest zones that were enabled while Aryth was full.
- [ ] Include manifest-zone status in Today view (always visible when active)
- [ ] Do **not** include manifest-zone forecasting
- [ ] Wire Fernia/Risia temperature ±effects through manifest-zone mechanic. (likely also need to refactor for new temperature scale from -5 to 15. plus minus 3 seems good.)

---

## Phase 3 — UI and presentation cleanup

- [ ] Fix Today view to omit extreme-event output when no extreme event is set
- [ ] Reduce Today-view clutter (specific redesign to be directed)
- [ ] Ensure players can use `!cal` for: basic calendar view, subsystem views (permission-gated), Today view
- [ ] Add tooltip line breaks between entries
- [ ] Fix mini-calendar bottom-row clipping on Y-axis
- [ ] Remove moon monikers/titles from moon tooltips
- [ ] Simplify moon mini-calendar:
  - [ ] Remove cell coloring. It prioritizes certain moons and ends up really cluttered and confusing.
  - [ ] Yellow dot if any moon is full
  - [ ] Black dot if at least one moon is new
  - [ ] Tooltip on hover needs to have line breaks between moons, so it appears as a readable list.
- [ ] Ensure highlight ranges fill all days between start and end (not only endpoints). Specifically for the planes minical. It may also already be done in the events system. Likely the same approach should be used for both.
- [ ] Remove all legacy tier aliases from code (`mundane`, `magical`, `abridged`, `survival`, `magic`) — canonical names are `low`, `medium`, `high`

---

## Phase 4 — Calendar and lore formatting

- [ ] Confirm Ring of Siberys presentation: equatorial placement (inclination 0°), "stands out in daylight" visually reflected.
	- [ ] update readme to mention the relative albedo used or contribution to the lighting. Should mimic saturns rings, scaled to earth's radius. also include relative height above the planet's surface, and some quant/qual comments like "above the ISS", edge of LEO, etc.
- [ ] Correct Harptos display:
  - [ ] Use tendays (not weekdays)
  - [ ] Each month = 3 rows × 10 columns
  - [ ] Column labels: `1st` through `10th`
  - [ ] Date format: `16th of <Month>, <Year> DR`
- [ ] The leap day in gregorian setting is not really "intercalery". It's a part of February, and should be shown as such. No additional information is needed (like always posting "Leap Year"). The presence of the 29th of February is the only indication needed.

---

## Architecture (no phase)

- [ ] Specific-date weather reveals: GM switches location, generates to target date, reveals single date only (not everything in between), then changes location back. No UI noise about other-location data.
	- [ ] This is for the game-mechanic of "divination magic" revealing e.g. what will be the weather on the mountain top in 37 days? It should not reveal everything in between, but the generation engine needs to generate it for the yesterday-seeding we use. This should also accept ranges for revealing the forecast. And the reveal should use the same week-strip presentation used elsewhere for weather, with blank cells where no information is available.
	- [ ] From the player's perspective, the "forecast" command should only reveal known information to the correct threshold at the system's current location. That location information should also be included in the posted text, so players "know where they are." The reveal weather command (might need a better name, but that's at least clear) should be available to GMs only, but needs a way to input a custom range, building a minical as big as needed to present that range. This should have some reasonable limits, like 3 months or so, to avoid mistakenly sending 1000 years of data to the chat window. This should always just use the currently set location, or it gets too confusing. So GMs can change the location for the purposes of any planning, then switch back to the "actual" location the game is currently in. Weather data is stored in state with tags for the location, and pruned when "stale" or old, so there's no problem with this switching. There is no need to store multiple versions of the same "location", (like storing the himalayas and the alps might use the same location, but that's just not needed as a mechanic to have differentiators at the expense of clarity.)
	- [ ] There should be a "quick switch" function in the Location setting menu that lists the last 3 locations used, and is updated on location change. So when GMs go to switch location, they can jump back previous without needing to click through each set again.

---

## Acceptance checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
