import apiClient, { call } from "@/api/apiClient";
import type { ServiceClass } from "@/constants/reportConstants";
import type {
  FareAdminOverview,
  FareCheckResult,
  FareRoute,
  FareRouteInput,
  FareRouteSummary,
  FareSelection,
  FareTable,
} from "@/types/fare";

// Fare checker: public lookups and the admins' fare tables

export const getFareRoutes = () => call<FareRouteSummary[]>(apiClient.get("/fares/routes"));

export const getFareRoute = (id: string) => call<FareRoute>(apiClient.get(`/fares/routes/${id}`));

export const checkFare = (selection: FareSelection) =>
  call<FareCheckResult>(apiClient.get("/fares/check", { params: selection }));

// --- Admin ---

export const getFareAdmin = () => call<FareAdminOverview>(apiClient.get("/fares/admin"));

export const saveFareTable = (
  serviceClass: ServiceClass,
  fares: number[],
  effectiveFrom?: string,
) => call<FareTable>(apiClient.put(`/fares/tables/${serviceClass}`, { fares, effectiveFrom }));

export const createFareRoute = (route: FareRouteInput) =>
  call<FareRoute>(apiClient.post("/fares/routes", route));

export const updateFareRoute = (id: string, route: FareRouteInput) =>
  call<FareRoute>(apiClient.put(`/fares/routes/${id}`, route));

export const deleteFareRoute = (id: string) =>
  call<{ msg: string }>(apiClient.delete(`/fares/routes/${id}`));
