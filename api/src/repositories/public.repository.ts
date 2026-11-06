import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  HEATMAP_CELL_DEGREES,
  MIN_HEATMAP_REPORTS,
  MIN_PUBLIC_REPORTS,
  PUBLIC_STATUSES,
  SRI_LANKA_BOUNDS,
  type ReportType,
} from "../config/constants.js";
import { db } from "../db/client.js";
import { impactStories, reports } from "../db/schema.js";

// Everything here is shown to the public, so every query follows the same rules:
// - only admin-checked reports (PUBLIC_STATUSES) that an admin hasn't hidden,
// - totals only: no passenger details, receipt IDs, descriptions or exact times next to a place,
// - buses and routes need MIN_PUBLIC_REPORTS checked reports before they get a scorecard.

const countInt = sql<number>`count(*)::int`;
const DAY_MS = 24 * 60 * 60 * 1000;

const visible = eq(reports.hiddenFromPublic, false);
const checked = (type: ReportType = "complaint") =>
  and(eq(reports.type, type), inArray(reports.status, [...PUBLIC_STATUSES]), visible);

const round1 = (value: number | null | undefined) =>
  value == null ? null : Math.round(value * 10) / 10;

/** Route numbers are free text ("08", "08 ", "Colombo–Matale"): compare them trimmed, case-blind. */
const routeKey = sql<string>`lower(trim(${reports.routeNumber}))`;
export const normaliseRoute = (route: string) => route.trim().toLowerCase();
export const normaliseBus = (bus: string) => bus.trim().toUpperCase().replace(/\s+/g, " ");

/** "YYYY-MM" for the last 12 months, oldest first, so trends have no gaps. */
const lastTwelveMonths = (now: Date) =>
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

const monthOf = (column: typeof reports.reportedAt | typeof reports.resolvedAt) =>
  sql<string>`to_char(date_trunc('month', ${column}), 'YYYY-MM')`;

const byMonth = async (where: SQL | undefined, column: typeof reports.reportedAt, since: Date) => {
  const month = monthOf(column);
  const rows = await db
    .select({ month, count: countInt })
    .from(reports)
    .where(and(where, gte(column, since)))
    .groupBy(month);
  return new Map(rows.map((r) => [r.month, r.count]));
};

// ---------------------------------------------------------------- Heatmap

/**
 * Where checked complaints cluster: map pins grouped into ~5.5 km cells, and only cells with
 * MIN_HEATMAP_REPORTS or more, so no single report (or person) can be located.
 */
const getHeatmap = async () => {
  // Inlined (a numeric constant, never user input): GROUP BY must match the SELECT expression
  // exactly, and bound parameters would get different placeholders in each place.
  const size = sql.raw(String(Number(HEATMAP_CELL_DEGREES)));
  const lat = sql<number>`(round(${reports.latitude} / ${size}) * ${size})::float`;
  const lng = sql<number>`(round(${reports.longitude} / ${size}) * ${size})::float`;
  const { minLat, maxLat, minLng, maxLng } = SRI_LANKA_BOUNDS;

  const cells = await db
    .select({ lat, lng, count: countInt })
    .from(reports)
    .where(
      and(
        checked(),
        isNotNull(reports.latitude),
        isNotNull(reports.longitude),
        gte(reports.latitude, minLat),
        lte(reports.latitude, maxLat),
        gte(reports.longitude, minLng),
        lte(reports.longitude, maxLng),
      ),
    )
    .groupBy(lat, lng)
    .having(sql`count(*) >= ${MIN_HEATMAP_REPORTS}`)
    .orderBy(desc(countInt));

  return {
    cellDegrees: HEATMAP_CELL_DEGREES,
    minReports: MIN_HEATMAP_REPORTS,
    // Round away float noise from the SQL arithmetic
    cells: cells.map((c) => ({
      lat: Math.round(c.lat * 1000) / 1000,
      lng: Math.round(c.lng * 1000) / 1000,
      count: c.count,
    })),
  };
};

// ---------------------------------------------------------------- Stories

export const listPublishedStories = (limit = 6) =>
  db
    .select({
      id: impactStories.id,
      title: impactStories.title,
      body: impactStories.body,
      translations: impactStories.translations,
      category: impactStories.category,
      routeNumber: impactStories.routeNumber,
      // Month only: an exact date next to a route could identify the passenger
      month: sql<string>`to_char(${impactStories.publishedAt}, 'YYYY-MM')`,
    })
    .from(impactStories)
    .where(eq(impactStories.published, true))
    .orderBy(desc(impactStories.publishedAt))
    .limit(limit);

// ---------------------------------------------------------------- /impact

/** Everything the public impact page shows: totals, trends, where, and what changed. */
export const getPublicImpact = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);
  const received = and(eq(reports.type, "complaint"), visible);
  const resolved = and(checked(), eq(reports.status, "resolved"), isNotNull(reports.resolvedAt));

  const [
    totalReceived,
    receivedThisMonth,
    totalResolved,
    resolvedThisMonth,
    totalChecked,
    commendations,
    [timing],
    [rating],
    byCategory,
    topRoutes,
    receivedByMonth,
    resolvedByMonth,
    heatmap,
    stories,
  ] = await Promise.all([
    db.$count(reports, received),
    db.$count(reports, and(received, gte(reports.reportedAt, monthStart))),
    db.$count(reports, resolved),
    db.$count(reports, and(resolved, gte(reports.resolvedAt, monthStart))),
    db.$count(reports, checked()),
    db.$count(reports, checked("commendation")),
    // Median, not mean: one case that took months shouldn't hide that most are quick
    db
      .select({
        medianHours: sql<
          number | null
        >`percentile_cont(0.5) within group (order by extract(epoch from ${reports.resolvedAt} - ${reports.reportedAt}) / 3600)::float`,
        count: count(),
      })
      .from(reports)
      .where(and(resolved, gte(reports.resolvedAt, ninetyDaysAgo))),
    db
      .select({ average: sql<number | null>`avg(${reports.outcomeRating})::float`, count: count() })
      .from(reports)
      .where(and(checked(), isNotNull(reports.outcomeRating))),
    db
      .select({ category: reports.category, count: countInt })
      .from(reports)
      .where(checked())
      .groupBy(reports.category)
      .orderBy(desc(countInt), asc(reports.category)),
    // Only routes that already qualify for a scorecard, so every link leads somewhere
    db
      .select({ routeNumber: sql<string>`min(trim(${reports.routeNumber}))`, count: countInt })
      .from(reports)
      .where(checked())
      .groupBy(routeKey)
      .having(sql`count(*) >= ${MIN_PUBLIC_REPORTS}`)
      .orderBy(desc(countInt))
      .limit(8),
    byMonth(received, reports.reportedAt, yearAgo),
    (async () => {
      const month = monthOf(reports.resolvedAt);
      const rows = await db
        .select({ month, count: countInt })
        .from(reports)
        .where(and(resolved, gte(reports.resolvedAt, yearAgo)))
        .groupBy(month);
      return new Map(rows.map((r) => [r.month, r.count]));
    })(),
    getHeatmap(),
    listPublishedStories(),
  ]);

  return {
    updatedAt: now.toISOString(),
    minPublicReports: MIN_PUBLIC_REPORTS,
    totals: {
      received: totalReceived,
      receivedThisMonth,
      checked: totalChecked,
      resolved: totalResolved,
      resolvedThisMonth,
      resolutionRate: totalChecked ? Math.round((totalResolved / totalChecked) * 100) : null,
      medianHoursToResolve: timing?.count ? round1(timing.medianHours) : null,
      commendations,
      averageRating: rating?.count ? round1(rating.average) : null,
      ratings: rating?.count ?? 0,
    },
    byMonth: lastTwelveMonths(now).map((month) => ({
      month,
      received: receivedByMonth.get(month) ?? 0,
      resolved: resolvedByMonth.get(month) ?? 0,
    })),
    byCategory,
    topRoutes,
    heatmap,
    stories,
  };
};

// ---------------------------------------------------------------- Scorecards

const scorecard = async (scope: SQL, now = new Date()) => {
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const complaints = and(scope, checked());
  const praise = and(scope, checked("commendation"));

  const [
    complaintCount,
    commendationCount,
    resolved,
    byCategory,
    praiseByCategory,
    [rating],
    [range],
    trend,
  ] = await Promise.all([
    db.$count(reports, complaints),
    db.$count(reports, praise),
    db.$count(reports, and(complaints, eq(reports.status, "resolved"))),
    db
      .select({ category: reports.category, count: countInt })
      .from(reports)
      .where(complaints)
      .groupBy(reports.category)
      .orderBy(desc(countInt), asc(reports.category)),
    db
      .select({ category: reports.category, count: countInt })
      .from(reports)
      .where(praise)
      .groupBy(reports.category)
      .orderBy(desc(countInt), asc(reports.category)),
    db
      .select({ average: sql<number | null>`avg(${reports.outcomeRating})::float`, count: count() })
      .from(reports)
      .where(and(complaints, isNotNull(reports.outcomeRating))),
    db
      .select({ since: sql<string | null>`to_char(min(${reports.reportedAt}), 'YYYY-MM')` })
      .from(reports)
      .where(and(scope, inArray(reports.status, [...PUBLIC_STATUSES]), visible)),
    byMonth(complaints, reports.reportedAt, yearAgo),
  ]);

  // Complaint numbers only once there are enough of them (the fairness rule); praise is harmless
  const showComplaints = complaintCount >= MIN_PUBLIC_REPORTS;
  return {
    published: showComplaints || commendationCount >= MIN_PUBLIC_REPORTS,
    minPublicReports: MIN_PUBLIC_REPORTS,
    since: range?.since ?? null,
    complaints: showComplaints
      ? {
          checked: complaintCount,
          resolved,
          inProgress: complaintCount - resolved,
          resolutionRate: Math.round((resolved / complaintCount) * 100),
          byCategory,
          // A rating average needs a few ratings to mean anything
          averageRating:
            (rating?.count ?? 0) >= MIN_PUBLIC_REPORTS ? round1(rating?.average) : null,
          byMonth: lastTwelveMonths(now).map((month) => ({ month, count: trend.get(month) ?? 0 })),
        }
      : null,
    commendations: { count: commendationCount, byCategory: praiseByCategory },
  };
};

/** Public scorecard for one bus, or `published: false` while it has too few checked reports. */
export const getBusScorecard = async (busNumber: string) => {
  const bus = normaliseBus(busNumber);
  const scope = eq(reports.busNumber, bus);
  const [card, routes, [name]] = await Promise.all([
    scorecard(scope),
    db
      .select({ routeNumber: sql<string>`min(trim(${reports.routeNumber}))`, count: countInt })
      .from(reports)
      .where(and(scope, inArray(reports.status, [...PUBLIC_STATUSES]), visible))
      .groupBy(routeKey)
      .orderBy(desc(countInt))
      .limit(5),
    // The name passengers use most often for this bus
    db
      .select({ busName: reports.busName, count: countInt })
      .from(reports)
      .where(and(scope, isNotNull(reports.busName), inArray(reports.status, [...PUBLIC_STATUSES])))
      .groupBy(reports.busName)
      .orderBy(desc(countInt))
      .limit(1),
  ]);
  if (!card.published) return { busNumber: bus, ...card, complaints: null, commendations: null };
  return {
    busNumber: bus,
    busName: name?.busName ?? null,
    routes: routes.map((r) => r.routeNumber),
    ...card,
  };
};

/** Public scorecard for a route, with the buses on it that have their own scorecard. */
export const getRouteScorecard = async (routeNumber: string) => {
  const route = normaliseRoute(routeNumber);
  const scope = sql`${routeKey} = ${route}`;
  const [card, buses, [label]] = await Promise.all([
    scorecard(scope),
    db
      .select({ busNumber: reports.busNumber, count: countInt })
      .from(reports)
      .where(and(scope, checked()))
      .groupBy(reports.busNumber)
      .having(sql`count(*) >= ${MIN_PUBLIC_REPORTS}`)
      .orderBy(desc(countInt), asc(reports.busNumber))
      .limit(10),
    db
      .select({ routeNumber: sql<string>`min(trim(${reports.routeNumber}))` })
      .from(reports)
      .where(scope),
  ]);
  const routeLabel = label?.routeNumber ?? routeNumber.trim();
  if (!card.published) {
    return { routeNumber: routeLabel, ...card, complaints: null, commendations: null };
  }
  return { routeNumber: routeLabel, buses, ...card };
};
