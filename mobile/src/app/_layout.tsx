import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { palettes } from "@/theme/colors";

function RootStack() {
  const { t } = useI18n();
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
          <RootStack />
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
