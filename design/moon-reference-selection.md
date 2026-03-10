# Moon Reference Selection

**Status:** open — Barrakas multiplier, Sypheros reference, and Dravago reference pending
**Blocking:** tasks.md — Phase 1 moon tasks (orbital parameters)

---

## Design Parameters

**What does NOT come from the reference moon:**color, diameter, mean distance.

**What DOES comes from the reference moon:** inclination, eccentricity, albedo, nodal precession rate, apsidal precession rate, synodic period

Synodic period will be scaled to 336 days (from it's own year length), and then integer-multiplied for a suitable period.

Albedo for Barrakas has a similar approach to manage the supernaturally bright moon.

**Eccentricity in the script:** `distanceSwingPct = 2 × eccentricity` in `MOON_MOTION_TUNING`.

---

## Precession Model (Already in Script)

`MOON_MOTION_TUNING` supports both precession types per moon:
- `nodePrecessionDegPerYear` — orbital plane rotates
- `apsisPrecessionDegPerYear` — ellipse rotates within its plane

Current Eyre tuning:
```
nodePrecessionDegPerYear:  2      ← very slow (180-year cycle)
apsisPrecessionDegPerYear: 120    ← fastest of any moon (3-year cycle)
distanceSwingPct:          0.246  ← = 2 × Hyperion ecc 0.1230
```

Eyre already has the fastest apsidal precession (forge ellipse spins every 3 years). Nodal precession is nearly imperceptible at 2°/year. Changing Eyre's reference to Elara (26.6° inclination) makes nodal precession visually significant — the implementation task should increase `nodePrecessionDegPerYear` to 15–20.

**QUESTION**: Does this mean the apparent inclinations as designed are shifting over time?

---

## Eberron Moon Canon Data

Colors from `EBERRON_MOON_CORE_DATA` in script (authoritative).

| Moon | Title | Color (hex) | Visual | Diameter (mi) | Mean Distance (mi) | Synodic Period (days) |
|---|---|---|---|---:|---:|---:|
| Zarantyr | The Storm Moon | `#F5F5FA` | Pearl white | 1,250 | 14,300 | 27.32 |
| Olarune | The Sentinel Moon | `#FFC68A` | Warm orange | 1,000 | 18,000 | 34.0 |
| Therendor | The Healer's Moon | `#D3D3D3` | Silver-gray | 1,100 | 39,000 | 24.0 |
| Eyre | The Anvil | `#C0C0C0` | Silver-metallic | 1,200 | 52,000 | 21.0 |
| Dravago | The Herder's Moon | `#E6E6FA` | Lavender | 2,000 | 77,500 | 42.0 |
| Nymm | The Crown | `#FFD96B` | Gold | 900 | 95,000 | 28.0 |
| Lharvion | The Eye | `#F5F5F5` | Near-white | 1,350 | 125,000 | 30.0 |
| Barrakas | The Lantern | `#F0F8FF` | Ice-white | 1,500 | 144,000 | 22.0 |
| Rhaan | The Book | `#9AC0FF` | Pale blue | 800 | 168,000 | 37.0 |
| Sypheros | The Shadow | `#696969` | Dim gray | 1,100 | 183,000 | 67.0 |
| Aryth | The Gateway | `#FF4500` | Orange-red | 1,300 | 195,000 | 48.0 |
| Vult | The Warding Moon | `#A9A9A9` | Medium gray | 1,800 | 252,000 | 56.0 |

**Lore constraints on reference selection (authoritative):**

1. **Barrakas and Therendor** share similar orbits → closely matched inclinations → frequent mutual eclipses. *(Resolved: Dione 0.03° ≈ Enceladus 0.02°.)*
2. **Therendor/Barrakas coupling** → weak tendency toward opposite phases (Therendor full ↔ Barrakas new) without hard lock. *(Implementation task, not reference selection.)*
3. **Dravago** "typically keeps at a distance from other moons" → **must have the highest ecliptic deviation of any moon.** For retrograde moons, use `180° − inclination` to compare deviation. The goal is Dravago moves the furthest from the equatorial plane. *(See constraint analysis below.)*

---

## Lux Analysis

Lux contribution at full phase ∝ albedo × (diameter / distance)². **Proximity dominates** — distance matters far more than albedo. Baseline: Zarantyr = 10.30 lux.

Values below use proposed/confirmed references. Barrakas shown at 1× (reference) and 7× (recommended multiplier). Sypheros shown at both candidates. Dravago shown at Triton (current) and Tethys (alternate).

| Rank | Moon | Reference | Albedo | Lux | Tier |
|---:|---|---|---:|---:|---|
| 1\* | Barrakas (7×) | Enceladus ×7 | 9.625 | **11.73** | Bright |
| 2 | Zarantyr | Luna | 0.12 | 10.30 | Bright |
| 3 | Therendor | Dione | 0.99 | 8.85 | Bright |
| 4 | Olarune | Titan | 0.22 | 7.63 | Bright |
| 5 | Dravago | Triton | 0.76 | 5.69 | Bright |
| 5\* | Dravago | Tethys | 0.80 | 5.98 | Bright |
| 6 | Barrakas (1×) | Enceladus | 1.375 | 1.68 | Bright |
| 7 | Nymm | Ganymede | 0.43 | 0.43 | Dim |
| 8 | Lharvion | Hyperion | 0.30 | 0.39 | Dim |
| 9 | Eyre | Elara | 0.05 | 0.30 | Dim |
| 10 | Aryth | Iapetus avg | 0.275 | 0.137 | Faint |
| 11 | Vult | Oberon | 0.23 | 0.132 | Faint |
| 12 | Rhaan | Miranda | 0.32 | 0.082 | Faint |
| 13 | Sypheros | Phoebe | 0.06 | 0.024 | Dark |
| 13\* | Sypheros | Caliban | 0.04 | 0.016 | Dark |

Lux thresholds: bright ≥ 1.0 lux, dim ≥ 0.3, faint ≥ 0.03, dark < 0.03.

**Key findings:**
- At 7×, Barrakas (11.73) surpasses Zarantyr (10.30) as the single brightest night-sky object. Fitting for an Irian lantern.
- Dravago ranks 5th regardless of Triton vs Tethys choice — the ~0.3 lux difference is negligible to gameplay.
- Aryth (0.137) with averaged albedo is no longer negligible — it's faint but visible, between Vult and Rhaan.
- Sypheros at Caliban (0.016) is clearly the lowest lux in the system. At Phoebe (0.024) it's still lowest, but only marginally above the dark threshold.

**Design decisions confirmed via notes:**
- Eyre's eccentricity (Hyperion/Elara) is intentional and correct — forge-bellows effect fits Fernia. *(Eyre → Elara confirmed.)*
- Aryth albedo = midpoint of Iapetus two-tone surface = (0.05 + 0.50) / 2 = **0.275**. *(Resolved.)*

### Barrakas multiplier options

| N | Albedo | Lux | Notes |
|--:|-------:|----:|---|
| 1 | 1.375 | 1.68 | Reference value. Barely above bright threshold. |
| 2 | 2.75 | 3.35 | |
| 4 | 5.50 | 6.70 | |
| 6 | 8.25 | 10.05 | Near-equal to Zarantyr. |
| **7** | **9.625** | **11.73** | Surpasses Zarantyr. Closest to old "albedo 10" system. **Recommended.** |
| 8 | 11.00 | 13.41 | |

---

## Full Moon Review

### ✓ Zarantyr → Luna
*Why this reference was chosen:* Luna is the canonical baseline — Eberron's year was designed so Luna's period scales cleanly. No other moon has Eberron so visibly tuned to it. Moderate eccentricity (0.0549), meaningful inclination (5.145°), the dominant night-light source by proximity. The Storm Moon as the central reference is structurally necessary.

### ✓ Olarune → Titan
*Why this reference was chosen:* Titan's orange atmospheric haze is a direct color match for Olarune's warm orange (#FFC68A). Very low inclination (0.33°) and eccentricity (0.0288) make it steady and reliable — the Sentinel always watches, never wavers. No other moon has both the right color and the orbital stillness.

### ✓ Therendor → Dione *(changed from Europa)*
*Why this reference was chosen:* Dione's inclination (0.03°) nearly matches Barrakas/Enceladus (0.02°) — a lore requirement for frequent mutual eclipses between The Healer's Moon and The Lantern. Dione's albedo (0.99) makes Therendor visually brilliant, the second-brightest moon in the sky. Europa's inclination (0.47°) was too far from Barrakas to maintain the co-planar pair. Dione provides both the orbital alignment and the visual brilliance that Syrania (healing, light) demands.

### ⚠ Eyre → Elara *(confirmed, implementation pending)*
*Why this reference was chosen:* Eyre is The Anvil, tuned for a forge-bellows effect — an eccentric orbit that swings dramatically in and out. Elara (Jupiter prograde irregular) provides 0.217 eccentricity (the highest available without orbit overlap) and 26.6° inclination for visible nodal precession ("hula hoop"). Hyperion was the previous reference but is structurally required for Lharvion. Siarnaq (ecc 0.296, higher swing) was ruled out: its periapsis at Eyre's scale falls inside Therendor's apoapsis (orbital overlap). Elara is the only viable high-eccentricity candidate.

**Implementation note:** Set `nodePrecessionDegPerYear` to 15–20 when updating Eyre's reference. Current value (2°/year) is nearly imperceptible.

### ⚠ Dravago — open (two candidates)
*The Herder's Moon: the lavender moon that moves widely across the sky, guiding the others. Higher inclination is desirable, but not so wide that it abandons the herd.*

| Candidate   | Host    | Type                 |  Incl. | Eff. dev. |      Ecc | Albedo |  Lux | Special                                                                                     |
| ----------- | ------- | -------------------- | -----: | --------: | -------: | -----: | ---: | ------------------------------------------------------------------------------------------- |
| **Triton**  | Neptune | Retrograde irregular | 156.8° | **23.2°** | 0.000016 |   0.76 | 5.69 | Captured KBO; geysers; will eventually break up (inside Roche limit); nearly circular orbit |
| **Tethys**  | Saturn  | Regular prograde     |  1.09° | **1.09°** |   0.0001 |   0.80 | 5.98 | Two Trojan companions (Telesto L4, Calypso L5); both follow Tethys at 60° intervals         |
| **Himalia** | Jupiter | Prograde irregular   |  29.6° | **29.6°** |    0.162 |   0.04 | 0.30 | Eliminated — dark albedo incompatible with Dravago's lavender visual                        |

*Eff. dev. = ecliptic deviation using `180° − inclination` for retrograde moons.*

**Sky behavior at Eberron:**
- **Triton/Dravago (156.8° retrograde → 23.2° effective):** Travels almost exactly backwards against all other moons. Dramatically skewed rising/setting path. From Eberron's equatorial regions, appears to cross the other moons' paths at steep angles, then move away. Retrograde = maximum sense of independence. But effective deviation (23.2°) is **less than Elara/Eyre (26.6°)** — see constraint note below.
- **Tethys/Dravago (1.09° prograde):** Stays very close to the celestial equator. Always among the other equatorial moons, never straying far. The Herder that stays with the herd. Two real Trojan companions (Telesto, Calypso) orbit 60° ahead and behind it in the Solar System — a herder moon that literally has followers.

**Orbital character:** Both Triton and Tethys have essentially circular orbits (ecc ≈ 0). Dravago's sky wander is entirely determined by inclination, not eccentricity. No "swinging in and out" — it moves in a wide, steady arc.

**Trade-off summary:**
- Wide deviation AND bright AND prograde → no candidate exists
- Wide deviation AND bright → must accept retrograde (Triton), but fails the constraint vs Eyre
- Prograde AND bright → Tethys (stays near equator; has shepherd companions)
- Himalia eliminated by dark albedo

Also note: Tethys and Enceladus (Barrakas) are both Saturn regular moons with nearly identical inclinations. Adding Tethys as Dravago creates a second co-planar pair alongside Therendor/Barrakas.

**⚠ Constraint note — Dravago vs Eyre:**

The lore constraint (item 3 above) requires Dravago to have the *highest ecliptic deviation* of any moon, using `180° − inclination` for retrograde moons:

| Moon | Inclination | Effective deviation |
|---|---:|---:|
| Eyre → Elara | 26.6° (prograde) | **26.6°** |
| Dravago → Triton | 156.8° (retrograde) | **23.2°** |
| Zarantyr → Luna | 5.145° (prograde) | 5.145° |
| Sypheros → Phoebe | 175.3° (retrograde) | 4.7° |

Triton (23.2° effective) does *not* satisfy the constraint — Elara/Eyre at 26.6° exceeds it. Tethys at 1.09° is even worse. Neither current Dravago candidate clears this bar.

To satisfy the constraint, Dravago needs effective deviation > 26.6°, i.e.:
- A prograde moon with inclination > 26.6° AND bright albedo (unlikely — prograde irregulars are dark), **or**
- A retrograde moon with inclination < 153.4° AND bright albedo (nothing known fits this)

**Open question:** Does "highest inclination" in the lore constraint override the reference-locked inclination rule for Dravago specifically? Or does the constraint mean we accept a slightly different interpretation (e.g., Dravago has the highest inclination among non-retrograde-near-equatorial moons)? This may require a design decision before finalizing Dravago's reference.

**⚠ Decision required — including constraint resolution.**

### ✓ Nymm → Ganymede
*Why this reference was chosen:* Ganymede is the largest moon in the Solar System — fitting for the crowned moon of perfect order (Daanvi). Very circular orbit (0.0013 ecc), very low inclination (0.20°). Orderly, stable, and massive. No ambiguity. Makes its own magnetic field, establishing order around it.

### ✓ Lharvion → Hyperion *(changed from Nereid)*
*Why this reference was chosen:* Structurally required. Lharvion's eccentricity ceiling is hard at 0.1466 — Barrakas's orbital band is an inner wall (see math below). Hyperion (0.1230 ecc) is the only available reference that fits within this ceiling AND carries a strong thematic case: Hyperion is the Solar System's most chaotically tumbling body, never settling into stable spin. Its orientation is genuinely unpredictable. Perfect for the Realm of Madness (Xoriat). Nereid (0.7507 ecc, previous reference) caused orbit overlap and had to be clamped — that's not acceptable.

**Lharvion eccentricity ceiling math:**
- Barrakas mean distance: 144,000 mi; ecc 0.0047 → apoapsis ≈ 144,677 mi
- Lharvion periapsis must exceed 144,677 mi
- Lharvion mean distance: 125,000 mi → ecc ceiling = (125,000 − 144,677) / 125,000... negative, so use:
  - periapsis = 125,000 × (1 − ecc) > 144,677
  - 1 − ecc > 1.1574 → impossible!

  Wait — re-check: Lharvion (125,000 mi) is *inside* Barrakas (144,000 mi). Lharvion is the closer moon. So Lharvion's **apoapsis** must stay inside Barrakas's **periapsis**:
  - Barrakas periapsis = 144,000 × (1 − 0.0047) = 143,323 mi
  - Lharvion apoapsis = 125,000 × (1 + ecc) < 143,323
  - ecc < (143,323 − 125,000) / 125,000 = 0.1466 ✓

  Hyperion (0.1230) satisfies this. Nereid (0.7507) would give Lharvion apoapsis = 218,838 mi — far outside Barrakas.

### ⚠ Barrakas → Enceladus (multiplier pending)
*Why this reference was chosen:* Enceladus is the most reflective body in the Solar System (albedo 1.375, exceeding 1.0 due to active resurfacing). The Lantern moon demanded the most brilliant reference available. Enceladus's nearly circular orbit (0.0047 ecc) and near-equatorial inclination (0.02°) place it co-planar with Therendor/Dione (0.03°) — enabling the frequent mutual eclipses that lore suggests.

**At reference albedo (1×):** Barrakas gives 1.68 lux — above the bright threshold but not distinctively dominant.

**Multiplier decision:** An integer multiplier N on the reference albedo may be applied to match "bright enough for hunters to hunt by" lore. See table in the Lux Analysis section above. **Recommended: 7× (albedo 9.625, 11.73 lux)** — this makes Barrakas the single brightest object in the night sky, surpassing Zarantyr, which is the correct reading for an Irian lantern. Closest to the old "albedo 10" from previous system iterations.

**Real-world lux context (script calibration):** The script uses `NIGHTLIGHT_EARTH_MOON_LUX = 0.25` (Earth's full moon at zenith = 0.25 lux) with a 0.50 overhead fraction. Bright threshold = 1.0 lux; script note: "1 lux ≈ a candle at 1 meter."

A real oil lantern (~30 cd) at 10 m produces 30 / 10² = **0.30 lux** — dim light, not bright. Barrakas at 7× = **11.73 lux**, equivalent to being ~1.5 m from that same lantern. This is not moonlight that vaguely helps you see — it is the moon *acting as a lantern*, providing active bright-light conditions across the entire sky below it. That is the correct reading for an Irian moon named The Lantern.

**⚠ Multiplier decision required.**

### ✓ Rhaan → Miranda
*Why this reference was chosen:* Miranda (Uranus) has uniquely bizarre geology — deep canyons, mixed ancient and young terrain, a surface like nowhere else in the Solar System. This chaos reflects Thelanis (the Faerie Court) where the rules are strange and the landscape follows dream logic. Moderate inclination (4.34°) gives it a slightly unusual path. Pale blue (#9AC0FF) matches Uranus-family coloring.

### ⚠ Sypheros — open (two candidates)
*The Shadow, associated with Mabar (the endless night). Dim, lurking, retrograde. Must have the lowest albedo in the system.*

| Candidate   | Host   | Type                 |  Incl. |        Ecc |     Albedo | Sypheros lux | Orbit check    | Notes                                                            |
| ----------- | ------ | -------------------- | -----: | ---------: | ---------: | -----------: | -------------- | ---------------------------------------------------------------- |
| **Phoebe**  | Saturn | Retrograde irregular | 175.3° |     0.1635 |       0.06 |    0.024 lux | 153,079 mi ✓   | Nearly perfectly retrograde (eff. dev. 4.7°); well-characterized |
| **Caliban** | Uranus | Retrograde irregular | 141.5° | 0.05–0.16† | 0.04–0.22† | 0.007–0.040† | ✓ (either ecc) | †Albedo/ecc conflict between sources — see note; eff. dev. 38.5° |
| **Phobos**  | Mars   | Regular prograde     |  1.08° |     0.0151 |      0.071 |    0.029 lux | 179,235 mi ✓   | Equatorial prograde; doomed (inside Roche limit, ~30–50 Myr)     |

Orbit check: Barrakas apoapsis ≈ 144,677 mi. Sypheros periapsis = 183,000 × (1 − ecc).

**⚠ Caliban data conflict:** Two conflicting sets of values appear in sources:
- Low-albedo version (likely JPL/original): albedo ~0.04, ecc ~0.159 → **0.016 lux** (dark, clearly dimmest in system)
- High-albedo version (NASA Science page): albedo ~0.22, ecc ~0.05 → **0.040 lux** (faint, *brighter* than Phoebe)

If Caliban is 0.22 albedo, it is brighter than Phoebe and unsuitable for "dimmest moon." **Verify against JPL Horizons before implementing.**

**Narrative:**
- **Phoebe (0.06, 175.3°):** Most dramatically retrograde — nearly 180°, effective 4.7° from equatorial, going precisely backwards. Established baseline.
- **Caliban (0.04 if confirmed, 141.5°):** Darker, still retrograde, effective deviation 38.5° — wider sky wander than Phoebe. The dimmest rock in the outer darkness. Best fit if albedo confirmed.
- **Phobos (0.071, 1.08°):** NOT retrograde; nearly equatorial. Slightly brighter than Phoebe in albedo. Only narrative angle: Phobos is literally doomed — inside Mars's Roche limit, spiraling inward. A moon of entropy (Mabar's endless night). But equatorial orbit is a poor fit for The Shadow.

**Recommendation:** If Caliban 0.04 confirmed → Caliban (darkest, retrograde, wide wander). If Caliban is 0.22 → Phoebe (darkest retrograde option remaining). Phobos is a concept fit but orbital character is wrong.

**⚠ Decision required (pending Caliban albedo verification).**

### ⚠ Aryth → Iapetus *(albedo resolved: averaged)*
*Why this reference was chosen:* Iapetus's 7.57° inclination gives Aryth a noticeably angled path — The Gateway moon has an unusual sky presence. Its eccentricity (0.0283) is moderate. Critically, Iapetus's two-tone surface (dark leading face 0.05, bright trailing face 0.50) maps onto Aryth's association with Dolurrh (the Realm of the Dead) as a threshold — one face is darkness, one is passage.

**Albedo treatment:** Aryth is treated as *not* tidally locked to Eberron; both faces are always visible from any point on the planet. Average = (0.05 + 0.50) / 2 = **0.275**. This gives 0.137 lux — faint but visible, appropriate for a moon associated with a transition realm rather than pure darkness.

**This decision is resolved.** Albedo = 0.275.

### ✓ Vult → Oberon
*Why this reference was chosen:* The Warding Moon (Shavarath) is the eternal sentinel — steady, reliable, predictable. Oberon (Uranus) has nearly circular orbit (0.0014 ecc), very low inclination (0.07°). It barely moves from its set path. A ward does not wander.

---

## Eyre — Confirmed: Elara

See Full Moon Review above. Decision resolved. Siarnaq ruled out by orbital overlap. Elara is the only viable candidate.

---

## Proposed Final Mapping

| Eberron Moon | Reference             | Change                     | Inclination |         Ecc |      Albedo | Status                                                 |
| ------------ | --------------------- | -------------------------- | ----------: | ----------: | ----------: | ------------------------------------------------------ |
| Zarantyr     | Luna                  | —                          |      5.145° |      0.0549 |        0.12 | ✓ confirmed                                            |
| Olarune      | Titan                 | —                          |       0.33° |      0.0288 |        0.22 | ✓ confirmed                                            |
| Therendor    | **Dione**             | Europa → Dione             |       0.03° |      0.0022 |        0.99 | ✓ confirmed                                            |
| Eyre         | **Elara**             | Hyperion → Elara           |       26.6° |       0.217 |        0.05 | still open. unhappy with the albedo. unhappy with the  |
| Dravago      | **Tethys or Triton**  | Tethys → Triton            | *see above* | *see above* | *see above* | ⚠ open                                                 |
| Nymm         | Ganymede              | —                          |       0.20° |      0.0013 |        0.43 | ✓ confirmed                                            |
| Lharvion     | **Hyperion**          | Nereid → Hyperion          |       0.43° |      0.1230 |        0.30 | ✓ confirmed                                            |
| Barrakas     | Enceladus ×N          | — (multiplier pending)     |       0.02° |      0.0047 |   1.375 × N | ⚠ open                                                 |
| Rhaan        | Miranda               | —                          |       4.34° |      0.0013 |        0.32 | ✓ confirmed                                            |
| Sypheros     | **Phoebe or Caliban** | —                          | *see above* | *see above* | *see above* | ⚠ open                                                 |
| Aryth        | Iapetus               | — (albedo resolved: 0.275) |       7.57° |      0.0283 |       0.275 | ✓ confirmed                                            |
| Vult         | Oberon                | —                          |       0.07° |      0.0014 |        0.23 | ✓ confirmed                                            |

7 confirmed. 3 open decisions: Dravago reference, Barrakas multiplier, Sypheros reference.

---

## Remaining Open Decisions

**1. Dravago reference:** Triton (retrograde, wide wander, bright) vs Tethys (prograde, equatorial, bright + shepherd companions)?
**2. Barrakas multiplier:** N× Enceladus albedo (1.375). Recommend 7× = 9.625 albedo, 11.73 lux.
**3. Sypheros reference:** Caliban (darker, 0.04) vs Phoebe (current, 0.06). Both retrograde, both orbit-safe. Recommend Caliban.

---

## Period Scaling Reference

Informational — Eberron periods are designed values.

| Eberron Moon | Designed Period | Reference | Real Synodic (days, Earth) | Scaled to 336d year | Best Int × | Result |
|---|---:|---|---:|---:|---:|---:|
| Zarantyr | 27.32 | Luna | 29.53 | 27.17 | ×1 | 27.2 |
| Olarune | 34.0 | Titan | ~15.9d (sidereal) | ~14.6 | ×2 | 29.2 |
| Therendor | 24.0 | **Dione** | 2.74 | 2.52 | ×10 | 25.2 |
| Eyre | 21.0 | **Elara** | ~260 (sidereal) | ~239 | ÷11 | 21.7 |
| Dravago | 42.0 | **Triton/Tethys** | 5.88 / 1.89 | 5.41 / 1.74 | ×8 / ×24 | 43.3 / 41.8 |
| Nymm | 28.0 | Ganymede | 7.16 | 6.59 | ×4 | 26.4 |
| Lharvion | 30.0 | **Hyperion** | 21.28 | 19.58 | ×2 | 39.2 |
| Barrakas | 22.0 | Enceladus | 1.37 | 1.26 | ×17 | 21.4 |
| Rhaan | 37.0 | Miranda | 1.41 | 1.30 | ×28 | 36.4 |
| Sypheros | 67.0 | Phoebe/Caliban | ~550 / ~580 | ~506 / ~533 | ÷8 / ÷8 | 63.3 / 66.6 |
| Aryth | 48.0 | Iapetus | 79.3 | 72.9 | ÷2 | 36.5 |
| Vult | 56.0 | Oberon | 13.46 | 12.38 | ×5 | 61.9 |

---

## Resulting Actions

When the three open decisions above are resolved:

- [ ] Update DESIGN.md §7.4 with final reference mapping table
- [ ] Add task: "Update Therendor reference to Dione (0.03°, 0.0022 ecc, 0.99 albedo)"
- [ ] Add task: "Update Eyre reference to Elara (26.6°, 0.217 ecc, 0.05 albedo); set nodePrecessionDegPerYear to 15–20; keep apsisPrecessionDegPerYear: 120"
- [ ] Add task: "Update Dravago reference to [Triton/Tethys]"
- [ ] Add task: "Update Lharvion reference to Hyperion (0.43°, 0.1230 ecc, 0.30 albedo); remove eccentricity clamping"
- [ ] Add task: "Set Barrakas albedo multiplier to N× in script"
- [ ] Add task: "Update Sypheros reference to [Caliban/Phoebe]"
- [ ] Add task: "Set Aryth albedo to 0.275 (averaged Iapetus)"
- [ ] Add task: "Add weak anti-phase coupling between Therendor and Barrakas"
- [ ] Add task: "Update period scaling table in DESIGN.md with final multipliers"
