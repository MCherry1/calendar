# Design Tasks

**Repository:** `mcherry1/calendar`

This is the single task and workflow file for all coding agents. For detailed architectural context, data tables, and mechanical design decisions, see [DESIGN.md](DESIGN.md).

**Primary canon source**: Keith Baker's published Eberron material. Lore fidelity is a hard constraint.

---

## Development Workflow

This project is developed entirely with coding agents. Before doing any work, orient yourself with these files:

- **`DESIGN.md`** - Authoritative design document. Architectural decisions, mechanical systems, complete data tables, development history. Read the relevant section before implementing anything. Do not implement something differently from DESIGN.md unless the discrepancy is explicitly noted.
- **`Design Tasks.md`** (this file) - Implementation backlog and workflow rules.
- **`design/`** - Active design discussions. Each file is a topic where the design is NOT yet decided. Do not implement anything described only in `design/` - it is there specifically because it is not ready for coding.

### Pipeline: idea -> code

```text
Undecided question
  -> create design/<topic>.md
  -> design-discussion agent researches and decides
  -> update DESIGN.md with decision
  -> add implementation tasks to this file
  -> delete or archive the design/ file

Ready task
  -> coding agent implements from this file
  -> follows the Task Lifecycle below
```

### Rules

- **Only implement from this file.** If something is only in `design/`, it is not ready.
- **Read DESIGN.md first.** Do not guess at architectural intent - it is documented.
- **Do not add tasks for undecided design.** If you discover something that needs a design decision, create a `design/` file for it.
- **Upgrade-only for DESIGN.md.** Design decisions are additive. Do not remove content from DESIGN.md unless explicitly asked.
- **README is the target-behavior guide** unless a statement is ambiguous; when code does not match README, track the code change here.
- **Keep docs in sync with code.** When changing data tables, constants, or behavior in `calendar.js`, update the corresponding sections in DESIGN.md and README.md in the same commit. The code is the source of truth - docs must never contradict it.

---

## Task Lifecycle

Every task follows this pipeline:

1. **Agent implements the task** from one of the sections below.
2. **When complete**, the agent moves the task into the **Needs Review by Different Agent** section. The entry must include:
   - Which agent completed it (for example, "Claude Opus 4.6", "GPT-5 Codex", "ChatGPT 5.4")
   - The date it was completed
3. **A different agent reviews the task.** An agent must never review work completed by the same agent or a different version of itself. The reviewer must be a genuinely different agent so every task gets two independent looks.
4. **After review passes**, the reviewer removes the task from **Needs Review** entirely. The task is done and the file stays clean.

If the reviewer finds issues, they should fix them in the same pass and then remove the task. If the issues are too large to fix inline, the reviewer moves the task back to the appropriate work section with notes on what needs to be redone.

---

## Needs Design Input

None currently. Add new items here only when the desired implementation behavior is still ambiguous enough to block coding.

---

## Needs Review by Different Agent

None currently.

---

## Agent Ready

### Many-Worlds Platform Refactor — Phase 1: World Definition Types

Create the world-definition type layer and migrate existing worlds (Eberron, Faerun, Gregorian) into it. See `Additional Calendars for Implementation.md` for full architecture. Key deliverables:

- `src/worlds/types.ts` with all type definitions (WorldDefinition, CalendarDefinition, MoonSystemDefinition, etc.)
- `src/worlds/eberron.ts`, `src/worlds/faerun.ts`, `src/worlds/gregorian.ts` world packages
- `src/worlds/index.ts` registry replacing parallel lookups in `CALENDAR_SYSTEMS`, `SEASON_SETS`, `MOON_SYSTEMS`
- Wire existing code to read from world packages
- All existing behavior must remain identical — tests must continue to pass

### Many-Worlds Platform Refactor — Phase 2: Extract Calendar Strategies

Remove hard-coded Faerunian and Gregorian checks from `src/date-math.ts`, `src/rendering.ts`, and `src/ui.ts`. Introduce strategy dispatch driven by `CalendarDefinition` properties: `weekdayProgressionMode`, `intercalaryRenderMode`, `dateFormatStyle`. See `Additional Calendars for Implementation.md`.

### Many-Worlds Platform Refactor — Phase 3: Extract Moon Strategies

Split `src/moon.ts` into generic cycle engine, world moon data, and behavior modes. Introduce anchor strategies and visibility modes. Support standard, hidden, and visibility-window moons. See `Additional Calendars for Implementation.md`.

### Many-Worlds Platform Refactor — Phase 4: Refactor Setup

Replace fixed wizard in `src/setup.ts` with a generic step engine. Allow world-defined setup questions. Use Roll20 query syntax for user-entered text. See `Additional Calendars for Implementation.md`.

### Many-Worlds Platform Refactor — Phase 5: Move Eberron Behind Capabilities

Planes become Eberron-only behind `capabilities.planes`. Eberron-specific moon/weather hooks move into named world hooks. Eliminate all `calendarSystem === 'eberron'` checks from generic engine modules. See `Additional Calendars for Implementation.md`.

### Many-Worlds Platform Refactor — Phase 6: Add First-Wave Worlds

Add Greyhawk, Dragonlance, Exandria, Mystara, and Birthright. Each includes: world package, event pack with canon sources, tests, and README documentation. See `Additional Calendars for Implementation.md` for world data.

### Many-Worlds Platform Refactor — Phase 7: README Refactor

Add "Supported Settings" section to README with per-world subsections covering calendar structure, moons, default events, and world-specific mechanics.

### Named Saved Weather Location Presets

Add a "Save Current Location As..." button to the weather location wizard. Opens a Roll20 query for a user-entered preset name. Saved presets appear before recent entries in the wizard. No predefined presets.

---

## Documentation Tasks

None currently.

---

## Design Tasks

These tasks still need design direction before coding.

None currently.

---

## Acceptance Checks

- [x] Simulation/math changes have deterministic tests where practical
- [x] Moon/plane/today summaries show only active, current-day effects
- [x] GM + player views are verified where behavior differs
- [x] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
- [x] Timed planar overrides are state-tested before start, during window, and after expiry
- [x] Weather lock behavior is regression-tested against reroll and regeneration
- [x] Calendar auto-suppression and manual source suppression are tested independently across calendar switches
- [x] Player moon and planar views are regression-tested for reveal-horizon clipping
