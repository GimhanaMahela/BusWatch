import type { Request, Response } from "express";
import { PASSENGER_CODE, type ContactChannel } from "../config/constants.js";
import { env } from "../config/env.js";
import { messagesFor } from "../i18n/messages.js";
import { signPassengerToken } from "../middleware/auth.middleware.js";
import { countEvent } from "../repositories/metric.repository.js";
import {
  deleteExpiredCodes,
  hasReportsForContact,
  issueSignInCode,
  listReportsForContact,
  verifySignInCode,
  type PassengerContact,
} from "../repositories/passenger.repository.js";
import { isEmailConfigured, sendSignInCodeEmail } from "../services/email.service.js";
import { isPushConfigured } from "../services/push.service.js";
import { isSmsConfigured, sendSms } from "../services/sms.service.js";
import { isTelegramConfigured } from "../services/telegram.service.js";
import { maskEmail, maskPhone } from "../utils/phone.js";
import type { RequestCodeInput, VerifyCodeInput } from "../validators/passenger.validator.js";

// "My reports" without passwords: the passenger enters the email or phone number they reported
// with, receives a one-time code, and gets a session that only lists their own reports.

const development = () => env.NODE_ENV === "development";

/** Whether codes can be delivered on this channel (in development they are printed instead). */
const channelAvailable = (channel: ContactChannel) =>
  development() || (channel === "email" ? isEmailConfigured() : isSmsConfigured());

// @desc    Which ways of reaching passengers are switched on, so the site only offers those
//          (e.g. no phone number field when no SMS gateway is set up)
// @route   GET /api/passenger/channels
// @access  Public
export const channels = (_req: Request, res: Response) => {
  res.json({
    email: channelAvailable("email"),
    sms: channelAvailable("phone"),
    push: isPushConfigured(),
    telegram: isTelegramConfigured(),
  });
};

const masked = ({ channel, destination }: PassengerContact) =>
  channel === "email" ? maskEmail(destination) : maskPhone(destination);

const deliverCode = async (contact: PassengerContact, code: string, input: RequestCodeInput) => {
  const minutes = PASSENGER_CODE.ttlMinutes;
  if (contact.channel === "phone") {
    await sendSms(contact.destination, messagesFor(input.language).sms.code(code, minutes));
    return;
  }
  const sent = await sendSignInCodeEmail({
    toEmail: contact.destination,
    code,
    minutes,
    language: input.language,
  });
  if (!sent && development())
    console.info(`[email disabled] code for ${contact.destination}: ${code}`);
};

// @desc    Send a one-time sign-in code to an email or phone that has reports
// @route   POST /api/passenger/code
// @access  Public
export const requestCode = async (
  req: Request<object, object, RequestCodeInput>,
  res: Response,
) => {
  const { contact } = req.body;
  if (!channelAvailable(contact.channel)) {
    res.status(503).json({
      msg:
        contact.channel === "phone"
          ? "Codes by SMS are not available yet. Please use your email address."
          : "Codes by email are not available yet. Please use your mobile number.",
      code: "channel_unavailable",
    });
    return;
  }

  // The answer is the same whether or not this contact has reports, so the form can't be used
  // to find out who reported. Codes (and SMS costs) are only spent on real passengers.
  if (await hasReportsForContact(contact)) {
    const code = await issueSignInCode(contact);
    if (code) {
      try {
        await deliverCode(contact, code, req.body);
      } catch (error) {
        console.error(
          "Failed to send sign-in code:",
          error instanceof Error ? error.message : error,
        );
        res.status(502).json({ msg: "We couldn't send the code. Please try again in a minute." });
        return;
      }
    }
  }
  void deleteExpiredCodes().catch(() => undefined);
  res.json({ channel: contact.channel, sentTo: masked(contact) });
};

// @desc    Exchange a one-time code for a "My reports" session
// @route   POST /api/passenger/session
// @access  Public
export const verifyCode = async (req: Request<object, object, VerifyCodeInput>, res: Response) => {
  const { contact, code } = req.body;
  if (!(await verifySignInCode(contact.destination, code))) {
    res.status(400).json({
      msg: "That code is wrong or has expired. Check it, or ask for a new one.",
      code: "invalid_code",
    });
    return;
  }
  await countEvent("my_reports_signin");
  res.json({
    token: signPassengerToken(contact),
    contact: { channel: contact.channel, display: masked(contact) },
  });
};

// @desc    The signed-in passenger's reports
// @route   GET /api/passenger/reports
// @access  Passenger session
export const myReports = async (req: Request, res: Response) => {
  const contact = req.passenger;
  if (!contact) {
    res.status(401).json({ msg: "Please sign in again." });
    return;
  }
  res.json({
    contact: { channel: contact.channel, display: masked(contact) },
    reports: await listReportsForContact(contact),
  });
};
