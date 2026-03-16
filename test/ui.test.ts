import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { _showDefaultCalView } from "../src/commands.js";
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
    assert(msg.msg.includes("Retreat"));
    assert(msg.msg.includes("Advance"));
    assert(msg.msg.includes("Send To Players"));
    assert(msg.msg.includes("Weather"));
    assert(msg.msg.includes("Moons"));
    assert(msg.msg.includes("Planes"));
    assert(msg.msg.includes("Admin"));
  });
});
