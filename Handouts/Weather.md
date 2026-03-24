# Weather Reference

This file consolidates the editable reference material that currently lives in the weather handouts. It is intended for revising mechanics text, hazard tables, and setting notes without editing code.

Live/generated outputs are intentionally excluded here: no rolling forecast windows, no today-summary blocks, and no previous/next-day tables.

## Table of Contents

- [Shared Mechanics](#shared-mechanics)
- [Eberron](#eberron)
- [Forgotten Realms](#forgotten-realms)
- [Earth](#earth)
- [Greyhawk](#greyhawk)
- [Dragonlance](#dragonlance)
- [Exandria](#exandria)
- [Mystara](#mystara)
- [Birthright](#birthright)

## Shared Mechanics

### Core Notes

- The weather system uses shared temperature, wind, precipitation, fog, and extreme-event logic across all supported settings.
- Visibility and fog are derived by `_deriveConditions()`. Dense fog and the heaviest precipitation collapse visibility first; difficult terrain and hazard tags are layered on top after that.
- Extreme events are GM advisory hazards gated by the daily weather state plus location profile.
- The current handout text notes that coastal and island tides draw from the moon system, with Zarantyr carrying the dominant effect. That note is Eberron-centric in the current implementation and should be revised here if the desired behavior changes.

### Temperature Bands

| Band | Range (F)    | Label       | Nominal DC | Cold Gear                             | Heat Armor Rule                               |
| ---- | ------------ | ----------- | ---------- | ------------------------------------- | --------------------------------------------- |
| -5   | `<= -46`     |             | 30         | Special protection required           | None                                          |
| -4   | `-45 to -36` |             | 25         | Heavy cold-weather clothing required  | None                                          |
| -3   | `-35 to -26` |             | 25         | Heavy cold-weather clothing required  | None                                          |
| -2   | `-25 to -16` |             | 20         | Medium cold-weather clothing required | None                                          |
| -1   | `-15 to -6`  |             | 20         | Medium cold-weather clothing required | None                                          |
| 0    | `-5 to 4`    |             | 15         | Light cold-weather clothing required  | None                                          |
| 1    | `5 to 14`    |             | 15         | Light cold-weather clothing required  | None                                          |
| 2    | `15 to 24`   |             | 10         | Warm clothing required                | None                                          |
| 3    | `25 to 34`   | Freezing    | 10         | Warm clothing required                | None                                          |
| 4    | `35 to 44`   | Cold        | —          | None normally                         | None                                          |
| 5    | `45 to 54`   | Cool        | —          | None                                  | None                                          |
| 6    | `55 to 64`   | Mild        | —          | None                                  | None                                          |
| 7    | `65 to 74`   | Temperate   | —          | None                                  | None                                          |
| 8    | `75 to 84`   | Warm        | —          | None                                  | None                                          |
| 9    | `85 to 94`   | Hot         | —          | None                                  | None                                          |
| 10   | `95 to 104`  | Sweltering  | 10         | None                                  | None                                          |
| 11   | `105 to 114` | Brutal Heat | 15         | None                                  | Disadvantage if wearing heavy armor           |
| 12   | `115 to 124` | Scorching   | 20         | None                                  | Disadvantage if wearing medium or heavy armor |
| 13   | `125 to 134` | Searing     | 25         | None                                  | Disadvantage if wearing any armor at all      |
| 14   | `135 to 144` | Hellish     | 25         | None                                  | Disadvantage if wearing any armor at all      |
| 15   | `>= 145`     | Infernal    | 30         | Special protection required           | Disadvantage if wearing any armor at all      |

### Wind Bands

| Band | Label         | Mechanical Effect                                                                                                                       |
| ---- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Calm          | No special mechanical effect by default.                                                                                                |
| 1    | Breeze        | No special mechanical effect by default.                                                                                                |
| 2    | Moderate Wind | Fogs and gases dispersed.                                                                                                               |
| 3    | Strong Wind   | Disadvantage on ranged attack rolls. Long-range attacks automatically miss. Flying costs extra movement. Open flames extinguished.      |
| 4    | Gale          | Ranged attack rolls automatically miss. Flying speeds reduced to 0. Walking costs extra movement.                                       |
| 5    | Storm         | DC 15 Strength check or fall prone. Small trees uprooted. Projectiles deal `2d6` bludgeoning on a failed DC 10 Dex save. Severe hazard. |

### Precipitation Bands

| Band | Cold (Temp ≤ 3) | Near Freezing (Temp 4) | Warm (Temp ≥ 5) | Visibility Effect |
| ---- | --------------- | ---------------------- | --------------- | ----------------- |
| 0    | Clear           | Clear                  | Clear           | None              |
| 1    | Light Snow      | Light Sleet            | Light Rain      | None              |
| 2    | Light Snow      | Light Sleet            | Light Rain      | None              |
| 3    | Snow            | Sleet                  | Rain            | Lightly Obscured  |
| 4    | Blizzard        | Ice Storm              | Heavy Rain      | Lightly Obscured; Heavily Obscured beyond 60 ft |
| 5    | Blizzard        | Ice Storm              | Deluge          | Lightly Obscured; Heavily Obscured beyond 30 ft |

### Extreme Events

| Event | Typical Trigger | Duration | Mechanics | Aftermath |
| --- | --- | --- | --- | --- |
| Flash Flood | Heavy rain in lowland/coastal geography, especially after prior wet weather | `1-4 hours` | River crossings impassable; low ground becomes difficult terrain; strong sweep risk in water | Roads washed out, fords flooded, water sources silted |
| Whiteout | Blizzard conditions on open plains or arctic flats | `2-8 hours` | Visibility 0; all creatures effectively blinded; navigation nearly impossible; exposure risk | Deep drifts and difficult terrain for days |
| Ground Blizzard | Existing snowpack plus strong wind on open terrain | `1-6 hours` | Heavy obscurity beyond 30 ft; navigation checks; hourly exposure checks; flying impossible in open terrain | Roads and sheltered passages drift shut |
| Dust Storm (Haboob) | Hot, dry, windy weather in desert or open dry terrain | `10 minutes-3 hours` | Heavy obscurity beyond 30 ft; choking dust can poison; flying creatures risk being grounded | Dust contamination and lingering reduced visibility |
| Avalanche | Highland terrain with heavy snow and wind, or storm-loaded snowpack | Instant event plus longer cleanup | `6d6` bludgeoning on failed Dex save and burial/restraint risk | Passes or valleys blocked; travel can be impossible for days |
| Severe Thunderstorm | Warm, wet, windy storm conditions | `1-3 hours` | Repeated lightning-strike risk outdoors; metal armor is worse; tall isolated objects get hit first | Fires, fallen trees, and higher flood risk |
| Clear-Sky Lightning | Rare atmospheric discharge with little precipitation; enhanced under a full Zarantyr | Instant strike or short burst | Sudden lightning damage in exposed terrain with little warning | Localized fire or scorch damage |
| Flash Freeze | Sudden cold after a warm, wet prior day | `1-4 hours` to freeze; ice lasts until thaw | Water and mud glaze into ice; outdoor surfaces become difficult terrain; movement checks to avoid falls | Icy surfaces persist until temperatures rise |
| Tropical Storm | Warm coastal/open-sea weather with rain and gale-force wind | `6-24 hours` | Flying and ranged attacks are impaired; small vessels can capsize; structures risk minor damage | Coastal flooding, debris, minor structural damage |
| Hurricane | Extremely warm, high-wind coastal/open-sea deluge | `12-48 hours` | Ranged attacks impossible; nonmagical flight effectively impossible; repeated push/prone risk; major ship and structure damage | Catastrophic flooding, uprooted trees, impassable roads, contaminated water |

## Eberron

- Weather is fully supported.
- Current handout-side lore links tides to the moon system, with Zarantyr as the dominant influence.
- Current hazard logic also gives special lightning adjustments during a full Zarantyr.

## Forgotten Realms

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.

## Earth

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.

## Greyhawk

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.

## Dragonlance

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.

## Exandria

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.

## Mystara

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.

## Birthright

- Weather is fully supported.
- No extra setting-specific weather handout text is currently defined beyond the shared system tables.
