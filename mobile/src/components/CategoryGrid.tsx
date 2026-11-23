// Big, colourful category tiles for "What happened?": two per row, each with its own icon.
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import type { ReportCategory } from "../../../api/src/config/constants";
import { PressableScale } from "@/components/motion";
import { Text } from "@/components/Text";
import type { IconName } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { accents, categoryStyle, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export function CategoryGrid({
  categories,
  value,
  onChange,
  fallbackColor = accents.blue,
}: {
  categories: readonly ReportCategory[];
  value: ReportCategory | "";
  onChange: (category: ReportCategory) => void;
  fallbackColor?: string;
}) {
  const { t } = useI18n();
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {categories.map((category) => {
        const look = categoryStyle[category];
        const color = look?.color ?? fallbackColor;
        const icon = (look?.icon ?? "ellipse-outline") as IconName;
        const selected = category === value;
        const label = t(`categories.${category}`);
        const inner = (
          <>
            <View
              style={[
                styles.icon,
                { backgroundColor: selected ? "rgba(255,255,255,0.22)" : `${color}1A` },
              ]}
            >
              <Ionicons
                name={selected ? (icon.replace("-outline", "") as IconName) : icon}
                size={24}
                color={selected ? "#FFFFFF" : color}
              />
            </View>
            <Text
              numberOfLines={3}
              style={[styles.label, { color: selected ? "#FFFFFF" : theme.text }]}
            >
              {label}
            </Text>
            {selected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={14} color={color} />
              </View>
            )}
          </>
        );
        return (
          <PressableScale
            key={category}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            haptics="selection"
            onPress={() => onChange(category)}
            style={[
              styles.tile,
              {
                borderColor: selected ? color : theme.divider,
                backgroundColor: theme.surface,
                shadowColor: selected ? color : theme.shadow,
                shadowOpacity: selected ? 0.35 : 0.05,
              },
            ]}
          >
            {selected ? (
              <LinearGradient
                colors={[color, `${color}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fill}
              >
                {inner}
              </LinearGradient>
            ) : (
              <View style={styles.fill}>{inner}</View>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm + 4 },
  tile: {
    width: "47.5%",
    flexGrow: 1,
    minHeight: 118,
    borderWidth: 1.5,
    borderRadius: radiusLarge,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
  },
  fill: { flex: 1, padding: spacing.md - 2, gap: spacing.sm + 2 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  check: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
