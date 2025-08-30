# calendar
# Eberron Calendar (Roll20 API Script)

A calendar and event system tailored for **Eberron** that tracks the current date, renders mini-calendars in Roll20 chat, and supports event management.

**Author:** Matthew Cherry (github.com/mcherry1/calendar)

---

## Highlights

* **Simple Commands:** `!cal` shows a *beautiful* mini-calendar of the current month with:
   * The current day highlighted.
   * A list of events.
   * One-click quick action buttons.
* **Pretty Displays:** Mini-calendars rendered in chat with color themes, hover text, and quick-glance information. Month headers based on lunar colors.
* **Player Interaction:** Players can call same calendar and track time on their own (self-whisper only).
* **GM/Player Distinction:** Players have no access to advanced controls like changing the date, adding/removing events, or broadcasting to the table.
* **Infinite Variations:** Call any month, any year, or any month of any year.
* **Event Management:**
   * Default set of Eberron holidays loaded. Expandable if you edit the code.
   * Custom color for each event.
   * Add your own events like birthdays (annual), rent due (monthly), parties (every day), or any other variation you desire.
   * Remove any event, including defaults.
   * Generate lists of events in chat.
* **Smart Semantics:** Interprets your intention with tons of shortcuts, aliases, and various smart-parsing of intention.

---

## Installation

1. In your Roll20 game (Pro subscription required), open **Game Settings → API Scripts**.
2. Create a **New Script**, name it `Calendar` (or anything you like), and paste in `Eberron Calendar Script`.
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
  Each month has a **season** label and a lunar-based **color** used for the header and the “today” highlight.

* **Current date (default):** `Zarantyr 1, 998 YK`

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

> ⚙️ Removing a default event marks it as **suppressed** so it won’t be resurrected on refresh.

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
  Show a mini-calendar view. Supported **modifiers**:

  * *(none)* or `month` → current month
  * `year` → full set of months for the current numbered calendar year
  * `next` / `next month` → the next month
  * `next year` → next numbered year
  * `upcoming year` → rolling 12 months, starting this month
  * **"month"** (e.g., `Nymm`) → the *current or next occurrence* of that month
  * **“month year”** (e.g., `Nymm 999`) → that specific month in that specific year
  * **Special convenience:** `upcoming` (or `upcoming month`) shows:
    * current month if today < 15th
    * next month if today ≥ 15th

* `!cal events [modifier]`
  List events in a focused window. **Default** is a **rolling 28-day** window when no modifier is given. Supported modifiers:

  * *(none)* or `upcoming` or `upcoming month` → rolling 28 days (today inclusive)
  * `month` → current month
  * `next` or `next month` → next month
  * `year` → current calendar year
  * `upcoming year` → rolling 12 months, starting this month
  * `next year` → next calendar year
  * **Month name**, **“Month Year”**, or **Year number** → targeted range

* `!cal help`
  Show available commands (GM sees GM-only extras).

---

### GM-Only

* `!cal advanceday`
  Advance one day (rolls months/years and weekday automatically).

* `!cal retreatday`
  Go back one day (rolls months/years and weekday automatically).

* `!cal setdate [MM] DD [YYYY]`
  Set the current date. Two forms are supported:

  1. **`MM DD [YYYY]`** — set an exact date. year is optional, with current year assumed.
  2. **`DD`** (single number) — assumed to be the next occurrence of that numbered day. Will roll months or years as needed.

* `!cal senddate`
  **Broadcast** the current month view (plus events) to **all players**.

* `!cal sendyear`
  **Broadcast** the full current year (no event list) to **all players**.

* `!cal addevent [MM] DD [YYYY] name [#hex]`
  Add custom events. Powerful parsing supports:

  * **Months:** numbered, CSV (`1,3,5,8`), range (`2-5`), or `all`
  * **Days:** number, CSV, range (`18-19`), or `all`
  * **Years:** number, CSV, range, or `all` (meaning “repeat every year”)
    **Semantics:**
  * If you provide **only one number** (`DD`), the script assumes the next `DD` (this month if still upcoming; otherwise next month).
  * If you provide **two numbers** (`MM DD`) it assumes the next occurrence of `MM/DD` (this year if not yet passed; otherwise next year).
  * Any use of **`all`**, **CSV**, or **ranges** triggers multiple events.
  * Day **ranges** (e.g., `18-19`) create occurrences for each day of the range.

* `!cal addmonthly DD name [#hex]`
  Alias for: “every month, given day, repeating every year.”
  Equivalent to: `!cal addevent all DD all name [#hex]`.

* `!cal addannual MM DD name [#hex]`
  Alias for: “every year, given month/day.”
  Equivalent to: `!cal addevent MM DD all name [#hex]`.

* `!cal removeevent [all] [exact] [index] <index|name>`
  Remove one or more events by **name** or **index**.

  * Name matching is **substring** by default; add `exact` for exact name matches.
      * `!cal removeevent gala` will take out the Tain Gala.
      * `!cal removeevent exact gala` will only take out events named "gala".
  * Add `all` to remove **every** match.

  * Safety: if your request matches multiple events, you'll get instructions to disambiguate.
      * Every event is assigned a hidden index number. Those indices will be revealed if needed for disambiguation.

  * Safety: if your request matches both an **index** and a **name**, you’ll get instructions to disambiguate. `!cal removeevent 7`
      * `!cal removeevent 1999` might remove an event named "Party Like 1999", but if you also have an event with index 1999, it will ask for more infomation.
      * `index <n>` removes the event at position `n`. So if you have an event named "Party at 7", and an event with index of 7, it will force the index and leave your party alone. `!cal removeevent index 7`
      * *Cannot be combined with `all` or `exact`.*

  * There are some nuances here. Technically, there is only one Tain Gala, that occurs on the 6th (1st Far) of every month. The script does not "fill" a calendar. (There is no infinite scroll of years.) It just checks if any defined events matche whatever date it is currently working with.
  * There are not 12 Tain Galas per year. There is one Tain Gala that happens 12 times per year.

* `!cal refresh`
  Re-normalize, clamp dates, refresh colors, and de-duplicate state, etc. etc. Boring script stuff. The script automatically calls this function internally, but calling it manually might make you feel a little fresher.

* `!cal resetcalendar`
  Completely reset to built-in defaults state. **Nukes custom events and current date**. You have been warned. The script will not warn you. (The API doesn't support an "Are you sure you want to do that?" function.)

## Aliases
   I have included a ton of aliases for these functions. Use them as you see fit. Use them accidentally. Just guess. You can do it. Most of the time where I have a "next month" or "next year", it will also accept "nextmonth" or "nextyear". (You'll still need to spell !cal right.)
   * `!cal <command>`:
      * `show month` - show, month, current, showmonth, show current, showcurrent, mnoth, monht, curretn
      * `show year` - all, year, showyear, showyr, yaer, yera
      * `show next month` - next
      * `events upcoming` - events, evenst, envetns
      * `events month` - this list is actually shown in the standard current month view. no aliases.
      * `events year` - list, list events, listevents, list all, listall, allevents
      * `addevent` - addevent, add, addnext
      * `removeevent` - remove, rm   

---

## Event Syntax, Parsing & Semantics

### Date tokens

After `addevent`:

* **Month**: integer, comma-separated-values (i.e. CSV) (1,2,5,8), range (`A-B`), or `all` (meaning "repeat every month")
* **Day**: integer, CSV, range, or `all` (if you want to schedule second breakfast every day)
* **Year**: integer (any 32-bit, CSV, range, or `all` (meaning “repeat every year"

If you include only a single date token, `!cal add 17 Party`, it will look for the next "17th", (including today).
If you include two date tokens, `!cal add 2 17 Party`, it will look for the next Olarune 17th.
If you include all three integers, `!cal add 12 28 997 Party`, it will recognize that as the 28th of Vult, in the year 997 YK.

If you use `addmonthly` or `addannual` it only accepts a day token or month + day tokens, respectively, and assigns "all" automatically.

> **Clamping:** Months are clamped to the number of months (default 12). Days are clamped to each month’s length. E.g., `13 37` becomes `12 28`, or `1-31` becomes `1-28`.

### Colors & The `--` Separator

The script will pull anything that looks like a hex code from the end of the entry and use it for the color token. So `!cal add 1 20-23 Party ABC` will assume ABC is the hex code (grey-blue).

Similarly, it will pull anything that looks like a date token from the front of the name. So `!cal add 7 5 Card Draw` will assume you meant the next Lharvion 5th.

To avoid confusion when your **event name contains numbers** (e.g., “1985 Reunion” or "5 Card Draw" or "Learning ABC") use the `--` separator:

* Everything **before** `--` is parsed as **date tokens**.
* Everything **after** `--` is treated as the **name**, with **one exception**:

  * If the very **last token** after `--` **starts with `#`** and is a valid hex (`#RGB` or `#RRGGBB`), it is used as the **color** and removed from the name.

**Examples**

```
!cal addevent 8 4 -- The Hunt #228B22
   → Month 8, Day 4, name "The Hunt", color #228B22

!cal addevent 8 4 -- The Hunt 228B22
   → Month 8, Day 4, name "The Hunt 228B22" (default color)

!cal addevent 3 25 1985 Reunion
   → Month 3, Day 25, Year 1985, name "Reunion" (default color)

!cal addevent 3 25 -- 1985 Reunion
   → Month 3, Day 25, name "1985 Reunion" (default color)

!cal addevent all 5 1030 Rent 00FF00
   → Every month, Day 5, year 1030, name "Rent", color #00FF00

!cal addevent all 5 -- 1030 Rent #00FF00
   → Day 5 of every month, every year, name "1030 Rent", color #00FF00
```

### Color rules

* Colors are sanitized to **#RRGGBB**. Inputs may be `#RGB`, `#RRGGBB`, or their **bare** equivalents (without `#`).
* If you use `--`, **only** a final token that **starts with `#`** is interpreted as a color; **bare hex** after `--` stays in the **event name**.
* If you omit a color, the event uses the **default** color (currently **`#FF00F2`** - bright pink).

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
