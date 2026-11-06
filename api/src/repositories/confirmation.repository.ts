import { and, asc, eq, ne, sql, type SQL } from "drizzle-orm";
import {
  CONFIRMATION,
  type Language,
  type ReportCategory,
  type ReportSource,
} from "../config/constants.js";
import { db } from "../db/client.js";
import { reportConfirmations, reports } from "../db/schema.js";
import { normaliseBusNumber, normalisedReportBus as normalisedBus } from "../utils/bus-number.js";

// "Me too" confirmations (Phase 4). Days follow Sri Lankan time, like the daily metrics.

/** The day the incident happened (or, without an incident time, the day it was reported). */
const incidentDay = sql`(coalesce(${reports.incidentAt}, ${reports.reportedAt}) AT TIME ZONE 'Asia/Colombo')::date`;

/**
 * Reports other passengers may confirm: complaints that weren't rejected or hidden by an admin,
 * about an incident in the last CONFIRMATION.maxAgeDays days.
 */
const confirmable: SQL = and(
  eq(reports.type, "complaint"),
  ne(reports.status, "rejected"),
  eq(reports.hiddenFromPublic, false),
  sql`${incidentDay} >= (now() AT TIME ZONE 'Asia/Colombo')::date - ${CONFIRMATION.maxAgeDays}::int`,
)!;

/**
 * Complaints about the same bus, category and day, oldest first. Returns only what the passenger
 * needs to recognise the incident: never the description, location, receipt ID or exact time.
 */
export const findSimilarReports = async (filter: {
  busNumber: string;
  category: ReportCategory;
  at: Date;
}) =>
  db
    .select({
      id: reports.id,
      routeNumber: reports.routeNumber,
      // Hour of the incident in Sri Lanka, only when the passenger gave an incident time
      hour: sql<
        number | null
      >`CASE WHEN ${reports.incidentAt} IS NULL THEN NULL ELSE extract(hour FROM ${reports.incidentAt} AT TIME ZONE 'Asia/Colombo')::int END`,
      confirmations: sql<number>`(
        SELECT count(*)::int FROM ${reportConfirmations}
        WHERE ${reportConfirmations.reportId} = ${sql.identifier("reports")}.${sql.identifier("id")}
      )`,
    })
    .from(reports)
    .where(
      and(
        confirmable,
        eq(reports.category, filter.category),
        sql`${normalisedBus} = ${normaliseBusNumber(filter.busNumber)}`,
        sql`${incidentDay} = (${filter.at.toISOString()}::timestamptz AT TIME ZONE 'Asia/Colombo')::date`,
      ),
    )
    .orderBy(asc(reports.reportedAt))
    .limit(CONFIRMATION.maxMatches);

/** True when the report exists and may still be confirmed. */
export const isConfirmable = async (id: string) =>
  (await db.$count(reports, and(eq(reports.id, id), confirmable))) > 0;

/** Adds a confirmation; false when this device already confirmed the report. */
export const addConfirmation = async (values: {
  reportId: string;
  deviceHash: string;
  comment?: string;
  language: Language;
  source: ReportSource;
}) => {
  const inserted = await db
    .insert(reportConfirmations)
    .values(values)
    .onConflictDoNothing({ target: [reportConfirmations.reportId, reportConfirmations.deviceHash] })
    .returning({ id: reportConfirmations.id });
  return inserted.length > 0;
};

export const countConfirmations = (reportId: string) =>
  db.$count(reportConfirmations, eq(reportConfirmations.reportId, reportId));
