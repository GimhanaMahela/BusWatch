import { describe, expect, it } from "vitest";
import { normalisePhone } from "./phone";

describe("normalisePhone", () => {
  it("accepts Sri Lankan mobiles however they are typed", () => {
    for (const input of [
      "0771234567",
      "771234567",
      "94771234567",
      "+94 77 123 4567",
      "077-123-4567",
    ]) {
      expect(normalisePhone(input)).toBe("+94771234567");
    }
  });

  it("accepts international numbers written with +", () => {
    expect(normalisePhone("+44 7700 900123")).toBe("+447700900123");
  });

  it("rejects landlines and junk", () => {
    expect(normalisePhone("0112345678")).toBeNull();
    expect(normalisePhone("+94112345678")).toBeNull();
    expect(normalisePhone("call me")).toBeNull();
    expect(normalisePhone("")).toBeNull();
  });
});
