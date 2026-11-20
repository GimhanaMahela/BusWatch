// Form inputs in the TransitX style: labelled text fields and single-choice chips.
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { AppText } from "@/components/ui";
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
            backgroundColor: theme.background,
            borderColor: error ? theme.error : theme.divider,
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
  options: readonly { value: T; label: string }[];
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
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.primary : error ? theme.error : theme.divider,
                  backgroundColor: selected ? theme.primary : "transparent",
                },
              ]}
            >
              <AppText style={{ color: selected ? theme.onPrimary : theme.text, fontSize: 15 }}>
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
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
});
