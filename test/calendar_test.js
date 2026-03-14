// Functional tests for calendar.js
// Run with: node --test
//
// These tests load the Roll20 shim, then calendar.js, and exercise core
// subsystem logic through the _test internals API.

import { describe, it } from "node:test";
import { strictEqual as assertEquals, notStrictEqual as assertNotEquals, ok as assert } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load Roll20 shim
await import("./roll20-shim.js");

// Load calendar.js
const __dirname = dirname(fileURLToPath(import.meta.url));
const calendarPath = resolve(__dirname, "..", "calendar.js");
const calendarSource = readFileSync(calendarPath, "utf-8");
// `var Calendar = ...` inside new Function() creates a local var.
// Assign it to globalThis so tests can access it.
new Function(calendarSource + "\nglobalThis.Calendar = Calendar;")();

/** Fresh-initialize state before each test group. */
function freshInstall() {
  globalThis._resetShim();
  globalThis.Calendar.checkInstall();
}

const t = () => globalThis.Calendar._test;

// ============================================================================
// 1) SERIAL / DATE MATH
// ============================================================================

describe("Serial / Date Math", () => {
  it("toSerial and fromSerial round-trip (Eberron)", () => {
    freshInstall();
    const { toSerial, fromSerial } = t();

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
    const { toSerial } = t();
    const s1 = toSerial(998, 0, 28);
    const s2 = toSerial(998, 1, 1);
    assertEquals(s2 - s1, 1);
  });

  it("year boundary is correct for Eberron (336 days)", () => {
    freshInstall();
    const { toSerial, daysPerYear } = t();
    assertEquals(daysPerYear(), 336);
    const lastDay = toSerial(998, 11, 28);
    const firstNextYear = toSerial(999, 0, 1);
    assertEquals(firstNextYear - lastDay, 1);
  });

  it("toSerial is monotonically increasing", () => {
    freshInstall();
    const { toSerial } = t();
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
    const { weekdayIndex, weekLength: wl } = t();
    assertEquals(wl(), 7);

    const weekdays = [];
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
    const { CALENDAR_SYSTEMS } = t();
    const eberron = CALENDAR_SYSTEMS.eberron;
    assert(eberron);
    assertEquals(eberron.weekdays.length, 7);
    assertEquals(eberron.monthDays.length, 12);
    assert(eberron.monthDays.every(d => d === 28));
    const names = eberron.variants.standard.monthNames;
    assertEquals(names.length, 12);
    assertEquals(names[0], "Zarantyr");
    assertEquals(names[11], "Vult");
  });

  it("Faerunian system exists with different structure", () => {
    freshInstall();
    const { CALENDAR_SYSTEMS } = t();
    assert(CALENDAR_SYSTEMS.faerunian);
  });

  it("Gregorian system exists", () => {
    freshInstall();
    const { CALENDAR_SYSTEMS } = t();
    assert(CALENDAR_SYSTEMS.gregorian);
  });
});

// ============================================================================
// 3) DATE NAVIGATION
// ============================================================================

describe("Date Navigation", () => {
  it("stepDays(1) advances current date by one day", () => {
    freshInstall();
    const { getCal, stepDays } = t();
    const before = getCal().current.day_of_the_month;
    stepDays(1);
    const after = getCal().current.day_of_the_month;
    if (before === 28) assertEquals(after, 1);
    else assertEquals(after, before + 1);
  });

  it("stepDays forward then back returns to original serial", () => {
    freshInstall();
    const { stepDays, todaySerial } = t();
    const before = todaySerial();
    stepDays(10);
    stepDays(-10);
    assertEquals(todaySerial(), before);
  });

  it("stepDays(336) advances exactly one Eberron year", () => {
    freshInstall();
    const { getCal, stepDays } = t();
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
    const { getCal, setDate } = t();
    setDate(6, 15, 999);
    const cur = getCal().current;
    assertEquals(cur.month, 5);
    assertEquals(cur.day_of_the_month, 15);
    assertEquals(cur.year, 999);
  });
});

// ============================================================================
// 4) EVENTS
// ============================================================================

describe("Events", () => {
  it("default events are loaded on install", () => {
    freshInstall();
    const events = t().getCal().events;
    assert(Array.isArray(events));
    assert(events.length > 0);
  });

  it("getEventsFor finds known default events", () => {
    freshInstall();
    const { getEventsFor, getCal } = t();
    // Find an event with a simple numeric day spec (not ordinal weekday)
    const events = getCal().events;
    const numericEvent = events.find(e => typeof e.day === "number" || /^\d+$/.test(String(e.day)));
    assert(numericEvent, "should have at least one numeric-day event");
    const dayNum = parseInt(numericEvent.day, 10);
    const found = getEventsFor(numericEvent.month - 1, dayNum, null);
    assert(found.length >= 1);
    assert(found.some(e => e.name === numericEvent.name));
  });

  it("eventKey is stable", () => {
    freshInstall();
    const { eventKey } = t();
    const ev = { month: 3, day: 15, year: null, name: "Test Holiday" };
    assertEquals(eventKey(ev), eventKey(ev));
  });

  it("compareEvents orders by year then month", () => {
    freshInstall();
    const { compareEvents } = t();
    assert(compareEvents({ month: 1, day: 1, year: 998 },
                         { month: 1, day: 1, year: 999 }) < 0);
    assert(compareEvents({ month: 1, day: 1, year: 998 },
                         { month: 6, day: 1, year: 998 }) < 0);
  });

  it("default events have hex colors", () => {
    freshInstall();
    const { getCal, getEventColor } = t();
    for (const e of getCal().events.slice(0, 10)) {
      const color = getEventColor(e);
      assert(color && color.startsWith("#"), `"${e.name}" color: ${color}`);
    }
  });
});

// ============================================================================
// 5) UTILITIES
// ============================================================================

describe("Utilities", () => {
  it("_stableHash is deterministic", () => {
    freshInstall();
    const { _stableHash } = t();
    assertEquals(_stableHash("hello"), _stableHash("hello"));
    assertNotEquals(_stableHash("hello"), _stableHash("world"));
  });

  it("clamp restricts values to range", () => {
    freshInstall();
    const { clamp } = t();
    assertEquals(clamp(5, 1, 10), 5);
    assertEquals(clamp(-1, 1, 10), 1);
    assertEquals(clamp(15, 1, 10), 10);
  });

  it("esc escapes HTML entities", () => {
    freshInstall();
    const { esc } = t();
    assertEquals(esc("<b>bold</b>"), "&lt;b&gt;bold&lt;/b&gt;");
    assertEquals(esc('"quotes"'), "&quot;quotes&quot;");
  });

  it("titleCase capitalizes first letter", () => {
    freshInstall();
    const { titleCase } = t();
    assertEquals(titleCase("hello"), "Hello");
  });

  it("sanitizeHexColor validates hex colors", () => {
    freshInstall();
    const { sanitizeHexColor } = t();
    assert(sanitizeHexColor("#FF0000"));
    assert(!sanitizeHexColor("not-a-color"));
  });

  it("textColor returns readable contrast on dark and light backgrounds", () => {
    freshInstall();
    const { textColor, _contrast } = t();
    const onDark = textColor("#000000");
    const onLight = textColor("#FFFFFF");
    assert(onDark);
    assert(onLight);
    assert(_contrast("#000000", onDark) >= 4.5);
  });

  it("colorForMonth returns hex for each month", () => {
    freshInstall();
    const { colorForMonth } = t();
    for (let i = 0; i < 12; i++) {
      const c = colorForMonth(i);
      assert(c && c.startsWith("#"), `month ${i}: ${c}`);
    }
  });
});

// ============================================================================
// 6) GREGORIAN LEAP YEAR
// ============================================================================

describe("Gregorian Leap Year", () => {
  it("standard leap year rules", () => {
    freshInstall();
    const { _isGregorianLeapYear } = t();
    assert(_isGregorianLeapYear(2000));
    assert(_isGregorianLeapYear(2024));
    assert(!_isGregorianLeapYear(1900));
    assert(!_isGregorianLeapYear(2023));
    assert(_isGregorianLeapYear(2400));
    assert(!_isGregorianLeapYear(2100));
  });

  it("_leapsBefore counts correctly", () => {
    freshInstall();
    const { _leapsBefore } = t();
    assertEquals(_leapsBefore(0, 4), 0);
    assertEquals(_leapsBefore(1, 4), 1);
    assertEquals(_leapsBefore(5, 4), 2);
    assertEquals(_leapsBefore(9, 4), 3);
  });
});

// ============================================================================
// 7) MOON SYSTEM
// ============================================================================

describe("Moon System", () => {
  it("Eberron has 12 moons with required properties", () => {
    freshInstall();
    const moons = t().MOON_SYSTEMS.eberron.moons;
    assertEquals(moons.length, 12);
    for (const m of moons) {
      assert(m.name, "name");
      assert(m.synodicPeriod > 0, `${m.name} synodic period`);
      assert(m.plane, `${m.name} plane`);
      assert(m.color, `${m.name} color`);
    }
  });

  it("_moonHashStr is deterministic and in [0,1)", () => {
    freshInstall();
    const { _moonHashStr } = t();
    const h = _moonHashStr("test-seed");
    assertEquals(h, _moonHashStr("test-seed"));
    assertNotEquals(h, _moonHashStr("other"));
    assert(h >= 0 && h < 1);
  });

  it("_moonPrng produces repeatable sequences", () => {
    freshInstall();
    const { _moonPrng } = t();
    const a = _moonPrng(0.42), b = _moonPrng(0.42);
    const sa = Array.from({ length: 5 }, () => a());
    const sb = Array.from({ length: 5 }, () => b());
    for (let i = 0; i < 5; i++) assertEquals(sa[i], sb[i]);
    for (const v of sa) assert(v >= 0 && v < 1);
  });

  it("_eberronMoonCore returns data for all named moons", () => {
    freshInstall();
    const { _eberronMoonCore, MOON_SYSTEMS } = t();
    for (const m of MOON_SYSTEMS.eberron.moons) {
      const core = _eberronMoonCore(m.name);
      assert(core.diameter > 0, `${m.name} diameter`);
      assert(core.avgOrbitalDistance > 0, `${m.name} distance`);
      assertNotEquals(core.referenceMoon, "Unknown", `${m.name} reference`);
    }
  });

  it("moonPhaseAt returns data after sequence generation", () => {
    freshInstall();
    const { moonEnsureSequences, moonPhaseAt, todaySerial, MOON_SYSTEMS } = t();
    const today = todaySerial();
    moonEnsureSequences(today, 30);
    for (const m of MOON_SYSTEMS.eberron.moons) {
      const phase = moonPhaseAt(m.name, today);
      assert(phase !== undefined && phase !== null, `${m.name} phase`);
    }
  });
});

// ============================================================================
// 8) WEATHER SYSTEM
// ============================================================================

describe("Weather System", () => {
  it("getWeatherState initializes with correct defaults", () => {
    freshInstall();
    const ws = t().getWeatherState();
    assert(ws);
    assertEquals(ws.location, null);
    assert(Array.isArray(ws.forecast));
    assert(Array.isArray(ws.history));
  });

  it("_clampWeatherTempBand clamps to valid range", () => {
    freshInstall();
    const { _clampWeatherTempBand } = t();
    assertEquals(_clampWeatherTempBand(0), 0);
    assertEquals(_clampWeatherTempBand(-10), -5);
    assertEquals(_clampWeatherTempBand(20), 15);
    assertEquals(_clampWeatherTempBand(7), 7);
  });

  it("_weatherTempLabel returns labels for all bands", () => {
    freshInstall();
    const { _weatherTempLabel } = t();
    for (let band = -5; band <= 15; band++) {
      const l = _weatherTempLabel(band);
      assert(typeof l === "string" && l.length > 0, `band ${band}`);
    }
  });

  it("WEATHER_CLIMATES has expected climate types", () => {
    freshInstall();
    const { WEATHER_CLIMATES } = t();
    for (const key of ["polar", "temperate", "tropical", "continental"]) {
      assert(WEATHER_CLIMATES[key], key);
    }
  });
});

// ============================================================================
// 9) NIGHTTIME LIGHTING
// ============================================================================

describe("Nighttime Lighting", () => {
  it("nighttimeLightCondition returns condition objects for various lux levels", () => {
    freshInstall();
    const { nighttimeLightCondition } = t();
    for (const lux of [0, 0.001, 0.01, 0.1, 0.5, 1.0]) {
      const c = nighttimeLightCondition(lux);
      assert(c && typeof c === "object", `lux=${lux} should return an object`);
      assert(c.condition, `lux=${lux} should have a condition field`);
      assert(c.label, `lux=${lux} should have a label`);
    }
  });
});

// ============================================================================
// 10) SEASONS
// ============================================================================

describe("Season Sets", () => {
  it("Eberron season set exists", () => {
    freshInstall();
    assert(t().SEASON_SETS.eberron);
  });
});

// ============================================================================
// 11) INTEGRATION
// ============================================================================

describe("Integration", () => {
  it("checkInstall produces valid state", () => {
    freshInstall();
    const { getCal, ensureSettings, state_name } = t();
    const root = globalThis.state[state_name];
    assert(root && root.calendar);
    const cal = getCal();
    assert(Array.isArray(cal.weekdays));
    assert(Array.isArray(cal.months));
    assert(Array.isArray(cal.events));
    assert(cal.current);
    const s = ensureSettings();
    assertEquals(s.calendarSystem, "eberron");
  });

  it("advance through an entire month day-by-day", () => {
    freshInstall();
    const { getCal, stepDays, todaySerial } = t();
    const start = todaySerial();
    const m0 = getCal().current.month;
    for (let i = 0; i < 28; i++) stepDays(1);
    assertEquals(todaySerial() - start, 28);
    assertEquals(getCal().current.month, (m0 + 1) % 12);
  });

  it("formatDateLabel produces readable output", () => {
    freshInstall();
    const label = t().formatDateLabel(998, 0, 1, true);
    assert(typeof label === "string" && label.length > 0);
    assert(label.includes("998"));
  });

  it("monthIndexByName resolves Eberron month names", () => {
    freshInstall();
    const { monthIndexByName } = t();
    assertEquals(monthIndexByName("zarantyr"), 0);
    assertEquals(monthIndexByName("Vult"), 11);
    assertEquals(monthIndexByName("Nymm"), 5);
  });
});
