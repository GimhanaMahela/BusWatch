// Builds a realistic, repeatable data set for local development and demos: staff and operator
// accounts, fleets, a few hundred reports of every type with their timelines, notes, messages,
// "me too" confirmations, operator responses and ratings, impact stories, fare tables and routes,
// a shared trip and the daily usage counters. Run it with `npm run db:seed` (see scripts/seed.ts).
//
// The same random seed gives the same data, with dates placed relative to `now`, so dashboards
// always look current.

import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import {
  METRIC_EVENTS,
  PUBLIC_STATUSES,
  ROAD_CATEGORIES_WITHOUT_VEHICLE,
  type InjuryLevel,
  type Language,
  type MetricEvent,
  type ReportCategory,
  type ReportSource,
  type ReportStatus,
  type ReportType,
  type SafetyKind,
  type VehicleKind,
} from "../../config/constants.js";
import { normaliseBusNumber } from "../../utils/bus-number.js";
import type { Database } from "../client.js";
import {
  admins,
  dailyMetrics,
  fareRoutes,
  fareTables,
  impactStories,
  operatorBuses,
  operatorResponses,
  reportConfirmations,
  reportMessages,
  reportNotes,
  reportStatusChanges,
  reports,
  tripShares,
  type AiInsights,
  type FareEvidence,
  type NewReportRow,
  type ReportDetails,
} from "../schema.js";
import {
  ACCESSIBILITY_SETS,
  BUSES,
  buildFareTable,
  COMMENDATION_NOTES,
  COMMENDATION_TEXTS,
  COMMENDEE_FOR,
  COMPLAINT_TEXTS,
  CONFIRMATION_COMMENTS,
  CONVERSATIONS,
  DEFAULT_SEED_PASSWORD,
  FARE_TABLE_EFFECTIVE_FROM,
  INTERNAL_NOTES,
  LOST_ITEM_NOTES,
  LOST_ITEM_TEXTS,
  OPERATOR_RESPONSES,
  OPERATORS,
  PASSENGER_EMAILS,
  PASSENGER_PHONES,
  PLACES,
  PLATES,
  PUBLIC_NOTES,
  ROAD_NOTES,
  ROAD_TEXTS,
  ROUTES,
  SAFETY_DESCRIPTIONS,
  STAFF,
  STORIES,
  VEHICLE_LOOKS,
  type PlaceName,
  type SeedBus,
  type SeedRoute,
  type SeedText,
} from "./catalogue.js";

export interface SeedOptions {
  /** Dates are placed relative to this (default: the current time) */
  now?: Date;
  /** Password for every seeded account */
  password?: string;
  /** Random seed: the same number gives the same data */
  randomSeed?: number;
  /** How many reports to create, roughly (default 220) */
  reportCount?: number;
}

export interface SeedSummary {
  staff: { email: string; role: string }[];
  operators: { email: string; organisation: string; buses: string[] }[];
  password: string;
  counts: Record<string, number>;
  /** Link path of the live shared trip, for trying the trip page */
  liveTripPath: string;
  /** A receipt ID with a conversation, for trying the tracking page */
  sampleReceiptIds: string[];
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------- Deterministic randomness

/** mulberry32: small, fast and good enough for sample data. */
const createRandom = (seed: number) => {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const chance = (p: number) => next() < p;
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error("pick() from an empty list");
    return items[Math.floor(next() * items.length)] as T;
  };
  const weighted = <T>(items: readonly (readonly [T, number])[]): T => {
    const total = items.reduce((sum, [, w]) => sum + w, 0);
    let roll = next() * total;
    for (const [item, w] of items) {
      roll -= w;
      if (roll < 0) return item;
    }
    return items[items.length - 1]![0];
  };
  const hex = (bytes: number) =>
    Array.from({ length: bytes }, () => int(0, 255).toString(16).padStart(2, "0")).join("");
  /** A version-4 UUID built from the seeded generator, so ids are repeatable too. */
  const uuid = () => {
    const h = hex(16).split("");
    h[12] = "4";
    h[16] = "89ab"[int(0, 3)]!;
    const s = h.join("");
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  };
  return { next, int, chance, pick, weighted, hex, uuid };
};

type Random = ReturnType<typeof createRandom>;

// Same alphabet as utils/receipt-id.ts
const RECEIPT_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const dayKey = (at: Date) => at.toISOString().slice(0, 10);

/** Inserts in chunks so large tables stay under PostgreSQL's parameter limit. */
const insertChunked = async <T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) => {
  for (let i = 0; i < rows.length; i += 200) await insert(rows.slice(i, i + 200));
};

// ---------------------------------------------------------------- Report building blocks

const COMPLAINT_WEIGHTS: readonly (readonly [ReportCategory, number])[] = [
  ["reckless_driving", 20],
  ["overcharging", 12],
  ["refused_to_stop", 10],
  ["staff_behaviour", 9],
  ["overcrowding", 9],
  ["no_ticket", 8],
  ["loud_music", 7],
  ["vehicle_condition", 7],
  ["harassment", 6],
  ["accessibility", 5],
  ["other", 3],
];

const COMMENDATION_WEIGHTS: readonly (readonly [ReportCategory, number])[] = [
  ["safe_driving", 25],
  ["helpful_staff", 25],
  ["helped_passenger", 12],
  ["clean_vehicle", 10],
  ["on_time", 10],
  ["fair_fare", 8],
  ["comfortable_service", 8],
  ["other", 2],
];

const LOST_ITEM_WEIGHTS: readonly (readonly [ReportCategory, number])[] = [
  ["bag", 25],
  ["phone", 25],
  ["wallet", 15],
  ["documents", 10],
  ["keys", 10],
  ["clothing", 8],
  ["other", 7],
];

const ROAD_WEIGHTS: readonly (readonly [ReportCategory, number])[] = [
  ["road_hazard", 18],
  ["reckless_driving", 10],
  ["speeding", 8],
  ["accident", 8],
  ["dangerous_overtaking", 7],
  ["red_light", 6],
  ["wrong_side", 5],
  ["no_helmet", 5],
  ["illegal_parking", 5],
  ["smoke_emission", 4],
  ["phone_while_driving", 4],
  ["drunk_driving", 3],
  ["hit_and_run", 3],
  ["road_rage", 3],
  ["unsafe_load", 3],
  ["noisy_exhaust", 2],
  ["other", 2],
];

const VEHICLE_FOR: Partial<Record<ReportCategory, readonly VehicleKind[]>> = {
  no_helmet: ["motorcycle"],
  noisy_exhaust: ["motorcycle"],
  wrong_side: ["motorcycle", "three_wheeler"],
  phone_while_driving: ["three_wheeler", "car", "van"],
  unsafe_load: ["tipper", "lorry", "tractor"],
  smoke_emission: ["lorry", "private_bus", "tipper"],
  illegal_parking: ["van", "car", "school_van"],
  speeding: ["lorry", "car", "van", "private_bus"],
};

const ALL_VEHICLES: readonly VehicleKind[] = [
  "car",
  "van",
  "lorry",
  "three_wheeler",
  "motorcycle",
  "private_bus",
  "taxi",
  "government",
  "unknown",
];

const ROAD_HAZARD_SPOTS: readonly (readonly [PlaceName, ReportDetails["road"]])[] = [
  ["Kadawatha", { hazard: "pothole" }],
  ["Kadawatha", { hazard: "pothole" }],
  ["Kadawatha", { hazard: "pothole" }],
  ["Nugegoda", { hazard: "broken_signal" }],
  ["Maharagama", { hazard: "streetlight_out" }],
  ["Kelaniya", { hazard: "flooding" }],
  ["Kadugannawa", { hazard: "landslide" }],
  ["Mawanella", { hazard: "fallen_tree" }],
  ["Negombo", { hazard: "missing_sign" }],
  ["Polgahawela", { hazard: "animals" }],
  ["Malabe", { hazard: "debris" }],
];

const SOURCES: readonly (readonly [ReportSource, number])[] = [
  ["web", 70],
  ["qr", 18],
  ["whatsapp", 12],
];

/** Sri Lanka is UTC+05:30: picks a believable local hour for an incident. */
const placeInDay = (rand: Random, base: Date) => {
  const at = new Date(base);
  const localHour = rand.weighted<number>([
    [6, 6],
    [7, 10],
    [8, 9],
    [9, 5],
    [11, 3],
    [13, 4],
    [15, 4],
    [16, 6],
    [17, 9],
    [18, 7],
    [19, 4],
    [21, 2],
  ]);
  at.setUTCHours(localHour - 5, rand.int(0, 59) - 30, rand.int(0, 59), 0);
  return at;
};

const routeOf = (routeNumber: string): SeedRoute => {
  const route = ROUTES.find((r) => r.routeNumber === routeNumber);
  if (!route) throw new Error(`Unknown seed route ${routeNumber}`);
  return route;
};

const jitter = (rand: Random, place: PlaceName) => {
  const [lat, lng] = PLACES[place];
  return {
    latitude: Number((lat + (rand.next() - 0.5) * 0.008).toFixed(6)),
    longitude: Number((lng + (rand.next() - 0.5) * 0.008).toFixed(6)),
  };
};

const pickText = (rand: Random, pool: SeedText[] | undefined, language: Language): SeedText => {
  const texts = pool?.length ? pool : [{ lang: "en", text: "No description given." } as SeedText];
  // Northern routes lean Tamil, the rest lean Sinhala, but most passengers write in English
  const preferred = texts.filter((t) => t.lang === language);
  if (language !== "en" && preferred.length && rand.chance(0.7)) return rand.pick(preferred);
  const english = texts.filter((t) => t.lang === "en");
  return rand.pick(english.length ? english : texts);
};

// ---------------------------------------------------------------- Seeding

/**
 * Fills an empty, migrated database. Call it inside nothing: it opens its own transaction, so a
 * failure leaves the database as it was.
 */
export const seedDatabase = async (
  db: Database,
  options: SeedOptions = {},
): Promise<SeedSummary> => {
  const now = options.now ?? new Date();
  const password = options.password ?? DEFAULT_SEED_PASSWORD;
  const rand = createRandom(options.randomSeed ?? 20261120);
  const reportCount = options.reportCount ?? 220;

  const passwordHash = await bcrypt.hash(password, 10);
  const staffEmails = STAFF.map((s) => s.email);

  // ---------------------------------------------------------------- Accounts and fleets
  const adminRows = [
    ...STAFF.map((s) => ({
      id: rand.uuid(),
      email: s.email,
      passwordHash,
      role: s.role,
      organisation: null,
      createdAt: new Date(now.getTime() - 400 * DAY),
    })),
    ...OPERATORS.map((o) => ({
      id: rand.uuid(),
      email: o.email,
      passwordHash,
      role: "operator" as const,
      organisation: o.organisation,
      createdAt: new Date(now.getTime() - rand.int(60, 300) * DAY),
    })),
  ];
  const operatorIdByKey = new Map(
    OPERATORS.map((o) => [o.key, adminRows.find((a) => a.email === o.email)!.id]),
  );
  const fleetRows = BUSES.filter((b) => b.operator).map((b) => ({
    operatorId: operatorIdByKey.get(b.operator!)!,
    busNumber: normaliseBusNumber(b.busNumber),
  }));

  // ---------------------------------------------------------------- Fares
  const fareTableRows = (["normal", "semi_luxury", "luxury"] as const).map((serviceClass) => ({
    serviceClass,
    fares: buildFareTable(serviceClass),
    effectiveFrom: FARE_TABLE_EFFECTIVE_FROM,
    updatedBy: "superadmin@example.com",
    updatedAt: new Date(now.getTime() - 90 * DAY),
  }));
  const faresByClass = new Map(fareTableRows.map((t) => [t.serviceClass, t.fares]));
  const fareRouteRows = ROUTES.filter((r) => r.fareClasses).map((r) => ({
    id: rand.uuid(),
    routeKey: r.routeNumber.trim().toLowerCase(),
    routeNumber: r.routeNumber,
    name: r.name,
    serviceClasses: [...r.fareClasses!],
    stops: r.stops.map(([name, stage]) => ({ name, stage })),
    updatedBy: "admin@example.com",
    updatedAt: new Date(now.getTime() - rand.int(20, 80) * DAY),
  }));

  // ---------------------------------------------------------------- Reports
  const reportRows: (NewReportRow & { id: string; reportedAt: Date })[] = [];
  const statusRows: (typeof reportStatusChanges.$inferInsert)[] = [];
  const noteRows: (typeof reportNotes.$inferInsert)[] = [];
  const messageRows: (typeof reportMessages.$inferInsert)[] = [];
  const confirmationRows: (typeof reportConfirmations.$inferInsert)[] = [];
  const responseRows: (typeof operatorResponses.$inferInsert)[] = [];
  const usedReceipts = new Set<string>();
  const latest = now.getTime() - 10 * 60 * 1000;

  const receiptFor = (at: Date) => {
    for (;;) {
      let suffix = "";
      for (let i = 0; i < 6; i++) suffix += rand.pick(RECEIPT_ALPHABET.split(""));
      const id = `BW-${at.getFullYear()}-${suffix}`;
      if (!usedReceipts.has(id)) {
        usedReceipts.add(id);
        return id;
      }
    }
  };

  const busWeights = (type: ReportType) =>
    BUSES.map((b): [SeedBus, number] => {
      const lean = {
        complaint: { poor: 3, mixed: 1.5, good: 0.3 },
        commendation: { poor: 0.3, mixed: 1, good: 3 },
      };
      const factor = type === "complaint" || type === "commendation" ? lean[type][b.profile] : 1;
      return [b, b.weight * factor];
    });

  /** Weighted towards recent days, spread over about ten months for the monthly trend. */
  const reportedAtFor = () => {
    const daysAgo = Math.floor(300 * rand.next() ** 1.8);
    const base = new Date(now.getTime() - daysAgo * DAY);
    const at = placeInDay(rand, base);
    return at.getTime() > latest ? new Date(latest - rand.int(1, 120) * 60 * 1000) : at;
  };

  /** Decides where a report has got to, given how old it is. */
  const finalStatusFor = (type: ReportType, ageDays: number): ReportStatus => {
    if (ageDays < 1) return rand.chance(0.85) ? "pending" : "reviewed";
    if (ageDays < 4)
      return rand.weighted<ReportStatus>([
        ["pending", 5],
        ["reviewed", 4],
        ["escalated", 1],
      ]);
    if (type === "commendation")
      return rand.weighted<ReportStatus>([
        ["reviewed", 4],
        ["resolved", 6],
      ]);
    if (type === "lost_item")
      return rand.weighted<ReportStatus>([
        ["reviewed", 3],
        ["resolved", 5],
        ["rejected", 2],
      ]);
    return rand.weighted<ReportStatus>([
      ["pending", 1],
      ["reviewed", 3],
      ["escalated", 2],
      ["resolved", 7],
      ["rejected", 2],
    ]);
  };

  const notesFor = (type: ReportType): Partial<Record<ReportStatus, readonly (string | null)[]>> =>
    type === "commendation"
      ? COMMENDATION_NOTES
      : type === "lost_item"
        ? LOST_ITEM_NOTES
        : type === "road_incident"
          ? ROAD_NOTES
          : PUBLIC_NOTES;

  const firstNote: Record<ReportType, string> = {
    complaint: "Report received.",
    commendation: "Commendation received.",
    lost_item: "Lost item report received. We've passed it on to the bus operator where we can.",
    road_incident: "Road incident report received.",
  };

  /** Writes the timeline, returning the status the report actually reached and when it closed. */
  const buildTimeline = (
    reportId: string,
    type: ReportType,
    reportedAt: Date,
    target: ReportStatus,
  ) => {
    const path: ReportStatus[] =
      target === "pending"
        ? []
        : target === "reviewed"
          ? ["reviewed"]
          : target === "escalated"
            ? ["reviewed", "escalated"]
            : target === "rejected"
              ? rand.chance(0.5)
                ? ["rejected"]
                : ["reviewed", "rejected"]
              : rand.chance(0.35)
                ? ["reviewed", "escalated", "resolved"]
                : ["reviewed", "resolved"];

    statusRows.push({
      reportId,
      status: "pending",
      note: firstNote[type],
      changedBy: null,
      changedAt: reportedAt,
    });
    let at = reportedAt.getTime();
    let reached: ReportStatus = "pending";
    let resolvedAt: Date | null = null;
    for (const status of path) {
      at +=
        status === "reviewed"
          ? rand.int(2, 30) * HOUR
          : rand.int(1, 6) * DAY + rand.int(0, 20) * HOUR;
      if (at > latest) break;
      const pool = notesFor(type)[status] ?? [null];
      statusRows.push({
        reportId,
        status,
        note: rand.pick(pool),
        changedBy: rand.pick(staffEmails),
        changedAt: new Date(at),
      });
      reached = status;
      if (status === "resolved") resolvedAt = new Date(at);
    }
    return { status: reached, resolvedAt, lastChangeAt: new Date(at > latest ? latest : at) };
  };

  const contactFor = (required: boolean) => {
    const hasEmail = required || rand.chance(0.55);
    const email = hasEmail ? rand.pick(PASSENGER_EMAILS) : null;
    const phone = (!email && required) || rand.chance(0.15) ? rand.pick(PASSENGER_PHONES) : null;
    return { passengerEmail: email, passengerPhone: phone };
  };

  const insightsFor = (
    text: SeedText,
    category: ReportCategory,
    generatedAt: Date,
  ): AiInsights => ({
    detectedLanguage: text.lang,
    englishTranslation: text.english ?? null,
    summary: null,
    suggestedCategory: category,
    categoryConfidence: rand.weighted([
      ["high", 6],
      ["medium", 3],
      ["low", 1],
    ] as const),
    categoryReason: "The description matches this category.",
    flags: category === "harassment" ? ["possible_emergency"] : [],
    model: "gemini-flash-latest",
    generatedAt: generatedAt.toISOString(),
  });

  const fareEvidenceFor = (
    bus: SeedBus,
  ): { evidence: FareEvidence; from: string; to: string } | null => {
    const route = fareRouteRows.find((r) => r.routeNumber === bus.routeNumber);
    if (!route) return null;
    const serviceClass = route.serviceClasses.includes(bus.serviceClass)
      ? bus.serviceClass
      : "normal";
    const a = rand.int(0, route.stops.length - 2);
    const b = rand.int(a + 1, Math.min(route.stops.length - 1, a + 5));
    const from = route.stops[a]!;
    const to = route.stops[b]!;
    const stages = Math.max(Math.abs(to.stage - from.stage), 1);
    const official = faresByClass.get(serviceClass)![stages - 1]!;
    const charged = official + rand.pick([10, 15, 20, 30, 50]);
    return {
      from: from.name,
      to: to.name,
      evidence: {
        routeNumber: route.routeNumber,
        routeName: route.name,
        from: from.name,
        to: to.name,
        stages,
        serviceClass,
        officialFare: official,
        chargedFare: charged,
        effectiveFrom: FARE_TABLE_EFFECTIVE_FROM,
      },
    };
  };

  for (let i = 0; i < reportCount; i++) {
    const type = rand.weighted<ReportType>([
      ["complaint", 58],
      ["commendation", 22],
      ["lost_item", 8],
      ["road_incident", 12],
    ]);
    const id = rand.uuid();
    const reportedAt = reportedAtFor();
    const incidentAt = new Date(reportedAt.getTime() - rand.int(10, 36 * 60) * 60 * 1000);
    const ageDays = (now.getTime() - reportedAt.getTime()) / DAY;

    let bus: SeedBus | null = null;
    let place: PlaceName;
    let category: ReportCategory;
    let description: string;
    let text: SeedText;
    let details: ReportDetails | null = null;
    let language: Language = "en";

    if (type === "road_incident") {
      category = rand.weighted(ROAD_WEIGHTS);
      if (category === "road_hazard") {
        const [spot, road] = rand.pick(ROAD_HAZARD_SPOTS);
        place = spot;
        details = { road };
      } else {
        place = rand.pick(Object.keys(PLACES) as PlaceName[]);
        const look = rand.pick(VEHICLE_LOOKS);
        details = {
          road: {
            vehicle: {
              kind: rand.pick(VEHICLE_FOR[category] ?? ALL_VEHICLES),
              plate: rand.chance(0.8) ? rand.pick(PLATES) : null,
              colour: look.colour,
              make: look.make,
            },
          },
        };
        if (category === "accident") {
          details.road!.accident = {
            involvement: rand.chance(0.3) ? "involved" : "witness",
            injuries: rand.weighted<InjuryLevel>([
              ["none", 3],
              ["minor", 4],
              ["serious", 1],
              ["unknown", 2],
            ]),
            vehiclesInvolved: rand.int(2, 3),
          };
        }
      }
      // Keep the vehicle rule the form enforces
      if ((ROAD_CATEGORIES_WITHOUT_VEHICLE as readonly ReportCategory[]).includes(category)) {
        delete details?.road?.vehicle;
      }
      text = {
        lang: "en",
        text: fill(rand.pick(ROAD_TEXTS[category] ?? ROAD_TEXTS.other!), { place }),
      };
      description = text.text;
    } else {
      bus = rand.weighted(busWeights(type));
      const route = routeOf(bus.routeNumber);
      place = rand.pick(route.stops)[0];
      const northern = bus.routeNumber === "87" || bus.routeNumber === "750";
      language = rand.chance(northern ? 0.55 : 0.2) ? (northern ? "ta" : "si") : "en";

      if (type === "complaint") {
        category = rand.weighted(COMPLAINT_WEIGHTS);
        const safetyMode = category === "harassment" && rand.chance(0.4);
        let values: Record<string, string | number> = {
          place,
          route: bus.routeNumber,
          bus: bus.busNumber,
        };
        if (category === "overcharging") {
          const fare = fareEvidenceFor(bus);
          if (fare) {
            details = { fare: fare.evidence };
            values = {
              ...values,
              from: fare.from,
              to: fare.to,
              charged: fare.evidence.chargedFare!,
              official: fare.evidence.officialFare,
            };
          }
        }
        if (category === "accessibility")
          details = { accessibility: [...rand.pick(ACCESSIBILITY_SETS)] };
        if (safetyMode) {
          const kinds = rand.pick<SafetyKind[]>([
            ["staring", "followed"],
            ["touching"],
            ["verbal", "filmed"],
            ["filmed"],
          ]);
          details = { safety: { kinds } };
          text = rand.pick(SAFETY_DESCRIPTIONS);
        } else {
          let pool = COMPLAINT_TEXTS[category];
          // Overcharging texts that quote fares need fare evidence
          if (category === "overcharging" && !details?.fare)
            pool = pool?.filter((t) => !t.text.includes("{from}"));
          text = pickText(rand, pool, language);
        }
        description = fill(text.text, values);
      } else if (type === "commendation") {
        category = rand.weighted(COMMENDATION_WEIGHTS);
        details = { commendee: rand.pick(COMMENDEE_FOR[category] ?? ["crew"]) };
        text = pickText(rand, COMMENDATION_TEXTS[category], language);
        description = fill(text.text, { place, route: bus.routeNumber });
      } else {
        category = rand.weighted(LOST_ITEM_WEIGHTS);
        text = { lang: "en", text: fill(rand.pick(LOST_ITEM_TEXTS[category]!), { place }) };
        description = text.text;
      }
      if (text.lang !== "en") language = text.lang;
    }

    const target = finalStatusFor(type, ageDays);
    const timeline = buildTimeline(id, type, reportedAt, target);
    const contact = contactFor(type === "lost_item");
    const closed = timeline.status === "resolved" || timeline.status === "rejected";
    const rated = closed && type !== "commendation" && rand.chance(0.5);
    const rating = rated
      ? timeline.status === "resolved"
        ? rand.weighted([
            [5, 5],
            [4, 4],
            [3, 1],
          ])
        : rand.weighted([
            [1, 3],
            [2, 2],
            [3, 1],
          ])
      : null;
    const source: ReportSource =
      type === "lost_item" || type === "road_incident"
        ? rand.chance(0.85)
          ? "web"
          : "qr"
        : rand.weighted(SOURCES);
    const withAi = text.lang !== "en" || rand.chance(0.15);
    const { latitude, longitude } = jitter(rand, place);

    reportRows.push({
      id,
      receiptId: receiptFor(reportedAt),
      type,
      busNumber: bus ? bus.busNumber : "",
      routeNumber: bus ? bus.routeNumber : "",
      busName: bus?.busName ?? null,
      busService: bus?.busService ?? null,
      category,
      // Safety-mode reports may come without a place
      location:
        details?.safety && rand.chance(0.5)
          ? null
          : `${place}${rand.chance(0.3) ? " bus halt" : ""}`,
      latitude: rand.chance(0.75) ? latitude : null,
      longitude: null, // set just below, so both are present or both missing
      description,
      images: [],
      videos: [],
      incidentAt,
      reportedAt,
      ...contact,
      language,
      source,
      status: timeline.status,
      resolvedAt: timeline.resolvedAt,
      pdfUrl: null,
      outcomeRating: rating,
      outcomeFeedback:
        rating && rand.chance(0.5)
          ? rating >= 4
            ? "Thank you for following up so quickly."
            : "Nothing really changed on this bus."
          : null,
      ratedAt: rating
        ? new Date(Math.min(latest, timeline.lastChangeAt.getTime() + rand.int(1, 48) * HOUR))
        : null,
      hiddenFromPublic: false,
      aiInsights: withAi
        ? insightsFor(text, category, new Date(reportedAt.getTime() + 2 * 60 * 1000))
        : null,
      blurredImages: null,
      details,
    });
    const row = reportRows[reportRows.length - 1]!;
    if (row.latitude !== null) row.longitude = longitude;

    // Internal notes
    if (row.status !== "pending" && rand.chance(0.3)) {
      noteRows.push({
        reportId: id,
        text: rand.pick(INTERNAL_NOTES),
        author: rand.pick(staffEmails),
        createdAt: new Date(reportedAt.getTime() + rand.int(3, 40) * HOUR),
      });
    }

    // Two-way conversation on some complaints
    if (type === "complaint" && row.status !== "pending" && rand.chance(0.2)) {
      const [question, answer] = rand.pick(CONVERSATIONS);
      const askedAt = new Date(reportedAt.getTime() + rand.int(3, 20) * HOUR);
      if (askedAt.getTime() < latest) {
        const answered = rand.chance(0.8);
        const answeredAt = new Date(askedAt.getTime() + rand.int(1, 12) * HOUR);
        messageRows.push({
          reportId: id,
          sender: "admin",
          body: question,
          author: rand.pick(staffEmails),
          createdAt: askedAt,
          readAt: answered ? new Date(askedAt.getTime() + 30 * 60 * 1000) : null,
        });
        if (answered && answeredAt.getTime() < latest) {
          messageRows.push({
            reportId: id,
            sender: "passenger",
            body: fill(answer, { place }),
            author: null,
            createdAt: answeredAt,
            // Leave some unread so the admin inbox has something in it
            readAt: rand.chance(0.7)
              ? new Date(Math.min(latest, answeredAt.getTime() + 2 * HOUR))
              : null,
          });
        }
      }
    }

    // "Me too" confirmations from other passengers on recent complaints
    if (type === "complaint" && ageDays < 60 && rand.chance(0.3)) {
      for (let c = rand.int(1, 6); c > 0; c--) {
        confirmationRows.push({
          reportId: id,
          comment: rand.pick(CONFIRMATION_COMMENTS),
          language,
          source: rand.chance(0.9) ? "web" : "qr",
          deviceHash: rand.hex(32),
          createdAt: new Date(Math.min(latest, reportedAt.getTime() + rand.int(1, 72) * HOUR)),
        });
      }
    }

    // Operator portal responses on their own buses' checked complaints and lost items
    const operatorKey = bus?.operator;
    const visibleToOperator =
      (PUBLIC_STATUSES as readonly ReportStatus[]).includes(row.status!) ||
      (type === "lost_item" && row.status !== "rejected");
    if (
      operatorKey &&
      visibleToOperator &&
      (type === "complaint" || type === "lost_item") &&
      rand.chance(0.5)
    ) {
      const respondedAt = new Date(Math.min(latest, reportedAt.getTime() + rand.int(1, 5) * DAY));
      responseRows.push({
        reportId: id,
        operatorId: operatorIdByKey.get(operatorKey)!,
        organisation: OPERATORS.find((o) => o.key === operatorKey)!.organisation,
        body:
          type === "lost_item"
            ? "We found this on the bus at the end of the trip. It is at our depot office; please bring your NIC."
            : rand.pick(OPERATOR_RESPONSES),
        hidden: false,
        createdAt: respondedAt,
      });
    }
  }

  // An admin keeps two disputed reports out of the public figures, and hides one operator reply
  const disputed = reportRows
    .filter((r) => r.type === "complaint" && r.status === "reviewed")
    .slice(0, 2);
  for (const r of disputed) {
    r.hiddenFromPublic = true;
    noteRows.push({
      reportId: r.id,
      text: "Hidden from public figures: the operator disputes this and we're waiting for CCTV.",
      author: "superadmin@example.com",
      createdAt: new Date(r.reportedAt.getTime() + 2 * DAY),
    });
  }
  if (responseRows[0]) responseRows[0].hidden = true;

  // ---------------------------------------------------------------- Impact stories
  const storyRows = STORIES.map((s) => {
    const basedOn = reportRows.find(
      (r) =>
        r.category === s.category &&
        r.status === "resolved" &&
        (!s.routeNumber || r.routeNumber === s.routeNumber),
    );
    const at = new Date(now.getTime() - s.daysAgo * DAY);
    return {
      reportId: basedOn?.id ?? null,
      category: s.category,
      routeNumber: s.routeNumber,
      title: s.title,
      body: s.body,
      translations: s.translations,
      published: s.published,
      publishedAt: s.published ? at : null,
      createdBy: "admin@example.com",
      createdAt: new Date(at.getTime() - DAY),
      updatedAt: at,
    };
  });

  // ---------------------------------------------------------------- Shared trips
  const liveTripId = rand.hex(16);
  const [tripLat, tripLng] = PLACES.Nugegoda;
  const tripRows = [
    {
      id: liveTripId,
      ownerTokenHash: sha256(`seed-owner-${liveTripId}`),
      busNumber: "NB-2245",
      routeNumber: "138",
      latitude: tripLat,
      longitude: tripLng,
      accuracy: 18,
      positionAt: new Date(now.getTime() - 40 * 1000),
      startedAt: new Date(now.getTime() - 25 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 6 * HOUR - 25 * 60 * 1000),
      endedAt: null,
    },
    {
      // Ended yesterday: the position has been wiped
      id: rand.hex(16),
      ownerTokenHash: sha256(rand.hex(16)),
      busNumber: "NB-4521",
      routeNumber: "02",
      latitude: null,
      longitude: null,
      accuracy: null,
      positionAt: null,
      startedAt: new Date(now.getTime() - 26 * HOUR),
      expiresAt: new Date(now.getTime() - 20 * HOUR),
      endedAt: new Date(now.getTime() - 24 * HOUR),
    },
  ];

  // ---------------------------------------------------------------- Daily usage counters
  // Submissions match the seeded reports; the rest are believable funnels around them
  const submittedPerDay = new Map<string, Partial<Record<MetricEvent, number>>>();
  const bump = (day: string, event: MetricEvent, by = 1) => {
    const counts = submittedPerDay.get(day) ?? {};
    counts[event] = (counts[event] ?? 0) + by;
    submittedPerDay.set(day, counts);
  };
  const submittedEvent: Record<ReportType, MetricEvent> = {
    complaint: "report_submitted",
    commendation: "commendation_submitted",
    lost_item: "lost_item_submitted",
    road_incident: "road_incident_submitted",
  };
  for (const r of reportRows) {
    const day = dayKey(r.reportedAt);
    bump(day, submittedEvent[r.type!]);
    if (r.details?.safety) bump(day, "safety_report_submitted");
    if (r.source === "qr") bump(day, "qr_scan");
    if (r.source === "whatsapp") bump(day, "whatsapp_message", rand.int(6, 14));
    if (r.aiInsights) bump(day, "ai_analysis");
  }
  for (const m of messageRows)
    bump(dayKey(m.createdAt!), m.sender === "admin" ? "admin_message" : "passenger_message");
  for (const c of confirmationRows) bump(dayKey(c.createdAt!), "report_confirmed");
  for (const o of responseRows) bump(dayKey(o.createdAt!), "operator_response");

  const metricRows: { day: string; event: MetricEvent; count: number }[] = [];
  for (let d = 120; d >= 0; d--) {
    const day = dayKey(new Date(now.getTime() - d * DAY));
    const counts = submittedPerDay.get(day) ?? {};
    const reportsToday = counts.report_submitted ?? 0;
    const commendsToday = counts.commendation_submitted ?? 0;
    const traffic = 0.6 + rand.next() * 0.8;
    const generated: Partial<Record<MetricEvent, number>> = {
      report_form_started: reportsToday * rand.int(2, 3) + Math.round(rand.int(1, 6) * traffic),
      commendation_form_started: commendsToday * 2 + rand.int(0, 3),
      qr_scan: rand.int(0, 4),
      tracking_view: Math.round(rand.int(8, 25) * traffic),
      tracking_return_view: Math.round(rand.int(3, 12) * traffic),
      report_shared: rand.int(0, 3),
      offline_report_queued: rand.chance(0.3) ? rand.int(1, 2) : 0,
      app_installed: rand.chance(0.5) ? rand.int(1, 3) : 0,
      impact_view: Math.round(rand.int(5, 30) * traffic),
      scorecard_view: Math.round(rand.int(10, 40) * traffic),
      my_reports_signin: rand.int(0, 4),
      push_subscribed: rand.int(0, 3),
      telegram_linked: rand.chance(0.3) ? 1 : 0,
      whatsapp_linked: rand.chance(0.3) ? 1 : 0,
      confirmation_offered: (counts.report_confirmed ?? 0) * 2 + rand.int(0, 3),
      ai_blur: rand.chance(0.2) ? 1 : 0,
      assistant_chat: Math.round(rand.int(2, 12) * traffic),
      assistant_draft_opened: rand.int(0, 3),
      fare_checked: Math.round(rand.int(5, 25) * traffic),
      trip_share_started: rand.int(0, 3),
      emergency_shown: rand.chance(0.15) ? 1 : 0,
    };
    for (const event of METRIC_EVENTS) {
      const count = (counts[event] ?? 0) + (generated[event] ?? 0);
      if (count > 0) metricRows.push({ day, event, count });
    }
  }

  // ---------------------------------------------------------------- Write everything
  await db.transaction(async (tx) => {
    await tx.insert(admins).values(adminRows);
    await tx.insert(operatorBuses).values(fleetRows);
    await tx.insert(fareTables).values(fareTableRows);
    await tx.insert(fareRoutes).values(fareRouteRows);
    await insertChunked(reportRows, (chunk) => tx.insert(reports).values(chunk));
    await insertChunked(statusRows, (chunk) => tx.insert(reportStatusChanges).values(chunk));
    if (noteRows.length)
      await insertChunked(noteRows, (chunk) => tx.insert(reportNotes).values(chunk));
    if (messageRows.length)
      await insertChunked(messageRows, (chunk) => tx.insert(reportMessages).values(chunk));
    if (confirmationRows.length) {
      await insertChunked(confirmationRows, (chunk) =>
        tx.insert(reportConfirmations).values(chunk),
      );
    }
    if (responseRows.length)
      await insertChunked(responseRows, (chunk) => tx.insert(operatorResponses).values(chunk));
    await tx.insert(impactStories).values(storyRows);
    await tx.insert(tripShares).values(tripRows);
    await insertChunked(metricRows, (chunk) => tx.insert(dailyMetrics).values(chunk));
  });

  const withConversation = new Set(messageRows.map((m) => m.reportId));
  return {
    staff: STAFF.map((s) => ({ email: s.email, role: s.role })),
    operators: OPERATORS.map((o) => ({
      email: o.email,
      organisation: o.organisation,
      buses: BUSES.filter((b) => b.operator === o.key).map((b) => b.busNumber),
    })),
    password,
    counts: {
      admins: adminRows.length,
      operatorBuses: fleetRows.length,
      reports: reportRows.length,
      statusChanges: statusRows.length,
      notes: noteRows.length,
      messages: messageRows.length,
      confirmations: confirmationRows.length,
      operatorResponses: responseRows.length,
      impactStories: storyRows.length,
      fareRoutes: fareRouteRows.length,
      tripShares: tripRows.length,
      dailyMetrics: metricRows.length,
    },
    liveTripPath: `/trip/${liveTripId}`,
    sampleReceiptIds: reportRows
      .filter((r) => withConversation.has(r.id))
      .slice(0, 3)
      .map((r) => r.receiptId),
  };
};

/** Every table the seed writes to (and the app's other tables), for --reset. */
export const resetDatabase = async (db: Database) => {
  await db.execute(
    sql`TRUNCATE admins, operator_buses, reports, report_status_changes, report_notes, report_messages, report_confirmations, operator_responses, impact_stories, fare_tables, fare_routes, trip_shares, daily_metrics, passenger_codes, push_subscriptions, telegram_subscriptions, whatsapp_subscriptions, whatsapp_chats, whatsapp_inbound RESTART IDENTITY CASCADE`,
  );
};

/** True when the database already has accounts or reports (so the seed won't run by accident). */
export const hasData = async (db: Database) => {
  const result = await db.execute<{ n: number }>(
    sql`SELECT ((SELECT count(*) FROM admins) + (SELECT count(*) FROM reports))::int AS n`,
  );
  return (result.rows[0]?.n ?? 0) > 0;
};
