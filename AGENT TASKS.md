# Agent Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. README is the target-behavior guide unless a statement is ambiguous; when code does not match README, track the code change here.

As these tasks are taken care of, remove them from this list.

If there is design ambiguity in this tasks list: keep the task intact and add a comment to the **Needs Design Input** section.

---
## Needs Design Input

- **Weather low-tier auto-reveal buckets:** current code auto-records low-tier weather for the current day. The desired tomorrow/day-after common-knowledge buckets are described below, but the exact split still needs confirmation before implementation.
- **Weather overnight period:** the README notes ask whether weather should gain an overnight snapshot in addition to morning/afternoon/evening. That is a design change, not just documentation.
- **Sky-model day-length explanation:** the README requests a concrete explanation of how inclination affects day length in the Eberron sky model, but the desired level of numeric detail is not yet specified.

## README Drift (checked 2026-03-12)

- **Weather → Syrania Remote:** manifest zones now behave as lighter overlays, but Syrania's remote-state documentation/implementation still needs a final consistency pass against the planar model.
- **Commands → Weather → Sending Weather to Players:** `!cal weather send` now broadcasts whatever weather is already revealed, and `!cal weather reveal medium|high [1-10]` grants the current range-based forecast reveals. Per-day reveal flags and arbitrary-date reveal syntax are still not implemented.
	- send should not have any arguments followed. it should simply function as "send whatever is revealed"
	- weather should have a per day reveal flag that defines how much information the players have acquired. the low reveal level should be automatically granted when the day in questions falls into the bucket for that. I think we currently low reveal to different degrees between today (rough ToD info, tomorrow (limited forecast), day after tomorrow (same). 
- **Calendar Systems:** Harptos date math is present, but the rendered calendar still uses weekday columns; tenday layout remains tracked in the agent-ready section below.
	- this needs to be implemented, with rows of 10, redone weekday labels using 1st, 2nd, etc.

---
## Match Script to README.md and Design.md
- Check README for accuracy against the script implementation, add section at the top of this file that lists which sections are not how the script is currently implemented. Completed by ChatGPT version number 5.4
---
## Update README.md
- Do not overwrite any text in the README.
- README is incomplete. Fill in the sections where tasks are clear. Completed by ChatGPT version number 5.4
---

## Documentation Tasks

These are README / repo-doc tasks extracted from embedded notes in the README.

---

### README presentation cleanup

- [ ] Convert major README sections to collapsible `<details><summary>...</summary></details>` blocks where that improves readability

---

### Expand Knowledge Tiers guidance in README

- [ ] Add a recommended medium-tier skill-check table using DC 10 / 15 / 20 / 25 guidance
- [ ] Add guidance for expert-tier reveals via magical or tool-assisted means
- [ ] Document the default recommended reveal windows using Fibonacci-style progressions

---

### Expand README moon and sky reference material

- [ ] Include the Eberron moon reference-body mapping table in README instead of only pointing to `DESIGN.md`
- [ ] Expand **Modeling the Skies** with the remaining stable explanatory material
- [ ] Add Ring of Siberys detail for apparent color, angular size, and nearest Zarantyr clearance

---

### Add deterministic-seed author documentation

- [ ] Create a repo doc that explains how the script's seed-driven deterministic generation works for weather / moons / planes

---

### Add planar anomaly appendix to README

- [ ] Add a per-plane table covering generated anomaly duration, trigger dice, and expected annual event count

---

---

## Agent Ready

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes. A capable coding agent can complete these without further design discussion.

---

### Retire the player `Month` button and the calendar-level `Upcoming` view

Status: Completed by ChatGPT version number 5.4

- [x] Remove the center `Month` button from the player quick bar
- [x] Remove the top-level calendar `Upcoming` button/view/command flow
- [x] Remove top-level `Upcoming` references from README/help/UI copy
- [x] Keep subsystem-specific forecast/upcoming commands only if they are still intentionally supported

---

### Add an independent weather-mechanics toggle

Status: Completed by ChatGPT version number 5.4

- [x] Allow weather narration to remain enabled while mechanical weather effects are disabled
- [x] Surface the toggle in settings/UI and document the behavior in README

---

### Fix mini-calendar last-row clipping

Status: Completed by ChatGPT version number 5.4

- [x] Investigate the mini-calendar row-height/clipping bug where the final row appears shorter or visibly clipped
- [x] Fix the base mini-calendar cell sizing so number text and event dots fit consistently in every row
- [x] Verify the fix across the default calendar, weather/moon/plane mini-calendars, and adjacent/overflow rows

---

### Rebalance Syrania weather effects

- [x] Keep "calm, clear skies" as the **coterminous Syrania** planar effect
- [x] Change **Syrania manifest zones** to a lighter modifier (`-1` wind, `-1` precipitation)
- [ ] Ensure remote Syrania weather behavior is documented and implemented consistently with the planar model

---

### Manifest zone system redesign

Status: Completed by ChatGPT version number 5.4

- [x] Treat manifest zones as location-parallel state (independent of weather location)
- [x] Add **Set Manifest Zone** button below **Set Location** in the admin panel
- [x] New chooser UI: 2-column table (Zone name | On/Off toggle), supporting all 13 planes + None
- [x] Support **multiple** simultaneously active manifest zones
- [x] Visual state: active zones bold, inactive zones faint + italic
- [x] Toggle click posts a simple chat confirmation, doesn't re-render the full table
- [x] Clear all active manifest zones on location change, with summary message
- [x] Aryth full-moon reminder: "Aryth is full. Consider a manifest zone."
- [x] Track which zones were activated during Aryth full
- [x] On date advance past Aryth full: warning to deactivate those zones
- [x] Show manifest-zone status in Today view (always visible when active)
- [x] No manifest-zone forecasting
- [x] Wire Fernia/Risia temperature effects (±3 on new scale) through the manifest zone mechanic instead of current approach
- [x] Fernia and Risia can both be active at once; their temperature effects cancel, but both still display as active influences

---

### Eclipse and crossing math overhaul

- [ ] Fix potential multi-day eclipse reports (eclipses should be single-day events with time-of-day precision)
- [ ] Add percentage coverage to eclipses, based on relative angular sizes of the bodies
- [ ] Phrase all events as eclipses in the form: `X eclipses the nn% smaller/larger Y, covering mm% of Y!`
- [ ] Add time-of-day labels to all eclipses and moon-crossing events:
  - Early hours (0–6), Morning (6–12), Afternoon (12–17), Evening (17–22), Night (22–0)

---

### Specific-date weather reveals (divination mechanic)

This is the "divination magic" feature: GM reveals weather for a specific date at a specific location without revealing everything in between.

- [ ] GM command: `!cal weather reveal <dateSpec>` using the existing standard date syntax, including ranges such as `14-17` and `4 5-7`
- [ ] Generation engine must still generate intermediate days for seeding, but those aren't revealed
- [ ] Revealed range uses the same week-strip presentation as regular forecasts, with blank cells where no data is revealed
- [ ] Player-facing forecast command shows only revealed data at the current location, with location name included
- [ ] GM-only reveal command with custom range input (cap at ~3 months to prevent chat flooding)
- [ ] Each date stores a reveal flag (`low`, `medium`, `high`); no flag means unrevealed
- [ ] Low reveal occurs automatically when the current date matches the common-knowledge criteria
- [ ] Always uses currently set location (GM switches location for planning, then switches back)
- [ ] **Location quick-switch**: Add a "recent locations" list (last 3 used) in the Location setting menu for fast switching

---

### Correct Harptos calendar display

The Faerûnian/Harptos calendar currently uses weekday-based layout. It should use tendays:
- [ ] Each month = 3 rows × 10 columns
- [ ] Column labels: `1st` through `10th`
- [ ] Date format: `16th of <Month>, <Year> DR`
- [ ] Festival/intercalary day strip:
  - Looks like a day/event cell with no number
  - Hover shows the event name
  - Sits in its own row with one festival cell and a centered 9-day-width blank/default cell
  - Appears in both adjacent month displays
  - Includes the gap separators described in the task notes for preceding/subsequent month views and the shoulder strip

---

### Fix Gregorian leap day presentation

The Gregorian calendar's leap day is currently marked as "intercalary" with a separate display. It should simply be February 29th — part of February, not a special intercalary day. Remove any "Leap Year" annotations; the presence of the 29th is sufficient indication.

---

### Refactor temperature generators to −5 to 15 scale

Status: Completed by ChatGPT version number 5.4

The four target data tables (`WEATHER_TEMPERATURE_BANDS_F`, `WEATHER_COLD_CLOTHING_TIERS`, `WEATHER_HEAT_ARMOR_RULES`, `WEATHER_TEMPERATURE_SYSTEM_RULES`) are already defined in the script using band indices -5 through 15.

However, the actual temperature generators (`WEATHER_CLIMATE_BASE` and the formula/roll system) produce values on a **0–10 stage scale**, not the -5 to 15 band scale. The task is to refactor the generators so their output maps directly to the -5 to 15 band indices, eliminating the intermediate stage layer.

**Scope:** All climate definitions in `WEATHER_CLIMATE_BASE` (polar, subarctic, temperate, subtropical, tropical, arid, etc.) and the `_composeFormula()` / `_rollTrait()` pipeline need to output on the -5 to 15 scale. The existing F° band mappings in `WEATHER_TEMPERATURE_BANDS_F` should remain unchanged — the generator output just needs to index into them directly.

**Note:** Fernia/Risia manifest zone temperature modifiers now use `±3`, matching the current scale and DESIGN.md guidance.

---

### Show weather influence sources

Status: Completed by ChatGPT version number 5.4

In the weather display (both GM and player views), indicate when a plane, manifest zone, or moon is currently modifying weather conditions. For example: "🌙 Zarantyr (lightning boost)" or "🔥 Fernia manifest zone (+3 temp)". This should appear as a small annotation line, not clutter the main display.

---

### Ensure players can use `!cal` subsystem views

Status: Completed by ChatGPT version number 5.4

Players can currently use `!cal` for the basic calendar view. Verify and enable access to subsystem views (weather forecast, moon phases, planar status) with appropriate permission gating:
- Weather: players see their revealed forecast only (already works via `!cal weather`)
- Moons: players see their revealed moon data (already works via `!cal moon`)
- Planes: players see their revealed planar data
- Today: players should see a simplified Today view (currently GM-only)

---

### Expose adjacent month navigation for players

Status: Completed by ChatGPT version number 5

The player quick bar now includes `◀ Prev`, `📅 Month`, and `Next ▶` month-navigation buttons alongside the player subsystem links.

---

### Remove `Current` button from subsystem mini-calendar navigation

- [ ] Audit all mini-calendar/subsystem month-nav controls (GM and player views) and remove any center `Current` button where `Prev`/`Next` are already present
- [ ] Keep `Prev` and `Next` buttons visible beneath the mini-calendar in every subsystem view for both players and GMs
- [ ] Update any related help/UI copy that still references a `Current` button in mini-calendar navigation

---

### Accept arbitrary GM weather forecast spans up to 20 days

Status: Completed by ChatGPT version number 5

`!cal weather forecast [n]` and `!cal settings weatherdays [n]` now accept any integer from `1` to `20` instead of only `10` or `20`.

---

### Simplify weather broadcast flow

Status: Completed by ChatGPT version number 5

`!cal weather send` now broadcasts the forecast information players already know, while `!cal weather reveal medium|high [1-10]` handles the existing range-based reveal-and-send workflow.

---

### Ring of Siberys presentation

Status: Completed by ChatGPT version number 5

README and lore output now document the Ring of Siberys under **Modeling the Skies**, including inclination `0°`, daylight visibility, albedo, nighttime illumination contribution, Saturn-ring scaling, and height-above-surface comparisons.

---

## Design Tasks

These tasks still need design direction before coding.

---

### Reduce Today-view clutter

The Today view needs a redesign to reduce information density. Specific changes to be directed — this task is a placeholder awaiting design direction.

---

---

## Acceptance Checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
