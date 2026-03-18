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

export var WEATHER_TEMP_BAND_MIN = -5;
export var WEATHER_TEMP_BAND_MAX = 15;

// Wind mechanics lookup table.
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
