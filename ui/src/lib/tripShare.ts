import type { StartedTrip } from "@/types/trip";

// "Share my trip": the running trip (its id and the phone's secret) is kept on this device, so a
// reload or a closed tab doesn't lose the ability to end it.

const KEY = "buswatch-trip";

export interface StoredTrip extends StartedTrip {
  busNumber?: string;
}

export const loadTrip = (): StoredTrip | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const trip = JSON.parse(raw) as StoredTrip;
    if (!trip.id || !trip.ownerToken || new Date(trip.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return trip;
  } catch {
    return null;
  }
};

export const saveTrip = (trip: StoredTrip) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(trip));
  } catch {
    // Private browsing: the trip still runs while this page stays open
  }
};

export const forgetTrip = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored
  }
};

export const tripUrl = (id: string) =>
  `${typeof window === "undefined" ? "" : window.location.origin}/trip/${encodeURIComponent(id)}`;
