// Themed building blocks shared by the screens: the TransitX look (brand gradients, soft shadows,
// rounded cards, colourful accents).
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
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

import { gradients, radius, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

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

/** A raised card; `accent` adds a coloured stripe down its left edge */
export function Card({
  children,
  style,
  accent,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.divider, shadowColor: theme.shadow },
        accent ? { borderLeftWidth: 5, borderLeftColor: accent } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A card heading with a round tinted icon */
export function SectionTitle({
  icon,
  color,
  children,
}: {
  icon: IconName;
  color?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const tint = color ?? theme.primary;
  return (
    <View style={styles.sectionTitle}>
      <View style={[styles.iconBubble, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <AppText variant="heading" style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

type ButtonVariant = "primary" | "accent" | "outline" | "light";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  /** primary: brand gradient · accent: orange gradient · outline · light: white, on gradients */
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const filled = variant === "primary" || variant === "accent";
  const foreground = filled ? "#FFFFFF" : variant === "light" ? "#00295C" : theme.primary;

  const content = loading ? (
    <ActivityIndicator color={foreground} />
  ) : (
    <View style={styles.buttonRow}>
      {icon && <Ionicons name={icon} size={20} color={foreground} />}
      <Text style={[styles.buttonLabel, { color: foreground }]}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonShell,
        { opacity: inactive ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        filled && { shadowColor: theme.shadow, ...styles.raised },
      ]}
    >
      {filled ? (
        <LinearGradient
          colors={variant === "accent" ? gradients.sunrise : gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            variant === "light"
              ? { backgroundColor: "#FFFFFF" }
              : { borderWidth: 1.5, borderColor: theme.primary },
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

/** The deep brand-gradient banner at the top of a screen */
export function Hero({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Shown after the title in the brand orange */
  highlight?: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={gradients.deep}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {/* Soft circles for depth, like the website's hero glow */}
      <View style={[styles.glow, { top: -70, right: -50, backgroundColor: "#029EEE" }]} />
      <View style={[styles.glow, { bottom: -90, left: -60, backgroundColor: "#FE6E01" }]} />
      {eyebrow && (
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
      )}
      <Text style={styles.heroTitle}>
        {title}
        {highlight ? <Text style={{ color: "#FFAD73" }}> {highlight}</Text> : null}
      </Text>
      {subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
      {children && <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>{children}</View>}
    </LinearGradient>
  );
}

/** A colourful shortcut for the home screen grid */
export function ActionTile({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.surface,
          borderColor: theme.divider,
          shadowColor: theme.shadow,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={[color, `${color}B3`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileIcon}
      >
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </LinearGradient>
      <AppText style={styles.tileTitle}>{title}</AppText>
      {subtitle && (
        <AppText variant="secondary" style={styles.tileSubtitle}>
          {subtitle}
        </AppText>
      )}
    </Pressable>
  );
}

/** A small coloured pill, e.g. a report's status; `solid` for use on a gradient */
export function Badge({ label, color, solid }: { label: string; color: string; solid?: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        solid
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
    >
      <View style={[styles.badgeDot, { backgroundColor: solid ? "#FFFFFF" : color }]} />
      <Text style={[styles.badgeText, { color: solid ? "#FFFFFF" : color }]}>{label}</Text>
    </View>
  );
}

/** A label above its value, for report details, with an optional icon */
export function Field({ label, value, icon }: { label: string; value: string; icon?: IconName }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {icon && <Ionicons name={icon} size={18} color={theme.primary} style={styles.fieldIcon} />}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label">{label}</AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 34, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: "700", lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },
  secondary: { fontSize: 15, lineHeight: 22 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  card: {
    borderWidth: 1,
    borderRadius: radiusLarge,
    padding: spacing.md,
    gap: spacing.sm + 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  raised: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonShell: { borderRadius: radius },
  button: {
    minHeight: 52,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  buttonLabel: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  hero: { borderRadius: radiusLarge + 6, padding: spacing.lg, gap: spacing.sm, overflow: "hidden" },
  glow: { position: "absolute", width: 220, height: 220, borderRadius: 110, opacity: 0.28 },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
  },
  eyebrowText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22 },
  tile: {
    flex: 1,
    minHeight: 136,
    borderWidth: 1,
    borderRadius: radiusLarge,
    padding: spacing.md,
    gap: spacing.xs + 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  tileTitle: { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  tileSubtitle: { fontSize: 13, lineHeight: 18 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  field: { flexDirection: "row", gap: spacing.sm + 2 },
  fieldIcon: { marginTop: 2 },
});
