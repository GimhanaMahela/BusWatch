import type {
  BusService,
  MessageSender,
  ReportCategory,
  ReportStatus,
  ReportType,
} from "../../../api/src/config/constants";
import apiClient, { API_URL, ApiError, call } from "./client";

/** What GET /api/reports/track/:receiptId returns (the API's toPublicView) */
export interface PublicReport {
  receiptId: string;
  type: ReportType;
  status: ReportStatus;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  busService?: BusService | null;
  location: string | null;
  incidentAt?: string;
  reportedAt: string;
  resolvedAt?: string;
  timeline: { status: ReportStatus; note?: string; changedAt: string }[];
  canRate: boolean;
  rating: number | null;
  messages: { id: string; sender: MessageSender; body: string; createdAt: string; read: boolean }[];
  canReply: boolean;
  confirmations: number;
  operatorResponses: { body: string; organisation: string | null; createdAt: string }[];
}

export const trackReport = (receiptId: string) =>
  call<PublicReport>(apiClient.get(`/reports/track/${encodeURIComponent(receiptId)}`));

/** What POST /api/reports returns */
export interface SubmitResult {
  receiptId: string;
  pdfUrl?: string | null;
  emailSent: boolean;
  smsSent: boolean;
}

/**
 * Sends a report with its photos. Uses fetch rather than axios: React Native's fetch streams
 * multipart file parts from disk and sets the boundary itself.
 */
export const submitReport = async (form: FormData): Promise<SubmitResult> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/reports`, {
      method: "POST",
      body: form,
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.");
  }
  const body = (await response.json().catch(() => ({}))) as Partial<SubmitResult> & {
    message?: string;
    msg?: string;
    code?: string;
  };
  if (!response.ok || !body.receiptId) {
    throw new ApiError(
      body.message || body.msg || "Failed to submit report. Please try again.",
      response.status,
      body.code,
    );
  }
  return {
    receiptId: body.receiptId,
    pdfUrl: body.pdfUrl,
    emailSent: Boolean(body.emailSent),
    smsSent: Boolean(body.smsSent),
  };
};

/** The track.* message group that explains each status for this kind of report */
export const STATUS_TEXT_GROUP: Record<ReportType, string> = {
  complaint: "track.complaint",
  commendation: "track.commend",
  lost_item: "track.lost",
  road_incident: "track.road",
};
