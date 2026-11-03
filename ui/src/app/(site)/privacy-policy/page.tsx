import type { Metadata } from "next";
import PrivacyPolicyView from "@/views/public/PrivacyPolicyView";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyView />;
}
