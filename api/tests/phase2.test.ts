import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { reports } from "../src/db/schema.js";
import { verifyTurnstile } from "../src/middleware/turnstile.middleware.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

useTestDatabase();

type Status = "pending" | "reviewed" | "escalated" | "resolved" | "rejected";

/** Submits a report and moves it straight to a status (admin checks are tested elsewhere). */
const seed = async (fields: Record<string, string> = {}, status: Status = "reviewed") => {
  const res = await submitReport(fields);
  expect(res.status).toBe(201);
  await db
    .update(reports)
    .set({ status, resolvedAt: status === "resolved" ? new Date() : null })
    .where(eq(reports.receiptId, res.body.receiptId));
  return String(res.body.receiptId);
};
const seedMany = async (n: number, fields: Record<string, string>, status: Status = "reviewed") => {
  for (let i = 0; i < n; i++) await seed(fields, status);
};
// Public stats as loosely typed JSON (the assertions check the shape)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const impact = async (): Promise<any> => (await request(app).get("/api/public/stats")).body;

describe("public impact page", () => {
  it("counts only admin-checked, visible reports and never exposes report details", async () => {
    await seed({ busNumber: "NB-1111" }, "resolved");
    await seed({ busNumber: "NB-1111" }, "escalated");
    await seed({ busNumber: "NB-1111" }, "pending");
    await seed({ busNumber: "NB-1111" }, "rejected");
    const hidden = await seed({ busNumber: "NB-1111" }, "reviewed");
    await db.update(reports).set({ hiddenFromPublic: true }).where(eq(reports.receiptId, hidden));
    await seed({ type: "commendation", category: "safe_driving" }, "reviewed");

    const res = await request(app).get("/api/public/stats");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("s-maxage=300");
    expect(res.body.totals).toMatchObject({
      received: 4, // everything that came in, except the hidden one
      checked: 2,
      resolved: 1,
      resolvedThisMonth: 1,
      resolutionRate: 50,
      commendations: 1,
    });
    expect(res.body.byMonth).toHaveLength(12);
    expect(res.body.byCategory).toEqual([{ category: "reckless_driving", count: 2 }]);

    const json = JSON.stringify(res.body);
    expect(json).not.toContain("BW-");
    expect(json).not.toContain("Driver was speeding");
    expect(json).not.toContain("Ambepussa");
  });

  it("lists only routes with enough checked reports", async () => {
    await seedMany(3, { routeNumber: "08" });
    await seed({ routeNumber: " 08 " }); // same route, typed differently
    await seedMany(2, { routeNumber: "17" });
    await seedMany(3, { routeNumber: "99" }, "pending");

    expect((await impact()).topRoutes).toEqual([{ routeNumber: "08", count: 4 }]);
  });

  it("groups map pins into cells and hides cells with too few reports", async () => {
    const kandy = { latitude: "7.2906", longitude: "80.6337" };
    await seedMany(3, kandy);
    await seed({ latitude: "7.2911", longitude: "80.6341" }); // same cell
    await seedMany(2, { latitude: "6.9271", longitude: "79.8612" }); // only two in Colombo
    await seedMany(3, { latitude: "51.5", longitude: "-0.12" }); // outside Sri Lanka

    const { heatmap } = await impact();
    expect(heatmap.cells).toEqual([{ lat: 7.3, lng: 80.65, count: 4 }]);
    expect(heatmap).toMatchObject({ cellDegrees: 0.05, minReports: 3 });
  });
});

describe("scorecards", () => {
  it("stays unpublished until a bus has enough checked reports", async () => {
    await seedMany(2, { busNumber: "NE-4521" });
    await seedMany(3, { busNumber: "NE-4521" }, "pending");

    const early = await request(app).get("/api/public/buses/ne-4521");
    expect(early.status).toBe(200);
    expect(early.body).toEqual(
      expect.objectContaining({ published: false, complaints: null, minPublicReports: 3 }),
    );

    await seed({ busNumber: "NE-4521", busName: "Nuwantha Express" }, "resolved");
    const card = (await request(app).get("/api/public/buses/NE-4521")).body;
    expect(card).toMatchObject({
      published: true,
      busNumber: "NE-4521",
      busName: "Nuwantha Express",
      routes: ["08"],
      complaints: { checked: 3, resolved: 1, inProgress: 2, resolutionRate: 33 },
      commendations: { count: 0 },
    });
    expect(card.complaints.byMonth).toHaveLength(12);
    expect(card.complaints.averageRating).toBeNull(); // too few ratings to average
  });

  it("publishes praise without revealing a handful of complaints", async () => {
    await seedMany(3, { busNumber: "NB-7000", type: "commendation", category: "helpful_staff" });
    await seed({ busNumber: "NB-7000" });

    const card = (await request(app).get("/api/public/buses/NB-7000")).body;
    expect(card.published).toBe(true);
    expect(card.complaints).toBeNull();
    expect(card.commendations).toEqual({
      count: 3,
      byCategory: [{ category: "helpful_staff", count: 3 }],
    });
  });

  it("ignores reports an admin hid from the public", async () => {
    await seedMany(3, { busNumber: "NB-8000" });
    const token = await createAdminAndLogin();
    const report = await db.query.reports.findFirst({ where: eq(reports.busNumber, "NB-8000") });

    const res = await request(app)
      .put(`/api/reports/${report?.id}/visibility`)
      .set("x-auth-token", token)
      .send({ hiddenFromPublic: true });
    expect(res.status).toBe(200);
    expect(res.body.hiddenFromPublic).toBe(true);
    expect((await request(app).get("/api/public/buses/NB-8000")).body.published).toBe(false);

    expect(
      (
        await request(app)
          .put(`/api/reports/${report?.id}/visibility`)
          .send({ hiddenFromPublic: false })
      ).status,
    ).toBe(401);
  });

  it("builds route scorecards across spellings and lists qualifying buses", async () => {
    await seedMany(3, { routeNumber: "Kandy–Matale", busNumber: "NB-1" });
    await seed({ routeNumber: "kandy–matale ", busNumber: "NB-2" });

    const card = (
      await request(app).get(`/api/public/routes/${encodeURIComponent("KANDY–MATALE")}`)
    ).body;
    expect(card).toMatchObject({
      published: true,
      routeNumber: "Kandy–Matale",
      complaints: { checked: 4 },
      buses: [{ busNumber: "NB-1", count: 3 }],
    });
  });
});

describe("resolved case stories", () => {
  const story = {
    title: "Route 08 overcharging: operator issued refunds",
    body: "After several reports, the operator refunded passengers and retrained conductors.",
    category: "overcharging",
    routeNumber: "08",
    translations: {
      si: { title: "මාර්ග 08 අධික ගාස්තු", body: "හිමිකරු මුදල් ආපසු ගෙවීය." },
      ta: { title: "வழித்தடம் 08", body: "" }, // incomplete: dropped
    },
  };

  it("needs an admin, and only shows published stories in public", async () => {
    expect((await request(app).post("/api/stories").send(story)).status).toBe(401);
    const token = await createAdminAndLogin();

    const draft = await request(app).post("/api/stories").set("x-auth-token", token).send(story);
    expect(draft.status).toBe(201);
    expect(draft.body).toMatchObject({
      published: false,
      publishedAt: null,
      createdBy: "root@test.com",
    });
    expect(draft.body.translations).toEqual({ si: story.translations.si });
    expect((await impact()).stories).toEqual([]);

    const published = await request(app)
      .put(`/api/stories/${draft.body.id}`)
      .set("x-auth-token", token)
      .send({ published: true });
    expect(published.body.publishedAt).toBeTruthy();

    // Editing one field keeps it published
    const edited = await request(app)
      .put(`/api/stories/${draft.body.id}`)
      .set("x-auth-token", token)
      .send({ title: "Route 08: refunds issued" });
    expect(edited.body).toMatchObject({ published: true, title: "Route 08: refunds issued" });
    expect(edited.body.translations).toEqual({ si: story.translations.si });

    const [shown] = (await impact()).stories;
    expect(shown).toMatchObject({ title: "Route 08: refunds issued", routeNumber: "08" });
    expect(shown.month).toMatch(/^\d{4}-\d{2}$/);
    expect(shown).not.toHaveProperty("reportId");
    expect(shown).not.toHaveProperty("createdBy");

    const list = await request(app).get("/api/stories").set("x-auth-token", token);
    expect(list.body).toHaveLength(1);

    expect(
      (await request(app).delete(`/api/stories/${draft.body.id}`).set("x-auth-token", token))
        .status,
    ).toBe(200);
    expect((await impact()).stories).toEqual([]);
  });

  it("keeps a story when the report it was based on is deleted", async () => {
    const receiptId = await seed();
    const token = await createAdminAndLogin();
    const report = await db.query.reports.findFirst({ where: eq(reports.receiptId, receiptId) });
    const created = await request(app)
      .post("/api/stories")
      .set("x-auth-token", token)
      .send({ ...story, reportId: report?.id, published: true });
    expect(created.status).toBe(201);

    await request(app).delete(`/api/reports/${report?.id}`).set("x-auth-token", token);
    const list = await request(app).get("/api/stories").set("x-auth-token", token);
    expect(list.body[0]).toMatchObject({ reportId: null, receiptId: null });
  });

  it("rejects empty stories", async () => {
    const token = await createAdminAndLogin();
    const res = await request(app)
      .post("/api/stories")
      .set("x-auth-token", token)
      .send({ title: " ", body: "x" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });
});

describe("Turnstile CAPTCHA", () => {
  const run = async (body: Record<string, unknown>) => {
    const res = { statusCode: 200, payload: undefined } as Response & {
      payload: unknown;
    };
    res.status = vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = vi.fn((payload: unknown) => {
      res.payload = payload;
      return res;
    });
    const next = vi.fn() as NextFunction;
    await verifyTurnstile({ body, ip: "1.2.3.4" } as Request, res, next);
    return { status: res.statusCode, payload: res.payload, next };
  };

  afterEach(() => {
    env.TURNSTILE_SECRET_KEY = undefined;
    vi.unstubAllGlobals();
  });

  it("is skipped when no secret key is configured", async () => {
    expect((await run({})).next).toHaveBeenCalled();
  });

  it("requires and verifies a token when configured", async () => {
    env.TURNSTILE_SECRET_KEY = "secret";
    const fetchMock = vi.fn(() => Promise.resolve(Response.json({ success: true })));
    vi.stubGlobal("fetch", fetchMock);

    const missing = await run({});
    expect(missing.status).toBe(400);
    expect(missing.next).not.toHaveBeenCalled();

    const body: Record<string, unknown> = { "cf-turnstile-response": "token-1", busNumber: "NB-1" };
    const ok = await run(body);
    expect(ok.next).toHaveBeenCalled();
    expect(body).not.toHaveProperty("cf-turnstile-response");
    const sent = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
      .body as URLSearchParams;
    expect(Object.fromEntries(sent)).toEqual({
      secret: "secret",
      response: "token-1",
      remoteip: "1.2.3.4",
    });

    fetchMock.mockImplementationOnce(() => Promise.resolve(Response.json({ success: false })));
    expect((await run({ "cf-turnstile-response": "bad" })).status).toBe(400);

    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));
    expect((await run({ "cf-turnstile-response": "t" })).status).toBe(503);
  });
});
