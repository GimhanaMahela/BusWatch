import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { reports } from "../src/db/schema.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

useTestDatabase();

const PASSWORD = "operatorpass1";

/** A superadmin creates an operator for these buses; returns both tokens. */
const setUp = async (busNumbers = ["NE-9999", "NB 1234"]) => {
  const admin = await createAdminAndLogin();
  const created = await request(app).post("/api/auth/register").set("x-auth-token", admin).send({
    email: "owner@express.lk",
    password: PASSWORD,
    role: "operator",
    organisation: "Nuwantha Express",
    busNumbers,
  });
  expect(created.status).toBe(201);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "owner@express.lk", password: PASSWORD });
  return { admin, operator: login.body.token as string, operatorId: created.body.admin.id };
};

/** Files a report and moves it to a status (as an admin would). */
const fileReport = async (
  status: "pending" | "reviewed" | "resolved" | "rejected",
  fields: Record<string, string> = {},
) => {
  const res = await submitReport({ passengerEmail: "rider@example.com", ...fields });
  const receiptId = res.body.receiptId as string;
  await db.update(reports).set({ status }).where(eq(reports.receiptId, receiptId));
  const [row] = await db.select().from(reports).where(eq(reports.receiptId, receiptId));
  return { id: row!.id, receiptId };
};

describe("Operator accounts", () => {
  it("are created by superadmins with a name and a normalised fleet", async () => {
    const { admin, operator } = await setUp();

    const me = await request(app).get("/api/auth").set("x-auth-token", operator);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ role: "operator", organisation: "Nuwantha Express" });
    expect(me.body.fleet).toEqual(["NB1234", "NE9999"]);

    const list = await request(app).get("/api/auth/admins").set("x-auth-token", admin);
    const listed = list.body.find((a: { role: string }) => a.role === "operator");
    expect(listed.fleet).toEqual(["NB1234", "NE9999"]);
  });

  it("need a company or owner name", async () => {
    const admin = await createAdminAndLogin();
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-auth-token", admin)
      .send({ email: "x@y.lk", password: PASSWORD, role: "operator" });
    expect(res.status).toBe(400);
  });

  it("can have their fleet changed by a superadmin", async () => {
    const { admin, operatorId } = await setUp();
    const res = await request(app)
      .put(`/api/auth/admins/${operatorId}/fleet`)
      .set("x-auth-token", admin)
      .send({ busNumbers: ["wp-ab-1111", "WPAB1111"], organisation: "NE Travels" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ fleet: ["WPAB1111"], organisation: "NE Travels" });

    const plainAdmin = await createAdminAndLogin("plain@test.com", "admin");
    const denied = await request(app)
      .put(`/api/auth/admins/${operatorId}/fleet`)
      .set("x-auth-token", plainAdmin)
      .send({ busNumbers: [] });
    expect(denied.status).toBe(403);
  });

  it("never reach the admin console, and the team can't use the portal", async () => {
    const { admin, operator } = await setUp();
    const { id } = await fileReport("reviewed");
    for (const path of [
      "/api/reports",
      "/api/reports/stats",
      `/api/reports/${id}`,
      "/api/auth/admins",
      "/api/stories",
    ]) {
      const res = await request(app).get(path).set("x-auth-token", operator);
      expect(res.status, path).toBe(403);
    }
    const status = await request(app)
      .put(`/api/reports/${id}/status`)
      .set("x-auth-token", operator)
      .send({ status: "resolved" });
    expect(status.status).toBe(403);

    expect(
      (await request(app).get("/api/operator/summary").set("x-auth-token", admin)).status,
    ).toBe(403);
    expect((await request(app).get("/api/operator/summary")).status).toBe(401);
  });
});

describe("Operator portal", () => {
  it("lists only checked, visible reports about the operator's buses, without passenger details", async () => {
    const { operator } = await setUp();
    const mine = await fileReport("reviewed", { busNumber: "nb-1234" });
    await fileReport("pending"); // unchecked
    await fileReport("rejected"); // didn't stand
    await fileReport("resolved", { busNumber: "XY-0000" }); // someone else's bus
    const hidden = await fileReport("resolved");
    await db.update(reports).set({ hiddenFromPublic: true }).where(eq(reports.id, hidden.id));

    const res = await request(app).get("/api/operator/reports").set("x-auth-token", operator);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    const [report] = res.body.reports;
    expect(report.id).toBe(mine.id);
    for (const secret of ["receiptId", "passengerEmail", "passengerPhone", "images", "notes"]) {
      expect(report).not.toHaveProperty(secret);
    }

    const details = await request(app)
      .get(`/api/operator/reports/${mine.id}`)
      .set("x-auth-token", operator);
    expect(details.status).toBe(200);
    expect(details.body).not.toHaveProperty("receiptId");
    expect(details.body.timeline[0]).not.toHaveProperty("note");

    const pending = await request(app).get("/api/operator/reports").set("x-auth-token", operator);
    expect(pending.body.reports.map((r: { id: string }) => r.id)).toEqual([mine.id]);
  });

  it("refuses reports outside the fleet", async () => {
    const { operator } = await setUp();
    const other = await fileReport("reviewed", { busNumber: "XY-0000" });
    const res = await request(app)
      .get(`/api/operator/reports/${other.id}`)
      .set("x-auth-token", operator);
    expect(res.status).toBe(404);
    const reply = await request(app)
      .post(`/api/operator/reports/${other.id}/responses`)
      .set("x-auth-token", operator)
      .send({ body: "Not ours" });
    expect(reply.status).toBe(404);
  });

  it("publishes responses on the passenger's tracking page until an admin hides them", async () => {
    const { admin, operator } = await setUp();
    const { id, receiptId } = await fileReport("reviewed");

    const empty = await request(app)
      .post(`/api/operator/reports/${id}/responses`)
      .set("x-auth-token", operator)
      .send({ body: "   " });
    expect(empty.status).toBe(400);

    const res = await request(app)
      .post(`/api/operator/reports/${id}/responses`)
      .set("x-auth-token", operator)
      .send({ body: "The driver was warned and retrained." });
    expect(res.status).toBe(201);
    expect(res.body.responses).toHaveLength(1);

    const tracked = await request(app).get(`/api/reports/track/${receiptId}`);
    expect(tracked.body.operatorResponses).toEqual([
      expect.objectContaining({
        body: "The driver was warned and retrained.",
        organisation: "Nuwantha Express",
      }),
    ]);

    const details = await request(app).get(`/api/reports/${id}`).set("x-auth-token", admin);
    expect(details.body.operators).toEqual([
      expect.objectContaining({ organisation: "Nuwantha Express" }),
    ]);
    const responseId = details.body.operatorResponses[0].id as string;

    const hide = await request(app)
      .put(`/api/reports/${id}/operator-responses/${responseId}`)
      .set("x-auth-token", admin)
      .send({ hidden: true });
    expect(hide.status).toBe(200);
    expect(hide.body.operatorResponses[0].hidden).toBe(true);

    const afterHide = await request(app).get(`/api/reports/track/${receiptId}`);
    expect(afterHide.body.operatorResponses).toEqual([]);

    // The operator still sees it, marked as hidden
    const own = await request(app).get(`/api/operator/reports/${id}`).set("x-auth-token", operator);
    expect(own.body.responses[0].hidden).toBe(true);
  });

  it("summarises the fleet", async () => {
    const { operator } = await setUp();
    await fileReport("reviewed");
    await fileReport("resolved", { busNumber: "NB-1234" });
    await fileReport("reviewed", {
      type: "commendation",
      category: "safe_driving",
      location: "",
    });
    await fileReport("pending");

    const res = await request(app).get("/api/operator/summary").set("x-auth-token", operator);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      fleet: ["NB1234", "NE9999"],
      complaints: 2,
      commendations: 1,
      awaitingResponse: 1,
    });
    expect(res.body.complaintsByStatus).toMatchObject({ reviewed: 1, resolved: 1, pending: 0 });
  });
});
