import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/apiClient";
import { getAssistantStatus, sendChat } from "@/api/assistantApi";
import { loadDraft, saveDraft } from "@/lib/offlineStore";
import { REPORT_DRAFT_KEY } from "@/lib/reportDraft";
import { mockRouter, renderWithProviders } from "@/test/renderWithProviders";
import type { ReportDraft } from "@/types/assistant";
import ChatHelper from "./ChatHelper";

vi.mock("@/api/assistantApi", () => ({ getAssistantStatus: vi.fn(), sendChat: vi.fn() }));
const mockedStatus = vi.mocked(getAssistantStatus);
const mockedSend = vi.mocked(sendChat);

const draft: ReportDraft = {
  type: "complaint",
  category: "reckless_driving",
  busNumber: "NB-1234",
  routeNumber: "138",
  location: "Nugegoda",
  incidentAt: "2026-01-05T08:30",
  description: "The driver was racing another bus.",
};

const openChat = async () => {
  renderWithProviders(<ChatHelper />);
  await userEvent.click(await screen.findByRole("button", { name: /Chat with the BusWatch/ }));
};

describe("ChatHelper", () => {
  beforeAll(() => {
    // jsdom doesn't lay pages out, so it has no scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mockedStatus.mockResolvedValue({ enabled: true });
  });

  it("stays hidden when the helper is switched off", async () => {
    mockedStatus.mockResolvedValue({ enabled: false });
    const { container } = renderWithProviders(<ChatHelper />);
    await vi.waitFor(() => expect(mockedStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("answers a quick question with a link to the right page", async () => {
    mockedSend.mockResolvedValue({
      reply: "Enter your receipt ID on the Track page.",
      link: "track",
      draft: null,
    });
    await openChat();
    expect(screen.getByText(/In an emergency, call 119/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "How do I check my report?" }));
    expect(await screen.findByText("Enter your receipt ID on the Track page.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track a report" })).toHaveAttribute("href", "/track");
    expect(mockedSend).toHaveBeenCalledWith(
      [{ role: "user", text: "How do I check my report?" }],
      "en",
    );
  });

  it("puts the draft into the report form, keeping photos already added there", async () => {
    const photo = new File(["x"], "bus.jpg", { type: "image/jpeg" });
    await saveDraft(REPORT_DRAFT_KEY, {
      form: { passengerEmail: "me@example.com", description: "old" },
      images: [photo],
      videos: [],
      coords: null,
      step: 2,
      source: "web",
    });
    mockedSend.mockResolvedValue({ reply: "Press Open the form.", link: "submit_report", draft });
    await openChat();

    const input = screen.getByRole("textbox", { name: "Type your message…" });
    await userEvent.type(input, "A bus was racing on route 138{Enter}");
    expect(await screen.findByText("Your report so far")).toBeInTheDocument();
    expect(screen.getByText("NB-1234")).toBeInTheDocument();
    // Shift+Enter is a new line, not a send
    expect(mockedSend).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Open the form" }));
    await vi.waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/submit-report"));
    const saved = await loadDraft<{
      form: Record<string, string>;
      images: File[];
      step: number;
    }>(REPORT_DRAFT_KEY);
    expect(saved?.data.form).toMatchObject({
      busNumber: "NB-1234",
      category: "reckless_driving",
      description: "The driver was racing another bus.",
      passengerEmail: "me@example.com",
      passengerPhone: "",
    });
    expect(saved?.data.images).toHaveLength(1);
    expect(saved?.data.step).toBe(0);
  });

  it("gives the message back when the helper can't answer", async () => {
    mockedSend.mockRejectedValue(new ApiError("The helper is busy right now.", 503));
    await openChat();
    const input = screen.getByRole("textbox", { name: "Type your message…" });
    fireEvent.change(input, { target: { value: "Hello" } });
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("The helper is busy right now.")).toBeInTheDocument();
    expect(input).toHaveValue("Hello");
  });
});
