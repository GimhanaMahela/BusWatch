import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/apiClient";
import { confirmReport } from "@/api/reportApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { SimilarReport } from "@/types/report";
import MeTooDialog from "./MeTooDialog";

vi.mock("@/api/reportApi", () => ({ confirmReport: vi.fn() }));
const mockedConfirm = vi.mocked(confirmReport);

const match: SimilarReport = {
  id: "11111111-1111-4111-8111-111111111111",
  routeNumber: "08",
  partOfDay: "morning",
  confirmations: 2,
};

const renderDialog = (matches: SimilarReport[] = [match]) => {
  const onConfirmed = vi.fn();
  const onDecline = vi.fn();
  renderWithProviders(
    <MeTooDialog
      matches={matches}
      busNumber="NE-9999"
      categoryLabel="Reckless driving"
      description="He was racing another bus"
      language="en"
      source="qr"
      onConfirmed={onConfirmed}
      onDecline={onDecline}
    />,
  );
  return { onConfirmed, onDecline };
};

describe("MeTooDialog", () => {
  beforeEach(() => vi.resetAllMocks());

  it("describes the match and sends the passenger's description as a comment", async () => {
    mockedConfirm.mockResolvedValue({ confirmations: 3 });
    const { onConfirmed } = renderDialog();

    expect(screen.getByText(/A passenger has already reported bus NE-9999/)).toBeInTheDocument();
    expect(
      screen.getByText("Route 08 · in the morning · confirmed by 2 others"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/What did you see/)).toHaveValue("He was racing another bus");

    fireEvent.click(screen.getByRole("button", { name: "Yes, add my confirmation" }));
    await vi.waitFor(() => expect(onConfirmed).toHaveBeenCalled());
    expect(mockedConfirm).toHaveBeenCalledWith(match.id, {
      comment: "He was racing another bus",
      language: "en",
      source: "qr",
      website: undefined,
    });
  });

  it("lets the passenger pick between several matches", async () => {
    mockedConfirm.mockResolvedValue({ confirmations: 1 });
    const second = { ...match, id: "22222222-2222-4222-8222-222222222222", partOfDay: null };
    renderDialog([match, second]);

    fireEvent.click(screen.getByRole("radio", { name: /Report 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, add my confirmation" }));
    await vi.waitFor(() => expect(mockedConfirm).toHaveBeenCalled());
    expect(mockedConfirm.mock.calls[0]?.[0]).toBe(second.id);
  });

  it("treats an earlier confirmation from this device as done, and shows other errors", async () => {
    mockedConfirm.mockRejectedValueOnce(
      new ApiError("You have already confirmed this report.", 409, undefined, "already_confirmed"),
    );
    const { onConfirmed } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Yes, add my confirmation" }));
    await vi.waitFor(() => expect(onConfirmed).toHaveBeenCalled());

    mockedConfirm.mockRejectedValueOnce(new ApiError("Server error", 500));
    fireEvent.click(screen.getByRole("button", { name: "Yes, add my confirmation" }));
    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });

  it("carries on with a full report when the passenger declines", () => {
    const { onDecline } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "No, mine is different" }));
    expect(onDecline).toHaveBeenCalled();
    expect(mockedConfirm).not.toHaveBeenCalled();
  });
});
