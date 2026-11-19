import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { partOfDay } from "../src/controllers/confirmation.controller.js";
import { reportConfirmations, reports } from "../src/db/schema.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

useTestDatabase();

const DAY_MS = 24 * 60 * 60 * 1000;

/** A complaint about NE-9999 (reckless driving) and its database id. */
const fileReport = async (fields: Record<string, string> = {}) => {
  const res = await submitReport(fields);
  expect(res.status).toBe(201);
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(eq(reports.receiptId, res.body.receiptId as string));
  return { id: row!.id, receiptId: res.body.receiptId as string };
};

const similar = (query: Record<string, string>) =>
  request(app).get("/api/reports/similar").query(query);

const confirm = (id: string, body: Record<string, string> = {}, userAgent = "phone-a") =>
  request(app).post(`/api/reports/${id}/confirmations`).set("User-Agent", userAgent).send(body);

describe("Me too: finding similar reports", () => {
  it("offers a complaint about the same bus, category and day", async () => {
    const at = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { id } = await fileReport({ incidentAt: at });

    // Spacing and case of the bus number don't matter
    const res = await similar({ busNumber: "ne 9999", category: "reckless_driving", at });
    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    const [match] = res.body.matches;
    expect(match).toMatchObject({ id, routeNumber: "08", confirmations: 0 });
    expect(match.partOfDay).toMatch(/morning|afternoon|evening|night/);
    // Never the description, location, receipt ID or exact time
    expect(Object.keys(match).sort()).toEqual(
      ["confirmations", "id", "partOfDay", "routeNumber"].sort(),
    );
  });

  it("defaults to today and has no time of day without an incident time", async () => {
    await fileReport();
    const res = await similar({ busNumber: "NE-9999", category: "reckless_driving" });
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].partOfDay).toBeNull();
  });

  it("ignores other buses, categories, days, commendations and rejected or hidden reports", async () => {
    await fileReport({ busNumber: "NB-1111" });
    await fileReport({ category: "overcharging" });
    await fileReport({ incidentAt: new Date(Date.now() - 3 * DAY_MS).toISOString() });
    await fileReport({
      type: "commendation",
      category: "other",
      location: "",
    });
    const rejected = await fileReport();
    const hidden = await fileReport();
    await db.update(reports).set({ status: "rejected" }).where(eq(reports.id, rejected.id));
    await db.update(reports).set({ hiddenFromPublic: true }).where(eq(reports.id, hidden.id));

    const res = await similar({ busNumber: "NE-9999", category: "reckless_driving" });
    expect(res.body.matches).toEqual([]);
  });

  it("returns nothing for incomplete or out-of-range queries", async () => {
    await fileReport();
    const queries: Record<string, string>[] = [
      { busNumber: "NE-9999" },
      { busNumber: "NE-9999", category: "safe_driving" },
      { busNumber: "NE-9999", category: "reckless_driving", at: "not-a-date" },
      {
        busNumber: "NE-9999",
        category: "reckless_driving",
        at: new Date(Date.now() - 30 * DAY_MS).toISOString(),
      },
    ];
    for (const query of queries) {
      const res = await similar(query);
      expect(res.status).toBe(200);
      expect(res.body.matches).toEqual([]);
    }
  });
});

describe("Me too: confirming a report", () => {
  it("adds one confirmation per device and shows the count to the reporter", async () => {
    const { id, receiptId } = await fileReport();

    const first = await confirm(id, { comment: "  I was on that bus too  ", language: "si" });
    expect(first.status).toBe(201);
    expect(first.body.confirmations).toBe(1);

    const again = await confirm(id, { comment: "Again" });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe("already_confirmed");

    const other = await confirm(id, {}, "phone-b");
    expect(other.status).toBe(201);
    expect(other.body.confirmations).toBe(2);

    const [row] = await db
      .select()
      .from(reportConfirmations)
      .where(eq(reportConfirmations.reportId, id))
      .limit(1);
    expect(row).toMatchObject({ comment: "I was on that bus too", language: "si" });
    expect(row?.deviceHash).toMatch(/^[0-9a-f]{64}$/);

    // The passenger who filed it sees a count only
    const tracked = await request(app).get(`/api/reports/track/${receiptId}`);
    expect(tracked.body.confirmations).toBe(2);

    const offered = await similar({ busNumber: "NE-9999", category: "reckless_driving" });
    expect(offered.body.matches[0].confirmations).toBe(2);
  });

  it("shows confirmations to admins without the device hash", async () => {
    const { id } = await fileReport();
    await confirm(id, { comment: "Same here" });
    const token = await createAdminAndLogin();

    const details = await request(app).get(`/api/reports/${id}`).set("x-auth-token", token);
    expect(details.body.confirmations).toHaveLength(1);
    expect(details.body.confirmations[0]).toMatchObject({ comment: "Same here", source: "web" });
    expect(details.body.confirmations[0]).not.toHaveProperty("deviceHash");

    const list = await request(app).get("/api/reports").set("x-auth-token", token);
    expect(list.body.reports[0].confirmationCount).toBe(1);
  });

  it("refuses rejected, old, commendation and unknown reports", async () => {
    const rejected = await fileReport();
    await db.update(reports).set({ status: "rejected" }).where(eq(reports.id, rejected.id));
    const old = await fileReport();
    await db
      .update(reports)
      .set({ reportedAt: new Date(Date.now() - 20 * DAY_MS) })
      .where(eq(reports.id, old.id));
    const praise = await fileReport({ type: "commendation", category: "other", location: "" });

    for (const id of [rejected.id, old.id, praise.id, "00000000-0000-4000-8000-000000000000"]) {
      expect((await confirm(id)).status).toBe(404);
    }
    expect((await confirm("not-a-uuid")).status).toBe(404);
  });

  it("rejects bots and over-long comments", async () => {
    const { id } = await fileReport();
    expect((await confirm(id, { website: "spam.example" })).status).toBe(400);
    expect((await confirm(id, { comment: "x".repeat(1001) })).status).toBe(400);
  });

  it("counts confirmations in analytics", async () => {
    const { id } = await fileReport();
    await request(app).post("/api/metrics/events").send({ event: "confirmation_offered" });
    await confirm(id);
    const token = await createAdminAndLogin();
    const stats = await request(app).get("/api/reports/stats").set("x-auth-token", token);
    expect(stats.body.engagement).toMatchObject({
      confirmationsOffered: 1,
      reportConfirmations: 1,
    });
  });
});

describe("partOfDay", () => {
  it("groups hours into morning, afternoon, evening and night", () => {
    expect(partOfDay(null)).toBeNull();
    expect(partOfDay(7)).toBe("morning");
    expect(partOfDay(13)).toBe("afternoon");
    expect(partOfDay(19)).toBe("evening");
    expect(partOfDay(23)).toBe("night");
    expect(partOfDay(3)).toBe("night");
  });
});
