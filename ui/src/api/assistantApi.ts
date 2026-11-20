import apiClient, { call } from "@/api/apiClient";
import type { Language } from "@/constants/reportConstants";
import type { AssistantReply } from "@/types/assistant";

/** Whether the TransitX helper chat is switched on */
export const getAssistantStatus = () =>
  call<{ enabled: boolean }>(apiClient.get("/assistant/status"));

/** The helper's answer to the conversation so far (ending with the passenger's message) */
export const sendChat = (
  messages: { role: "user" | "assistant"; text: string }[],
  language: Language,
) => call<AssistantReply>(apiClient.post("/assistant/chat", { messages, language }));

export type EmergencyKind = "violence" | "medical" | "fire" | "accident" | "danger";

/** Emergency shortcut: does this sound like someone needs help now? (`checked` is false without AI) */
export const checkEmergency = (text: string, language: Language) =>
  call<{ checked: boolean; emergency: boolean; kind: EmergencyKind | null }>(
    apiClient.post("/assistant/emergency", { text, language }),
  );
