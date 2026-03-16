import { describe, it } from "node:test";
import { strictEqual as assertEquals, ok as assert } from "node:assert/strict";
import { completeSetup, freshInstall } from "./helpers.js";
import { state_name } from "../src/constants.js";
import { handleInput } from "../src/boot-register.js";
import { notifySetupStatusOnReady } from "../src/setup.js";
import { checkInstall, ensureSettings, getSetupState, resetToDefaults } from "../src/state.js";
import { getWeatherState } from "../src/weather.js";

function gmMsg(content: string) {
  return { type: "api", content, who: "GM (GM)", playerid: "GM" } as any;
}

function playerMsg(content: string) {
  return { type: "api", content, who: "Alice", playerid: "P1" } as any;
}

function lastChat() {
  const log = (globalThis as any)._chatLog;
  return log[log.length - 1] || null;
}

describe("Setup onboarding", () => {
  it("marks a blank install as uninitialized", () => {
    freshInstall();
    assertEquals(getSetupState().status, "uninitialized");
  });

  it("auto-migrates populated legacy state to complete", () => {
    (globalThis as any)._resetShim();
    (globalThis as any).state[state_name] = {
      settings: { calendarSystem: "eberron", calendarVariant: "standard" },
      calendar: {
        current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 },
        weekdays: ["Sul", "Mol", "Zol", "Wir", "Zor", "Far", "Sar"],
        months: Array.from({ length: 12 }, () => ({ days: 28 })),
        events: []
      }
    };
    checkInstall();
    assertEquals(getSetupState().status, "complete");
  });

  it("ready prompt whispers the exact welcome text through noarchive", () => {
    freshInstall();
    notifySetupStatusOnReady();
    const msg = lastChat();
    assert(msg);
    assert(msg.msg.includes("Welcome to Calendar! It looks like this is the first time Calendar has been used in this game. Would you like to initialize it?"));
    assertEquals(msg.opts.noarchive, true);
  });

  it("dismissal stores dismissed state and sends the exact follow-up", () => {
    freshInstall();
    handleInput(gmMsg("!cal setup dismiss"));
    assertEquals(getSetupState().status, "dismissed");
    assert(lastChat().msg.includes("No problem! Just call !cal at any time to begin the process."));
  });

  it("blocks players until the GM completes setup", () => {
    freshInstall();
    handleInput(playerMsg("!cal"));
    assert(lastChat().msg.includes("Calendar is waiting for the GM to finish setup"));
  });

  it("routes a GM root command into the setup wizard before initialization", () => {
    freshInstall();
    handleInput(gmMsg("!cal"));
    assert(lastChat().msg.includes("Calendar Setup"));
    assert(lastChat().msg.includes("Step 1: Setting"));
  });

  it("auto-selects the lone Forgotten Realms calendar and explains it", () => {
    freshInstall();
    handleInput(gmMsg("!cal setup calendar faerunian"));
    assert(lastChat().msg.includes("Harptos Calendar"));
    assert(lastChat().msg.includes("Forgotten Realms"));
    assert(lastChat().msg.includes("Step 3: Current In-Game Date"));
  });

  it("applies a weather-off setup flow and marks the campaign complete", () => {
    freshInstall();
    handleInput(gmMsg("!cal setup calendar eberron"));
    handleInput(gmMsg("!cal setup variant standard"));
    handleInput(gmMsg("!cal setup date default"));
    handleInput(gmMsg("!cal setup season eberron"));
    handleInput(gmMsg("!cal setup theme default"));
    handleInput(gmMsg("!cal setup defaults on"));
    handleInput(gmMsg("!cal setup moons on"));
    handleInput(gmMsg("!cal setup weather off"));
    handleInput(gmMsg("!cal setup planes on"));
    handleInput(gmMsg("!cal setup apply"));
    assertEquals(getSetupState().status, "complete");
    assertEquals(ensureSettings().weatherEnabled, false);
    assert((globalThis as any)._chatLog.length > 0);
  });

  it("supports the weather-location branch and stores the chosen location", () => {
    freshInstall();
    handleInput(gmMsg("!cal setup calendar eberron"));
    handleInput(gmMsg("!cal setup variant standard"));
    handleInput(gmMsg("!cal setup date default"));
    handleInput(gmMsg("!cal setup season eberron"));
    handleInput(gmMsg("!cal setup theme default"));
    handleInput(gmMsg("!cal setup defaults on"));
    handleInput(gmMsg("!cal setup moons on"));
    handleInput(gmMsg("!cal setup weather narrative"));
    handleInput(gmMsg("!cal setup planes on"));
    handleInput(gmMsg("!cal setup weather climate temperate"));
    handleInput(gmMsg("!cal setup weather geography inland"));
    handleInput(gmMsg("!cal setup weather terrain open"));
    handleInput(gmMsg("!cal setup apply"));
    assertEquals(getSetupState().status, "complete");
    assertEquals(getWeatherState().location.sig, "temperate/inland/open");
  });

  it("resetcalendar returns the campaign to the onboarding gate", () => {
    freshInstall();
    completeSetup();
    resetToDefaults();
    assertEquals(getSetupState().status, "uninitialized");
    assert(lastChat().msg.includes("Use <code>!cal</code> to begin setup."));
  });
});
