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
import { MOON_SYSTEMS, moonPhaseAt } from '@core/moon.js';
import { getEventsFor } from '@core/events.js';
import { TIME_OF_DAY_BUCKETS } from '@core/time-of-day.js';

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
    _activeWorldId = worldId;
    _activeYear = null;
  }
  // The core's date-formatters read getCal().current for the year context
  // (era labels, leap-year selection). Keep it in sync with the campaign
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
// Active settings (for the GM/Player view, etc.)
// ───────────────────────────────────────────────────────────────────

export function getActiveSettings() {
  ensureBoot();
  return ensureSettings();
}
