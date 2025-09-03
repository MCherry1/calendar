# Eberron Calendar (Roll20 API Script)

A calendar and event system (currently) tailored for **Eberron** that tracks the current date, renders mini-calendars in Roll20 chat, and supports event management.

**Author:** Matthew Cherry (github.com/mcherry1/calendar)
---

> Game time is of utmost importance.
> ...
> YOU CAN NOT HAVE A MEANINGFUL CAMPAIGN IF STRICT TIME RECORDS ARE NOT KEPT.
> 
> Dungeon Master’s Guide (page 37), Gary Gygax

---
## Purpose

I put this script together to encourage interaction with, and awareness of, the in-game calendar. Towards that end, these are my primary goals:
  1. Easy for GMs to manage.
  2. Easy for players to use *without* needing the GM.

That's really it.

There are other fantasy calendars.  Plenty of GMs track time in their own notes. Sometimes players do, too. But it can be challenging to keep everything sychronized; and it can be frustrating as a player to not know where or how to find the calendar.
  
Besides, plenty of players might be unfamiliar with the calendar, or the setting entirely.
  
---
## Highlights

* **Quick Buttons:** Quick-access buttons for basic interaction (show, send, advance, retreat, help, etc.)
  * *Tip:* Add a macro that simply says `!cal` to the macro bar.
* **Simple Commands:**
   * `!cal` or `!cal show` for a quick calendar.
   * `!cal list` or `!cal events` for a quick list of upcoming events.
   * `!cal send` to broadcast the quick calendar. *(GM only)*
   * `!cal send list` or `!cal send events` to broadcast the event list. *(GM only)*
   * `!cal advance`, `!cal retreat`, `!cal set Nymm 2004` to manage the current date.  *(GM only)*
* **Smart Semantics :** Interprets your intention with tons of shortcuts, aliases, and various smart-parsing to cut down on required command text. (See logic further down.)
* **Pretty Displays:** Mini-calendars rendered in chat with color themes, cell highlights, contrasting text, etc.
* **Useful Displays:** Current date highlights, event-day hover text, faded past dates, and more.
* **Infinite Variations:** Call any month, any year, any time.
* **Event Management:**
   * Default set of Eberron events loaded.
   * Custom color for each event.
   * Add your own events from the chat (`!cal add Far Party #sapphire` adds an event called "Party" on the next Far, with a sapphire-colored calendar cell).
   * Remove any event, including defaults, by name or by source (`!cal remove source Silver Flame` removes all Silver Flame holidays).
   * Generate lists of events in chat, with custom-defined ranges (`!cal list upcoming year` generates a chronological list of events for the current month and the next 11 months).

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
  Each month has a **season** label and a header **color** also used for the “today” highlight.
    Header **colors** have two sets: one themed for seasons, and another themed with the shared-name lunar color palette.

* **Starting date:** `Zarantyr 1, 998 YK`

* **Default events (subset shown):**

  * **Tain Gala** — day 6 of *every* month
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
  * **Wildnight** — Sypheros 18-19
  * **Thronehold** — Aryth 11
  * **Long Shadows** — Vult 26-28

> ⚙️ Removing a default event marks it as **suppressed** so it won’t be resurrected on refresh.

---

## Logic

The script makes a lot of default assumptions if you provide partial inputs.

* The script *always* assumes you mean the *next* occurrance of whatever you input.
* Going back in time is *never* assumed, and must be done explicitly using a `YYYY` input.
* This is true for calendar views, event scheduling, and date setting.

* When a specific date is asked for (`MM DD YYYY`), one integer is assumed to be `DD`, and two integers `MM DD`.
* When a period is asked for (`MM YYYY`), one integer is assumed to be `MM`.
* *Note: There are some edge cases here if integers provided don't fit the defined number of days or months. Since there is no limit on the number of the year, a single integer will usually fall back to that assumption, where possible. Multiple integers that do not match defined numbers of days and/or months will fail and generate an error message.*

Examples:  
  * `!cal set 6` on the 5th means advancing one day.
  * `!cal set 6` on the 7th means advancing one month (minus a day).
  * `!cal set 2 3` on 2/2 advances one day.
  * `!cal set 2 3` on 2/4 advances one year (minus a day).
  * `!cal 2` in Month 1 shows next month's calendar. `!cal 2` in Month 3 shows next year's Month 2 calendar.

---

## Commands

There are two core commands, (and one help):
  1. Calendar: `!cal` or `!cal show`
  2. Events List: `!cal list` or `!cal events`
  3. Help: `!cal help`

If no command is given, it assumes `show` (`!cal` = `!cal show`).

Both of these commands can be followed by an optional range of dates: `!cal [range]`/`!cal show [range]` or `!cal list [range]`/`!cal events [range]`.

Available terms:
  * `MM YYYY`
    * *If only one integer is provided, assumes `MM` if possible (total count of months), then falls back to `YYYY`.*
    * (`!cal 11` shows the current or next occurrance of month 11. `!cal 77` shows year 77, unless you had 77 months.)
  * `month` (defaults to current month)
  * `MM`, `[name]`, `month [name]`, or `month 9` (current or next occurrance)
  * `year` (defaults to current year)
  * `YYYY` (if number provided is greater than the count of months) or `year YYYY`
  * *Note: Months also accept a 3-4 letter abbreviation. (e.g. `drav` = `dravago`, `syph` = `syp` = `sypheros`.)*
    
  * Prepend or append these terms to the above. If used on their own, they assume `month`. (e.g. `!cal current` = `!cal show this month` = `!cal`)
    * `current`, `this` — inclusive of present date
    * `last`, `previous`, `prev` — period before present date
    * `next` — period after present date
    * `upcoming` — rolling period that (generally) includes present date

  * Examples:
    * `!cal list year previous` or `!cal events last year`
    * `!cal next` or `!cal next month`
    * `!cal Nymm` or `!cal show 6`
    * `!cal events Olarune 994`
    * `!cal list year 894`
    * `!cal show 1 999`
    * `!cal last Dravago`

## GM Options

GMs have several more options.
1. `send` - Prepend `send` on either of the above core commands to broadcast to chat. (e.g. `!cal send list 999`, or `!cal send Therendor`)
2. `set` or `setdate` or `set date` - Change current day to a defined date using `!cal set [MM] DD [YYYY]`. Uses default "next" logic, with MM and YYYY optional. (e.g. `!cal set 7`, `!cal set 7 5`, or `!cal set 2 20 994`). Unlike both `show` and `list`, accepts 3 integers for a specific date.
3. `advance` or `advanceday` - steps current day forward
4. `retreat` or `retreatday` - steps current day back
5. `add` or `event add` or `addevent` - Add a custom event using `!cal add [MM] DD [YYYY] name #[hex]`
  * Months, Days, and Years accept numbers, comma-separated-values (`1,3,5,8`), ranges (`2-5`), or `all`
  * Standard "next" logic assumed.
  * `!cal addmonthly` or `!cal addannual` auto-fill `all` in the appropriate field.
6. `remove` or `event remove` or `removeevent` or `rm` - Remove any event using `!cal remove [all] [exact] [index] <index|name>`
  * Remove one or more events by **name** or **index**.
  * Name matching is **substring** by default; add `exact` for exact name matches.
    * `!cal removeevent gala` will take out the Tain Gala. (unless there are multiple galas - see *safety* below.)
    * `!cal removeevent exact gala` will only take out an event named exactly "gala".
  * Add `all` to remove **every** match.
      * `!cal removeevent all gala` will take out all the galas, Tain and otherwise.
  * *Safety*: if your request matches multiple events, you'll get instructions to disambiguate.
      * Every event is assigned a hidden index number. Those indices will be revealed if needed for disambiguation.
  * *Safety*: if your request matches both an **index** and a **name**, you’ll get instructions to disambiguate.
      * `!cal removeevent 1999` might remove an event named "Party Like 1999", but if you also have an event with index 1999, it will ask for more infomation.
      * `index <n>` removes the event at position `n`. So if you have an event named "Party at 7", and an event with index of 7, it will force the index and leave your party alone. `!cal removeevent index 7`
      * *Cannot be combined with `all` or `exact`.*
  * *Note: There is some nuance here. Technically, there is only one Tain Gala, that occurs on the 6th (1st Far) of every month. The script does not "fill" a calendar. (There is no infinite scroll of years.) There are not 12 Tain Galas per year. There is one Tain Gala that happens 12 times per year. You only need to remove it once.*
  * *Note: Default events are never truly removed. They are merely suppressed, and can be recalled.*

* `!cal resetcalendar`
  Completely reset to built-in defaults state. **Nukes custom events and current date**. You have been warned. The script will not warn you. (The API doesn't support an "Are you sure?" function.)

## Aliases
   I have included a ton of aliases for these functions. Use them as you see fit. Use them accidentally. Just guess. You can do it. Most of the time where I have a "next month" or "upcoming year", it will also accept "nextmonth" or "upcomingyear". (You'll still need to spell !cal right.)
   * `!cal <command>`:
      * `show month` - show, month, current, showmonth, show current, showcurrent, mnoth, monht, curretn
      * `show year` - all, year, showyear, showyr, yaer, yera
      * `show next month` - next, nxet, netx
      * `events upcoming` - events, evenst, envetns
      * `events month` - no aliases. this is actually shown in the standard current month view. just mentioning it here for that note.
      * `events year` - list, list events, listevents, list all, listall, allevents
      * `addevent` - add, add event, add next, addnext
      * `removeevent` - remove, rm, remove event

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

  * If the very **last token** after `--` **starts with `#`** and is a valid hex (`#RGB` or `#RRGGBB`), it is used as the **color** and removed from the name. This means that using the `--` separator *requires* you to preface your hex color with `#`.

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

### “Next” assumptions

* `DD` (just a day) → add a **single event** on the **next** `DD` (this month if today ≤ `DD`; otherwise next month).
* `MM DD` (both plain integers) → add a **single event** on the **next** `MM/DD` in or after the current year.

### Repeating distinctions

* If **`all`** or **CSV/range** appears in **any** of month/day/year, the event will show up multiple times in your event lists.
* An event happening on `1-3 17-18 all` occurs on the 17th & 18th days of the first 3 months of every year. But this is *not multiple events*. This is *one event happening multiple times*.

### Uniqueness

* Events are considered duplicates (and not re-inserted) if both every part of the date fields and the name field are *identical*.
* If you have `1 7 all Party` and `1 8 all Party` and `1 7-8 all Party`, you have 3 unique events.
* But on the mini-calendars, and on the events list, it will look like you have duplicate "Party" entries on both the 7th and 8th of Zarantyr.
* Similarly, you might add a 4th unique event `1 8 998 Party`, and it would start looking like you have a busy social life.
  
---

## Rendering & Accessibility

* **Single event day:** Solid background with the event’s color; text color auto-selects **black/white** (possibly with outline) for the best contrast.
* **Multiple events:** Up to **three colors** render as a sharp gradient. Text color optimizes to make the best case of the worst contrast.  
* **Today’s cell:** Receives a strong highlight (larger font, inner glow, outer shadow, outline) layered atop its base (event color or basic month color).

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
  * This lets you add to the default events list without needing to nuke the state.
* **Date math:**

  * `toSerial()` linearizes y/m/d onto an absolute day count for consistent day-of-week deltas.
  * `weekdayIndexFor()` computes weekday for any month/day relative to the current date.
* **Event expansion:**

  * `normalizeDaySpec()` converts a day string to `DD` or `A-B` within the month bounds.
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
!cal add all 9 -- Market Day
!cal add 3 18-19 -- Festival #FFD700
!cal addnext 25 Payday
!cal addnext 11 11 -- Armistice #4169E1

# Remove events (GM)
!cal removeevent index 7
!cal remove exact Long Shadows
!cal rm all Gala
```

---

## Customizing for Other Settings

* **Change weekday names** and **month names/days/season/colors** in the `defaults` block.
* **Add/adjust default events** in `defaults.events`. Ranges like `"18-19"` or `all` are supported.
* **Era label** (`YK`) lives in `LABELS.era`.
* I don't have leap year (Gregorian) or Intercalery days (Forgotten Realms) programmed yet. 

---

## Known Behaviors & Edge Cases

* **Clamping:** `addevent all 31 ...` will clamp to each month’s max (28). To **skip** months without that day instead of clamping, adjust `_addConcreteEvent` to bail when `normalizeDaySpec` clamps.
* **Duplicates:** Exact duplicates (same name/month/daySpec/year) are not added.
* **“Untitled Event”:** If no name is parsed, a default name is used.
* **sendyear:** broadcasts the **year grid only** (no event list), by design.
* **Month names for adding:** Month **names** are recognized by `show/events` views but **not** for `addevent` month inputs (which expect numbers/lists/ranges/`all`).

---

## License

I'm just a kid and life is a nightmare.

---

## Support / Feedback

Open an issue in the repo with:

* Script version
* A copy of the command you ran
* What you expected vs what happened
* If relevant, a snippet of your custom `defaults` config

Happy calendaring in Eberron! 🗓️✨
