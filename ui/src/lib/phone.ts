// Mobile numbers as the API stores them (E.164, e.g. +94771234567). Keep in step with
// api/src/utils/phone.ts, which has the final say.

/**
 * Sri Lankan mobiles in any common form (0771234567, 771234567, +94 77 123 4567) and other
 * international numbers written with "+". Returns null when it is not a usable mobile number.
 */
export const normalisePhone = (input: string): string | null => {
  const compact = input.trim().replace(/[\s\-().]/g, "");
  if (!compact) return null;
  if (compact.startsWith("+")) {
    const digits = compact.slice(1);
    if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
    if (digits.startsWith("94") && !/^947\d{8}$/.test(digits)) return null;
    return `+${digits}`;
  }
  const local = compact
    .replace(/^0094/, "")
    .replace(/^94(?=7\d{8}$)/, "")
    .replace(/^0/, "");
  return /^7\d{8}$/.test(local) ? `+94${local}` : null;
};
