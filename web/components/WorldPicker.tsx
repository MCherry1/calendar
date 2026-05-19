import { useMemo } from 'react';
import { useCampaign } from '../lib/campaignContext';
import { listWorlds } from '../lib/worldRegistry';

export function WorldPicker() {
  const { campaign, setCampaign } = useCampaign();
  const worlds = useMemo(() => listWorlds(), []);

  if (!campaign) return null;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-4"
      style={{
        background: 'var(--pb-bg-raised)',
        borderColor: 'var(--pb-border)',
      }}
    >
      <label
        htmlFor="world-picker"
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        World
      </label>
      <select
        id="world-picker"
        value={campaign.worldId}
        onChange={(e) => setCampaign({ worldId: e.target.value })}
        className="w-full max-w-md rounded-md border bg-transparent px-3 py-2 text-base"
        style={{
          background: 'var(--pb-bg-elevated)',
          borderColor: 'var(--pb-border)',
          color: 'var(--pb-text-primary)',
        }}
      >
        {worlds.map((w) => (
          <option key={w.key} value={w.key} style={{ background: 'var(--pb-bg-elevated)' }}>
            {w.label}
          </option>
        ))}
      </select>
      <p
        className="text-sm"
        style={{ color: 'var(--pb-text-secondary)' }}
      >
        {worlds.find((w) => w.key === campaign.worldId)?.description ??
          'Select a world to view its calendar.'}
      </p>
    </div>
  );
}
