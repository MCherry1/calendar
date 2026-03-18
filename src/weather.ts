/* ============================================================================
 * 18) WEATHER SYSTEM
 * ==========================================================================*/

import {
  CONFIG_DEFAULTS,
  CONFIG_WEATHER_FORECAST_DAYS,
  CONFIG_WEATHER_HISTORY_DAYS,
  CONFIG_WEATHER_SEED_STRENGTH,
  CONFIG_WEATHER_MECHANICS,
  CONFIG_WEATHER_LABELS,
  CONFIG_WEATHER_FLAVOR,
  CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS,
  WEATHER_TEMPERATURE_BANDS_F,
  WEATHER_TEMPERATURE_BAND_INDEX,
  WEATHER_TEMP_BAND_MIN,
  WEATHER_TEMP_BAND_MAX,
  WEATHER_HEAT_ARMOR_RULES,
  CALENDAR_SYSTEMS,
} from './config';

import {
  state_name,
  script_name,
  STYLES,
  PALETTE,
  LABELS,
  SEASON_SETS,
} from './constants';

import {
  getCal,
  ensureSettings,
  deepClone,
  titleCase,
  refreshCalendarState,
  checkInstall,
  weekLength,
} from './state';

import { sanitizeHexColor, resolveColor, textColor } from './color';

import { toSerial, fromSerial, daysPerYear, regularMonthIndex, todaySerial } from './date-math';

import { monthIndexByName, Parse } from './parsing';
import { formatDateLabel, esc, button, openMonthTable, closeMonthTable, clamp } from './rendering';
import { TIME_OF_DAY_BUCKETS } from './time-of-day';
import {
  currentDateLabel, nextForDayOnly, nextForMonthDay, _menuBox,
  _normalizeDisplayMode, _nextDisplayMode, _displayModeLabel,
  _subsystemIsVerbose, _legendLine, _displayMonthDayParts, _weatherViewDays
} from './ui';
import { send, sendToAll, whisper, whisperUi, warnGM, cleanWho } from './messaging';
import { _setCount, _setMin, _setMax, _monthsFromRangeSpec } from './events';
import { weekStartSerial } from './date-math';
import { weekdayProgressionFor } from './worlds/index';

import { _isFullMoonIllum, moonPhaseAt, moonEnsureSequences, nighttimeLightHtml, getTidalIndex, tidalLabel } from './moon';
import { getActivePlanarEffects } from './planes';
import { _activePlanarWeatherShiftLines, _weatherInfluenceTexts, _weatherInfluenceHtml, _planarWeatherInfluenceText } from './ui';
import { colorForMonth } from './state';
import { isTimeOfDayActive, currentTimeBucket } from './time-of-day';

function _seededRand(seed){
  var s = ((seed * 2654435769) >>> 0) / 4294967296;
  return function(){ s = ((s * 1103515245 + 12345) % 2147483648) / 2147483648; return s; };
}
// ---------------------------------------------------------------------------
// Temperature band helpers
// ---------------------------------------------------------------------------

export function _clampWeatherTempBand(band){
  band = parseInt(band, 10);
  if (!isFinite(band)) band = 0;
  return Math.max(WEATHER_TEMP_BAND_MIN, Math.min(WEATHER_TEMP_BAND_MAX, band));
}

export function _weatherTempInfo(band){
  return WEATHER_TEMPERATURE_BAND_INDEX[_clampWeatherTempBand(band)] || WEATHER_TEMPERATURE_BANDS_F[0];
}

export function _weatherTempLabel(band){
  return titleCase(_weatherTempInfo(band).label || String(band));
}

export function _weatherTempMechanics(band){
  var info = _weatherTempInfo(band);
  var parts = [];
  if (info.nominalDC != null){
    parts.push('DC ' + info.nominalDC + ' Con save or exhaustion.');
  }
  if (info.coldRequirement && info.coldRequirement !== 'none'){
    if (info.coldRequirement === 'special') parts.push(info.coldRequirementLabel + '.');
    else parts.push('Disadvantage without ' + String(info.coldRequirementLabel || '').toLowerCase() + '.');
  }
  if (info.heatArmorDisadvantage && info.heatArmorDisadvantage !== 'none'){
    var heatRule = WEATHER_HEAT_ARMOR_RULES[info.heatArmorDisadvantage];
    if (heatRule && heatRule.description) parts.push(heatRule.description);
  }
  return parts.length ? parts.join(' ') : null;
}

export function _isZarantyrFull(serial){
  var ph = moonPhaseAt('Zarantyr', serial);
  return !!(ph && _isFullMoonIllum(ph.illum));
}

// ---------------------------------------------------------------------------
// 18 — Tuning constants and weather tables
// ---------------------------------------------------------------------------

// Uncertainty tiers: GM display labels, keyed by days-ahead from generatedAt.
var WEATHER_UNCERTAINTY: any = {
  certain:   { maxDist:  1, label: 'Certain'   },
  likely:    { maxDist:  3, label: 'Likely'    },
  uncertain: { maxDist:  7, label: 'Uncertain' },
  vague:     { maxDist: 20, label: 'Vague'     }
};

export var WEATHER_DAY_PERIODS = TIME_OF_DAY_BUCKETS.map(function(bucket: any){ return bucket.key; });
export var WEATHER_PRIMARY_PERIOD = 'afternoon';
var WEATHER_LOW_TOD_PERIODS = ['early_morning', 'afternoon', 'nighttime'];
var WEATHER_PERIOD_META: any = {
  middle_of_night: { label:'Middle of the Night', shortLabel:'Middle', icon:'🌌' },
  nighttime:       { label:'Nighttime',           shortLabel:'Night',  icon:'🌙' },
  early_morning: { label:'Early Morning', shortLabel:'Early', icon:'🌅' },
  morning:       { label:'Morning',       shortLabel:'Morning', icon:'☀' },
  afternoon:     { label:'Afternoon',     shortLabel:'Afternoon', icon:'☁' },
  evening:       { label:'Evening',       shortLabel:'Evening', icon:'🌆' }
};

export function _weatherPeriodLabel(period: any){
  var meta = WEATHER_PERIOD_META[period] || {};
  return meta.label || titleCase(String(period || '').replace(/_/g, ' '));
}

function _weatherPeriodShortLabel(period: any){
  var meta = WEATHER_PERIOD_META[period] || {};
  return meta.shortLabel || _weatherPeriodLabel(period);
}

export function _weatherPeriodIcon(period: any){
  var meta = WEATHER_PERIOD_META[period] || {};
  return meta.icon || '•';
}

export function _weatherPrimaryValues(rec: any){
  if (!rec) return null;
  if (rec.periods && rec.periods[WEATHER_PRIMARY_PERIOD]) return rec.periods[WEATHER_PRIMARY_PERIOD];
  return rec.final || null;
}

export function _weatherPrimaryFog(rec: any){
  return rec && rec.fog ? rec.fog[WEATHER_PRIMARY_PERIOD] : null;
}

function _weatherPrevNightValues(prevRec: any){
  if (!prevRec) return null;
  if (prevRec.periods && prevRec.periods.nighttime) return prevRec.periods.nighttime;
  return prevRec.final || null;
}

function _weatherPrevNightFog(prevRec: any){
  return (prevRec && prevRec.fog) ? prevRec.fog.nighttime : null;
}

// Stochastic TOD bell curve. One 1d20 roll per trait per period.
// 1→−2, 2–4→−1, 5–16→0, 17–19→+1, 20→+2. Applied after arc, clamped.
var WEATHER_TOD_BELL = [
//  1    2   3   4    5  6  7  8  9 10 11 12 13 14 15 16   17  18  19   20
   -2,  -1, -1, -1,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  +1, +1, +1,  +2
];

// Deterministic TOD arc — the predictable daily shape per climate.
// Afternoon is the reference point (offset 0). Arc is scaled by geo × terrain
// arcMult. Overnight and shoulder buckets preserve continuity across six steps.
var WEATHER_TOD_ARC: any = {
  polar: {
    temp:   { middle_of_night:-3, early_morning:-3, morning:-2, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:-1 },
    precip: { middle_of_night:0,  early_morning:0,  morning:0,  afternoon:0, evening:0, nighttime:0 }
  },
  continental: {
    temp:   { middle_of_night:-4, early_morning:-4, morning:-3, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:-1, afternoon:0, evening:+1, nighttime:+1 }
  },
  temperate: {
    temp:   { middle_of_night:-3, early_morning:-3, morning:-2, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:-1, afternoon:0, evening:+1, nighttime:+1 }
  },
  dry: {
    temp:   { middle_of_night:-5, early_morning:-5, morning:-4, afternoon:0, evening:-3, nighttime:-4 },
    wind:   { middle_of_night:-2, early_morning:-1, morning:-1, afternoon:0, evening:-1, nighttime:-2 },
    precip: { middle_of_night:0,  early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 }
  },
  tropical: {
    temp:   { middle_of_night:-2, early_morning:-2, morning:-2, afternoon:0, evening:0, nighttime:-1 },
    wind:   { middle_of_night:0,  early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:0,  afternoon:0, evening:+1, nighttime:+1 }
  },
  monsoon: {
    temp:   { middle_of_night:-1, early_morning:-2, morning:-2, afternoon:0, evening:0, nighttime:0 },
    wind:   { middle_of_night:0,  early_morning:-1, morning:-1, afternoon:0, evening:+1, nighttime:+1 },
    precip: { middle_of_night:+1, early_morning:0,  morning:-1, afternoon:0, evening:+2, nighttime:+1 }
  },
  mediterranean: {
    temp:   { middle_of_night:-4, early_morning:-4, morning:-3, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:0,  afternoon:0, evening:+1, nighttime:+1 }
  }
};

// ---------------------------------------------------------------------------
// Climate base tables — climates × 12 months (index 0=mid-winter … 11=early-winter)
// Each entry: { temp, wind, precip } each { base, die, min, max }
// Geography and terrain modifiers shift base/min/max uniformly. die is unchanged.
// Temperature values use the -5..15 band scale directly.
// Wind scale: 0=calm … 5=storm     Precip scale: 0=clear … 5=extreme
// ---------------------------------------------------------------------------
var WEATHER_CLIMATE_BASE: any = {

  // Frostfell, Demon Wastes — perpetually cold, windswept, low moisture
  polar: [
    /*0  mid-win */ {temp:{base:-2,die:2,min:-3,max:-3}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*1  late-win*/ {temp:{base:-2,die:2,min:-3,max:-3}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*2  early-sp*/ {temp:{base:-3,die:2,min:-2,max:0},  wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*3  mid-sp  */ {temp:{base:0,die:2,min:-3,max:1},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*4  late-sp */ {temp:{base:0,die:2,min:-3,max:1},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*5  early-su*/ {temp:{base:1,die:2,min:0,max:4},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*6  mid-su  */ {temp:{base:1,die:2,min:0,max:4},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*7  late-su */ {temp:{base:0,die:2,min:-3,max:1},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*8  early-au*/ {temp:{base:-3,die:2,min:-2,max:0},  wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*9  mid-au  */ {temp:{base:-2,die:2,min:-3,max:-3}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*10 late-au */ {temp:{base:-2,die:2,min:-3,max:-3}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*11 early-wn*/ {temp:{base:-2,die:2,min:-3,max:-3}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}}
  ],

  // Karrnath, Mror Holds interior — wide seasonal swing, harsh winters
  continental: [
    /*0 */ {temp:{base:-3,die:3,min:-2,max:0},  wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*1 */ {temp:{base:0,die:3,min:-2,max:1},    wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*2 */ {temp:{base:1,die:3,min:0,max:6},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*3 */ {temp:{base:4,die:2,min:1,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*4 */ {temp:{base:6,die:2,min:4,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*5 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*6 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*7 */ {temp:{base:6,die:2,min:4,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*8 */ {temp:{base:4,die:3,min:0,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:3,min:0,max:3}},
    /*9 */ {temp:{base:1,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*10*/ {temp:{base:0,die:2,min:-3,max:1},    wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*11*/ {temp:{base:-3,die:3,min:-2,max:0},   wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}}
  ],

  // Breland, Shadow Marches, most of Khorvaire — moderate, maritime-influenced
  temperate: [
    /*0 */ {temp:{base:0,die:2,min:-3,max:4},   wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*1 */ {temp:{base:1,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*2 */ {temp:{base:4,die:2,min:1,max:6},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*3 */ {temp:{base:4,die:2,min:1,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*4 */ {temp:{base:6,die:2,min:4,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*5 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*6 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*7 */ {temp:{base:6,die:2,min:4,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*8 */ {temp:{base:6,die:3,min:1,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:3,min:0,max:3}},
    /*9 */ {temp:{base:4,die:2,min:1,max:6},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*10*/ {temp:{base:1,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*11*/ {temp:{base:0,die:2,min:-3,max:4},    wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}}
  ],

  // Blade Desert, Valenar interior — heat-dominated, wide daily swings, very low precip
  dry: [
    /*0 */ {temp:{base:4,die:3,min:0,max:6},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*1 */ {temp:{base:4,die:3,min:1,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*2 */ {temp:{base:6,die:3,min:4,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:1}},
    /*3 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*4 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*5 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*6 */ {temp:{base:11,die:2,min:10,max:12}, wind:{base:2,die:2,min:0,max:3}, precip:{base:0,die:2,min:0,max:1}},
    /*7 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:2,die:2,min:0,max:3}, precip:{base:0,die:2,min:0,max:1}},
    /*8 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:2,die:2,min:0,max:3}, precip:{base:0,die:2,min:0,max:1}},
    /*9 */ {temp:{base:6,die:3,min:4,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*10*/ {temp:{base:6,die:3,min:1,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*11*/ {temp:{base:4,die:3,min:0,max:6},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}}
  ],

  // Sharn, Q'barra, Xen'drik coast — narrow temp swing, seasonal rains
  tropical: [
    /*0 */ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*1 */ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*2 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*3 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*4 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:2}},
    /*5 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:1,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*6 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*7 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*8 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*9 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*10*/ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*11*/ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}}
  ],

  // Q'barra interior monsoon, Xen'drik seasonal — dramatic wet/dry season flip
  // Dry season (winter–early spring): clear skies, low precip
  // Wet season (summer–autumn): torrential, daily downpours, high wind
  monsoon: [
    /*0  mid-win */ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*1  late-win*/ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*2  early-sp*/ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*3  mid-sp  */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*4  late-sp */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:2,die:2,min:1,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*5  early-su*/ {temp:{base:10,die:2,min:9,max:11}, wind:{base:2,die:2,min:1,max:4}, precip:{base:3,die:3,min:2,max:5}},
    /*6  mid-su  */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:2,die:2,min:1,max:4}, precip:{base:3,die:3,min:2,max:5}},
    /*7  late-su */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:2,die:2,min:1,max:4}, precip:{base:3,die:3,min:2,max:5}},
    /*8  early-au*/ {temp:{base:9,die:2,min:6,max:10},  wind:{base:2,die:2,min:1,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*9  mid-au  */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*10 late-au */ {temp:{base:6,die:2,min:4,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*11 early-wn*/ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}}
  ],

  // Valenar coast, southern Breland — hot dry summers, mild wet winters
  // Inverted precip curve: winters wetter than summers
  mediterranean: [
    /*0  mid-win */ {temp:{base:1,die:2,min:0,max:4},   wind:{base:2,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*1  late-win*/ {temp:{base:1,die:2,min:0,max:4},   wind:{base:1,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*2  early-sp*/ {temp:{base:4,die:2,min:1,max:6},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*3  mid-sp  */ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*4  late-sp */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:1}},
    /*5  early-su*/ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*6  mid-su  */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*7  late-su */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*8  early-au*/ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*9  mid-au  */ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*10 late-au */ {temp:{base:4,die:2,min:1,max:6},   wind:{base:2,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*11 early-wn*/ {temp:{base:1,die:2,min:0,max:4},   wind:{base:2,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}}
  ]
};

// ---------------------------------------------------------------------------
// Geography modifier tables — 10 geographies × 12 months (or constant object)
// Each entry: { temp, wind, precip, arc }
//   temp/wind/precip: additive shift to base, min, and max uniformly
//   arc: multiplicative scale on the TOD arc for this month (combined with terrain arc)
// A constant object (non-array) applies uniformly to all months.
// ---------------------------------------------------------------------------
var WEATHER_GEO_MOD: any = {

  // Baseline — no modification
  inland: {temp:0, wind:0, precip:0, arc:1.00},

  // Breland coast, Lhazaar coastline — maritime moderation
  coastal: [
    /*0 */ {temp:+1, wind:+1, precip:+1, arc:0.70},
    /*1 */ {temp:+1, wind:+1, precip:+1, arc:0.70},
    /*2 */ {temp: 0, wind: 0, precip:+1, arc:0.75},
    /*3 */ {temp: 0, wind: 0, precip:+1, arc:0.75},
    /*4 */ {temp: 0, wind: 0, precip:+1, arc:0.75},
    /*5 */ {temp:-1, wind: 0, precip: 0, arc:0.70},
    /*6 */ {temp:-1, wind: 0, precip: 0, arc:0.70},
    /*7 */ {temp:-1, wind: 0, precip: 0, arc:0.70},
    /*8 */ {temp: 0, wind:+1, precip:+1, arc:0.75},
    /*9 */ {temp: 0, wind:+1, precip:+1, arc:0.75},
    /*10*/ {temp:+1, wind:+1, precip:+1, arc:0.72},
    /*11*/ {temp:+1, wind:+1, precip:+1, arc:0.70}
  ],

  // Thunder Sea crossings, Lhazaar open water — strong moderation, sustained wind
  open_sea: [
    /*0 */ {temp:+2, wind:+2, precip:+1, arc:0.35},
    /*1 */ {temp:+2, wind:+2, precip:+1, arc:0.35},
    /*2 */ {temp:+1, wind:+2, precip:+1, arc:0.35},
    /*3 */ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*4 */ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*5 */ {temp:-2, wind:+2, precip:+1, arc:0.35},
    /*6 */ {temp:-2, wind:+2, precip:+1, arc:0.35},
    /*7 */ {temp:-2, wind:+2, precip:+1, arc:0.35},
    /*8 */ {temp:-1, wind:+2, precip:+1, arc:0.35},
    /*9 */ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*10*/ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*11*/ {temp:+2, wind:+2, precip:+1, arc:0.35}
  ],

  // Talenta Plains, Valenar, Mournland — amplified arc, fast-moving systems
  open_plains: [
    /*0 */ {temp:-1, wind:+1, precip:-1, arc:1.50},
    /*1 */ {temp:-1, wind:+1, precip:-1, arc:1.50},
    /*2 */ {temp: 0, wind:+1, precip: 0, arc:1.40},
    /*3 */ {temp: 0, wind:+1, precip: 0, arc:1.40},
    /*4 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*5 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*6 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*7 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*8 */ {temp: 0, wind:+1, precip:+1, arc:1.40},
    /*9 */ {temp: 0, wind:+1, precip:-1, arc:1.45},
    /*10*/ {temp: 0, wind:+1, precip:-1, arc:1.45},
    /*11*/ {temp:-1, wind:+1, precip:-1, arc:1.50}
  ],

  // Mror Holds peaks, Starpeaks — elevation cold, orographic precip
  highland: [
    /*0 */ {temp:-2, wind:+2, precip:+1, arc:1.30},
    /*1 */ {temp:-2, wind:+2, precip:+1, arc:1.30},
    /*2 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*3 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*4 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*5 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*6 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*7 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*8 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*9 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*10*/ {temp:-2, wind:+2, precip:+1, arc:1.30},
    /*11*/ {temp:-2, wind:+2, precip:+1, arc:1.30}
  ],

  // Aundair river valleys, Scions Sound region — fog-prone, channeled wind
  river_valley: [
    /*0 */ {temp: 0, wind:-1, precip:+1, arc:0.90},
    /*1 */ {temp: 0, wind:-1, precip:+1, arc:0.90},
    /*2 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*3 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*4 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*5 */ {temp:+1, wind:-1, precip:+1, arc:0.80},
    /*6 */ {temp:+1, wind:-1, precip:+1, arc:0.80},
    /*7 */ {temp:+1, wind:-1, precip:+1, arc:0.80},
    /*8 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*9 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*10*/ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*11*/ {temp: 0, wind:-1, precip:+1, arc:0.90}
  ],

  // Q'barra interior, Xen'drik jungle lowlands — flat arc, suppressed wind, max moisture
  jungle_basin: {temp:0, wind:-1, precip:+1, arc:0.25},

  // Lake Galifar, large enclosed Scions Sound — lake-effect autumn/winter precip
  inland_sea: [
    /*0 */ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*1 */ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*2 */ {temp:+1, wind: 0, precip:+1, arc:0.80},
    /*3 */ {temp: 0, wind: 0, precip:+1, arc:0.85},
    /*4 */ {temp: 0, wind: 0, precip:+1, arc:0.85},
    /*5 */ {temp:-1, wind: 0, precip: 0, arc:0.80},
    /*6 */ {temp:-1, wind: 0, precip: 0, arc:0.80},
    /*7 */ {temp:-1, wind: 0, precip: 0, arc:0.80},
    /*8 */ {temp:+1, wind:+1, precip:+2, arc:0.80},
    /*9 */ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*10*/ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*11*/ {temp:+1, wind:+1, precip:+2, arc:0.75}
  ],

  // Lhazaar islands, offshore Stormreach — all-direction maritime
  island: [
    /*0 */ {temp:+2, wind:+1, precip:+1, arc:0.45},
    /*1 */ {temp:+2, wind:+1, precip:+1, arc:0.45},
    /*2 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*3 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*4 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*5 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*6 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*7 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*8 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*9 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*10*/ {temp:+2, wind:+1, precip:+1, arc:0.45},
    /*11*/ {temp:+2, wind:+1, precip:+1, arc:0.45}
  ],

  // Frostfell open tundra, Demon Wastes — open plains amplified by polar cold
  arctic_plain: [
    /*0 */ {temp:-3, wind:+2, precip:-1, arc:1.70},
    /*1 */ {temp:-3, wind:+2, precip:-1, arc:1.70},
    /*2 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*3 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*4 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*5 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*6 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*7 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*8 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*9 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*10*/ {temp:-3, wind:+2, precip:-1, arc:1.70},
    /*11*/ {temp:-3, wind:+2, precip:-1, arc:1.70}
  ]
};

// ---------------------------------------------------------------------------
// Terrain modifier tables — 9 terrains × 12 months (or constant object)
// Same structure as WEATHER_GEO_MOD. Arc multipliers are seasonal where
// the canopy changes through the year (forest, swamp); constant elsewhere.
// ---------------------------------------------------------------------------
var WEATHER_TERRAIN_MOD: any = {

  // Full exposure to geography — no modification
  open: {temp:0, wind:0, precip:0, arc:1.00},

  // Deciduous forest: full canopy in summer, bare in winter
  forest: [
    /*0  mid-win */ {temp:0, wind: 0, precip: 0, arc:0.85},
    /*1  late-win*/ {temp:0, wind: 0, precip: 0, arc:0.85},
    /*2  early-sp*/ {temp:0, wind:-1, precip:+1, arc:0.60},
    /*3  mid-sp  */ {temp:0, wind:-1, precip:+1, arc:0.45},
    /*4  late-sp */ {temp:0, wind:-1, precip:+1, arc:0.30},
    /*5  early-su*/ {temp:0, wind:-1, precip:+1, arc:0.25},
    /*6  mid-su  */ {temp:0, wind:-1, precip:+1, arc:0.25},
    /*7  late-su */ {temp:0, wind:-1, precip:+1, arc:0.25},
    /*8  early-au*/ {temp:0, wind:-1, precip:+1, arc:0.30},
    /*9  mid-au  */ {temp:0, wind: 0, precip: 0, arc:0.55},
    /*10 late-au */ {temp:0, wind: 0, precip: 0, arc:0.75},
    /*11 early-wn*/ {temp:0, wind: 0, precip: 0, arc:0.85}
  ],

  // Tropical/evergreen forest: constant heavy canopy all year
  jungle: {temp:0, wind:-1, precip:+1, arc:0.20},

  // Wetland: like forest but wetter and wind-dead at surface
  swamp: [
    /*0 */ {temp:0, wind:-1, precip:+1, arc:0.70},
    /*1 */ {temp:0, wind:-1, precip:+1, arc:0.70},
    /*2 */ {temp:0, wind:-1, precip:+2, arc:0.50},
    /*3 */ {temp:0, wind:-1, precip:+2, arc:0.45},
    /*4 */ {temp:0, wind:-1, precip:+2, arc:0.45},
    /*5 */ {temp:+1,wind:-1, precip:+2, arc:0.35},
    /*6 */ {temp:+1,wind:-1, precip:+2, arc:0.35},
    /*7 */ {temp:+1,wind:-1, precip:+2, arc:0.35},
    /*8 */ {temp:0, wind:-1, precip:+2, arc:0.50},
    /*9 */ {temp:0, wind:-1, precip:+1, arc:0.65},
    /*10*/ {temp:0, wind:-1, precip:+1, arc:0.65},
    /*11*/ {temp:0, wind:-1, precip:+1, arc:0.70}
  ],

  // Settled area: heat island, streets channel wind slightly
  urban: {temp:+1, wind:0, precip:0, arc:0.80},

  // Above treeline: always exposed, cold, no canopy moderation
  alpine: {temp:-2, wind:+1, precip:+1, arc:1.50},

  // Cultivated fields: partial hedge/windbreak, otherwise open
  farmland: {temp:0, wind:-1, precip:0, arc:0.90},

  // Sand/rock desert: amplifies arc, reinforces dryness
  desert: [
    /*0 */ {temp: 0, wind:0, precip:-1, arc:1.80},
    /*1 */ {temp: 0, wind:0, precip:-1, arc:1.80},
    /*2 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*3 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*4 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*5 */ {temp:+2, wind:0, precip:-1, arc:2.00},
    /*6 */ {temp:+2, wind:0, precip:-1, arc:2.00},
    /*7 */ {temp:+2, wind:0, precip:-1, arc:2.00},
    /*8 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*9 */ {temp:+1, wind:0, precip:-1, arc:1.85},
    /*10*/ {temp:+1, wind:0, precip:-1, arc:1.85},
    /*11*/ {temp: 0, wind:0, precip:-1, arc:1.80}
  ],

  // Exposed cliff above water: coastal moisture + wind amplification
  coastal_bluff: {temp:-1, wind:+2, precip:+1, arc:1.20}
};

// ---------------------------------------------------------------------------
// Wizard description strings — used in location wizard UI only
// ---------------------------------------------------------------------------
export var WEATHER_CLIMATES: any = {
  polar:       'Perpetual cold, minimal precipitation, wide seasonal swing',
  continental: 'Harsh winters, hot summers, far from maritime influence',
  temperate:   'Moderate seasons, consistent precipitation, mild maritime character',
  dry:         'Heat-dominated, very low precipitation, extreme daily temperature swings',
  tropical:    'Narrow temperature range, seasonal heavy rain, consistently warm',
  monsoon:     'Dramatic wet/dry season flip: dry clear winters, torrential summer downpours',
  mediterranean:'Hot dry summers, mild wet winters: inverted precipitation curve'
};

var WEATHER_GEOGRAPHIES: any = {
  inland:      'Default continental interior — no geographic amplification',
  coastal:     'Shoreline: maritime moderation, sea breeze, dampened daily arc',
  open_sea:    'Open water: strongly moderated temps, sustained wind, flat arc',
  open_plains: 'Unobstructed flat terrain: amplified arc, fast-moving systems, strong wind',
  highland:    'Elevated terrain: colder, orographic precipitation, exposed ridges',
  river_valley:'Valley floor: fog-prone, wind channeled and reduced, elevated moisture',
  jungle_basin:'Dense jungle lowland: flat arc, suppressed wind, maximum humidity',
  inland_sea:  'Large enclosed water body: lake-effect precip spikes in autumn/winter',
  island:      'Surrounded by water: all-direction maritime moderation, steady moisture',
  arctic_plain:'Open polar tundra: extreme cold and wind amplified, minimal precipitation'
};

var WEATHER_TERRAINS_UI: any = {
  open:         'No shelter — geography unfiltered',
  forest:       'Deciduous: full canopy summer, bare winter — strongly seasonal buffering',
  jungle:       'Tropical evergreen: constant heavy canopy, wind-dead, maximum humidity',
  swamp:        'Wetland: still air, saturated ground, precip accumulates',
  urban:        'Settled area: heat island, slight wind channeling',
  alpine:       'Above treeline: always cold and exposed, no canopy',
  farmland:     'Cultivated fields: partial windbreak, mostly open',
  desert:       'Sand or rock desert: maximizes arc and heat, suppresses precipitation',
  coastal_bluff:'Exposed cliff near water: coastal moisture with amplified wind'
};

var MANIFEST_ZONE_ORDER = [
  'fernia','risia','irian','mabar','lamannia','syrania','kythri',
  'shavarath','daanvi','dolurrh','thelanis','xoriat','dalquor'
];

var MANIFEST_ZONE_DEFS: any = {
  fernia: {
    key: 'fernia', name: 'Fernia', emoji: '🔥',
    summary: 'Warmth', effectLabel: '+3 temp', tempMod: 3
  },
  risia: {
    key: 'risia', name: 'Risia', emoji: '❄️',
    summary: 'Cold', effectLabel: '-3 temp', tempMod: -3
  },
  irian: {
    key: 'irian', name: 'Irian', emoji: '✨',
    summary: 'Radiant warmth', effectLabel: '+1 temp', tempMod: 1
  },
  mabar: {
    key: 'mabar', name: 'Mabar', emoji: '🌑',
    summary: 'Shadow cold', effectLabel: '-1 temp', tempMod: -1
  },
  lamannia: {
    key: 'lamannia', name: 'Lamannia', emoji: '🌿',
    summary: 'Lush weather', effectLabel: '+1 precip', precipMod: 1
  },
  syrania: {
    key: 'syrania', name: 'Syrania', emoji: '🌤',
    summary: 'Milder skies', effectLabel: '-1 precip, -1 wind', precipMod: -1, windMod: -1
  },
  kythri: {
    key: 'kythri', name: 'Kythri', emoji: '🌀',
    summary: 'Chaotic swings', effectLabel: 'chaotic swings', chaotic: true
  },
  shavarath: {
    key: 'shavarath', name: 'Shavarath', emoji: '⚔️',
    summary: 'Martial resonance', effectLabel: 'no weather shift'
  },
  daanvi: {
    key: 'daanvi', name: 'Daanvi', emoji: '📏',
    summary: 'Orderly', effectLabel: 'no weather shift'
  },
  dolurrh: {
    key: 'dolurrh', name: 'Dolurrh', emoji: '🪦',
    summary: 'Deathly', effectLabel: 'no weather shift'
  },
  thelanis: {
    key: 'thelanis', name: 'Thelanis', emoji: '🧚',
    summary: 'Fey', effectLabel: 'no weather shift'
  },
  xoriat: {
    key: 'xoriat', name: 'Xoriat', emoji: '👁️',
    summary: 'Madness', effectLabel: 'no weather shift'
  },
  dalquor: {
    key: 'dalquor', name: 'Dal Quor', emoji: '💤',
    summary: 'Dreams', effectLabel: 'no weather shift'
  }
};

// ---------------------------------------------------------------------------
// 18a) State accessors
// ---------------------------------------------------------------------------

export function _weatherLocationLabel(loc: any){
  if (!loc) return 'Unknown Location';
  var climate = titleCase(loc.climate || 'temperate');
  var geography = titleCase(String(loc.geography || 'inland').replace(/_/g, ' '));
  var terrain = titleCase(String(loc.terrain || 'open').replace(/_/g, ' '));
  return climate + ' / ' + geography + ' / ' + terrain;
}

export function _normalizeWeatherLocation(loc: any){
  if (!loc) return null;
  var out: any = {
    climate: loc.climate || 'temperate',
    geography: loc.geography || 'inland',
    terrain: loc.terrain || 'open'
  };
  out.sig = _locSig(out);
  out.name = loc.name || _weatherLocationLabel(out);
  return out;
}

export function getWeatherState(){
  var root = state[state_name];
  if (!root.weather) root.weather = {
    location:     null,  // { name, climate, geography, terrain, sig }
    manifestZones: {},   // key -> { key, setOn, arythFullActivated, arythFullExitWarned }
    forecast:     [],    // array of day records keyed by serial
    history:      [],    // locked past days (up to 60)
    playerReveal: { byLocation: {} }, // locationSig -> serial(str) -> reveal entry
    savedLocations: [],
    recentLocations: []
  };
  var ws = root.weather;
  if (!ws.playerReveal || typeof ws.playerReveal !== 'object') ws.playerReveal = { byLocation: {} };
  if (!ws.playerReveal.byLocation){
    var legacyReveal = ws.playerReveal;
    ws.playerReveal = { byLocation: {} };
    var legacySig = (ws.location && _locSig(ws.location)) || '_default';
    ws.playerReveal.byLocation[legacySig] = {};
    Object.keys(legacyReveal || {}).forEach(function(key: any){
      if (key === 'byLocation') return;
      ws.playerReveal.byLocation[legacySig][key] = legacyReveal[key];
    });
  }
  if (!Array.isArray(ws.savedLocations)) ws.savedLocations = [];
  if (!Array.isArray(ws.recentLocations)) ws.recentLocations = [];
  if (ws.location) ws.location = _normalizeWeatherLocation(ws.location);
  ws.savedLocations = ws.savedLocations.map(_normalizeWeatherLocation).filter(Boolean);
  ws.recentLocations = ws.recentLocations.map(_normalizeWeatherLocation).filter(Boolean).slice(0, 3);
  if (!ws.manifestZones || typeof ws.manifestZones !== 'object') ws.manifestZones = {};
  if (ws.location && ws.location.manifestZone){
    var legacyKey = _manifestZoneKey(ws.location.manifestZone.name || ws.location.manifestZone.key || '');
    if (legacyKey && !ws.manifestZones[legacyKey]){
      ws.manifestZones[legacyKey] = {
        key: legacyKey,
        setOn: todaySerial(),
        arythFullActivated: false,
        arythFullExitWarned: false
      };
    }
    delete ws.location.manifestZone;
    ws.location.sig = _locSig(ws.location);
  }
  return ws;
}

// Location signature for resurrection matching.
export function _locSig(loc: any){
  if (!loc) return '';
  return (loc.climate||'')+'/'+(loc.geography||'inland')+'/'+(loc.terrain||'');
}

export function _weatherRevealBucket(ws: any, loc: any, createIfMissing: any){
  ws = ws || getWeatherState();
  var sig = _locSig(loc || ws.location) || '_default';
  var store = ws.playerReveal && ws.playerReveal.byLocation;
  if (!store){
    ws.playerReveal = { byLocation: {} };
    store = ws.playerReveal.byLocation;
  }
  if (!store[sig] && createIfMissing !== false) store[sig] = {};
  return store[sig] || {};
}

export function _rememberRecentWeatherLocation(ws: any, loc: any){
  ws = ws || getWeatherState();
  loc = _normalizeWeatherLocation(loc);
  if (!loc) return;
  var keep: any[] = [];
  keep.push(loc);
  for (var i = 0; i < ws.recentLocations.length; i++){
    var existing = _normalizeWeatherLocation(ws.recentLocations[i]);
    if (!existing || existing.sig === loc.sig) continue;
    keep.push(existing);
    if (keep.length >= 3) break;
  }
  ws.recentLocations = keep;
}

function _normalizeWeatherPresetName(name: any){
  return String(name || '').replace(/\s+/g, ' ').trim();
}

export function _saveWeatherLocationPreset(ws: any, loc: any, presetName: any){
  ws = ws || getWeatherState();
  var name = _normalizeWeatherPresetName(presetName);
  var preset = _normalizeWeatherLocation(loc);
  if (!name || !preset) return null;
  preset.name = name;
  var updated = false;
  var keep = [preset];
  var existingList = Array.isArray(ws.savedLocations) ? ws.savedLocations : [];
  for (var i = 0; i < existingList.length; i++){
    var existing = _normalizeWeatherLocation(existingList[i]);
    if (!existing) continue;
    if (String(existing.name || '').toLowerCase() === name.toLowerCase()){
      updated = true;
      continue;
    }
    keep.push(existing);
  }
  ws.savedLocations = keep;
  return { updated: updated, preset: preset };
}

function _manifestZoneKey(nameOrKey: any){
  var raw = String(nameOrKey || '').toLowerCase().replace(/[\s'_-]+/g, '');
  if (!raw) return null;
  if (raw === 'dalquor') return 'dalquor';
  for (var i = 0; i < MANIFEST_ZONE_ORDER.length; i++){
    var key = MANIFEST_ZONE_ORDER[i];
    var def = MANIFEST_ZONE_DEFS[key];
    if (!def) continue;
    var defKey = String(def.key || key).toLowerCase().replace(/[\s'_-]+/g, '');
    var defName = String(def.name || '').toLowerCase().replace(/[\s'_-]+/g, '');
    if (raw === defKey || raw === defName) return key;
  }
  return null;
}

export function _activeManifestZoneEntries(){
  var zones = getWeatherState().manifestZones || {};
  return Object.keys(zones).map(function(key: any){
    var norm = _manifestZoneKey(key);
    if (!norm || !MANIFEST_ZONE_DEFS[norm]) return null;
    var entry = zones[key] || {};
    return {
      key: norm,
      def: MANIFEST_ZONE_DEFS[norm],
      setOn: entry.setOn || null,
      arythFullActivated: !!entry.arythFullActivated,
      arythFullExitWarned: !!entry.arythFullExitWarned
    };
  }).filter(Boolean).sort(function(a: any, b: any){
    return MANIFEST_ZONE_ORDER.indexOf(a.key) - MANIFEST_ZONE_ORDER.indexOf(b.key);
  });
}

function _activeManifestZoneDefs(){
  return _activeManifestZoneEntries().map(function(entry: any){ return entry.def; });
}

export function _manifestZoneStatusLabel(entries?: any){
  entries = entries || _activeManifestZoneEntries();
  if (!entries.length) return 'None';
  return entries.map(function(entry: any){
    return (entry.def.emoji || '◇') + ' ' + entry.def.name;
  }).join(' · ');
}

export function _activeManifestZonesForSerial(serial: any){
  return (serial === todaySerial()) ? _activeManifestZoneEntries() : [];
}

export function _manifestZoneInfluenceText(def: any){
  if (!def) return null;
  return (def.emoji || '◇') + ' ' + def.name + ' manifest zone (' + (def.effectLabel || 'no weather shift') + ')';
}

function _applyManifestZonesToValues(values: any, entries: any, serial: any){
  entries = entries || [];
  if (!entries.length) return values;

  for (var i = 0; i < entries.length; i++){
    var def = entries[i].def || entries[i];
    if (!def) continue;
    if (typeof def.tempMod === 'number') values.temp += def.tempMod;
    if (typeof def.precipMod === 'number') values.precip = Math.max(0, Math.min(5, values.precip + def.precipMod));
    if (typeof def.windMod === 'number') values.wind = Math.max(0, Math.min(5, values.wind + def.windMod));
    if (def.chaotic){
      var kR = _seededRand((serial|0) * 77 + 999);
      values.temp += Math.floor(kR() * 5) - 2;
      values.precip = Math.max(0, Math.min(5, values.precip + Math.floor(kR() * 3) - 1));
      values.wind = Math.max(0, Math.min(5, values.wind + Math.floor(kR() * 3) - 1));
    }
  }

  values.temp = _clampWeatherTempBand(values.temp);
  values.precip = Math.max(0, Math.min(5, values.precip));
  values.wind = Math.max(0, Math.min(5, values.wind));
  return values;
}

export function _weatherRecordForDisplay(rec: any){
  if (!rec || rec.serial !== todaySerial()) return rec;
  var entries = _activeManifestZonesForSerial(rec.serial);
  if (!entries.length) return rec;

  var out = deepClone(rec);
  var periods = WEATHER_DAY_PERIODS;
  for (var i = 0; i < periods.length; i++){
    var pname = periods[i];
    if (!out.periods || !out.periods[pname]) continue;
    out.periods[pname] = _applyManifestZonesToValues(out.periods[pname], entries, rec.serial);
  }
  if (out.final){
    out.final = _applyManifestZonesToValues(out.final, entries, rec.serial);
  }
  if (!out.location) out.location = {};
  out.location.activeManifestZones = entries.map(function(entry: any){ return entry.def.name; });
  return out;
}

function _isArythFull(serial: any){
  // Aryth is an Eberron moon — this check naturally returns false for
  // any world that lacks it, so no world-name guard is needed.
  try {
    moonEnsureSequences(serial, 60);
    var ph = moonPhaseAt('Aryth', serial);
    return !!(ph && _isFullMoonIllum(ph.illum));
  } catch(e){
    return false;
  }
}

export function _manifestZoneOnDateChange(prevSerial: any, newSerial: any){
  if (!(newSerial > prevSerial)) return;
  if (ensureSettings().weatherEnabled === false) return;
  var ws = getWeatherState();
  if (!ws.location) return;
  var prevFull = _isArythFull(prevSerial);
  var newFull = _isArythFull(newSerial);

  if (!prevFull && newFull){
    warnGM('Aryth is full. Consider a manifest zone.');
  }

  if (prevFull && !newFull){
    var tracked = _activeManifestZoneEntries().filter(function(entry: any){
      return entry.arythFullActivated && !entry.arythFullExitWarned;
    });
    if (tracked.length){
      warnGM('Aryth is no longer full. Consider deactivating: ' +
        tracked.map(function(entry: any){ return entry.def.name; }).join(', ') + '.');
      tracked.forEach(function(entry: any){
        if (!ws.manifestZones[entry.key]) return;
        ws.manifestZones[entry.key].arythFullExitWarned = true;
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 18b) Dice helpers (Roll20 has randomInteger built-in)
// ---------------------------------------------------------------------------

function _rollDie(sides: any){
  sides = Math.max(1, sides|0);
  return (typeof randomInteger === 'function') ? randomInteger(sides) : (Math.floor(Math.random()*sides)+1);
}

// ---------------------------------------------------------------------------
// 18c) Formula composition — three-layer system
// ---------------------------------------------------------------------------

// Returns the modifier entry for a given month index.
// Table may be a 12-element array (seasonal) or a constant object.
// Maps a raw calendar slot index to a 0-based regular-month index for the
// weather tables, which are always 12 entries long (one per non-intercalary month).
// For standard 12-month calendars this is identity. For Harptos (17-18 slots)
// it skips intercalary slots so e.g. Marpenoth (slot 13) → regular index 9.
// Returns the weather-table month index for monthIdx, with hemisphere offset applied.
// Hemisphere-aware season sets (faerun, gregorian) offset by 6 for southern campaigns
// so month 0 reads mid-summer stats rather than mid-winter stats.
function _weatherMonthIndex(mi: any){
  var st     = ensureSettings();
  var sv     = st.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
  var entry  = SEASON_SETS[sv] || SEASON_SETS.eberron;
  var hem    = st.hemisphere || CONFIG_DEFAULTS.hemisphere;
  var offset = (entry && entry.hemisphereAware && hem === 'south') ? 6 : 0;
  return (regularMonthIndex(mi) + offset) % 12;
}

function _getModEntry(table: any, monthIdx: any){
  if (Array.isArray(table)) return table[_weatherMonthIndex(monthIdx)] || table[0];
  return table;
}

// Compose the final formula for one day from all three layers.
// Returns { temp, wind, precip, arcMult } where each trait is {base,die,min,max}.
export function _composeFormula(climate: any, geography: any, terrain: any, monthIdx: any){
  var TRAIT_MIN: any = { temp:WEATHER_TEMP_BAND_MIN, wind:0, precip:0 };
  var TRAIT_MAX: any = { temp:WEATHER_TEMP_BAND_MAX, wind:3, precip:3 };
  var clBase  = WEATHER_CLIMATE_BASE[climate]   || WEATHER_CLIMATE_BASE.temperate;
  var base    = clBase[_weatherMonthIndex(monthIdx)] || clBase[0];
  var gMod    = _getModEntry(WEATHER_GEO_MOD[geography]     || WEATHER_GEO_MOD.inland,   monthIdx);
  var tMod    = _getModEntry(WEATHER_TERRAIN_MOD[terrain]   || WEATHER_TERRAIN_MOD.open,  monthIdx);

  function composeTrait(b: any, gm: any, tm: any, traitMin: any, traitMax: any){
    var shift = (gm|0) + (tm|0);
    var mn = Math.max(traitMin,  (b.min|0) + shift);
    var mx = Math.min(traitMax,  (b.max|0) + shift);
    if (mx < mn) mx = mn;
    return { base: Math.max(mn, Math.min(mx, (b.base|0) + shift)), die: b.die, min: mn, max: mx };
  }

  return {
    temp:    composeTrait(base.temp,   gMod.temp,   tMod.temp,   TRAIT_MIN.temp,   TRAIT_MAX.temp),
    wind:    composeTrait(base.wind,   gMod.wind,   tMod.wind,   TRAIT_MIN.wind,   TRAIT_MAX.wind),
    precip:  composeTrait(base.precip, gMod.precip, tMod.precip, TRAIT_MIN.precip, TRAIT_MAX.precip),
    arcMult: (gMod.arc || 1.0) * (tMod.arc || 1.0)
  };
}

// ---------------------------------------------------------------------------
// 18e) Single trait roll
// ---------------------------------------------------------------------------

export function _rollTrait(formula: any, seedNudge: any){
  var raw = (formula.base|0) +
            _rollDie(formula.die) -
            _rollDie(formula.die) +
            (seedNudge|0);
  return Math.max(formula.min|0, Math.min(formula.max|0, raw));
}

// ---------------------------------------------------------------------------
// 18f) Time-of-day calculations — two layers
//
// Layer 1 (deterministic arc): predictable daily shape from WEATHER_TOD_ARC,
//   scaled by terrain multiplier. Overnight hours inherit some of the previous
//   night, afternoons peak, and evening / nighttime cool again with
//   precipitation often building in humid climates.
//
// Layer 2 (stochastic bell): one 1d20 roll per trait per period.
//   1=−2, 2–4=−1, 5–16=0, 17–19=+1, 20=+2 (critical shifts are rare).
//
// Both layers are stored separately on the record so the GM display can
// distinguish "arc shift" (expected) from "stochastic event" (unusual).
// ---------------------------------------------------------------------------

function _todArc(climate: any, arcMult: any, period: any){
  // Returns the deterministic arc offset for each trait at this period.
  // arcMult = geoMod.arc × terrainMod.arc, both already looked up for this month.
  var arcDef = (WEATHER_TOD_ARC[climate] || WEATHER_TOD_ARC.temperate);
  var traits = ['temp', 'wind', 'precip'];
  var result: any = { temp:0, wind:0, precip:0 };
  for (var i=0; i<traits.length; i++){
    var t   = traits[i];
    var raw = (arcDef[t] && arcDef[t][period] != null) ? arcDef[t][period] : 0;
    result[t] = Math.round(raw * arcMult);
  }
  return result;
}

function _todStochastic(){
  // Returns a random shift for each trait independently using the bell curve.
  return {
    temp:   WEATHER_TOD_BELL[_rollDie(20) - 1],
    wind:   WEATHER_TOD_BELL[_rollDie(20) - 1],
    precip: WEATHER_TOD_BELL[_rollDie(20) - 1]
  };
}

// ---------------------------------------------------------------------------
// 18f-b) Probabilistic fog roll
// Returns 'dense', 'light', or 'none'.
// Called once per period per day at generation time. Result stored on record.
// ---------------------------------------------------------------------------

var _FOG_BASE: any = {
  middle_of_night: 0.18,
  early_morning: 0.30,
  morning:       0.40,
  afternoon:     0.05,
  evening:       0.20,
  nighttime:     0.10
};

var _FOG_GEO_MULT: any = {
  river_valley: 2.0,
  coastal:      1.5,
  inland_sea:   1.5,
  open_plains:  0.3,
  arctic_plain: 0.3,
  jungle_basin: 1.2
};

var _FOG_TERRAIN_MULT: any = {
  swamp:   2.5,
  forest:  1.5,
  desert:  0.1,
  alpine:  0.4
};

// Month index → season weight. Fog favours shoulder seasons.
var _FOG_SEASON_WEIGHT = [
  0.5,  // 0  mid-win
  0.5,  // 1  late-win
  1.2,  // 2  early-sp
  1.2,  // 3  mid-sp
  1.2,  // 4  late-sp
  0.7,  // 5  early-su
  0.7,  // 6  mid-su
  0.7,  // 7  late-su
  1.2,  // 8  early-au
  1.2,  // 9  mid-au
  1.2,  // 10 late-au
  0.6   // 11 early-wn
];

function _rollFog(period: any, pv: any, geography: any, terrain: any, monthIdx: any, prevPeriodFog: any){
  // Gate: fog needs clear-to-overcast precip and above-frigid temperature
  if (pv.precip > 1 || pv.temp < 2) return 'none';

  var base    = _FOG_BASE[period] || 0.05;
  var gMult   = _FOG_GEO_MULT[geography]   || 1.0;
  var tMult   = _FOG_TERRAIN_MULT[terrain] || 1.0;
  var sMult   = _FOG_SEASON_WEIGHT[_weatherMonthIndex(monthIdx)] || 1.0;

  var prob = Math.min(0.90, base * gMult * tMult * sMult);

  // Persistence: dense fog from prior period sustains strongly in calm air;
  // light fog sustains modestly. Morning dense fog in a swamp can last all day.
  if (prevPeriodFog === 'dense' && pv.wind <= 1) prob = Math.min(0.90, prob * 2.5);
  else if (prevPeriodFog === 'light' && pv.wind <= 1) prob = Math.min(0.90, prob * 1.5);

  // Roll (1–100 against prob×100)
  var roll = _rollDie(100);
  if (roll > Math.round(prob * 100)) return 'none';

  // Dense fog: swamp terrain or river_valley geography
  var isDense = (terrain === 'swamp' || geography === 'river_valley');
  var rawFog  = isDense ? 'dense' : 'light';

  // Wind suppression: light fog disperses at wind ≥2, dense at wind ≥3
  if (rawFog === 'light'  && pv.wind >= 2) return 'none';
  if (rawFog === 'dense'  && pv.wind >= 3) return 'none';

  return rawFog;
}

// ---------------------------------------------------------------------------
// 18g) Generate a single day's weather record
// ---------------------------------------------------------------------------

function _blendWeatherValues(primary: any, secondary: any, primaryWeight: any, secondaryWeight: any){
  primary = primary || {};
  secondary = secondary || {};
  primaryWeight = Math.max(1, primaryWeight|0);
  secondaryWeight = Math.max(1, secondaryWeight|0);
  var total = primaryWeight + secondaryWeight;
  return {
    temp: _clampWeatherTempBand(Math.round((((primary.temp||0) * primaryWeight) + ((secondary.temp||0) * secondaryWeight)) / total)),
    wind: Math.max(0, Math.min(5, Math.round((((primary.wind||0) * primaryWeight) + ((secondary.wind||0) * secondaryWeight)) / total))),
    precip: Math.max(0, Math.min(5, Math.round((((primary.precip||0) * primaryWeight) + ((secondary.precip||0) * secondaryWeight)) / total)))
  };
}

function _generateDayWeather(serial: any, prevRec: any, locationOverride: any){
  var loc = locationOverride || getWeatherState().location;
  if (!loc) return null;

  var dateObj   = fromSerial(serial);
  var mi        = dateObj.mi;  // month index 0–11

  var climate   = String(loc.climate   || 'temperate').toLowerCase();
  var geography = String(loc.geography || 'inland').toLowerCase();
  var terrain   = String(loc.terrain   || 'open').toLowerCase();

  var formula = _composeFormula(climate, geography, terrain, mi);
  var arcMult = formula.arcMult;

  // Seed nudge: mean reversion — pull today back toward the seasonal base
  // if yesterday deviated significantly. Prevents prolonged extreme streaks.
  // Small deviations (±1 from base): no nudge — normal daily variation.
  // Larger deviations (±2+): nudge back toward base.
  function _nudge(prev: any, base: any){
    var dev = (prev|0) - (base|0);
    if (dev >= 2)  return -CONFIG_WEATHER_SEED_STRENGTH;  // above base → pull down
    if (dev <= -2) return  CONFIG_WEATHER_SEED_STRENGTH;  // below base → pull up
    return 0;  // within ±1: let it ride
  }

  var nudge: any = { temp:0, wind:0, precip:0 };
  var prevFinal = prevRec && prevRec.final ? prevRec.final : null;
  if (prevFinal && CONFIG_WEATHER_SEED_STRENGTH > 0){
    nudge.temp   = _nudge(prevFinal.temp,   formula.temp.base);
    nudge.wind   = _nudge(prevFinal.wind,   formula.wind.base);
    nudge.precip = _nudge(prevFinal.precip, formula.precip.base);
  }

  // Base roll — afternoon (peak) values for the day.
  var base = {
    temp:   _rollTrait(formula.temp,   nudge.temp),
    wind:   _rollTrait(formula.wind,   nudge.wind),
    precip: _rollTrait(formula.precip, nudge.precip)
  };

  // Combine arc + stochastic and clamp to composed formula range.
  function periodVals(arc: any, rng: any){
    var traits = ['temp', 'wind', 'precip'];
    var out: any = {};
    for (var i=0; i<traits.length; i++){
      var t = traits[i];
      var v = (base[t]|0) + (arc[t]|0) + (rng[t]|0);
      out[t] = Math.max(formula[t].min|0, Math.min(formula[t].max|0, v));
    }
    return out;
  }

  var arc: any = {};
  var rng: any = {};
  var periods: any = {};
  for (var pi = 0; pi < WEATHER_DAY_PERIODS.length; pi++){
    var pname = WEATHER_DAY_PERIODS[pi];
    arc[pname] = _todArc(climate, arcMult, pname);
    rng[pname] = _todStochastic();
    periods[pname] = periodVals(arc[pname], rng[pname]);
  }

  // The overnight handoff should feel continuous across midnight rather than
  // like a hard reset at the calendar boundary.
  var prevNight = _weatherPrevNightValues(prevRec);
  if (prevNight){
    periods.middle_of_night = _blendWeatherValues(prevNight, periods.middle_of_night, 2, 1);
    periods.early_morning = _blendWeatherValues(periods.middle_of_night, periods.early_morning, 1, 2);
  }

  // Roll fog per period at generation time — stored so display is consistent.
  // Chained so each period can inherit persistence from the previous one,
  // beginning with the previous night's stored fog when available.
  var fog: any = {};
  var prevFog: any = _weatherPrevNightFog(prevRec);
  for (var fi = 0; fi < WEATHER_DAY_PERIODS.length; fi++){
    var fogPeriod = WEATHER_DAY_PERIODS[fi];
    fog[fogPeriod] = _rollFog(fogPeriod, periods[fogPeriod], geography, terrain, mi, prevFog);
    prevFog = fog[fogPeriod];
  }

  // final = afternoon peak. Local manifest zones apply at display time for
  // the current day only; forecasts remain location-profile driven.
  var finalVals: any = {
    temp:   periods[WEATHER_PRIMARY_PERIOD].temp,
    wind:   periods[WEATHER_PRIMARY_PERIOD].wind,
    precip: periods[WEATHER_PRIMARY_PERIOD].precip
  };

  // Planar coterminous/remote weather influences (± modifiers, not hard overrides).
  // These stack with manifest zone effects for layered environmental storytelling.
  if (ensureSettings().planesEnabled !== false){
    try {
      var _plEff = getActivePlanarEffects(serial);
      for (var _pe = 0; _pe < _plEff.length; _pe++){
        var _ppe = _plEff[_pe];
        if (_ppe.plane === 'Fernia'  && _ppe.phase === 'coterminous') finalVals.temp += 3;
        if (_ppe.plane === 'Fernia'  && _ppe.phase === 'remote')      finalVals.temp -= 2;
        if (_ppe.plane === 'Risia'   && _ppe.phase === 'coterminous') finalVals.temp -= 3;
        if (_ppe.plane === 'Risia'   && _ppe.phase === 'remote')      finalVals.temp += 2;
        if (_ppe.plane === 'Syrania' && _ppe.phase === 'coterminous'){ finalVals.precip = 0; finalVals.wind = 0; }
        if (_ppe.plane === 'Syrania' && _ppe.phase === 'remote')      finalVals.precip = Math.min(5, finalVals.precip + 1);
      }
    } catch(e){ /* planar system not ready */ }
  }
  finalVals.temp = _clampWeatherTempBand(finalVals.temp);

  // Final temp clamp to valid band range after all modifiers.
  finalVals.temp = Math.max(-5, Math.min(15, finalVals.temp));

  // Snow accumulation: previous day was cold (temp ≤3) with any precipitation.
  var snowAccumulated = !!(prevFinal && prevFinal.temp <= 3 && prevFinal.precip >= 1);

  // Wet accumulation: previous day was warm (temp ≥5) with significant rain (precip ≥2).
  // Used by extreme event evaluator: flash flood risk elevated, flash freeze possible.
  var wetAccumulated  = !!(prevFinal && prevFinal.temp >= 5  && prevFinal.precip >= 2);

  return {
    serial:          serial,
    location:        _normalizeWeatherLocation({ climate: climate, geography: geography, terrain: terrain }),
    monthIdx:        mi,
    base:            base,
    arc:             arc,
    rng:             rng,
    periods:         periods,
    fog:             fog,
    final:           finalVals,
    snowAccumulated: snowAccumulated,
    wetAccumulated:  wetAccumulated,
    generatedAt:     todaySerial(),
    stale:           false,
    locked:          false
  };
}

// ---------------------------------------------------------------------------
// 18h) Forecast management
// ---------------------------------------------------------------------------

export function _forecastRecord(serial: any){
  var fc = getWeatherState().forecast;
  for (var i=0; i<fc.length; i++){ if (fc[i].serial === serial) return fc[i]; }
  return null;
}

function _forecastIndex(serial: any){
  var fc = getWeatherState().forecast;
  for (var i=0; i<fc.length; i++){ if (fc[i].serial === serial) return i; }
  return -1;
}

function _historyRecord(serial: any){
  var hist = getWeatherState().history;
  for (var i = hist.length - 1; i >= 0; i--){
    if (hist[i].serial === serial) return hist[i];
  }
  return null;
}

export function _generateForecast(fromSerial_: any, count: any, forceRegen: any){
  var ws  = getWeatherState();
  var loc = ws.location;
  if (!loc){ warnGM('Set a weather location first: !cal weather location'); return 0; }

  count = (count != null) ? Math.max(1, count|0) : CONFIG_WEATHER_FORECAST_DAYS;
  var generated = 0;

  // Find the last known record for continuity seeding.
  var prevRec: any = null;
  var prevIdx = _forecastIndex(fromSerial_ - 1);
  if (prevIdx >= 0) prevRec = ws.forecast[prevIdx];
  else prevRec = _historyRecord(fromSerial_ - 1);

  for (var i=0; i<count; i++){
    var ser = fromSerial_ + i;
    var existing = _forecastRecord(ser);
    if (existing && existing.locked){
      prevRec = existing;
      continue;
    }
    if (existing && !forceRegen && !existing.stale) continue;

    var rec = _generateDayWeather(ser, prevRec, loc);
    if (!rec) break;

    if (existing){
      ws.forecast[_forecastIndex(ser)] = rec;
    } else {
      ws.forecast.push(rec);
    }
    prevRec = rec;
    generated++;
  }

  // Keep forecast sorted and trimmed to window
  ws.forecast.sort(function(a: any, b: any){ return a.serial - b.serial; });

  return generated;
}

export function weatherEnsureForecast(){
  // Called after day advance. Locks today, archives old days, fills the window.
  var ws    = getWeatherState();
  var today = todaySerial();

  // Archive and lock past days
  ws.forecast = ws.forecast.filter(function(rec: any){
    if (rec.serial < today){
      rec.locked = true;
      ws.history.push(rec);
      return false;
    }
    return true;
  });

  // Trim history and playerReveal to 60 days behind today
  ws.history.sort(function(a: any, b: any){ return a.serial - b.serial; });
  if (ws.history.length > CONFIG_WEATHER_HISTORY_DAYS) ws.history = ws.history.slice(ws.history.length - CONFIG_WEATHER_HISTORY_DAYS);

  var pruneThreshold = today - 60;
  Object.keys((ws.playerReveal && ws.playerReveal.byLocation) || {}).forEach(function(sig: any){
    var bucket = ws.playerReveal.byLocation[sig] || {};
    Object.keys(bucket).forEach(function(k: any){
      if (parseInt(k, 10) < pruneThreshold) delete bucket[k];
    });
    if (!Object.keys(bucket).length) delete ws.playerReveal.byLocation[sig];
  });

  // Fill forward to today + CONFIG_WEATHER_FORECAST_DAYS
  _generateForecast(today, CONFIG_WEATHER_FORECAST_DAYS, false);
}

// ---------------------------------------------------------------------------
// 18i) Uncertainty tier for a forecast record
// ---------------------------------------------------------------------------

function _uncertaintyTier(rec: any){
  if (!rec) return 'vague';
  if (rec.locked) return 'certain';
  var dist = rec.serial - rec.generatedAt;
  var tiers = WEATHER_UNCERTAINTY;
  if (dist <= tiers.certain.maxDist)   return 'certain';
  if (dist <= tiers.likely.maxDist)    return 'likely';
  if (dist <= tiers.uncertain.maxDist) return 'uncertain';
  return 'vague';
}

// ---------------------------------------------------------------------------
// 18j-0) Extreme event system
// ---------------------------------------------------------------------------
// Events are evaluated once at generation time. The result (an array of
// event objects) is stored on the record. The Today panel shows them as
// flagged warnings with two GM buttons: Trigger (send to players) and
// Roll the Dice (probabilistic roll that either fires or doesn't).
//
// No event ever fires automatically. GM must press a button.
// ---------------------------------------------------------------------------

var EXTREME_EVENTS: any = {

  flash_flood: {
    name:     'Flash Flood',
    emoji:    '🌊',
    // Trigger: heavy rain in lowland/coastal geography
    check: function(f: any, loc: any, sa: any, wa: any){
      var lowGeos: any = { river_valley:1, coastal:1, jungle_basin:1, inland_sea:1 };
      if (f.temp < 5 || f.precip < 3 || !lowGeos[loc.geography]) return 0;
      var p = 0.12;
      if (wa)                      p += 0.15;  // prior day already wet
      if (loc.terrain === 'urban') p += 0.08;  // pavement runoff
      return Math.min(0.35, p);
    },
    duration:  '1–4 hours',
    mechanics: 'River crossings impassable. Low ground becomes difficult terrain. Swim DC 15 or be swept downstream (1d6 bludgeoning per round). Creatures in water: Str save DC 13 or knocked prone.',
    aftermath: 'Roads washed out. Fords flooded for 1d4 days. Water sources silted.',
    playerMsg: function(loc: any){ return 'A flash flood sweeps through the lowlands. The river bursts its banks — all crossings are closed.'; }
  },

  whiteout: {
    name:     'Whiteout',
    emoji:    '❄️',
    // Trigger: active blizzard on open flat terrain
    check: function(f: any, loc: any, sa: any, wa: any){
      var openGeos: any = { open_plains:1, arctic_plain:1 };
      if (f.temp > 3 || f.precip < 3 || f.wind < 3 || !openGeos[loc.geography]) return 0;
      return 0.55;
    },
    duration:  '2–8 hours',
    mechanics: 'Visibility 0 ft (total whiteout). All creatures Blinded. Navigation impossible without magic — DC 20 Survival or travel in circles. Exposed creatures: DC 15 Con save each hour or gain Exhaustion.',
    aftermath: 'Drifts 2–5 ft deep on open ground. All outdoor surfaces difficult terrain for 1d3 days.',
    playerMsg: function(loc: any){ return 'A whiteout descends. The world disappears into white — sky and ground indistinguishable. Travel is impossible.'; }
  },

  ground_blizzard: {
    name:     'Ground Blizzard',
    emoji:    '💨',
    // Trigger: accumulated snow + storm wind on open terrain — no active precip needed
    check: function(f: any, loc: any, sa: any, wa: any){
      var openGeos: any = { open_plains:1, arctic_plain:1 };
      if (!sa || f.wind < 3 || !openGeos[loc.geography]) return 0;
      // Can occur even if today's precip is low — the snow is already on the ground
      if (f.precip > 1) return 0;  // if actively precipitating, whiteout covers it
      return 0.35;
    },
    duration:  '1–6 hours',
    mechanics: 'Heavily Obscured beyond 30ft. Navigation DC 15 Survival. Exposed creatures: DC 12 Con save each hour or gain Exhaustion level. Flying impossible in open terrain.',
    aftermath: 'Drifting fills roads and sheltered passages. Travel speed halved outdoors for the day.',
    playerMsg: function(loc: any){ return 'A ground blizzard erupts — the wind picks up the snow already on the ground and flings it horizontally. Visibility collapses.'; }
  },

  haboob: {
    name:     'Dust Storm (Haboob)',
    emoji:    '🌪️',
    // Trigger: hot dry conditions with wind — desert/plains in dry climate
    check: function(f: any, loc: any, sa: any, wa: any){
      var dryTerrains: any = { desert:1, open:1 };
      var openGeos: any    = { open_plains:1, arctic_plain:1 };
      var dryClimates: any = { dry:1 };
      // Needs dry conditions: no precipitation, hot, windy
      if (f.precip > 0 || f.temp < 9 || f.wind < 2) return 0;
      if (!dryTerrains[loc.terrain] && !openGeos[loc.geography]) return 0;
      var p = 0.10;
      if (f.wind >= 3) p += 0.05;
      if (f.temp >= 10) p += 0.05;
      return Math.min(0.20, p);
    },
    duration:  '10 minutes – 3 hours',
    mechanics: 'Heavily Obscured beyond 30ft for duration. Creatures without eye/mouth protection: DC 12 Con save or become Poisoned (choking dust) until they take a short rest in shelter. Flying creatures: DC 15 Str save or be grounded.',
    aftermath: 'Fine dust coats everything. Food/water may be contaminated. Visibility remains reduced (Lightly Obscured) for 1d4 hours after.',
    playerMsg: function(loc: any){ return 'A wall of dust appears on the horizon and swallows the sky. Shelter — now.'; }
  },

  avalanche: {
    name:     'Avalanche',
    emoji:    '⛰️',
    // Trigger: highland geography, cold, heavy snow + wind — or post-storm loading
    check: function(f: any, loc: any, sa: any, wa: any){
      if (loc.geography !== 'highland') return 0;
      if (f.temp > 4) return 0;
      var p = 0;
      if (f.precip >= 2 && f.wind >= 2) p = 0.15;
      if (sa && f.precip >= 2)          p = Math.max(p, 0.15);
      if (sa && f.precip >= 3 && f.wind >= 3) p = Math.min(0.38, p + 0.15);
      else if (f.wind >= 3)             p = Math.min(0.38, p + 0.08);
      return p;
    },
    duration:  'Instantaneous event; aftermath hours to days',
    mechanics: 'Any creature in the avalanche path: DC 15 Dex save or take 6d6 bludgeoning and become Restrained (buried). Restrained creatures: DC 15 Athletics each round to dig free, or suffocate after Con modifier + proficiency bonus rounds.',
    aftermath: 'Pass or valley blocked. Rescue operations may be needed. Travel through area impossible without magical aid or 1d4 days of clearing.',
    playerMsg: function(loc: any){ return 'A thunderous crack echoes from above. Avalanche!'; }
  },

  lightning_storm: {
    name:     'Severe Thunderstorm',
    emoji:    '⚡',
    // Trigger: severe rain + warm temp + wind
    check: function(f: any, loc: any, sa: any, wa: any){
      if (f.temp < 7 || f.precip < 3 || f.wind < 2) return 0;
      var p = 0.25;
      if (f.temp >= 9) p += 0.10;
      return Math.min(0.35, p);
    },
    duration:  '1–3 hours',
    mechanics: 'Lightning strikes: each minute outdoors, DC 13 Dex save or be struck (4d10 lightning damage, DC 14 Con save or Stunned 1 round). Metal armour wearers: disadvantage on save. Tall isolated objects are struck first.',
    aftermath: 'Fires possible in dry terrain. Fallen trees may block roads. Flash flooding risk elevated (see Flash Flood).',
    playerMsg: function(loc: any){ return 'The storm reaches a violent peak. Lightning splits the sky — this is not a safe time to be in the open.'; }
  },

  clear_sky_strike: {
    name:     'Clear-Sky Lightning',
    emoji:    '🌩️',
    // Trigger: uncommon atmospheric discharge with little/no precipitation.
    // Enhanced during Zarantyr full moon via _evaluateExtremeEvents.
    check: function(f: any, loc: any, sa: any, wa: any){
      if (f.precip > 1 || f.wind > 2) return 0;
      var p = 0.02;
      if (f.temp >= 7) p += 0.02;
      if (f.temp >= 9) p += 0.01;
      return Math.min(0.06, p);
    },
    duration:  'Instantaneous strike or short burst (minutes)',
    mechanics: 'An unexpected bolt strikes with little warning. Creatures in exposed outdoor terrain make DC 13 Dex save or take 3d10 lightning damage (half on success). Tall isolated objects are preferential targets.',
    aftermath: 'Potential localized fire or structural scorch at strike site.',
    playerMsg: function(loc: any){ return 'A jagged bolt tears from a clear sky. Thunder follows seconds later.'; }
  },

  flash_freeze: {
    name:     'Flash Freeze',
    emoji:    '🧊',
    // Trigger: today is suddenly very cold after a warm wet yesterday
    check: function(f: any, loc: any, sa: any, wa: any){
      // wa = prev day was warm (≥5) and wet (≥1)
      if (!wa || f.temp > 3 || f.wind < 2) return 0;
      return 0.25;
    },
    duration:  '1–4 hours for freeze; persists until thaw',
    mechanics: 'All exposed water surfaces (puddles, ford crossings, wet mud) become ice. Difficult terrain on all outdoor surfaces. DC 12 Acrobatics to avoid falling prone when moving at full speed on ice.',
    aftermath: 'Icy surfaces persist until temperature rises above band 4 (45F+). Fords may be crossable on foot — or may give way.',
    playerMsg: function(loc: any){ return 'The temperature plummets. Water crystallizes where it stands. The world glazes over in an hour.'; }
  },

  tropical_storm: {
    name:     'Tropical Storm',
    emoji:    '🌀',
    // Trigger: warm/hot + coastal or open sea + high wind + rain
    check: function(f: any, loc: any, sa: any, wa: any){
      var seaGeos: any = { coastal:1, open_sea:1, inland_sea:1 };
      if (f.temp < 7 || f.wind < 3 || f.precip < 3 || !seaGeos[loc.geography]) return 0;
      var p = 0.20;
      if (f.wind >= 4) p += 0.15;
      if (f.temp >= 9) p += 0.10;
      return Math.min(0.45, p);
    },
    duration:  '6–24 hours',
    mechanics: 'Wind: sustained gale-force. Ranged weapon attacks and flying have disadvantage. Small sailing vessels: DC 15 water vehicles check each hour or capsize. Structures: DC 12 to resist minor damage to roofs and shutters. Outdoor fires extinguished.',
    aftermath: 'Coastal flooding for 1d3 days. Minor structural damage. Debris-strewn roads.',
    playerMsg: function(loc: any){ return 'A tropical storm bears down on the coast. Winds howl, rain drives sideways, and the sea surges against the shore.'; }
  },

  hurricane: {
    name:     'Hurricane',
    emoji:    '🌊',
    // Trigger: extremely warm + open sea or coastal + extreme wind + deluge
    // Rarer and more dangerous than tropical storm
    check: function(f: any, loc: any, sa: any, wa: any){
      var seaGeos: any = { coastal:1, open_sea:1 };
      if (f.temp < 9 || f.wind < 4 || f.precip < 4 || !seaGeos[loc.geography]) return 0;
      var p = 0.30;
      if (f.wind >= 5) p += 0.20;
      if (f.precip >= 5) p += 0.10;
      return Math.min(0.60, p);
    },
    duration:  '12–48 hours',
    mechanics: 'Wind: hurricane force. All ranged attacks impossible. Flying impossible without magic (DC 18 Str save each round). Creatures outdoors: DC 13 Str save each round or be knocked prone and pushed 10 ft. All non-stone structures: DC 15 to resist significant damage. Ships at sea: DC 18 water vehicles each hour or capsize with 4d6 bludgeoning to all aboard. Storm surge floods coastal areas to 1d4 × 5 feet.',
    aftermath: 'Catastrophic coastal flooding for 1d6 days. Major structural damage. Trees uprooted. Roads impassable for 1d4 days. Water sources contaminated.',
    playerMsg: function(loc: any){ return 'The sky turns an unearthly green. The hurricane hits with a wall of wind and water that shakes the foundations of the world.'; }
  }
};

// Evaluate all extreme events for a given day record.
// Returns array of { key, event, probability } for events that qualify.
// Probability > 0 means conditions are met. Events with p=0 are excluded.
export function _evaluateExtremeEvents(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return [];
  var f   = rec.final;
  var loc = rec.location || {};
  var sa  = !!rec.snowAccumulated;
  var wa  = !!rec.wetAccumulated;
  var zarantyrFull = _isZarantyrFull(rec.serial);
  var qualified: any[] = [];
  var keys = Object.keys(EXTREME_EVENTS);
  for (var i=0; i<keys.length; i++){
    var key = keys[i];
    var evt = EXTREME_EVENTS[key];
    var p   = evt.check(f, loc, sa, wa);

    if (key === 'lightning_storm' && zarantyrFull){
      p = Math.min(0.65, p + 0.20);
    }
    if (key === 'clear_sky_strike'){
      if (!zarantyrFull) p = 0;
      else p = Math.min(0.15, p + 0.05);
    }

    if (p > 0) qualified.push({ key: key, event: evt, probability: p });
  }
  return qualified;
}

// Roll the dice for a single event. Returns true if event fires.
function _rollExtremeEvent(key: any, rec: any){
  var evt = EXTREME_EVENTS[key];
  if (!evt) return false;
  rec = _weatherRecordForDisplay(rec);
  if (!rec || !rec.final) return false;
  var f   = rec.final;
  var loc = rec.location || {};
  var p   = evt.check(f, loc, !!rec.snowAccumulated, !!rec.wetAccumulated);
  var zarantyrFull = _isZarantyrFull(rec.serial);
  if (key === 'lightning_storm' && zarantyrFull) p = Math.min(0.65, p + 0.20);
  if (key === 'clear_sky_strike'){
    if (!zarantyrFull) p = 0;
    else p = Math.min(0.15, p + 0.05);
  }
  return (_rollDie(100) <= Math.round(p * 100));
}

// Render the extreme event panel for the GM Today view.
// Shows each qualified event with its probability and two buttons.
function _extremeEventPanelHtml(rec: any){
  var events = _evaluateExtremeEvents(rec);
  if (!events.length) return '';
  var mechanicsOn = ensureSettings().weatherMechanicsEnabled !== false;

  var lines = ['<div style="margin-top:6px;border-top:1px solid rgba(0,0,0,.15);padding-top:5px;">'];
  lines.push('<div style="font-size:.85em;font-weight:bold;color:#B71C1C;margin-bottom:3px;">⚠ Extreme Event Conditions Present</div>');

  for (var i=0; i<events.length; i++){
    var e   = events[i];
    var pct = Math.round(e.probability * 100);
    var triggerBtn = button(e.event.emoji+' Mark Active', 'weather event trigger '+e.key);
    var rollBtn    = button('🎲 Roll (GM) ('+pct+'%)', 'weather event roll '+e.key);
    lines.push(
      '<div style="margin:3px 0;padding:4px 6px;background:rgba(183,28,28,.06);border-radius:4px;border:1px solid rgba(183,28,28,.2);">'+
      '<div style="font-size:.9em;font-weight:bold;">'+esc(e.event.emoji+' '+e.event.name)+'</div>'+
      (mechanicsOn && e.event.mechanics ? '<div style="font-size:.85em;opacity:.85;margin:2px 0;">'+esc(e.event.mechanics)+'</div>' : '')+
      '<div style="margin-top:3px;">'+triggerBtn+' '+rollBtn+'</div>'+
      '</div>'
    );
  }
  lines.push('</div>');
  return lines.join('');
}

// Build a GM-facing extreme-event details block.
function _extremeEventDetailsHtml(key: any, rec: any){
  var evt = EXTREME_EVENTS[key];
  if (!evt) return '';
  var msg = evt.playerMsg(rec ? rec.location || {} : {});
  var mechanicsOn = ensureSettings().weatherMechanicsEnabled !== false;
  return (
    '<div style="border:2px solid #B71C1C;border-radius:5px;padding:6px 10px;background:#FFF3F3;">'+
    '<div style="font-size:1.1em;font-weight:bold;color:#B71C1C;">'+esc(evt.emoji+' '+evt.name)+'</div>'+
    '<div style="margin-top:3px;">'+esc(msg)+'</div>'+
    '<div style="font-size:.85em;margin-top:4px;opacity:.85;border-top:1px solid rgba(183,28,28,.2);padding-top:3px;">'+
    '<b>Duration:</b> '+esc(evt.duration)+'<br>'+
    (mechanicsOn ? '<b>Mechanics:</b> '+esc(evt.mechanics)+'<br>' : '<b>Mechanics:</b> Disabled in settings<br>')+
    '<b>Aftermath:</b> '+esc(evt.aftermath)+
    '</div></div>'
  );
}

// ---------------------------------------------------------------------------
// 18j) Flavor text helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 18j-a) Condition derivation — determines precip type, fog, visibility,
//         difficult terrain from period values + location context.
// Called per period. Returns a structured conditions object used by all
// display functions. This replaces the old precip label system.
// ---------------------------------------------------------------------------

export function _deriveConditions(pv: any, loc: any, period: any, snowAccumulated: any, fogOverride: any){
  var temp    = pv.temp   || 0;
  var wind    = pv.wind   || 0;
  var precip  = pv.precip || 0;
  var geo     = (loc && loc.geography) || 'inland';
  var terrain = (loc && loc.terrain)   || 'open';

  // -- Precip type --
  // temp ≤3 (≤34F) = snow zone; temp 4 (35-44F) = sleet zone; temp ≥5 (45F+) = rain zone
  // precip 1 = partly cloudy/light, 2 = overcast/moderate, 3 = precipitation,
  // 4 = heavy precipitation, 5 = extreme/deluge
  //
  // Climate-aware floor: tropical/subtropical terrains like swamp should not
  // generate snow from stochastic cold snaps. The climate base determines the
  // effective precip-type temperature floor.
  var climate = (loc && loc.climate) ? String(loc.climate).toLowerCase() : '';
  var effectiveTemp = temp;
  if (climate === 'tropical' && effectiveTemp <= 3) effectiveTemp = 5;
  else if (climate === 'subtropical' && effectiveTemp <= 3) effectiveTemp = 4;
  else if (terrain === 'swamp' && effectiveTemp <= 2) effectiveTemp = Math.max(effectiveTemp, 4);

  var precipType = 'none';
  if (precip >= 1){
    if (effectiveTemp <= 3){
      precipType = (precip >= 4) ? 'blizzard' : (precip >= 3) ? 'snow' : 'snow_light';
    } else if (effectiveTemp === 4){
      precipType = (precip >= 4) ? 'ice_storm' : (precip >= 3) ? 'sleet' : 'sleet_light';
    } else {
      precipType = (precip >= 5) ? 'deluge' : (precip >= 4) ? 'heavy_rain' : (precip >= 3) ? 'rain' : 'rain_light';
    }
  }

  // -- Fog --
  // Use pre-rolled value from the record when available (fogOverride).
  // Falls back to a quick inline derivation for display contexts that lack
  // the record (e.g. low-tier player view using only rec.final).
  var fog = (fogOverride !== undefined) ? fogOverride : 'none';
  if (fog === undefined) fog = 'none';

  // -- Visibility — three clean tiers --
  // Tier A: Lightly Obscured everywhere
  // Tier B: Lightly Obscured; Heavily Obscured beyond 60ft
  // Tier C: Lightly Obscured; Heavily Obscured beyond 30ft
  var vis: any = { tier: 'none', beyond: null };
  if (fog === 'dense' || precipType === 'blizzard' || precipType === 'deluge'){
    vis = { tier: 'C', beyond: 30 };
  } else if (fog === 'light' || precipType === 'heavy_rain' || precipType === 'ice_storm'){
    vis = { tier: 'B', beyond: 60 };
  } else if (precipType === 'rain' || precipType === 'snow' || precipType === 'sleet'){
    vis = { tier: 'A', beyond: null };
  }
  // _light subtypes: no visibility penalty (light precip is atmospheric, not obscuring)

  // -- Difficult terrain --
  // Always: sleet and ice storm (ice on all surfaces), blizzard (rapid accumulation).
  // Conditional: light snow only when prior-day accumulation exists (base layer).
  var difficultTerrain = (
    precipType === 'sleet'     ||
    precipType === 'ice_storm' ||
    precipType === 'blizzard'  ||
    precipType === 'deluge'    ||
    (precipType === 'snow' && snowAccumulated)
  );

  // -- Mechanics strings --
  var mechLines: any[] = [];

  // Temperature
  var tm = _weatherTempMechanics(temp);
  if (tm) mechLines.push('<b>Temperature:</b> ' + esc(tm));

  // Wind
  var wm = CONFIG_WEATHER_MECHANICS.wind[wind];
  if (wm) mechLines.push('<b>Wind:</b> ' + esc(wm));

  // Visibility from precip/fog
  if (vis.tier !== 'none'){
    var visStr = '';
    if (vis.tier === 'C'){
      visStr = 'Lightly Obscured. Heavily Obscured beyond 30ft. Perception at disadvantage.';
    } else if (vis.tier === 'B'){
      visStr = 'Lightly Obscured. Heavily Obscured beyond 60ft. Perception at disadvantage.';
    } else {
      visStr = 'Lightly Obscured. Perception at disadvantage.';
    }
    var visSource = fog !== 'none' ? 'Fog' : 'Precipitation';
    mechLines.push('<b>'+visSource+':</b> '+visStr);
  }

  // Difficult terrain
  if (difficultTerrain){
    var dtReason = (precipType === 'snow' && snowAccumulated)
      ? 'Difficult terrain on all surfaces (accumulated snow underfoot).'
      : (precipType === 'blizzard')
        ? 'Difficult terrain on all surfaces (rapidly accumulating snow).'
        : 'Difficult terrain on all surfaces (ice).';
    mechLines.push('<b>Terrain:</b> ' + dtReason);
  }

  // Special events (informational, not binding)
  if (precipType === 'heavy_rain' || precipType === 'deluge' || precipType === 'blizzard' || precipType === 'ice_storm'){
    var hazardNote = (precipType === 'heavy_rain')
      ? 'Risk of lightning and flash flooding. Soft ground may become difficult terrain at GM discretion.'
      : (precipType === 'deluge')
        ? 'Extreme flooding. Rivers burst banks. Roads impassable. Shelter imperative.'
        : (precipType === 'blizzard')
        ? 'Risk of whiteout, avalanche (mountainous terrain), and hypothermia.'
        : 'Risk of lightning, flash flooding, or falling ice.';
    mechLines.push('<b>Hazards:</b> ' + hazardNote);
  }

  return {
    precipType:       precipType,     // none|rain_light|rain|heavy_rain|deluge|snow_light|snow|blizzard|sleet_light|sleet|ice_storm
    fog:              fog,            // none|light|dense
    visibility:       vis,            // { tier:'none'|'A'|'B'|'C', beyond:null|30|60 }
    difficultTerrain: difficultTerrain,
    mechanics:        mechLines       // array of HTML strings, ready to join
  };
}

// Render conditions mechanics block as HTML (empty string if none).
export function _conditionsMechHtml(cond: any){
  if (ensureSettings().weatherMechanicsEnabled === false) return '';
  if (!cond.mechanics.length) return '';
  return '<div style="font-size:.85em;margin-top:3px;">'+cond.mechanics.join('<br>')+'</div>';
}

// Full mechanical readout for today — whispered on demand via button.
// Covers the full six-bucket day model + any extreme events + planar effects.
function weatherTodayMechanicsHtml(){
  if (ensureSettings().weatherMechanicsEnabled === false){
    return _menuBox('📋 Weather Mechanics',
      '<div style="opacity:.7;">Mechanical weather effects are disabled. Narrative weather remains active.</div>'+
      '<div style="margin-top:6px;">'+button('⬅ Back', 'weather')+'</div>'
    );
  }
  var today = todaySerial();
  var rec = _weatherRecordForDisplay(_forecastRecord(today));
  if (!rec || !rec.final) return _menuBox('📋 Weather Mechanics', '<div style="opacity:.7;">No weather data for today.</div>');

  var f = rec.final;
  var loc = rec.location || {};
  var d = fromSerial(today);
  var dateLabel = esc(_displayMonthDayParts(d.mi, d.day).label);

  var sections: any[] = [];

  // Period breakdown: show mechanics only for the active time bucket,
  // or afternoon if time of day is not active.
  var activeBucket = isTimeOfDayActive() ? currentTimeBucket() : 'afternoon';
  var periods = WEATHER_DAY_PERIODS;
  for (var pi = 0; pi < periods.length; pi++){
    var period = periods[pi];
    var periodVals = (rec.periods && rec.periods[period]) || f;
    var fogForPeriod = rec.fog && rec.fog[period];
    var cond = _deriveConditions(periodVals, loc, period, rec.snowAccumulated, fogForPeriod);
    var narr = _conditionsNarrative(periodVals, cond, period);
    var isActive = (period === activeBucket);
    var mechBlock = isActive ? _conditionsMechHtml(cond) : '';
    var activeMarker = isActive ? ' ★' : '';
    sections.push(
      '<div style="margin-top:6px;' + (isActive ? 'border-left:3px solid #FFD700;padding-left:6px;' : '') + '">'+
      '<b>' + _weatherPeriodIcon(period) + ' ' + esc(_weatherPeriodLabel(period)) + activeMarker + ':</b> ' + esc(narr) +
      (mechBlock || '') +
      '</div>'
    );
  }

  // Extreme events
  var extremes = _evaluateExtremeEvents(rec);
  if (extremes.length){
    var exHtml = '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.15);padding-top:6px;">' +
      '<b style="color:#B71C1C;">⚡ Extreme Events:</b>';
    for (var ei = 0; ei < extremes.length; ei++){
      var ex = extremes[ei];
      exHtml += '<div style="margin:4px 0;font-size:.9em;"><b>'+esc(ex.event.name)+'</b>';
      if (ex.event.mechanics) exHtml += '<br><span style="font-size:.9em;">'+esc(ex.event.mechanics)+'</span>';
      exHtml += '</div>';
    }
    exHtml += '</div>';
    sections.push(exHtml);
  }

  // Planar weather effects
  var shifts = _activePlanarWeatherShiftLines(today);
  if (shifts.length){
    sections.push(
      '<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,.15);padding-top:6px;">'+
      '<b>🌀 Planar Effects:</b><br>' +
      shifts.map(esc).join('<br>') +
      '</div>'
    );
  }

  // Current lighting -- always shown so the GM can read the active light level
  moonEnsureSequences();
  var lightHtml = nighttimeLightHtml(today);
  if (lightHtml){
    sections.push(
      '<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,.15);padding-top:6px;">'+
      '<b>Current Lighting:</b><br>' +
      lightHtml +
      '</div>'
    );
  }

  return _menuBox('📋 Weather Mechanics — ' + dateLabel,
    sections.join('') +
    '<div style="margin-top:8px;">' + button('⬅ Back', 'weather') + '</div>'
  );
}

// One-line narrative for a period's conditions.
// period uses WEATHER_DAY_PERIODS and is primarily used for fog phrasing.
export function _conditionsNarrative(pv: any, cond: any, period: any){
  var base = _flavorText(pv);
  if (cond.fog !== 'none' && pv.precip <= 1){
    if (cond.fog === 'dense'){
      if (period === 'middle_of_night') base = pv.precip === 0 ? 'Dense fog after midnight.' : 'Low cloud and heavy fog after midnight.';
      else if (period === 'early_morning')  base = pv.precip === 0 ? 'Dense predawn fog.' : 'Dense fog before dawn.';
      else if (period === 'morning')   base = pv.precip === 0 ? 'Dense fog.' : 'Dense fog and overcast.';
      else if (period === 'afternoon') base = pv.precip === 0 ? 'Dense fog persisting into the day.' : 'Overcast with thick fog.';
      else if (period === 'evening')   base = pv.precip === 0 ? 'Dense fog settling in.' : 'Foggy and overcast.';
      else                             base = pv.precip === 0 ? 'Dense night fog.' : 'Low cloud and heavy fog.';
    } else {
      // light fog
      if (period === 'middle_of_night') base = pv.precip === 0 ? 'Patchy fog after midnight.' : base;
      else if (period === 'early_morning')  base = pv.precip === 0 ? 'Patchy predawn fog.' : base;
      else if (period === 'morning')   base = pv.precip === 0 ? 'Patchy morning fog.' : base;
      else if (period === 'afternoon') base = pv.precip === 0 ? 'Patchy fog.' : base;
      else if (period === 'evening')   base = pv.precip === 0 ? 'Light evening fog.' : base;
      else                             base = pv.precip === 0 ? 'Light night fog.' : base;
    }
  }
  return base;
}

export function _tempBand(stage: any){
  if (stage <= 3) return 'cold';
  if (stage === 4) return 'cool';
  if (stage <= 6) return 'mild';
  if (stage <= 8) return 'warm';
  return 'hot';
}

function _flavorText(pv: any){
  var key  = _tempBand(pv.temp) + '|' + (pv.precip|0);
  var base = CONFIG_WEATHER_FLAVOR[key] || 'Conditions are unusual.';
  // Wind clause: woven contextually rather than appended as a bare label.
  // When precip is already heavy the wind is implicit; on clear/overcast days
  // the wind is the weather and deserves its own sentence.
  if (pv.wind >= 2){
    var isStorm = pv.wind >= 3;
    var hasHeavyPrecip = pv.precip >= 2;
    var windClause;
    if (hasHeavyPrecip){
      // Rain/snow already harsh — note wind escalates severity
      windClause = isStorm ? ' Storm-force winds.' : ' High winds.';
    } else {
      // Clear/overcast day — wind IS the story
      windClause = isStorm ? ' Storm-force winds make exposed travel dangerous.' : ' Strong winds throughout the day.';
    }
    base += windClause;
  }
  return base;
}

function _roughWeatherDescriptor(pv: any, cond: any){
  if (!pv) return 'Weather looks steady.';
  cond = cond || { precipType:'none', fog:'none' };

  if ((pv.wind|0) >= 3 || cond.precipType === 'blizzard' || cond.precipType === 'ice_storm' ||
      cond.precipType === 'deluge' || cond.precipType === 'heavy_rain'){
    return 'Storm conditions look likely.';
  }

  switch (cond.precipType){
    case 'snow':
    case 'snow_light':
      return 'Snow looks likely.';
    case 'sleet':
    case 'sleet_light':
      return 'Sleet looks likely.';
    case 'rain':
    case 'rain_light':
      return 'Rain looks likely.';
  }

  if (cond.fog === 'dense' || cond.fog === 'light') return 'Fog looks likely.';
  if ((pv.wind|0) === 2) return 'Looks breezy.';
  if ((pv.precip|0) >= 1) return 'Looks mostly cloudy.';
  if ((pv.temp|0) <= 1) return 'Looks clear and cold.';
  if ((pv.temp|0) >= 10) return 'Looks clear and hot.';
  return 'Looks like clear skies.';
}

function _weatherLowTodayHtml(rec: any, loc: any){
  var lines: any[] = [];
  for (var i = 0; i < WEATHER_LOW_TOD_PERIODS.length; i++){
    var period = WEATHER_LOW_TOD_PERIODS[i];
    var pv = (rec.periods && rec.periods[period]) || _weatherPrimaryValues(rec) || rec.final || {};
    var cond = _deriveConditions(pv, loc, period, rec.snowAccumulated, rec.fog && rec.fog[period]);
    lines.push(
      '<div style="margin-top:2px;">'+
      _weatherPeriodIcon(period)+' <b>'+esc(_weatherPeriodShortLabel(period))+':</b> '+
      esc(_roughWeatherDescriptor(pv, cond))+
      '</div>'
    );
  }
  return '<div style="font-size:.85em;margin-top:3px;">'+lines.join('')+'</div>';
}

function _weatherCommonDayHeadline(rec: any, dayOffset: any){
  var loc = rec.location || {};
  var pv = _weatherPrimaryValues(rec) || rec.final || {};
  var cond = _deriveConditions(pv, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
  var dayLabel = (dayOffset <= 0) ? 'Today'
    : (dayOffset === 1) ? 'Tomorrow'
    : (dayOffset === 2) ? 'The day after tomorrow'
    : '';
  return dayLabel ? (dayLabel + ': ' + _roughWeatherDescriptor(pv, cond)) : _roughWeatherDescriptor(pv, cond);
}

// ---------------------------------------------------------------------------
// 18k) HTML builders
// ---------------------------------------------------------------------------

export function _weatherTraitBadge(trait: any, stage: any){
  // Color scales chosen so that each trait has semantic meaning:
  //   Temp: deep blue (cold) → white (neutral) → deep red/orange (hot)
  //   Wind: near-white (calm) → dark blue-grey (storm force)
  //   Precip: pale sky (clear) → deep slate blue (torrential)
  var palettes: any = {
    temp: [
      '#7AA7D9','#9CC2E8','#B6D6F2','#D0E6FA','#E4F1FF',
      '#EEF6FF','#F5F5F0','#FFF3E0','#FFE2B6','#FFC98F','#FFB074'
    ],
    wind:  ['#F5F5F5','#E0E8E0','#B0BEC5','#546E7A'],
    precip:['#F0F8FF','#CFE8F5','#90CAF9','#1565C0']
  };
  var pal   = palettes[trait] || palettes.wind;
  var idx: any;
  if (trait === 'temp'){
    idx = Math.round(((_clampWeatherTempBand(stage) - WEATHER_TEMP_BAND_MIN) / (WEATHER_TEMP_BAND_MAX - WEATHER_TEMP_BAND_MIN)) * (pal.length - 1));
  } else {
    idx = Math.max(0, Math.min(stage, pal.length-1));
  }
  var bg    = pal[Math.max(0, Math.min(idx, pal.length-1))];
  var label = (trait === 'temp') ? _weatherTempLabel(stage) : ((CONFIG_WEATHER_LABELS[trait] || [])[stage] || String(stage));
  var tc    = textColor(bg);
  return '<span style="display:inline-block;padding:1px 5px;border-radius:3px;border:1px solid rgba(0,0,0,.2);background:'+esc(bg)+';color:'+esc(tc)+';font-size:.85em;">'+esc(label)+'</span>';
}

function _weatherDayGmHtml(rec: any, showBreakdown: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return '<div style="opacity:.6;">(no data)</div>';

  var tier = _uncertaintyTier(rec);
  var f    = rec.final;
  var tCfg = WEATHER_UNCERTAINTY[tier] || WEATHER_UNCERTAINTY.vague;

  var lines: any[] = [];

  if (rec.stale){
    lines.push('<div style="color:#E65100;font-size:.85em;">⚠ Stale — location changed. Reroll to update.</div>');
  }
  // Afternoon (peak) badges
  lines.push(
    '<div style="margin:3px 0;">'+
    _weatherTraitBadge('temp',   f.temp)+'&nbsp;'+
    _weatherTraitBadge('wind',   f.wind)+'&nbsp;'+
    _weatherTraitBadge('precip', f.precip)+
    '</div>'
  );
  lines.push('<div style="font-size:.8em;opacity:.7;">T:'+f.temp+' W:'+f.wind+' P:'+f.precip+'&nbsp;&nbsp;['+esc(tCfg.label)+']</div>');
  lines.push(_weatherInfluenceHtml(rec));

  // Full period breakdown — shown for today's view (showBreakdown) at certain tier.
  // Each period shows narrative, badges, crit flags, and derived mechanics.
  if (showBreakdown && (tier === 'certain' || showBreakdown === 'force')){
    var p    = rec.periods  || {};
    var rng  = rec.rng      || {};
    var rloc = rec.location || {};

    function critNote(delta: any){
      var crits: any[] = [];
      if (Math.abs(delta.temp)   === 2) crits.push('T');
      if (Math.abs(delta.wind)   === 2) crits.push('W');
      if (Math.abs(delta.precip) === 2) crits.push('P');
      return crits.length ? ' <span style="color:#C62828;font-size:.85em;">★'+crits.join(',')+'</span>' : '';
    }

    function periodBadges(pv: any){
      return _weatherTraitBadge('temp',pv.temp)+'&nbsp;'+
             _weatherTraitBadge('wind',pv.wind)+'&nbsp;'+
             _weatherTraitBadge('precip',pv.precip);
    }

    var baseStr  = 'Base T:'+rec.base.temp+' W:'+rec.base.wind+' P:'+rec.base.precip;
    var pNames   = WEATHER_DAY_PERIODS;

    var bLines = ['<div style="margin-top:4px;"><div style="font-size:.8em;opacity:.6;">'+esc(baseStr)+'</div>'];
    for (var pi=0; pi<pNames.length; pi++){
      var pname   = pNames[pi];
      var pv      = p[pname]   || {};
      var delta   = rng[pname] || {};
      var cond    = _deriveConditions(pv, rloc, pname, rec.snowAccumulated, rec.fog && rec.fog[pname]);
      var narr    = esc(_conditionsNarrative(pv, cond, pname));
      var mechHtml= _conditionsMechHtml(cond);
      bLines.push(
        '<div style="margin-top:3px;font-size:.85em;">'+
        _weatherPeriodIcon(pname)+' <b>'+esc(_weatherPeriodLabel(pname))+':</b> '+narr+critNote(delta)+'<br>'+
        '<span style="margin-left:10px;">'+periodBadges(pv)+'</span>'+
        (mechHtml ? '<div style="margin-left:10px;opacity:.9;">'+mechHtml+'</div>' : '')+
        '</div>'
      );
    }
    bLines.push('</div>');
    lines.push(bLines.join(''));
  }

  return lines.join('');
}

// ---------------------------------------------------------------------------
// Player forecast helpers
// ---------------------------------------------------------------------------

// Detail tier by day offset from today for medium-tier forecasting.
// Day 0 = high detail, days 1-2 = medium, days 3+ = low.
function _mediumDetailTier(dayOffset: any){
  if (dayOffset <= 0) return 'high';
  if (dayOffset <= 2) return 'medium';
  return 'low';
}

// Upgrade-only: never downgrade a previously revealed tier.
var _TIER_RANK: any = { high:3, medium:2, low:1 };
export function _bestTier(a: any, b: any){
  return (_TIER_RANK[a]||0) >= (_TIER_RANK[b]||0) ? a : b;
}

// Source labels for player-facing weather attribution.
export var WEATHER_SOURCE_LABELS: any = {
  common:   'Common Knowledge',
  low:      'Common Knowledge',
  medium:   'Skilled Forecast',
  high:     'Expert Forecast',
  specific: 'Divination Reveal'
};

export function _grantCommonWeatherReveals(ws: any, today: any){
  if (!ws) ws = getWeatherState();
  if (!isFinite(today)) today = todaySerial();
  _recordReveal(ws, today, 'low', 'common');
  if (_forecastRecord(today + 1)) _recordReveal(ws, today + 1, 'low', 'common');
  if (_forecastRecord(today + 2)) _recordReveal(ws, today + 2, 'low', 'common');
}

// Record a reveal for a serial. Only upgrades, never downgrades.
// source: 'common' | 'medium' | 'high'
export function _recordReveal(ws: any, serial: any, tier: any, source: any, loc?: any){
  var key = String(serial);
  var bucket = _weatherRevealBucket(ws, loc, true);
  var prev = bucket[key];
  var prevTier = (prev && typeof prev === 'object') ? prev.tier : (typeof prev === 'string' ? prev : 'low');
  var prevSource = (prev && typeof prev === 'object') ? prev.source : 'common';
  var newTier = _bestTier(prevTier, tier);
  // If tier upgraded, use new source; otherwise keep existing
  var newSource = (newTier !== prevTier) ? (source || 'common') : prevSource;
  var revealLoc = _normalizeWeatherLocation(loc || ws.location);
  bucket[key] = {
    tier: newTier,
    source: newSource,
    locationSig: revealLoc ? revealLoc.sig : '',
    locationLabel: revealLoc ? revealLoc.name : ''
  };
}

// Read a reveal entry, handling both old string format and new {tier,source} format.
function _readReveal(entry: any){
  if (!entry) return { tier: null, source: 'common' };
  if (typeof entry === 'string') return { tier: entry, source: 'common' };
  return {
    tier: entry.tier || null,
    source: entry.source || 'common',
    locationSig: entry.locationSig || '',
    locationLabel: entry.locationLabel || ''
  };
}

export function _weatherRevealForSerial(ws: any, serial: any, loc?: any){
  ws = ws || getWeatherState();
  var bucket = _weatherRevealBucket(ws, loc, false);
  return _readReveal(bucket[String(serial)]);
}

// Render one player-facing day block at the given detail tier.
export function _playerDayHtml(rec: any, detailTier: any, isToday: any, sourceLabel: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return '';
  var d        = fromSerial(rec.serial);
  var dateLabel: any;
  if (isToday && weekdayProgressionFor(ensureSettings().calendarSystem) !== 'month_reset'){
    dateLabel = esc(getCal().weekdays[getCal().current.day_of_the_week]) + ', ' + esc(_displayMonthDayParts(d.mi, d.day).label);
  } else {
    dateLabel = esc(_displayMonthDayParts(d.mi, d.day).label);
  }
  var f        = rec.final;
  var loc      = rec.location || {};
  var content  = '';
  var dayOffset = rec.serial - todaySerial();

  // Source attribution line
  var srcLine = sourceLabel
    ? '<div style="font-size:.75em;opacity:.45;font-style:italic;margin-top:1px;">'+esc(sourceLabel)+'</div>'
    : '';
  var influenceLine = _weatherInfluenceHtml(rec);

  if (detailTier === 'high'){
    // Afternoon summary + per-period narrative.
    // Mechanics only shown on Today — future days show conditions only.
    var todHtml = '';
    if (rec.periods){
      var p       = rec.periods;
      var pNames  = WEATHER_DAY_PERIODS;
      var pLines: any[]  = [];
      for (var pi=0; pi<pNames.length; pi++){
        var pname = pNames[pi];
        var pv    = p[pname] || {};
        var cond  = _deriveConditions(pv, loc, pname, rec.snowAccumulated, rec.fog && rec.fog[pname]);
        var narr  = esc(_conditionsNarrative(pv, cond, pname));
        var mhtml = isToday ? _conditionsMechHtml(cond) : '';
        pLines.push(
          '<div style="margin-top:2px;">'+
          _weatherPeriodIcon(pname)+' <b>'+esc(_weatherPeriodLabel(pname))+':</b> '+narr+
          (mhtml ? '<div style="margin-left:12px;">'+mhtml+'</div>' : '')+
          '</div>'
        );
      }
      todHtml = '<div style="font-size:.85em;margin-top:3px;">'+pLines.join('')+'</div>';
    }
    var dayCond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));

    // Current lighting — show on today only
    var nightHtml = '';
    if (isToday){
      moonEnsureSequences();
      var nl = nighttimeLightHtml(rec.serial);
      if (nl) nightHtml = '<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(0,0,0,.08);">' +
        '<b style="font-size:.85em;">Current light:</b>' + nl + '</div>';
    }

    content =
      '<div>'+esc(_conditionsNarrative(f, dayCond, WEATHER_PRIMARY_PERIOD))+'</div>'+
      todHtml+
      nightHtml;

  } else if (detailTier === 'medium'){
    // Single narrative — no mechanics on future days
    var mc = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    content = '<div>'+esc(_conditionsNarrative(f, mc, WEATHER_PRIMARY_PERIOD))+'</div>';

  } else {
    if (dayOffset <= 0){
      content = _weatherLowTodayHtml(rec, loc);
    } else {
      content = '<div style="opacity:.85;">'+esc(_weatherCommonDayHeadline(rec, dayOffset))+'</div>';
    }
  }

  return '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,.12);">'+
    '<div style="font-weight:bold;font-size:.9em;">'+dateLabel+(isToday ? ' (Today)' : '')+'</div>'+
    content+
    influenceLine+
    srcLine+
    '</div>';
}

// Build and send the player forecast to chat.
// method: 'medium' | 'high'. days: positive integer, capped at 10.
function sendPlayerForecast(m: any, method: any, days: any){
  var ws    = getWeatherState();
  var today = todaySerial();

  if (!ws.location){
    warnGM('No weather location set.');
    return;
  }

  // Clamp to max 10 days player-facing regardless of GM window
  days = Math.min(days, 10);

  var methodNorm = String(method || '').toLowerCase();

  var revealSource = methodNorm;
  var sourceLabel  = WEATHER_SOURCE_LABELS[revealSource] || revealSource;

  var blocks: any[]  = [];
  var revealed = 0;

  for (var i=0; i<days; i++){
    var ser    = today + i;
    var rec    = _forecastRecord(ser);
    if (!rec) continue;

    // Determine detail tier
    var tier = (methodNorm === 'high') ? 'high' : _mediumDetailTier(i);

    // Record the reveal (upgrade-only)
    _recordReveal(ws, ser, tier, revealSource, ws.location);

    blocks.push(_playerDayHtml(rec, tier, i === 0, sourceLabel));
    revealed++;
  }

  if (!revealed){
    warnGM('No weather records available for that range. Try generating the forecast first.');
    return;
  }

  var methodLabel = methodNorm === 'high' ? 'Expert Forecast' : 'Skilled Forecast';
  var dateObj     = fromSerial(today);
  var titleDate   = esc(_displayMonthDayParts(dateObj.mi, dateObj.day).label);
  var locLabel    = _weatherLocationLabel(ws.location);

  sendToAll(_menuBox(
    methodLabel+' — '+titleDate,
    '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Location: <b>'+esc(locLabel)+'</b></div>'+blocks.join('')
  ));

  warnGM('Sent '+revealed+'-day '+methodLabel.toLowerCase()+' to players.');
}

export function _parseWeatherRevealDayToken(tok: any){
  var raw = String(tok || '').trim();
  if (!raw) return null;
  var rangeMatch = raw.match(/^(.+?)\s*-\s*(.+)$/);
  if (rangeMatch){
    var a = Parse.ordinalDay(rangeMatch[1]);
    if (a == null && /^\d+$/.test(rangeMatch[1])) a = parseInt(rangeMatch[1], 10);
    var b = Parse.ordinalDay(rangeMatch[2]);
    if (b == null && /^\d+$/.test(rangeMatch[2])) b = parseInt(rangeMatch[2], 10);
    if (a == null || b == null) return null;
    return { start: a|0, end: b|0 };
  }
  var day = Parse.ordinalDay(raw);
  if (day == null && /^\d+$/.test(raw)) day = parseInt(raw, 10);
  if (day == null) return null;
  return { start: day|0, end: day|0 };
}

export function _parseWeatherRevealDateSpec(tokens: any){
  tokens = (tokens || []).map(function(tok: any){ return String(tok || '').trim(); }).filter(Boolean);
  if (!tokens.length) return null;

  var cal = getCal();
  var cur = cal.current;
  var months = cal.months;
  var idx = 0;
  var mi = -1;
  var year: any = null;
  var daySpec: any = null;

  var maybeMonth = monthIndexByName(tokens[idx]);
  if (maybeMonth !== -1){
    mi = maybeMonth;
    idx++;
  } else if (tokens.length >= 2 && /^\d+$/.test(tokens[idx])){
    var monthNum = parseInt(tokens[idx], 10);
    if (monthNum >= 1 && monthNum <= months.length){
      mi = monthNum - 1;
      idx++;
    }
  }

  daySpec = _parseWeatherRevealDayToken(tokens[idx]);
  if (!daySpec) return null;
  idx++;

  if (tokens[idx] && /^\d{1,6}$/.test(tokens[idx])){
    year = parseInt(tokens[idx], 10);
    idx++;
  }
  if (idx !== tokens.length) return null;

  if (mi === -1){
    var next = nextForDayOnly(cur, daySpec.start, months.length);
    mi = next.month;
    if (year == null) year = next.year;
  } else if (year == null){
    year = nextForMonthDay(cur, mi, daySpec.start).year;
  }

  var maxDay = Math.max(1, months[mi].days|0);
  var startDay = clamp(daySpec.start, 1, maxDay);
  var endDay = clamp(daySpec.end, 1, maxDay);
  if (startDay > endDay){
    var swap = startDay;
    startDay = endDay;
    endDay = swap;
  }

  return {
    year: year,
    mi: mi,
    startDay: startDay,
    endDay: endDay,
    startSerial: toSerial(year, mi, startDay),
    endSerial: toSerial(year, mi, endDay)
  };
}

function _specificWeatherRevealHtml(startSerial: any, endSerial: any, sourceLabel: any, locationLabel: any){
  var knownSerials: any = {};
  var blocks: any[] = [];
  var today = todaySerial();
  for (var ser = startSerial; ser <= endSerial; ser++){
    var rec = _forecastRecord(ser);
    if (!rec) continue;
    knownSerials[String(ser)] = 1;
    blocks.push(_playerDayHtml(rec, 'high', ser === today, sourceLabel));
  }
  var spanDays = Math.max(1, endSerial - startSerial + 1);
  var body = '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Location: <b>'+esc(locationLabel)+'</b></div>';
  body += _weatherForecastMiniCalHtml(startSerial, spanDays, { knownSerials: knownSerials });
  body += _legendLine(['Emoji = afternoon outlook', 'Blank cells are unrevealed days']);
  body += blocks.join('');
  return body;
}

function sendSpecificWeatherReveal(m: any, tokens: any){
  var ws = getWeatherState();
  var today = todaySerial();
  if (!ws.location){
    warnGM('No weather location set.');
    return;
  }

  var parsed = _parseWeatherRevealDateSpec(tokens);
  if (!parsed){
    warnGM('Usage: weather reveal <dateSpec> (examples: 14-17, 4 5-7, Rhaan 14, Hammer 5-7 1491)');
    return;
  }
  if (parsed.startSerial < today){
    warnGM('Specific-date weather reveals can only target today or future dates.');
    return;
  }
  if ((parsed.endSerial - today + 1) > CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS){
    warnGM('Specific-date reveals are capped at '+CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS+' days ahead.');
    return;
  }

  _generateForecast(today, Math.max(1, parsed.endSerial - today + 1), false);

  var sourceLabel = WEATHER_SOURCE_LABELS.specific;
  for (var ser = parsed.startSerial; ser <= parsed.endSerial; ser++){
    if (!_forecastRecord(ser)) continue;
    _recordReveal(ws, ser, 'high', 'specific', ws.location);
  }

  var title = 'Divination Reveal \u2014 ' + formatDateLabel(parsed.year, parsed.mi, parsed.startDay, true);
  if (parsed.endSerial > parsed.startSerial){
    title += ' to ' + formatDateLabel(parsed.year, parsed.mi, parsed.endDay, true);
  }
  sendToAll(_menuBox(title,
    _specificWeatherRevealHtml(parsed.startSerial, parsed.endSerial, sourceLabel, _weatherLocationLabel(ws.location))
  ));
  warnGM('Sent revealed weather for '+(parsed.endSerial - parsed.startSerial + 1)+' day(s) at the current location.');
}

function _playerForecastViewData(maxDays: any){
  var st    = ensureSettings();
  var ws    = getWeatherState();
  var today = todaySerial();
  var blocks: any[]  = [];
  var knownSerials: any = {};
  var displayMode = _normalizeDisplayMode(st.weatherDisplayMode);
  var verbose = _subsystemIsVerbose();
  var capDays = Math.max(1, parseInt(maxDays, 10) || CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);

  weatherEnsureForecast();
  _grantCommonWeatherReveals(ws, today);

  var bucket = _weatherRevealBucket(ws, ws.location, false);
  var maxKnown: any = null;
  Object.keys(bucket).forEach(function(key: any){
    var ser = parseInt(key, 10);
    if (!isFinite(ser) || ser < today) return;
    if (ser > today + capDays - 1) return;
    if (maxKnown == null || ser > maxKnown) maxKnown = ser;
  });
  if (maxKnown == null) return null;

  var spanDays = Math.max(1, maxKnown - today + 1);
  for (var i=0; i<spanDays; i++){
    var ser  = today + i;
    var rev  = _weatherRevealForSerial(ws, ser, ws.location);
    if (!rev.tier) continue;
    var rec  = _forecastRecord(ser);
    if (!rec) continue;
    var srcLabel = WEATHER_SOURCE_LABELS[rev.source] || null;
    blocks.push(_playerDayHtml(rec, rev.tier, i === 0, srcLabel));
    knownSerials[String(ser)] = 1;
  }

  if (!blocks.length) return null;

  var dateObj  = fromSerial(today);
  var titleDate = esc(_displayMonthDayParts(dateObj.mi, dateObj.day).label);
  var miniCal = _weatherForecastMiniCalHtml(today, spanDays, { knownSerials: knownSerials });
  var tRev = _weatherRevealForSerial(ws, today, ws.location);
  var todayTier = tRev.tier || 'low';
  var locationLabel = _weatherLocationLabel(ws.location);
  var body = '';
  if (displayMode !== 'list'){
    body += miniCal;
    body += _legendLine(['🌅 Early', '☀ Morning', '☁ Afternoon', '🌆 Evening', '🌙 Night', 'Emoji row = afternoon outlook']);
    body += '<div style="font-size:.78em;opacity:.6;margin:0 0 6px 0;">Only weather you currently know is marked.</div>';
  }
  if (displayMode !== 'calendar'){
    body += blocks.join('');
  }
  if (!body){
    body = '<div style="opacity:.7;">No weather display mode selected.</div>';
  }
  if (verbose){
    body += '<div style="font-size:.75em;opacity:.5;">Use <code>!cal weather</code> for today details.</div>';
  }
  return {
    today: today,
    todayTier: todayTier,
    titleDate: titleDate,
    locationLabel: locationLabel,
    summaryHtml: _weatherTodaySummaryHtml(today, todayTier, displayMode === 'calendar'),
    body: body
  };
}

// Build whispered player forecast from their stored reveal state.
function playerForecastWhisper(m: any){
  var view = _playerForecastViewData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!view){
    whisper(m.who, _menuBox('Weather Forecast', '<div style="opacity:.7;">No forecast has been shared with you yet.</div>'));
    return;
  }
  whisper(m.who, _menuBox('Your Weather Forecast \u2014 '+view.locationLabel,
    '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Date anchor: <b>'+view.titleDate+'</b></div>'+view.summaryHtml + view.body
  ));
}

function sendRevealedForecast(m: any){
  var view = _playerForecastViewData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!view){
    warnGM('No revealed weather is currently available to send.');
    return;
  }
  sendToAll(_menuBox('Weather Forecast \u2014 '+view.locationLabel,
    '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Date anchor: <b>'+view.titleDate+'</b></div>'+view.summaryHtml + view.body
  ));
  warnGM('Sent the currently revealed weather forecast to players.');
}

function weatherTodayGmHtml(){
  var st  = ensureSettings();
  var ws  = getWeatherState();
  var ser = todaySerial();
  var rec = _weatherRecordForDisplay(_forecastRecord(ser));

  var loc = ws.location;
  if (!loc){
    return _menuBox('Weather',
      '<div style="opacity:.7;">No location set.</div>'+
      '<div style="margin-top:4px;">'+button('Set Location','weather location')+'</div>'
    );
  }

  var locLine = '<div style="font-size:.85em;opacity:.75;">'+esc(_weatherLocationLabel(loc))+'</div>';
  var manifestEntries = _activeManifestZoneEntries();
  var manifestLine = manifestEntries.length
    ? '<div style="font-size:.82em;opacity:.7;margin-top:2px;">Manifest zones: <b>'+esc(_manifestZoneStatusLabel(manifestEntries))+'</b></div>'
    : '';
  var arythLine = _isArythFull(ser)
    ? '<div style="font-size:.8em;opacity:.65;margin-top:2px;">Aryth is full. Consider a manifest zone.</div>'
    : '';

  var body = rec
    ? _weatherDayGmHtml(rec, true)
    : '<div style="opacity:.6;">No weather generated for today.</div>';

  var topButtons =
    button('📣 Send Revealed','weather send')+' '+
    button('Forecast','weather forecast '+_weatherViewDays(st.weatherForecastViewDays))+' '+
    button('Reroll Today','weather reroll')+' '+
    button('Set Location','weather location')+' '+
    button('History','weather history');
  var zoneButtons = '<div style="margin-top:4px;">'+button('Set Manifest Zone','weather manifest')+'</div>';

  var mediumRow =
    '<div style="margin-top:4px;font-size:.85em;opacity:.8;">Reveal skilled forecast:</div>'+
    '<div>'+
    button('1 day', 'weather reveal medium 1')+' '+
    button('3 days','weather reveal medium 3')+' '+
    button('6 days','weather reveal medium 6')+' '+
    button('10 days','weather reveal medium 10')+
    '</div>';

  var highRow =
    '<div style="margin-top:2px;font-size:.85em;opacity:.8;">Reveal expert forecast:</div>'+
    '<div>'+
    button('1 day', 'weather reveal high 1')+' '+
    button('3 days','weather reveal high 3')+' '+
    button('6 days','weather reveal high 6')+' '+
    button('10 days','weather reveal high 10')+
    '</div>';
  var specificRow =
    '<div style="margin-top:2px;font-size:.85em;opacity:.8;">Reveal exact date(s):</div>'+
    '<div>'+button('Custom Range', 'weather reveal ?{Date or range|14-17}')+'</div>';

  var extremeHtml = rec ? _extremeEventPanelHtml(rec) : '';

  // Tidal info for coastal/island geographies
  var tidalLine = '';
  var geo = (loc.geography || 'inland').toLowerCase();
  if (geo === 'coastal' || geo === 'island' || geo === 'coastal_bluff'){
    try {
      var _tidx = getTidalIndex(todaySerial());
      tidalLine = '<div style="font-size:.82em;opacity:.75;margin-top:3px;">\uD83C\uDF0A Tides: <b>'+esc(tidalLabel(_tidx))+'</b> ('+_tidx+'/10)</div>';
    } catch(e){}
  }

  // Management dropdown
  var managementBtn =
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>'+
    '<div style="margin:4px 0;">' +
    button('Management','weather manage ?{Action|' +
      'Toggle Weather On/Off,toggleweather|' +
      'Toggle Mechanics,togglemechanics|' +
      'Reseed Weather,reseed|' +
      'History,history|' +
      'Reset Weather,reset|' +
      'Reroll Today,reroll|' +
      'Lock Day,lock ?\\{Day serial|' + ser + '\\}' +
      '}') +
    '</div>';

  return _menuBox("Today's Weather",
    locLine + manifestLine + arythLine + body +
    tidalLine +
    extremeHtml +
    '<div style="margin-top:6px;">'+ button('📣 Send Revealed','weather send') +'</div>'+
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>'+
    mediumRow + highRow + specificRow +
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>'+
    '<div style="margin:4px 0;">' + button('Set Location','weather location') + ' ' + button('Set Manifest Zone','weather manifest') + '</div>' +
    managementBtn
  );
}

function _weatherEmojiForRecord(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec || !rec.final) return '🌥️';
  var loc = rec.location || {};
  var cond = _deriveConditions(rec.final, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
  if (!cond || !cond.precipType) return '🌥️';
  if (cond.precipType === 'blizzard')    return '🌨️';
  if (cond.precipType === 'snow')        return '❄️';
  if (cond.precipType === 'snow_light')  return '🌤️';
  if (cond.precipType === 'ice_storm')   return '🧊';
  if (cond.precipType === 'sleet')       return '🧊';
  if (cond.precipType === 'sleet_light') return '🌤️';
  if (cond.precipType === 'deluge')      return '🌊';
  if (cond.precipType === 'heavy_rain')  return '⛈️';
  if (cond.precipType === 'rain')        return '🌧️';
  if (cond.precipType === 'rain_light')  return '🌦️';
  if ((rec.final.wind|0) >= 3)          return '💨';
  if (cond.precipType === 'none' && (rec.final.precip|0) >= 1) return '⛅';
  return '☀️';
}

function _weatherMiniCellTitle(serial: any){
  var rec = _weatherRecordForDisplay(_forecastRecord(serial));
  if (!rec || !rec.final) return null;
  var f = rec.final;
  var loc = rec.location || {};
  var cond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
  return _conditionsNarrative(f, cond, WEATHER_PRIMARY_PERIOD);
}

function _renderWeatherMonthStripWantedDays(year: any, mi: any, wantedSet: any, startSerial: any, endSerial: any){
  var parts = openMonthTable(mi, year);
  var html  = [parts.html];
  var wdCnt = weekLength()|0;
  var minD = _setMin(wantedSet), maxD = _setMax(wantedSet);
  if (minD == null || maxD == null){
    html.push('<tr><td colspan="'+wdCnt+'" style="'+STYLES.td+';opacity:.6;">(no forecast days)</td></tr>');
    html.push(closeMonthTable());
    return html.join('');
  }

  var firstRow = weekStartSerial(year, mi, minD);
  var lastRow  = weekStartSerial(year, mi, maxD);
  var today = todaySerial();

  for (var rowStart = firstRow; rowStart <= lastRow; rowStart += wdCnt){
    var dayRow = ['<tr>'];
    var wxRow  = ['<tr>'];
    for (var c = 0; c < wdCnt; c++){
      var ser = rowStart + c;
      var d = fromSerial(ser);
      var inForecast = (ser >= startSerial && ser <= endSerial);
      var inMonthWanted = (d.year === year && d.mi === mi && wantedSet[d.day]);
      var isToday = (ser === today);
      var dayStyle = STYLES.td;
      var numStyle = '';
      if (isToday) dayStyle += STYLES.today;
      if (!inForecast){
        dayStyle += 'opacity:.35;';
        numStyle = 'opacity:.55;';
      } else if (d.mi !== mi || d.year !== year){
        dayStyle += 'opacity:.55;';
        numStyle = 'opacity:.65;';
      }
      var dayTitle = inMonthWanted ? _weatherMiniCellTitle(ser) : null;
      var dayAttr = dayTitle ? ' title="'+esc(dayTitle)+'" aria-label="'+esc(dayTitle)+'"' : '';
      dayRow.push('<td'+dayAttr+' style="'+dayStyle+'"><div'+(numStyle ? ' style="'+numStyle+'"' : '')+'>'+d.day+'</div></td>');

      var wxStyle = STYLES.td + 'font-size:1.05em;line-height:1;';
      var wxText = '&nbsp;';
      var wxAttr = '';
      if (inMonthWanted){
        var rec = _forecastRecord(ser);
        wxText = _weatherEmojiForRecord(rec);
        var wxTitle = _weatherMiniCellTitle(ser);
        if (wxTitle) wxAttr = ' title="'+esc(wxTitle)+'" aria-label="'+esc(wxTitle)+'"';
      } else {
        wxStyle += 'opacity:.25;';
      }
      wxRow.push('<td'+wxAttr+' style="'+wxStyle+'">'+wxText+'</td>');
    }
    dayRow.push('</tr>');
    wxRow.push('</tr>');
    html.push(dayRow.join(''));
    html.push(wxRow.join(''));
    html.push('<tr><td colspan="'+wdCnt+'" style="height:2px;padding:0;border:none;"></td></tr>');
  }

  html.push(closeMonthTable());
  return html.join('');
}

function _weatherForecastMiniCalHtml(startSerial: any, days: any, opts?: any){
  opts = opts || {};
  var knownSerials = opts.knownSerials || null;
  var start = startSerial|0;
  var span = Math.max(1, days|0);
  var end = start + span - 1;
  var spec = { start:start, end:end, title:'Weather Outlook' };
  var months = _monthsFromRangeSpec(spec);
  var out = ['<div style="text-align:left;">'];

  for (var i = 0; i < months.length; i++){
    var m = months[i];
    var monthObj = getCal().months[m.mi] || {};
    var mdays = Math.max(1, monthObj.days|0);
    var monthStart = toSerial(m.y, m.mi, 1);
    var monthEnd = toSerial(m.y, m.mi, mdays);
    var segStart = Math.max(start, monthStart);
    var segEnd = Math.min(end, monthEnd);
    if (segEnd < segStart) continue;

    var wanted: any = {};
    for (var ser = segStart; ser <= segEnd; ser++){
      if (knownSerials && !knownSerials[String(ser)]) continue;
      var d = fromSerial(ser);
      if (d.year === m.y && d.mi === m.mi) wanted[d.day] = 1;
    }
    if (!_setCount(wanted)) continue;

    out.push('<div style="'+STYLES.wrap+'">'+
      _renderWeatherMonthStripWantedDays(m.y, m.mi, wanted, start, end)+
    '</div>');
  }

  out.push('</div>');
  return out.join('');
}

function _weatherTodaySummaryHtml(serial: any, detailTier: any, includeInfluence: any){
  var rec = _weatherRecordForDisplay(_forecastRecord(serial));
  if (!rec || !rec.final) return '';
  if (detailTier === 'low'){
    return '<div style="font-size:.82em;opacity:.72;margin:3px 0 6px 0;"><b>Today:</b></div>' +
      _weatherLowTodayHtml(rec, rec.location || {}) +
      (includeInfluence ? _weatherInfluenceHtml(rec) : '');
  }
  var txt = _conditionsNarrative(
    rec.final,
    _deriveConditions(rec.final, rec.location || {}, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec)),
    WEATHER_PRIMARY_PERIOD
  );
  return '<div style="font-size:.82em;opacity:.72;margin:3px 0 6px 0;"><b>Today:</b> '+esc(txt)+'</div>' +
    (includeInfluence ? _weatherInfluenceHtml(rec) : '');
}

function weatherForecastGmHtml(daysOverride?: any){
  var st    = ensureSettings();
  var today = todaySerial();
  var cal   = getCal();
  var rows: any[]  = [];
  var forecastDays = _weatherViewDays(daysOverride != null ? daysOverride : st.weatherForecastViewDays);
  st.weatherForecastViewDays = forecastDays;
  var weatherMiniCal = _weatherForecastMiniCalHtml(today, forecastDays);
  var displayMode = _normalizeDisplayMode(st.weatherDisplayMode);

  for (var i=0; i<forecastDays; i++){
    var ser = today + i;
    var rec = _weatherRecordForDisplay(_forecastRecord(ser));
    var d   = fromSerial(ser);
    var dayLabel = esc(_displayMonthDayParts(d.mi, d.day).label);

    if (!rec){
      rows.push('<tr>'+
        '<td style="'+STYLES.td+'">'+dayLabel+'</td>'+
        '<td style="'+STYLES.td+';opacity:.5;" colspan="2">Not generated</td>'+
        '</tr>');
      continue;
    }

    var f     = rec.final;
    var loc   = rec.location || {};
    var cond  = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    var badges = _weatherTraitBadge('temp',f.temp)+'&nbsp;'+_weatherTraitBadge('wind',f.wind)+'&nbsp;'+_weatherTraitBadge('precip',f.precip);
    var narr   = _conditionsNarrative(f, cond, WEATHER_PRIMARY_PERIOD);
    var influenceText = _weatherInfluenceTexts(rec);
    var influenceHtml = influenceText.length
      ? '<div style="font-size:.74em;opacity:.55;margin-top:2px;">'+esc(influenceText.join(' · '))+'</div>'
      : '';
    var staleFlag   = rec.stale ? ' ⚠' : '';
    var extremeFlag = _evaluateExtremeEvents(rec).length > 0
      ? ' <span style="color:#B71C1C;font-weight:bold;" title="Extreme event conditions present">⚡</span>' : '';

    // Today gets full detail; future days get compact
    if (i === 0){
      rows.push('<tr style="font-weight:bold;">'+
        '<td style="'+STYLES.td+'">'+dayLabel+' (today)</td>'+
        '<td style="'+STYLES.td+'">'+badges+extremeFlag+'</td>'+
        '<td style="'+STYLES.td+';font-size:.82em;">'+esc(narr)+staleFlag+influenceHtml+'</td>'+
        '</tr>');
    } else {
      rows.push('<tr>'+
        '<td style="'+STYLES.td+'">'+dayLabel+'</td>'+
        '<td style="'+STYLES.td+'">'+badges+extremeFlag+'</td>'+
        '<td style="'+STYLES.td+';font-size:.82em;opacity:.7;">'+esc(narr)+staleFlag+influenceHtml+'</td>'+
        '</tr>');
    }
  }

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Date</th>'+
    '<th style="'+STYLES.th+'">Conditions</th>'+
    '<th style="'+STYLES.th+'">Outlook</th>'+
    '</tr>';

  var topControls = '<div style="margin:3px 0 6px 0;">'+
    button('10d','weather forecast 10')+' '+
    button('20d','weather forecast 20')+' '+
    button('View: '+_displayModeLabel(displayMode),'settings mode weather '+_nextDisplayMode(displayMode))+
    '</div>';
  var body = '';
  if (displayMode !== 'list'){
    body += weatherMiniCal;
    body += _legendLine(['Emoji = afternoon outlook', 'Hover for details']);
  }
  if (displayMode !== 'calendar'){
    body += '<table style="'+STYLES.table+'">'+head+rows.join('')+'</table>';
  }
  if (!body){
    body = '<div style="opacity:.7;">No weather display mode selected.</div>';
  }

  return _menuBox(forecastDays+'-Day Forecast',
    topControls+
    _weatherTodaySummaryHtml(today, null, displayMode === 'calendar')+
    body+
    '<div style="margin-top:6px;">'+
    (st.weatherMechanicsEnabled !== false ? button('📋 Today\'s Mechanics','weather mechanics')+' ' : '')+
    button('Reroll Today','weather reroll '+today)+' '+
    button('Regenerate All','weather generate')+' '+
    button('⬅ Back','weather')+
    '</div>'
  );
}

function weatherHistoryGmHtml(){
  var ws  = getWeatherState();
  var cal = getCal();

  if (!ws.history || !ws.history.length){
    return _menuBox('Weather History','<div style="opacity:.7;">No history yet.</div>'+'<div style="margin-top:4px;">'+button('⬅ Back','weather')+'</div>');
  }

  var rows = ws.history.slice().reverse().slice(0,20).map(function(rec: any){
    var d     = fromSerial(rec.serial);
    var label = esc(_displayMonthDayParts(d.mi, d.day).label);
    var f     = rec.final;
    var loc   = rec.location || {};
    var badges= _weatherTraitBadge('temp',f.temp)+'&nbsp;'+_weatherTraitBadge('wind',f.wind)+'&nbsp;'+_weatherTraitBadge('precip',f.precip);
    var hCond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    var hNarr = esc(_conditionsNarrative(f, hCond, WEATHER_PRIMARY_PERIOD));
    return '<tr>'+
      '<td style="'+STYLES.td+'">'+label+'</td>'+
      '<td style="'+STYLES.td+'">'+badges+'</td>'+
      '<td style="'+STYLES.td+';font-size:.85em;opacity:.85;">'+hNarr+'</td>'+
      '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Date</th>'+
    '<th style="'+STYLES.th+'">Conditions</th>'+
    '<th style="'+STYLES.th+'">Summary</th>'+
    '</tr>';

  return _menuBox('Weather History (last 20)',
    '<table style="'+STYLES.table+'">'+head+rows.join('')+'</table>'+
    '<div style="margin-top:6px;">'+button('⬅ Back','weather')+'</div>'
  );
}

// Location wizard — multi-step button flow stored as pending state
function _getWeatherWizard(){
  var ws = getWeatherState();
  if (!ws._wizard) ws._wizard = {};
  return ws._wizard;
}

export function weatherLocationWizardHtml(step: any, partial?: any, opts?: any){
  partial = partial || {};
  opts = opts || {};
  var commandPrefix = String(opts.commandPrefix || 'weather location');
  var titlePrefix = String(opts.titlePrefix || 'Set Location');
  var laterCommand = String(opts.laterCommand || '');
  var allowSaveCurrent = opts.allowSaveCurrent !== false;

  // Step 1: Climate
  if (!step || step === 'start'){
    var wsRecent = getWeatherState();
    var currentHtml = '';
    if (allowSaveCurrent && wsRecent.location){
      currentHtml =
        '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Current location: <b>' +
        esc(_weatherLocationLabel(wsRecent.location)) +
        '</b></div>' +
        '<div style="margin:0 0 8px 0;">' +
        button('Save Current Location As...', commandPrefix + ' save ?{Preset name}') +
        '</div>' +
        '<div style="border-top:1px solid rgba(0,0,0,.1);margin:8px 0 6px 0;"></div>';
    }
    var presetHtml = '';
    if (wsRecent.savedLocations && wsRecent.savedLocations.length){
      presetHtml =
        '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Saved locations:</div>' +
        wsRecent.savedLocations.map(function(loc: any, idx: any){
          return '<div style="margin:3px 0;">'+
            button(loc.name || _weatherLocationLabel(loc), commandPrefix + ' preset ' + (idx + 1))+
            ' <span style="opacity:.7;font-size:.85em;">'+esc(_weatherLocationLabel(loc))+'</span>'+
            '</div>';
        }).join('') +
        '<div style="border-top:1px solid rgba(0,0,0,.1);margin:8px 0 6px 0;"></div>';
    }
    var recentHtml = '';
    if (wsRecent.recentLocations && wsRecent.recentLocations.length){
      recentHtml =
        '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Recent locations:</div>' +
        wsRecent.recentLocations.map(function(loc: any, idx: any){
          return '<div style="margin:3px 0;">'+
            button(loc.name || _weatherLocationLabel(loc), commandPrefix + ' recent ' + (idx + 1))+
            ' <span style="opacity:.7;font-size:.85em;">Quick switch</span>'+
            '</div>';
        }).join('') +
        '<div style="border-top:1px solid rgba(0,0,0,.1);margin:8px 0 6px 0;"></div>';
    }
    var climateButtons = Object.keys(WEATHER_CLIMATES).map(function(k: any){
      return '<div style="margin:3px 0;">'+
        button(titleCase(k), commandPrefix + ' climate ' + k)+
        ' <span style="opacity:.7;font-size:.85em;">'+esc(WEATHER_CLIMATES[k])+'</span>'+
        '</div>';
    }).join('');
    if (laterCommand){
      climateButtons += '<div style="margin:6px 0 4px 0;">' + button('Set later', laterCommand) + '</div>';
    }
    var st2 = ensureSettings();
    var sv2  = st2.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
    var hem2 = st2.hemisphere    || CONFIG_DEFAULTS.hemisphere;
    var _hemAware = SEASON_SETS[sv2] && SEASON_SETS[sv2].hemisphereAware;
    var hemHint = _hemAware
      ? (hem2 === 'north'
          ? '<div style="font-size:.8em;opacity:.45;margin-top:8px;font-style:italic;">Southern hemisphere campaign? › !cal hemisphere south</div>'
          : '<div style="font-size:.8em;opacity:.45;margin-top:8px;font-style:italic;">Northern hemisphere campaign? › !cal hemisphere north</div>')
      : '';
    return _menuBox(titlePrefix + ' - Step 1: Climate', currentHtml + presetHtml + recentHtml + climateButtons + hemHint);
  }

  // Step 2: Geography
  if (step === 'geography'){
    var geoButtons = Object.keys(WEATHER_GEOGRAPHIES).map(function(k: any){
      var label = titleCase(k.replace(/_/g,' '));
      return '<div style="margin:3px 0;">'+
        button(label, commandPrefix + ' geography ' + k)+
        ' <span style="opacity:.7;font-size:.85em;">'+esc(WEATHER_GEOGRAPHIES[k])+'</span>'+
        '</div>';
    }).join('');
    return _menuBox(
      titlePrefix + ' - Step 2: Geography (Climate: '+esc(titleCase(partial.climate||'?'))+')',
      geoButtons
    );
  }

  // Step 3: Terrain
  if (step === 'terrain'){
    var terrainButtons = Object.keys(WEATHER_TERRAINS_UI).map(function(k: any){
      var label = titleCase(k.replace(/_/g,' '));
      return '<div style="margin:3px 0;">'+
        button(label, commandPrefix + ' terrain ' + k)+
        ' <span style="opacity:.7;font-size:.85em;">'+esc(WEATHER_TERRAINS_UI[k])+'</span>'+
        '</div>';
    }).join('');
    var ctx = esc(titleCase(partial.climate||'?'))+' / '+esc(titleCase((partial.geography||'inland').replace(/_/g,' ')));
    return _menuBox(titlePrefix + ' - Step 3: Terrain ('+ctx+')',
      '<div style="opacity:.8;margin-bottom:6px;">Selecting a terrain finalizes the location. Manifest zones are managed separately.</div>'+
      terrainButtons
    );
  }

  // Backward-compat alias: manifest zones are now managed separately.
  if (step === 'zone'){
    return _menuBox('Manifest Zones',
      '<div style="opacity:.8;margin-bottom:6px;">Manifest zones are now independent of the location wizard.</div>'+
      '<div>'+button('Open Manifest Zones','weather manifest')+'</div>'
    );
  }

  return '';
}

function _clearManifestZones(){
  var ws = getWeatherState();
  var removed = _activeManifestZoneEntries();
  ws.manifestZones = {};
  return removed;
}

function _setWeatherLocationFromWizard(m: any, partial: any){
  var newLoc = _normalizeWeatherLocation({
    climate:   partial.climate   || 'temperate',
    geography: partial.geography || 'inland',
    terrain:   partial.terrain   || 'open'
  });

  var ws = getWeatherState();
  var oldLoc = ws.location || null;
  var oldSig = oldLoc ? _locSig(oldLoc) : '';
  var locationChanged = !!oldLoc && oldSig !== newLoc.sig;
  var clearedZones = locationChanged ? _clearManifestZones() : [];
  var hadLocation = !!oldLoc;

  ws.location = newLoc;
  _rememberRecentWeatherLocation(ws, newLoc);
  delete ws._wizard;

  var today = todaySerial();
  var resurrected = 0, staled = 0;
  ws.forecast.forEach(function(rec: any){
    if (rec.locked || rec.serial < today) return;
    var recSig = rec.location ? _locSig(rec.location) : '';
    if (recSig === newLoc.sig){
      rec.stale = false;
      resurrected++;
    } else {
      rec.stale = true;
      staled++;
    }
  });

  var msg = 'Location set: <b>'+esc(newLoc.name || _weatherLocationLabel(newLoc))+'</b>.';

  if (clearedZones.length){
    msg += '<br><span style="color:#E65100;">Cleared manifest zones: ' +
      esc(clearedZones.map(function(entry: any){ return entry.def.name; }).join(', ')) +
      '.</span>';
  }

  if (hadLocation){
    if (resurrected > 0 && staled === 0){
      msg += '<br><span style="color:#2E7D32;">Forecast restored from matching records.</span>';
    } else if (resurrected > 0){
      msg += '<br><span style="color:#1565C0;">'+resurrected+' day(s) restored; '+staled+' stale.</span>';
    } else {
      msg += '<br><span style="color:#E65100;">Future forecast marked stale. Regenerate to update.</span>';
    }
  }

  whisperUi(m.who,
    _menuBox('Location Set', msg)+
    '<div style="margin-top:4px;">'+
    button('Regenerate Forecast','weather generate')+' '+
    button('View Forecast','weather forecast')+
    '</div>'
  );
}

function manifestZoneChooserHtml(){
  var ws = getWeatherState();
  var loc = ws.location;
  if (!loc){
    return _menuBox('Manifest Zones',
      '<div style="opacity:.7;">Set a weather location first. Manifest zones are local overlays and clear when the location changes.</div>'+
      '<div style="margin-top:6px;">'+button('Set Location','weather location')+'</div>'
    );
  }

  var entries = _activeManifestZoneEntries();
  var active: any = {};
  for (var i = 0; i < entries.length; i++) active[entries[i].key] = 1;
  var noneActive = !entries.length;
  var rows: any[] = [];

  function nameCell(label: any, detail: any, isActive: any){
    var nameStyle = isActive ? 'font-weight:bold;' : 'opacity:.6;font-style:italic;';
    return '<div style="'+nameStyle+'">'+esc(label)+'</div>' +
      (detail ? '<div style="font-size:.78em;opacity:.65;margin-top:2px;">'+esc(detail)+'</div>' : '');
  }

  rows.push('<tr>'+
    '<td style="'+STYLES.td+'">'+nameCell('None', 'Clear all active manifest zones', noneActive)+'</td>'+
    '<td style="'+STYLES.td+';text-align:center;">'+button(noneActive ? 'On' : 'Off', 'weather manifest none')+'</td>'+
    '</tr>');

  for (var mi = 0; mi < MANIFEST_ZONE_ORDER.length; mi++){
    var key = MANIFEST_ZONE_ORDER[mi];
    var def = MANIFEST_ZONE_DEFS[key];
    var isActive = !!active[key];
    rows.push('<tr>'+
      '<td style="'+STYLES.td+'">'+
        nameCell((def.emoji || '◇') + ' ' + def.name, def.summary + ' · ' + (def.effectLabel || 'no weather shift'), isActive)+
      '</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+button(isActive ? 'On' : 'Off', 'weather manifest toggle '+key)+'</td>'+
      '</tr>');
  }

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Zone</th>'+
    '<th style="'+STYLES.th+'">Toggle</th>'+
    '</tr>';

  var locLine = '<div style="font-size:.82em;opacity:.75;margin-bottom:4px;">Current location: <b>'+
    esc(titleCase(loc.climate))+' / '+esc(titleCase(loc.geography.replace(/_/g,' ')))+' / '+esc(titleCase(loc.terrain))+
    '</b></div>';
  var activeLine = '<div style="font-size:.82em;opacity:.7;margin-bottom:6px;">Active: <b>'+esc(_manifestZoneStatusLabel(entries))+'</b></div>';
  var arythLine = _isArythFull(todaySerial())
    ? '<div style="font-size:.8em;opacity:.7;margin-bottom:6px;">Aryth is full. Consider a manifest zone.</div>'
    : '';

  return _menuBox('Manifest Zones',
    locLine +
    activeLine +
    arythLine +
    '<div style="font-size:.8em;opacity:.6;margin-bottom:6px;">Manifest zones affect today\'s weather only; forecast rows stay tied to the base location profile.</div>'+
    '<table style="'+STYLES.table+'">'+head+rows.join('')+'</table>'+
    '<div style="margin-top:6px;">'+button('⬅ Back','weather')+'</div>'
  );
}

function _toggleManifestZoneForGm(m: any, zoneKey: any){
  var ws = getWeatherState();
  if (!ws.location){
    whisper(m.who, 'Set a weather location first: ' + button('Set Location', 'weather location'));
    return;
  }

  if (zoneKey === 'none' || zoneKey === 'clear'){
    var removed = _clearManifestZones();
    if (!removed.length){
      whisper(m.who, 'No manifest zones are active.');
      return;
    }
    whisper(m.who, 'Cleared manifest zones: <b>'+esc(removed.map(function(entry: any){ return entry.def.name; }).join(', '))+'</b>.');
    return;
  }

  var key = _manifestZoneKey(zoneKey);
  var def = key ? MANIFEST_ZONE_DEFS[key] : null;
  if (!def){
    whisper(m.who, 'Unknown manifest zone.');
    return;
  }

  if (ws.manifestZones[key]){
    delete ws.manifestZones[key];
    whisper(m.who,
      'Manifest zone deactivated: <b>'+esc(def.name)+'</b>. ' +
      'Active: <b>'+esc(_manifestZoneStatusLabel())+'</b>.'
    );
    return;
  }

  var arythFull = _isArythFull(todaySerial());
  ws.manifestZones[key] = {
    key: key,
    setOn: todaySerial(),
    arythFullActivated: arythFull,
    arythFullExitWarned: false
  };
  whisper(m.who,
    'Manifest zone activated: <b>'+esc(def.name)+'</b>. ' +
    'Active: <b>'+esc(_manifestZoneStatusLabel())+'</b>.' +
    (arythFull ? ' <span style="opacity:.75;">Tracked for Aryth full.</span>' : '')
  );
}

export function handleWeatherCommand(m, args){
  // args[0] = 'weather', args[1] = subcommand
  var sub = String(args[1]||'').toLowerCase();

  // If weather is disabled, non-GMs get a polite message; GMs can still configure.
  if (ensureSettings().weatherEnabled === false && !playerIsGM(m.playerid)){
    whisper(cleanWho(m.who), _menuBox("Weather", '<div style="opacity:.7;">Weather system is not active.</div>'));
    return;
  }

  if (!playerIsGM(m.playerid)){
    if (sub === 'forecast'){
      playerForecastWhisper(m);
    } else {
      var ws0   = getWeatherState();
      var tSer  = todaySerial();
      weatherEnsureForecast();
      _grantCommonWeatherReveals(ws0, tSer);
      var rec0  = _forecastRecord(tSer);
      var rev0  = _weatherRevealForSerial(ws0, tSer, ws0.location);
      var tier0 = rev0.tier || 'low';
      var src0  = WEATHER_SOURCE_LABELS[rev0.source] || null;
      if (!rec0){
        whisper(m.who, _menuBox("Today's Weather", '<div style="opacity:.7;">Conditions not available.</div>'));
      } else {
        whisper(m.who, _menuBox("Today's Weather",
          _playerDayHtml(rec0, tier0, true, src0)+
          '<div style="margin-top:4px;">'+button('Full Forecast','weather forecast')+'</div>'
        ));
      }
    }
    return;
  }

  switch(sub){
    case '':
    case 'today':
      weatherEnsureForecast();
      whisper(m.who, weatherTodayGmHtml());
      break;

    case 'forecast':
      var viewTok = String(args[2] || '').trim();
      if (viewTok){
        var viewDays = parseInt(viewTok, 10);
        if (!/^\d+$/.test(viewTok) || viewDays < 1 || viewDays > CONFIG_WEATHER_FORECAST_DAYS){
          warnGM('Usage: weather forecast [1-'+CONFIG_WEATHER_FORECAST_DAYS+']');
          break;
        }
        ensureSettings().weatherForecastViewDays = _weatherViewDays(viewDays);
      }
      weatherEnsureForecast();
      whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
      break;

    case 'history':
      whisper(m.who, weatherHistoryGmHtml());
      break;

    case 'manifest': {
      var manifestSub = String(args[2] || '').toLowerCase();
      if (!manifestSub){
        whisper(m.who, manifestZoneChooserHtml());
        break;
      }
      if (manifestSub === 'toggle'){
        _toggleManifestZoneForGm(m, String(args[3] || ''));
        break;
      }
      _toggleManifestZoneForGm(m, manifestSub);
      break;
    }

    case 'mechanics':
      weatherEnsureForecast();
      whisper(m.who, weatherTodayMechanicsHtml());
      break;

    case 'send': {
      if (!args[2]){
        sendRevealedForecast(m);
        whisper(m.who, weatherTodayGmHtml());
        break;
      }
      warnGM('Usage: weather send');
      whisper(m.who, weatherTodayGmHtml());
      break;
    }

    case 'reveal': {
      var revealMethod = String(args[2]||'').toLowerCase();
      if (revealMethod === 'medium' || revealMethod === 'high'){
        var revealDays = parseInt(args[3], 10) || 1;
        if (revealDays < 1 || revealDays > 10){
          warnGM('Usage: weather reveal medium|high [1-10]');
          break;
        }
        sendPlayerForecast(m, revealMethod, revealDays);
      } else {
        sendSpecificWeatherReveal(m, args.slice(2));
      }
      whisper(m.who, weatherTodayGmHtml());
      break;
    }

    case 'event': {
      var evtSub = String(args[2]||'').toLowerCase();
      var evtKey = String(args[3]||'').toLowerCase();
      var evtRec = _forecastRecord(todaySerial());
      if (!evtRec || !evtRec.final){
        warnGM('No weather record for today. Generate weather first.');
        break;
      }
      if (!EXTREME_EVENTS[evtKey]){
        warnGM('Unknown event key: '+evtKey);
        break;
      }
      if (evtSub === 'trigger'){
        var trigHtml = _extremeEventDetailsHtml(evtKey, evtRec);
        whisper(m.who, _menuBox('Extreme Event',
          '<div><b>⚡ '+esc(EXTREME_EVENTS[evtKey].name)+'</b> triggered for GM reference.</div>'+
          '<div style="opacity:.8;margin-top:3px;">No message was sent to players.</div>'+
          '<div style="margin-top:5px;">'+trigHtml+'</div>'+
          '<div style="margin-top:5px;">'+
            button('Back to Weather','weather')+' '+
            button('Forecast','weather forecast')+
          '</div>'
        ));
      } else if (evtSub === 'roll'){
        var fired = _rollExtremeEvent(evtKey, evtRec);
        if (fired){
          var fireHtml = _extremeEventDetailsHtml(evtKey, evtRec);
          whisper(m.who, _menuBox('Extreme Event Roll',
            '<div><b>🎲 Result:</b> '+esc(EXTREME_EVENTS[evtKey].name)+' fires (GM advisory only).</div>'+
            '<div style="opacity:.8;margin-top:3px;">No message was sent to players.</div>'+
            '<div style="margin-top:5px;">'+fireHtml+'</div>'+
            '<div style="margin-top:5px;">'+
              button('Back to Weather','weather')+' '+
              button('Forecast','weather forecast')+
            '</div>'
          ));
        } else {
          whisper(m.who, _menuBox('Extreme Event Roll',
            '<div><b>🎲 Result:</b> conditions were not quite right. No event this time.</div>'+
            '<div style="margin-top:5px;">'+
              button('Back to Weather','weather')+' '+
              button('Forecast','weather forecast')+
            '</div>'
          ));
        }
      } else {
        warnGM('Usage: weather event trigger <key>  or  weather event roll <key>');
      }
      break;
    }

    case 'generate':
      var n = CONFIG_WEATHER_FORECAST_DAYS;
      if (args[2]){
        var nTok = String(args[2] || '').trim();
        var parsedDays = parseInt(nTok, 10);
        if (!/^\d+$/.test(nTok) || parsedDays < 1 || parsedDays > CONFIG_WEATHER_FORECAST_DAYS){
          warnGM('Usage: weather generate [1-'+CONFIG_WEATHER_FORECAST_DAYS+']');
          break;
        }
        n = parsedDays;
      }
      var cnt = _generateForecast(todaySerial(), n, true);
      whisper(m.who, 'Generated '+cnt+' day'+(cnt===1?'':'s')+' of weather.');
      whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
      break;

    case 'reroll': {
      var ws2 = getWeatherState();
      var todayNow = todaySerial();
      var targetSer = parseInt(args[2],10);
      if (!isFinite(targetSer)) targetSer = todayNow;
      if (targetSer < todayNow){
        warnGM('That day is already in the past. Cannot reroll archived weather.');
        break;
      }
      var existing = _forecastRecord(targetSer);
      if (existing && existing.locked){
        warnGM('That day is locked. Cannot reroll.');
        break;
      }
      var prevRec = _forecastRecord(targetSer - 1) || _historyRecord(targetSer - 1);
      var newRec = _generateDayWeather(targetSer, prevRec, ws2.location || null);
      if (newRec){
        var idx2 = _forecastIndex(targetSer);
        if (idx2 >= 0) ws2.forecast[idx2] = newRec;
        else ws2.forecast.push(newRec);
        ws2.forecast.sort(function(a,b){ return a.serial - b.serial; });
        var nextRec2 = _forecastRecord(targetSer + 1);
        if (nextRec2 && !nextRec2.locked){
          var regenNext = _generateDayWeather(targetSer + 1, newRec, ws2.location || null);
          if (regenNext){
            var nextIdx2 = _forecastIndex(targetSer + 1);
            if (nextIdx2 >= 0) ws2.forecast[nextIdx2] = regenNext;
          }
        }
      }
      whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
      break;
    }

    case 'lock': {
      var lockSer = parseInt(args[2],10);
      if (!isFinite(lockSer)) lockSer = todaySerial();
      var lockRec = _forecastRecord(lockSer);
      if (!lockRec){ warnGM('No weather record for that day.'); break; }
      lockRec.locked = true;
      lockRec.generatedAt = todaySerial();
      warnGM('Forecast for day '+lockSer+' locked.');
      whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
      break;
    }

    case 'reseed': {
      var wsReseed = getWeatherState();
      wsReseed.forecast = [];
      wsReseed.history = [];
      weatherEnsureForecast();
      warnGM('Weather reseeded. Forecast and history cleared, new forecast generated.');
      whisper(m.who, weatherTodayGmHtml());
      break;
    }

    case 'reset': {
      var wsReset = getWeatherState();
      // Preserve revealed forecast levels for known dates at current location
      var preservedReveal = wsReset.playerReveal;
      wsReset.forecast = [];
      wsReset.history = [];
      wsReset.playerReveal = preservedReveal;
      weatherEnsureForecast();
      warnGM('Weather reset. Forecast regenerated for current location. Player reveal tags preserved.');
      whisper(m.who, weatherTodayGmHtml());
      break;
    }

    case 'manage': {
      var manageAction = String(args[2]||'').toLowerCase();
      if (!manageAction){
        warnGM('Management: use the dropdown to select an action.');
        break;
      }
      if (manageAction === 'toggleweather'){
        ensureSettings().weatherEnabled = (ensureSettings().weatherEnabled === false);
        whisper(m.who, weatherTodayGmHtml());
        break;
      }
      if (manageAction === 'togglemechanics'){
        ensureSettings().weatherMechanicsEnabled = (ensureSettings().weatherMechanicsEnabled === false);
        whisper(m.who, weatherTodayGmHtml());
        break;
      }
      return handleWeatherCommand(m, ['weather', manageAction].concat(args.slice(3)));
    }

    case 'location': {
      var locSub = String(args[2]||'').toLowerCase();
      if (!locSub){
        getWeatherState()._wizard = {};
        whisperUi(m.who, weatherLocationWizardHtml('start'));
        break;
      }
      if (locSub === 'climate'){
        var climate = String(args[3]||'').toLowerCase();
        if (!WEATHER_CLIMATE_BASE[climate]){
          whisperUi(m.who, 'Unknown climate. '+button('Back','weather location'));
          break;
        }
        var _svNow = ensureSettings().seasonVariant || CONFIG_DEFAULTS.seasonVariant;
        if (climate === 'tropical' && _svNow !== 'tropical'){
          whisperUi(m.who,
            '<div style="font-size:.85em;opacity:.6;font-style:italic;margin-bottom:4px;">' +
            'Tropical climate — consider: ' +
            button('Tropical seasons','seasons tropical')+
            '</div>'
          );
        }
        getWeatherState()._wizard = { climate: climate };
        whisperUi(m.who, weatherLocationWizardHtml('geography', { climate: climate }));
        break;
      }
      if (locSub === 'geography'){
        var geography = String(args[3]||'').toLowerCase();
        if (!WEATHER_GEO_MOD[geography]){
          whisperUi(m.who, 'Unknown geography. '+button('Back','weather location'));
          break;
        }
        var wiz = _getWeatherWizard();
        wiz.geography = geography;
        whisperUi(m.who, weatherLocationWizardHtml('terrain', wiz));
        break;
      }
      if (locSub === 'terrain'){
        var terrain = String(args[3]||'').toLowerCase();
        if (!WEATHER_TERRAIN_MOD[terrain]){
          whisperUi(m.who, 'Unknown terrain. '+button('Back','weather location'));
          break;
        }
        var wiz2 = _getWeatherWizard();
        wiz2.terrain = terrain;
        _setWeatherLocationFromWizard(m, wiz2);
        break;
      }
      if (locSub === 'recent'){
        var recentIdx = Math.max(1, parseInt(args[3], 10) || 1) - 1;
        var recentList = getWeatherState().recentLocations || [];
        if (!recentList[recentIdx]){
          whisperUi(m.who, 'That recent location is no longer available. '+button('Back','weather location'));
          break;
        }
        _setWeatherLocationFromWizard(m, recentList[recentIdx]);
        break;
      }
      if (locSub === 'preset'){
        var presetIdx = Math.max(1, parseInt(args[3], 10) || 1) - 1;
        var savedList = getWeatherState().savedLocations || [];
        if (!savedList[presetIdx]){
          whisperUi(m.who, 'That saved location is no longer available. '+button('Back','weather location'));
          break;
        }
        _setWeatherLocationFromWizard(m, savedList[presetIdx]);
        break;
      }
      if (locSub === 'save'){
        var presetName = _normalizeWeatherPresetName(args.slice(3).join(' '));
        var wsSave = getWeatherState();
        if (!wsSave.location){
          whisperUi(m.who, 'Set a weather location first. '+button('Back','weather location'));
          break;
        }
        if (!presetName){
          whisperUi(m.who, 'Enter a preset name first. '+button('Back','weather location'));
          break;
        }
        var saved = _saveWeatherLocationPreset(wsSave, wsSave.location, presetName);
        if (!saved){
          whisperUi(m.who, 'Could not save that preset. '+button('Back','weather location'));
          break;
        }
        whisperUi(m.who,
          _menuBox(saved.updated ? 'Saved Location Updated' : 'Saved Location Added',
            '<div><b>'+esc(saved.preset.name)+'</b> now points to <b>'+esc(_weatherLocationLabel(saved.preset))+'</b>.</div>'
          ) +
          weatherLocationWizardHtml('start')
        );
        break;
      }
      if (locSub === 'zone'){
        var zoneArg = String(args[3] || '').toLowerCase();
        if (!zoneArg){
          whisper(m.who, manifestZoneChooserHtml());
        } else {
          _toggleManifestZoneForGm(m, zoneArg);
        }
        break;
      }
      whisper(m.who, 'Usage: <code>!cal weather location</code> (opens wizard)');
      break;
    }

    default:
      whisper(m.who, weatherTodayGmHtml());
      break;
  }
}
