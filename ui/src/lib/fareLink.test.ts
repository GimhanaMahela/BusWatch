import { describe, expect, it } from "vitest";
import { fareReportHref, parseFareParams } from "./fareLink";

const ROUTE = "0b8f1f3e-7a0c-4b9a-9d55-1c2e3f4a5b6c";

describe("fare links", () => {
  it("round-trips a fare check through the report form address", () => {
    const href = fareReportHref(
      { routeId: ROUTE, from: 0, to: 3, serviceClass: "luxury", charged: 120 },
      "01",
    );
    const params = new URL(href, "https://buswatch.lk").searchParams;
    expect(params.get("category")).toBe("overcharging");
    expect(params.get("route")).toBe("01");
    expect(parseFareParams(params)).toEqual({
      routeId: ROUTE,
      from: 0,
      to: 3,
      serviceClass: "luxury",
      charged: 120,
    });
  });

  it("ignores missing or odd values", () => {
    expect(parseFareParams(new URLSearchParams("fareRoute=x&fareFrom=0&fareTo=1"))).toBeNull();
    expect(
      parseFareParams(new URLSearchParams(`fareRoute=${ROUTE}&fareFrom=-1&fareTo=1`)),
    ).toBeNull();
    expect(
      parseFareParams(new URLSearchParams(`fareRoute=${ROUTE}&fareFrom=1&fareTo=2&fareClass=gold`)),
    ).toEqual({ routeId: ROUTE, from: 1, to: 2, serviceClass: "normal" });
  });
});
