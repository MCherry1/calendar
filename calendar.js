// Eberron Calendar (Clean Unified Edition)
// By Matthew Cherry (github.com/mcherry1/calendar)
// Roll20 API script
// Call `!cal` to start. Add macro for easy access.
// Version: 2.0

var Calendar = (function(){

'use strict';

/* ============================================================================
 * 1) CONSTANTS & DEFAULTS
 * ==========================================================================*/
var script_name = 'Calendar';
var state_name  = 'CALENDAR';

var WEEKDAY_NAME_SETS = {
  eberron:  ["Sul","Mol","Zol","Wir","Zor","Far","Sar"],
  gregorian:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
};

var _SEASONS_NORTHERN = [
  "Mid-winter","Late winter","Early spring","Mid-spring","Late spring","Early summer",
  "Mid-summer","Late summer","Early autumn","Mid-autumn","Late autumn","Early winter"
];

var SEASON_SETS = {
  northern: _SEASONS_NORTHERN.slice(),
  southern: _SEASONS_NORTHERN.slice(6).concat(_SEASONS_NORTHERN.slice(0,6)), // rotate 6
  tropic:   ["Dry","Dry","Dry","Dry","Rainy","Rainy","Rainy","Rainy","Rainy","Rainy","Dry","Dry"]
};



// === THEME & NAME SETS ====================================================

// Eberron month names. Sets do not change month length or event dates.
var MONTH_NAME_SETS = {
  eberron: [
    "Zarantyr","Olarune","Therendor","Eyre","Dravago","Nymm",
    "Lharvion","Barrakas","Rhaan","Sypheros","Aryth","Vult"
  ],

  druidic: [
    "Frostmantle","Thornrise","Treeborn","Rainsong","Arrowfar","Sunstride",
    "Glitterstream","Havenwild","Stormborn","Harrowfall","Silvermoon","Windwhisper"
  ],

  dwarven: [
    "Aruk","Lurn","Ulbar","Kharn","Ziir","Dwarhuun",
    "Jond","Sylar","Razagul","Thazm","Drakhadur","Uarth"
  ],

  halfling: [
    "Fang","Wind","Ash","Hunt","Song","Dust",
    "Claw","Blood","Horn","Heart","Spirit","Smoke"
  ],

  gregorian: [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ]
};

var COLOR_THEMES = {
    lunar: [ // from Dragonshards article on Moons of Eberron
    "#F5F5FA", // pearly white
    "#FFC68A", // pale orange
    "#D3D3D3", // pale gray
    "#C0C0C0", // silver-gray
    "#E6E6FA", // pale lavender
    "#FFD96B", // pale yellow
    "#F5F5F5", // dull white with black slit
    "#DCDCDC", // pale gray
    "#9AC0FF", // pale blue
    "#696969", // smoky gray
    "#FF4500", // orange-red
    "#A9A9A9"  // gray and pockmarked
  ],

  seasons: [ // generic seasonal palette
    "#FFFFFF", // snow white
    "#CBD5E1", // overcast gray
    "#D8F3DC", // mint green
    "#FFB7C5", // cherry blossom 
    "#E6E6FA", // lavender 
    "#FFC54D", // topaz yellow
    "#50C878", // emerald green 
    "#64B5F6", // sky blue
    "#B38E3C", // autumn gold
    "#FF7518", // pumpkin orange 
    "#8B5A2B", // stick brown 
    "#475569" // storm gray
  ],

  druidic: [ // inspired by Druidic month names
    "#F2F7FF", // Frostmantle — snow white with icy blue
    "#C9D6C3", // Thornrise — pale sage green
    "#D8F3DC", // Treeborn — mint green
    "#D8CFEA", // Rainsong — periwinkle with a pink note
    "#9EC5E8", // Arrowfar — distant sky blue
    "#FFC54D", // Sunstride — topaz yellow
    "#63D2FF", // Glitterstream — bright aqua
    "#50C878", // Havenwild — emerald sanctuary
    "#2E3A8C", // Stormborn — electric storm blue
    "#FF7518", // Harrowfall — pumpkin harvest
    "#E6E6FA", // Silvermoon — silver lavender
    "#E8EDF2"  // Windwhisper — wispy light gray
  ],


  dwarven: [ // inspired by Dwarven themes
    "#E6F7FF", // diamond
    "#E5E4E2", // platinum
    "#50C878", // emerald
    "#F7CAC9", // rose quartz
    "#9966CC", // amethyst
    "#FFD700", // gold
    "#149174", // jade
    "#0F52BA", // sapphire
    "#FF6A00", // fire opal
    "#CD7F32", // bronze
    "#C0C0C0", // silver
    "#DDEAF7"  // mithril
  ],

  halfling: [ // inspired by Halfling month names
    "#E8EEF3", // Fang — cold bone white
    "#BDE0FE", // Wind — airy sky blue
    "#C7CBD1", // Ash — soft ash-gray
    "#2F855A", // Hunt — forest green
    "#F48FB1", // Song — wildflower pink
    "#BF946A", // Dust — earth brown
    "#D6C151", // Claw — plains grass
    "#8B0000", // Blood — deep crimson
    "#F3ECDB", // Horn — horn/antler brown
    "#8E3B46", // Heart — rosewood/mahogany
    "#C7C3E3", // Spirit — moonlit violet
    "#6B7280"  // Smoke — slate/charcoal, wintering back
  ],

  birthstones: [ // mix of traditional and modern birthstone colors for wide palette
    "#7A1E2C", // Jan Garnet
    "#8E5AC8", // Feb Amethyst
    "#66E5D9", // Mar Aquamarine
    "#F2FBFF", // Apr Diamond
    "#00A86B", // May Emerald
    "#F7F3EE", // Jun Pearl
    "#D0002A", // Jul Ruby
    "#A8E100", // Aug Peridot
    "#0A4AA6", // Sep Sapphire
    "#E83E8C", // Oct Tourmaline
    "#FFA726", // Nov Topaz
    "#00B8D4"  // Dec Turquoise
  ]};

// Auto-apply a color theme when a name set is chosen
var NAMESET_TO_THEME = {
  eberron:  'lunar',
  druidic:  'druidic',
  dwarven:  'dwarven',
  halfling: 'halfling',
  gregorian:'birthstones'
};

// Labels & styles
var LABELS = {
  era: 'YK', // post-script to year number
  gmOnlyNotice: 'Only the GM can use that calendar command.' // you must gather your party before venturing forth
};
var STYLES = {
  wrap: 'display:inline-block;vertical-align:top;margin:4px;',
  table: 'border-collapse:collapse;margin:4px;',
  th:    'border:1px solid #444;padding:2px;width:2em;text-align:center;',
  head:  'border:1px solid #444;padding:0;',
  td:    'border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;',
  monthHeaderBase: 'padding:6px;text-align:left;',
  gmbuttonWrap: 'margin:2px 0;',
  today: // current day
    'position:relative;z-index:10;border-radius:2px;box-shadow:0 3px 8px rgba(0,0,0,.65),0 12px 24px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.18);outline:2px solid rgba(0,0,0,.35);outline-offset:1px;box-sizing:border-box;overflow:visible;font-weight:bold;font-size:1.2em;',
  past: // past days
    'opacity:0.65;',
  future: // future days
    'opacity:0.95;'
};

var DEFAULT_EVENT_SOURCES = {
  sharn: [
    { name: "Tain Gala",               month: "all",  day: "first far", color: "#F7E7CE" }, // champagne 
    { name: "Crystalfall",             month: 2,      day: 9,           color: "#D7F3FF" }, // crystal blue
    { name: "Day of Ashes",            month: 5,      day: 3,           color: "#B0BEC5" }, // ash gray
    { name: "The Race of Eight Winds", month: 7,      day: 23,          color: "#004225" }  // racing green
  ],

  khorvaire: [
    { name: "Day of Mourning",         month: 2,   day: 20,  color: "#9E9E9E" }, // dead gray mists
    { name: "Galifar's Throne",        month: 6,   day: 5,   color: "#D4AF37" }, // crown gold
    { name: "Thronehold",              month: 11,  day: 11,  color: "#E80001" }  // poppy red
  ],

  "sovereign host": [
    { name: "Onatar's Flame",     month: 1,  day: 7,   color: "#FF6F00" }, // forge-orange, closer to glowing metal (Onatar)
    { name: "Turrant's Gift",     month: 2,  day: 14,  color: "#FBC02D" }, // bright coin-gold, a merchant’s shine (Kol Korran / Three Faces)
    { name: "Olladra's Feast",    month: 2,  day: 28,  color: "#8BC34A" }, // lucky clover green, prosperity & chance (Olladra)
    { name: "Sun's Blessing",     month: 3,  day: 15,  color: "#FFC107" }, // radiant sunlight yellow (Dol Arrah)
    { name: "Aureon's Crown",     month: 5,  day: 26,  color: "#283593" }, // deep indigo/blue, scholarly authority (Aureon)
    { name: "Brightblade",        month: 6,  day: 12,  color: "#B71C1C" }, // bold crimson, martial vigor (Dol Dorn)
    { name: "Bounty's Blessing",  month: 7,  day: 14,  color: "#388E3C" }, // lush harvest green, fertility & growth (Arawai)
    { name: "The Hunt",           month: 8,  day: 4,   color: "#1B5E20" }, // dark forest green, wilderness mastery (Balinor)
    { name: "Boldrei's Feast",    month: 9,  day: 9,   color: "#F57C00" }, // warm hearth orange, home & community (Boldrei)
    { name: "Market Day",         month: 11, day: 20,  color: "#FFD54F" }  // bright gold, trade & exchange (Kol Korran)

  ],

  "dark six": [
    { name: "Shargon's Bargain",       month: 4,   day: 13,       color: "#006064" }, // stormy ocean blue (The Devourer)
    { name: "Second Skin",             month: 6,   day: 11,       color: "#AEEA00" }, // venom green (The Mockery)
    { name: "Wildnight",               month: 10,  day: "18-19",  color: "#AD1457" }, // passion red (The Fury)
    { name: "Long Shadows",            month: 12,  day: "26-28",  color: "#0D0D0D" }  // abyssal black (The Shadow)
  ],

  "silver flame": [
    { name: "Rebirth Eve",             month: 1,     day: 14,         color: "#EAF2FF" }, // argent halo
    { name: "Bright Souls' Day",       month: 2,     day: 18,         color: "#FFF2C6" }, // candle vigil
    { name: "Tirasday",                month: 3,     day: 5,          color: "#DCEBFF" }, // pale silver-blue
    { name: "Initiation Day",          month: 4,     day: 11,         color: "#C7E3FF" }, // serene blue
    { name: "Baker's Night",           month: 5,     day: 6,          color: "#D8B98F" }, // warm bread
    { name: "Promisetide",             month: 5,     day: 28,         color: "#BDE3FF" }, // vow azure
    { name: "First Dawn",              month: 6,     day: 21,         color: "#FFD1A6" }, // sunrise peach
    { name: "Silvertide",              month: 7,     day: 14,         color: "#F2F7FF" }, // highest holy day
    { name: "Victory Day",             month: 8,     day: 9,          color: "#B3E5FC" }, // cool triumph
    { name: "Fathen's Fall",           month: 8,     day: 25,         color: "#E7ECF5" }, // solemn slate-blue
    { name: "The Ascension",           month: 10,    day: 1,          color: "#E6F0FF" }, // radiant argent
    { name: "Saint Valtros's Day",     month: 10,    day: 25,         color: "#E8ECFF" }, // saintly pale
    { name: "Rampartide",              month: 11,    day: 24,         color: "#D6F5D6" }, // warding green
    { name: "Khybersef",               month: 12,    day: 27,         color: "#111827" }, // deep night
    { name: "Day of Cleansing Fire",   month: "all", day: "all sul",  color: "#F2F7FF" }  // white flame
  ],
/*
  stormreach: [
    { name: "The Burning Titan",       month: "varies", day: "varies",  color: "#E53935" }, // festival red
    { name: "Pirate's Moon",           month: "varies", day: "varies",  color: "#0D47A1" }, // deep navy
    { name: "The Annual Games",        month: "varies", day: "varies",  color: "#43A047" }, // laurels green
    { name: "Shacklebreak",            month: "varies", day: "varies",  color: "#607D8B" }  // chainsteel blue-gray
  ]
*/
};

function _flattenSources(map){
  var out = [];
  Object.keys(map).forEach(function(src){
    (map[src]||[]).forEach(function(e){
      out.push({
        name: String(e.name||''),
        month: e.month,
        day: e.day,
        color: e.color,
        source: src
      });
    });
  });
  return out;
}

var defaults = {
  current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 },  // starting date: 1 Zarantyr, 998 YK
  // days per month
  // intercalery days (like Forgotten Realms' Shieldmeet) are not supported (yet)
  // leap years are not supported (yet)
  months: [   28,   28,   28,   28,   28,   28,   28,   28,   28,   28,   28,   28  ],
          //  1st,  2nd,  3rd,  4th, 5th,   6th,  7th,  8th,  9th,  10th, 11th, 12th
  events: _flattenSources(DEFAULT_EVENT_SOURCES)
};

/* ============================================================================
 * 2) STATE & SETTINGS
 * ==========================================================================*/

function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

function ensureSettings(){
  var root = state[state_name];
  root.settings = root.settings || {
    colorTheme: 'lunar',
    monthSet: 'eberron',
    weekdaySet: 'eberron',
    seasonSet: 'northern',
    groupEventsBySource: false,
    showSourceLabels: false
  };
  return root.settings;
}

function getCal(){ return state[state_name].calendar; }

function titleCase(s){
  return String(s||'')
    .split(/\s+/).map(function(w){ return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; })
    .join(' ');
}

function weekLength(){
  var cal = getCal();
  var n = (cal && cal.weekdays && cal.weekdays.length) | 0;
  return n > 0 ? n : 7;
}

function colorForMonth(mi){
  var st = ensureSettings();
  var pal = COLOR_THEMES[String(st.colorTheme||'').toLowerCase()];
  var themeCol = pal && pal[mi] ? pal[mi] : null;
  var monthCol = (getCal().months[mi] && getCal().months[mi].color) || null;
  return resolveColor(themeCol || monthCol) || '#EEE';
}

function applyMonthSet(setName){
  var cal = getCal();
  var set = MONTH_NAME_SETS[String(setName||'').toLowerCase()];
  if (!set || set.length !== cal.months.length) return false;
  for (var i=0;i<cal.months.length;i++) cal.months[i].name = set[i];
  return true;
}

function applyWeekdaySet(setName){
  var cal = getCal();
  var set = WEEKDAY_NAME_SETS[String(setName||'').toLowerCase()];
  if (!set || !set.length) return false;
  cal.weekdays = set.slice();
  // keep current DOW in-range
  if (!isFinite(cal.current.day_of_the_week)) cal.current.day_of_the_week = 0;
  if (cal.current.day_of_the_week >= cal.weekdays.length){
    cal.current.day_of_the_week = cal.weekdays.length - 1;
  }
  return true;
}

function applySeasonSet(setName){
  var cal = getCal();
  var set = SEASON_SETS[String(setName||'').toLowerCase()];
  if (!set || set.length !== cal.months.length) return false;
  for (var i=0;i<cal.months.length;i++){
    cal.months[i].season = set[i];
  }
  return true;
}

function checkInstall(){
  if(!state[state_name]) state[state_name] = {};
  ensureSettings();

  if(!state[state_name].calendar ||
     !Array.isArray(state[state_name].calendar.weekdays) ||
     !Array.isArray(state[state_name].calendar.months)){
    state[state_name].calendar = deepClone(defaults);
  }

  if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {}; // key → 1
  if (!state[state_name].suppressedSources)  state[state_name].suppressedSources  = {};

  var cal = state[state_name].calendar;

  if (!Array.isArray(cal.weekdays) || !cal.weekdays.length){
    var st = ensureSettings();
    var set = WEEKDAY_NAME_SETS[String(st.weekdaySet || 'eberron').toLowerCase()] || WEEKDAY_NAME_SETS.eberron;
    cal.weekdays = set.slice();
  }

  if (!cal.current) cal.current = deepClone(defaults.current);

  if(!Array.isArray(cal.events)){
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

      // backfill colors from defaults if missing
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

  // normalize months (support numbers = days-only)
  for (var i = 0; i < cal.months.length; i++){
    var m = cal.months[i];
    if (typeof m === 'number'){
      cal.months[i] = { days: (m|0) || 28 };
    } else {
      cal.months[i] = cal.months[i] || {};
      if (!cal.months[i].days) cal.months[i].days = 28;
      // name/season will be applied by sets below
    }
  }

  // apply sets (names, weekdays, seasons)
  var s = ensureSettings();
  applyMonthSet(s.monthSet || 'eberron');      // writes month names
  applyWeekdaySet(s.weekdaySet || 'eberron');  // writes weekdays
  applySeasonSet(s.seasonSet || 'northern');   // writes month seasons

  mergeInNewDefaultEvents(cal);

  // rebuild caches after any changes
  _rebuildSerialCache();

  // clamp current date
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
    var ow = Parse.ordinalWeekday.fromSpec(e.day);
    var daySpec = ow
      ? String(e.day).toLowerCase().trim()
      : (DaySpec.normalize(e.day, cal.months[m-1].days) || String(DaySpec.first(e.day)));
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

function refreshAndSend(){ refreshCalendarState(true); sendCurrentDate(null, true); }

function resetToDefaults(){
  delete state[state_name];
  state[state_name] = { calendar: deepClone(defaults) };
  checkInstall();
  sendChat(script_name, '/w gm Calendar state wiped and reset to defaults.');
  sendCurrentDate(null, true);
}

/* ============================================================================
 * 3) COLOR UTILITIES
 * ==========================================================================*/

// Light memo caches for contrast/header styles
var _contrastCache = Object.create(null);
var _headerStyleCache = Object.create(null);

function _cullCacheIfLarge(obj, max){
  var limit = max || 256;
  if (Object.keys(obj).length > limit){
    // simple reset; small and safe
    for (var k in obj){ if (Object.prototype.hasOwnProperty.call(obj,k)) delete obj[k]; }
  }
}

function _resetColorCaches(){
  _contrastCache = Object.create(null);
  _headerStyleCache = Object.create(null);
}

// Contrast targets
var GRADIENT_ANGLE = '45deg';
var CONTRAST_MIN_HEADER = 4.5; // AA for normal text
var CONTRAST_MIN_CELL   = 7.0; // tighter target for tiny numerals
var NEARBY_THRESHOLD    = 5;   // days from start/end that trigger boundary strips

// Parse a token like "#abc" or "#a1b2c3" into a sanitized hex color
function sanitizeHexColor(s){
  if(!s) return null;
  var hex = String(s).trim().replace(/^#/, '');
  if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
  if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
  return null;
}

// list of accepted named colors
var NAMED_COLORS = {
  red:    '#E53935', apple:  '#D32F2F', garnet: '#9B111E', pink:      '#EC407A',
  orange: '#F4511E', brown:  '#6D4C41', copper: '#B87333',
  yellow: '#FDD835', lemon:  '#FBC02D', gold:   '#D4AF37', topaz:     '#FFC54D',
  green:  '#43A047', lime:   '#7CB342', forest: '#228B22', emerald:   '#50C878', teal:    '#00897B',
  blue:   '#1E88E5', royal:  '#3949AB', sky:    '#29B6F6', sapphire:  '#0F52BA', aqua:    '#7FFFD4',
  indigo: '#3949AB', navy:   '#283593',
  violet: '#7E57C2', purple: '#5E35B1', grape:  '#8E24AA', amethyst:  '#9966CC',

  black:  '#000000', obsidian:'#0D0D0D', onyx:  '#353839', gray:      '#9E9E9E',
  silver: '#C0C0C0', platinum:'#E5E4E2', white: '#FFFFFF', snow:      '#FFFAFA', diamond: '#E6F7FF'
};

  // Aliases
  NAMED_COLORS.grey = NAMED_COLORS.gray;
  NAMED_COLORS.forestgreen = NAMED_COLORS.forest;
  NAMED_COLORS.skyblue = NAMED_COLORS.sky;
  NAMED_COLORS.charcoal = NAMED_COLORS.onyx;
  NAMED_COLORS.snowwhite = NAMED_COLORS.snow;

var PALETTE = [ // used for events without colors. technically not random, but functionally so. both arbitrary and stable
  '#E53935','#EF5350','#FF7043','#F4511E',
  '#FFB300','#F6BF26','#FDD835','#C0CA33',
  '#7CB342','#66BB6A','#43A047','#228B22',
  '#26A69A','#00897B','#00ACC1','#29B6F6',
  '#039BE5','#1E88E5','#3949AB','#0D47A1',
  '#5E35B1','#7E57C2','#8E24AA','#AB47BC',
  '#D81B60','#EC407A','#6D4C41','#8D6E63',
  '#795548','#5D4037','#607D8B','#78909C'
];

function autoColorForEvent(e){ return PALETTE[_stableHash(e && e.name) % PALETTE.length]; }

function getEventColor(e){ return resolveColor(e && e.color) || autoColorForEvent(e) || '#FF00DD'; }

function resolveColor(s){
  if (!s) return null;
  var hex = sanitizeHexColor(s);
  if (hex) return hex;
  var key = String(s).trim().toLowerCase();
  return NAMED_COLORS[key] || null;
}

function popColorIfPresent(tokens, allowBareName){
  tokens = (tokens || []).slice();
  if (!tokens.length) return { color:null, tokens:tokens };
  var last = String(tokens[tokens.length-1]||'').trim();

  var col = null;
  if (allowBareName){
    col = resolveColor(last) || _parseSharpColorToken(last);
  } else {
    if (last[0] === '#') col = _parseSharpColorToken(last);
  }

  if (col){
    tokens.pop();
    return { color: col, tokens: tokens };
  }
  return { color: null, tokens: tokens };
}

function _stableHash(str){
  var h = 5381; str = String(str||'');
  for (var i=0;i<str.length;i++){ h = ((h<<5)+h) + str.charCodeAt(i); h|=0; }
  return Math.abs(h);
}

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

function textColor(bgHex){
  var k = 't:'+bgHex;
  if (_contrastCache[k]) return _contrastCache[k];
  var v = (_contrast(bgHex, '#000') >= _contrast(bgHex, '#fff')) ? '#000' : '#fff';
  _contrastCache[k] = v;
  _cullCacheIfLarge(_contrastCache);
  return v;
}

function textOutline(textColor, bgHex, minTarget){
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
  var t = textColor(bgHex);
  style += 'background-color:'+bgHex+';';
  style += 'background-clip:padding-box;';
  style += 'color:'+t+';';
  style += textOutline(t, bgHex, (minTarget||CONTRAST_MIN_HEADER));
  return style;
}

function styleGradient(style, cols, minTarget){
  cols = _normalizeCols(cols);
  var uniq = _uniqueCols(cols);
  if (uniq.length === 1){ return applyBg(style, uniq[0], (minTarget||CONTRAST_MIN_CELL)); }
  var pickText = (function(){
    var minB=Infinity,minW=Infinity,worstB=0,worstW=0;
    for (var i=0;i<cols.length;i++){
      var cB=_contrast(cols[i],'#000'); if (cB<minB){minB=cB;worstB=i;}
      var cW=_contrast(cols[i],'#fff'); if (cW<minW){minW=cW;worstW=i;}
    }
    return (minB>=minW) ? { text:'#000', worst:cols[worstB], min:minB } : { text:'#fff', worst:cols[worstW], min:minW };
  })();
  style += 'background-color:'+cols[0]+';';
  style += 'background-image:'+_gradientFor(cols)+';';
  style += 'background-repeat:no-repeat;background-size:100% 100%;';
  style += 'background-clip:padding-box;';
  style += 'color:'+pickText.text+';';
  style += textOutline(pickText.text, pickText.worst, (minTarget||CONTRAST_MIN_CELL));
  return style;
}

// Public colors surface
var colorsAPI = {
  textColor: textColor,
  applyBg: applyBg,
  styleGradient: styleGradient,
  styleMonthHeader:
    function(monthHex){
      var k = 'hdr:'+monthHex;
      if (_headerStyleCache[k]) return _headerStyleCache[k];
      var t = textColor(monthHex);
      var v = 'background-color:'+monthHex+';color:'+t+';'+textOutline(t, monthHex, CONTRAST_MIN_HEADER);
      _headerStyleCache[k] = v;
      _cullCacheIfLarge(_headerStyleCache);
      return v;
    },
  reset: _resetColorCaches
};

colorsAPI.paint = function(style, cols, min){ cols = Array.isArray(cols)?cols:(cols?[cols]:[]); return styleGradient(style, cols, min||CONTRAST_MIN_CELL); };

colorsAPI.textOn = function(bgHex, min){ var t=textColor(bgHex); return 'color:'+t+';'+textOutline(t,bgHex,min||CONTRAST_MIN_HEADER); };

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

function daysBeforeMonth(mi){ if(_serialCache.dpy==null) _rebuildSerialCache(); return _serialCache.prefix[mi]|0; }

function toSerial(y, mi, d){ return (y * daysPerYear()) + daysBeforeMonth(mi) + ((parseInt(d,10)||1) - 1); }

function weekdayIndex(y, mi, d){
  var cal=getCal(), cur=cal.current, wdlen=cal.weekdays.length;
  var delta = toSerial(y, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
  return (cur.day_of_the_week + ((delta % wdlen) + wdlen)) % wdlen;
}

function weekStartSerial(y, mi, d){
  var wd = weekdayIndex(y, mi, d); // 0..(len-1)
  var s = toSerial(y, mi, d);
  return s - wd;
}

function fromSerial(s){
  var dpy = daysPerYear();
  var y = Math.floor(s/dpy);
  var rem = s - y*dpy;
  var months = getCal().months;
  var mi = 0;
  while (mi < months.length - 1 && rem >= (months[mi].days|0)) { rem -= (months[mi].days|0); mi++; }
  return { year:y, mi:mi, day:(rem|0)+1 };
}

function todaySerial(){ var c = getCal().current; return toSerial(c.year, c.month, c.day_of_the_month); }

/* ============================================================================
 * 5) PARSING & FUZZY MATCHING
 * ==========================================================================*/

function _asciiFold(s){ var str = String(s || ''); return (typeof str.normalize==='function') ? str.normalize('NFD').replace(/[\u0300-\u036f]/g,'') : str; }

function _normAlpha(s){ return _asciiFold(String(s||'').toLowerCase()).replace(/[^a-z]/g,''); }

function monthIndexByName(tok){
  var cal = getCal();
  if (!tok) return -1;
  var s = _normAlpha(tok);
  var best = -1, bestLen = 0;

  for (var i=0;i<cal.months.length;i++){
    var n = _normAlpha(cal.months[i].name);
    if (s === n) return i; // exact
    if (s.length >= 3 && n.indexOf(s) === 0 && s.length > bestLen){ best = i; bestLen = s.length; }
  }
  return best;
}

var Parse = (function(){
  'use strict';

  // Local ordinal maps (kept inside to avoid cross-file ordering issues)
  var ORD_MAP_TOK = {
    '1':'first','2':'second','3':'third','4':'fourth','5':'fifth','last':'last',
    '1st':'first','2nd':'second','3rd':'third','4th':'fourth','5th':'fifth',
    'first':'first','second':'second','third':'third','fourth':'fourth','fifth':'fifth'
  };
  var UNITS = { first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7, eighth:8, ninth:9 };

  // Normalize trailing punctuation (e.g., "12th," -> "12th")
  function _stripTrailPunct(s){ return String(s||'').trim().toLowerCase().replace(/[.,;:!?]+$/,''); }

  // Weekday name/number → index (0-based). Accepts:
  //  - exact or prefix of a weekday name
  //  - "0..len-1" or "1..len" numerals
  function weekdayIndexByName(tok){
    var cal = getCal();
    if (tok==null) return -1;
    if (!cal || !Array.isArray(cal.weekdays) || !cal.weekdays.length) return -1;
    var raw = String(tok);
    var s = _normAlpha(raw);
    if (/^\d+$/.test(raw)){
      var n = parseInt(raw,10);
      if (n>=0 && n<cal.weekdays.length) return n;
      if (n>=1 && n<=cal.weekdays.length) return n-1;
    }
    for (var i=0;i<cal.weekdays.length;i++){
      var w = _normAlpha(cal.weekdays[i]);
      if (s===w || w.indexOf(s)===0) return i;
    }
    return -1;
  }

  // "14th" | "fourteenth" | "twenty-first" → 14 / 21, etc.
  function ordinalDay(tok){
    if (!tok) return null;
    var s = _stripTrailPunct(tok);

    var m = s.match(/^(\d+)(st|nd|rd|th)$/);
    if (m) return parseInt(m[1],10);

    var baseWords = {
      first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7, eighth:8, ninth:9,
      tenth:10, eleventh:11, twelfth:12, thirteenth:13, fourteenth:14, fifteenth:15, sixteenth:16,
      seventeenth:17, eighteenth:18, nineteenth:19, twentieth:20, thirtieth:30
    };
    if (baseWords[s] != null) return baseWords[s];

    var m2 = s.replace(/[\u2010-\u2015]/g, '-')
              .match(/^(twenty|thirty)(?:[-\s]?)(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)$/);
    if (m2){
      var tens = (m2[1] === 'twenty') ? 20 : 30;
      return tens + UNITS[m2[2]];
    }
    return null;
  }

  // "first far [of] March [999]" (tokens) → { ord, wdi, mi, year }
  function ordinalWeekdayFromTokens(tokens){
    tokens = (tokens||[]).map(function(t){ return String(t||''); }).filter(Boolean);
    if (!tokens.length) return null;

    var ordKey = ORD_MAP_TOK[String(tokens[0]).toLowerCase()];
    if (!ordKey) return null;

    var wdi = weekdayIndexByName(tokens[1]||'');
    if (wdi < 0) return null;

    var rest = tokens.slice(2);
    if (rest[0] && /^of$/i.test(rest[0])) rest.shift();

    var mi = -1, year = null;
    if (rest.length){
      var maybeMi = monthIndexByName(rest[0]);
      if (maybeMi !== -1){ mi = maybeMi; rest.shift(); }
      else if (/^\d+$/.test(rest[0])){ // allow numeric month
        var n = parseInt(rest[0],10)|0, lim = getCal().months.length;
        if (n>=1 && n<=lim){ mi = n-1; rest.shift(); }
      }
    }
    if (rest.length && /^\d{1,6}$/.test(rest[0])){ year = parseInt(rest[0],10); }

    return { ord:ordKey, wdi:wdi, mi:mi, year:year };
  }

  // "first far" | "last zor" | "every sul" → { ord, wdi }
  function ordinalWeekdayFromSpec(spec){
    if (typeof spec !== 'string') return null;
    var s = _stripTrailPunct(spec);
    var m = s.match(/^(first|second|third|fourth|fifth|last|every|all)\s+([a-z0-9]+)/);
    if (!m) return null;
    var ord = (m[1] === 'all') ? 'every' : m[1];
    var wdi = weekdayIndexByName(m[2]);
    if (wdi < 0) return null;
    return { ord:ord, wdi:wdi };
  }

  // Month + day + optional year, or day-only (numeric or ordinal).
  // Forms:
  //   [MM] DD [YYYY]
  //   <MonthName> DD [YYYY]
  //   DD
  //   (DD may be ordinal: "14th", "fourteenth")
  // Returns:
  //   { kind:'dayOnly', day }
  //   { kind:'mdy', mi:<0-based>, day:<int>, year:<int|null> }
  function looseMDY(tokens){
    var cal = getCal(), months = cal.months;
    tokens = (tokens||[]).map(function(t){return String(t).trim();}).filter(Boolean);
    if (!tokens.length) return null;

    // Day-only (number or ordinal)
    if (tokens.length === 1){
      if (/^\d+$/.test(tokens[0])) return { kind:'dayOnly', day:(parseInt(tokens[0],10)|0) };
      var od = ordinalDay(tokens[0]);
      if (od != null) return { kind:'dayOnly', day:(od|0) };
      return null;
    }

    // Numeric month
    if (/^\d+$/.test(tokens[0])){
      var miNum = clamp(parseInt(tokens[0],10), 1, months.length) - 1;
      var dTok  = tokens[1];
      var dNum  = (/^\d+$/.test(dTok)) ? (parseInt(dTok,10)|0) : ordinalDay(dTok);
      if (dNum == null) return null;
      var yNum  = (tokens[2] && /^\d+$/.test(tokens[2])) ? (parseInt(tokens[2],10)|0) : null;
      return { kind:'mdy', mi:miNum, day:dNum, year:yNum };
    }

    // Month name
    var miByName = monthIndexByName(tokens[0]);
    if (miByName !== -1){
      var dTok2 = tokens[1];
      var dN    = (/^\d+$/.test(dTok2)) ? (parseInt(dTok2,10)|0) : ordinalDay(dTok2);
      if (dN == null) return null;
      var yN    = (tokens[2] && /^\d+$/.test(tokens[2])) ? (parseInt(tokens[2],10)|0) : null;
      return { kind:'mdy', mi:miByName, day:dN, year:yN };
    }

    // Fallback: if first token is an ordinal word like "fourteenth" but there
    // were extra tokens (bad form), reject to avoid guessing.
    return null;
  }

  // Month/Day/Year loose (used by unified range; mirrors old _parseMonthYearLoose)
  function monthYearLoose(tokens){
    var cal = getCal(), cur = cal.current;
    var mi = -1, day = null, year = null, idx = 0;

    if (idx<tokens.length){
      var maybeMi = monthIndexByName(tokens[idx]);
      if (maybeMi !== -1){ mi = maybeMi; idx++; }
      else if (/^\d+$/.test(tokens[idx])){
        var n = parseInt(tokens[idx],10);
        if (n>=1 && n<=cal.months.length){ mi = n-1; idx++; }
      }
    }

    if (idx<tokens.length){
      if (/^\d+$/.test(tokens[idx])){ day = parseInt(tokens[idx],10); idx++; }
      else {
        var od = ordinalDay(tokens[idx]);
        if (od != null){ day = od|0; idx++; }
      }
    }

    if (idx<tokens.length && /^\d{1,6}$/.test(tokens[idx])){ year = parseInt(tokens[idx],10); idx++; }
    if (mi===-1 && day==null && tokens.length===1 && /^\d{1,6}$/.test(tokens[0])){ year = parseInt(tokens[0],10); }

    return { mi:mi, day:day, year:year };
  }

  return {
    weekdayIndexByName: weekdayIndexByName,
    ordinalDay: ordinalDay,
    ordinalWeekday: {
      fromTokens: ordinalWeekdayFromTokens,
      fromSpec:   ordinalWeekdayFromSpec
    },
    looseMDY: looseMDY,
    monthYearLoose: monthYearLoose
  };
})();

function isTodayVisibleInRange(startSerial, endSerial){
  var t = todaySerial();
  return t >= startSerial && t <= endSerial;
}

// ------------------------------ DaySpec -------------------------------------
var DaySpec = (function(){
  'use strict';

  function first(spec){
    if (typeof spec === 'number') return spec|0;
    var s = String(spec||'').trim();
    var m = s.match(/^\s*(\d+)/);
    return m ? Math.max(1, parseInt(m[1],10)) : 1;
  }

  // "N" or "A-B" → canonical string within [1..maxDays]
  function normalize(spec, maxDays){
    var s = String(spec||'').trim().toLowerCase();
    if (/^\d+$/.test(s)){ return String(clamp(s, 1, maxDays)); }
    var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m){
      var a = clamp(m[1], 1, maxDays), b = clamp(m[2], 1, maxDays);
      if (a > b){ var t=a; a=b; b=t; }
      return (a <= b) ? (a+'-'+b) : null;
    }
    return null;
  }

  // Expand to concrete integers, warn GM if malformed
  function expand(spec, maxDays){
    var s = String(spec||'').trim().toLowerCase();
    var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m){
      var a = clamp(m[1],1,maxDays), b = clamp(m[2],1,maxDays);
      if (a>b){ var t=a;a=b;b=t; }
      var out=[]; for (var d=a; d<=b; d++) out.push(d);
      return out;
    }
    var n = parseInt(s,10);
    if (isFinite(n)) return [clamp(n,1,maxDays)];

    // Keep existing UX: soft warning
    if (typeof sendChat === 'function'){
      sendChat(script_name, '/w gm Ignored malformed day spec: <code>'+String(spec).replace(/[<>&"]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];})+'</code>');
    }
    return [];
  }

  // Predicate for a day-of-month
  function matches(spec){
    if (typeof spec === 'number') {
      var n = spec|0; return function(d){ return d === n; };
    }
    var s = String(spec||'').trim().toLowerCase();
    if (s.indexOf('-') !== -1){
      var parts = s.split('-').map(function(x){ return parseInt(String(x).trim(),10); });
      var a = parts[0], b = parts[1];
      if (isFinite(a) && isFinite(b)){
        if (a > b){ var t=a; a=b; b=t; }
        return function(d){ return d >= a && d <= b; };
      }
    }
    var n2 = parseInt(s,10);
    if (isFinite(n2)) return function(d){ return d === n2; };
    return function(){ return false; };
  }

  // Keep ordinal weekday specs (e.g., "first far") intact; otherwise normalize or fallback to first number.
  function canonicalForKey(spec, maxDays){
    var ow = Parse.ordinalWeekday.fromSpec(spec);
    if (ow) return String(spec).toLowerCase().trim();
    return normalize(spec, maxDays) || String(first(spec));
  }

  return {
    first: first,
    normalize: normalize,
    expand: expand,
    matches: matches,
    canonicalForKey: canonicalForKey
  };
})();

/* ============================================================================
 * 6) EVENTS MODEL
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
  for (var i=0;i<evs.length;i++){ if (eventKey(evs[i]) === key) return i; }
  return -1;
}
function defaultKeyFor(monthHuman, daySpec, name){ return (monthHuman|0)+'|'+String(daySpec)+'|ALL|'+String(name||'').trim().toLowerCase(); }

var eventsAPI = {
  forDay: function(monthIndex, day, year){ return getEventsFor(monthIndex, day, year); },
  forRange: function(startSerial, endSerial){ return occurrencesInRange(startSerial, endSerial); },
  colorFor: getEventColor,
  isDefault: isDefaultEvent
};

var renderAPI = {
  month: function(opts){ return renderMonthTable(opts); },
  monthGrid: function(mi, yearLabel, dimPast){ return renderMiniCal(mi, yearLabel, dimPast); },
  year: function(y, dimPast){ return yearHTMLFor(y, dimPast); },
  range: function(spec){ return buildCalendarsHtmlForSpec(spec); },
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

function currentDefaultKeySet(cal){
  var lim = Math.max(1, cal.months.length);
  var out = {};
  deepClone(defaults.events).forEach(function(de){
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

function _addConcreteEvent(monthHuman, daySpec, yearOrNull, name, color){
  var cal = getCal();
  var m = clamp(monthHuman, 1, cal.months.length);
  var maxD = cal.months[m-1].days|0;

  // Accept numeric, ranges, OR ordinal weekday (e.g., "first far")
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

/* ============================================================================
 * 7) RENDERING
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
  // if first char is non-ASCII, assume it's an icon/emoji already
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

/* === Permission-aware button wrappers (players only see allowed buttons) === */
function _firstTok(s){ return String(s||'').trim().split(/\s+/)[0].toLowerCase(); }

function _canRunTop(playerid, tok){
  var cfg = commands[tok];
  if (!cfg) return true;            // Unknown top-level -> render; handleInput still gates.
  return !cfg.gm || playerIsGM(playerid);
}

function canRunCommand(playerid, cmdStr){
  return _canRunTop(playerid, _firstTok(cmdStr));
}

// Permissioned menu button: returns '' if the user can't run it
function mbP(m, label, cmd, opts){
  return canRunCommand(m.playerid, cmd) ? button(label, cmd, opts) : '';
}

// Permissioned help nav (help itself is public; inner pages gate their buttons)
function navP(m, label, page, opts){
  return button(label, 'help '+page, opts);
}

// Building blocks for month table
function openMonthTable(mi, yearLabel){
  var cal = getCal(), cur = cal.current, mObj = cal.months[mi];
  var monthColor = colorForMonth(mi);
  var monthHeaderStyle = colorsAPI.styleMonthHeader(monthColor);
  var wd = cal.weekdays;

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

function makeDayCtx(y, mi, d, dimActive){
  var ser = toSerial(y, mi, d);
  var tSer = todaySerial();
  var events = getEventsFor(mi, d, y);

  var label = events.length
    ? events.map(eventDisplayName).filter(Boolean).join(', ')
    : '';

  return {
    y:y, mi:mi, d:d, serial:ser,
    isToday:  (ser === tSer),
    isPast:   !!dimActive && (ser <  tSer),
    isFuture: !!dimActive && (ser >  tSer),
    events:   events,
    title:    label
  };
}

function styleForDayCell(baseStyle, eventsToday, isToday, monthColor, isPast, isFuture){
  var style = baseStyle;

  if (eventsToday.length >= 1){
    style = colorsAPI.paint(style, eventsToday.slice(0,3).map(getEventColor), CONTRAST_MIN_CELL);
  } else if (isToday){
    style += 'background-color:'+monthColor+';';
    style += colorsAPI.textOn(monthColor, CONTRAST_MIN_CELL);
  }

  if (isPast)   style += STYLES.past;
  if (isFuture) style += STYLES.future;
  if (isToday)  style += STYLES.today;

  return style;
}

function tdHtmlForDay(ctx, monthColor, baseStyle, numeralStyle){
  var style = styleForDayCell(baseStyle, ctx.events, ctx.isToday, monthColor, ctx.isPast, ctx.isFuture);
  var titleAttr = ctx.title ? ' title="'+esc(ctx.title)+'" aria-label="'+esc(ctx.title)+'"' : '';
  var numWrap = '<div'+(numeralStyle ? ' style="'+numeralStyle+'"' : '')+'>'+ctx.d+'</div>';
  return '<td'+titleAttr+' style="'+style+'">'+numWrap+'</td>';
}

// opts: { year, mi, mode:'full'|'week', weekStartSerial?:number, dimPast?:boolean }
function renderMonthTable(opts){
  var cal = getCal(), cur = cal.current;
  var y   = (opts && typeof opts.year === 'number') ? (opts.year|0) : cur.year;
  var mi  = (opts && typeof opts.mi   === 'number') ? (opts.mi|0)   : cur.month;
  var mode    = (opts && opts.mode) || 'full';
  var dimActive = !!(opts && opts.dimPast); // keep param name for minimal churn

  var mdays = cal.months[mi].days|0;
  var parts = openMonthTable(mi, y);
  var html  = [parts.html];
  var wdCnt = weekLength()|0;

  if (mode === 'full'){
    var gridStart     = weekStartSerial(y, mi, 1);
    var lastRowStart  = weekStartSerial(y, mi, mdays);
    for (var rowStart = gridStart; rowStart <= lastRowStart; rowStart += wdCnt){
      html.push('<tr>');
      for (var c=0; c<wdCnt; c++){
        var s = rowStart + c;
        var d = fromSerial(s);
        if (d.year === y && d.mi === mi){
          var ctx = makeDayCtx(y, mi, d.day, dimActive);
          html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.td, ''));
        } else {
          html.push('<td style="'+STYLES.td+'"></td>');
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
    var ctx2 = makeDayCtx(d2.year, d2.mi, d2.day, dimActive);
    var numeralStyle = (d2.mi === mi) ? '' : 'opacity:.5;';
    html.push(tdHtmlForDay(ctx2, parts.monthColor, STYLES.td, numeralStyle));
  }
  html.push('</tr>', closeMonthTable());
  return html.join('');
}

function renderMiniCal(mi, yearLabel, dimActive){
  var y = (typeof yearLabel === 'number') ? yearLabel : getCal().current.year;
  return renderMonthTable({ year:y, mi:mi, mode:'full', dimPast: !!dimActive });
}

function renderCurrentMonth(){ return renderMiniCal(getCal().current.month, null, true); }

function yearHTMLFor(targetYear, dimActive){
  var months = getCal().months;
  var html = ['<div style="text-align:left;">'];
  for (var i=0; i<months.length; i++){
    html.push('<div style="'+STYLES.wrap+'">' + renderMiniCal(i, targetYear, !!dimActive) + '</div>');
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

function monthEventsHtml(mi, today){
  var cal = getCal(), curYear = cal.current.year;

  var evs = cal.events.filter(function(e){
    return ((+e.month||1)-1) === mi && (e.year == null || (e.year|0) === (curYear|0));
  }).sort(function(a,b){
    var da = DaySpec.first(a.day), db = DaySpec.first(b.day);
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
    var name = esc(eventDisplayName(e)); // includes (Source) when enabled
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

/* ============================================================================
 * 9) RANGE ENGINE + NEARBY EXTENSION
 * ==========================================================================*/

function _firstWeekdayOfMonth(year, mi, wdi){
  var first = weekdayIndex(year, mi, 1);
  var delta = (wdi - first + getCal().weekdays.length) % getCal().weekdays.length;
  return 1 + delta;
}

function _nthWeekdayOfMonth(year, mi, wdi, nth){
  var mdays = getCal().months[mi].days|0;
  var first = _firstWeekdayOfMonth(year, mi, wdi);
  var day = first + (nth-1)*weekLength();
  return (day<=mdays) ? day : null;
}

function _lastWeekdayOfMonth(year, mi, wdi){
  var mdays = getCal().months[mi].days|0;
  var lastWd = weekdayIndex(year, mi, mdays);
  var delta = (lastWd - wdi + getCal().weekdays.length) % getCal().weekdays.length;
  var day = mdays - delta;
  return day>=1 ? day : null;
}

function _tokenizeRangeArgs(args){ return (args||[]).map(function(t){return String(t).trim();}).filter(Boolean); }

function _isPhrase(tok){ return /^(month|year|current|this|next|previous|prev|last|upcoming|today|now)$/.test(String(tok||'').toLowerCase()); }

function dayFromOrdinalWeekday(year, mi, ow){
  if (!ow) return null;
  if (ow.ord === 'last') return _lastWeekdayOfMonth(year, mi, ow.wdi);
  var nth = {first:1, second:2, third:3, fourth:4, fifth:5}[ow.ord] || 1;
  var d = _nthWeekdayOfMonth(year, mi, ow.wdi, nth);
  return (d==null) ? _lastWeekdayOfMonth(year, mi, ow.wdi) : d; // fall back if “5th” doesn’t exist
}

function _allWeekdaysInMonth(year, mi, wdi){
  var mdays = getCal().months[mi].days|0;
  var first = _firstWeekdayOfMonth(year, mi, wdi);
  var out = [];
  for (var d = first; d <= mdays; d += weekLength()){ out.push(d); }
  return out;
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
  // Phrase forms first (today/this month/next year/etc.)
  if (tokens.length && _isPhrase(tokens[0].toLowerCase())){
    var ps = _phraseToSpec(tokens);
    if (ps) return ps;
  }

  var cal=getCal(), cur=cal.current, months=cal.months, dpy=daysPerYear();

  // Ordinal weekday + (optional "of") month [+ optional year] → single day
  var ow = Parse.ordinalWeekday.fromTokens(tokens);
  if (ow){
    var year = (typeof ow.year==='number') ? ow.year : cur.year;
    var mi   = (ow.mi!==-1) ? ow.mi : cur.month;
    var day;
    if (ow.ord==='last') day = _lastWeekdayOfMonth(year, mi, ow.wdi);
    else {
      var nth = {first:1,second:2,third:3,fourth:4,fifth:5}[ow.ord]||1;
      day = _nthWeekdayOfMonth(year, mi, ow.wdi, nth);
      if (day==null){ day = _lastWeekdayOfMonth(year, mi, ow.wdi); }
    }
    var start = toSerial(year, mi, day), end = start;
    return {
      title: (ow.ord==='last' ? 'Last ' : (String(ow.ord).charAt(0).toUpperCase()+String(ow.ord).slice(1)+' ')) + getCal().weekdays[ow.wdi] + ' — ' + formatDateLabel(year, mi, day, true),
      start:start, end:end, months:[{y:year,mi:mi}]
    };
  }

  // Month/Day/Year loose (supports month alone, day-only, etc.)
  var md = Parse.monthYearLoose(tokens);

  if (md.mi!==-1 && md.day!=null && md.year!=null){
    var dClamp = clamp(md.day, 1, months[md.mi].days);
    var s = toSerial(md.year, md.mi, dClamp);
    return { title:'Events — '+formatDateLabel(md.year, md.mi, dClamp, true),
             start:s, end:s, months:[{y:md.year,mi:md.mi}] };
  }
  if (md.mi!==-1 && md.day!=null){
    var nextY = nextForMonthDay(cur, md.mi, md.day).year;
    var d2 = clamp(md.day, 1, months[md.mi].days);
    var s2 = toSerial(nextY, md.mi, d2);
    return { title:'Next '+months[md.mi].name+' '+d2, start:s2, end:s2, months:[{y:nextY,mi:md.mi}] };
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

  // Default: current month
  return {
    title:'This Month',
    start: toSerial(cur.year, cur.month, 1),
    end:   toSerial(cur.year, cur.month, getCal().months[cur.month].days),
    months:[{y:cur.year,mi:cur.month}]
  };
}

/* ============================================================================
 * 10) OCCURRENCES, BOUNDARY STRIPS & LISTS
 * ==========================================================================*/

function occurrencesInRange(startSerial, endSerial){
  var cal=getCal(), dpy=daysPerYear(), capNotice=false;
  var yStart=Math.floor(startSerial/dpy), yEnd=Math.floor(endSerial/dpy);
  if (yEnd - yStart > 120){ yEnd = yStart + 120; capNotice=true; }

  var occ = [];
  for (var i=0;i<cal.events.length;i++){
    var e = cal.events[i];
    var mi = clamp(e.month,1,cal.months.length)-1;
    var maxD = cal.months[mi].days|0;
    var ows = Parse.ordinalWeekday.fromSpec(e.day);

    var ys = (e.year==null) ? yStart : (e.year|0);
    var ye = (e.year==null) ? yEnd   : (e.year|0);

    for (var y=ys; y<=ye; y++){
      var days = ows
        ? (ows.ord === 'every'
            ? _allWeekdaysInMonth(y, mi, ows.wdi)
            : (function(){ var d = dayFromOrdinalWeekday(y, mi, ows); return d ? [d] : []; })())
        : DaySpec.expand(e.day, maxD);

      for (var k=0;k<days.length;k++){
        var d = clamp(days[k],1,maxD);
        var ser = toSerial(y, mi, d);
        if (ser>=startSerial && ser<=endSerial){
          occ.push({serial:ser, y:y, m:mi, d:d, e:e});
        }
      }
    }
  }
  occ.sort(function(a,b){
    return (a.serial - b.serial) || (a.m - b.m) || (a.d - b.d);
  });
  if (capNotice){ sendChat(script_name,'/w gm Range capped at 120 years for performance.'); }
  return occ;
}

// Want-strip logic for automatic "nearby" extension
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
function _setMin(setObj){ var keys = Object.keys(setObj).map(function(k){return +k;}); return keys.length ? Math.min.apply(null, keys) : null; }
function _setMax(setObj){ var keys = Object.keys(setObj).map(function(k){return +k;}); return keys.length ? Math.max.apply(null, keys) : null; }

function renderMonthStripWantedDays(year, mi, wantedSet, dimActive){
  var parts = openMonthTable(mi, year);
  var html  = [parts.html];
  var wdCnt = getCal().weekdays.length|0;

  var minD = _setMin(wantedSet), maxD = _setMax(wantedSet);
  if (minD == null || maxD == null){
    html.push('<tr><td colspan="'+wdCnt+'" style="'+STYLES.td+';opacity:.6;">(no days)</td></tr>');
    html.push(closeMonthTable());
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
        var ctx = makeDayCtx(d.year, d.mi, d.day, !!dimActive);
        html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.td, ''));
      } else {
        html.push('<td style="'+STYLES.td+'"></td>');
      }
    }
    html.push('</tr>');
  }
  html.push(closeMonthTable());
  return html.join('');
}

function adjacentPartialMonths(spec){
  var cal = getCal(), today = todaySerial();
  var res = { prev:null, next:null };
  var wdCnt = weekLength()|0;

  function collectMonthRows(y, mi, firstRow, lastRow){
    var wanted = {};
    for (var row = firstRow; row <= lastRow; row += wdCnt){
      _setAddAll(wanted, _rowDaysInMonth(y, mi, row));
    }
    return wanted;
  }

  // PREPEND: if today is within 5 days BEFORE start → show tail of previous month strip
  if (today < spec.start && (spec.start - today) <= NEARBY_THRESHOLD){
    var startD = fromSerial(spec.start);
    var prevMi = (startD.mi + cal.months.length - 1) % cal.months.length;
    var prevY  = startD.year - (startD.mi === 0 ? 1 : 0);
    var prevMD = cal.months[prevMi].days|0;

    var tD = fromSerial(today);
    var todayDay = (tD.year === prevY && tD.mi === prevMi) ? tD.day : prevMD;

    var todayRow = weekStartSerial(prevY, prevMi, todayDay);
    var lastRow  = weekStartSerial(prevY, prevMi, prevMD);

    var wanted = collectMonthRows(prevY, prevMi, todayRow, lastRow);

    var backRow = todayRow - wdCnt, safety = 0;
    while (_setCount(wanted) < 5 && safety++ < 6){
      var extra = _rowDaysInMonth(prevY, prevMi, backRow);
      if (!extra.length) break;
      _setAddAll(wanted, extra);
      backRow -= wdCnt;
    }
    res.prev = { y:prevY, mi:prevMi, wanted:wanted };
  }

  // APPEND: if today is within 5 days AFTER end → show head of next month strip
  if (today > spec.end && (today - spec.end) <= NEARBY_THRESHOLD){
    var endD = fromSerial(spec.end);
    var nextMi = (endD.mi + 1) % cal.months.length;
    var nextY  = endD.year + (nextMi === 0 ? 1 : 0);

    var firstRow = weekStartSerial(nextY, nextMi, 1);

    var tD2 = fromSerial(today);
    var todayRow2 = (tD2.year === nextY && tD2.mi === nextMi)
      ? weekStartSerial(nextY, nextMi, tD2.day)
      : firstRow;

    var wanted2 = collectMonthRows(nextY, nextMi, firstRow, todayRow2);

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

  var present = {};
  for (var i=0; i<months.length; i++){
    present[ months[i].y + '|' + months[i].mi ] = 1;
  }

  var boundary = adjacentPartialMonths(spec);
  var today = todaySerial();
  var td = fromSerial(today);

  function stripHasToday(s) {
    if (!s || !s.wanted) return false;
    return (td.year === s.y) && (td.mi === s.mi) && !!s.wanted[td.day];
  }

  var prevKey = boundary.prev ? (boundary.prev.y + '|' + boundary.prev.mi) : null;
  var nextKey = boundary.next ? (boundary.next.y + '|' + boundary.next.mi) : null;

  // Global “are we rendering the Today cell anywhere?”
  var dimActiveAll =
    isTodayVisibleInRange(spec.start, spec.end) ||
    (!!boundary.prev && !present[prevKey] && stripHasToday(boundary.prev)) ||
    (!!boundary.next && !present[nextKey] && stripHasToday(boundary.next));

  if (boundary.prev && !present[ boundary.prev.y + '|' + boundary.prev.mi ]){
    out.push(
      '<div style="'+STYLES.wrap+'">' +
        renderMonthStripWantedDays(boundary.prev.y, boundary.prev.mi, boundary.prev.wanted, dimActiveAll) +
      '</div>'
    );
  }

  for (var k=0; k<months.length; k++){
    var m = months[k];
    out.push(
      '<div style="'+STYLES.wrap+'">' +
        renderMonthTable({ year:m.y, mi:m.mi, mode:'full', dimPast: dimActiveAll }) +
      '</div>'
    );
  }

  if (boundary.next && !present[ boundary.next.y + '|' + boundary.next.mi ]){
    out.push(
      '<div style="'+STYLES.wrap+'">' +
        renderMonthStripWantedDays(boundary.next.y, boundary.next.mi, boundary.next.wanted, dimActiveAll) +
      '</div>'
    );
  }

  out.push('</div>');
  return out.join('');
}

function stripRangeExtensionDynamic(spec){
  var months = _monthsFromRangeSpec(spec);
  var present = {};
  for (var i=0;i<months.length;i++) present[ months[i].y + '|' + months[i].mi ] = 1;

  var boundary = adjacentPartialMonths(spec);
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
 * 11) SHOW/SEND
 * ==========================================================================*/

function deliverRange(opts){
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

/* ============================================================================
 * 12) EVENTS LISTS
 * ==========================================================================*/

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
      var name2 = eventDisplayName(o.e); // includes (Source) when enabled
      out.push(eventLineHtml(o.y, o.m, o.d, name2, includeYear, (o.serial===today), getEventColor(o.e)));
    }
    return out.join('');
  }

  // (feature still exists if someone enables it in settings)
  var groups = {}, order = [];
  for (var k=0;k<occ.length;k++){
    var o2 = occ[k];
    var src = (o2.e && typeof o2.e.source === 'string') ? o2.e.source.trim() : '';
    var key = src ? titleCase(src) : 'Other';
    if (!groups[key]){ groups[key] = []; order.push(key); }
    groups[key].push(o2);
  }
  order.sort(function(a,b){ if (a==='Other') return 1; if (b==='Other') return -1; return a.localeCompare(b); });
  for (var g=0; g<order.length; g++){
    var label = order[g];
    out.push('<div style="margin-top:6px;font-weight:bold;">'+esc(label)+'</div>');
    var arr = groups[label];
    for (var j=0;j<arr.length;j++){
      var o3 = arr[j];
      var name3 = st.showSourceLabels ? (o3.e && o3.e.name ? String(o3.e.name) : '(unnamed event)')
                                      : eventDisplayName(o3.e);
      out.push(eventLineHtml(o3.y, o3.m, o3.d, name3, includeYear, (o3.serial===today), getEventColor(o3.e)));
    }
  }
  return out.join('');
}

/* ============================================================================
 * 13) Roll20 State Interaction & UI
 * ==========================================================================*/

function currentDateLabel(){
  var cal = getCal(), cur = cal.current;
  return cal.weekdays[cur.day_of_the_week] + ", " +
         cur.day_of_the_month + " " +
         cal.months[cur.month].name + ", " +
         cur.year + " " + LABELS.era;
}

function nextForDayOnly(cur, day, monthsLen){
  var months = getCal().months;
  var want = Math.max(1, day|0);
  var m = cur.month, y = cur.year;

  // If current month has the day and it's today or later → use current month
  if (want <= (months[m].days|0) && cur.day_of_the_month <= want) {
    return { month: m, year: y };
  }

  // Otherwise step forward until we find a month that has the requested day
  for (var i = 0; i < monthsLen * 2; i++){ // safety
    m = (m + 1) % monthsLen;
    if (m === 0) y++;
    if (want <= (months[m].days|0)) return { month: m, year: y };
  }
  // Fallback (shouldn't happen): next month
  m = (cur.month + 1) % monthsLen; y += (m === 0 ? 1 : 0);
  return { month: m, year: y };
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
    renderCurrentMonth(),
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

function _parseSharpColorToken(tok){
  if (!tok || tok[0] !== '#') return null;
  var raw = tok.slice(1).trim();
  var hex = sanitizeHexColor('#'+raw);
  if (hex) return hex;
  var named = NAMED_COLORS[String(raw).toLowerCase()] || null;
  return named;
}

function parseDatePrefixForAdd(tokens){
  tokens = (tokens || []).filter(Boolean);
  if (!tokens.length) return null;

  var cal = getCal(), cur = cal.current, months = cal.months;

  // Try the unified MDY/day-only parser on up to first 3 tokens
  var r = Parse.looseMDY(tokens.slice(0,3));
  if (r){
    if (r.kind === 'dayOnly'){
      var nx = nextForDayOnly(cur, r.day, months.length);
      var d  = clamp(r.day, 1, months[nx.month].days|0);
      return { used: 1, mHuman: nx.month+1, day: d, year: nx.year };
    } else {
      var d2 = clamp(r.day, 1, months[r.mi].days|0);
      var y  = (r.year != null) ? r.year : nextForMonthDay(cur, r.mi, d2).year;
      return { used: (r.year!=null)?3:2, mHuman: r.mi+1, day: d2, year: y };
    }
  }

  // Fallback: treat the very first token as "day-only" (so "!cal add 14 Feast" works)
  var t0  = tokens[0];
  var od  = Parse.ordinalDay(t0);
  var num = /^\d+$/.test(t0) ? (parseInt(t0,10)|0) : null;
  var dd  = (od != null) ? od : num;
  if (dd != null){
    var nx2 = nextForDayOnly(cur, dd, months.length);
    var d3  = clamp(dd, 1, months[nx2.month].days|0);
    return { used: 1, mHuman: nx2.month+1, day: d3, year: nx2.year };
  }
  return null;
}

// Smart add: !cal add [DD] NAME [#COLOR|color] | !cal add MM DD [YYYY] NAME [#COLOR|color]
function addEventSmart(tokens){
  tokens = (tokens || []).filter(function(t){ return String(t).trim() !== '--'; });

  var pref = parseDatePrefixForAdd(tokens);
  if (!pref) { warnGM('Usage: !cal add [MM DD [YYYY] | <MonthName> DD [YYYY] | DD] NAME [#COLOR|color]'); return; }

  var rest = tokens.slice(pref.used);
  var pulled = popColorIfPresent(rest, /*allowBareName*/true);
  var color  = pulled.color;
  var name   = (pulled.tokens.join(' ').trim() || 'Untitled Event');

  var ok = _addConcreteEvent(pref.mHuman, String(pref.day), pref.year, name, color);
  if (ok){ refreshAndSend(); warnGM('Added 1 event.'); }
  else   { warnGM('No event added (duplicate or invalid).'); }
}

function addMonthlySmart(tokens){
  tokens = (tokens || []).filter(function(t){ return String(t).trim() !== '--'; });
  if (!tokens.length){
    return warnGM(
      'Usage: !cal addmonthly <daySpec> NAME [#COLOR|color]\n'
      + 'daySpec can be N, N-M, or "first|second|third|fourth|fifth|last <weekday>" (also "every <weekday>").'
    );
  }

  var daySpec = null, used = 0;

  // Ordinal weekday: "first far", "last zor", "every sul"
  if (tokens[1]){
    var two = (tokens[0] + ' ' + tokens[1]).toLowerCase().trim();
    if (Parse.ordinalWeekday.fromSpec(two)){ daySpec = two; used = 2; }
  }

  // Numeric day / range / ordinal day word
  if (!daySpec){
    var one = String(tokens[0]).toLowerCase().trim();
    if (/^\d+(-\d+)?$/.test(one)) {
      daySpec = one; used = 1;
    } else {
      var asNum = Parse.ordinalDay(one);
      if (asNum != null) { daySpec = String(asNum); used = 1; }
    }
  }

  if (!daySpec){
    return warnGM('Couldn’t parse daySpec. Try: 6  |  18-19  |  "first far"  |  "last zor"  |  "every sul".');
  }

  var pulled = popColorIfPresent(tokens.slice(used), /*allowBareName*/true);
  var color  = pulled.color;
  var name   = (pulled.tokens.join(' ').trim() || 'Untitled Event');

  var cal = getCal(), added = 0;
  for (var m = 1; m <= cal.months.length; m++){
    if (_addConcreteEvent(m, daySpec, null, name, color)) added++;
  }
  refreshAndSend();
  warnGM('Added '+added+' monthly event'+(added===1?'':'s')+' for "'+esc(name)+'" on '+esc(daySpec)+'.');
}

function addYearlySmart(tokens){
  tokens = (tokens || []).filter(function(t){ return String(t).trim() !== '--'; });
  if (!tokens.length){
    return warnGM(
      'Usage: !cal addyearly <Month> <DD|DD-DD|ordinal-day> NAME [#COLOR|color]\n'
      + '   or: !cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> NAME [#COLOR|color]'
    );
  }

  var cal = getCal();
  var used = 0, mHuman = null, daySpec = null;

  // (A) Ordinal weekday with month (tokens form). Example: "first far [of] Barrakas"
  (function tryOrdinalWeekdayWithMonth(){
    if (daySpec != null) return;
    var ow = Parse.ordinalWeekday.fromTokens(tokens);
    if (!ow) return;

    // Must have an explicit month for annual events
    var idx = 2; // <ord> <weekday> ...
    if (tokens[idx] && /^of$/i.test(tokens[idx])) idx++;

    var mi = -1;
    if (tokens[idx]){
      mi = monthIndexByName(tokens[idx]);
      if (mi === -1 && /^\d+$/.test(tokens[idx])){
        var n = parseInt(tokens[idx],10)|0;
        if (n>=1 && n<=cal.months.length) mi = n-1;
      }
    }
    if (mi === -1) return; // no explicit month -> let other forms try

    mHuman = mi + 1;
    daySpec = (String(tokens[0]) + ' ' + String(tokens[1])).toLowerCase().trim();

    // figure out how many tokens we consumed for name slice
    used = 2; // ord + weekday
    if (tokens[used] && /^of$/i.test(tokens[used])) used++;
    used++; // month
    // optional year token (ignored for annual; just skip if present)
    if (tokens[used] && /^\d{1,6}$/.test(tokens[used])) used++;
  })();

  // (B) Regular yearly: "<Month> <DD|DD-DD|ordinal-day> ..."
  if (daySpec == null){
    var mi2 = monthIndexByName(tokens[0]);
    if (mi2 !== -1 && tokens[1]){
      var dTok = String(tokens[1]).toLowerCase().trim();
      if (/^\d+-\d+$/.test(dTok)){     // range like 26-28
        mHuman = mi2 + 1;
        daySpec = dTok;
        used = 2;
      } else {
        var dNum = /^\d+$/.test(dTok) ? (parseInt(dTok,10)|0) : Parse.ordinalDay(dTok);
        if (dNum != null){
          mHuman = mi2 + 1;
          daySpec = String(dNum);
          used = 2;
        }
      }
    }
  }

  // (C) Fallback: reuse add prefix parser, but only if it parsed an MDY form
  if (daySpec == null){
    var pref = Parse.looseMDY(tokens.slice(0,3));
    if (!pref || pref.kind !== 'mdy') {
      return warnGM('Usage: !cal addyearly <Month> <DD|DD-DD|ordinal-day> NAME [#COLOR|color]\n'
        + '   or: !cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> NAME [#COLOR|color]');
    }
    mHuman  = pref.mi+1;
    daySpec = String(pref.day);
    used    = (pref.year!=null)?3:2;
  }

  // Remaining → name (with optional trailing color)
  var pulled = popColorIfPresent(tokens.slice(used), /*allowBareName*/true);
  var color  = pulled.color;
  var name   = (pulled.tokens.join(' ').trim() || 'Untitled Event');

  var ok = _addConcreteEvent(mHuman, daySpec, null, name, color); // year=null (annual)
  if (ok){ refreshAndSend(); warnGM('Added annual event “‘'+esc(name)+'” on '+esc(daySpec)+' of month '+mHuman+'.'); }
  else   { warnGM('No event added (duplicate or invalid).'); }
}

function stepDays(n){
  n = (parseInt(n,10) || 0)|0;
  var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length|0;
  var startSerial = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var dest = startSerial + n;
  var d = fromSerial(dest);
  cur.day_of_the_week = (cur.day_of_the_week + ((n % wdlen) + wdlen)) % wdlen;
  cur.year = d.year; cur.month = d.mi; cur.day_of_the_month = d.day;
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
  if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
  if (!events.length){ sendChat(script_name, '/w gm No events to remove.'); return; }

  var toks = String(query||'').trim().split(/\s+/).filter(Boolean);
  var sub = (toks[0]||'').toLowerCase();

  if (sub === 'key'){
    var key = _decKey(toks.slice(1).join(' ').trim());
    if (!key){ sendChat(script_name, '/w gm Usage: <code>!cal remove key &lt;KEY&gt;</code>'); return; }
    var idx = eventIndexByKey(key);
    if (idx < 0){ sendChat(script_name, '/w gm No event found for key: <code>'+esc(key)+'</code>'); return; }
    var removed = events.splice(idx, 1)[0];
    markSuppressedIfDefault(removed);
    refreshAndSend();
    var rName = eventDisplayName(removed) || removed.name || '(unnamed event)';
    sendChat(script_name, '/w gm Removed: '+esc(rName)+'.');
    return;
  }

  sendChat(script_name, '/w gm Usage: <code>!cal remove [list | key &lt;KEY&gt; | &lt;name fragment&gt;]</code>');
}

function _defaultDetailsForKey(key){
  var cal = getCal();
  var parts = String(key||'').split('|');
  var mHuman = parseInt(parts[0],10)|0;
  var daySpec = parts[1]||'';
  var nameLower = (parts[3]||'').toLowerCase();

  var lim = Math.max(1, cal.months.length);
  var out = { name: titleCase(nameLower), month: mHuman, day: daySpec, color: null, source: null };

  deepClone(defaults.events).forEach(function(de){
    var monthsList = (String(de.month).toLowerCase() === 'all')
      ? (function(){ var a=[]; for(var i=1;i<=lim;i++) a.push(i); return a; })()
      : [ clamp(parseInt(de.month,10)||1, 1, lim) ];
    monthsList.forEach(function(m){
      var maxD = cal.months[m-1].days|0;
      var norm = DaySpec.normalize(de.day, maxD) || String(DaySpec.first(de.day));
      var k = defaultKeyFor(m, norm, de.name);
      if (k === key){
        out.name   = String(de.name||out.name);
        out.color  = resolveColor(de.color) || null;
        out.source = (de.source!=null) ? String(de.source) : null;
      }
    });
  });
  return out;
}

/* ============================================================================
 * 14) BUTTONED TABLES / LISTS
 * ==========================================================================*/

function _encKey(k){ return encodeURIComponent(String(k)); }

function _decKey(k){ try { return decodeURIComponent(String(k)); } catch(e){ return String(k||''); } }

function listAllEventsTableHtml(){
  var cal = getCal(), evs = cal.events || [];
  if(!evs.length) return '<div style="opacity:.7;">No events.</div>';

  var rows = evs.map(function(e, i){
    var mi = (e.month|0) - 1;
    var mm = (mi+1);
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = eventDisplayName(e);
    var sw = swatchHtml(getEventColor(e));
    return '<tr>' +
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>' +
      '<td style="'+STYLES.td+'">'+ sw + esc(name) +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ mm +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>' +
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
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>';
}

function removeListHtml(){
  var cal = getCal(), evs = cal.events || [];
  if(!evs.length) return '<div style="opacity:.7;">No events to remove.</div>';

  var rows = evs.map(function(e, i){
    var mi = (e.month|0) - 1, mm = (mi+1);
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = eventDisplayName(e);
    var sw = swatchHtml(getEventColor(e));
    var key = eventKey(e); // stable
    var rm = button('Remove', 'remove key '+_encKey(key));
    return '<tr>' +
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>' +
      '<td style="'+STYLES.td+'">'+ sw + esc(name) +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ mm +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>' +
      '<td style="'+STYLES.td+';text-align:center;">'+ rm +'</td>' +
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
         '<div style="opacity:.75;margin-top:4px;">Note: indexes are reassigned after each removal. Buttons use stable keys and remain valid.</div>';
}

function removeMatchesListHtml(needle){
  var cal = getCal(), evs = cal.events || [];
  var q = String(needle||'').trim().toLowerCase();
  if (!q) return '<div style="opacity:.7;">Provide a name fragment to search.</div>';

  var matches = [];
  for (var i=0; i<evs.length; i++){
    var nm = String(evs[i].name||'').toLowerCase();
    if (nm.indexOf(q) !== -1) matches.push(i);
  }
  if (!matches.length){ return '<div style="opacity:.7;">No events matched “' + esc(needle) + '”.</div>'; }

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  var rows = matches.map(function(i){
    var e = evs[i], mi = (e.month|0) - 1, mm = mi+1;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = eventDisplayName(e);
    var sw = swatchHtml(getEventColor(e));
    var key = eventKey(e);
    var rm = button('Remove', 'remove key '+_encKey(key));
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + esc(name) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ mm +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ rm +'</td>'+
    '</tr>';
  }).join('');

  return '<div style="margin:4px 0;"><b>Remove Matches for “' + esc(needle) + '”</b></div>' +
         '<table style="'+STYLES.table+'">' + head + rows + '</table>' +
         '<div style="opacity:.75;margin-top:4px;">Indexes may change after removal; key-based buttons stay valid.</div>';
}

// Suppressed defaults list
function suppressedDefaultsListHtml(){
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

  var cal = getCal();

  var rows = keys.map(function(k){
    var info = _defaultDetailsForKey(k);
    var mi = (info.month|0)-1;
    var mm = (mi+1);
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
function restoreDefaultEvents(query){
  var cal = getCal();
  var sup = state[state_name].suppressedDefaults || (state[state_name].suppressedDefaults = {});
  var q = String(query||'').trim();
  if (!q){
    sendChat(script_name, '/w gm Usage: <code>!cal restore [all] [exact] &lt;name...&gt; | restore key &lt;KEY&gt; | restore list</code>');
    return;
  }

  var parts = q.split(/\s+/);
  var sub = (parts[0]||'').toLowerCase();

  // restore all defaults previously suppressed (respecting source disables)
  if (sub === 'all'){
    state[state_name].suppressedDefaults = {};
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, '/w gm Restored all default events (sources left as-is).');
    return;
  }

  // restore by exact key
  if (sub === 'key'){
    var key = _decKey(parts.slice(1).join(' ').trim());
    if (!key){
      sendChat(script_name, '/w gm Usage: <code>!cal restore key &lt;KEY&gt;</code>');
      return;
    }
    delete sup[key];
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, '/w gm Restored default for key: <code>'+esc(key)+'</code>.');
    return;
  }

  // restore by name (fragment) with optional "exact"
  var exact = false;
  if (sub === 'exact'){
    exact = true;
    parts.shift();
  }
  var needle = parts.join(' ').trim().toLowerCase();
  if (!needle){
    sendChat(script_name, '/w gm Usage: <code>!cal restore [exact] &lt;name...&gt;</code>');
    return;
  }

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
sendChat(script_name, '/w gm Restored '+restored+' default event'+(restored===1?'':'s')+' matching “'+esc(needle)+'”.');
}

/* ============================================================================
 * 15) THEMES, NAMES, SOURCES
 * ==========================================================================*/

function themeListHtml(readOnly){
  var names = Object.keys(COLOR_THEMES).sort();
  if(!names.length) return '<div style="opacity:.7;">No themes available.</div>';
  var rows = names.map(function(n){
    var swatches = (COLOR_THEMES[n]||[]).slice(0,12).map(function(c){
      return '<span title="'+esc(c)+'" style="display:inline-block;width:12px;height:12px;border:1px solid #000;margin-right:2px;background:'+esc(c)+';"></span>';
    }).join('');
    var apply = readOnly ? '' : (' '+button('Apply', 'theme '+n));
    return '<div style="margin:4px 0;">'+swatches+' '+esc(n)+apply+'</div>';
  });
  return '<div style="margin:4px 0;"><b>Color Themes</b></div>'+rows.join('');
}

function namesListHtml(readOnly){
  var names = Object.keys(MONTH_NAME_SETS).sort();
  if(!names.length) return '<div style="opacity:.7;">No name sets available.</div>';
  var rows = names.map(function(n){
    var prev = (MONTH_NAME_SETS[n]||[]).map(esc).join(', ');
    var apply = readOnly ? '' : (' — '+button('Apply', 'names '+n));
    return '<div style="margin:4px 0;"><div style="margin-bottom:2px;"><b>'+esc(n)+'</b>'+apply+'</div><div style="opacity:.85;">'+prev+'</div></div>';
  });
  return '<div style="margin:4px 0;"><b>Month Name Sets</b></div>'+rows.join('');
}

function colorsNamedListHtml(){
  var items = Object.keys(NAMED_COLORS);
  if(!items.length) return '<div style="opacity:.7;">No named colors.</div>';
  items.sort();
  var rows = items.map(function(k){
    var c = NAMED_COLORS[k];
    return '<div style="margin:2px 0;">'+swatchHtml(c)+' <code>'+esc(k)+'</code> — '+esc(c)+'</div>';
  });
  return '<div style="margin:4px 0;"><b>Named Colors</b></div>'+rows.join('');
}

/* ============================================================================
 * 16) GM BUTTONS & NESTED HELP MENUS
 * ==========================================================================*/
function mb(label, cmd){ return button(label, cmd); } // menu button
function nav(label, page){ return button(label, 'help '+page); }
function _menuBox(title, innerHtml){
  return [
    '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:6px 0;">',
    '<div style="font-weight:bold;margin-bottom:4px;">', esc(title), '</div>',
    innerHtml,
    '</div>'
  ].join('');
}

function gmButtonsHtml(){
  var wrap = STYLES.gmbuttonWrap;
  return [
    '<div style="'+wrap+'">'+ nav('⏮️ Retreat','step') +'</div>',
    '<div style="'+wrap+'">'+ nav('⏭️ Advance','step') +'</div>',
    '<div style="'+wrap+'">'+ mb('📣 Send','send')     +'</div>',
    '<div style="'+wrap+'">'+ nav('❔ Help','root')    +'</div>'
  ].join('');
}


function helpRootMenu(m){
  var rows = [];
  rows.push(_menuBox('Display',
    navP(m,'Current','display')+' '+
    navP(m,'Months','display')+' '+
    navP(m,'Years','display')
  ));

  if (playerIsGM(m.playerid)){
    rows.push(_menuBox('Step',      navP(m,'Advance/Retreat','step')));
    rows.push(_menuBox('Events',    navP(m,'Manage','events')+' '+navP(m,'Defaults','defaults')+' '+navP(m,'Sources','sources')));
    rows.push(_menuBox('Themes & Names',
      navP(m,'Themes','themes')+' '+
      navP(m,'Month Names','names')+' '+
      navP(m,'Weekday Names','weekdays')+' '+
      navP(m,'Season Sets','seasons')+' '+
      navP(m,'Colors','colors')
    ));
    rows.push(_menuBox('Settings',  navP(m,'Settings','settings')));
    rows.push(_menuBox('Maintenance', navP(m,'Maintenance','maint')));
  }
  whisper(m.who, rows.join(''));
}

function helpDisplayMenu(m){
  var monthPart =
    _menuBox('Months (show/send)',
      mbP(m,'Show: Current','show month')+' '+
      mbP(m,'Show: Next','show next month')+' '+
      mbP(m,'Show: Previous','show previous month')+'<br>'+
      mbP(m,'Send: Current','send month')+' '+
      mbP(m,'Send: Next','send next month')+' '+
      mbP(m,'Send: Previous','send previous month')
    );
  var yearPart =
    _menuBox('Years (show/send)',
      mbP(m,'Show: Current','show year')+' '+
      mbP(m,'Show: Next','show next year')+' '+
      mbP(m,'Show: Previous','show previous year')+'<br>'+
      mbP(m,'Send: Current','send year')+' '+
      mbP(m,'Send: Next','send next year')+' '+
      mbP(m,'Send: Previous','send previous year')
    );
  var back = '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>';
  whisper(m.who, monthPart + yearPart + back);
}

function helpStepMenu(m){
  if (!playerIsGM(m.playerid)){
    return whisper(m.who, '<div style="opacity:.7;">GM only.</div>'+ '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
  }
  var cal = getCal(), cur = cal.current;
  var monthLen = cal.months[cur.month].days | 0;
  var yearLen  = daysPerYear();
  var wLen     = weekLength();

  var rows = [
    _menuBox('Advance',
      mbP(m,'Day','advance 1')       + ' ' +
      mbP(m,'Week','advance ' + wLen) + ' ' +
      mbP(m,'Month','advance ' + monthLen) + ' ' +
      mbP(m,'Year','advance ' + yearLen)
    ),
    _menuBox('Retreat',
      mbP(m,'Day','retreat 1')       + ' ' +
      mbP(m,'Week','retreat ' + wLen) + ' ' +
      mbP(m,'Month','retreat ' + monthLen) + ' ' +
      mbP(m,'Year','retreat ' + yearLen)
    ),
    '<div style="margin-top:8px;">' + navP(m,'⬅ Back','root') + '</div>'
  ];
  whisper(m.who, rows.join(''));
}

function helpEventsMenu(m){
  if (!playerIsGM(m.playerid)){
    return whisper(m.who, '<div style="opacity:.7;">Only the GM can manage events.</div><div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
  }
  var rows = [
    _menuBox('Lists',
      mbP(m,'All (meta)','list')+' '+
      mbP(m,'Remove List','remove list')
    ),
    _menuBox('Add (syntax only)',
      '<div style="opacity:.8">Type these in chat:</div>'+
      '<div><code>!cal add [MM DD [YYYY] | &lt;MonthName&gt; DD [YYYY] | DD] NAME [#COLOR|color]</code></div>'
    ),
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  ];
  whisper(m.who, rows.join(''));
}

function helpDefaultsMenu(m){
  if (!playerIsGM(m.playerid)){
    return whisper(m.who, '<div style="opacity:.7;">GM only.</div>'+ '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
  }
  var rows = [
    _menuBox('Suppressed Defaults',
      mbP(m,'View & Restore','restore list')
    ),
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  ];
  whisper(m.who, rows.join(''));
}

function helpSourcesMenu(m){
  if (!playerIsGM(m.playerid)){
    var ro = _menuBox('Sources',
      '<div style="opacity:.8;">Only the GM can enable/disable sources.</div>'
    );
    return whisper(m.who, ro + '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
  }
  var rows = [
    _menuBox('Sources',
      '<div>'+mbP(m,'List Sources','source list')+'</div>'+
      '<div style="opacity:.8;margin-top:4px;">Enable/disable requires a name: <code>!cal source enable &lt;name&gt;</code> / <code>!cal source disable &lt;name&gt;</code></div>'
    ),
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  ];
  whisper(m.who, rows.join(''));
}

function helpThemesMenu(m){
  var ro = !playerIsGM(m.playerid);
  var box = _menuBox(ro ? 'Themes (view only)' : 'Themes', themeListHtml(ro));
  whisper(m.who, box + '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

function helpNamesMenu(m){
  var ro = !playerIsGM(m.playerid);
  var box = _menuBox(ro ? 'Month Names (view only)' : 'Month Names', namesListHtml(ro));
  whisper(m.who, box + '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

function helpWeekdaysMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisper(m.who, _menuBox(ro ? 'Weekday Names (view only)' : 'Weekday Names', weekdayListHtml(ro)) + '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

function helpSeasonsMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisper(m.who, _menuBox(ro ? 'Season Sets (view only)' : 'Season Sets', seasonSetListHtml(ro)) + '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

function helpColorsMenu(m){
  whisper(m.who, _menuBox('Named Colors', colorsNamedListHtml()) + '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

function helpSettingsMenu(m){
  if (!playerIsGM(m.playerid)){
    return whisper(m.who, '<div style="opacity:.7;">GM only.</div>'+ '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
  }
  var st = ensureSettings();
  var groupbutton = mbP(m,'Group by Source: ' + (st.groupEventsBySource ? 'On' : 'Off') + ' (toggle)',
                    'settings group ' + (st.groupEventsBySource ? 'off' : 'on'));
  var labelsbutton = mbP(m,'Source Labels: ' + (st.showSourceLabels ? 'On' : 'Off') + ' (toggle)',
                     'settings labels ' + (st.showSourceLabels ? 'off' : 'on'));
  var box = _menuBox('Settings', groupbutton + ' ' + labelsbutton);
  whisper(m.who, box + '<div style="margin-top:8px;">' + navP(m,'⬅ Back','root') + '</div>');
}

function helpMaintMenu(m){
  if (!playerIsGM(m.playerid)){
    return whisper(m.who, '<div style="opacity:.7;">GM only.</div>'+nav('⬅ Back','root'));
  }
  var rows = [
    _menuBox('Maintenance',
      '<div style="margin-top:6px;opacity:.85;">Reset to defaults. This will nuke all custom events and current date.</div>' +
      '<div style="margin-top:6px;opacity:.85;"><code>!cal resetcalendar</code></div>'
    ),
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  ];
  whisper(m.who, rows.join(''));
}

function weekdayListHtml(readOnly){
  var names = Object.keys(WEEKDAY_NAME_SETS).sort();
  if(!names.length) return '<div style="opacity:.7;">No weekday sets.</div>';
  var rows = names.map(function(n){
    var prev = (WEEKDAY_NAME_SETS[n]||[]).map(esc).join(', ');
    var apply = readOnly ? '' : (' — '+button('Apply','weekdays '+n));
    return '<div style="margin:4px 0;"><div style="margin-bottom:2px;"><b>'+esc(n)+'</b>'+apply+'</div><div style="opacity:.85;">'+prev+'</div></div>';
  });
  return '<div style="margin:4px 0;"><b>Weekday Name Sets</b></div>'+rows.join('');
}

function seasonSetListHtml(readOnly){
  var names = Object.keys(SEASON_SETS).sort();
  if(!names.length) return '<div style="opacity:.7;">No season sets.</div>';
  var rows = names.map(function(n){
    var prev = (SEASON_SETS[n]||[]).map(esc).join(', ');
    var apply = readOnly ? '' : (' — '+button('Apply','seasons '+n));
    return '<div style="margin:4px 0;"><div style="margin-bottom:2px;"><b>'+esc(n)+'</b>'+apply+'</div><div style="opacity:.85;">'+prev+'</div></div>';
  });
  return '<div style="margin:4px 0;"><b>Season Sets</b></div>'+rows.join('');
}


/* ============================================================================
 * 17) COMMANDS & ROUTING
 * ==========================================================================*/

// Sender helpers
function send(opts, html){
  opts = opts || {};
  var to = cleanWho(opts.to);
  var prefix;
  if (opts.broadcast)      prefix = '/direct ';
  else if (opts.gmOnly)    prefix = '/w gm ';
  else if (to)             prefix = '/w "' + to + '" ';
  else                     prefix = '/direct ';
  sendChat(script_name, prefix + html);
}

  function sendToAll(html){ send({ broadcast:true }, html); }
  function sendToGM(html){  send({ gmOnly:true }, html); }
  function whisper(to, html){ send({ to:to }, html); }
  function warnGM(msg){ sendChat(script_name, '/w gm ' + msg); }
function cleanWho(who){
  return String(who||'')
    .replace(/\s+\(GM\)$/,'')
    .replace(/["\\]/g,'')
    .trim();
}
function _normalizePackedWords(q){
  return String(q||'')
    .replace(/\b(nextmonth)\b/gi, 'next month')
    .replace(/\b(nextyear)\b/gi, 'next year')
    .replace(/\b(upcomingmonth)\b/gi, 'upcoming month')
    .replace(/\b(upcomingyear)\b/gi, 'upcoming year')
    .replace(/\b(currentmonth|thismonth)\b/gi, 'month')
    .replace(/\b(thisyear)\b/gi, 'year')
    .replace(/\b(lastmonth)\b/gi, 'last month')
    .replace(/\b(lastyear)\b/gi, 'last year')
    .replace(/\b(previousmonth|prevmonth)\b/gi, 'previous month')
    .replace(/\b(previousyear|prevyear)\b/gi, 'previous year')
    .replace(/\b(next[-_]month)\b/gi,'next month')
    .replace(/\b(next[-_]year)\b/gi,'next year')
    .replace(/\b(upcoming[-_]month)\b/gi,'upcoming month')
    .replace(/\b(upcoming[-_]year)\b/gi,'upcoming year')
    .trim();
}


function runEventsShortcut(m, a, sub){
  var args = a.slice(2);
  return invokeEventSub(m, String(sub||'list').toLowerCase(), args);
}

function usage(key, m){ whisper(m.who, USAGE[key]); }

var USAGE = {
  'events.add':     'Usage: !cal add [MM DD [YYYY] | <MonthName> DD [YYYY] | DD] NAME [#COLOR|color] (DD may be an ordinal like 1st or fourteenth)',
  'events.remove':  'Usage: !cal remove [list | key <KEY> | <name fragment>]',
  'events.restore': 'Usage: !cal restore [all] [exact] <name...> | restore key <KEY>',
  'date.set':       'Usage: !cal set [MM] DD [YYYY] or !cal set <MonthName> DD [YYYY] (DD may be an ordinal like 1st or fourteenth)'
};

function invokeEventSub(m, sub, args){
  var cfg = EVENT_SUB[sub];
  if (!cfg) return whisper(m.who, 'Unknown events subcommand. Try: add | remove | restore | list');
  if (cfg.usage && (!args || args.length === 0)) return usage(cfg.usage, m);
  return cfg.run(m, args || []);
}

var EVENT_SUB = {
  add: {
    usage: 'events.add',
    run: function(m, args){ addEventSmart(args); }
  },
  remove: {
    usage: 'events.remove',
    run: function(m, args){
      if (!args || !args.length) { whisper(m.who, removeListHtml()); return; } // ← add this
      var sub = String(args[0]||'').toLowerCase();
      if (sub === 'list') {
        if (args.length === 1) { whisper(m.who, removeListHtml()); return; }
        return usage('events.remove', m);
      }
      if (sub === 'key') { removeEvent(args.join(' ')); return; }
      whisper(m.who, removeMatchesListHtml(args.join(' ')));
    }
  },
  restore: {
    usage: 'events.restore',
    run: function(m, args){
      if ((args[0] || '').toLowerCase() === 'list'){
        whisper(m.who, suppressedDefaultsListHtml());
        return;
      }
      restoreDefaultEvents(args.join(' '));
    }
  },
  list: {
    usage: null,
    run: function(m){ whisper(m.who, listAllEventsTableHtml()); }
  }
};

var commands = {

// Everyone (self-whisper)
  '': function (m, a) { // bare !cal
    var restTokens = _normalizePackedWords(a.slice(1).join(' ')).split(/\s+/).filter(Boolean);
    if (!restTokens.length) { // no args
      sendCurrentDate(m.who, false);
      sendGMButtons(m);
      return;
    }
    deliverRange({ who:m.who, args:restTokens, mode:'cal', dest:'whisper' }); // has args
    sendGMButtons(m);
  },

  show: function (m, a) { // !cal show [...]
    var restTokens = _normalizePackedWords(a.slice(2).join(' ')).split(/\s+/).filter(Boolean);
    if (!restTokens.length) { // no args
      sendCurrentDate(m.who, false);
      sendGMButtons(m);
      return;
    }
    deliverRange({ who:m.who, args:restTokens, mode:'cal', dest:'whisper' }); // has args
    sendGMButtons(m);
  },

  help: function(m, a){
    var page = String(a[2]||'').toLowerCase();
    switch(page){
      case 'display':  return helpDisplayMenu(m);
      case 'step':     return helpStepMenu(m);
      case 'events':   return helpEventsMenu(m);
      case 'defaults': return helpDefaultsMenu(m);
      case 'sources':  return helpSourcesMenu(m);
      case 'themes':   return helpThemesMenu(m);
      case 'names':    return helpNamesMenu(m);
      case 'colors':   return helpColorsMenu(m);
      case 'weekdays': return helpWeekdaysMenu(m);
      case 'seasons':  return helpSeasonsMenu(m);
      case 'settings': return helpSettingsMenu(m);
      case 'maint':    return helpMaintMenu(m);
      case 'root':
      default:         return helpRootMenu(m);
    }
  },

  // Settings (GM)
  settings: { gm:true, run:function(m,a){
    var key = String(a[2]||'').toLowerCase();
    var val = String(a[3]||'').toLowerCase();
    if (!key || !/^(group|labels)$/.test(key) || !/^(on|off)$/.test(val)){
      return whisper(m.who,'Usage: <code>!cal settings (group|labels) (on|off)</code>');
    }
    var st = ensureSettings();
    if (key==='group')  st.groupEventsBySource = (val==='on');
    if (key==='labels') st.showSourceLabels    = (val==='on');
    refreshAndSend();
    whisper(m.who,'Setting updated.');
  }},

  events: { gm:true, run:function(m, a){
  var args = a.slice(2);
  var sub  = (args.shift() || 'list').toLowerCase();
  return invokeEventSub(m, sub, args);
  }},

  // Aliases
  add:     { gm:true, run:function(m,a){ runEventsShortcut(m, a, 'add'); } },
  remove: { gm:true, run:function(m,a){
    var args = a.slice(2);
    if (!args.length) { whisper(m.who, removeListHtml()); return; }
    return invokeEventSub(m,'remove', args);
  }},
  restore: { gm:true, run:function(m,a){ runEventsShortcut(m, a, 'restore'); } },

  addmonthly: { gm:true, run:function(m,a){ addMonthlySmart(a.slice(2)); } },
  addyearly:  { gm:true, run:function(m,a){ addYearlySmart(a.slice(2)); } },
  addannual:  { gm:true, run:function(m,a){ addYearlySmart(a.slice(2)); } },


  // GM: Send (broadcast)
  send: { gm:true, run:function (m, a) { // !cal send [...]
    var restTokens = _normalizePackedWords(a.slice(2).join(' ')).split(/\s+/).filter(Boolean);
    if (!restTokens.length) { // no args
      sendCurrentDate(null, false);
      return;
    }
    deliverRange({ args:restTokens, mode:'cal', dest:'broadcast' }); // has args
  }},

  advance: { gm:true, run:function(m,a){ stepDays(parseInt(a[2],10) || 1); } },
  retreat: { gm:true, run:function(m,a){ stepDays(-(parseInt(a[2],10) || 1)); } },
  set: { gm:true, run:function(m,a){
    var r = Parse.looseMDY(a.slice(2));
    if (!r){ return whisper(m.who, USAGE['date.set']); }

    var cal = getCal(), cur = cal.current, months = cal.months;

    if (r.kind === 'dayOnly'){
      var next = nextForDayOnly(cur, r.day, months.length);
      var d = clamp(r.day, 1, months[next.month].days|0);
      setDate(next.month+1, d, next.year);
      return;
    }

    // kind: 'mdy'
    var mi = r.mi;
    var d2 = clamp(r.day, 1, months[mi].days|0);
    var y  = (r.year != null) ? r.year : cur.year;
    setDate(mi+1, d2, y);
  }},

  // Theming & names (GM)
  theme: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){ return whisper(m.who, themeListHtml()); }
    if (!COLOR_THEMES[sub]) return whisper(m.who, 'Unknown theme. Try <code>!cal theme list</code>.');
    ensureSettings().colorTheme = sub;
    colorsAPI.reset();
    refreshAndSend();
    whisper(m.who, 'Color theme set to <b>'+esc(sub)+'</b>.');
  }},

  names: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){ return whisper(m.who, namesListHtml()); }
    if (!MONTH_NAME_SETS[sub]) return whisper(m.who, 'Unknown set. Try <code>!cal names list</code>.');

    // Only persist if apply succeeds
    if (!applyMonthSet(sub)) {
      return whisper(m.who, 'That set doesn’t fit this calendar.');
    }

    var st = ensureSettings();

    // Auto-apply a matching theme (can be changed later)
    var autoTheme = NAMESET_TO_THEME[sub];
    st.monthSet = sub;
    if (autoTheme && COLOR_THEMES[autoTheme]) st.colorTheme = autoTheme;
    colorsAPI.reset();

    refreshAndSend();
    whisper(m.who, 'Month names set to <b>'+esc(sub)+'</b>'+ (autoTheme ? ' (auto theme: <b>'+esc(autoTheme)+'</b>)' : '') +'.');
  }},


  weekdays: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){ return whisper(m.who, weekdayListHtml()); }
    if (!WEEKDAY_NAME_SETS[sub]) return whisper(m.who, 'Unknown set. Try <code>!cal weekdays list</code>.');

    // Only persist if apply succeeds
    if (!applyWeekdaySet(sub)) {
      return whisper(m.who, 'That set doesn’t fit this calendar.');
    }

    var st = ensureSettings();
    st.weekdaySet = sub;

    refreshAndSend();
    whisper(m.who, 'Weekday names set to <b>'+esc(sub)+'</b>.');
  }},

  seasons: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){ return whisper(m.who, seasonSetListHtml()); }
    if (!SEASON_SETS[sub]) return whisper(m.who, 'Unknown set. Try <code>!cal seasons list</code>.');

    // Only persist if apply succeeds
    if (!applySeasonSet(sub)) {
      return whisper(m.who, 'That set doesn’t fit this calendar.');
    }

    var st = ensureSettings();
    st.seasonSet = sub;

    refreshAndSend();
    whisper(m.who, 'Season set applied: <b>'+esc(sub)+'</b>.');
  }},


  // Sources (GM)
  source: { gm:true, run: function(m, a){
    var args = a.slice(2).map(function(x){ return String(x).trim(); }).filter(Boolean);
    var sub = (args[0]||'').toLowerCase();
    var suppressedSources = state[state_name].suppressedSources || (state[state_name].suppressedSources = {});
    function listSources(){
  var cal = getCal(), seen = {};
  defaults.events.forEach(function(de){ if (de.source) seen[String(de.source).toLowerCase()] = String(de.source); });
  cal.events.forEach(function(e){ if (e.source) seen[String(e.source).toLowerCase()] = String(e.source); });

  var names = Object.keys(seen).sort();
  if (!names.length){ return whisper(m.who, '<div><b>Sources</b></div><div style="opacity:.7;">No sources found.</div>'); }

  var head =  '<tr>'+
              '<th style="'+STYLES.th+'">Source</th>' +
              '<th style="'+STYLES.th+'">Status</th>' +
              '<th style="'+STYLES.th+'">Action</th>' +
              '</tr>';

  var rows = names.map(function(k){
    var label = seen[k];
    var disabled = !!suppressedSources[k];
    var status = disabled ? 'Disabled' : 'Enabled';
    var actionbutton = disabled
      ? button('Enable',  'source enable '  + label)
      : button('Disable', 'source disable ' + label);
    return '<tr>'
      + '<td style="'+STYLES.td+'">'+esc(label)+'</td>'
      + '<td style="'+STYLES.td+';text-align:center;">'+status+'</td>'
      + '<td style="'+STYLES.td+';text-align:center;">'+actionbutton+'</td>'
      + '</tr>';
  }).join('');

  whisper(m.who,
    '<div style="margin:4px 0;"><b>Sources</b></div>'
    + '<table style="'+STYLES.table+'">'+head+rows+'</table>'
    + '<div style="opacity:.75;margin-top:4px;">(Buttons call <code>!cal source enable/disable &lt;name&gt;</code>.)</div>'
  );
}

    function disableSource(name){
      var key = String(name||'').toLowerCase();
      if (!key){ whisper(m.who, 'Usage: <code>!cal source disable &lt;name&gt;</code>'); return; }
      suppressedSources[key] = 1;
      var cal = getCal(), defaultsSet = currentDefaultKeySet(cal);
      cal.events = cal.events.filter(function(e){
        var src = (e.source != null) ? String(e.source).toLowerCase() : null;
        if (src !== key) return true;
        var maxD = cal.months[e.month-1].days|0;
        var norm = DaySpec.canonicalForKey(e.day, maxD);
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
      // Clear per-key suppressions for this source so they "flip together"
      var sup = state[state_name].suppressedDefaults || {};
      Object.keys(sup).forEach(function(k){
        var info = _defaultDetailsForKey(k);
        var src = (info.source != null) ? String(info.source).toLowerCase() : null;
        if (src === key) delete sup[k];
      });
      mergeInNewDefaultEvents(getCal());
      refreshAndSend();
      sendChat(script_name, '/w gm Enabled source "'+esc(name)+'" and restored its default events.');
    }
    if (!sub || sub==='list') return listSources();
    if (sub==='disable'){ if (!args[1]) return whisper(m.who,'Usage: <code>!cal source disable &lt;name&gt;</code>'); return disableSource(args.slice(1).join(' ')); }
    if (sub==='enable'){ if (!args[1]) return whisper(m.who,'Usage: <code>!cal source enable &lt;name&gt;</code>'); return enableSource(args.slice(1).join(' ')); }
    whisper(m.who, 'Usage: <code>!cal source [list|disable|enable] [&lt;name&gt;]</code>');
  }},

  // Maintenance (GM)
  resetcalendar:   { gm:true, run:function(){ resetToDefaults(); } }
};

function sendGMButtons(m){
  if (playerIsGM(m.playerid)) whisper(m.who, gmButtonsHtml());
}

/* ============================================================================
 * 18) BOOT
 * ==========================================================================*/
function handleInput(msg){
  if (msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/);
  args = args.slice(0,2).concat(_normalizePackedWords(args.slice(2).join(' ')).split(/\s+/).filter(Boolean));
  var sub = String(args[1]||'').toLowerCase();
  var cmd = commands[sub] || commands[''];
  if (typeof cmd === 'function'){ cmd(msg, args); return; }
  if (cmd.gm && !playerIsGM(msg.playerid)){
    whisper(cleanWho(msg.who), LABELS.gmOnlyNotice);
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
    '<div>Use <code>!cal help</code> for help.</div>'
  );
});

// Final return (bottom of IIFE)
return {
  checkInstall: checkInstall,
  register: register,
  render: renderAPI,
  events: eventsAPI,
  colors: colorsAPI
};
})();