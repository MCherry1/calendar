/**
 * World Registry
 *
 * Central registry of all world definitions. Import a world by key or
 * iterate over the full set. This replaces the parallel lookups formerly
 * spread across CALENDAR_SYSTEMS, SEASON_SETS, MOON_SYSTEMS, and
 * DEFAULT_EVENTS / DEFAULT_EVENT_SOURCE_CALENDARS.
 */

import type { WorldDefinition } from './types.js';
import { eberron } from './eberron.js';
import { faerun } from './faerun.js';
import { gregorian } from './gregorian.js';
import { greyhawk } from './greyhawk.js';
import { dragonlance } from './dragonlance.js';
import { exandria } from './exandria.js';
import { mystara } from './mystara.js';
import { birthright } from './birthright.js';

export type { WorldDefinition } from './types.js';
export * from './types.js';

/** All registered worlds, keyed by WorldDefinition.key. */
export const WORLDS: Record<string, WorldDefinition> = {
  eberron,
  faerunian: faerun,
  gregorian,
  greyhawk,
  dragonlance,
  exandria,
  mystara,
  birthright,
};

/** Display-order list of world keys for menus and setup. */
export const WORLD_ORDER: string[] = [
  'eberron', 'faerunian', 'gregorian',
  'greyhawk', 'dragonlance', 'exandria', 'mystara', 'birthright',
];

/** Look up a world by key. Returns undefined if not found. */
export function getWorld(key: string): WorldDefinition | undefined {
  return WORLDS[key];
}

/**
 * Strategy helpers — check properties of the current world's calendar.
 * These accept a calendarSystem key (from settings) and return the
 * relevant strategy mode, falling back to Eberron defaults.
 */
import type { WeekdayProgressionMode, IntercalaryRenderMode, DateFormatStyle } from './types.js';

export function weekdayProgressionFor(sysKey: string): WeekdayProgressionMode {
  return WORLDS[sysKey]?.calendar.weekdayProgressionMode ?? 'continuous_serial';
}

export function intercalaryRenderFor(sysKey: string): IntercalaryRenderMode {
  return WORLDS[sysKey]?.calendar.intercalaryRenderMode ?? 'regular_grid';
}

export function dateFormatFor(sysKey: string): DateFormatStyle {
  return WORLDS[sysKey]?.calendar.dateFormatStyle ?? 'ordinal_of_month';
}

/** Check whether a world has a particular capability. */
export function worldHas(sysKey: string, cap: keyof import('./types.js').WorldCapabilities): boolean {
  const w = WORLDS[sysKey];
  return !!(w && w.capabilities[cap]);
}

/** Get the moon system definition for a world (if any). */
export function moonSystemFor(sysKey: string): import('./types.js').MoonSystemDefinition | undefined {
  return WORLDS[sysKey]?.moons;
}
