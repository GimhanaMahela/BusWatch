import { Tabs } from "expo-router/js-tabs";

import { FloatingTabBar } from "@/components/FloatingTabBar";
import { useI18n } from "@/i18n/I18nProvider";

// Tab screens draw their own headers (see PageHeader and Hero); the bar floats over the content
export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t("header.home") }} />
      <Tabs.Screen name="track" options={{ title: t("app.trackTab") }} />
      <Tabs.Screen name="my-reports" options={{ title: t("app.mineTab") }} />
      <Tabs.Screen name="settings" options={{ title: t("app.settings") }} />
    </Tabs>
  );
}
