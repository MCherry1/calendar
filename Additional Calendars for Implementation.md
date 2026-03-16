# Many-Worlds Platform Refactor Design

## Purpose

This document replaces the earlier research-first memo.

The scope has changed. The goal is no longer "add a few more calendars with local patches." The goal is to design a refactor that turns this script into a many-worlds platform that can support a growing library of fantasy settings without the codebase becoming a pile of world-specific conditionals.

This document does not implement the refactor. It defines:

- why the refactor is justified
- what the target architecture should look like
- which world assumptions are currently chosen for the first wave
- what concrete product and engineering questions need explicit answers before implementation starts

## Strategic Conclusion

Yes, a meaningful refactor is justified.

The current codebase is already partly data-driven, but not yet platform-driven. It can absorb a few more conservative worlds, but a true many-worlds roadmap wants a cleaner separation between:

- generic engine behavior
- world definitions
- world-specific subsystem hooks
- setup questions
- runtime state

The right move is a medium-to-large structural refactor, not a rewrite from scratch.

## Working Assumptions Already Chosen

These are the current planning assumptions unless explicitly changed later:

- Dragonlance uses the 336-day interpretation.
- Dragonlance setup anchors the moon system from `Night of the Eye`.
- Dragonlance setup should let the GM set that anchor directly or randomize it.
	- If possible, use the query syntax that prompts user-entered text, rather than ask for an api command.
- Exandria should use seeded drift rather than pretending to have one exact canonical lunar model.
- Exandria `Catha` drift should use `29 + 1d11`.
- Exandria `Ruidus` drift should use `164 + 1d20 - 1d20`.
- `Ruidus` should be treated as effectively full when visible.
- Greyhawk is in scope and looks clean.
- The initial target set should focus on worlds with fixed numbers or easy, defensible interpretations.

## Current Codebase Summary

### What is already strong

The current code already has the beginnings of a platform:

- `src/config.ts` contains `CALENDAR_SYSTEMS`
- `src/constants.ts` contains `SEASON_SETS` and `CALENDAR_STRUCTURE_SETS`
- `src/moon.ts` contains `MOON_SYSTEMS`
- `src/state.ts` has a central `applyCalendarSystem()` path
- `src/date-math.ts` already supports leap/intercalary slots
- non-7-day weeks already work

That means the core idea is good. The problem is not that the repo lacks abstractions. The problem is that the abstractions stop halfway and world-specific logic leaks into shared modules.

### What is currently hard-coded

The pressure points are mostly here:

- `src/state.ts`
  - world capabilities are inferred from `calendarSystem`
  - setup defaults are tied to specific worlds
- `src/setup.ts`
  - wizard flow is fixed and only lightly world-aware
  - only Eberron gets extra subsystem questions
- `src/date-math.ts`
  - Faerunian weekday behavior is hard-coded
  - Gregorian leap-day behavior is hard-coded
- `src/rendering.ts`
  - Harptos-specific festival rendering is hard-coded
  - Gregorian leap-day presentation is hard-coded
- `src/ui.ts`
  - date formatting contains world checks
  - dashboard behavior assumes current world set is tiny
- `src/moon.ts`
  - generic moon math, world data, Eberron lore, Eberron sky extras, tide logic, and planar generation logic all live together
- `src/weather.ts`
  - includes direct Eberron moon and planar hooks
- `src/planes.ts`
  - is Eberron-specific but still tied into shared command/UI paths

### Current architectural risk

If more worlds are added under the current pattern, the repo will likely accumulate:

- more `calendarSystem === ...` branches
- more moon exceptions inside `src/moon.ts`
- more setup exceptions
- more render/parse/date special cases spread across modules

That is exactly what this refactor should prevent.

## Refactor Goals

The refactor should achieve these outcomes:

1. World support becomes mostly declarative.
2. The engine stops inferring capabilities from world keys.
3. Calendar behavior, date formatting, parsing, and intercalary rendering become strategy-driven.
4. Moon behavior supports more than one kind of moon.
5. Setup becomes generic and world-extensible.
6. Eberron-specific systems remain supported without polluting the generic path.
7. Existing campaigns migrate cleanly.
	1. (Author note: no existing campaigns exist. There is no migration required, nor preservation of legacy terms or definitions. All should be re-written as if from scratch, with suitable decisions made.)
8. Adding a new world later should usually mean adding a world package, not editing six unrelated files.

## Non-Goals

This design is not trying to do all of the following now:

- implement every world immediately
- create a full homebrew-world authoring UI
- support simultaneous multiple active worlds in one campaign unless explicitly chosen later
- simulate perfectly realistic astronomy
- rewrite every subsystem at once

## Recommended Product Scope

The recommended product model for the first version of the refactor is:

- one active world per campaign
- many built-in world packages available to choose from
- optional naming overlays and variants inside a world
- world-specific setup steps
- optional world-specific subsystems attached through explicit capabilities and hooks

That gives the benefits of a platform without turning the state model and UI into a multiverse editor on day one.

## Target Architecture

### 1. World Package Layer

Create a first-class world-definition layer. Existing data in `CALENDAR_SYSTEMS`, `SEASON_SETS`, `MOON_SYSTEMS`, and event-source allowlists should be reorganized under this layer.

Suggested top-level shape:

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
  eventPacks?: EventPackDefinition[];
  capabilities: WorldCapabilities;
  setup: SetupDefinition;
  hooks?: WorldHooks;
};
```

### Why this matters

Right now the repo stores calendar data, season data, and moon data in parallel registries. That is workable for three worlds, but it makes platform-scale setup and capability decisions awkward. The world package should become the single source of truth.

### 2. Calendar Definition Layer

The calendar engine should stop relying on ad hoc checks for Faerunian and Gregorian behavior. Instead, calendar definitions should explicitly declare the behavior they need.

Suggested shape:

```ts
type CalendarDefinition = {
  key: string;
  label: string;
  weekdays: string[];
  weekdayAbbr?: Record<string, string>;
  monthStructure: MonthStructureDefinition;
  namingOverlays: NamingOverlayDefinition[];
  defaultOverlayKey: string;
  weekdayProgressionMode: WeekdayProgressionMode;
  intercalaryRenderMode: IntercalaryRenderMode;
  dateFormatStyle: DateFormatStyle;
  parseAliases?: ParseAliasDefinition;
};
```

### Suggested behavior enums

- `weekdayProgressionMode`
  - `continuous_serial`
  - `month_reset`
  - `festival_fixed`
- `intercalaryRenderMode`
  - `banner_day`
  - `festival_strip`
  - `week_block`
  - `regular_grid`
- `dateFormatStyle`
  - `ordinal_of_month`
  - `month_day_year`
  - `festival_name_only`
  - `custom`

### Why this matters

This is what lets the code say:

- Harptos uses `festival_strip`
- Greyhawk uses `week_block`
- Gregorian uses `banner_day`
- Birthright uses an 8-day week with its own label style

without more file-scattered world checks.

### 3. Moon System Layer

The moon engine should be split into:

- generic cycle engine
- world moon data
- moon behavior modes
- world sky extras and cross-subsystem hooks

Suggested shape:

```ts
type MoonSystemDefinition = {
  label: string;
  anchorStrategy: MoonAnchorStrategy;
  bodies: MoonBodyDefinition[];
  behaviors?: MoonSystemBehavior[];
};
```

```ts
type MoonBodyDefinition = {
  key: string;
  name: string;
  title?: string;
  color?: string;
  associatedMonth?: number | null;
  phaseMode: MoonPhaseMode;
  cycleMode: MoonCycleMode;
  baseCycleDays?: number;
  cycleFormula?: string;
  visibilityMode?: MoonVisibilityMode;
  anchorRole?: MoonAnchorRole;
  data?: Record<string, unknown>;
};
```

### Suggested moon behavior enums

- `MoonAnchorStrategy`
  - `per_moon_anchor`
  - `conjunction_anchor`
  - `visibility_anchor`
  - `seed_only`
- `MoonPhaseMode`
  - `standard_phase`
  - `always_full_when_visible`
  - `hidden_phase`
  - `derived_only`
- `MoonCycleMode`
  - `fixed`
  - `seeded_drift_uniform`
  - `seeded_drift_triangular`
  - `custom`
- `MoonVisibilityMode`
  - `normal`
  - `hidden_by_default`
  - `visible_window`
  - `gm_only`

### Why this matters

This is the piece that makes these worlds possible without brittle hacks:

- Dragonlance: `conjunction_anchor` plus hidden `Nuitari`
- Exandria: `visible_window` plus `always_full_when_visible` for `Ruidus`
- Mystara: hidden `Patera`
- Greyhawk: two standard moons with simple cycles
- Birthright: one moon, fixed anchor rhythm

### 4. Capability and Hook Layer

World-specific subsystems should be enabled by capabilities, not by checking world names.

Suggested shape:

```ts
type WorldCapabilities = {
  moons: boolean;
  weather: boolean;
  planes: boolean;
  defaultEvents: boolean;
  customAnchors: boolean;
  worldHooks: boolean;
};
```

```ts
type WorldHooks = {
  setup?: WorldSetupHooks;
  calendar?: CalendarHooks;
  moons?: MoonHooks;
  weather?: WeatherHooks;
  ui?: UiHooks;
};
```

### Why this matters

Examples:

- Eberron can declare `planes: true`
- Greyhawk can declare `planes: false`
- Exandria can declare `customAnchors: true`
- Dragonlance can declare a setup moon anchor question without needing bespoke wizard logic

### 5. Setup Engine Layer

`src/setup.ts` should become a generic step runner with a small set of built-in step types and optional world-defined steps.

Suggested step types:

- world picker
- structural variant picker
- naming overlay picker
- date picker
- season model picker
- hemisphere picker
- theme picker
- default event pack toggle
- moon system toggle
- world-specific moon anchor step
- optional subsystem toggles
- weather mode
- weather location
- review/apply

### Example world-specific setup behavior

- Dragonlance
  - ask for `Night of the Eye`
  - offer `Set Date` or `Randomize`
- Exandria
  - default to seeded random lunar drift
  - optionally allow a moon anchor prompt later
- Greyhawk
  - no special moon anchor step required
- Eberron
  - still exposes planar setup when planes are enabled

### Why this matters

The setup engine becomes a platform feature instead of a list of exceptions.

### 6. Runtime State Layer

The state object should persist runtime choices and derived state, not duplicate static world definitions.

Suggested direction:

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
  calendar: {
    current: { ... },
    resolvedMonths: [ ... ],
    resolvedWeekdays: [ ... ]
  },
  events: {
    custom: [ ... ],
    packState: { ... }
  },
  moons: {
    anchors: { ... },
    overrides: { ... },
    revealState: { ... },
    cachedCycles: { ... }
  },
  subsystems: {
    weather: { ... },
    planes: { ... },
    worldExtras: { ... }
  }
}
```

### Rules for state design

- persist keys and answers, not copied source definitions
- derive resolved month and weekday arrays when applying the active world package
- keep migration code explicit and versioned

### 7. Module Layout

The current file layout can evolve instead of being replaced wholesale.

Suggested target layout:

- `src/worlds/types.ts`
- `src/worlds/index.ts`
- `src/worlds/eberron.ts`
- `src/worlds/faerun.ts`
- `src/worlds/gregorian.ts`
- `src/worlds/greyhawk.ts`
- `src/worlds/dragonlance.ts`
- `src/worlds/exandria.ts`
- `src/worlds/mystara.ts`
- `src/worlds/birthright.ts`
- `src/worlds/darksun.ts`
- `src/engine/calendar-core.ts`
- `src/engine/calendar-format.ts`
- `src/engine/calendar-parse.ts`
- `src/engine/moon-core.ts`
- `src/engine/moon-behaviors.ts`
- `src/engine/setup-engine.ts`
- `src/engine/world-hooks.ts`
- `src/subsystems/weather.ts`
- `src/subsystems/planes/eberron.ts`

This is a design target, not a required exact path map, but the split matters.

### 8. Event Pack Model

Default events should move from "calendar-system scoped lists" toward "world package event packs."

Suggested direction:

- event packs belong to worlds
- packs can still declare compatibility rules
- packs can still be individually disabled
- source priorities remain a separate user setting

This matters because a many-worlds platform should not keep piling all default events into one global constants file.

### 9. Weather and Optional Subsystems

The refactor does not need to rebuild weather first, but it should create a clean extension point.

Recommended direction:

- weather remains a generic subsystem
- worlds may attach optional weather hooks
- planes become an Eberron plugin behind capabilities
- world-specific effects like `Zarantyr full` should move behind named hooks, not stay in generic weather logic

## First-Wave Worlds Under This Platform

These are the worlds that look like good first-wave targets after the refactor baseline exists.

| World | In scope | Special behavior needed | Notes |
| --- | --- | --- | --- |
| Eberron | Yes | Planes plugin, rich moon hooks | Existing deepest implementation |
| Toril / Harptos | Yes | Festival-strip rendering | Existing implementation to migrate |
| Gregorian | Yes | Leap-day strategy | Existing implementation to migrate |
| Greyhawk | Yes | Intercalary week-block rendering | Very clean first addition |
| Dragonlance | Yes | Conjunction anchor, hidden moon | Use 336-day model |
| Exandria | Yes | Visible-window moon, drift formulas | `Ruidus` is special but manageable |
| Mystara | Yes | Hidden moon behavior | Calendar side is very clean |
| Birthright | Yes | 8-day week, festival days | Excellent engine-fit world |
| Dark Sun | Maybe | Merchant's Calendar interpretation | More interpretive |
| Ravenloft | No for first wave | Highly interpretive | Better left for later |
| Nentir Vale | No for first wave | Source confidence weak | Needs separate pass |

## World Assumptions To Carry Into Implementation

### Greyhawk

- 7-day week
- 12 x 28 regular months
- 4 festival weeks
- `Luna` 28-day cycle
- `Celene` 91-day cycle
- needs `week_block` intercalary rendering

### Dragonlance

- use the 336-day model
- treat it as this repo's standard Dragonlance implementation
- setup anchors from `Night of the Eye`
- moons:
  - `Solinari` 36 days
  - `Lunitari` 28 days
  - `Nuitari` 8 days
- `Night of the Eye` repeats every 504 days under this interpretation
- `Nuitari` needs hidden-moon behavior

### Exandria

- 328-day year
- `Catha` uses `29 + 1d11`
- `Ruidus` uses `164 + 1d20 - 1d20`
- `Ruidus` is effectively full when visible
- `Ruidus` needs visibility-window behavior

### Mystara

- 336-day year
- 7-day week
- primary visible moon: `Matera`
- hidden or special moon behavior needed for `Patera`

### Birthright

- 8-day week
- 12 x 32 months plus 4 festival days
- one 32-day moon rhythm should be supported cleanly

### Dark Sun

- only proceed if the Merchant's Calendar interpretation is accepted as the project standard

## Refactor Phases

The refactor should land in phases, not as one blind rewrite.

### Phase 0: Lock Baseline Behavior

Before structural work:

- add regression coverage for current supported worlds
- capture date math behavior
- capture render behavior
- capture setup behavior
- capture baseline moon behavior

### Phase 1: Introduce World Definitions

- create the world-definition layer
- move Eberron, Faerun, and Gregorian into it first
- keep old command behavior intact through adapters

### Phase 2: Extract Calendar Strategies

- remove hard-coded world checks from date math, formatting, and rendering
- introduce explicit progression, formatting, and intercalary strategies

### Phase 3: Extract Moon Strategies

- split generic moon logic from world data and world hooks
- introduce anchor strategies and visibility modes

### Phase 4: Refactor Setup

- replace fixed wizard flow with a step engine
- allow world-defined setup questions

### Phase 5: Move Eberron Features Behind Capabilities

- planes become capability/plugin-driven
- Eberron-specific moon/weather hooks move into named world hooks

### Phase 6: Add First-Wave Worlds

Recommended order:

1. Greyhawk
2. Dragonlance
3. Exandria
4. Mystara
5. Birthright
6. Dark Sun if still desired

## Acceptance Criteria For The Refactor

The design should be considered successful when all of the following are true:

- adding a new standard world mostly means adding one world package
- no generic engine module needs direct `calendarSystem === ...` checks for normal world behavior
- the current three supported worlds are preserved through migration
- setup can inject world-defined questions
- the moon engine can support standard moons, hidden moons, and visibility-window moons
- Eberron planes are capability-driven rather than implied by the world key
- tests protect existing behavior before first-wave worlds are added

## Questions Requiring Explicit Answers Before Implementation

These are the questions I need concrete answers to before I would be comfortable executing the refactor.

Each question includes a recommended answer so decision-making is faster.

### Product Scope

1. Is the platform still limited to one active world per campaign?
   Recommendation: Yes.

2. Are homebrew/custom worlds part of this refactor, or only built-in worlds?
   Recommendation: Build the schema so homebrew is possible later, but do not build a custom-world authoring UI in this refactor.

3. Which worlds are officially in scope for the first post-refactor wave?
   Recommendation: Greyhawk, Dragonlance, Exandria, Mystara, Birthright. Dark Sun as optional second-wave.

4. Must command names remain backward compatible for existing users?
   Recommendation: Yes.

### Data Model

5. Do we want to distinguish between structural calendar variants and naming overlays?
   Recommendation: Yes. Dragonlance and Mystara both benefit from this.

6. Should world definitions live in TypeScript modules or external JSON-like data files?
   Recommendation: TypeScript modules first, with strong typing and no dynamic loader.

7. Should static world data remain out of persistent state?
   Recommendation: Yes. Persist keys and answers, not copied definitions.

8. Should the existing keys `eberron`, `faerunian`, and `gregorian` remain valid aliases forever?
   Recommendation: Yes, at least through migration and for command compatibility.

### Setup and Seeds

9. Should setup become a generic step engine with world-defined extra steps?
   Recommendation: Yes.

10. For Dragonlance, should setup ask for the exact in-world date of `Night of the Eye`, or only offer randomization?
   Recommendation: Offer both exact date and deterministic randomization.

11. For Exandria, should setup ask any moon anchor questions up front?
   Recommendation: Default to seed-driven drift, with optional manual moon anchor tools available later.

12. Should "Randomize" always mean deterministic from the campaign/world seed?
   Recommendation: Yes.

### Moon System

13. Do we need a first-class hidden-moon behavior for player-facing output?
   Recommendation: Yes.

14. Do we need a first-class "always full when visible" moon behavior?
   Recommendation: Yes.

15. Should drift formulas be stored declaratively when simple?
   Recommendation: Yes. Use a simple expression format for formulas like `29 + 1d11` and `164 + 1d20 - 1d20`, with code hooks only when needed.

16. Should per-moon `set full` and `set new` remain available in every world?
   Recommendation: Yes, but some worlds should still prefer a world anchor in setup.

17. Do we need audience-level visibility control right away, such as GM-visible versus player-hidden moons?
   Recommendation: Yes, but audience-level is enough. Do not build per-player moon visibility in this refactor.

### Calendar Engine

18. Should intercalary week rendering become a first-class layout mode?
   Recommendation: Yes.

19. Should date-format behavior be a declared world/calendar strategy?
   Recommendation: Yes.

20. Should world-specific parse aliases be supported so typed commands accept local month and weekday names?
   Recommendation: Yes.

### Subsystems

21. Should planes become a capability/plugin instead of an implied Eberron-only special case?
   Recommendation: Yes.

22. Do we want a general world-hook system for future setting-specific weather, sky, or rules interactions?
   Recommendation: Yes.

23. Should default event packs move under world packages during this refactor?
   Recommendation: Yes.

### Migration and Delivery

24. Must existing campaign states auto-migrate without forcing setup again?
   Recommendation: Yes.

25. How much regression coverage is required before Phase 1 starts?
   Recommendation: Enough to protect month rendering, date math, setup, and current moon output for the existing worlds.

26. Should the work land as a sequence of smaller mergeable phases or one large branch?
   Recommendation: Smaller phases.

27. Should the first implementation phase include any new worlds at all?
   Recommendation: No. First migrate current worlds into the new architecture, then add new worlds.

## Recommended Next Step

Before writing any refactor code, the next best step is a decision pass over the questions above.

If those answers are settled, the implementation plan should become:

1. lock regression tests
2. define world package types
3. migrate Eberron, Faerun, and Gregorian into the new model
4. extract calendar strategies
5. extract moon strategies
6. refactor setup
7. add Greyhawk, Dragonlance, Exandria, Mystara, and Birthright
