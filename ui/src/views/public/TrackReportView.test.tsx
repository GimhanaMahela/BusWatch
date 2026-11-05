import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/apiClient";
import { rateOutcome, trackReport } from "@/api/reportApi";
import { mockRouter, renderWithProviders } from "@/test/renderWithProviders";
import type { PublicReport } from "@/types/report";
import TrackReportView from "./TrackReportView";

vi.mock("@/api/reportApi", () => ({ trackReport: vi.fn(), rateOutcome: vi.fn() }));
const mockedTrackReport = vi.mocked(trackReport);
const mockedRateOutcome = vi.mocked(rateOutcome);

const report: PublicReport = {
  receiptId: "BW-2026-ABCDEF",
  type: "complaint",
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
  canRate: true,
  rating: null,
  feedback: null,
  ratedAt: null,
};

describe("TrackReportView", () => {
  beforeEach(() => {
    mockedTrackReport.mockReset();
    mockedRateOutcome.mockReset();
    mockRouter.push.mockReset();
  });

  it("looks up the receipt ID from the URL and shows the timeline", async () => {
    mockedTrackReport.mockResolvedValue(report);
    renderWithProviders(<TrackReportView receiptId="BW-2026-ABCDEF" />);

    expect(await screen.findByText("Driver warned.")).toBeInTheDocument();
    expect(screen.getByText("Overcharging / wrong fare")).toBeInTheDocument();
    expect(screen.getByLabelText("Receipt ID")).toHaveValue("BW-2026-ABCDEF");
    expect(mockedTrackReport).toHaveBeenCalledWith("BW-2026-ABCDEF");
  });

  it("explains when no report matches", async () => {
    mockedTrackReport.mockRejectedValue(new ApiError("No report found", 404));
    renderWithProviders(<TrackReportView receiptId="BW-2026-NOPE00" />);

    expect(await screen.findByText(/couldn't find a report/i)).toBeInTheDocument();
  });

  it("navigates to the entered receipt ID", async () => {
    renderWithProviders(<TrackReportView />);

    await userEvent.type(screen.getByLabelText("Receipt ID"), "BW-2026-ABCDEF");
    await userEvent.click(screen.getByRole("button", { name: "Track" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/track/BW-2026-ABCDEF");
    expect(mockedTrackReport).not.toHaveBeenCalled();
  });

  it("asks for a rating once the report is closed and shows it afterwards", async () => {
    mockedTrackReport.mockResolvedValue(report);
    mockedRateOutcome.mockResolvedValue({
      ...report,
      rating: 4,
      feedback: "Quick action",
      ratedAt: "2026-10-03T08:00:00.000Z",
    });
    const user = userEvent.setup();
    renderWithProviders(<TrackReportView receiptId="BW-2026-ABCDEF" />);

    expect(await screen.findByText("How did we do?")).toBeInTheDocument();
    const send = screen.getByRole("button", { name: "Send rating" });
    expect(send).toBeDisabled();

    // MUI hides the radio inputs and works out the star from the pointer position, which jsdom
    // can't lay out; choosing the radio directly is what a keyboard or screen reader user does
    fireEvent.click(screen.getByRole("radio", { name: /^4\/5/ }));
    expect(screen.getByText("Happy")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Anything you'd like to add/), "Quick action");
    await user.click(send);

    expect(await screen.findByText("Thanks for your feedback!")).toBeInTheDocument();
    expect(screen.getByText("Quick action")).toBeInTheDocument();
    expect(mockedRateOutcome).toHaveBeenCalledWith("BW-2026-ABCDEF", 4, "Quick action");
  });

  it("does not ask for a rating while the report is open", async () => {
    mockedTrackReport.mockResolvedValue({ ...report, status: "reviewed", canRate: false });
    renderWithProviders(<TrackReportView receiptId="BW-2026-ABCDEF" />);
    expect(await screen.findByText("Our team has reviewed your report.")).toBeInTheDocument();
    expect(screen.queryByText("How did we do?")).not.toBeInTheDocument();
  });

  it("shows commendations with their own wording, in the passenger's language", async () => {
    mockedTrackReport.mockResolvedValue({
      ...report,
      type: "commendation",
      category: "helpful_staff",
      status: "escalated",
      location: null,
      canRate: false,
      timeline: [
        { status: "pending", note: "Commendation received.", changedAt: "2026-10-01T08:00:00Z" },
      ],
    });
    renderWithProviders(<TrackReportView receiptId="BW-2026-ABCDEF" />, { locale: "si" });

    expect(
      await screen.findByText("ඔබේ කාරුණික වචන බස් හිමිකරු වෙත යොමු කර ඇත."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("ප්‍රශංසාව ලැබුණා.")).toHaveLength(1);
    expect(screen.getByText("කාරුණික, උදව්කාරී කාර්ය මණ්ඩලය")).toBeInTheDocument();
    expect(screen.queryByText("ස්ථානය")).not.toBeInTheDocument();
  });
});
