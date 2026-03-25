import type { WorldDefinition } from './types.js';

const EARTH_MOON_DIAMETER_KM = 3474.8;
const EARTH_MOON_DISTANCE_KM = 384400;
const DRAGONLANCE_SHARED_NODE_DEG = 276.42857142857144;

const DRAGONLANCE_EARTH_ANALOG = {
  inclination: 5.145,
  eccentricity: 0.0549,
  albedo: 0.12,
};

const DRAGONLANCE_FIXED_ANCHOR = {
  referenceDate: { year: 346, month: 7, day: 7 },
  timeFrac: 0,
  phaseAngleDeg: 180,
  // Summer Run 7 in a 336-day year lands 174 days into the year. At local
  // midnight, opposition to the sun puts the aligned moons on the meridian.
  skyLongDeg: 6.428571428571429,
  overheadAtAnchor: true,
  observerLatitudeDeg: 30,
};

function apparentSizeMatchedDiameter(distanceKm: number, relativeToLuna: number){
  return EARTH_MOON_DIAMETER_KM * (distanceKm / EARTH_MOON_DISTANCE_KM) * relativeToLuna;
}

function dragonlanceMotionTuning(distancePeriodDays: number){
  return {
    inclinationBase: DRAGONLANCE_EARTH_ANALOG.inclination,
    inclinationAmp: 0,
    inclinationPeriodDays: 336,
    ascendingNode: DRAGONLANCE_SHARED_NODE_DEG,
    nodePrecessionDegPerYear: 0,
    distanceSwingPct: 0,
    distancePeriodDays: distancePeriodDays,
    apsisAngle: 0,
    apsisPrecessionDegPerYear: 0,
  };
}

export const dragonlance: WorldDefinition = {
  key: 'dragonlance',
  label: 'Dragonlance',
  description:
    '12 months of 28 days (336-day year). 7-day week. Three moons govern magic on Krynn.',
  eraLabel: 'PC',
  defaultDate: { month: 0, day: 1, year: 352 },

  calendar: {
    key: 'dragonlance',
    label: 'Krynnish Calendar',
    weekdays: [
      'Linaras', 'Palast', 'Majetag', 'Kirinor',
      'Misham', 'Bakukal', 'Bracha',
    ],
    weekdayAbbr: {
      Linaras: 'Lin', Palast: 'Pal', Majetag: 'Maj',
      Kirinor: 'Kir', Misham: 'Mis', Bakukal: 'Bak', Bracha: 'Bra',
    },
    monthDays: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    structure: [
      { name: 'Winter Come',     days: 28, regularIndex: 0 },
      { name: 'Winter Deep',     days: 28, regularIndex: 1 },
      { name: 'Spring Dawning',  days: 28, regularIndex: 2 },
      { name: 'Spring Rain',     days: 28, regularIndex: 3 },
      { name: 'Spring Blossom',  days: 28, regularIndex: 4 },
      { name: 'Summer Home',     days: 28, regularIndex: 5 },
      { name: 'Summer Run',      days: 28, regularIndex: 6 },
      { name: 'Summer End',      days: 28, regularIndex: 7 },
      { name: 'Autumn Harvest',  days: 28, regularIndex: 8 },
      { name: 'Autumn Twilight', days: 28, regularIndex: 9 },
      { name: 'Autumn Dark',     days: 28, regularIndex: 10 },
      { name: 'Winter Night',    days: 28, regularIndex: 11 },
    ],
    namingOverlays: [
      {
        key: 'standard',
        label: 'Solamnic',
        monthNames: [
          'Winter Come', 'Winter Deep', 'Spring Dawning', 'Spring Rain',
          'Spring Blossom', 'Summer Home', 'Summer Run', 'Summer End',
          'Autumn Harvest', 'Autumn Twilight', 'Autumn Dark', 'Winter Night',
        ],
        colorTheme: 'dragonlance',
      },
    ],
    defaultOverlayKey: 'standard',
    weekdayProgressionMode: 'continuous_serial',
    intercalaryRenderMode: 'regular_grid',
    dateFormatStyle: 'ordinal_of_month',
  },

  seasons: [
    {
      key: 'dragonlance',
      names: [
        'Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
        'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter',
      ],
      hemisphereAware: false,
    },
  ],
  defaultSeasonKey: 'dragonlance',

  moons: {
    label: 'Moons of Krynn',
    anchorStrategy: 'conjunction_anchor',
    bodies: [
      {
        key: 'solinari',
        name: 'Solinari',
        title: 'The Silver Moon',
        color: '#E8E8E8',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 36,
        synodicPeriod: 36,
        siderealPeriod: 32.516129032258064,
        visibilityMode: 'normal',
        diameter: apparentSizeMatchedDiameter(433562.6450335759, 2),
        distance: 433562.6450335759,
        inclination: DRAGONLANCE_EARTH_ANALOG.inclination,
        eccentricity: DRAGONLANCE_EARTH_ANALOG.eccentricity,
        albedo: DRAGONLANCE_EARTH_ANALOG.albedo,
        orbitalData: { angularSizeVsSun: 2.0 },
        motionTuning: dragonlanceMotionTuning(32.516129032258064),
        fixedAnchor: DRAGONLANCE_FIXED_ANCHOR,
        data: {
          loreNote: 'Solinari governs Good magic on Krynn. Its 36-day cycle determines the power of White Robed wizards. Named for the god Solinari, son of Paladine.',
          magicAlignment: 'Good',
          robeColor: 'White',
        },
      },
      {
        key: 'lunitari',
        name: 'Lunitari',
        title: 'The Red Moon',
        color: '#CD5C5C',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 28,
        synodicPeriod: 28,
        siderealPeriod: 25.846153846153847,
        visibilityMode: 'normal',
        diameter: apparentSizeMatchedDiameter(370432.65421999485, 1),
        distance: 370432.65421999485,
        inclination: DRAGONLANCE_EARTH_ANALOG.inclination,
        eccentricity: DRAGONLANCE_EARTH_ANALOG.eccentricity,
        albedo: DRAGONLANCE_EARTH_ANALOG.albedo,
        orbitalData: { angularSizeVsSun: 1.0 },
        motionTuning: dragonlanceMotionTuning(25.846153846153847),
        fixedAnchor: DRAGONLANCE_FIXED_ANCHOR,
        data: {
          loreNote: 'Lunitari governs Neutral magic on Krynn. Its 28-day cycle matches the calendar months. Named for the goddess Lunitari, daughter of Gilean.',
          magicAlignment: 'Neutral',
          robeColor: 'Red',
        },
      },
      {
        key: 'nuitari',
        name: 'Nuitari',
        title: 'The Black Moon',
        color: '#1A1A2E',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 8,
        synodicPeriod: 8,
        siderealPeriod: 7.813953488372094,
        visibilityMode: 'hidden_by_default',
        diameter: apparentSizeMatchedDiameter(166862.6723285724, 0.35),
        distance: 166862.6723285724,
        inclination: DRAGONLANCE_EARTH_ANALOG.inclination,
        eccentricity: DRAGONLANCE_EARTH_ANALOG.eccentricity,
        albedo: DRAGONLANCE_EARTH_ANALOG.albedo,
        orbitalData: { angularSizeVsSun: 0.35 },
        motionTuning: dragonlanceMotionTuning(7.813953488372094),
        fixedAnchor: DRAGONLANCE_FIXED_ANCHOR,
        data: {
          loreNote: 'Nuitari governs Evil magic on Krynn. Its rapid 8-day cycle is invisible to all but those who serve darkness. Named for the god Nuitari, son of Takhisis. Only Black Robed wizards can see its dark disk against the stars.',
          magicAlignment: 'Evil',
          robeColor: 'Black',
        },
      },
    ],
  },

  eventPacks: [
    {
      key: 'dragonlance_calendar',
      label: 'Krynnish Calendar Events',
      events: [
        { name: 'Yule',           month: 1, day: 1,  color: '#A8DADC', source: 'dragonlance' },
        { name: 'Spring Dawning', month: 3, day: 1,  color: '#A8E6A3', source: 'dragonlance' },
        { name: 'Midsummer',      month: 6, day: 14, color: '#FFD700', source: 'dragonlance' },
        { name: 'Harvest Home',   month: 9, day: 14, color: '#F4A261', source: 'dragonlance' },
      ],
    },
  ],

  capabilities: {
    moons: true,
    weather: true,
    planes: false,
    defaultEvents: true,
    worldHooks: true,
  },

  setup: {
    extraSteps: [
      {
        key: 'nightOfTheEye',
        label: 'Night of the Eye Anchor',
        type: 'choice',
        options: [
          { key: 'default', label: 'Use the default Night of the Eye (recommended)' },
          { key: 'manual', label: 'Set manually after setup' },
        ],
        default: 'default',
      },
    ],
  },
};
