import { ApiError } from "@/api/client";

import { isPermanentFailure, sendQueued } from "./outboxSend";
import type { QueuedReport } from "./outboxStore";
import { emptyDraft } from "./reportDraft";

const report: QueuedReport = {
  id: 1,
  createdAt: "2026-11-20T08:00:00.000Z",
  language: "si",
  draft: { ...emptyDraft(), busNumber: "NB-1234", routeNumber: "08", description: "x" },
};

describe("isPermanentFailure", () => {
  it("drops reports the server rejects as invalid", () => {
    expect(isPermanentFailure(new ApiError("Bus Number is required.", 400))).toBe(true);
  });

  it("keeps reports that may go through later", () => {
    expect(isPermanentFailure(new ApiError("offline"))).toBe(false);
    expect(isPermanentFailure(new ApiError("busy", 503))).toBe(false);
    expect(isPermanentFailure(new ApiError("slow down", 429))).toBe(false);
    expect(isPermanentFailure(new ApiError("timeout", 408))).toBe(false);
    expect(isPermanentFailure(new ApiError("check", 400, "captcha_required"))).toBe(false);
    expect(isPermanentFailure(new ApiError("check", 400, "captcha_failed"))).toBe(false);
  });
});

describe("sendQueued", () => {
  it("returns the receipt ID once sent", async () => {
    const submit = jest.fn().mockResolvedValue({ receiptId: "BW-2026-ABC123" });
    await expect(sendQueued(report, "token", submit)).resolves.toEqual({
      kind: "sent",
      receiptId: "BW-2026-ABC123",
    });
    const form = submit.mock.calls[0][0] as FormData;
    expect(form).toBeInstanceOf(FormData);
  });

  it("keeps the report when the connection drops again", async () => {
    const submit = jest.fn().mockRejectedValue(new ApiError("Could not reach the server."));
    await expect(sendQueued(report, null, submit)).resolves.toEqual({ kind: "kept" });
  });

  it("drops it with the server's reason when it can never be accepted", async () => {
    const submit = jest.fn().mockRejectedValue(new ApiError("Location is required.", 400));
    await expect(sendQueued(report, null, submit)).resolves.toEqual({
      kind: "dropped",
      message: "Location is required.",
    });
  });
});
