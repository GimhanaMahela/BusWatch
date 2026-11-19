import type { SubmitReportFields } from "@/types/report";

// Passengers often report from a moving bus with a weak signal. Unfinished forms ("drafts") and
// reports waiting for a connection ("outbox") live in IndexedDB, which can hold the photo and video
// files too. Every function fails soft: without IndexedDB (private mode, old browsers) the form
// simply works online-only.

const DB_NAME = "buswatch";
const DB_VERSION = 1;
const DRAFTS = "drafts";
const OUTBOX = "outbox";

/** Fired on window whenever the outbox changes, so the UI can refresh its count or flush it. */
export const OUTBOX_EVENT = "buswatch:outbox-changed";

/** An unfinished form: whatever the form needs to restore itself, and when it was saved. */
export interface StoredDraft<T> {
  data: T;
  savedAt: number;
}

export interface QueuedReport {
  id?: number;
  fields: SubmitReportFields;
  images: File[];
  videos: File[];
  queuedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = () => {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS);
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB"));
  }).catch((error: unknown) => {
    dbPromise = null; // allow a retry later
    throw error;
  });
  return dbPromise;
};

/** Runs one request in its own transaction and resolves with its result. */
const run = async <T>(
  store: string,
  mode: IDBTransactionMode,
  operation: (objectStore: IDBObjectStore) => IDBRequest,
): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = operation(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result as T);
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
};

const soft = async <T>(work: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await work();
  } catch {
    return fallback;
  }
};

const notifyOutbox = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OUTBOX_EVENT));
};

// ---------------------------------------------------------------- Drafts

export const saveDraft = <T>(key: string, data: T) =>
  soft(
    () =>
      run<IDBValidKey>(DRAFTS, "readwrite", (s) =>
        s.put({ data, savedAt: Date.now() } satisfies StoredDraft<T>, key),
      ).then(() => true),
    false,
  );

export const loadDraft = <T>(key: string) =>
  soft(() => run<StoredDraft<T> | undefined>(DRAFTS, "readonly", (s) => s.get(key)), undefined);

export const clearDraft = (key: string) =>
  soft(() => run<undefined>(DRAFTS, "readwrite", (s) => s.delete(key)).then(() => true), false);

// ---------------------------------------------------------------- Outbox

/** Keeps a report to send later. Returns false when it could not be stored. */
export const enqueueReport = async (report: Omit<QueuedReport, "id" | "queuedAt">) => {
  const stored = await soft(
    () =>
      run<IDBValidKey>(OUTBOX, "readwrite", (s) => s.add({ ...report, queuedAt: Date.now() })).then(
        () => true,
      ),
    false,
  );
  if (stored) notifyOutbox();
  return stored;
};

export const listQueuedReports = () =>
  soft(() => run<QueuedReport[]>(OUTBOX, "readonly", (s) => s.getAll()), []);

export const removeQueuedReport = async (id: number) => {
  await soft(() => run<undefined>(OUTBOX, "readwrite", (s) => s.delete(id)), undefined);
  notifyOutbox();
};
