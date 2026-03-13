# Agent Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. README is the target-behavior guide unless a statement is ambiguous; when code does not match README, track the code change here.

As these tasks are taken care of, remove them from this list.

If there is design ambiguity in this tasks list: keep the task intact and add a comment to the **Needs Design Input** section.

---
## Needs Design Input

None currently. Add new items here only when the desired implementation behavior is still ambiguous enough to block coding.

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

Status: Completed by GPT-5 Codex on 2026-03-13

- [x] Convert major README sections to collapsible `<details><summary>...</summary></details>` blocks where that improves readability

---

### Expand Knowledge Tiers guidance in README

Status: Completed by GPT-5 Codex on 2026-03-13

- [x] Add a recommended medium-tier skill-check table using DC 10 / 15 / 20 / 25 guidance
- [x] Add guidance for expert-tier reveals via magical or tool-assisted means
- [x] Document the default recommended reveal windows using Fibonacci-style progressions

---

### Expand README moon and sky reference material

Progress: Stable sky-model expansion completed by GPT-5 Codex on 2026-03-13. Ring of Siberys detail remains open.

- [x] Include the Eberron moon reference-body mapping table in README instead of only pointing to `DESIGN.md`
- [x] Expand **Modeling the Skies** with the remaining stable explanatory material
- [ ] Add Ring of Siberys detail for apparent color, angular size, and nearest Zarantyr clearance
- [ ] Add a Saturn-rings reference note covering real albedo range and physical makeup
- [ ] Add an angular-size comparison for the Ring of Siberys versus Earth's Moon and the major Eberron moons

---

### Refine Eberron moon inspiration notes in README

- [ ] Add name-origin notes for each Eberron moon
- [ ] Add relative-size comparisons versus Earth's Moon so the moon table is easier to visualize
- [ ] Rewrite the per-moon inspiration blurbs to be shorter and more evocative, not just factual
- [ ] Rewrite Eyre's Mimas note to accurately explain the forge / hammer / crater inspiration

---

### Add deterministic-seed author documentation

Status: Completed by GPT-5 Codex on 2026-03-13

- [x] Create a repo doc that explains how the script's seed-driven deterministic generation works for weather / moons / planes

---

### Replace planar "anomaly" terminology with "generated event" wording

Status: Completed by GPT-5 Codex on 2026-03-13

- [x] Remove user-facing uses of "anomaly", "anomalies", and "anomalous" from markdown docs and UI copy where those refer to generated planar events
- [x] Update deterministic-seed and design-facing documentation to describe those shifts as generated events instead of anomalies
- [x] Keep or defer internal identifier renames separately if a full code-symbol refactor is not worth the churn

---

### Add planar generated-event appendix to README

- [x] Add a per-plane table covering generated-event duration, trigger dice, and expected annual event count

---

### Embedded README notes resolved on 2026-03-12

- [x] Replace the Eberron reference-mapping table in `README.md` with per-moon reference and inspiration notes
- [x] Move the weather forecasting guidance above the mechanics tables in `README.md`
- [x] Add a per-plane weather-effects table to the planar weather section in `README.md`
- [x] Move the command reference out of `README.md` into `Chat Commands.md`
- [x] Rewrite the calendar-navigation docs around the intended month-jump workflow while still documenting the parser's supported date forms
- [x] Document smart date formats for moon, plane, and event commands in `Chat Commands.md`
- [x] Document event-source priority behavior in `Chat Commands.md`
- [x] Apply the full Gregorian leap-year rule in `calendar.js` while keeping February 29 inline with February

---

---

## Agent Ready

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes. A capable coding agent can complete these without further design discussion.

---

### Tighten top-level calendar jump syntax and documentation

Status: Completed by GPT-5 Codex on 2026-03-13

- [x] Audit what `!cal <dateSpec>` forms actually render in the top-level mini-calendar flow
- [x] Remove or rewrite confusing direct-jump examples in `Chat Commands.md` that do not map cleanly to month-based output
- [x] Reject or warn on ambiguous bare-number / single-day top-level jump inputs that do not make sense for a month mini-calendar
- [x] Whisper clearer syntax guidance for valid month-oriented jump forms

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
- [x] Ensure remote Syrania weather behavior is documented and implemented consistently with the planar model

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

Design clarified by user on 2026-03-13. This task is now implementation-ready.

- [ ] Report **true overlaps only**. Remove near-miss conjunction / crossing reports that do not have real disk overlap.
- [ ] Reclassify event types by actual overlap and relative apparent size:
  - `Total Eclipse`: the occluded body reaches **100% coverage** at peak.
  - `Partial Eclipse`: peak coverage is **greater than 0% but less than 100%**, and the occluding body's apparent diameter is **more than 75%** of the occluded body's apparent diameter.
  - `Transit`: peak coverage is **greater than 0% but less than 100%**, and the occluding body's apparent diameter is **75% or less** of the occluded body's apparent diameter.
- [ ] Coverage must be computed from the actual apparent disk overlap at peak and reported as the **percentage of the occluded body covered**.
- [ ] Include relative apparent size information in the output, using the two bodies' apparent diameters at peak.
- [ ] Use the script's existing play-facing time buckets for eclipse timing:
  - `Early Morning`
  - `Morning`
  - `Afternoon`
  - `Evening`
  - `Late Night`
- [ ] Use the script's existing sky-position vocabulary for eclipse location in the sky:
  - `Overhead`
  - `High`
  - `Visible`
  - `On horizon`
  - Do not surface an eclipse as visible flavor text if the event is below the horizon at the relevant report moment.
- [ ] Replace the current day-level eclipse phrasing with event-lifecycle phrasing that can span midnight cleanly. Required behavior:
  - First day of a cross-midnight event can say that the eclipse **begins** in one bucket and **ends tomorrow** in another bucket.
  - Following day should say the eclipse is **ending this <bucket>** rather than inventing a second independent event.
  - The system should identify one physical eclipse event and attach day-specific start / peak / end language to that same event.
- [ ] Eliminate duplicate "same eclipse on consecutive days" reporting caused by day-threshold detection. A physical eclipse should be grouped into a single event window, even if that window crosses midnight.
- [ ] Update the output copy so moon-sun and moon-moon events use a consistent eclipse/transit style, for example:
  - `Partial eclipse of Y by X, covering 43% of Y.`
  - `Transit of Y by X, covering 12% of Y.`
  - Add timing and sky-position context in the same sentence or immediately after it, e.g. `Beginning in the Afternoon, peaking High, ending tomorrow in the Morning.`
- [ ] Include enough detail in Today / moon-calendar notable text to convey:
  - event type (`Total Eclipse`, `Partial Eclipse`, or `Transit`)
  - occluding body and occluded body
  - peak coverage percent
  - relative apparent size comparison
  - start / peak / end bucket information
  - sky position at peak, using existing visibility labels
- [ ] Verify both same-day and cross-midnight events render coherently in:
  - Today view
  - moon mini-calendar notable text
  - any player-facing moon summaries that surface eclipse notes

---

### Specific-date weather reveals (divination mechanic)

This is the "divination magic" feature: GM reveals weather for a specific date at a specific location without revealing everything in between.

Progress: Common-knowledge low-tier reveals were expanded by GPT-5 Codex on 2026-03-13. Targeted date-spec reveal commands remain open.

- [ ] GM command: `!cal weather reveal <dateSpec>` using the existing standard date syntax, including ranges such as `14-17` and `4 5-7`
- [ ] Generation engine must still generate intermediate days for seeding, but those aren't revealed
- [ ] Revealed range uses the same week-strip presentation as regular forecasts, with blank cells where no data is revealed
- [ ] Player-facing forecast command shows only revealed data at the current location, with location name included
- [ ] GM-only reveal command with custom range input (cap at ~3 months to prevent chat flooding)
- [x] Each date stores a reveal flag (`low`, `medium`, `high`); no flag means unrevealed
- [x] Low reveal should auto-grant common-knowledge forecasts for today, tomorrow, and the day after tomorrow
- [x] Today's low reveal should include rough time-of-day guidance rather than a single all-day label
- [x] Tomorrow and the day after tomorrow should use one qualitative day headline / descriptor rather than full period breakdowns
- [ ] Always uses currently set location (GM switches location for planning, then switches back)
- [ ] **Location quick-switch**: Add a "recent locations" list (last 3 used) in the Location setting menu for fast switching

---

### Expand weather day model to five buckets

Status: Completed by GPT-5 Codex on 2026-03-13

- [x] Replace the current morning / afternoon / evening weather model with five play-facing buckets: Early Morning, Morning, Afternoon, Evening, Late Night
- [x] Use approximate bucket windows of `0-6`, `6-12`, `12-17`, `17-21`, and `21-24`
- [x] Early Morning should inherit the previous night's weather while transitioning into the new day's rolls
- [x] Update weather generation, display text, mechanics text, and reveal text that currently assume only three daily periods

---

### Non-annual traditional plane anchor mode flags

- [x] Implement per-plane non-annual traditional-cycle source mode (`random-seed` vs `gm-anchored`) based on plane seed/anchor overrides, including planes that mix annual and non-annual traditional periods (e.g., Mabar).
- [x] Verify the implementation in the Planes view and state API to confirm each qualifying plane reports the expected mode and annual-only planes remain untagged.

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

Status: Completed by GPT-5.2-Codex

- [x] Remove leap-year annotation text from Gregorian leap-day rendering
- [x] Present Gregorian leap-day labeling as February 29 in calendar/date text outputs

---

### Validate recent agent-ready updates

Status: Completed by GPT-5.2-Codex

- [x] Validate Syrania remote/coterminous + manifest-zone weather overlays end-to-end in GM and player weather views
- [x] Validate Gregorian leap-day presentation around February in a leap year and non-leap year (no separate Leap Year annotation)

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

Status: Completed by GPT-5.2-Codex

- [x] Audit all mini-calendar/subsystem month-nav controls (GM and player views) and remove any center `Current` button where `Prev`/`Next` are already present
- [x] Keep `Prev` and `Next` buttons visible beneath the mini-calendar in every subsystem view for both players and GMs
- [x] Update any related help/UI copy that still references a `Current` button in mini-calendar navigation

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
