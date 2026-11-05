import { API_URL } from "@/api/apiClient";

/** Keep in sync with CLIENT_METRIC_EVENTS in api/src/config/constants.ts */
export type MetricEvent =
  | "report_form_started"
  | "commendation_form_started"
  | "qr_scan"
  | "tracking_view"
  | "tracking_return_view"
  | "report_shared"
  | "offline_report_queued"
  | "app_installed";

/**
 * Counts an anonymous usage event for the success metrics (a daily total per event; nothing
 * about the person is sent). Fire and forget: it never throws and survives page unloads.
 */
export const trackEvent = (event: MetricEvent) => {
  if (typeof window === "undefined" || process.env.NODE_ENV === "test") return;
  try {
    void fetch(`${API_URL}/metrics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Metrics are best-effort
  }
};
