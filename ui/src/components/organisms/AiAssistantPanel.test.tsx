import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAiStatus, setReportCategory } from "@/api/reportApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { Report } from "@/types/report";
import AiAssistantPanel from "./AiAssistantPanel";

vi.mock("@/api/reportApi", () => ({
  getAiStatus: vi.fn(),
  analyseReportWithAi: vi.fn(),
  blurReportPhotos: vi.fn(),
  setReportCategory: vi.fn(),
}));
const mockedStatus = vi.mocked(getAiStatus);
const mockedSetCategory = vi.mocked(setReportCategory);

const report: Report = {
  id: "11111111-1111-4111-8111-111111111111",
  receiptId: "BW-2026-ABCDEF",
  type: "complaint",
  busNumber: "NE-9999",
  routeNumber: "08",
  category: "other",
  location: "Ambepussa",
  description: "ඩ්‍රයිවර් රේස් කළා",
  images: ["https://res.cloudinary.com/demo/image/upload/v1/a.jpg"],
  videos: [],
  reportedAt: "2026-11-05T08:00:00.000Z",
  language: "si",
  source: "web",
  status: "pending",
  aiInsights: {
    detectedLanguage: "si",
    englishTranslation: "The driver was racing.",
    summary: null,
    suggestedCategory: "reckless_driving",
    categoryConfidence: "high",
    categoryReason: "Racing is reckless driving.",
    flags: ["possible_emergency"],
    model: "gemini-flash-latest",
    generatedAt: "2026-11-05T08:01:00.000Z",
  },
  blurredImages: null,
};

describe("AiAssistantPanel", () => {
  beforeEach(() => vi.resetAllMocks());

  it("stays hidden when AI help isn't set up", async () => {
    mockedStatus.mockResolvedValue({ enabled: false });
    const { container } = renderWithProviders(<AiAssistantPanel report={report} />);
    await vi.waitFor(() => expect(mockedStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the suggestion, translation and flags, and applies the category", async () => {
    mockedStatus.mockResolvedValue({ enabled: true });
    mockedSetCategory.mockResolvedValue({ ...report, category: "reckless_driving" });
    renderWithProviders(<AiAssistantPanel report={report} />);

    expect(await screen.findByText("The driver was racing.")).toBeInTheDocument();
    expect(screen.getByText("Possible emergency")).toBeInTheDocument();
    expect(screen.getByText(/English translation \(from Sinhala\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Blur faces and plates/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Use this category" }));
    await vi.waitFor(() =>
      expect(mockedSetCategory).toHaveBeenCalledWith(report.id, "reckless_driving"),
    );
  });
});
