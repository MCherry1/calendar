# Chat Commands

Most play should happen through the in-chat buttons. When typed syntax matters, the script whispers the relevant usage in Roll20. This file is the complete typed command reference for the current script.

## Date Input Rules

### Month Navigation for `!cal`, `!cal show`, and `!cal send`

Bare `!cal` opens the task-focused Today dashboard after setup completes. Once you add a range token, top-level `!cal` behaves like `!cal show` and `!cal send`: it renders a whole month or year, not a single-day card.

```text
!cal                      — current Today dashboard
!cal show month           — current month
!cal send month           — GM broadcast of the current month
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

These are used by commands such as `!cal set`, `!cal setup date use`, `!cal moon on`, `!cal moon full`, `!cal planes on`, `!cal planes anchor`, and one-time event creation.

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
!cal                           — compact Today dashboard after setup; GM onboarding entry point before setup
!cal show [range...]           — whisper a parsed calendar range
!cal send [range...]           — GM broadcast of a parsed calendar range
!cal now                       — compact current-date summary
!cal today                     — compact Today dashboard (GM controls, player knowledge-limited)
!cal forecast                  — player shortcut for !cal weather forecast
!cal list                      — list all calendar events
!cal help [root|calendar|themes|seasons|eventcolors]
!cal effects                   — GM active-effects panel
!cal time                      — GM time-of-day menu
!cal time start <bucket>       — GM activate a time bucket for the current date
!cal time next                 — GM advance one time bucket
!cal time clear                — GM clear the current time bucket
!cal set <dateSpec>            — GM set the current date
!cal advance [days]            — GM advance the date (default 1)
!cal retreat [days]            — GM move the date backward (default 1)
```

The Today dashboard and root help menu also expose `Prompt !cal ...` buttons for `set`, `send`, `add`, `addmonthly`, `addyearly`, `moon on`, and `planes on`. Those buttons submit the same typed commands listed here.

## Setup and Onboarding

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
!cal weather reveal <dateSpec>
```

`!cal weather send` broadcasts whatever weather knowledge the players already have. It does not take extra arguments.
`!cal weather reveal <dateSpec>` is the divination-style exact-date reveal. It uses the current weather location, generates intermediate days for continuity, and only exposes the chosen date or range to players. Exact-date reveals must target today or future dates.

### GM Weather Generation and Events

```text
!cal weather generate [1-20]
!cal weather reroll [serial]                 — today or future only, at the current location
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
!cal weather location recent <1-3>

!cal weather manifest
!cal weather manifest toggle <planeKey>
!cal weather manifest <planeKey>
!cal weather manifest none
!cal weather manifest clear

!cal weather location zone <planeKey|none>   — manifest-zone alias
```

Examples:

```text
!cal weather reveal 14-17
!cal weather reveal Rhaan 14
!cal weather reveal Hammer 5-7 1491
!cal weather location recent 1
```

## Moons

`!cal lunar` is an alias for `!cal moon`.

### Moon Views

```text
!cal moon
!cal moon lore [MoonName|siberys]
!cal moon info [MoonName|siberys]            — alias for lore
!cal moon sky [middle_of_night|early_morning|morning|afternoon|evening|nighttime]
!cal moon visible [time]                     — alias for sky
!cal moon up [time]                          — alias for sky
!cal moon view <MoonName> [dateSpec]
!cal moon cal <MoonName> [dateSpec]          — alias for view
!cal moon on <dateSpec>
!cal moon date <dateSpec>                    — alias for on
```

`!cal moon sky` also accepts legacy aliases such as `midnight`, `dawn`, `noon`, and `dusk`, but the script now resolves them into the six canonical time buckets.

### Sending Moon Info to Players

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
!cal planes send medium [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]
!cal planes send high [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]
```

Examples:

```text
!cal planes send medium 6d
!cal planes send high 3m
```

`!cal planes send ...` gives players an archived non-interactive summary and whispers the interactive control panel back to the GM.

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
