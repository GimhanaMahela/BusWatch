"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearDraft, loadDraft, saveDraft } from "@/lib/offlineStore";

const SAVE_DELAY_MS = 500;

interface UseFormDraftOptions<T> {
  /** IndexedDB key, one per form */
  key: string;
  /** Current form state (fields, files, step...) */
  value: T;
  /** Nothing worth keeping: removes the saved draft instead of saving */
  isEmpty: (value: T) => boolean;
  /** Called once on load with a saved draft; return false to ignore it */
  onRestore: (draft: T) => boolean;
}

/**
 * Keeps an unfinished form on the device (photos included) so a dropped signal, a closed tab or a
 * flat battery doesn't lose it. Saves shortly after each change and restores on the next visit.
 */
const useFormDraft = <T>({ key, value, isEmpty, onRestore }: UseFormDraftOptions<T>) => {
  const [loaded, setLoaded] = useState(false);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const restoreRef = useRef(onRestore);
  const isEmptyRef = useRef(isEmpty);
  useEffect(() => {
    restoreRef.current = onRestore;
    isEmptyRef.current = isEmpty;
  });

  // Load once before any autosave can overwrite the stored draft
  useEffect(() => {
    let cancelled = false;
    void loadDraft<T>(key).then((draft) => {
      if (cancelled) return;
      if (draft && !isEmptyRef.current(draft.data) && restoreRef.current(draft.data)) {
        setRestoredAt(draft.savedAt);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return undefined;
    const timer = setTimeout(() => {
      void (isEmptyRef.current(value) ? clearDraft(key) : saveDraft(key, value));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [key, value, loaded]);

  /** Forget the draft (after sending it, or when the passenger starts over). */
  const discard = useCallback(async () => {
    setRestoredAt(null);
    await clearDraft(key);
  }, [key]);

  return { restoredAt, discard, dismissNotice: () => setRestoredAt(null) };
};

export default useFormDraft;
