// Section 17: Commands & Routing
import { script_name } from './constants.js';
import { ensureSettings, getCal } from './state.js';
import { todaySerial } from './date-math.js';
import { eventDisplayName, occurrencesInRange } from './events.js';
import { button, esc } from './rendering.js';
import { _displayMonthDayParts, _menuBox, _timeOfDayStatusHtml, currentDateLabel, taskCardHtml } from './ui.js';
import { isTimeOfDayActive } from './time-of-day.js';
import { _todayAllHtml, invokeEventSub } from './today.js';
import { WEATHER_SOURCE_LABELS, _forecastRecord, _playerDayHtml, _weatherRevealForSerial, getWeatherState, weatherEnsureForecast } from './weather.js';
import { MOON_SYSTEMS, _eclipseNotableToday, _moonPeakPhaseDay, _moonTodaySummaryHtml, _normalizeMoonRevealTier, getMoonState, moonEnsureSequences, moonPhaseAt } from './moon.js';
import { PLANE_PHASE_EMOJI, PLANE_PHASE_LABELS, _getAllPlaneData, _normalizePlaneRevealTier, _planarYearDays, _planesTodaySummaryHtml, getPlanarState, getPlanesState } from './planes.js';
export { send, sendToAll, sendToGM, sendUi, sendUiToAll, sendUiToGM, whisper, whisperUi, warnGM, warnGMUi, cleanWho } from './messaging.js';


/* ============================================================================
 * 17) COMMANDS & ROUTING
 * ==========================================================================*/

export function _normalizePackedWords(q){
  return String(q||'')
    .replace(/\b(nextmonth)\b/gi, 'next month')
    .replace(/\b(nextyear)\b/gi, 'next year')
    .replace(/\b(currentmonth|thismonth)\b/gi, 'month')
    .replace(/\b(thisyear)\b/gi, 'year')
    .replace(/\b(lastmonth)\b/gi, 'last month')
    .replace(/\b(lastyear)\b/gi, 'last year')
    .replace(/\b(previousmonth|prevmonth)\b/gi, 'previous month')
    .replace(/\b(previousyear|prevyear)\b/gi, 'previous year')
    .replace(/\b(next[-_]month)\b/gi,'next month')
    .replace(/\b(next[-_]year)\b/gi,'next year')
    .trim();
}

export function runEventsShortcut(m, a, sub){
  var args = a.slice(2);
  return invokeEventSub(m, String(sub||'list').toLowerCase(), args);
}

// Default !cal entrypoint routing:
// events minical first (if enabled), then other enabled subsystems.
export function _showDefaultCalView(m){
  weatherEnsureForecast();
  moonEnsureSequences();
  if (playerIsGM(m.playerid)){
    whisper(m.who, _todayAllHtml());
  } else {
    whisper(m.who, _playerTodayHtml(m.playerid));
  }
}

export function _playerPlanarActiveTodayLines(today, viewTier, genHorizon){
  var planes = _getAllPlaneData();
  var notes = [];
  var ignoreGenerated = (viewTier === 'low' || genHorizon <= 0);
  for (var i = 0; i < planes.length; i++){
    if (planes[i].type === 'fixed') continue;
    var ps = getPlanarState(planes[i].name, today, ignoreGenerated ? { ignoreGenerated:true } : null);
    if (!ps) continue;
    if (ps.phase !== 'coterminous' && ps.phase !== 'remote') continue;
    notes.push((PLANE_PHASE_EMOJI[ps.phase] || '⚪') + ' <b>' + esc(ps.plane.name) + '</b> ' + esc(PLANE_PHASE_LABELS[ps.phase] || ps.phase));
  }
  return notes;
}

export function _playerTodayHtml(playerid){
  var st = ensureSettings();
  var today = todaySerial();
  var cal = getCal();
  var c = cal.current;
  var mObj = cal.months[c.month] || {};
  var sections = [];
  var promptDate = String(cal.months[c.month].name || '') + ' ' + c.day_of_the_month + ' ' + c.year;

  var occNow = [];
  try { occNow = occurrencesInRange(today, today); } catch(e0){}
  var eventNames = [];
  var eventSeen = {};
  for (var oi0 = 0; oi0 < occNow.length; oi0++){
    var nm0 = eventDisplayName(occNow[oi0].e);
    var key0 = String(nm0 || '').toLowerCase();
    if (!eventSeen[key0]){
      eventSeen[key0] = 1;
      eventNames.push(nm0);
    }
  }

  sections.push(taskCardHtml(
    'Date',
    '<b>' + esc(currentDateLabel()) + '</b>' + (isTimeOfDayActive() ? '<div style="margin-top:3px;">' + _timeOfDayStatusHtml('font-size:.82em;opacity:.72;margin:0;') + '</div>' : ''),
    [
      button('Calendar','show month'),
      button('Forecast','forecast')
    ]
  ));

  sections.push(taskCardHtml(
    'Events Today',
    eventNames.length
      ? 'Today includes <b>' + eventNames.slice(0, 3).map(esc).join(', ') + '</b>' + (eventNames.length > 3 ? ' <span style="opacity:.7;">+' + (eventNames.length - 3) + ' more</span>' : '') + '.'
      : 'No calendar events are scheduled for today.',
    [
      button('Show Month','show month'),
      button('Weather','weather')
    ]
  ));

  var weatherSummary = 'Weather is currently off.';
  if (st.weatherEnabled !== false){
    try {
      weatherEnsureForecast();
      var recCard = _forecastRecord(today);
      if (recCard){
        var revCard = _weatherRevealForSerial(getWeatherState(), today, getWeatherState().location);
        weatherSummary = _playerDayHtml(recCard, revCard.tier || 'low', false, WEATHER_SOURCE_LABELS[revCard.source] || null);
      } else {
        weatherSummary = 'Conditions are not available right now.';
      }
    } catch(e1){
      weatherSummary = 'Conditions are not available right now.';
    }
  }
  sections.push(taskCardHtml(
    'Weather',
    weatherSummary,
    [
      button('Detail','weather'),
      button('Forecast','forecast')
    ]
  ));

  var moonSummary = 'Lunar tracking is currently off.';
  if (st.moonsEnabled !== false){
    try {
      moonEnsureSequences();
      var moonBitsCard = [];
      var moonSysCard = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      (moonSysCard.moons || []).forEach(function(moon){
        var peakType = _moonPeakPhaseDay(moon.name, today);
        if (peakType === 'full') moonBitsCard.push(moon.name + ' full');
        else if (peakType === 'new') moonBitsCard.push(moon.name + ' new');
      });
      moonSummary = moonBitsCard.length ? esc(moonBitsCard.join(' · ')) + '.' : 'No moons are at full or new today.';
    } catch(e2){
      moonSummary = 'Moon data is not available right now.';
    }
  }
  sections.push(taskCardHtml(
    'Moons',
    moonSummary,
    [
      button('Detail','moon'),
      button('Sky','moon sky'),
      button('Prompt !cal moon on','moon on ?{Date|' + promptDate + '}')
    ]
  ));

  var planeSummary = 'Planar tracking is currently off.';
  if (st.planesEnabled !== false){
    try {
      var psCard = getPlanesState();
      var planeTierCard = _normalizePlaneRevealTier(psCard.revealTier || 'medium');
      var planeHorizonCard = parseInt(psCard.revealHorizonDays, 10) || _planarYearDays();
      planeSummary = _planesTodaySummaryHtml(today, false, planeTierCard, planeHorizonCard);
    } catch(e3){
      planeSummary = 'Planar data is not available right now.';
    }
  }
  sections.push(taskCardHtml(
    'Planes',
    planeSummary,
    [
      button('Detail','planes'),
      button('Prompt !cal planes on','planes on ?{Date|' + promptDate + '}')
    ]
  ));

  return _menuBox('Today — ' + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label), sections.join(''));
}


