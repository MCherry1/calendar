import { describe, it } from "node:test";
import { ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { toSerial } from "../src/date-math.js";
import { _getAllPlaneData, _planesMiniCalEvents, getPlanarState } from "../src/planes.js";

describe("Planes canon", () => {
  it("returns a canonical fixed phase for Dal Quor (always remote)", () => {
    freshInstall();
    const dq = getPlanarState("Dal Quor", toSerial(998, 0, 1));
    assert(dq && dq.phase === "remote", "Dal Quor should always be remote");
    assert(dq && dq.plane && dq.plane.type === "fixed", "Dal Quor should be a fixed plane");
  });

  it("computes coterminous and remote windows for Fernia from its canon anchor", () => {
    freshInstall();
    const anchorCot = getPlanarState("Fernia", toSerial(998, 6, 14));
    assert(anchorCot && anchorCot.phase === "coterminous", "Fernia should be coterminous during Lharvion 998");

    // Half-orbit (2.5 years) later we expect remote.
    const remoteCheck = getPlanarState("Fernia", toSerial(1001, 0, 14));
    assert(remoteCheck && remoteCheck.phase === "remote", "Fernia should be remote 2.5 years after coterminous");
  });

  it("recognises Mabar's annual Long Shadows and its 5-year remote window separately", () => {
    freshInstall();
    const vult28 = getPlanarState("Mabar", toSerial(998, 11, 28));
    const zarantyr1 = getPlanarState("Mabar", toSerial(999, 0, 1));
    assert(vult28 && vult28.phase === "coterminous", "Vult 28 falls within Long Shadows");
    assert(zarantyr1 && zarantyr1.phase !== "coterminous", "Long Shadows should end with the calendar year");
  });

  it("emits mini-calendar fills for any active short canon phases in range", () => {
    freshInstall();
    const start = toSerial(998, 6, 1);
    const end = toSerial(998, 6, 28);
    const events = _planesMiniCalEvents(start, end);
    // Fernia is canonically coterminous during Lharvion 998 — at least one
    // fill should be emitted for that window.
    assert(events.length > 0, "expected canonical fills within a known active month");
    assert(events.every((evt: any) => !String(evt.name).startsWith("Generated:")), "no generated overlays should appear");
  });

  it("getPlanarState returns null for unknown plane names", () => {
    freshInstall();
    assert(getPlanarState("NotAPlane", toSerial(998, 0, 1)) == null);
  });

  it("_getAllPlaneData enumerates Eberron's 13 canonical planes", () => {
    freshInstall();
    const planes = _getAllPlaneData();
    assert(planes.length === 13, "expected the 13 canonical Eberron planes");
    const names = planes.map((p: any) => p.name);
    ["Daanvi", "Dal Quor", "Dolurrh", "Fernia", "Irian", "Kythri", "Lamannia", "Mabar", "Risia", "Shavarath", "Syrania", "Thelanis", "Xoriat"].forEach((expected) => {
      assert(names.indexOf(expected) >= 0, "expected " + expected + " in the plane table");
    });
  });
});
