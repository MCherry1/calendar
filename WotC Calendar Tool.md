# WotC Calendar Tool Reference

> Reference-only note for coding agents: this document is preserved as historical/source-comparison material only. Do not treat it as an implementation guide, authoritative behavior spec, or migration target for this repository unless a human explicitly asks for that comparison work.

This document is a structured reference for the provided Wizards of the Coast Eberron Cosmology / Calendar Tool HTML + JavaScript source.

It focuses on the script's parameters in four practical groups:

1. User-facing inputs
2. Core runtime/default values
3. Indexed data structures and lookup tables
4. Function parameters and accepted values

## 1. User-Facing Parameters

These are the values a user can directly set through the page UI.

| Parameter | Source | Type | Allowed values | Default | Purpose |
| --- | --- | --- | --- | --- | --- |
| `year` | `form1.year` | integer | Any signed integer the field can parse | `998` | Active YK year used for planar and lunar calculations. |
| `month` | `form1.month` | integer | `1`-`12` | `1` | Active month index. Display name depends on the selected calendar. |
| `day` | `form1.day` | integer | `1`-`28` | `1` | Active day of the month. This calendar uses 28-day months. |
| `calendar` | `form2.calendar` | integer | `1`-`5` | `1` | Selects which month-name set is displayed across the tool. |

### Calendar Selector Values

| Value | Calendar set |
| --- | --- |
| `1` | Galifar |
| `2` | Druid |
| `3` | Ancient Dwarven |
| `4` | Halfling |
| `5` | Generic |

## 2. Core Runtime and Default Parameters

These globals define the current state or establish the reference points used by calculations.

| Parameter | Type | Default | Role |
| --- | --- | --- | --- |
| `iYear` | integer | `998` | Current active year shown in the UI. |
| `iMonth` | integer | `1` | Current active month shown in the UI. |
| `iDay` | integer | `1` | Current active day shown in the UI. |
| `iCalendar` | integer | `1` | Current month-name system. |
| `xYear` | integer | `998` | Base planar reference year. |
| `xMonth` | integer | `1` | Base planar reference month. |
| `xDay` | integer | `1` | Base planar reference day. |
| `qYear` | integer | `-2203` | Base lunar reference year. |
| `qMonth` | integer | `12` | Base lunar reference month. |
| `qDay` | integer | `28` | Base lunar reference day. |
| `cpc` | number | `0.66` | Kythri cycle coefficient passed into `setKythri(cpc)`. |
| `autocount` | integer | `0` | Tracks concurrent forward auto-play timers. |
| `negcount` | integer | `0` | Tracks concurrent reverse auto-play timers. |
| `Kythri` | integer | `0` at startup, then randomized | Stores Kythri's generated orbit length. |
| `KythriCount` | integer | `1` | Declared but not materially used in the provided script. |
| `sText` | string | Introductory HTML text | Active informational text shown in the description pane. |

### Browser/Rendering Flags

These are compatibility flags for legacy browser detection.

| Parameter | Meaning |
| --- | --- |
| `NS` | Netscape 4 style layer support flag. |
| `NS6` | DOM `getElementById` support flag. |
| `IE` | Legacy Internet Explorer `document.all` support flag. |
| `browser` | `navigator.appName`. |
| `version` | `navigator.appVersion`. |
| `bVer` | Concatenated browser/version string. |

## 3. Indexed Lookup Tables and Data Structures

## `aMonthName`

`aMonthName` is a single flattened month-name table. The selected calendar determines which block of 12 names is used.

The lookup formula is:

`index = month + ((iCalendar - 1) * 12)`

### Month Names by Calendar

| Month | Galifar (`1`) | Druid (`2`) | Ancient Dwarven (`3`) | Halfling (`4`) | Generic (`5`) |
| --- | --- | --- | --- | --- | --- |
| `1` | Zarantyr | Frostmantle | Aruk | Fang | January |
| `2` | Olarune | Thornrise | Lurn | Wind | February |
| `3` | Therendor | Treeborn | Ulbar | Ash | March |
| `4` | Eyre | Rainsong | Kharn | Hunt | April |
| `5` | Dravago | Arrowfar | Ziir | Song | May |
| `6` | Nymm | Sunstride | Dwarhuun | Dust | June |
| `7` | Lharvion | Glitterstream | Jond | Claw | July |
| `8` | Barrakas | Havenwild | Sylar | Blood | August |
| `9` | Rhaan | Stormborn | Razagul | Horn | September |
| `10` | Sypheros | Harrowfall | Thazm | Heart | October |
| `11` | Aryth | Silvermoon | Drakhadur | Spirit | November |
| `12` | Vult | Windwhisper | Uarth | Smoke | December |

## `aPlanarInfo`

`aPlanarInfo` is the main planar state table. It is organized as repeated 6-value records, with one record per plane.

### Record Schema

Each plane uses these six slots:

| Offset in plane record | Meaning |
| --- | --- |
| `0` | Orbit length in days |
| `1` | Coterminous/remote segment length in days |
| `2` | Current point in orbit |
| `3` | Starting point in orbit |
| `4` | Special condition tag |
| `5` | Current status |

### Special Condition Tags

| Value | Meaning |
| --- | --- |
| `0` | Normal |
| `1` | Frozen orbit |
| `2` | Random |
| `3` | Special |

### Status Codes

| Value | Meaning |
| --- | --- |
| `0` | Not yet set |
| `1` | Remote |
| `2` | Waxing |
| `3` | Coterminous |
| `4` | Waning |

### Plane Index Reference

| Plane index | Plane | Orbit length | Coterminous/remote length | Current point at load | Starting point | Condition |
| --- | --- | --- | --- | --- | --- | --- |
| `1` | Daanvi | `134400` | `33600` | `50400` | `50400` | `0` |
| `2` | Dal Quor | `1` | `1` | `0` | `0` | `1` |
| `3` | Dolurrh | `33600` | `336` | `8559` | `8559` | `0` |
| `4` | Fernia | `1680` | `28` | `1344` | `1344` | `0` |
| `5` | Irian | `1008` | `10` | `420` | `420` | `0` |
| `6` | Kythri | `0` | `0` | `0` | `0` | `2` |
| `7` | Lamannia | `364` | `7` | `94` | `94` | `0` |
| `8` | Mabar | `1680` | `3` | `422` | `422` | `0` |
| `9` | Risia | `1680` | `28` | `505` | `505` | `0` |
| `10` | Shavarath | `12096` | `336` | `4032` | `4032` | `0` |
| `11` | Syrania | `3360` | `1` | `841` | `841` | `0` |
| `12` | Thelanis | `75600` | `2352` | `20076` | `20076` | `0` |
| `13` | Xoriat | `2352000` | `336` | `588168` | `588168` | `3` |

## Lunar Tables

### `aMoonName`

Moon indices used by the phase functions:

| Moon index | Moon name |
| --- | --- |
| `1` | Nymm |
| `2` | Sypheros |
| `3` | Therendor |
| `4` | Rhaan |
| `5` | Olarune |
| `6` | Eyre |
| `7` | Vult |
| `8` | Zarantyr |
| `9` | Aryth |
| `10` | Dravago |
| `11` | Lharvion |
| `12` | Barrakas |

### `aLunarOrbits`

Orbit lengths by moon index:

| Moon index | Orbit length |
| --- | --- |
| `1` | `28` |
| `2` | `35` |
| `3` | `42` |
| `4` | `49` |
| `5` | `56` |
| `6` | `63` |
| `7` | `70` |
| `8` | `77` |
| `9` | `84` |
| `10` | `91` |
| `11` | `98` |
| `12` | `105` |

### `aLunarOffset`

Per-moon day offsets applied during lunar phase calculation:

| Moon index | Offset |
| --- | --- |
| `1` | `0` |
| `2` | `1` |
| `3` | `1` |
| `4` | `2` |
| `5` | `2` |
| `6` | `2` |
| `7` | `3` |
| `8` | `3` |
| `9` | `3` |
| `10` | `3` |
| `11` | `4` |
| `12` | `4` |

### `aLunarPercents`

Phase-band percentages used to partition each moon's orbit:

`[0, 8, 8, 8, 9, 8, 8, 9, 8, 8, 9, 8, 9]`

### `aLunarTotals`

Working array populated inside `calcMoonPhase(...)`. It is recalculated for each call and used as the phase threshold table.

### `aLunarInfo`

`aLunarInfo` is defined as:

`[7, 21, 34, 47, 59, 75, 97, 117, 165, 199, 247, 267, 289, 305, 317, 330, 336]`

In the provided source, this array is present but not actively used by the visible lunar phase logic.

## 4. Function Parameter Reference

This section lists the script functions that accept arguments and explains what each parameter means.

## Calendar and Date Functions

| Function | Parameters | Meaning |
| --- | --- | --- |
| `setKythri(cpc)` | `cpc`: number | Coefficient used to derive Kythri's randomized starting point from its randomized orbit length. |
| `selectMonth(smon)` | `smon`: integer `1`-`12` | Returns `"selected"` if `smon` matches `iMonth`. |
| `selectDay(sday)` | `sday`: integer `1`-`28` | Returns `"selected"` if `sday` matches `iDay`. |
| `colDay(cday)` | `cday`: integer `1`-`28` | Returns the highlight color for the given day cell. |
| `clickSetCalendar(cset)` | `cset`: event value, effectively unused | The function ignores the passed value and instead reads `document.form2.calendar.value`. |
| `sMonthName(cmon)` | `cmon`: integer `1`-`12` | Returns the month name for the active calendar system. |

## Plane Functions

| Function | Parameters | Meaning |
| --- | --- | --- |
| `planeLocation(xplane)` | `xplane`: integer `1`-`13` | Computes the x-position of a plane's status marker and updates its status code. |
| `planeStatus(pstat)` | `pstat`: integer `1`-`13` | Returns an HTML-formatted status label for the plane. |
| `planeStat(pstat)` | `pstat`: integer `1`-`13` | Returns the raw numeric status code for the plane. |
| `planeInfo(zplane)` | `zplane`: integer `1`-`13` | Returns the "days until next state" message for the plane. |
| `showPlaneInfo(xpx)` | `xpx`: integer `1`-`14` | Chooses which informational text block to show. `1`-`13` are planes; `14` is month-name help text. |

### Plane Indices for `showPlaneInfo`, `planeLocation`, `planeStatus`, `planeStat`, and `planeInfo`

| Value | Meaning |
| --- | --- |
| `1` | Daanvi |
| `2` | Dal Quor |
| `3` | Dolurrh |
| `4` | Fernia |
| `5` | Irian |
| `6` | Kythri |
| `7` | Lamannia |
| `8` | Mabar |
| `9` | Risia |
| `10` | Shavarath |
| `11` | Syrania |
| `12` | Thelanis |
| `13` | Xoriat |
| `14` | Month Names help panel only |

## Lunar and Display Functions

| Function | Parameters | Meaning |
| --- | --- | --- |
| `calcMoonPhase(moon, mmx, mdx)` | `moon`: moon index `1`-`12`; `mmx`: month override; `mdx`: day override | Calculates a moon phase code. If `mmx` or `mdx` is empty, the function uses `iMonth` and `iDay`. |
| `showMoonPhases(mphase)` | `mphase`: moon index `1`-`12` | Opens a month-by-day phase chart for one moon. |
| `showPart2(sText)` | `sText`: HTML string | Replaces the informational text panel. |
| `showPart6(spvi)` | `spvi`: integer `1`-`3` | Sets the transport-control display state. |
| `display(id, str)` | `id`: DOM element id; `str`: HTML string | Writes HTML into the target element using legacy browser branching. |

### `showPart6(spvi)` Values

| Value | Meaning |
| --- | --- |
| `1` | Idle controls |
| `2` | Forward auto-play active |
| `3` | Reverse auto-play active |

### `calcMoonPhase(...)` Return Codes

The function returns image suffix codes, not text labels:

| Return code | Likely phase bucket |
| --- | --- |
| `"1"` | One end of the cycle |
| `"2"` | Early crescent/quadrant bucket |
| `"2x"` | Intermediate bucket |
| `"3"` | Intermediate bucket |
| `"3x"` | Intermediate bucket |
| `"4"` | Mid-cycle bucket |
| `"5"` | Mid-cycle bucket |
| `"6"` | Intermediate bucket |
| `"6x"` | Intermediate bucket |
| `"7"` | Late-cycle bucket |
| `"7x"` | Intermediate bucket |
| `"8"` | Opposite end of the cycle |

The exact visual meaning is delegated to image assets such as `images/Moon_1.jpg` through `images/Moon_8.jpg` and the `x` variants.

## Interaction Parameters Passed Through Click Handlers

These are not stored as configuration, but they are explicit function parameters used by the UI.

| Function | Parameter | Allowed values | Purpose |
| --- | --- | --- | --- |
| `clickChangeDay(chd)` | `chd` | `1`-`28` | Changes the active day when a day cell is clicked. |
| `clickStartAuto(no)` | `no` | Unused | Placeholder parameter; the function does not use it. |
| `clickStartReverse(no)` | `no` | Unused | Placeholder parameter; the function does not use it. |

## 5. Important Notes and Quirks

### 1. Several event handlers pass values that the function does not actually use

Examples:

- `clickSetYear(value)`
- `clickSetMonth(value)`
- `clickSetDay(value)`
- `clickSetCalendar(value)`

In practice, these functions read from the form fields directly.

### 2. The script mixes configuration values and working state in the same arrays

This is especially true for `aPlanarInfo`, where initial data and live status updates share the same structure.

### 3. `aPlanarInfo[0..5]` is a dummy block

The first six entries are zeroes, which makes the planes effectively 1-indexed.

### 4. Kythri and Xoriat are special cases

- Kythri uses condition `2` and is randomized at launch.
- Xoriat uses condition `3` and an artificially long cycle.

### 5. Months are always 28 days long

Every date navigation and calendar rendering routine assumes:

- 12 months per year
- 28 days per month
- 336 days per year

## 6. Short Summary

If you only need the operational parameters at a glance, these are the key ones:

- Date input: `year`, `month`, `day`
- Calendar variant: `calendar`
- Planar lookup record: orbit length, coterminous/remote length, current point, starting point, condition, status
- Lunar lookup record: moon index, orbit length, offset, phase percentage bands
- Display selector arguments: plane index, moon index, control state, DOM target id
