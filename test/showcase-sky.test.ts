import { describe, it } from 'node:test';
import { deepStrictEqual as assertDeepEqual, ok as assert, strictEqual as assertEquals } from 'node:assert/strict';
import { buildSkyScene } from '../src/showcase/sky-scene.js';

describe('Showcase Sky Scene', () => {
  it('is deterministic for a fixed world/date/time', () => {
    const left = buildSkyScene({ worldId: 'eberron', serial: 42, timeFrac: 22 / 24 });
    const right = buildSkyScene({ worldId: 'eberron', serial: 42, timeFrac: 22 / 24 });
    assertDeepEqual(left, right);
  });

  it('returns altitude-sorted moons with sane ranges', () => {
    const scene = buildSkyScene({ worldId: 'eberron', serial: 42, timeFrac: 22 / 24 });
    assert(scene.moons.length > 1);
    for (let i = 0; i < scene.moons.length; i++) {
      const moon = scene.moons[i];
      assert(moon.altitudeExact >= -90 && moon.altitudeExact <= 90, 'altitude should stay in range');
      assert(moon.azimuth >= 0 && moon.azimuth < 360, 'azimuth should stay in range');
      assert(moon.angularDiameterDeg > 0, 'angular diameter should be positive');
      assert(moon.pctFull >= 0 && moon.pctFull <= 100, 'phase percentage should stay in range');
      if (i > 0) assert(scene.moons[i - 1].altitudeExact >= moon.altitudeExact, 'scene should be altitude-sorted');
    }
  });

  it('keeps phase stable across time-of-day changes on the same serial', () => {
    const dawn = buildSkyScene({ worldId: 'gregorian', serial: 120, timeFrac: 6 / 24 });
    const dusk = buildSkyScene({ worldId: 'gregorian', serial: 120, timeFrac: 18 / 24 });
    assertEquals(dawn.moons.length, dusk.moons.length);
    assertEquals(dawn.moons[0].pctFull, dusk.moons[0].pctFull);
    assertEquals(dawn.moons[0].phase.waxing, dusk.moons[0].phase.waxing);
    assert(dawn.moons[0].altitudeExact !== dusk.moons[0].altitudeExact, 'position should change with time of day');
  });
});
