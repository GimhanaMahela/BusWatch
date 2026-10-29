import request from "supertest";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { reportNotes, reports, reportStatusChanges } from "../src/db/schema.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

const firstReport = () => db.query.reports.findFirst();
const reportByReceipt = (receiptId: string) =>
  db.query.reports.findFirst({ where: eq(reports.receiptId, receiptId) });

useTestDatabase();

describe("public report submission", () => {
  it("saves a report and returns a short receipt ID even when PDF/email are not configured", async () => {
    const res = await submitReport({
      latitude: "7.25",
      longitude: "80.17",
      incidentAt: "2026-01-02T10:00:00Z",
      passengerEmail: "p@test.com",
    });

    expect(res.status).toBe(201);
    expect(res.body.receiptId).toMatch(/^BW-\d{4}-[2-9A-Z]{6}$/);
    expect(res.body.emailSent).toBe(false);
    expect(res.body.report).toMatchObject({
      busNumber: "NE-9999",
      category: "reckless_driving",
      status: "pending",
    });
    expect(res.body.report).not.toHaveProperty("passengerEmail");

    const saved = await reportByReceipt(res.body.receiptId);
    expect(saved).toMatchObject({ latitude: 7.25, longitude: 80.17, busNumber: "NE-9999" });
  });

  it.each([
    [{ website: "spam" }, "Invalid submission."],
    [{ incidentAt: "2099-01-01" }, "Incident date/time is invalid or in the future."],
    [{ category: "nonsense" }, "Invalid incident category."],
    [{ latitude: "7.2" }, "Invalid map coordinates."],
    [{ busNumber: "  " }, "Bus Number is required."],
  ])("rejects %o", async (fields, message) => {
    const res = await submitReport(fields);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
  });

  it("only accepts image files in the images field", async () => {
    const res = await submitReport().attach("images", Buffer.from("hi"), {
      filename: "x.txt",
      contentType: "text/plain",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only image files are allowed in "images"');
  });
});

describe("tracking and case management", () => {
  it("tracks a report case-insensitively and shows status updates on the timeline", async () => {
    const { body } = await submitReport();
    const token = await createAdminAndLogin();
    const report = await reportByReceipt(body.receiptId);

    const updated = await request(app)
      .put(`/api/reports/${report?.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "resolved", note: "Operator warned the driver." });
    expect(updated.status).toBe(200);
    expect(updated.body.resolvedAt).toBeTruthy();

    const tracked = await request(app).get(`/api/reports/track/${body.receiptId.toLowerCase()}`);
    expect(tracked.status).toBe(200);
    expect(tracked.body.status).toBe("resolved");
    expect(tracked.body.timeline.map((t: { status: string }) => t.status)).toEqual([
      "pending",
      "resolved",
    ]);
    expect(tracked.body.timeline[1].note).toBe("Operator warned the driver.");
    expect(tracked.body.timeline[1]).not.toHaveProperty("changedBy");
  });

  it("rejects an unchanged status with no message", async () => {
    await submitReport();
    const token = await createAdminAndLogin();
    const report = await firstReport();
    const res = await request(app)
      .put(`/api/reports/${report?.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "pending" });
    expect(res.status).toBe(400);
  });

  it("adds internal notes with the author's email", async () => {
    await submitReport();
    const token = await createAdminAndLogin();
    const report = await firstReport();
    const res = await request(app)
      .post(`/api/reports/${report?.id}/notes`)
      .set("x-auth-token", token)
      .send({ text: "Called depot" });
    expect(res.status).toBe(201);
    expect(res.body.notes[0]).toMatchObject({ text: "Called depot", author: "root@test.com" });
  });

  it("404s on unknown receipt IDs, invalid IDs and unknown IDs", async () => {
    const token = await createAdminAndLogin();
    expect((await request(app).get("/api/reports/track/BW-0000-AAAAAA")).status).toBe(404);
    expect(
      (await request(app).get("/api/reports/not-an-id").set("x-auth-token", token)).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get("/api/reports/00000000-0000-4000-8000-000000000000")
          .set("x-auth-token", token)
      ).status,
    ).toBe(404);
  });
});

describe("admin listing and stats", () => {
  it("filters, searches and paginates", async () => {
    for (const bus of ["NE-1111", "NE-2222", "NB-3333"]) await submitReport({ busNumber: bus });
    await submitReport({ busNumber: "NC-4444", category: "overcharging" });
    const token = await createAdminAndLogin();

    const searched = await request(app)
      .get("/api/reports")
      .query({ q: "ne-", limit: 1 })
      .set("x-auth-token", token);
    expect(searched.body).toMatchObject({ total: 2, pages: 2, page: 1 });
    expect(searched.body.reports).toHaveLength(1);
    expect(searched.body.reports[0]).not.toHaveProperty("notes");

    const byCategory = await request(app)
      .get("/api/reports")
      .query({ category: "overcharging" })
      .set("x-auth-token", token);
    expect(byCategory.body.total).toBe(1);
  });

  it("flags buses with 3+ reports in 30 days as repeat offenders", async () => {
    for (let i = 0; i < 3; i++) await submitReport({ busNumber: "NE-4521" });
    await submitReport({ busNumber: "NB-1182" });
    const token = await createAdminAndLogin();

    const res = await request(app).get("/api/reports/stats").set("x-auth-token", token);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.open).toBe(4);
    expect(res.body.byMonth).toHaveLength(12);
    expect(res.body.repeatOffenders).toEqual([
      expect.objectContaining({ busNumber: "NE-4521", count: 3 }),
    ]);
  });
});

describe("deleting and resolution timing", () => {
  it("deletes a report together with its history and notes", async () => {
    await submitReport();
    const token = await createAdminAndLogin();
    const report = await firstReport();
    await request(app)
      .post(`/api/reports/${report?.id}/notes`)
      .set("x-auth-token", token)
      .send({ text: "Note" });

    const res = await request(app).delete(`/api/reports/${report?.id}`).set("x-auth-token", token);
    expect(res.status).toBe(200);
    expect(await db.$count(reports)).toBe(0);
    expect(await db.$count(reportNotes)).toBe(0);
    expect(await db.$count(reportStatusChanges)).toBe(0);
  });

  it("averages resolution time over resolved reports", async () => {
    await submitReport();
    const token = await createAdminAndLogin();
    const report = await firstReport();
    // Pretend it was reported 10 hours ago
    await db
      .update(reports)
      .set({ reportedAt: new Date(Date.now() - 10 * 36e5) })
      .where(eq(reports.id, report?.id ?? ""));
    await request(app)
      .put(`/api/reports/${report?.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "resolved" });

    const stats = await request(app).get("/api/reports/stats").set("x-auth-token", token);
    expect(stats.body.resolvedWithTiming).toBe(1);
    expect(stats.body.avgResolutionHours).toBeCloseTo(10, 0);
  });
});
