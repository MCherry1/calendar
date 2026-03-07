# Weather

## Purpose

This document defines weather-facing mechanics for the Eberron calendar tool: baseline climate behavior, moon-linked modifiers, planar effects, and event-generation rules.

---

## Current design decisions

- **Daanvi frequency correction**
  - Replace old `d100 (100)` trigger with a two-step gate: `d20 (10)` then `d10`.
  - `d10` split: `1–5 = remote`, `6–10 = coterminous`.
  - Target annual cadence: **16.8 events/year** with **10-day durations**.
  - Keep state-balancing logic that biases toward flips.

- **Zarantyr effects**
  - Full Zarantyr increases lightning/thunder odds, including occasional clear-sky lightning.
  - Remove any Zarantyr-only wind/precipitation bonus (all moons already influence wind/water generally).

- **Planar carryover checks**
  - If any Shavarath-specific wind effect still exists, remove it.

---

## Open implementation items

1. Confirm where weather event generation occurs in runtime flow (daily tick vs. presentation layer).
2. Add deterministic tests for Daanvi probability distribution and state flips.
3. Verify Today view never displays an extreme event placeholder when none exists.
4. Ensure manifest-zone weather modifiers are location-scoped and reset when location changes.

---

## Validation checklist

- [ ] Daanvi generation matches expected long-run event count.
- [ ] Zarantyr full moon can produce lightning without storm preconditions.
- [ ] Storm preconditions still produce higher lightning rates than clear-sky cases.
- [ ] Today weather section contains only active/current effects.
# weather
