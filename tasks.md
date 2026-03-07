# Tasks

**Repository:** `mcherry1/calendar`

Backlog grouped by implementation phase, with duplicate items consolidated.

---

## Phase 1 — Core math and simulation

### Weather

- [ ] Apply Daanvi probability correction (`d20` gate + `d10` remote/cot split)
- [ ] Verify long-run target of ~16.8 Daanvi events/year with 10-day spans
- [ ] Add Zarantyr full-moon lightning boost (including clear-sky cases)
- [ ] Remove any remaining Zarantyr-only wind/precip special bonus
- [ ] Remove any residual Shavarath wind effect

### Moons and orbital behavior

- [ ] Remove legacy aliases not needed for compatibility
- [ ] Stop clamping Lharvion eccentricity; change reference moon instead if needed
- [ ] Align Barrakas/Therendor inclinations for more frequent eclipses
- [ ] Add weak anti-phase coupling (Therendor full vs. Barrakas new)
- [ ] Give Dravago the highest inclination
- [ ] Add adjusted-synodic multiplier column for all selected moon references
- [ ] Audit full/new thresholds to prevent repeated multi-day phase triggers

### Eclipses and crossings

- [ ] Revisit eclipse math for consecutive-day anomalies
- [ ] Add time-of-day labels to eclipses and moon crossings:
  - [ ] Early hours `0–6`
  - [ ] Morning `6–12`
  - [ ] Afternoon `12–18`
  - [ ] Evening `18–22`
  - [ ] Night `22–24`

---

## Phase 2 — State mechanics and controls

### Planes

- [ ] Add independent toggle: **generated planar events**
- [ ] Keep master planar toggle separate from generated-events toggle
- [ ] Update plane-state indicators (green/red + up/down arrow system)

### Manifest zones

- [ ] Add **Set Manifest Zone** beneath **Set Location**
- [ ] Build 2-column zone table with `None + 12 zones` and per-zone On/Off controls
- [ ] Support multiple active zones
- [ ] Clear active zones on location change
- [ ] Append cleared zones to location update message
- [ ] Add Aryth full reminder in moon-aware summaries
- [ ] Track zones activated during Aryth-full and show follow-up warning after date advance

---

## Phase 3 — UI and presentation cleanup

- [ ] Fix Today view to omit unset extreme-event placeholder
- [ ] Reduce Today-view clutter (layout pass pending direction)
- [ ] Ensure players can access basic `!cal` + Today + other allowed views
- [ ] Add tooltip line breaks between entries
- [ ] Fix mini-calendar bottom-row clipping
- [ ] Remove moon monikers from tooltip moon names
- [ ] Simplify moons mini-calendar:
  - [ ] Remove cell shading
  - [ ] Yellow dot when any moon is full
  - [ ] Black dot when any moon is new
- [ ] Ensure range highlighting fills all in-range days

---

## Phase 4 — Calendar and lore formatting

- [ ] Implement Harptos tenday layout (3 rows × 10 columns per month)
- [ ] Use Harptos labels `1st`–`10th`
- [ ] Format Harptos dates as `16th of <Month>, <Year> DR`
- [ ] Confirm Ring of Siberys presentation is equatorial and visible in daytime scenes

---

## Acceptance checks

- [ ] Simulation changes have deterministic tests where practical
- [ ] UI changes are verified in all relevant views (GM + player where applicable)
- [ ] Today summary reflects only active, present-day effects
