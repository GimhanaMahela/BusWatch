// The floating tab bar: a rounded bar hovering over the content, with the main action (Report an
// incident) as a raised gradient button in the middle.
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { PressableScale } from "@/components/motion";
import { Text } from "@/components/Text";
import { useI18n } from "@/i18n/I18nProvider";
import { gradients } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, [IconName, IconName]> = {
  index: ["home-outline", "home"],
  track: ["search-outline", "search"],
  "my-reports": ["person-circle-outline", "person-circle"],
  settings: ["settings-outline", "settings"],
};

function TabItem({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: [IconName, IconName];
  focused: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const active = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    active.set(withSpring(focused ? 1 : 0, { damping: 16, stiffness: 220 }));
  }, [focused, active]);
  const pill = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scaleX: 0.6 + active.value * 0.4 }],
  }));
  const color = focused ? theme.primary : theme.textSecondary;
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      haptics="selection"
      scaleTo={0.9}
      style={styles.item}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.pill, { backgroundColor: `${theme.primary}1F` }, pill]} />
        <Ionicons name={focused ? icon[1] : icon[0]} size={22} color={color} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, { color, fontWeight: focused ? "700" : "600" }]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const theme = useTheme();
  const { t } = useI18n();

  const items = state.routes.map((route, index) => {
    const focused = index === state.index;
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === "string" ? options.tabBarLabel : (options.title ?? route.name);
    const onPress = () => {
      const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };
    return (
      <TabItem
        key={route.key}
        label={label}
        icon={ICONS[route.name] ?? ["ellipse-outline", "ellipse"]}
        focused={focused}
        onPress={onPress}
      />
    );
  });
  const middle = Math.ceil(items.length / 2);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: theme.surface, borderColor: theme.divider, shadowColor: theme.shadow },
        ]}
      >
        {items.slice(0, middle)}
        <View style={styles.fabSlot}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t("home.reportCta")}
            onPress={() => router.push("/report")}
            haptics="medium"
            scaleTo={0.9}
            style={styles.fabShadow}
          >
            <LinearGradient
              colors={gradients.sunrise}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.fab, { borderColor: theme.surface }]}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </LinearGradient>
          </PressableScale>
        </View>
        {items.slice(middle)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 70,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, height: "100%" },
  iconWrap: { width: 54, height: 30, alignItems: "center", justifyContent: "center" },
  pill: { ...StyleSheet.absoluteFill, borderRadius: 15 },
  label: { fontSize: 11 },
  fabSlot: { width: 72, alignItems: "center" },
  fabShadow: {
    marginTop: -34,
    borderRadius: 34,
    shadowColor: "#E85D00",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
