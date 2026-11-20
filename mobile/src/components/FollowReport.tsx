import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";

import { followReport, isFollowingReport, unfollowReport } from "@/api/reports";
import { AppText, Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { getPushToken, type PushUnavailable } from "@/lib/push";
import { useTheme } from "@/theme/useTheme";

const UNAVAILABLE_MESSAGE: Record<PushUnavailable, string> = {
  denied: "app.pushDenied",
  simulator: "push.unavailable",
  unconfigured: "push.unavailable",
};

/** "Get notified on this device" for one report, like the website's tracking page. */
export function FollowReport({ receiptId }: { receiptId: string }) {
  const { t } = useI18n();
  const theme = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Already allowed: find out quietly whether this phone follows the report (never prompts)
  useEffect(() => {
    let active = true;
    Notifications.getPermissionsAsync()
      .then(async (permission) => {
        if (!permission.granted) return;
        const result = await getPushToken();
        if (!("token" in result) || !active) return;
        setToken(result.token);
        const { subscribed } = await isFollowingReport(receiptId, result.token);
        if (active) setFollowing(subscribed);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [receiptId]);

  const toggle = async () => {
    setBusy(true);
    setProblem(null);
    try {
      if (following && token) {
        await unfollowReport(receiptId, token);
        setFollowing(false);
        return;
      }
      const result = await getPushToken();
      if ("unavailable" in result) {
        setProblem(t(UNAVAILABLE_MESSAGE[result.unavailable]));
        return;
      }
      setToken(result.token);
      await followReport(receiptId, result.token);
      setFollowing(true);
    } catch {
      setProblem(t("push.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <AppText variant="heading">{t("push.title")}</AppText>
      <AppText variant="secondary">{following ? t("push.on") : t("push.text")}</AppText>
      {problem && <AppText style={{ color: theme.warning }}>{problem}</AppText>}
      <Button
        variant={following ? "outline" : "primary"}
        label={following ? t("push.disable") : t("push.enable")}
        loading={busy}
        onPress={() => void toggle()}
      />
    </Card>
  );
}
