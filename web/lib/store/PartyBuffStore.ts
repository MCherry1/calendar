/**
 * Server-backed CalendarStore — talks to the party-buff campaign API.
 *
 * Used when:
 *   - The calendar is rendering at partybuff.com/calendar/ (proxied,
 *     so session cookies for partybuff.com are sent)
 *   - AND the URL contains ?campaign=<id>
 *   - AND the API confirms the user has access to that campaign
 *
 * Falls back to LocalStore otherwise (anonymous mode).
 *
 * Layer prefs stay in localStorage even when authed — they're personal
 * UI preferences, not campaign-shared state. Keeping that split local
 * means switching campaigns doesn't reset the user's toggle choices.
 */

import {
  DEFAULT_LAYER_PREFS,
  type CalendarStore,
  type CampaignSnapshot,
  type LayerPrefs,
} from './CalendarStore';

const LAYERS_KEY = 'pb-cal:layers:v1';

function readLocalJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function writeLocalJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export class PartyBuffStore implements CalendarStore {
  constructor(private readonly campaignId: string) {}

  private url(): string {
    return `/api/campaigns/${encodeURIComponent(this.campaignId)}/state/calendar_state`;
  }

  async getCampaign(): Promise<CampaignSnapshot> {
    const res = await fetch(this.url(), { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`PartyBuffStore.get failed: HTTP ${res.status}`);
    }
    const { data } = (await res.json()) as { data: CampaignSnapshot };
    return data;
  }

  async setCampaign(snapshot: CampaignSnapshot): Promise<void> {
    const res = await fetch(this.url(), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!res.ok) {
      throw new Error(`PartyBuffStore.set failed: HTTP ${res.status}`);
    }
  }

  async patchCampaign(
    patch: Partial<CampaignSnapshot>,
  ): Promise<CampaignSnapshot> {
    const res = await fetch(this.url(), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(`PartyBuffStore.patch failed: HTTP ${res.status}`);
    }
    const { data } = (await res.json()) as { data: CampaignSnapshot };
    return data;
  }

  async getLayerPrefs(): Promise<LayerPrefs> {
    return readLocalJSON(LAYERS_KEY, DEFAULT_LAYER_PREFS);
  }

  async setLayerPrefs(prefs: LayerPrefs): Promise<void> {
    writeLocalJSON(LAYERS_KEY, prefs);
  }
}

/**
 * Best-effort probe: returns the campaignId PartyBuffStore should use
 * for this page load, or null so the caller falls back to LocalStore.
 *
 * Resolution order:
 *   1. ?campaign=<id> in the URL — explicit override (e.g. a deep link
 *      from the campaigns page). Wins if present and accessible.
 *   2. The signed-in user's active campaign (GET /api/me) — the normal
 *      path once the header campaign-switcher is in use.
 *
 * Either way the candidate is confirmed by fetching its calendar_state;
 * a 401/403/404 means "not accessible" → fall through to anonymous.
 *
 * Works identically whether the calendar is hit standalone (no
 * party-buff cookies → everything fails → LocalStore) or proxied
 * through partybuff.com (cookies present).
 */
export async function detectPartyBuffCampaignId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Explicit URL override.
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('campaign');
  if (urlId && (await canAccessCampaign(urlId))) return urlId;

  // 2. The user's active campaign.
  try {
    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (meRes.ok) {
      const { user } = (await meRes.json()) as {
        user?: { activeCampaignId?: string | null };
      };
      const activeId = user?.activeCampaignId;
      if (activeId && (await canAccessCampaign(activeId))) return activeId;
    }
  } catch {
    /* not signed in / standalone → anonymous */
  }
  return null;
}

async function canAccessCampaign(id: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/campaigns/${encodeURIComponent(id)}/state/calendar_state`,
      { credentials: 'include' },
    );
    return res.ok;
  } catch {
    return false;
  }
}
