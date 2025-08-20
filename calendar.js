// Eberron Calendar Script
// By Matthew Cherry (github.com/mcherry1/calendar)
// This is written for Roll20's API system.
// Call `!cal` to show the calendar, and use `!cal help` for command details.
// Version: 1.0

var Calendar = (function(){

'use strict';
var script_name = 'Calendar';
var state_name  = 'CALENDAR';
var EVENT_DEFAULT_COLOR = sanitizeHexColor('#ff00f2');

// Default data
var defaults = {
    current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 },
    weekdays: ["Sul","Mol","Zol","Wir","Zor","Far","Sar"],
    months: [
        { name: "Zarantyr",  days: 28, season: "Mid-winter",    color: "#F5F5FA" },
        { name: "Olarune",   days: 28, season: "Late winter",   color: "#FFC68A" },
        { name: "Therendor", days: 28, season: "Early spring",  color: "#D3D3D3" },
        { name: "Eyre",      days: 28, season: "Mid-spring",    color: "#C0C0C0" },
        { name: "Dravago",   days: 28, season: "Late spring",   color: "#E6E6FA" },
        { name: "Nymm",      days: 28, season: "Early summer",  color: "#FFD96B" },
        { name: "Lharvion",  days: 28, season: "Mid-summer",    color: "#F5F5F5" },
        { name: "Barrakas",  days: 28, season: "Late summer",   color: "#DCDCDC" },
        { name: "Rhaan",     days: 28, season: "Early autumn",  color: "#9AC0FF" },
        { name: "Sypheros",  days: 28, season: "Mid-autumn",    color: "#696969" },
        { name: "Aryth",     days: 28, season: "Late autumn",   color: "#FF4500" },
        { name: "Vult",      days: 28, season: "Early winter",  color: "#A9A9A9" }
    ],
    events: [
        { name: "Crystalfall",             month: 2,  day: 9 },
        { name: "The Day of Mourning",     month: 2,  day: 20,  color: "#808080" },
        { name: "Sun's Blessing",          month: 3,  day: 15 },
        { name: "Aureon's Crown",          month: 5,  day: 26 },
        { name: "Brightblade",             month: 6,  day: 12 },
        { name: "The Race of Eight Winds", month: 7,  day: 23 },
        { name: "The Hunt",                month: 8,  day: 4, color: "#355E3B" },
        { name: "Fathen's Fall",           month: 8,  day: 25 },
        { name: "Boldrei's Feast",         month: 9,  day: 9 },
        { name: "The Ascension",           month: 10,  day: 1 },
        { name: "Wildnight",               month: 10,  day: "18-19" },
        { name: "Thronehold",              month: 11, day: 11 },
        { name: "Long Shadows",            month: 12, day: "26-28", color: "#000000" }
    ]
};

// Core state and migration functions

function resetToDefaults(){
    // Nuke this script's entire state namespace
    delete state[state_name];

    // Recreate fresh with a deep clone of defaults under the expected shape
    state[state_name] = { calendar: JSON.parse(JSON.stringify(defaults)) };

    checkInstall();

    sendChat(script_name, '/w gm Calendar state wiped and reset to defaults.');
    announceDay(null, true); // whisper updated calendar to GM
}

function checkInstall(){
    if(!state[state_name]) state[state_name] = {};

    // 1) Ensure calendar exists
    if(!state[state_name].calendar ||
        !Array.isArray(state[state_name].calendar.weekdays) ||
        !Array.isArray(state[state_name].calendar.months)){
            state[state_name].calendar = JSON.parse(JSON.stringify(defaults));
        }

    // 2) Work on the real object
    var cal = state[state_name].calendar;
    if (!cal.current) cal.current = { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 };

    // 3) Ensure events exists & normalize months
    if(!Array.isArray(cal.events)){
        // Fresh install: clone defaults, normalize month + color
        cal.events = JSON.parse(JSON.stringify(defaults.events)).map(function(e){
            var lim = Math.max(1, cal.months.length);
            var m = Math.max(1, Math.min(parseInt(e.month,10)||1, lim));
            e.name  = String(e.name||'');
            e.month = m;
            e.color = sanitizeHexColor(e.color) || null;
            return e;
        });
    } else {
        // Existing state: normalize fields
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
        // Backfill missing colors from defaults (helps migrate old saved state)
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

    // 4) Migrate months to ensure all fields exist (don’t assume 12)
    for (var i = 0; i < cal.months.length; i++){
        var d = defaults.months[i] || {};
        cal.months[i] = cal.months[i] || {};
        if (!cal.months[i].name)   cal.months[i].name   = d.name   || ('Month '+(i+1));
        if (!cal.months[i].days)   cal.months[i].days   = d.days   || 28;
        if (!cal.months[i].season) cal.months[i].season = d.season || '';
        if (!cal.months[i].color)  cal.months[i].color  = d.color  || '#EEE';
    }

        // Keep current date in-bounds if month table changed
        if (cal.current.month >= cal.months.length){
            cal.current.month = Math.max(0, cal.months.length - 1);
        }
        var mdays = cal.months[cal.current.month].days;
        if (cal.current.day_of_the_month > mdays){
            cal.current.day_of_the_month = mdays;
        }
}

// Helper functions without Roll20 interaction

function sanitizeHexColor(s){
    if(!s) return null;
    var hex = String(s).trim().replace(/^#/, '');
    if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
    if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
    return null;
}

function eventColor(e){ return sanitizeHexColor(e.color) || EVENT_DEFAULT_COLOR; }

function headerTextColor(bg){ // Choose text based on background color
    var hex = (bg||'').toString().trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return '#000';
    var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    return ((r*299 + g*587 + b*114)/1000) >= 165 ? '#000' : '#fff';
}

function esc(s){ // Strip HTML special characters
    if (s == null) return '';
    return String(s)
        .replace(/&(?!#?\w+;)/g, '&amp;') // don't re-escape existing entities
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function makeDayMatcher(spec){
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
        // normalize order just in case someone writes "19-18"
        if (a > b) { var t=a; a=b; b=t; }
        return function(d){ return d >= a && d <= b; };
      }
    }
    var n = parseInt(s,10);
    if (isFinite(n)) return function(d){ return d === n; };
  }
  return function(){ return false; };
}

function avgHexColor(cols){
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

function gradientFor(cols){ // Columnar gradient for 2-3 colors
  if (cols.length === 2){ 
    return 'linear-gradient(90deg,'+cols[0]+' 0 50%,'+cols[1]+' 50% 100%)';
  }
  var a=cols[0], b=cols[1], c=cols[2] || cols[1];
  return 'linear-gradient(90deg,'+a+' 0 33.333%,'+b+' 33.333% 66.666%,'+c+' 66.666% 100%)';
}

function daysPerYear(){
  var months = getCal().months, sum = 0;
  for (var i=0;i<months.length;i++) sum += (parseInt(months[i].days,10)||0);
  return sum;
}

function monthPrefixDays(mi){
  var months = getCal().months, sum = 0;
  for (var i=0;i<mi;i++) sum += (parseInt(months[i].days,10)||0);
  return sum;
}

// ---- Color name support (plain text -> hex) ----
var COLOR_NAME_TO_HEX = (function(){
  var m = {
    black:'#000000', white:'#FFFFFF', gray:'#808080', grey:'#808080',
    silver:'#C0C0C0', red:'#FF0000', maroon:'#800000', orange:'#FFA500',
    yellow:'#FFFF00', olive:'#808000', lime:'#00FF00', green:'#008000',
    teal:'#008080', cyan:'#00FFFF', aqua:'#00FFFF', blue:'#0000FF',
    navy:'#000080', purple:'#800080', fuchsia:'#FF00FF', magenta:'#FF00FF',
    pink:'#FFC0CB', brown:'#A52A2A', tan:'#D2B48C', coral:'#FF7F50',
    gold:'#FFD700', indigo:'#4B0082', violet:'#EE82EE', turquoise:'#40E0D0',
    salmon:'#FA8072', chocolate:'#D2691E', crimson:'#DC143C', lavender:'#E6E6FA',
    khaki:'#F0E68C', sienna:'#A0522D', slategray:'#708090', dimgray:'#696969',
    darkgreen:'#006400', darkred:'#8B0000', darkblue:'#00008B', darkorange:'#FF8C00',
    forestgreen:'#228B22', royalblue:'#4169E1', dodgerblue:'#1E90FF'
  };
  return Object.keys(m).reduce(function(out,k){ out[k.toLowerCase()] = sanitizeHexColor(m[k]); return out; },{});
})();

function normalizeColor(spec){
  if(!spec) return null;
  var s = String(spec).trim();
  var hex = sanitizeHexColor(s);
  if (hex) return hex;
  var key = s.toLowerCase();
  if (COLOR_NAME_TO_HEX.hasOwnProperty(key)) return COLOR_NAME_TO_HEX[key];
  return null; // unknown names fall back to default coloring at render time
}

function toSerial(y, mi, d){ // Serial day index from epoch (year 0, month 0, day 1 => 0). Works with negative years too.
  return (y * daysPerYear()) + monthPrefixDays(mi) + ((parseInt(d,10)||1) - 1);
}

function weekdayFor(mi, d){
  // Weekday for (current.year, month=mi, day=d), using your existing serial math
  var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length;
  var delta = toSerial(cur.year, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
  return ( (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen );
}

function firstNumFromDaySpec(daySpec){
  // "18" -> 18, "18-19" -> 18, otherwise 1
  if (typeof daySpec === 'number') return daySpec|0;
  var s = String(daySpec||'').trim();
  var m = s.match(/^\s*(\d+)/);
  return m ? Math.max(1, parseInt(m[1],10)) : 1;
}

// Style builders

var TD_BASE = 'border:1px solid #444;width:2em;height:2em;text-align:center;';

function applyTodayStyle(style){
  style += 'position:relative;z-index:10;';
//  style += 'top:-2px;left:-2px;'; // shifts up-left for a "raised key" look
  style += 'border-radius:4px;'; // rounded corners
  style += 'transform:scale(1.10);transform-origin:center;';
  style += 'box-shadow: '
            + '0 3px 8px rgba(0,0,0,0.55), ' // near hard shadow
            + '0 12px 24px rgba(0,0,0,.35), ' // fading to soft shadow
            + 'inset 0 1px 0 rgba(255,255,255,.18);'; // inside edge highlight
  style += 'outline: 2px solid rgba(0,0,0,0.25);'; // pre-existing outline part of grid, not cell
  style += 'outline-offset:1px;';
  style += 'box-sizing:border-box;overflow:visible;'; // ensure no clipping errors, overflow neighboring cells
  style += 'font-weight:bold;';
  return style;
}

function buildEventDots(events){ // For calendar dates with more than 3 events
  if(!events || events.length<=3) return '';
  var max=4, shown=Math.min(max, events.length);
  var html=['<div style="margin-top:1px;text-align:center;line-height:0;">'];
  for (var i=0;i<shown;i++){
    var col = eventColor(events[i]);
    html.push('<span style="display:inline-block;width:6px;height:6px;margin:0 1px;border:1px solid #000;background:'+esc(col)+';"></span>');
  }
  if (events.length>max){
    html.push('<span style="display:inline-block;font-size:10px;vertical-align:top;">+'+(events.length-max)+'</span>');
  }
  html.push('</div>');
  return html.join('');
}

// State accessor

function getCal(){ return state[state_name].calendar; }

// Core calendar functions

function getEventsFor(monthIndex, day){
  var m = monthIndex|0, out=[];
  var events = getCal().events;
  for (var i=0;i<events.length;i++){
    var e=events[i];
    if (((parseInt(e.month,10)||1)-1) !== m) continue;
    if (makeDayMatcher(e.day)(day)) out.push(e);
  }
  return out;
}

function advanceDay(){
    var cal=getCal(), cur=cal.current;
    cur.day_of_the_month++;
    
    if(cur.day_of_the_month > cal.months[cur.month].days){
        cur.day_of_the_month = 1;
        cur.month = (cur.month + 1) % cal.months.length;
        if(cur.month===0) cur.year++;
    }
    
    cur.day_of_the_week = (cur.day_of_the_week + 1) % cal.weekdays.length;
    
    announceDay(null,true); // /w gm
}

function retreatDay(){
    var cal=getCal(), cur=cal.current;
    cur.day_of_the_month--;

    if(cur.day_of_the_month < 1){
        cur.month = (cur.month + cal.months.length - 1) % cal.months.length;
        if (cur.month === cal.months.length - 1){
            cur.year = cur.year - 1; // allow negative years
        }
        cur.day_of_the_month = cal.months[cur.month].days;
    }

    cur.day_of_the_week = (cur.day_of_the_week + cal.weekdays.length - 1) % cal.weekdays.length;
    
    announceDay(null,true); // /w gm
}

function setDate(d,m,y){
    var cal=getCal(), cur=cal.current;
    var oldDOW = cur.day_of_the_week;
    var oldY = cur.year, oldM = cur.month, oldD = cur.day_of_the_month;

    var mi = Math.max(0, Math.min((parseInt(m,10) || 1) - 1, cal.months.length-1));
    var di = Math.max(1, Math.min(parseInt(d,10) || 1, cal.months[mi].days));
    var yi = parseInt(y,10);

    var newY = isFinite(yi) ? yi : cur.year;
    var delta = toSerial(newY, mi, di) - toSerial(oldY, oldM, oldD);

    cur.month = mi;
    cur.day_of_the_month = di;
    if (isFinite(yi)) cur.year = yi;

    cur.day_of_the_week = (oldDOW + ((delta % cal.weekdays.length) + cal.weekdays.length)) % cal.weekdays.length;

  announceDay(null,true); // /w gm
}

function addEvent(monthToken, dayToken, nameTokens, colorToken){
  var cal = getCal();

  // --- Parse & validate month ---
  var m = Math.max(1, Math.min(parseInt(monthToken,10)||1, cal.months.length));

  // --- Parse & validate day or range ---
  // Accept "18", "18-19", etc. Keep the original string if valid-ish; your renderer supports ranges.
  var daySpec = String(dayToken||'').trim();
  var dayOk = false;
  if (/^\d+$/.test(daySpec)) {
    var d = parseInt(daySpec,10);
    // clamp inside month bounds just to be friendly
    d = Math.max(1, Math.min(d, cal.months[m-1].days));
    daySpec = String(d);
    dayOk = true;
  } else if (/^\d+\s*-\s*\d+$/.test(daySpec)) {
    // normalize x - y order
    var parts = daySpec.split('-').map(function(x){ return parseInt(x,10); });
    var a = Math.max(1, Math.min(parts[0], parts[1]));
    var b = Math.min(Math.max(parts[0], parts[1]), cal.months[m-1].days);
    if (a <= b){ daySpec = a + '-' + b; dayOk = true; }
  }
  if (!dayOk){
    sendChat(script_name, '/w gm Couldn’t understand the day "'+esc(dayToken)+'". Use a number (e.g. 12) or range (e.g. 18-19).');
    return;
  }

  // --- Parse name & color ---
  var name = String((nameTokens||[]).join(' ')).trim() || 'Untitled Event';
  var color = normalizeColor(colorToken);

  // --- Push into state & confirm ---
  cal.events.push({
    name: name,
    month: m,
    day: daySpec,
    color: color // may be null; renderer will use EVENT_DEFAULT_COLOR
  });

  var colPreview = color || EVENT_DEFAULT_COLOR;
  var swatch = '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(colPreview)+';"></span>';
  sendChat(script_name, '/w gm Added event: '+swatch+esc(name)+' on '+esc(cal.months[m-1].name)+' '+esc(daySpec)+ (color ? ' ('+esc(color)+')' : ''));
  announceDay(null, true); // refresh whisper to GM
}

function removeEvent(query){
  var cal = getCal();
  var events = cal.events;

  if (!events.length){
    sendChat(script_name, '/w gm No events to remove.');
    return;
  }

  // --- If numeric, treat as 1-based index ---
  var idx = parseInt(query, 10);
  if (isFinite(idx) && idx >= 1 && idx <= events.length){
    var removed = events.splice(idx-1, 1)[0];
    sendChat(script_name, '/w gm Removed event #'+idx+': '+esc(removed.name));
    announceDay(null,true);
    return;
  }

  // --- Otherwise, try name match (case-insensitive contains) ---
  var q = String(query||'').trim().toLowerCase();
  var matches = events.filter(function(e){ return e.name.toLowerCase().indexOf(q) !== -1; });

  if (matches.length === 0){
    sendChat(script_name, '/w gm No events matched "'+esc(query)+'".');
    return;
  } else if (matches.length > 1){
    // Show options
    var list = matches.map(function(e,i){
      var idx = events.indexOf(e)+1;
      return '#'+idx+' '+esc(e.name)+' ('+esc(getCal().months[e.month-1].name)+' '+esc(e.day)+')';
    }).join('<br>');
    sendChat(script_name, '/w gm Multiple matches for "'+esc(query)+'":<br>'+list+'<br>Use the index to remove exactly.');
    return;
  }

  // Single match → remove
  var e = matches[0];
  var pos = events.indexOf(e);
  events.splice(pos,1);
  sendChat(script_name, '/w gm Removed event: '+esc(e.name)+' ('+esc(getCal().months[e.month-1].name)+' '+esc(e.day)+')');
  announceDay(null,true);
}

// Rendering and output functions

function buildMiniCal(){
    var cal = getCal(), cur = cal.current;
    var wd = cal.weekdays;
    var first = ((cur.day_of_the_week - (cur.day_of_the_month - 1)) % wd.length + wd.length) % wd.length;
    var mObj = cal.months[cur.month];
    var md = mObj.days;
    var monthColor = mObj.color || '#eee';

    var textColor = headerTextColor(monthColor);
    var outline = (textColor === '#fff')
        ? 'text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000;'
        : '';

    var html = ['<table style="border-collapse:collapse;margin-bottom:0px;">'];

    // Month & Year Header: month left, year right; full-width colored bar with auto-contrast text
    html.push(
        '<tr><th colspan="7" style="border:1px solid #444;padding:0;">' +
            '<div style="padding:6px;background-color:'+monthColor+';color:'+textColor+';text-align:left;'+outline+'">' +
                esc(mObj.name) +
                '<span style="float:right;">'+esc(String(cur.year))+' YK</span>' +
            '</div>' +
        '</th></tr>'
    );

    // Weekday header
    html.push(
        '<tr>' + wd.map(function(d){
            return '<th style="border:1px solid #444;padding:2px;width:2em;text-align:center;">'+esc(d)+'</th>';
        }).join('') + '</tr>'
    );

    var day=1;
    for(var r=0;r<6;r++){
        html.push('<tr>');
        for(var c=0;c<7;c++){
            if((r===0 && c<first) || day>md){
                html.push('<td style="border:1px solid #444;"></td>');
            } else {
                var today = day === cur.day_of_the_month;
                var todays = getEventsFor(cur.month, day);
                var evObj = todays[0] || null; // still use first event as a fallback
                var tdStyle = TD_BASE + (today ? 'position:relative;overflow:visible;padding:0;' : 'padding:0;');
                var inner   = 'display:block;width:100%;height:100%;box-sizing:border-box;text-align:center;';
                var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';

                if (todays.length >= 2){ // striped background for 2-3 events
                    var cols = todays.slice(0,3).map(eventColor);
                    var avg  = avgHexColor(cols);
                      inner += 'background:'+gradientFor(cols)+';color:'+headerTextColor(avg)+';';
                } else if (evObj){
                  var bg = eventColor(evObj), txt = headerTextColor(bg);
                  inner += 'background:'+bg+';color:'+txt+';';
                } else if (today){
                    // "today" with no events uses month header color
                  var bg = monthColor, txt = headerTextColor(bg);
                  inner += 'background:'+bg+';color:'+txt+';';
                }
            
                if (today){ inner = applyTodayStyle(inner); }

                var dotsHtml = buildEventDots(todays); // Add dots for >3 events
                
                html.push('<td'+titleAttr+' style="'+tdStyle+'"><div style="'+inner+'"><div>'+day+'</div>'+dotsHtml+'</div></td>');

                day++;
            }
        }
        html.push('</tr>');
        if(day>md) break;
    }
    html.push('</table>');
    return html.join('');
}

function buildMiniCalFor(monthIndex){
  var cal = getCal(), cur = cal.current;
  var wd = cal.weekdays;
  var mObj = cal.months[monthIndex];
  var md = mObj.days;
  var monthColor = mObj.color || '#eee';

  var textColor = headerTextColor(monthColor);
  var outline = (textColor === '#fff')
      ? 'text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000;'
      : '';

  var first = weekdayFor(monthIndex, 1);
  var html = ['<table style="border-collapse:collapse;margin:4px;">'];

  // Header
  html.push(
    '<tr><th colspan="7" style="border:1px solid #444;padding:0;">' +
      '<div style="padding:6px;background-color:'+monthColor+';color:'+textColor+';text-align:left;'+outline+'">' +
        esc(mObj.name) +
        '<span style="float:right;">'+esc(String(cur.year))+' YK</span>' +
      '</div>' +
    '</th></tr>'
  );

  // Weekday header
  html.push(
    '<tr>' + wd.map(function(d){
      return '<th style="border:1px solid #444;padding:2px;width:2em;text-align:center;">'+esc(d)+'</th>';
    }).join('') + '</tr>'
  );

  var day=1;
  for (var r=0; r<6; r++){
    html.push('<tr>');
    for (var c=0; c<7; c++){
      if ((r===0 && c<first) || day>md){
        html.push('<td style="border:1px solid #444;"></td>');
      } else {
        var isToday = (monthIndex === cur.month) && (day === cur.day_of_the_month);
        var todays  = getEventsFor(monthIndex, day);
        var evObj   = todays[0] || null;

        // TD = container; inner = the colored block we style/scale/shadow
        var tdStyle = TD_BASE + 'position:relative;overflow:visible;padding:0;';
        var inner   = 'position:relative;display:flex;align-items:center;justify-content:center;' +
                      'width:100%;height:100%;box-sizing:border-box;text-align:center;';

        var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';

        // Background + text color on the inner block
        if (todays.length >= 2){
          var cols = todays.slice(0,3).map(eventColor);
          var avg  = avgHexColor(cols);
          inner += 'background:'+gradientFor(cols)+';color:'+headerTextColor(avg)+';';
        } else if (evObj){
          var bg = eventColor(evObj), txt = headerTextColor(bg);
          inner += 'background:'+bg+';color:'+txt+';';
        } else if (isToday){
          var bg2 = monthColor, txt2 = headerTextColor(bg2);
          inner += 'background:'+bg2+';color:'+txt2+';';
        }

        if (isToday){ inner = applyTodayStyle(inner); }

        // The number stays centered by flex
        var numHtml = '<div>'+day+'</div>';

        // Dots: only show when >3 events, pinned to the bottom so they don’t shift the number
        var dotsHtml = '';
        if (todays && todays.length > 3){
          var max=4, shown=Math.min(max, todays.length);
          var dots = [];
          for (var i=0;i<shown;i++){
            var col = eventColor(todays[i]);
            dots.push('<span style="display:inline-block;width:6px;height:6px;margin:0 1px;border:1px solid #000;background:'+esc(col)+';"></span>');
          }
          if (todays.length>max){
            dots.push('<span style="display:inline-block;font-size:10px;vertical-align:top;">+'+(todays.length-max)+'</span>');
          }
          dotsHtml = '<div style="position:absolute;bottom:1px;left:0;right:0;text-align:center;line-height:0;">'
                   + dots.join('') + '</div>';
        }

        html.push('<td'+titleAttr+' style="'+tdStyle+'"><div style="'+inner+'">'+numHtml+dotsHtml+'</div></td>');
        day++;
      }
    }
    html.push('</tr>');
    if (day>md) break;
  }
  html.push('</table>');
  return html.join('');
}

function buildAllMiniCals(){
  var cal = getCal(), months = cal.months;
  var cols = 1; // will display in however many rows are required. this parameter is here for future adjustment.
  var html = ['<table style="border-collapse:collapse;"><tbody>'];
  for (var i=0;i<months.length;i++){
    if (i % cols === 0) html.push('<tr>');
    html.push('<td style="vertical-align:top;">'+buildMiniCalFor(i)+'</td>');
    if (i % cols === cols-1) html.push('</tr>');
  }
  if (months.length % cols !== 0) html.push('</tr>');
  html.push('</tbody></table>');
  return html.join('');
}

function buildAllEventsList(){
  var cal = getCal(), cur = cal.current;
  var items = cal.events.slice().map(function(e){
    var mi = Math.max(1, Math.min(parseInt(e.month,10)||1, cal.months.length)) - 1;
    var d0 = firstNumFromDaySpec(e.day);
    return {
      e: e,
      mi: mi,
      d0: d0,
      serial: toSerial(cur.year, mi, d0)
    };
  });

  items.sort(function(a,b){
    if (a.mi !== b.mi) return a.mi - b.mi;
    return a.d0 - b.d0;
  });

  var out = ['<div style="margin:4px 0;"><b>All Events (Year '+esc(String(cur.year))+' YK)</b></div>'];

  items.forEach(function(it){
    var e = it.e;
    var mName = esc(cal.months[it.mi].name);
    var dayLabel = esc(String(e.day));
    var isToday = (it.mi === cur.month) && makeDayMatcher(e.day)(cur.day_of_the_month);
    var col = sanitizeHexColor(e.color) || EVENT_DEFAULT_COLOR;
    var swatch = '<span'
      + ' style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';"'
      + ' title="Hex: '+esc(col)+'"></span>';

    out.push('<div'+(isToday?' style="font-weight:bold;margin:2px 0;"':' style="margin:2px 0;"')+'>'
      + swatch + mName + ' ' + dayLabel + ': ' + esc(e.name)
      + '</div>');
  });

  if (items.length === 0){
    out.push('<div style="opacity:.7;">No events defined.</div>');
  }

  return out.join('');
}

function announceDay(to, gmOnly){
    var cal=getCal(), c=cal.current;
    var m=cal.months[c.month], wd=cal.weekdays[c.day_of_the_week];
    var mName = esc(m.name);
    var mSeason = esc(m.season);

    var wdName = esc(wd);
    var publicMsg = [
        buildMiniCal(),
        '<div style="font-weight:bold;margin:2px 0;">'+wdName+', '+mName+' '+c.day_of_the_month+', '+esc(String(c.year))+'</div>'
    ];

    // List events for the current month; bold only the one that matches today's date (if any)
    cal.events
        .filter(function(e){ return (parseInt(e.month,10)||1) - 1 === c.month; })
        .forEach(function(e){
            var dayLabel   =    esc(String(e.day));
            var todayMatch =    ((parseInt(e.month,10)||1)-1) === c.month
                                && makeDayMatcher(e.day)(c.day_of_the_month);

            // event color swatch
            var col    = sanitizeHexColor(e.color) || EVENT_DEFAULT_COLOR;
            var swatch = '<span'
                                + ' style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';"'
                                + ' title="Hex: '+esc(col)+'">'
                                + ' </span>';

                publicMsg.push(
                '<div' + (todayMatch ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"') + '>' +
                swatch + mName + ' ' + dayLabel + ': ' + esc(e.name) +
                '</div>'
            );
        });

    publicMsg.push('<div style="margin-top:8px;"></div>');
    publicMsg.push('<div>Season: '+mSeason+'</div>');

    // Deliver
    if (gmOnly){
        sendChat(script_name, '/w gm ' + publicMsg.join(''));
    } else if (to){
        whisper(to, publicMsg.join(''));
    } else {
        sendChat(script_name, '/direct ' + publicMsg.join(''));
    }

    // GM controls
    var gmButtons = [
        '[📤 Send Date](!cal senddate)',
        '[⏭ Advance Day](!cal advanceday)',
        '[⏮ Retreat Day](!cal retreatday)',
        '[❓ Help](!cal help)'
    ].map(function(b){ return '<div style="margin:2px 0;">'+b+'</div>'; }).join('');

    sendChat(script_name, '/w gm ' + gmButtons);
}

function showHelp(to){
    var help = [
        '<div style="margin:4px 0;"><b>Calendar Commands</b></div>',
        '<div>• <code>!cal</code> or <code>!cal show</code> — show the calendar (whispered to you)</div>',
        '<div>• <code>!cal senddate</code> — broadcast the calendar to everyone <i>(GM-only)</i></div>',
        '<div>• <code>!cal year</code> (or <code>!cal fullyear</code> / <code>!cal showyear</code>) — show mini-calendars for all months (whispered to you)</div>',
        '<div>• <code>!cal sendyear</code> — broadcast all mini-calendars to everyone <i>(GM-only)</i></div>',
        '<div>• <code>!cal advanceday</code> — advance one day <i>(GM-only)</i></div>',
        '<div>• <code>!cal retreatday</code> — go back one day <i>(GM-only)</i></div>',
        '<div>• <code>!cal setdate &lt;dd&gt; &lt;mm&gt; [yyyy]</code> — set date, day-first; year optional; leading zeros optional <i>(GM-only)</i></div>',
        '<div>• <code>!cal addevent &lt;month#&gt; &lt;day|start-end&gt; &lt;name...&gt; [color]</code> — add a custom event (color as hex or name)</div>',
        '<div>• <code>!cal events</code> — list all events in chronological order (whispered to you)</div>',
        '<div>• <code>!cal removeevent &lt;index|name&gt;</code> — remove an event by list index or name fragment</div>',
        '<div>• <code>!cal resetcalendar</code> — nuke the script back to hard-coded defaults (yes, really) <i>(GM-only)</i></div>',
        '<div>• <code>!cal help</code> — show this help</div>'
    ].join('');

    if (to){
        whisper(to, help);
    } else {
        sendChat(script_name, help);
    }
}

// Roll20-specific bits

function whisper(to, html){ // Avoid html problems with quotes/brackets in character names
    var name = String(to || '').replace(/\s+\(GM\)$/,'').trim();
    name = name.replace(/"/g, '');                                  // strip quotes
    name = name.replace(/\[/g, '(').replace(/\]/g, ')');            // avoid brackets
    name = name.replace(/[|\\]/g,'-');                              // avoid pipes and backslashes
    sendChat(script_name, '/w "'+ name +'" ' + html);
}

function handleInput(msg){
    if(msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
    checkInstall(); // ensure calendar is initialized
    var args = msg.content.trim().split(/\s+/);
    var sub = (args[1]||'').toLowerCase();

    // Player & GM
    if(sub === '' || sub === 'show'){
        // whisper current month's calendar to the caller
        announceDay(msg.who);
        return;
    } else if (sub === 'year' || sub === 'fullyear' || sub === 'showyear'){
        // whisper annual calendar to the caller
        whisper(msg.who, buildAllMiniCals());
        return;
    } else if (sub === 'events' || sub === 'listevents'){
        // whisper full chronological event list to the caller
        whisper(msg.who, buildAllEventsList());
        return;
    }

    // GM only
    if(!playerIsGM(msg.playerid)){
        var who = (msg.who || '').replace(/\s+\(GM\)$/,'');
        whisper(who, 'Only the GM can use that calendar command.');
        return;
    }

    if (sub === 'sendyear'){
        sendChat(script_name, '/direct ' + buildAllMiniCals());
    } else if(sub === 'advanceday'){
        advanceDay();                       // whispers to GM (via announceDay(null,true))
    } else if(sub === 'retreatday'){
        retreatDay();                       // whispers to GM
    } else if(sub === 'setdate'){
        setDate(args[2], args[3], args[4]); // whispers to GM
    } else if(sub === 'senddate'){
        announceDay();                      // broadcast to all
    } else if (sub === 'addevent'){
        // Syntax: !cal addevent <month#> <day|start-end> <name...> [color]
        // Examples:
        //   !cal addevent 11 18-19 Wildnight black
        //   !cal addevent 8 4 "The Hunt" #355E3B
        //   !cal addevent 7 23 The Race of Eight Winds royalblue
        if (args.length < 5){
        whisper(msg.who, 'Usage: <code>!cal addevent &lt;month#&gt; &lt;day|start-end&gt; &lt;name...&gt; [color]</code>');
        return;
        }
        var monthTok = args[2];
        var dayTok   = args[3];

        // detect optional color at the end if it looks like a hex or known color name
        var maybeColor = args[args.length-1];
        var hasColor = !!normalizeColor(maybeColor);
        var nameTokens = hasColor ? args.slice(4, args.length-1) : args.slice(4);

        addEvent(monthTok, dayTok, nameTokens, hasColor ? maybeColor : null);
    } else if (sub === 'removeevent'){
        if (args.length < 3){
        whisper(msg.who, 'Usage: <code>!cal removeevent &lt;index|name&gt;</code>');
        return;
        }
        var query = args.slice(2).join(' ');
        removeEvent(query);
    } else if(sub === 'help'){
        showHelp(msg.who);                  // whisper help to the GM who asked
    } else if (sub === 'resetcalendar'){
        resetToDefaults();                  // nuke calendar to defaults
    } else {
        announceDay(msg.who);               // fallback: whisper to caller
    }
}

function register(){ on('chat:message', handleInput); }

on("ready", function(){
    Calendar.checkInstall();
    Calendar.register();

    var cal = state[state_name].calendar;
    var cur = cal.current;
    var currentDate =
        cal.weekdays[cur.day_of_the_week] + ", " +
        cur.day_of_the_month + " " +
        cal.months[cur.month].name + ", " +
        cur.year + " YK";

    log('Eberron Calendar Running, current date: ' + currentDate);

    //Whisper initialization to GM
    sendChat(script_name,
        '/w gm ' +
        '<div style="font-weight:bold;">Eberron Calendar Initialized</div>' +
        '<div>Current date: ' + esc(currentDate) + '</div>'
    );

    // Whisper instructions to table
    sendChat(script_name,
        '/direct ' +
        '<div>Use <code>!cal</code> to view the calendar.</div>' +
        '<div>Use <code>!cal help</code> for command details.</div>'
    );
});

return { checkInstall: checkInstall, register: register };
})();
