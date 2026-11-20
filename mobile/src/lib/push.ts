// Native push notifications: this phone's Expo push token, which the API sends report updates to
// through Expo's push service (Firebase Cloud Messaging on Android, APNs on iOS).
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

/** Matches channelId in the API's sender (api/src/services/push.service.ts) */
export const CHANNEL_ID = "report-updates";

// Show updates as banners even while the app is open
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

/**
 * Why this phone can't get notifications:
 * - "simulator": push needs a real device
 * - "unconfigured": the build has no EAS project ID yet (run `npx eas-cli@latest init`)
 * - "denied": the passenger said no in the system prompt
 */
export type PushUnavailable = "simulator" | "unconfigured" | "denied";

const projectId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
};

let cachedToken: string | null = null;

/** Asks for permission (once) and returns this phone's push token. */
export const getPushToken = async (): Promise<
  { token: string } | { unavailable: PushUnavailable }
> => {
  if (cachedToken) return { token: cachedToken };
  if (!Device.isDevice) return { unavailable: "simulator" };
  const id = projectId();
  if (!id) return { unavailable: "unconfigured" };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Report updates",
      importance: AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== "granted") return { unavailable: "denied" };

  cachedToken = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  return { token: cachedToken };
};

/**
 * The app screen a notification opens. The API sends the website's path (/track/BW-2026-XXXXXX,
 * sometimes with #messages), which is also this app's route.
 */
export const routeFromNotification = (data: unknown): string | null => {
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== "string") return null;
  const match = /^\/track\/([A-Z0-9-]+)/i.exec(url);
  return match ? `/track/${match[1].toUpperCase()}` : null;
};
