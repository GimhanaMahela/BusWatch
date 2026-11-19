import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitReport } from "@/api/reportApi";
import { clearDraft } from "@/lib/offlineStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import LostItemView from "./LostItemView";

vi.mock("@/api/reportApi", () => ({ submitReport: vi.fn() }));
vi.mock("@/api/passengerApi", () => ({
  getContactChannels: () => Promise.resolve({ sms: true }),
}));
const mockedSubmit = vi.mocked(submitReport);

describe("LostItemView", () => {
  beforeEach(async () => {
    mockedSubmit.mockReset();
    await clearDraft("lost-something");
  });

  it("needs a way to reach the passenger, then files a lost item", async () => {
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-LOST01",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<LostItemView />);

    await user.type(screen.getByLabelText(/Bus Number/i), "nb-1234");
    await user.type(screen.getByLabelText(/^Route/i), "138");
    await user.click(screen.getByRole("radio", { name: "Bag" }));
    await user.type(screen.getByLabelText(/Describe it/), "Black backpack, back seat");

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/Give an email address or mobile number/)).toBeInTheDocument();
    expect(mockedSubmit).not.toHaveBeenCalled();

    await user.type(await screen.findByLabelText(/Mobile number/i), "0771234567");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("We're on it")).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "lost_item",
        category: "bag",
        busNumber: "nb-1234",
        passengerPhone: "0771234567",
      }),
      [],
      [],
    );
  });
});
