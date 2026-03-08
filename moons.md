# Moons Subsystem Design Document

## 1) Overview and scope

The moon subsystem supports **three moon-system variants** with deterministic phase behavior, reveal-tier forecasting, and gameplay-facing outputs:

- **Eberron**: twelve moons with lore-linked orbital personalities and Long Shadows interactions.
- **Faerûnian**: Selûne as Toril’s single moon with a Harptos-aligned cycle.
- **Gregorian/Earth**: Luna as a real-world baseline with standard astronomical cadence.

Across all variants, implementation includes:

- canonical moon metadata,
- orbital mechanical parameters (synodic period, inclination, eccentricity, albedo, variation profile),
- seeded phase sequence generation,
- player reveal horizons and source attribution,
- moon command panels and send-to-player workflows,
- integration hooks for weather and planar anomaly logic.

## 2) Design goals

- **Lore fidelity with mechanical traceability:** narrative identity and numerical behavior are both first-class.
- **Astronomy-inspired modeling:** phase, crossing, eclipse, and night-light logic depends on explicit orbital proxies.
- **Deterministic reproducibility:** seeded calculations remain stable for long campaigns.
- **Progressive reveal:** GM/private precision and player/public abstraction can coexist.
- **White-paper intent:** this file is a full design reference, not only a short operational summary.

## 3) Data model and authoritative sources

Primary moon constants and model controls in `calendar.js`:

- `EBERRON_MOON_CORE_DATA`
- `EBERRON_MOON_AMBIGUITIES`
- `MOON_SYSTEMS`
- `MOON_ORBITAL_DATA`
- `MOON_MOTION_TUNING`
- `MOON_LORE`
- `MOON_PRE_GENERATE_YEARS`
- `MOON_PREDICTION_LIMITS`
- `MOON_REVEAL_TIERS`
- `MOON_REVEAL_PRESETS`
- `MOON_REVEAL_RANGE_OPTIONS`

Runtime state tracks generated date windows, reveal tier/horizon, and shared player reveal records.

---

## 4) Complete mechanical moon tables (all settings)

### 4.1 Eberron: full moon-by-moon mechanics

| Moon | Title | Plane | Dragonmark | Synodic period (days) | Diameter (mi) | Distance (mi) | Inclination (°) | Eccentricity | Albedo | Variation shape | Variation amplitude | Epoch seed | Epoch reference date |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|---|
| Zarantyr | The Storm Moon | Kythri | Mark of Storm | 27.32 | 1250 | 14300 | 5.145 | 0.0549 | 0.12 | random | 1.4 | kythri | 998-01-01 |
| Olarune | The Sentinel Moon | Lamannia | Mark of Sentinel | 34.0 | 1000 | 18000 | 0.33 | 0.0288 | 0.22 | random | 1.7 | lamannia | 998-01-01 |
| Therendor | The Healer's Moon | Syrania | Mark of Healing | 24.0 | 1100 | 39000 | 0.47 | 0.0094 | 0.67 | random | 1.2 | syrania | 998-01-01 |
| Eyre | The Anvil | Fernia | Mark of Making | 21.0 | 1200 | 52000 | 0.43 | 0.1230 | 0.30 | random | 1.0 | fernia | 998-01-01 |
| Dravago | The Herder's Moon | Risia | Mark of Handling | 42.0 | 2000 | 77500 | 1.09 | 0.0001 | 1.229 | random | 2.1 | risia | 998-01-01 |
| Nymm | The Crown | Daanvi | Mark of Hospitality | 28.0 | 900 | 95000 | 0.20 | 0.0013 | 0.43 | random | 1.4 | daanvi | 998-01-01 |
| Lharvion | The Eye | Xoriat | Mark of Detection | 30.0 | 1350 | 125000 | 7.23 | 0.7507 | 0.155 | random | 1.5 | xoriat | 998-01-01 |
| Barrakas | The Lantern | Irian | Mark of Finding | 22.0 | 1500 | 144000 | 0.02 | 0.0047 | 1.375 | random | 1.1 | irian | 998-01-01 |
| Rhaan | The Book | Thelanis | Mark of Scribing | 37.0 | 800 | 168000 | 4.34 | 0.0013 | 0.32 | random | 1.9 | thelanis | 998-01-01 |
| Sypheros | The Shadow | Mabar | Mark of Shadow | 67.0 | 1100 | 183000 | 175.3 (retrograde) | 0.1635 | 0.06 | random | 3.4 | *(none)* | *(none)* |
| Aryth | The Gateway | Dolurrh | Mark of Passage | 48.0 | 1300 | 195000 | 7.57 | 0.0283 | 0.05 | random | 2.4 | dolurrh | 998-01-01 |
| Vult | The Warding Moon | Shavarath | Mark of Warding | 56.0 | 1800 | 252000 | 0.07 | 0.0014 | 0.23 | random | 2.8 | shavarath | 998-01-01 |

> Notes:
> - Eberron color, diameter, and distance are canonicalized in `EBERRON_MOON_CORE_DATA`.
> - Orbital proxies (inclination/eccentricity/albedo) are adapted from real-world candidate analogs.

### 4.2 Faerûnian (Toril): full mechanics

| Moon | Title | Synodic period (days) | Diameter (mi) | Distance (mi) | Inclination (°) | Eccentricity | Albedo | Variation shape | Variation amplitude | Epoch seed | Epoch reference date |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|---|
| Selûne | The Moonmaiden | 30.4375 | 2000 | 183000 | 5.1 | 0.054 | 0.25 | random | 1.5 | selune | 1372-01-01 |

### 4.3 Gregorian/Earth: full mechanics

| Moon | Title | Synodic period (days) | Diameter (mi) | Distance (mi) | Inclination (°) | Eccentricity | Albedo | Variation shape | Variation amplitude | Epoch seed | Epoch reference date |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|---|
| Luna | The Moon | 29.53059 | 2159 | 238855 | 5.14 | 0.0549 | 0.12 | random | 0.5 | luna | 2021-01-28 |

---

## 5) Eberron candidate moons and analog mechanics

### 5.1 Current analog mapping used by script

| Eberron moon | Current candidate analog | Candidate host planet | Candidate inclination (°) | Candidate eccentricity | Candidate albedo |
|---|---|---|---:|---:|---:|
| Zarantyr | Luna | Earth | 5.145 | 0.0549 | 0.12 |
| Olarune | Titan | Saturn | 0.33 | 0.0288 | 0.22 |
| Therendor | Europa | Jupiter | 0.47 | 0.0094 | 0.67 |
| Eyre | Hyperion | Saturn | 0.43 | 0.1230 | 0.30 |
| Dravago | Tethys | Saturn | 1.09 | 0.0001 | 1.229 |
| Nymm | Ganymede | Jupiter | 0.20 | 0.0013 | 0.43 |
| Lharvion | Nereid | Neptune | 7.23 | 0.7507 | 0.155 |
| Barrakas | Enceladus | Saturn | 0.02 | 0.0047 | 1.375 |
| Rhaan | Miranda | Uranus | 4.34 | 0.0013 | 0.32 |
| Sypheros | Phoebe | Saturn | 175.3 (retrograde) | 0.1635 | 0.06 |
| Aryth | Iapetus | Saturn | 7.57 | 0.0283 | 0.05 |
| Vult | Oberon | Uranus | 0.07 | 0.0014 | 0.23 |

### 5.2 Explicit ambiguity currently tracked

- **Lharvion**
  - current reference: **Nereid (Neptune)**
  - alternate seen in older lore: **Phoebe (Saturn)**
  - reason: current numeric profile in script (eccentricity `0.7507`, inclination `7.23°`) matches Nereid, while older lore references Phoebe.

### 5.3 Solar-system candidate pool (design appendix)

The script currently hardcodes one analog per Eberron moon (plus ambiguity notes), but this white-paper appendix restores the wider candidate catalog mindset for future retuning and replacement studies.

| Candidate moon | Host planet | Inclination (°) | Eccentricity | Albedo (approx.) | Notes |
|---|---|---:|---:|---:|---|
| Moon (Luna) | Earth | 5.145 | 0.0549 | 0.12 | Baseline terrestrial analog |
| Phobos | Mars | 1.08 | 0.0151 | 0.07 | Inner small irregular |
| Deimos | Mars | 1.79 | 0.0002 | 0.08 | Outer small irregular |
| Io | Jupiter | 0.05 | 0.0041 | 0.63 | Volcanic Galilean |
| Europa | Jupiter | 0.47 | 0.0094 | 0.67 | Ice shell/ocean analog |
| Ganymede | Jupiter | 0.20 | 0.0013 | 0.43 | Largest moon |
| Callisto | Jupiter | 0.28 | 0.0074 | 0.20 | Heavily cratered |
| Amalthea | Jupiter | 0.37 | 0.0032 | 0.09 | Inner Jovian |
| Himalia | Jupiter | 27.5 | 0.16 | 0.05 | Irregular prograde |
| Elara | Jupiter | 26.6 | 0.22 | 0.04 | Irregular |
| Pasiphae | Jupiter | 151.4 | 0.38 | 0.04 | Irregular retrograde |
| Sinope | Jupiter | 158.1 | 0.25 | 0.04 | Irregular retrograde |
| Lysithea | Jupiter | 28.3 | 0.11 | 0.04 | Irregular |
| Carme | Jupiter | 165.2 | 0.23 | 0.04 | Irregular retrograde |
| Ananke | Jupiter | 148.9 | 0.24 | 0.04 | Irregular retrograde |
| Leda | Jupiter | 26.6 | 0.16 | 0.04 | Irregular |
| Thebe | Jupiter | 1.08 | 0.018 | 0.05 | Inner Jovian |
| Adrastea | Jupiter | 0.03 | 0.0015 | 0.10 | Tiny inner moon |
| Metis | Jupiter | 0.06 | 0.007 | 0.06 | Inner ring shepherd |
| Mimas | Saturn | 1.53 | 0.0196 | 0.96 | Mid-sized icy |
| Enceladus | Saturn | 0.02 | 0.0047 | 1.375 | Bright, cryovolcanic |
| Tethys | Saturn | 1.09 | 0.0001 | 1.229 | Very circular orbit |
| Dione | Saturn | 0.03 | 0.0022 | 0.99 | Mid-sized icy |
| Rhea | Saturn | 0.35 | 0.0010 | 0.95 | Mid-sized icy |
| Titan | Saturn | 0.33 | 0.0288 | 0.22 | Atmosphere-rich |
| Hyperion | Saturn | 0.43 | 0.1230 | 0.30 | Chaotic tumbler |
| Iapetus | Saturn | 7.57 | 0.0283 | 0.05-0.50 | Two-tone surface |
| Phoebe | Saturn | 175.3 | 0.1635 | 0.06 | Retrograde irregular |
| Janus | Saturn | 0.16 | 0.0068 | 0.71 | Co-orbital with Epimetheus |
| Epimetheus | Saturn | 0.34 | 0.0098 | 0.73 | Co-orbital moon |
| Atlas | Saturn | 0.00 | 0.0012 | 0.44 | Ring shepherd |
| Prometheus | Saturn | 0.00 | 0.0022 | 0.60 | F-ring shepherd |
| Pandora | Saturn | 0.05 | 0.0042 | 0.60 | F-ring shepherd |
| Pan | Saturn | 0.00 | 0.0000 | 0.50 | Encke gap moon |
| Ymir | Saturn | 173.8 | 0.34 | 0.04 | Norse group irregular |
| Paaliaq | Saturn | 45.9 | 0.36 | 0.06 | Inuit group irregular |
| Tarvos | Saturn | 33.8 | 0.54 | 0.04 | Irregular |
| Kiviuq | Saturn | 46.1 | 0.33 | 0.06 | Irregular |
| Ijiraq | Saturn | 46.7 | 0.32 | 0.06 | Irregular |
| Suttungr | Saturn | 174.8 | 0.11 | 0.04 | Retrograde irregular |
| Uranus (major) Miranda | Uranus | 4.34 | 0.0013 | 0.32 | Current Rhaan analog |
| Ariel | Uranus | 0.04 | 0.0012 | 0.56 | Major Uranian |
| Umbriel | Uranus | 0.13 | 0.0039 | 0.26 | Major Uranian |
| Titania | Uranus | 0.08 | 0.0011 | 0.39 | Major Uranian |
| Oberon | Uranus | 0.07 | 0.0014 | 0.23 | Current Vult analog |
| Puck | Uranus | 0.32 | 0.0001 | 0.11 | Inner Uranian |
| Sycorax | Uranus | 159.4 | 0.52 | 0.07 | Irregular retrograde |
| Caliban | Uranus | 139.8 | 0.18 | 0.07 | Irregular retrograde |
| Prospero | Uranus | 152.0 | 0.44 | 0.07 | Irregular retrograde |
| Setebos | Uranus | 158.2 | 0.59 | 0.07 | Irregular retrograde |
| Stephano | Uranus | 143.0 | 0.23 | 0.07 | Irregular retrograde |
| Trinculo | Uranus | 167.0 | 0.22 | 0.07 | Irregular retrograde |
| Francisco | Uranus | 147.0 | 0.14 | 0.07 | Irregular retrograde |
| Margaret | Uranus | 57.0 | 0.66 | 0.07 | Irregular prograde |
| Neptune (major) Triton | Neptune | 156.8 | 0.00002 | 0.76 | Retrograde captured |
| Nereid | Neptune | 7.23 | 0.7507 | 0.155 | Current Lharvion analog |
| Proteus | Neptune | 0.08 | 0.0005 | 0.10 | Inner major irregular shape |
| Larissa | Neptune | 0.20 | 0.0014 | 0.09 | Inner Neptunian |
| Galatea | Neptune | 0.05 | 0.0002 | 0.08 | Ring shepherd |
| Despina | Neptune | 0.07 | 0.0001 | 0.09 | Inner Neptunian |
| Thalassa | Neptune | 0.21 | 0.0002 | 0.09 | Inner Neptunian |
| Naiad | Neptune | 4.75 | 0.0003 | 0.09 | Innermost Neptunian |
| Halimede | Neptune | 134.1 | 0.57 | 0.08 | Irregular retrograde |
| Sao | Neptune | 44.0 | 0.14 | 0.08 | Irregular prograde |
| Laomedeia | Neptune | 35.0 | 0.40 | 0.08 | Irregular prograde |
| Psamathe | Neptune | 137.0 | 0.45 | 0.08 | Irregular retrograde |
| Neso | Neptune | 136.0 | 0.57 | 0.08 | Distant irregular retrograde |
| Charon | Pluto | 0.00 | 0.0002 | 0.35 | Dwarf-planet satellite |
| Nix | Pluto | 0.13 | 0.0020 | 0.56 | Dwarf-planet satellite |
| Hydra | Pluto | 0.24 | 0.0059 | 0.83 | Dwarf-planet satellite |
| Kerberos | Pluto | 0.39 | 0.0033 | 0.56 | Dwarf-planet satellite |
| Styx | Pluto | 0.81 | 0.0058 | 0.65 | Dwarf-planet satellite |

> Appendix note: this candidate pool is for design research and replacement analog experiments. The active runtime mapping remains the explicit 12-moon Eberron table in `MOON_SYSTEMS`.

---

## 6) Processing pipeline

### 6.1 Sequence preparation

- Pre-generate moon sequences around today and request horizons.
- Expand windows on demand.
- Keep reveal expansions upgrade-only.
- Convert date/serial through calendar core utilities.

### 6.2 Phase and visibility evaluation

For each moon/day:

- compute normalized phase position,
- derive illuminated fraction and phase label,
- classify visibility window,
- annotate special conditions (including full/new and system-specific notes).

### 6.3 Secondary phenomena

- eclipse/notable overlap checks,
- moon-crossing proximity signals,
- aggregate night-light intensity,
- tide emphasis driven by moon data (including Eberron-specific weighting).

### 6.4 Reveal and delivery

- GM gets full fidelity.
- Player views use reveal tiers (`low`, `medium`, `high`) and bounded horizons.
- Reveal records are upgrade-only.

## 7) Commands and operator controls

Representative commands:

- `!cal moon`
- `!cal moon on <dateSpec>`
- `!cal moon upcoming [span]`
- `!cal moon send [low|medium|high] [range option]`
- panel controls for reveal presets/ranges.

## 8) Cross-subsystem interactions

- Moon context appears in today/upcoming summaries.
- Moon context can qualify planar anomaly triggers.
- Tide and night-light effects feed weather-facing outputs where relevant.

## 9) Tuning and extension guidance

- Preserve separation of canonical Eberron values vs candidate analog rationale.
- Re-verify full/new edge handling and crossing/eclipses when tuning periods/thresholds.
- For new settings, add explicit `MOON_SYSTEMS` profile entries and corresponding lore + reveal controls.
- Keep this design document synchronized with script constants whenever moon numbers change.
