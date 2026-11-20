import { useState } from "react";
import { useColorScheme, View } from "react-native";

import { TURNSTILE_SITE_KEY } from "@/api/client";
import { OutboxNotice } from "@/components/OutboxNotice";
import { Turnstile } from "@/components/Turnstile";
import { AppText, Button, Card, Field, Screen } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { useOutbox } from "@/lib/OutboxProvider";
import { accents, spacing } from "@/theme/colors";

/**
 * Reports saved on this phone. Without a security check they go out on their own; with one, each
 * send needs a fresh token, so the passenger sends them from here one at a time.
 */
export default function OutboxScreen() {
  const { t, locale } = useI18n();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { queued, online, sending, needsToken, flush } = useOutbox();
  const [token, setToken] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);

  const sendNow = async () => {
    await flush(token);
    // The token is spent either way: show a fresh widget for the next report
    setToken(null);
    setWidgetKey((key) => key + 1);
  };

  return (
    <Screen>
      <OutboxNotice />
      {queued.length === 0 ? (
        <AppText variant="secondary">{t("app.outboxEmpty")}</AppText>
      ) : (
        <>
          <AppText>{t("offline.waiting", { count: queued.length })}</AppText>
          {queued.map((report) => (
            <Card key={report.id} accent={accents.amber}>
              <Field
                label={t("track.category")}
                value={report.draft.category ? t(`categories.${report.draft.category}`) : "–"}
              />
              <Field label={t("track.bus")} value={report.draft.busNumber} />
              <Field label={t("track.location")} value={report.draft.location} />
              <AppText variant="secondary">{formatDateTime(report.createdAt, locale)}</AppText>
            </Card>
          ))}
          {online && needsToken && (
            <View style={{ gap: spacing.xs }}>
              <AppText variant="label">{t("app.securityCheck")}</AppText>
              <Turnstile
                key={widgetKey}
                siteKey={TURNSTILE_SITE_KEY}
                language={locale}
                theme={scheme}
                onToken={setToken}
              />
            </View>
          )}
          {online ? (
            <Button
              icon="cloud-upload"
              label={t("app.sendNow")}
              loading={sending}
              disabled={needsToken && !token}
              onPress={() => void sendNow()}
            />
          ) : (
            <AppText variant="secondary">{t("offline.queuedHint")}</AppText>
          )}
        </>
      )}
    </Screen>
  );
}
