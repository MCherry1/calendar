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

On initialization, the script asks for a starting date. The prompt is in the display syntax, but that is NOT the same as the script input syntax. Remedy this. Prompt with the correct syntax pre-entered, and explicitly called for (MM DD YYYY)

---
### Default Views Redesign and System Entry Points

This script has gotten badly mangled in it's presentation through various unguided fixes. Here is the overall picture.

There are 5 core commands:
* !cal
	* !cal today (alias)
	* This one is also the general initialization, if the script has not been initialized yet.
* !cal events
* !cal moons
* !cal weather
* !cal planes

Aside from !cal, each these is the default entry point to their subsystem. ALL of them will output a system-specific minical. I will now define their minical display, player view variation, and buttons.

#### Today (!cal or !cal today)
* All info is specific to the current calendar date
* Only show information if the subsystem is active.
* Show New and/or Full moons 
##### Minical
* Events minical
##### Text Info
* Current Date
* Events/Holidays
* Line Break
* Time of Day
* Current Weather
* Line Break
* New Moons: List
* Full Moons: List
* Coterminous Planes: List
* Remote Planes: List
##### Buttons
* Back arrow "Date" | "Date" forward arrow (use the arrow emojis here)
* Send (send *current month view* to players, GM only. not necessarily the "active" month, but the one who's minical was shown above this button block)
* Additional Options (Drop down menu)
	* Events
	* Moons
	* Weather
	* Planes
	* Admin
___

#### Events (!cal events)
* This system is for managing events.
* Only show information if the relevant subsystem is active.
##### Minical
* Default to Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Header bar is based on the color scheme, and consists of the current month and year
* Subheader bar is the days of the week
* Cells are numbered, with a fill color from the events
* Colored dots shown on multi-event days
* Tooltip event titles on hover (sources in parentheses)
* If the show previous/next buttons are used, obviously, show those months.
##### Text Info
* Current Date
* If and only if the displayed month is the same as the current month:
	* Bulleted list of Active Events/Holidays on the current date
##### Buttons
* Previous | Next (months)
	* Shows the requested month, Current Date below, and same button set
* Send to Players (send month view to players, GM only. this one is specific. its not necessarily the ACTIVE CURRENT month, but the month that was most recently displayed to the GM, which many be differnt via the previous and next buttons)
* small line break
* Additional Views (opens drop down menu)
	* Current Year
	* Upcoming (#n of months in calendar year) months (current month plus n-1)
	* Specific Month (query mm or mm yyyy)
	* Specific Year (query yy)
	* None of these include the button sets or text when shown. Just the calendars requested. Calendars have typical tooltip behavior.
* small line break
* Management (creates drop-down menu, GM only)
	* Add Custom Events (drop down menu)
		* Add Single Event (query, dd or mm dd or mm dd yyyy, next matching occurance that fits the date provided)
		* Add Monthly Event (query, dd only)
		* Add Yearly Event (query, mm dd only)
		* After event date is captured, drop down menu of colors
		* After event is created, whisper details to GM (color swatch "so and so created (annually/monthly) on insert date format)
	* Source Controls (I think these might be okay as-is, if cluttered. will address later)
	* Agent task are there other event managements needed?

#### Moons
* All info is specific to the current calendar date
* Only show information if the subsystem is active.
* Show New and/or Full moons
##### Minical
* Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a black dot for at least 1 new and a yellow dot for at least 1 full
* Tooltip on hover with an indented bulleted list under New: and another under Full:, listing all moons either new or full.
##### Text Info
* Current Date
* New Moons: List
* Full Moons: List
##### Buttons
* Previous | Next (month steps)
	* Shows the requested month, Current Date below, and same button set
* Send to Players (send month view to players, GM only. this one is specific. its not necessarily the ACTIVE CURRENT month, but the month that was most recently displayed to the GM, which many be differnt via the previous and next buttons)
* small line break
* Additional Views (no additional buttons after these are displayed)
	* Current Year
	* Upcoming (#n of months in calendar year) months (current month plus n-1)
	* Specific Month (query mm or mm yyyy)
	* Specific Year (query yy)
	* None of these include the button sets or text when shown. Just the calendars requested. Calendars have typical tooltip behavior.
* small line break
* Management (drop down menu, GM only)
	* Set New (drop down menu)
		* query for dd, mm dd, mm dd yyyy
	* Set Full (drop down menu)
		* query for dd, mm dd, mm dd yyyy
	* agent task: I am pretty sure we never *add* a phase, we just shift existing phases to accomodate. Can you check on this? And when we smoothly move phases to acommodate, we also just drop right back into the regular cycle once we're past the set phase, right? that's the way it should work. setting a full or new should as non-invasively as possible just mutate the whole system for that moon 

#### Weather
* All info is specific to the current calendar date
* Only show information if the subsystem is active.
##### Minical
* The weather minical is a bit different than the 
* Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a fill color from the events
##### Text Info
* Current Date
* Current Weather
##### Buttons
* Previous | Next (months)
* Send (send current view to players, GM only)
* Management (GM only)
	* Source Controls
	* Add Custom Events
		* Add Single Event, Add Yearly, etc with prompted syntaxes
	* Insert other event management?

#### Planes
* agent task: can you update this section to basically exactly match the 
---

### Default Views Redesign

**Design principle:** The minical is the gold standard entry to every view. Always current month. Compact info below. Tight buttons.

#### Dashboard (`!cal` / `!cal show`)

```
┌──────────────────────────────────┐
│  « Month Year               ☼ » │
│  [  Current Month Minical     ] │
│                                  │
│  Weekday, Day Month Year — Era   │
│  Season · Time of Day            │
│  (today summary — TBD)           │
│                                  │
│  ◄ Retreat          Advance ►    │
│  Send to Players                 │
│  Weather          (if enabled)   │
│  Moons            (if enabled)   │
│  Planes           (if enabled)   │
│  Admin                           │
└──────────────────────────────────┘
```

- Buttons 3–5 open their subsystem view (which also starts with current-month minical)
- Rows hidden when subsystem not enabled for this world (capabilities-driven)
- Today summary line format TBD — keep it to 1–2 tight lines max

#### Events View

Done. Current-month minical with event markers in cells, compact event list below.

#### Moons View (`!cal moon`)

Done. Current-month minical with phase markers, moon list rows below. GM controls in separate message. Needs minor reformatting pass only.

#### Weather View (`!cal weather`)

```
┌──────────────────────────────────┐
│  « Month Year               ☼ » │
│  [  Current Month Minical     ] │
│  emoji + temp color in cells     │
│                                  │
│  Today: 🌤 72°F  Light wind     │
│  Location: Sharn (urban)         │
│                                  │
│  Send  |  Reveal Forecast        │
│  Mechanics                       │
│  Management                      │
└──────────────────────────────────┘
```

- **Minical cells:** weather emoji + temperature number in scale-colored font (red→hot, blue→cold)
- **Below minical:** one tight line for today's narrative + location
- **Row 1:** `Send` (sends currently known forecast) | `Reveal Forecast`
- **Row 2:** `Mechanics`
- **Row 3:** `Management`
- **Reveal Forecast** expands: two rows (Medium / High tier), each with `1 3 6 10` day buttons
- **Management** expands:
  - `Reroll Today` | `Reroll All`
  - `History` — uses the same minical forecast display, not a text list
  - `Set Location`
  - `Set Manifest Zone`
- **Mechanics** panel:
  - General summary line above table ("Cold and snowy", etc.)
  - Table: 7 rows (header + 6 periods), 4 columns: Time | Temp | Prec. | Wind
  - Number scale values
  - Time cells are clickable buttons — hover shows bullet-point mechanics for that period
  - Night buckets include lighting: moonlight sourcing (top 3 sources with %, cloud reduction)
  - Shadow info as prominent as "Bright Moonlight"

#### Planes View (`!cal planes`)

```
┌──────────────────────────────────┐
│  « Month Year               ☼ » │
│  [  Current Month Minical     ] │
│  phase transition markers        │
│                                  │
│  🔴 Kythri — Coterminous        │
│  🔵 Risia — Remote (waxing 3mo) │
│                                  │
│  Send  |  Lore                   │
│  Display Mode | Custom Date      │
└──────────────────────────────────┘
```

- **Minical cells:** plane phase transition indicators (coterminous / remote / waxing / waning colors)
- **Below minical:** compact list of currently notable planes only — coterminous, remote, or approaching transition. Not all 13.
- **Row 1:** `Send` (with tier presets Medium/High) | `Lore`
- **Row 2:** Display mode toggle | Custom date prompt
- GM controls in separate message (same whisperParts pattern)

---

### Minical Cell Proportions

Cells are currently `width:2em; height:1.4em` — wider than tall. User reports they look too tall visually, especially the highlighted today row. Investigate whether the today-highlight styles (`box-shadow`, `outline`, `outline-offset`) or `calCellInner` min-height are adding visual bulk. Target: approximately 3:4 width-to-height ratio, number vertically centered.

**File:** `src/constants.ts:403-408`

### Moon Lore: Remove Analog Info, Add Qualitative Stats

`_moonLoreHtml()` still shows reference-moon analog data. Replace with:
- Color swatch
- Synodic period
- Qualitative albedo: bright / dim / average
- Apparent sky size vs Luna: `%` for smaller, integer `×` for larger (0.5× steps below 5×)
- Associated plane and dragonmark

**File:** `src/moon.ts` — `_moonLoreHtml()` function

### README: Migrate Setting-Specific Info to Per-Setting Sections

The general "Moons: Modeling the Sky" and "Planes" sections still contain Eberron-specific data (12 moon names, 13 plane names). Move setting-specific details into the per-setting subsections under "Supported Settings" (added in Phase 7). Keep the general sections setting-agnostic with cross-links. Same treatment for any Eberron-specific content in Weather section.

### Planes Forecast: Days → Months in README

Verify all README references to planes/moons forecast increments say "months" not "days." The code already forecasts in month increments for moons and planes.

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
