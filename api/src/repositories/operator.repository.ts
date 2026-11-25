import { and, asc, count, desc, eq, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import {
  OPERATOR_LOST_ITEM_STATUSES,
  BUS_FEEDBACK_TYPES,
  PUBLIC_STATUSES,
  REPORT_STATUSES,
  type ReportStatus,
  type ReportType,
} from "../config/constants.js";
import { db } from "../db/client.js";
import {
  admins,
  operatorBuses,
  operatorResponses,
  reportConfirmations,
  reports,
  reportStatusChanges,
} from "../db/schema.js";
import { normaliseBusNumber, normalisedReportBus } from "../utils/bus-number.js";
import { outerReportId } from "./report.repository.js";

// Operator portal (Phase 4): bus owners see checked reports about their own fleet.

// ---------------------------------------------------------------- Fleets (managed by superadmins)

export const getFleet = async (operatorId: string) =>
  (
    await db
      .select({ busNumber: operatorBuses.busNumber })
      .from(operatorBuses)
      .where(eq(operatorBuses.operatorId, operatorId))
      .orderBy(asc(operatorBuses.busNumber))
  ).map((row) => row.busNumber);

/** All fleets, keyed by operator id (for the admin list). */
export const getAllFleets = async () => {
  const rows = await db.select().from(operatorBuses).orderBy(asc(operatorBuses.busNumber));
  const fleets = new Map<string, string[]>();
  for (const { operatorId, busNumber } of rows) {
    fleets.set(operatorId, [...(fleets.get(operatorId) ?? []), busNumber]);
  }
  return fleets;
};

/** Replaces an operator's fleet (bus numbers are normalised and de-duplicated). */
export const setFleet = async (operatorId: string, busNumbers: string[]) => {
  const unique = [...new Set(busNumbers.map(normaliseBusNumber).filter(Boolean))];
  await db.transaction(async (tx) => {
    await tx.delete(operatorBuses).where(eq(operatorBuses.operatorId, operatorId));
    if (unique.length) {
      await tx.insert(operatorBuses).values(unique.map((busNumber) => ({ operatorId, busNumber })));
    }
  });
  return unique.sort();
};

export const setOrganisation = async (operatorId: string, organisation: string | null) => {
  await db.update(admins).set({ organisation }).where(eq(admins.id, operatorId));
};

// ---------------------------------------------------------------- What an operator may see

/**
 * Reports about this operator's buses that an admin has checked (pending ones are unverified,
 * rejected ones didn't stand) and not hidden. Same fairness rule as the public scorecards.
 * Lost items are the exception: they can't wait for an admin, and accuse nobody, so operators see
 * them as soon as they arrive (unless an admin closed or hid them). Road incidents are never shown:
 * they are not about route buses.
 */
const fleetReports = (operatorId: string): SQL =>
  and(
    sql`${normalisedReportBus} IN (
      SELECT ${operatorBuses.busNumber} FROM ${operatorBuses}
      WHERE ${operatorBuses.operatorId} = ${operatorId}
    )`,
    or(
      and(
        inArray(reports.type, [...BUS_FEEDBACK_TYPES]),
        inArray(reports.status, [...PUBLIC_STATUSES]),
      ),
      and(eq(reports.type, "lost_item"), inArray(reports.status, [...OPERATOR_LOST_ITEM_STATUSES])),
    ),
    eq(reports.hiddenFromPublic, false),
  )!;

/** Never the passenger's contact details, receipt ID, internal notes or messages. */
const operatorColumns = {
  id: reports.id,
  type: reports.type,
  category: reports.category,
  extraCategories: reports.extraCategories,
  busNumber: reports.busNumber,
  routeNumber: reports.routeNumber,
  busName: reports.busName,
  location: reports.location,
  incidentAt: reports.incidentAt,
  reportedAt: reports.reportedAt,
  status: reports.status,
  resolvedAt: reports.resolvedAt,
  description: reports.description,
  // Only photos with faces and number plates blurred; none until an admin has run the blur
  images: sql<string[]>`coalesce(${reports.blurredImages}, '{}')`,
  // English translation from AI help, when the passenger wrote in Sinhala or Tamil
  translation: sql<string | null>`${reports.aiInsights} ->> 'englishTranslation'`,
  // Accessibility issues ticked, or the official fare for an overcharging complaint
  details: reports.details,
};

const confirmationCount = sql<number>`(
  SELECT count(*)::int FROM ${reportConfirmations}
  WHERE ${reportConfirmations.reportId} = ${outerReportId}
)`;
const responseCount = sql<number>`(
  SELECT count(*)::int FROM ${operatorResponses}
  WHERE ${operatorResponses.reportId} = ${outerReportId}
)`;

export interface FleetReportFilter {
  page: number;
  limit: number;
  status?: ReportStatus;
  type?: ReportType;
  busNumber?: string;
}

export const listFleetReports = async (operatorId: string, filter: FleetReportFilter) => {
  const where = and(
    fleetReports(operatorId),
    filter.status ? eq(reports.status, filter.status) : undefined,
    filter.type ? eq(reports.type, filter.type) : undefined,
    filter.busNumber
      ? sql`${normalisedReportBus} = ${normaliseBusNumber(filter.busNumber)}`
      : undefined,
  );
  const [rows, total] = await Promise.all([
    db
      .select({ ...operatorColumns, confirmations: confirmationCount, responses: responseCount })
      .from(reports)
      .where(where)
      .orderBy(desc(reports.reportedAt))
      .limit(filter.limit)
      .offset((filter.page - 1) * filter.limit),
    db.$count(reports, where),
  ]);
  return { rows, total };
};

/** One report with its public timeline and the operator responses; null if not in their fleet. */
export const findFleetReport = async (operatorId: string, id: string) => {
  const [report] = await db
    .select({ ...operatorColumns, confirmations: confirmationCount })
    .from(reports)
    .where(and(eq(reports.id, id), fleetReports(operatorId)));
  if (!report) return null;

  const [timeline, responses] = await Promise.all([
    db
      .select({ status: reportStatusChanges.status, changedAt: reportStatusChanges.changedAt })
      .from(reportStatusChanges)
      .where(eq(reportStatusChanges.reportId, id))
      .orderBy(asc(reportStatusChanges.changedAt), asc(reportStatusChanges.id)),
    db
      .select({
        id: operatorResponses.id,
        body: operatorResponses.body,
        organisation: operatorResponses.organisation,
        hidden: operatorResponses.hidden,
        createdAt: operatorResponses.createdAt,
      })
      .from(operatorResponses)
      .where(eq(operatorResponses.reportId, id))
      .orderBy(asc(operatorResponses.createdAt)),
  ]);
  return { ...report, timeline, responses };
};

/** Totals for the portal's overview, plus the buses with the most checked complaints. */
export const getFleetSummary = async (operatorId: string) => {
  const inFleet = fleetReports(operatorId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const countInt = sql<number>`count(*)::int`;

  const [byTypeStatus, last30Days, awaitingResponse, topBuses, fleet, lostItemsOpen] =
    await Promise.all([
      db
        .select({ type: reports.type, status: reports.status, count: countInt })
        .from(reports)
        .where(inFleet)
        .groupBy(reports.type, reports.status),
      db.$count(reports, and(inFleet, sql`${reports.reportedAt} >= ${since.toISOString()}`)),
      // Complaints still open that the operator hasn't answered yet
      db.$count(
        reports,
        and(
          inFleet,
          eq(reports.type, "complaint"),
          inArray(reports.status, ["reviewed", "escalated"]),
          sql`NOT EXISTS (SELECT 1 FROM ${operatorResponses} WHERE ${operatorResponses.reportId} = ${outerReportId})`,
        ),
      ),
      db
        .select({ busNumber: reports.busNumber, count: count() })
        .from(reports)
        .where(and(inFleet, eq(reports.type, "complaint")))
        .groupBy(reports.busNumber)
        .orderBy(desc(count()), asc(reports.busNumber))
        .limit(5),
      getFleet(operatorId),
      // Lost items nobody has marked as found yet
      db.$count(
        reports,
        and(inFleet, eq(reports.type, "lost_item"), ne(reports.status, "resolved")),
      ),
    ]);

  const complaintsByStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0])) as Record<
    ReportStatus,
    number
  >;
  let complaints = 0;
  let commendations = 0;
  let lostItems = 0;
  for (const row of byTypeStatus) {
    if (row.type === "commendation") commendations += row.count;
    else if (row.type === "lost_item") lostItems += row.count;
    else {
      complaints += row.count;
      complaintsByStatus[row.status] = row.count;
    }
  }
  return {
    fleet,
    complaints,
    commendations,
    complaintsByStatus,
    last30Days,
    awaitingResponse,
    topBuses,
    lostItems,
    lostItemsOpen,
  };
};

export const addOperatorResponse = async (values: {
  reportId: string;
  operatorId: string;
  organisation: string | null;
  body: string;
}) => {
  const [row] = await db.insert(operatorResponses).values(values).returning();
  return row;
};

/** Admins can keep an unsuitable response off the passenger's tracking page. */
export const setOperatorResponseHidden = async (
  reportId: string,
  responseId: string,
  hidden: boolean,
) => {
  const updated = await db
    .update(operatorResponses)
    .set({ hidden })
    .where(and(eq(operatorResponses.id, responseId), eq(operatorResponses.reportId, reportId)))
    .returning({ id: operatorResponses.id });
  return updated.length > 0;
};

/** Operators whose fleet includes this bus (to show admins who runs it). */
export const findOperatorsForBus = async (busNumber: string) =>
  db
    .select({ id: admins.id, email: admins.email, organisation: admins.organisation })
    .from(operatorBuses)
    .innerJoin(admins, eq(admins.id, operatorBuses.operatorId))
    .where(eq(operatorBuses.busNumber, normaliseBusNumber(busNumber)));
