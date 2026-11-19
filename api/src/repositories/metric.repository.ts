import { gte, sql } from "drizzle-orm";
import { METRIC_EVENTS, type MetricEvent } from "../config/constants.js";
import { db } from "../db/client.js";
import { dailyMetrics } from "../db/schema.js";

// Days follow Sri Lankan time so "today" matches what passengers and admins see
const today = sql`(now() AT TIME ZONE 'Asia/Colombo')::date`;

/** Adds one to today's counter for an event (anonymous: nothing about the person is stored). */
export const incrementMetric = async (event: MetricEvent) => {
  await db
    .insert(dailyMetrics)
    .values({ day: today, event, count: 1 })
    .onConflictDoUpdate({
      target: [dailyMetrics.day, dailyMetrics.event],
      set: { count: sql`${dailyMetrics.count} + 1` },
    });
};

/** Like incrementMetric, but a counter must never break a request: log and carry on. */
export const countEvent = (event: MetricEvent) =>
  incrementMetric(event).catch((error: unknown) =>
    console.error(`Failed to count ${event}:`, error instanceof Error ? error.message : error),
  );

/** Total per event since a day ("YYYY-MM-DD", inclusive); events never seen count as 0. */
export const getMetricTotals = async (sinceDay: string): Promise<Record<MetricEvent, number>> => {
  const rows = await db
    .select({ event: dailyMetrics.event, count: sql<number>`sum(${dailyMetrics.count})::int` })
    .from(dailyMetrics)
    .where(gte(dailyMetrics.day, sinceDay))
    .groupBy(dailyMetrics.event);

  const totals = Object.fromEntries(METRIC_EVENTS.map((e) => [e, 0])) as Record<
    MetricEvent,
    number
  >;
  for (const { event, count } of rows) totals[event] = count;
  return totals;
};
