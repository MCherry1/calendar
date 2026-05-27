// Section 1: Constants
//
// Roll20-side rendering constants and presentation defaults. Anything that's
// canonical world data (months, intercalaries, moon cycles, holidays) now
// lives in `@partybuff/calendar-engine` and is consumed via `src/worlds/`.

import { CONFIG_ERA_LABEL } from './config.js';
import { getStructuralArray, WORLD_ORDER, WORLDS } from './worlds/index.js';


/* ============================================================================
 * 1) CONSTANTS
 * Hard-coded world and system values. Edit here to tune behaviour; these are
 * not exposed in menus. See README.md for guidance on each value.
 * ==========================================================================*/

// User-visible "speaker" name in Roll20 chat. Brand-facing.
export var script_name = 'Party Buff Calendar';
// Roll20 state key. DO NOT rename — would orphan existing saved data for
// any GM whose game has previously persisted calendar state.
export var state_name = 'CALENDAR';

/* --- Season sets ----------------------------------------------------------*/
// Season sets are Roll20-side because the engine's Season shape doesn't yet
// model hemisphere-aware name shifts or astronomical transition tables.
// Built from per-world overlays plus a few generic/global options the wizard
// surfaces alongside.

export var _SEASONS_EBERRON = [
  "Mid-winter","Late winter","Early spring","Mid-spring","Late spring","Early summer",
  "Mid-summer","Late summer","Early autumn","Mid-autumn","Late autumn","Early winter"
];

// Generic geographic + tropical sets always available as wizard options.
const GLOBAL_SEASON_SETS: Record<string, any> = {
  faerun: {
    label: 'Northern Hemisphere',
    names: ['Winter','Winter','Spring','Spring','Spring',
            'Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'],
    hemisphereAware: true
  },
  gregorian: {
    names: ['Winter','Winter','Spring','Spring','Spring',
            'Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'],
    hemisphereAware: true,
    transitions: [
      { mi:  2, day: 20, season: 'Spring' },
      { mi:  5, day: 21, season: 'Summer' },
      { mi:  8, day: 22, season: 'Autumn' },
      { mi: 11, day: 21, season: 'Winter' }
    ],
    transitionsSouth: [
      { mi:  2, day: 20, season: 'Autumn' },
      { mi:  5, day: 21, season: 'Winter' },
      { mi:  8, day: 22, season: 'Spring' },
      { mi: 11, day: 21, season: 'Summer' }
    ]
  },
  tropical: {
    label: 'Tropical',
    names: [
      'Early Cool Season','Early-Mid Cool Season','Mid-Late Cool Season','Late Cool Season',
      'Early Hot Season','Early-Mid Hot Season','Mid-Late Hot Season','Late Hot Season',
      'Early Rainy Season','Early-Mid Rainy Season','Mid-Late Rainy Season','Late Rainy Season'
    ],
    hemisphereAware: false
  }
};

// Compose: pull each world's per-overlay season set, then layer GLOBAL_SEASON_SETS on top.
export var SEASON_SETS: Record<string, any> = (function(){
  const out: Record<string, any> = {};
  // Eberron has a special planar season set; surface its named list explicitly
  // so the existing `_SEASONS_EBERRON` re-export stays meaningful.
  out.eberron = { names: _SEASONS_EBERRON.slice(), hemisphereAware: false };
  for (const key of WORLD_ORDER){
    const w = WORLDS[key];
    if (!w) continue;
    for (const s of w.seasons){
      // Skip if a global key would otherwise shadow it (the global versions
      // are the "canonical" geographic options the wizard offers across worlds).
      if (GLOBAL_SEASON_SETS[s.key]) continue;
      out[s.key] = {
        label: s.key,
        names: s.names.slice(),
        hemisphereAware: !!s.hemisphereAware,
        transitions: s.transitions ? s.transitions.slice() : undefined,
        transitionsSouth: s.transitionsSouth ? s.transitionsSouth.slice() : undefined,
      };
    }
  }
  Object.assign(out, GLOBAL_SEASON_SETS);
  return out;
}());

/* --- Calendar structure sets ----------------------------------------------*/
// Derived from per-world structural data. Each entry is a list of slot
// templates where regularIndex placeholders sit alongside intercalary
// (festival/leap) slots. `applyStructureSet` uses these to rebuild
// `cal.months` after a world switch.
export var CALENDAR_STRUCTURE_SETS: Record<string, any> = (function(){
  const out: Record<string, any> = {};
  for (const key of WORLD_ORDER){
    const arr = getStructuralArray(key);
    if (!arr || !arr.length) continue;
    // Only emit a structure set if this world has any intercalary slots
    // (worlds without intercalaries don't need the rebuild path).
    if (!arr.some(function(s){ return s.isIntercalary; })) continue;
    out[key] = arr.map(function(s){
      if (s.isIntercalary){
        return { isIntercalary: true, name: s.name, days: s.days, leapEvery: s.leapEvery || undefined };
      }
      return { regularIndex: s.regularIndex };
    });
  }
  return out;
}());

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
  ],
  greyhawk: [
    "#E8EDF3","#C9D6E3","#A8E6A3","#D8F3DC","#B5D89A","#FFC54D",
    "#FFD700","#64B5F6","#F4A261","#8B5A2B","#B38E3C","#475569"
  ],
  dragonlance: [
    "#C0D6E4","#8FAABB","#C8E6C9","#A5D6A7","#E6E6FA","#FFD54F",
    "#FFB74D","#E57373","#FFCC80","#CE93D8","#78909C","#546E7A"
  ],
  exandria: [
    "#E3F2FD","#BBDEFB","#C8E6C9","#A5D6A7","#FFF9C4","#FFE082",
    "#FFAB40","#EF9A9A","#CE93D8","#B39DDB","#90A4AE"
  ],
  mystara: [
    "#E0F7FA","#B2EBF2","#C8E6C9","#A5D6A7","#DCEDC8","#FFF9C4",
    "#FFE082","#FFCC80","#FFAB91","#BCAAA4","#B0BEC5","#78909C"
  ],
  birthright: [
    "#D7CCC8","#BCAAA4","#C8E6C9","#A5D6A7","#AED581","#FFEE58",
    "#FFD54F","#FFB74D","#FF8A65","#A1887F","#90A4AE","#78909C"
  ]
};
export var THEME_ORDER = ['seasons','lunar','druidic','halfling','dwarven','birthstones','greyhawk','dragonlance','exandria','mystara','birthright'];
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
// Composed from each world's `eventPacks`. Keyed by source name to preserve
// the previous flat shape that `state.ts::_flattenSources` expects.
export var DEFAULT_EVENTS: Record<string, any[]> = (function(){
  const out: Record<string, any[]> = {};
  for (const key of WORLD_ORDER){
    const w = WORLDS[key];
    if (!w || !w.eventPacks) continue;
    for (const pack of w.eventPacks){
      out[pack.key] = pack.events.map(function(e){
        // Strip the per-event `source` field; the flatten step re-attaches
        // the pack key as the source. The shape mirrors the legacy data.
        const { source: _src, ...rest } = e as any;
        return rest;
      });
    }
  }
  return out;
}());

// Source-to-calendar scoping for default events. Mirrors the legacy table,
// derived from which world owns each pack key.
export var DEFAULT_EVENT_SOURCE_CALENDARS: Record<string, string[]> = (function(){
  const out: Record<string, string[]> = {};
  for (const key of WORLD_ORDER){
    const w = WORLDS[key];
    if (!w || !w.eventPacks) continue;
    for (const pack of w.eventPacks){
      if (!out[pack.key]) out[pack.key] = [];
      out[pack.key].push(key);
    }
  }
  return out;
}());

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
  calTd:           'border:1px solid #444;width:2em;height:2em;padding:0;text-align:center;vertical-align:middle;',
  calCellInner:    'min-height:2em;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;padding:1px 0;box-sizing:border-box;position:relative;',
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
