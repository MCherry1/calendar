# Moons Subsystem Design Document

## 1) Overview and scope

The moon subsystem supports **three moon-system variants** with deterministic phase behavior, reveal-tier forecasting, and gameplay-facing outputs:

- **Eberron**: twelve moons with lore-linked orbital personalities and Long Shadows interactions.
- **Faerûnian**: Selûne as Toril’s single moon with a Harptos-aligned cycle.
- **Gregorian/Earth**: Luna as a real-world baseline with standard astronomical cadence.

Across all variants, the implementation includes:

- canonical moon metadata and orbital tuning,
- seeded phase sequence generation,
- player reveal horizons and source attribution,
- moon command panels and send-to-player workflows,
- integration hooks for weather and planar anomaly logic where applicable.

## 2) Design goals and inspirations

- **Lore fidelity with playable clarity:** preserve each moon’s narrative identity while keeping outputs usable at the table.
- **Astronomy-inspired mechanics:** use synodic periods, inclination/eccentricity/albedo proxies, and eclipse/crossing checks rather than purely decorative labels.
- **Deterministic reproducibility:** seeded calculations support consistent results for long-running campaigns.
- **Progressive reveal:** player information can be staged from low to high granularity.

## 3) Data model

### 3.1 Core constants and tables

Key moon constants in the script include:

- `EBERRON_MOON_CORE_DATA` (Eberron moon color, diameter, distance, and reference analog).
- `MOON_SYSTEMS` (all supported systems and per-moon orbital/persona data).
- `MOON_ORBITAL_DATA` and `MOON_MOTION_TUNING` (visual and motion tuning).
- `MOON_LORE` (player-facing descriptive lore blocks).
- prediction and reveal controls:
  - `MOON_PRE_GENERATE_YEARS`
  - `MOON_PREDICTION_LIMITS`
  - `MOON_REVEAL_TIERS`
  - `MOON_REVEAL_PRESETS`
  - `MOON_REVEAL_RANGE_OPTIONS`

### 3.2 Runtime state

Moon runtime state stores generated sequence windows, reveal tier/horizon, and shared player-facing reveal records so information can be progressively disclosed without recomputing from scratch.

## 4) Supported moon systems

### 4.1 Eberron moon system

Eberron uses twelve moons with distinct orbital signatures and lore bindings. The script models:

- moon-by-moon synodic periods and variation amplitudes,
- seeded epoch anchoring (`epochSeed`) for deterministic full/new timing,
- special handling for setting-specific events (including Long Shadows interactions and soft festival nudges),
- multi-moon outputs (phase table, crossings, eclipses, night-light aggregation, and Zarantyr-weighted tide emphasis).

#### Eberron candidate moons (reference-only)

> **Scope note:** this candidate/reference mapping is **Eberron-only** and is used for design discussion of Eberron moon analog intent. It does **not** apply to the Faerûnian (Selûne) or Gregorian/Earth (Luna) variants.

Candidate analog mapping is documented in script comments and core tables (`EBERRON_MOON_CORE_DATA`, `EBERRON_MOON_AMBIGUITIES`) and intentionally separated from non-Eberron systems.

### 4.2 Faerûnian moon system (Toril / Selûne)

Faerûnian mode uses a **single moon**, Selûne:

- moon: `Selûne` (`title`: *The Moonmaiden*),
- synodic period: **30.4375 days**,
- anchor: **full at midnight Hammer 1, 1372 DR**,
- epoch seed: `selune` with reference date `1372-01-01`,
- orbital tuning proxies in script: inclination `5.1`, eccentricity `0.054`, albedo `0.25`, variation amplitude `1.5`,
- physical values in script: diameter `~2000 mi`, distance `~183000 mi`.

Design intent notes in script:

- `48` synodic cycles = `1461` days = one full 4-year Harptos leap span (including Shieldmeet), giving a clean long-cycle reset.
- Selûne contributes to phase outputs exactly like other systems, with single-moon simplification (no inter-moon crossing set).
- Lore flavor includes association with lycanthropy, divination/navigation, tides, and the Tears of Selûne.

### 4.3 Gregorian moon system (Earth / Luna)

Gregorian mode uses a **single moon**, Luna:

- moon: `Luna` (`title`: *The Moon*),
- synodic period: **29.53059 days**,
- anchor: known full moon on **2021-01-28**,
- epoch seed: `luna` with reference date `2021-01-28`,
- orbital tuning proxies in script: inclination `5.14`, eccentricity `0.0549`, albedo `0.12`, variation amplitude `0.5`,
- physical values in script: diameter `2159 mi`, distance `238855 mi`.

Design intent notes in script:

- Gregorian mode serves as a familiar astronomical baseline.
- The same deterministic sequence and reveal-tier pipeline is reused from the shared subsystem.
- Single-moon behavior removes Eberron-only interactions (e.g., Long Shadows and Eberron multi-moon candidate analog discourse).

## 5) Processing pipeline

### 5.1 Sequence preparation

- The subsystem pre-generates moon sequences around “today” and requested forecast windows.
- Horizons are expanded on demand and are upgrade-only for reveal requests.
- Serial-date conversion is delegated to core calendar utilities.

### 5.2 Phase and visibility evaluation

For each moon/day:

- compute normalized phase position,
- derive illuminated fraction and phase labels,
- classify practical visibility windows,
- include special notes (e.g., long-shadows/new/full qualifiers).

### 5.3 Secondary phenomena

Additional modeled outputs include:

- eclipse/notable overlap checks,
- moon crossing proximity signals,
- aggregated night-light estimates (albedo + phase + geometry approximations),
- tide emphasis tied to system moon data (with Eberron-specific Zarantyr weighting).

### 5.4 Reveal and delivery model

- GM can retain high-fidelity access.
- Player outputs are tiered (`low`, `medium`, `high`) with bounded horizons.
- Reveal records are upgrade-only to prevent information loss after stronger reveals.

## 6) Commands and operator controls

Representative moon commands in the script:

- `!cal moon` (moon panel/today summary)
- `!cal moon on <dateSpec>`
- `!cal moon upcoming [span]`
- `!cal moon send [low|medium|high] [range option]`
- reveal and range controls through panel presets/range options.

(Exact menu/button labels are generated in the command/panel helpers.)

## 7) Cross-subsystem interactions

- Moon notes are included in combined “today/upcoming” summaries.
- Moon context contributes to some planar anomaly mechanisms (moon-qualified triggers).
- Tidal output is surfaced via weather-facing displays for appropriate location profiles.

## 8) Tuning and extension guidance

- Keep Eberron canon fields (`color`, `diameter`, `distance`) separated from speculative analog mapping to avoid drift.
- If adjusting synodic periods or phase thresholds, re-verify full/new duplication edge cases and eclipse frequency.
- For new calendar systems, add a corresponding `MOON_SYSTEMS` profile or explicit fallback behavior.
- Preserve reveal-tier limits to keep player info economy consistent across campaigns.
