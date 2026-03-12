# Eberron Calendar — Roll20 API Script

## What This Is
A Roll20 API script (`calendar.js`) for managing an Eberron campaign calendar. It integrates calendar display, weather generation, moon phase tracking, planar event forecasting, and nighttime lighting into a single GM tool with player-facing reveals.

**Primary canon source**: Keith Baker's published Eberron material. Lore fidelity is a hard constraint.

---

## Development Workflow

This project is developed entirely with coding agents. Before doing any work, orient yourself with the files below.

### The three files you need

**`DESIGN.md`** — Authoritative design document. Architectural decisions, mechanical systems, complete data tables, development history. Read the relevant section before implementing anything. Do not implement something differently from what DESIGN.md says unless the discrepancy is explicitly noted.

**`tasks.md`** — Implementation backlog. Every item here is ready to code — the design is decided and the approach is clear. Work from this file. When you complete a task, mark it `[x]`. Do not add tasks here without a decided design.

**`design/`** — Active design discussions. Each file is a topic where the design is NOT yet decided. Do not implement anything described only in `design/` — it is there specifically because it is not ready for coding. When a discussion concludes, the agent updates DESIGN.md and adds tasks to tasks.md.

### Pipeline: idea → code

```
Undecided question
  → create design/<topic>.md
  → design-discussion agent researches and decides
  → update DESIGN.md with decision
  → add implementation tasks to tasks.md
  → delete or archive the design/ file

Ready task
  → coding agent implements from tasks.md
  → marks task [x] when done
```

### Rules

- **Only implement from tasks.md.** If something is only in `design/`, it is not ready.
- **Read DESIGN.md first.** Don't guess at architectural intent — it's documented.
- **Don't add tasks to tasks.md for undecided design.** If you discover something that needs a design decision, create a `design/` file for it.
- **Upgrade-only for DESIGN.md.** Design decisions are additive. Don't remove content from DESIGN.md unless explicitly asked.

---

## Architecture Overview

### Entry Point
`!cal` → shows the current month mini-calendar with subsystem highlights (weather one-liner, notable moons, planar state). GM gets navigation buttons; players get a simpler view.

### Subsystems
1. **Events** — Calendar events with colors, sources, recurring support
2. **Weather** — Location-based procedural generation with seeded RNG. Rolling forecast window. Temperature, precipitation, wind, fog, extreme events.
3. **Moons** — 12 moons of Eberron with real orbital mechanics (synodic periods, inclinations, eclipse geometry). Random walk variation on all moons.
4. **Planes** — 13 planes with canonical cycles + generated anomalous events. Flicker profiles per plane.
5. **Nighttime Lighting** — Lux calculation from moon illumination + weather cloud cover → D&D light conditions.

### Three-Tier Knowledge System (low / medium / high)
All subsystems use unified tier names. No legacy "mundane/magical/abridged" in new code.

**Source labels** (player-facing, non-magical language):
- Low → "Common Knowledge"
- Medium → "Skilled Forecast"
- High → "Expert Forecast"

#### Weather Tiers
- **Low**: Today's weather (obvious). Tomorrow's rough guess (seeded from today).
- **Medium**: 3-day forecast. Today = full detail, days 2-3 = moderate.
- **High**: Full 10-day forecast with period breakdowns and mechanics.

#### Moon Tiers
- **Low**: Current phases + next 2 days. All predictions use uncertainty windows.
- **Medium**: Presets 1m/3m/6m/10m (DC 10/15/20/25). First full synodic cycle = exact. Beyond one cycle = uncertainty windows.
- **High**: Full exact knowledge for entire range. No uncertainty.

#### Plane Tiers
- **Low**: Fixed annual canon events (full calendar, always). Non-annual canon events revealed when currently active (recognized, full duration shown). **Generated events never shown at low**, even for present day.
- **Medium**: Canon for full year (336 days) always. Generated events for short window (1d/3d/6d/10d presets with DC hints).
- **High**: Full knowledge (canon + generated) for 1m/3m/6m/10m presets.

### Reveal System
- Per-serial storage: `{ tier: 'low'|'medium'|'high', source: string }`
- **Upgrade-only**: new info never downgrades existing knowledge
- **Location-aware**: weather reveals stored with location context
- Planes track `revealHorizonDays` (canon reach) and `generatedHorizonDays` (generated reach) separately
- Past-date pruning clears old reveals for memory management

### GM Interface (`!cal`)
Button bar (three rows):
1. `⏮ Back` | `⏭ Forward` | `📣 Send`
2. `📋 Today` | `🌤 Weather` | `🌙 Moons` | `🌀 Planes`
3. `⚙ Admin`

`!cal today` = deep-dive all subsystems for today (GM only)

### Key Design Principles
- **Lore fidelity is a hard constraint** — mechanical systems reflect narrative logic
- **Information tiers reflect quality of knowledge**, not method of acquisition
- **Generated vs canon events are categorically distinct** — generated gated behind higher tiers
- **Smart date parsing**: one number = next occurrence of that day, two = month day, three = month day year
- **Weather generates for active location only** — reveals only present for active location
- **Manifest zones** are parallel to location (set separately, cleared on location change)

## File Structure
Single file: `calendar.js` (~12,300 lines)
All state stored in Roll20's `state` object.
