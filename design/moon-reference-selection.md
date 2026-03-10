# Moon Reference Selection

**Status:** open — Eyre albedo, Barrakas multiplier, Sypheros reference, and Dravago reference pending
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
| 13\* | Sypheros | Phobos | 0.071 | 0.029 | Dark |
| 13\*\* | Sypheros | Deimos | 0.08 | 0.032 | Faint |

Lux thresholds: bright ≥ 1.0 lux, dim ≥ 0.3, faint ≥ 0.03, dark < 0.03.

**Key findings:**
- At 7×, Barrakas (11.73) surpasses Zarantyr (10.30) as the single brightest night-sky object. Fitting for an Irian lantern.
- Dravago ranks 5th regardless of Triton vs Tethys choice — the ~0.3 lux difference is negligible to gameplay.
- Aryth (0.137) with averaged albedo is no longer negligible — it's faint but visible, between Vult and Rhaan.
- Sypheros: Phoebe (0.024) and Phobos (0.029) are both dark; Deimos (0.032) sits just above the dark threshold in faint. All three are lowest lux in the system.

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

### ✓ Therendor → Dione *(changed from Europa)*
*Why this reference was chosen:* Dione's inclination (0.03°) nearly matches Barrakas/Enceladus (0.02°) — a lore requirement for frequent mutual eclipses between The Healer's Moon and The Lantern. Dione's albedo (0.99) makes Therendor visually brilliant, the second-brightest moon in the sky. Europa's inclination (0.47°) was too far from Barrakas to maintain the co-planar pair. Dione provides both the orbital alignment and the visual brilliance that Syrania (healing, light) demands.

### ⚠ Eyre → Elara *(orbital parameters confirmed; albedo open)*

*Why this reference was chosen:* Eyre is The Anvil, tuned for a forge-bellows effect — an eccentric orbit that swings dramatically in and out. Elara (Jupiter prograde irregular) provides 0.217 eccentricity (the highest available without orbit overlap) and 26.6° inclination for visible nodal precession ("hula hoop"). Hyperion was the previous reference but is structurally required for Lharvion. Siarnaq (ecc 0.296, higher swing) was ruled out: its periapsis at Eyre's scale falls inside Therendor's apoapsis (orbital overlap). Elara is the only viable high-eccentricity candidate.

**Implementation note:** Set `nodePrecessionDegPerYear` to 15–20 when updating Eyre's reference. Current value (2°/year) is nearly imperceptible.

**⚠ Albedo concern:** Elara's eccentricity and inclination are exactly what Eyre needs. But albedo 0.05 gives 0.30 lux — barely dim, 9th in the system. A silver-metallic moon associated with Fernia's forge should be brighter than that.

The problem is structural: high-eccentricity moons are captured irregular bodies with dark surfaces. Bright moons are regular icy moons with nearly circular orbits. There is no natural moon with both high eccentricity and high albedo that fits within the orbital-overlap constraint (periapsis > 39,100 mi).

Two paths forward:

**Option A — Elara with albedo multiplier** *(preserves all orbital character)*

Same reference, amplified albedo. Fernia's fire justifies a hotter, more reflective surface — same narrative logic as Barrakas/Enceladus.

| N | Albedo | Lux | Tier | Notes |
|--:|-------:|----:|---|---|
| 1× | 0.05 | 0.30 | Dim | Reference value. Barely visible. |
| 2× | 0.10 | 0.60 | Dim | |
| 3× | 0.15 | 0.90 | Dim | |
| 4× | 0.20 | 1.20 | **Bright** | Enters bright tier |
| 5× | 0.25 | 1.49 | **Bright** | Near Lharvion-level |
| 6× | 0.30 | 1.79 | **Bright** | Matches Hyperion/Lharvion albedo exactly |

**Option B — High-albedo circular reference** *(sacrifice forge-bellows)*

Gain brightness; lose the dramatic orbital swing. Eyre becomes visually prominent but both defining characteristics (eccentricity and high inclination) are gone. Not recommended unless the decision is made to redefine Eyre's orbital identity.

| Candidate | Host | Incl. | Ecc | Albedo | Eyre lux | Notes |
|---|---|---:|---:|---:|---:|---|
| **Mimas** | Saturn | 1.53° | 0.0196 | 0.96 | **5.74** | Massive crater (Herschel); most prominent icy moon |
| **Rhea** | Saturn | 0.35° | 0.0010 | 0.95 | **5.68** | Brilliant icy regular |
| **Janus** | Saturn | 0.16° | 0.0068 | 0.71 | **4.25** | Co-orbital shepherd with Epimetheus |
| **Ariel** | Uranus | 0.04° | 0.0012 | 0.56 | **3.35** | Brightest Uranian; geologically active |
| **Umbriel** | Uranus | 0.13° | 0.0039 | 0.26 | **1.56** | Darker Uranian; still bright tier |

**⚠ Decision required: albedo multiplier N× on Elara (Option A), or new high-albedo reference (Option B)?**

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
- Wide deviation AND bright → must accept retrograde (Triton), but fails the strict constraint vs Eyre
- Prograde AND bright → Tethys (stays near equator; has shepherd companions)
- Himalia eliminated by dark albedo

**Interpreting "its orbit typically keeps it at a distance from other moons":**

Three possible readings:

1. **High inclination** — Dravago wanders far from the celestial equator where most moons travel. When others cluster near the horizon, Dravago is elsewhere.
2. **Retrograde motion** — Dravago moves in the opposite direction from all other moons. It is perpetually departing from them, passing through their positions only briefly before pulling away.
3. **The Herder character** — A herder works the periphery of the flock, not the center. Circling in reverse, from the outside.

Of these, retrograde motion is the most mechanically expressive. A retrograde moon is never traveling *with* any other moon — it is always the one going the other way. "Typically at a distance" becomes behavioral, not geometric: Dravago is the moon that always seems to be heading somewhere else.

Note also that Tethys (the prograde option) literally has shepherd companions that follow 60° ahead and behind it. Tethys is the moon that *attracts followers and stays with the herd*. That is the opposite of the lore description.

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

To satisfy the strict mathematical constraint, Dravago needs effective deviation > 26.6°, i.e.:
- A prograde moon with inclination > 26.6° AND bright albedo (none exist — prograde irregulars are dark), **or**
- A retrograde moon with inclination < 153.4° AND bright albedo (nothing known fits this)

**Constraint resolution:** The constraint as written ("must have the highest ecliptic deviation") was derived from the inclination reading of the lore. If the lore means retrograde motion — the behavioral sense of always keeping distance — the constraint was over-specified. Triton's retrograde character plus 23.2° effective deviation (second highest in the system) satisfies the narrative. The one moon above it (Eyre/Elara at 26.6°) has very different character: its high inclination is the forge-bellows hula-hoop, not the Herder's wandering.

**Recommendation: Triton.** Relax "highest effective deviation" to "notably high deviation + retrograde." Tethys is the moon that stays with the herd; Triton is the one that circles it going the wrong way.

**⚠ Decision required — constraint interpretation sign-off needed before finalizing.**

### ✓ Rhaan → Miranda
*Why this reference was chosen:* Miranda (Uranus) has uniquely bizarre geology — deep canyons, mixed ancient and young terrain, a surface like nowhere else in the Solar System. This chaos reflects Thelanis (the Faerie Court) where the rules are strange and the landscape follows dream logic. Moderate inclination (4.34°) gives it a slightly unusual path. Pale blue (#9AC0FF) matches Uranus-family coloring.

### ⚠ Sypheros — open (three candidates)
*The Shadow, associated with Mabar (the endless night). Dim, lurking, retrograde. Must have the lowest albedo in the system.*

| Candidate  | Host   | Type                 |  Incl. |    Ecc | Albedo | Sypheros lux | Orbit check  | Notes                                                            |
| ---------- | ------ | -------------------- | -----: | -----: | -----: | -----------: | ------------ | ---------------------------------------------------------------- |
| **Phoebe** | Saturn | Retrograde irregular | 175.3° | 0.1635 |   0.06 |    0.024 lux | 153,079 mi ✓ | Nearly perfectly retrograde (eff. dev. 4.7°); well-characterized |
| **Deimos** | Mars   | Regular prograde     |  1.79° | 0.0002 |   0.08 |    0.032 lux | 182,963 mi ✓ | Nearly circular; outer Mars moon; ancient cratered surface; may eventually escape Mars gravity |
| **Phobos** | Mars   | Regular prograde     |  1.08° | 0.0151 |  0.071 |    0.029 lux | 179,235 mi ✓ | Equatorial prograde; doomed (inside Roche limit, ~30–50 Myr)     |

Orbit check: Barrakas apoapsis ≈ 144,677 mi. Sypheros periapsis = 183,000 × (1 − ecc).

~~Caliban (Uranus retrograde): eliminated — conflicting albedo values in sources (0.04 vs 0.22), unresolvable.~~


**Narrative:**
- **Phoebe (0.06, 175.3°):** Most dramatically retrograde — nearly 180°, effective 4.7° from equatorial, going precisely backwards. Darkest option (0.024 lux).
- **Phobos (0.071, 1.08°):** Prograde equatorial — retrograde character lost. Doomed orbit (inside Roche limit, spiraling inward, ~30–50 Myr). Entropy narrative fits Mabar. Dark tier (0.029 lux).
- **Deimos (0.08, 1.79°):** Prograde equatorial — retrograde character also lost. Nearly circular orbit (ecc 0.0002). Slightly brighter; sits just above the dark threshold at faint (0.032 lux). May eventually escape Mars's gravity (possible anti-entropy reading, but less compelling).

**Phobos vs Deimos:** Both Mars moons; both lose Phoebe's retrograde character. Phobos's doomed inward spiral fits Mabar entropy. Phobos is darker (0.029 lux, dark tier) while Deimos (0.032 lux) barely reaches faint — a meaningful distinction if The Shadow should sit just below visible.

**⚠ Decision required — Phoebe (retrograde, darkest), Phobos (doomed, dark), or Deimos (distinct fate, faint)?**



---

## Proposed Final Mapping

| Eberron Moon | Reference             | Change                     | Inclination |         Ecc |      Albedo | Status                                                |
| ------------ | --------------------- | -------------------------- | ----------: | ----------: | ----------: | ----------------------------------------------------- |
| Zarantyr     | Luna                  | —                          |      5.145° |      0.0549 |        0.12 | ✓ confirmed                                           |
| Olarune      | Titan                 | —                          |       0.33° |      0.0288 |        0.22 | ✓ confirmed                                           |
| Therendor    | **Dione**             | Europa → Dione             |       0.03° |      0.0022 |        0.99 | ✓ confirmed                                           |
| Eyre         | **Elara**             | Hyperion → Elara           |       26.6° |       0.217 |        0.05 | ⚠ open — orbital parameters confirmed; albedo multiplier pending |
| Dravago      | **Tethys or Triton**  | Tethys → Triton            | *see above* | *see above* | *see above* | ⚠ open                                                |
| Nymm         | Ganymede              | —                          |       0.20° |      0.0013 |        0.43 | ✓ confirmed                                           |
| Lharvion     | **Hyperion**          | Nereid → Hyperion          |       0.43° |      0.1230 |        0.30 | ✓ confirmed                                           |
| Barrakas     | Enceladus ×N          | — (multiplier pending)     |       0.02° |      0.0047 |   1.375 × N | ⚠ open                                                |
| Rhaan        | Miranda               | —                          |       4.34° |      0.0013 |        0.32 | ✓ confirmed                                           |
| Sypheros     | **Phoebe, Phobos, or Deimos** | —                  | *see above* | *see above* | *see above* | ⚠ open                                                |
| Aryth        | Iapetus               | — (albedo resolved: 0.275) |       7.57° |      0.0283 |       0.275 | ✓ confirmed                                           |
| Vult         | Oberon                | —                          |       0.07° |      0.0014 |        0.23 | ✓ confirmed                                           |

6 confirmed (orbital parameters), 4 open decisions: Eyre albedo multiplier, Dravago reference, Barrakas multiplier, Sypheros reference.

---

## Remaining Open Decisions

**1. Eyre albedo:** Orbital parameters (Elara ecc 0.217, incl 26.6°) confirmed. Albedo 0.05 unsatisfactory for a silver-metallic moon. Recommend an albedo multiplier (see Option A above). 4× (1.20 lux, bright) or 5× (1.49 lux, bright) are the practical range.
**2. Dravago reference:** Triton (retrograde, 23.2° effective deviation, 0.76 albedo) recommended. Tethys (prograde equatorial, bright, shepherd companions) is the opposite of the lore description. Constraint interpretation sign-off needed.
**3. Barrakas multiplier:** N× Enceladus albedo (1.375). 7× = 9.625 albedo, 11.73 lux. Confirmed preferred.
**4. Sypheros reference:** Phoebe (retrograde, darkest at 0.024 lux), Phobos (doomed/entropy, dark at 0.029 lux), or Deimos (faint at 0.032 lux). Phobos and Deimos are both prograde equatorial.

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

When the four open decisions above are resolved:

- [ ] Update DESIGN.md §7.4 with final reference mapping table
- [ ] Add task: "Update Therendor reference to Dione (0.03°, 0.0022 ecc, 0.99 albedo)"
- [ ] Add task: "Update Eyre reference to Elara (26.6°, 0.217 ecc, albedo = 0.05 × N); set nodePrecessionDegPerYear to 15–20; keep apsisPrecessionDegPerYear: 120"
- [ ] Add task: "Update Dravago reference to [Triton/Tethys]"
- [ ] Add task: "Update Lharvion reference to Hyperion (0.43°, 0.1230 ecc, 0.30 albedo); remove eccentricity clamping"
- [ ] Add task: "Set Barrakas albedo multiplier to N× in script"
- [ ] Add task: "Update Sypheros reference to [Caliban/Phoebe]"
- [ ] Add task: "Set Aryth albedo to 0.275 (averaged Iapetus)"
- [ ] Add task: "Add weak anti-phase coupling between Therendor and Barrakas"
- [ ] Add task: "Update period scaling table in DESIGN.md with final multipliers"
