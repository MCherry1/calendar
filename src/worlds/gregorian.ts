import type { WorldDefinition } from './types.js';

export const gregorian: WorldDefinition = {
  key: 'gregorian',
  label: 'Earth',
  description: '12 months of varying length. Standard Earth calendar.',
  eraLabel: 'CE',
  defaultDate: { month: 0, day: 1, year: 2024 },

  calendar: {
    key: 'gregorian',
    label: 'Gregorian Calendar',
    weekdays: [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday',
    ],
    weekdayAbbr: {
      Sunday: 'Sun',
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
    },
    monthDays: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    structure: [
      { name: 'January',   days: 31, regularIndex: 0 },
      { name: 'February',  days: 28, regularIndex: 1 },
      { name: 'Leap Day',  days: 1,  isIntercalary: true, leapEvery: 4 },
      { name: 'March',     days: 31, regularIndex: 2 },
      { name: 'April',     days: 30, regularIndex: 3 },
      { name: 'May',       days: 31, regularIndex: 4 },
      { name: 'June',      days: 30, regularIndex: 5 },
      { name: 'July',      days: 31, regularIndex: 6 },
      { name: 'August',    days: 31, regularIndex: 7 },
      { name: 'September', days: 30, regularIndex: 8 },
      { name: 'October',   days: 31, regularIndex: 9 },
      { name: 'November',  days: 30, regularIndex: 10 },
      { name: 'December',  days: 31, regularIndex: 11 },
    ],
    namingOverlays: [
      {
        key: 'standard',
        label: 'Standard',
        monthNames: [
          'January', 'February', 'March', 'April',
          'May', 'June', 'July', 'August',
          'September', 'October', 'November', 'December',
        ],
        colorTheme: 'birthstones',
      },
    ],
    defaultOverlayKey: 'standard',
    weekdayProgressionMode: 'continuous_serial',
    intercalaryRenderMode: 'banner_day',
    dateFormatStyle: 'month_day_year',
  },

  seasons: [
    {
      key: 'gregorian',
      names: [
        'Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
        'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter',
      ],
      hemisphereAware: true,
      transitions: [
        { mi: 2,  day: 20, season: 'Spring' },
        { mi: 5,  day: 21, season: 'Summer' },
        { mi: 8,  day: 22, season: 'Autumn' },
        { mi: 11, day: 21, season: 'Winter' },
      ],
      transitionsSouth: [
        { mi: 2,  day: 20, season: 'Autumn' },
        { mi: 5,  day: 21, season: 'Winter' },
        { mi: 8,  day: 22, season: 'Spring' },
        { mi: 11, day: 21, season: 'Summer' },
      ],
    },
  ],
  defaultSeasonKey: 'gregorian',

  moons: {
    label: 'Luna',
    anchorStrategy: 'per_moon_anchor',
    bodies: [
      {
        key: 'luna',
        name: 'Luna',
        title: 'The Moon',
        color: '#DCDCDC',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 29.53059,
        visibilityMode: 'normal',
        data: {
          diameter: 2159,
          distance: 238855,
          inclination: 5.14,
          eccentricity: 0.0549,
          albedo: 0.12,
          epochSeed: {
            defaultSeed: 'luna',
            referenceDate: { year: 2021, month: 1, day: 28 },
          },
          loreNote:
            "Earth's natural satellite. Synodic period 29.53 days. " +
            'Governs tides and has inspired mythology across all human cultures.',
        },
      },
    ],
  },

  eventPacks: [
    {
      key: 'gregorian_seasons',
      label: 'Gregorian Seasons',
      events: [
        { name: 'First Day of Winter', month: 12, day: 21, color: '#A8DADC', source: 'gregorian' },
        { name: 'Winter Solstice',     month: 12, day: 21, color: '#A8DADC', source: 'gregorian' },
        { name: 'First Day of Spring', month: 3,  day: 20, color: '#A8E6A3', source: 'gregorian' },
        { name: 'Spring Equinox',      month: 3,  day: 20, color: '#A8E6A3', source: 'gregorian' },
        { name: 'First Day of Summer', month: 6,  day: 21, color: '#FFD166', source: 'gregorian' },
        { name: 'Summer Solstice',     month: 6,  day: 21, color: '#FFD166', source: 'gregorian' },
        { name: 'First Day of Autumn', month: 9,  day: 22, color: '#F4A261', source: 'gregorian' },
        { name: 'Autumn Equinox',      month: 9,  day: 22, color: '#F4A261', source: 'gregorian' },
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
