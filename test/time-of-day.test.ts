import { describe, it } from "node:test";
import { ok as assert, strictEqual as assertEquals } from "node:assert/strict";
import { freshInstall } from "./helpers.js";
import { ensureSettings, getCal } from "../src/state.js";
import { toSerial } from "../src/date-math.js";
import { setDate, stepDays } from "../src/ui.js";
import { commands } from "../src/today.js";
import {
  activateTimeOfDay,
  bucketMidpointTimeFrac,
  clearTimeOfDay,
  currentTimeBucket,
  daylightStatusForSerial,
  effectiveTimeBucket,
  isBucketDaylit,
  isTimeOfDayActive,
  nextTimeBucket,
  solarSeasonIndex,
} from "../src/time-of-day.js";

describe("Time of Day", () => {
  it("defaults to inactive with nighttime fallback", () => {
    freshInstall();
    assert(!isTimeOfDayActive());
    assertEquals(currentTimeBucket(), null);
    assertEquals(effectiveTimeBucket(), "nighttime");
  });

  it("activates a chosen bucket", () => {
    freshInstall();
    activateTimeOfDay("afternoon");
    assert(isTimeOfDayActive());
    assertEquals(currentTimeBucket(), "afternoon");
  });

  it("clears on normal date advance", () => {
    freshInstall();
    activateTimeOfDay("morning");
    stepDays(1, { announce:false });
    assert(!isTimeOfDayActive());
    assertEquals(currentTimeBucket(), null);
  });

  it("clears on explicit date set", () => {
    freshInstall();
    activateTimeOfDay("evening");
    setDate(2, 10, 998, { announce:false });
    assert(!isTimeOfDayActive());
  });

  it("nextTimeBucket walks the six-bucket loop", () => {
    freshInstall();
    assertEquals(nextTimeBucket("middle_of_night"), "early_morning");
    assertEquals(nextTimeBucket("early_morning"), "morning");
    assertEquals(nextTimeBucket("morning"), "afternoon");
    assertEquals(nextTimeBucket("afternoon"), "evening");
    assertEquals(nextTimeBucket("evening"), "nighttime");
    assertEquals(nextTimeBucket("nighttime"), "middle_of_night");
  });

  it("maps bucket midpoints to the correct time fractions", () => {
    freshInstall();
    assertEquals(bucketMidpointTimeFrac("middle_of_night"), 2 / 24);
    assertEquals(bucketMidpointTimeFrac("nighttime"), 22 / 24);
  });

  it("supports the nighttime rollover pattern", () => {
    freshInstall();
    const cur = getCal().current;
    const before = toSerial(cur.year, cur.month, cur.day_of_the_month);
    activateTimeOfDay("nighttime");
    stepDays(1, { preserveTimeOfDay:true, announce:false });
    activateTimeOfDay("middle_of_night");
    const afterCur = getCal().current;
    const after = toSerial(afterCur.year, afterCur.month, afterCur.day_of_the_month);
    assertEquals(after, before + 1);
    assertEquals(currentTimeBucket(), "middle_of_night");
  });

  it("solarSeasonIndex respects hemisphere", () => {
    freshInstall();
    const st = ensureSettings();
    st.hemisphere = "north";
    assertEquals(solarSeasonIndex(0), 0);
    st.hemisphere = "south";
    assertEquals(solarSeasonIndex(0), 6);
  });

  it("daylight is season-sensitive in shoulder buckets", () => {
    freshInstall();
    const st = ensureSettings();
    st.hemisphere = "north";
    assert(!isBucketDaylit(0, "early_morning"));
    assert(!isBucketDaylit(0, "evening"));
    assert(isBucketDaylit(6, "evening"));
    assert(isBucketDaylit(6, "morning"));
  });

  it("daylightStatusForSerial reports the active solar profile", () => {
    freshInstall();
    const cur = getCal().current;
    const serial = toSerial(cur.year, cur.month, cur.day_of_the_month);
    activateTimeOfDay("nighttime");
    const status = daylightStatusForSerial(serial);
    assertEquals(status.bucket, "nighttime");
    assert(status.solar && typeof status.solar.sunrise === "number");
    assertEquals(status.daylit, false);
  });

  it("clearTimeOfDay resets state", () => {
    freshInstall();
    activateTimeOfDay("early_morning");
    clearTimeOfDay();
    assert(!isTimeOfDayActive());
    assertEquals(currentTimeBucket(), null);
  });

  it("time next whisper keeps follow-up controls", () => {
    freshInstall();
    activateTimeOfDay("morning");
    (commands.time as any).run({ who: "GM (GM)", playerid: "GM" }, ["!cal", "time", "next"]);
    const log = (globalThis as any)._chatLog;
    const last = log[log.length - 1];
    assert(last && typeof last.msg === "string");
    assert(last.msg.includes("!cal time next"));
    assert(last.msg.includes("!cal show"));
    assert(last.msg.includes("!cal send"));
  });
});
