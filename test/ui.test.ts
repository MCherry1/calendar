import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { _showDefaultCalView } from "../src/commands.js";
import { stepDays } from "../src/ui.js";
import { sendToAll, sendUiToGM } from "../src/messaging.js";
import { helpRootMenu } from "../src/ui.js";

describe("Task-focused UI", () => {
  it("keeps the transient helper on noarchive while archived broadcasts stay archived", () => {
    freshInstall();
    sendUiToGM("<div>GM menu</div>");
    sendToAll("<div>Story-facing content</div>");
    const log = (globalThis as any)._chatLog;
    assertEquals(log[0].opts.noarchive, true);
    assertEquals(log[1].opts, null);
  });

  it("renders the root help menu through the transient noarchive path with prompt buttons", () => {
    freshInstall();
    helpRootMenu({ who: "GM (GM)", playerid: "GM" } as any);
    const msg = (globalThis as any)._chatLog.slice(-1)[0];
    assertEquals(msg.opts.noarchive, true);
    assert(msg.msg.includes("Prompt !cal set"));
    assert(msg.msg.includes("Prompt !cal add"));
    assert(msg.msg.includes("Prompt !cal addmonthly"));
    assert(msg.msg.includes("Prompt !cal addyearly"));
    assert(msg.msg.includes("Prompt !cal moon on"));
    assert(msg.msg.includes("Prompt !cal planes on"));
    assert(msg.msg.includes("Prompt !cal send"));
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
});
