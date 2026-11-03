import type { Metadata } from "next";
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
  return {
    title: receiptId ? `Report ${receiptId}` : "Track a report",
    description: "Check the status of a BusWatch report with its receipt ID.",
    // Tracking pages are personal; keep them out of search results
    robots: receiptId ? { index: false } : undefined,
  };
}

export default async function TrackReportPage({ params }: TrackPageProps) {
  return <TrackReportView receiptId={await receiptFrom(params)} />;
}
