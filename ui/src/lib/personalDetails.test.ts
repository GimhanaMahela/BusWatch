import { describe, expect, it } from "vitest";
import { findPersonalDetails } from "./personalDetails";

describe("findPersonalDetails", () => {
  it("passes an anonymised story", () => {
    expect(
      findPersonalDetails("Route 08 overcharging", "The operator refunded passengers in May."),
    ).toEqual([]);
  });

  it.each([
    ["Report BW-2026-ABC234 was resolved", "a receipt ID"],
    ["Contact kamal@example.com", "an email address"],
    ["Call 077 123 4567", "a phone number"],
    ["Call +94 77 123 4567", "a phone number"],
    ["The bus left at 7:45 am", "an exact time"],
    ["NIC 199012345678", "a national ID number"],
  ])("flags %s", (text, kind) => {
    expect(findPersonalDetails(text)).toContain(kind);
  });
});
