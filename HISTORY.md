# HISTORY.md (draft)

Compact record of how this repo arrived at its current scope. Read only
if you need to understand why something that looks obviously useful was
cut, or why the source tree contains modules the design doc no longer
mentions. For the current target, read `CLAUDE.md` and `DESIGN.md`.

---

## The path

1. **Roll20 API script.** Started as a simple chat calendar for Eberron.
2. **Moon phases.** Added because Eberron has 12 moons. Each got a
   synodic period anchored to canon plus a real-Solar-System orbital
   analog (e.g., Zarantyr = Luna, Vult = Oberon). Worked.
3. **Weather.** Added a mechanics-forward weather model: temperature
   band (-5 to 15, 10°F each), wind (0-5), precipitation (0-5), with
   D&D-facing effects (visibility tiers, difficult terrain, hazard
   advisories), climate/geography/terrain inputs, continuity nudging.
   Worked, but heavy.
4. **Planes.** Added the 13 Eberron planes with canonical orbits
   (Daanvi 400yr, Thelanis 225yr, Dolurrh 100yr, etc.) plus a
   GM-seedable "generated off-cycle events" subsystem with d20/d100
   triggers and mechanism classes (`standard`, `linked`, `moontied`,
   `hybrid_moon`, `cooldown`, `sealed`).
5. **Time of day.** Added because weather wanted morning/afternoon/
   evening/late-night windows.
6. **Forecast lens / knowledge tiers.** Unified all three subsystems
   under a zone-based information model (zones A/B/C/D = today / 2-3 /
   4-6 / 7-10 days out; DC ladder 10/15/20/25; quality ranks with
   upgrade-only writes; "tail" zones A'/B' extending past the earned
   edge; per-event off-center uncertainty windows seeded from
   `(eventSerial, eventKey, worldSeed)`; auto-sharpening as events slide
   into closer zones). Genuinely elegant on paper. Hellish to debug in
   chat HTML.
7. **Sky simulator.** Added moon altitude/azimuth, sun angles, eclipse
   detection, "long shadows" framing for Eberron, equirectangular sky
   projection with the Ring of Siberys rendered as a band. Four rounds
   of sky-renderer patches (see legacy `sky-renderer-*.md`).
8. **Many-worlds refactor.** Generalized from Eberron-only to a
   `WorldDefinition` layer covering Eberron, Faerûn (Harptos), Greyhawk,
   Dragonlance (Krynn), Exandria, Mystara, Birthright, Gregorian.
   Capability-driven (`{ moons, weather, planes, defaultEvents, ... }`)
   rather than world-name `switch` statements.
9. **Roll20 chat UX strain.** Even with all the above gated behind
   tiers, the chat HTML constraints (no `<script>`, limited inline CSS,
   `/direct` strips buttons, ~1.8s renders) made the experience worse
   per feature added.
10. **Handouts.** Tried structured per-moon and per-plane handouts with
    render-stamp staleness detection and batched async writes. Hit the
    `journalfolder` read-only constraint and the rate-limited
    `set('notes', ...)` problem.
11. **Roll20 pages.** Tried embedding "live" calendar renders into a
    bound Roll20 page (`!cal moon page bind <name>`, redraw on date
    change). Functional but fiddly and only useful for the moon view.
12. **Showcase site.** Spun out a GitHub Pages preview at `/site/`,
    primarily to validate the sky simulator outside the Roll20 sandbox.
13. **Web app.** Promoted the showcase into a real Vite + React +
    Tailwind app with a Workers AI weather narrator, deployed to
    Cloudflare Workers. Moved into a separate monorepo
    (`mcherry1/party-buff`).
14. **Refocus.** Concluded that the Roll20 sandbox was the wrong host
    for everything past "what's on the calendar today." Cut weather,
    sky, eclipses, forecast-lens, generated planar events, time-of-day,
    handouts, manifest zones, Ring of Siberys lighting, GM seed
    prompts, knowledge tiers. Kept date math, moon phases, canon
    planar events as event entries, custom events, GM controls.

## What survived into the current design

- **Eight worlds.** The many-worlds work made the engine portable; the
  list of worlds is the same.
- **Eberron moon → real-moon mapping.** The 12-moon table with synodic
  periods and reference analogs is the seed data the engine uses for
  Eberron moon phases. Synodic periods, anchors, and the `998-01-01`
  epoch are still meaningful inputs to the engine. Inclination/
  eccentricity/albedo no longer matter (no sky position) but the
  periods do.
- **Faerûn calendar shape.** Harptos's 12×30-day months + 5 intercalary
  festivals + Shieldmeet (leap every 4) survives in the engine's
  `WorldCalendar` shape (`weekdayProgression: 'festival_fixed'`,
  `Month.isIntercalary`, `Month.leapEvery`).
- **Krynn's three moons.** Solinari (36d), Lunitari (28d), Nuitari (8d,
  black, invisible to common observers). The engine returns phase data
  for all three; whether Nuitari is hidden from a non-GM caller is a
  wrapper concern (and currently: no — players see what the GM sees).
- **Canon planar cycles for Eberron.** The phase tables in
  `DESIGN.md` §8.3 (Daanvi 400yr, Dolurrh 100yr, Fernia 5yr with 28-day
  windows anchored Therendor 1, 998 YK, etc.) seed the engine's
  `planes` module. The wrapper exposes them as event entries via
  `planes.activeOn(date)` and `planes.upcoming(date, window)`.
- **Roll20 chat HTML lessons.** The button-emit pattern, the `/direct`
  stripping rule, the inline-CSS subset, the JSON state size pressure —
  all carried forward (see `DESIGN.md` §4).
- **`state.PartyBuffCalendar` as the persistence key.** Roll20 state is
  the only durable store; everything stays small and versioned.

## What did not survive

- The temperature/wind/precipitation model and all derived mechanics.
- Climate, geography, and terrain location data and the location wizard.
- Manifest zones (parallel-to-location toggle UI; weather modifiers).
- Aryth-and-manifest-zone reminder/warning loop.
- All sky-position math: altitude, azimuth, hour angle, sun position,
  long shadows.
- Eclipse detection (solar, lunar, occultation, total/partial/transit
  classification, coverage percent, sky-position-aware visibility).
- Nighttime lighting / photometry / lux thresholds / cloud-cover
  multipliers.
- Ring of Siberys as a lighting contributor.
- Generated off-cycle planar events, all six mechanism classes, the
  expected-per-year dice tables, GM seed-anchor prompts.
- Three-tier knowledge model (`low`/`medium`/`high`), the DC ladder
  (10/15/20/25), the zone system (A/B/C/D), the quality ladder, the
  tail behavior (A'/B'), per-event off-center placement, auto-sharpening
  uncertainty windows.
- Per-subsystem reveal commands (`!cal weather reveal ...`,
  `!cal moon send medium 56d`, `!cal planes send high 3m`).
- Handout creation, render stamps, batched refresh, folder-setup
  instructions.
- The bound Roll20 page redraw flow (`!cal moon page bind/refresh/show`).
- The showcase site code under `src/showcase/` and `site/`.
- Setup-wizard questions about era labels, color themes, hemisphere,
  season models, event source ordering, planar mechanics opt-in.
- The "GM seed prompts for Eberron planar campaign impact" design task.

## Why the legacy is still on disk

The user is reviewing these drafts before deleting the old files. Until
that PR lands, every legacy module is still in `src/`, every legacy
test in `test/`, every legacy doc at the repo root. Once the design
docs are accepted, the source-tree cleanup follows.

If you opened this repo and saw `src/weather.ts`, `src/planes.ts`,
`src/moon.ts` (225 KB), `src/time-of-day.ts`, `src/persistent-views.ts`,
`src/showcase/`, or any `sky-renderer-*.md` — that is legacy. The
current scope is in `DESIGN.md`.
