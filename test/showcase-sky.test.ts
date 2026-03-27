import { describe, it } from 'node:test';
import { deepStrictEqual as assertDeepEqual, ok as assert, strictEqual as assertEquals } from 'node:assert/strict';
import { buildSkyScene, moonPhasesForDay } from '../src/showcase/sky-scene.js';
import { toWorldSerialFromRegularDate } from '../src/showcase/world-calendar.js';

function skyPoint(moon: ReturnType<typeof buildSkyScene>['moons'][number]) {
  const altitude = Math.max(0, Math.min(90, moon.altitudeExact));
  const radial = 100 * (1 - altitude / 90);
  const azimuth = moon.azimuth * Math.PI / 180;
  return {
    x: Math.sin(azimuth) * radial,
    y: -Math.cos(azimuth) * radial,
  };
}

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

  it('keeps moon positions continuous across midnight in the preview scene', () => {
    const nuitariBefore = buildSkyScene({ worldId: 'dragonlance', serial: 8, timeFrac: 1430 / 1440 });
    const nuitariAfter = buildSkyScene({ worldId: 'dragonlance', serial: 9, timeFrac: 0 });
    const nuitariPrev = nuitariBefore.moons.find((moon) => moon.name === 'Nuitari');
    const nuitariNext = nuitariAfter.moons.find((moon) => moon.name === 'Nuitari');
    assert(nuitariPrev && nuitariNext, 'Nuitari should be present on both sides of midnight');
    const nuitariDistance = Math.hypot(
      skyPoint(nuitariNext).x - skyPoint(nuitariPrev).x,
      skyPoint(nuitariNext).y - skyPoint(nuitariPrev).y,
    );
    assert(nuitariDistance < 6, `Nuitari should not jump at midnight, got ${nuitariDistance}`);

    const zarantyrBefore = buildSkyScene({ worldId: 'eberron', serial: 5, timeFrac: 1430 / 1440 });
    const zarantyrAfter = buildSkyScene({ worldId: 'eberron', serial: 6, timeFrac: 0 });
    const zarantyrPrev = zarantyrBefore.moons.find((moon) => moon.name === 'Zarantyr');
    const zarantyrNext = zarantyrAfter.moons.find((moon) => moon.name === 'Zarantyr');
    assert(zarantyrPrev && zarantyrNext, 'Zarantyr should be present on both sides of midnight');
    const zarantyrDistance = Math.hypot(
      skyPoint(zarantyrNext).x - skyPoint(zarantyrPrev).x,
      skyPoint(zarantyrNext).y - skyPoint(zarantyrPrev).y,
    );
    assert(zarantyrDistance < 6, `Zarantyr should not jump at midnight, got ${zarantyrDistance}`);
  });

  it('flags Dravago as retrograde in the showcase scene', () => {
    const scene = buildSkyScene({ worldId: 'eberron', serial: 42, timeFrac: 22 / 24 });
    const dravago = scene.moons.find((moon) => moon.name === 'Dravago');
    assert(dravago, 'Dravago should be present in the Eberron showcase sky');
    assertEquals(!!dravago?.retrograde, true);
  });

  it('uses distinct Dragonlance moon cycles instead of collapsing to Luna defaults', () => {
    const phases = moonPhasesForDay('dragonlance', 42);
    const signatures = phases.map((moon) => `${Math.round(moon.illum * 100)}:${moon.waxing ? 'W' : 'N'}`);
    assert(new Set(signatures).size > 1, 'Dragonlance moons should not all share the same phase state');
  });

  it('anchors the default Night of the Eye at midnight with Luna-like altitude and requested eye sizes', () => {
    const anchorSerial = toWorldSerialFromRegularDate('dragonlance', 346, 6, 7);
    const scene = buildSkyScene({ worldId: 'dragonlance', serial: anchorSerial, timeFrac: 0 });
    assertEquals(scene.moons.length, 3);

    for (const moon of scene.moons) {
      assertEquals(moon.pctFull, 100);
      assert(moon.altitudeExact > 50 && moon.altitudeExact < 65, `${moon.name} should follow a Luna-like non-zenith path at the default Night of the Eye`);
    }

    const solinari = scene.moons.find((moon) => moon.name === 'Solinari');
    const lunitari = scene.moons.find((moon) => moon.name === 'Lunitari');
    const nuitari = scene.moons.find((moon) => moon.name === 'Nuitari');
    assert(solinari && lunitari && nuitari, 'Dragonlance should include all three moons');

    assert(Math.abs(lunitari.angularDiameterDeg - 0.53) < 0.01, 'Lunitari should match Luna size');
    assert(Math.abs((solinari.angularDiameterDeg / lunitari.angularDiameterDeg) - 2.0) < 0.02, 'Solinari should be about twice Lunitari');
    assert(Math.abs((nuitari.angularDiameterDeg / lunitari.angularDiameterDeg) - 0.35) < 0.02, 'Nuitari should be about 35% of Lunitari');
  });
});
