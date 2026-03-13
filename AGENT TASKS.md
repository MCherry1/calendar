# Agent Tasks

**Repository:** `mcherry1/calendar`

See [DESIGN.md](DESIGN.md) for full architectural context. README is the target-behavior guide unless a statement is ambiguous; when code does not match README, track the code change here.

As these tasks are taken care of, remove them from this list.

If there is design ambiguity in this tasks list: keep the task intact and add a comment to the **Needs Design Input** section.

---
## Needs Design Input

None currently. Add new items here only when the desired implementation behavior is still ambiguous enough to block coding.

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
