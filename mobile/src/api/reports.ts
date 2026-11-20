import type {
  BusService,
  MessageSender,
  ReportCategory,
  ReportStatus,
  ReportType,
} from "../../../api/src/config/constants";
import apiClient, { call } from "./client";

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

/** The track.* message group that explains each status for this kind of report */
export const STATUS_TEXT_GROUP: Record<ReportType, string> = {
  complaint: "track.complaint",
  commendation: "track.commend",
  lost_item: "track.lost",
  road_incident: "track.road",
};
