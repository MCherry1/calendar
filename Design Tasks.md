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
---

user-defined fixes
* planes forecast says days in the readme. it should be months - behaving the same as moons. make sure the code reflects this.
* we lost our initialization message on api boot
* change labeling of the different calendars to Setting (Eberron, Forgotten Realms, etc.), rather than world. The heirarchy would be Setting, World, Continent, Calendar. If there is only one choice, don't bother giving a chance to select. Just select and provide the info. Like, {Forgotten Realms} > ~~Toril~~, ~~Faerun~~, ~~Harptos Calendar~~, (all skipped), then it just outputs a message like:


>Harptos Calendar selected. The Haptos Calendar is the default calendar of Faerun, on the planet Toril, set in the Forgotten Realms. It consists of blah blah blah.
>!cal initialize to choose a different calendar (or whatever our command is)
then it lists our initialization message that happens when the API loads.
>Harptos Calendar Initialized
>blah blah current date etc.

* The README needs some refactoring as well. The Moons: Modeling the Sky section can remain, but all the setting specific info should be stuck into the setting specific sections. links hsould be provided however. same for planes
* Minical cells are weirdly rectangular. Too tall. Why? especially the highlighted current day cell's row. Shorten it, and center the number vertically within the cell. Was this a problem with the dots? I thought maybe 3 wide by 4 tall ratio would look nice. you tell me. they look like mahjong tiles now too tall.
* Moons lore tab should just not list the analog info but should show the moon's color, period, qualitative albedo (bright, dim, average brightness, etc.) as well as how big it is in the sky compared to Luna's average associated planes and dragonmark. % for less than size, integer x for more than, including 0.5 steps for less than 5x.
* !cal and !cal show should show the current minical, with buttons below. buttons are simple
	* row 1 is retreat and advance side by side
	* row 2 is send to players
	* row 3 is weather
	* row 4 is moons
	* row 5 is planes
	* row 6 is admin
* rows are not shown if the system is not enabled. admin can enable systems.
* when you click the button for 3-5 it shows the minical for the current month.
* ALSO MAJOR BUG ON MOONS AND PLANES DETAIL VIEW. cell builder is all broken.
* Moons should default to the current month's Minical, with adjacent week strips when current week is within 1 week of end/begin of month. I can't even see the cals for more input
* Same for planes. Cant even evaluate functionality.
* Weather view should show forecast view by default.
	* What emojis do we have available to us? Can we also list the temperature number, in a font color that matches to the temperature scale? (hot end red, cold end blue)
	* buttons underneath should be row 1) Send | Reveal Forecast, row 2) mechanics, row 3) management
	* Management should be
		* Reroll Today | Reroll All
		* History
			* History Should use the same forecast display, not a list.
		* Set Location
		* Set Manifest Zone
	* Reveal Forecast should be 2 rows, one for Medium, One for High, with 1 3 6 10 day buttons
	* Send sends currently known forecast obvs
	* Mechanics needs a cleaner presentation. also.. is the rolling totally broken? please audit. I'm seeing snow in the swamp
		* Above table, general forecast. Cold and snowy, etc.
		* Presentation is table, 7 rows (one is header), 4 columns (Time is clickable buttons)
		* Time, Temp, Prec., Wind
		* Use number scale.
		* "Hover Time to Show"
		* Hovering time of day field lists bullet point mechanics active during that bucket.
		* Hovering over a nighttiume bucket includes the lighting active.
			* Lighting is okay, but the in shadow part should be as prominent as the "Bright Moonlight" part.
			* Love the sourcing. Does the percentages refer to the % of light coming from each source? They should. Just top 3 needed.
				* Primary Sources: Zarantyr (45%), Olarune (35%), Therendor (10%)
				* Reduced by Clouds (x15%)
Error message: solve it
[**Test & Build**](https://github.com/MCherry1/calendar/actions/runs/23168766586/job/67315443176#step:19:2)

Node.js 20 actions are deprecated. The following actions are running on Node.js 20 and may not work as expected: actions/checkout@v4, actions/setup-node@v4, actions/upload-artifact@v4. Actions will be forced to run with Node.js 24 by default starting June 2nd, 2026. Please check if updated versions of these actions are available that support Node.js 24. To opt into Node.js 24 now, set the FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true environment variable on the runner or in your workflow file. Once Node.js 24 becomes the default, you can temporarily opt out by setting ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true. For more information see: [https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)

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

#### Events
* The default calendar view. The minical is the current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a fill color from the events
* Dots provided for additional events
* Tooltip event titles on hover (sources in parentheses)
* Buttons below are:
	* Previous | Next (months)
	* Additional Views
		* Current Year
			* (no buttons)
		* Upcoming (#n of months in calendar year) months (current month plus n-1)
			* (no buttons)
		* Specific Month (query mm or mm yyyy)
		* Specific Year (query yy)
	* Send (send current month view to players, GM only)
	* Management (GM only)
		* Source Controls
		* Add Custom Events
			* Add Single Event, Add Yearly, etc with prompted syntaxes
		* Insert other event management?
	* 

#### Moons
* The minical is the current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a black dot for a least 1 new and a yellow dot for at least 1 full
* Tooltip on hover with an indented bulleted list under New: and another under Full:, listing all moons either new or full.
* Buttons below are:
	* Previous | Next (month steps)
	* Additional Views
		* Current Year
			* (no buttons)
		* Upcoming (#n of months in calendar year) months (current month plus n-1)
			* (no buttons)
		* Specific Month (query mm or mm yyyy)
		* Specific Year (query yy)
	* Send (send current month view to players, GM only)
	* Management (GM only)
		* Source Controls
		* Add Custom Events
			* Add Single Event, Add Yearly, etc with prompted syntaxes
		* Insert other event management?

#### Weather
* The default calendar view. The minical is the current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a fill color from the events
* Buttons below are:
	* Previous | Next (months)
	* Send (send current view to players, GM only)
	* Management (GM only)
		* Source Controls
		* Add Custom Events
			* Add Single Event, Add Yearly, etc with prompted syntaxes
		* Insert other event management?

#### Planes
* The default calendar view. The minical is the current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a fill color from the events
* Buttons below are:
	* Previous | Next (months)
	* Send (send current view to players, GM only)
	* Management (GM only)
		* Source Controls
		* Add Custom Events
			* Add Single Event, Add Yearly, etc with prompted syntaxes
		* Insert other event management?
	* 
---

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
