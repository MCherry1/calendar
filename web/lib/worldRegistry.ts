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

export const DEFAULT_WORLD_KEY = 'eberron';
