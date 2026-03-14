// Eberron Calendar (Clean Unified Edition)
// By Matthew Cherry (github.com/mcherry1/calendar)
// Roll20 API script
// Call `!cal` to start. Add macro for easy access.
// Version: 3.0
//
// ⚠ AUTO-GENERATED — do not edit directly.
// Edit TypeScript source in src/ and run: npm run build
var Calendar = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    _test: () => _test,
    checkInstall: () => checkInstall3,
    colors: () => colors,
    events: () => events,
    register: () => register2,
    render: () => render
  });

  // src/config.ts
  var CONFIG_ERA_LABEL = "YK";
  var CONFIG_START_DATE = {
    month: 0,
    day_of_the_month: 1,
    day_of_the_week: 0,
    year: 998
  };
  var CONFIG_MONTH_LENGTHS = [
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28,
    28
  ];
  var CONFIG_DEFAULTS = {
    calendarSystem: "eberron",
    // key in CALENDAR_SYSTEMS
    calendarVariant: "standard",
    // key in CALENDAR_SYSTEMS[x].variants
    seasonVariant: "eberron",
    // key in SEASON_SETS; can be overridden per campaign
    hemisphere: "north",
    // 'north' or 'south'; only affects faerun and gregorian sets
    colorTheme: null,
    // null = use variant default; set to override
    eventsEnabled: true,
    // false = event subsystem hidden/disabled from default views
    moonsEnabled: true,
    // false = moon system fully disabled
    weatherEnabled: true,
    // false = weather system fully disabled
    weatherMechanicsEnabled: true,
    // false = keep narrative weather, suppress D&D mechanics text
    planesEnabled: true,
    // false = planar system disabled
    offCyclePlanes: true,
    // false = disable off-cycle generated planar movement
    moonDisplayMode: "calendar",
    // 'calendar' | 'list' | 'both'
    weatherDisplayMode: "calendar",
    // 'calendar' | 'list' | 'both'
    planesDisplayMode: "calendar",
    // 'calendar' | 'list' | 'both'
    subsystemVerbosity: "normal",
    // 'normal' | 'minimal'
    weatherForecastViewDays: 10,
    // GM weather forecast display span (1-20)
    uiDensity: "normal",
    // 'compact' or 'normal'
    autoButtons: false
    // false = suppress auto action buttons on !cal
  };
  var CALENDAR_SYSTEMS = {
    eberron: {
      label: "Galifar",
      description: "12 months of 28 days. 7-day week. Default Eberron Campaign Setting calendar.",
      weekdays: ["Sul", "Mol", "Zol", "Wir", "Zor", "Far", "Sar"],
      monthDays: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
      structure: null,
      defaultSeason: "eberron",
      defaultVariant: "standard",
      variants: {
        standard: {
          label: "Standard (Galifar)",
          monthNames: [
            "Zarantyr",
            "Olarune",
            "Therendor",
            "Eyre",
            "Dravago",
            "Nymm",
            "Lharvion",
            "Barrakas",
            "Rhaan",
            "Sypheros",
            "Aryth",
            "Vult"
          ],
          colorTheme: "lunar"
        },
        druidic: {
          label: "Druidic",
          monthNames: [
            "Frostmantle",
            "Thornrise",
            "Treeborn",
            "Rainsong",
            "Arrowfar",
            "Sunstride",
            "Glitterstream",
            "Havenwild",
            "Stormborn",
            "Harrowfall",
            "Silvermoon",
            "Windwhisper"
          ],
          colorTheme: "druidic"
        },
        halfling: {
          label: "Halfling",
          monthNames: [
            "Fang",
            "Wind",
            "Ash",
            "Hunt",
            "Song",
            "Dust",
            "Claw",
            "Blood",
            "Horn",
            "Heart",
            "Spirit",
            "Smoke"
          ],
          colorTheme: "halfling"
        },
        dwarven: {
          label: "Dwarven",
          monthNames: [
            "Aruk",
            "Lurn",
            "Ulbar",
            "Kharn",
            "Ziir",
            "Dwarhuun",
            "Jond",
            "Sylar",
            "Razagul",
            "Thazm",
            "Drakhadur",
            "Uarth"
          ],
          colorTheme: "dwarven"
        }
      }
    },
    faerunian: {
      label: "Harptos",
      description: "12 months of 30 days, split into three tendays. 5 festival days occur between months. Shieldmeet follows Midsummer every 4 years.",
      weekdays: ["Firstday", "Secondday", "Thirdday", "Fourthday", "Fifthday", "Sixthday", "Seventhday", "Eighthday", "Ninthday", "Tenthday"],
      weekdayAbbr: {
        Firstday: "1st",
        Secondday: "2nd",
        Thirdday: "3rd",
        Fourthday: "4th",
        Fifthday: "5th",
        Sixthday: "6th",
        Seventhday: "7th",
        Eighthday: "8th",
        Ninthday: "9th",
        Tenthday: "10th"
      },
      monthDays: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      structure: "harptos",
      defaultSeason: "faerun",
      defaultVariant: "standard",
      variants: {
        standard: {
          label: "Standard (Dalereckoning)",
          monthNames: [
            "Hammer",
            "Alturiak",
            "Ches",
            "Tarsakh",
            "Mirtul",
            "Kythorn",
            "Flamerule",
            "Eleasis",
            "Eleint",
            "Marpenoth",
            "Uktar",
            "Nightal"
          ],
          colorTheme: "seasons"
        }
      }
    },
    gregorian: {
      label: "Gregorian",
      description: "12 months of varying length. Standard Earth calendar.",
      weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      weekdayAbbr: {
        Sunday: "Sun",
        Monday: "Mon",
        Tuesday: "Tue",
        Wednesday: "Wed",
        Thursday: "Thu",
        Friday: "Fri",
        Saturday: "Sat"
      },
      monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      structure: "gregorian",
      defaultSeason: "gregorian",
      defaultVariant: "standard",
      variants: {
        standard: {
          label: "Standard",
          monthNames: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ],
          colorTheme: "birthstones"
        }
      }
    }
  };
  var CALENDAR_SYSTEM_ORDER = ["eberron", "faerunian", "gregorian"];
  var CONFIG_NEARBY_DAYS = 5;
  var CONFIG_WEATHER_FORECAST_DAYS = 20;
  var CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS = 90;
  var CONFIG_WEATHER_HISTORY_DAYS = 60;
  var CONFIG_WEATHER_SEED_STRENGTH = 1;
  var WEATHER_TEMPERATURE_BANDS_F = [
    { band: -5, minF: null, maxF: -46, label: "unholy cold", nominalDC: 30, coldRequirement: "special", coldRequirementLabel: "Special protection required", heatArmorDisadvantage: "none", notes: ["mundane clothing insufficient", "planar or supernatural cold", "wind, wetness, immersion, and no shelter sharply worsen exposure"] },
    { band: -4, minF: -45, maxF: -36, label: "soul-freezing", nominalDC: 25, coldRequirement: "heavy_cwc", coldRequirementLabel: "Heavy cold-weather clothing required", heatArmorDisadvantage: "none", notes: ["strong wind and exposed skin are major escalators", "fire and shelter strongly mitigate"] },
    { band: -3, minF: -35, maxF: -26, label: "brutal cold", nominalDC: 25, coldRequirement: "heavy_cwc", coldRequirementLabel: "Heavy cold-weather clothing required", heatArmorDisadvantage: "none", notes: ["wind chill, snow, wetness, and hard travel worsen risk"] },
    { band: -2, minF: -25, maxF: -16, label: "bitter cold", nominalDC: 20, coldRequirement: "medium_cwc", coldRequirementLabel: "Medium cold-weather clothing required", heatArmorDisadvantage: "none", notes: ["wind, sleet, dampness, and poor shelter worsen risk"] },
    { band: -1, minF: -15, maxF: -6, label: "biting cold", nominalDC: 20, coldRequirement: "medium_cwc", coldRequirementLabel: "Medium cold-weather clothing required", heatArmorDisadvantage: "none", notes: ["wind, inactivity, and wet extremities worsen risk"] },
    { band: 0, minF: -5, maxF: 4, label: "hard freeze", nominalDC: 15, coldRequirement: "light_cwc", coldRequirementLabel: "Light cold-weather clothing required", heatArmorDisadvantage: "none", notes: ["wet clothing, freezing rain, and long exposure can increase effective DC"] },
    { band: 1, minF: 5, maxF: 14, label: "frigid", nominalDC: 15, coldRequirement: "light_cwc", coldRequirementLabel: "Light cold-weather clothing required", heatArmorDisadvantage: "none", notes: ["wind, altitude, and wetness worsen exposure"] },
    { band: 2, minF: 15, maxF: 24, label: "very cold", nominalDC: 10, coldRequirement: "warm", coldRequirementLabel: "Warm clothing required", heatArmorDisadvantage: "none", notes: ["snow, sleet, and long exposure may raise effective DC"] },
    { band: 3, minF: 25, maxF: 34, label: "freezing", nominalDC: 10, coldRequirement: "warm", coldRequirementLabel: "Warm clothing required", heatArmorDisadvantage: "none", notes: ["ice, slush, rain plus wind, and wet feet or hands can raise effective DC"] },
    { band: 4, minF: 35, maxF: 44, label: "chilly", nominalDC: null, coldRequirement: "none", coldRequirementLabel: "None normally", heatArmorDisadvantage: "none", notes: ["rain plus wind may create situational cold checks"] },
    { band: 5, minF: 45, maxF: 54, label: "cool", nominalDC: null, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "none", notes: ["usually no thermal hazard"] },
    { band: 6, minF: 55, maxF: 64, label: "mild", nominalDC: null, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "none", notes: ["usually no thermal hazard"] },
    { band: 7, minF: 65, maxF: 74, label: "temperate", nominalDC: null, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "none", notes: ["usually no thermal hazard"] },
    { band: 8, minF: 75, maxF: 84, label: "warm", nominalDC: null, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "none", notes: ["usually no thermal hazard"] },
    { band: 9, minF: 85, maxF: 94, label: "hot", nominalDC: null, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "none", notes: ["humidity, dehydration, forced march, and radiant terrain may warrant situational checks"] },
    { band: 10, minF: 95, maxF: 104, label: "sweltering", nominalDC: 10, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "none", notes: ["sun, humidity, radiant stone or sand, and forced pace can increase effective DC"] },
    { band: 11, minF: 105, maxF: 114, label: "brutal heat", nominalDC: 15, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "heavy", heatArmorDisadvantageLabel: "Disadvantage if wearing heavy armor", notes: ["labor, poor hydration, hot wind, and no shade strongly worsen risk"] },
    { band: 12, minF: 115, maxF: 124, label: "scorching", nominalDC: 20, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "medium_or_heavy", heatArmorDisadvantageLabel: "Disadvantage if wearing medium or heavy armor", notes: ["reflective terrain, no airflow, and hot surfaces worsen risk"] },
    { band: 13, minF: 125, maxF: 134, label: "searing", nominalDC: 25, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "any_armor", heatArmorDisadvantageLabel: "Disadvantage if wearing any armor at all", notes: ["light, loose clothing only", "furnace winds, exposed stone, smoke, and no shade worsen risk"] },
    { band: 14, minF: 135, maxF: 144, label: "hellish", nominalDC: 25, coldRequirement: "none", coldRequirementLabel: "None", heatArmorDisadvantage: "any_armor", heatArmorDisadvantageLabel: "Disadvantage if wearing any armor at all", notes: ["light, loose clothing only", "special cooling, magic, shelter, and shade become critical"] },
    { band: 15, minF: 145, maxF: null, label: "infernal", nominalDC: 30, coldRequirement: "special", coldRequirementLabel: "Special protection required", heatArmorDisadvantage: "any_armor", heatArmorDisadvantageLabel: "Disadvantage if wearing any armor at all", notes: ["planar heat, lava fields, magical fire, and radiant exposure", "ordinary gear no longer solves the problem"] }
  ];
  var WEATHER_HEAT_ARMOR_RULES = {
    none: { label: "No armor penalty", description: "Armor alone does not impose disadvantage from heat at this band." },
    heavy: { label: "Heavy armor penalized", description: "Disadvantage on the save if wearing heavy armor." },
    medium_or_heavy: { label: "Medium or heavy armor penalized", description: "Disadvantage on the save if wearing medium or heavy armor." },
    any_armor: { label: "Any armor penalized", description: "Disadvantage on the save if wearing any armor at all." },
    special_only: { label: "Mundane gear insufficient", description: "Ordinary armor and clothing are not enough; special protection is required." }
  };
  var WEATHER_TEMP_BAND_MIN = -5;
  var WEATHER_TEMP_BAND_MAX = 15;
  var WEATHER_LEGACY_TEMP_TO_BAND = {
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
  var WEATHER_TEMPERATURE_BAND_INDEX = {};
  for (_wtbi = 0; _wtbi < WEATHER_TEMPERATURE_BANDS_F.length; _wtbi++) {
    WEATHER_TEMPERATURE_BAND_INDEX[WEATHER_TEMPERATURE_BANDS_F[_wtbi].band] = WEATHER_TEMPERATURE_BANDS_F[_wtbi];
  }
  var _wtbi;
  var CONFIG_WEATHER_MECHANICS = {
    wind: {
      0: null,
      1: null,
      2: "Fogs and gases dispersed.",
      3: "Disadvantage on ranged attack rolls. Long range attacks automatically miss. Flying costs an additional foot of movement. Open flames extinguished.",
      4: "Ranged attack rolls automatically miss. Flying speeds reduced to 0. Walking costs an additional foot of movement.",
      5: "DC 15 Strength check or fall prone. Small trees uprooted. Projectiles deal 2d6 bludgeoning (DC 10 Dex save). Severe hazard."
    }
    // Precip mechanics are now fully derived per-condition by _deriveConditions.
    // See CONFIG_WEATHER_FLAVOR for narrative and that function for visibility rules.
  };
  var CONFIG_WEATHER_LABELS = {
    temp: {
      "-5": "Unholy Cold",
      "-4": "Soul-Freezing",
      "-3": "Brutal Cold",
      "-2": "Bitter Cold",
      "-1": "Biting Cold",
      "0": "Hard Freeze",
      "1": "Frigid",
      "2": "Very Cold",
      "3": "Freezing",
      "4": "Chilly",
      "5": "Cool",
      "6": "Mild",
      "7": "Temperate",
      "8": "Warm",
      "9": "Hot",
      "10": "Sweltering",
      "11": "Brutal Heat",
      "12": "Scorching",
      "13": "Searing",
      "14": "Hellish",
      "15": "Infernal"
    },
    wind: ["Calm", "Breezy", "Moderate Wind", "Strong Winds", "Gale", "Storm"],
    precip: ["Clear", "Partly Cloudy", "Overcast", "Light Precipitation", "Moderate Precipitation", "Heavy Precipitation"]
  };
  var CONFIG_WEATHER_FLAVOR = {
    "cold|0": "Bitterly cold and clear. Frost glitters on every surface.",
    "cold|1": "Cold and partly cloudy. A few high clouds drift past.",
    "cold|2": "Cold and overcast. A grey ceiling threatens snow.",
    "cold|3": "Cold with light snow. Flakes fall steadily.",
    "cold|4": "Heavy snowfall blankets the ground, threatening those exposed to the cold.",
    "cold|5": "Blizzard. Whiteout conditions from an impenetrable wall of snow and wind.",
    "cool|0": "Crisp and clear. A clean chill in the air.",
    "cool|1": "Cool with scattered clouds. Pleasant but brisk.",
    "cool|2": "Cool and overcast. Damp and grey.",
    "cool|3": "Sleet and freezing rain. Surfaces are slick.",
    "cool|4": "Ice storm. A thick glaze of ice coats everything.",
    "cool|5": "Catastrophic ice storm. Travel is impossible.",
    "mild|0": "Clear skies. A fine day.",
    "mild|1": "Partly cloudy. Fair weather clouds drift by.",
    "mild|2": "Mostly cloudy. The sky is a featureless grey.",
    "mild|3": "Light rain. A steady drizzle.",
    "mild|4": "Heavy rain. Roadways begin filling, and low lying paths turn to rivers.",
    "mild|5": "Torrential downpour. Sheets of rain cause near-zero visibility.",
    "warm|0": "Warm and sunny. Not a cloud in the sky.",
    "warm|1": "Warm with clouds building. Hazy and humid.",
    "warm|2": "Warm and overcast. The air feels heavy.",
    "warm|3": "Warm with light rain. Humid and close.",
    "warm|4": "Heavy rain. Hot and muggy. Thunder rumbles.",
    "warm|5": "Violent thunderstorm. Lightning, driving rain, and flooding.",
    "hot|0": "Hot and dry. The sun is punishing.",
    "hot|1": "Hot and hazy. Dust or heat shimmer on the horizon.",
    "hot|2": "Hot and overcast. Oppressive humidity.",
    "hot|3": "Hot with light rain. Steam rises from the ground.",
    "hot|4": "Intense heat and driving rain. Tropical storm conditions.",
    "hot|5": "Catastrophic heat storm. Flash flooding and dangerous lightning."
  };

  // src/constants.ts
  var script_name = "Calendar";
  var state_name = "CALENDAR";
  var _SEASONS_EBERRON = [
    "Mid-winter",
    "Late winter",
    "Early spring",
    "Mid-spring",
    "Late spring",
    "Early summer",
    "Mid-summer",
    "Late summer",
    "Early autumn",
    "Mid-autumn",
    "Late autumn",
    "Early winter"
  ];
  var SEASON_SETS = {
    // Eberron planar seasons — defined by the Draconic Prophecy, not geography.
    // These names are canon from the Eberron Campaign Setting.
    eberron: {
      names: _SEASONS_EBERRON.slice(),
      hemisphereAware: false
    },
    // Faerunian / generic geographic seasons — plain four-season names at month boundaries.
    // Hemisphere-aware: hemisphere south shifts all names by 6 months.
    faerun: {
      names: [
        "Winter",
        "Winter",
        "Spring",
        "Spring",
        "Spring",
        "Summer",
        "Summer",
        "Summer",
        "Autumn",
        "Autumn",
        "Autumn",
        "Winter"
      ],
      hemisphereAware: true
    },
    // Gregorian mid-month transitions — season flips on the solstice/equinox day.
    // Northern transitions are standard astronomical dates.
    // Southern transitions are the same dates offset by 6 months.
    gregorian: {
      names: [
        "Winter",
        "Winter",
        "Spring",
        "Spring",
        "Spring",
        "Summer",
        "Summer",
        "Summer",
        "Autumn",
        "Autumn",
        "Autumn",
        "Winter"
      ],
      hemisphereAware: true,
      transitions: [
        { mi: 2, day: 20, season: "Spring" },
        // March 20
        { mi: 5, day: 21, season: "Summer" },
        // June 21
        { mi: 8, day: 22, season: "Autumn" },
        // September 22
        { mi: 11, day: 21, season: "Winter" }
        // December 21
      ],
      transitionsSouth: [
        { mi: 2, day: 20, season: "Autumn" },
        // March 20
        { mi: 5, day: 21, season: "Winter" },
        // June 21
        { mi: 8, day: 22, season: "Spring" },
        // September 22
        { mi: 11, day: 21, season: "Summer" }
        // December 21
      ]
    },
    // Tropical monsoon — three-phase cycle: cool → hot → rainy, 4 months each.
    // Not hemisphere-aware: equatorial climates don't have meaningful hemispheres.
    tropical: {
      names: [
        "Early Cool Season",
        "Early-Mid Cool Season",
        "Mid-Late Cool Season",
        "Late Cool Season",
        "Early Hot Season",
        "Early-Mid Hot Season",
        "Mid-Late Hot Season",
        "Late Hot Season",
        "Early Rainy Season",
        "Early-Mid Rainy Season",
        "Mid-Late Rainy Season",
        "Late Rainy Season"
      ],
      hemisphereAware: false
    }
  };
  var CALENDAR_STRUCTURE_SETS = {
    // Harptos calendar (Forgotten Realms / Forgotten Realms Dalereckoning).
    // 12 regular months × 30 days, 5 fixed festival days, Shieldmeet every 4 years.
    // Leap years: year % 4 === 0 in Dalereckoning (e.g. 1372 DR, 1376 DR).
    // Total: 365 days non-leap, 366 days leap.
    harptos: [
      { regularIndex: 0 },
      { isIntercalary: true, name: "Midwinter", days: 1 },
      { regularIndex: 1 },
      { regularIndex: 2 },
      { regularIndex: 3 },
      { isIntercalary: true, name: "Greengrass", days: 1 },
      { regularIndex: 4 },
      { regularIndex: 5 },
      { regularIndex: 6 },
      { isIntercalary: true, name: "Midsummer", days: 1 },
      { isIntercalary: true, name: "Shieldmeet", days: 1, leapEvery: 4 },
      { regularIndex: 7 },
      { regularIndex: 8 },
      { regularIndex: 9 },
      { regularIndex: 10 },
      { isIntercalary: true, name: "Highharvestide", days: 1 },
      { regularIndex: 11 },
      { isIntercalary: true, name: "Feast of the Moon", days: 1 }
    ],
    // Gregorian with leap day inserted after February.
    // The slot uses the full Gregorian rule in _isLeapMonth:
    // divisible by 4, except centuries unless divisible by 400.
    // Total: 365 days non-leap, 366 days leap.
    gregorian: [
      { regularIndex: 0 },
      { regularIndex: 1 },
      { isIntercalary: true, name: "Leap Day", days: 1, leapEvery: 4 },
      { regularIndex: 2 },
      { regularIndex: 3 },
      { regularIndex: 4 },
      { regularIndex: 5 },
      { regularIndex: 6 },
      { regularIndex: 7 },
      { regularIndex: 8 },
      { regularIndex: 9 },
      { regularIndex: 10 },
      { regularIndex: 11 }
    ]
  };
  var COLOR_THEMES = {
    seasons: [
      "#FFFFFF",
      "#CBD5E1",
      "#D8F3DC",
      "#FFB7C5",
      "#E6E6FA",
      "#FFC54D",
      "#50C878",
      "#64B5F6",
      "#B38E3C",
      "#FF7518",
      "#8B5A2B",
      "#475569"
    ],
    lunar: [
      "#F5F5FA",
      "#FFC68A",
      "#D3D3D3",
      "#C0C0C0",
      "#E6E6FA",
      "#FFD96B",
      "#F5F5F5",
      "#DCDCDC",
      "#9AC0FF",
      "#696969",
      "#FF4500",
      "#A9A9A9"
    ],
    druidic: [
      "#F2F7FF",
      "#C9D6C3",
      "#D8F3DC",
      "#D8CFEA",
      "#9EC5E8",
      "#FFC54D",
      "#63D2FF",
      "#50C878",
      "#2E3A8C",
      "#FF7518",
      "#E6E6FA",
      "#E8EDF2"
    ],
    halfling: [
      "#E8EEF3",
      "#BDE0FE",
      "#C7CBD1",
      "#2F855A",
      "#F48FB1",
      "#BF946A",
      "#D6C151",
      "#8B0000",
      "#F3ECDB",
      "#8E3B46",
      "#C7C3E3",
      "#6B7280"
    ],
    dwarven: [
      "#0D0D0D",
      "#2F343B",
      "#7A4E1D",
      "#7F8999",
      "#C0C0C0",
      "#FFB11B",
      "#E5E4E2",
      "#0A3A8C",
      "#064E3B",
      "#FF7518",
      "#C21807",
      "#DDEAF7"
    ],
    birthstones: [
      "#7A1E2C",
      "#8E5AC8",
      "#66E5D9",
      "#F2FBFF",
      "#00A86B",
      "#F7F3EE",
      "#D0002A",
      "#A8E100",
      "#0A4AA6",
      "#E83E8C",
      "#FFA726",
      "#00B8D4"
    ]
  };
  var THEME_ORDER = ["seasons", "lunar", "druidic", "halfling", "dwarven", "birthstones"];
  var NAMED_COLORS = {
    red: "#E53935",
    apple: "#D32F2F",
    garnet: "#9B111E",
    pink: "#EC407A",
    orange: "#F4511E",
    brown: "#6D4C41",
    copper: "#B87333",
    yellow: "#FDD835",
    lemon: "#FBC02D",
    gold: "#D4AF37",
    topaz: "#FFC54D",
    green: "#43A047",
    lime: "#7CB342",
    forest: "#228B22",
    emerald: "#50C878",
    teal: "#00897B",
    blue: "#1E88E5",
    royal: "#3949AB",
    sky: "#29B6F6",
    sapphire: "#0F52BA",
    aqua: "#7FFFD4",
    indigo: "#3949AB",
    navy: "#283593",
    violet: "#7E57C2",
    purple: "#5E35B1",
    grape: "#8E24AA",
    amethyst: "#9966CC",
    black: "#000000",
    obsidian: "#0D0D0D",
    onyx: "#353839",
    gray: "#9E9E9E",
    silver: "#C0C0C0",
    platinum: "#E5E4E2",
    white: "#FFFFFF",
    snow: "#FFFAFA",
    diamond: "#E6F7FF"
  };
  NAMED_COLORS.grey = NAMED_COLORS.gray;
  NAMED_COLORS.forestgreen = NAMED_COLORS.forest;
  NAMED_COLORS.skyblue = NAMED_COLORS.sky;
  NAMED_COLORS.charcoal = NAMED_COLORS.onyx;
  NAMED_COLORS.snowwhite = NAMED_COLORS.snow;
  var DEFAULT_EVENTS = {
    sharn: [
      { name: "Tain Gala", month: "all", day: "first far", color: "#F7E7CE" },
      { name: "Crystalfall", month: 2, day: 9, color: "#D7F3FF" },
      { name: "Day of Ashes", month: 5, day: 3, color: "#B0BEC5" },
      { name: "The Race of Eight Winds", month: 7, day: 23, color: "#006D3C" }
    ],
    khorvaire: [
      { name: "Day of Mourning", month: 2, day: 20, color: "#9E9E9E" },
      { name: "Galifar's Throne", month: 6, day: 5, color: "#D4AF37" },
      { name: "Thronehold", month: 11, day: 11, color: "#E80001" }
    ],
    "sovereign host": [
      { name: "Onatar's Flame", month: 1, day: 7, color: "#FF6F00" },
      { name: "Turrant's Gift", month: 2, day: 14, color: "#B8860B" },
      { name: "Olladra's Feast", month: 2, day: 28, color: "#8BC34A" },
      { name: "Sun's Blessing", month: 3, day: 15, color: "#FFC107" },
      { name: "Aureon's Crown", month: 5, day: 26, color: "#283593" },
      { name: "Brightblade", month: 6, day: 12, color: "#B71C1C" },
      { name: "Bounty's Blessing", month: 7, day: 14, color: "#388E3C" },
      { name: "The Hunt", month: 8, day: 4, color: "#1B5E20" },
      { name: "Boldrei's Feast", month: 9, day: 9, color: "#F57C00" },
      { name: "Market Day", month: 11, day: 20, color: "#FFD54F" }
    ],
    "dark six": [
      { name: "Shargon's Bargain", month: 4, day: 13, color: "#006064" },
      { name: "Second Skin", month: 6, day: 11, color: "#809E62" },
      { name: "Wildnight", month: 10, day: "18-19", color: "#AD1457" },
      { name: "Long Shadows", month: 12, day: "26-28", color: "#0D0D0D" }
    ],
    "silver flame": [
      { name: "Rebirth Eve", month: 1, day: 14, color: "#EAF2FF" },
      { name: "Bright Souls' Day", month: 2, day: 18, color: "#FFF2C6" },
      { name: "Tirasday", month: 3, day: 5, color: "#DCEBFF" },
      { name: "Initiation Day", month: 4, day: 11, color: "#C7E3FF" },
      { name: "Baker's Night", month: 5, day: 6, color: "#D8B98F" },
      { name: "Promisetide", month: 5, day: 28, color: "#BDE3FF" },
      { name: "First Dawn", month: 6, day: 21, color: "#FFD1A6" },
      { name: "Silvertide", month: 7, day: 14, color: "#F2F7FF" },
      { name: "Victory Day", month: 8, day: 9, color: "#B3E5FC" },
      { name: "Fathen's Fall", month: 8, day: 25, color: "#E7ECF5" },
      { name: "The Ascension", month: 10, day: 1, color: "#E6F0FF" },
      { name: "Saint Valtros's Day", month: 10, day: 25, color: "#E8ECFF" },
      { name: "Rampartide", month: 11, day: 24, color: "#D6F5D6" },
      { name: "Khybersef", month: 12, day: 27, color: "#111827" },
      { name: "Day of Cleansing Fire", month: "all", day: "all sul", color: "#F2F7FF" }
    ],
    stormreach: [
      { name: "The Burning Titan", month: 3, day: 1, color: "#FF5722" },
      { name: "Pirate\u2019s Moon", month: 5, day: 20, color: "#0E7490" },
      { name: "The Annual Games", month: 6, day: "1-14", color: "#2E7D32" },
      { name: "Shacklebreak", month: 11, day: 1, color: "#455A64" }
    ],
    // Standard astronomical + calendrical season markers for Gregorian campaigns.
    // Each day carries both the solstice/equinox name and the "First Day of X" label
    // so GMs can use whichever fits their world’s flavor.
    // Dates are the standard modern astronomical dates (northern hemisphere).
    gregorian_seasons: [
      { name: "First Day of Winter", month: 12, day: 21, color: "#A8DADC" },
      { name: "Winter Solstice", month: 12, day: 21, color: "#A8DADC" },
      { name: "First Day of Spring", month: 3, day: 20, color: "#A8E6A3" },
      { name: "Spring Equinox", month: 3, day: 20, color: "#A8E6A3" },
      { name: "First Day of Summer", month: 6, day: 21, color: "#FFD166" },
      { name: "Summer Solstice", month: 6, day: 21, color: "#FFD166" },
      { name: "First Day of Autumn", month: 9, day: 22, color: "#F4A261" },
      { name: "Autumn Equinox", month: 9, day: 22, color: "#F4A261" }
    ]
  };
  var DEFAULT_EVENT_SOURCE_CALENDARS = {
    sharn: ["eberron"],
    khorvaire: ["eberron"],
    "sovereign host": ["eberron"],
    "dark six": ["eberron"],
    "silver flame": ["eberron"],
    stormreach: ["eberron"],
    gregorian_seasons: ["gregorian"]
  };
  var RANGE_CAP_YEARS = null;
  var CONTRAST_MIN_HEADER = 4.5;
  var CONTRAST_MIN_CELL = 7;
  var LABELS = {
    era: CONFIG_ERA_LABEL,
    gmOnlyNotice: "Only the GM can use that calendar command."
  };
  var STYLES = {
    wrap: "display:inline-block;vertical-align:top;margin:4px;overflow:visible;",
    table: "border-collapse:collapse;margin:4px;margin-bottom:14px;",
    th: "border:1px solid #444;padding:2px;width:2em;text-align:center;",
    head: "border:1px solid #444;padding:0;",
    td: "border:1px solid #444;width:2em;height:2em;text-align:center;vertical-align:middle;",
    calTd: "border:1px solid #444;width:2em;padding:0;text-align:center;vertical-align:middle;",
    calCellInner: "min-height:2.35em;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;padding:1px 0 2px;box-sizing:border-box;",
    monthHeaderBase: "padding:6px;text-align:left;",
    gmbuttonWrap: "display:inline-block;margin:2px 4px 2px 0;",
    today: "position:relative;z-index:10;border-radius:2px;box-shadow:0 3px 8px rgba(0,0,0,.65),0 12px 24px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.18);outline:2px solid rgba(0,0,0,.35);outline-offset:1px;box-sizing:border-box;overflow:visible;font-weight:bold;font-size:1.2em;",
    past: "opacity:0.65;",
    future: "opacity:0.95;"
  };
  var PALETTE = [
    "#E53935",
    "#EF5350",
    "#FF7043",
    "#F4511E",
    "#FFB300",
    "#F6BF26",
    "#FDD835",
    "#C0CA33",
    "#7CB342",
    "#66BB6A",
    "#43A047",
    "#228B22",
    "#26A69A",
    "#00897B",
    "#00ACC1",
    "#29B6F6",
    "#039BE5",
    "#1E88E5",
    "#3949AB",
    "#0D47A1",
    "#5E35B1",
    "#7E57C2",
    "#8E24AA",
    "#AB47BC",
    "#D81B60",
    "#EC407A",
    "#6D4C41",
    "#8D6E63",
    "#795548",
    "#5D4037",
    "#607D8B",
    "#78909C"
  ];

  // src/date-math.ts
  function _isLeapMonth(m, y) {
    if (_isGregorianLeapSlotMonthObj(m)) return _isGregorianLeapYear(y);
    return !!(m.leapEvery && y % m.leapEvery === 0);
  }
  function _isGregorianLeapYear(y) {
    y = parseInt(y, 10) || 0;
    return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  }
  function _isGregorianLeapSlotMonthObj(m) {
    return !!(ensureSettings().calendarSystem === "gregorian" && m && m.isIntercalary && String(m.name || "") === "Leap Day");
  }
  function _isGregorianLeapSlotIndex(mi) {
    var months = getCal().months;
    return _isGregorianLeapSlotMonthObj(months[mi]);
  }
  var _serialCache = { baseDpy: null, hasLeap: null, avgDpy: null };
  function _invalidateSerialCache() {
    _serialCache.baseDpy = null;
    _serialCache.hasLeap = null;
    _serialCache.avgDpy = null;
  }
  function _buildSerialCache() {
    var months = getCal().months;
    var base = 0, leapFrac = 0, hasLeap = false;
    for (var i = 0; i < months.length; i++) {
      var m = months[i];
      if (m.leapEvery) {
        hasLeap = true;
        leapFrac += (m.days | 0) / m.leapEvery;
      } else {
        base += m.days | 0;
      }
    }
    _serialCache.baseDpy = base;
    _serialCache.hasLeap = hasLeap;
    _serialCache.avgDpy = base + leapFrac;
  }
  function _leapsBefore(y, every) {
    if (y <= 0 || !every) return 0;
    return Math.floor((y - 1) / every) + 1;
  }
  function _daysBeforeYear(y) {
    if (_serialCache.baseDpy === null) _buildSerialCache();
    var months = getCal().months;
    var total = y * _serialCache.baseDpy;
    if (_serialCache.hasLeap) {
      for (var i = 0; i < months.length; i++) {
        var m = months[i];
        if (m.leapEvery) total += _leapsBefore(y, m.leapEvery) * (m.days | 0);
      }
    }
    return total;
  }
  function _daysBeforeMonthInYear(y, mi) {
    var months = getCal().months;
    var total = 0;
    for (var i = 0; i < mi; i++) {
      var m = months[i];
      if (m.leapEvery) {
        if (_isLeapMonth(m, y)) total += m.days | 0;
      } else {
        total += m.days | 0;
      }
    }
    return total;
  }
  function daysPerYear() {
    if (_serialCache.baseDpy === null) _buildSerialCache();
    if (!_serialCache.hasLeap) return _serialCache.baseDpy;
    var cal = getCal();
    var y = cal && cal.current ? cal.current.year : 0;
    var months = cal.months;
    var total = _serialCache.baseDpy;
    for (var i = 0; i < months.length; i++) {
      if (months[i].leapEvery && _isLeapMonth(months[i], y)) total += months[i].days | 0;
    }
    return total;
  }
  function toSerial(y, mi, d) {
    return _daysBeforeYear(y) + _daysBeforeMonthInYear(y, mi) + ((parseInt(d, 10) || 1) - 1);
  }
  function weekdayIndex(y, mi, d) {
    var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length;
    var st = ensureSettings();
    var mobj = cal.months[mi] || {};
    if (st.calendarSystem === "faerunian" && !mobj.isIntercalary) {
      return (((parseInt(d, 10) || 1) - 1) % wdlen + wdlen) % wdlen;
    }
    if (st.calendarSystem === "faerunian" && mobj.isIntercalary) {
      return 0;
    }
    var delta = toSerial(y, mi, d) - toSerial(cur.year, cur.month, cur.day_of_the_month);
    return (cur.day_of_the_week + (delta % wdlen + wdlen)) % wdlen;
  }
  function weekStartSerial(y, mi, d) {
    var st = ensureSettings();
    var mobj = (getCal().months || [])[mi] || {};
    if (st.calendarSystem === "faerunian" && !mobj.isIntercalary) {
      return toSerial(y, mi, d) - (((parseInt(d, 10) || 1) - 1) % weekLength() + weekLength()) % weekLength();
    }
    if (st.calendarSystem === "faerunian" && mobj.isIntercalary) {
      return toSerial(y, mi, 1);
    }
    var wd = weekdayIndex(y, mi, d);
    return toSerial(y, mi, d) - wd;
  }
  function fromSerial(s) {
    if (_serialCache.baseDpy === null) _buildSerialCache();
    var months = getCal().months;
    if (!_serialCache.hasLeap) {
      var dpy = _serialCache.baseDpy;
      var y = Math.floor(s / dpy);
      var rem = s - y * dpy;
      var mi = 0;
      while (mi < months.length - 1 && rem >= (months[mi].days | 0)) {
        rem -= months[mi].days | 0;
        mi++;
      }
      rem = Math.min(rem, (months[mi].days | 0) - 1);
      return { year: y, mi, day: (rem | 0) + 1 };
    }
    var yEst = Math.max(0, Math.floor(s / _serialCache.avgDpy) - 1);
    while (_daysBeforeYear(yEst + 1) <= s) yEst++;
    var y = yEst;
    var rem = s - _daysBeforeYear(y);
    var mi = 0;
    while (mi < months.length) {
      var m = months[mi];
      if (m.leapEvery && !_isLeapMonth(m, y)) {
        mi++;
        continue;
      }
      var mdays = m.days | 0;
      if (rem < mdays) break;
      rem -= mdays;
      mi++;
    }
    if (mi >= months.length) mi = months.length - 1;
    while (mi < months.length && months[mi].leapEvery && !_isLeapMonth(months[mi], y)) mi++;
    if (mi >= months.length) mi = months.length - 1;
    var maxDay = months[mi].days | 0;
    rem = Math.min(rem, maxDay - 1);
    return { year: y, mi, day: (rem | 0) + 1 };
  }
  function todaySerial() {
    var c = getCal().current;
    return toSerial(c.year, c.month, c.day_of_the_month);
  }
  function _nextActiveMi(mi, y) {
    var months = getCal().months;
    var len = months.length;
    var nmi = (mi + 1) % len;
    var ny = y + (nmi === 0 ? 1 : 0);
    var safety = 0;
    while (safety++ < len) {
      if (_isGregorianLeapSlotIndex(nmi)) {
        nmi = (nmi + 1) % len;
        if (nmi === 0) ny++;
        continue;
      }
      if (!months[nmi].leapEvery || _isLeapMonth(months[nmi], ny)) return { mi: nmi, y: ny };
      nmi = (nmi + 1) % len;
      if (nmi === 0) ny++;
    }
    return { mi: (mi + 1) % len, y: ny };
  }
  function _prevActiveMi(mi, y) {
    var months = getCal().months;
    var len = months.length;
    var pmi = (mi + len - 1) % len;
    var py = y - (mi === 0 ? 1 : 0);
    var safety = 0;
    while (safety++ < len) {
      if (_isGregorianLeapSlotIndex(pmi)) {
        pmi = (pmi - 1 + len) % len;
        if (pmi === len - 1) py--;
        continue;
      }
      if (!months[pmi].leapEvery || _isLeapMonth(months[pmi], py)) return { mi: pmi, y: py };
      pmi = (pmi + len - 1) % len;
      if (pmi === len - 1) py--;
    }
    return { mi: (mi + len - 1) % len, y: py };
  }

  // src/messaging.ts
  function cleanWho(who) {
    return String(who || "").replace(/\s+\(GM\)$/, "").replace(/["\\]/g, "").trim();
  }
  function send(opts, html) {
    opts = opts || {};
    var to = cleanWho(opts.to);
    var prefix;
    if (opts.broadcast) prefix = "/direct ";
    else if (opts.gmOnly) prefix = "/w gm ";
    else if (to) prefix = '/w "' + to + '" ';
    else prefix = "/direct ";
    sendChat(script_name, prefix + html);
  }
  function sendToAll(html) {
    send({ broadcast: true }, html);
  }
  function sendToGM(html) {
    send({ gmOnly: true }, html);
  }
  function whisper(to, html) {
    send({ to }, html);
  }
  function warnGM(msg) {
    sendChat(script_name, "/w gm " + msg);
  }

  // src/planes.ts
  var PLANE_DATA = {
    eberron: [
      {
        name: "Daanvi",
        title: "The Perfect Order",
        type: "cyclic",
        orbitYears: 400,
        coterminousDays: null,
        remoteDays: null,
        coterminousYears: 100,
        remoteYears: 100,
        anchorYear: 800,
        anchorPhase: "coterminous",
        seedAnchor: true,
        associatedMoon: "Nymm",
        note: "Traditional cycle: coterminous for a century, then remote for a century one hundred years later.",
        effects: {
          coterminous: "No obvious effects. Some sages link rise of civilizations to Daanvi coterminous periods. May impact eldritch machine rituals.",
          remote: "No obvious effects. Century-long remote period."
        }
      },
      {
        name: "Dal Quor",
        title: "The Region of Dreams",
        type: "fixed",
        fixedPhase: "remote",
        associatedMoon: "Crya",
        note: "Knocked off orbit ~40,000 years ago during the Quori invasion of Xen'drik. Permanently remote. Crya (the 13th moon) believed destroyed.",
        effects: { remote: "Only reachable via dreaming. Plane shift cannot reach Dal Quor. No manifest zones exist naturally." }
      },
      {
        name: "Dolurrh",
        title: "The Realm of the Dead",
        type: "cyclic",
        orbitYears: 100,
        coterminousDays: null,
        remoteDays: null,
        coterminousYears: 1,
        remoteYears: 1,
        anchorYear: 950,
        anchorPhase: "coterminous",
        seedAnchor: true,
        associatedMoon: "Aryth",
        note: "Slow canonical cycle: coterminous for 1 year once per century; 50 years later, remote for 1 year. Shorter off-cycle shifts are tied to Aryth full/new moons through the moontied generator.",
        effects: {
          coterminous: "Ghosts more easily slip into the Material Plane, especially near Dolurrhi manifest zones. Raise-dead effects can draw unwanted spirits (Dolurrhi mishaps).",
          remote: "Traditional resurrection magic cannot pull spirits back from Dolurrh. Recovering the dead requires retrieving the shade in Dolurrh; deaths with intense emotion or unfinished business more often leave ghosts behind."
        }
      },
      {
        name: "Fernia",
        title: "The Sea of Fire",
        type: "cyclic",
        orbitYears: 5,
        coterminousDays: 28,
        remoteDays: 28,
        coterminousYears: null,
        remoteYears: null,
        anchorYear: 998,
        anchorPhase: "coterminous",
        anchorMonth: 7,
        seedAnchor: true,
        seasonHint: "midsummer",
        associatedMoon: "Eyre",
        note: "Traditional cycle: coterminous during Lharvion once every five years; remote during Zarantyr once every five years, exactly 2.5 years later.",
        effects: {
          coterminous: "Temperatures rise sharply. Safer warm regions can become extremely hot, taking on Deadly Heat, Empowered Fire, and Burning Bright traits. Rarely, creatures caught in exceptionally intense flame are pulled into Fernia.",
          remote: "Intense heat loses some of its bite. Creatures have advantage on saves against extreme heat and on saves against spells that deal fire damage."
        }
      },
      {
        name: "Irian",
        title: "The Eternal Dawn",
        type: "cyclic",
        orbitYears: 3,
        coterminousDays: 10,
        remoteDays: 10,
        coterminousYears: null,
        remoteYears: null,
        anchorYear: 998,
        anchorPhase: "coterminous",
        anchorMonth: 4,
        anchorDay: 1,
        seedAnchor: true,
        floatingStartDay: { min: 1, max: 19 },
        seasonHint: "spring",
        associatedMoon: "Barrakas",
        note: "Coterminous for 10 days in Eyre and remote for 10 days in Sypheros, once every 3 years. The remote cycle comes 1.5 years after coterminous. The start day within the month varies between occurrences.",
        effects: {
          coterminous: "Life blossoms. Health and fertility are enhanced, positive energy flows freely, and Radiant Power applies across Eberron. All creatures have advantage on saves against disease, poison, and fear.",
          remote: "Colors seem to fade and psychic numbness pervades the world. All creatures have disadvantage on saves against fear and resistance to radiant damage. Hit point restoration is halved, except long rests still restore full hit points."
        }
      },
      {
        name: "Kythri",
        title: "The Churning Chaos",
        type: "fixed",
        fixedPhase: "waning",
        associatedMoon: "Zarantyr",
        note: "Kythri's coterminous and remote phases are completely unpredictable, lasting from days to centuries. Proximity has no discernible global effects on the Material Plane.",
        effects: {
          coterminous: "No discernible global effects on the Material Plane.",
          remote: "No discernible global effects on the Material Plane."
        }
      },
      {
        name: "Lamannia",
        title: "The Twilight Forest",
        type: "cyclic",
        orbitYears: 1,
        coterminousDays: 7,
        remoteDays: 7,
        coterminousYears: null,
        remoteYears: null,
        anchorYear: 998,
        anchorPhase: "coterminous",
        anchorMonth: 6,
        anchorDay: 24,
        seasonHint: "summer solstice",
        associatedMoon: "Olarune",
        note: "Coterminous for a week centered on the summer solstice (Nymm 24\u2013Lharvion 2) and remote for a week centered on the winter solstice (Vult 24\u2013Zarantyr 2). Both occur every year.",
        effects: {
          coterminous: "Lamannian manifest zone effects are enhanced. In unspoiled nature, fertility of plants and animals rises and beasts conceived in this period are often exceptionally strong and healthy. Spells targeting beasts or elementals with duration 1 minute or longer are doubled; durations of 24 hours or longer are unaffected.",
          remote: "Fertility rates drop and beasts born in this period are often weak or sickly; animals are uneasy. Spells affecting beasts or elementals have their duration halved, to a minimum of 1 round."
        }
      },
      {
        name: "Mabar",
        title: "The Endless Night",
        type: "cyclic",
        orbitYears: 1,
        coterminousDays: 4,
        remoteDays: 0,
        coterminousYears: null,
        remoteYears: null,
        anchorYear: 998,
        anchorPhase: "coterminous",
        anchorMonth: 12,
        anchorDay: 26,
        seedAnchor: true,
        seasonHint: "winter solstice",
        associatedMoon: "Sypheros",
        remoteOrbitYears: 5,
        remoteDaysSpecial: 5,
        remoteSeasonHint: "summer solstice",
        note: "Long Shadows: coterminous for 3 nights each year \u2014 begins at sundown on Vult 26, ends at sunrise on Zarantyr 1 (4 calendar days, 3 nights centered on winter solstice). Remote for 5 days around the summer solstice (begins sunrise Nymm 25, ends sunset Lharvion 1), once every 5 years.",
        effects: {
          coterminous: "Necrotic Power encompasses the world and all light source radii are halved. In regions steeped in despair or misery, deep darkness can open gateways to Mabar, releasing shadows and other horrors. This manifests only at night and ends at dawn.",
          remote: "All creatures gain resistance to necrotic damage. Undead have disadvantage on saves vs being turned or frightened."
        }
      },
      {
        name: "Risia",
        title: "The Plain of Ice",
        type: "cyclic",
        orbitYears: 5,
        coterminousDays: 28,
        remoteDays: 28,
        coterminousYears: null,
        remoteYears: null,
        anchorYear: 996,
        anchorPhase: "coterminous",
        anchorMonth: 1,
        seedAnchor: true,
        linkedTo: "Fernia",
        seasonHint: "midwinter",
        associatedMoon: "Dravago",
        note: "Exactly opposite Fernia on the same 5-year cycle. Coterminous in midwinter (Zarantyr), remote in midsummer (Lharvion). Risia is coterminous when Fernia is remote and vice versa.",
        effects: {
          coterminous: "Temperatures drop sharply. Areas that are normally merely chilly can take on Lethal Cold, Empowered Ice, and Stillness of Flesh properties. Rarely, creatures caught in exceptionally intense cold can be transported to Risia.",
          remote: "Intense cold loses some of its bite. Creatures have advantage on saves against extreme cold and on saves against spells that deal cold damage."
        }
      },
      {
        name: "Shavarath",
        title: "The Eternal Battleground",
        type: "cyclic",
        orbitYears: 36,
        coterminousDays: null,
        remoteDays: null,
        coterminousYears: 1,
        remoteYears: 1,
        anchorYear: 990,
        anchorPhase: "coterminous",
        seedAnchor: true,
        associatedMoon: "Vult",
        note: "Traditional cycle: coterminous for 1 year every 36 years and remote for 1 year every 36 years. It also frequently has single-day coterminous spikes; remote periods suppress these spikes.",
        effects: {
          coterminous: "People are quick to anger: trivial disputes can become brawls, and restless thought can lead to riots or revolution. War Magic and Unquenchable Fury spread worldwide; intense violence in Shavaran manifest zones can draw in whirling blades.",
          remote: "Prevents the occasional single-day coterminous spikes; otherwise has no apparent effect on the Material Plane."
        }
      },
      {
        name: "Syrania",
        title: "The Azure Sky",
        type: "cyclic",
        orbitYears: 10,
        coterminousDays: 1,
        remoteDays: 1,
        coterminousYears: null,
        remoteYears: null,
        anchorYear: 998,
        anchorPhase: "coterminous",
        anchorMonth: 9,
        anchorDay: 9,
        seedAnchor: true,
        associatedMoon: "Therendor",
        note: "Traditionally coterminous on 9 Rhaan once every 10 years and remote on the same day 5 years later. This is celebrated as Boldrei\u2019s Feast, with especially grand celebrations on coterminous years.",
        effects: {
          coterminous: "Goodwill spreads worldwide. Absolute Peace and Gentle Thoughts apply across Eberron; creatures harmed (or witnessing allies harmed) ignore Absolute Peace for 1 minute. Skies are clear and weather calm.",
          remote: "Skies are gray and the sun is hidden. People feel quarrelsome: creatures have disadvantage on Charisma (Persuasion) checks and advantage on Charisma (Intimidation) checks. Outside Syranian manifest zones, flying speeds are reduced by 10 feet (minimum 5 feet)."
        }
      },
      {
        name: "Thelanis",
        title: "The Faerie Court",
        type: "cyclic",
        orbitYears: 225,
        coterminousDays: null,
        remoteDays: null,
        coterminousYears: 7,
        remoteYears: 7,
        anchorYear: 800,
        anchorPhase: "coterminous",
        seedAnchor: true,
        associatedMoon: "Rhaan",
        note: "Traditional cycle: coterminous for 7 years every 225 years, remote for 7 years halfway between. Evidence suggests this cycle has been disrupted (possibly by the Mourning), and no one knows when Thelanis will next become coterminous or how long it will last.",
        effects: {
          coterminous: "New gateway zones spring up, and mischievous or cruel fey may cross over. It is easier for careless travelers to cross into Thelanis, but usually only after breaking a superstition or taboo; warnings are often present.",
          remote: "Effects of Thelanian manifest zones are suppressed. Fey creatures, even ones that usually dwell on Eberron, may be temporarily drawn back to Thelanis. The world feels less magical."
        }
      },
      {
        name: "Xoriat",
        title: "The Realm of Madness",
        type: "fixed",
        fixedPhase: "remote",
        associatedMoon: "Lharvion",
        note: "The Gatekeeper seals that bind the daelkyr in Khyber also keep Xoriat from becoming coterminous. Remote phases are unpredictable and usually much slower than Kythri\u2019s. No citizens of the Five Nations are known to have visited Xoriat.",
        effects: { remote: "Xoriat\u2019s remote phases have no known global effect on the Material Plane." }
      }
    ]
  };
  function getPlanesState() {
    var root = state[state_name];
    var baselineHorizon = _planarYearDays();
    if (!root.planes) root.planes = {
      overrides: {},
      // planeName -> { phase:'coterminous'|'waning'|'remote'|'waxing', note:'' }
      anchors: {},
      // planeName -> { year, month, day, phase } — GM-set anchor overrides
      revealTier: "medium",
      // 'low' | 'medium' | 'high'
      revealHorizonDays: baselineHorizon
      // player-known horizon window
    };
    var ps = root.planes;
    if (!ps.overrides) ps.overrides = {};
    if (!ps.anchors) ps.anchors = {};
    if (!ps.floatingDays) ps.floatingDays = {};
    if (!ps.suppressedEvents) ps.suppressedEvents = {};
    if (!ps.gmCustomEvents) ps.gmCustomEvents = {};
    if (!ps.seedOverrides) ps.seedOverrides = {};
    if (!ps.revealTier) ps.revealTier = "medium";
    ps.revealTier = String(ps.revealTier || "").toLowerCase();
    if (!PLANE_REVEAL_TIERS[ps.revealTier]) ps.revealTier = "medium";
    ps.revealHorizonDays = parseInt(ps.revealHorizonDays, 10);
    if (!isFinite(ps.revealHorizonDays) || ps.revealHorizonDays < baselineHorizon) ps.revealHorizonDays = baselineHorizon;
    return ps;
  }
  function _getPlaneData(name) {
    var st = ensureSettings();
    var planes = PLANE_DATA[st.calendarSystem] || PLANE_DATA.eberron;
    if (!planes) return null;
    var lc = name.toLowerCase();
    for (var i = 0; i < planes.length; i++) {
      if (planes[i].name.toLowerCase() === lc) return planes[i];
    }
    return null;
  }
  function _getAllPlaneData() {
    var st = ensureSettings();
    return PLANE_DATA[st.calendarSystem] || PLANE_DATA.eberron || [];
  }
  function _planarYearDays() {
    return getCal().months.reduce(function(s, m) {
      return s + (m.days | 0);
    }, 0);
  }
  function _planeHasNonAnnualTraditionalCycle(plane) {
    if (!plane || plane.type !== "cyclic") return false;
    var orbitYears = parseInt(plane.orbitYears, 10) || 1;
    var remoteOrbitYears = parseInt(plane.remoteOrbitYears, 10) || 0;
    return orbitYears > 1 || remoteOrbitYears > 1;
  }
  function _planeTraditionalAnchorMode(plane, ps) {
    if (!_planeHasNonAnnualTraditionalCycle(plane)) return null;
    ps = ps || getPlanesState();
    var hasDirectAnchor = !!(ps.anchors && ps.anchors[plane.name]);
    var hasSeedAnchor = !!(plane.seedAnchor && ps.seedOverrides && ps.seedOverrides[plane.name] != null);
    return hasDirectAnchor || hasSeedAnchor ? "gm-anchored" : "random-seed";
  }
  function getPlanarState(planeName, serial, opts) {
    opts = opts || {};
    var ignoreGenerated = !!opts.ignoreGenerated;
    var plane = _getPlaneData(planeName);
    if (!plane) return null;
    var ps = getPlanesState();
    var override = ps.overrides[plane.name];
    if (override) {
      if (override.durationDays && override.setOn != null) {
        var today = todaySerial();
        if (today >= override.setOn + override.durationDays) {
          delete ps.overrides[plane.name];
          override = null;
        }
      }
    }
    if (override) {
      return {
        plane,
        phase: override.phase || "waning",
        daysIntoPhase: null,
        daysUntilNextPhase: override.durationDays ? Math.max(0, override.setOn + override.durationDays - todaySerial()) : null,
        phaseDuration: override.durationDays || null,
        nextPhase: null,
        overridden: true,
        sourceLabel: "gm-defined",
        traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
      };
    }
    if (plane.type === "fixed") {
      var fixedPhase = plane.fixedPhase || "remote";
      var fixedNote = plane.note || "";
      var fixedIsGenerated = false;
      if (!ignoreGenerated && isGeneratedShift(plane.name, serial)) {
        fixedIsGenerated = true;
        fixedPhase = _generatedPhase(plane.name, serial);
        fixedNote = "Generated " + fixedPhase + " shift";
      }
      return {
        plane,
        phase: fixedPhase,
        daysIntoPhase: null,
        daysUntilNextPhase: null,
        phaseDuration: null,
        nextPhase: null,
        overridden: false,
        note: fixedNote,
        sourceLabel: fixedIsGenerated ? "generated" : "traditional",
        traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
      };
    }
    var ypd = _planarYearDays();
    var coterminousDays = plane.coterminousDays || (plane.coterminousYears || 0) * ypd;
    var remoteDays = plane.remoteDays || (plane.remoteYears || 0) * ypd;
    var orbitDays = (plane.orbitYears || 1) * ypd;
    var transitionDays = (orbitDays - coterminousDays - remoteDays) / 2;
    if (transitionDays < 1) transitionDays = 1;
    var phases = [
      { name: "coterminous", dur: coterminousDays },
      { name: "waning", dur: transitionDays },
      { name: "remote", dur: remoteDays },
      { name: "waxing", dur: transitionDays }
    ];
    var anchor = ps.anchors[plane.name];
    var anchorSerial;
    if (anchor) {
      anchorSerial = toSerial(anchor.year, anchor.month || 0, anchor.day || 1);
    } else {
      var anchorMi = plane.anchorMonth != null ? plane.anchorMonth - 1 : 0;
      var anchorDay = plane.anchorDay != null ? plane.anchorDay | 0 : 1;
      if (anchorDay < 1) anchorDay = 1;
      anchorSerial = toSerial(plane.anchorYear || 998, anchorMi, anchorDay);
      if (plane.seedAnchor) {
        try {
          var ps2 = getPlanesState();
          var seedOverride = ps2.seedOverrides && ps2.seedOverrides[plane.name];
          if (seedOverride != null) {
            anchorSerial = toSerial(seedOverride, anchorMi, anchorDay);
          } else {
            var epoch = ensureSettings().epochSeed || 0;
            var seedName = plane.linkedTo || plane.name;
            if (plane.anchorMonth != null) {
              var yearOff = _dN(epoch, seedName + "_anchor_offset", plane.orbitYears || 1) - 1;
              anchorSerial += yearOff * ypd;
            } else {
              var seedOffset = _dN(epoch, seedName + "_anchor_offset", orbitDays);
              anchorSerial += seedOffset;
            }
          }
        } catch (e) {
        }
      }
    }
    var anchorPhaseIdx = 0;
    var anchorPhaseName = anchor && anchor.phase || plane.anchorPhase || "coterminous";
    for (var p = 0; p < phases.length; p++) {
      if (phases[p].name === anchorPhaseName) {
        anchorPhaseIdx = p;
        break;
      }
    }
    var daysSinceAnchor = serial - anchorSerial;
    var totalCycle = orbitDays;
    var offset = daysSinceAnchor % totalCycle;
    if (offset < 0) offset += totalCycle;
    var accumulated = 0;
    for (var pi = 0; pi < phases.length; pi++) {
      var idx = (anchorPhaseIdx + pi) % phases.length;
      var ph = phases[idx];
      if (offset < accumulated + ph.dur) {
        var into = offset - accumulated;
        var nextIdx = (idx + 1) % phases.length;
        var cyclicPhase = ph.name;
        var cyclicNote = "";
        if (!ignoreGenerated && (cyclicPhase === "waning" || cyclicPhase === "waxing") && isGeneratedShift(plane.name, serial)) {
          var genPhase = _generatedPhase(plane.name, serial);
          cyclicNote = "Generated " + genPhase + " shift";
          cyclicPhase = genPhase;
        }
        if (plane.remoteOrbitYears && plane.remoteDaysSpecial) {
          var remoteDur = plane.remoteDaysSpecial;
          var _solstice = 5 * 28 + 26;
          var _di = fromSerial(serial);
          var _yearStart = toSerial(_di.year, 0, 1);
          var _dayOfYear = serial - _yearStart;
          var _remoteBaseYear = (plane.anchorYear || 998) + 1;
          if (plane.seedAnchor) {
            try {
              var _seedOverrideYear = ps.seedOverrides && ps.seedOverrides[plane.name];
              if (_seedOverrideYear != null) {
                _remoteBaseYear = (parseInt(_seedOverrideYear, 10) || (plane.anchorYear || 998)) + 1;
              } else {
                var _ep = ensureSettings().epochSeed || 0;
                var _sn = plane.linkedTo || plane.name;
                var _rOff = _dN(_ep, _sn + "_remote_anchor_offset", plane.remoteOrbitYears) - 1;
                _remoteBaseYear += _rOff;
              }
            } catch (e2) {
            }
          }
          var _remoteYearsSince = _di.year - _remoteBaseYear;
          var _isRemoteYear = _remoteYearsSince >= 0 && _remoteYearsSince % plane.remoteOrbitYears === 0;
          var _remoteStart = _solstice - Math.floor(remoteDur / 2);
          var _remoteEnd = _remoteStart + remoteDur - 1;
          if (cyclicPhase !== "coterminous" && _isRemoteYear && _dayOfYear >= _remoteStart && _dayOfYear <= _remoteEnd) {
            return {
              plane,
              phase: "remote",
              daysIntoPhase: _dayOfYear - _remoteStart,
              daysUntilNextPhase: _remoteEnd - _dayOfYear + 1,
              phaseDuration: remoteDur,
              nextPhase: "waxing",
              overridden: false,
              sourceLabel: "traditional",
              traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
            };
          }
          if (cyclicPhase === "waning" || cyclicPhase === "waxing") {
            if (_isRemoteYear && _dayOfYear < _remoteStart) {
              cyclicPhase = "waning";
            } else {
              cyclicPhase = "waxing";
            }
          }
        }
        if (plane.floatingStartDay && !anchor) {
          var _fMin = plane.floatingStartDay.min || 1;
          var _fMax = plane.floatingStartDay.max || 19;
          var _fRange = _fMax - _fMin + 1;
          var _daysSinceAnch = serial - anchorSerial;
          var _orbitNum = Math.floor(_daysSinceAnch / orbitDays);
          if (_daysSinceAnch < 0) _orbitNum -= 1;
          var _fKey = plane.name;
          if (!ps.floatingDays[_fKey]) ps.floatingDays[_fKey] = {};
          var _fd = ps.floatingDays[_fKey];
          var _cotKey = "cot_" + _orbitNum;
          var _remKey = "rem_" + _orbitNum;
          try {
            var _fEp = ensureSettings().epochSeed || 0;
            if (_fd[_cotKey] == null) {
              var _roll = _dN(_fEp, plane.name + "_float_cot_" + _orbitNum, 20);
              if (_roll >= 20) _roll = _dN(_fEp, plane.name + "_float_cot_" + _orbitNum + "_reroll", 19);
              _fd[_cotKey] = _fMin + (_roll - 1) % _fRange;
            }
            if (_fd[_remKey] == null) {
              var _rRoll = _dN(_fEp, plane.name + "_float_rem_" + _orbitNum, 20);
              if (_rRoll >= 20) _rRoll = _dN(_fEp, plane.name + "_float_rem_" + _orbitNum + "_reroll", 19);
              _fd[_remKey] = _fMin + (_rRoll - 1) % _fRange;
            }
          } catch (e3) {
          }
          var _baseDay = plane.anchorDay != null ? plane.anchorDay : 1;
          var _cotDrift = (_fd[_cotKey] || _baseDay) - _baseDay;
          var _remDrift = (_fd[_remKey] || _baseDay) - _baseDay;
          var _halfOrbit = orbitDays / 2;
          var _offsetInOrbit = _daysSinceAnch - _orbitNum * orbitDays;
          if (_offsetInOrbit < 0) _offsetInOrbit += orbitDays;
          if (_offsetInOrbit < _halfOrbit) {
            var _cotStart = _cotDrift;
            if (_cotStart < 0) _cotStart = 0;
            var _cotEnd = _cotStart + coterminousDays;
            if (_offsetInOrbit >= _cotStart && _offsetInOrbit < _cotEnd) {
              cyclicPhase = "coterminous";
              into = _offsetInOrbit - _cotStart;
            } else if (_offsetInOrbit < _cotStart) {
              cyclicPhase = "waxing";
              into = _offsetInOrbit;
            } else {
              cyclicPhase = "waning";
              into = _offsetInOrbit - _cotEnd;
            }
          } else {
            var _remStart = _halfOrbit + _remDrift;
            var _remEnd = _remStart + remoteDays;
            if (_offsetInOrbit >= _remStart && _offsetInOrbit < _remEnd) {
              cyclicPhase = "remote";
              into = _offsetInOrbit - _remStart;
            } else if (_offsetInOrbit < _remStart) {
              cyclicPhase = "waning";
              into = _offsetInOrbit - _halfOrbit;
            } else {
              cyclicPhase = "waxing";
              into = _offsetInOrbit - _remEnd;
            }
          }
        }
        return {
          plane,
          phase: cyclicPhase,
          daysIntoPhase: Math.floor(into),
          daysUntilNextPhase: Math.ceil(ph.dur - into),
          phaseDuration: Math.floor(ph.dur),
          nextPhase: phases[nextIdx].name,
          overridden: false,
          sourceLabel: _isGeneratedNote(cyclicNote) ? "generated" : "traditional",
          traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
        };
      }
      accumulated += ph.dur;
    }
    return {
      plane,
      phase: "waning",
      daysIntoPhase: 0,
      daysUntilNextPhase: 0,
      phaseDuration: 0,
      nextPhase: "remote",
      overridden: false,
      sourceLabel: "traditional",
      traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
    };
  }
  function getActivePlanarEffects(serial) {
    var planes = _getAllPlaneData();
    var effects = [];
    for (var i = 0; i < planes.length; i++) {
      var ps = getPlanarState(planes[i].name, serial);
      if (!ps) continue;
      if (ps.phase === "coterminous" || ps.phase === "remote") {
        var eff = ps.plane.effects && ps.plane.effects[ps.phase] || null;
        effects.push({
          plane: ps.plane.name,
          title: ps.plane.title,
          phase: ps.phase,
          effect: eff,
          state: ps
        });
      }
    }
    return effects;
  }
  function _planarNotableToday(serial) {
    var planes = _getAllPlaneData();
    var notes = [];
    var ypd = _planarYearDays();
    for (var i = 0; i < planes.length; i++) {
      if (planes[i].type === "fixed") continue;
      var ps = getPlanarState(planes[i].name, serial);
      if (!ps) continue;
      if (ps.phaseDuration != null && ps.phaseDuration > ypd) continue;
      var name = ps.plane.name;
      if (ps.phase === "coterminous") {
        var remaining = ps.daysUntilNextPhase;
        var tag = remaining != null && remaining <= 3 ? ' <span style="opacity:.6;">(' + remaining + "d left)</span>" : "";
        notes.push("\u{1F534} <b>" + esc(name) + "</b> coterminous" + tag);
      } else if (ps.phase === "remote") {
        var remRem = ps.daysUntilNextPhase;
        var remTag = remRem != null && remRem <= 3 ? ' <span style="opacity:.6;">(' + remRem + "d left)</span>" : "";
        notes.push("\u{1F535} <b>" + esc(name) + "</b> remote" + remTag);
      } else if (ps.phase === "waxing" && ps.daysUntilNextPhase != null && ps.daysUntilNextPhase <= 3) {
        notes.push("\u{1F534} <b>" + esc(name) + "</b> coterminous in " + ps.daysUntilNextPhase + "d");
      } else if (ps.phase === "waning" && ps.daysUntilNextPhase != null && ps.daysUntilNextPhase <= 3) {
        notes.push("\u{1F535} <b>" + esc(name) + "</b> remote in " + ps.daysUntilNextPhase + "d");
      }
    }
    return notes;
  }
  var PLANE_PHASE_EMOJI = {
    coterminous: "\u{1F7E2}",
    waning: "\u{1F7E0}\u2193",
    remote: "\u{1F534}",
    waxing: "\u{1F7E0}\u2191"
  };
  var PLANE_PHASE_LABELS = {
    coterminous: "Coterminous",
    waning: "Waning",
    remote: "Remote",
    waxing: "Waxing"
  };
  var PLANE_REVEAL_TIERS = { low: 1, medium: 2, high: 3 };
  var PLANE_SOURCE_LABELS = {
    low: "Common Knowledge",
    medium: "Skilled Forecast",
    high: "Expert Forecast"
  };
  var PLANE_PREDICTION_LIMITS = {
    // Low: present day only for generated events. Fixed annual canon always known.
    lowDays: 0,
    // Medium: canon events for current year (336 days). Generated events by button.
    mediumCanonDays: 336,
    mediumMaxDays: 3360,
    // up to 10 years for generated
    // High: full knowledge including generated events.
    highMaxDays: 3360,
    // Within this range, high-tier flicker predictions are exact.
    highExactDays: 336
  };
  var PLANE_GENERATED_LOOKAHEAD = {
    gmDays: 1680
    // 5 years at 336 days/year
  };
  var PLANE_MEDIUM_PRESETS = [
    { label: "1d", days: 1, dc: "DC 10" },
    { label: "3d", days: 3, dc: "DC 15" },
    { label: "6d", days: 6, dc: "DC 20" },
    { label: "10d", days: 10, dc: "DC 25" }
  ];
  var PLANE_HIGH_PRESETS = [
    { label: "1m", days: 28, dc: "DC 10" },
    { label: "3m", days: 84, dc: "DC 15" },
    { label: "6m", days: 168, dc: "DC 20" },
    { label: "10m", days: 280, dc: "DC 25" }
  ];
  var PLANE_REVEAL_RANGE_OPTIONS = {
    "1m": 28,
    "3m": 84,
    "6m": 168,
    "10m": 280,
    // Legacy year-based options (converted to days)
    "1y": 336,
    "3y": 1008,
    "6y": 2016,
    "10y": 3360
  };
  function _normalizePlaneRevealTier(tier) {
    var t = String(tier || "").toLowerCase();
    if (PLANE_REVEAL_TIERS[t]) return t;
    return "medium";
  }
  function _parsePlaneRevealRange(token, tier) {
    tier = _normalizePlaneRevealTier(tier);
    var maxAllowed = tier === "high" ? PLANE_PREDICTION_LIMITS.highMaxDays : PLANE_PREDICTION_LIMITS.mediumMaxDays;
    var t = String(token || "").toLowerCase().trim();
    if (!t) return Math.min(maxAllowed, 28);
    if (PLANE_REVEAL_RANGE_OPTIONS[t]) return Math.min(maxAllowed, PLANE_REVEAL_RANGE_OPTIONS[t]);
    var dayMatch = t.match(/^(\d+)d$/);
    if (dayMatch) return Math.min(maxAllowed, parseInt(dayMatch[1], 10));
    var weekMatch = t.match(/^(\d+)w$/);
    if (weekMatch) return Math.min(maxAllowed, parseInt(weekMatch[1], 10) * 7);
    if (/^\d+$/.test(t)) {
      var n = parseInt(t, 10);
      if (isFinite(n) && n >= 1) return Math.min(maxAllowed, n);
    }
    return null;
  }
  function _planeRangeLabel(days) {
    var ypd = Math.max(1, _planarYearDays());
    days = parseInt(days, 10) || 0;
    if (days === ypd) return "1 year";
    if (days === ypd * 3) return "3 years";
    if (days === ypd * 6) return "6 years";
    if (days === ypd * 10) return "10 years";
    if (days % ypd === 0) return days / ypd + " years";
    return _rangeLabel(days);
  }
  function _planePredictionWindowDays(plane, daysAhead, tier) {
    tier = _normalizePlaneRevealTier(tier);
    daysAhead = Math.max(0, daysAhead | 0);
    var base = 0;
    if (plane && plane.type === "fixed") {
      if (plane.name === "Kythri") base += 24;
      else if (plane.name === "Xoriat") base += 36;
      else base += 12;
    }
    var profile = PLANAR_GENERATED_EVENT_PROFILE[plane && plane.name || ""] || PLANAR_GENERATED_EVENT_PROFILE.__default || { triggerDie: 100, confirmDie: 20 };
    var dailyChance = 1 / ((profile.triggerDie || 100) * (profile.confirmDie || 20));
    base += Math.max(1, Math.ceil(dailyChance * 336 * 3));
    if (plane && /disrupted|generated|no one knows|unpredictable/i.test(String(plane.note || ""))) {
      base += tier === "high" ? 3 : 8;
    }
    if (tier === "high") {
      if (daysAhead <= PLANE_PREDICTION_LIMITS.highExactDays) return 0;
      return Math.max(1, base + Math.floor((daysAhead - PLANE_PREDICTION_LIMITS.highExactDays) / 336));
    }
    return Math.max(2, base + Math.floor(daysAhead / 168));
  }
  function _nextCanonicalPhaseStart(planeName, serial, targetPhase, horizonDays) {
    var cap = Math.max(1, horizonDays | 0);
    var prev = getPlanarState(planeName, serial, { ignoreGenerated: true });
    if (!prev) return null;
    for (var s = serial + 1; s <= serial + cap; s++) {
      var cur = getPlanarState(planeName, s, { ignoreGenerated: true });
      if (!cur) {
        prev = cur;
        continue;
      }
      if (cur.phase === targetPhase && prev.phase !== targetPhase) {
        return { serial: s, daysUntil: s - serial, state: cur };
      }
      prev = cur;
    }
    return null;
  }
  function _canonicalPhaseKnowledgeSummary(planeName, serial, horizonDays) {
    var h = Math.max(1, horizonDays | 0);
    var now = getPlanarState(planeName, serial, { ignoreGenerated: true });
    if (!now) return "";
    var c = _nextCanonicalPhaseStart(planeName, serial, "coterminous", h);
    var r = _nextCanonicalPhaseStart(planeName, serial, "remote", h);
    var cTxt = now.phase === "coterminous" ? "now" : c ? "in " + c.daysUntil + "d" : "beyond " + _planeRangeLabel(h);
    var rTxt = now.phase === "remote" ? "now" : r ? "in " + r.daysUntil + "d" : "beyond " + _planeRangeLabel(h);
    return "Cycle: C " + cTxt + " \xB7 R " + rTxt;
  }
  function _planesMiniCalEvents(startSerial, endSerial, includeGenerated) {
    var out = [];
    var planes = _getAllPlaneData();
    if (!planes || !planes.length) return out;
    var start = startSerial | 0;
    var end = endSerial | 0;
    if (end < start) {
      var t = start;
      start = end;
      end = t;
    }
    var prevCanon = {};
    var prevGen = {};
    for (var i = 0; i < planes.length; i++) {
      var pname = planes[i].name;
      prevCanon[pname] = getPlanarState(pname, start - 1, { ignoreGenerated: true });
      if (includeGenerated) {
        var prevActual = getPlanarState(pname, start - 1);
        prevGen[pname] = prevActual ? { phase: prevActual.phase, gen: !!_isGeneratedNote(prevActual.note) } : null;
      }
    }
    for (var ser = start; ser <= end; ser++) {
      for (var j = 0; j < planes.length; j++) {
        var name = planes[j].name;
        var curCanon = getPlanarState(name, ser, { ignoreGenerated: true });
        var prvCanon = prevCanon[name];
        var isTransition = curCanon && prvCanon && curCanon.phase !== prvCanon.phase;
        if (isTransition) {
          var emoji = PLANE_PHASE_EMOJI[curCanon.phase] || "\u26AA";
          var label = PLANE_PHASE_LABELS[curCanon.phase] || curCanon.phase;
          if (curCanon.phase === "coterminous" || curCanon.phase === "remote") {
            out.push({ serial: ser, name: emoji + " " + name + ": " + label + " begins", color: "#80CBC4" });
          } else {
            var endedPhase = PLANE_PHASE_LABELS[prvCanon.phase] || prvCanon.phase;
            out.push({ serial: ser, name: emoji + " " + name + ": " + endedPhase + " ends", color: "#80CBC4" });
          }
        } else if (curCanon && (curCanon.phase === "coterminous" || curCanon.phase === "remote")) {
          var fillEmoji = PLANE_PHASE_EMOJI[curCanon.phase] || "\u26AA";
          var fillLabel = PLANE_PHASE_LABELS[curCanon.phase] || curCanon.phase;
          var fillColor = curCanon.phase === "coterminous" ? "#B2DFDB" : "#FFCDD2";
          out.push({ serial: ser, name: fillEmoji + " " + name + ": " + fillLabel, color: fillColor });
        }
        prevCanon[name] = curCanon;
        if (includeGenerated) {
          var curActual = getPlanarState(name, ser);
          var curIsGen = !!(curActual && _isGeneratedNote(curActual.note));
          var prevEntry = prevGen[name] || { phase: null, gen: false };
          var prevWasGen = !!prevEntry.gen;
          if (curIsGen) {
            var gPhase = curActual.phase || "waning";
            var gEmoji = PLANE_PHASE_EMOJI[gPhase] || "\u{1F7E3}";
            var gLabel = (PLANE_PHASE_LABELS[gPhase] || gPhase).toLowerCase();
            var gColor = gPhase === "coterminous" || gPhase === "remote" ? "#CE93D8" : "#E1BEE7";
            var nextActual = getPlanarState(name, ser + 1);
            var nextIsGen = !!(nextActual && _isGeneratedNote(nextActual.note));
            var nextPhase = nextActual ? nextActual.phase : null;
            var startsHere = !prevWasGen || prevEntry.phase !== gPhase;
            var endsHere = !nextIsGen || nextPhase !== gPhase;
            if (startsHere) {
              out.push({
                serial: ser,
                name: gEmoji + "\u2728 " + name + ": Generated " + gLabel + " begins",
                color: "#BA68C8"
              });
            } else {
              out.push({
                serial: ser,
                name: gEmoji + "\u2728 " + name + ": Generated " + gLabel,
                color: gColor
              });
            }
            if (endsHere) {
              out.push({
                serial: ser,
                name: gEmoji + "\u2728 " + name + ": Generated " + gLabel + " ends",
                color: "#CE93D8"
              });
            }
          }
          prevGen[name] = { phase: curActual ? curActual.phase : null, gen: curIsGen };
        }
      }
    }
    return out;
  }
  function _planesTodaySummaryHtml(today, isGM, viewTier, viewHorizon) {
    var planes = _getAllPlaneData();
    if (!planes || !planes.length) return "";
    var cot = 0, rem = 0, activeGen = 0;
    var next = null;
    var ignGen = !isGM && viewTier === "low";
    for (var i = 0; i < planes.length; i++) {
      var ps = getPlanarState(planes[i].name, today, ignGen ? { ignoreGenerated: true } : null);
      if (!ps) continue;
      if (ps.phase === "coterminous") cot++;
      if (ps.phase === "remote") rem++;
      if (_isGeneratedNote(ps.note)) activeGen++;
      if (ps.daysUntilNextPhase != null && ps.nextPhase) {
        var d = Math.max(0, ps.daysUntilNextPhase | 0);
        if (d <= viewHorizon && (!next || d < next.days)) {
          next = { days: d, plane: ps.plane.name, phase: PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase };
        }
      }
    }
    var bits = ["Coterminous " + cot, "Remote " + rem];
    if (activeGen) bits.push("Generated shifts " + activeGen);
    if (next) bits.push("Next: " + next.plane + " " + next.phase + " in " + next.days + "d");
    return '<div style="font-size:.8em;opacity:.72;margin:2px 0 6px 0;">' + esc(bits.join(" \xB7 ")) + "</div>";
  }
  function planesPanelHtml(isGM, revealTier, serialOverride, revealHorizonDays, generatedHorizonDays) {
    var st = ensureSettings();
    if (st.planesEnabled === false) {
      return _menuBox(
        "\u{1F300} Planes",
        '<div style="opacity:.7;">Planar system is disabled.</div>' + (isGM ? '<div style="margin-top:4px;font-size:.85em;">Enable: <code>!cal settings planes on</code></div>' : "")
      );
    }
    var viewTier = isGM ? "high" : _normalizePlaneRevealTier(revealTier || getPlanesState().revealTier || "medium");
    var viewHorizon = parseInt(revealHorizonDays, 10);
    if (!isFinite(viewHorizon) || viewHorizon < 1) {
      viewHorizon = parseInt(getPlanesState().revealHorizonDays, 10) || _planarYearDays();
    }
    var genHorizon = 0;
    if (isGM) genHorizon = PLANE_GENERATED_LOOKAHEAD.gmDays;
    else if (viewTier === "high") genHorizon = viewHorizon;
    else if (viewTier === "medium") genHorizon = parseInt(generatedHorizonDays, 10) || parseInt(getPlanesState().generatedHorizonDays, 10) || 0;
    var srcLabel = isGM ? "" : PLANE_SOURCE_LABELS[viewTier] || "";
    var planes = _getAllPlaneData();
    var today = isFinite(serialOverride) ? serialOverride | 0 : todaySerial();
    var dateLabel = dateLabelFromSerial(today);
    var displayMode = _normalizeDisplayMode(st.planesDisplayMode);
    var verbose = _subsystemIsVerbose();
    var rows = [];
    var pr = _monthRangeFromSerial(today);
    var planesMiniEvents = _planesMiniCalEvents(pr.start, pr.end, isGM || genHorizon > 0);
    var planesMiniCal = _renderSyntheticMiniCal("Planar Movement", pr.start, pr.end, planesMiniEvents);
    var prevSer = _shiftSerialByMonth(today, -1);
    var nextSer = _shiftSerialByMonth(today, 1);
    var navRow;
    if (isGM) {
      navRow = '<div style="margin:3px 0 6px 0;">' + button("\u25C0 Prev Month", "planes on " + _serialToDateSpec(prevSer)) + " " + button("Next Month \u25B6", "planes on " + _serialToDateSpec(nextSer)) + "</div>";
    } else {
      let _pNavBtn = function(serial, label2) {
        if (serial < knownStart || serial > knownEnd) return '<span style="opacity:.35;">' + esc(label2) + "</span>";
        return button(label2, "planes on " + _serialToDateSpec(serial));
      };
      var knownStart = todaySerial();
      var knownEnd = knownStart + viewHorizon;
      navRow = '<div style="margin:3px 0 6px 0;">' + _pNavBtn(prevSer, "\u25C0 Prev Month") + " " + _pNavBtn(nextSer, "Next Month \u25B6") + "</div>";
    }
    for (var i = 0; i < planes.length; i++) {
      var pIgnGen = !isGM && genHorizon <= 0;
      var ps = getPlanarState(planes[i].name, today, pIgnGen ? { ignoreGenerated: true } : null);
      if (!ps) continue;
      var emoji = PLANE_PHASE_EMOJI[ps.phase] || "\u26AA";
      var label = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
      var name = ps.plane.name;
      var isNotable = ps.phase === "coterminous" || ps.phase === "remote";
      var isFixed = !!(ps.plane.sealed || ps.plane.fixed);
      var overrideTag = ps.overridden ? ' <span style="font-size:.75em;color:#E65100;">[override]</span>' : "";
      var anchorModeTag = "";
      if (isGM && ps.traditionalAnchorMode) {
        anchorModeTag = ' <span style="font-size:.75em;opacity:.5;">[' + (ps.traditionalAnchorMode === "gm-anchored" ? "GM anchored" : "random seed") + "]</span>";
      }
      var hasGenNow = _isGeneratedNote(ps.note);
      var generatedTag = "";
      if (hasGenNow) {
        generatedTag = ' <span style="font-size:.75em;opacity:.55;font-style:italic;">(non-canonical)</span>';
      } else if (!ps.overridden && isGM) {
        var lookahead = PLANE_GENERATED_LOOKAHEAD.gmDays;
        var ff = _nextGeneratedForecast(name, today, lookahead);
        if (ff) {
          var ffLabel = PLANE_PHASE_LABELS[ff.phase] || ff.phase;
          var ffText = ff.activeNow ? ffLabel + " shift active" : "Generated " + ffLabel + " in " + ff.daysUntilStart + "d";
          if (ff.durationDays > 1) ffText += " (~" + ff.durationDays + "d)";
          generatedTag = ' <span style="font-size:.75em;opacity:.45;font-style:italic;">' + esc(ffText) + "</span>";
        }
      } else if (!hasGenNow && !ps.overridden && !isGM && genHorizon > 0) {
        var pLookahead = genHorizon;
        if (pLookahead > 0) {
          var pff = _nextGeneratedForecast(name, today, pLookahead);
          if (pff) {
            var pffLabel = PLANE_PHASE_LABELS[pff.phase] || pff.phase;
            var pffText;
            if (pff.activeNow) {
              pffText = pffLabel + " shift active";
            } else {
              var pffWin = _planePredictionWindowDays(ps.plane, pff.daysUntilStart, "high");
              if (pffWin <= 0) {
                pffText = "Generated " + pffLabel + " in " + pff.daysUntilStart + "d";
              } else {
                var pffLo = Math.max(1, pff.daysUntilStart - pffWin);
                var pffHi = pff.daysUntilStart + pffWin;
                pffText = pffLo === pffHi ? "Generated " + pffLabel + " in ~" + pffLo + "d" : "Generated " + pffLabel + " ~" + pffLo + "\u2013" + pffHi + "d";
              }
            }
            if (pff.durationDays > 1) pffText += " (~" + pff.durationDays + "d)";
            generatedTag = ' <span style="font-size:.75em;opacity:.45;font-style:italic;">' + esc(pffText) + "</span>";
          }
        }
      }
      var nextTag = "";
      if (isGM && ps.daysUntilNextPhase != null && ps.nextPhase) {
        nextTag = ' <span style="opacity:.4;font-size:.8em;">' + esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + " in " + ps.daysUntilNextPhase + "d</span>";
      }
      if (isFixed && !isNotable && !hasGenNow) continue;
      if (!isNotable && !hasGenNow) {
        rows.push(
          '<div style="margin:1px 0;line-height:1.3;font-size:.9em;opacity:.65;">' + emoji + ' <span style="min-width:78px;display:inline-block;">' + esc(name) + "</span> " + esc(label) + overrideTag + anchorModeTag + nextTag + generatedTag + "</div>"
        );
        continue;
      }
      var effectHtml = "";
      if (ps.phase === "coterminous" || ps.phase === "remote") {
        var eff = ps.plane.effects && ps.plane.effects[ps.phase] || "";
        if (eff) {
          effectHtml = '<div style="font-size:.78em;opacity:.55;margin-left:14px;margin-top:1px;">' + esc(eff) + "</div>";
        }
      }
      var noteHtml = "";
      if (ps.note && isGM) {
        noteHtml = '<div style="font-size:.75em;opacity:.45;margin-left:14px;font-style:italic;">' + esc(ps.note) + "</div>";
      }
      var cycleSummaryHtml = "";
      if (!isGM) {
        var cycTxt = _canonicalPhaseKnowledgeSummary(name, today, viewHorizon);
        if (cycTxt) {
          cycleSummaryHtml = '<div style="font-size:.75em;opacity:.45;margin-left:14px;">' + esc(cycTxt) + "</div>";
        }
      }
      rows.push(
        '<div style="margin:3px 0;line-height:1.4;">' + emoji + ' <b style="min-width:82px;display:inline-block;">' + esc(name) + '</b><span style="opacity:.85;">' + esc(label) + "</span>" + overrideTag + anchorModeTag + nextTag + generatedTag + "</div>" + effectHtml + cycleSummaryHtml + noteHtml
      );
    }
    var longShadowsHtml = "";
    try {
      var mabarState = getPlanarState("Mabar", today, !isGM && viewTier !== "high" ? { ignoreGenerated: true } : null);
      if (mabarState && mabarState.phase === "coterminous") {
        var c = getCal().current;
        var lsMoons = getLongShadowsMoons(c.year);
        if (lsMoons.length > 0) {
          var moonNames = [];
          for (var lm = 0; lm < lsMoons.length; lm++) moonNames.push(lsMoons[lm].name);
          longShadowsHtml = '<div style="font-size:.82em;margin-top:4px;padding:4px;background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">\u{1F311} <b>Long Shadows</b> \u2014 Dark moons tonight: <b>' + esc(moonNames.join(", ")) + "</b></div>";
        } else {
          longShadowsHtml = '<div style="font-size:.82em;margin-top:4px;padding:4px;background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">\u{1F311} <b>Long Shadows</b> \u2014 Mabar is coterminous. Darkness reigns.</div>';
        }
      }
    } catch (e) {
    }
    var gmControls = "";
    if (isGM) {
      var pSendBtns = PLANE_MEDIUM_PRESETS.map(function(p) {
        return button(p.label + " (" + p.dc + ")", "planes send medium " + p.days + "d");
      }).join(" ");
      var pHighBtns = PLANE_HIGH_PRESETS.map(function(p) {
        return button(p.label + " (" + p.dc + ")", "planes send high " + p.days + "d");
      }).join(" ");
      gmControls = '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:5px;"><div style="font-size:.82em;margin-bottom:2px;">Send Medium: ' + pSendBtns + '</div><div style="font-size:.82em;margin-bottom:2px;">Send High: ' + pHighBtns + "</div>" + button("View: " + _displayModeLabel(displayMode), "settings mode planes " + _nextDisplayMode(displayMode)) + '<div style="font-size:.75em;opacity:.4;margin-top:3px;">CLI: <code>!cal planes send [low|medium|high] [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]</code></div></div>';
    }
    var srcLine = srcLabel ? '<div style="font-size:.75em;opacity:.4;font-style:italic;margin-top:6px;">' + esc(srcLabel) + "</div>" : "";
    var horizonLine = !isGM ? '<div style="font-size:.72em;opacity:.35;font-style:italic;margin-top:4px;">Forecast horizon: ' + esc(_planeRangeLabel(viewHorizon)) + "</div>" : "";
    var body = "";
    if (displayMode !== "list") {
      body += planesMiniCal;
      body += _legendLine(["\u{1F534} Coterminous", "\u{1F7E0} Waning", "\u{1F535} Remote", "\u{1F7E1} Waxing", "\u25C7 Generated shift"]);
    }
    if (displayMode !== "calendar") {
      body += rows.join("");
    }
    if (!body) {
      body = '<div style="opacity:.7;">No planar display mode selected.</div>';
    }
    return _menuBox(
      "\u{1F300} Planes \u2014 " + esc(dateLabel),
      navRow + _planesTodaySummaryHtml(today, isGM, viewTier, viewHorizon) + body + longShadowsHtml + srcLine + horizonLine + gmControls + '<div style="margin-top:7px;">' + button("\u2B05\uFE0F Back", "help root") + "</div>"
    );
  }
  function _isGeneratedNote(note) {
    return /generated/i.test(String(note || ""));
  }
  function handlePlanesCommand(m, args) {
    var sub = String(args[1] || "").toLowerCase();
    var isGM = playerIsGM(m.playerid);
    var psView = getPlanesState();
    var playerTier = _normalizePlaneRevealTier(psView.revealTier || "medium");
    var playerHorizon = parseInt(psView.revealHorizonDays, 10) || _planarYearDays();
    var playerGenHorizon = parseInt(psView.generatedHorizonDays, 10) || 0;
    if (!sub || sub === "show") {
      return whisper(m.who, isGM ? planesPanelHtml(true) : planesPanelHtml(false, playerTier, null, playerHorizon, playerGenHorizon));
    }
    if (!isGM) {
      if (sub === "on" || sub === "date") {
        var pDateToks = args.slice(2).map(function(t) {
          return String(t || "").trim();
        }).filter(Boolean);
        var pPref = parseDatePrefixForAdd(pDateToks);
        if (!pPref) {
          return whisper(m.who, "Usage: <code>!cal planes on &lt;dateSpec&gt;</code>");
        }
        var pSerial = toSerial(pPref.year, pPref.mHuman - 1, pPref.day);
        var pToday = todaySerial();
        if (pSerial < pToday || pSerial > pToday + playerHorizon) {
          return whisper(m.who, "That date is beyond your planar knowledge.");
        }
        return whisper(m.who, planesPanelHtml(false, playerTier, pSerial, playerHorizon, playerGenHorizon));
      }
      return whisper(
        m.who,
        "Planes: <code>!cal planes</code> &nbsp;\xB7&nbsp; <code>!cal planes on &lt;dateSpec&gt;</code>"
      );
    }
    if (sub === "on" || sub === "date") {
      var dateToksOn = args.slice(2).map(function(t) {
        return String(t || "").trim();
      }).filter(Boolean);
      var prefOn = parseDatePrefixForAdd(dateToksOn);
      if (!prefOn) {
        return whisper(m.who, "Usage: <code>!cal planes on &lt;dateSpec&gt;</code> (example: <code>!cal planes on Rhaan 14 998</code>)");
      }
      var serialOn = toSerial(prefOn.year, prefOn.mHuman - 1, prefOn.day);
      return whisper(m.who, planesPanelHtml(true, null, serialOn));
    }
    if (sub === "set") {
      var setName = String(args[2] || "").trim();
      var setPhase = String(args[3] || "").toLowerCase();
      if (!setName || !PLANE_PHASE_LABELS[setPhase]) {
        return whisper(m.who, "Usage: <code>!cal planes set &lt;name&gt; (coterminous|waning|remote|waxing) [days]</code>");
      }
      var plane = _getPlaneData(setName);
      if (!plane) return whisper(m.who, "Unknown plane: <b>" + esc(setName) + "</b>");
      var durationDays = parseInt(args[4], 10) || 0;
      var setToday = todaySerial();
      var ps = getPlanesState();
      var overrideObj = { phase: setPhase, note: "GM override", setOn: setToday };
      if (durationDays > 0) overrideObj.durationDays = durationDays;
      ps.overrides[plane.name] = overrideObj;
      if (!ps.gmCustomEvents) ps.gmCustomEvents = {};
      if (!ps.gmCustomEvents[plane.name]) ps.gmCustomEvents[plane.name] = [];
      ps.gmCustomEvents[plane.name].push({
        serial: setToday,
        phase: setPhase,
        durationDays: durationDays || 0,
        note: "GM override"
      });
      var durMsg = durationDays > 0 ? " for <b>" + durationDays + "</b> day" + (durationDays > 1 ? "s" : "") : " (indefinite)";
      whisper(m.who, "<b>" + esc(plane.name) + "</b> forced to <b>" + esc(PLANE_PHASE_LABELS[setPhase]) + "</b>" + durMsg + ".");
      return whisper(m.who, planesPanelHtml(true));
    }
    if (sub === "clear") {
      var clearName = String(args[2] || "").trim();
      var psC = getPlanesState();
      if (!clearName) {
        psC.overrides = {};
        psC.anchors = {};
        psC.gmCustomEvents = {};
        whisper(m.who, "All planar overrides and anchor overrides cleared.");
        return whisper(m.who, planesPanelHtml(true));
      }
      var planeC = _getPlaneData(clearName);
      if (!planeC) return whisper(m.who, "Unknown plane: <b>" + esc(clearName) + "</b>");
      delete psC.overrides[planeC.name];
      delete psC.anchors[planeC.name];
      delete psC.gmCustomEvents[planeC.name];
      whisper(m.who, "Override cleared for <b>" + esc(planeC.name) + "</b>.");
      return whisper(m.who, planesPanelHtml(true));
    }
    if (sub === "anchor") {
      var ancName = String(args[2] || "").trim();
      var ancPhase = String(args[3] || "").toLowerCase();
      if (!ancName || !PLANE_PHASE_LABELS[ancPhase]) {
        return whisper(
          m.who,
          "Usage: <code>!cal planes anchor &lt;name&gt; (coterminous|waning|remote|waxing) &lt;dateSpec&gt;</code><br>Example: <code>!cal planes anchor Fernia coterminous Lharvion 1 996</code>"
        );
      }
      var planeA = _getPlaneData(ancName);
      if (!planeA) return whisper(m.who, "Unknown plane: <b>" + esc(ancName) + "</b>");
      var dateToks = args.slice(4).map(function(t) {
        return String(t || "").trim();
      }).filter(Boolean);
      var pref = parseDatePrefixForAdd(dateToks);
      if (!pref) {
        return whisper(m.who, "Could not parse date. Try: <code>!cal planes anchor " + esc(planeA.name) + " " + ancPhase + " Lharvion 1 996</code>");
      }
      var psA = getPlanesState();
      psA.anchors[planeA.name] = {
        year: pref.year,
        month: pref.mHuman - 1,
        day: pref.day,
        phase: ancPhase
      };
      var cal2 = getCal();
      var monthName = _displayMonthDayParts(pref.mHuman - 1, pref.day).monthName;
      whisper(
        m.who,
        "<b>" + esc(planeA.name) + "</b> anchor set: <b>" + esc(PLANE_PHASE_LABELS[ancPhase]) + "</b> on " + esc(String(pref.day)) + " " + esc(monthName) + " " + esc(String(pref.year)) + "."
      );
      delete psA.overrides[planeA.name];
      return whisper(m.who, planesPanelHtml(true));
    }
    if (sub === "send") {
      var tierRaw = String(args[2] || "").toLowerCase();
      if (!tierRaw) {
        var planes = _getAllPlaneData();
        var today = todaySerial();
        var sendRows = [];
        for (var si = 0; si < planes.length; si++) {
          var sps = getPlanarState(planes[si].name, today);
          if (!sps) continue;
          var sEmoji = PLANE_PHASE_EMOJI[sps.phase] || "\u26AA";
          var sLabel = PLANE_PHASE_LABELS[sps.phase] || sps.phase;
          sendRows.push(
            '<div style="margin:2px 0;">' + sEmoji + " <b>" + esc(sps.plane.name) + "</b> \u2014 " + esc(sLabel) + "</div>"
          );
        }
        whisper(m.who, _menuBox(
          "\u{1F300} Planar Almanac \u2014 " + esc(dateLabelFromSerial(today)),
          sendRows.join("") + '<div style="opacity:.75;margin-top:4px;">GM-only view. No message was sent to players.</div><div style="margin-top:6px;">' + button("Back", "planes") + "</div>"
        ));
        return;
      }
      var tier = PLANE_REVEAL_TIERS[tierRaw] ? tierRaw : null;
      if (!tier) {
        return whisper(m.who, "Usage: <code>!cal planes send [low|medium|high] [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]</code>");
      }
      var reqHorizon = _parsePlaneRevealRange(args[3], tier);
      if (!reqHorizon) {
        return whisper(m.who, "Usage: <code>!cal planes send [low|medium|high] [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]</code>");
      }
      var psSend = getPlanesState();
      var curTier = _normalizePlaneRevealTier(psSend.revealTier || "medium");
      var curRank = PLANE_REVEAL_TIERS[curTier] || 1;
      var newRank = PLANE_REVEAL_TIERS[tier] || 1;
      if (newRank > curRank) psSend.revealTier = tier;
      var effectiveTier = _normalizePlaneRevealTier(psSend.revealTier || tier);
      var canonHorizon, genHorizon;
      if (effectiveTier === "high") {
        canonHorizon = reqHorizon;
        genHorizon = reqHorizon;
      } else if (effectiveTier === "medium") {
        canonHorizon = PLANE_PREDICTION_LIMITS.mediumCanonDays;
        genHorizon = reqHorizon;
      } else {
        canonHorizon = PLANE_PREDICTION_LIMITS.mediumCanonDays;
        genHorizon = 0;
      }
      psSend.revealHorizonDays = Math.max(parseInt(psSend.revealHorizonDays, 10) || 0, canonHorizon);
      psSend.generatedHorizonDays = Math.max(parseInt(psSend.generatedHorizonDays, 10) || 0, genHorizon);
      var effectiveCanonHorizon = parseInt(psSend.revealHorizonDays, 10) || canonHorizon;
      var effectiveGenHorizon = parseInt(psSend.generatedHorizonDays, 10) || genHorizon;
      sendToAll(planesPanelHtml(false, effectiveTier, null, effectiveCanonHorizon, effectiveGenHorizon));
      var rangeNote = effectiveTier === "medium" ? "canon " + _planeRangeLabel(effectiveCanonHorizon) + ", generated " + effectiveGenHorizon + "d" : _planeRangeLabel(effectiveCanonHorizon);
      warnGM("Sent " + titleCase(effectiveTier) + " planar forecast to players (" + rangeNote + ").");
      whisper(m.who, planesPanelHtml(true));
      return;
    }
    if (sub === "suppress") {
      var suppName = String(args[2] || "");
      var suppPlane = _getPlaneData(suppName);
      if (!suppPlane) {
        return whisper(
          m.who,
          "Usage: <code>!cal planes suppress &lt;name&gt; [dateSpec]</code><br>Suppresses a specific generated event without disabling the whole system."
        );
      }
      var suppSerial = todaySerial();
      if (args.length > 3) {
        var suppToks = args.slice(3).map(function(t) {
          return String(t || "").trim();
        }).filter(Boolean);
        var suppPref = parseDatePrefixForAdd(suppToks);
        if (suppPref) {
          suppSerial = toSerial(suppPref.year, suppPref.mHuman - 1, suppPref.day);
        }
      }
      var suppEvt = _generatedEventAt(suppPlane.name, suppSerial);
      if (!suppEvt) {
        return whisper(m.who, "No generated event found for <b>" + esc(suppPlane.name) + "</b> on that date.");
      }
      var psSup = getPlanesState();
      if (!psSup.suppressedEvents[suppPlane.name]) psSup.suppressedEvents[suppPlane.name] = {};
      psSup.suppressedEvents[suppPlane.name][suppEvt.startSerial] = true;
      var suppDateLabel = dateLabelFromSerial(suppEvt.startSerial);
      whisper(
        m.who,
        "Suppressed <b>" + esc(suppPlane.name) + "</b> generated " + esc(suppEvt.phase) + " event starting " + esc(suppDateLabel) + " (" + suppEvt.durationDays + "d)."
      );
      return whisper(m.who, planesPanelHtml(true));
    }
    if (sub === "seed") {
      var seedName = String(args[2] || "");
      var seedPlane = _getPlaneData(seedName);
      if (!seedPlane || !seedPlane.seedAnchor) {
        return whisper(
          m.who,
          "Usage: <code>!cal planes seed &lt;name&gt; &lt;year&gt;</code><br>Override the seed-based anchor year for a cyclic plane. Only works for seed-anchored planes."
        );
      }
      var seedYear = parseInt(args[3], 10);
      if (String(args[3] || "").toLowerCase() === "clear") {
        var psSeedClear = getPlanesState();
        if (psSeedClear.seedOverrides) delete psSeedClear.seedOverrides[seedPlane.name];
        whisper(m.who, "<b>" + esc(seedPlane.name) + "</b> seed anchor override removed. Using epoch-derived anchor.");
        return whisper(m.who, planesPanelHtml(true));
      }
      if (!isFinite(seedYear)) {
        return whisper(m.who, "Please provide a year. Example: <code>!cal planes seed " + esc(seedPlane.name) + " 998</code>");
      }
      var psSeed = getPlanesState();
      if (!psSeed.seedOverrides) psSeed.seedOverrides = {};
      psSeed.seedOverrides[seedPlane.name] = seedYear;
      whisper(
        m.who,
        "<b>" + esc(seedPlane.name) + "</b> seed anchor overridden to year <b>" + seedYear + "</b>.<br>" + (seedPlane.linkedTo ? "<i>Note: linked plane " + esc(seedPlane.linkedTo) + " will derive from its own setting.</i><br>" : "") + "Use <code>!cal planes seed " + esc(seedPlane.name) + " clear</code> to remove."
      );
      return whisper(m.who, planesPanelHtml(true));
    }
    whisper(
      m.who,
      "Planes: <code>!cal planes</code> &nbsp;\xB7&nbsp; <code>!cal planes send [low|medium|high] [1d|3d|6d|10d|1m|3m|6m|10m|Nd|Nw]</code> &nbsp;\xB7&nbsp; <code>!cal planes on &lt;dateSpec&gt;</code> &nbsp;\xB7&nbsp; <code>!cal planes set &lt;name&gt; &lt;phase&gt;</code> &nbsp;\xB7&nbsp; <code>!cal planes anchor &lt;name&gt; &lt;phase&gt; &lt;dateSpec&gt;</code> &nbsp;\xB7&nbsp; <code>!cal planes seed &lt;name&gt; &lt;year&gt;</code> &nbsp;\xB7&nbsp; <code>!cal planes suppress &lt;name&gt; [dateSpec]</code> &nbsp;\xB7&nbsp; <code>!cal planes clear [&lt;name&gt;]</code>"
    );
  }

  // src/moon.ts
  var EBERRON_MOON_CORE_DATA = {
    Zarantyr: { referenceMoon: "Luna (Earth)", color: "#F5F5FA", diameter: 1250, avgOrbitalDistance: 14300 },
    Olarune: { referenceMoon: "Titan (Saturn)", color: "#FFC68A", diameter: 1e3, avgOrbitalDistance: 18e3 },
    Therendor: { referenceMoon: "Dione (Saturn)", color: "#D3D3D3", diameter: 1100, avgOrbitalDistance: 39e3 },
    Eyre: { referenceMoon: "Mimas (Saturn)", color: "#C0C0C0", diameter: 1200, avgOrbitalDistance: 52e3 },
    Dravago: { referenceMoon: "Triton (Neptune)", color: "#E6E6FA", diameter: 2e3, avgOrbitalDistance: 77500 },
    Nymm: { referenceMoon: "Ganymede (Jupiter)", color: "#FFD96B", diameter: 900, avgOrbitalDistance: 95e3 },
    Lharvion: { referenceMoon: "Hyperion (Saturn)", color: "#F5F5F5", diameter: 1350, avgOrbitalDistance: 125e3 },
    Barrakas: { referenceMoon: "Enceladus (Saturn)", color: "#F0F8FF", diameter: 1500, avgOrbitalDistance: 144e3 },
    Rhaan: { referenceMoon: "Miranda (Uranus)", color: "#9AC0FF", diameter: 800, avgOrbitalDistance: 168e3 },
    Sypheros: { referenceMoon: "Phobos (Mars)", color: "#696969", diameter: 1100, avgOrbitalDistance: 183e3 },
    Aryth: { referenceMoon: "Iapetus (Saturn)", color: "#FF4500", diameter: 1300, avgOrbitalDistance: 195e3 },
    Vult: { referenceMoon: "Oberon (Uranus)", color: "#A9A9A9", diameter: 1800, avgOrbitalDistance: 252e3 }
  };
  function _eberronMoonCore(moonName) {
    return EBERRON_MOON_CORE_DATA[moonName] || { referenceMoon: "Unknown", color: "#CCCCCC", diameter: 1e3, avgOrbitalDistance: 1e5 };
  }
  var MOON_SYSTEMS = {
    eberron: {
      id: "eberron",
      moons: [
        // ── ZARANTYR ── The Storm Moon ─────────────────────────────────
        // Analog: Luna (Earth's Moon). The reference moon — pearly white,
        // moderate eccentricity, wide inclination sweep. Closest and most
        // influential on tides. Kythri = chaos; storms rage when full.
        // Real Luna: ecc 0.0549, inc 5.145°, albedo 0.12.
        {
          name: "Zarantyr",
          referenceMoon: _eberronMoonCore("Zarantyr").referenceMoon,
          title: "The Storm Moon",
          color: _eberronMoonCore("Zarantyr").color,
          associatedMonth: 1,
          plane: "Kythri",
          dragonmark: "Mark of Storm",
          synodicPeriod: 27.32,
          diameter: _eberronMoonCore("Zarantyr").diameter,
          distance: _eberronMoonCore("Zarantyr").avgOrbitalDistance,
          inclination: 5.145,
          eccentricity: 0.0549,
          albedo: 0.12,
          variation: { shape: "random", amplitude: 1.4 },
          epochSeed: { defaultSeed: "kythri", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── OLARUNE ── The Sentinel Moon ───────────────────────────────
        // Analog: Titan (Saturn). The most natural moon — thick atmosphere,
        // methane rain, seasons, lakes. Orange haze hides the surface from
        // view: the sentinel who watches unseen. Low inclination, steady.
        // Real Titan: ecc 0.0288, inc 0.33°, albedo 0.22.
        {
          name: "Olarune",
          referenceMoon: _eberronMoonCore("Olarune").referenceMoon,
          title: "The Sentinel Moon",
          color: _eberronMoonCore("Olarune").color,
          associatedMonth: 2,
          plane: "Lamannia",
          dragonmark: "Mark of Sentinel",
          synodicPeriod: 34,
          diameter: _eberronMoonCore("Olarune").diameter,
          distance: _eberronMoonCore("Olarune").avgOrbitalDistance,
          inclination: 0.33,
          eccentricity: 0.0288,
          albedo: 0.22,
          variation: { shape: "random", amplitude: 1.7 },
          epochSeed: { defaultSeed: "lamannia", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── THERENDOR ── The Healer's Moon ─────────────────────────────
        // Analog: Europa (Jupiter). Smooth ice shell over a warm subsurface
        // ocean — the healer's calm exterior with life-sustaining depth
        // beneath. Youngest surface of the Galileans: constantly renewed
        // (healing). In 1:2:4 resonance with Ganymede/Nymm → connected
        // to order. Bright reflective ice = gentle healing light.
        // Real Dione: ecc 0.0022, inc 0.03°, albedo 0.99.
        {
          name: "Therendor",
          referenceMoon: _eberronMoonCore("Therendor").referenceMoon,
          title: "The Healer's Moon",
          color: _eberronMoonCore("Therendor").color,
          associatedMonth: 3,
          plane: "Syrania",
          dragonmark: "Mark of Healing",
          synodicPeriod: 24,
          diameter: _eberronMoonCore("Therendor").diameter,
          distance: _eberronMoonCore("Therendor").avgOrbitalDistance,
          inclination: 0.03,
          eccentricity: 22e-4,
          albedo: 0.99,
          variation: { shape: "random", amplitude: 1.2 },
          epochSeed: { defaultSeed: "syrania", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── EYRE ── The Anvil ──────────────────────────────────────────
        // Analog: Mimas (Saturn). Heavily cratered "Death Star" moon with
        // the giant Herschel crater = a forge mark. Bright icy surface
        // (albedo 0.96) reflects Fernia's fire. In 4:3 resonance with
        // Titan/Olarune → nature feeds the forge.
        // Real Mimas: ecc 0.0196, inc 1.53°, albedo 0.96.
        {
          name: "Eyre",
          referenceMoon: _eberronMoonCore("Eyre").referenceMoon,
          title: "The Anvil",
          color: _eberronMoonCore("Eyre").color,
          associatedMonth: 4,
          plane: "Fernia",
          dragonmark: "Mark of Making",
          synodicPeriod: 21,
          diameter: _eberronMoonCore("Eyre").diameter,
          distance: _eberronMoonCore("Eyre").avgOrbitalDistance,
          inclination: 1.53,
          eccentricity: 0.0196,
          albedo: 0.96,
          variation: { shape: "random", amplitude: 1 },
          epochSeed: { defaultSeed: "fernia", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── DRAVAGO ── The Herder's Moon ───────────────────────────────
        // Analog: Triton (Neptune). Retrograde orbit (inc 156.8°) —
        // moves against every other moon, embodying Risia's opposition
        // to natural order. Near-zero eccentricity = frozen stasis.
        // Nitrogen ice surface, high albedo. The herder watches from
        // a crystalline vantage, circling in eternal counter-motion.
        // Largest moon by diameter. Lavender = planar tint over ice.
        // Real Triton: ecc 0.000016, inc 156.8°, albedo 0.76.
        {
          name: "Dravago",
          referenceMoon: _eberronMoonCore("Dravago").referenceMoon,
          title: "The Herder's Moon",
          color: _eberronMoonCore("Dravago").color,
          associatedMonth: 5,
          plane: "Risia",
          dragonmark: "Mark of Handling",
          synodicPeriod: 42,
          diameter: _eberronMoonCore("Dravago").diameter,
          distance: _eberronMoonCore("Dravago").avgOrbitalDistance,
          inclination: 156.8,
          eccentricity: 16e-6,
          albedo: 0.76,
          variation: { shape: "random", amplitude: 2.1 },
          epochSeed: { defaultSeed: "risia", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── NYMM ── The Crown ──────────────────────────────────────────
        // Analog: Ganymede (Jupiter). LARGEST moon in the solar system —
        // a crown jewel. The ONLY moon with its own magnetic field:
        // sovereign authority, self-contained order. In perfect 1:2:4
        // Laplace resonance with Europa/Therendor and Io → mathematical
        // perfection = Daanvi. Near-circular orbit, near-equatorial.
        // Gold = Daanvi's planar influence, not geology.
        // Real Ganymede: ecc 0.0013, inc 0.20°, albedo 0.43.
        {
          name: "Nymm",
          referenceMoon: _eberronMoonCore("Nymm").referenceMoon,
          title: "The Crown",
          color: _eberronMoonCore("Nymm").color,
          associatedMonth: 6,
          plane: "Daanvi",
          dragonmark: "Mark of Hospitality",
          synodicPeriod: 28,
          diameter: _eberronMoonCore("Nymm").diameter,
          distance: _eberronMoonCore("Nymm").avgOrbitalDistance,
          inclination: 0.2,
          eccentricity: 13e-4,
          albedo: 0.43,
          variation: { shape: "random", amplitude: 1.4 },
          epochSeed: { defaultSeed: "daanvi", referenceDate: { year: 998, month: 1, day: 1 } },
          nodePrecession: { period: 336, navigable: true }
        },
        // ── LHARVION ── The Eye ────────────────────────────────────────
        // Analog: Hyperion (Saturn). The ONLY confirmed chaotic tumbler
        // in the solar system — never shows the same face twice. Sponge-
        // like surface pocked with deep craters. Unpredictable rotation
        // embodies Xoriat's madness. Moderate eccentricity (0.123) gives
        // noticeable brightness variation. Dark, low albedo.
        // Dull white with 750-mile black chasm → the Eye.
        // Real Hyperion: ecc 0.1230, inc 0.43°, albedo 0.30.
        {
          name: "Lharvion",
          referenceMoon: _eberronMoonCore("Lharvion").referenceMoon,
          title: "The Eye",
          color: _eberronMoonCore("Lharvion").color,
          associatedMonth: 7,
          plane: "Xoriat",
          dragonmark: "Mark of Detection",
          synodicPeriod: 30,
          diameter: _eberronMoonCore("Lharvion").diameter,
          distance: _eberronMoonCore("Lharvion").avgOrbitalDistance,
          inclination: 0.43,
          eccentricity: 0.123,
          albedo: 0.3,
          variation: { shape: "random", amplitude: 1.5 },
          epochSeed: { defaultSeed: "xoriat", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── BARRAKAS ── The Lantern ────────────────────────────────────
        // Analog: Enceladus (Saturn). THE brightest body in the solar
        // system — geometric albedo 1.375 (backscattering from pure ice
        // exceeds a flat-disk model). Ice geysers feed Saturn's E-ring.
        // Near-equatorial orbit lights all latitudes equally. The Lantern
        // of Irian needs no magical amplification: real physics already
        // gives it supernatural brightness. Slight ecc for gentle pulsing.
        // Real Enceladus: ecc 0.0047, inc 0.02°, albedo 1.375.
        {
          name: "Barrakas",
          referenceMoon: _eberronMoonCore("Barrakas").referenceMoon,
          title: "The Lantern",
          color: _eberronMoonCore("Barrakas").color,
          associatedMonth: 8,
          plane: "Irian",
          dragonmark: "Mark of Finding",
          synodicPeriod: 22,
          diameter: _eberronMoonCore("Barrakas").diameter,
          distance: _eberronMoonCore("Barrakas").avgOrbitalDistance,
          inclination: 0.02,
          eccentricity: 47e-4,
          albedo: 1.375,
          variation: { shape: "random", amplitude: 1.1 },
          epochSeed: { defaultSeed: "irian", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── RHAAN ── The Book ──────────────────────────────────────────
        // Analog: Miranda (Uranus). The "Frankenstein moon" — shattered
        // and reassembled, its patchwork surface looks like pages from
        // different books stitched together. Three coronae with chevron
        // patterns. Verona Rupes = tallest cliff in the solar system.
        // Named after Shakespeare's Tempest character — the only HUMAN
        // among Uranus's fairy-named moons. Once tumbled chaotically
        // (like Hyperion) during a past 3:1 resonance with Umbriel, but
        // now calm: stories of violence written on a peaceful face.
        // Orbits a sideways planet → extreme seasonal illumination.
        // Smallest Eberron moon. Blue = Thelanis fey light through
        // ancient stone. The Book carries every story on its skin.
        // Real Miranda: ecc 0.0013, inc 4.34°, albedo 0.32.
        {
          name: "Rhaan",
          referenceMoon: _eberronMoonCore("Rhaan").referenceMoon,
          title: "The Book",
          color: _eberronMoonCore("Rhaan").color,
          associatedMonth: 9,
          plane: "Thelanis",
          dragonmark: "Mark of Scribing",
          synodicPeriod: 37,
          diameter: _eberronMoonCore("Rhaan").diameter,
          distance: _eberronMoonCore("Rhaan").avgOrbitalDistance,
          inclination: 4.34,
          eccentricity: 13e-4,
          albedo: 0.32,
          variation: { shape: "random", amplitude: 1.9 },
          epochSeed: { defaultSeed: "thelanis", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── SYPHEROS ── The Shadow ─────────────────────────────────────
        // Analog: Phoebe (Saturn). Dark captured body in RETROGRADE orbit
        // (175.3° inclination = effectively 4.7° backward). Albedo 0.06:
        // coal-dark, nearly invisible. Phobos (Mars) — the closest,
        // fastest moon. Named after the god of fear. Tidally decaying
        // orbit = inevitably drawn into destruction. Shadow consumes.
        // Low inclination, near-circular, dark albedo. Mabar = Endless Night.
        // Real Phobos: ecc 0.0151, inc 1.08°, albedo 0.071.
        {
          name: "Sypheros",
          referenceMoon: _eberronMoonCore("Sypheros").referenceMoon,
          title: "The Shadow",
          color: _eberronMoonCore("Sypheros").color,
          associatedMonth: 10,
          plane: "Mabar",
          dragonmark: "Mark of Shadow",
          synodicPeriod: 67,
          diameter: _eberronMoonCore("Sypheros").diameter,
          distance: _eberronMoonCore("Sypheros").avgOrbitalDistance,
          inclination: 1.08,
          eccentricity: 0.0151,
          albedo: 0.071,
          variation: { shape: "random", amplitude: 3.4 }
        },
        // ── ARYTH ── The Gateway ───────────────────────────────────────
        // Analog: Iapetus (Saturn). THE two-tone moon — leading hemisphere
        // coal-black (albedo 0.05), trailing hemisphere bright (0.50).
        // A literal gateway between light and dark, life and death.
        // 13km equatorial ridge = a threshold between realms. HIGHEST
        // inclination of any regular Saturnian moon (7.57°) → sees both
        // extremes of the sky. Walnut-shaped. Dark reddish-brown leading
        // side matches #FF4500 burnt orange-red. Coated in dark material
        // shed by Phoebe/Sypheros: the Shadow marks the Gateway.
        // Real Iapetus: ecc 0.0283, inc 7.57°, albedo 0.275 (averaged; not tidally locked, both faces visible).
        {
          name: "Aryth",
          referenceMoon: _eberronMoonCore("Aryth").referenceMoon,
          title: "The Gateway",
          color: _eberronMoonCore("Aryth").color,
          associatedMonth: 11,
          plane: "Dolurrh",
          dragonmark: "Mark of Passage",
          synodicPeriod: 48,
          diameter: _eberronMoonCore("Aryth").diameter,
          distance: _eberronMoonCore("Aryth").avgOrbitalDistance,
          inclination: 7.57,
          eccentricity: 0.0283,
          albedo: 0.275,
          variation: { shape: "random", amplitude: 2.4 },
          epochSeed: { defaultSeed: "dolurrh", referenceDate: { year: 998, month: 1, day: 1 } }
        },
        // ── VULT ── The Warding Moon ───────────────────────────────────
        // Analog: Oberon (Uranus). Outermost major Uranian moon — the
        // outer ward. Heavily cratered from endless bombardment = scars
        // of eternal war (Shavarath). Dark deposits fill crater floors.
        // An 11km mountain = fortress on the frontier. Named for
        // Shakespeare's fairy king in A Midsummer Night's Dream: the
        // warrior-king who holds the line. Near-circular, near-equatorial
        // = disciplined, unwavering patrol. Gray with reddish tint.
        // Real Oberon: ecc 0.0014, inc 0.07°, albedo 0.23.
        {
          name: "Vult",
          referenceMoon: _eberronMoonCore("Vult").referenceMoon,
          title: "The Warding Moon",
          color: _eberronMoonCore("Vult").color,
          associatedMonth: 12,
          plane: "Shavarath",
          dragonmark: "Mark of Warding",
          synodicPeriod: 56,
          diameter: _eberronMoonCore("Vult").diameter,
          distance: _eberronMoonCore("Vult").avgOrbitalDistance,
          inclination: 0.07,
          eccentricity: 14e-4,
          albedo: 0.23,
          variation: { shape: "random", amplitude: 2.8 },
          epochSeed: { defaultSeed: "shavarath", referenceDate: { year: 998, month: 1, day: 1 } }
        }
      ]
    },
    // =========================================================================
    // FAERUNIAN — Selûne (single moon of Toril)
    // =========================================================================
    // Selûne: full at midnight Hammer 1, 1372 DR. 30.4375-day period.
    // 48 synodic cycles = 1461 days = exactly 4 Harptos years (incl. Shieldmeet).
    // Phase is perfectly self-resetting on the four-year leap cycle.
    // ~2000 miles diameter, ~183,000 miles distance. Similar apparent size to Earth's moon.
    // Bright enough to cast pale shadows. Associated with lycanthropy, navigation, tides.
    // Trailed by the Tears of Selûne (asteroid cluster, visible flavor).
    faerunian: {
      id: "faerunian",
      name: "Toril",
      description: "Sel\xFBne, the silver moon of Toril. 30.4375-day cycle aligned to the Harptos leap year.",
      moons: [
        {
          name: "Sel\xFBne",
          title: "The Moonmaiden",
          color: "#C8D8F0",
          associatedMonth: null,
          synodicPeriod: 30.4375,
          diameter: 2e3,
          distance: 183e3,
          inclination: 5.1,
          eccentricity: 0.054,
          albedo: 0.25,
          variation: { shape: "random", amplitude: 1.5 },
          epochSeed: { defaultSeed: "selune", referenceDate: { year: 1372, month: 1, day: 1 } },
          loreNote: "Full at midnight Hammer 1, 1372 DR. Trailed by the Tears of Sel\xFBne. Associated with lycanthropy, divination, navigation, and tides.",
          deity: "Sel\xFBne"
        }
      ]
    },
    // =========================================================================
    // GREGORIAN — Luna (Earth's moon)
    // =========================================================================
    // Standard astronomical reference. Synodic period 29.53059 days.
    // Anchor: full moon on January 28, 2021 (a known astronomical full moon).
    // Albedo 0.12, diameter 2159 miles, distance 238855 miles.
    // Variation: slight (~0.5 day) due to orbital eccentricity.
    gregorian: {
      id: "gregorian",
      name: "Earth",
      description: "Luna, Earth's moon. Standard synodic period 29.53059 days.",
      moons: [
        {
          name: "Luna",
          title: "The Moon",
          color: "#DCDCDC",
          associatedMonth: null,
          synodicPeriod: 29.53059,
          diameter: 2159,
          distance: 238855,
          inclination: 5.14,
          eccentricity: 0.0549,
          albedo: 0.12,
          variation: { shape: "random", amplitude: 0.5 },
          epochSeed: { defaultSeed: "luna", referenceDate: { year: 2021, month: 1, day: 28 } },
          loreNote: "Earth's natural satellite. Synodic period 29.53 days. Governs tides and has inspired mythology across all human cultures."
        }
      ]
    }
  };
  var MOON_LORE = {
    Zarantyr: {
      blurb: "The Storm Moon is the closest and largest moon in the sky. It appears to shift in color, and storms are said to be fiercer when Zarantyr is full. Associated with Kythri, the Churning Chaos, and the Mark of Storm borne by House Lyrandar.",
      orbit: "Closest moon. ~27-day cycle. Analog: Luna. Moderate eccentricity with wide inclination sweep \u2014 storms rage when Zarantyr is full."
    },
    Olarune: {
      blurb: "The Sentinel Moon glows with a warm amber light. Druids and rangers watch Olarune closely, as its phases are tied to the rhythms of the natural world. Associated with Lamannia, the Twilight Forest, and the Mark of Sentinel borne by House Deneith.",
      orbit: "Second closest. ~34-day cycle. Analog: Titan. Low inclination, steady orbit \u2014 the sentinel watches from behind an orange haze."
    },
    Therendor: {
      blurb: "The Healer's Moon shines with a soft silver light. Healers and midwives track its phases, and some hospitals time treatments to its cycle. Associated with Syrania, the Azure Sky, and the Mark of Healing borne by House Jorasco.",
      orbit: "Third orbit. ~24-day cycle. Analog: Europa. Gentle, bright, and reliable \u2014 the healer's calm exterior hides depth beneath."
    },
    Eyre: {
      blurb: "The Anvil gleams like heated steel. Artificers and smiths consider it auspicious to begin major works when Eyre is full. Its brightness visibly pulses as it speeds and slows in its eccentric orbit \u2014 like a forge breathing through bellows. Associated with Fernia, the Sea of Fire, and the Mark of Making borne by House Cannith.",
      orbit: "Fourth orbit. ~21-day cycle \u2014 the fastest moon. Analog: Hyperion. Highest eccentricity of the regular moons \u2014 brightness swings ~56% from near to far. Chaotic tumbler: never shows the same face twice."
    },
    Dravago: {
      blurb: "The Herder's Moon is the largest moon by diameter, though its great distance makes it appear modest. Farmers and herders watch it for seasonal guidance. Its orbit is the most perfectly circular of all twelve moons \u2014 an unchanging, frozen path. Associated with Risia, the Plain of Ice, and the Mark of Handling borne by House Vadalis.",
      orbit: "Fifth orbit. ~42-day cycle. Analog: Tethys. The most circular orbit of any moon \u2014 near-zero eccentricity. Pure ice, extremely bright. Frozen stillness."
    },
    Nymm: {
      blurb: "The Crown shines with a golden light. It is considered the most auspicious moon for celebrations, feasts, and acts of hospitality. It is the only moon with its own sovereign authority \u2014 an invisible shield that answers to no other. Associated with Daanvi, the Perfect Order, and the Mark of Hospitality borne by House Ghallanda.",
      orbit: "Sixth orbit. Precise 28-day cycle \u2014 the most regular of all moons. Analog: Ganymede. Near-perfect circle, near-equatorial. In mathematical resonance with Therendor and Eyre."
    },
    Lharvion: {
      blurb: "The Eye is the most unsettling moon. It sometimes appears to move backward, and its phases do not follow any predictable pattern. Its orbit is the most extreme of any moon \u2014 swinging from terrifyingly close and bright to nearly vanishing at the edge of sight. Seers and inquisitives study it, but few claim to understand it. Associated with Xoriat, the Realm of Madness, and the Mark of Detection borne by House Medani.",
      orbit: "Seventh orbit. Nominally ~30-day cycle, but truly erratic. Analog: Nereid. Most eccentric orbit of any known moon \u2014 7x distance swing. Backward motion, sudden jumps, and doubled phases have all been recorded."
    },
    Barrakas: {
      blurb: "The Lantern glows with a steady pale light brighter than any other moon \u2014 brighter, in fact, than physics should allow, reflecting more light than falls upon it. Travelers and explorers consider it a guide, and it is said that those who search by the light of Barrakas will find what they seek. Associated with Irian, the Eternal Dawn, and the Mark of Finding borne by House Tharashk.",
      orbit: "Eighth orbit. ~22-day cycle. Analog: Enceladus. Brightest body in the sky \u2014 geometric albedo exceeds 1.0. Near-equatorial orbit lights all latitudes equally."
    },
    Rhaan: {
      blurb: "The Book shines with a blue-white light. Scholars and scribes hold it sacred, and the greatest works of literature are said to have been composed under its light. Its surface is a patchwork of mismatched terrain \u2014 as if pages from different books were stitched together. A great cliff, the tallest in all the heavens, marks where one story ends and another begins. Associated with Thelanis, the Faerie Court, and the Mark of Scribing borne by House Sivis.",
      orbit: "Ninth orbit. ~37-day cycle. Analog: Miranda. Nearly circular now, but once tumbled chaotically \u2014 every story of that violent past is written on its scarred face. Named for a character in a play."
    },
    Sypheros: {
      blurb: "The Shadow is a dark, dim moon that is difficult to see even when full. It is associated with secrets, espionage, and hidden knowledge. It orbits BACKWARD \u2014 against the motion of all other moons \u2014 a captured wanderer that spreads darkness wherever it goes. The dark material that stains the Gateway's face is shed by the Shadow. Associated with Mabar, the Endless Night, and the Mark of Shadow borne by House Phiarlan and House Thuranni.",
      orbit: "Tenth orbit. ~67-day cycle \u2014 the slowest moon. Analog: Phoebe. Retrograde orbit, coal-dark (albedo 0.06), notable eccentricity. Source of darkness coating Aryth."
    },
    Aryth: {
      blurb: "The Gateway burns with a deep orange-red light. It is associated with death, transition, and passage between worlds. One face is coal-black, the other bright \u2014 a literal threshold between light and darkness. A great ridge circles its equator like a doorframe between realms. The Aereni elves track Aryth closely, and funeral rites are often timed to its phases. Associated with Dolurrh, the Realm of the Dead, and the Mark of Passage borne by House Orien.",
      orbit: "Eleventh orbit. ~48-day cycle. Analog: Iapetus. Two-tone surface (dark leading, bright trailing). Highest inclination of regular moons (7.57\xB0) \u2014 sees both extremes."
    },
    Vult: {
      blurb: "The Warding Moon is the farthest and slowest of the twelve moons. It is associated with protection and defense, and its full moons are considered times of safety. Its surface bears the scars of endless bombardment \u2014 every crater a battle fought and survived. A great mountain rises from its surface like a fortress on the frontier. During Long Shadows, when Mabar is coterminous, even Vult's protective light may be swallowed by darkness. Associated with Shavarath, the Battleground, and the Mark of Warding borne by House Kundarak.",
      orbit: "Outermost orbit. ~56-day cycle. Analog: Oberon. Near-perfect circle, near-equatorial \u2014 disciplined, unwavering patrol. Named for a warrior-king. Its light is a ward against darkness."
    }
  };
  function _moonLoreHtml(moonName) {
    var lore = MOON_LORE[moonName];
    if (!lore) return null;
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    var moon = null;
    if (sys && sys.moons) {
      for (var i = 0; i < sys.moons.length; i++) {
        if (sys.moons[i].name === moonName) {
          moon = sys.moons[i];
          break;
        }
      }
    }
    if (!moon) return null;
    var dot = '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + esc(moon.color || "#aaa") + ';border:1px solid rgba(0,0,0,.3);vertical-align:middle;margin-right:5px;"></span>';
    var html = dot + '<b style="font-size:1.1em;">' + esc(moon.name) + "</b><br><br>" + esc(lore.blurb) + "<br><br><b>Orbit:</b> " + esc(lore.orbit);
    if (moon.dragonmark) {
      html += "<br><b>Dragonmark:</b> " + esc(moon.dragonmark);
    }
    return _menuBox("\u{1F319} " + esc(moon.name), html);
  }
  function _siberysLoreHtml() {
    var r = RING_OF_SIBERYS;
    var eberronRadiusKm = 6400;
    var innerHeightKm = Math.max(0, r.innerEdge_km - eberronRadiusKm);
    var outerHeightKm = Math.max(0, r.outerEdge_km - eberronRadiusKm);
    var html = '<b style="font-size:1.1em;">The Ring of Siberys</b> \u2014 <i>The Blood of the Dragon Above</i><br><br>An equatorial ring of siberys dragonshards encircling Eberron, believed by sages at Arcanix to be the source of all arcane magic. Siberys shards that fall from the Ring are the rarest and most valuable dragonshards, used for dragonmark focus items and legendary artifacts.<br><br><b>Analog:</b> ' + esc(r.analog) + "<br><b>Width:</b> " + r.width_km.toLocaleString() + " km<br><b>Thickness:</b> " + r.thickness_m + " meters<br><b>Orbit:</b> " + r.innerEdge_km.toLocaleString() + " \u2013 " + r.outerEdge_km.toLocaleString() + " km (inside Zarantyr at 14,300 km)<br><b>Inclination:</b> " + r.inclination + "\xB0 (equatorial)<br><b>Height Above Surface:</b> " + innerHeightKm.toLocaleString() + " \u2013 " + outerHeightKm.toLocaleString() + " km<br><b>Albedo:</b> " + r.albedo + "<br><b>Night-light Contribution:</b> ~0.008 lux from the ring alone (~0.010 lux ambient with starlight)<br><br><b>Appearance:</b><br>&nbsp;&nbsp;Day: " + esc(r.appearance.daylight) + "<br>&nbsp;&nbsp;Night: " + esc(r.appearance.night) + "<br>&nbsp;&nbsp;Equator: " + esc(r.appearance.equator) + "<br>&nbsp;&nbsp;Poles: " + esc(r.appearance.poles) + "<br><br><b>Scale Notes:</b> inner edge sits above ISS-like orbital height; outer edge stretches well past the edge of a typical low-orbit band.";
    html += "<br><br>";
    for (var fi = 0; fi < r.facts.length; fi++) {
      html += '<div style="font-size:.85em;opacity:.7;margin:2px 0;">\u2022 ' + esc(r.facts[fi]) + "</div>";
    }
    return _menuBox("\u{1F48E} Ring of Siberys", html);
  }
  function getMoonState() {
    var root = state[state_name];
    if (!root.moons) root.moons = {
      sequences: {},
      // moonName -> array of { serial, type, retro }
      seeds: {},
      // legacy moonName -> override seed string
      systemSeed: null,
      // single global seed word for the entire lunar system
      gmAnchors: {},
      // moonName -> [{ serial, type }]  GM-forced phase events
      generatedFrom: null,
      // serial day from which sequences were generated
      generatedThru: 0,
      // serial day up to which sequences have been generated
      revealTier: "medium",
      // 'low' | 'medium' | 'high'
      revealHorizonDays: 7
      // player-known horizon window
    };
    var ms = root.moons;
    if (!ms.gmAnchors) ms.gmAnchors = {};
    if (ms.systemSeed === void 0) ms.systemSeed = null;
    if (!isFinite(ms.generatedFrom)) ms.generatedFrom = null;
    if (!ms.revealTier) ms.revealTier = "medium";
    ms.revealTier = String(ms.revealTier || "").toLowerCase();
    if (!MOON_REVEAL_TIERS[ms.revealTier]) ms.revealTier = "medium";
    ms.revealHorizonDays = parseInt(ms.revealHorizonDays, 10);
    if (!isFinite(ms.revealHorizonDays) || ms.revealHorizonDays < 7) ms.revealHorizonDays = 7;
    return ms;
  }
  function _moonHashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h / 4294967296;
  }
  function _moonPrng(seedFloat) {
    var s = seedFloat * 4294967296 >>> 0;
    return function() {
      s += 1831565813;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function _dN(serial, salt, sides) {
    var h = 2166136261;
    var str = String(serial) + ":" + salt;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return 1 + h % sides;
  }
  var FESTIVAL_SOFT_ANCHORS = [
    { event: "Crystalfall", type: "full", month: 2, day: 9, salt: "crystalfall" },
    { event: "Sun's Blessing", type: "full", month: 3, day: 15, salt: "suns_blessing" },
    { event: "Onatar's Flame", type: "full", month: 1, day: 7, salt: "onatars_flame" },
    { event: "Bounty's Blessing", type: "full", month: 7, day: 14, salt: "bountys_blessing" },
    { event: "Brightblade", type: "full", month: 6, day: 12, salt: "brightblade" },
    { event: "The Hunt", type: "full", month: 8, day: 4, salt: "the_hunt" },
    { event: "Aureon's Crown", type: "full", month: 5, day: 26, salt: "aureons_crown" },
    { event: "Boldrei's Feast", type: "full", month: 9, day: 9, salt: "boldreis_feast" },
    { event: "Thronehold", type: "full", month: 11, day: 11, salt: "thronehold" }
  ];
  var MOON_PRE_GENERATE_YEARS = 2;
  var MOON_PREDICTION_LIMITS = {
    // Low: look outside + 2 days. Phases are obvious.
    lowDays: 2,
    // Medium: varies by button press. One full cycle exact, beyond that adds
    // uncertainty windows. Max reach = 10 months.
    mediumMaxDays: 280,
    // High: full knowledge. Max reach = 2 years (pre-generation window).
    highMaxDays: 672,
    // Within this range from today, high-tier predictions are exact (no window).
    highExactDays: 180
  };
  var MOON_REVEAL_PRESETS = [
    { label: "1m", days: 28, dc: "DC 10" },
    { label: "3m", days: 84, dc: "DC 15" },
    { label: "6m", days: 168, dc: "DC 20" },
    { label: "10m", days: 280, dc: "DC 25" }
  ];
  var MOON_REVEAL_RANGE_OPTIONS = {
    "1w": 7,
    "2w": 14,
    "4w": 28,
    "1m": 28,
    "3m": 84,
    "6m": 168,
    "10m": 280
  };
  function _parseMoonRevealRange(token, tier) {
    tier = _normalizeMoonRevealTier(tier);
    var maxAllowed = tier === "high" ? MOON_PREDICTION_LIMITS.highMaxDays : tier === "medium" ? MOON_PREDICTION_LIMITS.mediumMaxDays : MOON_PREDICTION_LIMITS.lowDays;
    var t = String(token || "").toLowerCase().trim();
    if (!t) {
      if (tier === "low") return MOON_PREDICTION_LIMITS.lowDays;
      if (tier === "medium") return 28;
      return 84;
    }
    if (MOON_REVEAL_RANGE_OPTIONS[t]) return Math.min(maxAllowed, MOON_REVEAL_RANGE_OPTIONS[t]);
    var dayMatch = t.match(/^(\d+)d$/);
    if (dayMatch) return Math.min(maxAllowed, parseInt(dayMatch[1], 10));
    var weekMatch = t.match(/^(\d+)w$/);
    if (weekMatch) return Math.min(maxAllowed, parseInt(weekMatch[1], 10) * 7);
    if (/^\d+$/.test(t)) {
      var n = parseInt(t, 10);
      if (isFinite(n) && n >= 1) return Math.min(maxAllowed, n);
    }
    return null;
  }
  function _rangeLabel(days) {
    days = parseInt(days, 10) || 0;
    if (days === 7) return "1 week";
    if (days === 28) return "1 month";
    if (days === 84) return "3 months";
    if (days === 168) return "6 months";
    if (days === 280) return "10 months";
    if (days % 28 === 0) return days / 28 + " months";
    return days + " days";
  }
  function _moonYearDays() {
    return getCal().months.reduce(function(s, m) {
      return s + (m.days | 0);
    }, 0);
  }
  function _moonVariationStep(variation, cycleIndex, rng) {
    if (!variation) return 0;
    var amp = variation.amplitude || 0;
    if (variation.shape === "random") {
      return amp * (rng() * 2 - 1);
    }
    return 0;
  }
  function _applyFestivalNudges(moons, ms, genFrom, genThru) {
    var calStart = fromSerial(genFrom);
    var calEnd = fromSerial(genThru);
    for (var yr = calStart.year; yr <= calEnd.year; yr++) {
      for (var fi = 0; fi < FESTIVAL_SOFT_ANCHORS.length; fi++) {
        var fest = FESTIVAL_SOFT_ANCHORS[fi];
        var festSerial = toSerial(yr, (fest.month | 0) - 1, fest.day | 0);
        if (festSerial < genFrom || festSerial > genThru) continue;
        if (_dN(festSerial, fest.salt + "_nudge", 6) !== 6) continue;
        var bestMoon = null, bestIdx = -1, bestDist = Infinity;
        for (var mi = 0; mi < moons.length; mi++) {
          var seq = ms.sequences[moons[mi].name];
          if (!seq) continue;
          for (var si = 0; si < seq.length; si++) {
            if (seq[si].type !== fest.type) continue;
            if (seq[si].gmForced) continue;
            var dist = Math.abs(seq[si].serial - festSerial);
            if (dist <= 1 && dist < bestDist) {
              bestDist = dist;
              bestMoon = moons[mi].name;
              bestIdx = si;
            }
          }
        }
        if (bestMoon && bestIdx >= 0) {
          var bestSeq = ms.sequences[bestMoon];
          _smoothToTarget(bestSeq, bestIdx, festSerial, 7);
          bestSeq[bestIdx].festivalNudge = fest.event;
          bestSeq.sort(function(a, b) {
            return a.serial - b.serial;
          });
        }
      }
    }
  }
  function _applyAntiPhaseCoupling(ms, moonAName, moonBName, genFrom, genThru) {
    var seqA = ms.sequences[moonAName];
    var seqB = ms.sequences[moonBName];
    if (!seqA || !seqB) return;
    for (var bi = 0; bi < seqB.length; bi++) {
      var evB = seqB[bi];
      if (evB.gmForced || evB.festivalNudge) continue;
      if (evB.serial < genFrom || evB.serial > genThru) continue;
      for (var ai = 0; ai < seqA.length; ai++) {
        var evA = seqA[ai];
        if (evA.type !== evB.type) continue;
        var dist = Math.abs(evA.serial - evB.serial);
        if (dist <= 3) {
          var direction = evB.serial >= evA.serial ? 1 : -1;
          evB.serial += direction;
          evB.antiPhaseCoupled = true;
          break;
        }
      }
    }
    seqB.sort(function(a, b) {
      return a.serial - b.serial;
    });
  }
  function _generateStandardSequence(moon, startSerial, endSerial, seedOverride) {
    var period = moon.synodicPeriod;
    var variation = moon.variation;
    var events2 = [];
    var epochSerial;
    if (moon.epochSeed) {
      var seedWord = seedOverride || moon.epochSeed.defaultSeed || "storm";
      var refD = moon.epochSeed.referenceDate;
      var refSerial = toSerial(refD.year, refD.month - 1, refD.day);
      epochSerial = refSerial - _moonHashStr(seedWord) * period;
    } else {
      epochSerial = startSerial;
    }
    var rngSeed = _moonHashStr(moon.name + (seedOverride || ""));
    var rng = _moonPrng(rngSeed);
    var cur = epochSerial;
    var ci = 0;
    if (cur > startSerial) {
      var approxCyclesBack = Math.ceil((cur - startSerial) / period) + 2;
      cur -= approxCyclesBack * period;
    }
    var MAX_REWIND = 2e3;
    while (cur + period < startSerial - period && MAX_REWIND-- > 0) {
      cur += period + _moonVariationStep(variation, ci++, rng);
    }
    var MAX_FWD = 800;
    while (cur <= endSerial && MAX_FWD-- > 0) {
      var thisOffset = _moonVariationStep(variation, ci, rng);
      var thisPeriod = Math.max(period * 0.25, period + thisOffset);
      var fullS = cur;
      var newS = cur + thisPeriod * 0.5;
      if (fullS >= startSerial && fullS <= endSerial)
        events2.push({ serial: fullS, type: "full", retro: false });
      if (newS >= startSerial && newS <= endSerial)
        events2.push({ serial: newS, type: "new", retro: false });
      cur += thisPeriod;
      ci++;
    }
    return events2;
  }
  function _smoothToTarget(seq, targetIdx, targetSerial, smoothingCycles) {
    smoothingCycles = Math.max(1, smoothingCycles | 0) || 7;
    var totalOffset = targetSerial - seq[targetIdx].serial;
    if (Math.abs(totalOffset) < 0.5) {
      seq[targetIdx].serial = targetSerial;
      return;
    }
    var targetType = seq[targetIdx].type;
    var priorIndices = [];
    for (var i = targetIdx - 1; i >= 0 && priorIndices.length < smoothingCycles; i--) {
      if (seq[i].type === targetType && !seq[i].gmForced) priorIndices.push(i);
    }
    var weights = [];
    var sumW = 0;
    for (var w = 0; w < priorIndices.length; w++) {
      var weight = priorIndices.length - w;
      weights.push(weight);
      sumW += weight;
    }
    var priorShare = sumW / (sumW + priorIndices.length + 1);
    var priorOffset = totalOffset * priorShare;
    for (var p = 0; p < priorIndices.length; p++) {
      var shift = Math.round(priorOffset * weights[p] / sumW);
      seq[priorIndices[p]].serial += shift;
    }
    seq[targetIdx].serial = targetSerial;
    seq[targetIdx].type = targetType;
    seq[targetIdx].retro = false;
  }
  function moonEnsureSequences(focusSerial, horizonExtraDays) {
    var st = ensureSettings();
    if (st.moonsEnabled === false) return;
    var ms = getMoonState();
    var cal = getCal();
    var cur = cal.current;
    var todayS = toSerial(cur.year, cur.month, cur.day_of_the_month);
    var focusS = isFinite(focusSerial) ? focusSerial | 0 : todayS;
    var extraDays = isFinite(horizonExtraDays) ? Math.max(0, horizonExtraDays | 0) : 0;
    var yearDays = _moonYearDays();
    var needThru = Math.max(todayS, focusS) + Math.max(MOON_PRE_GENERATE_YEARS * yearDays, extraDays);
    var wantFrom = Math.min(todayS, focusS) - yearDays;
    var priorFrom = isFinite(ms.generatedFrom) && ms.generatedFrom > 0 ? ms.generatedFrom : null;
    if (priorFrom != null && ms.generatedThru >= needThru && priorFrom <= wantFrom) return;
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys) return;
    var genFrom = priorFrom != null ? Math.min(priorFrom, wantFrom) : wantFrom;
    var globalSeed = ms.systemSeed != null && String(ms.systemSeed).trim() !== "" ? String(ms.systemSeed).trim() : null;
    sys.moons.forEach(function(moon) {
      var moonSeedOverride = ms.seeds[moon.name] || null;
      var seed = moonSeedOverride || (globalSeed ? globalSeed + "::" + moon.name : null);
      var seq = _generateStandardSequence(moon, genFrom, needThru, seed);
      var gmList = ms.gmAnchors[moon.name] || [];
      gmList.forEach(function(anchor) {
        if (anchor.serial < genFrom || anchor.serial > needThru) return;
        var halfWindow = (moon.synodicPeriod || 28) / 2;
        var nearest = null, nearestDist = Infinity;
        for (var k = 0; k < seq.length; k++) {
          if (seq[k].type !== anchor.type) continue;
          var dist = Math.abs(seq[k].serial - anchor.serial);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = k;
          }
        }
        if (nearest !== null && nearestDist <= halfWindow) {
          _smoothToTarget(seq, nearest, anchor.serial, 7);
          seq[nearest].gmForced = true;
        } else {
          seq.push({ serial: anchor.serial, type: anchor.type, retro: false, gmForced: true });
        }
      });
      seq.sort(function(a, b) {
        return a.serial - b.serial;
      });
      ms.sequences[moon.name] = seq;
    });
    _applyFestivalNudges(sys.moons, ms, genFrom, needThru);
    _applyAntiPhaseCoupling(ms, "Therendor", "Barrakas", genFrom, needThru);
    _longShadowsCache = {};
    ms.generatedFrom = genFrom;
    ms.generatedThru = needThru;
  }
  function _moonPhaseAtRaw(moonName, serial) {
    var seq = getMoonState().sequences[moonName] || [];
    if (!seq.length) return { illum: 0.5, waxing: true };
    var prev = null, next = null;
    for (var i = 0; i < seq.length; i++) {
      if (seq[i].type !== "full") continue;
      if (seq[i].serial <= serial) prev = seq[i];
      else if (!next) next = seq[i];
    }
    if (!prev && !next) return { illum: 0.5, waxing: true };
    if (!prev) return { illum: 0, waxing: true };
    if (!next) return { illum: 0.5, waxing: false };
    var span = next.serial - prev.serial;
    var pos = (serial - prev.serial) / span;
    var illum = 0.5 + 0.5 * Math.cos(pos * 2 * Math.PI);
    var waxing = pos > 0.5;
    return { illum, waxing };
  }
  var _longShadowsCache = {};
  function _longShadowsClaimedMoons(year) {
    if (_longShadowsCache[year]) return _longShadowsCache[year];
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons) {
      _longShadowsCache[year] = [];
      return [];
    }
    moonEnsureSequences();
    var vult27 = toSerial(year, 11, 27);
    var candidates = [];
    for (var i = 0; i < sys.moons.length; i++) {
      var moon = sys.moons[i];
      var seq = getMoonState().sequences[moon.name] || [];
      if (!seq.length) continue;
      for (var j = 0; j < seq.length; j++) {
        if (seq[j].type !== "new") continue;
        var dist = seq[j].serial - vult27;
        if (Math.abs(dist) <= 20) {
          candidates.push({ name: moon.name, seqIdx: j, newSerial: seq[j].serial, signedDist: dist, absDist: Math.abs(dist) });
        }
      }
    }
    if (!candidates.length) {
      _longShadowsCache[year] = [];
      return [];
    }
    candidates.sort(function(a, b) {
      return a.absDist - b.absDist;
    });
    var primary = candidates[0];
    var claimed = [{ name: primary.name, seqIdx: primary.seqIdx }];
    var primarySeq = getMoonState().sequences[primary.name];
    if (primarySeq && primary.seqIdx < primarySeq.length) {
      _smoothToTarget(primarySeq, primary.seqIdx, vult27, 7);
      primarySeq[primary.seqIdx].longShadowsClaimed = true;
      primarySeq.sort(function(a, b) {
        return a.serial - b.serial;
      });
    }
    var closestAbsDist = primary.absDist;
    var gobbleRadius;
    if (closestAbsDist <= 0) gobbleRadius = 3;
    else if (closestAbsDist <= 1) gobbleRadius = 2;
    else gobbleRadius = 1;
    for (var k = 1; k < candidates.length; k++) {
      var c = candidates[k];
      var alreadyClaimed = false;
      for (var ac = 0; ac < claimed.length; ac++) {
        if (claimed[ac].name === c.name) {
          alreadyClaimed = true;
          break;
        }
      }
      if (alreadyClaimed) continue;
      if (c.absDist <= gobbleRadius) {
        claimed.push({ name: c.name, seqIdx: c.seqIdx });
        var secSeq = getMoonState().sequences[c.name];
        if (secSeq && c.seqIdx < secSeq.length) {
          _smoothToTarget(secSeq, c.seqIdx, vult27, 5);
          secSeq[c.seqIdx].longShadowsClaimed = true;
          secSeq.sort(function(a, b) {
            return a.serial - b.serial;
          });
        }
      }
    }
    var claimedNames = [];
    for (var cn = 0; cn < claimed.length; cn++) claimedNames.push(claimed[cn].name);
    _longShadowsCache[year] = claimedNames;
    return claimed;
  }
  function _isLongShadowsOverride(moonName, serial) {
    var cal = fromSerial(serial);
    if (cal.mi !== 11) return false;
    if (cal.day < 26 || cal.day > 28) return false;
    try {
      var mabarState = getPlanarState("Mabar", serial);
      if (!mabarState || mabarState.phase !== "coterminous") return false;
    } catch (e) {
      return false;
    }
    var claimed = _longShadowsClaimedMoons(cal.year);
    for (var i = 0; i < claimed.length; i++) {
      if (claimed[i] === moonName) return true;
    }
    return false;
  }
  function moonPhaseAt(moonName, serial) {
    if (_isLongShadowsOverride(moonName, serial)) {
      return { illum: 0, waxing: false, longShadows: true };
    }
    return _moonPhaseAtRaw(moonName, serial);
  }
  function _moonPeakPhaseDay(moonName, serial) {
    var ph = _moonPhaseAtRaw(moonName, serial);
    if (!ph) return null;
    if (ph.illum >= MOON_FULL_THRESHOLD) return "full";
    if (ph.illum <= MOON_NEW_THRESHOLD) return "new";
    return null;
  }
  var MOON_FULL_THRESHOLD = 0.98;
  var MOON_NEW_THRESHOLD = 0.02;
  function _moonPhaseLabel(illum, waxing) {
    if (illum >= MOON_FULL_THRESHOLD) return "Full";
    if (illum >= 0.55) return (waxing ? "Waxing" : "Waning") + " Gibbous";
    if (illum >= 0.45) return (waxing ? "First" : "Last") + " Quarter";
    if (illum >= MOON_NEW_THRESHOLD) return (waxing ? "Waxing" : "Waning") + " Crescent";
    return "New";
  }
  function _moonPhaseEmoji(illum, waxing) {
    if (illum >= MOON_FULL_THRESHOLD) return "\u{1F315}";
    if (illum >= 0.55) return waxing ? "\u{1F314}" : "\u{1F316}";
    if (illum >= 0.45) return waxing ? "\u{1F313}" : "\u{1F317}";
    if (illum >= MOON_NEW_THRESHOLD) return waxing ? "\u{1F312}" : "\u{1F318}";
    return "\u{1F311}";
  }
  function _moonNextEvent(moonName, serial, type) {
    var seq = getMoonState().sequences[moonName] || [];
    if (!seq.length) return null;
    var lo = 0, hi = seq.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (seq[mid].serial <= serial) lo = mid + 1;
      else hi = mid;
    }
    for (var i = lo; i < seq.length; i++) {
      if (seq[i].type === type) return seq[i].serial;
    }
    return null;
  }
  var MOON_REVEAL_TIERS = { low: 1, medium: 2, high: 3 };
  function _normalizeMoonRevealTier(tier) {
    var t = String(tier || "").toLowerCase();
    if (MOON_REVEAL_TIERS[t]) return t;
    return "medium";
  }
  var MOON_SOURCE_LABELS = {
    low: "Common Knowledge",
    medium: "Skilled Forecast",
    high: "Expert Forecast"
  };
  function _moonPredictionWindow(d, period, amplitude, seed) {
    var remainingCycles = Math.max(0.1, d / period);
    var winWidth = Math.max(2, Math.round(amplitude * Math.sqrt(remainingCycles) * 1.3));
    var h = seed | 0;
    h = (h * 16807 + 0) % 2147483647;
    var frac = (h & 2147483647) / 2147483647;
    var placement = 0.15 + frac * 0.7;
    var daysBefore = Math.round(winWidth * placement);
    var daysAfter = winWidth - daysBefore;
    var lo = Math.max(1, d - daysBefore);
    var hi = d + daysAfter;
    return { lo, hi };
  }
  function _moonNextEventStr(moon, today, type, tier, horizonDays) {
    tier = _normalizeMoonRevealTier(tier);
    var exact = _moonNextEvent(moon.name, today, type);
    if (exact === null) return null;
    var d = Math.ceil(exact - today);
    if (d <= 0) return null;
    var label = type === "full" ? "Full" : "New";
    var cap = tier === "high" ? MOON_PREDICTION_LIMITS.highMaxDays : tier === "medium" ? MOON_PREDICTION_LIMITS.mediumMaxDays : MOON_PREDICTION_LIMITS.lowDays;
    var horizon = parseInt(horizonDays, 10);
    if (!isFinite(horizon) || horizon < 1) {
      if (tier === "low") horizon = MOON_PREDICTION_LIMITS.lowDays;
      else if (tier === "medium") horizon = 28;
      else horizon = 84;
    }
    horizon = Math.min(cap, horizon);
    function inDays(n) {
      return n === 1 ? "in 1 day" : "in " + n + " days";
    }
    if (d > horizon) {
      return label + ": beyond prediction";
    }
    var period = moon.synodicPeriod || 28;
    var evSeed = exact * 31 + (type === "full" ? 7 : 13);
    for (var si = 0; si < moon.name.length; si++) {
      evSeed = (evSeed << 5) - evSeed + moon.name.charCodeAt(si) | 0;
    }
    var amp = moon.variation && moon.variation.amplitude || 0;
    if (tier === "low") {
      var lowWin = _moonPredictionWindow(d, period, amp, evSeed);
      return lowWin.lo === lowWin.hi ? label + " in about " + lowWin.lo + " day" + (lowWin.lo === 1 ? "" : "s") : label + " in about " + lowWin.lo + "\u2013" + lowWin.hi + " days";
    }
    if (tier === "medium") {
      if (d <= period) {
        return label + " " + inDays(d);
      }
      var win = _moonPredictionWindow(d, period, amp, evSeed);
      return win.lo === win.hi ? label + " in about " + win.lo + " day" + (win.lo === 1 ? "" : "s") : label + " in about " + win.lo + "\u2013" + win.hi + " days";
    }
    return label + " " + inDays(d);
  }
  function _moonRowHtml(moon, today, tier, horizonDays) {
    tier = _normalizeMoonRevealTier(tier);
    var ph = moonPhaseAt(moon.name, today);
    var label = _moonPhaseLabel(ph.illum, ph.waxing);
    var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
    var pct = Math.round(ph.illum * 100);
    var longShadowsTag = "";
    if (ph.longShadows) {
      longShadowsTag = ' <span style="color:#9C27B0;font-size:.75em;" title="Mabar pulls this moon into darkness">\u{1F311} Long Shadows</span>';
    }
    var nextFull = _moonNextEventStr(moon, today, "full", tier, horizonDays);
    var nextNew = _moonNextEventStr(moon, today, "new", tier, horizonDays);
    var nextStr = "";
    var dFull = _moonNextEvent(moon.name, today, "full");
    var dNew = _moonNextEvent(moon.name, today, "new");
    if (dFull !== null && (dNew === null || dFull <= dNew))
      nextStr = nextFull || "";
    else if (dNew !== null)
      nextStr = nextNew || "";
    var dot = '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + esc(moon.color || "#aaa") + ';border:1px solid rgba(0,0,0,.3);margin-right:3px;vertical-align:middle;"></span>';
    var nameStyle = "";
    var ascendTag = "";
    if (moon.plane && ensureSettings().planesEnabled !== false) {
      try {
        var _plSt = getPlanarState(moon.plane, today);
        if (_plSt && _plSt.phase === "coterminous")
          ascendTag = ' <span style="' + applyBg("font-size:.75em;padding:0 3px;border-radius:3px;", "#FFE8A3", CONTRAST_MIN_HEADER) + '" title="' + esc(moon.plane) + ' coterminous">\u2728 ascendant</span>';
        else if (_plSt && _plSt.phase === "remote")
          ascendTag = ' <span style="opacity:.4;font-size:.75em;" title="' + esc(moon.plane) + ' remote">\u25CC dim</span>';
      } catch (e) {
      }
    }
    if (!ascendTag && moon.associatedMonth) {
      try {
        var _curCal = getCal().current;
        if (_curCal && _curCal.month + 1 === moon.associatedMonth)
          ascendTag = ' <span style="' + applyBg("font-size:.75em;padding:0 3px;border-radius:3px;", "#FFE8A3", CONTRAST_MIN_HEADER) + '">\u2728 ascendant</span>';
      } catch (e) {
      }
    }
    var infoParts = [emoji + " " + esc(label)];
    if (tier === "high") infoParts[0] += " (" + pct + "%)";
    var result = '<div style="margin:3px 0;line-height:1.4;">' + dot + '<b style="min-width:82px;display:inline-block;' + nameStyle + '">' + esc(moon.name) + '</b><span style="opacity:.9;">' + infoParts.join("") + "</span>" + ascendTag + longShadowsTag;
    if (nextStr) {
      result += '<span style="opacity:.45;font-size:.82em;margin-left:8px;">' + esc(nextStr) + "</span>";
    }
    if (tier === "high") {
      var secStr = "";
      if (dFull !== null && (dNew === null || dFull <= dNew))
        secStr = nextNew || "";
      else
        secStr = nextFull || "";
      if (secStr) {
        result += '<span style="opacity:.35;font-size:.78em;margin-left:6px;">' + esc(secStr) + "</span>";
      }
    }
    result += "</div>";
    return result;
  }
  function _moonMiniCalEvents(startSerial, endSerial, tier, baseHorizonDays) {
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    var out = [];
    if (!sys || !sys.moons || !sys.moons.length) return out;
    var start = startSerial | 0;
    var end = endSerial | 0;
    if (end < start) {
      var tmp = start;
      start = end;
      end = tmp;
    }
    var isMagical = _normalizeMoonRevealTier(tier) === "high";
    var today = todaySerial();
    for (var ser = start; ser <= end; ser++) {
      var fullMoons = [];
      var newMoons = [];
      for (var i = 0; i < sys.moons.length; i++) {
        var moon = sys.moons[i];
        if (!isMagical && isFinite(baseHorizonDays) && ser > today) {
          if (ser - today > baseHorizonDays) continue;
        }
        var peakType = _moonPeakPhaseDay(moon.name, ser);
        if (peakType === "full") {
          fullMoons.push(moon.name);
        } else if (peakType === "new") {
          var ph = moonPhaseAt(moon.name, ser);
          var lsTag = ph && ph.longShadows ? " (Long Shadows)" : "";
          newMoons.push(moon.name + lsTag);
        }
      }
      if (fullMoons.length) {
        out.push({
          serial: ser,
          name: fullMoons.map(function(n) {
            return "\u25CF " + n + " Full";
          }).join("\n"),
          color: "#FFD700"
        });
      }
      if (newMoons.length) {
        out.push({
          serial: ser,
          name: newMoons.map(function(n) {
            return "\u25CF " + n + " New";
          }).join("\n"),
          color: "#222222"
        });
      }
      if (isMagical) {
        var eNotes = _eclipseNotableToday(ser);
        for (var ei = 0; ei < eNotes.length; ei++) {
          out.push({
            serial: ser,
            name: "\u{1F318} " + _stripHtmlTags(eNotes[ei]),
            color: "#9575CD"
          });
        }
      }
    }
    return out;
  }
  function _moonPhaseCellColor(illum) {
    if (illum >= MOON_FULL_THRESHOLD) return "#FFD700";
    if (illum >= 0.55) return "#B0A060";
    if (illum >= 0.45) return "#808080";
    if (illum >= MOON_NEW_THRESHOLD) return "#505050";
    return "#222222";
  }
  function _singleMoonMiniCalEvents(moonName, startSerial, endSerial) {
    var out = [];
    for (var ser = startSerial; ser <= endSerial; ser++) {
      var ph = moonPhaseAt(moonName, ser);
      if (!ph) continue;
      var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
      var label = _moonPhaseLabel(ph.illum, ph.waxing);
      var pct = Math.round(ph.illum * 100);
      out.push({
        serial: ser,
        name: emoji + " " + label + " (" + pct + "%)",
        color: _moonPhaseCellColor(ph.illum)
      });
    }
    return out;
  }
  function _singleMoonMiniCalHtml(moonName, serial) {
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons) return "";
    var moonDef = null;
    for (var i = 0; i < sys.moons.length; i++) {
      if (sys.moons[i].name === moonName) {
        moonDef = sys.moons[i];
        break;
      }
    }
    if (!moonDef) return "";
    var mr = _monthRangeFromSerial(serial);
    moonEnsureSequences(mr.start, mr.end - mr.start + 60);
    var events2 = _singleMoonMiniCalEvents(moonName, mr.start, mr.end);
    var calHtml = _renderSyntheticMiniCal(moonDef.title || moonName, mr.start, mr.end, events2);
    var moonColor = moonDef.color || "#888";
    var preHeader = '<div style="background:' + moonColor + ";color:" + (_contrast(moonColor, "#FFFFFF") > 3 ? "#FFFFFF" : "#000000") + ';text-align:center;font-weight:bold;padding:3px 6px;font-size:.9em;border-radius:4px 4px 0 0;margin-bottom:-1px;">' + esc(moonName) + " \u2014 " + esc(moonDef.title || "") + "</div>";
    return preHeader + calHtml;
  }
  function _moonTodaySummaryHtml(today, tier, horizonDays) {
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons || !sys.moons.length) return "";
    tier = _normalizeMoonRevealTier(tier);
    var horizon = parseInt(horizonDays, 10);
    if (!isFinite(horizon) || horizon < 1) {
      if (tier === "low") horizon = MOON_PREDICTION_LIMITS.lowDays;
      else if (tier === "medium") horizon = 28;
      else horizon = 84;
    }
    var horizonEnd = today + horizon;
    var fullNow = [];
    var newNow = [];
    var best = null;
    for (var i = 0; i < sys.moons.length; i++) {
      var moon = sys.moons[i];
      var ph = moonPhaseAt(moon.name, today);
      if (!ph) continue;
      var _pt = _moonPeakPhaseDay(moon.name, today);
      if (_pt === "full") fullNow.push(moon.name);
      if (_pt === "new") newNow.push(moon.name + (ph.longShadows ? " (Long Shadows)" : ""));
      var fSer = _moonNextEvent(moon.name, today, "full");
      var nSer = _moonNextEvent(moon.name, today, "new");
      if (fSer != null && fSer > today && fSer <= horizonEnd && (!best || fSer < best.serial)) {
        best = { serial: fSer, moon: moon.name, type: "full", str: _moonNextEventStr(moon, today, "full", tier, horizon) };
      }
      if (nSer != null && nSer > today && nSer <= horizonEnd && (!best || nSer < best.serial)) {
        best = { serial: nSer, moon: moon.name, type: "new", str: _moonNextEventStr(moon, today, "new", tier, horizon) };
      }
    }
    var bits = [];
    if (fullNow.length) bits.push("\u{1F315} Full now: " + fullNow.join(", "));
    if (newNow.length) bits.push("\u{1F311} New now: " + newNow.join(", "));
    if (best) {
      bits.push("Next: " + (best.str || best.moon + " " + titleCase(best.type)));
    } else if (tier !== "high") {
      bits.push("Next: beyond prediction");
    }
    if (!bits.length) return "";
    return '<div style="font-size:.8em;opacity:.72;margin:2px 0 6px 0;">' + esc(bits.join(" \xB7 ")) + "</div>";
  }
  function moonPanelHtml(serialOverride) {
    var st = ensureSettings();
    if (st.moonsEnabled === false) {
      return _menuBox(
        "\u{1F319} Moons",
        '<div style="opacity:.7;">Moon system is disabled.</div><div style="margin-top:4px;font-size:.85em;">Enable: <code>!cal settings moons on</code></div>'
      );
    }
    var ms = getMoonState();
    var cal = getCal();
    var cur = cal.current;
    var today = isFinite(serialOverride) ? serialOverride | 0 : toSerial(cur.year, cur.month, cur.day_of_the_month);
    moonEnsureSequences(today, MOON_PREDICTION_LIMITS.highMaxDays);
    var dateLabel = dateLabelFromSerial(today);
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys) {
      return _menuBox("\u{1F319} Moons", '<div style="opacity:.7;">No moon data for this calendar system.</div>');
    }
    var rows = sys.moons.map(function(moon) {
      return _moonRowHtml(moon, today, "high", MOON_PREDICTION_LIMITS.highMaxDays);
    });
    var displayMode = _normalizeDisplayMode(st.moonDisplayMode);
    var verbose = _subsystemIsVerbose();
    var mr = _monthRangeFromSerial(today);
    var moonMiniEvents = _moonMiniCalEvents(mr.start, mr.end, "high");
    var moonMiniCal = _renderSyntheticMiniCal("Lunar Calendar", mr.start, mr.end, moonMiniEvents);
    var prevSer = _shiftSerialByMonth(today, -1);
    var nextSer = _shiftSerialByMonth(today, 1);
    var navRow = '<div style="margin:3px 0 6px 0;">' + button("\u25C0 Prev Month", "moon on " + _serialToDateSpec(prevSer)) + " " + button("Next Month \u25B6", "moon on " + _serialToDateSpec(nextSer)) + "</div>";
    var body = "";
    if (displayMode !== "list") {
      body += moonMiniCal;
      body += _legendLine(["\u{1F315} Full", "\u{1F311} New", "\u{1F318} Eclipse/Occultation"]);
      if (verbose) {
        body += '<div style="font-size:.78em;opacity:.6;margin:0 0 6px 0;">New/full phases are marked in moon colors. Hover days for details.</div>';
      }
    }
    if (displayMode !== "calendar") {
      body += rows.join("");
    }
    if (!body) {
      body = '<div style="opacity:.7;">No lunar display mode selected.</div>';
    }
    var tierLabel = titleCase(_normalizeMoonRevealTier(ms.revealTier || "medium"));
    var horizonLabel = _rangeLabel(ms.revealHorizonDays || 7);
    var seedLine = "";
    if (sys.moons && sys.moons.length) {
      var activeSeed = ms.systemSeed != null && String(ms.systemSeed).trim() !== "" ? String(ms.systemSeed) : "default";
      seedLine = '<div style="font-size:.78em;opacity:.5;margin-top:7px;border-top:1px solid rgba(255,255,255,.1);padding-top:5px;">System seed: <code>' + esc(activeSeed) + "</code> &nbsp;\xB7&nbsp; <code>!cal moon seed &lt;word&gt;</code></div>";
    }
    var sendBtns = MOON_REVEAL_PRESETS.map(function(p) {
      return button(p.label + " (" + p.dc + ")", "moon send medium " + p.days + "d");
    }).join(" ");
    var highBtns = MOON_REVEAL_PRESETS.map(function(p) {
      return button(p.label, "moon send high " + p.days + "d");
    }).join(" ");
    var moonViewBtns = sys.moons.map(function(moon) {
      return button(moon.name, "moon view " + moon.name);
    }).join(" ");
    var gmControls = '<div style="margin-top:6px;font-size:.82em;opacity:.7;"><div style="margin-bottom:2px;">Send Medium: ' + sendBtns + '</div><div style="margin-bottom:2px;">Send High: ' + highBtns + '</div><div style="margin-bottom:4px;margin-top:4px;">Individual: ' + moonViewBtns + "</div>" + button("\u{1F4D6} Lore", "moon lore") + " " + button("View: " + _displayModeLabel(displayMode), "settings mode moon " + _nextDisplayMode(displayMode)) + '</div><div style="font-size:.75em;opacity:.45;margin-top:3px;">Player tier: ' + esc(tierLabel) + " \xB7 CLI: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code></div>";
    return _menuBox(
      "\u{1F319} Moons \u2014 " + esc(dateLabel),
      navRow + _moonTodaySummaryHtml(today, "high", MOON_PREDICTION_LIMITS.highMaxDays) + body + seedLine + gmControls + '<div style="margin-top:7px;">' + button("\u2B05\uFE0F Back", "help root") + "</div>"
    );
  }
  function moonPlayerPanelHtml(serialOverride) {
    var st = ensureSettings();
    if (st.moonsEnabled === false) {
      return _menuBox("\u{1F319} Moons", '<div style="opacity:.7;">Moon system is not active.</div>');
    }
    var ms = getMoonState();
    var cal = getCal();
    var cur = cal.current;
    var tier = _normalizeMoonRevealTier(ms.revealTier || "medium");
    var horizon = parseInt(ms.revealHorizonDays, 10) || 7;
    var today = isFinite(serialOverride) ? serialOverride | 0 : toSerial(cur.year, cur.month, cur.day_of_the_month);
    moonEnsureSequences(today, horizon + 30);
    var dateLabel = dateLabelFromSerial(today);
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys) {
      return _menuBox("\u{1F319} Moons", '<div style="opacity:.7;">No moon data for this calendar system.</div>');
    }
    var pmr = _monthRangeFromSerial(today);
    var pMoonMiniEvents = _moonMiniCalEvents(pmr.start, pmr.end, tier, horizon);
    var pMoonMiniCal = _renderSyntheticMiniCal("Lunar Calendar", pmr.start, pmr.end, pMoonMiniEvents);
    var prevSer = _shiftSerialByMonth(today, -1);
    var nextSer = _shiftSerialByMonth(today, 1);
    var knownStart = todaySerial();
    var knownEnd = knownStart + horizon;
    function _navBtn(serial, label) {
      if (serial < knownStart || serial > knownEnd) {
        return '<span style="opacity:.35;">' + esc(label) + "</span>";
      }
      return button(label, "moon on " + _serialToDateSpec(serial));
    }
    var navRow = '<div style="margin:3px 0 6px 0;">' + _navBtn(prevSer, "\u25C0 Prev") + " " + _navBtn(nextSer, "Next \u25B6") + "</div>";
    var body = navRow;
    body += _moonTodaySummaryHtml(today, tier, horizon);
    body += pMoonMiniCal;
    body += _legendLine(["\u{1F315} Full", "\u{1F311} New"]);
    var notableLines = [];
    sys.moons.forEach(function(moon) {
      var peakType = _moonPeakPhaseDay(moon.name, today);
      if (peakType === "full") {
        notableLines.push("\u{1F315} <b>" + esc(moon.name) + "</b> is Full");
      } else if (peakType === "new") {
        var ph = moonPhaseAt(moon.name, today);
        var tag = ph && ph.longShadows ? ' \u2014 <span style="color:#9C27B0;">Long Shadows</span>' : "";
        notableLines.push("\u{1F311} <b>" + esc(moon.name) + "</b> is New" + tag);
      }
    });
    if (notableLines.length) {
      body += '<div style="font-size:.85em;margin-top:6px;line-height:1.6;">' + notableLines.join("<br>") + "</div>";
    } else {
      body += '<div style="font-size:.82em;opacity:.5;margin-top:6px;">No moons at full or new today.</div>';
    }
    if (tier === "high" && _eclipseNotableToday(today).length) {
      body += '<div style="font-size:.82em;margin-top:6px;line-height:1.6;">' + _eclipseNotableToday(today).join("<br>") + "</div>";
    }
    body += '<div style="margin-top:6px;">' + button("\u{1F4D6} Moon Lore", "moon lore") + " " + button("\u{1F30C} Sky Now", "moon sky") + "</div>";
    var srcLabel = MOON_SOURCE_LABELS[tier] || "";
    if (srcLabel) {
      body += '<div style="font-size:.72em;opacity:.35;font-style:italic;margin-top:5px;">' + esc(srcLabel) + "</div>";
    }
    return _menuBox("\u{1F319} Moons \u2014 " + esc(dateLabel), body);
  }
  function _moonParseMoonName(str, sys) {
    var s = str.toLowerCase();
    for (var i = 0; i < sys.moons.length; i++) {
      if (sys.moons[i].name.toLowerCase() === s) return sys.moons[i].name;
    }
    return null;
  }
  var MOON_ORBITAL_DATA = {
    Zarantyr: { diameter: _eberronMoonCore("Zarantyr").diameter, distance: _eberronMoonCore("Zarantyr").avgOrbitalDistance, angularSizeVsSun: 9.08, albedo: 0.12 },
    Olarune: { diameter: _eberronMoonCore("Olarune").diameter, distance: _eberronMoonCore("Olarune").avgOrbitalDistance, angularSizeVsSun: 5.73, albedo: 0.22 },
    Therendor: { diameter: _eberronMoonCore("Therendor").diameter, distance: _eberronMoonCore("Therendor").avgOrbitalDistance, angularSizeVsSun: 2.91, albedo: 0.99 },
    Eyre: { diameter: _eberronMoonCore("Eyre").diameter, distance: _eberronMoonCore("Eyre").avgOrbitalDistance, angularSizeVsSun: 2.38, albedo: 0.96 },
    Dravago: { diameter: _eberronMoonCore("Dravago").diameter, distance: _eberronMoonCore("Dravago").avgOrbitalDistance, angularSizeVsSun: 2.66, albedo: 0.76 },
    Nymm: { diameter: _eberronMoonCore("Nymm").diameter, distance: _eberronMoonCore("Nymm").avgOrbitalDistance, angularSizeVsSun: 0.98, albedo: 0.43 },
    Lharvion: { diameter: _eberronMoonCore("Lharvion").diameter, distance: _eberronMoonCore("Lharvion").avgOrbitalDistance, angularSizeVsSun: 1.11, albedo: 0.3 },
    Barrakas: { diameter: _eberronMoonCore("Barrakas").diameter, distance: _eberronMoonCore("Barrakas").avgOrbitalDistance, angularSizeVsSun: 1.07, albedo: 1.375 },
    Rhaan: { diameter: _eberronMoonCore("Rhaan").diameter, distance: _eberronMoonCore("Rhaan").avgOrbitalDistance, angularSizeVsSun: 0.49, albedo: 0.32 },
    Sypheros: { diameter: _eberronMoonCore("Sypheros").diameter, distance: _eberronMoonCore("Sypheros").avgOrbitalDistance, angularSizeVsSun: 0.62, albedo: 0.071 },
    Aryth: { diameter: _eberronMoonCore("Aryth").diameter, distance: _eberronMoonCore("Aryth").avgOrbitalDistance, angularSizeVsSun: 0.69, albedo: 0.275 },
    Vult: { diameter: _eberronMoonCore("Vult").diameter, distance: _eberronMoonCore("Vult").avgOrbitalDistance, angularSizeVsSun: 0.74, albedo: 0.23 }
  };
  var RING_OF_SIBERYS = {
    // A single equatorial ring of siberys dragonshards. Physical parameters
    // derived from Saturn's rings but scaled to fit inside Zarantyr's orbit
    // (14,300 km). Saturn's ring system spans ~1.1–2.3 planet radii; if
    // Eberron is ~6,400 km radius, the ring fits at ~1.1–1.9 Eberron radii.
    analog: "Saturn's rings",
    composition: "Siberys dragonshards",
    innerEdge_km: 7e3,
    // just above atmosphere
    outerEdge_km: 12e3,
    // well inside Zarantyr at 14,300 km
    width_km: 5e3,
    // single visible band
    thickness_m: 10,
    // Saturn-analog: incredibly thin
    albedo: 0.5,
    // Saturn B-ring average
    inclination: 0,
    // equatorial
    // Saturn's ring particle composition analog
    particleSizes: "Dust to boulder-sized dragonshard fragments",
    appearance: {
      daylight: "A brilliant equatorial arc of golden-white light, visible even in full sunlight.",
      night: "A sweeping band of light across the sky. Casts faint but real shadows on clear nights.",
      equator: "Seen edge-on as a thin bright line directly overhead.",
      poles: "A wide luminous arch spanning the sky from horizon to horizon."
    },
    facts: [
      "The Ring is 5,000 km wide but only ~10 meters thick.",
      "If scaled to a dinner plate, the Ring would be thousands of times thinner than a sheet of paper.",
      "Siberys shards that fall from the Ring are the rarest and most valuable dragonshards.",
      "Ring particles orbit at different speeds: inner fragments orbit faster than outer ones."
    ]
  };
  var NIGHTLIGHT_AMBIENT_LUX = 0.01;
  var NIGHTLIGHT_OVERCAST_MULT = 0.15;
  var NIGHTLIGHT_EARTH_MOON_LUX = 0.25;
  var NIGHTLIGHT_EARTH_ALBEDO = 0.12;
  var NIGHTLIGHT_OVERHEAD_FRACTION = 0.5;
  function nighttimeLux(serial, precipStage) {
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons || !sys.moons.length) return { total: NIGHTLIGHT_AMBIENT_LUX, moons: [], ambient: NIGHTLIGHT_AMBIENT_LUX };
    var moonContributions = [];
    var totalMoonLux = 0;
    for (var i = 0; i < sys.moons.length; i++) {
      var moon = sys.moons[i];
      var ph = moonPhaseAt(moon.name, serial);
      if (!ph || ph.illum < 0.01) continue;
      var orb = MOON_ORBITAL_DATA[moon.name];
      if (!orb) continue;
      var angSq = orb.angularSizeVsSun * orb.angularSizeVsSun;
      var alb = orb.albedo || 0.12;
      var rawLux = NIGHTLIGHT_EARTH_MOON_LUX * angSq * (alb / NIGHTLIGHT_EARTH_ALBEDO) * ph.illum;
      var effectiveLux = rawLux * NIGHTLIGHT_OVERHEAD_FRACTION;
      if (effectiveLux >= 1e-3) {
        moonContributions.push({
          name: moon.name,
          illum: ph.illum,
          lux: effectiveLux,
          angularSize: orb.angularSizeVsSun,
          albedo: alb
        });
        totalMoonLux += effectiveLux;
      }
    }
    var cloudMult = 1;
    if (typeof precipStage === "number") {
      if (precipStage >= 3) cloudMult = NIGHTLIGHT_OVERCAST_MULT;
      else if (precipStage === 2) cloudMult = 0.35;
      else if (precipStage === 1) cloudMult = 0.7;
    }
    var totalLux = (NIGHTLIGHT_AMBIENT_LUX + totalMoonLux) * cloudMult;
    moonContributions.sort(function(a, b) {
      return b.lux - a.lux;
    });
    return {
      total: Math.round(totalLux * 1e3) / 1e3,
      // 3 decimal places
      moons: moonContributions,
      ambient: Math.round(NIGHTLIGHT_AMBIENT_LUX * cloudMult * 1e3) / 1e3,
      cloudMult
    };
  }
  function nighttimeLightCondition(lux) {
    var shadow = lux * 0.1;
    if (lux >= 1) return {
      condition: "bright",
      label: "Bright Moonlight",
      emoji: "\u{1F315}",
      note: "Bright light. No vision restrictions.",
      shadow: shadow >= 0.3 ? "dim" : "dark",
      shadowNote: shadow >= 0.3 ? "In shadow (trees, overhangs): dim light." : "In shadow: darkness. Darkvision or light source needed."
    };
    if (lux >= 0.3) return {
      condition: "dim",
      label: "Dim Moonlight",
      emoji: "\u{1F317}",
      note: "Dim light. Enough to fight by. Disadvantage on Perception.",
      shadow: "dark",
      shadowNote: "In shadow: darkness. Darkvision or light source needed."
    };
    if (lux >= 0.03) return {
      condition: "dim",
      label: "Faint Moonlight",
      emoji: "\u{1F318}",
      note: "Dim light (faint). Disadvantage on Perception. Hard to see detail.",
      shadow: "dark",
      shadowNote: "In shadow: darkness."
    };
    return {
      condition: "darkness",
      label: "Near Darkness",
      emoji: "\u{1F311}",
      note: "Darkness. Effectively blind without darkvision.",
      shadow: "dark",
      shadowNote: "Dark everywhere, open or covered."
    };
  }
  function nighttimeLightHtml(serial) {
    var precipStage = 0;
    var weatherNote = "";
    var rec = _forecastRecord(serial);
    if (rec && rec.final) {
      precipStage = rec.final.precip || 0;
      if (precipStage >= 3) weatherNote = "Heavy cloud/precipitation \u2014 moonlight severely reduced.";
      else if (precipStage === 2) weatherNote = "Overcast sky \u2014 moonlight dimmed.";
      else if (precipStage === 1) weatherNote = "Partly cloudy \u2014 moonlight slightly dimmed.";
    }
    var result = nighttimeLux(serial, precipStage);
    var cond = nighttimeLightCondition(result.total);
    var html = '<div style="margin-bottom:4px;"><b>' + cond.emoji + " " + esc(cond.label) + '</b> <span style="opacity:.6;">(' + result.total + " lux)</span></div>";
    html += '<div style="font-size:.88em;margin:2px 0;">' + esc(cond.note) + "</div>";
    html += '<div style="font-size:.85em;opacity:.7;margin:2px 0;">\u{1F332} ' + esc(cond.shadowNote) + "</div>";
    if (weatherNote) {
      html += '<div style="font-size:.85em;opacity:.7;margin:2px 0;">\u2601 ' + esc(weatherNote) + "</div>";
    }
    if (result.moons.length > 0) {
      var topMoons = result.moons.slice(0, 3);
      var moonBits = [];
      for (var i = 0; i < topMoons.length; i++) {
        var m = topMoons[i];
        moonBits.push(esc(m.name) + " " + Math.round(m.illum * 100) + "%");
      }
      var moreCount = result.moons.length - 3;
      html += '<div style="font-size:.82em;opacity:.55;margin-top:3px;">Sources: ' + moonBits.join(", ") + (moreCount > 0 ? ", +" + moreCount + " more" : "") + "</div>";
    }
    if (result.cloudMult < 1) {
      html += '<div style="font-size:.82em;opacity:.55;">Cloud cover: \xD7' + result.cloudMult.toFixed(2) + "</div>";
    }
    return html;
  }
  var MOON_MOTION_TUNING = {
    // Luna analog:        ecc 0.0549, inc 5.145°
    Zarantyr: { inclinationBase: 5.145, inclinationAmp: 1.5, inclinationPeriodDays: 336, ascendingNode: 120, nodePrecessionDegPerYear: 12, distanceSwingPct: 0.11, distancePeriodDays: 336, apsisAngle: 20, apsisPrecessionDegPerYear: 24 },
    // Titan analog:       ecc 0.0288, inc 0.33°
    Olarune: { inclinationBase: 0.33, inclinationAmp: 0.15, inclinationPeriodDays: 504, ascendingNode: 60, nodePrecessionDegPerYear: 8, distanceSwingPct: 0.058, distancePeriodDays: 448, apsisAngle: 80, apsisPrecessionDegPerYear: 12 },
    // Dione analog:       ecc 0.0022, inc 0.03°
    Therendor: { inclinationBase: 0.03, inclinationAmp: 0.01, inclinationPeriodDays: 336, ascendingNode: 210, nodePrecessionDegPerYear: 10, distanceSwingPct: 44e-4, distancePeriodDays: 336, apsisAngle: 140, apsisPrecessionDegPerYear: 10 },
    // Mimas analog:       ecc 0.0196, inc 1.53°
    Eyre: { inclinationBase: 1.53, inclinationAmp: 0.2, inclinationPeriodDays: 336, ascendingNode: 25, nodePrecessionDegPerYear: 2, distanceSwingPct: 0.0392, distancePeriodDays: 84, apsisAngle: 10, apsisPrecessionDegPerYear: 120 },
    // Triton analog:      ecc 0.000016, inc 156.8° (retrograde)
    Dravago: { inclinationBase: 156.8, inclinationAmp: 0.15, inclinationPeriodDays: 672, ascendingNode: 260, nodePrecessionDegPerYear: 6, distanceSwingPct: 0, distancePeriodDays: 672, apsisAngle: 200, apsisPrecessionDegPerYear: 18 },
    // Ganymede analog:    ecc 0.0013, inc 0.20°
    Nymm: { inclinationBase: 0.2, inclinationAmp: 0.05, inclinationPeriodDays: 336, ascendingNode: 0, nodePrecessionDegPerYear: 360, distanceSwingPct: 26e-4, distancePeriodDays: 336, apsisAngle: 0, apsisPrecessionDegPerYear: 0 },
    // Hyperion analog:    ecc 0.1230, inc 0.43°
    Lharvion: { inclinationBase: 0.43, inclinationAmp: 0.2, inclinationPeriodDays: 420, ascendingNode: 40, nodePrecessionDegPerYear: 10, distanceSwingPct: 0.246, distancePeriodDays: 560, apsisAngle: 300, apsisPrecessionDegPerYear: 80 },
    // Enceladus analog:   ecc 0.0047, inc 0.02°
    Barrakas: { inclinationBase: 0.02, inclinationAmp: 0.01, inclinationPeriodDays: 168, ascendingNode: 300, nodePrecessionDegPerYear: 24, distanceSwingPct: 94e-4, distancePeriodDays: 224, apsisAngle: 260, apsisPrecessionDegPerYear: 48 },
    // Miranda analog:     ecc 0.0013, inc 4.34°
    Rhaan: { inclinationBase: 4.34, inclinationAmp: 0.6, inclinationPeriodDays: 441, ascendingNode: 45, nodePrecessionDegPerYear: 6, distanceSwingPct: 26e-4, distancePeriodDays: 504, apsisAngle: 90, apsisPrecessionDegPerYear: 8 },
    // Phobos analog:      ecc 0.0151, inc 1.08°
    Sypheros: { inclinationBase: 1.08, inclinationAmp: 0.2, inclinationPeriodDays: 560, ascendingNode: 180, nodePrecessionDegPerYear: 4, distanceSwingPct: 0.0302, distancePeriodDays: 560, apsisAngle: 150, apsisPrecessionDegPerYear: 5 },
    // Iapetus analog:     ecc 0.0283, inc 7.57°
    Aryth: { inclinationBase: 7.57, inclinationAmp: 0.4, inclinationPeriodDays: 336, ascendingNode: 15, nodePrecessionDegPerYear: 14, distanceSwingPct: 0.0566, distancePeriodDays: 336, apsisAngle: 0, apsisPrecessionDegPerYear: 16 },
    // Oberon analog:      ecc 0.0014, inc 0.07°
    Vult: { inclinationBase: 0.07, inclinationAmp: 0.03, inclinationPeriodDays: 1008, ascendingNode: 330, nodePrecessionDegPerYear: 2, distanceSwingPct: 28e-4, distancePeriodDays: 1008, apsisAngle: 250, apsisPrecessionDegPerYear: 2 }
  };
  function _normDeg(n) {
    n = n % 360;
    return n < 0 ? n + 360 : n;
  }
  function _moonOrbitalParams(moonName, serial) {
    serial = serial || 0;
    var canon = MOON_ORBITAL_DATA[moonName] || null;
    var tune = MOON_MOTION_TUNING[moonName] || null;
    if (canon && tune) {
      var ypd = _moonYearDays() || 336;
      var incPeriod = Math.max(1, tune.inclinationPeriodDays || ypd);
      var distPeriod = Math.max(1, tune.distancePeriodDays || ypd);
      var incl = (tune.inclinationBase || 0) + (tune.inclinationAmp || 0) * Math.sin(serial * 2 * Math.PI / incPeriod);
      var node = _normDeg((tune.ascendingNode || 0) + serial * ((tune.nodePrecessionDegPerYear || 0) / ypd));
      var apsis = _normDeg((tune.apsisAngle || 0) + serial * ((tune.apsisPrecessionDegPerYear || 0) / ypd));
      var eccWave = Math.sin(serial * 2 * Math.PI / distPeriod);
      var distFactor = 1 + (tune.distanceSwingPct || 0) * eccWave;
      var dist = canon.distance * distFactor;
      return {
        inclination: incl,
        ascendingNode: node,
        apsis,
        apparentSize: canon.angularSizeVsSun / Math.max(0.5, distFactor),
        diameter: canon.diameter,
        distance: dist
      };
    }
    var h = 0;
    for (var i = 0; i < moonName.length; i++) {
      h = (h << 5) - h + moonName.charCodeAt(i) | 0;
    }
    var r = function() {
      h = (h * 16807 + 0) % 2147483647;
      return (h & 2147483647) / 2147483647;
    };
    r();
    r();
    var out = {
      inclination: 2 + r() * 6,
      ascendingNode: r() * 360,
      apparentSize: canon ? canon.angularSizeVsSun : 0.3 + r() * 0.7,
      diameter: canon ? canon.diameter : 1e3,
      distance: canon ? canon.distance : 1e5
    };
    out.apsis = r() * 360;
    return out;
  }
  function _moonDistanceAt(moon, serial) {
    var op = _moonOrbitalParams(moon.name, serial);
    if (op && isFinite(op.distance)) return op.distance;
    return moon.distance || 1e5;
  }
  function _moonSkyLong(moon, serial) {
    var period = moon.synodicPeriod || 28;
    var ph = moonPhaseAt(moon.name, serial);
    var angle;
    if (ph.waxing) {
      angle = ph.illum * 180;
    } else {
      angle = 180 + (1 - ph.illum) * 180;
    }
    return angle % 360;
  }
  function _sunSkyLong(serial) {
    var ypd = _planarYearDays();
    return serial % ypd / ypd * 360;
  }
  function _moonEclipticLat(moon, serial) {
    var op = _moonOrbitalParams(moon.name, serial);
    var skyLong = _moonSkyLong(moon, serial);
    var relLong = skyLong - op.ascendingNode;
    return op.inclination * Math.sin(relLong * Math.PI / 180);
  }
  function _degSeparation(a, b) {
    var d = Math.abs(a - b);
    return d > 180 ? 360 - d : d;
  }
  var OBSERVER_LATITUDE = 30;
  function _moonAltitude(moon, serial, timeFrac) {
    if (!moon) return -90;
    var skyLong = _moonSkyLong(moon, serial);
    var eclLat = _moonEclipticLat(moon, serial);
    var sunLong = _sunSkyLong(serial);
    var ha = (skyLong - sunLong - 180 + timeFrac * 360) % 360;
    if (ha < 0) ha += 360;
    if (ha > 180) ha = ha - 360;
    var haRad = ha * Math.PI / 180;
    var latRad = OBSERVER_LATITUDE * Math.PI / 180;
    var decRad = eclLat * Math.PI / 180;
    var sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
  }
  function _moonVisCategory(altDeg) {
    if (altDeg > 60) return "overhead";
    if (altDeg > 30) return "high";
    if (altDeg > 10) return "visible";
    if (altDeg > 0) return "horizon";
    return "below";
  }
  var MOON_VIS_LABELS = {
    overhead: { label: "Overhead", icon: "\u2B06", order: 0, desc: "High in the sky, directly above." },
    high: { label: "High", icon: "\u2197", order: 1, desc: "Well above the horizon." },
    visible: { label: "Visible", icon: "\u2192", order: 2, desc: "Above the horizon, in the sky." },
    horizon: { label: "On horizon", icon: "\u2198", order: 3, desc: "Low on the horizon." },
    below: { label: "Below horizon", icon: "\u2193", order: 4, desc: "Not visible." }
  };
  function _moonVisibilityAll(serial, timeFrac) {
    if (timeFrac == null) timeFrac = 0;
    var st = ensureSettings();
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons) return [];
    var results = [];
    for (var i = 0; i < sys.moons.length; i++) {
      var moon = sys.moons[i];
      var alt = _moonAltitude(moon, serial, timeFrac);
      var cat = _moonVisCategory(alt);
      var ph = moonPhaseAt(moon.name, serial);
      results.push({
        moon,
        altitude: Math.round(alt),
        category: cat,
        vis: MOON_VIS_LABELS[cat],
        phase: ph
      });
    }
    results.sort(function(a, b) {
      return b.altitude - a.altitude;
    });
    return results;
  }
  function _moonVisibilityHtml(serial, timeFrac) {
    var all = _moonVisibilityAll(serial, timeFrac);
    if (!all.length) return "";
    var groups = {};
    var catOrder = ["overhead", "high", "visible", "horizon", "below"];
    for (var ci = 0; ci < catOrder.length; ci++) groups[catOrder[ci]] = [];
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      groups[r.category].push(r);
    }
    var html = "";
    for (var gi = 0; gi < catOrder.length; gi++) {
      var cat = catOrder[gi];
      var g = groups[cat];
      if (!g.length) continue;
      var vis = MOON_VIS_LABELS[cat];
      html += '<div style="margin:3px 0;"><b>' + vis.icon + " " + esc(vis.label) + "</b>";
      var names = [];
      for (var mi = 0; mi < g.length; mi++) {
        var r = g[mi];
        var ph = r.phase;
        var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
        var pct = Math.round(ph.illum * 100);
        names.push(emoji + " " + esc(r.moon.name) + ' <span style="opacity:.5;">(' + pct + "%)</span>");
      }
      html += '<div style="margin-left:12px;font-size:.88em;">' + names.join(", ") + "</div>";
      html += "</div>";
    }
    return html;
  }
  function _clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
  var _SUN_ANGULAR_DIAM_DEG = 0.53;
  var _eclipseDayCache = /* @__PURE__ */ Object.create(null);
  function _eclipseTimeBlock(frac) {
    var h = (frac % 1 + 1) % 1 * 24;
    if (h < 4.8) return "early_morning";
    if (h < 9.6) return "morning";
    if (h < 14.4) return "afternoon";
    if (h < 19.2) return "evening";
    return "late_night";
  }
  function _moonByName(sys, name) {
    var moons = sys && sys.moons ? sys.moons : [];
    for (var i = 0; i < moons.length; i++) {
      if (moons[i].name === name) return moons[i];
    }
    return null;
  }
  function _diskOverlapFraction(rFront, rBack, sep) {
    rFront = Math.max(0, rFront || 0);
    rBack = Math.max(0, rBack || 0);
    sep = Math.max(0, sep || 0);
    if (rFront <= 0 || rBack <= 0) return 0;
    if (sep >= rFront + rBack) return 0;
    if (sep <= Math.abs(rFront - rBack)) {
      var fullyCoveredArea = Math.PI * Math.min(rFront, rBack) * Math.min(rFront, rBack);
      return _clamp01(fullyCoveredArea / (Math.PI * rBack * rBack));
    }
    var _c1 = (sep * sep + rFront * rFront - rBack * rBack) / (2 * sep * rFront);
    var _c2 = (sep * sep + rBack * rBack - rFront * rFront) / (2 * sep * rBack);
    _c1 = Math.max(-1, Math.min(1, _c1));
    _c2 = Math.max(-1, Math.min(1, _c2));
    var a1 = Math.acos(_c1);
    var a2 = Math.acos(_c2);
    var area = rFront * rFront * a1 + rBack * rBack * a2 - 0.5 * Math.sqrt(Math.max(0, (-sep + rFront + rBack) * (sep + rFront - rBack) * (sep - rFront + rBack) * (sep + rFront + rBack)));
    return _clamp01(area / (Math.PI * rBack * rBack));
  }
  function _eclipseMetricsAt(sys, e, t) {
    if (!e) return null;
    if (e.kind === "solar") {
      var sm = _moonByName(sys, e.moon);
      if (!sm) return null;
      var op = _moonOrbitalParams(sm.name, t);
      var dLong = _degSeparation(_moonSkyLong(sm, t), _sunSkyLong(t));
      var dLat = Math.abs(_moonEclipticLat(sm, t));
      var sepDeg = Math.sqrt(dLong * dLong + dLat * dLat);
      var sepSun = sepDeg / _SUN_ANGULAR_DIAM_DEG;
      var rMoon = (op.apparentSize || 0) / 2;
      var rSun = 0.5;
      return {
        cover: _diskOverlapFraction(rMoon, rSun, sepSun),
        occulting: sm.name,
        occluded: "Sun",
        occludingDiameter: op.apparentSize || 0,
        occludedDiameter: 1,
        skyMoon: sm.name
      };
    }
    if (e.kind === "lunar") {
      var moonA = _moonByName(sys, e.a);
      var moonB = _moonByName(sys, e.b);
      if (!moonA || !moonB) return null;
      var distA = _moonDistanceAt(moonA, t);
      var distB = _moonDistanceAt(moonB, t);
      var front = distA <= distB ? moonA : moonB;
      var back = front === moonA ? moonB : moonA;
      var fop = _moonOrbitalParams(front.name, t);
      var bop = _moonOrbitalParams(back.name, t);
      var dLong2 = _degSeparation(_moonSkyLong(front, t), _moonSkyLong(back, t));
      var dLat2 = Math.abs(_moonEclipticLat(front, t) - _moonEclipticLat(back, t));
      var sepDeg2 = Math.sqrt(dLong2 * dLong2 + dLat2 * dLat2);
      var sepSun2 = sepDeg2 / _SUN_ANGULAR_DIAM_DEG;
      return {
        cover: _diskOverlapFraction((fop.apparentSize || 0) / 2, (bop.apparentSize || 0) / 2, sepSun2),
        occulting: front.name,
        occluded: back.name,
        occludingDiameter: fop.apparentSize || 0,
        occludedDiameter: bop.apparentSize || 0,
        skyMoon: front.name
      };
    }
    return null;
  }
  function _eclipsePeakSkyLabel(sys, moonName, t) {
    var moon = _moonByName(sys, moonName);
    if (!moon) return null;
    var frac = (t % 1 + 1) % 1;
    var alt = _moonAltitude(moon, t, frac);
    var cat = _moonVisCategory(alt);
    if (cat === "below") return null;
    return (MOON_VIS_LABELS[cat] || {}).label || null;
  }
  function _eclipseCacheKey(serial) {
    var st = ensureSettings();
    var ms = getMoonState();
    return [
      st.calendarSystem || "",
      serial | 0,
      ms.systemSeed || "",
      JSON.stringify(ms.gmAnchors || {}),
      ms.generatedFrom || "",
      ms.generatedThru || ""
    ].join("|");
  }
  function _finalizeEclipseEvent(sys, startT, endT, peak) {
    if (!peak || !peak.metrics) return null;
    var cover = _clamp01(peak.metrics.cover || 0);
    if (cover <= 0) return null;
    var peakSkyLabel = _eclipsePeakSkyLabel(sys, peak.metrics.skyMoon, peak.t);
    if (!peakSkyLabel) return null;
    var sizeRatio = (peak.metrics.occludingDiameter || 0) / Math.max(1e-4, peak.metrics.occludedDiameter || 0);
    var typeLabel = cover > 0.98 ? "Total Eclipse" : sizeRatio > 0.75 ? "Partial Eclipse" : "Transit";
    return {
      id: [peak.metrics.occulting, peak.metrics.occluded, Math.round(peak.t * 96)].join("|"),
      occulting: peak.metrics.occulting,
      occluded: peak.metrics.occluded,
      typeLabel,
      startT,
      peakT: peak.t,
      endT,
      startDay: Math.floor(startT),
      peakDay: Math.floor(peak.t),
      endDay: Math.floor(endT),
      startBucket: _eclipseTimeBlock(startT),
      peakBucket: _eclipseTimeBlock(peak.t),
      endBucket: _eclipseTimeBlock(endT),
      peakCoverage: cover,
      peakCoveragePct: Math.max(1, Math.round(cover * 100)),
      sizeRatio,
      sizePct: Math.max(1, Math.round(sizeRatio * 100)),
      peakSkyLabel
    };
  }
  function _eclipseTimingClause(kind, event, serial) {
    var bucketLabel = _weatherPeriodLabel(event[kind + "Bucket"]);
    var day = event[kind + "Day"];
    if (kind === "start") {
      if (day < serial) return "Began yesterday in the " + bucketLabel;
      if (day > serial) return "Beginning tomorrow in the " + bucketLabel;
      return "Beginning in the " + bucketLabel;
    }
    if (kind === "peak") {
      if (day < serial) return "Peaked yesterday in the " + bucketLabel + " while " + event.peakSkyLabel;
      if (day > serial) return "Peaking tomorrow in the " + bucketLabel + " while " + event.peakSkyLabel;
      return "Peaking in the " + bucketLabel + " while " + event.peakSkyLabel;
    }
    if (day < serial) return "Ended yesterday in the " + bucketLabel;
    if (day > serial) return "Ending tomorrow in the " + bucketLabel;
    return (event.startDay < serial ? "Ending this " : "Ending in the ") + bucketLabel;
  }
  function _eclipseLifecycleText(event, serial) {
    return [
      _eclipseTimingClause("start", event, serial),
      _eclipseTimingClause("peak", event, serial),
      _eclipseTimingClause("end", event, serial)
    ].join(", ") + ".";
  }
  function _eclipseSentenceType(typeLabel) {
    return typeLabel === "Transit" ? "Transit" : typeLabel.replace(" Eclipse", " eclipse");
  }
  function getEclipses(serial) {
    var st = ensureSettings();
    if (st.moonsEnabled === false) return [];
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons) return [];
    serial = serial | 0;
    moonEnsureSequences(serial, 3);
    var cacheKey = _eclipseCacheKey(serial);
    if (_eclipseDayCache[cacheKey]) return _eclipseDayCache[cacheKey];
    var descriptors = [];
    var moons = sys.moons;
    for (var i = 0; i < moons.length; i++) {
      descriptors.push({ kind: "solar", moon: moons[i].name });
    }
    for (var a = 0; a < moons.length; a++) {
      for (var b = a + 1; b < moons.length; b++) {
        descriptors.push({ kind: "lunar", a: moons[a].name, b: moons[b].name });
      }
    }
    var eclipses = [];
    var windowStart = serial - 1;
    var windowEnd = serial + 2;
    var dt = 1 / 96;
    for (var di = 0; di < descriptors.length; di++) {
      var active = false;
      var startT = 0;
      var endT = 0;
      var peak = null;
      for (var t = windowStart; t <= windowEnd + 1e-9; t += dt) {
        var metrics = _eclipseMetricsAt(sys, descriptors[di], t);
        var cover = metrics ? metrics.cover : 0;
        if (cover > 0) {
          if (!active) {
            active = true;
            startT = t;
            peak = { t, metrics };
          }
          endT = t;
          if (!peak || cover > (peak.metrics.cover || 0)) {
            peak = { t, metrics };
          }
        } else if (active) {
          var finished = _finalizeEclipseEvent(sys, startT, endT, peak);
          if (finished && finished.startT < serial + 1 && finished.endT >= serial) {
            eclipses.push(finished);
          }
          active = false;
          peak = null;
        }
      }
      if (active) {
        var trailing = _finalizeEclipseEvent(sys, startT, endT, peak);
        if (trailing && trailing.startT < serial + 1 && trailing.endT >= serial) {
          eclipses.push(trailing);
        }
      }
    }
    eclipses.sort(function(x, y) {
      return x.peakT - y.peakT;
    });
    _eclipseDayCache[cacheKey] = eclipses;
    _cullCacheIfLarge(_eclipseDayCache, 180);
    return eclipses;
  }
  function _eclipseNotableToday(serial) {
    var ecl = getEclipses(serial);
    var notes = [];
    for (var i = 0; i < ecl.length; i++) {
      var ev = ecl[i];
      notes.push(
        "\u{1F318} <b>" + esc(_eclipseSentenceType(ev.typeLabel)) + "</b> of " + esc(ev.occluded) + " by " + esc(ev.occulting) + ", covering " + ev.peakCoveragePct + "% of " + esc(ev.occluded) + ". " + esc(ev.occulting) + " appears " + ev.sizePct + "% as wide as " + esc(ev.occluded) + ". " + esc(_eclipseLifecycleText(ev, serial))
      );
    }
    return notes;
  }
  function getTidalIndex(serial) {
    var st = ensureSettings();
    if (st.moonsEnabled === false) return 5;
    var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys || !sys.moons) return 5;
    moonEnsureSequences();
    var moon = null;
    for (var i = 0; i < sys.moons.length; i++) {
      if (String(sys.moons[i].name || "").toLowerCase() === "zarantyr") {
        moon = sys.moons[i];
        break;
      }
    }
    if (!moon) return 5;
    var ph = moonPhaseAt(moon.name, serial);
    var alignment = Math.abs(Math.cos(ph.illum * Math.PI));
    var phaseScale = 0.2 + 0.8 * alignment;
    var baseDist = moon.distance || 1e5;
    var distNow = _moonDistanceAt(moon, serial);
    var distBoost = Math.pow(baseDist / Math.max(1, distNow), 3);
    var raw = phaseScale * distBoost;
    var tune = MOON_MOTION_TUNING[moon.name] || {};
    var swing = Math.max(0, tune.distanceSwingPct || 0);
    var minRaw = 0.2 * Math.pow(1 / (1 + swing), 3);
    var maxRaw = 1 * Math.pow(1 / Math.max(0.01, 1 - swing), 3);
    var scaled = (raw - minRaw) / Math.max(1e-4, maxRaw - minRaw);
    return Math.max(0, Math.min(10, Math.round(scaled * 10)));
  }
  function tidalLabel(index) {
    if (index <= 1) return "Dead calm (neap)";
    if (index <= 3) return "Low tides";
    if (index <= 5) return "Normal tides";
    if (index <= 7) return "High tides";
    if (index <= 8) return "Spring tides";
    return "Extreme tides \u2014 coastal flooding risk";
  }
  function getLongShadowsMoons(year) {
    var claimed = _longShadowsClaimedMoons(year);
    var results = [];
    for (var i = 0; i < claimed.length; i++) {
      results.push({ name: claimed[i] });
    }
    return results;
  }
  var GENERATED_SEALED = { "Dal Quor": true };
  var PLANAR_GENERATED_EVENT_PROFILE = {
    // SHAVARATH — The Eternal Battleground
    // "Frequently grows coterminous for a single day." d20 attack roll + d12 damage.
    // d20(14-20) × d12(12). P = 7/240 ≈ 1/34. ~9.8 events/yr. 1d only. 100% coterminous.
    // Suppressed during canonical remote year.
    "Shavarath": {
      expectedPerYear: 9.8,
      mechanism: "standard",
      dice: [
        { die: 20, hit: [14, 20] },
        { die: 12, hit: 12 }
      ],
      duration: 1,
      phaseBias: 100,
      loreNote: "Shavarath spills into the world in sudden violent bursts \u2014 single-day battle spikes that were critical for strategy during the Last War."
    },
    // LAMANNIA — The Twilight Forest
    // LAMANNIA — The Twilight Forest
    // Baker: coterminous/remote "often tied to its associated moon Olarune's phases"
    // Hybrid mechanism: ~70% moon-tied (Olarune full/new), ~30% standard dice.
    // Moon-tied: on Olarune full days, d20 hit 18-20 (15%) → coterminous.
    //            on Olarune new days, d20 hit 1-3 (15%) → remote.
    //   ~10 full + ~10 new days/yr × 15% = ~3.0 moon-tied events/yr.
    // Standard fallback: d100 hit 1 (remote) or 100 (coterminous) → ~1.2/yr.
    // Total: ~4.2 events/yr. d3 duration.
    "Lamannia": {
      expectedPerYear: 4.2,
      mechanism: "hybrid_moon",
      moonName: "Olarune",
      moonDie: 20,
      moonFullHit: [18, 20],
      // 18-20 on full → coterminous
      moonNewHit: [1, 3],
      // 1-3 on new → remote
      fallbackDice: [
        { die: 100, hit: 100, remoteHit: 1 }
      ],
      duration: { die: 3 },
      phaseBias: "dice",
      loreNote: "Lamannia pulses with the natural world \u2014 its surges often track the phases of Olarune, the Sentinel Moon. When the moon is full, primal energy floods in. When the moon is dark, the world feels distant from nature."
    },
    // FERNIA — The Sea of Fire (linked with Risia)
    // Single d20: 20=Fernia, 1=Risia. Then d10: 1=remote, 10=coterminous.
    // Per-plane P = 1/100. ~3.36 events/yr each. d3 duration. 50/50 phase.
    // Only one of Fernia/Risia can fire per day (mutually exclusive).
    "Fernia": {
      expectedPerYear: 3.4,
      mechanism: "linked",
      linkedWith: "Risia",
      selectorDie: 20,
      selectorHit: 20,
      // Fernia fires on 20
      dice: [
        { die: 10, hit: 10, remoteHit: 1 }
      ],
      duration: { die: 3 },
      phaseBias: "dice",
      loreNote: "Fernia flares are sudden and intense \u2014 eruptions of heat between canonical cycles."
    },
    // RISIA — The Plain of Ice (linked with Fernia)
    // Same d20 selector: 1=Risia. Then d10: 1=remote, 10=coterminous.
    "Risia": {
      expectedPerYear: 3.4,
      mechanism: "linked",
      linkedWith: "Fernia",
      selectorDie: 20,
      selectorHit: 1,
      // Risia fires on 1
      dice: [
        { die: 10, hit: 10, remoteHit: 1 }
      ],
      duration: { die: 3 },
      phaseBias: "dice",
      loreNote: "Risia creeps in slowly, like frost on a windowpane \u2014 cold surges between canonical cycles."
    },
    // THELANIS — The Faerie Court
    // d20(20) × d12(1=remote, 12=coterminous). P = 2/240 = 1/120. ~2.8 events/yr.
    // Duration: 3d or 7d (coin flip). Story-number durations.
    "Thelanis": {
      expectedPerYear: 2.8,
      mechanism: "standard",
      dice: [
        { die: 20, hit: 20 },
        { die: 12, hit: 12, remoteHit: 1 }
      ],
      duration: { options: [3, 7], weights: [50, 50] },
      phaseBias: "dice",
      loreNote: "Thelanis moves to the rhythm of stories \u2014 its generated events arrive in narrative beats of three or seven days."
    },
    // IRIAN — The Eternal Dawn
    // d4(4) × d4(4) × d20(1=remote, 20=coterminous). P = 2/320 = 1/160. ~2.1 events/yr.
    // d3 duration. 50/50 phase.
    "Irian": {
      expectedPerYear: 2.1,
      mechanism: "standard",
      dice: [
        { die: 4, hit: 4 },
        { die: 4, hit: 4 },
        { die: 20, hit: 20, remoteHit: 1 }
      ],
      duration: { die: 3 },
      phaseBias: "dice",
      loreNote: "Irian surges feel like unexpected dawn \u2014 warmth and light swelling gently."
    },
    // MABAR — The Endless Night
    // d20(1) × d4(1), then d4(1-3=coterminous, 4=remote). P = 1/80. ~4.2 events/yr.
    // 1 night (coterminous) or 1 day (remote) only.
    // Coterminous events are night-only; remote events are day-only.
    "Mabar": {
      expectedPerYear: 4.2,
      mechanism: "standard",
      dice: [
        { die: 20, hit: 1 },
        { die: 4, hit: 1 }
      ],
      duration: 1,
      phaseBias: 75,
      // 3/4 coterminous, 1/4 remote — matches 15:5 canonical ratio
      phaseNote: { coterminous: "(night only \u2014 sundown to sunrise)", remote: "(day only \u2014 sunrise to sundown)" },
      loreNote: "Non-canonical Mabar surges are deeply feared. Coterminous shifts bring darkness at night; remote brings respite during the day."
    },
    // DOLURRH — The Realm of the Dead (moon-tied to Aryth)
    // No daily dice. On Aryth full moon: d20(11-20)=coterminous. On Aryth new moon: d20(11-20)=remote.
    // Aryth period: 48d = 7 cycles/yr. ~3.5 cot + ~3.5 remote per year. 1d only.
    "Dolurrh": {
      expectedPerYear: 7,
      mechanism: "moontied",
      moonName: "Aryth",
      moonDie: 20,
      moonHitRange: [11, 20],
      // roll 11-20 = fires (50% on full/new day)
      fullMoonPhase: "coterminous",
      newMoonPhase: "remote",
      duration: 1,
      loreNote: "Dolurrh shifts are tied to the movements of the moon Aryth \u2014 like a death saving throw at the gateway between worlds."
    },
    // DAANVI — The Perfect Order (cooldown-based)
    // d20 daily (1 only = 5%), then d10: 1-5=remote, 6-10=coterminous (50/50).
    // ~16.8 events/year. 10-day events + 10-day cooldown.
    // Balancing Act mechanic:
    // For 10 days after an event ends, if a new event triggers, roll d10.
    // If d10 >= (11 - days_since_last_event_ended), force opposite phase.
    // Day 1: always forced opposite. Day 10: 10% chance. Day 11+: no forcing.
    "Daanvi": {
      expectedPerYear: 16.8,
      mechanism: "cooldown",
      gateDie: 20,
      gateHitRange: [1, 1],
      // 5% per day — about 16.8 events/year
      phaseDie: 10,
      // 1-5=remote, 6-10=coterminous (50/50)
      duration: 10,
      balancingAct: true,
      // Balancing Act — favors alternation (cot->rem->cot)
      loreNote: "Daanvi follows orderly cycles: coterminous, nothing, remote, nothing. The 50/50 split with balancing act enforces alternation."
    },
    // KYTHRI — The Churning Chaos
    // d100 (100=coterminous, 1=remote). P = 2/100 = 1/50. ~6.72 events/yr.
    // d12 duration (1-12 days). No mechanical effects.
    "Kythri": {
      expectedPerYear: 6.7,
      mechanism: "standard",
      dice: [
        { die: 100, hit: 100, remoteHit: 1 }
      ],
      duration: { die: 12 },
      phaseBias: "dice",
      loreNote: "Kythri lurches erratically \u2014 generated shifts suit it better than any fixed rhythm. No discernable effects on the Material Plane."
    },
    // XORIAT — The Realm of Madness
    // d100(1) × d4(1). P = 1/400. ~0.84 events/yr.
    // d20 duration (1-20 days). Remote only. Rarer than Kythri, longer.
    "Xoriat": {
      expectedPerYear: 0.84,
      mechanism: "standard",
      dice: [
        { die: 100, hit: 1 },
        { die: 4, hit: 1 }
      ],
      duration: { die: 20 },
      phaseBias: 0,
      // 100% remote
      loreNote: "Xoriat shifts are slow and creeping \u2014 the Realm of Madness seeping through the Gatekeeper seals. Remote only."
    },
    // SYRANIA — The Azure Sky
    // d100(100) × d4(4) × d8(1=remote, 8=coterminous). P = 2/3200 = 1/1600. ~0.21 events/yr.
    // 1d only. 50/50 phase. Coterminous forces clear/calm weather.
    "Syrania": {
      expectedPerYear: 0.21,
      mechanism: "standard",
      dice: [
        { die: 100, hit: 100 },
        { die: 4, hit: 4 },
        { die: 8, hit: 8, remoteHit: 1 }
      ],
      duration: 1,
      phaseBias: "dice",
      weatherOverride: { coterminous: { precip: 0, wind: 0 } },
      loreNote: "Syrania generated events are moments of unexpected serenity \u2014 or the sudden absence of peace. Coterminous days bring clear skies."
    },
    // DAL QUOR — The Region of Dreams (sealed — no generation)
    "Dal Quor": { mechanism: "sealed" },
    __default: { mechanism: "standard", dice: [{ die: 100, hit: 1 }, { die: 20, hit: 1 }], duration: { die: 3 }, phaseBias: 50 }
  };
  function _generatedEventDurationDays(planeName, serial) {
    var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName] || PLANAR_GENERATED_EVENT_PROFILE.__default;
    var dur = profile.duration;
    if (typeof dur === "number") return dur;
    if (dur && typeof dur.die === "number") {
      return Math.max(1, _dN(serial, planeName + "_gen_dur", dur.die));
    }
    if (dur && dur.options && dur.weights) {
      var r = _dN(serial, planeName + "_gen_dur_pick", 100);
      var cumul = 0;
      for (var i = 0; i < dur.options.length; i++) {
        cumul += dur.weights[i];
        if (r <= cumul) return dur.options[i];
      }
      return dur.options[dur.options.length - 1];
    }
    return Math.max(1, _dN(serial, planeName + "_gen_dur_fb", 3));
  }
  function _generatedEventStartsOnDay(planeName, serial) {
    if (GENERATED_SEALED[planeName]) return null;
    var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName] || PLANAR_GENERATED_EVENT_PROFILE.__default;
    if (!profile || profile.mechanism === "sealed") return null;
    var salt = planeName + "_gen_" + serial;
    if (profile.mechanism === "standard") {
      var diceArr = profile.dice || [];
      var phaseFromDice = null;
      for (var di = 0; di < diceArr.length; di++) {
        var d = diceArr[di];
        var roll = _dN(serial, salt + "_d" + di, d.die);
        var hit = false;
        if (Array.isArray(d.hit)) {
          hit = roll >= d.hit[0] && roll <= d.hit[1];
        } else {
          hit = roll === d.hit;
        }
        var remoteHit = false;
        if (d.remoteHit != null) {
          if (Array.isArray(d.remoteHit)) {
            remoteHit = roll >= d.remoteHit[0] && roll <= d.remoteHit[1];
          } else {
            remoteHit = roll === d.remoteHit;
          }
        }
        if (!hit && !remoteHit) return null;
        if (remoteHit && !hit) phaseFromDice = "remote";
        else if (hit && !remoteHit && d.remoteHit != null) phaseFromDice = "coterminous";
      }
      var dur = _generatedEventDurationDays(planeName, serial);
      var phase;
      if (profile.phaseBias === "dice" && phaseFromDice) {
        phase = phaseFromDice;
      } else if (typeof profile.phaseBias === "number") {
        var pRoll = _dN(serial, salt + "_phase", 100);
        phase = pRoll <= profile.phaseBias ? "coterminous" : "remote";
      } else {
        phase = "coterminous";
      }
      return {
        startSerial: serial,
        endSerial: serial + dur - 1,
        durationDays: dur,
        phase
      };
    }
    if (profile.mechanism === "linked") {
      var pairKey = [planeName, profile.linkedWith].sort().join("_");
      var selRoll = _dN(serial, "linked_" + pairKey + "_sel_" + serial, profile.selectorDie);
      if (selRoll !== profile.selectorHit) return null;
      var linkedDice = profile.dice || [];
      var linkedPhase = null;
      for (var li = 0; li < linkedDice.length; li++) {
        var ld = linkedDice[li];
        var lRoll = _dN(serial, salt + "_ld" + li, ld.die);
        var lHit = lRoll === ld.hit;
        var lRemHit = ld.remoteHit != null && lRoll === ld.remoteHit;
        if (!lHit && !lRemHit) return null;
        if (lRemHit && !lHit) linkedPhase = "remote";
        else if (lHit && !lRemHit) linkedPhase = "coterminous";
      }
      var lDur = _generatedEventDurationDays(planeName, serial);
      return {
        startSerial: serial,
        endSerial: serial + lDur - 1,
        durationDays: lDur,
        phase: linkedPhase || "coterminous"
      };
    }
    if (profile.mechanism === "moontied") {
      try {
        var moonPh = moonPhaseAt(profile.moonName, serial);
        if (!moonPh) return null;
        var isFull = moonPh.illum >= 0.97;
        var isNew = moonPh.illum < 0.03;
        if (!isFull && !isNew) return null;
        var moonRoll = _dN(serial, salt + "_moon", profile.moonDie);
        var moonRange = profile.moonHitRange || [11, 20];
        if (moonRoll < moonRange[0] || moonRoll > moonRange[1]) return null;
        var moonPhase = isFull ? profile.fullMoonPhase || "coterminous" : profile.newMoonPhase || "remote";
        var moonDur = typeof profile.duration === "number" ? profile.duration : 1;
        return {
          startSerial: serial,
          endSerial: serial + moonDur - 1,
          durationDays: moonDur,
          phase: moonPhase,
          moonTriggered: true
        };
      } catch (e) {
        return null;
      }
    }
    if (profile.mechanism === "hybrid_moon") {
      try {
        var hmMoonPh = moonPhaseAt(profile.moonName, serial);
        if (hmMoonPh) {
          var hmIsFull = hmMoonPh.illum >= 0.97;
          var hmIsNew = hmMoonPh.illum < 0.03;
          if (hmIsFull || hmIsNew) {
            var hmMoonRoll = _dN(serial, salt + "_hmoon", profile.moonDie);
            var hmHitRange = hmIsFull ? profile.moonFullHit : profile.moonNewHit;
            if (hmHitRange && hmMoonRoll >= hmHitRange[0] && hmMoonRoll <= hmHitRange[1]) {
              var hmDur = _generatedEventDurationDays(planeName, serial);
              var hmPhase = hmIsFull ? "coterminous" : "remote";
              return {
                startSerial: serial,
                endSerial: serial + hmDur - 1,
                durationDays: hmDur,
                phase: hmPhase,
                moonTriggered: true
              };
            }
            return null;
          }
        }
      } catch (e) {
      }
      var hmFbDice = profile.fallbackDice || [];
      var hmFbPhaseFromDice = null;
      for (var hfi = 0; hfi < hmFbDice.length; hfi++) {
        var hfd = hmFbDice[hfi];
        var hfRoll = _dN(serial, salt + "_hfb" + hfi, hfd.die);
        var hfHit = false;
        if (Array.isArray(hfd.hit)) {
          hfHit = hfRoll >= hfd.hit[0] && hfRoll <= hfd.hit[1];
        } else {
          hfHit = hfRoll === hfd.hit;
        }
        var hfRemHit = false;
        if (hfd.remoteHit != null) {
          if (Array.isArray(hfd.remoteHit)) {
            hfRemHit = hfRoll >= hfd.remoteHit[0] && hfRoll <= hfd.remoteHit[1];
          } else {
            hfRemHit = hfRoll === hfd.remoteHit;
          }
        }
        if (!hfHit && !hfRemHit) return null;
        if (hfRemHit && !hfHit) hmFbPhaseFromDice = "remote";
        else if (hfHit && !hfRemHit && hfd.remoteHit != null) hmFbPhaseFromDice = "coterminous";
      }
      var hmFbDur = _generatedEventDurationDays(planeName, serial);
      var hmFbPhase;
      if (profile.phaseBias === "dice" && hmFbPhaseFromDice) {
        hmFbPhase = hmFbPhaseFromDice;
      } else {
        var hmFbPhaseRoll = _dN(serial, salt + "_hfb_phase", 100);
        hmFbPhase = hmFbPhaseRoll <= 50 ? "coterminous" : "remote";
      }
      return {
        startSerial: serial,
        endSerial: serial + hmFbDur - 1,
        durationDays: hmFbDur,
        phase: hmFbPhase
      };
    }
    if (profile.mechanism === "cooldown") {
      var gateRoll = _dN(serial, salt + "_gate", profile.gateDie);
      var gRange = profile.gateHitRange || [100, 100];
      if (gateRoll < gRange[0] || gateRoll > gRange[1]) return null;
      var phDie = _dN(serial, salt + "_phaseDie", profile.phaseDie);
      var halfPoint = Math.floor(profile.phaseDie / 2);
      var coolPhase = phDie <= halfPoint ? "remote" : "coterminous";
      var coolDur = typeof profile.duration === "number" ? profile.duration : 10;
      if (profile.balancingAct) {
        var scanLimit = coolDur + 12;
        for (var bScan = 1; bScan <= scanLimit; bScan++) {
          var prevCheck = serial - bScan;
          var prevGate = _dN(prevCheck, planeName + "_gen_" + prevCheck + "_gate", profile.gateDie);
          if (prevGate < gRange[0] || prevGate > gRange[1]) continue;
          var prevPhDie = _dN(prevCheck, planeName + "_gen_" + prevCheck + "_phaseDie", profile.phaseDie);
          var prevHalf = Math.floor(profile.phaseDie / 2);
          var prevPhase = prevPhDie <= prevHalf ? "remote" : "coterminous";
          var prevEnd = prevCheck + coolDur - 1;
          var daysSinceEnd = serial - prevEnd;
          if (daysSinceEnd >= 1 && daysSinceEnd <= 10) {
            var balanceRoll = _dN(serial, salt + "_balance", 10);
            var threshold = 11 - daysSinceEnd;
            if (balanceRoll >= threshold) {
              coolPhase = prevPhase === "coterminous" ? "remote" : "coterminous";
            }
          }
          break;
        }
      }
      return {
        startSerial: serial,
        endSerial: serial + coolDur - 1,
        durationDays: coolDur,
        phase: coolPhase
      };
    }
    return null;
  }
  var _ANOMALY_MAX_SCAN = 30;
  function _generatedEventAt(planeName, serial) {
    if (GENERATED_SEALED[planeName]) return null;
    var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName];
    if (profile && profile.mechanism === "sealed") return null;
    var evt = _generatedEventStartsOnDay(planeName, serial);
    if (evt) return evt;
    for (var offset = 1; offset <= _ANOMALY_MAX_SCAN; offset++) {
      evt = _generatedEventStartsOnDay(planeName, serial - offset);
      if (evt && serial <= evt.endSerial) return evt;
    }
    return null;
  }
  function isGeneratedShift(planeName, serial) {
    if (GENERATED_SEALED[planeName]) return false;
    try {
      if (ensureSettings().offCyclePlanes === false) return false;
    } catch (e) {
      return false;
    }
    try {
      var ps = getPlanesState();
      if (ps && ps.overrides && ps.overrides[planeName]) return false;
      if (ps && ps.anchors && ps.anchors[planeName]) return false;
      if (ps && ps.suppressedEvents && ps.suppressedEvents[planeName]) {
        var evt = _generatedEventAt(planeName, serial);
        if (evt && ps.suppressedEvents[planeName][evt.startSerial]) return false;
      }
      if (ps && ps.gmCustomEvents && ps.gmCustomEvents[planeName]) {
        var gmEvts = ps.gmCustomEvents[planeName];
        var thisEvt = _generatedEventAt(planeName, serial);
        if (thisEvt && gmEvts.length > 0) {
          var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName];
          var expectedPerYear = profile && profile.expectedPerYear || 3;
          var maxReach = Math.round(168 / Math.max(1, expectedPerYear));
          for (var gci = 0; gci < gmEvts.length; gci++) {
            var gmSer = gmEvts[gci].serial;
            var distToGm = Math.abs(thisEvt.startSerial - gmSer);
            if (distToGm <= maxReach) {
              var isNearest = true;
              for (var scan = 1; scan <= maxReach; scan++) {
                var before = _generatedEventAt(planeName, gmSer - scan);
                if (before && before.startSerial !== thisEvt.startSerial && Math.abs(before.startSerial - gmSer) < distToGm) {
                  isNearest = false;
                  break;
                }
                var after = _generatedEventAt(planeName, gmSer + scan);
                if (after && after.startSerial !== thisEvt.startSerial && Math.abs(after.startSerial - gmSer) < distToGm) {
                  isNearest = false;
                  break;
                }
              }
              if (isNearest) return false;
            }
          }
        }
      }
    } catch (e) {
      return false;
    }
    try {
      var canonState = getPlanarState(planeName, serial, { ignoreGenerated: true });
      if (canonState && !canonState.overridden && (canonState.phase === "coterminous" || canonState.phase === "remote")) {
        var planeData = _getPlaneData(planeName);
        if (planeData && planeData.type === "cyclic") return false;
      }
    } catch (e) {
    }
    return !!_generatedEventAt(planeName, serial);
  }
  function _generatedPhase(planeName, serial) {
    var evt = _generatedEventAt(planeName, serial);
    return evt && evt.phase ? evt.phase : "coterminous";
  }
  function _nextGeneratedForecast(planeName, serial, maxDays) {
    if (GENERATED_SEALED[planeName]) return null;
    try {
      if (ensureSettings().offCyclePlanes === false) return null;
    } catch (e) {
      return null;
    }
    maxDays = Math.max(0, maxDays | 0);
    if (maxDays <= 0) return null;
    var current = _generatedEventAt(planeName, serial);
    if (current) {
      return {
        phase: current.phase,
        daysUntilStart: 0,
        durationDays: current.durationDays,
        startSerial: current.startSerial,
        endSerial: current.endSerial,
        activeNow: true
      };
    }
    for (var d = 1; d <= maxDays; d++) {
      var evt = _generatedEventStartsOnDay(planeName, serial + d);
      if (evt) {
        return {
          phase: evt.phase,
          daysUntilStart: d,
          durationDays: evt.durationDays,
          startSerial: evt.startSerial,
          endSerial: evt.endSerial,
          activeNow: false
        };
      }
    }
    return null;
  }
  function handleMoonCommand(m, args) {
    var sub = String(args[1] || "").toLowerCase();
    var st = ensureSettings();
    if (!sub || sub === "show") {
      moonEnsureSequences();
      if (playerIsGM(m.playerid)) {
        return whisper(m.who, moonPanelHtml());
      } else {
        return whisper(m.who, moonPlayerPanelHtml());
      }
    }
    if (sub === "lore" || sub === "info") {
      var loreSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      if (!loreSys || !loreSys.moons) return whisper(m.who, "No moon data available.");
      var loreName = String(args[2] || "").trim();
      if (!loreName) {
        var loreButtons = loreSys.moons.map(function(moon) {
          return button(moon.name, "moon lore " + moon.name);
        });
        loreButtons.push(button("\u{1F48E} Ring of Siberys", "moon lore siberys"));
        return whisper(m.who, _menuBox(
          "\u{1F319} Moon Lore",
          '<div style="margin-bottom:4px;">Select a moon to learn about:</div>' + loreButtons.join(" ")
        ));
      }
      if (loreName.toLowerCase() === "siberys" || loreName.toLowerCase() === "ring") {
        return whisper(m.who, _siberysLoreHtml());
      }
      var resolvedLore = _moonParseMoonName(loreName, loreSys);
      if (!resolvedLore) return whisper(m.who, "Unknown moon: <b>" + esc(loreName) + "</b>. Try <code>!cal moon lore</code> for a list.");
      var loreHtml = _moonLoreHtml(resolvedLore);
      if (!loreHtml) return whisper(m.who, "No lore available for <b>" + esc(resolvedLore) + "</b>.");
      return whisper(m.who, loreHtml);
    }
    if (sub === "sky" || sub === "visible" || sub === "up") {
      moonEnsureSequences();
      var today = todaySerial();
      var timeArg = String(args[2] || "").toLowerCase().trim();
      var timeFrac = 0;
      var timeLabel = "Midnight";
      if (timeArg === "morning" || timeArg === "dawn") {
        timeFrac = 0.75;
        timeLabel = "Dawn";
      } else if (timeArg === "noon" || timeArg === "midday") {
        timeFrac = 0.5;
        timeLabel = "Noon";
      } else if (timeArg === "afternoon") {
        timeFrac = 0.375;
        timeLabel = "Afternoon";
      } else if (timeArg === "evening" || timeArg === "dusk") {
        timeFrac = 0.25;
        timeLabel = "Dusk";
      }
      var dateLabel = dateLabelFromSerial(today);
      var visHtml = _moonVisibilityHtml(today, timeFrac);
      if (!visHtml) visHtml = '<div style="opacity:.6;">No visibility data available.</div>';
      var timeButtons = button("Midnight", "moon sky midnight") + " " + button("Dawn", "moon sky dawn") + " " + button("Noon", "moon sky noon") + " " + button("Dusk", "moon sky dusk");
      return whisper(m.who, _menuBox(
        "\u{1F319} Sky at " + esc(timeLabel) + " \u2014 " + esc(dateLabel),
        visHtml + '<div style="margin-top:6px;font-size:.82em;">' + timeButtons + "</div>"
      ));
    }
    if (!playerIsGM(m.playerid)) {
      if (sub === "on" || sub === "date") {
        var pDateToks = args.slice(2).map(function(t) {
          return String(t || "").trim();
        }).filter(Boolean);
        var pPref = parseDatePrefixForAdd(pDateToks);
        if (!pPref) {
          return whisper(m.who, "Usage: <code>!cal moon on &lt;dateSpec&gt;</code>");
        }
        var pSerial = toSerial(pPref.year, pPref.mHuman - 1, pPref.day);
        var pToday = todaySerial();
        var pHorizon = parseInt(getMoonState().revealHorizonDays, 10) || 7;
        if (pSerial < pToday || pSerial > pToday + pHorizon) {
          return whisper(m.who, "That date is beyond your lunar knowledge.");
        }
        moonEnsureSequences(pSerial, pHorizon + 30);
        return whisper(m.who, moonPlayerPanelHtml(pSerial));
      }
      if (sub === "view" || sub === "cal") {
        var pViewName = String(args[2] || "").trim();
        var pViewSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
        if (!pViewName) {
          var pViewBtns = pViewSys.moons.map(function(moon) {
            return button(moon.name, "moon view " + moon.name);
          });
          return whisper(m.who, _menuBox(
            "\u{1F319} Moon Calendar",
            '<div style="margin-bottom:4px;">Select a moon:</div>' + pViewBtns.join(" ") + '<div style="margin-top:6px;">' + button("\u2B05 Back", "moon") + "</div>"
          ));
        }
        var pViewMoon = _moonParseMoonName(pViewName, pViewSys);
        if (!pViewMoon) return whisper(m.who, "Unknown moon: <b>" + esc(pViewName) + "</b>.");
        var pViewSerial = todaySerial();
        if (args[3]) {
          var pViewDateToks = args.slice(3).map(function(t) {
            return String(t || "").trim();
          }).filter(Boolean);
          var pViewPref = parseDatePrefixForAdd(pViewDateToks);
          if (pViewPref) pViewSerial = toSerial(pViewPref.year, pViewPref.mHuman - 1, pViewPref.day);
        }
        moonEnsureSequences(pViewSerial, 60);
        var pCalBody = _singleMoonMiniCalHtml(pViewMoon, pViewSerial);
        var pPrevS = _shiftSerialByMonth(pViewSerial, -1);
        var pNextS = _shiftSerialByMonth(pViewSerial, 1);
        var pViewNav = '<div style="margin:4px 0;">' + button("\u25C0 Prev", "moon view " + pViewMoon + " " + _serialToDateSpec(pPrevS)) + " " + button("Next \u25B6", "moon view " + pViewMoon + " " + _serialToDateSpec(pNextS)) + "</div>";
        return whisper(m.who, _menuBox(
          "\u{1F319} " + esc(pViewMoon),
          pViewNav + pCalBody + '<div style="margin-top:6px;">' + button("\u2B05 All Moons", "moon") + "</div>"
        ));
      }
      return whisper(
        m.who,
        "Moon: <code>!cal moon</code> &nbsp;\xB7&nbsp; <code>!cal moon on &lt;dateSpec&gt;</code> &nbsp;\xB7&nbsp; <code>!cal moon view &lt;name&gt;</code>"
      );
    }
    if (sub === "send") {
      var tierRaw = String(args[2] || "").toLowerCase();
      if (!tierRaw)
        return whisper(m.who, "Usage: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>");
      var tierArg = MOON_REVEAL_TIERS[tierRaw] ? tierRaw : null;
      if (!tierArg)
        return whisper(m.who, "Usage: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>");
      var reqHorizon = _parseMoonRevealRange(args[3], tierArg);
      if (!reqHorizon)
        return whisper(m.who, "Usage: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>");
      moonEnsureSequences(todaySerial(), reqHorizon + 30);
      var ms0 = getMoonState();
      var cal0 = getCal();
      var cur0 = cal0.current;
      var today0 = toSerial(cur0.year, cur0.month, cur0.day_of_the_month);
      var curRank = MOON_REVEAL_TIERS[_normalizeMoonRevealTier(ms0.revealTier)] || 0;
      var newRank = MOON_REVEAL_TIERS[tierArg] || 0;
      if (newRank > curRank) ms0.revealTier = _normalizeMoonRevealTier(tierArg);
      var effectiveTier = _normalizeMoonRevealTier(ms0.revealTier);
      if (newRank > curRank) {
        ms0.revealHorizonDays = reqHorizon;
      } else if (newRank === curRank) {
        ms0.revealHorizonDays = Math.max(parseInt(ms0.revealHorizonDays, 10) || 7, reqHorizon);
      }
      var effectiveHorizon = parseInt(ms0.revealHorizonDays, 10) || reqHorizon;
      var sys0 = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      if (!sys0) return whisper(m.who, "No moon data for this calendar system.");
      var rows0 = sys0.moons.map(function(moon) {
        return _moonRowHtml(moon, today0, effectiveTier, effectiveHorizon);
      });
      var srcLabel0 = MOON_SOURCE_LABELS[effectiveTier] || "";
      var srcLine0 = srcLabel0 ? '<div style="font-size:.75em;opacity:.4;font-style:italic;margin-top:5px;">' + esc(srcLabel0) + "</div>" : "";
      sendToAll(_menuBox(
        "\u{1F319} Lunar Forecast \u2014 " + esc(currentDateLabel()),
        rows0.join("") + srcLine0 + '<div style="font-size:.75em;opacity:.4;margin-top:3px;">Forecast horizon: ' + esc(_rangeLabel(effectiveHorizon)) + "</div>"
      ));
      warnGM("Sent " + titleCase(effectiveTier) + " lunar forecast to players (" + _rangeLabel(effectiveHorizon) + ").");
      return whisper(m.who, moonPanelHtml());
    }
    if (sub === "on" || sub === "date") {
      var dateToksOn = args.slice(2).map(function(t) {
        return String(t || "").trim();
      }).filter(Boolean);
      var prefOn = parseDatePrefixForAdd(dateToksOn);
      if (!prefOn) {
        return whisper(m.who, "Usage: <code>!cal moon on &lt;dateSpec&gt;</code> (example: <code>!cal moon on Rhaan 14 998</code>)");
      }
      var serialOn = toSerial(prefOn.year, prefOn.mHuman - 1, prefOn.day);
      moonEnsureSequences(serialOn, MOON_PREDICTION_LIMITS.highMaxDays);
      return whisper(m.who, moonPanelHtml(serialOn));
    }
    if (sub === "seed") {
      var word = String(args[2] || "").trim();
      if (!word) return whisper(m.who, "Usage: <code>!cal moon seed &lt;word&gt;</code>");
      var ms = getMoonState();
      ms.systemSeed = word;
      ms.seeds = {};
      ms.generatedFrom = null;
      ms.generatedThru = 0;
      moonEnsureSequences();
      return whisper(m.who, "System moon seed set to <b>" + esc(word) + "</b>. Sequences regenerated.");
    }
    if (sub === "full" || sub === "new") {
      var moonNameRaw = String(args[2] || "").trim();
      if (!moonNameRaw)
        return whisper(
          m.who,
          "Usage: <code>!cal moon (full|new) &lt;MoonName&gt; &lt;dateSpec&gt;</code> \u2014 dateSpec: <code>14</code> or <code>Rhaan 14</code> or <code>Rhaan 14 999</code>"
        );
      var sys2 = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      var mName = _moonParseMoonName(moonNameRaw, sys2);
      if (!mName) return whisper(m.who, "Unknown moon: <b>" + esc(moonNameRaw) + "</b>");
      var dateToks = args.slice(3).map(function(t) {
        return String(t || "").trim();
      }).filter(Boolean);
      var pref = parseDatePrefixForAdd(dateToks);
      if (!pref)
        return whisper(
          m.who,
          "Could not parse date. Try: <code>!cal moon " + sub + " " + esc(mName) + " Rhaan 14</code>"
        );
      var cal2 = getCal();
      var targetSerial = toSerial(pref.year, pref.mHuman - 1, pref.day);
      var ms2 = getMoonState();
      if (!ms2.gmAnchors[mName]) ms2.gmAnchors[mName] = [];
      ms2.gmAnchors[mName].push({ serial: targetSerial, type: sub });
      ms2.generatedFrom = null;
      ms2.generatedThru = 0;
      moonEnsureSequences();
      var monthName = _displayMonthDayParts(pref.mHuman - 1, pref.day).monthName;
      return whisper(
        m.who,
        "<b>" + esc(mName) + "</b> will be <b>" + sub + "</b> on " + esc(String(pref.day)) + " " + esc(monthName) + " " + esc(String(pref.year)) + '.<br><span style="opacity:.6;font-size:.85em;">Sequence regenerated.</span>'
      );
    }
    if (sub === "view" || sub === "cal") {
      var viewNameRaw = String(args[2] || "").trim();
      var viewSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      if (!viewNameRaw) {
        var viewBtns = viewSys.moons.map(function(moon) {
          return button(moon.name, "moon view " + moon.name);
        });
        return whisper(m.who, _menuBox(
          "\u{1F319} Moon Calendar",
          '<div style="margin-bottom:4px;">Select a moon:</div>' + viewBtns.join(" ") + '<div style="margin-top:6px;">' + button("\u2B05 Back", "moon") + "</div>"
        ));
      }
      var viewMoonName = _moonParseMoonName(viewNameRaw, viewSys);
      if (!viewMoonName) return whisper(m.who, "Unknown moon: <b>" + esc(viewNameRaw) + "</b>. Try <code>!cal moon view</code> for a list.");
      var viewSerial = todaySerial();
      if (args[3]) {
        var viewDateToks = args.slice(3).map(function(t) {
          return String(t || "").trim();
        }).filter(Boolean);
        var viewPref = parseDatePrefixForAdd(viewDateToks);
        if (viewPref) viewSerial = toSerial(viewPref.year, viewPref.mHuman - 1, viewPref.day);
      }
      moonEnsureSequences(viewSerial, 60);
      var calBody = _singleMoonMiniCalHtml(viewMoonName, viewSerial);
      var prevS = _shiftSerialByMonth(viewSerial, -1);
      var nextS = _shiftSerialByMonth(viewSerial, 1);
      var viewNav = '<div style="margin:4px 0;">' + button("\u25C0 Prev", "moon view " + viewMoonName + " " + _serialToDateSpec(prevS)) + " " + button("Next \u25B6", "moon view " + viewMoonName + " " + _serialToDateSpec(nextS)) + "</div>";
      return whisper(m.who, _menuBox(
        "\u{1F319} " + esc(viewMoonName),
        viewNav + calBody + '<div style="margin-top:6px;">' + button("\u2B05 All Moons", "moon") + " " + button("\u{1F4D6} Lore", "moon lore " + viewMoonName) + "</div>"
      ));
    }
    if (sub === "reset") {
      var clearName = String(args[2] || "").trim();
      var sys3 = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      var mName3 = clearName ? _moonParseMoonName(clearName, sys3) : null;
      var ms3 = getMoonState();
      if (mName3) {
        ms3.gmAnchors[mName3] = [];
        ms3.generatedFrom = null;
        ms3.generatedThru = 0;
        moonEnsureSequences();
        return whisper(m.who, "Phase overrides reset for <b>" + esc(mName3) + "</b>.");
      } else {
        ms3.gmAnchors = {};
        ms3.generatedFrom = null;
        ms3.generatedThru = 0;
        moonEnsureSequences();
        return whisper(m.who, "All moon phase overrides reset.");
      }
    }
    whisper(
      m.who,
      "Moon: <code>!cal moon</code> &nbsp;\xB7&nbsp; <code>!cal moon view &lt;name&gt;</code> &nbsp;\xB7&nbsp; <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code> &nbsp;\xB7&nbsp; <code>!cal moon on &lt;dateSpec&gt;</code> &nbsp;\xB7&nbsp; <code>!cal moon seed &lt;word&gt;</code> &nbsp;\xB7&nbsp; <code>!cal moon (full|new) &lt;name&gt; &lt;dateSpec&gt;</code> &nbsp;\xB7&nbsp; <code>!cal moon reset [&lt;name&gt;]</code>"
    );
  }

  // src/weather.ts
  function _seededRand(seed) {
    var s = (seed * 2654435769 >>> 0) / 4294967296;
    return function() {
      s = (s * 1103515245 + 12345) % 2147483648 / 2147483648;
      return s;
    };
  }
  function _clampWeatherTempBand(band) {
    band = parseInt(band, 10);
    if (!isFinite(band)) band = 0;
    return Math.max(WEATHER_TEMP_BAND_MIN, Math.min(WEATHER_TEMP_BAND_MAX, band));
  }
  function _legacyTempStageToBand(stage) {
    stage = parseInt(stage, 10);
    if (!isFinite(stage)) return 0;
    if (WEATHER_LEGACY_TEMP_TO_BAND[stage] != null) return WEATHER_LEGACY_TEMP_TO_BAND[stage];
    return _clampWeatherTempBand(stage);
  }
  function _weatherTempInfo(band) {
    return WEATHER_TEMPERATURE_BAND_INDEX[_clampWeatherTempBand(band)] || WEATHER_TEMPERATURE_BANDS_F[0];
  }
  function _weatherTempLabel(band) {
    return titleCase(_weatherTempInfo(band).label || String(band));
  }
  function _weatherTempMechanics(band) {
    var info = _weatherTempInfo(band);
    var parts = [];
    if (info.nominalDC != null) {
      parts.push("DC " + info.nominalDC + " Con save or exhaustion.");
    }
    if (info.coldRequirement && info.coldRequirement !== "none") {
      if (info.coldRequirement === "special") parts.push(info.coldRequirementLabel + ".");
      else parts.push("Disadvantage without " + String(info.coldRequirementLabel || "").toLowerCase() + ".");
    }
    if (info.heatArmorDisadvantage && info.heatArmorDisadvantage !== "none") {
      var heatRule = WEATHER_HEAT_ARMOR_RULES[info.heatArmorDisadvantage];
      if (heatRule && heatRule.description) parts.push(heatRule.description);
    }
    return parts.length ? parts.join(" ") : null;
  }
  function _isZarantyrFull(serial) {
    var ph = moonPhaseAt("Zarantyr", serial);
    return !!(ph && ph.illum >= 0.97);
  }
  var WEATHER_UNCERTAINTY = {
    certain: { maxDist: 1, label: "Certain" },
    likely: { maxDist: 3, label: "Likely" },
    uncertain: { maxDist: 7, label: "Uncertain" },
    vague: { maxDist: 20, label: "Vague" }
  };
  var WEATHER_DAY_PERIODS = ["early_morning", "morning", "afternoon", "evening", "late_night"];
  var WEATHER_PRIMARY_PERIOD = "afternoon";
  var WEATHER_LOW_TOD_PERIODS = ["early_morning", "afternoon", "late_night"];
  var WEATHER_PERIOD_META = {
    early_morning: { label: "Early Morning", shortLabel: "Early", icon: "\u{1F305}" },
    morning: { label: "Morning", shortLabel: "Morning", icon: "\u2600" },
    afternoon: { label: "Afternoon", shortLabel: "Afternoon", icon: "\u2601" },
    evening: { label: "Evening", shortLabel: "Evening", icon: "\u{1F306}" },
    late_night: { label: "Late Night", shortLabel: "Night", icon: "\u{1F319}" }
  };
  function _weatherPeriodLabel(period) {
    var meta = WEATHER_PERIOD_META[period] || {};
    return meta.label || titleCase(String(period || "").replace(/_/g, " "));
  }
  function _weatherPeriodShortLabel(period) {
    var meta = WEATHER_PERIOD_META[period] || {};
    return meta.shortLabel || _weatherPeriodLabel(period);
  }
  function _weatherPeriodIcon(period) {
    var meta = WEATHER_PERIOD_META[period] || {};
    return meta.icon || "\u2022";
  }
  function _weatherPrimaryValues(rec) {
    if (!rec) return null;
    if (rec.periods && rec.periods[WEATHER_PRIMARY_PERIOD]) return rec.periods[WEATHER_PRIMARY_PERIOD];
    return rec.final || null;
  }
  function _weatherPrimaryFog(rec) {
    return rec && rec.fog ? rec.fog[WEATHER_PRIMARY_PERIOD] : null;
  }
  function _weatherPrevNightValues(prevRec) {
    if (!prevRec) return null;
    if (prevRec.periods && prevRec.periods.late_night) return prevRec.periods.late_night;
    return prevRec.final || null;
  }
  function _weatherPrevNightFog(prevRec) {
    return prevRec && prevRec.fog ? prevRec.fog.late_night : null;
  }
  var WEATHER_TOD_BELL = [
    //  1    2   3   4    5  6  7  8  9 10 11 12 13 14 15 16   17  18  19   20
    -2,
    -1,
    -1,
    -1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    2
  ];
  var WEATHER_TOD_ARC = {
    polar: {
      temp: { early_morning: -3, morning: -2, afternoon: 0, evening: -2, late_night: -3 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: 0, late_night: -1 },
      precip: { early_morning: 0, morning: 0, afternoon: 0, evening: 0, late_night: 0 }
    },
    continental: {
      temp: { early_morning: -4, morning: -3, afternoon: 0, evening: -2, late_night: -3 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: 0, late_night: 0 },
      precip: { early_morning: 0, morning: -1, afternoon: 0, evening: 1, late_night: 1 }
    },
    temperate: {
      temp: { early_morning: -3, morning: -2, afternoon: 0, evening: -2, late_night: -3 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: 0, late_night: 0 },
      precip: { early_morning: 0, morning: -1, afternoon: 0, evening: 1, late_night: 1 }
    },
    dry: {
      temp: { early_morning: -5, morning: -4, afternoon: 0, evening: -3, late_night: -4 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: -1, late_night: -2 },
      precip: { early_morning: -1, morning: -1, afternoon: 0, evening: 0, late_night: 0 }
    },
    tropical: {
      temp: { early_morning: -2, morning: -2, afternoon: 0, evening: 0, late_night: -1 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: 0, late_night: 0 },
      precip: { early_morning: 0, morning: 0, afternoon: 0, evening: 1, late_night: 1 }
    },
    monsoon: {
      temp: { early_morning: -2, morning: -2, afternoon: 0, evening: 0, late_night: 0 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: 1, late_night: 1 },
      precip: { early_morning: 0, morning: -1, afternoon: 0, evening: 2, late_night: 1 }
    },
    mediterranean: {
      temp: { early_morning: -4, morning: -3, afternoon: 0, evening: -2, late_night: -3 },
      wind: { early_morning: -1, morning: -1, afternoon: 0, evening: 0, late_night: 0 },
      precip: { early_morning: 0, morning: 0, afternoon: 0, evening: 1, late_night: 1 }
    }
  };
  var WEATHER_CLIMATE_BASE = {
    // Frostfell, Demon Wastes — perpetually cold, windswept, low moisture
    polar: [
      /*0  mid-win */
      { temp: { base: -2, die: 2, min: -3, max: 0 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*1  late-win*/
      { temp: { base: -2, die: 2, min: -3, max: 0 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*2  early-sp*/
      { temp: { base: 0, die: 2, min: -2, max: 2 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*3  mid-sp  */
      { temp: { base: 2, die: 2, min: 0, max: 3 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*4  late-sp */
      { temp: { base: 2, die: 2, min: 0, max: 3 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*5  early-su*/
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*6  mid-su  */
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*7  late-su */
      { temp: { base: 2, die: 2, min: 0, max: 3 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*8  early-au*/
      { temp: { base: 0, die: 2, min: -2, max: 2 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*9  mid-au  */
      { temp: { base: -2, die: 2, min: -3, max: 0 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*10 late-au */
      { temp: { base: -2, die: 2, min: -3, max: 0 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*11 early-wn*/
      { temp: { base: -2, die: 2, min: -3, max: 0 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } }
    ],
    // Karrnath, Mror Holds interior — wide seasonal swing, harsh winters
    continental: [
      /*0 */
      { temp: { base: 0, die: 3, min: -2, max: 2 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*1 */
      { temp: { base: 2, die: 3, min: -2, max: 3 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*2 */
      { temp: { base: 3, die: 3, min: 2, max: 6 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*3 */
      { temp: { base: 5, die: 2, min: 3, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*4 */
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*5 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*6 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*7 */
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*8 */
      { temp: { base: 5, die: 3, min: 2, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 3, min: 0, max: 3 } },
      /*9 */
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*10*/
      { temp: { base: 2, die: 2, min: 0, max: 3 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*11*/
      { temp: { base: 0, die: 3, min: -2, max: 2 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } }
    ],
    // Breland, Shadow Marches, most of Khorvaire — moderate, maritime-influenced
    temperate: [
      /*0 */
      { temp: { base: 2, die: 2, min: 0, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*1 */
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*2 */
      { temp: { base: 5, die: 2, min: 3, max: 6 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*3 */
      { temp: { base: 5, die: 2, min: 3, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*4 */
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*5 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*6 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*7 */
      { temp: { base: 6, die: 2, min: 5, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*8 */
      { temp: { base: 6, die: 3, min: 3, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 3, min: 0, max: 3 } },
      /*9 */
      { temp: { base: 5, die: 2, min: 3, max: 6 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*10*/
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*11*/
      { temp: { base: 2, die: 2, min: 0, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } }
    ],
    // Blade Desert, Valenar interior — heat-dominated, wide daily swings, very low precip
    dry: [
      /*0 */
      { temp: { base: 5, die: 3, min: 2, max: 6 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*1 */
      { temp: { base: 5, die: 3, min: 3, max: 8 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*2 */
      { temp: { base: 6, die: 3, min: 5, max: 8 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 1 } },
      /*3 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*4 */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*5 */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*6 */
      { temp: { base: 11, die: 2, min: 9, max: 12 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*7 */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*8 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*9 */
      { temp: { base: 6, die: 3, min: 5, max: 8 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*10*/
      { temp: { base: 6, die: 3, min: 3, max: 8 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*11*/
      { temp: { base: 5, die: 3, min: 2, max: 6 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 1, die: 2, min: 0, max: 2 } }
    ],
    // Sharn, Q'barra, Xen'drik coast — narrow temp swing, seasonal rains
    tropical: [
      /*0 */
      { temp: { base: 6, die: 2, min: 5, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*1 */
      { temp: { base: 6, die: 2, min: 5, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*2 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*3 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*4 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 2 } },
      /*5 */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*6 */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*7 */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*8 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*9 */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*10*/
      { temp: { base: 6, die: 2, min: 5, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*11*/
      { temp: { base: 6, die: 2, min: 5, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } }
    ],
    // Q'barra interior monsoon, Xen'drik seasonal — dramatic wet/dry season flip
    // Dry season (winter–early spring): clear skies, low precip
    // Wet season (summer–autumn): torrential, daily downpours, high wind
    monsoon: [
      /*0  mid-win */
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*1  late-win*/
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*2  early-sp*/
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*3  mid-sp  */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 3 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*4  late-sp */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 3, die: 2, min: 2, max: 4 } },
      /*5  early-su*/
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 2, die: 2, min: 1, max: 4 }, precip: { base: 3, die: 3, min: 2, max: 5 } },
      /*6  mid-su  */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 2, die: 2, min: 1, max: 4 }, precip: { base: 3, die: 3, min: 2, max: 5 } },
      /*7  late-su */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 2, die: 2, min: 1, max: 4 }, precip: { base: 3, die: 3, min: 2, max: 5 } },
      /*8  early-au*/
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 2, die: 2, min: 1, max: 3 }, precip: { base: 3, die: 2, min: 2, max: 4 } },
      /*9  mid-au  */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*10 late-au */
      { temp: { base: 6, die: 2, min: 5, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*11 early-wn*/
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } }
    ],
    // Valenar coast, southern Breland — hot dry summers, mild wet winters
    // Inverted precip curve: winters wetter than summers
    mediterranean: [
      /*0  mid-win */
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 3, die: 2, min: 2, max: 4 } },
      /*1  late-win*/
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 1, die: 2, min: 0, max: 3 }, precip: { base: 3, die: 2, min: 2, max: 4 } },
      /*2  early-sp*/
      { temp: { base: 5, die: 2, min: 3, max: 6 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*3  mid-sp  */
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*4  late-sp */
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 1 } },
      /*5  early-su*/
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*6  mid-su  */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*7  late-su */
      { temp: { base: 9, die: 2, min: 8, max: 11 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 0, die: 2, min: 0, max: 1 } },
      /*8  early-au*/
      { temp: { base: 8, die: 2, min: 6, max: 9 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 1, die: 2, min: 0, max: 2 } },
      /*9  mid-au  */
      { temp: { base: 6, die: 2, min: 5, max: 8 }, wind: { base: 1, die: 2, min: 0, max: 2 }, precip: { base: 2, die: 2, min: 1, max: 3 } },
      /*10 late-au */
      { temp: { base: 5, die: 2, min: 3, max: 6 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 3, die: 2, min: 2, max: 4 } },
      /*11 early-wn*/
      { temp: { base: 3, die: 2, min: 2, max: 5 }, wind: { base: 2, die: 2, min: 0, max: 3 }, precip: { base: 3, die: 2, min: 2, max: 4 } }
    ]
  };
  function _upgradeWeatherClimateBaseTemps() {
    Object.keys(WEATHER_CLIMATE_BASE).forEach(function(climate) {
      WEATHER_CLIMATE_BASE[climate] = (WEATHER_CLIMATE_BASE[climate] || []).map(function(entry) {
        return {
          temp: {
            base: _legacyTempStageToBand(entry.temp && entry.temp.base),
            die: entry.temp && entry.temp.die,
            min: _legacyTempStageToBand(entry.temp && entry.temp.min),
            max: _legacyTempStageToBand(entry.temp && entry.temp.max)
          },
          wind: entry.wind,
          precip: entry.precip
        };
      });
    });
  }
  _upgradeWeatherClimateBaseTemps();
  var WEATHER_GEO_MOD = {
    // Baseline — no modification
    inland: { temp: 0, wind: 0, precip: 0, arc: 1 },
    // Breland coast, Lhazaar coastline — maritime moderation
    coastal: [
      /*0 */
      { temp: 1, wind: 1, precip: 1, arc: 0.7 },
      /*1 */
      { temp: 1, wind: 1, precip: 1, arc: 0.7 },
      /*2 */
      { temp: 0, wind: 0, precip: 1, arc: 0.75 },
      /*3 */
      { temp: 0, wind: 0, precip: 1, arc: 0.75 },
      /*4 */
      { temp: 0, wind: 0, precip: 1, arc: 0.75 },
      /*5 */
      { temp: -1, wind: 0, precip: 0, arc: 0.7 },
      /*6 */
      { temp: -1, wind: 0, precip: 0, arc: 0.7 },
      /*7 */
      { temp: -1, wind: 0, precip: 0, arc: 0.7 },
      /*8 */
      { temp: 0, wind: 1, precip: 1, arc: 0.75 },
      /*9 */
      { temp: 0, wind: 1, precip: 1, arc: 0.75 },
      /*10*/
      { temp: 1, wind: 1, precip: 1, arc: 0.72 },
      /*11*/
      { temp: 1, wind: 1, precip: 1, arc: 0.7 }
    ],
    // Thunder Sea crossings, Lhazaar open water — strong moderation, sustained wind
    open_sea: [
      /*0 */
      { temp: 2, wind: 2, precip: 1, arc: 0.35 },
      /*1 */
      { temp: 2, wind: 2, precip: 1, arc: 0.35 },
      /*2 */
      { temp: 1, wind: 2, precip: 1, arc: 0.35 },
      /*3 */
      { temp: 0, wind: 2, precip: 1, arc: 0.35 },
      /*4 */
      { temp: 0, wind: 2, precip: 1, arc: 0.35 },
      /*5 */
      { temp: -2, wind: 2, precip: 1, arc: 0.35 },
      /*6 */
      { temp: -2, wind: 2, precip: 1, arc: 0.35 },
      /*7 */
      { temp: -2, wind: 2, precip: 1, arc: 0.35 },
      /*8 */
      { temp: -1, wind: 2, precip: 1, arc: 0.35 },
      /*9 */
      { temp: 0, wind: 2, precip: 1, arc: 0.35 },
      /*10*/
      { temp: 0, wind: 2, precip: 1, arc: 0.35 },
      /*11*/
      { temp: 2, wind: 2, precip: 1, arc: 0.35 }
    ],
    // Talenta Plains, Valenar, Mournland — amplified arc, fast-moving systems
    open_plains: [
      /*0 */
      { temp: -1, wind: 1, precip: -1, arc: 1.5 },
      /*1 */
      { temp: -1, wind: 1, precip: -1, arc: 1.5 },
      /*2 */
      { temp: 0, wind: 1, precip: 0, arc: 1.4 },
      /*3 */
      { temp: 0, wind: 1, precip: 0, arc: 1.4 },
      /*4 */
      { temp: 1, wind: 1, precip: 0, arc: 1.4 },
      /*5 */
      { temp: 1, wind: 1, precip: 0, arc: 1.4 },
      /*6 */
      { temp: 1, wind: 1, precip: 0, arc: 1.4 },
      /*7 */
      { temp: 1, wind: 1, precip: 0, arc: 1.4 },
      /*8 */
      { temp: 0, wind: 1, precip: 1, arc: 1.4 },
      /*9 */
      { temp: 0, wind: 1, precip: -1, arc: 1.45 },
      /*10*/
      { temp: 0, wind: 1, precip: -1, arc: 1.45 },
      /*11*/
      { temp: -1, wind: 1, precip: -1, arc: 1.5 }
    ],
    // Mror Holds peaks, Starpeaks — elevation cold, orographic precip
    highland: [
      /*0 */
      { temp: -2, wind: 2, precip: 1, arc: 1.3 },
      /*1 */
      { temp: -2, wind: 2, precip: 1, arc: 1.3 },
      /*2 */
      { temp: -2, wind: 1, precip: 1, arc: 1.25 },
      /*3 */
      { temp: -2, wind: 1, precip: 1, arc: 1.25 },
      /*4 */
      { temp: -2, wind: 1, precip: 1, arc: 1.2 },
      /*5 */
      { temp: -2, wind: 1, precip: 1, arc: 1.2 },
      /*6 */
      { temp: -2, wind: 1, precip: 1, arc: 1.2 },
      /*7 */
      { temp: -2, wind: 1, precip: 1, arc: 1.2 },
      /*8 */
      { temp: -2, wind: 1, precip: 1, arc: 1.25 },
      /*9 */
      { temp: -2, wind: 1, precip: 1, arc: 1.25 },
      /*10*/
      { temp: -2, wind: 2, precip: 1, arc: 1.3 },
      /*11*/
      { temp: -2, wind: 2, precip: 1, arc: 1.3 }
    ],
    // Aundair river valleys, Scions Sound region — fog-prone, channeled wind
    river_valley: [
      /*0 */
      { temp: 0, wind: -1, precip: 1, arc: 0.9 },
      /*1 */
      { temp: 0, wind: -1, precip: 1, arc: 0.9 },
      /*2 */
      { temp: 0, wind: -1, precip: 1, arc: 0.85 },
      /*3 */
      { temp: 0, wind: -1, precip: 1, arc: 0.85 },
      /*4 */
      { temp: 0, wind: -1, precip: 1, arc: 0.85 },
      /*5 */
      { temp: 1, wind: -1, precip: 1, arc: 0.8 },
      /*6 */
      { temp: 1, wind: -1, precip: 1, arc: 0.8 },
      /*7 */
      { temp: 1, wind: -1, precip: 1, arc: 0.8 },
      /*8 */
      { temp: 0, wind: -1, precip: 1, arc: 0.85 },
      /*9 */
      { temp: 0, wind: -1, precip: 1, arc: 0.85 },
      /*10*/
      { temp: 0, wind: -1, precip: 1, arc: 0.85 },
      /*11*/
      { temp: 0, wind: -1, precip: 1, arc: 0.9 }
    ],
    // Q'barra interior, Xen'drik jungle lowlands — flat arc, suppressed wind, max moisture
    jungle_basin: { temp: 0, wind: -1, precip: 1, arc: 0.25 },
    // Lake Galifar, large enclosed Scions Sound — lake-effect autumn/winter precip
    inland_sea: [
      /*0 */
      { temp: 1, wind: 1, precip: 2, arc: 0.75 },
      /*1 */
      { temp: 1, wind: 1, precip: 2, arc: 0.75 },
      /*2 */
      { temp: 1, wind: 0, precip: 1, arc: 0.8 },
      /*3 */
      { temp: 0, wind: 0, precip: 1, arc: 0.85 },
      /*4 */
      { temp: 0, wind: 0, precip: 1, arc: 0.85 },
      /*5 */
      { temp: -1, wind: 0, precip: 0, arc: 0.8 },
      /*6 */
      { temp: -1, wind: 0, precip: 0, arc: 0.8 },
      /*7 */
      { temp: -1, wind: 0, precip: 0, arc: 0.8 },
      /*8 */
      { temp: 1, wind: 1, precip: 2, arc: 0.8 },
      /*9 */
      { temp: 1, wind: 1, precip: 2, arc: 0.75 },
      /*10*/
      { temp: 1, wind: 1, precip: 2, arc: 0.75 },
      /*11*/
      { temp: 1, wind: 1, precip: 2, arc: 0.75 }
    ],
    // Lhazaar islands, offshore Stormreach — all-direction maritime
    island: [
      /*0 */
      { temp: 2, wind: 1, precip: 1, arc: 0.45 },
      /*1 */
      { temp: 2, wind: 1, precip: 1, arc: 0.45 },
      /*2 */
      { temp: 1, wind: 1, precip: 1, arc: 0.5 },
      /*3 */
      { temp: 1, wind: 1, precip: 1, arc: 0.5 },
      /*4 */
      { temp: -1, wind: 1, precip: 1, arc: 0.45 },
      /*5 */
      { temp: -1, wind: 1, precip: 1, arc: 0.45 },
      /*6 */
      { temp: -1, wind: 1, precip: 1, arc: 0.45 },
      /*7 */
      { temp: -1, wind: 1, precip: 1, arc: 0.45 },
      /*8 */
      { temp: 1, wind: 1, precip: 1, arc: 0.5 },
      /*9 */
      { temp: 1, wind: 1, precip: 1, arc: 0.5 },
      /*10*/
      { temp: 2, wind: 1, precip: 1, arc: 0.45 },
      /*11*/
      { temp: 2, wind: 1, precip: 1, arc: 0.45 }
    ],
    // Frostfell open tundra, Demon Wastes — open plains amplified by polar cold
    arctic_plain: [
      /*0 */
      { temp: -3, wind: 2, precip: -1, arc: 1.7 },
      /*1 */
      { temp: -3, wind: 2, precip: -1, arc: 1.7 },
      /*2 */
      { temp: -2, wind: 2, precip: -1, arc: 1.6 },
      /*3 */
      { temp: -2, wind: 2, precip: -1, arc: 1.6 },
      /*4 */
      { temp: -1, wind: 2, precip: -1, arc: 1.5 },
      /*5 */
      { temp: -1, wind: 2, precip: -1, arc: 1.5 },
      /*6 */
      { temp: -1, wind: 2, precip: -1, arc: 1.5 },
      /*7 */
      { temp: -1, wind: 2, precip: -1, arc: 1.5 },
      /*8 */
      { temp: -2, wind: 2, precip: -1, arc: 1.6 },
      /*9 */
      { temp: -2, wind: 2, precip: -1, arc: 1.6 },
      /*10*/
      { temp: -3, wind: 2, precip: -1, arc: 1.7 },
      /*11*/
      { temp: -3, wind: 2, precip: -1, arc: 1.7 }
    ]
  };
  var WEATHER_TERRAIN_MOD = {
    // Full exposure to geography — no modification
    open: { temp: 0, wind: 0, precip: 0, arc: 1 },
    // Deciduous forest: full canopy in summer, bare in winter
    forest: [
      /*0  mid-win */
      { temp: 0, wind: 0, precip: 0, arc: 0.85 },
      /*1  late-win*/
      { temp: 0, wind: 0, precip: 0, arc: 0.85 },
      /*2  early-sp*/
      { temp: 0, wind: -1, precip: 1, arc: 0.6 },
      /*3  mid-sp  */
      { temp: 0, wind: -1, precip: 1, arc: 0.45 },
      /*4  late-sp */
      { temp: 0, wind: -1, precip: 1, arc: 0.3 },
      /*5  early-su*/
      { temp: 0, wind: -1, precip: 1, arc: 0.25 },
      /*6  mid-su  */
      { temp: 0, wind: -1, precip: 1, arc: 0.25 },
      /*7  late-su */
      { temp: 0, wind: -1, precip: 1, arc: 0.25 },
      /*8  early-au*/
      { temp: 0, wind: -1, precip: 1, arc: 0.3 },
      /*9  mid-au  */
      { temp: 0, wind: 0, precip: 0, arc: 0.55 },
      /*10 late-au */
      { temp: 0, wind: 0, precip: 0, arc: 0.75 },
      /*11 early-wn*/
      { temp: 0, wind: 0, precip: 0, arc: 0.85 }
    ],
    // Tropical/evergreen forest: constant heavy canopy all year
    jungle: { temp: 0, wind: -1, precip: 1, arc: 0.2 },
    // Wetland: like forest but wetter and wind-dead at surface
    swamp: [
      /*0 */
      { temp: 0, wind: -1, precip: 1, arc: 0.7 },
      /*1 */
      { temp: 0, wind: -1, precip: 1, arc: 0.7 },
      /*2 */
      { temp: 0, wind: -1, precip: 2, arc: 0.5 },
      /*3 */
      { temp: 0, wind: -1, precip: 2, arc: 0.45 },
      /*4 */
      { temp: 0, wind: -1, precip: 2, arc: 0.45 },
      /*5 */
      { temp: 1, wind: -1, precip: 2, arc: 0.35 },
      /*6 */
      { temp: 1, wind: -1, precip: 2, arc: 0.35 },
      /*7 */
      { temp: 1, wind: -1, precip: 2, arc: 0.35 },
      /*8 */
      { temp: 0, wind: -1, precip: 2, arc: 0.5 },
      /*9 */
      { temp: 0, wind: -1, precip: 1, arc: 0.65 },
      /*10*/
      { temp: 0, wind: -1, precip: 1, arc: 0.65 },
      /*11*/
      { temp: 0, wind: -1, precip: 1, arc: 0.7 }
    ],
    // Settled area: heat island, streets channel wind slightly
    urban: { temp: 1, wind: 0, precip: 0, arc: 0.8 },
    // Above treeline: always exposed, cold, no canopy moderation
    alpine: { temp: -2, wind: 1, precip: 1, arc: 1.5 },
    // Cultivated fields: partial hedge/windbreak, otherwise open
    farmland: { temp: 0, wind: -1, precip: 0, arc: 0.9 },
    // Sand/rock desert: amplifies arc, reinforces dryness
    desert: [
      /*0 */
      { temp: 0, wind: 0, precip: -1, arc: 1.8 },
      /*1 */
      { temp: 0, wind: 0, precip: -1, arc: 1.8 },
      /*2 */
      { temp: 1, wind: 0, precip: -1, arc: 1.9 },
      /*3 */
      { temp: 1, wind: 0, precip: -1, arc: 1.9 },
      /*4 */
      { temp: 1, wind: 0, precip: -1, arc: 1.9 },
      /*5 */
      { temp: 2, wind: 0, precip: -1, arc: 2 },
      /*6 */
      { temp: 2, wind: 0, precip: -1, arc: 2 },
      /*7 */
      { temp: 2, wind: 0, precip: -1, arc: 2 },
      /*8 */
      { temp: 1, wind: 0, precip: -1, arc: 1.9 },
      /*9 */
      { temp: 1, wind: 0, precip: -1, arc: 1.85 },
      /*10*/
      { temp: 1, wind: 0, precip: -1, arc: 1.85 },
      /*11*/
      { temp: 0, wind: 0, precip: -1, arc: 1.8 }
    ],
    // Exposed cliff above water: coastal moisture + wind amplification
    coastal_bluff: { temp: -1, wind: 2, precip: 1, arc: 1.2 }
  };
  var WEATHER_CLIMATES = {
    polar: "Perpetual cold, minimal precipitation, wide seasonal swing",
    continental: "Harsh winters, hot summers, far from maritime influence",
    temperate: "Moderate seasons, consistent precipitation, mild maritime character",
    dry: "Heat-dominated, very low precipitation, extreme daily temperature swings",
    tropical: "Narrow temperature range, seasonal heavy rain, consistently warm",
    monsoon: "Dramatic wet/dry season flip: dry clear winters, torrential summer downpours",
    mediterranean: "Hot dry summers, mild wet winters: inverted precipitation curve"
  };
  var WEATHER_GEOGRAPHIES = {
    inland: "Default continental interior \u2014 no geographic amplification",
    coastal: "Shoreline: maritime moderation, sea breeze, dampened daily arc",
    open_sea: "Open water: strongly moderated temps, sustained wind, flat arc",
    open_plains: "Unobstructed flat terrain: amplified arc, fast-moving systems, strong wind",
    highland: "Elevated terrain: colder, orographic precipitation, exposed ridges",
    river_valley: "Valley floor: fog-prone, wind channeled and reduced, elevated moisture",
    jungle_basin: "Dense jungle lowland: flat arc, suppressed wind, maximum humidity",
    inland_sea: "Large enclosed water body: lake-effect precip spikes in autumn/winter",
    island: "Surrounded by water: all-direction maritime moderation, steady moisture",
    arctic_plain: "Open polar tundra: extreme cold and wind amplified, minimal precipitation"
  };
  var WEATHER_TERRAINS_UI = {
    open: "No shelter \u2014 geography unfiltered",
    forest: "Deciduous: full canopy summer, bare winter \u2014 strongly seasonal buffering",
    jungle: "Tropical evergreen: constant heavy canopy, wind-dead, maximum humidity",
    swamp: "Wetland: still air, saturated ground, precip accumulates",
    urban: "Settled area: heat island, slight wind channeling",
    alpine: "Above treeline: always cold and exposed, no canopy",
    farmland: "Cultivated fields: partial windbreak, mostly open",
    desert: "Sand or rock desert: maximizes arc and heat, suppresses precipitation",
    coastal_bluff: "Exposed cliff near water: coastal moisture with amplified wind"
  };
  var MANIFEST_ZONE_ORDER = [
    "fernia",
    "risia",
    "irian",
    "mabar",
    "lamannia",
    "syrania",
    "kythri",
    "shavarath",
    "daanvi",
    "dolurrh",
    "thelanis",
    "xoriat",
    "dalquor"
  ];
  var MANIFEST_ZONE_DEFS = {
    fernia: {
      key: "fernia",
      name: "Fernia",
      emoji: "\u{1F525}",
      summary: "Warmth",
      effectLabel: "+3 temp",
      tempMod: 3
    },
    risia: {
      key: "risia",
      name: "Risia",
      emoji: "\u2744\uFE0F",
      summary: "Cold",
      effectLabel: "-3 temp",
      tempMod: -3
    },
    irian: {
      key: "irian",
      name: "Irian",
      emoji: "\u2728",
      summary: "Radiant warmth",
      effectLabel: "+1 temp",
      tempMod: 1
    },
    mabar: {
      key: "mabar",
      name: "Mabar",
      emoji: "\u{1F311}",
      summary: "Shadow cold",
      effectLabel: "-1 temp",
      tempMod: -1
    },
    lamannia: {
      key: "lamannia",
      name: "Lamannia",
      emoji: "\u{1F33F}",
      summary: "Lush weather",
      effectLabel: "+1 precip",
      precipMod: 1
    },
    syrania: {
      key: "syrania",
      name: "Syrania",
      emoji: "\u{1F324}",
      summary: "Milder skies",
      effectLabel: "-1 precip, -1 wind",
      precipMod: -1,
      windMod: -1
    },
    kythri: {
      key: "kythri",
      name: "Kythri",
      emoji: "\u{1F300}",
      summary: "Chaotic swings",
      effectLabel: "chaotic swings",
      chaotic: true
    },
    shavarath: {
      key: "shavarath",
      name: "Shavarath",
      emoji: "\u2694\uFE0F",
      summary: "Martial resonance",
      effectLabel: "no weather shift"
    },
    daanvi: {
      key: "daanvi",
      name: "Daanvi",
      emoji: "\u{1F4CF}",
      summary: "Orderly",
      effectLabel: "no weather shift"
    },
    dolurrh: {
      key: "dolurrh",
      name: "Dolurrh",
      emoji: "\u{1FAA6}",
      summary: "Deathly",
      effectLabel: "no weather shift"
    },
    thelanis: {
      key: "thelanis",
      name: "Thelanis",
      emoji: "\u{1F9DA}",
      summary: "Fey",
      effectLabel: "no weather shift"
    },
    xoriat: {
      key: "xoriat",
      name: "Xoriat",
      emoji: "\u{1F441}\uFE0F",
      summary: "Madness",
      effectLabel: "no weather shift"
    },
    dalquor: {
      key: "dalquor",
      name: "Dal Quor",
      emoji: "\u{1F4A4}",
      summary: "Dreams",
      effectLabel: "no weather shift"
    }
  };
  function _weatherLocationLabel(loc) {
    if (!loc) return "Unknown Location";
    var climate = titleCase(loc.climate || "temperate");
    var geography = titleCase(String(loc.geography || "inland").replace(/_/g, " "));
    var terrain = titleCase(String(loc.terrain || "open").replace(/_/g, " "));
    return climate + " / " + geography + " / " + terrain;
  }
  function _normalizeWeatherLocation(loc) {
    if (!loc) return null;
    var out = {
      climate: loc.climate || "temperate",
      geography: loc.geography || "inland",
      terrain: loc.terrain || "open"
    };
    out.sig = _locSig(out);
    out.name = loc.name || _weatherLocationLabel(out);
    return out;
  }
  function getWeatherState() {
    var root = state[state_name];
    if (!root.weather) root.weather = {
      location: null,
      // { name, climate, geography, terrain, sig }
      manifestZones: {},
      // key -> { key, setOn, arythFullActivated, arythFullExitWarned }
      forecast: [],
      // array of day records keyed by serial
      history: [],
      // locked past days (up to 60)
      playerReveal: { byLocation: {} },
      // locationSig -> serial(str) -> reveal entry
      recentLocations: []
    };
    var ws = root.weather;
    if (!ws.playerReveal || typeof ws.playerReveal !== "object") ws.playerReveal = { byLocation: {} };
    if (!ws.playerReveal.byLocation) {
      var legacyReveal = ws.playerReveal;
      ws.playerReveal = { byLocation: {} };
      var legacySig = ws.location && _locSig(ws.location) || "_default";
      ws.playerReveal.byLocation[legacySig] = {};
      Object.keys(legacyReveal || {}).forEach(function(key) {
        if (key === "byLocation") return;
        ws.playerReveal.byLocation[legacySig][key] = legacyReveal[key];
      });
    }
    if (!Array.isArray(ws.recentLocations)) ws.recentLocations = [];
    if (ws.location) ws.location = _normalizeWeatherLocation(ws.location);
    ws.recentLocations = ws.recentLocations.map(_normalizeWeatherLocation).filter(Boolean).slice(0, 3);
    if (!ws.manifestZones || typeof ws.manifestZones !== "object") ws.manifestZones = {};
    if (ws.location && ws.location.manifestZone) {
      var legacyKey = _manifestZoneKey(ws.location.manifestZone.name || ws.location.manifestZone.key || "");
      if (legacyKey && !ws.manifestZones[legacyKey]) {
        ws.manifestZones[legacyKey] = {
          key: legacyKey,
          setOn: todaySerial(),
          arythFullActivated: false,
          arythFullExitWarned: false
        };
      }
      delete ws.location.manifestZone;
      ws.location.sig = _locSig(ws.location);
    }
    return ws;
  }
  function _locSig(loc) {
    if (!loc) return "";
    return (loc.climate || "") + "/" + (loc.geography || "inland") + "/" + (loc.terrain || "");
  }
  function _weatherRevealBucket(ws, loc, createIfMissing) {
    ws = ws || getWeatherState();
    var sig = _locSig(loc || ws.location) || "_default";
    var store = ws.playerReveal && ws.playerReveal.byLocation;
    if (!store) {
      ws.playerReveal = { byLocation: {} };
      store = ws.playerReveal.byLocation;
    }
    if (!store[sig] && createIfMissing !== false) store[sig] = {};
    return store[sig] || {};
  }
  function _rememberRecentWeatherLocation(ws, loc) {
    ws = ws || getWeatherState();
    loc = _normalizeWeatherLocation(loc);
    if (!loc) return;
    var keep = [];
    keep.push(loc);
    for (var i = 0; i < ws.recentLocations.length; i++) {
      var existing = _normalizeWeatherLocation(ws.recentLocations[i]);
      if (!existing || existing.sig === loc.sig) continue;
      keep.push(existing);
      if (keep.length >= 3) break;
    }
    ws.recentLocations = keep;
  }
  function _manifestZoneKey(nameOrKey) {
    var raw = String(nameOrKey || "").toLowerCase().replace(/[\s'_-]+/g, "");
    if (!raw) return null;
    if (raw === "dalquor") return "dalquor";
    for (var i = 0; i < MANIFEST_ZONE_ORDER.length; i++) {
      var key = MANIFEST_ZONE_ORDER[i];
      var def = MANIFEST_ZONE_DEFS[key];
      if (!def) continue;
      var defKey = String(def.key || key).toLowerCase().replace(/[\s'_-]+/g, "");
      var defName = String(def.name || "").toLowerCase().replace(/[\s'_-]+/g, "");
      if (raw === defKey || raw === defName) return key;
    }
    return null;
  }
  function _activeManifestZoneEntries() {
    var zones = getWeatherState().manifestZones || {};
    return Object.keys(zones).map(function(key) {
      var norm = _manifestZoneKey(key);
      if (!norm || !MANIFEST_ZONE_DEFS[norm]) return null;
      var entry = zones[key] || {};
      return {
        key: norm,
        def: MANIFEST_ZONE_DEFS[norm],
        setOn: entry.setOn || null,
        arythFullActivated: !!entry.arythFullActivated,
        arythFullExitWarned: !!entry.arythFullExitWarned
      };
    }).filter(Boolean).sort(function(a, b) {
      return MANIFEST_ZONE_ORDER.indexOf(a.key) - MANIFEST_ZONE_ORDER.indexOf(b.key);
    });
  }
  function _manifestZoneStatusLabel(entries) {
    entries = entries || _activeManifestZoneEntries();
    if (!entries.length) return "None";
    return entries.map(function(entry) {
      return (entry.def.emoji || "\u25C7") + " " + entry.def.name;
    }).join(" \xB7 ");
  }
  function _activeManifestZonesForSerial(serial) {
    return serial === todaySerial() ? _activeManifestZoneEntries() : [];
  }
  function _manifestZoneInfluenceText(def) {
    if (!def) return null;
    return (def.emoji || "\u25C7") + " " + def.name + " manifest zone (" + (def.effectLabel || "no weather shift") + ")";
  }
  function _applyManifestZonesToValues(values, entries, serial) {
    entries = entries || [];
    if (!entries.length) return values;
    for (var i = 0; i < entries.length; i++) {
      var def = entries[i].def || entries[i];
      if (!def) continue;
      if (typeof def.tempMod === "number") values.temp += def.tempMod;
      if (typeof def.precipMod === "number") values.precip = Math.max(0, Math.min(5, values.precip + def.precipMod));
      if (typeof def.windMod === "number") values.wind = Math.max(0, Math.min(5, values.wind + def.windMod));
      if (def.chaotic) {
        var kR = _seededRand((serial | 0) * 77 + 999);
        values.temp += Math.floor(kR() * 5) - 2;
        values.precip = Math.max(0, Math.min(5, values.precip + Math.floor(kR() * 3) - 1));
        values.wind = Math.max(0, Math.min(5, values.wind + Math.floor(kR() * 3) - 1));
      }
    }
    values.temp = _clampWeatherTempBand(values.temp);
    values.precip = Math.max(0, Math.min(5, values.precip));
    values.wind = Math.max(0, Math.min(5, values.wind));
    return values;
  }
  function _weatherRecordForDisplay(rec) {
    if (!rec || rec.serial !== todaySerial()) return rec;
    var entries = _activeManifestZonesForSerial(rec.serial);
    if (!entries.length) return rec;
    var out = deepClone(rec);
    var periods = WEATHER_DAY_PERIODS;
    for (var i = 0; i < periods.length; i++) {
      var pname = periods[i];
      if (!out.periods || !out.periods[pname]) continue;
      out.periods[pname] = _applyManifestZonesToValues(out.periods[pname], entries, rec.serial);
    }
    if (out.final) {
      out.final = _applyManifestZonesToValues(out.final, entries, rec.serial);
    }
    if (!out.location) out.location = {};
    out.location.activeManifestZones = entries.map(function(entry) {
      return entry.def.name;
    });
    return out;
  }
  function _isArythFull(serial) {
    if (ensureSettings().calendarSystem !== "eberron") return false;
    try {
      moonEnsureSequences(serial, 60);
      var ph = moonPhaseAt("Aryth", serial);
      return !!(ph && ph.illum >= 0.97);
    } catch (e) {
      return false;
    }
  }
  function _manifestZoneOnDateChange(prevSerial, newSerial) {
    if (!(newSerial > prevSerial)) return;
    if (ensureSettings().weatherEnabled === false) return;
    var ws = getWeatherState();
    if (!ws.location) return;
    var prevFull = _isArythFull(prevSerial);
    var newFull = _isArythFull(newSerial);
    if (!prevFull && newFull) {
      warnGM("Aryth is full. Consider a manifest zone.");
    }
    if (prevFull && !newFull) {
      var tracked = _activeManifestZoneEntries().filter(function(entry) {
        return entry.arythFullActivated && !entry.arythFullExitWarned;
      });
      if (tracked.length) {
        warnGM("Aryth is no longer full. Consider deactivating: " + tracked.map(function(entry) {
          return entry.def.name;
        }).join(", ") + ".");
        tracked.forEach(function(entry) {
          if (!ws.manifestZones[entry.key]) return;
          ws.manifestZones[entry.key].arythFullExitWarned = true;
        });
      }
    }
  }
  function _rollDie(sides) {
    sides = Math.max(1, sides | 0);
    return typeof randomInteger === "function" ? randomInteger(sides) : Math.floor(Math.random() * sides) + 1;
  }
  function regularMonthIndex(mi) {
    var months = getCal().months;
    var count = 0;
    for (var i = 0; i < months.length && i <= mi; i++) {
      if (!months[i].isIntercalary) {
        if (i === mi) return count;
        count++;
      }
    }
    for (var j = mi - 1; j >= 0; j--) {
      if (!months[j].isIntercalary) return count - 1;
    }
    return 0;
  }
  function _weatherMonthIndex(mi) {
    var st = ensureSettings();
    var sv = st.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
    var entry = SEASON_SETS[sv] || SEASON_SETS.eberron;
    var hem = st.hemisphere || CONFIG_DEFAULTS.hemisphere;
    var offset = entry && entry.hemisphereAware && hem === "south" ? 6 : 0;
    return (regularMonthIndex(mi) + offset) % 12;
  }
  function _getModEntry(table, monthIdx) {
    if (Array.isArray(table)) return table[_weatherMonthIndex(monthIdx)] || table[0];
    return table;
  }
  function _composeFormula(climate, geography, terrain, monthIdx) {
    var TRAIT_MIN = { temp: WEATHER_TEMP_BAND_MIN, wind: 0, precip: 0 };
    var TRAIT_MAX = { temp: WEATHER_TEMP_BAND_MAX, wind: 3, precip: 3 };
    var clBase = WEATHER_CLIMATE_BASE[climate] || WEATHER_CLIMATE_BASE.temperate;
    var base = clBase[_weatherMonthIndex(monthIdx)] || clBase[0];
    var gMod = _getModEntry(WEATHER_GEO_MOD[geography] || WEATHER_GEO_MOD.inland, monthIdx);
    var tMod = _getModEntry(WEATHER_TERRAIN_MOD[terrain] || WEATHER_TERRAIN_MOD.open, monthIdx);
    function composeTrait(b, gm, tm, traitMin, traitMax) {
      var shift = (gm | 0) + (tm | 0);
      var mn = Math.max(traitMin, (b.min | 0) + shift);
      var mx = Math.min(traitMax, (b.max | 0) + shift);
      if (mx < mn) mx = mn;
      return { base: Math.max(mn, Math.min(mx, (b.base | 0) + shift)), die: b.die, min: mn, max: mx };
    }
    return {
      temp: composeTrait(base.temp, gMod.temp, tMod.temp, TRAIT_MIN.temp, TRAIT_MAX.temp),
      wind: composeTrait(base.wind, gMod.wind, tMod.wind, TRAIT_MIN.wind, TRAIT_MAX.wind),
      precip: composeTrait(base.precip, gMod.precip, tMod.precip, TRAIT_MIN.precip, TRAIT_MAX.precip),
      arcMult: (gMod.arc || 1) * (tMod.arc || 1)
    };
  }
  function _rollTrait(formula, seedNudge) {
    var raw = (formula.base | 0) + _rollDie(formula.die) - _rollDie(formula.die) + (seedNudge | 0);
    return Math.max(formula.min | 0, Math.min(formula.max | 0, raw));
  }
  function _todArc(climate, arcMult, period) {
    var arcDef = WEATHER_TOD_ARC[climate] || WEATHER_TOD_ARC.temperate;
    var traits = ["temp", "wind", "precip"];
    var result = { temp: 0, wind: 0, precip: 0 };
    for (var i = 0; i < traits.length; i++) {
      var t = traits[i];
      var raw = arcDef[t] && arcDef[t][period] != null ? arcDef[t][period] : 0;
      result[t] = Math.round(raw * arcMult);
    }
    return result;
  }
  function _todStochastic() {
    return {
      temp: WEATHER_TOD_BELL[_rollDie(20) - 1],
      wind: WEATHER_TOD_BELL[_rollDie(20) - 1],
      precip: WEATHER_TOD_BELL[_rollDie(20) - 1]
    };
  }
  var _FOG_BASE = {
    early_morning: 0.3,
    morning: 0.4,
    afternoon: 0.05,
    evening: 0.2,
    late_night: 0.1
  };
  var _FOG_GEO_MULT = {
    river_valley: 2,
    coastal: 1.5,
    inland_sea: 1.5,
    open_plains: 0.3,
    arctic_plain: 0.3,
    jungle_basin: 1.2
  };
  var _FOG_TERRAIN_MULT = {
    swamp: 2.5,
    forest: 1.5,
    desert: 0.1,
    alpine: 0.4
  };
  var _FOG_SEASON_WEIGHT = [
    0.5,
    // 0  mid-win
    0.5,
    // 1  late-win
    1.2,
    // 2  early-sp
    1.2,
    // 3  mid-sp
    1.2,
    // 4  late-sp
    0.7,
    // 5  early-su
    0.7,
    // 6  mid-su
    0.7,
    // 7  late-su
    1.2,
    // 8  early-au
    1.2,
    // 9  mid-au
    1.2,
    // 10 late-au
    0.6
    // 11 early-wn
  ];
  function _rollFog(period, pv, geography, terrain, monthIdx, prevPeriodFog) {
    if (pv.precip > 1 || pv.temp < 2) return "none";
    var base = _FOG_BASE[period] || 0.05;
    var gMult = _FOG_GEO_MULT[geography] || 1;
    var tMult = _FOG_TERRAIN_MULT[terrain] || 1;
    var sMult = _FOG_SEASON_WEIGHT[_weatherMonthIndex(monthIdx)] || 1;
    var prob = Math.min(0.9, base * gMult * tMult * sMult);
    if (prevPeriodFog === "dense" && pv.wind <= 1) prob = Math.min(0.9, prob * 2.5);
    else if (prevPeriodFog === "light" && pv.wind <= 1) prob = Math.min(0.9, prob * 1.5);
    var roll = _rollDie(100);
    if (roll > Math.round(prob * 100)) return "none";
    var isDense = terrain === "swamp" || geography === "river_valley";
    var rawFog = isDense ? "dense" : "light";
    if (rawFog === "light" && pv.wind >= 2) return "none";
    if (rawFog === "dense" && pv.wind >= 3) return "none";
    return rawFog;
  }
  function _blendWeatherValues(primary, secondary, primaryWeight, secondaryWeight) {
    primary = primary || {};
    secondary = secondary || {};
    primaryWeight = Math.max(1, primaryWeight | 0);
    secondaryWeight = Math.max(1, secondaryWeight | 0);
    var total = primaryWeight + secondaryWeight;
    return {
      temp: _clampWeatherTempBand(Math.round(((primary.temp || 0) * primaryWeight + (secondary.temp || 0) * secondaryWeight) / total)),
      wind: Math.max(0, Math.min(5, Math.round(((primary.wind || 0) * primaryWeight + (secondary.wind || 0) * secondaryWeight) / total))),
      precip: Math.max(0, Math.min(5, Math.round(((primary.precip || 0) * primaryWeight + (secondary.precip || 0) * secondaryWeight) / total)))
    };
  }
  function _generateDayWeather(serial, prevRec, locationOverride) {
    var loc = locationOverride || getWeatherState().location;
    if (!loc) return null;
    var dateObj = fromSerial(serial);
    var mi = dateObj.mi;
    var climate = String(loc.climate || "temperate").toLowerCase();
    var geography = String(loc.geography || "inland").toLowerCase();
    var terrain = String(loc.terrain || "open").toLowerCase();
    var formula = _composeFormula(climate, geography, terrain, mi);
    var arcMult = formula.arcMult;
    function _nudge(prev, base2) {
      var dev = (prev | 0) - (base2 | 0);
      if (dev >= 2) return -CONFIG_WEATHER_SEED_STRENGTH;
      if (dev <= -2) return CONFIG_WEATHER_SEED_STRENGTH;
      return 0;
    }
    var nudge = { temp: 0, wind: 0, precip: 0 };
    var prevFinal = prevRec && prevRec.final ? prevRec.final : null;
    if (prevFinal && CONFIG_WEATHER_SEED_STRENGTH > 0) {
      nudge.temp = _nudge(prevFinal.temp, formula.temp.base);
      nudge.wind = _nudge(prevFinal.wind, formula.wind.base);
      nudge.precip = _nudge(prevFinal.precip, formula.precip.base);
    }
    var base = {
      temp: _rollTrait(formula.temp, nudge.temp),
      wind: _rollTrait(formula.wind, nudge.wind),
      precip: _rollTrait(formula.precip, nudge.precip)
    };
    function periodVals(arc2, rng2) {
      var traits = ["temp", "wind", "precip"];
      var out = {};
      for (var i = 0; i < traits.length; i++) {
        var t = traits[i];
        var v = (base[t] | 0) + (arc2[t] | 0) + (rng2[t] | 0);
        out[t] = Math.max(formula[t].min | 0, Math.min(formula[t].max | 0, v));
      }
      return out;
    }
    var arc = {};
    var rng = {};
    var periods = {};
    for (var pi = 0; pi < WEATHER_DAY_PERIODS.length; pi++) {
      var pname = WEATHER_DAY_PERIODS[pi];
      arc[pname] = _todArc(climate, arcMult, pname);
      rng[pname] = _todStochastic();
      periods[pname] = periodVals(arc[pname], rng[pname]);
    }
    var prevNight = _weatherPrevNightValues(prevRec);
    if (prevNight) {
      periods.early_morning = _blendWeatherValues(prevNight, periods.early_morning, 2, 1);
    }
    var fog = {};
    var prevFog = _weatherPrevNightFog(prevRec);
    for (var fi = 0; fi < WEATHER_DAY_PERIODS.length; fi++) {
      var fogPeriod = WEATHER_DAY_PERIODS[fi];
      fog[fogPeriod] = _rollFog(fogPeriod, periods[fogPeriod], geography, terrain, mi, prevFog);
      prevFog = fog[fogPeriod];
    }
    var finalVals = {
      temp: periods[WEATHER_PRIMARY_PERIOD].temp,
      wind: periods[WEATHER_PRIMARY_PERIOD].wind,
      precip: periods[WEATHER_PRIMARY_PERIOD].precip
    };
    if (ensureSettings().planesEnabled !== false) {
      try {
        var _plEff = getActivePlanarEffects(serial);
        for (var _pe = 0; _pe < _plEff.length; _pe++) {
          var _ppe = _plEff[_pe];
          if (_ppe.plane === "Fernia" && _ppe.phase === "coterminous") finalVals.temp += 3;
          if (_ppe.plane === "Fernia" && _ppe.phase === "remote") finalVals.temp -= 2;
          if (_ppe.plane === "Risia" && _ppe.phase === "coterminous") finalVals.temp -= 3;
          if (_ppe.plane === "Risia" && _ppe.phase === "remote") finalVals.temp += 2;
          if (_ppe.plane === "Syrania" && _ppe.phase === "coterminous") {
            finalVals.precip = 0;
            finalVals.wind = 0;
          }
          if (_ppe.plane === "Syrania" && _ppe.phase === "remote") finalVals.precip = Math.min(5, finalVals.precip + 1);
        }
      } catch (e) {
      }
    }
    finalVals.temp = _clampWeatherTempBand(finalVals.temp);
    finalVals.temp = Math.max(-5, Math.min(15, finalVals.temp));
    var snowAccumulated = !!(prevFinal && prevFinal.temp <= 3 && prevFinal.precip >= 1);
    var wetAccumulated = !!(prevFinal && prevFinal.temp >= 5 && prevFinal.precip >= 2);
    return {
      serial,
      location: _normalizeWeatherLocation({ climate, geography, terrain }),
      monthIdx: mi,
      base,
      arc,
      rng,
      periods,
      fog,
      final: finalVals,
      snowAccumulated,
      wetAccumulated,
      generatedAt: todaySerial(),
      stale: false,
      locked: false
    };
  }
  function _forecastRecord(serial) {
    var fc = getWeatherState().forecast;
    for (var i = 0; i < fc.length; i++) {
      if (fc[i].serial === serial) return fc[i];
    }
    return null;
  }
  function _forecastIndex(serial) {
    var fc = getWeatherState().forecast;
    for (var i = 0; i < fc.length; i++) {
      if (fc[i].serial === serial) return i;
    }
    return -1;
  }
  function _historyRecord(serial) {
    var hist = getWeatherState().history;
    for (var i = hist.length - 1; i >= 0; i--) {
      if (hist[i].serial === serial) return hist[i];
    }
    return null;
  }
  function _generateForecast(fromSerial_, count, forceRegen) {
    var ws = getWeatherState();
    var loc = ws.location;
    if (!loc) {
      warnGM("Set a weather location first: !cal weather location");
      return 0;
    }
    count = count != null ? Math.max(1, count | 0) : CONFIG_WEATHER_FORECAST_DAYS;
    var generated = 0;
    var prevRec = null;
    var prevIdx = _forecastIndex(fromSerial_ - 1);
    if (prevIdx >= 0) prevRec = ws.forecast[prevIdx];
    else prevRec = _historyRecord(fromSerial_ - 1);
    for (var i = 0; i < count; i++) {
      var ser = fromSerial_ + i;
      var existing = _forecastRecord(ser);
      if (existing && !forceRegen && !existing.stale) continue;
      var rec = _generateDayWeather(ser, prevRec, loc);
      if (!rec) break;
      if (existing) {
        ws.forecast[_forecastIndex(ser)] = rec;
      } else {
        ws.forecast.push(rec);
      }
      prevRec = rec;
      generated++;
    }
    ws.forecast.sort(function(a, b) {
      return a.serial - b.serial;
    });
    return generated;
  }
  function weatherEnsureForecast() {
    var ws = getWeatherState();
    var today = todaySerial();
    ws.forecast = ws.forecast.filter(function(rec) {
      if (rec.serial < today) {
        rec.locked = true;
        ws.history.push(rec);
        return false;
      }
      return true;
    });
    ws.history.sort(function(a, b) {
      return a.serial - b.serial;
    });
    if (ws.history.length > CONFIG_WEATHER_HISTORY_DAYS) ws.history = ws.history.slice(ws.history.length - CONFIG_WEATHER_HISTORY_DAYS);
    var pruneThreshold = today - 60;
    Object.keys(ws.playerReveal && ws.playerReveal.byLocation || {}).forEach(function(sig) {
      var bucket = ws.playerReveal.byLocation[sig] || {};
      Object.keys(bucket).forEach(function(k) {
        if (parseInt(k, 10) < pruneThreshold) delete bucket[k];
      });
      if (!Object.keys(bucket).length) delete ws.playerReveal.byLocation[sig];
    });
    _generateForecast(today, CONFIG_WEATHER_FORECAST_DAYS, false);
  }
  function _uncertaintyTier(rec) {
    if (!rec) return "vague";
    if (rec.locked) return "certain";
    var dist = rec.serial - rec.generatedAt;
    var tiers = WEATHER_UNCERTAINTY;
    if (dist <= tiers.certain.maxDist) return "certain";
    if (dist <= tiers.likely.maxDist) return "likely";
    if (dist <= tiers.uncertain.maxDist) return "uncertain";
    return "vague";
  }
  var EXTREME_EVENTS = {
    flash_flood: {
      name: "Flash Flood",
      emoji: "\u{1F30A}",
      // Trigger: heavy rain in lowland/coastal geography
      check: function(f, loc, sa, wa) {
        var lowGeos = { river_valley: 1, coastal: 1, jungle_basin: 1, inland_sea: 1 };
        if (f.temp < 5 || f.precip < 3 || !lowGeos[loc.geography]) return 0;
        var p = 0.12;
        if (wa) p += 0.15;
        if (loc.terrain === "urban") p += 0.08;
        return Math.min(0.35, p);
      },
      duration: "1\u20134 hours",
      mechanics: "River crossings impassable. Low ground becomes difficult terrain. Swim DC 15 or be swept downstream (1d6 bludgeoning per round). Creatures in water: Str save DC 13 or knocked prone.",
      aftermath: "Roads washed out. Fords flooded for 1d4 days. Water sources silted.",
      playerMsg: function(loc) {
        return "A flash flood sweeps through the lowlands. The river bursts its banks \u2014 all crossings are closed.";
      }
    },
    whiteout: {
      name: "Whiteout",
      emoji: "\u2744\uFE0F",
      // Trigger: active blizzard on open flat terrain
      check: function(f, loc, sa, wa) {
        var openGeos = { open_plains: 1, arctic_plain: 1 };
        if (f.temp > 3 || f.precip < 3 || f.wind < 3 || !openGeos[loc.geography]) return 0;
        return 0.55;
      },
      duration: "2\u20138 hours",
      mechanics: "Visibility 0 ft (total whiteout). All creatures Blinded. Navigation impossible without magic \u2014 DC 20 Survival or travel in circles. Exposed creatures: DC 15 Con save each hour or gain Exhaustion.",
      aftermath: "Drifts 2\u20135 ft deep on open ground. All outdoor surfaces difficult terrain for 1d3 days.",
      playerMsg: function(loc) {
        return "A whiteout descends. The world disappears into white \u2014 sky and ground indistinguishable. Travel is impossible.";
      }
    },
    ground_blizzard: {
      name: "Ground Blizzard",
      emoji: "\u{1F4A8}",
      // Trigger: accumulated snow + storm wind on open terrain — no active precip needed
      check: function(f, loc, sa, wa) {
        var openGeos = { open_plains: 1, arctic_plain: 1 };
        if (!sa || f.wind < 3 || !openGeos[loc.geography]) return 0;
        if (f.precip > 1) return 0;
        return 0.35;
      },
      duration: "1\u20136 hours",
      mechanics: "Heavily Obscured beyond 30ft. Navigation DC 15 Survival. Exposed creatures: DC 12 Con save each hour or gain Exhaustion level. Flying impossible in open terrain.",
      aftermath: "Drifting fills roads and sheltered passages. Travel speed halved outdoors for the day.",
      playerMsg: function(loc) {
        return "A ground blizzard erupts \u2014 the wind picks up the snow already on the ground and flings it horizontally. Visibility collapses.";
      }
    },
    haboob: {
      name: "Dust Storm (Haboob)",
      emoji: "\u{1F32A}\uFE0F",
      // Trigger: hot dry conditions with wind — desert/plains in dry climate
      check: function(f, loc, sa, wa) {
        var dryTerrains = { desert: 1, open: 1 };
        var openGeos = { open_plains: 1, arctic_plain: 1 };
        var dryClimates = { dry: 1 };
        if (f.precip > 0 || f.temp < 9 || f.wind < 2) return 0;
        if (!dryTerrains[loc.terrain] && !openGeos[loc.geography]) return 0;
        var p = 0.1;
        if (f.wind >= 3) p += 0.05;
        if (f.temp >= 10) p += 0.05;
        return Math.min(0.2, p);
      },
      duration: "10 minutes \u2013 3 hours",
      mechanics: "Heavily Obscured beyond 30ft for duration. Creatures without eye/mouth protection: DC 12 Con save or become Poisoned (choking dust) until they take a short rest in shelter. Flying creatures: DC 15 Str save or be grounded.",
      aftermath: "Fine dust coats everything. Food/water may be contaminated. Visibility remains reduced (Lightly Obscured) for 1d4 hours after.",
      playerMsg: function(loc) {
        return "A wall of dust appears on the horizon and swallows the sky. Shelter \u2014 now.";
      }
    },
    avalanche: {
      name: "Avalanche",
      emoji: "\u26F0\uFE0F",
      // Trigger: highland geography, cold, heavy snow + wind — or post-storm loading
      check: function(f, loc, sa, wa) {
        if (loc.geography !== "highland") return 0;
        if (f.temp > 4) return 0;
        var p = 0;
        if (f.precip >= 2 && f.wind >= 2) p = 0.15;
        if (sa && f.precip >= 2) p = Math.max(p, 0.15);
        if (sa && f.precip >= 3 && f.wind >= 3) p = Math.min(0.38, p + 0.15);
        else if (f.wind >= 3) p = Math.min(0.38, p + 0.08);
        return p;
      },
      duration: "Instantaneous event; aftermath hours to days",
      mechanics: "Any creature in the avalanche path: DC 15 Dex save or take 6d6 bludgeoning and become Restrained (buried). Restrained creatures: DC 15 Athletics each round to dig free, or suffocate after Con modifier + proficiency bonus rounds.",
      aftermath: "Pass or valley blocked. Rescue operations may be needed. Travel through area impossible without magical aid or 1d4 days of clearing.",
      playerMsg: function(loc) {
        return "A thunderous crack echoes from above. Avalanche!";
      }
    },
    lightning_storm: {
      name: "Severe Thunderstorm",
      emoji: "\u26A1",
      // Trigger: severe rain + warm temp + wind
      check: function(f, loc, sa, wa) {
        if (f.temp < 7 || f.precip < 3 || f.wind < 2) return 0;
        var p = 0.25;
        if (f.temp >= 9) p += 0.1;
        return Math.min(0.35, p);
      },
      duration: "1\u20133 hours",
      mechanics: "Lightning strikes: each minute outdoors, DC 13 Dex save or be struck (4d10 lightning damage, DC 14 Con save or Stunned 1 round). Metal armour wearers: disadvantage on save. Tall isolated objects are struck first.",
      aftermath: "Fires possible in dry terrain. Fallen trees may block roads. Flash flooding risk elevated (see Flash Flood).",
      playerMsg: function(loc) {
        return "The storm reaches a violent peak. Lightning splits the sky \u2014 this is not a safe time to be in the open.";
      }
    },
    clear_sky_strike: {
      name: "Clear-Sky Lightning",
      emoji: "\u{1F329}\uFE0F",
      // Trigger: uncommon atmospheric discharge with little/no precipitation.
      // Enhanced during Zarantyr full moon via _evaluateExtremeEvents.
      check: function(f, loc, sa, wa) {
        if (f.precip > 1 || f.wind > 2) return 0;
        var p = 0.02;
        if (f.temp >= 7) p += 0.02;
        if (f.temp >= 9) p += 0.01;
        return Math.min(0.06, p);
      },
      duration: "Instantaneous strike or short burst (minutes)",
      mechanics: "An unexpected bolt strikes with little warning. Creatures in exposed outdoor terrain make DC 13 Dex save or take 3d10 lightning damage (half on success). Tall isolated objects are preferential targets.",
      aftermath: "Potential localized fire or structural scorch at strike site.",
      playerMsg: function(loc) {
        return "A jagged bolt tears from a clear sky. Thunder follows seconds later.";
      }
    },
    flash_freeze: {
      name: "Flash Freeze",
      emoji: "\u{1F9CA}",
      // Trigger: today is suddenly very cold after a warm wet yesterday
      check: function(f, loc, sa, wa) {
        if (!wa || f.temp > 3 || f.wind < 2) return 0;
        return 0.25;
      },
      duration: "1\u20134 hours for freeze; persists until thaw",
      mechanics: "All exposed water surfaces (puddles, ford crossings, wet mud) become ice. Difficult terrain on all outdoor surfaces. DC 12 Acrobatics to avoid falling prone when moving at full speed on ice.",
      aftermath: "Icy surfaces persist until temperature rises above band 4 (45F+). Fords may be crossable on foot \u2014 or may give way.",
      playerMsg: function(loc) {
        return "The temperature plummets. Water crystallizes where it stands. The world glazes over in an hour.";
      }
    },
    tropical_storm: {
      name: "Tropical Storm",
      emoji: "\u{1F300}",
      // Trigger: warm/hot + coastal or open sea + high wind + rain
      check: function(f, loc, sa, wa) {
        var seaGeos = { coastal: 1, open_sea: 1, inland_sea: 1 };
        if (f.temp < 7 || f.wind < 3 || f.precip < 3 || !seaGeos[loc.geography]) return 0;
        var p = 0.2;
        if (f.wind >= 4) p += 0.15;
        if (f.temp >= 9) p += 0.1;
        return Math.min(0.45, p);
      },
      duration: "6\u201324 hours",
      mechanics: "Wind: sustained gale-force. Ranged weapon attacks and flying have disadvantage. Small sailing vessels: DC 15 water vehicles check each hour or capsize. Structures: DC 12 to resist minor damage to roofs and shutters. Outdoor fires extinguished.",
      aftermath: "Coastal flooding for 1d3 days. Minor structural damage. Debris-strewn roads.",
      playerMsg: function(loc) {
        return "A tropical storm bears down on the coast. Winds howl, rain drives sideways, and the sea surges against the shore.";
      }
    },
    hurricane: {
      name: "Hurricane",
      emoji: "\u{1F30A}",
      // Trigger: extremely warm + open sea or coastal + extreme wind + deluge
      // Rarer and more dangerous than tropical storm
      check: function(f, loc, sa, wa) {
        var seaGeos = { coastal: 1, open_sea: 1 };
        if (f.temp < 9 || f.wind < 4 || f.precip < 4 || !seaGeos[loc.geography]) return 0;
        var p = 0.3;
        if (f.wind >= 5) p += 0.2;
        if (f.precip >= 5) p += 0.1;
        return Math.min(0.6, p);
      },
      duration: "12\u201348 hours",
      mechanics: "Wind: hurricane force. All ranged attacks impossible. Flying impossible without magic (DC 18 Str save each round). Creatures outdoors: DC 13 Str save each round or be knocked prone and pushed 10 ft. All non-stone structures: DC 15 to resist significant damage. Ships at sea: DC 18 water vehicles each hour or capsize with 4d6 bludgeoning to all aboard. Storm surge floods coastal areas to 1d4 \xD7 5 feet.",
      aftermath: "Catastrophic coastal flooding for 1d6 days. Major structural damage. Trees uprooted. Roads impassable for 1d4 days. Water sources contaminated.",
      playerMsg: function(loc) {
        return "The sky turns an unearthly green. The hurricane hits with a wall of wind and water that shakes the foundations of the world.";
      }
    }
  };
  function _evaluateExtremeEvents(rec) {
    rec = _weatherRecordForDisplay(rec);
    if (!rec) return [];
    var f = rec.final;
    var loc = rec.location || {};
    var sa = !!rec.snowAccumulated;
    var wa = !!rec.wetAccumulated;
    var zarantyrFull = _isZarantyrFull(rec.serial);
    var qualified = [];
    var keys = Object.keys(EXTREME_EVENTS);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var evt = EXTREME_EVENTS[key];
      var p = evt.check(f, loc, sa, wa);
      if (key === "lightning_storm" && zarantyrFull) {
        p = Math.min(0.65, p + 0.2);
      }
      if (key === "clear_sky_strike") {
        if (!zarantyrFull) p = 0;
        else p = Math.min(0.15, p + 0.05);
      }
      if (p > 0) qualified.push({ key, event: evt, probability: p });
    }
    return qualified;
  }
  function _rollExtremeEvent(key, rec) {
    var evt = EXTREME_EVENTS[key];
    if (!evt) return false;
    rec = _weatherRecordForDisplay(rec);
    if (!rec || !rec.final) return false;
    var f = rec.final;
    var loc = rec.location || {};
    var p = evt.check(f, loc, !!rec.snowAccumulated, !!rec.wetAccumulated);
    var zarantyrFull = _isZarantyrFull(rec.serial);
    if (key === "lightning_storm" && zarantyrFull) p = Math.min(0.65, p + 0.2);
    if (key === "clear_sky_strike") {
      if (!zarantyrFull) p = 0;
      else p = Math.min(0.15, p + 0.05);
    }
    return _rollDie(100) <= Math.round(p * 100);
  }
  function _extremeEventPanelHtml(rec) {
    var events2 = _evaluateExtremeEvents(rec);
    if (!events2.length) return "";
    var mechanicsOn = ensureSettings().weatherMechanicsEnabled !== false;
    var lines = ['<div style="margin-top:6px;border-top:1px solid rgba(0,0,0,.15);padding-top:5px;">'];
    lines.push('<div style="font-size:.85em;font-weight:bold;color:#B71C1C;margin-bottom:3px;">\u26A0 Extreme Event Conditions Present</div>');
    for (var i = 0; i < events2.length; i++) {
      var e = events2[i];
      var pct = Math.round(e.probability * 100);
      var triggerBtn = button(e.event.emoji + " Mark Active", "weather event trigger " + e.key);
      var rollBtn = button("\u{1F3B2} Roll (GM) (" + pct + "%)", "weather event roll " + e.key);
      lines.push(
        '<div style="margin:3px 0;padding:4px 6px;background:rgba(183,28,28,.06);border-radius:4px;border:1px solid rgba(183,28,28,.2);"><div style="font-size:.9em;font-weight:bold;">' + esc(e.event.emoji + " " + e.event.name) + "</div>" + (mechanicsOn && e.event.mechanics ? '<div style="font-size:.85em;opacity:.85;margin:2px 0;">' + esc(e.event.mechanics) + "</div>" : "") + '<div style="margin-top:3px;">' + triggerBtn + " " + rollBtn + "</div></div>"
      );
    }
    lines.push("</div>");
    return lines.join("");
  }
  function _extremeEventDetailsHtml(key, rec) {
    var evt = EXTREME_EVENTS[key];
    if (!evt) return "";
    var msg = evt.playerMsg(rec ? rec.location || {} : {});
    var mechanicsOn = ensureSettings().weatherMechanicsEnabled !== false;
    return '<div style="border:2px solid #B71C1C;border-radius:5px;padding:6px 10px;background:#FFF3F3;"><div style="font-size:1.1em;font-weight:bold;color:#B71C1C;">' + esc(evt.emoji + " " + evt.name) + '</div><div style="margin-top:3px;">' + esc(msg) + '</div><div style="font-size:.85em;margin-top:4px;opacity:.85;border-top:1px solid rgba(183,28,28,.2);padding-top:3px;"><b>Duration:</b> ' + esc(evt.duration) + "<br>" + (mechanicsOn ? "<b>Mechanics:</b> " + esc(evt.mechanics) + "<br>" : "<b>Mechanics:</b> Disabled in settings<br>") + "<b>Aftermath:</b> " + esc(evt.aftermath) + "</div></div>";
  }
  function _deriveConditions(pv, loc, period, snowAccumulated, fogOverride) {
    var temp = pv.temp || 0;
    var wind = pv.wind || 0;
    var precip = pv.precip || 0;
    var geo = loc && loc.geography || "inland";
    var terrain = loc && loc.terrain || "open";
    var precipType = "none";
    if (precip >= 1) {
      if (temp <= 3) {
        precipType = precip >= 4 ? "blizzard" : precip >= 3 ? "snow" : "snow_light";
      } else if (temp === 4) {
        precipType = precip >= 4 ? "ice_storm" : precip >= 3 ? "sleet" : "sleet_light";
      } else {
        precipType = precip >= 5 ? "deluge" : precip >= 4 ? "heavy_rain" : precip >= 3 ? "rain" : "rain_light";
      }
    }
    var fog = fogOverride !== void 0 ? fogOverride : "none";
    if (fog === void 0) fog = "none";
    var vis = { tier: "none", beyond: null };
    if (fog === "dense" || precipType === "blizzard" || precipType === "deluge") {
      vis = { tier: "C", beyond: 30 };
    } else if (fog === "light" || precipType === "heavy_rain" || precipType === "ice_storm") {
      vis = { tier: "B", beyond: 60 };
    } else if (precipType === "rain" || precipType === "snow" || precipType === "sleet") {
      vis = { tier: "A", beyond: null };
    }
    var difficultTerrain = precipType === "sleet" || precipType === "ice_storm" || precipType === "blizzard" || precipType === "deluge" || precipType === "snow" && snowAccumulated;
    var mechLines = [];
    var tm = _weatherTempMechanics(temp);
    if (tm) mechLines.push("<b>Temperature:</b> " + esc(tm));
    var wm = CONFIG_WEATHER_MECHANICS.wind[wind];
    if (wm) mechLines.push("<b>Wind:</b> " + esc(wm));
    if (vis.tier !== "none") {
      var visStr = "";
      if (vis.tier === "C") {
        visStr = "Lightly Obscured. Heavily Obscured beyond 30ft. Perception at disadvantage.";
      } else if (vis.tier === "B") {
        visStr = "Lightly Obscured. Heavily Obscured beyond 60ft. Perception at disadvantage.";
      } else {
        visStr = "Lightly Obscured. Perception at disadvantage.";
      }
      var visSource = fog !== "none" ? "Fog" : "Precipitation";
      mechLines.push("<b>" + visSource + ":</b> " + visStr);
    }
    if (difficultTerrain) {
      var dtReason = precipType === "snow" && snowAccumulated ? "Difficult terrain on all surfaces (accumulated snow underfoot)." : precipType === "blizzard" ? "Difficult terrain on all surfaces (rapidly accumulating snow)." : "Difficult terrain on all surfaces (ice).";
      mechLines.push("<b>Terrain:</b> " + dtReason);
    }
    if (precipType === "heavy_rain" || precipType === "deluge" || precipType === "blizzard" || precipType === "ice_storm") {
      var hazardNote = precipType === "heavy_rain" ? "Risk of lightning and flash flooding. Soft ground may become difficult terrain at GM discretion." : precipType === "deluge" ? "Extreme flooding. Rivers burst banks. Roads impassable. Shelter imperative." : precipType === "blizzard" ? "Risk of whiteout, avalanche (mountainous terrain), and hypothermia." : "Risk of lightning, flash flooding, or falling ice.";
      mechLines.push("<b>Hazards:</b> " + hazardNote);
    }
    return {
      precipType,
      // none|rain_light|rain|heavy_rain|deluge|snow_light|snow|blizzard|sleet_light|sleet|ice_storm
      fog,
      // none|light|dense
      visibility: vis,
      // { tier:'none'|'A'|'B'|'C', beyond:null|30|60 }
      difficultTerrain,
      mechanics: mechLines
      // array of HTML strings, ready to join
    };
  }
  function _conditionsMechHtml(cond) {
    if (ensureSettings().weatherMechanicsEnabled === false) return "";
    if (!cond.mechanics.length) return "";
    return '<div style="font-size:.85em;margin-top:3px;">' + cond.mechanics.join("<br>") + "</div>";
  }
  function weatherTodayMechanicsHtml() {
    if (ensureSettings().weatherMechanicsEnabled === false) {
      return _menuBox(
        "\u{1F4CB} Weather Mechanics",
        '<div style="opacity:.7;">Mechanical weather effects are disabled. Narrative weather remains active.</div><div style="margin-top:6px;">' + button("\u2B05 Back", "weather") + "</div>"
      );
    }
    var today = todaySerial();
    var rec = _weatherRecordForDisplay(_forecastRecord(today));
    if (!rec || !rec.final) return _menuBox("\u{1F4CB} Weather Mechanics", '<div style="opacity:.7;">No weather data for today.</div>');
    var f = rec.final;
    var loc = rec.location || {};
    var d = fromSerial(today);
    var dateLabel = esc(_displayMonthDayParts(d.mi, d.day).label);
    var sections = [];
    var periods = WEATHER_DAY_PERIODS;
    for (var pi = 0; pi < periods.length; pi++) {
      var period = periods[pi];
      var periodVals = rec.periods && rec.periods[period] || f;
      var fogForPeriod = rec.fog && rec.fog[period];
      var cond = _deriveConditions(periodVals, loc, period, rec.snowAccumulated, fogForPeriod);
      var narr = _conditionsNarrative(periodVals, cond, period);
      var mechBlock = _conditionsMechHtml(cond);
      sections.push(
        '<div style="margin-top:6px;"><b>' + _weatherPeriodIcon(period) + " " + esc(_weatherPeriodLabel(period)) + ":</b> " + esc(narr) + (mechBlock || "") + "</div>"
      );
    }
    var extremes = _evaluateExtremeEvents(rec);
    if (extremes.length) {
      var exHtml = '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.15);padding-top:6px;"><b style="color:#B71C1C;">\u26A1 Extreme Events:</b>';
      for (var ei = 0; ei < extremes.length; ei++) {
        var ex = extremes[ei];
        exHtml += '<div style="margin:4px 0;font-size:.9em;"><b>' + esc(ex.event.name) + "</b>";
        if (ex.event.mechanics) exHtml += '<br><span style="font-size:.9em;">' + esc(ex.event.mechanics) + "</span>";
        exHtml += "</div>";
      }
      exHtml += "</div>";
      sections.push(exHtml);
    }
    var shifts = _activePlanarWeatherShiftLines(today);
    if (shifts.length) {
      sections.push(
        '<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,.15);padding-top:6px;"><b>\u{1F300} Planar Effects:</b><br>' + shifts.map(esc).join("<br>") + "</div>"
      );
    }
    moonEnsureSequences();
    var lightHtml = nighttimeLightHtml(today);
    if (lightHtml) {
      sections.push(
        `<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,.15);padding-top:6px;"><b>\u{1F319} Tonight's Lighting:</b><br>` + lightHtml + "</div>"
      );
    }
    return _menuBox(
      "\u{1F4CB} Weather Mechanics \u2014 " + dateLabel,
      sections.join("") + '<div style="margin-top:8px;">' + button("\u2B05 Back", "weather") + "</div>"
    );
  }
  function _conditionsNarrative(pv, cond, period) {
    var base = _flavorText(pv);
    if (cond.fog !== "none" && pv.precip <= 1) {
      if (cond.fog === "dense") {
        if (period === "early_morning") base = pv.precip === 0 ? "Dense predawn fog." : "Dense fog before dawn.";
        else if (period === "morning") base = pv.precip === 0 ? "Dense fog." : "Dense fog and overcast.";
        else if (period === "afternoon") base = pv.precip === 0 ? "Dense fog persisting into the day." : "Overcast with thick fog.";
        else if (period === "evening") base = pv.precip === 0 ? "Dense fog settling in." : "Foggy and overcast.";
        else base = pv.precip === 0 ? "Dense night fog." : "Low cloud and heavy fog.";
      } else {
        if (period === "early_morning") base = pv.precip === 0 ? "Patchy predawn fog." : base;
        else if (period === "morning") base = pv.precip === 0 ? "Patchy morning fog." : base;
        else if (period === "afternoon") base = pv.precip === 0 ? "Patchy fog." : base;
        else if (period === "evening") base = pv.precip === 0 ? "Light evening fog." : base;
        else base = pv.precip === 0 ? "Light night fog." : base;
      }
    }
    return base;
  }
  function _tempBand(stage) {
    if (stage <= 3) return "cold";
    if (stage === 4) return "cool";
    if (stage <= 6) return "mild";
    if (stage <= 8) return "warm";
    return "hot";
  }
  function _flavorText(pv) {
    var key = _tempBand(pv.temp) + "|" + (pv.precip | 0);
    var base = CONFIG_WEATHER_FLAVOR[key] || "Conditions are unusual.";
    if (pv.wind >= 2) {
      var isStorm = pv.wind >= 3;
      var hasHeavyPrecip = pv.precip >= 2;
      var windClause;
      if (hasHeavyPrecip) {
        windClause = isStorm ? " Storm-force winds." : " High winds.";
      } else {
        windClause = isStorm ? " Storm-force winds make exposed travel dangerous." : " Strong winds throughout the day.";
      }
      base += windClause;
    }
    return base;
  }
  function _roughWeatherDescriptor(pv, cond) {
    if (!pv) return "Weather looks steady.";
    cond = cond || { precipType: "none", fog: "none" };
    if ((pv.wind | 0) >= 3 || cond.precipType === "blizzard" || cond.precipType === "ice_storm" || cond.precipType === "deluge" || cond.precipType === "heavy_rain") {
      return "Storm conditions look likely.";
    }
    switch (cond.precipType) {
      case "snow":
      case "snow_light":
        return "Snow looks likely.";
      case "sleet":
      case "sleet_light":
        return "Sleet looks likely.";
      case "rain":
      case "rain_light":
        return "Rain looks likely.";
    }
    if (cond.fog === "dense" || cond.fog === "light") return "Fog looks likely.";
    if ((pv.wind | 0) === 2) return "Looks breezy.";
    if ((pv.precip | 0) >= 1) return "Looks mostly cloudy.";
    if ((pv.temp | 0) <= 1) return "Looks clear and cold.";
    if ((pv.temp | 0) >= 10) return "Looks clear and hot.";
    return "Looks like clear skies.";
  }
  function _weatherLowTodayHtml(rec, loc) {
    var lines = [];
    for (var i = 0; i < WEATHER_LOW_TOD_PERIODS.length; i++) {
      var period = WEATHER_LOW_TOD_PERIODS[i];
      var pv = rec.periods && rec.periods[period] || _weatherPrimaryValues(rec) || rec.final || {};
      var cond = _deriveConditions(pv, loc, period, rec.snowAccumulated, rec.fog && rec.fog[period]);
      lines.push(
        '<div style="margin-top:2px;">' + _weatherPeriodIcon(period) + " <b>" + esc(_weatherPeriodShortLabel(period)) + ":</b> " + esc(_roughWeatherDescriptor(pv, cond)) + "</div>"
      );
    }
    return '<div style="font-size:.85em;margin-top:3px;">' + lines.join("") + "</div>";
  }
  function _weatherCommonDayHeadline(rec, dayOffset) {
    var loc = rec.location || {};
    var pv = _weatherPrimaryValues(rec) || rec.final || {};
    var cond = _deriveConditions(pv, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    var dayLabel = dayOffset <= 0 ? "Today" : dayOffset === 1 ? "Tomorrow" : dayOffset === 2 ? "The day after tomorrow" : "";
    return dayLabel ? dayLabel + ": " + _roughWeatherDescriptor(pv, cond) : _roughWeatherDescriptor(pv, cond);
  }
  function _weatherTraitBadge(trait, stage) {
    var palettes = {
      temp: [
        "#7AA7D9",
        "#9CC2E8",
        "#B6D6F2",
        "#D0E6FA",
        "#E4F1FF",
        "#EEF6FF",
        "#F5F5F0",
        "#FFF3E0",
        "#FFE2B6",
        "#FFC98F",
        "#FFB074"
      ],
      wind: ["#F5F5F5", "#E0E8E0", "#B0BEC5", "#546E7A"],
      precip: ["#F0F8FF", "#CFE8F5", "#90CAF9", "#1565C0"]
    };
    var pal = palettes[trait] || palettes.wind;
    var idx;
    if (trait === "temp") {
      idx = Math.round((_clampWeatherTempBand(stage) - WEATHER_TEMP_BAND_MIN) / (WEATHER_TEMP_BAND_MAX - WEATHER_TEMP_BAND_MIN) * (pal.length - 1));
    } else {
      idx = Math.max(0, Math.min(stage, pal.length - 1));
    }
    var bg = pal[Math.max(0, Math.min(idx, pal.length - 1))];
    var label = trait === "temp" ? _weatherTempLabel(stage) : (CONFIG_WEATHER_LABELS[trait] || [])[stage] || String(stage);
    var tc = textColor(bg);
    return '<span style="display:inline-block;padding:1px 5px;border-radius:3px;border:1px solid rgba(0,0,0,.2);background:' + esc(bg) + ";color:" + esc(tc) + ';font-size:.85em;">' + esc(label) + "</span>";
  }
  function _weatherDayGmHtml(rec, showBreakdown) {
    rec = _weatherRecordForDisplay(rec);
    if (!rec) return '<div style="opacity:.6;">(no data)</div>';
    var tier = _uncertaintyTier(rec);
    var f = rec.final;
    var tCfg = WEATHER_UNCERTAINTY[tier] || WEATHER_UNCERTAINTY.vague;
    var lines = [];
    if (rec.stale) {
      lines.push('<div style="color:#E65100;font-size:.85em;">\u26A0 Stale \u2014 location changed. Reroll to update.</div>');
    }
    lines.push(
      '<div style="margin:3px 0;">' + _weatherTraitBadge("temp", f.temp) + "&nbsp;" + _weatherTraitBadge("wind", f.wind) + "&nbsp;" + _weatherTraitBadge("precip", f.precip) + "</div>"
    );
    lines.push('<div style="font-size:.8em;opacity:.7;">T:' + f.temp + " W:" + f.wind + " P:" + f.precip + "&nbsp;&nbsp;[" + esc(tCfg.label) + "]</div>");
    lines.push(_weatherInfluenceHtml(rec));
    if (showBreakdown && (tier === "certain" || showBreakdown === "force")) {
      let critNote = function(delta2) {
        var crits = [];
        if (Math.abs(delta2.temp) === 2) crits.push("T");
        if (Math.abs(delta2.wind) === 2) crits.push("W");
        if (Math.abs(delta2.precip) === 2) crits.push("P");
        return crits.length ? ' <span style="color:#C62828;font-size:.85em;">\u2605' + crits.join(",") + "</span>" : "";
      }, periodBadges = function(pv2) {
        return _weatherTraitBadge("temp", pv2.temp) + "&nbsp;" + _weatherTraitBadge("wind", pv2.wind) + "&nbsp;" + _weatherTraitBadge("precip", pv2.precip);
      };
      var p = rec.periods || {};
      var rng = rec.rng || {};
      var rloc = rec.location || {};
      var baseStr = "Base T:" + rec.base.temp + " W:" + rec.base.wind + " P:" + rec.base.precip;
      var pNames = WEATHER_DAY_PERIODS;
      var bLines = ['<div style="margin-top:4px;"><div style="font-size:.8em;opacity:.6;">' + esc(baseStr) + "</div>"];
      for (var pi = 0; pi < pNames.length; pi++) {
        var pname = pNames[pi];
        var pv = p[pname] || {};
        var delta = rng[pname] || {};
        var cond = _deriveConditions(pv, rloc, pname, rec.snowAccumulated, rec.fog && rec.fog[pname]);
        var narr = esc(_conditionsNarrative(pv, cond, pname));
        var mechHtml = _conditionsMechHtml(cond);
        bLines.push(
          '<div style="margin-top:3px;font-size:.85em;">' + _weatherPeriodIcon(pname) + " <b>" + esc(_weatherPeriodLabel(pname)) + ":</b> " + narr + critNote(delta) + '<br><span style="margin-left:10px;">' + periodBadges(pv) + "</span>" + (mechHtml ? '<div style="margin-left:10px;opacity:.9;">' + mechHtml + "</div>" : "") + "</div>"
        );
      }
      bLines.push("</div>");
      lines.push(bLines.join(""));
    }
    return lines.join("");
  }
  function _mediumDetailTier(dayOffset) {
    if (dayOffset <= 0) return "high";
    if (dayOffset <= 2) return "medium";
    return "low";
  }
  var _TIER_RANK = { high: 3, medium: 2, low: 1 };
  function _bestTier(a, b) {
    return (_TIER_RANK[a] || 0) >= (_TIER_RANK[b] || 0) ? a : b;
  }
  var WEATHER_SOURCE_LABELS = {
    common: "Common Knowledge",
    low: "Common Knowledge",
    medium: "Skilled Forecast",
    high: "Expert Forecast",
    specific: "Divination Reveal"
  };
  function _grantCommonWeatherReveals(ws, today) {
    if (!ws) ws = getWeatherState();
    if (!isFinite(today)) today = todaySerial();
    _recordReveal(ws, today, "low", "common");
    if (_forecastRecord(today + 1)) _recordReveal(ws, today + 1, "low", "common");
    if (_forecastRecord(today + 2)) _recordReveal(ws, today + 2, "low", "common");
  }
  function _recordReveal(ws, serial, tier, source, loc) {
    var key = String(serial);
    var bucket = _weatherRevealBucket(ws, loc, true);
    var prev = bucket[key];
    var prevTier = prev && typeof prev === "object" ? prev.tier : typeof prev === "string" ? prev : "low";
    var prevSource = prev && typeof prev === "object" ? prev.source : "common";
    var newTier = _bestTier(prevTier, tier);
    var newSource = newTier !== prevTier ? source || "common" : prevSource;
    var revealLoc = _normalizeWeatherLocation(loc || ws.location);
    bucket[key] = {
      tier: newTier,
      source: newSource,
      locationSig: revealLoc ? revealLoc.sig : "",
      locationLabel: revealLoc ? revealLoc.name : ""
    };
  }
  function _readReveal(entry) {
    if (!entry) return { tier: null, source: "common" };
    if (typeof entry === "string") return { tier: entry, source: "common" };
    return {
      tier: entry.tier || null,
      source: entry.source || "common",
      locationSig: entry.locationSig || "",
      locationLabel: entry.locationLabel || ""
    };
  }
  function _weatherRevealForSerial(ws, serial, loc) {
    ws = ws || getWeatherState();
    var bucket = _weatherRevealBucket(ws, loc, false);
    return _readReveal(bucket[String(serial)]);
  }
  function _playerDayHtml(rec, detailTier, isToday, sourceLabel) {
    rec = _weatherRecordForDisplay(rec);
    if (!rec) return "";
    var d = fromSerial(rec.serial);
    var dateLabel;
    if (isToday && ensureSettings().calendarSystem !== "faerunian") {
      dateLabel = esc(getCal().weekdays[getCal().current.day_of_the_week]) + ", " + esc(_displayMonthDayParts(d.mi, d.day).label);
    } else {
      dateLabel = esc(_displayMonthDayParts(d.mi, d.day).label);
    }
    var f = rec.final;
    var loc = rec.location || {};
    var content = "";
    var dayOffset = rec.serial - todaySerial();
    var srcLine = sourceLabel ? '<div style="font-size:.75em;opacity:.45;font-style:italic;margin-top:1px;">' + esc(sourceLabel) + "</div>" : "";
    var influenceLine = _weatherInfluenceHtml(rec);
    if (detailTier === "high") {
      var todHtml = "";
      if (rec.periods) {
        var p = rec.periods;
        var pNames = WEATHER_DAY_PERIODS;
        var pLines = [];
        for (var pi = 0; pi < pNames.length; pi++) {
          var pname = pNames[pi];
          var pv = p[pname] || {};
          var cond = _deriveConditions(pv, loc, pname, rec.snowAccumulated, rec.fog && rec.fog[pname]);
          var narr = esc(_conditionsNarrative(pv, cond, pname));
          var mhtml = isToday ? _conditionsMechHtml(cond) : "";
          pLines.push(
            '<div style="margin-top:2px;">' + _weatherPeriodIcon(pname) + " <b>" + esc(_weatherPeriodLabel(pname)) + ":</b> " + narr + (mhtml ? '<div style="margin-left:12px;">' + mhtml + "</div>" : "") + "</div>"
          );
        }
        todHtml = '<div style="font-size:.85em;margin-top:3px;">' + pLines.join("") + "</div>";
      }
      var dayCond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
      var nightHtml = "";
      if (isToday) {
        moonEnsureSequences();
        var nl = nighttimeLightHtml(rec.serial);
        if (nl) nightHtml = '<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(0,0,0,.08);"><b style="font-size:.85em;">\u{1F319} Tonight:</b>' + nl + "</div>";
      }
      content = "<div>" + esc(_conditionsNarrative(f, dayCond, WEATHER_PRIMARY_PERIOD)) + "</div>" + todHtml + nightHtml;
    } else if (detailTier === "medium") {
      var mc = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
      content = "<div>" + esc(_conditionsNarrative(f, mc, WEATHER_PRIMARY_PERIOD)) + "</div>";
    } else {
      if (dayOffset <= 0) {
        content = _weatherLowTodayHtml(rec, loc);
      } else {
        content = '<div style="opacity:.85;">' + esc(_weatherCommonDayHeadline(rec, dayOffset)) + "</div>";
      }
    }
    return '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,.12);"><div style="font-weight:bold;font-size:.9em;">' + dateLabel + (isToday ? " (Today)" : "") + "</div>" + content + influenceLine + srcLine + "</div>";
  }
  function sendPlayerForecast(m, method, days) {
    var ws = getWeatherState();
    var today = todaySerial();
    if (!ws.location) {
      warnGM("No weather location set.");
      return;
    }
    days = Math.min(days, 10);
    var methodNorm = String(method || "").toLowerCase();
    var revealSource = methodNorm;
    var sourceLabel = WEATHER_SOURCE_LABELS[revealSource] || revealSource;
    var blocks = [];
    var revealed = 0;
    for (var i = 0; i < days; i++) {
      var ser = today + i;
      var rec = _forecastRecord(ser);
      if (!rec) continue;
      var tier = methodNorm === "high" ? "high" : _mediumDetailTier(i);
      _recordReveal(ws, ser, tier, revealSource, ws.location);
      blocks.push(_playerDayHtml(rec, tier, i === 0, sourceLabel));
      revealed++;
    }
    if (!revealed) {
      warnGM("No weather records available for that range. Try generating the forecast first.");
      return;
    }
    var methodLabel = methodNorm === "high" ? "Expert Forecast" : "Skilled Forecast";
    var dateObj = fromSerial(today);
    var titleDate = esc(_displayMonthDayParts(dateObj.mi, dateObj.day).label);
    var locLabel = _weatherLocationLabel(ws.location);
    sendToAll(_menuBox(
      methodLabel + " \u2014 " + titleDate,
      '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Location: <b>' + esc(locLabel) + "</b></div>" + blocks.join("")
    ));
    warnGM("Sent " + revealed + "-day " + methodLabel.toLowerCase() + " to players.");
  }
  function _parseWeatherRevealDayToken(tok) {
    var raw = String(tok || "").trim();
    if (!raw) return null;
    var rangeMatch = raw.match(/^(.+?)\s*-\s*(.+)$/);
    if (rangeMatch) {
      var a = Parse.ordinalDay(rangeMatch[1]);
      if (a == null && /^\d+$/.test(rangeMatch[1])) a = parseInt(rangeMatch[1], 10);
      var b = Parse.ordinalDay(rangeMatch[2]);
      if (b == null && /^\d+$/.test(rangeMatch[2])) b = parseInt(rangeMatch[2], 10);
      if (a == null || b == null) return null;
      return { start: a | 0, end: b | 0 };
    }
    var day = Parse.ordinalDay(raw);
    if (day == null && /^\d+$/.test(raw)) day = parseInt(raw, 10);
    if (day == null) return null;
    return { start: day | 0, end: day | 0 };
  }
  function _parseWeatherRevealDateSpec(tokens) {
    tokens = (tokens || []).map(function(tok) {
      return String(tok || "").trim();
    }).filter(Boolean);
    if (!tokens.length) return null;
    var cal = getCal();
    var cur = cal.current;
    var months = cal.months;
    var idx = 0;
    var mi = -1;
    var year = null;
    var daySpec = null;
    var maybeMonth = monthIndexByName(tokens[idx]);
    if (maybeMonth !== -1) {
      mi = maybeMonth;
      idx++;
    } else if (tokens.length >= 2 && /^\d+$/.test(tokens[idx])) {
      var monthNum = parseInt(tokens[idx], 10);
      if (monthNum >= 1 && monthNum <= months.length) {
        mi = monthNum - 1;
        idx++;
      }
    }
    daySpec = _parseWeatherRevealDayToken(tokens[idx]);
    if (!daySpec) return null;
    idx++;
    if (tokens[idx] && /^\d{1,6}$/.test(tokens[idx])) {
      year = parseInt(tokens[idx], 10);
      idx++;
    }
    if (idx !== tokens.length) return null;
    if (mi === -1) {
      var next = nextForDayOnly(cur, daySpec.start, months.length);
      mi = next.month;
      if (year == null) year = next.year;
    } else if (year == null) {
      year = nextForMonthDay(cur, mi, daySpec.start).year;
    }
    var maxDay = Math.max(1, months[mi].days | 0);
    var startDay = clamp(daySpec.start, 1, maxDay);
    var endDay = clamp(daySpec.end, 1, maxDay);
    if (startDay > endDay) {
      var swap = startDay;
      startDay = endDay;
      endDay = swap;
    }
    return {
      year,
      mi,
      startDay,
      endDay,
      startSerial: toSerial(year, mi, startDay),
      endSerial: toSerial(year, mi, endDay)
    };
  }
  function _specificWeatherRevealHtml(startSerial, endSerial, sourceLabel, locationLabel) {
    var knownSerials = {};
    var blocks = [];
    var today = todaySerial();
    for (var ser = startSerial; ser <= endSerial; ser++) {
      var rec = _forecastRecord(ser);
      if (!rec) continue;
      knownSerials[String(ser)] = 1;
      blocks.push(_playerDayHtml(rec, "high", ser === today, sourceLabel));
    }
    var spanDays = Math.max(1, endSerial - startSerial + 1);
    var body = '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Location: <b>' + esc(locationLabel) + "</b></div>";
    body += _weatherForecastMiniCalHtml(startSerial, spanDays, { knownSerials });
    body += _legendLine(["Emoji = afternoon outlook", "Blank cells are unrevealed days"]);
    body += blocks.join("");
    return body;
  }
  function sendSpecificWeatherReveal(m, tokens) {
    var ws = getWeatherState();
    var today = todaySerial();
    if (!ws.location) {
      warnGM("No weather location set.");
      return;
    }
    var parsed = _parseWeatherRevealDateSpec(tokens);
    if (!parsed) {
      warnGM("Usage: weather reveal <dateSpec> (examples: 14-17, 4 5-7, Rhaan 14, Hammer 5-7 1491)");
      return;
    }
    if (parsed.startSerial < today) {
      warnGM("Specific-date weather reveals can only target today or future dates.");
      return;
    }
    if (parsed.endSerial - today + 1 > CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS) {
      warnGM("Specific-date reveals are capped at " + CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS + " days ahead.");
      return;
    }
    _generateForecast(today, Math.max(1, parsed.endSerial - today + 1), false);
    var sourceLabel = WEATHER_SOURCE_LABELS.specific;
    for (var ser = parsed.startSerial; ser <= parsed.endSerial; ser++) {
      if (!_forecastRecord(ser)) continue;
      _recordReveal(ws, ser, "high", "specific", ws.location);
    }
    var title = "Divination Reveal \u2014 " + formatDateLabel(parsed.year, parsed.mi, parsed.startDay, true);
    if (parsed.endSerial > parsed.startSerial) {
      title += " to " + formatDateLabel(parsed.year, parsed.mi, parsed.endDay, true);
    }
    sendToAll(_menuBox(
      title,
      _specificWeatherRevealHtml(parsed.startSerial, parsed.endSerial, sourceLabel, _weatherLocationLabel(ws.location))
    ));
    warnGM("Sent revealed weather for " + (parsed.endSerial - parsed.startSerial + 1) + " day(s) at the current location.");
  }
  function _playerForecastViewData(maxDays) {
    var st = ensureSettings();
    var ws = getWeatherState();
    var today = todaySerial();
    var blocks = [];
    var knownSerials = {};
    var displayMode = _normalizeDisplayMode(st.weatherDisplayMode);
    var verbose = _subsystemIsVerbose();
    var capDays = Math.max(1, parseInt(maxDays, 10) || CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
    weatherEnsureForecast();
    _grantCommonWeatherReveals(ws, today);
    var bucket = _weatherRevealBucket(ws, ws.location, false);
    var maxKnown = null;
    Object.keys(bucket).forEach(function(key) {
      var ser2 = parseInt(key, 10);
      if (!isFinite(ser2) || ser2 < today) return;
      if (ser2 > today + capDays - 1) return;
      if (maxKnown == null || ser2 > maxKnown) maxKnown = ser2;
    });
    if (maxKnown == null) return null;
    var spanDays = Math.max(1, maxKnown - today + 1);
    for (var i = 0; i < spanDays; i++) {
      var ser = today + i;
      var rev = _weatherRevealForSerial(ws, ser, ws.location);
      if (!rev.tier) continue;
      var rec = _forecastRecord(ser);
      if (!rec) continue;
      var srcLabel = WEATHER_SOURCE_LABELS[rev.source] || null;
      blocks.push(_playerDayHtml(rec, rev.tier, i === 0, srcLabel));
      knownSerials[String(ser)] = 1;
    }
    if (!blocks.length) return null;
    var dateObj = fromSerial(today);
    var titleDate = esc(_displayMonthDayParts(dateObj.mi, dateObj.day).label);
    var miniCal = _weatherForecastMiniCalHtml(today, spanDays, { knownSerials });
    var tRev = _weatherRevealForSerial(ws, today, ws.location);
    var todayTier = tRev.tier || "low";
    var locationLabel = _weatherLocationLabel(ws.location);
    var body = "";
    if (displayMode !== "list") {
      body += miniCal;
      body += _legendLine(["\u{1F305} Early", "\u2600 Morning", "\u2601 Afternoon", "\u{1F306} Evening", "\u{1F319} Night", "Emoji row = afternoon outlook"]);
      body += '<div style="font-size:.78em;opacity:.6;margin:0 0 6px 0;">Only weather you currently know is marked.</div>';
    }
    if (displayMode !== "calendar") {
      body += blocks.join("");
    }
    if (!body) {
      body = '<div style="opacity:.7;">No weather display mode selected.</div>';
    }
    if (verbose) {
      body += '<div style="font-size:.75em;opacity:.5;">Use <code>!cal weather</code> for today details.</div>';
    }
    return {
      today,
      todayTier,
      titleDate,
      locationLabel,
      summaryHtml: _weatherTodaySummaryHtml(today, todayTier, displayMode === "calendar"),
      body
    };
  }
  function playerForecastWhisper(m) {
    var view = _playerForecastViewData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
    if (!view) {
      whisper(m.who, _menuBox("Weather Forecast", '<div style="opacity:.7;">No forecast has been shared with you yet.</div>'));
      return;
    }
    whisper(m.who, _menuBox(
      "Your Weather Forecast \u2014 " + view.locationLabel,
      '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Date anchor: <b>' + view.titleDate + "</b></div>" + view.summaryHtml + view.body
    ));
  }
  function sendRevealedForecast(m) {
    var view = _playerForecastViewData(CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS);
    if (!view) {
      warnGM("No revealed weather is currently available to send.");
      return;
    }
    sendToAll(_menuBox(
      "Weather Forecast \u2014 " + view.locationLabel,
      '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Date anchor: <b>' + view.titleDate + "</b></div>" + view.summaryHtml + view.body
    ));
    warnGM("Sent the currently revealed weather forecast to players.");
  }
  function weatherTodayGmHtml() {
    var st = ensureSettings();
    var ws = getWeatherState();
    var ser = todaySerial();
    var rec = _weatherRecordForDisplay(_forecastRecord(ser));
    var loc = ws.location;
    if (!loc) {
      return _menuBox(
        "Weather",
        '<div style="opacity:.7;">No location set.</div><div style="margin-top:4px;">' + button("Set Location", "weather location") + "</div>"
      );
    }
    var locLine = '<div style="font-size:.85em;opacity:.75;">' + esc(_weatherLocationLabel(loc)) + "</div>";
    var manifestEntries = _activeManifestZoneEntries();
    var manifestLine = manifestEntries.length ? '<div style="font-size:.82em;opacity:.7;margin-top:2px;">Manifest zones: <b>' + esc(_manifestZoneStatusLabel(manifestEntries)) + "</b></div>" : "";
    var arythLine = _isArythFull(ser) ? '<div style="font-size:.8em;opacity:.65;margin-top:2px;">Aryth is full. Consider a manifest zone.</div>' : "";
    var body = rec ? _weatherDayGmHtml(rec, true) : '<div style="opacity:.6;">No weather generated for today.</div>';
    var topButtons = button("\u{1F4E3} Send Revealed", "weather send") + " " + button("Forecast", "weather forecast " + _weatherViewDays(st.weatherForecastViewDays)) + " " + button("Reroll Today", "weather reroll") + " " + button("Set Location", "weather location") + " " + button("History", "weather history");
    var zoneButtons = '<div style="margin-top:4px;">' + button("Set Manifest Zone", "weather manifest") + "</div>";
    var mediumRow = '<div style="margin-top:4px;font-size:.85em;opacity:.8;">Reveal skilled forecast:</div><div>' + button("1 day", "weather reveal medium 1") + " " + button("3 days", "weather reveal medium 3") + " " + button("6 days", "weather reveal medium 6") + " " + button("10 days", "weather reveal medium 10") + "</div>";
    var highRow = '<div style="margin-top:2px;font-size:.85em;opacity:.8;">Reveal expert forecast:</div><div>' + button("1 day", "weather reveal high 1") + " " + button("3 days", "weather reveal high 3") + " " + button("6 days", "weather reveal high 6") + " " + button("10 days", "weather reveal high 10") + "</div>";
    var specificRow = '<div style="margin-top:2px;font-size:.85em;opacity:.8;">Reveal exact date(s):</div><div>' + button("Custom Range", "weather reveal ?{Date or range|14-17}") + "</div>";
    var extremeHtml = rec ? _extremeEventPanelHtml(rec) : "";
    var tidalLine = "";
    var geo = (loc.geography || "inland").toLowerCase();
    if (geo === "coastal" || geo === "island" || geo === "coastal_bluff") {
      try {
        var _tidx = getTidalIndex(todaySerial());
        tidalLine = '<div style="font-size:.82em;opacity:.75;margin-top:3px;">\u{1F30A} Tides: <b>' + esc(tidalLabel(_tidx)) + "</b> (" + _tidx + "/10)</div>";
      } catch (e) {
      }
    }
    return _menuBox(
      "Today's Weather",
      locLine + manifestLine + arythLine + body + tidalLine + extremeHtml + '<div style="margin-top:6px;">' + topButtons + "</div>" + zoneButtons + mediumRow + highRow + specificRow
    );
  }
  function _weatherEmojiForRecord(rec) {
    rec = _weatherRecordForDisplay(rec);
    if (!rec || !rec.final) return "\u{1F325}\uFE0F";
    var loc = rec.location || {};
    var cond = _deriveConditions(rec.final, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    if (!cond || !cond.precipType) return "\u{1F325}\uFE0F";
    if (cond.precipType === "blizzard") return "\u{1F328}\uFE0F";
    if (cond.precipType === "snow") return "\u2744\uFE0F";
    if (cond.precipType === "snow_light") return "\u{1F324}\uFE0F";
    if (cond.precipType === "ice_storm") return "\u{1F9CA}";
    if (cond.precipType === "sleet") return "\u{1F9CA}";
    if (cond.precipType === "sleet_light") return "\u{1F324}\uFE0F";
    if (cond.precipType === "deluge") return "\u{1F30A}";
    if (cond.precipType === "heavy_rain") return "\u26C8\uFE0F";
    if (cond.precipType === "rain") return "\u{1F327}\uFE0F";
    if (cond.precipType === "rain_light") return "\u{1F326}\uFE0F";
    if ((rec.final.wind | 0) >= 3) return "\u{1F4A8}";
    if (cond.precipType === "none" && (rec.final.precip | 0) >= 1) return "\u26C5";
    return "\u2600\uFE0F";
  }
  function _weatherMiniCellTitle(serial) {
    var rec = _weatherRecordForDisplay(_forecastRecord(serial));
    if (!rec || !rec.final) return null;
    var f = rec.final;
    var loc = rec.location || {};
    var cond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
    return _conditionsNarrative(f, cond, WEATHER_PRIMARY_PERIOD);
  }
  function _renderWeatherMonthStripWantedDays(year, mi, wantedSet, startSerial, endSerial) {
    var parts = openMonthTable(mi, year);
    var html = [parts.html];
    var wdCnt = weekLength() | 0;
    var minD = _setMin(wantedSet), maxD = _setMax(wantedSet);
    if (minD == null || maxD == null) {
      html.push('<tr><td colspan="' + wdCnt + '" style="' + STYLES.td + ';opacity:.6;">(no forecast days)</td></tr>');
      html.push(closeMonthTable());
      return html.join("");
    }
    var firstRow = weekStartSerial(year, mi, minD);
    var lastRow = weekStartSerial(year, mi, maxD);
    var today = todaySerial();
    for (var rowStart = firstRow; rowStart <= lastRow; rowStart += wdCnt) {
      var dayRow = ["<tr>"];
      var wxRow = ["<tr>"];
      for (var c = 0; c < wdCnt; c++) {
        var ser = rowStart + c;
        var d = fromSerial(ser);
        var inForecast = ser >= startSerial && ser <= endSerial;
        var inMonthWanted = d.year === year && d.mi === mi && wantedSet[d.day];
        var isToday = ser === today;
        var dayStyle = STYLES.td;
        var numStyle = "";
        if (isToday) dayStyle += STYLES.today;
        if (!inForecast) {
          dayStyle += "opacity:.35;";
          numStyle = "opacity:.55;";
        } else if (d.mi !== mi || d.year !== year) {
          dayStyle += "opacity:.55;";
          numStyle = "opacity:.65;";
        }
        var dayTitle = inMonthWanted ? _weatherMiniCellTitle(ser) : null;
        var dayAttr = dayTitle ? ' title="' + esc(dayTitle) + '" aria-label="' + esc(dayTitle) + '"' : "";
        dayRow.push("<td" + dayAttr + ' style="' + dayStyle + '"><div' + (numStyle ? ' style="' + numStyle + '"' : "") + ">" + d.day + "</div></td>");
        var wxStyle = STYLES.td + "font-size:1.05em;line-height:1;";
        var wxText = "&nbsp;";
        var wxAttr = "";
        if (inMonthWanted) {
          var rec = _forecastRecord(ser);
          wxText = _weatherEmojiForRecord(rec);
          var wxTitle = _weatherMiniCellTitle(ser);
          if (wxTitle) wxAttr = ' title="' + esc(wxTitle) + '" aria-label="' + esc(wxTitle) + '"';
        } else {
          wxStyle += "opacity:.25;";
        }
        wxRow.push("<td" + wxAttr + ' style="' + wxStyle + '">' + wxText + "</td>");
      }
      dayRow.push("</tr>");
      wxRow.push("</tr>");
      html.push(dayRow.join(""));
      html.push(wxRow.join(""));
      html.push('<tr><td colspan="' + wdCnt + '" style="height:2px;padding:0;border:none;"></td></tr>');
    }
    html.push(closeMonthTable());
    return html.join("");
  }
  function _weatherForecastMiniCalHtml(startSerial, days, opts) {
    opts = opts || {};
    var knownSerials = opts.knownSerials || null;
    var start = startSerial | 0;
    var span = Math.max(1, days | 0);
    var end = start + span - 1;
    var spec = { start, end, title: "Weather Outlook" };
    var months = _monthsFromRangeSpec(spec);
    var out = ['<div style="text-align:left;">'];
    for (var i = 0; i < months.length; i++) {
      var m = months[i];
      var monthObj = getCal().months[m.mi] || {};
      var mdays = Math.max(1, monthObj.days | 0);
      var monthStart = toSerial(m.y, m.mi, 1);
      var monthEnd = toSerial(m.y, m.mi, mdays);
      var segStart = Math.max(start, monthStart);
      var segEnd = Math.min(end, monthEnd);
      if (segEnd < segStart) continue;
      var wanted = {};
      for (var ser = segStart; ser <= segEnd; ser++) {
        if (knownSerials && !knownSerials[String(ser)]) continue;
        var d = fromSerial(ser);
        if (d.year === m.y && d.mi === m.mi) wanted[d.day] = 1;
      }
      if (!_setCount(wanted)) continue;
      out.push('<div style="' + STYLES.wrap + '">' + _renderWeatherMonthStripWantedDays(m.y, m.mi, wanted, start, end) + "</div>");
    }
    out.push("</div>");
    return out.join("");
  }
  function _weatherTodaySummaryHtml(serial, detailTier, includeInfluence) {
    var rec = _weatherRecordForDisplay(_forecastRecord(serial));
    if (!rec || !rec.final) return "";
    if (detailTier === "low") {
      return '<div style="font-size:.82em;opacity:.72;margin:3px 0 6px 0;"><b>Today:</b></div>' + _weatherLowTodayHtml(rec, rec.location || {}) + (includeInfluence ? _weatherInfluenceHtml(rec) : "");
    }
    var txt = _conditionsNarrative(
      rec.final,
      _deriveConditions(rec.final, rec.location || {}, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec)),
      WEATHER_PRIMARY_PERIOD
    );
    return '<div style="font-size:.82em;opacity:.72;margin:3px 0 6px 0;"><b>Today:</b> ' + esc(txt) + "</div>" + (includeInfluence ? _weatherInfluenceHtml(rec) : "");
  }
  function weatherForecastGmHtml(daysOverride) {
    var st = ensureSettings();
    var today = todaySerial();
    var cal = getCal();
    var rows = [];
    var forecastDays = _weatherViewDays(daysOverride != null ? daysOverride : st.weatherForecastViewDays);
    st.weatherForecastViewDays = forecastDays;
    var weatherMiniCal = _weatherForecastMiniCalHtml(today, forecastDays);
    var displayMode = _normalizeDisplayMode(st.weatherDisplayMode);
    for (var i = 0; i < forecastDays; i++) {
      var ser = today + i;
      var rec = _weatherRecordForDisplay(_forecastRecord(ser));
      var d = fromSerial(ser);
      var dayLabel = esc(_displayMonthDayParts(d.mi, d.day).label);
      if (!rec) {
        rows.push('<tr><td style="' + STYLES.td + '">' + dayLabel + '</td><td style="' + STYLES.td + ';opacity:.5;" colspan="2">Not generated</td></tr>');
        continue;
      }
      var f = rec.final;
      var loc = rec.location || {};
      var cond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
      var badges = _weatherTraitBadge("temp", f.temp) + "&nbsp;" + _weatherTraitBadge("wind", f.wind) + "&nbsp;" + _weatherTraitBadge("precip", f.precip);
      var narr = _conditionsNarrative(f, cond, WEATHER_PRIMARY_PERIOD);
      var influenceText = _weatherInfluenceTexts(rec);
      var influenceHtml = influenceText.length ? '<div style="font-size:.74em;opacity:.55;margin-top:2px;">' + esc(influenceText.join(" \xB7 ")) + "</div>" : "";
      var staleFlag = rec.stale ? " \u26A0" : "";
      var extremeFlag = _evaluateExtremeEvents(rec).length > 0 ? ' <span style="color:#B71C1C;font-weight:bold;" title="Extreme event conditions present">\u26A1</span>' : "";
      if (i === 0) {
        rows.push('<tr style="font-weight:bold;"><td style="' + STYLES.td + '">' + dayLabel + ' (today)</td><td style="' + STYLES.td + '">' + badges + extremeFlag + '</td><td style="' + STYLES.td + ';font-size:.82em;">' + esc(narr) + staleFlag + influenceHtml + "</td></tr>");
      } else {
        rows.push('<tr><td style="' + STYLES.td + '">' + dayLabel + '</td><td style="' + STYLES.td + '">' + badges + extremeFlag + '</td><td style="' + STYLES.td + ';font-size:.82em;opacity:.7;">' + esc(narr) + staleFlag + influenceHtml + "</td></tr>");
      }
    }
    var head = '<tr><th style="' + STYLES.th + '">Date</th><th style="' + STYLES.th + '">Conditions</th><th style="' + STYLES.th + '">Outlook</th></tr>';
    var topControls = '<div style="margin:3px 0 6px 0;">' + button("10d", "weather forecast 10") + " " + button("20d", "weather forecast 20") + " " + button("View: " + _displayModeLabel(displayMode), "settings mode weather " + _nextDisplayMode(displayMode)) + "</div>";
    var body = "";
    if (displayMode !== "list") {
      body += weatherMiniCal;
      body += _legendLine(["Emoji = afternoon outlook", "Hover for details"]);
    }
    if (displayMode !== "calendar") {
      body += '<table style="' + STYLES.table + '">' + head + rows.join("") + "</table>";
    }
    if (!body) {
      body = '<div style="opacity:.7;">No weather display mode selected.</div>';
    }
    return _menuBox(
      forecastDays + "-Day Forecast",
      topControls + _weatherTodaySummaryHtml(today, null, displayMode === "calendar") + body + '<div style="margin-top:6px;">' + (st.weatherMechanicsEnabled !== false ? button("\u{1F4CB} Today's Mechanics", "weather mechanics") + " " : "") + button("Reroll Today", "weather reroll " + today) + " " + button("Regenerate All", "weather generate") + " " + button("\u2B05 Back", "weather") + "</div>"
    );
  }
  function weatherHistoryGmHtml() {
    var ws = getWeatherState();
    var cal = getCal();
    if (!ws.history || !ws.history.length) {
      return _menuBox("Weather History", '<div style="opacity:.7;">No history yet.</div><div style="margin-top:4px;">' + button("\u2B05 Back", "weather") + "</div>");
    }
    var rows = ws.history.slice().reverse().slice(0, 20).map(function(rec) {
      var d = fromSerial(rec.serial);
      var label = esc(_displayMonthDayParts(d.mi, d.day).label);
      var f = rec.final;
      var loc = rec.location || {};
      var badges = _weatherTraitBadge("temp", f.temp) + "&nbsp;" + _weatherTraitBadge("wind", f.wind) + "&nbsp;" + _weatherTraitBadge("precip", f.precip);
      var hCond = _deriveConditions(f, loc, WEATHER_PRIMARY_PERIOD, rec.snowAccumulated, _weatherPrimaryFog(rec));
      var hNarr = esc(_conditionsNarrative(f, hCond, WEATHER_PRIMARY_PERIOD));
      return '<tr><td style="' + STYLES.td + '">' + label + '</td><td style="' + STYLES.td + '">' + badges + '</td><td style="' + STYLES.td + ';font-size:.85em;opacity:.85;">' + hNarr + "</td></tr>";
    });
    var head = '<tr><th style="' + STYLES.th + '">Date</th><th style="' + STYLES.th + '">Conditions</th><th style="' + STYLES.th + '">Summary</th></tr>';
    return _menuBox(
      "Weather History (last 20)",
      '<table style="' + STYLES.table + '">' + head + rows.join("") + '</table><div style="margin-top:6px;">' + button("\u2B05 Back", "weather") + "</div>"
    );
  }
  function _getWeatherWizard() {
    var ws = getWeatherState();
    if (!ws._wizard) ws._wizard = {};
    return ws._wizard;
  }
  function weatherLocationWizardHtml(step, partial) {
    partial = partial || {};
    if (!step || step === "start") {
      var wsRecent = getWeatherState();
      var recentHtml = "";
      if (wsRecent.recentLocations && wsRecent.recentLocations.length) {
        recentHtml = '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Recent locations:</div>' + wsRecent.recentLocations.map(function(loc, idx) {
          return '<div style="margin:3px 0;">' + button(loc.name || _weatherLocationLabel(loc), "weather location recent " + (idx + 1)) + ' <span style="opacity:.7;font-size:.85em;">Quick switch</span></div>';
        }).join("") + '<div style="border-top:1px solid rgba(0,0,0,.1);margin:8px 0 6px 0;"></div>';
      }
      var climateButtons = Object.keys(WEATHER_CLIMATES).map(function(k) {
        return '<div style="margin:3px 0;">' + button(titleCase(k), "weather location climate " + k) + ' <span style="opacity:.7;font-size:.85em;">' + esc(WEATHER_CLIMATES[k]) + "</span></div>";
      }).join("");
      var st2 = ensureSettings();
      var sv2 = st2.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
      var hem2 = st2.hemisphere || CONFIG_DEFAULTS.hemisphere;
      var _hemAware = SEASON_SETS[sv2] && SEASON_SETS[sv2].hemisphereAware;
      var hemHint = _hemAware ? hem2 === "north" ? '<div style="font-size:.8em;opacity:.45;margin-top:8px;font-style:italic;">Southern hemisphere campaign? \u203A !cal hemisphere south</div>' : '<div style="font-size:.8em;opacity:.45;margin-top:8px;font-style:italic;">Northern hemisphere campaign? \u203A !cal hemisphere north</div>' : "";
      return _menuBox("Set Location \u2014 Step 1: Climate", recentHtml + climateButtons + hemHint);
    }
    if (step === "geography") {
      var geoButtons = Object.keys(WEATHER_GEOGRAPHIES).map(function(k) {
        var label = titleCase(k.replace(/_/g, " "));
        return '<div style="margin:3px 0;">' + button(label, "weather location geography " + k) + ' <span style="opacity:.7;font-size:.85em;">' + esc(WEATHER_GEOGRAPHIES[k]) + "</span></div>";
      }).join("");
      return _menuBox(
        "Set Location \u2014 Step 2: Geography (Climate: " + esc(titleCase(partial.climate || "?")) + ")",
        geoButtons
      );
    }
    if (step === "terrain") {
      var terrainButtons = Object.keys(WEATHER_TERRAINS_UI).map(function(k) {
        var label = titleCase(k.replace(/_/g, " "));
        return '<div style="margin:3px 0;">' + button(label, "weather location terrain " + k) + ' <span style="opacity:.7;font-size:.85em;">' + esc(WEATHER_TERRAINS_UI[k]) + "</span></div>";
      }).join("");
      var ctx = esc(titleCase(partial.climate || "?")) + " / " + esc(titleCase((partial.geography || "inland").replace(/_/g, " ")));
      return _menuBox(
        "Set Location \u2014 Step 3: Terrain (" + ctx + ")",
        '<div style="opacity:.8;margin-bottom:6px;">Selecting a terrain finalizes the location. Manifest zones are managed separately.</div>' + terrainButtons
      );
    }
    if (step === "zone") {
      return _menuBox(
        "Manifest Zones",
        '<div style="opacity:.8;margin-bottom:6px;">Manifest zones are now independent of the location wizard.</div><div>' + button("Open Manifest Zones", "weather manifest") + "</div>"
      );
    }
    return "";
  }
  function _clearManifestZones() {
    var ws = getWeatherState();
    var removed = _activeManifestZoneEntries();
    ws.manifestZones = {};
    return removed;
  }
  function _setWeatherLocationFromWizard(m, partial) {
    var newLoc = _normalizeWeatherLocation({
      climate: partial.climate || "temperate",
      geography: partial.geography || "inland",
      terrain: partial.terrain || "open"
    });
    var ws = getWeatherState();
    var oldLoc = ws.location || null;
    var oldSig = oldLoc ? _locSig(oldLoc) : "";
    var locationChanged = !!oldLoc && oldSig !== newLoc.sig;
    var clearedZones = locationChanged ? _clearManifestZones() : [];
    var hadLocation = !!oldLoc;
    ws.location = newLoc;
    _rememberRecentWeatherLocation(ws, newLoc);
    delete ws._wizard;
    var today = todaySerial();
    var resurrected = 0, staled = 0;
    ws.forecast.forEach(function(rec) {
      if (rec.locked || rec.serial < today) return;
      var recSig = rec.location ? _locSig(rec.location) : "";
      if (recSig === newLoc.sig) {
        rec.stale = false;
        resurrected++;
      } else {
        rec.stale = true;
        staled++;
      }
    });
    var msg = "Location set: <b>" + esc(newLoc.name || _weatherLocationLabel(newLoc)) + "</b>.";
    if (clearedZones.length) {
      msg += '<br><span style="color:#E65100;">Cleared manifest zones: ' + esc(clearedZones.map(function(entry) {
        return entry.def.name;
      }).join(", ")) + ".</span>";
    }
    if (hadLocation) {
      if (resurrected > 0 && staled === 0) {
        msg += '<br><span style="color:#2E7D32;">Forecast restored from matching records.</span>';
      } else if (resurrected > 0) {
        msg += '<br><span style="color:#1565C0;">' + resurrected + " day(s) restored; " + staled + " stale.</span>";
      } else {
        msg += '<br><span style="color:#E65100;">Future forecast marked stale. Regenerate to update.</span>';
      }
    }
    whisper(
      m.who,
      _menuBox("Location Set", msg) + '<div style="margin-top:4px;">' + button("Regenerate Forecast", "weather generate") + " " + button("View Forecast", "weather forecast") + "</div>"
    );
  }
  function manifestZoneChooserHtml() {
    var ws = getWeatherState();
    var loc = ws.location;
    if (!loc) {
      return _menuBox(
        "Manifest Zones",
        '<div style="opacity:.7;">Set a weather location first. Manifest zones are local overlays and clear when the location changes.</div><div style="margin-top:6px;">' + button("Set Location", "weather location") + "</div>"
      );
    }
    var entries = _activeManifestZoneEntries();
    var active = {};
    for (var i = 0; i < entries.length; i++) active[entries[i].key] = 1;
    var noneActive = !entries.length;
    var rows = [];
    function nameCell(label, detail, isActive2) {
      var nameStyle = isActive2 ? "font-weight:bold;" : "opacity:.6;font-style:italic;";
      return '<div style="' + nameStyle + '">' + esc(label) + "</div>" + (detail ? '<div style="font-size:.78em;opacity:.65;margin-top:2px;">' + esc(detail) + "</div>" : "");
    }
    rows.push('<tr><td style="' + STYLES.td + '">' + nameCell("None", "Clear all active manifest zones", noneActive) + '</td><td style="' + STYLES.td + ';text-align:center;">' + button(noneActive ? "On" : "Off", "weather manifest none") + "</td></tr>");
    for (var mi = 0; mi < MANIFEST_ZONE_ORDER.length; mi++) {
      var key = MANIFEST_ZONE_ORDER[mi];
      var def = MANIFEST_ZONE_DEFS[key];
      var isActive = !!active[key];
      rows.push('<tr><td style="' + STYLES.td + '">' + nameCell((def.emoji || "\u25C7") + " " + def.name, def.summary + " \xB7 " + (def.effectLabel || "no weather shift"), isActive) + '</td><td style="' + STYLES.td + ';text-align:center;">' + button(isActive ? "On" : "Off", "weather manifest toggle " + key) + "</td></tr>");
    }
    var head = '<tr><th style="' + STYLES.th + '">Zone</th><th style="' + STYLES.th + '">Toggle</th></tr>';
    var locLine = '<div style="font-size:.82em;opacity:.75;margin-bottom:4px;">Current location: <b>' + esc(titleCase(loc.climate)) + " / " + esc(titleCase(loc.geography.replace(/_/g, " "))) + " / " + esc(titleCase(loc.terrain)) + "</b></div>";
    var activeLine = '<div style="font-size:.82em;opacity:.7;margin-bottom:6px;">Active: <b>' + esc(_manifestZoneStatusLabel(entries)) + "</b></div>";
    var arythLine = _isArythFull(todaySerial()) ? '<div style="font-size:.8em;opacity:.7;margin-bottom:6px;">Aryth is full. Consider a manifest zone.</div>' : "";
    return _menuBox(
      "Manifest Zones",
      locLine + activeLine + arythLine + `<div style="font-size:.8em;opacity:.6;margin-bottom:6px;">Manifest zones affect today's weather only; forecast rows stay tied to the base location profile.</div><table style="` + STYLES.table + '">' + head + rows.join("") + '</table><div style="margin-top:6px;">' + button("\u2B05 Back", "weather") + "</div>"
    );
  }
  function _toggleManifestZoneForGm(m, zoneKey) {
    var ws = getWeatherState();
    if (!ws.location) {
      whisper(m.who, "Set a weather location first: " + button("Set Location", "weather location"));
      return;
    }
    if (zoneKey === "none" || zoneKey === "clear") {
      var removed = _clearManifestZones();
      if (!removed.length) {
        whisper(m.who, "No manifest zones are active.");
        return;
      }
      whisper(m.who, "Cleared manifest zones: <b>" + esc(removed.map(function(entry) {
        return entry.def.name;
      }).join(", ")) + "</b>.");
      return;
    }
    var key = _manifestZoneKey(zoneKey);
    var def = key ? MANIFEST_ZONE_DEFS[key] : null;
    if (!def) {
      whisper(m.who, "Unknown manifest zone.");
      return;
    }
    if (ws.manifestZones[key]) {
      delete ws.manifestZones[key];
      whisper(
        m.who,
        "Manifest zone deactivated: <b>" + esc(def.name) + "</b>. Active: <b>" + esc(_manifestZoneStatusLabel()) + "</b>."
      );
      return;
    }
    var arythFull = _isArythFull(todaySerial());
    ws.manifestZones[key] = {
      key,
      setOn: todaySerial(),
      arythFullActivated: arythFull,
      arythFullExitWarned: false
    };
    whisper(
      m.who,
      "Manifest zone activated: <b>" + esc(def.name) + "</b>. Active: <b>" + esc(_manifestZoneStatusLabel()) + "</b>." + (arythFull ? ' <span style="opacity:.75;">Tracked for Aryth full.</span>' : "")
    );
  }
  function handleWeatherCommand(m, args) {
    var sub = String(args[1] || "").toLowerCase();
    if (ensureSettings().weatherEnabled === false && !playerIsGM(m.playerid)) {
      whisper(cleanWho(m.who), _menuBox("Weather", '<div style="opacity:.7;">Weather system is not active.</div>'));
      return;
    }
    if (!playerIsGM(m.playerid)) {
      if (sub === "forecast") {
        playerForecastWhisper(m);
      } else {
        var ws0 = getWeatherState();
        var tSer = todaySerial();
        weatherEnsureForecast();
        _grantCommonWeatherReveals(ws0, tSer);
        var rec0 = _forecastRecord(tSer);
        var rev0 = _weatherRevealForSerial(ws0, tSer, ws0.location);
        var tier0 = rev0.tier || "low";
        var src0 = WEATHER_SOURCE_LABELS[rev0.source] || null;
        if (!rec0) {
          whisper(m.who, _menuBox("Today's Weather", '<div style="opacity:.7;">Conditions not available.</div>'));
        } else {
          whisper(m.who, _menuBox(
            "Today's Weather",
            _playerDayHtml(rec0, tier0, true, src0) + '<div style="margin-top:4px;">' + button("Full Forecast", "weather forecast") + "</div>"
          ));
        }
      }
      return;
    }
    switch (sub) {
      case "":
      case "today":
        weatherEnsureForecast();
        whisper(m.who, weatherTodayGmHtml());
        break;
      case "forecast":
        var viewTok = String(args[2] || "").trim();
        if (viewTok) {
          var viewDays = parseInt(viewTok, 10);
          if (!/^\d+$/.test(viewTok) || viewDays < 1 || viewDays > CONFIG_WEATHER_FORECAST_DAYS) {
            warnGM("Usage: weather forecast [1-" + CONFIG_WEATHER_FORECAST_DAYS + "]");
            break;
          }
          ensureSettings().weatherForecastViewDays = _weatherViewDays(viewDays);
        }
        weatherEnsureForecast();
        whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
        break;
      case "history":
        whisper(m.who, weatherHistoryGmHtml());
        break;
      case "manifest": {
        var manifestSub = String(args[2] || "").toLowerCase();
        if (!manifestSub) {
          whisper(m.who, manifestZoneChooserHtml());
          break;
        }
        if (manifestSub === "toggle") {
          _toggleManifestZoneForGm(m, String(args[3] || ""));
          break;
        }
        _toggleManifestZoneForGm(m, manifestSub);
        break;
      }
      case "mechanics":
        weatherEnsureForecast();
        whisper(m.who, weatherTodayMechanicsHtml());
        break;
      case "send": {
        if (!args[2]) {
          sendRevealedForecast(m);
          whisper(m.who, weatherTodayGmHtml());
          break;
        }
        warnGM("Usage: weather send");
        whisper(m.who, weatherTodayGmHtml());
        break;
      }
      case "reveal": {
        var revealMethod = String(args[2] || "").toLowerCase();
        if (revealMethod === "medium" || revealMethod === "high") {
          var revealDays = parseInt(args[3], 10) || 1;
          if (revealDays < 1 || revealDays > 10) {
            warnGM("Usage: weather reveal medium|high [1-10]");
            break;
          }
          sendPlayerForecast(m, revealMethod, revealDays);
        } else {
          sendSpecificWeatherReveal(m, args.slice(2));
        }
        whisper(m.who, weatherTodayGmHtml());
        break;
      }
      case "event": {
        var evtSub = String(args[2] || "").toLowerCase();
        var evtKey = String(args[3] || "").toLowerCase();
        var evtRec = _forecastRecord(todaySerial());
        if (!evtRec || !evtRec.final) {
          warnGM("No weather record for today. Generate weather first.");
          break;
        }
        if (!EXTREME_EVENTS[evtKey]) {
          warnGM("Unknown event key: " + evtKey);
          break;
        }
        if (evtSub === "trigger") {
          var trigHtml = _extremeEventDetailsHtml(evtKey, evtRec);
          whisper(m.who, _menuBox(
            "Extreme Event",
            "<div><b>\u26A1 " + esc(EXTREME_EVENTS[evtKey].name) + '</b> triggered for GM reference.</div><div style="opacity:.8;margin-top:3px;">No message was sent to players.</div><div style="margin-top:5px;">' + trigHtml + '</div><div style="margin-top:5px;">' + button("Back to Weather", "weather") + " " + button("Forecast", "weather forecast") + "</div>"
          ));
        } else if (evtSub === "roll") {
          var fired = _rollExtremeEvent(evtKey, evtRec);
          if (fired) {
            var fireHtml = _extremeEventDetailsHtml(evtKey, evtRec);
            whisper(m.who, _menuBox(
              "Extreme Event Roll",
              "<div><b>\u{1F3B2} Result:</b> " + esc(EXTREME_EVENTS[evtKey].name) + ' fires (GM advisory only).</div><div style="opacity:.8;margin-top:3px;">No message was sent to players.</div><div style="margin-top:5px;">' + fireHtml + '</div><div style="margin-top:5px;">' + button("Back to Weather", "weather") + " " + button("Forecast", "weather forecast") + "</div>"
            ));
          } else {
            whisper(m.who, _menuBox(
              "Extreme Event Roll",
              '<div><b>\u{1F3B2} Result:</b> conditions were not quite right. No event this time.</div><div style="margin-top:5px;">' + button("Back to Weather", "weather") + " " + button("Forecast", "weather forecast") + "</div>"
            ));
          }
        } else {
          warnGM("Usage: weather event trigger <key>  or  weather event roll <key>");
        }
        break;
      }
      case "generate":
        var n = CONFIG_WEATHER_FORECAST_DAYS;
        if (args[2]) {
          var nTok = String(args[2] || "").trim();
          var parsedDays = parseInt(nTok, 10);
          if (!/^\d+$/.test(nTok) || parsedDays < 1 || parsedDays > CONFIG_WEATHER_FORECAST_DAYS) {
            warnGM("Usage: weather generate [1-" + CONFIG_WEATHER_FORECAST_DAYS + "]");
            break;
          }
          n = parsedDays;
        }
        var cnt = _generateForecast(todaySerial(), n, true);
        whisper(m.who, "Generated " + cnt + " day" + (cnt === 1 ? "" : "s") + " of weather.");
        whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
        break;
      case "reroll": {
        var ws2 = getWeatherState();
        var todayNow = todaySerial();
        var targetSer = parseInt(args[2], 10);
        if (!isFinite(targetSer)) targetSer = todayNow;
        if (targetSer < todayNow) {
          warnGM("That day is already in the past. Cannot reroll archived weather.");
          break;
        }
        var existing = _forecastRecord(targetSer);
        if (existing && existing.locked) {
          warnGM("That day is locked (it's in the past). Cannot reroll.");
          break;
        }
        var prevRec = _forecastRecord(targetSer - 1) || _historyRecord(targetSer - 1);
        var newRec = _generateDayWeather(targetSer, prevRec, ws2.location || null);
        if (newRec) {
          var idx2 = _forecastIndex(targetSer);
          if (idx2 >= 0) ws2.forecast[idx2] = newRec;
          else ws2.forecast.push(newRec);
          ws2.forecast.sort(function(a, b) {
            return a.serial - b.serial;
          });
          var nextRec2 = _forecastRecord(targetSer + 1);
          if (nextRec2 && !nextRec2.locked) {
            var regenNext = _generateDayWeather(targetSer + 1, newRec, ws2.location || null);
            if (regenNext) {
              var nextIdx2 = _forecastIndex(targetSer + 1);
              if (nextIdx2 >= 0) ws2.forecast[nextIdx2] = regenNext;
            }
          }
        }
        whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
        break;
      }
      case "lock": {
        var lockSer = parseInt(args[2], 10);
        if (!isFinite(lockSer)) lockSer = todaySerial();
        var lockRec = _forecastRecord(lockSer);
        if (!lockRec) {
          warnGM("No weather record for that day.");
          break;
        }
        lockRec.generatedAt = todaySerial();
        warnGM("Forecast for day " + lockSer + " locked (Magical reveal \u2014 full detail).");
        whisper(m.who, weatherForecastGmHtml(ensureSettings().weatherForecastViewDays));
        break;
      }
      case "location": {
        var locSub = String(args[2] || "").toLowerCase();
        if (!locSub) {
          getWeatherState()._wizard = {};
          whisper(m.who, weatherLocationWizardHtml("start"));
          break;
        }
        if (locSub === "climate") {
          var climate = String(args[3] || "").toLowerCase();
          if (!WEATHER_CLIMATE_BASE[climate]) {
            whisper(m.who, "Unknown climate. " + button("Back", "weather location"));
            break;
          }
          var _svNow = ensureSettings().seasonVariant || CONFIG_DEFAULTS.seasonVariant;
          if (climate === "tropical" && _svNow !== "tropical") {
            whisper(
              m.who,
              '<div style="font-size:.85em;opacity:.6;font-style:italic;margin-bottom:4px;">Tropical climate \u2014 consider: ' + button("Tropical seasons", "seasons tropical") + "</div>"
            );
          }
          getWeatherState()._wizard = { climate };
          whisper(m.who, weatherLocationWizardHtml("geography", { climate }));
          break;
        }
        if (locSub === "geography") {
          var geography = String(args[3] || "").toLowerCase();
          if (!WEATHER_GEO_MOD[geography]) {
            whisper(m.who, "Unknown geography. " + button("Back", "weather location"));
            break;
          }
          var wiz = _getWeatherWizard();
          wiz.geography = geography;
          whisper(m.who, weatherLocationWizardHtml("terrain", wiz));
          break;
        }
        if (locSub === "terrain") {
          var terrain = String(args[3] || "").toLowerCase();
          if (!WEATHER_TERRAIN_MOD[terrain]) {
            whisper(m.who, "Unknown terrain. " + button("Back", "weather location"));
            break;
          }
          var wiz2 = _getWeatherWizard();
          wiz2.terrain = terrain;
          _setWeatherLocationFromWizard(m, wiz2);
          break;
        }
        if (locSub === "recent") {
          var recentIdx = Math.max(1, parseInt(args[3], 10) || 1) - 1;
          var recentList = getWeatherState().recentLocations || [];
          if (!recentList[recentIdx]) {
            whisper(m.who, "That recent location is no longer available. " + button("Back", "weather location"));
            break;
          }
          _setWeatherLocationFromWizard(m, recentList[recentIdx]);
          break;
        }
        if (locSub === "zone") {
          var zoneArg = String(args[3] || "").toLowerCase();
          if (!zoneArg) {
            whisper(m.who, manifestZoneChooserHtml());
          } else {
            _toggleManifestZoneForGm(m, zoneArg);
          }
          break;
        }
        whisper(m.who, "Usage: <code>!cal weather location</code> (opens wizard)");
        break;
      }
      default:
        whisper(m.who, weatherTodayGmHtml());
        break;
    }
  }

  // src/today.ts
  function _todayWeatherIsStable(wxRec) {
    if (!wxRec || !wxRec.periods) return true;
    var periods = WEATHER_DAY_PERIODS;
    var base = wxRec.periods[WEATHER_PRIMARY_PERIOD] || wxRec.final;
    if (!base) return true;
    for (var i = 0; i < periods.length; i++) {
      var pv = wxRec.periods[periods[i]];
      if (!pv) continue;
      if (Math.abs((pv.temp || 0) - (base.temp || 0)) >= 2) return false;
      if (Math.abs((pv.wind || 0) - (base.wind || 0)) >= 2) return false;
      if (Math.abs((pv.precip || 0) - (base.precip || 0)) >= 2) return false;
    }
    return true;
  }
  function _todayAllHtml() {
    var st = ensureSettings();
    var today = todaySerial();
    var cal = getCal(), c = cal.current;
    var verbose = _subsystemIsVerbose();
    var sections = [];
    sections.push('<div style="font-weight:bold;margin-bottom:4px;">' + esc(currentDateLabel()) + "</div>");
    try {
      var occ = occurrencesInRange(today, today);
      if (occ.length) {
        var names = [];
        var seen = {};
        for (var oi = 0; oi < occ.length; oi++) {
          var nm = eventDisplayName(occ[oi].e);
          if (!seen[nm.toLowerCase()]) {
            seen[nm.toLowerCase()] = 1;
            names.push(nm);
          }
        }
        sections.push('<div style="margin:3px 0;">\u{1F389} <b>Events:</b> ' + names.map(esc).join(", ") + "</div>");
      }
    } catch (e) {
    }
    if (st.weatherEnabled !== false) {
      try {
        weatherEnsureForecast();
        var wxRec = _weatherRecordForDisplay(_forecastRecord(today));
        if (wxRec && wxRec.final) {
          var wxHtml = '<div style="margin:4px 0;"><b>\u2601 Weather:</b> ' + button("Detail", "weather") + "</div>";
          wxHtml += _weatherInfluenceHtml(wxRec);
          if (verbose) {
            var periods = WEATHER_DAY_PERIODS;
            for (var pi = 0; pi < periods.length; pi++) {
              var pname = periods[pi];
              var fogP = wxRec.fog && wxRec.fog[pname];
              var periodVals = wxRec.periods && wxRec.periods[pname] || wxRec.final;
              var cond = _deriveConditions(
                periodVals,
                wxRec.location || {},
                pname,
                wxRec.snowAccumulated,
                fogP
              );
              var narr = _conditionsNarrative(periodVals, cond, pname);
              var mech = _conditionsMechHtml(cond);
              wxHtml += '<div style="font-size:.88em;margin:1px 0 1px 8px;">' + _weatherPeriodIcon(pname) + " <b>" + esc(_weatherPeriodLabel(pname)) + ":</b> " + esc(narr) + (mech ? '<div style="margin-left:12px;">' + mech + "</div>" : "") + "</div>";
            }
          } else {
            if (_todayWeatherIsStable(wxRec)) {
              var stableVals = _weatherPrimaryValues(wxRec) || wxRec.final;
              var stableFog = _weatherPrimaryFog(wxRec);
              var stableCond = _deriveConditions(
                stableVals,
                wxRec.location || {},
                WEATHER_PRIMARY_PERIOD,
                wxRec.snowAccumulated,
                stableFog
              );
              var stableNarr = _conditionsNarrative(stableVals, stableCond, WEATHER_PRIMARY_PERIOD);
              wxHtml += '<div style="font-size:.88em;margin:1px 0 1px 8px;">' + esc(stableNarr) + ' <span style="opacity:.5;">all day</span></div>';
            } else {
              var mPeriods = WEATHER_DAY_PERIODS;
              var mBase = wxRec.periods && wxRec.periods[WEATHER_PRIMARY_PERIOD] || wxRec.final;
              for (var mpi = 0; mpi < mPeriods.length; mpi++) {
                var mpname = mPeriods[mpi];
                var mpv = wxRec.periods && wxRec.periods[mpname] || wxRec.final;
                var differs = Math.abs((mpv.temp || 0) - (mBase.temp || 0)) >= 2 || Math.abs((mpv.wind || 0) - (mBase.wind || 0)) >= 2 || Math.abs((mpv.precip || 0) - (mBase.precip || 0)) >= 2;
                if (mpname === WEATHER_PRIMARY_PERIOD || differs) {
                  var mfog = wxRec.fog && wxRec.fog[mpname];
                  var mcond = _deriveConditions(
                    mpv,
                    wxRec.location || {},
                    mpname,
                    wxRec.snowAccumulated,
                    mfog
                  );
                  var mnarr = _conditionsNarrative(mpv, mcond, mpname);
                  wxHtml += '<div style="font-size:.88em;margin:1px 0 1px 8px;">' + _weatherPeriodIcon(mpname) + " <b>" + esc(_weatherPeriodLabel(mpname)) + ":</b> " + esc(mnarr) + "</div>";
                }
              }
            }
          }
          var extremes = _evaluateExtremeEvents(wxRec);
          if (extremes.length) {
            wxHtml += '<div style="margin:3px 0 0 8px;font-size:.88em;color:#B71C1C;">';
            for (var ei = 0; ei < extremes.length; ei++) {
              wxHtml += "\u26A1 <b>" + esc(extremes[ei].event.name) + "</b>";
              if (extremes[ei].event.mechanics) wxHtml += " \u2014 " + esc(extremes[ei].event.mechanics);
              wxHtml += "<br>";
            }
            wxHtml += "</div>";
          }
          sections.push(wxHtml);
        }
      } catch (e) {
      }
    }
    if (st.moonsEnabled !== false) {
      try {
        moonEnsureSequences();
        var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
        if (sys && sys.moons) {
          var moonHtml = '<div style="margin:4px 0;"><b>\u{1F319} Moons:</b> ' + button("Detail", "moon") + "</div>";
          var moonLines = [];
          var suppressedCount = 0;
          for (var mi = 0; mi < sys.moons.length; mi++) {
            var moon = sys.moons[mi];
            var ph = moonPhaseAt(moon.name, today);
            if (!ph) continue;
            var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
            var pLabel = _moonPhaseLabel(ph.illum, ph.waxing);
            var pct = Math.round(ph.illum * 100);
            var extra = "";
            var isNotable = false;
            if (ph.illum >= 0.97) {
              extra = ' <b style="color:#FFD700;">FULL</b>';
              isNotable = true;
            } else if (ph.illum <= 0.03) {
              extra = " <b>" + (ph.longShadows ? "NEW (Long Shadows)" : "NEW") + "</b>";
              isNotable = true;
            }
            if (!isNotable && !verbose) {
              var phPrev = moonPhaseAt(moon.name, today - 1);
              var phNext = moonPhaseAt(moon.name, today + 1);
              if (phPrev && (phPrev.illum >= 0.97 || phPrev.illum <= 0.03) || phNext && (phNext.illum >= 0.97 || phNext.illum <= 0.03)) {
                isNotable = true;
              }
            }
            if (!verbose && !isNotable) {
              suppressedCount++;
              continue;
            }
            moonLines.push(emoji + " " + esc(moon.name) + ' <span style="opacity:.5;">(' + pct + "% " + esc(pLabel) + ")</span>" + extra);
          }
          if (moonLines.length) {
            moonHtml += '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' + moonLines.join("<br>") + "</div>";
          }
          if (!verbose && suppressedCount > 0) {
            if (moonLines.length === 0) {
              moonHtml += '<div style="font-size:.85em;margin-left:8px;opacity:.5;">No notable lunar activity. (' + suppressedCount + " moons unremarkable)</div>";
            } else {
              moonHtml += '<div style="font-size:.82em;margin-left:8px;opacity:.5;">(+' + suppressedCount + " moons unremarkable)</div>";
            }
          }
          try {
            var eclNotes = _eclipseNotableToday(today);
            if (eclNotes.length) {
              moonHtml += '<div style="font-size:.85em;margin:3px 0 0 8px;color:#FFE082;">' + eclNotes.join(" \xB7 ") + "</div>";
            }
          } catch (e3) {
          }
          if (!verbose) {
            try {
              var precipStg = 0;
              var ltRec = _forecastRecord(today);
              if (ltRec && ltRec.final) precipStg = ltRec.final.precip || 0;
              var luxResult = nighttimeLux(today, precipStg);
              var luxCond = nighttimeLightCondition(luxResult.total);
              var cloudNote = "";
              if (precipStg >= 3) cloudNote = " \u2014 heavy cloud";
              else if (precipStg === 2) cloudNote = " \u2014 overcast";
              else if (precipStg === 1) cloudNote = " \u2014 partly cloudy";
              moonHtml += '<div style="font-size:.85em;margin:3px 0 0 8px;">' + luxCond.emoji + " Tonight: <b>" + esc(luxCond.label) + '</b> <span style="opacity:.5;">(' + luxResult.total + " lux)</span>" + esc(cloudNote) + "</div>";
            } catch (e4) {
            }
          }
          sections.push(moonHtml);
        }
      } catch (e) {
      }
    }
    if (verbose && st.moonsEnabled !== false) {
      try {
        var lightHtml = nighttimeLightHtml(today);
        if (lightHtml) {
          sections.push(`<div style="margin:4px 0;"><b>\u{1F319} Tonight's Lighting:</b></div><div style="margin-left:8px;">` + lightHtml + "</div>");
        }
      } catch (e) {
      }
    }
    if (st.planesEnabled !== false) {
      try {
        var plNotes = _planarNotableToday(today);
        var shifts = _activePlanarWeatherShiftLines(today);
        if (verbose) {
          if (plNotes.length) {
            sections.push('<div style="margin:4px 0;"><b>\u{1F300} Planar:</b> ' + button("Detail", "planes") + '</div><div style="font-size:.85em;margin-left:8px;line-height:1.5;">' + plNotes.join("<br>") + "</div>");
          }
          if (shifts.length) {
            sections.push('<div style="font-size:.82em;opacity:.7;margin-left:8px;">' + shifts.map(esc).join("<br>") + "</div>");
          }
        } else {
          if (plNotes.length || shifts.length) {
            var shiftMap = {};
            for (var si = 0; si < shifts.length; si++) {
              var shiftText = shifts[si];
              var shiftMatch = String(shiftText).match(/^(\w+)\s/);
              if (shiftMatch) shiftMap[shiftMatch[1].toLowerCase()] = shiftText.replace(/^[^:]+:\s*/, "");
            }
            var mergedLines = [];
            var usedShiftPlanes = {};
            for (var pni = 0; pni < plNotes.length; pni++) {
              var noteHtml = plNotes[pni];
              var planeMatch = noteHtml.match(/<b>([^<]+)<\/b>/);
              if (planeMatch) {
                var planeLower = planeMatch[1].toLowerCase();
                if (shiftMap[planeLower]) {
                  noteHtml += ' <span style="opacity:.6;font-size:.9em;">\u2014 ' + esc(shiftMap[planeLower]) + "</span>";
                  usedShiftPlanes[planeLower] = true;
                }
              }
              mergedLines.push(noteHtml);
            }
            for (var sj = 0; sj < shifts.length; sj++) {
              var sm2 = String(shifts[sj]).match(/^(\w+)\s/);
              if (sm2 && !usedShiftPlanes[sm2[1].toLowerCase()]) {
                mergedLines.push('<span style="opacity:.7;">' + esc(shifts[sj]) + "</span>");
              }
            }
            sections.push('<div style="margin:4px 0;"><b>\u{1F300} Planar:</b> ' + button("Detail", "planes") + '</div><div style="font-size:.85em;margin-left:8px;line-height:1.5;">' + mergedLines.join("<br>") + "</div>");
          }
        }
      } catch (e) {
      }
    }
    sections.push('<div style="margin-top:6px;">' + button("\u2B05 Calendar", "") + "</div>");
    return _menuBox(
      "\u{1F4CB} Today \u2014 " + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label),
      sections.join("")
    );
  }
  var USAGE = {
    "events.add": "Usage: !cal add [MM DD [YYYY] | <MonthName> DD [YYYY] | DD] NAME [#COLOR|color] (DD may be an ordinal like 1st or fourteenth)",
    "events.remove": "Usage: !cal remove [list | key <KEY> | series <KEY> | <name fragment>]",
    "events.restore": "Usage: !cal restore [all] [exact] <name...> | restore key <KEY>",
    "date.set": "Usage: !cal set [MM] DD [YYYY] or !cal set <MonthName> DD [YYYY] (DD may be an ordinal like 1st or fourteenth)"
  };
  function usage(key, m) {
    whisper(m.who, USAGE[key]);
  }
  function invokeEventSub(m, sub, args) {
    var cfg = EVENT_SUB[sub];
    if (!cfg) return whisper(m.who, "Unknown events subcommand. Try: add | remove | restore | list");
    if (cfg.usage && (!args || args.length === 0)) return usage(cfg.usage, m);
    return cfg.run(m, args || []);
  }
  var EVENT_SUB = {
    add: {
      usage: "events.add",
      run: function(m, args) {
        addEventSmart(args);
      }
    },
    remove: {
      usage: "events.remove",
      run: function(m, args) {
        if (!args || !args.length) {
          whisper(m.who, removeListHtml());
          return;
        }
        var sub = String(args[0] || "").toLowerCase();
        if (sub === "list") {
          if (args.length === 1) {
            whisper(m.who, removeListHtml());
            return;
          }
          return usage("events.remove", m);
        }
        if (sub === "key" || sub === "series") {
          removeEvent(args.join(" "));
          return;
        }
        whisper(m.who, removeMatchesListHtml(args.join(" ")));
      }
    },
    restore: {
      usage: "events.restore",
      run: function(m, args) {
        if ((args[0] || "").toLowerCase() === "list") {
          whisper(m.who, suppressedDefaultsListHtml());
          return;
        }
        restoreDefaultEvents(args.join(" "));
      }
    },
    list: {
      usage: null,
      run: function(m) {
        whisper(m.who, listAllEventsTableHtml());
      }
    }
  };
  var commands = {
    // ── Public ────────────────────────────────────────────────────────────────
    "": function(m, a) {
      var restTokens = _normalizePackedWords(a.slice(1).join(" ")).split(/\s+/).filter(Boolean);
      if (!restTokens.length) {
        _showDefaultCalView(m);
        return;
      }
      _deliverTopLevelCalendarRange({ who: m.who, args: restTokens, dest: "whisper" });
    },
    show: function(m, a) {
      var restTokens = _normalizePackedWords(a.slice(2).join(" ")).split(/\s+/).filter(Boolean);
      if (!restTokens.length) {
        _showDefaultCalView(m);
        return;
      }
      _deliverTopLevelCalendarRange({ who: m.who, args: restTokens, dest: "whisper" });
    },
    now: function(m) {
      sendCurrentDate(m.who, false, { playerid: m.playerid, compact: true, includeButtons: false });
    },
    today: function(m) {
      if (playerIsGM(m.playerid)) {
        weatherEnsureForecast();
        moonEnsureSequences();
        whisper(m.who, _todayAllHtml());
      } else {
        weatherEnsureForecast();
        moonEnsureSequences();
        whisper(m.who, _playerTodayHtml(m.playerid));
      }
    },
    // FIX: top-level !cal list now works
    list: function(m) {
      whisper(m.who, listAllEventsTableHtml());
    },
    // Player shortcut: !cal forecast shows their revealed weather forecast
    forecast: function(m) {
      handleWeatherCommand(m, ["weather", "forecast"]);
    },
    effects: { gm: true, run: function(m) {
      whisper(m.who, activeEffectsPanelHtml());
    } },
    help: function(m, a) {
      var page = String(a[2] || "").toLowerCase();
      switch (page) {
        case "eventcolors":
          return helpEventColorsMenu(m);
        case "calendar":
          return helpCalendarSystemMenu(m);
        case "themes":
          return helpThemesMenu(m);
        case "seasons":
          return helpSeasonsMenu(m);
        case "root":
        default:
          return helpRootMenu(m);
      }
    },
    // ── GM Only ───────────────────────────────────────────────────────────────
    settings: { gm: true, run: function(m, a) {
      var key = String(a[2] || "").toLowerCase();
      var val = String(a[3] || "").toLowerCase();
      var st = ensureSettings();
      function _settingsUsage() {
        return whisper(
          m.who,
          "Usage: <code>!cal settings (group|labels|events|moons|weather|weathermechanics|wxmechanics|planes|offcycle|buttons) (on|off)</code><br><code>!cal settings density (compact|normal)</code> &nbsp;\xB7&nbsp; <code>!cal settings mode (moon|weather|planes) (calendar|list|both)</code><br><code>!cal settings verbosity (normal|minimal)</code> &nbsp;\xB7&nbsp; <code>!cal settings weatherdays (1-20)</code>"
        );
      }
      if (!key) {
        return _settingsUsage();
      }
      if (key === "density") {
        if (!/^(compact|normal)$/.test(val)) {
          return whisper(m.who, "Usage: <code>!cal settings density (compact|normal)</code>");
        }
        st.uiDensity = val;
        refreshAndSend();
        return whisper(m.who, "UI density set to <b>" + esc(val) + "</b>.");
      }
      if (key === "verbosity") {
        if (!/^(normal|minimal)$/.test(val)) {
          return whisper(m.who, "Usage: <code>!cal settings verbosity (normal|minimal)</code>");
        }
        st.subsystemVerbosity = val;
        refreshAndSend();
        return whisper(m.who, "Subsystem detail set to <b>" + esc(titleCase(val)) + "</b>.");
      }
      if (key === "weatherdays" || key === "wxdays") {
        var weatherDays = parseInt(val, 10);
        if (!/^\d+$/.test(val) || weatherDays < 1 || weatherDays > CONFIG_WEATHER_FORECAST_DAYS) {
          return whisper(m.who, "Usage: <code>!cal settings weatherdays (1-" + CONFIG_WEATHER_FORECAST_DAYS + ")</code>");
        }
        st.weatherForecastViewDays = _weatherViewDays(weatherDays);
        refreshAndSend();
        return whisper(m.who, "Weather forecast span set to <b>" + st.weatherForecastViewDays + " days</b>.");
      }
      if (key === "mode") {
        var sysTok = String(a[3] || "").toLowerCase();
        var modeTok = String(a[4] || "").toLowerCase();
        if (!/^(moon|lunar|weather|planes|plane|planar)$/.test(sysTok) || !/^(calendar|list|both)$/.test(modeTok)) {
          return whisper(m.who, "Usage: <code>!cal settings mode (moon|weather|planes) (calendar|list|both)</code>");
        }
        if (sysTok === "moon" || sysTok === "lunar") st.moonDisplayMode = modeTok;
        if (sysTok === "weather") st.weatherDisplayMode = modeTok;
        if (sysTok === "planes" || sysTok === "plane" || sysTok === "planar") st.planesDisplayMode = modeTok;
        refreshAndSend();
        return whisper(m.who, "Display mode updated: <b>" + esc(titleCase(sysTok)) + "</b> \u2192 <b>" + esc(titleCase(modeTok)) + "</b>.");
      }
      if (!/^(group|labels|events|moons|weather|weathermechanics|wxmechanics|planes|offcycle|buttons)$/.test(key) || !/^(on|off)$/.test(val)) {
        return _settingsUsage();
      }
      if (key === "group") st.groupEventsBySource = val === "on";
      if (key === "labels") st.showSourceLabels = val === "on";
      if (key === "events") st.eventsEnabled = val === "on";
      if (key === "moons") {
        st.moonsEnabled = val === "on";
        st._moonsAutoToggle = false;
      }
      if (key === "weather") st.weatherEnabled = val === "on";
      if (key === "weathermechanics" || key === "wxmechanics") st.weatherMechanicsEnabled = val === "on";
      if (key === "planes") {
        st.planesEnabled = val === "on";
        st._planesAutoToggle = false;
      }
      if (key === "offcycle") st.offCyclePlanes = val === "on";
      if (key === "buttons") st.autoButtons = val === "on";
      refreshAndSend();
      whisper(m.who, "Setting updated.");
    } },
    events: { gm: true, run: function(m, a) {
      var args = a.slice(2);
      var sub = (args.shift() || "list").toLowerCase();
      return invokeEventSub(m, sub, args);
    } },
    add: { gm: true, run: function(m, a) {
      runEventsShortcut(m, a, "add");
    } },
    remove: { gm: true, run: function(m, a) {
      var args = a.slice(2);
      if (!args.length) {
        whisper(m.who, removeListHtml());
        return;
      }
      return invokeEventSub(m, "remove", args);
    } },
    restore: { gm: true, run: function(m, a) {
      runEventsShortcut(m, a, "restore");
    } },
    addmonthly: { gm: true, run: function(m, a) {
      addMonthlySmart(a.slice(2));
    } },
    addyearly: { gm: true, run: function(m, a) {
      addYearlySmart(a.slice(2));
    } },
    addannual: { gm: true, run: function(m, a) {
      addYearlySmart(a.slice(2));
    } },
    send: { gm: true, run: function(m, a) {
      var restTokens = _normalizePackedWords(a.slice(2).join(" ")).split(/\s+/).filter(Boolean);
      if (!restTokens.length) {
        sendCurrentDate(null, false, { playerid: m.playerid, includeButtons: false });
        return;
      }
      _deliverTopLevelCalendarRange({ who: m.who, args: restTokens, dest: "broadcast" });
    } },
    advance: { gm: true, run: function(m, a) {
      stepDays(parseInt(a[2], 10) || 1);
    } },
    retreat: { gm: true, run: function(m, a) {
      stepDays(-(parseInt(a[2], 10) || 1));
    } },
    set: { gm: true, run: function(m, a) {
      var r = Parse.looseMDY(a.slice(2));
      if (!r) {
        return whisper(m.who, USAGE["date.set"]);
      }
      var cal = getCal(), cur = cal.current, months = cal.months;
      if (r.kind === "dayOnly") {
        var next = nextForDayOnly(cur, r.day, months.length);
        var d = clamp(r.day, 1, months[next.month].days | 0);
        setDate(next.month + 1, d, next.year);
        return;
      }
      var y = r.year != null ? r.year : cur.year;
      if (months[r.mi] && months[r.mi].leapEvery && !_isLeapMonth(months[r.mi], y)) {
        return whisper(
          m.who,
          "<b>" + esc(months[r.mi].name) + "</b> only exists in leap years (every " + months[r.mi].leapEvery + " years). Year " + y + " is not a leap year."
        );
      }
      var d2 = clamp(r.day, 1, months[r.mi].days | 0);
      setDate(r.mi + 1, d2, y);
    } },
    theme: { gm: true, run: function(m, a) {
      var sub = String(a[2] || "").toLowerCase();
      if (!sub || sub === "list") {
        return whisper(m.who, themeListHtml());
      }
      if (sub === "reset" || sub === "default") {
        ensureSettings().colorTheme = null;
        colorsAPI.reset();
        refreshAndSend();
        return whisper(m.who, "Color theme reset to calendar default.");
      }
      if (!COLOR_THEMES[sub]) return whisper(m.who, "Unknown theme. Try <code>!cal theme list</code>.");
      ensureSettings().colorTheme = sub;
      colorsAPI.reset();
      refreshAndSend();
      whisper(m.who, "Color theme set to <b>" + esc(sub) + "</b>. Use <code>!cal theme reset</code> to return to calendar default.");
    } },
    calendar: { gm: true, run: function(m, a) {
      var sysKey = (a[2] || "").toLowerCase();
      var varKey = (a[3] || "").toLowerCase();
      if (!sysKey || !CALENDAR_SYSTEMS[sysKey]) {
        return whisper(m.who, calendarSystemListHtml());
      }
      var sys = CALENDAR_SYSTEMS[sysKey];
      if (varKey && !(sys.variants && sys.variants[varKey])) {
        return whisper(
          m.who,
          "Unknown variant <b>" + esc(varKey) + "</b> for " + esc(sys.label || sysKey) + ". Available: " + Object.keys(sys.variants || {}).join(", ") + "."
        );
      }
      var vk = varKey || sys.defaultVariant || "standard";
      var variant = sys.variants && sys.variants[vk];
      ensureSettings().colorTheme = null;
      applyCalendarSystem(sysKey, vk);
      _invalidateSerialCache();
      refreshAndSend();
      var msg = "Calendar: <b>" + esc(sys.label || titleCase(sysKey)) + "</b>";
      if (Object.keys(sys.variants || {}).length > 1) msg += " \u2014 " + esc(variant.label || titleCase(vk));
      whisper(m.who, msg + ".");
    } },
    seasons: { gm: true, run: function(m, a) {
      var sub = String(a[2] || "").toLowerCase();
      if (!sub || sub === "list") {
        return whisper(m.who, seasonSetListHtml());
      }
      if (!SEASON_SETS[sub]) return whisper(m.who, "Unknown variant. Options: " + Object.keys(SEASON_SETS).join(", ") + ".");
      if (!applySeasonSet(sub)) {
        return whisper(m.who, "That season set doesn\u2019t fit this calendar.");
      }
      ensureSettings().seasonVariant = sub;
      refreshAndSend();
      whisper(m.who, "Season variant: <b>" + esc(sub) + "</b>.");
    } },
    hemisphere: { gm: true, run: function(m, a) {
      var sub = String(a[2] || "").toLowerCase();
      if (sub !== "north" && sub !== "south") {
        var st3 = ensureSettings();
        var cur = st3.hemisphere || CONFIG_DEFAULTS.hemisphere;
        var sv3 = st3.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
        var entry3 = SEASON_SETS[sv3] || {};
        var aware = entry3.hemisphereAware ? "yes" : "no (current season set is not hemisphere-aware)";
        return whisper(
          m.who,
          "Current hemisphere: <b>" + esc(cur) + "</b>. Hemisphere-aware: " + aware + ".<br>" + button("North", "hemisphere north") + " " + button("South", "hemisphere south")
        );
      }
      var st4 = ensureSettings();
      st4.hemisphere = sub;
      applySeasonSet(st4.seasonVariant || CONFIG_DEFAULTS.seasonVariant);
      refreshAndSend();
      whisper(m.who, "Hemisphere: <b>" + esc(sub) + "</b>.");
    } },
    source: { gm: true, run: function(m, a) {
      var args = a.slice(2).map(function(x) {
        return String(x).trim();
      }).filter(Boolean);
      var sub = (args[0] || "").toLowerCase();
      var suppressedSources = state[state_name].suppressedSources || (state[state_name].suppressedSources = {});
      function allSources() {
        var cal = getCal(), seen = {};
        defaults2.events.forEach(function(de) {
          if (de.source) seen[String(de.source).toLowerCase()] = String(de.source);
        });
        cal.events.forEach(function(e) {
          if (e.source) seen[String(e.source).toLowerCase()] = String(e.source);
        });
        return seen;
      }
      function listSources() {
        var seen = allSources();
        var keys = Object.keys(seen);
        if (!keys.length) {
          return whisper(m.who, '<div><b>Sources</b></div><div style="opacity:.7;">No sources found.</div>');
        }
        var pList = ensureSettings().eventSourcePriority;
        function pRank(k) {
          var i = pList.indexOf(k);
          return i >= 0 ? i : pList.length;
        }
        keys.sort(function(a2, b) {
          var rd = pRank(a2) - pRank(b);
          return rd !== 0 ? rd : a2.localeCompare(b);
        });
        var head = '<tr><th style="' + STYLES.th + '">Priority</th><th style="' + STYLES.th + '">Source</th><th style="' + STYLES.th + '">Status</th><th style="' + STYLES.th + '">Move</th><th style="' + STYLES.th + '">Enable/Disable</th></tr>';
        var rows = keys.map(function(k, i) {
          var label = seen[k];
          var rank = pList.indexOf(k);
          var rankCell = rank >= 0 ? String(rank + 1) : '<span style="opacity:.5;">\u2014</span>';
          var disabled = !!suppressedSources[k];
          var upBtn = i > 0 ? button("\u2191", "source up " + label, { icon: "" }) : '<span style="opacity:.25;">\u2191</span>';
          var downBtn = i < keys.length - 1 ? button("\u2193", "source down " + label, { icon: "" }) : '<span style="opacity:.25;">\u2193</span>';
          var togBtn = disabled ? button("Enable", "source enable " + label) : button("Disable", "source disable " + label);
          return '<tr><td style="' + STYLES.td + ';text-align:center;">' + rankCell + '</td><td style="' + STYLES.td + '">' + esc(label) + '</td><td style="' + STYLES.td + ';text-align:center;">' + (disabled ? "Off" : "On") + '</td><td style="' + STYLES.td + ';text-align:center;">' + upBtn + " " + downBtn + '</td><td style="' + STYLES.td + ';text-align:center;">' + togBtn + "</td></tr>";
        }).join("");
        whisper(
          m.who,
          '<div style="margin:4px 0;"><b>Sources &amp; Priority</b></div><table style="' + STYLES.table + '">' + head + rows + '</table><div style="font-size:.8em;opacity:.7;margin-top:4px;">Priority 1 = primary event (sets cell color). Unranked sources (\u2014) are tied last.<br>User-added events always rank first regardless of source.</div>'
        );
      }
      function movePriority(name, dir) {
        var key = String(name || "").toLowerCase();
        var seen = allSources();
        if (!key || !seen[key]) {
          whisper(m.who, "Source not found: " + esc(name));
          return;
        }
        var st = ensureSettings();
        var pList = st.eventSourcePriority;
        var idx = pList.indexOf(key);
        if (idx < 0) {
          if (dir === "up") pList.unshift(key);
          else pList.push(key);
        } else {
          var swap = dir === "up" ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= pList.length) {
            listSources();
            return;
          }
          var tmp = pList[swap];
          pList[swap] = pList[idx];
          pList[idx] = tmp;
        }
        var knownKeys = Object.keys(seen);
        st.eventSourcePriority = pList.filter(function(k) {
          return knownKeys.indexOf(k) >= 0;
        });
        listSources();
      }
      function disableSource(name) {
        var key = String(name || "").toLowerCase();
        if (!key) {
          whisper(m.who, "Usage: <code>!cal source disable &lt;name&gt;</code>");
          return;
        }
        suppressedSources[key] = 1;
        var cal = getCal(), defaultsSet = currentDefaultKeySet(cal);
        cal.events = cal.events.filter(function(e) {
          var src = e.source != null ? String(e.source).toLowerCase() : null;
          if (src !== key) return true;
          var maxD = cal.months[e.month - 1].days | 0;
          var norm = DaySpec.canonicalForKey(e.day, maxD);
          var k = defaultKeyFor(e.month, norm, e.name);
          return !defaultsSet[k];
        });
        refreshAndSend();
        sendChat(script_name, '/w gm Disabled source "' + esc(name) + '" and removed its default events.');
      }
      function enableSource(name) {
        var key = String(name || "").toLowerCase();
        if (!key) {
          whisper(m.who, "Usage: <code>!cal source enable &lt;name&gt;</code>");
          return;
        }
        delete suppressedSources[key];
        var sup = state[state_name].suppressedDefaults || {};
        Object.keys(sup).forEach(function(k) {
          var info = _defaultDetailsForKey(k);
          var src = info.source != null ? String(info.source).toLowerCase() : null;
          if (src === key) delete sup[k];
        });
        mergeInNewDefaultEvents(getCal());
        refreshAndSend();
        sendChat(script_name, '/w gm Enabled source "' + esc(name) + '" and restored its default events.');
      }
      if (!sub || sub === "list") return listSources();
      if (sub === "up") {
        return movePriority(args.slice(1).join(" "), "up");
      }
      if (sub === "down") {
        return movePriority(args.slice(1).join(" "), "down");
      }
      if (sub === "disable") {
        if (!args[1]) return whisper(m.who, "Usage: <code>!cal source disable &lt;name&gt;</code>");
        return disableSource(args.slice(1).join(" "));
      }
      if (sub === "enable") {
        if (!args[1]) return whisper(m.who, "Usage: <code>!cal source enable &lt;name&gt;</code>");
        return enableSource(args.slice(1).join(" "));
      }
      whisper(m.who, "Usage: <code>!cal source [list|up|down|disable|enable] [&lt;name&gt;]</code>");
    } },
    resetcalendar: { gm: true, run: function() {
      resetToDefaults();
    } },
    // Moon system
    lunar: function(m, a) {
      handleMoonCommand(m, ["moon"].concat(a.slice(2)));
    },
    // alias
    moon: function(m, a) {
      handleMoonCommand(m, a.slice(1));
    },
    // mixed: players=view, GM=edit
    // Weather — GM full access, players get today's conditions only
    weather: function(m, a) {
      handleWeatherCommand(m, a.slice(1));
    },
    // Planar system — parallel to moons/weather
    planar: function(m, a) {
      handlePlanesCommand(m, ["planes"].concat(a.slice(2)));
    },
    // alias
    planes: function(m, a) {
      handlePlanesCommand(m, a.slice(1));
    }
  };

  // src/commands.ts
  function _normalizePackedWords(q) {
    return String(q || "").replace(/\b(nextmonth)\b/gi, "next month").replace(/\b(nextyear)\b/gi, "next year").replace(/\b(currentmonth|thismonth)\b/gi, "month").replace(/\b(thisyear)\b/gi, "year").replace(/\b(lastmonth)\b/gi, "last month").replace(/\b(lastyear)\b/gi, "last year").replace(/\b(previousmonth|prevmonth)\b/gi, "previous month").replace(/\b(previousyear|prevyear)\b/gi, "previous year").replace(/\b(next[-_]month)\b/gi, "next month").replace(/\b(next[-_]year)\b/gi, "next year").trim();
  }
  function runEventsShortcut(m, a, sub) {
    var args = a.slice(2);
    return invokeEventSub(m, String(sub || "list").toLowerCase(), args);
  }
  function _showDefaultCalView(m) {
    sendCurrentDate(m.who, false, {
      playerid: m.playerid,
      dashboard: true,
      includeButtons: true
    });
  }
  function _playerPlanarActiveTodayLines(today, viewTier, genHorizon) {
    var planes = _getAllPlaneData();
    var notes = [];
    var ignoreGenerated = viewTier === "low" || genHorizon <= 0;
    for (var i = 0; i < planes.length; i++) {
      if (planes[i].type === "fixed") continue;
      var ps = getPlanarState(planes[i].name, today, ignoreGenerated ? { ignoreGenerated: true } : null);
      if (!ps) continue;
      if (ps.phase !== "coterminous" && ps.phase !== "remote") continue;
      notes.push((PLANE_PHASE_EMOJI[ps.phase] || "\u26AA") + " <b>" + esc(ps.plane.name) + "</b> " + esc(PLANE_PHASE_LABELS[ps.phase] || ps.phase));
    }
    return notes;
  }
  function _playerTodayHtml(playerid) {
    var st = ensureSettings();
    var today = todaySerial();
    var cal = getCal();
    var c = cal.current;
    var mObj = cal.months[c.month] || {};
    var sections = [];
    sections.push('<div style="font-weight:bold;margin-bottom:4px;">' + esc(currentDateLabel()) + "</div>");
    try {
      var occ = occurrencesInRange(today, today);
      if (occ.length) {
        var names = [];
        var seen = {};
        for (var oi = 0; oi < occ.length; oi++) {
          var nm = eventDisplayName(occ[oi].e);
          var key = String(nm || "").toLowerCase();
          if (!seen[key]) {
            seen[key] = 1;
            names.push(nm);
          }
        }
        sections.push('<div style="margin:3px 0;">\u{1F389} <b>Events:</b> ' + names.map(esc).join(", ") + "</div>");
      }
    } catch (e) {
    }
    if (st.weatherEnabled !== false) {
      try {
        weatherEnsureForecast();
        var rec = _forecastRecord(today);
        if (rec) {
          var rev = _weatherRevealForSerial(getWeatherState(), today, getWeatherState().location);
          var tier = rev.tier || "low";
          var srcLabel = WEATHER_SOURCE_LABELS[rev.source] || null;
          sections.push('<div style="margin:4px 0 2px 0;"><b>\u2601 Weather:</b></div>' + _playerDayHtml(rec, tier, false, srcLabel));
        }
      } catch (e2) {
      }
    }
    if (st.moonsEnabled !== false) {
      try {
        moonEnsureSequences();
        var ms = getMoonState();
        var moonTier = _normalizeMoonRevealTier(ms.revealTier || "medium");
        var moonHorizon = parseInt(ms.revealHorizonDays, 10) || 7;
        var moonBits = [];
        var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
        if (sys && sys.moons) {
          for (var mi = 0; mi < sys.moons.length; mi++) {
            var moon = sys.moons[mi];
            var peakType = _moonPeakPhaseDay(moon.name, today);
            if (peakType === "full") moonBits.push("\u{1F315} <b>" + esc(moon.name) + "</b> is Full");
            else if (peakType === "new") {
              var ph = moonPhaseAt(moon.name, today);
              moonBits.push("\u{1F311} <b>" + esc(moon.name) + "</b> is New" + (ph && ph.longShadows ? ' <span style="opacity:.7;">(Long Shadows)</span>' : ""));
            }
          }
        }
        sections.push(
          '<div style="margin:4px 0 2px 0;"><b>\u{1F319} Moons:</b></div>' + _moonTodaySummaryHtml(today, moonTier, moonHorizon) + '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' + (moonBits.length ? moonBits.join("<br>") : '<span style="opacity:.6;">No moons at full or new today.</span>') + "</div>" + (moonTier === "high" && _eclipseNotableToday(today).length ? '<div style="font-size:.82em;margin:3px 0 0 8px;line-height:1.5;">' + _eclipseNotableToday(today).join("<br>") + "</div>" : "")
        );
      } catch (e3) {
      }
    }
    if (st.planesEnabled !== false) {
      try {
        var ps = getPlanesState();
        var planeTier = _normalizePlaneRevealTier(ps.revealTier || "medium");
        var planeHorizon = parseInt(ps.revealHorizonDays, 10) || _planarYearDays();
        var planeGenHorizon = parseInt(ps.generatedHorizonDays, 10) || 0;
        var planeNotes = _playerPlanarActiveTodayLines(today, planeTier, planeGenHorizon);
        sections.push(
          '<div style="margin:4px 0 2px 0;"><b>\u{1F300} Planes:</b></div>' + _planesTodaySummaryHtml(today, false, planeTier, planeHorizon) + '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' + (planeNotes.length ? planeNotes.join("<br>") : '<span style="opacity:.6;">No active planar extremes today.</span>') + "</div>"
        );
      } catch (e4) {
      }
    }
    sections.push('<div style="margin-top:6px;">' + button("\u2B05 Calendar", "") + " " + button("\u{1F324} Weather", "weather") + " " + button("\u{1F319} Moons", "moon") + " " + button("\u{1F300} Planes", "planes") + "</div>");
    return _menuBox("\u{1F4CB} Today \u2014 " + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label), sections.join(""));
  }

  // src/ui.ts
  function currentDateLabel() {
    var cal = getCal(), cur = cal.current;
    if (ensureSettings().calendarSystem === "faerunian") {
      return formatDateLabel(cur.year, cur.month, cur.day_of_the_month, true);
    }
    var datePart = _displayMonthDayParts(cur.month, cur.day_of_the_month).label;
    return cal.weekdays[cur.day_of_the_week] + ", " + datePart + ", " + cur.year + " " + LABELS.era;
  }
  function dateLabelFromSerial(serial) {
    var cal = getCal();
    var d = fromSerial(serial);
    if (ensureSettings().calendarSystem === "faerunian") {
      return formatDateLabel(d.year, d.mi, d.day, true);
    }
    var wd = cal.weekdays[weekdayIndex(d.year, d.mi, d.day)];
    var datePart = _displayMonthDayParts(d.mi, d.day).label;
    return wd + ", " + datePart + ", " + d.year + " " + LABELS.era;
  }
  function nextForDayOnly(cur, day, monthsLen) {
    var months = getCal().months;
    var want = Math.max(1, day | 0);
    var m = cur.month, y = cur.year;
    if (want <= (months[m].days | 0) && cur.day_of_the_month <= want && (!months[m].leapEvery || _isLeapMonth(months[m], y))) {
      return { month: m, year: y };
    }
    for (var i = 0; i < monthsLen * 2; i++) {
      m = (m + 1) % monthsLen;
      if (m === 0) y++;
      if (months[m].leapEvery && !_isLeapMonth(months[m], y)) continue;
      if (want <= (months[m].days | 0)) return { month: m, year: y };
    }
    var _nxt = _nextActiveMi(cur.month, cur.year);
    return { month: _nxt.mi, year: _nxt.y };
  }
  function nextForMonthDay(cur, mIndex, d) {
    var mdays = getCal().months[mIndex].days;
    var day = clamp(d, 1, mdays);
    var serialNow = toSerial(cur.year, cur.month, cur.day_of_the_month);
    var serialCand = toSerial(cur.year, mIndex, day);
    if (serialCand >= serialNow) return { year: cur.year };
    return { year: cur.year + 1 };
  }
  function _getSeasonLabel(mi, day) {
    var st = ensureSettings();
    var sv = st.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
    var entry = SEASON_SETS[sv] || {};
    if (!entry.transitions) {
      return getCal().months[mi].season || null;
    }
    var hem = st.hemisphere || CONFIG_DEFAULTS.hemisphere;
    var tr = hem === "south" && entry.transitionsSouth ? entry.transitionsSouth : entry.transitions;
    var rmi = regularMonthIndex(mi);
    var cur = rmi * 1e3 + (day | 0);
    var best = null, bestScore = -1;
    for (var i = 0; i < tr.length; i++) {
      var score = tr[i].mi * 1e3 + tr[i].day;
      if (score <= cur && score > bestScore) {
        bestScore = score;
        best = tr[i].season;
      }
    }
    return best || (tr.length ? tr[tr.length - 1].season : null);
  }
  function _uiDensityValue(explicit) {
    var d = String(explicit || ensureSettings().uiDensity || CONFIG_DEFAULTS.uiDensity || "compact").toLowerCase();
    return d === "normal" ? "normal" : "compact";
  }
  function _normalizeDisplayMode(mode) {
    var m = String(mode || "").toLowerCase();
    if (m === "calendar" || m === "list" || m === "both") return m;
    return "both";
  }
  function _nextDisplayMode(mode) {
    var m = _normalizeDisplayMode(mode);
    if (m === "both") return "calendar";
    if (m === "calendar") return "list";
    return "both";
  }
  function _displayModeLabel(mode) {
    var m = _normalizeDisplayMode(mode);
    if (m === "calendar") return "Calendar";
    if (m === "list") return "List";
    return "Both";
  }
  function _subsystemVerbosityValue() {
    var v = String(ensureSettings().subsystemVerbosity || CONFIG_DEFAULTS.subsystemVerbosity || "normal").toLowerCase();
    return v === "minimal" ? "minimal" : "normal";
  }
  function _subsystemIsVerbose() {
    return _subsystemVerbosityValue() !== "minimal";
  }
  function _legendLine(items) {
    if (!items || !items.length) return "";
    return '<div style="font-size:.76em;opacity:.55;margin:4px 0 6px 0;">Legend: ' + items.map(esc).join(" \xB7 ") + "</div>";
  }
  function _displayMonthDayParts(mi, day) {
    var cal = getCal();
    var st = ensureSettings();
    var m = cal.months[mi] || {};
    if (st.calendarSystem === "faerunian") {
      if (m.isIntercalary) {
        return { monthName: String(m.name || mi + 1), day, label: String(m.name || mi + 1) };
      }
      return {
        monthName: String(m.name || mi + 1),
        day,
        label: _ordinal(day) + " of " + String(m.name || mi + 1)
      };
    }
    if (st.calendarSystem === "gregorian" && m.isIntercalary && String(m.name || "") === "Leap Day") {
      return { monthName: "February", day: 29, label: "February 29" };
    }
    return {
      monthName: String(m.name || mi + 1),
      day,
      label: String(day) + " " + String(m.name || mi + 1)
    };
  }
  function _serialToDateSpec(serial) {
    var d = fromSerial(serial | 0);
    var parts = _displayMonthDayParts(d.mi, d.day);
    return parts.monthName + " " + d.day + " " + d.year;
  }
  function _shiftSerialByMonth(serial, dir) {
    var d = fromSerial(serial | 0);
    var step = dir < 0 ? _prevActiveMi(d.mi, d.year) : _nextActiveMi(d.mi, d.year);
    var md = Math.max(1, (getCal().months[step.mi] || {}).days | 0);
    var day = clamp(d.day, 1, md);
    return toSerial(step.y, step.mi, day);
  }
  function _weatherViewDays(n) {
    var days = parseInt(n, 10);
    if (!isFinite(days)) return CONFIG_DEFAULTS.weatherForecastViewDays;
    if (days < 1) return 1;
    if (days > CONFIG_WEATHER_FORECAST_DAYS) return CONFIG_WEATHER_FORECAST_DAYS;
    return days;
  }
  function _playerButtonsHtml() {
    var nav2 = [
      button("\u25C0 Prev", "show previous month"),
      button("Next \u25B6", "show next month")
    ];
    var out = [];
    var st = ensureSettings();
    out.push(button("\u{1F4CB} Today", "today"));
    if (st.weatherEnabled !== false) out.push(button("\u{1F324} Weather", "weather"));
    if (st.moonsEnabled !== false) out.push(button("\u{1F319} Moons", "moon"));
    if (st.planesEnabled !== false) out.push(button("\u{1F300} Planes", "planes"));
    return nav2.join(" ") + "<br>" + out.join(" ");
  }
  function sendCurrentDate(to, gmOnly, opts) {
    opts = opts || {};
    var st = ensureSettings();
    var density = _uiDensityValue(opts.density);
    var dashboard = !!opts.dashboard;
    var compact = !!opts.compact || !dashboard && density === "compact";
    var includeButtons = opts.includeButtons === void 0 ? st.autoButtons !== false : !!opts.includeButtons;
    var audienceIsGM = !!gmOnly;
    if (!audienceIsGM && to && opts.playerid) audienceIsGM = !!playerIsGM(opts.playerid);
    if (!audienceIsGM && opts.audienceIsGM === true) audienceIsGM = true;
    var cal = getCal(), c = cal.current;
    var m = cal.months[c.month];
    var todaySer = toSerial(c.year, c.month, c.day_of_the_month);
    var calHtml = "";
    if (!compact || dashboard) {
      var monthStart = toSerial(c.year, c.month, 1);
      var monthEnd = toSerial(c.year, c.month, m.days | 0);
      var spec = {
        start: monthStart,
        end: monthEnd,
        months: [{ y: c.year, mi: c.month }],
        title: m.name + " " + c.year + " " + LABELS.era
      };
      calHtml = buildCalendarsHtmlForSpec(spec);
    }
    var _seasonLabel = _getSeasonLabel(c.month, c.day_of_the_month);
    var currentDate = currentDateLabel();
    var dateLine = compact ? '<div style="font-weight:bold;margin:2px 0 3px 0;">' + esc(currentDate) + (_seasonLabel ? ' &nbsp;<span style="opacity:.7;font-weight:normal;">\u2014 ' + esc(_seasonLabel) + "</span>" : "") + "</div>" : '<div style="font-weight:bold;margin:3px 0;">' + esc(currentDate) + (_seasonLabel ? ' &nbsp;<span style="opacity:.7;font-weight:normal;font-size:.9em;">\u2014 ' + esc(_seasonLabel) + "</span>" : "") + "</div>";
    var eventsBlock = (function() {
      if (compact || dashboard) return "";
      var inner = monthEventsHtml(c.month, c.day_of_the_month);
      if (!inner) return "";
      return '<div style="margin-top:5px;font-size:.85em;opacity:.7;">Events this month:</div>' + inner;
    })();
    var moonLine = "";
    if (ensureSettings().moonsEnabled !== false) {
      try {
        moonEnsureSequences();
        var _st = ensureSettings();
        var _sys = MOON_SYSTEMS[_st.calendarSystem] || MOON_SYSTEMS.eberron;
        if (_sys && _sys.moons) {
          var _notable = [];
          _sys.moons.forEach(function(moon) {
            var ph = moonPhaseAt(moon.name, todaySer);
            var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
            var _thisNotable = false;
            var titleTag = "";
            var _peakType = _moonPeakPhaseDay(moon.name, todaySer);
            if (_peakType === "full") {
              _notable.push(emoji + " <b>" + esc(moon.name) + "</b>" + titleTag + " is Full");
              _thisNotable = true;
              return;
            }
            if (_peakType === "new") {
              var newLabel = ph.longShadows ? emoji + " <b>" + esc(moon.name) + "</b>" + titleTag + " goes dark (Long Shadows)" : emoji + " <b>" + esc(moon.name) + "</b>" + titleTag + " is New";
              _notable.push(newLabel);
              _thisNotable = true;
              return;
            }
            var nFull = _moonNextEvent(moon.name, todaySer, "full");
            var nNew = _moonNextEvent(moon.name, todaySer, "new");
            var dFull = nFull ? Math.ceil(nFull - todaySer) : 999;
            var dNew = nNew ? Math.ceil(nNew - todaySer) : 999;
            if (dFull <= 2) {
              var fEmoji = "\u{1F315}";
              _notable.push(fEmoji + " <b>" + esc(moon.name) + "</b>" + titleTag + " Full " + (dFull === 1 ? "tomorrow" : "in 2 days"));
              _thisNotable = true;
            } else if (dNew <= 2) {
              var nEmoji = "\u{1F311}";
              _notable.push(nEmoji + " <b>" + esc(moon.name) + "</b>" + titleTag + " New " + (dNew === 1 ? "tomorrow" : "in 2 days"));
              _thisNotable = true;
            }
            if (audienceIsGM && !_thisNotable && moon.plane && ensureSettings().planesEnabled !== false) {
              try {
                var _aPs = getPlanarState(moon.plane, todaySer);
                if (_aPs && _aPs.phase === "coterminous")
                  _notable.push("\u2728 <b>" + esc(moon.name) + "</b>" + titleTag + " ascendant");
              } catch (e2) {
              }
            }
          });
          if (_notable.length) {
            moonLine = '<div style="font-size:.82em;opacity:.7;margin-top:3px;line-height:1.6;">' + _notable.join("<br>") + "</div>";
          }
          try {
            var _eclNotes = _eclipseNotableToday(todaySer);
            if (_eclNotes.length) {
              moonLine += '<div style="' + applyBg(
                "font-size:.82em;opacity:.9;margin-top:2px;display:inline-block;padding:1px 4px;border-radius:3px;",
                "#FFE8A3",
                CONTRAST_MIN_HEADER
              ) + '">' + _eclNotes.join(" &nbsp;&middot;&nbsp; ") + "</div>";
            }
          } catch (e3) {
          }
        }
      } catch (e) {
      }
    }
    var weatherLine = "";
    if (ensureSettings().weatherEnabled !== false) {
      try {
        var _ws = getWeatherState();
        if (_ws.location) {
          weatherEnsureForecast();
          var _wxRec = _weatherRecordForDisplay(_forecastRecord(todaySer));
          if (_wxRec && _wxRec.final) {
            var _f = _wxRec.final;
            var _tL = CONFIG_WEATHER_LABELS.temp[_f.temp] || _tempBand(_f.temp);
            var _wxLoc = _wxRec.location || {};
            var _wxCond = _deriveConditions(_f, _wxLoc, WEATHER_PRIMARY_PERIOD, _wxRec.snowAccumulated, _weatherPrimaryFog(_wxRec));
            var _wxNarr = _conditionsNarrative(_f, _wxCond, WEATHER_PRIMARY_PERIOD);
            weatherLine = '<div style="font-size:.82em;opacity:.65;margin-top:2px;">\u2601\uFE0F ' + esc(_wxNarr) + "</div>";
            _grantCommonWeatherReveals(_ws, todaySer);
          }
        }
      } catch (e) {
      }
    }
    var planesLine = "";
    if (audienceIsGM && ensureSettings().planesEnabled !== false) {
      try {
        var _plNotes = _planarNotableToday(todaySer);
        if (_plNotes.length) {
          planesLine = '<div style="font-size:.82em;opacity:.7;margin-top:2px;line-height:1.6;">' + _plNotes.join("<br>") + "</div>";
        }
      } catch (e) {
      }
    }
    var todayEventsLine = "";
    try {
      var occ = occurrencesInRange(todaySer, todaySer);
      if (occ.length) {
        var seenNames = {};
        var names = [];
        for (var oi = 0; oi < occ.length; oi++) {
          var nm = eventDisplayName(occ[oi].e);
          var keyNm = String(nm || "").toLowerCase();
          if (!seenNames[keyNm]) {
            seenNames[keyNm] = 1;
            names.push(nm);
          }
        }
        var shown = names.slice(0, 3).map(esc).join(", ");
        var more = names.length > 3 ? ' <span style="opacity:.65;">+' + (names.length - 3) + " more</span>" : "";
        todayEventsLine = '<div style="font-size:.82em;opacity:.75;margin-top:2px;">\u{1F389} ' + shown + more + "</div>";
      } else if (dashboard) {
        todayEventsLine = '<div style="font-size:.82em;opacity:.6;margin-top:2px;">\u{1F389} No calendar events today.</div>';
      }
    } catch (e4) {
    }
    var msgCore;
    if (dashboard) {
      msgCore = calHtml + dateLine + todayEventsLine + moonLine + weatherLine + planesLine;
    } else if (compact) {
      msgCore = '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:4px 0;">' + dateLine + todayEventsLine + moonLine + weatherLine + planesLine + "</div>";
    } else {
      msgCore = calHtml + dateLine + moonLine + weatherLine + planesLine + eventsBlock;
    }
    var controls = "";
    if (includeButtons && (gmOnly || to)) {
      var isGmRecipient = !!gmOnly || !!(opts.playerid && playerIsGM(opts.playerid));
      var controlsHtml = isGmRecipient ? gmButtonsHtml() : _playerButtonsHtml();
      if (controlsHtml) controls = '<div style="margin-top:2px;">' + controlsHtml + "</div>";
    }
    var publicMsg = msgCore + controls;
    if (gmOnly) {
      sendToGM(publicMsg);
    } else if (to) {
      whisper(to, publicMsg);
    } else {
      sendToAll(publicMsg);
    }
  }
  function _parseSharpColorToken(tok) {
    if (!tok || tok[0] !== "#") return null;
    var raw = tok.slice(1).trim();
    var hex = sanitizeHexColor2("#" + raw);
    if (hex) return hex;
    var named = NAMED_COLORS[String(raw).toLowerCase()] || null;
    return named;
  }
  function parseDatePrefixForAdd(tokens) {
    tokens = (tokens || []).filter(Boolean);
    if (!tokens.length) return null;
    var cal = getCal(), cur = cal.current, months = cal.months;
    var r = Parse.looseMDY(tokens.slice(0, 3));
    if (r) {
      if (r.kind === "dayOnly") {
        var nx = nextForDayOnly(cur, r.day, months.length);
        var d = clamp(r.day, 1, months[nx.month].days | 0);
        return { used: 1, mHuman: nx.month + 1, day: d, year: nx.year };
      } else {
        var d2 = clamp(r.day, 1, months[r.mi].days | 0);
        var y = r.year != null ? r.year : nextForMonthDay(cur, r.mi, d2).year;
        return { used: r.year != null ? 3 : 2, mHuman: r.mi + 1, day: d2, year: y };
      }
    }
    var t0 = tokens[0];
    var od = Parse.ordinalDay(t0);
    var num = /^\d+$/.test(t0) ? parseInt(t0, 10) | 0 : null;
    var dd = od != null ? od : num;
    if (dd != null) {
      var nx2 = nextForDayOnly(cur, dd, months.length);
      var d3 = clamp(dd, 1, months[nx2.month].days | 0);
      return { used: 1, mHuman: nx2.month + 1, day: d3, year: nx2.year };
    }
    return null;
  }
  function addEventSmart(tokens) {
    tokens = (tokens || []).filter(function(t) {
      return String(t).trim() !== "--";
    });
    var pref = parseDatePrefixForAdd(tokens);
    if (!pref) {
      warnGM("Usage: !cal add [MM DD [YYYY] | <MonthName> DD [YYYY] | DD] NAME [#COLOR|color]");
      return;
    }
    var rest = tokens.slice(pref.used);
    var pulled = popColorIfPresent(rest, true);
    var color = pulled.color;
    var name = pulled.tokens.join(" ").trim() || "Untitled Event";
    var ok = _addConcreteEvent(pref.mHuman, String(pref.day), pref.year, name, color);
    if (ok) {
      refreshAndSend();
      warnGM("Added 1 event.");
    } else {
      warnGM("No event added (duplicate or invalid).");
    }
  }
  function addMonthlySmart(tokens) {
    tokens = (tokens || []).filter(function(t) {
      return String(t).trim() !== "--";
    });
    if (!tokens.length) {
      return warnGM('Usage: !cal addmonthly <daySpec> NAME [#COLOR|color]\ndaySpec can be N, N-M, or "first|second|third|fourth|fifth|last <weekday>" (also "every <weekday>").');
    }
    var daySpec = null, used = 0;
    if (tokens[1]) {
      var two = (tokens[0] + " " + tokens[1]).toLowerCase().trim();
      if (Parse.ordinalWeekday.fromSpec(two)) {
        daySpec = two;
        used = 2;
      }
    }
    if (!daySpec) {
      var one = String(tokens[0]).toLowerCase().trim();
      if (/^\d+(-\d+)?$/.test(one)) {
        daySpec = one;
        used = 1;
      } else {
        var asNum = Parse.ordinalDay(one);
        if (asNum != null) {
          daySpec = String(asNum);
          used = 1;
        }
      }
    }
    if (!daySpec) {
      return warnGM('Couldn\u2019t parse daySpec. Try: 6  |  18-19  |  "first far"  |  "last zor"  |  "every sul".');
    }
    var pulled = popColorIfPresent(tokens.slice(used), true);
    var color = pulled.color;
    var name = pulled.tokens.join(" ").trim() || "Untitled Event";
    var cal = getCal(), added = 0;
    for (var m = 1; m <= cal.months.length; m++) {
      if (_addConcreteEvent(m, daySpec, null, name, color)) added++;
    }
    refreshAndSend();
    warnGM("Added " + added + " monthly event" + (added === 1 ? "" : "s") + ' for "' + esc(name) + '" on ' + esc(daySpec) + ".");
  }
  function addYearlySmart(tokens) {
    tokens = (tokens || []).filter(function(t) {
      return String(t).trim() !== "--";
    });
    if (!tokens.length) {
      return warnGM("Usage: !cal addyearly <Month> <DD|DD-DD|ordinal-day> NAME [#COLOR|color]\n   or: !cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> NAME [#COLOR|color]");
    }
    var cal = getCal();
    var used = 0, mHuman = null, daySpec = null;
    (function tryOrdinalWeekdayWithMonth() {
      if (daySpec != null) return;
      var ow = Parse.ordinalWeekday.fromTokens(tokens);
      if (!ow) return;
      var idx = 2;
      if (tokens[idx] && /^of$/i.test(tokens[idx])) idx++;
      var mi = -1;
      if (tokens[idx]) {
        mi = monthIndexByName(tokens[idx]);
        if (mi === -1 && /^\d+$/.test(tokens[idx])) {
          var n = parseInt(tokens[idx], 10) | 0;
          if (n >= 1 && n <= cal.months.length) mi = n - 1;
        }
      }
      if (mi === -1) return;
      mHuman = mi + 1;
      daySpec = (String(tokens[0]) + " " + String(tokens[1])).toLowerCase().trim();
      used = 2;
      if (tokens[used] && /^of$/i.test(tokens[used])) used++;
      used++;
      if (tokens[used] && /^\d{1,6}$/.test(tokens[used])) used++;
    })();
    if (daySpec == null) {
      var mi2 = monthIndexByName(tokens[0]);
      if (mi2 !== -1 && tokens[1]) {
        var dTok = String(tokens[1]).toLowerCase().trim();
        if (/^\d+-\d+$/.test(dTok)) {
          mHuman = mi2 + 1;
          daySpec = dTok;
          used = 2;
        } else {
          var dNum = /^\d+$/.test(dTok) ? parseInt(dTok, 10) | 0 : Parse.ordinalDay(dTok);
          if (dNum != null) {
            mHuman = mi2 + 1;
            daySpec = String(dNum);
            used = 2;
          }
        }
      }
    }
    if (daySpec == null) {
      var pref = Parse.looseMDY(tokens.slice(0, 3));
      if (!pref || pref.kind !== "mdy") {
        return warnGM("Usage: !cal addyearly <Month> <DD|DD-DD|ordinal-day> NAME [#COLOR|color]\n   or: !cal addyearly <first|second|third|fourth|fifth|last> <weekday> [of] <Month> NAME [#COLOR|color]");
      }
      mHuman = pref.mi + 1;
      daySpec = String(pref.day);
      used = pref.year != null ? 3 : 2;
    }
    var pulled = popColorIfPresent(tokens.slice(used), true);
    var color = pulled.color;
    var name = pulled.tokens.join(" ").trim() || "Untitled Event";
    var ok = _addConcreteEvent(mHuman, daySpec, null, name, color);
    if (ok) {
      refreshAndSend();
      warnGM('Added annual event "' + esc(name) + '" on ' + esc(daySpec) + " of month " + mHuman + ".");
    } else {
      warnGM("No event added (duplicate or invalid).");
    }
  }
  function stepDays(n) {
    n = (parseInt(n, 10) || 0) | 0;
    var cal = getCal(), cur = cal.current, wdlen = cal.weekdays.length | 0;
    var startSerial = toSerial(cur.year, cur.month, cur.day_of_the_month);
    var dest = startSerial + n;
    var d = fromSerial(dest);
    cur.day_of_the_week = (cur.day_of_the_week + (n % wdlen + wdlen)) % wdlen;
    cur.year = d.year;
    cur.month = d.mi;
    cur.day_of_the_month = d.day;
    if (ensureSettings().weatherEnabled !== false && getWeatherState().location) weatherEnsureForecast();
    _manifestZoneOnDateChange(startSerial, dest);
    var direction = n >= 0 ? "Forward" : "Back";
    var dateStr = esc(currentDateLabel());
    var stepButtons = mb("\u23EE\uFE0F Back", "retreat 1") + "\xA0" + mb("\u23ED\uFE0F Forward", "advance 1") + "\xA0" + mb("\u{1F4E3} Send", "send") + "\xA0" + nav("\u2754 Help", "root");
    sendToGM(
      "<div><b>Stepped " + direction + "</b> \u2014 " + dateStr + '</div><div style="margin-top:4px;">' + stepButtons + "</div>"
    );
  }
  function setDate(m, d, y) {
    var cal = getCal(), cur = cal.current, oldDOW = cur.day_of_the_week;
    var oldY = cur.year, oldM = cur.month, oldD = cur.day_of_the_month;
    var oldSerial = toSerial(oldY, oldM, oldD);
    var mi = clamp(m, 1, cal.months.length) - 1;
    var di = clamp(d, 1, cal.months[mi].days);
    var yi = int(y, cur.year);
    var delta = toSerial(yi, mi, di) - toSerial(oldY, oldM, oldD);
    cur.month = mi;
    cur.day_of_the_month = di;
    cur.year = yi;
    var wdlen = cal.weekdays.length;
    cur.day_of_the_week = (oldDOW + (delta % wdlen + wdlen)) % wdlen;
    if (ensureSettings().weatherEnabled !== false && getWeatherState().location) weatherEnsureForecast();
    _manifestZoneOnDateChange(oldSerial, toSerial(yi, mi, di));
    sendCurrentDate(null, true);
  }
  function removeEvent(query) {
    var cal = getCal(), events2 = cal.events;
    if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
    if (!events2.length) {
      sendChat(script_name, "/w gm No events to remove.");
      return;
    }
    var toks = String(query || "").trim().split(/\s+/).filter(Boolean);
    var sub = (toks[0] || "").toLowerCase();
    if (sub === "key") {
      var key = _decKey(toks.slice(1).join(" ").trim());
      if (!key) {
        sendChat(script_name, "/w gm Usage: <code>!cal remove key &lt;KEY&gt;</code>");
        return;
      }
      var idx = eventIndexByKey(key);
      if (idx < 0) {
        sendChat(script_name, "/w gm No event found for key: <code>" + esc(key) + "</code>");
        return;
      }
      var removed = events2.splice(idx, 1)[0];
      markSuppressedIfDefault(removed);
      refreshAndSend();
      var rName = eventDisplayName(removed) || removed.name || "(unnamed event)";
      sendChat(script_name, "/w gm Removed: " + esc(rName) + ".");
      return;
    }
    if (sub === "series") {
      var sk = _decKey(toks.slice(1).join(" ").trim());
      if (!sk) {
        sendChat(script_name, "/w gm Usage: <code>!cal remove series &lt;KEY&gt;</code>");
        return;
      }
      var removedCount = 0;
      for (var i = events2.length - 1; i >= 0; i--) {
        if (_eventSeriesKey(events2[i]) !== sk) continue;
        var removedSeries = events2.splice(i, 1)[0];
        markSuppressedIfDefault(removedSeries);
        removedCount++;
      }
      if (!removedCount) {
        sendChat(script_name, "/w gm No event series found for key: <code>" + esc(sk) + "</code>");
        return;
      }
      refreshAndSend();
      sendChat(script_name, "/w gm Removed " + removedCount + " recurring event" + (removedCount === 1 ? "" : "s") + ".");
      return;
    }
    sendChat(script_name, "/w gm Usage: <code>!cal remove [list | key &lt;KEY&gt; | series &lt;KEY&gt; | &lt;name fragment&gt;]</code>");
  }
  function _defaultDetailsForKey(key) {
    var cal = getCal();
    var sysKey = ensureSettings().calendarSystem || CONFIG_DEFAULTS.calendarSystem;
    var parts = String(key || "").split("|");
    var mHuman = parseInt(parts[0], 10) | 0;
    var daySpec = parts[1] || "";
    var nameLower = (parts[3] || "").toLowerCase();
    var lim = Math.max(1, cal.months.length);
    var out = { name: titleCase(nameLower), month: mHuman, day: daySpec, color: null, source: null };
    deepClone(defaults2.events).forEach(function(de) {
      var srcKey = de.source != null ? String(de.source).toLowerCase() : null;
      if (srcKey && !_sourceAllowedForCalendar(srcKey, sysKey)) return;
      var monthsList = String(de.month).toLowerCase() === "all" ? (function() {
        var a = [];
        for (var i = 1; i <= lim; i++) a.push(i);
        return a;
      })() : [clamp(parseInt(de.month, 10) || 1, 1, lim)];
      monthsList.forEach(function(m) {
        var maxD = cal.months[m - 1].days | 0;
        var norm = DaySpec.normalize(de.day, maxD) || String(DaySpec.first(de.day));
        var k = defaultKeyFor(m, norm, de.name);
        if (k === key) {
          out.name = String(de.name || out.name);
          out.color = resolveColor2(de.color) || null;
          out.source = de.source != null ? String(de.source) : null;
        }
      });
    });
    return out;
  }
  function _orderedKeys(obj, preferred) {
    var ks = Object.keys(obj), seen = {}, out = [];
    if (preferred && preferred.length) {
      for (var i = 0; i < preferred.length; i++) {
        var k = preferred[i];
        if (ks.indexOf(k) !== -1 && !seen[k]) {
          out.push(k);
          seen[k] = 1;
        }
      }
    }
    ks.sort().forEach(function(k2) {
      if (!seen[k2]) out.push(k2);
    });
    return out;
  }
  function themeListHtml(readOnly) {
    var cur = ensureSettings().colorTheme;
    var names = _orderedKeys(COLOR_THEMES, THEME_ORDER);
    if (!names.length) return '<div style="opacity:.7;">No themes available.</div>';
    var rows = names.map(function(n) {
      var label = titleCase(n);
      var head = readOnly ? "<b>" + esc(label) + ":</b>" + (n === cur ? ' <span style="opacity:.7">(current)</span>' : "") : button("Set " + label + ":", "theme " + n) + (n === cur ? ' <span style="opacity:.7">(current)</span>' : "");
      var swatches = (COLOR_THEMES[n] || []).slice(0, 12).map(function(c) {
        return '<span title="' + esc(c) + '" style="display:inline-block;width:12px;height:12px;border:1px solid #000;margin-right:2px;background:' + esc(c) + ';"></span>';
      }).join("");
      return '<div style="margin:6px 0;">' + head + "<br>" + swatches + "<br></div>";
    });
    return '<div style="margin:4px 0;"><b>Color Themes</b></div>' + rows.join("");
  }
  function colorsNamedListHtml() {
    var items = Object.keys(NAMED_COLORS);
    if (!items.length) return '<div style="opacity:.7;">No named colors.</div>';
    var rows = items.map(function(k) {
      var c = NAMED_COLORS[k];
      return '<div style="margin:2px 0;">' + swatchHtml(c) + " <code>" + esc(k) + "</code> \u2014 " + esc(c) + "</div>";
    }).join("");
    return '<div style="margin:4px 0;"><b>Named Colors</b></div>' + rows;
  }
  function mb(label, cmd) {
    return button(label, cmd);
  }
  function nav(label, page) {
    return button(label, "help " + page);
  }
  function _menuBox(title, innerHtml) {
    return [
      '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:6px 0;">',
      '<div style="font-weight:bold;margin-bottom:4px;">',
      esc(title),
      "</div>",
      innerHtml,
      "</div>"
    ].join("");
  }
  function gmButtonsHtml() {
    var wrap = STYLES.gmbuttonWrap;
    var st = ensureSettings();
    var row1 = [
      '<div style="' + wrap + '">' + mb("\u23EE Back", "retreat 1") + "</div>",
      '<div style="' + wrap + '">' + mb("\u23ED Forward", "advance 1") + "</div>",
      '<div style="' + wrap + '">' + mb("\u{1F4E3} Send", "send") + "</div>"
    ];
    var row2 = [
      '<div style="' + wrap + '">' + mb("\u{1F4CB} Today", "today") + "</div>"
    ];
    if (st.weatherEnabled !== false) row2.push('<div style="' + wrap + '">' + mb("\u{1F324} Weather", "weather") + "</div>");
    if (st.moonsEnabled !== false) row2.push('<div style="' + wrap + '">' + mb("\u{1F319} Moons", "moon") + "</div>");
    if (st.planesEnabled !== false) row2.push('<div style="' + wrap + '">' + mb("\u{1F300} Planes", "planes") + "</div>");
    var row3 = [
      '<div style="' + wrap + '">' + nav("\u2699 Admin", "root") + "</div>"
    ];
    return row1.join("") + "<br>" + row2.join("") + "<br>" + row3.join("");
  }
  function _activePlanarWeatherShiftLines(serial) {
    var out = [];
    try {
      var eff = getActivePlanarEffects(serial);
      for (var i = 0; i < eff.length; i++) {
        var e = eff[i];
        if (e.plane === "Fernia" && e.phase === "coterminous") out.push("Fernia coterminous: temperature +3");
        if (e.plane === "Fernia" && e.phase === "remote") out.push("Fernia remote: temperature -2");
        if (e.plane === "Risia" && e.phase === "coterminous") out.push("Risia coterminous: temperature -3");
        if (e.plane === "Risia" && e.phase === "remote") out.push("Risia remote: temperature +2");
        if (e.plane === "Syrania" && e.phase === "coterminous") out.push("Syrania coterminous: clear and calm (precipitation 0, wind 0)");
        if (e.plane === "Syrania" && e.phase === "remote") out.push("Syrania remote: precipitation +1");
        if (e.plane === "Mabar" && e.phase === "coterminous") out.push("Mabar coterminous: temperature -1");
        if (e.plane === "Irian" && e.phase === "coterminous") out.push("Irian coterminous: temperature +1");
        if (e.plane === "Lamannia" && e.phase === "coterminous") out.push("Lamannia coterminous: precipitation +1");
      }
    } catch (e2) {
    }
    return out;
  }
  function _planarWeatherInfluenceText2(e) {
    if (!e) return null;
    if (e.plane === "Fernia" && e.phase === "coterminous") return "\u{1F525} Fernia coterminous (+3 temp)";
    if (e.plane === "Fernia" && e.phase === "remote") return "\u{1F525} Fernia remote (-2 temp)";
    if (e.plane === "Risia" && e.phase === "coterminous") return "\u2744\uFE0F Risia coterminous (-3 temp)";
    if (e.plane === "Risia" && e.phase === "remote") return "\u2744\uFE0F Risia remote (+2 temp)";
    if (e.plane === "Syrania" && e.phase === "coterminous") return "\u{1F324} Syrania coterminous (clear, calm)";
    if (e.plane === "Syrania" && e.phase === "remote") return "\u{1F327} Syrania remote (+1 precip)";
    if (e.plane === "Mabar" && e.phase === "coterminous") return "\u{1F311} Mabar coterminous (-1 temp)";
    if (e.plane === "Irian" && e.phase === "coterminous") return "\u2728 Irian coterminous (+1 temp)";
    if (e.plane === "Lamannia" && e.phase === "coterminous") return "\u{1F33F} Lamannia coterminous (+1 precip)";
    return null;
  }
  function _weatherInfluenceTexts(rec) {
    var out = [];
    if (!rec) return out;
    var zoneEntries = _activeManifestZonesForSerial(rec.serial);
    for (var zi = 0; zi < zoneEntries.length; zi++) {
      var mzText = _manifestZoneInfluenceText(zoneEntries[zi].def);
      if (mzText) out.push(mzText);
    }
    try {
      var eff = getActivePlanarEffects(rec.serial);
      for (var i = 0; i < eff.length; i++) {
        var pText = _planarWeatherInfluenceText2(eff[i]);
        if (pText) out.push(pText);
      }
    } catch (e2) {
    }
    if (_isZarantyrFull(rec.serial)) out.push("\u{1F319} Zarantyr full (lightning boost)");
    return out;
  }
  function _weatherInfluenceHtml(rec) {
    var lines = _weatherInfluenceTexts(rec);
    if (!lines.length) return "";
    return '<div style="font-size:.76em;opacity:.58;font-style:italic;margin-top:3px;">' + lines.map(esc).join(" \xB7 ") + "</div>";
  }
  function activeEffectsPanelHtml() {
    var st = ensureSettings();
    var today = todaySerial();
    var sections = [];
    if (st.weatherEnabled !== false) {
      var wx = "";
      try {
        var ws = getWeatherState();
        if (!ws.location) {
          wx = '<div style="opacity:.7;">No weather location set.</div>';
        } else {
          weatherEnsureForecast();
          var rec = _weatherRecordForDisplay(_forecastRecord(today));
          if (!rec || !rec.final) {
            wx = '<div style="opacity:.7;">No weather generated for today.</div>';
          } else {
            var loc = rec.location || ws.location || {};
            var locLine = esc(titleCase(loc.climate || "")) + " / " + esc(titleCase(String(loc.geography || "inland").replace(/_/g, " "))) + " / " + esc(titleCase(loc.terrain || "open"));
            var cond = _deriveConditions(
              rec.final,
              loc,
              WEATHER_PRIMARY_PERIOD,
              rec.snowAccumulated,
              _weatherPrimaryFog(rec)
            );
            var narr = _conditionsNarrative(rec.final, cond, WEATHER_PRIMARY_PERIOD);
            wx += '<div style="font-size:.85em;opacity:.75;">' + locLine + "</div>";
            var manifestStatus = _manifestZoneStatusLabel(_activeManifestZoneEntries());
            if (manifestStatus !== "None") {
              wx += '<div style="font-size:.82em;opacity:.68;margin-top:2px;">Manifest zones: ' + esc(manifestStatus) + "</div>";
            }
            wx += '<div style="margin:3px 0;">' + _weatherTraitBadge("temp", rec.final.temp) + "&nbsp;" + _weatherTraitBadge("wind", rec.final.wind) + "&nbsp;" + _weatherTraitBadge("precip", rec.final.precip) + "</div>";
            wx += '<div style="font-size:.85em;opacity:.85;">' + esc(narr) + "</div>";
            wx += _conditionsMechHtml(cond);
            if (st.weatherMechanicsEnabled === false) {
              wx += '<div style="font-size:.8em;opacity:.6;margin-top:3px;">Mechanical weather effects are disabled.</div>';
            }
            var shifts = _activePlanarWeatherShiftLines(today);
            if (shifts.length) {
              wx += '<div style="font-size:.82em;opacity:.85;margin-top:4px;"><b>Planar weather shifts:</b><br>' + shifts.map(esc).join("<br>") + "</div>";
            }
            var geo = String(loc.geography || "inland").toLowerCase();
            if (geo === "coastal" || geo === "island" || geo === "coastal_bluff") {
              try {
                var tidx = getTidalIndex(today);
                wx += '<div style="font-size:.82em;opacity:.8;margin-top:4px;">\u{1F30A} <b>Tides:</b> ' + esc(tidalLabel(tidx)) + " (" + tidx + "/10)</div>";
              } catch (e3) {
              }
            }
          }
        }
      } catch (e4) {
        wx = '<div style="opacity:.7;">Weather data unavailable.</div>';
      }
      sections.push(_menuBox("\u{1F324}\uFE0F Active Weather Effects", wx));
    }
    if (st.planesEnabled !== false) {
      var pl = "";
      try {
        var planes = _getAllPlaneData();
        var ypd = _planarYearDays();
        var rows = [];
        for (var i = 0; i < planes.length; i++) {
          var ps = getPlanarState(planes[i].name, today);
          if (!ps) continue;
          if (ps.phase !== "coterminous" && ps.phase !== "remote") continue;
          var isGenerated = _isGeneratedNote(ps.note);
          if (planes[i].type === "fixed" && !isGenerated) continue;
          if (ps.phaseDuration != null && ps.phaseDuration > ypd && !ps.overridden && !isGenerated) continue;
          var emoji = PLANE_PHASE_EMOJI[ps.phase] || "\u26AA";
          var lbl = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
          var next = ps.daysUntilNextPhase != null && ps.nextPhase ? ' <span style="opacity:.55;font-size:.82em;">(' + esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + " in " + ps.daysUntilNextPhase + "d)</span>" : "";
          var row = '<div style="margin:3px 0;">' + emoji + " <b>" + esc(ps.plane.name) + "</b> \u2014 " + esc(lbl) + next + "</div>";
          var eff = ps.plane.effects && ps.plane.effects[ps.phase] || "";
          if (eff) {
            row += '<div style="font-size:.82em;opacity:.78;margin-left:14px;">' + esc(eff) + "</div>";
          }
          rows.push(row);
        }
        if (!rows.length) {
          pl = '<div style="opacity:.7;">No notable coterminous/remote planar effects are active today.</div>';
        } else {
          pl = rows.join("");
        }
        try {
          var mabar = getPlanarState("Mabar", today);
          if (mabar && mabar.phase === "coterminous") {
            var cc = getCal().current;
            var ls = getLongShadowsMoons(cc.year);
            if (ls.length) {
              var names = [];
              for (var li = 0; li < ls.length; li++) names.push(ls[li].name);
              pl += '<div style="font-size:.82em;margin-top:4px;padding:4px;background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">\u{1F311} <b>Long Shadows:</b> ' + esc(names.join(", ")) + " dark tonight.</div>";
            }
          }
        } catch (e5) {
        }
      } catch (e6) {
        pl = '<div style="opacity:.7;">Planar data unavailable.</div>';
      }
      sections.push(_menuBox("\u{1F300} Active Planar Effects", pl));
    }
    if (!sections.length) {
      sections.push('<div style="opacity:.7;">No active effect systems are enabled.</div>');
    }
    return _menuBox(
      "\u2728 Active Effects \u2014 " + esc(currentDateLabel()),
      sections.join("") + '<div style="margin-top:7px;">' + button("\u2B05\uFE0F Back", "help root") + "</div>"
    );
  }
  function helpStatusSummaryHtml() {
    var st = ensureSettings();
    var curDate = esc(currentDateLabel());
    var sys = CALENDAR_SYSTEMS[st.calendarSystem] || {};
    var variant = sys.variants && sys.variants[st.calendarVariant] || {};
    var sysLabel = esc(sys.label || titleCase(st.calendarSystem || ""));
    var varLabel = esc(variant.label || titleCase(st.calendarVariant || ""));
    var varCount = sys.variants ? Object.keys(sys.variants).length : 1;
    var calLine = varCount > 1 ? sysLabel + " &mdash; " + varLabel : sysLabel;
    var overrides = [];
    var defTheme = variant.colorTheme || "";
    var curTheme = st.colorTheme || "";
    if (curTheme && curTheme !== defTheme) overrides.push(esc(titleCase(curTheme)) + " theme");
    var defSeason = sys.defaultSeason || CONFIG_DEFAULTS.seasonVariant;
    if (st.seasonVariant && st.seasonVariant !== defSeason) overrides.push(esc(titleCase(st.seasonVariant)) + " seasons");
    var configLine = overrides.length ? overrides.join(" &nbsp;\xB7&nbsp; ") : "";
    return _menuBox(
      "Status",
      '<div style="font-size:1.1em;font-weight:bold;">' + curDate + '</div><div style="font-size:.85em;opacity:.8;margin-top:2px;">' + calLine + "</div>" + (configLine ? '<div style="font-size:.75em;opacity:.6;margin-top:2px;">' + configLine + "</div>" : "")
    );
  }
  function helpRootMenu(m) {
    var rows = [];
    rows.push(helpStatusSummaryHtml());
    rows.push(_menuBox(
      "Display",
      '<div style="font-size:.8em;opacity:.7;margin-bottom:2px;">Quick snapshot:</div>' + mbP(m, "Now", "now") + '<br><div style="font-size:.8em;opacity:.7;margin-bottom:2px;">Month \u2014 show self:</div>' + mbP(m, "\u25C0 Prev", "show previous month") + " " + mbP(m, "Current", "show month") + " " + mbP(m, "Next \u25B6", "show next month") + '<br><div style="font-size:.8em;opacity:.7;margin-top:4px;margin-bottom:2px;">Month \u2014 send to chat:</div>' + mbP(m, "\u25C0 Prev", "send previous month") + " " + mbP(m, "Current", "send month") + " " + mbP(m, "Next \u25B6", "send next month") + '<br><div style="font-size:.8em;opacity:.7;margin-top:4px;margin-bottom:2px;">Year \u2014 show self:</div>' + mbP(m, "\u25C0 Prev", "show previous year") + " " + mbP(m, "Current", "show year") + " " + mbP(m, "Next \u25B6", "show next year") + '<br><div style="font-size:.8em;opacity:.7;margin-top:4px;margin-bottom:2px;">Year \u2014 send to chat:</div>' + mbP(m, "\u25C0 Prev", "send previous year") + " " + mbP(m, "Current", "send year") + " " + mbP(m, "Next \u25B6", "send next year")
    ));
    if (playerIsGM(m.playerid)) {
      rows.push(_menuBox(
        "Events",
        mbP(m, "List All", "list") + " " + mbP(m, "Remove List", "remove list") + " " + mbP(m, "Restore List", "restore list") + " " + mbP(m, "Source List", "source list") + " " + navP(m, "Colors", "eventcolors") + '<br><div style="font-size:.8em;opacity:.7;margin-top:5px;">Add: <code>!cal add [MM DD [YYYY] | MonthName DD | DD] NAME [#COLOR]</code></div><div style="font-size:.8em;opacity:.7;">Enable/disable source: <code>!cal source enable &lt;name&gt;</code></div>'
      ));
      rows.push(_menuBox(
        "Appearance",
        navP(m, "Calendar System", "calendar") + "<br>" + navP(m, "Color Theme", "themes") + "<br>" + navP(m, "Season Variant", "seasons")
      ));
      var st = ensureSettings();
      var grpBtn = mbP(
        m,
        "Group by Source: " + (st.groupEventsBySource ? "On \u2713" : "Off"),
        "settings group " + (st.groupEventsBySource ? "off" : "on")
      );
      var lblBtn = mbP(
        m,
        "Source Labels: " + (st.showSourceLabels ? "On \u2713" : "Off"),
        "settings labels " + (st.showSourceLabels ? "off" : "on")
      );
      var evBtn = mbP(
        m,
        "\u{1F4C5} Events: " + (st.eventsEnabled ? "On \u2713" : "Off"),
        "settings events " + (st.eventsEnabled ? "off" : "on")
      );
      var moonBtn = mbP(
        m,
        "\u{1F319} Moons: " + (st.moonsEnabled ? "On \u2713" : "Off"),
        "settings moons " + (st.moonsEnabled ? "off" : "on")
      );
      var wxBtn = mbP(
        m,
        "\u{1F324}\uFE0F Weather: " + (st.weatherEnabled ? "On \u2713" : "Off"),
        "settings weather " + (st.weatherEnabled ? "off" : "on")
      );
      var wxMechBtn = mbP(
        m,
        "Weather Mech: " + (st.weatherMechanicsEnabled !== false ? "On \u2713" : "Off"),
        "settings weathermechanics " + (st.weatherMechanicsEnabled !== false ? "off" : "on")
      );
      var plBtn = mbP(
        m,
        "\u{1F300} Planes: " + (st.planesEnabled ? "On \u2713" : "Off"),
        "settings planes " + (st.planesEnabled ? "off" : "on")
      );
      var offCycBtn = mbP(
        m,
        "\u25C7 Off-Cycle: " + (st.offCyclePlanes !== false ? "On \u2713" : "Off"),
        "settings offcycle " + (st.offCyclePlanes !== false ? "off" : "on")
      );
      var denBtn = mbP(
        m,
        "Density: " + (_uiDensityValue(st.uiDensity) === "compact" ? "Compact \u2713" : "Normal"),
        "settings density " + (_uiDensityValue(st.uiDensity) === "compact" ? "normal" : "compact")
      );
      var moonMode = _normalizeDisplayMode(st.moonDisplayMode);
      var wxMode = _normalizeDisplayMode(st.weatherDisplayMode);
      var plMode = _normalizeDisplayMode(st.planesDisplayMode);
      var moonViewBtn = mbP(
        m,
        "Moon View: " + _displayModeLabel(moonMode),
        "settings mode moon " + _nextDisplayMode(moonMode)
      );
      var wxViewBtn = mbP(
        m,
        "Weather View: " + _displayModeLabel(wxMode),
        "settings mode weather " + _nextDisplayMode(wxMode)
      );
      var plViewBtn = mbP(
        m,
        "Planes View: " + _displayModeLabel(plMode),
        "settings mode planes " + _nextDisplayMode(plMode)
      );
      var wxDays = _weatherViewDays(st.weatherForecastViewDays);
      var wxSpanBtn = mbP(
        m,
        "Forecast Span: " + wxDays + "d",
        "settings weatherdays " + (wxDays === 20 ? 10 : 20)
      );
      var verbNow = _subsystemVerbosityValue();
      var verbBtn = mbP(
        m,
        "Detail: " + (verbNow === "minimal" ? "Minimal \u2713" : "Normal"),
        "settings verbosity " + (verbNow === "minimal" ? "normal" : "minimal")
      );
      var autoBtn = mbP(
        m,
        "Auto Buttons: " + (st.autoButtons ? "On \u2713" : "Off"),
        "settings buttons " + (st.autoButtons ? "off" : "on")
      );
      rows.push(_menuBox(
        "Settings",
        grpBtn + " " + lblBtn + " " + evBtn + " " + moonBtn + " " + wxBtn + " " + wxMechBtn + " " + plBtn + " " + offCycBtn + " " + denBtn + " " + autoBtn + " " + moonViewBtn + " " + wxViewBtn + " " + plViewBtn + " " + wxSpanBtn + " " + verbBtn + '<div style="font-size:.8em;opacity:.6;margin-top:5px;">Reset everything: <code>!cal resetcalendar</code></div>'
      ));
      var featureLinks = [];
      featureLinks.push(mbP(m, "\u2728 Active Effects", "effects"));
      if (st.moonsEnabled !== false) featureLinks.push(mbP(m, "\u{1F319} Moons", "moon"));
      if (st.weatherEnabled !== false) featureLinks.push(mbP(m, "\u{1F324}\uFE0F Weather", "weather"));
      if (st.planesEnabled !== false) featureLinks.push(mbP(m, "\u{1F300} Planes", "planes"));
      if (featureLinks.length) {
        rows.push(_menuBox(
          "Systems",
          featureLinks.join(" ") + '<div style="font-size:.75em;opacity:.55;margin-top:5px;">Moon query: <code>!cal moon on &lt;dateSpec&gt;</code><br>Plane query: <code>!cal planes on &lt;dateSpec&gt;</code></div>'
        ));
      }
    }
    if (!playerIsGM(m.playerid)) {
      var st2 = ensureSettings();
      var pLinks = [];
      pLinks.push(mbP(m, "\u{1F4CB} Today", "today"));
      if (st2.moonsEnabled !== false) pLinks.push(mbP(m, "\u{1F319} Moons", "moon"));
      if (st2.weatherEnabled !== false) pLinks.push(mbP(m, "\u{1F324}\uFE0F Weather", "weather") + " " + mbP(m, "\u{1F4CB} Forecast", "forecast"));
      if (st2.planesEnabled !== false) pLinks.push(mbP(m, "\u{1F300} Planes", "planes"));
      if (pLinks.length) {
        rows.push(_menuBox(
          "Systems",
          pLinks.join(" ") + '<div style="font-size:.75em;opacity:.55;margin-top:5px;">Moon query: <code>!cal moon on &lt;dateSpec&gt;</code><br>Plane query: <code>!cal planes on &lt;dateSpec&gt;</code></div>'
        ));
      }
    }
    whisper(m.who, rows.join(""));
  }
  function helpThemesMenu(m) {
    var ro = !playerIsGM(m.playerid);
    whisper(m.who, _menuBox(ro ? "Appearance \u2014 Themes (view only)" : "Appearance \u2014 Themes", themeListHtml(ro)) + '<div style="margin-top:8px;">' + navP(m, "\u2B05 Back", "root") + "</div>");
  }
  function helpCalendarSystemMenu(m) {
    var ro = !playerIsGM(m.playerid);
    whisper(
      m.who,
      _menuBox(ro ? "Calendar Systems (view only)" : "Calendar Systems", calendarSystemListHtml(ro)) + '<div style="margin-top:8px;">' + navP(m, "\u2B05 Back", "root") + "</div>"
    );
  }
  function helpEventColorsMenu(m) {
    var intro = [
      '<div style="opacity:.85;margin-bottom:6px;">',
      "These are the available <b>named colors for events</b>. ",
      "Any hex (<code>#RRGGBB</code>) is supported, but these names can be used directly. ",
      "Example: <code>!cal add March 14 Feast emerald</code> or ",
      "<code>!cal add 3 14 Feast #50C878</code>.",
      "</div>"
    ].join("");
    whisper(
      m.who,
      _menuBox("Event Colors", intro + colorsNamedListHtml()) + '<div style="margin-top:8px;">' + navP(m, "\u2B05 Back", "root") + "</div>"
    );
  }
  function helpSeasonsMenu(m) {
    var ro = !playerIsGM(m.playerid);
    whisper(
      m.who,
      _menuBox(ro ? "Season Variants (view only)" : "Season Variants", seasonSetListHtml(ro)) + '<div style="margin-top:8px;">' + navP(m, "\u2B05 Back", "root") + "</div>"
    );
  }
  function seasonSetListHtml(readOnly) {
    var st = ensureSettings();
    var cur = st.seasonVariant || (CALENDAR_SYSTEMS[st.calendarSystem] || {}).defaultSeason || CONFIG_DEFAULTS.seasonVariant;
    var names = _orderedKeys(SEASON_SETS, ["eberron", "faerun", "gregorian", "tropical"]);
    if (!names.length) return '<div style="opacity:.7;">No season sets.</div>';
    var rows = names.map(function(n) {
      var label = titleCase(n);
      var head = readOnly ? "<b>" + esc(label) + ":</b>" + (n === cur ? ' <span style="opacity:.7">(current)</span>' : "") : button("Set " + label + ":", "seasons " + n) + (n === cur ? ' <span style="opacity:.7">(current)</span>' : "");
      var preview = (_seasonNames(n) || []).map(esc).join(", ");
      return '<div style="margin:6px 0;">' + head + '<br><div style="opacity:.85;">' + preview + "</div><br></div>";
    });
    return '<div style="margin:4px 0;"><b>Season Sets</b></div>' + rows.join("");
  }
  function calendarSystemListHtml(readOnly) {
    var st = ensureSettings();
    var keys = _orderedKeys(CALENDAR_SYSTEMS, CALENDAR_SYSTEM_ORDER);
    if (!keys.length) return '<div style="opacity:.7;">No calendar systems defined.</div>';
    var rows = keys.map(function(sysKey) {
      var sys = CALENDAR_SYSTEMS[sysKey];
      var sLabel = esc(sys.label || titleCase(sysKey));
      var desc = sys.description ? '<div style="font-size:.82em;opacity:.65;margin-bottom:4px;">' + esc(sys.description) + "</div>" : "";
      var varKeys = sys.variants ? Object.keys(sys.variants) : [];
      var varRows = varKeys.map(function(vk) {
        var v = sys.variants[vk];
        var vLabel = esc(v.label || titleCase(vk));
        var isCur = st.calendarSystem === sysKey && st.calendarVariant === vk;
        var head = readOnly ? "<b>" + vLabel + "</b>" + (isCur ? ' <span style="opacity:.7">(current)</span>' : "") : button(vLabel, "calendar " + sysKey + " " + vk) + (isCur ? ' <span style="opacity:.7">(current)</span>' : "");
        var preview = (v.monthNames || []).slice(0, 4).map(esc).join(", ") + (v.monthNames && v.monthNames.length > 4 ? " \u2026" : "");
        return '<div style="margin:3px 0 3px 8px;">' + head + '<br><div style="font-size:.82em;opacity:.7;">' + preview + "</div></div>";
      });
      return '<div style="margin:8px 0;"><div style="font-weight:bold;margin-bottom:2px;">' + sLabel + "</div>" + desc + varRows.join("") + "</div>";
    });
    return '<div style="margin:4px 0;"><b>Calendar Systems</b></div>' + rows.join('<hr style="border:none;border-top:1px solid #444;margin:4px 0;">');
  }

  // src/rendering.ts
  function clamp(n, min, max) {
    n = parseInt(n, 10);
    if (!isFinite(n)) n = min;
    return n < min ? min : n > max ? max : n;
  }
  function int(v, fallback) {
    var n = parseInt(v, 10);
    return isFinite(n) ? n : fallback;
  }
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function swatchHtml(colLike) {
    var col = resolveColor2(colLike) || "#888888";
    return '<span style="display:inline-block;width:10px;height:10px;vertical-align:baseline;margin-right:4px;border:1px solid #000;background:' + esc(col) + ';" title="' + esc(col) + '"></span>';
  }
  function _buttonHasEmojiStart(s) {
    s = String(s || "");
    return !!s && s.charCodeAt(0) > 127;
  }
  function _buttonIcon(lbl) {
    var t = String(lbl || "").toLowerCase();
    if (/\b(show|view)\b/.test(t)) return "\u{1F4C5}";
    if (/\b(send)\b/.test(t)) return "\u{1F4E3}";
    if (/\b(advance)\b/.test(t)) return "\u23ED\uFE0F";
    if (/\b(retreat)\b/.test(t)) return "\u23EE\uFE0F";
    if (/\b(list)\b/.test(t)) return "\u{1F4CB}";
    if (/\b(add|create)\b/.test(t)) return "\u2795";
    if (/\b(remove|delete)\b/.test(t)) return "\u{1F5D1}\uFE0F";
    if (/\b(restore|enable)\b/.test(t)) return "\u21A9\uFE0F";
    if (/\b(apply|theme|colors?)\b/.test(t)) return "\u{1F3A8}";
    if (/\b(help|menu)\b/.test(t)) return "\u2754";
    if (/\b(back)\b/.test(t)) return "\u2B05\uFE0F";
    return "";
  }
  function button(label, cmd, opts) {
    opts = opts || {};
    var lbl = String(label || "").trim();
    var icon = opts.icon != null ? String(opts.icon) : _buttonHasEmojiStart(lbl) ? "" : _buttonIcon(lbl);
    var text = (icon ? icon + " " : "") + lbl;
    return "[" + esc(text) + "](!cal " + cmd + ")";
  }
  function _firstTok(s) {
    return String(s || "").trim().split(/\s+/)[0].toLowerCase();
  }
  function _canRunTop(playerid, tok) {
    var cfg = commands[tok];
    if (!cfg) return true;
    return !cfg.gm || playerIsGM(playerid);
  }
  function canRunCommand(playerid, cmdStr) {
    return _canRunTop(playerid, _firstTok(cmdStr));
  }
  function mbP(m, label, cmd, opts) {
    return canRunCommand(m.playerid, cmd) ? button(label, cmd, opts) : "";
  }
  function navP(m, label, page, opts) {
    return button(label, "help " + page, opts);
  }
  function weekdayAbbr(name) {
    var st = ensureSettings();
    var sys = CALENDAR_SYSTEMS[st.calendarSystem];
    var map = sys && sys.weekdayAbbr || {};
    if (map[name] != null) return map[name];
    var s = String(name || "").trim();
    return s.length <= 3 ? s : s.slice(0, 3);
  }
  function weekdayHeaderLabels(useAbbr) {
    var cal = getCal();
    return cal.weekdays.map(function(n) {
      return useAbbr ? weekdayAbbr(n) : n;
    });
  }
  function openMonthTable(mi, yearLabel, abbrHeaders) {
    var cal = getCal(), cur = cal.current, mObj = cal.months[mi];
    var monthColor = colorForMonth(mi);
    var monthHeaderStyle = colorsAPI.styleMonthHeader(monthColor);
    var useAbbr = abbrHeaders !== false;
    var wd = useAbbr ? weekdayHeaderLabels(true) : cal.weekdays;
    var head = [
      '<table style="' + STYLES.table + '">',
      '<tr><th colspan="' + wd.length + '" style="' + STYLES.head + '">',
      '<div style="' + STYLES.monthHeaderBase + monthHeaderStyle + '">',
      esc(mObj.name),
      '<span style="float:right;">' + esc(String(yearLabel != null ? yearLabel : cur.year)) + " " + LABELS.era + "</span>",
      "</div>",
      "</th></tr>",
      "<tr>" + wd.map(function(d) {
        return '<th style="' + STYLES.th + '">' + esc(d) + "</th>";
      }).join("") + "</tr>"
    ].join("");
    return { html: head, monthColor };
  }
  function closeMonthTable() {
    return "</table>";
  }
  function makeDayCtx(y, mi, d, dimActive, extraEventsFn, includeCalendarEvents) {
    var ser = toSerial(y, mi, d);
    var tSer = todaySerial();
    var baseEvents = includeCalendarEvents === false ? [] : getEventsFor(mi, d, y);
    var extraEvents = [];
    if (typeof extraEventsFn === "function") {
      var add = extraEventsFn(ser);
      if (Array.isArray(add)) extraEvents = add;
    }
    var events2 = sortEventsByPriority((baseEvents || []).concat(extraEvents || []));
    var label = events2.length ? events2.map(eventDisplayName).filter(Boolean).join("\n") : "";
    return {
      y,
      mi,
      d,
      serial: ser,
      isToday: ser === tSer,
      isPast: !!dimActive && ser < tSer,
      isFuture: !!dimActive && ser > tSer,
      events: events2,
      title: label
    };
  }
  function styleForDayCell(baseStyle, events2, isToday, monthColor, isPast, isFuture) {
    var style = baseStyle;
    if (events2.length >= 1) {
      style = applyBg(style, getEventColor(events2[0]), CONTRAST_MIN_CELL);
    } else if (isToday) {
      style = applyBg(style, monthColor, CONTRAST_MIN_CELL);
    }
    if (isPast) style += STYLES.past;
    if (isFuture) style += STYLES.future;
    if (isToday) style += STYLES.today;
    return style;
  }
  function _calendarCellInnerHtml(content, extraStyle) {
    return '<div style="' + STYLES.calCellInner + (extraStyle || "") + '">' + content + "</div>";
  }
  function tdHtmlForDay(ctx, monthColor, baseStyle, numeralStyle) {
    var style = styleForDayCell(baseStyle, ctx.events, ctx.isToday, monthColor, ctx.isPast, ctx.isFuture);
    var titleAttr = ctx.title ? ' title="' + esc(ctx.title) + '" aria-label="' + esc(ctx.title) + '"' : "";
    var numWrap = "<div" + (numeralStyle ? ' style="' + numeralStyle + '"' : "") + ">" + ctx.d + "</div>";
    var dots = _eventDotsHtml(ctx.events);
    return "<td" + titleAttr + ' style="' + style + '">' + _calendarCellInnerHtml(numWrap + dots) + "</td>";
  }
  function _renderHarptosFestivalStrip(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, edgeMode) {
    var ser = toSerial(y, mi, 1);
    var tSer = todaySerial();
    var baseEvents = includeCalendarEvents === false ? [] : getEventsFor(mi, 1, y);
    var extraEvents = [];
    if (typeof extraEventsFn === "function") {
      var add = extraEventsFn(ser);
      if (Array.isArray(add)) extraEvents = add;
    }
    var events2 = sortEventsByPriority((baseEvents || []).concat(extraEvents || []));
    var title = events2.length ? events2.map(eventDisplayName).filter(Boolean).join("\n") : String(mobj.name || "");
    var ctx = {
      y,
      mi,
      d: 1,
      serial: ser,
      isToday: ser === tSer,
      isPast: !!dimActive && ser < tSer,
      isFuture: !!dimActive && ser > tSer,
      events: events2,
      title
    };
    var wdCnt = weekLength() | 0;
    var mColor = colorForMonth(mi);
    var hdrStyle = colorsAPI.styleMonthHeader(mColor);
    var festivalStyle = styleForDayCell(STYLES.calTd, ctx.events, ctx.isToday, mColor, ctx.isPast, ctx.isFuture);
    festivalStyle += "font-style:italic;";
    var fillerStyle = STYLES.calTd + "opacity:.28;background-color:" + mColor + ";";
    var sep = "border-left:3px double rgba(0,0,0,.25);";
    if (edgeMode === "prev") sep = "border-right:3px double rgba(0,0,0,.25);";
    fillerStyle += sep;
    var titleAttr = title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : "";
    var dots = _eventDotsHtml(ctx.events);
    var festivalCell = "<td" + titleAttr + ' style="' + festivalStyle + '">' + _calendarCellInnerHtml('<div style="font-size:.9em;line-height:1.2;">' + esc(mobj.name) + "</div>" + dots) + "</td>";
    var fillerCell = '<td colspan="' + Math.max(1, wdCnt - 1) + '" style="' + fillerStyle + '">' + _calendarCellInnerHtml("&nbsp;") + "</td>";
    var rowHtml = edgeMode === "prev" ? "<tr>" + fillerCell + festivalCell + "</tr>" : "<tr>" + festivalCell + fillerCell + "</tr>";
    return [
      '<table style="' + STYLES.table + '">',
      '<tr><th colspan="' + wdCnt + '" style="' + STYLES.head + '">',
      '<div style="' + STYLES.monthHeaderBase + hdrStyle + '">',
      esc(mobj.name),
      '<span style="float:right;">' + esc(String(y)) + " " + LABELS.era + "</span>",
      mobj.leapEvery ? ' <span style="font-size:.75em;opacity:.75;">(every ' + mobj.leapEvery + " yrs)</span>" : "",
      "</div>",
      "</th></tr>",
      rowHtml,
      "</table>"
    ].join("");
  }
  function renderIntercalaryBanner(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents) {
    if (ensureSettings().calendarSystem === "faerunian") {
      return _renderHarptosFestivalStrip(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, "full");
    }
    var ser = toSerial(y, mi, 1);
    var tSer = todaySerial();
    var baseEvents = includeCalendarEvents === false ? [] : getEventsFor(mi, 1, y);
    var extraEvents = [];
    if (typeof extraEventsFn === "function") {
      var add = extraEventsFn(ser);
      if (Array.isArray(add)) extraEvents = add;
    }
    var events2 = sortEventsByPriority((baseEvents || []).concat(extraEvents || []));
    var title = events2.length ? events2.map(eventDisplayName).filter(Boolean).join("\n") : "";
    var ctx = {
      y,
      mi,
      d: 1,
      serial: ser,
      isToday: ser === tSer,
      isPast: !!dimActive && ser < tSer,
      isFuture: !!dimActive && ser > tSer,
      events: events2,
      title
    };
    var mColor = colorForMonth(mi);
    var hdrStyle = colorsAPI.styleMonthHeader(mColor);
    var cellStyle = styleForDayCell(STYLES.calTd, ctx.events, ctx.isToday, mColor, ctx.isPast, ctx.isFuture);
    cellStyle += "text-align:center;font-style:italic;";
    var titleAttr = title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : "";
    var dots = _eventDotsHtml(ctx.events);
    var wdCnt = weekLength() | 0;
    var isGregorianLeapDay = ensureSettings().calendarSystem === "gregorian" && String(mobj.name || "") === "Leap Day";
    var headerName = isGregorianLeapDay ? "February 29" : mobj.name;
    return [
      '<table style="' + STYLES.table + '">',
      '<tr><th colspan="' + wdCnt + '" style="' + STYLES.head + '">',
      '<div style="' + STYLES.monthHeaderBase + hdrStyle + '">',
      esc(headerName),
      mobj.leapEvery && !isGregorianLeapDay ? ' <span style="font-size:.75em;opacity:.75;">(every ' + mobj.leapEvery + " yrs)</span>" : "",
      "</div>",
      "</th></tr>",
      "<tr" + titleAttr + '><td colspan="' + wdCnt + '" style="' + cellStyle + '">',
      _calendarCellInnerHtml('<div style="font-size:.9em;line-height:1.5;">' + esc(headerName) + "</div>" + dots),
      "</td></tr>",
      "</table>"
    ].join("");
  }
  function renderMonthTable(opts) {
    var cal = getCal(), cur = cal.current;
    var y = opts && typeof opts.year === "number" ? opts.year | 0 : cur.year;
    var mi = opts && typeof opts.mi === "number" ? opts.mi | 0 : cur.month;
    var mode = opts && opts.mode || "full";
    var dimActive = !!(opts && opts.dimPast);
    var extraEventsFn = opts && typeof opts.extraEventsFn === "function" ? opts.extraEventsFn : null;
    var includeCalendarEvents = !(opts && opts.includeCalendarEvents === false);
    var mobj = cal.months[mi];
    if (_isGregorianLeapSlotMonthObj(mobj)) return "";
    if (mobj.leapEvery && !_isLeapMonth(mobj, y)) return "";
    if (mobj.isIntercalary) return renderIntercalaryBanner(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents);
    var mdays = mobj.days | 0;
    var febLeapSlot = null;
    var showGregorianFeb29 = false;
    if (ensureSettings().calendarSystem === "gregorian" && !mobj.isIntercalary && String(mobj.name || "") === "February") {
      for (var gmi = 0; gmi < cal.months.length; gmi++) {
        if (_isGregorianLeapSlotMonthObj(cal.months[gmi])) {
          febLeapSlot = gmi;
          break;
        }
      }
      if (febLeapSlot != null && _isLeapMonth(cal.months[febLeapSlot], y)) {
        showGregorianFeb29 = true;
        mdays = mdays + 1;
      }
    }
    var parts = openMonthTable(mi, y, !(opts && opts.abbrHeaders === false));
    var html = [parts.html];
    var wdCnt = weekLength() | 0;
    if (mode === "full") {
      var gridStart = weekStartSerial(y, mi, 1);
      var lastRowStart = weekStartSerial(y, mi, mdays);
      for (var rowStart = gridStart; rowStart <= lastRowStart; rowStart += wdCnt) {
        html.push("<tr>");
        for (var c = 0; c < wdCnt; c++) {
          var s = rowStart + c;
          var d = fromSerial(s);
          if (d.year === y && d.mi === mi) {
            var ctx = makeDayCtx(y, mi, d.day, dimActive, extraEventsFn, includeCalendarEvents);
            html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.calTd, ""));
          } else if (showGregorianFeb29 && d.year === y && d.mi === febLeapSlot && d.day === 1) {
            var leapSer = s;
            var leapBaseEvents = includeCalendarEvents === false ? [] : getEventsFor(febLeapSlot, 1, y);
            var leapExtraEvents = [];
            if (typeof extraEventsFn === "function") {
              var leapAdd = extraEventsFn(leapSer);
              if (Array.isArray(leapAdd)) leapExtraEvents = leapAdd;
            }
            var leapEvents = sortEventsByPriority((leapBaseEvents || []).concat(leapExtraEvents || []));
            var leapTitle = leapEvents.length ? leapEvents.map(eventDisplayName).filter(Boolean).join("\n") : "";
            var leapCtx = {
              y,
              mi,
              d: 29,
              serial: leapSer,
              isToday: leapSer === todaySerial(),
              isPast: !!dimActive && leapSer < todaySerial(),
              isFuture: !!dimActive && leapSer > todaySerial(),
              events: leapEvents,
              title: leapTitle
            };
            html.push(tdHtmlForDay(leapCtx, parts.monthColor, STYLES.calTd, ""));
          } else {
            var ovColor = colorForMonth(d.mi);
            var ovStyle = STYLES.calTd + "background-color:" + ovColor + ";opacity:.22;";
            html.push('<td style="' + ovStyle + '">' + _calendarCellInnerHtml('<div style="opacity:.55;">' + d.day + "</div>") + "</td>");
          }
        }
        html.push("</tr>");
      }
      html.push(closeMonthTable());
      return html.join("");
    }
    var startSer = opts && typeof opts.weekStartSerial === "number" ? opts.weekStartSerial | 0 : weekStartSerial(y, mi, 1);
    html.push("<tr>");
    for (var i = 0; i < wdCnt; i++) {
      var s2 = startSer + i;
      var d2 = fromSerial(s2);
      if (showGregorianFeb29 && d2.year === y && d2.mi === febLeapSlot && d2.day === 1) {
        var leapSer2 = s2;
        var leapBaseEvents2 = includeCalendarEvents === false ? [] : getEventsFor(febLeapSlot, 1, y);
        var leapExtraEvents2 = [];
        if (typeof extraEventsFn === "function") {
          var leapAdd2 = extraEventsFn(leapSer2);
          if (Array.isArray(leapAdd2)) leapExtraEvents2 = leapAdd2;
        }
        var leapEvents2 = sortEventsByPriority((leapBaseEvents2 || []).concat(leapExtraEvents2 || []));
        var leapTitle2 = leapEvents2.length ? leapEvents2.map(eventDisplayName).filter(Boolean).join("\n") : "";
        var leapCtx2 = {
          y,
          mi,
          d: 29,
          serial: leapSer2,
          isToday: leapSer2 === todaySerial(),
          isPast: !!dimActive && leapSer2 < todaySerial(),
          isFuture: !!dimActive && leapSer2 > todaySerial(),
          events: leapEvents2,
          title: leapTitle2
        };
        html.push(tdHtmlForDay(leapCtx2, parts.monthColor, STYLES.calTd, ""));
      } else {
        var ctx2 = makeDayCtx(d2.year, d2.mi, d2.day, dimActive, extraEventsFn, includeCalendarEvents);
        var numeralStyle = d2.mi === mi ? "" : "opacity:.5;";
        html.push(tdHtmlForDay(ctx2, parts.monthColor, STYLES.calTd, numeralStyle));
      }
    }
    html.push("</tr>", closeMonthTable());
    return html.join("");
  }
  function renderMiniCal(mi, yearLabel, dimActive) {
    var y = typeof yearLabel === "number" ? yearLabel : getCal().current.year;
    return renderMonthTable({ year: y, mi, mode: "full", dimPast: !!dimActive });
  }
  function _ordinal(n) {
    n = n | 0;
    var v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (n % 10) {
      case 1:
        return n + "st";
      case 2:
        return n + "nd";
      case 3:
        return n + "rd";
      default:
        return n + "th";
    }
  }
  function yearHTMLFor(targetYear, dimActive) {
    var months = getCal().months;
    var html = ['<div style="text-align:left;">'];
    for (var i = 0; i < months.length; i++) {
      if (months[i].leapEvery && !_isLeapMonth(months[i], targetYear)) continue;
      var rendered = renderMiniCal(i, targetYear, !!dimActive);
      if (rendered) html.push('<div style="' + STYLES.wrap + '">' + rendered + "</div>");
    }
    html.push("</div>");
    return html.join("");
  }
  function formatDateLabel(y, mi, d, includeYear) {
    var cal = getCal();
    var st = ensureSettings();
    var mobj = cal.months[mi] || {};
    var lbl;
    if (st.calendarSystem === "faerunian") {
      lbl = mobj.isIntercalary ? esc(mobj.name) : _ordinal(d) + " of " + esc(mobj.name);
    } else if (st.calendarSystem === "gregorian" && mobj.isIntercalary && String(mobj.name || "") === "Leap Day") {
      lbl = "February 29";
    } else {
      lbl = esc(mobj.name) + " " + d;
    }
    if (includeYear) lbl += ", " + esc(String(y)) + " " + LABELS.era;
    return lbl;
  }
  function monthEventsHtml(mi, today) {
    var cal = getCal(), curYear = cal.current.year;
    function dayKey(e) {
      var ow = Parse.ordinalWeekday.fromSpec(e.day);
      if (ow) {
        if (ow.ord === "every") {
          var first = _firstWeekdayOfMonth(curYear, mi, ow.wdi);
          return first != null ? first : 99;
        }
        var d = dayFromOrdinalWeekday(curYear, mi, ow);
        return d != null ? d : 99;
      }
      return DaySpec.first(e.day);
    }
    var evs = cal.events.filter(function(e) {
      return (+e.month || 1) - 1 === mi && (e.year == null || (e.year | 0) === (curYear | 0));
    }).sort(function(a, b) {
      var da = dayKey(a), db = dayKey(b);
      if (da !== db) return da - db;
      var ay = a.year == null ? 1 : 0, by = b.year == null ? 1 : 0;
      if (ay !== by) return ay - by;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    return evs.map(function(e) {
      var isToday = false;
      var ows = Parse.ordinalWeekday.fromSpec(e.day);
      if (ows) {
        if (ows.ord === "every") {
          isToday = weekdayIndex(curYear, mi, today) === ows.wdi;
        } else {
          isToday = dayFromOrdinalWeekday(curYear, mi, ows) === today;
        }
      } else {
        isToday = DaySpec.matches(e.day)(today);
      }
      var swatch = swatchHtml(getEventColor(e));
      var name = esc(eventDisplayName(e));
      var style = isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"';
      return "<div" + style + ">" + swatch + " " + name + "</div>";
    }).join("");
  }
  function eventLineHtml(y, mi, d, name, includeYear, isToday, color) {
    var dateLbl = formatDateLabel(y, mi, d, includeYear);
    var sw = swatchHtml(color);
    var sty = isToday ? ' style="font-weight:bold;margin:2px 0;"' : ' style="margin:2px 0;"';
    return "<div" + sty + ">" + sw + " " + dateLbl + ": " + esc(name) + "</div>";
  }
  function _buildSyntheticEventsLookup(syntheticEvents, fallbackTitle) {
    var bySerial = {};
    if (!Array.isArray(syntheticEvents)) return bySerial;
    for (var i = 0; i < syntheticEvents.length; i++) {
      var se = syntheticEvents[i];
      if (!se || !isFinite(se.serial)) continue;
      var key = String(se.serial | 0);
      if (!bySerial[key]) bySerial[key] = [];
      bySerial[key].push({
        name: String(se.name || fallbackTitle || "Highlight"),
        color: resolveColor2(se.color) || "#607D8B",
        source: null
      });
    }
    return bySerial;
  }
  function _renderSyntheticMiniCal(title, startSerial, endSerial, syntheticEvents) {
    var bySerial = _buildSyntheticEventsLookup(syntheticEvents, title);
    return buildCalendarsHtmlForSpec({
      title,
      start: startSerial,
      end: endSerial,
      includeCalendarEvents: false,
      extraEventsFn: function(serial) {
        return bySerial[String(serial)] || [];
      }
    });
  }
  function _monthRangeFromSerial(serial) {
    var d = fromSerial(serial | 0);
    var m = getCal().months[d.mi] || {};
    var days = Math.max(1, m.days | 0);
    return {
      start: toSerial(d.year, d.mi, 1),
      end: toSerial(d.year, d.mi, days),
      year: d.year,
      mi: d.mi
    };
  }
  function _stripHtmlTags(s) {
    return String(s || "").replace(/<[^>]*>/g, "").trim();
  }
  function _encKey(k) {
    return encodeURIComponent(String(k));
  }
  function _decKey(k) {
    try {
      return decodeURIComponent(String(k));
    } catch (e) {
      return String(k || "");
    }
  }
  function _eventSeriesKey(e) {
    var y = e.year == null ? "ALL" : String(e.year | 0);
    var day = String(e.day || "").trim().toLowerCase();
    var nm = String(e.name || "").trim().toLowerCase();
    var src = e.source != null ? String(e.source).trim().toLowerCase() : "";
    return y + "|" + day + "|" + nm + "|" + src;
  }
  function _eventRowsForTables(evs) {
    var cal = getCal();
    var monthCount = Math.max(1, cal.months.length);
    var groups = {};
    var order = [];
    (evs || []).forEach(function(e) {
      var sk = _eventSeriesKey(e);
      if (!groups[sk]) {
        groups[sk] = { key: sk, months: {}, entries: [] };
        order.push(sk);
      }
      groups[sk].entries.push(e);
      groups[sk].months[e.month | 0] = 1;
    });
    var rows = [];
    order.forEach(function(sk) {
      var g = groups[sk];
      var months = Object.keys(g.months);
      var collapseAllMonths = g.entries.length > 1 && months.length === monthCount;
      if (collapseAllMonths) {
        var lead = g.entries[0];
        rows.push({
          event: lead,
          mmLabel: "ALL",
          removeCmd: "remove series " + _encKey(sk),
          groupedCount: g.entries.length
        });
        return;
      }
      g.entries.forEach(function(e) {
        rows.push({
          event: e,
          mmLabel: String(e.month | 0),
          removeCmd: "remove key " + _encKey(eventKey(e)),
          groupedCount: 1
        });
      });
    });
    return rows;
  }
  function listAllEventsTableHtml() {
    var cal = getCal(), evs = cal.events || [];
    if (!evs.length) return '<div style="opacity:.7;">No events.</div>';
    var listRows = _eventRowsForTables(evs);
    var rows = listRows.map(function(row, i) {
      var e = row.event;
      var dd = esc(String(e.day));
      var yyyy = e.year == null ? "ALL" : esc(String(e.year));
      var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + "x)</span>" : "");
      var sw = swatchHtml(getEventColor(e));
      return '<tr><td style="' + STYLES.td + ';text-align:right;">#' + (i + 1) + '</td><td style="' + STYLES.td + '">' + sw + name + '</td><td style="' + STYLES.td + ';text-align:center;">' + esc(row.mmLabel) + '</td><td style="' + STYLES.td + ';text-align:center;">' + dd + '</td><td style="' + STYLES.td + ';text-align:center;">' + yyyy + "</td></tr>";
    });
    var head = '<tr><th style="' + STYLES.th + '">Index</th><th style="' + STYLES.th + '">Event</th><th style="' + STYLES.th + '">MM</th><th style="' + STYLES.th + '">DD</th><th style="' + STYLES.th + '">YYYY</th></tr>';
    return '<div style="margin:4px 0;"><b>All Events (meta view)</b></div><table style="' + STYLES.table + '">' + head + rows.join("") + '</table><div style="opacity:.7;margin-top:4px;">Recurring events that span every month are grouped as one row.</div>';
  }
  function removeListHtml() {
    var cal = getCal(), evs = cal.events || [];
    if (!evs.length) return '<div style="opacity:.7;">No events to remove.</div>';
    var listRows = _eventRowsForTables(evs);
    var rows = listRows.map(function(row, i) {
      var e = row.event;
      var dd = esc(String(e.day));
      var yyyy = e.year == null ? "ALL" : esc(String(e.year));
      var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + "x)</span>" : "");
      var sw = swatchHtml(getEventColor(e));
      var rm = button("Remove", row.removeCmd);
      return '<tr><td style="' + STYLES.td + ';text-align:right;">#' + (i + 1) + '</td><td style="' + STYLES.td + '">' + sw + name + '</td><td style="' + STYLES.td + ';text-align:center;">' + esc(row.mmLabel) + '</td><td style="' + STYLES.td + ';text-align:center;">' + dd + '</td><td style="' + STYLES.td + ';text-align:center;">' + yyyy + '</td><td style="' + STYLES.td + ';text-align:center;">' + rm + "</td></tr>";
    });
    var head = '<tr><th style="' + STYLES.th + '">Index</th><th style="' + STYLES.th + '">Event</th><th style="' + STYLES.th + '">MM</th><th style="' + STYLES.th + '">DD</th><th style="' + STYLES.th + '">YYYY</th><th style="' + STYLES.th + '">Action</th></tr>';
    return '<div style="margin:4px 0;"><b>Remove Events</b></div><table style="' + STYLES.table + '">' + head + rows.join("") + '</table><div style="opacity:.7;margin-top:4px;">Recurring events that span every month are grouped into one remove button.</div>';
  }
  function removeMatchesListHtml(needle) {
    var cal = getCal(), evs = cal.events || [];
    var q = String(needle || "").trim().toLowerCase();
    if (!q) return '<div style="opacity:.7;">Provide a name fragment to search.</div>';
    var listRows = _eventRowsForTables(evs).filter(function(row) {
      return String(row.event && row.event.name || "").toLowerCase().indexOf(q) !== -1;
    });
    if (!listRows.length) {
      return '<div style="opacity:.7;">No events matched "' + esc(needle) + '".</div>';
    }
    var head = '<tr><th style="' + STYLES.th + '">Index</th><th style="' + STYLES.th + '">Event</th><th style="' + STYLES.th + '">MM</th><th style="' + STYLES.th + '">DD</th><th style="' + STYLES.th + '">YYYY</th><th style="' + STYLES.th + '">Action</th></tr>';
    var rows = listRows.map(function(row, i) {
      var e = row.event;
      var dd = esc(String(e.day));
      var yyyy = e.year == null ? "ALL" : esc(String(e.year));
      var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + "x)</span>" : "");
      var sw = swatchHtml(getEventColor(e));
      var rm = button("Remove", row.removeCmd);
      return '<tr><td style="' + STYLES.td + ';text-align:right;">#' + (i + 1) + '</td><td style="' + STYLES.td + '">' + sw + name + '</td><td style="' + STYLES.td + ';text-align:center;">' + esc(row.mmLabel) + '</td><td style="' + STYLES.td + ';text-align:center;">' + dd + '</td><td style="' + STYLES.td + ';text-align:center;">' + yyyy + '</td><td style="' + STYLES.td + ';text-align:center;">' + rm + "</td></tr>";
    }).join("");
    return '<div style="margin:4px 0;"><b>Remove Matches for "' + esc(needle) + '"</b></div><table style="' + STYLES.table + '">' + head + rows + '</table><div style="opacity:.7;margin-top:4px;">Recurring all-month events are grouped into one remove button.</div>';
  }
  function suppressedDefaultsListHtml() {
    var sup = state[state_name].suppressedDefaults || {};
    var keys = Object.keys(sup);
    if (!keys.length) {
      return '<div style="opacity:.7;">No suppressed default events.</div>';
    }
    keys.sort(function(a, b) {
      var pa = a.split("|"), pb = b.split("|");
      var ma = +pa[0] || 0, mb3 = +pb[0] || 0;
      if (ma !== mb3) return ma - mb3;
      var da = DaySpec.first(pa[1] || "1"), db = DaySpec.first(pb[1] || "1");
      if (da !== db) return da - db;
      return String(pa[3] || "").localeCompare(String(pb[3] || ""));
    });
    var rows = keys.map(function(k) {
      var info = _defaultDetailsForKey(k);
      var mi = (info.month | 0) - 1, mm = mi + 1;
      var dd = esc(String(info.day));
      var sw = swatchHtml(info.color || autoColorForEvent({ name: info.name }));
      var src = info.source ? ' <span style="opacity:.7">(' + esc(titleCase(info.source)) + ")</span>" : "";
      var restorebutton = button("Restore", "restore key " + _encKey(k));
      return '<tr><td style="' + STYLES.td + '">' + sw + esc(info.name) + src + '</td><td style="' + STYLES.td + ';text-align:center;">' + mm + '</td><td style="' + STYLES.td + ';text-align:center;">' + dd + '</td><td style="' + STYLES.td + ';text-align:center;">ALL</td><td style="' + STYLES.td + ';text-align:center;">' + restorebutton + "</td></tr>";
    });
    var head = '<tr><th style="' + STYLES.th + '">Event</th><th style="' + STYLES.th + '">MM</th><th style="' + STYLES.th + '">DD</th><th style="' + STYLES.th + '">YYYY</th><th style="' + STYLES.th + '">Action</th></tr>';
    return '<div style="margin:4px 0;"><b>Suppressed Default Events</b></div><div style="margin:2px 0;">' + button("Restore All", "restore all") + '</div><table style="' + STYLES.table + '">' + head + rows.join("") + "</table>";
  }
  function restoreDefaultEvents(query) {
    var cal = getCal();
    var sup = state[state_name].suppressedDefaults || (state[state_name].suppressedDefaults = {});
    var q = String(query || "").trim();
    if (!q) {
      sendChat(script_name, "/w gm Usage: <code>!cal restore [all] [exact] &lt;name...&gt; | restore key &lt;KEY&gt; | restore list</code>");
      return;
    }
    var parts = q.split(/\s+/);
    var sub = (parts[0] || "").toLowerCase();
    if (sub === "all") {
      state[state_name].suppressedDefaults = {};
      mergeInNewDefaultEvents(cal);
      refreshAndSend();
      sendChat(script_name, "/w gm Restored all default events (sources left as-is).");
      return;
    }
    if (sub === "key") {
      var key = _decKey(parts.slice(1).join(" ").trim());
      if (!key) {
        sendChat(script_name, "/w gm Usage: <code>!cal restore key &lt;KEY&gt;</code>");
        return;
      }
      delete sup[key];
      mergeInNewDefaultEvents(cal);
      refreshAndSend();
      sendChat(script_name, "/w gm Restored default for key: <code>" + esc(key) + "</code>.");
      return;
    }
    var exact = false;
    if (sub === "exact") {
      exact = true;
      parts.shift();
    }
    var needle = parts.join(" ").trim().toLowerCase();
    if (!needle) {
      sendChat(script_name, "/w gm Usage: <code>!cal restore [exact] &lt;name...&gt;</code>");
      return;
    }
    var keys = Object.keys(sup);
    var restored = 0;
    keys.forEach(function(k) {
      var info = _defaultDetailsForKey(k);
      var nm = String(info.name || "").toLowerCase();
      if (exact && nm === needle || !exact && nm.indexOf(needle) !== -1) {
        delete sup[k];
        restored++;
      }
    });
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, "/w gm Restored " + restored + " default event" + (restored === 1 ? "" : "s") + ' matching "' + esc(needle) + '".');
  }

  // src/parsing.ts
  function _asciiFold(s) {
    var str = String(s || "");
    return typeof str.normalize === "function" ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : str;
  }
  function _normAlpha(s) {
    return _asciiFold(String(s || "").toLowerCase()).replace(/[^a-z]/g, "");
  }
  function monthIndexByName(tok) {
    var cal = getCal();
    if (!tok) return -1;
    var s = _normAlpha(tok);
    var best = -1, bestLen = 0;
    for (var i = 0; i < cal.months.length; i++) {
      var n = _normAlpha(cal.months[i].name);
      if (s === n) return i;
      if (s.length >= 3 && n.indexOf(s) === 0 && s.length > bestLen) {
        best = i;
        bestLen = s.length;
      }
    }
    return best;
  }
  var Parse = (function() {
    "use strict";
    var ORD_MAP_TOK = {
      "1": "first",
      "2": "second",
      "3": "third",
      "4": "fourth",
      "5": "fifth",
      "last": "last",
      "1st": "first",
      "2nd": "second",
      "3rd": "third",
      "4th": "fourth",
      "5th": "fifth",
      "first": "first",
      "second": "second",
      "third": "third",
      "fourth": "fourth",
      "fifth": "fifth"
    };
    var UNITS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9 };
    function _stripTrailPunct(s) {
      return String(s || "").trim().toLowerCase().replace(/[.,;:!?]+$/, "");
    }
    function weekdayIndexByName(tok) {
      var cal = getCal();
      if (tok == null) return -1;
      if (!cal || !Array.isArray(cal.weekdays) || !cal.weekdays.length) return -1;
      var raw = String(tok);
      var s = _normAlpha(raw);
      if (/^\d+$/.test(raw)) {
        var n = parseInt(raw, 10);
        if (n >= 0 && n < cal.weekdays.length) return n;
        if (n >= 1 && n <= cal.weekdays.length) return n - 1;
      }
      for (var i = 0; i < cal.weekdays.length; i++) {
        var w = _normAlpha(cal.weekdays[i]);
        if (s === w || w.indexOf(s) === 0) return i;
      }
      return -1;
    }
    function ordinalDay(tok) {
      if (!tok) return null;
      var s = _stripTrailPunct(tok);
      var m = s.match(/^(\d+)(st|nd|rd|th)$/);
      if (m) return parseInt(m[1], 10);
      var baseWords = {
        first: 1,
        second: 2,
        third: 3,
        fourth: 4,
        fifth: 5,
        sixth: 6,
        seventh: 7,
        eighth: 8,
        ninth: 9,
        tenth: 10,
        eleventh: 11,
        twelfth: 12,
        thirteenth: 13,
        fourteenth: 14,
        fifteenth: 15,
        sixteenth: 16,
        seventeenth: 17,
        eighteenth: 18,
        nineteenth: 19,
        twentieth: 20,
        thirtieth: 30
      };
      if (baseWords[s] != null) return baseWords[s];
      var m2 = s.replace(/[\u2010-\u2015]/g, "-").match(/^(twenty|thirty)(?:[-\s]?)(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)$/);
      if (m2) {
        var tens = m2[1] === "twenty" ? 20 : 30;
        return tens + UNITS[m2[2]];
      }
      return null;
    }
    function ordinalWeekdayFromTokens(tokens) {
      tokens = (tokens || []).map(function(t) {
        return String(t || "");
      }).filter(Boolean);
      if (!tokens.length) return null;
      var ordKey = ORD_MAP_TOK[String(tokens[0]).toLowerCase()];
      if (!ordKey) return null;
      var wdi = weekdayIndexByName(tokens[1] || "");
      if (wdi < 0) return null;
      var rest = tokens.slice(2);
      if (rest[0] && /^of$/i.test(rest[0])) rest.shift();
      var mi = -1, year = null;
      if (rest.length) {
        var maybeMi = monthIndexByName(rest[0]);
        if (maybeMi !== -1) {
          mi = maybeMi;
          rest.shift();
        } else if (/^\d+$/.test(rest[0])) {
          var n = parseInt(rest[0], 10) | 0, lim = getCal().months.length;
          if (n >= 1 && n <= lim) {
            mi = n - 1;
            rest.shift();
          }
        }
      }
      if (rest.length && /^\d{1,6}$/.test(rest[0])) {
        year = parseInt(rest[0], 10);
      }
      return { ord: ordKey, wdi, mi, year };
    }
    function ordinalWeekdayFromSpec(spec) {
      if (typeof spec !== "string") return null;
      var s = _stripTrailPunct(spec);
      var m = s.match(/^(first|second|third|fourth|fifth|last|every|all)\s+([a-z0-9]+)/);
      if (!m) return null;
      var ord = m[1] === "all" ? "every" : m[1];
      var wdi = weekdayIndexByName(m[2]);
      if (wdi < 0) return null;
      return { ord, wdi };
    }
    function looseMDY(tokens) {
      var cal = getCal(), months = cal.months;
      tokens = (tokens || []).map(function(t) {
        return String(t).trim();
      }).filter(Boolean);
      if (!tokens.length) return null;
      if (tokens.length === 1) {
        if (/^\d+$/.test(tokens[0])) return { kind: "dayOnly", day: parseInt(tokens[0], 10) | 0 };
        var od = ordinalDay(tokens[0]);
        if (od != null) return { kind: "dayOnly", day: od | 0 };
        return null;
      }
      if (/^\d+$/.test(tokens[0])) {
        var miNum = clamp(parseInt(tokens[0], 10), 1, months.length) - 1;
        var dTok = tokens[1];
        var dNum = /^\d+$/.test(dTok) ? parseInt(dTok, 10) | 0 : ordinalDay(dTok);
        if (dNum == null) return null;
        var yNum = tokens[2] && /^\d+$/.test(tokens[2]) ? parseInt(tokens[2], 10) | 0 : null;
        return { kind: "mdy", mi: miNum, day: dNum, year: yNum };
      }
      var miByName = monthIndexByName(tokens[0]);
      if (miByName !== -1) {
        var dTok2 = tokens[1];
        var dN = /^\d+$/.test(dTok2) ? parseInt(dTok2, 10) | 0 : ordinalDay(dTok2);
        if (dN == null) return null;
        var yN = tokens[2] && /^\d+$/.test(tokens[2]) ? parseInt(tokens[2], 10) | 0 : null;
        return { kind: "mdy", mi: miByName, day: dN, year: yN };
      }
      return null;
    }
    function monthYearLoose(tokens) {
      var cal = getCal(), cur = cal.current;
      var mi = -1, day = null, year = null, idx = 0;
      if (idx < tokens.length) {
        var maybeMi = monthIndexByName(tokens[idx]);
        if (maybeMi !== -1) {
          mi = maybeMi;
          idx++;
        } else if (/^\d+$/.test(tokens[idx])) {
          var n = parseInt(tokens[idx], 10);
          if (n >= 1 && n <= cal.months.length) {
            mi = n - 1;
            idx++;
          }
        }
      }
      if (idx < tokens.length) {
        if (/^\d+$/.test(tokens[idx])) {
          var n2 = parseInt(tokens[idx], 10);
          var maxDay = mi !== -1 && cal.months[mi] ? cal.months[mi].days | 0 : 0;
          var looksLikeMonthYear = mi !== -1 && idx === 1 && tokens.length === 2 && (n2 > maxDay || String(tokens[idx]).length >= 3);
          if (looksLikeMonthYear) {
            year = n2;
            idx++;
          } else {
            day = n2;
            idx++;
          }
        } else {
          var od = ordinalDay(tokens[idx]);
          if (od != null) {
            day = od | 0;
            idx++;
          }
        }
      }
      if (idx < tokens.length && /^\d{1,6}$/.test(tokens[idx])) {
        year = parseInt(tokens[idx], 10);
        idx++;
      }
      if (mi === -1 && day == null && tokens.length === 1 && /^\d{1,6}$/.test(tokens[0])) {
        year = parseInt(tokens[0], 10);
      }
      return { mi, day, year };
    }
    return {
      weekdayIndexByName,
      ordinalDay,
      ordinalWeekday: {
        fromTokens: ordinalWeekdayFromTokens,
        fromSpec: ordinalWeekdayFromSpec
      },
      looseMDY,
      monthYearLoose
    };
  })();
  function isTodayVisibleInRange(startSerial, endSerial) {
    var t = todaySerial();
    return t >= startSerial && t <= endSerial;
  }
  var DaySpec = (function() {
    "use strict";
    function first(spec) {
      if (typeof spec === "number") return spec | 0;
      var s = String(spec || "").trim();
      var m = s.match(/^\s*(\d+)/);
      return m ? Math.max(1, parseInt(m[1], 10)) : 1;
    }
    function normalize(spec, maxDays) {
      var s = String(spec || "").trim().toLowerCase();
      if (/^\d+$/.test(s)) {
        return String(clamp(s, 1, maxDays));
      }
      var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        var a = clamp(m[1], 1, maxDays), b = clamp(m[2], 1, maxDays);
        if (a > b) {
          var t = a;
          a = b;
          b = t;
        }
        return a <= b ? a + "-" + b : null;
      }
      return null;
    }
    function expand(spec, maxDays) {
      var s = String(spec || "").trim().toLowerCase();
      var m = s.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        var a = clamp(m[1], 1, maxDays), b = clamp(m[2], 1, maxDays);
        if (a > b) {
          var t = a;
          a = b;
          b = t;
        }
        var out = [];
        for (var d = a; d <= b; d++) out.push(d);
        return out;
      }
      var n = parseInt(s, 10);
      if (isFinite(n)) return [clamp(n, 1, maxDays)];
      if (typeof sendChat === "function") {
        sendChat(script_name, "/w gm Ignored malformed day spec: <code>" + String(spec).replace(/[<>&"]/g, function(c) {
          return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
        }) + "</code>");
      }
      return [];
    }
    function matches(spec) {
      if (typeof spec === "number") {
        var n = spec | 0;
        return function(d) {
          return d === n;
        };
      }
      var s = String(spec || "").trim().toLowerCase();
      if (s.indexOf("-") !== -1) {
        var parts = s.split("-").map(function(x) {
          return parseInt(String(x).trim(), 10);
        });
        var a = parts[0], b = parts[1];
        if (isFinite(a) && isFinite(b)) {
          if (a > b) {
            var t = a;
            a = b;
            b = t;
          }
          return function(d) {
            return d >= a && d <= b;
          };
        }
      }
      var n2 = parseInt(s, 10);
      if (isFinite(n2)) return function(d) {
        return d === n2;
      };
      return function() {
        return false;
      };
    }
    function canonicalForKey(spec, maxDays) {
      var ow = Parse.ordinalWeekday.fromSpec(spec);
      if (ow) return String(spec).toLowerCase().trim();
      return normalize(spec, maxDays) || String(first(spec));
    }
    return { first, normalize, expand, matches, canonicalForKey };
  })();

  // src/events.ts
  function eventDisplayName(e) {
    var base = String(e && e.name || "").trim();
    if (!base) return "";
    var st = ensureSettings();
    var src = e && e.source != null ? titleCase(String(e.source)) : null;
    return src && st.showSourceLabels ? base + " (" + src + ")" : base;
  }
  function eventKey(e) {
    var y = e.year == null ? "ALL" : String(e.year | 0);
    return (e.month | 0) + "|" + String(e.day) + "|" + y + "|" + String(e.name || "").trim().toLowerCase();
  }
  function eventIndexByKey(key) {
    key = String(key || "").trim().toLowerCase();
    var evs = getCal().events || [];
    for (var i = 0; i < evs.length; i++) {
      if (eventKey(evs[i]).toLowerCase() === key) return i;
    }
    return -1;
  }
  function defaultKeyFor(monthHuman, daySpec, name) {
    return (monthHuman | 0) + "|" + String(daySpec) + "|ALL|" + String(name || "").trim().toLowerCase();
  }
  var eventsAPI = {
    forDay: function(monthIndex, day, year) {
      return getEventsFor(monthIndex, day, year);
    },
    forRange: function(startSerial, endSerial) {
      return occurrencesInRange(startSerial, endSerial);
    },
    colorFor: getEventColor,
    isDefault: isDefaultEvent
  };
  var renderAPI = {
    month: function(opts) {
      return renderMonthTable(opts);
    },
    monthGrid: function(mi, yearLabel, dimPast) {
      return renderMiniCal(mi, yearLabel, dimPast);
    },
    year: function(y, dimPast) {
      return yearHTMLFor(y, dimPast);
    },
    range: function(spec) {
      return buildCalendarsHtmlForSpec(spec);
    },
    eventListForRange: function(title, startSerial, endSerial, forceYearLabel) {
      return eventsListHTMLForRange(title, startSerial, endSerial, forceYearLabel);
    }
  };
  function compareEvents(a, b) {
    var ya = a.year == null ? -Infinity : a.year | 0;
    var yb = b.year == null ? -Infinity : b.year | 0;
    if (ya !== yb) return ya - yb;
    var am = +a.month || 1, bm = +b.month || 1;
    if (am !== bm) return am - bm;
    return DaySpec.first(a.day) - DaySpec.first(b.day);
  }
  function sortEventsByPriority(events2) {
    var pList = (ensureSettings().eventSourcePriority || []).map(function(s) {
      return String(s).toLowerCase();
    });
    function rank(e) {
      if (!e.source) return 0;
      var idx = pList.indexOf(String(e.source).toLowerCase());
      return idx >= 0 ? idx + 1 : pList.length + 1;
    }
    return events2.slice().sort(function(a, b) {
      return rank(a) - rank(b);
    });
  }
  function currentDefaultKeySet(cal) {
    var sysKey = ensureSettings().calendarSystem || CONFIG_DEFAULTS.calendarSystem;
    var lim = Math.max(1, cal.months.length);
    var out = {};
    deepClone(defaults2.events).forEach(function(de) {
      var src = de.source != null ? String(de.source).toLowerCase() : null;
      if (src && !_sourceAllowedForCalendar(src, sysKey)) return;
      var months = String(de.month).toLowerCase() === "all" ? (function() {
        var a = [];
        for (var i = 1; i <= lim; i++) a.push(i);
        return a;
      })() : [clamp(parseInt(de.month, 10) || 1, 1, lim)];
      months.forEach(function(m) {
        var maxD = cal.months[m - 1].days | 0;
        var norm = DaySpec.canonicalForKey(de.day, maxD);
        out[defaultKeyFor(m, norm, de.name)] = 1;
      });
    });
    return out;
  }
  function isDefaultEvent(ev) {
    var calLocal = getCal();
    var defaultsSet = currentDefaultKeySet(calLocal);
    var maxD = calLocal.months[ev.month - 1].days | 0;
    var norm = DaySpec.canonicalForKey(ev.day, maxD);
    var k = defaultKeyFor(ev.month, norm, ev.name);
    return !!defaultsSet[k];
  }
  function markSuppressedIfDefault(ev) {
    if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
    if (isDefaultEvent(ev)) {
      var calLocal = getCal();
      var maxD = calLocal.months[ev.month - 1].days | 0;
      var norm = DaySpec.canonicalForKey(ev.day, maxD);
      var k = defaultKeyFor(ev.month, norm, ev.name);
      state[state_name].suppressedDefaults[k] = 1;
    }
  }
  function mergeInNewDefaultEvents(cal) {
    var sysKey = ensureSettings().calendarSystem || CONFIG_DEFAULTS.calendarSystem;
    var lim = Math.max(1, cal.months.length);
    var suppressed = state[state_name].suppressedDefaults || {};
    var suppressedSources = state[state_name].suppressedSources || {};
    cal.events = (cal.events || []).filter(function(e) {
      var src = e && e.source != null ? String(e.source).toLowerCase() : null;
      return !src || _sourceAllowedForCalendar(src, sysKey);
    });
    var have = {};
    cal.events.forEach(function(e) {
      var yKey = e.year == null ? "ALL" : e.year | 0;
      have[(e.month | 0) + "|" + String(e.day) + "|" + yKey + "|" + String(e.name || "").trim().toLowerCase()] = 1;
    });
    deepClone(defaults2.events).forEach(function(de) {
      var src = de.source != null ? String(de.source).toLowerCase() : null;
      if (src && !_sourceAllowedForCalendar(src, sysKey)) return;
      if (src && suppressedSources[src]) return;
      var monthsList = String(de.month).toLowerCase() === "all" ? (function() {
        var a = [];
        for (var i = 1; i <= lim; i++) a.push(i);
        return a;
      })() : [clamp(parseInt(de.month, 10) || 1, 1, lim)];
      monthsList.forEach(function(m) {
        var maxD = cal.months[m - 1].days | 0;
        var normDay = DaySpec.canonicalForKey(de.day, maxD);
        var key = m + "|" + String(normDay) + "|ALL|" + String(de.name || "").trim().toLowerCase();
        if (!have[key] && !suppressed[key]) {
          cal.events.push({
            name: String(de.name || ""),
            month: m,
            day: normDay,
            year: null,
            color: resolveColor2(de.color) || null,
            source: de.source != null ? String(de.source) : null
          });
          have[key] = 1;
        }
      });
    });
    cal.events.sort(compareEvents);
  }
  function autoColorForEvent(e) {
    return PALETTE[_stableHash(e && e.name) % PALETTE.length];
  }
  function getEventColor(e) {
    return resolveColor2(e && e.color) || autoColorForEvent(e) || "#FF00DD";
  }
  function _addConcreteEvent(monthHuman, daySpec, yearOrNull, name, color) {
    var cal = getCal();
    var m = clamp(monthHuman, 1, cal.months.length);
    var maxD = cal.months[m - 1].days | 0;
    var ows = Parse.ordinalWeekday.fromSpec(daySpec);
    var normDay = ows ? String(daySpec).toLowerCase().trim() : DaySpec.normalize(daySpec, maxD);
    if (!normDay) return false;
    var col = resolveColor2(color) || null;
    var e = { name: String(name || ""), month: m, day: normDay, year: yearOrNull == null ? null : yearOrNull | 0, color: col };
    var key = eventKey(e);
    var exists = cal.events.some(function(ev) {
      return eventKey(ev) === key;
    });
    if (exists) return false;
    cal.events.push(e);
    cal.events.sort(compareEvents);
    return true;
  }
  function getEventsFor(monthIndex, day, year) {
    var m = monthIndex | 0, out = [];
    var events2 = getCal().events;
    var y = typeof year === "number" ? year | 0 : getCal().current.year;
    if (!events2 || !events2.length) return [];
    for (var i = 0; i < events2.length; i++) {
      var e = events2[i];
      if ((parseInt(e.month, 10) || 1) - 1 !== m) continue;
      if (e.year != null && (e.year | 0) !== y) continue;
      var ows = Parse.ordinalWeekday.fromSpec(e.day);
      if (ows) {
        if (ows.ord === "every") {
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
  function _firstWeekdayOfMonth(year, mi, wdi) {
    var first = weekdayIndex(year, mi, 1);
    var delta = (wdi - first + getCal().weekdays.length) % getCal().weekdays.length;
    return 1 + delta;
  }
  function _nthWeekdayOfMonth(year, mi, wdi, nth) {
    var mdays = getCal().months[mi].days | 0;
    var first = _firstWeekdayOfMonth(year, mi, wdi);
    var day = first + (nth - 1) * weekLength();
    return day <= mdays ? day : null;
  }
  function _lastWeekdayOfMonth(year, mi, wdi) {
    var mdays = getCal().months[mi].days | 0;
    var lastWd = weekdayIndex(year, mi, mdays);
    var delta = (lastWd - wdi + getCal().weekdays.length) % getCal().weekdays.length;
    var day = mdays - delta;
    return day >= 1 ? day : null;
  }
  function _tokenizeRangeArgs(args) {
    return (args || []).map(function(t) {
      return String(t).trim();
    }).filter(Boolean);
  }
  function _isPhrase(tok) {
    return /^(month|year|current|this|next|previous|prev|last|today|now)$/.test(String(tok || "").toLowerCase());
  }
  function dayFromOrdinalWeekday(year, mi, ow) {
    if (!ow) return null;
    if (ow.ord === "last") return _lastWeekdayOfMonth(year, mi, ow.wdi);
    var nth = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 }[ow.ord] || 1;
    var d = _nthWeekdayOfMonth(year, mi, ow.wdi, nth);
    return d == null ? _lastWeekdayOfMonth(year, mi, ow.wdi) : d;
  }
  function _allWeekdaysInMonth(year, mi, wdi) {
    var mdays = getCal().months[mi].days | 0;
    var first = _firstWeekdayOfMonth(year, mi, wdi);
    var out = [];
    for (var d = first; d <= mdays; d += weekLength()) {
      out.push(d);
    }
    return out;
  }
  function _phraseToSpec(tokens) {
    var cal = getCal(), cur = cal.current, months = cal.months, dpy = daysPerYear();
    var t0 = (tokens[0] || "").toLowerCase();
    var t1 = (tokens[1] || "").toLowerCase();
    function monthRange(y, mi, title) {
      var md = months[mi].days | 0;
      return { title, start: toSerial(y, mi, 1), end: toSerial(y, mi, md), months: [{ y, mi }] };
    }
    function yearRange(y, title) {
      var s = toSerial(y, 0, 1);
      var end = toSerial(y + 1, 0, 1) - 1;
      var mList = months.map(function(_, i) {
        return { y, mi: i };
      }).filter(function(e) {
        var m = months[e.mi];
        return !m.leapEvery || _isLeapMonth(m, y);
      });
      return { title, start: s, end, months: mList };
    }
    if (t0 === "today" || t0 === "now") {
      return monthRange(cur.year, cur.month, "Today \u2014 " + currentDateLabel());
    }
    if (t0 === "month" || (t0 === "this" || t0 === "current") && (t1 === "month" || !t1)) {
      return monthRange(cur.year, cur.month, "This Month");
    }
    if (t0 === "year" || (t0 === "this" || t0 === "current") && (t1 === "year" || !t1)) {
      return yearRange(cur.year, "This Year " + cur.year + " " + LABELS.era);
    }
    if (t0 === "next" && (!t1 || t1 === "month")) {
      var _nm = _nextActiveMi(cur.month, cur.year);
      return monthRange(_nm.y, _nm.mi, "Next Month (" + months[_nm.mi].name + ")");
    }
    if (t0 === "next" && t1 === "year") {
      return yearRange(cur.year + 1, "Next Year " + (cur.year + 1) + " " + LABELS.era);
    }
    if ((t0 === "last" || t0 === "previous" || t0 === "prev") && (!t1 || t1 === "month")) {
      var _pm = _prevActiveMi(cur.month, cur.year);
      return monthRange(_pm.y, _pm.mi, "Last Month (" + months[_pm.mi].name + ")");
    }
    if ((t0 === "last" || t0 === "previous" || t0 === "prev") && t1 === "year") {
      return yearRange(cur.year - 1, "Last Year " + (cur.year - 1) + " " + LABELS.era);
    }
    return null;
  }
  function _calendarMonthRange(y, mi, title) {
    var months = getCal().months;
    var md = months[mi].days | 0;
    return {
      title: title || months[mi].name + " " + y + " " + LABELS.era,
      start: toSerial(y, mi, 1),
      end: toSerial(y, mi, md),
      months: [{ y, mi }]
    };
  }
  function _calendarYearRange(y, title) {
    var months = getCal().months;
    var s = toSerial(y, 0, 1);
    var end = toSerial(y + 1, 0, 1) - 1;
    var mList = months.map(function(_, i) {
      return { y, mi: i };
    }).filter(function(entry) {
      var m = months[entry.mi];
      return !m.leapEvery || _isLeapMonth(m, y);
    });
    return {
      title: title || "Year " + y + " " + LABELS.era,
      start: s,
      end,
      months: mList
    };
  }
  function _parseTopLevelCalendarSpec(tokens) {
    tokens = _tokenizeRangeArgs(tokens);
    var cal = getCal();
    var cur = cal.current;
    var months = cal.months;
    if (!tokens.length) return _calendarMonthRange(cur.year, cur.month, "This Month");
    if (tokens.length && _isPhrase(tokens[0].toLowerCase())) {
      var phraseSpec = _phraseToSpec(tokens);
      if (phraseSpec) return phraseSpec;
    }
    var ow = Parse.ordinalWeekday.fromTokens(tokens);
    if (ow) {
      var owYear = typeof ow.year === "number" ? ow.year : cur.year;
      var owMi = ow.mi !== -1 ? ow.mi : cur.month;
      return _calendarMonthRange(owYear, owMi, months[owMi].name + " " + owYear + " " + LABELS.era);
    }
    var md = Parse.monthYearLoose(tokens);
    if (md.mi !== -1 && md.day != null && md.year != null) {
      return _calendarMonthRange(md.year, md.mi, months[md.mi].name + " " + md.year + " " + LABELS.era);
    }
    if (md.mi !== -1 && md.day != null) {
      var day = clamp(md.day, 1, months[md.mi].days | 0);
      var nextY = nextForMonthDay(cur, md.mi, day).year;
      return _calendarMonthRange(nextY, md.mi, months[md.mi].name + " " + nextY + " " + LABELS.era);
    }
    if (md.mi !== -1 && md.year != null) {
      return _calendarMonthRange(md.year, md.mi, months[md.mi].name + " " + md.year + " " + LABELS.era);
    }
    if (md.mi !== -1) {
      var y = md.mi >= cur.month ? cur.year : cur.year + 1;
      return _calendarMonthRange(y, md.mi, months[md.mi].name + " " + y + " " + LABELS.era);
    }
    if (md.year != null && md.day == null) {
      return _calendarYearRange(md.year, "Year " + md.year + " " + LABELS.era);
    }
    return null;
  }
  function _topLevelCalendarGuidanceHtml(tokens) {
    tokens = _tokenizeRangeArgs(tokens);
    var entered = tokens.length ? '<div style="margin-bottom:4px;"><code>!cal ' + esc(tokens.join(" ")) + "</code> does not map cleanly to a month view.</div>" : "";
    return _menuBox(
      "Calendar Jump Syntax",
      entered + '<div style="opacity:.82;">Top-level <code>!cal</code>, <code>!cal show</code>, and <code>!cal send</code> jumps render whole months or years.</div><div style="margin-top:5px;">Use a month name, a month plus year, or a full date that includes a month:</div><div style="margin-top:4px;"><code>!cal Zarantyr</code><br><code>!cal Zarantyr 998</code><br><code>!cal Rhaan 14</code><br><code>!cal next month</code><br><code>!cal this year</code></div><div style="margin-top:5px;opacity:.72;">Bare day-only inputs like <code>!cal 14</code> or <code>!cal 1st</code> are not supported here.</div>'
    );
  }
  function _deliverTopLevelCalendarRange(opts) {
    opts = opts || {};
    var spec = _parseTopLevelCalendarSpec(opts.args || []);
    if (!spec) {
      if (opts.who) whisper(opts.who, _topLevelCalendarGuidanceHtml(opts.args || []));
      return false;
    }
    var calHtml = buildCalendarsHtmlForSpec(spec);
    if (opts.dest === "broadcast") sendToAll(calHtml);
    else whisper(opts.who, calHtml);
    return true;
  }
  function occurrencesInRange(startSerial, endSerial) {
    var cal = getCal();
    var yStart = fromSerial(startSerial).year, yEnd = fromSerial(endSerial).year;
    var capYears = typeof RANGE_CAP_YEARS === "number" && RANGE_CAP_YEARS > 0 ? RANGE_CAP_YEARS : null;
    var capNotice = false;
    if (capYears && yEnd - yStart > capYears) {
      yEnd = yStart + capYears;
      capNotice = true;
    }
    var occ = [];
    for (var i = 0; i < cal.events.length; i++) {
      var e = cal.events[i];
      var mi = clamp(e.month, 1, cal.months.length) - 1;
      var maxD = cal.months[mi].days | 0;
      var ows = Parse.ordinalWeekday.fromSpec(e.day);
      var ys = e.year == null ? yStart : e.year | 0;
      var ye = e.year == null ? yEnd : e.year | 0;
      for (var y = ys; y <= ye; y++) {
        var days = ows ? ows.ord === "every" ? _allWeekdaysInMonth(y, mi, ows.wdi) : (function() {
          var d2 = dayFromOrdinalWeekday(y, mi, ows);
          return d2 ? [d2] : [];
        })() : DaySpec.expand(e.day, maxD);
        for (var k = 0; k < days.length; k++) {
          var d = clamp(days[k], 1, maxD);
          var ser = toSerial(y, mi, d);
          if (ser >= startSerial && ser <= endSerial) {
            occ.push({ serial: ser, y, m: mi, d, e });
          }
        }
      }
    }
    occ.sort(function(a, b) {
      return a.serial - b.serial || a.m - b.m || a.d - b.d;
    });
    if (capNotice) {
      sendChat(script_name, "/w gm Range capped at " + capYears + " years for performance.");
    }
    return occ;
  }
  function _rowDaysInMonth(y, mi, rowStart) {
    var cal = getCal(), wdCount = cal.weekdays.length | 0, out = [];
    for (var c = 0; c < wdCount; c++) {
      var d = fromSerial(rowStart + c);
      if (d.year === y && d.mi === mi) out.push(d.day);
    }
    return out;
  }
  function _setAddAll(setObj, arr) {
    for (var i = 0; i < arr.length; i++) setObj[arr[i]] = 1;
  }
  function _setCount(setObj) {
    return Object.keys(setObj).length;
  }
  function _setMin(setObj) {
    var keys = Object.keys(setObj).map(function(k) {
      return +k;
    });
    return keys.length ? Math.min.apply(null, keys) : null;
  }
  function _setMax(setObj) {
    var keys = Object.keys(setObj).map(function(k) {
      return +k;
    });
    return keys.length ? Math.max.apply(null, keys) : null;
  }
  function renderMonthStripWantedDays(year, mi, wantedSet, dimActive, extraEventsFn, includeCalendarEvents, stripRole) {
    var mobj = getCal().months[mi] || {};
    if (ensureSettings().calendarSystem === "faerunian" && mobj.isIntercalary && wantedSet && wantedSet[1]) {
      return _renderHarptosFestivalStrip(year, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, stripRole || "full");
    }
    var parts = openMonthTable(mi, year);
    var html = [parts.html];
    var wdCnt = getCal().weekdays.length | 0;
    var minD = _setMin(wantedSet), maxD = _setMax(wantedSet);
    if (minD == null || maxD == null) {
      html.push('<tr><td colspan="' + wdCnt + '" style="' + STYLES.calTd + ';opacity:.6;">' + _calendarCellInnerHtml("(no days)") + "</td></tr>");
      html.push(closeMonthTable());
      return html.join("");
    }
    var firstRow = weekStartSerial(year, mi, minD);
    var lastRow = weekStartSerial(year, mi, maxD);
    for (var rowStart = firstRow; rowStart <= lastRow; rowStart += wdCnt) {
      html.push("<tr>");
      for (var c = 0; c < wdCnt; c++) {
        var s = rowStart + c;
        var d = fromSerial(s);
        if (d.year === year && d.mi === mi && wantedSet[d.day]) {
          var ctx = makeDayCtx(d.year, d.mi, d.day, !!dimActive, extraEventsFn, includeCalendarEvents);
          html.push(tdHtmlForDay(ctx, parts.monthColor, STYLES.calTd, ""));
        } else {
          html.push('<td style="' + STYLES.calTd + '">' + _calendarCellInnerHtml("") + "</td>");
        }
      }
      html.push("</tr>");
    }
    html.push(closeMonthTable());
    return html.join("");
  }
  function adjacentPartialMonths(spec) {
    var cal = getCal(), today = todaySerial();
    var res = { prev: null, next: null };
    var wdCnt = weekLength() | 0;
    function collectMonthRows(y, mi, firstRow2, lastRow2) {
      var wanted3 = {};
      for (var row = firstRow2; row <= lastRow2; row += wdCnt) {
        _setAddAll(wanted3, _rowDaysInMonth(y, mi, row));
      }
      return wanted3;
    }
    if (today < spec.start && spec.start - today <= CONFIG_NEARBY_DAYS) {
      var startD = fromSerial(spec.start);
      var _adjP = _prevActiveMi(startD.mi, startD.year);
      var prevMi = _adjP.mi, prevY = _adjP.y;
      var prevMD = cal.months[prevMi].days | 0;
      var tD = fromSerial(today);
      var todayDay = tD.year === prevY && tD.mi === prevMi ? tD.day : prevMD;
      var todayRow = weekStartSerial(prevY, prevMi, todayDay);
      var lastRow = weekStartSerial(prevY, prevMi, prevMD);
      var wanted = collectMonthRows(prevY, prevMi, todayRow, lastRow);
      var backRow = todayRow - wdCnt, safety = 0;
      while (_setCount(wanted) < 5 && safety++ < 6) {
        var extra = _rowDaysInMonth(prevY, prevMi, backRow);
        if (!extra.length) break;
        _setAddAll(wanted, extra);
        backRow -= wdCnt;
      }
      res.prev = { y: prevY, mi: prevMi, wanted };
    }
    if (today > spec.end && today - spec.end <= CONFIG_NEARBY_DAYS) {
      var endD = fromSerial(spec.end);
      var _adjN = _nextActiveMi(endD.mi, endD.year);
      var nextMi = _adjN.mi, nextY = _adjN.y;
      var firstRow = weekStartSerial(nextY, nextMi, 1);
      var tD2 = fromSerial(today);
      var todayRow2 = tD2.year === nextY && tD2.mi === nextMi ? weekStartSerial(nextY, nextMi, tD2.day) : firstRow;
      var wanted2 = collectMonthRows(nextY, nextMi, firstRow, todayRow2);
      var fwdRow = todayRow2 + wdCnt, safety2 = 0;
      while (_setCount(wanted2) < 5 && safety2++ < 6) {
        var extra2 = _rowDaysInMonth(nextY, nextMi, fwdRow);
        if (!extra2.length) break;
        _setAddAll(wanted2, extra2);
        fwdRow += wdCnt;
      }
      res.next = { y: nextY, mi: nextMi, wanted: wanted2 };
    }
    if (!res.prev && today >= spec.start && today <= spec.end) {
      var sd = fromSerial(spec.start);
      var firstRowStart = weekStartSerial(sd.year, sd.mi, 1);
      if (today >= firstRowStart && today < firstRowStart + wdCnt) {
        var pMi = (sd.mi + cal.months.length - 1) % cal.months.length;
        var pY = sd.year - (sd.mi === 0 ? 1 : 0);
        var pMD = cal.months[pMi].days | 0;
        var pLastRow = weekStartSerial(pY, pMi, pMD);
        var wantedP = {};
        _setAddAll(wantedP, _rowDaysInMonth(pY, pMi, pLastRow));
        if (_setCount(wantedP)) res.prev = { y: pY, mi: pMi, wanted: wantedP };
      }
    }
    if (!res.next && today >= spec.start && today <= spec.end) {
      var ed = fromSerial(spec.end);
      var edMD = cal.months[ed.mi].days | 0;
      var lastRowStart = weekStartSerial(ed.year, ed.mi, edMD);
      if (today >= lastRowStart && today < lastRowStart + wdCnt) {
        var nMi = (ed.mi + 1) % cal.months.length;
        var nY = ed.year + (nMi === 0 ? 1 : 0);
        var nFirstRow = weekStartSerial(nY, nMi, 1);
        var wantedN = {};
        _setAddAll(wantedN, _rowDaysInMonth(nY, nMi, nFirstRow));
        if (_setCount(wantedN)) res.next = { y: nY, mi: nMi, wanted: wantedN };
      }
    }
    return res;
  }
  function _monthsFromRangeSpec(spec) {
    if (spec.months && spec.months.length) return spec.months.slice();
    var months = [], cal = getCal();
    var avgDpy = _serialCache.avgDpy || daysPerYear();
    var firstY = Math.max(0, Math.floor(spec.start / avgDpy) - 1);
    var lastY = Math.floor(spec.end / avgDpy) + 1;
    while (firstY > 0 && _daysBeforeYear(firstY) > spec.start) firstY--;
    while (_daysBeforeYear(firstY + 1) <= spec.start) firstY++;
    for (var y = firstY; y <= lastY; y++) {
      var yearStart = _daysBeforeYear(y);
      if (yearStart > spec.end) break;
      for (var mi = 0; mi < cal.months.length; mi++) {
        var m = cal.months[mi];
        if (m.leapEvery && !_isLeapMonth(m, y)) continue;
        var s = toSerial(y, mi, 1), e = toSerial(y, mi, m.days | 0);
        if (e < spec.start) continue;
        if (s > spec.end) break;
        months.push({ y, mi });
      }
    }
    return months;
  }
  function buildCalendarsHtmlForSpec(spec) {
    spec = spec || {};
    var months = _monthsFromRangeSpec(spec);
    var out = ['<div style="text-align:left;">'];
    var extraEventsFn = typeof spec.extraEventsFn === "function" ? spec.extraEventsFn : null;
    var includeCalendarEvents = !(spec.includeCalendarEvents === false);
    var present = {};
    for (var i = 0; i < months.length; i++) {
      present[months[i].y + "|" + months[i].mi] = 1;
    }
    var boundary = adjacentPartialMonths(spec);
    var today = todaySerial();
    var td = fromSerial(today);
    function stripHasToday(s) {
      if (!s || !s.wanted) return false;
      return td.year === s.y && td.mi === s.mi && !!s.wanted[td.day];
    }
    var prevKey = boundary.prev ? boundary.prev.y + "|" + boundary.prev.mi : null;
    var nextKey = boundary.next ? boundary.next.y + "|" + boundary.next.mi : null;
    var dimActiveAll = isTodayVisibleInRange(spec.start, spec.end) || !!boundary.prev && !present[prevKey] && stripHasToday(boundary.prev) || !!boundary.next && !present[nextKey] && stripHasToday(boundary.next);
    if (boundary.prev && !present[boundary.prev.y + "|" + boundary.prev.mi]) {
      out.push('<div style="' + STYLES.wrap + '">' + renderMonthStripWantedDays(boundary.prev.y, boundary.prev.mi, boundary.prev.wanted, dimActiveAll, extraEventsFn, includeCalendarEvents, "prev") + "</div>");
    }
    for (var k = 0; k < months.length; k++) {
      var m = months[k];
      out.push('<div style="' + STYLES.wrap + '">' + renderMonthTable({
        year: m.y,
        mi: m.mi,
        mode: "full",
        dimPast: dimActiveAll,
        extraEventsFn,
        includeCalendarEvents
      }) + "</div>");
    }
    if (boundary.next && !present[boundary.next.y + "|" + boundary.next.mi]) {
      out.push('<div style="' + STYLES.wrap + '">' + renderMonthStripWantedDays(boundary.next.y, boundary.next.mi, boundary.next.wanted, dimActiveAll, extraEventsFn, includeCalendarEvents, "next") + "</div>");
    }
    out.push("</div>");
    return out.join("");
  }
  function eventsListHTMLForRange(title, startSerial, endSerial, forceYearLabel) {
    var st = ensureSettings();
    var today = todaySerial();
    var occ = occurrencesInRange(startSerial, endSerial);
    var includeYear = forceYearLabel || Math.floor(startSerial / daysPerYear()) !== Math.floor(endSerial / daysPerYear());
    var out = ['<div style="margin:4px 0;"><b>' + esc(title) + "</b></div>"];
    if (!occ.length) {
      out.push('<div style="opacity:.7;">No events in this range.</div>');
      return out.join("");
    }
    if (!st.groupEventsBySource) {
      for (var i = 0; i < occ.length; i++) {
        var o = occ[i];
        var name2 = eventDisplayName(o.e);
        out.push(eventLineHtml(o.y, o.m, o.d, name2, includeYear, o.serial === today, getEventColor(o.e)));
      }
      return out.join("");
    }
    var groups = {}, order = [];
    for (var k = 0; k < occ.length; k++) {
      var o2 = occ[k];
      var src = o2.e && typeof o2.e.source === "string" ? o2.e.source.trim() : "";
      var key = src ? titleCase(src) : "Other";
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(o2);
    }
    order.sort(function(a, b) {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
    for (var g = 0; g < order.length; g++) {
      var label = order[g];
      out.push('<div style="margin-top:6px;font-weight:bold;">' + esc(label) + "</div>");
      var arr = groups[label];
      for (var j = 0; j < arr.length; j++) {
        var o3 = arr[j];
        var name3 = st.showSourceLabels ? o3.e && o3.e.name ? String(o3.e.name) : "(unnamed event)" : eventDisplayName(o3.e);
        out.push(eventLineHtml(o3.y, o3.m, o3.d, name3, includeYear, o3.serial === today, getEventColor(o3.e)));
      }
    }
    return out.join("");
  }

  // src/color.ts
  var _contrastCache = /* @__PURE__ */ Object.create(null);
  var _headerStyleCache = /* @__PURE__ */ Object.create(null);
  function _cullCacheIfLarge(obj, max) {
    var limit = max || 256;
    if (Object.keys(obj).length > limit) {
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) delete obj[k];
      }
    }
  }
  function _resetColorCaches() {
    _contrastCache = /* @__PURE__ */ Object.create(null);
    _headerStyleCache = /* @__PURE__ */ Object.create(null);
  }
  function sanitizeHexColor2(s) {
    if (!s) return null;
    var hex = String(s).trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g, "$1$1");
    if (/^[0-9a-f]{6}$/i.test(hex)) return "#" + hex.toUpperCase();
    return null;
  }
  function resolveColor2(s) {
    if (!s) return null;
    var hex = sanitizeHexColor2(s);
    if (hex) return hex;
    var key = String(s).trim().toLowerCase();
    return NAMED_COLORS[key] || null;
  }
  function popColorIfPresent(tokens, allowBareName) {
    tokens = (tokens || []).slice();
    if (!tokens.length) return { color: null, tokens };
    var last = String(tokens[tokens.length - 1] || "").trim();
    var col = null;
    if (allowBareName) {
      col = resolveColor2(last) || _parseSharpColorToken(last);
    } else {
      if (last[0] === "#") col = _parseSharpColorToken(last);
    }
    if (col) {
      tokens.pop();
      return { color: col, tokens };
    }
    return { color: null, tokens };
  }
  function _stableHash(str) {
    var h = 5381;
    str = String(str || "");
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) + h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
  function _eventDotsHtml(events2) {
    if (!events2 || events2.length <= 1) return "";
    var dots = events2.slice(1, 3).map(function(e) {
      var col = getEventColor(e);
      return '<span style="color:' + col + ';line-height:1;">&#9679;</span>';
    });
    return '<div style="font-size:.45em;line-height:1;margin-top:1px;">' + dots.join("&thinsp;") + "</div>";
  }
  function _relLum(hex) {
    hex = (hex || "").toString().replace(/^#/, "");
    if (hex.length === 3) hex = hex.replace(/(.)/g, "$1$1");
    if (!/^[0-9a-f]{6}$/i.test(hex)) return 0;
    var n = parseInt(hex, 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    function lin(c) {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function _contrast(bgHex, textHex) {
    var L1 = _relLum(bgHex), L2 = _relLum(textHex);
    var hi = Math.max(L1, L2), lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function textColor(bgHex) {
    var k = "t:" + bgHex;
    if (_contrastCache[k]) return _contrastCache[k];
    var v = _contrast(bgHex, "#000") >= _contrast(bgHex, "#fff") ? "#000" : "#fff";
    _contrastCache[k] = v;
    _cullCacheIfLarge(_contrastCache);
    return v;
  }
  function textOutline(tc, bgHex, minTarget) {
    var ratio = _contrast(bgHex, tc);
    if (ratio >= (minTarget || CONTRAST_MIN_HEADER)) return "";
    if (tc === "#fff") {
      var off = 1;
      return "text-shadow:" + -off + "px " + -off + "px 0 rgba(0,0,0,.95)," + off + "px " + -off + "px 0 rgba(0,0,0,.95)," + -off + "px " + off + "px 0 rgba(0,0,0,.95)," + off + "px " + off + "px 0 rgba(0,0,0,.95);";
    } else {
      var off2 = 0.5;
      return "text-shadow:" + -off2 + "px " + -off2 + "px 0 rgba(255,255,255,.70)," + off2 + "px " + -off2 + "px 0 rgba(255,255,255,.70)," + -off2 + "px " + off2 + "px 0 rgba(255,255,255,.70)," + off2 + "px " + off2 + "px 0 rgba(255,255,255,.70);";
    }
  }
  function applyBg(style, bgHex, minTarget) {
    var t = textColor(bgHex);
    style += "background-color:" + bgHex + ";";
    style += "background-clip:padding-box;";
    style += "color:" + t + ";";
    style += textOutline(t, bgHex, minTarget || CONTRAST_MIN_HEADER);
    return style;
  }
  var colorsAPI = {
    textColor,
    applyBg,
    styleMonthHeader: function(monthHex) {
      var k = "hdr:" + monthHex;
      if (_headerStyleCache[k]) return _headerStyleCache[k];
      var t = textColor(monthHex);
      var v = "background-color:" + monthHex + ";color:" + t + ";" + textOutline(t, monthHex, CONTRAST_MIN_HEADER);
      _headerStyleCache[k] = v;
      _cullCacheIfLarge(_headerStyleCache);
      return v;
    },
    reset: _resetColorCaches
  };

  // src/state.ts
  function _flattenSources(map) {
    var out = [];
    Object.keys(map).forEach(function(src) {
      (map[src] || []).forEach(function(e) {
        out.push({
          name: String(e.name || ""),
          month: e.month,
          day: e.day,
          color: e.color,
          source: src
        });
      });
    });
    return out;
  }
  function _sourceAllowedForCalendar(sourceKey, calendarSystem) {
    var src = String(sourceKey || "").toLowerCase();
    var sys = String(calendarSystem || "").toLowerCase();
    var allow = DEFAULT_EVENT_SOURCE_CALENDARS[src];
    if (!allow || !allow.length) return true;
    for (var i = 0; i < allow.length; i++) {
      if (String(allow[i] || "").toLowerCase() === sys) return true;
    }
    return false;
  }
  var defaults2 = {
    current: {
      month: CONFIG_START_DATE.month,
      day_of_the_month: CONFIG_START_DATE.day_of_the_month,
      day_of_the_week: CONFIG_START_DATE.day_of_the_week,
      year: CONFIG_START_DATE.year
    },
    months: CONFIG_MONTH_LENGTHS.slice(),
    events: _flattenSources(DEFAULT_EVENTS)
  };
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function ensureSettings() {
    var root = state[state_name];
    if (!root.settings) {
      root.settings = {
        calendarSystem: CONFIG_DEFAULTS.calendarSystem,
        calendarVariant: CONFIG_DEFAULTS.calendarVariant,
        seasonVariant: CONFIG_DEFAULTS.seasonVariant,
        colorTheme: CONFIG_DEFAULTS.colorTheme,
        groupEventsBySource: false,
        showSourceLabels: false,
        uiDensity: CONFIG_DEFAULTS.uiDensity,
        autoButtons: CONFIG_DEFAULTS.autoButtons,
        eventsEnabled: CONFIG_DEFAULTS.eventsEnabled,
        moonDisplayMode: CONFIG_DEFAULTS.moonDisplayMode,
        weatherDisplayMode: CONFIG_DEFAULTS.weatherDisplayMode,
        planesDisplayMode: CONFIG_DEFAULTS.planesDisplayMode,
        subsystemVerbosity: CONFIG_DEFAULTS.subsystemVerbosity,
        weatherForecastViewDays: CONFIG_DEFAULTS.weatherForecastViewDays,
        eventSourcePriority: []
      };
    }
    var s = root.settings;
    if (!s.calendarSystem && (s.monthSet || s.weekdaySet)) {
      var oldSet = (s.monthSet || "").toLowerCase();
      var sysMap = {
        druidic: "eberron",
        halfling: "eberron",
        dwarven: "eberron",
        faerunian: "faerunian",
        gregorian: "gregorian"
      };
      var varMap = {
        druidic: "druidic",
        halfling: "halfling",
        dwarven: "dwarven",
        faerunian: "standard",
        gregorian: "standard"
      };
      s.calendarSystem = sysMap[oldSet] || "eberron";
      s.calendarVariant = varMap[oldSet] || "standard";
      s.seasonVariant = s.seasonSet || CONFIG_DEFAULTS.seasonVariant;
      if (!s.colorTheme) s.colorTheme = null;
      delete s.monthSet;
      delete s.weekdaySet;
      delete s.seasonSet;
      delete s.monthLengthSet;
      delete s.structureSet;
    }
    var _svMig = s.seasonVariant;
    if (_svMig === "northern") {
      s.seasonVariant = s.calendarSystem === "gregorian" ? "gregorian" : s.calendarSystem === "faerunian" ? "faerun" : "eberron";
    } else if (_svMig === "southern") {
      s.seasonVariant = s.calendarSystem === "gregorian" ? "gregorian" : "faerun";
      s.hemisphere = "south";
    } else if (_svMig === "tropic" || _svMig === "tropical_monsoon") {
      s.seasonVariant = "tropical";
    }
    if (!s.calendarSystem) s.calendarSystem = CONFIG_DEFAULTS.calendarSystem;
    if (!s.calendarVariant) s.calendarVariant = CONFIG_DEFAULTS.calendarVariant;
    if (!s.seasonVariant) s.seasonVariant = CONFIG_DEFAULTS.seasonVariant;
    if (!s.hemisphere) s.hemisphere = CONFIG_DEFAULTS.hemisphere;
    if (!s.eventSourcePriority) s.eventSourcePriority = [];
    if (s.uiDensity !== "compact" && s.uiDensity !== "normal") s.uiDensity = CONFIG_DEFAULTS.uiDensity;
    if (s.autoButtons === void 0) s.autoButtons = CONFIG_DEFAULTS.autoButtons;
    if (s.eventsEnabled === void 0) s.eventsEnabled = CONFIG_DEFAULTS.eventsEnabled;
    if (s.moonsEnabled === void 0) s.moonsEnabled = CONFIG_DEFAULTS.moonsEnabled;
    if (s.weatherEnabled === void 0) s.weatherEnabled = CONFIG_DEFAULTS.weatherEnabled;
    if (s.weatherMechanicsEnabled === void 0) s.weatherMechanicsEnabled = CONFIG_DEFAULTS.weatherMechanicsEnabled;
    if (s.planesEnabled === void 0) s.planesEnabled = CONFIG_DEFAULTS.planesEnabled;
    if (s.offCyclePlanes === void 0) s.offCyclePlanes = CONFIG_DEFAULTS.offCyclePlanes;
    if (s._planesAutoToggle !== false) {
      var isEberronCal = s.calendarSystem === "eberron";
      if (s.planesEnabled === void 0 || s._planesAutoToggle === void 0) {
        s.planesEnabled = isEberronCal;
        s._planesAutoToggle = true;
      }
    }
    if (s._moonsAutoToggle !== false) {
      var isEberronCal2 = s.calendarSystem === "eberron";
      if (s.moonsEnabled === void 0 || s._moonsAutoToggle === void 0) {
        s.moonsEnabled = isEberronCal2;
        s._moonsAutoToggle = true;
      }
    }
    if (!/^(calendar|list|both)$/.test(String(s.moonDisplayMode || "").toLowerCase()))
      s.moonDisplayMode = CONFIG_DEFAULTS.moonDisplayMode;
    if (!/^(calendar|list|both)$/.test(String(s.weatherDisplayMode || "").toLowerCase()))
      s.weatherDisplayMode = CONFIG_DEFAULTS.weatherDisplayMode;
    if (!/^(calendar|list|both)$/.test(String(s.planesDisplayMode || "").toLowerCase()))
      s.planesDisplayMode = CONFIG_DEFAULTS.planesDisplayMode;
    s.subsystemVerbosity = String(s.subsystemVerbosity || CONFIG_DEFAULTS.subsystemVerbosity).toLowerCase();
    if (s.subsystemVerbosity !== "minimal" && s.subsystemVerbosity !== "normal")
      s.subsystemVerbosity = CONFIG_DEFAULTS.subsystemVerbosity;
    s.weatherForecastViewDays = _weatherViewDays(s.weatherForecastViewDays);
    return s;
  }
  function getCal() {
    return state[state_name].calendar;
  }
  function titleCase(s) {
    return String(s || "").split(/\s+/).map(function(w) {
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    }).join(" ");
  }
  function weekLength() {
    var cal = getCal();
    var n = (cal && cal.weekdays && cal.weekdays.length) | 0;
    return n > 0 ? n : 7;
  }
  function colorForMonth(mi) {
    var st = ensureSettings();
    var cal = getCal();
    var pal = COLOR_THEMES[effectiveColorTheme()];
    var themeIdx = mi;
    if (cal.months[mi] && cal.months[mi].isIntercalary) {
      for (var k = mi - 1; k >= 0; k--) {
        if (!cal.months[k].isIntercalary) {
          themeIdx = k;
          break;
        }
      }
    }
    var m = cal.months[themeIdx];
    var palIdx = m && typeof m.regularIndex === "number" ? m.regularIndex : themeIdx;
    var themeCol = pal && pal[palIdx] ? pal[palIdx] : null;
    var monthCol = cal.months[mi] && cal.months[mi].color || null;
    return resolveColor2(themeCol || monthCol) || "#EEE";
  }
  function _seasonNames(setName) {
    var entry = SEASON_SETS[String(setName || "").toLowerCase()];
    if (!entry) return null;
    return Array.isArray(entry) ? entry : entry.names || null;
  }
  function applySeasonSet(setName) {
    var cal = getCal();
    var entry = SEASON_SETS[String(setName || "").toLowerCase()];
    if (!entry) return false;
    var names = Array.isArray(entry) ? entry : entry.names || null;
    if (!names) return false;
    var regular = cal.months.filter(function(m) {
      return !m.isIntercalary;
    });
    if (names.length !== regular.length) return false;
    var hem = ensureSettings().hemisphere || CONFIG_DEFAULTS.hemisphere;
    var shift = entry.hemisphereAware && !entry.transitions && hem === "south" ? 6 : 0;
    var ri = 0;
    for (var i = 0; i < cal.months.length; i++) {
      if (!cal.months[i].isIntercalary) {
        cal.months[i].season = names[(ri + shift) % names.length];
        ri++;
      } else if (i > 0) {
        cal.months[i].season = cal.months[i - 1].season || null;
      }
    }
    return true;
  }
  function applyStructureSet(setName) {
    if (!setName) return false;
    var template = CALENDAR_STRUCTURE_SETS[String(setName).toLowerCase()];
    if (!template) return false;
    var cal = getCal();
    var st = ensureSettings();
    var sys2 = CALENDAR_SYSTEMS[st.calendarSystem] || {};
    var lengthSet = sys2.monthDays ? sys2.monthDays.slice() : CONFIG_MONTH_LENGTHS.slice();
    cal.months = template.map(function(slot) {
      if (slot.isIntercalary) {
        return {
          name: slot.name,
          days: slot.days | 0,
          isIntercalary: true,
          leapEvery: slot.leapEvery || null,
          season: null
        };
      }
      var ri = slot.regularIndex | 0;
      return {
        name: "",
        days: ri < lengthSet.length ? lengthSet[ri] : 28,
        regularIndex: ri,
        season: null
      };
    });
    _invalidateSerialCache();
    return true;
  }
  function _autoToggleCalendarSource(sourceKey, enable) {
    var root = state[state_name];
    if (!root.suppressedSources) root.suppressedSources = {};
    var suppressedSources = root.suppressedSources;
    var sup = root.suppressedDefaults || (root.suppressedDefaults = {});
    if (enable) {
      delete suppressedSources[sourceKey];
      Object.keys(sup).forEach(function(k) {
        var info = _defaultDetailsForKey(k);
        if (info && String(info.source || "").toLowerCase() === sourceKey) delete sup[k];
      });
      mergeInNewDefaultEvents(getCal());
    } else {
      suppressedSources[sourceKey] = 1;
      var cal = getCal(), defaultsSet = currentDefaultKeySet(cal);
      cal.events = cal.events.filter(function(e) {
        var src = e.source != null ? String(e.source).toLowerCase() : null;
        if (src !== sourceKey) return true;
        var mobj = cal.months[e.month - 1];
        var maxD = mobj ? mobj.days | 0 : 28;
        var norm = DaySpec.canonicalForKey(e.day, maxD);
        var k = defaultKeyFor(e.month, norm, e.name);
        return !defaultsSet[k];
      });
    }
  }
  function applyCalendarSystem(sysKey, varKey) {
    var sys = CALENDAR_SYSTEMS[String(sysKey || "").toLowerCase()];
    if (!sys) return false;
    var vk = String(varKey || sys.defaultVariant || "standard").toLowerCase();
    var variant = sys.variants && sys.variants[vk];
    if (!variant) {
      var first = sys.variants && Object.keys(sys.variants)[0];
      variant = first ? sys.variants[first] : null;
      vk = first || "standard";
    }
    if (!variant) return false;
    var st = ensureSettings();
    var cal = getCal();
    if (sys.structure) {
      st.structureSet = sys.structure;
      applyStructureSet(sys.structure);
    } else {
      st.structureSet = null;
      cal.months = sys.monthDays.map(function(d, i2) {
        return { days: d, regularIndex: i2 };
      });
    }
    var ri = 0;
    for (var i = 0; i < cal.months.length; i++) {
      var mo = cal.months[i];
      if (!mo.isIntercalary) {
        var idx = typeof mo.regularIndex === "number" ? mo.regularIndex : ri;
        if (idx < sys.monthDays.length) mo.days = sys.monthDays[idx];
        ri++;
      }
    }
    var names = variant.monthNames;
    ri = 0;
    for (var j = 0; j < cal.months.length; j++) {
      if (!cal.months[j].isIntercalary) cal.months[j].name = names[ri++] || "Month " + ri;
    }
    cal.weekdays = sys.weekdays.slice();
    var _prevSeason = st.seasonVariant;
    var _prevSys2 = st.calendarSystem || "";
    var _isNewSys = _prevSys2 !== sysKey;
    if (!_prevSeason || _isNewSys) {
      st.seasonVariant = sys.defaultSeason || CONFIG_DEFAULTS.seasonVariant;
    }
    var seasonKey = st.seasonVariant;
    applySeasonSet(seasonKey);
    colorsAPI.reset();
    var _prevSys = st.calendarSystem || "";
    st.calendarSystem = sysKey;
    st.calendarVariant = vk;
    var isEberron = sysKey === "eberron";
    if (st._planesAutoToggle !== false) {
      st.planesEnabled = isEberron;
      st._planesAutoToggle = true;
    }
    if (st._moonsAutoToggle !== false) {
      st.moonsEnabled = isEberron;
      st._moonsAutoToggle = true;
    }
    Object.keys(DEFAULT_EVENT_SOURCE_CALENDARS).forEach(function(srcKey) {
      if (!_sourceAllowedForCalendar(srcKey, sysKey)) {
        _autoToggleCalendarSource(srcKey, false);
      }
    });
    var _paired = { gregorian: "gregorian_seasons" };
    if (_paired[sysKey] && sysKey !== _prevSys) {
      _autoToggleCalendarSource(_paired[sysKey], true);
    }
    _invalidateSerialCache();
    return true;
  }
  function effectiveColorTheme() {
    var st = ensureSettings();
    if (st.colorTheme && COLOR_THEMES[st.colorTheme]) return st.colorTheme;
    var sys = CALENDAR_SYSTEMS[st.calendarSystem];
    var variant = sys && sys.variants && sys.variants[st.calendarVariant];
    return variant && variant.colorTheme || "lunar";
  }
  function checkInstall2() {
    if (!state[state_name]) state[state_name] = {};
    ensureSettings();
    if (!state[state_name].calendar || !Array.isArray(state[state_name].calendar.weekdays) || !Array.isArray(state[state_name].calendar.months)) {
      state[state_name].calendar = deepClone(defaults2);
    }
    if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
    if (!state[state_name].suppressedSources) state[state_name].suppressedSources = {};
    var cal = state[state_name].calendar;
    if (!Array.isArray(cal.weekdays) || !cal.weekdays.length) {
      var st = ensureSettings();
      var sys3 = CALENDAR_SYSTEMS[st.calendarSystem || CONFIG_DEFAULTS.calendarSystem] || CALENDAR_SYSTEMS.eberron;
      cal.weekdays = (sys3.weekdays || []).slice();
    }
    if (!cal.current) cal.current = deepClone(defaults2.current);
    if (!Array.isArray(cal.events)) {
      var lim = Math.max(1, cal.months.length);
      var out = [];
      deepClone(defaults2.events).forEach(function(e) {
        var monthsList;
        if (String(e.month).toLowerCase() === "all") {
          monthsList = [];
          for (var i2 = 1; i2 <= lim; i2++) monthsList.push(i2);
        } else {
          var m2 = clamp(parseInt(e.month, 10) || 1, 1, lim);
          monthsList = [m2];
        }
        monthsList.forEach(function(m3) {
          out.push({
            name: String(e.name || ""),
            month: m3,
            day: e.day,
            year: null,
            color: resolveColor2(e.color) || null,
            source: e.source != null ? String(e.source) : null
          });
        });
      });
      cal.events = out;
    } else {
      cal.events = cal.events.map(function(e) {
        var lim3 = Math.max(1, cal.months.length);
        var m2 = clamp(parseInt(e.month, 10) || 1, 1, lim3);
        var yr = isFinite(parseInt(e.year, 10)) ? parseInt(e.year, 10) | 0 : null;
        return {
          name: String(e.name || ""),
          month: m2,
          day: e.day,
          year: yr,
          color: resolveColor2(e.color) || null,
          source: e.source != null ? String(e.source) : null
        };
      });
      var defColorByKey = {};
      var lim2 = Math.max(1, cal.months.length);
      defaults2.events.forEach(function(de) {
        var col = resolveColor2(de.color) || null;
        if (String(de.month).toLowerCase() === "all") {
          for (var i2 = 1; i2 <= lim2; i2++) defColorByKey[i2 + "|" + String(de.day)] = col;
        } else {
          var m2 = clamp(parseInt(de.month, 10) || 1, 1, lim2);
          defColorByKey[m2 + "|" + String(de.day)] = col;
        }
      });
      cal.events.forEach(function(e) {
        if (!e.color) {
          var key = e.month + "|" + String(e.day);
          var col = defColorByKey[key];
          if (col) e.color = col;
        }
      });
    }
    for (var i = 0; i < cal.months.length; i++) {
      var m = cal.months[i];
      if (typeof m === "number") {
        cal.months[i] = { days: m | 0 || 28 };
      } else {
        cal.months[i] = cal.months[i] || {};
        if (!cal.months[i].days) cal.months[i].days = 28;
      }
      if (!cal.months[i].isIntercalary && typeof cal.months[i].regularIndex !== "number") {
        cal.months[i].regularIndex = i;
      }
    }
    var s = ensureSettings();
    applyCalendarSystem(
      s.calendarSystem || CONFIG_DEFAULTS.calendarSystem,
      s.calendarVariant || CONFIG_DEFAULTS.calendarVariant
    );
    mergeInNewDefaultEvents(cal);
    _invalidateSerialCache();
    var mdays = cal.months[cal.current.month].days;
    if (cal.current.day_of_the_month > mdays) {
      cal.current.day_of_the_month = mdays;
    }
    (function() {
      var warnings = [];
      var sys = CALENDAR_SYSTEMS[s.calendarSystem || CONFIG_DEFAULTS.calendarSystem];
      if (sys) {
        var vk = s.calendarVariant || sys.defaultVariant || "standard";
        var variant = sys.variants && sys.variants[vk];
        if (variant && variant.monthNames && sys.monthDays && variant.monthNames.length !== sys.monthDays.length) {
          warnings.push("Month names (" + variant.monthNames.length + ") vs month days (" + sys.monthDays.length + ') mismatch in calendar system "' + (s.calendarSystem || CONFIG_DEFAULTS.calendarSystem) + '" variant "' + vk + '".');
        }
      }
      if (CONFIG_MONTH_LENGTHS.length !== cal.months.length) {
        warnings.push("CONFIG_MONTH_LENGTHS (" + CONFIG_MONTH_LENGTHS.length + ") does not match active calendar month count (" + cal.months.length + ").");
      }
      for (var w = 0; w < warnings.length; w++) {
        log("[Galifar Calendar] \u26A0 CONFIG WARNING: " + warnings[w]);
      }
    })();
  }
  function refreshCalendarState2(silent) {
    checkInstall2();
    var cal = getCal();
    cal.events = (cal.events || []).map(function(e) {
      var m = clamp(e.month, 1, cal.months.length);
      var ow = Parse.ordinalWeekday.fromSpec(e.day);
      var daySpec = ow ? String(e.day).toLowerCase().trim() : DaySpec.normalize(e.day, cal.months[m - 1].days) || String(DaySpec.first(e.day));
      var yr = e.year == null ? null : parseInt(e.year, 10) | 0;
      return {
        name: String(e.name || ""),
        month: m,
        day: daySpec,
        year: yr,
        color: resolveColor2(e.color) || null,
        source: e.source != null ? String(e.source) : null
      };
    });
    var seen = {};
    cal.events = cal.events.filter(function(e) {
      var y = e.year == null ? "ALL" : e.year | 0;
      var k = e.month + "|" + e.day + "|" + y + "|" + String(e.name || "").trim().toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
    cal.events.sort(compareEvents);
    if (!silent) sendChat(script_name, "/w gm Calendar state refreshed (" + cal.events.length + " events).");
  }
  function refreshAndSend() {
    refreshCalendarState2(true);
    sendCurrentDate(null, true);
  }
  function resetToDefaults() {
    delete state[state_name];
    state[state_name] = { calendar: deepClone(defaults2) };
    checkInstall2();
    sendChat(script_name, "/w gm Calendar state wiped and reset to defaults.");
    sendCurrentDate(null, true);
  }

  // src/boot-register.ts
  function handleInput(msg) {
    if (msg.type !== "api" || !/^!cal\b/i.test(msg.content)) return;
    checkInstall2();
    var args = msg.content.trim().split(/\s+/);
    args = args.slice(0, 2).concat(_normalizePackedWords(args.slice(2).join(" ")).split(/\s+/).filter(Boolean));
    var sub = String(args[1] || "").toLowerCase();
    var cmd = commands[sub] || commands[""];
    if (typeof cmd === "function") {
      cmd(msg, args);
      return;
    }
    if (cmd.gm && !playerIsGM(msg.playerid)) {
      whisper(cleanWho(msg.who), LABELS.gmOnlyNotice);
      return;
    }
    cmd.run(msg, args);
  }
  function register() {
    on("chat:message", handleInput);
  }

  // src/init.ts
  on("ready", function() {
    checkInstall2();
    refreshCalendarState2(true);
    register();
    var currentDate = currentDateLabel();
    var stReady = ensureSettings();
    var sysReady = CALENDAR_SYSTEMS[stReady.calendarSystem] || {};
    var sysLabelReady = String(sysReady.label || "Calendar");
    log(sysLabelReady + " Running, current date: " + currentDate);
    sendChat(
      script_name,
      "/direct <div>" + esc(sysLabelReady) + " Calendar Initialized</div><div>Current date: " + esc(currentDate) + "</div><div>Use <code>!cal</code> to view the calendar.</div><div>Use <code>!cal help</code> for help.</div>"
    );
  });
  var _public = {
    checkInstall: checkInstall2,
    register,
    render: renderAPI,
    events: eventsAPI,
    colors: colorsAPI
  };
  if (typeof globalThis !== "undefined" && globalThis.__CALENDAR_TEST_MODE__) {
    _public._test = {
      // date / serial math
      toSerial,
      fromSerial,
      weekdayIndex,
      daysPerYear,
      _daysBeforeYear,
      _daysBeforeMonthInYear,
      _isGregorianLeapYear,
      _leapsBefore,
      _invalidateSerialCache,
      todaySerial,
      // state helpers
      getCal,
      ensureSettings,
      deepClone,
      checkInstall: checkInstall2,
      refreshCalendarState: refreshCalendarState2,
      // calendar systems
      CALENDAR_SYSTEMS,
      applyCalendarSystem,
      applySeasonSet,
      // date navigation
      stepDays,
      setDate,
      currentDateLabel,
      formatDateLabel,
      monthIndexByName,
      // events
      getEventsFor,
      addEventSmart,
      removeEvent,
      eventKey,
      compareEvents,
      getEventColor,
      isDefaultEvent,
      // utilities
      _stableHash,
      clamp,
      esc,
      titleCase,
      sanitizeHexColor: sanitizeHexColor2,
      resolveColor: resolveColor2,
      textColor,
      _relLum,
      _contrast,
      weekLength,
      colorForMonth,
      // weather
      getWeatherState,
      _composeFormula,
      _rollTrait,
      _clampWeatherTempBand,
      _weatherTempLabel,
      _weatherTempInfo,
      // moons
      getMoonState,
      _moonHashStr,
      _moonPrng,
      moonPhaseAt,
      moonEnsureSequences,
      MOON_SYSTEMS,
      _eberronMoonCore,
      nighttimeLux,
      nighttimeLightCondition,
      // verbosity
      _subsystemIsVerbose,
      _subsystemVerbosityValue,
      // today-view helpers
      _todayAllHtml,
      _todayWeatherIsStable,
      _forecastRecord,
      weatherEnsureForecast,
      _weatherRecordForDisplay,
      // eclipse
      _diskOverlapFraction,
      _eclipseTimeBlock,
      _eclipseMetricsAt,
      _finalizeEclipseEvent,
      _eclipseLifecycleText,
      _eclipseNotableToday,
      getEclipses,
      // weather reveals
      _bestTier,
      _locSig,
      _weatherRevealBucket,
      _recordReveal,
      _weatherRevealForSerial,
      _grantCommonWeatherReveals,
      _parseWeatherRevealDayToken,
      _parseWeatherRevealDateSpec,
      // harptos
      weekStartSerial,
      _ordinal,
      _displayMonthDayParts,
      CALENDAR_STRUCTURE_SETS,
      // constants
      state_name,
      CONFIG_DEFAULTS,
      SEASON_SETS,
      WEATHER_CLIMATES,
      WEATHER_DAY_PERIODS,
      WEATHER_PRIMARY_PERIOD
    };
  }

  // src/index.ts
  var checkInstall3 = _public.checkInstall;
  var register2 = _public.register;
  var render = _public.render;
  var events = _public.events;
  var colors = _public.colors;
  var _test = _public._test;
  return __toCommonJS(index_exports);
})();
