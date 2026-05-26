# Engine Consumer Contract

This repo (`mcherry1/calendar`, the Roll20 API script) will consume
`@partybuff/calendar-engine` (published from `mcherry1/party-buff`). This
document is the contract: it describes the API surface the Roll20 wrapper
needs from the engine. It is written for the engine author so that the
engine can be designed to fit without churn.

The engine may expose more than what is listed here. This document only
specifies what the Roll20 wrapper imports.

This is a draft. Open questions are called out inline. Sign-off comes via
PR review on both sides before v0.1.0 is published.

---

## 1. Package metadata

- **Name:** `@partybuff/calendar-engine`
- **Registry:** GitHub Packages (`https://npm.pkg.github.com`)
- **Auth:** consumers authenticate via `GITHUB_PACKAGES_TOKEN` in CI; local
  dev uses a `.npmrc` with a personal access token. Document the auth steps
  in the package README.
- **Module format:** ESM. The Roll20 wrapper is bundled with esbuild
  (`format: 'iife'`, `target: 'es2020'`), so the engine must be tree-shakeable
  ESM with no Node-only runtime imports (`fs`, `path`, etc.) in the modules
  this wrapper consumes. Pure modules only on the hot path. CommonJS would
  bundle but is discouraged.
- **Types:** ships its own `.d.ts`. No `@types/...` shim package.
- **Side effects:** the modules listed below must be marked
  `"sideEffects": false` (or list explicit side-effect files) so esbuild can
  drop unused exports.

## 2. Boundary rule

The Roll20 wrapper imports **only pure, deterministic functions and data**
from the engine. Anything that touches Roll20's runtime (`sendChat`,
`findObjs`, `state.*`, message dispatch, button HTML, persistent views,
command parsing, knowledge-tier UX) stays in `src/` of this repo and is
not the engine's concern.

The engine must not assume a host environment. No `window`, no `document`,
no `process.env`, no `globalThis.state`, no I/O.

## 3. Worlds the wrapper needs on day one

The Roll20 wrapper exposes a world selector with the following worlds. All
must be present in `worlds.list()` and resolvable via `worlds.get(id)`:

| id            | Label                  | Notes                              |
|---------------|------------------------|------------------------------------|
| `eberron`     | Eberron                | Has moons (12) and planar cycles   |
| `faerun`      | Faerûn (Harptos)       | Has moons (Selûne); intercalary    |
| `greyhawk`    | Greyhawk               | Has moons (Luna, Celene)           |
| `dragonlance` | Dragonlance (Krynn)    | Has moons (Solinari, Lunitari, Nuitari) |
| `exandria`    | Exandria               | Has moons (Catha, Ruidus)          |
| `mystara`     | Mystara                | Has moons (Matera)                 |
| `birthright`  | Birthright (Cerilia)   | Has moons (Lirovka)                |
| `gregorian`   | Earth (Gregorian)      | No moons in engine output (see §5) |

A world id is a stable string. Adding more worlds later is non-breaking.

## 4. Module layout

The wrapper imports from these subpaths. Names are proposed; the engine
author can adjust as long as the shapes survive.

```
@partybuff/calendar-engine/worlds      → world definitions + registry
@partybuff/calendar-engine/date        → serial date math
@partybuff/calendar-engine/moons       → moon phase calculation
@partybuff/calendar-engine/planes      → Eberron planar events
@partybuff/calendar-engine/colors      → color utilities + hex helpers
@partybuff/calendar-engine             → barrel re-export of the above
```

The wrapper prefers subpath imports so that unused systems (e.g., planes
for non-Eberron games) tree-shake cleanly.

## 5. API surface

All function inputs are validated by the engine; invalid inputs throw with
descriptive errors, not silent fallbacks. All outputs are immutable
(`readonly` fields or `Object.freeze`).

### 5.1 Worlds

```ts
type WorldId =
  | 'eberron' | 'faerun' | 'greyhawk' | 'dragonlance'
  | 'exandria' | 'mystara' | 'birthright' | 'gregorian';

interface World {
  readonly id: WorldId;
  readonly label: string;          // display name, e.g. "Eberron"
  readonly description: string;    // one-paragraph blurb
  readonly eraLabel: string;       // "YK", "DR", "CY", "PD", ""
  readonly calendar: WorldCalendar;
  readonly defaultDate: CalendarDate;
  readonly moons: readonly Moon[]; // empty if world has none in engine output
  readonly hasPlanarCycles: boolean; // true only for 'eberron' in v0.1.0
  readonly holidays: readonly Holiday[];
  readonly seasons: readonly Season[];
}

interface WorldCalendar {
  readonly weekdays: readonly string[];      // e.g. ['Sul','Mol','Zol','Wir','Zor','Far','Sar']
  readonly months: readonly Month[];
  readonly daysPerYear: number;              // sum of month.days for a non-leap year
  readonly weekdayProgression: 'continuous' | 'month_reset' | 'festival_fixed';
}

interface Month {
  readonly index: number;          // 0-based position in the year
  readonly name: string;           // "Zarantyr", "Hammer", etc.
  readonly days: number;           // calendar days in this month
  readonly isIntercalary: boolean; // e.g. Shieldmeet, Midwinter
  readonly leapEvery?: number;     // present only if month exists on leap years (e.g. Shieldmeet every 4)
}

interface CalendarDate {
  readonly year: number;           // signed integer, era is the world's eraLabel
  readonly monthIndex: number;
  readonly day: number;            // 1-based
}

interface Holiday {
  readonly key: string;            // stable, lowercase, e.g. 'sun_blessing'
  readonly label: string;          // "Sun's Blessing"
  readonly monthIndex: number;     // -1 if floating; see §5.3
  readonly day: number;            // 1-based; -1 if floating
  readonly description?: string;
}

interface Season {
  readonly key: string;
  readonly label: string;
  readonly startMonthIndex: number;
  readonly startDay: number;
}

const worlds: {
  list(): readonly WorldId[];
  get(id: WorldId): World;        // throws on unknown id
};
```

**Open question:** "floating" holidays (anchored to a moon phase or planar
event rather than a fixed date) — does the engine resolve these to concrete
dates at query time, or are they declarative and the consumer resolves them?
I lean toward declarative + a separate `resolveHoliday(date, world)` call.

### 5.2 Date math

Dates flow across the boundary as either `CalendarDate` (year/month/day) or
`Serial` (integer day count from a per-world epoch). The engine owns the
conversion. The wrapper never does its own day arithmetic.

```ts
type Serial = number; // integer; per-world epoch is internal to engine

const date: {
  // conversions
  toSerial(world: WorldId, date: CalendarDate): Serial;
  fromSerial(world: WorldId, serial: Serial): CalendarDate;

  // arithmetic
  advance(world: WorldId, date: CalendarDate, days: number): CalendarDate;
  retreat(world: WorldId, date: CalendarDate, days: number): CalendarDate;
  diffDays(world: WorldId, from: CalendarDate, to: CalendarDate): number;

  // calendar queries
  weekdayIndex(world: WorldId, date: CalendarDate): number;     // index into world.calendar.weekdays
  daysInMonth(world: WorldId, year: number, monthIndex: number): number;
  daysInYear(world: WorldId, year: number): number;             // accounts for leap
  isLeapYear(world: WorldId, year: number): boolean;

  // parsing / formatting (lenient; engine owns the rules)
  parse(world: WorldId, input: string): CalendarDate | null;
  format(world: WorldId, date: CalendarDate, style?: 'long' | 'short' | 'ordinal'): string;
};
```

**Behavior commitments:**
- `advance`/`retreat` are inverses for non-negative inputs.
- `diffDays(a, b)` + `advance(a, n)` = `b` when `n = diffDays(a, b)`.
- `fromSerial(world, toSerial(world, d))` round-trips exactly.
- Leap days/intercalary days are counted. The engine handles them; the
  wrapper never special-cases them.
- `parse` returns `null` on unparseable input; does not throw.

### 5.3 Moons

The wrapper needs moon **phases** only. Not sky position, not altitude,
not azimuth, not eclipse math. Anything related to where a moon sits in
the sky belongs to the web app side.

```ts
interface Moon {
  readonly key: string;            // stable, lowercase, e.g. 'olarune'
  readonly name: string;           // "Olarune"
  readonly title?: string;         // "The Sentinel" — optional flavor
  readonly color: string;          // hex, e.g. "#c7a25a"
  readonly cycleDays: number;      // synodic period, integer or decimal
  readonly associatedMonthIndex?: number; // for worlds where a moon "rules" a month
}

type MoonPhaseLabel =
  | 'New'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

interface MoonPhase {
  readonly moonKey: string;
  readonly illumination: number;   // 0.0 (new) .. 1.0 (full)
  readonly waxing: boolean;        // true while approaching full
  readonly label: MoonPhaseLabel;
  readonly isFull: boolean;        // engine decides threshold per world
  readonly isNew: boolean;         // engine decides threshold per world
}

const moons: {
  // all moons for a world on a given date
  phasesOn(world: WorldId, date: CalendarDate): readonly MoonPhase[];

  // single moon, single date
  phaseOf(world: WorldId, moonKey: string, date: CalendarDate): MoonPhase;

  // when is the next Full / New for this moon, starting from date?
  // returns the date of that event, or null if not within `withinDays`.
  nextEvent(
    world: WorldId,
    moonKey: string,
    fromDate: CalendarDate,
    event: 'full' | 'new',
    withinDays?: number,           // default 365
  ): CalendarDate | null;
};
```

**Removed from the Roll20 surface but the engine may still expose for the
web app:** sky position, altitude, azimuth, hour angle, eclipse detection,
sun-relative geometry, "long shadows" (Eberron) framing. The wrapper does
not import these.

**Open question:** the current Roll20 script has a "long shadows" concept
(an Eberron month-window where the moon framing changes). If we want that
visible in the Roll20 calendar (as a flag on the phase output), we'd need
something like `MoonPhase.longShadows?: boolean`. I lean toward dropping
it from the Roll20 surface entirely — it was tied to sky rendering. Flag
if you disagree.

### 5.4 Planes (Eberron only)

The Roll20 wrapper surfaces planar events as entries in the **events**
list — not as their own subsystem. So the engine only needs to expose
"what planes are active on this date" and "when does the next phase change
happen." No subsystem-level queries, no GM overrides, no generated drifts.
Canon-anchored only.

```ts
type PlanarPhase = 'coterminous' | 'remote' | 'neutral';

interface Plane {
  readonly key: string;            // 'daanvi', 'fernia', etc.
  readonly name: string;           // "Daanvi"
  readonly title: string;          // "The Perfect Order"
  readonly color: string;          // hex
  readonly associatedMoonKey?: string;
  readonly effects: {
    readonly coterminous: string;  // GM-facing one-liner
    readonly remote: string;
  };
}

interface PlanarState {
  readonly plane: Plane;
  readonly phase: PlanarPhase;
  readonly daysIntoPhase: number;
  readonly daysUntilNextPhase: number;
  readonly nextPhase: PlanarPhase;
  readonly phaseDuration: number;  // total days in the current phase
}

const planes: {
  // all planes for Eberron on a given date
  statesOn(date: CalendarDate): readonly PlanarState[];

  // single plane on a single date
  stateOf(planeKey: string, date: CalendarDate): PlanarState;

  // only the planes currently in a non-neutral phase (coterminous or remote)
  // — this is what the events list surfaces
  activeOn(date: CalendarDate): readonly PlanarState[];

  // upcoming phase changes in a window — for "what's coming up" lists
  upcoming(
    fromDate: CalendarDate,
    withinDays: number,
  ): readonly { plane: Plane; from: PlanarPhase; to: PlanarPhase; on: CalendarDate }[];
};
```

**Notes:**
- The engine seeds Eberron's planar cycles from canon. No GM-tunable
  anchors. No "generated drifts" / off-cycle shifts that the current Roll20
  script supports. Canon-only.
- `WorldId` argument is omitted on plane functions because planes are
  Eberron-only in v0.1.0. If another world later gains planes, we revisit.
- `activeOn` exists so the Roll20 events view can do
  `events.concat(planes.activeOn(today))` without filtering neutrals client-side.

### 5.5 Colors

The wrapper renders chat HTML for Roll20. It needs hex strings per moon
and per plane (already on `Moon.color` and `Plane.color`), plus a couple
of contrast utilities so we don't ship readability bugs.

```ts
const colors: {
  // returns '#RRGGBB' or null
  sanitizeHex(input: string): string | null;

  // accepts hex or CSS color name; returns '#RRGGBB' or null
  resolve(input: string): string | null;

  // foreground that meets contrast on the given background
  textOn(bgHex: string): '#000000' | '#ffffff';
};
```

No per-month color in the engine. The wrapper will derive month colors
from `Moon.color` for worlds with month-aligned moons (Eberron), or fall
back to a static palette in `src/` for worlds without.

## 6. What is **not** in this contract

The engine may build these for the web app. The Roll20 wrapper does not
import them and the contract makes no commitments about their shape:

- Weather subsystem (climate matrices, location, seasonal modifiers,
  forecasting, narrative ambience)
- Time-of-day / sun position / horizon math
- Moon sky position (altitude, azimuth, compass, hour angle)
- Eclipse detection and eclipse math
- Forecast-lens knowledge-tier system (DC ladders, zones A/B/C/D, tails)
- Custom-event storage (lives in Roll20 `state.*`, not engine)
- Anything UI: layouts, components, rolltemplates, button HTML
- Roll20 API objects (`sendChat`, `findObjs`, `playerIsGM`, etc.)

## 7. Versioning

- `0.1.0` — first published version. Anything in this document is fair
  game for breaking changes between minors during the `0.x` line.
- `1.0.0` — when both sides agree the API is stable enough to commit to
  semver. The Roll20 wrapper will pin a caret range (`^1.0.0`) at that
  point.
- The wrapper's `package.json` will track the engine version via a normal
  npm dep. A weekly cron in this repo opens a bump PR when a newer release
  is available (separate work, not part of this contract).

## 8. Open questions

Collecting things the engine author and I should resolve before v0.1.0:

1. **Floating holidays** — declarative + `resolveHoliday()` or
   engine-resolved at query time? (§5.1)
2. **"Long shadows" framing** — drop from Roll20 surface, keep on
   `MoonPhase`, or omit entirely? (§5.3)
3. **Per-world epoch** — is the `Serial` namespace per-world or global?
   I've drafted per-world. (§5.2)
4. **Intercalary days inside `daysInMonth`** — are they counted as part
   of the surrounding month, or returned by a separate query? (§5.1, §5.2)
5. **Holiday `monthIndex: -1` / `day: -1`** sentinel for "floating" — or
   a separate `FloatingHoliday` type? (§5.1)
6. **Naming overlays** — Faerûn has Old Calendar / Harptos / etc. names
   for the same months. Does `Month.name` return the canonical, or is
   there a `Month.aliases?: string[]`? Roll20 needs at least the canonical
   string; aliases are nice-to-have for `date.parse()`.
7. **Worlds with no moons in engine output** — Gregorian currently has no
   moon entry. Is that "moons: []" or absent? I've drafted "moons:
   readonly Moon[]" (always present, sometimes empty). (§5.1)

## 9. Reference: what the wrapper does with this

For grounding. None of this affects the contract.

- **State persistence:** Roll20 wrapper persists `{ worldId, currentDate,
  customEvents, viewPreferences, version }` in `state.PartyBuffCalendar`.
- **GM commands:** `!cal set world <id>`, `!cal set date <date>`,
  `!cal advance N`, `!cal retreat N`, `!cal event add|remove|list`,
  `!cal send <view>`, `!cal show <view>`, `!cal help`.
- **Views:** today, month, moons (phases only), planes-as-events,
  holidays, help. Button-first UX; `!cal` is the only chat entry point.
- **Player surface:** read-only views, no admin controls. No knowledge
  tiers — full information for all players.

---

*Status: draft. The engine author should treat the open questions as
discussion items, not blockers. I'll iterate this doc as we resolve them.*
