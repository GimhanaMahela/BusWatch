// Form inputs in the TransitX style: labelled text fields and single-choice chips.
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { AppText, type IconName } from "@/components/ui";
import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

type FieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  helper?: string;
  /** Already-translated message; shown in red under the field */
  error?: string;
};

export function TextField({ label, helper, error, multiline, ...input }: FieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.text,
            backgroundColor: theme.surfaceAlt,
            borderColor: error ? theme.error : theme.surfaceAlt,
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
            <Pressable
              key={option.value}
              accessibilityRole="radio"
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
            </Pressable>
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
