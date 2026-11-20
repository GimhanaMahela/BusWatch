// Sending one saved report: the same rules as the website's outbox (OfflineOutbox.tsx).
import { ApiError } from "@/api/client";
import { submitReport, type SubmitResult } from "@/api/reports";

import type { QueuedReport } from "./outboxStore";
import { toFormData } from "./reportDraft";

export type SendOutcome =
  { kind: "sent"; receiptId: string } | { kind: "dropped"; message: string } | { kind: "kept" };

/** A rejection that will never succeed on retry (bad data, not a lost connection or busy server). */
export const isPermanentFailure = (error: ApiError): boolean =>
  error.status !== undefined &&
  // A failed security check is worth retrying with a fresh token, not a reason to drop the report
  !error.code?.startsWith("captcha_") &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 408 &&
  error.status !== 429;

export const sendQueued = async (
  report: QueuedReport,
  turnstileToken: string | null,
  submit: (form: FormData) => Promise<SubmitResult> = submitReport,
): Promise<SendOutcome> => {
  try {
    const result = await submit(toFormData(report.draft, report.language, turnstileToken));
    return { kind: "sent", receiptId: result.receiptId };
  } catch (caught) {
    const error = caught instanceof ApiError ? caught : new ApiError(String(caught));
    if (isPermanentFailure(error)) return { kind: "dropped", message: error.message };
    return { kind: "kept" }; // still offline, the server is struggling, or a new token is needed
  }
};
