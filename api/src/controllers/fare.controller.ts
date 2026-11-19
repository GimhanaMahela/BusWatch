import type { Request, Response } from "express";
import type { ServiceClass } from "../config/constants.js";
import {
  createFareRoute,
  deleteFareRoute,
  findFareRoute,
  listFareRoutes,
  listFareTables,
  saveFareTable,
  updateFareRoute,
} from "../repositories/fare.repository.js";
import { countEvent } from "../repositories/metric.repository.js";
import { FareError, officialFare } from "../services/fare.service.js";
import { cached, invalidateCache } from "../utils/ttl-cache.js";
import {
  fareCheckQuerySchema,
  type FareRouteInput,
  type FareTableInput,
} from "../validators/fare.validator.js";

type IdParams = { id: string };

// Fares change rarely; a few minutes of lag after an admin edit is fine (edits clear the cache)
const TTL_MS = 5 * 60 * 1000;
const CACHE_HEADER = "public, max-age=60, s-maxage=300";

const publicRoute = (route: NonNullable<Awaited<ReturnType<typeof findFareRoute>>>) => ({
  id: route.id,
  routeNumber: route.routeNumber,
  name: route.name,
  serviceClasses: route.serviceClasses,
  stops: route.stops,
});

// @desc    Routes the fare checker knows (without their stops)
// @route   GET /api/fares/routes
// @access  Public
export const getRoutes = async (_req: Request, res: Response) => {
  const routes = await cached("fares:routes", TTL_MS, listFareRoutes);
  res
    .set("Cache-Control", CACHE_HEADER)
    .json(routes.map(({ updatedAt: _updatedAt, ...route }) => route));
};

// @desc    One route with its stops and fare stages
// @route   GET /api/fares/routes/:id
// @access  Public
export const getRoute = async (req: Request<IdParams>, res: Response) => {
  const route = await cached(`fares:route:${req.params.id}`, TTL_MS, () =>
    findFareRoute(req.params.id),
  );
  if (!route) {
    res.status(404).json({ msg: "We don't have fares for this route." });
    return;
  }
  res.set("Cache-Control", CACHE_HEADER).json(publicRoute(route));
};

// @desc    The official fare between two stops (and whether the passenger was overcharged)
// @route   GET /api/fares/check?routeId&from&to&serviceClass&charged
// @access  Public
export const check = async (req: Request, res: Response) => {
  const parsed = fareCheckQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Choose a route and two stops.";
    res.status(400).json({ msg, message: msg });
    return;
  }
  try {
    const fare = await officialFare(parsed.data);
    await countEvent("fare_checked");
    const charged = fare.chargedFare;
    res.json({
      ...fare,
      overchargedBy:
        charged !== null && charged > fare.officialFare ? charged - fare.officialFare : 0,
    });
  } catch (error) {
    if (error instanceof FareError) {
      res.status(422).json({ msg: error.message, message: error.message });
      return;
    }
    throw error;
  }
};

// ---------------------------------------------------------------- Admin

// @desc    Fare tables and routes for the admin Fares page
// @route   GET /api/fares/admin
// @access  Private (Admin)
export const getAdminOverview = async (_req: Request, res: Response) => {
  const [tables, routes] = await Promise.all([listFareTables(), listFareRoutes()]);
  res.json({ tables, routes });
};

// @desc    Replace the fare-stage table for one service class
// @route   PUT /api/fares/tables/:serviceClass
// @access  Private (Admin)
export const putTable = async (
  req: Request<{ serviceClass: string }, object, FareTableInput>,
  res: Response,
) => {
  const table = await saveFareTable({
    serviceClass: req.params.serviceClass as ServiceClass,
    fares: req.body.fares,
    effectiveFrom: req.body.effectiveFrom ?? null,
    updatedBy: req.admin?.email ?? null,
  });
  invalidateCache("fares:");
  res.json(table);
};

// @desc    Add a route with its stops
// @route   POST /api/fares/routes
// @access  Private (Admin)
export const createRoute = async (req: Request<object, object, FareRouteInput>, res: Response) => {
  const route = await createFareRoute({ ...req.body, updatedBy: req.admin?.email ?? null });
  if (!route) {
    res
      .status(409)
      .json({ msg: `Route ${req.body.routeNumber} already has fares. Edit it instead.` });
    return;
  }
  invalidateCache("fares:");
  res.status(201).json(route);
};

// @desc    Change a route's number, name, classes or stops
// @route   PUT /api/fares/routes/:id
// @access  Private (Admin)
export const updateRoute = async (
  req: Request<IdParams, object, FareRouteInput>,
  res: Response,
) => {
  const result = await updateFareRoute(req.params.id, {
    ...req.body,
    updatedBy: req.admin?.email ?? null,
  });
  if (result === "missing") {
    res.status(404).json({ msg: "Route not found" });
    return;
  }
  if (result === "duplicate") {
    res.status(409).json({ msg: `Route ${req.body.routeNumber} already has fares.` });
    return;
  }
  invalidateCache("fares:");
  res.json(result);
};

// @desc    Remove a route from the fare checker
// @route   DELETE /api/fares/routes/:id
// @access  Private (Admin)
export const deleteRoute = async (req: Request<IdParams>, res: Response) => {
  if (!(await deleteFareRoute(req.params.id))) {
    res.status(404).json({ msg: "Route not found" });
    return;
  }
  invalidateCache("fares:");
  res.json({ msg: "Route removed" });
};
