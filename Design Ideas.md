# Design Ideas

Review date: 2026-03-16

This document tracks ideas that are still being held outside the implementation backlog. Ideas that have been implemented or promoted to Design Tasks are removed to keep this file clean.

## Implementation Status Summary

| # | Recommendation | Status |
| --- | --- | --- |
| 1 | Ephemeral UI path with `noarchive` | Implemented |
| 2 | Macro pack / `!cal macros` | Moved to README only |
| 3 | Today/root clutter reduction | Implemented |
| 4 | Guided prompt buttons for typed commands | Implemented |
| 5 | Named saved weather locations | Open — see below |
| 6 | `/direct` audit for public interactive panels | Implemented |
| 7 | Typo recovery / "did you mean" guidance | Declined |
| 8 | Split monolith into subsystem files | Implemented |
| 9 | Repo-specific CI cleanup | Implemented |
| 10 | Behavior-oriented automated tests | Implemented |
| 11 | Keep the upload workflow explicit and manual-paste friendly | Implemented |

## Open Ideas

### 5. Named saved weather location presets

The recent-location quick switch works, but long campaigns usually revisit a stable set of places. A named preset system would reduce friction.

Recommended feature:

- Add a "Save Current Location As..." button in the weather location wizard
- Button opens a Roll20 query box for a user-entered preset name
- Saved presets are stored and shown before "recent" entries in the location wizard
- Presets should not be predefined — all come from the GM saving locations during play

This replaces the earlier idea of `weather location save <name>` / `weather location load <name>` commands with a button-driven approach that matches the project's interaction style.

## Decisions Made

- **Macro pack**: Belongs in the README under a compact "Recommended In-Game Macros" section at the top, not as an in-script command.
- **Typo recovery**: Declined. Nearly all interaction is via buttons or copy-pasted from script-whispered syntax. The ROI does not justify the complexity.
- **Monolith split**: Done. Source lives in `src/` modules, bundled into `calendar.js`.
- **CI**: Done. Single `ci.yml` running typecheck, node tests, build, and PowerShell smoke tests.
- **Tests**: Done. Roll20 shim, broad functional coverage, 163 tests passing.
- **Upload workflow**: Done. GitHub Actions artifacts for paste-ready builds, GitHub Releases for tagged versions.
