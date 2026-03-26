import { describe, it } from "node:test";
import { ok as assert } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { STYLES } from "../src/constants.js";
import { _eventDotsHtml } from "../src/color.js";
import { button, tdHtmlForDay } from "../src/rendering.js";
import { renderPureMonthTable } from "../src/shared/render-month-table.js";

describe("Calendar cell rendering", () => {
  it("escapes parentheses in button commands so prompt-heavy controls stay intact", () => {
    freshInstall();

    const html = button("Add Event", "add ?{Color (hex)|#50C878}");

    assert(html.includes("&#40;hex&#41;"));
  });

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

  it("renderPureMonthTable produces table with header, weekdays, and cells", () => {
    freshInstall();
    const html = renderPureMonthTable({
      monthName: 'Zarantyr',
      yearLabel: '998 YK',
      weekdayLabels: ['Sul', 'Mol', 'Zol', 'Wir', 'Zor', 'Far', 'Sar'],
      monthColor: '#4A90D9',
      cells: [
        { kind: 'overflow', day: 27, overflowColor: '#888888' },
        { kind: 'overflow', day: 28, overflowColor: '#888888' },
        { kind: 'day', day: 1, isToday: false, isPast: false, isFuture: false, events: [], tooltip: '' },
        { kind: 'day', day: 2, isToday: false, isPast: false, isFuture: false, events: [{ color: '#FF0000' }], tooltip: 'Festival' },
        { kind: 'day', day: 3, isToday: true, isPast: false, isFuture: false, events: [], tooltip: '' },
        { kind: 'day', day: 4, isToday: false, isPast: false, isFuture: false, events: [], tooltip: '' },
        { kind: 'day', day: 5, isToday: false, isPast: false, isFuture: false, events: [], tooltip: '' }
      ]
    });
    assert(html.includes('<table'), 'should produce a table');
    assert(html.includes('Zarantyr'), 'should include month name');
    assert(html.includes('998 YK'), 'should include year label');
    assert(html.includes('Sul'), 'should include weekday headers');
    assert(html.includes('opacity:.22'), 'overflow cells should be dimmed');
    assert(html.includes('#FF0000'), 'event color should appear');
    assert(html.includes('Festival'), 'tooltip should appear');
    assert(html.includes(STYLES.today), 'today cell should have today style');
  });
});
