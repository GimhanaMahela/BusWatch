import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitReport } from "@/api/reportApi";
import { clearDraft, saveDraft } from "@/lib/offlineStore";
import { mockSearchParams, renderWithProviders } from "@/test/renderWithProviders";
import SubmitReportView from "./SubmitReportView";

vi.mock("@/api/reportApi", () => ({ submitReport: vi.fn(), findSimilarReports: vi.fn() }));
vi.mock("@/api/assistantApi", () => ({
  checkEmergency: () => Promise.resolve({ checked: false, emergency: false, kind: null }),
}));
const mockedSubmit = vi.mocked(submitReport);

describe("SubmitReportView", () => {
  beforeEach(async () => {
    mockedSubmit.mockReset();
    await clearDraft("submit-report");
  });

  it("fills in the bus from the QR sticker and offers to commend instead", async () => {
    mockSearchParams.current = new URLSearchParams("bus=nb-1234&route=08&src=qr");
    renderWithProviders(<SubmitReportView />);

    expect(screen.getByLabelText(/Bus number/)).toHaveValue("NB-1234");
    expect(screen.getByLabelText(/Route/)).toHaveValue("08");
    expect(screen.getByText(/You scanned the sticker in bus NB-1234/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Commend the driver" })).toHaveAttribute(
      "href",
      "/commend-a-driver?bus=NB-1234&route=08&src=qr",
    );
  });

  it("sends a report in Sinhala, marked as coming from a QR code", async () => {
    mockSearchParams.current = new URLSearchParams("bus=NB-1234&src=qr");
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-ABCDEF",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />, { locale: "si" });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("සිදුවීමක් වාර්තා කරන්න");
    await user.type(screen.getByLabelText(/මාර්ගය/), "08");
    await user.click(screen.getByRole("radio", { name: "අධික ගාස්තු / වැරදි ගාස්තු" }));
    await user.click(screen.getByRole("button", { name: "ඉදිරියට" }));

    await user.type(screen.getByLabelText(/කොහේද/), "Pettah");
    await user.type(screen.getByLabelText(/සිදු වූ දේ විස්තර කරන්න/), "Charged 150 instead of 100");
    await user.click(screen.getByRole("button", { name: "ඉදිරියට" }));
    await user.click(screen.getByRole("button", { name: "ඉදිරියට" }));
    await user.click(screen.getByRole("button", { name: "වාර්තාව යවන්න" }));

    expect(await screen.findByText("BW-2026-ABCDEF")).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "complaint",
        busNumber: "NB-1234",
        routeNumber: "08",
        category: "overcharging",
        location: "Pettah",
        language: "si",
        source: "qr",
      }),
      [],
      [],
    );
    expect(screen.getByRole("button", { name: "බෙදාගන්න" })).toBeInTheDocument();
  });

  it("asks what went wrong on an accessibility complaint and sends it along", async () => {
    mockSearchParams.current = new URLSearchParams("bus=NB-1234&route=08");
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-ACCESS",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />);

    await user.click(screen.getByRole("radio", { name: /Accessibility/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText(/Where/), "Kurunegala");
    await user.type(screen.getByLabelText(/Describe what happened/), "Drove past my grandmother");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Tick at least one.")).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: "Didn't stop for an elderly or disabled passenger" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(await screen.findByText("BW-2026-ACCESS")).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "accessibility",
        details: JSON.stringify({ accessibility: ["passed_by"] }),
      }),
      [],
      [],
    );
  });

  it("shows the emergency numbers as soon as the description sounds like one", async () => {
    mockSearchParams.current = new URLSearchParams("bus=NB-1234&route=08");
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />);

    await user.click(screen.getByRole("radio", { name: /Reckless/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByText("Is someone in danger right now?")).not.toBeInTheDocument();
    await user.type(
      screen.getByLabelText(/Describe what happened/),
      "The bus crashed, people are injured",
    );

    expect(screen.getByText("Is someone in danger right now?")).toBeInTheDocument();
    // The ambulance first for a crash
    const calls = screen.getAllByRole("link", { name: /119|1990|110/ });
    expect(calls[0]).toHaveAttribute("href", "tel:1990");
    await user.click(screen.getByRole("button", { name: "No one is in danger, hide this" }));
    expect(screen.queryByText("Is someone in danger right now?")).not.toBeInTheDocument();
  });

  it("restores an unfinished report and lets the passenger start over", async () => {
    await saveDraft("submit-report", {
      form: {
        busNumber: "NE-4521",
        routeNumber: "08",
        busName: "",
        category: "harassment",
        incidentAt: "",
        location: "Kandy",
        description: "Shouted at passengers",
        passengerEmail: "",
        website: "",
      },
      coords: null,
      images: [],
      videos: [],
      step: 1,
      source: "web",
    });
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />);

    expect(await screen.findByText(/We restored the report you didn't finish/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Describe what happened/)).toHaveValue("Shouted at passengers");

    await user.click(screen.getByRole("button", { name: "Start over" }));
    await waitFor(() => expect(screen.getByLabelText(/Bus number/)).toHaveValue(""));
  });
});
