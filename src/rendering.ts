// Sections 8+11+14: Rendering + Show/Send + Buttoned Tables
import { CONTRAST_MIN_CELL, LABELS, STYLES, script_name, state_name } from './constants.js';
import { colorForMonth, ensureSettings, getCal, refreshAndSend, titleCase, weekLength } from './state.js';
import { _eventDotsHtml, applyBg, colorsAPI, resolveColor } from './color.js';
import { _isGregorianLeapSlotMonthObj, _isLeapMonth, daysPerYear, fromSerial, toSerial, todaySerial, weekStartSerial, weekdayIndex } from './date-math.js';
import { DaySpec, Parse } from './parsing.js';
import { _firstWeekdayOfMonth, _tokenizeRangeArgs, autoColorForEvent, buildCalendarsHtmlForSpec, dayFromOrdinalWeekday, eventDisplayName, eventKey, eventsListHTMLForRange, getEventColor, getEventsFor, mergeInNewDefaultEvents, parseUnifiedRange, sortEventsByPriority, stripRangeExtensionDynamic } from './events.js';
import { _defaultDetailsForKey, mb } from './ui.js';
import { send, sendToAll, whisper } from './messaging.js';
import { commands } from './today.js';
import { intercalaryRenderFor, dateFormatFor } from './worlds/index.js';
import { CALENDAR_SYSTEMS } from './config.js';


/* ============================================================================
 * 8) RENDERING
 * ==========================================================================*/

export function clamp(n, min, max){ n = parseInt(n,10); if (!isFinite(n)) n = min; return n < min ? min : (n > max ? max : n); }
export function int(v, fallback){ var n = parseInt(v,10); return isFinite(n) ? n : fallback; }
export function esc(s){
  if (s == null) return '';
  return String(s)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function swatchHtml(colLike){
  var col = resolveColor(colLike) || '#888888';
  return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';" title="'+esc(col)+'"></span>';
}

export function _buttonHasEmojiStart(s){
  s = String(s||'');
  return !!s && s.charCodeAt(0) > 127;
}

export function _buttonIcon(lbl){
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

export function button(label, cmd, opts?){
  opts = opts || {};
  var lbl = String(label||'').trim();
  var icon = (opts.icon!=null) ? String(opts.icon) : (_buttonHasEmojiStart(lbl) ? '' : _buttonIcon(lbl));
  var text = (icon ? (icon+' ') : '') + lbl;
  return '['+esc(text)+'](!cal '+cmd+')';
}

export function _firstTok(s){ return String(s||'').trim().split(/\s+/)[0].toLowerCase(); }

export function _canRunTop(playerid, tok){
  var cfg = commands[tok];
  if (!cfg) return true;
  return !cfg.gm || playerIsGM(playerid);
}

export function canRunCommand(playerid, cmdStr){
  return _canRunTop(playerid, _firstTok(cmdStr));
}

export function mbP(m, label, cmd, opts?){
  return canRunCommand(m.playerid, cmd) ? button(label, cmd, opts) : '';
}

export function navP(m, label, page, opts?){
  return button(label, 'help '+page, opts);
}

export function weekdayAbbr(name){
  var st  = ensureSettings();
  var sys = CALENDAR_SYSTEMS[st.calendarSystem];
  var map = (sys && sys.weekdayAbbr) || {};
  if (map[name] != null) return map[name];
  var s = String(name || '').trim();
  return (s.length <= 3) ? s : s.slice(0,3);
}

export function weekdayHeaderLabels(useAbbr){
  var cal = getCal();
  return cal.weekdays.map(function(n){ return useAbbr ? weekdayAbbr(n) : n; });
}

export function openMonthTable(mi, yearLabel, abbrHeaders?){
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

export function closeMonthTable(){ return '</table>'; }

export function makeDayCtx(y, mi, d, dimActive, extraEventsFn, includeCalendarEvents){
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

export function styleForDayCell(baseStyle, events, isToday, monthColor, isPast, isFuture){
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

export function _calendarCellInnerHtml(content, extraStyle?){
  return '<div style="'+STYLES.calCellInner+(extraStyle||'')+'">'+content+'</div>';
}

export function tdHtmlForDay(ctx, monthColor, baseStyle, numeralStyle){
  var style = styleForDayCell(baseStyle, ctx.events, ctx.isToday, monthColor, ctx.isPast, ctx.isFuture);
  var titleAttr = ctx.title ? ' title="'+esc(ctx.title)+'" aria-label="'+esc(ctx.title)+'"' : '';
  var numStyle = 'display:flex;align-items:center;justify-content:center;min-height:1.05em;line-height:1;';
  if (numeralStyle) numStyle += numeralStyle;
  var numWrap = '<div style="'+numStyle+'">'+ctx.d+'</div>';
  var dots = _eventDotsHtml(ctx.events);
  return '<td'+titleAttr+' style="'+style+'">'+_calendarCellInnerHtml(numWrap+dots)+'</td>';
}

export function _renderHarptosFestivalStrip(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, edgeMode){
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
export function renderIntercalaryBanner(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents){
  if (intercalaryRenderFor(ensureSettings().calendarSystem) === 'festival_strip'){
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
  var isBannerLeapDay = (intercalaryRenderFor(ensureSettings().calendarSystem) === 'banner_day' && String(mobj.name||'') === 'Leap Day');
  var headerName = isBannerLeapDay ? 'February 29' : mobj.name;
  return [
    '<table style="'+STYLES.table+'">',
    '<tr><th colspan="'+wdCnt+'" style="'+STYLES.head+'">',
    '<div style="'+STYLES.monthHeaderBase+hdrStyle+'">',
      esc(headerName),
      (mobj.leapEvery && !isBannerLeapDay ? ' <span style="font-size:.75em;opacity:.75;">(every '+mobj.leapEvery+' yrs)</span>' : ''),
    '</div>',
    '</th></tr>',
    '<tr'+titleAttr+'><td colspan="'+wdCnt+'" style="'+cellStyle+'">',
    _calendarCellInnerHtml('<div style="font-size:.9em;line-height:1.5;">'+esc(headerName)+'</div>'+dots),
    '</td></tr>',
    '</table>'
  ].join('');
}

export function renderMonthTable(opts){
  var cal = getCal(), cur = cal.current;
  var y  = (opts && typeof opts.year==='number') ? (opts.year|0) : cur.year;
  var mi = (opts && typeof opts.mi  === 'number') ? (opts.mi|0)   : cur.month;
  var mode = (opts && opts.mode) || 'full';
  var dimActive = !!(opts && opts.dimPast);
  var extraEventsFn = (opts && typeof opts.extraEventsFn === 'function') ? opts.extraEventsFn : null;
  var includeCalendarEvents = !(opts && opts.includeCalendarEvents === false);

  var mobj  = cal.months[mi];

  var renderMode = intercalaryRenderFor(ensureSettings().calendarSystem);

  // banner_day leap-day slot is rendered within its parent month, not standalone.
  if (_isGregorianLeapSlotMonthObj(mobj)) return '';

  // Leap month not active this year: render nothing.
  if (mobj.leapEvery && !_isLeapMonth(mobj, y)) return '';

  // Intercalary day: banner row instead of a grid.
  if (mobj.isIntercalary) return renderIntercalaryBanner(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents);

  var mdays = mobj.days|0;
  var febLeapSlot = null;
  var showBannerLeapDay = false;
  if (renderMode === 'banner_day' && !mobj.isIntercalary){
    // Find a leap-day slot that follows this month (banner_day inlines it).
    for (var gmi=0; gmi<cal.months.length; gmi++){
      if (_isGregorianLeapSlotMonthObj(cal.months[gmi])){ febLeapSlot = gmi; break; }
    }
    // Only show the inlined day if this is the month immediately before the leap slot,
    // AND it's a leap year.
    if (febLeapSlot != null && febLeapSlot === mi + 1 && _isLeapMonth(cal.months[febLeapSlot], y)){
      showBannerLeapDay = true;
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
        } else if (showBannerLeapDay && d.year === y && d.mi === febLeapSlot && d.day === 1){
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
    if (showBannerLeapDay && d2.year === y && d2.mi === febLeapSlot && d2.day === 1){
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

export function renderMiniCal(mi, yearLabel, dimActive){
  var y = (typeof yearLabel === 'number') ? yearLabel : getCal().current.year;
  return renderMonthTable({ year:y, mi:mi, mode:'full', dimPast: !!dimActive });
}


export function _ordinal(n){
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


export function yearHTMLFor(targetYear, dimActive){
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

export function formatDateLabel(y, mi, d, includeYear){
  var cal=getCal();
  var st  = ensureSettings();
  var mobj = cal.months[mi] || {};

  var lbl;
  var fmt = dateFormatFor(st.calendarSystem);
  if (fmt === 'ordinal_of_month'){
    // "16th of Eleasis" / "Midwinter" (festival name only for intercalary)
    lbl = mobj.isIntercalary
      ? esc(mobj.name)
      : (_ordinal(d) + ' of ' + esc(mobj.name));
  } else if (fmt === 'month_day_year'){
    // "January 14" / "February 29" for banner leap day
    if (mobj.isIntercalary && String(mobj.name||'') === 'Leap Day'){
      lbl = 'February 29';
    } else {
      lbl = esc(mobj.name)+' '+d;
    }
  } else {
    lbl = esc(mobj.name)+' '+d;
  }

  if (includeYear) lbl += ', '+esc(String(y))+' '+LABELS.era;
  return lbl;
}

export function monthEventsHtml(mi, today){
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

export function eventLineHtml(y, mi, d, name, includeYear, isToday, color){
  var dateLbl = formatDateLabel(y, mi, d, includeYear);
  var sw = swatchHtml(color);
  var sty = isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"';
  return '<div'+sty+'>'+ sw + ' ' + dateLbl + ': ' + esc(name) + '</div>';
}



/* ============================================================================
 * 11) SHOW/SEND
 * ==========================================================================*/

export function deliverRange(opts){
  opts = opts || {};
  var args = opts.args || [];

  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));
  var calHtml = buildCalendarsHtmlForSpec(spec);
  var html = calHtml;

  if (opts.mode !== 'cal'){
    var ext = stripRangeExtensionDynamic(spec) || spec;
    var forceYear = (Math.floor(ext.start/daysPerYear()) !== Math.floor(ext.end/daysPerYear()));
    var listHtml = eventsListHTMLForRange(spec.title, ext.start, ext.end, forceYear);
    html = calHtml + '<div style="height:8px"></div>' + listHtml;
  }

  return (opts.dest === 'broadcast') ? sendToAll(html) : whisper(opts.who, html);
}

// ---------------------------------------------------------------------------
// Synthetic minical helpers (for subsystem overlays)
// ---------------------------------------------------------------------------

export function _buildSyntheticEventsLookup(syntheticEvents, fallbackTitle){
  var bySerial = {};
  if (!Array.isArray(syntheticEvents)) return bySerial;
  for (var i = 0; i < syntheticEvents.length; i++){
    var se = syntheticEvents[i];
    if (!se || !isFinite(se.serial)) continue;
    var key = String(se.serial|0);
    if (!bySerial[key]) bySerial[key] = [];
    bySerial[key].push({
      name: String(se.name || fallbackTitle || 'Highlight'),
      color: resolveColor(se.color) || '#607D8B',
      source: null
    });
  }
  return bySerial;
}

export function _renderSyntheticMiniCal(title, startSerial, endSerial, syntheticEvents){
  var bySerial = _buildSyntheticEventsLookup(syntheticEvents, title);
  var startDate = fromSerial(startSerial|0);
  var endDate = fromSerial(endSerial|0);
  if (startDate.year === endDate.year && startDate.mi === endDate.mi && startDate.day === 1){
    var monthObj = getCal().months[startDate.mi] || {};
    var monthDays = Math.max(1, monthObj.days|0);
    if (endDate.day === monthDays){
      return renderMonthTable({
        year: startDate.year,
        mi: startDate.mi,
        mode: 'full',
        includeCalendarEvents: false,
        extraEventsFn: function(serial){
          return bySerial[String(serial)] || [];
        }
      });
    }
  }
  return buildCalendarsHtmlForSpec({
    title: title,
    start: startSerial,
    end: endSerial,
    includeCalendarEvents: false,
    extraEventsFn: function(serial){
      return bySerial[String(serial)] || [];
    }
  });
}

export function _monthRangeFromSerial(serial){
  var d = fromSerial(serial|0);
  var m = getCal().months[d.mi] || {};
  var days = Math.max(1, m.days|0);
  return {
    start: toSerial(d.year, d.mi, 1),
    end: toSerial(d.year, d.mi, days),
    year: d.year,
    mi: d.mi
  };
}

export function _stripHtmlTags(s){
  return String(s || '').replace(/<[^>]*>/g, '').trim();
}



/* ============================================================================
 * 14) BUTTONED TABLES / LISTS
 * ==========================================================================*/

export function _encKey(k){ return encodeURIComponent(String(k)); }
export function _decKey(k){ try { return decodeURIComponent(String(k)); } catch(e){ return String(k||''); } }

export function _eventSeriesKey(e){
  var y   = (e.year==null) ? 'ALL' : String(e.year|0);
  var day = String(e.day||'').trim().toLowerCase();
  var nm  = String(e.name||'').trim().toLowerCase();
  var src = (e.source!=null) ? String(e.source).trim().toLowerCase() : '';
  return y + '|' + day + '|' + nm + '|' + src;
}

export function _eventRowsForTables(evs){
  var cal = getCal();
  var monthCount = Math.max(1, cal.months.length);
  var groups = {};
  var order = [];

  (evs || []).forEach(function(e){
    var sk = _eventSeriesKey(e);
    if (!groups[sk]){
      groups[sk] = { key: sk, months: {}, entries: [] };
      order.push(sk);
    }
    groups[sk].entries.push(e);
    groups[sk].months[e.month|0] = 1;
  });

  var rows = [];
  order.forEach(function(sk){
    var g = groups[sk];
    var months = Object.keys(g.months);
    var collapseAllMonths = (g.entries.length > 1 && months.length === monthCount);

    if (collapseAllMonths){
      var lead = g.entries[0];
      rows.push({
        event: lead,
        mmLabel: 'ALL',
        removeCmd: 'remove series ' + _encKey(sk),
        groupedCount: g.entries.length
      });
      return;
    }

    g.entries.forEach(function(e){
      rows.push({
        event: e,
        mmLabel: String(e.month|0),
        removeCmd: 'remove key ' + _encKey(eventKey(e)),
        groupedCount: 1
      });
    });
  });

  return rows;
}

export function listAllEventsTableHtml(){
  var cal = getCal(), evs = cal.events || [];
  if(!evs.length) return '<div style="opacity:.7;">No events.</div>';

  var listRows = _eventRowsForTables(evs);
  var rows = listRows.map(function(row, i){
    var e = row.event;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + 'x)</span>' : '');
    var sw = swatchHtml(getEventColor(e));
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + name +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ esc(row.mmLabel) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
    '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
  '</tr>';

  return '<div style="margin:4px 0;"><b>All Events (meta view)</b></div>'+
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>'+
         '<div style="opacity:.7;margin-top:4px;">Recurring events that span every month are grouped as one row.</div>';
}

export function removeListHtml(){
  var cal = getCal(), evs = cal.events || [];
  if(!evs.length) return '<div style="opacity:.7;">No events to remove.</div>';

  var listRows = _eventRowsForTables(evs);
  var rows = listRows.map(function(row, i){
    var e = row.event;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + 'x)</span>' : '');
    var sw = swatchHtml(getEventColor(e));
    var rm = button('Remove', row.removeCmd);
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + name +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ esc(row.mmLabel) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ rm +'</td>'+
    '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  return '<div style="margin:4px 0;"><b>Remove Events</b></div>'+
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>'+
         '<div style="opacity:.7;margin-top:4px;">Recurring events that span every month are grouped into one remove button.</div>';
}

export function removeMatchesListHtml(needle){
  var cal = getCal(), evs = cal.events || [];
  var q = String(needle||'').trim().toLowerCase();
  if (!q) return '<div style="opacity:.7;">Provide a name fragment to search.</div>';

  var listRows = _eventRowsForTables(evs).filter(function(row){
    return String((row.event && row.event.name) || '').toLowerCase().indexOf(q) !== -1;
  });
  if (!listRows.length){ return '<div style="opacity:.7;">No events matched "' + esc(needle) + '".</div>'; }

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  var rows = listRows.map(function(row, i){
    var e = row.event;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + 'x)</span>' : '');
    var sw = swatchHtml(getEventColor(e));
    var rm = button('Remove', row.removeCmd);
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + name +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ esc(row.mmLabel) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ rm +'</td>'+
    '</tr>';
  }).join('');

  return '<div style="margin:4px 0;"><b>Remove Matches for "' + esc(needle) + '"</b></div>'+
         '<table style="'+STYLES.table+'">'+ head + rows +'</table>'+
         '<div style="opacity:.7;margin-top:4px;">Recurring all-month events are grouped into one remove button.</div>';
}

export function suppressedDefaultsListHtml(){
  var sup = state[state_name].suppressedDefaults || {};
  var keys = Object.keys(sup);
  if (!keys.length){ return '<div style="opacity:.7;">No suppressed default events.</div>'; }

  keys.sort(function(a,b){
    var pa=a.split('|'), pb=b.split('|');
    var ma=(+pa[0]||0), mb=(+pb[0]||0);
    if (ma!==mb) return ma-mb;
    var da=DaySpec.first(pa[1]||'1'), db=DaySpec.first(pb[1]||'1');
    if (da!==db) return da-db;
    return String(pa[3]||'').localeCompare(String(pb[3]||''));
  });

  var rows = keys.map(function(k){
    var info = _defaultDetailsForKey(k);
    var mi = (info.month|0)-1, mm = (mi+1);
    var dd = esc(String(info.day));
    var sw = swatchHtml(info.color || autoColorForEvent({name:info.name}));
    var src = info.source ? ' <span style="opacity:.7">('+esc(titleCase(info.source))+')</span>' : '';
    var restorebutton = button('Restore', 'restore key '+_encKey(k));
    return '<tr>'+
      '<td style="'+STYLES.td+'">'+sw+esc(info.name)+src+'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ mm +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">ALL</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ restorebutton +'</td>'+
    '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  return '<div style="margin:4px 0;"><b>Suppressed Default Events</b></div>'+
         '<div style="margin:2px 0;">'+button('Restore All', 'restore all')+'</div>'+
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>';
}

export function restoreDefaultEvents(query){
  var cal = getCal();
  var sup = state[state_name].suppressedDefaults || (state[state_name].suppressedDefaults = {});
  var q = String(query||'').trim();
  if (!q){
    sendChat(script_name, '/w gm Usage: <code>!cal restore [all] [exact] &lt;name...&gt; | restore key &lt;KEY&gt; | restore list</code>');
    return;
  }

  var parts = q.split(/\s+/);
  var sub = (parts[0]||'').toLowerCase();

  if (sub === 'all'){
    state[state_name].suppressedDefaults = {};
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, '/w gm Restored all default events (sources left as-is).');
    return;
  }

  if (sub === 'key'){
    var key = _decKey(parts.slice(1).join(' ').trim());
    if (!key){ sendChat(script_name, '/w gm Usage: <code>!cal restore key &lt;KEY&gt;</code>'); return; }
    delete sup[key];
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, '/w gm Restored default for key: <code>'+esc(key)+'</code>.');
    return;
  }

  var exact = false;
  if (sub === 'exact'){ exact = true; parts.shift(); }
  var needle = parts.join(' ').trim().toLowerCase();
  if (!needle){ sendChat(script_name, '/w gm Usage: <code>!cal restore [exact] &lt;name...&gt;</code>'); return; }

  var keys = Object.keys(sup);
  var restored = 0;
  keys.forEach(function(k){
    var info = _defaultDetailsForKey(k);
    var nm = String(info.name||'').toLowerCase();
    if ((exact && nm === needle) || (!exact && nm.indexOf(needle) !== -1)){
      delete sup[k];
      restored++;
    }
  });

  mergeInNewDefaultEvents(cal);
  refreshAndSend();
  sendChat(script_name, '/w gm Restored '+restored+' default event'+(restored===1?'':'s')+' matching "'+esc(needle)+'".');
}


