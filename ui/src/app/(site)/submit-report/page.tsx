import type { Metadata } from "next";
import SubmitReportView from "@/views/public/SubmitReportView";

export const metadata: Metadata = {
  title: "Report an incident",
  description:
    "Report a bus incident with photos, video and a map pin. You get a receipt ID to track it.",
};

export default function SubmitReportPage() {
  return <SubmitReportView />;
}
