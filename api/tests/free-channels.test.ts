import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { reports, telegramSubscriptions } from "../src/db/schema.js";
import { sendSms } from "../src/services/sms.service.js";
import {
  createFollowToken,
  handleTelegramUpdate,
  readFollowToken,
} from "../src/services/telegram.service.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// Free channels: SMS from an Android phone (SMS Gateway for Android) and a Telegram bot.
// Outgoing HTTP calls are captured by a fake fetch.

interface Call {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

const calls: Call[] = [];
/** Telegram's reply to sendMessage, e.g. { ok: false, error_code: 403 } for a blocked bot */
let telegramSendReply: object = { ok: true, result: {} };

const fakeFetch = (input: string | URL | Request, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : input.toString();
  calls.push({
    url,
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: JSON.parse(typeof init?.body === "string" ? init.body : "{}") as Record<string, unknown>,
  });
  const reply = url.endsWith("/getMe")
    ? { ok: true, result: { username: "BusWatchTestBot" } }
    : url.endsWith("/sendMessage")
      ? telegramSendReply
      : { ok: true, result: {} };
  return Promise.resolve(new Response(JSON.stringify(reply), { status: 200 }));
};

const saved = { ...env };

useTestDatabase();

beforeEach(() => {
  calls.length = 0;
  telegramSendReply = { ok: true, result: {} };
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  Object.assign(env, { TELEGRAM_BOT_TOKEN: "123:test-token" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.assign(env, saved);
});

const telegramMessages = () =>
  calls
    .filter((call) => call.url.endsWith("/sendMessage"))
    .map((call) => ({ chat: call.body.chat_id, text: String(call.body.text) }));

const privateMessage = (text: string, chatId = 555, type = "private") => ({
  update_id: 1,
  message: { text, chat: { id: chatId, type }, from: { language_code: "en" } },
});

const followers = (reportId: string) =>
  db.select().from(telegramSubscriptions).where(eq(telegramSubscriptions.reportId, reportId));

const submitAndFind = async (fields: Record<string, string> = {}) => {
  const submitted = await submitReport(fields);
  const report = await db.query.reports.findFirst({
    where: eq(reports.receiptId, submitted.body.receiptId),
  });
  if (!report) throw new Error("report not saved");
  return report;
};

describe("SMS from an Android phone", () => {
  it("sends through SMS Gateway for Android with basic auth", async () => {
    Object.assign(env, {
      SMS_PROVIDER: "android",
      ANDROID_SMS_URL: "http://192.168.1.20:8080/",
      ANDROID_SMS_USERNAME: "sms",
      ANDROID_SMS_PASSWORD: "secret",
    });

    expect(await sendSms("+94771234567", "BusWatch: hello")).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("http://192.168.1.20:8080/message");
    expect(calls[0]?.headers.Authorization).toBe(
      `Basic ${Buffer.from("sms:secret").toString("base64")}`,
    );
    expect(calls[0]?.body).toEqual({
      textMessage: { text: "BusWatch: hello" },
      phoneNumbers: ["+94771234567"],
    });
  });

  it("is off until the gateway's username and password are set", async () => {
    Object.assign(env, { SMS_PROVIDER: "android", ANDROID_SMS_USERNAME: undefined });
    expect(await sendSms("+94771234567", "hi")).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("reports the channels that are switched on", async () => {
    Object.assign(env, {
      SMS_PROVIDER: "android",
      ANDROID_SMS_USERNAME: "sms",
      ANDROID_SMS_PASSWORD: "secret",
    });
    const res = await request(app).get("/api/passenger/channels");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sms: true, telegram: true });

    Object.assign(env, { SMS_PROVIDER: "none", TELEGRAM_BOT_TOKEN: undefined });
    const off = await request(app).get("/api/passenger/channels");
    expect(off.body).toMatchObject({ sms: false, telegram: false });
  });
});

describe("Telegram follow links", () => {
  it("only accepts signed, unexpired tokens", () => {
    const now = Date.UTC(2026, 10, 5);
    const token = createFollowToken("BW-2026-7KQ4MZ", now);
    expect(token.length).toBeLessThanOrEqual(64);
    expect(token).toMatch(/^[\w-]+$/);
    expect(readFollowToken(token, now)).toBe("BW-2026-7KQ4MZ");

    expect(readFollowToken(token.replace("7KQ4MZ", "7KQ4MY"), now)).toBeNull();
    expect(readFollowToken(`${token.slice(0, -1)}x`, now)).toBeNull();
    expect(readFollowToken(token, now + 25 * 60 * 60 * 1000)).toBeNull();
    expect(readFollowToken("BW-2026-7KQ4MZ", now)).toBeNull();
  });

  it("gives the tracking page a t.me link for the report", async () => {
    const report = await submitAndFind();
    const res = await request(app).get(`/api/reports/track/${report.receiptId}/telegram`);
    expect(res.status).toBe(200);
    const url = new URL(res.body.url as string);
    expect(url.origin + url.pathname).toBe("https://t.me/BusWatchTestBot");
    expect(readFollowToken(url.searchParams.get("start") ?? "")).toBe(report.receiptId);

    expect((await request(app).get("/api/reports/track/BW-2026-NOPE00/telegram")).status).toBe(404);
  });

  it("says Telegram is unavailable when no bot is set up", async () => {
    Object.assign(env, { TELEGRAM_BOT_TOKEN: undefined });
    const report = await submitAndFind();
    const res = await request(app).get(`/api/reports/track/${report.receiptId}/telegram`);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("telegram_unavailable");
  });
});

describe("Telegram bot", () => {
  it("follows the report when the passenger presses Start, in the report's language", async () => {
    const report = await submitAndFind({ language: "si" });
    await handleTelegramUpdate(privateMessage(`/start ${createFollowToken(report.receiptId)}`));

    expect(await followers(report.id)).toHaveLength(1);
    const [reply] = telegramMessages();
    expect(reply?.chat).toBe("555");
    expect(reply?.text).toContain(report.receiptId);
    expect(reply?.text).toContain("/stop");
    expect(reply?.text).toMatch(/[඀-෿]/); // Sinhala

    // Pressing Start again doesn't follow twice
    await handleTelegramUpdate(privateMessage(`/start ${createFollowToken(report.receiptId)}`));
    expect(await followers(report.id)).toHaveLength(1);
  });

  it("refuses bad links and ignores group chats", async () => {
    const report = await submitAndFind();
    await handleTelegramUpdate(privateMessage("/start BW-2026-AAAAAA_zzzz_aaaaaaaaaaaaaaaa"));
    expect(telegramMessages()[0]?.text).toContain("expired");

    await handleTelegramUpdate(
      privateMessage(`/start ${createFollowToken(report.receiptId)}`, -100, "group"),
    );
    expect(await followers(report.id)).toHaveLength(0);
    expect(telegramMessages()).toHaveLength(1);
  });

  it("answers other messages with how to follow a report", async () => {
    await handleTelegramUpdate(privateMessage("hello"));
    expect(telegramMessages()[0]?.text).toContain("Get updates on Telegram");
  });

  it("sends status updates and messages without their content, and /stop ends them", async () => {
    const report = await submitAndFind();
    await handleTelegramUpdate(privateMessage(`/start ${createFollowToken(report.receiptId)}`));
    calls.length = 0;

    const token = await createAdminAndLogin();
    const update = await request(app)
      .put(`/api/reports/${report.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "escalated", note: "Sent to the NTC" });
    expect(update.body.delivery).toMatchObject({ telegram: 1 });
    expect(telegramMessages()[0]?.text).toContain(report.receiptId);
    expect(telegramMessages()[0]?.text).not.toContain("NTC");

    const asked = await request(app)
      .post(`/api/reports/${report.id}/messages`)
      .set("x-auth-token", token)
      .send({ body: "Which seat were you in?", notifyPassenger: true });
    expect(asked.body.delivery).toMatchObject({ telegram: 1 });
    expect(telegramMessages()[1]?.text).not.toContain("seat");

    await handleTelegramUpdate(privateMessage("/stop"));
    expect(await followers(report.id)).toHaveLength(0);
  });

  it("forgets chats that blocked the bot", async () => {
    const report = await submitAndFind();
    await handleTelegramUpdate(privateMessage(`/start ${createFollowToken(report.receiptId)}`));
    telegramSendReply = { ok: false, error_code: 403, description: "Forbidden: bot was blocked" };

    const token = await createAdminAndLogin();
    const update = await request(app)
      .put(`/api/reports/${report.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "reviewed" });
    expect(update.status).toBe(200);
    expect(update.body.delivery).toMatchObject({ telegram: 0 });
    expect(await followers(report.id)).toHaveLength(0);
  });

  it("only accepts webhook calls carrying the secret", async () => {
    Object.assign(env, { TELEGRAM_WEBHOOK_SECRET: "hook-secret" });
    const send = (secret?: string) => {
      const req = request(app).post("/api/telegram/webhook");
      if (secret) req.set("X-Telegram-Bot-Api-Secret-Token", secret);
      return req.send(privateMessage("hello"));
    };
    expect((await send()).status).toBe(401);
    expect((await send("wrong")).status).toBe(401);
    expect((await send("hook-secret")).status).toBe(200);
    expect(telegramMessages()).toHaveLength(1);
  });
});
