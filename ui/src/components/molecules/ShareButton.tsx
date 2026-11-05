"use client";

import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import { Alert, Button, Snackbar, type ButtonProps } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ShareButtonProps extends Omit<ButtonProps, "onClick" | "title"> {
  /** Path on this site, e.g. /track/BW-2026-ABCDEF */
  path: string;
  title: string;
  text: string;
  /** Called after the link was shared or copied */
  onShared?: () => void;
}

/**
 * Opens the phone's share sheet (WhatsApp, Viber, Facebook, ...) where the browser supports it,
 * otherwise copies the link.
 */
function ShareButton({ path, title, text, onShared, ...buttonProps }: ShareButtonProps) {
  const t = useTranslations("share");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        onShared?.();
        return;
      } catch (error) {
        // The passenger closed the share sheet: nothing to report
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ ok: true, text: t("copied") });
      onShared?.();
    } catch {
      setMessage({ ok: false, text: t("failed") });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<IosShareRoundedIcon />}
        onClick={() => void share()}
        {...buttonProps}
      >
        {t("button")}
      </Button>
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={message?.ok ? "success" : "warning"}
          variant="filled"
          onClose={() => setMessage(null)}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ShareButton;
