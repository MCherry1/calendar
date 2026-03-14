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

### Eclipse and crossing math overhaul

- Completed by **GPT-5 Codex** on **2026-03-13**
- Reworked eclipse detection to report only true overlaps, classify by peak coverage plus relative apparent size, group cross-midnight events into one lifecycle window, and surface the new phrasing in Today / moon-calendar / player-facing moon summaries.

### Specific-date weather reveals

- Completed by **GPT-5 Codex** on **2026-03-13**
- Added `!cal weather reveal <dateSpec>`, location-scoped reveal storage, blank-cell reveal strips, current-location player forecast output, and recent-location quick switching in the weather location wizard.

### Correct Harptos calendar display

- Completed by **GPT-5 Codex** on **2026-03-13**
- Updated Harptos date formatting, tenday row math, festival-strip rendering, adjacent strip behavior, and parser-friendly command date specs to match the display changes.

### Expand README moon and sky reference material

- Completed by **GPT-5 Codex** on **2026-03-13**
- Added Ring of Siberys appearance / clearance / angular-size notes, plus Saturn-rings reference material for brightness and composition.

### Refine Eberron moon inspiration notes in README

- Completed by **GPT-5 Codex** on **2026-03-13**
- Added per-moon name notes, Earth-Moon apparent-size comparisons, shorter inspiration blurbs, and a corrected Eyre/Mimas crater-forge note.

### Weather forecast command safeguards

- Completed by **GPT-5 Codex** on **2026-03-13**
- Blocked archived past-day rerolls, kept reroll cascades on the current location, rejected exact-date weather reveals that include past days, and bounded manual weather generation to the configured forecast horizon.

### Remove the dead legacy eclipse review path

- Completed by **GPT-5 Codex** on **2026-03-13**
- Retired the old legacy eclipse review path from active runtime use so the broken `_estimateEclipseTiming` dependency is no longer reachable.

### Sync in-script help text with implemented commands

- Completed by **GPT-5 Codex** on **2026-03-13**
- Updated inline settings / moon / planes help text to include the supported `wxmechanics` and `offcycle` options plus the actual day/week/month range tokens accepted by the parsers.

### Move moon candidate-selection notes out of runtime

- Completed by **GPT-5 Codex** on **2026-03-13**
- Repointed moon-reference notes at `design/moon-reference-selection.md`, archived the old runtime ambiguity block, and added the historical note to the active design doc.

### Clear outdated Dolurrh TODO text

- Completed by **GPT-5 Codex** on **2026-03-13**
- Replaced the stale Dolurrh TODO with text that describes the implemented Aryth-linked `moontied` generator.

---

## Agent Ready

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes.

None currently.

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

None currently.

---

## Design Tasks

No tasks currently need design direction. Add new items here when the desired implementation behavior is still ambiguous enough to block coding.

---

## Acceptance Checks

- [x] Simulation/math changes have deterministic tests where practical
- [x] Moon/plane/today summaries show only active, current-day effects
- [x] GM + player views are verified where behavior differs
- [x] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
