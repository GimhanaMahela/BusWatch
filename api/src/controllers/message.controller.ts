import type { Request, Response } from "express";
import { addMessage, markMessagesRead } from "../repositories/message.repository.js";
import { countEvent } from "../repositories/metric.repository.js";
import { findReportById, findReportByReceiptId } from "../repositories/report.repository.js";
import { notifyPassenger } from "../services/notification.service.js";
import type {
  AdminMessageInput,
  PassengerMessageInput,
} from "../validators/passenger.validator.js";
import { canReply, toPublicView } from "./report.controller.js";

type IdParams = { id: string };
type ReceiptParams = { receiptId: string };

// "Messages between admin and passenger": admins write from the report page; the passenger reads
// and replies on the public tracking page (the receipt ID is their key, as for ratings).

// @desc    Send the passenger a message, e.g. "Which seat were you in?" (Admin only)
// @route   POST /api/reports/:id/messages
// @access  Private (Admin)
export const sendAdminMessage = async (
  req: Request<IdParams, object, AdminMessageInput>,
  res: Response,
) => {
  const current = await findReportById(req.params.id);
  if (!current) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  await addMessage(current.id, "admin", req.body.body, req.admin?.email);
  // Answering the passenger also means their earlier messages have been read
  await markMessagesRead(current.id, "admin");
  await countEvent("admin_message");

  const delivery = req.body.notifyPassenger
    ? await notifyPassenger(current, { kind: "message", body: req.body.body })
    : { email: false, sms: false, push: 0 };

  const report = await findReportById(current.id);
  res.status(201).json({ ...report, delivery });
};

// @desc    Mark the passenger's messages as read (Admin only)
// @route   POST /api/reports/:id/messages/read
// @access  Private (Admin)
export const markReadByAdmin = async (req: Request<IdParams>, res: Response) => {
  const report = await findReportById(req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  await markMessagesRead(report.id, "admin");
  res.json({ msg: "Marked as read" });
};

// @desc    The passenger replies to the team
// @route   POST /api/reports/track/:receiptId/messages
// @access  Public (the receipt ID is the passenger's key)
export const sendPassengerMessage = async (
  req: Request<ReceiptParams, object, PassengerMessageInput>,
  res: Response,
) => {
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) {
    res.status(404).json({ msg: "No report found with this Receipt ID." });
    return;
  }
  if (!canReply(report)) {
    res.status(409).json({
      msg: "This report was closed a while ago. Please send a new report instead.",
      code: "reply_closed",
    });
    return;
  }
  await addMessage(report.id, "passenger", req.body.body);
  await markMessagesRead(report.id, "passenger");
  await countEvent("passenger_message");

  const updated = await findReportById(report.id);
  if (!updated) throw new Error("Report disappeared while saving a message");
  res.status(201).json(toPublicView(updated));
};

// @desc    The passenger has seen the team's messages
// @route   POST /api/reports/track/:receiptId/messages/read
// @access  Public
export const markReadByPassenger = async (req: Request<ReceiptParams>, res: Response) => {
  const report = await findReportByReceiptId(req.params.receiptId);
  if (!report) {
    res.status(404).json({ msg: "No report found with this Receipt ID." });
    return;
  }
  await markMessagesRead(report.id, "passenger");
  res.json({ msg: "Marked as read" });
};
