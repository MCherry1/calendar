/* ============================================================================
 * ★ USER CONFIGURATION ★
 * Edit the values in this section to set up your campaign calendar.
 * ==========================================================================*/

/* --- Era label ------------------------------------------------------------*/
// Appended after the year number everywhere it appears, e.g. "998 YK".
// Change to match your campaign's dating system.
export var CONFIG_ERA_LABEL = 'YK';

/* --- Starting Date --------------------------------------------------------*/
// month: 0-based (0 = first month). day_of_the_week: 0-based (0 = first weekday).
export var CONFIG_START_DATE = {
  month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998
};

/* --- Calendar Structure ---------------------------------------------------*/
// One number per month = days in that month. All 28 for standard Eberron.
// Gregorian example: [31,28,31,30,31,30,31,31,30,31,30,31]
// Month lengths drive everything: serial math, grid layout, event clamping.
// Note: DEFAULT_EVENTS uses specific day numbers — check events on days 29-31
// if switching to a calendar with shorter months.
export var CONFIG_MONTH_LENGTHS = [
  28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28
];

/* --- Default settings -----------------------------------------------------*/
// Applied on first install and after a full reset (!cal resetcalendar).
// These are the starting-point choices for name sets, seasons, and color theme.
// All are changeable live via !cal calendar / !cal seasons / !cal theme.
// Available values are defined in Section 1 in CALENDAR_SYSTEMS, SEASON_SETS,
// and COLOR_THEMES. Use Ctrl+F / Cmd+F to find those blocks.
export var CONFIG_DEFAULTS: Record<string, any> = {
  calendarSystem:  'eberron',   // key in CALENDAR_SYSTEMS
  calendarVariant: 'standard',  // key in CALENDAR_SYSTEMS[x].variants
  seasonVariant:   'eberron',   // key in SEASON_SETS; can be overridden per campaign
  hemisphere:      'north',     // 'north' or 'south'; only affects faerun and gregorian sets
  colorTheme:      null,        // null = use variant default; set to override
  eventsEnabled:   true,        // false = event subsystem hidden/disabled from default views
  moonsEnabled:    true,        // false = moon system fully disabled
  weatherEnabled:  true,        // false = weather system fully disabled
  weatherMechanicsEnabled: true, // false = keep narrative weather, suppress D&D mechanics text
  planesEnabled:   true,        // false = planar system disabled
  offCyclePlanes:  true,        // false = disable off-cycle generated planar movement
  moonDisplayMode: 'calendar',  // 'calendar' | 'list' | 'both'
  weatherDisplayMode:'calendar', // 'calendar' | 'list' | 'both'
  planesDisplayMode:'calendar',  // 'calendar' | 'list' | 'both'
  subsystemVerbosity:'normal',  // 'normal' | 'minimal'
  weatherForecastViewDays: 10,  // GM weather forecast display span (1-20)
  uiDensity:       'normal',    // 'compact' or 'normal'
  autoButtons:     false        // false = suppress auto action buttons on !cal
};

/* --- Calendar systems --------------------------------------------------------*/
// Each system is a complete, self-contained calendar definition.
// Variants within a system share structure, weekdays, and month lengths,
// but differ in month names and default color theme.
// To add a custom system or variant, add an entry here — that's the only place.
export var CALENDAR_SYSTEMS: Record<string, any> = {
  eberron: {
    label:          'Eberron',
    worldLabel:     'Eberron',
    continentLabel: 'Khorvaire',
    description:    'Campaign setting with 12 months of 28 days and a 7-day week.',
    weekdays:       ['Sul','Mol','Zol','Wir','Zor','Far','Sar'],
    monthDays:      [28,28,28,28,28,28,28,28,28,28,28,28],
    structure:      null,
    defaultSeason:  'eberron',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Galifar Calendar',
        description:'The default civil calendar of Khorvaire, on Eberron.',
        monthNames: ['Zarantyr','Olarune','Therendor','Eyre','Dravago','Nymm',
                     'Lharvion','Barrakas','Rhaan','Sypheros','Aryth','Vult'],
        colorTheme: 'lunar'
      },
      druidic: {
        label:      'Druidic Calendar',
        description:'A druidic month-name tradition used across Eberron.',
        monthNames: ['Frostmantle','Thornrise','Treeborn','Rainsong','Arrowfar','Sunstride',
                     'Glitterstream','Havenwild','Stormborn','Harrowfall','Silvermoon','Windwhisper'],
        colorTheme: 'druidic'
      },
      halfling: {
        label:      'Halfling Calendar',
        description:'A halfling month-name tradition used across Eberron.',
        monthNames: ['Fang','Wind','Ash','Hunt','Song','Dust',
                     'Claw','Blood','Horn','Heart','Spirit','Smoke'],
        colorTheme: 'halfling'
      },
      dwarven: {
        label:      'Dwarven Calendar',
        description:'A dwarven month-name tradition used across Eberron.',
        monthNames: ['Aruk','Lurn','Ulbar','Kharn','Ziir','Dwarhuun',
                     'Jond','Sylar','Razagul','Thazm','Drakhadur','Uarth'],
        colorTheme: 'dwarven'
      }
    }
  },
  faerunian: {
    label:          'Forgotten Realms',
    worldLabel:     'Toril',
    continentLabel: 'Faerun',
    description:    'Campaign setting using the Harptos calendar on Faerun.',
    weekdays:       ['Firstday','Secondday','Thirdday','Fourthday','Fifthday','Sixthday','Seventhday','Eighthday','Ninthday','Tenthday'],
    weekdayAbbr:    { Firstday:'1st', Secondday:'2nd', Thirdday:'3rd', Fourthday:'4th',
                      Fifthday:'5th', Sixthday:'6th', Seventhday:'7th', Eighthday:'8th',
                      Ninthday:'9th', Tenthday:'10th' },
    monthDays:      [30,30,30,30,30,30,30,30,30,30,30,30],
    structure:      'harptos',
    defaultSeason:  'faerun',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Harptos Calendar',
        description:'The default calendar of Faerun, on Toril, in the Forgotten Realms.',
        monthNames: ['Hammer','Alturiak','Ches','Tarsakh','Mirtul','Kythorn',
                     'Flamerule','Eleasis','Eleint','Marpenoth','Uktar','Nightal'],
        colorTheme: 'seasons'
      }
    }
  },
  gregorian: {
    label:          'Earth',
    worldLabel:     'Earth',
    description:    'Earth setting using the Gregorian calendar.',
    weekdays:       ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    weekdayAbbr:    { Sunday:'Sun', Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed',
                      Thursday:'Thu', Friday:'Fri', Saturday:'Sat' },
    monthDays:      [31,28,31,30,31,30,31,31,30,31,30,31],
    structure:      'gregorian',
    defaultSeason:  'gregorian',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Gregorian Calendar',
        description:'The standard civil calendar used on Earth.',
        monthNames: ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'],
        colorTheme: 'birthstones'
      }
    }
  },
  greyhawk: {
    label:          'Greyhawk',
    worldLabel:     'Oerth',
    description:    '12 months of 28 days with 4 intercalary festival weeks. 7-day week. Common Year reckoning.',
    weekdays:       ['Starday','Sunday','Moonday','Godsday','Waterday','Earthday','Freeday'],
    weekdayAbbr:    { Starday:'Sta', Sunday:'Sun', Moonday:'Mon', Godsday:'God', Waterday:'Wat', Earthday:'Ear', Freeday:'Fre' },
    monthDays:      [28,28,28,28,28,28,28,28,28,28,28,28],
    structure:      'greyhawk',
    defaultSeason:  'greyhawk',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Dozenmonth of Luna',
        description:'The common Oerthian calendar with 12 months and 4 festival weeks.',
        monthNames: ['Fireseek','Readying','Coldeven','Planting','Flocktime','Wealsun',
                     'Reaping','Goodmonth','Harvester','Patchwall','Ready\'reat','Sunsebb'],
        colorTheme: 'greyhawk'
      }
    }
  },
  dragonlance: {
    label:          'Dragonlance',
    worldLabel:     'Krynn',
    description:    '12 months of 28 days (336-day year). 7-day week. Three moons govern magic.',
    weekdays:       ['Linaras','Palast','Majetag','Kirinor','Misham','Bakukal','Bracha'],
    weekdayAbbr:    { Linaras:'Lin', Palast:'Pal', Majetag:'Maj', Kirinor:'Kir', Misham:'Mis', Bakukal:'Bak', Bracha:'Bra' },
    monthDays:      [28,28,28,28,28,28,28,28,28,28,28,28],
    structure:      null,
    defaultSeason:  'dragonlance',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Krynnish Calendar',
        description:'The Solamnic calendar of Krynn, with seasonal month names.',
        monthNames: ['Winter Come','Winter Deep','Spring Dawning','Spring Rain',
                     'Spring Blossom','Summer Home','Summer Run','Summer End',
                     'Autumn Harvest','Autumn Twilight','Autumn Dark','Winter Night'],
        colorTheme: 'dragonlance'
      }
    }
  },
  exandria: {
    label:          'Exandria',
    worldLabel:     'Exandria',
    description:    '11 months of 29-32 days (328-day year). 7-day week. Exandrian calendar from Critical Role.',
    weekdays:       ['Miresen','Grissen','Whelsen','Conthsen','Folsen','Yulisen','Da\'leysen'],
    weekdayAbbr:    { Miresen:'Mir', Grissen:'Gri', Whelsen:'Whe', Conthsen:'Con', Folsen:'Fol', Yulisen:'Yul', "Da'leysen":'Dal' },
    monthDays:      [29,30,30,31,28,29,32,29,30,30,30],
    structure:      null,
    defaultSeason:  'exandria',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Exandrian Calendar',
        description:'The standard calendar of Exandria from Critical Role.',
        monthNames: ['Horisal','Misuthar','Dualahei','Thunsheer','Unndilar','Brussendar',
                     'Sydenstar','Fessuran','Quen\'pillar','Cuersaar','Duscar'],
        colorTheme: 'exandria'
      }
    }
  },
  mystara: {
    label:          'Mystara',
    worldLabel:     'Mystara',
    description:    '12 months of 28 days (336-day year). 7-day week. Known World / BECMI setting.',
    weekdays:       ['Lunadain','Moldain','Gromdain','Tserdain','Moldain','Soladain','Loshdain'],
    weekdayAbbr:    { Lunadain:'Lun', Moldain:'Mol', Gromdain:'Gro', Tserdain:'Tse', Soladain:'Sol', Loshdain:'Los' },
    monthDays:      [28,28,28,28,28,28,28,28,28,28,28,28],
    structure:      null,
    defaultSeason:  'mystara',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Thyatian Calendar',
        description:'The Thyatian calendar used across the Known World of Mystara.',
        monthNames: ['Nuwmont','Vatermont','Thaumont','Flaurmont','Yarthmont','Klarmont',
                     'Felmont','Fyrmont','Ambyrmont','Sviftmont','Eirmont','Kaldmont'],
        colorTheme: 'mystara'
      }
    }
  },
  birthright: {
    label:          'Birthright',
    worldLabel:     'Aebrynis',
    description:    '12 months of 32 days plus 4 festival days (388-day year). 8-day week. Deismaar reckoning.',
    weekdays:       ['Firlen','Dielen','Trielen','Fiaren','Quinlen','Seislen','Seplen','Achlen'],
    weekdayAbbr:    { Firlen:'Fir', Dielen:'Die', Trielen:'Tri', Fiaren:'Fia', Quinlen:'Qui', Seislen:'Sei', Seplen:'Sep', Achlen:'Ach' },
    monthDays:      [32,32,32,32,32,32,32,32,32,32,32,32],
    structure:      'birthright',
    defaultSeason:  'birthright',
    defaultVariant: 'standard',
    variants: {
      standard: {
        label:      'Cerilian Calendar',
        description:'The Anuirean calendar of Cerilia, on Aebrynis.',
        monthNames: ['Emmanir','Deismir','Talenir','Roelir','Anarire','Sarimiere',
                     'Roesone','Passir','Sehnir','Keltier','Michaelen','Faniele'],
        colorTheme: 'birthright'
      }
    }
  }
};
export var CALENDAR_SYSTEM_ORDER = ['eberron','faerunian','gregorian','greyhawk','dragonlance','exandria','mystara','birthright'];

/* --- Display tuning -------------------------------------------------------*/
// How many days before/after the displayed month boundary trigger an adjacent
// strip of context days. 0 = no strip ever. 7 = always show a full border row.
export var CONFIG_NEARBY_DAYS = 5;

/* --- Weather tuning -------------------------------------------------------*/
// How many days ahead the GM forecast pre-generates.
export var CONFIG_WEATHER_FORECAST_DAYS = 20;
export var CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS = 90;

// How many days of locked weather history to keep.
export var CONFIG_WEATHER_HISTORY_DAYS = 60;

// How strongly yesterday's weather pulls today's roll toward it (0 = none, 2 = strong).
// 0 = pure fresh roll each day. 1 = gentle continuity. 2 = significant persistence.
export var CONFIG_WEATHER_SEED_STRENGTH = 1;

/* --- Weather Mechanics ----------------------------------------------------*/
// Script-ready thermal reference tables (expanded Fahrenheit band model).
// The live generator and display layers now use these -5..15 bands directly.
export var WEATHER_TEMPERATURE_BANDS_F = [
  { band:-5, minF:null as number|null, maxF:-46, label:'unholy cold', nominalDC:30, coldRequirement:'special', coldRequirementLabel:'Special protection required', heatArmorDisadvantage:'none', notes:['mundane clothing insufficient','planar or supernatural cold','wind, wetness, immersion, and no shelter sharply worsen exposure'] },
  { band:-4, minF:-45, maxF:-36, label:'soul-freezing', nominalDC:25, coldRequirement:'heavy_cwc', coldRequirementLabel:'Heavy cold-weather clothing required', heatArmorDisadvantage:'none', notes:['strong wind and exposed skin are major escalators','fire and shelter strongly mitigate'] },
  { band:-3, minF:-35, maxF:-26, label:'brutal cold', nominalDC:25, coldRequirement:'heavy_cwc', coldRequirementLabel:'Heavy cold-weather clothing required', heatArmorDisadvantage:'none', notes:['wind chill, snow, wetness, and hard travel worsen risk'] },
  { band:-2, minF:-25, maxF:-16, label:'bitter cold', nominalDC:20, coldRequirement:'medium_cwc', coldRequirementLabel:'Medium cold-weather clothing required', heatArmorDisadvantage:'none', notes:['wind, sleet, dampness, and poor shelter worsen risk'] },
  { band:-1, minF:-15, maxF:-6, label:'biting cold', nominalDC:20, coldRequirement:'medium_cwc', coldRequirementLabel:'Medium cold-weather clothing required', heatArmorDisadvantage:'none', notes:['wind, inactivity, and wet extremities worsen risk'] },
  { band:0, minF:-5, maxF:4, label:'hard freeze', nominalDC:15, coldRequirement:'light_cwc', coldRequirementLabel:'Light cold-weather clothing required', heatArmorDisadvantage:'none', notes:['wet clothing, freezing rain, and long exposure can increase effective DC'] },
  { band:1, minF:5, maxF:14, label:'frigid', nominalDC:15, coldRequirement:'light_cwc', coldRequirementLabel:'Light cold-weather clothing required', heatArmorDisadvantage:'none', notes:['wind, altitude, and wetness worsen exposure'] },
  { band:2, minF:15, maxF:24, label:'very cold', nominalDC:10, coldRequirement:'warm', coldRequirementLabel:'Warm clothing required', heatArmorDisadvantage:'none', notes:['snow, sleet, and long exposure may raise effective DC'] },
  { band:3, minF:25, maxF:34, label:'freezing', nominalDC:10, coldRequirement:'warm', coldRequirementLabel:'Warm clothing required', heatArmorDisadvantage:'none', notes:['ice, slush, rain plus wind, and wet feet or hands can raise effective DC'] },
  { band:4, minF:35, maxF:44, label:'chilly', nominalDC:null as number|null, coldRequirement:'none', coldRequirementLabel:'None normally', heatArmorDisadvantage:'none', notes:['rain plus wind may create situational cold checks'] },
  { band:5, minF:45, maxF:54, label:'cool', nominalDC:null as number|null, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'none', notes:['usually no thermal hazard'] },
  { band:6, minF:55, maxF:64, label:'mild', nominalDC:null as number|null, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'none', notes:['usually no thermal hazard'] },
  { band:7, minF:65, maxF:74, label:'temperate', nominalDC:null as number|null, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'none', notes:['usually no thermal hazard'] },
  { band:8, minF:75, maxF:84, label:'warm', nominalDC:null as number|null, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'none', notes:['usually no thermal hazard'] },
  { band:9, minF:85, maxF:94, label:'hot', nominalDC:null as number|null, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'none', notes:['humidity, dehydration, forced march, and radiant terrain may warrant situational checks'] },
  { band:10, minF:95, maxF:104, label:'sweltering', nominalDC:10, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'none', notes:['sun, humidity, radiant stone or sand, and forced pace can increase effective DC'] },
  { band:11, minF:105, maxF:114, label:'brutal heat', nominalDC:15, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'heavy', heatArmorDisadvantageLabel:'Disadvantage if wearing heavy armor', notes:['labor, poor hydration, hot wind, and no shade strongly worsen risk'] },
  { band:12, minF:115, maxF:124, label:'scorching', nominalDC:20, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'medium_or_heavy', heatArmorDisadvantageLabel:'Disadvantage if wearing medium or heavy armor', notes:['reflective terrain, no airflow, and hot surfaces worsen risk'] },
  { band:13, minF:125, maxF:134, label:'searing', nominalDC:25, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'any_armor', heatArmorDisadvantageLabel:'Disadvantage if wearing any armor at all', notes:['light, loose clothing only','furnace winds, exposed stone, smoke, and no shade worsen risk'] },
  { band:14, minF:135, maxF:144, label:'hellish', nominalDC:25, coldRequirement:'none', coldRequirementLabel:'None', heatArmorDisadvantage:'any_armor', heatArmorDisadvantageLabel:'Disadvantage if wearing any armor at all', notes:['light, loose clothing only','special cooling, magic, shelter, and shade become critical'] },
  { band:15, minF:145, maxF:null as number|null, label:'infernal', nominalDC:30, coldRequirement:'special', coldRequirementLabel:'Special protection required', heatArmorDisadvantage:'any_armor', heatArmorDisadvantageLabel:'Disadvantage if wearing any armor at all', notes:['planar heat, lava fields, magical fire, and radiant exposure','ordinary gear no longer solves the problem'] }
];

export var WEATHER_COLD_CLOTHING_TIERS: Record<string, any> = {
  none:      { label:'None', description:'No special cold gear required.' },
  warm:      { label:'Warm clothing', description:'Ordinary seasonal gear; no special armor-style proficiency required.' },
  light_cwc: { label:'Light cold-weather clothing', description:'Specialized cold-weather gear conceptually aligned with light armor.' },
  medium_cwc:{ label:'Medium cold-weather clothing', description:'Specialized bulky cold-weather gear conceptually aligned with medium armor.' },
  heavy_cwc: { label:'Heavy cold-weather clothing', description:'Expedition-grade cold-weather gear conceptually aligned with heavy armor.' },
  special:   { label:'Special protection', description:'Magic, planar gear, enclosed transport, or equivalent extraordinary protection.' }
};

export var WEATHER_HEAT_ARMOR_RULES: Record<string, any> = {
  none:            { label:'No armor penalty', description:'Armor alone does not impose disadvantage from heat at this band.' },
  heavy:           { label:'Heavy armor penalized', description:'Disadvantage on the save if wearing heavy armor.' },
  medium_or_heavy: { label:'Medium or heavy armor penalized', description:'Disadvantage on the save if wearing medium or heavy armor.' },
  any_armor:       { label:'Any armor penalized', description:'Disadvantage on the save if wearing any armor at all.' },
  special_only:    { label:'Mundane gear insufficient', description:'Ordinary armor and clothing are not enough; special protection is required.' }
};

export var WEATHER_TEMPERATURE_SYSTEM_RULES: Record<string, any> = {
  baseline: {
    dcLadder: [10, 15, 20, 25, 30],
    note: 'Uses the standard 5e difficulty ladder as nominal baseline DCs.'
  },
  cold: {
    rule: 'If a creature wears less than the required cold-weather clothing tier, it has disadvantage on the save.',
    tiers: { warm:[2,3], light_cwc:[0,1], medium_cwc:[-2,-1], heavy_cwc:[-4,-3], special:[-5] }
  },
  heat: {
    rule: 'If a creature wears armor forbidden by the current heat band, it has disadvantage on the save.',
    tiers: { heavy:[11], medium_or_heavy:[12], any_armor:[13,14,15] }
  }
};

export var WEATHER_TEMP_BAND_MIN = -5;
export var WEATHER_TEMP_BAND_MAX = 15;
export var WEATHER_LEGACY_TEMP_TO_BAND: Record<number, number> = {
  0: -3,
  1: -2,
  2: 0,
  3: 1,
  4: 3,
  5: 4,
  6: 6,
  7: 7,
  8: 9,
  9: 10,
  10: 12
};
export var WEATHER_TEMPERATURE_BAND_INDEX: Record<number, any> = {};
for (var _wtbi = 0; _wtbi < WEATHER_TEMPERATURE_BANDS_F.length; _wtbi++){
  WEATHER_TEMPERATURE_BAND_INDEX[WEATHER_TEMPERATURE_BANDS_F[_wtbi].band] = WEATHER_TEMPERATURE_BANDS_F[_wtbi];
}

// Wind still uses the fixed stage table below. Temperature mechanics are now
// derived from WEATHER_TEMPERATURE_BANDS_F so the live generator and rules
// share the same -5..15 band scale.
// Temperature mechanics now derived from WEATHER_TEMPERATURE_BANDS_F via _weatherTempMechanics().
// Wind mechanics still use this lookup table.
export var CONFIG_WEATHER_MECHANICS: Record<string, any> = {
  wind: {
    0: null,
    1: null,
    2: 'Fogs and gases dispersed.',
    3: 'Disadvantage on ranged attack rolls. Long range attacks automatically miss. Flying costs an additional foot of movement. Open flames extinguished.',
    4: 'Ranged attack rolls automatically miss. Flying speeds reduced to 0. Walking costs an additional foot of movement.',
    5: 'DC 15 Strength check or fall prone. Small trees uprooted. Projectiles deal 2d6 bludgeoning (DC 10 Dex save). Severe hazard.'
  }
  // Precip mechanics are now fully derived per-condition by _deriveConditions.
  // See CONFIG_WEATHER_FLAVOR for narrative and that function for visibility rules.
};

/* --- Weather Labels -------------------------------------------------------*/
// Player-facing band names. Precip labels are now condition names (see _deriveConditions).
export var CONFIG_WEATHER_LABELS: Record<string, any> = {
  temp: {
    '-5':'Unholy Cold','-4':'Soul-Freezing','-3':'Brutal Cold',
    '-2':'Bitter Cold','-1':'Biting Cold','0':'Hard Freeze',
    '1':'Frigid','2':'Very Cold','3':'Freezing',
    '4':'Chilly','5':'Cool','6':'Mild',
    '7':'Temperate','8':'Warm','9':'Hot',
    '10':'Sweltering','11':'Brutal Heat','12':'Scorching',
    '13':'Searing','14':'Hellish','15':'Infernal'
  },
  wind:   ['Calm','Breezy','Moderate Wind','Strong Winds','Gale','Storm'],
  precip: ['Clear','Partly Cloudy','Overcast','Light Precipitation','Moderate Precipitation','Heavy Precipitation']
};

/* --- Weather Flavor Text --------------------------------------------------*/
// Keyed as tempBand|precipStage. precipStage uses the 0-5 precip scale.
// tempBand: cold(≤3) = ≤34F, cool(4) = 35-44F, mild(5-6) = 45-64F,
//           warm(7-8) = 65-84F, hot(9+) = 85F+
// Fog is a derived condition (morning, low wind, swamp/valley/forest) and
// handled separately in _deriveConditions — not represented here.
export var CONFIG_WEATHER_FLAVOR: Record<string, string> = {
  'cold|0':  'Bitterly cold and clear. Frost glitters on every surface.',
  'cold|1':  'Cold and partly cloudy. A few high clouds drift past.',
  'cold|2':  'Cold and overcast. A grey ceiling threatens snow.',
  'cold|3':  'Cold with light snow. Flakes fall steadily.',
  'cold|4':  'Heavy snowfall blankets the ground, threatening those exposed to the cold.',
  'cold|5':  'Blizzard. Whiteout conditions from an impenetrable wall of snow and wind.',
  'cool|0':  'Crisp and clear. A clean chill in the air.',
  'cool|1':  'Cool with scattered clouds. Pleasant but brisk.',
  'cool|2':  'Cool and overcast. Damp and grey.',
  'cool|3':  'Sleet and freezing rain. Surfaces are slick.',
  'cool|4':  'Ice storm. A thick glaze of ice coats everything.',
  'cool|5':  'Catastrophic ice storm. Travel is impossible.',
  'mild|0':  'Clear skies. A fine day.',
  'mild|1':  'Partly cloudy. Fair weather clouds drift by.',
  'mild|2':  'Mostly cloudy. The sky is a featureless grey.',
  'mild|3':  'Light rain. A steady drizzle.',
  'mild|4':  'Heavy rain. Roadways begin filling, and low lying paths turn to rivers.',
  'mild|5':  'Torrential downpour. Sheets of rain cause near-zero visibility.',
  'warm|0':  'Warm and sunny. Not a cloud in the sky.',
  'warm|1':  'Warm with clouds building. Hazy and humid.',
  'warm|2':  'Warm and overcast. The air feels heavy.',
  'warm|3':  'Warm with light rain. Humid and close.',
  'warm|4':  'Heavy rain. Hot and muggy. Thunder rumbles.',
  'warm|5':  'Violent thunderstorm. Lightning, driving rain, and flooding.',
  'hot|0':   'Hot and dry. The sun is punishing.',
  'hot|1':   'Hot and hazy. Dust or heat shimmer on the horizon.',
  'hot|2':   'Hot and overcast. Oppressive humidity.',
  'hot|3':   'Hot with light rain. Steam rises from the ground.',
  'hot|4':   'Intense heat and driving rain. Tropical storm conditions.',
  'hot|5':   'Catastrophic heat storm. Flash flooding and dangerous lightning.'
};
