# Events Subsystem Design Document

## 1) Overview and scope

The events subsystem attaches campaign observances and custom milestones to calendar days. It supports:

- default source-backed events (e.g., Sharn, Sovereign Host, seasonal sets),
- GM-authored one-off and recurring events,
- source-level filtering and priority ordering,
- rendering in month cells, range listings, and “today/upcoming” summaries.

This document describes the behavior implemented in `calendar.js`.

## 2) Design goals and inspirations

- **Campaign utility first:** event authoring is fast from chat (`!cal add...`).
- **Lore + custom coexistence:** canonical/default event packs can be enabled, disabled, or restored without deleting GM-authored entries.
- **Readable UI density:** first event controls the day color, additional events appear as dots and list rows.
- **Calendar portability:** event source packs can be scoped by calendar system (Eberron/Gregorian/etc.).

## 3) Data model

## 3.1 Canonical data tables

- `DEFAULT_EVENTS`: source-keyed event definitions.
- `DEFAULT_EVENT_SOURCE_CALENDARS`: optional source→calendar-system allowlist.
- `NAMED_COLORS`: color aliases for command-friendly input (`emerald`, `onyx`, etc.).

Event records support:

- `name`
- `month` (month number, `"all"`, or normalized month context depending on command)
- `day` (single day, range `N-M`, ordinal weekday like `first far`)
- `year` (`null`/missing for recurring, explicit number for one-time)
- `color` (hex or named color)
- `source` (null for user events, key for default packs)

## 3.2 Runtime state and settings

- Events are stored in `state[state_name].calendar.events`.
- Source enablement and ordering live in settings (`eventSourceEnabled`, `eventSourcePriority`).
- Visibility and presentation include:
  - `eventsEnabled`
  - `groupEventsBySource`
  - `showSourceLabels`

## 4) Processing pipeline

## 4.1 Ingestion and normalization

- Defaults are flattened from source maps into a single event array.
- Day specs are normalized via `DaySpec` helpers:
  - numeric day,
  - day ranges,
  - ordinal weekdays.
- Date parsing for authoring uses flexible token parsing (`MM DD [YYYY]`, month-name forms, ordinal day words).

## 4.2 Matching and occurrence generation

- `getEventsFor(monthIndex, day, year)` resolves matches for a single day.
- `occurrencesInRange(startSerial, endSerial)` expands recurring/yearly rules into concrete occurrences.
- Optional scan cap (`RANGE_CAP_YEARS`) is available for very large ranges.

## 4.3 Source filtering and precedence

- Source entries can be disabled without deleting the underlying records.
- Source packs can be auto-scoped by calendar system (`DEFAULT_EVENT_SOURCE_CALENDARS`).
- Day rendering sort order:
  1. user events (`source = null`),
  2. configured source priority order,
  3. unranked sources.

## 4.4 Rendering behavior

- Primary event color sets the day-cell background.
- Secondary events render as compact dots/badges.
- Event labels optionally append source names when `showSourceLabels` is enabled.
- Intercalary single-day months render as banner rows and still honor event coloring/dots.

## 5) Commands and operator controls

Core event commands:

- `!cal add ...` — smart add (one-time or recurring based on provided date form).
- `!cal addmonthly <daySpec> NAME [color]`
- `!cal addyearly <Month> <daySpec|ordinal weekday> NAME [color]`
- `!cal remove [list|key|series|name fragment]`
- `!cal restore [all] [exact] <name...>` and `!cal restore key <KEY>`
- `!cal list` — all events table.

Source controls:

- `!cal source list`
- `!cal source enable <name>` / `disable <name>`
- `!cal source up <name>` / `down <name>` (priority ordering)

## 6) Cross-subsystem interactions

- Event output is included in “today” and “upcoming” rollups alongside moon/weather/planes summaries.
- Calendar/system changes can auto-enable/disable default source packs through source-calendar compatibility.
- Event colors are independent from month theme colors but share accessibility contrast rules for cell text.

## 7) Tuning and extension guidance

- Add new lore packs by appending source entries in `DEFAULT_EVENTS` and optional calendar scoping.
- Prefer named colors for operator ergonomics; keep hex fallback for precision.
- When creating non-28-day calendars, review events on days 29–31 and day-range specs for clamping behavior.
- Keep source keys stable to preserve saved enable/disable preferences across script upgrades.
