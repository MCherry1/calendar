// Tests for moon phase math, anti-phase coupling, Long Shadows, and moon
// history cache. Eclipse, sky-position, and nighttime-lighting tests were
// removed when those subsystems were excised from the Roll20 wrapper.
import { describe, it } from "node:test";
import { strictEqual as assertEquals, notStrictEqual as assertNotEquals, ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { toSerial, todaySerial } from "../src/date-math.js";
import { setDate, stepDays } from "../src/ui.js";
import { applyCalendarSystem } from "../src/state.js";
import {
  MOON_HISTORY_DAYS,
  MOON_SYSTEMS, _moonHashStr, _eberronMoonCore,
  moonEnsureSequences, moonPhaseAt, _applyAntiPhaseCoupling,
  getMoonState, handleMoonCommand,
  moonHandoutHtml, moonPlayerPanelHtml, invalidateMoonModel,
  FESTIVAL_SOFT_ANCHORS, MOON_TARGET_FULL_DAYS_PER_28,
  _applyAssociatedPlanePhaseShifts, _applyFestivalNudges,
  _collectPlanarPhaseWindows, _dN, _edgeDayMidpointSerial,
  _isLongShadowsOverride, _longShadowsWindow, _moonPeakPhaseDay,
  getLongShadowsMoons, captureMoonHistoryWindow
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

  it("uses the default Dragonlance Night of the Eye anchor for midnight phase locking", () => {
    freshInstall();
    applyCalendarSystem("dragonlance", "standard");
    invalidateMoonModel(false);

    const anchorSerial = toSerial(346, 6, 7);
    moonEnsureSequences(anchorSerial, 60);

    for (const moonName of ["Solinari", "Lunitari", "Nuitari"]) {
      const phase = moonPhaseAt(moonName, anchorSerial);
      assert(phase.illum > 0.99, `${moonName} should be full on the default Night of the Eye`);
    }
  });

  it("lets a manual Night of the Eye override supersede the default anchor", () => {
    freshInstall();
    applyCalendarSystem("dragonlance", "standard");
    invalidateMoonModel(false);

    handleMoonCommand({ who: "GM", playerid: "GM" } as any, ["moon", "eye", "7", "14", "346"]);

    const overrideSerial = toSerial(346, 6, 14);
    moonEnsureSequences(overrideSerial, 60);

    for (const moonName of ["Solinari", "Lunitari", "Nuitari"]) {
      const phase = moonPhaseAt(moonName, overrideSerial);
      assert(phase.illum > 0.99, `${moonName} should be full on the overridden Night of the Eye`);
    }

    const ms = getMoonState();
    assertEquals(ms.systemAnchors.dragonlanceNightOfTheEye.serial, overrideSerial);
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

    // Time-of-day removed; long-shadows window uses fixed 6am sunrise / 6pm sunset references.
    const sunset = 18 / 24;
    const sunrise = 6 / 24;
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
});

// ============================================================================
// Moon history cache
// ============================================================================

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

  it("captures phase history without backfilling sky-derived events", () => {
    freshInstall();

    const start = todaySerial();
    captureMoonHistoryWindow(start, start + 5);
    for (let serial = start; serial <= start + 5; serial++) {
      const day = getMoonState().recentHistory.bySerial[String(serial)];
      assert(day, `expected cached moon history for serial ${serial}`);
      const eclipseMarkers = (day.miniCalEvents || []).filter((evt: any) => String(evt.name || "").startsWith("Eclipses: "));
      assertEquals(eclipseMarkers.length, 0, "history capture should not backfill eclipse markers");
    }
  });
});
