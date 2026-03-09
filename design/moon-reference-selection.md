# Moon Reference Selection

**Status:** open
**Blocking:** tasks.md — Phase 1 moon tasks (orbital parameters, Barrakas/Therendor, Dravago, Lharvion)

---

## Problem Statement

Each Eberron moon is mapped to a real Solar System moon as its orbital reference (inclination, eccentricity, albedo). The current mappings were chosen quickly and several violate lore constraints or have numerical problems. Before any orbital parameter tasks can be coded, the final reference selections need to be locked.

This is a design-discussion task, not a coding task. The output is a finalized mapping table — updated DESIGN.md section 7.4 — and a set of implementation tasks added to tasks.md.

---

## Background

See DESIGN.md sections 7.3–7.5 for full context. Summary of the constraints that drive reference selection:

**Current mapping table (DESIGN.md §7.4):**

| Eberron Moon | Current Reference | Host | Inclination | Eccentricity | Albedo |
|---|---|---|---:|---:|---:|
| Zarantyr | Luna | Earth | 5.145° | 0.0549 | 0.12 |
| Olarune | Titan | Saturn | 0.33° | 0.0288 | 0.22 |
| Therendor | Europa | Jupiter | 0.47° | 0.0094 | 0.67 |
| Eyre | Hyperion | Saturn | 0.43° | 0.1230 | 0.30 |
| Dravago | Tethys | Saturn | 1.09° | 0.0001 | 1.229 |
| Nymm | Ganymede | Jupiter | 0.20° | 0.0013 | 0.43 |
| Lharvion | Nereid | Neptune | 7.23° | 0.7507 | 0.155 |
| Barrakas | Enceladus | Saturn | 0.02° | 0.0047 | 1.375 |
| Rhaan | Miranda | Uranus | 4.34° | 0.0013 | 0.32 |
| Sypheros | Phoebe | Saturn | 175.3° | 0.1635 | 0.06 |
| Aryth | Iapetus | Saturn | 7.57° | 0.0283 | 0.05 |
| Vult | Oberon | Uranus | 0.07° | 0.0014 | 0.23 |

**Candidate pool:** DESIGN.md §7.12 — 36 candidates with inclination, eccentricity, and albedo values.

**Synodic periods (fixed by lore, not by reference):** listed in DESIGN.md §7.3. These don't change — they are the Eberron periods. The reference moon only supplies inclination, eccentricity, and albedo.

---

## Lore Constraints (Hard)

These are not preferences — they must be satisfied:

1. **Barrakas and Therendor** share similar orbits → closely matched inclinations → frequent mutual eclipses
2. **Therendor/Barrakas coupling** → weak tendency toward opposite phases (Therendor full ↔ Barrakas new) without hard lock.
3. **Dravago** "typically keeps at a distance from other moons" → **must have the highest inclination of any moon.**
	1. For retrograde moons, subtract 180° from their inclinations. The design goal is for Dravago to move further from the elliptic than any other moon.

---

## Open Questions

1. **Dravago** — Tethys (1.09°) is clearly wrong as the "highest inclination" reference, since several moons (Rhaan at 4.34°, Aryth at 7.57°, Lharvion at 7.23°, Zarantyr at 5.145°) already exceed it. What retrograde or high-inclination moon should Dravago use? Candidates: Himalia (27.5°), Sycorax (159.4°), Halimede (134.1°). Or a prograde moon with inclination >10°?

2. **Barrakas/Therendor inclination match** — Europa (0.47°) and Enceladus (0.02°) are close but not matched. Should they use the same reference, or two different moons with nearly identical inclinations?

3. **Lharvion** — Nereid (7.23°, eccentricity 0.7507) has a highly elliptical orbit that may cause distance overlap with inner moons. Is Nereid still the right choice, or does the overlap issue force a different pick? If different: what? Phoebe is taken by Sypheros. Himalia (eccentricity 0.16) is an option but less extreme.

4. **Eyre** — Hyperion (eccentricity 0.123) gives meaningful eccentricity, which fits Eyre's association with Fernia (volcanic, chaotic). Is this intentional and correct?
	1. ANSWER: Yes.

5. **Aryth / Iapetus** — Iapetus has albedo 0.05–0.50 (two-tone surface). The albedo used in the script is 0.05 (the dark face). Given Aryth's association with Dolurrh (passage, death), is the dark-face albedo the right choice? Or should it be the bright face (0.50)?
	1. ANSWER: Use the midpoint.

6. **Lore review:** Are there any other moons whose reference feel wrong or out of character? Each Eberron moon has a title and planar association — the reference should feel appropriate.

---

## Evaluation Rubric

For each contested moon, score candidate references on:

- **Lore fit** — Does the reference moon's character (size, brightness, orbit shape) match the Eberron moon's narrative identity?
- **Constraint compliance** — Does it satisfy the hard constraints above?
- **Numerical plausibility** — Does the eccentricity avoid impossible orbit overlap? Does inclination feel right in the sky?
- **Uniqueness** — Prefer references not already used by another moon.

---

## Research / Discussion

*(Fill in during design session)*

---

## Decision

*(Fill in when concluded — one line per moon stating final reference and why)*

---

## Resulting Actions

When this design discussion is concluded:

- [ ] Update DESIGN.md §7.4 with final mapping table
- [ ] Add task to tasks.md Phase 1: "Update Dravago inclination to reference [chosen moon]"
- [ ] Add task to tasks.md Phase 1: "Update Barrakas inclination to match Therendor; add weak anti-phase coupling"
- [ ] Add task to tasks.md Phase 1: "Update Lharvion to reference [chosen moon]; verify no eccentricity clamping"
- [ ] Add task to tasks.md Phase 1: "Audit all other moons against final mapping table; update any that changed"
- [ ] Confirm or update the "revisit all moon reference selections" task in tasks.md is closed
