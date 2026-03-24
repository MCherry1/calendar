# Events Reference

This file consolidates the editable reference material that currently lives in the events handouts. It is meant to replace digging through code when event packs, labels, or workflow notes need revision.

Live/generated outputs are intentionally excluded here: no rolling month tables, no current-date summaries, and no runtime remove/restore lists.

## Table of Contents

- [Shared Notes](#shared-notes)
- [Eberron](#eberron)
- [Forgotten Realms](#forgotten-realms)
- [Earth](#earth)
- [Greyhawk](#greyhawk)
- [Dragonlance](#dragonlance)
- [Exandria](#exandria)
- [Mystara](#mystara)
- [Birthright](#birthright)

## Shared Notes

### Workflow Notes

- Adding events: single, monthly, and yearly event commands all resolve into the same live event table.
- Removing events: custom events are deleted directly; default events are suppressed so they can be restored later.
- Restore flow: restore actions re-enable suppressed default events without losing the source grouping.
- Source priority: default canon, generated content, and manual additions are tracked separately so suppression and restore behavior stays deterministic.
- Colors: events can carry an explicit hex color or named color; the live UI uses those colors for calendar cell fills and dots.

### Day-Spec Conventions

- Exact day: `14`
- Day range: `18-19`
- Ordinal weekday: `first far`, `last zor`
- Every matching weekday: `all sul` (internally treated like `every sul`)
- `month: all` means the event repeats across every month in the current calendar
- Month numbers in the tables below are 1-based

## Eberron

Default event packs are defined for Eberron. The current set is split into regional, religious, and city-specific sources.

### Sharn

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Tain Gala | all | first far | `#F7E7CE` | `sharn` |
| Crystalfall | 2 | 9 | `#D7F3FF` | `sharn` |
| Day of Ashes | 5 | 3 | `#B0BEC5` | `sharn` |
| The Race of Eight Winds | 7 | 23 | `#006D3C` | `sharn` |

### Khorvaire

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Day of Mourning | 2 | 20 | `#9E9E9E` | `khorvaire` |
| Galifar's Throne | 6 | 5 | `#D4AF37` | `khorvaire` |
| Thronehold | 11 | 11 | `#E80001` | `khorvaire` |

### Sovereign Host

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Onatar's Flame | 1 | 7 | `#FF6F00` | `sovereign host` |
| Turrant's Gift | 2 | 14 | `#B8860B` | `sovereign host` |
| Olladra's Feast | 2 | 28 | `#8BC34A` | `sovereign host` |
| Sun's Blessing | 3 | 15 | `#FFC107` | `sovereign host` |
| Aureon's Crown | 5 | 26 | `#283593` | `sovereign host` |
| Brightblade | 6 | 12 | `#B71C1C` | `sovereign host` |
| Bounty's Blessing | 7 | 14 | `#388E3C` | `sovereign host` |
| The Hunt | 8 | 4 | `#1B5E20` | `sovereign host` |
| Boldrei's Feast | 9 | 9 | `#F57C00` | `sovereign host` |
| Market Day | 11 | 20 | `#FFD54F` | `sovereign host` |

### The Dark Six

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Shargon's Bargain | 4 | 13 | `#006064` | `dark six` |
| Second Skin | 6 | 11 | `#809E62` | `dark six` |
| Wildnight | 10 | 18-19 | `#AD1457` | `dark six` |
| Long Shadows | 12 | 26-28 | `#0D0D0D` | `dark six` |

### Silver Flame

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Rebirth Eve | 1 | 14 | `#EAF2FF` | `silver flame` |
| Bright Souls' Day | 2 | 18 | `#FFF2C6` | `silver flame` |
| Tirasday | 3 | 5 | `#DCEBFF` | `silver flame` |
| Initiation Day | 4 | 11 | `#C7E3FF` | `silver flame` |
| Baker's Night | 5 | 6 | `#D8B98F` | `silver flame` |
| Promisetide | 5 | 28 | `#BDE3FF` | `silver flame` |
| First Dawn | 6 | 21 | `#FFD1A6` | `silver flame` |
| Silvertide | 7 | 14 | `#F2F7FF` | `silver flame` |
| Victory Day | 8 | 9 | `#B3E5FC` | `silver flame` |
| Fathen's Fall | 8 | 25 | `#E7ECF5` | `silver flame` |
| The Ascension | 10 | 1 | `#E6F0FF` | `silver flame` |
| Saint Valtros's Day | 10 | 25 | `#E8ECFF` | `silver flame` |
| Rampartide | 11 | 24 | `#D6F5D6` | `silver flame` |
| Khybersef | 12 | 27 | `#111827` | `silver flame` |
| Day of Cleansing Fire | all | all sul | `#F2F7FF` | `silver flame` |

### Stormreach

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| The Burning Titan | 3 | 1 | `#FF5722` | `stormreach` |
| Pirate's Moon | 5 | 20 | `#0E7490` | `stormreach` |
| The Annual Games | 6 | 1-14 | `#2E7D32` | `stormreach` |
| Shacklebreak | 11 | 1 | `#455A64` | `stormreach` |

## Forgotten Realms

The Harptos calendar interleaves intercalary festival days among regular months. Month numbers below are 1-based indices into the full 18-slot structure array:

| # | Name | Type |
| --- | --- | --- |
| 1 | Hammer | Regular (30 days) |
| 2 | Midwinter | Intercalary (1 day) |
| 3 | Alturiak | Regular (30 days) |
| 4 | Ches | Regular (30 days) |
| 5 | Tarsakh | Regular (30 days) |
| 6 | Greengrass | Intercalary (1 day) |
| 7 | Mirtul | Regular (30 days) |
| 8 | Kythorn | Regular (30 days) |
| 9 | Flamerule | Regular (30 days) |
| 10 | Midsummer | Intercalary (1 day) |
| 11 | Shieldmeet | Intercalary (1 day, leap years only) |
| 12 | Eleasis | Regular (30 days) |
| 13 | Eleint | Regular (30 days) |
| 14 | Marpenoth | Regular (30 days) |
| 15 | Uktar | Regular (30 days) |
| 16 | Highharvestide | Intercalary (1 day) |
| 17 | Nightal | Regular (30 days) |
| 18 | Feast of the Moon | Intercalary (1 day) |

### Harptos Festivals

The five (six with Shieldmeet) universal intercalary festival days. Every Faerunian knows these. Source: FRCS 3e p.77.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Midwinter | 2 | 1 | `#A8DADC` | `harptos` |
| Greengrass | 6 | 1 | `#A8E6A3` | `harptos` |
| Midsummer | 10 | 1 | `#FFD700` | `harptos` |
| Shieldmeet | 11 | 1 | `#C0C0C0` | `harptos` |
| Highharvestide | 16 | 1 | `#F4A261` | `harptos` |
| Feast of the Moon | 18 | 1 | `#9370DB` | `harptos` |

Note: Shieldmeet's month slot has `leapEvery: 4`, so the event only renders in leap years.

### Sword Coast

Regional holidays observed along the Sword Coast, primarily in Waterdeep. Sources: Volo's Guide to Waterdeep, SCAG p.29, Waterdeep: Dragon Heist.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Deadwinter Day | 1 | 15 | `#B0BEC5` | `sword coast` |
| Fleetswake | 3 | 1-5 | `#4682B4` | `sword coast` |
| Waukeentide | 5 | 1-10 | `#DAA520` | `sword coast` |
| Trolltide | 7 | 1 | `#556B2F` | `sword coast` |
| Founders' Day | 8 | 1 | `#4169E1` | `sword coast` |
| Sornyn | 8 | 20-21 | `#FF69B4` | `sword coast` |
| Ahghairon's Day | 12 | 1 | `#4169E1` | `sword coast` |
| Liar's Night | 14 | 30 | `#FF8C00` | `sword coast` |
| Simril | 17 | 20 | `#87CEEB` | `sword coast` |

### Faerunian Faiths

Religious observances tied to specific deities. These often overlap with Harptos festival dates but carry distinct religious significance. Sources: Faiths and Pantheons, SCAG.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Midwinter Prayers (Mystra) | 2 | 1 | `#7B68EE` | `faerunian faiths` |
| Greengrass Rites (Chauntea) | 6 | 1 | `#228B22` | `faerunian faiths` |
| Midsummer Revelry (Sune) | 10 | 1 | `#FF1493` | `faerunian faiths` |
| Feast of the Moon (Kelemvor) | 18 | 1 | `#4B0082` | `faerunian faiths` |
| Last Sheaf (Chauntea) | 15 | 20 | `#DAA520` | `faerunian faiths` |

## Earth

### Gregorian Seasons

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| First Day of Winter | 12 | 21 | `#A8DADC` | `gregorian` |
| Winter Solstice | 12 | 21 | `#A8DADC` | `gregorian` |
| First Day of Spring | 3 | 20 | `#A8E6A3` | `gregorian` |
| Spring Equinox | 3 | 20 | `#A8E6A3` | `gregorian` |
| First Day of Summer | 6 | 21 | `#FFD166` | `gregorian` |
| Summer Solstice | 6 | 21 | `#FFD166` | `gregorian` |
| First Day of Autumn | 9 | 22 | `#F4A261` | `gregorian` |
| Autumn Equinox | 9 | 22 | `#F4A261` | `gregorian` |

## Greyhawk

### Greyhawk Festivals

Sources: World of Greyhawk boxed set (1983), Living Greyhawk Gazetteer.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Needfest begins | 1 | 1 | `#E0C68A` | `greyhawk` |
| Midwinter Night | 1 | 4 | `#A8DADC` | `greyhawk` |
| Growfest begins | 4 | 1 | `#A8E6A3` | `greyhawk` |
| Growfest Midsday | 4 | 4 | `#A8E6A3` | `greyhawk` |
| Richfest begins | 7 | 1 | `#FFD700` | `greyhawk` |
| Midsummer | 7 | 4 | `#FFD700` | `greyhawk` |
| Brewfest begins | 10 | 1 | `#D2691E` | `greyhawk` |
| Brewfest Midsday | 10 | 4 | `#D2691E` | `greyhawk` |

## Dragonlance

### Krynnish Calendar Events

Sources: Dragonlance Campaign Setting (3e), Tales of the Lance.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Yule | 1 | 1 | `#A8DADC` | `dragonlance` |
| Spring Dawning | 3 | 1 | `#A8E6A3` | `dragonlance` |
| Solamnic Oath Day | 5 | 1 | `#C0C0C0` | `dragonlance` |
| Midsummer | 6 | 14 | `#FFD700` | `dragonlance` |
| Kingfisher's Day | 9 | 1 | `#F4A261` | `dragonlance` |
| Harvest Home | 9 | 14 | `#F4A261` | `dragonlance` |
| Yuleve | 12 | 28 | `#A8DADC` | `dragonlance` |

## Exandria

### Exandrian Holidays

Sources: Explorer's Guide to Wildemount p.12-13, Tal'Dorei Reborn.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| New Dawn | 1 | 1 | `#FFD700` | `exandria` |
| Hillsgold | 1 | 27 | `#DAA520` | `exandria` |
| Day of Challenging | 3 | 7 | `#CD5C5C` | `exandria` |
| Elvendawn | 3 | 20 | `#98FB98` | `exandria` |
| Merryfrond's Day | 4 | 31 | `#32CD32` | `exandria` |
| Zenith | 7 | 26 | `#FFD700` | `exandria` |
| Harvest's Close | 8 | 3 | `#F4A261` | `exandria` |
| Embertide | 8 | 8 | `#FF6347` | `exandria` |
| Barren Eve | 10 | 2 | `#708090` | `exandria` |
| The Crystalheart | 11 | 11 | `#87CEEB` | `exandria` |

## Mystara

### Mystaran Holidays

Sources: GAZ series (Gazetteer), Rules Cyclopedia, Dawn of the Emperors.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| New Year | 1 | 1 | `#FFD700` | `mystara` |
| Emperor's Day | 1 | 15 | `#FFD700` | `mystara` |
| Vernal Equinox | 3 | 14 | `#A8E6A3` | `mystara` |
| Valerias' Day | 4 | 14 | `#FF69B4` | `mystara` |
| Summer Solstice | 6 | 14 | `#FFD166` | `mystara` |
| Festival of Asterius | 9 | 1 | `#DAA520` | `mystara` |
| Autumnal Equinox | 9 | 14 | `#F4A261` | `mystara` |
| Winter Solstice | 12 | 14 | `#A8DADC` | `mystara` |

## Birthright

### Cerilian Festivals

Sources: Birthright Campaign Setting boxed set, Player's Secrets series.

| Event | Month | Day Spec | Color | Source |
| --- | --- | --- | --- | --- |
| Erntenir (Harvest Festival) | 2 | 1 | `#DAA520` | `birthright` |
| Day of Deismaar | 3 | 1 | `#FF4500` | `birthright` |
| Haelynir (Day of the Sun) | 5 | 1 | `#FFD700` | `birthright` |
| Sword and Crown | 6 | 1 | `#C0C0C0` | `birthright` |
| Midsummer | 8 | 1 | `#FF6347` | `birthright` |
| Remembrance Day | 10 | 1 | `#4B0082` | `birthright` |
| Midwinter | 11 | 1 | `#87CEEB` | `birthright` |
