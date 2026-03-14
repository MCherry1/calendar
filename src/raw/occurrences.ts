/* ============================================================================
 * 10) OCCURRENCES, BOUNDARY STRIPS & LISTS
 * ==========================================================================*/

function occurrencesInRange(startSerial, endSerial){
  var cal = getCal();
  var yStart = fromSerial(startSerial).y, yEnd = fromSerial(endSerial).y;

  var capYears = (typeof RANGE_CAP_YEARS==='number' && RANGE_CAP_YEARS>0) ? RANGE_CAP_YEARS : null;
  var capNotice = false;
  if (capYears && (yEnd - yStart > capYears)){
    yEnd = yStart + capYears;
    capNotice = true;
  }

  var occ = [];
  for (var i=0;i<cal.events.length;i++){
    var e = cal.events[i];
    var mi = clamp(e.month,1,cal.months.length)-1;
    var maxD = cal.months[mi].days|0;
    var ows = Parse.ordinalWeekday.fromSpec(e.day);

    var ys = (e.year==null) ? yStart : (e.year|0);
    var ye = (e.year==null) ? yEnd   : (e.year|0);

    for (var y=ys; y<=ye; y++){
      var days = ows
        ? (ows.ord === 'every'
            ? _allWeekdaysInMonth(y, mi, ows.wdi)
            : (function(){ var d = dayFromOrdinalWeekday(y, mi, ows); return d ? [d] : []; })())
        : DaySpec.expand(e.day, maxD);

      for (var k=0;k<days.length;k++){
        var d = clamp(days[k],1,maxD);
        var ser = toSerial(y, mi, d);
        if (ser>=startSerial && ser<=endSerial){
          occ.push({serial:ser, y:y, m:mi, d:d, e:e});
        }
      }
    }
  }
  occ.sort(function(a,b){
    return (a.serial - b.serial) || (a.m - b.m) || (a.d - b.d);
  });
  if (capNotice){ sendChat(script_name,'/w gm Range capped at '+capYears+' years for performance.'); }
  return occ;
}

function _rowDaysInMonth(y, mi, rowStart){
  var cal = getCal(), wdCount = cal.weekdays.length|0, out = [];
  for (var c=0; c<wdCount; c++){
    var d = fromSerial(rowStart + c);
    if (d.year === y && d.mi === mi) out.push(d.day);
  }
  return out;
}

function _setAddAll(setObj, arr){ for (var i=0;i<arr.length;i++) setObj[arr[i]] = 1; }
function _setCount(setObj){ return Object.keys(setObj).length; }
function _setMin(setObj){ var keys = Object.keys(setObj).map(function(k){return +k;}); return keys.length ? Math.min.apply(null, keys) : null; }
function _setMax(setObj){ var keys = Object.keys(setObj).map(function(k){return +k;}); return keys.length ? Math.max.apply(null, keys) : null; }

function renderMonthStripWantedDays(year, mi, wantedSet, dimActive, extraEventsFn, includeCalendarEvents, stripRole){
  var mobj = getCal().months[mi] || {};
  if (ensureSettings().calendarSystem === 'faerunian' && mobj.isIntercalary && wantedSet && wantedSet[1]){
    return _renderHarptosFestivalStrip(year, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, stripRole || 'full');
  }
  var parts = openMonthTable(mi, year);
  var html  = [parts.html];
  var wdCnt = getCal().weekdays.length|0;

  var minD = _setMin(wantedSet), maxD = _setMax(wantedSet);
  if (minD == null || maxD == null){
    html.push('<tr><td colspan="'+wdCnt+'" style="'+STYLES.calTd+';opacity:.6;">'+_calendarCellInnerHtml('(no days)')+'</td></tr>');
    html.push(closeMonthTable());
    return html.join('');
  }

  var firstRow = weekStartSerial(year, mi, minD);
  var lastRow  = weekStartSerial(year, mi, maxD);
  for (var rowStart = firstRow; rowStart <= lastRow; rowStart += wdCnt){
    html.push('<tr>');
    for (var c=0; c<wdCnt; c++){
      var s = rowStart + c;
      var d = fromSerial(s);
      if (d.year === year && d.mi === mi && wantedSet[d.day]){
        var ctx = makeDayCtx(d.year, d.mi, d.day, !!dimActive, extraEventsFn, includeCalendarEvents);
        html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.calTd, ''));
      } else {
        html.push('<td style="'+STYLES.calTd+'">'+_calendarCellInnerHtml('')+'</td>');
      }
    }
    html.push('</tr>');
  }
  html.push(closeMonthTable());
  return html.join('');
}

function adjacentPartialMonths(spec){
  var cal = getCal(), today = todaySerial();
  var res = { prev:null, next:null };
  var wdCnt = weekLength()|0;

  function collectMonthRows(y, mi, firstRow, lastRow){
    var wanted = {};
    for (var row = firstRow; row <= lastRow; row += wdCnt){
      _setAddAll(wanted, _rowDaysInMonth(y, mi, row));
    }
    return wanted;
  }

  // ── Case A: today is BEFORE the range but nearby ─────────────────────────
  // Show the tail of the previous month so the current date has context.
  if (today < spec.start && (spec.start - today) <= CONFIG_NEARBY_DAYS){
    var startD = fromSerial(spec.start);
    var _adjP = _prevActiveMi(startD.mi, startD.year);
    var prevMi = _adjP.mi, prevY = _adjP.y;
    var prevMD = cal.months[prevMi].days|0;

    var tD = fromSerial(today);
    var todayDay = (tD.year === prevY && tD.mi === prevMi) ? tD.day : prevMD;

    var todayRow = weekStartSerial(prevY, prevMi, todayDay);
    var lastRow  = weekStartSerial(prevY, prevMi, prevMD);

    var wanted = collectMonthRows(prevY, prevMi, todayRow, lastRow);

    var backRow = todayRow - wdCnt, safety = 0;
    while (_setCount(wanted) < 5 && safety++ < 6){
      var extra = _rowDaysInMonth(prevY, prevMi, backRow);
      if (!extra.length) break;
      _setAddAll(wanted, extra);
      backRow -= wdCnt;
    }
    res.prev = { y:prevY, mi:prevMi, wanted:wanted };
  }

  // ── Case B: today is AFTER the range but nearby ──────────────────────────
  // Show the head of the next month so the current date has context.
  if (today > spec.end && (today - spec.end) <= CONFIG_NEARBY_DAYS){
    var endD = fromSerial(spec.end);
    var _adjN = _nextActiveMi(endD.mi, endD.year);
    var nextMi = _adjN.mi, nextY = _adjN.y;

    var firstRow = weekStartSerial(nextY, nextMi, 1);

    var tD2 = fromSerial(today);
    var todayRow2 = (tD2.year === nextY && tD2.mi === nextMi)
      ? weekStartSerial(nextY, nextMi, tD2.day)
      : firstRow;

    var wanted2 = collectMonthRows(nextY, nextMi, firstRow, todayRow2);

    var fwdRow = todayRow2 + wdCnt, safety2 = 0;
    while (_setCount(wanted2) < 5 && safety2++ < 6){
      var extra2 = _rowDaysInMonth(nextY, nextMi, fwdRow);
      if (!extra2.length) break;
      _setAddAll(wanted2, extra2);
      fwdRow += wdCnt;
    }
    res.next = { y:nextY, mi:nextMi, wanted:wanted2 };
  }

  // ── Case C: today is INSIDE the range, in the first calendar row ─────────
  // Show the last row of the previous month so the week boundary has context.
  if (!res.prev && today >= spec.start && today <= spec.end){
    var sd = fromSerial(spec.start);
    var firstRowStart = weekStartSerial(sd.year, sd.mi, 1);
    if (today >= firstRowStart && today < firstRowStart + wdCnt){
      var pMi = (sd.mi + cal.months.length - 1) % cal.months.length;
      var pY  = sd.year - (sd.mi === 0 ? 1 : 0);
      var pMD = cal.months[pMi].days|0;
      var pLastRow = weekStartSerial(pY, pMi, pMD);
      var wantedP = {};
      _setAddAll(wantedP, _rowDaysInMonth(pY, pMi, pLastRow));
      if (_setCount(wantedP)) res.prev = { y:pY, mi:pMi, wanted:wantedP };
    }
  }

  // ── Case D: today is INSIDE the range, in the last calendar row ──────────
  // Show the first row of the next month so the week boundary has context.
  if (!res.next && today >= spec.start && today <= spec.end){
    var ed = fromSerial(spec.end);
    var edMD = cal.months[ed.mi].days|0;
    var lastRowStart = weekStartSerial(ed.year, ed.mi, edMD);
    if (today >= lastRowStart && today < lastRowStart + wdCnt){
      var nMi = (ed.mi + 1) % cal.months.length;
      var nY  = ed.year + (nMi === 0 ? 1 : 0);
      var nFirstRow = weekStartSerial(nY, nMi, 1);
      var wantedN = {};
      _setAddAll(wantedN, _rowDaysInMonth(nY, nMi, nFirstRow));
      if (_setCount(wantedN)) res.next = { y:nY, mi:nMi, wanted:wantedN };
    }
  }

  return res;
}

function _monthsFromRangeSpec(spec){
  if (spec.months && spec.months.length) return spec.months.slice();
  var months = [], cal=getCal();
  // Estimate bounding years using _daysBeforeYear inverse (subtract 1 for safety).
  var avgDpy = _serialCache.avgDpy || daysPerYear();
  var firstY = Math.max(0, Math.floor(spec.start / avgDpy) - 1);
  var lastY  = Math.floor(spec.end   / avgDpy) + 1;
  // Walk backwards from estimate until _daysBeforeYear(firstY) <= spec.start.
  while (firstY > 0 && _daysBeforeYear(firstY) > spec.start) firstY--;
  while (_daysBeforeYear(firstY + 1) <= spec.start) firstY++;
  for (var y=firstY; y<=lastY; y++){
    var yearStart = _daysBeforeYear(y);
    if (yearStart > spec.end) break;
    for (var mi=0; mi<cal.months.length; mi++){
      var m = cal.months[mi];
      if (m.leapEvery && !_isLeapMonth(m, y)) continue; // inactive leap slot
      var s = toSerial(y, mi, 1), e = toSerial(y, mi, m.days|0);
      if (e < spec.start) continue;
      if (s > spec.end) break;
      months.push({y:y, mi:mi});
    }
  }
  return months;
}

function buildCalendarsHtmlForSpec(spec){
  spec = spec || {};
  var months = _monthsFromRangeSpec(spec);
  var out = ['<div style="text-align:left;">'];
  var extraEventsFn = (typeof spec.extraEventsFn === 'function') ? spec.extraEventsFn : null;
  var includeCalendarEvents = !(spec.includeCalendarEvents === false);

  var present = {};
  for (var i=0; i<months.length; i++){
    present[ months[i].y + '|' + months[i].mi ] = 1;
  }

  var boundary = adjacentPartialMonths(spec);
  var today = todaySerial();
  var td = fromSerial(today);

  function stripHasToday(s) {
    if (!s || !s.wanted) return false;
    return (td.year === s.y) && (td.mi === s.mi) && !!s.wanted[td.day];
  }

  var prevKey = boundary.prev ? (boundary.prev.y + '|' + boundary.prev.mi) : null;
  var nextKey = boundary.next ? (boundary.next.y + '|' + boundary.next.mi) : null;

  var dimActiveAll =
    isTodayVisibleInRange(spec.start, spec.end) ||
    (!!boundary.prev && !present[prevKey] && stripHasToday(boundary.prev)) ||
    (!!boundary.next && !present[nextKey] && stripHasToday(boundary.next));

  if (boundary.prev && !present[ boundary.prev.y + '|' + boundary.prev.mi ]){
    out.push('<div style="'+STYLES.wrap+'">'+renderMonthStripWantedDays(boundary.prev.y, boundary.prev.mi, boundary.prev.wanted, dimActiveAll, extraEventsFn, includeCalendarEvents, 'prev')+'</div>');
  }

  for (var k=0; k<months.length; k++){
    var m = months[k];
    out.push('<div style="'+STYLES.wrap+'">'+renderMonthTable({
      year:m.y,
      mi:m.mi,
      mode:'full',
      dimPast: dimActiveAll,
      extraEventsFn: extraEventsFn,
      includeCalendarEvents: includeCalendarEvents
    })+'</div>');
  }

  if (boundary.next && !present[ boundary.next.y + '|' + boundary.next.mi ]){
    out.push('<div style="'+STYLES.wrap+'">'+renderMonthStripWantedDays(boundary.next.y, boundary.next.mi, boundary.next.wanted, dimActiveAll, extraEventsFn, includeCalendarEvents, 'next')+'</div>');
  }

  out.push('</div>');
  return out.join('');
}

function stripRangeExtensionDynamic(spec){
  var months = _monthsFromRangeSpec(spec);
  var present = {};
  for (var i=0;i<months.length;i++) present[ months[i].y + '|' + months[i].mi ] = 1;

  var boundary = adjacentPartialMonths(spec);
  var start = spec.start, end = spec.end;

  if (boundary.prev && !present[ boundary.prev.y + '|' + boundary.prev.mi ]){
    var minPrev = _setMin(boundary.prev.wanted);
    var maxPrev = _setMax(boundary.prev.wanted);
    if (minPrev != null && maxPrev != null){
      start = Math.min(start, toSerial(boundary.prev.y, boundary.prev.mi, minPrev));
      end   = Math.max(end,   toSerial(boundary.prev.y, boundary.prev.mi, maxPrev));
    }
  }
  if (boundary.next && !present[ boundary.next.y + '|' + boundary.next.mi ]){
    var minNext = _setMin(boundary.next.wanted);
    var maxNext = _setMax(boundary.next.wanted);
    if (minNext != null && maxNext != null){
      start = Math.min(start, toSerial(boundary.next.y, boundary.next.mi, minNext));
      end   = Math.max(end,   toSerial(boundary.next.y, boundary.next.mi, maxNext));
    }
  }

  if (start !== spec.start || end !== spec.end) return { start:start, end:end };
  return null;
}

