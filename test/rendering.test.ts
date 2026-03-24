import { describe, it } from "node:test";
import { ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { STYLES } from "../src/constants.js";
import { _eventDotsHtml } from "../src/color.js";
import { tdHtmlForDay } from "../src/rendering.js";

describe("Calendar cell rendering", () => {
  it("renders event dots in normal flow without absolute positioning", () => {
    freshInstall();

    const html = _eventDotsHtml([
      { name: "Primary", color: "#111111" } as any,
      { name: "Secondary", color: "#22AA22" } as any,
      { name: "Tertiary", color: "#3333CC" } as any
    ]);

    assert(html.includes("#22AA22"));
    assert(html.includes("#3333CC"));
    assert(!html.includes("#111111"));
    assert(!html.includes("position:absolute"));
  });

  it("renders no-dot cells with an empty top and bottom band", () => {
    freshInstall();

    const html = tdHtmlForDay({
      d: 14,
      events: [],
      isToday: false,
      isPast: false,
      isFuture: false,
      title: ""
    } as any, "#CCCCCC", STYLES.calTd, "");

    assert((html.match(/height:\.6em;min-height:\.6em;/g) || []).length === 2);
    assert(html.includes("padding:0;align-items:stretch;justify-content:flex-start;"));
    assert(html.includes("flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;"));
  });

  it("renders multi-event cells with dots in the reserved lower band", () => {
    freshInstall();

    const html = tdHtmlForDay({
      d: 9,
      events: [
        { name: "Primary", color: "#AA0000" },
        { name: "Secondary", color: "#00AA00" },
        { name: "Tertiary", color: "#0000AA" }
      ],
      isToday: false,
      isPast: false,
      isFuture: false,
      title: ""
    } as any, "#CCCCCC", STYLES.calTd, "");

    assert(html.includes("#00AA00"));
    assert(html.includes("#0000AA"));
    assert(!html.includes("position:absolute"));
    assert(html.indexOf(">9</div>") < html.indexOf("#00AA00"));
  });

  it("keeps dot-only cells rendering all dots in the lower band", () => {
    freshInstall();

    const html = tdHtmlForDay({
      d: 1,
      events: [
        { name: "Dot A", color: "#AA0000", dotOnly: true },
        { name: "Dot B", color: "#00AA00" }
      ],
      isToday: false,
      isPast: false,
      isFuture: false,
      title: ""
    } as any, "#CCCCCC", STYLES.calTd, "");

    assert(html.includes("#AA0000"));
    assert(html.includes("#00AA00"));
  });
});
