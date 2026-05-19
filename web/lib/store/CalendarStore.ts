/**
 * Persistence boundary for the calendar web app.
 *
 * Anything that needs to survive a page reload — current campaign date,
 * world selection, layer toggle preferences, event list — flows through
 * this interface. The v1 implementation (LocalStore) is localStorage-only,
 * so the app works standalone without auth. A future PartyBuffStore will
 * implement the same interface against the party-buff campaign API.
 *
 * UI code must not import localStorage / fetch / cookies directly. If you
 * find yourself wanting to, add the capability here first.
 */

export interface CampaignSnapshot {
  /** World key (e.g., 'eberron', 'faerunian'). Selected at campaign creation. */
  worldId: string;
  /** Current in-world serial date (days from world epoch). */
  currentSerial: number;
  /** Current in-world hour-of-day (0–23). */
  currentHour: number;
  /** GM vs Player view (knowledge tier). */
  viewMode: 'gm' | 'player';
}

export interface LayerPrefs {
  weather: boolean;
  events: boolean;
  lunarPhases: boolean;
  planarPhases: boolean;
  birthdays: boolean;
}

export interface CalendarStore {
  getCampaign(): Promise<CampaignSnapshot>;
  setCampaign(snapshot: CampaignSnapshot): Promise<void>;
  patchCampaign(patch: Partial<CampaignSnapshot>): Promise<CampaignSnapshot>;

  getLayerPrefs(): Promise<LayerPrefs>;
  setLayerPrefs(prefs: LayerPrefs): Promise<void>;
}

export const DEFAULT_LAYER_PREFS: LayerPrefs = {
  weather: true,
  events: true,
  lunarPhases: true,
  planarPhases: false,
  birthdays: true,
};
