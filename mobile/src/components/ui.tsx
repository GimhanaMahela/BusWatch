// Themed building blocks shared by the screens: the TransitX look (the website's typeface, brand
// gradients, soft shadows, springy touch feedback).
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/motion";
import { Text } from "@/components/Text";
import { gradients, radius, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** Room for the floating tab bar under a tab screen's content */
export const TAB_BAR_SPACE = 120;

/**
 * A scrolling page. `tab` screens have no navigation header: they start below the status bar and
 * leave room for the floating tab bar. `fullscreen` pages have no header and no tab bar.
 */
export function Screen({
  children,
  tab = false,
  fullscreen = false,
}: {
  children: ReactNode;
  tab?: boolean;
  fullscreen?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.screen,
        tab && {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: TAB_BAR_SPACE + insets.bottom,
        },
        fullscreen && {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

type TextVariant = "display" | "title" | "heading" | "body" | "secondary" | "label";

export function AppText({
  variant = "body",
  style,
  selectable,
  numberOfLines,
  children,
}: {
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
  /** Lets people long-press to copy, e.g. a receipt ID */
  selectable?: boolean;
  numberOfLines?: number;
  children: ReactNode;
}) {
  const theme = useTheme();
  const color = variant === "secondary" || variant === "label" ? theme.textSecondary : theme.text;
  return (
    <Text
      selectable={selectable}
      numberOfLines={numberOfLines}
      style={[styles[variant], { color }, style]}
    >
      {children}
    </Text>
  );
}

/** A tab screen's title row, with an optional action on the right */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, gap: 2 }}>
        {subtitle ? <AppText variant="label">{subtitle}</AppText> : null}
        <AppText variant="display">{title}</AppText>
      </View>
      {right}
    </View>
  );
}

/** A raised card; `accent` adds a coloured stripe down its left edge; `onPress` makes it a button */
export function Card({
  children,
  style,
  accent,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const look = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.divider, shadowColor: theme.shadow },
    accent ? { borderLeftWidth: 5, borderLeftColor: accent } : null,
    style,
  ];
  if (!onPress) return <View style={look}>{children}</View>;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      scaleTo={0.98}
      style={look}
    >
      {children}
    </PressableScale>
  );
}

/** A round tinted icon */
export function IconBubble({
  icon,
  color,
  size = 34,
  solid = false,
}: {
  icon: IconName;
  color: string;
  size?: number;
  solid?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: solid ? color : `${color}1F`,
      }}
    >
      <Ionicons name={icon} size={size * 0.53} color={solid ? "#FFFFFF" : color} />
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
  return (
    <View style={styles.sectionTitle}>
      <IconBubble icon={icon} color={color ?? theme.primary} />
      <AppText variant="heading" style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

/** A heading between cards, with an optional "see all" style action */
export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading" style={{ flex: 1, fontSize: 19 }}>
        {title}
      </AppText>
      {action && onAction ? (
        <PressableScale onPress={onAction} accessibilityRole="button" haptics="selection">
          <AppText style={{ color: theme.primary, fontWeight: "700", fontSize: 14 }}>
            {action}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

type ButtonVariant = "primary" | "accent" | "outline" | "light" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  /** primary: brand gradient · accent: orange gradient · outline · light: white, on gradients */
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const filled = variant === "primary" || variant === "accent";
  const foreground = filled ? "#FFFFFF" : variant === "light" ? "#00295C" : theme.primary;
  const shape = [styles.button, compact && styles.buttonCompact];

  const content = loading ? (
    <ActivityIndicator color={foreground} />
  ) : (
    <View style={styles.buttonRow}>
      {icon && <Ionicons name={icon} size={compact ? 18 : 20} color={foreground} />}
      <Text
        numberOfLines={1}
        style={[styles.buttonLabel, compact && { fontSize: 15 }, { color: foreground }]}
      >
        {label}
      </Text>
      {iconRight && <Ionicons name={iconRight} size={18} color={foreground} />}
    </View>
  );

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      haptics={variant === "accent" ? "medium" : "light"}
      style={[
        styles.buttonShell,
        { opacity: inactive ? 0.45 : 1 },
        filled && { shadowColor: variant === "accent" ? "#E85D00" : "#0060B8", ...styles.raised },
      ]}
    >
      {filled ? (
        <LinearGradient
          colors={variant === "accent" ? gradients.sunrise : gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={shape}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            shape,
            variant === "light"
              ? { backgroundColor: "#FFFFFF" }
              : variant === "ghost"
                ? { backgroundColor: `${theme.primary}14` }
                : { borderWidth: 1.5, borderColor: theme.primary },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

/** The deep brand-gradient banner at the top of a screen */
export function Hero({
  eyebrow,
  title,
  highlight,
  subtitle,
  art,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Shown after the title in the brand orange */
  highlight?: string;
  subtitle?: string;
  /** Picture in the top-right corner */
  art?: ReactNode;
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
      <View style={[styles.glow, { top: -80, right: -60, backgroundColor: "#029EEE" }]} />
      <View style={[styles.glow, { bottom: -110, left: -70, backgroundColor: "#FE6E01" }]} />
      <View style={styles.ring} />
      {art}
      {eyebrow && (
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
      )}
      <Text style={styles.heroTitle}>
        {title}
        {highlight ? (
          <Text style={[styles.heroTitle, { color: "#FFAD73" }]}> {highlight}</Text>
        ) : null}
      </Text>
      {subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
      {children && <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>{children}</View>}
    </LinearGradient>
  );
}

/** A colourful shortcut for a grid */
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
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.divider, shadowColor: theme.shadow },
      ]}
    >
      <View style={[styles.tileWash, { backgroundColor: color }]} />
      <LinearGradient
        colors={[color, `${color}B3`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tileIcon, { shadowColor: color }]}
      >
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </LinearGradient>
      <AppText style={styles.tileTitle} numberOfLines={2}>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="secondary" style={styles.tileSubtitle} numberOfLines={2}>
          {subtitle}
        </AppText>
      )}
    </PressableScale>
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
          : { backgroundColor: `${color}1F`, borderColor: `${color}55` },
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
      {icon && (
        <View style={[styles.fieldIcon, { backgroundColor: `${theme.primary}14` }]}>
          <Ionicons name={icon} size={16} color={theme.primary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label">{label}</AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
}

/** A settings-style row: icon, text, chevron */
export function ListRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: IconName;
  color: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      scaleTo={0.98}
      haptics="selection"
      style={styles.row}
    >
      <IconBubble icon={icon} color={color} size={38} />
      <View style={{ flex: 1, gap: 1 }}>
        <AppText style={{ fontWeight: "700" }}>{title}</AppText>
        {subtitle ? (
          <AppText variant="secondary" style={{ fontSize: 13 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        ) : null)}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  display: { fontSize: 30, fontWeight: "800", lineHeight: 38, letterSpacing: -0.6 },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 34, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: "700", lineHeight: 26, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24 },
  secondary: { fontSize: 15, lineHeight: 22 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: radiusLarge,
    padding: spacing.md + 2,
    gap: spacing.sm + 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  raised: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonShell: { borderRadius: radius + 2 },
  button: {
    minHeight: 54,
    borderRadius: radius + 2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonCompact: { minHeight: 44, paddingHorizontal: spacing.md - 2 },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  buttonLabel: { fontSize: 16, fontWeight: "700", letterSpacing: 0.1, flexShrink: 1 },
  hero: {
    borderRadius: radiusLarge + 8,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
  },
  glow: { position: "absolute", width: 240, height: 240, borderRadius: 120, opacity: 0.3 },
  ring: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 26,
    borderColor: "rgba(255,255,255,0.05)",
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
  },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFAD73" },
  eyebrowText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 39,
    letterSpacing: -0.8,
  },
  heroSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 23 },
  tile: {
    flex: 1,
    minHeight: 148,
    borderWidth: 1,
    borderRadius: radiusLarge,
    padding: spacing.md,
    gap: spacing.xs + 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  tileWash: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.08,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs + 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
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
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  field: { flexDirection: "row", gap: spacing.sm + 4, alignItems: "flex-start" },
  fieldIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
  },
});
