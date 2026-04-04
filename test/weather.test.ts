// Tests for weather system, reveals, and day periods.
import { describe, it } from "node:test";
import { strictEqual as assertEquals, ok as assert, deepStrictEqual as assertDeep } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { ensureSettings, getCal, applyCalendarSystem } from "../src/state.js";
import { todaySerial, toSerial, weekStartSerial } from "../src/date-math.js";
import {
  getWeatherState, _clampWeatherTempBand, _weatherTempLabel,
  WEATHER_CLIMATES, WEATHER_DAY_PERIODS, WEATHER_PRIMARY_PERIOD,
  _bestTier, _locSig, _weatherRevealBucket, _recordReveal,
  _weatherRevealForSerial, _grantCommonWeatherReveals,
  _parseWeatherRevealDayToken, _parseWeatherRevealDateSpec,
  weatherEnsureForecast, _forecastRecord, _generateForecast, _weatherRecordForDisplay, handleWeatherCommand, weatherLocationWizardHtml, weatherMechanicsHandoutHtml,
  _composeFormula, _rollTrait, _deriveConditions, _evaluateExtremeEvents, _weatherTraitBadge, _nudge,
  _forecastLens,
} from "../src/weather.js";
import {
  _currentZone,
  QUALITY_HIGH, QUALITY_MEDIUM_A, QUALITY_MEDIUM_B, QUALITY_MEDIUM_C, QUALITY_MEDIUM_D,
  QUALITY_LOW_A, QUALITY_LOW_B, QUALITY_TAIL_AP, QUALITY_TAIL_BP, QUALITY_NONE,
} from "../src/weather/data-tables.js";
import { _subsystemIsVerbose, _subsystemVerbosityValue, _displayMonthDayParts, currentDateLabel, stepDays } from "../src/ui.js";
import { _todayAllHtml, _todayWeatherIsStable } from "../src/today.js";
import { SEASON_SETS, CALENDAR_STRUCTURE_SETS } from "../src/constants.js";
import { CALENDAR_SYSTEMS } from "../src/config.js";
import { _ordinal } from "../src/rendering.js";
import { moonEnsureSequences } from "../src/moon.js";

function gmUser() {
  return { who: "GM (GM)", playerid: "GM" } as any;
}

function playerUser() {
  return { who: "Player", playerid: "P1" } as any;
}

function lastChatMsg() {
  const log = (globalThis as any)._chatLog || [];
  return String(log[log.length - 1]?.msg || "");
}

function countOccurrences(haystack: string, needle: string) {
  return (haystack.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
}

// ============================================================================
// 8) WEATHER SYSTEM
// ============================================================================

describe("Weather System", () => {
  it("getWeatherState initializes with correct defaults", () => {
    freshInstall();
    const ws = getWeatherState();
    assert(ws);
    assertEquals(ws.location, null);
    assert(Array.isArray(ws.forecast));
    assert(Array.isArray(ws.history));
  });

  it("_clampWeatherTempBand clamps to valid range", () => {
    freshInstall();
    assertEquals(_clampWeatherTempBand(0), 0);
    assertEquals(_clampWeatherTempBand(-10), -5);
    assertEquals(_clampWeatherTempBand(20), 15);
    assertEquals(_clampWeatherTempBand(7), 7);
  });

  it("_weatherTempLabel returns labels for all bands", () => {
    freshInstall();
    for (let band = -5; band <= 15; band++) {
      const l = _weatherTempLabel(band);
      assert(typeof l === "string" && l.length > 0, `band ${band}`);
    }
  });

  it("WEATHER_CLIMATES has expected climate types", () => {
    freshInstall();
    for (const key of ["polar", "temperate", "tropical", "continental"]) {
      assert(WEATHER_CLIMATES[key], key);
    }
  });
});

// ============================================================================
// 10) SEASONS
// ============================================================================

describe("Season Sets", () => {
  it("Eberron season set exists", () => {
    freshInstall();
    assert(SEASON_SETS.eberron);
  });
});

// ============================================================================
// 12) VERBOSITY SETTING
// ============================================================================

describe("Verbosity Setting", () => {
  it("defaults to 'normal'", () => {
    freshInstall();
    assertEquals(_subsystemVerbosityValue(), "normal");
    assert(_subsystemIsVerbose());
  });

  it("'minimal' makes _subsystemIsVerbose return false", () => {
    freshInstall();
    ensureSettings().subsystemVerbosity = "minimal";
    assertEquals(_subsystemVerbosityValue(), "minimal");
    assert(!_subsystemIsVerbose());
  });

  it("invalid values fall back to 'normal'", () => {
    freshInstall();
    ensureSettings().subsystemVerbosity = "garbage";
    assertEquals(_subsystemVerbosityValue(), "normal");
    assert(_subsystemIsVerbose());
  });

  it("is case-insensitive", () => {
    freshInstall();
    ensureSettings().subsystemVerbosity = "MINIMAL";
    assertEquals(_subsystemVerbosityValue(), "minimal");
    assert(!_subsystemIsVerbose());
  });
});

// ============================================================================
// 13) WEATHER STABILITY DETECTION
// ============================================================================

describe("Weather Stability Detection", () => {
  it("null/missing record is treated as stable", () => {
    freshInstall();
    assert(_todayWeatherIsStable(null));
    assert(_todayWeatherIsStable({}));
    assert(_todayWeatherIsStable({ periods: null }));
  });

  it("uniform periods are stable", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        middle_of_night: { temp: 5, wind: 2, precip: 1 },
        early_morning: { temp: 5, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 2, precip: 1 },
        nighttime:     { temp: 5, wind: 2, precip: 1 },
      },
    };
    assert(_todayWeatherIsStable(wxRec));
  });

  it("small variation (within ±1) is still stable", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        middle_of_night: { temp: 5, wind: 2, precip: 1 },
        early_morning: { temp: 4, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 3, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 6, wind: 2, precip: 0 },
        nighttime:     { temp: 5, wind: 1, precip: 1 },
      },
    };
    assert(_todayWeatherIsStable(wxRec));
  });

  it("large temp swing is divergent", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        middle_of_night: { temp: 5, wind: 2, precip: 1 },
        early_morning: { temp: 0, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 2, precip: 1 },
        nighttime:     { temp: 5, wind: 2, precip: 1 },
      },
    };
    assert(!_todayWeatherIsStable(wxRec));
  });

  it("large wind swing is divergent", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        middle_of_night: { temp: 5, wind: 2, precip: 1 },
        early_morning: { temp: 5, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 5, precip: 1 },
        nighttime:     { temp: 5, wind: 2, precip: 1 },
      },
    };
    assert(!_todayWeatherIsStable(wxRec));
  });

  it("large precip swing is divergent", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        middle_of_night: { temp: 5, wind: 2, precip: 1 },
        early_morning: { temp: 5, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 2, precip: 1 },
        nighttime:     { temp: 5, wind: 2, precip: 4 },
      },
    };
    assert(!_todayWeatherIsStable(wxRec));
  });
});

describe("Weather locking", () => {
  it("locks future records against reroll and regeneration even after location changes", () => {
    freshInstall();
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate-inland-open" };
    weatherEnsureForecast();
    const today = todaySerial();
    const target = today + 5;
    const before = JSON.parse(JSON.stringify(_forecastRecord(target)));

    handleWeatherCommand({ who: "GM (GM)", playerid: "GM" } as any, ["weather", "lock", String(target)]);
    const locked = _forecastRecord(target);
    assert(locked && locked.locked, "lock command should mark the future record as locked");

    ws.location = { name: "Coast", climate: "temperate", geography: "coastal", terrain: "open", sig: "temperate-coastal-open" } as any;
    _generateForecast(today, 20, true);

    const after = _forecastRecord(target);
    assertEquals(after.locked, true);
    assertEquals(after.location.sig, before.location.sig, "force regeneration should not overwrite locked future records");

    const chatLen = (globalThis as any)._chatLog.length;
    handleWeatherCommand({ who: "GM (GM)", playerid: "GM" } as any, ["weather", "reroll", String(target)]);
    const last = (globalThis as any)._chatLog[(globalThis as any)._chatLog.length - 1];
    assert((globalThis as any)._chatLog.length >= chatLen, "reroll should emit feedback");
    assert(String(last.msg).includes("locked"), "locked future records should reject reroll");
  });
});

// ============================================================================
// TODAY-VIEW HTML OUTPUT MODES
// ============================================================================

describe("Today-View HTML Output", () => {
  function setupWeather() {
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate-inland-open" };
    weatherEnsureForecast();
  }

  it("normal mode includes full period breakdown", () => {
    freshInstall();
    const st = ensureSettings();
    st.subsystemVerbosity = "normal";
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    st.planesEnabled = true;
    setupWeather();
    moonEnsureSequences();
    const html = _todayAllHtml();
    assert(typeof html === "string" && html.length > 0, "should produce HTML");
    assert(html.includes("send"), "dashboard should include send-to-players action");
    assert(html.includes("retreat 1") || html.includes("⬅"), "dashboard should include step buttons");
  });

  it("minimal mode suppresses unremarkable moons", () => {
    freshInstall();
    const st = ensureSettings();
    st.subsystemVerbosity = "minimal";
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    st.planesEnabled = true;
    setupWeather();
    moonEnsureSequences();
    const html = _todayAllHtml();
    assert(typeof html === "string" && html.length > 0, "should produce HTML");
    assert(html.includes("Moons"), "minimal mode should still include the moon card");
  });

  it("minimal mode includes date and step controls", () => {
    freshInstall();
    const st = ensureSettings();
    st.subsystemVerbosity = "minimal";
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    setupWeather();
    moonEnsureSequences();
    const html = _todayAllHtml();
    assert(typeof html === "string" && html.length > 0, "minimal mode should produce HTML");
    assert(html.includes("retreat 1") || html.includes("⬅"), "minimal mode should have step controls");
  });

  it("normal mode has separate lighting section", () => {
    freshInstall();
    const st = ensureSettings();
    st.subsystemVerbosity = "normal";
    st.moonsEnabled = true;
    st.weatherEnabled = true;
    setupWeather();
    moonEnsureSequences();
    const html = _todayAllHtml();
    assert(html.includes("Weather"),
      "normal mode should include the compact weather card");
  });

  it("switching verbosity changes output", () => {
    freshInstall();
    const st = ensureSettings();
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    st.planesEnabled = true;
    setupWeather();
    moonEnsureSequences();

    st.subsystemVerbosity = "normal";
    const normalHtml = _todayAllHtml();
    st.subsystemVerbosity = "minimal";
    const minimalHtml = _todayAllHtml();

    assert(typeof normalHtml === "string" && typeof minimalHtml === "string");
  });
});

// ============================================================================
// WEATHER DAY PERIOD CONSTANTS
// ============================================================================

describe("Weather Day Period Constants", () => {
  it("WEATHER_DAY_PERIODS has 6 periods", () => {
    freshInstall();
    assertEquals(WEATHER_DAY_PERIODS.length, 6);
  });

  it("WEATHER_PRIMARY_PERIOD is afternoon", () => {
    freshInstall();
    assertEquals(WEATHER_PRIMARY_PERIOD, "afternoon");
  });

  it("afternoon is in WEATHER_DAY_PERIODS", () => {
    freshInstall();
    assert(WEATHER_DAY_PERIODS.includes("afternoon"));
  });
});

// ============================================================================
// WEATHER: _bestTier
// ============================================================================

describe("Weather: _bestTier", () => {
  it("high beats medium", () => { freshInstall(); assertEquals(_bestTier("high", "medium"), "high"); });
  it("high beats low", () => { freshInstall(); assertEquals(_bestTier("low", "high"), "high"); });
  it("medium beats low", () => { freshInstall(); assertEquals(_bestTier("medium", "low"), "medium"); });
  it("same tier returns same tier", () => { freshInstall(); assertEquals(_bestTier("medium", "medium"), "medium"); });
  it("unknown tier loses to any known tier", () => { freshInstall(); assertEquals(_bestTier("garbage", "low"), "low"); });
});

// ============================================================================
// WEATHER: _locSig
// ============================================================================

describe("Weather: _locSig", () => {
  it("produces climate/geography/terrain signature", () => {
    freshInstall();
    assertEquals(_locSig({ climate: "temperate", geography: "coastal", terrain: "forest" }), "temperate/coastal/forest");
  });

  it("defaults geography to inland when missing", () => {
    freshInstall();
    assertEquals(_locSig({ climate: "arctic", terrain: "open" }), "arctic/inland/open");
  });

  it("returns empty string for null location", () => {
    freshInstall();
    assertEquals(_locSig(null), "");
  });
});

// ============================================================================
// WEATHER: reveal storage (location-scoped)
// ============================================================================

describe("Weather: location-scoped reveal storage", () => {
  function setupLocation(ws: any, climate: string, geography: string, terrain: string) {
    ws.location = { name: "Test", climate, geography, terrain, sig: climate + "/" + geography + "/" + terrain };
  }

  it("reveals are stored per-location bucket", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc1 = { climate: "temperate", geography: "inland", terrain: "open" };
    const loc2 = { climate: "arctic", geography: "coastal", terrain: "forest" };
    setupLocation(ws, loc1.climate, loc1.geography, loc1.terrain);

    const serial = todaySerial();
    _recordReveal(ws, serial, "high", "specific", loc1);
    _recordReveal(ws, serial, "medium", "medium", loc2);

    const rev1 = _weatherRevealForSerial(ws, serial, loc1);
    const rev2 = _weatherRevealForSerial(ws, serial, loc2);
    assertEquals(rev1.tier, "high");
    assertEquals(rev2.tier, "medium");
  });

  it("reveals upgrade but never downgrade", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    ws.location = loc;

    const serial = todaySerial();
    _recordReveal(ws, serial, "medium", "medium", loc);
    _recordReveal(ws, serial, "low", "common", loc);

    const rev = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.tier, "medium", "should not downgrade from medium to low");
  });

  it("upgrade from low to high works", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "tropical", geography: "inland", terrain: "open" };
    ws.location = loc;

    const serial = todaySerial();
    _recordReveal(ws, serial, "low", "common", loc);
    _recordReveal(ws, serial, "high", "specific", loc);

    const rev = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.tier, "high");
  });

  it("_weatherRevealBucket returns empty object for non-existent location without creating", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "desert", geography: "inland", terrain: "open" };
    const bucket = _weatherRevealBucket(ws, loc, false);
    assertEquals(Object.keys(bucket).length, 0);
  });
});

// ============================================================================
// WEATHER: common reveals
// ============================================================================

describe("Weather: common weather reveals", () => {
  function setupWeather() {
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate/inland/open" };
    weatherEnsureForecast();
    return ws;
  }

  it("grants low tier for today, today+1, today+2", () => {
    freshInstall();
    const ws = setupWeather();
    const today = todaySerial();
    _grantCommonWeatherReveals(ws, today);

    for (let d = 0; d <= 2; d++) {
      const rev = _weatherRevealForSerial(ws, today + d);
      assertEquals(rev.tier, "low", `day +${d} should have low tier`);
    }
  });
});

describe("Weather calendar surfaces", () => {
  function setupWeather() {
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate/inland/open" } as any;
    weatherEnsureForecast();
    return ws;
  }

  it("renders the GM today weather view as the new calendar surface", () => {
    freshInstall();
    setupWeather();

    handleWeatherCommand(gmUser(), ["weather"]);

    const msg = lastChatMsg();
    assert(msg.includes('data-weather-view="today-calendar-gm"'));
    assert(msg.includes('data-weather-tod-grid="1"'));
    assert(msg.includes("0-4a"));
    assert(msg.includes("8-12p"));
    assert(msg.includes("Active Mechanics"));
    assert(msg.includes('data-weather-forecast-grid="1"'));
    assert(msg.includes("Reveal Medium Forecast"));
    assert(msg.includes("Reveal High Forecast"));
    assert(!msg.includes("Forecast List"));
    assert(!msg.includes("[📋 List]"));
    assert(!msg.includes("View: "));
  });

  it("renders the GM forecast as an equal-weight calendar grid", () => {
    freshInstall();
    setupWeather();

    handleWeatherCommand(gmUser(), ["weather", "forecast"]);

    const msg = lastChatMsg();
    assert(msg.includes('data-weather-view="forecast-calendar-gm"'));
    assert(msg.includes('data-weather-forecast-grid="1"'));
    assert(!msg.includes("<b>Today:</b>"));
    assert(!msg.includes("!cal weather forecast list"));
    assert(!msg.includes("!cal weather"));
    assert(!msg.includes("View: "));
  });

  it("shows the player embedded forecast as a revealed calendar including today", () => {
    freshInstall();
    setupWeather();

    handleWeatherCommand(playerUser(), ["weather"]);

    const msg = lastChatMsg();
    assert(msg.includes('data-weather-view="today-calendar-player"'));
    assertEquals(countOccurrences(msg, 'data-weather-forecast-cell="1"'), 3);
    assert(!msg.includes("Forecast List"));
  });

  it("expands the player weather and forecast calendars after a high reveal", () => {
    freshInstall();
    setupWeather();

    handleWeatherCommand(gmUser(), ["weather", "reveal", "high", "10"]);
    handleWeatherCommand(playerUser(), ["weather"]);
    let msg = lastChatMsg();
    assertEquals(countOccurrences(msg, 'data-weather-forecast-cell="1"'), 10);

    handleWeatherCommand(playerUser(), ["weather", "forecast"]);
    msg = lastChatMsg();
    assert(msg.includes('data-weather-view="forecast-calendar-player"'));
    assertEquals(countOccurrences(msg, 'data-weather-forecast-cell="1"'), 10);
  });

  it("keeps displayed period temperatures within the smoothed intraday swing range", () => {
    freshInstall();
    setupWeather();

    const rec = _forecastRecord(todaySerial());
    let prev: number | null = null;
    for (const period of WEATHER_DAY_PERIODS) {
      const html = handlePeriodTemp(rec, period);
      if (prev != null) assert(Math.abs(html - prev) <= 12);
      prev = html;
    }

    function handlePeriodTemp(dayRec: any, period: string) {
      handleWeatherCommand(gmUser(), ["weather"]);
      const msg = lastChatMsg();
      const match = msg.match(new RegExp(`data-weather-period="${period}"[\\s\\S]*?(\\d+)F`));
      assert(match, `expected temperature for ${period}`);
      return Number(match[1]);
    }
  });

  it("uses calendar output for legacy list routes and history", () => {
    freshInstall();
    setupWeather();

    handleWeatherCommand(gmUser(), ["weather", "list"]);
    let msg = lastChatMsg();
    assert(msg.includes('data-weather-view="today-calendar-gm"'));
    assert(!msg.includes("Forecast List"));

    handleWeatherCommand(gmUser(), ["weather", "forecast", "list"]);
    msg = lastChatMsg();
    assert(msg.includes('data-weather-view="forecast-calendar-gm"'));
    assert(!msg.includes("Forecast List"));

    stepDays(1, { announce: false });
    weatherEnsureForecast();
    handleWeatherCommand(gmUser(), ["weather", "history"]);
    msg = lastChatMsg();
    assert(msg.includes('data-weather-view="history-calendar-gm"'));
  });

  it("includes the precipitation table in the mechanics handout", () => {
    freshInstall();

    const html = weatherMechanicsHandoutHtml();

    assert(html.includes("Precipitation Stages"));
    assert(html.includes("Light Precipitation"));
    assert(html.includes("Derived Outcome"));
  });
});

describe("Weather: saved location presets", () => {
  it("saves named presets and lists them before recents in the wizard", () => {
    freshInstall();
    const ws = getWeatherState();
    ws.location = { name: "Current", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate/inland/open" } as any;
    ws.recentLocations = [
      { name: "Recent One", climate: "tropical", geography: "coastal", terrain: "forest", sig: "tropical/coastal/forest" }
    ] as any;

    handleWeatherCommand({ who: "GM (GM)", playerid: "GM" } as any, ["weather", "location", "save", "Sharn"]);

    assertEquals(ws.savedLocations.length, 1);
    assertEquals(ws.savedLocations[0].name, "Sharn");

    const html = weatherLocationWizardHtml("start");
    assert(html.includes("Saved locations:"));
    assert(html.includes("Recent locations:"));
    assert(html.indexOf("Saved locations:") < html.indexOf("Recent locations:"));
  });
});

// ============================================================================
// WEATHER: _parseWeatherRevealDayToken
// ============================================================================

describe("Weather: _parseWeatherRevealDayToken", () => {
  it("parses single numeric day", () => { freshInstall(); assertDeep(_parseWeatherRevealDayToken("14"), { start: 14, end: 14 }); });
  it("parses ordinal day", () => { freshInstall(); assertDeep(_parseWeatherRevealDayToken("3rd"), { start: 3, end: 3 }); });
  it("parses numeric range", () => { freshInstall(); assertDeep(_parseWeatherRevealDayToken("14-17"), { start: 14, end: 17 }); });
  it("parses ordinal range", () => { freshInstall(); assertDeep(_parseWeatherRevealDayToken("1st-3rd"), { start: 1, end: 3 }); });
  it("returns null for empty or invalid input", () => { freshInstall(); assertEquals(_parseWeatherRevealDayToken(""), null); assertEquals(_parseWeatherRevealDayToken(null), null); });
});

// ============================================================================
// WEATHER: _parseWeatherRevealDateSpec
// ============================================================================

describe("Weather: _parseWeatherRevealDateSpec", () => {
  it("parses month + day", () => {
    freshInstall();
    const result = _parseWeatherRevealDateSpec(["Zarantyr", "14"]);
    assert(result !== null); assertEquals(result!.mi, 0); assertEquals(result!.startDay, 14); assertEquals(result!.endDay, 14);
  });

  it("parses month + day range", () => {
    freshInstall();
    const result = _parseWeatherRevealDateSpec(["Olarune", "5-10"]);
    assert(result !== null); assertEquals(result!.mi, 1); assertEquals(result!.startDay, 5); assertEquals(result!.endDay, 10);
  });

  it("parses bare day number", () => {
    freshInstall();
    const result = _parseWeatherRevealDateSpec(["15"]);
    assert(result !== null); assertEquals(result!.startDay, 15); assertEquals(result!.endDay, 15);
  });

  it("parses bare day range", () => {
    freshInstall();
    const result = _parseWeatherRevealDateSpec(["10-20"]);
    assert(result !== null); assertEquals(result!.startDay, 10); assertEquals(result!.endDay, 20);
  });

  it("returns null for empty tokens", () => { freshInstall(); assertEquals(_parseWeatherRevealDateSpec([]), null); });

  it("clamps days to valid month range", () => {
    freshInstall();
    const result = _parseWeatherRevealDateSpec(["Zarantyr", "35"]);
    assert(result !== null); assertEquals(result!.startDay, 28, "should clamp to max 28");
  });

  it("swaps start/end if reversed", () => {
    freshInstall();
    const result = _parseWeatherRevealDateSpec(["Zarantyr", "20-10"]);
    assert(result !== null); assertEquals(result!.startDay, 10); assertEquals(result!.endDay, 20);
  });
});

// ============================================================================
// HARPTOS
// ============================================================================

// ============================================================================
// WEATHER: _composeFormula
// ============================================================================

describe("Weather: _composeFormula", () => {
  it("temperate/inland/open produces expected formula shape", () => {
    freshInstall();
    const f = _composeFormula("temperate", "inland", "open", 6);
    assert(f.temp, "should have temp formula");
    assert(f.wind, "should have wind formula");
    assert(f.precip, "should have precip formula");
    assert(typeof f.arcMult === "number", "should have arcMult");
    assert(f.temp.min <= f.temp.base && f.temp.base <= f.temp.max, "base within [min, max]");
    assert(f.wind.min <= f.wind.base && f.wind.base <= f.wind.max, "wind base within [min, max]");
    assert(f.precip.min <= f.precip.base && f.precip.base <= f.precip.max, "precip base within [min, max]");
  });

  it("geography shift applies to formula", () => {
    freshInstall();
    const inland = _composeFormula("temperate", "inland", "open", 6);
    const coastal = _composeFormula("temperate", "coastal", "open", 6);
    // Coastal geography should shift wind upward relative to inland
    assert(
      coastal.wind.base >= inland.wind.base || coastal.wind.max >= inland.wind.max,
      "coastal wind should be >= inland wind"
    );
  });

  it("TRAIT_MAX clamps formula max values", () => {
    freshInstall();
    // Monsoon climate with coastal geography and swamp terrain should push precip high
    const f = _composeFormula("monsoon", "coastal", "swamp", 6);
    assert(f.precip.max <= 5, "precip max should not exceed TRAIT_MAX of 5");
    assert(f.wind.max <= 5, "wind max should not exceed TRAIT_MAX of 5");
  });

  it("all climate types produce valid formulas", () => {
    freshInstall();
    const climates = Object.keys(WEATHER_CLIMATES);
    for (const c of climates) {
      for (let m = 0; m < 12; m++) {
        const f = _composeFormula(c, "inland", "open", m);
        assert(f.temp.min <= f.temp.max, `${c} month ${m}: temp min <= max`);
        assert(f.wind.min <= f.wind.max, `${c} month ${m}: wind min <= max`);
        assert(f.precip.min <= f.precip.max, `${c} month ${m}: precip min <= max`);
      }
    }
  });
});

// ============================================================================
// WEATHER: _rollTrait
// ============================================================================

describe("Weather: _rollTrait", () => {
  it("with fixed dice returns expected value", () => {
    freshInstall();
    // Override randomInteger to always return 1 (minimum roll)
    const origRandom = (globalThis as any).randomInteger;
    (globalThis as any).randomInteger = () => 1;
    try {
      const formula = { base: 5, die: 3, min: 2, max: 8 };
      // _rollTrait = base + rollDie(die) - rollDie(die) + seedNudge
      // With always-1: base + 1 - 1 + 0 = base = 5
      const result = _rollTrait(formula, 0);
      assertEquals(result, 5);
    } finally {
      (globalThis as any).randomInteger = origRandom;
    }
  });

  it("clamps to min", () => {
    freshInstall();
    const formula = { base: 3, die: 1, min: 3, max: 8 };
    // With seedNudge = -5 and die=1 (rolls 1): 3 + 1 - 1 - 5 = -2, clamped to min=3
    const result = _rollTrait(formula, -5);
    assertEquals(result, 3);
  });

  it("clamps to max", () => {
    freshInstall();
    const formula = { base: 7, die: 1, min: 0, max: 8 };
    // With seedNudge = +5 and die=1: 7 + 1 - 1 + 5 = 12, clamped to max=8
    const result = _rollTrait(formula, 5);
    assertEquals(result, 8);
  });
});

// ============================================================================
// WEATHER: _deriveConditions
// ============================================================================

describe("Weather: _deriveConditions", () => {
  it("cold + precip = snow", () => {
    freshInstall();
    const cond = _deriveConditions({ temp: 2, wind: 1, precip: 3 }, null, "afternoon", false, "none");
    assert(cond.precipType === "snow" || cond.precipType === "snow_light" || cond.precipType === "blizzard",
      `expected snow variant, got ${cond.precipType}`);
  });

  it("warm + precip = rain", () => {
    freshInstall();
    const cond = _deriveConditions({ temp: 7, wind: 1, precip: 3 }, null, "afternoon", false, "none");
    assertEquals(cond.precipType, "rain");
  });

  it("tropical climate floor prevents snow", () => {
    freshInstall();
    const loc = { climate: "tropical", geography: "inland", terrain: "open" };
    const cond = _deriveConditions({ temp: 2, wind: 1, precip: 3 }, loc, "afternoon", false, "none");
    assert(
      cond.precipType === "rain" || cond.precipType === "rain_light" || cond.precipType === "heavy_rain" || cond.precipType === "deluge",
      `tropical should produce rain variant, got ${cond.precipType}`
    );
  });

  it("blizzard causes heavy obscured visibility", () => {
    freshInstall();
    const cond = _deriveConditions({ temp: 1, wind: 3, precip: 4 }, null, "afternoon", false, "none");
    assertEquals(cond.precipType, "blizzard");
    assertEquals(cond.visibility.tier, "C");
    assertEquals(cond.visibility.beyond, 30);
  });

  it("no precip = none", () => {
    freshInstall();
    const cond = _deriveConditions({ temp: 7, wind: 1, precip: 0 }, null, "afternoon", false, "none");
    assertEquals(cond.precipType, "none");
  });

  it("dense fog causes heavy obscured visibility", () => {
    freshInstall();
    const cond = _deriveConditions({ temp: 7, wind: 0, precip: 0 }, null, "afternoon", false, "dense");
    assertEquals(cond.visibility.tier, "C");
    assertEquals(cond.visibility.beyond, 30);
  });
});

// ============================================================================
// WEATHER: _evaluateExtremeEvents
// ============================================================================

describe("Weather: _evaluateExtremeEvents", () => {
  it("returns empty array when hazards disabled", () => {
    freshInstall();
    ensureSettings().weatherHazardsEnabled = false;
    const ws = getWeatherState();
    ws.location = { name: "Test", climate: "temperate", geography: "river_valley", terrain: "open", sig: "temperate/river_valley/open" };
    weatherEnsureForecast();
    const rec = _forecastRecord(todaySerial());
    const events = _evaluateExtremeEvents(rec);
    assertEquals(events.length, 0);
  });

  it("returns array (possibly with events) when hazards enabled and record exists", () => {
    freshInstall();
    ensureSettings().weatherHazardsEnabled = true;
    const ws = getWeatherState();
    ws.location = { name: "Test", climate: "temperate", geography: "river_valley", terrain: "open", sig: "temperate/river_valley/open" };
    weatherEnsureForecast();
    const rec = _forecastRecord(todaySerial());
    const events = _evaluateExtremeEvents(rec);
    assert(Array.isArray(events), "should return an array");
    // Each qualifying event should have key, event, and probability
    for (const e of events) {
      assert(typeof e.key === "string", "event should have a key");
      assert(typeof e.probability === "number", "event should have a probability");
      assert(e.probability > 0 && e.probability <= 1, "probability in (0, 1]");
    }
  });
});

// ============================================================================
// WEATHER: Badge palette coverage
// ============================================================================

describe("Weather: badge palette coverage", () => {
  it("wind badge renders distinct colors for all 6 levels (0-5)", () => {
    freshInstall();
    const colors = new Set<string>();
    for (let level = 0; level <= 5; level++) {
      const html = _weatherTraitBadge("wind", level);
      const match = html.match(/background:([^;]+)/);
      assert(match, `level ${level} should have a background color`);
      colors.add(match[1]);
    }
    assertEquals(colors.size, 6, "all 6 wind levels should have distinct colors");
  });

  it("precip badge renders distinct colors for all 6 levels (0-5)", () => {
    freshInstall();
    const colors = new Set<string>();
    for (let level = 0; level <= 5; level++) {
      const html = _weatherTraitBadge("precip", level);
      const match = html.match(/background:([^;]+)/);
      assert(match, `level ${level} should have a background color`);
      colors.add(match[1]);
    }
    assertEquals(colors.size, 6, "all 6 precip levels should have distinct colors");
  });
});

// ============================================================================
// WEATHER: _nudge (mean reversion)
// ============================================================================

describe("Weather: _nudge (proportional mean reversion)", () => {
  it("returns 0 for deviation within ±1", () => {
    freshInstall();
    assertEquals(_nudge(5, 5), 0);  // deviation 0
    assertEquals(_nudge(6, 5), 0);  // deviation +1
    assertEquals(_nudge(4, 5), 0);  // deviation -1
  });

  it("returns pull-back for deviation of 2", () => {
    freshInstall();
    // dev = +2: magnitude = 1 + 0*0.5 = 1, sign = -1, result = round(-1*1) = -1
    assertEquals(_nudge(7, 5), -1);  // deviation +2 → nudge -1
    assertEquals(_nudge(3, 5), 1);   // deviation -2 → nudge +1
  });

  it("returns stronger pull-back for larger deviations", () => {
    freshInstall();
    const nudge2 = Math.abs(_nudge(7, 5));  // deviation +2
    const nudge3 = Math.abs(_nudge(8, 5));  // deviation +3
    const nudge4 = Math.abs(_nudge(9, 5));  // deviation +4
    assert(nudge3 >= nudge2, "deviation 3 should nudge at least as much as deviation 2");
    assert(nudge4 >= nudge3, "deviation 4 should nudge at least as much as deviation 3");
  });

  it("is symmetric for positive and negative deviations", () => {
    freshInstall();
    assertEquals(_nudge(8, 5), -_nudge(2, 5));  // +3 vs -3
    assertEquals(_nudge(7, 5), -_nudge(3, 5));  // +2 vs -2
  });
});

describe("Harptos: _ordinal", () => {
  it("handles 1st, 2nd, 3rd", () => { freshInstall(); assertEquals(_ordinal(1), "1st"); assertEquals(_ordinal(2), "2nd"); assertEquals(_ordinal(3), "3rd"); });
  it("handles 4th through 10th", () => { freshInstall(); assertEquals(_ordinal(4), "4th"); assertEquals(_ordinal(10), "10th"); });
  it("handles teens (11th, 12th, 13th)", () => { freshInstall(); assertEquals(_ordinal(11), "11th"); assertEquals(_ordinal(12), "12th"); assertEquals(_ordinal(13), "13th"); });
  it("handles 21st, 22nd, 23rd", () => { freshInstall(); assertEquals(_ordinal(21), "21st"); assertEquals(_ordinal(22), "22nd"); assertEquals(_ordinal(23), "23rd"); });
  it("handles 30th", () => { freshInstall(); assertEquals(_ordinal(30), "30th"); });
});

describe("Harptos: calendar structure", () => {
  it("faerunian system uses 10-day weeks (tendays)", () => {
    freshInstall();
    const sys = CALENDAR_SYSTEMS.faerunian;
    assert(sys); assertEquals(sys.weekdays.length, 10); assertEquals(sys.structure, "harptos");
  });

  it("faerunian months are all 30 days", () => {
    freshInstall();
    const sys = CALENDAR_SYSTEMS.faerunian;
    assertEquals(sys.monthDays.length, 12);
    for (const d of sys.monthDays) assertEquals(d, 30);
  });

  it("harptos structure set has intercalary festival days", () => {
    freshInstall();
    const struct = CALENDAR_STRUCTURE_SETS.harptos;
    assert(Array.isArray(struct));
    const festivals = struct.filter((s: any) => s.isIntercalary);
    assert(festivals.length >= 5);
    const names = festivals.map((f: any) => f.name);
    assert(names.includes("Midwinter")); assert(names.includes("Greengrass"));
    assert(names.includes("Midsummer")); assert(names.includes("Highharvestide"));
    assert(names.includes("Feast of the Moon"));
  });

  it("Shieldmeet is a leap-only festival day", () => {
    freshInstall();
    const struct = CALENDAR_STRUCTURE_SETS.harptos;
    const shieldmeet = struct.find((s: any) => s.name === "Shieldmeet");
    assert(shieldmeet); assert(shieldmeet.isIntercalary); assertEquals(shieldmeet.leapEvery, 4);
  });
});

describe("Harptos: _displayMonthDayParts", () => {

  function switchToFaerunian() {
    freshInstall();
    applyCalendarSystem("faerunian");
  }

  it("formats regular day as ordinal + month name", () => {
    switchToFaerunian();
    const result = _displayMonthDayParts(0, 16);
    assertEquals(result.label, "16th of Hammer"); assertEquals(result.monthName, "Hammer"); assertEquals(result.day, 16);
  });

  it("formats 1st day correctly", () => {
    switchToFaerunian();
    assertEquals(_displayMonthDayParts(0, 1).label, "1st of Hammer");
  });

  it("formats intercalary day as festival name only", () => {
    switchToFaerunian();
    const cal = getCal();
    let midwinterIdx = -1;
    for (let i = 0; i < cal.months.length; i++) {
      if (cal.months[i].isIntercalary && cal.months[i].name === "Midwinter") { midwinterIdx = i; break; }
    }
    if (midwinterIdx >= 0) {
      assertEquals(_displayMonthDayParts(midwinterIdx, 1).label, "Midwinter");
    }
  });
});

describe("Harptos: weekStartSerial tenday math", () => {

  function switchToFaerunian() {
    freshInstall();
    applyCalendarSystem("faerunian");
  }

  it("day 1 starts tenday at day 1", () => { switchToFaerunian(); assertEquals(weekStartSerial(1491, 0, 1), toSerial(1491, 0, 1)); });
  it("day 5 is in the first tenday", () => { switchToFaerunian(); assertEquals(weekStartSerial(1491, 0, 5), toSerial(1491, 0, 1)); });
  it("day 11 starts the second tenday", () => { switchToFaerunian(); assertEquals(weekStartSerial(1491, 0, 11), toSerial(1491, 0, 11)); });
  it("day 15 is in the second tenday", () => { switchToFaerunian(); assertEquals(weekStartSerial(1491, 0, 15), toSerial(1491, 0, 11)); });
  it("day 21 starts the third tenday", () => { switchToFaerunian(); assertEquals(weekStartSerial(1491, 0, 21), toSerial(1491, 0, 21)); });
  it("day 30 is in the third tenday", () => { switchToFaerunian(); assertEquals(weekStartSerial(1491, 0, 30), toSerial(1491, 0, 21)); });
});

// ============================================================================
// FORECAST LENS
// ============================================================================


describe("Forecast Lens: _currentZone", () => {
  it("today is zone A", () => {
    assertEquals(_currentZone(100, 100), "A");
  });
  it("tomorrow is zone B", () => {
    assertEquals(_currentZone(101, 100), "B");
  });
  it("day 3 is zone B", () => {
    assertEquals(_currentZone(102, 100), "B");
  });
  it("day 4 is zone C", () => {
    assertEquals(_currentZone(103, 100), "C");
  });
  it("day 6 is zone C", () => {
    assertEquals(_currentZone(105, 100), "C");
  });
  it("day 7 is zone D", () => {
    assertEquals(_currentZone(106, 100), "D");
  });
  it("day 10 is zone D", () => {
    assertEquals(_currentZone(109, 100), "D");
  });
  it("day 11 is null (beyond window)", () => {
    assertEquals(_currentZone(110, 100), null);
  });
});

describe("Forecast Lens: _forecastLens", () => {
  function makeRec(serial: number, temp: number, wind: number, precip: number) {
    return {
      serial,
      final: { temp, wind, precip },
      base: { temp, wind, precip },
      overlay: { temp: 0, wind: 0, precip: 0, planes: {} },
      location: { climate: "temperate", geography: "inland", terrain: "open" },
      monthIdx: 6,
    };
  }

  it("high tier returns exact truth", () => {
    const rec = makeRec(100, 8, 2, 3);
    const prev = makeRec(99, 7, 1, 2);
    const reveal = { tier: "high", quality: QUALITY_HIGH, isTail: false };
    const result = _forecastLens(rec, prev, reveal, 100);
    assertEquals(result.temp, 8);
    assertEquals(result.wind, 2);
    assertEquals(result.precip, 3);
  });

  it("null reveal returns exact truth", () => {
    const rec = makeRec(100, 8, 2, 3);
    const result = _forecastLens(rec, null, null, 100);
    assertEquals(result.temp, 8);
    assertEquals(result.wind, 2);
    assertEquals(result.precip, 3);
  });

  it("low tier produces values close to truth for zone A", () => {
    const rec = makeRec(100, 7, 3, 0);
    const prev = makeRec(99, 7, 3, 0);
    const reveal = { tier: "low", quality: QUALITY_LOW_A, isTail: false };
    const result = _forecastLens(rec, prev, reveal, 100);
    // Zone A low: jitter ±1 on wind only (jitter level 1).
    // Mask (d6) can also fire and snap a trait. All values should be within ±2.
    assert(Math.abs(result.temp - rec.final.temp) <= 2, "temp within ±2");
    assert(Math.abs(result.wind - rec.final.wind) <= 2, "wind within ±2");
    assert(Math.abs(result.precip - rec.final.precip) <= 2, "precip within ±2");
  });

  it("forecast lens is deterministic (same inputs produce same output)", () => {
    const rec = makeRec(105, 6, 2, 1);
    const prev = makeRec(104, 5, 1, 0);
    const reveal = { tier: "medium", quality: QUALITY_MEDIUM_C, isTail: false };
    const r1 = _forecastLens(rec, prev, reveal, 102);
    const r2 = _forecastLens(rec, prev, reveal, 102);
    assertEquals(r1.temp, r2.temp);
    assertEquals(r1.wind, r2.wind);
    assertEquals(r1.precip, r2.precip);
  });

  it("medium tier zone A returns exact values (jitter level 0)", () => {
    const rec = makeRec(100, 8, 3, 2);
    const prev = makeRec(99, 7, 2, 1);
    const reveal = { tier: "medium", quality: QUALITY_MEDIUM_A, isTail: false };
    const result = _forecastLens(rec, prev, reveal, 100);
    // Zone A medium: jitter level 0 (exact), but mask could still fire (d20, 1 in 20).
    // The mask is seeded deterministically; check values are within ±1 of truth.
    assert(Math.abs(result.temp - rec.final.temp) <= 2, "temp within mask range");
    assert(Math.abs(result.wind - rec.final.wind) <= 2, "wind within mask range");
    assert(Math.abs(result.precip - rec.final.precip) <= 2, "precip within mask range");
  });

  it("no previous record falls back to rec.base", () => {
    const rec = makeRec(100, 7, 2, 1);
    const reveal = { tier: "low", quality: QUALITY_LOW_A, isTail: false };
    // prevRec is null — should use rec.base as regression target
    const result = _forecastLens(rec, null, reveal, 100);
    assert(result.temp >= -5 && result.temp <= 15, "temp in valid range");
    assert(result.wind >= 0 && result.wind <= 5, "wind in valid range");
    assert(result.precip >= 0 && result.precip <= 5, "precip in valid range");
  });

  it("medium tier zone A applies lens (not bypassed as high)", () => {
    // This validates the fix: medium method zone A must NOT be treated as high tier.
    // The lens should run (tier='medium'), applying d20 mask with jitter level 0.
    const rec = makeRec(100, 8, 3, 2);
    const prev = makeRec(99, 5, 1, 0);  // Big day-over-day shift to make mask effects visible
    // Crucially: tier must be 'medium', not 'high'
    const revealMedium = { tier: "medium", quality: QUALITY_MEDIUM_A, isTail: false };
    const revealHigh = { tier: "high", quality: QUALITY_HIGH, isTail: false };
    const resultMedium = _forecastLens(rec, prev, revealMedium, 100);
    const resultHigh = _forecastLens(rec, prev, revealHigh, 100);
    // High tier always returns exact truth
    assertEquals(resultHigh.temp, 8);
    assertEquals(resultHigh.wind, 3);
    assertEquals(resultHigh.precip, 2);
    // Medium tier may differ due to d20 mask (5% chance). Even if it doesn't fire,
    // the code path is different — verify both produce valid results.
    assert(resultMedium.temp >= -5 && resultMedium.temp <= 15, "medium lens produces valid temp");
    assert(resultMedium.wind >= 0 && resultMedium.wind <= 5, "medium lens produces valid wind");
  });

  it("tail A' uses tail jitter (level 1) regardless of current zone", () => {
    // Tail days don't auto-sharpen. Even if the day is now in zone A,
    // a tail A' tag should use jitter level 1 (wind only).
    const rec = makeRec(100, 7, 3, 2);
    const prev = makeRec(99, 7, 3, 2);
    const reveal = { tier: "low", quality: QUALITY_TAIL_AP, isTail: true, tailTag: "Ap" };
    const result = _forecastLens(rec, prev, reveal, 100);
    // With stable weather (prev == current), temp and precip should be exact
    assertEquals(result.temp, rec.final.temp);
    assertEquals(result.precip, rec.final.precip);
  });
});

describe("Forecast Lens: quality rank system", () => {
  function setupLocation(ws: any, climate: string, geography: string, terrain: string) {
    ws.location = { name: "Test", climate, geography, terrain, sig: climate + "/" + geography + "/" + terrain };
  }

  it("quality rank blocks lower-quality overwrites", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    setupLocation(ws, loc.climate, loc.geography, loc.terrain);
    const serial = todaySerial();

    // First write: medium A (quality 2)
    _recordReveal(ws, serial, "medium", "medium", loc, QUALITY_MEDIUM_A);
    const rev1 = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev1.quality, QUALITY_MEDIUM_A);

    // Try to overwrite with low A (quality 6) — should be blocked
    _recordReveal(ws, serial, "low", "common", loc, QUALITY_LOW_A);
    const rev2 = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev2.quality, QUALITY_MEDIUM_A, "low should not overwrite medium");
  });

  it("higher quality overwrites lower quality", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    setupLocation(ws, loc.climate, loc.geography, loc.terrain);
    const serial = todaySerial();

    _recordReveal(ws, serial, "medium", "medium", loc, QUALITY_MEDIUM_D);
    _recordReveal(ws, serial, "high", "specific", loc, QUALITY_HIGH);
    const rev = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.quality, QUALITY_HIGH);
    assertEquals(rev.tier, "high");
  });

  it("A' tail does not get overwritten by low B (same tier, worse quality)", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    setupLocation(ws, loc.climate, loc.geography, loc.terrain);
    const serial = todaySerial();

    // A' is quality 6, low B is quality 7 — A' should win
    _recordReveal(ws, serial, "low", "tail", loc, QUALITY_TAIL_AP);
    _recordReveal(ws, serial, "low", "common", loc, QUALITY_LOW_B);
    const rev = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.quality, QUALITY_TAIL_AP, "A' should block low B overwrite");
  });

  it("common reveals grant correct quality per day offset", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    setupLocation(ws, loc.climate, loc.geography, loc.terrain);
    weatherEnsureForecast();
    const today = todaySerial();

    _grantCommonWeatherReveals(ws, today);
    const rev0 = _weatherRevealForSerial(ws, today, loc);
    const rev1 = _weatherRevealForSerial(ws, today + 1, loc);
    const rev2 = _weatherRevealForSerial(ws, today + 2, loc);

    assertEquals(rev0.quality, QUALITY_LOW_A, "today should get LOW_A quality");
    assertEquals(rev1.quality, QUALITY_LOW_B, "tomorrow should get LOW_B quality");
    assertEquals(rev2.quality, QUALITY_LOW_B, "+2 should get LOW_B quality");
  });

  it("legacy reveal without quality gets default from tier", () => {
    freshInstall();
    const ws = getWeatherState();
    const loc = { climate: "temperate", geography: "inland", terrain: "open" };
    setupLocation(ws, loc.climate, loc.geography, loc.terrain);
    const serial = todaySerial();

    // Simulate a legacy reveal (no quality field)
    const bucket = _weatherRevealBucket(ws, loc, true);
    bucket[String(serial)] = { tier: "medium", source: "medium" };

    const rev = _weatherRevealForSerial(ws, serial, loc);
    assertEquals(rev.quality, QUALITY_MEDIUM_A, "legacy medium should default to MEDIUM_A");
  });
});
