import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { TRIP_SHARE } from "../config/constants.js";
import type { TripShareRow } from "../db/schema.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  createTrip,
  deleteOldTrips,
  endTrip,
  findTrip,
  setTripPosition,
} from "../repositories/trip.repository.js";
import type { StartTripInput, TripPositionInput } from "../validators/trip.validator.js";

// "Share my trip" (safety mode). The link a trusted contact opens holds a random trip id; sending
// positions or ending the trip needs a second secret that only the passenger's phone has.

type IdParams = { id: string };
const HOUR_MS = 60 * 60 * 1000;
const TRIP_ID = /^[A-Za-z0-9_-]{16,64}$/;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const isOwner = (trip: TripShareRow, token: string | undefined) => {
  if (!token) return false;
  const given = Buffer.from(hash(token), "hex");
  const stored = Buffer.from(trip.ownerTokenHash, "hex");
  return given.length === stored.length && timingSafeEqual(given, stored);
};

const isActive = (trip: TripShareRow, now = Date.now()) =>
  !trip.endedAt && trip.expiresAt.getTime() > now;

/** Loads the trip in :id, answering 404 itself when it doesn't exist. */
const loadTrip = async (req: Request<IdParams>, res: Response) => {
  const trip = TRIP_ID.test(req.params.id) ? await findTrip(req.params.id) : null;
  if (!trip) res.status(404).json({ msg: "This trip link has expired or isn't valid." });
  return trip;
};

// @desc    Start sharing a trip; returns the link id and the phone's secret
// @route   POST /api/trips
// @access  Public (rate limited)
export const start = async (req: Request<object, object, StartTripInput>, res: Response) => {
  const now = Date.now();
  // Housekeeping: forget trips that ended a while ago
  await deleteOldTrips(new Date(now - TRIP_SHARE.keepDays * 24 * HOUR_MS));

  const ownerToken = randomBytes(32).toString("base64url");
  const trip = await createTrip({
    id: randomBytes(16).toString("base64url"),
    ownerTokenHash: hash(ownerToken),
    busNumber: req.body.busNumber?.toUpperCase(),
    routeNumber: req.body.routeNumber,
    expiresAt: new Date(now + TRIP_SHARE.maxHours * HOUR_MS),
  });
  await countEvent("trip_share_started");
  res.status(201).json({ id: trip.id, ownerToken, expiresAt: trip.expiresAt });
};

// @desc    The passenger's phone sends its newest position
// @route   PUT /api/trips/:id/position   (x-trip-token header)
// @access  The passenger who started the trip
export const updatePosition = async (
  req: Request<IdParams, object, TripPositionInput>,
  res: Response,
) => {
  const trip = await loadTrip(req, res);
  if (!trip) return;
  if (!isOwner(trip, req.header("x-trip-token"))) {
    res.status(403).json({ msg: "Only the phone that started this trip can update it." });
    return;
  }
  const { latitude, longitude, accuracy } = req.body;
  if (!(await setTripPosition(trip.id, { latitude, longitude, accuracy: accuracy ?? null }))) {
    res.status(410).json({ msg: "This trip has ended." });
    return;
  }
  res.status(204).end();
};

// @desc    Stop sharing (the position is deleted)
// @route   POST /api/trips/:id/end   (x-trip-token header)
// @access  The passenger who started the trip
export const end = async (req: Request<IdParams>, res: Response) => {
  const trip = await loadTrip(req, res);
  if (!trip) return;
  if (!isOwner(trip, req.header("x-trip-token"))) {
    res.status(403).json({ msg: "Only the phone that started this trip can end it." });
    return;
  }
  await endTrip(trip.id);
  res.json({ msg: "Trip ended" });
};

// @desc    What the trusted contact sees: the bus and the latest position while the trip runs
// @route   GET /api/trips/:id
// @access  Anyone with the link
export const view = async (req: Request<IdParams>, res: Response) => {
  const trip = await loadTrip(req, res);
  if (!trip) return;
  const active = isActive(trip);
  const position =
    active && trip.latitude !== null && trip.longitude !== null && trip.positionAt
      ? {
          latitude: trip.latitude,
          longitude: trip.longitude,
          accuracy: trip.accuracy,
          at: trip.positionAt,
        }
      : null;
  res.set("Cache-Control", "no-store").json({
    busNumber: trip.busNumber,
    routeNumber: trip.routeNumber,
    startedAt: trip.startedAt,
    expiresAt: trip.expiresAt,
    endedAt: trip.endedAt,
    active,
    position,
  });
};
