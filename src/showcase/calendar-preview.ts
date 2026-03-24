import { WORLDS } from '../worlds/index.js';
import { daysBeforeWorldSlot, daysBeforeWorldYear, getWorldCalendarSlots, getWorldRegularMonthSlots, isWorldSlotActive, regularMonthIndexToSlotIndex, worldWeekdayLabels } from './world-calendar.js';

export type CalendarPreviewCell =
  | { kind: 'empty' }
  | { kind: 'day'; day: number; weekdayIndex: number };

export type CalendarPreview = {
  worldId: string;
  worldLabel: string;
  calendarLabel: string;
  description: string;
  year: number;
  monthIndex: number;
  slotIndex: number;
  monthName: string;
  daysInMonth: number;
  weekdayLabels: string[];
  cells: CalendarPreviewCell[];
  leadingEmptyDays: number;
  trailingEmptyDays: number;
  intercalaryBefore: string[];
  intercalaryAfter: string[];
  moonCount: number;
};

export function buildCalendarPreview(input: { worldId: string; year?: number; monthIndex?: number }): CalendarPreview {
  var worldId = String((input && input.worldId) || '').toLowerCase();
  var world = WORLDS[worldId];
  if (!world) throw new Error('Unknown world: ' + worldId);

  var regularMonths = getWorldRegularMonthSlots(worldId);
  var monthIndex = Math.max(0, Math.min(regularMonths.length - 1, parseInt(String(input && input.monthIndex), 10) || 0));
  var year = parseInt(String(input && input.year), 10);
  if (!isFinite(year)) year = world.defaultDate.year;

  var slotIndex = regularMonthIndexToSlotIndex(worldId, monthIndex);
  if (slotIndex < 0) throw new Error('Unknown regular month ' + monthIndex + ' for world ' + worldId);

  var slots = getWorldCalendarSlots(worldId);
  var slot = slots[slotIndex];
  var weekdayLabels = worldWeekdayLabels(worldId);
  var weekdayCount = Math.max(1, weekdayLabels.length);
  var leadingEmptyDays = _leadingEmptyDays(worldId, world.calendar.weekdayProgressionMode, year, slotIndex, weekdayCount);
  var cells: CalendarPreviewCell[] = [];

  for (var i = 0; i < leadingEmptyDays; i++) cells.push({ kind: 'empty' });
  for (var day = 1; day <= (slot.days | 0); day++){
    cells.push({
      kind: 'day',
      day: day,
      weekdayIndex: (leadingEmptyDays + day - 1) % weekdayCount
    });
  }
  while (cells.length % weekdayCount !== 0) cells.push({ kind: 'empty' });

  return {
    worldId: worldId,
    worldLabel: world.label,
    calendarLabel: world.calendar.label,
    description: world.description,
    year: year,
    monthIndex: monthIndex,
    slotIndex: slotIndex,
    monthName: slot.name,
    daysInMonth: slot.days | 0,
    weekdayLabels: weekdayLabels,
    cells: cells,
    leadingEmptyDays: leadingEmptyDays,
    trailingEmptyDays: cells.length - leadingEmptyDays - (slot.days | 0),
    intercalaryBefore: _collectIntercalaries(slots, worldId, year, slotIndex, -1),
    intercalaryAfter: _collectIntercalaries(slots, worldId, year, slotIndex, 1),
    moonCount: world.moons && world.moons.bodies ? world.moons.bodies.length : 0
  };
}

function _leadingEmptyDays(worldId: string, progressionMode: string, year: number, slotIndex: number, weekdayCount: number){
  var slot = getWorldCalendarSlots(worldId)[slotIndex];
  if (!slot) return 0;
  if (progressionMode === 'month_reset' && slot.isIntercalary !== true) return 0;
  if ((progressionMode === 'month_reset' || progressionMode === 'festival_fixed') && slot.isIntercalary === true) return 0;
  var days = daysBeforeWorldYear(worldId, year) + daysBeforeWorldSlot(worldId, year, slotIndex);
  return ((days % weekdayCount) + weekdayCount) % weekdayCount;
}

function _collectIntercalaries(slots: ReturnType<typeof getWorldCalendarSlots>, worldId: string, year: number, slotIndex: number, dir: -1 | 1){
  var out: string[] = [];
  for (var i = slotIndex + dir; i >= 0 && i < slots.length; i += dir){
    var slot = slots[i];
    if (!slot) break;
    if (slot.isIntercalary !== true) break;
    if (!isWorldSlotActive(worldId, i, year)) continue;
    out.push(slot.name);
  }
  return dir < 0 ? out.reverse() : out;
}
