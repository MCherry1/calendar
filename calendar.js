// Eberron Calendar Script
// By Matthew Cherry (github.com/mcherry1/calendar)
// Roll20 API script
// Call `!cal` to show the calendar, and use `!cal help` for command details.
// Version: 1.13 (refactor + serial cache + bugfix in events list)

var Calendar = (function(){

'use strict';

/* ============================================================================
 * 1) CONSTANTS & DEFAULTS
 * ==========================================================================*/
var script_name = 'Calendar';
var state_name  = 'CALENDAR';
var EVENT_DEFAULT_COLOR = sanitizeHexColor('#ff00f2'); // Bright pink for events without a defined color.
var GRADIENT_ANGLE = '45deg'; // Angle for multi-event day gradients.
var CONTRAST_MIN_HEADER = 4.5; // AA for normal text
var CONTRAST_MIN_CELL   = 7.0; // AAA-ish goal for tiny day numbers
// === [ADDED] Small, reusable helpers =========================================
function h(s){ // HTML escape (alias for esc)
  return esc(s);
}

// Single, DRY sending function
function send(opts, html){
  opts = opts || {};
  var to = (opts.to || '').replace(/\s+\(GM\)$/,'').trim();
  var prefix;
  if (opts.broadcast){            prefix = '/direct ';
  } else if (opts.gmOnly){        prefix = '/w gm ';
  } else if (to){                 prefix = '/w "' + to.replace(/"/g,'') + '" ';
  } else {                        prefix = '/direct ';
  }
  sendChat(script_name, prefix + html);
}

// Default Calendar Definitions
var defaults = {
  current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 },
  weekdays: ["Sul","Mol","Zol","Wir","Zor","Far","Sar"],
  months: [ // Seasons are canon. Colors chosen to match with the moons that share names.
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
    { name: "Tain Gala",                month: "all",  day: 6,       color: "#F7E7CE", source: "sharn" },           // Champagne Gold
    { name: "Crystalfall",              month: 2,      day: 9,       color: "#87CEEB", source: "sharn" },           // Sky blue
    { name: "The Day of Mourning",      month: 2,      day: 20,      color: "#808080", source: "khorvaire" },       // Dead gray mists
    { name: "Tira's Day",               month: 3,      day: 15,      color: "#F8F8FF", source: "silver flame" },    // Silver flame
    { name: "Sun's Blessing",           month: 3,      day: 15,      color: "#FFD700", source: "sovereign host" },  // Sun gold
    { name: "Aureon's Crown",           month: 5,      day: 26,      color: "#6A5ACD", source: "sovereign host" },  // Royal purple
    { name: "Brightblade",              month: 6,      day: 12,      color: "#B22222", source: "sovereign host" },  // Firebrick red
    { name: "The Race of Eight Winds",  month: 7,      day: 23,      color: "#20B2AA", source: "sharn" },           // Sky blue-green
    { name: "The Hunt",                 month: 8,      day: 4,       color: "#228B22", source: "sovereign host" },  // Forest green
    { name: "Fathen's Fall",            month: 8,      day: 25,      color: "#D8DDE0", source: "silver flame" },    // Silver flame
    { name: "Boldrei's Feast",          month: 9,      day: 9,       color: "#FFB347", source: "sovereign host" },  // Hearth orange
    { name: "The Ascension",            month: 10,     day: 1,       color: "#D8DDE0", source: "silver flame" },    // Silver flame
    { name: "Wildnight",                month: 10,     day: "18-19", color: "#8B0000", source: "dark six" },        // Dark red of the Fury
    { name: "Thronehold",               month: 11,     day: 11,      color: "#4169E1", source: "khorvaire" },       // Royal blue
    { name: "Long Shadows",             month: 12,     day: "26-28", color: "#0D0D0D" }                             // Midnight black
  ]
};

// ---- Color names + palette ----
var NAMED_COLORS = {
  // reds
  red:'#E53935',  scarlet:'#FF2400',  crimson:'#D81B60',  ruby:'#C2185B', maroon:'#800000', tomato:'#EF5350', coral:'#FF7043',  salmon:'#FA8072',
  // oranges / ambers
  orange:'#F4511E', amber:'#FFB300', apricot:'#FBCEB1', peach:'#FFCBA4',
  // yellows
  yellow:'#FDD835', gold:'#F6BF26', lemon:'#FFF44F', khaki:'#F0E68C',
  // limes / greens
  lime:'#7CB342', olive:'#C0CA33', green:'#43A047', forest:'#228B22', emerald:'#2E8B57',
  mint:'#66BB6A', jade:'#00A86B', chartreuse:'#7FFF00',
  // teals / cyans / aquas
  teal:'#00897B', turquoise:'#26A69A', aqua:'#00ACC1', cyan:'#29B6F6',
  // blues
  sky:'#039BE5', azure:'#1E88E5', blue:'#3949AB', navy:'#0D47A1', cobalt:'#0047AB',
  indigo:'#3949AB',
  // violets / purples
  violet:'#7E57C2', purple:'#5E35B1', plum:'#AB47BC', magenta:'#8E24AA', fuchsia:'#D81B60',
  lavender:'#E6E6FA', lilac:'#C8A2C8',
  // pinks / roses
  pink:'#EC407A', rose:'#D81B60', hotpink:'#FF69B4',
  // browns / tans
  brown:'#6D4C41', chocolate:'#795548', tan:'#8D6E63', espresso:'#5D4037',
  // grays
  slate:'#607D8B', steel:'#78909C', gray:'#9E9E9E', grey:'#9E9E9E', silver:'#C0C0C0',
  charcoal:'#36454F', smoke:'#708090',
  // black/white
  black:'#000000', white:'#FFFFFF', ivory:'#FFFFF0', snow:'#FFFAFA'
};

// A 32-color “box of markers/crayons” palette (distinct, readable)
var PALETTE = [
  '#E53935','#EF5350','#FF7043','#F4511E',
  '#FFB300','#F6BF26','#FDD835','#C0CA33',
  '#7CB342','#66BB6A','#43A047','#228B22',
  '#26A69A','#00897B','#00ACC1','#29B6F6',
  '#039BE5','#1E88E5','#3949AB','#0D47A1',
  '#5E35B1','#7E57C2','#8E24AA','#AB47BC',
  '#D81B60','#EC407A','#6D4C41','#8D6E63',
  '#795548','#5D4037','#607D8B','#78909C'
];

// === THEME + MONTHSET PRESETS ===============================================
var COLOR_THEMES = {
  seasonal: [
    "#F5F5FA","#FFC68A","#D3D3D3","#C0C0C0",
    "#E6E6FA","#FFD96B","#F5F5F5","#DCDCDC",
    "#9AC0FF","#696969","#FF4500","#A9A9A9"
  ],
  lunar: [
    "#F8F8FF","#B0E0E6","#DCDCDC","#D0D0E0",
    "#E0E0FF","#FFFACD","#F0F8FF","#E0E0E0",
    "#A7C7E7","#505A6B","#2F4F4F","#6E6E6E"
  ],
  neutral: [
    "#EEEEEE","#EAEAEA","#E6E6E6","#E2E2E2",
    "#DEDEDE","#DADADA","#D6D6D6","#D2D2D2",
    "#CECECE","#CACACA","#C6C6C6","#C2C2C2"
  ]
};

// Switchable month name sets (days/seasons unchanged). Replace names if you like.
var MONTH_NAME_SETS = {
  canonical: ["Zarantyr","Olarune","Therendor","Eyre","Dravago","Nymm","Lharvion","Barrakas","Rhaan","Sypheros","Aryth","Vult"],
  druidic:   ["Zarantyr","Olarune","Therendor","Eyre","Dravago","Nymm","Lharvion","Barrakas","Rhaan","Sypheros","Aryth","Vult"],
  dwarven:   ["Zarantyr","Olarune","Therendor","Eyre","Dravago","Nymm","Lharvion","Barrakas","Rhaan","Sypheros","Aryth","Vult"]
};

var LABELS = { era: 'YK', gmOnlyNotice: 'Only the GM can use that calendar command.' };
var STYLES = {
  table: 'border-collapse:collapse;margin:4px;',
  th:    'border:1px solid #444;padding:2px;width:2em;text-align:center;',
  head:  'border:1px solid #444;padding:0;',
  gmBtnWrap: 'margin:2px 0;',
  td:    'border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;',
  monthHeaderBase: 'padding:6px;text-align:left;'
};

/* ============================================================================
 * 2) STATE & SETTINGS
 * ==========================================================================*/
function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

function ensureSettings(){
  var root = state[state_name];
  root.settings = root.settings || {
    colorTheme: 'seasonal',
    monthSet: 'canonical',
    groupEventsBySource: true,
    showSourceLabels: true
  };
  return root.settings;
}

function getCal(){ return state[state_name].calendar; }

function titleCase(s){
  return String(s||'')
    .split(/\s+/).map(function(w){
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    }).join(' ');
}

function colorForMonth(mi){
  var st = ensureSettings();
  var pal = COLOR_THEMES[String(st.colorTheme||'').toLowerCase()];
  if (pal && pal[mi]) return pal[mi];
  var m = getCal().months[mi]; return (m && m.color) ? m.color : '#EEE';
}

function applyMonthSet(setName){
  var cal = getCal();
  var set = MONTH_NAME_SETS[String(setName||'').toLowerCase()];
  if (!set || set.length !== cal.months.length) return false;
  for (var i=0;i<cal.months.length;i++){
    cal.months[i].name = set[i];
  }
  return true;
}

function resetToDefaults(){
  delete state[state_name];
  state[state_name] = { calendar: deepClone(defaults) };
  checkInstall();
  sendChat(script_name, '/w gm Calendar state wiped and reset to defaults.');
  sendCurrentDate(null, true);
}

function checkInstall(){
  if(!state[state_name]) state[state_name] = {};
  ensureSettings();

  if(!state[state_name].calendar ||
     !Array.isArray(state[state_name].calendar.weekdays) ||
     !Array.isArray(state[state_name].calendar.months)){
    state[state_name].calendar = deepClone(defaults);
  }

  if (!state[state_name].suppressedDefaults) {
    state[state_name].suppressedDefaults = {}; // key → 1
  }
  if (!state[state_name].suppressedSources)  state[state_name].suppressedSources  = {};

  var cal = state[state_name].calendar;
  if (!cal.current) cal.current = { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 };

  if(!Array.isArray(cal.events)){
    // first install → expand defaults
    var lim = Math.max(1, cal.months.length);
    var out = [];
    deepClone(defaults.events).forEach(function(e){
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
          color: resolveColor(e.color) || null,
          source: (e.source != null) ? String(e.source) : null
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
        color: resolveColor(e.color) || null,
        source: (e.source != null) ? String(e.source) : null
      };
    });

    // apply default colors if missing
    var defColorByKey = {};
    var lim2 = Math.max(1, cal.months.length);
    defaults.events.forEach(function(de){
      var col = resolveColor(de.color) || null;
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
  // apply current month name set
  var s = ensureSettings();
  applyMonthSet(s.monthSet || 'canonical');

  // (re)build serial cache now that months are normalized
  _rebuildSerialCache();

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
      color: resolveColor(e.color) || null,
      source: (e.source != null) ? String(e.source) : null
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

// Small helper used all over when state changes
function refreshAndSend(){
  refreshCalendarState(true);
  sendCurrentDate(null, true);
}

/* ============================================================================
 * 3) COLOR UTILITIES
 * ==========================================================================*/
function sanitizeHexColor(s){
  if(!s) return null;
  var hex = String(s).trim().replace(/^#/, '');
  if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
  if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
  return null;
}
function resolveColor(s){
  if (!s) return null;
  var hex = sanitizeHexColor(s);
  if (hex) return hex;
  var key = String(s).trim().toLowerCase();
  return NAMED_COLORS[key] || null;
}
function _stableHash(str){
  var h = 5381; str = String(str||'');
  for (var i=0;i<str.length;i++){ h = ((h<<5)+h) + str.charCodeAt(i); h|=0; }
  return Math.abs(h);
}
function autoColorForEvent(e){ return PALETTE[_stableHash(e && e.name) % PALETTE.length]; }
function getEventColor(e){ return resolveColor(e && e.color) || autoColorForEvent(e) || EVENT_DEFAULT_COLOR; }

function _normalizeCols(cols){
  cols = (cols || []).map(resolveColor).filter(Boolean);
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
function textColorForBg(bgHex){ return _contrast(bgHex, '#000') >= _contrast(bgHex, '#fff') ? '#000' : '#fff'; }
function _pickTextAndWorst(cols){
  var minB = Infinity, minW = Infinity, worstB = 0, worstW = 0;
  for (var i=0;i<cols.length;i++){
    var cB = _contrast(cols[i], '#000'); if (cB < minB){ minB = cB; worstB = i; }
    var cW = _contrast(cols[i], '#fff'); if (cW < minW){ minW = cW; worstW = i; }
  }
  var close = Math.abs(minB - minW) < 0.4;
  if (close || (minB >= CONTRAST_MIN_CELL && minW >= CONTRAST_MIN_CELL)){
    return { text:'#fff', worstBg:cols[worstW], minContrast:minW };
  }
  return (minB >= minW)
    ? { text:'#000', worstBg:cols[worstB], minContrast:minB }
    : { text:'#fff', worstBg:cols[worstW], minContrast:minW };
}
function outlineIfNeededMin(textColor, bgHex, minTarget){
  var ratio = _contrast(bgHex, textColor);
  if (ratio >= (minTarget||CONTRAST_MIN_HEADER)) return '';
  if (textColor === '#fff'){
    var off = 1;
    return 'text-shadow:'+(-off)+'px '+(-off)+'px 0 rgba(0,0,0,.95),'+(off)+'px '+(-off)+'px 0 rgba(0,0,0,.95),'+(-off)+'px '+(off)+'px 0 rgba(0,0,0,.95),'+(off)+'px '+(off)+'px 0 rgba(0,0,0,.95);';
  } else {
    var off2 = .5;
    return 'text-shadow:'+(-off2)+'px '+(-off2)+'px 0 rgba(255,255,255,.70),'+(off2)+'px '+(-off2)+'px 0 rgba(255,255,255,.70),'+(-off2)+'px '+(off2)+'px 0 rgba(255,255,255,.70),'+(off2)+'px '+(off2)+'px 0 rgba(255,255,255,.70);';
  }
}
function applyBg(style, bgHex, minTarget){
  var t = textColorForBg(bgHex);
  style += 'background-color:'+bgHex+';';
  style += 'background-clip:padding-box;';
  style += 'color:'+t+';';
  style += outlineIfNeededMin(t, bgHex, (minTarget||CONTRAST_MIN_HEADER));
  return style;
}
function styleForGradient(style, cols, minTarget){
  cols = _normalizeCols(cols);
  var uniq = _uniqueCols(cols);
  if (uniq.length === 1){ return applyBg(style, uniq[0], (minTarget||CONTRAST_MIN_CELL)); }
  var pick = _pickTextAndWorst(cols);
  style += 'background-color:'+cols[0]+';';
  style += 'background-image:'+_gradientFor(cols)+';';
  style += 'background-repeat:no-repeat;background-size:100% 100%;';
  style += 'background-clip:padding-box;';
  style += 'color:'+pick.text+';';
  style += outlineIfNeededMin(pick.text, pick.worstBg, (minTarget||CONTRAST_MIN_CELL));
  return style;
}

/* ============================================================================
 * 4) DATE / SERIAL MATH  (with caching)
 * ==========================================================================*/
var _serialCache = { dpy:null, prefix:[] };
function _rebuildSerialCache(){
  var months = getCal().months, run=0;
  _serialCache.prefix = [];
  for (var i=0;i<months.length;i++){ _serialCache.prefix[i]=run; run += (parseInt(months[i].days,10)||0); }
  _serialCache.dpy = run;
}
function daysPerYear(){ if(_serialCache.dpy==null) _rebuildSerialCache(); return _serialCache.dpy|0; }
function monthPrefixDays(mi){ if(_serialCache.dpy==null) _rebuildSerialCache(); return _serialCache.prefix[mi]|0; }

function toSerial(y, mi, d){ return (y * daysPerYear()) + monthPrefixDays(mi) + ((parseInt(d,10)||1) - 1); }

function weekdayIndex(y, mi, d){
  var cal=getCal(), cur=cal.current, wdlen=cal.weekdays.length;
  var delta = toSerial(y, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
  return (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen;
}
function weekdayIndexForYear(y, mi, d){ return weekdayIndex(y, mi, d); }

// Start-of-week helper
function weekStartSerial(y, mi, d){
  var wd = weekdayIndexForYear(y, mi, d); // 0..6 starting on Sul
  var s = toSerial(y, mi, d);
  return s - wd;
}

// Serial→date
function fromSerial(s){
  var dpy = daysPerYear();
  var y = Math.floor(s/dpy);
  var rem = s - y*dpy;
  var months = getCal().months;
  var mi = 0;
  while (mi < months.length - 1 && rem >= (months[mi].days|0)) {
    rem -= (months[mi].days|0);
    mi++;
  }
  return { year:y, mi:mi, day:(rem|0)+1 };
}

// --- Row/day utilities for boundary strips -----------------------------------
function _rowDaysInMonth(y, mi, rowStart){
  var cal = getCal(), wdCount = cal.weekdays.length|0, out = [];
  for (var c=0; c<wdCount; c++){
    var d = fromSerial(rowStart + c);
    if (d.year === y && d.mi === mi) out.push(d.day);
  }
  return out;
}
function _setAddAll(setObj, arr){
  for (var i=0;i<arr.length;i++) setObj[arr[i]] = 1;
}
function _setCount(setObj){ return Object.keys(setObj).length; }
function _setMin(setObj){
  var keys = Object.keys(setObj).map(function(k){return +k;});
  return keys.length ? Math.min.apply(null, keys) : null;
}
function _setMax(setObj){
  var keys = Object.keys(setObj).map(function(k){return +k;});
  return keys.length ? Math.max.apply(null, keys) : null;
}

// Render a month "strip" using an explicit set of day numbers for that month.
// Cells not in the set stay empty, but the table keeps weekday geometry.
function renderMonthStripWantedDays(year, mi, wantedSet, dimPast){
  var parts = monthTableOpen(mi, year);      // month header + weekday header
  var html  = [parts.html];
  var wdCnt = getCal().weekdays.length|0;

  var minD = _setMin(wantedSet), maxD = _setMax(wantedSet);
  if (minD == null || maxD == null){
    html.push('<tr><td colspan="'+wdCnt+'" style="'+STYLES.td+';opacity:.6;">(no days)</td></tr>');
    html.push(monthTableClose());
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
        var ctx = makeDayCtx(d.year, d.mi, d.day, /*dimPast*/!!dimPast);
        html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.td, ''));
      } else {
        html.push('<td style="'+STYLES.td+'"></td>');
      }
    }
    html.push('</tr>');
  }
  html.push(monthTableClose());
  return html.join('');
}

// Compute the "wanted day" sets for boundary strips based on proximity to range.
// Returns { prev: {y,mi,wanted:Set} | null, next: {y,mi,wanted:Set} | null }
function computeBoundaryWantedDays(spec){
  var cal = getCal(), today = todaySerial();
  var res = { prev:null, next:null };
  var wdCnt = cal.weekdays.length|0;

  // PREPEND side: today <= 5 days BEFORE start → use previous month
  if (today < spec.start && (spec.start - today) <= 5){
    var startD = fromSerial(spec.start);
    var prevMi = (startD.mi + cal.months.length - 1) % cal.months.length;
    var prevY  = startD.year - (startD.mi === 0 ? 1 : 0);
    var prevMD = cal.months[prevMi].days|0;

    var tD = fromSerial(today);
    // "today" should indeed be in that previous month; if not, clamp to that month’s last day
    var todayDay = (tD.year === prevY && tD.mi === prevMi) ? tD.day : prevMD;

    var todayRow = weekStartSerial(prevY, prevMi, todayDay);
    var lastRow  = weekStartSerial(prevY, prevMi, prevMD);

    var wanted = {};
    // include all rows from the week containing 'today' through the last row
    for (var row = todayRow; row <= lastRow; row += wdCnt){
      _setAddAll(wanted, _rowDaysInMonth(prevY, prevMi, row));
    }
    // ensure >= 5 days: if not, add rows *before* the today row
    var backRow = todayRow - wdCnt, safety = 0;
    while (_setCount(wanted) < 5 && safety++ < 6){
      var extra = _rowDaysInMonth(prevY, prevMi, backRow);
      if (!extra.length) break;
      _setAddAll(wanted, extra);
      backRow -= wdCnt;
    }
    res.prev = { y:prevY, mi:prevMi, wanted:wanted };
  }

  // APPEND side: today <= 5 days AFTER end → use next month
  if (today > spec.end && (today - spec.end) <= 5){
    var endD = fromSerial(spec.end);
    var nextMi = (endD.mi + 1) % cal.months.length;
    var nextY  = endD.year + (nextMi === 0 ? 1 : 0);
    var nextMD = cal.months[nextMi].days|0;

    var firstRow = weekStartSerial(nextY, nextMi, 1);

    var tD2 = fromSerial(today);
    var todayRow2 = (tD2.year === nextY && tD2.mi === nextMi)
      ? weekStartSerial(nextY, nextMi, tD2.day)
      : firstRow;

    var wanted2 = {};
    // include first row after range through the week containing today
    for (var row2 = firstRow; row2 <= todayRow2; row2 += wdCnt){
      _setAddAll(wanted2, _rowDaysInMonth(nextY, nextMi, row2));
    }
    // ensure >=5 days: extend forward if needed
    var fwdRow = todayRow2 + wdCnt, safety2 = 0;
    while (_setCount(wanted2) < 5 && safety2++ < 6){
      var extra2 = _rowDaysInMonth(nextY, nextMi, fwdRow);
      if (!extra2.length) break;
      _setAddAll(wanted2, extra2);
      fwdRow += wdCnt;
    }
    res.next = { y:nextY, mi:nextMi, wanted:wanted2 };
  }

  return res;
}


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

/* ============================================================================
 * 5) PARSING & FUZZY MATCHING
 * ==========================================================================*/
function _asciiFold(s){
  var str = String(s || '');
  return (typeof str.normalize === 'function')
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : str;
}
function _normAlpha(s){
  return _asciiFold(String(s||'').toLowerCase()).replace(/[^a-z]/g,'');
}
function _levenshtein(a,b){
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
      curr[j]=Math.min(prev[j]+1, curr[j-1]+1, prev[j-1]+cost);
    }
    var t=prev; prev=curr; curr=t;
  }
  return prev[n];
}

// Common short forms / frequent typos you might see in play chat.
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
function monthIndexByName(tok){
  var cal = getCal();
  if (!tok) return -1;
  var s = String(tok).toLowerCase();
  for (var i=0;i<cal.months.length;i++){
    var nm = String(cal.months[i].name||'').toLowerCase();
    if (nm===s || nm.indexOf(s)===0) return i;
  }
  var ntok = _normAlpha(tok);
  var syn = MONTH_SYNONYMS[ntok];
  if (syn){
    var nsyn = _normAlpha(syn);
    for (var j=0;j<cal.months.length;j++){
      var norm = _normAlpha(cal.months[j].name||'');
      if (norm===nsyn) return j;
    }
  }
  var names = cal.months.map(function(m){ return String(m.name||''); });
  var norm = names.map(function(n){ return _normAlpha(n); });
  var bestIdx=-1,bestDist=1e9;
  for (var t=0;t<norm.length;t++){
    var d = _levenshtein(ntok, norm[t]);
    if (norm[t].indexOf(ntok)===0) d = Math.min(d,1);
    if (d<bestDist){ bestDist=d; bestIdx=t; }
  }
  var len = ntok.length;
  var maxDist = (len<=3) ? 1 : (len<=5 ? 2 : 3);
  return (bestDist<=maxDist) ? bestIdx : -1;
}

// ---------- Labels & styles helpers ----------
function _applyTodayStyle(style){
  style += 'position:relative;z-index:10;';
  style += 'border-radius:2px;';
  style += 'box-shadow:0 3px 8px rgba(0,0,0,0.65),0 12px 24px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.18);';
  style += 'outline:2px solid rgba(0,0,0,0.35);outline-offset:1px;';
  style += 'box-sizing:border-box;overflow:visible;font-weight:bold;font-size:1.2em;';
  return style;
}

/* ============================================================================
 * 6) EVENTS MODEL
 * ==========================================================================*/
function eventDisplayName(e){
  var base = String(e && e.name || '').trim();
  if (!base) return '';
  var src = (e && e.source!=null) ? titleCase(String(e.source)) : null;
  return src ? (base + ' (' + src + ')') : base;
}
function eventKey(e){ var y = (e.year==null)?'ALL':String(e.year|0); return (e.month|0)+'|'+String(e.day)+'|'+y+'|'+String(e.name||'').trim().toLowerCase(); }
function defaultKeyFor(monthHuman, daySpec, name){ return (monthHuman|0)+'|'+String(daySpec)+'|ALL|'+String(name||'').trim().toLowerCase(); }

function compareEvents(a, b){
  var ya = (a.year==null)? -Infinity : (a.year|0);
  var yb = (b.year==null)? -Infinity : (b.year|0);
  if (ya !== yb) return ya - yb;
  var am = (+a.month||1), bm = (+b.month||1);
  if (am !== bm) return am - bm;
  return firstNumFromDaySpec(a.day) - firstNumFromDaySpec(b.day);
}

function currentDefaultKeySet(cal){
  var lim = Math.max(1, cal.months.length);
  var out = {};
  deepClone(defaults.events).forEach(function(de){
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

function isDefaultEvent(ev){
  var calLocal = getCal();
  var defaultsSet = currentDefaultKeySet(calLocal);
  var maxD = calLocal.months[ev.month-1].days|0;
  var norm = normalizeDaySpec(ev.day, maxD) || String(firstNumFromDaySpec(ev.day));
  var k = defaultKeyFor(ev.month, norm, ev.name);
  return !!defaultsSet[k];
}
function markSuppressedIfDefault(ev){
  if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
  if (isDefaultEvent(ev)){
    var calLocal = getCal();
    var maxD = calLocal.months[ev.month-1].days|0;
    var norm = normalizeDaySpec(ev.day, maxD) || String(firstNumFromDaySpec(ev.day));
    var k = defaultKeyFor(ev.month, norm, ev.name);
    state[state_name].suppressedDefaults[k] = 1;
  }
}

function mergeInNewDefaultEvents(cal){
  var lim = Math.max(1, cal.months.length);
  var suppressed = state[state_name].suppressedDefaults || {};
  var suppressedSources = state[state_name].suppressedSources || {};

  var have = {};
  cal.events.forEach(function(e){
    var yKey = (e.year==null) ? 'ALL' : (e.year|0);
    have[(e.month|0)+'|'+String(e.day)+'|'+yKey+'|'+String(e.name||'').trim().toLowerCase()] = 1;
  });

  deepClone(defaults.events).forEach(function(de){
    var src = (de.source != null) ? String(de.source).toLowerCase() : null;
    if (src && suppressedSources[src]) return;

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
          color: resolveColor(de.color) || null,
          source: (de.source != null) ? String(de.source) : null
        });
        have[key] = 1;
      }
    });
  });

  cal.events.sort(compareEvents);
}

function _addConcreteEvent(monthHuman, daySpec, yearOrNull, name, color){
  var cal = getCal();
  var m = clamp(monthHuman, 1, cal.months.length);
  var maxD = cal.months[m-1].days|0;
  var normDay = normalizeDaySpec(daySpec, maxD);
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
    if (makeDayMatcher(e.day)(day)) out.push(e);
  }
  return out;
}

/* ============================================================================
 * 7) RENDERING
 * ==========================================================================*/
// helpers
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
function isColorToken(tok){ return !!resolveColor(tok); }
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

function swatchHtml(colLike){
  var col = resolveColor(colLike) || EVENT_DEFAULT_COLOR;
  return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:'+esc(col)+';" title="'+esc(col)+'"></span>';
}
function sendToAll(html){ send({ broadcast:true }, html); }
function sendToGM(html){  send({ gmOnly:true }, html); }
function whisper(to, html){ send({ to:to }, html); }
function warnGM(msg){ sendChat(script_name, '/w gm ' + msg); }


// --- Day context + cell renderer (DRY for both full grids and week strips) ---
function makeDayCtx(y, mi, d, dimPast){
  var ser = toSerial(y, mi, d);
  var tSer = todaySerial();
  var evts = getEventsFor(mi, d, y);
  var label = formatDateLabel(y, mi, d, true);
  if (evts.length){ label += ': ' + evts.map(function(e){ return eventDisplayName(e); }).join(', '); }
  return {
    y:y, mi:mi, d:d, serial:ser,
    isToday: (ser === tSer),
    isPast:  !!dimPast && (ser < tSer),
    events:  evts,
    title:   label
  };
}
function tdHtmlForDay(ctx, monthColor, baseStyle, numeralStyle){
  var style = styleForDayCell(baseStyle, ctx.events, ctx.isToday, monthColor, ctx.isPast);
  var titleAttr = ' title="'+esc(ctx.title)+'" aria-label="'+esc(ctx.title)+'"';
  var numWrap = '<div'+(numeralStyle ? ' style="'+numeralStyle+'"' : '')+'>'+ctx.d+'</div>';
  return '<td'+titleAttr+' style="'+style+'">'+numWrap+'</td>';
}

// ---- Cell styling for a single day (renamed param to eventsToday) ----------
function styleForDayCell(baseStyle, eventsToday, isToday, monthColor, isPast){
  var style = baseStyle;
  if (eventsToday.length >= 2){
    style = styleForGradient(style, eventsToday.slice(0,3).map(getEventColor), CONTRAST_MIN_CELL);
  } else if (eventsToday.length === 1){
    style = applyBg(style, getEventColor(eventsToday[0]), CONTRAST_MIN_CELL);
  } else if (isToday){
    style = applyBg(style, monthColor, CONTRAST_MIN_CELL);
  }
  if (isPast) style += 'opacity:.65;';
  if (isToday) style = _applyTodayStyle(style);
  return style;
}

// ---------- Month/Year tables ----------
function monthTableOpen(mi, yearLabel){
  var cal = getCal(), cur = cal.current, mObj = cal.months[mi];
  var monthColor = colorForMonth(mi);
  var textColor = textColorForBg(monthColor);
  var outline = outlineIfNeededMin(textColor, monthColor, CONTRAST_MIN_HEADER);
  var wd = cal.weekdays;

  var head = [
    '<table style="'+STYLES.table+'">',
    '<tr><th colspan="7" style="'+STYLES.head+'">',
      '<div style="'+STYLES.monthHeaderBase+'background-color:'+monthColor+';color:'+textColor+';'+outline+'">',
        esc(mObj.name),
        '<span style="float:right;">'+esc(String(yearLabel!=null?yearLabel:cur.year))+' '+LABELS.era+'</span>',
      '</div>',
    '</th></tr>',
    '<tr>'+ wd.map(function(d){ return '<th style="'+STYLES.th+'">'+esc(d)+'</th>'; }).join('') +'</tr>'
  ].join('');

  return { html: head, monthColor: monthColor };
}
function monthTableClose(){ return '</table>'; }

<<<<<<< Updated upstream
=======
// ---- Unified month renderer ---------------------------------------------------
// opts: { year, mi, mode:'full'|'week', weekStartSerial?:number, dimPast?:boolean }
>>>>>>> Stashed changes
function renderMonthTable(opts){
  var cal = getCal(), cur = cal.current;
  var y   = (opts && typeof opts.year === 'number') ? (opts.year|0) : cur.year;
  var mi  = (opts && typeof opts.mi   === 'number') ? (opts.mi|0)   : cur.month;
  var mode    = (opts && opts.mode) || 'full';
  var dimPast = !!(opts && opts.dimPast);

  var mdays = cal.months[mi].days|0;
<<<<<<< Updated upstream
  var parts = monthTableOpen(mi, y);
=======
  var parts = monthTableOpen(mi, y);  // keeps your header + weekday row
>>>>>>> Stashed changes
  var html  = [parts.html];

  if (mode === 'full'){
    // Build a 6x7 grid anchored at the first week row that contains day 1
    var gridStart = weekStartSerial(y, mi, 1);
    var printed = 0;
    for (var r=0; r<6; r++){
      html.push('<tr>');
      for (var c=0; c<7; c++){
        var s = gridStart + r*7 + c;
<<<<<<< Updated upstream
        var d = fromSerial(s);
        if (d.year === y && d.mi === mi){
          var ctx = makeDayCtx(y, mi, d.day, dimPast);
          html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.td, ''));
          printed++;
        } else {
=======
        var d = fromSerial(s); // {year, mi, day}
        if (d.year === y && d.mi === mi){
          var ctx = makeDayCtx(y, mi, d.day, dimPast);
          html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.td, /*numeralStyle*/''));
          printed++;
        } else {
          // Outside this month → empty cell (keeps table geometry)
>>>>>>> Stashed changes
          html.push('<td style="'+STYLES.td+'"></td>');
        }
      }
      html.push('</tr>');
<<<<<<< Updated upstream
      if (printed >= mdays) break;
=======
      if (printed >= mdays) break; // stop after we've placed all real days
>>>>>>> Stashed changes
    }
    html.push(monthTableClose());
    return html.join('');
  }
<<<<<<< Updated upstream

  // mode === 'week'
  var startSer = (opts && typeof opts.weekStartSerial === 'number')
    ? (opts.weekStartSerial|0)
    : weekStartSerial(y, mi, 1);

  html.push('<tr>');
  for (var i=0; i<7; i++){
    var s2 = startSer + i;
    var d2 = fromSerial(s2);
    var ctx2 = makeDayCtx(d2.year, d2.mi, d2.day, dimPast);
    var numeralStyle = (d2.mi === mi) ? '' : 'opacity:.5;';
    html.push(tdHtmlForDay(ctx2, parts.monthColor, STYLES.td, numeralStyle));
  }
  html.push('</tr>', monthTableClose());
  return html.join('');
}

function renderMiniCal(mi, yearLabel, dimPast){
  var y = (typeof yearLabel === 'number') ? yearLabel : getCal().current.year;
  return renderMonthTable({ year:y, mi:mi, mode:'full', dimPast: !!dimPast });
}
function renderMonthEdgeStrip(year, mi, which, dimPast){
  var start = _edgeWeekStart(year, mi, which);
  return renderMonthTable({ year:year, mi:mi, mode:'week', weekStartSerial:start, dimPast: !!dimPast });
}

function currentMonthHTML(){ return renderMiniCal(getCal().current.month, null, true); }

function yearHTMLFor(targetYear, dimPast){
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    html.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' + renderMiniCal(i, targetYear, !!dimPast) + '</div>');
  }
  html.push('</div>');
  return html.join('');
}

// ---------- Event listings & month side-list ----------
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
    var swatch = swatchHtml(getEventColor(e));
    rows.push('<div' + (isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"') +
              '>' + swatch + mName + ' ' + dayLabel + ': ' + esc(eventDisplayName(e)) + '</div>');
  });
  return rows.join('');
}

// Shared row renderer for event listings
function eventLineHtml(y, mi, d, name, includeYear, isToday, color){
  var dateLbl = formatDateLabel(y, mi, d, includeYear);
  var sw = swatchHtml(color);
  var sty = isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"';
  return '<div'+sty+'>'+ sw + ' ' + dateLbl + ': ' + esc(name) + '</div>';
=======

  // mode === 'week'
  var startSer = (opts && typeof opts.weekStartSerial === 'number')
    ? (opts.weekStartSerial|0)
    : weekStartSerial(y, mi, 1); // default to the first week strip if not provided

  html.push('<tr>');
  for (var i=0; i<7; i++){
    var s = startSer + i;
    var d = fromSerial(s);
    var ctx = makeDayCtx(d.year, d.mi, d.day, dimPast);
    // If the date doesn't belong to the header's month, soften the numeral
    var numeralStyle = (d.mi === mi) ? '' : 'opacity:.5;';
    html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.td, numeralStyle));
  }
  html.push('</tr>', monthTableClose());
  return html.join('');
}

// Tiny helpers for edge strips
function _edgeWeekStart(y, mi, which){
  var cal = getCal(), md = cal.months[mi].days|0;
  return (which === 'prev') ? weekStartSerial(y, mi, md) : weekStartSerial(y, mi, 1);
}

function renderMonthEdgeStrip(year, mi, which, dimPast){
  var start = _edgeWeekStart(year, mi, which);
  return renderMonthTable({ year:year, mi:mi, mode:'week', weekStartSerial:start, dimPast: !!dimPast });
}

function currentMonthHTML(){
  var spec = parseUnifiedRange(['month']);
  return buildCalendarsHtmlForSpec(spec);
}

function expandRangeWithRecentPast(spec){
  var cur = getCal().current;
  // Always include the previous 5 days in event *lists* (doesn't affect calendar tiles)
  var baseBack = 5;
  var extra = (cur.day_of_the_week <= 4) ? 7 : 0;
  var back = baseBack + extra;
  var start = Math.min(spec.start, todaySerial() - back);
  return { title: spec.title, start: start, end: spec.end, months: spec.months };
>>>>>>> Stashed changes
}
// === [ADDED] Day Spec utilities (single source of truth) =====================
var daySpec = {
  normalize: function(spec, maxDays){
    var s = String(spec||'').trim();
    if (/^\d+$/.test(s)){ return String(clamp(s, 1, maxDays)); }
    var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m){
      var a = clamp(m[1], 1, maxDays), b = clamp(m[2], 1, maxDays);
      if (a > b){ var t=a; a=b; b=t; }
      return a <= b ? (a+'-'+b) : null;
    }
    return null;
  },
  expand: function(spec, maxDays){
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
  },
  matches: function(spec){
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
  },
  startDayOf: function(spec){
    if (typeof spec === 'number') return spec|0;
    var s = String(spec||'').trim();
    var m = s.match(/^\s*(\d+)/);
    return m ? Math.max(1, parseInt(m[1],10)) : 1;
  }
};

// ---- [RENAMED] Human-like names + compatibility aliases ---------------------
function normalizeDay(spec, maxDays){ return daySpec.normalize(spec, maxDays); }
function expandDay(spec, maxDays){ return daySpec.expand(spec, maxDays); }
function matchesDay(spec){ return daySpec.matches(spec); }
function startDayOf(spec){ return daySpec.startDayOf(spec); }

// Back-compat (old names) — keep the code working without touching call sites:
function normalizeDaySpec(spec, maxDays){ return normalizeDay(spec, maxDays); }
function expandDaySpec(spec, maxDays){ return expandDay(spec, maxDays); }
function makeDayMatcher(spec){ return matchesDay(spec); }
function firstNumFromDaySpec(spec){ return startDayOf(spec); }

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
function stripRangeExtensionDynamic(spec){
  var months = _monthsFromRangeSpec(spec);
  var present = {};
  for (var i=0;i<months.length;i++) present[ months[i].y + '|' + months[i].mi ] = 1;

  var boundary = computeBoundaryWantedDays(spec);
  var start = spec.start, end = spec.end;

  if (boundary.prev && !present[ boundary.prev.y + '|' + boundary.prev.mi ]){
    var minPrev = _setMin(boundary.prev.wanted);
    var maxPrev = _setMax(boundary.prev.wanted);
    if (minPrev != null && maxPrev != null){
      var sPrev = toSerial(boundary.prev.y, boundary.prev.mi, minPrev);
      var ePrev = toSerial(boundary.prev.y, boundary.prev.mi, maxPrev);
      start = Math.min(start, sPrev);
      end   = Math.max(end,   ePrev);
    }
  }
  if (boundary.next && !present[ boundary.next.y + '|' + boundary.next.mi ]){
    var minNext = _setMin(boundary.next.wanted);
    var maxNext = _setMax(boundary.next.wanted);
    if (minNext != null && maxNext != null){
      var sNext = toSerial(boundary.next.y, boundary.next.mi, minNext);
      var eNext = toSerial(boundary.next.y, boundary.next.mi, maxNext);
      start = Math.min(start, sNext);
      end   = Math.max(end,   eNext);
    }
  }

  if (start !== spec.start || end !== spec.end) return { start:start, end:end };
  return null;
}


function formatDateLabel(y, mi, d, includeYear){
  var cal=getCal();
  var lbl = esc(cal.months[mi].name)+' '+d;
  if (includeYear) lbl += ', '+esc(String(y))+' '+LABELS.era;
  return lbl;
}

// BUGFIXED: non-grouped branch now uses correct vars
function eventsListHTMLForRange(title, startSerial, endSerial, forceYearLabel){
  var st = ensureSettings();
  var today = todaySerial();
  var occ = occurrencesInRange(startSerial, endSerial);
  var includeYear = forceYearLabel || (Math.floor(startSerial/daysPerYear()) !== Math.floor(endSerial/daysPerYear()));
  var out = ['<div style="margin:4px 0;"><b>'+esc(title)+'</b></div>'];
  if (!occ.length){
    out.push('<div style="opacity:.7;">No events in this range.</div>');
    return out.join('');
  }

  if (!st.groupEventsBySource){
    for (var i=0;i<occ.length;i++){
      var o = occ[i];
      var name2 = eventDisplayName(o.e);
      out.push(eventLineHtml(o.y, o.m, o.d, name2, includeYear, (o.serial===today), getEventColor(o.e)));
    }
    return out.join('');
  }

  // Group by source label
  var groups = {}; var order = [];
  for (var k=0;k<occ.length;k++){
    var o2 = occ[k];
    var key = (o2.e && o2.e.source!=null) ? titleCase(String(o2.e.source)) : 'Other';
    if (!groups[key]){ groups[key] = []; order.push(key); }
    groups[key].push(o2);
  }
  order.sort(function(a,b){ return a.localeCompare(b); });

  for (var g=0; g<order.length; g++){
    var label = order[g];
    out.push('<div style="margin-top:6px;font-weight:bold;">'+esc(label)+'</div>');
    var arr = groups[label];
    for (var j=0;j<arr.length;j++){
      var o3 = arr[j];
      var name3 = eventDisplayName(o3.e);
      out.push(eventLineHtml(o3.y, o3.m, o3.d, name3, includeYear, (o3.serial===today), getEventColor(o3.e)));
    }
  }
  return out.join('');
}

// ---------- Range → months + rendering bundles ----------
function _monthsFromRangeSpec(spec){
  if (spec.months && spec.months.length) return spec.months.slice();
  var months = [], dpy=daysPerYear(), cal=getCal(), firstY=Math.floor(spec.start/dpy), lastY=Math.floor(spec.end/dpy);
  for (var y=firstY; y<=lastY; y++){
    for (var mi=0; mi<cal.months.length; mi++){
      var s = toSerial(y, mi, 1), e = toSerial(y, mi, cal.months[mi].days);
      if (e < spec.start) continue;
      if (s > spec.end) break;
      months.push({y:y, mi:mi});
    }
  }
  return months;
}

function buildCalendarsHtmlForSpec(spec){
  var months = _monthsFromRangeSpec(spec);
  var out = ['<div style="text-align:left;">'];

<<<<<<< Updated upstream
  var present = {};
  for (var i=0; i<months.length; i++){
    present[ months[i].y + '|' + months[i].mi ] = 1;
  }

  var cur = getCal().current;
  var todaySer = todaySerial();
  var dimPast = (todaySer >= spec.start && todaySer <= spec.end);

  for (var i2=0; i2<months.length; i2++){
    var m = months[i2];
    var isCurrentMonth = (m.y === cur.year && m.mi === cur.month);
=======
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
  var col = resolveColor(color) || null;
  var e = { name: String(name||''), month: m, day: normDay, year: (yearOrNull==null? null : (yearOrNull|0)), color: col };
  var key = eventKey(e);
  var exists = cal.events.some(function(ev){ return eventKey(ev)===key; });
  if (exists) return false;
  cal.events.push(e);
  cal.events.sort(compareEvents);
  return true;
}

function parseIntSafe(x){ var n=parseInt(x,10); return isFinite(n)?n:null; }
function isListToken(tok){ return /^all$/i.test(tok) || /^[0-9,\-\s]+$/.test(tok); }
>>>>>>> Stashed changes

    if (isCurrentMonth && cur.day_of_the_month <= 5){
      var prevMi = (cur.month + getCal().months.length - 1) % getCal().months.length;
      var prevY  = cur.year - (cur.month === 0 ? 1 : 0);
      if (!present[prevY + '|' + prevMi]){
        out.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' +
                 renderMonthEdgeStrip(prevY, prevMi, 'prev', dimPast) + '</div>');
      }
    }

    out.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' +
             renderMonthTable({ year:m.y, mi:m.mi, mode:'full', dimPast: dimPast }) + '</div>');

    if (isCurrentMonth){
      var mdays = getCal().months[cur.month].days|0;
      if (cur.day_of_the_month >= mdays - 4){
        var nextMi = (cur.month + 1) % getCal().months.length;
        var nextY  = cur.year + (nextMi === 0 ? 1 : 0);
        if (!present[nextY + '|' + nextMi]){
          out.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' +
                   renderMonthEdgeStrip(nextY, nextMi, 'next', dimPast) + '</div>');
        }
      }
    }
  }

  out.push('</div>');
  return out.join('');
}

// --- Row/day utilities for boundary strips -----------------------------------
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
function _setMin(setObj){
  var keys = Object.keys(setObj).map(function(k){return +k;});
  return keys.length ? Math.min.apply(null, keys) : null;
}
function _setMax(setObj){
  var keys = Object.keys(setObj).map(function(k){return +k;});
  return keys.length ? Math.max.apply(null, keys) : null;
}

<<<<<<< Updated upstream
function _edgeWeekStart(y, mi, which){
  var cal = getCal(), md = cal.months[mi].days|0;
  return (which === 'prev') ? weekStartSerial(y, mi, md) : weekStartSerial(y, mi, 1);
}
function computeBoundaryWantedDays(spec){
  var cal = getCal(), today = todaySerial();
  var res = { prev:null, next:null };
  var wdCnt = cal.weekdays.length|0;

  if (today < spec.start && (spec.start - today) <= 5){
    var startD = fromSerial(spec.start);
    var prevMi = (startD.mi + cal.months.length - 1) % cal.months.length;
    var prevY  = startD.year - (startD.mi === 0 ? 1 : 0);
    var prevMD = cal.months[prevMi].days|0;

    var tD = fromSerial(today);
    var todayDay = (tD.year === prevY && tD.mi === prevMi) ? tD.day : prevMD;

    var todayRow = weekStartSerial(prevY, prevMi, todayDay);
    var lastRow  = weekStartSerial(prevY, prevMi, prevMD);

    var wanted = {};
    for (var row = todayRow; row <= lastRow; row += wdCnt){
      _setAddAll(wanted, _rowDaysInMonth(prevY, prevMi, row));
    }
    var backRow = todayRow - wdCnt, safety = 0;
    while (_setCount(wanted) < 5 && safety++ < 6){
      var extra = _rowDaysInMonth(prevY, prevMi, backRow);
      if (!extra.length) break;
      _setAddAll(wanted, extra);
      backRow -= wdCnt;
    }
    res.prev = { y:prevY, mi:prevMi, wanted:wanted };
  }

  if (today > spec.end && (today - spec.end) <= 5){
    var endD = fromSerial(spec.end);
    var nextMi = (endD.mi + 1) % cal.months.length;
    var nextY  = endD.year + (nextMi === 0 ? 1 : 0);
    var nextMD = cal.months[nextMi].days|0;

    var firstRow = weekStartSerial(nextY, nextMi, 1);

    var tD2 = fromSerial(today);
    var todayRow2 = (tD2.year === nextY && tD2.mi === nextMi)
      ? weekStartSerial(nextY, nextMi, tD2.day)
      : firstRow;

    var wanted2 = {};
    for (var row2 = firstRow; row2 <= todayRow2; row2 += wdCnt){
      _setAddAll(wanted2, _rowDaysInMonth(nextY, nextMi, row2));
    }
    var fwdRow = todayRow2 + wdCnt, safety2 = 0;
    while (_setCount(wanted2) < 5 && safety2++ < 6){
      var extra2 = _rowDaysInMonth(nextY, nextMi, fwdRow);
      if (!extra2.length) break;
      _setAddAll(wanted2, extra2);
      fwdRow += wdCnt;
    }
    res.next = { y:nextY, mi:nextMi, wanted:wanted2 };
  }

  return res;
}
function stripRangeExtensionDynamic(spec){
  var months = _monthsFromRangeSpec(spec);
  var present = {};
  for (var i=0;i<months.length;i++) present[ months[i].y + '|' + months[i].mi ] = 1;

  var boundary = computeBoundaryWantedDays(spec);
  var start = spec.start, end = spec.end;

  if (boundary.prev && !present[ boundary.prev.y + '|' + boundary.prev.mi ]){
    var minPrev = _setMin(boundary.prev.wanted);
    var maxPrev = _setMax(boundary.prev.wanted);
    if (minPrev != null && maxPrev != null){
      var sPrev = toSerial(boundary.prev.y, boundary.prev.mi, minPrev);
      var ePrev = toSerial(boundary.prev.y, boundary.prev.mi, maxPrev);
      start = Math.min(start, sPrev);
      end   = Math.max(end,   ePrev);
    }
  }
  if (boundary.next && !present[ boundary.next.y + '|' + boundary.next.mi ]){
    var minNext = _setMin(boundary.next.wanted);
    var maxNext = _setMax(boundary.next.wanted);
    if (minNext != null && maxNext != null){
      var sNext = toSerial(boundary.next.y, boundary.next.mi, minNext);
      var eNext = toSerial(boundary.next.y, boundary.next.mi, maxNext);
      start = Math.min(start, sNext);
      end   = Math.max(end,   eNext);
    }
  }

  if (start !== spec.start || end !== spec.end) return { start:start, end:end };
  return null;
}

/* ============================================================================
 * 8) COMMANDS & ROUTING
 * ==========================================================================*/
function _normalizePackedWords(q){
  return String(q||'')
    .replace(/\bnextmonth\b/g, 'next month')
    .replace(/\bnextyear\b/g, 'next year')
    .replace(/\bupcomingmonth\b/g, 'upcoming month')
    .replace(/\bupcomingyear\b/g, 'upcoming year')
    .replace(/\bcurrentmonth\b/g, 'month')
    .replace(/\bthismonth\b/g, 'month')
    .replace(/\bthisyear\b/g, 'year')
    .replace(/\bnext-month\b/g,'next month')
    .replace(/\bnext-year\b/g,'next year')
    .replace(/\bupcoming-month\b/g,'upcoming month')
    .replace(/\bupcoming-year\b/g,'upcoming year')
    .trim();
}
function normalizeSubcommand(sub){ return String(sub||'').toLowerCase(); }

=======
// ---- Day context + cell renderer (DRY for both full grids and week strips) ----
function makeDayCtx(y, mi, d, dimPast){
  var ser = toSerial(y, mi, d);
  var tSer = todaySerial();
  var evts = getEventsFor(mi, d, y);
  var label = formatDateLabel(y, mi, d, true);
  if (evts.length){ label += ': ' + evts.map(function(e){ return e.name; }).join(', '); }
  return {
    y:y, mi:mi, d:d, serial:ser,
    isToday: (ser === tSer),
    isPast:  !!dimPast && (ser < tSer),
    events:  evts,
    title:   label
  };
}

function tdHtmlForDay(ctx, monthColor, baseStyle, numeralStyle){
  var style = styleForDayCell(baseStyle, ctx.events, ctx.isToday, monthColor, ctx.isPast);
  var titleAttr = ' title="'+esc(ctx.title)+'" aria-label="'+esc(ctx.title)+'"';
  var numWrap = '<div'+(numeralStyle ? ' style="'+numeralStyle+'"' : '')+'>'+ctx.d+'</div>';
  return '<td'+titleAttr+' style="'+style+'">'+numWrap+'</td>';
}


// ---------- Unified Range Engine (months, years, weekdays, ordinals, phrases) ----------
>>>>>>> Stashed changes
var ORDINALS = {
  '1':'first','2':'second','3':'third','4':'fourth','5':'fifth',
  'first':'first','second':'second','third':'third','fourth':'fourth','fifth':'fifth',
  '1st':'first','2nd':'second','3rd':'third','4th':'fourth','5th':'fifth','last':'last'
};
function _weekdayIndexByName(tok){
  var cal = getCal();
  if (tok==null) return -1;
  var s = _normAlpha(tok);
  if (/^\d+$/.test(tok)){
    var n = parseInt(tok,10);
    if (n>=0 && n<cal.weekdays.length) return n;
    if (n>=1 && n<=cal.weekdays.length) return n-1;
  }
  for (var i=0;i<cal.weekdays.length;i++){
    var w = _normAlpha(cal.weekdays[i]);
    if (s===w || w.indexOf(s)===0) return i;
  }
  return -1;
}
function _firstWeekdayOfMonth(year, mi, wdi){
  var first = weekdayIndexForYear(year, mi, 1);
  var delta = (wdi - first + getCal().weekdays.length) % getCal().weekdays.length;
  return 1 + delta;
}
function _nthWeekdayOfMonth(year, mi, wdi, nth){
  var mdays = getCal().months[mi].days|0;
  var first = _firstWeekdayOfMonth(year, mi, wdi);
  var day = first + (nth-1)*7;
  return (day<=mdays) ? day : null;
}
function _lastWeekdayOfMonth(year, mi, wdi){
  var mdays = getCal().months[mi].days|0;
  var lastWd = weekdayIndexForYear(year, mi, mdays);
  var delta = (lastWd - wdi + getCal().weekdays.length) % getCal().weekdays.length;
  var day = mdays - delta;
  return day>=1 ? day : null;
}
function _tokenizeRangeArgs(args){
  var toks = (args||[]).map(function(t){return String(t).trim();}).filter(Boolean);
  return toks;
}
function _isPhrase(tok){ return /^(month|year|current|this|next|previous|prev|last|upcoming)$/.test(String(tok||'').toLowerCase()); }
function _isYear(tok){ return /^\d{1,6}$/.test(String(tok||'')); }
function _isNum(tok){ return /^\d+$/.test(String(tok||'')); }

function _parseOrdinalWeekday(tokens){
  if (!tokens.length) return null;
  var ordKey = ORDINALS[(tokens[0]||'').toLowerCase()];
  if (!ordKey) return null;
  var wdi = _weekdayIndexByName(tokens[1]||'');
  if (wdi<0) return null;
  var rest = tokens.slice(2);
  if (rest[0] && /^of$/i.test(rest[0])) rest.shift();
  var mi = -1, year = null;
  if (rest.length){
    var maybeMonth = monthIndexByName(rest[0]);
    if (maybeMonth!==-1){ mi = maybeMonth; rest.shift(); }
  }
  if (rest.length && _isYear(rest[0])){ year = parseInt(rest[0],10); }
  return { ord: ordKey, wdi: wdi, mi: mi, year: year };
}
function _parseMonthYearLoose(tokens){
  var cal = getCal(), cur = cal.current;
  var mi = -1, day = null, year = null;
  var idx = 0;
  if (idx<tokens.length){
    var maybeMi = monthIndexByName(tokens[idx]);
    if (maybeMi!==-1){ mi = maybeMi; idx++; }
    else if (_isNum(tokens[idx])){
      var n = parseInt(tokens[idx],10);
      if (n>=1 && n<=cal.months.length){ mi = n-1; idx++; }
    }
  }
  if (idx<tokens.length && _isNum(tokens[idx])){ day = parseInt(tokens[idx],10); idx++; }
  if (idx<tokens.length && _isYear(tokens[idx])){ year = parseInt(tokens[idx],10); idx++; }
  if (mi===-1 && day==null && tokens.length===1 && _isYear(tokens[0])){ year = parseInt(tokens[0],10); }
  return { mi: mi, day: day, year: year };
}
function _phraseToSpec(tokens){
  var cal = getCal(), cur=cal.current, months=cal.months, dpy = daysPerYear();
  var t0 = (tokens[0]||'').toLowerCase();
  var t1 = (tokens[1]||'').toLowerCase();
  function monthRange(y, mi, title){
    var md = months[mi].days|0;
    return { title:title, start: toSerial(y, mi, 1), end: toSerial(y, mi, md), months:[{y:y,mi:mi}] };
  }
  function yearRange(y, title){
    var s = toSerial(y,0,1); return { title:title, start:s, end:s+dpy-1, months:months.map(function(_,i){return {y:y,mi:i};}) };
  }
  if (t0==='today' || t0==='now'){ return monthRange(cur.year, cur.month, 'Today — '+currentDateLabel()); }
  if (t0==='month' || (t0==='this'||t0==='current') && (t1==='month'||!t1)){ return monthRange(cur.year, cur.month, 'This Month'); }
  if (t0==='year'  || (t0==='this'||t0==='current') && (t1==='year'||!t1)){ return yearRange(cur.year, 'This Year '+cur.year+' '+LABELS.era); }
  if (t0==='next' && (!t1 || t1==='month')){ var mi=(cur.month+1)%months.length, y=cur.year+(mi===0?1:0); return monthRange(y, mi, 'Next Month ('+months[mi].name+')'); }
  if (t0==='next' && t1==='year'){ return yearRange(cur.year+1, 'Next Year '+(cur.year+1)+' '+LABELS.era); }
  if ((t0==='last'||t0==='previous'||t0==='prev') && (!t1 || t1==='month')){
    var pmi=(cur.month+months.length-1)%months.length, py=cur.year-(cur.month===0?1:0);
    return monthRange(py, pmi, 'Last Month ('+months[pmi].name+')');
  }
  if ((t0==='last'||t0==='previous'||t0==='prev') && t1==='year'){ return yearRange(cur.year-1, 'Last Year '+(cur.year-1)+' '+LABELS.era); }
  if (t0==='upcoming'){
    if (t1==='year'){
      var s = toSerial(cur.year, cur.month, 1);
      return { title:'Upcoming Year (rolling from this month)', start:s, end:s+dpy-1,
               months: (function(){ var out=[]; for (var off=0; off<12; off++){ var mi=(cur.month+off)%months.length; var y=cur.year+Math.floor((cur.month+off)/months.length); out.push({y:y,mi:mi}); } return out; })() };
    }
    if (t1==='month' || !t1){
      var miU=cur.month, yU=cur.year;
      if (cur.day_of_the_month>=15){ miU=(cur.month+1)%months.length; yU=cur.year+(miU===0?1:0); }
      return monthRange(yU, miU, 'Upcoming Month');
    }
    if (/^\d+$/.test(t1)){
      var days = parseInt(t1,10)|0; if (days<1) days=1;
      var s0 = todaySerial();
      return { title:'Upcoming ('+days+' days)', start:s0, end:s0+days-1, months:null };
    }
  }
  return null;
}
function parseUnifiedRange(tokens){
  if (tokens.length && _isPhrase(tokens[0].toLowerCase())){
    var ps = _phraseToSpec(tokens);
    if (ps) return ps;
  }
  var ordwd = _parseOrdinalWeekday(tokens);
  if (ordwd){
    var cal=getCal(), cur=cal.current;
    var year = (typeof ordwd.year==='number') ? ordwd.year : cur.year;
    var mi   = (ordwd.mi!==-1) ? ordwd.mi : cur.month;
    var day;
    if (ordwd.ord==='last') day = _lastWeekdayOfMonth(year, mi, ordwd.wdi);
    else {
      var nth = {first:1,second:2,third:3,fourth:4,fifth:5}[ordwd.ord]||1;
      day = _nthWeekdayOfMonth(year, mi, ordwd.wdi, nth);
      if (day==null){ day = _lastWeekdayOfMonth(year, mi, ordwd.wdi); }
    }
    var start = toSerial(year, mi, day), end = start;
    return { title: (ordwd.ord==='last' ? 'Last ' : '') + getCal().weekdays[ordwd.wdi] + ' — ' + formatDateLabel(year, mi, day, true),
             start:start, end:end, months:[{y:year,mi:mi}] };
  }
  var md = _parseMonthYearLoose(tokens);
  var cal=getCal(), cur=cal.current, months=cal.months, dpy=daysPerYear();
  if (md.mi!==-1 && md.day!=null && md.year!=null){
    var s = toSerial(md.year, md.mi, clamp(md.day,1,months[md.mi].days));
    return { title:'Events — '+formatDateLabel(md.year, md.mi, clamp(md.day,1,months[md.mi].days), true),
             start:s, end:s, months:[{y:md.year,mi:md.mi}] };
  }
  if (md.mi!==-1 && md.day!=null){
    var nextY = nextForMonthDay(cur, md.mi, md.day).year;
    var d2 = clamp(md.day, 1, months[md.mi].days);
    var s2 = toSerial(nextY, md.mi, d2), e2 = s2;
    return { title:'Next '+months[md.mi].name+' '+d2, start:s2, end:e2, months:[{y:nextY,mi:md.mi}] };
  }
  if (md.day!=null && md.mi===-1){
    var nextMY = nextForDayOnly(cur, md.day, months.length);
    var d3 = clamp(md.day, 1, months[nextMY.month].days);
    var s3 = toSerial(nextMY.year, nextMY.month, d3);
    return { title:'Next '+months[nextMY.month].name+' '+d3, start:s3, end:s3, months:[{y:nextMY.year,mi:nextMY.month}] };
  }
  if (md.mi!==-1 && md.year!=null && md.day==null){
    var mdays = months[md.mi].days|0;
    return { title:'Events — '+months[md.mi].name+' '+md.year+' '+LABELS.era,
             start: toSerial(md.year, md.mi, 1), end: toSerial(md.year, md.mi, mdays), months:[{y:md.year,mi:md.mi}] };
  }
  if (md.mi!==-1 && md.day==null && md.year==null){
    var y3 = (md.mi >= cur.month) ? cur.year : (cur.year+1);
    var mdays3 = months[md.mi].days|0;
    return { title:'Events — '+months[md.mi].name+' (next occurrence)',
             start: toSerial(y3, md.mi, 1), end: toSerial(y3, md.mi, mdays3), months:[{y:y3,mi:md.mi}] };
  }
  if (md.year!=null && md.mi===-1){
    var sY = toSerial(md.year, 0, 1);
    return { title:'Events — Year '+md.year+' '+LABELS.era, start:sY, end:sY+dpy-1,
             months: months.map(function(_,i){return {y:md.year,mi:i};}) };
  }
  return { title:'This Month', start: toSerial(cur.year, cur.month, 1), end: toSerial(cur.year, cur.month, getCal().months[cur.month].days),
           months:[{y:cur.year,mi:cur.month}] };
}

// Aliases for backward compatibility
var renderRangeHtml = buildCalendarsHtmlForSpec;
var renderMonthGrid = renderMonthTable;
var showRange       = runShowUsingUnifiedRange;
var showRangePlus   = runShowPlusEventsUsingUnifiedRange;

// ---------- Range adapters for show/events/send ----------
<<<<<<< Updated upstream
=======
function _monthsFromRangeSpec(spec){
  if (spec.months && spec.months.length) return spec.months.slice();
  var months = [], dpy=daysPerYear(), cal=getCal(), firstY=Math.floor(spec.start/dpy), lastY=Math.floor(spec.end/dpy);
  for (var y=firstY; y<=lastY; y++){
    for (var mi=0; mi<cal.months.length; mi++){
      var s = toSerial(y, mi, 1), e = toSerial(y, mi, cal.months[mi].days);
      if (e < spec.start) continue;
      if (s > spec.end) break;
      months.push({y:y, mi:mi});
    }
  }
  return months;
}

function buildCalendarsHtmlForSpec(spec){
  var months = _monthsFromRangeSpec(spec);
  var out = ['<div style="text-align:left;">'];

  // Which months are already present in this view?
  var present = {};
  for (var i=0;i<months.length;i++) present[ months[i].y + '|' + months[i].mi ] = 1;

  // Main dimming rule (only dim in-range if the range includes today)
  var tSer = todaySerial();
  var dimPastMain = (tSer >= spec.start && tSer <= spec.end);

  // NEW: boundary-aware prepend/append strips, keyed off the requested range
  var boundary = computeBoundaryWantedDays(spec);

  // PREPEND (show only if that adjacent month isn’t already present)
  if (boundary.prev && !present[ boundary.prev.y + '|' + boundary.prev.mi ]){
    out.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' +
      renderMonthStripWantedDays(boundary.prev.y, boundary.prev.mi, boundary.prev.wanted, /*force dim*/true) +
      '</div>');
  }

  // Main months
  for (var k=0; k<months.length; k++){
    var m = months[k];
    out.push(
      '<div style="display:inline-block;vertical-align:top;margin:4px;">' +
      renderMonthTable({ year:m.y, mi:m.mi, mode:'full', dimPast: dimPastMain }) +
      '</div>'
    );
  }

  // APPEND (show only if that adjacent month isn’t already present)
  if (boundary.next && !present[ boundary.next.y + '|' + boundary.next.mi ]){
    out.push('<div style="display:inline-block;vertical-align:top;margin:4px;">' +
      renderMonthStripWantedDays(boundary.next.y, boundary.next.mi, boundary.next.wanted, /*force dim*/true) +
      '</div>');
  }

  out.push('</div>');
  return out.join('');
}





>>>>>>> Stashed changes
function runShowUsingUnifiedRange(who, args){
  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));
  var html = buildCalendarsHtmlForSpec(spec);
  whisper(who, html);
}
<<<<<<< Updated upstream
function runShowPlusEventsUsingUnifiedRange(who, args){
  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));
  var calHtml = buildCalendarsHtmlForSpec(spec);
  var ext = stripRangeExtensionDynamic(spec) || spec;
  var forceYear = (Math.floor(ext.start/daysPerYear()) !== Math.floor(ext.end/daysPerYear()));
  var listHtml = eventsListHTMLForRange(spec.title, ext.start, ext.end, forceYear);
  whisper(who, calHtml + '<div style="height:8px"></div>' + listHtml);
}
=======

function runShowPlusEventsUsingUnifiedRange(who, args){
  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));

  // 1) calendars (with boundary-aware strips)
  var calHtml = buildCalendarsHtmlForSpec(spec);

  // 2) events list, extended to include any strip days (if shown)
  var ext = stripRangeExtensionDynamic(spec) || spec;
  var forceYear = (Math.floor(ext.start/daysPerYear()) !== Math.floor(ext.end/daysPerYear()));
  var listHtml = eventsListHTMLForRange(spec.title, ext.start, ext.end, forceYear);

  whisper(who, calHtml + '<div style="height:8px"></div>' + listHtml);
}


>>>>>>> Stashed changes
function runEventsUsingUnifiedRange(who, args, broadcast){
  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));
  spec = expandRangeWithRecentPast(spec); // include recent past
  var html = eventsListHTMLForRange(
    spec.title,
    spec.start,
    spec.end,
    (Math.floor(spec.start/daysPerYear())!==Math.floor(spec.end/daysPerYear()))
  );
  return broadcast ? sendToAll(html) : whisper(who, html);
}
function runSendUsingUnifiedRange(who, args){
  if (args.length && /^(events|list)$/i.test(String(args[0]))){
    return runEventsUsingUnifiedRange(who, args.slice(1), /*broadcast*/true);
  }
  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));
  var html = buildCalendarsHtmlForSpec(spec);
  sendToAll(html);
}

/* ============================================================================
 * 9) MUTATIONS (DATE & EVENTS CRUD) + MISC
 * ==========================================================================*/
function expandRangeWithRecentPast(spec){
  var cur = getCal().current;
  var baseBack = 5;
  var extra = (cur.day_of_the_week <= 4) ? 7 : 0;
  var back = baseBack + extra;
  var start = Math.min(spec.start, todaySerial() - back);
  return { title: spec.title, start: start, end: spec.end, months: spec.months };
}

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
  publicMsg.push('<div>Month: '+(c.month+1)+' of '+cal.months.length+', '+mSeason+'</div>');
  if (gmOnly){ sendToGM(publicMsg.join('')); }
  else if (to){ whisper(to, publicMsg.join('')); }
  else { sendToAll(publicMsg.join('')); }
  if (gmOnly || !to) { sendToGM(gmButtonsHtml()); }
}

function addEventSmart(tokens){
  var cal = getCal(), cur = cal.current;
  if (!tokens || !tokens.length){ warnGM('Usage: <code>!cal events add [&lt;month|list|all&gt;] &lt;day|range|list|all&gt; [&lt;year|list|all&gt;] &lt;name...&gt; [#hex]</code>'); return; }
  var sepIdx = tokens.indexOf('--'), forcedNameTokens = null;
  if (sepIdx !== -1){ forcedNameTokens = tokens.slice(sepIdx+1); tokens = tokens.slice(0, sepIdx); }
  var color = null;
  if (tokens.length && isColorToken(tokens[tokens.length-1])) {
    color = resolveColor(tokens.pop());
  } else if (forcedNameTokens && forcedNameTokens.length) {
    var maybe = forcedNameTokens[forcedNameTokens.length-1];
    if (isColorToken(maybe)) { color = resolveColor(maybe); forcedNameTokens.pop(); }
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
      var ok1 = _addConcreteEvent(nextMY.month+1, String(di), nextMY.year, rawName, color);
      if (ok1){
        refreshAndSend();
        warnGM('Added 1 event.');
      } else {
        warnGM('No event added (duplicate or invalid).');
      }
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
      var ok2 = _addConcreteEvent(mi+1, String(di2), nextY, rawName, color);
      if (ok2){
        refreshAndSend();
        warnGM('Added 1 event.');
      } else {
        warnGM('No event added (duplicate or invalid).');
      }
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
      for (var j=0; j<daySpecsForMonth.length;j++){
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
    refreshAndSend();
    warnGM('Added '+added+' event'+(added===1?'':'s')+'.');
  } else {
    warnGM('No events were added (possible duplicates or invalid specs).');
  }
}

function parseIntSafe(x){ var n=parseInt(x,10); return isFinite(n)?n:null; }
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

function removeEvent(query){
  var cal = getCal(), events = cal.events;

  if (!state[state_name].suppressedDefaults) {
    state[state_name].suppressedDefaults = {};
  }
  if (!events.length){
    sendChat(script_name, '/w gm No events to remove.');
    return;
  }

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
  if (!raw){
    sendChat(script_name, '/w gm Please provide an index or a name.');
    return;
  }

  if (forceIndex) {
    var m = raw.match(/^#?(\d+)$/);
    var idx = m ? (+m[1]) : NaN;
    if (!isFinite(idx) || idx < 1 || idx > events.length) {
      sendChat(script_name, '/w gm After <code>index</code>, give a number 1–'+events.length+'.');
      return;
    }
    var removed = events.splice(idx-1, 1)[0];
    markSuppressedIfDefault(removed);
    refreshAndSend();
    sendChat(script_name, '/w gm Removed event #'+idx+': '+esc(removed.name));
    return;
  }

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

  if (!rmAll && !exact && asIdx) {
    var idx2 = +asIdxMatch[1];
    var removed2 = events.splice(idx2-1, 1)[0];
    markSuppressedIfDefault(removed2);
    refreshAndSend();
    sendChat(script_name, '/w gm Removed event #'+idx2+': '+esc(removed2.name));
    return;
  }

  var matches = events.filter(function(e){
    var n = String(e.name||'').toLowerCase();
    return exact ? (n===needle) : (n.indexOf(needle)!==-1);
  });

  if (!matches.length){
    sendChat(script_name, '/w gm No events matched "'+esc(raw)+'".');
    return;
  }

  if (!rmAll && matches.length>1){
    var list = matches.map(function(e){
      var i = events.indexOf(e)+1, m2 = getCal().months[e.month-1].name;
      var y = (e.year==null)? '' : (', '+e.year+' '+LABELS.era);
      return '#'+i+' '+esc(e.name)+' ('+esc(m2)+' '+esc(e.day)+y+')';
    }).join('<br>');
    sendChat(script_name, '/w gm Multiple matches for "'+esc(raw)+'"'+(exact?' (exact)':'')+
      ':<br>'+list+'<br>Use the index to remove one, or prefix with <code>all</code> to remove all.');
    return;
  }

  if (rmAll){
    matches.forEach(markSuppressedIfDefault);
    cal.events = events.filter(function(e){ return matches.indexOf(e)===-1; });
    refreshAndSend();
    sendChat(script_name, '/w gm Removed '+matches.length+' event'+(matches.length===1?'':'s')+'.');
  } else {
    var e2 = matches[0], pos = events.indexOf(e2);
    events.splice(pos,1);
    markSuppressedIfDefault(e2);
    refreshAndSend();
    sendChat(script_name, '/w gm Removed event: '+esc(e2.name)+' ('+
      esc(getCal().months[e2.month-1].name)+' '+esc(e2.day)+
      ((e2.year!=null)?(', '+e2.year+' '+LABELS.era):'')+')');
  }
}

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
    refreshAndSend();
    sendChat(script_name, '/w gm Restored ' + restored + ' default event'+(restored===1?'':'s')+'.');
    return;
  }
  keys.forEach(function(k){
    var parts = k.split('|'); var nm = (parts[3]||'').toLowerCase();
    if ((exact && nm === needle) || (!exact && nm.indexOf(needle) !== -1)){ if (sup[k]){ delete sup[k]; restored++; } }
  });
  refreshAndSend();
  if (restored){
    sendChat(script_name, '/w gm Restored ' + restored + ' default event'+(restored===1?'':'s')+' matching "'+esc(needle)+'".');
  } else {
    sendChat(script_name, '/w gm No suppressed default events matched "'+esc(needle)+'".');
  }
}

// ---------- GM buttons / Help ----------
function gmButtonsHtml(){ return [
  '[📅 Send Date](!cal send date)',
  '[📅 Send Year](!cal send year)',
  '[⏭ Advance Day](!cal advanceday)',
  '[⏮ Retreat Day](!cal retreatday)',
  '[❔ Help](!cal help)'
].map(function(b){ return '<div style="'+STYLES.gmBtnWrap+'">'+b+'</div>'; }).join(''); }

function buildHelpHtml(isGM){
  var common = [
    '<div style="margin:4px 0;"><b>Basic Commands</b></div>',
    '<div>• <code>!cal</code> or <code>!cal show</code> — current month</div>',
    '<div>• <code>!cal show &lt;range&gt;</code> (e.g., <code>next month</code>, <code>Rhaan 1001</code>, <code>third Far</code>)</div>',
    '<div>• <code>!cal events &lt;range&gt;</code> or <code>!cal list &lt;range&gt;</code></div>',
    '<div>• <code>!cal send [events|list] &lt;range&gt;</code></div>',
    '<div>• Phrases: <code>today|now</code>, <code>this/current month|year</code>, <code>next month|year</code>, <code>last|previous month|year</code>, <code>upcoming [days|month|year]</code></div>',
    '<div>• Ordinals: <code>first|second|third|fourth|fifth|last &lt;weekday&gt; [of] [&lt;month&gt;] [&lt;year&gt;]</code></div>',
    '<div>• Loose dates: <code>&lt;month&gt; [day] [year]</code>, <code>MM DD [YYYY]</code>, <code>DD</code>, <code>YYYY</code></div>',
    '<div style="height:12px"></div>'
  ];
  if (!isGM) return common.join('');
  var gm = [
    '<div style="margin-top:10px;"><b>Date Management</b></div>',
    '<div>• <code>!cal advanceday</code>, <code>!cal retreatday</code></div>',
    '<div>• <code>!cal setdate [MM] DD [YYYY]</code> or <code>!cal setdate &lt;MonthName&gt; DD [YYYY]</code></div>',
    '<div>• <code>!cal send</code> / <code>!cal send events</code> &lt;range&gt;</div>',
    '<div style="height:12px"></div>',
    '<div style="margin-top:10px;"><b>Event Management</b></div>',
    '<div>• <code>!cal events add [&lt;month|list|all&gt;] &lt;day|range|list|all&gt; [&lt;year|list|all&gt;] &lt;name...&gt; [#hex]</code></div>',
    '<div>• <code>!cal events remove [all] [exact] [index] &lt;index|name&gt;</code></div>',
    '<div>• <code>!cal events restore [all] [exact] &lt;name...&gt;</code></div>',
    '<div style="height:12px"></div>',
    '<div style="margin-top:10px;"><b>Event Sources</b></div>',
    '<div>• <code>!cal source list</code> — show known sources and which are disabled</div>',
    '<div>• <code>!cal source disable &lt;name&gt;</code> — stop adding defaults from a source</div>',
    '<div>• <code>!cal source enable &lt;name&gt;</code> — re-enable and restore its defaults</div>',
    '<div style="margin-top:10px;"><b>Script Management</b></div>',
    '<div>• <code>!cal refresh</code></div>',
    '<div>• <code>!cal colors list</code> — show month-header themes</div>',
    '<div>• <code>!cal colors &lt;name&gt;</code> — switch month-header theme</div>',
    '<div>• <code>!cal monthset list</code> — show month name sets</div>',
    '<div>• <code>!cal monthset &lt;name&gt;</code> — switch month names (days/seasons unchanged)</div>',
    '<div>• <code>!cal resetcalendar</code></div>'
  ];
  return common.concat(gm).join('');
}
function showHelp(to, isGM){
  var help = buildHelpHtml(!!isGM);
  if (to){ whisper(to, help); } else { sendChat(script_name, help); }
}

// ---------- Command presets / routing ----------
var argPresets = {
  year:         { target: 'show',   inject: ['year'] },
  yr:           { target: 'show',   inject: ['year'] },
  currentyear:  { target: 'show',   inject: ['year'] },
  fullyear:     { target: 'show',   inject: ['year'] },
  showyear:     { target: 'show',   inject: ['year'] },

  listevents:   { target: 'events', inject: [] },
  list:         { target: 'events', inject: [] },

  add:          { target: 'events', inject: ['add'] },
  addevent:     { target: 'events', inject: ['add'] },
  remove:       { target: 'events', inject: ['remove'] },
  rm:           { target: 'events', inject: ['remove'] },
  removeevent:  { target: 'events', inject: ['remove'] },
  rmevent:      { target: 'events', inject: ['remove'] },
  restore:      { target: 'events', inject: ['restore'] },

  senddate:     { target: 'send',   inject: ['date'] },
  sendyear:     { target: 'send',   inject: ['year'] },

  today:        { target: 'show',   inject: ['today'] },

  set:          { target: 'setdate', inject: [] },

  showevents:   { target: 'showevents', inject: [] }
};

function _resolveCommandAndArgs(args){
  var sub = normalizeSubcommand(args[1] || '');
  var preset = argPresets[sub];
  if (preset){
    var injected = (preset.inject || []);
    var newArgs = [args[0], preset.target].concat(injected, args.slice(2));
    return { sub: preset.target, args: newArgs };
  }
  return { sub: sub, args: args };
}

var commands = {
<<<<<<< Updated upstream
  // Everyone
  '': function(m){
    var isGM = playerIsGM(m.playerid);
    runShowUsingUnifiedRange(m.who, []); // default = current month
    if (isGM) whisper(m.who, gmButtonsHtml());
  },
  show: function(m, a){
    runShowUsingUnifiedRange(m.who, a.slice(2));
    if (playerIsGM(m.playerid)) whisper(m.who, gmButtonsHtml());
  },
  showevents: function(m, a){
    runShowPlusEventsUsingUnifiedRange(m.who, a.slice(2));
    if (playerIsGM(m.playerid)) whisper(m.who, gmButtonsHtml());
  },
=======
'': function(m){
  var isGM = playerIsGM(m.playerid);
  // Current month view → calendar + events (strip-aware)
  runShowPlusEventsUsingUnifiedRange(m.who, []);
  if (isGM) whisper(m.who, gmButtonsHtml());
},

show: function(m, a){
  var rangeTokens = a.slice(2);

  // Decide if this resolves to THE current-month view
  var spec = parseUnifiedRange(_tokenizeRangeArgs(rangeTokens));
  var cal  = getCal(), cur = cal.current, mdays = cal.months[cur.month].days;
  var isCurrentMonth =
    spec.months && spec.months.length === 1 &&
    spec.months[0].y  === cur.year &&
    spec.months[0].mi === cur.month &&
    spec.start === toSerial(cur.year, cur.month, 1) &&
    spec.end   === toSerial(cur.year, cur.month, mdays);

  if (isCurrentMonth){
    // current-month → calendar + events
    runShowPlusEventsUsingUnifiedRange(m.who, rangeTokens);
  } else {
    // everything else → calendar only
    runShowUsingUnifiedRange(m.who, rangeTokens);
  }

  if (playerIsGM(m.playerid)) whisper(m.who, gmButtonsHtml());
},
>>>>>>> Stashed changes

  // Unified EVENTS/LIST
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
    runEventsUsingUnifiedRange(m.who, args, /*broadcast*/false);
  },

  help: function(m){ showHelp(m.who, playerIsGM(m.playerid)); },

  // GM-only
  source: { gm:true, run: function(m, a){
    var args = a.slice(2).map(function(x){ return String(x).trim(); }).filter(Boolean);
    var sub = (args[0]||'').toLowerCase();
    var suppressedSources = state[state_name].suppressedSources || (state[state_name].suppressedSources = {});
    function listSources(){
      var cal = getCal();
      var seen = {};
      defaults.events.forEach(function(de){
        if (de.source) seen[String(de.source).toLowerCase()] = String(de.source);
      });
      cal.events.forEach(function(e){
        if (e.source) seen[String(e.source).toLowerCase()] = String(e.source);
      });
      var names = Object.keys(seen).sort().map(function(k){
        var label = seen[k];
        var sup = suppressedSources[k] ? ' (disabled)' : '';
        return '• ' + esc(label) + sup;
      });
      if (!names.length) return whisper(m.who, 'No sources found in events.');
      whisper(m.who, '<div><b>Sources</b></div><div>'+names.join('<br>')+'</div>');
    }
    function disableSource(name){
      var key = String(name||'').toLowerCase();
      if (!key){ whisper(m.who, 'Usage: <code>!cal source disable &lt;name&gt;</code>'); return; }
      suppressedSources[key] = 1;

      var cal = getCal();
      var defaultsSet = currentDefaultKeySet(cal);
      cal.events = cal.events.filter(function(e){
        var src = (e.source != null) ? String(e.source).toLowerCase() : null;
        if (src !== key) return true;
        var maxD = cal.months[e.month-1].days|0;
        var norm = normalizeDaySpec(e.day, maxD) || String(firstNumFromDaySpec(e.day));
        var k = defaultKeyFor(e.month, norm, e.name);
        return !defaultsSet[k];
      });

      refreshAndSend();
      sendChat(script_name, '/w gm Disabled source "'+esc(name)+'" and removed its default events.');
    }
    function enableSource(name){
      var key = String(name||'').toLowerCase();
      if (!key){ whisper(m.who, 'Usage: <code>!cal source enable &lt;name&gt;</code>'); return; }
      delete suppressedSources[key];
      mergeInNewDefaultEvents(getCal());
      refreshAndSend();
      sendChat(script_name, '/w gm Enabled source "'+esc(name)+'" and restored its default events.');
    }
    if (!sub || sub==='list'){ listSources(); return; }
    if (sub==='disable'){ if (!args[1]) { whisper(m.who,'Usage: <code>!cal source disable &lt;name&gt;</code>'); return; } return disableSource(args.slice(1).join(' ')); }
    if (sub==='enable'){ if (!args[1]) { whisper(m.who,'Usage: <code>!cal source enable &lt;name&gt;</code>'); return; } return enableSource(args.slice(1).join(' ')); }
    whisper(m.who, 'Usage: <code>!cal source [list|disable|enable] [&lt;name&gt;]</code>');
  }},
  colors: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){
      var names = Object.keys(COLOR_THEMES).sort();
      return whisper(m.who, '<div><b>Color Themes</b></div><div>'+names.map(esc).join(', ')+'</div>');
    }
    var key = sub;
    if (!COLOR_THEMES[key]){
      return whisper(m.who, 'Unknown theme. Try: <code>!cal colors list</code>');
    }
    var st = ensureSettings(); st.colorTheme = key;
    refreshAndSend();
    whisper(m.who, 'Color theme set to <b>'+esc(key)+'</b>.');
  }},
  monthset: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){
      var names = Object.keys(MONTH_NAME_SETS).sort();
      return whisper(m.who, '<div><b>Month Name Sets</b></div><div>'+names.map(esc).join(', ')+'</div>');
    }
    var key = sub;
    if (!MONTH_NAME_SETS[key]){
      return whisper(m.who, 'Unknown set. Try: <code>!cal monthset list</code>');
    }
    var st = ensureSettings(); st.monthSet = key;
    applyMonthSet(key);
    refreshAndSend();
    whisper(m.who, 'Month names set to <b>'+esc(key)+'</b>.');
  }},
  advanceday: { gm:true, run:function(){ advanceDay(); } },
  retreatday: { gm:true, run:function(){ retreatDay(); } },

  setdate: { gm:true, run:function(m,a){
    if (a.length < 3) { whisper(m.who, 'Usage: <code>!cal setdate [MM] DD [YYYY]</code> or <code>!cal setdate &lt;MonthName&gt; DD [YYYY]</code>'); return; }
    if (a.length === 3 && /^\d+$/.test(a[2])) {
      var cal = getCal(), cur = cal.current, months = cal.months;
      var day = parseInt(a[2],10)|0;
      var next = nextForDayOnly(cur, day, months.length);
      var d = clamp(day, 1, months[next.month].days);
      setDate(next.month + 1, d, next.year);
      return;
    }
    if (a.length >= 4 && /^\d+$/.test(a[2]) && /^\d+$/.test(a[3])) {
      var cal2 = getCal(), cur2 = cal2.current, months2 = cal2.months;
      var miNum = clamp(parseInt(a[2],10), 1, months2.length) - 1;
      var ddNum = parseInt(a[3],10)|0;
      var next2 = nextForMonthDay(cur2, miNum, ddNum);
      var d2 = clamp(ddNum, 1, months2[miNum].days);
      var yOverride = (a[4] && /^\d+$/.test(a[4])) ? (parseInt(a[4],10)|0) : next2.year;
      setDate(miNum + 1, d2, yOverride);
      return;
    }
    var mTok = a[2], dTok = a[3], yTok = a[4];
    var maybeMi = monthIndexByName(mTok);
    if (maybeMi !== -1 && /^\d+$/.test(dTok)) {
      var calZ = getCal(), curZ = calZ.current, monthsZ = calZ.months;
      var dd = parseInt(dTok,10)|0;
      var nextZ = nextForMonthDay(curZ, maybeMi, dd);
      var d3 = clamp(dd, 1, monthsZ[maybeMi].days);
      var y3 = (yTok && /^\d+$/.test(yTok)) ? (parseInt(yTok,10)|0) : nextZ.year;
      setDate(maybeMi + 1, d3, y3);
      return;
    }
    setDate(a[2], a[3], a[4]);
  }},

  send: { gm:true, run:function(m,a){
    var args = a.slice(2);
    if (!args.length || /^date$|^month$/i.test(args[0])){ return sendCurrentDate(); }
    return runSendUsingUnifiedRange(m.who, args);
  }},

  refresh: { gm:true, run:function(){ refreshCalendarState(false); } },
  resetcalendar:{ gm:true, run:function(){ resetToDefaults(); } }
};

/* ============================================================================
 * 10) BOOT
 * ==========================================================================*/
function handleInput(msg){
  if (msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/);
  args = args.slice(0,2).concat(_normalizePackedWords(args.slice(2).join(' ')).split(/\s+/).filter(Boolean));
  var r = _resolveCommandAndArgs(args);
  var sub = r.sub; args = r.args;
  var cmd = commands[sub];
  if (!cmd){
    runShowUsingUnifiedRange(msg.who, args.slice(1));
    return;
  }
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
