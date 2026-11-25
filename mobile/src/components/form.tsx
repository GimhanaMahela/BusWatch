// Form inputs in the TransitX style: labelled text fields and single-choice chips.
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, View, type TextInputProps } from "react-native";

import { PressableScale } from "@/components/motion";
import { TextInput } from "@/components/Text";
import { AppText, type IconName } from "@/components/ui";
import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

type FieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  helper?: string;
  /** Already-translated message; shown in red under the field */
  error?: string;
};

export function TextField({
  label,
  helper,
  error,
  multiline,
  onFocus,
  onBlur,
  ...input
}: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={`${theme.textSecondary}99`}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.text,
            backgroundColor: focused ? theme.surface : theme.surfaceAlt,
            borderColor: error ? theme.error : focused ? theme.primary : theme.surfaceAlt,
          },
        ]}
      />
      {error ? (
        <AppText variant="secondary" style={{ color: theme.error }}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="secondary">{helper}</AppText>
      ) : null}
    </View>
  );
}

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  /** An icon and colour make a chip stand out; the selected chip fills with its colour */
  options: readonly { value: T; label: string; icon?: IconName; color?: string }[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          const tint = option.color ?? theme.primary;
          const foreground = selected ? "#FFFFFF" : option.color ? tint : theme.text;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              haptics="selection"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? tint : error ? theme.error : `${tint}40`,
                  backgroundColor: selected ? tint : option.color ? `${tint}14` : theme.surfaceAlt,
                },
              ]}
            >
              {option.icon && <Ionicons name={option.icon} size={16} color={foreground} />}
              <AppText
                style={{ color: foreground, fontSize: 15, fontWeight: selected ? "700" : "500" }}
              >
                {option.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
      {error ? (
        <AppText variant="secondary" style={{ color: theme.error }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: 21,
    paddingHorizontal: spacing.md - 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});

/** Tick any number of options (chips that toggle) */
export function MultiChips<T extends string>({
  label,
  options,
  values,
  onChange,
  color,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  values: readonly T[];
  onChange: (values: T[]) => void;
  color: string;
}) {
  const theme = useTheme();
  const toggle = (value: T) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View accessibilityLabel={label} style={styles.chips}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="checkbox"
              haptics="selection"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? color : `${color}40`,
                  backgroundColor: selected ? color : `${color}14`,
                },
              ]}
            >
              <Ionicons
                name={selected ? "checkbox" : "square-outline"}
                size={16}
                color={selected ? "#FFFFFF" : color}
              />
              <AppText
                style={{
                  color: selected ? "#FFFFFF" : theme.text,
                  fontSize: 15,
                  fontWeight: selected ? "700" : "500",
                }}
              >
                {option.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
