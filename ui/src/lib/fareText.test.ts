import { describe, expect, it } from "vitest";
import { formatFares, formatStops, parseFares, parseStops } from "./fareText";

describe("parseFares", () => {
  it("reads one fare per line, or stage and fare as copied from a table", () => {
    expect(parseFares("30\n40\n\n52")).toEqual({ ok: true, value: [30, 40, 52] });
    expect(parseFares("1, Rs. 30\n2\t40\n3\t1052")).toEqual({ ok: true, value: [30, 40, 1052] });
  });

  it("points at the first line that's wrong", () => {
    expect(parseFares("30\nforty")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/^Line 2/),
    });
    expect(parseFares("30\n25")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/lower/),
    });
    expect(parseFares("1, 30\n3, 40")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/stage 2/),
    });
    expect(parseFares("")).toMatchObject({ ok: false });
  });

  it("round-trips", () => {
    expect(parseFares(formatFares([30, 40, 52]))).toEqual({ ok: true, value: [30, 40, 52] });
  });
});

describe("parseStops", () => {
  it("reads stage and name per line", () => {
    expect(parseStops("0, Colombo Fort\n1 - Kelaniya\n3\tKadawatha")).toEqual({
      ok: true,
      value: [
        { stage: 0, name: "Colombo Fort" },
        { stage: 1, name: "Kelaniya" },
        { stage: 3, name: "Kadawatha" },
      ],
    });
  });

  it("needs a stage on every line and two stops", () => {
    expect(parseStops("0, Fort\nKelaniya")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/^Line 2/),
    });
    expect(parseStops("0, Fort")).toMatchObject({ ok: false });
  });

  it("round-trips", () => {
    const stops = [
      { stage: 0, name: "Fort" },
      { stage: 2, name: "Kiribathgoda, Junction" },
    ];
    expect(parseStops(formatStops(stops))).toEqual({ ok: true, value: stops });
  });
});
