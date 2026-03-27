# Preview player regression analysis (2026-03-27)

## Symptom investigated
- Preview player appeared broken.
- Time/playback controls did not behave correctly.
- Moon/preview window could render empty.

## Commit history reviewed
`site/main.ts` recent chain:
- `899ebc9` — "Fix preview: larger moons, lazy planar canvas, calendar text contrast"
- `47ffd6e` — "Fix broken preview: resilient init, unified world selector"
- `7a0485f` — "Fix showcase playback visual panel updates"
- `5a6ca5c` — "Restore smooth preview playback loop"

## Most likely break point
The strongest break signature is in commit **`899ebc9`'s parent state**, where preview startup could hard-fail before animation/event binding completed.

The follow-up commit **`47ffd6e`** explicitly patched that startup failure path by:
- making initialization resilient (try/catch around boot sequence), and
- removing strict dependence on a separate gallery world selector.

That patch description directly matches the observed failure mode: no animation, no controls, effectively blank preview panel.

## Why this looked intermittent
Subsequent commits (`7a0485f`, `5a6ca5c`) adjusted playback update behavior in `_tick`, so users could still see inconsistent visual updates depending on frame timing and detail sync throttling.

## Guardrail added
A DOM-contract test now verifies every `_must('<id>')` hook in `site/main.ts` exists in `site/index.html`, so missing-element startup regressions are caught in CI.
