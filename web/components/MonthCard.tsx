/**
 * Compact month grid card for the year-at-a-glance view.
 *
 * Each day cell renders:
 *  - day number (top-left)
 *  - moon glyphs in the top-right when any moon peaks full / new
 *  - event color dots along the bottom (max 3, then "+N")
 *  - emerald outline on the campaign's "today" cell
 *
 * The cell is keyboard-focusable so a future popover ("click any date
 * for the full today card on that date") can drop in cleanly.
 */

import type { MonthGridInfo, MonthGridDayCell } from '../lib/core/bridge';

interface MonthCardProps {
  month: MonthGridInfo;
  /** The campaign's current serial — used to draw the "today" outline. */
  todaySerial: number;
  /** Optional click handler — fires with the serial of the clicked day. */
  onDayClick?: (serial: number) => void;
}

export function MonthCard({ month, todaySerial, onDayClick }: MonthCardProps) {
  return (
    <article
      className="rounded-lg border"
      style={{
        background: 'var(--pb-bg-raised)',
        borderColor: 'var(--pb-border)',
      }}
    >
      <header
        className="border-b px-3 py-2"
        style={{ borderColor: 'var(--pb-border-subtle)' }}
      >
        <h3
          className="font-display text-sm font-semibold"
          style={{ color: 'var(--pb-text-primary)' }}
        >
          {month.monthName}
          <span
            className="ml-2 text-xs font-normal"
            style={{ color: 'var(--pb-text-tertiary)' }}
          >
            {month.daysInMonth} days
          </span>
        </h3>
      </header>

      <div
        className="grid gap-px p-2"
        style={{
          gridTemplateColumns: `repeat(${month.weekdayLabels.length}, minmax(0, 1fr))`,
        }}
      >
        {month.weekdayLabels.map((wd) => (
          <div
            key={wd}
            className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--pb-text-tertiary)' }}
          >
            {wd}
          </div>
        ))}
        {month.cells.map((cell, i) => {
          if (cell.kind === 'empty') {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          return (
            <DayCell
              key={`d-${cell.day}`}
              cell={cell}
              isToday={cell.serial === todaySerial}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </article>
  );
}

function DayCell({
  cell,
  isToday,
  onClick,
}: {
  cell: MonthGridDayCell;
  isToday: boolean;
  onClick?: (serial: number) => void;
}) {
  const hasFull = cell.fullMoons.length > 0;
  const hasNew = cell.newMoons.length > 0;
  const eventCount = cell.events.length;
  const eventColors = cell.events.slice(0, 3).map((e) => e.color ?? 'var(--pb-accent)');
  const extraEvents = Math.max(0, eventCount - 3);

  const tooltipParts: string[] = [`Day ${cell.day}`];
  if (hasFull) tooltipParts.push(`Full: ${cell.fullMoons.join(', ')}`);
  if (hasNew) tooltipParts.push(`New: ${cell.newMoons.join(', ')}`);
  if (eventCount) tooltipParts.push(`${eventCount} event${eventCount === 1 ? '' : 's'}`);

  return (
    <button
      type="button"
      title={tooltipParts.join(' · ')}
      onClick={onClick ? () => onClick(cell.serial) : undefined}
      className="relative aspect-square overflow-hidden rounded-sm text-left transition-colors"
      style={{
        background: isToday ? 'var(--pb-accent-faint)' : 'var(--pb-bg-elevated)',
        outline: isToday ? '1px solid var(--pb-accent)' : 'none',
        outlineOffset: '-1px',
        cursor: onClick ? 'pointer' : 'default',
        // Naming exactly one cell at a time lets the View Transitions API
        // morph the highlight (outline + fill) from old today → new today
        // instead of cross-fading. Smooth when the user clicks a date.
        viewTransitionName: isToday ? 'today-cell' : undefined,
      }}
    >
      <span
        className="absolute left-1 top-0.5 text-[10px] font-medium leading-tight"
        style={{
          color: isToday ? 'var(--pb-accent)' : 'var(--pb-text-secondary)',
        }}
      >
        {cell.day}
      </span>

      {(hasFull || hasNew) && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 flex gap-0.5 text-[8px] leading-none"
        >
          {hasFull && (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: 'var(--pb-text-primary)',
                boxShadow: '0 0 4px rgba(232,230,223,0.6)',
              }}
            />
          )}
          {hasNew && (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full border"
              style={{
                background: 'transparent',
                borderColor: 'var(--pb-text-secondary)',
              }}
            />
          )}
        </span>
      )}

      {eventCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute bottom-0.5 left-0.5 flex items-center gap-[2px]"
        >
          {eventColors.map((c, i) => (
            <span
              key={i}
              className="inline-block h-1 w-1 rounded-full"
              style={{ background: c }}
            />
          ))}
          {extraEvents > 0 && (
            <span
              className="text-[7px] font-semibold leading-none"
              style={{ color: 'var(--pb-text-tertiary)' }}
            >
              +{extraEvents}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
