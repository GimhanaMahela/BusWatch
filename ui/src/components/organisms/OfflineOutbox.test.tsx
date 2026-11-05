import { File as NodeFile } from "node:buffer";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/apiClient";
import { submitReport } from "@/api/reportApi";
import { enqueueReport, listQueuedReports } from "@/lib/offlineStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import OfflineOutbox from "./OfflineOutbox";

vi.mock("@/api/reportApi", () => ({ submitReport: vi.fn() }));
const mockedSubmit = vi.mocked(submitReport);

const queue = (busNumber: string) =>
  enqueueReport({
    fields: {
      busNumber,
      routeNumber: "08",
      category: "overcharging",
      location: "Pettah",
      description: "Overcharged",
    },
    images: [new NodeFile(["jpeg"], "fare.jpg", { type: "image/jpeg" }) as unknown as File],
    videos: [],
  });

describe("OfflineOutbox", () => {
  afterEach(() => {
    mockedSubmit.mockReset();
    vi.restoreAllMocks();
  });

  it("sends reports saved offline and shows their receipt IDs", async () => {
    await queue("NB-1234");
    mockedSubmit.mockResolvedValue({ receiptId: "BW-2026-LATER1" } as never);
    renderWithProviders(<OfflineOutbox />);

    expect(
      await screen.findByText("Your saved report was sent. Receipt ID: BW-2026-LATER1"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track" })).toHaveAttribute(
      "href",
      "/track/BW-2026-LATER1",
    );
    expect(mockedSubmit.mock.calls[0]?.[0]).toMatchObject({ busNumber: "NB-1234" });
    expect(mockedSubmit.mock.calls[0]?.[1]).toHaveLength(1);
    expect(await listQueuedReports()).toEqual([]);
  });

  it("keeps reports while the server can't be reached and drops ones it rejects", async () => {
    await queue("NB-0001");
    mockedSubmit.mockRejectedValueOnce(new ApiError("Could not reach the server."));
    const { unmount } = renderWithProviders(<OfflineOutbox />);
    await waitFor(() => expect(mockedSubmit).toHaveBeenCalledTimes(1));
    expect(await listQueuedReports()).toHaveLength(1);
    unmount();

    mockedSubmit.mockRejectedValueOnce(new ApiError("Invalid incident category.", 400));
    renderWithProviders(<OfflineOutbox />);
    expect(
      await screen.findByText("A saved report could not be sent: Invalid incident category."),
    ).toBeInTheDocument();
    expect(await listQueuedReports()).toEqual([]);
  });

  it("waits while offline", async () => {
    await queue("NB-0002");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    renderWithProviders(<OfflineOutbox />);
    expect(
      await screen.findByText("1 report is waiting to be sent when you're back online."),
    ).toBeInTheDocument();
    expect(mockedSubmit).not.toHaveBeenCalled();
    // Clean up for the next test file run
    vi.restoreAllMocks();
    mockedSubmit.mockResolvedValue({ receiptId: "BW-2026-CLEAN1" } as never);
    window.dispatchEvent(new Event("online"));
    await waitFor(async () => expect(await listQueuedReports()).toEqual([]));
  });
});
