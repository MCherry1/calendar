# Calendar Script Design Notes

This repository contains a Roll20 API calendar engine (`calendar.js`) and a set of design documents that explain the system at two levels:

1. **Core calendar mechanics** (calendar systems, month/week structure, era labeling).
2. **Subsystem mechanics** layered on top of the date engine (events, moons, weather, alternate planes).

## Repository map

- `calendar.js` — executable script and source of truth.
- `calendar-structures.md` — calendar layout mechanics (month length models, intercalary behavior, leap handling).
- `calendar-era-labels.md` — era/year label conventions.
- `events.md` — event subsystem design document.
- `moons.md` — moon subsystem design document.
- `weather.md` — weather subsystem design document.
- `alternate-planes.md` — planar subsystem design document.
- `tasks.md` — working task list.

## Architectural layers

### 1) Base calendar engine

The base layer handles:

- Calendar-system definitions (`eberron`, `faerunian`, `gregorian`).
- Month/weekday naming variants.
- Year/day serial conversion and date parsing.
- Month rendering and range rendering.

This layer is intentionally system-agnostic and drives all downstream subsystems.

### 2) Subsystem layer

Each subsystem consumes the current date/serial timeline and projects additional game-facing state:

- **Events**: fixed/recurring observances and custom campaign entries.
- **Moons**: phase calculations, reveal horizons, eclipse/light/tide hooks.
- **Weather**: deterministic+stochastic daily weather with forecast/reveal controls.
- **Alternate planes**: canonical cycles plus optional generated anomalies.

### 3) Presentation and command layer

The script exposes all systems through `!cal` commands and panel UIs with GM/player reveal controls.

## Design intent

- Keep the core date engine reusable.
- Keep subsystem behavior explicit and tunable in data tables.
- Preserve deterministic behavior where possible (seeded/randomized but reproducible).
- Support multiple campaign styles through toggles, reveal tiers, and source filtering.

## Documentation standard used in subsystem docs

Each subsystem document follows the same structure:

1. Overview and scope.
2. Design goals and inspirations.
3. Data model (constants/state).
4. Processing pipeline.
5. Commands and operator controls.
6. Cross-subsystem interactions.
7. Tuning/extension guidance.
