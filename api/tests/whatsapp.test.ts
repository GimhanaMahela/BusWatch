import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANGUAGES } from "../src/config/constants.js";
import { env } from "../src/config/env.js";
import { reports, whatsappChats, whatsappSubscriptions } from "../src/db/schema.js";
import { messagesFor } from "../src/i18n/messages.js";
import { handleWhatsAppMessage, type WhatsAppMessage } from "../src/services/whatsapp.service.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// The BusWatch WhatsApp bot. Meta's Graph API and Gemini are stubbed at fetch, Cloudinary at its
// uploader; everything else (database, AI prompt handling, report filing) runs for real.

vi.mock("../src/config/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn((_data: string, options: { resource_type?: string; public_id?: string }) =>
        Promise.resolve({
          secure_url: `https://res.cloudinary.com/test/${options.resource_type ?? "image"}/${options.public_id ?? "media"}`,
        }),
      ),
    },
  },
}));

const PHONE = "94771234567";
const APP_SECRET = "app-secret";

interface Sent {
  to: string;
  type: string;
  text?: { body: string };
  interactive?: {
    body: { text: string };
    action: { buttons: { reply: { id: string; title: string } }[] };
  };
  template?: { name: string; language: { code: string }; components: unknown[] };
  document?: { link: string };
}

const sent: Sent[] = [];
const smsSent: unknown[] = [];
const gemini = { reply: vi.fn() };

const fakeFetch = async (input: string | URL | Request, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : input.toString();
  if (url.startsWith("https://graph.facebook.com/") && url.endsWith("/messages")) {
    sent.push(JSON.parse(init?.body as string) as Sent);
    return Response.json({ messages: [{ id: "wamid.out" }] });
  }
  if (url.startsWith("https://graph.facebook.com/")) {
    // Media lookup: where to download it
    const mimeType = url.includes("voice") ? "audio/ogg; codecs=opus" : "image/jpeg";
    return Response.json({ url: "https://lookaside.fbsbx.com/media", mime_type: mimeType });
  }
  if (url.startsWith("https://lookaside.fbsbx.com/")) {
    return new Response(new Uint8Array([1, 2, 3]));
  }
  if (url.startsWith("https://generativelanguage.googleapis.com/")) {
    const answer = (await gemini.reply(JSON.parse(init?.body as string))) as object;
    return Response.json({
      modelVersion: "gemini-flash-latest",
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(answer) }] } },
      ],
    });
  }
  if (url.startsWith("https://api.sms-gate.app/")) {
    smsSent.push(JSON.parse(init?.body as string));
    return Response.json({ id: "sms" });
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

const saved = { ...env };

useTestDatabase();

beforeEach(() => {
  sent.length = 0;
  smsSent.length = 0;
  gemini.reply.mockReset();
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  Object.assign(env, {
    WHATSAPP_ACCESS_TOKEN: "token",
    WHATSAPP_PHONE_NUMBER_ID: "1000",
    WHATSAPP_APP_SECRET: APP_SECRET,
    WHATSAPP_VERIFY_TOKEN: "verify-me",
    WHATSAPP_DISPLAY_NUMBER: "+94770000000",
    GEMINI_API_KEY: "test-key",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.assign(env, saved);
});

let nextId = 0;
const message = (fields: Partial<WhatsAppMessage>): WhatsAppMessage => ({
  from: PHONE,
  id: `wamid.${++nextId}`,
  type: "text",
  ...fields,
});
const say = (body: string) => handleWhatsAppMessage(message({ type: "text", text: { body } }));
const tap = (id: string) =>
  handleWhatsAppMessage(
    message({
      type: "interactive",
      interactive: { type: "button_reply", button_reply: { id, title: id } },
    }),
  );

const lastSent = () => sent.at(-1);
const bodyOf = (item?: Sent) => item?.text?.body ?? item?.interactive?.body.text ?? "";
const buttonIds = (item?: Sent) => item?.interactive?.action.buttons.map((b) => b.reply.id) ?? [];

const completeDraft = {
  type: "complaint",
  category: "reckless_driving",
  busNumber: "nb-1234",
  routeNumber: "138",
  location: "Nugegoda junction",
  incidentAt: "2026-01-05T08:30",
  description: "The driver was racing another bus and nearly hit a tuk-tuk.",
};

const webhookBody = (messages: WhatsAppMessage[], phoneNumberId = "1000") =>
  JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: { metadata: { phone_number_id: phoneNumberId }, messages },
          },
        ],
      },
    ],
  });

const sign = (body: string, secret = APP_SECRET) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

const postWebhook = (body: string, signature = sign(body)) =>
  request(app)
    .post("/api/whatsapp/webhook")
    .set("content-type", "application/json")
    .set("x-hub-signature-256", signature)
    .send(body);

describe("WhatsApp webhook", () => {
  it("answers Meta's verification request only with the right token", async () => {
    const ok = await request(app).get("/api/whatsapp/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": "verify-me",
      "hub.challenge": "12345",
    });
    expect(ok.status).toBe(200);
    expect(ok.text).toBe("12345");

    const wrong = await request(app).get("/api/whatsapp/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": "nope",
      "hub.challenge": "12345",
    });
    expect(wrong.status).toBe(403);
  });

  it("rejects calls without a valid signature", async () => {
    const body = webhookBody([message({ text: { body: "hi" } })]);
    expect((await postWebhook(body, sign(body, "wrong-secret"))).status).toBe(401);
    expect((await postWebhook(body, "")).status).toBe(401);
    expect(sent).toHaveLength(0);
  });

  it("handles signed messages once, even when Meta sends them again", async () => {
    const body = webhookBody([message({ id: "wamid.same", text: { body: "hi" } })]);
    expect((await postWebhook(body)).status).toBe(200);
    expect((await postWebhook(body)).status).toBe(200);
    expect(sent).toHaveLength(1);
    // A greeting gets the welcome with the three menu buttons
    expect(buttonIds(sent[0])).toEqual(["menu:report", "menu:commend", "menu:track"]);
    expect(sent[0]?.to).toBe(PHONE);
  });

  it("ignores messages to another number on the same Meta app", async () => {
    const body = webhookBody([message({ text: { body: "hi" } })], "9999");
    expect((await postWebhook(body)).status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  it("tells the website the bot's number", async () => {
    const res = await request(app).get("/api/passenger/channels");
    expect(res.body.whatsapp).toBe("+94770000000");
    Object.assign(env, { WHATSAPP_APP_SECRET: undefined });
    expect((await request(app).get("/api/passenger/channels")).body.whatsapp).toBeNull();
  });
});

describe("Reporting on WhatsApp", () => {
  it("chats, shows the finished report, and files it when the passenger presses Send", async () => {
    gemini.reply.mockResolvedValue({
      reply: "Thanks, I'll show you the report to check.",
      link: null,
      draft: completeDraft,
      transcript: null,
    });
    await handleWhatsAppMessage(
      message({ type: "image", image: { id: "media-1", mime_type: "image/jpeg" } }),
    );
    expect(bodyOf(lastSent())).toContain("1 photo");

    await say("A 138 bus NB-1234 was racing at Nugegoda junction this morning");
    // The helper ran in WhatsApp mode and knew about the photo
    const request = gemini.reply.mock.calls[0]![0];
    expect(request.system_instruction.parts[0].text).toContain("WhatsApp");
    expect(JSON.stringify(request.contents)).toContain("1 photo(s)");

    const [reply, check] = sent.slice(-2);
    expect(bodyOf(reply)).toBe("Thanks, I'll show you the report to check.");
    expect(bodyOf(check)).toContain("NB-1234");
    expect(bodyOf(check)).toContain("Nugegoda junction");
    expect(buttonIds(check)).toEqual(["draft:send", "draft:change", "draft:cancel"]);

    await tap("draft:send");
    const [report] = await db.select().from(reports);
    expect(report).toMatchObject({
      source: "whatsapp",
      busNumber: "NB-1234",
      routeNumber: "138",
      category: "reckless_driving",
      passengerPhone: "+94771234567",
      images: ["https://res.cloudinary.com/test/image/media"],
    });
    expect(bodyOf(sent.find((item) => bodyOf(item).includes(report!.receiptId)))).toContain(
      "Receipt ID",
    );
    // The PDF receipt goes along as a document
    expect(sent.some((item) => item.type === "document")).toBe(true);
    // The number follows its report, and the conversation is forgotten
    expect(await db.select().from(whatsappSubscriptions)).toHaveLength(1);
    const [chat] = await db.select().from(whatsappChats);
    expect(chat).toMatchObject({
      history: [],
      draft: null,
      media: [],
      awaitingConfirmation: false,
    });
    // No receipt SMS: the passenger got everything on WhatsApp
    expect(smsSent).toHaveLength(0);

    // A second tap doesn't file it twice
    await tap("draft:send");
    expect(await db.select().from(reports)).toHaveLength(1);
  });

  it("keeps asking while the bus, route or place is missing", async () => {
    gemini.reply.mockResolvedValue({
      reply: "Which bus was it? The number plate helps.",
      link: null,
      draft: { ...completeDraft, busNumber: null },
      transcript: null,
    });
    await say("The driver was racing");
    expect(sent).toHaveLength(1);
    expect(buttonIds(lastSent())).toEqual([]);
    await tap("draft:send");
    expect(await db.select().from(reports)).toHaveLength(0);
  });

  it("understands voice notes and keeps their words in the conversation", async () => {
    gemini.reply.mockResolvedValue({
      reply: "Which route was it?",
      link: null,
      draft: null,
      transcript: "බස් එක ගොඩක් වේගෙන් ගියා",
    });
    await handleWhatsAppMessage(
      message({
        type: "audio",
        audio: { id: "voice-1", mime_type: "audio/ogg; codecs=opus", voice: true },
      }),
    );
    const parts = gemini.reply.mock.calls[0]![0].contents.at(-1).parts;
    expect(parts[1].inline_data.mime_type).toBe("audio/ogg");
    const [chat] = await db.select().from(whatsappChats);
    expect(chat?.history[0]).toEqual({ role: "user", text: "බස් එක ගොඩක් වේගෙන් ගියා" });
  });

  it("can be cancelled", async () => {
    gemini.reply.mockResolvedValue({
      reply: "Check it:",
      link: null,
      draft: completeDraft,
      transcript: null,
    });
    await say("NB-1234 on route 138 at Nugegoda was racing");
    await tap("draft:cancel");
    const [chat] = await db.select().from(whatsappChats);
    expect(chat?.draft).toBeNull();
    await tap("draft:send");
    expect(await db.select().from(reports)).toHaveLength(0);
  });

  it("points to the website form when the AI helper is off", async () => {
    Object.assign(env, { GEMINI_API_KEY: undefined, FRONTEND_URL: undefined });
    await say("The bus driver was rude");
    expect(bodyOf(lastSent())).toContain("BW-2026-ABC123");
    expect(gemini.reply).not.toHaveBeenCalled();
  });

  it("answers in Sinhala when the passenger writes in Sinhala", async () => {
    await say("ආයුබෝවන්");
    expect(bodyOf(lastSent())).toBe(messagesFor("si").whatsapp.welcome);
  });
});

describe("Tracking and updates on WhatsApp", () => {
  it("shows a report's status for its receipt ID and follows it on request", async () => {
    const { body } = await submitReport({ passengerPhone: "0771234567" });
    await say(body.receiptId.toLowerCase());
    expect(bodyOf(lastSent())).toContain(body.receiptId);
    expect(bodyOf(lastSent())).toContain("Pending");
    expect(buttonIds(lastSent())).toEqual([`follow:${body.receiptId}`]);

    await tap(`follow:${body.receiptId}`);
    expect(await db.select().from(whatsappSubscriptions)).toHaveLength(1);

    // A status change reaches the follower on WhatsApp, and no SMS goes to the same number
    Object.assign(env, {
      SMS_PROVIDER: "android",
      ANDROID_SMS_USERNAME: "u",
      ANDROID_SMS_PASSWORD: "p",
    });
    sent.length = 0;
    const token = await createAdminAndLogin();
    const [report] = await db.select().from(reports);
    const update = await request(app)
      .put(`/api/reports/${report!.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "reviewed" });
    expect(update.body.delivery).toMatchObject({ whatsapp: 1, sms: false });
    expect(bodyOf(sent[0])).toContain(body.receiptId);
    expect(smsSent).toHaveLength(0);
  });

  it("says when a receipt ID doesn't exist", async () => {
    await say("BW-2026-ZZZZZZ");
    expect(bodyOf(lastSent())).toContain("couldn't find");
  });

  it("uses the approved template more than 24 hours after the passenger last wrote", async () => {
    const { body } = await submitReport();
    await tap(`follow:${body.receiptId}`);
    await db
      .update(whatsappChats)
      .set({ lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000) });
    const token = await createAdminAndLogin();
    const [report] = await db.select().from(reports);
    sent.length = 0;

    // Without a template the number can't be messaged
    let update = await request(app)
      .put(`/api/reports/${report!.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "reviewed" });
    expect(update.body.delivery.whatsapp).toBe(0);
    expect(sent).toHaveLength(0);

    Object.assign(env, { WHATSAPP_UPDATE_TEMPLATE: "report_update" });
    update = await request(app)
      .put(`/api/reports/${report!.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "escalated" });
    expect(update.body.delivery.whatsapp).toBe(1);
    expect(sent[0]).toMatchObject({ type: "template", template: { name: "report_update" } });
  });

  it("STOP ends every update and forgets the conversation", async () => {
    const { body } = await submitReport();
    await tap(`follow:${body.receiptId}`);
    await say("stop");
    expect(await db.select().from(whatsappSubscriptions)).toHaveLength(0);
    expect(bodyOf(lastSent())).toBe(messagesFor("en").whatsapp.stopped);
  });

  it("limits how many messages one number can send in an hour", async () => {
    await say("hi");
    await db
      .update(whatsappChats)
      .set({ windowCount: 1000 })
      .where(eq(whatsappChats.phone, `+${PHONE}`));
    await say("hello again");
    expect(bodyOf(lastSent())).toBe(messagesFor("en").whatsapp.tooMany);
  });
});

it("keeps every button title within WhatsApp's 20-character limit", () => {
  for (const language of LANGUAGES) {
    for (const title of Object.values(messagesFor(language).whatsapp.buttons)) {
      expect(title.length, title).toBeLessThanOrEqual(20);
    }
  }
});
