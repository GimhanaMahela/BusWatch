import type { Metadata } from "next";
import AnalyticsView from "@/views/admin/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
