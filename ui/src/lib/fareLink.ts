import type { ServiceClass } from "@/constants/reportConstants";
import type { FareSelection } from "@/types/fare";

// The fare checker hands its result to the report form through the address: the form opens on an
// overcharging complaint with the route and the fare check filled in.

const CLASSES: readonly string[] = ["normal", "semi_luxury", "luxury"];

export const fareReportHref = (selection: FareSelection, routeNumber: string) => {
  const params = new URLSearchParams({
    route: routeNumber,
    category: "overcharging",
    fareRoute: selection.routeId,
    fareFrom: String(selection.from),
    fareTo: String(selection.to),
    fareClass: selection.serviceClass,
  });
  if (selection.charged !== undefined) params.set("charged", String(selection.charged));
  return `/submit-report?${params.toString()}`;
};

const index = (value: string | null) => {
  const n = Number(value);
  return value !== null && Number.isInteger(n) && n >= 0 && n < 1000 ? n : null;
};

/** The fare check in a report form address, if there is a whole one. */
export const parseFareParams = (params: URLSearchParams): FareSelection | null => {
  const routeId = params.get("fareRoute");
  const from = index(params.get("fareFrom"));
  const to = index(params.get("fareTo"));
  const serviceClass = params.get("fareClass") ?? "normal";
  if (!routeId || !/^[0-9a-f-]{36}$/i.test(routeId) || from === null || to === null) return null;
  const charged = index(params.get("charged"));
  return {
    routeId,
    from,
    to,
    serviceClass: (CLASSES.includes(serviceClass) ? serviceClass : "normal") as ServiceClass,
    ...(charged !== null && { charged }),
  };
};
