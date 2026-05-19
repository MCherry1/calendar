/**
 * Year-at-a-glance grid — 12 month cards laid out responsively, with
 * year navigation and a layer toggle bar above. Clicking a day jumps
 * the campaign's currentSerial to that date so the today card above
 * reflects it.
 *
 * Smooth navigation (animated month / year transitions via View
 * Transitions API) lands in the (c) pass.
 */

import { useMemo, useState } from 'react';
import { useCampaign } from '../lib/campaignContext';
import { decomposeSerial, getYearGrid } from '../lib/core/bridge';
import { withViewTransition } from '../lib/viewTransition';
import { LayerToggleBar } from './LayerToggleBar';
import { MonthCard } from './MonthCard';
import { getWorld } from '../lib/worldRegistry';

export function YearGrid() {
  const { campaign, layers, setCampaign } = useCampaign();
  // Local year state so the user can browse other years without losing the
  // campaign's "today." Initialized from the campaign's current year and
  // re-synced whenever the campaign serial moves outside the viewed year.
  const todayYear = useMemo(
    () =>
      campaign
        ? decomposeSerial(campaign.worldId, campaign.currentSerial).year
        : 0,
    [campaign?.worldId, campaign?.currentSerial],
  );
  const [viewYear, setViewYear] = useState<number>(todayYear);

  if (!campaign || !layers) return null;

  const world = getWorld(campaign.worldId);

  const months = useMemo(
    () =>
      getYearGrid(campaign.worldId, viewYear, {
        events: layers.events,
        lunarPhases: layers.lunarPhases,
      }),
    [campaign.worldId, viewYear, layers.events, layers.lunarPhases],
  );

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--pb-text-primary)' }}
          >
            Year {viewYear}
            {world?.label && (
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: 'var(--pb-text-tertiary)' }}
              >
                {world.label}
              </span>
            )}
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--pb-text-secondary)' }}
          >
            Click any day to jump there. Layers above control overlays.
          </p>
        </div>
        <YearNav
          year={viewYear}
          todayYear={todayYear}
          onChange={setViewYear}
        />
      </header>

      <LayerToggleBar />

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        style={{ viewTransitionName: 'year-grid' }}
      >
        {months.map((m) => (
          <MonthCard
            key={m.monthIndex}
            month={m}
            todaySerial={campaign.currentSerial}
            onDayClick={(serial) =>
              withViewTransition(() => setCampaign({ currentSerial: serial }))
            }
          />
        ))}
      </div>
    </section>
  );
}

function YearNav({
  year,
  todayYear,
  onChange,
}: {
  year: number;
  todayYear: number;
  onChange: (y: number) => void;
}) {
  const jump = (y: number) => withViewTransition(() => onChange(y));
  return (
    <div className="flex items-center gap-1">
      <NavButton onClick={() => jump(year - 1)} ariaLabel="Previous year">
        ‹
      </NavButton>
      <input
        type="number"
        value={year}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) jump(n);
        }}
        className="w-20 rounded-md border bg-transparent px-2 py-1 text-center font-mono text-sm"
        style={{
          background: 'var(--pb-bg-elevated)',
          borderColor: 'var(--pb-border)',
          color: 'var(--pb-text-primary)',
        }}
      />
      <NavButton onClick={() => jump(year + 1)} ariaLabel="Next year">
        ›
      </NavButton>
      {year !== todayYear && (
        <button
          type="button"
          onClick={() => jump(todayYear)}
          className="ml-2 rounded-md px-2 py-1 text-xs font-medium"
          style={{
            background: 'var(--pb-accent-faint)',
            color: 'var(--pb-accent)',
          }}
        >
          Back to today ({todayYear})
        </button>
      )}
    </div>
  );
}

function NavButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center rounded-md border text-lg leading-none"
      style={{
        background: 'var(--pb-bg-elevated)',
        borderColor: 'var(--pb-border)',
        color: 'var(--pb-text-secondary)',
      }}
    >
      {children}
    </button>
  );
}
