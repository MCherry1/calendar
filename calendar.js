// Eberron Calendar Script
// By Matthew Cherry (github.com/mcherry1/calendar)
// This is written for Roll20's API system.
// Call `!cal` to show the calendar, and use `!cal help` for command details.
// Version: 1.2
// Future versions will add event colors, fuller event list, and clean some code.

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

function resetToDefaults(){
    delete state[state_name];
    state[state_name] = { calendar: JSON.parse(JSON.stringify(defaults)) };
    checkInstall();
    sendChat(script_name, '/w gm Calendar state wiped and reset to defaults.');
    sendCurrentDate(null, true);
}

function checkInstall(){
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

// Helper functions

function sanitizeHexColor(s){
    if(!s) return null;
    var hex = String(s).trim().replace(/^#/, '');
    if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
    if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
    return null;
}

function getEventColor(e){ return sanitizeHexColor(e.color) || EVENT_DEFAULT_COLOR; }

function headerTextColor(bg){
    var hex = (bg||'').toString().trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return '#000';
    var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    return ((r*299 + g*587 + b*114)/1000) >= 165 ? '#000' : '#fff';
}

function esc(s){
    if (s == null) return '';
    return String(s)
        .replace(/&(?!#?\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function clamp(n, min, max){
  n = parseInt(n,10);
  if (!isFinite(n)) n = min;
  return n < min ? min : (n > max ? max : n);
}
function int(v, fallback){
  var n = parseInt(v,10);
  return isFinite(n) ? n : fallback;
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
        if (a > b) { var t=a; a=b; b=t; }
        return function(d){ return d >= a && d <= b; };
      }
    }
    var n = parseInt(s,10);
    if (isFinite(n)) return function(d){ return d === n; };
  }
  return function(){ return false; };
}

function _avgHexColor(cols){
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

function _gradientFor(cols){
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

function toSerial(y, mi, d){
  return (y * daysPerYear()) + monthPrefixDays(mi) + ((parseInt(d,10)||1) - 1);
}

function weekdayIndexFor(mi, d){
  var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length;
  var delta = toSerial(cur.year, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
  return ( (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen );
}

function firstNumFromDaySpec(daySpec){
  if (typeof daySpec === 'number') return daySpec|0;
  var s = String(daySpec||'').trim();
  var m = s.match(/^\s*(\d+)/);
  return m ? Math.max(1, parseInt(m[1],10)) : 1;
}

function normalizeDaySpec(spec, maxDays){
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

var TD_BASE = 'border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;';

function _applyTodayStyle(style){
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

function buildEventDots(events){
  if(!events || events.length<=3) return '';
  var max=4, shown=Math.min(max, events.length);
  var html=['<div style="margin-top:1px;text-align:center;line-height:0;">'];
  for (var i=0;i<shown;i++){
    var col = getEventColor(events[i]);
    html.push('<span style="display:inline-block;width:6px;height:6px;margin:0 1px;border:1px solid #000;background:'+esc(col)+';"></span>');
  }
  if (events.length>max){
    html.push('<span style="display:inline-block;font-size:10px;vertical-align:top;">+'+(events.length-max)+'</span>');
  }
  html.push('</div>');
  return html.join('');
}

function swatchHtml(hex){
  var col = sanitizeHexColor(hex) || EVENT_DEFAULT_COLOR;
  return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';" title="'+esc(col)+'"></span>';
}

// State accessor
function getCal(){ return state[state_name].calendar; }

// Core calendar functions

function advanceDay(){
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

function retreatDay(){
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
  var cal=getCal(), cur=cal.current;
  var oldDOW = cur.day_of_the_week, oldY = cur.year, oldM = cur.month, oldD = cur.day_of_the_month;

  var mi = clamp(m, 1, cal.months.length) - 1;
  var di = clamp(d, 1, cal.months[mi].days);
  var yi = int(y, cur.year);

  var delta = toSerial(yi, mi, di) - toSerial(oldY, oldM, oldD);

  cur.month = mi;
  cur.day_of_the_month = di;
  cur.year = yi;

  var wdlen = cal.weekdays.length;
  cur.day_of_the_week = (oldDOW + ((delta % wdlen) + wdlen)) % wdlen;

  sendCurrentDate(null,true);
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

  cal.events.sort(function(a,b){
    var am = (parseInt(a.month,10)||1), bm = (parseInt(b.month,10)||1);
    if (am !== bm) return am - bm;
    return firstNumFromDaySpec(a.day) - firstNumFromDaySpec(b.day);
  });

  var swatch = swatchHtml(color);
  sendChat(script_name, '/w gm Added event: '+swatch+esc(name)+' on '+esc(cal.months[m-1].name)+' '+esc(daySpec)+ (color ? ' ('+esc(color)+')' : ''));
  sendCurrentDate(null, true);
}

function removeEvent(query){
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
  sendChat(script_name, '/w gm Removed event: '+esc(e.name)+' ('+esc(getCal().months[e.month-1].name)+' '+esc(e.day)+')');
  sendCurrentDate(null,true);
}

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
    '<div>• <code>!cal senddate</code> — broadcast current month & date to everyone</div>',
    '<div>• <code>!cal sendyear</code> — broadcast full year of mini-calendars to everyone</div>',
    '<div>• <code>!cal advanceday</code> — advance one day</div>',
    '<div>• <code>!cal retreatday</code> — go back one day</div>',
    '<div>• <code>!cal setdate &lt;mm&gt; &lt;dd&gt; [yyyy]</code> — set date (m d y)</div>',
    '<div>• <code>!cal addevent &lt;month#&gt; &lt;day|start-end&gt; &lt;name...&gt; [#hex]</code> — add a custom event</div>',
    '<div>• <code>!cal removeevent &lt;index|name&gt;</code> — remove an event</div>',
    '<div>• <code>!cal resetcalendar</code> — reset to defaults. this is an actual nuke of all custom events and current date</div>'
  ];

  return common.concat(gm).join('');
}

function renderMiniCal(mi){ // Builds mini-calendar for a single month, highlighting current day and events
  var cal = getCal(), cur = cal.current;
  var wd = cal.weekdays, mObj = cal.months[mi], md = mObj.days;
  var monthColor = mObj.color || '#eee';

  var textColor = headerTextColor(monthColor);
  var outline = (textColor === '#fff')
      ? 'text-shadow:-0.5px -0.5px 0 #000,0.5px -0.5px 0 #000,-0.5px 0.5px 0 #000,0.5px 0.5px 0 #000;'
      : '';

  var first = weekdayIndexFor(mi, 1);

  var html = ['<table style="border-collapse:collapse;margin:4px;">'];

  html.push(
    '<tr><th colspan="7" style="border:1px solid #444;padding:0;">' +
      '<div style="padding:6px;background-color:'+monthColor+';color:'+textColor+';text-align:left;'+outline+'">' +
        esc(mObj.name) +
        '<span style="float:right;">'+esc(String(cur.year))+' YK</span>' +
      '</div>' +
    '</th></tr>'
  );

  html.push(
    '<tr>' + wd.map(function(d){
      return '<th style="border:1px solid #444;padding:2px;width:2em;text-align:center;">'+esc(d)+'</th>';
    }).join('') + '</tr>'
  );

  var day=1;
  for (var r=0;r<6;r++){
    html.push('<tr>');
    for (var c=0;c<7;c++){
      if ((r===0 && c<first) || day>md){
        html.push('<td style="border:1px solid #444;"></td>');
      } else {
        var isToday = (mi === cur.month) && (day === cur.day_of_the_month);
        var todays = getEventsFor(mi, day);
        var evObj = todays[0] || null;
        var style = TD_BASE;
        var cellTextColor, cellBg;
        var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';

        if (todays.length >= 2){
          var cols = todays.slice(0,3).map(getEventColor);
          var avg  = _avgHexColor(cols);
          style += 'background:'+_gradientFor(cols)+';';
          cellTextColor = headerTextColor(avg);
          style += 'color:'+cellTextColor+';';
          if (isToday){ style = _applyTodayStyle(style); }
        } else if (evObj){
          cellBg = getEventColor(evObj);
          cellTextColor = headerTextColor(cellBg);
          style += 'background:'+cellBg+';color:'+cellTextColor+';';
          if (isToday){ style = _applyTodayStyle(style); }
        } else if (isToday){
          cellBg = monthColor;
          cellTextColor = headerTextColor(cellBg);
          style += 'background:'+cellBg+';color:'+cellTextColor+';';
          style = _applyTodayStyle(style);
        }

        var dotsHtml = buildEventDots(todays);
        html.push('<td'+titleAttr+' style="'+style+'"><div>'+day+'</div>'+dotsHtml+'</td>');
        day++;
      }
    }
    html.push('</tr>');
    if (day>md) break;
  }
  html.push('</table>');
  return html.join('');
}

function currentMonthHTML(){ return renderMiniCal(getCal().current.month); }
function renderMonthHTML(monthIndex){ return renderMiniCal(monthIndex); }

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

function sendCurrentDate(to, gmOnly){ // Send current date to player who calls or to all (GM only)
    var cal=getCal(), c=cal.current;
    var m=cal.months[c.month], wd=cal.weekdays[c.day_of_the_week];
    var mName = esc(m.name);
    var mSeason = esc(m.season);

    var wdName = esc(wd);
    var publicMsg = [
        currentMonthHTML(),
        '<div style="font-weight:bold;margin:2px 0;">'+wdName+', '+mName+' '+c.day_of_the_month+', '+esc(String(c.year))+'</div>'
    ];

    cal.events
        .filter(function(e){ return (parseInt(e.month,10)||1) - 1 === c.month; })
        .forEach(function(e){
            var dayLabel = esc(String(e.day));
            var todayMatch = ((parseInt(e.month,10)||1)-1) === c.month
                             && makeDayMatcher(e.day)(c.day_of_the_month);
            var swatch = swatchHtml(e.color);
            publicMsg.push(
              '<div' + (todayMatch ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"') + '>' +
              swatch + mName + ' ' + dayLabel + ': ' + esc(e.name) +
              '</div>'
            );
        });

    publicMsg.push('<div style="margin-top:8px;"></div>');
    publicMsg.push('<div>Season: '+mSeason+'</div>');

    if (gmOnly){
        sendChat(script_name, '/w gm ' + publicMsg.join(''));
    } else if (to){
        whisper(to, publicMsg.join(''));
    } else {
        sendChat(script_name, '/direct ' + publicMsg.join(''));
    }

    var gmButtons = [
        '[📤 Send Date](!cal senddate)',
        '[⏭ Advance Day](!cal advanceday)',
        '[⏮ Retreat Day](!cal retreatday)',
        '[❓ Help](!cal help)'
    ].map(function(b){ return '<div style="margin:2px 0;">'+b+'</div>'; }).join('');

    sendChat(script_name, '/w gm ' + gmButtons);
}

function showHelp(to, isGM){ // Show help. Truncated list if not GM
  var help = buildHelpHtml(!!isGM);
  if (to){
    whisper(to, help);
  } else {
    sendChat(script_name, help);
  }
}

// Roll20-specific bits

function whisper(to, html){
  var name = String(to || '').replace(/\s+\(GM\)$/,'').trim();
  name = name.replace(/"/g,'').replace(/\[/g,'(').replace(/\]/g,')')
             .replace(/[|\\]/g,'-').replace(/[<>]/g,'-');
  sendChat(script_name, '/w "'+ name +'" ' + html);
}

function handleInput(msg){
  if(msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/);
  var sub  = (args[1]||'').toLowerCase();
  var isGM = playerIsGM(msg.playerid);

  // Everyone
  if (sub === '' || sub === 'show'){
    sendCurrentDate(msg.who); return;
  }
  if (sub === 'year' || sub === 'fullyear' || sub === 'showyear'){
    whisper(msg.who, yearHTML()); return;
  }
  if (sub === 'events' || sub === 'listevents'){
    whisper(msg.who, eventsListHTML()); return;
  }
  if (sub === 'help'){
    showHelp(msg.who, isGM); return;
  }

  // GM-only
  if (!isGM){
    var who = (msg.who || '').replace(/\s+\(GM\)$/,'');
    whisper(who, 'Only the GM can use that calendar command.');
    return;
  }

  if (sub === 'sendyear'){
    sendChat(script_name, '/direct ' + yearHTML());
  } else if (sub === 'advanceday'){
    advanceDay();
  } else if (sub === 'retreatday'){
    retreatDay();
  } else if (sub === 'setdate'){
    setDate(args[2], args[3], args[4]); // MM DD [YYYY]
  } else if (sub === 'senddate'){
    sendCurrentDate();
  } else if (sub === 'addevent'){
    if (args.length < 5){
      whisper(msg.who, 'Usage: <code>!cal addevent &lt;month#&gt; &lt;day|start-end&gt; &lt;name...&gt; [hex]</code>');
      return;
    }
    var monthTok = args[2], dayTok = args[3];
    var maybeColor = args[args.length-1];
    var hasColor   = !!sanitizeHexColor(maybeColor);
    var nameTokens = hasColor ? args.slice(4, args.length-1) : args.slice(4);
    addEvent(monthTok, dayTok, nameTokens, hasColor ? maybeColor : null);
  } else if (sub === 'removeevent'){
    if (args.length < 3){
      whisper(msg.who, 'Usage: <code>!cal removeevent &lt;index|name&gt;</code>');
      return;
    }
    removeEvent(args.slice(2).join(' '));
  } else if (sub === 'resetcalendar'){
    resetToDefaults();
  } else {
    sendCurrentDate(msg.who);
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

    sendChat(script_name,
        '/w gm ' +
        '<div style="font-weight:bold;">Eberron Calendar Initialized</div>' +
        '<div>Current date: ' + esc(currentDate) + '</div>'
    );

    sendChat(script_name,
        '/direct ' +
        '<div>Use <code>!cal</code> to view the calendar.</div>' +
        '<div>Use <code>!cal help</code> for command details.</div>'
    );
});

return { checkInstall: checkInstall, register: register };
})();