/* ============================================================================
 * 7) EVENTS MODEL
 * ==========================================================================*/

function eventDisplayName(e){
  var base = String(e && e.name || '').trim();
  if (!base) return '';
  var st = ensureSettings();
  var src = (e && e.source!=null) ? titleCase(String(e.source)) : null;
  return (src && st.showSourceLabels) ? (base + ' (' + src + ')') : base;
}

function eventKey(e){ var y = (e.year==null)?'ALL':String(e.year|0); return (e.month|0)+'|'+String(e.day)+'|'+y+'|'+String(e.name||'').trim().toLowerCase(); }

function eventIndexByKey(key){
  key = String(key||'').trim().toLowerCase();
  var evs = getCal().events || [];
  for (var i=0;i<evs.length;i++){
    if (eventKey(evs[i]).toLowerCase() === key) return i;
  }
  return -1;
}

function defaultKeyFor(monthHuman, daySpec, name){ return (monthHuman|0)+'|'+String(daySpec)+'|ALL|'+String(name||'').trim().toLowerCase(); }

var eventsAPI = {
  forDay:   function(monthIndex, day, year){ return getEventsFor(monthIndex, day, year); },
  forRange: function(startSerial, endSerial){ return occurrencesInRange(startSerial, endSerial); },
  colorFor: getEventColor,
  isDefault: isDefaultEvent
};

var renderAPI = {
  month:        function(opts){ return renderMonthTable(opts); },
  monthGrid:    function(mi, yearLabel, dimPast){ return renderMiniCal(mi, yearLabel, dimPast); },
  year:         function(y, dimPast){ return yearHTMLFor(y, dimPast); },
  range:        function(spec){ return buildCalendarsHtmlForSpec(spec); },
  eventListForRange: function(title, startSerial, endSerial, forceYearLabel){
    return eventsListHTMLForRange(title, startSerial, endSerial, forceYearLabel);
  }
};

function compareEvents(a, b){
  var ya = (a.year==null)? -Infinity : (a.year|0);
  var yb = (b.year==null)? -Infinity : (b.year|0);
  if (ya !== yb) return ya - yb;
  var am = (+a.month||1), bm = (+b.month||1);
  if (am !== bm) return am - bm;
  return DaySpec.first(a.day) - DaySpec.first(b.day);
}

// Sort an events array so that user events (source=null) come first,
// then sources in their configured priority order, then unranked sources.
// Stable: equal-ranked events preserve their incoming order.
function sortEventsByPriority(events){
  var pList = (ensureSettings().eventSourcePriority || []).map(function(s){
    return String(s).toLowerCase();
  });
  function rank(e){
    if (!e.source) return 0;                          // user events always first
    var idx = pList.indexOf(String(e.source).toLowerCase());
    return idx >= 0 ? idx + 1 : pList.length + 1;    // unranked → tied last
  }
  return events.slice().sort(function(a, b){ return rank(a) - rank(b); });
}

function currentDefaultKeySet(cal){
  var sysKey = ensureSettings().calendarSystem || CONFIG_DEFAULTS.calendarSystem;
  var lim = Math.max(1, cal.months.length);
  var out = {};
  deepClone(defaults.events).forEach(function(de){
    var src = (de.source != null) ? String(de.source).toLowerCase() : null;
    if (src && !_sourceAllowedForCalendar(src, sysKey)) return;
    var months = (String(de.month).toLowerCase()==='all')
      ? (function(){ var a=[]; for (var i=1;i<=lim;i++) a.push(i); return a; })()
      : [ clamp(parseInt(de.month,10)||1, 1, lim) ];
    months.forEach(function(m){
      var maxD = cal.months[m-1].days|0;
      var norm = DaySpec.canonicalForKey(de.day, maxD);
      out[ defaultKeyFor(m, norm, de.name) ] = 1;
    });
  });
  return out;
}

function isDefaultEvent(ev){
  var calLocal = getCal();
  var defaultsSet = currentDefaultKeySet(calLocal);
  var maxD = calLocal.months[ev.month-1].days|0;
  var norm = DaySpec.canonicalForKey(ev.day, maxD);
  var k = defaultKeyFor(ev.month, norm, ev.name);
  return !!defaultsSet[k];
}

function markSuppressedIfDefault(ev){
  if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
  if (isDefaultEvent(ev)){
    var calLocal = getCal();
    var maxD = calLocal.months[ev.month-1].days|0;
    var norm = DaySpec.canonicalForKey(ev.day, maxD);
    var k = defaultKeyFor(ev.month, norm, ev.name);
    state[state_name].suppressedDefaults[k] = 1;
  }
}

function mergeInNewDefaultEvents(cal){
  var sysKey = ensureSettings().calendarSystem || CONFIG_DEFAULTS.calendarSystem;
  var lim = Math.max(1, cal.months.length);
  var suppressed = state[state_name].suppressedDefaults || {};
  var suppressedSources = state[state_name].suppressedSources || {};

  // Remove out-of-scope default-source events for the active calendar.
  cal.events = (cal.events || []).filter(function(e){
    var src = (e && e.source != null) ? String(e.source).toLowerCase() : null;
    return !src || _sourceAllowedForCalendar(src, sysKey);
  });

  var have = {};
  cal.events.forEach(function(e){
    var yKey = (e.year==null) ? 'ALL' : (e.year|0);
    have[(e.month|0)+'|'+String(e.day)+'|'+yKey+'|'+String(e.name||'').trim().toLowerCase()] = 1;
  });

  deepClone(defaults.events).forEach(function(de){
    var src = (de.source != null) ? String(de.source).toLowerCase() : null;
    if (src && !_sourceAllowedForCalendar(src, sysKey)) return;
    if (src && suppressedSources[src]) return;

    var monthsList = (String(de.month).toLowerCase() === 'all')
      ? (function(){ var a=[]; for (var i=1;i<=lim;i++) a.push(i); return a; })()
      : [ clamp(parseInt(de.month,10)||1, 1, lim) ];

    monthsList.forEach(function(m){
      var maxD = cal.months[m-1].days|0;
      var normDay = DaySpec.canonicalForKey(de.day, maxD);
      var key = m+'|'+String(normDay)+'|ALL|'+String(de.name||'').trim().toLowerCase();
      if (!have[key] && !suppressed[key]) {
        cal.events.push({
          name: String(de.name||''),
          month: m,
          day: normDay,
          year: null,
          color: resolveColor(de.color) || null,
          source: (de.source != null) ? String(de.source) : null
        });
        have[key] = 1;
      }
    });
  });

  cal.events.sort(compareEvents);
}

function autoColorForEvent(e){ return PALETTE[_stableHash(e && e.name) % PALETTE.length]; }
function getEventColor(e){ return resolveColor(e && e.color) || autoColorForEvent(e) || '#FF00DD'; }

function _addConcreteEvent(monthHuman, daySpec, yearOrNull, name, color){
  var cal = getCal();
  var m = clamp(monthHuman, 1, cal.months.length);
  var maxD = cal.months[m-1].days|0;

  var ows = Parse.ordinalWeekday.fromSpec(daySpec);
  var normDay = ows
    ? String(daySpec).toLowerCase().trim()
    : DaySpec.normalize(daySpec, maxD);

  if (!normDay) return false;

  var col = resolveColor(color) || null;
  var e = { name: String(name||''), month: m, day: normDay, year: (yearOrNull==null? null : (yearOrNull|0)), color: col };
  var key = eventKey(e);
  var exists = cal.events.some(function(ev){ return eventKey(ev)===key; });
  if (exists) return false;
  cal.events.push(e);
  cal.events.sort(compareEvents);
  return true;
}

function getEventsFor(monthIndex, day, year){
  var m = monthIndex|0, out=[];
  var events = getCal().events;
  var y = (typeof year === 'number') ? (year|0) : getCal().current.year;
  if (!events || !events.length) return [];
  for (var i=0;i<events.length;i++){
    var e = events[i];
    if (((parseInt(e.month,10)||1)-1) !== m) continue;
    if (e.year != null && (e.year|0) !== y) continue;
    var ows = Parse.ordinalWeekday.fromSpec(e.day);
    if (ows){
      if (ows.ord === 'every'){
        if (weekdayIndex(y, m, day) === ows.wdi) out.push(e);
      } else {
        var od = dayFromOrdinalWeekday(y, m, ows);
        if (od === day) out.push(e);
      }
    } else if (DaySpec.matches(e.day)(day)) {
      out.push(e);
    }
  }
  return out;
}

