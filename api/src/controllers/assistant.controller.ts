import type { Request, Response } from "express";
import { countEvent } from "../repositories/metric.repository.js";
import { AiServiceError, AiUnavailableError } from "../services/ai.service.js";
import { chat as askAssistant, isAssistantEnabled } from "../services/assistant.service.js";
import { checkEmergency } from "../services/emergency.service.js";
import type { ChatInput, EmergencyCheckInput } from "../validators/assistant.validator.js";

// @desc    Is the BusWatch helper chat switched on?
// @route   GET /api/assistant/status
// @access  Public
export const status = (_req: Request, res: Response) => {
  res.json({ enabled: isAssistantEnabled() });
};

// @desc    The helper's reply, plus a report draft once the passenger has described what happened
// @route   POST /api/assistant/chat
// @access  Public (rate limited)
export const chat = async (req: Request<object, object, ChatInput>, res: Response) => {
  if (!isAssistantEnabled()) {
    res.status(503).json({ msg: "The BusWatch helper is not available right now." });
    return;
  }
  try {
    const reply = await askAssistant(req.body.messages, req.body.language);
    await countEvent("assistant_chat");
    res.json(reply);
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      res
        .status(503)
        .json({ msg: "The helper couldn't answer that. Please try asking another way." });
      return;
    }
    if (error instanceof AiServiceError) {
      console.error("Assistant request failed:", error.status, error.message);
      res.status(503).json({
        msg:
          error.status === 429 || error.status >= 500
            ? "The helper is busy right now. Please try again in a minute."
            : "The helper is not available right now. Please try again later.",
      });
      return;
    }
    throw error;
  }
};

// @desc    Emergency shortcut: does what the passenger typed sound like an emergency?
// @route   POST /api/assistant/emergency
// @access  Public (rate limited)
export const emergency = async (
  req: Request<object, object, EmergencyCheckInput>,
  res: Response,
) => {
  try {
    res.json(await checkEmergency(req.body.text, req.body.language));
  } catch (error) {
    // Never in the passenger's way: the page still has its keyword check
    console.error("Emergency check failed:", error instanceof Error ? error.message : error);
    res.json({ checked: false, emergency: false, kind: null });
  }
};
