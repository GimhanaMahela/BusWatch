import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";

import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/theme/useTheme";

type IconName = keyof typeof Ionicons.glyphMap;

/** A tab bar icon; the navigator passes our theme colours, which are always strings */
const icon = (name: IconName) => {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return (
      <Ionicons name={name} color={typeof color === "string" ? color : undefined} size={size} />
    );
  }
  return TabIcon;
};

export default function TabsLayout() {
  const { t } = useI18n();
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("header.home"), tabBarIcon: icon("home-outline") }}
      />
      <Tabs.Screen
        name="track"
        options={{ title: t("header.track"), tabBarIcon: icon("search-outline") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t("app.settings"), tabBarIcon: icon("settings-outline") }}
      />
    </Tabs>
  );
}
