import type { ReportCategory, ReportStatus, ReportType } from "@/constants/reportConstants";

/** A report as a bus operator sees it: no passenger details, receipt ID or internal notes. */
export interface FleetReport {
  id: string;
  type: ReportType;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  busName: string | null;
  location: string | null;
  incidentAt: string | null;
  reportedAt: string;
  status: ReportStatus;
  resolvedAt: string | null;
  description: string;
  /** Other passengers who said "me too" */
  confirmations: number;
  /** Photos with faces and number plates blurred by the BusWatch team (never the originals) */
  images: string[];
  /** English translation when the passenger wrote in Sinhala or Tamil */
  translation: string | null;
  /** List only: responses the operator has posted */
  responses?: number;
}

export interface OperatorResponse {
  id: string;
  body: string;
  organisation: string | null;
  /** Hidden from the passenger by the BusWatch team */
  hidden: boolean;
  createdAt: string;
}

export interface FleetReportDetails extends Omit<FleetReport, "responses"> {
  timeline: { status: ReportStatus; changedAt: string }[];
  responses: OperatorResponse[];
}

export interface FleetReportList {
  reports: FleetReport[];
  total: number;
  page: number;
  pages: number;
}

export interface FleetReportParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: ReportType;
  busNumber?: string;
}

export interface FleetSummary {
  fleet: string[];
  complaints: number;
  commendations: number;
  complaintsByStatus: Record<ReportStatus, number>;
  last30Days: number;
  /** Open complaints without a response yet */
  awaitingResponse: number;
  topBuses: { busNumber: string; count: number }[];
}
