// The QR sticker inside each bus holds a short link: https://<site>/r/NB-1234 (optionally
// ?route=08). Scanned text is untrusted, so it is checked the same way the website checks it
// (ui/src/lib/busNumber.ts).

const BUS_NUMBER = /^[A-Z0-9][A-Z0-9 -]{0,19}$/;

/** A clean bus number, or "" when the value isn't one. */
export const parseBusNumber = (value: string | null | undefined): string => {
  const cleaned = (value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  return BUS_NUMBER.test(cleaned) ? cleaned : "";
};

/** Route numbers are free text ("08", "Colombo–Matale"); keep them short and printable. */
export const parseRoute = (value: string | null | undefined): string =>
  (value ?? "")
    .replace(/[\p{Cc}<>]/gu, "")
    .trim()
    .slice(0, 60);

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/** The bus (and route) a TransitX sticker points at, or null for any other code. */
export const parseBusSticker = (text: string): { bus: string; route: string } | null => {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const match = /^\/r\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return null;
  const bus = parseBusNumber(safeDecode(match[1]));
  if (!bus) return null;
  return { bus, route: parseRoute(url.searchParams.get("route")) };
};
