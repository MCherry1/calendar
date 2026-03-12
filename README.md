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
- [Knowledge Tiers](#knowledge-tiers)
- [Moons](#moons)
- [Modeling the Skies](#modeling-the-skies)
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
- [Calendar Systems](#calendar-systems)
- [Design Reference](#design-reference)

---

## Installation

1. In Roll20, open your campaign's **API Scripts** page (Game Settings → API Scripts).
2. Create a new script and paste in the contents of `calendar.js`.
3. Save. It initializes automatically on first load.

---

## How to Use

Startup message appears in chat when the script initializes:
> Galifar Calendar Initialized
> Current Date: Sul, 1 Zarantyr, 998 YK

In the chat window, type:
`!cal`
> [!info]*Tip: Add a macro for even easier use.*

---

## Calendar Navigation

The main `!cal` view shows a mini-calendar for the current month, along with several buttons that execute additional script commands.
### GM Buttons
```
⏮ Back  |  ⏭ Forward
📣 Send

📋 Today
🌤 Weather
🌙 Moons
🌀 Planes

⚙ Admin
```
### Player Buttons
```
◀ Prev  |  Next ▶

📋 Today
🌤 Weather
🌙 Moons
🌀 Planes
```

- **Previous / Next** — see adjacent months
- **Send** — sends the current calendar view to players in public chat
- **Today** — summary for the current in-game date
- **Weather/Moons/Planes** — For players, shows known forecast on dedicated minical. For GMs, includes subsystem management
- **Admin** — change displays, settings, and everything else related to the script
---
## Knowledge Tiers

The calendar is most useful when it can share information selectively. Players get practical information; GMs keep the deeper state and the hidden levers.

All subsystems use the same three-tier system:

| Tier | Label | What Players Know |
| --- | --- | --- |
| `low` | Common Knowledge | Usually today only, with rough short-range guidance |
| `medium` | Skilled Forecast | Several days, with increasing uncertainty at range |
| `high` | Expert Forecast | Precise information across a longer horizon |

`low` is the baseline tier and often does not require an explicit reveal.

Knowledge is **upgrade-only** — once revealed, it never downgrades. Players retain the best tier of knowledge they've been given for each date.

GMs can decide how much to reveal, and under what circumstances. The script provides built-in reveal windows, but those can just as easily represent a skill check, divination magic, an almanac, an observatory, or campaign-specific research.

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
	- Selûne: synodic period 30.44 days, diameter 2,000 mi, distance 183,000 mi, inclination 5.1°, eccentricity 0.054, albedo 0.25. Epoch anchor: 1372-01-01 (full at midnight Hammer 1, 1372 DR).
- **Eberron**
	- Eberron's moons are vastly more important to the setting, more complex, and less defined by canon than a typical fantasy moon.
	- Each moon has a canonical color, approximate diameter, and mean orbital distance.
	- Moons are intended as a flexible narrative tool, so their phases are adjustable as needed.
	- Each moon is matched to a real Solar System moon to model its inclination, eccentricity, and albedo — providing consistent, astronomy-inspired orbital behavior without requiring custom parameter invention. The reference moon's values are used as-is, with one exception: Barrakas applies an albedo multiplier for supernatural brightness (its association with Irian, the plane of life and light).
	- See [DESIGN.md §7.4](DESIGN.md) for the full reference mapping table.

---
## Modeling the Skies

The script models the sky as a physical system rather than flavor-only text. Moon brightness, movement, nighttime lighting, and everything else all derive from explicit numbers. The goal is to create a constantly advancing game-world state that requires little GM intervention.

This script uses astronomy-inspired proxies so the moons, eclipses, and night lighting behave intuitively over long campaigns.
The model cares about **apparent sky geometry**, not a declared cosmological stance. It makes no assumption about whether Arrah or Eberron is the center of the system or whether the distant stars move.
- Real-world reference bodies are used where that makes the invented sky more coherent, but the end result is still tuned for Eberron's lore rather than strict solar-system simulation.

### Observer Model

- The script does **not** track latitude, longitude, or time zones.
- Sky reports are intentionally local and practical: they answer "what do we see where we are?" instead of simulating a full global observatory model.
- Time is presented as broad play-facing buckets such as early hours, morning, afternoon, evening, and night.

### Eberron


### Ring of Siberys

- Single equatorial ring at **0° inclination**
- Uses **Saturn's rings** as the physical analog, scaled to fit inside Zarantyr's orbit
- Extends roughly **370 to 3,480 miles (600 to 5,600 km)** above the surface
- **Albedo 0.50**, bright enough to stand out even in daylight
- Contributes about **0.008 lux** of nighttime illumination by itself, forming most of the script's ~0.010 lux ambient clear-night baseline with starlight
- Serves as a constant visual feature of the sky, distinct from the moving moons and planar effects

---
## Weather
- The weather subsystem can be toggled on or off as desired.
- The mechanical weather effects can also be toggled on or off independently, leaving narrative weather active if desired.
- It is a homebrew forecasting system designed for campaign play: deterministic, location-based, and readable in chat.

Use **Admin → Settings → Weather Mech** or `!cal settings weathermechanics (on|off)` to hide/show the D&D rules text without disabling narrative weather or forecast generation.

### Weather TOC

- [Temperature](#temperature)
- [Wind](#wind)
- [Precipitation](#precipitation)
- [Location](#location)
- [Forecasting](#forecasting)

### Temperature
The live generator rolls directly on the `-5` to `15` band scale shown below.

- **Temperature saves:** At the GM's discretion, creatures make Constitution saves during severe travel, exposed rests, prolonged outdoor activity, or combat in dangerous weather.
- **Cold-weather clothing:** Light, medium, and heavy cold-weather clothing use normal armor-proficiency rules.
- **Armor as heat burden:** At the hot end of the scale, armor becomes progressively more punishing.
- **Resistance and immunity:** Cold or fire resistance grants adv. on the relevant save; immunity succeeds automatically.
- **Cadence:** Daily checks are usually the smoothest table experience. Hourly checks are harsher and slower, but can fit survival-focused play.

| Temperature |  °F Approx.  | Mechanical Effect                                                            |
| :---------: | :----------: | :--------------------------------------------------------------------------- |
|     −5      |   ≤ −46°F    | DC 30 Con save; disadv. without heavy cold-weather clothing                  |
|     −4      | [−45 .. −36] | DC 25 Con save; disadv. without heavy cold-weather clothing                  |
|     −3      | [−35 .. −26] | DC 25 Con save; disadv. without heavy cold-weather clothing                  |
|     −2      | [−25 .. −16] | DC 20 Con save; disadv. without medium cold-weather clothing                 |
|     −1      | [−15 .. −6]  | DC 20 Con save; disadv. without medium cold-weather clothing                 |
|      0      |  [−5 .. 4]   | DC 15 Con save; disadv. without light cold-weather clothing                  |
|      1      |  [5 .. 14]   | DC 15 Con save; disadv. without light cold-weather clothing                  |
|      2      |  [15 .. 24]  | DC 10 Con save                                                                |
|      3      |  [25 .. 34]  | DC 10 Con save                                                                |
|      4      |  [35 .. 44]  | No thermal save                                                               |
|      5      |  [45 .. 54]  | No thermal save                                                               |
|      6      |  [55 .. 64]  | No thermal save                                                               |
|      7      |  [65 .. 74]  | DC 10 Con save                                                                |
|      8      |  [75 .. 84]  | DC 10 Con save                                                                |
|      9      |  [85 .. 94]  | DC 15 Con save; heavy armor at disadv.                                       |
|     10      | [95 .. 104]  | DC 15 Con save; heavy armor at disadv.                                       |
|     11      | [105 .. 114] | DC 20 Con save; medium and heavy armor at disadv.                            |
|     12      | [115 .. 124] | DC 20 Con save; medium and heavy armor at disadv.                            |
|     13      | [125 .. 134] | DC 25 Con save; light, medium, and heavy armor at disadv.                    |
|     14      | [135 .. 144] | DC 25 Con save; light, medium, and heavy armor at disadv.                    |
|     15      |   ≥ 145°F    | DC 30 Con save; light, medium, and heavy armor at disadv.                    |
### Wind

| Wind |  Label   | Mechanical Effect                                                                                                                                                        |
| :--: | :------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  0   |   Calm   | None                                                                                                                                                                     |
|  1   |  Breezy  | None                                                                                                                                                                     |
|  2   | Moderate | Fogs and airborne gases dispersed                                                                                                                                        |
|  3   |  Strong  | Disadv. on ranged attacks; long-range attacks auto-miss; flying costs +1 ft per ft; open flames extinguished                                                           |
|  4   |   Gale   | Includes all Strong effects; ranged attacks auto-miss; nonmagical flying requires DC 10 Str save or flying speed becomes 0; the air is difficult terrain; walking costs +1 ft per ft |
|  5   |  Storm   | DC 15 Strength save or fall prone; small trees uprooted; severe hazard                                                                                                   |

### Precipitation

| Precip | Sky / Condition      | Notes |
| :----: | :------------------- | :---- |
|   0    | Clear                | None |
|   1    | Partly Cloudy        | Light atmospheric moisture |
|   2    | Overcast             | Darker daytime conditions |
|   3    | Active Precipitation | Rain, snow, or sleet — type determined by temperature |
|   4    | Heavy Precipitation  | Heavy rain, heavy snow, or ice storm |
|   5    | Extreme / Deluge     | Blizzard or deluge-class precipitation |

### Location

Weather is generated for a specific location profile. Set the profile with `!cal weather location`, or use the in-game location wizard. Three settings combine to determine weather baselines:

| Setting       | Key Examples                         | Effect                                                   |
| ------------- | ------------------------------------ | -------------------------------------------------------- |
| **Climate**   | arctic, temperate, tropical, arid, … | Sets overall temperature baseline and seasonal variation |
| **Geography** | coastal, plains, hills, mountain, …  | Modifies temperature and precipitation patterns          |
| **Terrain**   | forest, city, open, swamp, …         | Fine-tunes local conditions; affects fog frequency       |

### Manifest Zones

Manifest zones layer magical influences on top of the active location profile. They are not the same thing as planar coterminous/remote phases, but they can push weather in similar thematic directions.

Typical examples include:
- **Fernia** warming conditions
- **Risia** cooling conditions
- **Lamannia** increasing precipitation pressure
- **Syrania** making skies milder and less storm-prone
- **Kythri** adding chaotic swings

Clear the manifest zone without changing the location when leaving the area.

Run `!cal weather location` in chat for the full list of valid keys and the interactive wizard.

### Planar Overlays

Planes can also alter weather while they are **coterminous** or **remote**. These are campaign-wide overlays rather than local manifest-zone effects. The Today and forecast views annotate when a moon, plane, or manifest zone is actively influencing the weather.

### Forecasting

Weather is generated deterministically from your location profile and a seed word. The same location and seed always produce the same weather — useful for planning retroactively or maintaining consistency if you revisit a date. 

The generation pipeline runs per-day:
1. **Baseline** — Climate, geography, and terrain set temperature, wind, and precipitation probabilities.
2. **Continuity** — Each day nudges toward the previous day's conditions, producing coherent weather evolution rather than random swings.
3. **Daily arc** — Morning, afternoon, and evening conditions are derived from a daily arc with some randomness. You get three snapshots per day, not one.
4. **Fog** — Rolls separately, with persistence across days and interaction with wind.
5. **Overlays** — Manifest zone and planar modifiers apply last.

Current weather readouts also add a small annotation line whenever a manifest zone, planar state, or Zarantyr's full moon is actively modifying the day's weather.

**Player reveals** are upgrade-only. Once a tier of information is given, players retain it. See [Knowledge Tiers](#knowledge-tiers) for the shared reveal model used across subsystems.

GMs can extend the forecast window ahead, reroll individual dates before revealing them, or lock a date's weather to prevent future changes.

---
## Planes

The planar subsystem is an Eberron-specific layer that tracks when planes move closer to or farther from the Material Plane.

- **Coterminous** planes strengthen their associated traits.
- **Remote** planes suppress or invert those same traits.
- **Canonical cycles** use the published cycle structure from *Exploring Eberron*.
- **Anchor dates** are campaign-defined where canon leaves them unspecified; the script supports both seeded timing and direct GM overrides.
- **GM controls** can force a plane's current phase, clear overrides, anchor a cycle phase to a specific date, or pin the seed-derived anchor year for an individual plane.
- **Generated anomalies** add deterministic off-cycle coterminous/remote events using plane-specific dice profiles and durations.
- **Isolation rules** prevent generated anomalies from overriding active canonical or GM-defined planar periods.
- **Toggles** let the GM disable off-cycle/generated events entirely.

---

## Calendar Systems

Switch calendar systems via the Admin panel (`!cal` → ⚙ Admin):

- **Eberron** — 12 months × 28 days, YK era, 7-day weeks
- **Harptos** (Faerûn/Forgotten Realms) — 12 months × 30 days + festival days, DR era, tenday columns
- **Gregorian** — Standard Earth calendar
---
## Commands

> This section is included for completeness. In normal play, most interaction happens through the chat buttons generated by `!cal`. When typed syntax matters, the script whispers the correct format in game.

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

`!cal weather forecast [n]` accepts any integer from `1` to `20`.
`!cal weather mechanics` reflects the current **Weather Mech** setting; if mechanics are off, narrative weather still remains active.

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
!cal weather send               — send whatever forecast information is already revealed to players
!cal weather reveal medium [n]  — reveal and send a skilled forecast for 1-10 days
!cal weather reveal high [n]    — reveal and send an expert forecast for 1-10 days
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
## Design Reference

For deeper mechanics, data tables, and implementation notes, see [DESIGN.md](DESIGN.md). For the active backlog, see [AGENT TASKS.md](AGENT%20TASKS.md).
