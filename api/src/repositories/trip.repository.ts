import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "../db/client.js";
import { tripShares, type TripShareRow } from "../db/schema.js";

// "Share my trip" (safety mode): only the latest position is stored, and it is cleared at the end.

export const createTrip = async (values: {
  id: string;
  ownerTokenHash: string;
  busNumber?: string;
  routeNumber?: string;
  expiresAt: Date;
}) => {
  const [row] = await db.insert(tripShares).values(values).returning();
  if (!row) throw new Error("Trip insert returned no row");
  return row;
};

export const findTrip = async (id: string): Promise<TripShareRow | null> => {
  const [row] = await db.select().from(tripShares).where(eq(tripShares.id, id));
  return row ?? null;
};

/** Stores the newest position of a trip that is still running. Returns false otherwise. */
export const setTripPosition = async (
  id: string,
  position: { latitude: number; longitude: number; accuracy: number | null },
  now = new Date(),
) => {
  const updated = await db
    .update(tripShares)
    .set({ ...position, positionAt: now })
    .where(and(eq(tripShares.id, id), isNull(tripShares.endedAt)))
    .returning({ id: tripShares.id, expiresAt: tripShares.expiresAt });
  return updated.some((row) => row.expiresAt > now);
};

/** Ends a trip and forgets where the passenger was. */
export const endTrip = async (id: string, now = new Date()) => {
  await db
    .update(tripShares)
    .set({ endedAt: now, latitude: null, longitude: null, accuracy: null, positionAt: null })
    .where(eq(tripShares.id, id));
};

/** Deletes trips that ended (or ran out) before `before`. */
export const deleteOldTrips = async (before: Date) => {
  await db
    .delete(tripShares)
    .where(or(lt(tripShares.endedAt, before), lt(tripShares.expiresAt, before)));
};
