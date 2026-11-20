import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { useOutbox } from "@/lib/OutboxProvider";
import { normaliseReceiptId } from "@/lib/receiptId";
import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

export default function TrackScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const { sent } = useOutbox();
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
      {sent.length > 0 && (
        <Card>
          <AppText variant="heading">{t("app.sentFromPhone")}</AppText>
          {sent.map((report) => (
            <Pressable
              key={report.receiptId}
              accessibilityRole="link"
              onPress={() =>
                router.push({
                  pathname: "/track/[receiptId]",
                  params: { receiptId: report.receiptId },
                })
              }
              style={[styles.recent, { borderTopColor: theme.divider }]}
            >
              <AppText style={{ color: theme.primary, fontWeight: "600" }}>
                {report.receiptId}
              </AppText>
              <AppText variant="secondary">{formatDateTime(report.sentAt, locale)}</AppText>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  recent: { borderTopWidth: 1, paddingVertical: spacing.sm, gap: 2 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    letterSpacing: 1,
  },
});
