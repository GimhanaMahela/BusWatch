import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reports } from "../src/db/schema.js";
import { blurredCloudinaryUrl } from "../src/services/ai.service.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// Claude is mocked: the service code runs for real, the network call doesn't
const ai = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  return { parse: vi.fn() };
});

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  class RateLimitError extends APIError {}
  class Anthropic {
    static APIError = APIError;
    static RateLimitError = RateLimitError;
    beta = { messages: { parse: ai.parse } };
  }
  return { default: Anthropic };
});
vi.mock("@anthropic-ai/sdk/helpers/beta/zod", () => ({
  betaZodOutputFormat: (schema: unknown) => schema,
}));

useTestDatabase();

const IMAGE = "https://res.cloudinary.com/demo/image/upload/v1/evidence.jpg";

const insights = (overrides: Record<string, unknown> = {}) => ({
  stop_reason: "end_turn",
  model: "claude-opus-5-5",
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
      model: "claude-opus-5-5",
    });

    // The request asks for structured output with refusal fallbacks, and fences the report text
    const params = ai.parse.mock.calls[0]![0];
    expect(params).toMatchObject({ fallbacks: "default", output_config: { effort: "low" } });
    expect(params.messages[0].content).toContain("<report>");
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

  it("explains refusals and API failures instead of failing with a 500", async () => {
    const token = await createAdminAndLogin();
    const id = await fileReport();

    ai.parse.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    const refused = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", token);
    expect(refused.status).toBe(503);

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    // The mocked class takes (status, message); the real one has a longer signature
    const MockApiError = Anthropic.APIError as unknown as new (
      status: number,
      message: string,
    ) => Error;
    ai.parse.mockRejectedValueOnce(new MockApiError(500, "overloaded"));
    const failed = await request(app)
      .post(`/api/reports/${id}/ai/analyse`)
      .set("x-auth-token", token);
    expect(failed.status).toBe(502);
  });

  it("is for the BusWatch team only", async () => {
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
      parsed_output: {
        regions: [{ kind: "number_plate", x: 0.5, y: 0.7, width: 0.2, height: 0.1 }],
      },
    });

    const res = await request(app).post(`/api/reports/${id}/ai/blur`).set("x-auth-token", token);
    expect(res.status).toBe(200);
    expect(res.body.blurredRegions).toBe(2);
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
