/**
 * Toggle bar for the year-grid overlay layers.
 *
 * Each toggle controls a piece of per-day data that the calendar grid
 * may surface. Toggles persist via CalendarStore (campaign context).
 * Disabled toggles are reserved for layers the bridge doesn't compute
 * yet (weather, planar, birthdays) — UI shape is in place so the
 * follow-up passes drop in without layout churn.
 */

import { useCampaign } from '../lib/campaignContext';
import type { LayerPrefs } from '../lib/store/CalendarStore';

interface ToggleDef {
  key: keyof LayerPrefs;
  label: string;
  hint: string;
  enabled: boolean;
}

const TOGGLES: ToggleDef[] = [
  { key: 'events',       label: 'Events',        hint: 'Holiday + custom events as colored dots', enabled: true },
  { key: 'lunarPhases',  label: 'Lunar phases',  hint: 'Full / new moon peaks as glyphs',          enabled: true },
  { key: 'weather',      label: 'Weather',       hint: 'Temperature heatmap (coming next pass)',   enabled: false },
  { key: 'planarPhases', label: 'Planar phases', hint: 'Coterminous / remote markers (later)',     enabled: false },
  { key: 'birthdays',    label: 'Birthdays',     hint: 'NPC birthdays via entity graph (later)',   enabled: false },
];

export function LayerToggleBar() {
  const { layers, setLayers } = useCampaign();
  if (!layers) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
      style={{
        background: 'var(--pb-bg-raised)',
        borderColor: 'var(--pb-border)',
      }}
    >
      <span
        className="mr-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        Layers
      </span>
      {TOGGLES.map((t) => {
        const active = layers[t.key];
        const interactive = t.enabled;
        return (
          <button
            key={t.key}
            type="button"
            disabled={!interactive}
            title={t.hint}
            onClick={() =>
              interactive && setLayers({ [t.key]: !active } as Partial<LayerPrefs>)
            }
            className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed"
            style={{
              background: active && interactive
                ? 'var(--pb-accent)'
                : 'var(--pb-bg-elevated)',
              color: !interactive
                ? 'var(--pb-text-tertiary)'
                : active
                  ? 'var(--pb-text-on-accent)'
                  : 'var(--pb-text-secondary)',
              borderColor: active && interactive
                ? 'var(--pb-accent)'
                : 'var(--pb-border)',
              opacity: interactive ? 1 : 0.55,
            }}
          >
            {t.label}
            {!interactive && (
              <span
                className="ml-1.5 text-[10px] uppercase tracking-wider"
                style={{ opacity: 0.7 }}
              >
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
