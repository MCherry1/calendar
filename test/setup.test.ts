import { describe, it } from "node:test";
import { strictEqual as assertEquals, ok as assert } from "node:assert/strict";
import { completeSetup, freshInstall } from "./helpers.js";
import { state_name } from "../src/constants.js";
import { todaySerial } from "../src/date-math.js";
import { handleInput } from "../src/boot-register.js";
import { notifySetupStatusOnReady } from "../src/setup.js";
import { checkInstall, ensureSettings, getSetupState, resetToDefaults } from "../src/state.js";
import { getWeatherState } from "../src/weather.js";
import { getPlanarState, getPlanesState } from "../src/planes.js";

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

function startEberronSetup() {
  handleInput(gmMsg("!cal setup calendar eberron"));
  handleInput(gmMsg("!cal setup variant standard"));
  handleInput(gmMsg("!cal setup date default"));
  handleInput(gmMsg("!cal setup season eberron"));
  handleInput(gmMsg("!cal setup theme default"));
  handleInput(gmMsg("!cal setup defaults on"));
  handleInput(gmMsg("!cal setup moons on"));
}

function finishDefaultEberronPlanarInit() {
  handleInput(gmMsg("!cal setup planeinit link roll"));
  handleInput(gmMsg("!cal setup planeinit climate roll"));
  handleInput(gmMsg("!cal setup planeinit plane Daanvi roll"));
  handleInput(gmMsg("!cal setup planeinit plane Dolurrh roll"));
  handleInput(gmMsg("!cal setup planeinit plane Irian roll"));
  handleInput(gmMsg("!cal setup planeinit plane Shavarath roll"));
  handleInput(gmMsg("!cal setup planeinit plane Syrania roll"));
  handleInput(gmMsg("!cal setup planeinit plane Thelanis roll"));
  handleInput(gmMsg("!cal setup planeinit mabar roll"));
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
    startEberronSetup();
    handleInput(gmMsg("!cal setup weather off"));
    handleInput(gmMsg("!cal setup planes on"));
    finishDefaultEberronPlanarInit();
    handleInput(gmMsg("!cal setup apply"));
    assertEquals(getSetupState().status, "complete");
    assertEquals(ensureSettings().weatherEnabled, false);
    assert((globalThis as any)._chatLog.length > 0);
  });

  it("supports the weather-location branch and stores the chosen location", () => {
    freshInstall();
    startEberronSetup();
    handleInput(gmMsg("!cal setup weather narrative"));
    handleInput(gmMsg("!cal setup planes on"));
    handleInput(gmMsg("!cal setup weather climate temperate"));
    handleInput(gmMsg("!cal setup weather geography inland"));
    handleInput(gmMsg("!cal setup weather terrain open"));
    finishDefaultEberronPlanarInit();
    handleInput(gmMsg("!cal setup apply"));
    assertEquals(getSetupState().status, "complete");
    assertEquals(getWeatherState().location.sig, "temperate/inland/open");
  });

  it("enters the Eberron planar initialization branch after planes are enabled", () => {
    freshInstall();
    startEberronSetup();
    handleInput(gmMsg("!cal setup weather off"));
    handleInput(gmMsg("!cal setup planes on"));
    assert(lastChat().msg.includes("Planar Initialization"));
    assert(lastChat().msg.includes("Fernia/Risia Link"));
    assert(lastChat().msg.includes("Roll for it"));
  });

  it("changes the climate prompt shape based on the Fernia/Risia link choice", () => {
    freshInstall();
    startEberronSetup();
    handleInput(gmMsg("!cal setup weather off"));
    handleInput(gmMsg("!cal setup planes on"));
    handleInput(gmMsg("!cal setup planeinit link linked"));
    assert(lastChat().msg.includes("Fernia coterminous in year one"));
    assert(lastChat().msg.includes("Risia coterminous in year one"));
    assert(!lastChat().msg.includes("Fernia remote in year one"));

    freshInstall();
    startEberronSetup();
    handleInput(gmMsg("!cal setup weather off"));
    handleInput(gmMsg("!cal setup planes on"));
    handleInput(gmMsg("!cal setup planeinit link independent"));
    assert(lastChat().msg.includes("Fernia remote in year one"));
    assert(lastChat().msg.includes("Risia remote in year one"));
  });

  it("applies explicit Eberron planar setup choices and writes the resolved state plus follow-up commands", () => {
    freshInstall();
    startEberronSetup();
    handleInput(gmMsg("!cal setup weather off"));
    handleInput(gmMsg("!cal setup planes on"));
    handleInput(gmMsg("!cal setup planeinit link linked"));
    handleInput(gmMsg("!cal setup planeinit climate fernia-coterminous"));
    handleInput(gmMsg("!cal setup planeinit plane Daanvi remote"));
    handleInput(gmMsg("!cal setup planeinit plane Dolurrh roll"));
    handleInput(gmMsg("!cal setup planeinit plane Irian neither"));
    handleInput(gmMsg("!cal setup planeinit plane Shavarath roll"));
    handleInput(gmMsg("!cal setup planeinit plane Syrania roll"));
    handleInput(gmMsg("!cal setup planeinit plane Thelanis roll"));
    handleInput(gmMsg("!cal setup planeinit mabar neither"));
    handleInput(gmMsg("!cal setup apply"));

    const ps = getPlanesState();
    assertEquals(ps.ferniaRisiaLinkMode, "linked");
    assert(ps.seedOverrides.Fernia != null);
    assert(ps.seedOverrides.Daanvi != null);
    assert(ps.seedOverrides.Irian != null);
    assert(ps.seedOverrides.Mabar != null);

    const today = todaySerial();
    const daanvi = getPlanarState("Daanvi", today, { ignoreGenerated: true } as any);
    const irian = getPlanarState("Irian", today, { ignoreGenerated: true } as any);
    assert(daanvi && daanvi.phase === "remote");
    assertEquals(Math.floor((daanvi.daysIntoPhase || 0) / 336), Math.floor(((daanvi.phaseDuration || 0) / 336) / 2));
    assert(irian && irian.phase === "neutral");
    assertEquals(irian.phaseIndex, 3);

    const log = (globalThis as any)._chatLog;
    const summary = [...log].reverse().find((entry: any) =>
      String(entry.msg).includes("Planar Initialization Applied")
    );
    assert(summary);
    assert(summary.msg.includes("!cal planes link fernia-risia linked"));
    assert(summary.msg.includes("!cal planes seed Fernia"));
    assert(summary.msg.includes("!cal planes seed Daanvi"));
  });

  it("resetcalendar returns the campaign to the onboarding gate", () => {
    freshInstall();
    completeSetup();
    resetToDefaults();
    assertEquals(getSetupState().status, "uninitialized");
    assert(lastChat().msg.includes("Use <code>!cal</code> to begin setup."));
  });
});
