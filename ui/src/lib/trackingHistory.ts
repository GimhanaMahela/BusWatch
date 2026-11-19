// Receipt IDs this device has submitted or looked up, newest first (localStorage, never sent
// anywhere). Used to list "your reports on this device" and to tell first visits to a tracking
// page from return visits for the success metrics.

const KEY = "buswatch:receipts";
const MAX_ENTRIES = 20;
/** Reloading within this window is the same visit, not a return */
const SAME_VISIT_MS = 30 * 60 * 1000;

export interface ReceiptEntry {
  receiptId: string;
  lastSeen: number;
}

const read = (): ReceiptEntry[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (e): e is ReceiptEntry =>
            typeof e?.receiptId === "string" && typeof e?.lastSeen === "number",
        )
      : [];
  } catch {
    return [];
  }
};

const write = (entries: ReceiptEntry[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage full or blocked: history is a convenience only
  }
};

const normalise = (receiptId: string) => receiptId.trim().toUpperCase();

/** Remembers a receipt this device just submitted. */
export const rememberReceipt = (receiptId: string, now = Date.now()) => {
  const id = normalise(receiptId);
  write([{ receiptId: id, lastSeen: now }, ...read().filter((e) => e.receiptId !== id)]);
};

/**
 * Records a tracking page visit. `counted` is false for reloads within the same visit;
 * `returning` is true when this device had seen the receipt before.
 */
export const recordTrackingVisit = (receiptId: string, now = Date.now()) => {
  const id = normalise(receiptId);
  const previous = read().find((e) => e.receiptId === id);
  rememberReceipt(id, now);
  const counted = !previous || now - previous.lastSeen > SAME_VISIT_MS;
  return { counted, returning: counted && Boolean(previous) };
};

export const recentReceipts = (): string[] => read().map((e) => e.receiptId);
