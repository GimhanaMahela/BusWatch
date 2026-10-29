const rateLimit = require("express-rate-limit");

// Note: the default store is in-memory, so on serverless hosts each instance
// keeps its own counters. Swap in a shared store (e.g. Redis) for strict limits.
const limiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { msg: message },
  });

module.exports = {
  submitLimiter: limiter(15, 5, "Too many reports from this device. Please try again later."),
  loginLimiter: limiter(15, 10, "Too many login attempts. Please try again later."),
  trackLimiter: limiter(15, 60, "Too many lookups. Please try again later."),
};
