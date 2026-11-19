import apiClient, { call } from "@/api/apiClient";
import type {
  FleetReportDetails,
  FleetReportList,
  FleetReportParams,
  FleetSummary,
} from "@/types/operator";

// Operator portal: bus owners see checked reports about their own fleet

export const getFleetSummary = () => call<FleetSummary>(apiClient.get("/operator/summary"));

export const getFleetReports = (params: FleetReportParams = {}) =>
  call<FleetReportList>(apiClient.get("/operator/reports", { params }));

export const getFleetReport = (id: string) =>
  call<FleetReportDetails>(apiClient.get(`/operator/reports/${id}`));

export const respondToReport = (id: string, body: string) =>
  call<FleetReportDetails>(apiClient.post(`/operator/reports/${id}/responses`, { body }));

/** Lost items: "We found it", with where the passenger can collect it */
export const markLostItemFound = (id: string, body: string) =>
  call<FleetReportDetails>(apiClient.post(`/operator/reports/${id}/found`, { body }));
