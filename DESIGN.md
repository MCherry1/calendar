# DESIGN.md (draft)

Forward-looking design for `partybuff/calendar`. Audience: an agent
implementing changes in this repo. For project orientation read
`CLAUDE.md` first. For the engine API this repo consumes read
`ENGINE_CONTRACT.md`. User-facing behavior is in `README.md`.

---

## 1. Scope

A Roll20 API script that displays a fantasy campaign calendar in chat
and lets the GM advance time, add events, and broadcast views.
Distributed as a single `calendar.js` paste artifact.

### In scope

- **Worlds:** Eberron, Faerûn (Harptos), Greyhawk, Dragonlance (Krynn),
  Exandria, Mystara, Birthright, Gregorian. One active world per
  campaign.
- **Date math:** advance, retreat, set, parse, format, weekday lookup,
  leap years, intercalary days. All delegated to the engine.
- **Moon phases:** illumination and label per moon per day. Output only;
  no sky position, altitude, azimuth, eclipses, or shadow framing.
- **Events:**
  - Built-in canonical event packs per world (e.g., Sovereign Host feasts
    for Eberron, calendar festivals for Harptos).
  - Eberron planar events surfaced as entries in the same list (canon
    cycles only — no GM seeds, no generated drift).
  - GM custom events: one-off, monthly recurring, yearly recurring.
- **GM commands:** `!cal set world <id>`, `!cal set date <date>`,
  `!cal advance N`, `!cal retreat N`, `!cal event add|remove|list`,
  `!cal send <view>`, `!cal show <view>`, `!cal help`.
- **Views:** today, month, moons, events, holidays, help.
- **UX model:** button-first. `!cal` is the only chat entry point.
  Everything else is a button that emits `!cal …`.

### Out of scope

These are explicitly cut. Do not re-add without a written reversal.

- Weather of any kind (mechanical, narrative, ambient, location-aware).
- Time-of-day, sun position, horizon math.
- Sky rendering: moon altitude, azimuth, hour angle, "long shadows".
- Eclipse detection, occultation reporting.
- Forecast-lens knowledge tiers (zones A/B/C/D, DC ladders, tails,
  jitter, off-center placement, auto-sharpening). Players see what the
  GM sees.
- Generated planar events, GM-tunable seeds/anchors for planes, plane
  suppression, manifest zones, Ring of Siberys lighting.
- Roll20 handouts as a render surface. Handout creation is disabled.
- Roll20 pages with "live" embedded rendering.
- Standalone web app, showcase site, Cloudflare Workers deployment.
  These live in `partybuff/party-buff`.
- Macros, dice rolls, ambient narration, AI generation.

---

## 2. Architecture

```
partybuff/party-buff (sibling monorepo)
  └── packages/calendar-engine          pure TypeScript, no host deps
        published as @partybuff/calendar-engine on GitHub Packages

partybuff/calendar (this repo, the wrapper)
  ├── src/                              Roll20 wrapper
  │   ├── index.ts                      boot
  │   ├── state.ts                      state.PartyBuffCalendar
  │   ├── commands.ts                   !cal parser + dispatch
  │   ├── ui.ts                         chat HTML, button emit
  │   ├── views/                        today, month, moons, events, help
  │   └── (imports @partybuff/calendar-engine)
  ├── calendar.js                       built artifact (esbuild IIFE)
  └── build.mjs                         esbuild config
```

**Boundary rule.** The engine is pure and deterministic. The wrapper
owns everything that touches Roll20: `sendChat`, `findObjs`, `state.*`,
button HTML, command parsing, player vs GM gating, persistent views,
chat formatting. The engine does not import any Roll20 global and
assumes no host (no `window`, no `document`, no `process`, no `fs`).

If a piece of logic is testable as `(inputs) => outputs` with no host
dependency, it belongs in the engine. If it requires Roll20 to mean
anything, it stays here.

The current `src/` tree still contains pre-refocus modules (weather,
sky, moon sky position, planar subsystem, persistent views, time-of-day,
forecast-lens). Treat them as legacy. Either delete them or replace
them with thin shims over engine calls.

---

## 3. Data model

### 3.1 Engine-owned (do not duplicate)

- World definitions: id, label, era, calendar structure, default date,
  moons, holidays, seasons.
- All date arithmetic and parsing.
- Moon phase computation.
- Eberron planar phase computation (canon-anchored only).

See `ENGINE_CONTRACT.md` for exact shapes.

### 3.2 Wrapper-owned (lives in `state.PartyBuffCalendar`)

```ts
interface PersistentState {
  version: number;            // bump on breaking shape change; migrate on read
  worldId: WorldId;           // engine WorldId
  currentDate: CalendarDate;  // engine CalendarDate
  customEvents: CustomEvent[];
  viewPreferences: {
    showEvents: boolean;
    showMoons: boolean;
    showPlanes: boolean;      // only meaningful when worldId === 'eberron'
  };
  setup: {
    status: 'uninitialized' | 'dismissed' | 'in_progress' | 'complete';
  };
}

interface CustomEvent {
  id: string;                 // stable, regenerated rarely
  name: string;
  color: string;              // hex
  recurrence:
    | { kind: 'one-off'; date: CalendarDate }
    | { kind: 'monthly'; day: number }            // 1-based
    | { kind: 'yearly'; monthIndex: number; day: number };
}
```

Rules:
- Keep state small. Roll20 serializes to JSON on every write.
- Never store engine outputs (phases, planar states). Recompute.
- Versioned schema. Read path runs migrations; write path always emits
  the current shape.
- On unknown `worldId`, fall back to the engine's default and log; do
  not crash.

### 3.3 Built-in events

Engine ships the canonical event packs as `World.holidays`. The wrapper
displays them alongside `customEvents` and (for Eberron) the canon planar
entries from `planes.activeOn(date)` and `planes.upcoming(date, window)`.

No "source priority", no "auto-suppression", no "source disable". A
holiday is on the calendar or it isn't. If a GM wants to hide a built-in,
they can override it with a custom event of the same name and color
`transparent` (open: decide whether to support hide). Default: show all
built-ins, no toggles.

---

## 4. Roll20 constraints

Carry these forward; they shaped every previous attempt.

- **No `<script>` tags in chat.** Roll20 strips them.
- **Inline CSS only, and limited.** Most properties survive on `style=""`;
  `position`, `transform`, animations, and external stylesheets do not.
  `display: table` constructs are the most reliable layout primitive.
- **`/direct` strips command-button markup.** Anything that broadcasts to
  players must be a non-interactive summary. Interactive control panels
  are GM-whispered only.
- **Single-file delivery.** No JS includes, no HTML files. Everything
  ships as one `calendar.js`.
- **API time budget is real.** The previous high-tier moon panel hit
  ~1.8s/render because eclipse computation was recomputed per day cell.
  That's why eclipses are gone from this surface. Stay under ~200ms per
  render and well clear of the Roll20 watchdog.
- **`Campaign().journalfolder` is read-only.** Scripts cannot create
  Roll20 folders.
- **`handout.set('notes', ...)` is async and rate-limit-prone.** Don't
  rely on it for the primary UX. (We don't — handouts are out of scope.)
- **Persistent state lives in `state.PartyBuffCalendar`.** Roll20
  serializes it as JSON; keep it small.
- **Button-emit pattern.** The only practical UI is "buttons that issue
  `!cal …` commands, which re-render the panel." All "interactive" UI is
  a chain of chat messages.
- **`randomInteger()` is the only sanctioned RNG.** Avoid `Math.random()`
  in shipped code paths (the engine's outputs are deterministic, so this
  rarely matters — flag if you reach for an RNG anywhere).

---

## 5. UX

### 5.1 Entry

`!cal` opens the **Today** panel: a compact card showing date, today's
events (custom + canonical + planar entries), today's moon phases (one
line per moon for the active world).

Player and GM see the same content; the GM card has additional buttons:
advance/retreat, set date, set world, add event, send view.

### 5.2 Views

- `!cal show today` — same as bare `!cal`
- `!cal show month` — current month grid with event dots
- `!cal show moons` — current month with moon phase markers (full/new)
- `!cal show events` — list of upcoming events in a configurable window
- `!cal show help` — command reference
- `!cal send <view> [date]` — broadcast a non-interactive summary

There is no separate "planes view." Planar events appear in the events
list and on the month grid as colored entries.

### 5.3 Setup

GM-only first-run wizard. Persistent setup state: `uninitialized`,
`dismissed`, `in_progress`, `complete`. Campaigns with populated calendar
data but no setup marker auto-migrate to `complete` (no onboarding
interruption).

Questions, in order:
1. World (8 choices).
2. Starting date — accept "use world default" or a custom date via the
   same parser used by `!cal set date`.
3. Show events / moons / planes (planes only offered when world is
   Eberron). Default all to on.

That's it. Era labels, color themes, hemisphere choices, season models,
event source ordering — all dropped. The engine returns one canonical
representation per world; the wrapper renders it.

Public chat must never receive setup prompts. If a player types `!cal`
before setup is complete, the wrapper replies with a polite waiting
message.

---

## 6. Build and dependencies

- TypeScript source in `src/`, bundled to `calendar.js` via
  `npm run build` (esbuild, IIFE, ES2020).
- `npm run check` runs typecheck and tests; CI runs the same on every PR.
- The Roll20 paste artifact is built in CI and downloadable from the
  workflow artifact. Local builds also work.
- `__ROLL20__` is a compile-time constant set in `build.mjs`. With the
  refocus this should rarely be needed, but it remains available for
  gating any path that genuinely behaves differently in the Roll20
  sandbox.
- The engine is consumed via GitHub Packages
  (`@partybuff/calendar-engine`). Auth via `GITHUB_PACKAGES_TOKEN` in CI
  and an `.npmrc` PAT locally; document in the engine package README.

---

## 7. Testing

- Engine has its own tests in the party-buff repo. Do not duplicate
  them here.
- This repo tests:
  - Command parsing (`commands.ts`) — every `!cal` form.
  - State migration (`state.ts`) — every supported `version` upgrade.
  - View rendering (`views/*`) — snapshot of the chat HTML emitted for
    representative scenarios per world.
  - Roll20 shim contract (`test/roll20-shim.ts`) — the wrapper never
    touches a Roll20 global the shim doesn't model.
- Tests run under Node via `tsx --test`. The shim simulates `sendChat`,
  `findObjs`, `state`, `playerIsGM`, etc.

---

## 8. Open decisions

Flagged for resolution. None block first cut.

1. **Hiding built-in holidays.** Decide whether a GM can suppress a
   specific canonical entry without forking the engine. Lean: no, keep
   the surface simple.
2. **Event color when planar entries land on the same day as customs.**
   Pick a layering rule (e.g., custom paints day, planar dots).
3. **Year navigation in the month view.** Two arrows (prev/next month)
   are obvious; year jumps are tedious by month. Decide if a `set date`
   shortcut is enough.
4. **Floating holidays.** The engine contract has an open question on
   whether floating holidays (moon-anchored, planar-anchored) resolve
   inside the engine or via a separate call. The wrapper's render path
   needs concrete dates. Track resolution in `ENGINE_CONTRACT.md`.
5. **`!cal moon on <date>` parity.** The old script had per-moon
   detail commands. Decide whether to keep `!cal moon on <date>` (read
   phases for any date) or drop in favor of `!cal show moons` with a
   date navigator. Lean: keep — it's cheap and useful.
6. **Custom event identity for edit/remove.** Generated `id` vs. name
   matching. Lean: short slug + index suffix on collision; expose both
   `!cal event remove <name>` and `!cal event remove <id>`.

---

## 9. Out-of-scope reminders

If you read code that suggests we should add:

- a sky panel
- weather narration
- eclipse warnings
- forecast windows or "DC 15 reveal"
- handouts
- moon altitude or "long shadows"
- planar drift / generated planar events
- Ring of Siberys lighting
- a player-vs-GM knowledge model

…that code is legacy. Confirm with the user before extending it.
