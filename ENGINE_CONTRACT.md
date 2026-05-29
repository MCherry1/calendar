# Engine Consumer Contract

This repo (`partybuff/calendar`, the Roll20 API script) will consume
`@partybuff/calendar-engine` (published from `partybuff/party-buff`). This
document is the contract: it describes the API surface the Roll20 wrapper
needs from the engine. It is written for the engine author so that the
engine can be designed to fit without churn.

The engine may expose more than what is listed here. This document only
specifies what the Roll20 wrapper imports.

This contract is the v0.1.0 target. The seven open questions from the
initial draft were resolved with the engine author on 2026-05-26 — see
§8 for the change-log entry. Subsequent revisions ride in their own PRs.

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

**Runtime data is canon, not markdown.** The current per-world definitions
in `partybuff/calendar/src/worlds/*.ts`, `src/moon.ts`, and `src/planes.ts`
are the source of truth for concrete numbers (synodic periods, planar
cycle lengths, anchor dates, holiday calendars). When the engine package
is authored, harvest those files directly. Any synodic periods, anchor
years, or cycle lengths listed elsewhere in this doc or in `HISTORY.md`
are illustrative only and may have rounding drift.

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
  readonly weekdays: readonly string[];          // e.g. ['Sul','Mol','Zol','Wir','Zor','Far','Sar']
  readonly months: readonly Month[];             // canonical month list, never includes intercalaries
  readonly intercalaries: readonly Intercalary[]; // sibling list; empty if none
  readonly daysPerYear: number;                  // sum of all months + applicable intercalaries for a non-leap year
  readonly weekdayProgression: 'continuous' | 'month_reset' | 'festival_fixed';
}

interface Month {
  readonly index: number;                     // 0-based position in the canonical month list
  readonly name: string;                      // canonical, e.g. "Zarantyr", "Hammer"
  readonly aliases?: readonly string[];       // optional alternates (e.g. Faerûn "Old Calendar" names) — parse() accepts; format() ignores
  readonly days: number;                      // calendar days in this month
  readonly leapEvery?: number;                // optional: day-count of this month gains a day on years where year % leapEvery === 0 (e.g. Gregorian February)
}

interface Intercalary {
  readonly key: string;                       // stable, lowercase, e.g. 'shieldmeet', 'greengrass'
  readonly label: string;                     // "Shieldmeet", "Greengrass"
  readonly days: number;                      // calendar days in this intercalary on years where it applies
  readonly insertAfter: { monthIndex: number }; // intercalary sits between this month and the next
  readonly leapEvery?: number;                // optional: present only on years where year % leapEvery === 0 (e.g. Shieldmeet every 4)
}

// Discriminated union so consumers can't accidentally read monthIndex from an intercalary date.
type CalendarDate =
  | { readonly kind: 'month'; readonly year: number; readonly monthIndex: number; readonly day: number }
  | { readonly kind: 'intercalary'; readonly year: number; readonly intercalaryKey: string; readonly day: number };

// Holidays use the same discriminator pattern: fixed-date holidays know their slot;
// floating holidays declare a rule that resolves at query time (see §5.2 resolveHoliday).
type Holiday = FixedHoliday | FloatingHoliday;

interface FixedHoliday {
  readonly kind: 'fixed';
  readonly key: string;
  readonly label: string;
  readonly anchor: CalendarDate;              // month-or-intercalary date, year ignored
  readonly description?: string;
}

interface FloatingHoliday {
  readonly kind: 'floating';
  readonly key: string;
  readonly label: string;
  readonly rule: unknown;                     // opaque to the wrapper; engine owns the shape, consumers call resolveHoliday()
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

**Notes on the date model:**
- Canonical month indices stay 1:1 with each world's cultural month list. Tarsakh is always
  Faerûn's `monthIndex: 3`; Shieldmeet is *not* `monthIndex: 4` — it's an `Intercalary` keyed
  `'shieldmeet'` that `insertAfter: { monthIndex: 6 }` (Flamerule). This protects external
  references that name a month by index.
- A "leap day of an existing month" (Gregorian Feb 29) is `Month.leapEvery: 4` on February;
  the day count goes from 28 → 29. A "leap intercalary" (Shieldmeet) is a whole
  `Intercalary` entry with `leapEvery: 4`. Different canon model, different shape.
- Date arithmetic transitions cleanly across the month/intercalary boundary; see §5.2.

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
  weekdayIndex(world: WorldId, date: CalendarDate): number;                        // index into world.calendar.weekdays
  daysInMonth(world: WorldId, year: number, monthIndex: number): number;           // never folds intercalaries in; returns the month's own count for that year
  daysInIntercalary(world: WorldId, year: number, intercalaryKey: string): number; // returns 0 on years where the intercalary doesn't apply (e.g. Shieldmeet on non-leap years)
  daysInYear(world: WorldId, year: number): number;                                // sums all months + applicable intercalaries
  isLeapYear(world: WorldId, year: number): boolean;

  // floating-holiday resolution: returns the concrete date for a holiday's rule on a given year, or null if it doesn't fall this year
  resolveHoliday(world: WorldId, year: number, holidayKey: string): CalendarDate | null;

  // parsing / formatting (lenient; engine owns the rules)
  parse(world: WorldId, input: string): CalendarDate | null;
  format(world: WorldId, date: CalendarDate, style?: 'long' | 'short' | 'ordinal'): string;
};
```

**Behavior commitments:**
- `advance`/`retreat` are inverses for non-negative inputs.
- `diffDays(a, b)` + `advance(a, n)` = `b` when `n = diffDays(a, b)`.
- `fromSerial(world, toSerial(world, d))` round-trips exactly.
- `advance` transitions cleanly across intercalary boundaries:
  Tarsakh-30 + 1 day = Greengrass-1; Greengrass-1 + 1 day = Mirtul-1.
  The wrapper never special-cases intercalary days.
- `parse` returns `null` on unparseable input; does not throw.
- `resolveHoliday` returns `null` for unknown keys, for years where a leap-only
  holiday doesn't apply, or for rules that don't have a date this year.

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
  readonly longShadows: boolean;   // Eberron-only canon: see "Long Shadows note" below. false for all non-Eberron moons.
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
sun-relative geometry. The wrapper does not import these.

**Long Shadows note:** the Roll20 wrapper *does* surface the Eberron Long
Shadows gobble effect via `MoonPhase.longShadows`. Long Shadows is a canon
event anchored at Vult 26–28 (with a tapered window — distance 0: ±3 days,
distance 1: ±2 days, distance ≥2: ±1 day per the implementation in
`src/moon.ts`). When the date falls in the window AND the relevant moon
is in its gobbled-dark state, `longShadows: true`. It's a phase-output
concern (the moon appears dark when it would otherwise be illuminated),
not a sky-position one. Deterministic both directions; engine ports
faithfully from the existing implementation.

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
- `Plane.effects.coterminous` and `.remote` are literal strings in v0.1.0.
  If the web app eventually needs template interpolation (world date, NPC
  names, etc.), shape will evolve to something like
  `{ template: string; variables: Record<string, unknown> }`. The Roll20
  wrapper doesn't need that. Not a v0.1.0 blocker.

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

## 8. Resolved decisions

All seven open questions from the v0.1.0-draft were resolved with the
engine author on 2026-05-26. Decisions are now reflected in the schemas
above; they're listed here as a single change-log entry.

1. **Floating holidays** → declarative + `resolveHoliday(world, year, key)`.
   Storage is a key + rule descriptor (opaque to the wrapper); engine
   resolves to a concrete date on demand. (§5.1, §5.2)
2. **Long Shadows on `MoonPhase`** → kept. `MoonPhase.longShadows: boolean`
   is always present (false everywhere except Eberron under canon window).
   The gobble mechanic — tapered window distances ±3 / ±2 / ±1 — ports
   faithfully from the existing Roll20 implementation. (§5.3)
3. **`Serial` namespace** → per-world. No cross-world epoch exists in canon.
   (§5.2)
4. **Intercalary days** → not interleaved into the canonical month list.
   `WorldCalendar` gets a sibling `intercalaries: readonly Intercalary[]`,
   `CalendarDate` becomes a discriminated union with `kind: 'month' |
   'intercalary'`, `daysInMonth()` never folds intercalaries in, and
   `daysInIntercalary()` is the companion query. Date arithmetic transitions
   cleanly across the boundary. (§5.1, §5.2)
5. **Holiday floating sentinel** → discriminated union `FixedHoliday |
   FloatingHoliday` with a `kind` discriminator. No `-1` sentinels.
   Compile-time safety. (§5.1)
6. **Naming overlays** → canonical `Month.name` + optional
   `Month.aliases?: readonly string[]`. Wrapper renders canonical; `parse()`
   accepts aliases. (§5.1)
7. **Moonless worlds** → always present as `moons: readonly Moon[]` with
   `[]` when empty. Avoids `world.moons?.length` everywhere. (§5.1)

**Future-but-not-blocking:** `Plane.effects` strings will need templating
support eventually for web-app interpolation; not in v0.1.0.

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

*Status: v0.1.0 contract. §8 resolved with the engine author on 2026-05-26.
Engine is being built against this surface; expected publish window is the
following day. Subsequent contract revisions ride in their own PRs.*
