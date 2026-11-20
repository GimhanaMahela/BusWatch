import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanDraft } from "../src/services/assistant.service.js";
import { app, useTestDatabase } from "./helpers.js";

// Gemini is stubbed at fetch: the service code runs for real, the network call doesn't
const gemini = vi.hoisted(() => {
  process.env.GEMINI_API_KEY = "test-key";
  return { reply: vi.fn() };
});

const realFetch = globalThis.fetch;
const geminiFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : input.toString();
  if (!url.startsWith("https://generativelanguage.googleapis.com/")) return realFetch(input, init);
  const answer = (await gemini.reply(JSON.parse(init?.body as string))) as
    { status: number } | Record<string, unknown>;
  if (typeof answer.status === "number") return new Response("error", { status: answer.status });
  return Response.json({
    modelVersion: "gemini-flash-latest",
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(answer) }] } }],
  });
});

beforeAll(() => vi.stubGlobal("fetch", geminiFetch));
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => gemini.reply.mockReset());

useTestDatabase();

const draft = (overrides: Record<string, unknown> = {}) => ({
  type: "complaint",
  category: "reckless_driving",
  busNumber: "nb-1234",
  routeNumber: "138",
  location: "Nugegoda junction",
  incidentAt: "2026-01-05T08:30",
  description: "The driver was racing another bus and nearly hit a tuk-tuk.",
  ...overrides,
});

const send = (messages: { role: string; text: string }[], language = "en") =>
  request(app).post("/api/assistant/chat").send({ messages, language });

describe("TransitX helper chat", () => {
  it("is switched on when Gemini is set up", async () => {
    const res = await request(app).get("/api/assistant/status");
    expect(res.body).toEqual({ enabled: true });
  });

  it("answers and returns a cleaned report draft", async () => {
    gemini.reply.mockResolvedValue({
      reply: "Thanks. Press Open the form to check it and add photos.",
      link: "submit_report",
      draft: draft(),
    });

    const res = await send([
      { role: "user", text: "A 138 bus was racing near Nugegoda" },
      { role: "assistant", text: "Sorry to hear that. Do you know the bus number?" },
      { role: "user", text: "NB-1234, around 8.30 this morning" },
    ]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      reply: "Thanks. Press Open the form to check it and add photos.",
      link: "submit_report",
      draft: { ...draft(), busNumber: "NB-1234" },
    });

    // The conversation goes to Gemini with its own roles, after the TransitX instructions
    const body = gemini.reply.mock.calls[0]![0];
    expect(body.contents.map((turn: { role: string }) => turn.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(body.system_instruction.parts[0].text).toContain("119");
    expect(body.generationConfig.responseJsonSchema.properties.draft).toBeDefined();
  });

  it("answers questions without a draft", async () => {
    gemini.reply.mockResolvedValue({
      reply: "Enter your receipt ID on the Track page.",
      link: "track",
      draft: null,
    });
    const res = await send([{ role: "user", text: "How do I check my report?" }], "si");
    expect(res.body).toMatchObject({ link: "track", draft: null });
    expect(gemini.reply.mock.calls[0]![0].system_instruction.parts[0].text).toContain("Sinhala");
  });

  it("checks the conversation it is sent", async () => {
    expect((await send([])).status).toBe(400);
    expect((await send([{ role: "assistant", text: "Hello" }])).status).toBe(400);
    expect((await send([{ role: "user", text: "x".repeat(2001) }])).status).toBe(400);
    const long = Array.from({ length: 31 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      text: "hi",
    }));
    expect((await send(long)).status).toBe(400);
    expect(gemini.reply).not.toHaveBeenCalled();
  });

  it("explains when the free quota is used up or the AI declines", async () => {
    // Over quota on the main and the fallback model
    gemini.reply.mockResolvedValueOnce({ status: 429 }).mockResolvedValueOnce({ status: 429 });
    const busy = await send([{ role: "user", text: "Hello" }]);
    expect(busy.status).toBe(503);
    expect(busy.body.msg).toMatch(/busy/);

    gemini.reply.mockResolvedValueOnce({ status: 400 });
    expect((await send([{ role: "user", text: "Hello" }])).status).toBe(503);
  });
});

describe("cleanDraft", () => {
  it("drops what the forms wouldn't accept", () => {
    const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    expect(
      cleanDraft({
        ...draft({ type: "commendation", busNumber: "NB/12#34!", incidentAt: tomorrow }),
        category: "reckless_driving",
      } as Parameters<typeof cleanDraft>[0]),
    ).toMatchObject({ type: "commendation", category: null, busNumber: "", incidentAt: "" });

    expect(cleanDraft({ ...draft(), incidentAt: "yesterday" } as never)?.incidentAt).toBe("");
    // Nothing worth a form yet
    expect(
      cleanDraft({ ...draft(), category: null, description: "  " } as Parameters<
        typeof cleanDraft
      >[0]),
    ).toBeNull();
  });
});
