# Many-Worlds Platform Refactor Plan

## Purpose

Turn this script into a many-worlds platform that supports a growing library of fantasy settings without accumulating world-specific conditionals in shared engine code.

This is a medium-to-large structural refactor, not a rewrite from scratch.

## Scope Decisions

- One active world per campaign.
- Only built-in worlds. No homebrew world authoring consideration.
- No backward compatibility required — there are no existing users or campaigns to migrate.
- All terms, keys, and structures may be rewritten as if from scratch.
- Command names may change freely.
- Smaller mergeable phases, not one large branch.

## First-Wave Worlds

| World | Special Behavior |
| --- | --- |
| Eberron | Planes plugin, rich moon hooks, 12 moons |
| Toril / Harptos | Festival-strip intercalary rendering, tenday weeks |
| Gregorian | Leap-day strategy, standard Earth moon |
| Greyhawk | Intercalary week-block rendering, 2 moons |
| Dragonlance | Conjunction anchor, hidden Nuitari, 336-day year |
| Exandria | Visible-window Ruidus, seeded drift formulas |
| Mystara | Hidden Patera, 336-day year |
| Birthright | 8-day week, 12×32 months + 4 festival days |

Dark Sun is out of scope for this wave.

## Target Architecture

### 1. World Package Layer

A single `WorldDefinition` type becomes the source of truth for each world. Data currently split across `CALENDAR_SYSTEMS`, `SEASON_SETS`, `MOON_SYSTEMS`, and event-source allowlists consolidates under this layer.

```ts
type WorldDefinition = {
  key: string;
  label: string;
  description: string;
  eraLabel: string;
  defaultDate: WorldDate;
  calendar: CalendarDefinition;
  seasons: SeasonDefinition;
  moons?: MoonSystemDefinition;
  planes?: PlaneSystemDefinition; // Eberron only
  eventPacks?: EventPackDefinition[];
  capabilities: WorldCapabilities;
  setup: SetupDefinition;
  hooks?: WorldHooks;
};
```

### 2. Calendar Definition Layer

Calendar definitions declare their behavior explicitly instead of relying on ad hoc world checks.

```ts
type CalendarDefinition = {
  key: string;
  label: string;
  weekdays: string[];
  weekdayAbbr?: Record<string, string>;
  monthStructure: MonthStructureDefinition;
  namingOverlays: NamingOverlayDefinition[];
  defaultOverlayKey: string;
  weekdayProgressionMode: 'continuous_serial' | 'month_reset' | 'festival_fixed';
  intercalaryRenderMode: 'banner_day' | 'festival_strip' | 'week_block' | 'regular_grid';
  dateFormatStyle: 'ordinal_of_month' | 'month_day_year' | 'festival_name_only' | 'custom';
  parseAliases?: ParseAliasDefinition;
};
```

This lets the engine say "Harptos uses `festival_strip`" and "Greyhawk uses `week_block`" without scattered world checks.

### 3. Moon System Layer

The moon engine splits into: generic cycle engine, world moon data, moon behavior modes, and world sky extras.

```ts
type MoonSystemDefinition = {
  label: string;
  anchorStrategy: 'per_moon_anchor' | 'conjunction_anchor' | 'visibility_anchor' | 'seed_only';
  bodies: MoonBodyDefinition[];
  behaviors?: MoonSystemBehavior[];
};

type MoonBodyDefinition = {
  key: string;
  name: string;
  title?: string;
  color?: string;
  associatedMonth?: number | null;
  phaseMode: 'standard_phase' | 'always_full_when_visible' | 'hidden_phase' | 'derived_only';
  cycleMode: 'fixed' | 'seeded_drift_uniform' | 'seeded_drift_triangular' | 'custom';
  baseCycleDays?: number;
  cycleFormula?: string;
  visibilityMode?: 'normal' | 'hidden_by_default' | 'visible_window' | 'gm_only';
  anchorRole?: MoonAnchorRole;
  data?: Record<string, unknown>;
};
```

World-specific behaviors:
- **Dragonlance**: `conjunction_anchor` with hidden Nuitari (`hidden_by_default` visibility)
- **Exandria**: Ruidus uses `visible_window` + `always_full_when_visible`
- **Mystara**: Patera uses `hidden_by_default`
- **Greyhawk**: Luna (28d) and Celene (91d), both standard
- **Birthright**: One 32-day moon, standard

**Dragonlance moon anchor rules**: Setting any single moon's phase shifts ALL moons to preserve Night of the Eye alignment. The script must call this out explicitly when it happens. The Eye anchor date can be set at any point after initialization, not just during setup.

**Player vs GM visibility**: The only distinction is player vs GM. Per-player moon visibility is not required and will never be.

### 4. Capability and Hook Layer

World-specific subsystems are enabled by capabilities, not world-name checks.

```ts
type WorldCapabilities = {
  moons: boolean;
  weather: boolean;
  planes: boolean; // Eberron only — other worlds use events for planar effects
  defaultEvents: boolean;
  worldHooks: boolean;
};

type WorldHooks = {
  setup?: WorldSetupHooks;
  calendar?: CalendarHooks;
  moons?: MoonHooks;
  weather?: WeatherHooks;
  ui?: UiHooks;
};
```

Planes remain Eberron-specific rather than becoming a generic capability. Other worlds capture planar effects through the event system where appropriate.

### 5. Setup Engine Layer

`src/setup.ts` becomes a generic step runner. Built-in step types plus optional world-defined steps.

Step types: world picker, structural variant picker, naming overlay picker, date picker, season model picker, hemisphere picker, theme picker, default event pack toggle, moon system toggle, world-specific moon anchor step, optional subsystem toggles, weather mode, weather location, review/apply.

World-specific setup behavior:
- **Dragonlance**: Ask for Night of the Eye anchor. Offer "Set Date" (Roll20 query for user-entered text with prompted syntax) or "Randomize" (deterministic from campaign seed).
- **Exandria**: Default to seed-driven drift. Optional manual moon anchor tools available later.
- **Greyhawk**: No special moon anchor step.
- **Eberron**: Planar setup when planes capability is enabled.

### 6. Runtime State Layer

State persists keys and answers, not copied definitions. Static world data stays out of persistent state.

```ts
state.CALENDAR = {
  schemaVersion: 2,
  world: {
    key: "dragonlance",
    structuralVariant: "moonlocked",
    namingOverlay: "solamnic",
    seed: "...",
    setupAnswers: { ... }
  },
  calendar: { current: { ... } },
  events: { custom: [ ... ], packState: { ... } },
  moons: { anchors: { ... }, overrides: { ... }, revealState: { ... } },
  subsystems: { weather: { ... }, planes: { ... } }
}
```

### 7. Module Layout

Suggested target (evolve from current layout):

```
src/worlds/types.ts
src/worlds/index.ts
src/worlds/eberron.ts
src/worlds/faerun.ts
src/worlds/gregorian.ts
src/worlds/greyhawk.ts
src/worlds/dragonlance.ts
src/worlds/exandria.ts
src/worlds/mystara.ts
src/worlds/birthright.ts
src/engine/calendar-core.ts
src/engine/calendar-format.ts
src/engine/calendar-parse.ts
src/engine/moon-core.ts
src/engine/moon-behaviors.ts
src/engine/setup-engine.ts
src/engine/world-hooks.ts
src/subsystems/weather.ts
src/subsystems/planes/eberron.ts
```

### 8. Event Pack Model

Default events move under world packages. Packs can declare compatibility rules and be individually disabled. Source priorities remain a separate user setting. Event packs should be populated from appropriate canon sources for each world.

### 9. Weather and Subsystems

Weather remains a generic subsystem. Worlds may attach optional weather hooks. Eberron-specific effects (e.g., Zarantyr full moon weather) move behind named hooks. Planes stay as an Eberron-specific subsystem.

### 10. README Refactor

The README gets a "Supported Settings" section with subsections for each world. Each subsection includes: calendar structure, moons, default holidays/events, and any world-specific mechanics.

## World Data Summary

### Greyhawk
- 7-day week
- 12 × 28 regular months + 4 festival weeks (intercalary)
- Luna: 28-day cycle
- Celene: 91-day cycle
- Needs `week_block` intercalary rendering

### Dragonlance (336-day model)
- 12 × 28 regular months
- Solinari: 36-day cycle
- Lunitari: 28-day cycle
- Nuitari: 8-day cycle (hidden from players by default)
- Night of the Eye repeats every 504 days
- Setup anchors from Night of the Eye (user-entered date or deterministic random from seed)

### Exandria (328-day year)
- Catha: seeded drift `29 + 1d11`
- Ruidus: seeded drift `164 + 1d20 - 1d20`, effectively full when visible, needs visibility-window behavior

### Mystara (336-day year)
- 7-day week
- Matera: primary visible moon
- Patera: hidden moon (GM-only by default)

### Birthright
- 8-day week
- 12 × 32 months + 4 festival days
- One 32-day moon

## Refactor Phases

### Phase 1: World Definition Types and Migration of Existing Worlds

- Create `src/worlds/types.ts` with all type definitions
- Create world packages for Eberron, Faerun, Gregorian
- Create `src/worlds/index.ts` registry
- Wire existing code to read from world packages instead of parallel registries
- Keep all existing behavior identical

### Phase 2: Extract Calendar Strategies

- Remove hard-coded Faerunian and Gregorian checks from date-math, formatting, and rendering
- Introduce explicit progression, formatting, and intercalary strategy dispatch
- Calendar behavior driven by `CalendarDefinition` properties

### Phase 3: Extract Moon Strategies

- Split generic moon logic from Eberron-specific data and hooks
- Introduce anchor strategies and visibility modes
- Support standard, hidden, and visibility-window moons

### Phase 4: Refactor Setup

- Replace fixed wizard flow with a generic step engine
- Allow world-defined setup questions (e.g., Dragonlance Night of the Eye anchor)
- Use Roll20 query syntax for user-entered text where possible

### Phase 5: Move Eberron Features Behind Capabilities

- Planes become Eberron-only behind `capabilities.planes`
- Eberron-specific moon/weather hooks move into named world hooks
- No generic engine module checks `calendarSystem === 'eberron'`

### Phase 6: Add First-Wave Worlds

Order: Greyhawk, Dragonlance, Exandria, Mystara, Birthright.

Each new world addition includes: world package definition, event pack with canon sources, tests, and README documentation.

### Phase 7: README Refactor

Add "Supported Settings" section with per-world subsections covering calendar, moons, events, and mechanics.

## Acceptance Criteria

- Adding a new standard world mostly means adding one world package file
- No generic engine module uses direct `calendarSystem === ...` checks for normal world behavior
- Existing three worlds work identically through the new architecture
- Setup can inject world-defined questions
- Moon engine supports standard, hidden, and visibility-window moons
- Eberron planes are capability-driven
- Tests protect all world behaviors
