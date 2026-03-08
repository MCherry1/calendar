# Documentation Discrepancies Audit

This file compares the current implementation in `calendar.js` against subsystem design docs:

- `moons-system-design.md`
- `alternate-planes-system-design.md`
- `events-system-design.md`
- `weather-system-design.md`

Scope of discrepancy reporting:
1. **Documented but implemented differently / partially**
2. **Implemented but not documented**

---

## 1) Moons (`moons-system-design.md` vs `calendar.js`)

### A. Documented, but implemented differently or only partially

1. **“Moon crossing proximity signals” is only indirectly represented**
   - The design doc lists dedicated crossing-proximity output as a modeled secondary phenomenon.
   - The script models *lunar conjunction* events through the eclipse/conjunction engine and can surface notable conjunctions, but there is not a clearly named, standalone “moon crossing proximity” report/command in the moon UI.

### B. Implemented, but not currently documented in `moons-system-design.md`

1. **Moon sky visibility command family**
   - `!cal moon sky [time]` / aliases (`visible`, `up`) provide time-of-day visibility output (dawn/noon/dusk/midnight).

2. **Moon lore command**
   - `!cal moon lore [moonName]` is implemented but not called out in the design doc command list.

3. **Direct seed control for moon generation**
   - `!cal moon seed <word>` sets system moon seed and regenerates sequences.

4. **GM moon phase anchoring commands**
   - `!cal moon full <MoonName> <dateSpec>` and `!cal moon new <MoonName> <dateSpec>` allow explicit phase anchoring.
   - `!cal moon reset [<MoonName>]` clears these GM overrides.

5. **Extended player/GM query behavior**
   - Non-GM `!cal moon on <dateSpec>` is constrained by reveal horizon; this operational behavior detail is not described in the moon design doc.

---

## 2) Alternate Planes (`alternate-planes-system-design.md` vs `calendar.js`)

### A. Documented, but implemented differently or only partially

No major behavior-level mismatches were found in this audit. Core claims in the design doc (canonical phase model, off-cycle anomalies, suppression behavior, reveal tiers, anchors/overrides, and weather hooks) are represented in the script.

### B. Implemented, but not currently documented in `alternate-planes-system-design.md`

1. **Dual short-range and long-range send options**
   - Usage supports both day-based and month-based ranges in `!cal planes send` (e.g., `1d/3d/6d/10d` and `1m/3m/6m/10m`), while docs summarize this more generically.

2. **Player forecast uncertainty model details**
   - The implementation includes uncertainty windows and exactness thresholds for generated predictions (especially at high tier), which are more specific than the current doc narrative.

3. **GM custom-event suppression coupling**
   - GM overrides are also registered as custom events used by anomaly suppression logic; docs mention suppression controls broadly but not this specific mechanism.

---

## 3) Events (`events-system-design.md` vs `calendar.js`)

### A. Documented, but implemented differently or only partially

1. **Source disable behavior wording is stronger in docs than implementation semantics**
   - Doc language says source entries can be disabled “without deleting underlying records.”
   - In implementation, disabling a source removes that source’s default event records from the live event list and marks the source suppressed; re-enable restores from defaults.
   - Net effect: source data is recoverable, but active runtime event records are removed on disable.

2. **Runtime source-enable storage key differs from doc wording**
   - Doc describes settings storage as `eventSourceEnabled` + `eventSourcePriority`.
   - Implementation uses suppression maps (`suppressedSources`, `suppressedDefaults`) plus `eventSourcePriority`.

### B. Implemented, but not currently documented in `events-system-design.md`

1. **Expanded remove/restore UX**
   - `remove list`, grouped recurring-series removal affordances, and restore-list workflows are implemented and richer than the doc’s short command summary.

2. **Compatibility auto-suppression/restore mechanics**
   - Calendar/system compatibility handling is implemented with explicit suppression tracking and default merge logic; docs mention compatibility behavior, but not the suppression-key mechanics.

3. **`!cal events ...` command namespace helper**
   - The script includes an events subcommand dispatcher (`!cal events add/remove/restore/list`) in addition to top-level shortcuts; this is not explicitly documented.

---

## 4) Weather (`weather-system-design.md` vs `calendar.js`)

### A. Documented, but implemented differently or only partially

No major behavior-level mismatches were found in this audit for the weather processing model, reveal model, stale/resurrection handling, and wizard workflow.

### B. Implemented, but not currently documented in `weather-system-design.md`

1. **Additional operational commands**
   - `!cal weather history`
   - `!cal weather mechanics`
   - `!cal weather reroll <serial>`
   - `!cal weather lock <serial>`
   - `!cal weather event trigger <key>` / `roll <key>`
   These exist in implementation but are not listed in the design doc command section.

2. **Legacy alias handling for forecast send**
   - The script supports compatibility aliases (`survival`/`mundane` and `magic`/`magical`) and maps them into medium/high reveal paths; this detail is not captured in docs.

3. **Today-send behavior based on best already-revealed tier**
   - `weather send today` exists and reuses best known reveal tier/source for current day; not called out in docs.

---

## 5) Summary

- **Most core subsystem design claims do match implementation.**
- **Largest true behavior discrepancies are in Events source-disable semantics/state-key terminology.**
- **Most remaining gaps are “implementation is richer than docs” (additional commands, GM tooling, and operational details).**
