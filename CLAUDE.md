# Eberron Calendar — Roll20 API Script

## What This Is
A Roll20 API script (`eberron-calendar.js`) for managing an Eberron campaign calendar. It integrates calendar display, weather generation, moon phase tracking, planar event forecasting, and nighttime lighting into a single GM tool with player-facing reveals.

**Primary canon source**: Keith Baker's published Eberron material. Lore fidelity is a hard constraint.

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
2. `📋 Today` | `📅 Upcoming` | `🌤 Weather` | `🌙 Moons` | `🌀 Planes`
3. `⚙ Admin`

`!cal today` = deep-dive all subsystems for today (GM only)
`!cal upcoming` = 7-day strip with subsystem highlights (GM only)

### Key Design Principles
- **Lore fidelity is a hard constraint** — mechanical systems reflect narrative logic
- **Information tiers reflect quality of knowledge**, not method of acquisition
- **Generated vs canon events are categorically distinct** — generated gated behind higher tiers
- **Smart date parsing**: one number = next occurrence of that day, two = month day, three = month day year
- **Weather generates for active location only** — reveals only present for active location
- **Manifest zones** are parallel to location (set separately, cleared on location change)

## File Structure
Single file: `eberron-calendar.js` (~12,300 lines)
All state stored in Roll20's `state` object.

## Current Known Issues / TODO
See DESIGN.md for the full todo list and pending design decisions.
