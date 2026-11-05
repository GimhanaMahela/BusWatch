import { trackEvent } from "@/api/metricsApi";
import { toApiError } from "@/api/apiClient";
import { submitReport } from "@/api/reportApi";
import type { SubmitReportFields, SubmitReportResponse } from "@/types/report";
import { enqueueReport } from "./offlineStore";

export type SubmitOutcome = { kind: "sent"; response: SubmitReportResponse } | { kind: "queued" };

/**
 * Sends a report, or keeps it on the device when there is no connection so the outbox can send it
 * later. Validation and server errors are thrown as ApiErrors, as before.
 */
export const submitOrQueue = async (
  fields: SubmitReportFields,
  images: File[],
  videos: File[],
): Promise<SubmitOutcome> => {
  const queue = async () => {
    if (!(await enqueueReport({ fields, images, videos }))) return null;
    trackEvent("offline_report_queued");
    return { kind: "queued" } as const;
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const queued = await queue();
    if (queued) return queued;
  }
  try {
    return { kind: "sent", response: await submitReport(fields, images, videos) };
  } catch (caught) {
    const error = toApiError(caught);
    // No HTTP status means the request never reached the server (signal dropped mid-send)
    if (error.status === undefined) {
      const queued = await queue();
      if (queued) return queued;
    }
    throw error;
  }
};
