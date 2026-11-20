// Fare checker, impact numbers, scorecards, trip sharing and the helper chat: the same public
// endpoints as the website (types follow ui/src/types/fare.ts, public.ts, trip.ts, assistant.ts).
import type { ReportCategory, ReportType, ServiceClass } from "../../../api/src/config/constants";
import apiClient, { call } from "./client";

// --- Fare checker ---

export interface FareRouteSummary {
  id: string;
  routeNumber: string;
  name: string;
  serviceClasses: ServiceClass[];
  stopCount: number;
}

export interface FareRoute extends Omit<FareRouteSummary, "stopCount"> {
  stops: { name: string; stage: number }[];
}

export interface FareCheckResult {
  routeNumber: string;
  routeName: string;
  from: string;
  to: string;
  stages: number;
  serviceClass: ServiceClass;
  officialFare: number;
  chargedFare: number | null;
  effectiveFrom: string | null;
  /** Rupees above the official fare (0 when the passenger paid the right fare or less) */
  overchargedBy: number;
}

export const getFareRoutes = () => call<FareRouteSummary[]>(apiClient.get("/fares/routes"));

export const getFareRoute = (id: string) =>
  call<FareRoute>(apiClient.get(`/fares/routes/${encodeURIComponent(id)}`));

export const checkFare = (selection: {
  routeId: string;
  from: number;
  to: number;
  serviceClass: ServiceClass;
  charged?: number;
}) => call<FareCheckResult>(apiClient.get("/fares/check", { params: selection }));

// --- Impact and scorecards ---

export interface CategoryCount {
  category: ReportCategory;
  count: number;
}

export interface PublicImpact {
  updatedAt: string;
  minPublicReports: number;
  totals: {
    received: number;
    receivedThisMonth: number;
    checked: number;
    resolved: number;
    resolvedThisMonth: number;
    resolutionRate: number | null;
    medianHoursToResolve: number | null;
    commendations: number;
    averageRating: number | null;
    ratings: number;
  };
  byCategory: CategoryCount[];
  topRoutes: { routeNumber: string; count: number }[];
}

export interface Scorecard {
  published: boolean;
  minPublicReports: number;
  since: string | null;
  complaints: {
    checked: number;
    resolved: number;
    inProgress: number;
    resolutionRate: number;
    byCategory: CategoryCount[];
    averageRating: number | null;
  } | null;
  commendations: { count: number; byCategory: CategoryCount[] } | null;
  busNumber?: string;
  busName?: string | null;
  routes?: string[];
  routeNumber?: string;
  buses?: { busNumber: string; count: number }[];
}

export const getImpact = () => call<PublicImpact>(apiClient.get("/public/stats"));

export const getBusScorecard = (bus: string) =>
  call<Scorecard>(apiClient.get(`/public/buses/${encodeURIComponent(bus)}`));

export const getRouteScorecard = (route: string) =>
  call<Scorecard>(apiClient.get(`/public/routes/${encodeURIComponent(route)}`));

// --- Share my trip ---

export interface StartedTrip {
  id: string;
  ownerToken: string;
  expiresAt: string;
}

export const startTrip = (fields: { busNumber?: string; routeNumber?: string }) =>
  call<StartedTrip>(apiClient.post("/trips", fields));

export const sendTripPosition = (
  id: string,
  ownerToken: string,
  position: { latitude: number; longitude: number; accuracy?: number },
) =>
  call<void>(
    apiClient.put(`/trips/${encodeURIComponent(id)}/position`, position, {
      headers: { "x-trip-token": ownerToken },
    }),
  );

export const endTrip = (id: string, ownerToken: string) =>
  call<{ msg: string }>(
    apiClient.post(`/trips/${encodeURIComponent(id)}/end`, undefined, {
      headers: { "x-trip-token": ownerToken },
    }),
  );

// --- Helper chat ---

export type AssistantLink =
  "submit_report" | "commend_driver" | "track" | "my_reports" | "impact" | "about" | "privacy";

export interface AssistantDraft {
  type: ReportType;
  category: ReportCategory | null;
  busNumber: string;
  routeNumber: string;
  location: string;
  incidentAt: string;
  description: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  link?: AssistantLink | null;
  draft?: AssistantDraft | null;
}

export const getAssistantStatus = () =>
  call<{ enabled: boolean }>(apiClient.get("/assistant/status"));

export const sendChat = (
  messages: { role: "user" | "assistant"; text: string }[],
  language: string,
) =>
  call<{ reply: string; link: AssistantLink | null; draft: AssistantDraft | null }>(
    apiClient.post("/assistant/chat", { messages, language }),
  );
