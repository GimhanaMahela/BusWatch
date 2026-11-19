import apiClient, { call } from "@/api/apiClient";

const base = (receiptId: string) => `/reports/track/${encodeURIComponent(receiptId.trim())}/push`;

/** The server's VAPID public key, or null when browser notifications are switched off */
export const getPushKey = () => call<{ publicKey: string | null }>(apiClient.get("/push/key"));

export const subscribeToReport = (receiptId: string, subscription: PushSubscriptionJSON) =>
  call<{ subscribed: boolean }>(apiClient.post(base(receiptId), subscription));

export const unsubscribeFromReport = (receiptId: string, endpoint: string) =>
  call<{ subscribed: boolean }>(apiClient.post(`${base(receiptId)}/unsubscribe`, { endpoint }));

export const isFollowingReport = (receiptId: string, endpoint: string) =>
  call<{ subscribed: boolean }>(apiClient.post(`${base(receiptId)}/status`, { endpoint }));

/** A t.me link that makes the passenger's Telegram chat follow the report (valid for a day) */
export const getTelegramLink = (receiptId: string) =>
  call<{ url: string }>(
    apiClient.get(`/reports/track/${encodeURIComponent(receiptId.trim())}/telegram`),
  );
