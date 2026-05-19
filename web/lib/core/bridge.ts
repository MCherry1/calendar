/**
 * Bridge to the shared core (src/).
 *
 * The core was written for the Roll20 sandbox: it reads from a global
 * `state` object and assumes a single active campaign. To consume it
 * from the web app, we initialize that global on first use and switch
 * the active world via the core's own setters. UI never sees this
 * machinery — it talks to the typed functions exported below.
 *
 * Single-campaign caveat: because the underlying state is global, only
 * one campaign can be active per page load. That matches the v1
 * LocalStore (one campaign per browser). When PartyBuffStore arrives,
 * either we tear down + reinit between campaign switches, or we lift
 * the core off its global. Punted for now.
 */

import { applyCalendarSystem, checkInstall, ensureSettings } from '@core/state.js';
import { fromSerial } from '@core/date-math.js';
import { formalDateLabelFromSerial } from '@core/ui.js';
import {
  MOON_SYSTEMS,
  _moonPeakPhaseDay,
  moonEnsureSequences,
  moonPhaseAt,
} from '@core/moon.js';
import { getEventsFor } from '@core/events.js';
import { buildCalendarPreview } from '@core/showcase/calendar-preview.js';
import {
  daysBeforeWorldSlot,
  daysBeforeWorldYear,
  getWorldRegularMonthSlots,
  regularMonthIndexToSlotIndex,
} from '@core/showcase/world-calendar.js';
import { TIME_OF_DAY_BUCKETS } from '@core/time-of-day.js';
import {
  PLANE_DATA,
  PLANE_PHASE_LABELS,
  getPlanarState,
} from '@core/planes.js';
import {
  _forecastRecord,
  _weatherPrimaryValues,
  _weatherPrimaryFog,
  _deriveConditions,
  _conditionsNarrative,
  _normalizeWeatherLocation,
  _weatherTempLabel,
  WEATHER_PRIMARY_PERIOD,
  getWeatherState,
  weatherEnsureForecast,
} from '@core/weather.js';
import { LABELS } from '@core/constants.js';
import { WORLDS } from '@core/worlds/index.js';

let _booted = false;
let _activeWorldId: string | null = null;
let _activeYear: number | null = null;

function ensureBoot(): void {
  if (_booted) return;
  const g = globalThis as any;
  if (!g.state) g.state = {};
  checkInstall();
  _booted = true;
}

function activate(worldId: string, serial: number): void {
  ensureBoot();
  if (_activeWorldId !== worldId) {
    applyCalendarSystem(worldId);
    // Era label is a module-level mutable; reset it from the world def
    // so a switch from Eberron ("YK") to Gregorian doesn't leave "YK"
    // on Gregorian dates.
    const world = (WORLDS as any)[worldId];
    if (world?.eraLabel) LABELS.era = world.eraLabel;
    _activeWorldId = worldId;
    _activeYear = null;
  }
  // The core's date-formatters read getCal().current for the year context
  // (leap-year selection, era display). Keep it in sync with the campaign
  // serial whenever year-equivalent changes.
  const { year } = fromSerial(serial);
  if (year !== _activeYear) {
    const g = globalThis as any;
    const cal = g.state.CALENDAR.calendar;
    if (cal && cal.current) cal.current.year = year;
    _activeYear = year;
  }
}

// ───────────────────────────────────────────────────────────────────
// Formatted date label
// ───────────────────────────────────────────────────────────────────

export function formatDate(worldId: string, serial: number): string {
  activate(worldId, serial);
  return formalDateLabelFromSerial(serial);
}

/** Activates the world (so leap-year selection etc. is correct) and then
 *  returns the calendar-aware { year, monthIndex, day } for a serial. */
export function decomposeSerial(
  worldId: string,
  serial: number,
): { year: number; monthIndex: number; day: number } {
  activate(worldId, serial);
  const d = fromSerial(serial);
  return { year: d.year, monthIndex: d.mi, day: d.day };
}

// ───────────────────────────────────────────────────────────────────
// Time of day
// ───────────────────────────────────────────────────────────────────

export interface TimeOfDayInfo {
  bucketKey: string;
  bucketLabel: string;
  hourLabel: string; // "09:00"
}

export function getTimeOfDay(hour: number): TimeOfDayInfo {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const bucket =
    (TIME_OF_DAY_BUCKETS as any[]).find((b) => h >= b.startHour && h < b.endHour) ??
    TIME_OF_DAY_BUCKETS[TIME_OF_DAY_BUCKETS.length - 1];
  return {
    bucketKey: bucket.key,
    bucketLabel: bucket.label,
    hourLabel: `${String(h).padStart(2, '0')}:00`,
  };
}

// ───────────────────────────────────────────────────────────────────
// Moon phases for the current date
// ───────────────────────────────────────────────────────────────────

export interface MoonInfo {
  name: string;
  title?: string;
  color?: string;
  illumination: number; // 0–1
  waxing: boolean;
  phaseLabel: string;
  longShadows: boolean;
  plane?: string;
}

export function getMoonsToday(worldId: string, serial: number): MoonInfo[] {
  activate(worldId, serial);
  const sys = (MOON_SYSTEMS as any)[worldId];
  if (!sys || !Array.isArray(sys.moons)) return [];

  // moonPhaseAt reads from getMoonState().sequences[moonName]; that map
  // is empty until moonEnsureSequences populates it. Without this call
  // every moon reports the placeholder { illum: 0.5, waxing: true }.
  //
  // Known core limitation: _generateStandardSequence has MAX_REWIND=2000
  // and MAX_FWD=800 iteration caps. With a 27-day synodic period that's
  // ~60-150 years of coverage from a moon's epoch reference date. If
  // the campaign serial is far from the moon's epoch (e.g., Eberron's
  // year 998 → year 2083), generation silently returns empty events.
  // Default serials in LocalStore are tuned to avoid this; a proper
  // fix lives in src/moon.ts (replace the loops with closed-form
  // cycle arithmetic).
  moonEnsureSequences(serial);

  return sys.moons.map((m: any) => {
    const phase = moonPhaseAt(m.name, serial) ?? { illum: 0, waxing: false, longShadows: false };
    return {
      name: m.name,
      title: m.title,
      color: m.color,
      illumination: phase.illum,
      waxing: phase.waxing,
      phaseLabel: phaseLabelFor(phase.illum, phase.waxing),
      longShadows: !!phase.longShadows,
      plane: m.plane,
    };
  });
}

function phaseLabelFor(illum: number, waxing: boolean): string {
  if (illum >= 0.97) return 'Full';
  if (illum <= 0.03) return 'New';
  const stage = waxing ? 'Waxing' : 'Waning';
  if (illum < 0.4) return `${stage} Crescent`;
  if (illum < 0.6) return waxing ? 'First Quarter' : 'Third Quarter';
  return `${stage} Gibbous`;
}

// ───────────────────────────────────────────────────────────────────
// Events on the current date
// ───────────────────────────────────────────────────────────────────

export interface EventInfo {
  name: string;
  color?: string;
  source?: string;
  description?: string;
}

export function getEventsToday(worldId: string, serial: number): EventInfo[] {
  activate(worldId, serial);
  const { year, mi, day } = fromSerial(serial);
  const events = getEventsFor(mi, day, year) ?? [];
  return events.map((e: any) => ({
    name: e.name,
    color: e.color,
    source: e.source,
    description: e.description,
  }));
}

// ───────────────────────────────────────────────────────────────────
// Planar status for the current date
// ───────────────────────────────────────────────────────────────────

export type PlanarPhase = 'coterminous' | 'remote' | 'neutral' | string;

export interface PlaneInfo {
  name: string;
  title?: string;
  color?: string;
  phase: PlanarPhase;
  phaseLabel: string;
  type: 'cyclic' | 'fixed';
  daysIntoPhase: number | null;
  daysUntilNextPhase: number | null;
  phaseDuration: number | null;
  nextPhase?: PlanarPhase | null;
  effects?: string;
  note?: string;
  overridden: boolean;
}

export function getPlanesToday(worldId: string, serial: number): PlaneInfo[] {
  activate(worldId, serial);
  const planes = (PLANE_DATA as any)[worldId];
  if (!Array.isArray(planes)) return [];

  return planes.map((p: any) => {
    const state = getPlanarState(p.name, serial) ?? null;
    const phase = (state?.phase ?? 'neutral') as PlanarPhase;
    const effectsByPhase = p.effects ?? {};
    return {
      name: p.name,
      title: p.title,
      color: p.color,
      phase,
      phaseLabel: (PLANE_PHASE_LABELS as any)[phase] ?? phase,
      type: p.type,
      daysIntoPhase: state?.daysIntoPhase ?? null,
      daysUntilNextPhase: state?.daysUntilNextPhase ?? null,
      phaseDuration: state?.phaseDuration ?? null,
      nextPhase: state?.nextPhase ?? null,
      effects: effectsByPhase[phase],
      note: state?.note ?? p.note,
      overridden: !!state?.overridden,
    };
  });
}

// ───────────────────────────────────────────────────────────────────
// Weather for the current date
// ───────────────────────────────────────────────────────────────────

const DEFAULT_LOCATION = {
  climate: 'temperate',
  geography: 'inland',
  terrain: 'plains',
  name: 'A temperate inland plain',
} as const;

export interface WeatherInfo {
  available: boolean;
  narrative: string;
  tempBand: number; // 0–9 raw band
  tempLabel: string; // "Cool", "Mild", etc.
  precipBand: number; // 0–5
  windBand: number; // 0–5
  fogLevel: 'none' | 'light' | 'dense' | string;
  location: string;
}

export function getWeatherToday(worldId: string, serial: number): WeatherInfo {
  activate(worldId, serial);

  // Default the location to a temperate inland plain so weather "just works"
  // without a settings panel in v1. The user can override later when we add
  // a location picker.
  const ws = getWeatherState();
  if (!ws.location) {
    ws.location = _normalizeWeatherLocation({ ...DEFAULT_LOCATION });
  }

  try {
    weatherEnsureForecast();
    const rec = _forecastRecord(serial);
    const pv = _weatherPrimaryValues(rec);
    const fogOverride = _weatherPrimaryFog(rec);

    if (!pv) {
      return {
        available: false,
        narrative: 'Weather generator did not return a record for this date.',
        tempBand: 5,
        tempLabel: 'Mild',
        precipBand: 0,
        windBand: 0,
        fogLevel: 'none',
        location: ws.location?.name ?? 'unknown',
      };
    }

    const conditions = _deriveConditions(
      pv,
      ws.location ?? null,
      WEATHER_PRIMARY_PERIOD,
      !!rec?.snowAccumulated,
      fogOverride,
    );
    const narrative = _conditionsNarrative(pv, conditions, WEATHER_PRIMARY_PERIOD);

    return {
      available: true,
      narrative,
      tempBand: pv.temp ?? 5,
      tempLabel: _weatherTempLabel(pv.temp ?? 5),
      precipBand: pv.precip ?? 0,
      windBand: pv.wind ?? 0,
      fogLevel: conditions?.fog ?? 'none',
      location: ws.location?.name ?? 'unknown',
    };
  } catch (err) {
    return {
      available: false,
      narrative: `Weather unavailable: ${(err as Error).message ?? 'unknown error'}.`,
      tempBand: 5,
      tempLabel: 'Mild',
      precipBand: 0,
      windBand: 0,
      fogLevel: 'none',
      location: ws.location?.name ?? 'unknown',
    };
  }
}

// ───────────────────────────────────────────────────────────────────
// Active settings (for the GM/Player view, etc.)
// ───────────────────────────────────────────────────────────────────

export function getActiveSettings() {
  ensureBoot();
  return ensureSettings();
}

// ───────────────────────────────────────────────────────────────────
// Year-at-a-glance — month grids enriched with optional layer data
// ───────────────────────────────────────────────────────────────────

/** Layer flags that control which optional data each cell carries.
 *  When a flag is off the corresponding field is empty (saves the per-day
 *  bridge calls — for a 12-month year that's a meaningful win). */
export interface MonthGridLayers {
  events: boolean;
  lunarPhases: boolean;
}

export interface MonthGridDayCell {
  kind: 'day';
  day: number;
  serial: number;
  weekdayIndex: number;
  /** Events on this date — empty when the events layer is off. */
  events: EventInfo[];
  /** Names of moons that peak full on this date. */
  fullMoons: string[];
  /** Names of moons that peak new on this date. */
  newMoons: string[];
}

export interface MonthGridEmptyCell {
  kind: 'empty';
}

export type MonthGridCell = MonthGridDayCell | MonthGridEmptyCell;

export interface MonthGridInfo {
  monthName: string;
  monthIndex: number;
  year: number;
  daysInMonth: number;
  weekdayLabels: string[];
  cells: MonthGridCell[];
  /** Serial of day 1 in this month (useful for click handlers). */
  startSerial: number;
}

/** Pure (no global-state side effect) world-to-serial helper. */
export function serialForDate(
  worldId: string,
  year: number,
  monthIndex: number,
  day: number,
): number {
  const slotIndex = regularMonthIndexToSlotIndex(worldId, monthIndex);
  return (
    daysBeforeWorldYear(worldId, year) +
    daysBeforeWorldSlot(worldId, year, slotIndex) +
    (day - 1)
  );
}

/** Number of regular months in a world. Used by year-grid pagination. */
export function regularMonthCount(worldId: string): number {
  return getWorldRegularMonthSlots(worldId).length;
}

export function getMonthGrid(
  worldId: string,
  year: number,
  monthIndex: number,
  layers: MonthGridLayers,
): MonthGridInfo {
  const startSerial = serialForDate(worldId, year, monthIndex, 1);
  // Activate the world AND seed the year context so the core's getCal /
  // moon sequences operate on the right year. moonEnsureSequences gets a
  // serial that already lives in the year we're rendering.
  activate(worldId, startSerial);
  if (layers.lunarPhases) {
    moonEnsureSequences(startSerial);
  }

  const preview = buildCalendarPreview({ worldId, year, monthIndex });
  const sys = (MOON_SYSTEMS as any)[worldId];
  const moonNames: string[] =
    layers.lunarPhases && sys && Array.isArray(sys.moons)
      ? sys.moons.map((m: any) => m.name)
      : [];

  const cells: MonthGridCell[] = preview.cells.map((c) => {
    if (c.kind === 'empty') return { kind: 'empty' };
    const serial = startSerial + (c.day - 1);
    const events = layers.events ? getEventsToday(worldId, serial) : [];
    const fullMoons: string[] = [];
    const newMoons: string[] = [];
    for (const name of moonNames) {
      const peak = _moonPeakPhaseDay(name, serial);
      if (peak === 'full') fullMoons.push(name);
      else if (peak === 'new') newMoons.push(name);
    }
    return {
      kind: 'day',
      day: c.day,
      serial,
      weekdayIndex: c.weekdayIndex,
      events,
      fullMoons,
      newMoons,
    };
  });

  return {
    monthName: preview.monthName,
    monthIndex,
    year,
    daysInMonth: preview.daysInMonth,
    weekdayLabels: preview.weekdayLabels,
    cells,
    startSerial,
  };
}

/** Convenience: builds all regular-month grids for a year in one call. */
export function getYearGrid(
  worldId: string,
  year: number,
  layers: MonthGridLayers,
): MonthGridInfo[] {
  const count = regularMonthCount(worldId);
  const out: MonthGridInfo[] = [];
  for (let mi = 0; mi < count; mi++) {
    out.push(getMonthGrid(worldId, year, mi, layers));
  }
  return out;
}
