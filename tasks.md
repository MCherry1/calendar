# Tasks

**Repository:** `mcherry1/calendar`

This backlog is grouped by system and ordered for practical implementation.

---

## Phase 1 — Core math and simulation

### Weather

- [ ] Apply Daanvi probability correction (`d20` gate + `d10` remote/cot split).
- [ ] Verify long-run target of ~16.8 Daanvi events/year with 10-day spans.
- [ ] Add Zarantyr full-moon lightning boost (including clear-sky cases).
- [ ] Remove any remaining Zarantyr-only wind/precip special bonus.
- [ ] Remove any residual Shavarath wind effect.

### Moons and orbital behavior

- [ ] Remove legacy aliases not needed for compatibility.
- [ ] Stop clamping Lharvion eccentricity; change reference moon instead if needed.
- [ ] Align Barrakas/Therendor inclinations for more frequent eclipses.
- [ ] Add weak anti-phase coupling (Therendor full vs. Barrakas new).
- [ ] Give Dravago the highest inclination.
- [ ] Add adjusted-synodic multiplier column for all selected moon references.
- [ ] Audit full/new thresholds to prevent repeated multi-day phase triggers.

### Eclipses and crossings

- [ ] Revisit eclipse math for consecutive-day anomalies.
- [ ] Add time-of-day labels to eclipses and moon crossings:
  - [ ] Early hours `0–6`
  - [ ] Morning `6–12`
  - [ ] Afternoon `12–5`
  - [ ] Evening `5–10`
  - [ ] Night `10–0`

---

## Phase 2 — State mechanics and controls

### Planes

- [ ] Add independent toggle: **generated planar events**.
- [ ] Keep master planar toggle separate from generated-events toggle.
- [ ] Update plane-state indicators (green/red + up/down arrow system).

### Manifest zones

- [ ] Add **Set Manifest Zone** beneath **Set Location**.
- [ ] Build 2-column zone table with `None + 12 zones` and per-zone On/Off controls.
- [ ] Support multiple active zones.
- [ ] Clear active zones on location change.
- [ ] Append cleared zones to location update message.
- [ ] Add Aryth full reminder in moon-aware summaries.
- [ ] Track zones activated during Aryth-full and show follow-up warning after date advance.

---

## Phase 3 — UI and presentation cleanup

- [ ] Fix Today view to omit unset extreme-event placeholder.
- [ ] Reduce Today-view clutter (layout pass pending direction).
- [ ] Ensure players can access basic `!cal` + Today + other allowed views.
- [ ] Add tooltip line breaks between entries.
- [ ] Fix mini-calendar bottom-row clipping.
- [ ] Remove moon monikers from tooltip moon names.
- [ ] Simplify moons mini-calendar:
  - [ ] Remove cell shading
  - [ ] Yellow dot when any moon is full
  - [ ] Black dot when any moon is new
- [ ] Ensure range highlighting fills all in-range days.

---

## Phase 4 — Calendar and lore formatting

- [ ] Implement Harptos tenday layout (3 rows × 10 columns per month).
- [ ] Use Harptos labels `1st`–`10th`.
- [ ] Format Harptos dates as `16th of <Month>, <Year> DR`.
- [ ] Confirm Ring of Siberys presentation is equatorial and visible in daytime scenes.

---

## Acceptance checks

- [ ] Simulation changes have deterministic tests where practical.
- [ ] UI changes are verified in all relevant views (GM + player where applicable).
- [ ] Today summary reflects only active, present-day effects.
## 1) Weather system updates

- [ ] Confirm and apply terminology/detail updates from the latest weather notes (no code-logic changes beyond requested behavior tweaks).
- [ ] Fix **Daanvi** trigger math:
  - [ ] Replace `d100 (100)` gate with `d20 (10)` then `d10` split.
  - [ ] Use `d10` mapping: `1–5 = remote`, `6–10 = coterminous`.
  - [ ] Verify target annual cadence: **16.8 events/year** with **10-day lengths**.
  - [ ] Preserve balancing behavior that biases toward flipping state.
- [ ] Add Zarantyr weather interaction:
  - [ ] Increase lightning/thunderstorm chance when **Zarantyr is full**, including possible clear-sky lightning.
  - [ ] Keep storms still more likely when normal storm conditions also apply.
- [ ] Remove any special wind/precipitation bonus tied specifically to **Zarantyr** (all moons already affect wind/water generally).
- [ ] Confirm whether any **Shavarath wind effect** remains; remove it entirely if present.

## 2) Planar event toggles and planar UI/state

- [ ] Add a dedicated toggle to enable/disable **generated planar events** independently from the overall planar system toggle.
- [ ] Rework planes view status indicators:
  - [ ] Green bubble = Coterminous
  - [ ] Red bubble = Remote
  - [ ] Up/down arrows for waxing/waning transition states

## 3) Moon/orbit model revisions

- [ ] Remove legacy moon names/aliases from code/state where they are no longer needed (safe because no production game-state compatibility requirement yet).
- [ ] Revisit **Lharvion eccentricity** handling:
  - [ ] Stop clamping eccentricity away from reference-moon value.
  - [ ] If conflict/overlap exists, choose a different reference moon instead of mutating orbital parameter.
  - [ ] Investigate whether overlap risk is caused by orbital radius and/or inclination interactions.
- [ ] Model **Barrakas/Therendor** near-shared orbits:
  - [ ] Bring inclinations closer to support more frequent Therendor→Barrakas eclipses.
  - [ ] Add weak anti-phase coupling so “Therendor full while Barrakas new” is favored but not hard-locked.
- [ ] Model **Dravago** as typically distant from other moons by assigning highest inclination among moons.
- [ ] Revisit reference-moon assignments with updated lore constraints.
- [ ] Extend moon comparison table with adjusted scaled periods:
  - [ ] Keep scaled-to-Eberron-year baseline.
  - [ ] Add integer multiplier field to lengthen too-short synodic periods.
  - [ ] Show resulting adjusted period per moon (same concept already used for Zarantyr/Luna).
- [ ] Validate moon phase math:
  - [ ] Investigate why full/new may appear across multiple consecutive days.
  - [ ] Re-check definition thresholds for full/new.

## 4) Manifest zone system (location-parallel mechanics)

- [ ] Confirm Fernia/Risia modifiers are handled in location-parallel fashion and preserve existing temperature +/- behavior for coterminous/remote states.
- [ ] Add **Set Manifest Zone** control below **Set Location**.
- [ ] Build manifest-zone selection UI as 2-column table:
  - [ ] Column A = 13 options: `None` + 12 zones.
  - [ ] Column B = toggle buttons per zone (`On` / `Off`; active zone shows `Off` button).
  - [ ] Active zones in Column A are **bold**.
  - [ ] Inactive zones are fainter + *italic*.
- [ ] Support multiple active manifest zones simultaneously.
- [ ] Add GM reminder in moon-inclusive summary/today view:
  - [ ] If Aryth is full, show: **“Aryth is full. Consider a manifest zone.”**
- [ ] Add Aryth-full tracking flag in state:
  - [ ] If a zone was activated while Aryth was full, then after date advance and Aryth no longer full, show warning:
    - [ ] **“Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z…”**
- [ ] On location change:
  - [ ] Clear all active manifest zones.
  - [ ] Append cleared-zone info to location update message:
    - [ ] **“X, Y, Z Manifest Zone(s) cleared.”**
- [ ] Include active manifest zone status in **Today** presentation (no forecast mechanic for zones).

## 5) Today/basic player views

- [ ] Verify player `!cal` experience includes:
  - [ ] Basic calendar view.
  - [ ] Buttons to additional calendar views (similar navigation to GM view, with player-appropriate info limits).
  - [ ] A **Today** view listing all current-day active effects (weather, moon states, events, manifest zones, etc.).
- [ ] Fix Today-view bug where extreme event is shown even when none is set.
- [ ] Refactor Today view for lower clutter (pending direction on final layout/content grouping).

## 6) Calendar systems and formatting

- [ ] Apply Harptos correction:
  - [ ] Use **tendays** (not weekdays).
  - [ ] Each month renders as 3 rows × 10 columns.
  - [ ] Column labels: `1st` through `10th`.
  - [ ] Date format: **“16th of X, YYYY DR”**.

## 7) Astronomical/lore presentation checks

- [ ] Verify Ring of Siberys rendering/logic:
  - [ ] Ensure equatorial placement (“stretches over the equator”).
  - [ ] Ensure visible/prominent in daytime display.

## 8) Eclipse/crossing math and timing

- [ ] Review solar-eclipse math where eclipses appear on multiple consecutive days unexpectedly.
- [ ] Add time-of-day tagging for eclipses:
  - [ ] Early Morning `0–6`
  - [ ] Morning `6–12`
  - [ ] Afternoon `12–6`
  - [ ] Evening `6–10`
  - [ ] Late Night `10–0`
- [ ] Apply same time-of-day treatment to moon-crossing events.

## 9) UI polish / visualization fixes

- [ ] Tooltip entries: insert line breaks between each entry.
- [ ] Fix mini-calendar bottom row clipping on Y-axis.
- [ ] Remove moon monikers from tooltip moon labels.
- [ ] Simplify moons mini-calendar visuals:
  - [ ] Remove cell shading.
  - [ ] Show yellow dot if any moon is full.
  - [ ] Show black dot if at least one moon is new.
- [ ] Fix range highlighting so all days between start/end are highlighted, not just endpoints.

## 10) Suggested implementation order

- [ ] Phase 1 (stability/math): Daanvi math, moon phase math, eclipse/crossing timing, Lharvion/Barrakas/Therendor/Dravago orbital updates.
- [ ] Phase 2 (state mechanics): manifest-zone state/actions, location-clear behavior, Aryth reminders/warnings.
- [ ] Phase 3 (UI): planes bubbles/arrows, moons mini-calendar simplification, tooltip and clipping fixes, full-range highlighting.
- [ ] Phase 4 (content/format): Harptos tenday layout/date format, Today-view declutter pass, Ring of Siberys presentation checks.
