/** "Share my trip": what a trusted contact sees */
export interface SharedTrip {
  busNumber: string | null;
  routeNumber: string | null;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  active: boolean;
  position: { latitude: number; longitude: number; accuracy: number | null; at: string } | null;
}

/** Returned once when a trip starts; the owner token stays on the passenger's phone */
export interface StartedTrip {
  id: string;
  ownerToken: string;
  expiresAt: string;
}
