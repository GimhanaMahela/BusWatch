import type { Metadata } from "next";
import TermsOfServiceView from "@/views/public/TermsOfServiceView";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsOfServicePage() {
  return <TermsOfServiceView />;
}
