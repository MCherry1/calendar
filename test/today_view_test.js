// Tests for Today-view verbosity modes and the reduce-clutter design.
// Run with: node --test  or  deno test -A

import { describe, it } from "node:test";
import { strictEqual as assertEquals, ok as assert } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reuse the shared Roll20 shim.
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
// 12) VERBOSITY SETTING
// ============================================================================

describe("Verbosity Setting", () => {
  it("defaults to 'normal'", () => {
    freshInstall();
    assertEquals(t()._subsystemVerbosityValue(), "normal");
    assert(t()._subsystemIsVerbose());
  });

  it("'minimal' makes _subsystemIsVerbose return false", () => {
    freshInstall();
    t().ensureSettings().subsystemVerbosity = "minimal";
    assertEquals(t()._subsystemVerbosityValue(), "minimal");
    assert(!t()._subsystemIsVerbose());
  });

  it("invalid values fall back to 'normal'", () => {
    freshInstall();
    t().ensureSettings().subsystemVerbosity = "garbage";
    assertEquals(t()._subsystemVerbosityValue(), "normal");
    assert(t()._subsystemIsVerbose());
  });

  it("is case-insensitive", () => {
    freshInstall();
    t().ensureSettings().subsystemVerbosity = "MINIMAL";
    assertEquals(t()._subsystemVerbosityValue(), "minimal");
    assert(!t()._subsystemIsVerbose());
  });
});

// ============================================================================
// 13) WEATHER STABILITY DETECTION
// ============================================================================

describe("Weather Stability Detection", () => {
  it("null/missing record is treated as stable", () => {
    freshInstall();
    assert(t()._todayWeatherIsStable(null));
    assert(t()._todayWeatherIsStable({}));
    assert(t()._todayWeatherIsStable({ periods: null }));
  });

  it("uniform periods are stable", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        early_morning: { temp: 5, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 2, precip: 1 },
        late_night:    { temp: 5, wind: 2, precip: 1 },
      },
    };
    assert(t()._todayWeatherIsStable(wxRec));
  });

  it("small variation (within ±1) is still stable", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        early_morning: { temp: 4, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 3, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 6, wind: 2, precip: 0 },
        late_night:    { temp: 5, wind: 1, precip: 1 },
      },
    };
    assert(t()._todayWeatherIsStable(wxRec));
  });

  it("large temp swing is divergent", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        early_morning: { temp: 0, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 2, precip: 1 },
        late_night:    { temp: 5, wind: 2, precip: 1 },
      },
    };
    assert(!t()._todayWeatherIsStable(wxRec));
  });

  it("large wind swing is divergent", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        early_morning: { temp: 5, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 5, precip: 1 },
        late_night:    { temp: 5, wind: 2, precip: 1 },
      },
    };
    assert(!t()._todayWeatherIsStable(wxRec));
  });

  it("large precip swing is divergent", () => {
    freshInstall();
    const wxRec = {
      final: { temp: 5, wind: 2, precip: 1 },
      periods: {
        early_morning: { temp: 5, wind: 2, precip: 1 },
        morning:       { temp: 5, wind: 2, precip: 1 },
        afternoon:     { temp: 5, wind: 2, precip: 1 },
        evening:       { temp: 5, wind: 2, precip: 1 },
        late_night:    { temp: 5, wind: 2, precip: 4 },
      },
    };
    assert(!t()._todayWeatherIsStable(wxRec));
  });
});

// ============================================================================
// 14) TODAY-VIEW HTML OUTPUT MODES
// ============================================================================

describe("Today-View HTML Output", () => {
  /** Set up a weather location so forecasts generate. */
  function setupWeather() {
    const ws = t().getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate-inland-open" };
    t().weatherEnsureForecast();
  }

  it("normal mode includes full period breakdown", () => {
    freshInstall();
    const st = t().ensureSettings();
    st.subsystemVerbosity = "normal";
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    st.planesEnabled = true;
    setupWeather();
    t().moonEnsureSequences();
    const html = t()._todayAllHtml();
    assert(typeof html === "string" && html.length > 0, "should produce HTML");
    // Normal mode should show period labels like "Afternoon" or "Morning"
    assert(html.includes("Afternoon") || html.includes("Morning"),
      "normal mode should include period labels");
    // Should have a Detail button
    assert(html.includes("Detail"), "should include Detail buttons");
  });

  it("minimal mode suppresses unremarkable moons", () => {
    freshInstall();
    const st = t().ensureSettings();
    st.subsystemVerbosity = "minimal";
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    st.planesEnabled = true;
    setupWeather();
    t().moonEnsureSequences();
    const html = t()._todayAllHtml();
    assert(typeof html === "string" && html.length > 0, "should produce HTML");
    // Minimal mode should mention "unremarkable" if moons are suppressed
    // (On most days, not all 12 moons are at full/new)
    assert(html.includes("unremarkable") || html.includes("FULL") || html.includes("NEW"),
      "minimal mode should either suppress moons or show notable ones");
  });

  it("minimal mode includes inline lighting in moon section", () => {
    freshInstall();
    const st = t().ensureSettings();
    st.subsystemVerbosity = "minimal";
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    setupWeather();
    t().moonEnsureSequences();
    const html = t()._todayAllHtml();
    // In minimal mode, lighting is merged into the moon section as "Tonight:"
    assert(html.includes("Tonight:"), "minimal mode should have inline lighting");
  });

  it("normal mode has separate lighting section", () => {
    freshInstall();
    const st = t().ensureSettings();
    st.subsystemVerbosity = "normal";
    st.moonsEnabled = true;
    st.weatherEnabled = true;
    setupWeather();
    t().moonEnsureSequences();
    const html = t()._todayAllHtml();
    assert(html.includes("Tonight's Lighting"),
      "normal mode should have separate lighting section header");
  });

  it("switching verbosity changes output", () => {
    freshInstall();
    const st = t().ensureSettings();
    st.weatherEnabled = true;
    st.moonsEnabled = true;
    st.planesEnabled = true;
    setupWeather();
    t().moonEnsureSequences();

    st.subsystemVerbosity = "normal";
    const normalHtml = t()._todayAllHtml();

    st.subsystemVerbosity = "minimal";
    const minimalHtml = t()._todayAllHtml();

    // They should differ meaningfully
    assert(normalHtml !== minimalHtml,
      "normal and minimal output should differ");
    // Minimal should generally be shorter
    assert(minimalHtml.length < normalHtml.length,
      "minimal output should be shorter than normal");
  });
});

// ============================================================================
// 15) WEATHER DAY PERIOD CONSTANTS
// ============================================================================

describe("Weather Day Period Constants", () => {
  it("WEATHER_DAY_PERIODS has 5 periods", () => {
    freshInstall();
    assertEquals(t().WEATHER_DAY_PERIODS.length, 5);
  });

  it("WEATHER_PRIMARY_PERIOD is afternoon", () => {
    freshInstall();
    assertEquals(t().WEATHER_PRIMARY_PERIOD, "afternoon");
  });

  it("afternoon is in WEATHER_DAY_PERIODS", () => {
    freshInstall();
    assert(t().WEATHER_DAY_PERIODS.includes("afternoon"));
  });
});
