import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { reports } from "../src/db/schema.js";
import { blurredCloudinaryUrl } from "../src/services/ai.service.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// Gemini is stubbed at fetch: the service code runs for real, the network call doesn't
const ai = vi.hoisted(() => {
  process.env.GEMINI_API_KEY = "test-key";
  return { parse: vi.fn() };
});

type GeminiReply =
  | { stop_reason: string; model?: string; parsed_output: unknown }
  | { status: number; body: string };

/** Answers Gemini calls with what ai.parse returns (or a photo for image downloads). */
const realFetch = globalThis.fetch;
const geminiFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : input.toString();
  if (url.startsWith("https://res.cloudinary.com/")) {
    return new Response(new Uint8Array([0xff, 0xd8, 0xff]), {
      headers: { "content-type": "image/jpeg" },
    });
  }
  if (!url.startsWith("https://generativelanguage.googleapis.com/")) return realFetch(input, init);
  const reply = (await ai.parse(JSON.parse(init?.body as string), url)) as GeminiReply;
  if ("status" in reply) return new Response(reply.body, { status: reply.status });
  if (reply.stop_reason === "refusal") {
    return Response.json({ promptFeedback: { blockReason: "SAFETY" } });
  }
  return Response.json({
    modelVersion: reply.model,
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(reply.parsed_output) }] },
      },
    ],
  });
});

beforeAll(() => vi.stubGlobal("fetch", geminiFetch));
afterAll(() => vi.unstubAllGlobals());

useTestDatabase();

const IMAGE = "https://res.cloudinary.com/demo/image/upload/v1/evidence.jpg";

const insights = (overrides: Record<string, unknown> = {}) => ({
  stop_reason: "end_turn",
  model: "gemini-flash-latest",
  parsed_output: {
    detectedLanguage: "si",
    englishTranslation: "The driver was racing another bus.",
    summary: null,
    suggestedCategory: "reckless_driving",
    categoryConfidence: "high",
    categoryReason: "Racing another bus is reckless driving.",
    flags: [],
    ...overrides,
  },
});

const fileReport = async (fields: Record<string, string> = {}) => {
  const res = await submitReport({ category: "other", ...fields });
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(eq(reports.receiptId, res.body.receiptId as string));
  return row!.id;
};

beforeEach(() => ai.parse.mockReset());

describe("AI help: analysing a report", () => {
  it("stores a category suggestion, translation and flags for admins", async () => {
    const token = await createAdminAndLogin();
    expect(
      (await request(app).get("/api/reports/ai/status").set("x-auth-token", token)).body,
    ).toEqual({ enabled: true });

    const id = await fileReport({ description: "ඩ්‍රයිවර් තව බස් එකක් එක්ක රේස් කළා" });
    ai.parse.mockResolvedValue(insights({ flags: ["possible_emergency"] }));

    const res = await request(app).post(`/api/reports/${id}/ai/analyse`).set("x-auth-token", token);
    expect(res.status).toBe(200);
    expect(res.body.aiInsights).toMatchObject({
      suggestedCategory: "reckless_driving",
      englishTranslation: "The driver was racing another bus.",
      flags: ["possible_emergency"],
      model: "gemini-flash-latest",
    });

    // The request asks for structured JSON, keeps safety filters from blocking serious reports,
    // and fences the report text
    const params = ai.parse.mock.calls[0]![0];
    expect(params.generationConfig).toMatchObject({ responseMimeType: "application/json" });
    expect(params.generationConfig.responseJsonSchema.properties.suggestedCategory).toBeDefined();
    expect(params.safetySettings[0]).toMatchObject({ threshold: "BLOCK_NONE" });
    expect(params.contents[0].parts[0].text).toContain("<report>");
  });

  it("never suggests a commendation category for a complaint, nor translates English", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();
    ai.parse.mockResolvedValue(
      insights({ detectedLanguage: "en", suggestedCategory: "safe_driving" }),
    );
    const res = await request(app).post(`/api/reports/${id}/ai/analyse`).set("x-auth-token", token);
    expect(res.body.aiInsights).toMatchObject({
      suggestedCategory: "other",
      englishTranslation: null,
    });
  });

  it("explains refusals, quota limits and API failures instead of failing with a 500", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();

    ai.parse.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    const refused = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", token);
    expect(refused.status).toBe(503);

    // Over quota on both the main and the fallback model
    ai.parse.mockResolvedValueOnce({ status: 429, body: "quota" });
    ai.parse.mockResolvedValueOnce({ status: 429, body: "quota" });
    const quota = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", token);
    expect(quota.status).toBe(503);
    expect(quota.body.msg).toMatch(/quota/);

    // "High demand" everywhere: each model is tried three times, then the admin is told
    ai.parse.mockReset();
    ai.parse.mockResolvedValue({ status: 503, body: "high demand" });
    const busy = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", token);
    expect(ai.parse).toHaveBeenCalledTimes(6);
    expect(busy.status).toBe(503);
    expect(busy.body.msg).toMatch(/busy/);

    // Other errors aren't retried
    ai.parse.mockReset();
    ai.parse.mockResolvedValue({ status: 400, body: "bad request" });
    const failed = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", token);
    expect(ai.parse).toHaveBeenCalledTimes(1);
    expect(failed.status).toBe(502);
  });

  it("falls back to the lighter model when the main one is busy", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();
    ai.parse
      .mockResolvedValueOnce({ status: 503, body: "high demand" })
      .mockResolvedValueOnce({ status: 503, body: "high demand" })
      .mockResolvedValueOnce({ status: 503, body: "high demand" })
      .mockResolvedValueOnce({ ...insights(), model: undefined });

    const res = await request(app).post(`/api/reports/${id}/ai/analyse`).set("x-auth-token", token);
    expect(res.status).toBe(200);
    const urls = ai.parse.mock.calls.map((call) => call[1] as string);
    expect(urls[0]).toContain("/models/gemini-flash-latest:generateContent");
    expect(urls[3]).toContain("/models/gemini-flash-lite-latest:generateContent");
    expect(res.body.aiInsights.model).toBe("gemini-flash-lite-latest");
  });

  it("moves on to the lighter model when the main one doesn't answer in time", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();
    ai.parse
      .mockImplementationOnce(() => {
        throw new DOMException("The operation timed out.", "TimeoutError");
      })
      .mockResolvedValueOnce({ ...insights(), model: undefined });

    const res = await request(app).post(`/api/reports/${id}/ai/analyse`).set("x-auth-token", token);
    expect(res.status).toBe(200);
    // A model that timed out isn't asked again: that would only wait again
    const urls = ai.parse.mock.calls.map((call) => call[1] as string);
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain("/models/gemini-flash-lite-latest:generateContent");
    expect(res.body.aiInsights.model).toBe("gemini-flash-lite-latest");
  });

  it("says the AI is too slow, rather than failing, when no model answers", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();
    const timeout = () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    };
    ai.parse.mockImplementationOnce(timeout).mockImplementationOnce(timeout);

    const res = await request(app).post(`/api/reports/${id}/ai/analyse`).set("x-auth-token", token);
    expect(res.status).toBe(503);
    expect(res.body.msg).toMatch(/taking too long/);
    expect(ai.parse).toHaveBeenCalledTimes(2);
  });

  it("is for the TransitX team only", async () => {
    const id = await fileReport();
    const operator = await createAdminAndLogin("owner@bus.lk", "operator");
    const res = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", operator);
    expect(res.status).toBe(403);
    expect((await request(app).post(`/api/reports/${id}/ai/analyse`)).status).toBe(401);
    expect(ai.parse).not.toHaveBeenCalled();
  });

  it("lets admins apply a category that fits the report type", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();
    const ok = await request(app)
      .put(`/api/reports/${id}/category`)
      .set("x-auth-token", token)
      .send({ category: "reckless_driving" });
    expect(ok.status).toBe(200);
    expect(ok.body.category).toBe("reckless_driving");

    const wrongType = await request(app)
      .put(`/api/reports/${id}/category`)
      .set("x-auth-token", token)
      .send({ category: "safe_driving" });
    expect(wrongType.status).toBe(400);
  });
});

describe("AI help: blurring faces and number plates", () => {
  it("stores blurred copies of the photos, which operators then see", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport({ busNumber: "NB-1234" });
    await db
      .update(reports)
      .set({ images: [IMAGE, "https://example.com/not-cloudinary.jpg"], status: "reviewed" })
      .where(eq(reports.id, id));
    ai.parse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { regions: [{ kind: "number_plate", box_2d: [700, 500, 800, 700] }] },
    });

    const res = await request(app).post(`/api/reports/${id}/ai/blur`).set("x-auth-token", token);
    expect(res.status).toBe(200);
    // Only the Cloudinary photo is sent (others can't be blurred), as an inline image
    expect(res.body.blurredRegions).toBe(1);
    expect(ai.parse).toHaveBeenCalledTimes(1);
    expect(ai.parse.mock.calls[0]![0].contents[0].parts[0].inline_data.mime_type).toBe(
      "image/jpeg",
    );
    expect(res.body.blurredImages).toEqual([
      "https://res.cloudinary.com/demo/image/upload/e_blur_faces:1000/e_blur_region:1500,x_0.470,y_0.670,w_0.260,h_0.160/v1/evidence.jpg",
    ]);
    // The originals are kept for admins
    expect(res.body.images).toHaveLength(2);

    await request(app)
      .post("/api/auth/register")
      .set("x-auth-token", token)
      .send({
        email: "owner@bus.lk",
        password: "operatorpass1",
        role: "operator",
        organisation: "NB Travels",
        busNumbers: ["NB1234"],
      });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@bus.lk", password: "operatorpass1" });
    const seen = await request(app)
      .get(`/api/operator/reports/${id}`)
      .set("x-auth-token", login.body.token as string);
    expect(seen.body.images).toEqual(res.body.blurredImages);
  });

  it("needs photos", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();
    const res = await request(app).post(`/api/reports/${id}/ai/blur`).set("x-auth-token", token);
    expect(res.status).toBe(400);
  });
});

describe("blurredCloudinaryUrl", () => {
  it("keeps boxes inside the image and ignores other hosts", () => {
    const url = blurredCloudinaryUrl(IMAGE, [
      { kind: "face", x: -0.2, y: 0.95, width: 0.5, height: 0.5 },
    ]);
    expect(url).toBe(
      "https://res.cloudinary.com/demo/image/upload/e_blur_faces:1000/e_blur_region:1500,x_0.000,y_0.920,w_0.560,h_0.080/v1/evidence.jpg",
    );
    expect(blurredCloudinaryUrl("https://example.com/a.jpg", [])).toBeNull();
  });
});
