// Section 17: Commands & Routing
import { script_name } from './constants.js';
import { ensureSettings, getCal } from './state.js';
import { todaySerial } from './date-math.js';
import { eventDisplayName, occurrencesInRange } from './events.js';
import { button, esc } from './rendering.js';
import { _displayMonthDayParts, _menuBox, currentDateLabel, sendCurrentDate } from './ui.js';
import { invokeEventSub } from './today.js';
import { WEATHER_SOURCE_LABELS, _forecastRecord, _playerDayHtml, _weatherRevealForSerial, getWeatherState, weatherEnsureForecast } from './weather.js';
import { MOON_SYSTEMS, _eclipseNotableToday, _moonPeakPhaseDay, _moonTodaySummaryHtml, _normalizeMoonRevealTier, getMoonState, moonEnsureSequences, moonPhaseAt } from './moon.js';
import { PLANE_PHASE_EMOJI, PLANE_PHASE_LABELS, _getAllPlaneData, _normalizePlaneRevealTier, _planarYearDays, _planesTodaySummaryHtml, getPlanarState, getPlanesState } from './planes.js';


/* ============================================================================
 * 17) COMMANDS & ROUTING
 * ==========================================================================*/

export function send(opts, html){
  opts = opts || {};
  var to = cleanWho(opts.to);
  var prefix;
  if (opts.broadcast)   prefix = '/direct ';
  else if (opts.gmOnly) prefix = '/w gm ';
  else if (to)          prefix = '/w "' + to + '" ';
  else                  prefix = '/direct ';
  sendChat(script_name, prefix + html);
}

export function sendToAll(html){ send({ broadcast:true }, html); }
export function sendToGM(html){  send({ gmOnly:true }, html); }
export function whisper(to, html){ send({ to:to }, html); }
export function warnGM(msg){ sendChat(script_name, '/w gm ' + msg); }

export function cleanWho(who){
  return String(who||'').replace(/\s+\(GM\)$/,'').replace(/["\\]/g,'').trim();
}

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
  // !cal → show the month calendar with subsystem highlights.
  // Priority: events (default), then moons, weather, planes.
  sendCurrentDate(m.who, false, {
    playerid: m.playerid,
    dashboard: true,
    includeButtons: true
  });
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

  sections.push('<div style="font-weight:bold;margin-bottom:4px;">' +
    esc(currentDateLabel()) + '</div>');

  try {
    var occ = occurrencesInRange(today, today);
    if (occ.length){
      var names = [];
      var seen = {};
      for (var oi = 0; oi < occ.length; oi++){
        var nm = eventDisplayName(occ[oi].e);
        var key = String(nm || '').toLowerCase();
        if (!seen[key]){
          seen[key] = 1;
          names.push(nm);
        }
      }
      sections.push('<div style="margin:3px 0;">🎉 <b>Events:</b> ' + names.map(esc).join(', ') + '</div>');
    }
  } catch(e){}

  if (st.weatherEnabled !== false){
    try {
      weatherEnsureForecast();
      var rec = _forecastRecord(today);
      if (rec){
        var rev = _weatherRevealForSerial(getWeatherState(), today, getWeatherState().location);
        var tier = rev.tier || 'low';
        var srcLabel = WEATHER_SOURCE_LABELS[rev.source] || null;
        sections.push('<div style="margin:4px 0 2px 0;"><b>☁ Weather:</b></div>' + _playerDayHtml(rec, tier, false, srcLabel));
      }
    } catch(e2){}
  }

  if (st.moonsEnabled !== false){
    try {
      moonEnsureSequences();
      var ms = getMoonState();
      var moonTier = _normalizeMoonRevealTier(ms.revealTier || 'medium');
      var moonHorizon = parseInt(ms.revealHorizonDays, 10) || 7;
      var moonBits = [];
      var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      if (sys && sys.moons){
        for (var mi = 0; mi < sys.moons.length; mi++){
          var moon = sys.moons[mi];
          var peakType = _moonPeakPhaseDay(moon.name, today);
          if (peakType === 'full') moonBits.push('🌕 <b>' + esc(moon.name) + '</b> is Full');
          else if (peakType === 'new'){
            var ph = moonPhaseAt(moon.name, today);
            moonBits.push('🌑 <b>' + esc(moon.name) + '</b> is New' + ((ph && ph.longShadows) ? ' <span style="opacity:.7;">(Long Shadows)</span>' : ''));
          }
        }
      }
      sections.push(
        '<div style="margin:4px 0 2px 0;"><b>🌙 Moons:</b></div>' +
        _moonTodaySummaryHtml(today, moonTier, moonHorizon) +
        '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' +
        (moonBits.length ? moonBits.join('<br>') : '<span style="opacity:.6;">No moons at full or new today.</span>') +
        '</div>' +
        (moonTier === 'high' && _eclipseNotableToday(today).length
          ? '<div style="font-size:.82em;margin:3px 0 0 8px;line-height:1.5;">'+_eclipseNotableToday(today).join('<br>')+'</div>'
          : '')
      );
    } catch(e3){}
  }

  if (st.planesEnabled !== false){
    try {
      var ps = getPlanesState();
      var planeTier = _normalizePlaneRevealTier(ps.revealTier || 'medium');
      var planeHorizon = parseInt(ps.revealHorizonDays, 10) || _planarYearDays();
      var planeGenHorizon = parseInt(ps.generatedHorizonDays, 10) || 0;
      var planeNotes = _playerPlanarActiveTodayLines(today, planeTier, planeGenHorizon);
      sections.push(
        '<div style="margin:4px 0 2px 0;"><b>🌀 Planes:</b></div>' +
        _planesTodaySummaryHtml(today, false, planeTier, planeHorizon) +
        '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' +
        (planeNotes.length ? planeNotes.join('<br>') : '<span style="opacity:.6;">No active planar extremes today.</span>') +
        '</div>'
      );
    } catch(e4){}
  }

  sections.push('<div style="margin-top:6px;">' +
    button('⬅ Calendar', '') + ' ' +
    button('🌤 Weather', 'weather') + ' ' +
    button('🌙 Moons', 'moon') + ' ' +
    button('🌀 Planes', 'planes') +
    '</div>');

  return _menuBox('📋 Today — ' + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label), sections.join(''));
}



