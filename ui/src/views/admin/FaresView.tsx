"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { errorMessage } from "@/api/apiClient";
import {
  createFareRoute,
  deleteFareRoute,
  getFareAdmin,
  getFareRoute,
  saveFareTable,
  updateFareRoute,
} from "@/api/fareApi";
import { EmptyState, LoadingState, PageHeader } from "@/components/molecules";
import { SERVICE_CLASSES, serviceClassLabel, type ServiceClass } from "@/constants/reportConstants";
import { timeAgo } from "@/lib/format";
import { formatFares, formatStops, parseFares, parseStops } from "@/lib/fareText";
import type { FareAdminOverview, FareTable } from "@/types/fare";

const ADMIN_KEY = ["fares", "admin"];

function FareTableCard({ serviceClass, table }: { serviceClass: ServiceClass; table?: FareTable }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(table ? formatFares(table.fares) : "");
  const [effectiveFrom, setEffectiveFrom] = useState(table?.effectiveFrom ?? "");
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: (fares: number[]) => saveFareTable(serviceClass, fares, effectiveFrom || undefined),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["fares"] }),
    onError: (e) => setError(errorMessage(e, "Could not save the fares.")),
  });

  const submit = () => {
    const parsed = parseFares(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError("");
    save.mutate(parsed.value);
  };

  return (
    <Card sx={{ p: 2.5, display: "grid", gap: 1.5, height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography variant="h6">{serviceClassLabel(serviceClass)}</Typography>
        <Typography variant="caption" color="text.secondary">
          {table ? `${table.fares.length} stages` : "Not set"}
        </Typography>
      </Box>
      <TextField
        multiline
        minRows={6}
        maxRows={14}
        label="Fare per stage (Rs.)"
        helperText='One line per stage, starting with the minimum fare: "1, 30" or just "30".'
        value={text}
        onChange={(e) => setText(e.target.value)}
        slotProps={{ htmlInput: { style: { fontFamily: "ui-monospace, monospace" } } }}
      />
      <TextField
        type="date"
        label="Effective from"
        value={effectiveFrom}
        onChange={(e) => setEffectiveFrom(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      {save.isSuccess && !error && <Alert severity="success">Saved.</Alert>}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {table &&
            `Updated ${timeAgo(table.updatedAt)}${table.updatedBy ? ` by ${table.updatedBy}` : ""}`}
        </Typography>
        <Button variant="contained" onClick={submit} loading={save.isPending}>
          Save
        </Button>
      </Box>
    </Card>
  );
}

interface RouteDraft {
  id?: string;
  routeNumber: string;
  name: string;
  serviceClasses: ServiceClass[];
  stopsText: string;
}

const EMPTY_ROUTE: RouteDraft = {
  routeNumber: "",
  name: "",
  serviceClasses: ["normal"],
  stopsText: "",
};

function RouteDialog({ draft, onClose }: { draft: RouteDraft; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [route, setRoute] = useState(draft);
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: () => {
      const stops = parseStops(route.stopsText);
      if (!stops.ok) throw new Error(stops.error);
      const input = {
        routeNumber: route.routeNumber,
        name: route.name,
        serviceClasses: route.serviceClasses,
        stops: stops.value,
      };
      return route.id ? updateFareRoute(route.id, input) : createFareRoute(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fares"] });
      onClose();
    },
    onError: (e) => setError(errorMessage(e, "Could not save the route.")),
  });

  const toggleClass = (value: ServiceClass) =>
    setRoute({
      ...route,
      serviceClasses: route.serviceClasses.includes(value)
        ? route.serviceClasses.filter((c) => c !== value)
        : [...route.serviceClasses, value],
    });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{route.id ? `Edit route ${draft.routeNumber}` : "Add a route"}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              label="Route number"
              value={route.routeNumber}
              onChange={(e) => setRoute({ ...route, routeNumber: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              required
              label="Name"
              placeholder="Colombo - Kandy"
              value={route.name}
              onChange={(e) => setRoute({ ...route, name: e.target.value })}
            />
          </Grid>
        </Grid>
        <FormGroup row>
          {SERVICE_CLASSES.map((c) => (
            <FormControlLabel
              key={c.value}
              label={c.label}
              control={
                <Checkbox
                  checked={route.serviceClasses.includes(c.value)}
                  onChange={() => toggleClass(c.value)}
                />
              }
            />
          ))}
        </FormGroup>
        <TextField
          multiline
          minRows={8}
          maxRows={18}
          required
          label="Stops, in order"
          helperText='One stop per line with its fare stage: "0, Colombo Fort", "3, Kadawatha".'
          value={route.stopsText}
          onChange={(e) => setRoute({ ...route, stopsText: e.target.value })}
          slotProps={{ htmlInput: { style: { fontFamily: "ui-monospace, monospace" } } }}
        />
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          loading={save.isPending}
          disabled={!route.routeNumber.trim() || !route.name.trim() || !route.serviceClasses.length}
          onClick={() => {
            setError("");
            save.mutate();
          }}
        >
          Save route
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RoutesCard({ routes }: { routes: FareAdminOverview["routes"] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RouteDraft | null>(null);
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");
  const remove = useMutation({
    mutationFn: deleteFareRoute,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["fares"] }),
    onError: (e) => setError(errorMessage(e, "Could not remove the route.")),
  });

  const edit = async (id: string) => {
    setLoadingId(id);
    setError("");
    try {
      const route = await getFareRoute(id);
      setEditing({
        id,
        routeNumber: route.routeNumber,
        name: route.name,
        serviceClasses: route.serviceClasses,
        stopsText: formatStops(route.stops),
      });
    } catch (e) {
      setError(errorMessage(e, "Could not open the route."));
    } finally {
      setLoadingId("");
    }
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Routes ({routes.length})</Typography>
        <Button
          startIcon={<AddRoundedIcon />}
          variant="contained"
          onClick={() => setEditing(EMPTY_ROUTE)}
        >
          Add route
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {routes.length === 0 ? (
        <EmptyState
          icon={<PaymentsRoundedIcon />}
          title="No routes yet"
          description="Add a route's stops and fare stages so passengers can check their fare on it."
        />
      ) : (
        <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
          {routes.map((route) => (
            <Box
              key={route.id}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.25, flexWrap: "wrap" }}
            >
              <Typography sx={{ fontWeight: 700, minWidth: 56 }}>{route.routeNumber}</Typography>
              <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                <Typography noWrap>{route.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {route.stopCount} stops · updated {timeAgo(route.updatedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {route.serviceClasses.map((c) => (
                  <Chip key={c} size="small" label={serviceClassLabel(c)} />
                ))}
              </Box>
              <Tooltip title="Edit">
                <IconButton
                  aria-label={`Edit route ${route.routeNumber}`}
                  onClick={() => void edit(route.id)}
                  loading={loadingId === route.id}
                >
                  <EditRoundedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton
                  aria-label={`Remove route ${route.routeNumber}`}
                  onClick={() => {
                    if (
                      window.confirm(`Remove route ${route.routeNumber} from the fare checker?`)
                    ) {
                      remove.mutate(route.id);
                    }
                  }}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}
      {editing && <RouteDialog draft={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

/**
 * Fare checker data: the NTC fare-stage table for each service class, and each route's stops with
 * their fare stages. Passengers use it at /fare-check and on overcharging complaints.
 */
function FaresView() {
  const overview = useQuery({ queryKey: ADMIN_KEY, queryFn: getFareAdmin });

  return (
    <Box>
      <PageHeader
        eyebrow="Fare checker"
        title="Fares"
        subtitle="Official fares passengers can check, and attach to overcharging complaints."
        actions={
          <Button href="/fare-check" target="_blank" startIcon={<OpenInNewRoundedIcon />}>
            Open fare checker
          </Button>
        }
      />
      {overview.isPending ? (
        <LoadingState />
      ) : overview.isError ? (
        <Alert severity="error">{errorMessage(overview.error, "Could not load fares.")}</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 3 }}>
          <Alert severity="info">
            A journey costs the fare for the number of fare stages between the two stops (the
            minimum fare within one stage). Copy the stages and fares from the latest NTC fare list.
          </Alert>
          <Grid container spacing={2}>
            {SERVICE_CLASSES.map((c) => {
              const table = overview.data.tables.find((t) => t.serviceClass === c.value);
              return (
                <Grid key={`${c.value}-${table?.updatedAt ?? "new"}`} size={{ xs: 12, md: 4 }}>
                  <FareTableCard serviceClass={c.value} table={table} />
                </Grid>
              );
            })}
          </Grid>
          <RoutesCard routes={overview.data.routes} />
        </Box>
      )}
    </Box>
  );
}

export default FaresView;
