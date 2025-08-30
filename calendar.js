// Eberron Calendar Script
// By Matthew Cherry (github.com/mcherry1/calendar)
// Roll20 API script
// Call `!cal` to show the calendar, and use `!cal help` for command details.
// Version: 1.9 (cleaned)

var Calendar = (function(){

'use strict';
var script_name = 'Calendar';
var state_name  = 'CALENDAR';
var EVENT_DEFAULT_COLOR = sanitizeHexColor('#ff00f2'); // Bright pink for events without a defined color.
var GRADIENT_ANGLE = '45deg'; // Angle for multi-event day gradients.
var CONTRAST_MIN = 4.5; // Minimum contrast ratio
var CONTRAST_MIN_HEADER = 4.5; // AA for normal text
var CONTRAST_MIN_CELL   = 7.0; // AAA-ish goal for tiny day numbers


// ---------- Defaults ----------
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
    { name: "Tain Gala",               month: "all",  day: 6,       color: "#F7E7CE" },
    { name: "Crystalfall",             month: 2,      day: 9,       color: "#87CEEB" },
    { name: "The Day of Mourning",     month: 2,      day: 20,      color: "#808080" },
    { name: "Tira's Day",              month: 3,      day: 15,      color: "#F8F8FF" },
    { name: "Sun's Blessing",          month: 3,      day: 15,      color: "#FFD700" },
    { name: "Aureon's Crown",          month: 5,      day: 26,      color: "#6A5ACD" },
    { name: "Brightblade",             month: 6,      day: 12,      color: "#B22222" },
    { name: "The Race of Eight Winds", month: 7,      day: 23,      color: "#20B2AA" },
    { name: "The Hunt",                month: 8,      day: 4,       color: "#228B22" },
    { name: "Fathen's Fall",           month: 8,      day: 25,      color: "#F8F8FF" },
    { name: "Boldrei's Feast",         month: 9,      day: 9,       color: "#FFB347" },
    { name: "The Ascension",           month: 10,     day: 1,       color: "#F8F8FF" },
    { name: "Wildnight",               month: 10,     day: "18-19", color: "#8B0000" },
    { name: "Thronehold",              month: 11,     day: 11,      color: "#4169E1" },
    { name: "Long Shadows",            month: 12,     day: "26-28", color: "#0D0D0D" }
  ]
};

// ---------- Core state / install ----------
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

  if (!state[state_name].suppressedDefaults) {
    state[state_name].suppressedDefaults = {}; // key → 1
  }

  var cal = state[state_name].calendar;
  if (!cal.current) cal.current = { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 };

  if(!Array.isArray(cal.events)){
    // first install → expand defaults
    var lim = Math.max(1, cal.months.length);
    var out = [];
    JSON.parse(JSON.stringify(defaults.events)).forEach(function(e){
      var monthsList;
      if (String(e.month).toLowerCase() === 'all') {
        monthsList = []; for (var i=1;i<=lim;i++) monthsList.push(i);
      } else {
        var m = clamp(parseInt(e.month,10)||1, 1, lim);
        monthsList = [m];
      }
      monthsList.forEach(function(m){
        out.push({
          name: String(e.name||''),
          month: m,
          day: e.day,
          year: null,
          color: sanitizeHexColor(e.color) || null
        });
      });
    });
    cal.events = out;
  } else {
    // bring in newly added defaults + sanitize
    mergeInNewDefaultEvents(cal);

    cal.events = cal.events.map(function(e){
      var lim = Math.max(1, cal.months.length);
      var m = clamp(parseInt(e.month,10)||1, 1, lim);
      var yr = (isFinite(parseInt(e.year,10)) ? (parseInt(e.year,10)|0) : null);
      return {
        name: String(e.name||''),
        month: m,
        day: e.day,
        year: yr,
        color: sanitizeHexColor(e.color) || null
      };
    });

    // apply default colors if missing
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

// ---------- Helpers ----------
function sanitizeHexColor(s){
  if(!s) return null;
  var hex = String(s).trim().replace(/^#/, '');
  if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
  if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
  return null;
}
function getEventColor(e){ return sanitizeHexColor(e.color) || EVENT_DEFAULT_COLOR; }
function esc(s){
  if (s == null) return '';
  return String(s)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function clamp(n, min, max){ n = parseInt(n,10); if (!isFinite(n)) n = min; return n < min ? min : (n > max ? max : n); }
function int(v, fallback){ var n = parseInt(v,10); return isFinite(n) ? n : fallback; }
function makeDayMatcher(spec){
  if (typeof spec === 'number') { var n = spec|0; return function(d){ return d === n; }; }
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
    var n2 = parseInt(s,10);
    if (isFinite(n2)) return function(d){ return d === n2; };
  }
  return function(){ return false; };
}
function _normalizeCols(cols){
  cols = (cols || []).map(sanitizeHexColor).filter(Boolean);
  if (!cols.length) cols = ['#888888'];
  if (cols.length > 3) cols = cols.slice(0, 3);
  return cols;
}
function _uniqueCols(cols){
  var seen = {}, out = [];
  for (var i=0;i<cols.length;i++){ var c = cols[i]; if (!seen[c]){ seen[c]=1; out.push(c); } }
  return out;
}
function _gradientFor(cols){
  var n = cols.length, parts = [];
  for (var i = 0; i < n; i++){
    var start = (i * 100 / n).toFixed(3) + '%';
    var end   = ((i + 1) * 100 / n).toFixed(3) + '%';
    parts.push(cols[i] + ' ' + start + ',' + cols[i] + ' ' + end);
  }
  return 'linear-gradient(' + GRADIENT_ANGLE + ',' + parts.join(',') + ')';
}
function _relLum(hex){
  hex = (hex||'').toString().replace(/^#/, '');
  if (hex.length===3) hex = hex.replace(/(.)/g,'$1$1');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0;
  var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function lin(c){ c/=255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
function _contrast(bgHex, textHex){ var L1=_relLum(bgHex), L2=_relLum(textHex); var hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }
function _pickTextAndWorst(cols){
  var minB = Infinity, minW = Infinity, worstB = 0, worstW = 0;
  for (var i=0;i<cols.length;i++){
    var cB = _contrast(cols[i], '#000'); if (cB < minB){ minB = cB; worstB = i; }
    var cW = _contrast(cols[i], '#fff'); if (cW < minW){ minW = cW; worstW = i; }
  }
  if (minB >= minW) return { text:'#000', worstBg:cols[worstB], minContrast:minB };
  return { text:'#fff', worstBg:cols[worstW], minContrast:minW };
}
function textColorForBg(bgHex){ return _contrast(bgHex, '#000') >= _contrast(bgHex, '#fff') ? '#000' : '#fff'; }
function outlineIfNeeded(textColor, bgHex){
  var ratio = _contrast(bgHex, textColor);
  if (ratio >= CONTRAST_MIN) return '';
  return (textColor === '#fff')
    ? 'text-shadow:-0.5px -0.5px 0 #000,0.5px -0.5px 0 #000,-0.5px 0.5px 0 #000,0.5px 0.5px 0 #000;'
    : 'text-shadow:-0.5px -0.5px 0 #fff,0.5px -0.5px 0 #fff,-0.5px 0.5px 0 #fff,0.5px 0.5px 0 #fff;';
}
function outlineIfNeededMin(textColor, bgHex, minTarget){
  var ratio = _contrast(bgHex, textColor);
  if (ratio >= (minTarget||CONTRAST_MIN_HEADER)) return '';
  // High-contrast outline using opposite color
  return (textColor === '#fff')
    ? 'text-shadow:-0.5px -0.5px 0 #000,0.5px -0.5px 0 #000,-0.5px 0.5px 0 #000,0.5px 0.5px 0 #000;'
    : 'text-shadow:-0.5px -0.5px 0 #fff,0.5px -0.5px 0 #fff,-0.5px 0.5px 0 #fff,0.5px 0.5px 0 #fff;';
}
function styleForBg(style, bgHex, minTarget){
  var t = textColorForBg(bgHex);
  style += 'background-color:'+bgHex+';';  // was: background:
  style += 'color:'+t+';';
  style += outlineIfNeededMin(t, bgHex, (minTarget||CONTRAST_MIN_HEADER));
  return style;
}
function styleForGradient(style, cols, minTarget){
  cols = _normalizeCols(cols);
  var uniq = _uniqueCols(cols);
  if (uniq.length === 1){
    return styleForBg(style, uniq[0], (minTarget||CONTRAST_MIN_CELL));
  }

  var pick = _pickTextAndWorst(cols); // { text:'#000|#fff', worstBg:'#RRGGBB', minContrast:Number }
  style += 'background-color:'+cols[0]+';';
  style += 'background-image:'+_gradientFor(cols)+';';
  style += 'background-repeat:no-repeat;background-size:100% 100%;';
  style += 'color:'+pick.text+';';
  // IMPORTANT bug fix: pass the WORST background color, not the number
  style += outlineIfNeededMin(pick.text, pick.worstBg, (minTarget||CONTRAST_MIN_CELL));
  return style;
}

function daysPerYear(){ var months = getCal().months, sum = 0; for (var i=0;i<months.length;i++) sum += (parseInt(months[i].days,10)||0); return sum; }
function monthPrefixDays(mi){ var months = getCal().months, sum = 0; for (var i=0;i<mi;i++) sum += (parseInt(months[i].days,10)||0); return sum; }
function toSerial(y, mi, d){ return (y * daysPerYear()) + monthPrefixDays(mi) + ((parseInt(d,10)||1) - 1); }
function weekdayIndexFor(mi, d){ var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length; var delta = toSerial(cur.year, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month); return ( (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen ); }
function weekdayIndexForYear(year, mi, d){ var cal=getCal(), cur=cal.current, wdlen=cal.weekdays.length; var delta = toSerial(year, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month); return ( (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen ); }
function firstNumFromDaySpec(daySpec){ if (typeof daySpec === 'number') return daySpec|0; var s = String(daySpec||'').trim(); var m = s.match(/^\s*(\d+)/); return m ? Math.max(1, parseInt(m[1],10)) : 1; }
function normalizeDaySpec(spec, maxDays){
  var s = String(spec||'').trim();
  if (/^\d+$/.test(s)){ return String(clamp(s, 1, maxDays)); }
  var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m){
    var a = clamp(m[1], 1, maxDays), b = clamp(m[2], 1, maxDays);
    if (a > b){ var t=a; a=b; b=t; }
    return a <= b ? (a+'-'+b) : null;
  }
  return null;
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
  var out2=[]; for (var d2=1; d2<=maxDays; d2++) out2.push(d2);
  return out2;
}
function todaySerial(){ var c = getCal().current; return toSerial(c.year, c.month, c.day_of_the_month); }
function currentDateLabel(){
  var cal = getCal(), cur = cal.current;
  return cal.weekdays[cur.day_of_the_week] + ", " +
         cur.day_of_the_month + " " +
         cal.months[cur.month].name + ", " +
         cur.year + " " + LABELS.era;
}
function nextForDayOnly(cur, day, monthsLen){
  var mdays = getCal().months[cur.month].days;
  var d = clamp(day, 1, mdays);
  if (cur.day_of_the_month <= d){ return { month: cur.month, year: cur.year }; }
  var nm = (cur.month + 1) % monthsLen;
  var ny = cur.year + ((nm===0)?1:0);
  return { month: nm, year: ny };
}
function nextForMonthDay(cur, mIndex, d){
  var mdays = getCal().months[mIndex].days;
  var day = clamp(d, 1, mdays);
  var serialNow = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var serialCand = toSerial(cur.year, mIndex, day);
  if (serialCand >= serialNow) return { year: cur.year };
  return { year: cur.year + 1 };
}
function swatchHtml(hex){
  var col = sanitizeHexColor(hex) || EVENT_DEFAULT_COLOR;
  return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';" title="'+esc(col)+'"></span>';
}
function sendToAll(html){ sendChat(script_name, '/direct ' + html); }
function sendToGM(html){  sendChat(script_name, '/w gm ' + html); }
function warnGM(msg){ sendChat(script_name, '/w gm ' + msg); }
function getCal(){ return state[state_name].calendar; }
function eventKey(e){ var y = (e.year==null)?'ALL':String(e.year|0); return (e.month|0)+'|'+String(e.day)+'|'+y+'|'+String(e.name||'').trim().toLowerCase(); }
function defaultKeyFor(monthHuman, daySpec, name){ return (monthHuman|0)+'|'+String(daySpec)+'|ALL|'+String(name||'').trim().toLowerCase(); }
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
        cal.events.push({ name: String(de.name||''), month: m, day: normDay, year: null, color: sanitizeHexColor(de.color) || null });
        have[key] = 1;
      }
    });
  });
  cal.events.sort(compareEvents);
}
// --- Fuzzy helpers (month matching) ---------------------------------

function _asciiFold(s){
  var str = String(s || '');
  return (typeof str.normalize === 'function')
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : str;
}
function _normAlpha(s){
  // lower-case, ascii-fold, keep letters only
  return _asciiFold(String(s||'').toLowerCase()).replace(/[^a-z]/g,'');
}
function _levenshtein(a,b){
  // tiny O(mn) DP, fine for 12 months
  a = _normAlpha(a); b = _normAlpha(b);
  var m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  var prev=new Array(n+1), curr=new Array(n+1), i,j;
  for(j=0;j<=n;j++) prev[j]=j;
  for(i=1;i<=m;i++){
    curr[0]=i;
    var ca=a.charCodeAt(i-1);
    for(j=1;j<=n;j++){
      var cb=b.charCodeAt(j-1);
      var cost = (ca===cb)?0:1;
      curr[j]=Math.min(
        prev[j]+1,      // deletion
        curr[j-1]+1,    // insertion
        prev[j-1]+cost  // subst
      );
    }
    var t=prev; prev=curr; curr=t;
  }
  return prev[n];
}

// Common short forms / frequent typos you might see in play chat.
// We map a few normalized strings to their target month index resolver.
// (We’ll also accept 3-letter prefixes & near-levenshtein matches.)
var MONTH_SYNONYMS = {
  zarantyr: 'zarantyr', zarantir: 'zarantyr', zar: 'zarantyr',
  olarune: 'olarune', olarun: 'olarune', olar: 'olarune', ola: 'olarune',
  therendor: 'therendor', ther: 'therendor', the: 'therendor',
  eyre: 'eyre', eyr: 'eyre',
  dravago: 'dravago', drovago: 'dravago', dravaga: 'dravago', dra: 'dravago',
  nymm: 'nymm', nym: 'nymm',
  lharvion: 'lharvion', lharvian: 'lharvion', lhar: 'lharvion', lha: 'lharvion',
  barrakas: 'barrakas', barakas: 'barrakas', bar: 'barrakas',
  rhaan: 'rhaan', rhan: 'rhaan', rha: 'rhaan',
  sypheros: 'sypheros', sypherus: 'sypheros', sypherous: 'sypheros', syph: 'sypheros', syp: 'sypheros',
  aryth: 'aryth', ary: 'aryth',
  vult: 'vult', volt: 'vult', vul: 'vult'
};

// Try a small cascade: numeric → exact/prefix → synonyms → 3-letter abbrev → Levenshtein <= threshold
function _fuzzyMonthIndex(rawTok){
  var cal = getCal();
  if (!rawTok) return -1;

  var tok = String(rawTok).trim().toLowerCase();

  // 0) quick numeric: "3", "03", "m3", "#3", "month3"
  var mnumMatch = tok.match(/^(?:m|month|#)?\s*(\d{1,2})$/);
  if (mnumMatch){
    var n = parseInt(mnumMatch[1],10);
    if (isFinite(n) && n>=1 && n<=cal.months.length) return n-1;
  }

  // normalize token once
  var ntok = _normAlpha(tok);
  if (!ntok) return -1;

  // Build candidate list (full names + 3-letter abbrevs)
  var names = cal.months.map(function(m){ return String(m.name||''); });
  var norm = names.map(function(n){ return _normAlpha(n); });
  var abbr = norm.map(function(n){ return n.slice(0,3); });

  // 1) exact normalized match or begins-with (prefix)
  for (var i=0;i<norm.length;i++){
    if (ntok===norm[i] || norm[i].indexOf(ntok)===0) return i;
  }

  // 2) synonyms map (e.g., "sypherus" → "sypheros")
  var syn = MONTH_SYNONYMS[ntok];
  if (syn){
    var nsyn = _normAlpha(syn);
    for (var j=0;j<norm.length;j++){ if (norm[j]===nsyn) return j; }
  }

  // 3) 3-letter abbreviation == match (users often type "dra", "ary", etc.)
  if (ntok.length===3){
    for (var k=0;k<abbr.length;k++){ if (abbr[k]===ntok) return k; }
  }

  // 4) Levenshtein across full names; pick the lowest distance
  var bestIdx=-1, bestDist=1e9;
  for (var t=0;t<norm.length;t++){
    var d = _levenshtein(ntok, norm[t]);
    // prefer prefix-ish by giving them a small bonus
    if (norm[t].indexOf(ntok)===0) d = Math.min(d, 1);
    if (d<bestDist){ bestDist=d; bestIdx=t; }
  }

  // Thresholds: short strings must be really close; longer strings can be off by 2–3.
  var len = ntok.length;
  var maxDist = (len<=3) ? 1 : (len<=5 ? 2 : 3);

  return (bestDist<=maxDist) ? bestIdx : -1;
}

function monthIndexByName(tok){
  var cal = getCal();
  if (!tok) return -1;

  // First try the old, fast path: exact or prefix on raw month names.
  var s = String(tok).toLowerCase();
  for (var i=0;i<cal.months.length;i++){
    var nm = String(cal.months[i].name||'').toLowerCase();
    if (nm===s || nm.indexOf(s)===0) return i;
  }

  // Fall back to fuzzy resolution (numbers, abbreviations, typos).
  return _fuzzyMonthIndex(tok);
}


// ---------- Labels & styles ----------
var LABELS = { era: 'YK', gmOnlyNotice: 'Only the GM can use that calendar command.' };
var STYLES = {
  table: 'border-collapse:collapse;margin:4px;',
  th:    'border:1px solid #444;padding:2px;width:2em;text-align:center;',
  head:  'border:1px solid #444;padding:0;',
  gmBtnWrap: 'margin:2px 0;',
  td:    'border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;',
  monthHeaderBase: 'padding:6px;text-align:left;'
};
function _applyTodayStyle(style){
  style += 'position:relative;z-index:10;';
  style += 'border-radius:2px;';
  style += 'box-shadow:0 3px 8px rgba(0,0,0,0.65),0 12px 24px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.18);';
  style += 'outline:2px solid rgba(0,0,0,0.35);outline-offset:1px;';
  style += 'box-sizing:border-box;overflow:visible;font-weight:bold;font-size:1.2em;';
  return style;
}

// ---------- Rendering ----------
function monthEventsHtml(mi, today){
  var cal = getCal(), mName = esc(cal.months[mi].name);
  var curYear = cal.current.year;
  var evs = cal.events.filter(function(e){
    return ((+e.month||1)-1) === mi && (e.year == null || (e.year|0) === (curYear|0));
  });
  evs.sort(function(a,b){
    var da = firstNumFromDaySpec(a.day), db = firstNumFromDaySpec(b.day);
    if (da !== db) return da - db;
    var ay = (a.year==null)?1:0, by = (b.year==null)?1:0;
    if (ay !== by) return ay - by;
    return String(a.name||'').localeCompare(String(b.name||''));
  });
  var rows = [];
  evs.forEach(function(e){
    var dayLabel = esc(String(e.day));
    var isToday  = makeDayMatcher(e.day)(today);
    var swatch   = swatchHtml(e.color);
    rows.push('<div' + (isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"') +
              '>' + swatch + mName + ' ' + dayLabel + ': ' + esc(e.name) + '</div>');
  });
  return rows.join('');
}
function renderMiniCal(mi, yearLabel){
  var cal = getCal(), cur = cal.current;
  var wd = cal.weekdays, mObj = cal.months[mi], md = mObj.days;
  var monthColor = mObj.color || '#eee';
  var textColor = textColorForBg(monthColor);
var outline = outlineIfNeededMin(textColor, monthColor, CONTRAST_MIN_HEADER);
  var first = (typeof yearLabel === 'number') ? weekdayIndexForYear(yearLabel, mi, 1) : weekdayIndexFor(mi, 1);
  var html = ['<table style="'+STYLES.table+'">'];
  html.push(
    '<tr><th colspan="7" style="'+STYLES.head+'">' +
      '<div style="'+STYLES.monthHeaderBase+'background-color:'+monthColor+';color:'+textColor+';'+outline+'">' +
        esc(mObj.name) +
        '<span style="float:right;">'+esc(String(yearLabel!=null?yearLabel:cur.year))+' '+LABELS.era+'</span>' +
      '</div>' +
    '</th></tr>'
  );
  html.push('<tr>' + wd.map(function(d){ return '<th style="'+STYLES.th+'">'+esc(d)+'</th>'; }).join('') + '</tr>');
  var day=1;
  for (var r=0;r<6;r++){
    html.push('<tr>');
    for (var c=0;c<7;c++){
      if ((r===0 && c<first) || day>md){
        html.push('<td style="'+STYLES.td+'"></td>');
      } else {
        var isToday = (mi === cur.month) && (day === cur.day_of_the_month) && ((typeof yearLabel !== 'number') || (yearLabel === cur.year));
        var targetYear = (typeof yearLabel === 'number') ? yearLabel : cur.year;
        var todays = getEventsFor(mi, day, targetYear);
        var evObj = todays[0] || null;
        var style = STYLES.td;
        var titleAttr = todays.length ? ' title="'+esc(todays.map(function(e){ return e.name; }).join(', '))+'"' : '';
        if (todays.length >= 2){
          var cols = todays.slice(0,3).map(getEventColor);
style = styleForGradient(style, cols, CONTRAST_MIN_CELL);
          if (isToday){ style = _applyTodayStyle(style); }
        } else if (evObj){
style = styleForBg(style, getEventColor(evObj), CONTRAST_MIN_CELL);
          if (isToday){ style = _applyTodayStyle(style); }
        } else if (isToday){
style = styleForBg(style, monthColor, CONTRAST_MIN_CELL);
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
function currentMonthHTML(){ return renderMiniCal(getCal().current.month); }
function renderMonthHTML(monthIndex){ return renderMiniCal(monthIndex); }
function yearHTML(){
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    html.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' + renderMonthHTML(i) + '</div>');
  }
  html.push('</div>');
  return html.join('');
}
function yearHTMLFor(targetYear){
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    html.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' + renderMiniCal(i, targetYear) + '</div>');
  }
  html.push('</div>');
  return html.join('');
}
function rollingYearHTML(){
  var cal=getCal(), cur=cal.current, months=getCal().months;
  var html=['<div style="text-align:left;">'];
  for (var off=0; off<12; off++){
    var mi = (cur.month + off) % months.length;
    var y  = cur.year + Math.floor((cur.month + off) / months.length);
    html.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' + renderMiniCal(mi, y) + '</div>');
  }
  html.push('</div>');
  return html.join('');
}
function formatDateLabel(y, mi, d, includeYear){
  var cal=getCal();
  var lbl = esc(cal.months[mi].name)+' '+d;
  if (includeYear) lbl += ', '+esc(String(y))+' '+LABELS.era;
  return lbl;
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
function eventsListHTMLForRange(title, startSerial, endSerial){
  var today = todaySerial();
  var occ = occurrencesInRange(startSerial, endSerial);
  var includeYear = (Math.floor(startSerial/daysPerYear()) !== Math.floor(endSerial/daysPerYear()));
  var out = ['<div style="margin:4px 0;"><b>'+esc(title)+'</b></div>'];
  if (!occ.length){ out.push('<div style="opacity:.7;">No events in this range.</div>'); return out.join(''); }
  for (var i=0;i<occ.length;i++){
    var o = occ[i], sw = swatchHtml(o.e.color);
    var isToday = (o.serial === today);
    var dateLbl = formatDateLabel(o.y, o.m, o.d, includeYear);
    out.push('<div'+(isToday?' style="font-weight:bold;margin:2px 0;"':' style="margin:2px 0;"')+'>'+ sw + dateLbl + ': ' + esc(o.e.name) + '</div>');
  }
  return out.join('');
}

// ---------- Views & messaging ----------
function sendCurrentDate(to, gmOnly){
  var cal=getCal(), c=cal.current;
  var m=cal.months[c.month], wd=cal.weekdays[c.day_of_the_week];
  var mName = esc(m.name), mSeason = esc(m.season);
  var wdName = esc(wd);
  var publicMsg = [
    currentMonthHTML(),
    '<div style="font-weight:bold;margin:2px 0;">' + wdName + ', ' + mName+' ' + c.day_of_the_month + ', ' + esc(String(c.year)) + ' ' + LABELS.era +'</div>'
  ];
  publicMsg.push(monthEventsHtml(c.month, c.day_of_the_month));
  publicMsg.push('<div style="margin-top:8px;"></div>');
  publicMsg.push('<div>Season: '+mSeason+'</div>');
  if (gmOnly){ sendToGM(publicMsg.join('')); }
  else if (to){ whisper(to, publicMsg.join('')); }
  else { sendToAll(publicMsg.join('')); }
  if (gmOnly || !to) { sendToGM(gmButtonsHtml()); }
}
function buildHelpHtml(isGM){
  var common = [
    '<div style="margin:4px 0;"><b>Basic Commands</b></div>',
    '<div>• <code>!cal</code> or <code>!cal show</code></div>',
    '<div>• <code>!cal year</code></div>',
    '<div>• <code>!cal events</code></div>',
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
      '<div style="margin-left:1.8em;opacity:.85;"><i><code>next</code> = next month or calendar year.</i></div>',
      '<div style="margin-left:1.8em;opacity:.85;"><i><code>upcoming</code> = rolling window.</i></div>',
    '<div style="height:12px"></div>',
    '<div>• <code>!cal help</code></div>'
  ];
  if (!isGM) return common.join('');
  var gm = [
    '<div style="margin-top:10px;"><b>Date Management</b></div>',
    '<div>• <code>!cal advanceday</code></div>',
    '<div>• <code>!cal retreatday</code></div>',
    '<div>• <code>!cal setdate [MM] DD [YYYY]</code></div>',
    '<div style="height:12px"></div>',
    '<div>• <code>!cal senddate</code> — broadcast current month</div>',
    '<div>• <code>!cal sendyear</code> — broadcast full year</div>',
    '<div style="height:12px"></div>',
    '<div style="margin-top:10px;"><b>Event Management</b></div>',
    '<div>• <code>!cal addevent [MM] DD [YYYY] name hex</code></div>',
    '<div>• <code>!cal addmonthly DD name hex</code></div>',
    '<div>• <code>!cal addannual MM DD name hex</code></div>',
    '<div>• <code>!cal addnext</code></div>',
    '<div style="margin-left:1.8em;">• Tip: if your event name starts or ends with numbers, use <code>-- [name] #[hex]</code></div>',
    '<div style="margin-left:1.8em;">• e.g. <code>!cal addevent 3 14 -- 1985 #ABCDEF</code>.</div>',
    '<div style="height:12px"></div>',
    '<div>• <code>!cal removeevent [all] [exact] [index] name OR index</code></div>',
    '<div style="height:12px"></div>',
    '<div style="margin-top:10px;"><b>Script Management</b></div>',
    '<div>• <code>!cal refresh</code></div>',
    '<div>• <code>!cal resetcalendar</code> — nukes custom events and current date</div>'
  ];
  return common.concat(gm).join('');
}
function showHelp(to, isGM){
  var help = buildHelpHtml(!!isGM);
  if (to){ whisper(to, help); } else { sendChat(script_name, help); }
}
function whisper(to, html){
  var name = String(to || '').replace(/\s+\(GM\)$/,'').trim();
  name = name.replace(/"/g,'').replace(/\[/g,'(').replace(/\]/g,')').replace(/[|\\]/g,'-').replace(/[<>]/g,'-');
  sendChat(script_name, '/w "'+ name +'" ' + html);
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

// ---------- Event CRUD ----------
function compareEvents(a, b){
  var ya = (a.year==null)? -Infinity : (a.year|0);
  var yb = (b.year==null)? -Infinity : (b.year|0);
  if (ya !== yb) return ya - yb;
  var am = (+a.month||1), bm = (+b.month||1);
  if (am !== bm) return am - bm;
  return firstNumFromDaySpec(a.day) - firstNumFromDaySpec(b.day);
}
function _addConcreteEvent(monthHuman, daySpec, yearOrNull, name, color){
  var cal = getCal();
  var m = clamp(monthHuman, 1, cal.months.length);
  var maxD = cal.months[m-1].days|0;
  var normDay = normalizeDaySpec(daySpec, maxD);
  if (!normDay) return false;
  var col = sanitizeHexColor(color) || null;
  var e = { name: String(name||''), month: m, day: normDay, year: (yearOrNull==null? null : (yearOrNull|0)), color: col };
  var key = eventKey(e);
  var exists = cal.events.some(function(ev){ return eventKey(ev)===key; });
  if (exists) return false;
  cal.events.push(e);
  cal.events.sort(compareEvents);
  return true;
}
function parseIntSafe(x){ var n=parseInt(x,10); return isFinite(n)?n:null; }
function isHexColorToken(tok){ return !!sanitizeHexColor(tok); }
function isListToken(tok){ return /^all$/i.test(tok) || /^[0-9,\-\s]+$/.test(tok); }
function parseIntList(token, minV, maxV){
  if (!token) return [];
  token = String(token).trim().toLowerCase();
  if (token === 'all'){ var out=[]; for (var i=minV;i<=maxV;i++) out.push(i); return out; }
  var set = {};
  String(token).split(',').forEach(function(part){
    part = part.trim(); if (!part) return;
    var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m){
      var a=parseInt(m[1],10), b=parseInt(m[2],10);
      if (isFinite(a) && isFinite(b)){
        if (a>b){ var t=a;a=b;b=t; }
        for (var j=a;j<=b;j++){ if (j>=minV && j<=maxV) set[j]=1; }
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
  token = String(token||'').trim().toLowerCase();
  if (token === 'all'){ return ['1-'+maxDays]; }
  var parts = token.split(','), out=[], seen={};
  for (var i=0;i<parts.length;i++){
    var p = parts[i].trim(); if (!p) continue;
    var norm = normalizeDaySpec(p, maxDays);
    if (!norm){ var n = parseInt(p,10); if (isFinite(n)) norm = String(clamp(n,1,maxDays)); }
    if (norm && !seen[norm]){ seen[norm]=1; out.push(norm); }
  }
  if (!out.length){
    var n1 = normalizeDaySpec(token, maxDays);
    if (n1) out.push(n1);
  }
  return out;
}
function addEventSmart(tokens){
  var cal = getCal(), cur = cal.current, monthsLen = cal.months.length;
  if (!tokens || !tokens.length){ warnGM('Usage: <code>!cal addevent [&lt;month|list|all&gt;] &lt;day|range|list|all&gt; [&lt;year|list|all&gt;] &lt;name...&gt; [#hex]</code>'); return; }
  var sepIdx = tokens.indexOf('--'), forcedNameTokens = null;
  if (sepIdx !== -1){ forcedNameTokens = tokens.slice(sepIdx+1); tokens = tokens.slice(0, sepIdx); }
  var color = null;
  if (tokens.length && isHexColorToken(tokens[tokens.length-1])) { color = sanitizeHexColor(tokens.pop()); }
  else if (forcedNameTokens && forcedNameTokens.length) {
    var maybe = forcedNameTokens[forcedNameTokens.length-1];
    if (/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(maybe)) { color = sanitizeHexColor(maybe); forcedNameTokens.pop(); }
  }
  var forcedName = forcedNameTokens ? forcedNameTokens.join(' ').trim() : null;
  var dateToks = [];
  while (dateToks.length<3 && tokens.length && isListToken(tokens[0])){ dateToks.push(tokens.shift()); }
  if (dateToks.length===0){ warnGM('Could not parse a date from your input. Expected <code>day</code>, <code>month day</code>, or <code>month day year</code>.'); return; }
  var rawName = forcedName != null ? forcedName : String(tokens.join(' ')).trim();
  rawName = rawName.replace(/^"(.*)"$/,'$1').replace(/^'(.*)'$/,'$1').trim();
  if (!rawName){ rawName = 'Untitled Event'; }
  var monthsSpec=null, daysSpecList=null, yearsSpec=null;
  var monthCount = cal.months.length;

  if (dateToks.length === 1){
    var dayTok = dateToks[0];
    var singleDay = parseIntSafe(dayTok);
    if (singleDay != null && /^[0-9]+$/.test(dayTok)){
      var nextMY = nextForDayOnly(cur, singleDay, monthCount);
      var di = clamp(singleDay, 1, cal.months[nextMY.month].days);
      _addConcreteEvent(nextMY.month+1, String(di), nextMY.year, rawName, color);
      return;
    } else {
      monthsSpec = parseIntList('all', 1, monthCount);
      daysSpecList = [String(dayTok)];
      yearsSpec = null;
    }
  } else if (dateToks.length === 2){
    var mTok = dateToks[0], dTok = dateToks[1];
    var monthsBulk = parseIntList(mTok, 1, monthCount);
    var looksBulk = (mTok.toLowerCase() === 'all' || mTok.indexOf(',')!==-1 || mTok.indexOf('-')!==-1);
    var singleM = parseIntSafe(mTok), singleD = parseIntSafe(dTok);
    if (!looksBulk && singleM != null && /^[0-9]+$/.test(dTok)){
      var mi = clamp(singleM, 1, monthCount) - 1;
      var nextY = nextForMonthDay(cur, mi, singleD).year;
      var di2 = clamp(singleD, 1, cal.months[mi].days);
      _addConcreteEvent(mi+1, String(di2), nextY, rawName, color);
      return;
    }
    monthsSpec = monthsBulk;
    daysSpecList = [String(dTok)];
    yearsSpec = null;
  } else {
    var mTok3 = dateToks[0], dTok3 = dateToks[1], yTok3 = dateToks[2];
    var mList = parseIntList(mTok3, 1, monthCount);
    var yList;
    var yIsAll = /^all$/i.test(yTok3);
    if (yIsAll){ yList = null; }
    else {
      yList = parseIntList(yTok3, -2147483648, 2147483647);
      if (!yList.length){ var yy = parseIntSafe(yTok3); if (yy != null) yList = [yy]; }
    }
    monthsSpec   = mList;
    daysSpecList = [String(dTok3)];
    yearsSpec    = yList;
    if (mList.length===1 && /^\d+$/.test(String(dTok3)) && yList && yList.length===1){
      var mi3 = mList[0]-1, di3=parseInt(dTok3,10)|0, yi3=yList[0]|0;
      var serialNow = toSerial(cur.year, cur.month, cur.day_of_the_month);
      var serialEvt = toSerial(yi3, mi3, clamp(di3,1,cal.months[mi3].days));
      if (serialEvt < serialNow){ warnGM('Note: that explicit date appears to be in the past. Adding anyway for historical record.'); }
    }
  }

  if (!monthsSpec || !daysSpecList){ warnGM('Could not resolve your date specification.'); return; }

  var added = 0;
  for (var mi0=0; mi0<monthsSpec.length; mi0++){
    var mHuman = monthsSpec[mi0]|0;
    var mIdx = mHuman-1;
    var maxD = cal.months[mIdx].days|0;
    var daySpecsForMonth = [];
    for (var ds=0; ds<daysSpecList.length; ds++){
      var dsRaw = String(daysSpecList[ds]);
      var list = parseDaySpecList(dsRaw, maxD);
      if (!list.length){ var one = normalizeDaySpec(dsRaw, maxD); if (one) list = [one]; }
      for (var k=0;k<list.length;k++){ if (daySpecsForMonth.indexOf(list[k])===-1) daySpecsForMonth.push(list[k]); }
    }
    if (yearsSpec === null){
      for (var j=0;j<daySpecsForMonth.length;j++){
        added += _addConcreteEvent(mHuman, daySpecsForMonth[j], null, rawName, color) ? 1 : 0;
      }
    } else if (Array.isArray(yearsSpec) && yearsSpec.length){
      for (var yy2=0; yy2<yearsSpec.length; yy2++){
        var yVal = yearsSpec[yy2]|0;
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
function addMonthly(dayTok, nameTokens, colorTok){
  var tokens = [];
  tokens.push('all'); tokens.push(String(dayTok)); tokens.push('all');
  if (nameTokens && nameTokens.length) tokens = tokens.concat(nameTokens);
  if (colorTok) tokens.push(colorTok);
  addEventSmart(tokens);
}
function addAnnual(monthTok, dayTok, nameTokens, colorTok){
  var tokens = [];
  tokens.push(String(monthTok)); tokens.push(String(dayTok)); tokens.push('all');
  if (nameTokens && nameTokens.length) tokens = tokens.concat(nameTokens);
  if (colorTok) tokens.push(colorTok);
  addEventSmart(tokens);
}
function addNext(tokens){ addEventSmart(tokens.slice()); }
function restoreDefaultEvents(query){
  if (!state[state_name].suppressedDefaults){ state[state_name].suppressedDefaults = {}; }
  var sup = state[state_name].suppressedDefaults;
  var toks = String(query||'').trim().split(/\s+/).filter(Boolean);
  var restoreAll = false, exact = false;
  while (toks.length && /^(all|exact)$/i.test(toks[0])){
    var t = toks.shift().toLowerCase();
    if (t === 'all')   restoreAll = true;
    if (t === 'exact') exact = true;
  }
  var needle = toks.join(' ').trim().toLowerCase();
  var keys = Object.keys(sup);
  var restored = 0;
  if (restoreAll || !needle){
    keys.forEach(function(k){ if (sup[k]){ delete sup[k]; restored++; } });
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Restored ' + restored + ' default event'+(restored===1?'':'s')+'.');
    sendCurrentDate(null,true);
    return;
  }
  keys.forEach(function(k){
    var parts = k.split('|'); var nm = (parts[3]||'').toLowerCase();
    if ((exact && nm === needle) || (!exact && nm.indexOf(needle) !== -1)){ if (sup[k]){ delete sup[k]; restored++; } }
  });
  refreshCalendarState(true);
  if (restored){
    sendChat(script_name, '/w gm Restored ' + restored + ' default event'+(restored===1?'':'s')+' matching "'+esc(needle)+'".');
    sendCurrentDate(null,true);
  } else {
    sendChat(script_name, '/w gm No suppressed default events matched "'+esc(needle)+'".');
  }
}
function removeEvent(query){
  var cal = getCal(), events = cal.events;
  if (!state[state_name].suppressedDefaults) { state[state_name].suppressedDefaults = {}; }
  function markSuppressedIfDefault(ev){
    var calLocal = getCal();
    var defaultsSet = currentDefaultKeySet(calLocal);
    var maxD = calLocal.months[ev.month-1].days|0;
    var norm = normalizeDaySpec(ev.day, maxD) || String(firstNumFromDaySpec(ev.day));
    var k = defaultKeyFor(ev.month, norm, ev.name);
    if (defaultsSet[k]) { state[state_name].suppressedDefaults[k] = 1; }
  }
  if (!events.length){ sendChat(script_name, '/w gm No events to remove.'); return; }
  var toks = String(query||'').trim().split(/\s+/);
  var rmAll=false, exact=false, forceIndex=false;
  while (toks.length && /^(all|exact|index)$/i.test(toks[0])) {
    var t = toks.shift().toLowerCase();
    if (t==='all') rmAll=true; else if (t==='exact') exact=true; else if (t==='index') forceIndex=true;
  }
  if (forceIndex && (rmAll || exact)) { sendChat(script_name, '/w gm Use either <code>index</code> or <code>all/exact</code>, not both.'); return; }
  var raw = toks.join(' ').trim();
  if (!raw){ sendChat(script_name, '/w gm Please provide an index or a name.'); return; }
  if (forceIndex) {
    var m = raw.match(/^#?(\d+)$/); var idx = m ? (+m[1]) : NaN;
    if (!isFinite(idx) || idx < 1 || idx > events.length) { sendChat(script_name, '/w gm After <code>index</code>, give a number 1–'+events.length+'.'); return; }
    var removed = events.splice(idx-1, 1)[0];
    markSuppressedIfDefault(removed);
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed event #'+idx+': '+esc(removed.name));
    sendCurrentDate(null,true);
    return;
  }
  var needle = raw.toLowerCase();
  var asIdxMatch = raw.match(/^#?(\d+)$/);
  var asIdx = !!asIdxMatch && (+asIdxMatch[1] >= 1) && (+asIdxMatch[1] <= events.length);
  var exactNameExists = events.some(function(e){ return String(e.name||'').toLowerCase() === needle; });
  if (!rmAll && !exact && asIdx && exactNameExists) {
    sendChat(script_name, '/w gm "'+esc(raw)+'" matches an index and an event name. Use <code>!cal removeevent index '+esc(raw)+'</code> or <code>!cal removeevent exact '+esc(raw)+'</code>.');
    return;
  }
  if (!rmAll && !exact && asIdx) {
    var idx2 = +asIdxMatch[1];
    var removed2 = events.splice(idx2-1, 1)[0];
    markSuppressedIfDefault(removed2);
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed event #'+idx2+': '+esc(removed2.name));
    sendCurrentDate(null,true);
    return;
  }
  var matches = events.filter(function(e){ var n = String(e.name||'').toLowerCase(); return exact ? (n===needle) : (n.indexOf(needle)!==-1); });
  if (!matches.length){ sendChat(script_name, '/w gm No events matched "'+esc(raw)+'".'); return; }
  if (!rmAll && matches.length>1){
    var list = matches.map(function(e){ var i = events.indexOf(e)+1, m3 = getCal().months[e.month-1].name; var y = (e.year==null)? '' : (', '+e.year+' '+LABELS.era); return '#'+i+' '+esc(e.name)+' ('+esc(m3)+' '+esc(e.day)+y+')'; }).join('<br>');
    sendChat(script_name, '/w gm Multiple matches for "'+esc(raw)+'"'+(exact?' (exact)':'')+':<br>'+list+'<br>Use the index to remove one, or prefix with <code>all</code> to remove all.');
    return;
  }
  if (rmAll){
    matches.forEach(markSuppressedIfDefault);
    cal.events = events.filter(function(e){ return matches.indexOf(e)===-1; });
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed '+matches.length+' event'+(matches.length===1?'':'s')+'.');
  } else {
    var e2 = matches[0], pos = events.indexOf(e2);
    events.splice(pos,1);
    markSuppressedIfDefault(e2);
    refreshCalendarState(true);
    sendChat(script_name, '/w gm Removed event: '+esc(e2.name)+' ('+esc(getCal().months[e2.month-1].name)+' '+esc(e2.day)+((e2.year!=null)?(', '+e2.year+' '+LABELS.era):'')+')');
  }
  sendCurrentDate(null,true);
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
    if (makeDayMatcher(e.day)(day)) out.push(e);
  }
  return out;
}

// ---------- Commands ----------
function gmButtonsHtml(){ return [
  '[📅 Send Date](!cal senddate)',
  '[📅 Send Year](!cal sendyear)',
  '[⏭ Advance Day](!cal advanceday)',
  '[⏮ Retreat Day](!cal retreatday)',
  '[❔ Help](!cal help)'
].map(function(b){ return '<div style="'+STYLES.gmBtnWrap+'">'+b+'</div>'; }).join(''); } // (kept here intentionally)

// Tiny normalizers used by parseTimeSpec / routing
function _normalizePackedWords(q){
  return String(q||'')
    .replace(/\bnextmonth\b/g, 'next month')
    .replace(/\bnextyear\b/g, 'next year')
    .replace(/\bupcomingmonth\b/g, 'upcoming month')
    .replace(/\bupcomingyear\b/g, 'upcoming year')
    .replace(/\bcurrentmonth\b/g, 'month')
    .replace(/\bthismonth\b/g, 'month')
    .replace(/\bthisyear\b/g, 'year')
    .trim();
}
function normalizeSubcommand(sub){ return String(sub||'').toLowerCase(); }

function parseTimeSpec(tokens){
  var q = tokens.join(' ').toLowerCase().replace(/\s+/g,' ').trim();
  q = _normalizePackedWords(q);
  if (!q || q === 'month' || q === 'current')          return { kind:'currentMonth' };
  if (q === 'year' || q === 'current year')            return { kind:'currentYear' };
  if (q === 'next' || q === 'next month')              return { kind:'nextMonth' };
  if (q === 'next year')                               return { kind:'nextYear' };
  if (q === 'upcoming year')                           return { kind:'rollingYear' };
  if (q === 'upcoming' || q === 'upcoming month')      return { kind:'autoUpcomingMonth' };
  var my = parseMonthYearTokens(tokens);
  if (my) return { kind:'monthYear', mi:my.mi, year:my.year };
  var yNum = parseInt(q,10);
  if (String(yNum) === q && isFinite(yNum)) return { kind:'yearNumber', year:yNum };
  var mi = monthIndexByName(q);
  if (mi !== -1) return { kind:'nextOccurrenceOfMonth', mi:mi };
  return { kind:'currentMonth' };
}
function parseEventsSpec(tokens){
  var q = tokens.join(' ').toLowerCase().replace(/\s+/g,' ').trim();
  q = _normalizePackedWords(q);
  if (!q || q === 'upcoming' || q === 'upcoming month'){
    return { kind:'rollingDays', days:28, title:'Events — Upcoming (28 Days)' };
  }
  return parseTimeSpec(tokens);
}
function rangeFromSpec(spec){
  var cal = getCal(), cur = cal.current, months = cal.months, dpy = daysPerYear();
  function monthRange(y, mi, label){
    var md = months[mi].days|0;
    return { title: label, start: toSerial(y, mi, 1), end: toSerial(y, mi, md) };
  }
  switch(spec.kind){
    case 'rollingDays': {
      var s = todaySerial();
      return { title: spec.title || ('Events — Upcoming ('+spec.days+' Days)'), start: s, end: s + (spec.days-1) };
    }
    case 'currentMonth': return monthRange(cur.year, cur.month, 'Events — This Month');
    case 'nextMonth': {
      var mi = (cur.month + 1) % months.length;
      var y  = cur.year + (mi === 0 ? 1 : 0);
      return monthRange(y, mi, 'Events — Next Month ('+months[mi].name+')');
    }
    case 'currentYear': {
      var s2 = toSerial(cur.year, 0, 1);
      return { title: 'Events — Year '+cur.year+' '+LABELS.era, start:s2, end:s2+dpy-1 };
    }
    case 'nextYear': {
      var y2 = cur.year + 1, s3 = toSerial(y2, 0, 1);
      return { title: 'Events — Year '+y2+' '+LABELS.era, start:s3, end:s3+dpy-1 };
    }
    case 'rollingYear': {
      var s4 = toSerial(cur.year, cur.month, 1);
      return { title: 'Events — Upcoming Year (rolling from this month)', start:s4, end:s4+dpy-1 };
    }
    case 'monthYear': return monthRange(spec.year, spec.mi, 'Events — '+months[spec.mi].name+' '+spec.year+' '+LABELS.era);
    case 'yearNumber': {
      var s5 = toSerial(spec.year, 0, 1);
      return { title: 'Events — Year '+spec.year+' '+LABELS.era, start:s5, end:s5+dpy-1 };
    }
    case 'nextOccurrenceOfMonth': {
      var y3 = (spec.mi >= cur.month) ? cur.year : (cur.year+1);
      return monthRange(y3, spec.mi, 'Events — '+months[spec.mi].name+' (next occurrence)');
    }
    case 'autoUpcomingMonth': {
      var miU = cur.month, yU = cur.year;
      if (cur.day_of_the_month >= 15){
        miU = (cur.month + 1) % months.length;
        yU  = cur.year + (miU === 0 ? 1 : 0);
      }
      return monthRange(yU, miU, 'Events — Upcoming Month');
    }
  }
  return monthRange(cur.year, cur.month, 'Events — This Month');
}
function runShowSpec(who, spec){
  var cal = getCal(), cur = cal.current, months = cal.months;
  switch(spec.kind){
    case 'currentMonth': {
      var ps = findObjs({type:'player',displayname:who})||[];
      var pid = ps.length ? ps[0].id : '';
      var isGM = playerIsGM(pid);
      sendCurrentDate(who);
      if (isGM) whisper(who, gmButtonsHtml());
      return;
    }
    case 'currentYear': whisper(who, yearHTML()); return;
    case 'nextMonth': {
      var mi = (cur.month + 1) % months.length;
      var y  = cur.year + (mi === 0 ? 1 : 0);
      whisper(who, renderMiniCal(mi, y)); return;
    }
    case 'nextYear': whisper(who, yearHTMLFor(cur.year + 1)); return;
    case 'rollingYear': whisper(who, rollingYearHTML()); return;
    case 'monthYear': whisper(who, renderMiniCal(spec.mi, spec.year)); return;
    case 'yearNumber': whisper(who, yearHTMLFor(spec.year)); return;
    case 'nextOccurrenceOfMonth': {
      var y2 = (spec.mi >= cur.month) ? cur.year : (cur.year + 1);
      whisper(who, renderMiniCal(spec.mi, y2)); return;
    }
    case 'autoUpcomingMonth': {
      var miU = cur.month, yU = cur.year;
      if (cur.day_of_the_month >= 15){
        miU = (cur.month + 1) % months.length;
        yU  = cur.year + (miU === 0 ? 1 : 0);
      }
      whisper(who, renderMiniCal(miU, yU)); return;
    }
  }
  sendCurrentDate(who);
}
function runEventsSpec(who, spec, broadcast){
  if (spec.kind === 'rollingDays'){
    var r0 = rangeFromSpec(spec);
    var html0 = eventsListHTMLForRange(r0.title, r0.start, r0.end);
    return broadcast ? sendToAll(html0) : whisper(who, html0);
  }
  var r = rangeFromSpec(spec);
  var html = eventsListHTMLForRange(r.title, r.start, r.end);
  return broadcast ? sendToAll(html) : whisper(who, html);
}
function runSendShow(spec){
  var cal = getCal(), cur = cal.current, months = cal.months;
  switch(spec.kind){
    case 'currentMonth':  return sendCurrentDate();
    case 'currentYear':   return sendToAll(yearHTML());
    case 'nextMonth': {
      var mi = (cur.month + 1) % months.length;
      var y  = cur.year + (mi === 0 ? 1 : 0);
      return sendToAll(renderMiniCal(mi, y));
    }
    case 'nextYear':      return sendToAll(yearHTMLFor(cur.year + 1));
    case 'rollingYear':   return sendToAll(rollingYearHTML());
    case 'monthYear':     return sendToAll(renderMiniCal(spec.mi, spec.year));
    case 'yearNumber':    return sendToAll(yearHTMLFor(spec.year));
    case 'nextOccurrenceOfMonth': {
      var y2 = (spec.mi >= cur.month) ? cur.year : (cur.year + 1);
      return sendToAll(renderMiniCal(spec.mi, y2));
    }
    case 'autoUpcomingMonth': {
      var miU = cur.month, yU = cur.year;
      if (cur.day_of_the_month >= 15){
        miU = (cur.month + 1) % months.length;
        yU  = cur.year + (miU === 0 ? 1 : 0);
      }
      return sendToAll(renderMiniCal(miU, yU));
    }
  }
  return sendCurrentDate();
}

// ---------- Command presets / routing ----------
var argPresets = {
  // SHOW
  year:      { target: 'show',   inject: ['year'] },
  fullyear:  { target: 'show',   inject: ['year'] },
  showyear:  { target: 'show',   inject: ['year'] },

  // EVENTS list (legacy)
  listevents:{ target: 'events', inject: ['year'] },
  list:      { target: 'events', inject: ['year'] },

  // Mutating events (unified)
  add:         { target: 'events', inject: ['add'] },
  addevent:    { target: 'events', inject: ['add'] },
  remove:      { target: 'events', inject: ['remove'] },
  removeevent: { target: 'events', inject: ['remove'] },
  rmevent:     { target: 'events', inject: ['remove'] },
  restore:     { target: 'events', inject: ['restore'] },

  // SEND
  senddate:  { target: 'send',   inject: ['date'] },
  sendyear:  { target: 'send',   inject: ['year'] }
};

var commandAliases = {}; // (kept for future)

function _resolveCommandAndArgs(args){
  var sub = normalizeSubcommand(args[1] || '');
  var preset = argPresets[sub];
  if (preset){
    var injected = (preset.inject || []);
    var newArgs = [args[0], preset.target].concat(injected, args.slice(2));
    return { sub: preset.target, args: newArgs };
  }
  if (commandAliases[sub]){ args[1] = commandAliases[sub]; return { sub: args[1], args: args }; }
  return { sub: sub, args: args };
}

// ---------- Commands table ----------
var commands = {
  // Everyone
  '': function(m){
    var isGM = playerIsGM(m.playerid);
    sendCurrentDate(m.who);
    if (isGM) whisper(m.who, gmButtonsHtml());
  },
  show: function(m,a){
    var args = a.slice(2);
    var spec = parseTimeSpec(args);
    runShowSpec(m.who, spec);
  },
  // Unified EVENTS: add/remove/restore (GM), or list windows (all)
  events: function(m, a){
    var args = a.slice(2);
    var sub = (args[0]||'').toLowerCase();
    if (sub === 'add' || sub === 'remove' || sub === 'restore'){
      if (!playerIsGM(m.playerid)){
        whisper((m.who||'').replace(/\s+\(GM\)$/,''), LABELS.gmOnlyNotice);
        return;
      }
      if (sub === 'add'){
        if (args.length < 2){
          whisper(m.who, 'Usage: <code>!cal events add [&lt;month|list|all&gt;] &lt;day|range|list|all&gt; [&lt;year|list|all&gt;] &lt;name...&gt; [#hex]</code>');
          return;
        }
        addEventSmart(args.slice(1));
        return;
      }
      if (sub === 'remove'){
        if (args.length < 2){
          whisper(m.who, 'Usage: <code>!cal events remove [all] [exact] [index] &lt;index|name&gt;</code>');
          return;
        }
        removeEvent(args.slice(1).join(' '));
        return;
      }
      if (sub === 'restore'){
        if (args.length < 2){
          whisper(m.who, 'Usage: <code>!cal events restore [all] [exact] &lt;name...&gt;</code>');
          return;
        }
        restoreDefaultEvents(args.slice(1).join(' '));
        return;
      }
    }
    if (sub === 'list') args.shift();
    var listSpec = parseEventsSpec(args);
    runEventsSpec(m.who, listSpec, /*broadcast*/false);
  },
  help: function(m){ showHelp(m.who, playerIsGM(m.playerid)); },

  // GM-only
  advanceday: { gm:true, run:function(){ advanceDay(); } },
  retreatday: { gm:true, run:function(){ retreatDay(); } },
  setdate: { gm:true, run:function(m,a){
    if (a.length < 3) { whisper(m.who, 'Usage: <code>!cal setdate [MM] DD [YYYY]</code>'); return; }
    if (a.length === 3 && /^\d+$/.test(a[2])) {
      var cal = getCal(), cur = cal.current, months = cal.months;
      var day = parseInt(a[2],10)|0;
      var next = nextForDayOnly(cur, day, months.length);
      var d = clamp(day, 1, months[next.month].days);
      setDate(next.month + 1, d, next.year);
      return;
    }
    if (a.length === 4 && /^\d+$/.test(a[2]) && /^\d+$/.test(a[3])) {
      var cal2 = getCal(), cur2 = cal2.current, months2 = cal2.months;
      var mi = clamp(parseInt(a[2],10), 1, months2.length) - 1;
      var dd = parseInt(a[3],10)|0;
      var next2 = nextForMonthDay(cur2, mi, dd);
      var d2 = clamp(dd, 1, months2[mi].days);
      setDate(mi + 1, d2, next2.year);
      return;
    }
    setDate(a[2], a[3], a[4]);
  }},
  send: { gm:true, run:function(m,a){
    var args = a.slice(2);
    if (!args.length || /^date$|^month$/i.test(args[0])){ return sendCurrentDate(); }
    if (/^events$/i.test(args[0])){
      var evSpec = parseEventsSpec(args.slice(1));
      return runEventsSpec(m.who, evSpec, /*broadcast*/true);
    }
    var spec = parseTimeSpec(args);
    return runSendShow(spec);
  }},
  senddate: { gm:true, run:function(){ sendCurrentDate(); } },
  sendyear: { gm:true, run:function(){ sendToAll(yearHTML()); } },

  addmonthly: { gm:true, run:function(m,a){
    if (a.length < 4){
      whisper(m.who, 'Usage: <code>!cal addmonthly &lt;day|range|list|all&gt; &lt;name...&gt; [#hex]</code>');
      return;
    }
    var maybeColor=a[a.length-1], hasColor=!!sanitizeHexColor(maybeColor);
    var nameTokens = hasColor ? a.slice(3,a.length-1) : a.slice(3);
    addMonthly(a[2], nameTokens, hasColor?maybeColor:null);
  }},
  addannual: { gm:true, run:function(m,a){
    if (a.length < 5){
      whisper(m.who, 'Usage: <code>!cal addannual &lt;month|list|all&gt; &lt;day|range|list|all&gt; &lt;name...&gt; [#hex]</code>');
      return;
    }
    var maybeColor=a[a.length-1], hasColor=!!sanitizeHexColor(maybeColor);
    var nameTokens = hasColor ? a.slice(4,a.length-1) : a.slice(4);
    addAnnual(a[2], a[3], nameTokens, hasColor?maybeColor:null);
  }},
  addnext: { gm:true, run:function(m,a){
    if (a.length < 4){
      whisper(m.who, 'Usage: <code>!cal addnext &lt;day&gt; &lt;name...&gt; [#hex]</code> or <code>!cal addnext &lt;month&gt; &lt;day&gt; &lt;name...&gt; [#hex]</code>');
      return;
    }
    addNext(a.slice(2));
  }},
  refresh: { gm:true, run:function(){ refreshCalendarState(false); } },
  resetcalendar:{ gm:true, run:function(){ resetToDefaults(); } }
};

// ---------- Date mutators ----------
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
    if (cur.month === cal.months.length - 1){ cur.year = cur.year - 1; }
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

// ---------- Routing ----------
function handleInput(msg){
  if (msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/);
  var r = _resolveCommandAndArgs(args);
  var sub = r.sub; args = r.args;
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

// ---------- Boot ----------
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