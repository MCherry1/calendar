/* ============================================================================
 * 9) RANGE ENGINE + NEARBY EXTENSION
 * ==========================================================================*/

function _firstWeekdayOfMonth(year, mi, wdi){
  var first = weekdayIndex(year, mi, 1);
  var delta = (wdi - first + getCal().weekdays.length) % getCal().weekdays.length;
  return 1 + delta;
}

function _nthWeekdayOfMonth(year, mi, wdi, nth){
  var mdays = getCal().months[mi].days|0;
  var first = _firstWeekdayOfMonth(year, mi, wdi);
  var day = first + (nth-1)*weekLength();
  return (day<=mdays) ? day : null;
}

function _lastWeekdayOfMonth(year, mi, wdi){
  var mdays = getCal().months[mi].days|0;
  var lastWd = weekdayIndex(year, mi, mdays);
  var delta = (lastWd - wdi + getCal().weekdays.length) % getCal().weekdays.length;
  var day = mdays - delta;
  return day>=1 ? day : null;
}

function _tokenizeRangeArgs(args){ return (args||[]).map(function(t){return String(t).trim();}).filter(Boolean); }

function _isPhrase(tok){ return /^(month|year|current|this|next|previous|prev|last|today|now)$/.test(String(tok||'').toLowerCase()); }

function dayFromOrdinalWeekday(year, mi, ow){
  if (!ow) return null;
  if (ow.ord === 'last') return _lastWeekdayOfMonth(year, mi, ow.wdi);
  var nth = {first:1, second:2, third:3, fourth:4, fifth:5}[ow.ord] || 1;
  var d = _nthWeekdayOfMonth(year, mi, ow.wdi, nth);
  return (d==null) ? _lastWeekdayOfMonth(year, mi, ow.wdi) : d;
}

function _allWeekdaysInMonth(year, mi, wdi){
  var mdays = getCal().months[mi].days|0;
  var first = _firstWeekdayOfMonth(year, mi, wdi);
  var out = [];
  for (var d = first; d <= mdays; d += weekLength()){ out.push(d); }
  return out;
}

function _phraseToSpec(tokens){
  var cal = getCal(), cur=cal.current, months=cal.months, dpy = daysPerYear();
  var t0 = (tokens[0]||'').toLowerCase();
  var t1 = (tokens[1]||'').toLowerCase();
  function monthRange(y, mi, title){
    var md = months[mi].days|0;
    return { title:title, start: toSerial(y, mi, 1), end: toSerial(y, mi, md), months:[{y:y,mi:mi}] };
  }
  function yearRange(y, title){
    var s   = toSerial(y, 0, 1);
    var end = toSerial(y + 1, 0, 1) - 1; // exact year boundary regardless of leap
    // Filter out inactive leap months for this specific year.
    var mList = months.map(function(_, i){ return {y:y, mi:i}; })
                      .filter(function(e){ var m=months[e.mi]; return !m.leapEvery || _isLeapMonth(m, y); });
    return { title:title, start:s, end:end, months:mList };
  }
  if (t0==='today' || t0==='now'){ return monthRange(cur.year, cur.month, 'Today — '+currentDateLabel()); }
  if (t0==='month' || ((t0==='this'||t0==='current') && (t1==='month'||!t1))){ return monthRange(cur.year, cur.month, 'This Month'); }
  if (t0==='year'  || ((t0==='this'||t0==='current') && (t1==='year'||!t1))){ return yearRange(cur.year, 'This Year '+cur.year+' '+LABELS.era); }
  if (t0==='next' && (!t1 || t1==='month')){ var _nm=_nextActiveMi(cur.month,cur.year); return monthRange(_nm.y, _nm.mi, 'Next Month ('+months[_nm.mi].name+')'); }
  if (t0==='next' && t1==='year'){ return yearRange(cur.year+1, 'Next Year '+(cur.year+1)+' '+LABELS.era); }
  if ((t0==='last'||t0==='previous'||t0==='prev') && (!t1 || t1==='month')){
    var _pm=_prevActiveMi(cur.month,cur.year);
    return monthRange(_pm.y, _pm.mi, 'Last Month ('+months[_pm.mi].name+')');
  }
  if ((t0==='last'||t0==='previous'||t0==='prev') && t1==='year'){ return yearRange(cur.year-1, 'Last Year '+(cur.year-1)+' '+LABELS.era); }
  return null;
}

function _calendarMonthRange(y, mi, title){
  var months = getCal().months;
  var md = months[mi].days|0;
  return {
    title: title || (months[mi].name + ' ' + y + ' ' + LABELS.era),
    start: toSerial(y, mi, 1),
    end: toSerial(y, mi, md),
    months: [{ y:y, mi:mi }]
  };
}

function _calendarYearRange(y, title){
  var months = getCal().months;
  var s = toSerial(y, 0, 1);
  var end = toSerial(y + 1, 0, 1) - 1;
  var mList = months.map(function(_, i){ return { y:y, mi:i }; })
    .filter(function(entry){
      var m = months[entry.mi];
      return !m.leapEvery || _isLeapMonth(m, y);
    });
  return {
    title: title || ('Year ' + y + ' ' + LABELS.era),
    start: s,
    end: end,
    months: mList
  };
}

function _parseTopLevelCalendarSpec(tokens){
  tokens = _tokenizeRangeArgs(tokens);
  var cal = getCal();
  var cur = cal.current;
  var months = cal.months;

  if (!tokens.length) return _calendarMonthRange(cur.year, cur.month, 'This Month');

  if (tokens.length && _isPhrase(tokens[0].toLowerCase())){
    var phraseSpec = _phraseToSpec(tokens);
    if (phraseSpec) return phraseSpec;
  }

  var ow = Parse.ordinalWeekday.fromTokens(tokens);
  if (ow){
    var owYear = (typeof ow.year === 'number') ? ow.year : cur.year;
    var owMi = (ow.mi !== -1) ? ow.mi : cur.month;
    return _calendarMonthRange(owYear, owMi, months[owMi].name + ' ' + owYear + ' ' + LABELS.era);
  }

  var md = Parse.monthYearLoose(tokens);
  if (md.mi !== -1 && md.day != null && md.year != null){
    return _calendarMonthRange(md.year, md.mi, months[md.mi].name + ' ' + md.year + ' ' + LABELS.era);
  }
  if (md.mi !== -1 && md.day != null){
    var day = clamp(md.day, 1, months[md.mi].days|0);
    var nextY = nextForMonthDay(cur, md.mi, day).year;
    return _calendarMonthRange(nextY, md.mi, months[md.mi].name + ' ' + nextY + ' ' + LABELS.era);
  }
  if (md.mi !== -1 && md.year != null){
    return _calendarMonthRange(md.year, md.mi, months[md.mi].name + ' ' + md.year + ' ' + LABELS.era);
  }
  if (md.mi !== -1){
    var y = (md.mi >= cur.month) ? cur.year : (cur.year + 1);
    return _calendarMonthRange(y, md.mi, months[md.mi].name + ' ' + y + ' ' + LABELS.era);
  }
  if (md.year != null && md.day == null){
    return _calendarYearRange(md.year, 'Year ' + md.year + ' ' + LABELS.era);
  }

  return null;
}

function _topLevelCalendarGuidanceHtml(tokens){
  tokens = _tokenizeRangeArgs(tokens);
  var entered = tokens.length ? ('<div style="margin-bottom:4px;"><code>!cal ' + esc(tokens.join(' ')) + '</code> does not map cleanly to a month view.</div>') : '';
  return _menuBox('Calendar Jump Syntax',
    entered +
    '<div style="opacity:.82;">Top-level <code>!cal</code>, <code>!cal show</code>, and <code>!cal send</code> jumps render whole months or years.</div>' +
    '<div style="margin-top:5px;">Use a month name, a month plus year, or a full date that includes a month:</div>' +
    '<div style="margin-top:4px;"><code>!cal Zarantyr</code><br><code>!cal Zarantyr 998</code><br><code>!cal Rhaan 14</code><br><code>!cal next month</code><br><code>!cal this year</code></div>' +
    '<div style="margin-top:5px;opacity:.72;">Bare day-only inputs like <code>!cal 14</code> or <code>!cal 1st</code> are not supported here.</div>'
  );
}

function _deliverTopLevelCalendarRange(opts){
  opts = opts || {};
  var spec = _parseTopLevelCalendarSpec(opts.args || []);
  if (!spec){
    if (opts.who) whisper(opts.who, _topLevelCalendarGuidanceHtml(opts.args || []));
    return false;
  }
  var calHtml = buildCalendarsHtmlForSpec(spec);
  if (opts.dest === 'broadcast') sendToAll(calHtml);
  else whisper(opts.who, calHtml);
  return true;
}

function parseUnifiedRange(tokens){
  if (tokens.length && _isPhrase(tokens[0].toLowerCase())){
    var ps = _phraseToSpec(tokens);
    if (ps) return ps;
  }

  var cal=getCal(), cur=cal.current, months=cal.months, dpy=daysPerYear();

  var ow = Parse.ordinalWeekday.fromTokens(tokens);
  if (ow){
    var year = (typeof ow.year==='number') ? ow.year : cur.year;
    var mi   = (ow.mi!==-1) ? ow.mi : cur.month;
    var day;
    if (ow.ord==='last') day = _lastWeekdayOfMonth(year, mi, ow.wdi);
    else {
      var nth = {first:1,second:2,third:3,fourth:4,fifth:5}[ow.ord]||1;
      day = _nthWeekdayOfMonth(year, mi, ow.wdi, nth);
      if (day==null){ day = _lastWeekdayOfMonth(year, mi, ow.wdi); }
    }
    var start = toSerial(year, mi, day), end = start;
    return {
      title: (ow.ord==='last' ? 'Last ' : (String(ow.ord).charAt(0).toUpperCase()+String(ow.ord).slice(1)+' ')) + getCal().weekdays[ow.wdi] + ' — ' + formatDateLabel(year, mi, day, true),
      start:start, end:end, months:[{y:year,mi:mi}]
    };
  }

  var md = Parse.monthYearLoose(tokens);

  if (md.mi!==-1 && md.day!=null && md.year!=null){
    var dClamp = clamp(md.day, 1, months[md.mi].days);
    var s = toSerial(md.year, md.mi, dClamp);
    return { title:'Events — '+formatDateLabel(md.year, md.mi, dClamp, true),
             start:s, end:s, months:[{y:md.year,mi:md.mi}] };
  }
  if (md.mi!==-1 && md.day!=null){
    var nextY = nextForMonthDay(cur, md.mi, md.day).year;
    var d2 = clamp(md.day, 1, months[md.mi].days);
    var s2 = toSerial(nextY, md.mi, d2);
    return { title:'Next ' + _displayMonthDayParts(md.mi, d2).label, start:s2, end:s2, months:[{y:nextY,mi:md.mi}] };
  }
  if (md.day!=null && md.mi===-1){
    var nextMY = nextForDayOnly(cur, md.day, months.length);
    var d3 = clamp(md.day, 1, months[nextMY.month].days);
    var s3 = toSerial(nextMY.year, nextMY.month, d3);
    return { title:'Next ' + _displayMonthDayParts(nextMY.month, d3).label, start:s3, end:s3, months:[{y:nextMY.year,mi:nextMY.month}] };
  }
  if (md.mi!==-1 && md.year!=null && md.day==null){
    var mdays = months[md.mi].days|0;
    return { title:'Events — '+months[md.mi].name+' '+md.year+' '+LABELS.era,
             start: toSerial(md.year, md.mi, 1), end: toSerial(md.year, md.mi, mdays), months:[{y:md.year,mi:md.mi}] };
  }
  if (md.mi!==-1 && md.day==null && md.year==null){
    var y3 = (md.mi >= cur.month) ? cur.year : (cur.year+1);
    var mdays3 = months[md.mi].days|0;
    return { title:'Events — '+months[md.mi].name+' (next occurrence)',
             start: toSerial(y3, md.mi, 1), end: toSerial(y3, md.mi, mdays3), months:[{y:y3,mi:md.mi}] };
  }
  if (md.year!=null && md.mi===-1){
    var sY = toSerial(md.year, 0, 1);
    return { title:'Events — Year '+md.year+' '+LABELS.era, start:sY, end:sY+dpy-1,
             months: months.map(function(_,i){return {y:md.year,mi:i};}) };
  }

  // Default: current month
  return {
    title:'This Month',
    start: toSerial(cur.year, cur.month, 1),
    end:   toSerial(cur.year, cur.month, getCal().months[cur.month].days),
    months:[{y:cur.year,mi:cur.month}]
  };
}

