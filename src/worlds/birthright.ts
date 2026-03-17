import type { WorldDefinition } from './types.js';

export const birthright: WorldDefinition = {
  key: 'birthright',
  label: 'Birthright',
  description:
    '12 months of 32 days plus 4 festival days (388-day year). 8-day week. Deismaar reckoning.',
  eraLabel: 'MA',
  defaultDate: { month: 0, day: 1, year: 551 },

  calendar: {
    key: 'birthright',
    label: 'Cerilian Calendar',
    weekdays: [
      'Firlen', 'Dielen', 'Trielen', 'Fiaren',
      'Quinlen', 'Seislen', 'Seplen', 'Achlen',
    ],
    weekdayAbbr: {
      Firlen: 'Fir', Dielen: 'Die', Trielen: 'Tri', Fiaren: 'Fia',
      Quinlen: 'Qui', Seislen: 'Sei', Seplen: 'Sep', Achlen: 'Ach',
    },
    monthDays: [32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32],
    structure: [
      { name: 'Emmanir',    days: 32, regularIndex: 0 },
      { name: 'Erntenir',   days: 1,  isIntercalary: true },
      { name: 'Deismir',    days: 32, regularIndex: 1 },
      { name: 'Talenir',    days: 32, regularIndex: 2 },
      { name: 'Roelir',     days: 32, regularIndex: 3 },
      { name: 'Haelynir',   days: 1,  isIntercalary: true },
      { name: 'Anarire',    days: 32, regularIndex: 4 },
      { name: 'Sarimiere',  days: 32, regularIndex: 5 },
      { name: 'Roesone',    days: 32, regularIndex: 6 },
      { name: 'Midsummer',  days: 1,  isIntercalary: true },
      { name: 'Passir',     days: 32, regularIndex: 7 },
      { name: 'Sehnir',     days: 32, regularIndex: 8 },
      { name: 'Keltier',    days: 32, regularIndex: 9 },
      { name: 'Midwinter',  days: 1,  isIntercalary: true },
      { name: 'Michaelen',  days: 32, regularIndex: 10 },
      { name: 'Faniele',    days: 32, regularIndex: 11 },
    ],
    namingOverlays: [
      {
        key: 'standard',
        label: 'Anuirean',
        monthNames: [
          'Emmanir', 'Deismir', 'Talenir', 'Roelir',
          'Anarire', 'Sarimiere', 'Roesone', 'Passir',
          'Sehnir', 'Keltier', 'Michaelen', 'Faniele',
        ],
        colorTheme: 'birthright',
      },
    ],
    defaultOverlayKey: 'standard',
    weekdayProgressionMode: 'continuous_serial',
    intercalaryRenderMode: 'regular_grid',
    dateFormatStyle: 'ordinal_of_month',
  },

  seasons: [
    {
      key: 'birthright',
      names: [
        'Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
        'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter',
      ],
      hemisphereAware: false,
    },
  ],
  defaultSeasonKey: 'birthright',

  moons: {
    label: 'Moon of Aebrynis',
    anchorStrategy: 'per_moon_anchor',
    bodies: [
      {
        key: 'aelies',
        name: 'Aelies',
        title: 'The Silver Moon',
        color: '#C0C0C0',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 32,
        visibilityMode: 'normal',
        data: {
          loreNote: 'Aelies is the single moon of Aebrynis. Its 32-day cycle matches the regular months of the Cerilian calendar.',
        },
      },
    ],
  },

  eventPacks: [
    {
      key: 'birthright_festivals',
      label: 'Cerilian Festivals',
      events: [
        { name: 'Erntenir (Harvest Festival)', month: 2, day: 1, color: '#DAA520', source: 'birthright' },
        { name: 'Haelynir (Day of the Sun)',   month: 5, day: 1, color: '#FFD700', source: 'birthright' },
        { name: 'Midsummer',                   month: 8, day: 1, color: '#FF6347', source: 'birthright' },
        { name: 'Midwinter',                   month: 11, day: 1, color: '#87CEEB', source: 'birthright' },
      ],
    },
  ],

  capabilities: {
    moons: true,
    weather: true,
    planes: false,
    defaultEvents: true,
    worldHooks: false,
  },

  setup: {},
};
