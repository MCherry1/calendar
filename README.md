# calendar
Roll20 Calendar Script
# Eberron Calendar (Roll20 API Script)

A compact, GM-friendly calendar and event system tailored for **Eberron** (or any 12×28-day setting) that renders mini-calendars in Roll20 chat, tracks the current date, and supports powerful event management with ranges, CSV lists, “all” selectors, and smart “next occurrence” semantics.

**Version:** 1.9
**Author:** Matthew Cherry (github.com/mcherry1/calendar)

---

## Highlights

* **One-command calendar:** `!cal` shows the current month with the current day highlighted.
* **Clean UI:** Single-month tiles with per-month color themes; multiple events per day render with a crisp diagonal gradient.
* **Accessible text:** Auto-contrasts text against backgrounds and outlines text when contrast < 4.5:1.
* **Smart event parsing:** Ranges (`18-19`), CSV (`1,3,5-7`), and `all` for months/days/years.
* **“Next” semantics:** One-off events land on the *next* matching date (this month if still upcoming, otherwise next month).
* **Convenient GM controls:** Advance/retreat a day, set dates, broadcast to the table, and manage events—right from chat.
* **Safe defaults:** You can remove default events and the script will **not** re-insert them later.

---

## Installation

1. In your Roll20 game (Pro subscription required), open **Game Settings → API Scripts**.
2. Create a **New Script**, name it `Calendar` (or anything you like), and paste in `Eberron Calendar Script v1.9`.
3. Save the script.
   On first load, chat will display:

   ```
   Eberron Calendar Initialized
   Current date: <weekday>, <day> <month>, <year> YK
   Use !cal to view the calendar.
   Use !cal help for command details.
   ```

---

## Data Model & Defaults

* **Weekdays:** `["Sul","Mol","Zol","Wir","Zor","Far","Sar"]`

* **Months (12 × 28 days):**
  Zarantyr, Olarune, Therendor, Eyre, Dravago, Nymm, Lharvion, Barrakas, Rhaan, Sypheros, Aryth, Vult
  Each month has a **season** label and a **color** used for the header and the “today” highlight.

* **Current date (default):** `1 Zarantyr, 998 YK` (weekday index 0)

* **Default events (subset shown):**

  * **Tain Gala** — day **6** of **every** month
  * **Crystalfall** — Olarune 9
  * **The Day of Mourning** — Olarune 20
  * **Tira's Day** — Therendor 15
  * **Sun's Blessing** — Therendor 15
  * **Aureon's Crown** — Dravago 26
  * **Brightblade** — Nymm 12
  * **The Race of Eight Winds** — Lharvion 23
  * **The Hunt** — Barrakas 4
  * **Fathen's Fall** — Barrakas 25
  * **Boldrei's Feast** — Rhaan 9
  * **The Ascension** — Sypheros 1
  * **Wildnight** — Sypheros **18-19** (range)
  * **Thronehold** — Aryth 11
  * **Long Shadows** — Vult **26-28** (range)

> ⚙️ Removing a default event marks it as **suppressed** so it won’t be re-added when defaults merge in future versions.

---

## What Players See vs. What GMs See

* **Everyone** can use informational commands (`!cal`, `!cal show …`, `!cal events …`, `!cal year`, `!cal help`).
* **GMs only** may use any command that **changes** calendar state (advance/retreat/set dates, add/remove events, broadcast to table, refresh/reset).

When a GM uses `!cal` or `!cal show` (single month), a small private block of **GM buttons** is whispered for quick actions:

```
[📤 Send Date] [⏭ Advance Day] [⏮ Retreat Day] [❓ Help]
```

---

## Commands

### Everyone

* `!cal`
  Show the **current month** (whispered to the caller) with the current day highlighted and today’s events listed.
  If the caller is a GM, the GM button panel is also whispered.

* `!cal show [modifier]`
  Show a calendar view. Supported **modifiers**:

  * *(none)* or `month` → current month
  * `year` → the current numbered calendar year
  * `next` / `next month` → the next month
  * `next year` → next numbered year
  * `upcoming year` → rolling 12 months starting this month
  * **Month name** (e.g., `Nymm`) → the *next occurrence* of that month
  * **“Month Year”** (e.g., `Nymm 999`) → that specific month in that specific year
  * **Special convenience:** `upcoming` (or `upcoming month`) shows:

    * current month if today < 15th
    * next month if today ≥ 15th

* `!cal year` (aliases: `!cal fullyear`, `!cal showyear`)
  Show the full **current** year as twelve tiles.

* `!cal events [modifier]`
  List events in a focused window. **Default** is a **rolling 28-day** window when no modifier is given. Supported modifiers:

  * `month` → current month
  * `next` / `next month` → next month
  * `year` → current calendar year
  * `upcoming` → rolling 28 days (today inclusive)
  * `upcoming year` → rolling 12 months starting this month
  * `next year` → next calendar year
  * **Month name**, **“Month Year”**, or **Year number** → targeted range

* `!cal help`
  Show a trimmed command reference (GM sees GM-only extras).

---

### GM-Only

* `!cal advanceday`
  Advance one day (rolls months/years and weekday automatically).

* `!cal retreatday`
  Go back one day (rolls months/years and weekday automatically).

* `!cal setdate [MM] DD [YYYY]` **or** `!cal setdate DD`
  Set the current date. Two forms are supported:

  1. **`MM DD [YYYY]`** — set an exact date.
  2. **`DD`** (single number) — treated as **day-only** with “next” semantics:

     * if DD ≥ today’s day → set to DD in the **current** month
     * otherwise → set to DD in the **next** month (year rolls if needed)

* `!cal senddate`
  **Broadcast** the current month view (plus events) to **all players**.

* `!cal sendyear`
  **Broadcast** the full current year (no event list) to **all players**.

* `!cal addevent [MM|list|all] [DD|range|list|all] [YYYY|list|all] name [#hex]`
  Add custom events. Powerful parsing supports:

  * **Months:** number, CSV (`1,3,7`), range (`2-5`), or `all`
  * **Days:** number, CSV, range (`18-19`), or `all`
  * **Years:** number, CSV, range, or `all` (meaning “repeat every year”)
  * **Name & color:** see **Color & `--`** below
    **Semantics:**
  * If you provide **only a day** (`DD`), the script adds a **single one-off** on the next DD (this month if still upcoming; otherwise next month).
  * If you provide **month and day** (`MM DD`) with both as plain integers, it adds a **single one-off** on the next occurrence of `MM/DD` (this year if not yet passed; otherwise next year).
  * Any use of **`all`**, **CSV**, or **ranges** triggers **bulk** insertion.
  * Day **ranges** (e.g., `18-19`) create **multiple occurrences** on each day of the range.

* `!cal addmonthly DD name [#hex]`
  Sugar for: “every month, given day, repeating every year.”
  Equivalent to: `!cal addevent all DD all name [#hex]`.

* `!cal addannual MM DD name [#hex]`
  Sugar for: “every year, given month/day.”
  Equivalent to: `!cal addevent MM DD all name [#hex]`.

* `!cal addnext <...>`
  Thin wrapper over `addevent` that behaves like the “next occurrence” form:

  * `!cal addnext DD name [#hex]` → next DD from today
  * `!cal addnext MM DD name [#hex]` → next MM/DD from today
    *(Note: if you omit a name entirely, `addevent` defaults to “Untitled Event.” If you prefer to **require** names, you can add a small guard in code.)*

* `!cal removeevent [all] [exact] [index] <index|name>`
  Remove one or more events by **index** or **name**.

  * `index <n>` removes the event at position `n` (as shown in internal lists).
    *Cannot be combined with `all` or `exact`.*
  * Name matching is **substring** by default; add `exact` for exact name matches.
  * Add `all` to remove **every** match (including defaults—those become suppressed).
  * Safety: if your query ambiguously matches an **index and a name**, you’ll get instructions to disambiguate.

* `!cal refresh`
  Re-normalize, clamp, and de-duplicate state. Also re-applies default colors to events missing a color.

* `!cal resetcalendar`
  Completely reset to built-in defaults (months/weekdays/events/current date). **Nukes** custom events and current date.

---

## Event Syntax, Parsing & Semantics

### Date tokens

At the front of `addevent`/`addmonthly`/`addannual`:

* **Month**: integer (1–12), CSV, range, or `all`
* **Day**: integer, CSV, range (`A-B`), or `all`
* **Year**: integer (any 32-bit), CSV, range, or `all` (meaning “repeat every year”)

> **Clamping:** Days are clamped to each month’s length. E.g., `all 31` becomes `1–28` across 28-day months. If you’d rather **skip** months that don’t have the day, you’d need to modify the “clamp/normalize” behavior in `_addConcreteEvent`.

### Name & Color (the `--` separator)

To avoid confusion when your **event name contains numbers** (e.g., “1985 Reunion”) or you want to include a hex-like fragment **in the name**, use the `--` separator:

* Everything **before** `--` is parsed as **date tokens** and an optional **color**.
* Everything **after** `--` is treated as the **name**, with **one exception**:

  * If the very **last token** after `--` **starts with `#`** and is a valid hex (`#RGB` or `#RRGGBB`), it is used as the **color** and removed from the name.

**Examples**

```
!cal addevent 8 4 -- The Hunt #228B22
   → Month 8, Day 4, name "The Hunt", color #228B22

!cal addevent 8 4 -- The Hunt 228B22
   → Month 8, Day 4, name "The Hunt 228B22" (no color)

!cal addevent 25 Payday
   → Next 25th (one-off), name "Payday" (no color)

!cal addevent all 5 Rent #00FF00
   → Day 5 of every month, every year, name "Rent", color #00FF00
```

### Color rules

* Colors are sanitized to **#RRGGBB**. Inputs may be `#RGB`, `#RRGGBB`, or their **bare** equivalents (without `#`) **on the date side**.
* If you use `--`, **only** a final token that **starts with `#`** is interpreted as a color; **bare hex** after `--` stays in the **event name**.
* If you omit a color, the event uses the **default** color **`#FF00F2`** (bright pink).

### “Next” semantics (one-offs)

* `DD` (just a day) → add a **single event** on the **next** `DD` (this month if today ≤ `DD`; otherwise next month).
* `MM DD` (both plain integers) → add a **single event** on the **next** `MM/DD` in or after the current year.

### Repeating semantics

* If **`all`** or **CSV/range** appears in **any** of month/day/year, insertion is **bulk** for all combinations.
* `year=all` means **repeat every year** (stored with `year = null`).

### Uniqueness

Events are considered duplicates (and not re-inserted) if the **name**, **month**, **day spec** (normalized), and **year** (or “ALL” if repeating) are identical.

---

## Rendering & Accessibility

* **Single event day:** Solid background with the event’s color; text color auto-selects **black/white** for the best contrast.
* **Multiple events:** Up to **three colors** render as a sharp diagonal gradient at **45°**. Text color is computed from the **average** of the colors for best readability.
* **Today’s cell:** Receives a strong highlight (larger font, inner glow, outer shadow, outline) layered atop its base (event color or month color).
* **Contrast:** The script measures WCAG contrast; if < **4.5:1**, it adds a subtle text outline using the opposite color to boost legibility.

Hover a date to see a **title tooltip** listing all event names for that day.

---

## Broadcast vs Whisper

* **Whispered** to the caller:

  * `!cal`, `!cal show …`, `!cal year`, `!cal events …`, `!cal help`
* **Broadcasted** to everyone:

  * `!cal senddate`, `!cal sendyear`
* The script automatically whispers additional **GM buttons** to the GM when applicable.

---

## Internals (for Maintainers)

* **State key:** `state.CALENDAR`

  ```js
  {
    calendar: {
      current: {month, day_of_the_month, day_of_the_week, year},
      weekdays: [...],
      months: [{name, days, season, color}, ...],
      events: [{name, month, day:"D"|"A-B", year|null, color|null}, ...]
    },
    suppressedDefaults: {"<month|day|ALL|name>":1, ...}
  }
  ```
* **Initialization & migration:**

  * `checkInstall()` ensures the shape, normalizes months, clamps current date, migrates events, and merges in new defaults unless **suppressed**.
  * `refreshCalendarState()` re-normalizes and sorts events; de-duplicates.
* **Default events merging:**

  * `mergeInNewDefaultEvents()` inserts defaults added in newer script versions **unless** previously removed (suppressed).
* **Date math:**

  * `toSerial()` linearizes y/m/d onto an absolute day count for consistent day-of-week deltas.
  * `weekdayIndexFor()` computes weekday for any month/day relative to the current date.
* **Event expansion:**

  * `normalizeDaySpec()` converts a day string to `D` or `A-B` within the month bounds.
  * `expandDaySpec()` turns a spec into explicit day integers for range queries.
* **Style helpers:**

  * `_relLum()`, `_contrast()`, `textColorForBg()`, `outlineIfNeeded()` implement color/contrast logic.

---

## Examples

```text
# View calendars
!cal
!cal show
!cal show year
!cal show next month
!cal show next year
!cal show upcoming         # current month if <15th, else next month
!cal show Nymm             # next occurrence of Nymm
!cal show Nymm 999         # Nymm 999 YK
!cal year
!cal events                # rolling 28 days
!cal events month
!cal events upcoming year

# Change date (GM)
!cal advanceday
!cal retreatday
!cal setdate 7             # next 7th (this or next month)
!cal setdate 3 14          # next 3/14 (this year or next)
!cal setdate 4 1 1001      # exact date

# Add events (GM)
!cal addevent 8 4 -- The Hunt #228B22
!cal addannual 6 12 Brightblade #B22222
!cal addmonthly 5 Rent #00FF00
!cal addevent all 9 -- Market Day
!cal addevent 3 18-19 -- Festival #FFD700
!cal addnext 25 Payday
!cal addnext 11 11 -- Armistice #4169E1

# Remove events (GM)
!cal removeevent index 7
!cal removeevent exact Long Shadows
!cal removeevent all Gala
```

---

## Customizing for Other Settings

* **Change weekday names** and **month names/days/season/colors** in the `defaults` block.
* **Add/adjust default events** in `defaults.events`. Ranges like `"18-19"` and `"26-28"` are supported.
* **Era label** (`YK`) lives in `LABELS.era`.
* **Event default color** is `EVENT_DEFAULT_COLOR`.
* **Gradient angle** is `GRADIENT_ANGLE` (default `45deg`).
* **Contrast threshold** is `CONTRAST_MIN` (default `4.5`).

---

## Known Behaviors & Edge Cases

* **Clamping:** `addevent all 31 ...` will clamp to each month’s max (28). To **skip** months without that day instead of clamping, adjust `_addConcreteEvent` to bail when `normalizeDaySpec` clamps.
* **Duplicates:** Exact duplicates (same name/month/daySpec/year) are not added.
* **“Untitled Event”:** If no name is parsed, a default name is used. If you want to make name **required**, add a quick guard in `addEventSmart`.
* **sendyear:** broadcasts the **year grid only** (no event list), by design.
* **Month names for adding:** Month **names** are recognized by `show/events` views but **not** for `addevent` month inputs (which expect numbers/lists/ranges/`all`).

---

## Changelog (v1.9)

* **Cleaner parsing with `--`:** The name is split **before** color detection, so embedded numbers/hex-ish strings stay in the name.

  * On the **date side**, a trailing color can be bare hex or `#hex`.
  * On the **name side**, only a final token that **starts with `#`** is treated as color.
* **`!cal setdate DD` added:** Single integer is treated as a **day-only** jump to the next occurrence (this month if upcoming, else next month).
* **Default events expanded/adjusted:** Includes **Tain Gala on day 6 every month** and several Eberron holidays (with theme colors).
* **Events listing defaults to “Upcoming (28 days)”** when no modifier is given to `!cal events`.
* **UI & accessibility polish:** Better contrast handling plus a subtle text outline when needed.

---

## License

Add your license here (e.g., MIT).

---

## Contributing

PRs welcome! Common contributions:

* New/adjusted defaults (months, holidays, colors)
* Additional viewing shortcuts
* Optional flags (e.g., month-name support for `addevent`)
* Doc updates / examples

---

## Support / Feedback

Open an issue in the repo with:

* Script version
* A copy of the command you ran
* What you expected vs what happened
* If relevant, a snippet of your custom `defaults` config

Happy calendaring in Eberron! 🗓️✨
