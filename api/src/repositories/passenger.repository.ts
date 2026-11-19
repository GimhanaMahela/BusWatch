import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { PASSENGER_CODE, type ContactChannel } from "../config/constants.js";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { passengerCodes, reportMessages, reports, reportStatusChanges } from "../db/schema.js";
import { outerReportId } from "./report.repository.js";

/** A passenger's verified contact: the key to their reports in "My reports". */
export interface PassengerContact {
  channel: ContactChannel;
  destination: string; // lower-case email or E.164 phone
}

// Codes are stored as keyed hashes, so a database leak does not reveal live codes
const hashCode = (destination: string, code: string) =>
  createHmac("sha256", env.JWT_SECRET).update(`${destination}:${code}`).digest("hex");

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

const contactCondition = ({ channel, destination }: PassengerContact) =>
  channel === "email"
    ? eq(reports.passengerEmail, destination)
    : eq(reports.passengerPhone, destination);

export const hasReportsForContact = async (contact: PassengerContact) =>
  (await db.$count(reports, contactCondition(contact))) > 0;

/**
 * Issues a new sign-in code and retires older ones. Returns null when this contact has already
 * been sent the maximum number of codes recently (each SMS costs money; it also slows guessing).
 */
export const issueSignInCode = async ({ channel, destination }: PassengerContact) => {
  const recent = await db.$count(
    passengerCodes,
    and(
      eq(passengerCodes.destination, destination),
      gte(passengerCodes.createdAt, minutesAgo(PASSENGER_CODE.windowMinutes)),
    ),
  );
  if (recent >= PASSENGER_CODE.maxPerWindow) return null;

  const code = String(randomInt(0, 10 ** PASSENGER_CODE.digits)).padStart(
    PASSENGER_CODE.digits,
    "0",
  );
  await db.transaction(async (tx) => {
    await tx
      .update(passengerCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(passengerCodes.destination, destination), isNull(passengerCodes.usedAt)));
    await tx.insert(passengerCodes).values({
      channel,
      destination,
      codeHash: hashCode(destination, code),
      expiresAt: new Date(Date.now() + PASSENGER_CODE.ttlMinutes * 60 * 1000),
    });
  });
  return code;
};

/** Checks a code. Each code works once, expires, and stops working after too many wrong tries. */
export const verifySignInCode = async (destination: string, code: string) =>
  db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(passengerCodes)
      .where(
        and(
          eq(passengerCodes.destination, destination),
          isNull(passengerCodes.usedAt),
          gt(passengerCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(passengerCodes.createdAt))
      .limit(1)
      .for("update");
    if (!current || current.attempts >= PASSENGER_CODE.maxAttempts) return false;

    const expected = Buffer.from(current.codeHash, "hex");
    const given = Buffer.from(hashCode(destination, code), "hex");
    if (!timingSafeEqual(expected, given)) {
      await tx
        .update(passengerCodes)
        .set({ attempts: sql`${passengerCodes.attempts} + 1` })
        .where(eq(passengerCodes.id, current.id));
      return false;
    }
    await tx
      .update(passengerCodes)
      .set({ usedAt: new Date() })
      .where(eq(passengerCodes.id, current.id));
    return true;
  });

/** Old codes are useless after they expire; keep the table small. */
export const deleteExpiredCodes = async () => {
  await db
    .delete(passengerCodes)
    .where(sql`${passengerCodes.expiresAt} < now() - interval '1 day'`);
};

/** Every report sent with this email or phone, newest first, with what the passenger hasn't read. */
export const listReportsForContact = (contact: PassengerContact) =>
  db
    .select({
      receiptId: reports.receiptId,
      type: reports.type,
      status: reports.status,
      category: reports.category,
      busNumber: reports.busNumber,
      routeNumber: reports.routeNumber,
      reportedAt: reports.reportedAt,
      resolvedAt: reports.resolvedAt,
      lastUpdateAt: sql<Date>`greatest(
        ${reports.reportedAt},
        (SELECT max(${reportStatusChanges.changedAt}) FROM ${reportStatusChanges}
          WHERE ${reportStatusChanges.reportId} = ${outerReportId}),
        (SELECT max(${reportMessages.createdAt}) FROM ${reportMessages}
          WHERE ${reportMessages.reportId} = ${outerReportId})
      )`.mapWith(reports.reportedAt),
      unreadMessages: sql<number>`(
        SELECT count(*)::int FROM ${reportMessages}
        WHERE ${reportMessages.reportId} = ${outerReportId}
          AND ${reportMessages.sender} = 'admin' AND ${reportMessages.readAt} IS NULL
      )`,
    })
    .from(reports)
    .where(contactCondition(contact))
    .orderBy(desc(reports.reportedAt))
    .limit(100);
