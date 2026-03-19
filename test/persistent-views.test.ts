import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals, notStrictEqual as assertNotEquals } from "node:assert/strict";
import { completeSetup, freshInstall } from "./helpers.js";
import { stepDays } from "../src/ui.js";
import { handleMoonCommand } from "../src/moon.js";
import { bindMoonPageByName, getPersistentViewsState, refreshAllPersistentViews, refreshMoonPage, showMoonPage } from "../src/persistent-views.js";

function gmUser() {
  return { who: "GM (GM)", playerid: "GM" } as any;
}

function makeMoonPage(name = "Moon Phase") {
  return (globalThis as any).createObj("page", {
    name,
    width: 25,
    height: 25
  });
}

function findHandoutByName(name: string) {
  const all = ((globalThis as any).findObjs({ _type: "handout" }) || []) as any[];
  return all.find((obj) => String(obj.get("name") || "") === name) || null;
}

function moonOwnedObjects(pageId: string) {
  const all = Object.values((globalThis as any)._roll20Objects || {}) as any[];
  return all.filter((entry: any) =>
    String(entry?.bag?._pageid || entry?.bag?.pageid || "") === String(pageId || "") &&
    String(entry?.bag?.name || "").startsWith("[Calendar Moon Page]")
  );
}

describe("Persistent player surfaces", () => {
  it("binds and refreshes a named Moon Phase page without deleting unrelated objects", () => {
    freshInstall();
    completeSetup();

    const page = makeMoonPage();
    const unrelated = (globalThis as any).createObj("text", {
      pageid: page.id,
      layer: "map",
      left: 140,
      top: 140,
      text: "Keep me",
      font_size: 16,
      name: "Unrelated label"
    });

    const bindRes = bindMoonPageByName("Moon Phase");
    assertEquals(bindRes.ok, true);

    const first = refreshMoonPage({ autoBind: true });
    assertEquals(first.ok, true);
    assert(moonOwnedObjects(page.id).length > 0);
    assert((globalThis as any).getObj("text", unrelated.id), "unrelated page object should remain after refresh");

    const firstOwnedIds = getPersistentViewsState().moonPage.ownedObjectIds.slice();
    const second = refreshMoonPage({ autoBind: true });
    assertEquals(second.ok, true);
    assert(moonOwnedObjects(page.id).length > 0);
    assert((globalThis as any).getObj("text", unrelated.id), "unrelated page object should remain after redraw");
    assertNotEquals(getPersistentViewsState().moonPage.ownedObjectIds[0], firstOwnedIds[0]);
  });

  it("show command moves players to the bound Moon Phase page explicitly", () => {
    freshInstall();
    completeSetup();

    const page = makeMoonPage("Moon Phase");
    bindMoonPageByName("Moon Phase");

    const res = showMoonPage();
    assertEquals(res.ok, true);
    assertEquals((globalThis as any).Campaign().get("playerpageid"), page.id);
  });

  it("creates the structured handout hierarchy, and date changes update the unified lunar handout", () => {
    freshInstall();
    completeSetup();

    makeMoonPage("Moon Phase");
    bindMoonPageByName("Moon Phase");
    refreshAllPersistentViews({ autoBind: true });

    const eventsHandout = findHandoutByName("Calendar - Events");
    const eventsMechanics = findHandoutByName("Calendar - Events - Mechanics");
    const moonsHandout = findHandoutByName("Calendar - Lunar - 0 Unified");
    const moonsMechanics = findHandoutByName("Calendar - Lunar - Mechanics");
    const zarantyrHandout = findHandoutByName("Calendar - Lunar - Zarantyr");
    const weatherHandout = findHandoutByName("Calendar - Weather");
    const weatherMechanics = findHandoutByName("Calendar - Weather - Mechanics");
    const planesHandout = findHandoutByName("Calendar - Planar - 0 Unified");
    const planesMechanics = findHandoutByName("Calendar - Planar - Mechanics");
    const daanviHandout = findHandoutByName("Calendar - Planar - Daanvi");

    assert(eventsHandout);
    assert(eventsMechanics);
    assert(moonsHandout);
    assert(moonsMechanics);
    assert(zarantyrHandout);
    assert(weatherHandout);
    assert(weatherMechanics);
    assert(planesHandout);
    assert(planesMechanics);
    assert(daanviHandout);

    const beforeNotes = String(moonsHandout.get("notes") || "");
    const beforeStamp = String(getPersistentViewsState().moonPage.renderStamp || "");

    stepDays(1, { announce: false });

    const afterNotes = String(moonsHandout.get("notes") || "");
    const afterStamp = String(getPersistentViewsState().moonPage.renderStamp || "");
    assertNotEquals(afterNotes, beforeNotes);
    assertNotEquals(afterStamp, beforeStamp);
  });

  it("migrates legacy moon and plane handout names to the new unified names", () => {
    freshInstall();
    completeSetup();

    const legacyMoon = (globalThis as any).createObj("handout", {
      name: "Calendar - Moons",
      inplayerjournals: "all",
      archived: false
    });
    const legacyPlane = (globalThis as any).createObj("handout", {
      name: "Calendar - Planes",
      inplayerjournals: "all",
      archived: false
    });

    refreshAllPersistentViews({ autoBind: true });

    const renamedMoon = findHandoutByName("Calendar - Lunar - 0 Unified");
    const renamedPlane = findHandoutByName("Calendar - Planar - 0 Unified");
    assert(renamedMoon);
    assert(renamedPlane);
    assertEquals(renamedMoon.id, legacyMoon.id);
    assertEquals(renamedPlane.id, legacyPlane.id);
  });

  it("moon state changes redraw the Moon Phase page and refresh the unified lunar handout", () => {
    freshInstall();
    completeSetup();

    makeMoonPage("Moon Phase");
    bindMoonPageByName("Moon Phase");
    refreshAllPersistentViews({ autoBind: true });

    const moonsHandout = findHandoutByName("Calendar - Lunar - 0 Unified");
    const beforeNotes = String(moonsHandout.get("notes") || "");
    const beforeStamp = String(getPersistentViewsState().moonPage.renderStamp || "");

    handleMoonCommand(gmUser(), ["moon", "manage", "reseed"]);

    const afterNotes = String(moonsHandout.get("notes") || "");
    const afterStamp = String(getPersistentViewsState().moonPage.renderStamp || "");
    assertNotEquals(afterStamp, beforeStamp);
    assertNotEquals(afterNotes, beforeNotes);
  });
});
