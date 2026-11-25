import * as SecureStore from "expo-secure-store";

// The welcome slides are shown once, on first launch
const ONBOARDED_KEY = "onboarded";

export const hasOnboarded = async (): Promise<boolean> =>
  Boolean(await SecureStore.getItemAsync(ONBOARDED_KEY).catch(() => null));

export const markOnboarded = () =>
  SecureStore.setItemAsync(ONBOARDED_KEY, "1").catch(() => undefined);
