// Phone numbers are stored in E.164 form (+94771234567) so "My reports" can match them however
// the passenger typed them. Keep in step with ui/src/lib/phone.ts.

/**
 * Normalises a mobile number: Sri Lankan numbers in any common form (0771234567, 771234567,
 * 94771234567, +94 77 123 4567) and other international numbers written with a leading "+".
 * Returns null when it is not a usable mobile number.
 */
export const normalisePhone = (input: string): string | null => {
  const compact = input.trim().replace(/[\s\-().]/g, "");
  if (!compact) return null;

  if (compact.startsWith("+")) {
    const digits = compact.slice(1);
    if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
    // Sri Lankan numbers must still be mobiles (they are the ones that receive SMS)
    if (digits.startsWith("94") && !/^947\d{8}$/.test(digits)) return null;
    return `+${digits}`;
  }
  const local = compact
    .replace(/^0094/, "")
    .replace(/^94(?=7\d{8}$)/, "")
    .replace(/^0/, "");
  return /^7\d{8}$/.test(local) ? `+94${local}` : null;
};

/** "+9477***4567": enough for a passenger to recognise their number, not to read it out. */
export const maskPhone = (phone: string) => `${phone.slice(0, -7)}***${phone.slice(-4)}`;

/** "ka***@gmail.com" */
export const maskEmail = (email: string) => {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
};
