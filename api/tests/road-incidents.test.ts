import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reports } from "../src/db/schema.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// Road incidents: any vehicle on the road, or the road itself. They use the same receipts and
// tracking as bus reports but never touch bus figures, and the plate is for admins only.

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

const setStatus = (receiptId: string, status: "reviewed" | "resolved") =>
  db.update(reports).set({ status }).where(eq(reports.receiptId, receiptId));

const roadIncident = (fields: Record<string, string> = {}, details?: unknown) =>
  submitReport({
    type: "road_incident",
    busNumber: "",
    routeNumber: "",
    category: "dangerous_overtaking",
    location: "Kandy Road, near Kadawatha",
    description: "A van overtook on a blind bend and nearly hit a motorcycle",
    details: JSON.stringify(
      details ?? {
        road: {
          vehicle: { kind: "van", plate: " wp  cab-1234 ", colour: "White", make: "" },
        },
      },
    ),
    ...fields,
  });

describe("Road incidents", () => {
  it("files an incident about any vehicle without a bus number or route", async () => {
    const res = await roadIncident({ passengerPhone: "0771234567" });
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({
      type: "road_incident",
      category: "dangerous_overtaking",
      busNumber: "",
      routeNumber: "",
    });
    expect(sent.sms.at(-1)?.text).toContain(res.body.receiptId);

    const row = await findByReceipt(res.body.receiptId);
    expect(row.details?.road?.vehicle).toEqual({
      kind: "van",
      plate: "WP CAB-1234",
      colour: "White",
      make: null,
    });
  });

  it("ignores a bus number or route sent with a road incident", async () => {
    const res = await roadIncident({ busNumber: "NE-9999", routeNumber: "08", busName: "Express" });
    expect(res.status).toBe(201);
    const row = await findByReceipt(res.body.receiptId);
    expect(row).toMatchObject({ busNumber: "", routeNumber: "", busName: null });
  });

  it("keeps the plate off the tracking page, but shows it to admins and finds it by search", async () => {
    const res = await roadIncident();
    const tracked = await request(app).get(`/api/reports/track/${res.body.receiptId}`);
    expect(tracked.body.details.road.vehicle).toEqual({ kind: "van", colour: "White", make: null });
    expect(JSON.stringify(tracked.body)).not.toContain("CAB-1234");

    const admin = await createAdminAndLogin();
    const found = await request(app).get("/api/reports?q=cab-12").set("x-auth-token", admin);
    expect(found.body.total).toBe(1);
    const { id } = await findByReceipt(res.body.receiptId);
    const full = await request(app).get(`/api/reports/${id}`).set("x-auth-token", admin);
    expect(full.body.details.road.vehicle.plate).toBe("WP CAB-1234");
    expect(full.body.operators).toEqual([]);
  });

  it("keeps the kind of bus on a bus report, and never on a road incident", async () => {
    const sltb = await submitReport({ busService: "sltb" });
    expect(sltb.status).toBe(201);
    expect(sltb.body.report.busService).toBe("sltb");

    // Older clients and the WhatsApp bot don't send it
    const unknown = await submitReport();
    expect(unknown.body.report.busService).toBeNull();

    expect((await submitReport({ busService: "tuk" })).status).toBe(400);

    const road = await roadIncident({ busService: "metro" });
    expect((await findByReceipt(road.body.receiptId)).busService).toBeNull();
  });

  it("still needs a bus number and route for every bus report", async () => {
    const complaint = await submitReport({ busNumber: "", routeNumber: "" });
    expect(complaint.status).toBe(400);
    expect(complaint.body.errors).toEqual(
      expect.arrayContaining(["Bus Number is required.", "Route Number is required."]),
    );
  });

  it("checks the vehicle, accident and hazard details against what happened", async () => {
    // A vehicle is needed unless it's about the road itself
    expect((await roadIncident({}, {})).status).toBe(400);
    expect((await roadIncident({ category: "speeding" }, { road: {} })).status).toBe(400);

    // Accidents say whether the passenger was in it
    const vehicle = { kind: "car", plate: "" };
    expect((await roadIncident({ category: "accident" }, { road: { vehicle } })).status).toBe(400);
    const accident = await roadIncident(
      { category: "accident" },
      { road: { vehicle, accident: { involvement: "witness", injuries: "serious" } } },
    );
    expect(accident.status).toBe(201);
    expect((await findByReceipt(accident.body.receiptId)).details?.road?.accident).toEqual({
      involvement: "witness",
      injuries: "serious",
      vehiclesInvolved: null,
    });

    // Road hazards: what's wrong with the road, and no vehicle
    expect((await roadIncident({ category: "road_hazard" }, { road: { vehicle } })).status).toBe(
      400,
    );
    const hazard = await roadIncident(
      { category: "road_hazard", description: "Deep pothole in the left lane" },
      { road: { hazard: "pothole" } },
    );
    expect(hazard.status).toBe(201);

    // A place is needed, and bus categories and road details don't mix with other types
    expect((await roadIncident({ location: "" })).status).toBe(400);
    expect((await roadIncident({ category: "overcharging" })).status).toBe(400);
    expect(
      (await submitReport({ details: JSON.stringify({ road: { hazard: "pothole" } }) })).status,
    ).toBe(400);
  });

  it("never reaches bus figures, scorecards or the operator portal", async () => {
    const admin = await createAdminAndLogin();
    await request(app)
      .post("/api/auth/register")
      .set("x-auth-token", admin)
      .send({
        email: "owner@express.lk",
        password: "operatorpass1",
        role: "operator",
        organisation: "Nuwantha Express",
        busNumbers: ["NE-9999"],
      });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@express.lk", password: "operatorpass1" });

    // A private bus reported as a road incident, plate and all
    for (let i = 0; i < 3; i++) {
      const res = await roadIncident(
        { category: "reckless_driving" },
        { road: { vehicle: { kind: "private_bus", plate: "NE-9999" } } },
      );
      await setStatus(res.body.receiptId, "reviewed");
    }

    const impact = await request(app).get("/api/public/stats");
    expect(impact.body.totals).toMatchObject({ received: 0, checked: 0 });
    const scorecard = await request(app).get("/api/public/buses/NE-9999");
    expect(scorecard.body.published).toBe(false);
    const portal = await request(app)
      .get("/api/operator/reports")
      .set("x-auth-token", login.body.token as string);
    expect(portal.body.reports).toHaveLength(0);

    const stats = await request(app).get("/api/reports/stats").set("x-auth-token", admin);
    expect(stats.body.roadIncidents).toMatchObject({
      total: 3,
      byVehicle: [{ kind: "private_bus", count: 3 }],
    });
    expect(stats.body.total).toBe(0);
  });
});
