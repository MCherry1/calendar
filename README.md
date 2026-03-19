# Calendar — Roll20 API Script

A Roll20 API script for managing a fantasy campaign calendar with:
- graphical mini-calendar displayed in chat, with toggleable subsystems:
	- events tracking
	- moon phase tracking
	- location-based, generated weather, with mechanical effects (homebrew system)
	- planar movements (Eberron setting)

**Supports:** Eberron, Forgotten Realms, Greyhawk, Dragonlance, Exandria, Mystara, Birthright, Earth (Gregorian)

---

<details>
<summary><strong>Recommended In-Game Macros</strong></summary>

Create these as Roll20 macros for quick-bar access:

| Macro Name | Command | Notes |
| --- | --- | --- |
| Calendar | `!cal` | Opens the Today dashboard |
| Show Month | `!cal show month` | Current month view |
| Weather | `!cal weather` | Weather detail |
| Forecast | `!cal forecast` | Multi-day forecast |
| Moons | `!cal moon` | Moon detail |
| Planes | `!cal planes` | Planar status |
| Advance 1 | `!cal advance 1` | GM only — advance one day |
| Retreat 1 | `!cal retreat 1` | GM only — retreat one day |
| Send Month | `!cal send month` | GM only — broadcast month to all |
| Help | `!cal help` | Command reference |

**Tip:** Mark GM-only macros as token actions so they appear in your GM toolbar but not for players.

</details>

---
<a id="table-of-contents"></a>
## Table of Contents

- [Installation](#installation)
- [How to Use](#how-to-use)
- [Calendar Navigation](#calendar-navigation)
- [Knowledge Tiers](#knowledge-tiers)
- [Events](#events)
- [Moons](#moons)
- [Weather](#weather)
  - [Temperature](#temperature)
  - [Wind](#wind)
  - [Precipitation](#precipitation)
  - [Location](#location)
  - [Forecasting](#forecasting)
- [Time of Day](#time-of-day)
- [Planes](#planes)
- [Command Reference](#command-reference)
- [Development](#development)
- [Supported Settings](#supported-settings)

---

## Installation

<details open>
<summary>Show installation steps</summary>

1. In Roll20, open your campaign's **API Scripts** page (Game Settings → API Scripts).
2. Create a new script and paste in the contents of `calendar.js`.
3. Save. It initializes automatically on first load.

</details>

### GitHub-built paste artifact

GitHub Actions already typechecks, tests, and builds the script on every push to `main`, every pull request to `main`, and on manual `workflow_dispatch` runs.

Each successful run uploads a `calendar-js` artifact containing the built `calendar.js`. That means agents can keep working only in `src/` and related docs/tests while the generated Roll20 upload file stays out of git.

To get a paste-ready build from GitHub:

1. Open the repo's **Actions** tab
2. Open the latest successful `CI` run for the branch or commit you want
3. Download the `calendar-js` artifact
4. Unzip it and paste `calendar.js` into the Roll20 API Scripts editor

Artifact note: GitHub Action artifacts are temporary build outputs, not permanent release files. The workflow currently keeps them for 30 days.

### Local manual build

If you want to build locally instead of downloading from GitHub:

1. Install Node.js 22+
2. Run `npm ci`
3. Run `npm run check`
4. Run `npm run build`
5. Optional PowerShell smoke check: `powershell -ExecutionPolicy Bypass -File .\test\calendar_smoke.ps1`
6. Paste the generated `calendar.js` into Roll20

The old browser-extension launcher was removed because it depended on a workflow that no longer works reliably. The supported local path is now "build, optionally smoke-check, then paste."

### GitHub Releases for stable versions

This repo also has a separate release workflow for permanent downloads.

- CI artifacts are for normal day-to-day builds
- GitHub Releases are for stable versioned builds you may want to keep and come back to later

When you push a version tag like `v3.0.1`, GitHub Actions will:

1. Typecheck, test, and build the project again
2. Create a GitHub Release for that tag if one does not exist yet
3. Attach the built `calendar.js` file to that release as a downloadable asset

That means you do not need to commit `calendar.js` to git just to have a durable Roll20 upload file.

Typical release flow:

```bash
git tag v3.0.1
git push origin v3.0.1
```

Then open the repo's **Releases** page, download the attached `calendar.js`, and paste it into Roll20.

[Return to Table of Contents](#table-of-contents)

---

## How to Use

<details open>
<summary>Show the basic startup flow</summary>

On a brand-new campaign, only the GM sees the first-run prompt:
> Welcome to Calendar! It looks like this is the first time Calendar has been used in this game. Would you like to initialize it?

Choose `Yes` to run the onboarding wizard or `No` to dismiss it for now. The GM can always resume by typing `!cal`.

After setup is complete:
- `!cal` opens the compact Today dashboard
- `!cal help` opens the task-focused root help menu
- `!cal show month` and `!cal send month` open or share the full month grid

Players who use `!cal` before the GM finishes setup get a waiting message instead of setup or admin controls.

Setup prompts, help panels, and admin confirmations use Roll20's `noarchive` path so the chat archive stays focused on shared story-facing output.

</details>

[Return to Table of Contents](#table-of-contents)

---

## Calendar Navigation

<details>
<summary>Show navigation layout and button meanings</summary>

The default `!cal` and `!cal today` views open a compact Today panel instead of dropping straight into the full month stack.

The GM panel shows:
- Current date (bold), time of day and location (if active)
- One-line weather narrative (if weather is enabled)
- Nighttime lighting (if time of day is active and it's not daytime)
- Today's events/holidays
- Notable moon phases (ascendant, new, full)
- Notable planar states (coterminous, remote)
- Step buttons (⬅ / ➡), Send Today View to Players, and an Additional Options menu for subsystem detail views and admin

Players see the same informational sections (filtered by their knowledge tier) without step/admin controls.

Use `!cal show ...` or `!cal send ...` when you want the traditional month/year calendar render. The root help menu (`!cal help`) is also task-focused and includes prompt buttons for `!cal set`, `!cal add`, `!cal addmonthly`, `!cal addyearly`, `!cal moon on`, `!cal planes on`, and `!cal send`.

</details>

### Persistent Player Surfaces

- The script maintains four player-safe handouts automatically: `Calendar - Events`, `Calendar - Moons`, `Calendar - Weather`, and `Calendar - Planes`.
- Each handout shows the subsystem minical plus descriptive text, but no chat buttons or GM-only controls.
- The moon handout preserves exact lived-through lunar results for the most recent 60 in-world days, then falls back to the normal reveal-tier view for older past dates.
- The script can also keep a live Roll20 page updated for lunar display. Bind an existing page named `Moon Phase`, or bind any other existing page by name with the moon page commands below.
- Player movement to the live Moon page is explicit: the page redraws automatically when state changes, but players are only moved there when the GM uses `!cal moon page show`.

[Return to Table of Contents](#table-of-contents)

---
<a id="knowledge-tiers"></a>
## Knowledge Tiers: What do players know?

<details>
<summary>Show reveal tiers and default pacing</summary>

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

Recommended medium-tier DC ladder:

| System | DC 10 | DC 15 | DC 20 | DC 25 |
| --- | --- | --- | --- | --- |
| Weather | 1 day | 3 days | 6 days | 10 days |
| Moons | 1 month | 3 months | 6 months | 10 months |
| Planes | 1 month | 3 months | 6 months | 10 months |

Use that table as the default "skilled forecast" pacing for Survival, Nature, navigator's tools, almanacs, observatory records, or planar scholarship. The script's reveal buttons already line up with those windows even when your campaign fiction explains them differently.

`high` is the tier for magic, instruments, or institutions that justify precise knowledge rather than informed guesswork: divination, dragonmarked observatories, long-kept almanacs, planar charts, weather stations, or privileged archival access. Use it when the fiction supports exact timing inside the granted window.

For weather, `high` can also mean a **specific-date reveal**: the GM can reveal just the chosen future date or range at the current location without exposing all intervening days.

If you want custom reveal horizons beyond the preset buttons, widen them in Fibonacci-style steps instead of simple doubling: `1, 2, 3, 5, 8, 13`, then round into table-friendly units. In practice that means weather usually grows by days, while moons and planes grow by months.

</details>

[Return to Table of Contents](#table-of-contents)

---
## Events

<details>
<summary>Show event behavior and source notes</summary>

### General
- Individual cells within the minical are color-filled on the day of an event.
- For days with multiple events, small colored dots appear beneath the numbered date.
- Each cell can be hovered over with a mouse to show a tooltip containing the event information.
### Pre-Included
* All published holidays are pre-included in the script. Each is assigned a color.
* Every pre-included holiday can be individually toggled on or off.
* Additionally, holidays are grouped by Source, allowing for entire categories to be toggled on or off.
* Switching between calendar systems applies source compatibility through automatic source suppression, while GM manual source disables persist across calendar-system changes.
### GM Generated
- GMs can create their own events, which are then stored in state.
- There is no limit to the number of events created. They can be deleted as necessary.
- If no color is assigned at creation, a random color is assigned.

</details>

[Return to Table of Contents](#table-of-contents)

---
<a id="moons"></a>
## Moons: Modeling the Skies

<details>
<summary>Show moon-system modeling details</summary>

The script models the sky as a physical system rather than flavor-only text. Moon brightness, movement, nighttime lighting, and everything else all derive from explicit numbers. The goal is to create a constantly advancing game-world state that requires little GM intervention, and generates useful mechanics and information for D&D.

### Observer Model

- The model cares about **apparent sky geometry.**
- The script does **not** track latitude, longitude, or time zones.
- It does not make a declared cosmological stance. It does not worry about sidereal orbital periods, nor the motion of distant stars or constellations (for now). 
- Sky reports are intentionally local and practical: they answer "what do we see where we are?" instead of simulating a full global observatory model.
- Time is presented as broad play-facing buckets such as early hours, morning, afternoon, evening, and night.
- Inclination matters mainly for **where** a moon appears in the sky and **how often** it can line up for crossings or eclipses; it is not treated as a second weather engine.

In practice, the sky model is optimized for play-facing observables: phase, brightness, apparent motion, and dramatic alignments. It is meant to answer "what can the characters notice tonight?" rather than produce a full latitude-by-latitude astronomy simulator.
### Moons

Lunar calendars are classic, and mechanically relevant for nighttime lighting.

Moon phases are intentionally flexible as a narrative tool. GMs can anchor any moon to a full or new phase on a chosen date, and the script then continues forward using the moon's regular motion from that anchor.

| System | Moon | Synodic Period | Diameter | Distance | Inclination | Eccentricity | Albedo | Epoch Anchor |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Earth | Luna | 29.53 days | 2,159 mi | 238,855 mi | 5.14° | 0.0549 | 0.12 | 2021-01-28 (full moon) |
| Faerûn | Selûne | 30.44 days | 2,000 mi | 183,000 mi | 5.1° | 0.054 | 0.25 | 1372-01-01 (full at midnight Hammer 1, 1372 DR) |
| Eberron | 12 moons | Mixed | Mixed | Mixed | Mixed | Mixed | Mixed | 998-01-01 default seed anchor |

- **Faerûn tilt note:** Selûne's inclination is retained for consistent sky geometry and future-proofing, even in a one-moon system.

Setting-specific moon data (orbital parameters, lore, and cosmological features) is documented under each setting in [Supported Settings](#supported-settings).

</details>

[Return to Table of Contents](#table-of-contents)

---
## Weather

<details>
<summary>Show weather model, mechanics, and overlays</summary>

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

Weather is generated from your location profile, then stored and advanced sequentially. The climate/geography/terrain tables are deterministic, while the actual day rolls become stable once the forecast window is generated and remain so unless the GM rerolls, regenerates, or changes location.

The generation pipeline runs per-day:
1. **Baseline** — Climate, geography, and terrain set temperature, wind, and precipitation probabilities.
2. **Continuity** — Each day nudges toward the previous day's conditions, producing coherent weather evolution rather than random swings.
3. **Daily arc** — Early morning, morning, afternoon, evening, and late-night conditions are derived from a daily arc with some randomness. Early morning carries some of the previous night's feel forward while the new day takes shape.
4. **Fog** — Rolls separately, with persistence across days and interaction with wind.
5. **Overlays** — Manifest zone and planar modifiers apply last.

Current weather readouts also add a small annotation line whenever a manifest zone, planar state, or Zarantyr's full moon is actively modifying the day's weather.

**Player reveals** are upgrade-only. Once a tier of information is given, players retain it. See [Knowledge Tiers](#knowledge-tiers) for the shared reveal model used across subsystems.

GMs can regenerate the active forecast window, reroll today or future dates at the current location before revealing them, or lock a date's weather to prevent future changes.

GMs can also use `!cal weather reveal <dateSpec>` for divination-style weather reveals. These exact-date reveals must target today or future dates. The generator still rolls intermediate days for continuity, but the player-facing forecast only exposes the chosen date or range, shown on the same mini-calendar strip with blank cells for unrevealed days.

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

The location wizard keeps the **last three locations** as quick-switch buttons and supports **named saved presets** via `!cal weather location save <name>`. Saved presets appear before recent locations in the wizard. That makes it practical to jump to "mountains in six weeks," reveal a divined forecast there, and then jump back to the current region without rebuilding the location by hand.

### Manifest Zones

Manifest zones layer magical influences on top of the active location profile. They are not the same thing as planar coterminous/remote phases, but they can push weather in similar thematic directions.

- Manifest zones are managed **independently** from the location wizard once a location is set.
- **Multiple** manifest zones can be active at the same time.
- Changing the weather location clears all active manifest zones.
- Manifest zones affect **today's** local weather only; future forecast rows stay tied to the base location profile.

The available manifest zones and their effects are setting-dependent. For example, in Eberron, Fernia warms conditions, Risia cools them, and Syrania calms winds. See [Supported Settings](#supported-settings) for full details.

Clear manifest zones without changing the location when leaving the area.

Run `!cal weather manifest` in chat for the chooser, or use the weather panel's **Set Manifest Zone** button.

### Planar Effects

Planes can also alter weather while they are **coterminous** or **remote**. These are campaign-wide overlays rather than local manifest-zone effects. Current weather views annotate when a moon, plane, or manifest zone is actively influencing the weather. The specific planar weather overlays are setting-dependent — see [Supported Settings](#supported-settings) for the full table.

</details>

[Return to Table of Contents](#table-of-contents)

---
<a id="time-of-day"></a>
## Time of Day

<details>
<summary>Show time-of-day buckets and lighting</summary>

The time-of-day subsystem divides each day into six four-hour buckets:

| Bucket | Hours | Key |
| --- | --- | --- |
| Middle of the Night | 0:00–4:00 | `middle_of_night` |
| Early Morning | 4:00–8:00 | `early_morning` |
| Morning | 8:00–12:00 | `morning` |
| Afternoon | 12:00–16:00 | `afternoon` |
| Evening | 16:00–20:00 | `evening` |
| Nighttime | 20:00–24:00 | `nighttime` |

Activate time tracking with `!cal time start <bucket>` (default: `afternoon`). Once active, `!cal time next` advances to the next bucket, rolling the date forward when it wraps past nighttime.

Time of day affects:
- **Moon visibility** — `!cal moon sky` uses the active bucket to determine which moons are above the horizon.
- **Nighttime lighting** — The Today panel shows a lighting snapshot during non-daytime buckets, combining moonlight, ring light (Eberron), and starlight.
- **Weather period** — The weather narrative adjusts to match the active time bucket rather than always showing the afternoon primary.

Use `!cal time clear` to deactivate time tracking for the current date.

</details>

[Return to Table of Contents](#table-of-contents)

---
## Planes

<details>
<summary>Show planar alignment model and generated-event tables</summary>

The planar subsystem tracks Planes of Existence and their alignment cycles. In this system, a plane can be **coterminous**, **remote**, or **neither**. The specific planes, cycle structures, and generated-event profiles are setting-dependent — see [Supported Settings](#supported-settings) for details.

**Coterminous** planes strengthen their associated traits.

**Remote** planes suppress or invert those same traits.

### Sources

There are three types of planar events:

- **Traditional** — Canonical cycle structures from published setting material. Anchor dates for multi-year cycles can be GM-defined or auto-generated from the world seed.
- **GM Defined** — Force any plane coterminous, remote, or neither, for any duration desired.
- **Generated** — Non-traditional coterminous/remote events using plane-specific dice profiles and durations. Can be toggled on/off independently. Never override active canonical or GM-defined periods.

When a GM uses `!cal planes send ...`, players receive an archived non-interactive summary and the GM receives the full interactive panel back as a whisper.

Setting-specific plane lists, cycle structures, and generated-event profiles are in [Supported Settings](#supported-settings).

</details>

[Return to Table of Contents](#table-of-contents)

---

## Command Reference

<details>
<summary>Show the complete typed command reference</summary>

Most play should happen through the in-chat buttons. When typed syntax matters, the script whispers the relevant usage in Roll20. This section is the complete typed command reference for the current script.

### Date Input Rules

#### Month navigation for `!cal`, `!cal show`, and `!cal send`

Bare `!cal` opens the task-focused Today dashboard after setup completes. Once you add a range token, top-level `!cal` behaves like `!cal show` and `!cal send`: it renders a whole month or year, not a single-day card.

```text
!cal
!cal show month
!cal send month
!cal Zarantyr
!cal 1
!cal Zarantyr 998
!cal 1 998
!cal Rhaan 14
!cal Rhaan 14 998
!cal this month
!cal next month
!cal last month
!cal this year
!cal next year
!cal last year
```

Exact-date month jumps still work when you include a month:

```text
!cal Rhaan 14
!cal 9 14
!cal Rhaan 14 998
!cal 9 14 998
!cal first Sul of Aryth 998
```

Bare day-only inputs such as `!cal 14` or `!cal 1st` are rejected here; include a month.

#### Single-date specs

These are used by commands such as `!cal set`, `!cal setup date use`, `!cal moon on`, `!cal moon full`, `!cal planes on`, `!cal planes anchor`, and one-time event creation.

```text
14
Rhaan 14
9 14
Rhaan 14 998
9 14 998
1st
fourteenth
```

#### Recurring event day specs

```text
6
18-19
first Sul
last Zor
every Sul
```

#### Source priority

- Priority `1` is the primary default-source event for a date and supplies the calendar cell color when multiple source-pack events land on the same day.
- Unranked sources (`-` in the UI) are tied for last.
- User-added events always outrank source-pack defaults.

### Core Calendar

```text
!cal
!cal show [range...]
!cal send [range...]
!cal now
!cal today
!cal forecast
!cal list
!cal help [root|calendar|themes|seasons|eventcolors]
!cal effects
!cal time
!cal time start <bucket>
!cal time next
!cal time clear
!cal set <dateSpec>
!cal advance [days]
!cal retreat [days]
```

The Today dashboard and root help menu also expose `Prompt !cal ...` buttons for `set`, `send`, `add`, `addmonthly`, `addyearly`, `moon on`, and `planes on`. Those buttons submit the same typed commands listed here.

### Setup and Onboarding

Before setup is complete, GM `!cal` starts or resumes onboarding and players get a waiting message. Most setup should happen through the buttons, but these are the underlying typed commands:

```text
!cal setup
!cal setup start
!cal setup resume
!cal setup restart
!cal setup dismiss

!cal setup calendar <system>
!cal setup variant <variant>
!cal setup date default
!cal setup date use <dateSpec>
!cal setup season <variant>
!cal setup hemisphere (north|south)
!cal setup theme (default|<theme>)
!cal setup defaults (on|off)
!cal setup moons (on|off)
!cal setup weather (off|narrative|mechanics)
!cal setup weather climate <key>
!cal setup weather geography <key>
!cal setup weather terrain <key>
!cal setup weather recent <1-3>
!cal setup weather later
!cal setup planes (on|off)
!cal setup review
!cal setup apply
```

### Settings and System Controls

```text
!cal settings
!cal settings (group|labels|events|moons|weather|weathermechanics|wxmechanics|planes|offcycle|buttons) (on|off)
!cal settings density (compact|normal)
!cal settings mode (moon|lunar|weather|planes|plane|planar) (calendar|list|both)
!cal settings verbosity (normal|minimal)
!cal settings weatherdays (1-20)

!cal theme list
!cal theme <name>
!cal theme reset

!cal calendar
!cal calendar <system> [variant]
!cal seasons
!cal seasons <variant>
!cal hemisphere
!cal hemisphere (north|south)
!cal resetcalendar
```

### Weather Commands

#### Player weather

```text
!cal weather
!cal weather forecast
```

#### GM weather views and forecast control

```text
!cal weather
!cal weather today
!cal weather forecast [1-20]
!cal weather history
!cal weather mechanics
!cal weather send
!cal weather reveal (medium|high) [1-10]
!cal weather reveal <dateSpec>
```

`!cal weather send` broadcasts whatever weather knowledge the players already have. It does not take extra arguments.

`!cal weather reveal <dateSpec>` is the divination-style exact-date reveal. It uses the current weather location, generates intermediate days for continuity, and only exposes the chosen date or range to players. Exact-date reveals must target today or future dates.

#### GM weather generation and events

```text
!cal weather generate [1-20]
!cal weather reroll [serial]
!cal weather lock [serial]
!cal weather reseed
!cal weather reset
!cal weather event trigger <key>
!cal weather event roll <key>
```

`!cal weather reseed` clears the entire forecast and history, then regenerates from scratch. `!cal weather reset` clears all weather state.

#### Weather location and manifest zones

```text
!cal weather location
!cal weather location climate <key>
!cal weather location geography <key>
!cal weather location terrain <key>
!cal weather location recent <1-3>
!cal weather location save <name>
!cal weather location preset <1-N>

!cal weather manifest
!cal weather manifest toggle <planeKey>
!cal weather manifest <planeKey>
!cal weather manifest none
!cal weather manifest clear

!cal weather location zone <planeKey|none>
```

Examples:

```text
!cal weather reveal 14-17
!cal weather reveal Rhaan 14
!cal weather reveal Hammer 5-7 1491
!cal weather location recent 1
```

### Moon Commands

`!cal lunar` is an alias for `!cal moon`.

#### Moon views

```text
!cal moon
!cal moon lore [MoonName|siberys]
!cal moon info [MoonName|siberys]
!cal moon sky [middle_of_night|early_morning|morning|afternoon|evening|nighttime]
!cal moon visible [time]
!cal moon up [time]
!cal moon view <MoonName> [dateSpec]
!cal moon cal <MoonName> [dateSpec]
!cal moon on <dateSpec>
!cal moon date <dateSpec>
```

`!cal moon sky` also accepts the old convenience aliases `midnight`, `dawn`, `noon`, and `dusk`, but the script resolves them into the six canonical time buckets.

#### Sending moon info to players

```text
!cal moon send low
!cal moon send medium [1w|1m|3m|6m|10m|Nd|Nw]
!cal moon send high [1w|1m|3m|6m|10m|Nd|Nw]
```

Examples:

```text
!cal moon send medium 3m
!cal moon send high 10m
```

#### GM moon controls

```text
!cal moon seed <word>
!cal moon full <MoonName> <dateSpec>
!cal moon new <MoonName> <dateSpec>
!cal moon reset [MoonName]
!cal moon page bind <page name>
!cal moon page refresh
!cal moon page show
```

Examples:

```text
!cal moon full Aryth 14
!cal moon new Zarantyr Rhaan 14
!cal moon full Therendor Rhaan 14 998
```

`!cal moon page bind <page name>` only binds to an existing Roll20 page. Once bound, the script redraws that page automatically on date and moon-state changes, and `!cal moon page show` moves the shared player bookmark there explicitly.

### Plane Commands

`!cal planar` is an alias for `!cal planes`.

#### Plane views

```text
!cal planes
!cal planes on <dateSpec>
!cal planes date <dateSpec>
```

#### Sending plane info to players

```text
!cal planes send low
!cal planes send medium [1m|3m|6m|10m|Nd|Nw]
!cal planes send high [1m|3m|6m|10m|Nd|Nw]
```

Examples:

```text
!cal planes send medium 6d
!cal planes send high 3m
```

`!cal planes send ...` gives players an archived non-interactive summary and whispers the interactive control panel back to the GM.

#### GM plane controls

```text
!cal planes set <PlaneName> <phase> [days]
!cal planes clear [PlaneName]
!cal planes anchor <PlaneName> <phase> <dateSpec>
!cal planes seed <PlaneName> <year|clear>
!cal planes suppress <PlaneName> [dateSpec]
```

Examples:

```text
!cal planes anchor Fernia coterminous Lharvion 1 996
!cal planes suppress Syrania
!cal planes suppress Dolurrh Aryth 12 998
```

### Event and Source Commands

#### Event commands

`!cal events` is the grouped interface. The direct shortcuts below call the same logic.

```text
!cal events list
!cal events add <dateSpec> <name> [#COLOR|color]
!cal events remove [list|key <KEY>|series <KEY>|<name fragment>]
!cal events restore [all] [exact] <name...>
!cal events restore key <KEY>

!cal add <dateSpec> <name> [#COLOR|color]
!cal remove [list|key <KEY>|series <KEY>|<name fragment>]
!cal restore [all] [exact] <name...>
!cal restore key <KEY>
!cal addmonthly <daySpec> <name> [#COLOR|color]
!cal addyearly <Month> <DD|DD-DD|ordinal-day> <name> [#COLOR|color]
!cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> <name> [#COLOR|color]
!cal addannual ...
```

Examples:

```text
!cal add 14 Market Day
!cal add Rhaan 14 Boldrei's Feast gold
!cal add Rhaan 14 998 Mourning Bell #6D4C41
!cal addmonthly first Sul Guild Meeting
!cal addyearly Aryth 13 Wildnight
!cal addyearly last Sul of Vult Harvest Supper
```

#### Event source commands

```text
!cal source list
!cal source enable <name>
!cal source disable <name>
!cal source up <name>
!cal source down <name>
```

</details>

[Return to Table of Contents](#table-of-contents)

---

## Development

<details>
<summary>Show project structure and build instructions</summary>

The source code lives in `src/` as TypeScript modules. A build step bundles them into the single `calendar.js` file that Roll20 consumes.

### Prerequisites

- Node.js 22+
- `npm ci` to install dev dependencies

### Commands

| Command | Description |
| --- | --- |
| `npm run build` | Bundle `src/` into `calendar.js` via esbuild |
| `npm test` | Run all tests via `node --test` with tsx |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run check` | Typecheck + test in one step |

### Project structure

```
src/
  config.ts         — User-editable configuration constants
  constants.ts      — Calendar systems, themes, palettes
  date-math.ts      — Serial date math, leap years
  color.ts          — Color utilities
  state.ts          — Roll20 state management
  parsing.ts        — Date parsing, fuzzy matching
  events.ts         — Event model, occurrences, ranges
  rendering.ts      — HTML rendering, mini-calendars
  ui.ts             — GM menus, theme/season UI
  commands.ts       — Command routing
  today.ts          — Combined today view
  weather.ts        — Weather system
  moon.ts           — Moon phases, eclipses, lighting
  planes.ts         — Planar cycles, effects
  messaging.ts      — Chat messaging utilities
  boot.ts           — Initialization, public API
  index.ts          — Entry point for bundler
  types/roll20.d.ts — Roll20 global type declarations
test/
  calendar_smoke.ps1 — PowerShell smoke checks against the built bundle
  *.test.ts         — Tests organized by module
```

### Workflow

1. Edit TypeScript source in `src/`
2. Run `npm run check`
3. Run `npm run build` to regenerate `calendar.js`
4. Optional bundle smoke check: `powershell -ExecutionPolicy Bypass -File .\test\calendar_smoke.ps1`
5. Commit source changes (the built `calendar.js` remains gitignored)

CI runs typecheck, tests, build, and the PowerShell smoke check on every PR and uploads the built `calendar.js` as a downloadable GitHub Actions artifact. Tagged releases rebuild the script and attach `calendar.js` as a permanent release asset. The repo no longer ships a browser-sync launcher; the supported paths are GitHub artifact/release download or manual local build plus paste.

</details>

[Return to Table of Contents](#table-of-contents)

---

## Supported Settings

Switch settings via the setup wizard (`!cal setup`) or Admin panel (`!cal` → Admin).

<details>
<summary><strong>Eberron</strong></summary>

- **Calendar:** Galifar Calendar — 12 months × 28 days (336-day year), 7-day week (Sul–Sar), YK era
- **Variants:** Galifar (standard), Druidic, Halfling, Dwarven month names
- **Moons:** 12 moons, one per month, each tied to a plane and Dragonmark. Synodic periods range from 27 to 102 days. Full system with eclipses, conjunctions, and Long Shadows.
- **Weather:** Full location-based weather with temperature, wind, precipitation, and D&D 5e mechanics
- **Planes:** 13 transitive/outer planes with coterminous/remote cycles, manifest zones, and timed overrides
- **Events:** Sharn, Khorvaire, Sovereign Host, Dark Six, Silver Flame, and Stormreach event packs

#### Cosmology

Eberron is modeled as Earth-like for baseline astronomical geometry (including axial tilt assumptions for daylight-length variation across the year). **Temperature is not driven by axial/solar-season physics** — seasonal weather pressure is handled through the planar/weather system instead. Axial tilt mostly shows up as broad seasonal daylight framing: longer summer days, shorter winter days, and corresponding shifts in the coarse time-of-day buckets.

#### Ring of Siberys

- Single equatorial ring at **0° inclination**
- Uses **Saturn's rings** as the physical analog, scaled to fit inside Zarantyr's orbit
- Extends roughly **370 to 3,480 miles (600 to 5,600 km)** above the surface
- **Albedo 0.50**, tuned to preserve the setting goal that the ring is visibly bright even by day
- Contributes about **0.008 lux** of nighttime illumination, forming most of the ~0.010 lux ambient clear-night baseline with starlight
- The outer edge sits about **2,300 km / 1,430 mi inside Zarantyr's mean orbit**, so the Ring never overlaps the nearest moon's track

#### Moons of Eberron

The Eberron implementation uses fixed synodic periods on a 336-day year scaffold. Exact full/new peaks only move when an external force does so deliberately: festival nudges, canonical associated-plane windows, Long Shadows gobbling, GM anchors, or the Therendor/Barrakas anti-phase coupling.

`Full` means at least `98.004%` illumination; `New` means at most `1.996%` illumination.

| Moon | Title | Plane | Dragonmark | Synodic Period | Apparent Size | Albedo |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Zarantyr | The Storm Moon | Kythri | Mark of Storm | 27.32 days | 9.08x | 0.12 |
| Olarune | The Sentinel Moon | Lamannia | Mark of Sentinel | 30.81 days | 5.73x | 0.22 |
| Therendor | The Healer's Moon | Syrania | Mark of Healing | 34.74 days | 2.91x | 0.99 |
| Eyre | The Anvil | Fernia | Mark of Making | 39.17 days | 2.38x | 0.96 |
| Dravago | The Herder's Moon | Risia | Mark of Handling | 44.16 days | 2.66x | 0.76 |
| Nymm | The Crown | Daanvi | Mark of Hospitality | 49.80 days | 0.98x | 0.43 |
| Lharvion | The Eye | Xoriat | Mark of Detection | 56.15 days | 1.11x | 0.30 |
| Barrakas | The Lantern | Irian | Mark of Finding | 63.31 days | 1.07x | 1.375 |
| Rhaan | The Book | Thelanis | Mark of Scribing | 71.39 days | 0.49x | 0.32 |
| Sypheros | The Shadow | Mabar | Mark of Shadow | 80.50 days | 0.62x | 0.071 |
| Aryth | The Gateway | Dolurrh | Mark of Passage | 90.76 days | 0.69x | 0.275 |
| Vult | The Warding Moon | Shavarath | Mark of Warding | 102.34 days | 0.74x | 0.23 |

Apparent size is relative to Earth's Moon (Luna). Each moon borrows orbital-shape values from a selected real-world reference body chosen for behavioral fit with its in-setting story.

#### Planar Weather Effects

| Plane | Coterminous | Remote | Weather Overlay |
| --- | --- | --- | --- |
| Daanvi | Order strengthens | Century-long remote | None |
| Dal Quor | N/A | Only reachable through dreaming | None |
| Dolurrh | Ghosts slip through | Resurrection fails without retrieval | None |
| Fernia | Extreme heat, empowered fire | Heat loses its bite | `+3` / `-2` temp |
| Irian | Radiant vitality surges | World feels faded | `+1` temp / none |
| Kythri | No stable global effect | No stable global effect | None |
| Lamannia | Nature enhanced | Nature weakened | `+1` precip / none |
| Mabar | Necrotic darkness at night | Undead easier to turn | `-1` temp (nights) / none |
| Risia | Extreme cold, frozen stillness | Cold loses its bite | `-3` / `+2` temp |
| Shavarath | War magic intensifies | Suppresses own events | None |
| Syrania | Clear, calm weather forced | Gray skies, friction | wind/precip `0` / `+1` precip |
| Thelanis | Fey crossings easier | Fey influence suppressed | None |
| Xoriat | Not normally reachable | No weather effect | None |

#### Manifest Zones

- **Fernia** — warming conditions
- **Risia** — cooling conditions
- **Lamannia** — increased precipitation pressure
- **Syrania** — milder, less storm-prone skies
- **Kythri** — chaotic weather swings

#### Generated Planar Events

Traditional cycles use the structure from *Exploring Eberron*. Generated events use these dice profiles:

| Plane | Events/Year | Cot/Remote Split | Duration | Dice/Trigger |
| --- | ---: | --- | --- | --- |
| Daanvi | ~16.8 | 50/50 with alternation pressure | 10 days | `d20 (1)` then `d10` |
| Dal Quor | 0 | Sealed | None | No generated events |
| Dolurrh | ~7.0 | Aryth full→cot, new→remote | 1 day | Aryth phase + `d20 (11-20)` |
| Fernia | ~3.4 | `d10` decides | `d3` days | Linked: `d20 (20)` then `d10` |
| Irian | ~2.1 | 50/50 | `d3` days | `d4 (4)` + `d4 (4)` + `d20` |
| Kythri | ~6.7 | Mostly cot | `d12` days | `d100 (100 cot / 1 remote)` |
| Lamannia | ~4.2 | Moon/dice-driven | `d3` days | Olarune-qualified + `d100` |
| Mabar | ~4.2 | 75% cot | 1 day | `d20 (1)` + `d4 (1)` |
| Risia | ~3.4 | `d10` decides | `d3` days | Linked: `d20 (1)` then `d10` |
| Shavarath | ~9.8 | 100% cot | 1 day | `d20 (14-20)` + `d12 (12)` |
| Syrania | ~0.21 | Mostly cot | 1 day | `d100 (100)` + `d4 (4)` + `d8` |
| Thelanis | ~2.8 | Mostly cot | 3 or 7 days | `d20 (20)` + `d12` |
| Xoriat | ~0.84 | 100% remote | `d20` days | `d100 (1)` + `d4 (1)` |

</details>

<details>
<summary><strong>Forgotten Realms</strong></summary>

- **Calendar:** Harptos Calendar — 12 months × 30 days + 5 intercalary festival days (365/366-day year), 10-day tendays, DR era
- **Moons:** Selune — 30.4375-day cycle aligned to the Harptos 4-year leap cycle
- **Weather:** Full weather system
- **Intercalary days:** Midwinter, Greengrass, Midsummer, Shieldmeet (leap years), Highharvestide, Feast of the Moon — rendered as festival strips between months

</details>

<details>
<summary><strong>Greyhawk</strong></summary>

- **Calendar:** Dozenmonth of Luna — 12 months × 28 days + 4 intercalary festival weeks of 7 days (364-day year), 7-day week (Starday–Freeday), CY era
- **Moons:** Luna (28-day cycle, aligned to months) and Celene the Handmaiden (91-day cycle)
- **Weather:** Full weather system
- **Events:** Needfest, Growfest, Richfest, and Brewfest festival weeks
- **Intercalary rendering:** Festival weeks render as their own week blocks in the calendar grid

</details>

<details>
<summary><strong>Dragonlance</strong></summary>

- **Calendar:** Krynnish Calendar — 12 months × 28 days (336-day year), 7-day week (Linaras–Bracha), PC era
- **Moons:** Three moons governing magic on Krynn:
  - Solinari (36-day cycle) — Silver Moon, Good magic, White Robes
  - Lunitari (28-day cycle) — Red Moon, Neutral magic, Red Robes
  - Nuitari (8-day cycle) — Black Moon, Evil magic, Black Robes (hidden from players by default)
- **Weather:** Full weather system
- **Events:** Yule, Spring Dawning, Midsummer, Harvest Home
- **Setup:** Night of the Eye anchor configuration (seed-derived or manual)

</details>

<details>
<summary><strong>Exandria</strong> (Critical Role)</summary>

- **Calendar:** Exandrian Calendar — 11 months of 28–32 days (328-day year), 7-day week (Miresen–Da'leysen), PD era
- **Moons:**
  - Catha (base 29-day cycle with seeded drift) — The Guiding Light, associated with Sehanine the Moonweaver
  - Ruidus (base 164-day cycle with triangular drift) — The Bloody Eye, appears full when visible, visible only during a 14-day window per cycle
- **Weather:** Full weather system
- **Events:** New Dawn, Hillsgold, Day of Challenging, Harvest's Close, Zenith, The Crystalheart

</details>

<details>
<summary><strong>Mystara</strong> (BECMI / Known World)</summary>

- **Calendar:** Thyatian Calendar — 12 months × 28 days (336-day year), 7-day week (Lunadain–Loshdain), AC era
- **Moons:**
  - Matera (28-day cycle) — The Visible Moon, governs tides
  - Patera (32-day cycle) — The Invisible Moon, home of the Ee'aar (hidden from players by default)
- **Weather:** Full weather system
- **Events:** New Year, equinoxes, and solstices

</details>

<details>
<summary><strong>Birthright</strong></summary>

- **Calendar:** Cerilian Calendar — 12 months × 32 days + 4 intercalary festival days (388-day year), 8-day week (Firlen–Achlen), MA era
- **Moons:** Aelies (32-day cycle) — The Silver Moon of Aebrynis, cycle matches the month length
- **Weather:** Full weather system
- **Events:** Erntenir (Harvest Festival), Haelynir (Day of the Sun), Midsummer, Midwinter

</details>

<details>
<summary><strong>Earth (Gregorian)</strong></summary>

- **Calendar:** Gregorian Calendar — 12 months × 28–31 days (365/366-day year), 7-day week (Sunday–Saturday), CE era
- **Leap years:** Every 4th year, except centuries, except centuries divisible by 400
- **Moons:** Luna — 29.53-day synodic period
- **Weather:** Full weather system
- **Events:** Astronomical solstices and equinoxes

</details>

[Return to Table of Contents](#table-of-contents)

---
