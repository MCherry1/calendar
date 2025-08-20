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

function toSerial(y, mi, d){ // Serial day index from epoch (year 0, month 0, day 1 => 0). Works with negative years too.
  return (y * daysPerYear()) + monthPrefixDays(mi) + ((parseInt(d,10)||1) - 1);
}

// Style builders

var TD_BASE = 'border:1px solid #444;width:2em;height:2em;text-align:center;';

function applyTodayStyle(style){
  style += 'position:relative;z-index:3;';
  style += 'top:-2px;left:-2px;';
  style += 'border-radius:2px;';
  style += 'box-shadow:'
            + '= 3px 8px rgba(0,0,0,0.65);';
            + '0 12px 24px rgba(0,0,0,.35), '
            + 'inset 0 1px 0 rgba(255,255,255,.18)'; 
  style += 'outline:2px solid rgba(0,0,0,0.35);';
  style += 'outline-offset:1px;';
  style += 'box-sizing:border-box;overflow:visible;';
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
                var style = TD_BASE;
                var cellTextColor, cellBg;
                var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';

                if (todays.length >= 2){ // striped background for 2-3 events
                    var cols = todays.slice(0,3).map(eventColor);
                    var avg  = avgHexColor(cols);
                    style += 'background:'+gradientFor(cols)+';';
                    cellTextColor = headerTextColor(avg);
                    style += 'color:'+cellTextColor+';';
                    if (today){ style = applyTodayStyle(style); }
                } else if (evObj){
                    cellBg = eventColor(evObj);
                    cellTextColor = headerTextColor(cellBg);
                    style += 'background:'+cellBg+';color:'+cellTextColor+';';
                    if (today){ style = applyTodayStyle(style); }
                } else if (today){
                    // "today" with no events uses month header color
                    cellBg = monthColor;
                    cellTextColor = headerTextColor(cellBg);
                    style += 'background:'+cellBg+';color:'+cellTextColor+';';
                    style = applyTodayStyle(style);
                }

                var dotsHtml = buildEventDots(todays); // Add dots for >3 events

                html.push('<td'+titleAttr+' style="'+style+'"><div>'+day+'</div>'+dotsHtml+'</td>');
                day++;
            }
        }
        html.push('</tr>');
        if(day>md) break;
    }
    html.push('</table>');
    return html.join('');
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
        '<div>• <code>!cal advanceday</code> — advance one day <i>(GM-only)</i></div>',
        '<div>• <code>!cal retreatday</code> — go back one day <i>(GM-only)</i></div>',
        '<div>• <code>!cal setdate &lt;dd&gt; &lt;mm&gt; [yyyy]</code> — set date, day-first; year optional; leading zeros optional <i>(GM-only)</i></div>',
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
        announceDay(msg.who); // whisper to whoever called !cal
        return;
    }

    // GM only
    if(!playerIsGM(msg.playerid)){
        var who = (msg.who || '').replace(/\s+\(GM\)$/,'');
        whisper(who, 'Only the GM can use that calendar command.');
        return;
    }

    if(sub === 'advanceday'){
        advanceDay();                       // whispers to GM (via announceDay(null,true))
    } else if(sub === 'retreatday'){
        retreatDay();                       // whispers to GM
    } else if(sub === 'setdate'){
        setDate(args[2], args[3], args[4]); // whispers to GM
    } else if(sub === 'senddate'){
        announceDay();                      // broadcast to all
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
