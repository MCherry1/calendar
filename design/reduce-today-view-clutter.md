# Reduce Today-View Clutter

**Status:** Design proposal — ready for review
**Date:** 2026-03-13

---

## Problem

The GM Today view (`!cal today`) displays all subsystem detail fully expanded with no summarization. On a typical Eberron day, this means:

- **Header** — 1 line (date + era)
- **Events** — 1–5 lines
- **Weather** — 5 period breakdowns with narrative + mechanics = ~15–20 lines
- **Moons** — 12 individual phase lines + eclipse notes = ~13–15 lines
- **Tonight's Lighting** — condition + lux + top 3 moon sources + cloud cover = ~6–8 lines
- **Planar** — notable phases + weather shift modifiers = ~3–8 lines
- **Navigation** — 1 line

**Total: ~40–60 lines** in a single Roll20 chat message. Most of that information is low-signal on any given day (e.g., 10 of 12 moons are at unremarkable phases; 4 of 5 weather periods match each other).

Two existing settings — `subsystemVerbosity` (`normal`/`minimal`) and `uiDensity` (`normal`/`compact`) — are already wired into the admin panel but are **not consulted by `_todayAllHtml()`**.

---

## Design Goals

1. **Today should be a briefing, not a data dump.** The GM glances at Today to decide what matters *right now*. Detailed subsystem views already exist for drill-down.
2. **Respect existing settings.** Wire `subsystemVerbosity` into the Today view so GMs who want the current behavior can keep it.
3. **Highlight the notable, suppress the routine.** Full moons, new moons, eclipses, extreme weather, active planar phases — these are signal. Ordinary phases and stable weather are noise at the briefing level.
4. **Keep drill-down one click away.** Subsection buttons let the GM jump into full detail for any subsystem.

---

## Proposed Changes

### 1. Respect `subsystemVerbosity` in Today view

When `subsystemVerbosity` is `minimal`, the Today view switches to **summary mode** for each subsystem. When `normal`, the view renders identically to current behavior (no regression). This is the master gate for all changes below.

### 2. Weather: collapse stable periods

**Current (normal):** 5 separate period blocks, each with narrative + mechanics.

**Summary mode (minimal):**
- If all 5 periods share the same temperature band (±1), wind stage, and precipitation stage, render **one line**: the afternoon conditions as the representative summary.
  - Example: `☁ Mild, breezy, clear skies all day.`
- If periods differ meaningfully (temperature band changes by ≥2, or wind/precip changes by ≥2 stages), show only the **divergent periods** with a note about what changed.
  - Example: `☁ Morning: Cool, calm, overcast → Afternoon: Mild, moderate wind, clearing`
- Extreme weather events always shown regardless of mode.

**Rationale:** On most days, weather is stable. GMs who need per-period detail can click the Weather button.

### 3. Moons: show only notable moons

**Current (normal):** All 12 moons listed with phase emoji, illumination %, phase label.

**Summary mode (minimal):**
- Show only moons that are **notable today**:
  - Full (≥97% illumination)
  - New (≤3% illumination)
  - Within 1 day of full or new (approaching/departing peak)
- All other moons suppressed.
- If no moons are notable: `🌙 No notable lunar activity.`
- Eclipses always shown.
- Add a count suffix: `(+10 moons unremarkable)` so the GM knows detail was suppressed.

**Rationale:** 12 phase lines dominate the view. On most days, only 0–3 moons are at interesting phases.

### 4. Tonight's Lighting: inline into Moons section

**Current (normal):** Separate section with condition, lux, top 3 sources, cloud multiplier.

**Summary mode (minimal):**
- Merge into the Moons section as a single trailing line:
  - Example: `Tonight: Bright light (4.2 lux) — partly cloudy`
- Drop the per-moon source breakdown and shadow note (available in `!cal moon` drill-down).

**Rationale:** Lighting is derived from moons + weather. As a standalone section it duplicates context. The GM needs the headline condition, not the photometry breakdown.

### 5. Planar: merge weather shifts inline

**Current (normal):** Notable phases in one block, weather shift modifiers in a separate sub-block.

**Summary mode (minimal):**
- Combine into a single block. Append weather shift to the phase line:
  - Example: `🔴 Fernia coterminous (3d left) — temperature +3`
- If no active planar extremes, suppress the section entirely (don't show an empty header).

**Rationale:** The shift lines are always tied to a specific plane. Showing them separately creates visual fragmentation.

### 6. Add per-subsystem drill-down buttons

**Both modes:**
- After each subsystem section (weather, moons, planes), add a small inline button linking to the full detail view for that subsystem.
- GM view currently only has a single "Calendar" back button. Add: `☁ Detail` / `🌙 Detail` / `🌀 Detail` buttons alongside each section header.

**Rationale:** Summarization only works if the full detail is easily accessible. One-click drill-down closes the loop.

### 7. Player Today view: no changes needed

The player view (`_playerTodayHtml`) is already summary-oriented through the tier system. It shows only peak-phase moons, tiered weather, and active planar extremes. No density changes are needed here — it is already the "minimal" equivalent.

---

## Settings Behavior

| `subsystemVerbosity` | Today View Behavior |
|---|---|
| `normal` | **Current behavior** — all 12 moons, all 5 weather periods, separate lighting section, separate planar shifts. No regression. |
| `minimal` | **Summary mode** — collapsed weather, notable-only moons, inline lighting, merged planar shifts. |

The `uiDensity` setting (`compact`/`normal`) controls spacing and font sizing in the calendar grid and is orthogonal to this proposal. It should not affect Today view content selection.

---

## What This Does NOT Change

- **No information is removed.** Every data point remains accessible via drill-down buttons and dedicated subsystem commands.
- **No new settings.** Uses existing `subsystemVerbosity` toggle that GMs can already set from the Admin panel.
- **No player view changes.** Player view is already appropriately summarized.
- **No changes to `normal` verbosity.** GMs who prefer the current full-detail view keep it.

---

## Estimated Summary Mode Output

On a typical quiet day (no eclipses, no planar extremes, stable weather):

```
📋 Today — Zarantyr 14

Mol, 14th of Zarantyr, 998 YK

☁ Weather:  ☁ Detail
Cool, breezy, overcast all day.

🌙 Moons:  🌙 Detail
🌕 Zarantyr FULL
🌒 Olarune (12% Waxing Crescent)
(+10 moons unremarkable)
Tonight: Bright light (10.8 lux) — overcast

⬅ Calendar
```

Compared to ~45 lines currently, this is ~8 lines. On an active day (eclipse + planar event + weather shift), summary mode would show ~12–18 lines, still well under the current baseline.

---

## Open Questions

None. This proposal uses existing infrastructure (`subsystemVerbosity`) and the changes are mechanical — no new design decisions needed beyond what's described above.
