import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reports } from "../src/db/schema.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// Phase 5: lost and found, accessibility reports, the fare checker, safety mode (quick form and
// "Share my trip") and the emergency shortcut.

const sent = vi.hoisted(() => ({ sms: [] as { to: string; text: string }[] }));

vi.mock("../src/services/sms.service.js", () => ({
  isSmsConfigured: () => true,
  sendSms: (to: string, text: string) => {
    sent.sms.push({ to, text });
    return Promise.resolve(true);
  },
}));

useTestDatabase();

beforeEach(() => {
  sent.sms.length = 0;
});

const findByReceipt = async (receiptId: string) => {
  const [row] = await db.select().from(reports).where(eq(reports.receiptId, receiptId));
  return row!;
};

const setStatus = (receiptId: string, status: "reviewed" | "resolved" | "rejected") =>
  db.update(reports).set({ status }).where(eq(reports.receiptId, receiptId));

const operatorFor = async (busNumbers = ["NE-9999"]) => {
  const admin = await createAdminAndLogin();
  await request(app).post("/api/auth/register").set("x-auth-token", admin).send({
    email: "owner@express.lk",
    password: "operatorpass1",
    role: "operator",
    organisation: "Nuwantha Express",
    busNumbers,
  });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "owner@express.lk", password: "operatorpass1" });
  return { admin, operator: login.body.token as string };
};

const lostItem = (fields: Record<string, string> = {}) =>
  submitReport({
    type: "lost_item",
    category: "bag",
    location: "",
    description: "Black backpack with a laptop, left on the back seat",
    passengerPhone: "0771234567",
    ...fields,
  });

describe("Lost and found", () => {
  it("files a lost item without a place, but needs a way to reach the passenger", async () => {
    const res = await lostItem();
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({ type: "lost_item", category: "bag" });
    expect(sent.sms.at(-1)?.text).toContain(res.body.receiptId);

    const noContact = await lostItem({ passengerPhone: "" });
    expect(noContact.status).toBe(400);
    expect(noContact.body.msg).toMatch(/email address or mobile number/);

    const wrongCategory = await lostItem({ category: "reckless_driving" });
    expect(wrongCategory.status).toBe(400);
  });

  it("is shown to the bus operator straight away, and never counted as a complaint", async () => {
    const { operator } = await operatorFor();
    const filed = await lostItem();
    const complaint = await submitReport(); // pending complaint: operators wait for an admin

    const list = await request(app).get("/api/operator/reports").set("x-auth-token", operator);
    expect(list.status).toBe(200);
    expect(list.body.reports).toHaveLength(1);
    expect(list.body.reports[0]).toMatchObject({ type: "lost_item", status: "pending" });
    expect(list.body.reports[0]).not.toHaveProperty("passengerPhone");

    const summary = await request(app).get("/api/operator/summary").set("x-auth-token", operator);
    expect(summary.body).toMatchObject({ lostItems: 1, lostItemsOpen: 1, complaints: 0 });

    // Closed by an admin: gone from the portal
    await setStatus(filed.body.receiptId, "rejected");
    const after = await request(app).get("/api/operator/reports").set("x-auth-token", operator);
    expect(after.body.reports).toHaveLength(0);

    await setStatus(complaint.body.receiptId, "reviewed");
    const impact = await request(app).get("/api/public/stats");
    expect(impact.body.totals.received).toBe(1);
  });

  it("lets the operator reply and mark the item found, telling the passenger each time", async () => {
    const { operator } = await operatorFor();
    const filed = await lostItem();
    const { id } = await findByReceipt(filed.body.receiptId);
    sent.sms.length = 0;

    const reply = await request(app)
      .post(`/api/operator/reports/${id}/responses`)
      .set("x-auth-token", operator)
      .send({ body: "Checking with the conductor now." });
    expect(reply.status).toBe(201);
    expect(sent.sms.at(-1)?.text).toMatch(/bus operator replied/);

    const found = await request(app)
      .post(`/api/operator/reports/${id}/found`)
      .set("x-auth-token", operator)
      .send({ body: "Found it. Collect from the Kadawatha depot office, 8am to 5pm." });
    expect(found.status).toBe(200);
    expect(found.body.status).toBe("resolved");
    expect(sent.sms.at(-1)?.text).toContain(filed.body.receiptId);

    const tracked = await request(app).get(`/api/reports/track/${filed.body.receiptId}`);
    expect(tracked.body.status).toBe("resolved");
    expect(tracked.body.timeline.at(-1).note).toMatch(/Kadawatha depot/);
    expect(tracked.body.operatorResponses).toHaveLength(2);
    expect(tracked.body.canRate).toBe(false);

    const again = await request(app)
      .post(`/api/operator/reports/${id}/found`)
      .set("x-auth-token", operator)
      .send({ body: "Again" });
    expect(again.status).toBe(409);
  });

  it("can't mark a complaint as found", async () => {
    const { operator } = await operatorFor();
    const filed = await submitReport();
    await setStatus(filed.body.receiptId, "reviewed");
    const { id } = await findByReceipt(filed.body.receiptId);
    const res = await request(app)
      .post(`/api/operator/reports/${id}/found`)
      .set("x-auth-token", operator)
      .send({ body: "Found" });
    expect(res.status).toBe(404);
  });
});

describe("Accessibility reports", () => {
  const accessibility = (issues: string[], fields: Record<string, string> = {}) =>
    submitReport({
      category: "accessibility",
      details: JSON.stringify({ accessibility: issues }),
      ...fields,
    });

  it("store what went wrong, and need at least one issue ticked", async () => {
    const res = await accessibility(["priority_seat", "high_step", "priority_seat"]);
    expect(res.status).toBe(201);
    const row = await findByReceipt(res.body.receiptId);
    expect(row.details).toEqual({ accessibility: ["priority_seat", "high_step"] });

    expect((await submitReport({ category: "accessibility" })).status).toBe(400);
    expect((await accessibility([])).status).toBe(400);
    expect((await accessibility(["not_a_thing"])).status).toBe(400);
    // Issues only go with the accessibility category
    expect((await accessibility(["high_step"], { category: "overcrowding" })).status).toBe(400);
  });

  it("get their own section on scorecards once enough are checked", async () => {
    for (const issues of [["passed_by"], ["passed_by", "high_step"]]) {
      const res = await accessibility(issues, { busNumber: "NC-1111" });
      await setStatus(res.body.receiptId, "reviewed");
    }
    const other = await submitReport({ busNumber: "NC-1111" });
    await setStatus(other.body.receiptId, "reviewed");

    const early = await request(app).get("/api/public/buses/NC-1111");
    expect(early.body.published).toBe(true);
    expect(early.body.accessibility).toBeNull(); // only 2 accessibility complaints

    const third = await accessibility(["passed_by"], { busNumber: "NC-1111" });
    await setStatus(third.body.receiptId, "reviewed");
    const card = await request(app).get("/api/public/buses/NC-1111");
    expect(card.body.accessibility).toEqual({
      checked: 3,
      byIssue: [
        { issue: "passed_by", count: 3 },
        { issue: "high_step", count: 1 },
      ],
    });
  });
});

describe("Fare checker", () => {
  const setUpFares = async () => {
    const admin = await createAdminAndLogin();
    const table = await request(app)
      .put("/api/fares/tables/normal")
      .set("x-auth-token", admin)
      .send({ fares: [30, 40, 52, 64, 75], effectiveFrom: "2026-07-01" });
    expect(table.status).toBe(200);
    const route = await request(app)
      .post("/api/fares/routes")
      .set("x-auth-token", admin)
      .send({
        routeNumber: " 01 ",
        name: "Colombo - Kandy",
        serviceClasses: ["normal"],
        stops: [
          { name: "Colombo Fort", stage: 0 },
          { name: "Kelaniya", stage: 1 },
          { name: "Kadawatha", stage: 3 },
          { name: "Nittambuwa", stage: 5 },
        ],
      });
    expect(route.status).toBe(201);
    return { admin, routeId: route.body.id as string };
  };

  it("is managed by admins only, with sensible tables", async () => {
    const { admin } = await setUpFares();
    const anon = await request(app)
      .put("/api/fares/tables/normal")
      .send({ fares: [30] });
    expect(anon.status).toBe(401);
    const falling = await request(app)
      .put("/api/fares/tables/luxury")
      .set("x-auth-token", admin)
      .send({ fares: [50, 40] });
    expect(falling.status).toBe(400);
    const duplicate = await request(app)
      .post("/api/fares/routes")
      .set("x-auth-token", admin)
      .send({
        routeNumber: "01",
        name: "Again",
        serviceClasses: ["normal"],
        stops: [
          { name: "A", stage: 0 },
          { name: "B", stage: 1 },
        ],
      });
    expect(duplicate.status).toBe(409);

    const overview = await request(app).get("/api/fares/admin").set("x-auth-token", admin);
    expect(overview.body.routes).toMatchObject([{ routeNumber: "01", stopCount: 4 }]);
  });

  it("works out the official fare by fare stages", async () => {
    const { routeId } = await setUpFares();
    const routes = await request(app).get("/api/fares/routes");
    expect(routes.body).toMatchObject([
      { id: routeId, routeNumber: "01", name: "Colombo - Kandy" },
    ]);
    const route = await request(app).get(`/api/fares/routes/${routeId}`);
    expect(route.body.stops).toHaveLength(4);

    // Colombo Fort (stage 0) to Kadawatha (stage 3): three stages
    const check = await request(app)
      .get("/api/fares/check")
      .query({ routeId, from: 0, to: 2, charged: 80 });
    expect(check.status).toBe(200);
    expect(check.body).toMatchObject({
      from: "Colombo Fort",
      to: "Kadawatha",
      stages: 3,
      officialFare: 52,
      chargedFare: 80,
      overchargedBy: 28,
      effectiveFrom: "2026-07-01",
    });

    // Same stage counts as the minimum fare; either direction works
    const back = await request(app).get("/api/fares/check").query({ routeId, from: 3, to: 2 });
    expect(back.body).toMatchObject({ stages: 2, officialFare: 40, overchargedBy: 0 });

    const sameStop = await request(app).get("/api/fares/check").query({ routeId, from: 1, to: 1 });
    expect(sameStop.status).toBe(422);
    const noClass = await request(app)
      .get("/api/fares/check")
      .query({ routeId, from: 0, to: 1, serviceClass: "luxury" });
    expect(noClass.status).toBe(422);
  });

  it("attaches the official fare to an overcharging complaint, worked out by the server", async () => {
    const { routeId } = await setUpFares();
    // A made-up official fare from the browser is ignored, never trusted
    const ok = await submitReport({
      category: "overcharging",
      details: JSON.stringify({
        fare: { routeId, from: 0, to: 3, serviceClass: "normal", charged: 100, officialFare: 1 },
      }),
    });
    expect(ok.status).toBe(201);
    const row = await findByReceipt(ok.body.receiptId);
    expect(row.details?.fare).toMatchObject({
      routeNumber: "01",
      from: "Colombo Fort",
      to: "Nittambuwa",
      stages: 5,
      officialFare: 75,
      chargedFare: 100,
    });

    const wrongCategory = await submitReport({
      category: "loud_music",
      details: JSON.stringify({ fare: { routeId, from: 0, to: 3 } }),
    });
    expect(wrongCategory.status).toBe(400);

    const badStop = await submitReport({
      category: "overcharging",
      details: JSON.stringify({ fare: { routeId, from: 0, to: 9 } }),
    });
    expect(badStop.status).toBe(400);
    expect(badStop.body.msg).toMatch(/no longer on this route/);
  });
});

describe("Safety mode", () => {
  it("takes a quick harassment report without a place or description", async () => {
    const res = await submitReport({
      category: "harassment",
      location: "",
      description: "",
      details: JSON.stringify({ safety: { kinds: ["touching", "followed"] } }),
    });
    expect(res.status).toBe(201);
    const row = await findByReceipt(res.body.receiptId);
    expect(row.description).toMatch(/touching, followed/);
    expect(row.details).toEqual({ safety: { kinds: ["touching", "followed"] } });

    // Only harassment can use the quick form
    const other = await submitReport({
      category: "loud_music",
      location: "",
      description: "",
      details: JSON.stringify({ safety: { kinds: ["verbal"] } }),
    });
    expect(other.status).toBe(400);
    // Without the quick form, the usual fields are needed
    const plain = await submitReport({ category: "harassment", description: "" });
    expect(plain.status).toBe(400);
  });

  it("shares a trip: only the passenger's phone can update or end it", async () => {
    const started = await request(app)
      .post("/api/trips")
      .send({ busNumber: "ne-9999", routeNumber: "08" });
    expect(started.status).toBe(201);
    const { id, ownerToken } = started.body as { id: string; ownerToken: string };

    const empty = await request(app).get(`/api/trips/${id}`);
    expect(empty.body).toMatchObject({ busNumber: "NE-9999", active: true, position: null });

    const stranger = await request(app)
      .put(`/api/trips/${id}/position`)
      .set("x-trip-token", "guess")
      .send({ latitude: 7.1, longitude: 80.1 });
    expect(stranger.status).toBe(403);

    const moved = await request(app)
      .put(`/api/trips/${id}/position`)
      .set("x-trip-token", ownerToken)
      .send({ latitude: 7.09, longitude: 79.99, accuracy: 12 });
    expect(moved.status).toBe(204);
    const seen = await request(app).get(`/api/trips/${id}`);
    expect(seen.body.position).toMatchObject({ latitude: 7.09, longitude: 79.99, accuracy: 12 });

    expect((await request(app).post(`/api/trips/${id}/end`)).status).toBe(403);
    const ended = await request(app).post(`/api/trips/${id}/end`).set("x-trip-token", ownerToken);
    expect(ended.status).toBe(200);
    const after = await request(app).get(`/api/trips/${id}`);
    expect(after.body).toMatchObject({ active: false, position: null });

    const late = await request(app)
      .put(`/api/trips/${id}/position`)
      .set("x-trip-token", ownerToken)
      .send({ latitude: 7.1, longitude: 80.1 });
    expect(late.status).toBe(410);

    expect((await request(app).get("/api/trips/not-a-real-trip-id")).status).toBe(404);
  });
});

describe("Emergency shortcut", () => {
  it("answers 'not checked' when AI help isn't set up, so the page relies on its keywords", async () => {
    const res = await request(app)
      .post("/api/assistant/emergency")
      .send({ text: "There was a crash and a man is bleeding", language: "en" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ checked: false, emergency: false, kind: null });
  });
});
