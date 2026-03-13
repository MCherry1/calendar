# Deterministic Seeds

This note is for maintainers and GMs who need to understand which parts of the script are seed-driven, which parts are merely stateful, and what will or will not reproduce across campaigns.

## Shared Rule

"Deterministic" in this repository means a subsystem can reproduce the same output from the same inputs without storing every intermediate result by hand.

In practice, the script uses three different patterns:

- **Seed-driven deterministic generation** for moons and many planar calculations.
- **Stateful sequential generation** for weather.
- **GM override layers** that intentionally replace the generated answer.

If two campaigns use the same calendar state, the same system seed inputs, and the same overrides, they will produce the same moon and planar results. Weather is the exception: it is stable after generation, but it is not currently rebuilt from a hashed world seed.

## Weather

Weather uses deterministic tables plus live rolls.

- Climate, geography, and terrain select deterministic baseline ranges.
- Daily continuity is deterministic once yesterday's stored result is known: `CONFIG_WEATHER_SEED_STRENGTH` nudges the next day back toward the local seasonal baseline.
- The actual day generation still uses `_rollDie()`, which resolves through Roll20's `randomInteger()` when available.
- Generated records are then stored in `state[state_name].weather.forecast` and later moved into `history` when they pass into the past.

Operationally, that means:

- The same already-generated weather record remains stable when revisited.
- Past days are locked once archived.
- GM rerolls and forced regenerations intentionally create a new branch of history.
- Changing location invalidates the old location-specific forecast assumptions.

So weather is **persistent and internally coherent**, but not presently "same seed, same campaign weather everywhere" deterministic in the same way moons and planes are.

## Moons

Moons are explicitly seed-driven.

- Each moon definition includes an `epochSeed` with a `defaultSeed` word and a `referenceDate`.
- `_generateStandardSequence()` converts that seed word into a reproducible epoch offset with `_moonHashStr(seedWord) * synodicPeriod`.
- A deterministic PRNG (`_moonPrng`) then drives per-cycle variation so the same moon/seed combination produces the same sequence every time.
- The GM-facing command `!cal moon seed <word>` sets one global system seed in `moon.systemSeed`; that seed is then namespaced per moon before sequence generation.

Sequence generation is still layered:

- Default seeded generation provides the baseline cycle.
- GM hard anchors (`!cal moon full ...`, `!cal moon new ...`) override specific events.
- Festival nudges and anti-phase coupling are deterministic transforms applied on top of the seeded baseline.

Result: same calendar state plus same moon seed equals the same generated moon events, unless the GM has deliberately anchored something by hand.

## Planes

Planar behavior mixes deterministic cycle math with seeded anchor offsets.

### Traditional cycles

- Canonical plane definitions provide the orbit structure, phase order, and anchor defaults.
- For planes flagged `seedAnchor`, `getPlanarState()` offsets the base anchor using `ensureSettings().epochSeed` together with `_dN(epoch, salt, sides)`.
- Some planes use the same seed machinery for remote sub-cycles and floating start days.
- `linkedTo` lets paired planes derive offsets from the same seed source when their cycles should stay coordinated.

### Generated planar events

- Off-cycle planar events are also deterministic.
- Trigger checks, durations, and coterminous/remote results all use `_dN(serial, salt, sides)`.
- Because the salt includes plane identity and serial day, the same world seed and date produce the same generated-event decisions.

### GM overrides

- `!cal planes anchor <name> <phase> <dateSpec>` sets a direct traditional anchor.
- `!cal planes seed <name> <year>` replaces the seed-derived anchor year for one seed-anchored plane.
- Manual phase overrides temporarily supersede the generated answer.

Result: planes are reproducible from world seed plus overrides, with no need to persist every future event in state.

## What To Change If You Need More Reproducibility

If you want a subsystem to be reproducible across fresh sandboxes, make sure its random path is derived from explicit inputs rather than Roll20 runtime RNG.

- Use `_dN(serial, salt, sides)` or another hash-based path when the answer should be reconstructible from date plus seed.
- Store only the minimum override state needed to preserve GM intent.
- Document whether the subsystem is fully seed-driven, partially seed-driven, or merely stable after generation.

At the moment:

- **Moons:** fully seed-driven, plus optional GM anchors.
- **Planes:** largely seed-driven, plus optional GM anchors and overrides.
- **Weather:** table-driven and stateful, but not yet fully seed-driven.
