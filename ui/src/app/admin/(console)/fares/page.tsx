import type { Metadata } from "next";
import FaresView from "@/views/admin/FaresView";

export const metadata: Metadata = { title: "Fares" };

export default function FaresPage() {
  return <FaresView />;
}
