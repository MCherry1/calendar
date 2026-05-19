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
 * Best-effort probe: returns the campaignId from the URL if PartyBuffStore
 * is viable for this page load (campaign param present AND server confirms
 * access). Returns null otherwise so the caller can fall back to LocalStore.
 *
 * Why fetch-to-probe instead of relying on a session cookie check?
 * 1. The calendar runs in two contexts: standalone (no party-buff cookies)
 *    and proxied through partybuff.com (cookies present). The probe is the
 *    same code path in both.
 * 2. A 401 / 403 cleanly tells us "not authed for this campaign" — same
 *    fallback behavior whether the user is signed out or signed in to
 *    someone else's account.
 */
export async function detectPartyBuffCampaignId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('campaign');
  if (!id) return null;
  try {
    const res = await fetch(
      `/api/campaigns/${encodeURIComponent(id)}/state/calendar_state`,
      { credentials: 'include' },
    );
    if (res.ok) return id;
  } catch {
    /* network error → fall through to anonymous */
  }
  return null;
}
