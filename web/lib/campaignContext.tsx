/**
 * React context wrapping the CalendarStore. Components read/write the
 * current campaign + layer prefs through this hook; nothing in UI code
 * touches localStorage or the API directly.
 *
 * Store selection:
 *   - If ?campaign=<id> is in the URL AND the server confirms access,
 *     use PartyBuffStore (server-backed via party-buff D1).
 *   - Otherwise use LocalStore (localStorage, anonymous mode).
 *
 * The selection runs once on mount; switching campaigns requires a
 * page load with a different ?campaign param. That's intentional —
 * keeps the store stable for the lifetime of the calendar session.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type CalendarStore,
  type CampaignSnapshot,
  type LayerPrefs,
} from './store/CalendarStore';
import { LocalStore } from './store/LocalStore';
import {
  PartyBuffStore,
  detectPartyBuffCampaignId,
} from './store/PartyBuffStore';
import { getWorldDefaultDate } from './worldRegistry';
import { serialForDate } from './core/bridge';

/**
 * Resolve the canonical starting serial for a world — its in-canon
 * "current" date. Falls back to serial 0 only if the world has no
 * default date (shouldn't happen for any shipped world).
 */
function canonicalSerial(worldId: string): number {
  const def = getWorldDefaultDate(worldId);
  if (!def) return 0;
  return serialForDate(worldId, def.year, def.monthIndex, def.day);
}

export type StoreMode = 'local' | 'partybuff' | 'unresolved';

interface CampaignContextValue {
  campaign: CampaignSnapshot | null;
  layers: LayerPrefs | null;
  loading: boolean;
  mode: StoreMode;
  /** Set when mode === 'partybuff'. Useful for UI affordances ("Saving to
   *  campaign…", "Signed in as DM of <name>", etc.) once we wire them. */
  partyBuffCampaignId: string | null;
  setCampaign(patch: Partial<CampaignSnapshot>): Promise<void>;
  setLayers(patch: Partial<LayerPrefs>): Promise<void>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

interface CampaignProviderProps {
  /** Override the auto-selected store. Useful for tests + Storybook. */
  store?: CalendarStore;
  children: ReactNode;
}

export function CampaignProvider({ store, children }: CampaignProviderProps) {
  const [resolvedStore, setResolvedStore] = useState<CalendarStore | null>(
    store ?? null,
  );
  const [mode, setMode] = useState<StoreMode>(store ? 'local' : 'unresolved');
  const [partyBuffCampaignId, setPartyBuffCampaignId] = useState<string | null>(
    null,
  );

  const [campaign, setCampaignState] = useState<CampaignSnapshot | null>(null);
  const [layers, setLayersState] = useState<LayerPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  // Store selection: probe the URL + API once on mount.
  useEffect(() => {
    if (store) return; // explicit override; skip probe
    let cancelled = false;
    (async () => {
      const id = await detectPartyBuffCampaignId();
      if (cancelled) return;
      if (id) {
        setPartyBuffCampaignId(id);
        setMode('partybuff');
        setResolvedStore(new PartyBuffStore(id));
      } else {
        setMode('local');
        setResolvedStore(new LocalStore());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Once the store is selected, load the campaign + layer prefs.
  useEffect(() => {
    if (!resolvedStore) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [c, l] = await Promise.all([
          resolvedStore.getCampaign(),
          resolvedStore.getLayerPrefs(),
        ]);
        if (cancelled) return;
        // currentSerial 0 = uninitialized sentinel (fresh campaign, or a
        // pre-fix stored campaign). Compute the world's canonical "now"
        // and persist it so every world starts in its own present.
        if (!c.currentSerial || c.currentSerial <= 0) {
          const initialized: CampaignSnapshot = {
            ...c,
            currentSerial: canonicalSerial(c.worldId),
          };
          await resolvedStore.setCampaign(initialized);
          if (cancelled) return;
          setCampaignState(initialized);
        } else {
          setCampaignState(c);
        }
        setLayersState(l);
      } catch (err) {
        // If PartyBuffStore fails (e.g. session expired mid-session),
        // fall back to LocalStore so the UI doesn't get stuck.
        if (!cancelled && resolvedStore instanceof PartyBuffStore) {
          console.warn('PartyBuffStore failed, falling back to LocalStore:', err);
          setMode('local');
          setResolvedStore(new LocalStore());
          return;
        }
        if (!cancelled) console.error('Calendar store failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedStore]);

  const setCampaign = useCallback(
    async (patch: Partial<CampaignSnapshot>) => {
      if (!resolvedStore) return;
      // Changing world without an explicit serial: reset to the new
      // world's canonical "now" rather than carrying the old world's
      // serial (which would map to an arbitrary date in the new calendar).
      let effectivePatch = patch;
      if (
        patch.worldId &&
        patch.worldId !== campaign?.worldId &&
        patch.currentSerial === undefined
      ) {
        effectivePatch = {
          ...patch,
          currentSerial: canonicalSerial(patch.worldId),
        };
      }
      const next = await resolvedStore.patchCampaign(effectivePatch);
      setCampaignState(next);
    },
    [resolvedStore, campaign?.worldId],
  );

  const setLayers = useCallback(
    async (patch: Partial<LayerPrefs>) => {
      if (!resolvedStore || !layers) return;
      const next = { ...layers, ...patch };
      await resolvedStore.setLayerPrefs(next);
      setLayersState(next);
    },
    [resolvedStore, layers],
  );

  const value: CampaignContextValue = {
    campaign,
    layers,
    loading,
    mode,
    partyBuffCampaignId,
    setCampaign,
    setLayers,
  };

  return (
    <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>
  );
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaign must be used within <CampaignProvider>');
  }
  return ctx;
}
