import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ADMIN_ROLES, REPORT_CATEGORIES, REPORT_STATUSES } from "../config/constants.js";

// Column names are snake_case in the database; Drizzle maps them from the camelCase keys
// (`casing: "snake_case"` in db/client.ts and drizzle.config.ts).

const timestamptz = () => timestamp({ withTimezone: true });

export const adminRole = pgEnum("admin_role", ADMIN_ROLES);
export const reportStatus = pgEnum("report_status", REPORT_STATUSES);
export const reportCategory = pgEnum("report_category", REPORT_CATEGORIES);

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
    busNumber: text().notNull(), // stored upper-case
    routeNumber: text().notNull(),
    busName: text(),
    category: reportCategory().notNull().default("other"),
    location: text().notNull(), // human-readable location
    latitude: doublePrecision(), // optional GPS pin
    longitude: doublePrecision(),
    description: text().notNull(),
    images: text().array().notNull().default([]), // Cloudinary URLs
    videos: text().array().notNull().default([]),
    incidentAt: timestamptz(), // when it happened (passenger-provided)
    reportedAt: timestamptz().notNull().defaultNow(), // when it was submitted
    passengerEmail: text(),
    status: reportStatus().notNull().default("pending"),
    resolvedAt: timestamptz(),
    pdfUrl: text(),
  },
  (t) => [
    index().on(t.reportedAt.desc()),
    index().on(t.busNumber, t.reportedAt.desc()),
    index().on(t.status),
    index().on(t.category),
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
