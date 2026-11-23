import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { hasOnboarded } from "@/lib/onboarding";
import { OutboxProvider } from "@/lib/OutboxProvider";
import { routeFromNotification } from "@/lib/push";
import { palettes } from "@/theme/colors";
import { FONT_FILES, fontFor } from "@/theme/typography";

// Keep the splash screen up until the fonts are ready, so text never jumps between typefaces
SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** A tapped notification opens the report it is about (also when it started the app). */
function useNativeNotificationTaps() {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const route = routeFromNotification(response.notification.request.content.data);
    if (route) router.push(route as `/track/${string}`);
  }, [response]);
}

// Notification responses don't exist on web (used only for previews), and the call throws there
const useNotificationTaps = Platform.OS === "web" ? () => undefined : useNativeNotificationTaps;

/** First launch: show the welcome slides once (not in the web preview, which has no storage) */
function useOnboarding(ready: boolean) {
  useEffect(() => {
    if (!ready || Platform.OS === "web") return;
    void hasOnboarded().then((done) => {
      if (!done) router.push("/welcome");
    });
  }, [ready]);
}

function RootStack({ ready }: { ready: boolean }) {
  const { t, locale } = useI18n();
  useNotificationTaps();
  useOnboarding(ready);
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = palettes[scheme];
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.divider,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.primary,
          headerTitleStyle: { fontFamily: fontFor("800", locale), color: palette.text },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
        />
        <Stack.Screen name="track/[receiptId]" options={{ title: t("header.track") }} />
        <Stack.Screen name="report" options={{ title: t("submit.title") }} />
        <Stack.Screen name="outbox" options={{ title: t("app.outboxTitle") }} />
        <Stack.Screen
          name="scan"
          options={{
            title: t("app.scanTitle"),
            headerTransparent: true,
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontFamily: fontFor("800", locale), color: "#FFFFFF" },
          }}
        />
        <Stack.Screen name="fare" options={{ title: t("fare.eyebrow") }} />
        <Stack.Screen name="impact" options={{ title: t("impact.eyebrow") }} />
        <Stack.Screen name="safety" options={{ title: t("safety.eyebrow") }} />
        <Stack.Screen name="chat" options={{ title: t("helper.title") }} />
        <Stack.Screen name="bus/[busNumber]" options={{ title: t("scorecard.busEyebrow") }} />
        <Stack.Screen name="route/[routeNumber]" options={{ title: t("scorecard.routeEyebrow") }} />
        <Stack.Screen
          name="report-sent"
          options={{ headerShown: false, gestureEnabled: false, animation: "fade" }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  // A font that fails to load falls back to the system font rather than blocking the app
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <OutboxProvider>
            <RootStack ready={ready} />
          </OutboxProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
