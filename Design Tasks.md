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

- **Default Views Redesign — hazards toggle, planes anchor wizard, and regression coverage**
  - Completed by: GPT-5 Codex
  - Date: 2026-03-18
  - Scope: implemented the required `!cal weather` Extreme Hazards toggle as a real command path and persisted setting, reworked `Set Anchor` into a plane-specific coterminous anchor wizard while keeping `!cal planes anchor` as the advanced command surface, removed the nonexistent `Reseed Planes` spec item, and expanded regression coverage for panel command strings and management dispatch paths.

- **Persistent Moon Phase page and synced subsystem handouts**
  - Completed by: GPT-5 Codex
  - Date: 2026-03-18
  - Scope: added a bound live `!cal moon page` surface that redraws on date/moon-state changes, auto-maintained player-safe handouts for Events/Moons/Weather/Planes, preserved persistent-view bindings across calendar resets, updated README.md and DESIGN.md to document the new surfaces and commands, and added regression coverage for page binding/show behavior plus automatic handout refresh.

---

## Agent Ready

### Named Saved Weather Location Presets
Already implemented — "Save Current Location As..." button, preset storage, and preset quick-switch all exist in the weather location wizard. No further work needed. Removing from task list.

---
### Default Views Redesign — Remaining Work

The structural redesign (consolidated layouts, dropdowns, new commands) is implemented. Remaining work is behavioral polish and spec compliance verification:

This script has gotten badly mangled in its presentation through various unguided fixes. Here is the overall picture.

There are 5 core commands:
* !cal
	* !cal today (alias)
	* This one is also the general initialization, if the script has not been initialized yet.
* !cal events
* !cal moons
* !cal weather
* !cal planes

Aside from !cal, each of these is the default entry point to their subsystem. ALL of them will output a system-specific minical. Below: minical display, text info, and buttons for each.
Navigation wording should be consistent across these views: use **Previous / Next** for month-or-view navigation, and **Back / Forward** for actual date stepping. Do not add separate return/back buttons to drill-down panels; Roll20 chat history already preserves prior menus.

#### Today (!cal or !cal today)
* All info is specific to the current calendar date.
* Only show information if the subsystem is active.
* Show New and/or Full moons.
##### Minical
* Events minical
##### Text Info
* Current Date
* Time of Day (if active)
* Current Location
* Current Weather (deg F, wind, rain) (if active)
* Current Lighting (if time of day active and currently before sunrise or after sunset)
* small spacer
* Events/Holidays
* small spacer
* New Moons: List
* Full Moons: List
* small spacer
* Coterminous Planes: List
* Remote Planes: List
##### Buttons
* ⏩ Time of Day ⏩ if already active, otherwise the Enable button below (weather must be active)
* Enable Time of Day (if weather is active)
* Back | Forward (date step buttons)
* Send Today View to Players
* small spacer line
* Additional Options (drop down menu)
	* Events
	* Moons
	* Weather
	* Planes
* small spacer line
* Management (drop down menu, GM only)
	* Enable/Disable Moons
	* Enable/Disable Weather
	* Enable/Disable Planes
	* Theme
	* Calendar System
	* Hemisphere
	* Season Set
	* Reset Calendar

#### Events (!cal events)
* This system is for managing events.
* Only show information if the relevant subsystem is active.
##### Minical
* Default to current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Header bar is based on the color scheme, and consists of the current month and year.
* Subheader bar is the days of the week.
* Cells are numbered, with a fill color from the events.
* Colored dots shown on multi-event days.
* Tooltip event titles on hover (sources in parentheses).
* If the previous/next buttons are used, show those months.
##### Text Info
* Current Date
* If and only if the displayed month is the same as the current month:
	* Bulleted list of Active Events/Holidays on the current date
##### Buttons
* Previous | Next (months)
	* Shows the requested month, Current Date below, and regenerates the prev/next buttons and the send button only; it does not regenerate Additional Ranges or Management.
* Send to Players (send month view to players, GM only. Sends the most recently displayed month, which may differ from the current month via the previous/next buttons.)
* small spacer line
* Additional Ranges (drop down menu; no additional buttons after these are displayed)
	* Full Year
	* Upcoming (#n of months in calendar year) months (current month plus n-1)
	* Specific Month (query mm or mm yyyy)
	* Specific Year (query yy)
	* None of these include the button sets or text when shown. Just the calendars requested. Calendars have typical tooltip behavior.
* small spacer line
* Management (drop down menu, GM only)
	* Add Custom Events (drop down menu)
		* Add Single Event (query: dd or mm dd or mm dd yyyy, next matching occurrence that fits the date provided)
		* Add Monthly Event (query: dd only)
		* Add Yearly Event (query: mm dd only)
		* After event date is captured, drop down menu of colors
		* After event is created, whisper details to GM (color swatch, name, recurrence, date)
	* Source Controls
		* Outputs a chat display box titled **Sources**
		* Two clearly labeled sections: **Active Sources** (list) and **Suppressed Sources** (list)
		* Two buttons:
			* Turn Off Active Source → opens dropdown of active sources. If no active sources exist, generate error message instead.
			* Turn On Suppressed Source → opens dropdown of suppressed sources. If no suppressed sources exist, generate error message instead.
		* After a source is toggled, whisper confirmation to GM (e.g., "Source 'Holidays of Khorvaire' disabled.")
	* Remove/Restore
		* Outputs a clean, compact table of all events (active and suppressed), numbered chronologically from the preset date.
		* Columns: #, Event Name, Month, Day, Year (Month or Year may say "All" for recurring events).
		* Active events: standard dark text. Suppressed events: fainter/dimmed text.
		* Two buttons at the bottom:
			* Remove → opens query accepting the # from the table
			* Restore → opens query accepting the # from the table
		* Numbers are ephemeral — generated when the table is rendered, not persisted.
		* After a remove or restore action, whisper confirmation to GM (e.g., "Removed event #3: Midwinter's Day" or "Restored event #7: Wildnight").

#### Moons (!cal moons)
* All info is specific to the current calendar date.
* Only show information if the subsystem is active.
* Show New and/or Full moons.
##### Minical
* Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Header bar is based on the color scheme, and consists of the current month and year.
* Subheader bar is the days of the week.
* Cells are numbered, with a black dot for at least 1 new and a yellow dot for at least 1 full.
	* These dots should be a good size — not small, should be clear.
	* For systems with only one moon, replace the numbered date with a full or new moon emoji as appropriate.
	* For systems with only one moon, tooltip hover should say phase (waxing gibbous, etc.).
* Tooltip on hover with an indented bulleted list under New: and another under Full:, listing all moons either new or full.
##### Text Info
* Current Date
* small spacer
* New Moons: 
	* List
* Full Moons:
	* List
* small spacer
* Eclipses: (only if any)
	* X transiting Y, nn% coverage, low in the sky (use afternoon time of day bucket for position in the sky, but use maximum coverage for the nn%, regardless of time of day)
* small spacer
* Ascendant Moons:
	* List (eberron only)
* Dim Moons:
	* List (eberron only)

##### Buttons
* Previous | Next (month steps)
	* Shows the requested month, Current Date below, Ascendant Moons below (for the named month), and regenerates the prev/next buttons and the send button only; it does not regenerate Sky, Current Phases, Specific Moons, forecast controls, Additional Ranges, or Management.
* Send to Players (send month view to players, GM only. Sends the most recently displayed month, which may differ from the current month via the previous/next buttons.)
* small spacer line
* Sky
	* Position of moon(s) in the nighttime bucket, if no ToD active, or current ToD if buckets are active.
* Current Phases
	* Whispers a clean bulleted list with swatch + moon name, subbullets current phase (waning crescent, etc.) and upcoming "New/Full in X days on insert-month-and-day-date-format"
* Specific Moons (named drop down list)
	* Displays current plus n-1 upcoming months
	* Displays Single Bar with Moon Name, colored with moon color, then outputs a year's worth of minicals
	* Current date cell is still emphasized
	* Replaces the numbered date in a cell with a full or new moon emoji, when appropriate
	* Tooltip hover should say phase (waxing gibbous, etc.)
* small spacer line
* Medium Forecast (4 buttons: 1 month / 3 month / 6 month / 10 month)
* High Forecast (4 buttons: 1 month / 3 month / 6 month / 10 month)
* small spacer line
* Additional Ranges (drop down menu; no additional buttons after these are displayed)
	* Full Year
	* Upcoming (#n of months in calendar year) months (current month plus n-1)
	* Specific Month (query mm or mm yyyy)
	* Specific Year (query yy)
	* None of these include the button sets or text when shown. Just the calendars requested. Calendars have typical tooltip behavior.
* small spacer line
* Management (drop down menu, GM only)
	* Toggle Moons On/Off
	* Reseed Moons
	* Set New (drop down menu)
		* query for dd, mm dd, mm dd yyyy
	* Set Full (drop down menu)
		* query for dd, mm dd, mm dd yyyy
	* **Design note:** Setting a new/full *shifts* the existing cycle — it does not add an extra phase. The moon drops back into its regular cycle once past the manually set phase. This is intentional: shifting is cleaner than adding.

#### Weather (!cal weather)
* All info is specific to the current calendar date.
* Only show information if the subsystem is active.
* Weather is range-based (showing generated forecast days), not month-based like the other views.
* We calculate all time-of-day variation behind the scenes, but only *present* afternoon weather, mechanics, and lighting UNLESS time of day is active.
##### Minical
* The weather minical differs from others: it only shows the generated forecast range, not full months.
* Header bar is based on the color scheme, and consists of the current month and year.
* Subheader bar is the days of the week.
* Weather cells have a small vertical gap from the weekday header bar.
* Each cell shows an emoji weather icon as the primary display, with L / H temperature (Fahrenheit) below it.
	* Fahrenheit values are flavor: add 1d10 randomly from the bottom of the band range. Mechanics only care about the band. Ensure Low is lower than High when the temperature band is the same all day.
* No numbered date is required, but the current day cell uses the "today" emphasis style.
* Previous days to the left of the current day (if it's not the first day of the week) show their weather slightly faded.
* Only show a prior week row if the current day is the first day of the week and you need an extra row for "yesterday."
* If more than one row is needed to show the known forecast range, subsequent rows are similarly gapped from the row above.
* We'll have the Low and High band from all of our time-of-day calculations.
* Tooltip on hover shows a weather narrative for that day.
##### Text Info
* Current Date
* Time of Day (if active)
* Current Location (climate + geography + terrain label)
* Manifest Zones (if any active, with names)
* Current Weather (narrative description)
* Current Light Level (if before sunrise or after sunset)
* Active Mechanics (mechanical effects from weather conditions)
* Extreme Weather Hazards (if triggered — hazard name, probability, mechanics summary)
##### Buttons
* Send to Players (send forecast to players, GM only, renders enough cells to cover the revealed range)
* small spacer line
* Medium Forecast (4 buttons: 1 day / 3 days / 6 days / 10 days)
* High Forecast (4 buttons: 1 day / 3 days / 6 days / 10 days)
* Reveal Custom Range (query for date or date range)
* small spacer line
* Extreme Events (shown below mechanics section when conditions qualify for any event)
	* For each qualifying event, display: "Conditions are right for a [Event Name]"
	* Three buttons per event (two if mechanics are disabled):
		* Let's Do It (activates the event immediately)
		* Roll For It (X%) (rolls against the calculated probability, including all conditional modifiers)
		* Show Me The Mechanics (omitted if mechanics toggle is off; whispers a framed details box with duration, mechanics, aftermath, and player message; then regenerates the Let's Do It and Roll For It buttons below the details box)
	* Once activated (by either button), the event follows weather logic:
		* Uses the same time-of-day system — if time of day is active, event mechanics apply to the current bucket; if not, afternoon default.
		* Duration is tracked: the event has a start and an estimated end. While active, it contributes mechanics to the weather output.
	* After activation or roll result, whisper confirmation to GM with outcome.
* small spacer line
* Set Location (wizard: Climate → Geography → Terrain)
* Set Manifest Zone (zone toggle chooser, Eberron only)
* small spacer line
* Management (drop down menu, GM only)
	* Toggle Weather On/Off
	* Toggle Extreme Hazards On/Off
	* Toggle Mechanics On/Off
	* Reseed Weather
	* History (shows as many rows as needed for current location's history; option to wipe history past 20 days)
	* Reset Weather (resets and regenerates weather for current location; preserves revealed-forecast-level tags for known dates at that location)
	* Reroll Today (regenerates today's weather, unless locked)
	* Lock Day (locks a forecast day so it cannot be rerolled)
	* Whisper confirmations on all location, zone, or weather changes

##### Quick Reference: Weather Mechanics (!cal weather mechanics)
* Aliases: !cal mechanics, !cal mech
* Whispers to GM only — a quick macro-friendly reference for current conditions.
* Outputs a framed box with:
	* Current Date
	* Current Location
	* Current Weather narrative (for the active time-of-day bucket, or afternoon if time of day is inactive)
	* Active Mechanics (for the active bucket, or afternoon default)
	* Extreme event status (if any are active)
* Does NOT include: forecast grid, buttons, brightness/lighting info (unless time of day is active), or any management controls.
* This is the "what's happening right now that's relevant to gameplay" quick whisper.

#### Planes (!cal planes)
* All info is specific to the current calendar date.
* Only show information if the subsystem is active.
* 13 planes with cyclic phases: coterminous, neutral, remote, neutral. Planes snap between active states with no gradual transition. Some planes are fixed (e.g., Dal Quor permanently remote).
##### Minical
* Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Header bar is based on the color scheme, and consists of the current month and year.
* Subheader bar is the days of the week.
* Cells are numbered.
* Cell shading for planar events: each plane has an assigned color.
	* Coterminous: fill the cell with that plane's color for the entire duration of the event.
	* Remote: fill the cell with that plane's color, faded, with subtle black diagonal line shading, for the entire duration.
	* Shade the whole range of the event, not just the start or end day.
	* Exception: periods longer than one month are not shaded (too long to be visually useful).
* Tooltip on hover: bulleted list with Coterminous: (list of plane names) and Remote: (list of plane names), indented below headers.
##### Text Info
* Current Date
* Coterminous Planes: List (current date only)
	* After the plane name, include duration info in parentheses.
	* Generated events get a `(Generated)` tag at the start of the parenthetical.
		* Canonical example: "Daanvi (coterminous 85 years ago, ending in 15 years)"
		* Generated example: "Kythri (Generated, coterminous, ending in 3 days)"
		* Events lasting longer than 1 month: natural language with approximate duration.
		* Events less than 1 month: "ending in X days"
* Remote Planes: List (current date only)
	* Same duration info and (Generated) tag format as coterminous
##### Buttons
* Previous | Next (month steps)
	* Shows the requested month, Current Date below, and regenerates the prev/next buttons and the send button only; it does not regenerate Specific Planes, forecast controls, Additional Ranges, or Management.
* Send to Players (send month view to players, GM only. Sends the most recently displayed month, which may differ from the current month via the previous/next buttons.)
* small spacer line
* Specific Planes (named drop down list of all planes)
	* Displays a single bar with the Plane Name, colored with the plane's color, then outputs a year's worth of minicals.
	* Current date cell is still emphasized.
	* Cell shading follows the same coterminous/remote rules as the main minical.
	* For players, only include as far as their reveal knowledge horizon extends. Players always know canonical/annual events.
* small spacer line
* Medium Forecast (4 buttons: 1 month / 3 month / 6 month / 10 month)
* High Forecast (4 buttons: 1 month / 3 month / 6 month / 10 month)
* Reveal Custom Range (query for date or date range)
* small spacer line
* Additional Ranges (drop down menu; no additional buttons after these are displayed)
	* Full Year
	* Upcoming (#n of months in calendar year) months (current month plus n-1)
	* Specific Month (query mm or mm yyyy)
	* Specific Year (query yy)
	* None of these include the button sets or text when shown. Just the calendars requested. Calendars have typical tooltip behavior.
* small spacer line
* Management (drop down menu, GM only)
	* Toggle Planes On/Off
	* Toggle Generated Events On/Off (system-wide, not per-event)
	* Set Phase Override (force a plane to a specific phase, optionally for a duration)
	* Clear Override (remove a phase override)
	* Set Anchor (choose a plane from a dropdown, then show that plane's default cycle clearly and prompt for when its first coterminous phase should begin, defining the cycle from that point forward)
	* Seed Override (override the seed-derived anchor year)
	* Whisper confirmations on all changes

#### Open Questions

These are unresolved design questions extracted from the subsystem specs above.

1. **Weather hazard completeness**: The 14 planned hazards are: Flash Flood, Whiteout, Ground Blizzard, Dust Storm (Haboob), Avalanche, Severe Thunderstorm, Clear-Sky Lightning, Flash Freeze, Tropical Storm, Hurricane, Tornado/Waterspout, Heatwave, Ice Storm, Wildfire. Are there other hazard types needed?


---


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
