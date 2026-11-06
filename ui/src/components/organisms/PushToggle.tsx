"use client";

import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import { Alert, Box, Button, Card, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getPushKey } from "@/api/pushApi";
import useIsClient from "@/hooks/useIsClient";
import {
  PushError,
  follow,
  isFollowing,
  isPushSupported,
  needsHomeScreenInstall,
  unfollow,
} from "@/lib/push";

type Problem = "denied" | "unavailable" | "failed";

/**
 * "Get notified on this device": browser push for one report, no email or phone needed.
 * Hidden when the server has no push keys; explains the extra step on iPhones.
 */
function PushToggle({ receiptId, compact = false }: { receiptId: string; compact?: boolean }) {
  const t = useTranslations("push");
  const isClient = useIsClient();
  const key = useQuery({
    queryKey: ["pushKey"],
    queryFn: getPushKey,
    staleTime: Infinity,
    retry: false,
  });
  const [following, setFollowing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const supported = isClient && isPushSupported();
  const enabled = Boolean(key.data?.publicKey);

  useEffect(() => {
    if (!supported || !enabled) return;
    let cancelled = false;
    isFollowing(receiptId)
      .then((value) => !cancelled && setFollowing(value))
      .catch(() => !cancelled && setFollowing(false));
    return () => {
      cancelled = true;
    };
  }, [receiptId, supported, enabled]);

  if (!isClient || !enabled) return null;

  const toggle = async () => {
    setBusy(true);
    setProblem(null);
    try {
      if (following) {
        await unfollow(receiptId);
        setFollowing(false);
      } else {
        await follow(receiptId);
        setFollowing(true);
      }
    } catch (error) {
      setProblem(
        error instanceof PushError && error.problem !== "unsupported" ? error.problem : "failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const body = !supported ? (
    <Typography variant="body2" color="text.secondary">
      {needsHomeScreenInstall() ? t("iosHint") : t("unsupported")}
    </Typography>
  ) : (
    <>
      <Typography variant="body2" color="text.secondary">
        {following ? t("on") : t("text")}
      </Typography>
      <Button
        variant={following ? "text" : "contained"}
        color={following ? "inherit" : "primary"}
        startIcon={following ? <NotificationsOffRoundedIcon /> : <NotificationsActiveRoundedIcon />}
        onClick={() => void toggle()}
        loading={busy || following === null}
        sx={{ mt: 1.5, alignSelf: "flex-start" }}
      >
        {following ? t("disable") : t("enable")}
      </Button>
      {problem && (
        <Alert severity={problem === "denied" ? "warning" : "error"} sx={{ mt: 1.5 }}>
          {t(problem)}
        </Alert>
      )}
    </>
  );

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
      >
        <NotificationsActiveRoundedIcon color="primary" fontSize="small" />
        {t("title")}
      </Typography>
      {body}
    </Box>
  );

  return compact ? (
    <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: "action.hover", textAlign: "left" }}>
      {content}
    </Box>
  ) : (
    <Card sx={{ p: { xs: 2.5, sm: 3 } }}>{content}</Card>
  );
}

export default PushToggle;
