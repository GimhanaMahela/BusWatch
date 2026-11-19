import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkEmergency } from "@/api/assistantApi";
import { submitReport } from "@/api/reportApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import SafetyView from "./SafetyView";

vi.mock("@/api/reportApi", () => ({ submitReport: vi.fn() }));
vi.mock("@/api/assistantApi", () => ({ checkEmergency: vi.fn() }));
vi.mock("@/api/passengerApi", () => ({
  getContactChannels: () => Promise.resolve({ sms: false }),
}));
const mockedSubmit = vi.mocked(submitReport);

describe("SafetyView", () => {
  beforeEach(() => {
    mockedSubmit.mockReset();
    vi.mocked(checkEmergency).mockResolvedValue({ checked: false, emergency: false, kind: null });
  });

  it("always shows the emergency numbers and a quick exit", () => {
    renderWithProviders(<SafetyView />);
    expect(screen.getByRole("link", { name: /Police 119/ })).toHaveAttribute("href", "tel:119");
    expect(screen.getByRole("link", { name: /Ambulance 1990/ })).toHaveAttribute(
      "href",
      "tel:1990",
    );
    expect(screen.getByRole("link", { name: /Women's helpline 1938/ })).toHaveAttribute(
      "href",
      "tel:1938",
    );
    expect(screen.getByRole("button", { name: "Quick exit" })).toBeInTheDocument();
  });

  it("files a quick harassment report with only the bus and what happened", async () => {
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-SAFE01",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<SafetyView />);

    await user.type(screen.getByLabelText(/Bus Number/i), "ne-9999");
    await user.type(screen.getByLabelText(/^Route/i), "08");
    await user.click(screen.getByRole("checkbox", { name: "Unwanted touching" }));
    await user.click(screen.getByRole("button", { name: "Send quietly" }));

    expect(await screen.findByText(/BW-2026-SAFE01/)).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "complaint",
        category: "harassment",
        description: "",
        details: JSON.stringify({ safety: { kinds: ["touching"] } }),
      }),
      [],
      [],
    );
  });

  it("puts the call buttons first when the passenger describes an emergency", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SafetyView />);
    await user.type(screen.getByLabelText(/Anything else/), "he has a knife");
    expect(await screen.findByRole("alert")).toHaveTextContent("Is someone in danger right now?");
  });
});
