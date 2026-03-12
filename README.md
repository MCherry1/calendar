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

The spacing shown below is intentional and should be preserved in Roll20 chat output for readability.
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
## Knowledge Tiers: What do players know?

The best thing about calendars is the organization. The second best thing is sharing.

All subsystems use the same three-tier system:

| Tier | Label | What Players Know |
| --- | --- | --- |
| `low` | Common Knowledge | Usually today only, with rough short-range guidance |
| `medium` | Skilled Forecast | Several days, with increasing uncertainty at range |
| `high` | Expert Forecast | Precise information across a longer horizon |

`low` is the baseline tier and never requires an explicit reveal.

Knowledge is **upgrade-only** — once revealed, it never downgrades. Players retain the best tier of knowledge they've been given for each date within each system.

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
## Moons: Modeling the Skies

The script models the sky as a physical system rather than flavor-only text. Moon brightness, movement, nighttime lighting, and everything else all derive from explicit numbers. The goal is to create a constantly advancing game-world state that requires little GM intervention, and generates useful mechanics and information for D&D.

### Observer Model

- The model cares about **apparent sky geometry.**
- The script does **not** track latitude, longitude, or time zones.
- It does not make a declared cosmological stance. It does not worry about sidereal orbital periods, nor the motion of distant stars or constellations (for now). 
- Sky reports are intentionally local and practical: they answer "what do we see where we are?" instead of simulating a full global observatory model.
- Time is presented as broad play-facing buckets such as early hours, morning, afternoon, evening, and night.
### Moons

Lunar calendars are classic, and mechanically relevant for nighttime lighting.

Moon phases are intentionally flexible as a narrative tool. GMs can anchor any moon to a full or new phase on a chosen date, and the script then continues forward using the moon's regular motion from that anchor.

| System | Moon | Synodic Period | Diameter | Distance | Inclination | Eccentricity | Albedo | Epoch Anchor |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Earth | Luna | 29.53 days | 2,159 mi | 238,855 mi | 5.14° | 0.0549 | 0.12 | 2021-01-28 (full moon) |
| Faerûn | Selûne | 30.44 days | 2,000 mi | 183,000 mi | 5.1° | 0.054 | 0.25 | 1372-01-01 (full at midnight Hammer 1, 1372 DR) |
| Eberron | 12 moons (see below) | Mixed | Mixed | Mixed | Mixed | Mixed | Mixed | 998-01-01 default seed anchor |

- **Faerûn tilt note:** Selûne's inclination is retained for consistent sky geometry and future-proofing, even in a one-moon system.
- **Eberron approach:** Each moon keeps canonical flavor (name/color/role) while borrowing orbital-shape values from selected real-world reference moons.

### Eberron-Specific Cosmology

Eberron is modeled as Earth-like for baseline astronomical geometry (including axial tilt assumptions for daylight-length variation across the year). In this script, however, **temperature is not driven by axial/solar-season physics**. Seasonal weather pressure is handled through the campaign's planar/weather system instead.

### Ring of Siberys

- Single equatorial ring at **0° inclination**
- Uses **Saturn's rings** as the physical analog, scaled to fit inside Zarantyr's orbit
- Extends roughly **370 to 3,480 miles (600 to 5,600 km)** above the surface
- **Albedo 0.50**, chosen from a Saturn-ring-inspired analog and tuned to preserve the setting goal that the ring is visibly bright even by day
- Contributes about **0.008 lux** of nighttime illumination by itself, forming most of the script's ~0.010 lux ambient clear-night baseline with starlight
- Serves as a constant visual feature of the sky, distinct from the moving moons and planar effects
### Moons of Eberron

The Eberron implementation uses integer-multiple synodic periods on a 336-day year scaffold to keep moon cycles readable in play while preserving distinct rhythms.

| Eberron Moon | Title             | Plane     | Dragonmark          | Synodic Period (days) | Approx. Diameter (mi) | Mean Distance (mi) |    Inclination (°) | Eccentricity | Albedo |
| ------------ | ----------------- | --------- | ------------------- | --------------------: | --------------------: | -----------------: | -----------------: | -----------: | -----: |
| Zarantyr     | The Storm Moon    | Kythri    | Mark of Storm       |                 27.32 |                  1250 |             14,300 |              5.145 |       0.0549 |   0.12 |
| Olarune      | The Sentinel Moon | Lamannia  | Mark of Sentinel    |                  34.0 |                  1000 |             18,000 |               0.33 |       0.0288 |   0.22 |
| Therendor    | The Healer's Moon | Syrania   | Mark of Healing     |                  24.0 |                  1100 |             39,000 |               0.47 |       0.0094 |   0.67 |
| Eyre         | The Anvil         | Fernia    | Mark of Making      |                  21.0 |                  1200 |             52,000 |               0.43 |       0.1230 |   0.30 |
| Dravago      | The Herder's Moon | Risia     | Mark of Handling    |                  42.0 |                  2000 |             77,500 |               1.09 |       0.0001 |  1.229 |
| Nymm         | The Crown         | Daanvi    | Mark of Hospitality |                  28.0 |                   900 |             95,000 |               0.20 |       0.0013 |   0.43 |
| Lharvion     | The Eye           | Xoriat    | Mark of Detection   |                  30.0 |                  1350 |            125,000 |               7.23 |       0.7507 |  0.155 |
| Barrakas     | The Lantern       | Irian     | Mark of Finding     |                  22.0 |                  1500 |            144,000 |               0.02 |       0.0047 |  1.375 |
| Rhaan        | The Book          | Thelanis  | Mark of Scribing    |                  37.0 |                   800 |            168,000 |               4.34 |       0.0013 |   0.32 |
| Sypheros     | The Shadow        | Mabar     | Mark of Shadow      |                  67.0 |                  1100 |            183,000 | 175.3 (retrograde) |       0.1635 |   0.06 |
| Aryth        | The Gateway       | Dolurrh   | Mark of Passage     |                  48.0 |                  1300 |            195,000 |               7.57 |       0.0283 |   0.05 |
| Vult         | The Warding Moon  | Shavarath | Mark of Warding     |                  56.0 |                  1800 |            252,000 |               0.07 |       0.0014 |   0.23 |

#### Reference Mapping (Eberron → Solar System Analogs)
agent task: this information is in the table above already. change this section into one with many subheaders for each of hte eberron moons. provide inforamation on the refernce moon chosen, and the inspiration for it.

| Eberron Moon | Reference Analog | Host Planet | Inclination (°) | Eccentricity | Albedo | Notes                                                                                             |
| ------------ | ---------------- | ----------- | --------------: | -----------: | -----: | ------------------------------------------------------------------------------------------------- |
| Zarantyr     | Luna             | Earth       |           5.145 |       0.0549 |   0.12 | Luna As the closest moon and the one that has the greatest effect on the tides, Luna is a perfect |
| Olarune      | Titan            | Saturn      |            0.33 |       0.0288 |   0.22 | Stable low-inclination sentinel profile                                                           |
| Therendor    | Dione            | Saturn      |            0.03 |       0.0022 |   0.99 | Selected to stay near Barrakas' plane                                                             |
| Eyre         | Mimas            | Saturn      |            1.53 |       0.0196 |   0.96 | Final choice after Hyperion and Elara variants                                                    |
| Dravago      | Triton           | Neptune     |           156.8 |     0.000016 |   0.76 | Retrograde behavior supports lore distance-from-others feel                                       |
| Nymm         | Ganymede         | Jupiter     |            0.20 |       0.0013 |   0.43 | Even, regular profile                                                                             |
| Lharvion     | Hyperion         | Saturn      |            0.43 |       0.1230 |   0.30 | Keeps the intentionally chaotic eccentric feel                                                    |
| Barrakas     | Enceladus ×1     | Saturn      |            0.02 |       0.0047 |  1.375 | Bright-default lantern; optional brighter ×7 variant remains available                            |
| Rhaan        | Miranda          | Uranus      |            4.34 |       0.0013 |   0.32 | Moderate inclination, low eccentricity                                                            |
| Sypheros     | Phobos           | Mars        |            1.08 |       0.0151 |  0.071 | Entropy-forward dim profile                                                                       |
| Aryth        | Iapetus          | Saturn      |            7.57 |       0.0283 |  0.275 | Averaged albedo for non-tidally-locked presentation                                               |
| Vult         | Oberon           | Uranus      |            0.07 |       0.0014 |   0.23 | Low-inclination warding profile                                                                   |

---
## Weather

Weather tables in D&D suck. This one sucks a little less.

- The weather subsystem can be toggled on or off as desired.
- The mechanical weather effects can also be toggled on or off independently, leaving only narrative weather.

Use **Admin → Settings → Weather Mech** or `!cal settings weathermechanics (on|off)` to hide/show the D&D rules text without disabling narrative weather or forecast generation. A dedicated **Weather Mech** settings button is available in the settings panel.

- [Temperature](#temperature)
- [Wind](#wind)
- [Precipitation](#precipitation)
- [Location](#location)
- [Forecasting](#forecasting)
agent task: move the forecasting section here, above the mechanics section.
### Mechanics

The following tables are homebrewed. They use common D&D mechanics, sometimes repurposed, sometimes expanded.
#### Temperature

The live generator maps directly on the `-5` to `15` band scale shown below.

- **Temperature saves:** At the GM's discretion, creatures must make Constitution saves, suffering levels of exhaustion on failure.
	- It is recommended to require rolls for each day (or hour, if following the DMG) of travel, each Short or Long Rest, any periods of outdoor activity, and for each combat.
- **Cold-weather clothing:** Light, medium, and heavy cold-weather clothing map to normal armor proficiencies. If a character is not proficient in the clothing they are wearing, they suffer those penalties.
- **Armor as heat burden:** At the hot end of the scale, wearing armor becomes progressively more punishing.
- **Resistance and immunity:** Cold or fire resistance grants advantage on the save. Immunity succeeds automatically.

| Temperature |  °F Approx.  | Mechanical Effect                                   |
| :---------: | :----------: | :-------------------------------------------------- |
|     −5      |   ≤ −46°F    | DC 30; disadv. without heavy cold-weather clothing  |
|     −4      | [−45 .. −36] | DC 25; disadv. without heavy cold-weather clothing  |
|     −3      | [−35 .. −26] | DC 25; disadv. without heavy cold-weather clothing  |
|     −2      | [−25 .. −16] | DC 20; disadv. without medium cold-weather clothing |
|     −1      | [−15 .. −6]  | DC 20; disadv. without medium cold-weather clothing |
|      0      |  [−5 .. 4]   | DC 15; disadv. without light cold-weather clothing  |
|      1      |  [5 .. 14]   | DC 15; disadv. without light cold-weather clothing  |
|      2      |  [15 .. 24]  | DC 10. Precipitation shifts to snow.                |
|      3      |  [25 .. 34]  | DC 10. Precipitation shifts to ice.                 |
|      4      |  [35 .. 44]  | Precipitation shifts to rain.                       |
|      5      |  [45 .. 54]  |                                                     |
|      6      |  [55 .. 64]  |                                                     |
|      7      |  [65 .. 74]  |                                                     |
|      8      |  [75 .. 84]  |                                                     |
|      9      |  [85 .. 94]  |                                                     |
|     10      | [95 .. 104]  | DC 10                                               |
|     11      | [105 .. 114] | DC 15; heavy armor at disadv.                       |
|     12      | [115 .. 124] | DC 20; medium and heavy armor at disadv.            |
|     13      | [125 .. 134] | DC 25; all armor at disadv.                         |
|     14      | [135 .. 144] | DC 25; all armor at disadv.                         |
|     15      |   ≥ 145°F    | DC 30; all armor at disadv.                         |
### Wind

All effects are cumulative

| Wind |  Label   | Mechanical Effect                                                                                                                                                         |
| :--: | :------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|  0   |   Calm   | None                                                                                                                                                                      |
|  1   |  Breezy  | None                                                                                                                                                                      |
|  2   | Moderate | Fogs and airborne gases dispersed                                                                                                                                         |
|  3   |  Strong  | Open flames extinguished<br>Disadv. on ranged attacks<br>Long-range attacks auto-miss<br>Flying costs +1 ft per ft                                                        |
|  4   |   Gale   | Ranged attacks auto-miss<br>Nonmagical flying req. DC 15 Str save or flying speed becomes 0<br>The air is difficult terrain (+2 ft. per ft)<br>Walking costs +1 ft per ft |
|  5   |  Storm   | All creatures DC 15 Str save or fall prone<br>Small trees uprooted, objects become projectiles (DC 10 Dex Save, 2d6 Bludgeoning Damage)<br>Severe Hazard Potential        |

### Precipitation

| Precip | Sky / Condition      | Notes                                  |
| :----: | :------------------- | :------------------------------------- |
|   0    | Clear                | None                                   |
|   1    | Partly Cloudy        | Light atmospheric moisture             |
|   2    | Overcast             | Darker daytime conditions              |
|   3    | Active Precipitation | Rain, snow, or sleet                   |
|   4    | Heavy Precipitation  | Heavy rain, heavy snow, or ice storm   |
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

- Manifest zones are managed **independently** from the location wizard once a location is set.
- **Multiple** manifest zones can be active at the same time.
- Changing the weather location clears all active manifest zones.
- Manifest zones affect **today's** local weather only; future forecast rows stay tied to the base location profile.

Typical examples include:
- **Fernia** warming conditions
- **Risia** cooling conditions
- **Lamannia** increasing precipitation pressure
- **Syrania** making skies milder and less storm-prone
- **Kythri** adding chaotic swings

Clear manifest zones without changing the location when leaving the area.

Run `!cal weather manifest` in chat for the chooser, or use the weather panel's **Set Manifest Zone** button.

### Planar Effects

Planes can also alter weather while they are **coterminous** or **remote**. These are campaign-wide overlays rather than local manifest-zone effects. Current weather views annotate when a moon, plane, or manifest zone is actively influencing the weather.


agent task include a table here with an entry for each plane and listingthe effects while coterminous or remote.
=======
=======
=======
Current Syrania behavior in the model is:
- **Coterminous Syrania:** forces calm, clear conditions for the day (wind and precipitation collapse to calm/none).
- **Remote Syrania:** increases precipitation pressure (`+1` precipitation tier).
- **Syrania manifest zones:** remain the lighter local modifier (`-1` wind, `-1` precipitation), independent from planar phase.

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

The planar subsystem is Eberron-specific and tracks the Planes of Existence. These 13 planes exist alongside the Material Plane where Eberron sits, influencing it in many ways. One of those ways is through alignments. In this system, a Plane of Existence can be **coterminous**, **remote**, or **neither**.

**Coterminous** planes strengthen their associated traits.

**Remote** planes suppress or invert those same traits.

### Sources

There are three types of events in this system:
#### Traditional
- Use the cycle structure published in *Exploring Eberron*.
- **Anchor dates** for the multi-year cycles are needed where canon leaves them unspecified.
	- GMs can provide their own anchor date for each plane, setting the traditional cycle of the planes to suit their campaign.
	- In the absence of a GM-defined anchor, the script generates it's own anchor date from the world seed. (This seed is used throughout the script. Using the same seed in different API sandboxes or campaigns will always generate the same world state.)
#### GM Defined
- **GM controls** can force any plane **coterminous**, **remote**, or **neither** (*off*), regardless of pre-existing schedules, for any duration desired.

#### Generated
- **Generated** events add non-traditional coterminous/remote events using plane-specific dice profiles and durations.
- Generated events can be toggled on or off independent of the rest of the system.
- The script prevents generated events from overriding active canonical or GM-defined planar periods.
- agent task: insert table here for each plane, including total events per year, cot/rem split, length of events, and dice rolls used to generate.

---

## Calendar Systems

Switch calendar systems via the Admin panel (`!cal` → ⚙ Admin):

- **Galifar** (Khorvaire/Eberron) — 12 months × 28 days, YK era, 7-day weeks.
- **Harptos** (Faerûn/Forgotten Realms) — 12 months × 30 days + intercalary festival days, DR era, tenday columns
- **Gregorian** (Earth) — 12 months x 28-31 days, CE era, 7-day weeks, leap years every 4th year except for years divisible by 100, except in turn for years also divisible by 400.
- agent task make sure gregorian leap years are treated as described above
---
## Commands

agent task this entire commands section is really unneeded. the script should be whispering to the user whenever they're needed. break this out into it's own markdown document called Chat Commands.md. That one shoudl include every command available in the script. you'll need to scrape the whole script for all the commands.


> In normal play, nearly all interaction happens through the in-chat buttons. When typed syntax matters, the script whispers the correct format in game.

## Calendar Dates

agent task: this specific table below is really weird. it doesn't function well at all. is this supposed to be set date? what in the world does !cal day do? You need to check on this and write a new file this is not intended function at all. We should only be jumping to:
- next instance months in the form of mm or named month
- specific months in the form of mm yyyy or named month yyyy
```
!cal <day>                — jump to next instance of that day number
!cal <month> <day>        — jump to next instance of specific month and day
!cal <month> <day> <year> — jump to exact date
!cal Olarune              — jump to the next Olarune (month name works as a shortcut)
```
## Weather
### Viewing Weather

```
!cal weather                    — today's weather
!cal weather forecast [n]       — n-day forecast (default 10)
!cal weather history            — recent past weather
!cal weather mechanics          — D&D mechanical effects for today's conditions
```

`!cal weather forecast [n]` accepts any integer from `1` to `20`.
`!cal weather mechanics` reflects the current **Weather Mech** setting; if mechanics are off, narrative weather still remains active.
### Setting Your Location

```
!cal weather location                          — open location wizard
!cal weather location climate <key>            — set climate (arctic, temperate, tropical, etc.)
!cal weather location geography <key>          — set geography (coastal, mountain, plains, etc.)
!cal weather location terrain <key>            — set terrain (forest, city, open, etc.)
!cal weather manifest [key|none]               — open/toggle manifest zones independently of location
!cal weather location zone <key|none>          — alias for manifest-zone control
```

### Generating Weather

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
!cal moon view [moonName]       — single-moon mini-calendar (phase-colored cells)
!cal moon sky [time]            — sky visibility at a time of day (dawn/noon/dusk/midnight)
!cal moon lore [moonName]       — lore for a specific moon
```

#### Single-Moon Calendar

`!cal moon view <moonName>` shows a dedicated mini-calendar for one moon. Each cell is color-filled by phase intensity (gold for full, dark for new) with a phase emoji and percentage in the tooltip. A colored header bar displays the moon's name and title. Navigate months with the Prev/Next buttons.

Full and new moons can span multiple days when the moon's synodic period is long enough that illumination stays above 98% or below 2% for more than one day.

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
agent task: dates above should be written in correct format, or a hint shoudlbe included here for dd, mm dd, mm dd yyyy etc.

---

## Planes

### Viewing Planar State

```
!cal planes                     — current planar phase panel
!cal planes on <date>           — planar states on a specific date
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
agent task: describe the date formatting when dd, mm dd, mm dd yyyy etc.
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
agent task describe how the priroity statuys is ussed.

---

