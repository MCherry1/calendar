// Section 1: Constants
import { CONFIG_ERA_LABEL } from './config.js';
import { _isLeapMonth } from './date-math.js';
import { occurrencesInRange } from './events.js';
import { commands } from './today.js';


/* ============================================================================
 * 1) CONSTANTS
 * Hard-coded world and system values. Edit here to tune behaviour; these are
 * not exposed in menus. See README.md for guidance on each value.
 * ==========================================================================*/

export var script_name = 'Calendar';
export var state_name = 'CALENDAR';

/* --- Calendar name sets ---------------------------------------------------*/
// All sets switchable live via the Appearance menu or !cal names / weekdays / seasons / etc.
// To add a custom set, add an entry to the object and to its ORDER array below it.

export var _SEASONS_EBERRON = [
  "Mid-winter","Late winter","Early spring","Mid-spring","Late spring","Early summer",
  "Mid-summer","Late summer","Early autumn","Mid-autumn","Late autumn","Early winter"
];
// Each entry: { names[12], hemisphereAware?, transitions?, transitionsSouth? }
// hemisphereAware: if true, hemisphere setting (north/south) flips weather offset and
//   season names by 6 months (faerun) or uses alternate transitions (gregorian).
// Eberron and tropical sets are not hemisphere-aware — they are planar or equatorial.
export var SEASON_SETS = {
  // Eberron planar seasons — defined by the Draconic Prophecy, not geography.
  // These names are canon from the Eberron Campaign Setting.
  eberron: {
    names: _SEASONS_EBERRON.slice(),
    hemisphereAware: false
  },
  // Faerunian / generic geographic seasons — plain four-season names at month boundaries.
  // Hemisphere-aware: hemisphere south shifts all names by 6 months.
  faerun: {
    names: ['Winter','Winter','Spring','Spring','Spring',
            'Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'],
    hemisphereAware: true
  },
  // Gregorian mid-month transitions — season flips on the solstice/equinox day.
  // Northern transitions are standard astronomical dates.
  // Southern transitions are the same dates offset by 6 months.
  gregorian: {
    names: ['Winter','Winter','Spring','Spring','Spring',
            'Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'],
    hemisphereAware: true,
    transitions: [
      { mi:  2, day: 20, season: 'Spring' },   // March 20
      { mi:  5, day: 21, season: 'Summer' },   // June 21
      { mi:  8, day: 22, season: 'Autumn' },   // September 22
      { mi: 11, day: 21, season: 'Winter' }    // December 21
    ],
    transitionsSouth: [
      { mi:  2, day: 20, season: 'Autumn' },   // March 20
      { mi:  5, day: 21, season: 'Winter' },   // June 21
      { mi:  8, day: 22, season: 'Spring' },   // September 22
      { mi: 11, day: 21, season: 'Summer' }    // December 21
    ]
  },
  // Tropical monsoon — three-phase cycle: cool → hot → rainy, 4 months each.
  // Not hemisphere-aware: equatorial climates don't have meaningful hemispheres.
  tropical: {
    names: [
      'Early Cool Season','Early-Mid Cool Season','Mid-Late Cool Season','Late Cool Season',
      'Early Hot Season','Early-Mid Hot Season','Mid-Late Hot Season','Late Hot Season',
      'Early Rainy Season','Early-Mid Rainy Season','Mid-Late Rainy Season','Late Rainy Season'
    ],
    hemisphereAware: false
  }
};

/* --- Calendar structure sets ----------------------------------------------*/
// A structure set defines intercalary (festival/leap) days and their positions.
// Applying one rebuilds the month array with intercalary slots inserted.
// Non-intercalary slots receive their names and lengths from the active name/length sets.
// Each entry in the array is either:
//   { regularIndex: N }          → placeholder for regular month N (0-based)
//   { isIntercalary:true, name, days, leapEvery? }  → fixed festival day
// leapEvery: if set, this slot only exists in years where year % leapEvery === 0.
export var CALENDAR_STRUCTURE_SETS = {
  // Harptos calendar (Forgotten Realms / Forgotten Realms Dalereckoning).
  // 12 regular months × 30 days, 5 fixed festival days, Shieldmeet every 4 years.
  // Leap years: year % 4 === 0 in Dalereckoning (e.g. 1372 DR, 1376 DR).
  // Total: 365 days non-leap, 366 days leap.
  harptos: [
    { regularIndex: 0 },
    { isIntercalary:true, name:'Midwinter',       days:1 },
    { regularIndex: 1 },
    { regularIndex: 2 },
    { regularIndex: 3 },
    { isIntercalary:true, name:'Greengrass',      days:1 },
    { regularIndex: 4 },
    { regularIndex: 5 },
    { regularIndex: 6 },
    { isIntercalary:true, name:'Midsummer',       days:1 },
    { isIntercalary:true, name:'Shieldmeet',      days:1, leapEvery:4 },
    { regularIndex: 7 },
    { regularIndex: 8 },
    { regularIndex: 9 },
    { regularIndex:10 },
    { isIntercalary:true, name:'Highharvestide',  days:1 },
    { regularIndex:11 },
    { isIntercalary:true, name:'Feast of the Moon', days:1 }
  ],
  // Gregorian with leap day inserted after February.
  // The slot uses the full Gregorian rule in _isLeapMonth:
  // divisible by 4, except centuries unless divisible by 400.
  // Total: 365 days non-leap, 366 days leap.
  gregorian: [
    { regularIndex: 0 },
    { regularIndex: 1 },
    { isIntercalary:true, name:'Leap Day', days:1, leapEvery:4 },
    { regularIndex: 2 },
    { regularIndex: 3 },
    { regularIndex: 4 },
    { regularIndex: 5 },
    { regularIndex: 6 },
    { regularIndex: 7 },
    { regularIndex: 8 },
    { regularIndex: 9 },
    { regularIndex:10 },
    { regularIndex:11 }
  ]
};
/* --- Color themes ---------------------------------------------------------*/
// Switchable live via !cal theme. One hex color per month.
export var COLOR_THEMES = {
  seasons: [
    "#FFFFFF","#CBD5E1","#D8F3DC","#FFB7C5","#E6E6FA","#FFC54D",
    "#50C878","#64B5F6","#B38E3C","#FF7518","#8B5A2B","#475569"
  ],
  lunar: [
    "#F5F5FA","#FFC68A","#D3D3D3","#C0C0C0","#E6E6FA","#FFD96B",
    "#F5F5F5","#DCDCDC","#9AC0FF","#696969","#FF4500","#A9A9A9"
  ],
  druidic: [
    "#F2F7FF","#C9D6C3","#D8F3DC","#D8CFEA","#9EC5E8","#FFC54D",
    "#63D2FF","#50C878","#2E3A8C","#FF7518","#E6E6FA","#E8EDF2"
  ],
  halfling: [
    "#E8EEF3","#BDE0FE","#C7CBD1","#2F855A","#F48FB1","#BF946A",
    "#D6C151","#8B0000","#F3ECDB","#8E3B46","#C7C3E3","#6B7280"
  ],
  dwarven: [
    "#0D0D0D","#2F343B","#7A4E1D","#7F8999","#C0C0C0","#FFB11B",
    "#E5E4E2","#0A3A8C","#064E3B","#FF7518","#C21807","#DDEAF7"
  ],
  birthstones: [
    "#7A1E2C","#8E5AC8","#66E5D9","#F2FBFF","#00A86B","#F7F3EE",
    "#D0002A","#A8E100","#0A4AA6","#E83E8C","#FFA726","#00B8D4"
  ]
};
export var THEME_ORDER = ['seasons','lunar','druidic','halfling','dwarven','birthstones'];
/* --- Named colors for events ----------------------------------------------*/
// Use by name in event commands: !cal add March 14 Feast emerald
export var NAMED_COLORS: Record<string, string> = {
  red:    '#E53935', apple:  '#D32F2F', garnet: '#9B111E', pink:      '#EC407A',
  orange: '#F4511E', brown:  '#6D4C41', copper: '#B87333',
  yellow: '#FDD835', lemon:  '#FBC02D', gold:   '#D4AF37', topaz:     '#FFC54D',
  green:  '#43A047', lime:   '#7CB342', forest: '#228B22', emerald:   '#50C878', teal: '#00897B',
  blue:   '#1E88E5', royal:  '#3949AB', sky:    '#29B6F6', sapphire:  '#0F52BA', aqua: '#7FFFD4',
  indigo: '#3949AB', navy:   '#283593',
  violet: '#7E57C2', purple: '#5E35B1', grape:  '#8E24AA', amethyst:  '#9966CC',
  black:  '#000000', obsidian:'#0D0D0D', onyx:  '#353839', gray:      '#9E9E9E',
  silver: '#C0C0C0', platinum:'#E5E4E2', white: '#FFFFFF', snow:      '#FFFAFA', diamond: '#E6F7FF'
};
NAMED_COLORS.grey       = NAMED_COLORS.gray;
NAMED_COLORS.forestgreen= NAMED_COLORS.forest;
NAMED_COLORS.skyblue    = NAMED_COLORS.sky;
NAMED_COLORS.charcoal   = NAMED_COLORS.onyx;
NAMED_COLORS.snowwhite  = NAMED_COLORS.snow;

/* --- Default events -------------------------------------------------------*/
// Canon Eberron calendar observances, grouped by source.
// Sources can be enabled/disabled live via !cal source enable/disable <name>.
// Individual events can be hidden via the Active Events menu.
// Fields: name, month (1-based or "all"), day (number, "N-M", or ordinal weekday),
//         color (hex or named color), source (must match the key below).
export var DEFAULT_EVENTS = {
  sharn: [
    { name: "Tain Gala",               month: "all", day: "first far", color: "#F7E7CE" },
    { name: "Crystalfall",             month: 2,     day: 9,           color: "#D7F3FF" },
    { name: "Day of Ashes",            month: 5,     day: 3,           color: "#B0BEC5" },
    { name: "The Race of Eight Winds", month: 7,     day: 23,          color: "#006D3C" }
  ],
  khorvaire: [
    { name: "Day of Mourning",  month: 2,  day: 20, color: "#9E9E9E" },
    { name: "Galifar's Throne", month: 6,  day: 5,  color: "#D4AF37" },
    { name: "Thronehold",       month: 11, day: 11, color: "#E80001" }
  ],
  "sovereign host": [
    { name: "Onatar's Flame",    month: 1,  day: 7,  color: "#FF6F00" },
    { name: "Turrant's Gift",    month: 2,  day: 14, color: "#B8860B" },
    { name: "Olladra's Feast",   month: 2,  day: 28, color: "#8BC34A" },
    { name: "Sun's Blessing",    month: 3,  day: 15, color: "#FFC107" },
    { name: "Aureon's Crown",    month: 5,  day: 26, color: "#283593" },
    { name: "Brightblade",       month: 6,  day: 12, color: "#B71C1C" },
    { name: "Bounty's Blessing", month: 7,  day: 14, color: "#388E3C" },
    { name: "The Hunt",          month: 8,  day: 4,  color: "#1B5E20" },
    { name: "Boldrei's Feast",   month: 9,  day: 9,  color: "#F57C00" },
    { name: "Market Day",        month: 11, day: 20, color: "#FFD54F" }
  ],
  "dark six": [
    { name: "Shargon's Bargain", month: 4,  day: 13,      color: "#006064" },
    { name: "Second Skin",       month: 6,  day: 11,      color: "#809E62" },
    { name: "Wildnight",         month: 10, day: "18-19", color: "#AD1457" },
    { name: "Long Shadows",      month: 12, day: "26-28", color: "#0D0D0D" }
  ],
  "silver flame": [
    { name: "Rebirth Eve",           month: 1,     day: 14,        color: "#EAF2FF" },
    { name: "Bright Souls' Day",     month: 2,     day: 18,        color: "#FFF2C6" },
    { name: "Tirasday",              month: 3,     day: 5,         color: "#DCEBFF" },
    { name: "Initiation Day",        month: 4,     day: 11,        color: "#C7E3FF" },
    { name: "Baker's Night",         month: 5,     day: 6,         color: "#D8B98F" },
    { name: "Promisetide",           month: 5,     day: 28,        color: "#BDE3FF" },
    { name: "First Dawn",            month: 6,     day: 21,        color: "#FFD1A6" },
    { name: "Silvertide",            month: 7,     day: 14,        color: "#F2F7FF" },
    { name: "Victory Day",           month: 8,     day: 9,         color: "#B3E5FC" },
    { name: "Fathen's Fall",         month: 8,     day: 25,        color: "#E7ECF5" },
    { name: "The Ascension",         month: 10,    day: 1,         color: "#E6F0FF" },
    { name: "Saint Valtros's Day",   month: 10,    day: 25,        color: "#E8ECFF" },
    { name: "Rampartide",            month: 11,    day: 24,        color: "#D6F5D6" },
    { name: "Khybersef",             month: 12,    day: 27,        color: "#111827" },
    { name: "Day of Cleansing Fire", month: "all", day: "all sul", color: "#F2F7FF" }
  ],
  stormreach: [
    { name: "The Burning Titan",  month: 3,  day: 1,      color: "#FF5722" },
    { name: "Pirate’s Moon",      month: 5,  day: 20,     color: "#0E7490" },
    { name: "The Annual Games",   month: 6,  day: "1-14", color: "#2E7D32" },
    { name: "Shacklebreak",       month: 11, day: 1,      color: "#455A64" }
  ],
  // Standard astronomical + calendrical season markers for Gregorian campaigns.
  // Each day carries both the solstice/equinox name and the "First Day of X" label
  // so GMs can use whichever fits their world’s flavor.
  // Dates are the standard modern astronomical dates (northern hemisphere).
  gregorian_seasons: [
    { name: "First Day of Winter",month: 12, day: 21, color: "#A8DADC" },
    { name: "Winter Solstice",    month: 12, day: 21, color: "#A8DADC" },
    { name: "First Day of Spring",month: 3,  day: 20, color: "#A8E6A3" },
    { name: "Spring Equinox",     month: 3,  day: 20, color: "#A8E6A3" },
    { name: "First Day of Summer",month: 6,  day: 21, color: "#FFD166" },
    { name: "Summer Solstice",    month: 6,  day: 21, color: "#FFD166" },
    { name: "First Day of Autumn",month: 9,  day: 22, color: "#F4A261" },
    { name: "Autumn Equinox",     month: 9,  day: 22, color: "#F4A261" }
  ]
};

// Optional source-to-calendar scoping for default events.
// If a source key appears here, its events only load for listed calendar systems.
export var DEFAULT_EVENT_SOURCE_CALENDARS = {
  sharn:             ['eberron'],
  khorvaire:         ['eberron'],
  'sovereign host':  ['eberron'],
  'dark six':        ['eberron'],
  'silver flame':    ['eberron'],
  stormreach:        ['eberron'],
  gregorian_seasons: ['gregorian']
};

/* --- Rendering constants --------------------------------------------------*/
export var RANGE_CAP_YEARS = null; // max years occurrencesInRange scans; null = unlimited
export var CONTRAST_MIN_HEADER = 4.5;  // WCAG AA for normal text
export var CONTRAST_MIN_CELL = 7.0;  // tighter for small calendar numerals

/* --- UI labels and CSS ----------------------------------------------------*/
export var LABELS = {
  era:         CONFIG_ERA_LABEL,
  gmOnlyNotice:'Only the GM can use that calendar command.'
};

export var STYLES = {
  wrap:            'display:inline-block;vertical-align:top;margin:4px;overflow:visible;',
  table:           'border-collapse:collapse;margin:4px;margin-bottom:14px;',
  th:              'border:1px solid #444;padding:2px;width:2em;text-align:center;',
  head:            'border:1px solid #444;padding:0;',
  td:              'border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;',
  calTd:           'border:1px solid #444;width:2em;padding:0;text-align:center;vertical-align:middle;',
  calCellInner:    'min-height:2.35em;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;padding:1px 0 2px;box-sizing:border-box;',
  monthHeaderBase: 'padding:6px;text-align:left;',
  gmbuttonWrap:    'display:inline-block;margin:2px 4px 2px 0;',
  today:  'position:relative;z-index:10;border-radius:2px;box-shadow:0 3px 8px rgba(0,0,0,.65),0 12px 24px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.18);outline:2px solid rgba(0,0,0,.35);outline-offset:1px;box-sizing:border-box;overflow:visible;font-weight:bold;font-size:1.2em;',
  past:   'opacity:0.65;',
  future: 'opacity:0.95;'
};

// Auto-assign colors to events that have none (stable pseudo-random by name hash)
export var PALETTE = [
  '#E53935','#EF5350','#FF7043','#F4511E',
  '#FFB300','#F6BF26','#FDD835','#C0CA33',
  '#7CB342','#66BB6A','#43A047','#228B22',
  '#26A69A','#00897B','#00ACC1','#29B6F6',
  '#039BE5','#1E88E5','#3949AB','#0D47A1',
  '#5E35B1','#7E57C2','#8E24AA','#AB47BC',
  '#D81B60','#EC407A','#6D4C41','#8D6E63',
  '#795548','#5D4037','#607D8B','#78909C'
];



