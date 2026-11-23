// Numbers for the impact and scorecard screens: big stat tiles and category bars.
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import type { CategoryCount } from "@/api/explore";
import { AppText, type IconName } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { accents, categoryStyle, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export function StatTile({
  icon,
  color,
  value,
  label,
  hint,
}: {
  icon: IconName;
  color: string;
  value: string;
  label: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: `${color}12`, borderColor: `${color}33`, shadowColor: theme.shadow },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <AppText style={styles.label}>{label}</AppText>
      {hint ? (
        <AppText variant="secondary" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Two stat tiles side by side */
export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** Horizontal bars, longest first, each in its category's colour */
export function CategoryBars({ items }: { items: CategoryCount[] }) {
  const { t } = useI18n();
  const theme = useTheme();
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <View style={{ gap: spacing.sm + 2 }}>
      {[...items]
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((item) => {
          const color = categoryStyle[item.category]?.color ?? accents.slate;
          return (
            <View key={item.category} style={{ gap: 4 }}>
              <View style={styles.barLabel}>
                <AppText style={{ flex: 1, fontSize: 14 }}>
                  {t(`categories.${item.category}`)}
                </AppText>
                <AppText style={{ fontWeight: "800", fontSize: 14 }}>{item.count}</AppText>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.surfaceAlt }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(item.count / max) * 100}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radiusLarge,
    padding: spacing.md,
    gap: 4,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  label: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  hint: { fontSize: 12, lineHeight: 16 },
  barLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5 },
});
