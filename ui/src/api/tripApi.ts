import apiClient, { call } from "@/api/apiClient";
import type { SharedTrip, StartedTrip } from "@/types/trip";

// "Share my trip" (safety mode)

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

export const getTrip = (id: string) =>
  call<SharedTrip>(apiClient.get(`/trips/${encodeURIComponent(id)}`));
