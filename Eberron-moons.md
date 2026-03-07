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
