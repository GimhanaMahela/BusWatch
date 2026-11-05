import type {
  Delivery,
  PublicReport,
  Report,
  ReportListParams,
  ReportListResponse,
  ReportStats,
  SubmitReportFields,
  SubmitReportResponse,
} from "@/types/report";
import type { ReportStatus } from "@/constants/reportConstants";
import apiClient, { call } from "@/api/apiClient";
import { getTurnstileToken } from "@/lib/turnstile";

export const submitReport = async (
  fields: SubmitReportFields,
  images: File[] = [],
  videos: File[] = [],
) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  }
  images.forEach((image) => formData.append("images", image));
  videos.forEach((video) => formData.append("videos", video));

  // CAPTCHA token, fetched at send time (also for reports queued while offline)
  const captcha = await getTurnstileToken();
  if (captcha) formData.append("cf-turnstile-response", captcha);

  return call<SubmitReportResponse>(apiClient.post("/reports", formData));
};

/** Public: a passenger looks up their own report */
export const trackReport = (receiptId: string) =>
  call<PublicReport>(apiClient.get(`/reports/track/${encodeURIComponent(receiptId.trim())}`));

export const getAllReports = (params: ReportListParams = {}) =>
  call<ReportListResponse>(apiClient.get("/reports", { params }));

export const getReportStats = () => call<ReportStats>(apiClient.get("/reports/stats"));

export const getReportById = (id: string) => call<Report>(apiClient.get(`/reports/${id}`));

export const getReportByReceiptId = (receiptId: string) =>
  call<Report>(apiClient.get(`/reports/receipt/${encodeURIComponent(receiptId.trim())}`));

export const updateReportStatus = (
  id: string,
  status: ReportStatus,
  note = "",
  notifyPassenger = true,
) =>
  call<Report & { emailSent: boolean; delivery: Delivery }>(
    apiClient.put(`/reports/${id}/status`, { status, note, notifyPassenger }),
  );

export const addReportNote = (id: string, text: string) =>
  call<Report>(apiClient.post(`/reports/${id}/notes`, { text }));

export const deleteReport = (id: string) =>
  call<{ msg: string }>(apiClient.delete(`/reports/${id}`));

/** Public: the passenger rates how their closed report was handled */
export const rateOutcome = (receiptId: string, rating: number, feedback = "") =>
  call<PublicReport>(
    apiClient.post(`/reports/track/${encodeURIComponent(receiptId.trim())}/rating`, {
      rating,
      feedback,
    }),
  );

/** Admin: keep a report in or out of public totals, maps and scorecards */
export const setReportVisibility = (id: string, hiddenFromPublic: boolean) =>
  call<Report>(apiClient.put(`/reports/${id}/visibility`, { hiddenFromPublic }));

// ---------------------------------------------------------------- Messages (Phase 3)

/** Admin: message the passenger; they are notified by email, SMS and push when `notify` is on */
export const sendAdminMessage = (id: string, body: string, notifyPassenger = true) =>
  call<Report & { delivery: Delivery }>(
    apiClient.post(`/reports/${id}/messages`, { body, notifyPassenger }),
  );

/** Admin: the passenger's messages on this report have been seen */
export const markMessagesReadByAdmin = (id: string) =>
  call<{ msg: string }>(apiClient.post(`/reports/${id}/messages/read`));

const trackPath = (receiptId: string) => `/reports/track/${encodeURIComponent(receiptId.trim())}`;

/** Public: the passenger replies to the team */
export const sendPassengerMessage = (receiptId: string, body: string) =>
  call<PublicReport>(apiClient.post(`${trackPath(receiptId)}/messages`, { body }));

/** Public: the passenger has seen the team's messages */
export const markMessagesReadByPassenger = (receiptId: string) =>
  call<{ msg: string }>(apiClient.post(`${trackPath(receiptId)}/messages/read`));
