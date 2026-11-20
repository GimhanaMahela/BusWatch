import type { NextRequest } from "next/server";
import { categoryLabel, statusLabel } from "@/constants/reportConstants";
import { renderOgCard } from "@/lib/ogImage";
import { activeTheme } from "@/theme/themes";
import type { PublicReport } from "@/types/report";

const STATUS_COLORS: Record<string, string> = {
  pending: "#B7791F",
  reviewed: "#0284C7",
  escalated: activeTheme.light.secondary.main,
  resolved: "#12A150",
  rejected: "#5B6478",
};

// Server-side calls go straight to the API (Docker sets API_UPSTREAM); otherwise use this site's /api
const apiBase = (request: NextRequest) =>
  `${(process.env.API_UPSTREAM || request.nextUrl.origin).replace(/\/$/, "")}/api`;

/**
 * Preview image for a shared tracking link: receipt ID, what it is about and its current status.
 * Shows only what the public tracking page shows; never media, email or notes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> },
) {
  const { receiptId } = await params;
  let report: PublicReport | null = null;
  try {
    const response = await fetch(
      `${apiBase(request)}/reports/track/${encodeURIComponent(receiptId)}`,
      {
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 300 },
      },
    );
    if (response.ok) report = (await response.json()) as PublicReport;
  } catch {
    // Fall through to the generic card
  }

  if (!report) {
    return renderOgCard({ eyebrow: "Track a report", title: "Where does my report stand?" });
  }
  const commendation = report.type === "commendation";
  const road = report.type === "road_incident";
  const response = renderOgCard({
    eyebrow: commendation ? "Driver commendation" : road ? "Road incident" : "Passenger report",
    title: report.receiptId,
    // Road incidents have no route (and the vehicle's plate is never shared)
    subtitle: road
      ? categoryLabel(report.category)
      : `${categoryLabel(report.category)} · Route ${report.routeNumber}`,
    badge: {
      text: statusLabel(report.status),
      color: STATUS_COLORS[report.status] ?? activeTheme.light.primary.main,
    },
  });
  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
  return response;
}
