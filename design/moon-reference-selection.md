# Moon Reference Selection

**Status:** resolved — all 12 reference moons confirmed
**Blocking:** ~~tasks.md — Phase 1 moon tasks (orbital parameters)~~ → unblocked; see Resulting Actions

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

Confirmed selections only. Barrakas 7× shown as an alternative to the confirmed 1×.

| Rank | Moon | Reference | Albedo | Lux | Tier |
|---:|---|---|---:|---:|---|
| 1 | Zarantyr | Luna | 0.12 | 10.30 | Bright |
| 2 | Therendor | Dione | 0.99 | 8.85 | Bright |
| 3 | Olarune | Titan | 0.22 | 7.63 | Bright |
| 4 | Eyre | **Mimas** | **0.96** | **5.74** | Bright |
| 5 | Dravago | **Triton** | 0.76 | 5.69 | Bright |
| 6 | Barrakas | Enceladus ×1 | 1.375 | 1.68 | Bright |
| 6† | Barrakas | Enceladus ×7 | 9.625 | **11.73** | Bright† |
| 7 | Nymm | Ganymede | 0.43 | 0.43 | Dim |
| 8 | Lharvion | Hyperion | 0.30 | 0.39 | Dim |
| 9 | Aryth | Iapetus avg | 0.275 | 0.137 | Faint |
| 10 | Vult | Oberon | 0.23 | 0.132 | Faint |
| 11 | Rhaan | Miranda | 0.32 | 0.082 | Faint |
| 12 | Sypheros | **Phobos** | 0.071 | 0.029 | Dark |

† Barrakas ×7 alternative: 11.73 lux surpasses Zarantyr to become the single brightest object in the night sky.

Lux thresholds: bright ≥ 1.0 lux, dim ≥ 0.3, faint ≥ 0.03, dark < 0.03.

**Key findings:**
- Eyre/Mimas (5.74) and Dravago/Triton (5.69) are essentially tied at rank 4/5 — a bright pair in the mid-distance range.
- Barrakas at 1× (1.68) is a comfortably bright moon, just below the Eyre/Dravago cluster. At 7× it surpasses Zarantyr to dominate the night sky.
- Aryth (0.137) is faint but visible, between Vult and Rhaan.
- Sypheros/Phobos (0.029) is in the dark tier — barely below the faint threshold.

**Confirmed decisions:**
- Eyre → Mimas *(mythological: slain by Hephaestus; forge-scarred anvil with hidden internal fire)*
- Dravago → Triton *(retrograde: always moving away from every other moon)*
- Sypheros → Phobos *(doomed inward spiral; entropy/Mabar)*
- Barrakas → Enceladus ×1 *(1.375 albedo, 1.68 lux; 7× = 11.73 lux kept as an option)*
- Aryth → Iapetus avg albedo 0.275 *(averaged two-tone surface)*

### Barrakas multiplier options

**Confirmed: 1× (albedo 1.375, lux 1.68).** Keeps Barrakas as a distinctly bright moon without dominating the sky. 7× kept as the "lantern of Irian" alternative — if you want The Lantern to be the most brilliant object in the night sky, surpassing Zarantyr.

| N | Albedo | Lux | Notes |
|--:|-------:|----:|---|
| **1** | **1.375** | **1.68** | **Confirmed.** Bright, above the 1.0 threshold, below the bright cluster. |
| 2 | 2.75 | 3.35 | |
| 4 | 5.50 | 6.70 | |
| 6 | 8.25 | 10.05 | Near-equal to Zarantyr. |
| 7 | 9.625 | 11.73 | Surpasses Zarantyr. Single brightest object. Closest to old "albedo 10" system. |
| 8 | 11.00 | 13.41 | |

---

## Full Moon Review

### ✓ Therendor → Dione *(changed from Europa)*
*Why this reference was chosen:* Dione's inclination (0.03°) nearly matches Barrakas/Enceladus (0.02°) — a lore requirement for frequent mutual eclipses between The Healer's Moon and The Lantern. Dione's albedo (0.99) makes Therendor visually brilliant, the second-brightest moon in the sky. Europa's inclination (0.47°) was too far from Barrakas to maintain the co-planar pair. Dione provides both the orbital alignment and the visual brilliance that Syrania (healing, light) demands.

### ✓ Eyre → Mimas *(confirmed)*

*Why this reference was chosen:* The goal for Eyre is narrative fit to The Anvil — rhythmic forge character, fire and brightness, transformation, "never staying the same." The core tension was that high-eccentricity moons (good orbital swing) are dark captured rocks, while bright moons are regular icy moons with nearly circular orbits. Mimas was chosen for mythology and character over orbital mechanics.

**Mythological fit:** Mimas was a Giant of Greek mythology, killed by Hephaestus — the god of the forge — with red-hot metal missiles during the Gigantomachy. The Giant bears the mark of the Forge God's blow. For a moon called The Anvil: Mimas literally IS the anvil, scarred by the hammer of the forge deity. The Herschel crater (one-third of Mimas's diameter, 5 km deep walls) is that mark — visible, enormous, defining.

**Physical character:** Brilliant albedo (0.96 — nearly perfect reflectivity from icy surface). Lux 5.74 — bright tier, rank 4 in the system, essentially tied with Dravago. The 2024 Cassini data revealed an unexpected internal ocean 20–30 km beneath the surface, driven by an unknown heating source. A moon that looks frozen and dead but contains hidden fire. The forge that never cools.

**What changes:** Eyre moves from dim (Elara, 0.30 lux) to the bright cluster (Mimas, 5.74 lux). The forge-bellows orbital swing (eccentricity) is reduced from 0.217 to 0.0196 — a meaningful decrease. The hula-hoop nodal precession (26.6° → 1.53° inclination) is lost. The fast apsidal precession (`apsisPrecessionDegPerYear: 120`) is retained as a tuning parameter — it does not come from the reference. Eyre's rhythmic orbital character is now expressed through that precession, not orbital eccentricity.

| Parameter | Elara (rejected) | **Mimas (confirmed)** |
|---|---:|---:|
| Inclination | 26.6° | **1.53°** |
| Eccentricity | 0.217 | **0.0196** |
| Albedo | 0.05 | **0.96** |
| Lux | 0.30 (Dim, rank 9) | **5.74 (Bright, rank 4)** |

**Implementation:** Update Eyre reference to Mimas (1.53°, 0.0196 ecc, 0.96 albedo); set `distanceSwingPct = 0.0392`; set `nodePrecessionDegPerYear` to 2 (low — not a hula-hoop moon); keep `apsisPrecessionDegPerYear: 120`.

---

**Alternatives considered and preserved:**

**Io (Jupiter)** — Most volcanically active body in the Solar System. 400+ active volcanoes; surface continuously repaved by lava flows; never the same landscape twice. Tidal rhythm from the 1:2:4 Laplace resonance with Europa and Ganymede creates rhythmic internal squeezing — a gravitational forge hammer that operates on every orbit. Good albedo (0.63, lux 3.77). What you lose: nearly circular orbit (ecc 0.0041), very low inclination (0.04°). No forge mythology in the name — Io is a priestess of Hera. Best fit if the identity is *forge fire and transformation* rather than *the scarred anvil*.

**Prometheus (Saturn)** — Shapes Saturn's F ring through gravitational interaction; carves streamers and channels on every orbit — a moon that literally makes things. Albedo ~0.60, lux ~3.59. What you lose: very circular orbit (ecc 0.0022), essentially zero inclination. Name mythology: Prometheus stole fire from the gods and gave it to humanity — the patron of craft and foresight. Best fit if the identity is *craft, making, the gift of fire* — which closely matches Eyre's dragonmark (Mark of Making) and plane (Fernia).

| Candidate | Incl. | Ecc | Albedo | Lux | Identity |
|---|---:|---:|---:|---:|---|
| **Mimas** (confirmed) | 1.53° | 0.0196 | 0.96 | **5.74** | The scarred anvil; struck by Hephaestus; hidden fire |
| Io | 0.04° | 0.0041 | 0.63 | 3.77 | Forge fire; volcanic transformation; tidal rhythm |
| Prometheus | 0.01° | 0.0022 | ~0.60 | ~3.59 | Craft patron; fire-stealer; shaper of things |

### ✓ Dravago → Triton *(confirmed)*
*The Herder's Moon: the lavender moon that moves widely across the sky, guiding the others.*

**Decision:** Triton. The lore "typically keeps at a distance from other moons" is best read as retrograde motion — Dravago literally moves opposite to every other moon, always departing. Tethys (the prograde alternative) literally has shepherd companions that follow it at 60° intervals: the opposite of keeping distance. Retrograde plus 23.2° effective deviation (second highest in system) fully satisfies the narrative.

---
*(Analysis preserved below)*

---

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

**✓ Resolved — Triton confirmed. Constraint relaxed from "highest effective deviation" to "notably high deviation + retrograde."**

### ✓ Rhaan → Miranda
*Why this reference was chosen:* Miranda (Uranus) has uniquely bizarre geology — deep canyons, mixed ancient and young terrain, a surface like nowhere else in the Solar System. This chaos reflects Thelanis (the Faerie Court) where the rules are strange and the landscape follows dream logic. Moderate inclination (4.34°) gives it a slightly unusual path. Pale blue (#9AC0FF) matches Uranus-family coloring.

### ✓ Sypheros → Phobos *(confirmed)*
*The Shadow, associated with Mabar (the endless night).*

**Decision:** Phobos. The doomed moon — spiraling inward inside Mars's Roche limit, will break apart in ~30–50 Myr. A moon of entropy. Mabar is the endless night, the plane of entropy and consumption. Phobos is literally being consumed. Dark tier (0.029 lux — just below the faint threshold). Prograde equatorial (retrograde would have fit The Shadow better narratively, but the doomed-inward-spiral is the stronger Mabar angle).

---
*(Candidate analysis preserved below)*

---

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

**✓ Resolved — Phobos confirmed.**



---

## Proposed Final Mapping

| Eberron Moon | Reference        | Change                 | Inclination |    Ecc |  Albedo | Status       |
| ------------ | ---------------- | ---------------------- | ----------: | -----: | ------: | ------------ |
| Zarantyr     | Luna             | —                      |      5.145° | 0.0549 |    0.12 | ✓ confirmed  |
| Olarune      | Titan            | —                      |       0.33° | 0.0288 |    0.22 | ✓ confirmed  |
| Therendor    | **Dione**        | Europa → Dione         |       0.03° | 0.0022 |    0.99 | ✓ confirmed  |
| Eyre         | **Mimas**        | Hyperion → Elara → **Mimas** |  1.53° | 0.0196 |    0.96 | ✓ confirmed  |
| Dravago      | **Triton**       | (Tethys ruled out)     |     156.8°† | 0.000016 |  0.76 | ✓ confirmed  |
| Nymm         | Ganymede         | —                      |       0.20° | 0.0013 |    0.43 | ✓ confirmed  |
| Lharvion     | **Hyperion**     | Nereid → Hyperion      |       0.43° | 0.1230 |    0.30 | ✓ confirmed  |
| Barrakas     | Enceladus ×1     | — (×7 option retained) |       0.02° | 0.0047 |   1.375 | ✓ confirmed  |
| Rhaan        | Miranda          | —                      |       4.34° | 0.0013 |    0.32 | ✓ confirmed  |
| Sypheros     | **Phobos**       | —                      |       1.08° | 0.0151 |   0.071 | ✓ confirmed  |
| Aryth        | Iapetus          | albedo averaged 0.275  |       7.57° | 0.0283 |   0.275 | ✓ confirmed  |
| Vult         | Oberon           | —                      |       0.07° | 0.0014 |    0.23 | ✓ confirmed  |

† Triton is retrograde; 156.8° inclination = 23.2° effective ecliptic deviation.

**All 12 reference moons confirmed.**

---

## Remaining Open Decisions

None. All 12 reference moons confirmed. See Proposed Final Mapping above.

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
| Sypheros | 67.0 | **Phobos** | ~0.32 days (sidereal) | ~0.29 | ×230 | ~67.0 | *Period does not derive from Phobos; 67d is a designed value* |
| Aryth | 48.0 | Iapetus | 79.3 | 72.9 | ÷2 | 36.5 |
| Vult | 56.0 | Oberon | 13.46 | 12.38 | ×5 | 61.9 |

---

## Resulting Actions

All decisions resolved. Tasks added to tasks.md.

- [x] Update DESIGN.md §7.4 with final reference mapping table
- [x] Add task: Update Therendor reference to Dione (0.03°, 0.0022 ecc, 0.99 albedo)
- [x] Add task: Update Eyre reference to Mimas (1.53°, 0.0196 ecc, 0.96 albedo); distanceSwingPct 0.0392; nodePrecessionDegPerYear 2; keep apsisPrecessionDegPerYear 120
- [x] Add task: Update Dravago reference to Triton (156.8° retrograde, 0.000016 ecc, 0.76 albedo)
- [x] Add task: Update Lharvion reference to Hyperion (0.43°, 0.1230 ecc, 0.30 albedo); remove eccentricity clamping
- [x] Add task: Set Barrakas albedo to 1.375 (Enceladus ×1); no multiplier
- [x] Add task: Update Sypheros reference to Phobos (1.08°, 0.0151 ecc, 0.071 albedo)
- [x] Add task: Set Aryth albedo to 0.275 (averaged Iapetus)
- [x] Add task: Add weak anti-phase coupling between Therendor and Barrakas
- [x] Add task: Update period scaling table in DESIGN.md with final multipliers
