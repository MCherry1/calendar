# Alternate Planes Subsystem Design Document

## 1) Overview and scope

The alternate planes subsystem models planar proximity states over time and exposes both canonical cycles and optional off-cycle anomalies.

Implemented behavior includes:

- per-plane canonical phase models,
- fixed vs cyclic plane handling,
- seeded anchors and GM anchor overrides,
- generated/anomalous events with suppression controls,
- reveal-tiered player forecast delivery,
- weather and manifest-zone interaction hooks.

## 2) Design goals and inspirations

- **Lore-forward cadence:** preserve iconic Eberron planar timing patterns while allowing campaign-level adjustment.
- **Predictable core, surprising edges:** deterministic canonical cycles plus optional generated off-cycle events.
- **GM authority:** direct phase overrides, anchor edits, seed pinning, and event suppression.
- **Operational readability:** clear labels/emoji/transition windows for quick in-session interpretation.

## 3) Data model

## 3.1 Canon definitions

Primary structures:

- `PLANE_DATA` by calendar system (Eberron canonical set in this script).
- `PLANE_PHASE_LABELS` and emoji maps.
- reveal/range controls:
  - `PLANE_REVEAL_TIERS`
  - `PLANE_PREDICTION_LIMITS`
  - `PLANE_GENERATED_LOOKAHEAD`
  - `PLANE_MEDIUM_PRESETS` / `PLANE_HIGH_PRESETS`
  - `PLANE_REVEAL_RANGE_OPTIONS`

Each plane entry may include:

- type (`fixed` or `cyclic`),
- orbit windows (`orbitYears`, coterminous/remote durations),
- anchor settings (`anchorYear`, optional month/day, optional `seedAnchor`),
- special links (`linkedTo`, floating starts, remote sub-cycles),
- associated moon and lore notes.

## 3.2 Generated anomaly profiles

Off-cycle logic is controlled via anomaly profile data and supporting helpers:

- mechanism types (e.g., standard, cooldown, moon-qualified/hybrid, sealed),
- deterministic day checks using seeded dice helpers,
- per-event durations/phase-bias rules,
- suppression and scan windows for active-event detection.

## 3.3 Runtime planar state

Planar state stores:

- GM phase overrides,
- anchor overrides,
- seed overrides for seed-anchored planes,
- generated-event suppression markers,
- GM custom events,
- player reveal tier/horizons.

## 4) Processing pipeline

## 4.1 Canonical phase evaluation

For each date/plane:

1. resolve active anchor (GM override > plane default > seed-derived),
2. calculate phase position (coterminous/waning/remote/waxing) for cyclic entries,
3. return fixed phase for fixed planes unless temporary override applies,
4. apply plane-specific special logic (e.g., Mabar split-cycle, Irian floating starts).

## 4.2 Generated/off-cycle overlay

When enabled (`offCyclePlanes: true`):

- evaluate deterministic anomaly starts,
- extend through anomaly duration windows,
- suppress on sealed planes, GM-overridden/anchored planes, or explicitly suppressed events,
- avoid stacking with canon-active windows and nearby GM custom events.

## 4.3 Reveal and forecast

- GM view can inspect full timelines.
- Player sends are tiered (`low`, `medium`, `high`) with different canonical/generated horizons.
- Horizon upgrades are monotonic (expand-only) for already-revealed audiences.

## 5) Commands and operator controls

Planar command family:

- `!cal planes`
- `!cal planes on <dateSpec>`
- `!cal planes upcoming [span]`
- `!cal planes send [low|medium|high] [range]`
- `!cal planes set <name> <phase> [days]`
- `!cal planes clear [<name>]`
- `!cal planes anchor <name> <phase> <dateSpec>`
- `!cal planes seed <name> <year|clear>`
- `!cal planes suppress <name> [dateSpec]`

## 6) Cross-subsystem interactions

- Planar state contributes major weather modifiers and special overrides.
- Some anomaly mechanisms depend on moon state checks.
- Planar notes appear in global “today/upcoming” composite views.
- Location manifest zones provide local planar flavor separate from global cycle state.

## 7) Tuning and extension guidance

- Add planes by extending `PLANE_DATA` and (if needed) anomaly profiles.
- Prefer seed-anchored behavior for deterministic campaign portability.
- Validate generated-event scan limits when adding very long anomalies.
- Re-check weather interaction balance after changing coterminous/remote durations.
