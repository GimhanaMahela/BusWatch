import type { Metadata } from "next";
import OperatorDashboardView from "@/views/operator/OperatorDashboardView";

export const metadata: Metadata = { title: "Your fleet" };

export default function OperatorDashboardPage() {
  return <OperatorDashboardView />;
}
