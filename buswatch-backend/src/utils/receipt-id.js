const crypto = require("crypto");

// No 0/O, 1/I/L so the ID is easy to read out or type from a receipt
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// Generates a short, human-friendly receipt ID such as "BW-2026-7KQ4MZ"
module.exports = () => {
  const bytes = crypto.randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }
  return `BW-${new Date().getFullYear()}-${suffix}`;
};
