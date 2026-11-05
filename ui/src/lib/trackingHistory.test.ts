import { describe, expect, it } from "vitest";
import { recentReceipts, recordTrackingVisit, rememberReceipt } from "./trackingHistory";

const HOUR = 60 * 60 * 1000;

describe("tracking history", () => {
  it("tells first visits, reloads and return visits apart", () => {
    const start = Date.parse("2026-11-05T08:00:00Z");
    expect(recordTrackingVisit("bw-2026-abcdef", start)).toEqual({
      counted: true,
      returning: false,
    });
    // A reload a few minutes later is the same visit
    expect(recordTrackingVisit("BW-2026-ABCDEF", start + 5 * 60 * 1000)).toEqual({
      counted: false,
      returning: false,
    });
    // Coming back the next day is a return visit
    expect(recordTrackingVisit("BW-2026-ABCDEF", start + 24 * HOUR)).toEqual({
      counted: true,
      returning: true,
    });
  });

  it("treats the first look after submitting on this device as a return", () => {
    const submitted = Date.parse("2026-11-05T08:00:00Z");
    rememberReceipt("BW-2026-QQQQQQ", submitted);
    expect(recordTrackingVisit("BW-2026-QQQQQQ", submitted + 3 * HOUR).returning).toBe(true);
  });

  it("lists receipts newest first, without duplicates", () => {
    rememberReceipt("BW-2026-AAAAAA", 1);
    rememberReceipt("BW-2026-BBBBBB", 2);
    rememberReceipt("bw-2026-aaaaaa", 3);
    expect(recentReceipts()).toEqual(["BW-2026-AAAAAA", "BW-2026-BBBBBB"]);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("buswatch:receipts", "{not json");
    expect(recentReceipts()).toEqual([]);
    rememberReceipt("BW-2026-CCCCCC");
    expect(recentReceipts()).toEqual(["BW-2026-CCCCCC"]);
  });
});
