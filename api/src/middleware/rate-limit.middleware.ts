import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Note: the default store is in-memory, so on serverless hosts each instance
// keeps its own counters. Swap in a shared store (e.g. Redis) for strict limits.
const limiter = (windowMinutes: number, max: number, message: string) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { msg: message, message },
    skip: () => env.NODE_ENV === "test",
  });

export const submitLimiter = limiter(
  15,
  5,
  "Too many reports from this device. Please try again later.",
);
export const loginLimiter = limiter(15, 10, "Too many login attempts. Please try again later.");
export const trackLimiter = limiter(15, 60, "Too many lookups. Please try again later.");
export const rateLimiter = limiter(15, 20, "Too many ratings. Please try again later.");
export const publicLimiter = limiter(15, 300, "Too many requests. Please try again later.");
// Generous: one page view sends at most a couple of events
export const metricsLimiter = limiter(15, 300, "Too many requests. Please try again later.");

// Two-way contact (Phase 3)
export const codeLimiter = limiter(15, 10, "Too many code requests. Please try again later.");
export const signInLimiter = limiter(15, 20, "Too many sign-in attempts. Please try again later.");
export const messageLimiter = limiter(15, 20, "Too many messages. Please try again later.");
export const pushLimiter = limiter(15, 60, "Too many requests. Please try again later.");
export const passengerLimiter = limiter(15, 120, "Too many requests. Please try again later.");
