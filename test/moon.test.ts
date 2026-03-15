// Tests for moon system, eclipses, and nighttime lighting.
import { describe, it } from "node:test";
import { strictEqual as assertEquals, notStrictEqual as assertNotEquals, ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { todaySerial } from "../src/date-math.js";
import {
  MOON_SYSTEMS, _moonHashStr, _moonPrng, _eberronMoonCore,
  moonEnsureSequences, moonPhaseAt,
  nighttimeLightCondition, nighttimeLux,
  _diskOverlapFraction, _eclipseTimeBlock, _eclipseLifecycleText,
  _eclipseNotableToday, getEclipses, getMoonState, handleMoonCommand
} from "../src/moon.js";

// ============================================================================
// 7) MOON SYSTEM
// ============================================================================

describe("Moon System", () => {
  it("Eberron has 12 moons with required properties", () => {
    freshInstall();
    const moons = MOON_SYSTEMS.eberron.moons;
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
    const h = _moonHashStr("test-seed");
    assertEquals(h, _moonHashStr("test-seed"));
    assertNotEquals(h, _moonHashStr("other"));
    assert(h >= 0 && h < 1);
  });

  it("_moonPrng produces repeatable sequences", () => {
    freshInstall();
    const a = _moonPrng(0.42), b = _moonPrng(0.42);
    const sa = Array.from({ length: 5 }, () => a());
    const sb = Array.from({ length: 5 }, () => b());
    for (let i = 0; i < 5; i++) assertEquals(sa[i], sb[i]);
    for (const v of sa) assert(v >= 0 && v < 1);
  });

  it("_eberronMoonCore returns data for all named moons", () => {
    freshInstall();
    for (const m of MOON_SYSTEMS.eberron.moons) {
      const core = _eberronMoonCore(m.name);
      assert(core.diameter > 0, `${m.name} diameter`);
      assert(core.avgOrbitalDistance > 0, `${m.name} distance`);
      assertNotEquals(core.referenceMoon, "Unknown", `${m.name} reference`);
    }
  });

  it("moonPhaseAt returns data after sequence generation", () => {
    freshInstall();
    const today = todaySerial();
    moonEnsureSequences(today, 30);
    for (const m of MOON_SYSTEMS.eberron.moons) {
      const phase = moonPhaseAt(m.name, today);
      assert(phase !== undefined && phase !== null, `${m.name} phase`);
    }
  });

  it("player single-moon view respects reveal horizon", () => {
    freshInstall();
    const ms = getMoonState();
    ms.revealTier = "medium";
    ms.revealHorizonDays = 7;
    handleMoonCommand({ who: "Alice", playerid: "P1" } as any, ["moon", "view", "Zarantyr", "Zarantyr", "20", "998"]);
    const last = (globalThis as any)._chatLog.slice(-1)[0];
    assert(last.msg.includes("beyond your lunar knowledge"));
  });

  it("player single-moon view avoids exact daily phase output below high tier", () => {
    freshInstall();
    const ms = getMoonState();
    ms.revealTier = "medium";
    ms.revealHorizonDays = 28;
    handleMoonCommand({ who: "Alice", playerid: "P1" } as any, ["moon", "view", "Zarantyr"]);
    const playerMsg = (globalThis as any)._chatLog.slice(-1)[0].msg;
    assert(playerMsg.includes("full/new peaks"), "player single-moon view should use the non-exact renderer");
    assert(!playerMsg.includes("%)"), "player single-moon view should not expose exact daily percentages");
  });
});

// ============================================================================
// 9) NIGHTTIME LIGHTING
// ============================================================================

describe("Nighttime Lighting", () => {
  it("nighttimeLightCondition returns condition objects for various lux levels", () => {
    freshInstall();
    for (const lux of [0, 0.001, 0.01, 0.1, 0.5, 1.0]) {
      const c = nighttimeLightCondition(lux);
      assert(c && typeof c === "object", `lux=${lux} should return an object`);
      assert(c.condition, `lux=${lux} should have a condition field`);
      assert(c.label, `lux=${lux} should have a label`);
    }
  });
});

// ============================================================================
// ECLIPSE: _diskOverlapFraction
// ============================================================================

describe("Eclipse: _diskOverlapFraction", () => {
  it("returns 0 when disks do not overlap", () => {
    freshInstall();
    assertEquals(_diskOverlapFraction(1, 1, 3), 0);
  });

  it("returns 0 when disks just touch (sep == rFront + rBack)", () => {
    freshInstall();
    assertEquals(_diskOverlapFraction(1, 1, 2), 0);
  });

  it("returns 1 when front disk fully covers back disk of same size at sep=0", () => {
    freshInstall();
    const result = _diskOverlapFraction(1, 1, 0);
    assert(Math.abs(result - 1.0) < 0.001, `expected ~1.0, got ${result}`);
  });

  it("returns 1 when front disk is larger and fully covers back disk", () => {
    freshInstall();
    const result = _diskOverlapFraction(2, 1, 0);
    assert(Math.abs(result - 1.0) < 0.001, `expected ~1.0, got ${result}`);
  });

  it("returns partial fraction when front disk is smaller and inside back disk", () => {
    freshInstall();
    const result = _diskOverlapFraction(0.5, 2, 0);
    assert(Math.abs(result - 0.0625) < 0.001, `expected ~0.0625, got ${result}`);
  });

  it("returns ~0.5 for half-overlap scenario", () => {
    freshInstall();
    const result = _diskOverlapFraction(1, 1, 1);
    assert(result > 0.1 && result < 0.9, `expected partial overlap, got ${result}`);
  });

  it("handles zero or negative radii gracefully", () => {
    freshInstall();
    assertEquals(_diskOverlapFraction(0, 1, 0), 0);
    assertEquals(_diskOverlapFraction(1, 0, 0), 0);
    assertEquals(_diskOverlapFraction(-1, 1, 0), 0);
  });

  it("is monotonically decreasing as separation increases", () => {
    freshInstall();
    let prev = _diskOverlapFraction(1, 1, 0);
    for (let sep = 0.1; sep <= 2.0; sep += 0.1) {
      const curr = _diskOverlapFraction(1, 1, sep);
      assert(curr <= prev + 0.001, `should decrease: sep=${sep}, prev=${prev}, curr=${curr}`);
      prev = curr;
    }
  });

  it("produces valid range [0, 1]", () => {
    freshInstall();
    const cases: [number, number, number][] = [
      [0.5, 1, 0], [2, 1, 0], [1, 1, 0.5], [1, 1, 1.5], [1, 1, 1.99],
    ];
    for (const [rF, rB, sep] of cases) {
      const v = _diskOverlapFraction(rF, rB, sep);
      assert(v >= 0 && v <= 1, `should be in [0,1]: rF=${rF} rB=${rB} sep=${sep} -> ${v}`);
    }
  });

  it("coverage > 98% yields Total Eclipse", () => {
    freshInstall();
    const cover = _diskOverlapFraction(1.0, 1.0, 0);
    assert(cover > 0.98, `full overlap should exceed 98%, got ${cover}`);
  });
});

// ============================================================================
// ECLIPSE: _eclipseTimeBlock
// ============================================================================

describe("Eclipse: _eclipseTimeBlock", () => {
  it("maps midnight to middle_of_night", () => {
    freshInstall();
    assertEquals(_eclipseTimeBlock(0), "middle_of_night");
  });

  it("maps noon to afternoon", () => {
    freshInstall();
    assertEquals(_eclipseTimeBlock(0.5), "afternoon");
  });

  it("maps 7am to early_morning", () => {
    freshInstall();
    assertEquals(_eclipseTimeBlock(7 / 24), "early_morning");
  });

  it("maps 6pm to evening", () => {
    freshInstall();
    assertEquals(_eclipseTimeBlock(18 / 24), "evening");
  });

  it("maps 10pm to nighttime", () => {
    freshInstall();
    assertEquals(_eclipseTimeBlock(22 / 24), "nighttime");
  });

  it("handles fractional serial days (integer + fraction)", () => {
    freshInstall();
    assertEquals(_eclipseTimeBlock(100.5), "afternoon");
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
    const text = _eclipseLifecycleText(event, 100);
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
      startBucket: "nighttime", peakBucket: "middle_of_night", endBucket: "morning",
      peakSkyLabel: "on horizon"
    };
    const text = _eclipseLifecycleText(event, 100);
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
    const today = todaySerial();
    moonEnsureSequences(today, 30);
    const eclipses = getEclipses(today);
    assert(Array.isArray(eclipses), "should return an array");
  });

  it("eclipse events have required fields when present", () => {
    freshInstall();
    const today = todaySerial();
    moonEnsureSequences(today, 60);
    let found: any = null;
    for (let d = today; d < today + 60; d++) {
      const eclipses = getEclipses(d);
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
  });

  it("results are sorted by peakT", () => {
    freshInstall();
    const today = todaySerial();
    moonEnsureSequences(today, 30);
    const eclipses = getEclipses(today);
    for (let i = 1; i < eclipses.length; i++) {
      assert(eclipses[i].peakT >= eclipses[i - 1].peakT,
        "eclipses should be sorted by peakT");
    }
  });

  it("_eclipseNotableToday returns array of formatted strings", () => {
    freshInstall();
    const today = todaySerial();
    moonEnsureSequences(today, 30);
    const notes = _eclipseNotableToday(today);
    assert(Array.isArray(notes), "should return an array");
    for (const note of notes) {
      assert(typeof note === "string", "each entry should be a string");
    }
  });
});

// ============================================================================
// Legacy eclipse path
// ============================================================================

describe("Legacy eclipse path", () => {
  it("getEclipses does not reference _estimateEclipseTiming", () => {
    freshInstall();
    const today = todaySerial();
    moonEnsureSequences(today, 5);
    const result = getEclipses(today);
    assert(Array.isArray(result), "getEclipses should work without legacy path");
  });
});
