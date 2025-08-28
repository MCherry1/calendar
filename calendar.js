// Eberron Calendar Script
// By Matthew Cherry (github.com/mcherry1/calendar)
// This is written for Roll20's API system.
// Call `!cal` to show the calendar, and use `!cal help` for command details.
// Version: 1.9

var Calendar = (function(){

'use strict';
var script_name = 'Calendar';
var state_name  = 'CALENDAR';
var EVENT_DEFAULT_COLOR = sanitizeHexColor('#ff00f2'); // Bright pink for events without a defined color.
var GRADIENT_ANGLE = '45deg'; // Angle for multi-event day gradients.
var CONTRAST_MIN = 4.5; // Minimum contrast ratio

// Default data set.
var defaults = {
    current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 }, // Default starting date 1/1/998.
    weekdays: ["Sul","Mol","Zol","Wir","Zor","Far","Sar"], // Eberron-specific weekday names. Change for other settings.
    months: [ // Eberron-specific month names and seasons. Colors defined by associated moon. Change for other settings.
        { name: "Zarantyr",  days: 28, season: "Mid-winter",    color: "#F5F5FA" }, // Pearly white
        { name: "Olarune",   days: 28, season: "Late winter",   color: "#FFC68A" }, // Pale orange
        { name: "Therendor", days: 28, season: "Early spring",  color: "#D3D3D3" }, // Pale gray
        { name: "Eyre",      days: 28, season: "Mid-spring",    color: "#C0C0C0" }, // Silver-gray
        { name: "Dravago",   days: 28, season: "Late spring",   color: "#E6E6FA" }, // Pale lavender
        { name: "Nymm",      days: 28, season: "Early summer",  color: "#FFD96B" }, // Pale yellow
        { name: "Lharvion",  days: 28, season: "Mid-summer",    color: "#F5F5F5" }, // Dull white with black slit
        { name: "Barrakas",  days: 28, season: "Late summer",   color: "#DCDCDC" }, // Pale gray
        { name: "Rhaan",     days: 28, season: "Early autumn",  color: "#9AC0FF" }, // Pale blue
        { name: "Sypheros",  days: 28, season: "Mid-autumn",    color: "#696969" }, // Smoky gray
        { name: "Aryth",     days: 28, season: "Late autumn",   color: "#FF4500" }, // Orange-red
        { name: "Vult",      days: 28, season: "Early winter",  color: "#A9A9A9" }  // Gray and pockmarked
    ],
    events: [ // Eberron-specific events. Colors are not canon, but chosen to match event themes.
        { name: "Tain Gala",               month: "all",  day: 5,       color: "#F7E7CE" }, // Champagne Gold
        { name: "Crystalfall",             month: 2,      day: 9,       color: "#87CEEB" }, // Sky blue
        { name: "The Day of Mourning",     month: 2,      day: 20,      color: "#808080" }, // Dead gray mists
        { name: "Sun's Blessing",          month: 3,      day: 15,      color: "#FFD700" }, // Sun gold
        { name: "Aureon's Crown",          month: 5,      day: 26,      color: "#6A5ACD" }, // Royal purple
        { name: "Brightblade",             month: 6,      day: 12,      color: "#B22222" }, // Firebrick red
        { name: "The Race of Eight Winds", month: 7,      day: 23,      color: "#20B2AA" }, // Sky blue-green
        { name: "The Hunt",                month: 8,      day: 4,       color: "#228B22" }, // Forest green
        { name: "Fathen's Fall",           month: 8,      day: 25,      color: "#F8F8FF" }, // Silver flame
        { name: "Boldrei's Feast",         month: 9,      day: 9,       color: "#FFB347" }, // Hearth orange
        { name: "The Ascension",           month: 10,     day: 1,       color: "#F8F8FF" }, // Silver flame
        { name: "Wildnight",               month: 10,     day: "18-19", color: "#8B0000" }, // Dark red of the Fury
        { name: "Thronehold",              month: 11,     day: 11,      color: "#4169E1" }, // Royal blue
        { name: "Remembrance Day",         month: 11,     day: 11,      color: "#DC143C" }, // Poppy red
        { name: "Long Shadows",            month: 12,     day: "26-28", color: "#0D0D0D" }  // Midnight black
    ]
};

// Core state and migration functions

function resetToDefaults(){ // Nuke state and reset to defaults.
    delete state[state_name];
    state[state_name] = { calendar: JSON.parse(JSON.stringify(defaults)) };
    checkInstall();
    sendChat(script_name, '/w gm Calendar state wiped and reset to defaults.');
    sendCurrentDate(null, true);
}

function checkInstall(){ // Ensure state is initialized and migrated properly.
  if(!state[state_name]) state[state_name] = {};

  if(!state[state_name].calendar ||
     !Array.isArray(state[state_name].calendar.weekdays) ||
     !Array.isArray(state[state_name].calendar.months)){
    state[state_name].calendar = JSON.parse(JSON.stringify(defaults));
  }

  if (!state[state_name].suppressedDefaults) {
  state[state_name].suppressedDefaults = {}; // key → 1
}

  var cal = state[state_name].calendar;
  if (!cal.current) cal.current = { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 };

  if(!Array.isArray(cal.events)){
    // First install: expand defaults
    var lim = Math.max(1, state[state_name].calendar.months.length);
    var out = [];
    JSON.parse(JSON.stringify(defaults.events)).forEach(function(e){
      var monthsList;
      if (String(e.month).toLowerCase() === 'all') {
        monthsList = []; for (var i=1;i<=lim;i++) monthsList.push(i);
      } else {
        var m = Math.max(1, Math.min(parseInt(e.month,10)||1, lim));
        monthsList = [m];
      }
      monthsList.forEach(function(m){
        out.push({
          name: String(e.name||''),
          month: m,
          day: e.day,
          year: null, // repeats every year
          color: sanitizeHexColor(e.color) || null
        });
      });
    });
    cal.events = out;
  } else {
    // 1) bring in any new defaults you’ve added since the game started
    mergeInNewDefaultEvents(cal);

    // 2) sanitize existing events
    cal.events = cal.events.map(function(e){
      var lim = Math.max(1, cal.months.length);
      var m = Math.max(1, Math.min(parseInt(e.month,10)||1, lim));
      var yr = (isFinite(parseInt(e.year,10)) ? (parseInt(e.year,10)|0) : null);
      return {
        name: String(e.name||''),
        month: m,
        day: e.day,
        year: yr,
        color: sanitizeHexColor(e.color) || null
      };
    });

    // 3) apply default colors to any events missing a color
    var defColorByKey = {};
    var lim2 = Math.max(1, cal.months.length);
    defaults.events.forEach(function(de){
      var col = sanitizeHexColor(de.color) || null;
      if (String(de.month).toLowerCase() === 'all') {
        for (var i=1; i<=lim2; i++) defColorByKey[i + '|' + String(de.day)] = col;
      } else {
        var m = clamp(parseInt(de.month,10)||1, 1, lim2);
        defColorByKey[m + '|' + String(de.day)] = col;
      }
    });
    cal.events.forEach(function(e){
      if (!e.color){
        var key = e.month + '|' + String(e.day);
        var col = defColorByKey[key];
        if (col) e.color = col;
      }
    });
  }

  // normalize months
  for (var i = 0; i < cal.months.length; i++){
    var d = defaults.months[i] || {};
    cal.months[i] = cal.months[i] || {};
    if (!cal.months[i].name)   cal.months[i].name   = d.name   || ('Month '+(i+1));
    if (!cal.months[i].days)   cal.months[i].days   = d.days   || 28;
    if (!cal.months[i].season) cal.months[i].season = d.season || '';
    if (!cal.months[i].color)  cal.months[i].color  = d.color  || '#EEE';
  }

  // clamp current date
  if (cal.current.month >= cal.months.length){
    cal.current.month = Math.max(0, cal.months.length - 1);
  }
  var mdays = cal.months[cal.current.month].days;
  if (cal.current.day_of_the_month > mdays){
    cal.current.day_of_the_month = mdays;
  }
}

function refreshCalendarState(silent){
  checkInstall();
  var cal = getCal();

  cal.events = (cal.events || []).map(function(e){
    var m = clamp(e.month, 1, cal.months.length);
    var daySpec = normalizeDaySpec(e.day, cal.months[m-1].days) || String(firstNumFromDaySpec(e.day));
    var yr = (e.year==null) ? null : (parseInt(e.year,10)|0);
    return {
      name: String(e.name||''),
      month: m,
      day: daySpec,
      year: yr,
      color: sanitizeHexColor(e.color) || null
    };
  });

  var seen = {};
  cal.events = cal.events.filter(function(e){
    var y = (e.year==null) ? 'ALL' : (e.year|0);
    var k = e.month+'|'+e.day+'|'+y+'|'+String(e.name||'').trim().toLowerCase();
    if (seen[k]) return false; seen[k]=true; return true;
  });

  cal.events.sort(compareEvents);

  if (!silent) sendChat(script_name, '/w gm Calendar state refreshed ('+cal.events.length+' events).');
}

// Helper functions

function sanitizeHexColor(s){ // Returns sanitized hex color string (#RRGGBB) or null if invalid.
    if(!s) return null;
    var hex = String(s).trim().replace(/^#/, '');
    if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
    if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
    return null;
}

function getEventColor(e){ return sanitizeHexColor(e.color) || EVENT_DEFAULT_COLOR; } // Get event color or default if not defined.

function esc(s){ // Basic escaping for characters that will break HTML.
    if (s == null) return '';
    return String(s)
        .replace(/&(?!#?\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function mergeInNewDefaultEvents(cal){
  var lim = Math.max(1, cal.months.length);
  var suppressed = state[state_name].suppressedDefaults || {};

  var have = {};
  cal.events.forEach(function(e){
    var yKey = (e.year==null) ? 'ALL' : (e.year|0);
    have[(e.month|0)+'|'+String(e.day)+'|'+yKey+'|'+String(e.name||'').trim().toLowerCase()] = 1;
  });

  JSON.parse(JSON.stringify(defaults.events)).forEach(function(de){
    var monthsList;
    if (String(de.month).toLowerCase() === 'all') {
      monthsList = []; for (var i=1;i<=lim;i++) monthsList.push(i);
    } else {
      var m = clamp(parseInt(de.month,10)||1, 1, lim);
      monthsList = [m];
    }

    monthsList.forEach(function(m){
      var maxD = cal.months[m-1].days|0;
      var normDay = normalizeDaySpec(de.day, maxD) || String(firstNumFromDaySpec(de.day));
      var key = m+'|'+String(normDay)+'|ALL|'+String(de.name||'').trim().toLowerCase();

      if (!have[key] && !suppressed[key]) {
        cal.events.push({
          name: String(de.name||''),
          month: m,
          day: normDay,
          year: null,
          color: sanitizeHexColor(de.color) || null
        });
        have[key] = 1;
      }
    });
  });

  cal.events.sort(compareEvents);
}

function clamp(n, min, max){ // Clamps a number to the given [min, max] range. Non-numbers become min.
  n = parseInt(n,10);
  if (!isFinite(n)) n = min;
  return n < min ? min : (n > max ? max : n);
}

function int(v, fallback){ // Parses an integer, returning fallback if invalid.
  var n = parseInt(v,10);
  return isFinite(n) ? n : fallback;
}

function makeDayMatcher(spec){ // Tests if a given day matches a spec (number or "a-b" range).
  if (typeof spec === 'number') {
    var n = spec|0;
    return function(d){ return d === n; };
  }
  if (typeof spec === 'string') {
    var s = spec.trim();
    if (s.indexOf('-') !== -1) {
      var parts = s.split('-').map(function(x){ return parseInt(String(x).trim(),10); });
      var a = parts[0], b = parts[1];
      if (isFinite(a) && isFinite(b)) {
        if (a > b) { var t=a; a=b; b=t; }
        return function(d){ return d >= a && d <= b; };
      }
    }
    var n = parseInt(s,10);
    if (isFinite(n)) return function(d){ return d === n; };
  }
  return function(){ return false; };
}

function styleForBg(style, bgHex){ // Generates a background style for single-event days, with best-contrasting text color.
  var cBlack = _contrast(bgHex, '#000');
  var cWhite = _contrast(bgHex, '#fff');
  var t = (cBlack >= cWhite) ? '#000' : '#fff';
  return style + 'background:'+bgHex+';color:'+t+';' + outlineIfNeeded(t, bgHex);
}

function styleForGradient(style, cols){ // Generates a background style for multi-event days, with best-contrasting text color.
  var avg = _avgHexColor(cols);
  var t   = textColorForBg(avg);
  style += 'background-color:'+cols[0]+';';
  style += 'background-image:'+_gradientFor(cols)+';';
  style += 'background-repeat:no-repeat;background-size:100% 100%;';
  style += 'color:'+t+';'+outlineIfNeeded(t, avg);
  return style;
}

function _gradientFor(cols){ // Generates a crisp color gradient for multi-event days.
  var ang = GRADIENT_ANGLE;
  if (cols.length === 2){
    var a = cols[0], b = cols[1];
    return 'linear-gradient(' + ang + ','+
           a+' 0%,'+a+' 50%,'+
           b+' 50%,'+b+' 100%)';
  }
  var a = cols[0], b = cols[1], c = cols[2] || cols[1];
  return 'linear-gradient(' + ang + ','+
         a+' 0%,'+a+' 33.333%,'+
         b+' 33.333%,'+b+' 66.667%,'+
         c+' 66.667%,'+c+' 100%)';
}

function _avgHexColor(cols){ // Average multiple hex colors together for contrast text calculation.
  var r=0,g=0,b=0,n=cols.length;
  for (var i=0;i<n;i++){
    var hex = cols[i].replace(/^#/,'');
    var v = parseInt(hex,16);
    r += (v>>16)&255; g += (v>>8)&255; b += v&255;
  }
  r = Math.round(r/n); g = Math.round(g/n); b = Math.round(b/n);
  function h(x){ var s=x.toString(16).toUpperCase(); return s.length===1?'0'+s:s; }
  return '#'+h(r)+h(g)+h(b);
}

function textColorForBg(bgHex){
  return _contrast(bgHex, '#000') >= _contrast(bgHex, '#fff') ? '#000' : '#fff';
}

function daysPerYear(){ // Total days per year from defined months
  var months = getCal().months, sum = 0;
  for (var i=0;i<months.length;i++) sum += (parseInt(months[i].days,10)||0);
  return sum;
}

function monthPrefixDays(mi){ // Total days in months before index month
  var months = getCal().months, sum = 0;
  for (var i=0;i<mi;i++) sum += (parseInt(months[i].days,10)||0);
  return sum;
}

function toSerial(y, mi, d){  // Serializes a date to an absolute day count (used to compute weekday deltas reliably).
  return (y * daysPerYear()) + monthPrefixDays(mi) + ((parseInt(d,10)||1) - 1);
}

function weekdayIndexFor(mi, d){ // Given a month index and day, returns the weekday index relative to current date/dow.
  var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length;
  var delta = toSerial(cur.year, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
  return ( (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen );
}

function firstNumFromDaySpec(daySpec){ // Extracts the first integer from a day spec ("18-19" → 18) for sorting/comparisons.
  if (typeof daySpec === 'number') return daySpec|0;
  var s = String(daySpec||'').trim();
  var m = s.match(/^\s*(\d+)/);
  return m ? Math.max(1, parseInt(m[1],10)) : 1;
}

function normalizeDaySpec(spec, maxDays){ // Normalizes a day spec into "D" or "A-B" within [1, maxDays]; returns null if invalid.
  var s = String(spec||'').trim();
  if (/^\d+$/.test(s)){
    return String(clamp(s, 1, maxDays));
  }
  var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m){
    var a = clamp(m[1], 1, maxDays), b = clamp(m[2], 1, maxDays);
    if (a > b){ var t=a; a=b; b=t; }
    return a <= b ? (a+'-'+b) : null;
  }
  return null;
}

function currentDateLabel(){
  var cal = getCal(), cur = cal.current;
  return cal.weekdays[cur.day_of_the_week] + ", " +
         cur.day_of_the_month + " " +
         cal.months[cur.month].name + ", " +
         cur.year + " " + LABELS.era;
}

function monthEventsHtml(mi, today){
  var cal = getCal(), mName = esc(cal.months[mi].name);
  var curYear = cal.current.year;
  var rows = [];
  cal.events
    .filter(function(e){
      return ((+e.month||1)-1) === mi &&
             (e.year == null || (e.year|0) === (curYear|0));
    })
    .forEach(function(e){
      var dayLabel = esc(String(e.day));
      var isToday  = makeDayMatcher(e.day)(today);
      var swatch   = swatchHtml(e.color);
      rows.push('<div' + (isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"') +
                '>' + swatch + mName + ' ' + dayLabel + ': ' + esc(e.name) + '</div>');
    });
  return rows.join('');
}

var LABELS = {
  era: 'YK', // Eberron-specific abbreviation for "Year of the Kingdom". Change for other settings.
  gmOnlyNotice: 'Only the GM can use that calendar command.'
};

var STYLES = { // Default style repeated for consistent display structure.
  table: 'border-collapse:collapse;margin:4px;',
  th:    'border:1px solid #444;padding:2px;width:2em;text-align:center;',
  head:  'border:1px solid #444;padding:0;',
  gmBtnWrap: 'margin:2px 0;',
  td:    'border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;',
  monthHeaderBase: 'padding:6px;text-align:left;'
};

function _applyTodayStyle(style){ // This is the style to emphasize the current day cell.
  style += 'position:relative;z-index:10;';
  style += 'border-radius:2px;';
  style += 'box-shadow:'
            + '0 3px 8px rgba(0,0,0,0.65),'
            + '0 12px 24px rgba(0,0,0,.35), '
            + 'inset 0 2px 0 rgba(255,255,255,.18);';
  style += 'outline:2px solid rgba(0,0,0,0.35);';
  style += 'outline-offset:1px;';
  style += 'box-sizing:border-box;overflow:visible;';
  style += 'font-weight:bold;';
  style += 'font-size:1.2em;';
  return style;
}

function swatchHtml(hex){
  var col = sanitizeHexColor(hex) || EVENT_DEFAULT_COLOR;
  return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';" title="'+esc(col)+'"></span>';
}

function sendToAll(html){ sendChat(script_name, '/direct ' + html); }
function sendToGM(html){  sendChat(script_name, '/w gm ' + html); }

function _relLum(hex){ // Relative luminance of a hex color
  hex = (hex||'').toString().replace(/^#/, '');
  if (hex.length===3) hex = hex.replace(/(.)/g,'$1$1');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0; // default black
  var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function lin(c){ c/=255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}

function _contrast(bgHex, textHex){ // Contrast ratio of two hex colors
  var L1=_relLum(bgHex), L2=_relLum(textHex);
  var hi=Math.max(L1,L2), lo=Math.min(L1,L2);
  return (hi+0.05)/(lo+0.05);
}

function outlineIfNeeded(textColor, bgHex){ // Outlines text if there is low contrast between text and background.
  var ratio = _contrast(bgHex, textColor);
  if (ratio >= CONTRAST_MIN) return '';
  // Add a subtle outline using the opposite color
  return (textColor === '#fff')
    ? 'text-shadow:-0.5px -0.5px 0 #000,0.5px -0.5px 0 #000,-0.5px 0.5px 0 #000,0.5px 0.5px 0 #000;'
    : 'text-shadow:-0.5px -0.5px 0 #fff,0.5px -0.5px 0 #fff,-0.5px 0.5px 0 #fff,0.5px 0.5px 0 #fff;';
}

function gmButtonsHtml(){ // GM buttons for quick actions. Currently only called when single-month calendar is shown.
  return [
    '[📤 Send Date](!cal senddate)',
    '[⏭ Advance Day](!cal advanceday)',
    '[⏮ Retreat Day](!cal retreatday)',
    '[❓ Help](!cal help)'
  ].map(function(b){ return '<div style="'+STYLES.gmBtnWrap+'">'+b+'</div>'; }).join('');
}

function isHexColorToken(tok){
  return !!sanitizeHexColor(tok);
}

function isListToken(tok){
  // tokens we consider "date-like": numbers, ranges, csv of those, or "all"
  return /^all$/i.test(tok) || /^[0-9,\-\s]+$/.test(tok);
}

function parseIntSafe(x){ var n=parseInt(x,10); return isFinite(n)?n:null; }

function parseIntList(token, minV, maxV){
  // token can be "all", "n", "a-b", or "csv" like "1,3,5-7"
  // returns sorted unique int array within [minV,maxV]
  if (!token) return [];
  token = String(token).trim().toLowerCase();
  if (token === 'all'){
    var out=[]; for (var i=minV;i<=maxV;i++) out.push(i); return out;
  }
  var set = {};
  String(token).split(',').forEach(function(part){
    part = part.trim();
    if (!part) return;
    var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m){
      var a=parseInt(m[1],10), b=parseInt(m[2],10);
      if (isFinite(a) && isFinite(b)){
        if (a>b){ var t=a;a=b;b=t; }
        for (var i=a;i<=b;i++){
          if (i>=minV && i<=maxV) set[i]=1;
        }
      }
    } else {
      var n=parseInt(part,10);
      if (isFinite(n) && n>=minV && n<=maxV) set[n]=1;
    }
  });
  var arr = Object.keys(set).map(function(k){ return parseInt(k,10); });
  arr.sort(function(a,b){ return a-b; });
  return arr;
}

function parseDaySpecList(token, maxDays){
  // supports "all", "n", "a-b", or CSV like "1,3,5-7"
  token = String(token||'').trim().toLowerCase();
  if (token === 'all'){
    return ['1-'+maxDays];
  }
  // split CSV, keep each as "n" or "a-b"
  var parts = token.split(',');
  var out = [];
  var seen = {};
  for (var i=0;i<parts.length;i++){
    var p = parts[i].trim();
    if (!p) continue;
    // normalize single or range with clamp
    var norm = normalizeDaySpec(p, maxDays);
    if (!norm){
      // try single int, then clamp
      var n = parseInt(p,10);
      if (isFinite(n)) norm = String(clamp(n,1,maxDays));
    }
    if (norm && !seen[norm]){ seen[norm]=1; out.push(norm); }
  }
  // if token had no commas and produced nothing, try as plain normalize
  if (!out.length){
    var n1 = normalizeDaySpec(token, maxDays);
    if (n1) out.push(n1);
  }
  return out;
}

function nextForDayOnly(cur, day, monthsLen){
  // returns {month, year} for the NEXT occurrence of "day" using current month/year
  var mdays = getCal().months[cur.month].days;
  var d = clamp(day, 1, mdays);
  if (cur.day_of_the_month <= d){
    return { month: cur.month, year: cur.year };
  }
  var nm = (cur.month + 1) % monthsLen;
  var ny = cur.year + ((nm===0)?1:0);
  return { month: nm, year: ny };
}

function nextForMonthDay(cur, mIndex, d){
  // returns {year} for the NEXT occurrence of month/day in or after current year
  var mdays = getCal().months[mIndex].days;
  var day = clamp(d, 1, mdays);
  var serialNow = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var serialCand = toSerial(cur.year, mIndex, day);
  if (serialCand >= serialNow) return { year: cur.year };
  return { year: cur.year + 1 };
}

function warnGM(msg){ sendChat(script_name, '/w gm ' + msg); }

function eventKey(e){
  // uniqueness key with year awareness (null year → 'ALL')
  var y = (e.year==null)?'ALL':String(e.year|0);
  return (e.month|0)+'|'+String(e.day)+'|'+y+'|'+String(e.name||'').trim().toLowerCase();
}

function defaultKeyFor(monthHuman, daySpec, name){
  return (monthHuman|0)+'|'+String(daySpec)+'|ALL|'+String(name||'').trim().toLowerCase();
}

function currentDefaultKeySet(cal){
  var lim = Math.max(1, cal.months.length);
  var out = {};
  JSON.parse(JSON.stringify(defaults.events)).forEach(function(de){
    var months = (String(de.month).toLowerCase()==='all')
      ? (function(){ var a=[]; for (var i=1;i<=lim;i++) a.push(i); return a; })()
      : [ clamp(parseInt(de.month,10)||1, 1, lim) ];
    months.forEach(function(m){
      var maxD = cal.months[m-1].days|0;
      var norm = normalizeDaySpec(de.day, maxD) || String(firstNumFromDaySpec(de.day));
      out[ defaultKeyFor(m, norm, de.name) ] = 1;
    });
  });
  return out;
}

function monthIndexByName(tok){
  var cal = getCal();
  if (!tok) return -1;
  var s = String(tok).toLowerCase();
  for (var i=0;i<cal.months.length;i++){
    var nm = String(cal.months[i].name||'').toLowerCase();
    if (nm===s || nm.indexOf(s)===0) return i;
  }
  return -1;
}

function expandDaySpec(spec, maxDays){
  var s = String(spec||'').trim();
  var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m){
    var a = clamp(m[1],1,maxDays), b = clamp(m[2],1,maxDays);
    if (a>b){ var t=a;a=b;b=t; }
    var out=[]; for (var d=a; d<=b; d++) out.push(d);
    return out;
  }
  var n = parseInt(s,10);
  if (isFinite(n)) return [clamp(n,1,maxDays)];
  // if we somehow reach here (e.g., "all"), fall back to the whole month
  var out=[]; for (var d2=1; d2<=maxDays; d2++) out.push(d2);
  return out;
}

function todaySerial(){
  var c = getCal().current;
  return toSerial(c.year, c.month, c.day_of_the_month);
}

function weekdayIndexForYear(year, mi, d){
  var cal=getCal(), cur=cal.current, wdlen=cal.weekdays.length;
  var delta = toSerial(year, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
  return ( (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen );
}

// State accessor
function getCal(){ return state[state_name].calendar; }

// Core calendar functions

function advanceDay(){ // Advance one day
    var cal=getCal(), cur=cal.current;
    cur.day_of_the_month++;
    if(cur.day_of_the_month > cal.months[cur.month].days){
        cur.day_of_the_month = 1;
        cur.month = (cur.month + 1) % cal.months.length;
        if(cur.month===0) cur.year++;
    }
    cur.day_of_the_week = (cur.day_of_the_week + 1) % cal.weekdays.length;
    sendCurrentDate(null,true);
}

function retreatDay(){ // Go back one day
    var cal=getCal(), cur=cal.current;
    cur.day_of_the_month--;
    if(cur.day_of_the_month < 1){
        cur.month = (cur.month + cal.months.length - 1) % cal.months.length;
        if (cur.month === cal.months.length - 1){
            cur.year = cur.year - 1;
        }
        cur.day_of_the_month = cal.months[cur.month].days;
    }
    cur.day_of_the_week = (cur.day_of_the_week + cal.weekdays.length - 1) % cal.weekdays.length;
    sendCurrentDate(null,true);
}

function setDate(m, d, y){ // Set date to specific month/day[/year]
  var cal=getCal(), cur=cal.current, oldDOW=cur.day_of_the_week;
  var oldY=cur.year, oldM=cur.month, oldD=cur.day_of_the_month;

  var mi = clamp(m, 1, cal.months.length) - 1;
  var di = clamp(d, 1, cal.months[mi].days);
  var yi = int(y, cur.year);

  var delta = toSerial(yi, mi, di) - toSerial(oldY, oldM, oldD);
  cur.month = mi; cur.day_of_the_month = di; cur.year = yi;

  var wdlen = cal.weekdays.length;
  cur.day_of_the_week = (oldDOW + ((delta % wdlen) + wdlen)) % wdlen;

  sendCurrentDate(null, true);
}

// Event functions

  function addEventSmart(tokens){
  // tokens: array of args AFTER the subcommand, BEFORE optional color
  // Grammar we accept at the front: [month?] [day] [year?]
  // Each of month/day/year may be: single int, range "a-b" (day), CSV, or "all"
  // If only day -> "next" semantics
  // If month+day -> "next" semantics for year
  // If month+day+year -> explicit (warn if in past)
  // Any use of "all" or CSV/range implies bulk (no "next" resolution for that dimension)
  var cal = getCal(), cur = cal.current, monthsLen = cal.months.length;
  if (!tokens || !tokens.length){ warnGM('Usage: <code>!cal addevent [&lt;month|list|all&gt;] &lt;day|range|list|all&gt; [&lt;year|list|all&gt;] &lt;name...&gt; [#hex]</code>'); return; }

  // Detect trailing color
  var lastTok = tokens[tokens.length-1];
  var color = isHexColorToken(lastTok) ? sanitizeHexColor(lastTok) : null;
  if (color){ tokens = tokens.slice(0, tokens.length-1); }

  // Optional `--` separator: everything after is treated as the name
  var sepIdx = tokens.indexOf('--'), forcedName = null;
  if (sepIdx !== -1){
    forcedName = tokens.slice(sepIdx+1).join(' ').trim();
    tokens = tokens.slice(0, sepIdx);
  }


  // Pull up to 3 date-like tokens from the front
  var dateToks = [];
  while (dateToks.length<3 && tokens.length && isListToken(tokens[0])){
    dateToks.push(tokens.shift());
  }

  if (dateToks.length===0){
    warnGM('Could not parse a date from your input. Expected <code>day</code>, <code>month day</code>, or <code>month day year</code>.');
    return;
  }

  // The rest is the name (quoted or not)
  var rawName = forcedName != null ? forcedName : String(tokens.join(' ')).trim();
  rawName = rawName.replace(/^"(.*)"$/,'$1').replace(/^'(.*)'$/,'$1').trim();
  if (!rawName){ rawName = 'Untitled Event'; }

  // Determine (monthsSpec, daysSpecList, yearsSpec) based on dateToks length
  var monthsSpec = null; // array of month indexes 1..N or null (to be resolved by "next")
  var daysSpecList = null; // array of "D" or "A-B" strings
  var yearsSpec = null; // null => repeats every year; [] => to be resolved by "next"; [y1,y2,...] explicit years

  var monthCount = cal.months.length;

  if (dateToks.length === 1){
    // [day]
    var dayTok = dateToks[0];
    // Day can be list/range/"all"
    // "next" semantics only when it's a single integer; lists/ranges imply bulk
    var singleDay = parseIntSafe(dayTok);
    if (singleDay != null && /^[0-9]+$/.test(dayTok)){
      // NEXT semantics (single target)
      var nextMY = nextForDayOnly(cur, singleDay, monthCount);
      var di = clamp(singleDay, 1, cal.months[nextMY.month].days);
      _addConcreteEvent(nextMY.month+1, String(di), nextMY.year, rawName, color);
      return;
    } else {
      // BULK monthly repeating, every year
      monthsSpec = parseIntList('all', 1, monthCount);
      // we need a daySpec list; for each month we clamp later
      // parseDaySpecList needs maxDays, but we’ll re-normalize per month anyway
      daysSpecList = [String(dayTok)];
      yearsSpec = null; // every year
    }
  } else if (dateToks.length === 2){
    // [month] [day]
    var mTok = dateToks[0], dTok = dateToks[1];
    var monthsBulk = parseIntList(mTok, 1, monthCount); // supports all/csv/range/single
    var looksBulk = (mTok.toLowerCase() === 'all' || mTok.indexOf(',')!==-1 || mTok.indexOf('-')!==-1);

    // If month is a plain integer AND day is a plain integer → NEXT semantics
    var singleM = parseIntSafe(mTok);
    var singleD = parseIntSafe(dTok);
    if (!looksBulk && singleM != null && /^[0-9]+$/.test(dTok)){
      var mi = clamp(singleM, 1, monthCount) - 1;
      var nextY = nextForMonthDay(cur, mi, singleD).year;
      var di2 = clamp(singleD, 1, cal.months[mi].days);
      _addConcreteEvent(mi+1, String(di2), nextY, rawName, color);
      return;
    }

    // otherwise: BULK across those months, repeating every year
    monthsSpec = monthsBulk;
    daysSpecList = [String(dTok)];
    yearsSpec = null; // every year
  } else {
    // [month] [day] [year]
    var mTok3 = dateToks[0], dTok3 = dateToks[1], yTok3 = dateToks[2];

    var mList = parseIntList(mTok3, 1, monthCount); // can be 1..N or many
    var yList;
    var yIsAll = /^all$/i.test(yTok3);
    if (yIsAll){
      yList = null; // null => every year
    } else {
      yList = parseIntList(yTok3, -2147483648, 2147483647); // let user pick any int years
      if (!yList.length){
        // if a single int-like but outside parse, try direct
        var yy = parseIntSafe(yTok3);
        if (yy != null) yList = [yy];
      }
    }

    monthsSpec   = mList;
    daysSpecList = [String(dTok3)];
    yearsSpec    = yList; // null => every year; array => explicit list

    // Warn if it’s a single explicit MDY in the past (vs serial now)
    if (mList.length===1 && /^\d+$/.test(String(dTok3)) && yList && yList.length===1){
      var mi3 = mList[0]-1, di3=parseInt(dTok3,10)|0, yi3=yList[0]|0;
      var serialNow = toSerial(cur.year, cur.month, cur.day_of_the_month);
      var serialEvt = toSerial(yi3, mi3, clamp(di3,1,cal.months[mi3].days));
      if (serialEvt < serialNow){
        warnGM('Note: that explicit date appears to be in the past. Adding anyway for historical record.');
      }
    }
  }

  // Expand BULK
  if (!monthsSpec || !daysSpecList){
    warnGM('Could not resolve your date specification.');
    return;
  }

  var added = 0;
  for (var mi0=0; mi0<monthsSpec.length; mi0++){
    var mHuman = monthsSpec[mi0]|0; // 1..N
    var mIdx = mHuman-1;
    var maxD = cal.months[mIdx].days|0;

    // Build actual day specs for this month (clamped)
    var daySpecsForMonth = [];
    for (var ds=0; ds<daysSpecList.length; ds++){
      var dsRaw = String(daysSpecList[ds]);
      // if it's CSV-ish, let parseDaySpecList split it
      var list = parseDaySpecList(dsRaw, maxD);
      if (!list.length){
        // try normalizer directly once more
        var one = normalizeDaySpec(dsRaw, maxD);
        if (one) list = [one];
      }
      for (var k=0;k<list.length;k++){
        if (daySpecsForMonth.indexOf(list[k])===-1) daySpecsForMonth.push(list[k]);
      }
    }

    // Determine years: repeating (null) or explicit list
    if (yearsSpec === null){
      // repeating every year: one entry per daySpec (year=null)
      for (var j=0;j<daySpecsForMonth.length;j++){
        added += _addConcreteEvent(mHuman, daySpecsForMonth[j], null, rawName, color) ? 1 : 0;
      }
    } else if (Array.isArray(yearsSpec) && yearsSpec.length){
      for (var yy=0; yy<yearsSpec.length; yy++){
        var yVal = yearsSpec[yy]|0;
        for (var j2=0;j2<daySpecsForMonth.length;j2++){
          added += _addConcreteEvent(mHuman, daySpecsForMonth[j2], yVal, rawName, color) ? 1 : 0;
        }
      }
    } else {
      warnGM('No valid year(s) parsed; nothing added for month '+mHuman+'.');
    }
  }

  if (added){
    refreshCalendarState(true);
    sendCurrentDate(null, true);
    warnGM('Added '+added+' event'+(added===1?'':'s')+'.');
  } else {
    warnGM('No events were added (possible duplicates or invalid specs).');
  }
}

function _addConcreteEvent(monthHuman, daySpec, yearOrNull, name, color){ // Add event to specific day
  var cal = getCal();
  var m = clamp(monthHuman, 1, cal.months.length);
  var maxD = cal.months[m-1].days|0;
  var normDay = normalizeDaySpec(daySpec, maxD);
  if (!normDay) return false;
  var col = sanitizeHexColor(color) || null;

  var e = { name: String(name||''), month: m, day: normDay, year: (yearOrNull==null? null : (yearOrNull|0)), color: col };

  // Avoid event duplication.
  var key = eventKey(e);
  var exists = cal.events.some(function(ev){ return eventKey(ev)===key; });
  if (exists) return false;

  cal.events.push(e);
  cal.events.sort(compareEvents);
  return true;
}

function addMonthly(dayTok, nameTokens, colorTok){ // Repeats monthly
  var tokens = [];
  tokens.push('all');         // month = all
  tokens.push(String(dayTok)); // day
  tokens.push('all');         // year = all
  if (nameTokens && nameTokens.length) tokens = tokens.concat(nameTokens);
  if (colorTok) tokens.push(colorTok);
  addEventSmart(tokens);
}

function addAnnual(monthTok, dayTok, nameTokens, colorTok){ // Repeats annually
  var tokens = [];
  tokens.push(String(monthTok)); // month
  tokens.push(String(dayTok));   // day
  tokens.push('all');            // year = all
  if (nameTokens && nameTokens.length) tokens = tokens.concat(nameTokens);
  if (colorTok) tokens.push(colorTok);
  addEventSmart(tokens);
}

function addNext(tokens){ // Thin wrapper to basic operation, but won't insert "Untitled event"
  addEventSmart(tokens.slice());
}

function compareEvents(a, b){
  // Year: null (every year) sorts before explicit years,
  // then by month, then by earliest day in the daySpec
  var ya = (a.year==null)? -Infinity : (a.year|0);
  var yb = (b.year==null)? -Infinity : (b.year|0);
  if (ya !== yb) return ya - yb;
  var am = (+a.month||1), bm = (+b.month||1);
  if (am !== bm) return am - bm;
  return firstNumFromDaySpec(a.day) - firstNumFromDaySpec(b.day);
}

function removeEvent(query){ // Remove event by name or index; supports "all", "exact", and "index"
  var cal = getCal(), events = cal.events;

  // Ensure suppressed defaults aren't resurrected on every refresh.
    if (!state[state_name].suppressedDefaults) {
      state[state_name].suppressedDefaults = {};
    }
    function markSuppressedIfDefault(ev){
      var calLocal = getCal();
      var defaultsSet = currentDefaultKeySet(calLocal);
      var maxD = calLocal.months[ev.month-1].days|0;
      var norm = normalizeDaySpec(ev.day, maxD) || String(firstNumFromDaySpec(ev.day));
      var k = defaultKeyFor(ev.month, norm, ev.name);
      if (defaultsSet[k]) {
        state[state_name].suppressedDefaults[k] = 1;
      }
    }

  // If no events exist, then no events exist.
  if (!events.length){
    sendChat(script_name, '/w gm No events to remove.');
    return;
  }

  // Parse arguments "all", "exact", and "index"
  var toks = String(query||'').trim().split(/\s+/);
  var rmAll=false, exact=false, forceIndex=false;
  while (toks.length && /^(all|exact|index)$/i.test(toks[0])) {
    var t = toks.shift().toLowerCase();
    if (t==='all') rmAll=true;
    else if (t==='exact') exact=true;
    else if (t==='index') forceIndex=true;
  }

  if (forceIndex && (rmAll || exact)) {
  sendChat(script_name, '/w gm Use either <code>index</code> or <code>all/exact</code>, not both.');
  return;
  }

  var raw = toks.join(' ').trim();

  // If nothing was input, then error.
  if (!raw){
    sendChat(script_name, '/w gm Please provide an index or a name.');
    return;
  }

  // If "index" argument is used, run immediately.
  if (forceIndex) {
    var m = raw.match(/^#?(\d+)$/);
    var idx = m ? (+m[1]) : NaN;
    if (!isFinite(idx) || idx < 1 || idx > events.length) {
      sendChat(script_name, '/w gm After <code>index</code>, give a number 1–'+events.length+'.');
      return;
    }
    var removed = events.splice(idx-1, 1)[0];
    markSuppressedIfDefault(removed);
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed event #'+idx+': '+esc(removed.name));
    sendCurrentDate(null,true);
    return;
  }

  // Safety function if there is ambiguity between event name and event list index.
  var needle = raw.toLowerCase();
  var asIdxMatch = raw.match(/^#?(\d+)$/);
  var asIdx = !!asIdxMatch && (+asIdxMatch[1] >= 1) && (+asIdxMatch[1] <= events.length);
  var exactNameExists = events.some(function(e){
    return String(e.name||'').toLowerCase() === needle;
  });
  if (!rmAll && !exact && asIdx && exactNameExists) {
    sendChat(script_name, '/w gm "'+esc(raw)+'" matches an index and an event name. '+
      'Use <code>!cal removeevent index '+esc(raw)+'</code> to remove index #'+esc(raw)+
      ' or <code>!cal removeevent exact '+esc(raw)+'</code> to remove the named event.');
    return;
  }

  // Events have a hidden numerical index that can be called instead of a name.
  // Index path only usable without "all" or "exact".
  if (!rmAll && !exact && asIdx) {
    var idx = +asIdxMatch[1];
    var removed = events.splice(idx-1, 1)[0];
    markSuppressedIfDefault(removed);
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed event #'+idx+': '+esc(removed.name));
    sendCurrentDate(null,true);
    return;
  }

  // Name-matching. Any matching string is used unless "exact" was called.
  var matches = events.filter(function(e){
    var n = String(e.name||'').toLowerCase();
    return exact ? (n===needle) : (n.indexOf(needle)!==-1);
  });

  // If nothing matches.
  if (!matches.length){
    sendChat(script_name, '/w gm No events matched "'+esc(raw)+'".');
    return;
  }

  // If "all" wasn't called, only one event can be removed.
  // If multiple matches, expose the hidden indices.
  if (!rmAll && matches.length>1){
    var list = matches.map(function(e){
      var i = events.indexOf(e)+1, m = getCal().months[e.month-1].name;
      var y = (e.year==null)? '' : (', '+e.year+' '+LABELS.era);
      return '#'+i+' '+esc(e.name)+' ('+esc(m)+' '+esc(e.day)+y+')';
    }).join('<br>');
    sendChat(script_name, '/w gm Multiple matches for "'+esc(raw)+'"'+(exact?' (exact)':'')+
      ':<br>'+list+'<br>Use the index to remove one, or prefix with <code>all</code> to remove all.');
    return;
  }

  // If "all" was called, remove everything with any matching string.
  if (rmAll){
    matches.forEach(markSuppressedIfDefault);
    cal.events = events.filter(function(e){ return matches.indexOf(e)===-1; });
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed '+matches.length+' event'+(matches.length===1?'':'s')+'.');
  }
  // If only one event name matches, remove it.
  else {
    var e = matches[0], pos = events.indexOf(e);
    events.splice(pos,1);
    markSuppressedIfDefault(e);
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed event: '+esc(e.name)+' ('+
      esc(getCal().months[e.month-1].name)+' '+esc(e.day)+
      ((e.year!=null)?(', '+e.year+' '+LABELS.era):'')+')');
  }

  sendCurrentDate(null,true);
}

function getEventsFor(monthIndex, day, year){ // Returns all events that occur on a specific (monthIndex, day), supporting day ranges. Year is optional
  var m = monthIndex|0, out=[];
  var events = getCal().events;
  var y = (typeof year === 'number') ? (year|0) : getCal().current.year;
  if (!events || !events.length) return [];
  for (var i=0;i<events.length;i++){
    var e = events[i];
    if (((parseInt(e.month,10)||1)-1) !== m) continue;
    // Show events that repeat every year (year==null) OR match the requested year
    if (e.year != null && (e.year|0) !== y) continue;
    if (makeDayMatcher(e.day)(day)) out.push(e);
  }
  return out;
}

function occurrencesInRange(startSerial, endSerial){
  var cal = getCal(), dpy = daysPerYear(), occ=[];
  var yStart = Math.floor(startSerial/dpy);
  var yEnd   = Math.floor(endSerial/dpy);

  for (var i=0;i<cal.events.length;i++){
    var e = cal.events[i];
    var mi = clamp(e.month,1,cal.months.length)-1;
    var maxD = cal.months[mi].days|0;
    var days = expandDaySpec(e.day, maxD);

    var ys = (e.year==null) ? yStart : (e.year|0);
    var ye = (e.year==null) ? yEnd   : (e.year|0);
    for (var y=ys; y<=ye; y++){
      for (var k=0;k<days.length;k++){
        var d = clamp(days[k],1,maxD);
        var ser = toSerial(y, mi, d);
        if (ser>=startSerial && ser<=endSerial){
          occ.push({serial:ser, y:y, m:mi, d:d, e:e});
        }
      }
    }
  }

  occ.sort(function(a,b){ return a.serial - b.serial || a.m - b.m || a.d - b.d; });
  return occ;
}

function formatDateLabel(y, mi, d, includeYear){
  var cal=getCal();
  var lbl = esc(cal.months[mi].name)+' '+d;
  if (includeYear) lbl += ', '+esc(String(y))+' '+LABELS.era;
  return lbl;
}

function eventsListHTMLForRange(title, startSerial, endSerial){
  var cal = getCal(), cur = cal.current, today = todaySerial();
  var occ = occurrencesInRange(startSerial, endSerial);
  var includeYear = (Math.floor(startSerial/daysPerYear()) !== Math.floor(endSerial/daysPerYear()));
  var out = ['<div style="margin:4px 0;"><b>'+esc(title)+'</b></div>'];

  if (!occ.length){
    out.push('<div style="opacity:.7;">No events in this range.</div>');
    return out.join('');
  }

  for (var i=0;i<occ.length;i++){
    var o = occ[i], sw = swatchHtml(o.e.color);
    var isToday = (o.serial === today);
    var dateLbl = formatDateLabel(o.y, o.m, o.d, includeYear);
    out.push('<div'+(isToday?' style="font-weight:bold;margin:2px 0;"':' style="margin:2px 0;"')+'>'
      + sw + dateLbl + ': ' + esc(o.e.name) + '</div>');
  }
  return out.join('');
}

function eventsListHTMLArg(argTokens){
  var cal = getCal(), cur=cal.current;
  var months = cal.months, dpy=daysPerYear();
  var mdaysCur = months[cur.month].days|0;

  var arg = (argTokens||[]).join(' ').trim();
  var lower = arg.toLowerCase();

  if (!arg || lower === 'month'){ // current month
    var s = toSerial(cur.year, cur.month, 1);
    var e = toSerial(cur.year, cur.month, mdaysCur);
    return eventsListHTMLForRange('Events — This Month', s, e);
  }

  if (lower === 'upcoming' || lower === 'upcoming month' || lower === 'upcomingmonth'){ // 28-day rolling window (keep 'next' as legacy alias)
    var s2 = toSerial(cur.year, cur.month, cur.day_of_the_month);
    var e2 = s2 + 27;
    return eventsListHTMLForRange('Events — Upcoming (28 Days)', s2, e2);
  }

  if (lower === 'next' || lower === 'next month' || lower === 'nextmonth'){
    var nextMi = (cur.month + 1) % months.length;
    var yN = cur.year + (nextMi === 0 ? 1 : 0);
    var mdN = months[nextMi].days|0;
    var sN = toSerial(yN, nextMi, 1);
    var eN = toSerial(yN, nextMi, mdN);
    return eventsListHTMLForRange('Events — Next Month ('+months[nextMi].name+')', sN, eN);
  }

  if (lower === 'year'){ // current year
    var s3 = toSerial(cur.year, 0, 1);
    var e3 = s3 + dpy - 1;
    return eventsListHTMLForRange('Events — Year '+cur.year+' '+LABELS.era, s3, e3);
  }

  if (lower === 'upcoming year' || lower === 'upcomingyear'){ // rolling 12 months starting this month
    var s4 = toSerial(cur.year, cur.month, 1);
    var e4 = s4 + dpy - 1;
    return eventsListHTMLForRange('Events — Upcoming Year (rolling from this month)', s4, e4);
  }

  if (lower === 'next year' || lower === 'nextyear'){ // fixed next calendar year
    var sNY = toSerial(cur.year+1, 0, 1);
    var eNY = sNY + dpy - 1;
    return eventsListHTMLForRange('Events — Year '+(cur.year+1)+' '+LABELS.era, sNY, eNY);
  }

  // "<Month> <Year>"
  var my = parseMonthYearTokens(argTokens||[]);
  if (my){
    var md = months[my.mi].days|0;
    var sMY = toSerial(my.year, my.mi, 1);
    var eMY = toSerial(my.year, my.mi, md);
    return eventsListHTMLForRange('Events — '+months[my.mi].name+' '+my.year+' '+LABELS.era, sMY, eMY);
  }

  // numeric year?
  var yNum = parseInt(arg,10);
  if (String(yNum) === arg && isFinite(yNum)){
    var s5 = toSerial(yNum, 0, 1);
    var e5 = s5 + dpy - 1;
    return eventsListHTMLForRange('Events — Year '+yNum+' '+LABELS.era, s5, e5);
  }

  // month name → "next <Month>"
  var mi = monthIndexByName(arg);
  if (mi !== -1){
    var targetYear = (mi >= cur.month) ? cur.year : (cur.year+1);
    var mdays = months[mi].days|0;
    var s6 = toSerial(targetYear, mi, 1);
    var e6 = toSerial(targetYear, mi, mdays);
    return eventsListHTMLForRange('Events — '+months[mi].name+' (next occurrence)', s6, e6);
  }

  return '<div style="opacity:.8;">Didn’t understand <code>'+esc(arg)+'</code>. Try: <code>month</code>, <code>upcoming</code>, <code>next month</code>, <code>year</code>, <code>upcoming year</code>, <code>next year</code>, a year number, a month name, or a <code>Month Year</code> combo.</div>';
}

function parseMonthYearTokens(tokens){
  tokens = (tokens||[]).map(function(t){ return String(t).trim(); }).filter(Boolean);
  if (!tokens.length) return null;
  var mi = -1, yr = null;
  for (var i=0;i<tokens.length;i++){
    var t = tokens[i];
    var mIdx = monthIndexByName(t);
    if (mIdx !== -1) mi = mIdx;
    var y = parseInt(t,10);
    if (isFinite(y) && /^\d+$/.test(t)) yr = y;
  }
  if (mi !== -1 && yr != null) return {mi: mi, year: yr};
  return null;
}

// Rendering and output functions

function buildHelpHtml(isGM){
  var common = [
    '<div style="margin:4px 0;"><b>Basic Commands</b></div>',
    '<div>• <code>!cal</code> or <code>!cal show</code> — current month calendar</div>',
    '<div>• <code>!cal year</code> — full year calendar</div>',
    '<div>• <code>!cal events</code> — list events for the current month</div>',
    '<div style="height:12px"></div>',

    '<div style="margin:4px 0;"><b>Detailed Commands</b></div>',
    '<div>• <code>!cal show</code> OR <code>!cal events</code> modifiers:</div>',
      '<div style="margin-left:1.8em;">• <code>month</code></div>',
      '<div style="margin-left:1.8em;">• <code>year</code></div>',
      '<div style="margin-left:1.8em;">• <code>next</code> OR <code>next month</code></div>',
      '<div style="margin-left:1.8em;">• <code>next year</code></div>',
      '<div style="margin-left:1.8em;">• <code>upcoming</code></div>',
      '<div style="margin-left:1.8em;">• <code>upcoming year</code></div>',
      '<div style="margin-left:1.8em;">• <code>&lt;named month&gt; and/or &lt;numbered year&gt;</code></div>',

    '<div style="opacity:.85;"><i>Notes:</i></div>',
      '<div style="margin-left:1.8em;opacity:.85;"><i><code>next</code> = the next fixed period (month / calendar year).</i></div>',
      '<div style="margin-left:1.8em;opacity:.85;"><i><code>upcoming</code> = today-inclusive rolling window (28 days / 12 months).</i></div>',
    
    '<div style="height:12px"></div>',
    '<div>• <code>!cal help</code> — show this help</div>'
  ];


  if (!isGM) return common.join(''); // The following block only shows if the player is GM

  var gm = [
    '<div style="margin-top:10px;"><b>Date Management</b></div>',
    '<div>• <code>!cal advanceday</code> — advance one day</div>',
    '<div>• <code>!cal retreatday</code> — go back one day</div>',
    '<div>• <code>!cal setdate &lt;mm&gt; &lt;dd&gt; [yyyy]</code> — set exact date</div>',
    '<div style="height:12px"></div>',

    '<div>• <code>!cal senddate</code> — broadcast current month</div>',
    '<div>• <code>!cal sendyear</code> — broadcast full year</div>',
    '<div style="height:12px"></div>',

    '<div style="margin-top:10px;"><b>Event Management</b></div>',
    '<div>• smart-parsing. [ ] denotes optional arguments. (defaults to the next matching date)</div>',
    '<div>• comma-separated lists, hyphen-separated ranges, or "all" accepted for months, days, or years.</div>',
    '<div>• hex codes should be preceded with #</div>',
    '<div>• <code>!cal addevent [MM] DD [YYYY] name #hex</code> — add event(s)</div>',
    '<div>• <code>!cal addmonthly DD name #hex</code> — repeats every month, every year</div>',
    '<div>• <code>!cal addannual MM DD name #hex</code> — repeats every year</div>',
    '<div>• <code>!cal addnext</code> - same as addevent, but makes you feel intentional</div>',
    '<div style="margin-left:1.8em;">• Tip: if your event name starts or ends with numbers, use <code>--</code> to separate date from name, e.g. <code>!cal addevent 3 14 -- 1985</code>.</div>',
    '<div style="height:12px"></div>',

    '<div>• <code>!cal removeevent [all] [exact] [index] name or index number</code></div>',
    '<div style="margin-left:1.8em;">• removes a single event by name or index, or reveals additional help for ambiguity.</div>',
    '<div style="margin-left:1.8em;">• all - wipes <i>everything</i> that matches</div>',
    '<div style="margin-left:1.8em;">• exact - forces exact name-matching. can be used with or without "all"</div>',
    '<div style="margin-left:1.8em;">• index - assumes name field is event index. cannot be used with all or exact</div>',
    '<div style="height:12px"></div>',

    '<div style="margin-top:10px;"><b>Script Management</b></div>',
    '<div>• <code>!cal refresh</code> — re-normalize and de-duplicate calendar state. called automatically, but makes you feel fresh to use.</div>',
    '<div>• <code>!cal resetcalendar</code> — reset to defaults (nukes custom events and current date)</div>'
  ];

  return common.concat(gm).join('');
}


function renderMiniCal(mi, yearLabel){ // Builds mini-calendar for a single month, highlighting current day and events
  var cal = getCal(), cur = cal.current;
  var wd = cal.weekdays, mObj = cal.months[mi], md = mObj.days;
  var monthColor = mObj.color || '#eee';

  var textColor = textColorForBg(monthColor);
  var outline = outlineIfNeeded(textColor, monthColor);

  var first = (typeof yearLabel === 'number')
    ? weekdayIndexForYear(yearLabel, mi, 1)
    : weekdayIndexFor(mi, 1);

   var html = ['<table style="'+STYLES.table+'">'];

  html.push( // Month header
    '<tr><th colspan="7" style="'+STYLES.head+'">' +
      '<div style="'+STYLES.monthHeaderBase+'background-color:'+monthColor+';color:'+textColor+';'+outline+'">' +
        esc(mObj.name) +
        '<span style="float:right;">'+esc(String(yearLabel!=null?yearLabel:cur.year))+' '+LABELS.era+'</span>' +
      '</div>' +
    '</th></tr>'
  );

  html.push( // Weekdays header
    '<tr>' + wd.map(function(d){
      return '<th style="'+STYLES.th+'">'+esc(d)+'</th>';
    }).join('') + '</tr>'
  );

  var day=1; // Builds the individual day cells
  for (var r=0;r<6;r++){
    html.push('<tr>');
    for (var c=0;c<7;c++){
      if ((r===0 && c<first) || day>md){
        html.push('<td style="'+STYLES.td+'"></td>');
      } else {
        var isToday = (mi === cur.month) &&
                      (day === cur.day_of_the_month) &&
                      ((typeof yearLabel !== 'number') || (yearLabel === cur.year));
        var targetYear = (typeof yearLabel === 'number') ? yearLabel : cur.year;
        var todays = getEventsFor(mi, day, targetYear);
        var evObj = todays[0] || null;
        var style = STYLES.td;
        var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';

        if (todays.length >= 2){ // Multiple events: gradient background
            var cols = todays.slice(0,3).map(getEventColor);
            style = styleForGradient(style, cols);
            if (isToday){ style = _applyTodayStyle(style); } // If also today, apply emphasis
        } else if (evObj){ // Single event: solid background
            style = styleForBg(style, getEventColor(evObj));
            if (isToday){ style = _applyTodayStyle(style); } // If also today, apply emphasis
        } else if (isToday){ // No events, but is today: use month color background
            style = styleForBg(style, monthColor);
            style = _applyTodayStyle(style);
        }

        html.push('<td'+titleAttr+' style="'+style+'"><div>'+day+'</div></td>');
        day++;
      }
    }
    html.push('</tr>');
    if (day>md) break;
  }
  html.push('</table>');
  return html.join('');
}

function currentMonthHTML(){ return renderMiniCal(getCal().current.month); } // Current month view

function renderMonthHTML(monthIndex){ return renderMiniCal(monthIndex); } // Call to render a specific month

function yearHTML(){ // Full year view
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    html.push(
      '<div style="display:inline-block;vertical-align:top;margin:4px;">' +
        renderMonthHTML(i) +
      '</div>'
    );
  }
  html.push('</div>');
  return html.join('');
}

function yearHTMLFor(targetYear){
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    html.push(
      '<div style="display:inline-block;vertical-align:top;margin:4px;">' +
        renderMiniCal(i, targetYear) +
      '</div>'
    );
  }
  html.push('</div>');
  return html.join('');
}

function rollingYearHTML(){ // current month + next 11, across year boundary
  var cal=getCal(), cur=cal.current, months=getCal().months;
  var html=['<div style="text-align:left;">'];
  for (var off=0; off<12; off++){
    var mi = (cur.month + off) % months.length;
    var y  = cur.year + Math.floor((cur.month + off) / months.length);
    html.push(
      '<div style="display:inline-block;vertical-align:top;margin:4px;">' +
        renderMiniCal(mi, y) +
      '</div>'
    );
  }
  html.push('</div>');
  return html.join('');
}

function sendCurrentDate(to, gmOnly){ // Send current date to caller. Also allows for GM-only broadcast.
    var cal=getCal(), c=cal.current;
    var m=cal.months[c.month], wd=cal.weekdays[c.day_of_the_week];
    var mName = esc(m.name);
    var mSeason = esc(m.season);

    var wdName = esc(wd);
    var publicMsg = [
        currentMonthHTML(),
        '<div style="font-weight:bold;margin:2px 0;">' + wdName + ', ' + mName+' ' + c.day_of_the_month + ', ' + esc(String(c.year)) + ' ' + LABELS.era +'</div>'
    ];

    publicMsg.push(monthEventsHtml(c.month, c.day_of_the_month));
    publicMsg.push('<div style="margin-top:8px;"></div>');
    publicMsg.push('<div>Season: '+mSeason+'</div>');

  if (gmOnly){
    sendToGM(publicMsg.join(''));
  } else if (to){
    whisper(to, publicMsg.join(''));
  } else {
    sendToAll(publicMsg.join(''));
  }

  if (gmOnly || !to) { sendToGM(gmButtonsHtml()); }
}

function showHelp(to, isGM){ // Show help. Truncated list if not GM.
  var help = buildHelpHtml(!!isGM);
  if (to){
    whisper(to, help);
  } else {
    sendChat(script_name, help);
  }
}

// Roll20-specific bits

function whisper(to, html){ // Whisper function that sanitizes player name in case of HTML characters (like quotes or brackets)
  var name = String(to || '').replace(/\s+\(GM\)$/,'').trim();
  name = name.replace(/"/g,'').replace(/\[/g,'(').replace(/\]/g,')')
             .replace(/[|\\]/g,'-').replace(/[<>]/g,'-');
  sendChat(script_name, '/w "'+ name +'" ' + html);
}

var commands = { // !cal API command list

// This commands block is available to all players

  '':function(m){ // !cal (used blank)
    var isGM = playerIsGM(m.playerid);
    sendCurrentDate(m.who);
    if (isGM) whisper(m.who, gmButtonsHtml());
  },

  show: function(m,a){ // !cal show [args...]
    var args = a.slice(2);
    if (!args.length || /^month$/i.test(args[0])){ // !cal show (used blank)
      var isGM = playerIsGM(m.playerid);
      sendCurrentDate(m.who);
      if (isGM) whisper(m.who, gmButtonsHtml());
      return;
    }

      var q = args.join(' ').trim().toLowerCase();

      if (q === 'year'){ // current numbered calendar year
        whisper(m.who, yearHTML());
        return;
      }

      // hidden functionality for confused "upcoming" usage
      if (q === 'upcoming' || q === 'upcoming month' || q === 'upcomingmonth') {
        var calU = getCal(), curU = calU.current, monthsU = calU.months;
        var miU = curU.month, yU = curU.year;
        if (curU.day_of_the_month >= 15) {
          miU = (curU.month + 1) % monthsU.length;
          yU = curU.year + (miU === 0 ? 1 : 0);
        }
        whisper(m.who, renderMiniCal(miU, yU));
        return;
      }

      if (q === 'next' || q === 'next month' || q === 'nextmonth'){ // next month
        var calN = getCal(), curN = calN.current, monthsN = calN.months;
        var nextMi = (curN.month + 1) % monthsN.length;
        var yN = curN.year + (nextMi === 0 ? 1 : 0);
        whisper(m.who, renderMiniCal(nextMi, yN));
        return;
      }

      if (q === 'next year' || q === 'nextyear'){ // next numbered calendar year
        var curY = getCal().current.year;
        whisper(m.who, yearHTMLFor(curY + 1));
        return;
      }

      if (q === 'upcoming year' || q === 'upcomingyear'){ // current month plus next 11 (rolling)
        whisper(m.who, rollingYearHTML());
        return;
      }

      var my = parseMonthYearTokens(args); // "<Month> <Year>" - specific month in a specific year
      if (my){
        whisper(m.who, renderMiniCal(my.mi, my.year));
        return;
      }

      var yNum = parseInt(q,10); // specific numbered year
      if (String(yNum)===q && isFinite(yNum)){
        whisper(m.who, yearHTMLFor(yNum));
        return;
      }

      var mi = monthIndexByName(q); // specific named month (next occurrence)
      if (mi !== -1){
        var cur = getCal().current;
        var y = (mi >= cur.month) ? cur.year : (cur.year+1);
        whisper(m.who, renderMiniCal(mi, y));
        return;
      }

    sendCurrentDate(m.who); // fallback to current month
  },

  year:        function(m){ whisper(m.who, yearHTML()); }, // current calendar year
    fullyear:    function(m){ whisper(m.who, yearHTML()); }, // alias
    showyear:    function(m){ whisper(m.who, yearHTML()); }, // alias
  
  events: function(m, a){ // !cal events [arg...]
//  var html = eventsListHTMLArg(args); // uses fallback to current month. comment out the following 3 lines to use.
    var args = a.slice(2);
    var html = eventsListHTMLArg(args.length ? args : ['upcoming']); // default to rolling 28 days
    whisper(m.who, html);
  },

  listevents:  function(m){ whisper(m.who, eventsListHTMLArg(['year'])); }, // alias for !cal events year

  help:        function(m){ showHelp(m.who, playerIsGM(m.playerid)); }, // show help block with !cal help

// This block is GM-only

  advanceday:  { gm:true, run:function(){ advanceDay(); } }, // step forward
  retreatday:  { gm:true, run:function(){ retreatDay(); } }, // step back
  setdate:     { gm:true, run:function(m,a){ setDate(a[2], a[3], a[4]); } }, // MM DD [YYYY]
  senddate:    { gm:true, run:function(){ sendCurrentDate(); } }, // broadcast current month plus events
  sendyear:    { gm:true, run:function(){ sendToAll(yearHTML()); } }, // broadcast current year (no events)

  // Event management
    
    // Custom events accept [MM] DD [YYYY] (name) (hex color code)
    // Comma-separated lists (like 1,17,7) are supported
    // Ranges (like 15-21) are supported
    // "all" is supported
    addevent: { gm:true, run:function(m,a){ // add a custom event with [MM] DD [YYYY] <name> <hex color>. accepts both lists (1,3,7) and ranges (17-19)
      if (a.length < 3) {
        whisper(m.who, 'Usage: <code>!cal addevent [&lt;month|list|all&gt;] &lt;day|range|list|all&gt; [&lt;year|list|all&gt;] &lt;name...&gt; [#hex]</code>');
        return;
      }
      addEventSmart(a.slice(2));
    }},

    // The following don't do anything the above cannot. They just "autofill" certain fields

      addmonthly: { gm:true, run:function(m,a){ // repeats monthly on DD. (as if MM was "all")
        if (a.length < 4){
          whisper(m.who, 'Usage: <code>!cal addmonthly &lt;day|range|list|all&gt; &lt;name...&gt; [#hex]</code>');
          return;
        }
        var maybeColor=a[a.length-1], hasColor=!!sanitizeHexColor(maybeColor);
        var nameTokens = hasColor ? a.slice(3,a.length-1) : a.slice(3);
        addMonthly(a[2], nameTokens, hasColor?maybeColor:null);
      }},

      addannual: { gm:true, run:function(m,a){ // repeats yearly on MM DD. (as if YYYY was "all")
        if (a.length < 5){
          whisper(m.who, 'Usage: <code>!cal addannual &lt;month|list|all&gt; &lt;day|range|list|all&gt; &lt;name...&gt; [#hex]</code>');
          return;
        }
        var maybeColor=a[a.length-1], hasColor=!!sanitizeHexColor(maybeColor);
        var nameTokens = hasColor ? a.slice(4,a.length-1) : a.slice(4);
        addAnnual(a[2], a[3], nameTokens, hasColor?maybeColor:null);
      }},

      addnext: { gm:true, run:function(m,a){ // uses the next incidence of the numbered date. (might be next month.)
        if (a.length < 4){
          whisper(m.who, 'Usage: <code>!cal addnext &lt;day&gt; &lt;name...&gt; [#hex]</code> or <code>!cal addnext &lt;month&gt; &lt;day&gt; &lt;name...&gt; [#hex]</code>');
          return;
        }
        addNext(a.slice(2));
      }},

    // This function can remove default events as well.
    // !cal removeevent all Gala - wipes all "Gala" events
    // !cal removeevent all exact Tain Gala - wipes only "Tain Gala" events
    removeevent: { gm:true, run:function(m,a){
      if (a.length < 3){
        whisper(m.who, 'Usage: <code>!cal removeevent [all] [exact] [index] &lt;index|name&gt;</code>');
        return;
      }
      removeEvent(a.slice(2).join(' '));
    }},

  refresh: { gm:true, run:function(){ refreshCalendarState(false); } }, // refresh the state. automatically called elsewhere, but makes you feel fresh to manually call it
  resetcalendar:{ gm:true, run:function(){ resetToDefaults(); } } // nuke the state, restoring to hard-coded defaults in this script
};

function handleInput(msg){ // API command handler
  if (msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/), sub=(args[1]||'').toLowerCase();
  var cmd = commands[sub];
  if (!cmd){ sendCurrentDate(msg.who); return; }

  if (typeof cmd === 'function'){ cmd(msg, args); return; }

  if (cmd.gm && !playerIsGM(msg.playerid)){
    whisper((msg.who||'').replace(/\s+\(GM\)$/,''), LABELS.gmOnlyNotice);
    return;
  }
  cmd.run(msg, args);
}

function register(){ on('chat:message', handleInput); }

on("ready", function(){
  checkInstall();
  refreshCalendarState(true);
  register();

  var currentDate = currentDateLabel();
  log('Eberron Calendar Running, current date: ' + currentDate);

  sendChat(script_name,
    '/direct ' +
    '<div>Eberron Calendar Initialized</div>' +
    '<div>Current date: ' + esc(currentDate) + '</div>' +
    '<div>Use <code>!cal</code> to view the calendar.</div>' +
    '<div>Use <code>!cal help</code> for command details.</div>'
  );
});

return { checkInstall: checkInstall, register: register };
})();