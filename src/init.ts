// Initialization + Test Exports
import { CALENDAR_SYSTEMS, CONFIG_DEFAULTS } from './config.js';
import { CALENDAR_STRUCTURE_SETS, SEASON_SETS, script_name, state_name } from './constants.js';
import { applyCalendarSystem, applySeasonSet, checkInstall, colorForMonth, deepClone, ensureSettings, getCal, refreshCalendarState, titleCase, weekLength } from './state.js';
import { _contrast, _relLum, _stableHash, colorsAPI, resolveColor, sanitizeHexColor, textColor } from './color.js';
import { _daysBeforeMonthInYear, _daysBeforeYear, _invalidateSerialCache, _isGregorianLeapYear, _leapsBefore, daysPerYear, fromSerial, toSerial, todaySerial, weekStartSerial, weekdayIndex } from './date-math.js';
import { monthIndexByName } from './parsing.js';
import { compareEvents, eventKey, eventsAPI, getEventColor, getEventsFor, isDefaultEvent, renderAPI } from './events.js';
import { _ordinal, clamp, esc, formatDateLabel } from './rendering.js';
import { _displayMonthDayParts, _subsystemIsVerbose, _subsystemVerbosityValue, addEventSmart, currentDateLabel, removeEvent, setDate, stepDays } from './ui.js';
import { _todayAllHtml, _todayWeatherIsStable } from './today.js';
import { notifySetupStatusOnReady } from './setup.js';
import { WEATHER_CLIMATES, WEATHER_DAY_PERIODS, WEATHER_PRIMARY_PERIOD, _bestTier, _clampWeatherTempBand, _composeFormula, _forecastRecord, _grantCommonWeatherReveals, _locSig, _parseWeatherRevealDateSpec, _parseWeatherRevealDayToken, _recordReveal, _rollTrait, _weatherRecordForDisplay, _weatherRevealBucket, _weatherRevealForSerial, _weatherTempInfo, _weatherTempLabel, getWeatherState, weatherEnsureForecast } from './weather.js';
import { register } from './boot-register.js';
import { MOON_SYSTEMS, _diskOverlapFraction, _eberronMoonCore, _eclipseLifecycleText, _eclipseMetricsAt, _eclipseNotableToday, _eclipseTimeBlock, _finalizeEclipseEvent, _moonHashStr, getEclipses, getMoonState, moonEnsureSequences, moonPhaseAt, nighttimeLightCondition, nighttimeLux } from './moon.js';
import { refreshAllPersistentViews } from './persistent-views.js';


/* ============================================================================
 * INITIALIZATION
 * ==========================================================================*/

on("ready", function(){
  checkInstall();
  refreshCalendarState(true);
  register();
  var currentDate = currentDateLabel();
  var stReady = ensureSettings();
  var sysReady = CALENDAR_SYSTEMS[stReady.calendarSystem] || {};
  var sysLabelReady = String(sysReady.label || 'Calendar');
  refreshAllPersistentViews({ autoBind: true });
  log(sysLabelReady + ' Running, current date: ' + currentDate);
  notifySetupStatusOnReady();
});


export var _public: Record<string, any> = {
  checkInstall: checkInstall,
  register: register,
  render: renderAPI,
  events: eventsAPI,
  colors: colorsAPI
};

// ── Test-only exports ─────────────────────────────────────────────────────
// When __CALENDAR_TEST_MODE__ is set (by test/roll20-shim.js), expose
// internal functions so tests can exercise core logic directly.
if (typeof globalThis !== 'undefined' && (globalThis as any).__CALENDAR_TEST_MODE__) {
  (_public as any)._test = {
    // date / serial math
    toSerial:            toSerial,
    fromSerial:          fromSerial,
    weekdayIndex:        weekdayIndex,
    daysPerYear:         daysPerYear,
    _daysBeforeYear:     _daysBeforeYear,
    _daysBeforeMonthInYear: _daysBeforeMonthInYear,
    _isGregorianLeapYear: _isGregorianLeapYear,
    _leapsBefore:        _leapsBefore,
    _invalidateSerialCache: _invalidateSerialCache,
    todaySerial:         todaySerial,

    // state helpers
    getCal:              getCal,
    ensureSettings:      ensureSettings,
    deepClone:           deepClone,
    checkInstall:        checkInstall,
    refreshCalendarState: refreshCalendarState,

    // calendar systems
    CALENDAR_SYSTEMS:    CALENDAR_SYSTEMS,
    applyCalendarSystem: applyCalendarSystem,
    applySeasonSet:      applySeasonSet,

    // date navigation
    stepDays:            stepDays,
    setDate:             setDate,
    currentDateLabel:    currentDateLabel,
    formatDateLabel:     formatDateLabel,
    monthIndexByName:    monthIndexByName,

    // events
    getEventsFor:        getEventsFor,
    addEventSmart:       addEventSmart,
    removeEvent:         removeEvent,
    eventKey:            eventKey,
    compareEvents:       compareEvents,
    getEventColor:       getEventColor,
    isDefaultEvent:      isDefaultEvent,

    // utilities
    _stableHash:         _stableHash,
    clamp:               clamp,
    esc:                 esc,
    titleCase:           titleCase,
    sanitizeHexColor:    sanitizeHexColor,
    resolveColor:        resolveColor,
    textColor:           textColor,
    _relLum:             _relLum,
    _contrast:           _contrast,
    weekLength:          weekLength,
    colorForMonth:       colorForMonth,

    // weather
    getWeatherState:     getWeatherState,
    _composeFormula:     _composeFormula,
    _rollTrait:          _rollTrait,
    _clampWeatherTempBand: _clampWeatherTempBand,
    _weatherTempLabel:   _weatherTempLabel,
    _weatherTempInfo:    _weatherTempInfo,

    // moons
    getMoonState:        getMoonState,
    _moonHashStr:        _moonHashStr,
    moonPhaseAt:         moonPhaseAt,
    moonEnsureSequences: moonEnsureSequences,
    MOON_SYSTEMS:        MOON_SYSTEMS,
    _eberronMoonCore:    _eberronMoonCore,
    nighttimeLux:        nighttimeLux,
    nighttimeLightCondition: nighttimeLightCondition,

    // verbosity
    _subsystemIsVerbose:    _subsystemIsVerbose,
    _subsystemVerbosityValue: _subsystemVerbosityValue,

    // today-view helpers
    _todayAllHtml:          _todayAllHtml,
    _todayWeatherIsStable:  _todayWeatherIsStable,
    _forecastRecord:        _forecastRecord,
    weatherEnsureForecast:  weatherEnsureForecast,
    _weatherRecordForDisplay: _weatherRecordForDisplay,

    // eclipse
    _diskOverlapFraction:    _diskOverlapFraction,
    _eclipseTimeBlock:       _eclipseTimeBlock,
    _eclipseMetricsAt:       _eclipseMetricsAt,
    _finalizeEclipseEvent:   _finalizeEclipseEvent,
    _eclipseLifecycleText:   _eclipseLifecycleText,
    _eclipseNotableToday:    _eclipseNotableToday,
    getEclipses:             getEclipses,

    // weather reveals
    _bestTier:               _bestTier,
    _locSig:                 _locSig,
    _weatherRevealBucket:    _weatherRevealBucket,
    _recordReveal:           _recordReveal,
    _weatherRevealForSerial: _weatherRevealForSerial,
    _grantCommonWeatherReveals: _grantCommonWeatherReveals,
    _parseWeatherRevealDayToken:  _parseWeatherRevealDayToken,
    _parseWeatherRevealDateSpec:  _parseWeatherRevealDateSpec,

    // harptos
    weekStartSerial:         weekStartSerial,
    _ordinal:                _ordinal,
    _displayMonthDayParts:   _displayMonthDayParts,
    CALENDAR_STRUCTURE_SETS: CALENDAR_STRUCTURE_SETS,

    // constants
    state_name:          state_name,
    CONFIG_DEFAULTS:     CONFIG_DEFAULTS,
    SEASON_SETS:         SEASON_SETS,
    WEATHER_CLIMATES:    WEATHER_CLIMATES,
    WEATHER_DAY_PERIODS: WEATHER_DAY_PERIODS,
    WEATHER_PRIMARY_PERIOD: WEATHER_PRIMARY_PERIOD,
  };
}
