import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px", // Fixed height for consistency, can be responsive if needed
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const sriLankaCenter = {
  lat: 6.9271, // Default to Colombo, Sri Lanka
  lng: 79.8612,
};

const MapPicker = ({ onLocationSelect, initialLongitude, initialLatitude }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_Maps_API_KEY,
  });

  const [markerPosition, setMarkerPosition] = useState(
    initialLongitude && initialLatitude
      ? { lat: parseFloat(initialLatitude), lng: parseFloat(initialLongitude) }
      : sriLankaCenter // Use Sri Lanka's center as default
  );

  const mapRef = useRef(null);

  const onLoad = useCallback(
    function callback(map) {
      mapRef.current = map;
      if (initialLongitude && initialLatitude) {
        map.setCenter({
          lat: parseFloat(initialLatitude),
          lng: parseFloat(initialLongitude),
        });
        map.setZoom(15); // Zoom in on the initial location
      } else {
        map.setZoom(12); // Default zoom for Sri Lanka
      }
    },
    [initialLongitude, initialLatitude]
  );

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  const onMapClick = useCallback(
    (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPosition({ lat: newLat, lng: newLng });
      onLocationSelect(newLng, newLat); // Pass longitude, latitude to parent
    },
    [onLocationSelect]
  );

  if (loadError) {
    return (
      <div className="text-red-600 text-center p-4">
        Error loading Google Maps. Please check your API key and network
        connection.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="text-gray-600 text-center p-4">Loading Map...</div>;
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition} // Center map on marker position
        zoom={12} // Default zoom, will be overridden by onLoad if initial coords exist
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
        }}
      >
        <MarkerF position={markerPosition} />
      </GoogleMap>
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-sm text-gray-700 hidden sm:block">
        {" "}
        {/* Hide on small screens for simplicity */}
        <p className="font-semibold">Click on the map to select location.</p>
        <p>Lat: {markerPosition.lat.toFixed(4)}</p>
        <p>Lng: {markerPosition.lng.toFixed(4)}</p>
      </div>
      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md text-sm text-gray-700 sm:hidden">
        {" "}
        {/* Show on small screens */}
        <p>Lat: {markerPosition.lat.toFixed(4)}</p>
        <p>Lng: {markerPosition.lng.toFixed(4)}</p>
      </div>
    </div>
  );
};

export default MapPicker;
