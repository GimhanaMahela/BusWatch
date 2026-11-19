import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createStory } from "@/api/storyApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import StoryEditorDialog from "./StoryEditorDialog";

vi.mock("@/api/storyApi", () => ({ createStory: vi.fn(), updateStory: vi.fn() }));
const mockedCreate = vi.mocked(createStory);

describe("StoryEditorDialog", () => {
  it("warns about personal details and saves translations with the story", async () => {
    mockedCreate.mockResolvedValue({} as never);
    const onClose = vi.fn();
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <StoryEditorDialog
        open
        onClose={onClose}
        receiptId="BW-2026-ABC234"
        story={{
          reportId: "r1",
          routeNumber: "08",
          category: "overcharging",
          title: "",
          body: "",
          published: false,
        }}
      />,
    );

    expect(screen.getByText(/Based on report/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Title/), "Route 08: refunds issued");
    await user.type(screen.getByLabelText(/What happened/), "Call 077 123 4567 for details");
    expect(screen.getByText(/seems to contain a phone number/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/What happened/));
    await user.type(screen.getByLabelText(/What happened/), "The operator refunded passengers.");
    expect(screen.queryByText(/seems to contain/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "සිංහල" }));
    await user.type(screen.getByLabelText(/^Title/), "මාර්ග 08");
    expect(screen.getByText(/Sinhala version needs both/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/What happened/), "මුදල් ආපසු ගෙවීය.");

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockedCreate).toHaveBeenCalledWith({
      title: "Route 08: refunds issued",
      body: "The operator refunded passengers.",
      translations: {
        si: { title: "මාර්ග 08", body: "මුදල් ආපසු ගෙවීය." },
        ta: { title: "", body: "" },
      },
      category: "overcharging",
      routeNumber: "08",
      reportId: "r1",
      published: true,
    });
  });
});
