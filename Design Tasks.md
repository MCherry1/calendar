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

These are well-defined implementation tasks. The design is decided, the target behavior is clear, and the work is primarily mechanical code changes.

### Fix review-discovered refactor regressions and add regression coverage

Goal: repair the concrete regressions found in the broad post-refactor review without changing unrelated behavior. Add regression coverage first, then implement the fixes, then rerun the full local verification pass.

#### 1. Add regression coverage first

- Add `test/planes.test.ts` covering timed override windows and player planar generated-horizon clipping.
- Extend `test/weather.test.ts` to cover `weather lock` semantics for future dates.
- Extend `test/moon.test.ts` to cover player single-moon view reveal gating.
- Extend `test/events.test.ts` or add a dedicated calendar-switch test file to cover source restoration and manual suppression persistence.

#### 2. Fix planar override time windows

- In `src/planes.ts`, make GM overrides apply only from `setOn` forward.
- Timed overrides must only apply within their configured duration window for the queried serial.
- Historical and future queries must not delete a still-live override just because the queried serial is outside the override window.
- Expired override cleanup may happen only when the override is actually expired relative to `todaySerial()`.

#### 3. Fix weather locking

- In `src/weather.ts`, `weather lock` must set `locked = true` on the targeted forecast record.
- Locked future records must reject reroll and remain immutable during forecast regeneration.
- Verify that lock behavior remains location-safe when the GM changes weather locations.

#### 4. Separate calendar auto-suppression from manual source suppression

- Split calendar-driven source hiding from GM manual `source disable` state.
- Switching `eberron -> gregorian -> eberron` must automatically restore allowed Eberron default sources.
- A manually disabled source must remain disabled across calendar-system switches.
- Update default-event merge logic so it uses the effective suppression union while preserving the source of suppression.

#### 5. Close the player moon-view knowledge leak

- Player `moon view` must respect `revealHorizonDays`.
- Do not use the exact single-moon daily phase renderer for player tiers that do not allow exact month-scale lunar knowledge.
- Preserve the current GM exact single-moon view.

#### 6. Clip player planar generated overlays to the generated reveal horizon

- Update planar minical generation to accept a generated cutoff serial rather than a boolean `includeGenerated` flag.
- Canonical planar cycles may still render across the allowed month view.
- Generated planar shifts must stop rendering after `today + genHorizon` in player views.

#### 7. Verification and handoff

- Run `npm run typecheck`, `npm test`, and `npm run build` after the regression tests are added and again after the behavior fixes land.
- If command/help text or documented behavior changes, update `README.md` and `DESIGN.md` in the same pass.
- Move the task to **Needs Review by Different Agent** with agent name and completion date when done.

### Add GM-only first-run initialization and onboarding wizard

Goal: replace the current unconditional startup/default-install behavior with a true first-run setup flow for brand-new campaigns while preserving existing campaigns without interruption. Follow `DESIGN.md` section `12.6`.

#### 1. Detect fresh installs and preserve legacy campaigns

- Add persistent setup tracking with statuses `uninitialized`, `dismissed`, `in_progress`, and `complete`.
- Detect a blank install before `checkInstall()` backfills default calendar/settings state.
- If calendar/settings data already exists from a pre-onboarding version, auto-mark the campaign `complete` and skip the wizard.
- Update `!cal resetcalendar` so it returns the script to the onboarding gate instead of silently rebuilding defaults and continuing.

#### 2. Add the ready-time welcome prompt and pre-init routing

- On sandbox `ready`, whisper only the GM with the exact prompt:
  `Welcome to Calendar! It looks like this is the first time Calendar has been used in this game. Would you like to initialize it?`
- Provide `Yes` and `No` buttons.
- `No` must whisper the exact follow-up:
  `No problem! Just call !cal at any time to begin the process.`
- GM `!cal` while setup is not complete must start or resume onboarding instead of showing the normal calendar view.
- Non-GM `!cal` before setup completion must return a polite waiting message and never expose setup/admin controls.
- Replace the current public startup banner with GM-only initialization/resume messaging.

#### 3. Implement the guided welcome questions

- Ask calendar system first, then ask variant/month-name set only when the chosen system has multiple variants.
- Ask for the current in-game date using the same parsing rules as `!cal set`, with a default-start shortcut.
- Ask season model from the onboarding-safe option list defined in `DESIGN.md` `12.6`, then ask hemisphere only when that season model is hemisphere-aware.
- Ask color theme with `use calendar default` plus the existing theme choices.
- Ask whether to enable built-in default events without disabling the event subsystem itself.
- Ask subsystem choices:
  - Lunar tracking on/off
  - Weather mode: `off`, `narrative only`, `narrative + mechanics`
  - Planar tracking on/off for Eberron/Galifar campaigns
- If weather is enabled, reuse the existing weather location wizard and add a `Set later` path so setup can finish without an immediate location.
- Do not add onboarding questions for era labels, reveal tuning, source priority, UI density, verbosity, auto buttons, off-cycle planes, or manifest zones.

#### 4. Add review/apply behavior and persistence

- End the wizard with a review summary and explicit confirmation before mutating live state.
- Applying setup must write calendar/system settings, date, subsystem toggles, default-event suppression, and optional weather location in one pass, then open the normal `!cal` view.
- Persist in-progress answers so setup can resume cleanly after a sandbox restart.

#### 5. Tests and docs

- Add tests for blank-state detection, legacy auto-migration, dismissal, GM/player pre-init routing, successful setup application, the weather-location branch, and `resetcalendar` returning the campaign to onboarding.
- Update `README.md` after implementation so startup/use instructions describe the welcome flow and pre-init `!cal` behavior.
- If new setup helpers or commands are introduced, document them in `Chat Commands.md` and `DESIGN.md` in the same pass.

### Add an ephemeral noarchive UI path for menus, confirmations, and admin panels

Goal: keep the Roll20 chat archive focused on story-facing output by routing transient menus, confirmations, and admin/status panels through dedicated noarchive helpers while leaving substantive shared information archived.

#### 1. Add dedicated transient-UI messaging helpers

- In `src/messaging.ts` and `src/commands.ts`, add explicit helper paths for transient UI output that use `sendChat(..., null, { noarchive: true })`.
- Keep the current archived messaging helpers available for forecasts, moon reports, planar almanacs, date broadcasts, and other outputs players may need to reread later.
- Do not silently change every whisper or GM warning to `noarchive`; the distinction between transient UI chrome and substantive information must stay explicit in the call sites.

#### 2. Move the highest-churn UI flows onto the new path

- Update the root/help/settings panel flows in `src/ui.ts`, weather location wizard flows in `src/weather.ts`, step/advance confirmations in `src/ui.ts`, and startup/onboarding prompts in `src/init.ts` to use the transient UI helpers.
- GM-only admin/status responses whose main purpose is navigation, setup, or acknowledgement should use the UI path.
- Keep player-facing information delivery archived when the message is the actual content being shared rather than just the control surface around it.

#### 3. Add regression coverage and docs

- Add tests around the messaging helpers and at least one representative menu flow to confirm `noarchive` is used for transient UI output and not used for substantive/public reports.
- Update `README.md` and `DESIGN.md` if they describe startup/help/admin chat behavior in a way that changes.

### Redesign the default Today and root help views around task-focused cards

Goal: make the default `!cal` / `!cal today` and root help experience scannable in Roll20 chat by showing a compact dashboard first and pushing detail behind explicit drill-down actions.

#### 1. Rework the default Today dashboard

- In `src/today.ts`, change the default GM/player Today rendering so it starts with a compact campaign dashboard instead of the current maximum-detail stack.
- Use short cards or rows for the date and season headline, events today, weather status, moon status, and planar status. Each subsystem card should summarize current state in one sentence and expose 2-4 high-value actions such as `Detail`, `Forecast`, `Mechanics`, `Sky`, or `Lore`.
- Keep GM-only controls in a distinct final row (`Advance`, `Retreat`, `Send`, `Admin`) and preserve the existing deeper subsystem views behind their drill-down buttons.

#### 2. Rework the root help menu around common tasks

- In `src/ui.ts`, refactor `helpRootMenu()` so it groups controls by common tasks rather than trying to show the whole feature surface at once.
- Surface only the highest-frequency top-level entry points at root: calendar, weather, moons, planes, events, and GM admin actions.
- Move secondary or exhaustive options into the existing subsystem/help drill-downs instead of repeating them inline.

#### 3. Verify the new compact layout

- Add or update tests covering the default Today view and root help menu for both GM and player contexts so the new compact layout is locked in.
- Update `README.md` and `DESIGN.md` if they describe the default Today/help layout or verbosity behavior in a way that changes.

### Add guided prompt buttons for syntax-heavy calendar commands

Goal: reduce typed-syntax friction by exposing Roll20 prompt-driven buttons for the commands that currently require the user to remember argument structure.

#### 1. Add prompt entry points in the relevant menus

- Add prompt buttons alongside the existing typed-command entry points for `!cal set`, `!cal add`, `!cal addmonthly`, `!cal addyearly`, `!cal moon on`, `!cal planes on`, and `!cal send`.
- Use Roll20 prompt syntax to collect the date/range and other required fields with sensible placeholders or defaults.
- Keep the current typed commands fully supported for macro and power-user workflows.

#### 2. Route prompted submissions through the existing parsers

- The prompt buttons should submit normal command strings that reuse the existing parsing and validation paths in `src/ui.ts`, `src/moon.ts`, `src/planes.ts`, and related command handlers.
- Do not create duplicate parse-only code paths just for prompted input.
- When a promptable action already appears in a menu, pair the button labeling with the underlying command so the UI teaches the syntax rather than hiding it.

#### 3. Test and document the prompt workflow

- Add tests that assert the prompt buttons appear in the relevant menus/help output and generate the expected command strings.
- Update `README.md` and `Chat Commands.md` so the guided-entry options are documented alongside the typed forms.

### Split public shared panels from interactive GM panels when `/direct` would drop buttons

Goal: ensure player-facing shared panels never rely on markdown command buttons that Roll20 strips under `/direct`, while preserving a rich interactive version for the GM or sender.

#### 1. Audit every public send path for interactive markup

- Review all `sendToAll(...)` usage in `src/weather.ts`, `src/moon.ts`, `src/planes.ts`, `src/events.ts`, `src/ui.ts`, and `src/rendering.ts` for any panel that can include `button()` output.
- Start with the current planar send flow, where `sendToAll(planesPanelHtml(...))` reuses the interactive panel template.
- Treat any public renderer that includes command-button markup as a bug to fix, not a harmless display quirk.

#### 2. Split public summaries from interactive control panels

- Public broadcasts must use dedicated non-interactive summary renderers with no command buttons or other markdown-only controls.
- When a GM/share action needs both a public broadcast and continued interaction, whisper the full interactive panel back to the requesting GM while sending the concise summary to players.
- Do not switch public panels to raw HTML anchor buttons; the project standard for these cases is archived public summaries plus whispered interactive GM control panels.

#### 3. Lock the behavior in tests and docs

- Add regression tests that confirm public send paths do not emit command-button markup and that the GM still receives the interactive follow-up panel where appropriate.
- Update `README.md`, `Chat Commands.md`, and `DESIGN.md` if their wording about public share behavior or sent panel contents changes.

---

## Documentation Tasks

None currently.

---

## Design Tasks

These tasks still need design direction before coding.

None currently.

---

## Acceptance Checks

- [x] Simulation/math changes have deterministic tests where practical
- [x] Moon/plane/today summaries show only active, current-day effects
- [x] GM + player views are verified where behavior differs
- [x] Manifest-zone + Aryth reminder/warning loop is state-tested across date advancement
- [ ] Timed planar overrides are state-tested before start, during window, and after expiry
- [ ] Weather lock behavior is regression-tested against reroll and regeneration
- [ ] Calendar auto-suppression and manual source suppression are tested independently across calendar switches
- [ ] Player moon and planar views are regression-tested for reveal-horizon clipping
