# Additional Calendars for Implementation

## Purpose

This repo currently implements only three calendar families:

- Eberron / Galifar
- Toril / Harptos (labeled `faerunian`)
- Earth / Gregorian

This document does not propose code changes. It is a research and planning file for additional world support, built around what the current script already models in `src/config.ts`, `src/constants.ts`, and `src/moon.ts`.

## What The Script Currently Captures

### Calendar system shape

The current calendar engine is richer than "month names plus weekdays". A world/calendar implementation can currently express:

- `label`
- `description`
- `weekdays`
- optional `weekdayAbbr`
- `monthDays`
- optional `structure`
- `defaultSeason`
- `defaultVariant`
- `variants[variantKey].label`
- `variants[variantKey].monthNames`
- `variants[variantKey].colorTheme`

Related supporting systems already exist for:

- era labels via `CONFIG_ERA_LABEL`
- starting date via `CONFIG_START_DATE`
- season models via `SEASON_SETS`
- intercalary / festival / leap slots via `CALENDAR_STRUCTURE_SETS`

### Moon system shape

The current moon engine can already store:

- system `id`
- optional world `name`
- optional world `description`
- per-moon `name`
- per-moon `title`
- per-moon `color`
- optional `associatedMonth`
- optional setting tags like `referenceMoon`, `plane`, `dragonmark`, `deity`, `loreNote`
- physical/orbital values:
  - `synodicPeriod`
  - `diameter`
  - `distance`
  - `inclination`
  - `eccentricity`
  - `albedo`
- behavior/seed values:
  - `variation`
  - `epochSeed`
  - optional `nodePrecession`

### Important engine implications

- The engine already supports non-7-day weeks. Harptos proves 10-day weeks are fine.
- The engine already supports intercalary festival slots and leap-only slots.
- Hemisphere-aware seasons already exist.
- The moon engine currently assumes more normal waxing/waning behavior than some settings use. Hidden moons, always-full moons, or visibility-only moons may need either approximation or a later engine extension.

## Existing Coverage

| World | Calendar | Moon support | Notes |
| --- | --- | --- | --- |
| Eberron | 12 x 28 Galifar | 12 moons, fully modeled | Deepest implementation in repo |
| Toril | Harptos | Selune | Intercalary festivals and Shieldmeet already supported |
| Earth | Gregorian | Luna | Real-world baseline |

## Recommended Backlog At A Glance

| Priority | World | Calendar readiness | Moon readiness | Fit with current engine | Main caution |
| --- | --- | --- | --- | --- | --- |
| High | Greyhawk / Oerth | Strong | Strong enough | Excellent | Need physical moon placeholders or second-pass astronomy tuning |
| High | Dragonlance / Krynn | Strong, but split canon | Strong | Good | Canon disagreement on year length |
| High | Exandria | Strong | Strong | Good | Ruidus behaves unlike a normal moon |
| High | Mystara | Strong | Medium-strong | Excellent | Patera is normally hidden |
| High | Birthright / Aebrynis | Strong | Strong enough | Excellent | Moon name is not obvious in readily available sources |
| Medium | Dark Sun / Athas | Medium | Medium-strong | Good | Much of the practical calendar is community-standard rather than cleanly canonical |
| Low | Ravenloft / Barovia | Weak | Weak | Fair | Canon is sparse and fan sources disagree |
| Low | Nentir Vale / Nerath | Weak | Weak | Fair | Readily available calendar data looks largely fan-invented |

## Not Separate Calendar Targets

These settings should not be treated as independent calendar implementations unless you want very specific regional flavor layers later:

- Kara-Tur, Al-Qadim, and Maztica all live on Toril, so they can ride the existing Harptos family.
- Spelljammer is a travel/meta-setting, not one planetary calendar.
- Planescape is a multiversal framework, not one world calendar.
- Hollow World and Red Steel are better treated as Mystara extensions.

## Refactor Analysis

### Short answer

Implementing one or two additional "well-behaved" worlds does not require a large refactor.

Implementing a broad library of D&D settings probably does.

The current codebase is partly data-driven already, but it is not yet fully world-agnostic. It scales well for:

- new month-name variants
- new weekday sets
- new month-length sets
- new intercalary/festival structures
- normal moon systems

It scales less well for:

- worlds with unusual moon visibility rules
- worlds with different date-writing conventions
- worlds with world-specific subsystem coupling
- a future where many settings all coexist cleanly instead of piggybacking on Eberron/Toril/Earth assumptions

### Why I think that

The good news:

- `CALENDAR_SYSTEMS`, `SEASON_SETS`, `CALENDAR_STRUCTURE_SETS`, and `MOON_SYSTEMS` are real registries already.
- `applyCalendarSystem()` in `src/state.ts` does most of the right data-driven rebuilding work.
- the date engine already handles leap/intercalary slots and non-7-day weeks.

The limiting factor:

- a lot of behavior still branches directly on `calendarSystem === 'eberron'`, `calendarSystem === 'faerunian'`, or `calendarSystem === 'gregorian'`.

That pattern appears in at least these places:

- `src/date-math.ts`
- `src/rendering.ts`
- `src/ui.ts`
- `src/setup.ts`
- `src/state.ts`
- `src/weather.ts`
- `src/moon.ts`
- `src/planes.ts`

### What is data-driven already

These parts are in pretty good shape:

- calendar definitions in `src/config.ts`
- season and structure tables in `src/constants.ts`
- moon registries in `src/moon.ts`
- source auto-scoping in `DEFAULT_EVENT_SOURCE_CALENDARS`

That means these settings could be added with only modest architecture work:

- Greyhawk
- Mystara
- Birthright

All three mostly fit the current model of:

- fixed week model
- defined month list
- defined festival slots
- normal-ish moon cycle data

### What is hard-coded enough to become a maintenance problem

#### 1. Calendar behavior is only partly declarative

Right now some calendar rules live in data, but some still live in direct checks like:

- Faerunian weekday logic in `src/date-math.ts`
- Harptos-specific festival rendering in `src/rendering.ts`
- Harptos/Gregorian-specific date formatting in `src/rendering.ts` and `src/ui.ts`
- Gregorian leap-day special-casing in multiple modules

That is fine for 3 calendars. It gets noisier once you add Greyhawk festival weeks, Birthright 8-day weeks, Exandria's day-specific seasonal transitions, and Dragonlance variants.

#### 2. Capabilities are inferred from world names

The current setup/state flow assumes:

- Eberron gets planes
- non-Eberron worlds do not
- moon auto-toggle behavior is tied to `eberron`

That logic lives in `src/setup.ts` and `src/state.ts`.

For a larger setting library, this should be declarative metadata such as:

- `supportsMoons`
- `supportsPlanes`
- `defaultMoonsEnabled`
- `defaultPlanesEnabled`
- `defaultWeatherProfile`

#### 3. The moon engine contains both generic and world-specific logic

`src/moon.ts` is doing several jobs at once:

- generic moon phase/orbit handling
- moon lore text
- Eberron-specific sky objects like the Ring of Siberys
- Eberron-specific tide/weather hooks around Zarantyr
- planar generated event logic

That is workable today, but it becomes awkward if you add:

- Dragonlance hidden-moon behavior for Nuitari
- Exandria visibility-window behavior for Ruidus
- Mystara hidden Patera behavior
- Dark Sun conjunction-centric behavior

At that point a plugin-style moon behavior layer would be cleaner than continuing to pile special cases into one file.

#### 4. Planar logic is Eberron-specific but woven through shared UI

The planar subsystem is well-built for Eberron, but it is tightly integrated with:

- setup flow
- dashboard cards
- moon display notes
- weather modifiers

That is not a blocker, but it means "support many worlds" is not just a calendar question. It is also a question of how world-specific optional subsystems should attach to the shared shell.

#### 5. Event packs are still effectively world-tied by convention

The event-source scoping system is a good start, but the shipped event data is still heavily tied to current supported settings. A larger world library would be easier to manage if each world shipped as a pack with:

- calendar data
- moon data
- event sources
- optional seasonal defaults
- optional subsystem hooks

### My conclusion

If the next step is only:

- Greyhawk
- Birthright
- Mystara

then I would not do a large refactor first. I would do a small cleanup pass and keep moving.

If the real long-term goal is:

- Greyhawk
- Dragonlance
- Exandria
- Mystara
- Birthright
- Dark Sun
- Ravenloft
- more after that

then yes, I think a medium-to-large refactor is justified.

### The refactor I would actually do

I would not rewrite everything. I would do a focused structural refactor in 3 layers.

#### Layer 1: add declarative world metadata

Introduce a higher-level world/calendar descriptor, either by expanding `CALENDAR_SYSTEMS` or by adding a sibling registry, with fields like:

- `worldKey`
- `calendarKey`
- `eraLabel`
- `structure`
- `defaultSeason`
- `capabilities`
- `dateFormatStyle`
- `moonBehaviorMode`
- `featureFlags`

This removes a lot of `if calendarSystem === ...` logic.

#### Layer 2: move calendar-specific behaviors behind helpers

Centralize things like:

- weekday progression rule
- date label formatter
- intercalary rendering style
- leap-slot behavior
- season transition model

That would let Greyhawk, Harptos, Gregorian, Birthright, and Exandria all plug in cleanly.

#### Layer 3: separate generic moon math from world hooks

Split `src/moon.ts` conceptually into:

- generic moon engine
- world moon data
- world moon behavior hooks
- world sky extras

That is the change that makes Dragonlance and Exandria much easier later.

### Recommended scope before any implementation work

If you want the best payoff without overengineering, I would do this before adding more calendars:

1. Add capability metadata to calendar/world definitions.
2. Move date-format and weekday special cases into helper functions keyed by calendar/world.
3. Move the most Eberron-specific moon/weather hooks behind named world hooks.

I would not do a full rewrite before the next calendar.

### Practical takeaway

My honest read is:

- no large refactor required for the next 1 to 3 conservative settings
- a meaningful refactor is recommended before trying to turn this into a true many-world platform

That pushes the settings into two buckets:

- "Add now with light cleanup": Greyhawk, Mystara, Birthright
- "Better after refactor": Dragonlance, Exandria, Dark Sun

## World Notes

### 1. Greyhawk / Oerth

Status: Best next "classic D&D" target.

Why it fits the repo:

- 364-day year
- 7-day week
- 12 regular 28-day months
- 4 festival weeks that map cleanly to structure slots
- 2 lore-important moons directly tied to the calendar

#### Calendar proposal

- `calendarSystem` key: `greyhawk`
- Label: `Common Year`
- Era label: `CY`
- Weekdays:
  - `Starday`
  - `Sunday`
  - `Moonday`
  - `Godsday`
  - `Waterday`
  - `Earthday`
  - `Freeday`
- Regular months:
  - `Fireseek`
  - `Readying`
  - `Coldeven`
  - `Planting`
  - `Flocktime`
  - `Wealsun`
  - `Reaping`
  - `Goodmonth`
  - `Harvester`
  - `Patchwall`
  - `Ready'reat`
  - `Sunsebb`
- Festival/intercalary weeks:
  - `Needfest`
  - `Growfest`
  - `Richfest`
  - `Brewfest`
- Clean variant ideas:
  - `common`
  - `elven`
  - `nomad`

#### Good variant mapping

The same 12 x 28 scaffold can hold alternate naming sets already present in Greyhawk sources:

- Common:
  - `Fireseek`, `Readying`, `Coldeven`, `Planting`, `Flocktime`, `Wealsun`, `Reaping`, `Goodmonth`, `Harvester`, `Patchwall`, `Ready'reat`, `Sunsebb`
- Elven:
  - `Diamondice`, `Yellowillow`, `Snowflowers`, `Blossoms`, `Violets`, `Berrytime`, `Goldfields`, `Sunflowers`, `Fruitfall`, `Brightleaf`, `Tinklingice`, `Lacysnows`
- Nomad:
  - `Tiger`, `Bear`, `Lion`, `Frog`, `Turtle`, `Fox`, `Snake`, `Boar`, `Squirrel`, `Hare`, `Hawk`, `Wolf`

#### Seasons

Greyhawk's season model is more specific than a simple 4-season split:

- Winter
- Spring
- Low Summer
- High Summer
- Autumn

This likely wants a dedicated `greyhawk` season set rather than reusing `faerun` or `gregorian`.

#### Moon proposal

- `Luna`
  - silver / white
  - 28-day cycle
  - the calendar's primary month rhythm
- `Celene`
  - aquamarine / blue-green
  - 91-day cycle
  - full at the midpoint of each festival week

#### Implementation notes

- The calendar structure is straightforward and should be easy to add.
- The moon lore is straightforward and strong.
- The weaker piece is astronomy-grade runtime data:
  - cycle lengths are easy
  - color is easy
  - exact photometric / diameter / distance values are not as easy to source cleanly from the web material gathered here
- Practical recommendation:
  - implement the calendar first
  - implement moon cycles second
  - treat exact distance / albedo tuning as a later polish pass

#### Sources

- [Greyhawk Calendar](https://dungeonsdragons.fandom.com/wiki/Greyhawk_Calendar)
- [Common Year](https://dungeonsdragons.fandom.com/wiki/Common_Year)
- [Luna](https://www.greyhawkonline.com/greyhawkwiki/Luna)
- [Celene (Kule)](https://greyhawkonline.com/greyhawkwiki/Celene_%28Kule%29)

### 2. Dragonlance / Krynn

Status: Strong setting, but canon is messy enough that variants are mandatory.

Why it fits the repo:

- 3 famous moons with exact phase cycles
- culture-specific month/day naming is rich
- moon events are central to setting identity

Why it is tricky:

- web-visible sources disagree on Krynn's year length
- at least three competing calendar interpretations are alive in published/fan-visible material:
  - about 365.25 days with Earth-like month lengths
  - 360 days
  - 336 days

#### Recommendation

If this setting is ever implemented, it should be one `dragonlance` family with multiple variants:

- `novel`
  - 365.25-ish
  - Earth-like months
  - best for people following the novels and date references like October 31
- `krynnspace`
  - 360 days
  - 12 x 30
- `moonlocked`
  - 336 days
  - 12 x 28
  - best fit if the goal is "the moons matter most"

#### Calendar proposal

Base weekday scaffold:

- Use normal weekday order for the structural calendar
- Expose cultural naming variants later if desired

Known cultural weekday aliases include:

- Monday:
  - `Luindai` (Ergothian)
  - `Hunt Day` (Plainsmen)
  - `Palast` (Solamnic)
  - `Mithrik` (Dwarven)
  - `Bright Eye` (Elven)
  - `Light Day` (Kender)
  - `Pain` (Goblin)
  - `Lunitari` (God-days)

Known month alias pattern:

- January:
  - `Aelmont` (Ergothian)
  - `Ice Glaze` (Plainsman)
  - `Newkolt` (Solamnic)
  - `Dark-Crypt` (Dwarven)
  - `Winter Night` (Elven)
  - `Snowfun` (Kender)
  - `Famine` (Goblin)
  - `Chemosh` (God-days)

This suggests Dragonlance is less like one single canonical month-name set and more like a shared calendar with multiple cultural overlays.

#### Moon proposal

- `Solinari`
  - silver / white
  - 36-day cycle
  - 9-day quarters
  - moon of white magic / White Robes
- `Lunitari`
  - red
  - 28-day cycle
  - 7-day quarters
  - moon of red magic / Red Robes
- `Nuitari`
  - black
  - 8-day cycle
  - 2-day quarters
  - moon of black magic / Black Robes
  - invisible to most observers

#### Moon-engine concern

`Nuitari` is not just "a dark moon"; it is normally invisible except to specific people. The current engine does not have a visibility-by-audience rule for individual moons. That means Dragonlance moon support would likely want one of these approaches:

- GM-only / lore-only `Nuitari`
- a setting toggle for `showHiddenMoons`
- audience-sensitive rendering later

#### Signature event

- `Night of the Eye`
  - all three moons full and aligned
  - commonly described as about every 1.5 years
  - especially clean in the 336-day interpretation

#### Practical recommendation

If you only want one Krynn implementation later, choose the 336-day `moonlocked` version. It is the cleanest fit for this repo's current style and best matches the moon-heavy identity of Dragonlance, even though it is not the only canon tradition.

#### Sources

- [January](https://dragonlance.fandom.com/wiki/January)
- [Monday](https://dragonlance.fandom.com/wiki/Monday)
- [Solinari](https://dragonlance.fandom.com/wiki/Solinari_%28Moon%29)
- [Lunitari](https://dragonlance.fandom.com/wiki/Lunitari_%28Moon%29)
- [Nuitari](https://dragonlance.fandom.com/wiki/Nuitari_%28Moon%29)
- [Night of the Eye](https://dragonlance.fandom.com/wiki/Night_of_the_Eye_%28Event%29)
- [Krynn](https://dragonlance.fandom.com/wiki/Krynn)
- [Dragonlance Nexus discussion of calendar contradictions](https://dragonlancenexus.com/the-moons-of-krynn-and-why-this-fan-pulls-his-hair-out-every-time-someone-talks-about-it/)

### 3. Exandria

Status: Best modern non-Wizards target.

Why it fits the repo:

- clear 11-month calendar
- fixed weekday names
- strong world identity
- two famous moons
- Tal'Dorei and Wildemount both benefit immediately

#### Calendar proposal

- `calendarSystem` key: `exandria`
- Era label: `PD`
- Year length: 328 days
- Weekdays:
  - `Miresen`
  - `Grissen`
  - `Whelsen`
  - `Conthsen`
  - `Folsen`
  - `Yulisen`
  - `Da'leysen`
- Months:
  - `Horisal` - 29
  - `Misuthar` - 30
  - `Dualahei` - 30
  - `Thunsheer` - 31
  - `Unndilar` - 28
  - `Brussendar` - 31
  - `Sydenstar` - 32
  - `Fessuran` - 29
  - `Quen'pillar` - 27
  - `Cuersaar` - 29
  - `Duscar` - 32

#### Season notes

Exandria's season starts are day-specific, not just month-specific:

- Spring starts on Dualahei 13
- Summer starts on Unndilar 26
- Autumn starts on Fessuran 3
- Winter starts on Duscar 2

That is a good fit for a new season set with transition dates, similar to the existing `gregorian` approach.

#### Moon proposal

- `Catha`
  - pale blue / white
  - larger and closer moon
  - 30 to 40 day cycle
  - normal waxing / waning
  - associated with Sehanine / the Moon Weaver
- `Ruidus`
  - small, distant, reddish-brown / maroon / purple
  - about 164 days / six months
  - visible for only about half the year
  - appears full whenever it is visible
  - folklore of ill omen, flares, and Ruidusborn

#### Moon-engine concern

`Ruidus` is not a standard moon:

- it does not behave like a normal waxing/waning body
- visibility matters more than illumination
- it can "flare"

So Exandria is very implementable, but only if you are comfortable with one of these:

- approximate `Ruidus` with a long cycle plus special lore text
- add a future moon behavior mode such as `visibility_window` or `always_full_when_visible`

#### Practical recommendation

Exandria is an excellent future target, but if the goal is "calendar first, moon support later", you should separate those two phases. The calendar data is clean right now. `Ruidus` wants special handling.

#### Sources

- [Calendar of Exandria](https://criticalrole.fandom.com/wiki/Calendar_of_Exandria)
- [Catha](https://criticalrole.fandom.com/wiki/Catha)
- [Ruidus](https://criticalrole.fandom.com/wiki/Ruidus)

### 4. Mystara

Status: Very strong classic target.

Why it fits the repo:

- elegant 12 x 28 lunar-style calendar
- 7-day week
- lots of culture-specific month-name variants
- 2 moons
- one of the cleanest fits to the existing engine

#### Calendar proposal

- `calendarSystem` key: `mystara`
- Label: `Thyatian` or `Mystaran`
- Era label: `AC`
- Year length: 336
- Weekdays:
  - `Lunadain`
  - `Gromdain`
  - `Tserdain`
  - `Moldain`
  - `Nytdain`
  - `Loshdain`
  - `Soladain`
- Primary month variant (`thyatian`):
  - `Nuwmont`
  - `Vatermont`
  - `Thaumont`
  - `Flaurmont`
  - `Yarthmont`
  - `Klarmont`
  - `Felmont`
  - `Fyrmont`
  - `Ambyrmont`
  - `Sviftmont`
  - `Eirmont`
  - `Kaldmont`

#### Great built-in variant potential

The same 12 x 28 frame can also support:

- `fiveshires`
- `ethengar`
- `rockhome`
- `alphatia`

That is unusually good value for one implementation.

#### Moon proposal

- `Matera`
  - primary visible moon
  - 28-day cycle
- `Patera` / `Myoshima`
  - second moon
  - about 3.5-day orbit
  - usually hidden from surface observers outside its own special skyshield

#### Moon-engine concern

`Patera` is canonically special because it is normally not visible. That makes Mystara similar to Dragonlance in one way:

- the data is easy to store
- the visibility behavior is more specialized than the current engine

Possible implementation choices later:

- include only `Matera` in player-facing output
- keep `Patera` as GM/lore-only
- add a hidden-moon visibility mode later

#### Practical recommendation

Mystara is one of the strongest future calendar additions because the calendar side is almost trivial to fit. If you later want a "classic D&D pack", Greyhawk + Mystara is probably the cleanest pair.

#### Sources

- [Mystaran Almanac and Book of Facts, AC 1015](https://www.pandius.com/mystyea2.html)
- [Mystara calendar and moon tracker using Donjon](https://pandius.com/clndrmnt.html)
- [Information on the Mystaran moons, Matera and Patera](https://pandius.com/moons.html)

### 5. Birthright / Aebrynis

Status: Excellent mechanical fit and stronger than I expected.

Why it fits the repo:

- 8-day week already supported by the engine
- 12 x 32 months plus 4 annual festival days is clean to model
- month starts are explicitly tied to lunar phase
- strong alternate year-reckoning flavor

#### Calendar proposal

- `calendarSystem` key: `birthright`
- Label: `Anuirean`
- Primary era label suggestion: `HC`
- Secondary era-display ideas for later:
  - `MR`
  - `MA`
- Weekdays:
  - `Firlen`
  - `Relen`
  - `Dielen`
  - `Varilen`
  - `Branlen`
  - `Barlen`
  - `Mierlen`
  - `Thelen`
- Regular months:
  - `Sarimiere`
  - `Talienir`
  - `Roelir`
  - `Haelynir`
  - `Anarire`
  - `Deismir`
  - `Erntenir`
  - `Sehnir`
  - `Emmanir`
  - `Keltier`
  - `Faniele`
  - `Pasiphiel`
- Intercalary / festival days:
  - `Day of Rebirth`
  - `Night of Fire` / `Haelyn's Festival`
  - `Veneration of the Sleeping`
  - `Eve of the Dead`

#### Year length

- 12 months x 32 days = 384
- plus 4 annual festival days = 388

#### Moon proposal

Birthright sources surfaced here clearly tie the calendar to one moon:

- one moon with a 32-day cycle
- each month begins on the new moon
- waxing in the first half of the month
- full moon around days 16 to 18

The moon's proper name did not surface cleanly in the material gathered here, so the safest planning name for now is:

- `Aebrynis Moon`

If you later want to implement this world, it would be worth a narrow second-pass source check specifically for the moon's canonical name.

#### Practical recommendation

Birthright is one of the best engine-fit worlds in this entire list. It is also distinct from what you already support:

- not another 7-day week
- not another 12 x 28 world
- not another Gregorian derivative

#### Sources

- [Overview of Cerilia](https://bzorch.ca/archives/overview.html)
- [Cerilia timeline / calendar era notes](https://cerilia.tripod.com/Timeline/Timeline.htm)

### 6. Dark Sun / Athas

Status: Good candidate, but with more source caution than the worlds above.

Why it is appealing:

- 2 moons matter a lot
- strong celestial cycles
- unusual year structure
- thematically distinct from every currently implemented world

Why it is less clean:

- the most practical month/day structure on the web is the Merchant's Calendar tradition
- that tradition is rooted in Dark Sun material, but much of the usable detail is community-standard rather than as tidy as Greyhawk or Birthright

#### Calendar proposal

Most implementation-friendly version found in this pass:

- `calendarSystem` key: `athas`
- 12 months of 30 days
- 3 intercalary festival blocks of 5 days
- total year length: 375 days

Month progression commonly used by the Merchant's Calendar tradition:

- `Dominary`
- `Sedulous`
- `Fortuary`
- `Macro`
- `Dessalia` (festival)
- `Fifthover`
- `Hexameron`
- `Morrow`
- `Octavus`
- `Assalia` (festival)
- `Thaumast`
- `Anabasis`
- `Hoard`
- `Flagstaad`
- `Zenalia` (festival)

#### Era flavor

Athas has rich year-labeling traditions beyond a simple era tag:

- King's Age
- Free Year
- Endlean cycle
- Seofean cycle

This is flavorful, but not necessary for a first pass.

#### Moon proposal

- `Ral`
  - 33-day synodic cycle in the Merchant's Calendar tradition
- `Guthay`
  - 125-day synodic cycle in the Merchant's Calendar tradition

There are also major long-cycle conjunction behaviors:

- visible major conjunctions
- an 11-year Endlean cycle

#### Implementation caution

The structure is compelling, but I would not treat this as "drop-in canon certainty" the way I would for Greyhawk or Birthright.

If implemented later, it should probably be labeled in comments/docs as:

- based on the Merchant's Calendar tradition
- compatible with common Athas fan usage
- not claiming to be the only canonical reading

#### Sources

- [The Merchant's Calendar](https://athas.org/articles/the-merchant-s-calendar)
- [Creation of the King's Age calendar](https://athas.org/events/1)
- [Darkest Night on Athas / lunar conjunctions](https://arena.athas.org/t/the-darkest-night-on-athas-lunar-conjunctions-on-athas/2369)
- [Calendar of Tyr](https://darksun-dragonswake.fandom.com/wiki/Calendar_of_Tyr)

### 7. Ravenloft / Barovia

Status: Important setting, weak implementation target.

Why it is weak:

- time in Ravenloft is intentionally slippery
- Barovia often measures time in moons, but online sources disagree on structure
- some sources use 12 numbered lunar months
- some use solar-style month counts
- year length varies between fan treatments

#### Recommendation

Do not prioritize Ravenloft as a general-purpose implementation unless you want to deliberately make a house Barovian calendar.

If you ever do, the best framing would be:

- one valley/domain-specific calendar
- explicitly documented as a chosen interpretation
- not presented as "the" Ravenloft-wide canon calendar

#### Sources

- [Ravenloft Time](https://www.ravenlofteternal.org/ravenloft-time.html)
- [Barovian Calendar](https://ravengrey.wikidot.com/barovian-calendar)

### 8. Nentir Vale / Nerath

Status: Defer.

What I found:

- community wikis present month and weekday names
- but the material I surfaced here does not look dependable enough to treat as firm setting canon
- in practice it looks more like fan reconstruction than like a clearly sourced D&D standard

#### Recommendation

If you later want Nentir Vale support, do a narrow dedicated research pass first. I would not use the currently gathered web material as an implementation source of truth.

#### Source

- [The Calendar (Points of Light wiki)](https://points-of-light.fandom.com/wiki/The_Calendar)

## Suggested Future Implementation Order

If you later decide to build these, this is the order I would use:

1. Greyhawk
2. Birthright
3. Mystara
4. Dragonlance
5. Exandria
6. Dark Sun
7. Ravenloft
8. Nentir Vale

Why this order:

- Greyhawk, Birthright, and Mystara fit the current engine especially well.
- Dragonlance and Exandria are high-value, but each wants moon-behavior caveats.
- Dark Sun is attractive, but more interpretive.
- Ravenloft and Nentir Vale need stronger source confidence before implementation.

## Shortlist Summary

If the goal is "common D&D worlds you do not yet support", the strongest additions after this review are:

- Greyhawk / Oerth
- Dragonlance / Krynn
- Exandria
- Mystara
- Birthright / Aebrynis
- Dark Sun / Athas

And if the goal is "best next additions for this exact codebase", the most implementation-ready are:

- Greyhawk
- Birthright
- Mystara
