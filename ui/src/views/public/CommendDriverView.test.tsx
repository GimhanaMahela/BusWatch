import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitReport } from "@/api/reportApi";
import { clearDraft } from "@/lib/offlineStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import CommendDriverView from "./CommendDriverView";

vi.mock("@/api/reportApi", () => ({ submitReport: vi.fn() }));
const mockedSubmit = vi.mocked(submitReport);

describe("CommendDriverView", () => {
  beforeEach(async () => {
    mockedSubmit.mockReset();
    await clearDraft("commend-a-driver");
  });

  it("sends a commendation in one step, without a location", async () => {
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-GOOD22",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<CommendDriverView />, { locale: "ta" });

    await user.type(screen.getByLabelText(/பேருந்து எண்/), "nb-1234");
    await user.type(screen.getByLabelText(/^வழித்தடம்/), "08");

    // What was good is required
    await user.type(screen.getByLabelText(/அவர்கள் எதைச் சிறப்பாகச் செய்தார்கள்/), "Very kind");
    await user.click(screen.getByRole("button", { name: "பாராட்டை அனுப்பவும்" }));
    expect(screen.getByRole("alert")).toHaveTextContent("தனித்து நின்றதைத் தேர்ந்தெடுக்கவும்.");

    await user.click(screen.getByRole("radio", { name: "அன்பான, உதவிகரமான பணியாளர்கள்" }));
    await user.click(screen.getByRole("button", { name: "பாராட்டை அனுப்பவும்" }));

    expect(await screen.findByText("உங்கள் அன்பான வார்த்தைகளுக்கு நன்றி!")).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "commendation",
        category: "helpful_staff",
        location: "",
        language: "ta",
        source: "web",
      }),
      [],
      [],
    );
  });
});
