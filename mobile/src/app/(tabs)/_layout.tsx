import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";

import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/theme/useTheme";

type IconName = keyof typeof Ionicons.glyphMap;

/** A tab icon: outlined at rest, filled and tinted when its tab is open */
const icon = (outline: IconName, filled: IconName) => {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean; size: number }) {
    return (
      <Ionicons
        name={focused ? filled : outline}
        color={typeof color === "string" ? color : undefined}
        size={24}
      />
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
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.divider,
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
        },
        headerStyle: { backgroundColor: theme.surface },
        headerTitleStyle: { fontWeight: "800", color: theme.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "TransitX",
          tabBarLabel: t("header.home"),
          headerTitleStyle: { fontWeight: "900", color: theme.primary, fontSize: 22 },
          tabBarIcon: icon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{ title: t("header.track"), tabBarIcon: icon("search-outline", "search") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t("app.settings"), tabBarIcon: icon("settings-outline", "settings") }}
      />
    </Tabs>
  );
}
