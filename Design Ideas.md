# Design Ideas

Review date: 2026-03-13

This document captures recommendations after reviewing the full repo, the current `calendar.js` command/UI flow, the supporting docs, the local launcher/test tooling, and Roll20's Mod/API and chat-interface guidance.

## Scope Reviewed

- `calendar.js`
- `README.md`
- `Chat Commands.md`
- `DESIGN.md`
- `Design Tasks.md`
- `tests/calendar_smoke.ps1`
- `tools/Launch-Roll20ApiSync.ps1`
- `.github/workflows/*`

## Checks Run

- `git fetch origin main` -> local `main` was already up to date with `origin/main`
- `powershell -ExecutionPolicy Bypass -File .\tests\calendar_smoke.ps1` -> passed
- A local syntax-only `node --check calendar.js` pass was not possible because `node` is not installed in this environment

## Overall Read

The project is already unusually feature-rich for a Roll20 calendar script. The biggest improvement opportunities are not "add more simulation"; they are:

1. Reduce chat friction.
2. Make common actions more guided and macro-friendly.
3. Preserve the chat archive for important output instead of UI noise.
4. Tighten the repo's execution path around the tooling this project actually uses.

## Highest-Value Usability Ideas

### 1. Add an ephemeral UI mode for menus, confirmations, and admin panels

Roll20's Mod chat guidance explicitly calls out `sendChat(..., null, { noarchive: true })` as useful for API button menus and state info. That fits this script very well.

Why this matters here:

- The script generates many whisper-driven menus and confirmations.
- The current `send`, `whisper`, and `warnGM` helpers do not use `noarchive`.
- The chat archive is more valuable for story-facing outputs than for repeated admin menus.

Recommended shape:

- Add a dedicated `sendUi()` / `whisperUi()` path with `noarchive: true`.
- Use it for help menus, settings panels, weather location wizard steps, step/advance confirmations, and the startup banner.
- Keep player-facing "actual information delivery" archived when it matters: public forecasts, moon reports, planar almanacs, and date broadcasts.

Best first touchpoints:

- `send()` / `whisper()` / `warnGM()`
- `helpRootMenu()`
- `weatherLocationWizardHtml()` flows
- `stepDays()`
- `on("ready", ...)`

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

### 3. Redesign the Today and root help views around tasks, not maximum information density

The code and docs both show this is already on your radar. I agree with the existing placeholder task: clutter is now the main UX problem.

What feels heavy today:

- `helpRootMenu()` tries to expose nearly everything at once.
- `_todayAllHtml()` stacks several detailed subsystem summaries into one block.
- Several menus repeat navigation and mode controls inline, which is powerful but visually busy in Roll20 chat.

Recommended design direction:

- Default `!cal today` to a compact "campaign dashboard" summary.
- Move deep detail behind explicit drill-down buttons.
- Treat each subsystem as a short card with one sentence of status plus 2-4 actions.

Suggested layout:

- Date and season headline
- Events today
- Weather: current summary + `Forecast` + `Mechanics`
- Moons: current highlight + `Sky` + `Lore`
- Planes: current notable status + `Forecast`
- GM-only row: `Advance`, `Retreat`, `Send`, `Admin`

This would keep the "at a glance" value while reducing scroll fatigue in chat.

### 4. Add guided prompts for the commands that currently depend on typed syntax

The script has one good Roll20-style prompt already:

- `weather reveal ?{Date or range|14-17}`

That pattern should be used more aggressively.

Best candidates:

- `!cal set`
- `!cal add`
- `!cal addmonthly`
- `!cal addyearly`
- `!cal moon on`
- `!cal planes on`
- `!cal send [range]`

Recommended approach:

- Add "prompt buttons" beside the existing typed commands.
- Keep typed commands for power users.
- Let the chat UI do more of the input shaping for casual use.

This is one of the easiest ways to make a powerful Roll20 script feel less command-heavy without removing flexibility.

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

### 6. Audit public interactive panels that are sent with `/direct`

The script's `button()` helper emits markdown-style command buttons, but `sendToAll()` routes messages through `/direct`. Roll20's chat docs note that `/direct` bypasses markdown parsing.

That matters because some player-facing public panels are built from the same HTML that also contains button markup. The biggest candidate is the public planar panel.

Recommended fix:

- Audit every `sendToAll(...)` call that can include `button(...)` output
- For public interactive panels, either:
  - switch to raw HTML anchor buttons, or
  - whisper the interactive version and send a short public summary instead

Likely places to review first:

- `sendToAll(planesPanelHtml(...))`
- any future shared panel that reuses a player/GM panel template with nav buttons

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

### 11. Make the local Roll20 sync path the documented default workflow

The launcher script is good. It should be treated as the official dev loop.

Recommended improvements:

- Put the launcher workflow earlier in `README.md`
- Add a short "recommended daily workflow" section
- If desired, add a validation step before opening Roll20:
  - run smoke test
  - refuse browser launch if smoke test fails

That would make the repo feel more like a deliberate toolchain instead of "script plus some helpful extras."

## Suggested Priority Order

If I were sequencing this, I would do:

1. Ephemeral UI path with `noarchive`
2. Today/root menu redesign
3. Macro pack output and README macro examples
4. Saved weather locations
5. `/direct` + public button audit
6. Repo-specific CI cleanup
7. Test harness expansion
8. File/module split

## Implementation Status Review

Reviewed against `main` at commit `9df46c4` after pulling on 2026-03-13.

| # | Recommendation | Status | Evaluation |
| --- | --- | --- | --- |
| 1 | Ephemeral UI path with `noarchive` | Not implemented | `send()`, `whisper()`, and `warnGM()` still do not use `noarchive`, and there is no dedicated UI-only send helper yet. |
| 2 | Macro pack / `!cal macros` | Not implemented | There is still no macro-install or macro-output command in the script or docs. |
| 3 | Today/root clutter reduction | Partial | `!cal settings verbosity minimal` now gives a meaningfully leaner Today view with Detail buttons, condensed weather, lunar suppression, inline lighting, and merged planar notes. That is a real improvement. It does not yet satisfy the larger recommendation because `helpRootMenu()` is still dense and the default Today experience remains full-detail unless verbosity is changed. |
| 4 | Guided prompt buttons for typed commands | Not implemented | The script still only has the existing weather exact-date prompt (`weather reveal ?{Date or range|14-17}`); the broader prompt-driven workflow was not added. |
| 5 | Named saved weather locations | Not implemented | Weather still tracks only `recentLocations` and caps them at three entries; there is no save/load preset system. |
| 6 | `/direct` audit for public interactive panels | Not implemented | `sendToAll()` still routes through `/direct`, and the public planar send path still uses `planesPanelHtml(...)`, so the original interaction risk remains. |
| 7 | Typo recovery / "did you mean" guidance | Not implemented | Error handling is still mostly usage-based rather than suggestion-based. |
| 8 | Split monolith into subsystem files | Not implemented | `calendar.js` is still the single runtime script. Support files and tests were added around it, but the runtime itself was not modularized. |
| 9 | Repo-specific CI cleanup | Implemented | This landed well. The generic template workflows were removed and replaced with a single `ci.yml` that runs `node --test`, which is much closer to the actual repo. |
| 10 | Behavior-oriented automated tests | Implemented | This landed well. The new `test/` harness adds a Roll20 shim, broad functional coverage, and Today-view assertions. The test-only export gate keeps the extra surface out of normal runtime. |
| 11 | Make the local sync workflow the documented default | Not implemented | The launcher is still documented, but not promoted as the primary daily workflow and not paired with a clear local test loop in the README. |

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
