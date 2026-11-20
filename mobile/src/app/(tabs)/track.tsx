import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { normaliseReceiptId } from "@/lib/receiptId";
import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export default function TrackScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const [input, setInput] = useState("");
  const receiptId = normaliseReceiptId(input);

  const submit = () => {
    if (receiptId) router.push({ pathname: "/track/[receiptId]", params: { receiptId } });
  };

  return (
    <Screen>
      <AppText variant="title">{t("track.title")}</AppText>
      <AppText variant="secondary">{t("track.subtitle")}</AppText>
      <Card>
        <AppText variant="label">{t("receiptSearch.label")}</AppText>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          placeholder="BW-2026-XXXXXX"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t("receiptSearch.label")}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.divider, backgroundColor: theme.background },
          ]}
        />
        <Button label={t("receiptSearch.button")} onPress={submit} disabled={!receiptId} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    letterSpacing: 1,
  },
});
