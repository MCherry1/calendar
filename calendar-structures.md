# Calendar Structures

## Purpose

Rendering and formatting rules for each supported calendar mode.

---

## Supported calendar systems

### Eberron (default)

- Year length: **336 days**
- Month model: setting-defined (tool-specific)
- Moon/plane/weather overlays are first-class in daily summaries

### Harptos (corrected rules)

- Uses **tendays**, not weekdays
- Each month is shown as **3 rows × 10 columns**
- Column headers:
  - `1st`, `2nd`, `3rd`, `4th`, `5th`, `6th`, `7th`, `8th`, `9th`, `10th`
- Date format:
  - **`16th of <Month>, <Year> DR`**

---

## Shared rendering requirements

- Highlight ranges across **all days in the interval**, not only endpoints
- Mini-calendar rows must not clip on the Y-axis
- Tooltips should include line breaks between entries for readability

---

## Open implementation items

- [ ] Update Harptos grid generator to 10-column tenday layout
- [ ] Update date formatter for DR output string
- [ ] Regression-check moon/plane/event overlays after layout change
