"use client";

import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ShareLocationRoundedIcon from "@mui/icons-material/ShareLocationRounded";
import SmsRoundedIcon from "@mui/icons-material/SmsRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "@/api/apiClient";
import { endTrip, sendTripPosition, startTrip } from "@/api/tripApi";
import useIsClient from "@/hooks/useIsClient";
import { forgetTrip, loadTrip, saveTrip, tripUrl, type StoredTrip } from "@/lib/tripShare";

/** Send at most one position this often (seconds); the contact's page checks about as often */
const SEND_EVERY_MS = 20_000;

interface TripSharePanelProps {
  busNumber?: string;
  routeNumber?: string;
}

type GeoState = "waiting" | "ok" | "denied" | "unsupported";

function RunningTrip({ trip, onEnded }: { trip: StoredTrip; onEnded: () => void }) {
  const t = useTranslations("trip");
  const [geo, setGeo] = useState<GeoState>(() =>
    typeof navigator !== "undefined" && "geolocation" in navigator ? "waiting" : "unsupported",
  );
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const lastSentRef = useRef(0);
  const link = tripUrl(trip.id);
  const message = t("shareMessage", { bus: trip.busNumber || t("aBus"), link });

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        setGeo("ok");
        const time = Date.now();
        if (time - lastSentRef.current < SEND_EVERY_MS) return;
        lastSentRef.current = time;
        const { latitude, longitude, accuracy } = position.coords;
        sendTripPosition(trip.id, trip.ownerToken, { latitude, longitude, accuracy })
          .then(() => setLastSent(Date.now()))
          .catch((error: unknown) => {
            // 410: the trip ran out (or was ended on another tab)
            if (toApiError(error).status === 410) {
              forgetTrip();
              onEnded();
            }
          });
      },
      (error) => setGeo(error.code === error.PERMISSION_DENIED ? "denied" : "waiting"),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    return () => {
      navigator.geolocation.clearWatch(watch);
      clearInterval(tick);
    };
  }, [trip.id, trip.ownerToken, onEnded]);

  const stop = async () => {
    setEnding(true);
    try {
      await endTrip(trip.id, trip.ownerToken);
    } catch (error) {
      // Already gone on the server is fine; anything else, still forget it here
      if (!(error instanceof ApiError)) console.warn("Could not end trip", error);
    } finally {
      forgetTrip();
      setEnding(false);
      onEnded();
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The link is on screen to copy by hand
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t("shareTitle"), text: message, url: link });
        return;
      } catch {
        // Cancelled, or not allowed: fall back to copying
      }
    }
    await copy();
  };

  const seconds = lastSent ? Math.max(Math.round((now - lastSent) / 1000), 0) : null;

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Alert severity={geo === "denied" || geo === "unsupported" ? "warning" : "success"}>
        {geo === "denied"
          ? t("denied")
          : geo === "unsupported"
            ? t("unsupported")
            : seconds === null
              ? t("waiting")
              : t("sharing", { seconds })}
      </Alert>
      <Typography
        variant="body2"
        sx={{ wordBreak: "break-all", fontFamily: "ui-monospace, monospace" }}
      >
        {link}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<ShareLocationRoundedIcon />}
          onClick={() => void share()}
        >
          {t("share")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<WhatsAppIcon />}
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener"
        >
          WhatsApp
        </Button>
        <Button
          variant="outlined"
          startIcon={<SmsRoundedIcon />}
          href={`sms:?&body=${encodeURIComponent(message)}`}
        >
          {t("sms")}
        </Button>
        <Button variant="text" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copy()}>
          {copied ? t("copied") : t("copy")}
        </Button>
      </Box>
      <Button
        color="error"
        variant="outlined"
        startIcon={<StopCircleRoundedIcon />}
        onClick={() => void stop()}
        loading={ending}
      >
        {t("stop")}
      </Button>
      <Typography variant="caption" color="text.secondary">
        {t("privacy", { hours: 6 })}
      </Typography>
    </Box>
  );
}

function TripShareInner({ busNumber, routeNumber }: TripSharePanelProps) {
  const t = useTranslations("trip");
  const [trip, setTrip] = useState<StoredTrip | null>(loadTrip);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  // Stable, so the running trip's location watch isn't restarted on every render
  const ended = useCallback(() => setTrip(null), []);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const started = await startTrip({
        busNumber: busNumber?.trim() || undefined,
        routeNumber: routeNumber?.trim() || undefined,
      });
      const stored = { ...started, busNumber: busNumber?.trim().toUpperCase() || undefined };
      saveTrip(stored);
      setTrip(stored);
    } catch (caught) {
      setError(toApiError(caught).message || t("failed"));
    } finally {
      setStarting(false);
    }
  };

  if (trip) return <RunningTrip trip={trip} onEnded={ended} />;

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {t("intro")}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        variant="contained"
        size="large"
        startIcon={<ShareLocationRoundedIcon />}
        onClick={() => void start()}
        loading={starting}
      >
        {t("start")}
      </Button>
    </Box>
  );
}

/** "Share my trip": a live link to the passenger's position for someone they trust. */
function TripSharePanel(props: TripSharePanelProps) {
  // The running trip lives in this device's storage: only read it in the browser
  return useIsClient() ? <TripShareInner {...props} /> : null;
}

export default TripSharePanel;
