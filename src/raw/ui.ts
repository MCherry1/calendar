/* ============================================================================
 * 13) Roll20 State Interaction & UI
 * ==========================================================================*/

function currentDateLabel(){
  var cal = getCal(), cur = cal.current;
  if (ensureSettings().calendarSystem === 'faerunian'){
    return formatDateLabel(cur.year, cur.month, cur.day_of_the_month, true);
  }
  var datePart = _displayMonthDayParts(cur.month, cur.day_of_the_month).label;
  return cal.weekdays[cur.day_of_the_week] + ", " +
         datePart + ", " +
         cur.year + " " + LABELS.era;
}

function dateLabelFromSerial(serial){
  var cal = getCal();
  var d = fromSerial(serial);
  if (ensureSettings().calendarSystem === 'faerunian'){
    return formatDateLabel(d.year, d.mi, d.day, true);
  }
  var wd = cal.weekdays[weekdayIndex(d.year, d.mi, d.day)];
  var datePart = _displayMonthDayParts(d.mi, d.day).label;
  return wd + ", " + datePart + ", " + d.year + " " + LABELS.era;
}

function nextForDayOnly(cur, day, monthsLen){
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

function nextForMonthDay(cur, mIndex, d){
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
function _getSeasonLabel(mi, day){
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

function _uiDensityValue(explicit){
  var d = String(explicit || ensureSettings().uiDensity || CONFIG_DEFAULTS.uiDensity || 'compact').toLowerCase();
  return (d === 'normal') ? 'normal' : 'compact';
}

function _normalizeDisplayMode(mode){
  var m = String(mode || '').toLowerCase();
  if (m === 'calendar' || m === 'list' || m === 'both') return m;
  return 'both';
}

function _nextDisplayMode(mode){
  var m = _normalizeDisplayMode(mode);
  if (m === 'both') return 'calendar';
  if (m === 'calendar') return 'list';
  return 'both';
}

function _displayModeLabel(mode){
  var m = _normalizeDisplayMode(mode);
  if (m === 'calendar') return 'Calendar';
  if (m === 'list') return 'List';
  return 'Both';
}

function _subsystemVerbosityValue(){
  var v = String(ensureSettings().subsystemVerbosity || CONFIG_DEFAULTS.subsystemVerbosity || 'normal').toLowerCase();
  return (v === 'minimal') ? 'minimal' : 'normal';
}

function _subsystemIsVerbose(){
  return _subsystemVerbosityValue() !== 'minimal';
}

function _legendLine(items){
  if (!items || !items.length) return '';
  return '<div style="font-size:.76em;opacity:.55;margin:4px 0 6px 0;">Legend: '+items.map(esc).join(' · ')+'</div>';
}

function _displayMonthDayParts(mi, day){
  var cal = getCal();
  var st = ensureSettings();
  var m = cal.months[mi] || {};
  if (st.calendarSystem === 'faerunian'){
    if (m.isIntercalary){
      return { monthName: String(m.name || (mi + 1)), day: day, label: String(m.name || (mi + 1)) };
    }
    return {
      monthName: String(m.name || (mi + 1)),
      day: day,
      label: _ordinal(day) + ' of ' + String(m.name || (mi + 1))
    };
  }
  if (st.calendarSystem === 'gregorian' && m.isIntercalary && String(m.name||'') === 'Leap Day'){
    return { monthName: 'February', day: 29, label: 'February 29' };
  }
  return {
    monthName: String(m.name || (mi + 1)),
    day: day,
    label: String(day) + ' ' + String(m.name || (mi + 1))
  };
}

function _serialToDateSpec(serial){
  var d = fromSerial(serial|0);
  var parts = _displayMonthDayParts(d.mi, d.day);
  return parts.monthName + ' ' + d.day + ' ' + d.year;
}

function _shiftSerialByMonth(serial, dir){
  var d = fromSerial(serial|0);
  var step = (dir < 0) ? _prevActiveMi(d.mi, d.year) : _nextActiveMi(d.mi, d.year);
  var md = Math.max(1, (getCal().months[step.mi] || {}).days|0);
  var day = clamp(d.day, 1, md);
  return toSerial(step.y, step.mi, day);
}

function _weatherViewDays(n){
  var days = parseInt(n, 10);
  if (!isFinite(days)) return CONFIG_DEFAULTS.weatherForecastViewDays;
  if (days < 1) return 1;
  if (days > CONFIG_WEATHER_FORECAST_DAYS) return CONFIG_WEATHER_FORECAST_DAYS;
  return days;
}

function _playerButtonsHtml(){
  var nav = [
    button('◀ Prev','show previous month'),
    button('Next ▶','show next month')
  ];
  var out = [];
  var st = ensureSettings();
  out.push(button('📋 Today','today'));
  if (st.weatherEnabled !== false) out.push(button('🌤 Weather','weather'));
  if (st.moonsEnabled   !== false) out.push(button('🌙 Moons','moon'));
  if (st.planesEnabled  !== false) out.push(button('🌀 Planes','planes'));
  return nav.join(' ') + '<br>' + out.join(' ');
}

function sendCurrentDate(to, gmOnly, opts){
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
      var _st = ensureSettings();
      var _sys = MOON_SYSTEMS[_st.calendarSystem] || MOON_SYSTEMS.eberron;
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
    msgCore = calHtml + dateLine + todayEventsLine + moonLine + weatherLine + planesLine;
  } else if (compact){
    msgCore = '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:4px 0;">' +
      dateLine + todayEventsLine + moonLine + weatherLine + planesLine +
      '</div>';
  } else {
    msgCore = calHtml + dateLine + moonLine + weatherLine + planesLine + eventsBlock;
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

function _parseSharpColorToken(tok){
  if (!tok || tok[0] !== '#') return null;
  var raw = tok.slice(1).trim();
  var hex = sanitizeHexColor('#'+raw);
  if (hex) return hex;
  var named = NAMED_COLORS[String(raw).toLowerCase()] || null;
  return named;
}

function parseDatePrefixForAdd(tokens){
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

function addEventSmart(tokens){
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

function addMonthlySmart(tokens){
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

function addYearlySmart(tokens){
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

function stepDays(n){
  n = (parseInt(n,10) || 0)|0;
  var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length|0;
  var startSerial = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var dest = startSerial + n;
  var d = fromSerial(dest);
  cur.day_of_the_week = (cur.day_of_the_week + ((n % wdlen) + wdlen)) % wdlen;
  cur.year = d.year; cur.month = d.mi; cur.day_of_the_month = d.day;
  // Slide the forecast window forward and lock past days
  if (ensureSettings().weatherEnabled !== false && getWeatherState().location) weatherEnsureForecast();
  _manifestZoneOnDateChange(startSerial, dest);

  var direction = n >= 0 ? 'Forward' : 'Back';
  var dateStr = esc(currentDateLabel());
  var stepButtons =
    mb('\u23ee\ufe0f Back','retreat 1')+'\u00a0'+
    mb('\u23ed\ufe0f Forward','advance 1')+'\u00a0'+
    mb('\ud83d\udce3 Send','send')+'\u00a0'+
    nav('\u2754 Help','root');
  sendToGM(
    '<div><b>Stepped '+direction+'</b> \u2014 '+dateStr+'</div>'+
    '<div style="margin-top:4px;">'+stepButtons+'</div>'
  );
}

function setDate(m, d, y){
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
  // Slide the forecast window forward and lock past days, same as stepDays
  if (ensureSettings().weatherEnabled !== false && getWeatherState().location) weatherEnsureForecast();
  _manifestZoneOnDateChange(oldSerial, toSerial(yi, mi, di));
  sendCurrentDate(null, true);
}

function removeEvent(query){
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

function _defaultDetailsForKey(key){
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

