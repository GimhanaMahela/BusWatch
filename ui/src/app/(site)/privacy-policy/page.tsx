import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PrivacyPolicyView from "@/views/public/PrivacyPolicyView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("privacyTitle") };
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyView />;
}
