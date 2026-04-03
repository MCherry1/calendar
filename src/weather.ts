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

import type {
  TraitFormula,
  DayFormula,
  PeriodValues,
  WeatherLocation,
  DerivedConditions,
} from './weather-types';

import {
  WEATHER_UNCERTAINTY,
  WEATHER_LOW_TOD_PERIODS,
  WEATHER_PERIOD_META,
  WEATHER_TOD_MINICAL_LABELS,
  WEATHER_TOD_BELL,
  WEATHER_TOD_ARC,
  WEATHER_CLIMATE_BASE,
  WEATHER_GEO_MOD,
  WEATHER_TERRAIN_MOD,
  WEATHER_CLIMATES,
  WEATHER_GEOGRAPHIES,
  WEATHER_TERRAINS_UI,
  MANIFEST_ZONE_ORDER,
  MANIFEST_ZONE_DEFS,
  _FOG_BASE,
  _FOG_GEO_MULT,
  _FOG_TERRAIN_MULT,
  _FOG_SEASON_WEIGHT,
  EXTREME_EVENTS,
  _TIER_RANK,
  WEATHER_SOURCE_LABELS,
  QUALITY_HIGH,
  QUALITY_MEDIUM_A,
  QUALITY_MEDIUM_B,
  QUALITY_MEDIUM_C,
  QUALITY_MEDIUM_D,
  QUALITY_LOW_A,
  QUALITY_LOW_B,
  QUALITY_TAIL_AP,
  QUALITY_TAIL_BP,
  QUALITY_NONE,
  _currentZone,
  FORECAST_MASK_DICE,
  FORECAST_JITTER_LEVEL,
  ZONE_QUALITY,
} from './weather/data-tables';

// Re-export data-table items that consumers import from weather.ts
export { WEATHER_CLIMATES, WEATHER_SOURCE_LABELS } from './weather/data-tables';

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
import { handoutButton, refreshHandout } from './persistent-views.js';
import { _setCount, _setMin, _setMax, _monthsFromRangeSpec } from './events';
import { weekStartSerial } from './date-math';
import { weekdayProgressionFor } from './worlds/index';

import { _isFullMoonIllum, moonPhaseAt, moonEnsureSequences, nighttimeLightHtml, getTidalIndex, tidalLabel, currentLightSnapshot } from './moon';
import { getActivePlanarEffects } from './planes';
import { _activePlanarWeatherShiftLines, _weatherInfluenceTexts, _weatherInfluenceHtml, _planarWeatherInfluenceText, currentTimeOfDayLabel } from './ui';
import { colorForMonth } from './state';
import { isTimeOfDayActive, currentTimeBucket } from './time-of-day';

function _seededRand(seed){
  var s = ((seed * 2654435769) >>> 0) / 4294967296;
  return function(){ s = ((s * 1103515245 + 12345) % 2147483648) / 2147483648; return s; };
}

function _weatherHazardsEnabled(){
  return ensureSettings().weatherHazardsEnabled !== false;
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
// WEATHER_UNCERTAINTY — imported from ./weather/data-tables

export var WEATHER_DAY_PERIODS = TIME_OF_DAY_BUCKETS.map(function(bucket: any){ return bucket.key; });
export var WEATHER_PRIMARY_PERIOD = 'afternoon';
// WEATHER_LOW_TOD_PERIODS, WEATHER_PERIOD_META, WEATHER_TOD_MINICAL_LABELS — imported from ./weather/data-tables

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

// WEATHER_TOD_BELL — imported from ./weather/data-tables

// WEATHER_TOD_ARC — imported from ./weather/data-tables

// WEATHER_CLIMATE_BASE — imported from ./weather/data-tables

// WEATHER_GEO_MOD — imported from ./weather/data-tables

// WEATHER_TERRAIN_MOD — imported from ./weather/data-tables

// WEATHER_CLIMATES — imported from ./weather/data-tables

// WEATHER_GEOGRAPHIES — imported from ./weather/data-tables

// WEATHER_TERRAINS_UI — imported from ./weather/data-tables

// MANIFEST_ZONE_ORDER, MANIFEST_ZONE_DEFS — imported from ./weather/data-tables

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

export function _weatherLocationTransparentLabel(loc: any){
  if (!loc) return _weatherLocationLabel(loc);
  var detail = _weatherLocationLabel(loc);
  var name = String(loc.name || '').trim();
  if (name && name.toLowerCase() !== detail.toLowerCase()) return name + ' (' + detail + ')';
  return detail;
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
export function _composeFormula(climate: string, geography: string, terrain: string, monthIdx: number): DayFormula {
  var TRAIT_MIN: any = { temp:WEATHER_TEMP_BAND_MIN, wind:0, precip:0 };
  var TRAIT_MAX: any = { temp:WEATHER_TEMP_BAND_MAX, wind:5, precip:5 };
  var clBase  = WEATHER_CLIMATE_BASE[climate]   || WEATHER_CLIMATE_BASE.temperate;
  var base    = clBase[_weatherMonthIndex(monthIdx)] || clBase[0];
  var gMod    = _getModEntry(WEATHER_GEO_MOD[geography]     || WEATHER_GEO_MOD.inland,   monthIdx);
  var tMod    = _getModEntry(WEATHER_TERRAIN_MOD[terrain]   || WEATHER_TERRAIN_MOD.open,  monthIdx);

  function composeTrait(b: any, gm: any, tm: any, traitMin: number, traitMax: number): TraitFormula {
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

export function _rollTrait(formula: TraitFormula, seedNudge: number): number {
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
    // Keep temperature swings smoother than wind/precip so the day still
    // reads like one pattern instead of six unrelated spikes.
    temp:   Math.max(-1, Math.min(1, WEATHER_TOD_BELL[_rollDie(20) - 1])),
    wind:   WEATHER_TOD_BELL[_rollDie(20) - 1],
    precip: WEATHER_TOD_BELL[_rollDie(20) - 1]
  };
}

// ---------------------------------------------------------------------------
// 18f-b) Probabilistic fog roll
// Returns 'dense', 'light', or 'none'.
// Called once per period per day at generation time. Result stored on record.
// ---------------------------------------------------------------------------

// _FOG_BASE, _FOG_GEO_MULT, _FOG_TERRAIN_MULT, _FOG_SEASON_WEIGHT — imported from ./weather/data-tables

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

// Mean reversion nudge — proportional scaling.
// Deviation ≤1 from base: no nudge (normal daily variation).
// Deviation of 2: nudge = 1 × CONFIG_WEATHER_SEED_STRENGTH (same as before).
// Deviation of 3+: progressively stronger pull-back.
export function _nudge(prev: number, base: number): number {
  var dev = (prev|0) - (base|0);
  var absDev = Math.abs(dev);
  if (absDev <= 1) return 0;
  // magnitude scales linearly from 1 at deviation=2, growing by 0.5 per extra band
  var rawMag = (1 + (absDev - 2) * 0.5) * CONFIG_WEATHER_SEED_STRENGTH;
  var mag = Math.round(rawMag);  // round magnitude before applying sign for symmetry
  return dev > 0 ? -mag : mag;
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
  // Uses proportional scaling via module-scope _nudge function.

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
  // Overlay contributions are tracked per-plane for forecast lens decomposition.
  var _overlay: any = { temp: 0, wind: 0, precip: 0, planes: {} };
  if (ensureSettings().planesEnabled !== false){
    try {
      var _plEff = getActivePlanarEffects(serial);
      for (var _pe = 0; _pe < _plEff.length; _pe++){
        var _ppe = _plEff[_pe];
        var _planeKey = _ppe.plane;
        if (!_overlay.planes[_planeKey]) _overlay.planes[_planeKey] = { temp: 0, wind: 0, precip: 0 };
        if (_ppe.plane === 'Fernia'  && _ppe.phase === 'coterminous'){ _overlay.planes[_planeKey].temp += 3; _overlay.temp += 3; }
        if (_ppe.plane === 'Fernia'  && _ppe.phase === 'remote')     { _overlay.planes[_planeKey].temp -= 2; _overlay.temp -= 2; }
        if (_ppe.plane === 'Risia'   && _ppe.phase === 'coterminous'){ _overlay.planes[_planeKey].temp -= 3; _overlay.temp -= 3; }
        if (_ppe.plane === 'Risia'   && _ppe.phase === 'remote')     { _overlay.planes[_planeKey].temp += 2; _overlay.temp += 2; }
        if (_ppe.plane === 'Syrania' && _ppe.phase === 'coterminous'){
          // Syrania coterminous forces clear calm — track the delta from current values
          _overlay.planes[_planeKey].precip = -finalVals.precip; _overlay.planes[_planeKey].wind = -finalVals.wind;
          _overlay.precip += -finalVals.precip; _overlay.wind += -finalVals.wind;
        }
        if (_ppe.plane === 'Syrania' && _ppe.phase === 'remote')     { _overlay.planes[_planeKey].precip += 1; _overlay.precip += 1; }
      }
      // Apply overlay totals to final values (same net effect as before)
      finalVals.temp += _overlay.temp;
      finalVals.wind = Math.max(0, Math.min(5, finalVals.wind + _overlay.wind));
      finalVals.precip = Math.max(0, Math.min(5, finalVals.precip + _overlay.precip));
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
    overlay:         _overlay,
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
    if (existing && existing.locked) { prevRec = existing; continue; }
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
  // Called after day advance. Archives old days and fills the current forecast window.
  var ws    = getWeatherState();
  var today = todaySerial();

  // Archive past days
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
  if (rec.serial < todaySerial()) return 'certain';
  var dist = rec.serial - rec.generatedAt;
  var tiers = WEATHER_UNCERTAINTY;
  if (dist <= tiers.certain.maxDist)   return 'certain';
  if (dist <= tiers.likely.maxDist)    return 'likely';
  if (dist <= tiers.uncertain.maxDist) return 'uncertain';
  return 'vague';
}

// ---------------------------------------------------------------------------
// 18j-0) Extreme event system — EXTREME_EVENTS imported from ./weather/data-tables

// Evaluate all extreme events for a given day record.
// Returns array of { key, event, probability } for events that qualify.
// Probability > 0 means conditions are met. Events with p=0 are excluded.
export function _evaluateExtremeEvents(rec: any){
  if (!_weatherHazardsEnabled()) return [];
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
  if (!_weatherHazardsEnabled()) return false;
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
    var triggerBtn = button(e.event.emoji+' Let\'s Do It', 'weather event trigger '+e.key);
    var rollBtn    = button('🎲 Roll For It ('+pct+'%)', 'weather event roll '+e.key);
    var mechBtn = mechanicsOn ? ' '+button('📖 Tell me More', 'weather event details '+e.key+' ?{Topic|'+e.event.name+' Mechanics,event|Extreme Event System Mechanics,system}') : '';
    lines.push(
      '<div style="margin:3px 0;padding:4px 6px;background:rgba(183,28,28,.06);border-radius:4px;border:1px solid rgba(183,28,28,.2);">'+
      '<div style="font-size:.9em;font-weight:bold;">Conditions are right for a '+esc(e.event.name)+'</div>'+
      '<div style="margin-top:3px;">'+triggerBtn+' '+rollBtn+mechBtn+'</div>'+
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
    '<b>Why this triggered:</b> '+esc(_extremeEventReasonText(key, rec))+'<br>'+
    '<b>Aftermath:</b> '+esc(evt.aftermath)+
    '</div></div>'
  );
}

function _extremeEventReasonText(key: any, rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec || !rec.final) return 'The current weather and location profile met this event’s trigger conditions.';
  var f = rec.final;
  var loc = rec.location || {};
  var reasons: any[] = ['Location: ' + _weatherLocationLabel(loc) + '.'];
  switch (key){
    case 'flash_flood':
      reasons.push('Heavy rain hit a low-lying area.');
      if (rec.wetAccumulated) reasons.push('The ground was already wet from prior rain.');
      break;
    case 'whiteout':
      reasons.push('Cold, snowy, windy conditions aligned on open terrain.');
      break;
    case 'ground_blizzard':
      reasons.push('Existing snowpack plus strong wind created a blowing-snow hazard.');
      break;
    case 'haboob':
      reasons.push('Hot, dry, windy conditions built into a dust wall.');
      break;
    case 'avalanche':
      reasons.push('Mountain terrain plus cold snowfall loading raised slide risk.');
      break;
    case 'lightning_storm':
      reasons.push('Warm storm conditions with rain and wind favored severe lightning.');
      break;
    case 'clear_sky_strike':
      reasons.push('The sky stayed mostly clear, but the atmospheric charge still spiked.');
      if (_isZarantyrFull(rec.serial)) reasons.push('Zarantyr being full made the strike more likely.');
      break;
    case 'flash_freeze':
      reasons.push('A wet prior day was followed by a sudden hard cold snap.');
      break;
    case 'tropical_storm':
      reasons.push('Warm coastal storm conditions reached sustained gale force.');
      break;
    case 'hurricane':
      reasons.push('Very warm seas, extreme wind, and deluge-level rain all aligned.');
      break;
    default:
      reasons.push('The forecast met this event’s threshold mix of weather and geography.');
      break;
  }
  reasons.push('Current bands: temp ' + f.temp + ', wind ' + f.wind + ', precip ' + f.precip + '.');
  return reasons.join(' ');
}

function _extremeEventSystemHtml(){
  return '<div style="border:2px solid #B71C1C;border-radius:5px;padding:6px 10px;background:#FFF3F3;">' +
    '<div style="font-size:1.05em;font-weight:bold;color:#B71C1C;">Extreme Event System Mechanics</div>' +
    '<div style="margin-top:4px;font-size:.88em;line-height:1.45;">' +
      'Extreme events are GM-facing hazard prompts layered on top of the daily weather record. The script checks the current weather bands, recent carry-over conditions like wet ground or snowpack, and the current geography/terrain. If an event qualifies, it appears as an option for the GM to trigger or roll, and the player-facing send strips out the mechanics text.' +
    '</div>' +
  '</div>';
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

export function _deriveConditions(pv: PeriodValues, loc: WeatherLocation | null, period: string, snowAccumulated: boolean, fogOverride?: string): DerivedConditions {
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

  // -- Categorized mechanics --
  var mech: any = { visibility: [], movement: [], combat: [], exposure: [], other: [] };
  var windLabel = CONFIG_WEATHER_LABELS.wind[wind] || '';

  // Exposure (temperature)
  var tInfo = _weatherTempInfo(temp);
  if (tInfo.nominalDC != null){
    var tempType = temp <= 3 ? 'Cold' : 'Heat';
    var clothingReq = '';
    if (tempType === 'Cold' && tInfo.coldRequirement && tInfo.coldRequirement !== 'none'){
      if (tInfo.coldRequirement === 'special') clothingReq = 'Special Protection Req.';
      else if (tInfo.coldRequirement === 'heavy_cwc') clothingReq = 'Heavy Clothing Req.';
      else if (tInfo.coldRequirement === 'medium_cwc') clothingReq = 'Medium or Heavy Clothing Req.';
      else if (tInfo.coldRequirement === 'light_cwc') clothingReq = 'Light, Medium, or Heavy Clothing Req.';
      else if (tInfo.coldRequirement === 'warm') clothingReq = 'Warm Clothing Req.';
    }
    if (tempType === 'Heat' && tInfo.heatArmorDisadvantage && tInfo.heatArmorDisadvantage !== 'none'){
      if (tInfo.heatArmorDisadvantage === 'heavy') clothingReq = 'No Heavy Armor';
      else if (tInfo.heatArmorDisadvantage === 'medium_or_heavy') clothingReq = 'Light or No Armor Req.';
      else if (tInfo.heatArmorDisadvantage === 'any_armor') clothingReq = 'No Armor Allowed';
    }
    var exposureLine = tempType + ', DC ' + tInfo.nominalDC + ' Con Save';
    if (clothingReq) exposureLine += ', ' + clothingReq;
    mech.exposure.push(exposureLine + ' (Temperature)');
  }

  // Wind — split across categories
  if (wind === 2){
    mech.other.push('Fogs and gases dispersed (' + windLabel + ')');
  } else if (wind === 3){
    mech.combat.push('Disadvantage on ranged attack rolls (' + windLabel + ')');
    mech.combat.push('Long range attacks automatically miss (' + windLabel + ')');
    mech.movement.push('Flying costs an additional foot of movement (' + windLabel + ')');
    mech.other.push('Open flames extinguished (' + windLabel + ')');
  } else if (wind === 4){
    mech.combat.push('Ranged attack rolls automatically miss (' + windLabel + ')');
    mech.movement.push('Flying speeds reduced to 0 (' + windLabel + ')');
    mech.movement.push('Walking costs an additional foot of movement (' + windLabel + ')');
  } else if (wind >= 5){
    mech.movement.push('DC 15 Strength check or fall prone (' + windLabel + ')');
    mech.combat.push('Projectiles deal 2d6 bludgeoning, DC 10 Dex save (' + windLabel + ')');
    mech.other.push('Small trees uprooted (' + windLabel + ')');
  }

  // Visibility from precip/fog
  if (vis.tier !== 'none'){
    var visSource = fog !== 'none' ? 'Fog' : 'Precipitation';
    mech.visibility.push('Lightly Obscured (' + visSource + ')');
    if (vis.tier === 'C'){
      mech.visibility.push('Heavily Obscured beyond 30 ft (' + visSource + ')');
    } else if (vis.tier === 'B'){
      mech.visibility.push('Heavily Obscured beyond 60 ft (' + visSource + ')');
    }
  }

  // Difficult terrain → Movement
  if (difficultTerrain){
    var dtSource = (precipType === 'snow' && snowAccumulated) ? 'Accumulated Snow'
      : (precipType === 'blizzard') ? 'Blizzard'
      : (precipType === 'deluge') ? 'Deluge' : 'Ice';
    mech.movement.push('Difficult terrain on all surfaces (' + dtSource + ')');
  }

  // Hazards → Other
  if (precipType === 'heavy_rain' || precipType === 'deluge' || precipType === 'blizzard' || precipType === 'ice_storm'){
    var hazardNote = (precipType === 'heavy_rain')
      ? 'Risk of lightning and flash flooding (Heavy Rain)'
      : (precipType === 'deluge')
        ? 'Extreme flooding, roads impassable (Deluge)'
        : (precipType === 'blizzard')
        ? 'Risk of whiteout, avalanche, and hypothermia (Blizzard)'
        : 'Risk of lightning, flash flooding, or falling ice (Ice Storm)';
    mech.other.push(hazardNote);
  }

  return {
    precipType:       precipType,     // none|rain_light|rain|heavy_rain|deluge|snow_light|snow|blizzard|sleet_light|sleet|ice_storm
    fog:              fog,            // none|light|dense
    visibility:       vis,            // { tier:'none'|'A'|'B'|'C', beyond:null|30|60 }
    difficultTerrain: difficultTerrain,
    mechanics:        mech            // { visibility:[], movement:[], combat:[], exposure:[], other:[] }
  };
}

// Render conditions mechanics block as HTML (empty string if none).
export function _conditionsMechHtml(cond: any){
  if (ensureSettings().weatherMechanicsEnabled === false) return '';
  var m = cond.mechanics;
  var sections: string[] = [];
  var cats = [
    { key: 'visibility', label: 'Visibility' },
    { key: 'movement',   label: 'Movement' },
    { key: 'combat',     label: 'Combat' },
    { key: 'exposure',   label: 'Exposure' },
    { key: 'other',      label: 'Other' },
  ];
  for (var ci = 0; ci < cats.length; ci++){
    var items = m[cats[ci].key];
    if (items && items.length){
      var bullets = '';
      for (var bi = 0; bi < items.length; bi++){
        bullets += '<li>' + esc(items[bi]) + '</li>';
      }
      sections.push('<b>' + cats[ci].label + '</b><ul style="margin:1px 0 3px 14px;padding:0;list-style:disc;">' + bullets + '</ul>');
    }
  }
  if (!sections.length) return '';
  return '<div style="font-size:.92em;line-height:1.4;margin-top:3px;">' + sections.join('') + '</div>';
}

// Full mechanical readout for today — whispered on demand via button.
// Covers the full six-bucket day model + any extreme events + planar effects.
function weatherTodayMechanicsHtml(){
  if (ensureSettings().weatherMechanicsEnabled === false){
    return _menuBox('📋 Weather Mechanics',
      '<div style="opacity:.7;">Mechanical weather effects are disabled. Narrative weather remains active.</div>'
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
    sections.join('')
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
    wind:  ['#F5F5F5','#E0E8E0','#B0BEC5','#546E7A','#37474F','#263238'],
    precip:['#F0F8FF','#CFE8F5','#90CAF9','#1565C0','#0D47A1','#0A1929']
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
// _TIER_RANK — imported from ./weather/data-tables
export function _bestTier(a: any, b: any){
  return (_TIER_RANK[a]||0) >= (_TIER_RANK[b]||0) ? a : b;
}

// WEATHER_SOURCE_LABELS — imported from ./weather/data-tables

export function _grantCommonWeatherReveals(ws: any, today: any){
  if (!ws) ws = getWeatherState();
  if (!isFinite(today)) today = todaySerial();
  _recordReveal(ws, today, 'low', 'common', undefined, QUALITY_LOW_A);
  if (_forecastRecord(today + 1)) _recordReveal(ws, today + 1, 'low', 'common', undefined, QUALITY_LOW_B);
  if (_forecastRecord(today + 2)) _recordReveal(ws, today + 2, 'low', 'common', undefined, QUALITY_LOW_B);
}

// Record a reveal for a serial. Only upgrades, never downgrades.
// source: 'common' | 'medium' | 'high'
// quality: numeric rank on the quality ladder (lower = better). Optional for backward compat.
export function _recordReveal(ws: any, serial: any, tier: any, source: any, loc?: any, quality?: any){
  var key = String(serial);
  var bucket = _weatherRevealBucket(ws, loc, true);
  var prev = bucket[key];
  var prevObj = _readReveal(prev);
  var prevQuality = prevObj.quality || QUALITY_NONE;
  var newQuality = (typeof quality === 'number') ? quality : _tierToDefaultQuality(tier);

  // Quality-rank comparison: refuse writes that aren't strictly better (lower rank number).
  if (newQuality >= prevQuality) return;

  var revealLoc = _normalizeWeatherLocation(loc || ws.location);
  bucket[key] = {
    tier: tier,
    source: source || 'common',
    quality: newQuality,
    isTail: false,
    locationSig: revealLoc ? revealLoc.sig : '',
    locationLabel: revealLoc ? revealLoc.name : ''
  };
}

// Map a tier label to its best default quality (for backward compat when quality not specified).
function _tierToDefaultQuality(tier: any): number {
  if (tier === 'high') return QUALITY_HIGH;
  if (tier === 'medium') return QUALITY_MEDIUM_A;
  if (tier === 'low') return QUALITY_LOW_A;
  return QUALITY_NONE;
}

// Record a tail reveal. Tail days keep their A'/B' tag and don't auto-sharpen.
function _recordTailReveal(ws: any, serial: any, tailTag: string, quality: number, loc?: any){
  var key = String(serial);
  var bucket = _weatherRevealBucket(ws, loc, true);
  var prev = bucket[key];
  var prevObj = _readReveal(prev);
  var prevQuality = prevObj.quality || QUALITY_NONE;
  // Quality-rank comparison: refuse writes that aren't strictly better.
  if (quality >= prevQuality) return;
  var revealLoc = _normalizeWeatherLocation(loc || ws.location);
  bucket[key] = {
    tier: 'low',
    source: 'tail',
    quality: quality,
    isTail: true,
    tailTag: tailTag,
    locationSig: revealLoc ? revealLoc.sig : '',
    locationLabel: revealLoc ? revealLoc.name : ''
  };
}

// Read a reveal entry, handling both old string format and new {tier,source} format.
function _readReveal(entry: any){
  if (!entry) return { tier: null, source: 'common', quality: QUALITY_NONE, isTail: false };
  if (typeof entry === 'string') return { tier: entry, source: 'common', quality: _tierToDefaultQuality(entry), isTail: false };
  return {
    tier: entry.tier || null,
    source: entry.source || 'common',
    quality: (typeof entry.quality === 'number') ? entry.quality : _tierToDefaultQuality(entry.tier),
    isTail: !!entry.isTail,
    locationSig: entry.locationSig || '',
    locationLabel: entry.locationLabel || ''
  };
}

export function _weatherRevealForSerial(ws: any, serial: any, loc?: any){
  ws = ws || getWeatherState();
  var bucket = _weatherRevealBucket(ws, loc, false);
  return _readReveal(bucket[String(serial)]);
}

function _weatherRevealTierLabel(reveal: any){
  var tier = String(reveal && reveal.tier || '').toLowerCase();
  if (tier === 'high' || tier === 'certain') return 'High';
  if (tier === 'medium') return 'Medium';
  if (tier === 'low' || tier === 'common') return 'Low';
  return 'Unrevealed';
}

function _weatherRevealTierHtml(serial: any, opts?: any){
  opts = opts || {};
  var ws = opts.weatherState || getWeatherState();
  var loc = opts.revealLocation || ws.location;
  var reveal = (typeof opts.revealForSerial === 'function')
    ? opts.revealForSerial(serial, ws, loc)
    : _weatherRevealForSerial(ws, serial, loc);
  var label = _weatherRevealTierLabel(reveal);
  var opacity = (label === 'Unrevealed') ? '.58' : '.82';
  return '<div style="margin-top:4px;padding-top:3px;border-top:1px solid rgba(0,0,0,.12);font-size:.68em;line-height:1.1;text-align:center;opacity:' + opacity + ';"><b>' + esc(label) + '</b></div>';
}

// ---------------------------------------------------------------------------
// Forecast Lens: degrades weather truth based on tier, zone, and planar knowledge.
// ---------------------------------------------------------------------------

// Deterministic seed for forecast lens rolls. Stable per (serial, zone, purpose).
function _forecastSeed(serial: number, zone: string, purpose: string): number {
  // Combine world seed components into a single integer seed.
  var h = (serial | 0) * 2654435769 + zone.charCodeAt(0) * 31;
  for (var i = 0; i < purpose.length; i++) h = ((h << 5) - h + purpose.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Seeded die roll: returns integer 1..sides (deterministic).
function _seededDie(sides: number, seed: number): number {
  var rng = _seededRand(seed);
  return Math.floor(rng() * sides) + 1;
}

// Look up jitter level from tier/zone tables (0=exact, 1=wind, 2=wind+precip, 3=all).
function _lookupJitterLevel(tier: string, zone: string, isTail: boolean, tailTag?: string): number {
  if (isTail && tailTag){
    return FORECAST_JITTER_LEVEL.tail[tailTag] || 0;
  }
  var table = FORECAST_JITTER_LEVEL[tier];
  return table ? (table[zone] || 0) : 0;
}

// Look up mask die from tier/zone tables.
function _lookupMaskDie(tier: string, zone: string, isTail: boolean, tailTag?: string): number {
  if (isTail && tailTag){
    return FORECAST_MASK_DICE.tail[tailTag] || 20;
  }
  var table = FORECAST_MASK_DICE[tier];
  return table ? (table[zone] || 20) : 20;
}

// Compute manifest zone delta for a given serial (sum of active manifest zone modifiers).
function _computeManifestDelta(serial: number): any {
  var delta = { temp: 0, wind: 0, precip: 0 };
  var entries = _activeManifestZonesForSerial(serial);
  if (!entries.length) return delta;
  // Sum non-chaotic modifiers; chaotic ones use seeded rand.
  for (var i = 0; i < entries.length; i++){
    var def = entries[i].def || entries[i];
    if (!def) continue;
    if (typeof def.tempMod === 'number') delta.temp += def.tempMod;
    if (typeof def.precipMod === 'number') delta.precip += def.precipMod;
    if (typeof def.windMod === 'number') delta.wind += def.windMod;
    if (def.chaotic){
      var kR = _seededRand((serial | 0) * 77 + 999);
      delta.temp += Math.floor(kR() * 5) - 2;
      delta.precip += Math.floor(kR() * 3) - 1;
      delta.wind += Math.floor(kR() * 3) - 1;
    }
  }
  return delta;
}

// The core forecast lens. Transforms rec.final based on tier, quality, zone,
// and planar knowledge. Returns modified trait values for player display.
export function _forecastLens(
  rec: any,
  prevRec: any,
  reveal: any,
  today: number
): any {
  // High tier: exact truth, no lens
  if (!reveal || reveal.tier === 'high') return { temp: rec.final.temp, wind: rec.final.wind, precip: rec.final.precip };

  var tier = reveal.tier || 'low';
  var isTail = !!reveal.isTail;
  var tailTag = reveal.tailTag || null;

  // Determine the effective zone for this day.
  // Tail days use their stored tag (Ap/Bp) and do NOT auto-sharpen.
  // Medium/high non-tail days use current zone (auto-sharpening).
  var zone: string;
  if (isTail && tailTag){
    zone = tailTag;
  } else {
    zone = _currentZone(rec.serial, today) || 'D';
  }

  // 1. Decompose deltas per trait.
  // overlay = planar contributions stored at generation time.
  var overlay = rec.overlay || { temp: 0, wind: 0, precip: 0, planes: {} };
  var manifestDelta = _computeManifestDelta(rec.serial);

  // TODO: cross-reference with player planar reveals when planar reveal API is available.
  // For now, treat all planar overlay as unknown (full regression).
  var knownPlanar = { temp: 0, wind: 0, precip: 0 };
  var unknownPlanar = { temp: overlay.temp || 0, wind: overlay.wind || 0, precip: overlay.precip || 0 };

  // 2. Regression target = previous day's final values (or seasonal baseline).
  var target = prevRec && prevRec.final
    ? { temp: prevRec.final.temp, wind: prevRec.final.wind, precip: prevRec.final.precip }
    : (rec.base ? { temp: rec.base.temp, wind: rec.base.wind, precip: rec.base.precip }
               : { temp: rec.final.temp, wind: rec.final.wind, precip: rec.final.precip });

  // 3. Compute regressable portion per trait.
  // regressable = rec.final - knownPlanar - manifestDelta - target
  // (This includes naturalDelta + unknownPlanar, measured relative to previous day.)
  var TRAITS = ['temp', 'wind', 'precip'];
  var regressable: any = {};
  var forecastDelta: any = {};
  for (var ti = 0; ti < TRAITS.length; ti++){
    var t = TRAITS[ti];
    regressable[t] = (rec.final[t] || 0) - knownPlanar[t] - manifestDelta[t] - target[t];
    forecastDelta[t] = regressable[t]; // default: pass through unchanged
  }

  // 4. Determine jitter level.
  var jitterLevel = _lookupJitterLevel(tier, zone, isTail, tailTag);

  // 5. Determine which traits to jitter (fixed order: wind, precip, temp).
  var affectedTraits: string[] = [];
  if (jitterLevel >= 1) affectedTraits.push('wind');
  if (jitterLevel >= 2) affectedTraits.push('precip');
  if (jitterLevel >= 3) affectedTraits.push('temp');

  // 6. Apply jitter to affected traits.
  for (var ji = 0; ji < affectedTraits.length; ji++){
    var jt = affectedTraits[ji];
    var dayOverDay = Math.abs((rec.final[jt] || 0) - (target[jt] || 0));

    // Determine direction die based on day-over-day change magnitude.
    var directionDie: number;
    if (dayOverDay >= 2) directionDie = 10;       // 1 on d10 = away (9 in 10 toward)
    else if (dayOverDay === 1) directionDie = 4;   // 1 on d4 = away (3 in 4 toward)
    else directionDie = 6;                          // coin flip: 1-3 toward, 4-6 away

    var jSeed = _forecastSeed(rec.serial, zone, 'jitter-direction-' + jt);
    var dirRoll = _seededDie(directionDie, jSeed);

    var goToward: boolean;
    if (directionDie === 6){
      goToward = (dirRoll <= 3);
    } else {
      goToward = (dirRoll !== 1);
    }

    var jSign: number;
    if (goToward){
      // Push toward previous day (reduce regressable magnitude)
      jSign = regressable[jt] > 0 ? -1 : (regressable[jt] < 0 ? 1 : -1);
    } else {
      // Push away from previous day (increase regressable magnitude)
      jSign = regressable[jt] > 0 ? 1 : (regressable[jt] < 0 ? -1 : 1);
    }

    forecastDelta[jt] = regressable[jt] + jSign; // ±1 jitter magnitude
  }

  // 7. Apply mask if it fires.
  var maskDie = _lookupMaskDie(tier, zone, isTail, tailTag);
  var maskSeed = _forecastSeed(rec.serial, zone, 'mask');
  var maskRoll = _seededDie(maskDie, maskSeed);

  if (maskRoll === 1){
    // Find the trait with the largest day-over-day shift. Wind breaks ties.
    var bestTrait = 'wind';
    var bestDelta = Math.abs((rec.final.wind || 0) - (target.wind || 0));
    for (var mi = 0; mi < TRAITS.length; mi++){
      var mt = TRAITS[mi];
      var md = Math.abs((rec.final[mt] || 0) - (target[mt] || 0));
      if (md > bestDelta || (md === bestDelta && mt === 'wind')){
        bestDelta = md;
        bestTrait = mt;
      }
    }
    // Snap toward previous day's value ±1.
    var snapSeed = _forecastSeed(rec.serial, zone, 'mask-snap');
    forecastDelta[bestTrait] = _seededDie(2, snapSeed) === 1 ? 1 : -1;
  }

  // 8. Reassemble forecast values.
  var forecast: any = {};
  for (var ri = 0; ri < TRAITS.length; ri++){
    var rt = TRAITS[ri];
    forecast[rt] = target[rt] + knownPlanar[rt] + manifestDelta[rt] + forecastDelta[rt];
  }

  // 9. Seasonal clamp (shifted by known effects + manifest).
  var loc = rec.location || {};
  var formula = _composeFormula(
    loc.climate || 'temperate',
    loc.geography || 'inland',
    loc.terrain || 'open',
    rec.monthIdx || 0
  );
  for (var ci = 0; ci < TRAITS.length; ci++){
    var ct = TRAITS[ci];
    var fRange = (formula as any)[ct];
    if (!fRange) continue;
    var effectiveMin = (fRange.min || 0) + knownPlanar[ct] + manifestDelta[ct];
    var effectiveMax = (fRange.max || 0) + knownPlanar[ct] + manifestDelta[ct];
    forecast[ct] = Math.max(effectiveMin, Math.min(effectiveMax, forecast[ct]));
  }

  // Final hard clamps to valid trait ranges.
  forecast.temp = Math.max(-5, Math.min(15, forecast.temp));
  forecast.wind = Math.max(0, Math.min(5, forecast.wind));
  forecast.precip = Math.max(0, Math.min(5, forecast.precip));

  return forecast;
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
  var loc      = rec.location || {};

  // Apply forecast lens: degrade weather truth based on reveal quality.
  // The lens replaces rec.final with forecast-filtered values for player views.
  var today_   = todaySerial();
  var ws_      = getWeatherState();
  var reveal_  = _weatherRevealForSerial(ws_, rec.serial);
  var prevRec_ = _forecastRecord(rec.serial - 1) || _historyRecord(rec.serial - 1) || null;
  var f        = (reveal_ && reveal_.tier)
    ? _forecastLens(rec, prevRec_, reveal_, today_)
    : rec.final;

  var content  = '';
  var dayOffset = rec.serial - today_;

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
  var knownSerials: any = {};
  var revealed = 0;
  var lastRevealedSerial = -1;

  for (var i=0; i<days; i++){
    var ser    = today + i;
    var rec    = _forecastRecord(ser);
    if (!rec) continue;

    // Determine zone-based quality and tier
    var zone = _currentZone(ser, today);
    var tier: string;
    var quality: number;
    if (methodNorm === 'high'){
      tier = 'high';
      quality = QUALITY_HIGH;
    } else {
      // Medium method: assign tier+quality per zone
      tier = (zone === 'A') ? 'high' : 'medium';
      quality = (ZONE_QUALITY.medium as any)[zone as string] || QUALITY_MEDIUM_D;
    }

    // Record the reveal (upgrade-only via quality rank)
    _recordReveal(ws, ser, tier, revealSource, ws.location, quality);

    knownSerials[String(ser)] = 1;
    revealed++;
    lastRevealedSerial = ser;
  }

  // Plant tail days (A' and B') past the medium/high edge.
  // A' = 1st day past edge, B' = 2nd and 3rd days past edge. Cap at day 10 from today.
  if (lastRevealedSerial >= today){
    var tailStart = lastRevealedSerial + 1;
    var maxSerial = today + 9;  // day 10 from today (0-indexed: today + 9)
    for (var t = 0; t < 3 && (tailStart + t) <= maxSerial; t++){
      var tailSer = tailStart + t;
      var tailRec = _forecastRecord(tailSer);
      if (!tailRec) continue;
      if (t === 0){
        _recordTailReveal(ws, tailSer, 'Ap', QUALITY_TAIL_AP, ws.location);
      } else {
        _recordTailReveal(ws, tailSer, 'Bp', QUALITY_TAIL_BP, ws.location);
      }
      knownSerials[String(tailSer)] = 1;
    }
  }

  if (!revealed){
    warnGM('No weather records available for that range. Try generating the forecast first.');
    return;
  }

  var methodLabel = methodNorm === 'high' ? 'Expert Forecast' : 'Skilled Forecast';
  var dateObj     = fromSerial(today);
  var titleDate   = esc(_displayMonthDayParts(dateObj.mi, dateObj.day).label);
  var locLabel    = _weatherLocationLabel(ws.location);
  var serials = _weatherSerialRange(_weatherAnchorStartForToday(today), today + days - 1);

  sendToAll(_menuBox(
    methodLabel+' — '+titleDate,
    '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Location: <b>'+esc(locLabel)+'</b></div>' +
    _weatherForecastGridHtml(serials, { knownSerials: knownSerials, currentPeriodForToday: true })
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
  for (var ser = startSerial; ser <= endSerial; ser++){
    var rec = _forecastRecord(ser);
    if (!rec) continue;
    knownSerials[String(ser)] = 1;
  }
  var spanDays = Math.max(1, endSerial - startSerial + 1);
  var body = '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Location: <b>'+esc(locationLabel)+'</b></div>';
  body += _weatherForecastMiniCalHtml(startSerial, spanDays, {
    knownSerials: knownSerials,
    currentPeriodForToday: true
  });
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
    body += '<div style="font-size:.78em;opacity:.6;margin:0 0 6px 0;">Only weather you currently know is marked. Player knowledge level shown in cell.</div>';
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

export function weatherHandoutHtml(){
  if (ensureSettings().weatherEnabled === false){
    return _menuBox('Weather', '<div style="opacity:.7;">Weather tracking is not active.</div>');
  }

  var ws = getWeatherState();
  if (!ws.location){
    return _menuBox('Weather', '<div style="opacity:.7;">No weather location has been set.</div>');
  }

  weatherEnsureForecast();
  var today = todaySerial();
  var start = today - 10;
  var spanDays = 21;
  var miniCal = _weatherForecastMiniCalHtml(start, spanDays);
  var rows: any[] = [];

  for (var ser = start; ser <= today + 10; ser++){
    var rec = _weatherRecordForDisplay(_forecastRecord(ser));
    if (!rec || !rec.final) continue;
    var dayObj = fromSerial(ser);
    var label = _displayMonthDayParts(dayObj.mi, dayObj.day).label + ', ' + dayObj.year;
    var delta = ser - today;
    var rel = delta < 0 ? ('-' + Math.abs(delta) + 'd') : (delta > 0 ? ('+' + delta + 'd') : 'Today');
    var cond = _deriveConditions(rec.final, rec.location || {}, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    var narr = _conditionsNarrative(rec.final, cond, WEATHER_PRIMARY_PERIOD);
    var temps = _weatherDayTempRange(rec);
    var tempText = temps ? (temps.lowF + '/' + temps.highF + '\u00B0F') : '\u2014';
    rows.push(
      '<tr>' +
        '<td style="'+STYLES.td+';white-space:nowrap;">' + esc(label) + '<br><span style="opacity:.55;">' + esc(rel) + '</span></td>' +
        '<td style="'+STYLES.td+';text-align:center;font-size:1.15em;">' + _weatherEmojiForRecord(rec) + '</td>' +
        '<td style="'+STYLES.td+';text-align:center;">' + esc(tempText) + '</td>' +
        '<td style="'+STYLES.td+';font-size:.84em;">' + esc(narr) + '</td>' +
      '</tr>'
    );
  }

  if (!rows.length){
    return _menuBox('Weather — ' + _weatherLocationLabel(ws.location), '<div style="opacity:.7;">Weather is not available right now.</div>');
  }

  var head = '<tr>' +
    '<th style="'+STYLES.th+'">Date</th>' +
    '<th style="'+STYLES.th+'">Sky</th>' +
    '<th style="'+STYLES.th+'">Temps</th>' +
    '<th style="'+STYLES.th+'">Outlook</th>' +
  '</tr>';

  return _menuBox('Weather — ' + _weatherLocationLabel(ws.location),
    '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Window: <b>Previous 10 days + next 10 days</b></div>' +
    _weatherTodaySummaryHtml(today, null, true) +
    miniCal +
    _legendLine(['Emoji = afternoon outlook', 'Temps = low/high for the day']) +
    '<table style="'+STYLES.table+'">' + head + rows.join('') + '</table>'
  );
}

export function weatherMechanicsHandoutHtml(){
  var tempRows = WEATHER_TEMPERATURE_BANDS_F.map(function(band){
    var range = (band.minF == null ? '\u2264 ' + band.maxF : band.maxF == null ? '\u2265 ' + band.minF : band.minF + ' to ' + band.maxF) + '\u00B0F';
    var dcText = (band.nominalDC == null) ? '\u2014' : ('DC ' + band.nominalDC);
    var heatRule = band.heatArmorDisadvantageLabel || ((WEATHER_HEAT_ARMOR_RULES[band.heatArmorDisadvantage || 'none'] || {}).label) || '\u2014';
    return '<tr>' +
      '<td style="'+STYLES.td+';text-align:center;">' + band.band + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(range) + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(titleCase(band.label || '')) + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(dcText) + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(band.coldRequirementLabel || '\u2014') + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(heatRule || '\u2014') + '</td>' +
    '</tr>';
  }).join('');

  var windRows = CONFIG_WEATHER_LABELS.wind.map(function(label: any, idx: any){
    return '<tr>' +
      '<td style="'+STYLES.td+';text-align:center;">' + idx + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(label) + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(CONFIG_WEATHER_MECHANICS.wind[idx] || 'No special mechanical effect by default.') + '</td>' +
    '</tr>';
  }).join('');

  var precipNotes: any = {
    0: 'No precipitation. Clear sky baseline.',
    1: 'Cloud build-up only. Used for partly cloudy conditions and light sky cover.',
    2: 'Overcast baseline. Often combines with fog or low light but is not precipitation by itself.',
    3: 'Light precipitation. Usually drizzle, light rain, flurries, or light sleet depending on temperature.',
    4: 'Moderate precipitation. Often rain, snow, or sleet with meaningful visibility and travel pressure.',
    5: 'Heavy precipitation. Used for heavy rain, deluge, blizzard, or ice-storm outcomes after temperature conversion.'
  };
  var precipRows = CONFIG_WEATHER_LABELS.precip.map(function(label: any, idx: any){
    return '<tr>' +
      '<td style="'+STYLES.td+';text-align:center;">' + idx + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(label) + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(precipNotes[idx] || 'Derived from temperature and fog.') + '</td>' +
    '</tr>';
  }).join('');

  var extremeRows = Object.keys(EXTREME_EVENTS).map(function(key: any){
    var evt = EXTREME_EVENTS[key];
    return '<tr>' +
      '<td style="'+STYLES.td+'">' + esc(evt.emoji || '') + ' ' + esc(evt.name || key) + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(evt.duration || '\u2014') + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(evt.mechanics || '\u2014') + '</td>' +
      '<td style="'+STYLES.td+'">' + esc(evt.aftermath || '\u2014') + '</td>' +
    '</tr>';
  }).join('');

  return _menuBox('Weather Mechanics',
    '<div style="margin-bottom:6px;">Reference tables for the weather bands, derived visibility rules, and the extreme-event catalog used by the script.</div>' +
    '<div style="font-weight:bold;margin:6px 0 4px 0;">Temperature Bands</div>' +
    '<table style="'+STYLES.table+'">' +
      '<tr>' +
        '<th style="'+STYLES.th+'">Band</th>' +
        '<th style="'+STYLES.th+'">Range</th>' +
        '<th style="'+STYLES.th+'">Label</th>' +
        '<th style="'+STYLES.th+'">Nominal DC</th>' +
        '<th style="'+STYLES.th+'">Cold Gear</th>' +
        '<th style="'+STYLES.th+'">Heat Armor Rule</th>' +
      '</tr>' +
      tempRows +
    '</table>' +
    '<div style="font-weight:bold;margin:10px 0 4px 0;">Wind Bands</div>' +
    '<table style="'+STYLES.table+'">' +
      '<tr>' +
        '<th style="'+STYLES.th+'">Band</th>' +
        '<th style="'+STYLES.th+'">Label</th>' +
        '<th style="'+STYLES.th+'">Mechanical Effect</th>' +
      '</tr>' +
      windRows +
    '</table>' +
    '<div style="font-weight:bold;margin:10px 0 4px 0;">Precipitation Stages</div>' +
    '<table style="'+STYLES.table+'">' +
      '<tr>' +
        '<th style="'+STYLES.th+'">Stage</th>' +
        '<th style="'+STYLES.th+'">Label</th>' +
        '<th style="'+STYLES.th+'">Derived Outcome</th>' +
      '</tr>' +
      precipRows +
    '</table>' +
    '<div style="margin-top:10px;font-size:.84em;line-height:1.6;">' +
      '<b>Visibility and fog:</b> <code>_deriveConditions()</code> turns precipitation and fog into the three obscurity tiers used elsewhere in the system. Dense fog and the worst precipitation collapse visibility first, then difficult terrain and hazard tags are layered on top.<br>' +
      '<b>Tides:</b> Coastal and island locations use the current tidal index from the moon system, with Zarantyr carrying the dominant effect.<br>' +
      '<b>Extreme events:</b> These are GM advisory hazards gated by the daily weather state and location profile.' +
    '</div>' +
    '<div style="font-weight:bold;margin:10px 0 4px 0;">Extreme Events</div>' +
    '<table style="'+STYLES.table+'">' +
      '<tr>' +
        '<th style="'+STYLES.th+'">Event</th>' +
        '<th style="'+STYLES.th+'">Duration</th>' +
        '<th style="'+STYLES.th+'">Mechanics</th>' +
        '<th style="'+STYLES.th+'">Aftermath</th>' +
      '</tr>' +
      extremeRows +
    '</table>'
  );
}

function _refreshWeatherHandout(){
  refreshHandout('weather');
}

// Build whispered player forecast from their stored reveal state.
function playerForecastWhisper(m: any){
  var data = _playerWeatherKnownData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!data){
    whisper(m.who, _menuBox('Weather Forecast', '<div style="opacity:.7;">No forecast has been shared with you yet.</div>'));
    return;
  }
  whisper(m.who, _menuBox('Your Weather Forecast — ' + data.locationLabel, _playerForecastCalendarHtml(data)));
}

function sendRevealedForecast(m: any){
  var data = _playerWeatherKnownData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!data){
    warnGM('No revealed weather is currently available to send.');
    return;
  }
  sendToAll(_menuBox('Weather Forecast — ' + data.locationLabel, _playerForecastCalendarHtml(data)));
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

  var dateLine = '<div style="font-weight:bold;margin:3px 0;">'+esc(currentDateLabel())+'</div>';

  // Time of Day (if active)
  var todLine = '';
  if (isTimeOfDayActive()){
    todLine = '<div style="font-size:.85em;opacity:.72;margin:0 0 2px 0;">' + esc(currentTimeOfDayLabel()) + '</div>';
  }

  var locLine = '<div style="font-size:.85em;opacity:.75;">📍 '+esc(_weatherLocationLabel(loc))+'</div>';
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

  // Current Light Level (if before sunrise or after sunset)
  var lightLine = '';
  if (isTimeOfDayActive()){
    try {
      var _lightSnap = currentLightSnapshot(ser);
      if (_lightSnap && _lightSnap.mode !== 'day'){
        lightLine = '<div style="font-size:.82em;opacity:.7;margin-top:2px;">💡 '+esc(_lightSnap.label || 'Unknown')+((_lightSnap.note) ? ' — '+esc(_lightSnap.note) : '')+'</div>';
      }
    } catch(eLight){}
  }

  // Active Mechanics summary
  var activeMechLine = '';
  if (rec && ensureSettings().weatherMechanicsEnabled !== false){
    try {
      var _wxVals = _weatherPrimaryValues(rec) || rec.final;
      var _wxCond = _deriveConditions(_wxVals, rec.location || {}, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
      var _mechHtml = _conditionsMechHtml(_wxCond);
      if (_mechHtml){
        activeMechLine = '<div style="font-size:.82em;margin-top:4px;padding:3px 6px;background:rgba(0,0,0,.04);border-radius:3px;">' +
          '<b>Active Mechanics:</b> ' + _mechHtml + '</div>';
      }
    } catch(eMech){}
  }

  var topButtons =
    button('📣 Send Revealed','weather send')+' '+
    button('Forecast','weather forecast '+_weatherViewDays(st.weatherForecastViewDays))+' '+
    button('Reroll Today','weather reroll')+' '+
    button('Set Location','weather location')+' '+
    button('History','weather history');
  var zoneButtons = '<div style="margin-top:4px;">'+button('Set Manifest Zone','weather manifest')+'</div>';

  var mediumRow =
    '<div style="margin-top:4px;font-size:.85em;opacity:.8;">Medium Forecast:</div>'+
    '<div>'+
    button('1 day', 'weather reveal medium 1')+' '+
    button('3 days','weather reveal medium 3')+' '+
    button('6 days','weather reveal medium 6')+' '+
    button('10 days','weather reveal medium 10')+
    '</div>';

  var highRow =
    '<div style="margin-top:2px;font-size:.85em;opacity:.8;">High Forecast:</div>'+
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

  var managementBtn = _weatherManagementControlsHtml(ser);

  var todayHandoutLinks = [
    handoutButton('Open Weather Handout', 'weather'),
    handoutButton('Weather Mechanics', 'weather:mechanics')
  ].filter(Boolean).join(' ');

  return _menuBox("Today's Weather",
    dateLine + todLine + locLine + manifestLine + arythLine + body +
    lightLine + activeMechLine +
    tidalLine +
    extremeHtml +
    '<div style="margin-top:6px;">'+
      button('Calendar','weather') + ' ' +
      button('Forecast','weather forecast '+_weatherViewDays(st.weatherForecastViewDays)) + ' ' +
      button('Forecast List','weather forecast list') + ' ' +
      button('📣 Send Revealed','weather send') +
    '</div>'+
    (todayHandoutLinks ? '<div style="margin-top:4px;">' + todayHandoutLinks + '</div>' : '') +
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>'+
    mediumRow + highRow + specificRow +
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>'+
    '<div style="margin:4px 0;">' + button('Set Location','weather location') + ' ' + button('Set Manifest Zone','weather manifest') + '</div>' +
    managementBtn
  );
}

// Get L/H Fahrenheit temperatures for a forecast record's day.
// Uses smoothed display temperatures across the six periods so the UI
// doesn't exaggerate intraday swings from raw band edges.
function _weatherDayTempRange(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec || !rec.periods) return null;
  var temps = _weatherPeriodTempMap(rec);
  var lowF: any = null;
  var highF: any = null;
  for (var i = 0; i < WEATHER_DAY_PERIODS.length; i++){
    var tempF = temps[WEATHER_DAY_PERIODS[i]];
    if (tempF == null) continue;
    if (lowF == null || tempF < lowF) lowF = tempF;
    if (highF == null || tempF > highF) highF = tempF;
  }
  if (lowF == null || highF == null) return null;
  if (lowF >= highF) lowF = highF - 1;
  return { lowF: lowF, highF: highF };
}

function _weatherToDHeaderLabel(period: any){
  return WEATHER_TOD_MINICAL_LABELS[period] || _weatherPeriodShortLabel(period);
}

function _weatherBandMidpointF(band: any){
  var info = _weatherTempInfo(band);
  if (info.minF == null && info.maxF == null) return null;
  if (info.minF == null) return (info.maxF as number) - 4;
  if (info.maxF == null) return info.minF + 4;
  return Math.round((info.minF + info.maxF) / 2);
}

function _weatherBandDisplayTempF(band: any, seed: any){
  var info = _weatherTempInfo(band);
  var base = _weatherBandMidpointF(band);
  var nudge = (Math.abs(parseInt(seed, 10) || 0) % 5) - 2;
  if (base == null) return null;
  var out = base + nudge;
  if (info.minF != null) out = Math.max(info.minF, out);
  if (info.maxF != null) out = Math.min(info.maxF, out);
  return out;
}

function _weatherPeriodTempMap(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return {};
  var temps: any = {};
  var prevTemp: any = null;
  for (var i = 0; i < WEATHER_DAY_PERIODS.length; i++){
    var period = WEATHER_DAY_PERIODS[i];
    var pv = (rec.periods && rec.periods[period]) || _weatherPrimaryValues(rec) || rec.final;
    if (!pv) continue;
    var tempF = _weatherBandDisplayTempF(pv.temp, ((rec.serial || 0) * 37) + ((i + 1) * 19));
    if (tempF == null) continue;
    if (prevTemp != null){
      if (tempF > prevTemp + 12) tempF = prevTemp + 12;
      if (tempF < prevTemp - 12) tempF = prevTemp - 12;
    }
    temps[period] = tempF;
    prevTemp = tempF;
  }
  return temps;
}

function _weatherPeriodTempF(rec: any, period: any){
  var temps = _weatherPeriodTempMap(rec);
  return (temps && temps[period] != null) ? temps[period] : null;
}

function _weatherEmojiForValues(pv: any, cond: any){
  if (!pv) return '🌥️';
  cond = cond || { precipType: 'none' };
  if ((pv.wind|0) >= ((pv.precip|0) + 2) && (pv.precip|0) <= 3) return '💨';
  if (!cond.precipType) return '🌥️';
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
  if ((pv.wind|0) >= 3) return '💨';
  if ((pv.precip|0) >= 2) return '☁️';
  if ((pv.precip|0) >= 1) return '⛅';
  return '☀️';
}

function _weatherEmojiForRecord(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec || !rec.final) return '🌥️';
  var loc = rec.location || {};
  var cond = _deriveConditions(rec.final, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
  return _weatherEmojiForValues(rec.final, cond);
}

function _weatherEmojiForPeriod(rec: any, period: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return '🌥️';
  var loc = rec.location || {};
  var pv = (rec.periods && rec.periods[period]) || _weatherPrimaryValues(rec) || rec.final;
  var cond = _deriveConditions(pv, loc, period, rec.snowAccumulated, rec.fog && rec.fog[period]);
  return _weatherEmojiForValues(pv, cond);
}

function _weatherPhraseState(pv: any, cond: any){
  pv = pv || {};
  cond = cond || { precipType: 'none', fog: 'none' };
  if (cond.fog === 'dense' && (pv.precip|0) <= 1) return { phrase: 'dense fog', weight: 4 };
  if (cond.fog === 'light' && (pv.precip|0) <= 1) return { phrase: 'patchy fog', weight: 2 };
  switch (cond.precipType){
    case 'blizzard':    return { phrase: 'blizzard conditions', weight: 6 };
    case 'ice_storm':   return { phrase: 'an ice storm', weight: 6 };
    case 'deluge':      return { phrase: 'a deluge', weight: 6 };
    case 'heavy_rain':  return { phrase: 'heavy rain', weight: 5 };
    case 'snow':        return { phrase: 'snow', weight: 4 };
    case 'sleet':       return { phrase: 'sleet', weight: 4 };
    case 'rain':        return { phrase: 'steady rain', weight: 4 };
    case 'snow_light':  return { phrase: 'light snow', weight: 3 };
    case 'sleet_light': return { phrase: 'light sleet', weight: 3 };
    case 'rain_light':  return { phrase: 'light rain', weight: 3 };
  }
  if ((pv.wind|0) >= 3) return { phrase: 'storm winds', weight: 4 };
  if ((pv.wind|0) >= 2) return { phrase: 'breezy conditions', weight: 2 };
  if ((pv.precip|0) >= 2) return { phrase: 'overcast skies', weight: 2 };
  if ((pv.precip|0) >= 1) return { phrase: 'partly cloudy skies', weight: 1 };
  if ((pv.temp|0) <= 2) return { phrase: 'clear, cold weather', weight: 1 };
  if ((pv.temp|0) >= 10) return { phrase: 'clear, hot weather', weight: 1 };
  return { phrase: 'clear skies', weight: 0 };
}

function _weatherTransitionSentence(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return '';
  var earlyPeriod = (rec.periods && rec.periods.morning) ? 'morning' : 'early_morning';
  var latePeriod = (rec.periods && rec.periods.evening) ? 'evening' : 'nighttime';
  var loc = rec.location || {};
  var earlyVals = (rec.periods && rec.periods[earlyPeriod]) || _weatherPrimaryValues(rec) || rec.final;
  var lateVals = (rec.periods && rec.periods[latePeriod]) || _weatherPrimaryValues(rec) || rec.final;
  var earlyCond = _deriveConditions(earlyVals, loc, earlyPeriod, rec.snowAccumulated, rec.fog && rec.fog[earlyPeriod]);
  var lateCond = _deriveConditions(lateVals, loc, latePeriod, rec.snowAccumulated, rec.fog && rec.fog[latePeriod]);
  var earlyState = _weatherPhraseState(earlyVals, earlyCond);
  var lateState = _weatherPhraseState(lateVals, lateCond);
  if (earlyState.phrase === lateState.phrase){
    return titleCase(earlyState.phrase) + ' holds through the day.';
  }
  var connector = (lateState.weight > earlyState.weight) ? 'gives way to' : 'turns to';
  return titleCase(earlyState.phrase) + ' in the morning ' + connector + ' ' + lateState.phrase + ' by evening.';
}

function _weatherWeekdayLabelForSerial(serial: any){
  var cal = getCal();
  var wdCount = Math.max(1, weekLength()|0);
  var base = parseInt(cal.current.day_of_the_week, 10) || 0;
  var today = todaySerial();
  var idx = ((base + ((serial|0) - today)) % wdCount + wdCount) % wdCount;
  return cal.weekdays[idx] || ('Day ' + (idx + 1));
}

function _weatherForecastRows(serials: any[], rowPlan?: any){
  var rows: any[] = [];
  var idx = 0;
  var plan = Array.isArray(rowPlan) ? rowPlan.slice() : [];
  for (var pi = 0; pi < plan.length && idx < serials.length; pi++){
    var size = Math.max(1, parseInt(plan[pi], 10) || 1);
    rows.push(serials.slice(idx, idx + size));
    idx += size;
  }
  while (idx < serials.length){
    rows.push(serials.slice(idx, idx + 3));
    idx += 3;
  }
  return rows;
}

function _weatherForecastCellHtml(serial: any){
  var rec = _weatherRecordForDisplay(_forecastRecord(serial));
  var d = fromSerial(serial);
  var dateLabel = esc(_displayMonthDayParts(d.mi, d.day).label);
  if (!rec || !rec.final){
    return '<div data-weather-forecast-cell="empty" style="min-height:74px;display:flex;flex-direction:column;justify-content:center;opacity:.55;">' +
      '<div style="font-size:.74em;line-height:1.1;">' + dateLabel + '</div>' +
      '<div style="margin-top:5px;">No forecast</div>' +
      '</div>';
  }
  var temps = _weatherDayTempRange(rec);
  var title = _weatherMiniCellTitle(serial);
  var titleAttr = title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : '';
  var lowText = temps ? (temps.lowF + 'F') : '—';
  var highText = temps ? (temps.highF + 'F') : '—';
  return '<div data-weather-forecast-cell="1"' + titleAttr + ' style="min-height:74px;display:flex;flex-direction:column;justify-content:space-between;">' +
    '<div style="font-size:.72em;opacity:.7;line-height:1.1;">' + dateLabel + '</div>' +
    '<div style="font-size:1.3em;line-height:1;text-align:center;margin:5px 0 8px 0;">' + _weatherEmojiForRecord(rec) + '</div>' +
    '<div style="display:flex;width:100%;font-size:.8em;font-weight:bold;">' +
      '<span style="flex:1;text-align:center;color:#1565C0;">' + esc(lowText) + '</span>' +
      '<span style="flex:1;text-align:center;color:#B71C1C;">' + esc(highText) + '</span>' +
    '</div>' +
    '</div>';
}

function _weatherHeaderBarHtml(label: any, color: any){
  return '<div style="margin:6px 0 2px 0;padding:4px 6px;border:1px solid rgba(0,0,0,.15);border-bottom:none;background:rgba(0,0,0,.04);">' +
    '<span style="display:inline-block;padding:1px 8px;border:1px solid rgba(0,0,0,.28);border-radius:999px;background:rgba(255,255,255,.84);font-weight:bold;color:' + esc(color) + ';">' + esc(label) + '</span>' +
  '</div>';
}

function _weatherLowHighText(temps: any){
  if (!temps) return '—';
  return String(temps.lowF) + 'F  ' + String(temps.highF) + 'F';
}

function _weatherRecordForSurfaceSerial(serial: any, opts?: any){
  opts = opts || {};
  if (opts.recordForSerial) return _weatherRecordForDisplay(opts.recordForSerial(serial));
  return _weatherRecordForDisplay(_forecastRecord(serial) || _historyRecord(serial));
}

function _weatherMiniCellTitleForSerial(serial: any, opts?: any){
  opts = opts || {};
  var rec = _weatherRecordForSurfaceSerial(serial, opts);
  if (!rec || !rec.final) return null;
  var period = (opts.currentPeriodForToday && serial === todaySerial() && isTimeOfDayActive())
    ? (currentTimeBucket() || WEATHER_PRIMARY_PERIOD)
    : WEATHER_PRIMARY_PERIOD;
  var pv = (rec.periods && rec.periods[period]) || _weatherPrimaryValues(rec) || rec.final;
  var cond = _deriveConditions(pv, rec.location || {}, period, rec.snowAccumulated, rec.fog && rec.fog[period]);
  return _conditionsNarrative(pv, cond, period);
}

function _weatherCalendarOpenHtml(mi: any, year: any){
  var cal = getCal();
  var wdCnt = Math.max(1, weekLength()|0);
  var monthObj = cal.months[mi] || {};
  var monthColor = resolveColor(colorForMonth(mi)) || '#555555';
  var fillColor = sanitizeHexColor(monthColor) || '#555555';
  var textOnFill = textColor(fillColor);
  var headers: any[] = [];
  for (var i = 0; i < wdCnt; i++){
    headers.push('<th style="' + STYLES.th + 'padding:4px 2px;">' +
      '<span style="display:inline-block;padding:1px 6px;border:1px solid rgba(0,0,0,.22);border-radius:999px;background:rgba(255,255,255,.82);font-weight:bold;color:' + esc(monthColor) + ';">' +
        esc(cal.weekdays[i] || ('Day ' + (i + 1))) +
      '</span>' +
    '</th>');
  }
  return '<table style="' + STYLES.table + 'table-layout:fixed;width:100%;margin:0 0 6px 0;">' +
    '<tr><th colspan="' + wdCnt + '" style="' + STYLES.head + 'padding:0;">' +
      '<div style="padding:4px 6px;background:' + esc(fillColor) + ';color:' + esc(textOnFill) + ';font-weight:bold;">' +
        esc(monthObj.name) +
        '<span style="float:right;">' + esc(String(year)) + ' YK</span>' +
      '</div>' +
    '</th></tr>' +
    '<tr>' + headers.join('') + '</tr>';
}

function _weatherCalendarCellHtml(serial: any, opts?: any){
  opts = opts || {};
  var d = fromSerial(serial);
  var inMonth = !!opts.inMonth;
  var showContent = !!opts.showContent;
  var rec = showContent ? _weatherRecordForSurfaceSerial(serial, opts) : null;
  var isToday = (serial === todaySerial());
  var title = showContent ? _weatherMiniCellTitleForSerial(serial, opts) : null;
  var titleAttr = title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : '';
  var cellStyle = STYLES.td + 'vertical-align:top;padding:3px 4px;';
  if (isToday) cellStyle += STYLES.today;
  if (!inMonth) cellStyle += 'opacity:.38;';
  else if (!showContent) cellStyle += 'opacity:.58;';

  var middle = '&nbsp;';
  var details = '<div style="font-size:.74em;opacity:.55;text-align:center;">&nbsp;</div>';
  var revealLine = '';
  if (showContent && rec && rec.final){
    var useCurrentPeriod = !!(opts.currentPeriodForToday && isToday && isTimeOfDayActive());
    var temps = _weatherDayTempRange(rec);
    if (useCurrentPeriod){
      middle = _weatherEmojiForPeriod(rec, currentTimeBucket() || WEATHER_PRIMARY_PERIOD);
    } else {
      middle = _weatherEmojiForRecord(rec);
    }
    details = '<div style="display:flex;width:100%;font-size:.74em;font-weight:bold;">' +
      '<span style="flex:1;text-align:center;color:#1565C0;">' + esc(temps ? (temps.lowF + 'F') : '\u2014') + '</span>' +
      '<span style="flex:1;text-align:center;color:#B71C1C;">' + esc(temps ? (temps.highF + 'F') : '\u2014') + '</span>' +
    '</div>';
    if (opts.showRevealTier !== false){
      revealLine = _weatherRevealTierHtml(serial, opts);
    }
  }

  return '<td data-weather-forecast-cell="' + (showContent ? '1' : 'empty') + '"' + titleAttr + ' style="' + cellStyle + '">' +
    '<div style="min-height:76px;display:flex;flex-direction:column;">' +
      '<div style="padding-bottom:3px;border-bottom:1px solid rgba(0,0,0,.10);text-align:center;font-size:.78em;line-height:1.1;">' + esc(inMonth ? String(d.day) : '') + '</div>' +
      '<div style="padding:5px 0;border-bottom:1px solid rgba(0,0,0,.10);text-align:center;font-size:1.15em;line-height:1;">' + middle + '</div>' +
      '<div style="padding-top:4px;">' + details + revealLine + '</div>' +
    '</div>' +
  '</td>';
}

function _weatherCalendarRangeHtml(startSerial: any, endSerial: any, opts?: any){
  opts = opts || {};
  var start = parseInt(startSerial, 10);
  var end = parseInt(endSerial, 10);
  if (!isFinite(start) || !isFinite(end)){
    return '<div data-weather-forecast-grid="empty" style="opacity:.65;margin-top:4px;">No forecast available.</div>';
  }
  if (end < start){
    var swap = start;
    start = end;
    end = swap;
  }
  var months = _monthsFromRangeSpec({ start: start, end: end, title: String(opts.title || 'Forecast') });
  var wdCnt = Math.max(1, weekLength()|0);
  var out = ['<div data-weather-forecast-grid="1" style="margin-top:' + (opts.tight ? '4px' : '6px') + ';">'];
  for (var i = 0; i < months.length; i++){
    var m = months[i];
    var monthObj = getCal().months[m.mi] || {};
    var mdays = Math.max(1, monthObj.days|0);
    var monthStart = toSerial(m.y, m.mi, 1);
    var monthEnd = toSerial(m.y, m.mi, mdays);
    var segStart = Math.max(start, monthStart);
    var segEnd = Math.min(end, monthEnd);
    if (segEnd < segStart) continue;
    var segStartDate = fromSerial(segStart);
    var segEndDate = fromSerial(segEnd);
    var firstRow = weekStartSerial(segStartDate.year, segStartDate.mi, segStartDate.day);
    var lastRow = weekStartSerial(segEndDate.year, segEndDate.mi, segEndDate.day);
    out.push('<div style="' + STYLES.wrap + '">' + _weatherCalendarOpenHtml(m.mi, m.y));
    for (var rowStart = firstRow; rowStart <= lastRow; rowStart += wdCnt){
      out.push('<tr>');
      for (var c = 0; c < wdCnt; c++){
        var ser = rowStart + c;
        var d = fromSerial(ser);
        var inMonth = (d.year === m.y && d.mi === m.mi);
        var inWindow = (ser >= start && ser <= end);
        var showContent = inWindow && (!opts.knownSerials || !!opts.knownSerials[String(ser)]);
        out.push(_weatherCalendarCellHtml(ser, {
          inMonth: inMonth,
          showContent: showContent,
          currentPeriodForToday: opts.currentPeriodForToday,
          recordForSerial: opts.recordForSerial,
          revealForSerial: opts.revealForSerial,
          revealLocation: opts.revealLocation,
          weatherState: opts.weatherState,
          showRevealTier: opts.showRevealTier
        }));
      }
      out.push('</tr>');
    }
    out.push(closeMonthTable() + '</div>');
  }
  out.push('</div>');
  return out.join('');
}

function _weatherForecastGridHtml(serials: any[], opts?: any){
  opts = opts || {};
  if (!serials || !serials.length){
    return '<div data-weather-forecast-grid="empty" style="opacity:.65;margin-top:4px;">No forecast available.</div>';
  }
  var knownSerials: any = {};
  for (var i = 0; i < serials.length; i++) knownSerials[String(serials[i])] = 1;
  return _weatherCalendarRangeHtml(serials[0], serials[serials.length - 1], {
    tight: opts.tight,
    knownSerials: opts.knownSerials || knownSerials,
    currentPeriodForToday: opts.currentPeriodForToday,
    recordForSerial: opts.recordForSerial,
    revealForSerial: opts.revealForSerial,
    revealLocation: opts.revealLocation,
    weatherState: opts.weatherState,
    showRevealTier: opts.showRevealTier
  });
}

function _weatherDetailedMechanicsHtml(cond: any){
  if (ensureSettings().weatherMechanicsEnabled === false) return '';
  return _conditionsMechHtml(cond);
}

function _weatherInsertLighting(cond: any, rec: any, period: any){
  cond = deepClone(cond || {});
  if (!cond.mechanics) cond.mechanics = { visibility: [], movement: [], combat: [], exposure: [], other: [] };
  if (!cond.mechanics.visibility) cond.mechanics.visibility = [];
  try {
    var lightSnap = currentLightSnapshot(rec.serial, (((rec.periods || {})[period] || {}).precip) || 0);
    if (!isTimeOfDayActive()){
      if (lightSnap && lightSnap.label) cond.mechanics.visibility.unshift('Lighting: ' + lightSnap.label + ' (Moonlight)');
    } else if (lightSnap && lightSnap.mode !== 'day'){
      cond.mechanics.visibility.unshift('Lighting: ' + lightSnap.label + ' (Moonlight)');
    }
  } catch(eLight){}
  return cond;
}

function _weatherActiveMechanicsSectionHtml(rec: any, opts?: any){
  opts = opts || {};
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return '<div data-weather-mechanics="active" style="margin-top:6px;"><b>Active Mechanics</b><div style="opacity:.65;margin-top:3px;">No weather data.</div></div>';
  var period = opts.period || (isTimeOfDayActive() ? currentTimeBucket() : WEATHER_PRIMARY_PERIOD);
  var pv = (rec.periods && rec.periods[period]) || _weatherPrimaryValues(rec) || rec.final || {};
  var cond = _weatherInsertLighting(
    _deriveConditions(pv, rec.location || {}, period, rec.snowAccumulated, rec.fog && rec.fog[period]),
    rec,
    period
  );
  var out = ['<div data-weather-mechanics="active" style="margin-top:6px;">'];
  out.push('<div style="font-weight:bold;">Active Mechanics</div>');
  if (opts.sourceLabel){
    out.push('<div style="font-size:.78em;opacity:.55;font-style:italic;margin-top:1px;">' + esc(opts.sourceLabel) + '</div>');
  }
  if (opts.allowDetailed && ensureSettings().weatherMechanicsEnabled !== false){
    var detailed = _weatherDetailedMechanicsHtml(cond);
    if (detailed) out.push(detailed);
    else out.push('<div style="font-size:.88em;opacity:.68;margin-top:3px;">No special weather mechanics currently active.</div>');
  } else {
    out.push('<div style="font-size:.82em;opacity:.65;margin-top:3px;">No special weather mechanics currently active.</div>');
  }
  out.push('</div>');
  return out.join('');
}

function _weatherTodayGridHtml(rec: any){
  rec = _weatherRecordForDisplay(rec);
  if (!rec) return '<div data-weather-tod-grid="empty" style="opacity:.65;">No weather generated for today.</div>';
  var d = fromSerial(rec.serial || todaySerial());
  var monthColor = resolveColor(colorForMonth(d.mi)) || '#555555';
  var activePeriod = isTimeOfDayActive() ? currentTimeBucket() : null;
  var head: any[] = ['<tr>'];
  var cells: any[] = ['<tr>'];
  for (var i = 0; i < WEATHER_DAY_PERIODS.length; i++){
    var period = WEATHER_DAY_PERIODS[i];
    var pv = (rec.periods && rec.periods[period]) || _weatherPrimaryValues(rec) || rec.final || {};
    var tempF = _weatherPeriodTempF(rec, period);
    var cellStyle = STYLES.td + 'vertical-align:top;padding:4px 2px;' + ((activePeriod && activePeriod === period) ? STYLES.today : '');
    var tooltip = esc(_conditionsNarrative(pv, _deriveConditions(pv, rec.location || {}, period, rec.snowAccumulated, rec.fog && rec.fog[period]), period));
    head.push('<th style="' + STYLES.th + 'padding:4px 2px;" data-weather-tod-header="' + period + '">' + esc(_weatherToDHeaderLabel(period)) + '</th>');
    cells.push('<td style="' + cellStyle + '" data-weather-period="' + period + '" title="' + tooltip + '" aria-label="' + tooltip + '">' +
      '<div style="min-height:72px;display:grid;grid-template-rows:1fr 1fr 1fr;align-items:center;">' +
      '<div>&nbsp;</div>' +
      '<div style="font-size:1.25em;line-height:1;text-align:center;">' + _weatherEmojiForPeriod(rec, period) + '</div>' +
      '<div style="font-size:.86em;font-weight:bold;text-align:center;">' + esc(tempF == null ? '—' : (tempF + 'F')) + '</div>' +
      '</div></td>');
  }
  head.push('</tr>');
  cells.push('</tr>');
  return '<div data-weather-tod-grid="1">' +
    _weatherHeaderBarHtml(currentDateLabel(), monthColor) +
    '<table style="' + STYLES.table + 'width:100%;table-layout:fixed;margin:0 0 8px 0;">' +
      head.join('') + cells.join('') +
    '</table>' +
  '</div>';
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

      var wxStyle = STYLES.td + 'line-height:1;padding:1px 0;';
      var wxText = '&nbsp;';
      var wxAttr = '';
      if (inMonthWanted){
        var rec = _forecastRecord(ser);
        var emoji = _weatherEmojiForRecord(rec);
        var temps = _weatherDayTempRange(rec);
        var tempLine = '';
        if (temps){
          tempLine = '<div style="font-size:.5em;line-height:1;margin-top:1px;white-space:nowrap;">' +
            temps.lowF + '/' + temps.highF + '</div>';
        }
        wxText = '<div style="font-size:1.05em;line-height:1;">' + emoji + '</div>' + tempLine;
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
  var start = startSerial|0;
  var span = Math.max(1, days|0);
  var end = start + span - 1;
  return _weatherCalendarRangeHtml(start, end, {
    knownSerials: opts.knownSerials || null,
    currentPeriodForToday: !!opts.currentPeriodForToday,
    recordForSerial: opts.recordForSerial
  });
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

function _weatherForecastFootprint(tier: any){
  if (tier === 'high') return 9;
  if (tier === 'medium') return 5;
  return 2;
}

function _weatherEmbeddedForecastRowPlan(limit: any){
  limit = Math.max(1, parseInt(limit, 10) || 1);
  if (limit <= 2) return [limit];
  if (limit <= 5) return [2, Math.max(1, limit - 2)];
  return [3, 3, 3];
}

function _playerWeatherKnownData(maxDays: any){
  var ws = getWeatherState();
  var today = todaySerial();
  var capDays = Math.max(1, parseInt(maxDays, 10) || CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);

  weatherEnsureForecast();
  _grantCommonWeatherReveals(ws, today);

  var days: any[] = [];
  var bestFutureTier: any = null;
  for (var i = 0; i < capDays; i++){
    var ser = today + i;
    var rev = _weatherRevealForSerial(ws, ser, ws.location);
    if (!rev.tier) continue;
    var rec = _forecastRecord(ser);
    if (!rec) continue;
    days.push({
      serial: ser,
      rec: rec,
      rev: rev,
      sourceLabel: WEATHER_SOURCE_LABELS[rev.source] || null
    });
    if (ser > today){
      bestFutureTier = bestFutureTier ? _bestTier(bestFutureTier, rev.tier) : rev.tier;
    }
  }

  if (!days.length) return null;

  return {
    ws: ws,
    today: today,
    todayDay: days[0],
    todayTier: days[0].rev.tier || 'low',
    days: days,
    futureDays: days.filter(function(day: any){ return day.serial > today; }),
    bestFutureTier: bestFutureTier || 'low',
    locationLabel: _weatherLocationLabel(ws.location)
  };
}

function playerWeatherListWhisper(m: any){
  var data = _playerWeatherKnownData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!data || !data.todayDay){
    whisper(m.who, _menuBox("Today's Weather", '<div style="opacity:.7;">Conditions not available.</div>'));
    return;
  }
  whisper(m.who, _menuBox("Today's Weather",
    _playerDayHtml(data.todayDay.rec, data.todayTier, true, data.todayDay.sourceLabel) +
    '<div style="margin-top:4px;">' +
      button('Calendar', 'weather') + ' ' +
      button('Forecast', 'weather forecast') + ' ' +
      button('Forecast List', 'weather forecast list') +
    '</div>'
  ));
}

function _playerForecastListBody(data: any){
  var blocks: any[] = [];
  for (var i = 0; i < data.days.length; i++){
    var day = data.days[i];
    blocks.push(_playerDayHtml(day.rec, day.rev.tier, day.serial === data.today, day.sourceLabel));
  }
  blocks.push('<div style="margin-top:4px;">' +
    button('Calendar', 'weather forecast') + ' ' +
    button('Today', 'weather') +
  '</div>');
  return blocks.join('');
}

function _weatherSerialRange(start: any, end: any){
  var out: any[] = [];
  for (var ser = start; ser <= end; ser++) out.push(ser);
  return out;
}

function _weatherAnchorStartForToday(serial: any){
  var d = fromSerial(serial);
  var rowStart = weekStartSerial(d.year, d.mi, d.day);
  return serial === rowStart ? (serial - 1) : rowStart;
}

function _weatherPlayerCalendarWindow(data: any){
  var today = data.today;
  var end = today;
  for (var i = 0; i < data.days.length; i++){
    var ser = data.days[i].serial;
    if (ser > today + 19) continue;
    if (ser <= today + 9 || ser > end) end = ser;
  }
  end = Math.min(end, today + 19);
  return {
    start: _weatherAnchorStartForToday(today),
    end: end
  };
}

function _playerWeatherCalendarHtml(data: any){
  var window = _weatherPlayerCalendarWindow(data);
  var knownSerials: any = {};
  for (var i = 0; i < data.days.length; i++){
    if (data.days[i].serial > window.end) continue;
    knownSerials[String(data.days[i].serial)] = 1;
  }
  var rec = _weatherRecordForDisplay(data.todayDay.rec);
  return '' +
    '<div data-weather-view="today-calendar-player">' +
      '<div style="font-size:.85em;opacity:.75;">📍 ' + esc(data.locationLabel) + '</div>' +
      _weatherTodayGridHtml(rec) +
      '<div style="font-size:.86em;font-style:italic;margin:0 0 4px 0;">' + esc(_weatherTransitionSentence(rec)) + '</div>' +
      _weatherActiveMechanicsSectionHtml(rec, {
        allowDetailed: data.todayTier !== 'low',
        sourceLabel: data.todayDay.sourceLabel
      }) +
      _weatherForecastGridHtml(_weatherSerialRange(window.start, window.end), {
        tight: true,
        knownSerials: knownSerials,
        currentPeriodForToday: true
      }) +
      '<div style="font-size:.78em;opacity:.6;margin-top:4px;">Only revealed future weather is shown.</div>' +
    '</div>';
}

function playerWeatherCalendarWhisper(m: any){
  var data = _playerWeatherKnownData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!data || !data.todayDay){
    whisper(m.who, _menuBox("Today's Weather", '<div style="opacity:.7;">Conditions not available.</div>'));
    return;
  }
  whisper(m.who, _menuBox("Today's Weather", _playerWeatherCalendarHtml(data)));
}

function _playerForecastCalendarHtml(data: any){
  var window = _weatherPlayerCalendarWindow(data);
  var knownSerials: any = {};
  for (var i = 0; i < data.days.length; i++){
    if (data.days[i].serial > window.end) continue;
    knownSerials[String(data.days[i].serial)] = 1;
  }
  return '' +
    '<div data-weather-view="forecast-calendar-player">' +
      '<div style="font-size:.85em;opacity:.75;margin-bottom:2px;">📍 ' + esc(data.locationLabel) + '</div>' +
      _weatherForecastGridHtml(_weatherSerialRange(window.start, window.end), {
        knownSerials: knownSerials,
        currentPeriodForToday: true
      }) +
      '<div style="font-size:.78em;opacity:.6;margin-top:2px;">Only revealed days are shown. Player knowledge level shown in cell.</div>' +
    '</div>';
}

function playerForecastCalendarWhisper(m: any){
  var data = _playerWeatherKnownData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
  if (!data){
    whisper(m.who, _menuBox('Weather Forecast', '<div style="opacity:.7;">No forecast has been shared with you yet.</div>'));
    return;
  }
  whisper(m.who, _menuBox('Your Weather Forecast — ' + data.locationLabel, _playerForecastCalendarHtml(data)));
}

function _weatherManagementControlsHtml(serial: any){
  return '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
    '<div style="margin:4px 0;">' +
      button('Weather System Management', 'weather manage ?{Action|' +
        'Regenerate Weather,reset|' +
        'Toggle Weather On/Off,toggleweather|' +
        'Toggle Extreme Hazards,togglehazards|' +
        'Toggle Mechanics,togglemechanics|' +
        'Erase and Reset System,reseed' +
      '}') +
    '</div>';
}

function weatherTodayCalendarGmHtml(){
  var ws  = getWeatherState();
  var ser = todaySerial();
  var rec = _weatherRecordForDisplay(_forecastRecord(ser));
  var loc = ws.location;

  if (!loc){
    return _menuBox('Weather',
      '<div style="opacity:.7;">No location set.</div>' +
      '<div style="margin-top:4px;">' + button('&#128205; Set Location', 'weather location') + '</div>'
    );
  }

  var manifestEntries = _activeManifestZoneEntries();
  var manifestLine = manifestEntries.length
    ? '<div style="font-size:.82em;opacity:.7;margin-top:2px;">Manifest zones: <b>' + esc(_manifestZoneStatusLabel(manifestEntries)) + '</b></div>'
    : '';
  var arythLine = _isArythFull(ser)
    ? '<div style="font-size:.8em;opacity:.65;margin-top:2px;">Aryth is full. Consider a manifest zone.</div>'
    : '';
  var tidalLine = '';
  var geo = (loc.geography || 'inland').toLowerCase();
  if (geo === 'coastal' || geo === 'island' || geo === 'coastal_bluff'){
    try {
      var tideIdx = getTidalIndex(ser);
      tidalLine = '<div style="font-size:.82em;opacity:.75;margin-top:2px;">🌊 Tides: <b>' + esc(tidalLabel(tideIdx)) + '</b> (' + tideIdx + '/10)</div>';
    } catch(eTide){}
  }
  var summaryLine = rec
    ? '<div style="font-size:.86em;font-style:italic;margin:0 0 4px 0;">' + esc(_weatherTransitionSentence(rec)) + '</div>'
    : '<div style="opacity:.6;margin-top:4px;">No weather generated for today.</div>';
  var gmDefaultForecastDays = Math.max(1, Math.min(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS, 10));
  var gmForecastEnd = ser + gmDefaultForecastDays - 1;
  var forecastSerials = _weatherSerialRange(_weatherAnchorStartForToday(ser), gmForecastEnd);
  var gmVisibleSerials = _weatherSerialRange(ser, gmForecastEnd);
  var gmKnownSerials: any = {};
  for (var gi = 0; gi < gmVisibleSerials.length; gi++) gmKnownSerials[String(gmVisibleSerials[gi])] = 1;
  var todayHandoutLinks = [
    handoutButton('Open Weather Handout', 'weather'),
    handoutButton('Weather Mechanics', 'weather:mechanics')
  ].filter(Boolean).join(' ');
  var mediumRow = '<div style="margin-top:4px;">' +
    button('Reveal Medium Forecast', 'weather reveal medium ?{Days|1|3|6|10}') +
  '</div>';
  var highRow = '<div style="margin-top:4px;">' +
    button('Reveal High Forecast', 'weather reveal high ?{Days|1|3|6|10}') +
  '</div>';
  var specificRow = '<div style="margin-top:4px;">' + button('Reveal High Custom Dates', 'weather reveal ?{Date or range|14-17}') + '</div>';
  var gmRevealTier = function(){
    return { tier: 'high', source: 'gm' };
  };
  var extremeHtml = rec ? _extremeEventPanelHtml(rec) : '';

  return _menuBox("Today's Weather",
    '<div data-weather-view="today-calendar-gm">' +
      (isTimeOfDayActive() ? '<div style="font-size:.85em;opacity:.72;margin:0 0 2px 0;">' + esc(currentTimeOfDayLabel()) + '</div>' : '') +
      '<div style="font-size:.85em;opacity:.75;">📍 ' + esc(_weatherLocationLabel(loc)) + '</div>' +
      manifestLine +
      arythLine +
      tidalLine +
      _weatherTodayGridHtml(rec) +
      summaryLine +
      _weatherActiveMechanicsSectionHtml(rec, { allowDetailed: true }) +
      _weatherForecastGridHtml(forecastSerials, {
        tight: true,
        currentPeriodForToday: true,
        knownSerials: gmKnownSerials,
        revealForSerial: gmRevealTier
      }) +
      extremeHtml +
      '<div style="margin-top:6px;">' + button('History', 'weather history') + '</div>' +
      '<div style="margin-top:4px;">' + button('GM Forecast', 'weather forecast') + '</div>' +
      '<div style="margin-top:4px;">' + button('Send Revealed', 'weather send') + '</div>' +
      (todayHandoutLinks ? '<div style="margin-top:4px;">' + todayHandoutLinks + '</div>' : '') +
      '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      mediumRow + highRow + specificRow +
      '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      '<div style="margin:4px 0;">' + button('&#128205; Set Location', 'weather location') + '</div>' +
      '<div style="margin:4px 0;">' + button('Set Manifest Zone', 'weather manifest') + '</div>' +
      '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      '<div style="margin:4px 0;">' + button('Reroll Today', 'weather reroll') + '</div>' +
      _weatherManagementControlsHtml(ser) +
    '</div>'
  );
}

function weatherForecastCalendarGmHtml(daysOverride?: any){
  var ws = getWeatherState();
  var today = todaySerial();
  var forecastDays = _weatherViewDays(daysOverride != null ? daysOverride : Math.min(CONFIG_WEATHER_FORECAST_DAYS, 20));
  var rangeStart = _weatherAnchorStartForToday(today);
  var rangeEnd = today + forecastDays - 1;
  var serials = _weatherSerialRange(rangeStart, rangeEnd);
  var knownSerials: any = {};
  for (var i = today; i <= rangeEnd; i++) knownSerials[String(i)] = 1;

  return _menuBox(forecastDays + '-Day GM Forecast',
    '<div data-weather-view="forecast-calendar-gm">' +
      '<div style="font-size:.85em;opacity:.75;margin-bottom:2px;">📍 ' + esc(_weatherLocationLabel(ws.location)) + '</div>' +
      _weatherForecastGridHtml(serials, {
        knownSerials: knownSerials,
        currentPeriodForToday: true
      }) +
    '</div>'
  );
}

function weatherForecastGmHtml(daysOverride?: any){
  var st    = ensureSettings();
  var today = todaySerial();
  var rows: any[]  = [];
  var forecastDays = _weatherViewDays(daysOverride != null ? daysOverride : st.weatherForecastViewDays);
  st.weatherForecastViewDays = forecastDays;

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
    button('Calendar','weather forecast '+forecastDays)+' '+
    button('5d','weather forecast 5')+' '+
    button('9d','weather forecast 9')+' '+
    button('20d','weather forecast 20')+' '+
    button('Today','weather')+
    '</div>';
  var body = '<table style="'+STYLES.table+'">'+head+rows.join('')+'</table>';
  var forecastHandoutLinks = [
    handoutButton('Open Weather Handout', 'weather'),
    handoutButton('Weather Mechanics', 'weather:mechanics')
  ].filter(Boolean).join(' ');

  return _menuBox(forecastDays+'-Day Forecast',
    topControls+
    _weatherTodaySummaryHtml(today, null, false)+
    body+
    '<div style="margin-top:6px;">'+
    (st.weatherMechanicsEnabled !== false ? button('📋 Today\'s Mechanics','weather mechanics')+' ' : '')+
    button('Reroll Today','weather reroll '+today)+' '+
    button('Regenerate All','weather generate')+
    '</div>' +
    (forecastHandoutLinks ? '<div style="margin-top:4px;">' + forecastHandoutLinks + '</div>' : '')
  );
}

function weatherHistoryGmHtml(){
  var ws  = getWeatherState();

  if (!ws.history || !ws.history.length){
    return _menuBox('Weather History','<div style="opacity:.7;">No history yet.</div>');
  }
  var recent = ws.history.slice().reverse().slice(0,20).reverse();
  var start = recent[0].serial;
  var end = recent[recent.length - 1].serial;
  return _menuBox('Weather History (last 20)',
    '<div data-weather-view="history-calendar-gm">' +
      _weatherCalendarRangeHtml(start, end, {
        recordForSerial: function(serial: any){ return _historyRecord(serial); },
        showRevealTier: false
      }) +
    '</div>'
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
    if (rec.serial < today) return;
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

  _refreshWeatherHandout();
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
    '<table style="'+STYLES.table+'">'+head+rows.join('')+'</table>'
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
    _refreshWeatherHandout();
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
    _refreshWeatherHandout();
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
  _refreshWeatherHandout();
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
      playerForecastCalendarWhisper(m);
    } else if (sub === 'list' || (sub === 'today' && String(args[2] || '').toLowerCase() === 'list')){
      playerWeatherCalendarWhisper(m);
    } else {
      playerWeatherCalendarWhisper(m);
    }
    return;
  }

  switch(sub){
    case '':
    case 'today':
      weatherEnsureForecast();
      whisper(m.who, weatherTodayCalendarGmHtml());
      break;

    case 'list':
      weatherEnsureForecast();
      whisper(m.who, weatherTodayCalendarGmHtml());
      break;

    case 'forecast':
      var viewTok = String(args[2] || '').trim().toLowerCase();
      if (viewTok && viewTok !== 'list'){
        var viewDays = parseInt(viewTok, 10);
        if (!/^\d+$/.test(viewTok) || viewDays < 1 || viewDays > CONFIG_WEATHER_FORECAST_DAYS){
          warnGM('Usage: weather forecast [1-'+CONFIG_WEATHER_FORECAST_DAYS+']');
          break;
        }
        ensureSettings().weatherForecastViewDays = _weatherViewDays(viewDays);
      }
      weatherEnsureForecast();
      whisper(m.who, weatherForecastCalendarGmHtml(viewTok && viewTok !== 'list' ? ensureSettings().weatherForecastViewDays : null));
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
        whisper(m.who, weatherTodayCalendarGmHtml());
        break;
      }
      warnGM('Usage: weather send');
      whisper(m.who, weatherTodayCalendarGmHtml());
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
      _refreshWeatherHandout();
      whisper(m.who, weatherTodayCalendarGmHtml());
      break;
    }

    case 'event': {
      if (!_weatherHazardsEnabled()){
        warnGM('Extreme hazards are disabled. Re-enable them with !cal settings hazards on.');
        whisper(m.who, weatherTodayCalendarGmHtml());
        break;
      }
      var evtSub = String(args[2]||'').toLowerCase();
      var evtKey = String(args[3]||'').toLowerCase();
      var evtDetailMode = String(args[4]||'event').toLowerCase();
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
            button('📣 Send To Players','weather event send '+evtKey)+' '+
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
              button('📣 Send To Players','weather event send '+evtKey)+' '+
              button('Forecast','weather forecast')+
            '</div>'
          ));
        } else {
          whisper(m.who, _menuBox('Extreme Event Roll',
            '<div><b>🎲 Result:</b> conditions were not quite right. No event this time.</div>'+
            '<div style="margin-top:5px;">'+
              button('Forecast','weather forecast')+
            '</div>'
          ));
        }
      } else if (evtSub === 'send'){
        var evtSend = EXTREME_EVENTS[evtKey];
        sendToAll(_menuBox(evtSend.name,
          '<div style="font-size:1.05em;font-weight:bold;">' + esc(evtSend.emoji + ' ' + evtSend.name) + '</div>' +
          '<div style="margin-top:4px;">' + esc(evtSend.playerMsg(evtRec.location || {})) + '</div>'
        ));
        warnGM('Sent ' + evtSend.name + ' to players.');
      } else if (evtSub === 'details'){
        var detailsHtml = (evtDetailMode === 'system')
          ? _extremeEventSystemHtml()
          : _extremeEventDetailsHtml(evtKey, evtRec);
        var evtDef = EXTREME_EVENTS[evtKey];
        var evtPct = 0;
        if (evtDef){
          var evtEvents = _evaluateExtremeEvents(evtRec);
          for (var dei=0; dei<evtEvents.length; dei++){
            if (evtEvents[dei].key === evtKey){ evtPct = Math.round(evtEvents[dei].probability * 100); break; }
          }
        }
        whisper(m.who, _menuBox('Extreme Event Details',
          detailsHtml +
          '<div style="margin-top:5px;">'+
            button((evtDef ? evtDef.emoji : '⚠')+' Let\'s Do It', 'weather event trigger '+evtKey)+' '+
            button('🎲 Roll For It ('+evtPct+'%)', 'weather event roll '+evtKey)+' '+
            button('📣 Send To Players', 'weather event send '+evtKey)+
          '</div>'
        ));
      } else {
        warnGM('Usage: weather event trigger|roll|send|details <key>');
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
      _refreshWeatherHandout();
      whisper(m.who, 'Generated '+cnt+' day'+(cnt===1?'':'s')+' of weather.');
      whisper(m.who, weatherForecastCalendarGmHtml(ensureSettings().weatherForecastViewDays));
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
      var lockedRec = _forecastRecord(targetSer);
      if (lockedRec && lockedRec.locked){
        warnGM('Day ' + targetSer + ' is locked and cannot be rerolled.');
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
        if (nextRec2){
          var regenNext = _generateDayWeather(targetSer + 1, newRec, ws2.location || null);
          if (regenNext){
            var nextIdx2 = _forecastIndex(targetSer + 1);
            if (nextIdx2 >= 0) ws2.forecast[nextIdx2] = regenNext;
          }
        }
      }
      _refreshWeatherHandout();
      whisperUi(m.who, targetSer === todayNow ? "Regenerated Today's Weather" : ('Regenerated weather for day ' + targetSer + '.'));
      whisper(m.who, targetSer === todayNow ? weatherTodayCalendarGmHtml() : weatherForecastCalendarGmHtml(ensureSettings().weatherForecastViewDays));
      break;
    }

    case 'lock': {
      var todayLock = todaySerial();
      var targetLock = parseInt(args[2],10);
      if (!isFinite(targetLock)){
        warnGM('Usage: !cal weather lock <serial>');
        break;
      }
      if (targetLock < todayLock){
        warnGM('Cannot lock a past day.');
        break;
      }
      var lockRec = _forecastRecord(targetLock);
      if (!lockRec){
        warnGM('No forecast record found for day ' + targetLock + '.');
        break;
      }
      lockRec.locked = true;
      whisperUi(m.who, 'Locked weather for day ' + targetLock + '.');
      break;
    }

    case 'reseed': {
      var wsReseed = getWeatherState();
      wsReseed.forecast = [];
      wsReseed.history = [];
      weatherEnsureForecast();
      _refreshWeatherHandout();
      warnGM('All weather information erased and system reset.');
      whisper(m.who, weatherTodayCalendarGmHtml());
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
      _refreshWeatherHandout();
      warnGM('Weather regenerated. Player knowledge and reveal tags preserved.');
      whisper(m.who, weatherTodayCalendarGmHtml());
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
        _refreshWeatherHandout();
        whisper(m.who, weatherTodayCalendarGmHtml());
        break;
      }
      if (manageAction === 'togglehazards'){
        ensureSettings().weatherHazardsEnabled = (ensureSettings().weatherHazardsEnabled === false);
        _refreshWeatherHandout();
        whisper(m.who, weatherTodayCalendarGmHtml());
        break;
      }
      if (manageAction === 'togglemechanics'){
        ensureSettings().weatherMechanicsEnabled = (ensureSettings().weatherMechanicsEnabled === false);
        _refreshWeatherHandout();
        whisper(m.who, weatherTodayCalendarGmHtml());
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
          whisperUi(m.who, 'Unknown climate.');
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
          whisperUi(m.who, 'Unknown geography.');
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
          whisperUi(m.who, 'Unknown terrain.');
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
          whisperUi(m.who, 'That recent location is no longer available.');
          break;
        }
        _setWeatherLocationFromWizard(m, recentList[recentIdx]);
        break;
      }
      if (locSub === 'preset'){
        var presetIdx = Math.max(1, parseInt(args[3], 10) || 1) - 1;
        var savedList = getWeatherState().savedLocations || [];
        if (!savedList[presetIdx]){
          whisperUi(m.who, 'That saved location is no longer available.');
          break;
        }
        _setWeatherLocationFromWizard(m, savedList[presetIdx]);
        break;
      }
      if (locSub === 'save'){
        var presetName = _normalizeWeatherPresetName(args.slice(3).join(' '));
        var wsSave = getWeatherState();
        if (!wsSave.location){
          whisperUi(m.who, 'Set a weather location first.');
          break;
        }
        if (!presetName){
          whisperUi(m.who, 'Enter a preset name first.');
          break;
        }
        var saved = _saveWeatherLocationPreset(wsSave, wsSave.location, presetName);
        if (!saved){
          whisperUi(m.who, 'Could not save that preset.');
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
      whisper(m.who, weatherTodayCalendarGmHtml());
      break;
  }
}
