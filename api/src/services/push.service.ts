import webpush, { WebPushError } from "web-push";
import { env } from "../config/env.js";
import { deletePushEndpoint, listPushSubscriptions } from "../repositories/push.repository.js";

// Browser push notifications ("Your report was escalated") through the Web Push protocol.
// Passengers opt in per report from the tracking page; no email or phone number needed.

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
