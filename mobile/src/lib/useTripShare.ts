// "Share my trip" (safety mode): a live link a trusted contact opens on the website
// (/trip/<id>). Positions go up only while the safety screen is open, like the website's page;
// leaving the screen or tapping Stop ends the trip, and the server keeps only the latest position.
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { WEB_URL } from "@/api/client";
import { endTrip, sendTripPosition, startTrip, type StartedTrip } from "@/api/explore";

export type TripProblem = "trip.denied" | "trip.failed";

export const tripLink = (trip: StartedTrip) => `${WEB_URL}/trip/${encodeURIComponent(trip.id)}`;

export const useTripShare = () => {
  const [trip, setTrip] = useState<StartedTrip | null>(null);
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [problem, setProblem] = useState<TripProblem | null>(null);
  const [starting, setStarting] = useState(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const active = useRef<StartedTrip | null>(null);

  const stop = useCallback(async () => {
    watcher.current?.remove();
    watcher.current = null;
    const current = active.current;
    active.current = null;
    setTrip(null);
    setLastSent(null);
    if (current) await endTrip(current.id, current.ownerToken).catch(() => undefined);
  }, []);

  const start = async (busNumber: string, routeNumber: string) => {
    setProblem(null);
    setStarting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setProblem("trip.denied");
        return;
      }
      const started = await startTrip({
        busNumber: busNumber.trim() || undefined,
        routeNumber: routeNumber.trim() || undefined,
      });
      active.current = started;
      setTrip(started);
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 20_000, distanceInterval: 25 },
        ({ coords }) => {
          const current = active.current;
          if (!current) return;
          sendTripPosition(current.id, current.ownerToken, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? undefined,
          })
            .then(() => setLastSent(Date.now()))
            .catch(() => undefined); // a dropped update is replaced by the next one
        },
      );
    } catch {
      setProblem("trip.failed");
      await stop();
    } finally {
      setStarting(false);
    }
  };

  // Leaving the screen ends the trip, so a contact never follows a stale position
  useEffect(() => () => void stop(), [stop]);

  return { trip, lastSent, problem, starting, start, stop };
};
