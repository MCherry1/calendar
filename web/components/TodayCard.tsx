/**
 * Today card — real subsystem render.
 *
 * Pulls formatted date, time-of-day bucket, moon phases (with the
 * world's full moon list), and today's events from the shared core
 * via web/lib/core/bridge.ts.
 *
 * Weather + planar status panels remain stubs pending the next pass —
 * they're the heaviest subsystems to wrap and want their own commit.
 */

import { useMemo } from 'react';
import { useCampaign } from '../lib/campaignContext';
import { getWorld } from '../lib/worldRegistry';
import {
  formatDate,
  getEventsToday,
  getMoonsToday,
  getTimeOfDay,
  type MoonInfo,
  type EventInfo,
} from '../lib/core/bridge';

export function TodayCard() {
  const { campaign } = useCampaign();
  if (!campaign) return null;

  const world = getWorld(campaign.worldId);
  const today = useMemo(
    () => {
      const dateLabel = formatDate(campaign.worldId, campaign.currentSerial);
      const time = getTimeOfDay(campaign.currentHour);
      const moons = getMoonsToday(campaign.worldId, campaign.currentSerial);
      const events = getEventsToday(campaign.worldId, campaign.currentSerial);
      return { dateLabel, time, moons, events };
    },
    [campaign.worldId, campaign.currentSerial, campaign.currentHour],
  );

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
        className="flex items-start justify-between gap-4 border-b px-6 py-5"
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
            className="font-display text-2xl font-semibold leading-tight sm:text-3xl"
            style={{ color: 'var(--pb-text-primary)' }}
          >
            {today.dateLabel}
          </h2>
        </div>
        <div
          className="text-right text-sm"
          style={{ color: 'var(--pb-text-secondary)' }}
        >
          <div className="font-mono text-base">{today.time.hourLabel}</div>
          <div
            className="text-xs"
            style={{ color: 'var(--pb-text-tertiary)' }}
          >
            {today.time.bucketLabel}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
        <MoonsPanel moons={today.moons} />
        <EventsPanel events={today.events} />
        <StubPanel
          label="Weather"
          note="Wraps the location-based weather generator next pass."
        />
        <StubPanel
          label="Planes"
          note="Coterminous / remote planar phases land with the planar wheel."
        />
      </div>

      <footer
        className="border-t px-6 py-3 text-xs"
        style={{
          borderColor: 'var(--pb-border-subtle)',
          color: 'var(--pb-text-tertiary)',
        }}
      >
        View:{' '}
        <span style={{ color: 'var(--pb-accent)' }}>
          {campaign.viewMode === 'gm' ? 'GM' : 'Player'}
        </span>
        {' · '}
        Layer toggles, weather/planar detail, and the year-at-a-glance grid
        land in the next passes.
      </footer>
    </article>
  );
}

// ───────────────────────────────────────────────────────────────────
// Moons
// ───────────────────────────────────────────────────────────────────

function MoonsPanel({ moons }: { moons: MoonInfo[] }) {
  if (!moons.length) {
    return (
      <Panel label={`Moons (0)`}>
        <div className="text-sm" style={{ color: 'var(--pb-text-tertiary)' }}>
          This world has no tracked moons.
        </div>
      </Panel>
    );
  }
  return (
    <Panel label={`Moons (${moons.length})`}>
      <ul className="flex flex-col gap-2">
        {moons.map((m) => (
          <li key={m.name} className="flex items-center gap-3">
            <MoonGlyph moon={m} />
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-sm font-medium"
                style={{ color: 'var(--pb-text-primary)' }}
              >
                {m.name}
                {m.title && (
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: 'var(--pb-text-tertiary)' }}
                  >
                    {m.title}
                  </span>
                )}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--pb-text-secondary)' }}
              >
                {m.phaseLabel} · {Math.round(m.illumination * 100)}% illuminated
                {m.longShadows && (
                  <span
                    className="ml-1 rounded px-1 text-[10px] uppercase tracking-wider"
                    style={{
                      background: 'var(--pb-ember-faint)',
                      color: 'var(--pb-ember)',
                    }}
                  >
                    Long Shadows
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function MoonGlyph({ moon }: { moon: MoonInfo }) {
  // Approximate a moon-phase glyph: a disc with a "shadow" arc rendered
  // as a clip-path. illumination = 1 → full disc; 0 → invisible.
  // Uses CSS conic-gradient so it scales with font size.
  const color = moon.color ?? 'var(--pb-text-secondary)';
  const illum = Math.max(0, Math.min(1, moon.illumination));
  // Render as: lit portion in moon color, unlit in deep bg.
  // For simplicity, use a two-stop conic gradient at the equator.
  // Waxing: lit on right. Waning: lit on left.
  const stops = phaseGradient(illum, moon.waxing);
  return (
    <div
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 rounded-full border"
      style={{
        background: stops,
        borderColor: 'var(--pb-border-subtle)',
        boxShadow: `0 0 8px ${color}33`,
      }}
      title={`${moon.name}: ${moon.phaseLabel}`}
    />
  );
}

function phaseGradient(illum: number, waxing: boolean): string {
  // Very simple visual: light arc on one side. Not astronomically perfect
  // (real moon phase is a terminator curve, not a flat split), but enough
  // to read at a glance. Real arc will come with SVG/canvas in a later pass.
  const lit = 'var(--pb-text-primary)';
  const dark = 'var(--pb-bg-deep)';
  if (illum >= 0.97) return lit;
  if (illum <= 0.03) return dark;
  const litPct = Math.round(illum * 100);
  if (waxing) {
    return `linear-gradient(90deg, ${dark} ${100 - litPct}%, ${lit} ${100 - litPct}%)`;
  }
  return `linear-gradient(90deg, ${lit} ${litPct}%, ${dark} ${litPct}%)`;
}

// ───────────────────────────────────────────────────────────────────
// Events
// ───────────────────────────────────────────────────────────────────

function EventsPanel({ events }: { events: EventInfo[] }) {
  if (!events.length) {
    return (
      <Panel label="Events (0)">
        <div className="text-sm" style={{ color: 'var(--pb-text-tertiary)' }}>
          Nothing notable on this date.
        </div>
      </Panel>
    );
  }
  return (
    <Panel label={`Events (${events.length})`}>
      <ul className="flex flex-col gap-2">
        {events.map((e, i) => (
          <li key={`${e.name}-${i}`} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: e.color ?? 'var(--pb-accent)' }}
            />
            <div className="min-w-0 flex-1">
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--pb-text-primary)' }}
              >
                {e.name}
              </div>
              {(e.source || e.description) && (
                <div
                  className="text-xs"
                  style={{ color: 'var(--pb-text-tertiary)' }}
                >
                  {e.description ?? e.source}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ───────────────────────────────────────────────────────────────────
// Layout primitives
// ───────────────────────────────────────────────────────────────────

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}

function StubPanel({ label, note }: { label: string; note: string }) {
  return (
    <Panel label={label}>
      <div
        className="rounded-md border border-dashed px-3 py-3 text-xs italic"
        style={{
          borderColor: 'var(--pb-border)',
          color: 'var(--pb-text-tertiary)',
        }}
      >
        {note}
      </div>
    </Panel>
  );
}
