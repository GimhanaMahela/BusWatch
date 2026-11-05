import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markMessagesReadByAdmin, sendAdminMessage } from "@/api/reportApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { Report } from "@/types/report";
import AdminMessagesPanel, { describeDelivery } from "./AdminMessagesPanel";

vi.mock("@/api/reportApi", () => ({
  sendAdminMessage: vi.fn(),
  markMessagesReadByAdmin: vi.fn(() => Promise.resolve({ msg: "ok" })),
}));
const mockedSend = vi.mocked(sendAdminMessage);
const mockedMarkRead = vi.mocked(markMessagesReadByAdmin);

const report = {
  id: "r1",
  receiptId: "BW-2026-ABCDEF",
  messages: [
    {
      id: "m1",
      sender: "passenger",
      body: "I have a video too",
      createdAt: "2026-10-02T08:00:00.000Z",
      readAt: null,
    },
  ],
} as unknown as Report;

describe("AdminMessagesPanel", () => {
  beforeEach(() => {
    mockedSend.mockReset();
    mockedMarkRead.mockClear();
  });

  it("describes which channels reached the passenger", () => {
    expect(describeDelivery({ email: true, sms: true, push: 2 })).toBe(
      "Saved. The passenger was notified by email, SMS and browser notification (2 devices).",
    );
    expect(describeDelivery({ email: false, sms: true, push: 0 })).toBe(
      "Saved. The passenger was notified by SMS.",
    );
    expect(describeDelivery({ email: false, sms: false, push: 0 })).toMatch(/no email, phone/);
  });

  it("marks passenger messages read and sends a question", async () => {
    const user = userEvent.setup({ delay: null });
    mockedSend.mockResolvedValue({ ...report, delivery: { email: true, sms: false, push: 0 } });
    renderWithProviders(<AdminMessagesPanel report={report} />);

    expect(screen.getByText("I have a video too")).toBeInTheDocument();
    await vi.waitFor(() => expect(mockedMarkRead).toHaveBeenCalledWith("r1"));

    await user.type(screen.getByLabelText("Message to the passenger"), "Please reply with it");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(mockedSend).toHaveBeenCalledWith("r1", "Please reply with it", true);
    expect(
      await screen.findByText("Saved. The passenger was notified by email."),
    ).toBeInTheDocument();
  });
});
