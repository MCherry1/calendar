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
* Spacing Line Break
* Time of Day
* Current Weather
* Spacing Line Break
* Ascendant Moons: List
* New Moons: List
* Full Moons: List
* Spacing Line Break
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
	* Shows the requested month, Current Date below, and regenerates the prev/next buttons and the send button, but NOT the Additional Ranges or Management.
* Send to Players (send month view to players, GM only. this one is specific. its not necessarily the ACTIVE CURRENT month, but the month that was most recently displayed to the GM, which many be differnt via the previous and next buttons)
* small line break
* Additional Ranges (opens drop down menu)
	* Full Year
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
	* Source Controls (I think these are super cluttered but will address later)
	* Agent task are there other event managements needed?

#### Moons
* All info is specific to the current calendar date
* Only show information if the subsystem is active.
* Show New and/or Full moons
##### Minical
* Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Header bar is based on the color scheme, and consists of the current month and year
* Subheader bar is the days of the week
* Cells are numbered, with a black dot for at least 1 new and a yellow dot for at least 1 full
	* These dots should be a good size. not small. should be clear
	* For systems with only one moon, replace the numbered date with a full or new moon emoji as appropriate.
	* For systems with only one moon, tooltip hover should say phase (waxing gibbous, etc.)
* Tooltip on hover with an indented bulleted list under New: and another under Full:, listing all moons either new or full.
##### Text Info
* Current Date
* Ascendant Moons: List
* New Moons: List
* Full Moons: List
##### Buttons
* Previous | Next (month steps)
	* Shows the requested month, Current Date below, Ascendant Moons below (for the named month), and regenerates the prev/next buttons and the send button, but NOT the Additional Views, Current Phases, or Management.
* Send to Players (send month view to players, GM only. this one is specific. its not necessarily the ACTIVE CURRENT month, but the month that was most recently displayed to the GM, which many be differnt via the previous and next buttons)
* small line break
* Current Phases
	* Whispers a clean bulleted list with swatch + moon name, subbullets current phase (waning crescent, etc.) and upcoming "New/Full in X days on insert-month-and-day-date-format"
* small line break
* Specific Moons (named drop down list)
	* Displays current plus n-1 upcoming months
	* Displays Single Bar with Moon Name, colored with moon color, then outputs a year's worth of minicals
	* Current date cell is still emphasized
	* Replaces the numbered date in a cell with a full or new moon emoji, when appropriate
	* tooltip hover should say phase (waxing gibbous, etc.)
* small line break
* Additional Ranges (no additional buttons after these are displayed)
	* Full Year
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

#### Weather (agent task this weather section isn't quite as detailed but you can take instruction from it and inspiration from the other sections above)
* All info is specific to the current calendar date
* Only show information if the subsystem is active.
##### Minical
* The weather minical is a bit different than the others
* it only needs the fully generated range
* if there are previous days to the left of the current day (as in its not the first day of the week, show those days' weather slightly faded)
* only show last weeks weather if its the first day of the week, and you need a whole extra row for "yesterday"
* shuld have header bar, weekday headers, but then the cell should be unique. the weatehr cell should have a small vertical gap fro mthe weekday name bar.
* emoji weather primary, but below it a L / H for the day. no numbered date is required, but we should use today style for that bit of obviousness
* if more than one row is required to show the known informatio, rows below should be similarly gapped
* lets refactor the weather a bit here. we're going to calculate the time of day stuff and all the variation, but we're only going to "use" afternoon weather UNLESS time of day is active
* the lows and highs should be in Farenheit, which is easy, because well just add 1d10 randomly from the bottom end of the band range. the mechanics only care about the band so this specifics is just flavor. the only gotcha is making sure low is lower than high when the temp band is the same the whole day.
* we'll have the Low and High band from all of our time of day stuff
* when we present mechanics, we ONLY present afternoon mechanics, UNLESS time of day is active. We will still use all the nuance behind the scenes, but when we present mechanics or emojis, we aren't going to clutter the whole system with the whole day. this includes lighting 
* Current month, full display, including shoulder week logic for displaying a week strip from a nearby adjacent month.
* Cells are numbered, with a fill color from the events
##### Text Info
* Current Date
* Time of Day
* Current Location
* Current Weather
* Current Light Level (if before sunrise or after sunset)
* Active Mechanics
##### Buttons
* Send (send forecast to players, GM only, renders enough cells to cover the range)
* small spacer line
* Medium Forecast (4 buttons)
* High Forecast (4 buttons)
* small spacer line
* Set Location | Set Manifest Zone (if in Eberron)
* small spacer line
* Reveal Additional Range (drop down menu for Medium or High, then a drop down menu for single or multiple days, then a query for start date, then a query for end date. if single day then just says which date)
* make sure to whisper when location or zone or weather is generated
#### Planes
* agent task:
	* can you update this section to basically match the moons section, but with Coterminous and Remote replacing New and Full, and with the Planes names replacing the moons names? and skipping any phase descriptor line (waxing, waning, etc.).
	* however, we also want to sort of use the events minical style of cell shading for specific periods. each plane needs a color. when coterminous, will use that color, when remote, will use that color with a bit of fading and some very subtly black diagonal lines shading. make sure that you are shading / cell filling the whole range of the event, not just beginning or end.
		* an exception is going to be for really long periods - like greater than a month. those wont be shaded
	* mouse hover tooltip will show Coterminous: List and Remote: List as bulleted lists with plane names, indented below the cot/rem.
	* text below will be current date, coterminous and remote lists (only covering the current date), but those lists include more info than moons would
		* After the name of the plane, include in parentheses
			* For events lasting longer then 1 month: "Coterminous/Remote for Y years and X months Starting in YYY, ending in Y years X months
				* Use your imagination on how to phrase that. we don't need to know specific date if more than a few months old. "Daanvi went coterminous on Zarantyr 1 85 years ago". 85 years ago is enough.
			* For events less than a month: ending in X days.
	* current phases isn't really needed for planes. but specific plane cals ARE. they should use the same logic as the moons. show the whole year. for players (for moons too), only include as far as they have forecast knowledge for. which might be more for planes cause they always know the annual events
	* Hopefully this is enough


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
