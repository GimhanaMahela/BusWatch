import { count, eq } from "drizzle-orm";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { CATEGORIES_BY_TYPE, ROAD_CATEGORIES_WITHOUT_VEHICLE } from "../src/config/constants.js";
import { reports, reportStatusChanges } from "../src/db/schema.js";
import { DEFAULT_SEED_PASSWORD } from "../src/db/seed/catalogue.js";
import { hasData, resetDatabase, seedDatabase, type SeedSummary } from "../src/db/seed/seed.js";
import { app, db } from "./helpers.js";

// One seed for the whole file: it is the data set developers will click through
let summary: SeedSummary;
beforeAll(async () => {
  await resetDatabase(db);
  summary = await seedDatabase(db);
}, 60_000);

const login = async (email: string) => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: DEFAULT_SEED_PASSWORD });
  expect(res.status).toBe(200);
  return String(res.body.token);
};

describe("development seed", () => {
  it("fills every part of the app", async () => {
    expect(await hasData(db)).toBe(true);
    for (const [table, n] of Object.entries(summary.counts)) {
      expect(n, table).toBeGreaterThan(0);
    }
    const types = await db
      .select({ type: reports.type, n: count() })
      .from(reports)
      .groupBy(reports.type);
    expect(types.map((t) => t.type).sort()).toEqual([
      "commendation",
      "complaint",
      "lost_item",
      "road_incident",
    ]);
  });

  it("keeps the rules the report forms enforce", async () => {
    const rows = await db.select().from(reports);
    for (const r of rows) {
      expect(CATEGORIES_BY_TYPE[r.type], r.receiptId).toContain(r.category);
      expect(r.receiptId).toMatch(/^BW-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
      expect(r.latitude === null).toBe(r.longitude === null);
      expect(r.reportedAt.getTime()).toBeLessThanOrEqual(Date.now());
      if (r.type === "road_incident") {
        expect(r.busNumber).toBe("");
        const withoutVehicle = (ROAD_CATEGORIES_WITHOUT_VEHICLE as readonly string[]).includes(
          r.category,
        );
        expect(Boolean(r.details?.road?.vehicle)).toBe(!withoutVehicle);
        expect(Boolean(r.details?.road?.accident)).toBe(r.category === "accident");
        expect(Boolean(r.details?.road?.hazard)).toBe(r.category === "road_hazard");
      } else {
        expect(r.busNumber).not.toBe("");
      }
      if (r.type === "lost_item") expect(r.passengerEmail ?? r.passengerPhone).toBeTruthy();
      expect(Boolean(r.details?.accessibility)).toBe(
        r.type === "complaint" && r.category === "accessibility",
      );
      if (r.details?.fare) expect(r.category).toBe("overcharging");
      if (r.details?.commendee) expect(r.type).toBe("commendation");
      if (r.status === "resolved") expect(r.resolvedAt).not.toBeNull();
      if (r.outcomeRating !== null) expect(["resolved", "rejected"]).toContain(r.status);
    }
  });

  it("gives every report a timeline ending at its current status", async () => {
    const rows = await db.select({ id: reports.id, status: reports.status }).from(reports);
    for (const r of rows.slice(0, 50)) {
      const history = await db
        .select()
        .from(reportStatusChanges)
        .where(eq(reportStatusChanges.reportId, r.id))
        .orderBy(reportStatusChanges.changedAt);
      expect(history[0]?.status).toBe("pending");
      expect(history.at(-1)?.status).toBe(r.status);
    }
  });

  it("produces public figures, scorecards and stories", async () => {
    const stats = await request(app).get("/api/public/stats");
    expect(stats.status).toBe(200);

    const bus = await request(app).get("/api/public/buses/NB-4521");
    expect(bus.status).toBe(200);

    // Published stories, in the public figures; the draft stays out
    expect(JSON.stringify(stats.body)).toContain("Route 138");
    expect(JSON.stringify(stats.body)).not.toContain("Night crew on route 87");

    const fares = await request(app).get("/api/fares/routes");
    expect(fares.status).toBe(200);
    expect(JSON.stringify(fares.body)).toContain("Colombo - Kandy");
  });

  it("lets the seeded staff and operators sign in", async () => {
    const adminToken = await login("superadmin@example.com");
    const list = await request(app).get("/api/reports").set("x-auth-token", adminToken);
    expect(list.status).toBe(200);

    const operatorToken = await login("operator.ruhunu@example.com");
    const fleet = await request(app)
      .get("/api/operator/reports")
      .set("x-auth-token", operatorToken);
    expect(fleet.status).toBe(200);
  });

  it("has a live trip and reports to track", async () => {
    const trip = await request(app).get(`/api${summary.liveTripPath.replace("/trip/", "/trips/")}`);
    expect(trip.status).toBe(200);

    expect(summary.sampleReceiptIds.length).toBeGreaterThan(0);
    const track = await request(app).get(`/api/reports/track/${summary.sampleReceiptIds[0]}`);
    expect(track.status).toBe(200);
  });

  it("is repeatable", async () => {
    const now = new Date("2026-06-01T06:00:00Z");
    await resetDatabase(db);
    await seedDatabase(db, { now, randomSeed: 7, reportCount: 40 });
    const first = await db
      .select({ r: reports.receiptId })
      .from(reports)
      .orderBy(reports.receiptId);
    await resetDatabase(db);
    await seedDatabase(db, { now, randomSeed: 7, reportCount: 40 });
    const second = await db
      .select({ r: reports.receiptId })
      .from(reports)
      .orderBy(reports.receiptId);
    expect(second).toEqual(first);
  });
});
