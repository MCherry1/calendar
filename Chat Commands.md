# Chat Commands

Most play should happen through the in-chat buttons. When typed syntax matters, the script whispers the relevant usage in Roll20. This file is the complete typed command reference for the current script.

## Date Input Rules

### Month Navigation for `!cal`, `!cal show`, and `!cal send`

Top-level `!cal`, `!cal show`, and `!cal send` jumps are month-oriented. They render a whole month or year, not a single-day card.

```text
!cal                      — current month
!cal Zarantyr             — next occurrence of that month
!cal 1                    — next occurrence of month 1
!cal Zarantyr 998         — that month in a specific year
!cal 1 998                — that month in a specific year
!cal Rhaan 14            — the month containing the next Rhaan 14
!cal Rhaan 14 998        — the month containing that exact date
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

### Single-Date Specs

These are used by commands such as `!cal set`, `!cal moon on`, `!cal moon full`, `!cal planes on`, `!cal planes anchor`, and one-time event creation.

```text
14                — next occurrence of day 14
Rhaan 14          — next occurrence of Rhaan 14
9 14              — next occurrence of month 9, day 14
Rhaan 14 998      — exact date
9 14 998          — exact date
1st               — accepted where a day value is allowed
fourteenth        — accepted where a day value is allowed
```

### Recurring Event Day Specs

```text
6                 — fixed day
18-19             — range within the month
first Sul         — first weekday in the month
last Zor          — last weekday in the month
every Sul         — every matching weekday in the month
```

### Source Priority

- Priority `1` is the primary default-source event for a date and supplies the calendar cell color when multiple source-pack events land on the same day.
- Unranked sources (`—` in the UI) are tied for last.
- User-added events always outrank source-pack defaults.

## Core Calendar

```text
!cal                           — current month calendar
!cal show [range...]           — whisper a parsed calendar range
!cal send [range...]           — GM broadcast of a parsed calendar range
!cal now                       — compact current-date summary
!cal today                     — Today view (GM deep dive, player limited view)
!cal forecast                  — player shortcut for !cal weather forecast
!cal list                      — list all calendar events
!cal help [root|calendar|themes|seasons|eventcolors]
!cal effects                   — GM active-effects panel
!cal set <dateSpec>            — GM set the current date
!cal advance [days]            — GM advance the date (default 1)
!cal retreat [days]            — GM move the date backward (default 1)
```

## Settings and System Controls

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

!cal calendar                  — list calendar systems
!cal calendar <system> [variant]
!cal seasons                   — list season sets
!cal seasons <variant>
!cal hemisphere
!cal hemisphere (north|south)
!cal resetcalendar
```

## Weather

### Player Weather

```text
!cal weather
!cal weather forecast
```

### GM Weather Views and Forecast Control

```text
!cal weather
!cal weather today
!cal weather forecast [1-20]
!cal weather history
!cal weather mechanics
!cal weather send
!cal weather reveal (medium|high) [1-10]
```

`!cal weather send` broadcasts whatever weather knowledge the players already have. It does not take extra arguments.

### GM Weather Generation and Events

```text
!cal weather generate [days]
!cal weather reroll [serial]
!cal weather lock [serial]
!cal weather event trigger <key>
!cal weather event roll <key>
```

### Weather Location and Manifest Zones

```text
!cal weather location
!cal weather location climate <key>
!cal weather location geography <key>
!cal weather location terrain <key>

!cal weather manifest
!cal weather manifest toggle <planeKey>
!cal weather manifest <planeKey>
!cal weather manifest none
!cal weather manifest clear

!cal weather location zone <planeKey|none>   — manifest-zone alias
```

## Moons

`!cal lunar` is an alias for `!cal moon`.

### Moon Views

```text
!cal moon
!cal moon lore [MoonName|siberys]
!cal moon info [MoonName|siberys]            — alias for lore
!cal moon sky [midnight|dawn|noon|afternoon|dusk]
!cal moon visible [time]                     — alias for sky
!cal moon up [time]                          — alias for sky
!cal moon view <MoonName> [dateSpec]
!cal moon cal <MoonName> [dateSpec]          — alias for view
!cal moon on <dateSpec>
!cal moon date <dateSpec>                    — alias for on
```

### Sending Moon Info to Players

```text
!cal moon send low
!cal moon send medium [1w|1m|3m|6m|10m]
!cal moon send high [1w|1m|3m|6m|10m]
```

Examples:

```text
!cal moon send medium 3m
!cal moon send high 10m
```

### GM Moon Controls

```text
!cal moon seed <word>
!cal moon full <MoonName> <dateSpec>
!cal moon new <MoonName> <dateSpec>
!cal moon reset [MoonName]
```

Examples:

```text
!cal moon full Aryth 14
!cal moon new Zarantyr Rhaan 14
!cal moon full Therendor Rhaan 14 998
```

## Planes

`!cal planar` is an alias for `!cal planes`.

### Plane Views

```text
!cal planes
!cal planes on <dateSpec>
!cal planes date <dateSpec>                  — alias for on
```

### Sending Plane Info to Players

```text
!cal planes send low
!cal planes send medium [1d|3d|6d|10d]
!cal planes send high [1m|3m|6m|10m]
```

Examples:

```text
!cal planes send medium 6d
!cal planes send high 3m
```

### GM Plane Controls

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

## Events and Sources

### Event Commands

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
!cal addannual ...                           — alias for addyearly
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

### Event Source Commands

```text
!cal source list
!cal source enable <name>
!cal source disable <name>
!cal source up <name>
!cal source down <name>
```
