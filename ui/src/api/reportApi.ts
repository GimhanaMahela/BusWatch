import type {
  PublicReport,
  Report,
  ReportListParams,
  ReportListResponse,
  ReportStats,
  SubmitReportFields,
  SubmitReportResponse,
} from "../types/report";
import type { ReportStatus } from "../constants/reportConstants";
import apiClient, { call } from "./apiClient";

export const submitReport = (
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
  call<Report & { emailSent: boolean }>(
    apiClient.put(`/reports/${id}/status`, { status, note, notifyPassenger }),
  );

export const addReportNote = (id: string, text: string) =>
  call<Report>(apiClient.post(`/reports/${id}/notes`, { text }));

export const deleteReport = (id: string) =>
  call<{ msg: string }>(apiClient.delete(`/reports/${id}`));
