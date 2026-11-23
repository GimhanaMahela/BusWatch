import NetInfo from "@react-native-community/netinfo";

import { ApiError } from "@/api/client";
import { submitReport, type SubmitResult } from "@/api/reports";

import { toFormData, type ReportDraft } from "./reportDraft";

interface OutboxActions {
  enqueue: (draft: ReportDraft, language: string) => Promise<void>;
  recordSent: (receiptId: string) => Promise<void>;
}

/**
 * Sends a report, or keeps it on the phone when there is no connection (like the website's
 * offlineSubmit.ts). Validation and server errors are thrown as ApiErrors.
 */
export const submitOrQueue = async (
  draft: ReportDraft,
  language: string,
  turnstileToken: string | null,
  outbox: OutboxActions,
): Promise<SubmitResult | "queued"> => {
  if ((await NetInfo.fetch()).isConnected === false) {
    await outbox.enqueue(draft, language);
    return "queued";
  }
  try {
    const result = await submitReport(toFormData(draft, language, turnstileToken));
    await outbox.recordSent(result.receiptId);
    return result;
  } catch (error) {
    // No HTTP status: the request never reached the server (signal dropped mid-send)
    if (error instanceof ApiError && error.status === undefined) {
      await outbox.enqueue(draft, language);
      return "queued";
    }
    throw error;
  }
};
