# Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. This file tracks implementation work only.

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

> **Note:** Reference moon selection tasks are blocked on `design/moon-reference-selection.md`. The tasks below that depend on specific reference choices will be added to this file once that design discussion concludes. The phase-threshold and eclipse tasks are independent and ready now.

- [ ] Remove legacy moon name aliases and compatibility references
- [ ] Audit full/new phase thresholds — multiple consecutive-day "full" reports suggest thresholds (≥97% / ≤3%) may be too wide

### Eclipses and crossings

- [ ] Revisit solar/moon eclipse math for consecutive-day anomalies
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

### Manifest zones

- [ ] Treat manifest zones as location-parallel state (not weather-forecast content)
- [ ] Add **Set Manifest Zone** button below **Set Location**
- [ ] Manifest zone chooser UI:
  - [ ] 2-column table
  - [ ] Column A: `None` + 13 zone names
  - [ ] Column B: per-zone toggle button showing `On` or `Off`
- [ ] Support multiple simultaneously active manifest zones
- [ ] Visual state in zone list: active zones bold, inactive zones faint + italic
- [ ] Clear all active manifest zones whenever location changes
- [ ] Append clear-summary to location update message (`X, Y, Z Manifest Zone(s) cleared`)
- [ ] Add moon-summary reminder: `Aryth is full. Consider a manifest zone.`
- [ ] Store flag in state if any zone was activated while Aryth was full
- [ ] On date advance past Aryth full, show warning: `Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z`
- [ ] Include manifest-zone status in Today view (always visible when active)
- [ ] Do **not** include manifest-zone forecasting
- [ ] Wire Fernia/Risia temperature ±effects through manifest-zone mechanic

---

## Phase 3 — UI and presentation cleanup

- [ ] Fix Today view to omit extreme-event output when no extreme event is set
- [ ] Reduce Today-view clutter (specific redesign to be directed)
- [ ] Ensure players can use `!cal` for: basic calendar view, subsystem views (permission-gated), Today view
- [ ] Add tooltip line breaks between entries
- [ ] Fix mini-calendar bottom-row clipping on Y-axis
- [ ] Remove moon monikers/titles from moon tooltips
- [ ] Simplify moon mini-calendar:
  - [ ] Remove cell shading
  - [ ] Yellow dot if any moon is full
  - [ ] Black dot if at least one moon is new
- [ ] Ensure highlight ranges fill all days between start and end (not only endpoints)
- [ ] Remove all legacy tier aliases from code (`mundane`, `magical`, `abridged`, `survival`, `magic`) — canonical names are `low`, `medium`, `high`

---

## Phase 4 — Calendar and lore formatting

- [ ] Confirm Ring of Siberys presentation: equatorial placement (inclination 0°), "stands out in daylight" visually reflected
- [ ] Correct Harptos display:
  - [ ] Use tendays (not weekdays)
  - [ ] Each month = 3 rows × 10 columns
  - [ ] Column labels: `1st` through `10th`
  - [ ] Date format: `16th of <Month>, <Year> DR`

---

## Architecture (no phase)

- [ ] Specific-date weather reveals: GM generates to target date, reveals single date only (not everything in between), then changes location back. No UI noise about other-location data.

---

## Acceptance checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
