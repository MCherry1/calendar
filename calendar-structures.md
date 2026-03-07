# Calendar Structures

## Supported calendar systems

This document captures rendering and formatting rules for each calendar mode.

---

## Eberron (default)

- Year length: **336 days**
- Month model: setting-defined (tool-specific)
- Moon/plane/weather overlays are first-class in daily summaries

---

## Harptos (corrected rules)

- Uses **tendays**, not weekdays.
- Each month is shown as **3 rows × 10 columns**.
- Column headers should be:
  - `1st`, `2nd`, `3rd`, `4th`, `5th`, `6th`, `7th`, `8th`, `9th`, `10th`
- Date format should be:
  - **`16th of <Month>, <Year> DR`**

---

## Rendering requirements

- Highlighting for ranges must apply to **all days in the range**, not only endpoints.
- Mini-calendar rows must not clip on the Y-axis.
- Tooltips should include line breaks between entries for readability.

---

## Open implementation items

- [ ] Update Harptos grid generator to 10-column tenday layout.
- [ ] Update date formatter for DR output string.
- [ ] Regression-check moon/plane/event overlays after layout change.
# calendar-structures
