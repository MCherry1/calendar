# Agent Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. This file tracks implementation work only.

As these tasks are taken care of, remove them from this list.

If there is design ambiguity in this tasks list: keep the task intact and add a comment to the **Needs Design Input** section.

---
## Needs Design Input


## README Drift (checked 2026-03-11)

- **Calendar Navigation → Player Buttons:** the live player quick bar is `Today / Weather / Moons / Planes`; it does not currently expose month navigation or `Upcoming`.
	-  TASK: Expose adjacent month navigation.
- **Weather → Location:** manifest-zone selection is still the final step of the location wizard and remains part of the active location profile instead of independent parallel state.
	- The Manifest Zone selection should be independant of location, with a few exceptions. 1. when the location is changed, the active manifest zones should be removed, and a whispered note to the GM should inform them of that fact. Manifest zones are location specific 
- **Commands → Weather → Viewing Weather:** `!cal weather forecast` currently accepts explicit spans of `10` or `20`, not an arbitrary `n`.
	- it should accept arbitrary integers, up to 20 days
- **Commands → Weather → Sending Weather to Players:** the implemented GM send syntax is `!cal weather send today` and `!cal weather send medium|high <1|3|6|10>`; `!cal weather send low` is not implemented.
	- send should not have any arguments followed. it should simply function as "send whatever is revealed"
	- weather should have a per day reveal flag that defines how much information the players have acquired. the low reveal level should be automatically granted when the day in questions falls into the bucket for that. I think we currently low reveal to different degrees between today (rough ToD info, tomorrow (limited forecast), day after tomorrow (same). 
- **Calendar Systems:** Harptos date math is present, but the rendered calendar still uses weekday columns; tenday layout remains an open design task below.
	- this needs to be implemented, with rows of 10, redone weekday labels using 1st, 2nd, etc.

---
## Match Script to README.md and Design.md
- Check README for accuracy against the script implementation, add section at the top of this file that lists which sections are not how the script is currently implemented. Completed by ChatGPT version number XXX
	- you were supposed to insert your version number for XXX. I htink this was done by v5.4
---
## Update README.md
- Do not overwrite any text in the README.
- README is incomplete. Fill in the sections where tasks are clear. Completed by ChatGPT version number XXX
---

---

## Coding Tasks

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes. A capable coding agent can complete these without further design discussion.

---

### Refactor temperature generators to −5 to 15 scale

Status: Completed by ChatGPT version number XXX

The four target data tables (`WEATHER_TEMPERATURE_BANDS_F`, `WEATHER_COLD_CLOTHING_TIERS`, `WEATHER_HEAT_ARMOR_RULES`, `WEATHER_TEMPERATURE_SYSTEM_RULES`) are already defined in the script using band indices -5 through 15.

However, the actual temperature generators (`WEATHER_CLIMATE_BASE` and the formula/roll system) produce values on a **0–10 stage scale**, not the -5 to 15 band scale. The task is to refactor the generators so their output maps directly to the -5 to 15 band indices, eliminating the intermediate stage layer.

**Scope:** All climate definitions in `WEATHER_CLIMATE_BASE` (polar, subarctic, temperate, subtropical, tropical, arid, etc.) and the `_composeFormula()` / `_rollTrait()` pipeline need to output on the -5 to 15 scale. The existing F° band mappings in `WEATHER_TEMPERATURE_BANDS_F` should remain unchanged — the generator output just needs to index into them directly.

**Note:** Fernia/Risia manifest zone temperature modifiers (currently ±2) may need adjustment for the new scale. ±3 seems appropriate per DESIGN.md notes.

---

### Show weather influence sources

Status: Completed by ChatGPT version number XXX

In the weather display (both GM and player views), indicate when a plane, manifest zone, or moon is currently modifying weather conditions. For example: "🌙 Zarantyr (lightning boost)" or "🔥 Fernia manifest zone (+3 temp)". This should appear as a small annotation line, not clutter the main display.

---

### Ensure players can use `!cal` subsystem views

Status: Completed by ChatGPT version number XXX

Players can currently use `!cal` for the basic calendar view. Verify and enable access to subsystem views (weather forecast, moon phases, planar status) with appropriate permission gating:
- Weather: players see their revealed forecast only (already works via `!cal weather`)
- Moons: players see their revealed moon data (already works via `!cal moon`)
- Planes: players see their revealed planar data
- Today: players should see a simplified Today view (currently GM-only)

---

---

## Design Tasks

These tasks involve architectural decisions, UI/UX design choices, or system interactions that need human input or more careful deliberation before coding. They may require creating a `design/` file for discussion.

---

### Manifest zone system redesign

The manifest zone system needs a significant architectural change. Currently zones are set as part of location selection (single zone per location). The target design is:

- [ ] Treat manifest zones as location-parallel state (independent of weather location)
- [ ] Add **Set Manifest Zone** button below **Set Location** in the admin panel
- [ ] New chooser UI: 2-column table (Zone name | On/Off toggle), supporting all 13 planes + None
- [ ] Support **multiple** simultaneously active manifest zones
- [ ] Visual state: active zones bold, inactive zones faint + italic
- [ ] Toggle click posts a simple chat confirmation, doesn't re-render the full table
- [ ] Clear all active manifest zones on location change, with summary message
- [ ] Aryth full-moon reminder: "Aryth is full. Consider a manifest zone."
- [ ] Track which zones were activated during Aryth full
- [ ] On date advance past Aryth full: warning to deactivate those zones
- [ ] Show manifest-zone status in Today view (always visible when active)
- [ ] No manifest-zone forecasting
- [ ] Wire Fernia/Risia temperature effects (±3 on new scale) through the manifest zone mechanic instead of current approach

**Design questions:** How should multiple simultaneous manifest zones interact? Do their temperature effects stack? What happens if Fernia and Risia are both active (cancel out)?
	They should cancel out yes, but they should not be ignored. They should both be active at once, with hints mentioning that fact.

---

### Eclipse and crossing math overhaul

- [ ] Fix potential multi-day eclipse reports (eclipses should be single-day events with time-of-day precision)
- [ ] Add percentage coverage to eclipses, based on relative angular sizes of the bodies
- [ ] Consider terminology changes: "X is traversing the sun" vs "solar eclipse" depending on coverage percentage
- [ ] Add time-of-day labels to all eclipses and moon-crossing events:
  - Early hours (0–6), Morning (6–12), Afternoon (12–17), Evening (17–22), Night (22–0)

**Design questions:** What coverage threshold distinguishes a "transit" from an "eclipse"? Should partial eclipses be reported differently from total/annular eclipses?
	- I actually don't know. I just thought it was strange to call everything an eclipse when these bodies are so different in size. Let's do it like this: call everything an eclipse, phrase like X eclipses the nn% smaller/larger Y, covering mm% of Y!

---

### Specific-date weather reveals (divination mechanic)

This is the "divination magic" feature: GM reveals weather for a specific date at a specific location without revealing everything in between.

- [ ] GM command to generate weather to a target date at current location, then reveal only that date (or a date range)
- [ ] Generation engine must still generate intermediate days for seeding, but those aren't revealed
- [ ] Revealed range uses the same week-strip presentation as regular forecasts, with blank cells where no data is revealed
- [ ] Player-facing forecast command shows only revealed data at the current location, with location name included
- [ ] GM-only reveal command with custom range input (cap at ~3 months to prevent chat flooding)
- [ ] Always uses currently set location (GM switches location for planning, then switches back)
- [ ] **Location quick-switch**: Add a "recent locations" list (last 3 used) in the Location setting menu for fast switching

**Design questions:** What should the GM command syntax look like? Should the reveal command accept both single dates and ranges? How should the week-strip handle sparse reveals (e.g., day 37 and day 42 revealed, nothing in between)?
	- !cal weather reveal >>standard date syntaxes accepted<<, e.g. 14-17 (next example of 14-17), 4 5-7 (next example of month 4, days 5-7). I think we already do this?
	- and yes, each date should get a flag of reveal low/med/high. if there is no flag, then no reveal. low reveal occurs automatically when the current date matches the criteria. I think we do same day ToD info, then days 2-3 very broad ranges that basically say "kinda like today". let me know if not.

---

### Reduce Today-view clutter

The Today view needs a redesign to reduce information density. Specific changes to be directed — this task is a placeholder awaiting design direction.

---

### Correct Harptos calendar display

The Faerûnian/Harptos calendar currently uses weekday-based layout. It should use tendays:
- [ ] Each month = 3 rows × 10 columns
- [ ] Column labels: `1st` through `10th`
- [ ] Date format: `16th of <Month>, <Year> DR`

**Design question:** How should the 5 festival days (intercalary days between months) be displayed? They don't belong to any month or tenday.
	- I think they should basically look like a day with an event, but no number is in the cell. hovering the cell says the events' name. a suitable color should be obvious based on the holidays being seasonal things. they'd sit in their own row. the rest of the row should just be a single, 9-day-width cell with a default/blank background, and the title of the day would be centered in that cell. But they should be shown during the month displays for both adjacent months. For the preceding month, a small gap between the rows of the last tenday (21-30) and the intercalery. For the subsequent month, the intercalery "10day strip" would be shown, then a small gap separator, then the month header bar and normal month display below. For the "shoulder strip" display we use, it should be positioned appropriately as well around this intercaler strip.

---

### Fix Gregorian leap day presentation

The Gregorian calendar's leap day is currently marked as "intercalary" with a separate display. It should simply be February 29th — part of February, not a special intercalary day. Remove any "Leap Year" annotations; the presence of the 29th is sufficient indication.
 - this seems like we can move it to coding tasks

---

### Ring of Siberys presentation

- [ ] Confirm equatorial placement (inclination 0°) and "stands out in daylight" visual
- [ ] Update README: document the relative albedo used, contribution to nighttime lighting, Saturn's-rings-scaled-to-Earth's-radius analogy, relative height above surface with comparative references (above ISS, edge of LEO, etc.). This should be in a section of the readme called "Modeling the Skies"
	- [ ] this seems like we can call it a coding task. 

---

---

## Acceptance Checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
