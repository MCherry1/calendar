# Design Tasks

**Repository:** `mcherry1/calendar`

This is the single task and workflow file for all coding agents. For detailed architectural context, data tables, and mechanical design decisions, see [DESIGN.md](DESIGN.md).

**Primary canon source**: Keith Baker's published Eberron material. Lore fidelity is a hard constraint.

---

## Development Workflow

This project is developed entirely with coding agents. Before doing any work, orient yourself with these files:

- **`DESIGN.md`** — Authoritative design document. Architectural decisions, mechanical systems, complete data tables, development history. Read the relevant section before implementing anything. Do not implement something differently from what DESIGN.md says unless the discrepancy is explicitly noted.
- **`Design Tasks.md`** (this file) — Implementation backlog and workflow rules.
- **`design/`** — Active design discussions. Each file is a topic where the design is NOT yet decided. Do not implement anything described only in `design/` — it is there specifically because it is not ready for coding.

### Pipeline: idea → code

```
Undecided question
  → create design/<topic>.md
  → design-discussion agent researches and decides
  → update DESIGN.md with decision
  → add implementation tasks to this file
  → delete or archive the design/ file

Ready task
  → coding agent implements from this file
  → follows the Task Lifecycle below
```

### Rules

- **Only implement from this file.** If something is only in `design/`, it is not ready.
- **Read DESIGN.md first.** Don't guess at architectural intent — it's documented.
- **Don't add tasks for undecided design.** If you discover something that needs a design decision, create a `design/` file for it.
- **Upgrade-only for DESIGN.md.** Design decisions are additive. Don't remove content from DESIGN.md unless explicitly asked.
- **README is the target-behavior guide** unless a statement is ambiguous; when code does not match README, track the code change here.
- **Keep docs in sync with code.** When changing data tables, constants, or behavior in `calendar.js`, update the corresponding sections in DESIGN.md and README.md in the same commit. The code is the source of truth — docs must never contradict it.

---

## Task Lifecycle

Every task follows this pipeline:

1. **Agent implements the task** from one of the sections below.
2. **When complete**, the agent moves the task into the **Needs Review by Different Agent** section. The entry must include:
   - Which agent completed it (e.g., "Claude Opus 4.6", "GPT-5 Codex", "ChatGPT 5.4")
   - The date it was completed
3. **A different agent reviews the task.** An agent must never review work completed by the same agent or a different version of itself. The reviewer must be a genuinely different agent so every task gets two independent looks.
4. **After review passes**, the reviewer removes the task from **Needs Review** entirely. The task is done and the file stays clean.

If the reviewer finds issues, they should fix them in the same pass and then remove the task. If the issues are too large to fix inline, the reviewer moves the task back to the appropriate work section with notes on what needs to be redone.

---

## Needs Design Input

None currently. Add new items here only when the desired implementation behavior is still ambiguous enough to block coding.

---

## Needs Review by Different Agent

No tasks currently awaiting review.

---

## Agent Ready

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes.

---

### Eclipse and crossing math overhaul

Design clarified by user on 2026-03-13. This task is now implementation-ready.

- [ ] Report **true overlaps only**. Remove near-miss conjunction / crossing reports that do not have real disk overlap.
- [ ] Reclassify event types by actual overlap and relative apparent size:
  - `Total Eclipse`: the occluded body reaches greater than **98% coverage** at peak.
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

### Reduce Today-view clutter

Design clarified on 2026-03-13. See `design/reduce-today-view-clutter.md` for full proposal and DESIGN.md §12.5 for the authoritative summary.

- [ ] Wire `_subsystemIsVerbose()` into `_todayAllHtml()`. When `minimal`, apply summary-mode logic below. When `normal`, preserve current behavior exactly (no regression).
- [ ] **Weather summary mode:** Detect stable days (all 5 periods within ±1 temperature band, ±1 wind stage, ±1 precip stage). Stable → single representative line from afternoon values. Divergent → show only the periods that changed, with a transition arrow format. Extreme events always shown in both modes.
- [ ] **Moons summary mode:** Show only notable moons — full (≥97% illumination), new (≤3%), or within 1 day of full/new. Suppress all others with a count suffix, e.g., "(+10 moons unremarkable)". Eclipses always shown in both modes.
- [ ] **Lighting summary mode:** Merge into the Moons section as a single trailing line: condition label + lux + cloud note. Drop per-moon source breakdown and shadow note.
- [ ] **Planar summary mode:** Append weather shift modifiers inline on the same line as the phase (e.g., "🔴 Fernia coterminous (3d left) — temperature +3"). Suppress section entirely when no active planar extremes.
- [ ] **Drill-down buttons:** Add per-subsystem inline detail buttons (`☁ Detail` → `!cal weather`, `🌙 Detail` → `!cal moon`, `🌀 Detail` → `!cal planes`) next to each section header in both verbosity modes.
- [ ] Verify `normal` mode output is identical to current behavior (no regression).
- [ ] Verify `minimal` mode output on: quiet day (no events), active day (eclipse + planar extreme + weather shift), and edge cases (all moons notable, all periods divergent).

---

## Documentation Tasks

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

No tasks currently need design direction. Add new items here when the desired implementation behavior is still ambiguous enough to block coding.

---

## Acceptance Checks

- [ ] Simulation/math changes have deterministic tests where practical
- [ ] Moon/plane/today summaries show only active, current-day effects
- [ ] GM + player views are verified where behavior differs
- [ ] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
