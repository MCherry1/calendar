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

  it("creates and refreshes the four subsystem handouts, and date changes update them", () => {
    freshInstall();
    completeSetup();

    makeMoonPage("Moon Phase");
    bindMoonPageByName("Moon Phase");
    refreshAllPersistentViews({ autoBind: true });

    const eventsHandout = findHandoutByName("Calendar - Events");
    const moonsHandout = findHandoutByName("Calendar - Moons");
    const weatherHandout = findHandoutByName("Calendar - Weather");
    const planesHandout = findHandoutByName("Calendar - Planes");

    assert(eventsHandout);
    assert(moonsHandout);
    assert(weatherHandout);
    assert(planesHandout);

    const beforeNotes = String(moonsHandout.get("notes") || "");
    const beforeStamp = String(getPersistentViewsState().moonPage.renderStamp || "");

    stepDays(1, { announce: false });

    const afterNotes = String(moonsHandout.get("notes") || "");
    const afterStamp = String(getPersistentViewsState().moonPage.renderStamp || "");
    assertNotEquals(afterNotes, beforeNotes);
    assertNotEquals(afterStamp, beforeStamp);
  });

  it("moon state changes redraw the Moon Phase page and refresh the moon handout", () => {
    freshInstall();
    completeSetup();

    makeMoonPage("Moon Phase");
    bindMoonPageByName("Moon Phase");
    refreshAllPersistentViews({ autoBind: true });

    const moonsHandout = findHandoutByName("Calendar - Moons");
    const beforeNotes = String(moonsHandout.get("notes") || "");
    const beforeStamp = String(getPersistentViewsState().moonPage.renderStamp || "");

    handleMoonCommand(gmUser(), ["moon", "manage", "reseed"]);

    const afterNotes = String(moonsHandout.get("notes") || "");
    const afterStamp = String(getPersistentViewsState().moonPage.renderStamp || "");
    assertNotEquals(afterStamp, beforeStamp);
    assertNotEquals(afterNotes, beforeNotes);
  });
});
