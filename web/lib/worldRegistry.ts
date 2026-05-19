/**
 * Web-side typed accessor over the shared world catalog (`src/worlds/`).
 *
 * The shared core was originally written for the Roll20 build, where var
 * exports and loose types are the norm. This module is the boundary the
 * web app talks to — anything we surface to React components flows
 * through here, so refactors to the shared core don't ripple into UI.
 */

import { WORLDS, type WorldDefinition } from '@core/worlds/index.js';

export interface WorldSummary {
  key: string;
  label: string;
  description: string;
}

/** Compact list for pickers — alphabetized by label. */
export function listWorlds(): WorldSummary[] {
  return Object.values(WORLDS)
    .map((w) => ({
      key: w.key,
      label: w.label,
      description: w.description,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getWorld(key: string): WorldDefinition | null {
  return WORLDS[key] ?? null;
}

/**
 * The world's canonical "current" date (e.g., Eberron → 998 YK,
 * Faerûn → 1492 DR). Used to seed a fresh campaign so each world
 * starts on its own in-canon present rather than an arbitrary
 * serial mapped over from another world's calendar.
 *
 * `monthIndex` is a regular (0-based) month index — what serialForDate
 * in the bridge expects.
 */
export function getWorldDefaultDate(
  key: string,
): { year: number; monthIndex: number; day: number } | null {
  const w = WORLDS[key];
  if (!w || !w.defaultDate) return null;
  return {
    year: w.defaultDate.year,
    monthIndex: w.defaultDate.month,
    day: w.defaultDate.day,
  };
}

export const DEFAULT_WORLD_KEY = 'eberron';
