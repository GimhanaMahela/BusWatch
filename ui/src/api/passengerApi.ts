import apiClient, { call } from "@/api/apiClient";
import type { Language } from "@/constants/reportConstants";
import type { PassengerContactInfo, PassengerReportSummary } from "@/types/report";

/** Sends a one-time code to an email or phone the passenger reported with */
export const requestSignInCode = (contact: string, language: Language) =>
  call<{ channel: "email" | "phone"; sentTo: string }>(
    apiClient.post("/passenger/code", { contact, language }),
  );

/** Exchanges the code for a "My reports" session */
export const verifySignInCode = (contact: string, code: string) =>
  call<{ token: string; contact: PassengerContactInfo }>(
    apiClient.post("/passenger/session", { contact, code }),
  );

export const getMyReports = (token: string) =>
  call<{ contact: PassengerContactInfo; reports: PassengerReportSummary[] }>(
    apiClient.get("/passenger/reports", { headers: { "x-passenger-token": token } }),
  );

/** Ways of reaching passengers the server has switched on */
export interface ContactChannels {
  email: boolean;
  sms: boolean;
  push: boolean;
  telegram: boolean;
}

export const getContactChannels = () => call<ContactChannels>(apiClient.get("/passenger/channels"));
