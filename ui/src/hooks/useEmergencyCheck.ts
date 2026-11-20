"use client";

import { useEffect, useRef, useState } from "react";
import { checkEmergency } from "@/api/assistantApi";
import { trackEvent } from "@/api/metricsApi";
import type { Language } from "@/constants/reportConstants";
import { detectEmergency, type EmergencyKind } from "@/lib/emergency";

/** Wait this long after the passenger stops typing before asking the AI */
const AI_DELAY_MS = 1500;
/** Too little text to judge; the keywords still run on anything */
const AI_MIN_LENGTH = 25;

/**
 * Emergency shortcut: watches what the passenger types and returns the kind of emergency it
 * describes, if any. Keywords answer instantly (offline too); the AI, when the API has it, checks
 * once typing pauses. Once shown, the warning stays until the passenger dismisses it: editing a
 * word shouldn't make the call buttons vanish.
 */
export default function useEmergencyCheck(text: string, language: Language, enabled = true) {
  const [aiKind, setAiKind] = useState<EmergencyKind | null>(null);
  const [shown, setShown] = useState<EmergencyKind | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const counted = useRef(false);
  const asked = useRef(new Set<string>());

  const keywordKind = enabled ? detectEmergency(text) : null;

  useEffect(() => {
    const trimmed = text.trim();
    if (!enabled || trimmed.length < AI_MIN_LENGTH || asked.current.has(trimmed)) return;
    const timer = setTimeout(() => {
      asked.current.add(trimmed);
      checkEmergency(trimmed, language)
        .then((result) => {
          if (result.emergency) setAiKind(result.kind ?? "danger");
        })
        // Best effort: the keywords still work, and the passenger is never blocked
        .catch(() => undefined);
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, language, enabled]);

  // Sticky: the first detection wins until dismissed
  const detected = keywordKind ?? aiKind;
  if (detected && !shown) setShown(detected);
  const kind = dismissed ? null : (shown ?? detected);

  useEffect(() => {
    if (kind && !counted.current) {
      counted.current = true;
      trackEvent("emergency_shown");
    }
  }, [kind]);

  return { kind, dismiss: () => setDismissed(true) };
}
