import { asc, eq, sql } from "drizzle-orm";
import type { ServiceClass } from "../config/constants.js";
import { db } from "../db/client.js";
import { fareRoutes, fareTables, type FareStop } from "../db/schema.js";

// Fare checker: the NTC fare-stage tables and each route's halts, kept by admins.

/** Route numbers are free text: match them trimmed and case-blind, like the scorecards. */
export const routeKeyOf = (routeNumber: string) => routeNumber.trim().toLowerCase();

export const listFareTables = () =>
  db.select().from(fareTables).orderBy(asc(fareTables.serviceClass));

export const findFareTable = async (serviceClass: ServiceClass) => {
  const [row] = await db.select().from(fareTables).where(eq(fareTables.serviceClass, serviceClass));
  return row ?? null;
};

export const saveFareTable = async (values: {
  serviceClass: ServiceClass;
  fares: number[];
  effectiveFrom: string | null;
  updatedBy: string | null;
}) => {
  const [row] = await db
    .insert(fareTables)
    .values(values)
    .onConflictDoUpdate({
      target: fareTables.serviceClass,
      set: {
        fares: values.fares,
        effectiveFrom: values.effectiveFrom,
        updatedBy: values.updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
};

/** Every route, without its stops (the list is shown before a route is chosen). */
export const listFareRoutes = () =>
  db
    .select({
      id: fareRoutes.id,
      routeNumber: fareRoutes.routeNumber,
      name: fareRoutes.name,
      serviceClasses: fareRoutes.serviceClasses,
      stopCount: sql<number>`jsonb_array_length(${fareRoutes.stops})::int`,
      updatedAt: fareRoutes.updatedAt,
    })
    .from(fareRoutes)
    .orderBy(asc(fareRoutes.routeKey));

export const findFareRoute = async (id: string) => {
  const [row] = await db.select().from(fareRoutes).where(eq(fareRoutes.id, id));
  return row ?? null;
};

export const findFareRouteByNumber = async (routeNumber: string) => {
  const [row] = await db
    .select()
    .from(fareRoutes)
    .where(eq(fareRoutes.routeKey, routeKeyOf(routeNumber)));
  return row ?? null;
};

export interface FareRouteValues {
  routeNumber: string;
  name: string;
  serviceClasses: ServiceClass[];
  stops: FareStop[];
  updatedBy: string | null;
}

/** Returns null when another route already has this number. */
export const createFareRoute = async (values: FareRouteValues) => {
  const [row] = await db
    .insert(fareRoutes)
    .values({ ...values, routeKey: routeKeyOf(values.routeNumber) })
    .onConflictDoNothing({ target: fareRoutes.routeKey })
    .returning();
  return row ?? null;
};

/** Returns "missing" when there is no such route, "duplicate" when the number is taken. */
export const updateFareRoute = async (id: string, values: FareRouteValues) => {
  const routeKey = routeKeyOf(values.routeNumber);
  const clash = await findFareRouteByNumber(values.routeNumber);
  if (clash && clash.id !== id) return "duplicate" as const;
  const [row] = await db
    .update(fareRoutes)
    .set({ ...values, routeKey, updatedAt: new Date() })
    .where(eq(fareRoutes.id, id))
    .returning();
  return row ?? ("missing" as const);
};

export const deleteFareRoute = async (id: string) =>
  (await db.delete(fareRoutes).where(eq(fareRoutes.id, id)).returning({ id: fareRoutes.id }))
    .length > 0;
