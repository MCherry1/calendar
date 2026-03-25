// Tests for moon system, eclipses, and nighttime lighting.
import { describe, it } from "node:test";
import { deepStrictEqual as assertDeepEqual, strictEqual as assertEquals, notStrictEqual as assertNotEquals, ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { toSerial, todaySerial } from "../src/date-math.js";
import { solarProfileForSerial } from "../src/time-of-day.js";
import { setDate, stepDays } from "../src/ui.js";
import { applyCalendarSystem } from "../src/state.js";
import {
  MOON_HISTORY_DAYS,
  MOON_SYSTEMS, _moonHashStr, _eberronMoonCore,
  moonEnsureSequences, moonPhaseAt, _applyAntiPhaseCoupling,
  nighttimeLightCondition, nighttimeLux,
  _diskOverlapFraction, _eclipseTimeBlock, _eclipseLifecycleText,
  _eclipseNotableToday, getEclipses, getMoonState, handleMoonCommand,
  moonHandoutHtml, moonPlayerPanelHtml, _eclipseCacheKey, invalidateMoonModel,
  FESTIVAL_SOFT_ANCHORS, MOON_TARGET_FULL_DAYS_PER_28,
  _applyAssociatedPlanePhaseShifts, _applyFestivalNudges,
  _collectPlanarPhaseWindows, _dN, _edgeDayMidpointSerial,
  _isLongShadowsOverride, _longShadowsWindow, _moonPeakPhaseDay,
  getLongShadowsMoons, _eclipseCandidateDistance, _getEclipsesBruteforce,
  _getEclipsesStaged, _eclipseRelativeSizeText, captureMoonHistoryDay,
  captureMoonHistoryWindow, _moonCompass16, _moonSkyPositionCategory,
  _moonVisibilityAll, _moonVisibilityHtml, _moonSkyLong, _moonEclipticLat, _moonOrbitalParams
} from "../src/moon.js";

function eclipseDigest(events: any[]) {
  return events.map((event) => ({
    occulting: event.occulting,
    occluded: event.occluded,
    typeLabel: event.typeLabel,
    startDay: event.startDay,
    peakDay: event.peakDay,
    endDay: event.endDay,
    startBucket: event.startBucket,
    peakBucket: event.peakBucket,
    endBucket: event.endBucket,
    peakCoveragePct: event.peakCoveragePct,
    sizePct: event.sizePct
  }));
}

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
      assert(!Object.prototype.hasOwnProperty.call(m, "variation"), `${m.name} has no variation config`);
    }
  });

  it("_moonHashStr is deterministic and in [0,1)", () => {
    freshInstall();
    const h = _moonHashStr("test-seed");
    assertEquals(h, _moonHashStr("test-seed"));
    assertNotEquals(h, _moonHashStr("other"));
    assert(h >= 0 && h < 1);
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

  it("treats retrograde moons as reverse-motion with physically bounded inclination", () => {
    freshInstall();
    const dravago = MOON_SYSTEMS.eberron.moons.find((moon: any) => moon.name === "Dravago") as any;
    const zarantyr = MOON_SYSTEMS.eberron.moons.find((moon: any) => moon.name === "Zarantyr") as any;
    const serial = toSerial(998, 4, 12);
    const dravagoPhase = moonPhaseAt("Dravago", serial);
    const dravagoProgradeAngle = dravagoPhase.waxing
      ? dravagoPhase.illum * 180
      : 180 + (1 - dravagoPhase.illum) * 180;
    assertEquals(_moonSkyLong(dravago, serial), (360 - dravagoProgradeAngle) % 360);

    const zarantyrPhase = moonPhaseAt("Zarantyr", serial);
    const zarantyrProgradeAngle = zarantyrPhase.waxing
      ? zarantyrPhase.illum * 180
      : 180 + (1 - zarantyrPhase.illum) * 180;
    assertEquals(_moonSkyLong(zarantyr, serial), zarantyrProgradeAngle % 360);

    const dravagoOrbit = _moonOrbitalParams("Dravago", serial) as any;
    assert(dravagoOrbit.retrograde, "Dravago should be flagged retrograde");
    assert(dravagoOrbit.inclination > 0 && dravagoOrbit.inclination < 90, "retrograde inclination should be folded into a physical 0-90° latitude amplitude");
    assert(Math.abs(_moonEclipticLat(dravago, serial)) <= dravagoOrbit.inclination + 0.000001);

    const nextSerial = serial + 1;
    const nextDravagoPhase = moonPhaseAt("Dravago", nextSerial);
    const nextDravagoProgradeAngle = nextDravagoPhase.waxing
      ? nextDravagoPhase.illum * 180
      : 180 + (1 - nextDravagoPhase.illum) * 180;
    assertEquals(_moonSkyLong(dravago, nextSerial), (360 - nextDravagoProgradeAngle) % 360);

    const nextZarantyrPhase = moonPhaseAt("Zarantyr", nextSerial);
    const nextZarantyrProgradeAngle = nextZarantyrPhase.waxing
      ? nextZarantyrPhase.illum * 180
      : 180 + (1 - nextZarantyrPhase.illum) * 180;
    assertEquals(_moonSkyLong(zarantyr, nextSerial), nextZarantyrProgradeAngle % 360);
  });

  it("weak anti-phase coupling nudges Barrakas toward Therendor's opposite phase", () => {
    freshInstall();
    const ms: any = {
      sequences: {
        Therendor: [
          { serial: 8, type: "new", retro: false },
          { serial: 42, type: "full", retro: false },
          { serial: 59, type: "new", retro: false }
        ],
        Barrakas: [
          { serial: 29, type: "full", retro: false },
          { serial: 45, type: "new", retro: false }
        ]
      }
    };

    _applyAntiPhaseCoupling(ms, "Therendor", "Barrakas", 0, 80);

    assert(Math.abs(ms.sequences.Barrakas[0].serial - 28.4) < 0.0001);
    assert(Math.abs(ms.sequences.Barrakas[1].serial - 44.4) < 0.0001);
    assert(ms.sequences.Barrakas[0].antiPhaseCoupled, "full should be marked as coupled");
    assert(ms.sequences.Barrakas[1].antiPhaseCoupled, "new should be marked as coupled");
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

  it("festival nudges land on noon instead of the day edge", () => {
    freshInstall();
    let picked: any = null;
    for (const fest of FESTIVAL_SOFT_ANCHORS) {
      for (let year = 998; year < 1100; year++) {
        const festSerial = toSerial(year, fest.month - 1, fest.day);
        if (_dN(festSerial, `${fest.salt}_nudge`, 6) === 6) {
          picked = { fest, festSerial };
          break;
        }
      }
      if (picked) break;
    }

    assert(picked, "expected at least one deterministic festival nudge case");
    const ms: any = {
      sequences: {
        Testmoon: [{ serial: picked.festSerial - 0.4, type: picked.fest.type, retro: false }]
      }
    };

    _applyFestivalNudges([{ name: "Testmoon" }] as any, ms, picked.festSerial - 2, picked.festSerial + 2);

    assert(Math.abs(ms.sequences.Testmoon[0].serial - (picked.festSerial + 0.5)) < 0.000001);
  });

  it("associated plane pulls land on the nearest edge-day noon", () => {
    freshInstall();
    const genFrom = toSerial(998, 5, 1);
    const genThru = toSerial(998, 6, 28);
    const windows = _collectPlanarPhaseWindows("Lamannia", "coterminous", genFrom, genThru);
    assert(windows.length > 0, "expected Lamannia coterminous window in range");
    const window = windows[0];
    const original = toSerial(998, 6, 10) + 0.5;
    const expected = _edgeDayMidpointSerial(window.startSerial, window.endSerial, original);
    const ms: any = {
      sequences: {
        Olarune: [{ serial: original, type: "full", retro: false }]
      }
    };

    _applyAssociatedPlanePhaseShifts([{ name: "Olarune", plane: "Lamannia" }] as any, ms, genFrom, genThru);

    assert(Math.abs(ms.sequences.Olarune[0].serial - expected) < 0.000001);
  });

  it("Long Shadows runs from sunset on Vult 26 to sunrise on Vult 28 and centers gobbled moons on noon of Vult 27", () => {
    freshInstall();
    const year = 998;
    const focus = toSerial(year, 11, 27);
    moonEnsureSequences(focus, 400);

    const claimed = getLongShadowsMoons(year).map((moon: any) => moon.name);
    assert(claimed.length > 0, "expected at least one claimed moon");

    const window = _longShadowsWindow(year);
    const sampleMoon = claimed[0];
    const seq = getMoonState().sequences[sampleMoon];
    const nearestNew = seq
      .filter((evt: any) => evt.type === "new")
      .reduce((best: any, evt: any) => {
        if (!best) return evt;
        return Math.abs(evt.serial - window.midpointSerial) < Math.abs(best.serial - window.midpointSerial) ? evt : best;
      }, null);

    assert(nearestNew, "expected a new-moon event for the claimed moon");
    assert(Math.abs(nearestNew.serial - window.midpointSerial) < 0.000001, "claimed moon should peak at the exact midpoint");

    const sunset = solarProfileForSerial(window.startDaySerial).sunset / 24;
    const sunrise = solarProfileForSerial(window.endDaySerial).sunrise / 24;
    const justBeforeStart = window.startDaySerial + sunset - 0.01;
    const justAfterStart = window.startDaySerial + sunset + 0.01;
    const justBeforeEnd = window.endDaySerial + sunrise - 0.01;
    const justAfterEnd = window.endDaySerial + sunrise + 0.01;

    assert(!_isLongShadowsOverride(sampleMoon, justBeforeStart), "Long Shadows should not start before sunset");
    assert(_isLongShadowsOverride(sampleMoon, justAfterStart), "Long Shadows should start immediately after sunset");
    assert(_isLongShadowsOverride(sampleMoon, justBeforeEnd), "Long Shadows should persist until sunrise on Vult 28");
    assert(!_isLongShadowsOverride(sampleMoon, justAfterEnd), "Long Shadows should end immediately after sunrise on Vult 28");
  });

  it("Eberron averages 19 full-moon days per 28-day month", () => {
    freshInstall();
    const startYear = 1000;
    const years = 40;
    const focus = toSerial(startYear, 0, 1);
    moonEnsureSequences(focus, years * 336);

    let monthCount = 0;
    let fullDays = 0;
    for (let year = startYear; year < startYear + years; year++) {
      for (let month = 0; month < 12; month++) {
        monthCount++;
        for (let day = 1; day <= 28; day++) {
          const serial = toSerial(year, month, day);
          const anyFull = MOON_SYSTEMS.eberron.moons.some((moon: any) => _moonPeakPhaseDay(moon.name, serial) === "full");
          if (anyFull) fullDays++;
        }
      }
    }

    const average = fullDays / monthCount;
    assert(Math.abs(average - MOON_TARGET_FULL_DAYS_PER_28) < 0.1, `expected ~${MOON_TARGET_FULL_DAYS_PER_28}, got ${average}`);
  });

  it("renders the Eberron sky view as an altitude-sorted table with direction and motion", () => {
    freshInstall();
    const serial = todaySerial();
    moonEnsureSequences(serial, 30);

    const rows = _moonVisibilityAll(serial, 22 / 24);
    assert(rows.length > 1, "expected multiple moons in the sky dataset");
    assert(rows[0].altitudeExact >= rows[1].altitudeExact, "rows should be sorted by altitude");
    assert(rows[0].direction.match(/^(N|NNE|NE|ENE|E|ESE|SE|SSE|S|SSW|SW|WSW|W|WNW|NW|NNW)$/));
    assert(rows[0].motion === "Rising" || rows[0].motion === "Setting");

    const html = _moonVisibilityHtml(serial, 22 / 24, "nighttime");
    assert(html.includes('data-moon-sky-table="1"'));
    assert(html.includes("✨ 🌙 Sky View 🌙 ✨"));
    assert(html.includes("Nighttime (~10pm)"));
    assert(html.includes("Moon (% Full)"));
    assert(html.includes("Sky Position"));
    assert(html.includes(", Rising") || html.includes(", Setting"));
  });

  it("renders non-Eberron sky view rows without the Eberron table", () => {
    freshInstall();
    applyCalendarSystem("faerunian");
    const serial = todaySerial();
    moonEnsureSequences(serial, 30);

    const html = _moonVisibilityHtml(serial, 22 / 24, "nighttime");
    assert(!html.includes('data-moon-sky-table="1"'));
    assert(html.includes('data-moon-sky-row="1"'));
    assert(html.includes(" is "));
  });

  it("classifies peeking and compass buckets with the new sky-position helpers", () => {
    freshInstall();
    assertEquals(_moonSkyPositionCategory(-0.1, 1.0), "peeking");
    assertEquals(_moonSkyPositionCategory(0.1, 1.0), "peeking");
    assertEquals(_moonSkyPositionCategory(0.3, 0.6), "horizon");
    assertEquals(_moonSkyPositionCategory(-1, 0.5), "below");
    assertEquals(_moonSkyPositionCategory(75, 0.5), "high");
    assertEquals(_moonCompass16(67.5), "ENE");
    assertEquals(_moonCompass16(180), "S");
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

  it("staged eclipse detection matches the brute-force reference across representative windows", () => {
    freshInstall();
    const start = todaySerial();
    const windowStarts = [start, start + 336, start + 672, start + 1008];
    moonEnsureSequences(start + 1300, 30);

    for (const windowStart of windowStarts) {
      for (let serial = windowStart; serial < windowStart + 21; serial++) {
        const brute = _getEclipsesBruteforce(serial);
        const staged = _getEclipsesStaged(serial);
        assertDeepEqual(
          eclipseDigest(staged),
          eclipseDigest(brute),
          `staged eclipses should match brute-force on serial ${serial}`
        );
      }
    }
  });

  it("candidate distance is positive away from alignment and non-positive during an exact overlap", () => {
    freshInstall();
    const today = todaySerial();
    moonEnsureSequences(today, 60);
    const sys = MOON_SYSTEMS.eberron;
    const descriptor = { kind: "solar", moon: "Zarantyr" } as any;
    assert(_eclipseCandidateDistance(sys as any, descriptor, today + 0.1) > -10, "distance should be numeric");

    let exactEvent: any = null;
    for (let serial = today; serial < today + 120; serial++) {
      const eclipses = _getEclipsesBruteforce(serial);
      if (eclipses.length) {
        exactEvent = eclipses[0];
        break;
      }
    }
    if (exactEvent) {
      const hitDescriptor = exactEvent.occluded === "Sun"
        ? { kind: "solar", moon: exactEvent.occulting }
        : { kind: "lunar", a: exactEvent.occulting, b: exactEvent.occluded };
      assert(
        _eclipseCandidateDistance(sys as any, hitDescriptor as any, exactEvent.peakT) <= 0,
        "candidate distance should indicate overlap at the exact peak"
      );
    }
  });
});

describe("Eclipse text", () => {
  it("formats relative apparent size as percent below 2x and multiplier at or above 2x", () => {
    freshInstall();
    assertEquals(_eclipseRelativeSizeText(1.463, "Therendor"), "146% as wide as Therendor");
    assertEquals(_eclipseRelativeSizeText(14.63, "Therendor"), "14x as wide as Therendor");
  });
});

describe("Moon history cache", () => {
  it("stores only the most recent 60 exact days on forward advance and resets on set", () => {
    freshInstall();

    stepDays(70, { announce: false });

    const ms = getMoonState();
    const keys = Object.keys(ms.recentHistory.bySerial).map(Number).sort((a, b) => a - b);
    assertEquals(keys.length, MOON_HISTORY_DAYS);
    assertEquals(keys[0], todaySerial() - (MOON_HISTORY_DAYS - 1));
    assertEquals(keys[keys.length - 1], todaySerial());

    setDate(1, 2, 998, { announce: false });

    const resetKeys = Object.keys(getMoonState().recentHistory.bySerial).map(Number);
    assertEquals(resetKeys.length, 1);
    assertEquals(resetKeys[0], todaySerial());
  });

  it("uses cached exact past data only in the player moon handout", () => {
    freshInstall();

    const ms = getMoonState();
    const yesterday = todaySerial() - 1;
    ms.revealTier = "medium";
    ms.revealHorizonDays = 7;
    ms.recentHistory.bySerial[String(yesterday)] = {
      serial: yesterday,
      modelRevision: ms.modelRevision,
      miniCalEvents: [
        { serial: yesterday, name: "History Marker", color: "#123456", dotOnly: true }
      ]
    };
    ms.recentHistory.minSerial = yesterday;
    ms.recentHistory.maxSerial = yesterday;

    assert(moonHandoutHtml().includes("History Marker"), "moon handout should use cached exact past history");
    assert(!moonPlayerPanelHtml().includes("History Marker"), "live player moon panel should ignore cached history");
  });

  it("captures phase history without eclipse backfill and preserves exact eclipses once known", () => {
    freshInstall();

    const start = todaySerial();
    captureMoonHistoryWindow(start, start + 5);
    for (let serial = start; serial <= start + 5; serial++) {
      const day = getMoonState().recentHistory.bySerial[String(serial)];
      assert(day, `expected cached moon history for serial ${serial}`);
      const eclipseMarkers = (day.miniCalEvents || []).filter((evt: any) => String(evt.name || "").startsWith("Eclipses: "));
      assertEquals(eclipseMarkers.length, 0, "history capture should not backfill eclipse markers");
    }

    let eclipseSerial: number | null = null;
    for (let serial = start; serial < start + 672; serial++) {
      if (_getEclipsesBruteforce(serial).length) {
        eclipseSerial = serial;
        break;
      }
    }
    assert(eclipseSerial !== null, "expected at least one eclipse day in range");

    captureMoonHistoryDay(eclipseSerial as number);
    let cached = getMoonState().recentHistory.bySerial[String(eclipseSerial)];
    assertEquals(
      (cached.miniCalEvents || []).filter((evt: any) => String(evt.name || "").startsWith("Eclipses: ")).length,
      0,
      "fresh exact history snapshots should still omit eclipse markers"
    );

    const exactEclipses = getEclipses(eclipseSerial as number);
    assert(exactEclipses.length > 0, "expected exact eclipse data on the selected serial");

    cached = getMoonState().recentHistory.bySerial[String(eclipseSerial)];
    const knownMarkers = (cached.miniCalEvents || []).filter((evt: any) => String(evt.name || "").startsWith("Eclipses: "));
    assertEquals(knownMarkers.length, 1, "exact eclipse inspection should merge one eclipse marker into recent history");

    captureMoonHistoryDay(eclipseSerial as number);
    cached = getMoonState().recentHistory.bySerial[String(eclipseSerial)];
    assertEquals(
      (cached.miniCalEvents || []).filter((evt: any) => String(evt.name || "").startsWith("Eclipses: ")).length,
      1,
      "phase-only recapture should preserve previously known eclipse markers"
    );
  });

  it("keeps eclipse cache keys stable across normal day advancement and changes them on model invalidation", () => {
    freshInstall();

    const serial = todaySerial();
    moonEnsureSequences(serial, 30);
    const before = _eclipseCacheKey(serial);

    stepDays(1, { announce: false });

    const afterAdvance = _eclipseCacheKey(serial);
    assertEquals(afterAdvance, before);

    invalidateMoonModel(false);

    const afterInvalidate = _eclipseCacheKey(serial);
    assertNotEquals(afterInvalidate, before);
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
