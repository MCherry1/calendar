/* ============================================================================
 * 8) RENDERING
 * ==========================================================================*/

function clamp(n, min, max){ n = parseInt(n,10); if (!isFinite(n)) n = min; return n < min ? min : (n > max ? max : n); }
function int(v, fallback){ var n = parseInt(v,10); return isFinite(n) ? n : fallback; }
function esc(s){
  if (s == null) return '';
  return String(s)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function swatchHtml(colLike){
  var col = resolveColor(colLike) || '#888888';
  return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';" title="'+esc(col)+'"></span>';
}

function _buttonHasEmojiStart(s){
  s = String(s||'');
  return !!s && s.charCodeAt(0) > 127;
}

function _buttonIcon(lbl){
  var t = String(lbl||'').toLowerCase();
  if (/\b(show|view)\b/.test(t))            return '📅';
  if (/\b(send)\b/.test(t))                 return '📣';
  if (/\b(advance)\b/.test(t))              return '⏭️';
  if (/\b(retreat)\b/.test(t))              return '⏮️';
  if (/\b(list)\b/.test(t))                 return '📋';
  if (/\b(add|create)\b/.test(t))           return '➕';
  if (/\b(remove|delete)\b/.test(t))        return '🗑️';
  if (/\b(restore|enable)\b/.test(t))       return '↩️';
  if (/\b(apply|theme|colors?)\b/.test(t))  return '🎨';
  if (/\b(help|menu)\b/.test(t))            return '❔';
  if (/\b(back)\b/.test(t))                 return '⬅️';
  return '';
}

function button(label, cmd, opts){
  opts = opts || {};
  var lbl = String(label||'').trim();
  var icon = (opts.icon!=null) ? String(opts.icon) : (_buttonHasEmojiStart(lbl) ? '' : _buttonIcon(lbl));
  var text = (icon ? (icon+' ') : '') + lbl;
  return '['+esc(text)+'](!cal '+cmd+')';
}

function _firstTok(s){ return String(s||'').trim().split(/\s+/)[0].toLowerCase(); }

function _canRunTop(playerid, tok){
  var cfg = commands[tok];
  if (!cfg) return true;
  return !cfg.gm || playerIsGM(playerid);
}

function canRunCommand(playerid, cmdStr){
  return _canRunTop(playerid, _firstTok(cmdStr));
}

function mbP(m, label, cmd, opts){
  return canRunCommand(m.playerid, cmd) ? button(label, cmd, opts) : '';
}

function navP(m, label, page, opts){
  return button(label, 'help '+page, opts);
}

function weekdayAbbr(name){
  var st  = ensureSettings();
  var sys = CALENDAR_SYSTEMS[st.calendarSystem];
  var map = (sys && sys.weekdayAbbr) || {};
  if (map[name] != null) return map[name];
  var s = String(name || '').trim();
  return (s.length <= 3) ? s : s.slice(0,3);
}

function weekdayHeaderLabels(useAbbr){
  var cal = getCal();
  return cal.weekdays.map(function(n){ return useAbbr ? weekdayAbbr(n) : n; });
}

function openMonthTable(mi, yearLabel, abbrHeaders){
  var cal = getCal(), cur = cal.current, mObj = cal.months[mi];
  var monthColor = colorForMonth(mi);
  var monthHeaderStyle = colorsAPI.styleMonthHeader(monthColor);

  var useAbbr = (abbrHeaders !== false);
  var wd = useAbbr ? weekdayHeaderLabels(true) : cal.weekdays;

  var head = [
    '<table style="'+STYLES.table+'">',
    '<tr><th colspan="'+wd.length+'" style="'+STYLES.head+'">',
    '<div style="'+STYLES.monthHeaderBase+monthHeaderStyle+'">',
      esc(mObj.name),
      '<span style="float:right;">'+esc(String(yearLabel!=null?yearLabel:cur.year))+' '+LABELS.era+'</span>',
    '</div>',
    '</th></tr>',
    '<tr>'+ wd.map(function(d){ return '<th style="'+STYLES.th+'">'+esc(d)+'</th>'; }).join('') +'</tr>'
  ].join('');

  return { html: head, monthColor: monthColor };
}

function closeMonthTable(){ return '</table>'; }

function makeDayCtx(y, mi, d, dimActive, extraEventsFn, includeCalendarEvents){
  var ser = toSerial(y, mi, d);
  var tSer = todaySerial();
  var baseEvents = (includeCalendarEvents === false) ? [] : getEventsFor(mi, d, y);
  var extraEvents = [];
  if (typeof extraEventsFn === 'function'){
    var add = extraEventsFn(ser);
    if (Array.isArray(add)) extraEvents = add;
  }
  var events = sortEventsByPriority((baseEvents || []).concat(extraEvents || []));
  var label = events.length ? events.map(eventDisplayName).filter(Boolean).join('\n') : '';
  return {
    y:y, mi:mi, d:d, serial:ser,
    isToday:  (ser === tSer),
    isPast:   !!dimActive && (ser <  tSer),
    isFuture: !!dimActive && (ser >  tSer),
    events:   events,
    title:    label
  };
}

function styleForDayCell(baseStyle, events, isToday, monthColor, isPast, isFuture){
  // Primary event (or today) sets the solid background color.
  // Secondary events are rendered as dots by _eventDotsHtml — not styled here.
  var style = baseStyle;
  if (events.length >= 1){
    style = applyBg(style, getEventColor(events[0]), CONTRAST_MIN_CELL);
  } else if (isToday){
    style = applyBg(style, monthColor, CONTRAST_MIN_CELL);
  }
  if (isPast)   style += STYLES.past;
  if (isFuture) style += STYLES.future;
  if (isToday)  style += STYLES.today;
  return style;
}

function _calendarCellInnerHtml(content, extraStyle){
  return '<div style="'+STYLES.calCellInner+(extraStyle||'')+'">'+content+'</div>';
}

function tdHtmlForDay(ctx, monthColor, baseStyle, numeralStyle){
  var style = styleForDayCell(baseStyle, ctx.events, ctx.isToday, monthColor, ctx.isPast, ctx.isFuture);
  var titleAttr = ctx.title ? ' title="'+esc(ctx.title)+'" aria-label="'+esc(ctx.title)+'"' : '';
  var numWrap = '<div'+(numeralStyle ? ' style="'+numeralStyle+'"' : '')+'>'+ctx.d+'</div>';
  var dots = _eventDotsHtml(ctx.events);
  return '<td'+titleAttr+' style="'+style+'">'+_calendarCellInnerHtml(numWrap+dots)+'</td>';
}

function _renderHarptosFestivalStrip(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, edgeMode){
  var ser = toSerial(y, mi, 1);
  var tSer = todaySerial();
  var baseEvents = (includeCalendarEvents === false) ? [] : getEventsFor(mi, 1, y);
  var extraEvents = [];
  if (typeof extraEventsFn === 'function'){
    var add = extraEventsFn(ser);
    if (Array.isArray(add)) extraEvents = add;
  }
  var events = sortEventsByPriority((baseEvents || []).concat(extraEvents || []));
  var title = events.length ? events.map(eventDisplayName).filter(Boolean).join('\n') : String(mobj.name || '');
  var ctx = {
    y:y, mi:mi, d:1, serial:ser,
    isToday: ser === tSer,
    isPast: !!dimActive && ser < tSer,
    isFuture: !!dimActive && ser > tSer,
    events: events,
    title: title
  };
  var wdCnt = weekLength()|0;
  var mColor = colorForMonth(mi);
  var hdrStyle = colorsAPI.styleMonthHeader(mColor);
  var festivalStyle = styleForDayCell(STYLES.calTd, ctx.events, ctx.isToday, mColor, ctx.isPast, ctx.isFuture);
  festivalStyle += 'font-style:italic;';
  var fillerStyle = STYLES.calTd + 'opacity:.28;background-color:'+mColor+';';
  var sep = 'border-left:3px double rgba(0,0,0,.25);';
  if (edgeMode === 'prev') sep = 'border-right:3px double rgba(0,0,0,.25);';
  fillerStyle += sep;
  var titleAttr = title ? ' title="'+esc(title)+'" aria-label="'+esc(title)+'"' : '';
  var dots = _eventDotsHtml(ctx.events);
  var festivalCell = '<td'+titleAttr+' style="'+festivalStyle+'">'+
    _calendarCellInnerHtml('<div style="font-size:.9em;line-height:1.2;">'+esc(mobj.name)+'</div>'+dots)+
    '</td>';
  var fillerCell = '<td colspan="'+Math.max(1, wdCnt - 1)+'" style="'+fillerStyle+'">'+
    _calendarCellInnerHtml('&nbsp;')+
    '</td>';
  var rowHtml = (edgeMode === 'prev')
    ? ('<tr>'+fillerCell+festivalCell+'</tr>')
    : ('<tr>'+festivalCell+fillerCell+'</tr>');
  return [
    '<table style="'+STYLES.table+'">',
    '<tr><th colspan="'+wdCnt+'" style="'+STYLES.head+'">',
    '<div style="'+STYLES.monthHeaderBase+hdrStyle+'">',
      esc(mobj.name),
      '<span style="float:right;">'+esc(String(y))+' '+LABELS.era+'</span>',
      (mobj.leapEvery ? ' <span style="font-size:.75em;opacity:.75;">(every '+mobj.leapEvery+' yrs)</span>' : ''),
    '</div>',
    '</th></tr>',
    rowHtml,
    '</table>'
  ].join('');
}

// Render a single full-width banner row for an intercalary (festival) day.
// Used instead of a grid for 1-day months like Midwinter or Shieldmeet.
function renderIntercalaryBanner(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents){
  if (ensureSettings().calendarSystem === 'faerunian'){
    return _renderHarptosFestivalStrip(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, 'full');
  }
  var ser    = toSerial(y, mi, 1);
  var tSer   = todaySerial();
  var baseEvents = (includeCalendarEvents === false) ? [] : getEventsFor(mi, 1, y);
  var extraEvents = [];
  if (typeof extraEventsFn === 'function'){
    var add = extraEventsFn(ser);
    if (Array.isArray(add)) extraEvents = add;
  }
  var events = sortEventsByPriority((baseEvents || []).concat(extraEvents || []));
  var title  = events.length ? events.map(eventDisplayName).filter(Boolean).join('\n') : '';
  var ctx = { y:y, mi:mi, d:1, serial:ser,
    isToday: ser === tSer,
    isPast:  !!dimActive && ser < tSer,
    isFuture:!!dimActive && ser > tSer,
    events: events, title: title };
  var mColor  = colorForMonth(mi);
  var hdrStyle = colorsAPI.styleMonthHeader(mColor);
  var cellStyle = styleForDayCell(STYLES.calTd, ctx.events, ctx.isToday, mColor, ctx.isPast, ctx.isFuture);
  cellStyle += 'text-align:center;font-style:italic;';
  var titleAttr = title ? ' title="'+esc(title)+'" aria-label="'+esc(title)+'"' : '';
  var dots = _eventDotsHtml(ctx.events);
  var wdCnt = weekLength()|0;
  var isGregorianLeapDay = (ensureSettings().calendarSystem === 'gregorian' && String(mobj.name||'') === 'Leap Day');
  var headerName = isGregorianLeapDay ? 'February 29' : mobj.name;
  return [
    '<table style="'+STYLES.table+'">',
    '<tr><th colspan="'+wdCnt+'" style="'+STYLES.head+'">',
    '<div style="'+STYLES.monthHeaderBase+hdrStyle+'">',
      esc(headerName),
      (mobj.leapEvery && !isGregorianLeapDay ? ' <span style="font-size:.75em;opacity:.75;">(every '+mobj.leapEvery+' yrs)</span>' : ''),
    '</div>',
    '</th></tr>',
    '<tr'+titleAttr+'><td colspan="'+wdCnt+'" style="'+cellStyle+'">',
    _calendarCellInnerHtml('<div style="font-size:.9em;line-height:1.5;">'+esc(headerName)+'</div>'+dots),
    '</td></tr>',
    '</table>'
  ].join('');
}

function renderMonthTable(opts){
  var cal = getCal(), cur = cal.current;
  var y  = (opts && typeof opts.year==='number') ? (opts.year|0) : cur.year;
  var mi = (opts && typeof opts.mi  === 'number') ? (opts.mi|0)   : cur.month;
  var mode = (opts && opts.mode) || 'full';
  var dimActive = !!(opts && opts.dimPast);
  var extraEventsFn = (opts && typeof opts.extraEventsFn === 'function') ? opts.extraEventsFn : null;
  var includeCalendarEvents = !(opts && opts.includeCalendarEvents === false);

  var mobj  = cal.months[mi];

  // Gregorian leap-day slot is rendered within February and not as a standalone month.
  if (_isGregorianLeapSlotMonthObj(mobj)) return '';

  // Leap month not active this year: render nothing.
  if (mobj.leapEvery && !_isLeapMonth(mobj, y)) return '';

  // Intercalary day: banner row instead of a grid.
  if (mobj.isIntercalary) return renderIntercalaryBanner(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents);

  var mdays = mobj.days|0;
  var febLeapSlot = null;
  var showGregorianFeb29 = false;
  if (ensureSettings().calendarSystem === 'gregorian' && !mobj.isIntercalary && String(mobj.name||'') === 'February'){
    for (var gmi=0; gmi<cal.months.length; gmi++){
      if (_isGregorianLeapSlotMonthObj(cal.months[gmi])){ febLeapSlot = gmi; break; }
    }
    if (febLeapSlot != null && _isLeapMonth(cal.months[febLeapSlot], y)){
      showGregorianFeb29 = true;
      mdays = mdays + 1;
    }
  }
  var parts = openMonthTable(mi, y, !(opts && opts.abbrHeaders===false));
  var html  = [parts.html];
  var wdCnt = weekLength()|0;

  if (mode === 'full'){
    var gridStart    = weekStartSerial(y, mi, 1);
    var lastRowStart = weekStartSerial(y, mi, mdays);
    for (var rowStart = gridStart; rowStart <= lastRowStart; rowStart += wdCnt){
      html.push('<tr>');
      for (var c=0; c<wdCnt; c++){
        var s = rowStart + c;
        var d = fromSerial(s);
        if (d.year === y && d.mi === mi){
          var ctx = makeDayCtx(y, mi, d.day, dimActive, extraEventsFn, includeCalendarEvents);
          html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.calTd, ''));
        } else if (showGregorianFeb29 && d.year === y && d.mi === febLeapSlot && d.day === 1){
          var leapSer = s;
          var leapBaseEvents = (includeCalendarEvents === false) ? [] : getEventsFor(febLeapSlot, 1, y);
          var leapExtraEvents = [];
          if (typeof extraEventsFn === 'function'){
            var leapAdd = extraEventsFn(leapSer);
            if (Array.isArray(leapAdd)) leapExtraEvents = leapAdd;
          }
          var leapEvents = sortEventsByPriority((leapBaseEvents || []).concat(leapExtraEvents || []));
          var leapTitle = leapEvents.length ? leapEvents.map(eventDisplayName).filter(Boolean).join('\n') : '';
          var leapCtx = {
            y:y, mi:mi, d:29, serial:leapSer,
            isToday: (leapSer === todaySerial()),
            isPast:  !!dimActive && (leapSer < todaySerial()),
            isFuture:!!dimActive && (leapSer > todaySerial()),
            events: leapEvents,
            title: leapTitle
          };
          html.push(tdHtmlForDay(leapCtx, parts.monthColor, STYLES.calTd, ''));
        } else {
          // Overflow cell: adjacent month's day, tinted with that month's color.
          var ovColor = colorForMonth(d.mi);
          var ovStyle = STYLES.calTd + 'background-color:'+ovColor+';opacity:.22;';
          html.push('<td style="'+ovStyle+'">'+_calendarCellInnerHtml('<div style="opacity:.55;">'+d.day+'</div>')+'</td>');
        }
      }
      html.push('</tr>');
    }
    html.push(closeMonthTable());
    return html.join('');
  }

  // mode === 'week'
  var startSer = (opts && typeof opts.weekStartSerial === 'number')
    ? (opts.weekStartSerial|0)
    : weekStartSerial(y, mi, 1);

  html.push('<tr>');
  for (var i=0; i<wdCnt; i++){
    var s2 = startSer + i;
    var d2 = fromSerial(s2);
    if (showGregorianFeb29 && d2.year === y && d2.mi === febLeapSlot && d2.day === 1){
      var leapSer2 = s2;
      var leapBaseEvents2 = (includeCalendarEvents === false) ? [] : getEventsFor(febLeapSlot, 1, y);
      var leapExtraEvents2 = [];
      if (typeof extraEventsFn === 'function'){
        var leapAdd2 = extraEventsFn(leapSer2);
        if (Array.isArray(leapAdd2)) leapExtraEvents2 = leapAdd2;
      }
      var leapEvents2 = sortEventsByPriority((leapBaseEvents2 || []).concat(leapExtraEvents2 || []));
      var leapTitle2 = leapEvents2.length ? leapEvents2.map(eventDisplayName).filter(Boolean).join('\n') : '';
      var leapCtx2 = {
        y:y, mi:mi, d:29, serial:leapSer2,
        isToday: (leapSer2 === todaySerial()),
        isPast:  !!dimActive && (leapSer2 < todaySerial()),
        isFuture:!!dimActive && (leapSer2 > todaySerial()),
        events: leapEvents2,
        title: leapTitle2
      };
      html.push(tdHtmlForDay(leapCtx2, parts.monthColor, STYLES.calTd, ''));
    } else {
      var ctx2 = makeDayCtx(d2.year, d2.mi, d2.day, dimActive, extraEventsFn, includeCalendarEvents);
      var numeralStyle = (d2.mi === mi) ? '' : 'opacity:.5;';
      html.push(tdHtmlForDay(ctx2, parts.monthColor, STYLES.calTd, numeralStyle));
    }
  }
  html.push('</tr>', closeMonthTable());
  return html.join('');
}

function renderMiniCal(mi, yearLabel, dimActive){
  var y = (typeof yearLabel === 'number') ? yearLabel : getCal().current.year;
  return renderMonthTable({ year:y, mi:mi, mode:'full', dimPast: !!dimActive });
}


function _ordinal(n){
  n = n|0;
  var v = n % 100;
  if (v >= 11 && v <= 13) return n + 'th';
  switch (n % 10){
    case 1: return n + 'st';
    case 2: return n + 'nd';
    case 3: return n + 'rd';
    default: return n + 'th';
  }
}


function yearHTMLFor(targetYear, dimActive){
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    // Skip leap months that don't occur this year.
    if (months[i].leapEvery && !_isLeapMonth(months[i], targetYear)) continue;
    var rendered = renderMiniCal(i, targetYear, !!dimActive);
    if (rendered) html.push('<div style="'+STYLES.wrap+'">'+rendered+'</div>');
  }
  html.push('</div>');
  return html.join('');
}

function formatDateLabel(y, mi, d, includeYear){
  var cal=getCal();
  var st  = ensureSettings();
  var mobj = cal.months[mi] || {};

  var lbl;
  if (st.calendarSystem === 'faerunian'){
    // Harptos is commonly written as "16th of Eleasis, 1491 DR".
    // Intercalary days are written by festival name only.
    lbl = mobj.isIntercalary
      ? esc(mobj.name)
      : (_ordinal(d) + ' of ' + esc(mobj.name));
  } else if (st.calendarSystem === 'gregorian' && mobj.isIntercalary && String(mobj.name||'') === 'Leap Day'){
    lbl = 'February 29';
  } else {
    lbl = esc(mobj.name)+' '+d;
  }

  if (includeYear) lbl += ', '+esc(String(y))+' '+LABELS.era;
  return lbl;
}

function monthEventsHtml(mi, today){
  var cal = getCal(), curYear = cal.current.year;

  function dayKey(e){
    var ow = Parse.ordinalWeekday.fromSpec(e.day);
    if (ow){
      if (ow.ord === 'every'){
        var first = _firstWeekdayOfMonth(curYear, mi, ow.wdi);
        return (first != null) ? first : 99;
      }
      var d = dayFromOrdinalWeekday(curYear, mi, ow);
      return (d != null) ? d : 99;
    }
    return DaySpec.first(e.day);
  }

  var evs = cal.events.filter(function(e){
    return ((+e.month||1)-1) === mi && (e.year == null || (e.year|0) === (curYear|0));
  }).sort(function(a,b){
    var da = dayKey(a), db = dayKey(b);
    if (da !== db) return da - db;
    var ay = (a.year==null)?1:0, by = (b.year==null)?1:0;
    if (ay !== by) return ay - by;
    return String(a.name||'').localeCompare(String(b.name||''));
  });

  return evs.map(function(e){
    var isToday = false;
    var ows = Parse.ordinalWeekday.fromSpec(e.day);
    if (ows){
      if (ows.ord === 'every'){
        isToday = (weekdayIndex(curYear, mi, today) === ows.wdi);
      } else {
        isToday = (dayFromOrdinalWeekday(curYear, mi, ows) === today);
      }
    } else {
      isToday = DaySpec.matches(e.day)(today);
    }

    var swatch = swatchHtml(getEventColor(e));
    var name = esc(eventDisplayName(e));
    var style = isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"';
    return '<div'+style+'>'+swatch+' '+name+'</div>';
  }).join('');
}

function eventLineHtml(y, mi, d, name, includeYear, isToday, color){
  var dateLbl = formatDateLabel(y, mi, d, includeYear);
  var sw = swatchHtml(color);
  var sty = isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"';
  return '<div'+sty+'>'+ sw + ' ' + dateLbl + ': ' + esc(name) + '</div>';
}

