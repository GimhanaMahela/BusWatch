import { screen, waitFor, within } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "Commend good service" })).toHaveAttribute(
      "href",
      "/commend?bus=NB-1234&route=08&src=qr",
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
    await user.click(screen.getByRole("radio", { name: "පුද්ගලික බස් රථය" }));
    await user.type(screen.getByRole("textbox", { name: /මාර්ගය/ }), "08");
    await user.click(screen.getByRole("checkbox", { name: "අධික ගාස්තු / වැරදි ගාස්තු" }));
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
        busService: "private",
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

    await user.click(screen.getByRole("radio", { name: "SLTB bus (government)" }));
    await user.click(screen.getByRole("checkbox", { name: /Accessibility/ }));
    // More than one thing can be ticked; the first stays the main category
    await user.click(screen.getByRole("checkbox", { name: "Loud music" }));
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
        extraCategories: "loud_music",
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

    await user.click(screen.getByRole("radio", { name: "Metro Bus" }));
    await user.click(screen.getByRole("checkbox", { name: /Reckless/ }));
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
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "A bus" })).toHaveAttribute("aria-checked", "false"),
    );
    expect(screen.queryByLabelText(/Bus number/)).not.toBeInTheDocument();
  });

  it("first asks whether it was a bus, another vehicle or the road, then the kind of bus", async () => {
    mockSearchParams.current = new URLSearchParams();
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />);

    expect(screen.queryByLabelText(/Bus number/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Choose what was involved.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "A bus" }));
    await user.type(screen.getByLabelText(/Bus number/), "NB-1234");
    await user.type(screen.getByLabelText(/Route/), "138");
    await user.click(screen.getByRole("checkbox", { name: /Overcrowding/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Choose the bus service.")).toBeInTheDocument();
    // Bus name is only asked for private buses
    expect(screen.queryByLabelText(/Bus name/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Private bus" }));
    expect(screen.getByLabelText(/Bus name/)).toBeInTheDocument();
  });

  it("files a road incident about another vehicle, with the accident and the call buttons", async () => {
    mockSearchParams.current = new URLSearchParams();
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-ROAD01",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />);

    await user.click(screen.getByRole("radio", { name: "Another vehicle" }));
    expect(screen.queryByLabelText(/Bus number/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Accident" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Choose the kind of vehicle.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Van" }));
    await user.type(screen.getByLabelText(/Number plate/), "WP CAB-1234");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.type(screen.getByLabelText(/Where/), "Kandy Road, Kadawatha");
    await user.type(screen.getByLabelText(/Describe what happened/), "Van hit a motorcycle");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Say whether you were in it or saw it.")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "I saw it happen" }));
    expect(document.querySelector('a[href="tel:1990"]')).toBeNull();
    await user.click(screen.getByRole("combobox", { name: /Was anyone hurt/ }));
    await user.click(within(screen.getByRole("listbox")).getByText("Serious injuries"));
    expect(document.querySelector('a[href="tel:1990"]')).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(await screen.findByText("BW-2026-ROAD01")).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "road_incident",
        busNumber: "",
        routeNumber: "",
        category: "accident",
        details: JSON.stringify({
          road: {
            vehicle: { kind: "van", plate: "WP CAB-1234", colour: "", make: "" },
            accident: { involvement: "witness", injuries: "serious", vehiclesInvolved: null },
          },
        }),
      }),
      [],
      [],
    );
    expect(mockedSubmit.mock.calls[0]?.[0]).not.toHaveProperty("busService");
  });

  it("files a problem with the road itself, without any vehicle", async () => {
    mockSearchParams.current = new URLSearchParams("subject=road");
    mockedSubmit.mockResolvedValue({
      msg: "ok",
      receiptId: "BW-2026-ROAD02",
      pdfUrl: null,
      emailSent: false,
      report: {} as never,
    });
    const user = userEvent.setup();
    renderWithProviders(<SubmitReportView />);

    expect(screen.getByRole("radio", { name: "The road itself" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Choose what's wrong with the road.")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Pothole / broken road" }));
    await user.click(screen.getByRole("checkbox", { name: "Flooding" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText(/Where/), "Galle Road, Wellawatte");
    await user.type(screen.getByLabelText(/Describe what happened/), "Deep pothole, left lane");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(await screen.findByText("BW-2026-ROAD02")).toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "road_incident",
        category: "road_hazard",
        details: JSON.stringify({ road: { hazard: "pothole", extraHazards: ["flooding"] } }),
      }),
      [],
      [],
    );
  });
});
