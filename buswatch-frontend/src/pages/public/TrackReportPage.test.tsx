import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { trackReport } from "../../api/reportApi";
import { renderWithProviders } from "../../test/renderWithProviders";
import type { PublicReport } from "../../types/report";
import TrackReportPage from "./TrackReportPage";

vi.mock("../../api/reportApi", () => ({ trackReport: vi.fn() }));
const mockedTrackReport = vi.mocked(trackReport);

const report: PublicReport = {
  receiptId: "BW-2026-ABCDEF",
  status: "resolved",
  category: "overcharging",
  busNumber: "NE-4521",
  routeNumber: "08",
  location: "Pettah",
  reportedAt: "2026-10-01T08:00:00.000Z",
  timeline: [
    { status: "pending", note: "Report received.", changedAt: "2026-10-01T08:00:00.000Z" },
    { status: "resolved", note: "Driver warned.", changedAt: "2026-10-02T08:00:00.000Z" },
  ],
};

const renderAt = (path: string) =>
  renderWithProviders(<TrackReportPage />, { route: "/track/:receiptId?", path });

describe("TrackReportPage", () => {
  beforeEach(() => {
    mockedTrackReport.mockReset();
  });

  it("looks up the receipt ID from the URL and shows the timeline", async () => {
    mockedTrackReport.mockResolvedValue(report);
    renderAt("/track/BW-2026-ABCDEF");

    expect(await screen.findByText("Driver warned.")).toBeInTheDocument();
    expect(screen.getByText("Overcharging / wrong fare")).toBeInTheDocument();
    expect(screen.getByLabelText("Receipt ID")).toHaveValue("BW-2026-ABCDEF");
    expect(mockedTrackReport).toHaveBeenCalledWith("BW-2026-ABCDEF");
  });

  it("explains when no report matches", async () => {
    mockedTrackReport.mockRejectedValue(new ApiError("No report found", 404));
    renderAt("/track/BW-2026-NOPE00");

    expect(await screen.findByText(/couldn't find a report/i)).toBeInTheDocument();
  });

  it("navigates to the entered receipt ID", async () => {
    mockedTrackReport.mockResolvedValue(report);
    renderAt("/track");

    await userEvent.type(screen.getByLabelText("Receipt ID"), "BW-2026-ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "Track" }));

    expect(await screen.findByText("Driver warned.")).toBeInTheDocument();
  });
});
