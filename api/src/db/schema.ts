import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ADMIN_ROLES,
  CONTACT_CHANNELS,
  LANGUAGES,
  MESSAGE_SENDERS,
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
export const messageSender = pgEnum("message_sender", MESSAGE_SENDERS);
export const contactChannel = pgEnum("contact_channel", CONTACT_CHANNELS);

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
    // Optional, for SMS updates and "My reports" sign-in; stored as E.164 (+94771234567)
    passengerPhone: text(),
    language: language().notNull().default("en"), // passenger's language for emails and the PDF
    source: reportSource().notNull().default("web"),
    status: reportStatus().notNull().default("pending"),
    resolvedAt: timestamptz(),
    pdfUrl: text(),
    // "Rate the outcome": the passenger's verdict once the report is closed
    outcomeRating: smallint(),
    outcomeFeedback: text(),
    ratedAt: timestamptz(),
    // An admin can keep a disputed report out of public totals, maps and scorecards
    hiddenFromPublic: boolean().notNull().default(false),
  },
  (t) => [
    index().on(t.reportedAt.desc()),
    index().on(t.busNumber, t.reportedAt.desc()),
    index().on(t.status),
    index().on(t.category),
    index().on(t.type),
    index().on(t.passengerEmail),
    index().on(t.passengerPhone),
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

/**
 * "Messages between admin and passenger": a conversation on one report, e.g. an admin asking
 * "Which seat were you in?" and the passenger replying from the tracking page.
 */
export const reportMessages = pgTable(
  "report_messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sender: messageSender().notNull(),
    body: text().notNull(),
    author: text(), // admin email for admin messages; never exposed publicly
    createdAt: timestamptz().notNull().defaultNow(),
    // When the other side read it (admins for passenger messages, the passenger for admin ones)
    readAt: timestamptz(),
  },
  (t) => [index().on(t.reportId, t.createdAt)],
);

/** One-time sign-in codes for "My reports". Only a hash of the code is stored. */
export const passengerCodes = pgTable(
  "passenger_codes",
  {
    id: uuid().primaryKey().defaultRandom(),
    channel: contactChannel().notNull(),
    destination: text().notNull(), // lower-case email or E.164 phone
    codeHash: text().notNull(),
    attempts: smallint().notNull().default(0),
    expiresAt: timestamptz().notNull(),
    usedAt: timestamptz(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.destination, t.createdAt.desc())],
);

/** Browser push subscriptions: a device asked to be notified about one report. */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    endpoint: text().notNull(),
    p256dh: text().notNull(),
    auth: text().notNull(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [uniqueIndex().on(t.reportId, t.endpoint), index().on(t.endpoint)],
);

export interface StoryTranslation {
  title: string;
  body: string;
}
export type StoryTranslations = Partial<Record<"si" | "ta", StoryTranslation>>;

/**
 * "Resolved case stories": short, anonymised write-ups admins choose to publish on /impact,
 * e.g. "Route 08 overcharging: operator issued refunds." Never shows passenger details.
 */
export const impactStories = pgTable(
  "impact_stories",
  {
    id: uuid().primaryKey().defaultRandom(),
    // The case it is based on (admins only); the story survives if the report is deleted
    reportId: uuid().references(() => reports.id, { onDelete: "set null" }),
    category: reportCategory(),
    routeNumber: text(),
    title: text().notNull(), // English
    body: text().notNull(),
    translations: jsonb().$type<StoryTranslations>().notNull().default({}),
    published: boolean().notNull().default(false),
    publishedAt: timestamptz(),
    createdBy: text(),
    createdAt: timestamptz().notNull().defaultNow(),
    updatedAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.published, t.publishedAt.desc())],
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
  messages: many(reportMessages),
}));

export const reportMessagesRelations = relations(reportMessages, ({ one }) => ({
  report: one(reports, { fields: [reportMessages.reportId], references: [reports.id] }),
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
export type MessageRow = typeof reportMessages.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type StoryRow = typeof impactStories.$inferSelect;
export type NewStoryRow = typeof impactStories.$inferInsert;
