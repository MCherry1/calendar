# Moon Reference Selection

**Status:** open
**Blocking:** tasks.md — Phase 1 moon tasks (orbital parameters, Barrakas/Therendor, Dravago, Lharvion)

---

## Design Parameters

This section records the rules governing how reference moons are used. These are settled design decisions.

**What comes from the reference moon:**
- Inclination (orbital tilt)
- Eccentricity (orbital ellipse shape)
- Albedo (reflectivity, affects lux calculation)

**What does NOT come from the reference moon:**
- Synodic period — designed independently for game playability. Real synodic periods, even scaled to a 336-day year, are too short for useful game design. Eberron periods are designed values. The reference selection columns show the scaled base period and the integer multiplier needed to reach the designed period — this is informational and kept for design transparency.
- Color — comes from Eberron canon (sourcebook descriptions). Albedo affects brightness in lux calculations; color is a visual description only.
- Diameter and mean orbital distance — designed values for this script, informed by plausible orbital spacing. Not from the reference moon.

**The rule on modification:** Reference moon parameters are taken as-is. We do not clamp, adjust, or smooth any of them. If a reference moon's eccentricity causes orbit overlap or any other problem, the fix is to choose a different reference moon — not to modify the parameter.

**The sidereal/synodic note:** Eberron has no use for sidereal period. All period math is synodic only.

---

## Eberron Moon Canon Data

These are the in-game properties of each moon. Colors are from lore descriptions — verify against sourcebook if precision matters. Diameters and distances are designed values for orbital plausibility.

| Moon | Title | Plane | Dragonmark | Color *(verify)* | Diameter (mi) | Mean Distance (mi) | Synodic Period (days) |
|---|---|---|---|---|---:|---:|---:|
| Zarantyr | The Storm Moon | Kythri | Mark of Storm | Blue-white | 1,250 | 14,300 | 27.32 |
| Olarune | The Sentinel Moon | Lamannia | Mark of Sentinel | Gray | 1,000 | 18,000 | 34.0 |
| Therendor | The Healer's Moon | Syrania | Mark of Healing | Pale gold | 1,100 | 39,000 | 24.0 |
| Eyre | The Anvil | Fernia | Mark of Making | Red-orange | 1,200 | 52,000 | 21.0 |
| Dravago | The Herder's Moon | Risia | Mark of Handling | Purple | 2,000 | 77,500 | 42.0 |
| Nymm | The Crown | Daanvi | Mark of Hospitality | Gold | 900 | 95,000 | 28.0 |
| Lharvion | The Eye | Xoriat | Mark of Detection | Green | 1,350 | 125,000 | 30.0 |
| Barrakas | The Lantern | Irian | Mark of Finding | Brilliant white | 1,500 | 144,000 | 22.0 |
| Rhaan | The Book | Thelanis | Mark of Scribing | Pale blue *(uncertain)* | 800 | 168,000 | 37.0 |
| Sypheros | The Shadow | Mabar | Mark of Shadow | Black | 1,100 | 183,000 | 67.0 |
| Aryth | The Gateway | Dolurrh | Mark of Passage | Deep blue | 1,300 | 195,000 | 48.0 |
| Vult | The Warding Moon | Shavarath | Mark of Warding | Dark red | 1,800 | 252,000 | 56.0 |

---

## Current Reference Mapping — Parameters

The parameters in use by the script right now. Problems are noted.

| Eberron Moon | Reference | Host | Inclination | Eccentricity | Albedo | Status |
|---|---|---|---:|---:|---:|---|
| Zarantyr | Luna | Earth | 5.145° | 0.0549 | 0.12 | ✓ keep |
| Olarune | Titan | Saturn | 0.33° | 0.0288 | 0.22 | ✓ keep |
| Therendor | Europa | Jupiter | 0.47° | 0.0094 | 0.67 | ✗ inclination too different from Barrakas |
| Eyre | Hyperion | Saturn | 0.43° | 0.1230 | 0.30 | → propose to move to Lharvion |
| Dravago | Tethys | Saturn | 1.09° | 0.0001 | 1.229 | ✗ inclination must be highest of all moons; 1.09° is not |
| Nymm | Ganymede | Jupiter | 0.20° | 0.0013 | 0.43 | ✓ keep |
| Lharvion | Nereid | Neptune | 7.23° | 0.7507 | 0.155 | ✗ eccentricity causes orbit overlap (see math below) |
| Barrakas | Enceladus | Saturn | 0.02° | 0.0047 | 1.375 | ✓ keep |
| Rhaan | Miranda | Uranus | 4.34° | 0.0013 | 0.32 | ✓ keep |
| Sypheros | Phoebe | Saturn | 175.3° | 0.1635 | 0.06 | ✓ keep (retrograde, dark) |
| Aryth | Iapetus | Saturn | 7.57° | 0.0283 | 0.05–0.50 | ✓ keep (see note on albedo below) |
| Vult | Oberon | Uranus | 0.07° | 0.0014 | 0.23 | ✓ keep |

---

## Orbit Overlap Math

For each moon with eccentricity `e` and mean distance `d`:
- Periapsis (closest approach): `d × (1 − e)`
- Apoapsis (farthest): `d × (1 + e)`

Orbits overlap when one moon's periapsis falls inside another moon's apoapsis.

**Lharvion / Nereid (e = 0.7507, d = 125,000 mi):**
```
periapsis = 125,000 × (1 − 0.7507) = 31,163 mi
apoapsis  = 125,000 × (1 + 0.7507) = 218,838 mi
```
Therendor's apoapsis (e = 0.0094, d = 39,000): `39,000 × 1.0094 = 39,367 mi`

Lharvion periapsis (31,163) < Therendor apoapsis (39,367) → **orbital bands overlap**. The script clamped eccentricity to resolve this. Per design rules, we pick a different reference instead.

---

## Candidate Analysis

### Dravago — needs highest inclination

**Constraint:** inclination must exceed every other moon in the system, including Aryth (7.57°, currently highest prograde).

Current reference Tethys (1.09°) fails — many moons already exceed it.

**Candidates:**

| Candidate | Host | Inclination | Eccentricity | Albedo | Notes |
|---|---|---:|---:|---:|---|
| **Himalia** | Jupiter | **27.5°** | 0.16 | 0.05 | Prograde irregular; clearly highest |
| Nereid | Neptune | 7.23° | 0.7507 | 0.155 | Borderline: 7.23° < 7.57° (Aryth), fails constraint |
| Sycorax | Uranus | 159.4° | 0.52 | 0.07 | Retrograde — retrograde should be reserved for Sypheros |
| Halimede | Neptune | 134.1° | 0.57 | 0.08 | Retrograde, very high eccentricity |

**Orbit check for Himalia (e = 0.16, d = 77,500 mi):**
```
periapsis = 77,500 × 0.84 = 65,100 mi   (vs Eyre apoapsis: 52,000 × 1.123 ≈ 52,214 mi) ✓ no overlap
apoapsis  = 77,500 × 1.16 = 89,900 mi   (vs Nymm periapsis: 95,000 × 0.9987 ≈ 94,877 mi) ✓ no overlap
```

With 27.5° inclination, Dravago spends most of its time far above and below the ecliptic plane — mechanically reinforcing "typically keeps at a distance."

**Note on albedo:** Himalia's albedo is 0.05 (very dark). Dravago is described as purple in lore. This means it reflects very little light even when full — it will appear dim in the sky and contribute little to night lighting. This is a consequence of using the reference unchanged. It's worth knowing before committing.

**Recommendation: Himalia**

---

### Therendor — needs inclination matching Barrakas

**Constraint:** Barrakas (Enceladus, 0.02°) and Therendor must have nearly identical inclinations to produce frequent mutual eclipses and support the weak phase coupling.

Current reference Europa (0.47°) is 23× the inclination of Enceladus — far too different.

**Candidates (low inclination, low eccentricity, reasonable albedo):**

| Candidate | Host | Inclination | Eccentricity | Albedo | Notes |
|---|---|---:|---:|---:|---|
| **Dione** | Saturn | **0.03°** | 0.0022 | 0.99 | Nearly identical to Enceladus (0.02°); very bright |
| Ariel | Uranus | 0.04° | 0.0012 | 0.56 | Close match; less bright |
| Io | Jupiter | 0.05° | 0.0041 | 0.63 | Close match; volcanic identity — better suited to Eyre |
| Callisto | Jupiter | 0.28° | 0.0074 | 0.20 | Gap with Enceladus still 14× |

**Orbit check for Dione (e = 0.0022, d = 39,000 mi):**
```
periapsis = 39,000 × 0.9978 = 38,914 mi   (vs Olarune apoapsis: 18,000 × 1.0288 = 18,518 mi) ✓
apoapsis  = 39,000 × 1.0022 = 39,086 mi   (vs Eyre periapsis: 52,000 × 0.9041 = 47,013 mi*) ✓
```
*Eyre gets new reference below.

Therendor (Dione, 0.99 albedo) and Barrakas (Enceladus, 1.375 albedo) will be the two brightest moons in the sky — fitting for the Healer's Moon and the Lantern.

**Recommendation: Dione**

---

### Lharvion — needs no orbit overlap, Xoriat / madness theme

**Constraint:** eccentricity must not be clamped. If the reference causes orbital band overlap with any other moon, pick a different reference.

Nereid (0.7507 ecc) causes overlap with Therendor's orbital band. A new reference is needed.

Hyperion is currently assigned to Eyre but Eyre is being reassigned. This makes Hyperion available.

**Hyperion (Saturn, 0.43° inclination, 0.1230 ecc, 0.30 albedo):**

Hyperion is the most chaotic rotating body in the Solar System. Its tumbling rotation is genuinely unpredictable — it never settles into a stable spin. This is an unusually good thematic match for Xoriat (the Realm of Madness) and The Eye.

**Orbit check (e = 0.1230, d = 125,000 mi):**
```
periapsis = 125,000 × 0.877 = 109,625 mi
apoapsis  = 125,000 × 1.123 = 140,375 mi
```
Nymm apoapsis (e = 0.0013, d = 95,000): `95,000 × 1.0013 = 95,124 mi` → gap of 14,501 mi ✓
Barrakas periapsis (e = 0.0047, d = 144,000): `144,000 × 0.9953 = 143,323 mi` → gap of 2,948 mi ✓

No orbital band overlap. No clamping needed.

**Recommendation: Hyperion**

---

### Eyre — needs replacement (Hyperion moves to Lharvion)

Eyre is the Anvil, associated with Fernia (the Sea of Fire) and the Mark of Making. A forge and fire identity.

**Io (Jupiter, 0.05° inclination, 0.0041 ecc, 0.63 albedo):**

Io is the most volcanically active body in the Solar System — hundreds of active volcanoes, sulfur plains, constant geological upheaval. It is the Solar System's closest physical analog to a fire realm. This is a very strong thematic match for Fernia and the Anvil.

Very circular orbit (ecc 0.0041) and low inclination (0.05°) means Eyre stays reliably in the ecliptic and moves at a steady pace — appropriate for a craftsman's moon.

**Orbit check (e = 0.0041, d = 52,000 mi):**
```
periapsis = 52,000 × 0.9959 = 51,787 mi
apoapsis  = 52,000 × 1.0041 = 52,213 mi
```
Therendor apoapsis (Dione, e = 0.0022, d = 39,000): `39,086 mi` → gap of 12,701 mi ✓
Dravago periapsis (Himalia, e = 0.16, d = 77,500): `65,100 mi` → gap of 12,887 mi ✓

**Recommendation: Io**

---

## Proposed Final Mapping

Four changes. Eight unchanged.

| Eberron Moon | Proposed Reference | Change | Inclination | Eccentricity | Albedo |
|---|---|---|---:|---:|---:|
| Zarantyr | Luna | — | 5.145° | 0.0549 | 0.12 |
| Olarune | Titan | — | 0.33° | 0.0288 | 0.22 |
| Therendor | **Dione** | Europa → Dione | **0.03°** | **0.0022** | **0.99** |
| Eyre | **Io** | Hyperion → Io | **0.05°** | **0.0041** | **0.63** |
| Dravago | **Himalia** | Tethys → Himalia | **27.5°** | **0.16** | **0.05** |
| Nymm | Ganymede | — | 0.20° | 0.0013 | 0.43 |
| Lharvion | **Hyperion** | Nereid → Hyperion | **0.43°** | **0.1230** | **0.30** |
| Barrakas | Enceladus | — | 0.02° | 0.0047 | 1.375 |
| Rhaan | Miranda | — | 4.34° | 0.0013 | 0.32 |
| Sypheros | Phoebe | — | 175.3° | 0.1635 | 0.06 |
| Aryth | Iapetus | — | 7.57° | 0.0283 | 0.05 |
| Vult | Oberon | — | 0.07° | 0.0014 | 0.23 |

**Inclination ordering (prograde):** Barrakas 0.02° < Therendor 0.03° ≈ Eyre 0.05° < Vult 0.07° < Olarune 0.33° < Nymm 0.20° < Lharvion 0.43° < Zarantyr 5.145° < Rhaan 4.34° < Aryth 7.57° < **Dravago 27.5°** — Dravago is highest prograde ✓

Sypheros (Phoebe, 175.3°) remains the only retrograde moon.

---

## Period Scaling Reference

Informational only — Eberron's synodic periods are designed values and are not changed. This table shows how the reference moon's real synodic period scales to a 336-day year, and what integer gives the closest match to the designed period.

| Eberron Moon | Designed Period | Reference | Real Synodic (days, Earth) | Scaled to 336d year | Best Integer × | Scaled × integer |
|---|---:|---|---:|---:|---:|---:|
| Zarantyr | 27.32 | Luna | 29.53 | 27.17 | ×1 | 27.17 |
| Olarune | 34.0 | Titan | ~383 (sidereal ~15.9d) | ~14.6 | ×2 | 29.2 |
| Therendor | 24.0 | **Dione** | ~2.74 | 2.52 | ×10 | 25.2 |
| Eyre | 21.0 | **Io** | ~1.77 | 1.63 | ×13 | 21.2 |
| Dravago | 42.0 | **Himalia** | ~250 (sidereal) | ~230 | ÷5 | 46 |
| Nymm | 28.0 | Ganymede | ~7.16 | 6.59 | ×4 | 26.4 |
| Lharvion | 30.0 | **Hyperion** | ~21.28 | 19.58 | ×2 | 39.2 |
| Barrakas | 22.0 | Enceladus | ~1.37 | 1.26 | ×17 | 21.4 |
| Rhaan | 37.0 | Miranda | ~1.41 | 1.30 | ×28 | 36.4 |
| Sypheros | 67.0 | Phoebe | ~548 (sidereal) | ~504 | ÷8 | 63 |
| Aryth | 48.0 | Iapetus | ~79.3 | 72.9 | ÷2 (×0.5) | 36.5 |
| Vult | 56.0 | Oberon | ~13.46 | 12.38 | ×5 | 61.9 |

Note: for irregular moons with very long sidereal periods (Himalia, Phoebe) the "synodic" period relative to the sun is approximately the sidereal period. For small inner moons (Enceladus, Io, Dione) the real synodic period is much shorter than even a Eberron game day, so large multipliers are expected. The designed periods are the gameplay truth; this table is design bookkeeping.

---

## Remaining Open Questions

1. **Dravago albedo:** Himalia has albedo 0.05 — very dark. Dravago is described as purple in lore. A dark albedo means it contributes almost nothing to nighttime lighting even when full. Is this acceptable, or does it warrant choosing a different high-inclination reference that's less dark? *There are no obviously better prograde alternatives above 10° inclination in the candidate pool.*

2. **Aryth / Iapetus albedo:** Iapetus is two-toned (leading face 0.05, trailing face 0.50). The current script uses 0.05. For Dolurrh (the Realm of the Dead / gateway), is the dark face correct? Could argue the passage between life and death is captured by the two-tone nature itself, but the lux calculation needs a single value.

3. **Moon colors:** The color column should be verified against the sourcebook. Rhaan in particular is uncertain.

4. **Barrakas/Therendor weak phase coupling:** the lore calls for a tendency toward opposite phases without hard lock. This is a math/implementation question, not a reference selection question. It should become its own task once this design discussion concludes.

---

## Resulting Actions

When this discussion is resolved (questions 1–3 answered):

- [ ] Update DESIGN.md §7.3 with verified moon colors
- [ ] Update DESIGN.md §7.4 with final reference mapping table
- [ ] Add task to tasks.md Phase 1: "Update Therendor reference to Dione (inc 0.03°, ecc 0.0022, albedo 0.99)"
- [ ] Add task to tasks.md Phase 1: "Update Eyre reference to Io (inc 0.05°, ecc 0.0041, albedo 0.63)"
- [ ] Add task to tasks.md Phase 1: "Update Dravago reference to Himalia (inc 27.5°, ecc 0.16, albedo 0.05)"
- [ ] Add task to tasks.md Phase 1: "Update Lharvion reference to Hyperion (inc 0.43°, ecc 0.1230, albedo 0.30); verify no clamping"
- [ ] Add task to tasks.md Phase 1: "Add weak anti-phase coupling between Therendor and Barrakas"
- [ ] Add task to tasks.md Phase 1: "Update period scaling table in DESIGN.md with final integer multipliers"
