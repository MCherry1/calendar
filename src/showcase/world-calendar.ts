import { WORLDS } from '../worlds/index.js';
import type { MonthSlot, WorldDefinition } from '../worlds/types.js';

export type WorldCalendarSlot = MonthSlot & {
  slotIndex: number;
  regularMonthIndex: number | null;
};

export type WorldDate = {
  worldId: string;
  year: number;
  slotIndex: number;
  regularMonthIndex: number | null;
  day: number;
  monthName: string;
  isIntercalary: boolean;
  serial: number;
};

function _world(worldId: string): WorldDefinition {
  var world = WORLDS[String(worldId || '').toLowerCase()];
  if (!world) throw new Error('Unknown world: ' + String(worldId || ''));
  return world;
}

function _defaultOverlay(world: WorldDefinition){
  var overlays = world.calendar.namingOverlays || [];
  for (var i = 0; i < overlays.length; i++){
    if (overlays[i].key === world.calendar.defaultOverlayKey) return overlays[i];
  }
  return overlays[0] || null;
}

function _derivedStructure(world: WorldDefinition): WorldCalendarSlot[] {
  var overlay = _defaultOverlay(world);
  var monthNames = overlay && overlay.monthNames ? overlay.monthNames : [];
  return (world.calendar.monthDays || []).map(function(days, index){
    return {
      name: monthNames[index] || ('Month ' + (index + 1)),
      days: days,
      regularIndex: index,
      slotIndex: index,
      regularMonthIndex: index
    };
  });
}

export function getWorldCalendarSlots(worldId: string): WorldCalendarSlot[] {
  var world = _world(worldId);
  var structure = world.calendar.structure;
  if (!Array.isArray(structure) || !structure.length){
    return _derivedStructure(world);
  }

  var regularSeen = 0;
  return structure.map(function(slot, index){
    var regularMonthIndex = slot.isIntercalary ? null : regularSeen++;
    return {
      name: slot.name,
      days: slot.days,
      isIntercalary: slot.isIntercalary === true,
      leapEvery: slot.leapEvery == null ? null : slot.leapEvery,
      regularIndex: slot.regularIndex,
      slotIndex: index,
      regularMonthIndex: regularMonthIndex
    };
  });
}

export function getWorldRegularMonthSlots(worldId: string): WorldCalendarSlot[] {
  return getWorldCalendarSlots(worldId).filter(function(slot){
    return slot.isIntercalary !== true;
  });
}

export function isGregorianLeapYear(year: number){
  year = parseInt(String(year), 10) || 0;
  return (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0));
}

export function isWorldSlotActive(worldId: string, slotIndex: number, year: number){
  var world = _world(worldId);
  var slot = getWorldCalendarSlots(worldId)[slotIndex];
  if (!slot) return false;
  if (!slot.leapEvery) return true;
  if (world.key === 'gregorian' && slot.isIntercalary && slot.name === 'Leap Day'){
    return isGregorianLeapYear(year);
  }
  return year % slot.leapEvery === 0;
}

export function worldBaseYearDays(worldId: string){
  return getWorldCalendarSlots(worldId).reduce(function(sum, slot){
    return sum + (slot.leapEvery ? 0 : (slot.days | 0));
  }, 0);
}

export function worldAverageYearDays(worldId: string){
  var world = _world(worldId);
  return getWorldCalendarSlots(worldId).reduce(function(sum, slot){
    if (!slot.leapEvery) return sum + (slot.days | 0);
    if (world.key === 'gregorian' && slot.isIntercalary && slot.name === 'Leap Day'){
      return sum + ((slot.days | 0) * (97 / 400));
    }
    return sum + ((slot.days | 0) / slot.leapEvery);
  }, 0);
}

export function daysBeforeWorldYear(worldId: string, year: number){
  year = parseInt(String(year), 10) || 0;
  var world = _world(worldId);
  var slots = getWorldCalendarSlots(worldId);
  var total = year * worldBaseYearDays(worldId);
  for (var i = 0; i < slots.length; i++){
    var slot = slots[i];
    if (!slot.leapEvery) continue;
    if (world.key === 'gregorian' && slot.isIntercalary && slot.name === 'Leap Day'){
      total += _gregorianLeapsBefore(year) * (slot.days | 0);
    } else if (year > 0){
      total += (Math.floor((year - 1) / slot.leapEvery) + 1) * (slot.days | 0);
    }
  }
  return total;
}

function _gregorianLeapsBefore(year: number){
  if (year <= 0) return 0;
  return _leapsBefore(year, 4) - _leapsBefore(year, 100) + _leapsBefore(year, 400);
}

function _leapsBefore(year: number, every: number){
  if (year <= 0 || !every) return 0;
  return Math.floor((year - 1) / every) + 1;
}

export function daysBeforeWorldSlot(worldId: string, year: number, slotIndex: number){
  var slots = getWorldCalendarSlots(worldId);
  var total = 0;
  for (var i = 0; i < slotIndex; i++){
    if (!isWorldSlotActive(worldId, i, year)) continue;
    total += slots[i].days | 0;
  }
  return total;
}

export function worldYearDays(worldId: string, year: number){
  return getWorldCalendarSlots(worldId).reduce(function(sum, slot, index){
    return sum + (isWorldSlotActive(worldId, index, year) ? (slot.days | 0) : 0);
  }, 0);
}

export function regularMonthIndexToSlotIndex(worldId: string, monthIndex: number){
  var slots = getWorldCalendarSlots(worldId);
  for (var i = 0; i < slots.length; i++){
    if (slots[i].regularMonthIndex === monthIndex) return i;
  }
  return -1;
}

export function toWorldSerial(worldId: string, year: number, slotIndex: number, day: number){
  var slots = getWorldCalendarSlots(worldId);
  var slot = slots[slotIndex];
  if (!slot) throw new Error('Unknown slot ' + slotIndex + ' for world ' + worldId);
  var maxDay = Math.max(1, slot.days | 0);
  var clampedDay = Math.max(1, Math.min(maxDay, parseInt(String(day), 10) || 1));
  return daysBeforeWorldYear(worldId, year) + daysBeforeWorldSlot(worldId, year, slotIndex) + (clampedDay - 1);
}

export function toWorldSerialFromRegularDate(worldId: string, year: number, monthIndex: number, day: number){
  var slotIndex = regularMonthIndexToSlotIndex(worldId, monthIndex);
  if (slotIndex < 0) throw new Error('Unknown month ' + monthIndex + ' for world ' + worldId);
  return toWorldSerial(worldId, year, slotIndex, day);
}

export function fromWorldSerial(worldId: string, serial: number): WorldDate {
  serial = parseInt(String(serial), 10) || 0;
  var slots = getWorldCalendarSlots(worldId);
  if (!slots.length) throw new Error('World has no calendar slots: ' + worldId);

  var year = Math.max(0, Math.floor(serial / Math.max(1, worldAverageYearDays(worldId))) - 1);
  while (daysBeforeWorldYear(worldId, year + 1) <= serial) year++;
  while (year > 0 && daysBeforeWorldYear(worldId, year) > serial) year--;

  var remainder = serial - daysBeforeWorldYear(worldId, year);
  for (var i = 0; i < slots.length; i++){
    if (!isWorldSlotActive(worldId, i, year)) continue;
    var days = slots[i].days | 0;
    if (remainder < days){
      return {
        worldId: worldId,
        year: year,
        slotIndex: i,
        regularMonthIndex: slots[i].regularMonthIndex,
        day: remainder + 1,
        monthName: String(slots[i].name || ('Slot ' + (i + 1))),
        isIntercalary: slots[i].isIntercalary === true,
        serial: serial
      };
    }
    remainder -= days;
  }

  var fallback = slots[slots.length - 1];
  return {
    worldId: worldId,
    year: year,
    slotIndex: fallback.slotIndex,
    regularMonthIndex: fallback.regularMonthIndex,
    day: fallback.days,
    monthName: String(fallback.name || ('Slot ' + slots.length)),
    isIntercalary: fallback.isIntercalary === true,
    serial: serial
  };
}

export function worldWeekdayLabels(worldId: string){
  var world = _world(worldId);
  var abbr = world.calendar.weekdayAbbr || {};
  return world.calendar.weekdays.map(function(label){
    return abbr[label] || (String(label).length > 3 ? String(label).slice(0, 3) : String(label));
  });
}

export function formatWorldDate(worldId: string, serial: number){
  var world = _world(worldId);
  var date = fromWorldSerial(worldId, serial);
  if (date.isIntercalary){
    return date.monthName + ', ' + date.year + ' ' + world.eraLabel;
  }
  return date.monthName + ' ' + date.day + ', ' + date.year + ' ' + world.eraLabel;
}

export function clampDayForSlot(worldId: string, slotIndex: number, day: number){
  var slots = getWorldCalendarSlots(worldId);
  var slot = slots[slotIndex];
  if (!slot) return 1;
  return Math.max(1, Math.min(slot.days | 0, parseInt(String(day), 10) || 1));
}
