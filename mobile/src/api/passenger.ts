// "My reports": passwordless sign-in with a one-time code (same endpoints as the website).
import type { ReportCategory, ReportStatus, ReportType } from "../../../api/src/config/constants";
import apiClient, { call } from "./client";

export interface PassengerContact {
  channel: "email" | "phone";
  /** Masked, e.g. "ka***@gmail.com" or "+9477***4567" */
  display: string;
}

export interface PassengerReportSummary {
  receiptId: string;
  type: ReportType;
  status: ReportStatus;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  reportedAt: string;
  resolvedAt: string | null;
  lastUpdateAt: string;
  /** Team messages the passenger hasn't read */
  unreadMessages: number;
}

/** Sends a one-time code to the email or phone the passenger reported with */
export const requestSignInCode = (contact: string, language: string) =>
  call<{ channel: "email" | "phone"; sentTo: string }>(
    apiClient.post("/passenger/code", { contact, language }),
  );

/** Exchanges the code for a "My reports" session token */
export const verifySignInCode = (contact: string, code: string) =>
  call<{ token: string; contact: PassengerContact }>(
    apiClient.post("/passenger/session", { contact, code }),
  );

export const getMyReports = (token: string) =>
  call<{ contact: PassengerContact; reports: PassengerReportSummary[] }>(
    apiClient.get("/passenger/reports", { headers: { "x-passenger-token": token } }),
  );
