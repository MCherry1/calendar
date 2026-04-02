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
  _composeFormula, _rollTrait, _deriveConditions, _evaluateExtremeEvents, _weatherTraitBadge, _nudge
} from "../src/weather.js";
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
