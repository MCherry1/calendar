/**
 * localStorage-backed implementation of CalendarStore for the v1
 * standalone calendar. Synchronous under the hood; the async surface
 * mirrors what a future server-backed store will need.
 *
 * Keys are namespaced with `pb-cal:` so they don't collide with other
 * Party Buff sub-apps that might share an origin during dev.
 */

import {
  type CalendarStore,
  type CampaignSnapshot,
  type LayerPrefs,
  DEFAULT_LAYER_PREFS,
} from './CalendarStore';
import { DEFAULT_WORLD_KEY } from '../worldRegistry';

const KEY_CAMPAIGN = 'pb-cal:campaign:v1';
const KEY_LAYERS = 'pb-cal:layers:v1';

const DEFAULT_CAMPAIGN: CampaignSnapshot = {
  worldId: DEFAULT_WORLD_KEY,
  // 335,328 = Eberron's canonical "year 998 YK, 1 Zarantyr" (998 × 336
  // days/year). Starting here keeps the default close to every moon's
  // epoch reference date so phase math gives real values without
  // tripping _generateStandardSequence's iteration caps — see the
  // bridge for the long-range moon-sequence bug note.
  currentSerial: 335_328,
  currentHour: 9,
  viewMode: 'gm',
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / private-mode failures are non-fatal — the UI keeps running
    // with the in-memory value; user just loses persistence this session.
  }
}

export class LocalStore implements CalendarStore {
  async getCampaign(): Promise<CampaignSnapshot> {
    return readJSON(KEY_CAMPAIGN, DEFAULT_CAMPAIGN);
  }

  async setCampaign(snapshot: CampaignSnapshot): Promise<void> {
    writeJSON(KEY_CAMPAIGN, snapshot);
  }

  async patchCampaign(patch: Partial<CampaignSnapshot>): Promise<CampaignSnapshot> {
    const current = await this.getCampaign();
    const next = { ...current, ...patch };
    await this.setCampaign(next);
    return next;
  }

  async getLayerPrefs(): Promise<LayerPrefs> {
    return readJSON(KEY_LAYERS, DEFAULT_LAYER_PREFS);
  }

  async setLayerPrefs(prefs: LayerPrefs): Promise<void> {
    writeJSON(KEY_LAYERS, prefs);
  }
}
