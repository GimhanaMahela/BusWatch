import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { expoPushTokens, pushSubscriptions } from "../db/schema.js";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Subscribes a device to one report's updates (subscribing twice is harmless). */
export const savePushSubscription = async (reportId: string, sub: PushSubscriptionInput) => {
  await db
    .insert(pushSubscriptions)
    .values({ reportId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: [pushSubscriptions.reportId, pushSubscriptions.endpoint],
      set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
};

export const deletePushSubscription = async (reportId: string, endpoint: string) => {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.reportId, reportId), eq(pushSubscriptions.endpoint, endpoint)));
};

/** The browser revoked this subscription: forget it for every report. */
export const deletePushEndpoint = async (endpoint: string) => {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
};

export const listPushSubscriptions = (reportId: string) =>
  db.select().from(pushSubscriptions).where(eq(pushSubscriptions.reportId, reportId));

export const isPushSubscribed = async (reportId: string, endpoint: string) =>
  (await db.$count(
    pushSubscriptions,
    and(eq(pushSubscriptions.reportId, reportId), eq(pushSubscriptions.endpoint, endpoint)),
  )) > 0;

// --- Phones running the TransitX app (Expo push tokens) ---

/** Subscribes a phone to one report's updates (subscribing twice is harmless). */
export const saveExpoPushToken = async (reportId: string, token: string) => {
  await db.insert(expoPushTokens).values({ reportId, token }).onConflictDoNothing();
};

export const deleteExpoPushToken = async (reportId: string, token: string) => {
  await db
    .delete(expoPushTokens)
    .where(and(eq(expoPushTokens.reportId, reportId), eq(expoPushTokens.token, token)));
};

/** The app was uninstalled or its token replaced: forget it for every report. */
export const deleteExpoToken = async (token: string) => {
  await db.delete(expoPushTokens).where(eq(expoPushTokens.token, token));
};

export const listExpoPushTokens = (reportId: string) =>
  db.select().from(expoPushTokens).where(eq(expoPushTokens.reportId, reportId));

export const isExpoPushSubscribed = async (reportId: string, token: string) =>
  (await db.$count(
    expoPushTokens,
    and(eq(expoPushTokens.reportId, reportId), eq(expoPushTokens.token, token)),
  )) > 0;
