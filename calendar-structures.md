# Calendar Structures Audit (Eberron + Harptos)

## Scope

This file now serves as an **accuracy audit** and implementation guide for:

- **Eberron (Galifar / YK)**
- **Faerûn (Calendar of Harptos / DR)**

It includes:

1. Canon-facing reference details.
2. A direct consistency check against `calendar.js`.
3. Explicit mismatch markers so differences are obvious.

---

## Canon reference summary

> Note: online lookup from this environment is currently blocked (HTTP 403), so this summary is based on established setting canon from core books and standard setting references.

### Eberron (Galifar) canon baseline

- **Year length:** 336 days.
- **Months:** 12 months × 28 days each.
- **Week:** 7 days.
- **Weekday names:** Sul, Mol, Zol, Wir, Zor, Far, Sar.
- **Month names (default/common):**
  1. Zarantyr
  2. Olarune
  3. Therendor
  4. Eyre
  5. Dravago
  6. Nymm
  7. Lharvion
  8. Barrakas
  9. Rhaan
  10. Sypheros
  11. Aryth
  12. Vult
- **Primary era label:** **YK** (*Year of the Kingdom*).
- **Typical written date style:**
  - `15 Sypheros 998 YK`
  - or `Sul, 15 Sypheros 998 YK` when weekday is included.

### Faerûn (Harptos) canon baseline

- **Year length:** 365 days (366 in leap years).
- **Months:** 12 months × 30 days each.
- **Intercalary festivals (outside normal tendays):**
  - Midwinter (between Hammer and Alturiak)
  - Greengrass (between Tarsakh and Mirtul)
  - Midsummer (between Flamerule and Eleasis)
  - Highharvestide (between Eleint and Marpenoth)
  - Feast of the Moon (between Uktar and Nightal)
- **Leap day:** Shieldmeet (after Midsummer), every 4 years.
- **Week model:** 10-day **tenday** cycle.
- **Day naming:** ordinal day within the tenday (1st–10th) is common at the table/display level.
- **Month names:**
  1. Hammer
  2. Alturiak
  3. Ches
  4. Tarsakh
  5. Mirtul
  6. Kythorn
  7. Flamerule
  8. Eleasis
  9. Eleint
  10. Marpenoth
  11. Uktar
  12. Nightal
- **Primary era label:** **DR** (*Dalereckoning*).
- **Typical written date style:**
  - `16th of Eleasis, 1491 DR`
  - Intercalary example: `Greengrass, 1491 DR`.

---

## Script consistency audit (`calendar.js`)

Legend:

- ✅ = consistent with canon intent
- ⚠️ = acceptable simplification
- ❌ = mismatch (must fix)

### Eberron

- ✅ 12 months × 28 days configured.
- ✅ 7-day week configured.
- ✅ Canon weekday names configured (`Sul..Sar`).
- ✅ Canon month names configured in standard variant.
- ✅ Default era label set to `YK`.
- ⚠️ Date formatting uses `Month Day, Year ERA` rather than `Day Month Year ERA` (not wrong, but less lore-authentic).

### Harptos

- ✅ 12 months × 30 days configured.
- ✅ All five fixed intercalary festivals present and ordered correctly.
- ✅ Shieldmeet modeled as leap intercalary day every 4 years.
- ❌ (previously) Week used 7 modern weekday names (`Sunday..Saturday`) instead of a 10-day tenday model.
- ❌ (previously) DR date output used `Month Day, Year DR` instead of `16th of Eleasis, 1491 DR` style.

### Outcome of this update

The two Harptos mismatches above are now corrected in `calendar.js`:

- Harptos now uses a 10-column tenday week header (`1st..10th`) through the weekday set.
- Harptos date labels now render as:
  - regular month day: `Nth of <Month>, <Year> DR`
  - intercalary day: `<Festival>, <Year> DR`

---

## Implementation notes

- The 10-day tenday model is implemented by changing `faerunian.weekdays` to 10 entries and adding matching abbreviations (`1st..10th`).
- Grid rendering already used dynamic `weekLength()`, so this naturally produces 10-column month tables for Harptos.
- Date label formatting is calendar-system-aware: Harptos now receives ordinal + `of` formatting, while other systems retain existing behavior.

---

## Remaining optional enhancements

- Add an optional “lore style” formatter toggle for Eberron (`15 Sypheros 998 YK`) vs current (`Sypheros 15, 998 YK`).
- Add explicit tenday naming conventions if you want custom names instead of ordinal labels.
