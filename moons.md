# Moons Subsystem Design Document

## 1) Overview and scope

The moon subsystem models Eberron-style lunar behavior with deterministic phase sequences, reveal-tier forecasting, and gameplay-facing outputs (phase state, eclipses, moon crossings, night-light/tides).

The implementation includes:

- canonical moon metadata and orbital tuning,
- seeded phase sequence generation,
- player reveal horizons and source attribution,
- moon command panels and send-to-player workflows,
- integration hooks for weather and planar anomaly logic.

## 2) Design goals and inspirations

- **Lore fidelity with playable clarity:** preserve each moon’s narrative identity (associated plane/dragonmark/month) while keeping outputs usable at the table.
- **Astronomy-inspired mechanics:** use synodic periods, inclination/eccentricity/albedo proxies, and eclipse/crossing checks rather than purely decorative labels.
- **Deterministic reproducibility:** seeded calculations support consistent results for long-running campaigns.
- **Progressive reveal:** player information can be staged from low to high granularity.

## 3) Data model

## 3.1 Canon and tuning tables

Key tables/constants include:

- `EBERRON_MOON_CORE_DATA` (color, diameter, distance, reference analog).
- `MOON_SYSTEMS` (moon list and per-moon orbital/persona data).
- `MOON_ORBITAL_DATA` and `MOON_MOTION_TUNING` (visual and motion tuning).
- `MOON_LORE` (player-facing descriptive lore blocks).
- prediction and reveal controls:
  - `MOON_PRE_GENERATE_YEARS`
  - `MOON_PREDICTION_LIMITS`
  - `MOON_REVEAL_TIERS`
  - `MOON_REVEAL_PRESETS`
  - `MOON_REVEAL_RANGE_OPTIONS`

## 3.2 Runtime state

Moon state stores generated sequence windows, reveal tier/horizon, and shared player-facing reveal records so information can be progressively disclosed without recomputing from scratch.

## 4) Processing pipeline

## 4.1 Sequence preparation

- The subsystem pre-generates moon sequences around “today” and requested forecast windows.
- Horizons are expanded on demand and are upgrade-only for reveal requests.
- Serial-date conversion is delegated to core calendar utilities.

## 4.2 Phase and visibility evaluation

For each moon/day:

- compute normalized phase position,
- derive illuminated fraction and phase labels,
- classify practical visibility windows,
- include special notes (e.g., long-shadows/new/full qualifiers).

## 4.3 Secondary phenomena

Additional modeled outputs include:

- eclipse/notable overlap checks,
- moon crossing proximity signals,
- aggregated night-light estimates (albedo + phase + geometry approximations),
- tide emphasis tied to Zarantyr for campaign-facing coastal effects.

## 4.4 Reveal and delivery model

- GM can retain high-fidelity access.
- Player outputs are tiered (`low`, `medium`, `high`) with bounded horizons.
- Reveal records are upgrade-only to prevent information loss after stronger reveals.

## 5) Commands and operator controls

Representative moon commands in the script:

- `!cal moon` (moon panel/today summary)
- `!cal moon on <dateSpec>`
- `!cal moon upcoming [span]`
- `!cal moon send [low|medium|high] [range option]`
- reveal and range controls through panel presets/range options.

(Exact menu/button labels are generated in the command/panel helpers.)

## 6) Cross-subsystem interactions

- Moon notes are included in combined “today/upcoming” summaries.
- Moon context contributes to some planar anomaly mechanisms (moon-qualified triggers).
- Tidal output is surfaced via weather-facing displays for appropriate location profiles.

## 7) Tuning and extension guidance

- Keep canon fields (`color`, `diameter`, `distance`) separated from speculative analog mapping to avoid drift.
- If adjusting synodic periods or phase thresholds, re-verify full/new duplication edge cases and eclipse frequency.
- When adding calendar systems, provide a corresponding `MOON_SYSTEMS` profile or explicit fallback behavior.
- Preserve reveal-tier limits to keep player info economy consistent across campaigns.
