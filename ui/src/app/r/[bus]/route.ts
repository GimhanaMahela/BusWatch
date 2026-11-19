import { NextResponse, type NextRequest } from "next/server";
import { busQuery, parseBusNumber, parseRoute } from "@/lib/busNumber";

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Short link printed as a QR code on the sticker inside each bus: /r/NB-1234 opens the report
 * form with the bus number filled in and marks the report as coming from a QR code.
 * A temporary redirect, so the destination can change without reprinting stickers.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ bus: string }> }) {
  const busNumber = parseBusNumber(safeDecode((await params).bus));
  const route = parseRoute(request.nextUrl.searchParams.get("route"));
  const target = busNumber ? `/submit-report${busQuery(busNumber, route, "qr")}` : "/submit-report";
  return NextResponse.redirect(new URL(target, request.url), 307);
}
