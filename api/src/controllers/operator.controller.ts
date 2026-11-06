import type { Request, Response } from "express";
import { findAdminById } from "../repositories/admin.repository.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  addOperatorResponse,
  findFleetReport,
  getFleetSummary,
  listFleetReports,
} from "../repositories/operator.repository.js";
import {
  fleetReportsQuerySchema,
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
  await addOperatorResponse({
    reportId: report.id,
    operatorId: id,
    organisation: operator?.organisation ?? null,
    body: req.body.body,
  });
  await countEvent("operator_response");
  res.status(201).json(await findFleetReport(id, report.id));
};
