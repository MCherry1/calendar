// Standalone planar phase calculator for the showcase site.
// Duplicates the essential plane data from planes.ts to avoid importing
// Roll20-dependent modules that esbuild cannot bundle for the browser.

import { toWorldSerialFromRegularDate, fromWorldSerial } from './world-calendar.js';

var YEAR_DAYS = 336; // Eberron: 12 months x 28 days

// ---------------------------------------------------------------------------
// Plane data (subset of PLANE_DATA.eberron from planes.ts)
// ---------------------------------------------------------------------------

type ShowcasePlane = {
  name: string;
  color: string;
  type: 'cyclic' | 'fixed';
  fixedPhase?: string;
  orbitYears?: number;
  coterminousDays?: number | null;
  coterminousYears?: number | null;
  remoteDays?: number | null;
  remoteYears?: number | null;
  anchorYear?: number;
  anchorPhase?: string;
  anchorMonth?: number;
  anchorDay?: number;
  remoteOrbitYears?: number;
  remoteDaysSpecial?: number;
};

var PLANES: ShowcasePlane[] = [
  { name: 'Daanvi',     color: '#C9A227', type: 'cyclic',
    orbitYears: 400, coterminousDays: null, coterminousYears: 100, remoteDays: null, remoteYears: 100,
    anchorYear: 800, anchorPhase: 'coterminous' },
  { name: 'Dal Quor',   color: '#7B68AE', type: 'fixed', fixedPhase: 'remote' },
  { name: 'Dolurrh',    color: '#808080', type: 'cyclic',
    orbitYears: 100, coterminousDays: null, coterminousYears: 1, remoteDays: null, remoteYears: 1,
    anchorYear: 950, anchorPhase: 'coterminous' },
  { name: 'Fernia',     color: '#FF5722', type: 'cyclic',
    orbitYears: 5, coterminousDays: 28, remoteDays: 28,
    anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 7 },
  { name: 'Irian',      color: '#F0F0F0', type: 'cyclic',
    orbitYears: 3, coterminousDays: 10, remoteDays: 10,
    anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 4, anchorDay: 1 },
  { name: 'Kythri',     color: '#2E8B8B', type: 'fixed', fixedPhase: 'neutral' },
  { name: 'Lamannia',   color: '#228B22', type: 'cyclic',
    orbitYears: 1, coterminousDays: 7, remoteDays: 7,
    anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 6, anchorDay: 24 },
  { name: 'Mabar',      color: '#111111', type: 'cyclic',
    orbitYears: 1, coterminousDays: 3, remoteDays: 0,
    anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 12, anchorDay: 26,
    remoteOrbitYears: 5, remoteDaysSpecial: 5 },
  { name: 'Risia',      color: '#00ACC1', type: 'cyclic',
    orbitYears: 5, coterminousDays: 28, remoteDays: 28,
    anchorYear: 996, anchorPhase: 'coterminous', anchorMonth: 1 },
  { name: 'Shavarath',  color: '#8B0000', type: 'cyclic',
    orbitYears: 36, coterminousDays: null, coterminousYears: 1, remoteDays: null, remoteYears: 1,
    anchorYear: 990, anchorPhase: 'coterminous' },
  { name: 'Syrania',    color: '#64B5F6', type: 'cyclic',
    orbitYears: 10, coterminousDays: 1, remoteDays: 1,
    anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 9, anchorDay: 9 },
  { name: 'Thelanis',   color: '#50C878', type: 'cyclic',
    orbitYears: 225, coterminousDays: null, coterminousYears: 7, remoteDays: null, remoteYears: 7,
    anchorYear: 800, anchorPhase: 'coterminous' },
  { name: 'Xoriat',     color: '#9ACD32', type: 'fixed', fixedPhase: 'remote' }
];

// ---------------------------------------------------------------------------
// Axis layout: 12 axes at 15-degree intervals (0-165).
// Each plane's axis extends as a full diameter. Orthogonal pairs are 90deg apart.
// ---------------------------------------------------------------------------

type AxisDef = { angle: number; name: string; pair: string };

var AXES: AxisDef[] = [
  { angle: 0,   name: 'Fernia',     pair: 'Risia' },
  { angle: 15,  name: 'Irian',      pair: 'Mabar' },
  { angle: 30,  name: 'Daanvi',     pair: 'Kythri' },
  { angle: 45,  name: 'Syrania',    pair: 'Shavarath' },
  { angle: 60,  name: 'Lamannia',   pair: 'Xoriat' },
  { angle: 75,  name: 'Thelanis',   pair: 'Dolurrh' },
  { angle: 90,  name: 'Risia',      pair: 'Fernia' },
  { angle: 105, name: 'Mabar',      pair: 'Irian' },
  { angle: 120, name: 'Kythri',     pair: 'Daanvi' },
  { angle: 135, name: 'Shavarath',  pair: 'Syrania' },
  { angle: 150, name: 'Xoriat',     pair: 'Lamannia' },
  { angle: 165, name: 'Dolurrh',    pair: 'Thelanis' }
];

// Build lookup: planeName -> AxisDef
var _axisMap: Record<string, AxisDef> = {};
for (var i = 0; i < AXES.length; i++) _axisMap[AXES[i].name] = AXES[i];

// ---------------------------------------------------------------------------
// Phase calculation (ported from planes.ts _planeCycleMetrics + getPlanarState)
// ---------------------------------------------------------------------------

type CycleMetrics = {
  orbitDays: number;
  coterminousDays: number;
  remoteDays: number;
  transitionDays: number;
  phases: { name: string; dur: number }[];
};

function _cycleMetrics(plane: ShowcasePlane): CycleMetrics {
  var coterminousDays = plane.coterminousDays || ((plane.coterminousYears || 0) * YEAR_DAYS);
  var remoteDays = plane.remoteDays || ((plane.remoteYears || 0) * YEAR_DAYS);
  var orbitDays = (plane.orbitYears || 1) * YEAR_DAYS;
  var transitionDays = (orbitDays - coterminousDays - remoteDays) / 2;
  if (transitionDays < 1) transitionDays = 1;
  return {
    orbitDays: orbitDays,
    coterminousDays: coterminousDays,
    remoteDays: remoteDays,
    transitionDays: transitionDays,
    phases: [
      { name: 'coterminous', dur: coterminousDays },
      { name: 'neutral',     dur: transitionDays },
      { name: 'remote',      dur: remoteDays },
      { name: 'neutral',     dur: transitionDays }
    ]
  };
}

function _anchorSerial(plane: ShowcasePlane): number {
  var mi = (plane.anchorMonth != null) ? (plane.anchorMonth - 1) : 0;
  var day = (plane.anchorDay != null) ? plane.anchorDay : 1;
  return toWorldSerialFromRegularDate('eberron', plane.anchorYear || 998, mi, day);
}

type PhaseWalkResult = {
  phase: string;
  position: number; // 0=center, 1=remote outer edge (band-based continuous position)
  orbitNum: number;
  phaseIntoDays: number;
  phaseDurationDays: number;
  previousPhase: string;
};

function _walkPhase(plane: ShowcasePlane, serial: number): PhaseWalkResult {
  var cycle = _cycleMetrics(plane);
  var anchor = _anchorSerial(plane);
  var anchorPhaseName = plane.anchorPhase || 'coterminous';

  // Find anchor phase index
  var anchorPhaseIdx = 0;
  for (var p = 0; p < cycle.phases.length; p++) {
    if (cycle.phases[p].name === anchorPhaseName) { anchorPhaseIdx = p; break; }
  }

  var daysSinceAnchor = serial - anchor;
  var offset = daysSinceAnchor % cycle.orbitDays;
  if (offset < 0) offset += cycle.orbitDays;

  var orbitNum = Math.floor(daysSinceAnchor / cycle.orbitDays);
  if (daysSinceAnchor < 0) orbitNum -= 1;

  // Walk through phases from anchor phase
  var accumulated = 0;
  for (var pi = 0; pi < cycle.phases.length; pi++) {
    var idx = (anchorPhaseIdx + pi) % cycle.phases.length;
    var ph = cycle.phases[idx];
    if (offset < accumulated + ph.dur) {
      var into = offset - accumulated;
      var previousIdx = (idx + cycle.phases.length - 1) % cycle.phases.length;
      var previousPhase = cycle.phases[previousIdx].name;

      return {
        phase: ph.name,
        position: _bandPositionFromPhase(ph.name, into, ph.dur, previousPhase),
        orbitNum: orbitNum,
        phaseIntoDays: into,
        phaseDurationDays: ph.dur,
        previousPhase: previousPhase
      };
    }
    accumulated += ph.dur;
  }

  // Fallback (shouldn't reach here)
  return {
    phase: 'neutral',
    position: 0.5,
    orbitNum: orbitNum,
    phaseIntoDays: 0,
    phaseDurationDays: 1,
    previousPhase: 'coterminous'
  };
}

function _bandPositionFromPhase(phase: string, phaseIntoDays: number, phaseDurationDays: number, previousPhase: string): number {
  var denom = Math.max(1, phaseDurationDays);
  var t = Math.max(0, Math.min(1, phaseIntoDays / denom));
  var bandMin = 0;
  var bandMax = 1;

  if (phase === 'coterminous') {
    bandMin = 0.0;
    bandMax = 1 / 3;
    return bandMin + ((bandMax - bandMin) * t);
  }

  if (phase === 'remote') {
    bandMin = 2 / 3;
    bandMax = 1.0;
    return bandMin + ((bandMax - bandMin) * t);
  }

  // Neutral has two passes each cycle:
  // after coterminous it moves outward (coterminous -> remote),
  // after remote it moves inward (remote -> coterminous).
  if (previousPhase === 'coterminous') {
    bandMin = 1 / 3;
    bandMax = 2 / 3;
    return bandMin + ((bandMax - bandMin) * t);
  }
  bandMin = 1 / 3;
  bandMax = 2 / 3;
  return bandMax - ((bandMax - bandMin) * t);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type PlanarPhaseResult = {
  name: string;
  color: string;
  phase: string;
  /** 0.0 = coterminous (center), 1.0 = remote (outer edge). Continuous. */
  position: number;
  /** Axis angle in degrees (0-180). Disc swings both ways along this diameter. */
  axisAngle: number;
  /** true = disc is on the axisAngle side, false = on axisAngle+180 side */
  onPrimarySide: boolean;
  isFixed: boolean;
  isDalQuor: boolean;
  dalQuorOrbitAngle?: number;
  cycleDays?: number;
  cycleOffsetDays?: number;
  toCoterminousDays?: number | null;
  toRemoteDays?: number | null;
};

export function getAllShowcasePlanarPhases(serial: number): PlanarPhaseResult[] {
  var results: PlanarPhaseResult[] = [];

  // First pass: compute cyclic planes so fixed-mirror planes can reference their partners
  var cyclicResults: Record<string, PhaseWalkResult> = {};
  for (var i = 0; i < PLANES.length; i++) {
    var plane = PLANES[i];
    if (plane.type === 'cyclic') {
      cyclicResults[plane.name] = _walkPhase(plane, serial);
    }
  }

  for (var j = 0; j < PLANES.length; j++) {
    var pl = PLANES[j];
    var axis = _axisMap[pl.name];

    // Dal Quor: unpaired, orbits outside
    if (pl.name === 'Dal Quor') {
      var dalCycleDays = YEAR_DAYS * 13;
      var dalOffset = ((serial % dalCycleDays) + dalCycleDays) % dalCycleDays;
      var dalAngle = 360 - ((dalOffset / dalCycleDays) * 360);
      results.push({
        name: pl.name,
        color: pl.color,
        phase: 'remote',
        position: 1.0,
        axisAngle: 0,
        onPrimarySide: true,
        isFixed: true,
        isDalQuor: true,
        dalQuorOrbitAngle: dalAngle,
        cycleDays: dalCycleDays,
        cycleOffsetDays: dalOffset,
        toCoterminousDays: null,
        toRemoteDays: null
      });
      continue;
    }

    if (!axis) continue;

    if (pl.type === 'fixed') {
      // Fixed planes: Xoriat (remote) mirrors Lamannia, Kythri (neutral) mirrors Daanvi
      var fixedPosition = pl.fixedPhase === 'remote' ? 1.0 : 0.5;
      var partnerResult = cyclicResults[axis.pair];
      // Mirror: use opposite side from partner
      var partnerOnPrimary = partnerResult ? (partnerResult.orbitNum % 2 === 0) : true;
      results.push({
        name: pl.name,
        color: pl.color,
        phase: pl.fixedPhase || 'neutral',
        position: fixedPosition,
        axisAngle: axis.angle,
        onPrimarySide: !partnerOnPrimary,
        isFixed: true,
        isDalQuor: false,
        toCoterminousDays: null,
        toRemoteDays: null
      });
      continue;
    }

    // Cyclic plane
    var walk = cyclicResults[pl.name];
    if (!walk) continue;

    var phase = walk.phase;
    var cycle = _cycleMetrics(pl);
    var anchor = _anchorSerial(pl);
    var cycleOffset = ((serial - anchor) % cycle.orbitDays + cycle.orbitDays) % cycle.orbitDays;
    var position = walk.position;
    var onPrimary = (walk.orbitNum % 2 === 0);

    // Mabar special case: 5-year remote window around summer solstice
    if (pl.remoteOrbitYears && pl.remoteDaysSpecial) {
      var date = fromWorldSerial('eberron', serial);
      var yearStart = toWorldSerialFromRegularDate('eberron', date.year, 0, 1);
      var dayOfYear = serial - yearStart;
      var remoteBaseYear = (pl.anchorYear || 998) + 1;
      var yearsSince = date.year - remoteBaseYear;
      var isRemoteYear = (yearsSince >= 0 && (yearsSince % pl.remoteOrbitYears) === 0);

      if (isRemoteYear && phase !== 'coterminous') {
        // Summer solstice = Nymm 27 = day 167 (month 5 * 28 + 27 - 1 = 167)
        var solstice = 5 * 28 + 26;
        var remoteDur = pl.remoteDaysSpecial;
        var remoteStart = solstice - Math.floor(remoteDur / 2);
        var remoteEnd = remoteStart + remoteDur - 1;

        if (dayOfYear >= remoteStart && dayOfYear <= remoteEnd) {
          phase = 'remote';
          position = _bandPositionFromPhase('remote', dayOfYear - remoteStart, remoteDur, 'neutral');
        }
      }
    }

    results.push({
      name: pl.name,
      color: pl.color,
      phase: phase,
      position: position,
      axisAngle: axis.angle,
      onPrimarySide: onPrimary,
      isFixed: false,
      isDalQuor: false,
      cycleDays: cycle.orbitDays,
      cycleOffsetDays: cycleOffset,
      toCoterminousDays: _timeToPhase(cycle, cycleOffset, 'coterminous'),
      toRemoteDays: _timeToPhase(cycle, cycleOffset, 'remote')
    });
  }

  return results;
}

function _timeToPhase(cycle: CycleMetrics, cycleOffset: number, targetPhase: 'coterminous' | 'remote'): number {
  var offsetToTarget = 0;
  var found = false;
  for (var i = 0; i < cycle.phases.length; i++) {
    if (cycle.phases[i].name === targetPhase) {
      found = true;
      break;
    }
    offsetToTarget += cycle.phases[i].dur;
  }
  if (!found) return cycle.orbitDays;
  var delta = offsetToTarget - cycleOffset;
  if (delta <= 0) delta += cycle.orbitDays;
  return delta;
}
