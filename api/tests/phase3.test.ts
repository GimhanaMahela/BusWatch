import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { pushSubscriptions, reports, reportStatusChanges } from "../src/db/schema.js";
import type * as EmailService from "../src/services/email.service.js";
import { normalisePhone } from "../src/utils/phone.js";
import { app, createAdminAndLogin, db, submitReport, useTestDatabase } from "./helpers.js";

// Outgoing email, SMS and push are captured instead of sent
const sent = vi.hoisted(() => ({
  emails: [] as { kind: string; to: string; text: string }[],
  sms: [] as { to: string; text: string }[],
  push: [] as { endpoint: string; payload: string }[],
  pushFailure: null as number | null,
}));

vi.mock("../src/services/email.service.js", async (importOriginal) => {
  const original = await importOriginal<typeof EmailService>();
  return {
    ...original,
    isEmailConfigured: () => true,
    sendReportReceiptEmail: () => Promise.resolve(false),
    sendStatusUpdateEmail: ({ toEmail, status }: { toEmail: string; status: string }) => {
      sent.emails.push({ kind: "status", to: toEmail, text: status });
      return Promise.resolve(true);
    },
    sendSignInCodeEmail: ({ toEmail, code }: { toEmail: string; code: string }) => {
      sent.emails.push({ kind: "code", to: toEmail, text: code });
      return Promise.resolve(true);
    },
    sendMessageEmail: ({ toEmail, body }: { toEmail: string; body: string }) => {
      sent.emails.push({ kind: "message", to: toEmail, text: body });
      return Promise.resolve(true);
    },
  };
});

vi.mock("../src/services/sms.service.js", () => ({
  isSmsConfigured: () => true,
  sendSms: (to: string, text: string) => {
    sent.sms.push({ to, text });
    return Promise.resolve(true);
  },
}));

vi.mock("web-push", () => {
  class WebPushError extends Error {
    constructor(readonly statusCode: number) {
      super(`push failed ${statusCode}`);
    }
  }
  return {
    WebPushError,
    default: {
      setVapidDetails: () => undefined,
      sendNotification: (sub: { endpoint: string }, payload: string) => {
        if (sent.pushFailure) return Promise.reject(new WebPushError(sent.pushFailure));
        sent.push.push({ endpoint: sub.endpoint, payload });
        return Promise.resolve({ statusCode: 201 });
      },
    },
  };
});

useTestDatabase();

beforeEach(() => {
  sent.emails.length = 0;
  sent.sms.length = 0;
  sent.push.length = 0;
  sent.pushFailure = null;
});

const lastCode = () => {
  const codes = [
    ...sent.emails.filter((e) => e.kind === "code").map((e) => e.text),
    ...sent.sms.map((s) => /\b(\d{6})\b/.exec(s.text)?.[1]).filter(Boolean),
  ];
  return codes.at(-1) as string;
};

const signIn = async (contact: string) => {
  await request(app).post("/api/passenger/code").send({ contact });
  const res = await request(app).post("/api/passenger/session").send({ contact, code: lastCode() });
  expect(res.status).toBe(200);
  return res.body.token as string;
};

describe("phone numbers", () => {
  it("normalises Sri Lankan mobiles typed any common way", () => {
    for (const input of [
      "0771234567",
      "771234567",
      "94771234567",
      "+94 77 123 4567",
      "077-123-4567",
    ]) {
      expect(normalisePhone(input)).toBe("+94771234567");
    }
    expect(normalisePhone("+447700900123")).toBe("+447700900123");
    expect(normalisePhone("0112345678")).toBeNull(); // landline: can't receive SMS
    expect(normalisePhone("12345")).toBeNull();
  });

  it("stores the phone given with a report and texts the receipt", async () => {
    const res = await submitReport({ passengerPhone: "077 123 4567" });
    expect(res.status).toBe(201);
    expect(res.body.smsSent).toBe(true);
    const row = await db.query.reports.findFirst({
      where: eq(reports.receiptId, res.body.receiptId),
    });
    expect(row?.passengerPhone).toBe("+94771234567");
    expect(sent.sms[0]).toMatchObject({ to: "+94771234567" });
    expect(sent.sms[0]?.text).toContain(res.body.receiptId);

    expect((await submitReport({ passengerPhone: "12345" })).status).toBe(400);
  });
});

describe('"My reports" sign-in', () => {
  it("answers the same for unknown contacts and sends them nothing", async () => {
    const res = await request(app).post("/api/passenger/code").send({ contact: "nobody@test.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ channel: "email", sentTo: "no***@test.com" });
    expect(sent.emails).toHaveLength(0);
  });

  it("signs in with a one-time code and lists only that passenger's reports", async () => {
    await submitReport({ passengerEmail: "Kamal@Test.com", busNumber: "NB-1" });
    await submitReport({ passengerEmail: "kamal@test.com", busNumber: "NB-2" });
    await submitReport({ passengerEmail: "other@test.com", busNumber: "NB-3" });

    const codeRes = await request(app)
      .post("/api/passenger/code")
      .send({ contact: " KAMAL@test.com " });
    expect(codeRes.body.sentTo).toBe("ka***@test.com");
    const code = lastCode();
    expect(code).toMatch(/^\d{6}$/);

    const wrong = await request(app)
      .post("/api/passenger/session")
      .send({ contact: "kamal@test.com", code: code === "000000" ? "111111" : "000000" });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe("invalid_code");

    const session = await request(app)
      .post("/api/passenger/session")
      .send({ contact: "kamal@test.com", code });
    expect(session.status).toBe(200);

    // Each code works once
    const again = await request(app)
      .post("/api/passenger/session")
      .send({ contact: "kamal@test.com", code });
    expect(again.status).toBe(400);

    const mine = await request(app)
      .get("/api/passenger/reports")
      .set("x-passenger-token", session.body.token);
    expect(mine.status).toBe(200);
    expect(mine.body.reports.map((r: { busNumber: string }) => r.busNumber).sort()).toEqual([
      "NB-1",
      "NB-2",
    ]);
    expect(JSON.stringify(mine.body)).not.toContain("Driver was speeding");
  });

  it("signs in by phone however the number is typed", async () => {
    await submitReport({ passengerPhone: "+94 77 123 4567" });
    const token = await signIn("0771234567");
    const mine = await request(app).get("/api/passenger/reports").set("x-passenger-token", token);
    expect(mine.body.reports).toHaveLength(1);
    expect(mine.body.contact.display).toBe("+9477***4567");
  });

  it("locks a code after too many wrong guesses", async () => {
    await submitReport({ passengerEmail: "nimal@test.com" });
    await request(app).post("/api/passenger/code").send({ contact: "nimal@test.com" });
    const code = lastCode();
    const wrongCode = code === "123456" ? "654321" : "123456";
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/passenger/session")
        .send({ contact: "nimal@test.com", code: wrongCode });
    }
    const res = await request(app)
      .post("/api/passenger/session")
      .send({ contact: "nimal@test.com", code });
    expect(res.status).toBe(400);
  });

  it("limits how many codes one contact is sent, and a new code replaces the old one", async () => {
    await submitReport({ passengerEmail: "sunil@test.com" });
    for (let i = 0; i < 4; i++) {
      await request(app).post("/api/passenger/code").send({ contact: "sunil@test.com" });
    }
    expect(sent.emails.filter((e) => e.kind === "code")).toHaveLength(3);
    const [first] = sent.emails;
    const old = await request(app)
      .post("/api/passenger/session")
      .send({ contact: "sunil@test.com", code: first?.text });
    // Unless the random codes happened to repeat, the first one no longer works
    if (first?.text !== lastCode()) expect(old.status).toBe(400);
  });

  it("keeps passenger and admin sessions apart", async () => {
    await submitReport({ passengerEmail: "amal@test.com" });
    const passengerToken = await signIn("amal@test.com");
    const adminToken = await createAdminAndLogin();

    expect(
      (await request(app).get("/api/reports").set("x-auth-token", passengerToken)).status,
    ).toBe(401);
    expect(
      (await request(app).get("/api/passenger/reports").set("x-passenger-token", adminToken))
        .status,
    ).toBe(401);
    expect((await request(app).get("/api/passenger/reports")).status).toBe(401);
  });

  it("rejects contacts that are neither an email nor a mobile number", async () => {
    const res = await request(app).post("/api/passenger/code").send({ contact: "hello" });
    expect(res.status).toBe(400);
  });
});

describe("messages between admin and passenger", () => {
  it("lets the team ask a question and the passenger reply", async () => {
    const submitted = await submitReport({
      passengerEmail: "kamal@test.com",
      passengerPhone: "0771234567",
    });
    const receiptId = String(submitted.body.receiptId);
    const report = await db.query.reports.findFirst({ where: eq(reports.receiptId, receiptId) });
    const token = await createAdminAndLogin();
    sent.sms.length = 0;

    const asked = await request(app)
      .post(`/api/reports/${report?.id}/messages`)
      .set("x-auth-token", token)
      .send({ body: "Which seat were you in?" });
    expect(asked.status).toBe(201);
    expect(asked.body.delivery).toEqual({ email: true, sms: true, push: 0, telegram: 0 });
    expect(asked.body.messages).toEqual([
      expect.objectContaining({ sender: "admin", author: "root@test.com" }),
    ]);
    expect(sent.emails.at(-1)).toMatchObject({ kind: "message", to: "kamal@test.com" });
    // The SMS says there is a message, but not what it says
    expect(sent.sms.at(-1)?.text).not.toContain("seat");

    // The passenger sees it on the tracking page, without the admin's email
    const tracked = await request(app).get(`/api/reports/track/${receiptId}`);
    expect(tracked.body.messages).toEqual([
      expect.objectContaining({ sender: "admin", body: "Which seat were you in?" }),
    ]);
    expect(JSON.stringify(tracked.body)).not.toContain("root@test.com");
    expect(tracked.body.canReply).toBe(true);

    // "My reports" shows it as unread until the passenger opens the tracking page
    const passengerToken = await signIn("kamal@test.com");
    const unread = async () =>
      (await request(app).get("/api/passenger/reports").set("x-passenger-token", passengerToken))
        .body.reports[0].unreadMessages as number;
    expect(await unread()).toBe(1);
    await request(app).post(`/api/reports/track/${receiptId}/messages/read`);
    expect(await unread()).toBe(0);

    const replied = await request(app)
      .post(`/api/reports/track/${receiptId}/messages`)
      .send({ body: "The front seat, next to the driver." });
    expect(replied.status).toBe(201);
    expect(replied.body.messages.at(-1)).toMatchObject({ sender: "passenger", read: false });

    // The reports table flags it for admins until someone opens the report
    const list = async () =>
      (await request(app).get("/api/reports").set("x-auth-token", token)).body.reports[0]
        .unreadMessages as number;
    expect(await list()).toBe(1);
    await request(app).post(`/api/reports/${report?.id}/messages/read`).set("x-auth-token", token);
    expect(await list()).toBe(0);
  });

  it("needs an admin to send team messages and rejects empty replies", async () => {
    const submitted = await submitReport();
    const report = await db.query.reports.findFirst({
      where: eq(reports.receiptId, submitted.body.receiptId),
    });
    expect(
      (await request(app).post(`/api/reports/${report?.id}/messages`).send({ body: "Hi" })).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post(`/api/reports/track/${submitted.body.receiptId}/messages`)
          .send({ body: "  " })
      ).status,
    ).toBe(400);
  });

  it("stops replies a month after the report was closed", async () => {
    const submitted = await submitReport();
    const report = await db.query.reports.findFirst({
      where: eq(reports.receiptId, submitted.body.receiptId),
    });
    const token = await createAdminAndLogin();
    await request(app)
      .put(`/api/reports/${report?.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "resolved" });

    const reply = () =>
      request(app)
        .post(`/api/reports/track/${submitted.body.receiptId}/messages`)
        .send({ body: "Thanks!" });
    expect((await reply()).status).toBe(201);

    const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await db
      .update(reportStatusChanges)
      .set({ changedAt: longAgo })
      .where(eq(reportStatusChanges.reportId, report?.id ?? ""));
    const late = await reply();
    expect(late.status).toBe(409);
    expect(late.body.code).toBe("reply_closed");
  });

  it("counts a message as the team's first response", async () => {
    const submitted = await submitReport();
    const report = await db.query.reports.findFirst({
      where: eq(reports.receiptId, submitted.body.receiptId),
    });
    const token = await createAdminAndLogin();
    const stats = async (): Promise<{ respondedReports: number; adminMessages: number }> =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- JSON response
      (await request(app).get("/api/reports/stats").set("x-auth-token", token)).body.engagement;
    expect((await stats()).respondedReports).toBe(0);

    await request(app)
      .post(`/api/reports/${report?.id}/messages`)
      .set("x-auth-token", token)
      .send({ body: "Thanks, we're looking into it." });
    const engagement = await stats();
    expect(engagement.respondedReports).toBe(1);
    expect(engagement.adminMessages).toBe(1);
  });
});

describe("status updates by SMS and browser push", () => {
  const subscription = {
    endpoint: "https://push.example.com/device-1",
    keys: { p256dh: "key", auth: "secret" },
  };

  afterEach(() => {
    env.VAPID_PUBLIC_KEY = undefined;
    env.VAPID_PRIVATE_KEY = undefined;
    env.VAPID_SUBJECT = undefined;
  });

  it("is off until VAPID keys are configured", async () => {
    expect((await request(app).get("/api/push/key")).body).toEqual({ publicKey: null });
    const submitted = await submitReport();
    const res = await request(app)
      .post(`/api/reports/track/${submitted.body.receiptId}/push`)
      .send(subscription);
    expect(res.status).toBe(503);
  });

  it("notifies subscribed devices and texts the passenger when the status changes", async () => {
    env.VAPID_PUBLIC_KEY = "public-key";
    env.VAPID_PRIVATE_KEY = "private-key";
    env.VAPID_SUBJECT = "mailto:test@test.com";
    expect((await request(app).get("/api/push/key")).body).toEqual({ publicKey: "public-key" });

    const submitted = await submitReport({ passengerPhone: "0771234567", language: "si" });
    const receiptId = String(submitted.body.receiptId);
    const subscribe = await request(app)
      .post(`/api/reports/track/${receiptId}/push`)
      .send(subscription);
    expect(subscribe.status).toBe(201);
    const following = await request(app)
      .post(`/api/reports/track/${receiptId}/push/status`)
      .send({ endpoint: subscription.endpoint });
    expect(following.body).toEqual({ subscribed: true });

    const report = await db.query.reports.findFirst({ where: eq(reports.receiptId, receiptId) });
    const token = await createAdminAndLogin();
    sent.sms.length = 0;
    const update = await request(app)
      .put(`/api/reports/${report?.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "escalated" });
    expect(update.body.delivery).toEqual({ email: false, sms: true, push: 1, telegram: 0 });
    // In the passenger's language (Sinhala)
    expect(sent.sms[0]?.text).toContain("බලධාරීන් වෙත යොමු කරන ලදී");
    expect(JSON.parse(sent.push[0]?.payload ?? "{}")).toMatchObject({
      url: `/track/${receiptId}`,
      tag: `report-${receiptId}`,
    });

    // A device that unsubscribed in the browser is forgotten
    sent.pushFailure = 410;
    await request(app)
      .put(`/api/reports/${report?.id}/status`)
      .set("x-auth-token", token)
      .send({ status: "resolved" });
    expect(await db.$count(pushSubscriptions)).toBe(0);
  });

  it("lets a device stop following a report", async () => {
    env.VAPID_PUBLIC_KEY = "public-key";
    env.VAPID_PRIVATE_KEY = "private-key";
    env.VAPID_SUBJECT = "mailto:test@test.com";
    const submitted = await submitReport();
    const base = `/api/reports/track/${submitted.body.receiptId}/push`;
    await request(app).post(base).send(subscription);
    await request(app).post(`${base}/unsubscribe`).send({ endpoint: subscription.endpoint });
    expect(
      (await request(app).post(`${base}/status`).send({ endpoint: subscription.endpoint })).body,
    ).toEqual({ subscribed: false });
    expect(
      (
        await request(app)
          .post(base)
          .send({ ...subscription, endpoint: "http://insecure" })
      ).status,
    ).toBe(400);
  });
});
