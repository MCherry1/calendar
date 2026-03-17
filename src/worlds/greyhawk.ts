import type { WorldDefinition } from './types.js';

export const greyhawk: WorldDefinition = {
  key: 'greyhawk',
  label: 'Greyhawk',
  description:
    '12 months of 28 days with 4 intercalary festival weeks. 7-day week. Common Year reckoning.',
  eraLabel: 'CY',
  defaultDate: { month: 0, day: 1, year: 591 },

  calendar: {
    key: 'greyhawk',
    label: 'Dozenmonth of Luna',
    weekdays: [
      'Starday', 'Sunday', 'Moonday', 'Godsday',
      'Waterday', 'Earthday', 'Freeday',
    ],
    weekdayAbbr: {
      Starday: 'Sta', Sunday: 'Sun', Moonday: 'Mon',
      Godsday: 'God', Waterday: 'Wat', Earthday: 'Ear', Freeday: 'Fre',
    },
    monthDays: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    structure: [
      { name: 'Needfest',     days: 7, isIntercalary: true },
      { name: 'Fireseek',     days: 28, regularIndex: 0 },
      { name: 'Readying',     days: 28, regularIndex: 1 },
      { name: 'Coldeven',     days: 28, regularIndex: 2 },
      { name: 'Growfest',     days: 7, isIntercalary: true },
      { name: 'Planting',     days: 28, regularIndex: 3 },
      { name: 'Flocktime',    days: 28, regularIndex: 4 },
      { name: 'Wealsun',      days: 28, regularIndex: 5 },
      { name: 'Richfest',     days: 7, isIntercalary: true },
      { name: 'Reaping',      days: 28, regularIndex: 6 },
      { name: 'Goodmonth',    days: 28, regularIndex: 7 },
      { name: 'Harvester',    days: 28, regularIndex: 8 },
      { name: 'Brewfest',     days: 7, isIntercalary: true },
      { name: 'Patchwall',    days: 28, regularIndex: 9 },
      { name: 'Ready\'reat',  days: 28, regularIndex: 10 },
      { name: 'Sunsebb',      days: 28, regularIndex: 11 },
    ],
    namingOverlays: [
      {
        key: 'standard',
        label: 'Common',
        monthNames: [
          'Fireseek', 'Readying', 'Coldeven', 'Planting',
          'Flocktime', 'Wealsun', 'Reaping', 'Goodmonth',
          'Harvester', 'Patchwall', 'Ready\'reat', 'Sunsebb',
        ],
        colorTheme: 'greyhawk',
      },
    ],
    defaultOverlayKey: 'standard',
    weekdayProgressionMode: 'continuous_serial',
    intercalaryRenderMode: 'week_block',
    dateFormatStyle: 'ordinal_of_month',
  },

  seasons: [
    {
      key: 'greyhawk',
      names: [
        'Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
        'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter',
      ],
      hemisphereAware: false,
    },
  ],
  defaultSeasonKey: 'greyhawk',

  moons: {
    label: 'Oerth Moons',
    anchorStrategy: 'per_moon_anchor',
    bodies: [
      {
        key: 'luna',
        name: 'Luna',
        title: 'The Great Moon',
        color: '#F5F5DC',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 28,
        visibilityMode: 'normal',
        data: {
          loreNote: 'Luna is Oerth\'s larger moon. Its 28-day cycle aligns perfectly with the calendar months.',
        },
      },
      {
        key: 'celene',
        name: 'Celene',
        title: 'The Handmaiden',
        color: '#B0E0E6',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 91,
        visibilityMode: 'normal',
        data: {
          loreNote: 'Celene is Oerth\'s smaller, aquamarine-hued moon. Its 91-day cycle is watched by druids and astrologers.',
        },
      },
    ],
  },

  eventPacks: [
    {
      key: 'greyhawk_festivals',
      label: 'Greyhawk Festivals',
      events: [
        { name: 'Needfest begins',  month: 1, day: 1,  color: '#E0C68A', source: 'greyhawk' },
        { name: 'Growfest begins',  month: 4, day: 1,  color: '#A8E6A3', source: 'greyhawk' },
        { name: 'Richfest begins',  month: 7, day: 1,  color: '#FFD700', source: 'greyhawk' },
        { name: 'Midsummer',        month: 7, day: 4,  color: '#FFD700', source: 'greyhawk' },
        { name: 'Brewfest begins',  month: 10, day: 1, color: '#D2691E', source: 'greyhawk' },
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
