import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals, notStrictEqual as assertNotEquals } from "node:assert/strict";
import { freshInstall, completeSetup } from "./helpers.js";
import { ensureSettings, getCal } from "../src/state.js";
import { toSerial } from "../src/date-math.js";
import { handleInput } from "../src/boot-register.js";
import { eventKey } from "../src/events.js";
import { getWeatherState, handleWeatherCommand, weatherEnsureForecast } from "../src/weather.js";
import { getMoonState, handleMoonCommand } from "../src/moon.js";
import { getPlanesState, handlePlanesCommand } from "../src/planes.js";
import { getPersistentViewsState } from "../src/persistent-views.js";

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
    assert(msg.includes("Add Event"));
    assert(msg.includes("events source"));
    assert(msg.includes("events list"));
    assert(!msg.includes("events removeflow"));
  });

  it("keeps the Events send button aligned to the displayed month", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal events panel " + toSerial(998, 1, 12)));

    const msg = String(lastChat().msg);
    assert(msg.includes("!cal send Olarune 998"));
    assert(!msg.includes("send ?{Calendar range|this month}"));
  });

  it("opens Source Controls and the real list workflow from Events management", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal events manage source"));
    let msg = String(lastChat().msg);
    assert(msg.includes("Sources"));
    assert(msg.includes("source"));

    handleInput(gmMessage("!cal events manage list"));
    msg = String(lastChat().msg);
    assert(msg.includes("Current Status"));
    assert(msg.includes("[➖ Hide](!cal remove "));
    assert(!msg.includes("events removeflow"));
  });

  it("routes Today additional-options Admin into the GM menu without undefined output", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal today options admin"));

    const log = (globalThis as any)._chatLog;
    const msg = String(lastChat().msg);
    assert(msg.includes("GM Admin"));
    assert(!log.some((entry: any) => String(entry.msg) === "undefined"));
  });

  it("renders source controls in the default priority order with plain Show/Hide labels", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal source list"));

    const msg = String(lastChat().msg);
    const order = ["Khorvaire", "Sovereign Host", "Sharn", "Dark Six", "Silver Flame", "Stormreach"];
    for (let i = 1; i < order.length; i++) {
      assert(msg.indexOf(order[i - 1]) < msg.indexOf(order[i]));
    }
    assert(msg.includes("[Hide](!cal source disable Khorvaire"));
    assert(!msg.includes("[📅 Hide]"));
    assert(!msg.includes("[📅 Show]"));
  });

  it("shows hide/show controls directly in the event list", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal list"));
    let msg = String(lastChat().msg);
    assert(msg.includes("Current Status"));
    assert(msg.includes("[➖ Hide](!cal remove "));

    const evt = getCal().events.find((entry: any) => entry.source === "khorvaire");
    assert(evt);
    handleInput(gmMessage("!cal remove key " + encodeURIComponent(eventKey(evt))));
    handleInput(gmMessage("!cal list"));

    msg = String(lastChat().msg);
    assert(msg.includes("Hidden"));
    assert(msg.includes("[➕ Show](!cal restore key "));
  });

  it("builds viewed-date Additional Ranges commands for events and renders year, rolling, and month ranges", () => {
    freshInstall();
    completeSetup();

    const serial = toSerial(998, 1, 12);
    handleInput(gmMessage("!cal events panel " + serial));

    let msg = String(lastChat().msg);
    assert(msg.includes("Full Calendar Year (998),year 998"));
    assert(msg.includes("Rolling 12 Months,rolling " + serial));
    assert(msg.includes("Olarune 998,month Olarune 998"));
    assert(msg.includes("Zarantyr 999,month Zarantyr 999"));

    handleInput(gmMessage("!cal events ranges year 998"));
    msg = String(lastChat().msg);
    assert(msg.includes("Events — Full Calendar Year (998)"));
    assert(msg.includes("Zarantyr"));
    assert(!msg.includes("Calendar Jump Syntax"));
    assert(!msg.includes("997 YK"));

    handleInput(gmMessage("!cal events ranges rolling " + serial));
    msg = String(lastChat().msg);
    assert(msg.includes("Events — Rolling 12 Months"));
    assert(msg.includes("Zarantyr"));
    assert(msg.includes("Vult"));
    assert(!msg.includes("Calendar Jump Syntax"));

    handleInput(gmMessage("!cal events ranges month Zarantyr 999"));
    msg = String(lastChat().msg);
    assert(msg.includes("Events — Zarantyr 999 YK"));
    assert(!msg.includes("Calendar Jump Syntax"));
  });
});

describe("Weather management routing", () => {
  it("routes bare weather and forecast into the new calendar-first weather surfaces", () => {
    freshInstall();
    completeSetup();
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate-inland-open" } as any;
    weatherEnsureForecast();

    handleWeatherCommand(gmUser(), ["weather"]);
    let msg = String(lastChat().msg);
    assert(msg.includes('data-weather-view="today-calendar-gm"'));
    assert(msg.includes('data-weather-tod-grid="1"'));
    assert(!msg.includes("View: "));

    handleInput(gmMessage("!cal forecast"));
    msg = String(lastChat().msg);
    assert(msg.includes('data-weather-view="forecast-calendar-gm"'));
    assert(msg.includes('data-weather-forecast-grid="1"'));
    assert(!msg.includes("View: "));
  });

  it("emits supported weather management actions including the hazards toggle", () => {
    freshInstall();
    const ws = getWeatherState();
    ws.location = { name: "Test Town", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate-inland-open" } as any;
    weatherEnsureForecast();

    handleWeatherCommand(gmUser(), ["weather"]);

    const msg = String(lastChat().msg);
    assert(msg.includes("weather manage ?{Action|Toggle Weather On/Off,toggleweather|Toggle Extreme Hazards,togglehazards|Toggle Mechanics,togglemechanics"));
    assert(msg.includes("Reseed Weather,reseed"));
    assert(msg.includes("Lock Specific Day"));
    assert(msg.includes("freezes that forecast record"));
    assert(!msg.includes("Forecast List"));
    assert(!msg.includes("Lock Day,lock ?\\{Day serial"));
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
  it("routes today-options moon and moon phases into the compact moon summary", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal today options moon"));
    let log = (globalThis as any)._chatLog.map((entry: any) => String(entry.msg)).join("\n");
    assert(log.includes("Moon Summary"));
    assert(!log.includes("Moon Overview"));

    (globalThis as any)._chatLog.length = 0;
    handleMoonCommand(gmUser(), ["moon", "phases"]);
    log = (globalThis as any)._chatLog.map((entry: any) => String(entry.msg)).join("\n");
    assert(log.includes("Moon Summary"));
    assert(!log.includes("Moon Overview"));
  });

  it("emits real moon management actions with moon-name input and reseeds successfully", () => {
    freshInstall();

    handleMoonCommand(gmUser(), ["moon"]);

    let msg = String(lastChat().msg);
    assert(msg.includes("moon manage ?{Action|Toggle Moons On/Off,toggle|Reseed Moons,reseed"));
    assert(msg.includes("Set New,setnew"));
    assert(msg.includes("Set Full,setfull"));
    assert(msg.includes("Bind Moon Page,page bind"));
    assert(msg.includes("Refresh Moon Page,page refresh"));
    assert(msg.includes("Show Moon Page,page show"));
    assert(!msg.includes("moon phases"));

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

  it("routes moon page bind/show commands through the moon handler", () => {
    freshInstall();
    const page = (globalThis as any).createObj("page", { name: "Moon Phase", width: 25, height: 25 });

    handleMoonCommand(gmUser(), ["moon", "page", "bind", "Moon", "Phase"]);
    assertEquals(getPersistentViewsState().moonPage.pageId, page.id);

    handleMoonCommand(gmUser(), ["moon", "page", "show"]);
    assertEquals((globalThis as any).Campaign().get("playerpageid"), page.id);
  });

  it("renders moon Additional Ranges against the viewed date and resolves real range output", () => {
    freshInstall();
    completeSetup();

    const serial = toSerial(998, 1, 12);
    handleMoonCommand(gmUser(), ["moon", "on", "Olarune", "12", "998"]);

    let msg = String(lastChat().msg);
    assert(msg.includes("Full Calendar Year (998),year 998"));
    assert(msg.includes("Rolling 12 Months,rolling " + serial));
    assert(msg.includes("Olarune 998,month Olarune 998"));
    assert(msg.includes("Zarantyr 999,month Zarantyr 999"));

    handleMoonCommand(gmUser(), ["moon", "ranges", "year", "998"]);
    msg = String(lastChat().msg);
    assert(msg.includes("Moons — Full Calendar Year (998)"));
    assert(!msg.includes("Moon: <code>!cal moon"));

    handleMoonCommand(gmUser(), ["moon", "ranges", "rolling", String(serial)]);
    msg = String(lastChat().msg);
    assert(msg.includes("Moons — Rolling 12 Months"));
    assert(!msg.includes("Moon: <code>!cal moon"));

    handleMoonCommand(gmUser(), ["moon", "ranges", "month", "Zarantyr", "999"]);
    msg = String(lastChat().msg);
    assert(msg.includes("Moons — Zarantyr 999 YK"));
    assert(!msg.includes("Moon: <code>!cal moon"));
  });
});

describe("Planes management routing", () => {
  it("routes today-options planes and planes phases into the compact planes summary", () => {
    freshInstall();
    completeSetup();

    handleInput(gmMessage("!cal today options planes"));
    let log = (globalThis as any)._chatLog.map((entry: any) => String(entry.msg)).join("\n");
    assert(log.includes("Planar Summary"));
    assert(!log.includes("Planar Phases"));

    (globalThis as any)._chatLog.length = 0;
    handlePlanesCommand(gmUser(), ["planes", "phases"]);
    log = (globalThis as any)._chatLog.map((entry: any) => String(entry.msg)).join("\n");
    assert(log.includes("Planar Summary"));
    assert(!log.includes("Planes: <code>!cal planes</code>"));
  });

  it("emits supported planes management actions and toggles generated events", () => {
    freshInstall();

    handlePlanesCommand(gmUser(), ["planes"]);

    const msg = String(lastChat().msg);
    assert(msg.includes("planes manage ?{Action|Toggle Planes On/Off,toggle|Toggle Generated Events,generated|Set Phase Override,set"));
    assert(msg.includes("Clear Override,clear"));
    assert(msg.includes("Set Anchor,anchorwizard"));
    assert(msg.includes("Seed Override,seed"));
    assert(msg.includes("📋 Summary"));
    assert(!msg.includes("📋 List"));

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

  it("renders plane Additional Ranges against the viewed date and resolves real range output", () => {
    freshInstall();
    completeSetup();

    const serial = toSerial(998, 1, 12);
    handlePlanesCommand(gmUser(), ["planes", "on", "Olarune", "12", "998"]);

    let msg = String(lastChat().msg);
    assert(msg.includes("Full Calendar Year (998),year 998"));
    assert(msg.includes("Rolling 12 Months,rolling " + serial));
    assert(msg.includes("Olarune 998,month Olarune 998"));
    assert(msg.includes("Zarantyr 999,month Zarantyr 999"));

    handlePlanesCommand(gmUser(), ["planes", "ranges", "year", "998"]);
    msg = String(lastChat().msg);
    assert(msg.includes("Planes — Full Calendar Year (998)"));
    assert(!msg.includes("Calendar Jump Syntax"));

    handlePlanesCommand(gmUser(), ["planes", "ranges", "rolling", String(serial)]);
    msg = String(lastChat().msg);
    assert(msg.includes("Planes — Rolling 12 Months"));
    assert(!msg.includes("Calendar Jump Syntax"));

    handlePlanesCommand(gmUser(), ["planes", "ranges", "month", "Zarantyr", "999"]);
    msg = String(lastChat().msg);
    assert(msg.includes("Planes — Zarantyr 999 YK"));
    assert(!msg.includes("Calendar Jump Syntax"));
  });
});
