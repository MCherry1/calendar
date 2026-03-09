# Moon Reference Selection

**Status:** open
**Blocking:** tasks.md — Phase 1 moon tasks (orbital parameters, Barrakas/Therendor, Dravago, Lharvion)

---

## Design Parameters

**What comes from the reference moon:**
- Inclination (orbital tilt)
- Eccentricity (orbital ellipse shape) — `distanceSwingPct` in `MOON_MOTION_TUNING` = `2 × eccentricity`
- Albedo (reflectivity, feeds lux calculation)

**What does NOT come from the reference moon:**
- Synodic period — designed independently for game playability. Real synodic periods scaled to a 336-day year are too short to be useful. Eberron periods are designed values.
- Color — set in `EBERRON_MOON_CORE_DATA`. Completely independent of the reference moon. Albedo (from reference) affects brightness; color is visual description only.
- Diameter and mean orbital distance — designed values in `EBERRON_MOON_CORE_DATA`.
- Nodal precession rate (`nodePrecessionDegPerYear`) — designed value in `MOON_MOTION_TUNING`. How fast the orbital plane "hula hoops" around the planet. The reference moon's inclination sets the tilt angle; the precession rate is a separate design decision.
- Apsidal precession rate (`apsisPrecessionDegPerYear`) — designed value. How fast the ellipse itself rotates within its orbital plane.

**The rule on modification:** Reference moon parameters (inclination, eccentricity, albedo) are taken as-is. If a reference causes a problem, pick a different reference — do not adjust the values.

**Period:** the one exception. Eberron uses designed synodic periods, not scaled real ones. The period scaling table is kept for design transparency only.

---

## Precession Model (Already in Script)

`MOON_MOTION_TUNING` in the script contains per-moon precession parameters. Both types of precession are already modeled:

- `nodePrecessionDegPerYear` — the orbital **plane** rotates around the planet (the "hula hoop" effect). High inclination + fast precession = dramatic sky sweep.
- `apsisPrecessionDegPerYear` — the **ellipse** rotates within its plane (the apsis rotates). Relevant to the bellows character of Eyre.

Current Eyre tuning from the script:
```
nodePrecessionDegPerYear:  2      ← very slow (360° over 180 years)
apsisPrecessionDegPerYear: 120    ← fastest of any moon (360° over 3 years)
distanceSwingPct:          0.246  ← = 2 × Hyperion eccentricity 0.1230
```

So Eyre **already** has the hula hoop — but set to 2°/year, which is nearly imperceptible. And it has the fastest apsidal precession of any moon: the forge ellipse spins a full cycle every 3 years. The coding task for Eyre should increase `nodePrecessionDegPerYear` alongside the reference change.

---

## Eberron Moon Canon Data

Colors are from `EBERRON_MOON_CORE_DATA` in the script (authoritative). Diameters and distances are designed values.

| Moon | Title | Plane | Dragonmark | Color (hex) | Visual | Diameter (mi) | Mean Distance (mi) | Synodic Period (days) |
|---|---|---|---|---|---|---:|---:|---:|
| Zarantyr | The Storm Moon | Kythri | Mark of Storm | `#F5F5FA` | Pearl white | 1,250 | 14,300 | 27.32 |
| Olarune | The Sentinel Moon | Lamannia | Mark of Sentinel | `#FFC68A` | Warm orange | 1,000 | 18,000 | 34.0 |
| Therendor | The Healer's Moon | Syrania | Mark of Healing | `#D3D3D3` | Silver-gray | 1,100 | 39,000 | 24.0 |
| Eyre | The Anvil | Fernia | Mark of Making | `#C0C0C0` | Silver-metallic | 1,200 | 52,000 | 21.0 |
| Dravago | The Herder's Moon | Risia | Mark of Handling | `#E6E6FA` | Lavender | 2,000 | 77,500 | 42.0 |
| Nymm | The Crown | Daanvi | Mark of Hospitality | `#FFD96B` | Gold | 900 | 95,000 | 28.0 |
| Lharvion | The Eye | Xoriat | Mark of Detection | `#F5F5F5` | Near-white | 1,350 | 125,000 | 30.0 |
| Barrakas | The Lantern | Irian | Mark of Finding | `#F0F8FF` | Ice-white | 1,500 | 144,000 | 22.0 |
| Rhaan | The Book | Thelanis | Mark of Scribing | `#9AC0FF` | Pale blue | 800 | 168,000 | 37.0 |
| Sypheros | The Shadow | Mabar | Mark of Shadow | `#696969` | Dim gray | 1,100 | 183,000 | 67.0 |
| Aryth | The Gateway | Dolurrh | Mark of Passage | `#FF4500` | Orange-red | 1,300 | 195,000 | 48.0 |
| Vult | The Warding Moon | Shavarath | Mark of Warding | `#A9A9A9` | Medium gray | 1,800 | 252,000 | 56.0 |

> **Aryth color note:** The script has Aryth as `#FF4500` (orange-red), consistent with its autumnal associations (month 11, harvest/ending). This is the canonical value in the script regardless of any prior verbal description.

---

## Current Reference Mapping — Parameters

| Eberron Moon | Reference | Host | Inclination | Eccentricity | Albedo | Status |
|---|---|---|---:|---:|---:|---|
| Zarantyr | Luna | Earth | 5.145° | 0.0549 | 0.12 | ✓ keep |
| Olarune | Titan | Saturn | 0.33° | 0.0288 | 0.22 | ✓ keep |
| Therendor | Europa | Jupiter | 0.47° | 0.0094 | 0.67 | ✗ inclination too different from Barrakas |
| Eyre | Hyperion | Saturn | 0.43° | 0.1230 | 0.30 | ✗ eccentricity not high enough; nodal precession too low to be useful at this inclination |
| Dravago | Tethys | Saturn | 1.09° | 0.0001 | 1.229 | ✗ inclination must be highest; 1.09° fails; Tethys is nearly white but inclination is wrong |
| Nymm | Ganymede | Jupiter | 0.20° | 0.0013 | 0.43 | ✓ keep |
| Lharvion | Nereid | Neptune | 7.23° | 0.7507 | 0.155 | ✗ eccentricity causes orbital band overlap with Therendor (see math below) |
| Barrakas | Enceladus | Saturn | 0.02° | 0.0047 | 1.375 | ✓ keep |
| Rhaan | Miranda | Uranus | 4.34° | 0.0013 | 0.32 | ✓ keep |
| Sypheros | Phoebe | Saturn | 175.3° | 0.1635 | 0.06 | ✓ keep (retrograde, dark, Shadow) |
| Aryth | Iapetus | Saturn | 7.57° | 0.0283 | 0.05–0.50 | ✓ keep reference; albedo treatment open |
| Vult | Oberon | Uranus | 0.07° | 0.0014 | 0.23 | ✓ keep |

---

## Orbit Overlap Math

`periapsis = d × (1 − e)` · `apoapsis = d × (1 + e)` · overlap when inner apoapsis > outer periapsis.

**Lharvion / Nereid (e = 0.7507, d = 125,000 mi):**
```
periapsis = 31,163 mi
```
Therendor apoapsis (Europa, e = 0.0094): `39,367 mi` → Lharvion periapsis 31,163 < 39,367 = **orbital bands overlap**. Script was clamping; design rule says pick a different reference instead.

**Sypheros / Phoebe (e = 0.1635, d = 183,000 mi) — pre-existing, acceptable:**
```
periapsis = 153,080 mi < Rhaan apoapsis 168,218 mi  (overlap with Rhaan)
apoapsis  = 212,921 mi > Aryth periapsis 189,482 mi  (overlap with Aryth)
```
Sypheros (175.3° retrograde) is nearly perpendicular to all prograde moons. The 2D band overlaps exist but the moons never physically approach each other. This was true in the original mapping and is unchanged.

---

## Candidate Analysis

### Dravago — highest inclination, lavender, must be bright

**Constraints:**
1. Inclination must exceed every other moon in the system
2. Canon color is lavender (`#E6E6FA`) — the moon sheds purple dust; it must be visibly bright

**The tension:** High-inclination moons in the Solar System are captured irregular objects — dark (albedo 0.04–0.08). Bright moons are regular moons formed in the protoplanetary disk — low inclination. These properties don't co-occur naturally.

**The retrograde solution — Triton:**

Triton (Neptune) is a captured Kuiper Belt object, retrograde at 156.8°, but unlike other captured irregulars it has been tidally heated and resurfaced with nitrogen ice — making it one of the brightest moons in the Solar System (albedo 0.76). It's the only high-inclination moon that is also genuinely bright.

| Property | Triton |
|---|---|
| Host | Neptune |
| Inclination | 156.8° (retrograde) |
| Eccentricity | 0.00002 (nearly perfect circle) |
| Albedo | 0.76 |
| Surface | Nitrogen ice, cantaloupe terrain, active geysers |

**Orbit check (e ≈ 0, d = 77,500 mi):** periapsis ≈ apoapsis ≈ 77,499 mi. Adjacent gap to Nymm (95,000 mi) = 17,375 mi. ✓ Plenty of room.

**Thematic fit:**
- Risia (Plain of Ice) + Triton (nitrogen ice, coldest active world in the Solar System): strong match
- "Keeps at a distance from other moons" → retrograde orbit travels opposite to all other moons; rather than being high above/below, it passes them head-on and always moves away
- Lavender color + bright albedo 0.76 → visibly illuminates at night sky ✓

**On having two retrograde moons:** Sypheros (175.3°) and Dravago (156.8°) would both be retrograde. They're clearly distinguishable in inclination and will appear to move backward across the sky but at different rates and paths. This is unusual and can be presented as a feature: these are the two moons that "go against the grain."

**Orbit check — full system with Dravago as Triton and Eyre as Elara:**

| Adjacent pair | Inner apo | Outer peri | Gap | Status |
|---|---:|---:|---:|---|
| Therendor / Eyre | 39,086 | 40,716 | 1,630 mi | ✓ (tight but clear) |
| Eyre / Dravago | 63,284 | 77,498 | 14,214 mi | ✓ |
| Dravago / Nymm | 77,502 | 94,877 | 17,375 mi | ✓ |
| Nymm / Lharvion | 95,124 | 109,625 | 14,501 mi | ✓ |
| Lharvion / Barrakas | 140,375 | 143,323 | 2,948 mi | ✓ (tight but clear) |

**Recommendation: Triton**

---

### Therendor — needs inclination matching Barrakas (Enceladus, 0.02°)

**Recommendation unchanged: Dione** (Saturn, 0.03°, 0.0022 ecc, 0.99 albedo)

Dione's 0.03° is essentially co-planar with Enceladus's 0.02°. Albedo 0.99 makes Therendor very bright — fitting for Syrania/healing. Two bright moons (Therendor + Barrakas) orbiting nearly the same plane, with frequent mutual eclipses.

---

### Eyre — higher eccentricity, meaningful inclination for nodal precession

**What the user wants:** forge-bellows behavior (swings dramatically closer and farther) and a "hula hoop" orbital plane swing. The model already supports both via `MOON_MOTION_TUNING`.

**What the current reference gives:** Hyperion (0.43°, 0.1230 ecc) → the inclination is too low for nodal precession to be visually meaningful, and eccentricity only moderate. The apsidal precession (120°/year) is already the fastest of any moon.

To get visible nodal precession, inclination should be substantial — at least 15°, ideally higher. Higher eccentricity satisfies the bellows. Both point toward a prograde irregular moon.

**Candidates:**

| Candidate | Host | Inclination | Eccentricity | Albedo | Notes |
|---|---|---:|---:|---:|---|
| **Elara** | Jupiter | 26.6° | 0.217 | 0.05 | Prograde irregular; ecc 77% higher than Hyperion |
| **Siarnaq** | Saturn | 45.8° | 0.296 | ~0.05 | Prograde irregular; ecc 140% higher than Hyperion; not in current pool |
| Himalia | Jupiter | 27.5° | 0.16 | 0.05 | Prograde; 30% higher than Hyperion; less dramatic bellows |
| Hyperion | Saturn | 0.43° | 0.1230 | 0.30 | Current; keeps Eyre brighter but minimal nodal precession |

**Orbit checks (with Dravago as Triton, d 77,500 mi nearly circular):**
- All four candidates clear Olarune and Dravago (see table above — inner gap ≥ 18,090 mi, outer gap ≥ 10,106 mi for the most extreme case)
- Elara/Eyre → Therendor inner gap: 1,630 mi (clear but tight)

**The albedo tradeoff:** Elara and Siarnaq both have albedo ~0.05 — Eyre would be very dark (dim silver metallic moon). The silver color (`#C0C0C0`) with dark albedo means the forge moon is dim in the night sky. This has a thematic argument: the cold anvil is dark until fire touches it. But if you want Eyre to be visually present in night-sky descriptions, this is worth knowing.

**On nodal precession rate:** After choosing a reference with meaningful inclination, the `nodePrecessionDegPerYear` in `MOON_MOTION_TUNING` should be set to something visible — current value is 2 (nearly imperceptible). A value of 15–20°/year gives a full hula-hoop cycle in 18–24 years (visible over a campaign). This is a coding decision, not a reference selection decision.

**Recommendation: Elara** (higher eccentricity + meaningful inclination for hula hoop). Siarnaq if you want even more dramatic bellows.

---

### Lharvion — no orbit overlap, Xoriat / The Eye / madness

With Eyre taking Elara, **Hyperion is available** for Lharvion (it was freed from Eyre).

Hyperion is an unusually good thematic match for Xoriat: it's the most chaotic rotator in the Solar System, never settling into stable spin — genuinely unpredictable tumbling. This maps naturally to the Realm of Madness and The Eye that observes in alien ways.

**Orbit check (Hyperion ecc 0.1230, d 125,000 mi):** periapsis 109,625 mi, apoapsis 140,375 mi. Gap to Nymm (apoapsis 95,124): 14,501 mi ✓. Gap to Barrakas (periapsis 143,323): 2,948 mi ✓. No overlap.

**Recommendation: Hyperion**

---

## Proposed Final Mapping

Five changes. Seven unchanged.

| Eberron Moon | Proposed Reference | Change | Inclination | Eccentricity | Albedo |
|---|---|---|---:|---:|---:|
| Zarantyr | Luna | — | 5.145° | 0.0549 | 0.12 |
| Olarune | Titan | — | 0.33° | 0.0288 | 0.22 |
| Therendor | **Dione** | Europa → Dione | **0.03°** | **0.0022** | **0.99** |
| Eyre | **Elara** | Hyperion → Elara | **26.6°** | **0.217** | **0.05** |
| Dravago | **Triton** | Tethys → Triton | **156.8° (retro)** | **0.00002** | **0.76** |
| Nymm | Ganymede | — | 0.20° | 0.0013 | 0.43 |
| Lharvion | **Hyperion** | Nereid → Hyperion | **0.43°** | **0.1230** | **0.30** |
| Barrakas | Enceladus | — | 0.02° | 0.0047 | 1.375 |
| Rhaan | Miranda | — | 4.34° | 0.0013 | 0.32 |
| Sypheros | Phoebe | — | 175.3° (retro) | 0.1635 | 0.06 |
| Aryth | Iapetus | — | 7.57° | 0.0283 | 0.05–0.275 |
| Vult | Oberon | — | 0.07° | 0.0014 | 0.23 |

**Retrograde moons:** Sypheros (175.3°) and Dravago (156.8°) — both go against the grain, clearly distinguishable.
**Highest prograde inclination:** Eyre at 26.6° (Elara), or Lharvion at 0.43° if Elara not used.
**Brightest pair:** Therendor (0.99) + Barrakas (1.375) in nearly the same orbital plane.

---

## Remaining Open Questions

**1. Eyre albedo (Elara):** Elara has albedo 0.05 — Eyre (#C0C0C0, silver) would be very dim in the sky. The cold-anvil-in-darkness interpretation works thematically. But if Eyre should be dramatically visible, consider Siarnaq (same eccentricity class, same albedo problem) or revisit whether Hyperion's 0.30 albedo and slower bellows is acceptable.

**2. Aryth albedo (Iapetus two-tone):** Iapetus is tidally locked to Saturn. Whether Aryth is tidally locked to Eberron is a design choice. Options:
  - **Not tidally locked** → both faces visible over orbit → averaged albedo: `(0.05 + 0.50) / 2 = 0.275`
  - **Different reference** → Callisto (Jupiter, 0.28°, 0.0074 ecc, 0.20 albedo) — ancient, heavily cratered; "realm of the dead" aesthetic; simpler uniform albedo
  - Script currently uses 0.05 (dark face only)

**3. Eyre nodal precession rate:** Once reference is chosen, `nodePrecessionDegPerYear` in `MOON_MOTION_TUNING` needs to be set to something visible (suggest 15–20°/year). This is a coding decision, not a reference selection. Flag for the implementation task.

**4. Siarnaq availability:** Siarnaq (Saturn, 45.8°, 0.296 ecc, albedo ~0.05) is not currently in the candidate pool in DESIGN.md §7.12. If Elara is shortlisted, add Siarnaq to the pool for comparison. Same albedo issue, higher eccentricity (96% more than Hyperion vs Elara's 77%).

---

## Period Scaling Reference

Informational — Eberron periods are designed values and are not changed.

| Eberron Moon | Designed Period | Reference | Real Synodic (days, Earth) | Scaled to 336d year | Best Integer × | Result |
|---|---:|---|---:|---:|---:|---:|
| Zarantyr | 27.32 | Luna | 29.53 | 27.17 | ×1 | 27.17 |
| Olarune | 34.0 | Titan | ~383 (sidereal ~15.9d) | ~14.6 | ×2 | 29.2 |
| Therendor | 24.0 | **Dione** | ~2.74 | 2.52 | ×10 | 25.2 |
| Eyre | 21.0 | **Elara** | ~260 (sidereal) | ~239 | ÷11 | 21.7 |
| Dravago | 42.0 | **Triton** | ~5.88 | 5.41 | ×8 | 43.3 |
| Nymm | 28.0 | Ganymede | ~7.16 | 6.59 | ×4 | 26.4 |
| Lharvion | 30.0 | **Hyperion** | ~21.28 | 19.58 | ×2 | 39.2 |
| Barrakas | 22.0 | Enceladus | ~1.37 | 1.26 | ×17 | 21.4 |
| Rhaan | 37.0 | Miranda | ~1.41 | 1.30 | ×28 | 36.4 |
| Sypheros | 67.0 | Phoebe | ~548 (sidereal) | ~504 | ÷8 | 63.0 |
| Aryth | 48.0 | Iapetus | ~79.3 | 72.9 | ÷2 | 36.5 |
| Vult | 56.0 | Oberon | ~13.46 | 12.38 | ×5 | 61.9 |

---

## Resulting Actions

When the three open questions above are resolved:

- [ ] Add Siarnaq to candidate pool in DESIGN.md §7.12 (if comparing against Elara for Eyre)
- [ ] Update DESIGN.md §7.4 with final reference mapping table
- [ ] Update DESIGN.md §7.3 Aryth color note (orange-red `#FF4500` is the canonical script value)
- [ ] Add task: "Update Therendor reference to Dione (0.03°, 0.0022 ecc, 0.99 albedo)"
- [ ] Add task: "Update Eyre reference to Elara/Siarnaq; set `nodePrecessionDegPerYear` to ~15–20; keep `apsisPrecessionDegPerYear: 120`"
- [ ] Add task: "Update Dravago reference to Triton (156.8°, 0.00002 ecc, 0.76 albedo)"
- [ ] Add task: "Update Lharvion reference to Hyperion (0.43°, 0.1230 ecc, 0.30 albedo); verify no clamping"
- [ ] Add task: "Set Aryth albedo: [0.275 if not tidally locked / 0.20 if Callisto]"
- [ ] Add task: "Add weak anti-phase coupling between Therendor and Barrakas"
- [ ] Add task: "Update period scaling table in DESIGN.md with final values"
