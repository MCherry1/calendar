# Calendar — Roll20 API Script

A Roll20 API script for managing a fantasy campaign calendar with:
- graphical mini-calendar displayed in chat, with toggleable subsystems:
	- events tracking
	- moon phase tracking
	- location-based, generated weather, with mechanical effects (homebrew system)
	- planar movements (Eberron setting)

**Supports:** Eberron, Forgotten Realms, Earth (Gregorian)

---
## Table of Contents

- [Installation](#installation)
- [How to Use](#how-to-use)
- [Calendar Navigation](#calendar-navigation)
- [Events](#events)
- [Moons](#moons)
- [Weather](#weather)
  - [Temperature](#temperature)
  - [Wind](#wind)
  - [Precipitation](#precipitation)
  - [Location](#location)
  - [Forecasting](#forecasting)
- [Planes](#planes)
- [Commands](#commands)
  - [Dates](#dates)
  - [Weather](#weather-1)
  - [Moons](#moons-1)
  - [Planes](#planes-1)
  - [Events](#events-1)
- [Knowledge Tiers](#knowledge-tiers)
- [Calendar Systems](#calendar-systems)
- [Design Reference](#design-reference)

> **Note:** GitHub markdown supports collapsible sections via HTML `<details>` tags. Sections can be wrapped in `<details><summary>Section Title</summary>…</details>` if you want them collapsed by default. Not implemented here yet — worth deciding before the README is finalized.

---

## Installation

1. In Roll20, open your campaign's **API Scripts** page (Game Settings → API Scripts).
2. Create a new script and paste in the contents of `calendar.js`.
3. Save. It initializes automatically on first load.

---

## How to Use

Startup message should appear in game:
> Galifar Calendar Initialized
> Current Date: 

In the chat window, type:
`!cal`
*Tip: Add a macro for even easier use.*

---

## Calendar Navigation

The main `!cal` view shows a mini-calendar for the current month, along with several buttons that execute additional script commands.
### GM Buttons
```
⏮ Previous  |  ⏭ Next
📣 Send
📋 Today  |  📅 Upcoming
🌤 Weather
🌙 Moons
🌀 Planes
⚙ Admin
```
### Player Buttons
```
⏮ Previous  |  ⏭ Next
📋 Today  |  📅 Upcoming
🌤 Weather
🌙 Moons
🌀 Planes
```
- **Previous / Next** — see adjacent months
- **Send** — sends the current date's calendar to players in public chat
- **Today** — summary for the current in-game date
- **Upcoming** — preview strip
- **Weather/Moons/Planes** — For players, shows known forecast on dedicated minical. For GMs, includes subsystem management
- **Admin** — change displays, settings, and everything else related to the script
---
## Events
### General
- Individual cells within the minical are color-filled on the day of an event.
- For days with multiple events, small colored dots appear beneath the numbered date.
- Each cell can be hovered over with a mouse to show a tooltip containing the event information.
### Pre-Included
* All published holidays are pre-included in the script. Each is assigned a color.
* Every pre-included holiday can be individually toggled on or off.
* Additionally, holidays are grouped by Source, allowing for entire categories to be toggled on or off.
* Switching between calendar systems automatically toggles appropriate Sources.
### GM Generated
- GMs can create their own events, which are then stored in state.
- There is no limit to the number of events created. They can be deleted as necessary.
- If no color is assigned at creation, a random color is assigned.
---
## Moons
- **Earth**
	- Luna: synodic period 29.53 days, diameter 2,159 mi, distance 238,855 mi, inclination 5.14°, eccentricity 0.0549, albedo 0.12. Epoch anchor: 2021-01-28 (full moon).
- **Faerûn**
	- Selûne: synodic period 30.44 days, diameter 2,000 mi, distance 183,000 mi, inclination 5.1°, eccentricity 0.054, albedo 0.25. Epoch anchor: 1372-01-01.
- **Eberron**
	- Eberron's moons are vastly more important to the setting, more complex, and less defined by canon than a typical fantasy moon.
	- Each moon has a canon color, approximate diameter, and mean orbital distance.
	- Moons are intended as a flexible narrative tool, so their phases are adjustable as needed.
	- Each moon is matched to a real Solar System moon to model its inclination, eccentricity, and albedo — providing consistent, astronomy-inspired orbital behavior without requiring custom parameter invention. The reference moon's values are used as-is, with one exception: Barrakas applies an albedo multiplier for supernatural brightness (its association with Irian, the plane of life and light).
	- See [DESIGN.md §7.4](DESIGN.md) for the full reference mapping table.
---
## Weather
- Included is a homebrew system for managing the weather.
- This system can be toggled on or off as desired.
### Temperature

> **Note:** The script is migrating from an older 0–10 scale to this expanded −5 to 15 scale. Per-band mechanical effects for the upper heat range (7–15) are not fully specified yet; effects below follow the documented grouped rules.

| Temperature |   °F Approx.   | Mechanical Effect |
| :---------: | :------------: | :---------------- |
|     −5      |    ≤ −46°F     | DC 30 Con save or exhaustion; special cold-weather protection required |
|     −4      | [−45 .. −36]   | DC 25 Con save or exhaustion; heavy cold-weather clothing required |
|     −3      | [−35 .. −26]   | DC 25 Con save or exhaustion; heavy cold-weather clothing required |
|     −2      | [−25 .. −16]   | DC 20 Con save or exhaustion; medium cold-weather clothing required |
|     −1      | [−15 .. −6]    | DC 20 Con save or exhaustion; medium cold-weather clothing required |
|      0      |  [−5 .. 4]     | DC 15 Con save or exhaustion; light cold-weather clothing sufficient |
|      1      |  [5 .. 14]     | DC 15 Con save or exhaustion; light cold-weather clothing sufficient |
|      2      |  [15 .. 24]    | DC 10 Con save or exhaustion |
|      3      |  [25 .. 34]    | DC 10 Con save or exhaustion |
|      4      |  [35 .. 44]    | No direct thermal hazard |
|      5      |  [45 .. 54]    | No direct thermal hazard |
|      6      |  [55 .. 64]    | No direct thermal hazard |
|      7      |  [65 .. 74]    | DC 10 Con save or exhaustion (compounding factors) |
|      8      |  [75 .. 84]    | DC 10 Con save or exhaustion |
|      9      |  [85 .. 94]    | DC 15 Con save or exhaustion |
|     10      |  [95 .. 104]   | DC 20 Con save or exhaustion; medium and heavy armor at disadvantage |
|     11      | [105 .. 114]   | DC 20 Con save or exhaustion; all armor at disadvantage |
|     12      | [115 .. 124]   | DC 25 Con save or exhaustion; all armor at disadvantage |
|     13      | [125 .. 134]   | DC 25 Con save or exhaustion; mundane protection insufficient |
|     14      | [135 .. 144]   | DC 30 Con save or exhaustion; mundane protection insufficient |
|     15      |    ≥ 145°F     | DC 30 Con save or exhaustion; special protection required |
### Wind

| Wind | Label | Mechanical Effect |
| :--: | :---: | :---------------- |
|  0   | Calm | None |
|  1   | Breezy | None |
|  2   | Moderate | Fogs and airborne gases dispersed |
|  3   | Strong | Disadvantage on ranged attacks; long-range attacks auto-miss; flying costs +1 ft per ft; open flames extinguished |
|  4   | Gale | Ranged attacks auto-miss; flying speed becomes 0; walking costs +1 ft per ft |
|  5   | Storm | DC 15 Strength save or fall prone; small trees uprooted; severe hazard |

### Precipitation

| Precip | Sky / Condition | Notes |
| :----: | :-------------- | :---- |
|   0    | Clear | |
|   1    | Partly Cloudy | Light atmospheric moisture |
|   2    | Overcast | |
|   3    | Active Precipitation | Rain, snow, or sleet — type determined by temperature |
|   4    | Heavy Precipitation | Heavy rain, heavy snow, ice storm |
|   5    | Extreme / Deluge | Blizzard or deluge-class precipitation |

### Location

Weather is generated for a specific location profile. Set the profile with `!cal weather location`, or use the in-game location wizard. Three settings combine to determine weather baselines:

| Setting | Key Examples | Effect |
| ------- | ------------ | ------ |
| **Climate** | arctic, temperate, tropical, arid, … | Sets overall temperature baseline and seasonal variation |
| **Geography** | coastal, plains, hills, mountain, … | Modifies temperature and precipitation patterns |
| **Terrain** | forest, city, open, swamp, … | Fine-tunes local conditions; affects fog frequency |

A **manifest zone** can also be set independently. Manifest zones apply magical overlays on top of the location (e.g., a Syrania manifest zone forces calm, clear skies). Clear the manifest zone without changing the location when leaving the area.

Run `!cal weather location` in chat for the full list of valid keys and the interactive wizard.

### Forecasting

Weather is generated deterministically from your location profile and a seed word. The same location and seed always produce the same weather — useful for planning retroactively or maintaining consistency if you revisit a date.

The generation pipeline runs per-day:
1. **Baseline** — Climate, geography, and terrain set temperature, wind, and precipitation probabilities.
2. **Continuity** — Each day nudges toward the previous day's conditions, producing coherent weather evolution rather than random swings.
3. **Daily arc** — Morning, afternoon, and evening conditions are derived from a daily arc with some randomness. You get three snapshots per day, not one.
4. **Fog** — Rolls separately, with persistence across days and interaction with wind.
5. **Overlays** — Manifest zone and planar modifiers apply last (e.g., coterminous Syrania forces calm and clear regardless of baseline).

**Player reveals** are upgrade-only. Once a tier of information is given, players retain it. GMs always see full detail.

GMs can extend the forecast window ahead, reroll individual dates before revealing them, or lock a date's weather to prevent future changes.

---
## Planes
- **Interaction:** Planes interact with the calendar as a feature of the Eberron setting, with planes moving relative to the Material Plane, where the world of Eberron lives.
	- While "coterminous", associated traits are enhanced.
	- While "remote", associated traits are impeded.
- **Traditional:** In the setting, planes have traditional periods/cycles of being coterminous and remote. All of those are included. (*Source: Exploring Eberron*)
	- The published canon does not include specific anchor dates for these cycles, so these are generated by the script. The generation is random, but is based on a calendar-wide seed word. Using the same seed word creates the same calendar, every time.
	- Individual plane cycles can also be directly defined, bypassing the use of the world seed.
- **Generated:** Based on those traditional periods, probabilities for a plane becoming coterminous or remote were calculated, and are used to generate random occurrences of planes being coterminous or remote.
	- Approximately, a plane is coterminous or remote twice as often as the traditional cycles.
	- These generated events can be disabled.
---
## Commands
- All command formatting is whispered when needed, in game. You don't need to come back to this document.
- Additionally, almost all of the script can be interacted with exclusively through the buttons generated in the in-game chat window. That includes almost all of the commands presented in this section. The buttons execute the command.
	- However, the buttons are "hard-coded". A small set of the calendar's functions require specific typed commands.

## Dates

```
!cal <day>                — jump to next instance of that day number
!cal <month> <day>        — jump to next instance of specific month and day
!cal <month> <day> <year> — jump to exact date
!cal Olarune              — jump to the next Olarune (month name works as a shortcut)
```
## Weather

### Setting Your Location

```
!cal weather location                          — open location wizard
!cal weather location climate <key>            — set climate (arctic, temperate, tropical, etc.)
!cal weather location geography <key>          — set geography (coastal, mountain, plains, etc.)
!cal weather location terrain <key>            — set terrain (forest, city, open, etc.)
!cal weather location zone <key|none>          — set manifest zone (or clear it)
```

### Viewing Weather

```
!cal weather                    — today's weather
!cal weather forecast [n]       — n-day forecast (default 10)
!cal weather history            — recent past weather
!cal weather mechanics          — D&D mechanical effects for today's conditions
```

### GM Controls

```
!cal weather generate           — generate/extend the forecast window
!cal weather reroll <serial>    — reroll weather for a specific date
!cal weather lock <serial>      — lock weather for a date (no rerolls)
!cal weather event trigger <key> — trigger a specific weather event
!cal weather event roll <key>   — roll for a weather event
```

### Sending Weather to Players

```
!cal weather send low           — today + rough tomorrow (Common Knowledge)
!cal weather send medium        — 3-day forecast (Skilled Forecast)
!cal weather send high          — 10-day forecast with mechanics (Expert Forecast)
```

---

## Moons

### Viewing Moon Phases

```
!cal moon                       — moon phase panel for today
!cal moon on <date>             — moon phases on a specific date
!cal moon upcoming [span]       — upcoming notable moon events
!cal moon sky [time]            — sky visibility at a time of day (dawn/noon/dusk/midnight)
!cal moon lore [moonName]       — lore for a specific moon
```

### Sending Moon Info to Players

```
!cal moon send low              — today + 2 days (Common Knowledge)

!cal moon send medium [range]   — includes marginal uncertainty, with preset ranges of:
	1m, 3m, 6m, 10m (Skilled Forecast, typically gated behind a DC 10, 15, 20, 25 Skill Check)

!cal moon send high [range]     — full exact knowledge, with preset ranges of :
	1m, 3m, 6m, 10m (Expert Forecast, typically gated behind magic or a tool-assisted forecast)
```

Examples: `!cal moon send medium 3m` · `!cal moon send high 56d`

### GM Moon Controls

```
!cal moon seed <word>                     — set moon generation seed, overriding system-wide seed used
!cal moon full <MoonName> <date>          — anchor a moon's full phase to a date
!cal moon new <MoonName> <date>           — anchor a moon's new phase to a date
!cal moon reset [<MoonName>]              — clear phase anchors
```

---

## Planes

### Viewing Planar State

```
!cal planes                     — current planar phase panel
!cal planes on <date>           — planar state on a specific date
!cal planes upcoming [span]     — upcoming planar events
```

### Sending Plane Info to Players

```
!cal planes send low            — annual fixed canon events (Common Knowledge)
!cal planes send medium [range] — canon + generated short window: 1d, 3d, 6d, 10d (Skilled Forecast)
!cal planes send high [range]   — full canon + generated: 1m, 3m, 6m, 10m (Expert Forecast)
```

Examples: `!cal planes send medium 6d` · `!cal planes send high 3m`

### GM Plane Controls

```
!cal planes set <name> <phase> [days]     — manually set a plane's phase
!cal planes clear [<name>]               — clear manual override
!cal planes anchor <name> <phase> <date> — anchor canonical cycle to a date
!cal planes seed <name> <year|clear>     — set generation seed for a plane
!cal planes suppress <name> [date]       — suppress generated events for a plane
```

---

## Events

### Adding Events

```
!cal add <date> <name> [color]            — add a one-time event
!cal addmonthly <day> <name> [color]      — add a monthly recurring event
!cal addyearly <month> <day> <name> [color] — add a yearly recurring event
```

### Managing Events

```
!cal list                                 — list all events
!cal remove [list|key|series|name]        — remove an event
!cal restore [all] [exact] <name>         — restore a removed default event
!cal restore key <KEY>                    — restore by key
```

### Event Sources

```
!cal source list                          — list available event source packs
!cal source enable <name>                 — enable a source pack
!cal source disable <name>                — disable a source pack
!cal source up <name>                     — raise source priority
!cal source down <name>                   — lower source priority
```

---

## Knowledge Tiers

All subsystems use the same three-tier system:

| Tier | Label | What Players Know |
|---|---|---|
| `low` | Common Knowledge | Today only; rough guess for tomorrow |
| `medium` | Skilled Forecast | Several days; some uncertainty at range |
| `high` | Expert Forecast | Full precision for weeks/months |

Knowledge is **upgrade-only** — once revealed, it never downgrades. Players retain the best tier of knowledge they've been given for each date.

---

## Calendar Systems

Switch calendar systems via the Admin panel (`!cal` → ⚙ Admin):

- **Eberron** — 12 months × 28 days, YK era, 7-day weeks
- **Harptos** (Faerûn/Forgotten Realms) — 12 months × 30 days + festival days, DR era, tenday columns
- **Gregorian** — Standard Earth calendar

---

## Design Reference

For the full mechanical design, data tables, design decisions, and pending work, see **[DESIGN.md](DESIGN.md)**.
