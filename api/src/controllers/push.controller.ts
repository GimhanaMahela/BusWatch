import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  deletePushSubscription,
  isPushSubscribed,
  savePushSubscription,
} from "../repositories/push.repository.js";
import { findReportByReceiptId } from "../repositories/report.repository.js";
import { isPushConfigured } from "../services/push.service.js";
import type { PushSubscriptionBody } from "../validators/passenger.validator.js";

type ReceiptParams = { receiptId: string };

// @desc    The VAPID public key browsers need to subscribe (null when push is off)
// @route   GET /api/push/key
// @access  Public
export const getPushKey = (_req: Request, res: Response) => {
  res.json({ publicKey: isPushConfigured() ? (env.VAPID_PUBLIC_KEY ?? null) : null });
};

const findReport = async (req: Request<ReceiptParams>, res: Response) => {
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) res.status(404).json({ msg: "No report found with this Receipt ID." });
  return report;
};

// @desc    Notify this device about the report
// @route   POST /api/reports/track/:receiptId/push
// @access  Public (the receipt ID is the passenger's key)
export const subscribe = async (
  req: Request<ReceiptParams, object, PushSubscriptionBody>,
  res: Response,
) => {
  if (!isPushConfigured()) {
    res.status(503).json({ msg: "Notifications are not available yet.", code: "push_unavailable" });
    return;
  }
  const report = await findReport(req, res);
  if (!report) return;
  const alreadySubscribed = await isPushSubscribed(report.id, req.body.endpoint);
  await savePushSubscription(report.id, req.body);
  if (!alreadySubscribed) await countEvent("push_subscribed");
  res.status(201).json({ subscribed: true });
};

// @desc    Stop notifying this device about the report
// @route   POST /api/reports/track/:receiptId/push/unsubscribe
// @access  Public
export const unsubscribe = async (
  req: Request<ReceiptParams, object, { endpoint: string }>,
  res: Response,
) => {
  const report = await findReport(req, res);
  if (!report) return;
  await deletePushSubscription(report.id, req.body.endpoint);
  res.json({ subscribed: false });
};

// @desc    Is this device following the report?
// @route   POST /api/reports/track/:receiptId/push/status
// @access  Public
export const status = async (
  req: Request<ReceiptParams, object, { endpoint: string }>,
  res: Response,
) => {
  const report = await findReport(req, res);
  if (!report) return;
  res.json({ subscribed: await isPushSubscribed(report.id, req.body.endpoint) });
};
