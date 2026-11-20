// Keeps the outbox moving: reports saved offline are sent as soon as the phone is back online or
// the app returns to the foreground. With Turnstile on, each send needs a fresh token from the
// widget, so sending waits for the passenger on the outbox screen instead.
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";

import { TURNSTILE_SITE_KEY } from "@/api/client";

import { sendQueued } from "./outboxSend";
import {
  enqueueReport,
  listQueuedReports,
  listSentReports,
  recordSentReport,
  removeQueuedReport,
  type QueuedReport,
  type SentReport,
} from "./outboxStore";
import type { ReportDraft } from "./reportDraft";

export type OutboxNotice =
  { kind: "sent"; receiptId: string } | { kind: "failed"; message: string };

interface Outbox {
  /** False only when the phone knows it has no connection */
  online: boolean;
  queued: QueuedReport[];
  sent: SentReport[];
  notice: OutboxNotice | null;
  sending: boolean;
  /** True when every send needs a security-check token */
  needsToken: boolean;
  enqueue: (draft: ReportDraft, language: string) => Promise<void>;
  recordSent: (receiptId: string) => Promise<void>;
  /** Sends what it can: everything, or just the oldest report when a token is needed */
  flush: (token?: string | null) => Promise<void>;
  dismissNotice: () => void;
}

const OutboxContext = createContext<Outbox | null>(null);

const needsToken = TURNSTILE_SITE_KEY !== "";

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { isConnected } = useNetInfo();
  const online = isConnected !== false;
  const [queued, setQueued] = useState<QueuedReport[]>([]);
  const [sent, setSent] = useState<SentReport[]>([]);
  const [notice, setNotice] = useState<OutboxNotice | null>(null);
  const [sending, setSending] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    const [nextQueued, nextSent] = await Promise.all([listQueuedReports(), listSentReports()]);
    setQueued(nextQueued);
    setSent(nextSent);
  }, []);

  const flush = useCallback(
    async (token: string | null = null) => {
      if (busy.current) return; // one sender at a time, so a report can't go twice
      if (needsToken && !token) return;
      busy.current = true;
      try {
        if ((await NetInfo.fetch()).isConnected === false) return;
        const reports = await listQueuedReports();
        if (reports.length === 0) return;
        setSending(true);
        for (const report of needsToken ? reports.slice(0, 1) : reports) {
          const outcome = await sendQueued(report, token);
          if (outcome.kind === "kept") break;
          await removeQueuedReport(report);
          if (outcome.kind === "sent") {
            await recordSentReport(outcome.receiptId);
            setNotice({ kind: "sent", receiptId: outcome.receiptId });
          } else {
            setNotice({ kind: "failed", message: outcome.message });
          }
        }
      } finally {
        busy.current = false;
        setSending(false);
        await refresh();
      }
    },
    [refresh],
  );

  // Load on start, then send whenever the connection returns or the app comes back
  useEffect(() => {
    void Promise.all([listQueuedReports(), listSentReports()])
      .then(([initialQueued, initialSent]) => {
        setQueued(initialQueued);
        setSent(initialSent);
      })
      .then(() => flush());
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void flush();
    });
    return () => appState.remove();
  }, [flush]);

  useEffect(() => {
    if (online) void flush();
  }, [online, flush]);

  const enqueue = useCallback(
    async (draft: ReportDraft, language: string) => {
      await enqueueReport(draft, language);
      await refresh();
    },
    [refresh],
  );

  const recordSent = useCallback(
    async (receiptId: string) => {
      await recordSentReport(receiptId);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<Outbox>(
    () => ({
      online,
      queued,
      sent,
      notice,
      sending,
      needsToken,
      enqueue,
      recordSent,
      flush,
      dismissNotice: () => setNotice(null),
    }),
    [online, queued, sent, notice, sending, enqueue, recordSent, flush],
  );
  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
}

export const useOutbox = (): Outbox => {
  const context = useContext(OutboxContext);
  if (!context) throw new Error("useOutbox must be used inside OutboxProvider");
  return context;
};
