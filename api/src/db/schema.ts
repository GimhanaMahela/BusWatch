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
  type AccessibilityIssue,
  type AccidentInvolvement,
  ADMIN_ROLES,
  BUS_SERVICES,
  type Commendee,
  type InjuryLevel,
  type RoadHazard,
  type VehicleKind,
  CONTACT_CHANNELS,
  LANGUAGES,
  MESSAGE_SENDERS,
  METRIC_EVENTS,
  REPORT_CATEGORIES,
  REPORT_SOURCES,
  REPORT_STATUSES,
  REPORT_TYPES,
  type ReportCategory,
  type SafetyKind,
  SERVICE_CLASSES,
  type ServiceClass,
} from "../config/constants.js";
import type { ReportDraft } from "../services/assistant.service.js";

// Every table has row level security on, with no policies. On Supabase that keeps the tables out
// of its public Data API (the anon key); the app connects as the tables' owner, which RLS doesn't
// apply to, so it sees everything as before. New tables need `.enableRLS()` too (a test checks).

// Column names are snake_case in the database; Drizzle maps them from the camelCase keys
// (`casing: "snake_case"` in db/client.ts and drizzle.config.ts).

const timestamptz = () => timestamp({ withTimezone: true });

export const adminRole = pgEnum("admin_role", ADMIN_ROLES);
export const reportStatus = pgEnum("report_status", REPORT_STATUSES);
export const reportCategory = pgEnum("report_category", REPORT_CATEGORIES);
export const busService = pgEnum("bus_service", BUS_SERVICES);
export const reportType = pgEnum("report_type", REPORT_TYPES);
export const reportSource = pgEnum("report_source", REPORT_SOURCES);
export const language = pgEnum("language", LANGUAGES);
export const metricEvent = pgEnum("metric_event", METRIC_EVENTS);
export const messageSender = pgEnum("message_sender", MESSAGE_SENDERS);
export const contactChannel = pgEnum("contact_channel", CONTACT_CHANNELS);
export const serviceClass = pgEnum("service_class", SERVICE_CLASSES);

export const admins = pgTable("admins", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(), // stored lower-case
  passwordHash: text().notNull(),
  role: adminRole().notNull().default("admin"),
  // Operators: the company or owner name passengers see next to their responses
  organisation: text(),
  createdAt: timestamptz().notNull().defaultNow(),
}).enableRLS();

/** Operator portal: the buses an operator account owns (bus numbers normalised, e.g. "NB1234"). */
export const operatorBuses = pgTable(
  "operator_buses",
  {
    operatorId: uuid()
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    busNumber: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.operatorId, t.busNumber] }), index().on(t.busNumber)],
).enableRLS();

export const reports = pgTable(
  "reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    receiptId: text().notNull().unique(),
    type: reportType().notNull().default("complaint"),
    // Stored upper-case. Empty for road incidents: they are not about a route bus, and the
    // vehicle's plate (admins only) is kept in details.road instead
    busNumber: text().notNull(),
    routeNumber: text().notNull(), // empty for road incidents
    busName: text(),
    // Private, SLTB (government) or Metro Bus; null for road incidents and older reports
    busService: busService(),
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
    // AI help for admins: suggested category, English translation and summary (admins only)
    aiInsights: jsonb().$type<AiInsights>(),
    // Copies of the photos with faces and number plates blurred (null until an admin runs it).
    // Operators only ever see these.
    blurredImages: text().array(),
    // Structured extras for some categories: accessibility issues, the official fare for an
    // overcharging complaint, what happened on the safety-mode form, or a road incident's vehicle
    details: jsonb().$type<ReportDetails>(),
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
).enableRLS();

/** The official fare, worked out by the server from the admins' fare tables (never the browser). */
export interface FareEvidence {
  routeNumber: string;
  routeName: string;
  from: string;
  to: string;
  stages: number;
  serviceClass: ServiceClass;
  officialFare: number;
  /** What the passenger says they were charged, if they said */
  chargedFare: number | null;
  /** The fare table's effective date, so old evidence can be read against the right fares */
  effectiveFrom: string | null;
}

/**
 * A road incident: the vehicle (not for road hazards), and what kind of accident or hazard. The
 * plate is shown to admins only, never on the tracking page or anywhere public.
 */
export interface RoadIncidentDetails {
  vehicle?: {
    kind: VehicleKind;
    /** Upper-case, may be partial ("WP CA?-12"), null when not seen */
    plate: string | null;
    colour: string | null;
    make: string | null;
  };
  accident?: {
    involvement: AccidentInvolvement;
    injuries: InjuryLevel;
    vehiclesInvolved: number | null;
  };
  hazard?: RoadHazard;
}

export interface ReportDetails {
  accessibility?: AccessibilityIssue[];
  road?: RoadIncidentDetails;
  fare?: FareEvidence;
  /** Filed from the quick, quiet safety-mode form */
  safety?: { kinds: SafetyKind[] };
  /** Commendations: who the passenger is thanking */
  commendee?: Commendee;
}

export interface AiInsights {
  detectedLanguage: "en" | "si" | "ta" | "other";
  /** English translation when the description isn't in English */
  englishTranslation: string | null;
  /** Short summary for long descriptions */
  summary: string | null;
  suggestedCategory: ReportCategory;
  categoryConfidence: "low" | "medium" | "high";
  categoryReason: string;
  /** Things an admin should look at before acting or publishing */
  flags: ("personal_details" | "abusive_language" | "possible_emergency" | "not_a_bus_issue")[];
  model: string;
  generatedAt: string;
}

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
).enableRLS();

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
).enableRLS();

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
).enableRLS();

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
).enableRLS();

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
).enableRLS();

/** Telegram chats following a report: the passenger pressed Start on the TransitX bot. */
export const telegramSubscriptions = pgTable(
  "telegram_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    chatId: text().notNull(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [uniqueIndex().on(t.reportId, t.chatId), index().on(t.chatId)],
).enableRLS();

/** WhatsApp numbers following a report: they filed it on WhatsApp or sent the bot its receipt ID. */
export const whatsappSubscriptions = pgTable(
  "whatsapp_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    phone: text().notNull(), // E.164, +94771234567
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [uniqueIndex().on(t.reportId, t.phone), index().on(t.phone)],
).enableRLS();

export interface WhatsAppTurn {
  role: "user" | "assistant";
  text: string;
}

/** A photo, video or voice note the passenger sent the bot; fetched from WhatsApp when needed. */
export interface WhatsAppMedia {
  id: string;
  kind: "image" | "video";
  mimeType: string;
}

/**
 * One WhatsApp conversation with the bot. The history and the report being written are only kept
 * while the chat is active: they are cleared once the report is sent, on "stop", and when the chat
 * has been quiet for a day. The row itself remembers when the passenger last wrote, because
 * WhatsApp only allows free-form updates within 24 hours of that.
 */
export const whatsappChats = pgTable("whatsapp_chats", {
  phone: text().primaryKey(), // E.164
  language: language().notNull().default("en"),
  history: jsonb().$type<WhatsAppTurn[]>().notNull().default([]),
  // The report the helper has put together so far (see assistant.service ReportDraft)
  draft: jsonb().$type<ReportDraft>(),
  media: jsonb().$type<WhatsAppMedia[]>().notNull().default([]),
  latitude: doublePrecision(),
  longitude: doublePrecision(),
  // The passenger was shown the finished report and asked to send it
  awaitingConfirmation: boolean().notNull().default(false),
  lastInboundAt: timestamptz().notNull().defaultNow(),
  // Simple per-number rate limit: messages counted since windowStartedAt
  windowStartedAt: timestamptz().notNull().defaultNow(),
  windowCount: integer().notNull().default(0),
  updatedAt: timestamptz().notNull().defaultNow(),
}).enableRLS();

/**
 * IDs of incoming WhatsApp messages already handled. Meta re-sends a webhook call when it doesn't
 * get a quick answer, and the same message must not file two reports.
 */
export const whatsappInbound = pgTable(
  "whatsapp_inbound",
  {
    messageId: text().primaryKey(),
    receivedAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.receivedAt)],
).enableRLS();

/**
 * "Me too" confirmations: another passenger saw the same incident and backed up the report
 * instead of filing a duplicate. Anonymous: no contact details are asked for.
 */
export const reportConfirmations = pgTable(
  "report_confirmations",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    comment: text(), // what they saw, for admins only
    language: language().notNull().default("en"),
    source: reportSource().notNull().default("web"),
    // Keyed hash of the device's IP address and browser, so a device confirms a report only once.
    // It can't be turned back into an IP address and is never shown.
    deviceHash: text().notNull(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [uniqueIndex().on(t.reportId, t.deviceHash), index().on(t.reportId, t.createdAt)],
).enableRLS();

/**
 * Operator portal: what the bus owner says they did about a report ("Driver suspended for a week").
 * Shown to the passenger on the tracking page unless an admin hides it.
 */
export const operatorResponses = pgTable(
  "operator_responses",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    operatorId: uuid().references(() => admins.id, { onDelete: "set null" }),
    organisation: text(), // name at the time, so it survives the account
    body: text().notNull(),
    hidden: boolean().notNull().default(false),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.reportId, t.createdAt)],
).enableRLS();

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
).enableRLS();

/** Fare checker: the NTC fare for each number of fare stages travelled, per service class. */
export const fareTables = pgTable("fare_tables", {
  serviceClass: serviceClass().primaryKey(),
  // fares[0] is the fare for one stage (the minimum fare), fares[1] for two stages, and so on
  fares: integer().array().notNull(),
  effectiveFrom: date({ mode: "string" }),
  updatedBy: text(),
  updatedAt: timestamptz().notNull().defaultNow(),
}).enableRLS();

export interface FareStop {
  name: string;
  /** The fare stage this halt is in (from the route's NTC fare-stage list) */
  stage: number;
}

/** Fare checker: a route's halts and their fare stages, entered by admins. */
export const fareRoutes = pgTable("fare_routes", {
  id: uuid().primaryKey().defaultRandom(),
  // Trimmed and lower-case, like route scorecards ("08", "138", "ex-1")
  routeKey: text().notNull().unique(),
  routeNumber: text().notNull(),
  name: text().notNull(), // "Colombo - Kandy"
  serviceClasses: serviceClass().array().notNull().default(["normal"]),
  stops: jsonb().$type<FareStop[]>().notNull(),
  updatedBy: text(),
  updatedAt: timestamptz().notNull().defaultNow(),
}).enableRLS();

/**
 * "Share my trip" (safety mode): a passenger's live position for a trusted contact. Only the latest
 * position is kept, and it is cleared when the trip ends.
 */
export const tripShares = pgTable(
  "trip_shares",
  {
    // Random and unguessable: it is the link the contact opens
    id: text().primaryKey(),
    // Hash of the secret only the passenger's phone holds; needed to send positions or end the trip
    ownerTokenHash: text().notNull(),
    busNumber: text(),
    routeNumber: text(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    accuracy: doublePrecision(), // metres
    positionAt: timestamptz(),
    startedAt: timestamptz().notNull().defaultNow(),
    expiresAt: timestamptz().notNull(),
    endedAt: timestamptz(),
  },
  (t) => [index().on(t.startedAt)],
).enableRLS();

/** Anonymous daily counters for the Phase 1 success metrics (no personal data). */
export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    day: date({ mode: "string" }).notNull(),
    event: metricEvent().notNull(),
    count: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.event] })],
).enableRLS();

export const reportsRelations = relations(reports, ({ many }) => ({
  statusHistory: many(reportStatusChanges),
  notes: many(reportNotes),
  messages: many(reportMessages),
  confirmations: many(reportConfirmations),
  operatorResponses: many(operatorResponses),
}));

export const operatorResponsesRelations = relations(operatorResponses, ({ one }) => ({
  report: one(reports, { fields: [operatorResponses.reportId], references: [reports.id] }),
}));

export const reportConfirmationsRelations = relations(reportConfirmations, ({ one }) => ({
  report: one(reports, { fields: [reportConfirmations.reportId], references: [reports.id] }),
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
export type FareRouteRow = typeof fareRoutes.$inferSelect;
export type FareTableRow = typeof fareTables.$inferSelect;
export type TripShareRow = typeof tripShares.$inferSelect;
export type NewStoryRow = typeof impactStories.$inferInsert;
