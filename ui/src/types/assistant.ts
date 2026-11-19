import type { ReportCategory, ReportType } from "@/constants/reportConstants";

// Keep in sync with api/src/services/assistant.service.ts

export type AssistantLink =
  "submit_report" | "commend_driver" | "track" | "my_reports" | "impact" | "about" | "privacy";

/** What the helper has gathered for a report, ready to put into the form */
export interface ReportDraft {
  type: ReportType;
  category: ReportCategory | null;
  busNumber: string;
  routeNumber: string;
  location: string;
  /** Sri Lanka local time, "YYYY-MM-DDTHH:mm", or "" */
  incidentAt: string;
  description: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  link?: AssistantLink | null;
  draft?: ReportDraft | null;
}

export interface AssistantReply {
  reply: string;
  link: AssistantLink | null;
  draft: ReportDraft | null;
}
