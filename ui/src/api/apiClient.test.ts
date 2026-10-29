import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { errorMessage, toApiError } from "./apiClient";

const axiosError = (status?: number, data?: unknown) =>
  new AxiosError(
    "failed",
    undefined,
    undefined,
    undefined,
    status === undefined
      ? undefined
      : { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } },
  );

describe("toApiError", () => {
  it("uses the backend's message (or msg) and keeps the status", () => {
    expect(toApiError(axiosError(400, { message: "Invalid email address." }))).toMatchObject({
      message: "Invalid email address.",
      status: 400,
    });
    expect(toApiError(axiosError(404, { msg: "Report not found" })).message).toBe(
      "Report not found",
    );
  });

  it("explains network failures and server errors without a JSON body", () => {
    expect(toApiError(axiosError()).message).toMatch(/could not reach the server/i);
    expect(toApiError(axiosError(502, "Bad gateway")).message).toMatch(/server error/i);
  });
});

describe("errorMessage", () => {
  it("falls back when there is no message", () => {
    expect(errorMessage(null, "Fallback")).toBe("Fallback");
    expect(errorMessage({ message: "" }, "Fallback")).toBe("Fallback");
  });
});
