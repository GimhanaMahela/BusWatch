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
  OPEN_STATUSES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from "../config/constants.js";
import { db } from "../db/client.js";
import {
  reportNotes,
  reports,
  reportStatusChanges,
  type NewReportRow,
  type ReportRow,
} from "../db/schema.js";

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

export interface ReportFilter {
  page: number;
  limit: number;
  status?: ReportStatus | "open";
  category?: ReportCategory;
  q?: string;
  from?: Date | null;
  to?: Date | null;
}

export const listReports = async ({ page, limit, status, category, q, from, to }: ReportFilter) => {
  const conditions: (SQL | undefined)[] = [
    status === "open"
      ? inArray(reports.status, [...OPEN_STATUSES])
      : status
        ? eq(reports.status, status)
        : undefined,
    category ? eq(reports.category, category) : undefined,
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

export const getReportStats = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const month = sql<string>`to_char(date_trunc('month', ${reports.reportedAt}), 'YYYY-MM')`;

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
    db.$count(reports),
    db.$count(reports, gte(reports.reportedAt, thirtyDaysAgo)),
    db.select({ status: reports.status, count: countInt }).from(reports).groupBy(reports.status),
    db
      .select({ category: reports.category, count: countInt })
      .from(reports)
      .groupBy(reports.category)
      .orderBy(desc(countInt)),
    db
      .select({ month, count: countInt })
      .from(reports)
      .where(gte(reports.reportedAt, twelveMonthsAgo))
      .groupBy(month),
    db
      .select({ routeNumber: reports.routeNumber, count: countInt })
      .from(reports)
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
      .where(gte(reports.reportedAt, thirtyDaysAgo))
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
      .where(and(eq(reports.status, "resolved"), isNotNull(reports.resolvedAt))),
  ]);

  // Fill in empty months so the trend has no gaps
  const monthCounts = new Map(byMonthRows.map((m) => [m.month, m.count]));
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: key, count: monthCounts.get(key) ?? 0 };
  });

  const byStatus = Object.fromEntries(REPORT_STATUSES.map((s) => [s, 0])) as Record<
    ReportStatus,
    number
  >;
  for (const { status, count: n } of byStatusRows) byStatus[status] = n;

  const resolvedWithTiming = resolution?.count ?? 0;
  const avgHours = resolution?.avgHours;
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
    avgResolutionHours:
      resolvedWithTiming && avgHours != null ? Math.round(avgHours * 10) / 10 : null,
    resolvedWithTiming,
  };
};
