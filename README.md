# Calendar — Roll20 API Script

A Roll20 API script for managing a fantasy campaign calendar with:
- graphical mini-calendar displayed in chat, with toggleable subsystems:
	- events tracking
	- moon phase tracking
	- location-based, generated weather, with mechanical effects (homebrew system)
	- planar movements (Eberron setting)

**Supports:** Eberron, Forgotten Realms, Earth (Gregorian)

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
- [Planes](#planes)
- [Command Reference](#command-reference)
- [Development](#development)
- [Calendar Systems](#calendar-systems)

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

The default `!cal` and `!cal today` views now open a compact Today dashboard instead of dropping straight into the full month stack.

GM dashboard cards:
- Date
- Events Today
- Weather
- Moons
- Planes
- GM Controls

Player dashboard cards:
- Date
- Events Today
- Weather
- Moons
- Planes

Each card starts with a one-sentence summary and keeps deeper views behind focused actions such as `Detail`, `Forecast`, `Mechanics`, `Sky`, `Lore`, `Send`, and `Admin`.

Use `!cal show ...` or `!cal send ...` when you want the traditional month/year calendar render. The root help menu (`!cal help`) is also task-focused and includes prompt buttons for `!cal set`, `!cal add`, `!cal addmonthly`, `!cal addyearly`, `!cal moon on`, `!cal planes on`, and `!cal send`.

</details>

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
| Planes | 1 day | 3 days | 6 days | 10 days |

Use that table as the default "skilled forecast" pacing for Survival, Nature, navigator's tools, almanacs, observatory records, or planar scholarship. The script's reveal buttons already line up with those windows even when your campaign fiction explains them differently.

`high` is the tier for magic, instruments, or institutions that justify precise knowledge rather than informed guesswork: divination, dragonmarked observatories, long-kept almanacs, planar charts, weather stations, or privileged archival access. Use it when the fiction supports exact timing inside the granted window.

For weather, `high` can also mean a **specific-date reveal**: the GM can reveal just the chosen future date or range at the current location without exposing all intervening days.

If you want custom reveal horizons beyond the preset buttons, widen them in Fibonacci-style steps instead of simple doubling: `1, 2, 3, 5, 8, 13`, then round into table-friendly units. In practice that means weather and planes usually grow by days, while moons grow by months.

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
| Eberron | 12 moons (see below) | Mixed | Mixed | Mixed | Mixed | Mixed | Mixed | 998-01-01 default seed anchor |

- **Faerûn tilt note:** Selûne's inclination is retained for consistent sky geometry and future-proofing, even in a one-moon system.
- **Eberron approach:** Each moon keeps canonical flavor (name/color/role) while borrowing orbital-shape values from selected real-world reference moons.

### Eberron-Specific Cosmology

Eberron is modeled as Earth-like for baseline astronomical geometry (including axial tilt assumptions for daylight-length variation across the year). In this script, however, **temperature is not driven by axial/solar-season physics**. Seasonal weather pressure is handled through the campaign's planar/weather system instead.

That means axial tilt mostly shows up as broad seasonal daylight framing: longer summer days, shorter winter days, and corresponding shifts in the script's coarse time-of-day buckets. Because the script does not track latitude, it intentionally stops short of city-by-city sunrise tables or exact numeric day-length curves.

### Ring of Siberys

- Single equatorial ring at **0° inclination**
- Uses **Saturn's rings** as the physical analog, scaled to fit inside Zarantyr's orbit
- Extends roughly **370 to 3,480 miles (600 to 5,600 km)** above the surface
- **Albedo 0.50**, chosen from a Saturn-ring-inspired analog and tuned to preserve the setting goal that the ring is visibly bright even by day
- Contributes about **0.008 lux** of nighttime illumination by itself, forming most of the script's ~0.010 lux ambient clear-night baseline with starlight
- Serves as a constant visual feature of the sky, distinct from the moving moons and planar effects
- The outer edge still sits about **2,300 km / 1,430 mi inside Zarantyr's mean orbit**, so the Ring never overlaps the nearest moon's track in the model
- Angular-size note: Earth's Moon is the script's `1.0x` apparent-diameter baseline; Zarantyr is about `9.08x`, Olarune `5.73x`, Therendor `2.91x`, Dravago `2.66x`, and Eyre `2.38x`. The Ring is not a disk at all, but a sky-spanning band that dwarfs any moon as a visual structure
- Saturn-rings reference note: the real rings are mostly water ice with dust/rock contamination, with particles ranging from dust grains to mountain-scale chunks. Their brightness varies by ring, from darker dirty sections to bright B-ring ice; the script's `0.50` uses a bright-average analog rather than claiming every ringlet is equally reflective
### Moons of Eberron

The Eberron implementation uses fixed synodic periods on a 336-day year scaffold to keep moon cycles readable in play while preserving distinct rhythms. Exact full/new peaks only move when an external force does so deliberately.

Those external pulls currently come from festival nudges to local noon, canonical associated-plane windows that pull an exact full/new peak onto the nearest edge-day noon when a window would otherwise miss it, Long Shadows gobbling that centers claimed new moons on noon of Vult 27, GM anchors, and the Therendor/Barrakas anti-phase coupling.

Day labels for `Full` and `New` are calibrated to the 12-moon Eberron sky: `Full` means at least `98.004%` illumination and `New` means at most `1.996%` illumination. That keeps the system at an average of 19 days per 28-day month with at least one full moon.

| Eberron Moon | Title             | Plane     | Dragonmark          | Synodic Period (days) | Approx. Diameter (mi) | Mean Distance (mi) | Apparent Diameter vs Earth's Moon | Inclination (°) | Eccentricity | Albedo |
| ------------ | ----------------- | --------- | ------------------- | --------------------: | --------------------: | -----------------: | --------------------------------: | --------------: | -----------: | -----: |
| Zarantyr     | The Storm Moon    | Kythri    | Mark of Storm       |               27.3200 |                  1250 |             14,300 |                             9.08x |           5.145 |       0.0549 |   0.12 |
| Olarune      | The Sentinel Moon | Lamannia  | Mark of Sentinel    |               30.8052 |                  1000 |             18,000 |                             5.73x |            0.33 |       0.0288 |   0.22 |
| Therendor    | The Healer's Moon | Syrania   | Mark of Healing     |               34.7350 |                  1100 |             39,000 |                             2.91x |            0.03 |       0.0022 |   0.99 |
| Eyre         | The Anvil         | Fernia    | Mark of Making      |               39.1661 |                  1200 |             52,000 |                             2.38x |            1.53 |       0.0196 |   0.96 |
| Dravago      | The Herder's Moon | Risia     | Mark of Handling    |               44.1625 |                  2000 |             77,500 |                             2.66x | 156.8 (retrograde) |     0.000016 |   0.76 |
| Nymm         | The Crown         | Daanvi    | Mark of Hospitality |               49.7962 |                   900 |             95,000 |                             0.98x |            0.20 |       0.0013 |   0.43 |
| Lharvion     | The Eye           | Xoriat    | Mark of Detection   |               56.1487 |                  1350 |            125,000 |                             1.11x |            0.43 |       0.1230 |   0.30 |
| Barrakas     | The Lantern       | Irian     | Mark of Finding     |               63.3115 |                  1500 |            144,000 |                             1.07x |            0.02 |       0.0047 |  1.375 |
| Rhaan        | The Book          | Thelanis  | Mark of Scribing    |               71.3881 |                   800 |            168,000 |                             0.49x |            4.34 |       0.0013 |   0.32 |
| Sypheros     | The Shadow        | Mabar     | Mark of Shadow      |               80.4950 |                  1100 |            183,000 |                             0.62x |            1.08 |       0.0151 |  0.071 |
| Aryth        | The Gateway       | Dolurrh   | Mark of Passage     |               90.7637 |                  1300 |            195,000 |                             0.69x |            7.57 |       0.0283 |  0.275 |
| Vult         | The Warding Moon  | Shavarath | Mark of Warding     |              102.3424 |                  1800 |            252,000 |                             0.74x |            0.07 |       0.0014 |   0.23 |

#### Why these reference moons

The resolved selection goal was not "pick moons with matching names." It was "pick real reference bodies whose orbital behavior supports the in-setting story."

- Therendor and Barrakas were chosen as a near-coplanar pair: Dione and Enceladus sit at `0.03` and `0.02` inclination, which supports frequent crossings and the lore that those two moons closely track one another.
- Eyre ended on Mimas because the mythic and visual fit beat the earlier high-inclination candidates: bright, scarred, forge-flavored, and still mechanically distinct without needing to stay the wildest orbit in the sky.
- Dravago ended on retrograde Triton because "keeps its distance from other moons" reads best as behavioral separation. It moves opposite every other moon, which sells the Herder's outsider character more strongly than a prograde shepherd moon would.
- Sypheros ended on Phobos because the doomed inward spiral fits Mabar's entropy better than a purely retrograde option. It feels like a moon already being consumed.
- Barrakas keeps Enceladus's base albedo at `1.375` rather than the old amplified-lantern variants. That leaves it unmistakably bright without making it dominate the whole sky over Zarantyr.

The result is a moon set that keeps the orbital math grounded while still privileging Eberron flavor when a pure "best-fit spreadsheet" answer would miss the point.

#### Eberron Moon Reference Inspirations
Name notes below are interpretive flavor cues, not confirmed in-setting etymologies.

##### Zarantyr
**Reference body:** Luna (Earth). **Name note:** The hard, storm-cut sound fits Kythri's violence.
The sky's dominant moon: huge, pale, and close enough to feel like a threat when the weather turns.

##### Olarune
**Reference body:** Titan (Saturn). **Name note:** The rounded syllables feel older and steadier than Zarantyr's bite.
Amber and watchful, Olarune reads as a patient guardian hanging over the wild.

##### Therendor
**Reference body:** Dione (Saturn). **Name note:** Its gentler cadence suits a moon tied to healing and mercy.
Small but brilliant, Therendor is the clean silver lamp of the upper sky.

##### Eyre
**Reference body:** Mimas (Saturn). **Name note:** The name feels clipped and forge-hot, matching Fernia better than a softer lunar name.
Eyre is the smith's moon: bright, battered, and marked by one overwhelming scar like a forge-struck face.

##### Dravago
**Reference body:** Triton (Neptune). **Name note:** The heavier consonants give it a hulking, winter-beast feel.
Big in truth but distant in the sky, Dravago feels cold, remote, and stubbornly separate from the others.

##### Nymm
**Reference body:** Ganymede (Jupiter). **Name note:** The short, ceremonial sound suits a moon of feasts and order.
Nymm is the courtly moon: balanced, golden, and almost Earth-Moon-sized to the eye.

##### Lharvion
**Reference body:** Hyperion (Saturn). **Name note:** The stretched vowels make it sound unstable and slightly wrong.
Lharvion is the unsettling one, swelling and shrinking more dramatically than any moon that should be trusted.

##### Barrakas
**Reference body:** Enceladus (Saturn). **Name note:** The name lands like a struck bell or a lantern being hooked into place.
Barrakas is the traveler's moon: steady, near-equatorial, and implausibly bright.

##### Rhaan
**Reference body:** Miranda (Uranus). **Name note:** The breathy opening makes it feel like a spoken word or half-remembered story.
Rhaan is a little blue-white page in the sky, more literary than majestic.

##### Sypheros
**Reference body:** Phobos (Mars). **Name note:** The whispering sibilants fit secrecy and decay.
Dim even at its best, Sypheros looks like a moon already half-lost to darkness.

##### Aryth
**Reference body:** Iapetus (Saturn). **Name note:** The abrupt ending gives it a gate-like finality.
Aryth is the threshold moon: half dark, half burning, with a dividing line that feels deliberate.

##### Vult
**Reference body:** Oberon (Uranus). **Name note:** Short and blunt, like a fortress command barked across a wall.
Far out and slow-moving, Vult feels like the last watchfire on the edge of the world.

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

The location wizard also keeps the **last three locations** as quick-switch buttons. That makes it practical to jump to "mountains in six weeks," reveal a divined forecast there, and then jump back to the current region without rebuilding the location by hand.

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

</details>

[Return to Table of Contents](#table-of-contents)

---
## Planes

<details>
<summary>Show planar alignment model and generated-event tables</summary>

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
- When a GM uses `!cal planes send ...`, players receive an archived non-interactive summary and the GM receives the full interactive panel back as a whisper.

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
!cal weather event trigger <key>
!cal weather event roll <key>
```

#### Weather location and manifest zones

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
```

Examples:

```text
!cal moon full Aryth 14
!cal moon new Zarantyr Rhaan 14
!cal moon full Therendor Rhaan 14 998
```

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
!cal planes send medium [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]
!cal planes send high [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]
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

## Calendar Systems

<details>
<summary>Show supported calendar-system variants</summary>

Switch calendar systems via the Admin panel (`!cal` → ⚙ Admin):

- **Galifar** (Khorvaire/Eberron) — 12 months × 28 days, YK era, 7-day weeks.
- **Harptos** (Faerûn/Forgotten Realms) — 12 months × 30 days + intercalary festival days, DR era, tendays displayed as 3 rows × 10 columns, with festival-day strips for intercalary dates
- **Gregorian** (Earth) — 12 months x 28-31 days, CE era, 7-day weeks, leap years every 4th year except for years divisible by 100, except in turn for years also divisible by 400.

</details>

[Return to Table of Contents](#table-of-contents)

---
