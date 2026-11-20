import { z } from "zod";
import type { Language } from "../config/constants.js";
import { generate, isAiConfigured } from "./ai.service.js";

// Emergency shortcut: while a passenger describes what happened, ask the AI whether someone may
// need the police, an ambulance or the fire service right now. The browser has its own keyword
// check that works without this; the AI catches what keywords miss (Singlish, misspellings).

export const EMERGENCY_KINDS = ["violence", "medical", "fire", "accident", "danger"] as const;
export type EmergencyKind = (typeof EMERGENCY_KINDS)[number];

const resultSchema = z.object({
  emergency: z
    .boolean()
    .describe("True only if someone may need police, ambulance or fire service help now"),
  kind: z.enum(EMERGENCY_KINDS).nullable(),
});

const SYSTEM = `You screen messages from bus passengers in Sri Lanka, written in English, Sinhala or Tamil (sometimes transliterated). Decide whether the passenger describes an emergency happening now or just now, where someone may need the police, an ambulance or the fire service: a crash with injuries, an assault or attack, a weapon, someone collapsed or badly hurt, a fire, or someone in immediate danger (for example being followed or held against their will).
Ordinary complaints are NOT emergencies: speeding without a crash, overcharging, rudeness, loud music, overcrowding, a skipped halt, harassment that has ended without injury. When unsure, answer false. Set kind to the best match when emergency is true, otherwise null.`;

export interface EmergencyCheck {
  /** False when AI help isn't set up: the browser's keyword check is all there is */
  checked: boolean;
  emergency: boolean;
  kind: EmergencyKind | null;
}

export const checkEmergency = async (text: string, language: Language): Promise<EmergencyCheck> => {
  if (!isAiConfigured()) return { checked: false, emergency: false, kind: null };
  const { data } = await generate(
    resultSchema,
    [{ text: `Site language: ${language}\n\nPassenger's message:\n"""${text}"""` }],
    SYSTEM,
    0,
  );
  return { checked: true, emergency: data.emergency, kind: data.emergency ? data.kind : null };
};
