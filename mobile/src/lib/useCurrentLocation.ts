import * as Location from "expo-location";
import { useState } from "react";

export interface Pin {
  latitude: number;
  longitude: number;
  /** A readable place name from the phone's geocoder, when it has one */
  label: string | null;
}

/** Message key for why the location couldn't be read */
type LocationError = "location.denied" | "location.failed";

const describe = (address: Location.LocationGeocodedAddress | undefined): string | null => {
  if (!address) return null;
  const parts = [address.street ?? address.name, address.district, address.city].filter(
    (part): part is string => Boolean(part),
  );
  return [...new Set(parts)].join(", ") || null;
};

/** Reads the phone's position once, on demand (never in the background). */
export const useCurrentLocation = () => {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);

  const locate = async (): Promise<Pin | null> => {
    setError(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("location.denied");
        return null;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const pin = { latitude: coords.latitude, longitude: coords.longitude };
      // A place name is a nicety: without one, the coordinates still go with the report
      const addresses = await Location.reverseGeocodeAsync(pin).catch(() => []);
      return { ...pin, label: describe(addresses[0]) };
    } catch {
      setError("location.failed");
      return null;
    } finally {
      setLocating(false);
    }
  };

  return { locate, locating, error };
};
