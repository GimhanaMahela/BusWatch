// Resolved case stories are public, so they must be anonymised. This catches the obvious slips;
// the admin is still responsible for the wording.

const CHECKS: { label: string; pattern: RegExp }[] = [
  { label: "a receipt ID", pattern: /\bBW-\d{4}-[A-Z0-9]{6}\b/i },
  { label: "an email address", pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  // Sri Lankan mobile/landline numbers, with or without +94
  { label: "a phone number", pattern: /(?:\+94|\b0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/ },
  { label: "an exact time", pattern: /\b\d{1,2}[:.]\d{2}\s?(?:am|pm)?\b/i },
  { label: "a national ID number", pattern: /\b(?:\d{9}[VvXx]|\d{12})\b/ },
];

/** Names of the kinds of personal detail found in the text (empty when it looks clean). */
export const findPersonalDetails = (...texts: string[]) =>
  CHECKS.filter(({ pattern }) => texts.some((text) => pattern.test(text))).map((c) => c.label);
