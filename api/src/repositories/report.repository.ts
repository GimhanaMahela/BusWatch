import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  LANGUAGES,
  OPEN_STATUSES,
  REPORT_STATUSES,
  type Language,
  type ReportCategory,
  type ReportStatus,
  type ReportType,
} from "../config/constants.js";
import { db } from "../db/client.js";
import {
  reportNotes,
  reports,
  reportStatusChanges,
  type NewReportRow,
  type ReportRow,
} from "../db/schema.js";
import { getMetricTotals } from "./metric.repository.js";

/** Loads one report with its timeline and internal notes, oldest first. */
const findOneWithRelations = (where: SQL) =>
  db.query.reports.findFirst({
    where,
    with: {
      statusHistory: {
        columns: { status: true, note: true, changedBy: true, changedAt: true },
        orderBy: [asc(reportStatusChanges.changedAt), asc(reportStatusChanges.id)],
      },
      notes: {
        columns: { id: true, text: true, author: true, createdAt: true },
        orderBy: [asc(reportNotes.createdAt)],
      },
    },
  });

export type ReportWithRelations = NonNullable<Awaited<ReturnType<typeof findOneWithRelations>>>;

export const findReportById = (id: string) => findOneWithRelations(eq(reports.id, id));

// Receipt IDs are upper-case (BW-2026-XXXXXX); match case-insensitively
export const findReportByReceiptId = (receiptId: string) =>
  findOneWithRelations(sql`lower(${reports.receiptId}) = ${receiptId.trim().toLowerCase()}`);

export const receiptIdExists = async (receiptId: string) =>
  (await db.$count(reports, eq(reports.receiptId, receiptId))) > 0;

/** Inserts a report together with its first timeline entry. */
export const createReport = async (values: NewReportRow, firstNote: string): Promise<ReportRow> =>
  db.transaction(async (tx) => {
    const [report] = await tx.insert(reports).values(values).returning();
    if (!report) throw new Error("Report insert returned no row");
    await tx
      .insert(reportStatusChanges)
      .values({ reportId: report.id, status: report.status, note: firstNote });
    return report;
  });

export const setReportPdfUrl = async (id: string, pdfUrl: string) => {
  await db.update(reports).set({ pdfUrl }).where(eq(reports.id, id));
};

/** Stores the passenger's 1–5 rating of how their report was handled (they may change it). */
export const setOutcomeRating = async (id: string, rating: number, feedback?: string) => {
  await db
    .update(reports)
    .set({ outcomeRating: rating, outcomeFeedback: feedback ?? null, ratedAt: new Date() })
    .where(eq(reports.id, id));
};

export interface ReportFilter {
  page: number;
  limit: number;
  status?: ReportStatus | "open";
  category?: ReportCategory;
  type?: ReportType;
  q?: string;
  from?: Date | null;
  to?: Date | null;
}

export const listReports = async ({
  page,
  limit,
  status,
  category,
  type,
  q,
  from,
  to,
}: ReportFilter) => {
  const conditions: (SQL | undefined)[] = [
    status === "open"
      ? inArray(reports.status, [...OPEN_STATUSES])
      : status
        ? eq(reports.status, status)
        : undefined,
    category ? eq(reports.category, category) : undefined,
    type ? eq(reports.type, type) : undefined,
    from ? gte(reports.reportedAt, from) : undefined,
    to ? lte(reports.reportedAt, to) : undefined,
  ];
  if (q) {
    // Escape LIKE wildcards so the search is literal
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(reports.receiptId, pattern),
        ilike(reports.busNumber, pattern),
        ilike(reports.routeNumber, pattern),
        ilike(reports.busName, pattern),
        ilike(reports.location, pattern),
      ),
    );
  }
  const where = and(...conditions);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(reports)
      .where(where)
      .orderBy(desc(reports.reportedAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.$count(reports, where),
  ]);
  return { rows, total };
};

/** Changes status and appends a timeline entry atomically. Returns null if not found. */
export const updateReportStatus = async (
  id: string,
  change: { status: ReportStatus; note?: string; changedBy?: string },
) =>
  db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: reports.status })
      .from(reports)
      .where(eq(reports.id, id))
      .for("update");
    if (!current) return null;

    if (current.status !== change.status) {
      await tx
        .update(reports)
        .set({
          status: change.status,
          resolvedAt: change.status === "resolved" ? new Date() : null,
        })
        .where(eq(reports.id, id));
    }
    await tx.insert(reportStatusChanges).values({ reportId: id, ...change });
    return { previousStatus: current.status };
  });

/** Keeps a report in or out of public totals, maps and scorecards. Returns false if not found. */
export const setReportHiddenFromPublic = async (id: string, hiddenFromPublic: boolean) => {
  const updated = await db
    .update(reports)
    .set({ hiddenFromPublic })
    .where(eq(reports.id, id))
    .returning({ id: reports.id });
  return updated.length > 0;
};

/** Returns false when the report does not exist. */
export const addReportNote = async (id: string, text: string, author?: string) => {
  if (!(await db.$count(reports, eq(reports.id, id)))) return false;
  await db.insert(reportNotes).values({ reportId: id, text, author });
  return true;
};

/** Deletes a report (history and notes cascade) and returns it, or null if not found. */
export const deleteReport = async (id: string): Promise<ReportRow | null> => {
  const [deleted] = await db.delete(reports).where(eq(reports.id, id)).returning();
  return deleted ?? null;
};

// ---------------------------------------------------------------- Analytics

const countInt = sql<number>`count(*)::int`;
const DAY_MS = 24 * 60 * 60 * 1000;

const statusCounts = (rows: { status: ReportStatus; count: number }[]) => {
  const byStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0])) as Record<
    ReportStatus,
    number
  >;
  for (const { status, count: n } of rows) byStatus[status] = n;
  return byStatus;
};

const round1 = (value: number | null | undefined) =>
  value == null ? null : Math.round(value * 10) / 10;

/** Complaint analytics. Commendations are counted separately so praise never inflates a bus's
 *  complaint numbers (or flags it as a repeat offender). */
const getComplaintStats = async (now: Date) => {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const month = sql<string>`to_char(date_trunc('month', ${reports.reportedAt}), 'YYYY-MM')`;
  const isComplaint = eq(reports.type, "complaint");

  const [
    total,
    last30Days,
    byStatusRows,
    byCategory,
    byMonthRows,
    topRoutes,
    topBuses,
    repeatOffenders,
    [resolution],
  ] = await Promise.all([
    db.$count(reports, isComplaint),
    db.$count(reports, and(isComplaint, gte(reports.reportedAt, thirtyDaysAgo))),
    db
      .select({ status: reports.status, count: countInt })
      .from(reports)
      .where(isComplaint)
      .groupBy(reports.status),
    db
      .select({ category: reports.category, count: countInt })
      .from(reports)
      .where(isComplaint)
      .groupBy(reports.category)
      .orderBy(desc(countInt)),
    db
      .select({ month, count: countInt })
      .from(reports)
      .where(and(isComplaint, gte(reports.reportedAt, twelveMonthsAgo)))
      .groupBy(month),
    db
      .select({ routeNumber: reports.routeNumber, count: countInt })
      .from(reports)
      .where(isComplaint)
      .groupBy(reports.routeNumber)
      .orderBy(desc(countInt), asc(reports.routeNumber))
      .limit(10),
    db
      .select({
        busNumber: reports.busNumber,
        busName: sql<string | null>`max(${reports.busName})`,
        count: countInt,
      })
      .from(reports)
      .where(isComplaint)
      .groupBy(reports.busNumber)
      .orderBy(desc(countInt), asc(reports.busNumber))
      .limit(10),
    db
      .select({
        busNumber: reports.busNumber,
        count: countInt,
        lastReportedAt: sql<Date>`max(${reports.reportedAt})`.mapWith(reports.reportedAt),
      })
      .from(reports)
      .where(and(isComplaint, gte(reports.reportedAt, thirtyDaysAgo)))
      .groupBy(reports.busNumber)
      .having(sql`count(*) >= 3`)
      .orderBy(desc(countInt)),
    db
      .select({
        avgHours: sql<
          number | null
        >`avg(extract(epoch from ${reports.resolvedAt} - ${reports.reportedAt}) / 3600)::float`,
        count: count(),
      })
      .from(reports)
      .where(and(isComplaint, eq(reports.status, "resolved"), isNotNull(reports.resolvedAt))),
  ]);

  // Fill in empty months so the trend has no gaps
  const monthCounts = new Map(byMonthRows.map((m) => [m.month, m.count]));
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: key, count: monthCounts.get(key) ?? 0 };
  });

  const byStatus = statusCounts(byStatusRows);
  const resolvedWithTiming = resolution?.count ?? 0;
  return {
    total,
    last30Days,
    open: OPEN_STATUSES.reduce((sum, s) => sum + byStatus[s], 0),
    byStatus,
    byCategory,
    byMonth,
    topRoutes,
    topBuses,
    repeatOffenders,
    avgResolutionHours: resolvedWithTiming ? round1(resolution?.avgHours) : null,
    resolvedWithTiming,
  };
};

/** "Commend a driver" analytics, shown in their own section. */
const getCommendationStats = async (now: Date) => {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const isCommendation = eq(reports.type, "commendation");

  const [total, last30Days, byStatusRows, byCategory, topBuses] = await Promise.all([
    db.$count(reports, isCommendation),
    db.$count(reports, and(isCommendation, gte(reports.reportedAt, thirtyDaysAgo))),
    db
      .select({ status: reports.status, count: countInt })
      .from(reports)
      .where(isCommendation)
      .groupBy(reports.status),
    db
      .select({ category: reports.category, count: countInt })
      .from(reports)
      .where(isCommendation)
      .groupBy(reports.category)
      .orderBy(desc(countInt)),
    db
      .select({
        busNumber: reports.busNumber,
        busName: sql<string | null>`max(${reports.busName})`,
        count: countInt,
      })
      .from(reports)
      .where(isCommendation)
      .groupBy(reports.busNumber)
      .orderBy(desc(countInt), asc(reports.busNumber))
      .limit(10),
  ]);

  const byStatus = statusCounts(byStatusRows);
  return {
    total,
    last30Days,
    open: OPEN_STATUSES.reduce((sum, s) => sum + byStatus[s], 0),
    byStatus,
    byCategory,
    topBuses,
  };
};

/**
 * The Phase 1 success metrics over the last 30 days: form completion, return visits to tracking,
 * outcome ratings, reports from QR codes and time to first response.
 */
const getEngagementStats = async (now: Date) => {
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const sinceDay = since.toISOString().slice(0, 10);

  // First admin action on each recent report (the automatic "Report received." entry has no author)
  const firstResponses = db
    .select({
      reportedAt: reports.reportedAt,
      firstAt: sql<Date>`min(${reportStatusChanges.changedAt})`.as("first_at"),
    })
    .from(reports)
    .innerJoin(
      reportStatusChanges,
      and(eq(reportStatusChanges.reportId, reports.id), isNotNull(reportStatusChanges.changedBy)),
    )
    .where(gte(reports.reportedAt, since))
    .groupBy(reports.id)
    .as("first_responses");

  const rated = and(eq(reports.type, "complaint"), isNotNull(reports.outcomeRating));

  const [
    metrics,
    qrReports,
    webReports,
    [firstResponse],
    [ratingSummary],
    ratingRows,
    recentFeedback,
    languageRows,
  ] = await Promise.all([
    getMetricTotals(sinceDay),
    db.$count(reports, and(eq(reports.source, "qr"), gte(reports.reportedAt, since))),
    db.$count(reports, and(eq(reports.source, "web"), gte(reports.reportedAt, since))),
    db
      .select({
        avgHours: sql<
          number | null
        >`avg(extract(epoch from ${firstResponses.firstAt} - ${firstResponses.reportedAt}) / 3600)::float`,
        count: count(),
      })
      .from(firstResponses),
    db
      .select({
        average: sql<number | null>`avg(${reports.outcomeRating})::float`,
        count: count(),
      })
      .from(reports)
      .where(rated),
    db
      .select({ rating: reports.outcomeRating, count: countInt })
      .from(reports)
      .where(rated)
      .groupBy(reports.outcomeRating),
    db
      .select({
        id: reports.id,
        receiptId: reports.receiptId,
        rating: reports.outcomeRating,
        feedback: reports.outcomeFeedback,
        ratedAt: reports.ratedAt,
      })
      .from(reports)
      .where(and(rated, isNotNull(reports.outcomeFeedback)))
      .orderBy(desc(reports.ratedAt))
      .limit(5),
    db
      .select({ language: reports.language, count: countInt })
      .from(reports)
      .where(gte(reports.reportedAt, since))
      .groupBy(reports.language),
  ]);

  const formStarts = metrics.report_form_started + metrics.commendation_form_started;
  const formSubmits = metrics.report_submitted + metrics.commendation_submitted;
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: ratingRows.find((r) => r.rating === rating)?.count ?? 0,
  }));
  const byLanguage = Object.fromEntries(LANGUAGES.map((l) => [l, 0])) as Record<Language, number>;
  for (const { language, count: n } of languageRows) byLanguage[language] = n;

  return {
    periodDays: 30,
    formStarts,
    formSubmits,
    // Capped at 100%: offline drafts can be sent on a later day than they were started
    formCompletionRate: formStarts
      ? Math.min(Math.round((formSubmits / formStarts) * 100), 100)
      : null,
    trackingViews: metrics.tracking_view,
    trackingReturnViews: metrics.tracking_return_view,
    qrScans: metrics.qr_scan,
    qrReports,
    webReports,
    shares: metrics.report_shared,
    offlineQueued: metrics.offline_report_queued,
    appInstalls: metrics.app_installed,
    avgFirstResponseHours: round1(firstResponse?.avgHours),
    respondedReports: firstResponse?.count ?? 0,
    avgRating: round1(ratingSummary?.average),
    ratingsCount: ratingSummary?.count ?? 0,
    ratingDistribution,
    recentFeedback,
    byLanguage,
  };
};

export const getReportStats = async () => {
  const now = new Date();
  const [complaints, commendations, engagement] = await Promise.all([
    getComplaintStats(now),
    getCommendationStats(now),
    getEngagementStats(now),
  ]);
  return { ...complaints, commendations, engagement };
};
