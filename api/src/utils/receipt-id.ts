import { randomBytes } from "node:crypto";

// No 0/O, 1/I/L so the ID is easy to read out or type from a receipt
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Short, human-friendly receipt ID such as "BW-2026-7KQ4MZ". */
export const generateReceiptId = (): string => {
  let suffix = "";
  for (const byte of randomBytes(6)) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }
  return `BW-${new Date().getFullYear()}-${suffix}`;
};
