"use client";

import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import { Alert, Button, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError, type ApiError } from "@/api/apiClient";
import { submitReport } from "@/api/reportApi";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import {
  listQueuedReports,
  OUTBOX_EVENT,
  removeQueuedReport,
  type QueuedReport,
} from "@/lib/offlineStore";

type Notice = { kind: "sent"; receiptId: string } | { kind: "failed"; message: string };

/** A rejection that will never succeed on retry (bad data, not a lost connection or busy server). */
const isPermanentFailure = (error: ApiError) =>
  error.status !== undefined &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 408 &&
  error.status !== 429;

/** Sends one queued report; true when it may leave the outbox. */
const sendQueued = async (
  report: QueuedReport,
  onNotice: (notice: Notice) => void,
): Promise<"sent" | "dropped" | "kept"> => {
  try {
    const result = await submitReport(report.fields, report.images, report.videos);
    onNotice({ kind: "sent", receiptId: result.receiptId });
    return "sent";
  } catch (caught) {
    const error = toApiError(caught);
    if (isPermanentFailure(error)) {
      onNotice({ kind: "failed", message: error.errors?.join(" ") || error.message });
      return "dropped";
    }
    return "kept"; // still offline or the server is struggling: try again later
  }
};

/**
 * Sends reports saved while offline as soon as the connection returns (and on every visit),
 * then tells the passenger their receipt ID. Mounted once in the public layout.
 */
function OfflineOutbox() {
  const t = useTranslations("offline");
  const online = useOnlineStatus();
  const [waiting, setWaiting] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const work = async () => {
        if (!navigator.onLine) return;
        for (const report of await listQueuedReports()) {
          const outcome = await sendQueued(report, (notice) =>
            setNotices((current) => [...current, notice]),
          );
          if (outcome === "kept") break;
          if (report.id !== undefined) await removeQueuedReport(report.id);
        }
      };
      // With several tabs open, only one may send (otherwise a report could go twice)
      if (navigator.locks) await navigator.locks.request("buswatch-outbox", work);
      else await work();
    } finally {
      flushing.current = false;
      setWaiting((await listQueuedReports()).length);
    }
  }, []);

  useEffect(() => {
    const refresh = () => void flush();
    refresh();
    window.addEventListener(OUTBOX_EVENT, refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.removeEventListener(OUTBOX_EVENT, refresh);
      window.removeEventListener("online", refresh);
    };
  }, [flush]);

  const notice = notices[0];
  const dismiss = () => setNotices((current) => current.slice(1));

  return (
    <>
      <Snackbar
        open={!notice && !online && waiting > 0}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" icon={<CloudOffRoundedIcon />} variant="filled">
          {t("waiting", { count: waiting })}
        </Alert>
      </Snackbar>
      <Snackbar
        key={notices.length}
        open={Boolean(notice)}
        autoHideDuration={notice?.kind === "sent" ? null : 10_000}
        onClose={(_, reason) => reason !== "clickaway" && dismiss()}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice?.kind === "sent" ? (
          <Alert
            severity="success"
            variant="filled"
            onClose={dismiss}
            action={
              <Button
                color="inherit"
                size="small"
                href={`/track/${encodeURIComponent(notice.receiptId)}`}
                onClick={dismiss}
              >
                {t("view")}
              </Button>
            }
          >
            {t("sent", { receiptId: notice.receiptId })}
          </Alert>
        ) : (
          <Alert severity="error" variant="filled" onClose={dismiss}>
            {t("sendFailed", { message: notice?.kind === "failed" ? notice.message : "" })}
          </Alert>
        )}
      </Snackbar>
    </>
  );
}

export default OfflineOutbox;
