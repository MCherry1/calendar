import { describe, it } from 'node:test';
import { ok as assert, strictEqual as assertEquals } from 'node:assert/strict';
import { WORLD_ORDER } from '../src/worlds/index.js';
import { buildCalendarPreview } from '../src/showcase/calendar-preview.js';

describe('Calendar Preview', () => {
  it('builds a preview card for every supported world', () => {
    for (const worldId of WORLD_ORDER) {
      const preview = buildCalendarPreview({ worldId });
      assert(preview.weekdayLabels.length > 0, `${worldId} weekday labels`);
      assert(preview.cells.length >= preview.daysInMonth, `${worldId} cells`);
      assert(preview.monthName.length > 0, `${worldId} month name`);
    }
  });

  it('surfaces Harptos intercalary festivals around regular months', () => {
    const hammer = buildCalendarPreview({ worldId: 'faerunian', year: 1372, monthIndex: 0 });
    assertEquals(hammer.intercalaryAfter[0], 'Midwinter');
    const nightal = buildCalendarPreview({ worldId: 'faerunian', year: 1372, monthIndex: 11 });
    assertEquals(nightal.intercalaryAfter[0], 'Feast of the Moon');
  });
});
