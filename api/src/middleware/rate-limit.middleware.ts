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

// Wider ecosystem (Phase 4)
export const confirmLimiter = limiter(15, 10, "Too many confirmations. Please try again later.");
// Each AI request costs money: generous for a team, but stops a runaway loop
export const aiLimiter = limiter(15, 60, "Too many AI requests. Please wait a few minutes.");
// The public helper chat: enough for a few conversations, and keeps the free AI quota for everyone
export const assistantLimiter = limiter(
  15,
  40,
  "You've sent a lot of messages. Please wait a few minutes.",
);

// Passenger safety (Phase 5)
export const tripLimiter = limiter(15, 20, "Too many trips started. Please try again later.");
// A phone sends a position every ~20 s and a contact's page checks every ~15 s
export const tripPositionLimiter = limiter(15, 600, "Too many updates. Please try again later.");
// The emergency check runs as the passenger types: generous, but it uses the free AI quota
export const emergencyLimiter = limiter(15, 30, "Too many checks. Please try again later.");
