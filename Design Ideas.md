# Design Ideas

Review date: 2026-03-16

This document tracks ideas that are still being held outside the implementation backlog. Ideas that have been implemented or promoted to Design Tasks are removed to keep this file clean.

## Implementation Status Summary

| #   | Recommendation                                              | Status               |
| --- | ----------------------------------------------------------- | -------------------- |
| 1   | Ephemeral UI path with `noarchive`                          | Implemented          |
| 2   | Macro pack / `!cal macros`                                  | Moved to README only |
| 3   | Today/root clutter reduction                                | Implemented          |
| 4   | Guided prompt buttons for typed commands                    | Implemented          |
| 5   | Named saved weather locations                               | Implemented          |
| 6   | `/direct` audit for public interactive panels               | Implemented          |
| 7   | Typo recovery / "did you mean" guidance                     | Declined             |
| 8   | Split monolith into subsystem files                         | Implemented          |
| 9   | Repo-specific CI cleanup                                    | Implemented          |
| 10  | Behavior-oriented automated tests                           | Implemented          |
| 11  | Keep the upload workflow explicit and manual-paste friendly | Implemented          |

## Open Ideas

None currently.

## Decisions Made

- **Macro pack**: Belongs in the README under a compact "Recommended In-Game Macros" section at the top, not as an in-script command.
- **Named saved weather locations**: Done. The weather location wizard can save the current location under a GM-provided preset name and lists saved presets before recents.
- **Typo recovery**: Declined. Nearly all interaction is via buttons or copy-pasted from script-whispered syntax. The ROI does not justify the complexity.
- **Monolith split**: Done. Source lives in `src/` modules, bundled into `calendar.js`.
- **CI**: Done. Single `ci.yml` running typecheck, node tests, build, and PowerShell smoke tests.
- **Tests**: Done. Roll20 shim, broad functional coverage, 163 tests passing.
- **Upload workflow**: Done. GitHub Actions artifacts for paste-ready builds, GitHub Releases for tagged versions.
