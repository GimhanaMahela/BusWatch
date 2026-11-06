import type { Metadata } from "next";
import OperatorReportView from "@/views/operator/OperatorReportView";

export const metadata: Metadata = { title: "Report" };

export default async function OperatorReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OperatorReportView id={id} />;
}
