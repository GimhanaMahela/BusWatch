import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchPublic, PublicDataError } from "@/lib/serverApi";
import type { PublicImpact } from "@/types/public";
import ImpactView from "@/views/public/ImpactView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("impactTitle"), description: t("impactDescription") };
}

/** The figures are cached for five minutes (see fetchPublic), like the API's own cache. */
export default async function ImpactPage() {
  let impact: PublicImpact | null = null;
  try {
    impact = await fetchPublic<PublicImpact>("/public/stats");
  } catch (error) {
    if (!(error instanceof PublicDataError)) throw error;
    console.error("Impact figures unavailable:", error.message);
  }
  return <ImpactView impact={impact} />;
}
