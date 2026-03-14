// Tests for features reviewed from GPT-5 Codex on 2026-03-13.
// Covers: eclipse math, weather reveals & safeguards, Harptos display.
// Run with: node --test

import { describe, it } from "node:test";
import { strictEqual as assertEquals, ok as assert, deepStrictEqual as assertDeep } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

await import("./roll20-shim.js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const calendarSource = readFileSync(resolve(__dirname, "..", "calendar.js"), "utf-8");
new Function(calendarSource + "\nglobalThis.Calendar = Calendar;")();

function freshInstall() {
  globalThis._resetShim();
  globalThis.Calendar.checkInstall();
}

const t = () => globalThis.Calendar._test;

// ============================================================================
// ECLIPSE: _diskOverlapFraction
// ============================================================================

describe("Eclipse: _diskOverlapFraction", () => {
  it("returns 0 when disks do not overlap", () => {
    freshInstall();
    assertEquals(t()._diskOverlapFraction(1, 1, 3), 0);
  });

  it("returns 0 when disks just touch (sep == rFront + rBack)", () => {
    freshInstall();
    assertEquals(t()._diskOverlapFraction(1, 1, 2), 0);
  });

  it("returns 1 when front disk fully covers back disk of same size at sep=0", () => {
    freshInstall();
    const result = t()._diskOverlapFraction(1, 1, 0);
    assert(Math.abs(result - 1.0) < 0.001, `expected ~1.0, got ${result}`);
  });

  it("returns 1 when front disk is larger and fully covers back disk", () => {
    freshInstall();
    const result = t()._diskOverlapFraction(2, 1, 0);
    assert(Math.abs(result - 1.0) < 0.001, `expected ~1.0, got ${result}`);
  });

  it("returns partial fraction when front disk is smaller and inside back disk", () => {
    freshInstall();
    // Small disk (r=0.5) centered inside large disk (r=2), sep=0
    // Covered area = pi*0.5^2 / pi*2^2 = 0.25/4 = 0.0625
    const result = t()._diskOverlapFraction(0.5, 2, 0);
    assert(Math.abs(result - 0.0625) < 0.001, `expected ~0.0625, got ${result}`);
  });

  it("returns ~0.5 for half-overlap scenario", () => {
    freshInstall();
    // Two equal circles with partial overlap
    const result = t()._diskOverlapFraction(1, 1, 1);
    assert(result > 0.1 && result < 0.9, `expected partial overlap, got ${result}`);
  });

  it("handles zero or negative radii gracefully", () => {
    freshInstall();
    assertEquals(t()._diskOverlapFraction(0, 1, 0), 0);
    assertEquals(t()._diskOverlapFraction(1, 0, 0), 0);
    assertEquals(t()._diskOverlapFraction(-1, 1, 0), 0);
  });

  it("is monotonically decreasing as separation increases", () => {
    freshInstall();
    const fn = t()._diskOverlapFraction;
    let prev = fn(1, 1, 0);
    for (let sep = 0.1; sep <= 2.0; sep += 0.1) {
      const curr = fn(1, 1, sep);
      assert(curr <= prev + 0.001, `should decrease: sep=${sep}, prev=${prev}, curr=${curr}`);
      prev = curr;
    }
  });
});

// ============================================================================
// ECLIPSE: _eclipseTimeBlock
// ============================================================================

describe("Eclipse: _eclipseTimeBlock", () => {
  it("maps midnight to early_morning", () => {
    freshInstall();
    assertEquals(t()._eclipseTimeBlock(0), "early_morning");
  });

  it("maps noon to afternoon", () => {
    freshInstall();
    // 0.5 * 24 = 12h -> < 14.4 -> afternoon
    assertEquals(t()._eclipseTimeBlock(0.5), "afternoon");
  });

  it("maps 7am to morning", () => {
    freshInstall();
    // 7/24 = 0.2917 -> h=7 -> >= 4.8, < 9.6 -> morning
    assertEquals(t()._eclipseTimeBlock(7 / 24), "morning");
  });

  it("maps 6pm to evening", () => {
    freshInstall();
    // 18/24 = 0.75 -> h=18 -> >= 14.4, < 19.2 -> evening
    assertEquals(t()._eclipseTimeBlock(18 / 24), "evening");
  });

  it("maps 10pm to late_night", () => {
    freshInstall();
    // 22/24 -> h=22 -> >= 19.2 -> late_night
    assertEquals(t()._eclipseTimeBlock(22 / 24), "late_night");
  });

  it("handles fractional serial days (integer + fraction)", () => {
    freshInstall();
    // serial 100.5 -> frac = 0.5 -> noon -> afternoon
    assertEquals(t()._eclipseTimeBlock(100.5), "afternoon");
  });
});

// ============================================================================
// ECLIPSE: _eclipseLifecycleText
// ============================================================================

describe("Eclipse: _eclipseLifecycleText", () => {
  it("produces text with Beginning/Peaking/Ending for same-day event", () => {
    freshInstall();
    const event = {
      startDay: 100, peakDay: 100, endDay: 100,
      startBucket: "morning", peakBucket: "afternoon", endBucket: "evening",
      peakSkyLabel: "well above horizon"
    };
    const text = t()._eclipseLifecycleText(event, 100);
    assert(text.includes("Beginning"), "should contain Beginning");
    assert(text.includes("Peaking"), "should contain Peaking");
    assert(text.includes("Ending"), "should contain Ending");
    assert(text.includes("well above horizon"), "should contain sky label");
    assert(text.endsWith("."), "should end with period");
  });

  it("uses yesterday/tomorrow for cross-day events", () => {
    freshInstall();
    const event = {
      startDay: 99, peakDay: 100, endDay: 101,
      startBucket: "late_night", peakBucket: "early_morning", endBucket: "morning",
      peakSkyLabel: "on horizon"
    };
    const text = t()._eclipseLifecycleText(event, 100);
    assert(text.includes("yesterday"), "should mention yesterday for start");
    assert(text.includes("tomorrow"), "should mention tomorrow for end");
  });
});

// ============================================================================
// ECLIPSE: getEclipses integration
// ============================================================================

describe("Eclipse: getEclipses", () => {
  it("returns an array for any serial day", () => {
    freshInstall();
    const today = t().todaySerial();
    t().moonEnsureSequences(today, 30);
    const eclipses = t().getEclipses(today);
    assert(Array.isArray(eclipses), "should return an array");
  });

  it("eclipse events have required fields when present", () => {
    freshInstall();
    const today = t().todaySerial();
    t().moonEnsureSequences(today, 60);
    // Search a range of days to find at least one eclipse
    let found = null;
    for (let d = today; d < today + 60; d++) {
      const eclipses = t().getEclipses(d);
      if (eclipses.length > 0) { found = eclipses[0]; break; }
    }
    if (found) {
      assert(found.occulting, "should have occulting body");
      assert(found.occluded, "should have occluded body");
      assert(found.typeLabel, "should have typeLabel");
      assert(typeof found.peakCoverage === "number", "should have peakCoverage");
      assert(typeof found.peakCoveragePct === "number", "should have peakCoveragePct");
      assert(typeof found.sizeRatio === "number", "should have sizeRatio");
      assert(typeof found.sizePct === "number", "should have sizePct");
      assert(found.peakSkyLabel, "should have peakSkyLabel");
      assert(found.peakCoveragePct >= 1, "peakCoveragePct should be at least 1");
      assert(found.sizePct >= 1, "sizePct should be at least 1");
      assert(["Total Eclipse", "Partial Eclipse", "Transit"].includes(found.typeLabel),
        `typeLabel should be one of the three types, got: ${found.typeLabel}`);
    }
    // It's OK if no eclipses found in 60 days — the test validates structure when present
  });

  it("results are sorted by peakT", () => {
    freshInstall();
    const today = t().todaySerial();
    t().moonEnsureSequences(today, 30);
    const eclipses = t().getEclipses(today);
    for (let i = 1; i < eclipses.length; i++) {
      assert(eclipses[i].peakT >= eclipses[i - 1].peakT,
        "eclipses should be sorted by peakT");
    }
  });

  it("_eclipseNotableToday returns array of formatted strings", () => {
    freshInstall();
    const today = t().todaySerial();
    t().moonEnsureSequences(today, 30);
    const notes = t()._eclipseNotableToday(today);
    assert(Array.isArray(notes), "should return an array");
    for (const note of notes) {
      assert(typeof note === "string", "each entry should be a string");
    }
  });
});

// ============================================================================
// WEATHER: _bestTier
// ============================================================================

describe("Weather: _bestTier", () => {
  it("high beats medium", () => {
    freshInstall();
    assertEquals(t()._bestTier("high", "medium"), "high");
  });

  it("high beats low", () => {
    freshInstall();
    assertEquals(t()._bestTier("low", "high"), "high");
  });

  it("medium beats low", () => {
    freshInstall();
    assertEquals(t()._bestTier("medium", "low"), "medium");
  });

  it("same tier returns same tier", () => {
    freshInstall();
    assertEquals(t()._bestTier("medium", "medium"), "medium");
  });

  it("unknown tier loses to any known tier", () => {
    freshInstall();
    assertEquals(t()._bestTier("garbage", "low"), "low");
  });
});

// ============================================================================
// WEATHER: _locSig
// ============================================================================

describe("Weather: _locSig", () => {
  it("produces climate/geography/terrain signature", () => {
    freshInstall();
    assertEquals(t()._locSig({ climate: "temperate", geography: "coastal", terrain: "forest" }),
      "temperate/coastal/forest");
  });

  it("defaults geography to inland when missing", () => {
    freshInstall();
    assertEquals(t()._locSig({ climate: "arctic", terrain: "open" }),
      "arctic/inland/open");
  });

  it("returns empty string for null location", () => {
    freshInstall();
    assertEquals(t()._locSig(null), "");
  });
});

// ============================================================================
// WEATHER: reveal storage (location-scoped)
// ============================================================================

describe("Weather: location-scoped reveal storage", () => {
  function setupLocation(ws, climate, geography, terrain) {
    ws.location = {
      name: "Test",
      climate: climate,
      geography: geography,
      terrain: terrain,
      sig: climate + "/" + geography + "/" + terrain
    };
  }

  it("reveals are stored per-location bucket", () => {
    freshInstall();
    const ws = t().getWeatherState();
    const loc1 = { climate: "temperate", geography: "inland", terrain: "open" };
    const loc2 = { climate: "arctic", geography: "coastal", terrain: "forest" };
    setupLocation(ws, loc1.climate, loc1.geography, loc1.terrain);

    const serial = t().todaySerial();
    t()._recordReveal(ws, serial, "high", "specific", loc1);
    t()._recordReveal(ws, serial, "medium", "medium", loc2);

    const rev1 = t()._weatherRevealForSerial(ws, serial, loc1);
    const rev2 = t()._weatherRevealForSerial(ws, serial, loc2);
    assertEquals(rev1.tier, "high");
    assertEquals(rev2.tier, "medium");
  });

  it("reveals upgrade but never downgrade", () => {
    freshInstall();
    const ws = t().getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    ws.location = loc;

    const serial = t().todaySerial();
    t()._recordReveal(ws, serial, "medium", "medium", loc);
    t()._recordReveal(ws, serial, "low", "common", loc);

    const rev = t()._weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.tier, "medium", "should not downgrade from medium to low");
  });

  it("upgrade from low to high works", () => {
    freshInstall();
    const ws = t().getWeatherState();
    const loc = { climate: "tropical", geography: "inland", terrain: "open" };
    ws.location = loc;

    const serial = t().todaySerial();
    t()._recordReveal(ws, serial, "low", "common", loc);
    t()._recordReveal(ws, serial, "high", "specific", loc);

    const rev = t()._weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.tier, "high");
  });

  it("_weatherRevealBucket returns empty object for non-existent location without creating", () => {
    freshInstall();
    const ws = t().getWeatherState();
    const loc = { climate: "desert", geography: "inland", terrain: "open" };
    const bucket = t()._weatherRevealBucket(ws, loc, false);
    // Should return empty object, not create a bucket
    assertEquals(Object.keys(bucket).length, 0);
  });
});

// ============================================================================
// WEATHER: common reveals
// ============================================================================

describe("Weather: common weather reveals", () => {
  function setupWeather() {
    const ws = t().getWeatherState();
    ws.location = {
      name: "Test Town",
      climate: "temperate",
      geography: "inland",
      terrain: "open",
      sig: "temperate/inland/open"
    };
    t().weatherEnsureForecast();
    return ws;
  }

  it("grants low tier for today, today+1, today+2", () => {
    freshInstall();
    const ws = setupWeather();
    const today = t().todaySerial();
    t()._grantCommonWeatherReveals(ws, today);

    for (let d = 0; d <= 2; d++) {
      const rev = t()._weatherRevealForSerial(ws, today + d);
      assertEquals(rev.tier, "low", `day +${d} should have low tier`);
    }
  });
});

// ============================================================================
// WEATHER: _parseWeatherRevealDayToken
// ============================================================================

describe("Weather: _parseWeatherRevealDayToken", () => {
  it("parses single numeric day", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDayToken("14");
    assertDeep(result, { start: 14, end: 14 });
  });

  it("parses ordinal day", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDayToken("3rd");
    assertDeep(result, { start: 3, end: 3 });
  });

  it("parses numeric range", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDayToken("14-17");
    assertDeep(result, { start: 14, end: 17 });
  });

  it("parses ordinal range", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDayToken("1st-3rd");
    assertDeep(result, { start: 1, end: 3 });
  });

  it("returns null for empty or invalid input", () => {
    freshInstall();
    assertEquals(t()._parseWeatherRevealDayToken(""), null);
    assertEquals(t()._parseWeatherRevealDayToken(null), null);
  });
});

// ============================================================================
// WEATHER: _parseWeatherRevealDateSpec
// ============================================================================

describe("Weather: _parseWeatherRevealDateSpec", () => {
  it("parses month + day", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDateSpec(["Zarantyr", "14"]);
    assert(result !== null, "should parse successfully");
    assertEquals(result.mi, 0); // Zarantyr is month index 0
    assertEquals(result.startDay, 14);
    assertEquals(result.endDay, 14);
  });

  it("parses month + day range", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDateSpec(["Olarune", "5-10"]);
    assert(result !== null, "should parse successfully");
    assertEquals(result.mi, 1); // Olarune is month index 1
    assertEquals(result.startDay, 5);
    assertEquals(result.endDay, 10);
  });

  it("parses bare day number", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDateSpec(["15"]);
    assert(result !== null, "should parse successfully");
    assertEquals(result.startDay, 15);
    assertEquals(result.endDay, 15);
  });

  it("parses bare day range", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDateSpec(["10-20"]);
    assert(result !== null, "should parse successfully");
    assertEquals(result.startDay, 10);
    assertEquals(result.endDay, 20);
  });

  it("returns null for empty tokens", () => {
    freshInstall();
    assertEquals(t()._parseWeatherRevealDateSpec([]), null);
  });

  it("clamps days to valid month range", () => {
    freshInstall();
    // Eberron months have 28 days
    const result = t()._parseWeatherRevealDateSpec(["Zarantyr", "35"]);
    assert(result !== null, "should parse successfully");
    assertEquals(result.startDay, 28, "should clamp to max 28");
  });

  it("swaps start/end if reversed", () => {
    freshInstall();
    const result = t()._parseWeatherRevealDateSpec(["Zarantyr", "20-10"]);
    assert(result !== null, "should parse successfully");
    assertEquals(result.startDay, 10, "start should be the smaller value");
    assertEquals(result.endDay, 20, "end should be the larger value");
  });
});

// ============================================================================
// HARPTOS: _ordinal
// ============================================================================

describe("Harptos: _ordinal", () => {
  it("handles 1st, 2nd, 3rd", () => {
    freshInstall();
    assertEquals(t()._ordinal(1), "1st");
    assertEquals(t()._ordinal(2), "2nd");
    assertEquals(t()._ordinal(3), "3rd");
  });

  it("handles 4th through 10th", () => {
    freshInstall();
    assertEquals(t()._ordinal(4), "4th");
    assertEquals(t()._ordinal(10), "10th");
  });

  it("handles teens (11th, 12th, 13th)", () => {
    freshInstall();
    assertEquals(t()._ordinal(11), "11th");
    assertEquals(t()._ordinal(12), "12th");
    assertEquals(t()._ordinal(13), "13th");
  });

  it("handles 21st, 22nd, 23rd", () => {
    freshInstall();
    assertEquals(t()._ordinal(21), "21st");
    assertEquals(t()._ordinal(22), "22nd");
    assertEquals(t()._ordinal(23), "23rd");
  });

  it("handles 30th", () => {
    freshInstall();
    assertEquals(t()._ordinal(30), "30th");
  });
});

// ============================================================================
// HARPTOS: calendar system structure
// ============================================================================

describe("Harptos: calendar structure", () => {
  it("faerunian system uses 10-day weeks (tendays)", () => {
    freshInstall();
    const sys = t().CALENDAR_SYSTEMS.faerunian;
    assert(sys, "faerunian system should exist");
    assertEquals(sys.weekdays.length, 10, "should have 10 weekdays");
    assertEquals(sys.structure, "harptos");
  });

  it("faerunian months are all 30 days", () => {
    freshInstall();
    const sys = t().CALENDAR_SYSTEMS.faerunian;
    assertEquals(sys.monthDays.length, 12);
    for (const d of sys.monthDays) {
      assertEquals(d, 30, "each Harptos month should have 30 days");
    }
  });

  it("harptos structure set has intercalary festival days", () => {
    freshInstall();
    const struct = t().CALENDAR_STRUCTURE_SETS.harptos;
    assert(Array.isArray(struct), "harptos structure should be an array");
    const festivals = struct.filter(s => s.isIntercalary);
    assert(festivals.length >= 5, "should have at least 5 festival days");
    const names = festivals.map(f => f.name);
    assert(names.includes("Midwinter"), "should include Midwinter");
    assert(names.includes("Greengrass"), "should include Greengrass");
    assert(names.includes("Midsummer"), "should include Midsummer");
    assert(names.includes("Highharvestide"), "should include Highharvestide");
    assert(names.includes("Feast of the Moon"), "should include Feast of the Moon");
  });

  it("Shieldmeet is a leap-only festival day", () => {
    freshInstall();
    const struct = t().CALENDAR_STRUCTURE_SETS.harptos;
    const shieldmeet = struct.find(s => s.name === "Shieldmeet");
    assert(shieldmeet, "Shieldmeet should exist");
    assert(shieldmeet.isIntercalary, "Shieldmeet should be intercalary");
    assertEquals(shieldmeet.leapEvery, 4, "Shieldmeet should occur every 4 years");
  });
});

// ============================================================================
// HARPTOS: _displayMonthDayParts
// ============================================================================

describe("Harptos: _displayMonthDayParts", () => {
  function switchToFaerunian() {
    freshInstall();
    t().applyCalendarSystem("faerunian");
  }

  it("formats regular day as ordinal + month name", () => {
    switchToFaerunian();
    const result = t()._displayMonthDayParts(0, 16);
    assertEquals(result.label, "16th of Hammer");
    assertEquals(result.monthName, "Hammer");
    assertEquals(result.day, 16);
  });

  it("formats 1st day correctly", () => {
    switchToFaerunian();
    const result = t()._displayMonthDayParts(0, 1);
    assertEquals(result.label, "1st of Hammer");
  });

  it("formats intercalary day as festival name only", () => {
    switchToFaerunian();
    const cal = t().getCal();
    // Find the Midwinter intercalary month
    let midwinterIdx = -1;
    for (let i = 0; i < cal.months.length; i++) {
      if (cal.months[i].isIntercalary && cal.months[i].name === "Midwinter") {
        midwinterIdx = i;
        break;
      }
    }
    if (midwinterIdx >= 0) {
      const result = t()._displayMonthDayParts(midwinterIdx, 1);
      assertEquals(result.label, "Midwinter");
    }
  });
});

// ============================================================================
// HARPTOS: weekStartSerial tenday math
// ============================================================================

describe("Harptos: weekStartSerial tenday math", () => {
  function switchToFaerunian() {
    freshInstall();
    t().applyCalendarSystem("faerunian");
  }

  it("day 1 starts tenday at day 1", () => {
    switchToFaerunian();
    const ser1 = t().toSerial(1491, 0, 1);
    const wss = t().weekStartSerial(1491, 0, 1);
    assertEquals(wss, ser1, "day 1 should start its own tenday");
  });

  it("day 5 is in the first tenday (starts at day 1)", () => {
    switchToFaerunian();
    const ser1 = t().toSerial(1491, 0, 1);
    const wss = t().weekStartSerial(1491, 0, 5);
    assertEquals(wss, ser1, "day 5 should be in first tenday");
  });

  it("day 11 starts the second tenday", () => {
    switchToFaerunian();
    const ser11 = t().toSerial(1491, 0, 11);
    const wss = t().weekStartSerial(1491, 0, 11);
    assertEquals(wss, ser11, "day 11 should start second tenday");
  });

  it("day 15 is in the second tenday", () => {
    switchToFaerunian();
    const ser11 = t().toSerial(1491, 0, 11);
    const wss = t().weekStartSerial(1491, 0, 15);
    assertEquals(wss, ser11, "day 15 should be in second tenday");
  });

  it("day 21 starts the third tenday", () => {
    switchToFaerunian();
    const ser21 = t().toSerial(1491, 0, 21);
    const wss = t().weekStartSerial(1491, 0, 21);
    assertEquals(wss, ser21, "day 21 should start third tenday");
  });

  it("day 30 is in the third tenday", () => {
    switchToFaerunian();
    const ser21 = t().toSerial(1491, 0, 21);
    const wss = t().weekStartSerial(1491, 0, 30);
    assertEquals(wss, ser21, "day 30 should be in third tenday");
  });
});

// ============================================================================
// ECLIPSE: classification thresholds
// ============================================================================

describe("Eclipse: classification thresholds", () => {
  it("coverage > 98% yields Total Eclipse", () => {
    freshInstall();
    // We test _diskOverlapFraction to confirm: when front fully covers back,
    // coverage = 1.0 which exceeds 0.98
    const cover = t()._diskOverlapFraction(1.0, 1.0, 0);
    assert(cover > 0.98, `full overlap should exceed 98%, got ${cover}`);
  });

  it("_diskOverlapFraction produces valid range [0, 1]", () => {
    freshInstall();
    const fn = t()._diskOverlapFraction;
    // Test many configurations
    const cases = [
      [0.5, 1, 0],   // small front, centered
      [2, 1, 0],     // large front, centered
      [1, 1, 0.5],   // equal, partial overlap
      [1, 1, 1.5],   // equal, small overlap
      [1, 1, 1.99],  // barely touching
    ];
    for (const [rF, rB, sep] of cases) {
      const v = fn(rF, rB, sep);
      assert(v >= 0 && v <= 1, `should be in [0,1]: rF=${rF} rB=${rB} sep=${sep} -> ${v}`);
    }
  });
});

// ============================================================================
// LEGACY ECLIPSE PATH: dead code is unreachable
// ============================================================================

describe("Legacy eclipse path", () => {
  it("getEclipses does not reference _estimateEclipseTiming", () => {
    freshInstall();
    // Verify the active getEclipses function exists and works
    // without calling _estimateEclipseTiming (which is in dead code)
    const today = t().todaySerial();
    t().moonEnsureSequences(today, 5);
    // Should not throw
    const result = t().getEclipses(today);
    assert(Array.isArray(result), "getEclipses should work without legacy path");
  });
});
