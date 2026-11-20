"use client";

import MapRoundedIcon from "@mui/icons-material/MapRounded";
import ShareLocationRoundedIcon from "@mui/icons-material/ShareLocationRounded";
import { Alert, Box, Button, Card, CircularProgress, Container, Typography } from "@mui/material";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { getTrip } from "@/api/tripApi";
import { DetailRow, EmergencyBanner, PageIntro } from "@/components/molecules";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY ?? "";
const hasMapsKey = Boolean(MAPS_API_KEY) && MAPS_API_KEY !== "YOUR_Maps_API_KEY";
/** How often the contact's page asks for the newest position */
const REFRESH_MS = 15_000;

function TripMap({ lat, lng }: { lat: number; lng: number }) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });
  if (loadError) return null;
  if (!isLoaded) return <CircularProgress size={24} />;
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: 320, borderRadius: 16 }}
      center={{ lat, lng }}
      zoom={15}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      <MarkerF position={{ lat, lng }} />
    </GoogleMap>
  );
}

/** "Share my trip", for the trusted contact: the bus and where the passenger is now. */
function TripView({ id }: { id: string }) {
  const t = useTranslations("trip");
  const format = useFormatter();
  const now = useNow({ updateInterval: 10_000 });
  const trip = useQuery({
    queryKey: ["trip", id],
    queryFn: () => getTrip(id),
    refetchInterval: (query) => (query.state.data?.active === false ? false : REFRESH_MS),
    retry: false,
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <PageIntro
        icon={<ShareLocationRoundedIcon />}
        color="secondary"
        eyebrow={t("viewEyebrow")}
        title={t("viewTitle")}
        subtitle={t("viewSubtitle")}
      />
      {trip.isPending && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress aria-label={t("loading")} />
        </Box>
      )}
      {trip.isError && <Alert severity="warning">{t("notFound")}</Alert>}
      {trip.data && (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            {trip.data.busNumber && <DetailRow label={t("bus")}>{trip.data.busNumber}</DetailRow>}
            {trip.data.routeNumber && (
              <DetailRow label={t("route")}>{trip.data.routeNumber}</DetailRow>
            )}
            <DetailRow label={t("started")}>
              {format.relativeTime(new Date(trip.data.startedAt), now)}
            </DetailRow>
            {!trip.data.active ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {trip.data.endedAt ? t("ended") : t("expired")}
              </Alert>
            ) : trip.data.position ? (
              <Box sx={{ mt: 2, display: "grid", gap: 1.5 }}>
                <Typography>
                  {t("lastSeen", {
                    when: format.relativeTime(new Date(trip.data.position.at), now),
                  })}
                  {trip.data.position.accuracy !== null &&
                    ` ${t("accuracy", { metres: Math.round(trip.data.position.accuracy) })}`}
                </Typography>
                {hasMapsKey && (
                  <TripMap lat={trip.data.position.latitude} lng={trip.data.position.longitude} />
                )}
                <Button
                  variant="contained"
                  startIcon={<MapRoundedIcon />}
                  href={`https://www.google.com/maps/search/?api=1&query=${trip.data.position.latitude},${trip.data.position.longitude}`}
                  target="_blank"
                  rel="noopener"
                >
                  {t("openMap")}
                </Button>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t("noPosition")}
              </Alert>
            )}
          </Card>
          {trip.data.active && <EmergencyBanner kind={null} variant="calm" />}
        </Box>
      )}
    </Container>
  );
}

export default TripView;
