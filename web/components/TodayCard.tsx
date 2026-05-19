/**
 * Today card — v1 MVP.
 *
 * Renders the campaign's current in-world date with stub placeholders
 * for weather / moons / planes / events. The full subsystem renders
 * land in subsequent commits; the layout + token application is what's
 * being proven here.
 */

import { useCampaign } from '../lib/campaignContext';
import { getWorld } from '../lib/worldRegistry';

export function TodayCard() {
  const { campaign } = useCampaign();
  if (!campaign) return null;

  const world = getWorld(campaign.worldId);

  return (
    <article
      className="rounded-xl border shadow-sm"
      style={{
        background: 'var(--pb-bg-raised)',
        borderColor: 'var(--pb-border)',
        boxShadow: 'var(--pb-shadow-card)',
      }}
    >
      <header
        className="flex items-baseline justify-between border-b px-6 py-4"
        style={{ borderColor: 'var(--pb-border-subtle)' }}
      >
        <div>
          <div
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--pb-text-tertiary)' }}
          >
            {world?.label ?? campaign.worldId}
          </div>
          <h2
            className="font-display text-2xl font-semibold"
            style={{ color: 'var(--pb-text-primary)' }}
          >
            {/* TODO: render formatted in-world date via shared core */}
            Day {campaign.currentSerial.toLocaleString()}
          </h2>
        </div>
        <div
          className="text-right text-sm"
          style={{ color: 'var(--pb-text-secondary)' }}
        >
          <div className="font-mono">
            {String(campaign.currentHour).padStart(2, '0')}:00
          </div>
          <div
            className="text-xs"
            style={{ color: 'var(--pb-text-tertiary)' }}
          >
            in-world time
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stub label="Weather" />
        <Stub label="Moons" />
        <Stub label="Planes" />
        <Stub label="Events" />
      </div>

      <footer
        className="border-t px-6 py-3 text-xs"
        style={{
          borderColor: 'var(--pb-border-subtle)',
          color: 'var(--pb-text-tertiary)',
        }}
      >
        View: <span style={{ color: 'var(--pb-accent)' }}>{campaign.viewMode === 'gm' ? 'GM' : 'Player'}</span>
        {' · '}
        Layer toggles, weather/moon/planar detail, and event editor land in the
        next commit pass.
      </footer>
    </article>
  );
}

function Stub({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        {label}
      </div>
      <div
        className="text-sm"
        style={{ color: 'var(--pb-text-secondary)' }}
      >
        Coming next pass.
      </div>
    </div>
  );
}
