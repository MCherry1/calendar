// Sections 13+15+16: Roll20 State Interaction & UI + Themes + GM Buttons
import { CALENDAR_SYSTEMS, CALENDAR_SYSTEM_ORDER, CONFIG_DEFAULTS, CONFIG_WEATHER_FORECAST_DAYS, CONFIG_WEATHER_LABELS } from './config.js';
import { COLOR_THEMES, CONTRAST_MIN_HEADER, LABELS, NAMED_COLORS, SEASON_SETS, STYLES, THEME_ORDER, script_name, state_name } from './constants.js';
import { _seasonNames, _sourceAllowedForCalendar, applySeasonSet, deepClone, defaults, ensureSettings, getCal, refreshAndSend, titleCase } from './state.js';
import { applyBg, popColorIfPresent, resolveColor, sanitizeHexColor } from './color.js';
import { _isLeapMonth, _nextActiveMi, _prevActiveMi, fromSerial, regularMonthIndex, toSerial, todaySerial, weekdayIndex } from './date-math.js';
import { DaySpec, Parse, monthIndexByName } from './parsing.js';
import { _addConcreteEvent, buildCalendarsHtmlForSpec, defaultKeyFor, eventDisplayName, eventIndexByKey, markSuppressedIfDefault, occurrencesInRange } from './events.js';
import { _decKey, _eventSeriesKey, _ordinal, button, clamp, esc, formatDateLabel, int, mbP, monthEventsHtml, navP, swatchHtml } from './rendering.js';
import { send, sendToAll, sendToGM, sendUiToGM, warnGM, whisper, whisperUi } from './commands.js';
import { bucketLabel, clearTimeOfDay, currentTimeBucket, isTimeOfDayActive } from './time-of-day.js';
import { WEATHER_PRIMARY_PERIOD, _activeManifestZoneEntries, _activeManifestZonesForSerial, _conditionsMechHtml, _conditionsNarrative, _deriveConditions, _forecastRecord, _grantCommonWeatherReveals, _isZarantyrFull, _manifestZoneInfluenceText, _manifestZoneOnDateChange, _manifestZoneStatusLabel, _tempBand, _weatherPrimaryFog, _weatherRecordForDisplay, _weatherTraitBadge, getWeatherState, weatherEnsureForecast } from './weather.js';
import { MOON_SYSTEMS, _eclipseNotableToday, _getMoonSys, _moonNextEvent, _moonPeakPhaseDay, _moonPhaseEmoji, getLongShadowsMoons, getTidalIndex, moonEnsureSequences, moonPhaseAt, tidalLabel } from './moon.js';
import { PLANE_PHASE_EMOJI, PLANE_PHASE_LABELS, _getAllPlaneData, _isGeneratedNote, _planarNotableToday, _planarYearDays, getActivePlanarEffects, getPlanarState } from './planes.js';
import { dateFormatFor } from './worlds/index.js';


/* ============================================================================
 * 13) Roll20 State Interaction & UI
 * ==========================================================================*/

export function currentDateLabel(){
  var cal = getCal(), cur = cal.current;
  var fmt = dateFormatFor(ensureSettings().calendarSystem);
  if (fmt === 'ordinal_of_month'){
    return formatDateLabel(cur.year, cur.month, cur.day_of_the_month, true);
  }
  var datePart = _displayMonthDayParts(cur.month, cur.day_of_the_month).label;
  return cal.weekdays[cur.day_of_the_week] + ", " +
         datePart + ", " +
         cur.year + " " + LABELS.era;
}

export function currentTimeOfDayLabel(){
  var bucket = currentTimeBucket();
  return bucket ? bucketLabel(bucket) : '';
}

export function _timeOfDayStatusHtml(style?){
  if (!isTimeOfDayActive()) return '';
  return '<div style="' + (style || 'font-size:.82em;opacity:.72;margin-top:2px;') + '">Current time: ' +
    esc(currentTimeOfDayLabel()) + '</div>';
}

export function dateLabelFromSerial(serial){
  var cal = getCal();
  var d = fromSerial(serial);
  var fmt = dateFormatFor(ensureSettings().calendarSystem);
  if (fmt === 'ordinal_of_month'){
    return formatDateLabel(d.year, d.mi, d.day, true);
  }
  var wd = cal.weekdays[weekdayIndex(d.year, d.mi, d.day)];
  var datePart = _displayMonthDayParts(d.mi, d.day).label;
  return wd + ", " + datePart + ", " + d.year + " " + LABELS.era;
}

export function nextForDayOnly(cur, day, monthsLen){
  var months = getCal().months;
  var want = Math.max(1, day|0);
  var m = cur.month, y = cur.year;

  if (want <= (months[m].days|0) && cur.day_of_the_month <= want &&
      (!months[m].leapEvery || _isLeapMonth(months[m], y))) {
    return { month: m, year: y };
  }

  for (var i = 0; i < monthsLen * 2; i++){
    m = (m + 1) % monthsLen;
    if (m === 0) y++;
    // Skip inactive leap-only months (e.g. Shieldmeet in a non-leap year).
    if (months[m].leapEvery && !_isLeapMonth(months[m], y)) continue;
    if (want <= (months[m].days|0)) return { month: m, year: y };
  }
  var _nxt = _nextActiveMi(cur.month, cur.year);
  return { month: _nxt.mi, year: _nxt.y };
}

export function nextForMonthDay(cur, mIndex, d){
  var mdays = getCal().months[mIndex].days;
  var day = clamp(d, 1, mdays);
  var serialNow = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var serialCand = toSerial(cur.year, mIndex, day);
  if (serialCand >= serialNow) return { year: cur.year };
  return { year: cur.year + 1 };
}

// Returns the display-facing season label for a given calendar position.
// For season sets with transitions (e.g. gregorian), computes the season from
// the exact day rather than just the month. For all others, returns month.season.
export function _getSeasonLabel(mi, day){
  var st    = ensureSettings();
  var sv    = st.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
  var entry = SEASON_SETS[sv] || {};
  if (!entry.transitions){
    // No transition table — read from month.season (set by applySeasonSet, hemisphere-shifted).
    return getCal().months[mi].season || null;
  }
  // Gregorian-style: pick the right transition array based on hemisphere.
  var hem = st.hemisphere || CONFIG_DEFAULTS.hemisphere;
  var tr  = (hem === 'south' && entry.transitionsSouth) ? entry.transitionsSouth : entry.transitions;
  var rmi = regularMonthIndex(mi);
  var cur = rmi * 1000 + (day|0);
  var best = null, bestScore = -1;
  for (var i = 0; i < tr.length; i++){
    var score = tr[i].mi * 1000 + tr[i].day;
    if (score <= cur && score > bestScore){ bestScore = score; best = tr[i].season; }
  }
  // Before the first transition of the year: wrap to the last.
  return best || (tr.length ? tr[tr.length - 1].season : null);
}

export function _uiDensityValue(explicit){
  var d = String(explicit || ensureSettings().uiDensity || CONFIG_DEFAULTS.uiDensity || 'compact').toLowerCase();
  return (d === 'normal') ? 'normal' : 'compact';
}

export function _normalizeDisplayMode(mode){
  var m = String(mode || '').toLowerCase();
  if (m === 'calendar' || m === 'list' || m === 'both') return m;
  return 'both';
}

export function _nextDisplayMode(mode){
  var m = _normalizeDisplayMode(mode);
  if (m === 'both') return 'calendar';
  if (m === 'calendar') return 'list';
  return 'both';
}

export function _displayModeLabel(mode){
  var m = _normalizeDisplayMode(mode);
  if (m === 'calendar') return 'Calendar';
  if (m === 'list') return 'List';
  return 'Both';
}

export function _subsystemVerbosityValue(){
  var v = String(ensureSettings().subsystemVerbosity || CONFIG_DEFAULTS.subsystemVerbosity || 'normal').toLowerCase();
  return (v === 'minimal') ? 'minimal' : 'normal';
}

export function _subsystemIsVerbose(){
  return _subsystemVerbosityValue() !== 'minimal';
}

export function _legendLine(items){
  if (!items || !items.length) return '';
  return '<div style="font-size:.76em;opacity:.55;margin:4px 0 6px 0;">Legend: '+items.map(esc).join(' · ')+'</div>';
}

export function _displayMonthDayParts(mi, day){
  var cal = getCal();
  var st = ensureSettings();
  var m = cal.months[mi] || {};
  var fmt = dateFormatFor(st.calendarSystem);
  if (fmt === 'ordinal_of_month'){
    if (m.isIntercalary){
      return { monthName: String(m.name || (mi + 1)), day: day, label: String(m.name || (mi + 1)) };
    }
    return {
      monthName: String(m.name || (mi + 1)),
      day: day,
      label: _ordinal(day) + ' of ' + String(m.name || (mi + 1))
    };
  }
  if (fmt === 'month_day_year' && m.isIntercalary && String(m.name||'') === 'Leap Day'){
    return { monthName: 'February', day: 29, label: 'February 29' };
  }
  return {
    monthName: String(m.name || (mi + 1)),
    day: day,
    label: String(day) + ' ' + String(m.name || (mi + 1))
  };
}

export function _serialToDateSpec(serial){
  var d = fromSerial(serial|0);
  var parts = _displayMonthDayParts(d.mi, d.day);
  return parts.monthName + ' ' + d.day + ' ' + d.year;
}

export function _shiftSerialByMonth(serial, dir){
  var d = fromSerial(serial|0);
  var step = (dir < 0) ? _prevActiveMi(d.mi, d.year) : _nextActiveMi(d.mi, d.year);
  var md = Math.max(1, (getCal().months[step.mi] || {}).days|0);
  var day = clamp(d.day, 1, md);
  return toSerial(step.y, step.mi, day);
}

export function _weatherViewDays(n){
  var days = parseInt(n, 10);
  if (!isFinite(days)) return CONFIG_DEFAULTS.weatherForecastViewDays;
  if (days < 1) return 1;
  if (days > CONFIG_WEATHER_FORECAST_DAYS) return CONFIG_WEATHER_FORECAST_DAYS;
  return days;
}

export function _playerButtonsHtml(){
  var out = [];
  var st = ensureSettings();
  out.push('<div>'+button('◀ Prev','show previous month')+' '+button('Next ▶','show next month')+'</div>');
  if (st.weatherEnabled !== false) out.push('<div>'+button('🌤 Weather','weather')+'</div>');
  if (st.moonsEnabled   !== false) out.push('<div>'+button('🌙 Moons','moon')+'</div>');
  if (st.planesEnabled  !== false) out.push('<div>'+button('🌀 Planes','planes')+'</div>');
  return out.join('');
}

export function sendCurrentDate(to, gmOnly, opts?){
  opts = opts || {};
  var st = ensureSettings();
  var density = _uiDensityValue(opts.density);
  var dashboard = !!opts.dashboard;
  var compact = !!opts.compact || (!dashboard && density === 'compact');
  var includeButtons = (opts.includeButtons === undefined) ? (st.autoButtons !== false) : !!opts.includeButtons;
  var audienceIsGM = !!gmOnly;
  if (!audienceIsGM && to && opts.playerid) audienceIsGM = !!playerIsGM(opts.playerid);
  if (!audienceIsGM && opts.audienceIsGM === true) audienceIsGM = true;

  var cal = getCal(), c = cal.current;
  var m   = cal.months[c.month];
  var todaySer = toSerial(c.year, c.month, c.day_of_the_month);
  var calHtml = '';
  if (!compact || dashboard){
    // Build a spec for the current month so buildCalendarsHtmlForSpec can
    // attach adjacent strips when today is in the first or last calendar row.
    var monthStart = toSerial(c.year, c.month, 1);
    var monthEnd   = toSerial(c.year, c.month, m.days|0);
    var spec = {
      start:  monthStart,
      end:    monthEnd,
      months: [{ y: c.year, mi: c.month }],
      title:  m.name + ' ' + c.year + ' ' + LABELS.era
    };
    calHtml = buildCalendarsHtmlForSpec(spec);
  }

  // Date headline: weekday, date, year, season
  var _seasonLabel = _getSeasonLabel(c.month, c.day_of_the_month);
  var currentDate = currentDateLabel();
  var timeLine = _timeOfDayStatusHtml(compact
    ? 'font-size:.82em;opacity:.72;margin:0 0 3px 0;'
    : 'font-size:.85em;opacity:.72;margin:0 0 4px 0;');
  var dateLine = compact
    ? '<div style="font-weight:bold;margin:2px 0 3px 0;">' +
      esc(currentDate) +
      (_seasonLabel ? ' &nbsp;<span style="opacity:.7;font-weight:normal;">— ' + esc(_seasonLabel) + '</span>' : '') +
      '</div>'
    : '<div style="font-weight:bold;margin:3px 0;">' +
      esc(currentDate) +
      (_seasonLabel ? ' &nbsp;<span style="opacity:.7;font-weight:normal;font-size:.9em;">— ' + esc(_seasonLabel) + '</span>' : '') +
      '</div>';

  // Events this month (labeled only when events exist)
  var eventsBlock = (function(){
    if (compact || dashboard) return '';
    var inner = monthEventsHtml(c.month, c.day_of_the_month);
    if (!inner) return '';
    return '<div style="margin-top:5px;font-size:.85em;opacity:.7;">Events this month:</div>' + inner;
  }());

  // Moon highlights — only show moons at notable phases (Full/New today, or arriving within 2 days)
  var moonLine = '';
  if (ensureSettings().moonsEnabled !== false){
    try {
      moonEnsureSequences();
      var _sys = _getMoonSys();
      if (_sys && _sys.moons){
        var _notable = [];

        _sys.moons.forEach(function(moon){
          var ph = moonPhaseAt(moon.name, todaySer);
          var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
          var _thisNotable = false;
          var titleTag = '';

          // Full or New right now? Use peak detection for single-day reports.
          var _peakType = _moonPeakPhaseDay(moon.name, todaySer);
          if (_peakType === 'full'){
            _notable.push(emoji + ' <b>' + esc(moon.name) + '</b>' + titleTag + ' is Full');
            _thisNotable = true;
            return;
          }
          if (_peakType === 'new'){
            var newLabel = ph.longShadows
              ? emoji + ' <b>' + esc(moon.name) + '</b>' + titleTag + ' goes dark (Long Shadows)'
              : emoji + ' <b>' + esc(moon.name) + '</b>' + titleTag + ' is New';
            _notable.push(newLabel);
            _thisNotable = true;
            return;
          }

          // Full or New arriving within 2 days?
          var nFull = _moonNextEvent(moon.name, todaySer, 'full');
          var nNew  = _moonNextEvent(moon.name, todaySer, 'new');
          var dFull = nFull ? Math.ceil(nFull - todaySer) : 999;
          var dNew  = nNew  ? Math.ceil(nNew  - todaySer) : 999;

          if (dFull <= 2){
            var fEmoji = '\uD83C\uDF15'; // 🌕
            _notable.push(fEmoji + ' <b>' + esc(moon.name) + '</b>' + titleTag + ' Full ' + (dFull === 1 ? 'tomorrow' : 'in 2 days'));
            _thisNotable = true;
          } else if (dNew <= 2){
            var nEmoji = '\uD83C\uDF11'; // 🌑
            _notable.push(nEmoji + ' <b>' + esc(moon.name) + '</b>' + titleTag + ' New ' + (dNew === 1 ? 'tomorrow' : 'in 2 days'));
            _thisNotable = true;
          }

          // Ascendant: moon's plane is coterminous (skip if already notable for phase)
          if (audienceIsGM && !_thisNotable && moon.plane && ensureSettings().planesEnabled !== false){
            try {
              var _aPs = getPlanarState(moon.plane, todaySer);
              if (_aPs && _aPs.phase === 'coterminous')
                _notable.push('\u2728 <b>' + esc(moon.name) + '</b>' + titleTag + ' ascendant');
            } catch(e2){}
          }
        });

        if (_notable.length){
          moonLine = '<div style="font-size:.82em;opacity:.7;margin-top:3px;line-height:1.6;">' +
            _notable.join('<br>') +
            '</div>';
        }

        // Eclipse highlights
        try {
          var _eclNotes = _eclipseNotableToday(todaySer);
          if (_eclNotes.length){
            moonLine += '<div style="' +
              applyBg('font-size:.82em;opacity:.9;margin-top:2px;display:inline-block;padding:1px 4px;border-radius:3px;',
                      '#FFE8A3', CONTRAST_MIN_HEADER) +
              '">' +
              _eclNotes.join(' &nbsp;&middot;&nbsp; ') +
              '</div>';
          }
        } catch(e3){ /* eclipse engine not ready */ }
      }
    } catch(e){ /* moon system not ready yet — skip silently */ }
  }

  // Compact weather line (low tier — what anyone can see looking at the sky)
  var weatherLine = '';
  if (ensureSettings().weatherEnabled !== false){
    try {
      var _ws = getWeatherState();
      // Only show weather if a location has been configured
      if (_ws.location){
        weatherEnsureForecast();
        var _wxRec    = _weatherRecordForDisplay(_forecastRecord(todaySer));
        if (_wxRec && _wxRec.final){
          var _f  = _wxRec.final;
          var _tL = CONFIG_WEATHER_LABELS.temp[_f.temp] || _tempBand(_f.temp);
          var _wxLoc   = _wxRec.location || {};
          var _wxCond  = _deriveConditions(_f, _wxLoc, WEATHER_PRIMARY_PERIOD, _wxRec.snowAccumulated, _weatherPrimaryFog(_wxRec));
          var _wxNarr = _conditionsNarrative(_f, _wxCond, WEATHER_PRIMARY_PERIOD);
          weatherLine = '<div style="font-size:.82em;opacity:.65;margin-top:2px;">' +
            '\u2601\uFE0F ' + esc(_wxNarr) +
            '</div>';
          // Auto-record low-tier common-knowledge reveal for the short common window.
          _grantCommonWeatherReveals(_ws, todaySer);
        }
      }
    } catch(e){ /* weather not ready — skip silently */ }
  }

  // Planar highlights — only show planes with notable current state
  var planesLine = '';
  if (audienceIsGM && ensureSettings().planesEnabled !== false){
    try {
      var _plNotes = _planarNotableToday(todaySer);
      if (_plNotes.length){
        planesLine = '<div style="font-size:.82em;opacity:.7;margin-top:2px;line-height:1.6;">' +
          _plNotes.join('<br>') +
          '</div>';
      }
    } catch(e){ /* planes not ready — skip silently */ }
  }

  var todayEventsLine = '';
  try {
    var occ = occurrencesInRange(todaySer, todaySer);
    if (occ.length){
      var seenNames = {};
      var names = [];
      for (var oi = 0; oi < occ.length; oi++){
        var nm = eventDisplayName(occ[oi].e);
        var keyNm = String(nm || '').toLowerCase();
        if (!seenNames[keyNm]){
          seenNames[keyNm] = 1;
          names.push(nm);
        }
      }
      var shown = names.slice(0, 3).map(esc).join(', ');
      var more = names.length > 3 ? (' <span style="opacity:.65;">+' + (names.length - 3) + ' more</span>') : '';
      todayEventsLine = '<div style="font-size:.82em;opacity:.75;margin-top:2px;">🎉 ' + shown + more + '</div>';
    } else if (dashboard) {
      todayEventsLine = '<div style="font-size:.82em;opacity:.6;margin-top:2px;">🎉 No calendar events today.</div>';
    }
  } catch(e4){}

  var msgCore;
  if (dashboard){
    msgCore = calHtml + dateLine + timeLine + todayEventsLine + moonLine + weatherLine + planesLine;
  } else if (compact){
    msgCore = '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:4px 0;">' +
      dateLine + timeLine + todayEventsLine + moonLine + weatherLine + planesLine +
      '</div>';
  } else {
    msgCore = calHtml + dateLine + timeLine + moonLine + weatherLine + planesLine + eventsBlock;
  }

  var controls = '';
  if (includeButtons && (gmOnly || to)){
    var isGmRecipient = !!gmOnly || !!(opts.playerid && playerIsGM(opts.playerid));
    var controlsHtml = isGmRecipient ? gmButtonsHtml() : _playerButtonsHtml();
    if (controlsHtml) controls = '<div style="margin-top:2px;">' + controlsHtml + '</div>';
  }
  var publicMsg = msgCore + controls;

  if (gmOnly)    { sendToGM(publicMsg); }
  else if (to)   { whisper(to, publicMsg); }
  else           { sendToAll(publicMsg); }
}

export function _parseSharpColorToken(tok){
  if (!tok || tok[0] !== '#') return null;
  var raw = tok.slice(1).trim();
  var hex = sanitizeHexColor('#'+raw);
  if (hex) return hex;
  var named = NAMED_COLORS[String(raw).toLowerCase()] || null;
  return named;
}

export function parseDatePrefixForAdd(tokens){
  tokens = (tokens || []).filter(Boolean);
  if (!tokens.length) return null;

  var cal = getCal(), cur = cal.current, months = cal.months;

  var r = Parse.looseMDY(tokens.slice(0,3));
  if (r){
    if (r.kind === 'dayOnly'){
      var nx = nextForDayOnly(cur, r.day, months.length);
      var d  = clamp(r.day, 1, months[nx.month].days|0);
      return { used: 1, mHuman: nx.month+1, day: d, year: nx.year };
    } else {
      var d2 = clamp(r.day, 1, months[r.mi].days|0);
      var y  = (r.year != null) ? r.year : nextForMonthDay(cur, r.mi, d2).year;
      return { used: (r.year!=null)?3:2, mHuman: r.mi+1, day: d2, year: y };
    }
  }

  var t0  = tokens[0];
  var od  = Parse.ordinalDay(t0);
  var num = /^\d+$/.test(t0) ? (parseInt(t0,10)|0) : null;
  var dd  = (od != null) ? od : num;
  if (dd != null){
    var nx2 = nextForDayOnly(cur, dd, months.length);
    var d3  = clamp(dd, 1, months[nx2.month].days|0);
    return { used: 1, mHuman: nx2.month+1, day: d3, year: nx2.year };
  }
  return null;
}

export function addEventSmart(tokens){
  tokens = (tokens || []).filter(function(t){ return String(t).trim() !== '--'; });

  var pref = parseDatePrefixForAdd(tokens);
  if (!pref) { warnGM('Usage: !cal add [MM DD [YYYY] | <MonthName> DD [YYYY] | DD] NAME [#COLOR|color]'); return; }

  var rest = tokens.slice(pref.used);
  var pulled = popColorIfPresent(rest, true);
  var color  = pulled.color;
  var name   = (pulled.tokens.join(' ').trim() || 'Untitled Event');

  var ok = _addConcreteEvent(pref.mHuman, String(pref.day), pref.year, name, color);
  if (ok){ refreshAndSend(); warnGM('Added 1 event.'); }
  else   { warnGM('No event added (duplicate or invalid).'); }
}

export function addMonthlySmart(tokens){
  tokens = (tokens || []).filter(function(t){ return String(t).trim() !== '--'; });
  if (!tokens.length){
    return warnGM('Usage: !cal addmonthly <daySpec> NAME [#COLOR|color]\n'
      + 'daySpec can be N, N-M, or "first|second|third|fourth|fifth|last <weekday>" (also "every <weekday>").');
  }

  var daySpec = null, used = 0;

  if (tokens[1]){
    var two = (tokens[0] + ' ' + tokens[1]).toLowerCase().trim();
    if (Parse.ordinalWeekday.fromSpec(two)){ daySpec = two; used = 2; }
  }

  if (!daySpec){
    var one = String(tokens[0]).toLowerCase().trim();
    if (/^\d+(-\d+)?$/.test(one)) {
      daySpec = one; used = 1;
    } else {
      var asNum = Parse.ordinalDay(one);
      if (asNum != null) { daySpec = String(asNum); used = 1; }
    }
  }

  if (!daySpec){
    return warnGM('Couldn\u2019t parse daySpec. Try: 6  |  18-19  |  "first far"  |  "last zor"  |  "every sul".');
  }

  var pulled = popColorIfPresent(tokens.slice(used), true);
  var color  = pulled.color;
  var name   = (pulled.tokens.join(' ').trim() || 'Untitled Event');

  var cal = getCal(), added = 0;
  for (var m = 1; m <= cal.months.length; m++){
    if (_addConcreteEvent(m, daySpec, null, name, color)) added++;
  }
  refreshAndSend();
  warnGM('Added '+added+' monthly event'+(added===1?'':'s')+' for "'+esc(name)+'" on '+esc(daySpec)+'.');
}

export function addYearlySmart(tokens){
  tokens = (tokens || []).filter(function(t){ return String(t).trim() !== '--'; });
  if (!tokens.length){
    return warnGM('Usage: !cal addyearly <Month> <DD|DD-DD|ordinal-day> NAME [#COLOR|color]\n'
      + '   or: !cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> NAME [#COLOR|color]');
  }

  var cal = getCal();
  var used = 0, mHuman = null, daySpec = null;

  // (A) Ordinal weekday with explicit month
  (function tryOrdinalWeekdayWithMonth(){
    if (daySpec != null) return;
    var ow = Parse.ordinalWeekday.fromTokens(tokens);
    if (!ow) return;

    var idx = 2;
    if (tokens[idx] && /^of$/i.test(tokens[idx])) idx++;

    var mi = -1;
    if (tokens[idx]){
      mi = monthIndexByName(tokens[idx]);
      if (mi === -1 && /^\d+$/.test(tokens[idx])){
        var n = parseInt(tokens[idx],10)|0;
        if (n>=1 && n<=cal.months.length) mi = n-1;
      }
    }
    if (mi === -1) return;

    mHuman  = mi + 1;
    daySpec = (String(tokens[0]) + ' ' + String(tokens[1])).toLowerCase().trim();

    used = 2;
    if (tokens[used] && /^of$/i.test(tokens[used])) used++;
    used++;
    if (tokens[used] && /^\d{1,6}$/.test(tokens[used])) used++;
  })();

  // (B) Regular yearly: "<Month> <DD|DD-DD|ordinal-day> ..."
  if (daySpec == null){
    var mi2 = monthIndexByName(tokens[0]);
    if (mi2 !== -1 && tokens[1]){
      var dTok = String(tokens[1]).toLowerCase().trim();
      if (/^\d+-\d+$/.test(dTok)){
        mHuman = mi2 + 1;
        daySpec = dTok;
        used = 2;
      } else {
        var dNum = /^\d+$/.test(dTok) ? (parseInt(dTok,10)|0) : Parse.ordinalDay(dTok);
        if (dNum != null){
          mHuman = mi2 + 1;
          daySpec = String(dNum);
          used = 2;
        }
      }
    }
  }

  // (C) Fallback: MDY parser
  if (daySpec == null){
    var pref = Parse.looseMDY(tokens.slice(0,3));
    if (!pref || pref.kind !== 'mdy') {
      return warnGM('Usage: !cal addyearly <Month> <DD|DD-DD|ordinal-day> NAME [#COLOR|color]\n'
        + '   or: !cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> NAME [#COLOR|color]');
    }
    mHuman  = pref.mi+1;
    daySpec = String(pref.day);
    used    = (pref.year!=null)?3:2;
  }

  var pulled = popColorIfPresent(tokens.slice(used), true);
  var color  = pulled.color;
  var name   = (pulled.tokens.join(' ').trim() || 'Untitled Event');

  var ok = _addConcreteEvent(mHuman, daySpec, null, name, color);
  if (ok){ refreshAndSend(); warnGM('Added annual event "'+esc(name)+'" on '+esc(daySpec)+' of month '+mHuman+'.'); }
  else   { warnGM('No event added (duplicate or invalid).'); }
}

export function stepDays(n, opts?){
  opts = opts || {};
  n = (parseInt(n,10) || 0)|0;
  var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length|0;
  var startSerial = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var dest = startSerial + n;
  var d = fromSerial(dest);
  cur.day_of_the_week = (cur.day_of_the_week + ((n % wdlen) + wdlen)) % wdlen;
  cur.year = d.year; cur.month = d.mi; cur.day_of_the_month = d.day;
  if (!opts.preserveTimeOfDay) clearTimeOfDay();
  // Slide the forecast window forward and lock past days
  if (ensureSettings().weatherEnabled !== false && getWeatherState().location) weatherEnsureForecast();
  _manifestZoneOnDateChange(startSerial, dest);
  if (opts.announce === false) return;

  var direction = n >= 0 ? 'Forward' : 'Back';
  var dateStr = esc(currentDateLabel());
  var stepButtons =
    mb('\u23ee\ufe0f Back','retreat 1')+'\u00a0'+
    mb('\u23ed\ufe0f Forward','advance 1')+'\u00a0'+
    mb('\ud83d\udce3 Send','send')+'\u00a0'+
    nav('\u2754 Help','root');
  sendUiToGM(
    '<div><b>Stepped '+direction+'</b> \u2014 '+dateStr+'</div>'+
    '<div style="margin-top:4px;">'+stepButtons+'</div>'
  );
}

export function setDate(m, d, y, opts?){
  opts = opts || {};
  var cal=getCal(), cur=cal.current, oldDOW=cur.day_of_the_week;
  var oldY=cur.year, oldM=cur.month, oldD=cur.day_of_the_month;
  var oldSerial = toSerial(oldY, oldM, oldD);
  var mi = clamp(m, 1, cal.months.length) - 1;
  var di = clamp(d, 1, cal.months[mi].days);
  var yi = int(y, cur.year);
  var delta = toSerial(yi, mi, di) - toSerial(oldY, oldM, oldD);
  cur.month = mi; cur.day_of_the_month = di; cur.year = yi;
  var wdlen = cal.weekdays.length;
  cur.day_of_the_week = (oldDOW + ((delta % wdlen) + wdlen)) % wdlen;
  if (!opts.preserveTimeOfDay) clearTimeOfDay();
  // Slide the forecast window forward and lock past days, same as stepDays
  if (ensureSettings().weatherEnabled !== false && getWeatherState().location) weatherEnsureForecast();
  _manifestZoneOnDateChange(oldSerial, toSerial(yi, mi, di));
  if (opts.announce === false) return;
  sendCurrentDate(null, true);
}

export function removeEvent(query){
  var cal = getCal(), events = cal.events;
  if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
  if (!events.length){ sendChat(script_name, '/w gm No events to remove.'); return; }

  var toks = String(query||'').trim().split(/\s+/).filter(Boolean);
  var sub = (toks[0]||'').toLowerCase();

  if (sub === 'key'){
    var key = _decKey(toks.slice(1).join(' ').trim());
    if (!key){ sendChat(script_name, '/w gm Usage: <code>!cal remove key &lt;KEY&gt;</code>'); return; }
    var idx = eventIndexByKey(key);
    if (idx < 0){ sendChat(script_name, '/w gm No event found for key: <code>'+esc(key)+'</code>'); return; }
    var removed = events.splice(idx, 1)[0];
    markSuppressedIfDefault(removed);
    refreshAndSend();
    var rName = eventDisplayName(removed) || removed.name || '(unnamed event)';
    sendChat(script_name, '/w gm Removed: '+esc(rName)+'.');
    return;
  }

  if (sub === 'series'){
    var sk = _decKey(toks.slice(1).join(' ').trim());
    if (!sk){ sendChat(script_name, '/w gm Usage: <code>!cal remove series &lt;KEY&gt;</code>'); return; }
    var removedCount = 0;
    for (var i = events.length - 1; i >= 0; i--){
      if (_eventSeriesKey(events[i]) !== sk) continue;
      var removedSeries = events.splice(i, 1)[0];
      markSuppressedIfDefault(removedSeries);
      removedCount++;
    }
    if (!removedCount){
      sendChat(script_name, '/w gm No event series found for key: <code>'+esc(sk)+'</code>');
      return;
    }
    refreshAndSend();
    sendChat(script_name, '/w gm Removed '+removedCount+' recurring event'+(removedCount===1?'':'s')+'.');
    return;
  }

  sendChat(script_name, '/w gm Usage: <code>!cal remove [list | key &lt;KEY&gt; | series &lt;KEY&gt; | &lt;name fragment&gt;]</code>');
}

export function _defaultDetailsForKey(key){
  var cal = getCal();
  var sysKey = ensureSettings().calendarSystem || CONFIG_DEFAULTS.calendarSystem;
  var parts = String(key||'').split('|');
  var mHuman = parseInt(parts[0],10)|0;
  var daySpec = parts[1]||'';
  var nameLower = (parts[3]||'').toLowerCase();

  var lim = Math.max(1, cal.months.length);
  var out = { name: titleCase(nameLower), month: mHuman, day: daySpec, color: null, source: null };

  deepClone(defaults.events).forEach(function(de){
    var srcKey = (de.source != null) ? String(de.source).toLowerCase() : null;
    if (srcKey && !_sourceAllowedForCalendar(srcKey, sysKey)) return;
    var monthsList = (String(de.month).toLowerCase() === 'all')
      ? (function(){ var a=[]; for(var i=1;i<=lim;i++) a.push(i); return a; })()
      : [ clamp(parseInt(de.month,10)||1, 1, lim) ];
    monthsList.forEach(function(m){
      var maxD = cal.months[m-1].days|0;
      var norm = DaySpec.normalize(de.day, maxD) || String(DaySpec.first(de.day));
      var k = defaultKeyFor(m, norm, de.name);
      if (k === key){
        out.name   = String(de.name||out.name);
        out.color  = resolveColor(de.color) || null;
        out.source = (de.source!=null) ? String(de.source) : null;
      }
    });
  });
  return out;
}



/* ============================================================================
 * 15) THEMES, NAMES, SOURCES
 * ==========================================================================*/

export function _orderedKeys(obj, preferred){
  var ks = Object.keys(obj), seen = {}, out = [];
  if (preferred && preferred.length){
    for (var i=0;i<preferred.length;i++){ var k=preferred[i]; if (ks.indexOf(k)!==-1 && !seen[k]){ out.push(k); seen[k]=1; } }
  }
  ks.sort().forEach(function(k){ if (!seen[k]) out.push(k); });
  return out;
}

export function themeListHtml(readOnly?){
  var cur = ensureSettings().colorTheme;
  var names = _orderedKeys(COLOR_THEMES, THEME_ORDER);
  if(!names.length) return '<div style="opacity:.7;">No themes available.</div>';

  var rows = names.map(function(n){
    var label = titleCase(n);
    var head = readOnly
      ? '<b>'+esc(label)+':</b>' + (n===cur ? ' <span style="opacity:.7">(current)</span>' : '')
      : button('Set '+label+':', 'theme '+n) + (n===cur ? ' <span style="opacity:.7">(current)</span>' : '');
    var swatches = (COLOR_THEMES[n]||[]).slice(0,12).map(function(c){
      return '<span title="'+esc(c)+'" style="display:inline-block;width:12px;height:12px;border:1px solid #000;margin-right:2px;background:'+esc(c)+';"></span>';
    }).join('');
    return '<div style="margin:6px 0;">'+ head + '<br>' + swatches + '<br></div>';
  });

  return '<div style="margin:4px 0;"><b>Color Themes</b></div>' + rows.join('');
}

export function colorsNamedListHtml(){
  var items = Object.keys(NAMED_COLORS);
  if(!items.length) return '<div style="opacity:.7;">No named colors.</div>';

  var rows = items.map(function(k){
    var c = NAMED_COLORS[k];
    return '<div style="margin:2px 0;">'+swatchHtml(c)+' <code>'+esc(k)+'</code> — '+esc(c)+'</div>';
  }).join('');

  return '<div style="margin:4px 0;"><b>Named Colors</b></div>'+rows;
}



/* ============================================================================
 * 16) GM BUTTONS & NESTED HELP MENUS
 * ==========================================================================*/

export function mb(label, cmd){ return button(label, cmd); }
export function nav(label, page){ return button(label, 'help '+page); }

export function _menuBox(title, innerHtml){
  return [
    '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:6px 0;">',
    '<div style="font-weight:bold;margin-bottom:4px;">', esc(title), '</div>',
    innerHtml,
    '</div>'
  ].join('');
}

export function taskCardHtml(title, summary, actions?, detail?){
  var actionHtml = Array.isArray(actions) && actions.length
    ? '<div style="margin-top:6px;">' + actions.filter(Boolean).join(' ') + '</div>'
    : '';
  var detailHtml = detail
    ? '<div style="font-size:.8em;opacity:.68;margin-top:4px;">' + detail + '</div>'
    : '';
  return '<div style="border:1px solid rgba(0,0,0,.14);border-radius:4px;padding:6px;margin:6px 0;">' +
    '<div style="font-weight:bold;margin-bottom:3px;">' + esc(title) + '</div>' +
    '<div style="font-size:.86em;opacity:.9;">' + summary + '</div>' +
    detailHtml +
    actionHtml +
    '</div>';
}

export function gmButtonsHtml(){
  var st = ensureSettings();
  var rows = [];

  // Time of Day: advance if active, enable if weather is active
  if (isTimeOfDayActive()){
    rows.push('<div>'+mb('⏩ Time of Day ⏩','time next')+'</div>');
  } else if (st.weatherEnabled !== false){
    rows.push('<div>'+mb('Enable Time of Day','time start afternoon')+'</div>');
  }

  // Date step arrows
  rows.push('<div>'+mb('⬅','retreat 1')+' '+mb('➡','advance 1')+'</div>');

  // Send Today View to Players
  rows.push('<div>'+mb('📣 Send To Players','send')+'</div>');

  // Additional Options dropdown
  rows.push('<div>'+mb('Additional Options','today options ?{Option|Events,events|Moons,moon|Weather,weather|Planes,planes|Admin,help root}')+'</div>');

  return rows.join('');
}

export function _activePlanarWeatherShiftLines(serial){
  var out = [];
  try {
    var eff = getActivePlanarEffects(serial);
    for (var i = 0; i < eff.length; i++){
      var e = eff[i];
      if (e.plane === 'Fernia' && e.phase === 'coterminous') out.push('Fernia coterminous: temperature +3');
      if (e.plane === 'Fernia' && e.phase === 'remote')      out.push('Fernia remote: temperature -2');
      if (e.plane === 'Risia'  && e.phase === 'coterminous') out.push('Risia coterminous: temperature -3');
      if (e.plane === 'Risia'  && e.phase === 'remote')      out.push('Risia remote: temperature +2');
      if (e.plane === 'Syrania'&& e.phase === 'coterminous') out.push('Syrania coterminous: clear and calm (precipitation 0, wind 0)');
      if (e.plane === 'Syrania'&& e.phase === 'remote')      out.push('Syrania remote: precipitation +1');
      if (e.plane === 'Mabar'  && e.phase === 'coterminous') out.push('Mabar coterminous: temperature -1');
      if (e.plane === 'Irian'  && e.phase === 'coterminous') out.push('Irian coterminous: temperature +1');
      if (e.plane === 'Lamannia'&& e.phase === 'coterminous')out.push('Lamannia coterminous: precipitation +1');
    }
  } catch(e2){}
  return out;
}

export function _planarWeatherInfluenceText(e){
  if (!e) return null;
  if (e.plane === 'Fernia' && e.phase === 'coterminous') return '🔥 Fernia coterminous (+3 temp)';
  if (e.plane === 'Fernia' && e.phase === 'remote')      return '🔥 Fernia remote (-2 temp)';
  if (e.plane === 'Risia'  && e.phase === 'coterminous') return '❄️ Risia coterminous (-3 temp)';
  if (e.plane === 'Risia'  && e.phase === 'remote')      return '❄️ Risia remote (+2 temp)';
  if (e.plane === 'Syrania'&& e.phase === 'coterminous') return '🌤 Syrania coterminous (clear, calm)';
  if (e.plane === 'Syrania'&& e.phase === 'remote')      return '🌧 Syrania remote (+1 precip)';
  if (e.plane === 'Mabar'  && e.phase === 'coterminous') return '🌑 Mabar coterminous (-1 temp)';
  if (e.plane === 'Irian'  && e.phase === 'coterminous') return '✨ Irian coterminous (+1 temp)';
  if (e.plane === 'Lamannia'&& e.phase === 'coterminous')return '🌿 Lamannia coterminous (+1 precip)';
  return null;
}

export function _weatherInfluenceTexts(rec){
  var out = [];
  if (!rec) return out;
  var zoneEntries = _activeManifestZonesForSerial(rec.serial);
  for (var zi = 0; zi < zoneEntries.length; zi++){
    var mzText = _manifestZoneInfluenceText(zoneEntries[zi].def);
    if (mzText) out.push(mzText);
  }
  try {
    var eff = getActivePlanarEffects(rec.serial);
    for (var i = 0; i < eff.length; i++){
      var pText = _planarWeatherInfluenceText(eff[i]);
      if (pText) out.push(pText);
    }
  } catch(e2){}
  if (_isZarantyrFull(rec.serial)) out.push('🌙 Zarantyr full (lightning boost)');
  return out;
}

export function _weatherInfluenceHtml(rec){
  var lines = _weatherInfluenceTexts(rec);
  if (!lines.length) return '';
  return '<div style="font-size:.76em;opacity:.58;font-style:italic;margin-top:3px;">'+
    lines.map(esc).join(' · ')+
    '</div>';
}

export function activeEffectsPanelHtml(){
  var st = ensureSettings();
  var today = todaySerial();
  var sections = [];

  // Weather mechanics (today, current location only)
  if (st.weatherEnabled !== false){
    var wx = '';
    try {
      var ws = getWeatherState();
      if (!ws.location){
        wx = '<div style="opacity:.7;">No weather location set.</div>';
      } else {
        weatherEnsureForecast();
        var rec = _weatherRecordForDisplay(_forecastRecord(today));
        if (!rec || !rec.final){
          wx = '<div style="opacity:.7;">No weather generated for today.</div>';
        } else {
          var loc = rec.location || ws.location || {};
          var locLine = esc(titleCase(loc.climate||'')) + ' / ' +
            esc(titleCase(String(loc.geography||'inland').replace(/_/g,' '))) + ' / ' +
            esc(titleCase(loc.terrain||'open'));
          var cond = _deriveConditions(
            rec.final,
            loc,
            WEATHER_PRIMARY_PERIOD,
            rec.snowAccumulated,
            _weatherPrimaryFog(rec)
          );
          var narr = _conditionsNarrative(rec.final, cond, WEATHER_PRIMARY_PERIOD);
          wx += '<div style="font-size:.85em;opacity:.75;">'+locLine+'</div>';
          var manifestStatus = _manifestZoneStatusLabel(_activeManifestZoneEntries());
          if (manifestStatus !== 'None'){
            wx += '<div style="font-size:.82em;opacity:.68;margin-top:2px;">Manifest zones: '+esc(manifestStatus)+'</div>';
          }
          wx += '<div style="margin:3px 0;">' +
            _weatherTraitBadge('temp',   rec.final.temp)+'&nbsp;' +
            _weatherTraitBadge('wind',   rec.final.wind)+'&nbsp;' +
            _weatherTraitBadge('precip', rec.final.precip) +
            '</div>';
          wx += '<div style="font-size:.85em;opacity:.85;">'+esc(narr)+'</div>';
          wx += _conditionsMechHtml(cond);
          if (st.weatherMechanicsEnabled === false){
            wx += '<div style="font-size:.8em;opacity:.6;margin-top:3px;">Mechanical weather effects are disabled.</div>';
          }

          var shifts = _activePlanarWeatherShiftLines(today);
          if (shifts.length){
            wx += '<div style="font-size:.82em;opacity:.85;margin-top:4px;"><b>Planar weather shifts:</b><br>' +
              shifts.map(esc).join('<br>') + '</div>';
          }

          var geo = String((loc.geography || 'inland')).toLowerCase();
          if (geo === 'coastal' || geo === 'island' || geo === 'coastal_bluff'){
            try {
              var tidx = getTidalIndex(today);
              wx += '<div style="font-size:.82em;opacity:.8;margin-top:4px;">🌊 <b>Tides:</b> '+esc(tidalLabel(tidx))+' ('+tidx+'/10)</div>';
            } catch(e3){}
          }
        }
      }
    } catch(e4){
      wx = '<div style="opacity:.7;">Weather data unavailable.</div>';
    }
    sections.push(_menuBox('🌤️ Active Weather Effects', wx));
  }

  // Planar mechanics (active coterminous/remote, filtered for non-routine signal)
  if (st.planesEnabled !== false){
    var pl = '';
    try {
      var planes = _getAllPlaneData();
      var ypd = _planarYearDays();
      var rows = [];
      for (var i = 0; i < planes.length; i++){
        var ps = getPlanarState(planes[i].name, today);
        if (!ps) continue;
        if (ps.phase !== 'coterminous' && ps.phase !== 'remote') continue;

        // Skip permanently fixed routine states (e.g., Dal Quor/Xoriat) unless generated.
        var isGenerated = _isGeneratedNote(ps.note);
        if (planes[i].type === 'fixed' && !isGenerated) continue;

        // Skip extremely long routine phases unless forced or generated.
        if (ps.phaseDuration != null && ps.phaseDuration > ypd && !ps.overridden && !isGenerated) continue;

        var emoji = PLANE_PHASE_EMOJI[ps.phase] || '⚪';
        var lbl = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
        var next = (ps.daysUntilNextPhase != null && ps.nextPhase)
          ? ' <span style="opacity:.55;font-size:.82em;">(' + esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + ' in ' + ps.daysUntilNextPhase + 'd)</span>'
          : '';
        var row = '<div style="margin:3px 0;">'+emoji+' <b>'+esc(ps.plane.name)+'</b> — '+esc(lbl)+next+'</div>';
        var eff = (ps.plane.effects && ps.plane.effects[ps.phase]) || '';
        if (eff){
          row += '<div style="font-size:.82em;opacity:.78;margin-left:14px;">'+esc(eff)+'</div>';
        }
        rows.push(row);
      }

      if (!rows.length){
        pl = '<div style="opacity:.7;">No notable coterminous/remote planar effects are active today.</div>';
      } else {
        pl = rows.join('');
      }

      // Long Shadows spotlight
      try {
        var mabar = getPlanarState('Mabar', today);
        if (mabar && mabar.phase === 'coterminous'){
          var cc = getCal().current;
          var ls = getLongShadowsMoons(cc.year);
          if (ls.length){
            var names = [];
            for (var li = 0; li < ls.length; li++) names.push(ls[li].name);
            pl += '<div style="font-size:.82em;margin-top:4px;padding:4px;background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">🌑 <b>Long Shadows:</b> '+esc(names.join(', '))+' dark tonight.</div>';
          }
        }
      } catch(e5){}
    } catch(e6){
      pl = '<div style="opacity:.7;">Planar data unavailable.</div>';
    }
    sections.push(_menuBox('🌀 Active Planar Effects', pl));
  }

  if (!sections.length){
    sections.push('<div style="opacity:.7;">No active effect systems are enabled.</div>');
  }

  return _menuBox('✨ Active Effects — ' + esc(currentDateLabel()),
    sections.join('') + '<div style="margin-top:7px;">'+button('⬅️ Back','help root')+'</div>'
  );
}

export function helpStatusSummaryHtml(){
  var st      = ensureSettings();
  var curDate = esc(currentDateLabel());
  var timeLine = _timeOfDayStatusHtml('font-size:.82em;opacity:.72;margin-top:3px;');

  // Build system/variant label.
  var sys     = CALENDAR_SYSTEMS[st.calendarSystem] || {};
  var variant = (sys.variants && sys.variants[st.calendarVariant]) || {};
  var sysLabel = esc(sys.label || titleCase(st.calendarSystem || ''));
  var varLabel = esc(variant.label || titleCase(st.calendarVariant || ''));
  var calLine  = (varLabel && varLabel !== sysLabel) ? (sysLabel + ' &mdash; ' + varLabel) : sysLabel;

  // Overrides: only show if they deviate from the variant/system defaults.
  var overrides = [];
  var defTheme  = variant.colorTheme || '';
  var curTheme  = st.colorTheme || '';
  if (curTheme && curTheme !== defTheme) overrides.push(esc(titleCase(curTheme)) + ' theme');
  var defSeason = sys.defaultSeason || CONFIG_DEFAULTS.seasonVariant;
  if (st.seasonVariant && st.seasonVariant !== defSeason) overrides.push(esc(titleCase(st.seasonVariant)) + ' seasons');

  var configLine = overrides.length ? overrides.join(' &nbsp;·&nbsp; ') : '';

  return _menuBox('Status',
    '<div style="font-size:1.1em;font-weight:bold;">' + curDate + '</div>' +
    timeLine +
    '<div style="font-size:.85em;opacity:.8;margin-top:2px;">' + calLine + '</div>' +
    (configLine ? '<div style="font-size:.75em;opacity:.6;margin-top:2px;">' + configLine + '</div>' : '')
  );
}

export function helpRootMenu(m){
  var stNew = ensureSettings();
  var isGMNew = playerIsGM(m.playerid);
  var rowsNew = [helpStatusSummaryHtml()];
  var todaySpec = _serialToDateSpec(todaySerial());
  var promptSet = button('Prompt !cal set', 'set ?{Date|' + todaySpec + '}');
  var promptSend = button('Prompt !cal send', 'send ?{Calendar range|this month}');
  var promptAdd = button('Prompt !cal add', 'add ?{Date|' + todaySpec + '} ?{Event name|New Event} ?{Color|#50C878}');
  var promptMonthly = button('Prompt !cal addmonthly', 'addmonthly ?{Day spec|first Sul} ?{Event name|Monthly Event} ?{Color|#50C878}');
  var promptYearly = button('Prompt !cal addyearly', 'addyearly ?{Month|Zarantyr} ?{Day|1} ?{Event name|Annual Event} ?{Color|#50C878}');
  var promptMoonOn = button('Prompt !cal moon on', 'moon on ?{Date|' + todaySpec + '}');
  var promptPlanesOn = button('Prompt !cal planes on', 'planes on ?{Date|' + todaySpec + '}');

  rowsNew.push(taskCardHtml(
    'Calendar',
    'Open the campaign dashboard, jump to month or year views, and use prompt-driven buttons for syntax-heavy date commands.',
    [
      mbP(m,'Today','today'),
      mbP(m,'Show Month','show month'),
      mbP(m,'Show Year','show year'),
      promptSet,
      isGMNew ? promptSend : ''
    ],
    'Typed forms: <code>!cal show month</code>, <code>!cal show year</code>, <code>!cal set &lt;dateSpec&gt;</code>.'
  ));

  if (isGMNew){
    rowsNew.push(taskCardHtml(
      'Events',
      'Add one-off, monthly, and yearly events with prompts or typed commands, then manage source packs separately.',
      [
        mbP(m,'List','list'),
        mbP(m,'Sources','source list'),
        navP(m,'Colors','eventcolors'),
        promptAdd,
        promptMonthly,
        promptYearly
      ],
      'Typed forms: <code>!cal add</code>, <code>!cal addmonthly</code>, <code>!cal addyearly</code>.'
    ));
  }

  if (stNew.moonsEnabled !== false){
    rowsNew.push(taskCardHtml(
      'Moons',
      'Check lunar status, visibility, and lore without opening the full rules surface first.',
      [
        mbP(m,'Moons','moon'),
        mbP(m,'Sky','moon sky'),
        mbP(m,'Lore','moon lore'),
        promptMoonOn
      ],
      'Typed forms: <code>!cal moon</code>, <code>!cal moon on &lt;dateSpec&gt;</code>.'
    ));
  }

  rowsNew.push(taskCardHtml(
    'Weather',
    stNew.weatherEnabled === false ? 'Weather is currently off.' : 'Open current conditions, forecast access, and location management from one place.',
    [
      mbP(m,'Weather','weather'),
      mbP(m,'Forecast','forecast'),
      isGMNew ? mbP(m,'Set Location','weather location') : '',
      isGMNew ? mbP(m,'Mechanics','weather mechanics') : ''
    ],
    isGMNew
      ? 'Typed forms: <code>!cal weather</code>, <code>!cal weather location</code>.'
      : 'Typed forms: <code>!cal weather</code>, <code>!cal forecast</code>.'
  ));

  if (stNew.planesEnabled !== false){
    rowsNew.push(taskCardHtml(
      'Planes',
      'Review planar movement, active extremes, and known future windows from a compact starting point.',
      [
        mbP(m,'Planes','planes'),
        isGMNew ? mbP(m,'Effects','effects') : '',
        promptPlanesOn
      ],
      'Typed forms: <code>!cal planes</code>, <code>!cal planes on &lt;dateSpec&gt;</code>.'
    ));
  }

  if (isGMNew){
    var moonModeNew = _normalizeDisplayMode(stNew.moonDisplayMode);
    var wxModeNew = _normalizeDisplayMode(stNew.weatherDisplayMode);
    var plModeNew = _normalizeDisplayMode(stNew.planesDisplayMode);
    var wxDaysNew = _weatherViewDays(stNew.weatherForecastViewDays);
    var verbNew = _subsystemVerbosityValue();
    rowsNew.push(taskCardHtml(
      'GM Admin',
      'Reach the high-churn admin tools here and keep deeper configuration inside the existing drill-down menus.',
      [
        mbP(m,'Time','time'),
        navP(m,'Supported Settings','calendar'),
        navP(m,'Themes','themes'),
        navP(m,'Seasons','seasons'),
        mbP(m,'Effects','effects')
      ],
      'Views: Moon ' + _displayModeLabel(moonModeNew) +
      ' · Weather ' + _displayModeLabel(wxModeNew) +
      ' · Planes ' + _displayModeLabel(plModeNew) +
      ' · Forecast ' + wxDaysNew + 'd · Detail ' + (verbNew === 'minimal' ? 'minimal' : 'normal') +
      '. Reset: <code>!cal resetcalendar</code>.'
    ));
  }

  whisperUi(m.who, rowsNew.join(''));
  return;
}

export function helpThemesMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisperUi(m.who, _menuBox(ro ? 'Appearance — Themes (view only)' : 'Appearance — Themes', themeListHtml(ro))+'<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

export function helpCalendarSystemMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisperUi(m.who,
    _menuBox(ro ? 'Supported Settings (view only)' : 'Supported Settings', calendarSystemListHtml(ro))+
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  );
}

export function helpEventColorsMenu(m){
  var intro = [
    '<div style="opacity:.85;margin-bottom:6px;">',
    'These are the available <b>named colors for events</b>. ',
    'Any hex (<code>#RRGGBB</code>) is supported, but these names can be used directly. ',
    'Example: <code>!cal add March 14 Feast emerald</code> or ',
    '<code>!cal add 3 14 Feast #50C878</code>.',
    '</div>'
  ].join('');
  whisperUi(m.who,
    _menuBox('Event Colors', intro + colorsNamedListHtml())+
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  );
}

export function helpSeasonsMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisperUi(m.who,
    _menuBox(ro ? 'Season Variants (view only)' : 'Season Variants', seasonSetListHtml(ro))+
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  );
}

export function seasonSetListHtml(readOnly?){
  var st  = ensureSettings();
  var cur = st.seasonVariant || (CALENDAR_SYSTEMS[st.calendarSystem] || {}).defaultSeason || CONFIG_DEFAULTS.seasonVariant;
  var names = _orderedKeys(SEASON_SETS, ['eberron','faerun','gregorian','tropical']);
  if(!names.length) return '<div style="opacity:.7;">No season sets.</div>';

  var rows = names.map(function(n){
    var label = titleCase(n);
    var head = readOnly
      ? '<b>'+esc(label)+':</b>'+(n===cur?' <span style="opacity:.7">(current)</span>':'')
      : button('Set '+label+':', 'seasons '+n)+(n===cur?' <span style="opacity:.7">(current)</span>':'');
    var preview = (_seasonNames(n)||[]).map(esc).join(', ');
    return '<div style="margin:6px 0;">'+ head + '<br><div style="opacity:.85;">'+preview+'</div><br></div>';
  });

  return '<div style="margin:4px 0;"><b>Season Sets</b></div>'+rows.join('');
}

export function calendarSystemListHtml(readOnly?){
  var st   = ensureSettings();
  var keys = _orderedKeys(CALENDAR_SYSTEMS, CALENDAR_SYSTEM_ORDER);
  if (!keys.length) return '<div style="opacity:.7;">No calendar systems defined.</div>';

  var rows = keys.map(function(sysKey){
    var sys   = CALENDAR_SYSTEMS[sysKey];
    var sLabel = esc(sys.label || titleCase(sysKey));
    var desc   = sys.description ? '<div style="font-size:.82em;opacity:.65;margin-bottom:4px;">'+esc(sys.description)+'</div>' : '';
    var varKeys = sys.variants ? Object.keys(sys.variants) : [];
    var varRows = varKeys.map(function(vk){
      var v     = sys.variants[vk];
      var vLabel = esc(v.label || titleCase(vk));
      var isCur  = st.calendarSystem === sysKey && st.calendarVariant === vk;
      var head   = readOnly
        ? '<b>'+vLabel+'</b>'+(isCur?' <span style="opacity:.7">(current)</span>':'')
        : button(vLabel, 'calendar '+sysKey+' '+vk)+(isCur?' <span style="opacity:.7">(current)</span>':'');
      var preview = (v.monthNames||[]).slice(0,4).map(esc).join(', ')+(v.monthNames&&v.monthNames.length>4?' …':'');
      return '<div style="margin:3px 0 3px 8px;">'+head+'<br><div style="font-size:.82em;opacity:.7;">'+preview+'</div></div>';
    });
    return '<div style="margin:8px 0;">'+
      '<div style="font-weight:bold;margin-bottom:2px;">'+sLabel+'</div>'+
      desc + varRows.join('') +
      '</div>';
  });

  return '<div style="margin:4px 0;"><b>Supported Settings</b></div>'+rows.join('<hr style="border:none;border-top:1px solid #444;margin:4px 0;">');
}
