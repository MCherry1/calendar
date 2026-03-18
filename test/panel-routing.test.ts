import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals, notStrictEqual as assertNotEquals } from "node:assert/strict";
import { freshInstall, completeSetup } from "./helpers.js";
import { ensureSettings } from "../src/state.js";
import { toSerial } from "../src/date-math.js";
import { handleInput } from "../src/boot-register.js";
import { getWeatherState, handleWeatherCommand, weatherEnsureForecast } from "../src/weather.js";
import { getMoonState, handleMoonCommand } from "../src/moon.js";
import { getPlanesState, handlePlanesCommand } from "../src/planes.js";

function gmMessage(content: string) {
  return {
    type: "api",
    content,
    who: "GM (GM)",
    playerid: "GM"
  } as any;
}

function gmUser() {
  return { who: "GM (GM)", playerid: "GM" } as any;
}

function lastChat() {
  const log = (globalThis as any)._chatLog;
  return log[log.length - 1];
}

describe("Redesigned panel routing", () => {
  it("routes Today additional-options Events into the Events panel", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal today options events"));

    const msg = String(lastChat().msg);
    assert(msg.includes("Events"));
    assert(msg.includes("Send to Players"));
    assert(msg.includes("events manage ?{Action|Add Single Event"));
  });

  it("keeps the Events send button aligned to the displayed month", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal events panel " + toSerial(998, 1, 12)));

    const msg = String(lastChat().msg);
    assert(msg.includes("!cal send Olarune 998"));
    assert(!msg.includes("send ?{Calendar range|this month}"));
  });

  it("opens Source Controls and Remove/Restore from Events management", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal events manage source"));
    let msg = String(lastChat().msg);
    assert(msg.includes("Sources &amp; Priority"));
    assert(msg.includes("source"));

    handleInput(gmMessage("!cal events manage removeflow"));
    msg = String(lastChat().msg);
    assert(msg.includes("Remove / Restore Events"));
    assert(msg.includes("!cal events remove list"));
    assert(msg.includes("!cal events restore list"));
  });
});

describe("Weather management routing", () => {
  it("emits supported weather management actions including the hazards toggle", () => {
    freshInstall();
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate-inland-open" } as any;
    weatherEnsureForecast();

    handleWeatherCommand(gmUser(), ["weather"]);

    const msg = String(lastChat().msg);
    assert(msg.includes("weather manage ?{Action|Toggle Weather On/Off,toggleweather|Toggle Extreme Hazards,togglehazards|Toggle Mechanics,togglemechanics"));
    assert(msg.includes("Reseed Weather,reseed"));
  });

  it("toggles weather from the management dispatcher", () => {
    freshInstall();
    const before = ensureSettings().weatherEnabled !== false;

    handleWeatherCommand(gmUser(), ["weather", "manage", "toggleweather"]);

    assertEquals(ensureSettings().weatherEnabled, !before);
  });

  it("supports hazards on/off via settings and the weather management dispatcher", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal settings hazards off"));
    assertEquals(ensureSettings().weatherHazardsEnabled, false);

    handleWeatherCommand(gmUser(), ["weather", "manage", "togglehazards"]);
    assertEquals(ensureSettings().weatherHazardsEnabled, true);
  });

  it("blocks direct extreme-event actions while hazards are disabled", () => {
    freshInstall();
    ensureSettings().weatherHazardsEnabled = false;

    handleWeatherCommand(gmUser(), ["weather", "event", "trigger", "flash_flood"]);

    const log = (globalThis as any)._chatLog;
    assert(log.some((entry: any) => String(entry.msg).includes("Extreme hazards are disabled")));
  });
});

describe("Moon management routing", () => {
  it("emits real moon management actions with moon-name input and reseeds successfully", () => {
    freshInstall();

    handleMoonCommand(gmUser(), ["moon"]);

    let msg = String(lastChat().msg);
    assert(msg.includes("moon manage ?{Action|Toggle Moons On/Off,toggle|Reseed Moons,reseed"));
    assert(msg.includes("Set New,setnew"));
    assert(msg.includes("Set Full,setfull"));

    const beforeSeed = getMoonState().systemSeed;
    handleMoonCommand(gmUser(), ["moon", "manage", "reseed"]);
    assert(getMoonState().systemSeed);
    assertNotEquals(getMoonState().systemSeed, beforeSeed);
  });

  it("routes manage setnew into the real moon anchoring flow", () => {
    freshInstall();

    handleMoonCommand(gmUser(), ["moon", "manage", "setnew", "Zarantyr", "Rhaan", "14", "998"]);

    const anchors = getMoonState().gmAnchors.Zarantyr || [];
    assert(anchors.some((entry: any) => entry.type === "new"));
  });
});

describe("Planes management routing", () => {
  it("emits supported planes management actions and toggles generated events", () => {
    freshInstall();

    handlePlanesCommand(gmUser(), ["planes"]);

    const msg = String(lastChat().msg);
    assert(msg.includes("planes manage ?{Action|Toggle Planes On/Off,toggle|Toggle Generated Events,generated|Set Phase Override,set"));
    assert(msg.includes("Clear Override,clear"));
    assert(msg.includes("Set Anchor,anchorwizard"));
    assert(msg.includes("Seed Override,seed"));

    const before = ensureSettings().offCyclePlanes !== false;
    handlePlanesCommand(gmUser(), ["planes", "manage", "generated"]);
    assertEquals(ensureSettings().offCyclePlanes, !before);
  });

  it("accepts the dropdown All sentinel for clear", () => {
    freshInstall();
    const ps = getPlanesState();
    ps.overrides.Fernia = { phase: "remote", setOn: toSerial(998, 0, 1), note: "GM override" } as any;

    handlePlanesCommand(gmUser(), ["planes", "manage", "clear", "All"]);

    assertEquals(Object.keys(getPlanesState().overrides).length, 0);
  });

  it("opens a plane-specific anchor wizard that anchors coterminous starts", () => {
    freshInstall();

    handlePlanesCommand(gmUser(), ["planes", "anchorwizard", "Fernia"]);

    const msg = String(lastChat().msg);
    assert(msg.includes("Set Anchor - Fernia"));
    assert(msg.includes("Traditional cycle"));
    assert(msg.includes("Default coterminous start"));
    assert(msg.includes("Set First Coterminous Start"));
    assert(msg.includes("!cal planes anchor Fernia coterminous ?{Fernia cycle: coterminous 28 days every 5 years."));
    assert(msg.includes("When should the first coterminous phase begin? This defines the cycle for all time."));
  });
});
