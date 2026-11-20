import webpush, { WebPushError } from "web-push";
import { env } from "../config/env.js";
import {
  deleteExpoToken,
  deletePushEndpoint,
  listExpoPushTokens,
  listPushSubscriptions,
} from "../repositories/push.repository.js";

// Push notifications ("Your report was escalated"): browsers through the Web Push protocol, and
// phones running the TransitX app through Expo's push service. Passengers opt in per report from
// the tracking page or the app; no email or phone number needed.

export const isPushConfigured = (): boolean =>
  Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);

let vapidSet = false;
const ensureVapid = () => {
  if (vapidSet) return;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT ?? "",
    env.VAPID_PUBLIC_KEY ?? "",
    env.VAPID_PRIVATE_KEY ?? "",
  );
  vapidSet = true;
};

export interface PushPayload {
  title: string;
  body: string;
  /** Page to open when the notification is tapped (same-origin path) */
  url: string;
  /** Notifications with the same tag replace each other instead of piling up */
  tag: string;
}

/**
 * Sends a notification to every device following a report. Returns how many devices it reached.
 * Subscriptions the browser has revoked (404/410) are deleted; other failures are logged.
 */
export const sendPushToReport = async (reportId: string, payload: PushPayload) => {
  const [browsers, phones] = await Promise.all([
    sendWebPush(reportId, payload),
    sendExpoPush(reportId, payload),
  ]);
  return browsers + phones;
};

const sendWebPush = async (reportId: string, payload: PushPayload) => {
  if (!isPushConfigured()) return 0;
  ensureVapid();
  const subscriptions = await listPushSubscriptions(reportId);
  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 24 * 60 * 60, urgency: "normal", timeout: 10_000 },
        );
        return true;
      } catch (error) {
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          await deletePushEndpoint(sub.endpoint);
        } else {
          console.error(
            "Push notification failed:",
            error instanceof Error ? error.message : error,
          );
        }
        return false;
      }
    }),
  );
  return results.filter(Boolean).length;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** One push ticket per message, in order (https://docs.expo.dev/push-notifications/sending-notifications/) */
interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Sends to every phone following the report through the TransitX app. Needs no setup: Expo's
 * service is free and works without credentials (EXPO_ACCESS_TOKEN only adds its optional
 * "enhanced security"). Tokens of uninstalled apps (DeviceNotRegistered) are deleted.
 */
const sendExpoPush = async (reportId: string, payload: PushPayload) => {
  const tokens = await listExpoPushTokens(reportId);
  if (tokens.length === 0) return 0;
  const messages = tokens.map(({ token }) => ({
    to: token,
    title: payload.title,
    body: payload.body,
    // The app opens the report's tracking screen from this
    data: { url: payload.url },
    sound: "default",
    channelId: "report-updates",
    priority: "high",
  }));
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("Expo push failed:", response.status, await response.text());
      return 0;
    }
    const { data: tickets = [] } = (await response.json()) as { data?: ExpoPushTicket[] };
    let reached = 0;
    await Promise.all(
      tickets.map(async (ticket, index) => {
        if (ticket.status === "ok") {
          reached += 1;
          return;
        }
        const token = tokens.at(index)?.token;
        if (ticket.details?.error === "DeviceNotRegistered" && token) {
          await deleteExpoToken(token);
        } else {
          console.error("Expo push ticket error:", ticket.message ?? ticket.details?.error);
        }
      }),
    );
    return reached;
  } catch (error) {
    console.error("Expo push failed:", error instanceof Error ? error.message : error);
    return 0;
  }
};
