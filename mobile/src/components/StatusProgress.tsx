import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import type { ReportStatus } from "../../../api/src/config/constants";
import { Text } from "@/components/Text";
import { useI18n } from "@/i18n/I18nProvider";
import { statusColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

// The website's home-page steps: Received → Reviewed → Escalated → Resolved
const STEPS = [
  { status: "pending", label: "home.stepReceived" },
  { status: "reviewed", label: "home.stepReviewed" },
  { status: "escalated", label: "home.stepEscalated" },
  { status: "resolved", label: "home.stepResolved" },
] as const satisfies readonly { status: ReportStatus; label: string }[];

/** How far a report has come; a closed (rejected) report greys out the steps it never reached. */
export function StatusProgress({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  const theme = useTheme();
  const reached = STEPS.findIndex((step) => step.status === status);
  // Resolved without escalation still counts every earlier step as done
  const current = status === "rejected" ? -1 : reached;

  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {STEPS.map((step, index) => {
        const done = index <= current;
        const color = done ? statusColors[step.status] : theme.divider;
        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.track}>
              <View
                style={[styles.line, { backgroundColor: index === 0 ? "transparent" : color }]}
              />
              <View style={[styles.dot, { backgroundColor: color }]}>
                {done && (
                  <Ionicons
                    name={index === current ? "radio-button-on" : "checkmark"}
                    size={14}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      index === STEPS.length - 1
                        ? "transparent"
                        : index < current
                          ? statusColors[STEPS[index + 1].status]
                          : theme.divider,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: done ? theme.text : theme.textSecondary,
                  fontWeight: done ? "700" : "500",
                },
              ]}
              numberOfLines={2}
            >
              {t(step.label)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  step: { flex: 1, alignItems: "center", gap: 6 },
  track: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  line: { flex: 1, height: 3, borderRadius: 2 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, textAlign: "center" },
});
