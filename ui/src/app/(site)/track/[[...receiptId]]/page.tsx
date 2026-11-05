import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TrackReportView from "@/views/public/TrackReportView";

interface TrackPageProps {
  params: Promise<{ receiptId?: string[] }>;
}

const receiptFrom = async (params: TrackPageProps["params"]) => {
  const { receiptId } = await params;
  return receiptId?.[0] ? decodeURIComponent(receiptId[0]) : undefined;
};

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const receiptId = await receiptFrom(params);
  const t = await getTranslations("meta");
  const title = receiptId ? t("trackReportTitle", { receiptId }) : t("trackTitle");
  const description = t("trackDescription");
  return {
    title,
    description,
    // Tracking pages are personal; keep them out of search results
    robots: receiptId ? { index: false } : undefined,
    // A shared tracking link previews the report's current status (see app/og/track)
    openGraph: receiptId
      ? {
          title,
          description,
          images: [{ url: `/og/track/${encodeURIComponent(receiptId)}`, width: 1200, height: 630 }],
        }
      : undefined,
    twitter: receiptId
      ? { card: "summary_large_image", images: [`/og/track/${encodeURIComponent(receiptId)}`] }
      : undefined,
  };
}

export default async function TrackReportPage({ params }: TrackPageProps) {
  return <TrackReportView receiptId={await receiptFrom(params)} />;
}
