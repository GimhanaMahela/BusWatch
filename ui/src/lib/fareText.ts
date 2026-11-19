import type { FareStop } from "@/types/fare";

// Admins paste fares and stops as plain text (from the NTC fare list or a spreadsheet). These turn
// that text into data and back, with a message pointing at the first line that doesn't make sense.

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line, i) => ({ line: line.trim(), number: i + 1 }))
    .filter(({ line }) => line !== "");

/**
 * One fare per line, starting with the one-stage (minimum) fare. A line may also be
 * "stage, fare" or "stage<tab>fare" as copied from a table; the stage numbers must then run 1, 2, 3…
 */
export const parseFares = (text: string): Parsed<number[]> => {
  const fares: number[] = [];
  for (const { line, number } of lines(text)) {
    const parts = line.split(/[\t,;]+|\s{2,}/).map((p) => p.trim().replace(/^rs\.?\s*/i, ""));
    const [first, second] = parts;
    const fareText = parts.length >= 2 ? second : first;
    if (parts.length >= 2 && Number(first) !== fares.length + 1) {
      return { ok: false, error: `Line ${number}: expected stage ${fares.length + 1}.` };
    }
    const fare = Number(fareText);
    if (!Number.isInteger(fare) || fare < 1) {
      return { ok: false, error: `Line ${number}: "${line}" is not a fare in whole rupees.` };
    }
    if (fares.length && fare < (fares.at(-1) ?? 0)) {
      return { ok: false, error: `Line ${number}: a fare can't be lower than the stage before.` };
    }
    fares.push(fare);
  }
  if (!fares.length) return { ok: false, error: "Enter at least the minimum fare." };
  return { ok: true, value: fares };
};

export const formatFares = (fares: number[]) =>
  fares.map((fare, i) => `${i + 1}, ${fare}`).join("\n");

/** One stop per line, in order along the route: "fare stage, stop name". */
export const parseStops = (text: string): Parsed<FareStop[]> => {
  const stops: FareStop[] = [];
  for (const { line, number } of lines(text)) {
    const match = /^(\d+)\s*[,\t;:-]\s*(.+)$/.exec(line);
    if (!match) {
      return { ok: false, error: `Line ${number}: use "stage, stop name", e.g. "3, Kadawatha".` };
    }
    stops.push({ stage: Number(match[1]), name: match[2]!.trim() });
  }
  if (stops.length < 2) return { ok: false, error: "A route needs at least two stops." };
  return { ok: true, value: stops };
};

export const formatStops = (stops: FareStop[]) =>
  stops.map((stop) => `${stop.stage}, ${stop.name}`).join("\n");
