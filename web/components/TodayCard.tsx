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

import { useEffect, useMemo, useState } from 'react';
import { useCampaign } from '../lib/campaignContext';
import { getWorld } from '../lib/worldRegistry';
import { fetchWeatherAmbience } from '../lib/ai/weatherAmbience';
import {
  formatDate,
  getEventsToday,
  getMoonsToday,
  getPlanesToday,
  getTimeOfDay,
  getWeatherToday,
  type EventInfo,
  type MoonInfo,
  type PlaneInfo,
  type TimeOfDayInfo,
  type WeatherInfo,
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
      const weather = getWeatherToday(campaign.worldId, campaign.currentSerial);
      const planes = getPlanesToday(campaign.worldId, campaign.currentSerial);
      return { dateLabel, time, moons, events, weather, planes };
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
            style={{
              color: 'var(--pb-text-primary)',
              viewTransitionName: 'today-date-label',
            }}
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
        <WeatherPanel
          weather={today.weather}
          time={today.time}
          cacheTag={`${campaign.worldId}:${campaign.currentSerial}`}
        />
        <MoonsPanel moons={today.moons} />
        <PlanesPanel planes={today.planes} />
        <EventsPanel events={today.events} />
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
        Year-at-a-glance grid, layer toggles, and smooth navigation land in
        the next passes.
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
  // A true moon-phase glyph: the dark disc with the lit region drawn as an
  // SVG path whose terminator is a real half-ellipse — its width shrinks to
  // a straight edge at the quarters and opens back to the full radius at
  // new/full. Scales crisply at any size; correct for every illumination.
  const glow = moon.color ?? 'var(--pb-text-secondary)';
  const illum = Math.max(0, Math.min(1, moon.illumination));
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 2 2"
      className="h-8 w-8 shrink-0"
      style={{ borderRadius: '9999px', boxShadow: `0 0 8px ${glow}33` }}
    >
      <title>{`${moon.name}: ${moon.phaseLabel}`}</title>
      <circle cx="1" cy="1" r="1" fill="var(--pb-bg-deep)" />
      {illum > 0.005 && (
        <path d={moonPhasePath(illum, moon.waxing)} fill="var(--pb-text-primary)" />
      )}
      <circle
        cx="1"
        cy="1"
        r="0.94"
        fill="none"
        stroke="var(--pb-border-subtle)"
        strokeWidth="0.06"
      />
    </svg>
  );
}

/**
 * SVG path for the lit region of a moon at illumination fraction `illum`
 * (0–1). The lit lune is bounded by the disc's limb (a semicircle) and the
 * terminator (a half-ellipse whose horizontal radius is |1 − 2·illum| —
 * zero at the quarters, the full radius at new/full). Waxing lights the
 * right limb, waning the left. The disc is the unit circle at (1,1).
 */
function moonPhasePath(illum: number, waxing: boolean): string {
  const rx = Math.abs(1 - 2 * illum);
  const limb = waxing ? 1 : 0;
  const term = illum > 0.5 ? limb : 1 - limb;
  return `M 1 0 A 1 1 0 0 ${limb} 1 2 A ${rx} 1 0 0 ${term} 1 0 Z`;
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
// Weather
// ───────────────────────────────────────────────────────────────────

interface WeatherPanelProps {
  weather: WeatherInfo;
  time: TimeOfDayInfo;
  cacheTag: string;
}

function WeatherPanel({ weather, time, cacheTag }: WeatherPanelProps) {
  if (!weather.available) {
    return (
      <Panel label="Weather">
        <div className="text-sm" style={{ color: 'var(--pb-text-tertiary)' }}>
          {weather.narrative}
        </div>
      </Panel>
    );
  }
  return (
    <Panel label="Weather">
      <div className="flex flex-col gap-2">
        <div
          className="text-sm"
          style={{ color: 'var(--pb-text-primary)' }}
        >
          {weather.narrative}
        </div>
        <WeatherAmbience weather={weather} time={time} cacheTag={cacheTag} />
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Chip label={weather.tempLabel} variant="temp" />
          {weather.precipBand > 0 && (
            <Chip label={`Precip ${weather.precipBand}/5`} variant="precip" />
          )}
          {weather.windBand > 0 && (
            <Chip label={`Wind ${weather.windBand}/5`} variant="wind" />
          )}
          {weather.fogLevel !== 'none' && (
            <Chip label={`Fog: ${weather.fogLevel}`} variant="fog" />
          )}
        </div>
        <div
          className="text-xs"
          style={{ color: 'var(--pb-text-tertiary)' }}
        >
          {weather.location}
        </div>
      </div>
    </Panel>
  );
}

/**
 * Fetches the AI-generated ambience text via Workers AI and renders it
 * as italic prose beneath the deterministic weather narrative. Fails
 * silently: if the AI is unavailable or the request errors, the panel
 * just doesn't show the extra paragraph. Deterministic content above
 * stays as the canonical info.
 */
function WeatherAmbience({
  weather,
  time,
  cacheTag,
}: {
  weather: WeatherInfo;
  time: TimeOfDayInfo;
  cacheTag: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fingerprint the inputs that matter. When any of these change, refetch.
  const fingerprint = [
    weather.location,
    weather.tempLabel,
    weather.precipBand,
    weather.windBand,
    weather.fogLevel,
    time.bucketKey,
    cacheTag,
  ].join('|');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setText(null);
    fetchWeatherAmbience({ weather, time, cacheTag })
      .then((result) => {
        if (cancelled) return;
        setText(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  if (loading) {
    return (
      <div
        className="text-xs italic"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        Weaving ambience…
      </div>
    );
  }

  if (!text) return null;

  return (
    <p
      className="text-sm italic leading-relaxed"
      style={{ color: 'var(--pb-text-secondary)' }}
    >
      {text}
    </p>
  );
}

// ───────────────────────────────────────────────────────────────────
// Planes
// ───────────────────────────────────────────────────────────────────

function PlanesPanel({ planes }: { planes: PlaneInfo[] }) {
  if (!planes.length) {
    return (
      <Panel label="Planes">
        <div className="text-sm" style={{ color: 'var(--pb-text-tertiary)' }}>
          This world doesn't track planar cycles.
        </div>
      </Panel>
    );
  }
  // Surface the notable ones first: coterminous / remote get top billing;
  // neutral gets sorted toward the end. Within group, soonest-changing first.
  const sorted = [...planes].sort((a, b) => phaseRank(a.phase) - phaseRank(b.phase));
  const notable = sorted.filter((p) => p.phase !== 'neutral');
  const neutral = sorted.filter((p) => p.phase === 'neutral');

  return (
    <Panel label={`Planes (${planes.length})`}>
      <ul className="flex flex-col gap-1.5">
        {notable.map((p) => (
          <PlaneRow key={p.name} plane={p} />
        ))}
        {notable.length > 0 && neutral.length > 0 && (
          <li
            className="my-1 border-t"
            style={{ borderColor: 'var(--pb-border-subtle)' }}
            aria-hidden="true"
          />
        )}
        {neutral.map((p) => (
          <PlaneRow key={p.name} plane={p} muted />
        ))}
      </ul>
    </Panel>
  );
}

function PlaneRow({ plane, muted = false }: { plane: PlaneInfo; muted?: boolean }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ background: plane.color ?? 'var(--pb-text-tertiary)' }}
      />
      <span
        className="font-medium"
        style={{ color: muted ? 'var(--pb-text-secondary)' : 'var(--pb-text-primary)' }}
      >
        {plane.name}
      </span>
      <span
        className="text-xs"
        style={{ color: 'var(--pb-text-tertiary)' }}
      >
        {plane.phaseLabel}
        {plane.daysUntilNextPhase != null && plane.daysUntilNextPhase > 0 && (
          <span> · {formatDaysUntil(plane.daysUntilNextPhase)}</span>
        )}
        {plane.overridden && <span> · GM override</span>}
      </span>
    </li>
  );
}

function phaseRank(phase: string): number {
  // Coterminous = most interesting; remote = next; neutral last.
  if (phase === 'coterminous') return 0;
  if (phase === 'remote') return 1;
  if (phase === 'neutral') return 2;
  return 3;
}

function formatDaysUntil(days: number): string {
  if (days < 365) return `${days}d to shift`;
  const years = Math.round(days / 365);
  return `~${years}y to shift`;
}

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: 'temp' | 'precip' | 'wind' | 'fog';
}) {
  const tints: Record<typeof variant, { bg: string; fg: string }> = {
    temp:   { bg: 'var(--pb-ember-faint)',  fg: 'var(--pb-ember)' },
    precip: { bg: 'var(--pb-accent-faint)', fg: 'var(--pb-info)' },
    wind:   { bg: 'rgba(160,168,180,0.10)', fg: 'var(--pb-text-secondary)' },
    fog:    { bg: 'rgba(160,168,180,0.10)', fg: 'var(--pb-text-secondary)' },
  };
  const c = tints[variant];
  return (
    <span
      className="rounded px-2 py-0.5 font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
    </span>
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
