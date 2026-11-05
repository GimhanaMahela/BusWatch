import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ADMIN_ROLES,
  LANGUAGES,
  METRIC_EVENTS,
  REPORT_CATEGORIES,
  REPORT_SOURCES,
  REPORT_STATUSES,
  REPORT_TYPES,
} from "../config/constants.js";

// Column names are snake_case in the database; Drizzle maps them from the camelCase keys
// (`casing: "snake_case"` in db/client.ts and drizzle.config.ts).

const timestamptz = () => timestamp({ withTimezone: true });

export const adminRole = pgEnum("admin_role", ADMIN_ROLES);
export const reportStatus = pgEnum("report_status", REPORT_STATUSES);
export const reportCategory = pgEnum("report_category", REPORT_CATEGORIES);
export const reportType = pgEnum("report_type", REPORT_TYPES);
export const reportSource = pgEnum("report_source", REPORT_SOURCES);
export const language = pgEnum("language", LANGUAGES);
export const metricEvent = pgEnum("metric_event", METRIC_EVENTS);

export const admins = pgTable("admins", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(), // stored lower-case
  passwordHash: text().notNull(),
  role: adminRole().notNull().default("admin"),
  createdAt: timestamptz().notNull().defaultNow(),
});

export const reports = pgTable(
  "reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    receiptId: text().notNull().unique(),
    type: reportType().notNull().default("complaint"),
    busNumber: text().notNull(), // stored upper-case
    routeNumber: text().notNull(),
    busName: text(),
    category: reportCategory().notNull().default("other"),
    location: text(), // human-readable location; required for complaints, optional for commendations
    latitude: doublePrecision(), // optional GPS pin
    longitude: doublePrecision(),
    description: text().notNull(),
    images: text().array().notNull().default([]), // Cloudinary URLs
    videos: text().array().notNull().default([]),
    incidentAt: timestamptz(), // when it happened (passenger-provided)
    reportedAt: timestamptz().notNull().defaultNow(), // when it was submitted
    passengerEmail: text(),
    language: language().notNull().default("en"), // passenger's language for emails and the PDF
    source: reportSource().notNull().default("web"),
    status: reportStatus().notNull().default("pending"),
    resolvedAt: timestamptz(),
    pdfUrl: text(),
    // "Rate the outcome": the passenger's verdict once the report is closed
    outcomeRating: smallint(),
    outcomeFeedback: text(),
    ratedAt: timestamptz(),
  },
  (t) => [
    index().on(t.reportedAt.desc()),
    index().on(t.busNumber, t.reportedAt.desc()),
    index().on(t.status),
    index().on(t.category),
    index().on(t.type),
    check("outcome_rating_range", sql`${t.outcomeRating} BETWEEN 1 AND 5`),
  ],
);

export const reportStatusChanges = pgTable(
  "report_status_changes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    status: reportStatus().notNull(),
    note: text(), // public message shown to the passenger
    changedBy: text(), // admin email; never exposed publicly
    changedAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.reportId, t.changedAt)],
);

export const reportNotes = pgTable(
  "report_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    text: text().notNull(),
    author: text(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.reportId, t.createdAt)],
);

/** Anonymous daily counters for the Phase 1 success metrics (no personal data). */
export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    day: date({ mode: "string" }).notNull(),
    event: metricEvent().notNull(),
    count: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.event] })],
);

export const reportsRelations = relations(reports, ({ many }) => ({
  statusHistory: many(reportStatusChanges),
  notes: many(reportNotes),
}));

export const reportStatusChangesRelations = relations(reportStatusChanges, ({ one }) => ({
  report: one(reports, { fields: [reportStatusChanges.reportId], references: [reports.id] }),
}));

export const reportNotesRelations = relations(reportNotes, ({ one }) => ({
  report: one(reports, { fields: [reportNotes.reportId], references: [reports.id] }),
}));

export type AdminRow = typeof admins.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
export type StatusChangeRow = typeof reportStatusChanges.$inferSelect;
export type NoteRow = typeof reportNotes.$inferSelect;
