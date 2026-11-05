import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { reports } from "../src/db/schema.js";
import { generatePdfReceipt, scriptRuns } from "../src/services/pdf-receipt.service.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

const reportByReceipt = (receiptId: string) =>
  db.query.reports.findFirst({ where: eq(reports.receiptId, receiptId) });

const closeReport = async (receiptId: string, token: string, status = "resolved") => {
  const report = await reportByReceipt(receiptId);
  return request(app)
    .put(`/api/reports/${report?.id}/status`)
    .set("x-auth-token", token)
    .send({ status });
};

useTestDatabase();

describe("commend a driver", () => {
  const commend = (fields: Record<string, string> = {}) =>
    submitReport({
      type: "commendation",
      category: "helpful_staff",
      location: "",
      description: "The conductor helped an elderly passenger board.",
      ...fields,
    });

  it("accepts a commendation without a location", async () => {
    const res = await commend();
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({ type: "commendation", category: "helpful_staff" });
    expect(res.body.report.location).toBeNull();
  });

  it("only accepts categories that match the report type", async () => {
    const praiseAsComplaint = await submitReport({ category: "helpful_staff" });
    expect(praiseAsComplaint.status).toBe(400);
    expect(praiseAsComplaint.body.message).toBe("Invalid incident category.");

    const complaintAsPraise = await commend({ category: "harassment" });
    expect(complaintAsPraise.status).toBe(400);
  });

  it("still requires a location for complaints", async () => {
    const res = await submitReport({ location: " " });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Location is required.");
  });

  it("keeps commendations out of complaint statistics and repeat offenders", async () => {
    for (let i = 0; i < 3; i++) await commend({ busNumber: "NB-1182" });
    await submitReport({ busNumber: "NB-1182" });
    const token = await createAdminAndLogin();

    const stats = await request(app).get("/api/reports/stats").set("x-auth-token", token);
    expect(stats.body.total).toBe(1);
    expect(stats.body.repeatOffenders).toEqual([]);
    expect(stats.body.commendations).toMatchObject({ total: 3, last30Days: 3 });
    expect(stats.body.commendations.topBuses[0]).toMatchObject({ busNumber: "NB-1182", count: 3 });
    expect(stats.body.commendations.byCategory).toEqual([{ category: "helpful_staff", count: 3 }]);

    const list = await request(app)
      .get("/api/reports")
      .query({ type: "commendation" })
      .set("x-auth-token", token);
    expect(list.body.total).toBe(3);
  });
});

describe("language and source", () => {
  it("stores the passenger's language and the QR source", async () => {
    const res = await submitReport({ language: "si", source: "qr" });
    const saved = await reportByReceipt(res.body.receiptId);
    expect(saved).toMatchObject({ language: "si", source: "qr" });
  });

  it("falls back to English and web for unknown values", async () => {
    const res = await submitReport({ language: "fr", source: "billboard" });
    expect(res.status).toBe(201);
    const saved = await reportByReceipt(res.body.receiptId);
    expect(saved).toMatchObject({ language: "en", source: "web" });
  });
});

describe("rate the outcome", () => {
  it("only allows a rating once the report is closed", async () => {
    const { body } = await submitReport();
    const early = await request(app)
      .post(`/api/reports/track/${body.receiptId}/rating`)
      .send({ rating: 5 });
    expect(early.status).toBe(409);

    const token = await createAdminAndLogin();
    await closeReport(body.receiptId, token);

    const tracked = await request(app).get(`/api/reports/track/${body.receiptId}`);
    expect(tracked.body).toMatchObject({ canRate: true, rating: null });

    const rated = await request(app)
      .post(`/api/reports/track/${body.receiptId.toLowerCase()}/rating`)
      .send({ rating: 4, feedback: "  Quick response, thanks.  " });
    expect(rated.status).toBe(200);
    expect(rated.body).toMatchObject({ rating: 4, feedback: "Quick response, thanks." });
    expect(rated.body.ratedAt).toBeTruthy();

    // The passenger may change their mind
    const changed = await request(app)
      .post(`/api/reports/track/${body.receiptId}/rating`)
      .send({ rating: 2 });
    expect(changed.body).toMatchObject({ rating: 2, feedback: null });
  });

  it("also allows rating reports closed without action", async () => {
    const { body } = await submitReport();
    await closeReport(body.receiptId, await createAdminAndLogin(), "rejected");
    const res = await request(app)
      .post(`/api/reports/track/${body.receiptId}/rating`)
      .send({ rating: 1 });
    expect(res.status).toBe(200);
  });

  it.each([[{ rating: 0 }], [{ rating: 6 }], [{ rating: 3.5 }], [{}]])(
    "rejects invalid ratings %o",
    async (payload) => {
      const { body } = await submitReport();
      await closeReport(body.receiptId, await createAdminAndLogin());
      const res = await request(app)
        .post(`/api/reports/track/${body.receiptId}/rating`)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Choose a rating from 1 to 5.");
    },
  );

  it("does not rate commendations or unknown receipts", async () => {
    const { body } = await submitReport({
      type: "commendation",
      category: "safe_driving",
    });
    await closeReport(body.receiptId, await createAdminAndLogin());
    const commendation = await request(app)
      .post(`/api/reports/track/${body.receiptId}/rating`)
      .send({ rating: 5 });
    expect(commendation.status).toBe(409);

    const unknown = await request(app)
      .post("/api/reports/track/BW-0000-AAAAAA/rating")
      .send({ rating: 5 });
    expect(unknown.status).toBe(404);
  });
});

describe("engagement metrics", () => {
  const sendEvent = (event: string) => request(app).post("/api/metrics/events").send({ event });

  it("counts anonymous client events and rejects unknown or server-only ones", async () => {
    expect((await sendEvent("report_form_started")).status).toBe(204);
    expect((await sendEvent("report_form_started")).status).toBe(204);
    expect((await sendEvent("tracking_return_view")).status).toBe(204);
    expect((await sendEvent("qr_scan")).status).toBe(204);
    expect((await sendEvent("report_submitted")).status).toBe(400);
    expect((await sendEvent("nonsense")).status).toBe(400);
  });

  it("reports completion rate, QR reports, ratings and time to first response", async () => {
    await sendEvent("report_form_started");
    await sendEvent("report_form_started");
    await sendEvent("report_form_started");
    await sendEvent("report_form_started");
    const { body } = await submitReport({ source: "qr" });
    await submitReport({ language: "ta" });
    const token = await createAdminAndLogin();

    // First admin response 2 hours after the report came in
    const report = await reportByReceipt(body.receiptId);
    await db
      .update(reports)
      .set({ reportedAt: new Date(Date.now() - 2 * 36e5) })
      .where(eq(reports.id, report?.id ?? ""));
    await closeReport(body.receiptId, token);
    await request(app)
      .post(`/api/reports/track/${body.receiptId}/rating`)
      .send({ rating: 5, feedback: "Great" });

    const stats = await request(app).get("/api/reports/stats").set("x-auth-token", token);
    expect(stats.body.engagement).toMatchObject({
      formStarts: 4,
      formSubmits: 2,
      formCompletionRate: 50,
      qrReports: 1,
      webReports: 1,
      avgRating: 5,
      ratingsCount: 1,
      respondedReports: 1,
      byLanguage: { en: 1, si: 0, ta: 1 },
    });
    expect(stats.body.engagement.avgFirstResponseHours).toBeCloseTo(2, 0);
    expect(stats.body.engagement.ratingDistribution[4]).toEqual({ rating: 5, count: 1 });
    expect(stats.body.engagement.recentFeedback[0]).toMatchObject({
      receiptId: body.receiptId,
      feedback: "Great",
    });
  });
});

describe("translated PDF receipts", () => {
  it("splits mixed-script text into runs one font can draw", () => {
    expect(scriptRuns("NB-1234 බස් රථය, பேருந்து 08")).toEqual([
      { script: "latin", text: "NB-1234 " },
      { script: "sinhala", text: "බස් රථය" },
      { script: "latin", text: ", " },
      { script: "tamil", text: "பேருந்து " },
      { script: "latin", text: "08" },
    ]);
  });

  it.each(["en", "si", "ta"] as const)("generates a %s receipt", async (language) => {
    const { pdfBuffer, receiptId } = await generatePdfReceipt({
      receiptId: "BW-2026-ABCDEF",
      language,
      type: language === "ta" ? "commendation" : "complaint",
      busNumber: "NB-1234",
      routeNumber: "08",
      category: "overcharging",
      location: "Pettah",
      reportedAt: new Date(),
      description: "කොන්දොස්තර අධික ගාස්තුවක් අය කළා. நடத்துநர் உதவினார். Charged Rs. 150.",
    });
    expect(receiptId).toBe("BW-2026-ABCDEF");
    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
