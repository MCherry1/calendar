import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { worlds, date, moons, planes } from '@partybuff/calendar-engine';

describe('@partybuff/calendar-engine smoke', () => {
  it('exposes the 8 day-one worlds', () => {
    const ids = worlds.list();
    for (const id of [
      'eberron', 'faerun', 'greyhawk', 'dragonlance',
      'exandria', 'mystara', 'birthright', 'gregorian',
    ]) {
      assert.ok(ids.includes(id as never), `missing world: ${id}`);
    }
  });

  it('returns a populated Eberron world', () => {
    const eberron = worlds.get('eberron');
    assert.equal(eberron.id, 'eberron');
    assert.ok(eberron.moons.length > 0, 'eberron has moons');
    assert.equal(eberron.hasPlanarCycles, true);
    assert.ok(eberron.holidays.length > 0, 'eberron has holidays');
  });

  it('round-trips a CalendarDate through Serial', () => {
    const original = { kind: 'month', year: 998, monthIndex: 0, day: 1 } as const;
    const serial = date.toSerial('eberron', original);
    const back = date.fromSerial('eberron', serial);
    assert.deepEqual(back, original);
  });

  it('returns moon phases for Eberron on a given date', () => {
    const d = { kind: 'month', year: 998, monthIndex: 0, day: 1 } as const;
    const phases = moons.phasesOn('eberron', d);
    assert.ok(phases.length === 12, `expected 12 Eberron moons, got ${phases.length}`);
    for (const p of phases) {
      assert.ok(typeof p.illumination === 'number');
      assert.ok(typeof p.waxing === 'boolean');
      assert.ok(typeof p.label === 'string');
    }
  });

  it('returns planar states for Eberron on a given date', () => {
    const d = { kind: 'month', year: 998, monthIndex: 0, day: 1 } as const;
    const states = planes.statesOn(d);
    assert.ok(states.length > 0, 'eberron has plane states');
    for (const s of states) {
      assert.ok(['coterminous', 'remote', 'neutral'].includes(s.phase));
    }
  });
});
