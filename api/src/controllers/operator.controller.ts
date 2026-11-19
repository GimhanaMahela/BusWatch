import type { Request, Response } from "express";
import { findAdminById } from "../repositories/admin.repository.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  addOperatorResponse,
  findFleetReport,
  getFleetSummary,
  listFleetReports,
} from "../repositories/operator.repository.js";
import { findReportById, updateReportStatus } from "../repositories/report.repository.js";
import { notifyPassenger } from "../services/notification.service.js";
import { invalidateCache } from "../utils/ttl-cache.js";
import {
  fleetReportsQuerySchema,
  type LostItemFoundInput,
  type OperatorResponseInput,
} from "../validators/operator.validator.js";

type IdParams = { id: string };

const operatorId = (req: Request) => {
  if (!req.admin?.id) throw new Error("requireOperator must run first");
  return req.admin.id;
};

// @desc    Overview of the operator's fleet
// @route   GET /api/operator/summary
// @access  Private (operator)
export const getSummary = async (req: Request, res: Response) => {
  res.json(await getFleetSummary(operatorId(req)));
};

// @desc    Checked reports about the operator's buses
// @route   GET /api/operator/reports?page&limit&status&type&busNumber
// @access  Private (operator)
export const listReports = async (req: Request, res: Response) => {
  const query = fleetReportsQuerySchema.parse(req.query);
  const { rows, total } = await listFleetReports(operatorId(req), query);
  res.json({
    reports: rows,
    total,
    page: query.page,
    pages: Math.max(Math.ceil(total / query.limit), 1),
  });
};

// @desc    One report about the operator's fleet
// @route   GET /api/operator/reports/:id
// @access  Private (operator)
export const getReport = async (req: Request<IdParams>, res: Response) => {
  const report = await findFleetReport(operatorId(req as Request), req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  res.json(report);
};

// @desc    Say what the operator did about a report (shown to the passenger)
// @route   POST /api/operator/reports/:id/responses
// @access  Private (operator)
export const respond = async (
  req: Request<IdParams, object, OperatorResponseInput>,
  res: Response,
) => {
  const id = operatorId(req as Request);
  const report = await findFleetReport(id, req.params.id);
  if (!report) {
    res.status(404).json({ msg: "Report not found" });
    return;
  }
  const operator = await findAdminById(id);
  const organisation = operator?.organisation ?? null;
  await addOperatorResponse({
    reportId: report.id,
    operatorId: id,
    organisation,
    body: req.body.body,
  });
  await countEvent("operator_response");
  // A lost item can't wait for an admin to pass the news on (complaint responses can be hidden by
  // admins first, so those are only shown on the tracking page)
  if (report.type === "lost_item") {
    const full = await findReportById(report.id);
    if (full) await notifyPassenger(full, { kind: "operator", body: req.body.body, organisation });
  }
  res.status(201).json(await findFleetReport(id, report.id));
};

// @desc    "We found it": closes a lost item report and tells the passenger where to collect it
// @route   POST /api/operator/reports/:id/found
// @access  Private (operator)
export const markFound = async (
  req: Request<IdParams, object, LostItemFoundInput>,
  res: Response,
) => {
  const id = operatorId(req as Request);
  const report = await findFleetReport(id, req.params.id);
  if (!report || report.type !== "lost_item") {
    res.status(404).json({ msg: "Lost item report not found" });
    return;
  }
  if (report.status === "resolved") {
    res.status(409).json({ msg: "This item is already marked as found." });
    return;
  }
  const operator = await findAdminById(id);
  const organisation = operator?.organisation ?? null;
  await addOperatorResponse({
    reportId: report.id,
    operatorId: id,
    organisation,
    body: req.body.body,
  });
  await updateReportStatus(report.id, {
    status: "resolved",
    note: req.body.body,
    changedBy: operator?.email ?? "operator",
  });
  await countEvent("operator_response");
  invalidateCache("public:");
  const full = await findReportById(report.id);
  if (full)
    await notifyPassenger(full, { kind: "status", status: "resolved", note: req.body.body });
  res.json(await findFleetReport(id, report.id));
};
