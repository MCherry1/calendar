# Agent Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. README is the target-behavior guide unless a statement is ambiguous; when code does not match README, track the code change here.

As these tasks are taken care of, remove them from this list.

If there is design ambiguity in this tasks list: keep the task intact and add a comment to the **Needs Design Input** section.

---
## Needs Design Input

None currently. Add new items here only when the desired implementation behavior is still ambiguous enough to block coding.

---

## Best Claude Only — Review Completed Work

These items were completed by various ChatGPT versions (5, 5.2-Codex, 5.4, GPT-5 Codex). Each needs a thorough review by Claude Opus to verify correctness, code quality, lore fidelity, and consistency with DESIGN.md.

### Review: Match Script to README.md and Design.md
*Originally completed by ChatGPT 5.4*
- [ ] Verify that the README accuracy audit was thorough — cross-check each README section against the current script implementation
- [ ] Confirm no stale or incorrect claims remain in README after the audit

### Review: Update README.md
*Originally completed by ChatGPT 5.4*
- [ ] Check that filled-in README sections are accurate, well-written, and consistent with DESIGN.md
- [ ] Verify no existing README text was overwritten or lost

### Review: README presentation cleanup
*Originally completed by GPT-5 Codex on 2026-03-13*
- [ ] Verify collapsible `<details>` blocks are used appropriately and don't hide critical information
- [ ] Check that all sections render correctly in GitHub markdown

### Review: Expand Knowledge Tiers guidance in README
*Originally completed by GPT-5 Codex on 2026-03-13*
- [ ] Verify the medium-tier skill-check table uses correct DC 10/15/20/25 guidance matching DESIGN.md
- [ ] Verify expert-tier reveal guidance is accurate and lore-consistent
- [ ] Check that Fibonacci-style progression windows are documented correctly

### Review: Add deterministic-seed author documentation
*Originally completed by GPT-5 Codex on 2026-03-13*
- [ ] Verify the seed documentation accurately describes how weather/moon/plane deterministic generation works in the actual code
- [ ] Check for any omissions or inaccuracies in the seed explanation

### Review: Replace planar "anomaly" terminology with "generated event"
*Originally completed by GPT-5 Codex on 2026-03-13*
- [ ] Grep for any remaining user-facing uses of "anomaly"/"anomalies"/"anomalous" in docs and UI copy
- [ ] Verify deterministic-seed and design docs consistently use "generated event" terminology

### Review: Add planar generated-event appendix to README
*Originally completed (uncredited)*
- [ ] Verify the per-plane table covers duration, trigger dice, and expected annual event count for all 13 planes
- [ ] Cross-check table values against the actual code constants

### Review: Embedded README notes resolved on 2026-03-12
*Originally completed (uncredited)*
- [ ] Verify per-moon reference/inspiration notes replaced the old mapping table correctly
- [ ] Verify weather forecasting guidance is above mechanics tables in README
- [ ] Verify per-plane weather-effects table exists and is accurate
- [ ] Verify command reference was fully moved to `Chat Commands.md` with nothing lost
- [ ] Verify calendar-navigation docs reflect the month-jump workflow
- [ ] Verify smart date formats are documented for moon, plane, and event commands
- [ ] Verify event-source priority behavior is documented
- [ ] Verify Gregorian leap-year rule uses full algorithm (div by 4, not by 100 unless also by 400)

### Review: Tighten top-level calendar jump syntax and documentation
*Originally completed by GPT-5 Codex on 2026-03-13*
- [ ] Test `!cal <dateSpec>` forms and verify ambiguous inputs are rejected/warned
- [ ] Check `Chat Commands.md` for any confusing direct-jump examples that remain

### Review: Retire the player Month button and calendar-level Upcoming view
*Originally completed by ChatGPT 5.4*
- [ ] Verify the player `Month` button is fully removed from the quick bar
- [ ] Verify all top-level `Upcoming` button/view/command flows are removed
- [ ] Check README/help/UI copy for stale `Upcoming` references

### Review: Add an independent weather-mechanics toggle
*Originally completed by ChatGPT 5.4*
- [ ] Verify weather narration stays enabled when mechanics are disabled
- [ ] Verify the toggle appears in settings/UI and is documented in README

### Review: Fix mini-calendar last-row clipping
*Originally completed by ChatGPT 5.4*
- [ ] Verify cell sizing is consistent across all rows in all mini-calendar variants
- [ ] Check that number text and event dots fit in every cell without clipping

### Review: Rebalance Syrania weather effects
*Originally completed (uncredited)*
- [ ] Verify coterminous Syrania uses "calm, clear skies" effect
- [ ] Verify Syrania manifest zones use `-1 wind, -1 precipitation` modifier
- [ ] Check that remote Syrania behavior matches the planar model documentation

### Review: Manifest zone system redesign
*Originally completed by ChatGPT 5.4*
- [ ] Verify manifest zones are location-parallel (independent of weather location)
- [ ] Verify Set Manifest Zone button exists in admin panel with correct UI (2-column, toggles, bold/faint styling)
- [ ] Verify multiple simultaneous manifest zones work correctly
- [ ] Verify manifest zones clear on location change with summary message
- [ ] Verify Aryth full-moon reminder and deactivation warning work across date advancement
- [ ] Verify Fernia/Risia ±3 temperature effects are wired through manifest zone mechanic
- [ ] Verify Fernia+Risia simultaneous activation cancels temperature but both display

### Review: Expand weather day model to five buckets
*Originally completed by GPT-5 Codex on 2026-03-13*
- [ ] Verify all five buckets (Early Morning, Morning, Afternoon, Evening, Late Night) use correct hour windows
- [ ] Verify Early Morning inherits previous night's weather with transition
- [ ] Check that all weather generation, display, mechanics, and reveal text use five buckets (no leftover three-bucket code)

### Review: Non-annual traditional plane anchor mode flags
*Originally completed (uncredited)*
- [ ] Verify per-plane non-annual traditional-cycle source mode works for qualifying planes
- [ ] Verify annual-only planes remain untagged

### Review: Fix Gregorian leap day presentation
*Originally completed by GPT-5.2-Codex*
- [ ] Verify leap day renders as "February 29" without "intercalary" or "Leap Year" annotations
- [ ] Check both leap year and non-leap year February rendering

### Review: Validate recent agent-ready updates
*Originally completed by GPT-5.2-Codex*
- [ ] Re-validate Syrania remote/coterminous + manifest-zone weather overlays in GM and player views
- [ ] Re-validate Gregorian leap-day presentation around February

### Review: Refactor temperature generators to −5 to 15 scale
*Originally completed by ChatGPT 5.4*
- [ ] Verify all climate definitions output on the -5 to 15 band scale (not the old 0-10 stage scale)
- [ ] Verify `_composeFormula()` / `_rollTrait()` pipeline indexes directly into `WEATHER_TEMPERATURE_BANDS_F`
- [ ] Verify Fernia/Risia manifest zone modifiers use ±3 on the new scale

### Review: Show weather influence sources
*Originally completed by ChatGPT 5.4*
- [ ] Verify plane, manifest zone, and moon modifiers appear as annotation lines in both GM and player weather views
- [ ] Check that annotations are informative but don't clutter the main display

### Review: Ensure players can use !cal subsystem views
*Originally completed by ChatGPT 5.4*
- [ ] Verify player access to weather forecast (revealed data only), moon phases, and planar status
- [ ] Verify players see a simplified Today view
- [ ] Check permission gating is correct (players see only what's been revealed)

### Review: Expose adjacent month navigation for players
*Originally completed by GPT-5*
- [ ] Verify player quick bar includes Prev/Next month navigation buttons
- [ ] Verify navigation works correctly for players

### Review: Remove Current button from subsystem mini-calendar navigation
*Originally completed by GPT-5.2-Codex*
- [ ] Verify no center `Current` button exists in any mini-calendar/subsystem view (GM or player)
- [ ] Verify Prev/Next buttons are visible in every subsystem view for both roles
- [ ] Check help/UI copy for stale `Current` button references

### Review: Accept arbitrary GM weather forecast spans up to 20 days
*Originally completed by GPT-5*
- [ ] Verify `!cal weather forecast [n]` and `!cal settings weatherdays [n]` accept 1-20 correctly
- [ ] Test edge cases (0, 21, non-integer, negative)

### Review: Simplify weather broadcast flow
*Originally completed by GPT-5*
- [ ] Verify `!cal weather send` broadcasts only what players already know
- [ ] Verify `!cal weather reveal medium|high [1-10]` handles range-based reveal-and-send

### Review: Ring of Siberys presentation
*Originally completed by GPT-5*
- [ ] Verify Ring of Siberys documentation covers inclination, daylight visibility, albedo, nighttime illumination, Saturn-ring scaling, and height comparisons
- [ ] Cross-check lore accuracy against Keith Baker's published Eberron material

### Review: Specific-date weather reveals (completed portions)
*Low-tier reveals expanded by GPT-5 Codex on 2026-03-13*
- [ ] Verify each date stores reveal flags (`low`, `medium`, `high`) correctly
- [ ] Verify low reveal auto-grants common-knowledge forecasts for today, tomorrow, and day-after-tomorrow
- [ ] Verify today's low reveal includes rough time-of-day guidance
- [ ] Verify tomorrow and day-after-tomorrow use one qualitative day headline

---

## Agent Ready

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes.

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

### Specific-date weather reveals (remaining work)

This is the "divination magic" feature: GM reveals weather for a specific date at a specific location without revealing everything in between.

- [ ] GM command: `!cal weather reveal <dateSpec>` using the existing standard date syntax, including ranges such as `14-17` and `4 5-7`
- [ ] Generation engine must still generate intermediate days for seeding, but those aren't revealed
- [ ] Revealed range uses the same week-strip presentation as regular forecasts, with blank cells where no data is revealed
- [ ] Player-facing forecast command shows only revealed data at the current location, with location name included
- [ ] GM-only reveal command with custom range input (cap at ~3 months to prevent chat flooding)
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

## Documentation Tasks (Remaining)

---

### Expand README moon and sky reference material (remaining items)

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

## Design Tasks

These tasks still need design direction before coding.

---

### Reduce Today-view clutter

The Today view needs a redesign to reduce information density. Specific changes to be directed — this task is a placeholder awaiting design direction.

---

## Acceptance Checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
