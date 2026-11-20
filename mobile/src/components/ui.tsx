// Small themed building blocks shared by the screens.
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

type TextVariant = "title" | "heading" | "body" | "secondary" | "label";

export function AppText({
  variant = "body",
  style,
  selectable,
  children,
}: {
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
  /** Lets people long-press to copy, e.g. a receipt ID */
  selectable?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  const color = variant === "secondary" || variant === "label" ? theme.textSecondary : theme.text;
  return (
    <Text selectable={selectable} style={[styles[variant], { color }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.divider }, style]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const primary = variant === "primary";
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? theme.primary : "transparent",
          borderColor: theme.primary,
          opacity: inactive ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? theme.onPrimary : theme.primary} />
      ) : (
        <Text style={[styles.buttonLabel, { color: primary ? theme.onPrimary : theme.primary }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** A label above its value, for report details */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: "700", lineHeight: 34 },
  heading: { fontSize: 18, fontWeight: "600", lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },
  secondary: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  card: { borderWidth: 1, borderRadius: radius, padding: spacing.md, gap: spacing.sm },
  button: {
    minHeight: 48,
    borderRadius: radius,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: { fontSize: 16, fontWeight: "600" },
  field: { gap: 2 },
});
