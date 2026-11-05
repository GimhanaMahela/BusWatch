import {
  getPushKey,
  isFollowingReport,
  subscribeToReport,
  unsubscribeFromReport,
} from "@/api/pushApi";

// Browser push notifications ("Your report was escalated") without an email or phone number.
// The service worker (public/sw.js) shows them; a device follows each report separately.

export type PushProblem = "unsupported" | "denied" | "unavailable";

export class PushError extends Error {
  constructor(readonly problem: PushProblem) {
    super(problem);
    this.name = "PushError";
  }
}

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** iPhones and iPads only allow web push for sites added to the home screen. */
export const needsHomeScreenInstall = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !isPushSupported();

const registration = async () => {
  // Production normally registered the full worker already (lib/pwa.ts); register it here too in
  // case that hasn't happened yet. Development registers it in push-only mode, so testing
  // notifications doesn't turn on page caching.
  if (!(await navigator.serviceWorker.getRegistration())) {
    await navigator.serviceWorker.register(
      process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?mode=push-only",
    );
  }
  return navigator.serviceWorker.ready;
};

const toKeyBytes = (base64Url: string) => {
  const padded = `${base64Url}${"=".repeat((4 - (base64Url.length % 4)) % 4)}`;
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const currentSubscription = async () => {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
};

/** Whether this device is already following the report. */
export const isFollowing = async (receiptId: string) => {
  if (!isPushSupported() || Notification.permission !== "granted") return false;
  const subscription = await currentSubscription();
  if (!subscription) return false;
  return (await isFollowingReport(receiptId, subscription.endpoint)).subscribed;
};

/** Asks for permission (the browser shows its own prompt) and follows the report. */
export const follow = async (receiptId: string) => {
  if (!isPushSupported()) throw new PushError("unsupported");
  const { publicKey } = await getPushKey();
  if (!publicKey) throw new PushError("unavailable");
  if ((await Notification.requestPermission()) !== "granted") throw new PushError("denied");

  const reg = await registration();
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toKeyBytes(publicKey),
    }));
  await subscribeToReport(receiptId, subscription.toJSON());
};

/** Stops notifications for this report (other reports this device follows keep theirs). */
export const unfollow = async (receiptId: string) => {
  const subscription = await currentSubscription();
  if (subscription) await unsubscribeFromReport(receiptId, subscription.endpoint);
};
