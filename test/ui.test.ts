import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { _showDefaultCalView } from "../src/commands.js";
import { setDate, stepDays } from "../src/ui.js";
import { sendToAll, sendUiToGM } from "../src/messaging.js";
import { helpRootMenu } from "../src/ui.js";
import { fromSerial, toSerial } from "../src/date-math.js";
import { getWeatherState } from "../src/weather.js";
import { MOON_SYSTEMS, _moonNextThresholdEntry, _moonPeakPhaseDay, _moonPhaseSpan, moonEnsureSequences } from "../src/moon.js";
import { _getAllPlaneData, getPlanarState } from "../src/planes.js";

function setSerial(serial: number) {
  const d = fromSerial(serial);
  setDate(d.mi + 1, d.day, d.year);
}

describe("Task-focused UI", () => {
  it("routes both transient helpers and broadcasts through noarchive", () => {
    freshInstall();
    sendUiToGM("<div>GM menu</div>");
    sendToAll("<div>Story-facing content</div>");
    const log = (globalThis as any)._chatLog;
    assertEquals(log[0].opts.noarchive, true);
    assertEquals(log[1].opts.noarchive, true);
  });

  it("renders the root help menu through the transient noarchive path with updated date wording", () => {
    freshInstall();
    helpRootMenu({ who: "GM (GM)", playerid: "GM" } as any);
    const msg = (globalThis as any)._chatLog.slice(-1)[0];
    assert(msg.msg.includes("Today&#39;s Calendar"));
    assert(msg.msg.includes("Subsystems"));
    assertEquals(msg.opts.noarchive, true);
    assert(msg.msg.includes("Set Date"));
    assert(msg.msg.includes("?{Set Date &#40;mm dd yyyy&#41;|"));
    assert(msg.msg.includes("Prompt !cal add"));
    assert(msg.msg.includes("Prompt !cal addmonthly"));
    assert(msg.msg.includes("Prompt !cal addyearly"));
    assert(msg.msg.includes("Prompt !cal moon on"));
    assert(msg.msg.includes("Prompt !cal planes on"));
    assert(!msg.msg.includes("Prompt !cal set"));
    assert(!msg.msg.includes("Prompt !cal send"));
  });

  it("uses the current-month minical as the default root view", () => {
    freshInstall();
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    const msg = (globalThis as any)._chatLog.slice(-1)[0];
    assert(msg.msg.includes("retreat 1") || msg.msg.includes("⬅"), "should have retreat/back button");
    assert(msg.msg.includes("advance 1") || msg.msg.includes("➡"), "should have advance/forward button");
    assert(msg.msg.includes("send"), "should have send-to-players action");
  });

  it("redraws the dashboard minical after day advance", () => {
    freshInstall();
    stepDays(1);
    const msg = (globalThis as any)._chatLog.slice(-1)[0];
    assert(msg.msg.includes("<table"), "should redraw the month minical");
    assert(msg.msg.includes("advance 1") || msg.msg.includes("➡"), "should keep advance controls");
    assert(!msg.msg.includes("Stepped Forward"), "should send the refreshed Today view instead of the old step notice");
  });

  it("shows transparent location labels and span-aware moon highlights in the dashboard", () => {
    freshInstall();
    const ws = getWeatherState();
    ws.location = { name: "Sharn", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate/inland/open" } as any;

    const start = toSerial(998, 0, 1);
    const end = start + 336;
    moonEnsureSequences(start, 400);

    let found: any = null;
    for (let serial = start; serial <= end && !found; serial++) {
      for (const moon of MOON_SYSTEMS.eberron.moons as any[]) {
        const span = _moonPhaseSpan(moon.name, serial);
        if (span && span.totalDays > 1) {
          found = { serial, moon: moon.name, type: span.type };
          break;
        }
      }
    }

    assert(found, "expected a multi-day moon phase in the first year");
    setSerial(found.serial);
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    const msg = String((globalThis as any)._chatLog.slice(-1)[0].msg);
    assert(msg.includes("Sharn (Temperate / Inland / Open)"));
    assert(msg.includes(`${found.moon}</b> is ${found.type === "full" ? "Full" : "New"} (Day `));

    ws.location = { name: "Temperate / Inland / Open", climate: "temperate", geography: "inland", terrain: "open", sig: "temperate/inland/open" } as any;
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    const genericMsg = String((globalThis as any)._chatLog.slice(-1)[0].msg);
    assert(genericMsg.includes("📍 Temperate / Inland / Open"));
    assert(!genericMsg.includes("Temperate / Inland / Open (Temperate / Inland / Open)"));
  });

  it("surfaces long-span moon previews and plane day spans in the GM dashboard", () => {
    freshInstall();
    moonEnsureSequences(todayLikeStart(), 400);

    let moonPreview: any = null;
    const moonStart = toSerial(998, 0, 1);
    for (let serial = moonStart; serial <= moonStart + 336 && !moonPreview; serial++) {
      const next = _moonNextThresholdEntry("Vult", serial, 2);
      if (next && next.type === "full") moonPreview = { serial, days: next.days };
    }
    assert(moonPreview, "expected a Vult preview within the first year");

    setSerial(moonPreview.serial);
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    let msg = String((globalThis as any)._chatLog.slice(-1)[0].msg);
    assert(msg.includes("Vult</b> Full " + (moonPreview.days === 1 ? "tomorrow" : "in 2 days")));

    const planeStart = toSerial(998, 0, 1);
    let planeMatch: any = null;
    for (let serial = planeStart; serial <= planeStart + 336 && !planeMatch; serial++) {
      for (const plane of _getAllPlaneData()) {
        if (plane.type === "fixed") continue;
        const ps = getPlanarState(plane.name, serial);
        if (ps && (ps.phase === "coterminous" || ps.phase === "remote") && ps.phaseDuration != null && ps.phaseDuration > 1 && ps.phaseDuration <= 336) {
          planeMatch = { serial, plane: plane.name, phase: ps.phase === "coterminous" ? "Coterminous" : "Remote" };
          break;
        }
      }
    }
    assert(planeMatch, "expected an active multi-day planar phase");

    setSerial(planeMatch.serial);
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    msg = String((globalThis as any)._chatLog.slice(-1)[0].msg);
    assert(msg.includes(`${planeMatch.plane}</b> is ${planeMatch.phase} <span`) || msg.includes(`${planeMatch.plane}</b> is ${planeMatch.phase} (`));
    assert(msg.includes("Day "));

    let planePreview: any = null;
    for (let serial = planeStart; serial <= planeStart + 336 && !planePreview; serial++) {
      for (const plane of _getAllPlaneData()) {
        if (plane.type === "fixed") continue;
        const ps = getPlanarState(plane.name, serial);
        if (ps && ps.phase === "neutral" && ps.nextPhase && (ps.nextPhase === "coterminous" || ps.nextPhase === "remote") && ps.daysUntilNextPhase != null && ps.daysUntilNextPhase > 0 && ps.daysUntilNextPhase <= 2) {
          planePreview = {
            serial,
            plane: plane.name,
            phase: ps.nextPhase === "coterminous" ? "Coterminous" : "Remote",
            days: ps.daysUntilNextPhase
          };
          break;
        }
      }
    }
    assert(planePreview, "expected an upcoming planar transition within 2 days");

    setSerial(planePreview.serial);
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    msg = String((globalThis as any)._chatLog.slice(-1)[0].msg);
    assert(msg.includes(`${planePreview.plane}</b> ${planePreview.phase} ${planePreview.days === 1 ? "tomorrow" : "in 2 days"}`));
  });

  it("uses the formal dashboard header and avoids bogus neutral-span day counts", () => {
    freshInstall();
    const ws = getWeatherState();
    ws.location = { name: "Temperate / River Valley / Swamp", climate: "temperate", geography: "river_valley", terrain: "swamp", sig: "temperate/river_valley/swamp" } as any;

    setDate(9, 18, 998);
    _showDefaultCalView({ who: "GM (GM)", playerid: "GM" } as any);
    const msg = String((globalThis as any)._chatLog.slice(-1)[0].msg);

    assert(msg.includes("Wir, 18th of Rhaan, 998 YK"));
    assert(msg.includes("Early autumn"));
    assert(/font-style:italic[^"]*">Early autumn<\/div>/.test(msg));
    assert(!msg.includes("— Early autumn"));
    assert(msg.includes("📅 No calendar events today."));
    assert(!msg.includes("Day 72 of 161"));
  });
});

function todayLikeStart() {
  return toSerial(998, 0, 1);
}
