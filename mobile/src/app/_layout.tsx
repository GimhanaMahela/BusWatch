import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { OutboxProvider } from "@/lib/OutboxProvider";
import { routeFromNotification } from "@/lib/push";
import { palettes } from "@/theme/colors";

/** A tapped notification opens the report it is about (also when it started the app). */
function useNotificationTaps() {
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

function RootStack() {
  const { t } = useI18n();
  useNotificationTaps();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = palettes[scheme];
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.divider,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="track/[receiptId]" options={{ title: t("header.track") }} />
        <Stack.Screen name="report" options={{ title: t("submit.title") }} />
        <Stack.Screen name="outbox" options={{ title: t("app.outboxTitle") }} />
        <Stack.Screen
          name="report-sent"
          options={{ title: t("submit.title"), headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <OutboxProvider>
            <RootStack />
          </OutboxProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
