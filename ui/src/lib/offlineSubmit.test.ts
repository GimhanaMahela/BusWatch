import { File as NodeFile } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/apiClient";
import { submitReport } from "@/api/reportApi";
import type { SubmitReportFields } from "@/types/report";
import { submitOrQueue } from "./offlineSubmit";
import {
  clearDraft,
  listQueuedReports,
  loadDraft,
  OUTBOX_EVENT,
  removeQueuedReport,
  saveDraft,
} from "./offlineStore";

vi.mock("@/api/reportApi", () => ({ submitReport: vi.fn() }));
const mockedSubmit = vi.mocked(submitReport);

const fields: SubmitReportFields = {
  type: "complaint",
  busNumber: "NB-1234",
  routeNumber: "08",
  category: "overcharging",
  location: "Pettah",
  description: "Charged 150 instead of 100",
  language: "si",
};
// fake-indexeddb clones with Node's structuredClone, which can't clone jsdom's File (browsers can).
// Node's own File stands in for a photo the passenger attached.
const photo = new NodeFile(["jpeg"], "fare.jpg", { type: "image/jpeg" }) as unknown as File;

const setOnline = (online: boolean) => vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);

describe("submitOrQueue", () => {
  beforeEach(async () => {
    mockedSubmit.mockReset();
    for (const report of await listQueuedReports()) await removeQueuedReport(report.id ?? -1);
  });
  afterEach(() => vi.restoreAllMocks());

  it("sends straight away when online", async () => {
    setOnline(true);
    mockedSubmit.mockResolvedValue({ receiptId: "BW-2026-ABCDEF" } as never);
    const outcome = await submitOrQueue(fields, [photo], []);
    expect(outcome).toEqual({ kind: "sent", response: { receiptId: "BW-2026-ABCDEF" } });
    expect(await listQueuedReports()).toEqual([]);
  });

  it("keeps the report, photos included, when the device is offline", async () => {
    setOnline(false);
    const changed = vi.fn();
    window.addEventListener(OUTBOX_EVENT, changed);

    expect(await submitOrQueue(fields, [photo], [])).toEqual({ kind: "queued" });
    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalled();

    const [queued] = await listQueuedReports();
    expect(queued?.fields).toEqual(fields);
    expect(queued?.images).toHaveLength(1);
    expect(queued?.images[0]?.name).toBe("fare.jpg");
    window.removeEventListener(OUTBOX_EVENT, changed);
  });

  it("queues when the signal drops mid-send", async () => {
    setOnline(true);
    mockedSubmit.mockRejectedValue(new ApiError("Could not reach the server."));
    expect(await submitOrQueue(fields, [], [])).toEqual({ kind: "queued" });
    expect(await listQueuedReports()).toHaveLength(1);
  });

  it("still reports validation errors instead of queueing them", async () => {
    setOnline(true);
    mockedSubmit.mockRejectedValue(new ApiError("Location is required.", 400));
    await expect(submitOrQueue(fields, [], [])).rejects.toThrow("Location is required.");
    expect(await listQueuedReports()).toEqual([]);
  });
});

describe("drafts", () => {
  it("saves, loads and clears a draft with its files", async () => {
    await saveDraft("test", { form: { busNumber: "NB-1234" }, images: [photo] });
    const draft = await loadDraft<{ form: { busNumber: string }; images: File[] }>("test");
    expect(draft?.data.form.busNumber).toBe("NB-1234");
    expect(draft?.data.images[0]?.name).toBe("fare.jpg");
    expect(draft?.savedAt).toBeGreaterThan(0);
    await clearDraft("test");
    expect(await loadDraft("test")).toBeUndefined();
  });
});
