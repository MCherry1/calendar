/**
 * React context wrapping the CalendarStore. Components read/write the
 * current campaign + layer prefs through this hook; nothing in UI code
 * touches localStorage directly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type CalendarStore,
  type CampaignSnapshot,
  type LayerPrefs,
} from './store/CalendarStore';
import { LocalStore } from './store/LocalStore';

interface CampaignContextValue {
  campaign: CampaignSnapshot | null;
  layers: LayerPrefs | null;
  loading: boolean;
  setCampaign(patch: Partial<CampaignSnapshot>): Promise<void>;
  setLayers(patch: Partial<LayerPrefs>): Promise<void>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

interface CampaignProviderProps {
  store?: CalendarStore;
  children: ReactNode;
}

export function CampaignProvider({ store, children }: CampaignProviderProps) {
  // Lazy-construct so the default store doesn't run during SSR if it ever does.
  const resolvedStore = useMemo(() => store ?? new LocalStore(), [store]);

  const [campaign, setCampaignState] = useState<CampaignSnapshot | null>(null);
  const [layers, setLayersState] = useState<LayerPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, l] = await Promise.all([
        resolvedStore.getCampaign(),
        resolvedStore.getLayerPrefs(),
      ]);
      if (cancelled) return;
      setCampaignState(c);
      setLayersState(l);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedStore]);

  const setCampaign = useCallback(
    async (patch: Partial<CampaignSnapshot>) => {
      const next = await resolvedStore.patchCampaign(patch);
      setCampaignState(next);
    },
    [resolvedStore],
  );

  const setLayers = useCallback(
    async (patch: Partial<LayerPrefs>) => {
      const current = layers;
      if (!current) return;
      const next = { ...current, ...patch };
      await resolvedStore.setLayerPrefs(next);
      setLayersState(next);
    },
    [resolvedStore, layers],
  );

  const value: CampaignContextValue = {
    campaign,
    layers,
    loading,
    setCampaign,
    setLayers,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaign must be used within <CampaignProvider>');
  }
  return ctx;
}
