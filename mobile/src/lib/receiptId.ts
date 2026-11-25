// Receipt IDs look like BW-2026-7KQ4MZ (api/src/utils/receipt-id.ts).
const RECEIPT_ID = /^BW-\d{4}-[A-Z0-9]{4,12}$/;

/** Tidies what a passenger typed or pasted: trims, upper-cases, drops inner spaces. */
export const normaliseReceiptId = (input: string): string =>
  input.trim().toUpperCase().replace(/\s+/g, "");

export const isReceiptId = (input: string): boolean => RECEIPT_ID.test(normaliseReceiptId(input));
