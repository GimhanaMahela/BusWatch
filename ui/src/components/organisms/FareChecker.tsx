"use client";

import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toApiError } from "@/api/apiClient";
import { checkFare, getFareRoute, getFareRoutes } from "@/api/fareApi";
import type { ServiceClass } from "@/constants/reportConstants";
import type { FareCheckResult, FareRouteSummary, FareSelection } from "@/types/fare";

interface FareCheckerProps {
  /** Pre-select a route by its number (e.g. the route typed on the report form) */
  routeNumber?: string;
  /** Pre-fill everything (a link from the fare checker page to the report form) */
  initial?: Partial<FareSelection>;
  /** Called with each successful check, and with null when the choices change after it */
  onResult?: (selection: FareSelection | null, result: FareCheckResult | null) => void;
  /** Standalone page: offer to report the overcharge */
  onReport?: (selection: FareSelection, result: FareCheckResult) => void;
}

const sameRoute = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Fare checker: route, two stops and class give the official NTC fare; optionally what was paid. */
function FareChecker({ routeNumber, initial, onResult, onReport }: FareCheckerProps) {
  const t = useTranslations("fare");
  const tClass = useTranslations("serviceClasses");
  const routes = useQuery({
    queryKey: ["fares", "routes"],
    queryFn: getFareRoutes,
    staleTime: 300_000,
  });

  const [routeId, setRouteId] = useState<string | null>(initial?.routeId ?? null);
  const [from, setFrom] = useState<number | null>(initial?.from ?? null);
  const [to, setTo] = useState<number | null>(initial?.to ?? null);
  const [serviceClass, setServiceClass] = useState<ServiceClass>(initial?.serviceClass ?? "normal");
  const [charged, setCharged] = useState(initial?.charged?.toString() ?? "");
  const [result, setResult] = useState<FareCheckResult | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  // The route typed on the report form, if the fare checker knows it
  const suggested =
    !routeId && routeNumber
      ? routes.data?.find((r) => sameRoute(r.routeNumber, routeNumber))
      : undefined;
  const chosenId = routeId ?? suggested?.id ?? null;
  const chosen = routes.data?.find((r) => r.id === chosenId) ?? null;

  const route = useQuery({
    queryKey: ["fares", "route", chosenId],
    queryFn: () => getFareRoute(chosenId ?? ""),
    enabled: Boolean(chosenId),
    staleTime: 300_000,
  });
  const stops = route.data?.stops ?? [];
  const classes = route.data?.serviceClasses ?? [];
  const activeClass =
    classes.length && !classes.includes(serviceClass) ? classes[0]! : serviceClass;

  const changed = () => {
    setError("");
    if (result) {
      setResult(null);
      onResult?.(null, null);
    }
  };

  const chargedValue = charged.trim() === "" ? undefined : Number(charged);
  const ready = chosenId !== null && from !== null && to !== null && from !== to;

  const check = async () => {
    if (!ready) return;
    const selection: FareSelection = {
      routeId: chosenId,
      from,
      to,
      serviceClass: activeClass,
      ...(chargedValue !== undefined && Number.isFinite(chargedValue) && { charged: chargedValue }),
    };
    setChecking(true);
    setError("");
    try {
      const checked = await checkFare(selection);
      setResult(checked);
      onResult?.(selection, checked);
    } catch (caught) {
      setError(toApiError(caught).message || t("failed"));
    } finally {
      setChecking(false);
    }
  };

  if (routes.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} aria-label={t("loading")} />
      </Box>
    );
  }
  if (routes.isError) return <Alert severity="warning">{t("unavailable")}</Alert>;
  if (!routes.data.length) return <Alert severity="info">{t("noRoutes")}</Alert>;

  const stopOptions = stops.map((stop, index) => ({ index, label: stop.name }));
  const stopValue = (index: number | null) => stopOptions.find((o) => o.index === index) ?? null;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Autocomplete<FareRouteSummary>
        options={routes.data}
        value={chosen}
        onChange={(_, value) => {
          setRouteId(value?.id ?? null);
          setFrom(null);
          setTo(null);
          changed();
        }}
        getOptionLabel={(r) => `${r.routeNumber} · ${r.name}`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={(params) => (
          <TextField {...params} label={t("route")} placeholder={t("routePlaceholder")} />
        )}
        noOptionsText={t("routeMissing")}
      />

      {chosenId && route.isPending && <CircularProgress size={20} aria-label={t("loading")} />}
      {chosenId && route.data && (
        <>
          <Grid container spacing={2}>
            {(
              [
                ["from", from, setFrom],
                ["to", to, setTo],
              ] as const
            ).map(([key, value, set]) => (
              <Grid key={key} size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={stopOptions}
                  value={stopValue(value)}
                  onChange={(_, option) => {
                    set(option?.index ?? null);
                    changed();
                  }}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.index === b.index}
                  renderInput={(params) => <TextField {...params} label={t(key)} />}
                />
              </Grid>
            ))}
          </Grid>

          {classes.length > 1 && (
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={activeClass}
              onChange={(_, value: ServiceClass | null) => {
                if (value) {
                  setServiceClass(value);
                  changed();
                }
              }}
              aria-label={t("serviceClass")}
              sx={{ flexWrap: "wrap" }}
            >
              {classes.map((c) => (
                <ToggleButton key={c} value={c}>
                  {tClass(c)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <TextField
              label={t("paid")}
              helperText={t("paidHelp")}
              value={charged}
              onChange={(e) => {
                setCharged(e.target.value.replace(/[^\d]/g, ""));
                changed();
              }}
              slotProps={{
                htmlInput: { inputMode: "numeric", maxLength: 6 },
                input: { startAdornment: <InputAdornment position="start">Rs.</InputAdornment> },
              }}
              sx={{ flex: "1 1 180px" }}
            />
            <Button
              variant="outlined"
              size="large"
              onClick={() => void check()}
              disabled={!ready}
              loading={checking}
              startIcon={<CalculateRoundedIcon />}
              sx={{ mt: 0.5 }}
            >
              {t("check")}
            </Button>
          </Box>
        </>
      )}

      {error && <Alert severity="warning">{error}</Alert>}

      {result && (
        <Box
          aria-live="polite"
          sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider", display: "grid", gap: 1 }}
        >
          <Typography variant="overline" color="text.secondary">
            {t("officialFare")}
          </Typography>
          <Typography variant="h4" component="p" sx={{ fontWeight: 800 }}>
            Rs. {result.officialFare}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("resultDetail", {
              from: result.from,
              to: result.to,
              stages: result.stages,
              serviceClass: tClass(result.serviceClass),
            })}
            {result.effectiveFrom && ` ${t("effectiveFrom", { date: result.effectiveFrom })}`}
          </Typography>
          {result.chargedFare !== null &&
            (result.overchargedBy > 0 ? (
              <Alert
                severity="error"
                action={
                  onReport && (
                    <Button
                      color="inherit"
                      size="small"
                      startIcon={<ReportRoundedIcon />}
                      onClick={() =>
                        onReport(
                          {
                            routeId: chosenId ?? "",
                            from: from ?? 0,
                            to: to ?? 0,
                            serviceClass: result.serviceClass,
                            charged: result.chargedFare ?? undefined,
                          },
                          result,
                        )
                      }
                    >
                      {t("report")}
                    </Button>
                  )
                }
              >
                {t("overcharged", { amount: result.overchargedBy })}
              </Alert>
            ) : (
              <Alert severity="success">{t("fair")}</Alert>
            ))}
          <Typography variant="caption" color="text.secondary">
            {t("disclaimer")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default FareChecker;
