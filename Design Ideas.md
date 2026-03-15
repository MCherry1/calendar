# Design Ideas

Review date: 2026-03-13

This document captures recommendations after reviewing the full repo, the current `calendar.js` command/UI flow, the supporting docs, the local launcher/test tooling, and Roll20's Mod/API and chat-interface guidance.

## Promoted to Design Tasks

On 2026-03-14, ideas 1, 3, 4, and 6 were approved for implementation and promoted into `Design Tasks.md` under **Agent Ready**. They are intentionally removed from the active idea sections below so this file only tracks ideas that are still being held outside the implementation backlog.

## Scope Reviewed

- `calendar.js`
- `README.md`
- `DESIGN.md`
- `Design Tasks.md`
- `test/calendar_smoke.ps1`
- `.github/workflows/*`

## Checks Run

- `git fetch origin main` -> local `main` was already up to date with `origin/main`
- `powershell -ExecutionPolicy Bypass -File .\test\calendar_smoke.ps1` -> passed
- A local syntax-only `node --check calendar.js` pass was not possible because `node` is not installed in this environment

## Overall Read

The project is already unusually feature-rich for a Roll20 calendar script. The biggest improvement opportunities are not "add more simulation"; they are:

1. Reduce chat friction.
2. Make common actions more guided and macro-friendly.
3. Preserve the chat archive for important output instead of UI noise.
4. Tighten the repo's execution path around the tooling this project actually uses.

## Highest-Value Usability Ideas

### 2. Ship a first-class macro pack instead of only suggesting "make a macro"

Roll20's macro/quick-bar workflow is one of the biggest usability multipliers in the platform. Right now the repo recommends making a macro, but the script does not help the GM or players do it.

Recommended feature:

- Add `!cal macros`
- Add `!cal macros gm`
- Add `!cal macros player`

That command should print copy-ready macros for the most common actions, for example:

- `!cal`
- `!cal today`
- `!cal weather`
- `!cal forecast`
- `!cal moon`
- `!cal planes`
- `!cal advance 1`
- `!cal retreat 1`
- `!cal send`

Extra win:

- Include a "token action" variant for GM-only controls like `advance`, `retreat`, and `today`.
- Add the same examples to `README.md`.

### 5. Upgrade weather locations from "recent" to "named saved presets"

The recent-location quick switch is a strong start, but long campaigns usually revisit a stable set of places. A saved-location system would pay off quickly.

Recommended feature:

- Save named locations like `Sharn`, `Stormreach Coast`, or `Mror Highlands`
- Allow `weather location save <name>`
- Allow `weather location load <name>`
- Show saved locations before the "recent" list in the location wizard

Why this matters:

- GMs often jump between current travel, future travel, divination targets, and home base
- Rebuilding the location stack repeatedly adds friction
- A named list is easier to remember than "recent 1/2/3"

## Roll20-Specific Interaction Fixes

### 7. Add typo recovery and "did you mean" hints for top-level subcommands

Chat-driven interfaces punish typos more than GUI interfaces. Right now some paths already have decent usage feedback, but the top-level experience can still be sharper.

Recommended behavior:

- If a subcommand is unknown, suggest the nearest valid command
- If a GM enters a known command with missing required structure, return one example and one button
- Normalize a few more common variants beyond the current packed-word handling

Good targets:

- top-level `!cal <subcommand>`
- `weather`, `moon`, and `planes` subcommands
- event authoring commands

## Execution and Maintenance Ideas

### 8. Split the monolith into subsystem files or multiple Roll20 script tabs

`calendar.js` is currently about 12.5k lines. That is still workable, but it is already large enough that review risk is climbing.

Roll20's Mod/API guidance allows multiple scripts to share the same sandbox and `state`, so this project does not need to stay in one giant runtime file forever.

Recommended target structure:

- `calendar-core`
- `calendar-ui`
- `calendar-events`
- `calendar-weather`
- `calendar-moons`
- `calendar-planes`
- `calendar-bootstrap`

If you prefer one upload artifact, generate `calendar.js` from smaller source files. The main benefit is safer review and easier testing, not just style.

### 9. Replace the generic GitHub workflow templates with repo-specific CI

The current workflows appear to be stock templates for Deno, npm publishing, and webpack. They do not match the actual repo structure.

Recommended replacement:

- One CI workflow on push/PR to `main`
- Run the PowerShell smoke test
- Fail on missing repo-critical files
- Optionally run a lightweight static grep for stale TODOs or mismatched command docs

Why this matters:

- Dead workflows create noise
- Failing irrelevant workflows train you to ignore CI
- A small project-specific workflow is much more trustworthy

### 10. Expand tests from "presence checks" to behavior checks

The smoke test is useful, but it mainly confirms that important fragments still exist. The next step should be behavior verification.

Most valuable additions:

- command routing for GM vs player
- top-level `!cal` rendering mode selection
- date parsing edge cases
- weather reveal output ranges
- player knowledge gating for moons/planes/weather
- public-vs-whisper output paths

The simplest path is to stub Roll20 globals and test pure command/output functions outside the live sandbox.

### 11. Keep the upload workflow explicit and manual-paste friendly

The old browser-extension launcher turned out to be a dead end. The repo should instead document and automate the parts that actually work:

- GitHub Actions artifacts for day-to-day pasteable builds
- GitHub Releases for durable tagged `calendar.js` assets
- a local `build -> smoke check -> paste` path that does not depend on browser extensions

That keeps the workflow reliable without pretending local autoupload exists when it does not.

## Suggested Priority Order

If I were sequencing this, I would do:

1. Macro pack output and README macro examples
2. Saved weather locations
3. Typo recovery and "did you mean" hints
4. Keep the upload workflow explicit and manual-paste friendly

The structural items that used to sit in this list - file/module split, repo-specific CI, and behavior-oriented tests - have already landed and no longer belong in the active priority order.

## Implementation Status Review

Reviewed against `main` at commit `9df46c4` after pulling on 2026-03-13.

| # | Recommendation | Status | Evaluation |
| --- | --- | --- | --- |
| 1 | Ephemeral UI path with `noarchive` | Promoted to Design Tasks (2026-03-14) | Approved for implementation and moved into `Design Tasks.md` under **Agent Ready**. |
| 2 | Macro pack / `!cal macros` | Not implemented | There is still no macro-install or macro-output command in the script or docs. |
| 3 | Today/root clutter reduction | Promoted to Design Tasks (2026-03-14) | The remaining redesign work was approved for implementation and moved into `Design Tasks.md`. The existing verbosity improvements remain a useful starting point. |
| 4 | Guided prompt buttons for typed commands | Promoted to Design Tasks (2026-03-14) | Approved for implementation and moved into `Design Tasks.md` under **Agent Ready**. |
| 5 | Named saved weather locations | Not implemented | Weather still tracks only `recentLocations` and caps them at three entries; there is no save/load preset system. |
| 6 | `/direct` audit for public interactive panels | Promoted to Design Tasks (2026-03-14) | Approved for implementation and moved into `Design Tasks.md` under **Agent Ready**. |
| 7 | Typo recovery / "did you mean" guidance | Not implemented | Error handling is still mostly usage-based rather than suggestion-based. |
| 8 | Split monolith into subsystem files | Implemented | Runtime source now lives in `src/` modules and is bundled into `calendar.js` for Roll20. |
| 9 | Repo-specific CI cleanup | Implemented | This landed well. The generic template workflows were removed and replaced with a single `ci.yml` that runs `node --test`, which is much closer to the actual repo. |
| 10 | Behavior-oriented automated tests | Implemented | This landed well. The new `test/` harness adds a Roll20 shim, broad functional coverage, and Today-view assertions. The test-only export gate keeps the extra surface out of normal runtime. |
| 11 | Keep the upload workflow explicit and manual-paste friendly | Implemented | The broken launcher path was removed. README now points contributors to GitHub artifacts/releases or a local build-plus-smoke-check flow. |

### Implementation Notes

- The strongest follow-through was on execution quality, not chat UX:
  - CI is now project-specific.
  - Node-based functional tests were added.
  - The earlier reviewed feature work also gained much better regression coverage.
- The strongest usability movement is the Today-view verbosity work:
  - good direction
  - not a full redesign yet
- I could run the PowerShell smoke test locally and it passed.
- I could not execute the new Node test suite in this environment because `node` is not installed locally here, so the quality assessment of the new test harness is based on code review plus the CI configuration rather than a local run.

## Roll20 References Consulted

- Roll20 Mod chat/API guidance: [Mod:Chat](https://wiki.roll20.net/Mod:Chat)
- Roll20 macro and quick-bar guidance: [Collections](https://help.roll20.net/hc/en-us/articles/360037772793-Collections)
- Roll20 text chat behavior: [Text Chat](https://help.roll20.net/hc/en-us/articles/360037258714-Text-Chat)
- Roll20 Mod organization guidance: [Mod:Use Guide](https://wiki.roll20.net/Mod:Use_Guide)
- Roll20 Mod object/state guidance: [Mod:Objects](https://wiki.roll20.net/Mod:Objects)
