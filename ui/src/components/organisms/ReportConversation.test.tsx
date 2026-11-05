import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markMessagesReadByPassenger, sendPassengerMessage } from "@/api/reportApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { PublicReport } from "@/types/report";
import ReportConversation from "./ReportConversation";

vi.mock("@/api/reportApi", () => ({
  sendPassengerMessage: vi.fn(),
  markMessagesReadByPassenger: vi.fn(() => Promise.resolve({ msg: "ok" })),
}));
const mockedSend = vi.mocked(sendPassengerMessage);
const mockedMarkRead = vi.mocked(markMessagesReadByPassenger);

const report: PublicReport = {
  receiptId: "BW-2026-ABCDEF",
  type: "complaint",
  status: "reviewed",
  category: "overcharging",
  busNumber: "NE-4521",
  routeNumber: "08",
  location: "Pettah",
  reportedAt: "2026-10-01T08:00:00.000Z",
  timeline: [],
  canRate: false,
  rating: null,
  feedback: null,
  ratedAt: null,
  canReply: true,
  messages: [
    {
      id: "m1",
      sender: "admin",
      body: "Which seat were you in?",
      createdAt: "2026-10-02T08:00:00.000Z",
      read: false,
    },
  ],
};

describe("ReportConversation", () => {
  beforeEach(() => {
    mockedSend.mockReset();
    mockedMarkRead.mockClear();
  });

  it("shows the team's question as the BusWatch team and marks it read", async () => {
    renderWithProviders(<ReportConversation report={report} />);
    expect(screen.getByText("Which seat were you in?")).toBeInTheDocument();
    expect(screen.getByText(/^BusWatch team ·/)).toBeInTheDocument();
    await vi.waitFor(() => expect(mockedMarkRead).toHaveBeenCalledWith("BW-2026-ABCDEF"));
  });

  it("sends the passenger's reply", async () => {
    const user = userEvent.setup({ delay: null });
    mockedSend.mockResolvedValue({
      ...report,
      messages: [
        ...report.messages,
        {
          id: "m2",
          sender: "passenger",
          body: "Front seat",
          createdAt: "2026-10-02T09:00:00.000Z",
          read: false,
        },
      ],
    });
    renderWithProviders(<ReportConversation report={report} />);

    await user.type(screen.getByLabelText("Your message"), "Front seat");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedSend).toHaveBeenCalledWith("BW-2026-ABCDEF", "Front seat");
    expect(await screen.findByText("Sent. The team will reply here.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });

  it("explains when replies are closed, in the passenger's language", () => {
    renderWithProviders(
      <ReportConversation report={{ ...report, canReply: false, messages: [] }} />,
      { locale: "ta" },
    );
    expect(screen.getByText(/பதில்கள் நிறுத்தப்பட்டுள்ளன/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "அனுப்பு" })).not.toBeInTheDocument();
  });
});
