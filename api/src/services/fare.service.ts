import type { ServiceClass } from "../config/constants.js";
import type { FareEvidence, FareRouteRow } from "../db/schema.js";
import { findFareRoute, findFareTable } from "../repositories/fare.repository.js";

// The fare checker's sum. NTC fares go by fare stages: every halt on a route belongs to a stage, and
// the fare is the fare table's amount for the number of stages travelled. A journey inside one stage
// costs the minimum (one-stage) fare.

/** Something the passenger chose doesn't match the fare data (shown to them as is). */
export class FareError extends Error {}

export const stagesBetween = (from: number, to: number) => Math.max(Math.abs(to - from), 1);

export interface FareSelection {
  routeId: string;
  from: number;
  to: number;
  serviceClass: ServiceClass;
  charged?: number;
}

const stopAt = (route: FareRouteRow, index: number) => {
  const stop = route.stops[index];
  if (!stop) throw new FareError("That stop is no longer on this route. Choose it again.");
  return stop;
};

/** Works out the official fare from the admins' tables. Throws FareError when it can't. */
export const officialFare = async (selection: FareSelection): Promise<FareEvidence> => {
  const route = await findFareRoute(selection.routeId);
  if (!route) throw new FareError("We don't have fares for this route any more.");
  if (selection.from === selection.to) throw new FareError("Choose two different stops.");
  if (!route.serviceClasses.includes(selection.serviceClass)) {
    throw new FareError("This route has no buses of that class.");
  }
  const from = stopAt(route, selection.from);
  const to = stopAt(route, selection.to);

  const table = await findFareTable(selection.serviceClass);
  if (!table?.fares.length) throw new FareError("Fares for this class haven't been added yet.");
  const stages = stagesBetween(from.stage, to.stage);
  const fare = table.fares[stages - 1];
  if (fare === undefined) {
    throw new FareError("This journey is longer than our fare table. Please check it at the NTC.");
  }

  return {
    routeNumber: route.routeNumber,
    routeName: route.name,
    from: from.name,
    to: to.name,
    stages,
    serviceClass: selection.serviceClass,
    officialFare: fare,
    chargedFare: selection.charged ?? null,
    effectiveFrom: table.effectiveFrom,
  };
};
