import type { Request, Response } from "express";
import {
  getBusScorecard,
  getPublicImpact,
  getRouteScorecard,
  normaliseBus,
  normaliseRoute,
} from "../repositories/public.repository.js";
import { cached } from "../utils/ttl-cache.js";

// Public numbers may lag by a few minutes; that keeps aggregate queries off the hot path
const TTL_MS = 5 * 60 * 1000;
const CACHE_HEADER = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

// @desc    Totals, trends, heatmap and stories for the public impact page
// @route   GET /api/public/stats
// @access  Public
export const getImpact = async (_req: Request, res: Response) => {
  res
    .set("Cache-Control", CACHE_HEADER)
    .json(await cached("public:impact", TTL_MS, getPublicImpact));
};

// @desc    Scorecard for one bus (published only with enough admin-checked reports)
// @route   GET /api/public/buses/:busNumber
// @access  Public
export const getBus = async (req: Request<{ busNumber: string }>, res: Response) => {
  const bus = normaliseBus(req.params.busNumber);
  if (!bus || bus.length > 20) {
    res.status(404).json({ msg: "Bus not found" });
    return;
  }
  const card = await cached(`public:bus:${bus}`, TTL_MS, () => getBusScorecard(bus));
  res.set("Cache-Control", CACHE_HEADER).json(card);
};

// @desc    Scorecard for a route (published only with enough admin-checked reports)
// @route   GET /api/public/routes/:routeNumber
// @access  Public
export const getRoute = async (req: Request<{ routeNumber: string }>, res: Response) => {
  const route = normaliseRoute(req.params.routeNumber);
  if (!route || route.length > 60) {
    res.status(404).json({ msg: "Route not found" });
    return;
  }
  const card = await cached(`public:route:${route}`, TTL_MS, () =>
    getRouteScorecard(req.params.routeNumber),
  );
  res.set("Cache-Control", CACHE_HEADER).json(card);
};
