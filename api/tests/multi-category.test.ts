import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { reports } from "../src/db/schema.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// A passenger can tick more than one thing on a bus complaint (and more than one road problem).
// The first one ticked stays the main category; the rest are kept as extras.

useTestDatabase();

const findByReceipt = async (receiptId: string) => {
  const [row] = await db.select().from(reports).where(eq(reports.receiptId, receiptId));
  return row!;
};

describe("Several incident types on one report", () => {
  it("keeps the first as the category and the rest as extras, without repeats", async () => {
    const res = await submitReport({
      category: "overcharging",
      extraCategories: "harassment, loud_music,overcharging,harassment",
    });
    expect(res.status).toBe(201);
    expect(res.body.report).toMatchObject({
      category: "overcharging",
      extraCategories: ["harassment", "loud_music"],
    });
    const row = await findByReceipt(res.body.receiptId);
    expect(row.extraCategories).toEqual(["harassment", "loud_music"]);
  });

  it("files a single-category complaint with no extras, as before", async () => {
    const res = await submitReport();
    expect(res.status).toBe(201);
    expect((await findByReceipt(res.body.receiptId)).extraCategories).toEqual([]);
  });

  it("rejects extras that aren't complaint categories, or on other kinds of report", async () => {
    expect((await submitReport({ extraCategories: "accident" })).status).toBe(400);
    expect((await submitReport({ extraCategories: "nonsense" })).status).toBe(400);
    const commendation = await submitReport({
      type: "commendation",
      category: "helpful_staff",
      extraCategories: "overcharging",
    });
    expect(commendation.status).toBe(400);
  });

  it("asks for the accessibility checklist when accessibility is one of the extras", async () => {
    const without = await submitReport({ extraCategories: "accessibility" });
    expect(without.status).toBe(400);
    const withIssues = await submitReport({
      extraCategories: "accessibility",
      details: JSON.stringify({ accessibility: ["priority_seat"] }),
    });
    expect(withIssues.status).toBe(201);
  });

  it("finds a report by any of its categories, and drops a promoted extra", async () => {
    const admin = await createAdminAndLogin();
    const res = await submitReport({ extraCategories: "loud_music" });
    const { id } = await findByReceipt(res.body.receiptId);

    const found = await request(app)
      .get("/api/reports?category=loud_music")
      .set("x-auth-token", admin);
    expect(found.body.reports.map((r: { id: string }) => r.id)).toContain(id);

    const changed = await request(app)
      .put(`/api/reports/${id}/category`)
      .set("x-auth-token", admin)
      .send({ category: "loud_music" });
    expect(changed.status).toBe(200);
    expect(await findByReceipt(res.body.receiptId)).toMatchObject({
      category: "loud_music",
      extraCategories: [],
    });
  });

  it("keeps several road problems, the first as the main one", async () => {
    const res = await submitReport({
      type: "road_incident",
      busNumber: "",
      routeNumber: "",
      category: "road_hazard",
      details: JSON.stringify({
        road: { hazard: "pothole", extraHazards: ["flooding", "pothole", "flooding"] },
      }),
    });
    expect(res.status).toBe(201);
    const row = await findByReceipt(res.body.receiptId);
    expect(row.details?.road).toEqual({ hazard: "pothole", extraHazards: ["flooding"] });
  });
});
