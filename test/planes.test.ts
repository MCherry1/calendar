import { describe, it } from "node:test";
import { strictEqual as assertEquals, ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { todaySerial } from "../src/date-math.js";
import { _nextGeneratedForecast } from "../src/moon.js";
import { _getAllPlaneData, _planesMiniCalEvents, getPlanarState, getPlanesState, handlePlanesCommand } from "../src/planes.js";

function gmArgs(content: string[]) {
  return { who: "GM (GM)", playerid: "GM" } as any;
}

describe("Planes regressions", () => {
  it("only applies overrides from setOn forward and keeps future queries from deleting live overrides", () => {
    freshInstall();
    const today = todaySerial();
    const ps = getPlanesState();
    ps.overrides.Fernia = { phase: "remote", setOn: today, durationDays: 3, note: "GM override" };

    const before = getPlanarState("Fernia", today - 1);
    const during = getPlanarState("Fernia", today + 1);
    const after = getPlanarState("Fernia", today + 10);

    assert(before && !before.overridden, "historical view should stay canonical before setOn");
    assert(during && during.overridden, "override should apply inside the active window");
    assert(after && !after.overridden, "future view outside the window should be canonical");
    assert(ps.overrides.Fernia, "querying outside the window should not delete a still-live override");
  });

  it("cleans up overrides only when they are truly expired relative to today", () => {
    freshInstall();
    const today = todaySerial();
    const ps = getPlanesState();
    ps.overrides.Fernia = { phase: "remote", setOn: today - 10, durationDays: 3, note: "GM override" };
    const result = getPlanarState("Fernia", today);
    assert(result && !result.overridden, "expired overrides should fall back to canonical state");
    assertEquals(ps.overrides.Fernia, undefined);
  });

  it("clips generated minical overlays to the requested generated cutoff", () => {
    freshInstall();
    const today = todaySerial();
    const plane = _getAllPlaneData().find((entry: any) => _nextGeneratedForecast(entry.name, today, 400));
    assert(plane, "expected at least one plane with a generated forecast in range");
    const forecast = _nextGeneratedForecast(plane.name, today, 400);
    assert(forecast, "expected a generated forecast");

    const withGenerated = _planesMiniCalEvents(today, forecast.endSerial + 2, forecast.endSerial + 2);
    const clipped = _planesMiniCalEvents(today, forecast.endSerial + 2, forecast.startSerial - 1);
    const generatedWith = withGenerated.filter((evt: any) => String(evt.name).includes("Generated"));
    const generatedClipped = clipped.filter((evt: any) => String(evt.name).includes("Generated"));

    assert(generatedWith.some((evt: any) => evt.serial >= forecast.startSerial), "expected generated overlays when cutoff reaches the event");
    assert(generatedClipped.every((evt: any) => evt.serial < forecast.startSerial), "generated overlays should stop at the cutoff");
  });

  it("sends a non-interactive public summary and keeps the interactive panel for the GM", () => {
    freshInstall();
    handlePlanesCommand(gmArgs([]), ["planes", "send", "medium", "3d"]);
    const log = (globalThis as any)._chatLog;
    const publicMsg = log.find((entry: any) => String(entry.msg).startsWith("/direct "));
    const gmWhisper = log.reverse().find((entry: any) => String(entry.msg).includes("Planar Movement"));
    assert(publicMsg, "expected a public broadcast");
    assert(!publicMsg.msg.includes("](!cal "), "public broadcast should not contain command-button markup");
    assert(gmWhisper && gmWhisper.msg.includes("](!cal "), "GM follow-up should keep the interactive panel");
  });
});
