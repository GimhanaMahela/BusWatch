import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TermsOfServiceView from "@/views/public/TermsOfServiceView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("termsTitle") };
}

export default function TermsOfServicePage() {
  return <TermsOfServiceView />;
}
