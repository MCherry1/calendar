# Tasks

**Repository:** `mcherry1/calendar`

Canonicalized task list aligned to `notes.md` (notes are source of truth).

---

## Phase 1 — Core math and simulation

### Weather


- Refactor all temperature generators for all locations and the rntire system to account for the recently updated, new tempersture sacle from -5 to 15. 
- [ ] Apply Daanvi probability correction exactly as described:
  - [ ] Replace `d100 (1)` gate with `d20 (1)` gate
  - Addressed by ChatGPT Codex (GPT-5.2-Codex).
  - [ ] Then split with `d10`: `1–5 = remote`, `6–10 = coterminous`
  - Addressed by ChatGPT Codex (GPT-5.2-Codex).
- [ ] Verify long-run target remains ~16.8 Daanvi events/year with ~10-day durations
  - Addressed by ChatGPT Codex (GPT-5.2-Codex).
- [ ] Keep balancing behavior that biases toward flipping planar state
  - Addressed by ChatGPT Codex (GPT-5.2-Codex).
- [ ] Add Zarantyr full-moon lightning/thunderstorm boost, including clear-sky strike possibility
  - Addressed by ChatGPT Codex (GPT-5.2-Codex).
- [ ] Remove any Zarantyr-only wind/precipitation bonus
- [ ] Remove any Shavarath wind effect entirely
  - Addressed by ChatGPT Codex (GPT-5.2-Codex).

### Moons and orbital behavior

- [ ] Remove legacy names/aliases (safe to delete compatibility references)
- [ ] Stop clamping Lharvion eccentricity
  - [ ] If needed, change Lharvion reference moon instead of modifying eccentricity
  - [ ] Check whether current issue is orbit overlap and resolve without clamping
- [ ] Update Barrakas/Therendor to have closely matched inclinations (more frequent eclipses)
- [ ] Add weak anti-phase coupling so Therendor full aligns more often with Barrakas new, without hard phase lock
- [ ] Give Dravago the highest inclination ("typically keeps distance" from other moons)
- [ ] Revisit all moon reference selections with new lore constraints
- [ ] Extend moon-comparison table with adjusted scaled-period details for **all** moons
  - [ ] Use scaled real-world reference periods to Eberron year length
  - [ ] Apply explicit arbitrary multipliers (default integer multipliers unless a better approach is chosen)
  - [ ] Mirror the Zarantyr/Luna treatment across the rest of the moons
- [ ] Audit full/new thresholds to avoid repeated multi-day full/new triggers unless explicitly intended

### Eclipses and crossings

- [ ] Revisit solar/moon eclipse math for consecutive-day anomalies
- [ ] Add time-of-day labels to eclipses and moon-crossing events:
  - [ ] Early hours `0–6`
  - [ ] Morning `6–12`
  - [ ] Afternoon `12–5`
  - [ ] Evening `5–10`
  - [ ] Night `10–0`

---

## Phase 2 — State mechanics and controls

### Planes

- [ ] Add independent toggle for **generated planar events**
- [ ] Keep existing master planar-system toggle separate
- [ ] Planes view bubble/status system:
  - [ ] Green = Coterminous
  - [ ] Red = Remote
  - [ ] Up/Down arrow for waxing/waning

### Manifest zones

- [ ] Treat manifest zones as location-parallel state (not weather-forecast content)
- [ ] Add **Set Manifest Zone** button below **Set Location**
- [ ] Manifest zone chooser UI:
  - [ ] 2-column table
  - [ ] Column A: `None` + 12 zone names (13 options total)
  - [ ] Column B: per-zone toggle button showing `On` or `Off`
- [ ] Support multiple simultaneously active manifest zones
- [ ] Visual state in zone list:
  - [ ] Active zones in bold
  - [ ] Inactive zones fainter + italic
- [ ] Clear all active manifest zones whenever location changes
- [ ] Append clear-summary to location update message (`X, Y, Z Manifest Zone(s) cleared`)
- [ ] Add moon-summary reminder: `Aryth is full. Consider a manifest zone.`
- [ ] Store flag if any zone was activated while Aryth was full
- [ ] On date advance after Aryth is no longer full, show warning:
  - [ ] `Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z, ...`
- [ ] Include manifest-zone status in Today view (always visible when active)
- [ ] Do **not** include manifest-zone forecasting
- [ ] Keep existing Fernia/Risia temperature ± effects wired through this manifest-zone mechanic

---

## Phase 3 — UI and presentation cleanup

- [ ] Fix Today view to omit extreme-event output when no extreme event is set
- [ ] Reduce Today-view clutter (defer exact redesign direction)
- [ ] Ensure players can use `!cal` for:
  - [ ] Basic calendar view
  - [ ] Buttons to access additional calendar views (similar access surface to GM, with permissions as needed)
  - [ ] Today view listing all current-day effects
- [ ] Add tooltip line breaks between entries
- [ ] Fix mini-calendar bottom-row clipping on Y-axis
- [ ] Remove moon monikers from moon-tooltips
- [ ] Simplify Moons mini-calendar:
  - [ ] Remove cell shading
  - [ ] Yellow dot if any moon is full
  - [ ] Black dot if at least one moon is new
- [ ] Ensure highlight ranges fill all days between start and end (not only endpoints)

---

## Phase 4 — Calendar and lore formatting

- [ ] Confirm Ring of Siberys presentation:
  - [ ] Stretches over the equator
  - [ ] Clearly visible in daytime
- [ ] Correct Calendar of Harptos implementation:
  - [ ] Use **tendays** (not weekdays)
  - [ ] Each month is 3 tendays => display as 3 rows × 10 columns
  - [ ] Column labels are `1st` through `10th`
  - [ ] Date format: `16th of <Month>, <Year> DR`
  - [ ] Era label for Harptos uses Dalereckoning (`DR`)

---

## Acceptance checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
