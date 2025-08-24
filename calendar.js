// Eberron Calendar Script
// By Matthew Cherry (github.com/mcherry1/calendar)
// This is written for Roll20's API system.
// Call `!cal` to show the calendar, and use `!cal help` for command details.
// Version: 1.2

var Calendar = (function(){

'use strict';
var script_name = 'Calendar';
var state_name  = 'CALENDAR';
var EVENT_DEFAULT_COLOR = sanitizeHexColor('#ff00f2'); // Bright pink for events without a defined color.

// Default data
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
    events: [ // Eberron-specific events. Change for other settings. Colors are not canon, but chosen to match event themes.
        { name: "Crystalfall",             month: 2,  day: 9,   color: "#87CEEB" },
        { name: "The Day of Mourning",     month: 2,  day: 20,  color: "#808080" },
        { name: "Sun's Blessing",          month: 3,  day: 15,  color: "#FFD700" },
        { name: "Aureon's Crown",          month: 5,  day: 26,  color: "#6A5ACD" },
        { name: "Brightblade",             month: 6,  day: 12,  color: "#B22222" },
        { name: "The Race of Eight Winds", month: 7,  day: 23,  color: "#20B2AA" },
        { name: "The Hunt",                month: 8,  day: 4,   color: "#228B22" },
        { name: "Fathen's Fall",           month: 8,  day: 25,  color: "#8B0000" },
        { name: "Boldrei's Feast",         month: 9,  day: 9,   color: "#FFB347" },
        { name: "The Ascension",           month: 10,  day: 1,  color: "#F8F8FF" },
        { name: "Wildnight",               month: 10,  day: "18-19", color: "#8B0000" },
        { name: "Thronehold",              month: 11, day: 11,  color: "#4169E1" },
        { name: "Remembrance Day",         month: 11, day: 11,  color: "#DC143C" },
        { name: "Long Shadows",            month: 12, day: "26-28", color: "#0D0D0D" }
    ]
};

// Core state and migration functions

function resetToDefaults(){ // Nuke state and reset to defaults. Hard-coded details above are not affected.
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

    var cal = state[state_name].calendar;
    if (!cal.current) cal.current = { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 };

    if(!Array.isArray(cal.events)){
        cal.events = JSON.parse(JSON.stringify(defaults.events)).map(function(e){
            var lim = Math.max(1, cal.months.length);
            var m = Math.max(1, Math.min(parseInt(e.month,10)||1, lim));
            e.name  = String(e.name||'');
            e.month = m;
            e.color = sanitizeHexColor(e.color) || null;
            return e;
        });
    } else {
        cal.events = cal.events.map(function(e){
            var lim = Math.max(1, cal.months.length);
            var m = Math.max(1, Math.min(parseInt(e.month,10)||1, lim));
            return {
                name: String(e.name||''),
                month: m,
                day: e.day,
                color: sanitizeHexColor(e.color) || null
            };
        });
        var defColorByKey = {};
        defaults.events.forEach(function(de){
            var key = (parseInt(de.month,10)||1) + '|' + String(de.day);
            defColorByKey[key] = sanitizeHexColor(de.color) || null;
        });
        cal.events.forEach(function(e){
            if (!e.color) {
                var key = e.month + '|' + String(e.day);
                var col = defColorByKey[key];
                if (col) e.color = col;
            }
        });
    }

    for (var i = 0; i < cal.months.length; i++){
        var d = defaults.months[i] || {};
        cal.months[i] = cal.months[i] || {};
        if (!cal.months[i].name)   cal.months[i].name   = d.name   || ('Month '+(i+1));
        if (!cal.months[i].days)   cal.months[i].days   = d.days   || 28;
        if (!cal.months[i].season) cal.months[i].season = d.season || '';
        if (!cal.months[i].color)  cal.months[i].color  = d.color  || '#EEE';
    }

    if (cal.current.month >= cal.months.length){
        cal.current.month = Math.max(0, cal.months.length - 1);
    }
    var mdays = cal.months[cal.current.month].days;
    if (cal.current.day_of_the_month > mdays){
        cal.current.day_of_the_month = mdays;
    }
}

function refreshCalendarState(silent){ // Re-validate and clean up calendar state. Ensures events added manually are correctly added when a previously existing same-day event was present.
    checkInstall();
    var cal = getCal();

  cal.events = (cal.events || []).map(function(e){
    var m = clamp(e.month, 1, cal.months.length);
    var daySpec = normalizeDaySpec(e.day, cal.months[m-1].days) || String(firstNumFromDaySpec(e.day));
    return { name: String(e.name||''), month: m, day: daySpec, color: sanitizeHexColor(e.color) || null };
  });

  var seen = {};
  cal.events = cal.events.filter(function(e){
    var k = e.month+'|'+e.day+'|'+e.name.toLowerCase();
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

function headerTextColor(bg){ // Given a background color, return either black or white for best contrast.
    var hex = (bg||'').toString().trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return '#000';
    var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    return ((r*299 + g*587 + b*114)/1000) >= 165 ? '#000' : '#fff';
}

function esc(s){ // Basic escaping for characters that will break HTML.
    if (s == null) return '';
    return String(s)
        .replace(/&(?!#?\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

function styleForBg(style, bgHex){
  var t = headerTextColor(bgHex);
  return style + 'background:'+bgHex+';color:'+t+';' + outlineIfNeeded(t, bgHex);
}

function makeDayMatcher(spec){ // Returns a function that tests if a given day matches a spec (number or "a-b" range).
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

function _gradientFor(cols){ // Generates a crisp color gradient for multi-event days.
  var ang = '45deg';
  if (cols.length === 2){
    var a = cols[0], b = cols[1];
    return 'linear-gradient(' + ang + ','+
           a+' 0%,'+a+' 50%,'+
           b+' 50%,'+b+' 100%)';
  }
  var a = cols[0], b = cols[1], c = cols[2] || cols[1];
  return 'linear-gradient(' + ang + ','+
         a+' 0%,'+a+' 33.333%,'+
         b+' 33.333%,'+b+' 66.666%,'+
         c+' 66.666%,'+c+' 100%)';
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
  var rows = [];
  cal.events
    .filter(function(e){ return ((+e.month||1)-1) === mi; })
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
var STYLES = {
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

function gmButtonsHtml(){ // GM buttons for quick actions. Currently only called when single-month calendar is shown.
  return [
    '[📤 Send Date](!cal senddate)',
    '[⏭ Advance Day](!cal advanceday)',
    '[⏮ Retreat Day](!cal retreatday)',
    '[❓ Help](!cal help)'
  ].map(function(b){ return '<div style="'+STYLES.gmBtnWrap+'">'+b+'</div>'; }).join('');
}

function compareEvents(a, b){ // Sort events by month then earliest day in their day spec (e.g., "18-19" → 18).
  var am = (+a.month||1), bm = (+b.month||1);
  if (am !== bm) return am - bm;
  return firstNumFromDaySpec(a.day) - firstNumFromDaySpec(b.day);
}

function _relLum(hex){ // Relative luminance of a hex color, per WCAG 2.0
  hex = (hex||'').toString().replace(/^#/, '');
  if (hex.length===3) hex = hex.replace(/(.)/g,'$1$1');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0; // default black
  var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function lin(c){ c/=255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}

function _contrast(bgHex, textHex){ // Contrast ratio of two hex colors, per WCAG 2.0
  var L1=_relLum(bgHex), L2=_relLum(textHex);
  var hi=Math.max(L1,L2), lo=Math.min(L1,L2);
  return (hi+0.05)/(lo+0.05);
}

var CONTRAST_MIN = 4.5;

function outlineIfNeeded(textColor, bgHex){
  var ratio = _contrast(bgHex, textColor);
  return (ratio < CONTRAST_MIN && textColor === '#fff')
    ? 'text-shadow:-0.5px -0.5px 0 #000,0.5px -0.5px 0 #000,-0.5px 0.5px 0 #000,0.5px 0.5px 0 #000;'
    : '';
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

function setDate(m, d, y){
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

function addEvent(monthToken, dayToken, nameTokens, colorToken){
  var cal = getCal();
  var m = clamp(monthToken, 1, cal.months.length);
  var daySpec = normalizeDaySpec(dayToken, cal.months[m-1].days);
  if (!daySpec){
    sendChat(script_name, '/w gm Couldn’t understand the day "'+esc(dayToken)+'". Use a number (e.g. 12) or range (e.g. 18-19).');
    return;
  }
  var name = String((nameTokens||[]).join(' ')).trim();
  name = name.replace(/^"(.*)"$/,'$1').replace(/^'(.*)'$/,'$1').trim();
  if (!name) name = 'Untitled Event';
  var color = sanitizeHexColor(colorToken);
  if (colorToken && !color){
    sendChat(script_name, '/w gm Invalid color "'+esc(colorToken)+'". Use hex (#RRGGBB or #RGB). Using default.');
  }
  var exists = cal.events.some(function(e){ // Check for existing event with same month, day, and name
    return (parseInt(e.month,10)||1) === m &&
           String(e.day) === daySpec &&
           String(e.name||'').trim().toLowerCase() === name.toLowerCase();
  });
  if (exists){
    sendChat(script_name, '/w gm An event with the same month, day, and name already exists. Skipped.');
    return;
  }

  cal.events.push({ name: name, month: m, day: daySpec, color: color });

  cal.events.sort(compareEvents);

  var swatch = swatchHtml(color);
  sendChat(script_name, '/w gm Added event: '+swatch+esc(name)+' on '+esc(cal.months[m-1].name)+' '+esc(daySpec)+ (color ? ' ('+esc(color)+')' : ''));
  refreshCalendarState(true);
  sendCurrentDate(null, true);
}

function removeEvent(query){ // Remove event by name match or index. If multiple matches, list them with indices and request repeated command.
  var cal = getCal();
  var events = cal.events;

  if (!events.length){
    sendChat(script_name, '/w gm No events to remove.');
    return;
  }

  var idx = parseInt(query, 10);
  if (isFinite(idx) && idx >= 1 && idx <= events.length){
    var removed = events.splice(idx-1, 1)[0];
    sendChat(script_name, '/w gm Removed event #'+idx+': '+esc(removed.name));
    sendCurrentDate(null,true);
    return;
  }
  var q = String(query||'').trim().toLowerCase();
  var matches = events.filter(function(e){ return e.name.toLowerCase().indexOf(q) !== -1; });

  if (matches.length === 0){
    sendChat(script_name, '/w gm No events matched "'+esc(query)+'".');
    return;
  } else if (matches.length > 1){
    var list = matches.map(function(e,i){
      var idx = events.indexOf(e)+1;
      return '#'+idx+' '+esc(e.name)+' ('+esc(getCal().months[e.month-1].name)+' '+esc(e.day)+')';
    }).join('<br>');
    sendChat(script_name, '/w gm Multiple matches for "'+esc(query)+'":<br>'+list+'<br>Use the index to remove exactly.');
    return;
  }

  var e = matches[0];
  var pos = events.indexOf(e);
  events.splice(pos,1);
  refreshCalendarState(true);
  sendChat(script_name, '/w gm Removed event: '+esc(e.name)+' ('+esc(getCal().months[e.month-1].name)+' '+esc(e.day)+')');
  sendCurrentDate(null,true);
}

function getEventsFor(monthIndex, day){ // Returns all events that occur on a specific (monthIndex, day), supporting day ranges.
  var m = monthIndex|0, out=[];
  var events = getCal().events;
  if (!events || !events.length) return [];
  for (var i=0;i<events.length;i++){
    var e=events[i];
    if (((parseInt(e.month,10)||1)-1) !== m) continue;
    if (makeDayMatcher(e.day)(day)) out.push(e);
  }
  return out;
}

// Rendering and output functions

function buildHelpHtml(isGM){
  var common = [
    '<div style="margin:4px 0;"><b>Calendar Commands</b></div>',
    '<div>• <code>!cal</code> or <code>!cal show</code> — show the calendar (whispered to you)</div>',
    '<div>• <code>!cal year</code> (also <code>!cal fullyear</code> / <code>!cal showyear</code>) — show mini-calendars for all months</div>',
    '<div>• <code>!cal events</code> — list all events in chronological order</div>',
    '<div>• <code>!cal help</code> — show this help</div>'
  ];

  if (!isGM) return common.join('');

  var gm = [
    '<div style="margin-top:6px;"><b>GM Commands</b></div>',
    '<div>• <code>!cal senddate</code> — broadcast current month</div>',
    '<div>• <code>!cal sendyear</code> — broadcast full year</div>',
    '<div>• <code>!cal advanceday</code> — advance one day</div>',
    '<div>• <code>!cal retreatday</code> — go back one day</div>',
    '<div>• <code>!cal setdate &lt;mm&gt; &lt;dd&gt; [yyyy]</code> — set date</div>',
    '<div>• <code>!cal addevent &lt;month#&gt; &lt;day|start-end&gt; &lt;name...&gt; [#hex]</code> — add a custom event</div>',
    '<div>• <code>!cal removeevent &lt;index|name&gt;</code> — remove an event</div>',
    '<div>• <code>!cal refresh</code> — refresh calendar state</div>',
    '<div>• <code>!cal resetcalendar</code> — reset to defaults. this is an actual nuke of all custom events and current date</div>'
  ];

  return common.concat(gm).join('');
}

function renderMiniCal(mi){ // Builds mini-calendar for a single month, highlighting current day and events
  var cal = getCal(), cur = cal.current;
  var wd = cal.weekdays, mObj = cal.months[mi], md = mObj.days;
  var monthColor = mObj.color || '#eee';

  var textColor = headerTextColor(monthColor);
  var outline = outlineIfNeeded(textColor, monthColor);

  var first = weekdayIndexFor(mi, 1);

  var html = ['<table style="'+STYLES.table+'">'];

  html.push( // Month header
    '<tr><th colspan="7" style="'+STYLES.head+'">' +
      '<div style="'+STYLES.monthHeaderBase+'background-color:'+monthColor+';color:'+textColor+';'+outline+'">' +
        esc(mObj.name) +
        '<span style="float:right;">'+esc(String(cur.year))+' '+LABELS.era+'</span>' +
      '</div>' +
    '</th></tr>'
  );

  html.push( // Weekdays header
    '<tr>' + wd.map(function(d){
      return '<th style="'+STYLES.th+'">'+esc(d)+'</th>';
    }).join('') + '</tr>'
  );

  var day=1; // Builds the day cells
  for (var r=0;r<6;r++){
    html.push('<tr>');
    for (var c=0;c<7;c++){
      if ((r===0 && c<first) || day>md){
        html.push('<td style="'+STYLES.td+'"></td>');
      } else {
        var isToday = (mi === cur.month) && (day === cur.day_of_the_month);
        var todays = getEventsFor(mi, day);
        var evObj = todays[0] || null;
        var style = STYLES.td;
        var cellTextColor, cellBg;
        var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';

        if (todays.length >= 2){ // Multiple events: gradient background
            var cols = todays.slice(0,3).map(getEventColor);
            var avg  = _avgHexColor(cols);
            style += 'background-color:'+cols[0]+';';
            style += 'background-image:'+_gradientFor(cols)+';';
            style += 'background-repeat:no-repeat;background-size:100% 100%;';
            cellTextColor = headerTextColor(avg);
            style += 'color:'+cellTextColor+';'+outlineIfNeeded(cellTextColor, avg);
          if (isToday){ style = _applyTodayStyle(style); } // If also today, apply emphasis
        } else if (evObj){ // Single event: solid background
            cellBg = getEventColor(evObj);
            style = styleForBg(style, cellBg);
            if (isToday){ style = _applyTodayStyle(style); } // If also today, apply emphasis
        } else if (isToday){ // No events, but is today: use month color background
            cellBg = monthColor;
            style = styleForBg(style, cellBg);
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

function renderMonthHTML(monthIndex){ return renderMiniCal(monthIndex); } // Generic month view

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

function eventsListHTML(){ // Full event list, sorted chronologically
  var cal = getCal(), cur = cal.current;
  var items = cal.events.slice().map(function(e){
    var mi = clamp(e.month, 1, cal.months.length) - 1;
    var d0 = firstNumFromDaySpec(e.day);
    return { e: e, mi: mi, d0: d0 };
  });

  items.sort(function(a,b){ return compareEvents(a.e, b.e); });

  var out = ['<div style="margin:4px 0;"><b>All Events (Year '+esc(String(cur.year))+' '+LABELS.era+')</b></div>'];

  items.forEach(function(it){
    var e = it.e;
    var mName = esc(cal.months[it.mi].name);
    var dayLabel = esc(String(e.day));
    var isToday = (it.mi === cur.month) && makeDayMatcher(e.day)(cur.day_of_the_month);
    var swatch = swatchHtml(e.color);

    out.push('<div'+(isToday?' style="font-weight:bold;margin:2px 0;"':' style="margin:2px 0;"')+'>'
      + swatch + mName + ' ' + dayLabel + ': ' + esc(e.name)
      + '</div>');
  });

  if (items.length === 0){
    out.push('<div style="opacity:.7;">No events defined.</div>');
  }

  return out.join('');
}

function sendCurrentDate(to, gmOnly){ // Send current date to caller. Also allows GM-only broadcast.
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

var commands = { // API command list
  // This block available to all players
  '':          function(m){ sendCurrentDate(m.who); },
  show:        function(m){ sendCurrentDate(m.who); },
  year:        function(m){ whisper(m.who, yearHTML()); },
  fullyear:    function(m){ whisper(m.who, yearHTML()); },
  showyear:    function(m){ whisper(m.who, yearHTML()); },
  events:      function(m){ whisper(m.who, eventsListHTML()); },
  listevents:  function(m){ whisper(m.who, eventsListHTML()); },
  help:        function(m){ showHelp(m.who, playerIsGM(m.playerid)); },

  // This block GM-only
  advanceday:  { gm:true, run:function(){ advanceDay(); } },
  retreatday:  { gm:true, run:function(){ retreatDay(); } },
  setdate:     { gm:true, run:function(m,a){ setDate(a[2], a[3], a[4]); } }, // MM DD [YYYY]
  senddate:    { gm:true, run:function(){ sendCurrentDate(); } },
  sendyear:    { gm:true, run:function(){ sendToAll(yearHTML()); } },
  addevent:    { gm:true, run:function(m,a){
                  if (a.length < 5) { whisper(m.who, 'Usage: <code>!cal addevent &lt;month#&gt; &lt;day|start-end&gt; &lt;name...&gt; [hex]</code>'); return; }
                  var maybeColor=a[a.length-1], hasColor=!!sanitizeHexColor(maybeColor);
                  addEvent(a[2], a[3], hasColor?a.slice(4,a.length-1):a.slice(4), hasColor?maybeColor:null);
                }},
  removeevent: { gm:true, run:function(m,a){
                  if (a.length < 3){ whisper(m.who, 'Usage: <code>!cal removeevent &lt;index|name&gt;</code>'); return; }
                  removeEvent(a.slice(2).join(' '));
                }},
  refresh: { gm:true, run:function(){ refreshCalendarState(false); } },
  resetcalendar:{ gm:true, run:function(){ resetToDefaults(); } }
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

on("ready", function(){ // Initialization function
    Calendar.checkInstall();
    refreshCalendarState(true);
    Calendar.register();

    var currentDate = currentDateLabel();

    log('Eberron Calendar Running, current date: ' + currentDate);

    sendChat(script_name,
        '/direct ' +
        '<div style="font-weight:bold;">Eberron Calendar Initialized</div>' +
        '<div>Current date: ' + esc(currentDate) + '</div>' +
        '<div>Use <code>!cal</code> to view the calendar.</div>' +
        '<div>Use <code>!cal help</code> for command details.</div>'
    );
});

return { checkInstall: checkInstall, register: register };
})();