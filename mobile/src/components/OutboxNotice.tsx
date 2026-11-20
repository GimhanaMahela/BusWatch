import { router } from "expo-router";
import { View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import { spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

/** What happened to the last saved report the outbox sent (or had to drop). */
export function OutboxNotice() {
  const { t } = useI18n();
  const theme = useTheme();
  const { notice, dismissNotice } = useOutbox();
  if (!notice) return null;

  if (notice.kind === "failed") {
    return (
      <Card style={{ borderColor: theme.error }}>
        <AppText style={{ color: theme.error }}>
          {t("offline.sendFailed", { message: notice.message })}
        </AppText>
        <Button variant="outline" label={t("common.close")} onPress={dismissNotice} />
      </Card>
    );
  }

  return (
    <Card style={{ borderColor: theme.success }}>
      <AppText>{t("offline.sent", { receiptId: notice.receiptId })}</AppText>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t("offline.view")}
            onPress={() => {
              dismissNotice();
              router.push({
                pathname: "/track/[receiptId]",
                params: { receiptId: notice.receiptId },
              });
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="outline" label={t("common.close")} onPress={dismissNotice} />
        </View>
      </View>
    </Card>
  );
}
