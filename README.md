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
- [Chat Commands](#chat-commands)
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

#### Eberron Moon Reference Inspirations
agent tasks: please also describe the source of the name of each of the moons as it's important.
and rewrite these to be more.. inspired. they should be more poetic, still short, but its about inspiration not factaul statements.
##### Zarantyr
**Reference body:** Luna (Earth). The Storm Moon uses the real Moon's mix of tidal importance, moderate eccentricity, and broad inclination sweep so the closest moon also feels like the most forceful and weather-shaping one.

##### Olarune
**Reference body:** Titan (Saturn). Titan's low-inclination, atmosphere-shrouded steadiness fits the Sentinel Moon: watchful, natural, and slightly hidden behind an amber haze.

##### Therendor
**Reference body:** Dione (Saturn). Dione was chosen to keep Therendor nearly co-planar with Barrakas, which supports their frequent eclipse relationship, while its bright icy surface reinforces the Healer's Moon as a calm, luminous presence.

##### Eyre
**Reference body:** Mimas (Saturn). Mimas provides the scarred-anvil inspiration: a bright icy moon dominated by a single enormous crater, which suits Eyre's forge-marked identity better than a darker but more eccentric analog.
agent task this is a stupid description. please rewrite this one: I could have chosen Io, the classic volcanic moon who's surface is constantly changign with lava flows. or prometheus, named for hte god who gave humanity fire. but instead we choose mimas. a lesser known moon named for a giant that was killed from a blow by the forge god hephatus' hammer. the biggest crater in the solar system (fact checl) crater inserrt name here dominates hxx% of thee surface of this moon. itwould be visible from he surface of a planet, much like the anvil of eyre is visible to those who look.

##### Dravago
**Reference body:** Triton (Neptune). Triton's retrograde orbit is the key inspiration here: Dravago keeps its distance from the other moons by literally moving against them, with frozen stillness and high reflectivity reinforcing Risia's influence.

##### Nymm
**Reference body:** Ganymede (Jupiter). Ganymede's regular, near-equatorial motion and singular magnetic-field identity make it a strong fit for the Crown as an orderly, sovereign moon.

##### Lharvion
**Reference body:** Hyperion (Saturn). Hyperion's chaotic tumble, cratered sponge-like surface, and high eccentricity make it the best inspiration for the Eye's unsettling, never-the-same-twice character.

##### Barrakas
**Reference body:** Enceladus (Saturn). Enceladus supplies the Lantern's defining trait outright: extreme brightness from highly reflective ice, plus a near-equatorial orbit that makes its light feel even and dependable. reflects more light than it receives

##### Rhaan
**Reference body:** Miranda (Uranus). Miranda's patchwork geology and towering cliff faces support the Book's stitched-together, story-laden feel, while its slightly unusual path keeps it from looking too orderly. rhaan is covered with ridges that look like scribbles. workl that in.

##### Sypheros
**Reference body:** Phobos (Mars). Phobos was chosen for its doomed inward spiral and dim, fear-tinged identity, making the Shadow feel like a moon already being consumed by entropy.

##### Aryth
**Reference body:** Iapetus (Saturn). Iapetus gives Aryth its two-tone gateway imagery and equatorial ridge, making it a literal threshold moon between light and darkness.

##### Vult
**Reference body:** Oberon (Uranus). Oberon's cratered outer-guard profile and disciplined, near-circular orbit fit the Warding Moon as a distant, defensive sentinel.

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

| Plane | Coterminous | Remote | Direct Weather Overlay |
| --- | --- | --- | --- |
| Daanvi | Civilization and ritual order may strengthen, but no obvious global effect is expected. | Century-long remote period with no obvious global effect. | None |
| Dal Quor | Not applicable in normal play. | Only reachable through dreaming; no natural manifest zones. | None |
| Dolurrh | Ghosts slip through more easily and resurrection becomes risky. | Traditional resurrection fails without retrieving the spirit. | None |
| Fernia | Extreme heat, empowered fire, and burning-bright conditions spread. | Intense heat loses more of its bite. | `+3` temperature / `-2` temperature |
| Irian | Life, fertility, and radiant vitality surge. | The world feels faded and healing is weaker. | `+1` temperature / none |
| Kythri | No stable global effect. | No stable global effect. | None |
| Lamannia | Natural and manifest-zone effects are enhanced. | Nature feels weaker and beast/elemental magic shortens. | `+1` precipitation / none |
| Mabar | Long Shadows and necrotic darkness intensify at night. | Necrotic influence recedes and undead are easier to turn. | `-1` temperature during coterminous nights / none |
| Risia | Extreme cold, empowered ice, and frozen stillness spread. | Intense cold loses more of its bite. | `-3` temperature / `+2` temperature |
| Shavarath | Anger, conflict, and war magic intensify. | Mostly suppresses Shavarath's own spike events. | None |
| Syrania | Goodwill spreads and the day's weather is forced clear and calm. | Skies turn gray and social friction rises. | wind `0`, precipitation `0` / `+1` precipitation |
| Thelanis | New gateways and fey crossings become easier. | Fey influence and manifest-zone effects are suppressed. | None |
| Xoriat | Not normally reachable through canonical cycles. | Remote madness has no known global weather effect. | None |

Syrania remains the strongest direct weather override in the model. Its **coterminous** state forces calm, clear conditions for the day, while **remote** Syrania adds precipitation pressure. Syranian manifest zones stay the lighter local modifier of `-1` wind and `-1` precipitation.

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

| Plane | Expected Events / Year | Cot / Remote Split | Duration | Dice / Trigger |
| --- | ---: | --- | --- | --- |
| Daanvi | ~16.8 | 50 / 50, with post-event alternation pressure | 10 days | `d20 (1)` then `d10` (`1-5` remote, `6-10` coterminous) |
| Dal Quor | 0 | None | None | Sealed; no generated events |
| Dolurrh | ~7.0 | Aryth full -> coterminous, Aryth new -> remote | 1 day | Aryth full/new plus `d20 (11-20)` |
| Fernia | ~3.4 | `d10` decides phase after selector hit | `d3` days | Linked pair: `d20 (20)` selects Fernia, then `d10 (10 cot / 1 remote)` |
| Irian | ~2.1 | 50 / 50 | `d3` days | `d4 (4)` + `d4 (4)` + `d20 (20 cot / 1 remote)` |
| Kythri | ~6.7 | Mostly coterminous | `d12` days | `d100 (100 cot / 1 remote)` |
| Lamannia | ~4.2 | Moon- and dice-driven | `d3` days | Olarune-qualified rolls plus fallback `d100` checks |
| Mabar | ~4.2 | 75% coterminous, 25% remote | 1 day | `d20 (1)` + `d4 (1)` |
| Risia | ~3.4 | `d10` decides phase after selector hit | `d3` days | Linked pair: `d20 (1)` selects Risia, then `d10 (10 cot / 1 remote)` |
| Shavarath | ~9.8 | 100% coterminous | 1 day | `d20 (14-20)` + `d12 (12)` |
| Syrania | ~0.21 | Mostly coterminous | 1 day | `d100 (100)` + `d4 (4)` + `d8 (8 cot / 1 remote)` |
| Thelanis | ~2.8 | Mostly coterminous | `3` or `7` days | `d20 (20)` + `d12 (12 cot / 1 remote)` |
| Xoriat | ~0.84 | 100% remote | `d20` days | `d100 (1)` + `d4 (1)` |

---

## Calendar Systems

Switch calendar systems via the Admin panel (`!cal` → ⚙ Admin):

- **Galifar** (Khorvaire/Eberron) — 12 months × 28 days, YK era, 7-day weeks.
- **Harptos** (Faerûn/Forgotten Realms) — 12 months × 30 days + intercalary festival days, DR era, tenday columns
- **Gregorian** (Earth) — 12 months x 28-31 days, CE era, 7-day weeks, leap years every 4th year except for years divisible by 100, except in turn for years also divisible by 400.

---
