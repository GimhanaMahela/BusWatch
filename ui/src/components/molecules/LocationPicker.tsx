import { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY ?? "";
const hasMapsKey = Boolean(MAPS_API_KEY) && MAPS_API_KEY !== "YOUR_Maps_API_KEY";

export interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
}

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };

// Only mounted when a key is configured, so the Maps script is never requested without one
function MapPin({ value, onChange }: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });

  if (loadError) {
    return (
      <Typography variant="body2" color="error">
        The map could not be loaded.
      </Typography>
    );
  }
  if (!isLoaded) {
    return <CircularProgress size={24} />;
  }

  const handlePick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: 280, borderRadius: 8 }}
      center={value || SRI_LANKA_CENTER}
      zoom={value ? 15 : 7}
      onClick={handlePick}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {value && <MarkerF position={value} draggable onDragEnd={handlePick} />}
    </GoogleMap>
  );
}

/**
 * Lets the passenger attach GPS coordinates to a report.
 * value: { lat, lng } | null
 */
function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. You can still type the location."
            : "Could not get your location. You can still type it.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
        <Button
          variant="outlined"
          startIcon={locating ? <CircularProgress size={18} /> : <MyLocationIcon />}
          onClick={useMyLocation}
          disabled={locating}
        >
          Use my current location
        </Button>
        {value && (
          <>
            <Typography variant="body2" color="text.secondary">
              Pinned: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </Typography>
            <Button size="small" onClick={() => onChange(null)}>
              Remove pin
            </Button>
          </>
        )}
      </Box>
      {hasMapsKey && (
        <>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
            Or tap the map to drop a pin where the incident happened.
          </Typography>
          <MapPin value={value} onChange={onChange} />
        </>
      )}
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default LocationPicker;
