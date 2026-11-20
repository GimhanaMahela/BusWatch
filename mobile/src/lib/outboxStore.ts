// Reports saved on the phone while offline (the outbox), and the receipt IDs of reports sent from
// this phone (so Track can list them). Both live in a small SQLite database; a queued report's
// photos are copied into the app's documents folder, because the picker's cache can be cleared.
import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";

import type { Photo, ReportDraft } from "./reportDraft";

export interface QueuedReport {
  id: number;
  createdAt: string;
  language: string;
  draft: ReportDraft;
}

export interface SentReport {
  receiptId: string;
  sentAt: string;
}

let database: Promise<SQLite.SQLiteDatabase> | null = null;

const db = () => {
  database ??= SQLite.openDatabaseAsync("transitx.db").then(async (opened) => {
    await opened.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        language TEXT NOT NULL,
        draft TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sent_reports (
        receipt_id TEXT PRIMARY KEY NOT NULL,
        sent_at TEXT NOT NULL
      );
    `);
    return opened;
  });
  return database;
};

const photoFolder = () => {
  const folder = new Directory(Paths.document, "outbox");
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  return folder;
};

/** Copies a photo out of the picker's cache so it survives until the report is sent. */
const keepPhoto = (photo: Photo, index: number): Photo => {
  const target = new File(photoFolder(), `${Date.now()}-${index}-${photo.name}`);
  new File(photo.uri).copy(target);
  return { ...photo, uri: target.uri };
};

const deletePhotos = (photos: Photo[]) => {
  for (const photo of photos) {
    try {
      const file = new File(photo.uri);
      if (file.exists) file.delete();
    } catch {
      // already gone: nothing to clean up
    }
  }
};

export const enqueueReport = async (draft: ReportDraft, language: string): Promise<void> => {
  const kept = { ...draft, photos: draft.photos.map(keepPhoto) };
  await (
    await db()
  ).runAsync(
    "INSERT INTO outbox (created_at, language, draft) VALUES (?, ?, ?)",
    new Date().toISOString(),
    language,
    JSON.stringify(kept),
  );
};

export const listQueuedReports = async (): Promise<QueuedReport[]> => {
  const rows = await (
    await db()
  ).getAllAsync<{ id: number; created_at: string; language: string; draft: string }>(
    "SELECT id, created_at, language, draft FROM outbox ORDER BY id",
  );
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    language: row.language,
    draft: JSON.parse(row.draft) as ReportDraft,
  }));
};

/** Removes a queued report (sent, or rejected for good) and its copied photos. */
export const removeQueuedReport = async (report: QueuedReport): Promise<void> => {
  await (await db()).runAsync("DELETE FROM outbox WHERE id = ?", report.id);
  deletePhotos(report.draft.photos);
};

export const recordSentReport = async (receiptId: string): Promise<void> => {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO sent_reports (receipt_id, sent_at) VALUES (?, ?)",
    receiptId,
    new Date().toISOString(),
  );
};

export const listSentReports = async (limit = 20): Promise<SentReport[]> => {
  const rows = await (
    await db()
  ).getAllAsync<{ receipt_id: string; sent_at: string }>(
    "SELECT receipt_id, sent_at FROM sent_reports ORDER BY sent_at DESC LIMIT ?",
    limit,
  );
  return rows.map((row) => ({ receiptId: row.receipt_id, sentAt: row.sent_at }));
};
