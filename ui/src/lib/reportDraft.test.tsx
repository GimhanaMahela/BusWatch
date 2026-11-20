import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft } from "@/lib/offlineStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import CommendView from "@/views/public/CommendView";
import SubmitReportView from "@/views/public/SubmitReportView";
import { COMMEND_DRAFT_KEY, putDraftIntoForm, REPORT_DRAFT_KEY } from "./reportDraft";

// The helper chat hands drafts to the real forms: check each form picks them up
describe("putDraftIntoForm", () => {
  beforeEach(async () => {
    await clearDraft(REPORT_DRAFT_KEY);
    await clearDraft(COMMEND_DRAFT_KEY);
  });

  it("fills in the report form", async () => {
    const path = await putDraftIntoForm({
      type: "complaint",
      category: "overcharging",
      busNumber: "NB-1234",
      routeNumber: "138",
      location: "Maharagama",
      incidentAt: "",
      description: "The conductor charged me 200 rupees for a 120 rupee fare.",
    });
    expect(path).toBe("/submit-report");

    renderWithProviders(<SubmitReportView />);
    expect(await screen.findByDisplayValue("NB-1234")).toBeInTheDocument();
    expect(screen.getByDisplayValue("138")).toBeInTheDocument();
  });

  it("fills in the commend form", async () => {
    const path = await putDraftIntoForm({
      type: "commendation",
      category: "helpful_staff",
      busNumber: "NC-5678",
      routeNumber: "",
      location: "",
      incidentAt: "",
      description: "The conductor helped my grandmother with her bags.",
    });
    expect(path).toBe("/commend");

    renderWithProviders(<CommendView />);
    expect(await screen.findByDisplayValue("NC-5678")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("The conductor helped my grandmother with her bags."),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Kind, polite and helpful" })).toBeChecked();
  });
});
