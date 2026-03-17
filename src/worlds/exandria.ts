import type { WorldDefinition } from './types.js';

export const exandria: WorldDefinition = {
  key: 'exandria',
  label: 'Exandria',
  description:
    '11 months of 29-32 days (328-day year). 7-day week. Exandrian calendar from Critical Role.',
  eraLabel: 'PD',
  defaultDate: { month: 0, day: 1, year: 836 },

  calendar: {
    key: 'exandria',
    label: 'Exandrian Calendar',
    weekdays: [
      'Miresen', 'Grissen', 'Whelsen', 'Conthsen',
      'Folsen', 'Yulisen', 'Da\'leysen',
    ],
    weekdayAbbr: {
      Miresen: 'Mir', Grissen: 'Gri', Whelsen: 'Whe',
      Conthsen: 'Con', Folsen: 'Fol', Yulisen: 'Yul', "Da'leysen": 'Dal',
    },
    monthDays: [29, 30, 30, 31, 28, 29, 32, 29, 30, 30, 30],
    structure: [
      { name: 'Horisal',     days: 29, regularIndex: 0 },
      { name: 'Misuthar',    days: 30, regularIndex: 1 },
      { name: 'Dualahei',    days: 30, regularIndex: 2 },
      { name: 'Thunsheer',   days: 31, regularIndex: 3 },
      { name: 'Unndilar',    days: 28, regularIndex: 4 },
      { name: 'Brussendar',  days: 29, regularIndex: 5 },
      { name: 'Sydenstar',   days: 32, regularIndex: 6 },
      { name: 'Fessuran',    days: 29, regularIndex: 7 },
      { name: 'Quen\'pillar', days: 30, regularIndex: 8 },
      { name: 'Cuersaar',    days: 30, regularIndex: 9 },
      { name: 'Duscar',      days: 30, regularIndex: 10 },
    ],
    namingOverlays: [
      {
        key: 'standard',
        label: 'Exandrian',
        monthNames: [
          'Horisal', 'Misuthar', 'Dualahei', 'Thunsheer',
          'Unndilar', 'Brussendar', 'Sydenstar', 'Fessuran',
          'Quen\'pillar', 'Cuersaar', 'Duscar',
        ],
        colorTheme: 'exandria',
      },
    ],
    defaultOverlayKey: 'standard',
    weekdayProgressionMode: 'continuous_serial',
    intercalaryRenderMode: 'regular_grid',
    dateFormatStyle: 'ordinal_of_month',
  },

  seasons: [
    {
      key: 'exandria',
      names: [
        'Winter', 'Winter', 'Spring', 'Spring', 'Summer',
        'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter',
      ],
      hemisphereAware: false,
    },
  ],
  defaultSeasonKey: 'exandria',

  moons: {
    label: 'Moons of Exandria',
    anchorStrategy: 'seed_only',
    bodies: [
      {
        key: 'catha',
        name: 'Catha',
        title: 'The Guiding Light',
        color: '#F0E6D6',
        associatedMonth: null,
        phaseMode: 'standard_phase',
        cycleMode: 'seeded_drift_uniform',
        baseCycleDays: 29,
        cycleFormula: '29 + 1d11',
        visibilityMode: 'normal',
        data: {
          loreNote: 'Catha is Exandria\'s primary moon, associated with the Moonweaver, Sehanine. Its cycle drifts between 29 and 39 days.',
          deity: 'Sehanine (The Moonweaver)',
        },
      },
      {
        key: 'ruidus',
        name: 'Ruidus',
        title: 'The Bloody Eye',
        color: '#8B0000',
        associatedMonth: null,
        phaseMode: 'always_full_when_visible',
        cycleMode: 'seeded_drift_triangular',
        baseCycleDays: 164,
        cycleFormula: '164 + 1d20 - 1d20',
        visibilityMode: 'visible_window',
        data: {
          loreNote: 'Ruidus is a small reddish-purple moon shrouded in mystery. It appears full when visible and is considered an ill omen. Its true nature is connected to Predathos.',
          visibilityWindowDays: 14,
        },
      },
    ],
  },

  eventPacks: [
    {
      key: 'exandria_holidays',
      label: 'Exandrian Holidays',
      events: [
        { name: 'New Dawn',          month: 1,  day: 1,  color: '#FFD700', source: 'exandria' },
        { name: 'Hillsgold',         month: 1,  day: 27, color: '#DAA520', source: 'exandria' },
        { name: 'Day of Challenging', month: 3,  day: 7,  color: '#CD5C5C', source: 'exandria' },
        { name: 'Harvest\'s Close',   month: 8,  day: 3,  color: '#F4A261', source: 'exandria' },
        { name: 'Zenith',            month: 7,  day: 26, color: '#FFD700', source: 'exandria' },
        { name: 'The Crystalheart',  month: 11, day: 11, color: '#87CEEB', source: 'exandria' },
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
