import type { Metadata } from "next";
import ReportDetailsView from "@/views/admin/ReportDetailsView";

export const metadata: Metadata = { title: "Report" };

export default async function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportDetailsView id={id} />;
}
