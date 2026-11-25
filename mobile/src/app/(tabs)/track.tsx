import { router } from "expo-router";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/motion";
import { TextInput } from "@/components/Text";
import { AppText, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { useOutbox } from "@/lib/OutboxProvider";
import { normaliseReceiptId } from "@/lib/receiptId";
import { accents, radius, spacing } from "@/theme/colors";
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
    <Screen tab>
      <Hero title={t("track.title")} subtitle={t("track.subtitle")} />
      <Card>
        <SectionTitle icon="receipt" color={accents.sky}>
          {t("receiptSearch.label")}
        </SectionTitle>
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
            { color: theme.text, borderColor: theme.surfaceAlt, backgroundColor: theme.surfaceAlt },
          ]}
        />
        <Button
          icon="search"
          label={t("receiptSearch.button")}
          onPress={submit}
          disabled={!receiptId}
        />
      </Card>
      {sent.length > 0 && (
        <Card>
          <SectionTitle icon="phone-portrait" color={accents.violet}>
            {t("app.sentFromPhone")}
          </SectionTitle>
          {sent.map((report) => (
            <PressableScale
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
              <View style={[styles.recentIcon, { backgroundColor: `${accents.sky}1F` }]}>
                <Ionicons name="document-text" size={18} color={accents.sky} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={{ fontWeight: "700", letterSpacing: 0.5 }}>
                  {report.receiptId}
                </AppText>
                <AppText variant="secondary">{formatDateTime(report.sentAt, locale)}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </PressableScale>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  recent: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
  },
  recentIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
