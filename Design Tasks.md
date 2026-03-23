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

None currently.

---

## Evaluation Notes

### 2026-03-19: Moon Calendar Performance

Evaluation summary:

- The bundled script size is not the main issue. `calendar.js` is 711,583 bytes unminified, but Roll20 API scripts execute server-side; the browser mostly pays for the chat HTML it receives, not for parsing this file.
- The default GM `!cal moons` panel currently renders as 2 chat messages totaling about 22,700 characters. That payload is noticeable but not large enough by itself to explain the observed delay.
- Local timing against the current code path shows the delay is mostly server-side render time:
  - `moonEnsureSequences(today, 365)`: about 33 ms
  - First `moonPanelParts()` render: about 1,842 ms
  - Warm `moonPanelParts()` render: about 1,148 ms
  - `_moonMiniCalEvents()` for the current month at high tier: about 1,728 ms
  - `_moonMiniCalEvents()` for the same month at medium tier: about 0.53 ms
- The dominant cost is eclipse work inside the high-tier month minical, not HTML assembly. `_moonMiniCalEvents()` calls `_eclipseNotableToday()` for every displayed day, which calls `getEclipses(serial)`.
- `getEclipses(serial)` calls `moonEnsureSequences(serial, 3)`. Because the focus serial advances day by day across the month, `generatedThru` extends repeatedly during the scan, forcing fresh moon-sequence generation and changing the eclipse cache key. That largely defeats caching during a full-month high-tier render.
- Conclusion: the moons view is slow because eclipse generation is recomputed repeatedly while building the month overlay. This is primarily a server computation problem, not a "script is too large for browsers" problem.
- Date-change regression note: the auto-refreshed player moon handout was also forcing a high-tier past-month render on every `!cal set` / `!cal advance`. Keeping that handout on the player reveal tier across its rolling window reduced local command timings from about 1.6 s to about 52 ms for `!cal advance 1` and about 116 ms for `!cal set 1 2 998`.

Recommended follow-up if optimization is needed:

- Batch the eclipse scan for the displayed month after a single up-front `moonEnsureSequences()` call that already covers the full range.
- Keep eclipse cache keys independent from incidental `generatedThru` growth during one render pass, or pre-grow the horizon before entering the per-day loop.
- If necessary, render eclipse indicators only for days with known events rather than recomputing eclipse search logic for every day cell.

## Documentation Tasks

None currently.

---

## Design Tasks

These tasks still need design direction before coding.

- **Calendar Initialization: Eberron planar seed prompts**
  - Add a design/workshop task for the Eberron setup flow so initialization explicitly addresses the campaign-impacting long-cycle and less-than-annual planar seeds.
  - The setup should explain that seeded timing can materially change whether major planar phases happen during the campaign and should not be hidden behind a silent random default.
  - Work through which planes need explicit setup questions at minimum: `Daanvi`, `Thelanis`, `Fernia/Risia` linked vs floating behavior, `Fernia/Risia` active timing, `Shavarath`, `Dolurrh`, and any other Eberron planes whose seeded anchors meaningfully affect near-term play.
  - For each affected seedable plane/cycle, decide the GM-facing choices:
    - `Roll for it` and accept the random seed-derived result
    - `Make it happen` / ask for a specific campaign-facing outcome
    - `Do not let it happen during this campaign`
  - Design the UX copy so the GM understands why the question matters without getting buried in lore during setup.
  - Decide whether this belongs in the main setup wizard, an Eberron-only advanced step, or a post-setup calibration flow.
  - Do not implement yet; this item exists to workshop the initialization design before coding.

- **Calendar Initialization: planar mechanics and canon/generated split**
  - Add a design/workshop task for planar setup so the GM can choose whether planar tracking is on without automatically opting into every canonical and generated cycle behavior.
  - Work through a setup sequence shaped like:
    - `Planes?`
    - `Canon cycles?`
    - `Additional generated cycles?`
    - `Planar mechanics?`
  - Decide how planar mechanics should behave when planes are enabled for flavor/calendar context but the GM does not want the mechanical weather and effect layer surfaced.
  - Decide how this interacts with existing settings such as off-cycle/generated planes, canon seasonal planes, and any future onboarding defaults.
  - Do not implement yet; this item exists to workshop the initialization/setup questions before coding.

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
