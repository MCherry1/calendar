/* ============================================================================
 * Weather System — Data Tables
 * Pure data declarations with no function dependencies.
 * ==========================================================================*/

// Uncertainty tiers for forecast distance
export var WEATHER_UNCERTAINTY: any = {
  certain:   { maxDist:  1, label: 'Certain'   },
  likely:    { maxDist:  3, label: 'Likely'    },
  uncertain: { maxDist:  7, label: 'Uncertain' },
  vague:     { maxDist: 20, label: 'Vague'     }
};

// Periods shown in low-detail player view
export var WEATHER_LOW_TOD_PERIODS = ['early_morning', 'afternoon', 'nighttime'];

// Period display metadata
export var WEATHER_PERIOD_META: any = {
  middle_of_night: { label:'Middle of the Night', shortLabel:'Middle', icon:'🌌' },
  nighttime:       { label:'Nighttime',           shortLabel:'Night',  icon:'🌙' },
  early_morning: { label:'Early Morning', shortLabel:'Early', icon:'🌅' },
  morning:       { label:'Morning',       shortLabel:'Morning', icon:'☀' },
  afternoon:     { label:'Afternoon',     shortLabel:'Afternoon', icon:'☁' },
  evening:       { label:'Evening',       shortLabel:'Evening', icon:'🌆' }
};

// Mini-calendar time labels
export var WEATHER_TOD_MINICAL_LABELS: any = {
  middle_of_night: '0-4a',
  early_morning: '4-8a',
  morning: '8-12p',
  afternoon: '12-4p',
  evening: '4-8p',
  nighttime: '8-12a'
};

// Stochastic TOD bell curve. One 1d20 roll per trait per period.
// 1→−2, 2–4→−1, 5–16→0, 17–19→+1, 20→+2. Applied after arc, clamped.
export var WEATHER_TOD_BELL = [
//  1    2   3   4    5  6  7  8  9 10 11 12 13 14 15 16   17  18  19   20
   -2,  -1, -1, -1,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  +1, +1, +1,  +2
];

// Deterministic TOD arc — the predictable daily shape per climate.
// Afternoon is the reference point (offset 0). Arc is scaled by geo × terrain
// arcMult. Overnight and shoulder buckets preserve continuity across six steps.
export var WEATHER_TOD_ARC: any = {
  polar: {
    temp:   { middle_of_night:-3, early_morning:-3, morning:-2, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:-1 },
    precip: { middle_of_night:0,  early_morning:0,  morning:0,  afternoon:0, evening:0, nighttime:0 }
  },
  continental: {
    temp:   { middle_of_night:-4, early_morning:-4, morning:-3, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:-1, afternoon:0, evening:+1, nighttime:+1 }
  },
  temperate: {
    temp:   { middle_of_night:-3, early_morning:-3, morning:-2, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:-1, afternoon:0, evening:+1, nighttime:+1 }
  },
  dry: {
    temp:   { middle_of_night:-5, early_morning:-5, morning:-4, afternoon:0, evening:-3, nighttime:-4 },
    wind:   { middle_of_night:-2, early_morning:-1, morning:-1, afternoon:0, evening:-1, nighttime:-2 },
    precip: { middle_of_night:0,  early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 }
  },
  tropical: {
    temp:   { middle_of_night:-2, early_morning:-2, morning:-2, afternoon:0, evening:0, nighttime:-1 },
    wind:   { middle_of_night:0,  early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:0,  afternoon:0, evening:+1, nighttime:+1 }
  },
  monsoon: {
    temp:   { middle_of_night:-1, early_morning:-2, morning:-2, afternoon:0, evening:0, nighttime:0 },
    wind:   { middle_of_night:0,  early_morning:-1, morning:-1, afternoon:0, evening:+1, nighttime:+1 },
    precip: { middle_of_night:+1, early_morning:0,  morning:-1, afternoon:0, evening:+2, nighttime:+1 }
  },
  mediterranean: {
    temp:   { middle_of_night:-4, early_morning:-4, morning:-3, afternoon:0, evening:-2, nighttime:-3 },
    wind:   { middle_of_night:-1, early_morning:-1, morning:-1, afternoon:0, evening:0, nighttime:0 },
    precip: { middle_of_night:+1, early_morning:0,  morning:0,  afternoon:0, evening:+1, nighttime:+1 }
  }
};

// ---------------------------------------------------------------------------
// Climate base tables — climates × 12 months (index 0=mid-winter … 11=early-winter)
// Each entry: { temp, wind, precip } each { base, die, min, max }
// Geography and terrain modifiers shift base/min/max uniformly. die is unchanged.
// Temperature values use the -5..15 band scale directly.
// Wind scale: 0=calm … 5=storm     Precip scale: 0=clear … 5=extreme
// ---------------------------------------------------------------------------
export var WEATHER_CLIMATE_BASE: any = {

  // Frostfell, Demon Wastes — perpetually cold, windswept, low moisture
  polar: [
    /*0  mid-win */ {temp:{base:-3,die:2,min:-4,max:-2}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*1  late-win*/ {temp:{base:-3,die:2,min:-4,max:-2}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*2  early-sp*/ {temp:{base:-2,die:2,min:-2,max:0},  wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*3  mid-sp  */ {temp:{base:0,die:2,min:-3,max:1},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*4  late-sp */ {temp:{base:0,die:2,min:-3,max:1},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*5  early-su*/ {temp:{base:1,die:2,min:0,max:4},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*6  mid-su  */ {temp:{base:1,die:2,min:0,max:4},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*7  late-su */ {temp:{base:0,die:2,min:-3,max:1},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*8  early-au*/ {temp:{base:-2,die:2,min:-2,max:0},  wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*9  mid-au  */ {temp:{base:-2,die:2,min:-3,max:-1}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*10 late-au */ {temp:{base:-3,die:2,min:-4,max:-2}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*11 early-wn*/ {temp:{base:-3,die:2,min:-4,max:-2}, wind:{base:2,die:2,min:1,max:3}, precip:{base:1,die:2,min:0,max:2}}
  ],

  // Karrnath, Mror Holds interior — wide seasonal swing, harsh winters
  continental: [
    /*0 */ {temp:{base:-2,die:3,min:-2,max:0},  wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*1 */ {temp:{base:0,die:3,min:-2,max:1},    wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*2 */ {temp:{base:1,die:3,min:0,max:6},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*3 */ {temp:{base:4,die:2,min:1,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*4 */ {temp:{base:6,die:2,min:4,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*5 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*6 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*7 */ {temp:{base:6,die:2,min:4,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*8 */ {temp:{base:4,die:3,min:2,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:3,min:0,max:3}},
    /*9 */ {temp:{base:1,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*10*/ {temp:{base:0,die:2,min:-3,max:1},    wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*11*/ {temp:{base:-2,die:3,min:-2,max:0},   wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}}
  ],

  // Breland, Shadow Marches, most of Khorvaire — moderate, maritime-influenced
  temperate: [
    /*0 */ {temp:{base:0,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*1 */ {temp:{base:1,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*2 */ {temp:{base:4,die:2,min:1,max:6},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*3 */ {temp:{base:4,die:2,min:1,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*4 */ {temp:{base:6,die:2,min:4,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*5 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*6 */ {temp:{base:9,die:2,min:6,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*7 */ {temp:{base:6,die:2,min:4,max:10},    wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*8 */ {temp:{base:6,die:2,min:3,max:9},     wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:3,min:0,max:3}},
    /*9 */ {temp:{base:4,die:2,min:1,max:6},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*10*/ {temp:{base:1,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*11*/ {temp:{base:0,die:2,min:0,max:4},     wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}}
  ],

  // Blade Desert, Valenar interior — heat-dominated, wide daily swings, very low precip
  dry: [
    /*0 */ {temp:{base:4,die:3,min:0,max:6},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*1 */ {temp:{base:4,die:3,min:1,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*2 */ {temp:{base:6,die:3,min:4,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:1}},
    /*3 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*4 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*5 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*6 */ {temp:{base:11,die:2,min:10,max:12}, wind:{base:2,die:2,min:0,max:3}, precip:{base:0,die:2,min:0,max:1}},
    /*7 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:2,die:2,min:0,max:3}, precip:{base:0,die:2,min:0,max:1}},
    /*8 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:2,die:2,min:0,max:3}, precip:{base:0,die:2,min:0,max:1}},
    /*9 */ {temp:{base:6,die:3,min:4,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*10*/ {temp:{base:6,die:3,min:1,max:9},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}},
    /*11*/ {temp:{base:4,die:3,min:0,max:6},    wind:{base:2,die:2,min:0,max:3}, precip:{base:1,die:2,min:0,max:2}}
  ],

  // Sharn, Q'barra, Xen'drik coast — narrow temp swing, seasonal rains
  tropical: [
    /*0 */ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*1 */ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*2 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*3 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*4 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:2}},
    /*5 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:1,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*6 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*7 */ {temp:{base:10,die:2,min:9,max:11},  wind:{base:2,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*8 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*9 */ {temp:{base:9,die:2,min:6,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*10*/ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*11*/ {temp:{base:6,die:2,min:4,max:10},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}}
  ],

  // Q'barra interior monsoon, Xen'drik seasonal — dramatic wet/dry season flip
  // Dry season (winter–early spring): clear skies, low precip
  // Wet season (summer–autumn): torrential, daily downpours, high wind
  monsoon: [
    /*0  mid-win */ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*1  late-win*/ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*2  early-sp*/ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*3  mid-sp  */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:3}, precip:{base:2,die:2,min:1,max:3}},
    /*4  late-sp */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:2,die:2,min:1,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*5  early-su*/ {temp:{base:10,die:2,min:9,max:11}, wind:{base:2,die:2,min:1,max:4}, precip:{base:3,die:3,min:2,max:5}},
    /*6  mid-su  */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:2,die:2,min:1,max:4}, precip:{base:3,die:3,min:2,max:5}},
    /*7  late-su */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:2,die:2,min:1,max:4}, precip:{base:3,die:3,min:2,max:5}},
    /*8  early-au*/ {temp:{base:9,die:2,min:6,max:10},  wind:{base:2,die:2,min:1,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*9  mid-au  */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*10 late-au */ {temp:{base:6,die:2,min:4,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*11 early-wn*/ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}}
  ],

  // Valenar coast, southern Breland — hot dry summers, mild wet winters
  // Inverted precip curve: winters wetter than summers
  mediterranean: [
    /*0  mid-win */ {temp:{base:1,die:2,min:0,max:4},   wind:{base:2,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*1  late-win*/ {temp:{base:1,die:2,min:0,max:4},   wind:{base:1,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*2  early-sp*/ {temp:{base:4,die:2,min:1,max:6},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*3  mid-sp  */ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*4  late-sp */ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:1}},
    /*5  early-su*/ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*6  mid-su  */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*7  late-su */ {temp:{base:10,die:2,min:9,max:11}, wind:{base:1,die:2,min:0,max:2}, precip:{base:0,die:2,min:0,max:1}},
    /*8  early-au*/ {temp:{base:9,die:2,min:6,max:10},  wind:{base:1,die:2,min:0,max:2}, precip:{base:1,die:2,min:0,max:2}},
    /*9  mid-au  */ {temp:{base:6,die:2,min:4,max:9},   wind:{base:1,die:2,min:0,max:2}, precip:{base:2,die:2,min:1,max:3}},
    /*10 late-au */ {temp:{base:4,die:2,min:1,max:6},   wind:{base:2,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}},
    /*11 early-wn*/ {temp:{base:1,die:2,min:0,max:4},   wind:{base:2,die:2,min:0,max:3}, precip:{base:3,die:2,min:2,max:4}}
  ]
};

// ---------------------------------------------------------------------------
// Geography modifier tables — 10 geographies × 12 months (or constant object)
// Each entry: { temp, wind, precip, arc }
//   temp/wind/precip: additive shift to base, min, and max uniformly
//   arc: multiplicative scale on the TOD arc for this month (combined with terrain arc)
// A constant object (non-array) applies uniformly to all months.
// ---------------------------------------------------------------------------
export var WEATHER_GEO_MOD: any = {

  // Baseline — no modification
  inland: {temp:0, wind:0, precip:0, arc:1.00},

  // Breland coast, Lhazaar coastline — maritime moderation
  coastal: [
    /*0 */ {temp:+1, wind:+1, precip:+1, arc:0.70},
    /*1 */ {temp:+1, wind:+1, precip:+1, arc:0.70},
    /*2 */ {temp: 0, wind: 0, precip:+1, arc:0.75},
    /*3 */ {temp: 0, wind: 0, precip:+1, arc:0.75},
    /*4 */ {temp: 0, wind: 0, precip:+1, arc:0.75},
    /*5 */ {temp:-1, wind: 0, precip: 0, arc:0.70},
    /*6 */ {temp:-1, wind: 0, precip: 0, arc:0.70},
    /*7 */ {temp:-1, wind: 0, precip: 0, arc:0.70},
    /*8 */ {temp: 0, wind:+1, precip:+1, arc:0.75},
    /*9 */ {temp: 0, wind:+1, precip:+1, arc:0.75},
    /*10*/ {temp:+1, wind:+1, precip:+1, arc:0.72},
    /*11*/ {temp:+1, wind:+1, precip:+1, arc:0.70}
  ],

  // Thunder Sea crossings, Lhazaar open water — strong moderation, sustained wind
  open_sea: [
    /*0 */ {temp:+2, wind:+2, precip:+1, arc:0.35},
    /*1 */ {temp:+2, wind:+2, precip:+1, arc:0.35},
    /*2 */ {temp:+1, wind:+2, precip:+1, arc:0.35},
    /*3 */ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*4 */ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*5 */ {temp:-2, wind:+2, precip:+1, arc:0.35},
    /*6 */ {temp:-2, wind:+2, precip:+1, arc:0.35},
    /*7 */ {temp:-2, wind:+2, precip:+1, arc:0.35},
    /*8 */ {temp:-1, wind:+2, precip:+1, arc:0.35},
    /*9 */ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*10*/ {temp: 0, wind:+2, precip:+1, arc:0.35},
    /*11*/ {temp:+2, wind:+2, precip:+1, arc:0.35}
  ],

  // Talenta Plains, Valenar, Mournland — amplified arc, fast-moving systems
  open_plains: [
    /*0 */ {temp:-1, wind:+1, precip:-1, arc:1.50},
    /*1 */ {temp:-1, wind:+1, precip:-1, arc:1.50},
    /*2 */ {temp: 0, wind:+1, precip: 0, arc:1.40},
    /*3 */ {temp: 0, wind:+1, precip: 0, arc:1.40},
    /*4 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*5 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*6 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*7 */ {temp:+1, wind:+1, precip: 0, arc:1.40},
    /*8 */ {temp: 0, wind:+1, precip:+1, arc:1.40},
    /*9 */ {temp: 0, wind:+1, precip:-1, arc:1.45},
    /*10*/ {temp: 0, wind:+1, precip:-1, arc:1.45},
    /*11*/ {temp:-1, wind:+1, precip:-1, arc:1.50}
  ],

  // Mror Holds peaks, Starpeaks — elevation cold, orographic precip
  highland: [
    /*0 */ {temp:-2, wind:+2, precip:+1, arc:1.30},
    /*1 */ {temp:-2, wind:+2, precip:+1, arc:1.30},
    /*2 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*3 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*4 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*5 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*6 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*7 */ {temp:-2, wind:+1, precip:+1, arc:1.20},
    /*8 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*9 */ {temp:-2, wind:+1, precip:+1, arc:1.25},
    /*10*/ {temp:-2, wind:+2, precip:+1, arc:1.30},
    /*11*/ {temp:-2, wind:+2, precip:+1, arc:1.30}
  ],

  // Aundair river valleys, Scions Sound region — fog-prone, channeled wind
  river_valley: [
    /*0 */ {temp: 0, wind:-1, precip:+1, arc:0.90},
    /*1 */ {temp: 0, wind:-1, precip:+1, arc:0.90},
    /*2 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*3 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*4 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*5 */ {temp:+1, wind:-1, precip:+1, arc:0.80},
    /*6 */ {temp:+1, wind:-1, precip:+1, arc:0.80},
    /*7 */ {temp:+1, wind:-1, precip:+1, arc:0.80},
    /*8 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*9 */ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*10*/ {temp: 0, wind:-1, precip:+1, arc:0.85},
    /*11*/ {temp: 0, wind:-1, precip:+1, arc:0.90}
  ],

  // Q'barra interior, Xen'drik jungle lowlands — flat arc, suppressed wind, max moisture
  jungle_basin: {temp:0, wind:-1, precip:+1, arc:0.25},

  // Lake Galifar, large enclosed Scions Sound — lake-effect autumn/winter precip
  inland_sea: [
    /*0 */ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*1 */ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*2 */ {temp:+1, wind: 0, precip:+1, arc:0.80},
    /*3 */ {temp: 0, wind: 0, precip:+1, arc:0.85},
    /*4 */ {temp: 0, wind: 0, precip:+1, arc:0.85},
    /*5 */ {temp:-1, wind: 0, precip: 0, arc:0.80},
    /*6 */ {temp:-1, wind: 0, precip: 0, arc:0.80},
    /*7 */ {temp:-1, wind: 0, precip: 0, arc:0.80},
    /*8 */ {temp:+1, wind:+1, precip:+2, arc:0.80},
    /*9 */ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*10*/ {temp:+1, wind:+1, precip:+2, arc:0.75},
    /*11*/ {temp:+1, wind:+1, precip:+2, arc:0.75}
  ],

  // Lhazaar islands, offshore Stormreach — all-direction maritime
  island: [
    /*0 */ {temp:+2, wind:+1, precip:+1, arc:0.45},
    /*1 */ {temp:+2, wind:+1, precip:+1, arc:0.45},
    /*2 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*3 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*4 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*5 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*6 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*7 */ {temp:-1, wind:+1, precip:+1, arc:0.45},
    /*8 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*9 */ {temp:+1, wind:+1, precip:+1, arc:0.50},
    /*10*/ {temp:+2, wind:+1, precip:+1, arc:0.45},
    /*11*/ {temp:+2, wind:+1, precip:+1, arc:0.45}
  ],

  // Frostfell open tundra, Demon Wastes — open plains amplified by polar cold
  arctic_plain: [
    /*0 */ {temp:-3, wind:+2, precip:-1, arc:1.70},
    /*1 */ {temp:-3, wind:+2, precip:-1, arc:1.70},
    /*2 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*3 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*4 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*5 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*6 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*7 */ {temp:-1, wind:+2, precip:-1, arc:1.50},
    /*8 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*9 */ {temp:-2, wind:+2, precip:-1, arc:1.60},
    /*10*/ {temp:-3, wind:+2, precip:-1, arc:1.70},
    /*11*/ {temp:-3, wind:+2, precip:-1, arc:1.70}
  ]
};

// ---------------------------------------------------------------------------
// Terrain modifier tables — 9 terrains × 12 months (or constant object)
// Same structure as WEATHER_GEO_MOD. Arc multipliers are seasonal where
// the canopy changes through the year (forest, swamp); constant elsewhere.
// ---------------------------------------------------------------------------
export var WEATHER_TERRAIN_MOD: any = {

  // Full exposure to geography — no modification
  open: {temp:0, wind:0, precip:0, arc:1.00},

  // Deciduous forest: full canopy in summer, bare in winter
  forest: [
    /*0  mid-win */ {temp:0, wind: 0, precip: 0, arc:0.85},
    /*1  late-win*/ {temp:0, wind: 0, precip: 0, arc:0.85},
    /*2  early-sp*/ {temp:0, wind:-1, precip:+1, arc:0.60},
    /*3  mid-sp  */ {temp:0, wind:-1, precip:+1, arc:0.45},
    /*4  late-sp */ {temp:0, wind:-1, precip:+1, arc:0.30},
    /*5  early-su*/ {temp:0, wind:-1, precip:+1, arc:0.25},
    /*6  mid-su  */ {temp:0, wind:-1, precip:+1, arc:0.25},
    /*7  late-su */ {temp:0, wind:-1, precip:+1, arc:0.25},
    /*8  early-au*/ {temp:0, wind:-1, precip:+1, arc:0.30},
    /*9  mid-au  */ {temp:0, wind: 0, precip: 0, arc:0.55},
    /*10 late-au */ {temp:0, wind: 0, precip: 0, arc:0.75},
    /*11 early-wn*/ {temp:0, wind: 0, precip: 0, arc:0.85}
  ],

  // Tropical/evergreen forest: constant heavy canopy all year
  jungle: {temp:0, wind:-1, precip:+1, arc:0.20},

  // Wetland: like forest but wetter and wind-dead at surface
  swamp: [
    /*0 */ {temp:0, wind:-1, precip:+1, arc:0.70},
    /*1 */ {temp:0, wind:-1, precip:+1, arc:0.70},
    /*2 */ {temp:0, wind:-1, precip:+2, arc:0.50},
    /*3 */ {temp:0, wind:-1, precip:+2, arc:0.45},
    /*4 */ {temp:0, wind:-1, precip:+2, arc:0.45},
    /*5 */ {temp:+1,wind:-1, precip:+2, arc:0.35},
    /*6 */ {temp:+1,wind:-1, precip:+2, arc:0.35},
    /*7 */ {temp:+1,wind:-1, precip:+2, arc:0.35},
    /*8 */ {temp:0, wind:-1, precip:+2, arc:0.50},
    /*9 */ {temp:0, wind:-1, precip:+1, arc:0.65},
    /*10*/ {temp:0, wind:-1, precip:+1, arc:0.65},
    /*11*/ {temp:0, wind:-1, precip:+1, arc:0.70}
  ],

  // Settled area: heat island, streets channel wind slightly
  urban: {temp:+1, wind:0, precip:0, arc:0.80},

  // Above treeline: always exposed, cold, no canopy moderation
  alpine: {temp:-2, wind:+1, precip:+1, arc:1.50},

  // Cultivated fields: partial hedge/windbreak, otherwise open
  farmland: {temp:0, wind:-1, precip:0, arc:0.90},

  // Sand/rock desert: amplifies arc, reinforces dryness
  desert: [
    /*0 */ {temp: 0, wind:0, precip:-1, arc:1.80},
    /*1 */ {temp: 0, wind:0, precip:-1, arc:1.80},
    /*2 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*3 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*4 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*5 */ {temp:+2, wind:0, precip:-1, arc:2.00},
    /*6 */ {temp:+2, wind:0, precip:-1, arc:2.00},
    /*7 */ {temp:+2, wind:0, precip:-1, arc:2.00},
    /*8 */ {temp:+1, wind:0, precip:-1, arc:1.90},
    /*9 */ {temp:+1, wind:0, precip:-1, arc:1.85},
    /*10*/ {temp:+1, wind:0, precip:-1, arc:1.85},
    /*11*/ {temp: 0, wind:0, precip:-1, arc:1.80}
  ],

  // Exposed cliff above water: coastal moisture + wind amplification
  coastal_bluff: {temp:-1, wind:+2, precip:+1, arc:1.20}
};

// ---------------------------------------------------------------------------
// Wizard description strings — used in location wizard UI only
// ---------------------------------------------------------------------------
export var WEATHER_CLIMATES: any = {
  polar:       'Perpetual cold, minimal precipitation, wide seasonal swing',
  continental: 'Harsh winters, hot summers, far from maritime influence',
  temperate:   'Moderate seasons, consistent precipitation, mild maritime character',
  dry:         'Heat-dominated, very low precipitation, extreme daily temperature swings',
  tropical:    'Narrow temperature range, seasonal heavy rain, consistently warm',
  monsoon:     'Dramatic wet/dry season flip: dry clear winters, torrential summer downpours',
  mediterranean:'Hot dry summers, mild wet winters: inverted precipitation curve'
};

export var WEATHER_GEOGRAPHIES: any = {
  inland:      'Default continental interior — no geographic amplification',
  coastal:     'Shoreline: maritime moderation, sea breeze, dampened daily arc',
  open_sea:    'Open water: strongly moderated temps, sustained wind, flat arc',
  open_plains: 'Unobstructed flat terrain: amplified arc, fast-moving systems, strong wind',
  highland:    'Elevated terrain: colder, orographic precipitation, exposed ridges',
  river_valley:'Valley floor: fog-prone, wind channeled and reduced, elevated moisture',
  jungle_basin:'Dense jungle lowland: flat arc, suppressed wind, maximum humidity',
  inland_sea:  'Large enclosed water body: lake-effect precip spikes in autumn/winter',
  island:      'Surrounded by water: all-direction maritime moderation, steady moisture',
  arctic_plain:'Open polar tundra: extreme cold and wind amplified, minimal precipitation'
};

export var WEATHER_TERRAINS_UI: any = {
  open:         'No shelter — geography unfiltered',
  forest:       'Deciduous: full canopy summer, bare winter — strongly seasonal buffering',
  jungle:       'Tropical evergreen: constant heavy canopy, wind-dead, maximum humidity',
  swamp:        'Wetland: still air, saturated ground, precip accumulates',
  urban:        'Settled area: heat island, slight wind channeling',
  alpine:       'Above treeline: always cold and exposed, no canopy',
  farmland:     'Cultivated fields: partial windbreak, mostly open',
  desert:       'Sand or rock desert: maximizes arc and heat, suppresses precipitation',
  coastal_bluff:'Exposed cliff near water: coastal moisture with amplified wind'
};

export var MANIFEST_ZONE_ORDER = [
  'fernia','risia','irian','mabar','lamannia','syrania','kythri',
  'shavarath','daanvi','dolurrh','thelanis','xoriat','dalquor'
];

export var MANIFEST_ZONE_DEFS: any = {
  fernia: {
    key: 'fernia', name: 'Fernia', emoji: '🔥',
    summary: 'Warmth', effectLabel: '+3 temp', tempMod: 3
  },
  risia: {
    key: 'risia', name: 'Risia', emoji: '❄️',
    summary: 'Cold', effectLabel: '-3 temp', tempMod: -3
  },
  irian: {
    key: 'irian', name: 'Irian', emoji: '✨',
    summary: 'Radiant warmth', effectLabel: '+1 temp', tempMod: 1
  },
  mabar: {
    key: 'mabar', name: 'Mabar', emoji: '🌑',
    summary: 'Shadow cold', effectLabel: '-1 temp', tempMod: -1
  },
  lamannia: {
    key: 'lamannia', name: 'Lamannia', emoji: '🌿',
    summary: 'Lush weather', effectLabel: '+1 precip', precipMod: 1
  },
  syrania: {
    key: 'syrania', name: 'Syrania', emoji: '🌤',
    summary: 'Milder skies', effectLabel: '-1 precip, -1 wind', precipMod: -1, windMod: -1
  },
  kythri: {
    key: 'kythri', name: 'Kythri', emoji: '🌀',
    summary: 'Chaotic swings', effectLabel: 'chaotic swings', chaotic: true
  },
  shavarath: {
    key: 'shavarath', name: 'Shavarath', emoji: '⚔️',
    summary: 'Martial resonance', effectLabel: 'no weather shift'
  },
  daanvi: {
    key: 'daanvi', name: 'Daanvi', emoji: '📏',
    summary: 'Orderly', effectLabel: 'no weather shift'
  },
  dolurrh: {
    key: 'dolurrh', name: 'Dolurrh', emoji: '🪦',
    summary: 'Deathly', effectLabel: 'no weather shift'
  },
  thelanis: {
    key: 'thelanis', name: 'Thelanis', emoji: '🧚',
    summary: 'Fey', effectLabel: 'no weather shift'
  },
  xoriat: {
    key: 'xoriat', name: 'Xoriat', emoji: '👁️',
    summary: 'Madness', effectLabel: 'no weather shift'
  },
  dalquor: {
    key: 'dalquor', name: 'Dal Quor', emoji: '💤',
    summary: 'Dreams', effectLabel: 'no weather shift'
  }
};

export var _FOG_BASE: any = {
  middle_of_night: 0.18,
  early_morning: 0.30,
  morning:       0.40,
  afternoon:     0.05,
  evening:       0.20,
  nighttime:     0.10
};

export var _FOG_GEO_MULT: any = {
  river_valley: 2.0,
  coastal:      1.5,
  inland_sea:   1.5,
  open_plains:  0.3,
  arctic_plain: 0.3,
  jungle_basin: 1.2
};

export var _FOG_TERRAIN_MULT: any = {
  swamp:   2.5,
  forest:  1.5,
  desert:  0.1,
  alpine:  0.4
};

// Month index → season weight. Fog favours shoulder seasons.
export var _FOG_SEASON_WEIGHT = [
  0.5,  // 0  mid-win
  0.5,  // 1  late-win
  1.2,  // 2  early-sp
  1.2,  // 3  mid-sp
  1.2,  // 4  late-sp
  0.7,  // 5  early-su
  0.7,  // 6  mid-su
  0.7,  // 7  late-su
  1.2,  // 8  early-au
  1.2,  // 9  mid-au
  1.2,  // 10 late-au
  0.6   // 11 early-wn
];

// Events are evaluated once at generation time. The result (an array of
// event objects) is stored on the record. The Today panel shows them as
// flagged warnings with two GM buttons: Trigger (send to players) and
// Roll the Dice (probabilistic roll that either fires or doesn't).
//
// No event ever fires automatically. GM must press a button.
// ---------------------------------------------------------------------------

export var EXTREME_EVENTS: any = {

  flash_flood: {
    name:     'Flash Flood',
    emoji:    '🌊',
    // Trigger: heavy rain in lowland/coastal geography
    check: function(f: any, loc: any, sa: any, wa: any){
      var lowGeos: any = { river_valley:1, coastal:1, jungle_basin:1, inland_sea:1 };
      if (f.temp < 5 || f.precip < 3 || !lowGeos[loc.geography]) return 0;
      var p = 0.12;
      if (wa)                      p += 0.15;  // prior day already wet
      if (loc.terrain === 'urban') p += 0.08;  // pavement runoff
      return Math.min(0.35, p);
    },
    duration:  '1–4 hours',
    mechanics: 'River crossings impassable. Low ground becomes difficult terrain. Swim DC 15 or be swept downstream (1d6 bludgeoning per round). Creatures in water: Str save DC 13 or knocked prone.',
    aftermath: 'Roads washed out. Fords flooded for 1d4 days. Water sources silted.',
    playerMsg: function(loc: any){ return 'A flash flood sweeps through the lowlands. The river bursts its banks — all crossings are closed.'; }
  },

  whiteout: {
    name:     'Whiteout',
    emoji:    '❄️',
    // Trigger: active blizzard on open flat terrain
    check: function(f: any, loc: any, sa: any, wa: any){
      var openGeos: any = { open_plains:1, arctic_plain:1 };
      if (f.temp > 3 || f.precip < 3 || f.wind < 3 || !openGeos[loc.geography]) return 0;
      return 0.55;
    },
    duration:  '2–8 hours',
    mechanics: 'Visibility 0 ft (total whiteout). All creatures Blinded. Navigation impossible without magic — DC 20 Survival or travel in circles. Exposed creatures: DC 15 Con save each hour or gain Exhaustion.',
    aftermath: 'Drifts 2–5 ft deep on open ground. All outdoor surfaces difficult terrain for 1d3 days.',
    playerMsg: function(loc: any){ return 'A whiteout descends. The world disappears into white — sky and ground indistinguishable. Travel is impossible.'; }
  },

  ground_blizzard: {
    name:     'Ground Blizzard',
    emoji:    '💨',
    // Trigger: accumulated snow + storm wind on open terrain — no active precip needed
    check: function(f: any, loc: any, sa: any, wa: any){
      var openGeos: any = { open_plains:1, arctic_plain:1 };
      if (!sa || f.wind < 3 || !openGeos[loc.geography]) return 0;
      // Can occur even if today's precip is low — the snow is already on the ground
      if (f.precip > 1) return 0;  // if actively precipitating, whiteout covers it
      return 0.35;
    },
    duration:  '1–6 hours',
    mechanics: 'Heavily Obscured beyond 30ft. Navigation DC 15 Survival. Exposed creatures: DC 12 Con save each hour or gain Exhaustion level. Flying impossible in open terrain.',
    aftermath: 'Drifting fills roads and sheltered passages. Travel speed halved outdoors for the day.',
    playerMsg: function(loc: any){ return 'A ground blizzard erupts — the wind picks up the snow already on the ground and flings it horizontally. Visibility collapses.'; }
  },

  haboob: {
    name:     'Dust Storm (Haboob)',
    emoji:    '🌪️',
    // Trigger: hot dry conditions with wind — desert/plains in dry climate
    check: function(f: any, loc: any, sa: any, wa: any){
      var dryTerrains: any = { desert:1, open:1 };
      var openGeos: any    = { open_plains:1, arctic_plain:1 };
      var dryClimates: any = { dry:1 };
      // Needs dry conditions: no precipitation, hot, windy
      if (f.precip > 0 || f.temp < 9 || f.wind < 2) return 0;
      if (!dryTerrains[loc.terrain] && !openGeos[loc.geography]) return 0;
      var p = 0.10;
      if (f.wind >= 3) p += 0.05;
      if (f.temp >= 10) p += 0.05;
      return Math.min(0.20, p);
    },
    duration:  '10 minutes – 3 hours',
    mechanics: 'Heavily Obscured beyond 30ft for duration. Creatures without eye/mouth protection: DC 12 Con save or become Poisoned (choking dust) until they take a short rest in shelter. Flying creatures: DC 15 Str save or be grounded.',
    aftermath: 'Fine dust coats everything. Food/water may be contaminated. Visibility remains reduced (Lightly Obscured) for 1d4 hours after.',
    playerMsg: function(loc: any){ return 'A wall of dust appears on the horizon and swallows the sky. Shelter — now.'; }
  },

  avalanche: {
    name:     'Avalanche',
    emoji:    '⛰️',
    // Trigger: highland geography, cold, heavy snow + wind — or post-storm loading
    check: function(f: any, loc: any, sa: any, wa: any){
      if (loc.geography !== 'highland') return 0;
      if (f.temp > 4) return 0;
      var p = 0;
      if (f.precip >= 2 && f.wind >= 2) p = 0.15;
      if (sa && f.precip >= 2)          p = Math.max(p, 0.15);
      if (sa && f.precip >= 3 && f.wind >= 3) p = Math.min(0.38, p + 0.15);
      else if (f.wind >= 3)             p = Math.min(0.38, p + 0.08);
      return p;
    },
    duration:  'Instantaneous event; aftermath hours to days',
    mechanics: 'Any creature in the avalanche path: DC 15 Dex save or take 6d6 bludgeoning and become Restrained (buried). Restrained creatures: DC 15 Athletics each round to dig free, or suffocate after Con modifier + proficiency bonus rounds.',
    aftermath: 'Pass or valley blocked. Rescue operations may be needed. Travel through area impossible without magical aid or 1d4 days of clearing.',
    playerMsg: function(loc: any){ return 'A thunderous crack echoes from above. Avalanche!'; }
  },

  lightning_storm: {
    name:     'Severe Thunderstorm',
    emoji:    '⚡',
    // Trigger: severe rain + warm temp + wind
    check: function(f: any, loc: any, sa: any, wa: any){
      if (f.temp < 7 || f.precip < 3 || f.wind < 2) return 0;
      var p = 0.25;
      if (f.temp >= 9) p += 0.10;
      return Math.min(0.35, p);
    },
    duration:  '1–3 hours',
    mechanics: 'Lightning strikes: each minute outdoors, DC 13 Dex save or be struck (4d10 lightning damage, DC 14 Con save or Stunned 1 round). Metal armour wearers: disadvantage on save. Tall isolated objects are struck first.',
    aftermath: 'Fires possible in dry terrain. Fallen trees may block roads. Flash flooding risk elevated (see Flash Flood).',
    playerMsg: function(loc: any){ return 'The storm reaches a violent peak. Lightning splits the sky — this is not a safe time to be in the open.'; }
  },

  clear_sky_strike: {
    name:     'Clear-Sky Lightning',
    emoji:    '🌩️',
    // Trigger: uncommon atmospheric discharge with little/no precipitation.
    // Enhanced during Zarantyr full moon via _evaluateExtremeEvents.
    check: function(f: any, loc: any, sa: any, wa: any){
      if (f.precip > 1 || f.wind > 2) return 0;
      var p = 0.02;
      if (f.temp >= 7) p += 0.02;
      if (f.temp >= 9) p += 0.01;
      return Math.min(0.06, p);
    },
    duration:  'Instantaneous strike or short burst (minutes)',
    mechanics: 'An unexpected bolt strikes with little warning. Creatures in exposed outdoor terrain make DC 13 Dex save or take 3d10 lightning damage (half on success). Tall isolated objects are preferential targets.',
    aftermath: 'Potential localized fire or structural scorch at strike site.',
    playerMsg: function(loc: any){ return 'A jagged bolt tears from a clear sky. Thunder follows seconds later.'; }
  },

  flash_freeze: {
    name:     'Flash Freeze',
    emoji:    '🧊',
    // Trigger: today is suddenly very cold after a warm wet yesterday
    check: function(f: any, loc: any, sa: any, wa: any){
      // wa = prev day was warm (≥5) and wet (≥1)
      if (!wa || f.temp > 3 || f.wind < 2) return 0;
      return 0.25;
    },
    duration:  '1–4 hours for freeze; persists until thaw',
    mechanics: 'All exposed water surfaces (puddles, ford crossings, wet mud) become ice. Difficult terrain on all outdoor surfaces. DC 12 Acrobatics to avoid falling prone when moving at full speed on ice.',
    aftermath: 'Icy surfaces persist until temperature rises above band 4 (45F+). Fords may be crossable on foot — or may give way.',
    playerMsg: function(loc: any){ return 'The temperature plummets. Water crystallizes where it stands. The world glazes over in an hour.'; }
  },

  tropical_storm: {
    name:     'Tropical Storm',
    emoji:    '🌀',
    // Trigger: warm/hot + coastal or open sea + high wind + rain
    check: function(f: any, loc: any, sa: any, wa: any){
      var seaGeos: any = { coastal:1, open_sea:1, inland_sea:1 };
      if (f.temp < 7 || f.wind < 3 || f.precip < 3 || !seaGeos[loc.geography]) return 0;
      var p = 0.20;
      if (f.wind >= 4) p += 0.15;
      if (f.temp >= 9) p += 0.10;
      return Math.min(0.45, p);
    },
    duration:  '6–24 hours',
    mechanics: 'Wind: sustained gale-force. Ranged weapon attacks and flying have disadvantage. Small sailing vessels: DC 15 water vehicles check each hour or capsize. Structures: DC 12 to resist minor damage to roofs and shutters. Outdoor fires extinguished.',
    aftermath: 'Coastal flooding for 1d3 days. Minor structural damage. Debris-strewn roads.',
    playerMsg: function(loc: any){ return 'A tropical storm bears down on the coast. Winds howl, rain drives sideways, and the sea surges against the shore.'; }
  },

  hurricane: {
    name:     'Hurricane',
    emoji:    '🌊',
    // Trigger: extremely warm + open sea or coastal + extreme wind + deluge
    // Rarer and more dangerous than tropical storm
    check: function(f: any, loc: any, sa: any, wa: any){
      var seaGeos: any = { coastal:1, open_sea:1 };
      if (f.temp < 9 || f.wind < 4 || f.precip < 4 || !seaGeos[loc.geography]) return 0;
      var p = 0.30;
      if (f.wind >= 5) p += 0.20;
      if (f.precip >= 5) p += 0.10;
      return Math.min(0.60, p);
    },
    duration:  '12–48 hours',
    mechanics: 'Wind: hurricane force. All ranged attacks impossible. Flying impossible without magic (DC 18 Str save each round). Creatures outdoors: DC 13 Str save each round or be knocked prone and pushed 10 ft. All non-stone structures: DC 15 to resist significant damage. Ships at sea: DC 18 water vehicles each hour or capsize with 4d6 bludgeoning to all aboard. Storm surge floods coastal areas to 1d4 × 5 feet.',
    aftermath: 'Catastrophic coastal flooding for 1d6 days. Major structural damage. Trees uprooted. Roads impassable for 1d4 days. Water sources contaminated.',
    playerMsg: function(loc: any){ return 'The sky turns an unearthly green. The hurricane hits with a wall of wind and water that shakes the foundations of the world.'; }
  }
};

export var _TIER_RANK: any = { high:3, medium:2, low:1 };

// Source labels for player-facing weather attribution.
export var WEATHER_SOURCE_LABELS: any = {
  common:   'Common Knowledge',
  low:      'Common Knowledge',
  medium:   'Skilled Forecast',
  high:     'Expert Forecast',
  specific: 'Divination Reveal'
};

// ---------------------------------------------------------------------------
// Forecast Lens: Quality ranks, zone system, mask dice, jitter levels
// ---------------------------------------------------------------------------

// Quality rank ladder (lower = better). Used for upgrade-only reveal writes.
export var QUALITY_HIGH       = 1;
export var QUALITY_MEDIUM_A   = 2;
export var QUALITY_MEDIUM_B   = 3;
export var QUALITY_MEDIUM_C   = 4;
export var QUALITY_MEDIUM_D   = 5;
export var QUALITY_LOW_A      = 6;   // same rank as QUALITY_TAIL_AP
export var QUALITY_TAIL_AP    = 6;
export var QUALITY_LOW_B      = 7;   // same rank as QUALITY_TAIL_BP
export var QUALITY_TAIL_BP    = 7;
export var QUALITY_NONE       = 99;

// Zone determination: distance from today using Fibonacci-like boundaries.
// Today = day 1.  A=1, B=2-3, C=4-6, D=7-10.
export function _currentZone(serial: number, today: number): string | null {
  var dayNum = serial - today + 1;
  if (dayNum === 1) return 'A';
  if (dayNum <= 3) return 'B';
  if (dayNum <= 6) return 'C';
  if (dayNum <= 10) return 'D';
  return null;
}

// Mask dice: roll this die per day; mask fires on a 1.
// Bigger die = less likely to fire = more reliable forecast.
export var FORECAST_MASK_DICE: any = {
  medium: { A: 20, B: 12, C: 10, D: 8 },
  low:    { A: 6,  B: 4 },
  tail:   { Ap: 6, Bp: 4 }
};

// Jitter level: number of traits affected (0=exact, 1=wind, 2=wind+precip, 3=all).
export var FORECAST_JITTER_LEVEL: any = {
  medium: { A: 0, B: 1, C: 2, D: 3 },
  low:    { A: 1, B: 3 },
  tail:   { Ap: 1, Bp: 3 }
};

// Map zone + tier to quality rank.
export var ZONE_QUALITY: any = {
  high:   { A: QUALITY_HIGH, B: QUALITY_HIGH, C: QUALITY_HIGH, D: QUALITY_HIGH },
  medium: { A: QUALITY_MEDIUM_A, B: QUALITY_MEDIUM_B, C: QUALITY_MEDIUM_C, D: QUALITY_MEDIUM_D },
  low:    { A: QUALITY_LOW_A, B: QUALITY_LOW_B }
};
