import { WORLDS } from '../worlds/index.js';
import { toWorldSerialFromRegularDate, worldAverageYearDays } from './world-calendar.js';

export type SkyScenePhase = {
  illum: number;
  waxing: boolean;
  longShadows?: boolean;
};

export type SkySceneMoon = {
  moon?: any;
  key: string;
  name: string;
  title?: string;
  color?: string;
  albedo?: number;
  orbitalDistance?: number;
  altitude: number;
  altitudeExact: number;
  azimuth: number;
  hourAngle: number;
  direction: string;
  motion: string;
  angularDiameterDeg: number;
  category: string;
  phase: SkyScenePhase;
  retrograde?: boolean;
  pctFull: number;
  label: string;
  skyLabel: string;
};

export type SkyScene = {
  worldId: string;
  worldLabel: string;
  serial: number;
  timeFrac: number;
  observerLatitude: number;
  moons: SkySceneMoon[];
};

type MoonLike = {
  key?: string;
  name: string;
  title?: string;
  color?: string;
  synodicPeriod?: number;
  siderealPeriod?: number;
  baseCycleDays?: number;
  diameter?: number;
  distance?: number;
  inclination?: number;
  eccentricity?: number;
  albedo?: number;
  data?: Record<string, any>;
  phaseMode?: string;
  visibilityMode?: string;
  epochSeed?: { defaultSeed?: string; referenceDate?: { year: number; month: number; day: number } };
  motionTuning?: Record<string, any>;
  orbitalData?: Record<string, any>;
  fixedAnchor?: {
    referenceDate?: { year: number; month: number; day: number };
    timeFrac?: number;
    phaseAngleDeg?: number;
    skyLongDeg?: number;
    overheadAtAnchor?: boolean;
    observerLatitudeDeg?: number;
  };
};

type BuildSkySceneResolvedInput = {
  worldId: string;
  serial: number;
  timeFrac: number;
  observerLatitude?: number;
  moons: MoonLike[];
  phaseAt: (moon: MoonLike, serial: number) => SkyScenePhase;
  skyLongAt: (moon: MoonLike, serial: number, phase: SkyScenePhase) => number;
  eclipticLatAt: (moon: MoonLike, serial: number, skyLongDeg: number) => number;
  angularDiameterDegAt: (moon: MoonLike, serial: number) => number;
  orbitalDistanceAt?: (moon: MoonLike, serial: number) => number;
  retrogradeAt?: (moon: MoonLike, serial: number) => boolean;
};

export var DEFAULT_OBSERVER_LATITUDE = 37.77; // San Francisco latitude
export var SUN_ANGULAR_DIAM_DEG = 0.53;
var LUNA_ANALOG = {
  synodicPeriod: 29.53059,
  diameter: 3474.8,
  distance: 384400,
  inclination: 5.145,
  eccentricity: 0.0549,
  albedo: 0.12
};

var SHOWCASE_MOON_OVERRIDES: Record<string, Record<string, Partial<MoonLike>>> = {
  eberron: {
    Zarantyr:  { synodicPeriod: 27.32, diameter: 1250, distance: 14300, inclination: 5.145, eccentricity: 0.0549, albedo: 0.12, epochSeed: { defaultSeed: 'kythri', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 9.08 }, motionTuning: { inclinationBase: 5.145, inclinationAmp: 1.5, inclinationPeriodDays: 336, ascendingNode: 120, nodePrecessionDegPerYear: 12, distanceSwingPct: 0.11, distancePeriodDays: 336, apsisAngle: 20, apsisPrecessionDegPerYear: 24 } },
    Olarune:   { synodicPeriod: 30.8052, diameter: 1000, distance: 18000, inclination: 0.33, eccentricity: 0.0288, albedo: 0.22, epochSeed: { defaultSeed: 'lamannia', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 5.73 }, motionTuning: { inclinationBase: 0.33, inclinationAmp: 0.15, inclinationPeriodDays: 504, ascendingNode: 60, nodePrecessionDegPerYear: 8, distanceSwingPct: 0.058, distancePeriodDays: 448, apsisAngle: 80, apsisPrecessionDegPerYear: 12 } },
    Therendor: { synodicPeriod: 34.735, diameter: 1100, distance: 39000, inclination: 0.03, eccentricity: 0.0022, albedo: 0.99, epochSeed: { defaultSeed: 'syrania', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 2.91 }, motionTuning: { inclinationBase: 0.03, inclinationAmp: 0.01, inclinationPeriodDays: 336, ascendingNode: 210, nodePrecessionDegPerYear: 10, distanceSwingPct: 0.0044, distancePeriodDays: 336, apsisAngle: 140, apsisPrecessionDegPerYear: 10 } },
    Eyre:      { synodicPeriod: 39.1661, diameter: 1200, distance: 52000, inclination: 1.53, eccentricity: 0.0196, albedo: 0.96, epochSeed: { defaultSeed: 'fernia', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 2.38 }, motionTuning: { inclinationBase: 1.53, inclinationAmp: 0.2, inclinationPeriodDays: 336, ascendingNode: 25, nodePrecessionDegPerYear: 2, distanceSwingPct: 0.0392, distancePeriodDays: 84, apsisAngle: 10, apsisPrecessionDegPerYear: 120 } },
    Dravago:   { synodicPeriod: 44.1625, diameter: 2000, distance: 77500, inclination: 156.8, eccentricity: 0.000016, albedo: 0.76, epochSeed: { defaultSeed: 'risia', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 2.66 }, motionTuning: { inclinationBase: 156.8, inclinationAmp: 0.15, inclinationPeriodDays: 672, ascendingNode: 260, nodePrecessionDegPerYear: 6, distanceSwingPct: 0, distancePeriodDays: 672, apsisAngle: 200, apsisPrecessionDegPerYear: 18 } },
    Nymm:      { synodicPeriod: 49.7962, diameter: 900, distance: 95000, inclination: 0.2, eccentricity: 0.0013, albedo: 0.43, epochSeed: { defaultSeed: 'daanvi', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 0.98 }, motionTuning: { inclinationBase: 0.2, inclinationAmp: 0.05, inclinationPeriodDays: 336, ascendingNode: 0, nodePrecessionDegPerYear: 360, distanceSwingPct: 0.0026, distancePeriodDays: 336, apsisAngle: 0, apsisPrecessionDegPerYear: 0 } },
    Lharvion:  { synodicPeriod: 56.1487, diameter: 1350, distance: 125000, inclination: 7.23, eccentricity: 0.7507, albedo: 0.3, epochSeed: { defaultSeed: 'xoriat', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 1.11 }, motionTuning: { inclinationBase: 0.43, inclinationAmp: 0.2, inclinationPeriodDays: 420, ascendingNode: 40, nodePrecessionDegPerYear: 10, distanceSwingPct: 0.246, distancePeriodDays: 560, apsisAngle: 300, apsisPrecessionDegPerYear: 80 } },
    Barrakas:  { synodicPeriod: 63.3115, diameter: 1500, distance: 144000, inclination: 0.02, eccentricity: 0.0047, albedo: 1.375, epochSeed: { defaultSeed: 'irian', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 1.07 }, motionTuning: { inclinationBase: 0.02, inclinationAmp: 0.01, inclinationPeriodDays: 168, ascendingNode: 300, nodePrecessionDegPerYear: 24, distanceSwingPct: 0.0094, distancePeriodDays: 224, apsisAngle: 260, apsisPrecessionDegPerYear: 48 } },
    Rhaan:     { synodicPeriod: 71.3881, diameter: 800, distance: 168000, inclination: 4.34, eccentricity: 0.0013, albedo: 0.32, epochSeed: { defaultSeed: 'thelanis', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 0.49 }, motionTuning: { inclinationBase: 4.34, inclinationAmp: 0.6, inclinationPeriodDays: 441, ascendingNode: 45, nodePrecessionDegPerYear: 6, distanceSwingPct: 0.0026, distancePeriodDays: 504, apsisAngle: 90, apsisPrecessionDegPerYear: 8 } },
    Sypheros:  { synodicPeriod: 80.495, diameter: 1100, distance: 183000, inclination: 1.08, eccentricity: 0.0151, albedo: 0.071, epochSeed: { defaultSeed: 'mabar', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 0.62 }, motionTuning: { inclinationBase: 1.08, inclinationAmp: 0.2, inclinationPeriodDays: 560, ascendingNode: 180, nodePrecessionDegPerYear: 4, distanceSwingPct: 0.0302, distancePeriodDays: 560, apsisAngle: 150, apsisPrecessionDegPerYear: 5 } },
    Aryth:     { synodicPeriod: 90.7637, diameter: 1300, distance: 195000, inclination: 7.57, eccentricity: 0.0283, albedo: 0.275, epochSeed: { defaultSeed: 'dolurrh', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 0.69 }, motionTuning: { inclinationBase: 7.57, inclinationAmp: 0.4, inclinationPeriodDays: 336, ascendingNode: 15, nodePrecessionDegPerYear: 14, distanceSwingPct: 0.0566, distancePeriodDays: 336, apsisAngle: 0, apsisPrecessionDegPerYear: 16 } },
    Vult:      { synodicPeriod: 102.3424, diameter: 1800, distance: 252000, inclination: 0.07, eccentricity: 0.0014, albedo: 0.23, epochSeed: { defaultSeed: 'shavarath', referenceDate: { year: 998, month: 1, day: 1 } }, orbitalData: { angularSizeVsSun: 0.74 }, motionTuning: { inclinationBase: 0.07, inclinationAmp: 0.03, inclinationPeriodDays: 1008, ascendingNode: 330, nodePrecessionDegPerYear: 2, distanceSwingPct: 0.0028, distancePeriodDays: 1008, apsisAngle: 250, apsisPrecessionDegPerYear: 2 } }
  }
};

export function moonCompass16(azimuthDeg: number){
  var labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  var idx = Math.round((((azimuthDeg % 360) + 360) % 360) / 22.5) % labels.length;
  return labels[idx];
}

export function moonSkyPositionCategory(altDeg: number, angularDiameterDeg: number){
  var radius = Math.max(0.01, angularDiameterDeg || 0) / 2;
  var visibleFraction = Math.max(0, Math.min(1, (altDeg + radius) / Math.max(0.0001, angularDiameterDeg || 0)));
  if (altDeg > 80) return 'overhead';
  if (altDeg >= 60) return 'high';
  if (altDeg >= 30) return 'mid';
  if (altDeg >= 10) return 'low';
  if (altDeg >= 0) return visibleFraction <= (2 / 3) ? 'peeking' : 'horizon';
  if (altDeg + radius > 0) return 'peeking';
  return 'below';
}

export function skyCategoryLabel(category: string){
  if (category === 'overhead') return 'Overhead';
  if (category === 'high') return 'High';
  if (category === 'mid') return 'Mid';
  if (category === 'low') return 'Low';
  if (category === 'horizon') return 'On Horizon';
  if (category === 'peeking') return 'Peeking Over';
  return 'Below Horizon';
}

export function buildSkySceneFromResolved(input: BuildSkySceneResolvedInput): SkyScene {
  var world = WORLDS[String(input.worldId || '').toLowerCase()];
  var observerLatitude = isFinite(input.observerLatitude as number) ? Number(input.observerLatitude) : DEFAULT_OBSERVER_LATITUDE;
  var moons: SkySceneMoon[] = [];
  var timeFrac = _normalizeTimeFrac(input.timeFrac);
  var positionSerial = (Number(input.serial) || 0) + timeFrac;

  for (var i = 0; i < input.moons.length; i++){
    var moon = input.moons[i];
    var phase = input.phaseAt(moon, input.serial) || { illum: 0, waxing: true };
    var positionPhase = input.phaseAt(moon, positionSerial) || phase;
    var skyLong = input.skyLongAt(moon, positionSerial, positionPhase);
    var eclipticLat = input.eclipticLatAt(moon, positionSerial, skyLong);
    var hourAngle = moonHourAngleDeg(skyLong, sunSkyLong(positionSerial, input.worldId), timeFrac);
    var alt = moonAltitudeDeg(observerLatitude, eclipticLat, hourAngle);
    var az = moonAzimuthDeg(observerLatitude, eclipticLat, hourAngle);
    var angularDiameterDeg = input.angularDiameterDegAt(moon, positionSerial);
    var category = moonSkyPositionCategory(alt, angularDiameterDeg);
    var motion = moonMotionLabel(observerLatitude, moon, positionSerial, timeFrac, input.skyLongAt, input.eclipticLatAt, input.phaseAt, input.worldId);
    var direction = moonCompass16(az);
    var pctFull = Math.round((_clamp01(phase.illum || 0)) * 100);
    var retrograde = !!(input.retrogradeAt && input.retrogradeAt(moon, positionSerial));
    var skyLabel = skyCategoryLabel(category) + ', ' + direction + ', ' + motion;
    moons.push({
      moon: moon,
      key: String(moon.key || moon.name || ('moon-' + i)).toLowerCase(),
      name: moon.name,
      title: moon.title,
      color: moon.color,
      albedo: Number(moon.albedo || 0),
      orbitalDistance: input.orbitalDistanceAt ? input.orbitalDistanceAt(moon, positionSerial) : Number(moon.distance || 0),
      altitude: Math.round(alt),
      altitudeExact: alt,
      azimuth: az,
      hourAngle: hourAngle,
      direction: direction,
      motion: motion,
      angularDiameterDeg: angularDiameterDeg,
      category: category,
      phase: phase,
      retrograde: retrograde,
      pctFull: pctFull,
      label: moonPhaseEmoji(phase.illum, phase.waxing) + ' ' + moon.name + ' (' + pctFull + '% Full)',
      skyLabel: skyLabel
    });
  }

  // Keep moons in world-definition order for a stable list display.
  return {
    worldId: String(input.worldId || '').toLowerCase(),
    worldLabel: world ? world.label : String(input.worldId || ''),
    serial: input.serial | 0,
    timeFrac: timeFrac,
    observerLatitude: observerLatitude,
    moons: moons
  };
}

export function buildSkyScene(input: { worldId: string; serial: number; timeFrac: number; observerLatitude?: number }): SkyScene {
  var worldId = String((input && input.worldId) || '').toLowerCase();
  var world = WORLDS[worldId];
  if (!world) throw new Error('Unknown world: ' + worldId);
  var bodies = ((world.moons && world.moons.bodies) || []).map(function(body){
    return _normalizeMoon(worldId, body as MoonLike);
  });

  return buildSkySceneFromResolved({
    worldId: worldId,
    serial: parseInt(String(input && input.serial), 10) || 0,
    timeFrac: Number(input && input.timeFrac) || 0,
    observerLatitude: input && input.observerLatitude,
    moons: bodies,
    phaseAt: function(moon, serial){
      return _phaseAt(worldId, moon, serial);
    },
    skyLongAt: function(moon, serial){
      return _moonSkyLong(moon, serial, worldId);
    },
    eclipticLatAt: function(moon, serial, skyLongDeg){
      return _moonEclipticLat(moon, serial, skyLongDeg, worldId);
    },
    angularDiameterDegAt: function(moon, serial){
      return _moonAngularDiameterDeg(moon, serial, worldId);
    },
    orbitalDistanceAt: function(moon, serial){
      return _orbitalParams(worldId, moon, serial).distance;
    },
    retrogradeAt: function(moon, serial){
      return !!_orbitalParams(worldId, moon, serial).retrograde;
    }
  });
}

export function moonHourAngleDeg(skyLongDeg: number, sunLongDeg: number, timeFrac: number){
  var ha = (skyLongDeg - sunLongDeg - 180 + _normalizeTimeFrac(timeFrac) * 360) % 360;
  if (ha < 0) ha += 360;
  if (ha > 180) ha -= 360;
  return ha;
}

export function moonAltitudeDeg(observerLatitude: number, eclipticLatDeg: number, hourAngleDeg: number){
  var haRad = hourAngleDeg * Math.PI / 180;
  var latRad = observerLatitude * Math.PI / 180;
  var decRad = eclipticLatDeg * Math.PI / 180;
  var sinAlt = Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
}

export function moonAzimuthDeg(observerLatitude: number, eclipticLatDeg: number, hourAngleDeg: number){
  var ha = hourAngleDeg * Math.PI / 180;
  var lat = observerLatitude * Math.PI / 180;
  var dec = eclipticLatDeg * Math.PI / 180;
  var az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  var deg = (az * 180 / Math.PI + 180) % 360;
  return deg < 0 ? deg + 360 : deg;
}

export function sunSkyLong(serial: number, worldId: string){
  return ((serial % worldAverageYearDays(worldId)) / worldAverageYearDays(worldId)) * 360;
}

export function moonPhaseEmoji(illum: number, waxing: boolean){
  var x = _clamp01(illum || 0);
  if (x < 0.03) return '🌑';
  if (x < 0.25) return waxing ? '🌒' : '🌘';
  if (x < 0.5) return waxing ? '🌓' : '🌗';
  if (x < 0.97) return waxing ? '🌔' : '🌖';
  return '🌕';
}

function moonMotionLabel(observerLatitude: number, moon: MoonLike, serial: number, timeFrac: number, skyLongAt: BuildSkySceneResolvedInput['skyLongAt'], eclipticLatAt: BuildSkySceneResolvedInput['eclipticLatAt'], phaseAt: BuildSkySceneResolvedInput['phaseAt'], worldId: string){
  var step = 1 / 96;
  var nowLong = skyLongAt(moon, serial, phaseAt(moon, serial));
  var nowLat = eclipticLatAt(moon, serial, nowLong);
  var altNow = moonAltitudeDeg(observerLatitude, nowLat, moonHourAngleDeg(nowLong, sunSkyLong(serial, worldId), timeFrac));
  var soonTime = _normalizeTimeFrac(timeFrac + step);
  var soonLong = skyLongAt(moon, serial + step, phaseAt(moon, serial + step));
  var soonLat = eclipticLatAt(moon, serial + step, soonLong);
  var altSoon = moonAltitudeDeg(observerLatitude, soonLat, moonHourAngleDeg(soonLong, sunSkyLong(serial, worldId), soonTime));
  return altSoon >= altNow ? 'Rising' : 'Setting';
}

function _normalizeMoon(worldId: string, body: MoonLike): MoonLike {
  var override = (SHOWCASE_MOON_OVERRIDES[worldId] || {})[body.name] || {};
  var data = Object.assign({}, body.data || {}, override.data || {});
  return Object.assign({}, body, override, {
    key: body.key || String(body.name || '').toLowerCase(),
    synodicPeriod: override.synodicPeriod || body.synodicPeriod || body.baseCycleDays || LUNA_ANALOG.synodicPeriod,
    siderealPeriod: override.siderealPeriod || body.siderealPeriod || data.siderealPeriod || null,
    diameter: override.diameter || body.diameter || data.diameter || LUNA_ANALOG.diameter,
    distance: override.distance || body.distance || data.distance || LUNA_ANALOG.distance,
    inclination: override.inclination || body.inclination || data.inclination || LUNA_ANALOG.inclination,
    eccentricity: override.eccentricity || body.eccentricity || data.eccentricity || LUNA_ANALOG.eccentricity,
    albedo: override.albedo || body.albedo || data.albedo || LUNA_ANALOG.albedo,
    epochSeed: override.epochSeed || body.epochSeed || data.epochSeed || null,
    orbitalData: override.orbitalData || body.orbitalData || null,
    motionTuning: override.motionTuning || body.motionTuning || null,
    fixedAnchor: override.fixedAnchor || body.fixedAnchor || data.fixedAnchor || null,
    data: data
  });
}

function _resolvedFixedAnchor(worldId: string, moon: MoonLike){
  var anchor = moon.fixedAnchor || null;
  if (!anchor || !anchor.referenceDate) return null;
  try {
    var referenceSerial = toWorldSerialFromRegularDate(
      worldId,
      anchor.referenceDate.year,
      Math.max(0, (anchor.referenceDate.month || 1) - 1),
      anchor.referenceDate.day || 1
    ) + (Number(anchor.timeFrac) || 0);
    var timeFrac = Number(anchor.timeFrac) || 0;
    var skyLongDeg = anchor.skyLongDeg;
    if (!isFinite(Number(skyLongDeg)) && anchor.overheadAtAnchor){
      skyLongDeg = _normDeg(sunSkyLong(referenceSerial, worldId) + 180 - (timeFrac * 360));
    }
    return {
      referenceSerial: referenceSerial,
      timeFrac: timeFrac,
      phaseAngleDeg: _normDeg(Number(anchor.phaseAngleDeg == null ? 180 : anchor.phaseAngleDeg)),
      skyLongDeg: isFinite(Number(skyLongDeg)) ? _normDeg(Number(skyLongDeg)) : null,
      overheadAtAnchor: anchor.overheadAtAnchor === true,
      observerLatitudeDeg: isFinite(Number(anchor.observerLatitudeDeg)) ? Number(anchor.observerLatitudeDeg) : DEFAULT_OBSERVER_LATITUDE
    };
  } catch (_err){
    return null;
  }
}

function _cyclePosForAngle(cycleDays: number, phaseAngleDeg: number){
  return (_normDeg(phaseAngleDeg - 180) / 360) * cycleDays;
}

function _baseMoonSkyLong(moon: MoonLike, serial: number, worldId: string){
  var cycleDays = Math.max(1, Number(moon.synodicPeriod || moon.baseCycleDays || 28));
  var cyclePos = ((_cycleOffset(worldId, moon, serial) % cycleDays) + cycleDays) % cycleDays;
  var angle = _normDeg((cyclePos / cycleDays) * 360 + 180);
  var op = _orbitalParams(worldId, moon, serial);
  if (op && op.retrograde) angle = _normDeg(360 - angle);
  return angle;
}

function _phaseAt(worldId: string, moon: MoonLike, serial: number): SkyScenePhase {
  var phaseMode = String(moon.phaseMode || 'standard_phase');
  var cycleDays = Math.max(1, Number(moon.synodicPeriod || moon.baseCycleDays || 28));
  var cyclePos = ((_cycleOffset(worldId, moon, serial) % cycleDays) + cycleDays) % cycleDays;
  var angle = _normDeg((cyclePos / cycleDays) * 360 + 180);
  var illum = (1 - Math.cos(angle * Math.PI / 180)) / 2;

  if (phaseMode === 'always_full_when_visible'){
    var windowDays = Math.max(1, parseInt(String((moon.data && moon.data.visibilityWindowDays) || 14), 10) || 14);
    var distFromPeak = Math.min(cyclePos, cycleDays - cyclePos);
    var visible = distFromPeak <= (windowDays / 2);
    return { illum: visible ? 1 : 0, waxing: false };
  }

  return {
    illum: _clamp01(illum),
    waxing: angle < 180
  };
}

function _moonSkyLong(moon: MoonLike, serial: number, worldId: string){
  var angle = _baseMoonSkyLong(moon, serial, worldId);
  var fixed = _resolvedFixedAnchor(worldId, moon);
  if (!fixed || fixed.skyLongDeg == null) return angle;
  var anchorAngle = _baseMoonSkyLong(moon, fixed.referenceSerial, worldId);
  return _normDeg(angle + (fixed.skyLongDeg - anchorAngle));
}

function _moonEclipticLat(moon: MoonLike, serial: number, skyLongDeg: number, worldId: string){
  var op = _orbitalParams(worldId, moon, serial);
  var relLong = skyLongDeg - op.ascendingNode;
  var latitude = op.inclination * Math.sin(relLong * Math.PI / 180);
  var fixed = _resolvedFixedAnchor(worldId, moon);
  if (!fixed || !fixed.overheadAtAnchor) return latitude;
  var anchorSkyLong = _moonSkyLong(moon, fixed.referenceSerial, worldId);
  var anchorRelLong = anchorSkyLong - op.ascendingNode;
  var anchorLatitude = op.inclination * Math.sin(anchorRelLong * Math.PI / 180);
  return latitude + (fixed.observerLatitudeDeg - anchorLatitude);
}

function _moonAngularDiameterDeg(moon: MoonLike, serial: number, worldId: string){
  var op = _orbitalParams(worldId, moon, serial);
  if (op && isFinite(op.apparentSize)) return Math.max(0.01, op.apparentSize * SUN_ANGULAR_DIAM_DEG);
  if (op && isFinite(op.distance) && isFinite(op.diameter) && op.distance > 0){
    return Math.max(0.01, 2 * Math.atan((op.diameter / 2) / op.distance) * 180 / Math.PI);
  }
  return 0.25;
}

function _orbitalParams(worldId: string, moon: MoonLike, serial: number){
  var canon = moon.orbitalData || null;
  var tune = moon.motionTuning || null;
  if (canon && tune){
    var ypd = Math.max(1, worldAverageYearDays(worldId));
    var incPeriod = Math.max(1, Number(tune.inclinationPeriodDays || ypd));
    var distPeriod = Math.max(1, Number(tune.distancePeriodDays || ypd));
    var rawInclination = Number(tune.inclinationBase || moon.inclination || 0) +
      Number(tune.inclinationAmp || 0) * Math.sin((serial * 2 * Math.PI) / incPeriod);
    var inclinationNorm = _normDeg(rawInclination);
    if (inclinationNorm > 180) inclinationNorm = 360 - inclinationNorm;
    var retrograde = !!((tune as any).retrograde || (tune as any).orbitDirection === 'retrograde' || inclinationNorm > 90);
    var inclination = retrograde ? (180 - inclinationNorm) : inclinationNorm;
    var ascendingNode = _normDeg(Number(tune.ascendingNode || 0) + serial * (Number(tune.nodePrecessionDegPerYear || 0) / ypd));
    var apsis = _normDeg(Number(tune.apsisAngle || 0) + serial * (Number(tune.apsisPrecessionDegPerYear || 0) / ypd));
    var distFactor = 1 + Number(tune.distanceSwingPct || 0) * Math.sin((serial * 2 * Math.PI) / distPeriod);
    return {
      inclination: inclination,
      retrograde: retrograde,
      ascendingNode: ascendingNode,
      apsis: apsis,
      apparentSize: Number(canon.angularSizeVsSun || 1) / Math.max(0.5, distFactor),
      diameter: Number(moon.diameter || 1000),
      distance: Number(moon.distance || 100000) * distFactor
    };
  }

  var seed = _hashSeed(worldId + ':' + moon.name);
  var baseInclination = Number(moon.inclination || 2 + seed * 6);
  var eccentricity = Number(moon.eccentricity || (0.01 + seed * 0.06));
  var distance = Number(moon.distance || (40000 + seed * 160000));
  var diameter = Number(moon.diameter || (600 + seed * 1800));
  var inclinationWave = Math.sin((serial * 2 * Math.PI) / Math.max(40, Number(moon.synodicPeriod || 28) * 12));
  var distWave = Math.sin((serial * 2 * Math.PI) / Math.max(28, Number(moon.synodicPeriod || 28) * 4));
  var distFactor = 1 + Math.min(0.35, Math.max(0, eccentricity * 2)) * distWave;
  return {
    inclination: baseInclination + inclinationWave * Math.max(0.1, baseInclination * 0.08),
    ascendingNode: _normDeg(seed * 360 + serial * (2 + seed * 14) / Math.max(1, worldAverageYearDays(worldId))),
    apsis: _normDeg(seed * 180 + serial * (5 + seed * 20) / Math.max(1, worldAverageYearDays(worldId))),
    apparentSize: _angularSizeVsSun(diameter, distance * distFactor),
    diameter: diameter,
    distance: distance * distFactor
  };
}

function _cycleOffset(worldId: string, moon: MoonLike, serial: number){
  var cycleDays = Math.max(1, Number(moon.synodicPeriod || moon.baseCycleDays || 28));
  var epochSerial = _referenceSerial(worldId, moon);
  return serial - epochSerial;
}

function _referenceSerial(worldId: string, moon: MoonLike){
  var fixed = _resolvedFixedAnchor(worldId, moon);
  if (fixed){
    var fixedCycleDays = Math.max(1, Number(moon.synodicPeriod || moon.baseCycleDays || 28));
    return fixed.referenceSerial - _cyclePosForAngle(fixedCycleDays, fixed.phaseAngleDeg);
  }
  var epoch = moon.epochSeed || null;
  if (epoch && epoch.referenceDate){
    var ref = epoch.referenceDate;
    try {
      var refSerial = toWorldSerialFromRegularDate(worldId, ref.year, Math.max(0, (ref.month || 1) - 1), ref.day || 1);
      var seedWord = String(epoch.defaultSeed || moon.name || 'moon');
      return refSerial - (_moonHashStr(seedWord) * Math.max(1, Number(moon.synodicPeriod || moon.baseCycleDays || 28)));
    } catch(e){
      return 0;
    }
  }
  var world = WORLDS[worldId];
  if (world){
    return toWorldSerialFromRegularDate(worldId, world.defaultDate.year, world.defaultDate.month, world.defaultDate.day);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Lightweight moon-phase query — no sky position math, just illumination.
// Optional systemSeed overrides each moon's defaultSeed the same way the
// script's !cal moon seed <word> does: "systemSeed::MoonName".
// ---------------------------------------------------------------------------
export type MoonPhaseInfo = {
  name: string;
  illum: number;
  waxing: boolean;
  emoji: string;
  notable: 'full' | 'new' | null;
};

export function moonPhasesForDay(worldId: string, serial: number, systemSeed?: string | null): MoonPhaseInfo[] {
  worldId = String(worldId || '').toLowerCase();
  var world = WORLDS[worldId];
  if (!world || !world.moons || !world.moons.bodies) return [];
  var bodies = world.moons.bodies as MoonLike[];
  var results: MoonPhaseInfo[] = [];
  for (var i = 0; i < bodies.length; i++){
    var body = _normalizeMoon(worldId, bodies[i]);
    var overriddenBody = body;
    if (systemSeed && !body.fixedAnchor){
      var overrideSeed = systemSeed + '::' + body.name;
      overriddenBody = Object.assign({}, body, {
        epochSeed: body.epochSeed
          ? Object.assign({}, body.epochSeed, { defaultSeed: overrideSeed })
          : { defaultSeed: overrideSeed, referenceDate: { year: world.defaultDate.year, month: world.defaultDate.month + 1, day: world.defaultDate.day } }
      });
    }
    var phase = _phaseAt(worldId, overriddenBody, serial);
    var illum = _clamp01(phase.illum || 0);
    var notable: 'full' | 'new' | null = null;
    if (illum >= 0.97) notable = 'full';
    else if (illum <= 0.03) notable = 'new';
    results.push({
      name: body.name,
      illum: illum,
      waxing: phase.waxing,
      emoji: moonPhaseEmoji(illum, phase.waxing),
      notable: notable
    });
  }
  return results;
}

function _moonHashStr(str: string){
  str = String(str || '');
  var h = 2166136261;
  for (var i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

function _hashSeed(str: string){
  return _moonHashStr(str);
}

function _angularSizeVsSun(diameter: number, distance: number){
  if (!(distance > 0) || !(diameter > 0)) return 0.5;
  var angularDeg = 2 * Math.atan((diameter / 2) / distance) * 180 / Math.PI;
  return angularDeg / SUN_ANGULAR_DIAM_DEG;
}

function _clamp01(value: number){
  return value < 0 ? 0 : (value > 1 ? 1 : value);
}

function _normalizeTimeFrac(value: number){
  value = Number(value) || 0;
  value = value % 1;
  return value < 0 ? value + 1 : value;
}

function _normDeg(value: number){
  value = value % 360;
  return value < 0 ? value + 360 : value;
}
