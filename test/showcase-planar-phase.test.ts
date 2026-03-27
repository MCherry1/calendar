import { describe, it } from 'node:test';
import { ok as assert, strictEqual as assertEquals } from 'node:assert/strict';
import { getAllShowcasePlanarPhases } from '../src/showcase/planar-phase.js';
import { toWorldSerialFromRegularDate } from '../src/showcase/world-calendar.js';

function phaseFor(plane: string, serial: number){
  return getAllShowcasePlanarPhases(serial).find(function(p){ return p.name === plane; });
}

describe('Showcase planar phase bands', () => {
  it('keeps active phases inside their full bands (not on boundary lines only)', () => {
    var start = toWorldSerialFromRegularDate('eberron', 998, 6, 1); // Fernia coterminous anchor
    var end = start + (5 * 336); // one Fernia orbit
    var sawCotInterior = false;
    var sawNeuInterior = false;
    var sawRemInterior = false;

    for (var serial = start; serial < end; serial++) {
      var fernia = phaseFor('Fernia', serial);
      assert(fernia, 'Fernia result expected');
      if (fernia!.phase === 'coterminous' && fernia!.position > 0.02 && fernia!.position < (1 / 3) - 0.02) sawCotInterior = true;
      if (fernia!.phase === 'neutral' && fernia!.position > (1 / 3) + 0.02 && fernia!.position < (2 / 3) - 0.02) sawNeuInterior = true;
      if (fernia!.phase === 'remote' && fernia!.position > (2 / 3) + 0.02 && fernia!.position < 0.98) sawRemInterior = true;
      if (sawCotInterior && sawNeuInterior && sawRemInterior) break;
    }

    assert(sawCotInterior, 'Fernia should move inside coterminous band');
    assert(sawNeuInterior, 'Fernia should move inside neutral band');
    assert(sawRemInterior, 'Fernia should move inside remote band');
  });

  it('applies Mabar remote only during the 5-year window and keeps annual coterminous', () => {
    // Mabar remote base year is 999 in showcase logic.
    var remoteWindow = toWorldSerialFromRegularDate('eberron', 999, 5, 25); // Nymm 25
    var nonRemoteWindow = toWorldSerialFromRegularDate('eberron', 1000, 5, 25);
    var annualCot = toWorldSerialFromRegularDate('eberron', 1000, 11, 26); // Vult 26

    var mabarRemote = phaseFor('Mabar', remoteWindow);
    var mabarNotRemote = phaseFor('Mabar', nonRemoteWindow);
    var mabarCot = phaseFor('Mabar', annualCot);

    assert(mabarRemote, 'Mabar should be present');
    assert(mabarNotRemote, 'Mabar should be present');
    assert(mabarCot, 'Mabar should be present');

    assertEquals(mabarRemote!.phase, 'remote');
    assert(mabarRemote!.position >= (2 / 3), 'Mabar remote should sit in remote band');
    assertEquals(mabarNotRemote!.phase, 'neutral');
    assertEquals(mabarCot!.phase, 'coterminous');
    assert(mabarCot!.position <= (1 / 3), 'Mabar annual coterminous should sit in coterminous band');
  });
});
