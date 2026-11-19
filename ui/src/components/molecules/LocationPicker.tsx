"use client";

import { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useTranslations } from "next-intl";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY ?? "";
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
  const t = useTranslations("location");
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });

  if (loadError) {
    return (
      <Typography variant="body2" color="error">
        {t("mapError")}
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
      mapContainerStyle={{ width: "100%", height: 300, borderRadius: 16 }}
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
  const t = useTranslations("location");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("unsupported"));
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
        setError(err.code === err.PERMISSION_DENIED ? t("denied") : t("failed"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
        <Button
          variant="outlined"
          startIcon={locating ? <CircularProgress size={18} /> : <MyLocationIcon />}
          onClick={useMyLocation}
          disabled={locating}
        >
          {t("useMine")}
        </Button>
        {value && (
          <>
            <Typography variant="body2" color="text.secondary">
              {t("pinned", { lat: value.lat.toFixed(5), lng: value.lng.toFixed(5) })}
            </Typography>
            <Button size="small" onClick={() => onChange(null)}>
              {t("removePin")}
            </Button>
          </>
        )}
      </Box>
      {hasMapsKey && (
        <>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
            {t("tapMap")}
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
