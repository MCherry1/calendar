# Calendar — Roll20 API Script

A Roll20 API script for managing a fantasy campaign calendar with:
- graphical mini-calendar displayed in chat, with toggleable subsystems:
	- events tracking
	- moon phase tracking
	- location-based, generated weather, with mechanical effects (homebrew system)
	- planar movements (Eberron setting)

**Supports:** Eberron, Forgotten Realms, Earth (Gregorian)

---

## Installation

1. In Roll20, open your campaign's **API Scripts** page (Game Settings → API Scripts).
2. Create a new script and paste in the contents of `calendar.js`.
3. Save. It initializes automatically on first load.

---

## Quick Start

Startup message should appear in game:
> Galifar Calendar Initialized
> Current Date: 

In the chat window:
`!cal`

Add a macro for even easier use.

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
	- Insert Luna parameters here. Include anchor date for correct phase.
- **Faerun**
	- Insert Selune parameters here. Include anchor date for correct phase.
- **Eberron**
	- Eberron's moons are vastly more important to the setting, more complex, and less-defined.
	- Each moon has a canon color, approximate diameter, and mean orbital distance.
	- Moons are intended as a flexible narrative tool, so their phases are adjustable as needed.
	- Each moon was matched with a real-world moon from our own Solar System to 
---
## Weather
- Included is a homebrew system for managing the weather.
- This system can be toggled on or off as desired.
### Temperature

| Temperature | °F Approx. | Mechanical Effect |
| :---------: | :--------: | :---------------: |
|     -5      |            |                   |
|     -4      | [-45..-34] |                   |
|     -3      |            |                   |
|     -2      |            |                   |
|     -1      |            |                   |
|      0      |  [-5..4]   |                   |
|      1      |   5 — 14   |                   |

### Location

---
## Planes

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
