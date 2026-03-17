import type { WorldDefinition } from './types.js';

export const mystara: WorldDefinition = {
  key: 'mystara',
  label: 'Mystara',
  description:
    '12 months of 28 days (336-day year). 7-day week. Known World / BECMI setting.',
  eraLabel: 'AC',
  defaultDate: { month: 0, day: 1, year: 1000 },

  calendar: {
    key: 'mystara',
    label: 'Thyatian Calendar',
    weekdays: [
      'Lunadain', 'Moldain', 'Gromdain', 'Tserdain',
      'Moldain', 'Soladain', 'Loshdain',
    ],
    weekdayAbbr: {
      Lunadain: 'Lun', Moldain: 'Mol', Gromdain: 'Gro',
      Tserdain: 'Tse', Soladain: 'Sol', Loshdain: 'Los',
    },
    monthDays: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    structure: [
      { name: 'Nuwmont',    days: 28, regularIndex: 0 },
      { name: 'Vatermont',  days: 28, regularIndex: 1 },
      { name: 'Thaumont',   days: 28, regularIndex: 2 },
      { name: 'Flaurmont',  days: 28, regularIndex: 3 },
      { name: 'Yarthmont',  days: 28, regularIndex: 4 },
      { name: 'Klarmont',   days: 28, regularIndex: 5 },
      { name: 'Felmont',    days: 28, regularIndex: 6 },
      { name: 'Fyrmont',    days: 28, regularIndex: 7 },
      { name: 'Ambyrmont',  days: 28, regularIndex: 8 },
      { name: 'Sviftmont',  days: 28, regularIndex: 9 },
      { name: 'Eirmont',    days: 28, regularIndex: 10 },
      { name: 'Kaldmont',   days: 28, regularIndex: 11 },
    ],
    namingOverlays: [
      {
        key: 'standard',
        label: 'Thyatian',
        monthNames: [
          'Nuwmont', 'Vatermont', 'Thaumont', 'Flaurmont',
          'Yarthmont', 'Klarmont', 'Felmont', 'Fyrmont',
          'Ambyrmont', 'Sviftmont', 'Eirmont', 'Kaldmont',
        ],
        colorTheme: 'mystara',
      },
    ],
    defaultOverlayKey: 'standard',
    weekdayProgressionMode: 'continuous_serial',
    intercalaryRenderMode: 'regular_grid',
    dateFormatStyle: 'ordinal_of_month',
  },

  seasons: [
    {
      key: 'mystara',
      names: [
        'Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
        'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter',
      ],
      hemisphereAware: false,
    },
  ],
  defaultSeasonKey: 'mystara',

  moons: {
    label: 'Moons of Mystara',
    anchorStrategy: 'per_moon_anchor',
    bodies: [
      {
        key: 'matera',
        name: 'Matera',
        title: 'The Visible Moon',
        color: '#F5F5DC',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 28,
        visibilityMode: 'normal',
        data: {
          loreNote: 'Matera is the primary visible moon of Mystara. Its 28-day cycle governs tides and is the basis of the common month.',
        },
      },
      {
        key: 'patera',
        name: 'Patera',
        title: 'The Invisible Moon',
        color: '#4A4A6A',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'fixed',
        baseCycleDays: 32,
        visibilityMode: 'hidden_by_default',
        data: {
          loreNote: 'Patera is the invisible moon of Mystara, home to the Ee\'aar. Only visible to those with special sight or powerful magic. Its existence is known to few.',
        },
      },
    ],
  },

  eventPacks: [
    {
      key: 'mystara_holidays',
      label: 'Mystaran Holidays',
      events: [
        { name: 'New Year',         month: 1,  day: 1,  color: '#FFD700', source: 'mystara' },
        { name: 'Vernal Equinox',   month: 3,  day: 14, color: '#A8E6A3', source: 'mystara' },
        { name: 'Summer Solstice',  month: 6,  day: 14, color: '#FFD166', source: 'mystara' },
        { name: 'Autumnal Equinox', month: 9,  day: 14, color: '#F4A261', source: 'mystara' },
        { name: 'Winter Solstice',  month: 12, day: 14, color: '#A8DADC', source: 'mystara' },
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
