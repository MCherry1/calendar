# Eberron-moons

## Purpose

Candidate reference moons and adaptation rules for building the Eberron moon model.

---

## Candidate moons (reference set)

| Host | Moon | Sidereal (days) | Synodic (days) | Eccentricity | Inclination (deg) | Color cue | Traits |
|---|---|---:|---:|---:|---:|---|---|
| Earth | Luna | 27.3217 | 29.5306 | 0.0549 | 5.145 | Gray/silver | Tidally locked; receding |
| Mars | Phobos | 0.3189 | 0.3190 | 0.0151 | 1.093 | Dark gray | Tidally locked; inward spiral |
| Mars | Deimos | 1.2624 | 1.2630 | 0.0003 | 0.93 | Dark gray | Tidally locked; outward drift |
| Jupiter | Europa | 3.5512 | 3.5513 | 0.0090 | 0.47 | White/tan | Subsurface ocean candidate |
| Jupiter | Ganymede | 7.1546 | 7.1549 | 0.0013 | 0.20 | Gray/brown | Largest moon; magnetic field |
| Saturn | Titan | 15.9450 | 15.9470 | 0.0288 | 0.35 | Orange-brown | Dense atmosphere |
| Saturn | Iapetus | 79.3215 | 79.3440 | 0.0286 | 15.47 | Two-tone | Strong albedo dichotomy |
| Uranus | Titania | 8.7059 | 8.7066 | 0.0011 | 0.08 | Gray | Largest Uranian moon |
| Uranus | Oberon | 13.4630 | 13.4640 | 0.0014 | 0.07 | Gray-red | Heavily cratered |
| Neptune | Triton | 5.8769 | 5.8774 | 0.000016 | 156.9 (retrograde) | Pink-gray | Retrograde; inward spiral |
| Neptune | Nereid | 360.1300 | 360.3900 | 0.7510 | 7.23 | Gray | Extremely eccentric |

---

## Eberron scaling fields

For each selected moon, compute:

- `Earth-year scale = sidereal_days / 365.25`
- `Eberron-year scale = sidereal_days / 336`
- `Adjusted synodic = scaled_synodic × integer_multiplier`

> The integer multiplier is intentionally synthetic and used to prevent unrealistically fast phase cycling after year-length scaling.

---

## Lore-constrained modeling notes

- **Lharvion:** do not clamp eccentricity away from reference value; swap reference moon if needed.
- **Barrakas + Therendor:** similar orbital families with closer inclinations; add weak anti-phase coupling (favor opposite phases without hard lock).
- **Dravago:** assign highest inclination to keep it typically away from other moons’ paths.
- **Zarantyr:** keep strong tide association, but do not over-specialize wind/precip effects.
- **Aryth:** support reminder-driven manifest-zone gameplay when full.

---

## Open implementation items

- [ ] Finalize 12-moon mapping and per-moon multipliers.
- [ ] Validate full/new thresholds to avoid multi-day duplicate “full moon” outcomes.
- [ ] Re-check eclipse and moon-crossing frequency after inclination updates.
---

## Candidate moons

This section is formatted as a **parseable candidate list** you can scan top-to-bottom while worldbuilding.

**Column notes**
- `Sidereal period` = orbital period around the host planet (stars-fixed frame).
- `Synodic period` = Sun-relative cycle as seen from the host planet.
- `Earth-year scale` = `sidereal_days / 365.25`.
- `Eberron-year scale` = `sidereal_days / 336` (Eberron calendar year).
- `Nodal precession` values are included when commonly published; otherwise marked `—`.

---

### Terrestrial-planet moon candidates

| Host planet | Moon | Color (visual) | Sidereal period (days) | Synodic period (days) | Earth-year scale | Eberron-year scale | Eccentricity | Inclination (deg) | Nodal precession | Traits / quirks |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|
| Earth | Moon (Luna) | Gray / silver | 27.3217 | 29.5306 | 0.0748 | 0.0813 | 0.0549 | 5.145 | 18.6-year node cycle | Tidally locked; receding from Earth (~3.8 cm/yr); stabilizes obliquity |
| Mars | Phobos | Dark gray | 0.3189 | 0.3190 | 0.0009 | 0.0009 | 0.0151 | 1.093 | — | Tidally locked; spiraling inward; may break into ring in geologic future |
| Mars | Deimos | Dark gray | 1.2624 | 1.2630 | 0.0035 | 0.0038 | 0.0003 | 0.93 | — | Tidally locked; slowly receding from Mars |

---

### Giant-planet moon candidates

| Host planet | Moon | Color (visual) | Sidereal period (days) | Synodic period (days) | Earth-year scale | Eberron-year scale | Eccentricity | Inclination (deg) | Nodal precession | Traits / quirks |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|
| Jupiter | Io | Yellow / orange | 1.7691 | 1.7692 | 0.0048 | 0.0053 | 0.0041 | 0.05 | — | Most volcanically active body known; tidal heating from resonance |
| Jupiter | Europa | White / tan with cracks | 3.5512 | 3.5513 | 0.0097 | 0.0106 | 0.009 | 0.47 | — | Global subsurface ocean candidate; tidally locked |
| Jupiter | Ganymede | Gray / brown | 7.1546 | 7.1549 | 0.0196 | 0.0213 | 0.0013 | 0.20 | — | Largest moon in Solar System; intrinsic magnetic field |
| Jupiter | Callisto | Dark gray / brown | 16.689 | 16.691 | 0.0457 | 0.0497 | 0.0074 | 0.28 | — | Heavily cratered ancient surface; weakly differentiated interior |
| Jupiter | Amalthea | Reddish | 0.4982 | 0.4982 | 0.0014 | 0.0015 | 0.0032 | 0.38 | — | Very low density; likely porous/icy despite red surface |
| Jupiter | Himalia | Gray-brown | 250.57 | 251.05 | 0.6860 | 0.7457 | 0.162 | 27.5 | — | Irregular prograde outer moon |
| Jupiter | Elara | Gray-brown | 259.64 | 260.16 | 0.7109 | 0.7727 | 0.217 | 26.6 | — | Irregular prograde outer moon |
| Jupiter | Pasiphae | Dark gray | 743.63 | 747.38 | 2.0366 | 2.2132 | 0.409 | 148.2 (retrograde) | — | Irregular retrograde, likely captured |
| Jupiter | Sinope | Dark red-gray | 758.90 | 762.84 | 2.0771 | 2.2586 | 0.249 | 158.1 (retrograde) | — | Irregular retrograde, distant orbit |
| Saturn | Mimas | Gray | 0.9424 | 0.9424 | 0.0026 | 0.0028 | 0.0196 | 1.57 | — | Large Herschel crater; tidally locked |
| Saturn | Enceladus | Bright white | 1.3702 | 1.3702 | 0.0038 | 0.0041 | 0.0047 | 0.01 | — | South-polar plumes; subsurface ocean; high astrobiology interest |
| Saturn | Tethys | Gray-white | 1.8878 | 1.8878 | 0.0052 | 0.0056 | 0.0001 | 1.09 | — | Tidally locked; giant Ithaca Chasma |
| Saturn | Dione | Gray-white | 2.7369 | 2.7370 | 0.0075 | 0.0081 | 0.0022 | 0.02 | — | Tenuous exosphere; bright wispy terrain |
| Saturn | Rhea | Gray-white | 4.5182 | 4.5183 | 0.0124 | 0.0134 | 0.0010 | 0.35 | — | Tidally locked; possible tenuous oxygen/carbon-dioxide exosphere |
| Saturn | Titan | Orange-brown | 15.945 | 15.947 | 0.0437 | 0.0475 | 0.0288 | 0.35 | — | Dense nitrogen atmosphere; methane weather cycle |
| Saturn | Iapetus | Two-tone dark/bright | 79.3215 | 79.344 | 0.2172 | 0.2361 | 0.0286 | 15.47 | — | Extreme albedo dichotomy; equatorial ridge |
| Saturn | Phoebe | Dark gray | 550.48 | 551.91 | 1.5071 | 1.6383 | 0.163 | 175.3 (retrograde) | — | Captured irregular retrograde moon |
| Uranus | Miranda | Gray | 1.4135 | 1.4136 | 0.0039 | 0.0042 | 0.0013 | 4.34 | — | Extreme tectonic coronae; likely resurfaced |
| Uranus | Ariel | Gray-white | 2.5204 | 2.5205 | 0.0069 | 0.0075 | 0.0012 | 0.04 | — | Youngest major Uranian surface (fewer craters) |
| Uranus | Umbriel | Dark gray | 4.1442 | 4.1444 | 0.0113 | 0.0123 | 0.0039 | 0.13 | — | Darkest major Uranian moon |
| Uranus | Titania | Gray | 8.7059 | 8.7066 | 0.0238 | 0.0259 | 0.0011 | 0.08 | — | Largest Uranian moon |
| Uranus | Oberon | Gray-red | 13.463 | 13.464 | 0.0369 | 0.0401 | 0.0014 | 0.07 | — | Outer major moon; heavily cratered |
| Uranus | Sycorax | Dark red-gray | 1288.28 | 1291.42 | 3.5278 | 3.8342 | 0.522 | 153.3 (retrograde) | — | Irregular retrograde captured moon |
| Neptune | Triton | Pink-gray | 5.8769 (retrograde) | 5.8774 | 0.0161 | 0.0175 | 0.000016 | 156.9 (retrograde) | Nodal cycle ~hundreds of years (model-dependent) | Tidally locked; spiraling inward; active nitrogen geysers |
| Neptune | Nereid | Gray | 360.13 | 360.39 | 0.9859 | 1.0718 | 0.751 | 7.23 | — | Extremely eccentric orbit |
| Neptune | Proteus | Dark gray | 1.1223 | 1.1223 | 0.0031 | 0.0033 | 0.0005 | 0.52 | — | Near-spherical limit body; heavily cratered |
| Neptune | Larissa | Dark | 0.5547 | 0.5547 | 0.0015 | 0.0017 | 0.0014 | 0.20 | — | Inner moon, tidally evolving |

---

### Usage notes for Eberron adaptation

- If you want **12 Eberron moons**, a practical method is to choose by **narrative role** (inner fast moon, life-bearing/ocean-linked moon, outer omen moon, retrograde omen moon, etc.) from the table above.
- For quick conversion to Eberron calendar structure, treat the `Eberron-year scale` as a direct “fraction of a 336-day year per orbit.”
- Where nodal precession is missing, it can be assigned procedurally (e.g., 6-year, 12-year, or 24-year node cycles) to tune eclipse frequency and omen cadence.
