// Tests for serial/date math, calendar systems, and date navigation.
import { describe, it } from "node:test";
import { strictEqual as assertEquals, notStrictEqual as assertNotEquals, ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { toSerial, fromSerial, weekdayIndex, daysPerYear, _isGregorianLeapYear, _leapsBefore, todaySerial, weekStartSerial } from "../src/date-math.js";
import { getCal, ensureSettings, weekLength } from "../src/state.js";
import { CALENDAR_SYSTEMS } from "../src/config.js";
import { stepDays, setDate } from "../src/ui.js";
import { formatDateLabel } from "../src/rendering.js";
import { monthIndexByName } from "../src/parsing.js";

// ============================================================================
// 1) SERIAL / DATE MATH
// ============================================================================

describe("Serial / Date Math", () => {
  it("toSerial and fromSerial round-trip (Eberron)", () => {
    freshInstall();
    const cases = [
      { y: 998, mi: 0, d: 1 },
      { y: 998, mi: 0, d: 28 },
      { y: 998, mi: 5, d: 14 },
      { y: 998, mi: 11, d: 28 },
      { y: 999, mi: 0, d: 1 },
      { y: 0, mi: 0, d: 1 },
      { y: 1000, mi: 6, d: 15 },
    ];
    for (const c of cases) {
      const serial = toSerial(c.y, c.mi, c.d);
      const back = fromSerial(serial);
      assertEquals(back.year, c.y, `year for ${JSON.stringify(c)}`);
      assertEquals(back.mi, c.mi, `month for ${JSON.stringify(c)}`);
      assertEquals(back.day, c.d, `day for ${JSON.stringify(c)}`);
    }
  });

  it("consecutive days have consecutive serials", () => {
    freshInstall();
    const s1 = toSerial(998, 0, 28);
    const s2 = toSerial(998, 1, 1);
    assertEquals(s2 - s1, 1);
  });

  it("year boundary is correct for Eberron (336 days)", () => {
    freshInstall();
    assertEquals(daysPerYear(), 336);
    const lastDay = toSerial(998, 11, 28);
    const firstNextYear = toSerial(999, 0, 1);
    assertEquals(firstNextYear - lastDay, 1);
  });

  it("toSerial is monotonically increasing", () => {
    freshInstall();
    let prev = toSerial(998, 0, 1);
    for (let mi = 0; mi < 12; mi++) {
      for (let d = 1; d <= 28; d++) {
        const s = toSerial(998, mi, d);
        assert(s >= prev, `serial should be >= prev at month ${mi} day ${d}`);
        prev = s;
      }
    }
  });

  it("weekdayIndex cycles correctly (7-day week)", () => {
    freshInstall();
    assertEquals(weekLength(), 7);
    const weekdays: number[] = [];
    for (let d = 1; d <= 7; d++) weekdays.push(weekdayIndex(998, 0, d));
    assertEquals(new Set(weekdays).size, 7);
    assertEquals(weekdayIndex(998, 0, 8), weekdayIndex(998, 0, 1));
  });
});

// ============================================================================
// 2) CALENDAR SYSTEMS
// ============================================================================

describe("Calendar Systems", () => {
  it("Eberron has correct structure", () => {
    freshInstall();
    const eberron = CALENDAR_SYSTEMS.eberron;
    assert(eberron);
    assertEquals(eberron.weekdays.length, 7);
    assertEquals(eberron.monthDays.length, 12);
    assert(eberron.monthDays.every((d: number) => d === 28));
    const names = eberron.variants.standard.monthNames;
    assertEquals(names.length, 12);
    assertEquals(names[0], "Zarantyr");
    assertEquals(names[11], "Vult");
  });

  it("Faerunian system exists with different structure", () => {
    freshInstall();
    assert(CALENDAR_SYSTEMS.faerunian);
  });

  it("Gregorian system exists", () => {
    freshInstall();
    assert(CALENDAR_SYSTEMS.gregorian);
  });
});

// ============================================================================
// 3) DATE NAVIGATION
// ============================================================================

describe("Date Navigation", () => {
  it("stepDays(1) advances current date by one day", () => {
    freshInstall();
    const before = getCal().current.day_of_the_month;
    stepDays(1);
    const after = getCal().current.day_of_the_month;
    if (before === 28) assertEquals(after, 1);
    else assertEquals(after, before + 1);
  });

  it("stepDays forward then back returns to original serial", () => {
    freshInstall();
    const before = todaySerial();
    stepDays(10);
    stepDays(-10);
    assertEquals(todaySerial(), before);
  });

  it("stepDays(336) advances exactly one Eberron year", () => {
    freshInstall();
    const cur = getCal().current;
    const y0 = cur.year, m0 = cur.month, d0 = cur.day_of_the_month;
    stepDays(336);
    const after = getCal().current;
    assertEquals(after.year, y0 + 1);
    assertEquals(after.month, m0);
    assertEquals(after.day_of_the_month, d0);
  });

  it("setDate jumps to a specific date", () => {
    freshInstall();
    setDate(6, 15, 999);
    const cur = getCal().current;
    assertEquals(cur.month, 5);
    assertEquals(cur.day_of_the_month, 15);
    assertEquals(cur.year, 999);
  });
});

// ============================================================================
// 6) GREGORIAN LEAP YEAR
// ============================================================================

describe("Gregorian Leap Year", () => {
  it("standard leap year rules", () => {
    freshInstall();
    assert(_isGregorianLeapYear(2000));
    assert(_isGregorianLeapYear(2024));
    assert(!_isGregorianLeapYear(1900));
    assert(!_isGregorianLeapYear(2023));
    assert(_isGregorianLeapYear(2400));
    assert(!_isGregorianLeapYear(2100));
  });

  it("_leapsBefore counts correctly", () => {
    freshInstall();
    assertEquals(_leapsBefore(0, 4), 0);
    assertEquals(_leapsBefore(1, 4), 1);
    assertEquals(_leapsBefore(5, 4), 2);
    assertEquals(_leapsBefore(9, 4), 3);
  });
});

// ============================================================================
// 11) INTEGRATION
// ============================================================================

describe("Integration", () => {
  it("checkInstall produces valid state", () => {
    freshInstall();
    const cal = getCal();
    const st = ensureSettings();
    assert(Array.isArray(cal.weekdays));
    assert(Array.isArray(cal.months));
    assert(Array.isArray(cal.events));
    assert(cal.current);
    assertEquals(st.calendarSystem, "eberron");
  });

  it("advance through an entire month day-by-day", () => {
    freshInstall();
    const start = todaySerial();
    const m0 = getCal().current.month;
    for (let i = 0; i < 28; i++) stepDays(1);
    assertEquals(todaySerial() - start, 28);
    assertEquals(getCal().current.month, (m0 + 1) % 12);
  });

  it("formatDateLabel produces readable output", () => {
    freshInstall();
    const label = formatDateLabel(998, 0, 1, true);
    assert(typeof label === "string" && label.length > 0);
    assert(label.includes("998"));
  });

  it("monthIndexByName resolves Eberron month names", () => {
    freshInstall();
    assertEquals(monthIndexByName("zarantyr"), 0);
    assertEquals(monthIndexByName("Vult"), 11);
    assertEquals(monthIndexByName("Nymm"), 5);
  });
});
