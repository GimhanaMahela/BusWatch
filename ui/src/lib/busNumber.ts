// Bus numbers arrive from QR stickers and short links (/r/NB-1234), so treat them as untrusted.
// Sri Lankan plates look like "NB-1234", "NE 4521" or "62-1234"; allow letters, digits,
// spaces and dashes, upper-cased, at most 20 characters (the API's limit).

const BUS_NUMBER = /^[A-Z0-9][A-Z0-9 -]{0,19}$/;

/** A clean bus number, or "" when the value isn't one. */
export const parseBusNumber = (value: string | null | undefined): string => {
  const cleaned = (value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  return BUS_NUMBER.test(cleaned) ? cleaned : "";
};

/** Route numbers are free text ("08", "Colombo–Matale"); just keep them short and printable. */
export const parseRoute = (value: string | null | undefined): string =>
  (value ?? "")
    .replace(/[\p{Cc}<>]/gu, "")
    .trim()
    .slice(0, 60);

/** Query string that pre-fills a form for a bus: "?bus=NB-1234&route=08&src=qr". */
export const busQuery = (bus: string, route = "", source?: "qr") => {
  const params = new URLSearchParams();
  if (bus) params.set("bus", bus);
  if (route) params.set("route", route);
  if (source) params.set("src", source);
  const query = params.toString();
  return query ? `?${query}` : "";
};

/** Path printed on the QR sticker for a bus: /r/NB-1234 (short, so the QR code stays simple). */
export const qrShortPath = (bus: string, route = "") =>
  `/r/${encodeURIComponent(bus)}${route ? `?route=${encodeURIComponent(route)}` : ""}`;

/** True the first time a bus's sticker is seen in this browser session (for the QR scan metric). */
export const isNewQrScan = (bus: string) => {
  try {
    const key = `buswatch:qr-scan:${bus}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage blocked: count it anyway
  }
  return true;
};
